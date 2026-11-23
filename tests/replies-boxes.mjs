/* EACH REPLY'S BOX IS THE BODY'S OWN (E3, carved from the Replies block, the Studio batch of 2026-10-12).
 *
 *     node tests/replies-boxes.mjs
 *
 * On a card shaped as alternatives or steps each reply had a bare box: no Insert variable, no { menu, and no wave or line
 * under a phrase reading like a commitment, though the Lint list still named one there. Each reply's box now carries
 * what the body's box carries, drawn by the same functions and keyed to the reply and its language.
 *
 *   rx1  the reply whose words read like a commitment carries the wave under them in its own mirror and the line naming
 *        them under its box, with both answers and F8, and says it to the ear; no other box carries the line, and the
 *        commitment box does not say it a second time
 *   rx2  a commitment typed into an earlier reply is mirrored as typed and saved through the Replies block, and when the
 *        save comes back the wave and the line move under that reply and leave the other, and so does what the boxes say
 *        to the ear
 *   rx3  Mark as a commitment from a reply's line ticks the card and folds that line, there and nowhere else
 *   rx4  each reply has Insert variable in each shown language, its menu opening under that box alone; the line saying {
 *        does the same is said once per language, on the first reply
 *   rx5  a variable chosen from a reply's menu goes in at that box's caret and is saved through repliesSave as typed text
 *        is: the file holds it in that reply and language alone, the card still shaped, and the lint finds no error; the
 *        box's mirror follows it
 *   rx6  a { typed into a reply opens that box's menu, and the variable chosen takes the brace's place, saved the same way
 *   rx7  a keystroke that brings a reply's note while no save waits is kept: the block is painted again from the words
 *        typed, not from the card's last saved body, and saved with them
 *   rx8  CONTROL: a card of one reply keeps its body's box, drawn and wired by the same functions: its { opens the
 *        body's menu, and the variable chosen goes in at the caret and is saved as the body; the body's chips and its
 *        mirror follow both the key typed and the variable
 *   rx9  one copy of each rule: the mirror, the Insert variable row and the { that opens the menu are each written once,
 *        counted in ui/app.js with its comments taken out (tests/source-text.mjs), so a copy kept in a comment is none
 *   rx10 after a save has come back, a key typed into a reply in the finding's language is kept: saved, and in the file
 *   rx11 after a save has come back, a label typed where it takes a reply's note away is kept: painted, saved, in the file
 *   rx12 the wave and the line find the phrase as the finder reads the text (src/commitment.mjs): a variable inside the
 *        clause, a curly apostrophe, and a change of case while it is being typed; the line under that reply, the wave
 *        under its own words
 *   rx13 two replies holding the phrase: the line under the first; none holding it: under the first reply, never lost
 *   rx14 Insert variable pressed under another reply in the same language moves its menu there; pressed again, closes it
 *   rx15 a note that goes as a new alternative is typed into leaves the box on screen focused with its caret where it
 *        was: "Hi" typed is "Hi", and an H opens no menu
 *   rx16 a { typed first into a new alternative, then a variable chosen, gives the variable and no brace; a variable put
 *        into an empty alternative from Insert variable leaves the caret after it, in the box on screen
 *   rx17 a card shaped as steps has Insert variable under each reply in each language, as alternatives have
 *   rx18 a finding in Polish alone, on a card shaped as alternatives: the line under the Polish box of the reply holding
 *        it, the wave in that box's mirror, and nothing under any English box
 *   rx19 Escape shuts the variable menu and does nothing else: no other key handler on the page hears it, a menu a {
 *        opened leaves the box focused at its caret, and one walked into hands the hand back to the box at the caret it
 *        had, or to the Insert variable button that opened it; on a reply's box and on the body's
 *   rx20 Down and Up walk the menu's items from the box or the button that opened it, wrapping at either end, Home and End
 *        go to the ends, and Shift with an arrow stays the box's; on a reply's box and on the body's
 *   rx21 Enter on the item walked to puts that variable in at the box's caret, in the brace's place where a { opened the
 *        menu, saves it, and leaves the caret after it in the box; on a reply's box and on the body's
 *   rx22 every leg ran
 *
 * rx15 and rx16 hand out a new box at each paint of the editor, its caret at the start, as a box built from markup has:
 * the stand-in alone keeps one element per selector. rx19 to rx21 hand a key to the document's keydown listeners as the
 * window does, capture first in the order the page added them, then the rest, a stop honoured as the window honours it,
 * the target where the focus is; the menu's items are read from the markup painted into its holder. Invented words. Node
 * only, no window; how it looks is Maxim's eye.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as S from "../src/studio.mjs";
import * as Engine from "../src/engine.mjs";
import { loadPage } from "./page-stand-in.mjs";
import { dropScratch } from "./scratch.mjs";
import { withoutComments } from "./source-text.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const EXPECTED = 22;
let asserted = 0, failed = 0;
function check(cond, line) {
  asserted++;
  if (cond) process.stdout.write("  ok   " + line + "\n");
  else { failed++; process.stdout.write("  FAIL " + line + "\n"); }
}
const count = (s, re) => (String(s).match(re) || []).length;

/* The engine's own variables.js, as tests/variables-page.mjs hands it to the page, so the insert menu has its list. */
function engineVars() {
  const mod = (f, names) => new Function(fs.readFileSync(path.join(Engine.PINNED, "src", "modules", f), "utf8")
    .replace(/\nexport \{[\s\S]*$/, "\n") + "\nreturn {" + names.join(",") + "};")();
  const src = fs.readFileSync(path.join(Engine.PINNED, "src", "modules", "variables.js"), "utf8");
  const names = (/\nexport \{([\s\S]*)\};?\s*$/.exec(src) || [, ""])[1].split(",").map(s => s.trim()).filter(Boolean);
  return Object.assign(mod("variables.js", names), mod("polish.js", ["plVocative", "zForm"]));
}

const PROMISE = "Thank you for waiting. We will send you a replacement today, as promised.";
const LATER = "I will refund the postage today";

async function main() {
  const LAB = fs.mkdtempSync(path.join(os.tmpdir(), "etiuda-reply-boxes-"));
  const made = await S.newProject(path.join(LAB, "projects"), "Reply boxes", [{ code: "en", name: "English" }, { code: "pl", name: "Polish" }]);
  const dir = made.dir;
  const shelf = (await S.addTag(dir, "shelf", { en: "Delivery", pl: "Dostawa" })).tag.id;
  const id = (await S.addCard(dir, shelf, "Parcel, replaced", "Placeholder.")).card.id;
  await S.saveCard(dir, id, { title: { pl: "Paczka, wymiana" }, replies: { shape: "alts", blocks: [
    { label: { en: "Short" }, text: { en: "Thank you for writing to us.", pl: "Dziękujemy za wiadomość." } },
    { label: {}, text: { en: PROMISE, pl: "Dziękujemy za cierpliwość." } }] } });
  const cardIn = (cid) => JSON.parse(fs.readFileSync(path.join(dir, "draft.json"), "utf8")).cards.find((x) => x.id === cid);
  const draft = () => cardIn(id);

  const src = fs.readFileSync(path.join(ROOT, "engine", "pinned", "src", "modules", "catalog-v2.js"), "utf8");
  const CV2 = await import("data:text/javascript;base64," + Buffer.from(src).toString("base64"));
  const saved = [];
  const api = { saveCard: async (d, cid, patch) => { saved.push(JSON.parse(JSON.stringify(patch)));
    return JSON.parse(JSON.stringify(Object.assign({ error: null }, await S.saveCard(d, cid, patch)))); } };
  const home = loadPage({ api, uiLang: "en", vars: engineVars() });
  const P = home.page, doc = home.doc, node = home.node;
  const open = await S.openProject(dir);
  Object.assign(P.S, { open, screen: "project", section: "cards", lang: "both", sel: id });
  P.__set("CV2", CV2);
  const ed = () => String(P.editorHtml(P.cardById(id)));
  const el = (attrs) => ({ getAttribute: (k) => (k in attrs ? attrs[k] : null) });
  /* a text box as the page finds it, its attributes, words and caret set, its mirror before it; the stand-in keeps one
     element per selector, and the box inside its .mg-field is the same box */
  const qsWas = doc.querySelector;
  doc.querySelector = (sel) => qsWas.call(doc, String(sel).replace(/^\.mg-field>/, ""));
  const box = (i, l, value, caret) => {
    const t = node('textarea[data-rp="' + i + '"][data-l="' + l + '"]');
    Object.assign(t.attrs, { "data-rp": String(i), "data-l": l });
    t.value = value; t.selectionStart = t.selectionEnd = caret == null ? value.length : caret;
    t.setSelectionRange = (a) => { t.caret = a; };
    if (!t.previousElementSibling) t.previousElementSibling = { classList: { contains: (k) => k === "mg-mirror" }, isConnected: true, innerHTML: "" };
    return t;
  };
  const tick = () => new Promise((r) => setTimeout(r, 5));
  const type = (target, data) => { for (const h of doc.heard.filter((x) => x.type === "input")) h.fn({ target, data, inputType: data ? "insertText" : "" }); };

  /* ---- the commitment mirror ---------------------------------------------------------------------------------------- */
  const sug = open.likely[id];
  const html = ed();
  const lintRow = (open.lint.rows || []).some((r) => r.card === id && r.kind === "commitment" && r.severity === "suggestion");
  check(!!sug && sug.lang === "en" && lintRow
        && /<div class="mg-field"><div class="mg-mirror" aria-hidden="true">Thank you for waiting\. <span class="mg-w">We<\/span> <span class="mg-w">will<\/span>/.test(html)
        && /<textarea class="ta" data-rp="1" data-l="en" aria-label="Reply\u00a02 EN" aria-description="Checks: “We will send you a replacement today” reads like a commitment\.">/.test(html)
        && /<div class="mg-slot" data-mg="r1-en"><div class="bub mg-bub"[^>]*><span class="bub-tip"><\/span><p><b>Reads like /.test(html)
        && /data-act="mg-mark"/.test(html) && /data-act="mg-not"/.test(html) && /<kbd>F8<\/kbd>: next/.test(html)
        && count(html, /class="bub mg-bub"/g) === 1 && count(html, /class="mg-slot"/g) === 4 && count(html, /class="mg-w"/g) === 7
        && !/id="cardLikely"/.test(html),
    "rx1 the second alternative's English box draws the wave under “" + (sug && sug.phrase) + "” and names it under the box, the"
    + " only one of four boxes to do so: " + JSON.stringify({ slots: count(html, /class="mg-slot"/g), lines: count(html, /class="bub mg-bub"/g) }));

  /* typed into the first reply: its mirror follows the words, the block saves them, and the save's answer moves the wave,
     the line and what the box says to the ear (tookLinks, mgPaint); the second reply's box and line stand as rx1 drew them */
  const secondBox = box(1, "en", PROMISE), second = secondBox.previousElementSibling;
  secondBox.setAttribute("aria-description", (/data-rp="1" data-l="en" aria-label="[^"]*" aria-description="([^"]*)"/.exec(html) || [, "x"])[1]);
  const heardWas = secondBox.getAttribute("aria-description");
  second.innerHTML = (/<div class="mg-mirror" aria-hidden="true">(Thank you for waiting\.[^]*?)<\/div>/.exec(html) || [, ""])[1];
  node('.mg-slot[data-mg="r1-en"]').innerHTML = (/<div class="mg-slot" data-mg="r1-en">([\s\S]*?<\/div><\/div>)<\/div>/.exec(html) || [, "x"])[1];
  saved.length = 0;
  const first = box(0, "en", "Thank you for writing to us. " + LATER + ".");
  type(first, "");
  await tick();
  const followed = first.previousElementSibling.innerHTML, secondWas = count(second.innerHTML, /class="mg-w"/g);
  await P.flush();
  const typed = ((saved[saved.length - 1] || {}).replies || { blocks: [] }).blocks;
  const r0 = node('.mg-slot[data-mg="r0-en"]').innerHTML, r1 = node('.mg-slot[data-mg="r1-en"]').innerHTML;
  const waves = [count(first.previousElementSibling.innerHTML, /class="mg-w"/g), count(second.innerHTML, /class="mg-w"/g)];
  const heard = [first.getAttribute("aria-description"), secondBox.getAttribute("aria-description")];
  check(followed === "Thank you for writing to us. " + LATER + ".\n" && secondWas === 7
        && /^Checks: .We will send you a replacement today. reads like a commitment\.$/.test(heardWas)
        && /^Checks: .I will refund the postage today. reads like a commitment\.$/.test(heard[0]) && heard[1] === null
        && typed.length === 2 && typed[0].text.en === "Thank you for writing to us. " + LATER + "." && typed[1].text.en === PROMISE
        && draft().body.en.split("\n\n")[0] === "[alt:Short]\nThank you for writing to us. " + LATER + "."
        && P.S.open.likely[id] && P.S.open.likely[id].phrase === LATER
        && /<span class="mg-w">postage<\/span>/.test(first.previousElementSibling.innerHTML) && waves.join() === "6,0"
        && /^<div class="bub mg-bub"/.test(r0) && r1 === "",
    "rx2 a commitment typed into the first reply is mirrored as typed and saved through the block, and the save's answer moves"
    + " the wave, the line and what the box says to the ear under that reply and off the second: "
    + JSON.stringify({ waves, first: r0.slice(0, 26), second: r1, heard }));

  /* ---- answered from the reply's line ---------------------------------------------------------------------------- */
  const card = P.cardById(id);
  await P.ACTS["mg-mark"]();
  await P.flush();
  const at0 = String(P.mgSlot(card, "en", 0)), at1 = String(P.mgSlot(card, "en", 1)), atBody = String(P.mgSlot(card, "en"));
  check(card.commits === true && draft().commits === true && /^<p class="mg-said" id="mgBub">/.test(at0) && at1 === "" && atBody === ""
        && String(P.mgSlot(card, "pl", 0)) === "",
    "rx3 Mark as a commitment from the first reply's line ticks the card in the file and folds that line there alone: "
    + JSON.stringify([at0.slice(0, 32), at1, atBody]));

  /* ---- the variable menu ------------------------------------------------------------------------------------------ */
  P.S.rp = null;
  const html2 = ed();
  const presses = [...html2.matchAll(/data-act="vr-insert" data-l="(en|pl)" data-vr-at="(\d)"/g)].map((m) => m[2] + m[1]).sort().join();
  const places = [...html2.matchAll(/<span data-vr-ins="([^"]+)"><\/span>/g)].map((m) => m[1]).sort().join();
  /* the page paints its menus into the holders on screen: the stand-in hands it these four */
  const holders = ["r0-en", "r0-pl", "r1-en", "r1-pl"].map((k) => { const h = node("holder " + k); h.attrs["data-vr-ins"] = k; h.innerHTML = ""; return h; });
  const wasAll = doc.querySelectorAll;
  doc.querySelectorAll = (sel) => (sel === "[data-vr-ins]" ? holders : wasAll.call(doc, sel));
  P.ACTS["vr-insert"](el({ "data-l": "en", "data-vr-at": "1" }));
  const opened = holders.filter((h) => /class="vr-menu vr-insm"/.test(h.innerHTML)).map((h) => h.attrs["data-vr-ins"]).join();
  check(presses === "0en,0pl,1en,1pl" && places === "r0-en,r0-pl,r1-en,r1-pl" && count(html2, /class="vr-or"/g) === 2
        && /data-vr-at="0"[^]*?<span class="vr-or">or type \{ in the text<\/span>/.test(html2) && !/data-f="body"/.test(html2)
        && opened === "r1-en" && /data-act="vr-ins" data-v="NAME"/.test(holders[2].innerHTML),
    "rx4 Insert variable under each reply in each language, its menu opening under the pressed box alone, and the { line said"
    + " on the first reply: " + JSON.stringify({ presses, opened, lines: count(html2, /class="vr-or"/g) }));

  saved.length = 0;
  const t1 = box(1, "en", "Dear , thank you for waiting.", 5);
  P.ACTS["vr-ins"](el({ "data-v": "NAME" }));
  await tick();
  const insMirror = t1.previousElementSibling.innerHTML;
  await P.flush();
  const ins = ((saved[saved.length - 1] || {}).replies || { blocks: [] }).blocks;
  const errs = ((await S.lintProject(dir)).rows || []).filter((r) => r.card === id && r.severity === "error").length;
  const w = draft();
  check(t1.value === "Dear {NAME}, thank you for waiting." && t1.caret === 11 && ins.length === 2
        && ins[1].text.en === "Dear {NAME}, thank you for waiting." && ins[0].text.en === "Thank you for writing to us. " + LATER + "."
        && ins[1].text.pl === "Dziękujemy za cierpliwość." && w.bodyShape === "alts"
        && w.body.en.split("\n\n")[1] === "[alt]\nDear {NAME}, thank you for waiting." && !/\{NAME\}/.test(w.body.pl) && errs === 0
        && P.S.vrIns === null && insMirror === "Dear {NAME}, thank you for waiting.\n",
    "rx5 {NAME} chosen from the second reply's English menu goes in at its caret and is saved in that reply alone, the card still"
    + " alternatives, the lint clean and the box's mirror following: " + JSON.stringify({ en: w.body.en, mirror: insMirror }));

  saved.length = 0;
  const t2 = box(0, "pl", "Dzień dobry {\nDziękujemy za wiadomość.", 13);
  type(t2, "{");
  const braced = P.S.vrIns && P.S.vrIns.l === "pl" && P.S.vrIns.i === 0 && P.S.vrIns.brace === true;
  const opened2 = holders.filter((h) => /class="vr-menu vr-insm"/.test(h.innerHTML)).map((h) => h.attrs["data-vr-ins"]).join();
  P.ACTS["vr-ins"](el({ "data-v": "NAME" }));
  doc.querySelectorAll = wasAll;
  await P.flush();
  const br = ((saved[saved.length - 1] || {}).replies || { blocks: [] }).blocks;
  check(braced && opened2 === "r0-pl" && t2.value === "Dzień dobry {NAME}\nDziękujemy za wiadomość." && br.length === 2
        && br[0].text.pl === "Dzień dobry {NAME}\nDziękujemy za wiadomość." && br[1].text.en === "Dear {NAME}, thank you for waiting."
        && draft().body.pl.split("\n\n")[0] === "[alt]\nDzień dobry {NAME}\nDziękujemy za wiadomość.",
    "rx6 a { typed into the first reply's Polish box opens its menu there, and the variable takes the brace's place, saved"
    + " through the block: " + JSON.stringify({ opened: opened2, pl: draft().body.pl.split("\n\n")[0] }));

  /* the save has come back and nothing waits: a keystroke that brings a reply's note paints the block again from what was
     typed, not from the card's last saved body */
  saved.length = 0;
  const kept = "Dear {NAME}, thank you for waiting.\n\nStill the same reply.";
  type(box(1, "en", kept), "");
  const painted = String(node("#cardEditor").outerHTML);
  await P.flush();
  const nb = ((saved[saved.length - 1] || {}).replies || { blocks: [] }).blocks;
  check(nb.length === 2 && nb[1].text.en === kept && /class="n rp-warn">A blank line would split this reply in two/.test(painted)
        && painted.indexOf("Still the same reply.</textarea>") > 0
        && draft().body.en.split("\n\n")[1] === "[alt]\nDear {NAME}, thank you for waiting.\nStill the same reply.",
    "rx7 a keystroke that brings a reply's note while no save waits is kept: the block is painted again from the words typed,"
    + " and saved with them: " + JSON.stringify(draft().body.en.split("\n\n")[1]));

  /* ---- CONTROL: the body's own box, through the same functions ------------------------------------------------------- */
  const plainId = (await S.addCard(dir, shelf, "Plain card", "Hello.")).card.id;
  P.S.open = await S.openProject(dir);
  P.S.sel = plainId; P.S.rp = null;
  const plainEd = String(P.editorHtml(P.cardById(plainId)));
  const bodyBox = node('textarea[data-f="body"][data-l="en"]');
  Object.assign(bodyBox.attrs, { "data-f": "body", "data-l": "en" });
  bodyBox.value = "Hello {"; bodyBox.selectionStart = bodyBox.selectionEnd = 7; bodyBox.setSelectionRange = (a) => { bodyBox.caret = a; };
  bodyBox.previousElementSibling = { classList: { contains: (k) => k === "mg-mirror" }, isConnected: true, innerHTML: "Hello.\n" };
  const chips = node('[data-chips="en"]'); chips.innerHTML = "as painted for Hello.";
  const bodyHolder = node("holder en"); bodyHolder.attrs["data-vr-ins"] = "en"; bodyHolder.innerHTML = "";
  doc.querySelectorAll = (sel) => (sel === "[data-vr-ins]" ? holders.concat([bodyHolder]) : wasAll.call(doc, sel));
  saved.length = 0;
  type(bodyBox, "{");
  const bodyOpened = /class="vr-menu vr-insm"/.test(bodyHolder.innerHTML) && !holders.some((h) => /vr-insm/.test(h.innerHTML));
  await tick();
  const keyed = { chips: chips.innerHTML, mirror: bodyBox.previousElementSibling.innerHTML };
  P.ACTS["vr-ins"](el({ "data-v": "NAME" }));
  doc.querySelectorAll = wasAll;
  await tick();
  const took = { chips: chips.innerHTML, mirror: bodyBox.previousElementSibling.innerHTML };
  await P.flush();
  const plainCard = JSON.parse(fs.readFileSync(path.join(dir, "draft.json"), "utf8")).cards.find((x) => x.id === plainId);
  check(/<textarea class="ta tall" data-f="body" data-l="en">Hello\.<\/textarea><\/div><div class="mg-slot" data-mg="en">/.test(plainEd)
        && /data-act="vr-insert" data-l="en" aria-haspopup="menu"/.test(plainEd) && /<span data-vr-ins="en"><\/span>/.test(plainEd)
        && !/rp-row/.test(plainEd) && bodyOpened && bodyBox.value === "Hello {NAME}" && bodyBox.caret === 12
        && saved.length >= 1 && saved.every((p) => p.body && !p.replies) && plainCard.body.en === "Hello {NAME}"
        && ["alts", "steps"].indexOf(plainCard.bodyShape) < 0
        && keyed.chips === String(P.chipsFor("Hello {", "en")) && keyed.mirror === "Hello {\n"
        && took.chips === String(P.chipsFor("Hello {NAME}", "en")) && /\{NAME\}/.test(took.chips) && took.mirror === "Hello {NAME}\n",
    "rx8 CONTROL: a one-reply card keeps its body's box, its { opening the body's menu and the variable saved as the body, its"
    + " chips and mirror following the key and the variable: "
    + JSON.stringify({ opened: bodyOpened, body: plainCard.body.en, patches: saved.length, mirror: took.mirror, chips: took.chips.length }));

  /* ---- one copy of each rule -------------------------------------------------------------------------------------- */
  /* read with its comments taken out, so a rule kept only in a comment counts as none (the test architect's read of E3) */
  const app = withoutComments(fs.readFileSync(path.join(ROOT, "ui", "app.js"), "utf8"), "app.js");
  const once = { mirror: count(app, /class="mg-mirror"/g), insertRow: count(app, /class="vr-insrow"/g), brace: count(app, /e\.data === "\{"/g) };
  check(once.mirror === 1 && once.insertRow === 1 && once.brace === 1,
    "rx9 the mirror, the Insert variable row and the { that opens the menu are each written once in ui/app.js, comments"
    + " aside: " + JSON.stringify(once));

  /* ---- each leg below on a card of its own, shaped as alternatives ------------------------------------------------ */
  const shapedCard = async (title, blocks, shape) => {
    await P.flush();
    const cid = (await S.addCard(dir, shelf, title, "Placeholder.")).card.id;
    await S.saveCard(dir, cid, { replies: { shape: shape || "alts", blocks } });
    P.S.open = await S.openProject(dir);
    Object.assign(P.S, { sel: cid, rp: null, vrIns: null });
    return cid;
  };
  const edOf = (cid) => String(P.editorHtml(P.cardById(cid)));
  const lastBlocks = () => ((saved[saved.length - 1] || {}).replies || { blocks: [] }).blocks;
  /* the boxes whose slot holds the line naming the finding, and the waves in each reply's mirror, read from the markup */
  const lineUnder = (h) => [...h.matchAll(/<div class="mg-slot" data-mg="([^"]+)">(<div class="bub mg-bub")?/g)].filter((m) => m[2]).map((m) => m[1]).join();
  const wavesIn = (h) => [...h.matchAll(/<div class="mg-mirror" aria-hidden="true">([\s\S]*?)<\/div><textarea class="ta" data-rp="(\d+)" data-l="(\w+)"/g)]
    .map((m) => "r" + m[2] + "-" + m[3] + ":" + count(m[1], /class="mg-w"/g)).join();

  /* ---- a key typed after a save has come back --------------------------------------------------------------------- */
  const k10 = await shapedCard("Kept key", [{ label: { en: "Short" }, text: { en: "Thank you for writing to us.", pl: "Dziękujemy za wiadomość." } },
    { label: {}, text: { en: PROMISE, pl: "Dziękujemy za cierpliwość." } }]);
  edOf(k10);
  saved.length = 0;
  type(box(0, "pl", "Dziękujemy bardzo."), "");
  await P.flush();                            /* the save has come back: the card's body is the file's, and nothing waits */
  const landed = saved.length;
  type(box(0, "en", "Thank you for writing to us!"), "");
  await P.flush();
  const kb = lastBlocks();
  check(landed === 1 && saved.length === 2 && P.likelyFor(P.cardById(k10)) && P.likelyFor(P.cardById(k10)).lang === "en"
        && kb.length === 2 && kb[0].text.en === "Thank you for writing to us!" && kb[0].text.pl === "Dziękujemy bardzo."
        && cardIn(k10).body.en.split("\n\n")[0] === "[alt:Short]\nThank you for writing to us!",
    "rx10 after a save has come back, a key typed into the first reply in the finding's language is saved and in the file: "
    + JSON.stringify(cardIn(k10).body.en.split("\n\n")[0]));

  /* ---- a label typed after a save has come back, where it takes a note away ---------------------------------------- */
  const k11 = await shapedCard("Kept label", [{ label: { en: "Short" }, text: { en: "Thank you for writing to us.", pl: "Dziękujemy." } },
    { label: {}, text: { en: "Second reply.", pl: "" } }]);
  edOf(k11);
  saved.length = 0;
  type(box(0, "en", "Thank you for writing to us, again."), "");
  await P.flush();
  const notesWas = P.S.rp.notes;
  const label = node('input[data-rp-label="1"][data-l="pl"]');
  Object.assign(label.attrs, { "data-rp-label": "1", "data-l": "pl" });
  label.value = "Krótko";
  type(label, "");
  const notesNow = P.S.rp.notes, paintedL = String(node("#cardEditor").outerHTML);
  await P.flush();
  const lb = lastBlocks();
  check(notesWas === "--|-g" && notesNow === "--|--" && /data-rp-label="1" data-l="pl" placeholder="[^"]*" value="Krótko"/.test(paintedL)
        && lb.length === 2 && lb[1].label.pl === "Krótko" && lb[0].text.en === "Thank you for writing to us, again."
        && cardIn(k11).body.pl === "[alt]\nDziękujemy.\n\n[alt:Krótko]",
    "rx11 after a save has come back, a label typed into the second reply's Polish takes its note away and is painted, saved"
    + " and in the file: " + JSON.stringify({ notes: [notesWas, notesNow], pl: cardIn(k11).body.pl }));

  /* ---- the phrase as the finder reads it --------------------------------------------------------------------------- */
  const k12a = await shapedCard("Variable inside", [{ label: {}, text: { en: "Thank you for writing to us.", pl: "Dziękujemy." } },
    { label: {}, text: { en: "Thank you for waiting. We will send you {PRODUCT} today.", pl: "Dziękujemy." } }]);
  const sugA = P.likelyFor(P.cardById(k12a)), hA = edOf(k12a);
  const k12b = await shapedCard("Curly apostrophe", [{ label: {}, text: { en: "Thank you for writing to us.", pl: "Dziękujemy." } },
    { label: {}, text: { en: "Thank you for waiting. We\u2019ll send you a new one today.", pl: "Dziękujemy." } }]);
  const sugB = P.likelyFor(P.cardById(k12b)), hB = edOf(k12b);
  const cased = String(P.mgMirror("Thank you. we WILL send you a replacement today, as promised.", "We will send you a replacement today"));
  check(sugA && sugA.phrase === "We will send you today" && lineUnder(hA) === "r1-en" && wavesIn(hA) === "r0-en:0,r0-pl:0,r1-en:6,r1-pl:0"
        && /<span class="mg-w">\{PRODUCT\}<\/span> <span class="mg-w">today<\/span>\./.test(hA)
        && sugB && sugB.phrase === "We'll send you a new one today" && lineUnder(hB) === "r1-en" && wavesIn(hB) === "r0-en:0,r0-pl:0,r1-en:7,r1-pl:0"
        && /<span class="mg-w">We\u2019ll<\/span>/.test(hB)
        && count(cased, /class="mg-w"/g) === 7 && /^Thank you\. <span class="mg-w">we<\/span>/.test(cased),
    "rx12 the wave and the line find the phrase as the finder reads it, around a variable, past a curly apostrophe and in"
    + " another case: " + JSON.stringify({ variable: [sugA && sugA.phrase, lineUnder(hA)], curly: [sugB && sugB.phrase, lineUnder(hB)],
      cased: count(cased, /class="mg-w"/g) }));

  /* ---- which reply the line goes under ----------------------------------------------------------------------------- */
  const k13 = await shapedCard("Two holding it", [{ label: {}, text: { en: "Thank you for writing to us.", pl: "Dziękujemy." } },
    { label: {}, text: { en: PROMISE, pl: "Dziękujemy." } },
    { label: {}, text: { en: "Once more: we will send you a replacement today, without fail.", pl: "Dziękujemy." } }]);
  const twice = edOf(k13), sug13 = P.likelyFor(P.cardById(k13));
  /* a finding whose words no reply holds now, as when they are typed away and the block painted before the save is back */
  P.S.open.likely[k13] = Object.assign({}, sug13, { phrase: "We will post the parcel on Monday" });
  const none = edOf(k13);
  check(sug13 && sug13.phrase === "We will send you a replacement today" && lineUnder(twice) === "r1-en"
        && /^r0-en:0,r0-pl:0,r1-en:7,r1-pl:0,r2-en:0/.test(wavesIn(twice))
        && lineUnder(none) === "r0-en" && count(none, /class="bub mg-bub"/g) === 1 && count(none, /class="mg-w"/g) === 0,
    "rx13 the phrase in two replies: the line under the first; in none: under the first reply, never lost: "
    + JSON.stringify({ two: lineUnder(twice), none: lineUnder(none) }));

  /* ---- Insert variable pressed under one reply, then another --------------------------------------------------------- */
  P.ACTS["vr-insert"](el({ "data-l": "en", "data-vr-at": "1" }));
  const m1 = JSON.stringify(P.S.vrIns);
  P.ACTS["vr-insert"](el({ "data-l": "en", "data-vr-at": "0" }));
  const m2 = JSON.stringify(P.S.vrIns);
  P.ACTS["vr-insert"](el({ "data-l": "en", "data-vr-at": "0" }));
  const m3 = JSON.stringify(P.S.vrIns);
  check(m1 === '{"l":"en","i":1,"brace":false}' && m2 === '{"l":"en","i":0,"brace":false}' && m3 === "null",
    "rx14 Insert variable pressed under the first reply while the second's menu is open moves the menu there; pressed again,"
    + " it closes: " + JSON.stringify([m1, m2, m3]));

  /* ---- a block painted again puts new boxes on screen ---------------------------------------------------------------- */
  /* Each paint of the editor (its outerHTML) hands out new reply boxes and labels, read from the markup just painted, their
     caret at the start as a box built from markup has it; the ones before leave the screen, and the focus with them. A box
     off the screen takes no focus. */
  const shot = { gen: 0, made: new Map() };
  const edNode = node("#cardEditor");
  Object.defineProperty(edNode, "outerHTML", { configurable: true, get() { return this._html; },
    set(v) { this._html = String(v); shot.gen++; for (const b of shot.made.values()) b.isConnected = false;
      if (doc.focused && doc.focused.isConnected === false) doc.focused = null; } });
  const unesc = (t) => t.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&");
  const qsBox = doc.querySelector;
  doc.querySelector = (sel) => {
    const m = /^(?:\.mg-field>)?(?:textarea)?\[data-rp(-label)?="(\d+)"\]\[data-l="(\w+)"\]$/.exec(String(sel));
    if (!m) return qsBox.call(doc, sel);
    const key = shot.gen + (m[1] ? " label " : " box ") + m[2] + " " + m[3];
    if (shot.made.has(key)) return shot.made.get(key);
    const at = m[1] ? new RegExp('<input class="field" data-rp-label="' + m[2] + '" data-l="' + m[3] + '"[^>]*? value="([^"]*)"').exec(edNode._html)
      : new RegExp('<textarea class="ta" data-rp="' + m[2] + '" data-l="' + m[3] + '"[^>]*>([^<]*)</textarea>').exec(edNode._html);
    if (!at) return null;
    const b = doc.createElement(m[1] ? "input" : "textarea");
    Object.assign(b.attrs, { [m[1] ? "data-rp-label" : "data-rp"]: m[2], "data-l": m[3] });
    Object.assign(b, { value: unesc(at[1]), selectionStart: 0, selectionEnd: 0, isConnected: true, gen: shot.gen });
    b.setSelectionRange = (x, y) => { b.selectionStart = x; b.selectionEnd = y; };
    b.focus = () => { if (b.isConnected) doc.focused = b; };
    if (!m[1]) b.previousElementSibling = { classList: { contains: (k) => k === "mg-mirror" }, isConnected: true, innerHTML: "" };
    shot.made.set(key, b);
    return b;
  };
  /* a key pressed where the focus is: into its box at its caret, then the page hears it */
  const press = (ch) => {
    const t = doc.activeElement;
    if (!t || t.isConnected !== true || typeof t.selectionStart !== "number") return false;
    const a = t.selectionStart;
    t.value = t.value.slice(0, a) + ch + t.value.slice(t.selectionEnd);
    t.selectionStart = t.selectionEnd = a + ch.length;
    type(t, ch);
    return true;
  };
  const replyBox = (i) => doc.querySelector('textarea[data-rp="' + i + '"][data-l="en"]');

  const k15 = await shapedCard("New alternative", [{ label: {}, text: { en: "One.", pl: "Jeden." } }, { label: {}, text: { en: "Two.", pl: "Dwa." } }]);
  edNode.outerHTML = edOf(k15);
  P.ACTS["rp-add"]();                              /* a third alternative, empty: each language says the desks would skip it */
  const gapSaid = /Empty here, so the desks skip it in EN/.test(edNode._html);
  const third = replyBox(2);
  third.focus();
  const pressedH = press("H");
  const afterH = doc.activeElement, genH = shot.gen, menuH = P.S.vrIns;   /* an H is not a {: no menu */
  const pressedI = press("i");
  const live3 = replyBox(2);
  check(gapSaid && pressedH && third.isConnected === false && afterH === live3 && pressedI && doc.activeElement === live3
        && live3.gen === genH && live3.value === "Hi" && live3.selectionStart === 2 && P.S.rp.blocks[2].text.en === "Hi"
        && !/Empty here, so the desks skip it in EN/.test(edNode._html) && menuH === null,
    "rx15 \"Hi\" typed into a new alternative, its note going at the H, is \"Hi\" in the box on screen, focused with its caret"
    + " after the i, and the H opened no menu: "
    + JSON.stringify({ value: live3.value, caret: live3.selectionStart, focused: doc.activeElement === live3, menu: menuH }));

  P.ACTS["rp-add"]();
  replyBox(3).focus();
  const pressedBrace = press("{");
  const braceMenu = JSON.stringify(P.S.vrIns);
  P.ACTS["vr-ins"](el({ "data-v": "NAME" }));
  const live4 = replyBox(3);
  P.ACTS["rp-add"]();
  P.ACTS["vr-insert"](el({ "data-l": "en", "data-vr-at": "4" }));
  doc.focused = null;                              /* the press took the focus to the button */
  const before5 = replyBox(4);
  P.ACTS["vr-ins"](el({ "data-v": "NAME" }));
  const live5 = replyBox(4);
  await P.flush();
  const alts = cardIn(k15).body.en.split("\n\n");
  check(pressedBrace && braceMenu === '{"l":"en","i":3,"brace":true}' && live4.value === "{NAME}" && live4.selectionStart === 6
        && before5.value === "{NAME}" && before5.isConnected === false && live5 !== before5 && live5.value === "{NAME}"
        && doc.activeElement === live5 && live5.selectionStart === 6
        && alts.join("|") === "[alt]\nOne.|[alt]\nTwo.|[alt]\nHi|[alt]\n{NAME}|[alt]\n{NAME}",
    "rx16 a { typed first into a new alternative and NAME chosen gives {NAME}; NAME put into an empty one from Insert variable"
    + " leaves the caret after it in the box on screen: " + JSON.stringify({ brace: live4.value, caret: live5.selectionStart, en: alts.slice(2) }));
  doc.querySelector = qsBox;
  delete edNode.outerHTML;

  /* ---- a card shaped as steps: the same Insert variable under each reply (the test architect's read of E3, H2) -------- */
  const k17 = await shapedCard("Steps", [{ label: {}, text: { en: "First we look.", pl: "Najpierw patrzymy." } },
    { label: {}, text: { en: "Then we answer.", pl: "Potem odpowiadamy." } }], "steps");
  const h17 = edOf(k17);
  const presses17 = [...h17.matchAll(/data-act="vr-insert" data-l="(en|pl)" data-vr-at="(\d)"/g)].map((m) => m[2] + m[1]).sort().join();
  const places17 = [...h17.matchAll(/<span data-vr-ins="([^"]+)"><\/span>/g)].map((m) => m[1]).sort().join();
  check(cardIn(k17).bodyShape === "steps" && /Add a step/.test(h17) && presses17 === "0en,0pl,1en,1pl"
        && places17 === "r0-en,r0-pl,r1-en,r1-pl" && count(h17, /class="vr-or"/g) === 2 && !/data-f="body"/.test(h17),
    "rx17 a card shaped as steps has Insert variable under each of its two replies in each language: "
    + JSON.stringify({ shape: cardIn(k17).bodyShape, presses: presses17, places: places17 }));

  /* ---- a finding in Polish alone (the test architect's read of E3, H7) ------------------------------------------------- */
  const k18 = await shapedCard("Polish promise", [{ label: {}, text: { en: "Thank you for writing to us.", pl: "Dziękujemy za wiadomość." } },
    { label: {}, text: { en: "Thank you for your patience.", pl: "Dziękujemy za cierpliwość. Wyślemy dziś nową paczkę." } }]);
  const sug18 = P.likelyFor(P.cardById(k18)), h18 = edOf(k18);
  check(sug18 && sug18.lang === "pl" && sug18.phrase === "Wyślemy dziś nową paczkę" && lineUnder(h18) === "r1-pl"
        && wavesIn(h18) === "r0-en:0,r0-pl:0,r1-en:0,r1-pl:4" && count(h18, /class="bub mg-bub"/g) === 1
        && /data-rp="1" data-l="pl" aria-label="[^"]*" aria-description="Checks: /.test(h18) && !/data-l="en"[^>]*aria-description/.test(h18),
    "rx18 a finding in the second reply's Polish alone puts the line under that reply's Polish box and the wave in its mirror,"
    + " and nothing under an English box: " + JSON.stringify({ lang: sug18 && sug18.lang, line: lineUnder(h18), waves: wavesIn(h18) }));

  /* ---- the variable menu's keys (Claude α's ruling of 2026-10-12 23:44) ------------------------------------------------- */
  /* A key as the window hands it to the page: the document's capture listeners in the order the page added them, then the
     rest, a stop honoured as the window honours it (stopPropagation lets the rest of that phase on the document run, and
     stopImmediatePropagation does not), the target where the focus is. */
  const key = (k, shift) => {
    const e = { key: k, target: doc.activeElement, ctrlKey: false, altKey: false, metaKey: false, shiftKey: !!shift,
      defaultPrevented: false, stopped: false, halted: false, preventDefault() { this.defaultPrevented = true; },
      stopPropagation() { this.stopped = true; }, stopImmediatePropagation() { this.stopped = this.halted = true; } };
    const ls = doc.heard.filter((h) => h.type === "keydown");
    for (const capture of [true, false]) {
      for (const h of ls.filter((x) => x.capture === capture)) { if (e.halted) break; h.fn(e); }
      if (e.stopped) break;
    }
    return e;
  };
  /* the menu's items as the page finds them, read from the holder it painted, one element each while that markup stands;
     the Insert variable buttons, one per box, found by what the selector asks of them */
  const allHolders = holders.concat([bodyHolder]), itemsOf = new Map(), buttons = new Map();
  const items = () => {
    const h = allHolders.find((x) => /class="vr-menu vr-insm"/.test(x.innerHTML));
    if (!h) return [];
    if (!itemsOf.has(h.innerHTML)) itemsOf.set(h.innerHTML, [...h.innerHTML.matchAll(/<button type="button" role="menuitem" class="vr-mi" data-act="vr-ins" data-v="([^"]+)"/g)].map((m) => {
      const b = doc.createElement("button");
      Object.assign(b.attrs, { role: "menuitem", "data-act": "vr-ins", "data-v": m[1] });
      b.isConnected = true;
      b.closest = (s) => (s === ".vr-insm" || s === "[data-act]" ? b : null);
      b.focus = () => { doc.focused = b; };
      return b;
    }));
    return itemsOf.get(h.innerHTML);
  };
  const button = (l, i) => {
    const k = l + " " + (i == null ? "body" : i);
    if (!buttons.has(k)) {
      const b = doc.createElement("button");
      Object.assign(b.attrs, { "data-act": "vr-insert", "data-l": l }, i == null ? {} : { "data-vr-at": String(i) });
      b.isConnected = true;
      b.focus = () => { doc.focused = b; };
      buttons.set(k, b);
    }
    return buttons.get(k);
  };
  const qsKeys = doc.querySelector, qsaKeys = doc.querySelectorAll;
  doc.querySelector = (sel) => {
    const s = String(sel);
    if (!/data-act="vr-insert"/.test(s)) return qsKeys.call(doc, sel);
    const at = /data-vr-at="(\d+)"/.exec(s);
    return button((/data-l="(\w+)"/.exec(s) || [, ""])[1], at ? +at[1] : null);
  };
  doc.querySelectorAll = (sel) => (sel === "[data-vr-ins]" ? allHolders : /role="menuitem"/.test(String(sel)) ? items() : qsaKeys.call(doc, sel));
  /* a box the hand can be in, its caret moved as the window moves it */
  const field = (t, value, caret) => {
    t.value = value; t.selectionStart = t.selectionEnd = caret;
    t.setSelectionRange = (a, b) => { t.selectionStart = a; t.selectionEnd = b == null ? a : b; };
    t.focus = () => { doc.focused = t; };
    t.focus();
    return t;
  };
  const names = () => items().map((b) => b.getAttribute("data-v"));
  const on = () => (doc.activeElement && doc.activeElement.getAttribute ? doc.activeElement.getAttribute("data-v") || "" : "");
  const pressedBox = node("#pressed");
  pressedBox.hidden = false;                      /* a landed publish's box: an Escape any other handler hears shuts it */
  const kK = await shapedCard("Keys", [{ label: {}, text: { en: "One.", pl: "Jeden." } }, { label: {}, text: { en: "Dear , two.", pl: "Dwa." } }]);
  edOf(kK);

  /* Escape: from a { with the hand in the box; from Insert variable, walked into; from a {, walked into; on the body */
  const esc = {};
  const ra = field(box(1, "en", ""), "Dear {, two.", 6);
  type(ra, "{");
  const openA = /class="vr-menu vr-insm"/.test(holders[2].innerHTML), eA = key("Escape");
  esc.box = { open: openA, menu: P.S.vrIns, painted: holders[2].innerHTML, focused: doc.activeElement === ra, caret: ra.selectionStart,
    value: ra.value, prevented: eA.defaultPrevented, pressed: pressedBox.hidden };
  button("en", 0).focus();
  P.ACTS["vr-insert"](el({ "data-l": "en", "data-vr-at": "0" }));
  key("ArrowDown");
  const walkedB = on(), eB = key("Escape");
  esc.button = { walked: walkedB, menu: P.S.vrIns, painted: holders[0].innerHTML, focused: doc.activeElement === button("en", 0),
    prevented: eB.defaultPrevented, pressed: pressedBox.hidden };
  field(ra, "Dear {, two.", 6);
  type(ra, "{");
  key("ArrowDown"); key("ArrowDown");
  const walkedC = on(), eC = key("Escape");
  esc.walked = { walked: walkedC, menu: P.S.vrIns, focused: doc.activeElement === ra, caret: ra.selectionStart, value: ra.value,
    prevented: eC.defaultPrevented, pressed: pressedBox.hidden };
  await P.flush();
  P.S.sel = plainId; P.S.rp = null; P.S.vrIns = null;
  const bb = field(bodyBox, "Hello {", 7);
  type(bb, "{");
  const openD = /class="vr-menu vr-insm"/.test(bodyHolder.innerHTML), eD = key("Escape");
  const bodyShut = { menu: P.S.vrIns, painted: bodyHolder.innerHTML };
  type(bb, "{");
  key("ArrowDown");
  const walkedD = on(), eD2 = key("Escape");
  esc.body = { open: openD, shut: bodyShut, walked: walkedD, menu: P.S.vrIns, focused: doc.activeElement === bb, caret: bb.selectionStart,
    value: bb.value, prevented: eD.defaultPrevented && eD2.defaultPrevented, pressed: pressedBox.hidden };
  check(esc.box.open && esc.box.menu === null && esc.box.painted === "" && esc.box.focused && esc.box.caret === 6
        && esc.box.value === "Dear {, two." && esc.box.prevented && esc.box.pressed === false
        && esc.button.walked !== "" && esc.button.menu === null && esc.button.painted === "" && esc.button.focused
        && esc.button.prevented && esc.button.pressed === false
        && esc.walked.walked !== "" && esc.walked.menu === null && esc.walked.focused && esc.walked.caret === 6
        && esc.walked.value === "Dear {, two." && esc.walked.prevented && esc.walked.pressed === false
        && esc.body.open && esc.body.shut.menu === null && esc.body.shut.painted === "" && esc.body.walked !== ""
        && esc.body.menu === null && esc.body.focused && esc.body.caret === 7 && esc.body.value === "Hello {" && esc.body.prevented
        && esc.body.pressed === false,
    "rx19 Escape shuts the menu and nothing else, the hand left in the box at its caret or handed back to the box or the"
    + " button that opened it, on a reply and on the body: " + JSON.stringify(esc));

  /* Down and Up: from Insert variable on a reply, through both ends, Home and End; Up from a { in the box, where Shift and
     Down still belong to the box; on the body */
  P.S.sel = kK; P.S.rp = null; P.S.vrIns = null;
  edOf(kK);
  button("en", 1).focus();
  P.ACTS["vr-insert"](el({ "data-l": "en", "data-vr-at": "1" }));
  const all = names(), walk = [], held = [];
  for (const k of ["ArrowDown", "ArrowDown", "ArrowUp", "ArrowUp", "ArrowDown", "End", "Home"]) { held.push(key(k).defaultPrevented); walk.push(on()); }
  key("Escape");
  const rb = field(box(0, "en", ""), "One {", 5);
  type(rb, "{");
  const shifted = key("ArrowDown", true), shiftStayed = doc.activeElement === rb && !shifted.defaultPrevented;   /* the box's own */
  const fromBox = key("ArrowUp"), upFromBox = on();
  key("Escape");
  P.S.sel = plainId; P.S.rp = null; P.S.vrIns = null;
  field(bodyBox, "Hello {", 7);
  type(bodyBox, "{");
  const bodyWalk = [];
  for (const k of ["ArrowDown", "ArrowUp"]) { held.push(key(k).defaultPrevented); bodyWalk.push(on()); }
  key("Escape");
  const last = all[all.length - 1];
  check(all.length > 2 && walk.join() === [all[0], all[1], all[0], last, all[0], last, all[0]].join()
        && shiftStayed && fromBox.defaultPrevented && upFromBox === last && rb.value === "One {" && rb.selectionStart === 5
        && bodyWalk.join() === [all[0], last].join() && held.every(Boolean) && P.S.vrIns === null,
    "rx20 Down and Up walk the menu from the button or the box that opened it and wrap, Home and End go to its ends, on a"
    + " reply and on the body, Shift with an arrow left to the box: " + JSON.stringify({ walk, upFromBox, bodyWalk, shiftStayed, items: all.length }));

  /* Enter: a { in a reply's box, walked to the third item; Insert variable under the body, walked to the third item */
  P.S.sel = kK; P.S.rp = null; P.S.vrIns = null;
  edOf(kK);
  saved.length = 0;
  const re = field(box(1, "en", ""), "Dear {, two.", 6);
  type(re, "{");
  key("ArrowDown"); key("ArrowDown"); key("ArrowDown");
  const pickR = on(), eR = key("Enter");
  const tokR = "{" + pickR + "}", replyAfter = { value: re.value, caret: re.selectionStart, focused: doc.activeElement === re, menu: P.S.vrIns,
    painted: holders[2].innerHTML, prevented: eR.defaultPrevented };
  await P.flush();
  const savedR = lastBlocks();
  P.S.sel = plainId; P.S.rp = null; P.S.vrIns = null;
  field(bodyBox, "Hello , welcome.", 6);
  button("en", null).focus();
  P.ACTS["vr-insert"](el({ "data-l": "en" }));
  key("ArrowDown"); key("ArrowDown"); key("ArrowDown");
  const pickB = on(), eB2 = key("Enter");
  const tokB = "{" + pickB + "}", bodyAfter = { value: bodyBox.value, caret: bodyBox.selectionStart, focused: doc.activeElement === bodyBox,
    menu: P.S.vrIns, painted: bodyHolder.innerHTML, prevented: eB2.defaultPrevented };
  await P.flush();
  const plainNow = cardIn(plainId);
  check(pickR === all[2] && /^[A-Z][A-Z0-9_]*$/.test(pickR) && ["GENDER", "DAYPART"].indexOf(pickR) < 0
        && replyAfter.value === "Dear " + tokR + ", two." && replyAfter.caret === 5 + tokR.length && replyAfter.focused
        && replyAfter.menu === null && replyAfter.painted === "" && replyAfter.prevented
        && savedR.length === 2 && savedR[1].text.en === "Dear " + tokR + ", two." && cardIn(kK).body.en.split("\n\n")[1] === "[alt]\nDear " + tokR + ", two."
        && pickB === all[2] && bodyAfter.value === "Hello " + tokB + ", welcome." && bodyAfter.caret === 6 + tokB.length
        && bodyAfter.focused && bodyAfter.menu === null && bodyAfter.painted === "" && bodyAfter.prevented
        && plainNow.body.en === "Hello " + tokB + ", welcome.",
    "rx21 Enter on the item walked to puts it in at the caret, in the brace's place where a { opened the menu, saved, the caret"
    + " after it, on a reply and on the body: " + JSON.stringify({ reply: replyAfter.value, body: bodyAfter.value, carets: [replyAfter.caret, bodyAfter.caret] }));
  doc.querySelector = qsKeys; doc.querySelectorAll = qsaKeys;

  check(asserted === EXPECTED - 1, "rx22 every leg ran: " + (asserted + 1) + " of " + EXPECTED);
  dropScratch(LAB, "replies-boxes");
}

main().then(() => {
  console.log("#counts checks=" + asserted + " failed=" + failed + " expected=" + EXPECTED);
  console.log(failed ? "RESULT: FAIL " + failed + " failed" : "RESULT: ok " + asserted + " check(s)");
  process.exit(failed ? 1 : 0);
}, (e) => { console.log("  FAIL " + (e && e.stack || e)); console.log("RESULT: FAIL the leg did not complete"); process.exit(1); });
