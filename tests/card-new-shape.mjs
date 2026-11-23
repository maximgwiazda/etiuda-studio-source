/* THE REPLY'S SHAPE ON THE NEW CARD COVER (the Studio batch of 2026-10-12, E2).
 *
 *     node tests/card-new-shape.mjs
 *
 * A card was made plain and its shape chosen in the editor afterwards. The New card cover now offers One reply,
 * Alternatives or Steps, so a lead making a card of steps says so once, at the start; the shape goes through addCard, and
 * the text typed on the cover is the first reply, written as the Replies block writes it.
 *
 *   ns1  addCard with Steps writes a step card whose body is the one saveCard's `replies` writes for the same text, by the
 *        pinned engine's v2Mark (a blank line kept as one break), lint clean, and the desk's own read finds one step; in a
 *        catalog whose primary language is Polish the step is written under pl, beside the title
 *   ns2  the same with Alternatives: an unlabelled alternative, read back by the desk as one
 *   ns3  One reply is today's card byte for byte, whether the shape is left out, empty or "plain": the text as typed, the
 *        fields in the order the importer writes them
 *   ns4  a shape the format has not got is refused in saveCard's words and nothing is written, by addCard and by saveCard's
 *        `replies` alike, "alternatives" (the word the refusal itself says) among them; a shape with no text is a card of
 *        that shape with no body, as a plain card with no text has none
 *   ns5  the cover offers the shape as the editor's own three, One reply set, the text box called Text, and no line under
 *        the choice: the editor's line for One reply points to boxes the cover has not got
 *   ns6  choosing Steps or Alternatives sets it, names the text box for the first reply, says what the shape is in the
 *        editor's words and that line alone, and keeps what was typed in the title, the category and the text; a tab
 *        keeping the cover keeps it
 *   ns7  with a shape set, a blank line typed in the text is said under it in the Replies block's words, and still after
 *        the cover is painted again for another shape; not otherwise, and never with One reply
 *   ns8  New card with Steps set asks addCard with the shape and makes a step card, open in the editor; with One reply the
 *        call is the four values it always was; with Alternatives the call's shape is alts, the card's bodyShape is alts
 *        and its body starts [alt]; the first card of a new catalog, its category named on the cover, keeps its shape the
 *        same way, for Steps and for Alternatives
 *   ns14 a press with Steps, and one with Alternatives, each with a body of only spaces, asks addCard with the shape and
 *        makes a card of that shape with no body
 *   ns9  the cover opens at One reply again, whatever was chosen the time before
 *   ns10 a Polish Studio's cover says all of it in Polish, the Replies row's own label included
 *   ns11 choosing a shape puts the hand back on the shape chosen, where the keyboard left it, and not in the card's title
 *   ns12 a tab that hides the cover and comes back shows it at the shape it kept, with what was typed, whatever another
 *        tab's cover chose meanwhile, and New card then makes a card of that shape
 *   ns13 every leg ran
 *
 * Invented words. Node only, no window; where the hand lands is read from the stand-in's focus (a node's focus() makes it
 * the active element), and how it looks is Maxim's eye.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as S from "../src/studio.mjs";
import { clearScratch, dropScratch } from "./scratch.mjs";
import { loadPage } from "./page-stand-in.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SCRATCH = path.join(ROOT, "scratch", "card-new-shape");
const EXPECTED = 15;
let asserted = 0, failed = 0;
function check(cond, line) {
  asserted++;
  if (cond) process.stdout.write("  ok   " + line + "\n");
  else { failed++; process.stdout.write("  FAIL " + line + "\n"); }
}

/* THE DESK'S OWN READ, as tests/replies-block.mjs runs it: catalog-v2.js's catalogFromV2, then card-model.js's parts() and
   altLabelAt() over each language's body column, sliced from the pin and run unchanged. */
const MODS = path.join(ROOT, "engine", "pinned", "src", "modules");
const CV2src = fs.readFileSync(path.join(MODS, "catalog-v2.js"), "utf8");
const CM = fs.readFileSync(path.join(MODS, "card-model.js"), "utf8");
const sliceFn = (src, name) => { const i = src.indexOf("function " + name + "("); if (i < 0) throw new Error("card-model.js has no " + name);
  return src.slice(i, src.indexOf("\n}", i) + 2); };
async function deskReader() {
  const CV2 = await import("data:text/javascript;base64," + Buffer.from(CV2src).toString("base64"));
  const fieldKey = (field, l) => (field === "body" ? (l === "en" ? "en" : l === "pl" ? "pl" : "body:" + l) : "");
  const D = new Function("v2PartText", "v2AltLabel", "cardFieldKey", "REWORDED",
    sliceFn(CM, "cardText") + "\n" + sliceFn(CM, "parts") + "\n" + sliceFn(CM, "altLabelAt") + "\n" + sliceFn(CM, "splitPartsRaw")
    + "\nreturn { parts, altLabelAt, cardText };")(CV2.v2PartText, CV2.v2AltLabel, fieldKey, new Map());
  /* A file the desk refuses whole is answered as the refusal's first line, so the leg that read it names it. */
  return (dir, id, langs) => {
    const draft = JSON.parse(fs.readFileSync(path.join(dir, "draft.json"), "utf8"));
    let m;
    try { m = (CV2.catalogFromV2(draft).cards || []).find((x) => x.id === id); }
    catch (e) { return "the desk refuses the file: " + String(e && e.message || e).split(/\r?\n/)[0]; }
    const out = {};
    for (const l of langs) if (D.cardText(m, "body", l)) out[l] = D.parts(m, l).map((p, i) => [p, D.altLabelAt(m, l, i)]);
    return JSON.stringify(out);
  };
}

const wire = (p) => Promise.resolve(p)
  .then((v) => JSON.parse(JSON.stringify(Object.assign({ error: null }, v))))
  .catch((e) => ({ error: e && e.message ? e.message : String(e), said: (e && e.said) || null }));
const onDisk = (dir) => JSON.parse(fs.readFileSync(path.join(dir, "draft.json"), "utf8"));
const cardOnDisk = (dir, id) => onDisk(dir).cards.find((c) => c.id === id);
/** A card as JSON with its random id taken out, the rest in the order it was written. */
const sansId = (c) => { const o = Object.assign({}, c); delete o.id; return JSON.stringify(o); };

/* TYPED, WITH A CR AND A BLANK LINE AND SPACES ROUND IT: a plain card keeps all of it as typed; a reply keeps one break. */
const TYPED = "  Sarnesk kelbun.\r\n\r\nOndrave tosork.  ";

async function main() {
  clearScratch(SCRATCH);
  const readBack = await deskReader();
  const root = path.join(SCRATCH, "projects");
  fs.mkdirSync(root, { recursive: true });
  const made = await S.newProject(root, "Shapes", [{ code: "en", name: "English" }, { code: "pl", name: "Polish" }]);
  const dir = made.dir;
  const shelf = (await S.addTag(dir, "shelf", { en: "General", pl: "Ogolne" })).tag.id;
  const errorsOf = async (id) => ((await S.lintProject(dir)).rows || []).filter((r) => r.card === id && r.severity === "error");

  /* ns1: Steps, against the Replies block's own writer over the same text */
  const st = (await S.addCard(dir, shelf, "Widuma steps", TYPED, "steps")).card;
  const ref = (await S.addCard(dir, shelf, "Widuma reference", TYPED)).card.id;
  const refCard = (await S.saveCard(dir, ref, { replies: { shape: "steps", blocks: [{ label: {}, text: { en: TYPED } }] } })).card;
  const stDisk = cardOnDisk(dir, st.id), stErr = await errorsOf(st.id), stBack = readBack(dir, st.id, ["en", "pl"]);
  /* A catalog whose primary language is Polish: the first step goes where the title goes, under pl, and nowhere else. */
  const plMade = await S.newProject(root, "Kroki", [{ code: "pl", name: "Polish" }, { code: "en", name: "English" }]);
  const plShelf = (await S.addTag(plMade.dir, "shelf", { pl: "Ogolne", en: "General" })).tag.id;
  const plSt = (await S.addCard(plMade.dir, plShelf, "Widuma kroki", TYPED, "steps")).card;
  const plDisk = cardOnDisk(plMade.dir, plSt.id);
  const plErr = ((await S.lintProject(plMade.dir)).rows || []).filter((r) => r.card === plSt.id && r.severity === "error");
  const plBack = readBack(plMade.dir, plSt.id, ["pl", "en"]);
  check(st.bodyShape === "steps" && stDisk.bodyShape === "steps" && stDisk.body.en === refCard.body.en
        && stDisk.body.en === "[step]\nSarnesk kelbun.\nOndrave tosork." && Object.keys(stDisk.body).join() === "en"
        && stErr.length === 0 && stBack === JSON.stringify({ en: [["Sarnesk kelbun.\nOndrave tosork.", ""]] })
        && JSON.stringify(plDisk.title) === JSON.stringify({ pl: "Widuma kroki" })
        && JSON.stringify(plDisk.body) === JSON.stringify({ pl: "[step]\nSarnesk kelbun.\nOndrave tosork." })
        && plErr.length === 0 && plBack === JSON.stringify({ pl: [["Sarnesk kelbun.\nOndrave tosork.", ""]] }),
    "ns1 Steps makes a step card whose body is saveCard's `replies` for the same text, lint clean, the desk reading one step,"
    + " and in a Polish-primary catalog the step is under pl: " + JSON.stringify([stDisk.body, stErr.length, stBack, plDisk.body, plErr.length, plBack]));

  /* ns2: Alternatives */
  const al = (await S.addCard(dir, shelf, "Widuma alternatives", TYPED, "alts")).card;
  const alDisk = cardOnDisk(dir, al.id), alErr = await errorsOf(al.id), alBack = readBack(dir, al.id, ["en"]);
  check(alDisk.bodyShape === "alts" && alDisk.body.en === "[alt]\nSarnesk kelbun.\nOndrave tosork." && alErr.length === 0
        && alBack === JSON.stringify({ en: [["Sarnesk kelbun.\nOndrave tosork.", ""]] }),
    "ns2 Alternatives makes an alternatives card with one unlabelled alternative, lint clean, read back by the desk as one: "
    + JSON.stringify([alDisk.body, alErr.length, alBack]));

  /* ns3: One reply, three ways of not choosing, each today's card to the byte */
  const want = JSON.stringify({ shelf, title: { en: "Widuma plain" }, bodyShape: "plain", body: { en: TYPED } });
  const plains = [];
  for (const shape of [undefined, "", "plain"]) {
    const c = (shape === undefined ? await S.addCard(dir, shelf, "Widuma plain", TYPED)
      : await S.addCard(dir, shelf, "Widuma plain", TYPED, shape)).card;
    plains.push([sansId(c), sansId(cardOnDisk(dir, c.id))]);
  }
  check(plains.every(([r, d]) => r === want && d === want),
    "ns3 One reply is today's card byte for byte, the text as typed, with the shape left out, empty or plain: "
    + JSON.stringify(plains.map(([r, d]) => r === want && d === want)));

  /* ns4: a shape the format has not got; a shape with no text */
  const bytes = fs.readFileSync(path.join(dir, "draft.json"), "utf8");
  const odd = [];
  /* "alternatives" is the word the refusal itself says, so the likeliest one to slip into the list of shapes */
  const NOT_SHAPES = ["Steps", "[object Object]", "steps ", "alternatives"];
  for (const shape of NOT_SHAPES) for (const text of ["Text.", ""]) {
    const r = await wire(S.addCard(dir, shelf, "Widuma odd", text, shape));
    odd.push(r.error);
  }
  for (const shape of NOT_SHAPES)
    odd.push((await wire(S.saveCard(dir, ref, { replies: { shape, blocks: [{ label: {}, text: { en: "Text." } }] } }))).error);
  const untouched = fs.readFileSync(path.join(dir, "draft.json"), "utf8") === bytes;
  const bare = (await S.addCard(dir, shelf, "Widuma bare", "  ", "steps")).card;
  const bareDisk = cardOnDisk(dir, bare.id);
  check(odd.length === 12 && odd.every((e) => e === "a card holds one reply, alternatives or steps") && untouched
        && bareDisk.bodyShape === "steps" && !("body" in bareDisk),
    "ns4 a shape the format has not got is refused in saveCard's words by addCard and saveCard alike and the draft is"
    + " untouched; a step card with no text has no body: " + JSON.stringify([odd, untouched, bareDisk.bodyShape, "body" in bareDisk]));

  /* ---- the page, over the real verbs, the cover's fields handed to it as nodes ---- */
  const calls = [];
  /* cardHistory is asked by the editor a card opens in, after New card: a page without it throws there, unheard until a leg
     waits on the clock, as ns12 does. */
  const api = { addCard: (...a) => { calls.push(a.slice(1)); return wire(S.addCard(...a)); },
    addTag: (...a) => wire(S.addTag(...a)), saveCard: (...a) => wire(S.saveCard(...a)), cardHistory: (d, i) => wire(S.cardHistory(d, i)) };
  /* `first`: the cover of a catalog with no category yet, which names one in #newCardCatName in place of the select.
     `verbs`: the page's api, where a leg needs more of it than the verbs above. */
  function page(uiLang, { first = false, verbs = api } = {}) {
    const h = loadPage({ api: verbs, uiLang });
    const P = h.page, ids = ["newCard", first ? "newCardCatName" : "newCardCat", "newCardBody"];
    /* THE HAND: a node's focus() makes it the active element, as a real one's does. The other covers' first fields are
       absent, as on a real card cover, so a repaint's own choice of field falls where a real one's does, on the title. */
    const find = h.doc.querySelector;
    function take() { h.doc.focused = this; }
    h.doc.querySelector = (sel) => { const n = find.call(h.doc, sel); if (n && n.focus !== take) { n.focus = take; n.isConnected = true; } return n; };
    const dlg = h.node("#dlg");
    /* A rebuilt cover has fresh, empty fields and a fresh note, hidden as its markup says, as a real one has; what the page
       keeps of them it puts back itself. */
    dlg.querySelectorAll = () => (P.S.cover === "card" ? ids.map((id) => Object.assign(h.node("#" + id), { id })) : []);
    Object.defineProperty(dlg, "innerHTML", { configurable: true, get() { return this._html; },
      set(v) { this._html = String(v); ids.forEach((id) => { h.node("#" + id).value = ""; });
        h.node("#newCardBlank").hidden = /id="newCardBlank" hidden/.test(this._html); } });
    h.doc.getElementById = (id) => h.node("#" + id);
    h.doc.absent = new Set([first ? "#newCardCat" : "#newCardCatName", "#newName", "#upName", "#newLang", "#newTag"]);
    return h;
  }
  const el = (attrs) => ({ getAttribute: (k) => (k in attrs ? attrs[k] : null) });
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const radios = (html) => Array.from(html.matchAll(/<span class="(?:on)?" role="radio" aria-checked="(true|false)" data-act="card-new-shape" data-v="(\w+)"/g),
    (m) => m[2] + (m[1] === "true" ? "*" : ""));
  const label = (html) => (/<span class="k">([^<]*)<\/span><textarea class="ta" id="newCardBody"/.exec(html) || [])[1] || null;
  /** The line said under the shape's choice, null where there is none, and "unread" where the row is not as painted. */
  const shapeLine = (html) => {
    const m = /data-act="card-new-shape"[\s\S]*?<\/div><\/div>(?:<span class="n">([^<]*)<\/span>)?<\/div>/.exec(html);
    return !m ? "unread" : m[1] == null ? null : m[1];
  };
  const STEPS_LINE = "Sent one after another, each when the agent is ready.", ALTS_LINE = "The agent chooses one of these to send.";
  /** The radio for a shape, as the act finds it after a repaint, and the one the keyboard is on when it presses it. */
  const radioOf = (h, v) => h.node('#dlg [data-act="card-new-shape"][data-v="' + v + '"]');
  const handOn = (h) => (h.doc.focused ? h.doc.focused.__sel : null);

  const h = page("en"), P = h.page;
  Object.assign(P.S, { open: await wire(S.openProject(dir)), screen: "project", section: "cards", lang: "en", sel: null, err: null });
  await P.ACTS["card-new"]();
  const c0 = h.node("#dlg").innerHTML;
  check(radios(c0).join() === "plain*,alts,steps" && /role="radiogroup" aria-label="Replies"/.test(c0)
        && /data-v="plain"[^>]*>One reply</.test(c0) && /data-v="alts"[^>]*>Alternatives</.test(c0) && /data-v="steps"[^>]*>Steps</.test(c0)
        && label(c0) === "Text" && !/newCardBlank/.test(c0) && !/The agent chooses|Sent one after another/.test(c0)
        && shapeLine(c0) === null,
    "ns5 the cover offers One reply, Alternatives and Steps, One reply set, the text box is Text, and no line is said under"
    + " the choice: " + JSON.stringify([radios(c0), label(c0), shapeLine(c0)]));

  /* ns6: typed first, then the shape chosen */
  h.node("#newCard").value = "Widuma typed"; h.node("#newCardCat").value = shelf; h.node("#newCardBody").value = "Sarnesk.";
  await P.ACTS["card-new-shape"](el({ "data-v": "steps" }));
  const c1 = h.node("#dlg").innerHTML;
  const kept = [h.node("#newCard").value, h.node("#newCardCat").value, h.node("#newCardBody").value];
  const keptByTab = P.__get("coverKept")();
  await P.ACTS["card-new-shape"](el({ "data-v": "alts" }));
  const c2 = h.node("#dlg").innerHTML;
  check(radios(c1).join() === "plain,alts,steps*" && label(c1) === "First step" && shapeLine(c1) === STEPS_LINE
        && radios(c2).join() === "plain,alts*,steps" && label(c2) === "First alternative" && shapeLine(c2) === ALTS_LINE
        && JSON.stringify(kept) === JSON.stringify(["Widuma typed", shelf, "Sarnesk."])
        && JSON.stringify([h.node("#newCard").value, h.node("#newCardBody").value]) === JSON.stringify(["Widuma typed", "Sarnesk."])
        && keptByTab && keptByTab.kind === "card" && keptByTab.coverKind === "steps",
    "ns6 Steps and Alternatives are set in turn, the text box named for the first reply and the shape said in the editor's"
    + " words, its own line alone, what was typed kept, and a tab keeping the cover keeps the shape: "
    + JSON.stringify([radios(c1), label(c1), shapeLine(c1), radios(c2), label(c2), shapeLine(c2), kept, keptByTab && keptByTab.coverKind]));

  /* ns7: the blank-line note, through the page's own input handler */
  const typeIn = (v) => { const box = h.node("#newCardBody"); box.value = v; box.id = "newCardBody";
    h.doc.heard.filter((x) => x.type === "input").forEach((x) => x.fn({ target: box })); return !h.node("#newCardBlank").hidden; };
  const note = /<span class="n rp-warn" id="newCardBlank" hidden>A blank line would split this reply in two on the desks, so it is saved as a single line break\.<\/span>/;
  const said = [typeIn("Line one.\n\nLine two.")];
  await P.ACTS["card-new-shape"](el({ "data-v": "steps" }));            /* painted again over the blank line typed */
  said.push(!h.node("#newCardBlank").hidden, typeIn("Line one.\nLine two."), typeIn("Line one.\n \nLine two."));
  await P.ACTS["card-new-shape"](el({ "data-v": "plain" }));
  const c3 = h.node("#dlg").innerHTML;
  check(note.test(c2) && said.join() === "true,true,false,true" && !/newCardBlank/.test(c3) && label(c3) === "Text",
    "ns7 with a shape set a blank line typed in the text is said under it in the Replies block's words, still after the"
    + " shape is changed, and with One reply there is no such line: " + JSON.stringify(said));

  /* ns8: New card, with Steps and with One reply */
  await P.ACTS["card-new-shape"](el({ "data-v": "steps" }));
  h.node("#newCard").value = "Widuma made"; h.node("#newCardCat").value = shelf; h.node("#newCardBody").value = "Pierwszy.\n\nNadal pierwszy.";
  calls.length = 0;
  await P.ACTS["do-card-new"]();
  const asked = calls.slice(), madeId = P.S.sel, madeCard = madeId ? cardOnDisk(dir, madeId) : null;
  await P.ACTS["card-new"]();
  h.node("#newCard").value = "Widuma made plain"; h.node("#newCardCat").value = shelf; h.node("#newCardBody").value = "Plain.";
  calls.length = 0;
  await P.ACTS["do-card-new"]();
  const askedPlain = calls.slice(), plainCard = P.S.sel ? cardOnDisk(dir, P.S.sel) : null;
  /* The first card of a new catalog: the cover names its category in place of choosing one, and the shape goes with it. */
  const bareMade = await S.newProject(root, "Pusty", [{ code: "en", name: "English" }, { code: "pl", name: "Polish" }]);
  const hf = page("en", { first: true }), PF = hf.page;
  Object.assign(PF.S, { open: await wire(S.openProject(bareMade.dir)), screen: "project", section: "cards", lang: "en", sel: null, err: null });
  await PF.ACTS["card-new"]();
  const f0 = hf.node("#dlg").innerHTML;
  await PF.ACTS["card-new-shape"](el({ "data-v": "steps" }));
  hf.node("#newCard").value = "Widuma first"; hf.node("#newCardCatName").value = "Widuma shelf"; hf.node("#newCardBody").value = "Raz.";
  calls.length = 0;
  await PF.ACTS["do-card-new"]();
  const askedFirst = calls.slice(), firstDraft = onDisk(bareMade.dir);
  const firstShelf = (firstDraft.tags || []).find((t) => t.kind === "shelf");
  const firstCard = PF.S.sel ? cardOnDisk(bareMade.dir, PF.S.sel) : null;
  /* Alternatives from the press. The Steps press above does not ask for it, and neither does the first card's. */
  await P.ACTS["card-new"]();
  await P.ACTS["card-new-shape"](el({ "data-v": "alts" }));
  h.node("#newCard").value = "Widuma alts"; h.node("#newCardCat").value = shelf; h.node("#newCardBody").value = "Sarnesk kelbun.";
  calls.length = 0;
  await P.ACTS["do-card-new"]();
  const askedAlts = calls.slice(), altsCard = P.S.sel ? cardOnDisk(dir, P.S.sel) : null;
  /* Another catalog with no category yet: Alternatives chosen on that cover, then the press. */
  const bareAlts = await S.newProject(root, "Nexan", [{ code: "en", name: "English" }, { code: "pl", name: "Polish" }]);
  const ha = page("en", { first: true }), PA = ha.page;
  Object.assign(PA.S, { open: await wire(S.openProject(bareAlts.dir)), screen: "project", section: "cards", lang: "en", sel: null, err: null });
  await PA.ACTS["card-new"]();
  await PA.ACTS["card-new-shape"](el({ "data-v": "alts" }));
  ha.node("#newCard").value = "Widuma nexan"; ha.node("#newCardCatName").value = "Nexan shelf"; ha.node("#newCardBody").value = "Sarnesk raz.";
  calls.length = 0;
  await PA.ACTS["do-card-new"]();
  const askedNexan = calls.slice(), nexanDraft = onDisk(bareAlts.dir);
  const nexanShelf = (nexanDraft.tags || []).find((t) => t.kind === "shelf");
  const nexanCard = PA.S.sel ? cardOnDisk(bareAlts.dir, PA.S.sel) : null;
  check(JSON.stringify(asked) === JSON.stringify([[shelf, "Widuma made", "Pierwszy.\n\nNadal pierwszy.", "steps"]])
        && madeCard && madeCard.bodyShape === "steps" && madeCard.body.en === "[step]\nPierwszy.\nNadal pierwszy."
        && JSON.stringify(askedPlain) === JSON.stringify([[shelf, "Widuma made plain", "Plain."]])
        && plainCard && sansId(plainCard) === JSON.stringify({ shelf, title: { en: "Widuma made plain" }, bodyShape: "plain", body: { en: "Plain." } })
        && P.S.cover === null && madeId && madeId !== P.S.sel
        && /id="newCardCatName"/.test(f0) && !/id="newCardCat"/.test(f0) && !!firstShelf
        && JSON.stringify(askedFirst) === JSON.stringify([[firstShelf.id, "Widuma first", "Raz.", "steps"]])
        && firstCard && firstCard.shelf === firstShelf.id && firstCard.bodyShape === "steps" && JSON.stringify(firstCard.body) === JSON.stringify({ en: "[step]\nRaz." })
        && PF.S.cover === null
        && JSON.stringify(askedAlts) === JSON.stringify([[shelf, "Widuma alts", "Sarnesk kelbun.", "alts"]])
        && altsCard && altsCard.bodyShape === "alts" && !!(altsCard.body && altsCard.body.en && altsCard.body.en.startsWith("[alt]\n"))
        && !!nexanShelf
        && JSON.stringify(askedNexan) === JSON.stringify([[nexanShelf.id, "Widuma nexan", "Sarnesk raz.", "alts"]])
        && nexanCard && nexanCard.bodyShape === "alts" && !!(nexanCard.body && nexanCard.body.en && nexanCard.body.en.startsWith("[alt]\n")),
    "ns8 New card with Steps asks addCard with the shape and makes a step card, open in the editor; with One reply the call"
    + " is the four values it was; with Alternatives the call's shape is alts and the body starts [alt]; a new catalog's"
    + " first card, its category named on the cover, keeps Steps and Alternatives alike: "
    + JSON.stringify([asked, madeCard && madeCard.body, askedPlain, askedFirst, firstCard && [firstCard.bodyShape, firstCard.body],
      askedAlts, altsCard && [altsCard.bodyShape, altsCard.body && altsCard.body.en], askedNexan, nexanCard && [nexanCard.bodyShape, nexanCard.body]]));

  /* ns14: Steps, then Alternatives, each with a body of only spaces. The press still names the shape; the card is that shape and has no body,
     which is what addCard writes when the text trims to nothing (ns4 asks the verb; this asks the press). */
  await P.ACTS["card-new"]();
  await P.ACTS["card-new-shape"](el({ "data-v": "steps" }));
  h.node("#newCard").value = "Widuma spaces"; h.node("#newCardCat").value = shelf; h.node("#newCardBody").value = "  ";
  calls.length = 0;
  await P.ACTS["do-card-new"]();
  const askedSpaces = calls.slice(), spacesCard = P.S.sel ? cardOnDisk(dir, P.S.sel) : null;
  await P.ACTS["card-new"]();
  await P.ACTS["card-new-shape"](el({ "data-v": "alts" }));
  h.node("#newCard").value = "Widuma spaces alts"; h.node("#newCardCat").value = shelf; h.node("#newCardBody").value = "  ";
  calls.length = 0;
  await P.ACTS["do-card-new"]();
  const askedSpacesAlts = calls.slice(), spacesAltsCard = P.S.sel ? cardOnDisk(dir, P.S.sel) : null;
  check(askedSpaces.length === 1 && askedSpaces[0][askedSpaces[0].length - 1] === "steps"
        && JSON.stringify(askedSpaces) === JSON.stringify([[shelf, "Widuma spaces", "  ", "steps"]])
        && spacesCard && spacesCard.bodyShape === "steps" && !("body" in spacesCard)
        && JSON.stringify(askedSpacesAlts) === JSON.stringify([[shelf, "Widuma spaces alts", "  ", "alts"]])
        && spacesAltsCard && spacesAltsCard.bodyShape === "alts" && !("body" in spacesAltsCard),
    "ns14 a press with Steps, and one with Alternatives, each with a body of only spaces, asks addCard with the shape and"
    + " makes a card of that shape with no body: "
    + JSON.stringify([askedSpaces, spacesCard && [spacesCard.bodyShape, "body" in spacesCard],
      askedSpacesAlts, spacesAltsCard && [spacesAltsCard.bodyShape, "body" in spacesAltsCard]]));

  /* ns15: a card created as Steps or Alternatives opens with a second empty reply focused; One reply holds one */
  P.__set("CV2", await import("data:text/javascript;base64," + Buffer.from(CV2src).toString("base64")));
  await P.ACTS["card-new"]();
  await P.ACTS["card-new-shape"](el({ "data-v": "steps" }));
  h.node("#newCard").value = "Widuma steps two"; h.node("#newCardCat").value = shelf; h.node("#newCardBody").value = "Krok pierwszy.";
  await P.ACTS["do-card-new"]();
  const stId = P.S.sel, stRp = P.S.rp, stFocus = handOn(h);
  const stEmptyBefore = stRp && stRp.shape === "steps" && stRp.blocks.length === 2
    && stRp.blocks[0].text.en === "Krok pierwszy." && !stRp.blocks[1].text.en;
  await P.flush();
  const stDiskBefore = cardOnDisk(dir, stId);
  const stErrBefore = await errorsOf(stId);

  /* typing into the second reply saves it as any reply is saved */
  const stBox = h.node('[data-rp="1"]');
  stBox.setAttribute("data-rp", "1");
  stBox.setAttribute("data-l", "en");
  stBox.value = "Krok drugi.";
  h.doc.heard.filter((x) => x.type === "input").forEach((x) => x.fn({ target: stBox }));
  await P.flush();
  const stDiskAfter = cardOnDisk(dir, stId);
  const stErrAfter = await errorsOf(stId);

  await P.ACTS["card-new"]();
  await P.ACTS["card-new-shape"](el({ "data-v": "alts" }));
  h.node("#newCard").value = "Widuma alts two"; h.node("#newCardCat").value = shelf; h.node("#newCardBody").value = "Wariant pierwszy.";
  await P.ACTS["do-card-new"]();
  const alId = P.S.sel, alRp = P.S.rp, alFocus = handOn(h);
  await P.flush();
  const alDiskBefore = cardOnDisk(dir, alId);
  const alErrBefore = await errorsOf(alId);

  await P.ACTS["card-new"]();
  await P.ACTS["card-new-shape"](el({ "data-v": "plain" }));
  h.node("#newCard").value = "Widuma plain one"; h.node("#newCardCat").value = shelf; h.node("#newCardBody").value = "Tylko jedna odpowiedz.";
  await P.ACTS["do-card-new"]();
  const plRp = P.S.rp;

  check(stEmptyBefore && stRp.blocks[1].text.en === "Krok drugi." && stFocus === '[data-rp="1"]'
        && stDiskBefore && stDiskBefore.body.en === "[step]\nKrok pierwszy." && stErrBefore.length === 0
        && stDiskAfter && stDiskAfter.body.en === "[step]\nKrok pierwszy.\n\n[step]\nKrok drugi." && stErrAfter.length === 0
        && alRp && alRp.shape === "alts" && alRp.blocks.length === 2
        && alRp.blocks[0].text.en === "Wariant pierwszy." && !alRp.blocks[1].text.en && alFocus === '[data-rp="1"]'
        && alDiskBefore && alDiskBefore.body.en === "[alt]\nWariant pierwszy." && alErrBefore.length === 0
        && plRp && plRp.shape === "plain" && plRp.blocks.length === 1 && plRp.blocks[0].text.en === "Tylko jedna odpowiedz.",
    "ns15 a card created as Steps or Alternatives opens with a second empty reply focused; One reply holds one: "
    + JSON.stringify([stRp && stRp.blocks, stFocus, alRp && alRp.blocks, alFocus, plRp && plRp.blocks]));

  /* ns9: the cover opens at One reply whatever was chosen last */
  await P.ACTS["card-new"]();
  await P.ACTS["card-new-shape"](el({ "data-v": "alts" }));
  P.S.cover = null;
  await P.ACTS["card-new"]();
  const c4 = h.node("#dlg").innerHTML;
  check(radios(c4).join() === "plain*,alts,steps" && label(c4) === "Text" && shapeLine(c4) === null,
    "ns9 the cover opens at One reply again after Alternatives was chosen and the cover left: " + JSON.stringify(radios(c4)));

  /* ns10: in Polish */
  const hp = page("pl"), PP = hp.page;
  Object.assign(PP.S, { open: await wire(S.openProject(dir)), screen: "project", section: "cards", lang: "en", sel: null, err: null });
  await PP.ACTS["card-new"]();
  const p0 = hp.node("#dlg").innerHTML;
  await PP.ACTS["card-new-shape"](el({ "data-v": "steps" }));
  const p1 = hp.node("#dlg").innerHTML;
  await PP.ACTS["card-new-shape"](el({ "data-v": "alts" }));
  const p2 = hp.node("#dlg").innerHTML;
  /* `>Replies<` is the row's visible label, which a screen reader's aria-label does not stand in for */
  const english = /One reply|Alternatives|>Steps<|>Replies<|First step|First alternative|Sent one after|The agent chooses|A blank line|aria-label="Replies"/;
  const rowLabel = (html) => (/<span class="k">([^<]*)<\/span><div class="row2">/.exec(html) || [])[1] || null;
  check(/aria-label="Odpowiedzi"/.test(p0) && rowLabel(p0) === "Odpowiedzi" && />Jedna odpowiedź</.test(p0) && />Warianty</.test(p0) && />Kroki</.test(p0)
        && label(p1) === "Pierwszy krok" && label(p2) === "Pierwszy wariant"
        && /Wysyłane po kolei/.test(p1) && /Agent wybiera/.test(p2) && /Pusta linijka podzieliłaby/.test(p2)
        && ![p0, p1, p2].some((x) => english.test(x)),
    "ns10 a Polish Studio's cover says the row's label, the shape, the first reply's name, the shape's line and the blank-line"
    + " note in Polish: " + JSON.stringify([rowLabel(p0), label(p1), label(p2)]));

  /* ns11: the hand, on the English page whose cover ns9 left open. The keyboard is on the radio it presses, as a real
     Space or Enter on it would leave it; the repaint replaces that radio, and the act puts the hand on the new one. */
  h.node("#newCard").value = "Widuma hand"; h.node("#newCardCat").value = shelf; h.node("#newCardBody").value = "Raz.";
  const hands = [];
  for (const v of ["steps", "alts", "plain"]) {
    h.doc.focused = radioOf(h, v);
    await P.ACTS["card-new-shape"](el({ "data-v": v }));
    hands.push(handOn(h));
  }
  const handKept = [h.node("#newCard").value, h.node("#newCardBody").value];
  check(hands.every((x, i) => x === '#dlg [data-act="card-new-shape"][data-v="' + ["steps", "alts", "plain"][i] + '"]')
        && JSON.stringify(handKept) === JSON.stringify(["Widuma hand", "Raz."]),
    "ns11 choosing a shape puts the hand back on the shape chosen, not in the card's title: " + JSON.stringify(hands));

  /* ns12: a tab that hides the cover and comes back, through the band's own act and the page's own landOn */
  const tabVerbs = Object.assign({}, api, {
    open: (d) => wire(S.openProject(d)), projects: () => wire(S.listProjects(root)), proposals: (d) => wire(S.listProposals(d)),
    findPlaces: (d, o) => wire(S.findPlaces(d, o || {})),
    discardUntouched: (d) => wire(S.discardUntouched(d)), tabs: () => Promise.resolve({ error: null }) });
  const ht = page("en", { verbs: tabVerbs }), PT = ht.page;
  PT.S.host = { tour: { offered: true }, langs: S.builtLangs() };
  PT.S.projects = S.listProjects(root).projects;
  const toTab = async (d) => { await PT.ACTS["to-project"](el({ "data-act": "to-project", "data-dir": d })); await sleep(40); };
  await toTab(dir);
  await PT.ACTS["card-new"]();
  ht.node("#newCard").value = "Widuma away"; ht.node("#newCardCat").value = shelf; ht.node("#newCardBody").value = "Najpierw to.\n\nPotem to.";
  await PT.ACTS["card-new-shape"](el({ "data-v": "steps" }));
  await toTab(plMade.dir);
  const away = { on: path.basename(PT.S.open.dir), cover: PT.S.cover, painted: ht.node("#dlg").innerHTML };
  /* the other tab has a New card cover of its own, at Alternatives, so the shape coming back is the tab's and not the last chosen */
  await PT.ACTS["card-new"]();
  ht.node("#newCard").value = "Widuma tam"; ht.node("#newCardCat").value = plShelf; ht.node("#newCardBody").value = "Tak.";
  await PT.ACTS["card-new-shape"](el({ "data-v": "alts" }));
  await toTab(dir);
  const t1 = ht.node("#dlg").innerHTML;
  const backAt = { on: path.basename(PT.S.open.dir), cover: PT.S.cover, radios: radios(t1).join(), label: label(t1), line: shapeLine(t1),
    typed: [ht.node("#newCard").value, ht.node("#newCardCat").value, ht.node("#newCardBody").value], blank: /id="newCardBlank"/.test(t1) && !ht.node("#newCardBlank").hidden };
  calls.length = 0;
  await PT.ACTS["do-card-new"]();
  const askedBack = calls.slice(), backCard = PT.S.sel ? cardOnDisk(dir, PT.S.sel) : null;
  await toTab(plMade.dir);
  const t2 = ht.node("#dlg").innerHTML;
  const there = { cover: PT.S.cover, radios: radios(t2).join(), label: label(t2), typed: [ht.node("#newCard").value, ht.node("#newCardBody").value] };
  check(away.on === "Kroki" && away.cover === null && away.painted === ""
        && backAt.on === path.basename(dir) && backAt.cover === "card" && backAt.radios === "plain,alts,steps*"
        && backAt.label === "First step" && backAt.line === STEPS_LINE && backAt.blank
        && JSON.stringify(backAt.typed) === JSON.stringify(["Widuma away", shelf, "Najpierw to.\n\nPotem to."])
        && JSON.stringify(askedBack) === JSON.stringify([[shelf, "Widuma away", "Najpierw to.\n\nPotem to.", "steps"]])
        && backCard && backCard.bodyShape === "steps" && backCard.body.en === "[step]\nNajpierw to.\nPotem to."
        && there.cover === "card" && there.radios === "plain,alts*,steps" && there.label === "First alternative"
        && JSON.stringify(there.typed) === JSON.stringify(["Widuma tam", "Tak."]),
    "ns12 a tab that hides the cover and comes back shows it at Steps with what was typed, though another tab's cover was at"
    + " Alternatives meanwhile, and New card makes a step card; the other tab's cover comes back at its own: "
    + JSON.stringify([away.on, away.cover, backAt, askedBack, there]));

  dropScratch(SCRATCH, "tests/card-new-shape.mjs");
  check(asserted === EXPECTED - 1, "ns13 every leg ran: " + (asserted + 1) + " of " + EXPECTED);
}

main().then(() => {
  console.log("#counts checks=" + asserted + " failed=" + failed + " expected=" + EXPECTED);
  console.log(failed ? "RESULT: FAIL " + failed + " failed" : "RESULT: ok " + asserted + " check(s)");
  process.exit(failed ? 1 : 0);
}, (e) => { console.log("  FAIL " + (e && e.stack || e)); console.log("RESULT: FAIL the leg did not complete"); process.exit(1); });
