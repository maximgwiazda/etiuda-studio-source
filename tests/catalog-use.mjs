/* THE CATALOG EACH JOINED DESK HAS LOADED (board 890).
 *
 *     node tests/catalog-use.mjs
 *
 * Studio reads desks/<id>/in-use.ec for the roster only, says which catalog it names, and imports
 * one that is not the lead's edition by an ask the pinned engine's own askFresh accepts. Each
 * check is planted red first: the child runs that one check against the planted source and must
 * print PLANT-RED, and the source is put back by its sha256 before the next plant. The green run
 * is this process, which loaded the modules before any plant.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { plantText } from "./plant-copy.mjs";
import { fileURLToPath } from "node:url";
import * as Engine from "../src/engine.mjs";
import * as Use from "../src/catalog-use.mjs";
import { clearScratch, dropScratch } from "./scratch.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SCRATCH = path.join(ROOT, "scratch", "catalog-use");
const SELF = fileURLToPath(import.meta.url);
/* Set before the first plant. The child runs from this copy, so its ROOT is the copy. */
let tree = null;
const ONLY = process.env.CATALOG_USE_ONLY || "";
const PLANTS_OFF = process.env.ETIUDA_PLANTS === "off";
/* CATALOG_USE_PLANT_IDS=1014a,1014b runs only those checks' plants, to prove a new plant alone. */
const PLANT_IDS = (process.env.CATALOG_USE_PLANT_IDS || "").split(",").filter(Boolean);
const D = Engine.deskRules();
const SEAL = Engine.sealRules();

const BODY = "The north quay tide table is posted at the shed.";
const TITLE = "Harbour note";
const OTHER_TITLE = "North quay notes";
const OTHER_BODY = "A note kept on the north quay desk, about its own tide board.";
const OWN_BODY = "The north quay tide table was revised at noon.";

const IDS = ["890sa", "890sb", "890sc", "890sd", "890se", "890sf", "890sg", "890sh", "890si", "890sj", "890sk", "890sl", "890sm", "890sn", "890so", "890sp", "890sq", "945f9a", "945f9b", "945f9c", "945f9d", "lb1a", "lb1b", "962s0a", "962s0b", "962b0a", "962b0d", "962b0e", "962b0f", "962s5w", "962c3a", "962c3b", "962c3c", "962c3d", "962c3e", "962c3f", "962c3g", "962c3h", "962s6e", "1014a", "1014b", "1014c", "1014d"];

function lineOf(src, marker) {
  const at = src.indexOf(marker);
  if (at < 0 || src.indexOf(marker, at + marker.length) >= 0) throw new Error("slice " + marker);
  const start = src.lastIndexOf("\n", at) + 1;
  const end = src.indexOf("\n", at);
  const line = src.slice(start, end < 0 ? src.length : end).trim();
  if (!line.endsWith(";")) throw new Error("not one line " + marker);
  return line;
}
function fnOf(src, marker) {
  const at = src.indexOf(marker);
  if (at < 0 || src.indexOf(marker, at + marker.length) >= 0) throw new Error("slice " + marker);
  let depth = 0, started = false, str = "";
  for (let i = at; i < src.length; i++) {
    const c = src[i];
    if (str) {
      if (c === "\\") { i++; continue; }
      if (c === str) str = "";
      continue;
    }
    if (c === "\"" || c === "'") { str = c; continue; }
    if (c === "{") { depth++; started = true; }
    else if (c === "}") {
      depth--;
      if (started && depth === 0) return src.slice(at, i + 1);
    }
  }
  throw new Error("unclosed " + marker);
}
let ASK = null;
function engineAsk() {
  if (ASK) return ASK;
  const src = fs.readFileSync(path.join(ROOT, "engine", "pinned", "shell", "main.js"), "utf8");
  const body = [
    lineOf(src, "const ASK_DIR ="),
    lineOf(src, "const ASK_ID_RE ="),
    lineOf(src, "const PIN_RE ="),
    lineOf(src, "const ASK_TIME_RE ="),
    lineOf(src, "const ASK_CONTENT_FORMAT ="),
    lineOf(src, "const SPKI_ED25519 ="),
    fnOf(src, "function canonJson("),
    fnOf(src, "function signedBytesOf("),
    fnOf(src, "function askSignedBytes("),
    fnOf(src, "function askFresh("),
    "return { askFresh, askSignedBytes };",
  ].join("\n");
  ASK = new Function("crypto", "Buffer", body)(crypto, Buffer);
  return ASK;
}

function deskPair(name) {
  const pair = crypto.generateKeyPairSync("ed25519");
  const pub = pair.publicKey.export({ type: "spki", format: "der" }).subarray(-32).toString("hex");
  return { id: D.branchIdOf(pub), pub, pair, name: name || "Quay desk" };
}
function leadPair() {
  const pair = crypto.generateKeyPairSync("ed25519");
  const pub = pair.publicKey.export({ type: "spki", format: "der" }).subarray(-32).toString("hex");
  return { keyId: "lead-" + crypto.randomBytes(4).toString("hex"), public: pub, privateKey: pair.privateKey };
}
function teamOf() {
  return { id: "t-" + crypto.randomBytes(8).toString("hex"), key: crypto.randomBytes(32), epoch: 1 };
}
function keysOf(team) { return { [team.id]: { 1: team.key } }; }
function pinOf(doc) { return D.signedSha(doc); }
function catalogDoc(id, rev, body) {
  return {
    format: 2, kind: "etiuda-catalog", id, rev, name: "Harbour tide",
    cards: [{ id: "c-harbour-note", title: { en: TITLE }, body: { en: body } }],
  };
}
/* THE DESK'S ANSWERED CATALOG FOR 890si, invented words only, carrying what the format defines (engine/pinned
   src/modules/catalog-v2.js, V2_HEAD_NAMED and V2_CARD_NAMED, read by v2Problems): two languages with labels of their
   own, a comment language that is not the first, roles, quick facts, greetings, stop words, notes, the team's
   variables, a desk block, a signature, the edition date and the modified mark; a shelf with an icon, a hue and the
   supporting mark, a request with a clause and an action in both languages; a card of alternatives that is first only,
   on top of its intent, a commitment and followed by the steps card; a plain card with a note, keywords, the address
   form, paxVoc, paxOwn, a locked language and every intent; a retired card of steps; and a field on the head and one on
   a card that this build does not name, which the format carries whole. */
function answeredDoc() {
  return {
    format: 2, kind: "etiuda-catalog", id: "north-quay", rev: 2, date: "2026-04-02",
    langs: [{ code: "en", label: "English" }, { code: "pl", label: "Polski" }], commentLang: "pl",
    role: ["Quay desk", "Harbour office"],
    facts: "The tide board hangs at the shed. The crane stops at dusk.",
    greet: { en: ["Good morning", "Good afternoon", "Good evening"], pl: ["Dzień dobry", "Dzień dobry", "Dobry wieczór"] },
    stop: { en: ["quay", "pier"], pl: ["nabrzeże"] },
    notes: { en: "Kept at the north quay.", pl: "Prowadzony na północnym nabrzeżu." },
    variables: {
      hours: { morning: "06:00", afternoon: "12:00", evening: "18:00" },
      list: [{ name: "TIDE", about: "The tide a reply speaks of", rules: [
        { name: "Early", when: [{ fact: "DAYPART", op: "is", value: "morning" }], write: { en: "the morning tide", pl: "poranny przypływ" } },
        { when: [], write: { en: "the next tide", pl: "następny przypływ" } },
      ] }],
    },
    desk: { id: "k-0123456789abcdef", key: "ab".repeat(32), box: "cd".repeat(32), name: "Quay desk" },
    modified: true,
    sig: { alg: "Ed25519", keyId: "k-0123456789abcdef", value: "00".repeat(64) },
    tideTable: { kept: "a head field this build does not name" },
    tags: [
      { id: "t-tides", kind: "shelf", label: { en: "Tides", pl: "Pływy" }, icon: "wave", hue: 200, supporting: true },
      { id: "t-moorings", kind: "shelf", label: { en: "Moorings", pl: "Cumowanie" } },
      { id: "t-tide-board", kind: "request", clause: { en: "where is the tide board", pl: "gdzie wisi tablica pływów" },
        action: { en: "point to the board", pl: "wskazać tablicę" } },
    ],
    cards: [
      { id: "c-harbour-note", shelf: "t-tides", bodyShape: "alts", title: { en: TITLE, pl: "Notatka z portu" },
        body: { en: "[alt: short]\nThe tide table is at the shed.\n\n[alt]\n" + BODY,
                pl: "[alt: krótko]\nTablica pływów wisi przy szopie.\n\n[alt]\nTablica pływów północnego nabrzeża wisi przy szopie." },
        requests: ["t-tide-board"], firstOnly: true, intentTop: true, commits: true, next: [{ to: "c-quay-steps" }] },
      { id: "c-mooring-rings", shelf: "t-moorings", bodyShape: "plain", title: { en: "Mooring rings", pl: "Pierścienie cumownicze" },
        body: { en: "Rings on the east wall take the small boats.", pl: "Pierścienie na wschodniej ścianie przyjmują małe łodzie." },
        note: { en: "Ask the harbour master before the spring tide.", pl: "Przed wielką wodą zapytaj kapitana portu." },
        k: "bollard cleat", allIntents: true, paxVoc: 1, paxOwn: 0, address: { en: "skipper", pl: "kapitanie" }, lockLang: "pl" },
      { id: "c-quay-steps", shelf: "t-moorings", bodyShape: "steps", title: { en: "Tying up at the quay", pl: "Cumowanie przy nabrzeżu" },
        body: { en: "[step]\nCoil the line on the deck.\n\n[step]\nLoop it twice round the bollard.",
                pl: "[step]\nZwiń linę na pokładzie.\n\n[step]\nOwiń ją dwa razy wokół pachołka." },
        retired: true, drawnAt: "the east steps" },
    ],
  };
}
/* Keys sorted at every depth, arrays kept in order: two documents are equal when every field is. */
function canon(v) {
  if (Array.isArray(v)) return "[" + v.map(canon).join(",") + "]";
  if (v && typeof v === "object") return "{" + Object.keys(v).sort().map((k) => JSON.stringify(k) + ":" + canon(v[k])).join(",") + "}";
  return JSON.stringify(v === undefined ? null : v);
}
/* Where two documents differ, by field: the head's, and each tag's and card's by its id. */
function differs(a, b) {
  const out = [];
  for (const k of new Set(Object.keys(a).concat(Object.keys(b)))) {
    if (k !== "tags" && k !== "cards") { if (canon(a[k]) !== canon(b[k])) out.push(k); continue; }
    const xs = Array.isArray(a[k]) ? a[k] : [], ys = Array.isArray(b[k]) ? b[k] : [];
    if (canon(xs.map((x) => x && x.id)) !== canon(ys.map((y) => y && y.id))) out.push(k + " (ids or order)");
    for (const x of xs) {
      const y = ys.find((v) => v && x && v.id === x.id);
      if (!y) continue;
      for (const f of new Set(Object.keys(x).concat(Object.keys(y))))
        if (canon(x[f]) !== canon(y[f])) out.push(x.id + "." + f);
    }
  }
  return out;
}
function without(doc, keys) {
  const out = JSON.parse(JSON.stringify(doc));
  keys.forEach((k) => { delete out[k]; });
  return out;
}
function inUse(desk, cat) {
  const doc = {
    format: 1, kind: "etiuda-in-use",
    desk: { id: desk.id, key: desk.pub, box: "ab".repeat(32), name: desk.name },
    at: "2026-04-02T08:15:00.000Z",
    catalog: cat,
    sig: { alg: "Ed25519", keyId: desk.id },
  };
  doc.sig.value = crypto.sign(null, D.branchSignedBytes(doc), desk.pair.privateKey).toString("hex");
  return doc;
}
function writeEc(file, team, inner, key) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const env = SEAL.sealCatalog(key || team.key, team.id, team.epoch, JSON.stringify(inner));
  fs.writeFileSync(file, JSON.stringify(env, null, 1) + "\n", "utf8");
}
function projectOf(dir, edition) {
  fs.mkdirSync(path.join(dir, "archive", "2026-04-02"), { recursive: true });
  fs.writeFileSync(path.join(dir, "project.json"), JSON.stringify({ draft: "draft.json" }) + "\n");
  fs.writeFileSync(path.join(dir, "draft.json"), JSON.stringify({ id: "harbour-tide", rev: 3, cards: [] }) + "\n");
  fs.writeFileSync(path.join(dir, "archive", "2026-04-02", "catalog.ec"), JSON.stringify(edition) + "\n");
}
function world(id) {
  const base = path.join(SCRATCH, id);
  const share = path.join(base, "share");
  const project = path.join(base, "project");
  fs.mkdirSync(share, { recursive: true });
  const team = teamOf();
  const desk = deskPair("Quay desk");
  const edition = catalogDoc("harbour-tide", 3, BODY);
  projectOf(project, edition);
  return { base, share, project, team, desk, edition, editionPin: pinOf(edition) };
}
function useFile(share, desk) { return path.join(share, "desks", desk.id, "in-use.ec"); }
/* An answer as a desk writes it under either seal since board 962's stage 0b: signed by the desk over the ask and the team, and
   carrying the told stamp (`content`) where it is about a catalog the team does not list. */
function signedAnswer(desk, askId, teamId, sha, catalog, content) {
  const doc = { format: 1, kind: "etiuda-catalog-answer", ask: String(askId), team: String(teamId), sha256: sha, catalog };
  if (content) doc.content = content;
  doc.sig = { alg: "Ed25519", keyId: desk.id };
  doc.sig.value = crypto.sign(null, Engine.answerLeadRules().answerLeadSignedBytes(doc), desk.pair.privateKey).toString("hex");
  return doc;
}
/* What an answer is judged by, as the shell's boxContext hands it: the team, its current key, its catalogs and the roster's keys. */
function judged(team, desks, catalogs) {
  return { team: team.id, epoch: team.epoch, catalogs: catalogs || [],
    deskKeys: Object.fromEntries((desks || []).map((d) => [d.id, d.pub])) };
}
/* The told stamp a desk signs into what it gives the lead: the time its agent was told (board 1014). */
const TOLD = "2026-11-01T09:00:00.000Z";
function place(share, team, desk, cat) { writeEc(useFile(share, desk), team, inUse(desk, cat)); }
function listed(share, project, team, roster, extra) {
  return Use.listUses(Object.assign({
    folder: share, roster, projectDir: project, teamKeys: keysOf(team),
  }, extra || {}));
}
function rowOf(rows, id) { return rows.find((r) => r.id === id) || null; }

const ENT = { "&#39;": "'", "&quot;": "\"", "&lt;": "<", "&gt;": ">", "&amp;": "&" };
function textOf(html) {
  return String(html).replace(/<[^>]*>/g, " ").replace(/&#39;|&quot;|&lt;|&gt;|&amp;/g, (m) => ENT[m]).replace(/\s+/g, " ").trim();
}
async function paint(uses, roster, team, folder, lang, extra) {
  const { loadPage } = await import("./page-stand-in.mjs");
  const home = loadPage({ api: {}, uiLang: lang || "en" });
  const P = home.page;
  P.S.open = { dir: folder, editions: [], name: "Harbour tide" };
  P.S.screen = "projects";
  P.S.home = "team";
  P.S.teamDir = folder;
  P.S.lang = "en";
  P.S.desks = Object.assign({
    folder, file: "ours", signing: "lead-key", inside: false, keyHeld: true, canKeep: true,
    requests: [], invites: [], keyOpens: true, autoAdmit: false,
    /* relay: true, the share standing for the team's relay mirror (a team not on the relay shows only the line that Studio no longer follows a shared folder). */
    team: {
      id: team.id, relay: true, epoch: 1, sealed: true, lists: true, exportsSealed: false,
      roster: roster.map((r) => ({
        id: r.id, name: r.name, own: "", key: String(r.id).slice(2), admitted: true, kind: "desk", door: "code",
      })),
    },
    uses,
  }, extra || {});
  P.paintDesks();
  const membersHtml = home.node("#main").innerHTML;
  P.S.screen = "project";
  P.S.section = "stats";
  P.S.stats = { folder, uses, head: [], rows: [], refused: [] };
  P.paintStats();
  const statsHtml = home.node("#main").innerHTML;
  return { members: textOf(membersHtml), stats: textOf(statsHtml), membersHtml, statsHtml };
}
/* Said in a plant's child as well, where plantOnce shows it only when a plant does not bite, and where a person
   running one check by CATALOG_USE_ONLY can see what went red. */
function no(id, why) {
  console.error(id + " " + why);
  return false;
}

async function checkSa() {
  const w = world("890sa");
  const cat = { id: "harbour-tide", rev: 3, sha256: w.editionPin, signer: "lead-x", source: "file", title: "Harbour tide" };
  place(w.share, w.team, w.desk, cat);
  const row = rowOf(listed(w.share, w.project, w.team, [w.desk]), w.desk.id);
  if (!row || row.kind !== "edition" || row.n !== "2026-04-02" || row.importable) return no("890sa", "row " + JSON.stringify(row && { kind: row.kind, n: row.n, importable: row.importable }));
  const page = await paint(Use.forPage([row]), [w.desk], w.team, w.share);
  /* Board 902: the rev first and the dated edition in parentheses after it. */
  const said = "rev 3 (2026-04-02), published here";
  const both = page.members.includes(said) && page.stats.includes(said) && page.members.includes("as of") && page.stats.includes("as of");
  const noBtn = !page.membersHtml.includes("catalog-import") && !page.statsHtml.includes("catalog-import");
  const dumped = JSON.stringify(Use.forPage([row]));
  const hidden = !page.members.includes(TITLE) && !page.stats.includes(BODY) && !dumped.includes(TITLE) && !dumped.includes(BODY) && !dumped.includes("sha256");
  if (!(both && noBtn && hidden)) return no("890sa", JSON.stringify({ both, noBtn, hidden, members: page.members.slice(0, 240) }));
  return true;
}
async function checkSb() {
  const w = world("890sb");
  const own = catalogDoc("harbour-tide", 4, OWN_BODY);
  const cat = { id: "harbour-tide", rev: 4, sha256: pinOf(own), signer: "", source: "file" };
  if (cat.sha256 === w.editionPin) return no("890sb", "own pin matches the edition");
  place(w.share, w.team, w.desk, cat);
  const row = rowOf(listed(w.share, w.project, w.team, [w.desk]), w.desk.id);
  if (!row || row.kind !== "own" || row.n !== "4" || !row.importable) return no("890sb", "row " + JSON.stringify(row && { kind: row.kind, n: row.n, importable: row.importable }));
  const page = await paint(Use.forPage([row]), [w.desk], w.team, w.share);
  const said = "changed at the desk, from rev 4";
  const both = page.members.includes(said) && page.stats.includes(said);
  const btn = page.membersHtml.includes('data-act="catalog-import"') && page.statsHtml.includes('data-act="catalog-import"');
  const hidden = !page.members.includes(OWN_BODY) && !page.stats.includes(OWN_BODY);
  if (!(both && btn && hidden)) return no("890sb", JSON.stringify({ both, btn, hidden, members: page.members.slice(0, 240) }));
  return true;
}
async function checkSc() {
  const w = world("890sc");
  const other = catalogDoc("north-quay", 1, OTHER_BODY);
  const cat = { id: "north-quay", rev: 1, sha256: pinOf(other), signer: "", source: "file", title: OTHER_TITLE };
  place(w.share, w.team, w.desk, cat);
  const row = rowOf(listed(w.share, w.project, w.team, [w.desk]), w.desk.id);
  if (!row || row.kind !== "other" || row.title !== OTHER_TITLE || !row.importable) return no("890sc", "row " + JSON.stringify(row && { kind: row.kind, title: row.title }));
  const page = await paint(Use.forPage([row]), [w.desk], w.team, w.share);
  const said = "another catalog: " + OTHER_TITLE;
  const both = page.members.includes(said) && page.stats.includes(said);
  const btn = page.membersHtml.includes('data-act="catalog-import"') && page.statsHtml.includes('data-act="catalog-import"');
  const hidden = !page.members.includes(OTHER_BODY) && !page.stats.includes(TITLE);
  if (!(both && btn && hidden)) return no("890sc", JSON.stringify({ both, btn, hidden, members: page.members.slice(0, 280) }));
  return true;
}
async function checkSd() {
  const w = world("890sd");
  const deskDir = path.join(w.share, "desks", w.desk.id);
  fs.mkdirSync(deskDir, { recursive: true });
  const seen = [];
  let watch = null;
  try {
    watch = Use.watchFolder(w.share, (ids) => { ids.forEach((id) => seen.push(id)); }, { settle: 40 });
    place(w.share, w.team, w.desk, { id: "harbour-tide", rev: 3, sha256: w.editionPin, signer: "", source: "file" });
    const until = Date.now() + 25000;
    while (Date.now() < until && !seen.includes(w.desk.id)) await new Promise((r) => setTimeout(r, 40));
    if (!seen.includes(w.desk.id)) return no("890sd", "seen " + JSON.stringify(seen) + ", wanted " + w.desk.id);
    return true;
  } finally { if (watch) watch.close(); }
}
async function checkSe() {
  const w = world("890se");
  const stray = deskPair("Off roster");
  const cat = { id: "harbour-tide", rev: 3, sha256: w.editionPin, signer: "", source: "file" };
  place(w.share, w.team, w.desk, cat);
  place(w.share, w.team, stray, cat);
  const rows = listed(w.share, w.project, w.team, [w.desk]);
  const ids = rows.map((r) => r.id);
  if (ids.includes(stray.id) || !ids.includes(w.desk.id)) return no("890se", ids.join(","));
  return true;
}
async function checkSf() {
  const w = world("890sf");
  const forged = deskPair("Forged desk");
  const shut = deskPair("Shut desk");
  const cat = { id: "harbour-tide", rev: 3, sha256: w.editionPin, signer: "", source: "file" };
  place(w.share, w.team, w.desk, cat);
  const bent = inUse(forged, cat);
  const hex = bent.sig.value;
  bent.sig.value = hex.slice(0, -1) + (hex.endsWith("0") ? "1" : "0");
  writeEc(useFile(w.share, forged), w.team, bent);
  writeEc(useFile(w.share, shut), w.team, inUse(shut, cat), crypto.randomBytes(32));
  /* A member's own genuine file in another member's folder is judged by the folder's id, so it is that desk's no longer. */
  const borrower = deskPair("Borrower desk");
  writeEc(useFile(w.share, borrower), w.team, inUse(w.desk, cat));
  /* None of the three is read as its desk's own, and each row says which catalog is not known (the test architect's E9). */
  const rows = listed(w.share, w.project, w.team, [w.desk, forged, shut, borrower]);
  const unknown = [forged, shut, borrower].filter((d) => { const r = rowOf(rows, d.id); return !r || !r.unread || r.kind || r.importable; });
  const mine = rowOf(rows, w.desk.id);
  if (unknown.length || !mine || mine.unread || mine.kind !== "edition") return no("890sf", JSON.stringify({ unknown: unknown.map((d) => d.name), mine }));
  return true;
}
function checkSg() {
  const dir = path.join(SCRATCH, "890sg");
  const desk = deskPair("Ask desk");
  const lead = leadPair();
  const sha = "sha256:" + "cd".repeat(32);
  const doc = Use.buildAsk({ desk: desk.id, sha256: sha, lead });
  const at = Use.writeAsk(dir, desk.id, doc);
  const raw = fs.readFileSync(at, "utf8");
  const read = JSON.parse(raw);
  const fresh = engineAsk().askFresh(read, { id: desk.id }, { keyId: lead.keyId, public: lead.public });
  const week = Date.parse(read.expires) - Date.now();
  const shape = read.format === 1 && read.kind === "etiuda-catalog-ask" && read.desk === desk.id && read.sha256 === sha
    && !Object.prototype.hasOwnProperty.call(read, "asked") && !Object.prototype.hasOwnProperty.call(read, "cards")
    && week > 6.5 * 86400000 && week < 7.5 * 86400000
    && raw.indexOf("etiuda-catalog-ask\n") < 0
    && at.endsWith(path.join("catalog-asks", desk.id + ".json"));
  if (!(fresh && shape)) return no("890sg", JSON.stringify({ fresh: !!fresh, shape, week, kind: read.kind }));
  return true;
}
async function checkSh() {
  const w = world("890sh");
  const cat = { id: "north-quay", rev: 1, sha256: "sha256:" + "ab".repeat(32), signer: "", source: "file", title: OTHER_TITLE };
  place(w.share, w.team, w.desk, cat);
  const lead = leadPair();
  Use.writeAsk(w.share, w.desk.id, Use.buildAsk({ desk: w.desk.id, sha256: cat.sha256, lead }));
  /* An ask in another desk's place that names this one is not an ask of that desk. */
  const other = deskPair("Other desk");
  place(w.share, w.team, other, cat);
  Use.writeAsk(w.share, other.id, Use.buildAsk({ desk: w.desk.id, sha256: cat.sha256, lead }));
  const rows = listed(w.share, w.project, w.team, [w.desk, other]);
  const row = rowOf(rows, w.desk.id), elsewhere = rowOf(rows, other.id);
  if (!elsewhere || elsewhere.waiting || !elsewhere.importable) return no("890sh", "the other desk " + JSON.stringify(elsewhere && { waiting: elsewhere.waiting, importable: elsewhere.importable }));
  if (!row || !row.waiting || !row.askedAt || row.importable) return no("890sh", "row " + JSON.stringify(row && { waiting: row.waiting, askedAt: row.askedAt, importable: row.importable }));
  const page = await paint(Use.forPage([row]), [w.desk], w.team, w.share);
  const wait = page.members.includes("Waiting for this teammate since") && page.stats.includes("Waiting for this teammate since");
  const withdraw = page.membersHtml.includes('data-act="catalog-withdraw"') && page.stats.includes("Withdraw the request");
  const noImport = !page.membersHtml.includes("catalog-import") && !page.statsHtml.includes("catalog-import");
  if (!(wait && withdraw && noImport)) return no("890sh", JSON.stringify({ wait, withdraw, noImport, members: page.members.slice(0, 280) }));
  return true;
}
/* THE DESK'S CATALOG LANDS WHOLE (Maxim 2026-10-13 16:04: "import it as a new project, either to inspect or adopt";
   Claude alpha's ruling of 2026-10-14 18:26: the lead gets the catalog whole). The landed draft equals the desk's
   document on every field, compared key by key at every depth, apart from what a copy is given new: the id (a new
   one, which the format accepts), rev (0, no edition yet), grew (none: an import starts its own lineage, so the team that lists it reads it listed; board class B) and the hash
   (the copy's own); and apart from what describes the desk's file and stays with it: desk, sig, modified and date.
   The pinned engine's loader reads the landed draft, and the document went to Studio's temporary folder alone. */
async function checkSi() {
  const root = path.join(SCRATCH, "890si", crypto.randomBytes(4).toString("hex"));
  const temp = path.join(root, "temp");
  fs.mkdirSync(temp, { recursive: true });
  const { landCatalog } = await import("../src/studio.mjs");
  const F = await Engine.format();
  const doc = answeredDoc();
  doc.hash = F.contentHash(doc);
  const landed = await landCatalog(root, JSON.parse(JSON.stringify(doc)), temp);
  const draft = (landed && landed.draft) || {};
  const NEW = ["id", "rev", "grew", "hash"], LEFT = ["desk", "sig", "modified", "date"];
  const lost = differs(without(draft, NEW), without(doc, NEW.concat(LEFT)));
  if (!F.idOk(String(draft.id || "")) || draft.id === doc.id) lost.push("id " + draft.id);
  if (draft.rev !== 0) lost.push("rev " + draft.rev);
  if ("grew" in draft) lost.push("grew kept " + canon(draft.grew));
  LEFT.forEach((k) => { if (k in draft) lost.push(k + " kept"); });
  try { Engine.lint().loadCatalog(path.join(String(landed.dir || ""), String((landed.project || {}).draft || ""))); }
  catch (e) { lost.push("the pinned loader refuses the draft: " + (e && e.message)); }
  /* The copy the landing wrote is gone once it has landed, and its folder with it (src/studio.mjs landCatalog). */
  if (fs.existsSync(temp)) lost.push("temp " + JSON.stringify(fs.readdirSync(temp)));
  if (lost.length) return no("890si", lost.join("; "));
  return true;
}
function checkSj() {
  const dir = path.join(SCRATCH, "890sj");
  const desk = deskPair("Withdraw desk");
  const lead = leadPair();
  const at = Use.writeAsk(dir, desk.id, Use.buildAsk({ desk: desk.id, sha256: "sha256:" + "ef".repeat(32), lead }));
  const gone = Use.withdrawAsk(dir, desk.id) === true && !fs.existsSync(at);
  if (!gone) return no("890sj", "file still at " + at);
  return Use.withdrawAsk(dir, "../not-a-desk") === false;
}
async function checkSk() {
  const team = teamOf();
  const desk = deskPair("Quay desk");
  const hex = team.key.toString("hex");
  const rows = [{
    id: desk.id, name: desk.name, kind: "other", n: "", title: OTHER_TITLE,
    asOf: "2026-04-02T08:15:00.000Z", sha256: "sha256:" + "ab".repeat(32),
    importable: true, waiting: false, teamKey: hex, cards: [{ title: TITLE, body: BODY }],
  }];
  const facts = { teamKey: hex, teamKeys: { [team.id]: { 1: hex } }, folder: "share", file: "ours" };
  const attached = Use.attachUses(facts, rows);
  const pageRows = Use.forPage(rows);
  const dumped = JSON.stringify(pageRows) + JSON.stringify(attached);
  const clean = !("teamKey" in attached) && !("teamKeys" in attached)
    && !dumped.includes("teamKey") && !dumped.includes(hex) && !dumped.includes("TEAMKEYMARKER")
    && !dumped.includes(TITLE) && !dumped.includes("sha256");
  const page = await paint(pageRows, [desk], team, path.join(SCRATCH, "890sk"));
  const html = page.membersHtml + page.statsHtml;
  const pageClean = !html.includes("teamKey") && !html.includes(hex) && !html.includes("TEAMKEYMARKER") && !html.includes(BODY);
  if (!(clean && pageClean)) return no("890sk", JSON.stringify({ clean, pageClean, dumped: dumped.slice(0, 300) }));
  return true;
}
async function checkSl() {
  const w = world("890sl");
  const asked = "sha256:" + "11".repeat(32);
  const now = catalogDoc("north-quay", 2, OTHER_BODY);
  const got = pinOf(now);
  const cat = { id: "north-quay", rev: 2, sha256: got, signer: "", source: "file", title: OTHER_TITLE };
  place(w.share, w.team, w.desk, cat);
  const lead = leadPair();
  const slAsk = Use.buildAsk({ desk: w.desk.id, sha256: asked, lead });
  Use.writeAsk(w.share, w.desk.id, slAsk);
  const answer = signedAnswer(w.desk, slAsk.id, w.team.id, got, now);
  writeEc(path.join(w.share, "desks", w.desk.id, "catalog-answer.ec"), w.team, answer);
  const due = Use.answersDue(w.share, keysOf(w.team), {}, Object.assign({ lead, roster: [w.desk.id] }, judged(w.team, [w.desk], ["north-quay"])));
  const item = due.find((d) => d.desk === w.desk.id);
  const row = rowOf(listed(w.share, w.project, w.team, [w.desk], {
    ledger: { desks: { [w.desk.id]: { movedOn: true, asked, got } } },
  }), w.desk.id);
  if (!item || item.movedOn !== true || item.sha256 !== got || !row || row.movedOn !== true) return no("890sl", JSON.stringify({ item: item && { movedOn: item.movedOn, sha256: item.sha256 }, row: row && row.movedOn }));
  const page = await paint(Use.forPage([row]), [w.desk], w.team, w.share);
  const said = page.members.includes("This teammate now uses a different catalog.") && page.stats.includes("This teammate now uses a different catalog.");
  if (!said) return no("890sl", page.members.slice(0, 240));
  return true;
}
async function checkSm() {
  const { folderStamp } = await import("../src/team-watch.mjs");
  const w = world("890sm");
  const file = useFile(w.share, w.desk);
  place(w.share, w.team, w.desk, { id: "harbour-tide", rev: 1, sha256: "sha256:" + "ab".repeat(32), signer: "", source: "file" });
  const t0 = new Date("2019-01-01T00:00:00.000Z");
  const t1 = new Date("2020-01-01T00:00:00.000Z");
  const t2 = new Date("2021-06-01T00:00:00.000Z");
  const desks = path.join(w.share, "desks");
  fs.utimesSync(file, t1, t1);
  fs.utimesSync(desks, t0, t0);
  const a = folderStamp(w.share, new Map());
  fs.utimesSync(file, t2, t2);
  fs.utimesSync(desks, t0, t0);
  const b = folderStamp(w.share, new Map());
  if (a === b) return no("890sm", a);
  return true;
}

/* AN ANSWER LANDS ONLY AGAINST THIS STUDIO'S OWN ASK AND A PIN A TRUSTED HAND PUT DOWN (the test architect's C1, 2026-10-14):
   the answer is sealed for the team and signed by nobody. Two answers land: the catalog the lead asked for, and the catalog
   the desk's own in-use file pins now. None of these does, and each file is left where it is: a foreign catalog under the
   desk's borrowed pin, and under its own pin, sealed at the current epoch and at an old one a removed member still holds;
   an ask with no valid signature, or signed by another key, whatever it names; and a desk off the roster answering with
   what it now uses. */
async function checkSn() {
  const desk = deskPair("Answer desk");
  const lead = leadPair();
  const id = teamOf().id, k1 = crypto.randomBytes(32), k2 = crypto.randomBytes(32);
  const team = { id, key: k2, epoch: 2 }, gone = { id, key: k1, epoch: 1 };
  const keys = { [id]: { 1: k1, 2: k2 } };
  const own = catalogDoc("north-quay", 2, OTHER_BODY), pin = pinOf(own);
  const foreign = catalogDoc("planted", 1, "A catalog this desk never loaded."), fpin = pinOf(foreign);
  const other = "sha256:" + "11".repeat(32);
  const unsigned = (sha) => { const a = Use.buildAsk({ desk: desk.id, sha256: sha, lead }); a.sig.value = "00".repeat(64); return a; };
  const stranger = (sha) => Use.buildAsk({ desk: desk.id, sha256: sha, lead: Object.assign(leadPair(), { keyId: lead.keyId }) });
  const run = (name, o) => {
    const share = path.join(SCRATCH, "890sn", name);
    if (o.use) writeEc(useFile(share, desk), team, o.use);
    else place(share, team, desk, { id: "north-quay", rev: 2, sha256: pin, signer: "", source: "file", title: OTHER_TITLE });
    const ask = o.ask || Use.buildAsk({ desk: desk.id, sha256: o.asked || pin, lead });
    Use.writeAsk(share, desk.id, ask);
    const at = path.join(share, "desks", desk.id, "catalog-answer.ec");
    writeEc(at, o.seal || team, signedAnswer(desk, ask.id, team.id, o.sha, o.catalog));
    const refused = [];
    const due = Use.answersDue(share, keys, {}, Object.assign({ lead, roster: o.roster || [desk.id], refused },
      judged(team, [desk], ["north-quay", "planted"])));
    return { due: due.length, kept: fs.existsSync(at), why: refused.map((r) => r.why).join("|") };
  };
  const cases = {
    asked: [run("asked", { sha: pin, catalog: own }), 1],
    "in use": [run("in-use", { asked: other, sha: pin, catalog: own }), 1],
    "borrowed pin": [run("borrowed", { sha: pin, catalog: foreign }), 0],
    "own pin": [run("own-pin", { asked: other, sha: fpin, catalog: foreign }), 0],
    "borrowed pin, old epoch": [run("borrowed-old", { sha: pin, catalog: foreign, seal: gone }), 0],
    "own pin, old epoch": [run("own-pin-old", { asked: other, sha: fpin, catalog: foreign, seal: gone }), 0],
    "unsigned ask": [run("unsigned", { ask: unsigned(fpin), sha: fpin, catalog: foreign }), 0],
    "unsigned ask, the desk's catalog": [run("unsigned-own", { ask: unsigned(pin), sha: pin, catalog: own }), 0],
    "ask of another key": [run("stranger", { ask: stranger(fpin), sha: fpin, catalog: foreign }), 0],
    "off the roster": [run("off-roster", { asked: other, sha: pin, catalog: own, roster: [] }), 0],
    "forged in-use file": [run("forged-use", { asked: other, sha: fpin, catalog: foreign, use: (() => {
      const bent = inUse(desk, { id: "planted", rev: 1, sha256: fpin, signer: "", source: "file" });
      bent.sig.value = bent.sig.value.slice(0, -1) + (bent.sig.value.endsWith("0") ? "1" : "0");
      return bent;
    })() }), 0],
    "an ask of another desk in this one's place": [run("other-desk", {
      ask: Use.buildAsk({ desk: deskPair("Elsewhere desk").id, sha256: fpin, lead }), sha: fpin, catalog: foreign }), 0],
  };
  const wrong = Object.keys(cases).filter((k) => cases[k][0].due !== cases[k][1] || !cases[k][0].kept);
  if (wrong.length) return no("890sn", wrong.map((k) => k + " " + JSON.stringify(cases[k][0])).join("; "));
  return true;
}
/* WHEN, AS THE LEAD'S CLOCK READS IT (the test architect's C2): a desk writes UTC, and the row says local time. Painted at
   Kathmandu's offset, 5:45 ahead of UTC, so neither a slice of the string nor a whole-hour shift can pass for it. */
async function checkSo() {
  const desk = deskPair("Clock desk");
  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  process.env.TZ = "Asia/Kathmandu";
  try {
    const rows = [{ id: desk.id, name: desk.name, kind: "other", n: "", title: OTHER_TITLE, asOf: "2026-04-02T08:15:00.000Z",
      importable: false, waiting: true, askedAt: "2026-04-03T09:30:00.000Z" }];
    const page = await paint(Use.forPage(rows), [desk], teamOf(), path.join(SCRATCH, "890so"));
    const both = (t) => page.members.includes(t) && page.stats.includes(t);
    const local = both("as of 2026-04-02 14:00") && both("since 2026-04-03 15:15");
    const sliced = /08:15|09:30/.test(page.members + page.stats);
    if (!local || sliced) return no("890so", JSON.stringify({ local, sliced, members: page.members.slice(0, 240) }));
    return true;
  } finally { process.env.TZ = zone; }
}

/* HOW AN ASK ENDS WHEN NOTHING LANDS, AND A FILE THAT DOES NOT OPEN, in the copywriter's sentences (board 890, 2026-10-14):
   a roster desk whose in-use file does not open has a row saying so; a copy held back by answerRefusal is said in place of
   Waiting, the file left where it is and Import offered again; an ask past its seven days is said with Import offered
   again, and not once it was landed; an answer older than the ask is not an answer to it, so that row still waits. In
   English and in Polish, word for word. */
async function checkSp() {
  const w = world("890sp");
  const lead = leadPair();
  const own = catalogDoc("north-quay", 2, OTHER_BODY), pin = pinOf(own);
  const foreign = catalogDoc("planted", 1, "A catalog this desk never loaded."), fpin = pinOf(foreign);
  const cat = { id: "north-quay", rev: 2, sha256: pin, signer: "", source: "file", title: OTHER_TITLE };
  const past = new Date(Date.now() - 1000).toISOString();
  const shut = deskPair("Shut desk"), held = deskPair("Held desk"), stale = deskPair("Stale desk");
  const late = deskPair("Late desk"), done = deskPair("Done desk");
  writeEc(useFile(w.share, shut), w.team, inUse(shut, cat), crypto.randomBytes(32));
  const answered = (desk, askAge, answerAge) => {
    place(w.share, w.team, desk, cat);
    const askAt = Use.writeAsk(w.share, desk.id, Use.buildAsk({ desk: desk.id, sha256: pin, lead }));
    const at = path.join(w.share, "desks", desk.id, "catalog-answer.ec");
    writeEc(at, w.team, { format: 1, kind: "etiuda-catalog-answer", sha256: fpin, catalog: foreign });
    const t = (age) => new Date(Date.now() - age);
    fs.utimesSync(askAt, t(askAge), t(askAge));
    fs.utimesSync(at, t(answerAge), t(answerAge));
    return at;
  };
  const heldAt = answered(held, 60000, 30000);
  answered(stale, 30000, 60000);
  const both = deskPair("Late answer desk");
  place(w.share, w.team, both, cat);
  const bothAsk = Use.writeAsk(w.share, both.id, Use.buildAsk({ desk: both.id, sha256: pin, lead, expires: past }));
  const bothAt = path.join(w.share, "desks", both.id, "catalog-answer.ec");
  writeEc(bothAt, w.team, { format: 1, kind: "etiuda-catalog-answer", sha256: fpin, catalog: foreign });
  fs.utimesSync(bothAsk, new Date(Date.now() - 60000), new Date(Date.now() - 60000));
  place(w.share, w.team, late, cat);
  Use.writeAsk(w.share, late.id, Use.buildAsk({ desk: late.id, sha256: pin, lead, expires: past }));
  place(w.share, w.team, done, cat);
  const doneAsk = Use.buildAsk({ desk: done.id, sha256: pin, lead, expires: past });
  Use.writeAsk(w.share, done.id, doneAsk);
  const rows = listed(w.share, w.project, w.team, [shut, held, stale, late, done, both], { lead, ledger: { desks: {}, done: { [doneAsk.id]: true } } });
  const r = (d) => rowOf(rows, d.id) || {};
  const states = {
    unread: r(shut).unread === true && !r(shut).kind && !r(shut).importable,
    held: r(held).refused === true && !r(held).waiting && r(held).importable === true && fs.existsSync(heldAt),
    stale: r(stale).waiting === true && !r(stale).refused,
    lapsed: r(late).lapsed === true && r(late).importable === true && !r(late).waiting,
    landed: !r(done).lapsed,
    "answered, then lapsed": r(both).refused === true && !r(both).lapsed && r(both).importable === true,
  };
  const SAID = {
    en: ["Studio could not open this teammate's catalog file, so which catalog it uses is not known.",
      "The copy that came back is not this teammate's, so it was not imported. Import can be asked for again.",
      "This teammate did not answer within 7 days, so the request lapsed. Import can be asked for again."],
    pl: ["Studio nie mogło otworzyć pliku katalogu tego członka zespołu, więc nie wiadomo, którego katalogu używa.",
      "Kopia, która wróciła, nie pochodzi od tego członka zespołu, więc nie została zaimportowana. Można poprosić o nią ponownie.",
      "Ten członek zespołu nie odpowiedział w ciągu 7 dni, więc prośba wygasła. Można poprosić o kopię ponownie."],
  };
  const shown = [shut, held, late];
  const pages = {};
  for (const lang of ["en", "pl"]) pages[lang] = await paint(Use.forPage(shown.map(r)), shown, w.team, w.share, lang);
  const said = ["en", "pl"].every((l) => SAID[l].every((t) => pages[l].members.includes(t) && pages[l].stats.includes(t)));
  const noWait = !pages.en.members.includes("Waiting for this teammate since") && !pages.en.stats.includes("Waiting for this teammate since");
  const presses = [held, late].every((d) => pages.en.membersHtml.includes('data-act="catalog-import" data-id="' + d.id + '"'))
    && !pages.en.membersHtml.includes('data-act="catalog-import" data-id="' + shut.id + '"');
  const wrong = Object.keys(states).filter((k) => !states[k]);
  if (wrong.length || !said || !noWait || !presses) return no("890sp", JSON.stringify({ wrong, said, noWait, presses, rows: rows.map((x) => ({ id: x.id, unread: x.unread, refused: x.refused, lapsed: x.lapsed, waiting: x.waiting })) }));
  return true;
}

/* BOARD 945 ITEM 9. The pause file beside the team file, the Desks banner, a withdrawn ask that
   stays withdrawn, and an in-use file read by its counter. */
const PAUSE_EN = "Teammates are waiting to join, and this Studio cannot let them in while its licence is paused. Signing in with an account that holds a licence, from the Menu, under Settings, then Account, ends the pause, and they are let in by themselves.";
const PAUSE_PL = "Członkowie zespołu czekają na dołączenie, ale to Studio nie może ich wpuścić, dopóki jego licencja jest wstrzymana. Zalogowanie się kontem z licencją, z menu, w Ustawieniach, w części Konto, kończy wstrzymanie, a oni dołączą sami.";
const PAUSE_NAME = "etiuda-team-pause.json";
function pauseFile(folder) { return path.join(folder, PAUSE_NAME); }
function readPause(folder) {
  return JSON.parse(fs.readFileSync(pauseFile(folder), "utf8"));
}
function engineBytes(doc) { return engineAsk().askSignedBytes(doc); }
function sigHolds(doc, lead) {
  try {
    const key = crypto.createPublicKey({
      key: Buffer.concat([Buffer.from("302a300506032b6570032100", "hex"), Buffer.from(lead.public, "hex")]),
      format: "der", type: "spki",
    });
    return crypto.verify(null, engineBytes(doc), key, Buffer.from(String(doc.sig && doc.sig.value || ""), "hex"));
  } catch { return false; }
}
function askReq(desk) {
  return { id: desk.id, name: desk.name, asked: "2026-04-02T08:15:00.000Z", state: "asks", kind: "desk", door: "folder" };
}
async function checkF9a() {
  if (typeof Use.noteTeamPause !== "function") return no("945f9a", "noteTeamPause is not there");
  if (typeof Use.admitOpen !== "function") return no("945f9a", "admitOpen is not there");
  if (Use.admitOpen(true) !== false || Use.admitOpen(false) !== true || Use.admitOpen(undefined) !== true)
    return no("945f9a", "admitOpen " + [Use.admitOpen(true), Use.admitOpen(false), Use.admitOpen(undefined)].join(" "));
  const shell = fs.readFileSync(path.join(ROOT, "shell", "main.js"), "utf8");
  /* Written where the watched team's files are, its folder (a relay team's mirror); Studio keeps no other copy since A-S5. */
  if (!shell.includes("Use.noteTeamPause(work, t.team, opened, paused)")
    || !shell.includes("const work = t.folder;")) return no("945f9a", "the watch does not write the pause file");
  if (!shell.includes("admitOpen(paused)")) return no("945f9a", "the watch still admits while paused");
  const dir = path.join(SCRATCH, "945f9a");
  fs.mkdirSync(dir, { recursive: true });
  const team = teamOf(), lead = leadPair();
  const quiet = Use.noteTeamPause(dir, team.id, lead, false, 1000);
  if (!quiet || quiet.wrote !== false || fs.existsSync(pauseFile(dir))) return no("945f9a", "a licence that is not paused wrote " + JSON.stringify(quiet));
  const on = Use.noteTeamPause(dir, team.id, lead, true, 2000);
  const doc = readPause(dir);
  if (!on || on.wrote !== true || on.t !== 2000 || doc.paused !== true || doc.t !== 2000 || doc.team !== team.id
    || doc.format !== 1 || doc.kind !== "etiuda-team-pause" || doc.sig.keyId !== lead.keyId || !sigHolds(doc, lead))
    return no("945f9a", "paused " + JSON.stringify({ on, kind: doc.kind, team: doc.team, t: doc.t, paused: doc.paused, sig: !!(doc.sig && doc.sig.value) }));
  const again = Use.noteTeamPause(dir, team.id, lead, true, 2500);
  if (!again || again.wrote !== false || again.t !== 2000 || readPause(dir).t !== 2000) return no("945f9a", "rewrote a pause that had not changed");
  const off = Use.noteTeamPause(dir, team.id, lead, false, 1500);
  const resumed = readPause(dir);
  if (!off || off.wrote !== true || resumed.paused !== false || resumed.t !== 2001 || !fs.existsSync(pauseFile(dir)) || !sigHolds(resumed, lead))
    return no("945f9a", "resume " + JSON.stringify({ off, paused: resumed.paused, t: resumed.t }));
  const stay = Use.noteTeamPause(dir, team.id, lead, false, 4000);
  if (!stay || stay.wrote !== false || readPause(dir).t !== 2001) return no("945f9a", "resume wrote again");
  const other = leadPair();
  const forged = { format: 1, kind: "etiuda-team-pause", team: team.id, paused: false, t: 9000000000000, sig: { alg: "Ed25519", keyId: other.keyId } };
  forged.sig.value = crypto.sign(null, Use.askSignedBytes(forged), other.privateKey).toString("hex");
  fs.writeFileSync(pauseFile(dir), JSON.stringify(forged) + "\n");
  const overForged = Use.noteTeamPause(dir, team.id, lead, true, 3000);
  const ours = readPause(dir);
  if (!overForged || overForged.t !== 3000 || ours.t !== 3000 || ours.team !== team.id || !sigHolds(ours, lead) || sigHolds(ours, other))
    return no("945f9a", "forged t was kept " + JSON.stringify({ overForged, t: ours.t, team: ours.team }));
  const elsewhere = "t-" + "ab".repeat(8);
  Use.noteTeamPause(dir, elsewhere, lead, true, 8000);
  const back = Use.noteTeamPause(dir, team.id, lead, true, 3000);
  const named = readPause(dir);
  if (!back || named.team !== team.id || named.t !== 3001 || named.paused !== true) return no("945f9a", "other team " + JSON.stringify({ back, team: named.team, t: named.t }));
  return true;
}
async function checkF9b() {
  const w = world("945f9b");
  const shell = fs.readFileSync(path.join(ROOT, "shell", "main.js"), "utf8");
  const page = fs.readFileSync(path.join(ROOT, "ui", "app.js"), "utf8");
  if (!shell.includes("admitPaused: paused")) return no("945f9b", "the desks screen is not told when the licence is paused");
  if (!page.includes(PAUSE_EN)) return no("945f9b", "the banner sentence is not on the Desks screen");
  const waiting = { admitPaused: true, requests: [askReq(w.desk)] };
  const en = await paint([], [w.desk], w.team, w.share, "en", waiting);
  const pl = await paint([], [w.desk], w.team, w.share, "pl", waiting);
  const none = await paint([], [w.desk], w.team, w.share, "en", { admitPaused: true, requests: [] });
  const live = await paint([], [w.desk], w.team, w.share, "en", { admitPaused: false, requests: [askReq(w.desk)] });
  if (!en.members.includes(PAUSE_EN) || !pl.members.includes(PAUSE_PL)) return no("945f9b", "said " + JSON.stringify({ en: en.members.includes(PAUSE_EN), pl: pl.members.includes(PAUSE_PL), text: en.members.slice(0, 240) }));
  if (none.members.includes(PAUSE_EN) || live.members.includes(PAUSE_EN)) return no("945f9b", "banner without waiting asks, or while the licence is not paused");
  /* RETIRED, P2: the last clause of 945f9b, "Admit is not held while the licence is paused", read the desk-admit verb, which went with the code door;
     the banner and its two languages above are what the leg still holds. */
  return true;
}
function signedUse(desk, cat, more) {
  const doc = {
    format: 1, kind: "etiuda-in-use",
    desk: { id: desk.id, key: desk.pub, box: "ab".repeat(32), name: desk.name },
    at: "2026-04-02T08:15:00.000Z",
    catalog: cat,
    sig: { alg: "Ed25519", keyId: desk.id },
  };
  if (more && Number.isInteger(more.n)) doc.n = more.n;
  if (more && more.cleared === true) doc.cleared = true;
  doc.sig.value = crypto.sign(null, D.branchSignedBytes(doc), desk.pair.privateKey).toString("hex");
  return doc;
}
function putUse(share, team, desk, cat, more) {
  writeEc(useFile(share, desk), team, signedUse(desk, cat, more));
}
async function checkF9c() {
  const dir = path.join(SCRATCH, "945f9c");
  fs.mkdirSync(dir, { recursive: true });
  const desk = deskPair("Withdraw desk"), lead = leadPair();
  const sha = "sha256:" + "ab".repeat(32);
  const first = Use.buildAsk({ id: "ask-one", desk: desk.id, sha256: sha, lead });
  Use.writeAsk(dir, desk.id, first);
  if (Use.withdrawAsk(dir, desk.id, lead) !== true) return no("945f9c", "withdraw did not take the ask");
  const at = path.join(dir, "catalog-asks", desk.id + ".withdrawn.json");
  if (fs.existsSync(path.join(dir, "catalog-asks", desk.id + ".json"))) return no("945f9c", "the ask file is still there");
  if (!fs.existsSync(at)) return no("945f9c", "no withdrawal file");
  const doc = JSON.parse(fs.readFileSync(at, "utf8"));
  if (doc.format !== 1 || doc.kind !== "etiuda-catalog-ask-withdrawn" || doc.desk !== desk.id || JSON.stringify(doc.ids) !== JSON.stringify(["ask-one"]) || !sigHolds(doc, lead))
    return no("945f9c", "withdrawal " + JSON.stringify({ kind: doc.kind, desk: doc.desk, ids: doc.ids }));
  Use.writeAsk(dir, desk.id, Use.buildAsk({ id: "ask-one", desk: desk.id, sha256: sha, lead }));
  const still = JSON.parse(fs.readFileSync(at, "utf8"));
  if (JSON.stringify(still.ids) !== JSON.stringify(["ask-one"]) || !fs.existsSync(at)) return no("945f9c", "the ask file coming back replaced the withdrawal");
  const ids = [];
  for (let i = 0; i < 65; i++) {
    const id = "b" + String(i).padStart(4, "0");
    ids.push(id);
    Use.writeAsk(dir, desk.id, Use.buildAsk({ id, desk: desk.id, sha256: sha, lead }));
    if (Use.withdrawAsk(dir, desk.id, lead) !== true) return no("945f9c", "withdraw " + id);
  }
  const capped = JSON.parse(fs.readFileSync(at, "utf8"));
  const last = ids[ids.length - 1], oldest = ids[0];
  if (!Array.isArray(capped.ids) || capped.ids.length !== 64 || capped.ids[capped.ids.length - 1] !== last || capped.ids.indexOf(oldest) >= 0 || capped.ids.indexOf("ask-one") >= 0)
    return no("945f9c", "cap " + JSON.stringify({ n: capped.ids && capped.ids.length, last: capped.ids && capped.ids[capped.ids.length - 1], hasOldest: capped.ids && capped.ids.indexOf(oldest) }));
  if (!sigHolds(capped, lead)) return no("945f9c", "the capped file does not verify");
  return true;
}
async function checkF9d() {
  const w = world("945f9d");
  const cat = { id: "north-quay", rev: 1, sha256: "sha256:" + "cd".repeat(32), signer: "", source: "file", title: OTHER_TITLE };
  const older = { id: "north-quay", rev: 1, sha256: "sha256:" + "ef".repeat(32), signer: "", source: "file", title: "Old quay note" };
  const ledger = { desks: {}, done: {}, unopened: {} };
  putUse(w.share, w.team, w.desk, cat, null);
  const plain = rowOf(listed(w.share, w.project, w.team, [w.desk], { ledger: { desks: {}, done: {}, unopened: {} } }), w.desk.id);
  if (!plain || plain.title !== OTHER_TITLE || plain.unread) return no("945f9d", "a file without n " + JSON.stringify(plain && { title: plain.title, unread: plain.unread, kind: plain.kind }));
  putUse(w.share, w.team, w.desk, cat, { n: 2, cleared: true });
  const cleared = listed(w.share, w.project, w.team, [w.desk], { ledger });
  if (rowOf(cleared, w.desk.id) || !ledger.useN || ledger.useN[w.desk.id] !== 2) return no("945f9d", "cleared " + JSON.stringify({ row: rowOf(cleared, w.desk.id), n: ledger.useN && ledger.useN[w.desk.id] }));
  putUse(w.share, w.team, w.desk, older, null);
  const plainBack = listed(w.share, w.project, w.team, [w.desk], { ledger });
  if (rowOf(plainBack, w.desk.id)) return no("945f9d", "a file without n came back over a cleared one");
  putUse(w.share, w.team, w.desk, older, { n: 1 });
  const old = listed(w.share, w.project, w.team, [w.desk], { ledger });
  if (rowOf(old, w.desk.id) || ledger.useN[w.desk.id] !== 2) return no("945f9d", "older n was read " + JSON.stringify({ row: rowOf(old, w.desk.id), n: ledger.useN[w.desk.id] }));
  putUse(w.share, w.team, w.desk, cat, { n: 3 });
  const next = rowOf(listed(w.share, w.project, w.team, [w.desk], { ledger }), w.desk.id);
  if (!next || next.title !== OTHER_TITLE || ledger.useN[w.desk.id] !== 3) return no("945f9d", "newer " + JSON.stringify({ title: next && next.title, n: ledger.useN[w.desk.id] }));
  return true;
}

/* THE DESKS A HANDOVER FOR A KEY IN OTHER HANDS LEFT BEHIND (Max's ruling of 2026-11-01 06:13). The team's keys moved from key
   number 1 to 2 after a handover that gave the lead a box of its own. Of the desks admitted at that handover: one sealed its
   in-use file again under key 2 (took the change), one still has it under key 1, one has none, one has a file under key 2 that
   another desk signed, and one has since left the roster; a desk joined after the handover is not asked about. notTaken names
   the second, third and fourth, by the roster's names, in its order. */
function checkLb1a() {
  const base = path.join(SCRATCH, "lb1a"), share = path.join(base, "share");
  fs.mkdirSync(share, { recursive: true });
  const t1 = teamOf(), key2 = crypto.randomBytes(32), t2 = { id: t1.id, key: key2, epoch: 2 };
  const keys = { [t1.id]: { 1: t1.key, 2: key2 } };
  const took = deskPair("Quay desk"), behind = deskPair("Shed desk"), none = deskPair("Crane desk"), forged = deskPair("Gate desk");
  const gone = deskPair("Pier desk"), later = deskPair("Dock desk");
  const cat = { id: "harbour-tide", rev: 3, sha256: "sha256:" + "ab".repeat(32), signer: "", source: "file", title: TITLE };
  writeEc(useFile(share, took), t2, inUse(took, cat));
  writeEc(useFile(share, behind), t1, inUse(behind, cat));
  writeEc(useFile(share, forged), t2, inUse({ id: forged.id, pub: forged.pub, pair: took.pair, name: forged.name }, cat));
  writeEc(useFile(share, gone), t1, inUse(gone, cat));
  const roster = [took, behind, none, forged, later].map((d) => ({ id: d.id, name: d.name }));
  const names = Use.notTaken({ folder: share, desks: [took, behind, none, forged, gone].map((d) => d.id), roster, epoch: 2, teamKeys: keys });
  const want = ["Shed desk", "Crane desk", "Gate desk"];
  if (JSON.stringify(names) !== JSON.stringify(want)) return no("lb1a", "named " + JSON.stringify(names) + ", wanted " + JSON.stringify(want));
  /* Before the keys change there is nothing to name: the first change after a handover at key 1 is key 2. */
  const early = Use.notTaken({ folder: share, desks: [behind.id], roster, epoch: 1, teamKeys: keys });
  if (early.length) return no("lb1a", "named before a key change " + JSON.stringify(early));
  return true;
}
/* The Desks screen says the names in the copywriter's words, in English and in Polish, and, once every one has taken the
   change, that none needs a new invitation. */
async function checkLb1b() {
  const base = path.join(SCRATCH, "lb1b"), share = path.join(base, "share");
  fs.mkdirSync(share, { recursive: true });
  const team = teamOf(), a = deskPair("Shed desk"), b = deskPair("Crane desk");
  const roster = [{ id: a.id, name: a.name }, { id: b.id, name: b.name }];
  const named = { reinvite: { names: ["Shed desk", "Crane desk"] } }, none = { reinvite: { none: true } };
  const en = (await paint([], roster, team, share, "en", named)).members;
  const pl = (await paint([], roster, team, share, "pl", named)).members;
  const enNone = (await paint([], roster, team, share, "en", none)).members;
  const plNone = (await paint([], roster, team, share, "pl", none)).members;
  const quiet = (await paint([], roster, team, share, "en", {})).members;
  const want = {
    en: en.indexOf("These teammates have not taken the change and will need a new invitation: Shed desk, Crane desk.") >= 0,
    pl: pl.indexOf("Nowego zaproszenia będą potrzebować ci, którzy nie przyjęli zmiany: Shed desk, Crane desk.") >= 0,
    enNone: enNone.indexOf("Every teammate has taken the change, so none needs a new invitation.") >= 0,
    plNone: plNone.indexOf("Cały zespół przyjął zmianę, więc nikt nie potrzebuje nowego zaproszenia.") >= 0,
    quiet: quiet.indexOf("new invitation") < 0 && quiet.indexOf("nowego zaproszenia") < 0,
  };
  const bad = Object.keys(want).filter((k) => !want[k]);
  return bad.length ? no("lb1b", "failing " + bad.join(", ")) : true;
}

/* BOARD 962, STAGE 0: A DESK'S ANSWER ABOUT A CATALOG ITS TEAM DOES NOT LIST COMES SEALED TO THE LEAD'S BOX, and the lead opens it
   with the box's private key, as it opens stats.estat; an answer under the team key, a newer desk's about a listed catalog or an
   older desk's about any, opens as before, and the box is not asked for one. A box answer lands only by the same checks as any
   answer: it opens with no other box, not in another desk's folder, and with no box at all it is not due. And it lands only
   signed by that desk's roster key over the ask and the team it answers (the test architect's criterion): unsigned, signed by
   another desk on the roster, or signed for another ask or another team, it is refused by name. */
async function check962a() {
  const desk = deskPair("Box desk");
  const lead = leadPair();
  const team = teamOf();
  const R = Engine.answerLeadRules();
  const box = crypto.generateKeyPairSync("x25519");
  const boxPub = box.publicKey.export({ type: "spki", format: "der" }).subarray(-32).toString("hex");
  const stranger = crypto.generateKeyPairSync("x25519").privateKey;
  const own = catalogDoc("north-quay", 2, OTHER_BODY), pin = pinOf(own);
  const foreign = catalogDoc("planted", 1, "A catalog this desk never loaded."), fpin = pinOf(foreign);
  const other = "sha256:" + "11".repeat(32);
  const mate = deskPair("Mate desk");
  let asked = 0;
  const run = (name, o) => {
    const share = path.join(SCRATCH, "962s0a", name);
    place(share, team, desk, { id: "north-quay", rev: 2, sha256: pin, signer: "", source: "file", title: OTHER_TITLE });
    const ask = Use.buildAsk({ desk: desk.id, sha256: o.asked || pin, lead });
    Use.writeAsk(share, desk.id, ask);
    const at = path.join(share, "desks", desk.id, "catalog-answer.ec");
    const inner = { format: 1, kind: "etiuda-catalog-answer", sha256: o.sha || pin, catalog: o.catalog || own };
    if (o.teamKey) writeEc(at, team, signedAnswer(desk, ask.id, team.id, inner.sha256, inner.catalog));
    else {
      const signer = o.signer || desk;
      const doc = Object.assign({ ask: o.askId || ask.id, team: o.teamId || team.id }, inner, { content: TOLD });
      if (!o.unsigned) {
        doc.sig = { alg: "Ed25519", keyId: signer.id };
        doc.sig.value = crypto.sign(null, R.answerLeadSignedBytes(doc), signer.pair.privateKey).toString("hex");
      }
      const env = R.sealAnswerLead(boxPub, team.id, lead.keyId, o.sealedFor || desk.id, JSON.stringify(doc));
      /* A newer desk may write the envelope's fields in another order, or add one: read by name. */
      const shaped = o.reorder ? Object.assign({ note: "a field this build does not name" },
        ...Object.keys(env).reverse().map((k) => ({ [k]: env[k] }))) : env;
      fs.writeFileSync(at, JSON.stringify(shaped, null, 1) + "\n", "utf8");
    }
    const refused = [];
    const due = Use.answersDue(share, keysOf(team), {}, Object.assign({ lead, roster: [desk.id, mate.id], box: o.box, refused },
      judged(team, [desk, mate], o.teamKey ? ["north-quay"] : [])));
    const raw = fs.readFileSync(at, "utf8");
    return { due: due.length, body: !!due[0] && JSON.stringify(due[0].catalog).includes(OTHER_BODY),
      clear: raw.includes(OTHER_BODY), why: refused.map((r) => r.why).join("|"),
      kind: (() => { try { return JSON.parse(raw).kind; } catch { return ""; } })() };
  };
  const cases = {
    "box answer, the lead's box": [run("box", { box: box.privateKey }), 1],
    "box answer, the box as a function": [run("box-fn", { box: () => { asked++; return box.privateKey; } }), 1],
    "team-key answer": [run("team-key", { teamKey: true, box: () => { asked += 100; return box.privateKey; } }), 1],
    "team-key answer, no box": [run("team-key-bare", { teamKey: true }), 1],
    "box answer, no box": [run("no-box", {}), 0],
    "box answer, another box": [run("stranger", { box: stranger }), 0],
    "box answer sealed for another desk": [run("other-desk", { box: box.privateKey, sealedFor: deskPair("Elsewhere desk").id }), 0],
    "box answer, a foreign catalog under the asked pin": [run("borrowed", { box: box.privateKey, sha: pin, catalog: foreign }), 0],
    "box answer, a pin nobody trusted": [run("own-pin", { box: box.privateKey, asked: other, sha: fpin, catalog: foreign }), 0],
    "box answer, unsigned": [run("unsigned", { box: box.privateKey, unsigned: true }), 0, "a box answer not signed by this desk's roster key"],
    "box answer, signed by another desk on the roster": [run("mate-signed", { box: box.privateKey, signer: mate }), 0,
      "a box answer not signed by this desk's roster key"],
    "box answer, signed for another ask": [run("other-ask", { box: box.privateKey, askId: "elsewhere1" }), 0, "a box answer signed for another ask"],
    "box answer, signed for another team": [run("other-team", { box: box.privateKey, teamId: teamOf().id }), 0, "a box answer signed for another team"],
    "box answer, its envelope's fields in another order and one more": [run("reordered", { box: box.privateKey, reorder: true }), 1],
  };
  const wrong = Object.keys(cases).filter((k) => cases[k][0].due !== cases[k][1] || cases[k][0].clear
    || (cases[k][1] === 1 && !cases[k][0].body) || (cases[k][2] && cases[k][0].why !== cases[k][2]));
  const kinds = cases["box answer, the lead's box"][0].kind === R.ANSWER_LEAD_KIND && cases["team-key answer"][0].kind === SEAL.SEALED_KIND;
  if (wrong.length || asked !== 1 || !kinds)
    return no("962s0a", wrong.map((k) => k + " " + JSON.stringify(cases[k][0])).join("; ") + " box asked " + asked + " kinds " + kinds);
  return true;
}
/* BOARD 962, STAGE 0: THE DESKS SCREEN READS A BOX ANSWER AS LANDING DOES (Argon's finding 3). listUses judges it with the box, the
   team, the roster's keys and the removal record: one that opens and has not landed yet keeps the row waiting, and so does one
   whose box is locked or not given, since that is no copy that failed to open; one signed by another desk is held back; one
   the landing recorded as not a catalog says so with its reason; one no box this Studio holds opens is unopened. */
async function check962b() {
  const lead = leadPair();
  const box = crypto.generateKeyPairSync("x25519");
  const boxPub = box.publicKey.export({ type: "spki", format: "der" }).subarray(-32).toString("hex");
  const stranger = crypto.generateKeyPairSync("x25519").privateKey;
  const R = Engine.answerLeadRules();
  const own = catalogDoc("north-quay", 2, OTHER_BODY), pin = pinOf(own);
  const run = (name, o) => {
    const w = world("962s0b-" + name);
    const mate = deskPair("Mate desk");
    place(w.share, w.team, w.desk, { id: "north-quay", rev: 2, sha256: pin, signer: "", source: "file", title: OTHER_TITLE });
    const ask = Use.buildAsk({ desk: w.desk.id, sha256: pin, lead });
    Use.writeAsk(w.share, w.desk.id, ask);
    const signer = o.mateSigns ? mate : w.desk;
    const doc = { ask: ask.id, team: w.team.id, format: 1, kind: "etiuda-catalog-answer", sha256: pin, catalog: own,
      content: TOLD, sig: { alg: "Ed25519", keyId: signer.id } };
    doc.sig.value = crypto.sign(null, R.answerLeadSignedBytes(doc), signer.pair.privateKey).toString("hex");
    const at = path.join(w.share, "desks", w.desk.id, "catalog-answer.ec");
    fs.writeFileSync(at, JSON.stringify(R.sealAnswerLead(boxPub, w.team.id, lead.keyId, w.desk.id, JSON.stringify(doc)), null, 1) + "\n", "utf8");
    const ledger = { desks: {}, done: {}, unopened: {} };
    if (o.recorded) ledger.unopened[ask.id] = { desk: w.desk.id, sha256: pin, why: { frame: "a card names a shelf the catalog does not hold" } };
    const row = rowOf(listed(w.share, w.project, w.team, [{ id: w.desk.id, name: w.desk.name }], {
      ledger, lead, box: o.box, team: w.team.id, epoch: w.team.epoch, catalogs: [],
      deskKeys: { [w.desk.id]: w.desk.pub, [mate.id]: mate.pub } }), w.desk.id) || {};
    return { waiting: !!row.waiting, unopened: !!row.unopened, refused: !!row.refused, why: !!row.why };
  };
  const want = (waiting, unopened, refused, why) => ({ waiting, unopened, refused, why });
  const cases = {
    "opens, not landed yet": [run("opens", { box: box.privateKey }), want(true, false, false, false)],
    "box locked": [run("locked", { box: () => null }), want(true, false, false, false)],
    "no box given": [run("no-box", {}), want(true, false, false, false)],
    "signed by another desk on the roster": [run("mate", { box: box.privateKey, mateSigns: true }), want(false, false, true, false)],
    "recorded as not a catalog": [run("recorded", { box: box.privateKey, recorded: true }), want(false, true, false, true)],
    "a box this Studio does not hold": [run("stranger", { box: stranger }), want(false, true, false, false)],
  };
  const wrong = Object.keys(cases).filter((k) => JSON.stringify(cases[k][0]) !== JSON.stringify(cases[k][1]));
  if (wrong.length) return no("962s0b", wrong.map((k) => k + " " + JSON.stringify(cases[k][0])).join("; "));
  return true;
}
/* BOARD 962, STAGE 0B: WHAT AN ANSWER MUST CARRY TO LAND, under either seal. A box answer, about a catalog the team does not
   list, lands only carrying a told stamp (board 1014, which a desk before it never writes); an answer under the team key lands only
   signed by its desk, at the team's current key and about a catalog the team lists, and needs no stamp. Each refusal is said by name. */
async function check962b0a() {
  const run = scene962b0a("962b0a");
  const NONE = "a catalog the team does not list, answered with no told stamp";
  const cases = {
    "box answer, carrying a told stamp": [run("box-on", {}), 1, ""],
    "box answer, carrying another told stamp": [run("box-other", { given: "2026-10-01T09:00:00.000Z" }), 1, ""],
    "box answer from a desk before the stamp, carrying none": [run("box-none", { given: "" }), 0, NONE],
    "team-key answer, signed, listed": [run("tk-listed", { teamKey: true, listed: true }), 1, ""],
    "team-key answer from a desk before stage 0b, unsigned": [run("tk-unsigned", { teamKey: true, listed: true, unsigned: true }), 0,
      "a team-key answer not signed by this desk's roster key"],
    "team-key answer about a catalog the team does not list": [run("tk-unlisted", { teamKey: true }), 0,
      "a team-key answer about a catalog the team does not list"],
    "team-key answer under a retired key": [run("tk-retired", { teamKey: true, listed: true, seal: run.retired }), 0,
      "a team-key answer under a retired key number"],
    "team-key answer under a retired key, held by the removal record as stored before the desk left": [run("tk-retired-owed",
      { teamKey: true, listed: true, seal: run.retired, removedBefore: true }), 1, ""],
    "box answer from a desk the roster has left, written after it left": [run("box-removed-after", { removedAfter: true }), 0,
      "a box answer not signed by this desk's roster key"],
    "the same, read with no roster named": [run("box-removed-after-bare", { removedAfter: true, noRoster: true }), 0,
      "a box answer not signed by this desk's roster key"],
  };
  const wrong = Object.keys(cases).filter((k) => cases[k][0].due !== cases[k][1] || cases[k][0].why !== cases[k][2]);
  if (wrong.length) return no("962b0a", wrong.map((k) => k + " " + JSON.stringify(cases[k][0])).join("; "));
  return true;
}
/* The scene 962b0a and 962b0f share: a desk on team epoch 2 with an ask of this Studio's and an answer under the seal a case
   names; `run(name, o)` answers { due, why }, and `run.retired` is the team's retired key. o.removedAt sets the removal
   record's time (a number, or "none" for a record with no time), Date.now() where unset. */
function scene962b0a(tag) {
  const desk = deskPair("Switch desk");
  const lead = leadPair();
  const id = teamOf().id, k1 = crypto.randomBytes(32), k2 = crypto.randomBytes(32);
  const team = { id, key: k2, epoch: 2 }, retired = { id, key: k1, epoch: 1 };
  const keys = { [id]: { 1: k1, 2: k2 } };
  const R = Engine.answerLeadRules();
  const box = crypto.generateKeyPairSync("x25519");
  const boxPub = box.publicKey.export({ type: "spki", format: "der" }).subarray(-32).toString("hex");
  const own = catalogDoc("north-quay", 2, OTHER_BODY), pin = pinOf(own);
  const run = (name, o) => {
    const share = path.join(SCRATCH, tag, name);
    place(share, team, desk, { id: "north-quay", rev: 2, sha256: pin, signer: "", source: "file", title: OTHER_TITLE });
    const ask = Use.buildAsk({ desk: desk.id, sha256: pin, lead, content: !o.teamKey, team: id });
    Use.writeAsk(share, desk.id, ask);
    const at = path.join(share, "desks", desk.id, "catalog-answer.ec");
    if (o.teamKey) {
      const doc = o.unsigned ? { format: 1, kind: "etiuda-catalog-answer", sha256: pin, catalog: own } : signedAnswer(desk, ask.id, id, pin, own);
      writeEc(at, o.seal || team, doc);
    } else {
      const doc = signedAnswer(desk, ask.id, id, pin, own, o.given === undefined ? TOLD : o.given);
      fs.writeFileSync(at, JSON.stringify(R.sealAnswerLead(boxPub, id, lead.keyId, desk.id, JSON.stringify(doc)), null, 1) + "\n", "utf8");
    }
    const refused = [];
    /* A desk the roster has left, whose answer the removal record holds as stored before it left. */
    /* Or one whose record holds nothing it stored (Argon's F4a): its answer came after it left. */
    const removedAt = o.removedAt === "none" ? undefined : o.removedAt === undefined ? Date.now() : o.removedAt;
    const removed = o.removedBefore || o.removedAfter ? { [desk.id]: { key: desk.pub, at: removedAt, epoch: team.epoch,
      files: o.removedAfter ? {} : { ["desks/" + desk.id + "/catalog-answer.ec"]: crypto.createHash("sha256").update(fs.readFileSync(at)).digest("hex") } } } : undefined;
    const roster = o.noRoster ? undefined : o.removedBefore || o.removedAfter ? [] : [desk.id];
    const due = Use.answersDue(share, keys, {}, Object.assign({ lead, roster, box: box.privateKey, refused, removed },
      judged(team, [desk], o.listed ? ["north-quay"] : ["harbour-board"]),
      o.removedBefore || o.removedAfter ? { deskKeys: {} } : {}));
    return { due: due.length, why: refused.map((r) => r.why).join("|") };
  };
  run.retired = retired;
  return run;
}
/* BOARD 962, F4B: THE REMOVAL'S SEVEN DAYS BOUND WHAT IT OWES (Argon's review of stage 0b, the test architect's follow-up of
   2026-11-08 10:19, "F4b no 7-day bound on `o.owed` (pre-0b)"). A copy the removal record holds as stored before the desk left
   lands only inside the relay's own grace for a removed desk (REMOVED_KEEP_MS, read from the pinned engine), counted from the
   removal by this Studio's clock; past it, with a removal stamped ahead of the clock beyond the relay's allowance, or with no
   time at all, it is refused and said, under either seal. */
async function check962b0f() {
  const run = scene962b0a("962b0f");
  const C = Engine.relayRules().channel, keep = C.REMOVED_KEEP_MS, ahead = C.REMOVED_CLOCK_AHEAD_MS, hour = 3600000;
  const tk = { teamKey: true, listed: true, seal: run.retired, removedBefore: true }, bx = { removedBefore: true };
  const PAST = (kind) => kind + " from a desk since removed, outside the seven days after its removal";
  const cases = {
    "team-key answer held by the record, the removal six days and some ago": [run("tk-inside", Object.assign({ removedAt: Date.now() - keep + hour }, tk)), 1, ""],
    "team-key answer held by the record, the removal seven days and an hour ago": [run("tk-past", Object.assign({ removedAt: Date.now() - keep - hour }, tk)), 0, PAST("a team-key answer")],
    "box answer held by the record, the removal six days and some ago": [run("box-inside", Object.assign({ removedAt: Date.now() - keep + hour }, bx)), 1, ""],
    "box answer held by the record, the removal seven days and an hour ago": [run("box-past", Object.assign({ removedAt: Date.now() - keep - hour }, bx)), 0, PAST("a box answer")],
    "the same past the seven days, read with no roster named": [run("box-past-bare", Object.assign({ removedAt: Date.now() - keep - hour, noRoster: true }, bx)), 0,
      "a box answer not signed by this desk's roster key"],
    "box answer held by a record stamped an hour ahead of the clock": [run("box-ahead", Object.assign({ removedAt: Date.now() + ahead + hour }, bx)), 0, PAST("a box answer")],
    "box answer held by a record with no time": [run("box-timeless", Object.assign({ removedAt: "none" }, bx)), 0, PAST("a box answer")],
  };
  const wrong = Object.keys(cases).filter((k) => cases[k][0].due !== cases[k][1] || cases[k][0].why !== cases[k][2]);
  if (wrong.length) return no("962b0f", wrong.map((k) => k + " " + JSON.stringify(cases[k][0])).join("; "));
  return true;
}
/* BOARD 962, STAGE 0B: A DESK'S COPY OF A LISTED CATALOG. The desk judges "listed" by the whole grew chain and answers such a copy
   under the team key; Studio, seeing one hop, lands it, and refuses a copy of a copy as about a catalog the team does not list. */
async function check962b0d() {
  const desk = deskPair("Copy desk"), lead = leadPair(), team = teamOf();
  const base = catalogDoc("north-quay", 2, OTHER_BODY);
  const copy = Object.assign(catalogDoc(desk.id + "-1a2b3c4d", 3, OTHER_BODY), { grew: { id: "north-quay", rev: 2, sha: pinOf(base) } });
  const deeper = Object.assign(catalogDoc(desk.id + "-5e6f7a8b", 4, OTHER_BODY), { grew: { id: copy.id, rev: 3, sha: pinOf(copy) } });
  const run = (name, cat) => {
    const share = path.join(SCRATCH, "962b0d", name), pin = pinOf(cat);
    place(share, team, desk, { id: cat.id, rev: cat.rev, sha256: pin, signer: "", source: "file", title: OTHER_TITLE });
    const ask = Use.buildAsk({ desk: desk.id, sha256: pin, lead });
    Use.writeAsk(share, desk.id, ask);
    writeEc(path.join(share, "desks", desk.id, "catalog-answer.ec"), team, signedAnswer(desk, ask.id, team.id, pin, cat));
    const refused = [];
    const due = Use.answersDue(share, keysOf(team), {}, Object.assign({ lead, roster: [desk.id], refused }, judged(team, [desk], ["north-quay"])));
    return { due: due.length, why: refused.map((r) => r.why).join("|") };
  };
  const one = run("copy", copy), two = run("copy-of-copy", deeper);
  if (!(one.due === 1 && two.due === 0 && two.why === "a team-key answer about a catalog the team does not list"))
    return no("962b0d", JSON.stringify({ one, two }));
  return true;
}
/* BOARD 962, STAGE 0B, ROUND FIVE: AN ASK PAST ITS SEVEN DAYS, OR ONE THE LEAD'S SIGNED WITHDRAWAL NAMES, ANSWERS NOTHING, even put
   back beside its answer. */
async function check962b0e() {
  const desk = deskPair("Late desk"), lead = leadPair(), team = teamOf();
  const own = catalogDoc("north-quay", 2, OTHER_BODY), pin = pinOf(own);
  const run = (name, o) => {
    const share = path.join(SCRATCH, "962b0e", name);
    place(share, team, desk, { id: "north-quay", rev: 2, sha256: pin, signer: "", source: "file", title: OTHER_TITLE });
    const ask = Use.buildAsk(Object.assign({ desk: desk.id, sha256: pin, lead }, o.expired ? { expires: new Date(Date.now() - 1000).toISOString() } : {}));
    if (o.withdrawn) { Use.writeAsk(share, desk.id, ask); Use.withdrawAsk(share, desk.id, lead); }
    Use.writeAsk(share, desk.id, ask);
    writeEc(path.join(share, "desks", desk.id, "catalog-answer.ec"), team, signedAnswer(desk, ask.id, team.id, pin, own));
    const refused = [];
    const due = Use.answersDue(share, keysOf(team), {}, Object.assign({ lead, roster: [desk.id], refused }, judged(team, [desk], ["north-quay"])));
    return { due: due.length, why: refused.map((r) => r.why).join("|") };
  };
  const live = run("live", {}), expired = run("expired", { expired: true }), withdrawn = run("withdrawn", { withdrawn: true });
  if (!(live.due === 1 && expired.due === 0 && expired.why === "an ask past its seven days"
    && withdrawn.due === 0 && withdrawn.why === "an ask the lead has withdrawn"))
    return no("962b0e", JSON.stringify({ live, expired, withdrawn }));
  return true;
}
/* Board 962 stage 5, T3: a teammate on catalog B, which the team also lists, shows on A's Desks screen as the team's catalog B, named
   by this library's project of it and its rev, and not offered for import; the same copy with no team listing it is another catalog,
   importable, as before. */
async function check962s5w() {
  const w = world("962s5w");
  const other = catalogDoc("north-quay", 2, OTHER_BODY);
  const cat = { id: "north-quay", rev: 2, sha256: pinOf(other), signer: "", source: "file", title: OTHER_TITLE };
  place(w.share, w.team, w.desk, cat);
  const asTeam = rowOf(listed(w.share, w.project, w.team, [w.desk], { teamCatalogs: [{ id: "north-quay", title: "North Quay", rev: 2, editions: [] }] }), w.desk.id);
  const alone = rowOf(listed(w.share, w.project, w.team, [w.desk]), w.desk.id);
  const team = !!asTeam && asTeam.kind === "team" && asTeam.title === "North Quay" && asTeam.rev === 2 && asTeam.importable === false;
  const control = !!alone && alone.kind === "other" && alone.importable === true;
  const page = Use.forPage([asTeam])[0] || {};
  const shown = page.kind === "team" && page.importable === false && page.title === "North Quay";
  if (!(team && control && shown)) return no("962s5w", JSON.stringify({ team, control, shown, asTeam: asTeam && { kind: asTeam.kind, title: asTeam.title, importable: asTeam.importable } }));
  return true;
}

/* BOARD 962, STAGE 3: "LISTED" BY THE CHAIN THE DESK SIGNED. A team-key answer of a copy of a copy of a listed catalog, its chain
   signed, lands; a chain that skips the catalog's own grew, or starts at another id, is refused; an answer with no chain keeps the
   one-hop reading (962b0d). */
function chainedAnswer(desk, askId, teamId, sha, catalog, chain, content) {
  const doc = { format: 1, kind: "etiuda-catalog-answer", ask: String(askId), team: String(teamId), sha256: sha, catalog };
  if (content) doc.content = content;
  if (chain) doc.chain = chain;
  doc.sig = { alg: "Ed25519", keyId: desk.id };
  doc.sig.value = crypto.sign(null, Engine.answerLeadRules().answerLeadSignedBytes(doc), desk.pair.privateKey).toString("hex");
  return doc;
}
async function check962c3a() {
  const desk = deskPair("Chain desk"), lead = leadPair(), team = teamOf();
  const base = catalogDoc("north-quay", 2, OTHER_BODY);
  const copy = Object.assign(catalogDoc(desk.id + "-1a2b3c4d", 3, OTHER_BODY), { grew: { id: "north-quay", rev: 2, sha: pinOf(base) } });
  const deeper = Object.assign(catalogDoc(desk.id + "-5e6f7a8b", 4, OTHER_BODY), { grew: { id: copy.id, rev: 3, sha: pinOf(copy) } });
  const run = (name, cat, chain) => {
    const share = path.join(SCRATCH, "962c3a", name), pin = pinOf(cat);
    place(share, team, desk, { id: cat.id, rev: cat.rev, sha256: pin, signer: "", source: "file", title: OTHER_TITLE });
    const ask = Use.buildAsk({ desk: desk.id, sha256: pin, lead });
    Use.writeAsk(share, desk.id, ask);
    writeEc(path.join(share, "desks", desk.id, "catalog-answer.ec"), team, chainedAnswer(desk, ask.id, team.id, pin, cat, chain));
    const refused = [];
    const due = Use.answersDue(share, keysOf(team), {}, Object.assign({ lead, roster: [desk.id], refused }, judged(team, [desk], ["north-quay"])));
    return { due: due.length, why: refused.map((r) => r.why).join("|") };
  };
  const deep = run("deep", deeper, [deeper.id, copy.id, "north-quay"]);
  const skipped = run("skipped", deeper, [deeper.id, "north-quay"]);
  const headless = run("headless", deeper, ["north-quay"]);
  const unlistedRoot = run("unlisted-root", deeper, [deeper.id, copy.id, "harbour-elsewhere"]);
  const NOT = "a team-key answer whose chain does not match its catalog";
  if (!(deep.due === 1 && skipped.due === 0 && skipped.why === NOT && headless.due === 0 && headless.why === NOT
    && unlistedRoot.due === 0 && unlistedRoot.why === "a team-key answer about a catalog the team does not list"))
    return no("962c3a", JSON.stringify({ deep, skipped, headless, unlistedRoot }));
  return true;
}
/* BOARD 962, STAGE 3: A BOX ANSWER NEEDS ITS TOLD STAMP, LISTED OR NOT. The desk seals to the box only what it judged unlisted, so a box
   answer of a catalog Studio's list names lands only carrying a told stamp. */
async function check962c3b() {
  const desk = deskPair("Box listed desk"), lead = leadPair(), team = teamOf();
  const R = Engine.answerLeadRules();
  const box = crypto.generateKeyPairSync("x25519");
  const boxPub = box.publicKey.export({ type: "spki", format: "der" }).subarray(-32).toString("hex");
  const own = catalogDoc("north-quay", 2, OTHER_BODY), pin = pinOf(own);
  const run = (name, told) => {
    const share = path.join(SCRATCH, "962c3b", name);
    place(share, team, desk, { id: "north-quay", rev: 2, sha256: pin, signer: "", source: "file", title: OTHER_TITLE });
    const ask = Use.buildAsk({ desk: desk.id, sha256: pin, lead });
    Use.writeAsk(share, desk.id, ask);
    const doc = chainedAnswer(desk, ask.id, team.id, pin, own, ["north-quay"], told);
    fs.writeFileSync(path.join(share, "desks", desk.id, "catalog-answer.ec"),
      JSON.stringify(R.sealAnswerLead(boxPub, team.id, lead.keyId, desk.id, JSON.stringify(doc)), null, 1) + "\n", "utf8");
    const refused = [];
    const due = Use.answersDue(share, keysOf(team), {}, Object.assign({ lead, roster: [desk.id], refused, box: box.privateKey },
      judged(team, [desk], ["north-quay"])));
    return { due: due.length, why: refused.map((r) => r.why).join("|") };
  };
  const on = run("on", TOLD), off = run("off", "");
  if (!(on.due === 1 && off.due === 0 && off.why === "a catalog the team does not list, answered with no told stamp"))
    return no("962c3b", JSON.stringify({ on, off }));
  return true;
}
/* A teammate's working copy as the desk seals it to the lead's box since stage 3: its desk file, signed, inside the desk's signed
   statement naming the team, the told stamp and the chain. `o` bends one thing for a case. */
function boxCopy(share, desk, team, boxPub, leadKeyId, tail, o) {
  const opt = o || {};
  const R = Engine.branchLeadRules();
  const file = Object.assign(catalogDoc(desk.id + "-" + (opt.fileTail || tail), opt.rev || 2, OWN_BODY),
    { name: opt.name || "Quay copy " + tail, date: "2026-11-02", grew: { id: "north-quay", rev: 2, sha: "sha256:" + "ab".repeat(32) },
      desk: { id: desk.id, key: desk.pub, box: "ab".repeat(32), name: desk.name } });
  file.sig = { alg: "Ed25519", keyId: desk.id };
  file.sig.value = crypto.sign(null, D.branchSignedBytes(file), desk.pair.privateKey).toString("hex");
  const signer = opt.signer || desk;
  const said = { format: 1, kind: R.BRANCH_LEAD_INNER, team: opt.team || team.id, content: opt.at || TOLD,
    chain: opt.chain || [file.id, "north-quay"], file, sig: { alg: "Ed25519", keyId: signer.id } };
  if (opt.at === null) delete said.content;
  said.sig.value = crypto.sign(null, R.branchLeadSignedBytes(said), signer.pair.privateKey).toString("hex");
  const text = opt.bare ? JSON.stringify(file) : JSON.stringify(said);
  const at = path.join(share, "desks", opt.folder || desk.id, (opt.stem || "quay") + "-" + tail + ".ec");
  fs.mkdirSync(path.dirname(at), { recursive: true });
  fs.writeFileSync(at, JSON.stringify(R.sealBranchLead(boxPub, team.id, leadKeyId, opt.sealedFor || opt.folder || desk.id, text), null, 1) + "\n", "utf8");
  return at;
}
/* BOARD 962, STAGE 3: THE BOX COPIES, READ. A teammate's copy opens and is offered with its title, rev and edition; each replay is
   refused by name and left where it is: moved into another desk's folder, carrying no told stamp, renamed, from a desk before
   stage 3, re-signed by another desk, its chain bent, or from a desk the roster no longer holds. */
async function check962c3c() {
  const desk = deskPair("Copy desk"), mate = deskPair("Mate desk"), lead = leadPair(), team = teamOf();
  const box = crypto.generateKeyPairSync("x25519");
  const boxPub = box.publicKey.export({ type: "spki", format: "der" }).subarray(-32).toString("hex");
  const share = path.join(SCRATCH, "962c3c", "share");
  boxCopy(share, desk, team, boxPub, lead.keyId, "11111111");
  boxCopy(share, desk, team, boxPub, lead.keyId, "22222222", { at: "not a time" });
  boxCopy(share, desk, team, boxPub, lead.keyId, "33333333", { fileTail: "44444444" });
  boxCopy(share, desk, team, boxPub, lead.keyId, "55555555", { bare: true });
  boxCopy(share, desk, team, boxPub, lead.keyId, "66666666", { signer: mate });
  boxCopy(share, desk, team, boxPub, lead.keyId, "77777777", { chain: [desk.id + "-77777777", "harbour-board"] });
  boxCopy(share, desk, team, boxPub, lead.keyId, "88888888", { team: teamOf().id });
  /* The desk's own copy, sealed for its folder, then moved into the mate's: it opens for neither. */
  const moved = boxCopy(share, desk, team, boxPub, lead.keyId, "99999999");
  fs.mkdirSync(path.join(share, "desks", mate.id), { recursive: true });
  fs.renameSync(moved, path.join(share, "desks", mate.id, "quay-99999999.ec"));
  const o = { deskKeys: { [desk.id]: desk.pub, [mate.id]: mate.pub }, box: box.privateKey, team: team.id };
  const got = Use.boxCopiesOf(share, desk.id, o), gotMate = Use.boxCopiesOf(share, mate.id, o);
  const off = Use.boxCopiesOf(share, desk.id, Object.assign({}, o, { deskKeys: { [mate.id]: mate.pub } }));
  const why = Object.fromEntries(got.refused.map((r) => [r.ref, r.why]));
  const want = {
    "22222222": "a copy that carries no told stamp",
    "33333333": "a copy that is not this desk's own file under this name",
    "55555555": "a copy that is not a box copy, from a desk before stage 3",
    "66666666": "a copy not signed by this desk's roster key",
    "77777777": "a copy whose chain does not match its file",
    "88888888": "a copy signed for another team",
  };
  const c = got.copies[0] || {};
  const ok = got.copies.length === 1 && c.ref === "11111111" && c.title === "Quay copy 11111111" && c.rev === 2 && c.edition === "2026-11-02"
    && !!c.catalog && JSON.stringify(c.catalog).includes(OWN_BODY)
    && Object.keys(want).every((k) => why[k] === want[k])
    && gotMate.copies.length === 0 && gotMate.refused.length === 1 && gotMate.refused[0].why === "a copy that does not open under this Studio's box for this desk"
    && off.copies.length === 0 && off.refused.length === 0
    && fs.readdirSync(path.join(share, "desks", desk.id)).length === 7;
  if (!ok) return no("962c3c", JSON.stringify({ copies: got.copies.map((x) => x.ref), why, mate: gotMate.refused, off }));
  return true;
}
/* BOARD 962, STAGE 3: THE PAGE SEES FOUR FIELDS OF A COPY. With no box the copies wait as locked; on a Desks row the page sees each
   copy's handle, title, rev and edition and nothing of its catalog. */
async function check962c3d() {
  const desk = deskPair("Row desk"), lead = leadPair(), w = world("962c3d");
  const box = crypto.generateKeyPairSync("x25519");
  const boxPub = box.publicKey.export({ type: "spki", format: "der" }).subarray(-32).toString("hex");
  boxCopy(w.share, desk, w.team, boxPub, lead.keyId, "12121212");
  place(w.share, w.team, desk, { id: "north-quay", rev: 2, sha256: "sha256:" + "cd".repeat(32), signer: "", source: "file", title: OTHER_TITLE });
  let asked = 0;
  const fn = () => { asked++; return box.privateKey; };
  const roster = [{ id: desk.id, name: desk.name }];
  const lockedRows = listed(w.share, w.project, w.team, roster, judged(w.team, [desk], []));
  const onRows = listed(w.share, w.project, w.team, roster, Object.assign({ box: fn }, judged(w.team, [desk], [])));
  const page = Use.forPage(onRows);
  const locked = rowOf(lockedRows, desk.id) || {}, on = rowOf(page, desk.id) || {};
  const shown = JSON.stringify(on.copies || null);
  const ok = asked >= 1 && locked.copiesLocked === true && !locked.copies
    && shown === JSON.stringify([{ ref: "12121212", title: "Quay copy 12121212", rev: 2, edition: "2026-11-02" }])
    && !JSON.stringify(page).includes(OWN_BODY)
    && Use.boxCopyWaits(w.share, [desk.id]) === true && Use.boxCopyWaits(w.share, [lead.keyId]) === false;
  if (!ok) return no("962c3d", JSON.stringify({ asked, locked: !!locked.copiesLocked, shown }));
  return true;
}
/* BOARD 962, STAGE 3, ARGON'S F1: A DESK'S COPIES STAND APART FROM ITS IN-USE FILE. A teammate with no in-use.ec (ejected) or one that
   does not open keeps a row carrying its copies, or saying they are locked; a desk with neither has no row. */
async function check962c3e() {
  const lead = leadPair(), w = world("962c3e");
  const gone = deskPair("Ejected desk"), bent = deskPair("Bent desk"), bare = deskPair("Bare desk");
  const box = crypto.generateKeyPairSync("x25519");
  const boxPub = box.publicKey.export({ type: "spki", format: "der" }).subarray(-32).toString("hex");
  boxCopy(w.share, gone, w.team, boxPub, lead.keyId, "13131313");
  boxCopy(w.share, bent, w.team, boxPub, lead.keyId, "14141414");
  fs.writeFileSync(useFile(w.share, bent), "not a catalog\n", "utf8");
  fs.mkdirSync(path.join(w.share, "desks", bare.id), { recursive: true });
  const roster = [gone, bent, bare].map((d) => ({ id: d.id, name: d.name }));
  const on = judged(w.team, [gone, bent, bare], []);
  const onRows = listed(w.share, w.project, w.team, roster, Object.assign({ box: box.privateKey }, on));
  const lockedRows = listed(w.share, w.project, w.team, roster, on);
  const g = rowOf(onRows, gone.id) || {}, b = rowOf(onRows, bent.id) || {}, gl = rowOf(lockedRows, gone.id) || {};
  const page = rowOf(Use.forPage(onRows), gone.id) || {};
  const ok = Array.isArray(g.copies) && g.copies.length === 1 && g.copies[0].ref === "13131313" && !g.importable && !g.unread && !g.kind
    && b.unread === true && Array.isArray(b.copies) && b.copies.length === 1 && b.copies[0].ref === "14141414"
    && !rowOf(onRows, bare.id) && gl.copiesLocked === true && !gl.copies
    && JSON.stringify(page.copies || null) === JSON.stringify([{ ref: "13131313", title: "Quay copy 13131313", rev: 2, edition: "2026-11-02" }]);
  if (!ok) return no("962c3e", JSON.stringify({ g: { copies: (g.copies || []).map((c) => c.ref), kind: g.kind }, b: { unread: b.unread, copies: (b.copies || []).map((c) => c.ref) },
    bare: !!rowOf(onRows, bare.id), locked: !!gl.copiesLocked }));
  return true;
}
/* BOARD 962, STAGE 3, ARGON'S F2 (STUDIO'S HALF): ONE COPY PER HANDLE. Two files for one handle, an old name a rename left behind:
   the higher rev stands whatever the names sort to, and on a tie the newer file. */
async function check962c3f() {
  const desk = deskPair("Renamed desk"), lead = leadPair(), team = teamOf();
  const box = crypto.generateKeyPairSync("x25519");
  const boxPub = box.publicKey.export({ type: "spki", format: "der" }).subarray(-32).toString("hex");
  const share = path.join(SCRATCH, "962c3f", "share");
  boxCopy(share, desk, team, boxPub, lead.keyId, "15151515", { stem: "alpha", rev: 2, name: "Alpha" });
  boxCopy(share, desk, team, boxPub, lead.keyId, "15151515", { stem: "zeta", rev: 3, name: "Zeta" });
  const older = boxCopy(share, desk, team, boxPub, lead.keyId, "16161616", { stem: "omega", rev: 4, name: "Older" });
  const newer = boxCopy(share, desk, team, boxPub, lead.keyId, "16161616", { stem: "beta", rev: 4, name: "Newer" });
  fs.utimesSync(older, new Date("2026-11-02T08:00:00Z"), new Date("2026-11-02T08:00:00Z"));
  fs.utimesSync(newer, new Date("2026-11-02T09:00:00Z"), new Date("2026-11-02T09:00:00Z"));
  const got = Use.boxCopiesOf(share, desk.id, { deskKeys: { [desk.id]: desk.pub }, box: box.privateKey, team: team.id });
  const by = Object.fromEntries(got.copies.map((c) => [c.ref, c.title + "@" + c.rev]));
  const ok = got.copies.length === 2 && by["15151515"] === "Zeta@3" && by["16161616"] === "Newer@4" && got.refused.length === 0
    && fs.readdirSync(path.join(share, "desks", desk.id)).length === 4;
  if (!ok) return no("962c3f", JSON.stringify({ copies: got.copies.map((c) => c.ref + ":" + c.title + "@" + c.rev), refused: got.refused }));
  return true;
}
/* BOARD 962, STAGE 3, ARGON'S F4: A COPY ALONE IS A MOVE. A copy written, rewritten in place and removed, with no other file of the
   desk's touched, is reported by the live watch each time and moves the team watch's stamp each time. */
async function check962c3g() {
  const desk = deskPair("Watched desk"), lead = leadPair(), team = teamOf();
  const box = crypto.generateKeyPairSync("x25519");
  const boxPub = box.publicKey.export({ type: "spki", format: "der" }).subarray(-32).toString("hex");
  const share = path.join(SCRATCH, "962c3g", "share");
  fs.mkdirSync(path.join(share, "desks", desk.id), { recursive: true });
  const { folderStamp } = await import("../src/team-watch.mjs");
  const stamps = [folderStamp(share, new Map())];
  const seen = [];
  let watch = null;
  const heard = async () => {
    const until = Date.now() + 8000;
    while (Date.now() < until && !seen.length) await new Promise((r) => setTimeout(r, 40));
    const got = seen.includes(desk.id);
    seen.length = 0;
    return got;
  };
  const steps = [];
  try {
    watch = Use.watchFolder(share, (ids) => { ids.forEach((id) => seen.push(id)); }, { settle: 40 });
    await new Promise((r) => setTimeout(r, 200));
    const at = boxCopy(share, desk, team, boxPub, lead.keyId, "17171717");
    steps.push(await heard()); stamps.push(folderStamp(share, new Map()));
    boxCopy(share, desk, team, boxPub, lead.keyId, "17171717", { rev: 3, name: "Quay copy, rewritten" });
    fs.utimesSync(at, new Date("2026-11-03T09:00:00Z"), new Date("2026-11-03T09:00:00Z"));
    steps.push(await heard()); stamps.push(folderStamp(share, new Map()));
    fs.unlinkSync(at);
    steps.push(await heard()); stamps.push(folderStamp(share, new Map()));
  } finally { if (watch) watch.close(); }
  const moved = stamps.slice(1).map((s, i) => s !== stamps[i]);
  const ok = steps.length === 3 && steps.every(Boolean) && moved.every(Boolean);
  if (!ok) return no("962c3g", JSON.stringify({ heard: steps, moved }));
  return true;
}
/* FINDING 7: Importing an unlisted copy reloads projects, lands on the new catalog in a tab, and marks the copy row imported. */
async function check962c3h() {
  const { loadPage } = await import("./page-stand-in.mjs");
  let projectsLoaded = false;
  const mockNewDir = "C:\\projects\\imported-copy";
  const fakeLandedProject = {
    dir: mockNewDir,
    name: "Imported Catalog",
    project: { id: "imported-id", name: "Imported Catalog", rev: 1, counts: { cards: 5, intents: 0, cats: 0 } },
    draft: { id: "imported-id", rev: 1 },
    counts: { cards: 5, intents: 0, cats: 0 },
    langs: { all: ["en"], primary: "en", rows: [] },
    editions: [],
    lint: { errors: 0, warnings: 0, problemCount: 0, problemRows: [] },
    awaiting: [],
    tokens: [],
    cards: [],
  };
  const mockApi = {
    copyImport: async (dir, deskId, ref) => Object.assign({ landed: "imported-copy" }, fakeLandedProject),
    projects: async () => { projectsLoaded = true; return { projects: [fakeLandedProject.project] }; },
  };
  const home = loadPage({ api: mockApi });
  const P = home.page;
  const desk = { id: "d-1234", name: "Test Desk", copies: [{ ref: "c-ref-1", title: "Copy 1", rev: 1 }] };
  P.S.open = { dir: "C:\\projects\\team-proj", name: "Team Proj", editions: [] };
  P.S.tabs = [{ dir: "C:\\projects\\team-proj", name: "Team Proj" }];
  P.S.screen = "projects";
  P.S.home = "team";
  P.S.teamDir = "C:\\projects\\team-proj";
  P.S.desks = { uses: [desk] };

  const btn = {
    getAttribute(k) {
      if (k === "data-id") return desk.id;
      if (k === "data-ref") return desk.copies[0].ref;
      return null;
    },
  };
  await P.ACTS["copy-import"](btn);

  const landedOk = P.S.open && P.S.open.dir === mockNewDir && P.S.screen === "project" && P.S.section === "cards";
  const reloadedOk = projectsLoaded;

  P.S.open = { dir: "C:\\projects\\team-proj", name: "Team Proj", editions: [] };
  P.S.screen = "projects";
  P.S.home = "team";
  P.S.teamDir = "C:\\projects\\team-proj";
  P.S.desks = { uses: [desk], folder: "C:\\share", team: { id: "t1", relay: true, roster: [{ id: desk.id, name: desk.name }] } };
  P.paintDesks();
  const mainHtml = home.node("#main").innerHTML;
  const buttonGone = mainHtml.indexOf('data-act="copy-import"') === -1;
  const noteShown = mainHtml.indexOf("The catalog was imported as a new one.") >= 0;

  if (!landedOk || !reloadedOk || !buttonGone || !noteShown) {
    return no("962c3h", JSON.stringify({ landedOk, reloadedOk, buttonGone, noteShown }));
  }
  return true;
}
/* Board 962 stage 6, U1: a teammate still on catalog B after B moved to another team (or was taken off) shows on A's Desks screen as
   this library's catalog B, kind "library", named by its project and not offered for import; with no library catalog of that id it is
   another catalog, importable, as before; and a catalog the team still lists stays the team's. */
async function check962s6e() {
  const w = world("962s6e");
  const other = catalogDoc("north-quay", 2, OTHER_BODY);
  const cat = { id: "north-quay", rev: 2, sha256: pinOf(other), signer: "", source: "file", title: OTHER_TITLE };
  place(w.share, w.team, w.desk, cat);
  const lib = [{ id: "north-quay", title: "North Quay", editions: [] }];
  const asLib = rowOf(listed(w.share, w.project, w.team, [w.desk], { libraryCatalogs: lib }), w.desk.id);
  const asTeam = rowOf(listed(w.share, w.project, w.team, [w.desk], { libraryCatalogs: lib, teamCatalogs: [{ id: "north-quay", title: "North Quay", rev: 2, editions: [] }] }), w.desk.id);
  const alone = rowOf(listed(w.share, w.project, w.team, [w.desk]), w.desk.id);
  const library = !!asLib && asLib.kind === "library" && asLib.title === "North Quay" && asLib.rev === 2 && asLib.importable === false;
  const team = !!asTeam && asTeam.kind === "team";
  const control = !!alone && alone.kind === "other" && alone.importable === true;
  const page = Use.forPage([asLib])[0] || {};
  const shown = page.kind === "library" && page.importable === false && page.title === "North Quay";
  if (!(library && team && control && shown)) return no("962s6e", JSON.stringify({ library, team, control, shown, asLib: asLib && { kind: asLib.kind, title: asLib.title, importable: asLib.importable } }));
  return true;
}

/* A CATALOG STUDIO PUBLISHES FROM AN IMPORT STARTS ITS OWN LINEAGE (board class B, the test architect's ruling of 2026-11-19).
   The desk judges "listed" by the ROOT of the grew chain, so an imported catalog that kept `grew` naming the desk's file read as
   unlisted on every member's desk: sealed to the lead's box, not travelling as a team proposal, Private offered on the team's own
   catalog. From each start that makes a new project (copy-import, landCatalog; a teammate's desk file by hand, upgradeLand), the
   catalog published as the team's own is read on the pinned desk's real shell as a member: no grew, teamListedDoc true, its desk file
   travelling as a team proposal (branchGate names no box), the Private mark not offered, and the in-use catalog is the one a member
   pastes a card from (the text the shell holds and hands the page). The page's own paste (picker and clipboard) is not reached
   from node, and no page harness is built for it. */
async function checkSq() {
  const root = path.join(SCRATCH, "890sq", crypto.randomBytes(4).toString("hex"));
  fs.mkdirSync(root, { recursive: true });
  const S = await import("../src/studio.mjs");
  const H = await import("./desk-listed-stand.mjs");
  const { keyAt, open } = await H.lead(root);
  const made = await H.publishedFromImports(root, S, keyAt, open);
  const bad = [];
  for (const [start, ed] of Object.entries(made)) {
    const r = await H.deskReads(root, start, ed, keyAt, open);
    console.log("       " + start + ": grew " + JSON.stringify(ed.grew) + ", member " + r.member + ", lineage " + r.lineage.length
      + ", teamListedDoc " + r.teamListedDoc + ", gate " + JSON.stringify(r.gate && Object.keys(r.gate)) + ", private offered " + r.privateOffered
      + ", in use " + r.inUse + ", card " + JSON.stringify(r.pasteText));
    if (ed.grew) bad.push(start + " kept grew " + JSON.stringify(ed.grew));
    if (!r.member || !r.listsId) bad.push(start + " desk not a member that lists it");
    if (!r.teamListedDoc || !r.chainListed) bad.push(start + " reads unlisted");
    if (!r.travels) bad.push(start + " does not travel as a team proposal " + JSON.stringify(r.gate));
    if (r.privateOffered) bad.push(start + " Private offered on the team's own catalog");
    if (!r.inUse || r.pasteText !== H.CARD) bad.push(start + " in-use card text " + JSON.stringify(r.pasteText));
  }
  if (bad.length) return no("890sq", bad.join("; "));
  return true;
}
/* BOARD 1014, STUDIO'S HALF: NO SWITCH. The lead asks any member for a catalog the team does not list, and takes its box copy, with no
   setting anywhere. The desk's answer and copy carry `content`, the ISO time its agent was told (the told stamp); Studio lands
   one that carries a valid stamp and refuses one that does not, as it once refused a missing switch. */
function scene1014(tag) {
  const desk = deskPair("Told desk"), lead = leadPair(), team = teamOf();
  const R = Engine.answerLeadRules();
  const box = crypto.generateKeyPairSync("x25519");
  const boxPub = box.publicKey.export({ type: "spki", format: "der" }).subarray(-32).toString("hex");
  const own = catalogDoc("north-quay", 2, OTHER_BODY), pin = pinOf(own);
  return (name, o) => {
    const share = path.join(SCRATCH, tag, name);
    place(share, team, desk, { id: "north-quay", rev: 2, sha256: pin, signer: "", source: "file", title: OTHER_TITLE });
    const ask = Use.buildAsk({ desk: desk.id, sha256: pin, lead });
    Use.writeAsk(share, desk.id, ask);
    const at = path.join(share, "desks", desk.id, "catalog-answer.ec");
    if (o.teamKey) writeEc(at, team, signedAnswer(desk, ask.id, team.id, pin, own));
    else {
      const doc = signedAnswer(desk, ask.id, team.id, pin, own, o.told);
      fs.writeFileSync(at, JSON.stringify(R.sealAnswerLead(boxPub, team.id, lead.keyId, desk.id, JSON.stringify(doc)), null, 1) + "\n", "utf8");
    }
    const refused = [];
    const due = Use.answersDue(share, keysOf(team), {}, Object.assign({ lead, roster: [desk.id], box: box.privateKey, refused },
      judged(team, [desk], o.teamKey ? ["north-quay"] : [], null)));
    return { due: due.length, why: refused.map((r) => r.why).join("|") };
  };
}
async function check1014a() {
  const lead = leadPair(), desk = deskPair("Ask desk"), tid = teamOf().id;
  const team = { catalogs: ["north-quay"] };
  const listedShape = Use.askShape("north-quay", team), unlistedShape = Use.askShape("planted", team);
  const sha = "sha256:" + "cd".repeat(32);
  let two = null, built = "";
  try { two = Use.buildAsk({ desk: desk.id, sha256: sha, lead, content: unlistedShape.content === true, team: tid }); } catch (e) { built = String(e && e.message || e); }
  let unnamed = "";
  try { Use.buildAsk({ desk: desk.id, sha256: sha, lead, content: true }); } catch (e) { unnamed = String(e && e.message || e); }
  const ok = JSON.stringify(listedShape) === JSON.stringify({ content: false }) && JSON.stringify(unlistedShape) === JSON.stringify({ content: true })
    && !!two && !built && two.format === 2 && two.team === tid && !("content" in two) && !!unnamed;
  if (!ok) return no("1014a", JSON.stringify({ listedShape, unlistedShape, built, two: two && { format: two.format, team: two.team, content: two.content }, unnamed }));
  /* The pinned desk's askFresh, which since engine 1014 binds an ask on the team alone: its own team's ask is taken, another team's is not. */
  const copy = (d) => JSON.parse(JSON.stringify(d));
  const lk = { keyId: lead.keyId, public: lead.public };
  const fresh = engineAsk().askFresh(copy(two), { id: desk.id }, lk, { team: tid });
  const other = engineAsk().askFresh(copy(two), { id: desk.id }, lk, { team: teamOf().id });
  if (!(!!fresh && fresh.content === true && !other)) return no("1014a", JSON.stringify({ fresh, other }));
  return true;
}
async function check1014b() {
  const run = scene1014("1014b");
  const NONE = "a catalog the team does not list, answered with no told stamp";
  const cases = {
    "box answer carrying a told stamp, no setting anywhere": [run("told", { told: TOLD }), 1, ""],
    "box answer with a told stamp and no fraction of a second": [run("told-s", { told: "2026-11-19T15:50:00Z" }), 1, ""],
    "box answer with no told stamp": [run("none", {}), 0, NONE],
    "box answer whose stamp is not a time": [run("junk", { told: "yes" }), 0, NONE],
    "box answer whose stamp is a date with no time": [run("date", { told: "2026-11-19" }), 0, NONE],
    "box answer whose stamp is no real date": [run("month", { told: "2026-13-45T15:50:00.000Z" }), 0, NONE],
    "team-key answer, listed, no stamp": [run("tk", { teamKey: true }), 1, ""],
  };
  const wrong = Object.keys(cases).filter((k) => cases[k][0].due !== cases[k][1] || cases[k][0].why !== cases[k][2]);
  if (wrong.length) return no("1014b", wrong.map((k) => k + " " + JSON.stringify(cases[k][0])).join("; "));
  return true;
}
async function check1014c() {
  const desk = deskPair("Told copy desk"), lead = leadPair(), team = teamOf();
  const box = crypto.generateKeyPairSync("x25519");
  const boxPub = box.publicKey.export({ type: "spki", format: "der" }).subarray(-32).toString("hex");
  const share = path.join(SCRATCH, "1014c", "share");
  boxCopy(share, desk, team, boxPub, lead.keyId, "11111111", { at: TOLD });
  boxCopy(share, desk, team, boxPub, lead.keyId, "22222222", { at: null });
  boxCopy(share, desk, team, boxPub, lead.keyId, "33333333", { at: "yes" });
  boxCopy(share, desk, team, boxPub, lead.keyId, "44444444", { at: "2026-11-19" });
  const got = Use.boxCopiesOf(share, desk.id, { deskKeys: { [desk.id]: desk.pub }, box: box.privateKey, team: team.id });
  const why = Object.fromEntries(got.refused.map((r) => [r.ref, r.why]));
  const NONE = "a copy that carries no told stamp";
  const ok = got.copies.length === 1 && got.copies[0].ref === "11111111" && why["22222222"] === NONE && why["33333333"] === NONE && why["44444444"] === NONE;
  if (!ok) return no("1014c", JSON.stringify({ copies: got.copies.map((x) => x.ref), why }));
  return true;
}
/* Nothing in the source, the shell, the page or its words names the switch, its confirmation or the work regulations it asked about. */
async function check1014d() {
  const names = ["setTeamContent", "withContent", "REFUSAL_CONTENT_OFF", "REFUSAL_CONTENT_UNCONFIRMED", "studio:team-content", "teamContentOf",
    "CONTENT_SWITCH_FORMAT", "CONTENT_DECLS", "contentRules", "withdrawContentAsks", "work regulations"];
  const files = [];
  for (const dir of ["src", "shell", "ui"]) for (const n of fs.readdirSync(path.join(ROOT, dir))) if (/\.(mjs|cjs|js)$/.test(n)) files.push(path.join(dir, n));
  const hits = [];
  for (const f of files) {
    const text = fs.readFileSync(path.join(ROOT, f), "utf8");
    for (const n of names) if (text.includes(n)) hits.push(f + " names " + n);
  }
  const unlisted = Use.askShape("planted", { catalogs: [] });
  if (hits.length || unlisted.refusal) return no("1014d", JSON.stringify({ hits, unlisted }));
  return true;
}

const CHECKS = {
  "890sa": checkSa, "890sb": checkSb, "890sc": checkSc, "890sd": checkSd, "890se": checkSe,
  "890sf": checkSf, "890sg": checkSg, "890sh": checkSh, "890si": checkSi, "890sj": checkSj,
  "890sk": checkSk, "890sl": checkSl, "890sm": checkSm, "890sn": checkSn, "890so": checkSo, "890sp": checkSp, "890sq": checkSq,
  "945f9a": checkF9a, "945f9b": checkF9b, "945f9c": checkF9c, "945f9d": checkF9d,
  "lb1a": checkLb1a, "lb1b": checkLb1b, "962s0a": check962a, "962s0b": check962b, "962b0a": check962b0a, "962b0d": check962b0d, "962b0e": check962b0e, "962b0f": check962b0f, "962s5w": check962s5w, "962c3a": check962c3a, "962c3b": check962c3b, "962c3c": check962c3c, "962c3d": check962c3d, "962c3e": check962c3e, "962c3f": check962c3f, "962c3g": check962c3g, "962c3h": check962c3h, "962s6e": check962s6e, "1014a": check1014a, "1014b": check1014b, "1014c": check1014c, "1014d": check1014d,
};

/* 890si's plant puts back the landing of f52cb68, whole: the catalog written out by the CSV export and read back by
   the importer, which carries titles, bodies, notes, keywords, shelves and intents and nothing else. */
const LAND_NOW = [
  '  fs.writeFileSync(at, json(asNewCatalog(catalog, F, Engine.deskRules())), "utf8");',
  '  let read = null;',
  '  try { read = await upgradeOf(at); } catch (e) { if (e && e.said) throw unopenedCopy(""); throw e; }',
  '  const why = read.problems[0] || read.differs[0] || "";',
  '  if (why) throw unopenedCopy(why);',
  '  const base = landedName(catalog, o);',
  '  let named = base;',
  '  for (let n = 2; n < 100 && fs.existsSync(projectDir(root, Engine.fileStem()(named))); n++) named = base + " " + n;',
  '  return upgradeLand(root, at, named, { displayName: named, fileNameFrom: base, adoptedFrom: adoptedFromOf(catalog) });',
].join("\n");
const LAND_THEN = [
  '  const dir = path.join(path.dirname(at), name);',
  '  const made = await exportCsv({ catalog, out: dir });',
  '  const file = path.join(dir, path.basename(dir) + ".csv");',
  '  fs.renameSync(made.macros, file);',
  '  const plan = await importPlan(root, file);',
  '  if (plan && plan.refusal) throw new Error(plan.refusal);',
  '  return importLand(root, file);',
].join("\n");

const PLANTS = [
  ["890sa", "src/catalog-use.mjs", 'if (hit) return { kind: "edition"', 'if (false && hit) return { kind: "edition"'],
  ["890sb", "src/catalog-use.mjs", "if (id && id === projectId)", "if (false && id && id === projectId)"],
  ["890sc", "src/catalog-use.mjs", 'const title = cat && typeof cat.title === "string" ? cat.title : ""', 'const title = ""'],
  ["890sd", "src/catalog-use.mjs", "if (report && memo.get(key) !== now) moved.push(id);", "if (false && report && memo.get(key) !== now) moved.push(id);"],
  ["890se", "src/catalog-use.mjs", "const members = roster;",
    'const members = roster.concat(fs.readdirSync(path.join(folder, "desks")).filter((n) => DESK_ID.test(n) && !roster.some((r) => r.id === n)).map((id) => ({ id, name: id })));'],
  ["890sf", "src/catalog-use.mjs", "return Engine.deskRules().deskFileGenuine(inner, deskId) ? inner : null;", "return inner;"],
  ["890sf", "src/catalog-use.mjs", "deskFileGenuine(inner, deskId)", "deskFileGenuine(inner, String(inner.desk && inner.desk.id))"],
  ["890sg", "src/catalog-use.mjs", 'Buffer.from(ASK_PREFIX, "utf8")', 'Buffer.from("etiuda-wrong\\n", "utf8")'],
  ["890sh", "src/catalog-use.mjs", "return Number.isFinite(when) && when > Date.now();", "return false && Number.isFinite(when) && when > Date.now();"],
  ["890sh", "src/catalog-use.mjs", 'if (String(doc.desk || "") !== deskId) return false;', ""],
  ["890si", "src/studio.mjs", LAND_NOW, LAND_THEN],
  ["890sj", "src/catalog-use.mjs", "try { fs.unlinkSync(at); return true; }", "try { return true; }"],
  ["890sk", "src/catalog-use.mjs", "o.importable = !!(r && r.importable);", "o.importable = !!(r && r.importable);\n    o.teamKey = \"TEAMKEYMARKER\";"],
  ["890sl", "src/catalog-use.mjs", "movedOn: ans.sha256 !== asked,", "movedOn: false && ans.sha256 !== asked,"],
  ["890sn", "src/catalog-use.mjs", "if (!askSigned(ask, deskId, o.lead))", "if (false)"],
  ["890sn", "src/catalog-use.mjs", "if (!pin || pin !== claimed)", "if (false)"],
  ["890sn", "src/catalog-use.mjs", 'if (claimed !== String(ask.sha256 || "") && ', "if (false && "],
  ["890sn", "src/catalog-use.mjs", "if (!rosterOf(roster).some((r) => r.id === deskId)) return \"\";", "if (false) return \"\";"],
  ["890sn", "src/catalog-use.mjs", "const inner = inUseOf(folder, deskId, teamKeys);", 'const inner = openInner(path.join(folder, "desks", deskId, "in-use.ec"), teamKeys);'],
  ["890sn", "src/catalog-use.mjs", 'ask.kind !== ASK_KIND || String(ask.desk || "") !== deskId) return false;', "ask.kind !== ASK_KIND) return false;"],
  ["890sp", "src/catalog-use.mjs", "if (unread(folder, member.id))", "if (false)"],
  ["890sf", "src/catalog-use.mjs", "if (unread(folder, member.id))", 'if (unread(folder, member.id) && !openInner(path.join(folder, "desks", member.id, "in-use.ec"), opts.teamKeys))'],
  /* Since board 899 a copy written since the ask is no lapse whatever it is (`answered`), which covers a refused one too, so
     the plant takes both guards out. */
  ["890sp", "src/catalog-use.mjs", "const lapsed = !ask.waiting && !refused && !answered && ", "const lapsed = !ask.waiting && "],
  ["890sp", "src/catalog-use.mjs", "const refused = said.importable && ", "const refused = false && "],
  ["890sp", "src/catalog-use.mjs", "if (!(answered >= asked)) return false;", ""],
  ["890sp", "src/catalog-use.mjs", "const lapsed = !ask.waiting && ", "const lapsed = false && "],
  ["890sp", "src/catalog-use.mjs", "&& !done[ask.lapsedId];", ";"],
  ["890so", "ui/app.js", "return localMinute(iso);", 'return String(iso || "").slice(0, 16).replace("T", " ");'],
  ["890sm", "src/team-watch.mjs", 'id + ":use=" + statOf(path.join(desks, id, "in-use.ec"))', 'id + ":use=" + "same"'],
  ["945f9a", "src/catalog-use.mjs", 'doc.sig.value = crypto.sign(null, askSignedBytes(doc), lead.privateKey).toString("hex"); /* plant:f9-pause-sign */', 'doc.sig.value = "";'],
  ["945f9b", "ui/app.js", "d.admitPaused && asks.length ?", "false && d.admitPaused && asks.length ?"],
  ["945f9c", "src/catalog-use.mjs", 'doc.sig.value = crypto.sign(null, askSignedBytes(doc), lead.privateKey).toString("hex"); /* plant:f9-withdraw-sign */', 'doc.sig.value = "";'],
  ["945f9d", "src/catalog-use.mjs", "if (inner.cleared === true) return null; /* plant:f9-use-cleared */", "if (false && inner.cleared === true) return null;"],
  ["lb1a", "src/catalog-use.mjs", "if (tookEpoch(folder, m.id, opts.teamKeys, want)) return; /* plant:lb-names-took */", "if (true) return;"],
  ["lb1a", "src/catalog-use.mjs", "!(Number(env.epoch) >= want)) return false; /* plant:lb-names-epoch */", "false) return false;"],
  ["lb1a", "src/catalog-use.mjs", "return !!inUseOf(folder, deskId, teamKeys); /* plant:lb-names-open */", "return true;"],
  ["lb1b", "ui/app.js", "if (Array.isArray(r.names) && r.names.length) /* plant:lb-page-names */", "if (false)"],
  ["962s0a", "src/catalog-use.mjs", "const inner = sealed || openLeadBoxed(file, deskId, box);", "const inner = sealed;"],
  ["962s0b", "src/catalog-use.mjs", "const locked = unopened && !ans && boxLocked(folder, member.id, opts.box);", "const locked = false;"],
  ["962s5w", "src/catalog-use.mjs", "const listed = id ? (Array.isArray(teamCats) ? teamCats : []).find((c) => c.id === id) : null;", "const listed = null;"],
  ["962s6e", "src/catalog-use.mjs", "const ours = id ? (Array.isArray(libraryCats) ? libraryCats : []).find((c) => c.id === id) : null; /* plant:s6-library */", "const ours = null;"],
  ["962s0b", "src/catalog-use.mjs", "const ans = openAnswer(folder, deskId, o.teamKeys, o.box);", "const ans = openAnswer(folder, deskId, o.teamKeys);"],
  ["962s0b", "src/catalog-use.mjs", "openAnswer(folder, member.id, opts.teamKeys, opts.box) : null;", "openAnswer(folder, member.id, opts.teamKeys) : null;"],
  ["962s0a", "src/catalog-use.mjs", "if (!Engine.answerLeadRules().answerLeadGenuine(ans.doc, deskId, deskKeyOf(o, deskId, owed)))", "if (false)"],
  ["962s0a", "src/catalog-use.mjs", "if (String(ans.doc.ask) !== String(ask && ask.id || \"\"))", "if (false)"],
  ["962s0a", "src/catalog-use.mjs", "if (String(ans.doc.team) !== String(o.team || \"\"))", "if (false)"],
  ["962b0a", "src/catalog-use.mjs", "if (!Engine.answerLeadRules().answerLeadGenuine(ans.doc, deskId, deskKeyOf(o, deskId, owed)))", "if (ans.boxed && !Engine.answerLeadRules().answerLeadGenuine(ans.doc, deskId, deskKeyOf(o, deskId, owed)))"],
  ["962b0a", "src/catalog-use.mjs", "if (!ans.boxed && ans.epoch !== o.epoch && !owed)", "if (false)"],
  ["962b0a", "src/catalog-use.mjs", "if (!ans.boxed && !listed)", "if (false)"],
  ["962b0a", "src/catalog-use.mjs", "if (behind && !toldStamp(ans.doc.content))", "if (false)"],
  ["1014a", "src/catalog-use.mjs", "return { content: !listed }; /* plant:b1014-st-ask */", "return { content: false };"],
  ["1014a", "src/catalog-use.mjs", "doc.team = String(opts.team); /* plant:b1014-st-team */", ""],
  ["1014a", "src/catalog-use.mjs", "if (!TEAM_ID.test(String(opts.team || \"\"))) throw", "if (false) throw"],
  ["1014b", "src/catalog-use.mjs", "if (behind && !toldStamp(ans.doc.content))", "if (false)"],
  ["1014b", "src/catalog-use.mjs", "return typeof v === \"string\" && TOLD_RE.test(v) && Number.isFinite(Date.parse(v)); }", "return true; }"],
  ["1014b", "src/catalog-use.mjs", "&& TOLD_RE.test(v) && Number.isFinite", "&& Number.isFinite"],
  ["1014b", "src/catalog-use.mjs", "TOLD_RE.test(v) && Number.isFinite(Date.parse(v)); }", "TOLD_RE.test(v); }"],
  ["1014c", "src/catalog-use.mjs", "if (!toldStamp(doc.content)) return no(", "if (false) return no("],
  ["1014d", "src/catalog-use.mjs", "const ASK_CONTENT_FORMAT = 2; /* plant:b1014-st-scan */", "const ASK_CONTENT_FORMAT = 2; /* plant:b1014-st-scan */ /* withContent */"],
  ["962b0a", "src/catalog-use.mjs", "return owed === true && ownKey(o.removed, deskId) && o.removed[deskId]", "return ownKey(o.removed, deskId) && o.removed[deskId]"],
  ["962b0e", "src/catalog-use.mjs", "if (!(Number.isFinite(until) && until > Date.now())) return \"an ask past its seven days\";", ""],
  ["962b0e", "src/catalog-use.mjs", "if (askWithdrawnBy(o.folder, deskId, ask, o.lead)) return \"an ask the lead has withdrawn\";", ""],
  ["962b0d", "src/catalog-use.mjs", "|| (!!grewId && o.catalogs.indexOf(grewId) >= 0));", ");"],
  ["1014a", "src/catalog-use.mjs", "format: opts.content === true ? ASK_CONTENT_FORMAT : 1,", "format: 1,"],
  ["962b0f", "src/catalog-use.mjs", "const owed = o.owed === true && removalGrace(ownKey(o.removed, deskId) ? o.removed[deskId] : null, Date.now());", "const owed = o.owed === true;"],
  ["962b0f", "src/catalog-use.mjs", "if (o.owed === true && !owed && !ownKey(o.deskKeys, deskId))", "if (false)"],
  ["962b0f", "src/catalog-use.mjs", "return now <= at + keep && at <= now + ahead;", "return true;"],
  ["962b0f", "src/catalog-use.mjs", "return now <= at + keep && at <= now + ahead;", "return now <= at + keep;"],
  ["962c3a", "src/catalog-use.mjs", "if (chain === false) return kind + \" whose chain does not match its catalog\";", ""],
  ["962c3a", "src/catalog-use.mjs", "o.catalogs.indexOf(chain[chain.length - 1]) >= 0 /* plant:s3-st-chain-listed */", "false /* plant:s3-st-chain-listed */"],
  ["962c3a", "src/catalog-use.mjs", "if (g && g !== id ? c[1] !== g : c.length !== 1) return false; /* plant:s3-st-chain-hop */", ""],
  ["962c3b", "src/catalog-use.mjs", "const behind = ans.boxed || !listed;", "const behind = !listed;"],
  ["962c3c", "src/catalog-use.mjs", "if (!R.branchLeadGenuine(doc, desk, keyHex)) return no(", "if (false) return no("],
  ["962c3c", "src/catalog-use.mjs", "if (String(doc.team) !== String(opts.team || \"\")) return no(", "if (false) return no("],
  ["962c3c", "src/catalog-use.mjs", "if (!D.deskFileGenuine(file, desk) || !String(file.id || \"\").endsWith(\"-\" + c.ref))", "if (!D.deskFileGenuine(file, desk))"],
  ["962c3c", "src/catalog-use.mjs", "if (!signedChain(doc, file)) return no(", "if (false) return no("],
  ["962c3c", "src/catalog-use.mjs", "if (!keyHex) return out; /* plant:s3-st-copy-roster */", ""],
  ["962c3d", "src/catalog-use.mjs", "o.copies = r.copies.map((c) => ({ ref: String(c.ref), title: String(c.title || \"\"), rev: +c.rev || 0, edition: String(c.edition || \"\") }));", "o.copies = r.copies;"],
  ["962c3e", "src/catalog-use.mjs", "if (got.copies.length || got.locked) out.push(withCopies({ id: member.id, name: member.name || member.id, kind: \"\", importable: false, waiting: false })); /* plant:s3-st-copy-row */", "/* plant:s3-st-copy-row */"],
  ["962c3e", "src/catalog-use.mjs", "out.push(withCopies({ id: member.id, name: member.name || member.id, kind: \"\", unread: true,", "out.push(({ id: member.id, name: member.name || member.id, kind: \"\", unread: true,"],
  ["962c3f", "src/catalog-use.mjs", "if (!was || copy.rev > was.copy.rev || (copy.rev === was.copy.rev && mtime > was.mtime)) best.set(c.ref, { copy, mtime });", "best.set(c.ref + \":\" + best.size, { copy, mtime });"],
  ["962c3g", "src/catalog-use.mjs", "look(\"copies\", copiesStamp(path.join(desks, id))); /* plant:s3-st-copy-watch */", "/* plant:s3-st-copy-watch */"],
  ["890sq", "src/studio.mjs", "delete out.grew; /* plant:grew-drop */", "out.grew = { id: String(doc.id), rev: Number(doc.rev) || 0, sha: D.signedSha(doc) };"],
  ["962c3g", "src/team-watch.mjs", "id + \":copies=\" + copiesOf(path.join(desks, id))", "id + \":copies=\" + \"same\""],
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
      env: Object.assign({}, process.env, { CATALOG_USE_ONLY: id, ETIUDA_PLANTS: "off" }),
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
  /* ETIUDA_PLANTS=off (a merge's area run) skips the plants phase and counts it as the one check it is; the release
     profile runs with plants on, so the phase still runs there. */
  if (PLANTS_OFF) {
    console.log("SKIP the plants phase: " + PLANTS.length + " plants each turn their check red in a scratch copy, and the checkout's sha256 is unchanged after it (ETIUDA_PLANTS=off)");
  } else {
    const { plantsTree, treeSha, dropPlantsTree } = await import("./plants-tree.mjs");
    const before = treeSha(ROOT);
    const RUN_PLANTS = PLANT_IDS.length ? PLANTS.filter((x) => PLANT_IDS.includes(x[0])) : PLANTS;
    let red = 0;
    let held = false;
    try {
      tree = plantsTree(ROOT, "catalog-use");
      for (const [id, rel, from, to] of RUN_PLANTS) {
        const ok = plantOnce(id, rel, from, to);
        console.log((ok ? "plant " : "PLANT FAIL ") + id + (ok ? " red" : ""));
        if (ok) red++;
      }
      held = treeSha(ROOT) === before;
      console.log((held ? "ok   " : "FAIL ") + "the checkout's sha256 over src/, shell/ and ui/ is unchanged after the plants phase");
    } finally {
      dropPlantsTree(tree, ROOT);
    }
    if (red !== RUN_PLANTS.length || !held) {
      dropScratch(SCRATCH, "catalog-use");
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
  console.log("890s " + (n + (PLANTS_OFF ? 0 : 1)) + "/" + (IDS.length + 1) + (PLANTS_OFF ? ", 1 skipped" : ""));
  console.log("#counts checks=" + (IDS.length + (PLANTS_OFF ? 0 : 1)) + " skipped=" + (PLANTS_OFF ? 1 : 0)
    + " failed=" + (IDS.length - n) + " expected=" + (IDS.length + 1));
  dropScratch(SCRATCH, "catalog-use");
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
    try { dropScratch(SCRATCH, "catalog-use"); } catch { /* the verdict is the error above */ }
    process.exit(1);
  });
}
