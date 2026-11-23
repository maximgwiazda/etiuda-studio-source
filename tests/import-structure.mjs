/* WHAT AN IMPORT WILL MAKE, AND ONE DOOR FOR ANY FILE (import-no-preview-of-structure and import-no-spreadsheet-door, the
 * Studio batch of 2026-10-12).
 *
 *     node tests/import-structure.mjs
 *
 *   is1  the plan's report names each intent with the cards that carry it, and counts the rows whose intents cell holds a
 *        comma or a slash and no ";", which each became one intent
 *   is2  bringKind sends a format 2 catalog and a format 1 one to the upgrade, a format 1 one renamed .txt and an undeclared
 *        one as .js included, and a sheet, a sheet renamed .ec and a vendor's JSON export that parses to the wizard
 *   is7  the sheet landed for real makes the project the preview said: its cards, its categories, its intents and each
 *        intent's cards
 *   is3  the wizard's mapping step says what the mapping will make, by count and by name, says what a comma cell does, and
 *        names the separator in the intents field
 *   is4  Projects has one door, "Bring in your replies", in its chrome over the empty state too (whose block keeps no button,
 *        tests/launch-mark.mjs 1b), and Import catalog is gone from the chrome; the door sends a catalog to the upgrade and anything else to the wizard as a new project
 *   is5  the rail's row that holds the spreadsheet export is named for it
 *   is6  every leg ran
 *
 * Invented words throughout. Node only, no window; how it looks is Maxim's eye.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import * as S from "../src/studio.mjs";
import * as Engine from "../src/engine.mjs";
import { loadPage } from "./page-stand-in.mjs";

const EXPECTED = 7;
let asserted = 0, failed = 0;
function check(cond, line) {
  asserted++;
  if (cond) process.stdout.write("  ok   " + line + "\n");
  else { failed++; process.stdout.write("  FAIL " + line + "\n"); }
}
const q = (v) => (/[",\r\n]/.test(v) ? '"' + String(v).replace(/"/g, '""') + '"' : String(v));
const csv = (rows) => rows.map((r) => r.map(q).join(",")).join("\r\n") + "\r\n";

async function main() {
  const LAB = fs.mkdtempSync(path.join(os.tmpdir(), "etiuda-import-structure-"));
  const projects = path.join(LAB, "projects");
  fs.mkdirSync(projects, { recursive: true });
  const sheet = path.join(LAB, "replies.csv");
  fs.writeFileSync(sheet, csv([["Title", "Body", "Category", "Intents"],
    ["Widuma tosork", "Sarnesk kelbun one.", "Greeting", "Asked twice; Baggage"],
    ["Ondrave plasib", "Sarnesk kelbun two.", "Greeting", "Asked twice"],
    ["Kelbun sarnesk", "Sarnesk kelbun three.", "Refunds", "Refund, Late"],
    ["Plasib ondrave", "Sarnesk kelbun four.", "Refunds", ""]]));
  const plan = await S.importPlan(projects, sheet, {}, "");
  const rep = plan.report || {};
  const intents = (rep.intents || []).map((x) => x.clause + ":" + x.cards).join(",");
  check(intents === "Asked twice:2,Baggage:1,Refund, Late:1" && rep.joinedIntentRows === 1 && rep.counts.intents === 3,
    "is1 the report names each intent with its cards, and counts the one row whose cell joins two with a comma: "
    + intents + "; joined " + rep.joinedIntentRows);

  const V1 = ['window.PB_SAMPLE={', '  format:1, kind:"playbook-catalog", name:"Ondrave",', '  version:"2026-09-17",',
    '  categories:{ gr:"Greeting" }, categoriesPl:{ gr:"Powitanie" },',
    '  intents:{ en:["Asked twice"], pl:["Pytane dwa razy"], cmt:["a first ask"], cmtPl:["pierwsze pytanie"] },',
    '  cards:[ { c:"gr", t:"Widuma tosork", en:"Sarnesk kelbun one.", pl:"Sarnesk kelbun jeden.", intents:[0] } ]', "};", ""].join("\n");
  const v1At = path.join(LAB, "older.js");
  fs.writeFileSync(v1At, V1);
  const made = await S.newProject(projects, "Format two", [{ code: "en", name: "English" }]);
  /* a format 2 catalog as a desk keeps one: the project's draft under the format's own two declarations */
  const F = await Engine.format();
  const draftAt = path.join(made.dir, "draft.json");
  const v2At = path.join(LAB, "desk-catalog.ec");
  fs.writeFileSync(v2At, JSON.stringify(Object.assign({ kind: F.KIND, format: F.FORMAT }, JSON.parse(fs.readFileSync(draftAt, "utf8")))));
  const vendor = path.join(LAB, "vendor-export.json");
  fs.writeFileSync(vendor, JSON.stringify({ cards: [{ name: "Widuma", desc: "Sarnesk kelbun." }] }));
  /* a format 1 catalog renamed .txt, one with no declaration at all, and a sheet renamed .ec (Clément's read) */
  const v1Txt = path.join(LAB, "older-catalog.txt");
  fs.writeFileSync(v1Txt, V1);
  const v1Bare = path.join(LAB, "hand-written.js");
  fs.writeFileSync(v1Bare, V1.replace('  format:1, kind:"playbook-catalog", name:"Ondrave",\n', '  name:"Ondrave",\n').replace("PB_SAMPLE", "PB_CATALOG"));
  const sheetEc = path.join(LAB, "sheet-renamed.ec");
  fs.copyFileSync(sheet, sheetEc);
  const kinds = [];
  for (const f of [v2At, v1At, v1Txt, v1Bare, sheet, sheetEc, vendor]) kinds.push((await S.bringKind(f)).kind);
  check(kinds.join(",") === "catalog,catalog,catalog,catalog,import,import,import" && fs.readFileSync(v1Bare, "utf8").indexOf("format:1") < 0,
    "is2 a format 2 and a format 1 catalog go to the upgrade, a format 1 one renamed .txt and an undeclared one too, and a"
    + " sheet, a sheet renamed .ec and a vendor's JSON export to the wizard: " + kinds.join(","));

  const { page: P, node } = loadPage({ uiLang: "en" });
  P.S.wiz = { file: sheet, base: "replies.csv", plan, step: 0, no: null, override: {}, landed: null, intoDir: "", into: false };
  P.S.screen = "projects";
  const map = String(P.__get("wizMap")()).replace(/ /g, " ");
  const opts = P.__get("wizOptions")(plan).map((o) => o.label);
  check(/This will make 4 cards, 2 categories and 3 intents\./.test(map) && /Asked twice <span class="n">2<\/span>/.test(map)
        && /Greeting <span class="n">2<\/span>/.test(map) && /1 row have commas or slashes in the intents column/.test(map)
        && opts.indexOf("Intents, separated by ;") >= 0,
    "is3 the mapping step says what it will make by count and by name, what a comma cell does, and the intents field names ;");

  /* is7: the same sheet landed for real, counted from the draft it made rather than from the report it returns */
  const landed = await S.importLand(projects, sheet, {}, "");
  const d = landed.draft || {}, tags = d.tags || [], cards = d.cards || [];
  const shelves = tags.filter((x) => x.kind === "shelf"), requests = tags.filter((x) => x.kind !== "shelf");
  const madeIntents = requests.map((x) => (x.clause || {}).en + ":" + cards.filter((c) => (c.requests || []).indexOf(x.id) >= 0).length).sort().join(",");
  const saidIntents = (rep.intents || []).map((x) => x.clause + ":" + x.cards).sort().join(",");
  check(cards.length === rep.counts.cards && shelves.length === rep.counts.cats && requests.length === rep.counts.intents
        && madeIntents === saidIntents && cards.length === 4,
    "is7 the sheet landed for real makes the project the preview said: " + JSON.stringify([cards.length, shelves.length,
      requests.length, madeIntents]) + " against " + JSON.stringify([rep.counts.cards, rep.counts.cats, rep.counts.intents, saidIntents]));

  P.S.wiz = null;
  const asked = [];
  const api = { bringPick: async () => asked.shift(), upgradePlan: async (f) => { said.push("upgrade " + path.basename(f)); return JSON.parse(JSON.stringify(await S.upgradePlan(projects, f))); },
    importPlan: async (f, o, into) => { said.push("wizard " + path.basename(f) + " into " + JSON.stringify(into)); return plan; } };
  const said = [];
  const pg = loadPage({ api, uiLang: "en" });
  Object.assign(pg.page.S, { screen: "projects", projects: [], root: LAB, rootMissing: false, q: "", pfilter: "all" });
  pg.page.paintChrome();
  pg.page.paint();
  const chrome = pg.node("#chrome").innerHTML;
  const pRail = pg.node("#rail").innerHTML;
  asked.push({ file: v1At, kind: "catalog" }, { file: sheet, kind: "import" });
  await pg.page.ACTS.bring();
  const toUpgrade = pg.page.S.cover === "upgrade";
  pg.page.S.cover = null;
  await pg.page.ACTS.bring();
  check(/data-act="bring"[^>]*>[^]*?Bring in your replies/.test(pRail) && !/data-act="bring"/.test(chrome) && !/data-act="v1-pick"/.test(chrome)
        && toUpgrade && said.join(" | ") === "upgrade older.js | wizard replies.csv into \"\""
        && !!pg.page.S.wiz && pg.page.S.wiz.into === false,
    "is4 Projects has one door for any file, in its panel, and it sends a catalog to the upgrade and a"
    + " sheet to the wizard as a new project: " + JSON.stringify(said));

  const open = await S.openProject(made.dir);
  Object.assign(P.S, { open, screen: "project", section: "cards", lang: "en" });
  P.paintRail();
  const rail = node("#rail").innerHTML;
  check(/data-v="import"[^>]*>[^]*?Spreadsheet/.test(rail) && !/data-v="import"[^>]*>(?:(?!<\/a>)[^])*?>Import</.test(rail),
    "is5 the rail's row for the spreadsheet export is named Spreadsheet");

  check(asserted === EXPECTED - 1, "is6 every leg ran: " + (asserted + 1) + " of " + EXPECTED);
}

main().then(() => {
  console.log("#counts checks=" + asserted + " failed=" + failed + " expected=" + EXPECTED);
  console.log(failed ? "RESULT: FAIL " + failed + " failed" : "RESULT: ok " + asserted + " check(s)");
  process.exit(failed ? 1 : 0);
}, (e) => { console.log("  FAIL " + (e && e.stack || e)); console.log("RESULT: FAIL the leg did not complete"); process.exit(1); });
