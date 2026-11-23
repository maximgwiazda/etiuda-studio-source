/* STATISTICS LIVE, SEALED TO THE LEAD'S BOX (board 891).
 *
 *     node tests/stats-live-studio.mjs
 *
 * The lead's box is written into the signed team file. The span file is the engine's shape and is
 * rewritten when the counting period changes. A desk's stats.estat opens with the box and is
 * counted; a team-key seal, an off-roster desk, and a file moved into another desk's folder do
 * not. The desks watch reports stats.estat with no focus and no five-minute pass. Ask desks is
 * gone. The screen's totals are the team's.
 *
 * Each check is planted red first: the child runs that one check against the planted source and
 * must print PLANT-RED, and the source is put back by its sha256 before the next plant. The green
 * run is this process, which loaded the modules before any plant.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { plantText } from "./plant-copy.mjs";
import { fileURLToPath } from "node:url";
import * as Engine from "../src/engine.mjs";
import * as Studio from "../src/studio.mjs";
import * as Use from "../src/catalog-use.mjs";
import { makeKeyFile, readKeyFile, unlockKey, openLeadBox, signDocument } from "../src/sign.mjs";
import { newTeam, withDesk, writeTeam, heldTeam } from "../src/team.mjs";
import { folderStamp, WATCH_MS } from "../src/team-watch.mjs";
import { jsonText } from "../src/plain-json.mjs";
import { clearScratch, dropScratch } from "./scratch.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SCRATCH = path.join(ROOT, "scratch", "stats-live-studio");
const SELF = fileURLToPath(import.meta.url);
/* Set before the first plant. The child runs from this copy, so its ROOT is the copy. */
let tree = null;
const ONLY = process.env.STATS_LIVE_ONLY || "";
const PASS = "harbour-gate-pass";
const IDS = ["891sa", "891sb", "891sd", "891se", "891sf", "891sg", "891sh", "891si", "891sj", "891sk", "u4a", "u4b"];
/* ETIUDA_PLANTS=off (a merge's area run) skips the plants of u4a and u4b, which quote their marks, and says so; the release
   profile runs with plants on, so they still run there. */
const PLANTS_OFF = process.env.ETIUDA_PLANTS === "off";
/* Each fixture desk has a real Ed25519 key from a fixed seed, so its id is the one its key makes and stays the same
   from run to run (891sg's plant names A's id), and it can sign its answer as a desk does (board 891's C1). */
const PKCS8_ED25519 = Buffer.from("302e020100300506032b657004220420", "hex");
function deskPair(fill) {
  const priv = crypto.createPrivateKey({ key: Buffer.concat([PKCS8_ED25519, Buffer.alloc(32, fill)]), format: "der", type: "pkcs8" });
  const key = crypto.createPublicKey(priv).export({ type: "spki", format: "der" }).subarray(-32).toString("hex");
  return { id: "k-" + crypto.createHash("sha256").update(Buffer.from(key, "hex")).digest("hex").slice(0, 16), key, priv };
}
const PAIRS = [deskPair(0xaa), deskPair(0xbb), deskPair(0xdd)];
const A = "k-448f04ffcba874db";
const B = "k-d5da611ef1d8e917";
const OFF = "k-996763a7a9829529";
const pairOf = (id) => PAIRS.find((p) => p.id === id);

function no(id, why) {
  console.error(id + " " + why);
  return false;
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function block(id) {
  const p = pairOf(id);
  return { id, key: p ? p.key : crypto.randomBytes(32).toString("hex"), box: crypto.randomBytes(32).toString("hex") };
}
/* The desk's signature inside the seal, as the engine's writeStatsAnswer makes it; `by` signs for `deskId`. */
function signed(obj, deskId, by) {
  const out = Object.assign({}, obj, { sig: { alg: "Ed25519", keyId: deskId } });
  out.sig.value = crypto.sign(null, Engine.statsRules().statsAnswerSignedBytes(out), pairOf(by || deskId).priv).toString("hex");
  return out;
}
function answer(desk, cards) {
  return {
    format: 1, kind: "etiuda-desk-stats", desk, engine: "test",
    period: { from: "2026-09-16", to: "2026-10-15" }, sync: "2026-10-07 09:00",
    cards: cards || [{ id: "c-harbour", n: 4, at: "2026-10-03" }],
    intents: [], misses: 0, langs: { en: 1 }, since: "2026-10-01", pairs: [],
    catalog: { id: "c-harbour-lamp", rev: 2 }, hash: "h-harbour",
  };
}
function sealTo(share, team, deskId, obj, o) {
  const sign = !(o && o.unsigned);
  const body = sign ? signed(obj, deskId, o && o.by) : obj;
  const env = Engine.statsRules().sealStatsLead(team.lead.box, team.id, team.lead.keyId, deskId, JSON.stringify(body));
  const dir = path.join(share, "desks", deskId);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "stats.estat"), jsonText(env));
}

async function led(name) {
  const base = path.join(SCRATCH, name + "-" + process.pid + "-" + crypto.randomBytes(2).toString("hex"));
  const root = path.join(base, "projects");
  const share = path.join(base, "share");
  fs.mkdirSync(root, { recursive: true });
  fs.mkdirSync(share, { recursive: true });
  const made = await Studio.newProject(root, "Harbour lamps", [{ code: "en", name: "English" }]);
  await Studio.setPublishFolder(made.dir, share);
  const keyAt = path.join(base, "lead-key.json");
  const lead = await makeKeyFile({ passphrase: PASS });
  fs.writeFileSync(keyAt, JSON.stringify(lead, null, 1) + "\n");
  const team = newTeam({ catalogs: ["harbour-lamps"], lead: { keyId: lead.keyId, public: lead.public } });
  return { base, dir: made.dir, share, keyAt, lead, team };
}
const opts = (g) => ({ key: g.keyAt, passphrase: PASS, now: new Date(2026, 9, 15, 12, 0, 0) });

async function checkBox() {
  const g = await led("891sa");
  const before = JSON.parse(fs.readFileSync(g.keyAt, "utf8"));
  const wrote = await writeTeam(g.share, g.team, opts(g));
  const T = Engine.teamRules();
  const read = T.v2TeamRead(fs.readFileSync(wrote.at, "utf8"));
  const box = read.team && read.team.lead && read.team.lead.box;
  const valid = !!(read.team && !read.problems.length && await T.v2TeamSigState(read.team) === T.states.valid);
  const keyRead = readKeyFile(g.keyAt);
  const open = unlockKey(keyRead, PASS);
  const opened = openLeadBox(keyRead, open);
  const after = JSON.parse(fs.readFileSync(g.keyAt, "utf8"));
  const extra = Object.keys(after).filter((k) => !Object.prototype.hasOwnProperty.call(before, k));
  const sameFields = Object.keys(before).every((k) => JSON.stringify(before[k]) === JSON.stringify(after[k]));
  const stripped = JSON.parse(JSON.stringify(read.team));
  delete stripped.sig;
  delete stripped.lead.box;
  const resigned = await signDocument(stripped, { privateKey: open.privateKey, keyId: open.keyId });
  fs.writeFileSync(wrote.at, jsonText(resigned));
  const mid = T.v2TeamRead(fs.readFileSync(wrote.at, "utf8"));
  const midOk = !!(mid.team && mid.team.lead.box === undefined && !mid.problems.length
    && await T.v2TeamSigState(mid.team) === T.states.valid);
  const held = await heldTeam(g.share, { key: g.keyAt });
  const again = await writeTeam(g.share, held.team, opts(g));
  const second = T.v2TeamRead(fs.readFileSync(again.at, "utf8"));
  const ok = /^[0-9a-f]{64}$/.test(String(box || "")) && valid && opened && opened.public === box
    && extra.join() === "box" && sameFields && after.box.public === box
    && midOk && second.team && second.team.lead.box === box
    && await T.v2TeamSigState(second.team) === T.states.valid;
  if (!ok) return no("891sa", JSON.stringify({
    box, valid, opened: opened && opened.public, extra, sameFields, midOk,
    second: second.team && second.team.lead && second.team.lead.box,
    problems: read.problems,
  }));
  return true;
}

async function checkSpan() {
  const g = await led("891sb");
  await writeTeam(g.share, g.team, opts(g));
  const now = new Date(2026, 9, 15, 12, 0, 0);
  const first = await Studio.statsFor(g.dir, Object.assign({ now }, opts(g)));
  const at = path.join(g.share, "stats-span.json");
  const text1 = fs.readFileSync(at, "utf8");
  const R = Engine.statsRules();
  const lead = { keyId: g.lead.keyId, public: g.lead.public };
  const doc1 = R.spanDocument(text1);
  const set = await Studio.setStatsSpan(g.dir, "this-month", Object.assign({ now }, opts(g)));
  const text2 = fs.readFileSync(at, "utf8");
  const doc2 = R.spanDocument(text2);
  const keys = (doc) => doc && Object.keys(doc).join();
  const sigKeys = (doc) => doc && doc.sig && Object.keys(doc.sig).join();
  const ok = first.span === "rolling-30" && doc1 && doc1.span === "rolling-30" && R.spanGenuine(doc1, lead)
    && keys(doc1) === "format,kind,span,sig" && sigKeys(doc1) === "alg,keyId,value"
    && set && set.span === "this-month" && doc2 && doc2.span === "this-month" && R.spanGenuine(doc2, lead)
    && doc2.counted === undefined && set.days && set.days.from === "2026-10-01" && set.days.to === "2026-10-15"
    && !fs.existsSync(path.join(g.share, "etiuda-request.ereq"));
  if (!ok) return no("891sb", JSON.stringify({
    first: first && first.span, doc1: doc1 && doc1.span, doc2: doc2 && doc2.span,
    genuine1: !!(doc1 && R.spanGenuine(doc1, lead)), genuine2: !!(doc2 && R.spanGenuine(doc2, lead)),
    keys: keys(doc1), sig: sigKeys(doc1), set: set && set.days, refusal: first && first.refusal,
  }));
  return true;
}

async function checkOpen() {
  const g = await led("891sd");
  let team = withDesk(g.team, block(A), "Quiet lamp");
  team = withDesk(team, block(B), "Live lamp");
  const wrote = await writeTeam(g.share, team, opts(g));
  sealTo(g.share, wrote.team, B, answer("Live lamp", [{ id: "c-harbour", n: 4, at: "2026-10-03" }]));
  fs.mkdirSync(path.join(g.share, "desks", A), { recursive: true });
  const got = await Studio.statsFor(g.dir, opts(g));
  const row = (got.rows || []).find((r) => r.cells && r.cells[0] === "Live lamp");
  const quiet = (got.quiet || []).map((q) => q.desk + "@" + q.since).join(",");
  const ok = got.live && got.live.n === 1 && got.live.time === "2026-10-07 09:00" && !!row
    && quiet === "Quiet lamp@-" && !(got.refused || []).length;
  if (!ok) return no("891sd", JSON.stringify({ live: got.live, quiet, row: !!row, refused: got.refused, refusal: got.refusal }));
  return true;
}

async function checkTeamKey() {
  const g = await led("891se");
  const wrote = await writeTeam(g.share, withDesk(g.team, block(A), "Live lamp"), opts(g));
  const dir = path.join(g.share, "desks", A);
  fs.mkdirSync(dir, { recursive: true });
  const env = Engine.sealRules().sealCatalog(crypto.randomBytes(32), wrote.team.id, 1, JSON.stringify(answer("Live lamp")));
  fs.writeFileSync(path.join(dir, "stats.estat"), jsonText(env));
  const got = await Studio.statsFor(g.dir, opts(g));
  const ok = (got.rows || []).length === 0 && (got.refused || []).length === 0
    && (got.quiet || []).length === 1 && got.quiet[0].desk === "Live lamp" && got.live.n === 0;
  if (!ok) return no("891se", JSON.stringify({ rows: (got.rows || []).length, refused: got.refused, quiet: got.quiet, live: got.live, refusal: got.refusal }));
  return true;
}

async function checkOff() {
  const g = await led("891sf");
  const wrote = await writeTeam(g.share, withDesk(g.team, block(A), "Live lamp"), opts(g));
  fs.mkdirSync(path.join(g.share, "desks", A), { recursive: true });
  sealTo(g.share, wrote.team, OFF, answer("Off lamp"));
  const got = await Studio.statsFor(g.dir, opts(g));
  const names = (got.rows || []).map((r) => r.cells[0]).concat((got.quiet || []).map((q) => q.desk));
  const ok = (got.rows || []).length === 0 && got.live.n === 0 && names.indexOf("Off lamp") < 0 && names.indexOf(OFF) < 0
    && (got.quiet || []).length === 1 && got.quiet[0].desk === "Live lamp";
  if (!ok) return no("891sf", JSON.stringify({ names, live: got.live, quiet: got.quiet, refusal: got.refusal }));
  return true;
}

async function checkMoved() {
  const g = await led("891sg");
  let team = withDesk(g.team, block(A), "Lamp A");
  team = withDesk(team, block(B), "Lamp B");
  const wrote = await writeTeam(g.share, team, opts(g));
  const env = Engine.statsRules().sealStatsLead(wrote.team.lead.box, wrote.team.id, wrote.team.lead.keyId, A, JSON.stringify(signed(answer("Lamp A"), A)));
  fs.mkdirSync(path.join(g.share, "desks", A), { recursive: true });
  fs.mkdirSync(path.join(g.share, "desks", B), { recursive: true });
  fs.writeFileSync(path.join(g.share, "desks", B, "stats.estat"), jsonText(env));
  const got = await Studio.statsFor(g.dir, opts(g));
  const ok = (got.rows || []).length === 0 && (got.refused || []).length === 0 && got.live.n === 0
    && (got.quiet || []).map((q) => q.desk).sort().join(",") === "Lamp A,Lamp B";
  if (!ok) return no("891sg", JSON.stringify({ rows: got.rows, quiet: got.quiet, live: got.live, refused: got.refused, refusal: got.refusal }));
  return true;
}

async function checkWatch() {
  const id = "k-cccccccccccccccc";
  const folder = path.join(SCRATCH, "891sh-" + process.pid + "-" + crypto.randomBytes(2).toString("hex"));
  const desk = path.join(folder, "desks", id);
  fs.mkdirSync(desk, { recursive: true });
  let seen = false;
  const started = Date.now();
  const handle = Use.watchFolder(folder, () => { seen = true; }, { settle: 40 });
  try {
    await sleep(150);
    fs.writeFileSync(path.join(desk, "stats.estat"), "{\"format\":1}\n");
    const until = Date.now() + 25000;
    while (Date.now() < until && !seen) await sleep(40);
    const waited = Date.now() - started;
    const stampFolder = path.join(SCRATCH, "891sh-stamp-" + process.pid);
    const stampDesk = path.join(stampFolder, "desks", id);
    fs.mkdirSync(stampDesk, { recursive: true });
    const memo = new Map();
    const before = folderStamp(stampFolder, memo);
    fs.writeFileSync(path.join(stampDesk, "stats.estat"), "a\n");
    const after = folderStamp(stampFolder, memo);
    const ok = seen && waited < WATCH_MS && before !== after && before.indexOf(id + ":stats=-") >= 0 && after.indexOf(id + ":stats=-") < 0;
    if (!ok) return no("891sh", JSON.stringify({ seen, waited, before, after }));
    return true;
  } finally { handle.close(); }
}

function checkAsk() {
  const files = ["ui/app.js", "ui/lang.js", "src/studio.mjs", "shell/preload.js", "shell/main.js"];
  const banned = [
    'data-act="ask-desks"', 'data-act="stats-ask-again"', "function askDesks", "studio:ask-desks",
    "Ask the desks again", "Last asked", "The desks were last asked", "Ask for statistics", "Asks the desks",
  ];
  const hits = [];
  for (const rel of files) {
    const text = fs.readFileSync(path.join(ROOT, rel), "utf8");
    for (const word of banned) if (text.indexOf(word) >= 0) hits.push(rel + ":" + word);
  }
  if (hits.length) return no("891si", hits.join(" | "));
  return true;
}

async function checkTotals() {
  const g = await led("891sj");
  const wrote = await writeTeam(g.share, withDesk(g.team, block(A), "Live lamp"), opts(g));
  sealTo(g.share, wrote.team, A, answer("Live lamp", [
    { id: "c-one", n: 3, at: "2026-10-03" },
    { id: "c-two", n: 1, at: "2026-10-04" },
  ]));
  const got = await Studio.statsFor(g.dir, opts(g));
  const uses = got.views && got.views.team && got.views.team.uses;
  const { loadPage } = await import("./page-stand-in.mjs");
  const home = loadPage({ api: {}, uiLang: "en" });
  const P = home.page;
  P.S.open = { dir: g.dir, editions: [], draft: { langs: [{ code: "en", name: "English" }], tags: [] } };
  P.S.screen = "project";
  P.S.section = "stats";
  P.S.stats = got;
  P.statsViewOf.set(g.dir, "every");
  P.paintStats();
  const html = home.node("#main").innerHTML;
  const desk = html.match(/<table class="desks">([\s\S]*?)<\/table>/);
  const deskHtml = desk ? desk[1] : "";
  const team = html.match(/<table class="team">([\s\S]*?)<\/table>/);
  const teamHtml = team ? team[1] : "";
  const heads = [...deskHtml.matchAll(/<th>([^<]*)<\/th>/g)].map((m) => m[1]);
  const cells = [...deskHtml.matchAll(/<td class="mono">([^<]*)<\/td>/g)].map((m) => m[1]);
  const teamCells = [...teamHtml.matchAll(/<td class="mono">([^<]*)<\/td>/g)].map((m) => m[1]);
  const ok = uses === 4 && (got.rows || []).length === 1 && heads.join("|").indexOf("uses") < 0
    && cells.length === 5 && cells[0] === "Live lamp" && cells.indexOf("4") < 0 && cells.indexOf("3") < 0
    && heads.indexOf("Sync") < 0 && !cells.some((c) => /^2026-10-07 09:00/.test(c))
    && teamCells[0] === "4" && html.indexOf("ask-desks") < 0;
  if (!ok) return no("891sj", JSON.stringify({ uses, heads, cells, teamCells, rows: (got.rows || []).length, refusal: got.refusal }));
  return true;
}

/* OPENED IS NOT ACCEPTED (board 891's C1). The lead's box is public, so anyone who can write the share can seal to
   it: an answer with no signature, and one signed by another rostered desk's key for this folder, are not counted;
   the folder's own desk's answer is. */
async function checkSigned() {
  const g = await led("891sk");
  let team = withDesk(g.team, block(A), "Lamp A");
  team = withDesk(team, block(B), "Lamp B");
  const wrote = await writeTeam(g.share, team, opts(g));
  sealTo(g.share, wrote.team, A, answer("Lamp A", [{ id: "c-harbour", n: 9999, at: "2026-10-03" }]), { unsigned: true });
  sealTo(g.share, wrote.team, B, answer("Lamp B", [{ id: "c-harbour", n: 2, at: "2026-10-03" }]));
  const first = await Studio.statsFor(g.dir, opts(g));
  sealTo(g.share, wrote.team, A, answer("Lamp A", [{ id: "c-harbour", n: 9999, at: "2026-10-03" }]), { by: B });
  const second = await Studio.statsFor(g.dir, opts(g));
  const usesOf = (got) => got.views && got.views.team && got.views.team.uses;
  const quietOf = (got) => (got.quiet || []).map((q) => q.desk).join(",");
  const ok = [first, second].every((got) => (got.rows || []).length === 1 && got.live.n === 1 && usesOf(got) === 2
    && quietOf(got) === "Lamp A");
  if (!ok) return no("891sk", JSON.stringify({ first: { rows: (first.rows || []).length, uses: usesOf(first), quiet: quietOf(first) },
    second: { rows: (second.rows || []).length, uses: usesOf(second), quiet: quietOf(second) }, refusal: first.refusal || second.refusal }));
  return true;
}

/* A NEWER DESK'S ANSWER IS STILL COUNTED (updates 4; the test architect's condition: "Studio's statistics judge ignores
   unknown keys once the envelope and the desk's signature verify within format 1, and checks the fields it needs by name").
   The desk's signed answer carries a field this Studio has no name for, at the top and inside a card, and its envelope a
   seventh key with the six in another order: it is one row, counted. */
async function checkNewerDesk() {
  const g = await led("u4a");
  const wrote = await writeTeam(g.share, withDesk(g.team, block(A), "Newer lamp"), opts(g));
  const body = signed(Object.assign(answer("Newer lamp", [{ id: "c-harbour", n: 4, at: "2026-10-03", dwell: 12 }]), { build: "2.0.1" }), A);
  const env = Engine.statsRules().sealStatsLead(wrote.team.lead.box, wrote.team.id, wrote.team.lead.keyId, A, JSON.stringify(body));
  const moved = { ct: env.ct, kind: env.kind, format: env.format, keyId: env.keyId, team: env.team, enc: env.enc, relayed: "2026-10-07" };
  fs.mkdirSync(path.join(g.share, "desks", A), { recursive: true });
  fs.writeFileSync(path.join(g.share, "desks", A, "stats.estat"), jsonText(moved));
  const got = await Studio.statsFor(g.dir, opts(g));
  const uses = got.views && got.views.team && got.views.team.uses;
  const ok = (got.rows || []).length === 1 && !(got.refused || []).length && got.live.n === 1 && uses === 4 && !(got.quiet || []).length;
  if (!ok) return no("u4a", JSON.stringify({ rows: (got.rows || []).length, refused: got.refused, quiet: got.quiet, live: got.live, uses, refusal: got.refusal }));
  return true;
}
/* Within format 1 only: a signed answer of format 2 is refused, naming its format, never read as format 1. */
async function checkOtherFormat() {
  const g = await led("u4b");
  const wrote = await writeTeam(g.share, withDesk(g.team, block(A), "Format lamp"), opts(g));
  sealTo(g.share, wrote.team, A, Object.assign(answer("Format lamp"), { format: 2 }));
  const got = await Studio.statsFor(g.dir, opts(g));
  const r = (got.refused || [])[0];
  const ok = (got.rows || []).length === 0 && (got.refused || []).length === 1 && !!r && (r.extra || []).join() === "(format 2)";
  if (!ok) return no("u4b", JSON.stringify({ rows: (got.rows || []).length, refused: got.refused, refusal: got.refusal }));
  return true;
}

const CHECKS = {
  "891sa": checkBox, "891sb": checkSpan, "891sd": checkOpen, "891se": checkTeamKey,
  "891sf": checkOff, "891sg": checkMoved, "891sh": checkWatch, "891si": checkAsk, "891sj": checkTotals, "891sk": checkSigned,
  "u4a": checkNewerDesk, "u4b": checkOtherFormat,
};

const PLANTS = [
  ["891sa", "src/team.mjs", "doc.lead = Object.assign({}, doc.lead, { box: box.public });", "doc.lead = Object.assign({}, doc.lead);"],
  ["891sb", "src/stats.mjs", "function writeSpan(folder, span, open, now) {\n  const token = spanKept(span) || \"rolling-30\";",
    "function writeSpan(folder, span, open, now) {\n  const token = \"rolling-30\";"],
  ["891sd", "src/stats.mjs", "liveN += 1", "liveN += 0"],
  ["891se", "src/stats.mjs", "const text = raw == null ? null : open(doc, id);", "const text = raw;"],
  ["891sf", "src/stats.mjs", "if (!roster.has(id)) continue;", "if (false && !roster.has(id)) continue;"],
  ["891sg", "src/stats.mjs", "const text = raw == null ? null : open(doc, id);", "const text = raw == null ? null : open(doc, \"k-448f04ffcba874db\");"],
  ["891sh", "src/catalog-use.mjs", '["in-use.ec", "catalog-answer.ec", "join.json", "stats.estat"]', '["in-use.ec", "catalog-answer.ec", "join.json"]'],
  ["891si", "ui/app.js", 'data-act="stats-span"', 'data-act="ask-desks"'],
  ["891sj", "src/stats.mjs", "uses += (c && c.n) | 0", "uses += 0"],
  ["891sk", "src/studio.mjs", "return R.statsAnswerGenuine(answer, deskId, keyOf.get(String(deskId)) || \"\") ? text : null;", "return text;"],
];
/* Updates 4's guards, each found by its mark: the judge kept strict, the envelope handed over as it came, the format let through. */
const U4_PLANTS = [
  ["u4a", "src/stats.mjs", "  if (signed === true) { /* plant:u4-unknown */", "  if (false) { /* plant:u4-unknown */"],
  ["u4a", "src/studio.mjs", "statsEnvelopeByName(doc), deskId); /* plant:u4-envelope */", "doc, deskId); /* plant:u4-envelope */"],
  ["u4b", "src/stats.mjs", "    if (data.format !== NEEDED_FORMAT) {", "    if (false) {"],
];

function plantOnce(id, rel, from, to) {
  const file = path.join(tree, rel);
  const buf = fs.readFileSync(file);
  const sha = crypto.createHash("sha256").update(buf).digest("hex");
  const text = buf.toString("utf8");
  const next = plantText(text, from, to, rel);
  let child = null;
  try {
    fs.writeFileSync(file, next, "utf8");
    child = spawnSync(process.execPath, [path.join(tree, path.relative(ROOT, SELF))], {
      cwd: tree,
      env: Object.assign({}, process.env, { STATS_LIVE_ONLY: id, ETIUDA_PLANTS: "off" }),
      encoding: "utf8",
      timeout: 90000,
    });
  } finally {
    fs.writeFileSync(file, buf);
    const back = crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
    if (back !== sha) throw new Error(id + " restore mismatch");
  }
  const red = !!(child && child.status === 1 && String(child.stdout || "").includes("PLANT-RED"));
  if (!red) {
    console.error(id + " plant did not bite status=" + (child && child.status) + " signal=" + (child && child.signal));
    console.error(String(child && child.stdout || ""));
    console.error(String(child && child.stderr || ""));
  }
  return red;
}

async function main() {
  clearScratch(SCRATCH);
  fs.mkdirSync(SCRATCH, { recursive: true });
  /* ETIUDA_PLANTS=off (a merge's area run) skips the plants phase and counts it as the one check it is.
     The text plants and the marked update-4 plants are that one phase. */
  if (PLANTS_OFF) {
    console.log("SKIP the plants phase: " + (PLANTS.length + U4_PLANTS.length) + " plants each turn their check red in a scratch copy, and the checkout's sha256 is unchanged after it (ETIUDA_PLANTS=off)");
  } else {
    const { plantsTree, treeSha, dropPlantsTree } = await import("./plants-tree.mjs");
    const before = treeSha(ROOT);
    let red = 0;
    let held = false;
    try {
      tree = plantsTree(ROOT, "stats-live-studio");
      for (const [id, rel, from, to] of PLANTS) {
        const ok = plantOnce(id, rel, from, to);
        console.log((ok ? "plant " : "PLANT FAIL ") + id + (ok ? " red" : ""));
        if (ok) red++;
      }
      for (const [id, rel, from, to] of U4_PLANTS) {
        const ok = plantOnce(id, rel, from, to);
        console.log((ok ? "plant " : "PLANT FAIL ") + id + " in " + rel + (ok ? " red" : ""));
        if (ok) red++;
      }
      held = treeSha(ROOT) === before;
      console.log((held ? "ok   " : "FAIL ") + "the checkout's sha256 over src/, shell/ and ui/ is unchanged after the plants phase");
    } finally {
      dropPlantsTree(tree, ROOT);
    }
    if (red !== PLANTS.length + U4_PLANTS.length || !held) {
      dropScratch(SCRATCH, "stats-live-studio");
      process.exit(1);
    }
  }
  let n = 0;
  for (const id of IDS) {
    let ok = false;
    try { ok = await CHECKS[id](); }
    catch (e) { console.error(id + " " + (e && e.stack || e)); ok = false; }
    console.log((ok ? "ok   " : "FAIL ") + id);
    if (ok) n++;
  }
  console.log("stats-live-studio " + (n + (PLANTS_OFF ? 0 : 1)) + "/" + (IDS.length + 1) + (PLANTS_OFF ? ", 1 skipped" : ""));
  console.log("#counts checks=" + (IDS.length + (PLANTS_OFF ? 0 : 1)) + " skipped=" + (PLANTS_OFF ? 1 : 0)
    + " failed=" + (IDS.length - n) + " expected=" + (IDS.length + 1));
  dropScratch(SCRATCH, "stats-live-studio");
  process.exit(n === IDS.length ? 0 : 1);
}

if (ONLY) {
  const fn = CHECKS[ONLY];
  if (!fn) { console.error("unknown " + ONLY); process.exit(2); }
  Promise.resolve(fn()).then((ok) => {
    console.log(ok ? "PLANT-GREEN" : "PLANT-RED");
    process.exit(ok ? 0 : 1);
  }).catch((e) => {
    console.error(e && e.stack || e);
    process.exit(2);
  });
} else {
  main().catch((e) => {
    console.error(e && e.stack || e);
    try { dropScratch(SCRATCH, "stats-live-studio"); } catch { /* the verdict is the error above */ }
    process.exit(1);
  });
}
