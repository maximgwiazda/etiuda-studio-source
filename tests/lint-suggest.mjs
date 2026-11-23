/* THE LINT LIST'S FOURTH KIND, A SUGGESTION (board 814, step 11, S3e).
 *
 *     node tests/lint-suggest.mjs [--keep]
 *
 * A likely commitment and a path that ends become rows of Studio's lint list, in the copywriter's words
 * (state/drafts/copy-chains-lint-2026-10-04.md, L1 to L7). What src/studio.mjs's findings() answers at the open, a save, a
 * dismissal and the publish plan; that the engine's errors and warnings are counted exactly as before; that a publish
 * with suggestions and no errors asks for no note; and the list, the rail and the publish cover as
 * tests/page-stand-in.mjs paints them, in English and whole in Polish. Markup and files only: the look is Maxim's.
 * Section 6: a finding left as it is (the review door's "Leave as it is", project.json's findingsLeft), with its plants.
 */
import "./licensed-env.mjs";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as S from "../src/studio.mjs";
import { clearScratch, dropScratch } from "./scratch.mjs";
import { loadPage } from "./page-stand-in.mjs";
import { DRAFT_FILE, json } from "../src/publish.mjs";
import * as Engine from "../src/engine.mjs";
import crypto from "node:crypto";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const SCRATCH = path.join(ROOT, "scratch", "lint-suggest");
const EXPECTED = 43;

let asserted = 0, failed = 0;
function check(cond, line) {
  asserted++;
  if (cond) process.stdout.write("  ok   " + line + "\n");
  else { failed++; process.stderr.write("  FAIL " + line + "\n"); }
}
const read = (...p) => fs.readFileSync(path.join(ROOT, ...p), "utf8");
const sha = (p) => crypto.createHash("sha256").update(fs.readFileSync(p)).digest("hex");
const wire = (p) => Promise.resolve(p)
  .then(v => JSON.parse(JSON.stringify(Object.assign({ error: null }, v))))
  .catch(e => ({ error: e && e.message ? e.message : String(e), said: (e && e.said) || null }));

/* The words are this file's own, written for it: a promise, a second promise, and a reply that promises nothing. */
const PROMISE_EN = "Thank you for waiting. We will send you a replacement today.";
const PROMISE_EN_2 = "We will refund the full amount by Friday.";
const PLAIN_EN = "Thank you for writing. Have a lovely day.";

const KINDS = ["later", "dated", "waived", "wording", "condition", "done"];
const NB = new RegExp(String.fromCharCode(160), "g");
const sugs = (lint) => ((lint && lint.rows) || []).filter(r => r.severity === "suggestion");
const sugFor = (lint, id, kind) => sugs(lint).find(r => r.card === id && r.kind === kind) || null;
const counts = (lint) => [lint.errors, lint.warnings, lint.awaiting].join(",");

async function main(argv) {
  clearScratch(SCRATCH);
  const root = path.join(SCRATCH, "projects");
  fs.mkdirSync(root, { recursive: true });
  const made = await S.newProject(root, "Lint suggest", [{ code: "en", name: "English" }, { code: "pl", name: "Polish" }]);
  const dir = made.dir;
  const shelf = ((await S.addTag(dir, "shelf", { en: "General", pl: "Ogolne" })).tag).id;
  const id = {};
  /* A links to C; B links to A, C and R, so A is both linked to and linking; P promises; Q is plain and on no path; R is retired, promises and is linked to. */
  for (const [k, body] of [["a", PLAIN_EN], ["b", PLAIN_EN], ["c", PLAIN_EN], ["p", PROMISE_EN], ["q", PLAIN_EN],
    ["r", PROMISE_EN_2]]) {
    id[k] = (await S.addCard(dir, shelf, "Card " + k.toUpperCase(), body)).card.id;
  }
  await S.saveCard(dir, id.a, { next: [id.c] });
  await S.saveCard(dir, id.b, { next: [id.a, id.c, id.r] });
  await S.retireCard(dir, id.r);
  /* D repeats Q's title in Q's category, which the pinned linter reports, so the counts the controls hold are not zeros;
     it is deleted before the publish, which a lint error would otherwise stop without a note. */
  id.d = (await S.addCard(dir, shelf, "Card Q", PLAIN_EN)).card.id;

  try {
    /* ---- 1. WHAT findings() ANSWERS -------------------------------------------------------------- */

    let open = await S.openProject(dir);
    const pRow = sugFor(open.lint, id.p, "commitment");
    check(pRow && pRow.phrase === "We will send you a replacement today" && pRow.phrase === open.likely[id.p].phrase
          && pRow.ruleKind === open.likely[id.p].kind && pRow.rule === open.likely[id.p].rule && pRow.lang === "en"
          && pRow.where === "Card P" && pRow.go && pRow.go.section === "cards" && pRow.go.id === id.p
          && pRow.go.field === "commits" && pRow.go.lang === "en",
      "ls1a a likely commitment is a suggestion row naming its card, the words found, their rule and language, and the"
      + " tick as where Jump lands: " + JSON.stringify(pRow));
    const cRow = sugFor(open.lint, id.c, "ends");
    check(cRow && JSON.stringify(cRow.from) === JSON.stringify(["Card A", "Card B"]) && cRow.where === "Card C"
          && cRow.go && cRow.go.field === "next" && cRow.go.id === id.c,
      "ls1b a card two cards link to and that links to none is a path-end row, with both cards before it, in file order: "
      + JSON.stringify(cRow));
    check(sugs(open.lint).map(r => r.card + ":" + r.kind).join(",") === id.c + ":ends," + id.p + ":commitment"
          && open.lint.suggestions === 1 && open.lint.ends === 1,
      "ls1c CONTROL: no other card has one, neither the cards that link (B, and A, which B links to), the plain card on no path (Q) nor the"
      + " retired card (R), which promises and is linked to: " + sugs(open.lint).map(r => r.where + ":" + r.kind).join(","));
    check(open.lint.errors + open.lint.warnings > 0
          && open.lint.errors === open.lint.rows.filter(r => r.severity === "error").length
          && open.lint.warnings === open.lint.rows.filter(r => r.severity === "warning").length
          && open.lint.awaiting === open.lint.rows.filter(r => r.severity === "awaiting").length,
      "ls1d each count is its own kind's rows, so a suggestion counts in neither errors nor warnings: " + counts(open.lint));
    const withSugs = counts(open.lint);
    await S.saveCard(dir, id.p, { commits: true });
    await S.saveCard(dir, id.c, { next: [id.q] });
    await S.saveCard(dir, id.q, { next: [id.a] });
    let quiet = await S.openProject(dir);
    check(counts(quiet.lint) === withSugs && quiet.lint.suggestions === 0,
      "ls1e CONTROL: with every suggestion answered (P ticked, C and Q linking on), the errors, warnings and awaiting"
      + " counts are what they were with two suggestions present: " + counts(quiet.lint) + " against " + withSugs);
    await S.saveCard(dir, id.c, { next: [] });
    await S.saveCard(dir, id.q, { next: [] });
    let r = await S.saveCard(dir, id.p, { commits: false });
    check(sugFor(r.lint, id.p, "commitment") && sugFor(r.lint, id.c, "ends") && !sugFor(r.lint, id.q, "ends"),
      "ls1f the tick taken off brings the row back in the save's own answer, as an emptied list brings back C's");
    const dis = await S.dismissLikely(dir, id.p, pRow.phrase);
    open = await S.openProject(dir);
    check(dis.lint && !sugFor(dis.lint, id.p, "commitment") && sugFor(dis.lint, id.c, "ends")
          && !sugFor(open.lint, id.p, "commitment") && open.lint.suggestions === 0 && open.lint.ends === 1,
      "ls1g a dismissal answers the lint without the dismissed card's row, and the next open agrees");
    /* A remembered dismissal is proved only by an unrelated act between the remembering and the read: every later read
       of P comes after P's words change, so without this one the four other callers of findings() could forget it unseen.
       C's path-end row in each answer is the control that the list was read at all. publishPlan only reads; with D
       present it answers one error and writes nothing. */
    const after = [["saveCard", (await S.saveCard(dir, id.q, { body: { en: PLAIN_EN + " Again." } })).lint],
      ["addTag", (await S.addTag(dir, "shelf", { en: "Second", pl: "Drugi" })).lint],
      ["lintProject", await S.lintProject(dir)],
      ["publishPlan", (await S.publishPlan(dir, {})).lint]];
    const forgot = after.filter(([, l]) => !sugFor(l, id.c, "ends") || sugFor(l, id.p, "commitment")).map(([k]) => k);
    check(forgot.length === 0,
      "ls1g2 an unrelated save, a tag added, a lint run and a publish plan all keep the dismissal: " + forgot.join(","));
    r = await S.saveCard(dir, id.p, { body: { en: PROMISE_EN_2 } });
    const back = sugFor(r.lint, id.p, "commitment");
    check(back && back.phrase === "We will refund the full amount by Friday" && KINDS.indexOf(back.ruleKind) >= 0,
      "ls1h changed words bring the row back with the new words: " + JSON.stringify(back && [back.phrase, back.rule, back.ruleKind]));

    /* ---- 2. PUBLISHING ---------------------------------------------------------------------------- */

    await S.deleteCard(dir, id.d);

    const share = path.join(SCRATCH, "share");
    const lic = {};
    const plan = await S.publishPlan(dir, lic);
    check(plan.lint.suggestions === 1 && plan.lint.ends === 1 && plan.lint.errors === 0,
      "ls2a the publish plan counts the suggestions beside no errors: " + JSON.stringify([plan.lint.errors,
        plan.lint.warnings, plan.lint.suggestions]));
    let pub = null, why = "";
    try { pub = await S.publishProject(dir, { folder: share, notes: "with suggestions" }); }
    catch (e) { why = e && e.message; }
    check(pub && pub.ec && fs.existsSync(pub.ec),
      "ls2b a publish with suggestions and no errors goes out with no note asked for: " + (pub ? path.basename(pub.ec) : why));

    /* ---- 3. THE PAGE ------------------------------------------------------------------------------ */

    const calls = [];
    const api = {};
    for (const k of ["saveCard", "dismissLikely"])
      api[k] = (...a) => { calls.push([k, a.slice(1)]); return wire(S[k](...a)); };
    const home = loadPage({ api, uiLang: "en" });
    const P = home.page;
    open = await wire(S.openProject(dir));
    /* MOVED (board 1016, item 8): old, the One list showed the commitment rows; new, they are one line "Promise suggestions: N" until it is opened, so these legs open it (lsugOpen) and read the rows as before; tests/checks-promise-line.mjs holds the line. */
    /* One list: the table these legs read, which the page opened on until By kind (board 862, tests/vision-gamma.mjs 3). */
    Object.assign(P.S, { open, screen: "project", section: "lint", lfilter: "all", lang: "en", sel: null, lintAs: "list", lsugOpen: true });
    P.paintLint();
    let html = home.node("#main").innerHTML;
    /* a row is a finding's object since board 901, so its tag carries the marks: the rows are read whatever it carries */
    const trs = [...html.matchAll(/<tr(?: [^>]*)?>(.*?)<\/tr>/g)].map(m => m[1]);
    const rowOf = (title) => trs.filter(t => t.indexOf("<td>" + title + "</td>") >= 0);
    const pTr = rowOf("Card P").find(t => /chip note/.test(t)) || "";
    const cTr = rowOf("Card C").find(t => /chip note/.test(t)) || "";
    check(/<span class="chip note">Suggestion<\/span>/.test(pTr)
          && /<td class="t-title">“We will refund the full amount by Friday” reads like a commitment<\/td>/.test(pTr)
          && /<td class="wide-only">recognised by: [a-z ]+<\/td>/.test(pTr) && pTr.indexOf("recognised by: P") < 0
          && /data-act="jump"[^>]*data-fld="commits"/.test(pTr),
      "ls3a the commitment's row: the Suggestion pill, the words found (L1), the rule's short name (L4), Jump to the tick: "
      + (/<td class="wide-only">([^<]*)</.exec(pTr) || [])[1]);
    check(/<td class="t-title">terminus: nothing comes next on the path<\/td>/.test(cTr)
          && /<td class="wide-only">before it on the path: Card A, Card B<\/td>/.test(cTr)
          && /data-act="jump"[^>]*data-fld="next"/.test(cTr),
      "ls3b the path's end: L2, then the cards before it (L5), and Jump to the Next field");
    P.S.lfilter = "suggestions"; P.paintLint();
    const only = [...home.node("#main").innerHTML.matchAll(/<span class="chip ([a-z]+)">/g)].map(m => m[1]);
    P.S.lfilter = "warnings"; P.paintLint();
    const noSug = home.node("#main").innerHTML.indexOf("chip note") < 0;
    check(only.length === 3 && only.every(k => k === "note") && noSug,
      "ls3d the Suggestions filter shows the promise line and the two rows and only them (old: the two rows; the line is board 1016 item 8); the Warnings filter shows neither: " + only.join(","));
    P.paintRail();
    const num = (/data-v="lint"[^>]*>[^]*?<span class="num">(\d+)<\/span>/.exec(home.node("#rail").innerHTML) || [])[1];
    /* a path's end is listed and not counted (paths-terminus-noise, the Studio batch of 2026-10-12) */
    check(+num === open.lint.errors + open.lint.warnings + open.lint.awaiting + 1 && open.lint.ends === 1,
      "ls3e the rail counts the rows that ask for a decision, the likely commitment among them and the path's end not: " + num);
    P.S.plan = await wire(S.publishPlan(dir, lic));
    P.S.cover = "publish";
    const cover = P.coverHtml();
    check(/1 suggestion/.test(cover.replace(NB, " ")) && cover.indexOf('id="override"') < 0,
      "ls3f the publish cover counts the suggestions and asks for no note: "
      + ((/<span class="t">([^<]*)</.exec(cover) || [])[1] || "").replace(NB, " "));
    const ticked = Object.assign({}, P.S.plan, { lint: Object.assign({}, P.S.plan.lint, { suggestions: 0 }) });
    P.S.plan = ticked;
    /* the press's lint gate: its title is the line (the Publishing window, 2026-10-08) */
    check(/<span class="t">0 errors, 0 warnings<\/span>/.test(P.coverHtml().replace(NB, " ")),
      "ls3g CONTROL: with none, the cover's line is the two counts it always was");
    /* every non-retired card: the editor's "path ends" line and the list's row agree */
    const disagree = P.S.open.draft.cards.filter(c => !c.retired)
      .filter(c => /class="cn-end"/.test(P.nextHtml(c)) !== !!sugFor(P.S.open.lint, c.id, "ends")).map(c => c.id);
    check(disagree.length === 0,
      "ls3h the editor's line under Next cards and the list's path-end row are shown for the same cards: " + disagree.join(","));
    P.S.section = "cards"; P.S.sel = id.p;
    await P.ACTS["commits-dismiss"]();
    check(calls.some(x => x[0] === "dismissLikely") && !sugFor(P.S.open.lint, id.p, "commitment")
          && P.S.open.lint.suggestions === 0,
      "ls3i Dismiss in the editor takes the card's row out of the page's lint at once, not at the next save");

    /* THE CARDS LEDE COUNTS ERRORS AND WARNINGS, NOT THE OTHER TWO (board 867, the test architect's read of bad-day 6a): the
       rail counts all four kinds, and the window's leg holds the lede to what it leaves out; a starter has no errors or
       warnings, so only here, with 2 errors, 1 warning, 4 awaiting and 8 suggestions, does a lede that always says 0 differ
       from the right 3, a lede that counts awaiting too from 7, and one that counts suggestions as well from 15; every subset
       of the four kinds sums to its own number, so only errors and warnings make 3 (the test architect phi's named edit). The counts line is
       read where the page puts it after a save (touchRail), by its own mark, as well as from the sentence. */
    const ledeAt = (uiLang) => {
      const h = loadPage({ api: {}, uiLang }), Q = h.page;
      Object.assign(Q.S, { screen: "project", section: "cards", uiLang,
        open: { draft: { cards: [{ id: "x" }, { id: "y" }] }, editions: [],
          lint: { errors: 2, warnings: 1, awaiting: 4, suggestions: 8, rows: [] } } });
      Q.touchRail();
      return [Q.ledeText().replace(NB, " "), h.node('#main .pad>.lede[data-lede="cards"]').textContent.replace(NB, " ")];
    };
    const ledeEn = ledeAt("en");
    check(ledeEn[0] === "2 cards. 3 findings." && ledeEn[1] === ledeEn[0],
      "ls3j the cards lede counts the 2 errors and the 1 warning and neither the 4 awaiting nor the 8 suggestions, in the sentence "
      + "and on the counts line: " + JSON.stringify(ledeEn));
    const ledePl = ledeAt("pl");
    check(ledePl[0] === "2 karty. 3 uwagi." && ledePl[1] === ledePl[0],
      "ls3k the same count, and the same three, in Polish: " + JSON.stringify(ledePl));

    /* ---- 4. WORDS ---------------------------------------------------------------------------------- */

    const pl = loadPage({ api, uiLang: "pl" });
    await S.saveCard(dir, id.p, { body: { en: PROMISE_EN } });     /* new words after ls3i dismissed the last */
    open = await wire(S.openProject(dir));
    Object.assign(pl.page.S, { open, screen: "project", section: "lint", lfilter: "all", lang: "en", uiLang: "pl", lintAs: "list", lsugOpen: true });
    pl.page.paintLint();
    const plHtml = pl.node("#main").innerHTML;
    check(/>Podpowiedź</.test(plHtml) && /„We will send you a replacement today” brzmi jak zobowiązanie/.test(plHtml)
          && /rozpoznano po: [a-ząćęłńóśźż ]+</.test(plHtml) && /stacja końcowa: po tej karcie nie ma następnej/.test(plHtml) && /wcześniej na ścieżce: Card A, Card B/.test(plHtml)
          && /<th>Uwagi<\/th>/.test(plHtml) && /Podpowiedź czeka na decyzję/.test(plHtml)
          && !/>Suggestion<|nothing comes next|before it on|recognised by|>Finding</.test(plHtml),
      "ls4b the list's new parts turn Polish whole with the screen: " + (plHtml.match(/<tr(?: [^>]*)?>.*?<\/tr>/g) || [])
        .filter(t => /chip note|<th>/.test(t)).join(" ").replace(/<[^>]+>/g, "|").replace(/\|+/g, "|"));

    /* ---- 5. A PATH'S END DISMISSED, AND THE ROWS' OWN BUTTONS (S3e-2, S3c carve B) -------------------------- */

    const projAt = path.join(dir, "project.json"), draftAt = path.join(dir, DRAFT_FILE);
    const projNow = () => JSON.parse(fs.readFileSync(projAt, "utf8"));
    const base = await S.lintProject(dir);
    const pBefore = JSON.stringify(sugFor(base, id.p, "commitment")), promisesBefore = JSON.stringify(projNow().notPromises);
    const draftSha = sha(draftAt);
    const end = await S.dismissEnd(dir, id.c);
    open = await S.openProject(dir);
    check(end.dismissed === true && sugFor(base, id.c, "ends") && !sugFor(end.lint, id.c, "ends")
          && JSON.stringify(projNow().endsMeant) === JSON.stringify({ [id.c]: [id.a, id.b] }) && sha(draftAt) === draftSha
          && !sugFor(open.lint, id.c, "ends") && open.lint.ends === base.ends - 1 && open.lint.suggestions === base.suggestions,
      "ls5a Dismiss on a path's end is kept in project.json with the cards that link to it, the draft's bytes untouched,"
      + " and neither its answer nor the next open has the row: " + JSON.stringify(projNow().endsMeant && Object.values(projNow().endsMeant)[0].length));
    /* every other caller of findings() keeps the end's dismissal, as ls1g2 holds them to the commitment's; P's row is the
       control that each list was read */
    const after5 = [["saveCard", (await S.saveCard(dir, id.q, { body: { en: PLAIN_EN + " Once more." } })).lint],
      ["addTag", (await S.addTag(dir, "shelf", { en: "Third", pl: "Trzeci" })).lint],
      ["lintProject", await S.lintProject(dir)],
      ["publishPlan", (await S.publishPlan(dir, lic)).lint]];
    const forgot5 = after5.filter(([, l]) => sugFor(l, id.c, "ends") || !sugFor(l, id.p, "commitment")).map(([k]) => k);
    check(forgot5.length === 0,
      "ls5a2 an unrelated save, a tag added, a lint run and a publish plan all keep the end dismissed: " + forgot5.join(","));
    check(JSON.stringify(sugFor(end.lint, id.p, "commitment")) === pBefore && JSON.stringify(projNow().notPromises) === promisesBefore
          && !!sugFor(end.lint, id.p, "commitment"),
      "ls5b CONTROL: the commitment's row and the commitments dismissed are as they were");
    r = await S.saveCard(dir, id.a, { next: [] });
    const stillQuiet = !sugFor(r.lint, id.c, "ends") && !!sugFor(r.lint, id.a, "ends");
    r = await S.saveCard(dir, id.q, { next: [id.c] });
    const backC = sugFor(r.lint, id.c, "ends");
    check(stillQuiet && backC && JSON.stringify(backC.from) === JSON.stringify(["Card B", "Card Q"])
          && !!sugFor(await S.lintProject(dir), id.c, "ends"),
      "ls5c a card that stops linking to it keeps the end dismissed; a new card linking to it brings the row back,"
      + " naming the cards before it now: " + JSON.stringify(backC && backC.from));
    const projSha = sha(projAt);
    const noEnd = await S.dismissEnd(dir, "c-nowhere").then(() => null, (e) => e);
    check(noEnd && /no card "c-nowhere"/.test(noEnd.message) && sha(projAt) === projSha,
      "ls5d CONTROL: a dismissal for a card that is not there is refused and project.json is untouched");
    await S.saveCard(dir, id.a, { next: [id.c] });

    const calls5 = [];
    const api5 = {};
    for (const k of ["saveCard", "dismissLikely", "dismissEnd", "statsFor", "cardHistory"])
      api5[k] = (...a) => { calls5.push([k, a.slice(1)]); return wire(S[k](...a)); };
    api5.stats = (d) => api5.statsFor(d);
    const home5 = loadPage({ api: api5, uiLang: "en" });
    const Q5 = home5.page;
    Object.assign(Q5.S, { open: await wire(S.openProject(dir)), screen: "project", section: "lint", lfilter: "all",
      lang: "en", sel: null, stats: null, lintAs: "list", lsugOpen: true });
    Q5.paintLint();
    const rows5 = () => [...home5.node("#main").innerHTML.matchAll(/<tr(?: [^>]*)?>(.*?)<\/tr>/g)].map(m => m[1]);
    const sugTr = (title) => rows5().find(t => t.indexOf("<td>" + title + "</td>") >= 0 && /chip note/.test(t)) || "";
    const cTr5 = sugTr("Card C"), pTr5 = sugTr("Card P");
    const btns = (tr) => [...tr.matchAll(/data-act="([a-z-]+)"(?: data-id="([^"]*)")?/g)].map(m => m[1] + (m[2] === id.c ? ":C" : m[2] === id.p ? ":P" : ""));
    check(btns(cTr5).join(",") === "jump:C,paths-show:C,end-dismiss:C" && />Show on the Paths map</.test(cTr5) && />Dismiss</.test(cTr5),
      "ls5e a path end's row offers Jump, the Paths map at that card and Dismiss: " + btns(cTr5).join(","));
    check(btns(pTr5).join(",") === "jump:P,lint-dismiss:P" && pTr5.indexOf("Paths map") < 0,
      "ls5f CONTROL: a commitment's row has no map button, only Jump and its own Dismiss: " + btns(pTr5).join(","));
    const edC = Q5.nextHtml(Q5.cardById(id.c));
    check(/<div class="cn-end"><span>Terminus: nothing comes next on the path\.<\/span><button class="btn sm" data-act="end-dismiss" data-id="/.test(edC)
          && edC.indexOf('data-id="' + id.c + '">Dismiss') > 0,
      "ls5g the editor's line under Next cards carries the same Dismiss");
    await Q5.ACTS["paths-show"]({ getAttribute: (k) => (k === "data-id" ? id.c : null) });
    check(Q5.S.section === "paths" && Q5.pm().root === id.c && Q5.S.sel === id.c && calls5.some(x => x[0] === "statsFor"),
      "ls5h the row's map button opens the Paths map at that card");
    Object.assign(Q5.S, { section: "lint" });
    Q5.paintRail();
    const railNum = () => +((/data-v="lint"[^>]*>[^]*?<span class="num">(\d+)<\/span>/.exec(home5.node("#rail").innerHTML) || [])[1] || 0);
    const rail0 = railNum();
    /* the act's own touch of the rail's number, read where it writes it: the stand-in's element answers a fresh child
       to every query, so the one child this leg reads is handed to it */
    const railNumEl = { textContent: "" };
    home5.node('#rail a[data-v="lint"]').querySelector = () => railNumEl;
    await Q5.ACTS["end-dismiss"]({ getAttribute: (k) => (k === "data-id" ? id.c : null) });
    const ownLine = Q5.S.open.draft.cards.filter(c => !c.retired)
      .filter(c => /class="cn-end"/.test(Q5.nextHtml(c)) !== !!sugFor(Q5.S.open.lint, c.id, "ends")
        || Q5.pmEnds(c) !== !!sugFor(Q5.S.open.lint, c.id, "ends")).map(c => c.id);
    check(calls5.some(x => x[0] === "dismissEnd" && x[1][0] === id.c) && !sugFor(Q5.S.open.lint, id.c, "ends")
          && !sugTr("Card C") && +railNumEl.textContent === rail0 && !/cn-end/.test(Q5.nextHtml(Q5.cardById(id.c))) && !Q5.pmEnds(Q5.cardById(id.c))
          && ownLine.length === 0,
      "ls5i Dismiss on the row takes it off the list at once (the rail never counted it), and the editor's line and the map's mark"
      + " go with it, so the three still name the same cards: " + JSON.stringify([rail0, railNumEl.textContent, ownLine]));
    await Q5.ACTS["lint-dismiss"]({ getAttribute: (k) => (k === "data-id" ? id.p : null) });
    const sentP = calls5.find(x => x[0] === "dismissLikely");
    check(sentP && sentP[1][0] === id.p && sentP[1][1] === "We will send you a replacement today"
          && !sugFor(Q5.S.open.lint, id.p, "commitment") && !sugTr("Card P") && !Q5.likelyFor(Q5.cardById(id.p)),
      "ls5j Dismiss on a commitment's row sends the card and its words, as the editor's bubble does, and the row and the"
      + " bubble both go");
    const main5 = read("shell", "main.js"), preload5 = read("shell", "preload.js"), app5 = read("ui", "app.js");
    check(typeof S.dismissEnd === "function"
          && /answer\("studio:end-not-path"[^]*?thread\.call\("dismissEnd"[,)]/.test(main5)
          && main5.split('answer("studio:end-not-path"').length === 2
          && /dismissEnd:\s*\([^)]*\)\s*=>\s*ipcRenderer\.invoke\("studio:end-not-path"/.test(preload5)
          && app5.indexOf("API.dismissEnd(") >= 0,
      "ls5k the end's dismissal is exported, answered on one channel through the worker, offered by the preload and"
      + " called by the page");
    const plh = loadPage({ api: api5, uiLang: "pl" }), plp = plh.page;
    id.e = (await S.addCard(dir, shelf, "Card E", PLAIN_EN)).card.id;
    await S.saveCard(dir, id.e, { next: [id.c] });            /* a new way into C brings its row back for the Polish list */
    Object.assign(plp.S, { open: await wire(S.openProject(dir)), screen: "project", section: "lint", lfilter: "all",
      lang: "en", uiLang: "pl", lintAs: "list", lsugOpen: true });
    plp.paintLint();
    const plRow = (/<tr(?: [^>]*)?>(?:(?!<\/tr>).)*?data-act="end-dismiss"(?:(?!<\/tr>).)*?<\/tr>/.exec(plh.node("#main").innerHTML) || [""])[0];
    check(plRow && />Pomiń</.test(plRow) && />Pokaż na mapie ścieżek</.test(plRow)
          && !/>Dismiss<|Show on the Paths map/.test(plRow),
      "ls5l the row's two new buttons turn Polish with the screen: " + plRow.replace(/<[^>]+>/g, "|").replace(/\|+/g, "|"));

    /* each dismissal's answer keeps the other dismissals: P's commitment (dismissed in ls5j), and a second end beside C
       (the test architect's named edit of the read, 2026-10-04) */
    const endAgain = await S.dismissEnd(dir, id.c);
    id.f = (await S.addCard(dir, shelf, "Card F", PLAIN_EN)).card.id;
    await S.saveCard(dir, id.q, { next: [id.c, id.f] });
    const endF = await S.dismissEnd(dir, id.f);
    const likeP = await S.dismissLikely(dir, id.p, "We will send you a replacement today");
    const kept5 = projNow().endsMeant || {};
    const held5 = [["dismissEnd C", endAgain.lint, [id.c]], ["dismissEnd F", endF.lint, [id.c, id.f]],
      ["dismissLikely P", likeP.lint, [id.c, id.f]]]
      .filter(([, l, ends]) => !!sugFor(l, id.p, "commitment") || ends.some(e => !!sugFor(l, e, "ends"))).map(([k]) => k);
    check(held5.length === 0 && Array.isArray(kept5[id.c]) && Array.isArray(kept5[id.f]),
      "ls5m each dismissal's answer keeps the commitment and the ends already dismissed, and a second end's dismissal"
      + " keeps the first in project.json: " + JSON.stringify([held5, Object.keys(kept5).length]));

    /* ---- 6. A FINDING LEFT AS IT IS (the review door's "Leave as it is", src/findings-left.mjs) --------------------------
       Four cards: A; Q; T, whose second reply is empty (an error naming T by its place); and D, which repeats Q's title in
       its category (an error naming D by its place and Q by Q's). T's and D's findings are left. Then T is moved to the
       front, so T's place and the place D's finding names for Q both change; then T's words change. Red before the door:
       there was no leaveFinding and no findingsLeft. */
    const F6 = await Engine.format(), NL = String.fromCharCode(10);
    const made6 = await S.newProject(root, "Left as it is", [{ code: "en", name: "English" }]);
    const dir6 = made6.dir;
    const shelf6 = ((await S.addTag(dir6, "shelf", { en: "General" })).tag).id;
    for (const [k, title] of [["a", "Card A"], ["q", "Card Q"], ["t", "Card T"], ["d", "Card Q"]])
      id[k + "6"] = (await S.addCard(dir6, shelf6, title, PLAIN_EN)).card.id;
    const draftAt6 = path.join(dir6, DRAFT_FILE);
    const rewrite6 = (fn) => {
      const d = JSON.parse(fs.readFileSync(draftAt6, "utf8"));
      fn(d);
      delete d.hash; delete d.sig;
      d.hash = F6.contentHash(d);
      fs.writeFileSync(draftAt6, json(d));
    };
    const altsOf = (first) => "[alt]" + NL + first + NL + NL + "[alt]" + NL + NL + "[alt]" + NL + "Thank you for waiting.";
    rewrite6((d) => { const t = d.cards.find(c => c.id === id.t6); t.bodyShape = "alts"; t.body = { en: altsOf("Thank you for writing.") }; });
    const faults = (lint) => ((lint && lint.rows) || []).filter(r => r.severity === "error" || r.severity === "warning");
    const rowOf6 = (lint, card) => faults(lint).find(r => r.card === card) || null;
    const open6 = await S.openProject(dir6);
    const tRow = rowOf6(open6.lint, id.t6), dRow = rowOf6(open6.lint, id.d6);
    const draftSha6 = sha(draftAt6);
    let leftT = null, leftD = null;
    try { leftT = await S.leaveFinding(dir6, id.t6, tRow && tRow.why); leftD = await S.leaveFinding(dir6, id.d6, dRow && dRow.why); }
    catch (e) { leftD = { error: String(e && e.message || e) }; }
    const proj6 = () => JSON.parse(fs.readFileSync(path.join(dir6, "project.json"), "utf8"));
    const kept6 = proj6().findingsLeft || {};
    const after6 = await S.openProject(dir6);
    check(!!tRow && /^card 3: reply 2 is empty/.test(tRow.why) && !!dRow && /^card 4 \("Card Q"\): same title as card 2/.test(dRow.why)
          && !!leftT && leftT.left === true && !!leftD && leftD.left === true
          && !rowOf6(after6.lint, id.t6) && !rowOf6(after6.lint, id.d6) && !rowOf6(leftD.lint, id.t6) && !rowOf6(leftD.lint, id.d6)
          && after6.lint.errors === open6.lint.errors - 2 && faults(after6.lint).length === faults(open6.lint).length - 2
          && Array.isArray(kept6[id.t6]) && kept6[id.t6].length === 1 && typeof kept6[id.t6][0].hash === "string"
          && kept6[id.t6][0].reason === null && kept6[id.t6][0].finding.indexOf("card 3") < 0
          && sha(draftAt6) === draftSha6,
      "ls6a a finding left as it is stops counting and stops showing, in the answer and at the next open; project.json keeps"
      + " it by the card's id, the finding without the card's place, the card's hash and room for a reason, and the draft"
      + " is not touched: " + JSON.stringify({ t: tRow && tRow.why.slice(0, 30), d: dRow && dRow.why.slice(0, 40),
        errors: [open6.lint.errors, after6.lint.errors], kept: Object.keys(kept6).length, left: leftD && (leftD.error || leftD.left) }));

    /* The page's Checks list and the door's count, from that lint. */
    const home6 = loadPage({ api: {}, uiLang: "en" }), P6 = home6.page;
    const listed6 = (o) => {
      Object.assign(P6.S, { open: JSON.parse(JSON.stringify(o)), screen: "project", section: "lint", lfilter: "all", lang: "en",
        sel: null, lintAs: "list", lsugOpen: true });
      P6.paintLint();
      let door = null;
      try { door = P6.__get("reviewWaiting")().filter(x => x.kind === "check").length; } catch (e) { door = null; }
      return { html: home6.node("#main").innerHTML, door };
    };
    const was6 = listed6(open6), now6 = listed6(after6), before6 = was6.html, list6 = now6.html;
    const rowFor = (html, card) => html.indexOf("<tr data-ctx=\"finding\" data-id=\"" + card + "\">") >= 0;
    check(rowFor(before6, id.t6) && rowFor(before6, id.d6) && !rowFor(list6, id.t6) && !rowFor(list6, id.d6)
          && was6.door === 2 && now6.door === faults(after6.lint).length,
      "ls6b the Checks screen lists neither left finding and the review door counts only the findings still waiting: "
      + JSON.stringify({ door: [was6.door, now6.door], waiting: faults(after6.lint).length }));

    /* T to the front: T is card 1, and D, still card 4, now repeats card 3's title. */
    rewrite6((d) => { const t = d.cards.find(c => c.id === id.t6); d.cards = [t].concat(d.cards.filter(c => c.id !== id.t6)); });
    const moved6 = await S.openProject(dir6);
    const bare = async (n) => {
      const copy = path.join(root, "bare-" + n);
      fs.cpSync(dir6, copy, { recursive: true });
      const pj = JSON.parse(fs.readFileSync(path.join(copy, "project.json"), "utf8"));
      delete pj.findingsLeft;
      fs.writeFileSync(path.join(copy, "project.json"), JSON.stringify(pj, null, 1) + NL);
      const draft = JSON.parse(fs.readFileSync(path.join(copy, DRAFT_FILE), "utf8"));
      return { rows: faults(await S.lintProject(copy)), draft };
    };
    const bareMoved = await bare("moved");
    check(!rowOf6(moved6.lint, id.t6) && !rowOf6(moved6.lint, id.d6)
          && bareMoved.rows.some(r => r.card === id.t6 && /^card 1: reply 2/.test(r.why))
          && bareMoved.rows.some(r => r.card === id.d6 && /^card 4 \("Card Q"\): same title as card 3/.test(r.why)),
      "ls6c moving cards brings neither back, though both findings now name other places: "
      + JSON.stringify(bareMoved.rows.map(r => r.why.slice(0, 32))));

    rewrite6((d) => { const t = d.cards.find(c => c.id === id.t6); t.body = { en: altsOf("Thank you for writing to us.") }; });
    const changed6 = await S.openProject(dir6);
    const bareChanged = await bare("changed");
    check(!!rowOf6(changed6.lint, id.t6) && !rowOf6(changed6.lint, id.d6)
          && (await S.publishPlan(dir6, {})).lint.errors === bareChanged.rows.filter(r => r.severity === "error").length,
      "ls6d the same finding on a changed card asks again, the unchanged card's stays left, and the publish plan still counts"
      + " every error, left or not, for its cover's note: " + JSON.stringify(faults(changed6.lint).map(r => r.why.slice(0, 32))));

    /* The shell's door and the page's way to it. */
    const main6 = read("shell", "main.js"), preload6 = read("shell", "preload.js");
    /* The page's call, as Apply will make it: on a copy of the project with no entries, D's finding is left through the
       bridge. */
    const pageDir6 = path.join(root, "bare-page");
    fs.cpSync(dir6, pageDir6, { recursive: true });
    const pj6 = JSON.parse(fs.readFileSync(path.join(pageDir6, "project.json"), "utf8"));
    delete pj6.findingsLeft;
    fs.writeFileSync(path.join(pageDir6, "project.json"), JSON.stringify(pj6, null, 1) + NL);
    const sent6 = [];
    const pageHome6 = loadPage({ api: { leaveFinding: (...a) => { sent6.push(a); return wire(S.leaveFinding(...a)); } }, uiLang: "en" });
    const PP6 = pageHome6.page, pageOpen6 = await wire(S.openProject(pageDir6));
    Object.assign(PP6.S, { open: pageOpen6, screen: "project", section: "cards", lang: "en" });
    const dPage = rowOf6(pageOpen6.lint, id.d6);
    let pageKept = null;
    try { pageKept = await PP6.__get("reviewLeave")(dPage); } catch (e) { pageKept = String(e && e.message || e); }
    check(pageKept === true && sent6.length === 1 && sent6[0][1] === id.d6 && sent6[0][2] === (dPage && dPage.why)
          && !rowOf6(PP6.S.open.lint, id.d6) && Array.isArray((JSON.parse(fs.readFileSync(path.join(pageDir6, "project.json"), "utf8")).findingsLeft || {})[id.d6]),
      "ls6e2 the page leaves a finding through the bridge with the card and the row's own line, and takes the answer's lint: "
      + JSON.stringify({ pageKept, sent: sent6.length }));
    check(typeof S.leaveFinding === "function"
          && /answer\("studio:finding-left"[^]*?thread\.call\("leaveFinding"[,)]/.test(main6)
          && main6.split('answer("studio:finding-left"').length === 2
          && /leaveFinding:\s*\([^)]*\)\s*=>\s*ipcRenderer\.invoke\("studio:finding-left"/.test(preload6),
      "ls6e leaveFinding is a verb of src/studio.mjs, answered once by the shell on studio:finding-left and offered by the preload");

    /* EACH GUARD OF src/findings-left.mjs LIFTED in a rewritten copy loaded in memory turns a claim above false: the place
       taken out (plant:left-place, ls6c), the card's hash compared (left-hash, ls6d), a left row dropped (left-drop, ls6a).
       Under ETIUDA_PLANTS=off no copy is loaded and the module's own claims are checked. */
    const { lintSaid } = await import("../src/lint-said.mjs");
    const { undated } = await import("../src/dated.mjs");
    const bareOpen = { rows: faults(open6.lint), draft: bareMoved.draft };
    const claims = (M) => {
      const kept = M.findingsLeftOf({ findingsLeft: kept6 });
      const keyOf = (line) => M.findingKey(lintSaid(String(line)), line);
      const shown = (st) => M.withoutLeft(st.rows, kept, keyOf,
        (cid) => M.cardHash(F6, undated(st.draft.cards.find(c => c.id === cid) || null))).map(r => r.card);
      const at0 = shown(bareOpen), at1 = shown(bareMoved), at2 = shown(bareChanged);
      return { drop: at0.indexOf(id.t6) < 0 && at0.indexOf(id.d6) < 0, place: at1.indexOf(id.t6) < 0 && at1.indexOf(id.d6) < 0,
        hash: at2.indexOf(id.t6) >= 0 && at2.indexOf(id.d6) < 0 };
    };
    const modText = read("src", "findings-left.mjs");
    const modOf = (text) => import("data:text/javascript;base64," + Buffer.from(text).toString("base64"));
    const real = claims(await modOf(modText));
    const turned = {};
    if (process.env.ETIUDA_PLANTS !== "off") {
      for (const [tag, claim] of [["left-place", "place"], ["left-hash", "hash"], ["left-drop", "drop"]]) {
        const lines = modText.split(NL), mark = "/* plant:" + tag + " */";
        const at = lines.findIndex(l => l.indexOf(mark) >= 0);
        if (at < 0 || lines.filter(l => l.indexOf(mark) >= 0).length !== 1) { turned[tag] = "unmarked"; continue; }
        lines.splice(at, 1);
        turned[tag] = claims(await modOf(lines.join(NL)))[claim] ? "held" : "red";
      }
    }
    check(real.drop && real.place && real.hash && Object.keys(turned).every(k => turned[k] === "red"),
      "ls6f the module's three claims hold, and each of its guards lifted turns its claim false"
      + (process.env.ETIUDA_PLANTS === "off" ? " (plants not run: ETIUDA_PLANTS=off)" : "") + ": " + JSON.stringify({ real, turned }));
  } catch (e) {
    check(false, "the legs stopped after " + asserted + " checks: " + (e && e.stack || e));
  }

  if (!argv.includes("--keep")) dropScratch(SCRATCH, "lint-suggest");
  const ok = failed === 0 && asserted === EXPECTED;
  console.log("RESULT: " + (ok ? "ok" : "FAIL") + " checks=" + asserted + " failed=" + failed + " expected=" + EXPECTED);
  process.exit(ok ? 0 : 1);
}

main(process.argv.slice(2)).catch((e) => { console.error(e && e.stack || e); process.exit(2); });
