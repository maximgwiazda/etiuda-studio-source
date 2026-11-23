/* Every line the pinned lint writes for the six fields of the format revision is a frame a Polish screen can say (board 834,
 * step 6): node tests/format-said.mjs. The lines are the engine's, planted one fault at a time; the sixteen Polish values
 * still the copywriter's carry "[PL pending] " and are counted and printed, never failed on. */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as Engine from "../src/engine.mjs";
import { LINT_FRAMES, lintSaid } from "../src/lint-said.mjs";
import { say } from "../src/refusal.mjs";
import * as S from "../src/studio.mjs";
import { DRAFT_FILE, PROJECT_FILE } from "../src/publish.mjs";
import { clearScratch, dropScratch } from "./scratch.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const SCRATCH = path.join(ROOT, "scratch", "format-said");
const EXPECTED = 5;
const PENDING = "[PL pending] ";

let asserted = 0, failed = 0;
function check(cond, line) {
  asserted++;
  if (cond) process.stdout.write("  ok   " + line + "\n");
  else { failed++; process.stderr.write("  FAIL " + line + "\n"); }
}

/* THE SIXTEEN SENTENCES, as the frames src/lint-said.mjs holds for the six fields. */
const NEW_FRAMES = [
  "card {ID}: {FLAG} is {VALUE}, wanted true or absent",
  "card {ID}: next is not a list",
  "card {ID}: next[{I}] is not an entry with a to",
  "card {ID}: next[{I}] names the card itself",
  "card {ID}: next[{I}] names {TO}, which is no card",
  "card {ID}: next[{I}] names {TO} a second time",
  "notes: not a table of text by language",
  "notes.{CODE}: a language this catalog does not declare",
  "notes.{CODE}: not text",
  "{FIELD}: not an entry",
  "grew.id: {STATE}, wanted the id of the catalog it grew from",
  "grew.rev: {STATE}, wanted the rev it grew from",
  "grew.sha: {STATE}, wanted sha256: and 64 lower-case hex characters",
  "desk.id: {STATE}, wanted k- and 16 lower-case hex characters",
  "desk.name: not text",
  "desk.{PART}: {STATE}, wanted 64 lower-case hex characters",
];

async function main(argv) {
  clearScratch(SCRATCH);
  fs.mkdirSync(SCRATCH, { recursive: true });
  const F = await Engine.format();
  const { lintCatalog } = Engine.lint();

  const shelf = { id: F.tagId("Greeting"), kind: "shelf", label: { en: "Greeting", pl: "Powitanie" } };
  const card = (n) => ({ id: "c-card-" + n, shelf: shelf.id, bodyShape: "plain",
    title: { en: "Card " + n, pl: "Karta " + n }, body: { en: "Body " + n + ".", pl: "Tresc " + n + "." } });
  const base = {
    format: F.FORMAT, kind: F.KIND, id: "said-catalog", rev: 1,
    langs: [{ code: "en", label: "EN" }, { code: "pl", label: "PL" }], commentLang: "en",
    tags: [shelf], cards: [card(1), card(2), card(3)], minEngine: "2.0.0",
  };
  const rehash = (d) => { delete d.hash; d.hash = F.contentHash(d); return d; };
  const hex = (c, n) => c.repeat(n);
  const grew = () => ({ id: "said-parent", rev: 1, sha: "sha256:" + hex("0", 64) });
  const desk = () => ({ id: "k-" + hex("a", 16), name: "Max", key: hex("b", 64), box: hex("c", 64) });
  check(lintCatalog(rehash(JSON.parse(JSON.stringify(base)))).errors.length === 0,
    "fs0 CONTROL: the catalog every fault is planted in lints clean, so every line below is the fault's");

  /* ---- 1. EVERY SENTENCE THE SIX FIELDS CAN SAY ---------------------------------------------- */

  const plants = [
    ["retired", d => { d.cards[0].retired = "yes"; }],
    ["commits", d => { d.cards[0].commits = 1; }],
    ["next not a list", d => { d.cards[0].next = "later"; }],
    ["next entry without a to", d => { d.cards[0].next = [{}]; }],
    ["next itself", d => { d.cards[0].next = [{ to: d.cards[0].id }]; }],
    ["next no card", d => { d.cards[0].next = [{ to: "c-gone" }]; }],
    ["next twice", d => { d.cards[0].next = [{ to: d.cards[1].id }, { to: d.cards[1].id }]; }],
    ["notes not a table", d => { d.notes = "a note"; }],
    ["notes undeclared language", d => { d.notes = { zz: "x" }; }],
    ["notes not text", d => { d.notes = { en: 5 }; }],
    ["grew not an entry", d => { d.grew = "x"; }],
    ["desk not an entry", d => { d.desk = "x"; }],
    ["grew id malformed", d => { d.grew = Object.assign(grew(), { id: "BAD" }); }],
    ["grew id absent", d => { d.grew = grew(); delete d.grew.id; }],
    ["grew rev", d => { d.grew = Object.assign(grew(), { rev: "one" }); }],
    ["grew sha", d => { d.grew = Object.assign(grew(), { sha: "sha256:00" }); }],
    ["desk id", d => { d.desk = Object.assign(desk(), { id: "k-123" }); }],
    ["desk name", d => { d.desk = Object.assign(desk(), { name: 5 }); }],
    ["desk key", d => { d.desk = Object.assign(desk(), { key: "00" }); }],
    ["desk box", d => { d.desk = Object.assign(desk(), { box: "00" }); }],
  ];
  const produced = [];     /* [plant, line] for every line the engine wrote about a plant */
  for (const [name, edit] of plants) {
    const d = JSON.parse(JSON.stringify(base)); edit(d); rehash(d);
    for (const line of lintCatalog(d).errors) produced.push([name, line]);
  }
  const unsaid = produced.filter(([, l]) => !lintSaid(l));
  const wrong = produced.filter(([, l]) => { const s = lintSaid(l); return s && say(s.frame, s.vars) !== l; });
  check(produced.length >= plants.length && unsaid.length === 0 && wrong.length === 0,
    "fs1a every one of the " + produced.length + " lines the pinned lint wrote for " + plants.length
    + " planted faults in the six fields is rebuilt exactly by a frame: " + unsaid.length + " unsaid "
    + JSON.stringify(unsaid.slice(0, 2)) + ", " + wrong.length + " rebuilt wrong");

  /* ---- 2. THE CONTROLS ----------------------------------------------------------------------- */

  check(lintSaid("card c-one: shelf absent").frame === "card {ID}: shelf absent"
        && lintSaid("tag t-one: the id is claimed twice").frame === "tag {ID}: the id is claimed twice",
    "fs2a CONTROL: lines said before this build are still said by the frame they had, not by a new one");
  check(lintSaid("card c-one: retired is, wanted true or absent") === null
        && lintSaid("grew.sha: , wanted sha256: and 64 lower-case hex characters") === null
        && lintSaid("a sentence the engine has not written yet") === null,
    "fs2b CONTROL: a line no frame rebuilds is still shown as written (null), which is what a pin's new wording"
    + " looks like and what tests/lint-jump.mjs 0i turns red on");

  /* ---- 3. THE SCREEN'S ROW ------------------------------------------------------------------- */

  const dir = path.join(SCRATCH, "project");
  fs.mkdirSync(dir, { recursive: true });
  const d = JSON.parse(JSON.stringify(base));
  d.cards[0].retired = "yes"; rehash(d);
  fs.writeFileSync(path.join(dir, DRAFT_FILE), JSON.stringify(d, null, 1) + "\n");
  fs.writeFileSync(path.join(dir, PROJECT_FILE), JSON.stringify({ id: d.id, rev: 0, edition: "", draft: DRAFT_FILE }, null, 1) + "\n");
  const rows = (await S.openProject(dir)).lint.rows;
  const row = rows.find(r => r.why.indexOf("retired is") >= 0);
  check(row && row.said && row.said.frame === NEW_FRAMES[0] && row.card === d.cards[0].id
        && row.go && row.go.section === "cards" && row.go.id === d.cards[0].id,
    "fs3a the lint list's row for a bad `retired` carries the frame for a Polish screen and still jumps to its card: "
    + JSON.stringify(row && { said: row.said && row.said.frame, card: row.card }));

  process.stdout.write("\nformat-said  " + asserted + " assertion(s), " + failed + " failure(s)\n");
  if (asserted !== EXPECTED) {
    process.stderr.write("format-said  expected " + EXPECTED + " assertions, ran " + asserted + "\n");
    failed++;
  }
  if (!argv.includes("--keep")) dropScratch(SCRATCH, "format-said");
  else process.stdout.write("format-said  kept " + SCRATCH + "\n");
  process.exit(failed ? 1 : 0);
}

main(process.argv.slice(2)).catch(e => {
  process.stderr.write("format-said  " + (e && e.stack ? e.stack : String(e)) + "\n");
  process.exit(2);
});
