/* A DESK THAT ANSWERED IS NEVER TOLD IT DID NOT (board 899, the test architect's S1 on 9bc4a77).
 *
 *     node tests/answer-unopened.mjs
 *
 * An answer answerRefusal finds nothing wrong with, but which the pinned loader refuses, kept its row at "Waiting for this
 * desk" and, once the ask lapsed, said the desk did not answer, which is false. Now the landing says such a copy is not a
 * catalog it can open, the shell records that against the ask and the copy, and the row says the copy came back and could
 * not be opened as a catalog, with the loader's reason where it carries no card's words; the same copy is not landed again.
 *
 *   un1  a live ask answered with a copy the loader refuses: nothing is written to the projects folder, the refusal is
 *        recorded, and the row says the copy came back and why, in English and in Polish, with Import offered again, and
 *        neither Waiting nor "did not answer"
 *   un2  the same once the ask has lapsed: still said as answered, never as "did not answer"; and a copy written since the
 *        ask that has not landed yet is no lapse either
 *   un3  the copy recorded is not handed to the landing again, and another copy from the desk is
 *   un4  a copy written since the ask that no key this Studio holds opens is said as come back and not opened, with no
 *        reason, and never as "did not answer"
 *   un5  CONTROLS: an ask that lapsed with no copy written since still says the desk did not answer, and a copy older than
 *        a live ask still waits
 *   un6  the shell records the refusal through noteUnopened and its ledger keeps it
 *   un7  a copy refused for a line that carries card words keeps those words out of the Error's message, which the
 *        shell writes to its log, as well as off the row (the test architect's condition 2 on 27a7110)
 *
 * Each check is planted red first: the child runs that one check against the planted source and must print PLANT-RED, and
 * the source is put back by its sha256 before the next plant. The plant finds its line by a plant: mark and keeps the
 * substitution. Every word in the fixtures is invented.
 *
 * ETIUDA_PLANTS=off skips that phase and counts it as the one check it is. The release profile runs with plants on.
 *
 * Node only, no window. Exit 0 when every check holds, 1 when any fails.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import * as Engine from "../src/engine.mjs";
import * as Use from "../src/catalog-use.mjs";
import { jsWithoutComments } from "./source-text.mjs";
import { clearScratch, dropScratch } from "./scratch.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SCRATCH = path.join(ROOT, "scratch", "answer-unopened");
const SELF = fileURLToPath(import.meta.url);
/* Set before the first plant. The child runs from this copy, so its ROOT is the copy. */
let tree = null;
const ONLY = process.env.ANSWER_UNOPENED_ONLY || "";
const PLANTS_OFF = process.env.ETIUDA_PLANTS === "off";
const D = Engine.deskRules();
const SEAL = Engine.sealRules();

const CAME_BACK = "This teammate's copy came back, but Studio could not open it as a catalog file, so nothing was imported.";
const WHY = "What stopped it: card c-lantern-shift: no title in en, the primary language";
const CAME_BACK_PL = "Kopia od tego członka zespołu wróciła, ale Studio nie mogło otworzyć jej jako pliku katalogu, więc nic nie zaimportowano.";
const NO_ANSWER = "did not answer";
const WAITING = "Waiting for this desk";

/* A catalog the pinned loader takes, and the same with its one card's title gone, which it refuses. */
function goodDoc() {
  return { format: 2, kind: "etiuda-catalog", id: "north-quay", rev: 2, name: "Lantern rota", langs: [{ code: "en", label: "English" }],
    tags: [{ id: "t-lanterns", kind: "shelf", label: { en: "Lanterns" } }],
    cards: [{ id: "c-lantern-shift", shelf: "t-lanterns", bodyShape: "plain", title: { en: "Lantern shift" },
      body: { en: "The lantern is lit at dusk by the pier keeper." } }] };
}
function badDoc() {
  const doc = goodDoc();
  delete doc.cards[0].title;
  return doc;
}
function deskPair(name) {
  const pair = crypto.generateKeyPairSync("ed25519");
  const pub = pair.publicKey.export({ type: "spki", format: "der" }).subarray(-32).toString("hex");
  return { id: D.branchIdOf(pub), pub, pair, name };
}
function leadPair() {
  const pair = crypto.generateKeyPairSync("ed25519");
  const pub = pair.publicKey.export({ type: "spki", format: "der" }).subarray(-32).toString("hex");
  return { keyId: "lead-" + crypto.randomBytes(4).toString("hex"), public: pub, privateKey: pair.privateKey };
}
function writeEc(file, team, inner, key) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(SEAL.sealCatalog(key || team.key, team.id, team.epoch, JSON.stringify(inner)), null, 1) + "\n", "utf8");
}
function inUse(desk, doc) {
  const out = { format: 1, kind: "etiuda-in-use", desk: { id: desk.id, key: desk.pub, box: "ab".repeat(32), name: desk.name },
    at: "2026-04-02T08:15:00.000Z",
    catalog: { id: doc.id, rev: doc.rev, sha256: D.signedSha(doc), signer: "", source: "file", title: doc.name },
    sig: { alg: "Ed25519", keyId: desk.id } };
  out.sig.value = crypto.sign(null, D.branchSignedBytes(out), desk.pair.privateKey).toString("hex");
  return out;
}
/* A share with one roster desk using `doc`, the lead's own project beside it (another catalog, so Import is offered), and
   the lead's ask for that catalog, lapsed where asked. */
function world(id, doc, o) {
  const opts = o || {};
  const base = path.join(SCRATCH, id, crypto.randomBytes(4).toString("hex"));
  const share = path.join(base, "share"), project = path.join(base, "project");
  fs.mkdirSync(project, { recursive: true });
  fs.writeFileSync(path.join(project, "project.json"), JSON.stringify({ draft: "draft.json" }) + "\n");
  fs.writeFileSync(path.join(project, "draft.json"), JSON.stringify({ id: "harbour-tide", rev: 3, cards: [] }) + "\n");
  const team = { id: "t-" + crypto.randomBytes(8).toString("hex"), key: crypto.randomBytes(32), epoch: 1 };
  const desk = deskPair("Quay desk"), lead = leadPair();
  writeEc(path.join(share, "desks", desk.id, "in-use.ec"), team, inUse(desk, doc));
  const pin = D.signedSha(doc);
  const ask = Use.buildAsk(Object.assign({ desk: desk.id, sha256: pin, lead }, opts.lapsed ? { expires: new Date(Date.now() - 1000).toISOString() } : {}));
  const askAt = Use.writeAsk(share, desk.id, ask);
  const answerAt = path.join(share, "desks", desk.id, "catalog-answer.ec");
  const keys = { [team.id]: { 1: team.key } };
  const age = (file, ms) => { const t = new Date(Date.now() - ms); fs.utimesSync(file, t, t); };
  return {
    base, share, project, team, desk, lead, ask, askAt, answerAt, keys, pin, ledger: { desks: {}, done: {}, unopened: {} },
    root: path.join(base, "projects"), temp: path.join(base, "temp"),
    /* Since board 962's stage 0b an answer under the team key is signed by its desk over the ask and the team, and is about a
       catalog the team lists: each catalog answered here is listed. */
    catalogs: [doc.id],
    answer(catalog, key) {
      if (this.catalogs.indexOf(catalog.id) < 0) this.catalogs.push(catalog.id);
      const inner = { format: 1, kind: "etiuda-catalog-answer", ask: ask.id, team: team.id, sha256: D.signedSha(catalog), catalog,
        sig: { alg: "Ed25519", keyId: desk.id } };
      inner.sig.value = crypto.sign(null, Engine.answerLeadRules().answerLeadSignedBytes(inner), desk.pair.privateKey).toString("hex");
      writeEc(answerAt, team, inner, key);
    },
    /* What an answer is judged by, as the shell's boxContext hands it. */
    judged() { return { team: team.id, epoch: team.epoch, catalogs: this.catalogs, content: null, deskKeys: { [desk.id]: desk.pub } }; },
    /* the ask a minute old and the answer half a minute, or the other way round */
    order(answerFirst) { age(askAt, answerFirst ? 30000 : 60000); age(answerAt, answerFirst ? 60000 : 30000); },
    row() {
      return (Use.listUses(Object.assign({ folder: share, roster: [desk], projectDir: project, teamKeys: keys, ledger: this.ledger, lead }, this.judged()))
        .find((r) => r.id === desk.id)) || {};
    },
  };
}

const ENT = { "&#39;": "'", "&quot;": "\"", "&lt;": "<", "&gt;": ">", "&amp;": "&" };
function textOf(html) {
  return String(html).replace(/<[^>]*>/g, " ").replace(/&#39;|&quot;|&lt;|&gt;|&amp;/g, (m) => ENT[m])
    .replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
}
async function paint(rows, desk, lang) {
  const { loadPage } = await import("./page-stand-in.mjs");
  const home = loadPage({ api: {}, uiLang: lang || "en" });
  const P = home.page;
  P.S.open = { dir: "C:\\harbour", editions: [], name: "Harbour tide" };
  P.S.screen = "projects";
  P.S.home = "team";
  P.S.teamDir = "C:\\harbour";
  P.S.lang = "en";
  P.S.desks = {
    folder: "C:\\share", file: "ours", signing: "lead-key", inside: false, keyHeld: true, canKeep: true,
    requests: [], invites: [], keyOpens: true, autoAdmit: false,
    /* relay: the share stands for the team's relay mirror. A team that is not on the relay shows only the line that Studio no longer follows a shared
       folder (the folder removal, db433b79), where this leg means the desk rows. */
    team: { id: "t-0f1e2d3c4b5a6978", relay: true, epoch: 1, sealed: true, lists: true, exportsSealed: false,
      roster: [{ id: desk.id, name: desk.name, own: "", key: desk.id.slice(2), admitted: true, kind: "desk", door: "code" }] },
    uses: Use.forPage(rows),
  };
  P.paintMain();
  const html = home.node("#main").innerHTML;
  return { text: textOf(html), html };
}
function no(id, why) {
  console.error(id + " " + why);
  return false;
}
/* Land what is due, as the shell's landDue does, recording a copy the landing could not open. */
async function landDue(w) {
  const { landCatalog } = await import("../src/studio.mjs");
  const due = Use.answersDue(w.share, w.keys, w.ledger, Object.assign({ lead: w.lead, roster: [w.desk.id] }, w.judged()));
  const out = [];
  for (const item of due) {
    try { out.push({ item, landed: await landCatalog(w.root, item.catalog, w.temp, { title: item.title, desk: w.desk.name, lang: "en" }) }); }
    catch (err) { out.push({ item, err, noted: Use.noteUnopened(w.ledger, item, err) }); }
  }
  return out;
}

async function checkUn1() {
  const w = world("un1", badDoc());
  w.answer(badDoc());
  w.order(false);
  const got = await landDue(w);
  const one = got[0] || {};
  const written = fs.existsSync(w.root) ? fs.readdirSync(w.root) : [];
  const row = w.row();
  const en = await paint([row], w.desk, "en"), pl = await paint([row], w.desk, "pl");
  const facts = {
    due: got.length, noted: one.noted === true, frame: one.err && one.err.unopened && one.err.unopened.why && one.err.unopened.why.frame,
    written: written.length,
    row: { unopened: row.unopened, waiting: row.waiting, lapsed: row.lapsed, refused: row.refused, importable: row.importable },
    en: en.text.includes(CAME_BACK) && en.text.includes(WHY) && !en.text.includes(WAITING) && !en.text.includes(NO_ANSWER),
    pl: pl.text.includes(CAME_BACK_PL) && /Powód: karta c-lantern-shift/.test(pl.text),
    press: en.html.includes('data-act="catalog-import" data-id="' + w.desk.id + '"'),
  };
  const ok = facts.due === 1 && facts.noted && facts.frame === "card {ID}: no title in {LANG}, the primary language" && facts.written === 0
    && row.unopened === true && !row.waiting && !row.lapsed && !row.refused && row.importable === true
    && facts.en && facts.pl && facts.press;
  if (!ok) return no("un1", JSON.stringify(Object.assign(facts, { enText: en.text.slice(en.text.indexOf("Quay desk"), en.text.indexOf("Quay desk") + 260),
    plText: pl.text.slice(pl.text.indexOf("Quay desk"), pl.text.indexOf("Quay desk") + 260) })));
  return true;
}
async function checkUn2() {
  const w = world("un2", badDoc(), { lapsed: true });
  w.answer(badDoc());
  w.order(false);
  const pending = w.row();
  await landDue(w);
  const row = w.row();
  const en = await paint([row], w.desk, "en"), before = await paint([pending], w.desk, "en");
  /* Board 962, stage 0b round five: an ask past its seven days lands nothing, so the copy is held back, not opened; the desk
     is still never told it did not answer. */
  const ok = row.refused === true && !row.unopened && !row.lapsed && !row.waiting && row.importable === true
    && !en.text.includes(NO_ANSWER) && !pending.lapsed && !before.text.includes(NO_ANSWER);
  if (!ok) return no("un2", JSON.stringify({ row: { refused: row.refused, unopened: row.unopened, lapsed: row.lapsed, waiting: row.waiting },
    pending: { unopened: pending.unopened, lapsed: pending.lapsed }, en: en.text.slice(-260), before: before.text.slice(-200) }));
  return true;
}
async function checkUn3() {
  const w = world("un3", badDoc());
  w.answer(badDoc());
  w.order(false);
  const first = await landDue(w);
  const again = Use.answersDue(w.share, w.keys, w.ledger, Object.assign({ lead: w.lead, roster: [w.desk.id] }, w.judged()));
  /* The desk moves to a catalog that opens and answers with it: that copy is due, judged afresh. */
  writeEc(path.join(w.share, "desks", w.desk.id, "in-use.ec"), w.team, inUse(w.desk, goodDoc()));
  w.answer(goodDoc());
  const fresh = Use.answersDue(w.share, w.keys, w.ledger, Object.assign({ lead: w.lead, roster: [w.desk.id] }, w.judged()));
  const ok = first.length === 1 && first[0].noted === true && again.length === 0 && fresh.length === 1
    && fresh[0].sha256 === D.signedSha(goodDoc());
  if (!ok) return no("un3", JSON.stringify({ first: first.length, again: again.length, fresh: fresh.length }));
  return true;
}
async function checkUn4() {
  const w = world("un4", goodDoc(), { lapsed: true });
  w.answer(goodDoc(), crypto.randomBytes(32));
  w.order(false);
  const row = w.row();
  const en = await paint([row], w.desk, "en");
  const ok = row.unopened === true && !row.lapsed && !row.why && en.text.includes(CAME_BACK) && !en.text.includes("What stopped it")
    && !en.text.includes(NO_ANSWER);
  if (!ok) return no("un4", JSON.stringify({ row: { unopened: row.unopened, lapsed: row.lapsed, why: row.why }, en: en.text.slice(-260) }));
  return true;
}
async function checkUn5() {
  const silent = world("un5-silent", goodDoc(), { lapsed: true });
  const s = silent.row();
  const sp = await paint([s], silent.desk, "en");
  const late = world("un5-late", goodDoc());
  late.answer(goodDoc());
  late.order(true);
  const l = late.row();
  const ok = s.lapsed === true && !s.unopened && sp.text.includes("This teammate did not answer within 7 days")
    && l.waiting === true && !l.unopened && !l.lapsed;
  if (!ok) return no("un5", JSON.stringify({ silent: { lapsed: s.lapsed, unopened: s.unopened }, late: { waiting: l.waiting, unopened: l.unopened } }));
  return true;
}
/* The shell's own words, read rather than run (landDue needs Electron): its catch records through noteUnopened and writes
   the ledger, and the ledger keeps `unopened` both ways. */
function checkUn6() {
  const src = jsWithoutComments(fs.readFileSync(path.join(ROOT, "shell", "main.js"), "utf8"));
  const a = src.indexOf("async function landDue(");
  const b = src.indexOf("\nfunction ", a + 1);
  const body = a >= 0 ? src.slice(a, b < 0 ? src.length : b) : "";
  const recorded = /catch \(err\) \{\s*if \(Use\.noteUnopened\(ledger, item, err\)\) writeLanded\(folder, ledger\);/.test(body);
  const kept = /unopened: row\.unopened \|\| \{\}/.test(src) && /unopened: ledger\.unopened \|\| \{\} \};/.test(src)
    && /readLanded\(folder\)/.test(body) && /Use\.answersDue\(folder, \(await teamsNow\(\)\)\.teamKeys, ledger,/.test(body);
  if (!(recorded && kept)) return no("un6", JSON.stringify({ recorded, kept, found: a >= 0 }));
  return true;
}

async function checkUn7() {
  const words = "gull feather ledger";
  const bracketed = () => { const doc = goodDoc(); doc.cards[0].body.en = "The lantern is lit at dusk.\n[" + words + "]"; return doc; };
  const w = world("un7", bracketed());
  w.answer(bracketed());
  w.order(false);
  const got = await landDue(w);
  const one = got[0] || {};
  const message = String(one.err && one.err.message || "");
  const row = w.row();
  const en = await paint([row], w.desk, "en");
  const leaked = words.split(" ").filter((x) => message.includes(x) || en.text.includes(x) || JSON.stringify(w.ledger).includes(x));
  const ok = got.length === 1 && one.noted === true && /does not open as a catalog$/.test(message) && !leaked.length
    && row.unopened === true && !row.why && en.text.includes(CAME_BACK) && !en.text.includes("What stopped it");
  if (!ok) return no("un7", JSON.stringify({ due: got.length, noted: one.noted, message, leaked, unopened: row.unopened }));
  return true;
}

const CHECKS = { un1: checkUn1, un2: checkUn2, un3: checkUn3, un4: checkUn4, un5: checkUn5, un6: checkUn6, un7: checkUn7 };

const PLANTS = [
  ["un7", "src/studio.mjs", '(line && clean ? ": " + line : "")', '(line ? ": " + line : "")', "txau-clean"],
  ["un1", "src/studio.mjs", "  if (why) throw unopenedCopy(why);\n", "", "txau-throw"],
  ["un1", "src/catalog-use.mjs", "const unopened = answered && !refused && (!ans || !!record);", "const unopened = false;", "txau-unopened"],
  ["un1", "ui/app.js", "if (u.unopened) html +=", "if (false) html +=", "txau-row"],
  ["un2", "src/catalog-use.mjs", "if (!(Number.isFinite(until) && until > Date.now())) return \"an ask past its seven days\";", "", "s0b-st-live"],
  ["un3", "src/catalog-use.mjs", "    if (unopenedOf(ledger, String(ask.id || \"\"), ans)) return;\n", "", "txau-skip"],
  ["un4", "src/catalog-use.mjs", "(!ans || !!record)", "(false || !!record)", "txau-unopened"],
  ["un6", "shell/main.js", "      if (Use.noteUnopened(ledger, item, err)) writeLanded(folder, ledger);\n", "", "txau-note"],
  ["un6", "shell/main.js", ", unopened: ledger.unopened || {} };", " };", "txau-ledger"],
];

/* The line that carries the mark is the one the substitution rewrites. The mark is not part of the fault. */
function plantOnce(id, rel, from, to, tag) {
  const file = path.join(tree, rel);
  const buf = fs.readFileSync(file);
  const sha = crypto.createHash("sha256").update(buf).digest("hex");
  const text = buf.toString("utf8");
  const nl = text.indexOf("\r\n") >= 0 ? "\r\n" : "\n";
  const lines = text.split(nl);
  const mark = "/* plant:" + tag + " */";
  const hits = [];
  for (let i = 0; i < lines.length; i++) if (lines[i].indexOf(mark) >= 0) hits.push(i);
  if (hits.length !== 1) throw new Error(id + " plant " + tag + " is on " + hits.length + " lines of " + rel);
  const bare = lines[hits[0]].split(" " + mark).join("").split(mark).join("");
  let needle = from;
  if (needle.endsWith("\r\n")) needle = needle.slice(0, -2);
  else if (needle.endsWith("\n")) needle = needle.slice(0, -1);
  const n = needle.length ? bare.split(needle).length - 1 : 0;
  if (n !== 1) throw new Error(id + " plant " + tag + " substitution matches " + n + " on the marked line of " + rel);
  lines[hits[0]] = bare.replace(needle, to);
  let child = null;
  try {
    fs.writeFileSync(file, lines.join(nl));
    child = spawnSync(process.execPath, [path.join(tree, path.relative(ROOT, SELF))], {
      cwd: tree, env: Object.assign({}, process.env, { ANSWER_UNOPENED_ONLY: id, ETIUDA_PLANTS: "off" }), encoding: "utf8", timeout: 120000,
    });
  } finally {
    fs.writeFileSync(file, buf);
    const back = crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
    if (back !== sha) throw new Error(id + " restore mismatch in " + rel);
  }
  const red = !!(child && child.status === 1 && String(child.stdout || "").includes("PLANT-RED"));
  if (!red) {
    console.error(id + " plant in " + rel + " did not bite status=" + (child && child.status));
    console.error(String(child && child.stdout || "") + String(child && child.stderr || ""));
  }
  return red;
}

async function main() {
  clearScratch(SCRATCH);
  fs.mkdirSync(SCRATCH, { recursive: true });
  const legs = Object.keys(CHECKS);
  /* ETIUDA_PLANTS=off (a merge's area run) skips the plants phase and counts it as the one check it is; the release
     profile runs with plants on, so the phase still runs there. */
  if (PLANTS_OFF) {
    console.log("SKIP the plants phase: " + PLANTS.length + " plants each turn their check red in a scratch copy, and the checkout's sha256 is unchanged after it (ETIUDA_PLANTS=off)");
  } else {
    const { plantsTree, treeSha, dropPlantsTree } = await import("./plants-tree.mjs");
    const before = treeSha(ROOT);
    let red = 0;
    let held = false;
    try {
      tree = plantsTree(ROOT, "answer-unopened");
      for (const [id, rel, from, to, tag] of PLANTS) {
        const ok = plantOnce(id, rel, from, to, tag);
        console.log((ok ? "plant " : "PLANT FAIL ") + id + " " + rel + (ok ? " red" : ""));
        if (ok) red++;
      }
      held = treeSha(ROOT) === before;
      console.log((held ? "ok   " : "FAIL ") + "the checkout's sha256 over src/, shell/ and ui/ is unchanged after the plants phase");
    } finally {
      dropPlantsTree(tree, ROOT);
    }
    if (red !== PLANTS.length || !held) {
      dropScratch(SCRATCH, "answer-unopened");
      process.exit(1);
    }
  }
  let n = 0;
  for (const id of legs) {
    let ok = false;
    try { ok = await CHECKS[id](); }
    catch (e) { console.error(id + " " + (e && e.stack || e)); ok = false; }
    console.log((ok ? "ok   " : "FAIL ") + id);
    if (ok) n++;
  }
  dropScratch(SCRATCH, "answer-unopened");
  const skipped = PLANTS_OFF ? 1 : 0;
  console.log("#counts checks=" + (legs.length + (PLANTS_OFF ? 0 : 1)) + " skipped=" + skipped
    + " failed=" + (legs.length - n) + " expected=" + (legs.length + 1));
  console.log("answer-unopened " + (n + (PLANTS_OFF ? 0 : 1)) + "/" + (legs.length + 1) + (PLANTS_OFF ? ", 1 skipped" : ", plants " + PLANTS.length + "/" + PLANTS.length + " red"));
  process.exit(n === legs.length ? 0 : 1);
}

if (ONLY) {
  const fn = CHECKS[ONLY];
  if (!fn) { console.error("unknown " + ONLY); process.exit(2); }
  /* A check that throws has failed. */
  Promise.resolve().then(fn).catch((e) => { console.error(e && e.stack || e); return false; }).then((ok) => {
    console.log(ok ? "PLANT-GREEN" : "PLANT-RED");
    process.exit(ok ? 0 : 1);
  });
} else {
  main().catch((e) => {
    console.error(e && e.stack || e);
    try { dropScratch(SCRATCH, "answer-unopened"); } catch { /* the verdict is the error above */ }
    process.exit(1);
  });
}
