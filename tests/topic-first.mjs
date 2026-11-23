/* AN INTENT IS NAMED BY ITS TOPIC, AND BY ITS CLAUSE WHERE IT HAS NONE (board 1018, piece C).
 *
 *     node tests/topic-first.mjs [--keep]
 *
 * The desk names an intent by its `topic` and falls back to its `clause` (the pinned engine's intent-text.js intentNavName);
 * Studio named it by its clause alone, so a catalog written with topics read as long sentences in its chips, its picker, its
 * search and its table. A catalog with topics is written here, read back from the saved file, opened, and reopened; the
 * page runs on tests/page-stand-in.mjs over what the module answered. Markup and state only.
 *
 *   tpf1  the saved catalog carries the topics, and opening it hands them to the page
 *   tpf2  a card's intent chips and the picker's offers name an intent by its topic, and by its clause where it has none
 *   tpf3  the picker finds an intent by a word of its topic and by a word of its clause
 *   tpf4  the cards search finds a card by the topic of an intent it carries
 *   tpf5  the Intents table leads each row with the name, the clause fields stay as they were, and its search reads both
 *   tpf6  with Polish shown, the Polish topic is the name; an intent with a topic in English alone still takes it before a clause
 *   tpf7  a delete refused because cards use the intent names it by its topic
 *   tpf8  reopened, the page names the intents as before; published, the edition carries every topic
 *   tpf9  the published edition is one the pinned reader loads
 *   tpf10 every leg ran
 *
 * WHAT IT CANNOT SEE, said rather than implied: how the table looks with the extra column, which is Maxim's eye.
 *
 * PROVED BY MAKING IT FAIL, in a scratch copy of the tree (tests/plant-copy.mjs): the topic taken out of the page's one
 * naming function (c1018-topic-first) reddens tpf2; out of the picker's search (c1018-pick-topic), tpf3; out of the cards
 * search's text (c1018-hay-topic), tpf4; the name cell out of the table (c1018-tag-name), tpf5; and out of the module's
 * name for a tag (c1018-tag-words), tpf7. ETIUDA_PLANTS=off skips them and counts each.
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
const SCRATCH = path.join(ROOT, "scratch", "topic-first");
const EXPECTED = 18;
const PLANTS_OFF = process.env.ETIUDA_PLANTS === "off";

let asserted = 0, failed = 0, skipped = 0;
function check(cond, line) {
  asserted++;
  if (cond) process.stdout.write("  ok   " + line + "\n");
  else { failed++; process.stdout.write("  FAIL " + line + "\n"); }
}
function skip(line) { skipped++; process.stdout.write("  skip " + line + "\n"); }
const readJson = (f) => JSON.parse(fs.readFileSync(f, "utf8"));

async function main(argv) {
  clearScratch(SCRATCH);
  const S = await import("../src/studio.mjs");
  const F = await Engine.format();
  const root = path.join(SCRATCH, "projects");
  const share = path.join(SCRATCH, "share");
  fs.mkdirSync(root, { recursive: true });
  fs.mkdirSync(share, { recursive: true });
  const made = await S.newProject(root, "Topics", [{ code: "en", name: "English" }, { code: "pl", name: "Polish" }]);
  const dir = made.dir;
  const shelf = (await S.addTag(dir, "shelf", { en: "Moorings", pl: "Cumowanie" })).tag.id;
  const r1 = (await S.addTag(dir, "request", { en: "changing your berth", pl: "zmianą miejsca" })).tag.id;
  const r2 = (await S.addTag(dir, "request", { en: "asking about the tide", pl: "pytaniem o pływ" })).tag.id;
  const r3 = (await S.addTag(dir, "request", { en: "paying the harbour fee", pl: "opłatą portową" })).tag.id;
  const ca = (await S.addCard(dir, shelf, "Berths", "Berths are given at the office.")).card.id;
  const cb = (await S.addCard(dir, shelf, "Tides", "The tide table hangs by the gate.")).card.id;
  await S.saveCard(dir, ca, { requests: [r1, r3] });
  await S.saveCard(dir, cb, { requests: [r2] });

  /* THE TOPICS ARE WRITTEN INTO THE DRAFT AS THE FORMAT CARRIES THEM, hashed by the pinned engine, and a verb then rewrites
     the file in Studio's own form: r1 has a topic in both languages, r3 in English only, r2 none. */
  const file = path.join(dir, DRAFT_FILE);
  const d0 = readJson(file);
  const tag = (d, id) => d.tags.find((t) => t.id === id);
  tag(d0, r1).topic = { en: "Berth change", pl: "Zmiana miejsca" };
  tag(d0, r3).topic = { en: "Harbour fee" };
  delete d0.hash; d0.hash = F.contentHash(d0);
  fs.writeFileSync(file, JSON.stringify(d0, null, 1) + "\n");
  await S.moveTag(dir, r1, 1); await S.moveTag(dir, r1, -1);

  const saved = readJson(file);
  const opened = await S.openProject(dir);
  check(JSON.stringify(tag(saved, r1).topic) === JSON.stringify({ en: "Berth change", pl: "Zmiana miejsca" })
        && JSON.stringify(tag(saved, r3).topic) === JSON.stringify({ en: "Harbour fee" }) && !("topic" in tag(saved, r2))
        && JSON.stringify(tag(opened.draft, r1).topic) === JSON.stringify(tag(saved, r1).topic),
    "tpf1 the saved catalog carries the topics after a verb rewrote it, and opening it hands them to the page: "
    + JSON.stringify([tag(saved, r1).topic, tag(saved, r3).topic, tag(opened.draft, r1).topic]));

  const pageOn = (open, lang, uiLang) => {
    const home = loadPage({ uiLang: uiLang || "en" });
    const P = home.page;
    P.__set("queueSave", () => {});
    P.S.host = { tour: { offered: true }, langs: { builtIn: ["en", "pl"], endonyms: { en: "English", pl: "Polski" } } };
    P.S.open = Object.assign({}, open, { lint: open.lint || { errors: 0, warnings: 0, rows: [] }, awaiting: open.awaiting || [] });
    P.S.screen = "project"; P.S.section = "cards"; P.S.lang = lang || "en"; P.S.q = "";
    return { P, home };
  };
  const names = (P, open) => {
    const c = P.cardById(ca);
    const chips = (P.intentHtml(c).match(/<span class="nm">[^<]*<\/span>/g) || []).map((s) => s.replace(/<[^>]+>/g, ""));
    P.S.intentPick = { dir: open.dir, id: ca, q: "", at: 0, open: true };
    const offers = (P.intentFoundHtml(c).match(/<span class="tt">[^<]*<\/span>/g) || []).map((s) => s.replace(/<[^>]+>/g, ""));
    return { chips, offers };
  };

  const { P } = pageOn(opened, "en");
  const n1 = names(P, opened);
  check(n1.chips.join("|") === "Berth change|Harbour fee" && n1.offers.join("|") === "asking about the tide",
    "tpf2 the card's chips name its intents by their topics, and the picker offers the one with none by its clause: chips "
    + JSON.stringify(n1.chips) + ", offers " + JSON.stringify(n1.offers));

  const cB = P.cardById(cb);
  const byTopic = P.intentFound(cB, "berth CHANGE").map((t) => t.id).join(",");
  const byClause = P.intentFound(cB, "changing your").map((t) => t.id).join(",");
  /* Both languages shown: the name is the English topic, and the Polish one is found as the Polish clause is. */
  P.S.lang = "both";
  const byOther = P.intentFound(cB, "zmiana miejsca").map((t) => t.id).join(",");
  const byOtherClause = P.intentFound(cB, "zmianą").map((t) => t.id).join(",");
  P.S.lang = "en";
  check(byTopic === r1 && byClause === r1 && byOther === r1 && byOtherClause === r1,
    "tpf3 the picker finds the intent by a word of its topic and by a word of its clause, and with both languages shown by"
    + " the other language's topic and clause: " + JSON.stringify([byTopic, byClause, byOther, byOtherClause]));

  const find = (q) => { P.S.q = q; const out = P.visibleCards().map((c) => c.id).sort().join(","); P.S.q = ""; return out; };
  check(find("harbour fee") === ca && find("berth change") === ca && find("zmiana miejsca") === ca && find("pływ") === cb,
    "tpf4 the cards search finds a card by the topic of an intent it carries, in either language, and still by a clause: "
    + JSON.stringify([find("harbour fee"), find("berth change"), find("zmiana miejsca"), find("pływ")]));

  const paintTags = P.__get("paintTags");
  const tableOf = (q) => {
    P.S.q = q || ""; P.S.section = "intents"; paintTags("request", "Intents");
    const html = P.__get("$")("#main").innerHTML; P.S.q = ""; P.S.section = "cards"; return html;
  };
  const t0 = tableOf("");
  const rows = t0.split('<tr data-ctx="tag"').slice(1);
  const row1 = rows.find((r) => r.indexOf('data-id="' + r1 + '"') >= 0) || "";
  const row2 = rows.find((r) => r.indexOf('data-id="' + r2 + '"') >= 0) || "";
  /* MOVED AT PIECE A. Was: "each row of the Intents table leads with the name, the topic or else the clause", read from a
     cell of text. Now the name is a field per language: the row leads with the topic's field, which shows the clause as its
     placeholder where the intent has no topic, so the row still reads by its name either way. */
  const firstCell = (r) => {
    const m = /<td[^>]*><input[^>]*data-tf="topic"[^>]*value="([^"]*)"(?: placeholder="([^"]*)")?/.exec(r);
    return m ? (m[1] || m[2] || "") : "";
  };
  check(firstCell(row1) === "Berth change" && firstCell(row2) === "asking about the tide"
        && /data-tag="[^"]*" data-l="en" value="changing your berth"/.test(row1),
    "tpf5a each row of the Intents table leads with the name, the topic's field, the clause as its placeholder where it has"
    + " none, and the clause's field keeps the clause: " + JSON.stringify([firstCell(row1), firstCell(row2)]));
  const hit = (q) => tableOf(q).split('<tr data-ctx="tag"').slice(1).map((r) => (/data-id="([^"]*)"/.exec(r) || [])[1]).join(",");
  check(hit("berth change") === r1 && hit("changing your") === r1 && hit("fee") === r3,
    "tpf5b the table's search finds an intent by its topic and by its clause: " + JSON.stringify([hit("berth change"), hit("changing your"), hit("fee")]));

  const { P: Ppl } = pageOn(opened, "pl", "pl");
  const n2 = names(Ppl, opened);
  check(n2.chips.join("|") === "Zmiana miejsca|Harbour fee" && n2.offers.join("|") === "pytaniem o pływ",
    "tpf6 with Polish shown the Polish topic is the name, an English-only topic comes before a Polish clause, and the"
    + " intent with no topic is named by its Polish clause: chips " + JSON.stringify(n2.chips) + ", offers " + JSON.stringify(n2.offers));

  const refused = await S.deleteTag(dir, r1);
  const said = JSON.stringify(refused && refused.vars || refused);
  check(refused && refused.refused === "in use" && refused.tag && refused.tag.name === "Berth change",
    "tpf7 a delete refused because a card uses the intent names it by its topic: " + JSON.stringify(refused && refused.tag) + " " + said.slice(0, 120));

  /* ---- reopen, publish ---------------------------------------------------------------------- */
  const again = await S.openProject(dir);
  const { P: P2 } = pageOn(again, "en");
  const n3 = names(P2, again);
  check(JSON.stringify(n3) === JSON.stringify(n1),
    "tpf8a reopened, the page names the intents as it did: " + JSON.stringify(n3));
  const pub = await S.publishProject(dir, { folder: share, notes: "topics" });
  const ed = pub && pub.ec ? readJson(pub.ec) : { tags: [] };
  check(JSON.stringify(tag(ed, r1) && tag(ed, r1).topic) === JSON.stringify({ en: "Berth change", pl: "Zmiana miejsca" })
        && JSON.stringify(tag(ed, r3) && tag(ed, r3).topic) === JSON.stringify({ en: "Harbour fee" })
        && JSON.stringify(tag(ed, r1) && tag(ed, r1).clause) === JSON.stringify({ en: "changing your berth", pl: "zmianą miejsca" }),
    "tpf8b published, the edition carries every topic beside the clauses: " + JSON.stringify(ed.tags && ed.tags.filter((t) => t.kind === "request")));
  /* THE PINNED ENGINE'S OWN READER, whose runtime keeps the topic as its own column (catalog-v2.js REQ_KEY). */
  const { loadCatalog, lintCatalog } = Engine.lint();
  let read = null, why = "";
  try { read = loadCatalog(pub.ec); } catch (e) { why = String(e && e.message || e); }
  const errs = read ? lintCatalog(read).errors : ["unread"];
  check(!why && errs.length === 0 && read && JSON.stringify(read.intents && read.intents.topic || []).indexOf("Berth change") >= 0,
    "tpf9 the published edition is one the pinned reader loads, with no lint error, and its runtime holds the topic: "
    + JSON.stringify({ why, errors: errs, topic: read && read.intents && read.intents.topic }));

  copyPlants({
    root: ROOT, self: SELF, label: "topic-first", onlyVar: "TOPIC_FIRST_ONLY", check, skip,
    plants: [
      { mark: "c1018-topic-first", leg: "tpf2", rel: "ui/app.js", line: "  const label = (t, ls) => (t ? (false" },
      { mark: "c1018-pick-topic", leg: "tpf3", rel: "ui/app.js",
        line: '        || (sh.length && sh.some((l) => text(t.clause, l).toLowerCase().indexOf(w) >= 0)));' },
      { mark: "c1018-hay-topic", leg: "tpf4", rel: "ui/app.js", line: "      const l = tagText(t), tp = {};" },
      { mark: "c1018-tag-name", leg: "tpf5a", rel: "ui/app.js", line: '      + (req ? "<td></td>" : "")' }, /* the topic's fields out */
      { mark: "c1018-tag-words", leg: "tpf7", rel: "src/studio.mjs",
        line: "  return tag && tag.kind === \"request\" ? pick(tag.clause) : pick(tag && tag.label);" },
    ],
  });

  check(asserted + skipped + 1 === EXPECTED,
    "tpf10 every leg ran: " + (asserted + skipped + 1) + " of " + EXPECTED + (skipped ? ", " + skipped + " skipped" : ""));
  process.stdout.write("topic-first: " + asserted + " assertion(s), " + skipped + " skipped, " + failed + " failure(s)"
    + (PLANTS_OFF ? " (ETIUDA_PLANTS=off)" : "") + "\n");
  process.stdout.write("#counts checks=" + asserted + " skipped=" + skipped + " failed=" + failed + " expected=" + EXPECTED + "\n");
  if (!argv.includes("--keep")) dropScratch(SCRATCH, "topic-first");
  process.exit(failed ? 1 : 0);
}

main(process.argv.slice(2)).catch((e) => {
  process.stdout.write("  FAIL tests/topic-first.mjs threw: " + (e && e.stack || e) + "\n");
  process.exit(1);
});
