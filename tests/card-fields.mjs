/* SAVECARD WRITES THE CARD FIELDS THAT HAD NO WRITE PATH, AND THE CARD PANE HOLDS A CONTROL FOR EACH (board 1018, piece B).
 *
 *     node tests/card-fields.mjs [--keep]
 *
 * The format names on a card the three intent and name flags (firstOnly, allIntents, intentTop), the vocative (paxVoc),
 * the manual override of {PAX} (paxOwn) with its form of address per grammar language (address), and the language pin
 * (lockLang); Studio carried them and wrote none. saveCard now writes each by the format's own reading, and the card pane
 * holds a tick or a select for each. The page runs on tests/page-stand-in.mjs with its bridge answered by the real module.
 *
 *   cfl1  the three flags are written as true and taken off by false
 *   cfl2  paxVoc and paxOwn are written as 1 and 0, null hands them back to the derived value, and a value the format
 *         would refuse is refused with the file left byte for byte
 *   cfl3  a form of address is written per language, "" takes that language off and the key when none is left; a form
 *         not offered and a language with no grammar for it are refused, byte for byte
 *   cfl4  the language pin is written for a declared language, taken off by "", and refused for one not declared
 *   cfl5  a field the desk cannot show yet still round-trips: a form this build does not know and a pin on a third
 *         language survive saves of other fields, a reopen and a publish
 *   cfl6  reopened, the draft carries every field, and the open answer the forms a card may take
 *   cfl7  published, the edition carries every field, and the pinned reader loads it with each in its runtime field
 *   cfl8  the card pane holds a tick or a select for each, showing what the card holds; the vocative's tick shows what a
 *         desk derives when the card leaves it to the first-name tick
 *   cfl9  ticks pressed and forms chosen in the page land in the file through saveCard, and the page's card follows it
 *   cfl11 a field given in a shape the format cannot hold is refused, never skipped (the test architect's F1)
 *   cfl12 removing a language takes the pin off a card pinned to it (F2)
 *   cfl13 the removal's confirmation counts the cards whose language pin it will clear
 *   cfl10 every leg ran
 *
 * WHAT IT CANNOT SEE, said rather than implied: how the block looks in the pane, which is Maxim's eye and the sheet.
 *
 * PROVED BY MAKING IT FAIL, in a scratch copy of the tree (tests/plant-copy.mjs): the flags' write taken out
 * (b1018-flags) reddens cfl1; the vocative and override (b1018-pax), cfl2; the form of address (b1018-address), cfl3;
 * the pin (b1018-lock), cfl4; the page's tick save (b1018-flag-act), cfl9a; a flag that is not true or false
 * (f1-card-types), cfl11; an address that is not words by language (f1-card-address), cfl11; a pin that is not a
 * string (f1-card-lock), cfl11; the clearing of a pin on the removed language (f2-pin), cfl12; the confirmation's
 * count of those cards (f2-pins), cfl13. ETIUDA_PLANTS=off skips them and counts each.
 *
 * Node only, no window, no Electron. Exit 0 when every check holds, 1 when any fails.
 */
import "./licensed-env.mjs";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as Engine from "../src/engine.mjs";
import { DRAFT_FILE } from "../src/publish.mjs";
import { clearScratch, dropScratch } from "./scratch.mjs";
import { loadPage } from "./page-stand-in.mjs";
import { copyPlants } from "./plant-copy.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const SELF = fileURLToPath(import.meta.url);
const SCRATCH = path.join(ROOT, "scratch", "card-fields");
const EXPECTED = 28;
const PLANTS_OFF = process.env.ETIUDA_PLANTS === "off";

let asserted = 0, failed = 0, skipped = 0;
function check(cond, line) {
  asserted++;
  if (cond) process.stdout.write("  ok   " + line + "\n");
  else { failed++; process.stdout.write("  FAIL " + line + "\n"); }
}
function skip(line) { skipped++; process.stdout.write("  skip " + line + "\n"); }
const readJson = (f) => JSON.parse(fs.readFileSync(f, "utf8"));
const J = JSON.stringify;
const wire = (p) => Promise.resolve(p)
  .then((v) => JSON.parse(JSON.stringify(Object.assign({ error: null }, v))))
  .catch((e) => ({ error: e && e.message ? e.message : String(e), said: (e && e.said) || null, disk: !!(e && e.disk) }));
const settle = () => new Promise((r) => setTimeout(r, 0));
const pick = (c) => { const o = {}; ["firstOnly", "allIntents", "intentTop", "paxVoc", "paxOwn", "address", "lockLang"].forEach((k) => { if (k in c) o[k] = c[k]; }); return o; };

async function main(argv) {
  clearScratch(SCRATCH);
  const S = await import("../src/studio.mjs");
  const root = path.join(SCRATCH, "projects");
  const share = path.join(SCRATCH, "share");
  fs.mkdirSync(root, { recursive: true });
  fs.mkdirSync(share, { recursive: true });
  const made = await S.newProject(root, "Card fields", [{ code: "en", name: "English" }, { code: "pl", name: "Polish" }, { code: "de", name: "German" }]);
  const dir = made.dir;
  const file = path.join(dir, DRAFT_FILE);
  const cardIn = (id) => readJson(file).cards.find((c) => c.id === id);
  const bytes = () => fs.readFileSync(file);
  const shelf = (await S.addTag(dir, "shelf", { en: "Moorings", pl: "Cumowanie", de: "Liegeplatz" })).tag.id;
  const ca = (await S.addCard(dir, shelf, "Greeting", "Good morning, {PAX}.")).card.id;
  const cb = (await S.addCard(dir, shelf, "Internal note", "Customer asked about the tide.")).card.id;

  await S.saveCard(dir, ca, { firstOnly: true, allIntents: true, intentTop: true });
  const c1a = pick(cardIn(ca));
  await S.saveCard(dir, ca, { allIntents: false, intentTop: false });
  const c1b = pick(cardIn(ca));
  check(J(c1a) === J({ firstOnly: true, allIntents: true, intentTop: true }) && J(c1b) === J({ firstOnly: true }),
    "cfl1 the three flags are written as true, and false takes each off: " + J([c1a, c1b]));

  await S.saveCard(dir, ca, { paxVoc: false, paxOwn: true });
  const c2a = pick(cardIn(ca));
  await S.saveCard(dir, ca, { paxVoc: null });
  const c2b = pick(cardIn(ca));
  const b2 = bytes();
  const bad = await wire(S.saveCard(dir, ca, { paxOwn: "yes" }));
  check(c2a.paxVoc === 0 && c2a.paxOwn === 1 && !("paxVoc" in c2b) && c2b.paxOwn === 1 && bad.error && Buffer.compare(bytes(), b2) === 0,
    "cfl2 paxVoc and paxOwn are written as 0 and 1, null takes paxVoc back to the derived value, and \"yes\" is refused"
    + " byte for byte: " + J([c2a, c2b, bad.error]));

  await S.saveCard(dir, ca, { address: { pl: "titleFirst", en: "titleSurname" } });
  const c3a = pick(cardIn(ca));
  await S.saveCard(dir, ca, { address: { en: "" } });
  const c3b = pick(cardIn(ca));
  await S.saveCard(dir, ca, { address: { pl: "" } });
  const c3c = pick(cardIn(ca));
  const b3 = bytes();
  const r3 = [await wire(S.saveCard(dir, ca, { address: { pl: "madam" } })), await wire(S.saveCard(dir, ca, { address: { de: "none" } }))];
  check(J(c3a.address) === J({ pl: "titleFirst", en: "titleSurname" }) && J(c3b.address) === J({ pl: "titleFirst" }) && !("address" in c3c)
        && r3.every((r) => r.error) && Buffer.compare(bytes(), b3) === 0,
    "cfl3 a form is written per language, \"\" takes that language off and the key when none is left, and a form not"
    + " offered or a language with no grammar for it is refused byte for byte: " + J([c3a.address, c3b.address, "address" in c3c, r3.map((r) => r.error)]));

  await S.saveCard(dir, cb, { lockLang: "en" });
  const c4a = pick(cardIn(cb));
  await S.saveCard(dir, cb, { lockLang: "" });
  const c4b = pick(cardIn(cb));
  const b4 = bytes();
  const r4 = await wire(S.saveCard(dir, cb, { lockLang: "sv" }));
  check(c4a.lockLang === "en" && !("lockLang" in c4b) && r4.error && Buffer.compare(bytes(), b4) === 0,
    "cfl4 the pin is written for a declared language, \"\" takes it off, and an undeclared one is refused byte for byte: " + J([c4a, c4b, r4.error]));

  /* A form this build does not offer, written as a newer desk might, and a pin on the catalog's third language. */
  const F = await Engine.format();
  const d5 = readJson(file);
  d5.cards.find((c) => c.id === cb).address = { pl: "formalPlural" };
  delete d5.hash; d5.hash = F.contentHash(d5);
  fs.writeFileSync(file, JSON.stringify(d5, null, 1) + "\n");
  await S.saveCard(dir, cb, { lockLang: "de" });
  await S.saveCard(dir, cb, { title: { en: "Internal note, tide" } });
  await S.saveCard(dir, cb, { address: { pl: "formalPlural" } });
  const c5 = pick(cardIn(cb));
  check(J(c5) === J({ address: { pl: "formalPlural" }, lockLang: "de" }),
    "cfl5a a form this build does not know and a pin on a third language survive saves of other fields: " + J(c5));

  await S.saveCard(dir, ca, { paxVoc: true, address: { pl: "none" }, intentTop: true });
  const wantA = pick(cardIn(ca)), wantB = pick(cardIn(cb));
  const opened = await S.openProject(dir);
  const oc = (id) => pick(opened.draft.cards.find((c) => c.id === id));
  check(J(oc(ca)) === J(wantA) && J(oc(cb)) === J(wantB) && opened.offered && J(opened.offered.address) === J(Engine.addressForms()),
    "cfl6 reopened, the draft carries every field, and the answer the forms a card may take: " + J([oc(ca), oc(cb), opened.offered && opened.offered.address]));

  const pub = await S.publishProject(dir, { folder: share, notes: "card fields" });
  const ed = pub && pub.ec ? readJson(pub.ec) : { cards: [] };
  const ec = (id) => pick(ed.cards.find((c) => c.id === id) || {});
  check(J(ec(ca)) === J(wantA) && J(ec(cb)) === J(wantB),
    "cfl7a published, the edition carries every field, the unknown form and the third language's pin included: " + J([ec(ca), ec(cb)]));
  check(J(ec(cb)) === J({ address: { pl: "formalPlural" }, lockLang: "de" }),
    "cfl5b and so the field the desk cannot show yet round-trips through a publish: " + J(ec(cb)));
  const { loadCatalog, lintCatalog } = Engine.lint();
  let read = null, why = "";
  try { read = loadCatalog(pub.ec); } catch (e) { why = String(e && e.message || e); }
  const errs = read ? lintCatalog(read).errors : ["unread"];
  const ra = read ? read.cards.find((m) => m.id === ca) || {} : {};
  const rb = read ? read.cards.find((m) => m.id === cb) || {} : {};
  check(!why && errs.length === 0 && ra.firstOnly === 1 && ra.intentTop === 1 && ra.paxVoc === 1 && ra.paxOwn === 1 && ra.addressPl === "none"
        && rb.lockLang === "de" && rb.addressPl === "formalPlural",
    "cfl7b and the pinned reader loads it, no lint error, each field in its runtime field: " + J({ why, errs, ra: pick(ra), rb: { lockLang: rb.lockLang, addressPl: rb.addressPl } }));

  /* ---- the page --------------------------------------------------------------------------------- */
  const calls = [];
  const api = { saveCard: (d, i, p) => { calls.push(p); return wire(S.saveCard(d, i, p)); } };
  const home = loadPage({ uiLang: "en", api });
  const P = home.page;
  const o = await wire(S.openProject(dir));
  P.S.host = { tour: { offered: true }, langs: { builtIn: ["en", "pl"], endonyms: { en: "English", pl: "Polski" } } };
  P.S.open = Object.assign({}, o, { lint: o.lint || { errors: 0, warnings: 0, rows: [] }, awaiting: o.awaiting || [] });
  P.S.screen = "project"; P.S.section = "cards"; P.S.lang = "en"; P.S.sel = ca; P.S.q = "";
  const own = (id) => { const h = P.editorHtml(P.cardById(id)); const i = h.indexOf('id="cardOwn"'); return i < 0 ? "" : h.slice(i, h.indexOf("</div>", i)); };
  const tickOn = (h, k) => new RegExp('class="cbx on"[^>]*data-act="card-flag" data-k="' + k + '"').test(h);
  const tickHas = (h, k) => new RegExp('data-act="card-flag" data-k="' + k + '"').test(h);
  const sel = (h, act, l) => (new RegExp('data-act="' + act + '"' + (l ? ' data-l="' + l + '"' : "") + '>(.*?)</select>').exec(h) || [])[1] || "";
  const chosen = (opts) => (/<option value="([^"]*)" selected>/.exec(opts) || [])[1];
  const hA = own(ca), hB = own(cb);
  check(["firstOnly", "paxVoc", "paxOwn", "allIntents", "intentTop"].every((k) => tickHas(hA, k))
        && tickOn(hA, "firstOnly") && tickOn(hA, "paxVoc") && tickOn(hA, "paxOwn") && !tickOn(hA, "allIntents") && tickOn(hA, "intentTop")
        && chosen(sel(hA, "card-address", "pl")) === "none" && chosen(sel(hA, "card-address", "en")) === ""
        && chosen(sel(hB, "card-address", "pl")) === "formalPlural" && chosen(sel(hB, "card-lock")) === "de"
        && /<option value="titleFirst">/.test(sel(hA, "card-address", "pl")) && !/data-l="de"/.test(hA),
    "cfl8a the pane holds a tick for each flag and a select for each form of address and for the pin, each showing what"
    + " the card holds, an unknown form included, and no address for a language with no grammar for it");
  const cd = (await wire(S.addCard(dir, shelf, "Derived", "Hello {PAX}."))).card;
  await S.saveCard(dir, cd.id, { firstOnly: true });
  const dCard = Object.assign({}, cardIn(cd.id));
  P.S.open.draft.cards.push(dCard);
  const hD = own(cd.id);
  check(tickOn(hD, "firstOnly") && tickOn(hD, "paxVoc") && !("paxVoc" in dCard),
    "cfl8b a card that leaves the vocative to the first-name tick shows it ticked, as a desk reads it, with nothing written");

  calls.length = 0;
  P.S.sel = cb;
  const press = (act, extra, value) => P.ACTS[act]({ getAttribute: (n) => Object.assign({ "data-act": act }, extra)[n] || null, value });
  press("card-flag", { "data-k": "allIntents" });
  press("card-flag", { "data-k": "paxOwn" });
  press("card-address", { "data-l": "en" }, "titleSurname");
  press("card-lock", {}, "");
  await P.flush(); await settle();
  const c9 = pick(cardIn(cb));
  /* The card carries a form, so a desk reads its override as on (paxOwnOn) and the press turns it off, written as 0. */
  check(c9.allIntents === true && c9.paxOwn === 0 && J(c9.address) === J({ pl: "formalPlural", en: "titleSurname" }) && !("lockLang" in c9)
        && calls.length === 1 && J(calls[0]) === J({ allIntents: true, paxOwn: false, address: { en: "titleSurname" }, lockLang: "" }),
    "cfl9a ticks pressed and forms chosen in the page go as one save and land in the file, the override read as a desk"
    + " reads it before the press: " + J([c9, calls]));
  const pc = P.cardById(cb);
  press("card-flag", { "data-k": "paxOwn" });
  await P.flush(); await settle();
  check(J(pick(pc)) === J(pick(cardIn(cb))) && cardIn(cb).paxOwn === 1,
    "cfl9b and the page's card follows the file, the override pressed back on written as 1: " + J([pick(pc), pick(cardIn(cb))]));

  /* ---- after the test architect's read (F1, F2) ---------------------------------------------------- */
  const b11 = bytes();
  const types = [];
  for (const patch of [{ firstOnly: "yes" }, { intentTop: 1 }, { address: "pl" }, { address: null }, { address: { pl: 5 } }, { lockLang: 5 }]) {
    const r = await wire(S.saveCard(dir, ca, patch));
    types.push(r.error ? "refused" : "answered");
  }
  check(types.every((x) => x === "refused") && Buffer.compare(bytes(), b11) === 0,
    "cfl11 a flag that is not true or false, an address that is not words by language and a pin that is not a code are"
    + " refused, never skipped, and the file is left byte for byte: " + J(types));

  await S.saveCard(dir, ca, { lockLang: "pl" });
  await S.saveCard(dir, cb, { lockLang: "de" });
  const pinBytes = bytes();
  const pinHold = readJson(file).cards.filter((c) => c.lockLang === "pl").length;
  const pinAsk = await wire(S.removeLang(dir, "pl"));
  const pinOpen = await S.openProject(dir);
  P.S.open = Object.assign({}, pinOpen, {
    lint: pinOpen.lint || { errors: 0, warnings: 0, rows: [] }, awaiting: pinOpen.awaiting || [],
  });
  P.S.screen = "project"; P.S.section = "settings"; P.S.langGoing = "pl"; P.S.err = null;
  P.paintProjectSettings();
  const pinHtml = String((home.doc.querySelector("#main") || {}).innerHTML || "");
  const pinAt = pinHtml.indexOf("Pinned cards");
  const pinMono = pinAt < 0 ? [] : (pinHtml.slice(pinAt).match(/>([0-9]+)\/([0-9]+)</) || []);
  const pinPhrase = "Cards pinned to it: " + pinHold + (pinHold === 1 ? " card." : " cards.");
  const pinOf = (pinOpen.draft && pinOpen.draft.cards || []).length;
  check(pinAsk.refused === "not confirmed" && pinAsk.uses && pinAsk.uses.pins === pinHold && pinHold >= 1
        && pinAsk.said && pinAsk.said.vars.PINS && pinAsk.said.vars.PINS.n === pinHold
        && String(pinAsk.message || "").indexOf(pinPhrase) >= 0
        && pinMono[1] === String(pinHold) && pinMono[2] === String(pinOf)
        && Buffer.compare(bytes(), pinBytes) === 0,
    "cfl13 the removal's confirmation counts the cards whose language pin it will clear, on the screen and in the"
    + " warning, and writes nothing: " + J({ hold: pinHold, uses: pinAsk.uses && pinAsk.uses.pins,
      said: pinAsk.said && pinAsk.said.vars && pinAsk.said.vars.PINS, message: pinAsk.message,
      mono: pinMono[1] + "/" + pinMono[2] }));
  await S.removeLang(dir, "pl", { confirm: true });
  check(!("lockLang" in cardIn(ca)) && cardIn(cb).lockLang === "de",
    "cfl12 removing Polish takes the pin off a card pinned to it, and a card pinned to another language keeps its pin: "
    + J([pick(cardIn(ca)), pick(cardIn(cb))]));

  copyPlants({
    root: ROOT, self: SELF, label: "card-fields", onlyVar: "CARD_FIELDS_ONLY", check, skip,
    plants: [
      { mark: "b1018-flags", leg: "cfl1", rel: "src/studio.mjs", line: "    void 0;" },
      { mark: "b1018-pax", leg: "cfl2", rel: "src/studio.mjs", line: "    else if (typeof v === \"boolean\" || v === 0 || v === 1) void 0;" },
      { mark: "b1018-address", leg: "cfl3", rel: "src/studio.mjs", line: "      else if (forms[L].indexOf(v) >= 0 || v === ad[L]) void 0;" },
      { mark: "b1018-lock", leg: "cfl4", rel: "src/studio.mjs", line: "    else if (codes.indexOf(l) >= 0) void 0;" },
      { mark: "b1018-flag-act", leg: "cfl9a", rel: "ui/app.js", line: "      void on;" },
      { mark: "f1-card-types", leg: "cfl11", rel: "src/studio.mjs", line: "    void 0;" },
      { mark: "f1-card-address", leg: "cfl11", rel: "src/studio.mjs", line: "    void 0;" },
      { mark: "f1-card-lock", leg: "cfl11", rel: "src/studio.mjs", line: "    void 0;" },
      { mark: "f2-pin", leg: "cfl12", rel: "src/studio.mjs", line: "    void 0;" },
      { mark: "f2-pins", leg: "cfl13", rel: "src/studio.mjs", line: "  const pins = 0;" },
    ],
  });

  check(asserted + skipped + 1 === EXPECTED,
    "cfl10 every leg ran: " + (asserted + skipped + 1) + " of " + EXPECTED + (skipped ? ", " + skipped + " skipped" : ""));
  process.stdout.write("card-fields: " + asserted + " assertion(s), " + skipped + " skipped, " + failed + " failure(s)"
    + (PLANTS_OFF ? " (ETIUDA_PLANTS=off)" : "") + "\n");
  process.stdout.write("#counts checks=" + asserted + " skipped=" + skipped + " failed=" + failed + " expected=" + EXPECTED + "\n");
  if (!argv.includes("--keep")) dropScratch(SCRATCH, "card-fields");
  process.exit(failed ? 1 : 0);
}

main(process.argv.slice(2)).catch((e) => {
  process.stdout.write("  FAIL tests/card-fields.mjs threw: " + (e && e.stack || e) + "\n");
  process.exit(1);
});
