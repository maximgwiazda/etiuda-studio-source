/* THE DESKS' ANSWERS ON THE SCREEN ARE THE DESKS' ANSWERS ON THE COMMAND LINE.
 *
 *     node tests/stats-screen.mjs [--keep]
 *
 * THE CLAIM IS THE WHOLE TABLE, LINE FOR LINE. `node tools/stats-read.mjs <project> --key <file>`
 * prints a header, one row per desk and then the team's figures; the Statistics section of the
 * authoring screen paints the same things out of the same statsFor, and this reads both and compares
 * them as strings with the tabs put back. A comparison of one cell would pass with the screen
 * dropping a column, rounding a count or printing a period of its own - and the period is exactly
 * what must not be invented: a desk counts it, and says from which day.
 *
 * THE ANSWERS ARE LIVE, AS A DESK WRITES THEM (board 891). Each roster desk's answer is
 * desks/<branch id>/stats.estat, signed inside by the desk's own key and sealed to the lead's box;
 * the window and the command line are both given one passphrase key file, the window by
 * STUDIO_SIGNING_KEY and the command line by --key, each with STUDIO_KEY_PASSPHRASE, so both open
 * the same answers with the same box. Every desk key comes from a fixed seed, its branch id the one
 * the key makes, and one answer is the engine's own counters at the pin (tests/desk-emitter.mjs),
 * signed and sealed as the engine's writeStatsAnswer does. Two answers sum into the team's figures,
 * so the team's table is a sum rather than one desk's numbers reprinted, and a third roster desk
 * with nothing new is named and counted nowhere.
 *
 * A DESK'S ROW IS ITS EDITION AND ITS DECLARED PERIOD (ruling of 2026-09-23 02:08; the per-desk
 * sync cell went in 6372f2f): only the team's newest time is shown, on the live line above.
 *
 * A SIGNED ANSWER INSIDE FORMAT 1 WITH A KEY NOBODY RULED IS COUNTED, the key left out of the
 * verdict (updates 4, 2026-11-01). The screen shows the desk as a row, the key on no line, and
 * the command line exits 0. An answer in a format other than 1 is still refused: the screen
 * names it by its desk's folder, and the command line exits 1. That refusal is the one thing
 * the screen shows that the command line prints on the other stream.
 *
 * AND SECTION 5, THE FOUR AGGREGATE VIEWS (M2, off the deferred shelf 2026-09-16 16:08). The same
 * two-door claim again, over a SECOND project in the same window: a project published twice, a
 * fortnight apart, with four live answers on its share. The command line prints the four views as
 * blocks after the table; the screen paints two of them as tables and two as rows of tiles; every
 * cell is compared, and every figure is also computed a second time HERE, from the draft, the
 * archive and the answers this leg wrote, by arithmetic written out in the leg rather than borrowed
 * from the module under test.
 *
 * THE THREE THAT WOULD PASS A LAZY TEST are the reason the fixture is shaped as it is. A card
 * used by ONE desk of four must not be rotting, or a silent desk has voted. A card first
 * published after the window began must be counted as not judged and named, or a catalog
 * published this morning reads as a catalog nobody uses. And the screen must say how many desks
 * answered and how recent they are, or four true numbers over an unknown denominator are a lie.
 *
 * The request the desks were once asked with (etiuda-request.ereq, Ask desks) is gone from the app
 * since board 891, and its legs with it; tests/stats-live-studio.mjs 891si holds that it stays gone.
 */
import "./licensed-env.mjs";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { openStudio } from "./shell-door.mjs";
import * as Engine from "../src/engine.mjs";
import { importCsv } from "../src/import.mjs";
import { json, PROJECT_FILE, DRAFT_FILE, publishFull, ARCHIVE,
         CATALOG_IN_ARCHIVE } from "../src/publish.mjs";
import { makeKeyFile } from "../src/sign.mjs";
import { newTeam, withDesk, writeTeam } from "../src/team.mjs";
import { jsonText } from "../src/plain-json.mjs";
import { emitter, answerFrom } from "./desk-emitter.mjs";
import { clearScratch, dropScratch } from "./scratch.mjs";
import { pressWhen, settleOn } from "./press.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const SCRATCH = path.join(ROOT, "scratch", "stats-screen");
const KEY_AT = path.join(SCRATCH, "lead-key.json");
const PASS = "Quillet morrow brandle for the two doors";

let asserted = 0, failed = 0;
function check(cond, line) {
  asserted++;
  if (cond) process.stdout.write("  ok   " + line + "\n");
  else { failed++; process.stderr.write("  FAIL " + line + "\n"); }
}
const sleep = ms => new Promise(r => setTimeout(r, ms));
/* A table's head case-blind: the screen capitalises its words and the sheet upper-cases both. */
const normHead = (s) => String(s).toLowerCase().replace(/\bteammate\b/g, "desk").replace(/\bteammates\b/g, "desks");
const same = (a, b, i) => i === 0 ? normHead(a) === normHead(b) : a === b;

/* ---- THE TEAM AND ITS DESKS ----------------------------------------------------------------- */

/* A desk's key from a fixed seed, and the branch id that key makes (the engine's branchIdOf). */
const PKCS8_ED25519 = Buffer.from("302e020100300506032b657004220420", "hex");
function deskPair(fill) {
  const priv = crypto.createPrivateKey({ key: Buffer.concat([PKCS8_ED25519, Buffer.alloc(32, fill)]),
    format: "der", type: "pkcs8" });
  const key = crypto.createPublicKey(priv).export({ type: "spki", format: "der" }).subarray(-32)
    .toString("hex");
  return { id: "k-" + crypto.createHash("sha256").update(Buffer.from(key, "hex")).digest("hex")
    .slice(0, 16), key, priv };
}

/* The team this Studio leads on a share: `desks` is [pair, roster name], written under the lead's
   key, which mints the lead's box into the key file the first time and keeps it after. */
async function teamOn(share, catalog, desks, lead) {
  let team = newTeam({ catalogs: [catalog], lead: { keyId: lead.keyId, public: lead.public } });
  for (const [p, label] of desks)
    team = withDesk(team, { id: p.id, key: p.key, box: crypto.randomBytes(32).toString("hex") }, label);
  return (await writeTeam(share, team, { key: KEY_AT, passphrase: PASS })).team;
}

/* One answer as the engine's writeStatsAnswer leaves it: the desk's signature inside, the whole
   sealed to the lead's box, in the desk's own folder. What the desk sent is returned, so the
   arithmetic below reads the answers and not the module that opened them. */
/* Every answer this leg writes is signed here, whatever obj carries: 3a's and 3d's answers are signed ones. */
function seal(share, team, pair, obj) {
  const inner = Object.assign({}, obj, { sig: { alg: "Ed25519", keyId: pair.id } });
  inner.sig.value = crypto.sign(null, Engine.statsRules().statsAnswerSignedBytes(inner), pair.priv)
    .toString("hex");
  const env = Engine.statsRules().sealStatsLead(team.lead.box, team.id, team.lead.keyId, pair.id,
    JSON.stringify(inner));
  const dir = path.join(share, "desks", pair.id);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "stats.estat"), jsonText(env));
  return inner;
}

/* The project the section is read from: a generated pile imported into a draft, with the share
   as the folder it publishes to. It is never published here: the desks' table is about what the
   desks sent, and an edition would add nothing to it. */
async function plant(root, share) {
  const pile = pilePath();
  const made = spawnSync(process.execPath, ["tools/fixtures/generate.mjs", "--seed", "71",
    "--rows", "17", "--out", pile], { cwd: ROOT, encoding: "utf8" });
  if (made.status !== 0) throw new Error("the generator refused: " + (made.stderr || made.stdout));
  const dir = path.join(root, "share-desk");
  fs.mkdirSync(dir, { recursive: true });
  const cat = await importCsv({ file: path.join(pile, "macros.csv"), id: "share-catalog",
    name: "Shared catalog" });
  fs.writeFileSync(path.join(dir, DRAFT_FILE), json(cat.catalog), "utf8");
  fs.writeFileSync(path.join(dir, PROJECT_FILE), json({ id: cat.catalog.id,
    name: "Shared catalog", rev: 0, edition: "", draft: DRAFT_FILE, folder: share }), "utf8");
  return dir;
}

/* THE DESKS OF THE FIRST SHARE. Tallow's answer is written by hand; Wicker's is the engine's own
   counters, counting by day; Ember is on the roster with nothing new; Cinder is on the roster and
   has no folder until section 3, which first counts a signed answer of its own and then refuses
   a format this Studio does not read. The two answers sum to
   3 + 1 + the engine's copies, and to 5 misses, which are the numbers the team's table is held to. */
const TALLOW = deskPair(0x51), WICKER = deskPair(0x52), EMBER = deskPair(0x53), CINDER = deskPair(0x54);
async function answerShare(share, lead) {
  const team = await teamOn(share, "share-catalog",
    [[TALLOW, "Tallow lamp"], [WICKER, "Wicker lamp"], [EMBER, "Ember lamp"], [CINDER, "Cinder lamp"]], lead);
  const byDay = await emitter("by-day");
  const tallow = seal(share, team, TALLOW, {
    format: 1, kind: "etiuda-statistics", desk: "dtest-tallow", engine: "2.0.0-dev",
    period: { from: "2026-09-01", to: "2026-09-17" }, sync: "2026-09-17 13:00",
    cards: [{ id: "c-plant-one", n: 3, at: "2026-09-17" }, { id: "c-plant-two", n: 1 }],
    intents: [{ id: "i-plant-one", n: 2 }], misses: 5, langs: { en: 4, pl: 2 },
    catalog: { id: "share-catalog", rev: 1 }, hash: "djb2:0",
  });
  const wicker = seal(share, team, WICKER, answerFrom(byDay, { desk: "dtest-wicker",
    period: { from: "2026-09-01", to: "2026-09-17" }, catalog: { id: "share-catalog", rev: 1 },
    sync: "2026-09-16 08:00", uses: [["c-plant-one", "2026-09-10"], ["c-plant-three", "2026-09-12"]] }));
  fs.mkdirSync(path.join(share, "desks", EMBER.id), { recursive: true });
  return { team, tallow, wicker, byDay };
}

/* THE PROJECT THE FOUR VIEWS ARE READ FROM, and it is a second one because the first is about the
   desks' table and this one about the archive. It is published TWICE, a fortnight apart, and the
   second edition carries one card the first did not, so the fixture holds a card older than the
   window the desks declare and a card younger than it at the same time. The team is written after
   both publishes, as a lead's would be, so neither edition is sealed.

   THE ANSWERS ARE SHAPED FOR THE THREE FAILURES. `d-alpha` uses two cards and carries the newest
   revision; `d-beta` uses one of those two and is an edition behind; `d-gamma` carries no catalog
   at all, which is what a desk with nothing loaded honestly answers and must not be counted as one
   edition behind. Between them, every card but two is used by nobody. `d-delta` is the fourth,
   and the engine's own counters make it: it counts by day and began on the 12th, a week into the
   period, so the screen must say its count is partial. */
async function plantViews(root, share, pile, lead) {
  const dir = path.join(root, "views-desk");
  fs.mkdirSync(dir, { recursive: true });
  fs.mkdirSync(share, { recursive: true });
  const cat = await importCsv({ file: path.join(pile, "macros.csv"), id: "views-catalog",
    name: "Views catalog" });
  const all = cat.catalog;
  const first = JSON.parse(json(all));
  first.cards = first.cards.slice(0, all.cards.length - 1);
  fs.writeFileSync(path.join(dir, DRAFT_FILE), json(first), "utf8");
  fs.writeFileSync(path.join(dir, PROJECT_FILE), json({ id: all.id, name: "Views catalog",
    rev: 0, edition: "", draft: DRAFT_FILE, folder: share }), "utf8");
  const one = await publishFull({ project: dir, folder: share,
    now: new Date("2026-09-01T10:00:00Z") });
  fs.writeFileSync(path.join(dir, DRAFT_FILE), json(all), "utf8");
  const two = await publishFull({ project: dir, folder: share,
    now: new Date("2026-09-20T10:00:00Z") });
  const ids = all.cards.map(c => String(c.id));
  const A = deskPair(0x61), B = deskPair(0x62), G = deskPair(0x63), D = deskPair(0x64);
  const team = await teamOn(share, all.id,
    [[A, "Alder lamp"], [B, "Birch lamp"], [G, "Gorse lamp"], [D, "Damson lamp"]], lead);
  const put = (pair, desk, cards, catalog) => seal(share, team, pair, Object.assign({
    format: 1, kind: "etiuda-statistics", desk, engine: "2.0.0-dev",
    period: { from: "2026-09-05", to: "2026-09-19" }, sync: "2026-09-19 08:30",
    cards, intents: [], misses: 3, langs: { en: 2, pl: 1 },
  }, catalog ? { catalog } : {}));
  const answers = [
    put(A, "d-alpha", [{ id: ids[0], n: 4, at: "2026-09-18" }, { id: ids[1], n: 1 }],
      { id: all.id, rev: two.rev }),
    put(B, "d-beta", [{ id: ids[0], n: 2, at: "2026-09-10" }], { id: all.id, rev: one.rev }),
    put(G, "d-gamma", [], null),
    seal(share, team, D, answerFrom(await emitter("by-day"), { desk: "d-delta",
      period: { from: "2026-09-05", to: "2026-09-19" }, catalog: { id: all.id, rev: two.rev },
      uses: [[ids[2], "2026-09-12"]] })),
  ];
  return { dir, share, ids, first, all, one, two, answers, desks: 4, misses: 9 };
}

function pilePath() { return path.join(SCRATCH, "pile"); }

function readCli(project) {
  const env = Object.assign({}, process.env, { STUDIO_KEY_PASSPHRASE: PASS });
  return spawnSync(process.execPath, ["tools/stats-read.mjs", project, "--key", KEY_AT],
    { cwd: ROOT, encoding: "utf8", env });
}

/* THE COMMAND LINE'S OUTPUT IN BLOCKS, split on the blank line the tool puts between them. The
   first block is the desks' table, the next six are the team's figures and the views, each opening
   with its own title line, and the last names the roster desks with nothing new. Read here rather
   than in src/stats.mjs on purpose: a gate that imported the module's own splitter would agree with
   it however wrong the printing was. */
function cliBlocks(stdout) {
  const lines = String(stdout || "").split("\n");
  if (lines.length && lines[lines.length - 1] === "") lines.pop();
  const out = [[]];
  lines.forEach(l => { if (l === "") out.push([]); else out[out.length - 1].push(l); });
  return out;
}

/* COUNTS:PREDICATES
   Members that must be there, in order where the order is the claim.
   One more member still passes. A missing member is named. A floor stays
   where a scanner that saw nothing would otherwise pass. */
function missingMembers(seen, required, ordered) {
  const have = (seen || []).map(s => String(s));
  if (!ordered) return required.filter(name => have.indexOf(String(name)) < 0);
  let from = 0;
  const missing = [];
  for (const name of required) {
    const at = have.indexOf(String(name), from);
    if (at < 0) missing.push(name);
    else from = at + 1;
  }
  return missing;
}

const STAT_BLOCKS = ["all desks", "answers", "most used", "nobody used", "coverage", "adoption",
  "no new figures"];
function statBlocksHeld(titled) {
  const missing = missingMembers(Object.keys(titled || {}), STAT_BLOCKS, false);
  return { ok: missing.length === 0, missing };
}
/* THE LISTS LEAD WITH THE TITLE (board 976, item 9). The command line still prints the card
   id first. The screen moves that column last, heads it Id, and shows the first six and last
   four of a long card id. `shown` is the line the eye reads; `id` is the whole identifier the
   cell's title carries. A list that dropped the id, showed it whole, or left it first fails. */
function viewLine(line, head) {
  const cells = String(line).split("\t");
  const cardId = cells[0];
  const rest = cells.slice(1);
  if (head) return { shown: rest.concat("Id").join("\t"), id: "" };
  const shortId = /^c-[0-9a-f]{20,}$/.test(cardId) ? cardId.slice(0, 6) + "\u2026" + cardId.slice(-4) : cardId;
  return { shown: rest.concat(shortId).join("\t"), id: cardId };
}
function statListsHeld(tables, titles, wantTop, wantRot) {
  const match = (table, titleCol, want) => table && want && table.length === want.length
    && table.every((l, i) => {
      const moved = viewLine(want[i], i === 0);
      if (i === 0) return normHead(String(l)) === normHead(moved.shown);
      return l === moved.shown && (titleCol || [])[i - 1] === moved.id;
    });
  const missing = [];
  if (!(tables || []).some((t, n) => match(t, (titles || [])[n], wantTop))) missing.push("most used");
  if (!(tables || []).some((t, n) => match(t, (titles || [])[n], wantRot))) missing.push("nobody used");
  if ((tables || []).length < 2) missing.push("tables under 2");
  return { ok: missing.length === 0, missing };
}
/* COUNTS:END */

async function main(argv) {
  const keep = argv.indexOf("--keep") >= 0;
  clearScratch(SCRATCH);
  fs.mkdirSync(SCRATCH, { recursive: true });
  const projects = path.join(SCRATCH, "projects");
  const share = path.join(SCRATCH, "share");
  fs.mkdirSync(share, { recursive: true });
  const lead = await makeKeyFile({ passphrase: PASS });
  fs.writeFileSync(KEY_AT, JSON.stringify(lead, null, 1) + "\n");
  const dir = await plant(projects, share);
  /* BEFORE THE WINDOW OPENS, because the project list is read at boot: a folder created after
     the window is up has no row to press. */
  const share2 = path.join(SCRATCH, "share-views");
  const V = await plantViews(projects, share2, pilePath(), lead);
  const S1 = await answerShare(share, lead);

  check(/^[0-9a-f]{64}$/.test(String(S1.team.lead.box || "")) && !!S1.wicker.since
        && S1.wicker.cards.length === 2,
    "0a the team on the share names the lead's box, and one answer is the engine's own counters at "
    + S1.byDay.commit + ", counting by day from " + S1.wicker.since);

  const cli = readCli(dir);
  /* THE TRAILING TABS ARE PART OF THE LINE. A row whose last columns are empty ends in tabs,
     and trimming the whole of stdout takes them off the last line only - which made the screen
     and the tool differ in this test and nowhere else. Only the final newline comes off, which
     is cliBlocks's own rule. THE DESKS' TABLE IS THE FIRST BLOCK AND NOT THE WHOLE OF STDOUT. */
  const cliLines = cliBlocks(cli.stdout)[0];
  check(cli.status === 0 && cliLines.length === 3,
    "1a node tools/stats-read.mjs prints a header and the two desks that answered: exit " + cli.status
    + ", " + cliLines.length + " line(s)"
    + (cli.status === 0 ? "" : ": " + String(cli.stderr).trim()));

  const studio = await openStudio("tests/stats-screen.mjs", { words: true,
    projects, userDataDir: path.join(SCRATCH, "ud"),
    env: { STUDIO_SIGNING_KEY: KEY_AT, STUDIO_KEY_PASSPHRASE: PASS },
  });

  try {
    const page = studio.page;
    const press = async (sel, ms) => {
      await pressWhen(page, sel, { who: "tests/stats-screen.mjs" });
      await sleep(ms || 400);
    };
    await pressWhen(page, '[data-act="open"]', { who: "tests/stats-screen.mjs", attr: ["data-dir", dir] });
    await settleOn(page, 'Array.from(document.querySelectorAll("#rail a")).some(a => /^Statistics/.test(a.textContent))', { bound: 30000 });

    const rail = await page.evaluate(() =>
      Array.from(document.querySelectorAll("#rail a")).map(a => a.textContent));
    check(rail.some(r => /^Statistics/.test(r)),
      "2a the rail carries the section: " + JSON.stringify(rail));

    await press('[data-act="section"][data-v="stats"]', 1200);
    /* THE SECTION OPENS IN WORDS SINCE BOARD 862 (the month, in sentences), and what this leg holds to the command line is
       Every answer, the screen as it was; the view chosen is kept for the project, so one press serves its later visits. */
    await press('[data-act="stats-view"][data-v="every"]', 500);
    await settleOn(page, 'document.querySelectorAll("#main table.desks tr").length > 0', { bound: 30000 });
    const screen = await page.evaluate(() => ({
      /* The where line is a chip (board 976, item 11). The eye reads the last two steps; the
         whole path is the chip's data-path, which is what this compares to the share. */
      folder: (() => {
        const chip = document.querySelector("#main .st-where [data-ctx=path]");
        return (chip && chip.getAttribute("data-path"))
          || (document.querySelector("#main .lede .mono") || {}).textContent || "";
      })(),
      where: (document.querySelector("#main .st-where") || {}).textContent || "",
      /* `table.desks` AND NOT `table`, since the four aggregate views paint tables of their
         own above this one. */
      lines: Array.from(document.querySelectorAll("#main table.desks tr"))
        .map(tr => Array.from(tr.children).map(c => c.textContent).join("\t")),
      team: Array.from(document.querySelectorAll("#main table.team tr"))
        .map(tr => Array.from(tr.children).map(c => c.textContent).join("\t")),
      /* The two list cells, one line a figure since polish 04, item 4. */
      teamLines: Array.from(document.querySelectorAll("#main table.team td")).map(td =>
        Array.from(td.querySelectorAll(".tl")).map(l => l.textContent)),
      quiet: Array.from(document.querySelectorAll("#main .dashed.quiet")).map(d => d.textContent),
      num: (document.querySelector('#rail a[data-v="stats"] .num') || {}).textContent || "",
    }));

    check(screen.lines.length === cliLines.length
          && screen.lines.every((l, i) => same(l, cliLines[i], i)),
      "2b the screen's table is the command line's, line for line ("
      + screen.lines.length + " against " + cliLines.length + "):\n       "
      + screen.lines.join("\n       ") + "\n       ---\n       " + cliLines.join("\n       "));

    check(/declared/.test(screen.lines[0]) && /not computed/.test(screen.lines[0]),
      "2c the period column is marked declared and not computed: "
      + JSON.stringify(screen.lines[0]));

    /* TEAM FIGURES ONLY (decisions 2026-09-23 02:08). What the desks copied, searched for and
       missed is read here off the screen's team table, which is the command line's "all desks"
       block, and summed again here from the two answers this leg sealed. */
    const teamCli = (cliBlocks(cli.stdout).find(b => /^all desks: /.test(b[0])) || []).slice(1);
    const team = String(screen.team[1] || "").split("\t");
    const sent = [S1.tallow, S1.wicker];
    const uses = sent.reduce((n, d) => n + (d.cards || []).reduce((m, c) => m + (c.n | 0), 0), 0);
    const misses = sent.reduce((n, d) => n + (d.misses | 0), 0);
    /* THE SAME FIGURES AS THE COMMAND LINE'S "all desks" BLOCK: the head and the two counts cell
       for cell, and the two lists as one figure a line, the same pairs in the same order. */
    const cliTeam = String(teamCli[1] || "").split("\t");
    const asLines = (cell, sep, fold) => cell === "-" ? [] : cell.split(sep)
      .map(x => fold(x));
    const intentLines = asLines(cliTeam[1] || "-", ",", x => x.replace(/:(\d+)$/, " $1"));
    const langLines = asLines(cliTeam[3] || "-", " ",
      x => x.replace(/^([^=]+)=(\d+)$/, (m, c, n) => c.toUpperCase() + " " + n));
    check(screen.team.length === 2 && screen.team[0].toLowerCase() === teamCli[0]
          && team[0] === cliTeam[0] && team[2] === cliTeam[2]
          && JSON.stringify(screen.teamLines[1]) === JSON.stringify(intentLines)
          && JSON.stringify(screen.teamLines[3]) === JSON.stringify(langLines)
          && team[0] === String(uses) && team[2] === String(misses) && uses > 4,
      "2d the team's table sums the two answers and is the command line's: uses " + team[0]
      + " for " + uses + " sent, misses " + team[2] + " for " + misses + "; "
      + JSON.stringify(screen.team) + " against " + JSON.stringify(teamCli));

    /* NO DESK'S ROW CARRIES A COUNT OF USE OR ITS SYNC (board 891's C1): the head has the five
       columns, no card, intent or language of either answer is in the table, and neither desk's
       sync is, while the team's table carries the planted intent. */
    const perDesk = screen.lines.join("\n");
    const syncs = sent.map(d => String(d.sync));
    check(screen.lines[0].split("\t").length === 5
          && !/c-plant|i-plant|en=4/.test(perDesk) && syncs.every(s => perDesk.indexOf(s) < 0)
          && !/\bsync\b/i.test(screen.lines[0])
          && (screen.teamLines[1] || []).indexOf("i-plant-one 2") >= 0
          && (screen.teamLines[3] || []).some(l => /^EN \d+$/.test(l)),
      "2g no desk's row carries a count of use or its sync, and the team's table carries the counts:"
      + "\n       " + screen.lines.join("\n       ") + "\n       team " + JSON.stringify(screen.teamLines));

    /* THE TEAM'S NEWEST TIME IS ON THE LIVE LINE, AND IT IS THE ONLY TIME. */
    const newestSync = syncs.slice().sort().pop();
    check(screen.folder === share && screen.num === String(cliLines.length - 1)
          && /Live from 2 (?:desks|teammates), as of /.test(screen.where)
          && screen.where.indexOf(newestSync) >= 0,
      "2e it says which folder it read, the rail says how many desks answered, and the live line"
      + " gives the team's newest time: " + JSON.stringify(screen.folder) + ", "
      + JSON.stringify(screen.num) + ", " + JSON.stringify(screen.where));

    /* A ROSTER DESK WITH NOTHING NEW IS NAMED ON BOTH DOORS AND COUNTED IN NEITHER TABLE. */
    const cliQuiet = cliBlocks(cli.stdout).find(b => /^no new figures: /.test(b[0])) || [];
    check(screen.quiet.length === 1 && screen.quiet[0] === "No new figures from Ember lamp since -."
          && cliQuiet.join("\n") === "no new figures: 1\nEmber lamp"
          && screen.lines.every(l => l.indexOf("Ember") < 0 && l.indexOf(EMBER.id) < 0),
      "2h the roster desk with no answer is named on the screen and by the command line, and is no"
      + " row: " + JSON.stringify(screen.quiet) + ", " + JSON.stringify(cliQuiet));

    /* THE LAST COLUMNS, THE PERIOD AND ITS FIRST COUNTED DAY, MUST BE READ, so where their
       right edge lands is a measurement rather than a matter of taste. Nine columns with the
       cells refusing to wrap wanted 1350px of a 1038px pane when this section landed, and the
       header's right edge sat at x=1597 against the pane's x=1285: the whole period column,
       "declared, not computed" included, was off the screen with no scrollbar to reach it. */
    const fit = await page.evaluate(() => {
      const t = document.querySelector("#main table.desks");
      const pane = t.closest(".pane");
      return {
        table: t.scrollWidth, pane: pane.clientWidth,
        last: Math.round(t.querySelectorAll("tr")[0].lastElementChild.getBoundingClientRect().right),
        paneRight: Math.round(pane.getBoundingClientRect().right),
      };
    });
    check(fit.last <= fit.paneRight && fit.table <= fit.pane,
      "2f the last column ends inside the pane: x=" + fit.last + " against the pane's x="
      + fit.paneRight + ", table " + fit.table + "px of " + fit.pane);

    /* ---- 3. A SIGNED EXTRA KEY IS COUNTED; ANOTHER FORMAT IS REFUSED ---------------------- */

    /* Cinder is on the roster, signs its own answer and seals it to the box, so it opens and is
       genuine. A key nobody ruled, inside format 1, is left out of the verdict (updates 4,
       2026-11-01; tests/stats-read.mjs 1c): the desk is a row, the key is on no line, and the
       command line exits 0. Before that day the whole file was refused, which is what 3a to 3c
       used to require, and what dropped a newer desk's answer. */
    seal(share, S1.team, CINDER, Object.assign({}, S1.tallow, {
      desk: "dtest-cinder", agent: "a name a desk may not send" }));

    await press('[data-act="section"][data-v="archive"]', 700);
    await press('[data-act="section"][data-v="stats"]', 1200);
    /* The row is the fresh read. screen === "stats" is already true of the visit this leaves,
       so waiting on that would accept the table from before the file was sealed. */
    await settleOn(page, 'Array.from(document.querySelectorAll("#main table.desks tr")).some(tr =>'
      + ' tr.textContent.indexOf("dtest-cinder") >= 0)', { bound: 30000 });
    const after = await page.evaluate(() => ({
      refused: Array.from(document.querySelectorAll("#main .refused")).map(d => d.textContent),
      lines: Array.from(document.querySelectorAll("#main table.desks tr"))
        .map(tr => Array.from(tr.children).map(c => c.textContent).join("\t")),
    }));
    const agentOnScreen = after.refused.some(d => d.indexOf("agent") >= 0)
      || after.lines.some(l => l.indexOf("agent") >= 0);
    check(after.refused.length === 0 && !agentOnScreen
          && after.lines.some(l => l.indexOf("dtest-cinder") >= 0),
      "3a a signed answer with an extra key is a row, and the screen does not name that key: "
      + JSON.stringify(after.refused));
    const cliNow = readCli(dir);
    const nowLines = cliBlocks(cliNow.stdout)[0];
    check(cliNow.status === 0
          && after.lines.length === nowLines.length
          && after.lines.length === cliLines.length + 1
          && after.lines.every((l, i) => same(l, nowLines[i], i))
          && after.lines.some(l => l.indexOf("dtest-cinder") >= 0),
      "3b and the table is the command line's, one row more than before ("
      + after.lines.length + " against " + nowLines.length + ", exit " + cliNow.status + ")");

    /* polish 04, item 17, on an answer that is counted: the extra key is not painted, so it
       cannot push #main, and no figure says the file was left out. */
    const side = await page.evaluate(() => {
      const m = document.querySelector("#main");
      return { sw: m.scrollWidth, cw: m.clientWidth,
        said: /Answers Studio could not read, and which no figure below counts: 1\./
          .test(m.textContent.replace(/\u00a0/g, " ")) };
    });
    check(side.sw <= side.cw && !side.said,
      "3b2 and it neither pushes the screen sideways (" + side.sw + " in " + side.cw + ") nor"
      + " is said to leave one file out: " + side.said);

    check(cliNow.status === 0 && /dtest-cinder/.test(cliNow.stdout)
          && !/agent/.test(String(cliNow.stdout) + String(cliNow.stderr)),
      "3c the command line counts the same project, exit " + cliNow.status + ": "
      + String(cliNow.stderr || cliNow.stdout || "").trim().replace(/\s+/g, " ").slice(0, 160));

    /* A FORMAT OTHER THAN 1 IS STILL REFUSED (tests/stats-live-studio.mjs u4b). The same desk,
       overwritten: the screen names the folder and the format, the row is gone, the figures say
       one file was left out, and the command line exits 1. */
    seal(share, S1.team, CINDER, Object.assign({}, S1.tallow, {
      desk: "dtest-cinder", format: 2 }));
    await press('[data-act="section"][data-v="archive"]', 700);
    await press('[data-act="section"][data-v="stats"]', 1200);
    await settleOn(page, 'Array.from(document.querySelectorAll("#main .refused")).some(d =>'
      + ' d.textContent.indexOf("(format 2)") >= 0)', { bound: 30000 });
    const fmt = await page.evaluate(() => ({
      refused: Array.from(document.querySelectorAll("#main .refused")).map(d => d.textContent),
      lines: Array.from(document.querySelectorAll("#main table.desks tr"))
        .map(tr => Array.from(tr.children).map(c => c.textContent).join("\t")),
    }));
    const namedFmt = fmt.refused.filter(d => d.indexOf(CINDER.id) >= 0 && d.indexOf("(format 2)") >= 0);
    check(namedFmt.length === 1 && fmt.refused.length === 1,
      "3d the screen names a format it does not read by the desk's folder: "
      + JSON.stringify(fmt.refused));
    check(fmt.lines.every(l => l.indexOf("dtest-cinder") < 0)
          && fmt.lines.length === cliLines.length
          && fmt.lines.every((l, i) => same(l, cliLines[i], i)),
      "3e and it is not a row, and the table is as it was (" + fmt.lines.length + " line(s)):\n       "
      + fmt.lines.join("\n       "));
    const sideFmt = await page.evaluate(() => {
      const m = document.querySelector("#main");
      return { sw: m.scrollWidth, cw: m.clientWidth,
        said: /Answers Studio could not read, and which no figure below counts: 1\./
          .test(m.textContent.replace(/\u00a0/g, " ")) };
    });
    check(sideFmt.sw <= sideFmt.cw && sideFmt.said,
      "3f and the refusal neither pushes the screen sideways (" + sideFmt.sw + " in "
      + sideFmt.cw + ") nor goes uncounted: the answers are said to leave one file out, "
      + sideFmt.said);
    const cliFmt = readCli(dir);
    check(cliFmt.status === 1 && String(cliFmt.stderr).indexOf(CINDER.id) >= 0
          && String(cliFmt.stderr).indexOf("(format 2)") >= 0,
      "3g the command line refuses the format, exit " + cliFmt.status + ": "
      + String(cliFmt.stderr || "").trim().replace(/\s+/g, " ").slice(0, 160));

    /* ---- 5. THE FOUR AGGREGATE VIEWS (M2, off the deferred shelf 2026-09-16 16:08) ----------
     *
     * The second project, four answers, two editions, opened from the project list.
     */
    await press('[data-act="to-projects"]', 900);
    await pressWhen(page, '[data-act="open"]', { who: "tests/stats-screen.mjs", attr: ["data-dir", V.dir] });
    await sleep(700);
    await press('[data-act="section"][data-v="stats"]', 1200);
    await press('[data-act="stats-view"][data-v="every"]', 500);   /* the second project's own view, In words until chosen */

    const cli2 = readCli(V.dir);
    const blocks = cliBlocks(cli2.stdout);
    const titled = {};
    blocks.slice(1).forEach(b => { titled[String(b[0]).split(":")[0].split(" after")[0]] = b; });
    const blocks5 = statBlocksHeld(titled);
    check(cli2.status === 0 && blocks5.ok,
      "5a the command line prints the desks' table, the team's, the views and the desks with nothing"
      + " new over this project and its share"
      + (blocks5.missing.length ? ", missing " + blocks5.missing.join(", ") : "")
      + ": exit " + cli2.status + ", " + blocks.length + " block(s), "
      + JSON.stringify(blocks.slice(1).map(b => b[0]))
      + (cli2.status === 0 ? "" : ": " + String(cli2.stderr).trim()));

    const seen = await page.evaluate(() => ({
      tables: Array.from(document.querySelectorAll("#main table.view")).map(t =>
        Array.from(t.querySelectorAll("tr")).map(tr =>
          Array.from(tr.children).map(c => c.textContent).join("\t"))),
      /* The id column moved last (board 976). The cell shows the short form; its title is the
         whole id, which is what the command line printed first. */
      fullIds: Array.from(document.querySelectorAll("#main table.view")).map(t =>
        Array.from(t.querySelectorAll("tr")).slice(1).map(tr =>
          (tr.lastElementChild && tr.lastElementChild.getAttribute("title")) || "")),
      tiles: Array.from(document.querySelectorAll("#main [data-tile]")).map(d => [
        d.getAttribute("data-tile"),
        ((d.querySelector(".v") || {}).textContent || ""),
        ((d.querySelector(".k") || {}).textContent || "")]),
      said: Array.from(document.querySelectorAll("#main .pane .lede")).map(p => p.textContent),
      heads: Array.from(document.querySelectorAll("#main .pane h3")).map(h => h.textContent),
    }));

    /* THE TWO LISTS, LINE FOR LINE, head included. A comparison of one cell would pass with the
       screen dropping the desks column or rounding a count; these are the command line's own
       lines with the tabs put back, exactly as leg 2b compares the desks' table. */
    const wantTop = (titled["most used"] || []).slice(1);
    const wantRot = (titled["nobody used"] || []).slice(1);
    const lists5 = statListsHeld(seen.tables, seen.fullIds, wantTop, wantRot);
    check(lists5.ok,
      "5b the lists on the screen are the command line's, line for line"
      + (lists5.missing.length ? ", missing " + lists5.missing.join(", ") : "")
      + " ("
      + seen.tables.map(t => t.length).join(" and ") + " against " + wantTop.length + " and "
      + wantRot.length + "):\n       " + seen.tables.map(t => t.join("\n       ")).join("\n       ")
      + "\n       ---\n       " + wantTop.concat(wantRot).join("\n       "));

    /* AND EVERY TILE IS ITS OWN LINE OF THE COMMAND LINE'S, BY ITS KEY. The keys are the tool's
       own words, so a tile the screen invents has nothing to be compared against and is caught
       by the count rather than by the values. */
    const cliRow = {};
    ["coverage", "adoption"].forEach(k => (titled[k] || []).slice(1).forEach(l => {
      const at = l.indexOf("\t");
      cliRow[l.slice(0, at)] = l.slice(at + 1);
    }));
    const odd = seen.tiles.filter(([k, v]) => cliRow[k] !== v);
    check(seen.tiles.length === 10 && odd.length === 0,
      "5c all " + seen.tiles.length + " tiles carry the command line's own figure under the"
      + " command line's own key" + (odd.length ? ": " + JSON.stringify(odd) : ": "
        + JSON.stringify(seen.tiles.map(t => t[0] + "=" + t[1]))));

    /* ---- THE SAME FOUR VIEWS, COMPUTED HERE ------------------------------------------------
     *
     * From the answers and not from the module: the answers are the ones this leg sealed, the
     * cards are read off the draft, and each card's publication off the archive's own folder
     * names, oldest first. A second call into viewsOf would agree with it however wrong it was.
     */
    const estats = V.answers;
    const draft = JSON.parse(fs.readFileSync(path.join(V.dir, DRAFT_FILE), "utf8"));
    const archDir = path.join(V.dir, ARCHIVE);
    const eds = fs.readdirSync(archDir).sort();
    const bornAt = {};
    let newestRev = 0;
    eds.forEach(ed => {
      const cat = JSON.parse(fs.readFileSync(path.join(archDir, ed, CATALOG_IN_ARCHIVE), "utf8"));
      newestRev = +cat.rev || 0;
      (cat.cards || []).forEach(c => {
        if (!Object.prototype.hasOwnProperty.call(bornAt, c.id)) bornAt[c.id] = ed.slice(0, 10);
      });
    });
    /* A USE COUNTS FOR THE PERIOD ONLY WHERE THE ANSWER PLACES IT THERE: every card of an answer
       carrying `since`, and a card of a lifetime answer whose last copy `at` is inside its
       period. A lifetime card with no `at`, or one after the period, cannot be placed. */
    const mineUses = {}, mineDesks = {}, rankUses = {}, rankDesks = {};
    const placed = new Set(), unplaced = new Set();
    estats.forEach(d => (d.cards || []).forEach(c => {
      if ((c.n | 0) <= 0) return;
      mineUses[c.id] = (mineUses[c.id] | 0) + (c.n | 0);
      mineDesks[c.id] = (mineDesks[c.id] | 0) + 1;
      if (d.since) {
        rankUses[c.id] = (rankUses[c.id] | 0) + (c.n | 0);
        rankDesks[c.id] = (rankDesks[c.id] | 0) + 1;
      }
      if (d.since || (c.at && c.at >= d.period.from && c.at <= d.period.to)) placed.add(c.id);
      else if (!c.at || c.at > d.period.to) unplaced.add(c.id);
    }));
    const began = estats.map(d => d.period.from).sort()[0];
    let mineUsed = 0, mineRot = 0, mineNot = 0;
    const rotIds = [];
    (draft.cards || []).forEach(c => {
      if (placed.has(c.id)) { mineUsed += 1; return; }
      if (unplaced.has(c.id)) { mineNot += 1; return; }
      if (!bornAt[c.id] || bornAt[c.id] > began) { mineNot += 1; return; }
      mineRot += 1; rotIds.push(String(c.id));
    });
    let mineOn = 0, mineBehind = 0, mineOther = 0;
    estats.forEach(d => {
      if (!d.catalog || !d.catalog.id) { mineOther += 1; return; }
      if (d.catalog.id !== draft.id) { mineOther += 1; return; }
      if ((+d.catalog.rev || 0) === newestRev) mineOn += 1; else mineBehind += 1;
    });
    const tile = (k) => (seen.tiles.find(t => t[0] === k) || [])[1];
    check(tile("cards") === String((draft.cards || []).length)
          && tile("used") === String(mineUsed) && tile("rotting") === String(mineRot)
          && tile("not judged") === String(mineNot)
          && mineUsed + mineRot + mineNot === (draft.cards || []).length,
      "5d coverage is what this leg counts off the answers: " + (draft.cards || []).length
      + " cards, " + mineUsed + " used, " + mineRot + " rotting, " + mineNot + " not judged,"
      + " against the screen's " + [tile("cards"), tile("used"), tile("rotting"),
        tile("not judged")].join("/") + "; the three add up to the first");
    check(tile("on the newest") === String(mineOn) && tile("on an older one") === String(mineBehind)
          && tile("on another catalog") === String(mineOther) && mineOn + mineBehind + mineOther
            === estats.length,
      "5e adoption of rev " + newestRev + " over " + estats.length + " answers: " + mineOn
      + " on it, " + mineBehind + " behind, " + mineOther + " on another catalog, against the"
      + " screen's " + [tile("on the newest"), tile("on an older one"), tile("on a newer one"),
        tile("on another catalog")].join("/"));

    /* A DESK THAT NEVER ANSWERED MUST NOT DRAG A CARD INTO ROTTING, and the card that holds it
       is used by ONE desk of the four: the others say nothing about it, and saying nothing is
       not saying nought. Its use count is also checked, because a card in neither list would
       pass the absence half of this on its own. */
    const alone = Object.keys(rankUses).filter(id => rankDesks[id] === 1)[0];
    const topIds = (seen.fullIds && seen.fullIds[0]) || [];
    const rotShown = (seen.fullIds && seen.fullIds[1]) || [];
    /* THE LIST IS CUT AT TEN AND THE COUNT IS NOT, so absence from the rows is not absence from
       the view: the title's own total is read as well. Without it a card falling into rotting
       past the tenth row would pass this leg. */
    const rotAll = Number(String((titled["nobody used"] || [""])[0]).replace(/^.* of /, ""));
    check(!!alone && rotShown.indexOf(alone) < 0 && topIds.indexOf(alone) >= 0
          && rotAll === mineRot
          && estats.filter(d => (d.cards || []).some(c => c.id === alone)).length === 1
          && estats.length === 4,
      "5f the card one desk of " + estats.length + " uses is in the most-used list and in"
      + " neither the rotting rows nor its total (" + rotAll + " against " + mineRot + "): "
      + JSON.stringify(alone));

    /* A CARD YOUNGER THAN THE WINDOW IS EXCLUDED AND SAID TO BE. The second edition carries one
       card the first did not, published after the day the desks' period began; it is unused, so
       only the age rule keeps it out of the rotting list, and dropping that rule would move both
       of these numbers at once. */
    const young = (draft.cards || []).map(c => String(c.id))
      .filter(id => bornAt[id] && bornAt[id] > began);
    const undated = Array.from(unplaced).filter(id => !placed.has(id));
    check(young.length === 1 && !mineUses[young[0]] && rotIds.indexOf(young[0]) < 0
          && undated.length === 1 && tile("not judged") === "2"
          && ((seen.fullIds && seen.fullIds[1]) || []).indexOf(young[0]) < 0,
      "5g the card first published on " + (bornAt[young[0]] || "?") + ", after the window began"
      + " on " + began + ", is not judged rather than rotting: " + JSON.stringify(young)
      + "; beside it the card a lifetime answer copied on no stated day: "
      + JSON.stringify(undated));

    /* AND THE SCREEN SAYS WHAT THE FIGURES DO NOT KNOW. Four true numbers over an unknown number
       of desks is a lie told with true numbers, so the count of answers, the newest of them and
       the sentence about a desk that has not answered are read off the screen itself. */
    const newest = estats.map(d => String(d.sync).slice(0, 10)).sort().pop();
    const trust = seen.said.filter(l => l.indexOf(String(estats.length)) >= 0
      && l.indexOf(newest) >= 0 && /has not answered/.test(l));
    check(trust.length === 1 && seen.said.some(l => l.indexOf(began) >= 0),
      "5h the screen says how many desks answered, how recent they are and that a silent desk is"
      + " not counted: " + JSON.stringify(trust) + "; the declared period " + began
      + (seen.said.some(l => l.indexOf(began) >= 0) ? " is said too" : " IS NOT SAID"));

    /* AND HOW THE ANSWERS WERE COUNTED, ON BOTH DOORS. d-delta began counting a week after the
       period's first day, and the three handwritten answers carry lifetime counts: a partial
       count shown as the whole period is the failure, so the screen names both and the command
       line's answers block carries the same figures. */
    const ans = {};
    (titled.answers || []).slice(1).forEach(l => {
      const at = l.indexOf("\t");
      ans[l.slice(0, at)] = l.slice(at + 1);
    });
    const lateSaid = seen.said.filter(l => l.indexOf("Answers counted from a day later than "
      + began + ": 1, the latest from 2026-09-12.") >= 0);
    const lifeSaid = seen.said.filter(l => l.indexOf("rather than the period's: 3.") >= 0);
    check(lateSaid.length === 1 && lifeSaid.length === 1
          && ans["answers counted from a later day"] === "1"
          && ans["latest day counting began"] === "2026-09-12"
          && ans["answers counted since the desk began"] === "3",
      "5j the screen says one answer was counted from the 12th and three for the desk's whole"
      + " life, and the command line says the same: " + JSON.stringify(ans));

    /* THE MOST-USED LIST SPEAKS FOR THE PERIOD. Three of the four answers carry lifetime counts,
       whose n holds copies from before it, so only d-delta's cards are ranked, by this leg's own
       count off the answers, and both doors say three answers were left out. */
    const wantRank = Object.keys(rankUses)
      .sort((a, b) => rankUses[b] - rankUses[a] || (a < b ? -1 : a > b ? 1 : 0));
    const lifetime = estats.filter(d => !d.since).length;
    const leftSaid = seen.said.filter(l => l.indexOf(": " + lifetime + ".") >= 0
      && /left out/i.test(l));
    check(topIds.join() === wantRank.slice(0, 10).join() && wantRank.length >= 1
          && lifetime === 3
          && /^most used: \d+ of \d+ \(answers counted since the desk began, left out: 3\)$/
            .test(String((titled["most used"] || [""])[0]))
          && leftSaid.length === 1,
      "5k only answers counted by day rank the cards (" + topIds.join() + " against "
      + wantRank.join() + "), and both doors say " + lifetime + " were left out: "
      + JSON.stringify((titled["most used"] || [""])[0]) + ", " + JSON.stringify(leftSaid));

    /* THE TWO LISTS FIT THE PANE THEY SIT IN, the measurement leg 2f makes of the desks' table
       and for the same reason: a card id is one unbroken token as long as whoever imported the
       catalog made it, and a table that will not wrap pushes its last column off the screen with
       no scrollbar to reach it. */
    const fit2 = await page.evaluate(() => Array.from(
      document.querySelectorAll("#main table.view")).map(t => {
        const pane = t.closest(".pane");
        return { table: t.scrollWidth, pane: pane.clientWidth,
          last: Math.round(t.querySelectorAll("tr")[0].lastElementChild
            .getBoundingClientRect().right),
          paneRight: Math.round(pane.getBoundingClientRect().right) };
      }));
    check(fit2.length === 2 && fit2.every(f => f.last <= f.paneRight && f.table <= f.pane),
      "5i both lists end inside their pane: " + JSON.stringify(fit2));

    /* A CUT LIST OPENS WHOLE AND CLOSES AGAIN (polish 04, item 6): the rows under Show all are
       the whole count the title gives, and the sentence under the list says so. */
    const listed = () => page.evaluate(() => {
      const t = document.querySelectorAll("#main table.view")[1];
      const pane = t.closest(".pane");
      return { rows: t.querySelectorAll("tr").length - 1,
        more: (pane.querySelector('[data-act="stats-more"]') || {}).textContent || "",
        said: (pane.querySelector(".lede") || {}).textContent || "" };
    });
    const cutAt = await listed();
    await press('#main [data-act="stats-more"][data-v="rotting"]', 600);
    await settleOn(page, '((document.querySelectorAll("#main table.view")[1] || {}).closest?.(".pane")?.querySelector(".lede") || {}).textContent?.indexOf("Showing") >= 0', { bound: 30000 });
    const whole = await listed();
    await press('#main [data-act="stats-more"][data-v="rotting"]', 600);
    await settleOn(page, '((document.querySelectorAll("#main table.view")[1] || {}).querySelectorAll?.("tr") || []).length - 1 === 10', { bound: 30000 });
    const again = await listed();
    check(rotAll > 10 && cutAt.rows === 10 && whole.rows === rotAll && again.rows === 10
          && whole.said.indexOf("Showing " + rotAll + " of " + rotAll + ".") === 0
          && /Show all/.test(cutAt.more),
      "5l the list nobody used shows " + cutAt.rows + " of " + rotAll + " with " + JSON.stringify(cutAt.more)
      + ", all " + whole.rows + " once pressed (" + JSON.stringify(whole.said.slice(0, 22))
      + "), and " + again.rows + " again after");
  } finally {
    await studio.shut();
  }
  await sleep(400);

  if (!keep) dropScratch(SCRATCH, "stats-screen");
  process.stdout.write("stats-screen  " + asserted + " assertion(s), " + failed + " failure(s)\n");
  process.exit(failed ? 1 : 0);
}

main(process.argv.slice(2)).catch(e => {
  process.stderr.write("stats-screen  " + (e && e.stack ? e.stack : String(e)) + "\n");
  process.exit(2);
});
