/* THE LANGUAGES A CATALOG DECLARES: the screen, the acts, and what the pinned engine does with
 * what the screen now permits (board 579, Maxim 2026-09-19).
 *
 *     node tests/langs.mjs [--keep]
 *
 * WHAT IS BEING PROVED, and one of the four claims the brief asked for turned out to be false.
 * The brief's first leg was that a project declared with three languages "round-trips through
 * publish and the pinned engine's reader". It does not, and cannot: `v2LangProblems` in the
 * engine's src/modules/catalog-v2.js refuses a declared code the build has no column for, as an
 * ERROR rather than a warning, so the pinned reader will not load such a catalog and
 * `publishFull` will not write one without an override note. Section 1 therefore proves what
 * actually happens, which is more useful than what was hoped for: the bytes carry every one of
 * the three languages faithfully, the reader refuses them by name, and the screen says so on the
 * row before anybody publishes. Section 1's control removes the third language and watches both
 * the publish and the load come clean.
 *
 * THE COUNTS ARE THE ORACLE FOR THEMSELVES AND THAT IS NOT CIRCULAR. What the removal warning
 * says and what the removal does come from one function in src/studio.mjs, on purpose; so
 * section 3 counts the file a SECOND way, in this file, by walking the JSON, and holds the two
 * against each other. A warning that said a number the act then disproved is the fault this
 * guards, and one implementation cannot disagree with itself.
 *
 * THE CHROME ROW IS MEASURED IN THE REAL WINDOW AT STUDIO'S OWN MINIMUM, 900px wide
 * (shell/main.js), not at the engine's 546: that is a different program's ruled minimum and a
 * row tested against it was tested at a width that never occurs. Section 4 reads rectangles out
 * of the page and its control puts the two CSS rules back the way they were, in the page, and
 * watches the row clip - a leg that only asserted "no overflow" would pass on a row that could
 * never overflow at all.
 */
import "./licensed-env.mjs";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { openStudio } from "./shell-door.mjs";
import * as S from "../src/studio.mjs";
import * as Engine from "../src/engine.mjs";
import { publishFull, lintOf, json, DRAFT_FILE } from "../src/publish.mjs";
import { clearScratch, dropScratch } from "./scratch.mjs";
import { pressWhen, settleOn } from "./press.mjs";
import { loadPage } from "./page-stand-in.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const SCRATCH = path.join(ROOT, "scratch", "langs");

let asserted = 0, failed = 0;
function check(cond, line) {
  asserted++;
  if (cond) process.stdout.write("  ok   " + line + "\n");
  else { failed++; process.stderr.write("  FAIL " + line + "\n"); }
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const read = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
const bytes = (p) => fs.readFileSync(p);

/* A SECOND IMPLEMENTATION OF THE COUNT, walking the draft rather than asking src/studio.mjs.
   Deliberately written from the format's own shape and not from that function's: title, body
   and note are a card's language maps and label and clause are a tag's, which is what
   CARD_KEY and REQ_KEY at the pin say they are. */
function countByHand(draft, code) {
  const has = (o) => !!String(((o || {})[code]) || "").trim();
  const cards = draft.cards || [], tags = draft.tags || [];
  return {
    cards: cards.filter((c) => has(c.title) || has(c.body) || has(c.note)).length,
    titles: cards.filter((c) => has(c.title)).length,
    bodies: cards.filter((c) => has(c.body)).length,
    intents: tags.filter((t) => t.kind === "request" && has(t.clause)).length,
    cats: tags.filter((t) => t.kind === "shelf" && has(t.label)).length,
  };
}

/** Every place a language code can hide in a draft, so that "no dangling reference" is a walk
 *  rather than a hope: the card and tag maps, and the two catalog-level tables. */
function tracesOf(draft, code) {
  const out = [];
  (draft.cards || []).forEach((c, i) => ["title", "body", "note"].forEach((f) => {
    if (c[f] && Object.prototype.hasOwnProperty.call(c[f], code)) out.push("card " + i + "." + f);
  }));
  (draft.tags || []).forEach((t, i) => ["label", "clause"].forEach((f) => {
    if (t[f] && Object.prototype.hasOwnProperty.call(t[f], code)) out.push("tag " + i + "." + f);
  }));
  if (draft.greet && draft.greet[code]) out.push("greet");
  if (draft.stop && draft.stop[code]) out.push("stop");
  if (draft.commentLang === code) out.push("commentLang");
  if ((draft.langs || []).some((l) => l && l.code === code)) out.push("langs");
  return out;
}

/* A THREE-LANGUAGE PROJECT MADE THE WAY A PERSON WOULD MAKE ONE: a project born declaring three,
   then a CSV landed into it, then German written into a few cards through the ordinary card
   save. Nothing here hand-edits a draft, which is the point - a fixture built by writing JSON
   would prove that JSON can hold three languages and nothing about this program. */
async function threeLanguageProject(root) {
  const made = await S.newProject(root, "Three tongues",
    [{ code: "en" }, { code: "pl" }, { code: "de", label: "Deutsch" }]);
  const dir = made.dir;
  const shelf = await S.addTag(dir, "shelf", { en: "Front desk", pl: "Recepcja", de: "Empfang" });
  await S.addTag(dir, "request", { en: "Ask for a room", pl: "Prosba o pokoj",
    de: "Zimmer erfragen" });
  const wrote = [];
  for (let i = 1; i <= 6; i++) {
    const c = await S.addCard(dir, shelf.tag.id, "Invented card " + i);
    /* THE THIRD LANGUAGE IS WRITTEN THROUGH THE ORDINARY CARD SAVE, on four of the six, so that
       the counts below are not all-or-nothing: a count that was always the whole catalog would
       pass whatever it was counting. Polish goes on all six. */
    const patch = { title: { pl: "Karta " + i }, body: { en: "Body " + i, pl: "Tresc " + i } };
    if (i <= 4) { patch.title.de = "Karte " + i; patch.body.de = "Inhalt " + i; }
    await S.saveCard(dir, c.card.id, patch);
    if (i <= 4) wrote.push(c.card.id);
  }
  return { dir, wrote };
}

async function main(argv) {
  const keep = argv.indexOf("--keep") >= 0;
  clearScratch(SCRATCH);
  const projects = path.join(SCRATCH, "projects");
  fs.mkdirSync(projects, { recursive: true });

  /* ---- 0. what the pin says it can read, which every claim below leans on ------------------- */

  const builtIn = Engine.builtInLangs();
  const built = S.builtLangs();
  check(builtIn.length === 2 && builtIn.join(",") === "en,pl"
        && built.builtIn.join(",") === builtIn.join(",") && built.endonyms.en === "English",
    "0a the pinned engine declares " + JSON.stringify(builtIn) + " as the languages it has of"
    + " its own, read out of the pin rather than from a copy here, and names them "
    + JSON.stringify(built.endonyms));

  /* WHICH PIN IS IN PLACE IS READ, NOT ASSUMED (board 646). Before 646 the engine's storage was
     closed with its grammar and a code with no field column was refused at load, so one
     declaration answered both questions; since 646 the column is derived and V2_GRAMMAR_LANGS is
     the closed half alone. Studio has to be right on either side of the pin moving, so the
     reading is driven over BOTH shapes here - the pin's own text, and the same text with the
     newer declaration spliced in - rather than over whichever one happens to be fetched. */
  const PIN = path.join(ROOT, "engine", "pinned");
  const pinV2 = fs.readFileSync(path.join(PIN, "src", "modules", "catalog-v2.js"), "utf8");
  const pinCM = fs.readFileSync(path.join(PIN, "src", "modules", "content-model.js"), "utf8");
  const chr10 = String.fromCharCode(10);
  /* THE PIN CROSSED 646 AT 32af894 AND THIS LEG TURNED OVER WITH IT, which is the whole reason
     it was written this way. The pin's own answer is now the open one, so the CLOSED shape is
     the spliced one: the declaration is renamed out of the pin's text - every occurrence, so
     nothing downstream finds it either - and langSupportFrom falls back to CONTENT_LANGS in
     content-model.js exactly as it did while the pin was older. Before this commit `older` was
     the pin and `newer` was the splice; the claim is the same claim either way round, that the
     reading follows the text and not the pin's hash. */
  const asIs = Engine.langSupportFrom(pinV2, pinCM);
  const closed = Engine.langSupportFrom(
    pinV2.split("const V2_GRAMMAR_LANGS").join("const V2_GRAMMAR_WAS"), pinCM);
  const foreign = Engine.langSupportFrom(
    'const V2_GRAMMAR_LANGS=["pl"];' + chr10 + pinV2, pinCM);
  check(asIs.refusesOthers === false && asIs.grammar.join(",") === "en,pl"
        && closed.refusesOthers === true && closed.grammar.join(",") === "en,pl"
        && foreign.refusesOthers === false && foreign.grammar.join(",") === "pl"
        && Engine.langSupport().refusesOthers === asIs.refusesOthers,
    "0b and WHETHER it refuses a code outside that set is the pin's answer rather than a"
    + " constant: this pin " + JSON.stringify(asIs) + ", the same pin with the declaration"
    + " renamed away " + JSON.stringify(closed) + ". The screen's hard sentence hangs on the"
    + " second, so on this pin it is not said at all");

  /* ---- 1. a project born in three languages -------------------------------------------------
   *
   * THE CLAIM THE BRIEF MADE IS THE ONE THIS SECTION DISPROVES, so the numbers are all here.
   */

  const made = await threeLanguageProject(projects);
  const dir = made.dir;
  const draft3 = read(path.join(dir, DRAFT_FILE));
  check((draft3.langs || []).map((l) => l.code).join(",") === "en,pl,de"
        && draft3.langs[2].label === "Deutsch" && draft3.commentLang === "en",
    "1a a project is born in the set it was given rather than in English and Polish: "
    + JSON.stringify((draft3.langs || []).map((l) => l.code + "/" + l.label)));

  const noneGiven = await S.newProject(projects, "No declaration");
  const draftD = read(path.join(noneGiven.dir, DRAFT_FILE));
  check((draftD.langs || []).map((l) => l.code).join(",") === builtIn.join(",")
        && draftD.langs[0].label === built.endonyms.en,
    "1b and one born with no declaration takes the PIN'S built-in set rather than a literal in"
    + " src/studio.mjs: " + JSON.stringify((draftD.langs || []).map((l) => l.code)) + " against"
    + " the engine's " + JSON.stringify(builtIn));

  /* THE BRIEF'S FIRST LEG IS TRUE AT THIS PIN AND WAS FALSE AT THE LAST, and the swap is the
     engine's 646, carried into this tree by the pin move to 32af894. While the storage was
     closed with the grammar, `v2LangProblems` refused a declared code the build had no column
     for, as an error, and 1c and 1d proved that and said so. The column is derived from the code
     now, so the same three-language project lints clean and publishes with no override. Nothing
     in Studio changed for it: `readable` at src/studio.mjs already asked the pin. What changed
     is what is true, so the legs say the other thing and 1f keeps them from saying nothing. */
  const lint3 = lintOf(draft3);
  const langErrs = (lint3.errors || []).filter((e) => /^langs: /.test(e));
  check(langErrs.length === 0,
    "1c the pinned reader takes a third declared language rather than refusing it, "
    + langErrs.length + " langs finding(s) over a catalog declaring en, pl and de"
    + (langErrs.length ? " - " + JSON.stringify(langErrs[0]) : ""));

  const share = path.join(SCRATCH, "share");
  const out = await publishFull({ project: dir, folder: share });
  check(!!out && fs.existsSync(out.ec),
    "1d so publish writes it with no override note at all, into " + path.basename(out.ec));

  const wrote = read(out.ec);
  const backDe = (wrote.cards || []).filter((c) => (c.body || {}).de).length;
  const sameDe = made.wrote.every((id) => {
    const a = (draft3.cards || []).find((c) => c.id === id) || {};
    const b = (wrote.cards || []).find((c) => c.id === id) || {};
    return (a.body || {}).de === (b.body || {}).de && (a.title || {}).de === (b.title || {}).de;
  });
  check(backDe === 4 && sameDe,
    "1e and the FILE carries every word of the third language unharmed - " + backDe
    + " card(s) with a German body, each equal to the draft's");

  /* THE CONTROL FOR 1c, AND IT IS THE LEG THAT MATTERS NOW. 1c is a leg on SILENCE, and silence
     is what a linter that had stopped looking at `langs` would also produce; while the reader
     refused the code the finding itself was the proof it was awake. So the same draft is bent
     into a code the FORMAT refuses - V2_LANG_RE wants a-z and hyphened parts - and the one
     finding comes back by name. An open storage is not an unchecked one. */
  const bentCode = JSON.parse(JSON.stringify(draft3));
  bentCode.langs[2] = { code: "de_DE", label: "Deutsch" };
  const bentErrs = (lintOf(bentCode).errors || []).filter((e) => /^langs: /.test(e));
  check(bentErrs.length === 1 && /de_DE/.test(bentErrs[0])
        && /not usable as a language code/.test(bentErrs[0]),
    "1f CONTROL: the linter is still reading the declaration - a code the format refuses gets"
    + " exactly one langs finding, " + JSON.stringify((bentErrs[0] || "").slice(0, 70)));

  /* AND THE REMOVAL, which the sections below start from: this project is three languages until
     here and two after it. */
  await S.removeLang(dir, "de", { confirm: true });
  const draft2 = read(path.join(dir, DRAFT_FILE));
  const lint2 = lintOf(draft2);
  const out2 = await publishFull({ project: dir, folder: share });
  check((lint2.errors || []).length === 0 && fs.existsSync(out2.ec),
    "1g and with it removed the project still lints clean ("
    + (lint2.errors || []).length + " error(s)) and publishes again, so the sections below start"
    + " from two languages and a clean draft");

  /* ---- 2. reordering moves the primary and nothing else -------------------------------------- */

  const before = read(path.join(dir, DRAFT_FILE));
  const beforeBytes = bytes(path.join(dir, DRAFT_FILE));
  const moved = await S.moveLang(dir, "pl", -1);
  const after = read(path.join(dir, DRAFT_FILE));
  check(moved.moved && after.langs.map((l) => l.code).join(",") === "pl,en",
    "2a a move up puts the language at the head, which IS the primary: "
    + JSON.stringify(after.langs.map((l) => l.code)));

  /* NOTHING ELSE, MEASURED AS A DIFF OF THE WHOLE DOCUMENT rather than as a spot check of the
     fields somebody thought of: the two drafts with `langs` and `hash` taken out are compared as
     strings, so a card, a tag, a greeting or the comment language moved by this act would show
     as an inequality here whether or not this gate knew to look for it. */
  const strip = (d) => {
    const c = Object.assign({}, d); delete c.langs; delete c.hash; return json(c);
  };
  check(strip(before) === strip(after),
    "2b and nothing else in the document moved: the two drafts are byte for byte equal with"
    + " `langs` and `hash` removed (" + strip(after).length + " bytes compared)");

  const end = await S.moveLang(dir, "en", 1);
  const still = bytes(path.join(dir, DRAFT_FILE));
  check(end.refused === "at the end" && !end.moved
        && Buffer.compare(still, bytes(path.join(dir, DRAFT_FILE))) === 0
        && read(path.join(dir, DRAFT_FILE)).langs.map((l) => l.code).join(",") === "pl,en",
    "2c CONTROL: a move past the end refuses and writes nothing, so 2a is the act and not the"
    + " file being rewritten by every call");
  await S.moveLang(dir, "en", -1);

  /* A LANGUAGE SOME CARDS LACK BECOMES THE PRIMARY ONLY ON THE SECOND ASK (Maxim, 2026-09-22):
     2a above is the control, a complete language moving in one. Here one card has an English
     title and no Polish at all, so making Polish the primary would leave the reader a card
     with nothing in its primary language. */
  const ask = await S.newProject(projects, "Primary ask");
  await S.addTag(ask.dir, "shelf", { en: "Zubynt ondrave" });
  const askAt = path.join(ask.dir, DRAFT_FILE);
  await S.addCard(ask.dir, read(askAt).tags[0].id, "Plasule widuma");
  const askBytes = bytes(askAt);
  const askedAt = await S.moveLang(ask.dir, "en", 1);
  check(askedAt.refused === "not confirmed" && askedAt.lang === "pl" && askedAt.lacking === 1
        && /some have no pl text: 1 card\./.test(askedAt.message)
        && Buffer.compare(askBytes, bytes(askAt)) === 0,
    "2d moving English down under an incomplete Polish asks first, names the one card, and"
    + " writes nothing: " + JSON.stringify(askedAt.message));
  const told = await S.moveLang(ask.dir, "en", 1, { confirm: true });
  check(told.moved && read(askAt).langs.map((l) => l.code).join(",") === "pl,en",
    "2e and the second ask makes it the primary: " + JSON.stringify(read(askAt).langs));
  await S.moveLang(ask.dir, "pl", 1, { confirm: true });

  /* ---- 3. the removal warns, and once confirmed leaves nothing behind ------------------------ */

  const uses = S.langUses(read(path.join(dir, DRAFT_FILE)), "pl");
  const hand = countByHand(read(path.join(dir, DRAFT_FILE)), "pl");
  check(uses.cards === hand.cards && uses.titles === hand.titles && uses.bodies === hand.bodies
        && uses.intents === hand.intents && uses.cats === hand.cats && uses.cards > 0,
    "3a the counts the warning spends are what a second walk of the file finds: cards "
    + uses.cards + "/" + hand.cards + ", titles " + uses.titles + "/" + hand.titles + ", bodies "
    + uses.bodies + "/" + hand.bodies + ", intents " + uses.intents + "/" + hand.intents
    + ", categories " + uses.cats + "/" + hand.cats);

  const asked = bytes(path.join(dir, DRAFT_FILE));
  const warn = await S.removeLang(dir, "pl");
  check(warn.refused === "not confirmed" && warn.removed === false
        && /removing pl discards its text/.test(warn.message)
        && warn.said && warn.said.vars.CARDS.n === uses.cards
        && Buffer.compare(asked, bytes(path.join(dir, DRAFT_FILE))) === 0,
    "3b asked without a confirmation it warns and writes NOT ONE BYTE, carrying the same counts:"
    + " " + JSON.stringify(warn.message));

  const gone = await S.removeLang(dir, "pl", { confirm: true });
  const left = read(path.join(dir, DRAFT_FILE));
  const traces = tracesOf(left, "pl");
  check(gone.removed && traces.length === 0,
    "3c confirmed, it leaves no trace of the code anywhere in the document - "
    + (left.cards || []).length + " card(s) and " + (left.tags || []).length + " tag(s) walked,"
    + " with greet, stop, commentLang and langs, and " + traces.length + " reference(s) left");
  check((lintOf(left).errors || []).length === 0,
    "3d and the pinned engine's own lint finds nothing wrong with what is left: "
    + JSON.stringify((lintOf(left).errors || []).slice(0, 2)));

  /* THE CONTROL FOR 3c AND 3d, AND IT IS THE ONE THAT MATTERS. A removal that took the language
     out of `langs` and left its greeting behind would pass any test that only looked at the
     cards; the engine calls that a dangling reference by name. So the same removal is done by
     hand, badly, and the lint is asked about it. */
  const bad = read(path.join(dir, DRAFT_FILE));
  bad.langs = [{ code: "en", label: "English" }, { code: "pl", label: "Polski" }];
  bad.greet = { pl: ["rano", "popoludnie", "wieczor"] };
  bad.langs = [{ code: "en", label: "English" }];
  const badErrs = (lintOf(bad).errors || []).filter((e) => /greet/.test(e));
  check(badErrs.length === 1 && /does not declare/.test(badErrs[0]),
    "3e CONTROL: a greeting left behind for an undeclared language IS a finding the engine"
    + " makes, so 3d's silence is the removal being complete - " + JSON.stringify(badErrs[0]));

  let lastRefusal = null;
  try { await S.removeLang(dir, "en", { confirm: true }); }
  catch (e) { lastRefusal = e && e.message ? e.message : String(e); }
  check(lastRefusal && /only language/.test(lastRefusal)
        && read(path.join(dir, DRAFT_FILE)).langs.length === 1,
    "3f and the last one cannot be removed however firmly it is asked: "
    + JSON.stringify(String(lastRefusal).slice(0, 80)));

  /* ---- 4. the copied pair, read out of the two files ----------------------------------------- */

  const appSrc = fs.readFileSync(path.join(ROOT, "ui", "app.js"), "utf8");
  const modSrc = fs.readFileSync(path.join(ROOT, "src", "studio.mjs"), "utf8");
  const frameIn = (src, name) => {
    const i = src.indexOf("const " + name + " =");
    if (i < 0) return null;
    const line = src.slice(i, src.indexOf(";", i));
    const Q = String.fromCharCode(34);
    const parts = line.split(Q).filter((_, n) => n % 2 === 1);
    return parts.join("");
  };
  const copied = ["LANG_CODE_REFUSAL", "LANG_TWICE_REFUSAL"];
  const same = copied.filter((n) => frameIn(appSrc, n) && frameIn(appSrc, n) === frameIn(modSrc, n));
  check(same.length === 2,
    "4a the two refusal frames the New project cover raises itself are src/studio.mjs's own,"
    + " character for character: " + JSON.stringify(copied.map((n) => frameIn(appSrc, n))));

  /* ---- s3. removing a language that an archived edition still holds ---------------------------
     The text is on two cards. Changes can put the draft back, byte for byte, and the warning
     does not say there is no other copy when an edition holds one. A catalog that was never
     published still says that, because there it is true. */
  let s3n = 0, s3fail = 0;
  const checkS3 = (cond, line) => {
    const was = failed;
    check(cond, line);
    s3n++;
    if (failed !== was) s3fail++;
  };
  const s3root = path.join(SCRATCH, "s3");
  fs.mkdirSync(s3root, { recursive: true });
  const s3 = await S.newProject(s3root, "Two cards");
  const s3dir = s3.dir;
  const s3at = path.join(s3dir, DRAFT_FILE);
  await S.addTag(s3dir, "shelf", { en: "Shelf", pl: "Polka" });
  const s3shelf = read(s3at).tags[0].id;
  const s3first = await S.addCard(s3dir, s3shelf, "First card", "First body.");
  const s3second = await S.addCard(s3dir, s3shelf, "Second card", "Second body.");
  await S.saveCard(s3dir, s3first.card.id, {
    title: { pl: "Pierwsza karta" }, body: { pl: "Pierwsze cialo." },
  });
  await S.saveCard(s3dir, s3second.card.id, {
    title: { pl: "Druga karta" }, body: { pl: "Drugie cialo." },
  });
  await publishFull({ project: s3dir, notes: "Both cards in both languages.",
    now: "2026-11-10T09:00:00.000Z" });
  const s3before = bytes(s3at);
  const s3warn = await S.removeLang(s3dir, "pl");
  const s3open = await S.openProject(s3dir);
  const s3page = loadPage({ api: {}, uiLang: "en" });
  Object.assign(s3page.page.S, {
    open: s3open, screen: "project", section: "settings", lang: "en", langGoing: "pl", err: null,
  });
  s3page.page.paintProjectSettings();
  const s3shown = (html) => String(html).replace(/<[^>]*>/g, " ").replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&").replace(/\s+/g, " ");
  const s3html = s3shown(s3page.node("#main").innerHTML);
  const s3lie = /no other copy|nothing else holds a copy/i;
  const s3backSentence = "The removal can be undone from Changes.";
  checkS3(s3warn.refused === "not confirmed" && !s3lie.test(String(s3warn.message || ""))
        && !s3lie.test(s3html)
        && /the removal can be undone from Changes/i.test(String(s3warn.message || ""))
        && s3html.indexOf(s3backSentence) >= 0,
    "s3a an archived edition holds pl, so the warning drops \"no other copy\" and says the removal"
    + " can be undone from Changes: " + JSON.stringify(s3warn.message));
  const s3fresh = await S.newProject(s3root, "Never published");
  const s3freshWarn = await S.removeLang(s3fresh.dir, "pl");
  const s3freshOpen = await S.openProject(s3fresh.dir);
  const s3freshPage = loadPage({ api: {}, uiLang: "en" });
  Object.assign(s3freshPage.page.S, {
    open: s3freshOpen, screen: "project", section: "settings", lang: "en", langGoing: "pl", err: null,
  });
  s3freshPage.page.paintProjectSettings();
  const s3freshHtml = s3shown(s3freshPage.node("#main").innerHTML);
  checkS3(/nothing else holds a copy/.test(String(s3freshWarn.message || ""))
        && !/the removal can be undone from Changes/i.test(String(s3freshWarn.message || ""))
        && s3freshHtml.indexOf("no other copy") >= 0
        && s3freshHtml.indexOf(s3backSentence) >= 0,
    "s3b a catalog with no edition still says nothing else holds a copy, the refusal frame"
    + " stays that sentence, and the warning on the screen says the removal can be undone: "
    + JSON.stringify(s3freshWarn.message));
  const s3gone = await S.removeLang(s3dir, "pl", { confirm: true });
  const s3left = read(s3at);
  const s3plCards = (s3left.cards || []).filter((c) =>
    (c.title && c.title.pl) || (c.body && c.body.pl)).length;
  checkS3(s3gone.removed === true && s3plCards === 0
        && (s3left.langs || []).every((l) => l.code !== "pl")
        && (s3left.cards || []).length === 2,
    "s3c confirmed, pl is gone from both cards and from the declaration");
  const s3list = await S.changesSince(s3dir);
  const s3newest = s3list.list[0];
  let s3back = null, s3err = "";
  try { s3back = await S.undoChange(s3dir, s3newest && s3newest.n); }
  catch (e) { s3err = e && e.message ? e.message : String(e); }
  checkS3(!s3err && !!s3back && !!s3newest && Buffer.compare(s3before, bytes(s3at)) === 0,
    "s3d undoChange of the newest row restores the draft byte for byte (" + s3before.length
    + " bytes, newest n " + (s3newest ? s3newest.n : "none") + "): "
    + (s3err || (Buffer.compare(s3before, bytes(s3at)) === 0 ? "matched" : "bytes differ")));
  process.stdout.write("langs-s3  " + s3n + " assertion(s), " + s3fail + " failure(s)\n");

  /* ---- 5. the screen, and the chrome row at the minimum width -------------------------------- */

  const wide = await S.newProject(projects, "Sixteen tongues",
    "en pl de uk es it nl pt cs sk hu ro sv da fi no".split(" ").map((c) => ({ code: c })));
  const studio = await openStudio("tests/langs.mjs", { words: true,
    projects, userDataDir: path.join(SCRATCH, "ud"),
  });
  try {
    const page = studio.page;
    const state = async (js) => JSON.parse(await page.evaluate("JSON.stringify(" + js + ")"));
    const press = async (sel, ms) => {
      await pressWhen(page, sel, { who: "tests/langs.mjs" });
      await sleep(ms || 350);
    };
    await pressWhen(page, '[data-act="open"]', { who: "tests/langs.mjs", attr: ["data-dir", wide.dir] });
    await sleep(900);
    await press('[data-act="section"][data-v="settings"]', 500);
    await settleOn(page, 'document.querySelectorAll("#main .ls>div").length > 0', { bound: 30000 });

    const screen = await state(`{
      rows: Array.from(document.querySelectorAll("#main .ls>div")).length,
      codes: Array.from(document.querySelectorAll("#main .ls .lsk")).map(e => e.textContent),
      chip: (document.querySelector("#main .ls .chip") || {}).textContent || "",
      chips: document.querySelectorAll("#main .ls .chip").length,
      hard: Array.from(document.querySelectorAll("#main .ls .lss.hard")).length,
      firstHard: (document.querySelector("#main .ls .lss.hard") || {}).textContent || "",
      upOff: (document.querySelector('#main [data-act="lang-up"]') || {}).disabled,
    }`);
    check(screen.codes.join(",").slice(0, 11) === "EN,PL,DE,UK" && screen.chips === 1
          && screen.chip === "Primary" && screen.upOff === true,
      "5a the section lists every declared language in order with the first marked primary and"
      + " its up arrow dead: " + screen.codes.length + " row(s), " + screen.chips + " chip");
    /* AT THIS PIN THE SENTENCE IS NOT SAID, AND THAT IS THE POINT OF IT. Until 32af894 the pin
       refused fourteen of these sixteen at load and every one of those rows carried the refusal;
       the storage is open now, the desk reads all sixteen, and a screen still promising a
       refusal would be telling the owner a lie about their own catalog. Nothing in ui/app.js
       moved for it: the paragraph hangs on `r.readable` and `r.readable` asks the pin. */
    check(screen.hard === 0,
      "5b and none of the " + screen.codes.length + " carries the engine's refusal, "
      + screen.hard + " of " + screen.codes.length + ", because this pin reads every code a"
      + " catalog declares"
      + (screen.hard ? ": " + JSON.stringify(screen.firstHard.slice(0, 70)) : ""));

    /* EVERY CONTROL OF A LANGUAGE'S ROW IS INSIDE ITS PANE (polish 04, item 10): the primary's
       row carries a chip more than the others and put Remove past the pane's edge. */
    const pastPane = [];
    for (const w of [1280, 1180, 1100]) {
      await page.evaluate((px) => { document.querySelector("#screen").style.width = px + "px"; }, w);
      await sleep(200);
      (await state(`Array.from(document.querySelectorAll("#main .ls button"))
        .filter(b => b.getBoundingClientRect().right > b.closest(".pane").getBoundingClientRect().right + 0.5)
        .map(b => b.textContent)`)).forEach(t => pastPane.push(w + ":" + t));
    }
    await page.evaluate(`document.querySelector("#screen").style.width = ""`);
    check(pastPane.length === 0,
      "5b1 every button on the " + screen.codes.length + " rows ends inside the pane at 1280, 1180"
      + " and 1100px: " + pastPane.length + " past it " + JSON.stringify(pastPane));

    /* THE CONTROL FOR 5b, AT THE LAYER WHERE 646 ACTUALLY LANDED. An empty screen would pass
       5b, and so would a Studio that had quietly decided every language is the engine's own. So
       the model behind the rows is read: all sixteen READABLE, and exactly the two the engine
       has grammar of its own for GRAMMARED. Those two flags were one answer while the storage
       was closed with the grammar and they part at 646, which is the whole of what the pin move
       changed here and the one thing the screen does not show. */
    const wideDraft = read(path.join(wide.dir, DRAFT_FILE));
    const L16 = S.langState(wideDraft);
    const readable = L16.rows.filter((r) => r.readable).length;
    const grammared = L16.rows.filter((r) => r.grammared).map((r) => r.code);
    check(readable === 16 && grammared.join(",") === "en,pl" && L16.refusesOthers === false,
      "5b2 CONTROL: behind those rows the two questions have parted - " + readable + " of "
      + L16.rows.length + " readable by this pin, and " + JSON.stringify(grammared)
      + " with grammar of the engine's own");

    /* THE ROW, AT STUDIO'S OWN MINIMUM AND NOT THE ENGINE'S. Every child's right edge against
       the row's content box, because scrollWidth is the row's own arithmetic and a child that
       hangs out of a wrapped flex line is what is actually being ruled out. */
    const measure = `(() => {
      const bar = document.querySelector("#chrome");
      const cs = getComputedStyle(bar);
      const box = bar.getBoundingClientRect();
      const right = box.right - parseFloat(cs.paddingRight);
      const kids = Array.from(bar.children);
      const items = Array.from(bar.querySelectorAll(".seg.langs span"));
      const q = document.querySelector("#chrome #q");
      return {
        w: Math.round(box.width),
        over: bar.scrollWidth - bar.clientWidth,
        out: kids.filter(e => e.getBoundingClientRect().right > right + 0.5).length,
        itemsOut: items.filter(e => e.getBoundingClientRect().right > right + 0.5).length,
        items: items.length,
        last: items.length ? items[items.length - 1].textContent : "",
        qW: Math.round(q.getBoundingClientRect().width),
        segW: Math.round(bar.querySelector(".seg.langs").getBoundingClientRect().width),
        h: Math.round(box.height),
      };
    })()`;
    /* THE WIDTH IS PUT ON THE SCREEN ELEMENT RATHER THAN ON THE WINDOW. The door launches this
       window offscreen at its own size, and resizing a frameless Electron window from a gate is
       the shell's business rather than the page's; what the row actually responds to is the
       width of the box it lays out in, so the box is set to 900 and the row measured in it.
       The number is Studio's own minimum from shell/main.js and not the engine's 546. */
    await page.evaluate(`document.querySelector("#screen").style.width = "900px"`);
    await sleep(250);
    const at900 = await state(measure);
    check(at900.items === 17 && at900.over === 0 && at900.out === 0 && at900.itemsOut === 0
          && at900.qW >= 180,
      "5c at Studio's own 900px minimum with sixteen declared languages the row clips nothing:"
      + " " + at900.items + " items, overflow " + at900.over + "px, " + at900.itemsOut
      + " item(s) past the content box, search field " + at900.qW + "px");
    check(at900.last === "All",
      "5d and the last item reads All rather than Both, which is simply wrong of sixteen and is"
      + " the dual in Polish: " + JSON.stringify(at900.last));

    /* THE CONTROL, AND IT IS A MUTATION RATHER THAN AN ABSENCE. The two rules added for this
       item are taken off in the page and the same measurement is repeated: if the row could not
       overflow anyway, 5c proves nothing. */
    const before5 = await page.evaluate(`(() => {
      document.querySelector("#chrome #q").style.minWidth = "0px";
      document.querySelector("#chrome .seg.langs").style.flexWrap = "nowrap";
      return true;
    })()`);
    await sleep(250);
    const bare = await state(measure);
    check(before5 && bare.over > 0 && bare.qW < 180,
      "5e CONTROL: with the field's floor and the segment's wrap taken off in the page, the same"
      + " row at the same width overflows by " + bare.over + "px with the search field down to "
      + bare.qW + "px, which is what 5c is preventing");

    /* AND THE ORDINARY CASE IS UNTOUCHED. Claudia measured the segment at 127px at two declared
       languages and 165 at three on 2026-09-20; if either rule had moved a pixel there, this is
       where it would show. */
    await page.evaluate(`document.querySelector("#chrome .seg.langs").style.flexWrap = "";
      document.querySelector("#chrome #q").style.minWidth = "";`);
    /* Back to the one-language project, whose own settings screen removed every language but
       English in section 3, so the row has no segment at all to measure. */
    await pressWhen(page, '[data-act="to-projects"]', { who: "tests/langs.mjs" });
    await sleep(500);
    await pressWhen(page, '[data-act="open"]', { who: "tests/langs.mjs", attr: ["data-dir", dir] });
    await sleep(900);
    await page.evaluate(`document.querySelector("#screen").style.width = "900px"`);
    await sleep(250);
    const one = await state(`(() => {
      const seg = document.querySelector("#chrome .seg.langs");
      return { seg: seg ? Math.round(seg.getBoundingClientRect().width) : 0,
               langs: window.STUDIO_READY && window.STUDIO_READY.langs || 0 };
    })()`);
    check(one.seg === 0,
      "5f and a catalog of one declared language shows no segment at all, which is what it did"
      + " before this item: " + one.seg + "px");

    /* AND THE SCREEN ITSELF AT A REAL 900px VIEWPORT, which is not the same question as the box
       being 900 wide: `.cols` is a media query on the VIEWPORT, so an element squeezed inside a
       wide window keeps two columns while a person with a narrow window has one. Measured the
       wrong way first, and the two-column pane did clip its own buttons. */
    await page.evaluate(`document.querySelector("#screen").style.width = ""`);
    await pressWhen(page, '[data-act="to-projects"]', { who: "tests/langs.mjs" });
    await sleep(500);
    await pressWhen(page, '[data-act="open"]', { who: "tests/langs.mjs", attr: ["data-dir", wide.dir] });
    await sleep(900);
    await press('[data-act="section"][data-v="settings"]', 500);
    await page.setViewport({ width: 900, height: 700, deviceScaleFactor: 1 });
    await sleep(500);
    const narrow = await state(`(() => {
      const pane = document.querySelector("#main .ls").getBoundingClientRect();
      const kids = Array.from(document.querySelectorAll("#main .ls .btn"));
      return { over: kids.filter(e => e.getBoundingClientRect().right > pane.right + 0.5).length,
               of: kids.length,
               cols: getComputedStyle(document.querySelector("#main .cols"))
                 .gridTemplateColumns.split(" ").length };
    })()`);
    check(narrow.cols === 1 && narrow.of > 40 && narrow.over === 0,
      "5g and at a 900px VIEWPORT the two panes stack into one column and none of the "
      + narrow.of + " control(s) on sixteen language rows falls outside it ("
      + narrow.over + ")");

    /* ---- 6. the second ask on the screen, on the row that would become the primary ----------- */
    await page.setViewport({ width: 1300, height: 900, deviceScaleFactor: 1 });
    await press('[data-act="to-projects"]', 500);
    await pressWhen(page, '[data-act="open"]', { who: "tests/langs.mjs", attr: ["data-dir", ask.dir] });
    await sleep(900);
    await press('[data-act="section"][data-v="settings"]', 500);
    const shotBefore = bytes(askAt);
    await press('#main [data-act="lang-down"][data-v="en"]', 600);
    await settleOn(page, '!!document.querySelector("#main .ls .lsgo")', { bound: 30000 });
    const block = await state(`(() => {
      const b = document.querySelector("#main .ls .lsgo");
      const row = b ? b.parentElement.querySelector(".lsk") : null;
      return { on: row ? row.textContent : "", text: b ? b.textContent : "",
               codes: Array.from(document.querySelectorAll("#main .ls .lsk")).map(e => e.textContent) };
    })()`);
    check(block.on === "PL" && /Without text in this one: 1 card\./.test(block.text)
          && block.codes.join(",") === "EN,PL" && Buffer.compare(shotBefore, bytes(askAt)) === 0,
      "6a one press opens the block on the row that would become the primary, naming the card,"
      + " and the file is untouched: " + JSON.stringify(block));
    await press('#main [data-act="lang-primary-go"]', 900);
    await settleOn(page, 'Array.from(document.querySelectorAll("#main .ls .lsk")).map(e => e.textContent).join(",") === "PL,EN"', { bound: 30000 });
    const made = await state(`Array.from(document.querySelectorAll("#main .ls .lsk")).map(e => e.textContent)`);
    check(made.join(",") === "PL,EN" && read(askAt).langs.map((l) => l.code).join(",") === "pl,en"
          && !(await state(`!!document.querySelector("#main .ls .lsgo")`)),
      "6b and Make it the primary moves it, on the screen and in the file: " + JSON.stringify(made));

    /* ---- 7. the cards table follows the declaration (sense pass items 23 and 24) -------------
       A third language added, and the table read with Polish primary: one column per declared
       language in its order, and a card with no Polish title named by its English one rather
       than by its id. */
    await S.addLang(ask.dir, "uk");
    await press('[data-act="to-projects"]', 500);
    await pressWhen(page, '[data-act="open"]', { who: "tests/langs.mjs", attr: ["data-dir", ask.dir] });
    await sleep(900);
    await press('[data-act="section"][data-v="cards"]', 500);
    await page.setViewport({ width: 1700, height: 900, deviceScaleFactor: 1 });
    await sleep(400);
    const table = await state(`{
      who: !!document.querySelector('#rail [data-v="who"]'),
      ths: Array.from(document.querySelectorAll("#main table th")).filter(e => e.offsetWidth > 0)
        .map(e => e.textContent),
      heads: Array.from(document.querySelectorAll("#main table th[data-lang]")).map(e => e.getAttribute("data-lang")),
      cells: Array.from(document.querySelectorAll("#main table tr.pick:first-of-type td[data-lang], #main table tr.pick td[data-lang]"))
        .slice(0, 3).map(e => e.getAttribute("data-lang") + ":" + e.className),
      title: (document.querySelector("#main table tr.pick td.t-title") || {}).textContent || "",
      shelf: (document.querySelector("#main table tr.pick td:nth-child(3)") || {}).textContent || "" }`);
    check(table.heads.join(",") === "pl,en,uk" && table.cells.join(",") === "pl:miss,en:miss,uk:miss"
          && table.title === "Plasule widuma" && table.shelf === "Zubynt ondrave",
      "7a the cards table has a column per declared language in its order and names a card and"
      + " its category in the first language that has words: " + JSON.stringify(table));
    check(table.ths.length > 0 && table.ths.every(h => !/^who$/i.test(h.trim())) && !table.who,
      "7b and from 1600px the table carries no Who column, nor the rail a Who is writing row,"
      + " which format 2 has nothing to fill (item 26): " + JSON.stringify(table.ths));
  } finally {
    await studio.shut();
  }
  await sleep(300);

  if (!keep) dropScratch(SCRATCH, "langs");
  process.stdout.write("langs  " + asserted + " assertion(s), " + failed + " failure(s)\n");
  process.stdout.write("RESULT: " + (failed ? "FAIL" : "PASS") + "\n");
  process.exit(failed ? 1 : 0);
}

main(process.argv.slice(2)).catch((e) => {
  process.stderr.write("langs  " + (e && e.stack ? e.stack : String(e)) + "\n");
  process.exit(2);
});
