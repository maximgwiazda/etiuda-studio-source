/* The statistics workbook's per language columns, filled from the counts a desk sent
 * for each card (board 948).
 *
 *     node tests/stats-lang.mjs
 *
 * Card X copied twice in Polish and once in English shows 2 and 1. An older desk file
 * with no per card counts leaves those cells empty. A phrase under a card's languages
 * refuses the file. No window, no child process.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as Studio from "../src/studio.mjs";
import * as Engine from "../src/engine.mjs";
import { makeKeyFile } from "../src/sign.mjs";
import { newTeam, withDesk, writeTeam } from "../src/team.mjs";
import { jsonText } from "../src/plain-json.mjs";
import { readStatsAll, viewsOf } from "../src/stats.mjs";
import { readWorkbook, sheetGrid } from "../src/workbook.mjs";
import { clearScratch, dropScratch } from "./scratch.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SCRATCH = path.join(ROOT, "scratch", "stats-lang");
const EXPECTED = 8;
const WORDS = {
  cards: "Cards", searches: "Searches", intents: "Intents",
  title: "Card", category: "Category", status: "Status", retired: "Retired",
  copies: "Copies in the period", copiesLang: "Copies, {LANG}",
  count: "Count", intent: "Intent", times: "Times", totals: "All cards", lang: "en",
};

let asserted = 0, failed = 0;
function check(ok, line) {
  asserted++;
  if (ok) console.log("  ok   " + line);
  else { failed++; console.log("  FAIL " + line); }
}

function deskIdFor(priv) {
  const pub = crypto.createPublicKey(priv).export({ type: "spki", format: "der" }).subarray(-32).toString("hex");
  const id = "k-" + crypto.createHash("sha256").update(Buffer.from(pub, "hex")).digest("hex").slice(0, 16);
  return { id, pub };
}

function answer(cardId, withLangs) {
  const card = { id: cardId, n: 3, at: "2026-11-01" };
  if (withLangs) card.langs = { pl: 2, en: 1 };
  return {
    format: 1, kind: "etiuda-statistics", desk: "Desk", engine: "test",
    period: { from: "2026-11-01", to: "2026-11-09" }, since: "2026-11-01",
    sync: "2026-11-09 12:00",
    cards: [card], intents: [], misses: 0, langs: { pl: 2, en: 1 },
    catalog: { id: "catalog", rev: 1 }, hash: "h",
  };
}

async function exportBook(name, withLangs) {
  const base = path.join(SCRATCH, name);
  fs.mkdirSync(base, { recursive: true });
  const projects = path.join(base, "projects");
  const share = path.join(base, "share");
  fs.mkdirSync(projects, { recursive: true });
  fs.mkdirSync(share, { recursive: true });
  const made = await Studio.newProject(projects, "Cards", [
    { code: "en", name: "English" }, { code: "pl", name: "Polish" },
  ]);
  const shelf = (await Studio.addTag(made.dir, "shelf", { en: "Goods" })).tag.id;
  const cardX = (await Studio.addCard(made.dir, shelf, "Card X", "The text of card X.")).card.id;
  await Studio.addCard(made.dir, shelf, "Card Y", "The text of card Y.");
  await Studio.setPublishFolder(made.dir, share);
  const pass = "stats-lang-pass";
  const keyAt = path.join(base, "lead-key.json");
  fs.writeFileSync(keyAt, JSON.stringify(await makeKeyFile({ passphrase: pass }), null, 1) + "\n");
  const pkcs8 = Buffer.from("302e020100300506032b657004220420", "hex");
  const priv = crypto.createPrivateKey({ key: Buffer.concat([pkcs8, Buffer.alloc(32, 0x31)]), format: "der", type: "pkcs8" });
  const who = deskIdFor(priv);
  const lead = JSON.parse(fs.readFileSync(keyAt, "utf8"));
  let team = newTeam({ catalogs: [made.draft.id], lead: { keyId: lead.keyId, public: lead.public } });
  team = withDesk(team, { id: who.id, key: who.pub, box: crypto.randomBytes(32).toString("hex") }, "Desk");
  const wrote = await writeTeam(share, team, { key: keyAt, passphrase: pass });
  const body = answer(cardX, withLangs);
  body.catalog = { id: made.draft.id, rev: 1 };
  const signed = Object.assign({}, body, { sig: { alg: "Ed25519", keyId: who.id } });
  signed.sig.value = crypto.sign(null, Engine.statsRules().statsAnswerSignedBytes(signed), priv).toString("hex");
  const env = Engine.statsRules().sealStatsLead(wrote.team.lead.box, wrote.team.id, wrote.team.lead.keyId, who.id, JSON.stringify(signed));
  fs.mkdirSync(path.join(share, "desks", who.id), { recursive: true });
  fs.writeFileSync(path.join(share, "desks", who.id, "stats.estat"), jsonText(env));
  const out = path.join(base, "cards.xlsx");
  /* this-month of 9 November 2026 is this answer's declared period, so the span counts it. */
  const spanNow = new Date(2026, 10, 9, 12, 0, 0);
  await Studio.setStatsSpan(made.dir, "this-month", { key: keyAt, passphrase: pass, now: spanNow });
  await Studio.exportStatsBook(made.dir, out, WORDS, { key: keyAt, passphrase: pass, now: spanNow });
  return out;
}

function langCells(file) {
  const wb = readWorkbook(fs.readFileSync(file));
  const sheet = wb.sheets.find(s => s.name === "Cards");
  const grid = sheetGrid(sheet);
  const head = grid[0] || [];
  const pl = head.indexOf("Copies, PL");
  const en = head.indexOf("Copies, EN");
  const row = grid.findIndex(r => r[0] === "Card X");
  const other = grid.findIndex(r => r[0] === "Card Y");
  const cell = (r, c) => (r >= 0 && c >= 0 && grid[r] && grid[r][c] != null) ? grid[r][c] : "";
  const numbered = (r, c) => {
    if (r < 0 || c < 0) return false;
    const ref = String.fromCharCode(65 + c) + (r + 1);
    const found = sheet.cells.find(item => item.ref === ref);
    return !!found && found.kind === "number";
  };
  return {
    pl: cell(row, pl), en: cell(row, en),
    plNumber: numbered(row, pl), enNumber: numbered(row, en),
    otherPl: cell(other, pl), otherEn: cell(other, en),
    row, other, plCol: pl, enCol: en,
  };
}

const desk = "k-" + "ab".repeat(8);
const judgeDir = path.join(SCRATCH, "judge");
clearScratch(SCRATCH);
fs.mkdirSync(path.join(judgeDir, "desks", desk), { recursive: true });
fs.writeFileSync(path.join(judgeDir, "desks", desk, "stats.estat"), "{}\n");

const good = answer("card-x", true);
const phrase = JSON.parse(JSON.stringify(good));
phrase.cards[0].langs["good morning"] = 4;

const signedGood = await readStatsAll(judgeDir, { roster: [desk], signed: true, open: () => JSON.stringify(good) });
const signedBad = await readStatsAll(judgeDir, { roster: [desk], signed: true, open: () => JSON.stringify(phrase) });
const unsignedGood = await readStatsAll(judgeDir, { roster: [desk], signed: false, open: () => JSON.stringify(good) });
const unsignedBad = await readStatsAll(judgeDir, { roster: [desk], signed: false, open: () => JSON.stringify(phrase) });
const summed = signedGood.rows.length ? viewsOf(signedGood.rows, { cards: [{ id: "card-x", title: "Card X" }] }).cardLangs : null;
const bag = summed && summed["card-x"];

check(signedGood.rows.length === 1 && signedGood.refused.length === 0
  && !!bag && bag.pl === 2 && bag.en === 1 && !("good morning" in bag),
  "a signed file's per card counts are read: " + JSON.stringify(bag));
check(signedBad.rows.length === 0 && signedBad.refused.length === 1,
  "a phrase under a card's languages refuses the signed file: rows " + signedBad.rows.length);
check(unsignedGood.rows.length === 1 && unsignedGood.refused.length === 0,
  "a well formed per card count is a ruled noun when the file is unsigned");
check(unsignedBad.rows.length === 0 && unsignedBad.refused.length === 1,
  "a phrase under a card's languages refuses the unsigned file");

let fresh = null, older = null, exportNote = "";
try {
  fresh = langCells(await exportBook("fresh", true));
  older = langCells(await exportBook("older", false));
} catch (e) {
  exportNote = e && e.stack ? e.stack : String(e);
}

check(!!fresh && fresh.pl === "2" && fresh.en === "1" && fresh.plNumber && fresh.enNumber,
  "card X shows Polish 2 and English 1: " + JSON.stringify(fresh) + (exportNote ? "\n" + exportNote : ""));
check(!!fresh && fresh.otherPl === "" && fresh.otherEn === "",
  "card Y, which was not copied, leaves the language cells empty: " + JSON.stringify(fresh && { otherPl: fresh.otherPl, otherEn: fresh.otherEn }));
check(!!older && older.pl === "" && older.en === "" && older.plCol >= 0 && older.enCol >= 0,
  "an older desk file leaves the language cells empty: " + JSON.stringify(older));
check(!!fresh && fresh.row > 0 && String(JSON.stringify(fresh)).indexOf("good morning") < 0,
  "the workbook row is card X and carries no phrase");

if (asserted !== EXPECTED) {
  failed++;
  console.log("  FAIL ran " + asserted + " checks, the floor is " + EXPECTED);
}
dropScratch(SCRATCH, "stats-lang");
console.log((failed ? "FAIL" : "ok") + " stats-lang " + (asserted - failed) + "/" + asserted);
process.exit(Math.min(failed, 63));
