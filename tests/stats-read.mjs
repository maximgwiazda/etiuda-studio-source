/* ONE LEG PER PROMISE THE STATISTICS READER MAKES, OVER LIVE ANSWERS (board 891's C3).
 *
 *     node tests/stats-read.mjs [--keep]
 *
 * Each desk writes desks/<branch id>/stats.estat, signed by its own key and sealed to the lead's box;
 * `node tools/stats-read.mjs <project> --key <file>` opens them through statsFor, as the Statistics
 * screen does, and prints one row per desk with the period marked declared and not computed, the
 * day each desk began counting, the team's figures, the four views and the roster desks with nothing
 * new. A signed answer carrying a key outside the ruled nouns is read by the nouns it has, the rest left out of the verdict
 * (updates 4, 2026-11-01); one the reader opens without the desk's signature, sections 3 and 4, is still refused for it. The
 * fixtures are throwaway projects, keys and desks made here; every desk key comes from a fixed seed,
 * so its branch id is the one its key makes, and it signs its answer as a desk does. Sections 3 and
 * 4 hold the reader's own rules over sealed answers, opened here with the lead's box; that the
 * screen counts only an answer the roster's key signed is tests/stats-live-studio.mjs's 891sk.
 *
 * No window. The tables on the screen are held to this tool's output by tests/stats-screen.mjs.
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync as nodeCmd } from "node:child_process";
import { fileURLToPath } from "node:url";
import * as Engine from "../src/engine.mjs";
import * as Studio from "../src/studio.mjs";
import { makeKeyFile, readKeyFile, unlockKey, openLeadBox } from "../src/sign.mjs";
import { newTeam, withDesk, writeTeam } from "../src/team.mjs";
import { jsonText } from "../src/plain-json.mjs";
import { emitter, answerFrom } from "./desk-emitter.mjs";
import { readStats, rowOf, HEAD, viewsOf, viewBlocks, teamOf, writeSpan } from "../src/stats.mjs";
import { clearScratch, dropScratch } from "./scratch.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const SCRATCH = path.join(ROOT, "scratch", "stats-read-legs");
const TOOL = path.join(ROOT, "tools", "stats-read.mjs");
const EXPECTED = 29;
const PASS = "Brindle quarvy lantern for the reading door";
const WRONG = "Not the lantern words";
/* Every stream a run of the tool wrote, and the passphrase files this leg wrote itself, for 5a. */
const STREAMS = [], PASS_FILES = [];

let asserted = 0, failed = 0;
function check(cond, line) {
  asserted++;
  if (cond) process.stdout.write("  ok   " + line + "\n");
  else { failed++; process.stderr.write("  FAIL " + line + "\n"); }
}

/* A desk's key from a fixed seed, and the branch id that key makes (the engine's branchIdOf). */
const PKCS8_ED25519 = Buffer.from("302e020100300506032b657004220420", "hex");
function deskPair(fill) {
  const priv = crypto.createPrivateKey({ key: Buffer.concat([PKCS8_ED25519, Buffer.alloc(32, fill)]), format: "der", type: "pkcs8" });
  const key = crypto.createPublicKey(priv).export({ type: "spki", format: "der" }).subarray(-32).toString("hex");
  return { id: "k-" + crypto.createHash("sha256").update(Buffer.from(key, "hex")).digest("hex").slice(0, 16), key, priv };
}

/* A project publishing to its own share, the lead's key beside it, and a team of `desks` ([pair, roster name]) written
   to the share under that key, which mints the lead's box into the key file and the signed team file. */
async function led(name, desks, o) {
  const base = path.join(SCRATCH, name);
  const root = path.join(base, "projects"), share = path.join(base, "share");
  fs.mkdirSync(root, { recursive: true });
  fs.mkdirSync(share, { recursive: true });
  const made = await Studio.newProject(root, "Lantern stall", [{ code: "en", name: "English" }]);
  await Studio.setPublishFolder(made.dir, share);
  const keyAt = path.join(base, "lead-key.json");
  const lead = await makeKeyFile({ passphrase: PASS });
  fs.writeFileSync(keyAt, JSON.stringify(lead, null, 1) + "\n");
  let team = newTeam({ catalogs: ["lantern-stall"], lead: { keyId: lead.keyId, public: lead.public } });
  for (const [p, label] of desks) team = withDesk(team, { id: p.id, key: p.key, box: crypto.randomBytes(32).toString("hex") }, label);
  const wrote = await writeTeam(share, team, { key: keyAt, passphrase: PASS });
  if (o && o.quiet) for (const p of o.quiet) fs.mkdirSync(path.join(share, "desks", p.id), { recursive: true });
  return { base, dir: made.dir, share, keyAt, team: wrote.team, roster: desks.map(([p]) => p.id) };
}

/* The answer as the engine's writeStatsAnswer makes it: the desk's signature over the answer inside the seal, then
   sealed to the lead's box into the desk's own folder. `by` signs in place of the folder's own desk. */
function seal(g, pair, obj, by) {
  const inner = Object.assign({}, obj, { sig: { alg: "Ed25519", keyId: pair.id } });
  inner.sig.value = crypto.sign(null, Engine.statsRules().statsAnswerSignedBytes(inner), (by || pair).priv).toString("hex");
  const env = Engine.statsRules().sealStatsLead(g.team.lead.box, g.team.id, g.team.lead.keyId, pair.id, JSON.stringify(inner));
  const dir = path.join(g.share, "desks", pair.id);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "stats.estat"), jsonText(env));
  return inner;
}

/* The share read as the module reads it, with the lead's box opened here from the key file. */
function readLiveAt(g) {
  const read = readKeyFile(g.keyAt);
  const box = openLeadBox(read, unlockKey(read, PASS));
  return readStats(g.share, { roster: g.roster, open: (doc, id) => Engine.statsRules().openStatsSealed(box.secretKey, doc, id) });
}

function pinSpan(g, token) {
  writeSpan(g.share, token, unlockKey(readKeyFile(g.keyAt), PASS));
}
function runRead(g, o) {
  const argv = [TOOL, g.dir];
  if (!(o && o.noKey)) argv.push("--key", (o && o.key) || g.keyAt);
  if (o && o.passFile) argv.push("--passphrase-file", o.passFile);
  if (o && o.passArg !== undefined) argv.push("--passphrase", o.passArg);
  const env = Object.assign({}, process.env);
  delete env.STUDIO_KEY_PASSPHRASE;
  if (!(o && o.noPass)) env.STUDIO_KEY_PASSPHRASE = (o && o.pass) || PASS;
  const run = nodeCmd(process.execPath, argv, { cwd: ROOT, encoding: "utf8", env });
  STREAMS.push(String(run.stdout || ""), String(run.stderr || ""));
  return run;
}
const blocksOf = (stdout) => String(stdout || "").replace(/\n$/, "").split("\n\n").map((b) => b.split("\n"));

function answer(desk, extra) {
  return Object.assign({
    format: 1, kind: "etiuda-statistics", desk, engine: "2.0.0-dev",
    period: { from: "2026-09-01", to: "2026-09-17" }, sync: "2026-09-17 13:00",
    cards: [{ id: "c-seed-one", n: 3, at: "2026-09-17" }, { id: "c-seed-two", n: 1 }],
    intents: [{ id: "i-seed-one", n: 2 }], misses: 5, langs: { en: 4, pl: 2 },
    catalog: { id: "lamp-shop", rev: 2 }, hash: "djb2:0",
  }, extra || {});
}

/* ---- SECTIONS 1 AND 2: THE COMMAND LINE ---------------------------------------------------------------------------- */

async function lineLegs() {
  const T = deskPair(0x61), W = deskPair(0x62), E = deskPair(0x63);
  const g = await led("line", [[T, "Tallow lamp"], [W, "Wicker lamp"], [E, "Ember lamp"]], { quiet: [E] });
  const tallow = seal(g, T, answer("dtest-tallow"));
  const wicker = seal(g, W, answer("dtest-wicker", {
    cards: [{ id: "c-seed-one", n: 2, at: "2026-09-16" }], intents: [{ id: "i-seed-one", n: 1 }, { id: "i-seed-two", n: 1 }],
    misses: 1, langs: { en: 2 }, catalog: { id: "lamp-shop", rev: 1 }, sync: "2026-09-16 08:00", since: "2026-09-03" }));
  /* A plain file under the old stats/ folder, beside the live answers: nothing reads it. */
  fs.mkdirSync(path.join(g.share, "stats"), { recursive: true });
  fs.writeFileSync(path.join(g.share, "stats", "dtest-stale.estat"), JSON.stringify(answer("dtest-stale")), "utf8");
  pinSpan(g, "range-2026-09-01-2026-09-17");

  const good = runRead(g);
  const blocks = blocksOf(good.stdout);
  const table = blocks[0] || [];
  check(good.status === 0 && /declared/.test(table[0] || "") && /not computed/.test(table[0] || ""),
    "1a the header marks the period declared and not computed, exit " + good.status
    + (good.status ? ": " + String(good.stderr).trim().slice(0, 200) : ""));

  /* A DESK'S ROW IS ITS EDITION AND ITS DECLARED PERIOD, NOTHING THAT COUNTS USE AND NOT ITS SYNC (decisions 2026-09-23
     02:08; board 891's C1): written out here, in the folders' order, rather than built by rowOf. */
  const want = [["desk", "catalog", "rev", "period (declared, not computed)", "since"].join("\t")]
    .concat([[T.id, ["dtest-tallow", "lamp-shop", "2", "2026-09-01..2026-09-17", "-"]],
      [W.id, ["dtest-wicker", "lamp-shop", "1", "2026-09-01..2026-09-17", "2026-09-03"]]]
      .sort((a, b) => (a[0] < b[0] ? -1 : 1)).map(([, cells]) => cells.join("\t")));
  check(good.status === 0 && table.join("\n") === want.join("\n")
        && !/c-seed|i-seed|en=4|13:00|08:00|dtest-stale/.test(table.join("\n")),
    "1b one row per desk that answered: desk, catalog, rev, the period as declared and since, and no count, no sync, and"
    + " nothing from the old stats/ folder: " + JSON.stringify(table));

  const team = blocks.find((b) => /^all desks: /.test(b[0])) || [];
  const uses = [tallow, wicker].reduce((n, d) => n + d.cards.reduce((m, c) => m + c.n, 0), 0);
  check(team.join("\n") === ["all desks: 2", "uses\tintents\tmisses\tlangs",
          uses + "\ti-seed-one:3,i-seed-two:1\t" + (tallow.misses + wicker.misses) + "\ten=6 pl=2"].join("\n") && uses === 6,
    "1d the counts the two desks sent are printed as the team's, summed: " + JSON.stringify(team));

  /* THE ROSTER DESK WITH NOTHING NEW IS NAMED, BY ITS ROSTER NAME, AND IS NOT A ROW. */
  const last = blocks[blocks.length - 1] || [];
  check(last.join("\n") === "no new figures: 1\nEmber lamp" && table.every((l) => l.indexOf("Ember") < 0 && l.indexOf(E.id) < 0),
    "2d a roster desk with no answer is named in the last block by its roster name and is no row: " + JSON.stringify(last));

  /* THE BOX IS THE DOOR. Without the key, with the wrong passphrase, or with a key that leads no team in the folder,
     nothing opens and nothing is printed. */
  const bare = runRead(g, { noKey: true });
  check(bare.status === 2 && /--key/.test(bare.stderr) && !String(bare.stdout),
    "2a without the lead's key the command line opens nothing, names --key and exits 2: exit " + bare.status);
  const wrong = runRead(g, { pass: WRONG });
  check(wrong.status === 2 && !String(wrong.stdout) && /passphrase is wrong/.test(String(wrong.stderr)),
    "2b with the wrong passphrase it opens nothing, says the passphrase is wrong and exits 2: exit " + wrong.status + ", "
    + JSON.stringify(String(wrong.stderr).trim().slice(0, 140)));
  const strangerAt = path.join(g.base, "stranger-key.json");
  fs.writeFileSync(strangerAt, JSON.stringify(await makeKeyFile({ passphrase: PASS }), null, 1) + "\n");
  const stranger = runRead(g, { key: strangerAt });
  check(stranger.status === 2 && /no team this key leads/.test(stranger.stderr) && !String(stranger.stdout),
    "2c with a key that leads no team in the folder it opens nothing and exits 2: exit " + stranger.status + ", "
    + JSON.stringify(String(stranger.stderr).trim().slice(0, 140)));

  /* THE PASSPHRASE BY A FILE, AND NEVER BY AN ARGUMENT (the test architect's E2 on 5856696): an argument list is
     readable by every process on the machine, so --passphrase is refused before anything is read. */
  const passAt = path.join(g.base, "lead-passphrase.txt");
  fs.writeFileSync(passAt, PASS + "\n");
  PASS_FILES.push(passAt);
  const byFile = runRead(g, { noPass: true, passFile: passAt });
  check(byFile.status === 0 && String(byFile.stdout) === String(good.stdout),
    "2e with STUDIO_KEY_PASSPHRASE unset, --passphrase-file opens the box and prints the same answer: exit " + byFile.status
    + (byFile.status ? ": " + String(byFile.stderr).trim().slice(0, 160) : ""));
  const byArg = runRead(g, { noPass: true, passArg: PASS });
  check(byArg.status === 2 && !String(byArg.stdout) && /--passphrase-file/.test(String(byArg.stderr))
        && (String(byArg.stdout) + String(byArg.stderr)).indexOf(PASS) < 0,
    "2f --passphrase with a value is refused: exit 2, --passphrase-file named, nothing printed and the value in neither"
    + " stream: exit " + byArg.status + ", " + JSON.stringify(String(byArg.stderr).trim().slice(0, 140)));

  /* A SIGNED ANSWER WITH A KEY NOBODY RULED IS READ BY THE NOUNS IT HAS (updates 4; the test architect's condition: "Studio's
     statistics judge ignores unknown keys once the envelope and the desk's signature verify within format 1"): the desk's row
     is printed and the key nobody ruled is in no line. Before 2026-11-01 the whole file was refused for it. */
  const X = deskPair(0x64);
  const x = await led("extra", [[X, "Cinder lamp"]]);
  seal(x, X, answer("dtest-cinder", { agent: "no" }));
  const refused = runRead(x);
  check(refused.status === 0 && /dtest-cinder/.test(refused.stdout) && !/agent/.test(String(refused.stdout) + String(refused.stderr)),
    "1c a signed answer with an extra key is read, its row printed and the extra key in no line, exit " + refused.status
    + " (" + String(refused.stderr || "").trim().replace(/\s+/g, " ").slice(0, 180) + ")");

  /* ONE FILE NESTED DEEP DOES NOT HIDE THE OTHERS (sense pass 3, item 10). An answer nested 1,000 deep, signed by its
     desk, opens and is refused as nested too deep. One nested 5,000 deep cannot be signed at all, since the canonical
     form a signature covers overflows the stack (measured here, 2026-10-16), so it is sealed by hand under a signature
     that is no signature: it opens to nothing and its desk is quiet. The good desk's row stays through both. */
  const G = deskPair(0x65), D1 = deskPair(0x66), D2 = deskPair(0x67);
  const deep = await led("deep", [[G, "Good lamp"], [D1, "Deep lamp"], [D2, "Deeper lamp"]]);
  seal(deep, G, answer("dtest-good"));
  const nest = (n) => { let v = []; for (let i = 1; i < n; i++) v = [v]; return v; };
  seal(deep, D1, { format: 1, kind: "etiuda-statistics", desk: "dtest-deep", cards: nest(1000) });
  const deeper = '{"format":1,"kind":"etiuda-statistics","desk":"dtest-deeper","cards":' + "[".repeat(5000) + "]".repeat(5000)
    + ',"sig":{"alg":"Ed25519","keyId":"' + D2.id + '","value":"' + "0".repeat(128) + '"}}';
  const env = Engine.statsRules().sealStatsLead(deep.team.lead.box, deep.team.id, deep.team.lead.keyId, D2.id, deeper);
  fs.mkdirSync(path.join(deep.share, "desks", D2.id), { recursive: true });
  fs.writeFileSync(path.join(deep.share, "desks", D2.id, "stats.estat"), jsonText(env));
  let deepThrew = null, deepGot = null;
  try { deepGot = await Studio.statsFor(deep.dir, { key: deep.keyAt, passphrase: PASS }); }
  catch (e) { deepThrew = "reading threw " + (e && e.name); }
  const placed = deepGot ? (deepGot.refused || []).map((r) => r.name + " " + (r.extra || []).join())
    .concat((deepGot.quiet || []).map((q) => "quiet " + q.desk)).sort() : [];
  check(!deepThrew && deepGot && deepGot.rows.length === 1 && deepGot.rows[0].cells[0] === "dtest-good"
        && placed.join("|") === [D1.id + " (nested too deep)", "quiet Deeper lamp"].sort().join("|"),
    "1e an answer nested 1,000 deep is refused as nested too deep, one nested 5,000 deep opens to nothing and its desk"
    + " is quiet, and the good desk's row stays: " + (deepThrew || (deepGot.rows.length + " row(s), " + JSON.stringify(placed))));
}

/* ---- SECTION 3: AN ANSWER COUNTED BY DAY AND ONE COUNTED FOR LIFE, SIDE BY SIDE ------------------------------------
 *
 * Both made by the engine's own counters (tests/desk-emitter.mjs), over one span for September, then signed and sealed
 * as a desk does. `d-life` runs the last engine that sent lifetime counts; `d-whole` and `d-late` run one that counts
 * by day, the first from August so its September is whole, the second from the 15th so its September is half a month.
 * The cards are shaped for the rule that a card is used in the period only when an answer places a use inside it:
 *
 *   c-one    d-life, 15 August           no use in the period: rotting
 *   c-two    d-life, 1 September         the period's first day: used (the control)
 *   c-three  d-whole and d-late          used
 *   c-four   d-life, 2 October           after the period, on a lifetime count: not judged
 *   c-five   d-whole, 25 August          outside the span, so absent from its answer: rotting
 *   c-six    nobody, first published 10 September: not judged
 */
const SPAN = { from: "2026-09-01", to: "2026-09-30" };
const CARDS = ["c-one", "c-two", "c-three", "c-four", "c-five", "c-six"];

async function bothAnswers() {
  const life = await emitter("lifetime");
  const byDay = await emitter("by-day");
  const cat = { id: "lamp-shop", rev: 2 };
  const docs = [
    answerFrom(life, { desk: "d-life", period: SPAN, catalog: cat, sync: "2026-10-02 09:00",
      uses: [["c-one", "2026-08-15"], ["c-two", "2026-09-01"], ["c-four", "2026-10-02"]] }),
    answerFrom(byDay, { desk: "d-whole", period: SPAN, catalog: cat,
      uses: [["c-five", "2026-08-25"], ["c-three", "2026-09-12"]] }),
    answerFrom(byDay, { desk: "d-late", period: SPAN, catalog: cat,
      uses: [["c-three", "2026-09-15"]] }),
  ];
  const pairs = [deskPair(0x71), deskPair(0x72), deskPair(0x73)];
  const g = await led("both", pairs.map((p, i) => [p, "Both lamp " + (i + 1)]));
  docs.forEach((d, i) => seal(g, pairs[i], d));
  const by = Object.fromEntries(docs.map((d) => [d.desk, d]));

  check(!("since" in by["d-life"]) && by["d-whole"].since === "2026-08-25"
        && by["d-late"].since === "2026-09-15"
        && by["d-whole"].cards.map((c) => c.id).join() === "c-three",
    "3a the fixtures are the engines' own: " + life.commit + " sends no since, " + byDay.commit
    + " sends " + by["d-whole"].since + " and " + by["d-late"].since
    + " and only the span's cards (" + by["d-whole"].cards.map((c) => c.id).join() + ")");

  const got = readLiveAt(g);
  check(got.rows.length === 3 && got.refused.length === 0,
    "3b an answer counted by day and one counted for life both open and read: " + got.rows.length
    + " row(s), refused " + JSON.stringify(got.refused.map((r) => r.name + " " + r.extra.join())));

  const O = deskPair(0x74);
  const odd = await led("both-odd", [[O, "Odd lamp"]]);
  seal(odd, O, Object.assign({}, by["d-late"], { days: { "2026-09-15": 1 } }));
  const oddGot = readLiveAt(odd);
  check(oddGot.rows.length === 0 && oddGot.refused.length === 1
        && oddGot.refused[0].extra.join() === "days,days.2026-09-15",
    "3c the control: the same answer with one key nobody ruled is still refused, naming it: "
    + JSON.stringify(oddGot.refused.map((r) => r.extra)));

  const head = HEAD.split("\t");
  const at = head.indexOf("since");
  const cell = (desk) => {
    const r = got.rows.find((x) => x.data.desk === desk);
    return r ? rowOf(r.data).split("\t")[at] : "(no row)";
  };
  check(at >= 0 && cell("d-late") === "2026-09-15" && cell("d-whole") === "2026-08-25"
        && cell("d-life") === "-",
    "3d each desk's row carries the day it began counting, and a lifetime answer none: "
    + ["d-life", "d-whole", "d-late"].map((d) => d + "=" + cell(d)).join(" "));

  const v = viewsOf(got.rows, {
    cards: CARDS.map((id) => ({ id, title: id })),
    editions: [{ edition: "2026-08-01a", rev: 1, ids: CARDS.slice(0, 5) },
               { edition: "2026-09-10a", rev: 2, ids: CARDS }],
    catalogId: "lamp-shop" });
  const c = v.coverage;
  const rotIds = v.rotting.rows.map((r) => r[0]).sort().join();
  check(c.used === 2 && c.rotting === 2 && c.notJudged === 2 && rotIds === "c-five,c-one"
        && c.used + c.rotting + c.notJudged === CARDS.length,
    "3e a card is used in the period only where an answer places a use inside it: used "
    + c.used + ", rotting " + c.rotting + " (" + rotIds + "), not judged " + c.notJudged
    + "; want 2, 2 (c-five,c-one), 2");

  const w = v.window;
  check(w.lifetime === 1 && w.late === 1 && w.since === "2026-09-15",
    "3f the window says how the answers were counted: lifetime " + w.lifetime + ", begun late "
    + w.late + ", the latest from " + w.since);

  /* THE RANKING SPEAKS FOR THE PERIOD. d-life's n counts copies from before September, so its cards are left out of the
     most-used list whole and the list says one answer was; c-three is d-whole's and d-late's, one copy each in the span. */
  const top = v.top.rows.map((r) => r[0] + ":" + r[2] + ":" + r[3]).join();
  const topTitle = (viewBlocks(v).find((b) => b.key === "top") || {}).title;
  check(top === "c-three:2:2" && v.top.all === 1 && v.top.left === 1
        && topTitle === "most used: 1 of 1 (answers counted since the desk began, left out: 1)",
    "3h only answers counted by day rank the cards, and the lifetime one is said to be left out: "
    + top + ", left " + v.top.left + ", " + JSON.stringify(topTitle));

  /* THE TEAM'S FIGURES ARE EVERY ANSWER'S, SUMMED BY THIS LEG FROM THE ANSWERS THEMSELVES. */
  let wantUses = 0, wantMisses = 0;
  docs.forEach((d) => {
    (d.cards || []).forEach((x) => { wantUses += x.n | 0; });
    wantMisses += d.misses | 0;
  });
  check(v.team.desks === 3 && v.team.uses === wantUses && v.team.misses === wantMisses
        && wantUses === 5,
    "3i the team's uses and misses are all three answers' added up: uses " + v.team.uses
    + " of " + wantUses + ", misses " + v.team.misses + " of " + wantMisses);

  const removedRow = {
    name: "d-removed", removed: true,
    data: {
      format: 1, kind: "etiuda-statistics", desk: "d-removed",
      period: { from: "2026-08-01", to: "2026-08-31" }, sync: "2026-08-31 12:00",
      cards: [{ id: "c-two", n: 4, at: "2026-08-15" }],
      catalog: { id: "lamp-shop", rev: 1 },
    },
  };
  const withRemoved = got.rows.concat([removedRow]);
  const vWith = viewsOf(withRemoved, {
    cards: CARDS.map((id) => ({ id, title: id })),
    editions: [{ edition: "2026-08-01a", rev: 1, ids: CARDS.slice(0, 5) },
               { edition: "2026-09-10a", rev: 2, ids: CARDS }],
    catalogId: "lamp-shop" });
  check(vWith.window.from === "2026-09-01" && vWith.answers.oldest === v.answers.oldest
        && vWith.adoption.answers === 3 && vWith.adoption.behind === 0
        && vWith.team.uses === wantUses,
    "3j a removed desk's frozen row counts only in its own period's totals: window from "
    + vWith.window.from + ", oldest sync " + vWith.answers.oldest + ", adoption answers "
    + vWith.adoption.answers + " (behind " + vWith.adoption.behind + "), uses " + vWith.team.uses);

  const vAug = viewsOf([{
    name: "d-aug",
    data: {
      format: 1, kind: "etiuda-statistics", desk: "d-aug",
      period: { from: "2026-08-01", to: "2026-08-31" }, sync: "2026-08-31 12:00",
      cards: [], catalog: { id: "lamp-shop", rev: 1 },
    },
  }, removedRow], {
    cards: CARDS.map((id) => ({ id, title: id })),
    editions: [{ edition: "2026-08-01a", rev: 1, ids: CARDS.slice(0, 5) },
               { edition: "2026-09-10a", rev: 2, ids: CARDS }],
    catalogId: "lamp-shop" });
  check(vAug.window.from === "2026-08-01" && vAug.window.to === "2026-08-31"
        && vAug.team.uses === 4,
    "3k viewing August, the removed desk's August uses are counted: window "
    + vAug.window.from + ".." + vAug.window.to + ", uses " + vAug.team.uses);

  pinSpan(g, "range-2026-09-01-2026-09-30");
  const printed = runRead(g);
  const lines = String(printed.stdout || "").split("\n");
  const said = (k, val) => lines.some((l) => l === k + "\t" + val);
  check(printed.status === 0 && said("answers counted since the desk began", "1")
        && said("answers counted from a later day", "1")
        && said("latest day counting began", "2026-09-15"),
    "3g the command line prints the same three: exit " + printed.status + "\n       "
    + lines.filter((l) => /counted|counting/.test(l)).join("\n       "));
}

/* ---- SECTION 4: "B AFTER A", THE PAIRS A DESK SENDS AND THE TEAM'S TOTAL OF THEM ----------------------------------
 *
 * Handwritten answers. A pair is `{from, to, n}`, card ids by name, and only the team figure carries a pair's count: a
 * desk's own row carries none (decisions 2026-09-23 02:08). */
async function pairsLegs() {
  const pairs = {
    "dp-one": [{ from: "c-a", to: "c-b", n: 3 }, { from: "c-a", to: "c-c", n: 1 }],
    "dp-two": [{ from: "c-a", to: "c-b", n: 2 }, { from: "c-b", to: "c-a", n: 4 },
               { from: "c-c", to: "c-a", n: 0 }],
  };
  const P1 = deskPair(0x81), P2 = deskPair(0x82);
  const withPairs = await led("pairs", [[P1, "Pair lamp one"], [P2, "Pair lamp two"]]);
  const without = await led("pairs-none", [[P1, "Pair lamp one"], [P2, "Pair lamp two"]]);
  [[P1, "dp-one"], [P2, "dp-two"]].forEach(([p, desk]) => {
    seal(withPairs, p, answer(desk, { pairs: pairs[desk] }));
    seal(without, p, answer(desk));
  });
  const got = readLiveAt(withPairs);
  check(got.rows.length === 2 && got.refused.length === 0,
    "4a answers carrying pairs are accepted: " + got.rows.length + " row(s), refused "
    + JSON.stringify(got.refused.map((r) => r.name + " " + r.extra.join())));

  const sum = teamOf(got.rows).pairs.map((p) => p.from + ">" + p.to + ":" + p.n).join();
  check(sum === "c-a>c-b:5,c-b>c-a:4,c-a>c-c:1",
    "4b the team's pairs are each from-to pair's n over both desks, most first, a nought left"
    + " out: " + sum + "; want c-a>c-b:5,c-b>c-a:4,c-a>c-c:1");

  const Q = deskPair(0x83);
  const odd = await led("pairs-odd", [[Q, "Pair lamp odd"]]);
  seal(odd, Q, answer("dp-odd", { pairs: [{ from: "c-a", to: "c-b", n: 1, x: 1 }] }));
  const oddGot = readLiveAt(odd);
  check(oddGot.rows.length === 0 && oddGot.refused.length === 1
        && oddGot.refused[0].extra.join() === "pairs[].x",
    "4c the control: a pair carrying a key nobody ruled is still refused, naming it: "
    + JSON.stringify(oddGot.refused.map((r) => r.extra)));

  const bare = readLiveAt(without);
  const team = (r) => JSON.stringify(viewBlocks(viewsOf(r.rows)).find((b) => b.key === "team"));
  const rowsOf = (r) => JSON.stringify(r.rows.map((x) => rowOf(x.data)));
  const none = teamOf(bare.rows);
  check(bare.rows.length === 2 && none.pairs.length === 0 && team(bare) === team(got)
        && rowsOf(bare) === rowsOf(got),
    "4d the control: answers without pairs total none, and the team block and each desk's row print"
    + " as they do with them: " + none.pairs.length + " pair(s), blocks "
    + (team(bare) === team(got) ? "equal" : "DIFFER") + ", rows "
    + (rowsOf(bare) === rowsOf(got) ? "equal" : "DIFFER"));
  pinSpan(withPairs, "range-2026-09-01-2026-09-17");
  const printed = runRead(withPairs);
  check(printed.status === 0 && !/c-a|c-b/.test(printed.stdout) && /^all desks: 2$/m.test(printed.stdout),
    "4e the command line reads answers with pairs and prints no pair of them: exit " + printed.status);
}

async function main(argv) {
  clearScratch(SCRATCH);
  fs.mkdirSync(SCRATCH, { recursive: true });

  check(fs.existsSync(TOOL), "0 tools/stats-read.mjs is there");

  try { await lineLegs(); }
  catch (e) { check(false, "1 the command line legs threw: " + (e && e.stack ? e.stack : e)); }

  try { await bothAnswers(); }
  catch (e) { check(false, "3 both answers threw: " + (e && e.stack ? e.stack : e)); }

  try { await pairsLegs(); }
  catch (e) { check(false, "4 pairs legs threw: " + (e && e.stack ? e.stack : e)); }

  /* NO PASSPHRASE LEAVES BY ANY ROUTE (the test architect's E1 on 5856696): neither the right one nor the wrong one is
     in any stream a run of the tool wrote, nor in any file under these fixtures but the passphrase file the leg wrote
     itself, read as UTF-8 and as UTF-16. The control: the same search finds the passphrase in that file. */
  const leaks = [];
  const named = (p) => (p === PASS ? "the passphrase" : "the wrong one");
  STREAMS.forEach((s, i) => { for (const p of [PASS, WRONG]) if (s.indexOf(p) > -1) leaks.push("stream " + i + " carries " + named(p)); });
  const holds = (f, p) => { const b = fs.readFileSync(f); return b.indexOf(Buffer.from(p, "utf8")) > -1 || b.indexOf(Buffer.from(p, "utf16le")) > -1; };
  const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true })
    .flatMap((d) => (d.isDirectory() ? walk(path.join(dir, d.name)) : [path.join(dir, d.name)]));
  const files = fs.existsSync(SCRATCH) ? walk(SCRATCH) : [];
  for (const f of files) {
    if (PASS_FILES.indexOf(f) > -1) continue;
    for (const p of [PASS, WRONG]) if (holds(f, p)) leaks.push(path.relative(SCRATCH, f) + " carries " + named(p));
  }
  const control = PASS_FILES.length > 0 && PASS_FILES.every((f) => fs.existsSync(f) && holds(f, PASS));
  check(STREAMS.length >= 12 && files.length > 0 && control && !leaks.length,
    "5a neither passphrase is in any of the " + STREAMS.length + " streams of the tool's runs or in any of the "
    + files.length + " files under the fixtures, and the control finds it in the file the leg wrote: "
    + (leaks.join("; ") || "none") + (control ? "" : ", but the control found nothing"));

  if (!argv.includes("--keep")) dropScratch(SCRATCH, "stats-read");
  process.stdout.write("#counts checks=" + asserted + " failed=" + failed + " expected=" + EXPECTED + "\n");
  if (asserted !== EXPECTED) {
    process.stderr.write("SUITE DID NOT COMPLETE: " + asserted + " of " + EXPECTED + " checks ran\n");
    process.exit(78);
  }
  process.stdout.write("stats-read-legs: " + asserted + " assertion(s), " + failed + " failure(s)\n");
  process.exit(failed ? 1 : 0);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]))
  main(process.argv.slice(2)).catch((e) => {
    process.stderr.write("stats-read-legs: REFUSED " + (e && e.stack ? e.stack : e) + "\n");
    process.exit(2);
  });
