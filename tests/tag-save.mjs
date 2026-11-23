/* ONE SAVE VERB WRITES EVERY FIELD THE FORMAT CARRIES FOR AN INTENT AND A CATEGORY (board 1018, piece A).
 *
 *     node tests/tag-save.mjs [--keep]
 *
 * Studio wrote a tag's name alone (renameTag); an intent's topic and comment action, and a category's icon, colour and
 * supporting mark, were carried and never written. src/studio.mjs saveTag now writes them all, a rename is that verb with
 * the name alone, and Intents and Categories hold a plain field for each. The page runs on tests/page-stand-in.mjs with its
 * bridge answered by the real module, so what the page sends is written to a real draft and read back from the file.
 *
 *   tgs1  an intent's topic and comment action are written by language, read back from the saved file, its name untouched
 *   tgs2  a topic emptied in one language is taken off there, and the whole field when none is left
 *   tgs3  a category's icon, colour and supporting mark are written, and "", null and false clear each
 *   tgs4  what the format and the desk would not hold is refused and the file is left byte for byte: an icon or a colour
 *         not offered, a language not declared, a look on an intent; an icon the category already wears is kept
 *   tgs5  a rename still keeps every field it does not name, and goes through the same verb
 *   tgs6  reopened, the draft carries every field and the open answer the icons and colours offered
 *   tgs7  published, the edition carries every field, and the pinned reader loads it with each in its runtime column
 *   tgs8  the Intents table holds a field per language for the topic, the clause and the action; the Categories table an
 *         icon, a colour and the supporting tick, each showing what the tag holds
 *   tgs9  a topic typed in the page goes through the one save verb and lands in the file; a name typed alone still goes as
 *         a rename
 *   tgs10 an icon, a colour and the tick chosen in the page land in the file, and the page's tag follows it
 *   tgs11 the name's field is still the only input that answers `input[data-tag]`, so a finding, F2 and the window legs find it
 *   tgs13 a field the verb does not write is refused, never answered as saved (the test architect's F1)
 *   tgs14 the published edition goes through the desk's own reader and writer and comes back unchanged (F4)
 *   tgs15 a tag save is undone from Changes (F4)
 *   tgs16 removing a language takes it off topics and actions, and its confirmation counts them (F2, F4)
 *   tgs12 every leg ran
 *
 * WHAT IT CANNOT SEE, said rather than implied: how the wider tables look, which is Maxim's eye and the designer's sheet.
 *
 * PROVED BY MAKING IT FAIL, in a scratch copy of the tree (tests/plant-copy.mjs): the topic and action write taken out
 * (a1018-text) reddens tgs1; the icon (a1018-icon), tgs3; the colour (a1018-hue), tgs3; the mark (a1018-supporting), tgs3;
 * the refusal of a look on an intent (a1018-intent-look), tgs4; the page's call through the verb (a1018-tag-call), tgs9;
 * the row's new fields (a1018-tag-row), tgs8; the stray-key refusal (f1-tag-stray), tgs13; the refusal of a text field
 * that is not words by language (f1-tag-words), tgs13; the refusal of a supporting mark that is not true or false
 * (f1-tag-supporting), tgs13; an intent's topic and action in the removal's count (f2-uses), tgs16a. ETIUDA_PLANTS=off
 * skips them and counts each.
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
const SCRATCH = path.join(ROOT, "scratch", "tag-save");
const EXPECTED = 33;
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

async function main(argv) {
  clearScratch(SCRATCH);
  const S = await import("../src/studio.mjs");
  const root = path.join(SCRATCH, "projects");
  const share = path.join(SCRATCH, "share");
  fs.mkdirSync(root, { recursive: true });
  fs.mkdirSync(share, { recursive: true });
  const made = await S.newProject(root, "Tag fields", [{ code: "en", name: "English" }, { code: "pl", name: "Polish" }]);
  const dir = made.dir;
  const file = path.join(dir, DRAFT_FILE);
  const tagIn = (id) => readJson(file).tags.find((t) => t.id === id);
  const bytes = () => fs.readFileSync(file);
  const shelf = (await S.addTag(dir, "shelf", { en: "Moorings", pl: "Cumowanie" })).tag.id;
  const other = (await S.addTag(dir, "shelf", { en: "Fees", pl: "Opłaty" })).tag.id;
  const r1 = (await S.addTag(dir, "request", { en: "changing your berth", pl: "zmianą miejsca" })).tag.id;
  const r2 = (await S.addTag(dir, "request", { en: "asking about the tide", pl: "pytaniem o pływ" })).tag.id;
  const ca = (await S.addCard(dir, shelf, "Berths", "Berths are given at the office.")).card.id;
  await S.saveCard(dir, ca, { requests: [r1] });

  /* ---- the verb ------------------------------------------------------------------------------ */
  await S.saveTag(dir, r1, { topic: { en: " Berth change ", pl: "Zmiana miejsca" }, action: { en: "berth changed" } });
  const t1 = tagIn(r1);
  check(J(t1.topic) === J({ en: "Berth change", pl: "Zmiana miejsca" }) && J(t1.action) === J({ en: "berth changed" })
        && J(t1.clause) === J({ en: "changing your berth", pl: "zmianą miejsca" }),
    "tgs1 the topic and the action are written by language, trimmed, and read back from the saved file, the clause untouched: "
    + J([t1.topic, t1.action, t1.clause]));

  await S.saveTag(dir, r1, { topic: { pl: "" } });
  const t2a = tagIn(r1);
  await S.saveTag(dir, r1, { action: { en: "  " } });
  const t2b = tagIn(r1);
  check(J(t2a.topic) === J({ en: "Berth change" }) && !("action" in t2b) && J(t2b.topic) === J({ en: "Berth change" }),
    "tgs2 a topic emptied in Polish is taken off there, and the action emptied in its one language goes whole: "
    + J([t2a.topic, Object.keys(t2b)]));

  const offered = Engine.catLooks().offered;
  const icon = offered.icons[3], hue = offered.hues[2].slot;
  await S.saveTag(dir, shelf, { icon, hue, supporting: true });
  const t3a = tagIn(shelf);
  await S.saveTag(dir, shelf, { icon: "", hue: null, supporting: false });
  const t3b = tagIn(shelf);
  check(t3a.icon === icon && t3a.hue === hue && t3a.supporting === true
        && !("icon" in t3b) && !("hue" in t3b) && !("supporting" in t3b) && J(t3b.label) === J(t3a.label),
    "tgs3 a category's icon, colour and supporting mark are written, and \"\", null and false take each off: "
    + J([t3a.icon, t3a.hue, t3a.supporting, Object.keys(t3b)]));

  const before = bytes();
  const refusals = [];
  for (const [id, patch] of [[shelf, { icon: "no-such-drawing" }], [shelf, { hue: 5 }], [shelf, { hue: "blue" }],
    [r1, { topic: { de: "Liegeplatz" } }], [r1, { icon }], [r1, { supporting: true }]]) {
    const r = await wire(S.saveTag(dir, id, patch));
    refusals.push(r.error ? "refused" : "written");
    /* MOVED AFTER F1: since saveTag refuses every key a tag's kind does not carry, a look on an intent would be refused even
       without its own line, so the check now reads that it is refused in the copywriter's sentence for it. */
    if (id === r1 && !("topic" in patch)) refusals.push(/only a category has them/.test(String(r.error || "")) ? "refused" : "said otherwise");
  }
  const same = Buffer.compare(bytes(), before) === 0;
  /* An icon the category already wears and this build does not offer survives a save of another field. */
  const d4 = readJson(file);
  d4.tags.find((t) => t.id === other).icon = "retired-drawing";
  const F = await Engine.format();
  delete d4.hash; d4.hash = F.contentHash(d4);
  fs.writeFileSync(file, JSON.stringify(d4, null, 1) + "\n");
  const kept = await wire(S.saveTag(dir, other, { icon: "retired-drawing", hue }));
  check(refusals.every((x) => x === "refused") && same && !kept.error && tagIn(other).icon === "retired-drawing" && tagIn(other).hue === hue,
    /* Was: "a look on an intent are each refused"; now also in its own sentence. */
    "tgs4 an icon or colour not offered, a language not declared and a look on an intent (in its own sentence) are each refused with the file left"
    + " byte for byte, and an icon the category already wears is kept: " + J({ refusals, same, kept: kept.error || tagIn(other).icon }));

  await S.saveTag(dir, shelf, { icon, hue, supporting: true });
  await S.saveTag(dir, r1, { action: { en: "berth changed", pl: "zmieniono miejsce" } });
  const ren = await S.renameTag(dir, r1, { en: "moving your berth" });
  const t5 = tagIn(r1);
  const renS = await S.renameTag(dir, shelf, { pl: "Cumowanie łodzi" });
  const t5s = tagIn(shelf);
  check(J(t5.topic) === J({ en: "Berth change" }) && J(t5.action) === J({ en: "berth changed", pl: "zmieniono miejsce" })
        && t5.clause.en === "moving your berth" && t5s.icon === icon && t5s.hue === hue && t5s.supporting === true
        && t5s.label.pl === "Cumowanie łodzi" && ren.tag && renS.tag,
    "tgs5 a rename keeps every field it does not name, on an intent and on a category: " + J([t5, t5s]));

  const opened = await S.openProject(dir);
  const ot = (id) => opened.draft.tags.find((t) => t.id === id);
  check(J(ot(r1).topic) === J(t5.topic) && J(ot(r1).action) === J(t5.action) && ot(shelf).icon === icon && ot(shelf).hue === hue
        && ot(shelf).supporting === true && opened.offered && opened.offered.icons.indexOf(icon) >= 0
        && opened.offered.hues.some((h) => h.slot === hue && typeof h.name === "string"),
    "tgs6 reopened, the draft carries every field, and the answer the icons and colours a category is offered: "
    + J({ icons: opened.offered && opened.offered.icons.length, hues: opened.offered && opened.offered.hues }));

  const pub = await S.publishProject(dir, { folder: share, notes: "fields" });
  const ed = pub && pub.ec ? readJson(pub.ec) : { tags: [] };
  const et = (id) => ed.tags.find((t) => t.id === id) || {};
  const { loadCatalog, lintCatalog } = Engine.lint();
  let read = null, why = "";
  try { read = loadCatalog(pub.ec); } catch (e) { why = String(e && e.message || e); }
  const errs = read ? lintCatalog(read).errors : ["unread"];
  const at = read ? (read.intentIds || []).indexOf(r1) : -1;
  check(J(et(r1).topic) === J(t5.topic) && J(et(r1).action) === J(t5.action) && et(shelf).icon === icon && et(shelf).hue === hue
        && et(shelf).supporting === true,
    "tgs7a published, the edition carries the topic, the action, the icon, the colour and the mark: " + J([et(r1), et(shelf)]));
  check(!why && errs.length === 0 && at >= 0 && read.intents.topic[at] === "Berth change" && read.intents.cmtPl[at] === "zmieniono miejsce"
        && read.icons[shelf] === icon && read.colors[shelf] === hue && (read.roles && read.roles.always || []).indexOf(shelf) >= 0,
    "tgs7b and the pinned reader loads it, no lint error, each field in its runtime column: "
    + J({ why, errs, at, icons: read && read.icons, colors: read && read.colors, roles: read && read.roles }));

  /* ---- the page --------------------------------------------------------------------------------- */
  const calls = [];
  const api = {
    renameTag: (d, i, t) => { calls.push(["renameTag", i, t]); return wire(S.renameTag(d, i, t)); },
    saveTag: (d, i, p) => { calls.push(["saveTag", i, p]); return wire(S.saveTag(d, i, p)); },
  };
  const home = loadPage({ uiLang: "en", api });
  const P = home.page;
  const reopen = async () => {
    const o = await wire(S.openProject(dir));
    P.S.open = Object.assign({}, o, { lint: o.lint || { errors: 0, warnings: 0, rows: [] }, awaiting: o.awaiting || [] });
  };
  await reopen();
  P.S.host = { tour: { offered: true }, langs: { builtIn: ["en", "pl"], endonyms: { en: "English", pl: "Polski" } } };
  P.S.screen = "project"; P.S.lang = "both"; P.S.q = "";
  const paintTags = P.__get("paintTags");
  const table = (kind) => { P.S.section = kind === "request" ? "intents" : "categories"; paintTags(kind, "x"); return P.__get("$")("#main").innerHTML; };
  const rowOf = (html, id) => html.split('<tr data-ctx="tag"').slice(1).find((r) => r.indexOf('data-id="' + id + '"') >= 0) || "";
  const iRow = rowOf(table("request"), r1), iRow2 = rowOf(table("request"), r2);
  const field = (row, f, l) => (new RegExp('data-tf="' + f + '" data-l="' + l + '" value="([^"]*)"').exec(row) || [])[1];
  check(field(iRow, "topic", "en") === "Berth change" && field(iRow, "topic", "pl") === "" && field(iRow, "action", "pl") === "zmieniono miejsce"
        && /data-l="en" value="moving your berth"/.test(iRow) && /data-tf="topic" data-l="pl" value="" placeholder="zmianą miejsca"/.test(iRow)
        && field(iRow2, "topic", "en") === "",
    "tgs8a the Intents table holds the topic, the clause and the action per language, and an empty topic shows the clause"
    + " as its placeholder: " + J([field(iRow, "topic", "en"), field(iRow, "action", "pl")]));
  const cRow = rowOf(table("shelf"), shelf);
  check(new RegExp('data-act="tag-icon"[^>]*>.*<option value="' + icon + '" selected>').test(cRow)
        && new RegExp('data-act="tag-hue"[^>]*>.*<option value="' + hue + '" selected>').test(cRow)
        && /class="cbx on"[^>]*data-act="tag-supporting"/.test(cRow),
    "tgs8b the Categories table holds an icon, a colour and the supporting tick, each showing what the tag holds");

  calls.length = 0;
  P.queueTagSave(r2, "en", "Tide times", "topic");
  P.queueTagSave(r2, "pl", "Pływy", "topic");
  await P.__get("flushTag")(); await settle();
  const viaVerb = calls.find((c) => c[0] === "saveTag");
  check(viaVerb && J(viaVerb[2]) === J({ topic: { en: "Tide times", pl: "Pływy" } }) && J(tagIn(r2).topic) === J({ en: "Tide times", pl: "Pływy" })
        && J((P.S.open.draft.tags.find((t) => t.id === r2) || {}).topic) === J({ en: "Tide times", pl: "Pływy" }),
    "tgs9a a topic typed in the page goes through the one save verb, lands in the file and the page's tag follows: " + J(calls));
  calls.length = 0;
  P.queueTagSave(r2, "en", "asking about the tides");
  await P.__get("flushTag")(); await settle();
  check(calls.length === 1 && calls[0][0] === "renameTag" && tagIn(r2).clause.en === "asking about the tides" && J(tagIn(r2).topic) === J({ en: "Tide times", pl: "Pływy" }),
    "tgs9b a name typed alone still goes as a rename, and the topic stays: " + J(calls));

  calls.length = 0;
  const icon2 = offered.icons[5], hue2 = offered.hues[4].slot;
  const sel = (act, id, value) => ({ getAttribute: (n) => ({ "data-act": act, "data-id": id })[n] || null, value });
  await P.ACTS["tag-icon"](sel("tag-icon", other, icon2)); await settle();
  await P.ACTS["tag-hue"](sel("tag-hue", other, String(hue2))); await settle();
  await P.ACTS["tag-supporting"](sel("tag-supporting", other)); await settle();
  const pt = P.S.open.draft.tags.find((t) => t.id === other) || {};
  check(tagIn(other).icon === icon2 && tagIn(other).hue === hue2 && tagIn(other).supporting === true
        && pt.icon === icon2 && pt.hue === hue2 && pt.supporting === true && calls.every((c) => c[0] === "saveTag"),
    "tgs10a an icon, a colour and the tick chosen in the page land in the file through the one verb, and the page's tag follows: " + J(calls));
  await P.ACTS["tag-hue"](sel("tag-hue", other, "")); await settle();
  await P.ACTS["tag-supporting"](sel("tag-supporting", other)); await settle();
  check(!("hue" in tagIn(other)) && !("supporting" in tagIn(other)) && tagIn(other).icon === icon2,
    "tgs10b Automatic takes the colour off and a second press takes the mark off, the icon staying: " + J(tagIn(other)));

  /* The topic and the action carry their tag in data-tg, so every `input[data-tag]` selector (a finding's focus, F2's rename,
     the window legs) still finds the name's field alone, one per language. */
  const tagged = (iRow.match(/<input[^>]*data-tag="[^"]*"[^>]*>/g) || []);
  check(tagged.length === 2 && tagged.every((x) => x.indexOf("data-tf") < 0) && /data-tg="[^"]*" data-tf="topic"/.test(iRow),
    "tgs11 the name's field is the one input per language that carries data-tag, the topic and the action carry data-tg: "
    + tagged.length + " tagged");

  /* ---- after the test architect's read (F1, F2, F4) ------------------------------------------------ */
  const b13 = bytes();
  const strays = [];
  for (const [id, patch] of [[shelf, { topic: { en: "Mooring" } }], [shelf, { action: { en: "moored" } }], [shelf, { supporting: "yes" }],
    [shelf, { supporting: 1 }], [r1, { topic: "Berth change" }], [r1, { colour: "blue" }], [shelf, { label: "Moorings" }],
    [r1, { topic: { en: 5 } }]]) {
    const r = await wire(S.saveTag(dir, id, patch));
    strays.push(r.error ? "refused" : "answered");
  }
  check(strays.every((x) => x === "refused") && Buffer.compare(bytes(), b13) === 0,
    "tgs13 a field the verb does not write is refused, never answered as saved, and the file is left byte for byte: a topic"
    + " or action on a category, the mark as \"yes\" or 1, a topic as a string or with a number in it, an unknown key, a"
    + " category's label as a string: " + J(strays));

  /* The desk's own reader and writer, sliced from the pin as src/engine.mjs v2BodyTools slices it: the edition goes into
     the runtime and back out, and every tag and card comes back as it went in. */
  const v2src = fs.readFileSync(path.join(ROOT, "engine", "pinned", "src", "modules", "catalog-v2.js"), "utf8")
    .replace(/\nexport \{[\s\S]*$/, "\n");
  const V2 = new Function(v2src + "\nreturn { catalogFromV2, catalogToV2 };")();
  const back = V2.catalogToV2(V2.catalogFromV2(ed));
  check(F.canonical(back.tags) === F.canonical(ed.tags) && F.canonical(back.cards) === F.canonical(ed.cards),
    "tgs14 the published edition, read into the desk's runtime and written back out by the pinned catalog-v2.js, gives"
    + " every tag and card back unchanged, the new fields included");

  const hueWas = tagIn(shelf).hue;
  const hueTo = offered.hues.find((h) => h.slot !== hueWas).slot;
  await S.saveTag(dir, shelf, { hue: hueTo });
  const listed = await S.changesSince(dir);
  const entry = listed.list.find((e) => !e.elsewhere && e.other && (e.other.keys || []).indexOf("tags") >= 0);
  const undone = entry ? await wire(S.undoChange(dir, entry.n)) : { error: "no entry" };
  check(entry && !undone.error && tagIn(shelf).hue === hueWas,
    "tgs15 a tag save is a change Changes lists, and undoing it there puts the colour back: " + J({ was: hueWas, to: hueTo,
      n: entry && entry.n, error: undone.error, now: tagIn(shelf).hue }));

  const r3 = (await S.addTag(dir, "request", { en: "asking about fuel" })).tag.id;
  await S.saveTag(dir, r3, { topic: { pl: "Paliwo" } });
  const asked = await wire(S.removeLang(dir, "pl"));
  const plIntents = readJson(file).tags.filter((t) => t.kind === "request"
    && ["clause", "topic", "action"].some((f) => t[f] && String(t[f].pl || "").trim())).length;
  check(asked.refused === "not confirmed" && asked.uses && asked.uses.intents === plIntents && plIntents >= 2,
    "tgs16a the removal's confirmation counts every intent with Polish in its clause, topic or action, one with Polish only"
    + " in its topic included: " + J({ counted: asked.uses && asked.uses.intents, holding: plIntents }));
  await S.removeLang(dir, "pl", { confirm: true });
  const left = readJson(file).tags.filter((t) => t.kind === "request");
  check(left.every((t) => ["clause", "topic", "action"].every((f) => !t[f] || !("pl" in t[f])))
        && !("topic" in tagIn(r3)) && J(tagIn(r1).topic) === J({ en: "Berth change" }) && J(tagIn(r1).action) === J({ en: "berth changed" }),
    "tgs16b removing Polish takes it off every topic and action, a topic left with no language goes whole, and the other"
    + " language's words stay: " + J(left.map((t) => [t.id, t.topic, t.action])));

  copyPlants({
    root: ROOT, self: SELF, label: "tag-save", onlyVar: "TAG_SAVE_ONLY", check, skip,
    plants: [
      { mark: "a1018-text", leg: "tgs1", rel: "src/studio.mjs", line: "      void m;" },
      { mark: "a1018-icon", leg: "tgs3", rel: "src/studio.mjs", line: "        else if (offered.icons.indexOf(ic) >= 0 || ic === tag.icon) void 0;" },
      { mark: "a1018-hue", leg: "tgs3", rel: "src/studio.mjs", line: "        else if (Number.isInteger(n) && offered.hues.some(h => h.slot === n)) void 0;" },
      { mark: "a1018-supporting", leg: "tgs3", rel: "src/studio.mjs", line: "        void 0;" },
      { mark: "a1018-intent-look", leg: "tgs4", rel: "src/studio.mjs", line: "    if (false)" },
      { mark: "a1018-tag-call", leg: "tgs9a", rel: "ui/app.js", line: "    more.forEach(() => {});" },
      { mark: "a1018-tag-row", leg: "tgs8b", rel: "ui/app.js", line: '      + (req ? ls.map((l) => tf(t, "action", l, "")).join("") : "")' },
      { mark: "f1-tag-stray", leg: "tgs13", rel: "src/studio.mjs", line: '    const stray = "";' },
      { mark: "f1-tag-words", leg: "tgs13", rel: "src/studio.mjs", line: "    void 0;" },
      { mark: "f1-tag-supporting", leg: "tgs13", rel: "src/studio.mjs", line: "    void 0;" },
      { mark: "f2-uses", leg: "tgs16a", rel: "src/studio.mjs", line: "    && inLang(t.clause, code)).length;" },
    ],
  });

  check(asserted + skipped + 1 === EXPECTED,
    "tgs12 every leg ran: " + (asserted + skipped + 1) + " of " + EXPECTED + (skipped ? ", " + skipped + " skipped" : ""));
  process.stdout.write("tag-save: " + asserted + " assertion(s), " + skipped + " skipped, " + failed + " failure(s)"
    + (PLANTS_OFF ? " (ETIUDA_PLANTS=off)" : "") + "\n");
  process.stdout.write("#counts checks=" + asserted + " skipped=" + skipped + " failed=" + failed + " expected=" + EXPECTED + "\n");
  if (!argv.includes("--keep")) dropScratch(SCRATCH, "tag-save");
  process.exit(failed ? 1 : 0);
}

main(process.argv.slice(2)).catch((e) => {
  process.stdout.write("  FAIL tests/tag-save.mjs threw: " + (e && e.stack || e) + "\n");
  process.exit(1);
});
