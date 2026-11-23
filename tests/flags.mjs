/* STUDIO'S HALF OF "THIS LOOKS WRONG": desks' flags read, grouped per card, kept or answered, and dropped after 12 editions.
 *
 *     node tests/flags.mjs [--keep]
 *
 * Node only, no Electron window. Runs on scratch projects and reads the pinned engine's vector file directly.
 */
import "./licensed-env.mjs";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import * as Engine from "../src/engine.mjs";
import * as Flags from "../src/flags.mjs";
import * as S from "../src/studio.mjs";
import { reviewProposal, readLog, unknownHeadKeys, REVIEW_LOG } from "../src/review.mjs";
import { publishFull, ARCHIVE, CATALOG_IN_ARCHIVE, DRAFT_FILE, editionsIn } from "../src/publish.mjs";
import { makeKeyFile, verifySignature } from "../src/sign.mjs";
import { newTeam, admit, writeTeam } from "../src/team.mjs";
import { countWaiting } from "../src/waiting.mjs";
import { clearScratch, dropScratch } from "./scratch.mjs";
import { loadPage } from "./page-stand-in.mjs";
import { copyPlants } from "./plant-copy.mjs";

const SELF = fileURLToPath(import.meta.url);
const HERE = path.dirname(SELF);
const ROOT = path.resolve(HERE, "..");
const SCRATCH = path.join(ROOT, "scratch", "flags");
const ONLY = process.env.FLAGS_ONLY || "";
/* The plant proofs are tests/plant-copy.mjs's, which skips each and counts the skip when plants are off; this file reads the
   switch too and says so in its own line (tests/plant-hold.mjs pk-off). */
const PLANTS_OFF = process.env.ETIUDA_PLANTS === "off";
const NL = String.fromCharCode(10);
const PREFIX = "etiuda-desk-branch" + NL;
const PASS = "passphrase for flags test key";

const PLANTS = [
  { mark: "flag-header-known", leg: "fl2", rel: "src/format-fields.mjs",
    line: "const DESK_FILE_HEADER = [\"grew\", \"desk\"]; /* plant:flag-header-known */" },
  { mark: "flag-validate-note-cap", leg: "fl3", rel: "src/flags.mjs",
    line: "const NOTE_CAP = 5000; /* plant:flag-validate-note-cap */" },
  { mark: "flag-validate-control", leg: "fl3", rel: "src/flags.mjs",
    line: "const CONTROL_RE = /$^/; /* plant:flag-validate-control */" },
  { mark: "flag-drop-removed", leg: "fl4", rel: "src/flags.mjs",
    line: "    const dropped = false; /* plant:flag-drop-removed */" },
  { mark: "flag-group-card", leg: "fl5", rel: "src/flags.mjs",
    line: "      const key = rec.card + \":\" + entry.deskId; /* plant:flag-group-card */" },
  { mark: "flag-keep-store", leg: "fl6", rel: "src/flags.mjs",
    line: "    const settled = new Set(); /* plant:flag-keep-store */" },
  { mark: "flag-changed-lang", leg: "fl8", rel: "src/flags.mjs",
    line: "      if (false && currentSeen !== rec.seen) { /* plant:flag-changed-lang */" },
  { mark: "flag-edition-bound", leg: "fl9", rel: "src/flags.mjs",
    line: "const ANSWER_EDITIONS_AFTER = 99; /* plant:flag-edition-bound */" },
  { mark: "flag-review-count", leg: "fl5", rel: "ui/app.js",
    line: "    return rows; /* plant:flag-review-count */" },
  { mark: "flag-answered-never", leg: "fl11", rel: "src/review.mjs",
    line: "const NEVER = new Set([\"id\", \"rev\", \"date\", \"hash\", \"sig\", \"modified\", \"evaluation\"].concat(DESK_FILE_HEADER)); /* plant:flag-answered-never */" },
  { mark: "flag-count-switch-off", leg: "fl2", rel: "src/flags.mjs",
    line: "let FLAGS_IN_REVIEW_COUNT = false; /* plant:flag-count-switch-off */" },
];
const EXPECTED = 11 + PLANTS.length + 1;

let asserted = 0, failed = 0, skipped = 0;
function check(cond, line) {
  asserted++;
  if (cond) process.stdout.write("  ok   " + line + "\n");
  else { failed++; process.stderr.write("  FAIL " + line + "\n"); }
}
function skip(line) {
  skipped++;
  process.stdout.write("  NOT RUN " + line + "\n");
}
async function leg(line, fn) {
  const id = String(line).split(" ")[0];
  if (ONLY && ONLY !== id) return;
  try {
    const ok = await fn();
    check(!!ok, line);
  } catch (e) {
    check(false, line + " (threw: " + String((e && e.stack) || e).split(NL).slice(0, 4).join(" | ").slice(0, 260) + ")");
  }
}

const clone = (v) => JSON.parse(JSON.stringify(v));
const readJson = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
const sha256 = (b) => crypto.createHash("sha256").update(b).digest("hex");

async function engineFrom(src, tag) {
  return import("data:text/javascript;base64," + Buffer.from(src).toString("base64") + "#" + tag);
}

function newDesk(name) {
  const pair = crypto.generateKeyPairSync("ed25519");
  const raw = pair.publicKey.export({ type: "spki", format: "der" }).subarray(-32);
  const boxPair = crypto.generateKeyPairSync("x25519");
  const box = boxPair.publicKey.export({ type: "spki", format: "der" }).subarray(-32).toString("hex");
  const id = "k-" + sha256(raw).slice(0, 16);
  const block = { id, key: raw.toString("hex"), box };
  if (name) block.name = name;
  return { id, block, pair };
}

function deskFile(F, V, E, desk, from, o) {
  const opts = o || {};
  const doc = clone(E.catalogToV2(E.catalogFromV2(clone(from))));
  if (opts.edit) opts.edit(doc);
  doc.id = opts.id || (desk.id + "-" + sha256(Buffer.from(String(from.id))).slice(0, 8));
  doc.rev = opts.rev || 1;
  doc.date = "2026-11-16";
  doc.modified = true;
  doc.grew = opts.grew !== undefined ? opts.grew : { id: String(from.id), rev: Number(from.rev), sha: "sha256:" + sha256(Buffer.from(V.v2SignedBytes(from))) };
  if (opts.desk !== null) doc.desk = opts.desk || clone(desk.block);
  else delete doc.desk;
  if (opts.flags !== undefined) doc.flags = opts.flags;
  delete doc.hash;
  delete doc.sig;
  doc.hash = F.contentHash(doc);
  if (!opts.unsigned) {
    doc.sig = { alg: "Ed25519", keyId: desk.id };
    const msg = opts.badSig
      ? Buffer.from("wrong-bytes")
      : Buffer.concat([Buffer.from(PREFIX, "utf8"), Buffer.from(V.v2SignedBytes(doc))]);
    doc.sig.value = crypto.sign(null, msg, desk.pair.privateKey).toString("hex");
  }
  return doc;
}

function writeDeskFile(shareDir, desk, doc, name) {
  const at = path.join(shareDir, "desks", desk.id, name || ("cat-" + desk.id.slice(2, 8) + ".ec"));
  fs.mkdirSync(path.dirname(at), { recursive: true });
  fs.writeFileSync(at, JSON.stringify(doc, null, 1) + "\n", "utf8");
  return at;
}

function captureStderr(fn) {
  const orig = process.stderr.write.bind(process.stderr);
  const lines = [];
  process.stderr.write = (chunk, enc, cb) => {
    lines.push(typeof chunk === "string" ? chunk : Buffer.from(chunk, enc).toString("utf8"));
    if (typeof enc === "function") enc();
    else if (typeof cb === "function") cb();
    return true;
  };
  return Promise.resolve().then(fn).finally(() => { process.stderr.write = orig; }).then((res) => ({ res, lines: lines.join("") }));
}

function runPinnedSettleFlags(editionDoc, deskFlags) {
  const v2Src = fs.readFileSync(path.join(ROOT, "engine", "pinned", "src", "modules", "catalog-v2.js"), "utf8")
    .replace(/\nexport \{[\s\S]*$/, "\n");
  const cfSrc = fs.readFileSync(path.join(ROOT, "engine", "pinned", "src", "modules", "card-flag.js"), "utf8")
    .replace(/^import .*$/gm, "")
    .replace(/\nexport \{[\s\S]*$/, "\n");
  const layer = { Flags: JSON.stringify(deskFlags), FlagEnds: "{}" };
  const body = v2Src + "\n" + cfSrc + "\nreturn { catalogFromV2, settleFlags, readEnds };";
  const fn = new Function("lyGet", "lySet", "lyDel", "cardFieldKey", "lang", "findCard", "eHasBranch", "eBranchReach", "hooks",
    body);
  const mod = fn(
    (k) => (Object.prototype.hasOwnProperty.call(layer, k) ? layer[k] : null),
    (k, v) => { layer[k] = v; return true; },
    (k) => { delete layer[k]; },
    (field, code) => {
      const m = { t: { en: "t", pl: "tPl" }, body: { en: "en", pl: "pl" }, note: { en: "note", pl: "notePl" } }[field];
      return m && m[code] ? m[code] : field + ":" + code;
    },
    "en",
    () => null,
    () => true,
    () => true,
    { scheduleDeskBranch: () => {}, rebuildCards: () => {} }
  );
  const runtimeCat = mod.catalogFromV2(editionDoc);
  const moved = mod.settleFlags(runtimeCat, editionDoc);
  return { moved, ends: mod.readEnds(), remainingFlags: JSON.parse(layer.Flags || "[]") };
}

async function main(argv) {
  clearScratch(SCRATCH);
  fs.mkdirSync(SCRATCH, { recursive: true });
  const F = await Engine.format();
  const V = Engine.sigRules();
  const pinSrc = fs.readFileSync(path.join(ROOT, "engine", "pinned", "src", "modules", "catalog-v2.js"), "utf8");
  const E = await engineFrom(pinSrc, "pinned");
  const vectors = readJson(path.join(ROOT, "engine", "pinned", "tests", "card-flag-vectors.json"));

  const projects = path.join(SCRATCH, "projects");
  fs.mkdirSync(projects, { recursive: true });
  const keyAt = path.join(SCRATCH, "lead.key");
  const keyObj = await makeKeyFile({ passphrase: PASS });
  fs.writeFileSync(keyAt, JSON.stringify(keyObj, null, 1) + "\n", "utf8");

  const makeCatalog = async (name) => {
    const share = path.join(SCRATCH, "share-" + name);
    fs.mkdirSync(share, { recursive: true });
    const made = await S.newProject(projects, "Flags-" + name, [{ code: "en", name: "English" }, { code: "pl", name: "Polish" }]);
    const dir = made.dir;
    const shelf = (await S.addTag(dir, "shelf", { en: "General", pl: "Ogolne" })).tag.id;
    const c1 = (await S.addCard(dir, shelf, "Hello", "Good day.")).card.id;
    await S.saveCard(dir, c1, { title: { pl: "Czesc" }, body: { pl: "Dzien dobry." } });
    const c2 = (await S.addCard(dir, shelf, "Refund", "Ask.")).card.id;
    await S.saveCard(dir, c2, {
      replies: { shape: "steps", blocks: [{ text: { en: "Ask.", pl: "Zapytaj." } }, { text: { en: "Raise.", pl: "Przekaz." } }] },
      note: { en: "Say it once." },
      title: { pl: "Zwrot" },
    });
    const pub = await S.publishProject(dir, { folder: share, notes: "Ed 1", now: "2026-11-16T01:00:00.000Z", key: keyAt, passphrase: PASS });
    if (pub.refused) throw new Error("makeCatalog publish refused: " + JSON.stringify(pub));
    const eds = editionsIn(dir);
    const ed1 = readJson(path.join(dir, ARCHIVE, eds[eds.length - 1], CATALOG_IN_ARCHIVE));
    return { dir, share, shelf, c1, c2, ed1, pub };
  };

  /* ---- 1. VECTORS & WORKED EXAMPLES ---------------------------------------------------------- */
  await leg("fl1 seen and f match every case in the pinned engine's card-flag-vectors.json and both worked examples", async () => {
    if (!Flags) return false;
    for (const c of vectors.seen.cases) {
      const got = Flags.flagSeenOfCard(c.card, c.lang);
      if (got !== c.seen) {
        process.stderr.write("       vector seen mismatch for " + c.name + ": got " + got + " want " + c.seen + "\n");
        return false;
      }
    }
    for (const c of vectors.f.cases) {
      const got = Flags.flagDigest(c.r);
      if (got !== c.f) {
        process.stderr.write("       vector f mismatch for " + c.r + ": got " + got + " want " + c.f + "\n");
        return false;
      }
    }
    const exPlain = Flags.flagSeenOfCard({ id: "c-ex1", bodyShape: "plain", title: { en: "Hello" }, body: { en: "Good day." } }, "en");
    const exSteps = Flags.flagSeenOfCard({ id: "c-ex2", bodyShape: "steps", title: { en: "Refund" }, body: { en: "[step]\nAsk.\n\n[step]\nRaise." }, note: { en: "Say it once." } }, "en");
    return exPlain === "9601b12f2c479b768aec85ca903764303f4d9021f95fe26f77e4441b76cc769e"
      && exSteps === "b6ab3b2f9eb0e6c487f3db46ba56e5449199c3b2c666226dba294dbcdf1229d0";
  });

  /* ---- 2. ONE FLAG, NO EDIT, NO WARNING, REVIEW COUNT ON TOGETHER WITH STACK ITEM ------------- */
  await leg("fl2 genuine rostered desk with one flag and no edit waits, raises Review count by 1 by default, and gathers a flag item in the stack", async () => {
    if (!Flags) return false;
    const defaultOn = Flags.flagsInReviewCount() === true;
    const p = await makeCatalog("fl2");
    const ala = newDesk("Ala");
    const draftBefore = fs.readFileSync(path.join(p.dir, DRAFT_FILE), "utf8");
    const card1 = readJson(path.join(p.dir, DRAFT_FILE)).cards.find((c) => c.id === p.c1);
    const seen1 = Flags.flagSeenOfCard(card1, "en");
    const r1 = "00112233445566778899aabbccddeeff";
    const doc = deskFile(F, V, E, ala, p.ed1, { flags: [{ card: p.c1, lang: "en", seen: seen1, r: r1, note: "Looks odd" }] });
    const at = writeDeskFile(p.share, ala, doc);

    const waiting = Flags.flagsWaiting(p.dir);
    const listedOn = await S.listProposals(p.dir);
    const rowOn = listedOn.proposals.find((x) => x.file === at);
    const waitOn = await countWaiting({ projects: [{ dir: p.dir, name: "Flags-fl2" }], listProposals: (d) => S.listProposals(d) });
    const opened = await S.openProposal(p.dir, at);
    const rev = await reviewProposal({ project: p.dir, file: at, rules: [], write: false });

    const { page, node } = loadPage({ api: { proposals: async () => clone(listedOn), open: async () => clone(await S.openProject(p.dir)) } });
    page.S.open = await S.openProject(p.dir);
    page.S.open.lint = { errors: 0, warnings: 0, rows: [] };
    page.S.screen = "project";
    page.S.section = "proposals";
    page.S.rv = page.rvState(clone(listedOn));
    page.S.stack = { dir: p.dir, files: {}, fresh: new Set(), answers: {}, changed: {}, seen: {}, later: {} };
    page.paintRail();
    page.paintDiscs();
    page.paintProposalList();
    const listHtmlOn = node("#main").innerHTML;
    const rcOn = page.__get("reviewCount")();
    const gatheredOn = page.__get("stkGather")();
    const discTitleOn = node("#discReview").title;
    const railHtmlOn = node("#rail").innerHTML;
    const rvFilesOn = page.__get("rvFiles")();

    /* Also with 1 real edit + 1 flag on Bob while Ala already flagged c1: Bob pending is 2, Review count is 2 (1 edit + 1 grouped card) */
    const bob = newDesk("Bob");
    const bobDoc = deskFile(F, V, E, bob, p.ed1, {
      edit: (d) => { d.cards.find((c) => c.id === p.c1).body.en = "Edited once."; },
      flags: [{ card: p.c1, lang: "en", seen: seen1, r: "00112233445566778899aabbccddeefa" }],
    });
    const bobAt = writeDeskFile(p.share, bob, bobDoc, "cat-bob.ec");
    const listedEditOn = await S.listProposals(p.dir);
    const bobRowOn = listedEditOn.proposals.find((x) => x.file === bobAt);
    page.S.rv = page.rvState(clone(listedEditOn));
    const rcEditOn = page.__get("reviewCount")();
    const waitEditOn = await countWaiting({ projects: [{ dir: p.dir, name: "Flags-fl2" }], listProposals: (d) => S.listProposals(d) });
    fs.rmSync(bobAt);

    /* When switch is toggled off, count drops back to 0 */
    let rcOff = -1;
    Flags.setFlagsInReviewCount(false);
    try {
      const listedOff = await S.listProposals(p.dir);
      page.S.rv = page.rvState(clone(listedOff));
      rcOff = page.__get("reviewCount")();
    } finally {
      Flags.setFlagsInReviewCount(true);
    }

    const checks = {
      defaultOn,
      waitingKept: waiting.length === 1 && waiting[0].card === p.c1 && waiting[0].count === 1 && !waiting[0].changed,
      rowOn: !!(rowOn && rowOn.ok && rowOn.pending === 1 && rowOn.flags === 1 && listedOn.flagsCounted === true && listedOn.flags.length === 1),
      waitOn: waitOn.proposalsWaiting === 1 && waitOn.totalWaiting === 1,
      rcOn: rcOn === 1,
      stackItem: gatheredOn.length === 1 && gatheredOn[0].kind === "flag" && gatheredOn[0].cardId === p.c1,
      decidedOn: listHtmlOn.indexOf("Decided") < 0,
      discOn: /^Review:\s*1$/.test(discTitleOn),
      railOn: /data-v="proposals"[\s\S]*?<span class="num">1<\/span>/.test(railHtmlOn),
      rvFilesOn: /^1\s+file$/.test(rvFilesOn),
      editOn: !!(bobRowOn && bobRowOn.pending === 2 && rcEditOn === 2 && waitEditOn.proposalsWaiting === 2),
      rcOff: rcOff === 0,
      opened: !!(opened.ok && !opened.unknownHead && unknownHeadKeys(doc, []).length === 0),
      rev: !!(rev.ok && rev.changes.length === 0),
      draftUntouched: fs.readFileSync(path.join(p.dir, DRAFT_FILE), "utf8") === draftBefore,
    };
    const bad = Object.keys(checks).filter((k) => !checks[k]);
    if (bad.length) process.stderr.write("       fl2 failed: " + bad.join(", ") + "\n");
    return bad.length === 0;
  });

  /* ---- 3. MALFORMED LISTS -------------------------------------------------------------------- */
  await leg("fl3 each malformed flags list is ignored whole, logs one line with desk id and rule without note, and keeps edits", async () => {
    if (!Flags) return false;
    const p = await makeCatalog("fl3");
    const card1 = readJson(path.join(p.dir, DRAFT_FILE)).cards.find((c) => c.id === p.c1);
    const seen1 = Flags.flagSeenOfCard(card1, "en");
    const valid = { card: p.c1, lang: "en", seen: seen1, r: "11112222333344445555666677778888" };
    const CANARY = "SECRET-NOTE-NEVER-LOG";
    const cases = [
      ["too-long", Array.from({ length: 101 }, (_, i) => ({ card: p.c1, lang: "en", seen: seen1, r: String(i).padStart(32, "0") }))],
      ["extra-key", [Object.assign({}, valid, { extra: 1, note: CANARY })]],
      ["bad-r", [Object.assign({}, valid, { r: "XYZ", note: CANARY })]],
      ["bad-seen", [Object.assign({}, valid, { seen: "1234", note: CANARY })]],
      ["note-501", [Object.assign({}, valid, { note: CANARY + "x".repeat(501 - CANARY.length) })]],
      ["control-char", [Object.assign({}, valid, { note: CANARY + "\u0007" })]],
      ["unknown-card", [Object.assign({}, valid, { card: "c-no-such-card", note: CANARY })]],
    ];
    for (let i = 0; i < cases.length; i++) {
      const [tag, badFlags] = cases[i];
      const desk = newDesk("Desk-" + tag);
      const editedBody = "Edited by " + tag;
      const doc = deskFile(F, V, E, desk, p.ed1, {
        edit: (d) => { d.cards.find((c) => c.id === p.c2).body.en = editedBody; },
        flags: badFlags.concat([valid]),
      });
      const at = writeDeskFile(p.share, desk, doc, "mal-" + tag + ".ec");
      const got = await captureStderr(() => S.listProposals(p.dir));
      const waiting = Flags.flagsWaiting(p.dir);
      const row = got.res.proposals.find((x) => x.file === at);
      const rev = await reviewProposal({ project: p.dir, file: at, rules: [], write: false });
      fs.rmSync(at);
      if (waiting.length !== 0) { process.stderr.write("       case " + tag + " let flag wait\n"); return false; }
      const logLines = got.lines.split(/\r?\n/).filter((l) => l.includes(desk.id));
      if (logLines.length !== 1 || got.lines.includes(CANARY)) {
        process.stderr.write("       case " + tag + " bad log: " + JSON.stringify(got.lines) + "\n");
        return false;
      }
      if (!row || !row.ok || row.pending !== 1 || !rev.ok || !rev.changes.some((c) => c.id === p.c2)) {
        process.stderr.write("       case " + tag + " dropped edit\n");
        return false;
      }
    }
    return true;
  });

  /* ---- 4. UNTRUSTED OR REMOVED DESK ---------------------------------------------------------- */
  await leg("fl4 non-genuine file or desk dropped from roster never has waiting flags", async () => {
    if (!Flags) return false;
    const p = await makeCatalog("fl4");
    const card1 = readJson(path.join(p.dir, DRAFT_FILE)).cards.find((c) => c.id === p.c1);
    const seen1 = Flags.flagSeenOfCard(card1, "en");
    const r = "22223333444455556666777788889999";

    /* Bad signature */
    const badDesk = newDesk("Bad");
    const badDoc = deskFile(F, V, E, badDesk, p.ed1, { badSig: true, flags: [{ card: p.c1, lang: "en", seen: seen1, r }] });
    const badAt = writeDeskFile(p.share, badDesk, badDoc);
    if (Flags.flagsWaiting(p.dir).length !== 0) return false;
    fs.rmSync(badAt);

    /* Roster drops desk: team file holds Ala, not Bob */
    const ala = newDesk("Ala");
    const bob = newDesk("Bob");
    const alaDoc = deskFile(F, V, E, ala, p.ed1, { flags: [{ card: p.c1, lang: "en", seen: seen1, r: "33334444555566667777888899990000" }] });
    const teamKey = crypto.randomBytes(32);
    let team = newTeam({ catalogs: [p.ed1.id], lead: { keyId: keyObj.keyId, public: keyObj.public }, sealed: false });
    team = admit(team, alaDoc, ala.id, teamKey);
    await writeTeam(p.share, team, { key: keyAt, passphrase: PASS });
    const bobDoc = deskFile(F, V, E, bob, p.ed1, { flags: [{ card: p.c1, lang: "en", seen: seen1, r }] });
    writeDeskFile(p.share, bob, bobDoc);
    if (Flags.flagsWaiting(p.dir).length !== 0) return false;
    if ((await S.listProposals(p.dir)).flags.length !== 0) return false;

    /* Also when passed via `removed` (historical record of removed desk) */
    const alaAt = writeDeskFile(p.share, ala, alaDoc);
    const relAla = "desks/" + ala.id + "/" + path.basename(alaAt);
    const removed = { [ala.id]: { at: Date.now(), files: { [relAla]: sha256(fs.readFileSync(alaAt)) } } };
    const listedRemoved = await S.listProposals(p.dir, { removed });
    return Flags.flagsWaiting(p.dir, { removed }).length === 0 && listedRemoved.flags.length === 0;
  });

  /* ---- 5. THREE DESKS ON ONE CARD & CHANGED SINCE -------------------------------------------- */
  await leg("fl5 three desks on one card produce one waiting thing, count 3, both notes with desk labels, Review count +1, and changed-since mark", async () => {
    if (!Flags) return false;
    const p = await makeCatalog("fl5");
    const card1 = readJson(path.join(p.dir, DRAFT_FILE)).cards.find((c) => c.id === p.c1);
    const seen1 = Flags.flagSeenOfCard(card1, "en");
    const ala = newDesk("Ala");
    const ola = newDesk("Ola");
    const nameless = newDesk("");

    writeDeskFile(p.share, ala, deskFile(F, V, E, ala, p.ed1, { flags: [{ card: p.c1, lang: "en", seen: seen1, r: "aaaa0000000000000000000000000001", note: "Note A" }] }));
    writeDeskFile(p.share, ola, deskFile(F, V, E, ola, p.ed1, { flags: [{ card: p.c1, lang: "en", seen: seen1, r: "bbbb0000000000000000000000000002", note: "Note O" }] }));
    writeDeskFile(p.share, nameless, deskFile(F, V, E, nameless, p.ed1, { flags: [{ card: p.c1, lang: "pl", seen: Flags.flagSeenOfCard(card1, "pl"), r: "cccc0000000000000000000000000003" }] }));

    const w = Flags.flagsWaiting(p.dir);
    const listedOn = await S.listProposals(p.dir);
    const { page } = loadPage({ api: {} });
    page.S.open = await S.openProject(p.dir);
    page.S.open.lint = { errors: 0, warnings: 0, rows: [] };
    page.S.rv = page.rvState(clone(listedOn));
    page.S.stack = { dir: p.dir, files: {}, fresh: new Set(), answers: {}, changed: {}, seen: {}, later: {} };
    const rcOn = page.__get("reviewCount")();
    const gathered = page.__get("stkGather")();

    /* Edit card in en before publish -> marked changed, not dropped */
    await S.saveCard(p.dir, p.c1, { body: { en: "Updated text." } });
    const wChanged = Flags.flagsWaiting(p.dir);

    return w.length === 1 && w[0].card === p.c1 && w[0].count === 3 && !w[0].changed
      && w[0].langs.slice().sort().join(",") === "en,pl"
      && w[0].notes.length === 2
      && w[0].notes.some((n) => n.label === "Ala" && n.note === "Note A")
      && w[0].notes.some((n) => n.label === "Ola" && n.note === "Note O")
      && rcOn === 1
      && gathered.length === 1 && gathered[0].kind === "flag" && gathered[0].cardId === p.c1
      && wChanged.length === 1 && wChanged[0].changed === true;
  });

  /* ---- 6. KEPT ANSWER ------------------------------------------------------------------------ */
  await leg("fl6 flagKeep stops waiting, writes decision to review log, ignores repeat read, and lets a new flag on same card wait", async () => {
    if (!Flags) return false;
    const p = await makeCatalog("fl6");
    const card1 = readJson(path.join(p.dir, DRAFT_FILE)).cards.find((c) => c.id === p.c1);
    const seen1 = Flags.flagSeenOfCard(card1, "en");
    const ala = newDesk("Ala");
    const rOld = "dddd1111222233334444555566667777";
    const rNew = "eeee1111222233334444555566667777";
    const at = writeDeskFile(p.share, ala, deskFile(F, V, E, ala, p.ed1, { flags: [{ card: p.c1, lang: "en", seen: seen1, r: rOld, note: "First flag note" }] }));

    const kept = Flags.flagKeep(p.dir, p.c1);
    const afterKeep = Flags.flagsWaiting(p.dir);
    const log = readLog(p.dir);
    const hasLog = log.reviews.some((e) => e.flagKept && e.flagKept.card === p.c1 && e.flagKept.f.includes(Flags.flagDigest(rOld)));
    /* Re-reading same file does not bring it back */
    const listedAgain = await S.listProposals(p.dir);
    /* New flag (new r) on same card DOES wait */
    writeDeskFile(p.share, ala, deskFile(F, V, E, ala, p.ed1, { rev: 2, flags: [{ card: p.c1, lang: "en", seen: seen1, r: rNew }] }), path.basename(at));
    const afterNew = Flags.flagsWaiting(p.dir);

    return kept && kept.settled === 1
      && afterKeep.length === 0
      && hasLog
      && listedAgain.flags.length === 0
      && afterNew.length === 1 && afterNew[0].card === p.c1;
  });

  /* ---- 7. PUBLISH AFTER KEPT + PINNED ENGINE CHECK ------------------------------------------- */
  await leg("fl7 publish after kept puts {f, o:'kept'} inside signed bytes and pinned engine accepts and settles it", async () => {
    if (!Flags) return false;
    const p = await makeCatalog("fl7");
    const card1 = readJson(path.join(p.dir, DRAFT_FILE)).cards.find((c) => c.id === p.c1);
    const seen1 = Flags.flagSeenOfCard(card1, "en");
    const ala = newDesk("Ala");
    const r1 = "1234567890abcdef1234567890abcdef";
    const f1 = Flags.flagDigest(r1);
    writeDeskFile(p.share, ala, deskFile(F, V, E, ala, p.ed1, { flags: [{ card: p.c1, lang: "en", seen: seen1, r: r1 }] }));
    Flags.flagKeep(p.dir, p.c1);

    const preview = Flags.flagsAnswered(p.dir);
    const pub2 = await publishFull({ project: p.dir, folder: p.share, notes: "Ed 2", now: "2026-11-16T02:00:00.000Z", key: keyAt, passphrase: PASS });
    const ed2 = readJson(pub2.ec);
    const sigOk = await verifySignature(ed2, keyObj.public);
    const eng = runPinnedSettleFlags(ed2, [{ card: p.c1, lang: "en", seen: seen1, r: r1 }]);

    return preview.length === 1 && preview[0].f === f1 && preview[0].o === "kept"
      && Array.isArray(ed2.answered) && ed2.answered.length === 1
      && ed2.answered[0].f === f1 && ed2.answered[0].o === "kept"
      && sigOk
      && eng.moved && eng.ends[p.c1] && eng.ends[p.c1].outcome === "kept" && eng.remainingFlags.length === 0;
  });

  /* ---- 8. PUBLISH AFTER WORD CHANGE ---------------------------------------------------------- */
  await leg("fl8 publish after editing card words in flagged language emits changed; editing another language keeps flag waiting", async () => {
    if (!Flags) return false;
    const p = await makeCatalog("fl8");
    const card1 = readJson(path.join(p.dir, DRAFT_FILE)).cards.find((c) => c.id === p.c1);
    const seenEn = Flags.flagSeenOfCard(card1, "en");
    const ala = newDesk("Ala");
    const rEn = "abcdef0123456789abcdef0123456789";
    const fEn = Flags.flagDigest(rEn);
    writeDeskFile(p.share, ala, deskFile(F, V, E, ala, p.ed1, { flags: [{ card: p.c1, lang: "en", seen: seenEn, r: rEn }] }));

    /* Change PL only -> not answered, still waiting */
    await S.saveCard(p.dir, p.c1, { body: { pl: "Nowy polski tekst." } });
    if (Flags.flagsAnswered(p.dir).length !== 0) return false;
    const pub2 = await publishFull({ project: p.dir, folder: p.share, notes: "Ed 2", now: "2026-11-16T02:00:00.000Z", key: keyAt, passphrase: PASS });
    const ed2 = readJson(pub2.ec);
    if (ed2.answered != null || Flags.flagsWaiting(p.dir).length !== 1) return false;

    /* Now change EN -> answered has changed, and after publish flag stops waiting */
    await S.saveCard(p.dir, p.c1, { body: { en: "Updated English words." } });
    if (Flags.flagsAnswered(p.dir).length !== 1) return false;
    const pub3 = await publishFull({ project: p.dir, folder: p.share, notes: "Ed 3", now: "2026-11-16T03:00:00.000Z", key: keyAt, passphrase: PASS });
    const ed3 = readJson(pub3.ec);
    return Array.isArray(ed3.answered) && ed3.answered.length === 1
      && ed3.answered[0].f === fEn && ed3.answered[0].o === "changed"
      && Flags.flagsWaiting(p.dir).length === 0;
  });

  /* ---- 9. TWELFTH EDITION CARRIES, THIRTEENTH DROPS ------------------------------------------ */
  await leg("fl9 12 editions published after first carry keep the answer; the 13th after drops it", async () => {
    if (!Flags) return false;
    const p = await makeCatalog("fl9");
    const card1 = readJson(path.join(p.dir, DRAFT_FILE)).cards.find((c) => c.id === p.c1);
    const seen1 = Flags.flagSeenOfCard(card1, "en");
    const ala = newDesk("Ala");
    const r1 = "99998888777766665555444433332222";
    const f1 = Flags.flagDigest(r1);
    writeDeskFile(p.share, ala, deskFile(F, V, E, ala, p.ed1, { flags: [{ card: p.c1, lang: "en", seen: seen1, r: r1 }] }));
    Flags.flagKeep(p.dir, p.c1);

    /* Edition 1 of answer (first carried), then 1..12 after first carried -> all carry it; 13th after drops it */
    const carried = [];
    for (let i = 0; i <= 13; i++) {
      const hh = String(2 + i).padStart(2, "0");
      const pub = await publishFull({ project: p.dir, folder: p.share, notes: "Run " + i, now: "2026-11-16T" + hh + ":00:00.000Z", key: keyAt, passphrase: PASS });
      const doc = readJson(pub.ec);
      carried.push(Array.isArray(doc.answered) && doc.answered.some((x) => x.f === f1));
    }
    const afterAll = Flags.flagsWaiting(p.dir);
    return carried.slice(0, 13).every(Boolean) && carried[13] === false && afterAll.length === 0;
  });

  /* ---- 10. NO NOTE OR TIME IN ANSWERED, LOG, OR STORE ---------------------------------------- */
  await leg("fl10 no desk note and no time ever appear in answered, log line, review log, or project flag store", async () => {
    if (!Flags) return false;
    const p = await makeCatalog("fl10");
    const card1 = readJson(path.join(p.dir, DRAFT_FILE)).cards.find((c) => c.id === p.c1);
    const seen1 = Flags.flagSeenOfCard(card1, "en");
    const ala = newDesk("Ala");
    const NOTE_SECRET = "CANARY-DESK-FLAG-NOTE-12345";
    const r1 = "fedcba9876543210fedcba9876543210";
    writeDeskFile(p.share, ala, deskFile(F, V, E, ala, p.ed1, {
      flags: [{ card: p.c1, lang: "en", seen: seen1, r: r1, note: NOTE_SECRET }],
    }));
    Flags.flagKeep(p.dir, p.c1);
    const pub = await publishFull({ project: p.dir, folder: p.share, notes: "Ed 2", now: "2026-11-16T02:00:00.000Z", key: keyAt, passphrase: PASS });
    const ed2 = readJson(pub.ec);
    const ansJson = JSON.stringify(ed2.answered);
    const logJson = fs.readFileSync(path.join(p.dir, REVIEW_LOG), "utf8");
    const storePath = path.join(p.dir, "flags.json");
    const storeJson = fs.existsSync(storePath) ? fs.readFileSync(storePath, "utf8") : "";
    const hasTimeInStore = /\b(at|time|date|timestamp)\b|\d{4}-\d{2}-\d{2}/i.test(storeJson);
    const exactKeys = Array.isArray(ed2.answered) && ed2.answered.every((e) => Object.keys(e).sort().join(",") === "f,o");
    return exactKeys
      && !ansJson.includes(NOTE_SECRET)
      && !ansJson.includes(ala.id)
      && !ansJson.includes("Ala")
      && !/\d{4}-\d{2}-\d{2}/.test(ansJson)
      && !logJson.includes(NOTE_SECRET)
      && !storeJson.includes(NOTE_SECRET)
      && storeJson.length > 0 && !hasTimeInStore;
  });

  /* ---- 11. HEADER `answered` FROM DESK NEVER OFFERED, COPIED, OR WARNED ---------------------- */
  await leg("fl11 genuine desk file carrying answered leaves draft unchanged, offers no change, raises no warning, and next edition keeps project answers", async () => {
    if (!Flags) return false;
    const p = await makeCatalog("fl11");
    const card1 = readJson(path.join(p.dir, DRAFT_FILE)).cards.find((c) => c.id === p.c1);
    const seen1 = Flags.flagSeenOfCard(card1, "en");
    const ala = newDesk("Ala");
    const bob = newDesk("Bob");
    const rAla = "a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1a1";
    const fAla = Flags.flagDigest(rAla);
    writeDeskFile(p.share, ala, deskFile(F, V, E, ala, p.ed1, {
      flags: [{ card: p.c1, lang: "en", seen: seen1, r: rAla }],
    }));
    Flags.flagKeep(p.dir, p.c1);

    const draftBefore = fs.readFileSync(path.join(p.dir, DRAFT_FILE), "utf8");
    const foreignAnswered = [{ f: "0".repeat(64), o: "kept" }, { f: "f".repeat(64), o: "changed" }];
    const bobDoc = deskFile(F, V, E, bob, p.ed1, {
      edit: (d) => { d.answered = foreignAnswered; },
    });
    const bobAt = writeDeskFile(p.share, bob, bobDoc);
    const opened = await S.openProposal(p.dir, bobAt);
    const rev = await reviewProposal({
      project: p.dir,
      file: bobAt,
      rules: [{ verb: "accept", pattern: "*" }],
      from: "Bob",
      write: true,
    });
    const draftAfterNoEdit = fs.readFileSync(path.join(p.dir, DRAFT_FILE), "utf8");

    /* Also verify accepting a real card edit from a desk file carrying answered never copies answered into draft */
    const bobDoc2 = deskFile(F, V, E, bob, p.ed1, {
      rev: 2,
      edit: (d) => {
        d.answered = foreignAnswered;
        d.cards.find((c) => c.id === p.c1).body.en = "Edited beside answered.";
      },
    });
    const bobAt2 = writeDeskFile(p.share, bob, bobDoc2, "cat-" + bob.id.slice(2, 8) + "-2.ec");
    const rev2 = await reviewProposal({
      project: p.dir,
      file: bobAt2,
      rules: [{ verb: "accept", pattern: "*" }],
      from: "Bob",
      write: true,
    });
    const draftAfterEdit = readJson(path.join(p.dir, DRAFT_FILE));

    const pub2 = await publishFull({ project: p.dir, folder: p.share, notes: "Ed 2", now: "2026-11-16T02:00:00.000Z", key: keyAt, passphrase: PASS });
    const ed2 = readJson(pub2.ec);

    return unknownHeadKeys(bobDoc, []).length === 0
      && opened.ok && !opened.unknownHead
      && rev.ok && rev.changes.length === 0
      && draftAfterNoEdit === draftBefore
      && rev2.ok && rev2.applied.length === 1 && !rev2.changes.some((c) => c.path === "answered")
      && draftAfterEdit.answered === undefined
      && Array.isArray(ed2.answered) && ed2.answered.length === 1
      && ed2.answered[0].f === fAla && ed2.answered[0].o === "kept";
  });

  if (!ONLY) {
    /* ---- 11. PLANTS -------------------------------------------------------------------------- */
    if (PLANTS_OFF) process.stdout.write("  plants off (ETIUDA_PLANTS=off): each of the " + PLANTS.length + " is counted NOT RUN\n");
    copyPlants({ root: ROOT, self: SELF, label: "flags", onlyVar: "FLAGS_ONLY", plants: PLANTS, check, skip });
  }

  if (argv.indexOf("--keep") < 0) dropScratch(SCRATCH, "flags");
  process.stdout.write("#counts checks=" + asserted + " failed=" + failed + " skipped=" + skipped + " expected=" + EXPECTED + "\n");
  if (!ONLY && asserted + skipped !== EXPECTED) {
    process.stderr.write("SUITE DID NOT COMPLETE: " + asserted + " ran, " + skipped + " skipped of " + EXPECTED + "\n");
    return 78;
  }
  process.stdout.write("\nflags  " + asserted + " assertion(s), " + failed + " failure(s)" + (skipped ? ", " + skipped + " NOT RUN" : "") + "\n");
  return failed ? 1 : 0;
}

main(process.argv.slice(2)).then((c) => process.exit(c), (e) => {
  process.stderr.write(String((e && e.stack) || e) + "\n");
  process.exit(2);
});
