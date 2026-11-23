/* THE REPLIES BLOCK (author-alternatives-and-steps-not-authorable, the Studio batch of 2026-10-12).
 *
 *     node tests/replies-block.mjs
 *
 *   rb1  saveCard's `replies` writes alternatives with the pinned engine's markers, a label where one is given, and a blank
 *        line inside a reply as one line break; the lint finds nothing, and the pinned desk reader reads back every reply
 *        and label in each language as written (Clément's read, C4)
 *   rb2  steps take no label and open each reply with [step], lint clean and read back the same; one reply joins the
 *        replies at a blank line and keeps the blank lines inside them (C3)
 *   rb3  a language with no reply written is left out of the body, and speaks the primary
 *   rb4  the editor shows a shaped card as its replies, the shown languages side by side, a label box on an alternative,
 *        no marker anywhere and no plain text box; with the engine's module not here yet it shows the plain boxes
 *   rb5  Add, Remove and Move up change the rows and save the whole block, in order
 *   rb6  the shape is chosen in place: to one reply joins the texts; from one, its text is the first reply
 *   rb7  a blank line typed in a reply is said, and saved as one line break; so are a run of space-only lines and a line
 *        holding only a non-breaking space, by v2Mark's own split, and the desk reads one reply (C2)
 *   rb9  an empty reply in a language that has others is named by Studio's lint as an error, since the desk reader drops it
 *        and moves every later reply up, and the editor says so under its box (C1)
 *   rb8  every leg ran
 *
 * Invented words. Node only, no window; how it looks is Maxim's eye.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as S from "../src/studio.mjs";
import { loadPage } from "./page-stand-in.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const EXPECTED = 9;
let asserted = 0, failed = 0;
function check(cond, line) {
  asserted++;
  if (cond) process.stdout.write("  ok   " + line + "\n");
  else { failed++; process.stdout.write("  FAIL " + line + "\n"); }
}

/* THE DESK'S OWN READ, sliced from the pinned engine and run unchanged (the template is Clément κ's round-trip probe):
   catalog-v2.js's catalogFromV2, then card-model.js's parts() and altLabelAt() over each language's body column. */
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
  return (dir, id, langs) => {
    const draft = JSON.parse(fs.readFileSync(path.join(dir, "draft.json"), "utf8"));
    const m = (CV2.catalogFromV2(draft).cards || []).find((x) => x.id === id);
    const out = {};
    for (const l of langs) if (D.cardText(m, "body", l)) {
      const ps = D.parts(m, l);
      out[l] = ps.map((p, i) => [p, D.altLabelAt(m, l, i)]);
    }
    return JSON.stringify(out);
  };
}

async function main() {
  const readBack = await deskReader();
  const LAB = fs.mkdtempSync(path.join(os.tmpdir(), "etiuda-replies-"));
  const made = await S.newProject(path.join(LAB, "projects"), "Replies", [{ code: "en", name: "English" }, { code: "pl", name: "Polish" }]);
  const dir = made.dir;
  const shelf = (await S.addTag(dir, "shelf", { en: "General", pl: "Ogolne" })).tag.id;
  const id = (await S.addCard(dir, shelf, "Widuma tosork", "Sarnesk kelbun.")).card.id;
  await S.saveCard(dir, id, { title: { pl: "Widuma po polsku" } });

  const errorsOf = async () => ((await S.lintProject(dir)).rows || []).filter((r) => r.card === id && r.severity === "error");
  const a = await S.saveCard(dir, id, { replies: { shape: "alts", blocks: [
    { label: { en: "Short", pl: "Krótko" }, text: { en: "Ondrave one.", pl: "Ondrave jeden." } },
    { label: {}, text: { en: "Ondrave two.\n\nStill two.", pl: "Ondrave dwa." } }] } });
  const mine = await errorsOf(), back1 = readBack(dir, id, ["en", "pl"]);
  check(a.card.bodyShape === "alts" && a.card.body.en === "[alt:Short]\nOndrave one.\n\n[alt]\nOndrave two.\nStill two."
        && a.card.body.pl === "[alt:Krótko]\nOndrave jeden.\n\n[alt]\nOndrave dwa." && mine.length === 0
        && back1 === JSON.stringify({ en: [["Ondrave one.", "Short"], ["Ondrave two.\nStill two.", ""]], pl: [["Ondrave jeden.", "Krótko"], ["Ondrave dwa.", ""]] }),
    "rb1 alternatives are written with the engine's markers, the labels and a blank line as one break; the lint finds"
    + " nothing and the desk reads back every reply and label as written: " + back1 + " errors " + mine.length);

  const st = await S.saveCard(dir, id, { replies: { shape: "steps", blocks: [
    { label: { en: "Ignored" }, text: { en: "Step one.", pl: "Krok jeden." } }, { label: {}, text: { en: "Step two.", pl: "Krok dwa." } }] } })
    .catch((e) => ({ card: { body: {}, refused: String(e && e.message) } }));
  const stErrors = (await errorsOf()).length, back2 = readBack(dir, id, ["en", "pl"]);
  const pl = await S.saveCard(dir, id, { replies: { shape: "plain", blocks: [
    { label: {}, text: { en: "First.\n\nStill first.", pl: "Pierwszy." } }, { label: {}, text: { en: "Second.", pl: "" } }] } });
  check(st.card.body.en === "[step]\nStep one.\n\n[step]\nStep two." && st.card.bodyShape === "steps" && stErrors === 0
        && back2 === JSON.stringify({ en: [["Step one.", ""], ["Step two.", ""]], pl: [["Krok jeden.", ""], ["Krok dwa.", ""]] })
        && pl.card.bodyShape === "plain" && pl.card.body.en === "First.\n\nStill first.\n\nSecond." && pl.card.body.pl === "Pierwszy.",
    "rb2 steps take no label and open each reply with [step], lint clean and read back the same; one reply joins the"
    + " replies at a blank line and keeps those inside them: " + JSON.stringify([st.card.body.en, stErrors, back2, pl.card.body.en]));

  const only = await S.saveCard(dir, id, { replies: { shape: "alts", blocks: [
    { label: {}, text: { en: "Only English.", pl: "" } }, { label: {}, text: { en: "Again English.", pl: "" } }] } });
  check(!("pl" in only.card.body) && only.card.body.en === "[alt]\nOnly English.\n\n[alt]\nAgain English.",
    "rb3 a language with no reply written is left out of the body: " + JSON.stringify(Object.keys(only.card.body)));

  /* the page, over a card shaped as rb1 left it, the engine's module handed in as it would arrive */
  await S.saveCard(dir, id, { replies: { shape: "alts", blocks: [
    { label: { en: "Short" }, text: { en: "Ondrave one.", pl: "Ondrave jeden." } },
    { label: {}, text: { en: "Ondrave two.", pl: "Ondrave dwa." } }] } });
  const src = fs.readFileSync(path.join(ROOT, "engine", "pinned", "src", "modules", "catalog-v2.js"), "utf8");
  const CV2 = await import("data:text/javascript;base64," + Buffer.from(src).toString("base64"));
  const saved = [];
  const api = { saveCard: async (d, cid, patch) => { saved.push(JSON.parse(JSON.stringify(patch))); return JSON.parse(JSON.stringify(Object.assign({ error: null }, await S.saveCard(d, cid, patch)))); } };
  const { page: P } = loadPage({ api, uiLang: "en" });
  const open = await S.openProject(dir);
  Object.assign(P.S, { open, screen: "project", section: "cards", lang: "both", sel: id });
  const ed = () => String(P.__get("editorHtml")(P.cardById(id)));
  const before = ed();
  P.__set("CV2", CV2);
  const html = ed();
  const rows = (html.match(/class="rp-row"/g) || []).length, boxes = (html.match(/data-rp="\d"/g) || []).length;
  check(rows === 2 && boxes === 4 && /data-rp-label="0" data-l="en"[^>]*value="Short"/.test(html) && !/\[alt/.test(html)
        && !/data-f="body"/.test(html) && /data-f="body"/.test(before) && !/rp-row/.test(before),
    "rb4 a shaped card shows its two replies, each in both languages with a label box, no marker and no plain box; before the"
    + " engine's module arrives it shows the plain boxes: " + JSON.stringify({ rows, boxes }));

  const el = (attrs) => ({ getAttribute: (k) => (k in attrs ? attrs[k] : null) });
  await P.ACTS["rp-add"]();
  await P.ACTS["rp-up"](el({ "data-i": "1" }));
  await P.ACTS["rp-remove"](el({ "data-i": "2" }));
  await P.flush();
  const last = (saved[saved.length - 1] || {}).replies || {};
  check(last.shape === "alts" && (last.blocks || []).map((b) => b.text.en || "").join("|") === "Ondrave two.|Ondrave one."
        && last.blocks[1].label.en === "Short",
    "rb5 Add, Move up and Remove change the rows and save the whole block in its new order: "
    + JSON.stringify((last.blocks || []).map((b) => b.text.en)));

  saved.length = 0;
  await P.ACTS["rp-shape"](el({ "data-v": "plain" }));
  await P.flush();
  const plainSaved = (saved[saved.length - 1] || {}).replies || {};
  const plainBody = (JSON.parse(fs.readFileSync(path.join(dir, "draft.json"), "utf8")).cards.find((x) => x.id === id).body || {}).en;
  const c = P.cardById(id);
  const plainEd = ed();
  P.S.rp = null;
  c.body = { en: "One body.", pl: "Jedno." }; c.bodyShape = "plain";
  await P.ACTS["rp-shape"](el({ "data-v": "steps" }));
  await P.flush();
  const stepsSaved = (saved[saved.length - 1] || {}).replies || {};
  const written = JSON.parse(fs.readFileSync(path.join(dir, "draft.json"), "utf8")).cards.find((x) => x.id === id);
  check(plainSaved.shape === "plain" && plainSaved.blocks.length === 1 && plainSaved.blocks[0].text.en === "Ondrave two.\n\nOndrave one."
        && /data-f="body"/.test(plainEd) && stepsSaved.shape === "steps" && stepsSaved.blocks.length === 1
        && stepsSaved.blocks[0].text.en === "One body." && written.bodyShape === "steps" && plainBody === "Ondrave two.\n\nOndrave one.",
    "rb6 to one reply joins the texts and gives back the plain box; from one, its text is the first step: "
    + JSON.stringify([plainSaved.shape, stepsSaved.shape]));

  /* typing leaves the block holding what was typed until its save comes back: that state, with a blank line typed */
  const cardNow = P.cardById(id), r = P.repliesOf ? P.repliesOf(cardNow) : P.__get("repliesOf")(cardNow);
  r.blocks[0].text = Object.assign({}, r.blocks[0].text, { en: "Line one.\n\nLine two." });
  r.from = cardNow.body;
  const typed = ed();
  r.blocks[0].text = Object.assign({}, r.blocks[0].text, { en: "Line one.\nLine two." });
  const runs = [];
  for (const t of ["Line one.\n \n \nLine two.", "Line one.\n\u00a0\nLine two."]) {
    r.blocks[0].text = Object.assign({}, r.blocks[0].text, { en: t });
    runs.push(/class="n rp-warn">A blank line/.test(ed()));
  }
  r.blocks[0].text = Object.assign({}, r.blocks[0].text, { en: "Line one.\nLine two." });
  await S.saveCard(dir, id, { replies: { shape: "alts", blocks: [
    { label: {}, text: { en: "Run one.\n \n \nStill one.", pl: "Jeden.\n\u00a0\nNadal jeden." } }, { label: {}, text: { en: "Two.", pl: "Dwa." } }] } });
  const back7 = readBack(dir, id, ["en", "pl"]);
  check(/class="n rp-warn">A blank line would split this reply in two/.test(typed) && !/rp-warn/.test(ed()) && runs.join() === "true,true"
        && back7 === JSON.stringify({ en: [["Run one.\nStill one.", ""], ["Two.", ""]], pl: [["Jeden.\nNadal jeden.", ""], ["Dwa.", ""]] }),
    "rb7 a blank line typed in a reply is said under it, and so are space-only and non-breaking-space lines; each is saved"
    + " as one break and the desk reads one reply: " + JSON.stringify(runs) + " " + back7);

  /* rb9: an empty first reply in Polish, which the desk would drop */
  await S.saveCard(dir, id, { replies: { shape: "steps", blocks: [
    { label: {}, text: { en: "Step one.", pl: "" } }, { label: {}, text: { en: "Step two.", pl: "Krok dwa." } }] } });
  const gapErrors = (await errorsOf()).map((x) => String(x.why || ""));
  const back9 = readBack(dir, id, ["pl"]);
  const cardGap = P.cardById(id);
  Object.assign(cardGap, JSON.parse(fs.readFileSync(path.join(dir, "draft.json"), "utf8")).cards.find((x) => x.id === id));
  P.S.rp = null;
  const gapEd = ed();
  check(gapErrors.some((w) => /reply 1 is empty in PL, so the desks skip it and every later reply moves up a place/.test(w))
        && back9 === JSON.stringify({ pl: [["Krok dwa.", ""]] })
        && (gapEd.match(/rp-gap/g) || []).length === 1 && /Empty here, so the desks skip it in PL/.test(gapEd),
    "rb9 an empty reply in a language that has others is an error in Studio's lint, which the desk's own read shows is right"
    + " (it reads " + back9 + "), and the editor says so under that box alone");

  check(asserted === EXPECTED - 1, "rb8 every leg ran: " + (asserted + 1) + " of " + EXPECTED);
}

main().then(() => {
  console.log("#counts checks=" + asserted + " failed=" + failed + " expected=" + EXPECTED);
  console.log(failed ? "RESULT: FAIL " + failed + " failed" : "RESULT: ok " + asserted + " check(s)");
  process.exit(failed ? 1 : 0);
}, (e) => { console.log("  FAIL " + (e && e.stack || e)); console.log("RESULT: FAIL the leg did not complete"); process.exit(1); });
