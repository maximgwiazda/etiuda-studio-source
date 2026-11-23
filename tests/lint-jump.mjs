/* EVERY FINDING THE PINNED LINTER MAKES OPENS THE THING IT NAMES, WITH THE FIELD FOCUSED.
 *
 *     node tests/lint-jump.mjs [--keep]
 *
 * ONE PROJECT PER RULE, AND THE FIXTURES ARE THE HARNESS'S OWN. tests/lint-pairs holds a catalog
 * that fails exactly one rule of spec 3.4 and a clean twin, and tests/lint-pairs.mjs already
 * proves which of those rules the pinned linter actually has. This leg takes the seven that
 * fire, plants each as a project, opens the lint list in a real window and presses Jump on the
 * finding: what it measures is where the window landed and what the caret is in. Two more
 * fixtures are written here for the two targets that are not a card - an intent and a category -
 * because no fixture in that folder produces either.
 *
 * THE MEASUREMENT IS document.activeElement, not the code's intention. A jump that switched the
 * section and left the caret nowhere looks exactly like one that worked, from the outside, so
 * the focused element is read back and its own data attributes are what the assertion names.
 *
 * THE TWO FINDINGS WITH NO TARGET ARE HALF THE POINT. `who: duplicate entry` and the {WHO} token
 * name no single card, and the parse is timid on purpose: they get NO Jump button rather than
 * one that lands somewhere plausible. A leg that only checked the seven that work would pass
 * just as well against a screen that guessed at the other two.
 */
import "./licensed-env.mjs";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { openStudio } from "./shell-door.mjs";
import * as Engine from "../src/engine.mjs";
import { json, PROJECT_FILE, DRAFT_FILE } from "../src/publish.mjs";
import { clearScratch, dropScratch } from "./scratch.mjs";
import { pressWhen, settleOn } from "./press.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const PAIRS = path.join(HERE, "lint-pairs");
const SCRATCH = path.join(ROOT, "scratch", "lint-jump");

let asserted = 0, failed = 0;
function check(cond, line) {
  asserted++;
  if (cond) process.stdout.write("  ok   " + line + "\n");
  else { failed++; process.stderr.write("  FAIL " + line + "\n"); }
}
const sleep = ms => new Promise(r => setTimeout(r, ms));

/* ---- the fixtures ---------------------------------------------------------------------------
 *
 * Seven from the harness's own folder, and two written here. Each row says what the pinned
 * linter is expected to say and where pressing Jump must land: the section, the thing's id, and
 * the `data-` attributes of the control the caret must end up in. `focus: null` means the
 * finding must have no Jump button at all.
 */
const WANT = [
  { key: "dangling-category-ref", says: /^card c-farlil: shelf t-nowhere names no tag$/,
    section: "cards", id: "c-farlil", focus: { f: "shelf" } },
  { key: "dangling-intent-ref", says: /^card c-tosan: requests names t-nowhere, which is no tag$/,
    section: "cards", id: "c-tosan", focus: { id: "intentFind" } },
  { key: "duplicate-card-id", says: /^card c-tosan: the id is claimed twice$/,
    section: "cards", id: "c-tosan", focus: {} },
  { key: "duplicate-card-title", says: /^card 3 \("Tosan widil"\): same title as card 1 in this category, /,
    section: "cards", id: "c-thelork", focus: { f: "title", l: "en" } },
  /* A FINDING ABOUT THE POLISH OF ONE CARD, which is what leg 2a needs and what the pin move to
     4c377cb took away: before engine 505 a card lacking Polish was an error per card and this
     was that row. The bare-preposition warning is the same shape - named by index, about the
     Polish body of one card, mapped to { body, pl } by src/studio.mjs's fieldOf - and it is a
     rule the engine still has, so the jump it asks for is the jump that row asked for. */
  { key: "polish-bare-preposition",
    says: /^card 1: Polish body puts a bare "z" in front of \{INTENT\}/,
    section: "cards", id: "c-tosan", focus: { f: "body", l: "pl" } },
  { key: "duplicate-role-entry", says: /^who: duplicate entry "vornil"$/,
    section: null, id: null, focus: null },
  { key: "legacy-role-token", says: /^\{WHO\} token in 1 place\(s\)/,
    section: null, id: null, focus: null },
  /* BOTH WORDINGS, because the engine generalised this rule at 646 and the sentence changed
     with it: "has no Polish clause" before, "has no PL clause" since, both ending "- invisible
     in PL mode". The leg is about where Jump lands, not about the engine's prose, so it accepts
     either and src/studio.mjs reads the code off the half that did not move. */
  { key: "intent-without-polish", says: /^intent 1 \("a widesk"\) has no (?:Polish|PL) clause/,
    section: "intents", id: "t-widesk", focus: { tag: "t-widesk", l: "pl" } },
  { key: "reserved-category-key", says: /^"fav" is a reserved category key/,
    section: "categories", id: "fav", focus: { tag: "fav" } },
  /* A CATEGORY MISSING ITS POLISH NAME (bug hunt 3, item 18) opens that name. The window shows
     the category's name where the engine wrote its id, so the pattern holds for either. */
  { key: "category-without-polish",
    says: /^(?:categoriesPl|PL) covers 1 of 2 categories; the rest fall back to EN: (?:t-glemule|Glemule)$/,
    section: "categories", id: "t-glemule", focus: { tag: "t-glemule", l: "pl" } },
  /* STUDIO'S OWN RULE, stricter than the pin's warning (src/placeholders.mjs unknownTokens): the
     tour's old spelling, in the English of one card, opens that body. */
  { key: "misspelt-placeholder",
    says: /^card c-tosan \(en\): \{agent\} is not a variable the desk fills; the desk fills \{AGENT\}$/,
    section: "cards", id: "c-tosan", focus: { f: "body", l: "en" } },
];

/* WHICH VERDICT THE PINNED ENGINE GIVES A LANGUAGE CARDS LACK, read off the shape of its own
   return and never off the pin's hash - the probe src/import.mjs and tests/import.mjs use, for
   the reason given there. Before engine 505 it was one error per card, with a jump into that
   card's Polish body; since 505 it is the awaiting class, which names no card and is not a
   fault, so there is no row in the lint list and nothing to press. Both are asserted, one per
   shape: the row below joins WANT on an older pin, and leg 0b below holds the newer one to the
   absence AND to the state being somewhere rather than lost. */
const CLASSES_AWAITING = Array.isArray(Engine.lint().lintCatalog(null).awaiting);
const MISSING_PL = {
  key: "missing-second-language", says: /^card 2 \("Farlil zubork"\): Polish \(pl\) is required$/,
  section: "cards", id: "c-farlil", focus: { f: "body", l: "pl" },
};
if (!CLASSES_AWAITING) WANT.splice(4, 0, MISSING_PL);

/** The two this leg writes itself, both grown from a fixture next door so that the one fault is
 *  the only difference from a catalog the pinned linter is silent on. */
function ownFixtures() {
  const base = JSON.parse(fs.readFileSync(path.join(PAIRS, "duplicate-card-title.good.json"), "utf8"));
  const noPl = JSON.parse(JSON.stringify(base));
  const widesk = noPl.tags.find(t => t.id === "t-widesk");
  delete widesk.clause.pl;                      /* the primary clause stays, so the file reads */
  const fav = JSON.parse(JSON.stringify(base));
  const first = fav.tags.find(t => t.kind === "shelf");
  fav.cards.forEach(c => { if (c.shelf === first.id) c.shelf = "fav"; });
  first.id = "fav";
  /* The bare preposition, in the first card's Polish body and nowhere else, so the one warning
     the linter makes about this catalog is the one this leg presses. */
  const bare = JSON.parse(JSON.stringify(base));
  bare.cards[0].body.pl = bare.cards[0].body.pl + " z {INTENT}.";
  const agent = JSON.parse(JSON.stringify(base));
  agent.cards[0].body.en = agent.cards[0].body.en + " {agent}";
  const catNoPl = JSON.parse(JSON.stringify(base));
  delete catNoPl.tags.find(t => t.id === "t-glemule").label.pl;
  return { "intent-without-polish": noPl, "reserved-category-key": fav,
           "category-without-polish": catNoPl,
           "polish-bare-preposition": bare, "misspelt-placeholder": agent };
}

function plant(root, key, catalog) {
  const dir = path.join(root, key);
  const share = path.join(dir, "share");
  fs.mkdirSync(share, { recursive: true });
  fs.writeFileSync(path.join(dir, DRAFT_FILE), json(catalog), "utf8");
  fs.writeFileSync(path.join(dir, PROJECT_FILE),
    json({ id: catalog.id, name: key, rev: 0, edition: "", draft: DRAFT_FILE, folder: share }),
    "utf8");
  return dir;
}

async function main(argv) {
  const keep = argv.indexOf("--keep") >= 0;
  clearScratch(SCRATCH);
  const projects = path.join(SCRATCH, "projects");
  fs.mkdirSync(projects, { recursive: true });

  const own = ownFixtures();
  const dirs = {};
  for (const w of WANT) {
    const at = path.join(PAIRS, w.key + ".bad.json");
    const cat = own[w.key] || JSON.parse(fs.readFileSync(at, "utf8"));
    dirs[w.key] = plant(projects, w.key, cat);
  }

  /* The findings, read in node before any window opens: if the pinned linter does not say what
     this leg expects it to say, the fault is the fixture or the pin, and saying so here is
     clearer than a jump that has nothing to press. */
  const S = await import("../src/studio.mjs");
  const said = {};
  for (const w of WANT) {
    const draft = JSON.parse(fs.readFileSync(path.join(dirs[w.key], DRAFT_FILE), "utf8"));
    const rows = S.findings(draft).rows.filter(r => w.says.test(r.why));
    said[w.key] = rows;
  }
  const missing = WANT.filter(w => said[w.key].length !== 1).map(w => w.key);
  check(missing.length === 0, "0a the pinned linter says each of the " + WANT.length
    + " expected things exactly once, over its own fixtures and those written here"
    + (missing.length ? ": " + missing.join(", ") + " did not" : ""));
  if (missing.length) {
    process.stderr.write("lint-jump  " + asserted + " assertion(s), " + failed + " failure(s)\n");
    process.exit(1);
  }

  /* ---- 0d to 0f: the placeholder rule's reach, in node --------------------------------------
     The clean twin of the harness's own pair is silent; a near miss names the token the desk
     fills and a stranger names none; and a publish refuses on the line as it does on any error. */
  const pairOf = (k) => S.findings(JSON.parse(fs.readFileSync(path.join(PAIRS, k), "utf8")))
    .rows.filter(r => /is not a variable the desk fills/.test(r.why)).map(r => r.why);
  const good = pairOf("unknown-placeholder.good.json"), bad = pairOf("unknown-placeholder.bad.json");
  check(good.length === 0 && bad.length === 2 && bad.every(l => /\{VORNIL\}.*as written$/.test(l)),
    "0d the clean twin of lint-pairs' unknown-placeholder is silent and its failing partner gives"
    + " one line per language naming no nearest token: " + JSON.stringify(bad));
  const probe = JSON.parse(fs.readFileSync(path.join(PAIRS, "duplicate-card-title.good.json"), "utf8"));
  probe.cards[1].body.pl = probe.cards[1].body.pl + " {AGNET} {GREET} {{ticket.id}}";
  const near = S.findings(probe).rows.filter(r => /is not a variable/.test(r.why));
  check(near.length === 2 && /^card c-farlil \(pl\): \{AGNET\} .*fills \{AGENT\}$/.test(near[0].why)
        && near[0].severity === "error"
        && /^card c-farlil \(pl\): \{\{ticket\.id\}\} .*as written$/.test(near[1].why),
    "0e a transposed {AGNET} is an error naming {AGENT}, {GREET} is left alone, and a platform"
    + " moustache the desk cannot fill is an error of its own: " + JSON.stringify(near.map(r => r.why)));
  /* A HELPDESK'S OWN TOKEN LEFT IN A CARD reaches the customer as written (Studio polish 04,
     item 3); the importer flagged it once, and nothing flagged it after. */
  const plat = JSON.parse(fs.readFileSync(path.join(PAIRS, "duplicate-card-title.good.json"), "utf8"));
  plat.cards[0].body.en = plat.cards[0].body.en
    + " {{ ticket.requester.first_name }} %%ticket_id%% $(agent.name)";
  const platRows = S.findings(plat).rows.filter(r => /is not a variable/.test(r.why));
  const platId = plat.cards[0].id;
  check(platRows.length === 3 && platRows.every(r => r.severity === "error" && r.card === platId
          && r.go && r.go.field === "body" && r.go.lang === "en")
        && /\{\{ ticket\.requester\.first_name \}\} .*the desk fills \{PAX\}$/.test(platRows[0].why)
        && /%%ticket_id%% .*as written$/.test(platRows[1].why)
        && /\$\(agent\.name\) .*the desk fills \{AGENT\}$/.test(platRows[2].why),
    "0h a helpdesk's own token in a body is an error that opens that body, naming the desk's"
    + " token where the importer has one: " + JSON.stringify(platRows.map(r => r.why)));
  /* A ROW ABOUT A CARD IS PLACED BY ITS TITLE, as the table names it (sense pass item 25),
     where the reader's sentence names it by id. */
  const agentDraft = JSON.parse(fs.readFileSync(path.join(dirs["misspelt-placeholder"], DRAFT_FILE), "utf8"));
  const placed = S.findings(agentDraft).rows.filter(r => r.card === "c-tosan");
  check(placed.length === 1 && placed[0].where === agentDraft.cards[0].title.en,
    "0g and the row's Where is the card's title, not its id: " + JSON.stringify(placed.map(r => r.where)));
  /* ONE TOKEN, ONE ROW. The pin warns about a token no desk fills; where Studio's error names it,
     on that card in that language, the warning goes, and a moustache's inside goes with it. A
     form only the engine refuses, a bare {DAYPART}, is named by nothing of Studio's and stays. */
  const twice = JSON.parse(fs.readFileSync(path.join(PAIRS, "duplicate-card-title.good.json"), "utf8"));
  twice.cards[0].body.en = twice.cards[0].body.en + " {agent} {DAYPART}";
  twice.cards[0].body.pl = twice.cards[0].body.pl + " {{name}}";
  const onceRows = S.findings(twice).rows.filter(r => r.card === twice.cards[0].id);
  const toks = (sev) => onceRows.filter(r => r.severity === sev)
    .map(r => (/\{\{?[A-Za-z][^{}]*\}\}?/.exec(r.why) || [""])[0]);
  const dayRow = onceRows.find(r => r.severity === "warning") || {};
  check(JSON.stringify(toks("error")) === JSON.stringify(["{agent}", "{{name}}"])
        && JSON.stringify(toks("warning")) === JSON.stringify(["{DAYPART}"])
        && !!dayRow.go && dayRow.go.field === "body" && dayRow.go.lang === "en",
    "0j each unknown token is one row: {agent} and {{name}} as Studio's errors and not again as"
    + " the pin's warnings, and the bare {DAYPART} only the pin refuses as its warning, which"
    + " opens the English body: " + JSON.stringify(onceRows.map(r => r.severity + " " + r.why))
    + " " + JSON.stringify(dayRow.go));

  /* THE ROW SAYS THE LANGUAGE AND THE CATEGORY BY NAME (bug hunt 3, item 18), where the engine's
     line says its field `categoriesPl` and the tag's id; `why` keeps the engine's line. */
  const catRow = said["category-without-polish"][0];
  check(catRow.what === "PL covers 1 of 2 categories; the rest fall back to EN: Glemule"
        && /^categoriesPl covers .*: t-glemule$/.test(catRow.why)
        && JSON.stringify(catRow.go) === JSON.stringify({ section: "categories", id: "t-glemule",
          field: "label", lang: "pl" }),
    "0k a category missing its Polish name is said by language and name, and jumps to that name: "
    + JSON.stringify({ what: catRow.what, go: catRow.go }));

  /* ---- 0i: every finding is a frame a Polish screen can say (polish 04, item 9) -------------
     Over every fixture above and the three written here, each row of the lint list carries a
     frame, the frame gives back the very line the linter wrote, and every frame src/lint-said.mjs
     knows is a pair in ui/lang.js. A pin whose wording moved turns this red, not a screen English. */
  const LS = await import("../src/lint-said.mjs");
  const R = await import("../src/refusal.mjs");
  const plain = [], wrong = [];
  const allDrafts = Object.keys(dirs).map(k => JSON.parse(fs.readFileSync(path.join(dirs[k], DRAFT_FILE), "utf8")))
    .concat([probe, plat, twice]);
  allDrafts.forEach(d => S.findings(d).rows.filter(r => r.severity !== "awaiting").forEach(r => {
    if (!r.said) plain.push(r.why);
    else if (R.say(r.said.frame, r.said.vars) !== r.what) wrong.push(r.why);
  }));
  const langText = fs.readFileSync(path.join(ROOT, "ui", "lang.js"), "utf8");
  const unpaired = LS.LINT_FRAMES.map(([f]) => f)
    .filter(f => langText.indexOf(JSON.stringify(f) + ":") < 0);
  check(plain.length === 0 && wrong.length === 0 && unpaired.length === 0,
    "0i every finding of " + allDrafts.length + " fixtures is a frame that rebuilds its line, and"
    + " all " + LS.LINT_FRAMES.length + " frames are pairs: " + plain.length + " plain "
    + JSON.stringify(plain.slice(0, 2)) + ", " + wrong.length + " rebuilt wrong, "
    + unpaired.length + " unpaired " + JSON.stringify(unpaired.slice(0, 2)));
  const P = await import("../src/publish.mjs");
  let refusedPub = null;
  try { await P.publishFull({ project: dirs["misspelt-placeholder"],
                              folder: path.join(SCRATCH, "out") }); }
  catch (e) { refusedPub = e; }
  check(refusedPub && refusedPub.refusal === "lint"
        && refusedPub.lint.errors.some(l => /\{agent\} is not a variable/.test(l))
        && !refusedPub.lint.warnings.some(l => /\{agent\}/.test(l))
        && !fs.existsSync(path.join(SCRATCH, "out")),
    "0f publish refuses on it, says it once, and writes nothing: "
    + (refusedPub ? String(refusedPub.message).split("\n")[1] : "it published"));

  /* ---- 0b and 0c: WHAT THE STATE IS IN THIS LIST, boards 510, 544 and 548 -------------------
     Since engine 505 a card lacking its second language is a state and not a fault, and until
     2026-09-19 that meant the lint list said nothing about it at all: the row above left WANT at
     the pin move and this leg held the list to the silence. Maxim ruled the other half of it on
     2026-09-19 (board 544): the state is a THIRD KIND in this list, told apart by a dashed pill
     rather than by a word. What the silence could not cover is that a list counting a thing it
     does not show is what let the rail say two while eight cards waited.

     THREE CLAIMS. It is in the list; it names no card and offers no Jump, because it is one
     finding however many cards it covers; and it names exactly the cards the engine's own count
     covers, which is what a screen needs before it can mark a row. */
  let awaitDir = null;
  if (CLASSES_AWAITING) {
    awaitDir = plant(projects, MISSING_PL.key,
      JSON.parse(fs.readFileSync(path.join(PAIRS, MISSING_PL.key + ".bad.json"), "utf8")));
    const opened = await S.openProject(awaitDir);
    const rows = opened.lint.rows;
    const wait = rows.filter(r => r.severity === "awaiting");
    check(rows.length === 1 && wait.length === 1 && wait[0].lang === "pl"
          && wait[0].cards === 1 && !wait[0].go && !wait[0].card,
      "0b a card lacking its second language is one row of a third kind in the lint list, naming"
      + " no card and offering no jump: " + rows.length + " row(s), "
      + JSON.stringify(wait.map(r => r.severity + " " + r.lang + " over " + r.cards
        + " card(s), jump " + JSON.stringify(r.go))));
    check(wait.length === 1 && (wait[0].ids || []).join("|") === "c-farlil"
          && opened.lint.errors + opened.lint.warnings + opened.lint.awaiting === rows.length,
      "0c and it names the card the engine counted, the one of the two whose Polish body is"
      + " empty: " + JSON.stringify((wait[0] || {}).ids) + ", with the rail's own arithmetic"
      + " over the same rows (" + opened.lint.errors + " + " + opened.lint.warnings + " + "
      + opened.lint.awaiting + " = " + rows.length + ")");
  }

  const studio = await openStudio("tests/lint-jump.mjs", { words: true,
    projects, userDataDir: path.join(SCRATCH, "ud"),
  });

  let cover = null, shown = null;
  const landed = {};
  try {
    const page = studio.page;
    const press = async (sel, ms) => {
      await pressWhen(page, sel, { who: "tests/lint-jump.mjs" });
      await sleep(ms || 350);
    };
    const state = async (js) => JSON.parse(await page.evaluate("JSON.stringify(" + js + ")"));

    /* WHERE THE WINDOW IS AND WHAT THE CARET IS IN, in one read, and every part of it taken
       from the document rather than from the program's own idea of itself. */
    const WHERE = `(() => {
      const a = document.activeElement || {};
      const row = document.querySelector("#main tr.sel");
      return {
        screen: (window.STUDIO_READY || {}).screen || "",
        lang: (document.querySelector('.seg span.on[data-act="lang"]') || {}).textContent || "",
        card: row ? row.getAttribute("data-id") : "",
        title: (document.querySelector("#main .pane h3.t") || {}).textContent || "",
        id: a.id || "",
        tagName: a.tagName || "",
        f: a.getAttribute ? (a.getAttribute("data-f") || "") : "",
        l: a.getAttribute ? (a.getAttribute("data-l") || "") : "",
        tag: a.getAttribute ? (a.getAttribute("data-tag") || "") : "",
        act: a.getAttribute ? (a.getAttribute("data-act") || "") : "",
        value: a.value == null ? "" : String(a.value).slice(0, 40),
      };
    })()`;

    for (const w of WANT) {
      await press('[data-act="to-projects"]', 400);
      await press('[data-act="open"][data-dir="' + dirs[w.key].replace(/\\/g, "\\\\") + '"]', 800);
      await press('[data-act="section"][data-v="lint"]', 500);
      await settleOn(page, '(window.STUDIO_READY || {}).screen === "lint"', { bound: 30000 });
      const rows = await state(`Array.from(document.querySelectorAll("#main tbody tr, #main table tr"))
        .slice(1).map(tr => ({
          why: (tr.querySelector("td.wide-only") || {}).textContent || "",
          jump: !!tr.querySelector('[data-act="jump"]'),
          sec: (tr.querySelector('[data-act="jump"]') || {}).getAttribute
             ? tr.querySelector('[data-act="jump"]').getAttribute("data-sec") : "",
        }))`);
      const mine = rows.filter(r => w.says.test(r.why));
      if (mine.length !== 1) throw new Error(w.key + ": the lint list shows " + mine.length
        + " row(s) matching, of " + rows.length);
      if (!w.focus) { landed[w.key] = { jump: mine[0].jump }; continue; }
      const n = await page.evaluate((re) => {
        const rx = new RegExp(re);
        const tr = Array.from(document.querySelectorAll("#main table tr"))
          .find(x => rx.test((((x.querySelector("td.wide-only") || {}).textContent) || "")
            .replace(/\u00a0/g, " ")));
        const b = tr && tr.querySelector('[data-act="jump"]');
        if (!b) return false;
        b.click(); return true;
      }, w.says.source);
      if (!n) throw new Error(w.key + ": the matching row has no Jump button");
      await sleep(500);
      landed[w.key] = Object.assign({ jump: true }, await state(WHERE));
    }

    /* ---- the chrome row at Studio's 900px minimum (polish 04, item 11) ----------------------
       The lint's filter joins the row on this section; the row must stay one row, as tall as it
       is on the cards section at the same width. */
    await page.evaluate(`document.querySelector("#screen").style.width = "900px"`);
    await press('[data-act="section"][data-v="cards"]', 500);
    await settleOn(page, '(window.STUDIO_READY || {}).screen === "cards"', { bound: 30000 });
    const rowOn = `(() => { const b = document.querySelector("#chrome").getBoundingClientRect();
      const s = document.querySelector("#chrome .seg:not(.langs)") || document.querySelector("#chrome .seg");
      return { h: Math.round(b.height), segH: s ? Math.round(s.getBoundingClientRect().height) : 0 }; })()`;
    const onCards = await state(rowOn);
    await press('[data-act="section"][data-v="lint"]', 500);
    await settleOn(page, '(window.STUDIO_READY || {}).screen === "lint"', { bound: 30000 });
    const onLint = await state(rowOn);
    await page.evaluate(`document.querySelector("#screen").style.width = ""`);
    check(onLint.h === onCards.h && onLint.segH < 40,
      "1c at 900px the chrome row on the lint list is " + onLint.h + "px, as on the cards section ("
      + onCards.h + "px), and its filter is one line (" + onLint.segH + "px)");

    /* ---- the third kind's own act, driven on the screen (board 544) -------------------------
       The row names no card, so what it offers instead is the cards it covers: it narrows the
       cards table to them and lands where cards are. Measured on the table itself - which rows
       are there and which carry the mark - rather than on the program's idea of its own state,
       because a filter that switched the section and narrowed nothing looks the same from the
       outside as one that worked. */
    if (awaitDir) {
      await press('[data-act="to-projects"]', 400);
      await press('[data-act="open"][data-dir="' + awaitDir.replace(/\\/g, "\\\\") + '"]', 800);
      await press('[data-act="section"][data-v="lint"]', 500);
      await press('[data-act="await-show"]', 600);
      await settleOn(page, '(window.STUDIO_READY || {}).screen === "cards"', { bound: 30000 });
      shown = await state(`{
        screen: (window.STUDIO_READY || {}).screen || "",
        strip: (document.querySelector("#main .pad > .strip span") || {}).textContent || "",
        rows: Array.from(document.querySelectorAll("#main table tr.pick"))
          .map(tr => tr.getAttribute("data-id")),
        marked: Array.from(document.querySelectorAll("#main table tr.pick.await"))
          .map(tr => tr.getAttribute("data-id")),
        rail: (document.querySelector('#rail a[data-v="lint"] .num') || {}).textContent || "",
      }`);
    }

    /* ---- the override note, on the cover where it is written ---------------------------------- */
    await press('[data-act="to-projects"]', 400);
    await press('[data-act="open"][data-dir="' + dirs["duplicate-card-title"].replace(/\\/g, "\\\\") + '"]', 800);
    await press('[data-act="publish"]', 900);
    await settleOn(page, '!document.querySelector("#scrim").hidden && !!document.querySelector(\'#dlg .pwc-gate[data-gate="lint"]\')', { bound: 30000 });
    cover = await state(`{
      notes: Array.from(document.querySelectorAll('#dlg .pwc-gate[data-gate="lint"] .pw-refuse span')).map(e => e.textContent),
      box: !!document.querySelector("#override"),
      checked: (document.querySelector('#dlg .pwc-gate[data-gate="lint"] .t') || {}).textContent || "",
    }`);
  } finally {
    await studio.shut();
  }
  await sleep(400);

  /* ---- what each jump did -------------------------------------------------------------------- */

  for (const w of WANT) {
    const got = landed[w.key] || {};
    if (!w.focus) {
      check(got.jump === false, "1 " + w.key + ": a finding that names no one card has no Jump"
        + " button at all (" + JSON.stringify(said[w.key][0].why.slice(0, 48)) + ")");
      continue;
    }
    const want = w.focus;
    const same = Object.keys(want).every(k => String(got[k] || "") === String(want[k]));
    const where = got.section || got.screen;
    check(where === w.section && same
      && (w.section !== "cards" || got.card === w.id),
      "1 " + w.key + ": opens " + w.section + " " + w.id + " with the caret in "
      + (Object.keys(want).length ? JSON.stringify(want) : "nothing")
      + ", measured as " + JSON.stringify({ screen: got.screen, card: got.card, id: got.id, f: got.f,
        l: got.l, tag: got.tag, act: got.act, tagName: got.tagName }));
  }

  /* RETARGETED 2026-09-18 AT THE PIN MOVE TO 4c377cb: this read the missing-second-language
     row, which the engine no longer writes. The bare-preposition warning is the same shape and
     the engine still has it, so the claim is the claim it always was, on a row that is there at
     either pin. */
  check((landed["polish-bare-preposition"] || {}).lang === "Both",
    "2a a finding about the Polish of a card turns the EN/PL control to Both, so that the field"
    + " it names is on the screen at all (control reads "
    + JSON.stringify((landed["polish-bare-preposition"] || {}).lang) + ")");
  check((landed["duplicate-card-title"] || {}).value === "Tosan widil",
    "2b and the caret lands in the field holding the words the finding quoted: "
    + JSON.stringify((landed["duplicate-card-title"] || {}).value));

  /* ---- the third kind on the screen ---------------------------------------------------------- */

  if (shown) {
    check(shown.screen === "cards" && shown.rows.join("|") === "c-farlil"
          && shown.rail === "1",
      "4a the row's own act narrows the cards table to the cards the state covers and lands"
      + " where cards are: screen " + JSON.stringify(shown.screen) + ", "
      + shown.rows.length + " row(s) " + JSON.stringify(shown.rows) + ", rail "
      + JSON.stringify(shown.rail));
    check(shown.marked.join("|") === "c-farlil"
          && / PL /.test(" " + shown.strip + " "),
      "4b and the row that is there carries the mark, under a strip naming the language by its"
      + " code: " + JSON.stringify(shown.marked) + " marked, strip reads "
      + JSON.stringify(shown.strip));
  }

  /* ---- the override note ---------------------------------------------------------------------- */

  const draft = JSON.parse(fs.readFileSync(path.join(dirs["duplicate-card-title"], DRAFT_FILE), "utf8"));
  const errs = S.findings(draft).rows.filter(r => r.severity === "error").map(r => r.why);
  const printed = (cover.notes || []).filter(n => errs.indexOf(n) >= 0);
  check(cover.box && errs.length > 0 && printed.length === errs.length,
    "3a the publish cover prints every error the note would be written over, word for word as"
    + " the engine wrote it: " + printed.length + " of " + errs.length + " above the note box");
  check(/^0 errors/.test(cover.checked) === false && /error/.test(cover.checked),
    "3b beside the count it already carried (" + JSON.stringify(cover.checked) + ")");

  /* ---- 5: THE SAME-TITLE LINE ON A POLISH SCREEN (board 794) --------------------------------
     0i holds the line to a frame and a pair; this holds the screen to them. A Polish window on
     the same fixture reads the row's two columns against the copywriter's Polish, so a table
     that did not move with a pin is red here rather than an English line on a Polish screen.

     THE POLISH IS FROZEN HERE, BESIDE THE ENGLISH, and not read out of ui/lang.js (board 801 a).
     Taken from the table, an oracle agrees with whatever the table says: a one-word mis-edit of
     the pair (odróżnić to rozróżnić) left this leg 31 of 31 green on 2026-09-26, the trap
     tests/import-screen.mjs 9a met first. These are Claudette's words of 2026-09-26, copied from
     her draft, so a change to them is a change here too, made on purpose. The table is still
     read, only to say in a red line what it holds. */
  const SAME_PL = "ten sam tytuł ma karta {N} z tej kategorii, więc na stanowisku trudno je od"
    + " siebie odróżnić; wystarczy zmienić tytuł jednej z nich albo połączyć obie w jedną kartę";
  const HEAD_PL = "karta {N} (\"{TITLE}\"): {WHAT}";
  const langWin = {};
  vm.runInNewContext(langText.replace("window.STUDIO_T = {",
    "window.STUDIO_T = { __pl: () => Object.assign({}, PL),"),
  { window: langWin, String, Object, Array, JSON, Math, Number });
  const PLT = langWin.STUDIO_T.__pl();
  const SAME = "same title as card {N} in this category, so at the desk the two are hard to tell"
    + " apart; one needs a title of its own, or the two can become one card";
  const HEAD = "card {N} (\"{TITLE}\"): {WHAT}";
  const put = (s, vars) => Object.keys(vars).reduce((t, k) => t.split("{" + k + "}").join(vars[k]),
    String(s || ""));
  const wantTail = put(SAME_PL, { N: "1" });
  const wantWhole = put(HEAD_PL, { N: "3", TITLE: "Tosan widil", WHAT: wantTail });
  let plRow = null;
  const plStudio = await openStudio("tests/lint-jump.mjs", { words: true,
    projects, userDataDir: path.join(SCRATCH, "ud-pl"), env: { STUDIO_LANG: "pl" },
  });
  try {
    const page = plStudio.page;
    for (const sel of ['[data-act="to-projects"]',
      '[data-act="open"][data-dir="' + dirs["duplicate-card-title"].replace(/\\/g, "\\\\") + '"]',
      '[data-act="section"][data-v="lint"]']) {
      await pressWhen(page, sel, { who: "tests/lint-jump.mjs, the Polish window" });
      await sleep(600);
    }
    plRow = await page.evaluate(() => {
      const b = document.querySelector('#main [data-act="jump"][data-id="c-thelork"]');
      const tr = b && b.closest("tr");
      if (!tr) return null;
      const cell = (sel) => {
        const e = tr.querySelector(sel);
        if (!e) return { text: null, shown: false };
        const r = e.getBoundingClientRect();
        return { text: e.textContent, shown: r.width > 0 && r.height > 0 };
      };
      return { what: cell("td.t-title"), why: cell("td.wide-only") };
    });
  } finally {
    await plStudio.shut();
  }
  await sleep(400);
  const tableSays = "; ui/lang.js pairs the sentence with " + JSON.stringify(PLT[SAME] || null)
    + " and the head with " + JSON.stringify(PLT[HEAD] || null);
  check(!!plRow && plRow.what.shown && plRow.what.text === wantTail,
    "5a on a Polish window the same-title row's finding says Claudette's Polish for the engine's"
    + " sentence: " + JSON.stringify(plRow && plRow.what)
    + (plRow && plRow.what.text === wantTail ? "" : ", wanted " + JSON.stringify(wantTail) + tableSays));
  check(!!plRow && plRow.why.text === wantWhole,
    "5b and its wide column says the whole line in Polish, the card by its place and title: "
    + JSON.stringify(plRow && plRow.why)
    + (plRow && plRow.why.text === wantWhole ? "" : ", wanted " + JSON.stringify(wantWhole) + tableSays));

  if (!keep) dropScratch(SCRATCH, "lint-jump");
  process.stdout.write("lint-jump  " + asserted + " assertion(s), " + failed + " failure(s)\n");
  process.exit(failed ? 1 : 0);
}

main(process.argv.slice(2)).catch(e => {
  process.stderr.write("lint-jump  " + (e && e.stack ? e.stack : String(e)) + "\n");
  process.exit(2);
});
