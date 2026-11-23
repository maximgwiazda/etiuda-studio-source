/* A DESK'S CATALOG IMPORTED AS A NEW PROJECT IS NAMED FOR WHAT IT IS (sense pass finding 21; the pivot plan's item 13,
 * approved 2026-10-15).
 *
 *     node tests/import-name.mjs
 *
 * "Import as a new catalog" on a row reading "another catalog: North quay notes" landed a project named "brought-" and
 * eight hex digits, and its first publish suggested that as the file every desk would read. The project is named from the
 * title the desk's in-use file gives the catalog, else the catalog's own name, else "<desk name>'s catalog" in the
 * language the lead reads Studio in, and the first publish suggests its file name from that name.
 *
 *   in1  named by the in-use title: the project's name and folder are the title, and the publish suggests the title's file
 *   in2  with no title, by the catalog's own name; landed twice, the second takes the next number and still suggests the
 *        name's file, not a numbered one
 *   in3  with neither, after the desk, in English and in Polish, and the publish suggests that name's file; no "brought-"
 *   in4  the answer due to land carries the title the desk's in-use file gives its catalog
 *   in5  the shell lands it with that title, the desk's name on the roster and the page's language
 *   in6  where the desk's in-use file names another catalog than the copy that came back, its title names nothing, and
 *        the project takes the copy's own name (the test architect's condition 1 on 27a7110)
 *   in7  a name is cut at 120 characters counted by code point, so a character outside the basic plane stays whole
 *        (condition 4); a bidirectional override is dropped and a name of dots alone falls through (his two
 *        recommendations)
 *
 * Each check is planted red first: the child runs that one check against the planted source and must print PLANT-RED, and
 * the source is put back by its sha256 before the next plant. Every word in the fixtures is invented.
 *
 * Node only, no window. Exit 0 when every check holds, 1 when any fails.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { plantText } from "./plant-copy.mjs";
import { fileURLToPath } from "node:url";
import * as Engine from "../src/engine.mjs";
import { jsWithoutComments } from "./source-text.mjs";
import { clearScratch, dropScratch } from "./scratch.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SCRATCH = path.join(ROOT, "scratch", "import-name");
const SELF = fileURLToPath(import.meta.url);
/* Set before the first plant. The child runs from this copy, so its ROOT is the copy. */
let tree = null;
const ONLY = process.env.IMPORT_NAME_ONLY || "";
const PLANTS_OFF = process.env.ETIUDA_PLANTS === "off";
const D = Engine.deskRules();
const SEAL = Engine.sealRules();

const TITLE = "North quay notes";
const OWN_NAME = "Lantern rota";

/* The least a catalog the pinned loader takes carries: one language, one shelf, one plain card. */
function catalogDoc(id, name) {
  const doc = { format: 2, kind: "etiuda-catalog", id, rev: 2, langs: [{ code: "en", label: "English" }],
    tags: [{ id: "t-lanterns", kind: "shelf", label: { en: "Lanterns" } }],
    cards: [{ id: "c-lantern-shift", shelf: "t-lanterns", bodyShape: "plain", title: { en: "Lantern shift" },
      body: { en: "The lantern is lit at dusk by the pier keeper." } }] };
  if (name) doc.name = name;
  return doc;
}
function place(dir) {
  const root = path.join(SCRATCH, dir, crypto.randomBytes(4).toString("hex"));
  const temp = path.join(root, "temp");
  fs.mkdirSync(temp, { recursive: true });
  return { root: path.join(root, "projects"), temp };
}
async function landed(where, doc, o) {
  const S = await import("../src/studio.mjs");
  const got = await S.landCatalog(where.root, doc, where.temp, o);
  const plan = await S.publishPlan(got.dir, {});
  const project = JSON.parse(fs.readFileSync(path.join(got.dir, "project.json"), "utf8"));
  return { got, plan, project, folder: path.basename(got.dir) };
}
async function slugOf(text) {
  const Pub = await import("../src/publish.mjs");
  return Pub.suggestFileName(text, null, "any-id");
}
function no(id, why) {
  console.error(id + " " + why);
  return false;
}

async function checkIn1() {
  const w = place("in1");
  const r = await landed(w, catalogDoc("north-quay", OWN_NAME), { title: TITLE, desk: "Quay desk", lang: "en" });
  const ok = r.got.name === TITLE && r.folder === TITLE && r.plan.name === TITLE && r.plan.fileName === "north-quay-notes.ec"
    && r.project.displayName === TITLE && !JSON.stringify(r.project).includes("brought-");
  if (!ok) return no("in1", JSON.stringify({ name: r.got.name, folder: r.folder, plan: [r.plan.name, r.plan.fileName], project: r.project }));
  return true;
}
async function checkIn2() {
  const w = place("in2");
  const a = await landed(w, catalogDoc("lantern-rota", OWN_NAME), { title: "", desk: "Quay desk", lang: "en" });
  const b = await landed(w, catalogDoc("lantern-rota", OWN_NAME), { desk: "Quay desk", lang: "en" });
  const ok = a.got.name === OWN_NAME && a.plan.fileName === "lantern-rota.ec"
    && b.got.name === OWN_NAME + " 2" && b.folder === OWN_NAME + " 2" && b.plan.fileName === "lantern-rota.ec"
    && a.got.dir !== b.got.dir;
  if (!ok) return no("in2", JSON.stringify({ a: [a.got.name, a.plan.fileName], b: [b.got.name, b.folder, b.plan.fileName] }));
  return true;
}
async function checkIn3() {
  const w = place("in3");
  const en = await landed(w, catalogDoc("pier-desk-own"), { desk: "Quay desk", lang: "en" });
  const pl = await landed(w, catalogDoc("pier-desk-own"), { desk: "Quay desk", lang: "pl" });
  const bare = await landed(w, catalogDoc("pier-desk-own"), { lang: "en" });
  const enName = "Quay desk's catalog", plName = "Katalog ze stanowiska Quay desk";
  const ok = en.got.name === enName && en.plan.fileName === await slugOf(enName)
    && pl.got.name === plName && pl.plan.fileName === await slugOf(plName)
    && bare.got.name === "A desk's catalog"
    && ![en, pl, bare].some((r) => /brought/.test(r.got.name + r.plan.fileName + JSON.stringify(r.project)));
  if (!ok) return no("in3", JSON.stringify([en, pl, bare].map((r) => [r.got.name, r.plan.fileName])));
  return true;
}

/* A sealed share with one roster desk, its in-use file naming the catalog by TITLE, the lead's ask for it and its answer. */
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
function writeEc(file, team, inner) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(SEAL.sealCatalog(team.key, team.id, team.epoch, JSON.stringify(inner)), null, 1) + "\n", "utf8");
}
/* An answer under the team key as a desk writes it since board 962's stage 0b: signed by the desk over the ask and the team. */
function signedAnswer(desk, askId, teamId, sha, catalog) {
  const doc = { format: 1, kind: "etiuda-catalog-answer", ask: String(askId), team: String(teamId), sha256: sha, catalog,
    sig: { alg: "Ed25519", keyId: desk.id } };
  doc.sig.value = crypto.sign(null, Engine.answerLeadRules().answerLeadSignedBytes(doc), desk.pair.privateKey).toString("hex");
  return doc;
}
/* What an answer is judged by, as the shell's boxContext hands it. */
function judged(team, desk, catalogs) {
  return { team: team.id, epoch: team.epoch, catalogs, content: null, deskKeys: { [desk.id]: desk.pub } };
}
async function checkIn4() {
  const Use = await import("../src/catalog-use.mjs");
  const share = path.join(SCRATCH, "in4", crypto.randomBytes(4).toString("hex"));
  const team = { id: "t-" + crypto.randomBytes(8).toString("hex"), key: crypto.randomBytes(32), epoch: 1 };
  const desk = deskPair("Quay desk"), lead = leadPair();
  const doc = catalogDoc("north-quay", OWN_NAME), pin = D.signedSha(doc);
  const use = { format: 1, kind: "etiuda-in-use", desk: { id: desk.id, key: desk.pub, box: "ab".repeat(32), name: desk.name },
    at: "2026-04-02T08:15:00.000Z", catalog: { id: "north-quay", rev: 2, sha256: pin, signer: "", source: "file", title: TITLE },
    sig: { alg: "Ed25519", keyId: desk.id } };
  use.sig.value = crypto.sign(null, D.branchSignedBytes(use), desk.pair.privateKey).toString("hex");
  writeEc(path.join(share, "desks", desk.id, "in-use.ec"), team, use);
  const ask = Use.buildAsk({ desk: desk.id, sha256: pin, lead });
  Use.writeAsk(share, desk.id, ask);
  writeEc(path.join(share, "desks", desk.id, "catalog-answer.ec"), team, signedAnswer(desk, ask.id, team.id, pin, doc));
  const due = Use.answersDue(share, { [team.id]: { 1: team.key } }, {}, Object.assign({ lead, roster: [desk.id] }, judged(team, desk, ["north-quay"])));
  if (due.length !== 1 || due[0].title !== TITLE) return no("in4", JSON.stringify(due.map((d) => ({ desk: d.desk, title: d.title }))));
  return true;
}

/* The shell's own words, read rather than run: landDue hands landCatalog the in-use title, the desk's name on the roster
   and the language the page speaks (recoveryLang, the page's own rule). */
function checkIn5() {
  const src = jsWithoutComments(fs.readFileSync(path.join(ROOT, "shell", "main.js"), "utf8"));
  const a = src.indexOf("async function landDue(");
  const b = src.indexOf("\nfunction ", a + 1);
  const body = a >= 0 ? src.slice(a, b < 0 ? src.length : b) : "";
  const call = /S\.landCatalog\(root, item\.catalog, temp, \{ title: item\.title, desk: deskName \|\| item\.desk, lang: recoveryLang\(\) \}\)/.test(body);
  const named = /const deskName = entry \? String\(entry\.name \|\| entry\.desk\.name \|\| ""\)\.trim\(\) : "";/.test(body)
    && /String\(e\.desk\.id\) === item\.desk/.test(body);
  if (!(call && named)) return no("in5", JSON.stringify({ call, named, found: a >= 0 }));
  return true;
}

async function checkIn6() {
  const Use = await import("../src/catalog-use.mjs");
  const share = path.join(SCRATCH, "in6", crypto.randomBytes(4).toString("hex"));
  const team = { id: "t-" + crypto.randomBytes(8).toString("hex"), key: crypto.randomBytes(32), epoch: 1 };
  const desk = deskPair("Quay desk"), lead = leadPair();
  const asked = catalogDoc("north-quay", OWN_NAME), pin = D.signedSha(asked);
  const later = catalogDoc("tide-board", "Tide board"), laterPin = D.signedSha(later);
  const use = { format: 1, kind: "etiuda-in-use", desk: { id: desk.id, key: desk.pub, box: "ab".repeat(32), name: desk.name },
    at: "2026-04-02T08:15:00.000Z", catalog: { id: "tide-board", rev: 2, sha256: laterPin, signer: "", source: "file", title: "Title of the later catalog" },
    sig: { alg: "Ed25519", keyId: desk.id } };
  use.sig.value = crypto.sign(null, D.branchSignedBytes(use), desk.pair.privateKey).toString("hex");
  writeEc(path.join(share, "desks", desk.id, "in-use.ec"), team, use);
  const ask = Use.buildAsk({ desk: desk.id, sha256: pin, lead });
  Use.writeAsk(share, desk.id, ask);
  writeEc(path.join(share, "desks", desk.id, "catalog-answer.ec"), team, signedAnswer(desk, ask.id, team.id, pin, asked));
  const due = Use.answersDue(share, { [team.id]: { 1: team.key } }, {}, Object.assign({ lead, roster: [desk.id] }, judged(team, desk, ["north-quay"])));
  const item = due[0] || {};
  const r = due.length === 1 ? await landed(place("in6"), item.catalog, { title: item.title, desk: desk.name, lang: "en" }) : null;
  if (due.length !== 1 || item.title !== "" || !r || r.got.name !== OWN_NAME || r.plan.fileName !== "lantern-rota.ec")
    return no("in6", JSON.stringify({ due: due.length, title: item.title, name: r && r.got.name, file: r && r.plan.fileName }));
  return true;
}
async function checkIn7() {
  const w = place("in7");
  const wave = String.fromCodePoint(0x1f30a), rlo = String.fromCharCode(0x202e), pdi = String.fromCharCode(0x2069);
  const long = await landed(w, catalogDoc("long-title", OWN_NAME), { title: "a".repeat(119) + wave + "tail of the title", lang: "en" });
  const bidi = await landed(w, catalogDoc("bidi-title", OWN_NAME), { title: "Harbour " + rlo + "lamps" + pdi, lang: "en" });
  const dots = await landed(w, catalogDoc("dots-title", "Pier lamps"), { title: " .. ", lang: "en" });
  const n = long.got.name;
  const whole = Array.from(n).length === 120 && n.endsWith(wave) && !/[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/.test(n);
  const ok = whole && bidi.got.name === "Harbour lamps" && dots.got.name === "Pier lamps";
  if (!ok) return no("in7", JSON.stringify({ length: Array.from(n).length, units: n.length, tail: n.slice(-4), bidi: bidi.got.name, dots: dots.got.name }));
  return true;
}

const CHECKS = { in1: checkIn1, in2: checkIn2, in3: checkIn3, in4: checkIn4, in5: checkIn5, in6: checkIn6, in7: checkIn7 };

const OLD_RETURN = "  return upgradeLand(root, at, name);";
const NEW_RETURN = "  return upgradeLand(root, at, named, { displayName: named, fileNameFrom: base });";
const PLANTS = [
  ["in6", "src/catalog-use.mjs", 'const named = use && use.catalog && String(use.catalog.sha256 || "") === String(ans.sha256 || "");',
    "const named = use && use.catalog;"],
  ["in7", "src/studio.mjs", 'const cut = Array.from(kept).slice(0, 120).join("").trim();', "const cut = kept.slice(0, 120).trim();"],
  ["in7", "src/studio.mjs", "return c >= 32 && c !== 127 && !BIDI(c);", "return c >= 32 && c !== 127;"],
  ["in7", "src/studio.mjs", 'return /^[.\\s]*$/.test(cut) ? "" : cut;', "return cut;"],
  ["in1", "src/studio.mjs", NEW_RETURN, OLD_RETURN],
  ["in2", "src/studio.mjs", NEW_RETURN, OLD_RETURN],
  ["in3", "src/studio.mjs", NEW_RETURN, OLD_RETURN],
  ["in1", "src/studio.mjs", "const own = nameText(opts.title) || nameText(catalog && catalog.name);", "const own = nameText(catalog && catalog.name);"],
  ["in2", "src/studio.mjs", 'for (let n = 2; n < 100 && fs.existsSync(', 'for (let n = 2; false && fs.existsSync('],
  ["in2", "src/studio.mjs", "{ displayName: named, fileNameFrom: base }", "{ displayName: named, fileNameFrom: named }"],
  ["in3", "src/studio.mjs", "const words = LANDED_NAME[opts.lang] || LANDED_NAME.en,", "const words = LANDED_NAME.en,"],
  ["in4", "src/catalog-use.mjs", 'title: named && typeof use.catalog.title === "string" ? use.catalog.title : "",', 'title: "",'],
  ["in5", "shell/main.js", "S.landCatalog(root, item.catalog, temp, { title: item.title, desk: deskName || item.desk, lang: recoveryLang() })",
    "S.landCatalog(root, item.catalog, temp)"],
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
      cwd: tree, env: Object.assign({}, process.env, { IMPORT_NAME_ONLY: id, ETIUDA_PLANTS: "off" }), encoding: "utf8", timeout: 120000,
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
  /* ETIUDA_PLANTS=off (a merge's area run) skips the plants phase and counts it as the one check it is. */
  if (PLANTS_OFF) {
    console.log("SKIP the plants phase: " + PLANTS.length + " plants each turn their check red in a scratch copy, and the checkout's sha256 is unchanged after it (ETIUDA_PLANTS=off)");
  } else {
    const { plantsTree, treeSha, dropPlantsTree } = await import("./plants-tree.mjs");
    const before = treeSha(ROOT);
    let red = 0;
    let held = false;
    try {
      tree = plantsTree(ROOT, "import-name");
      for (const [id, rel, from, to] of PLANTS) {
        const ok = plantOnce(id, rel, from, to);
        console.log((ok ? "plant " : "PLANT FAIL ") + id + " " + rel + (ok ? " red" : ""));
        if (ok) red++;
      }
      held = treeSha(ROOT) === before;
      console.log((held ? "ok   " : "FAIL ") + "the checkout's sha256 over src/, shell/ and ui/ is unchanged after the plants phase");
    } finally {
      dropPlantsTree(tree, ROOT);
    }
    if (red !== PLANTS.length || !held) {
      dropScratch(SCRATCH, "import-name");
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
  dropScratch(SCRATCH, "import-name");
  console.log("#counts checks=" + (legs.length + (PLANTS_OFF ? 0 : 1)) + " skipped=" + (PLANTS_OFF ? 1 : 0)
    + " failed=" + (legs.length - n) + " expected=" + (legs.length + 1));
  console.log("import-name " + (n + (PLANTS_OFF ? 0 : 1)) + "/" + (legs.length + 1) + (PLANTS_OFF ? ", 1 skipped" : ", plants " + PLANTS.length + "/" + PLANTS.length + " red"));
  process.exit(n === legs.length ? 0 : 1);
}

if (ONLY) {
  const fn = CHECKS[ONLY];
  if (!fn) { console.error("unknown " + ONLY); process.exit(2); }
  /* A check that throws has failed: the second landing refused under an old name is the old behaviour itself. */
  Promise.resolve().then(fn).catch((e) => { console.error(e && e.stack || e); return false; }).then((ok) => {
    console.log(ok ? "PLANT-GREEN" : "PLANT-RED");
    process.exit(ok ? 0 : 1);
  });
} else {
  main().catch((e) => {
    console.error(e && e.stack || e);
    try { dropScratch(SCRATCH, "import-name"); } catch { /* the verdict is the error above */ }
    process.exit(1);
  });
}
