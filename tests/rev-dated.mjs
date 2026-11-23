/* A CATALOG IS NAMED BY ITS REV FIRST AND ITS DATED EDITION BESIDE IT, LESS SO (board 902, Studio's half).
 *
 *     node tests/rev-dated.mjs
 *
 * Maxim, 2026-10-16 06:59, to "Should desks show the rev everywhere instead?": "can we have both, with rev more prominent,
 * and dated edition less so?". The desk's half is engine b807bc7 (catalog.js editionLabel and editionSaid): the rev first;
 * the date in parentheses where the words are plain ("rev 15 (2026-10-15a)"); beside a name, the date in the existing dim,
 * smaller type; a short label the rev alone with the date in its title; the rev alone where there is no date, and the date
 * alone where there is no rev, never a blank. Studio says it the same way wherever it names a catalog's edition.
 *
 *   rd1  the page's own naming: plain, rev alone, date alone, in English and in Polish
 *   rd2  a desk's catalog in use: an edition published here by its rev and date, a copy changed at a desk by the rev it
 *        grew from and that rev's date, and an edition with no rev by its date
 *   rd3  a card's history row puts its rev first and its date after in the dim small type, and a retired card's box says
 *        the rev it was retired in with its date
 *   rd4  short labels carry the rev alone and the date in their title: the tab's chip, the open-projects list, the
 *        publish button; a place's caption says both in words
 *   rd5  Statistics says the newest edition by its rev and date, in a sentence and beside its figure
 *   rd6  the publish cover's strip and archive line say each rev with its date, the next rev with the edition it will be
 *        stamped with
 *   rd7  the node half on a real archive (three publishes on a fixed clock): a desk's in-use row carries its rev and date,
 *        restoring from a rev that lacks the card is refused by the rev and date, the audit names every edition's rev and
 *        the rev a card has stood since, its pack's README and diff name both, the archive's notes name both, and a review
 *        note names the proposal's rev with the edition it was published as; release notes are headed by the rev and its
 *        date, and a publish with nothing changed in its cards is set against the rev before it by rev and date
 *   rd8 to rd13, the test architect's 407: a place's caption and label (rd8); the review queue's rev cell and the
 *        proposal's "Its edition" (rd9); the audit screen's chooser, heading and unchanged row (rd10); both command lines'
 *        first line, the earlier edition by its rev (rd11); the publish cover's big desk map with the date beside each
 *        rev and the mini map without (rd12); Project Settings' Last published and the Archive table's Rev column first
 *        (rd13)
 *
 * Each check is planted red first, under a plant putting the old naming back: the child runs that one check against the
 * planted source and must print PLANT-RED, and the source is put back by its sha256 before the next plant. Every word in
 * the fixtures is invented. Node only, no window. Exit 0 when every check holds, 1 when any fails.
 */
import "./licensed-env.mjs";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { plantText } from "./plant-copy.mjs";
import { fileURLToPath } from "node:url";
import { loadPage } from "./page-stand-in.mjs";
import { clearScratch, dropScratch } from "./scratch.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SCRATCH = path.join(ROOT, "scratch", "rev-dated");
const SELF = fileURLToPath(import.meta.url);
/* Set before the first plant. The child runs from this copy, so its ROOT is the copy. */
let tree = null;
const ONLY = process.env.REV_DATED_ONLY || "";
const PLANTS_OFF = process.env.ETIUDA_PLANTS === "off";
const NB = String.fromCharCode(160);

const ENT = { "&#39;": "'", "&quot;": "\"", "&lt;": "<", "&gt;": ">", "&amp;": "&" };
function textOf(html) {
  return String(html).replace(/<[^>]*>/g, " ").replace(/&#39;|&quot;|&lt;|&gt;|&amp;/g, (m) => ENT[m])
    .split(NB).join(" ").replace(/\s+/g, " ").trim();
}
const flat = (s) => String(s).split(NB).join(" ");
function no(id, why) {
  console.error(id + " " + why);
  return false;
}
/** The page, painted in one language, with a few names of its closure the stand-in does not list. */
function page(lang) {
  const home = loadPage({ api: {}, uiLang: lang || "en" });
  return { home, P: home.page, T: home.page.T };
}

async function checkRd1() {
  const en = page("en"), pl = page("pl");
  /* edPlain is not on the stand-in's list; it is read through the Changes screen's heading, which says the published rev. */
  const heading = (pg, rev, edition) => {
    pg.P.S.open = { dir: "C:\\harbour", project: { rev, edition }, editions: [], name: "Harbour tide", draft: { cards: [] } };
    pg.P.S.screen = "project"; pg.P.S.section = "changes"; pg.P.S.chg = { dir: "C:\\harbour", rev, list: [] };
    pg.P.paintMain();
    return textOf(pg.home.node("#main").innerHTML);
  };
  const a = heading(en, 15, "2026-10-15a"), b = heading(en, 15, ""), c = heading(pl, 15, "2026-10-15a");
  const ok = a.includes("The draft is the same as rev 15 (2026-10-15a)") && b.includes("The draft is the same as rev 15")
    && !b.includes("(") && c.includes("wersja 15 (2026-10-15a)");
  if (!ok) return no("rd1", JSON.stringify({ a: a.slice(0, 120), b: b.slice(0, 120), c: c.slice(0, 120) }));
  return true;
}

async function desksText(lang, uses) {
  const { home, P } = page(lang);
  P.S.open = { dir: "C:\\harbour", editions: [], name: "Harbour tide" };
  P.S.screen = "projects"; P.S.home = "team"; P.S.teamDir = "C:\\harbour"; P.S.lang = "en";
  P.S.desks = {
    folder: "C:\\share", file: "ours", signing: "lead-key", inside: false, keyHeld: true, canKeep: true,
    requests: [], invites: [], keyOpens: true, autoAdmit: false,
    team: { id: "t-0f1e2d3c4b5a6978", relay: true, epoch: 1, sealed: true, lists: true, exportsSealed: false, /* relay: the share stands for the relay mirror (the held-folder line otherwise) */
      roster: uses.map((u) => ({ id: u.id, name: u.name, own: "", key: u.id.slice(2), admitted: true, kind: "desk", door: "code" })) },
    uses,
  };
  P.paintMain();
  return textOf(home.node("#main").innerHTML);
}
async function checkRd2() {
  const uses = [
    { id: "k-0a1b2c3d4e5f6071", name: "Pier desk", kind: "edition", n: "2026-04-02b", rev: 7 },
    { id: "k-1b2c3d4e5f607182", name: "Dock desk", kind: "own", n: "6", dated: "2026-04-01a", importable: true },
    { id: "k-2c3d4e5f60718293", name: "Lock desk", kind: "edition", n: "2026-03-30a" },
  ];
  /* Through forPage, the fields the page may see, as the shell hands them. */
  const Use = await import("../src/catalog-use.mjs");
  const shown = Use.forPage(uses);
  const en = await desksText("en", shown), pl = await desksText("pl", shown);
  const ok = en.includes("rev 7 (2026-04-02b), published here") && en.includes("changed at the desk, from rev 6 (2026-04-01a)")
    && en.includes("edition 2026-03-30a, published here")
    && pl.includes("wersja 7 (2026-04-02b), opublikowana tutaj") && pl.includes("na podstawie wersji 6 (2026-04-01a)");
  if (!ok) return no("rd2", JSON.stringify({ en: en.slice(en.indexOf("Pier desk"), en.indexOf("Pier desk") + 300) }));
  return true;
}

async function checkRd3() {
  const { home, P } = page("en");
  const rows = [{ edition: "2026-09-13a", rev: 3, kinds: ["retired"], note: "" }, { edition: "2026-09-12a", rev: 2, kinds: ["text"], note: "" }];
  P.S.open = { dir: "C:\\harbour", editions: [], name: "Harbour tide" };
  P.S.hist = { id: "c-pier-lamp", dir: "C:\\harbour", rows, retiredIn: "2026-09-13a", retiredRev: 3, last: null };
  const row = P.histRow(rows[1], false);
  const box = textOf(P.retBox({ id: "c-pier-lamp", retired: true }));
  const order = /^<div class="hrow"><i><\/i><span>rev(?: |&nbsp;|\u00a0)2<\/span><span class="mono">2026-09-12a<\/span>/.test(row.split(NB).join(" "));
  const ok = order && box.startsWith("Retired in rev 3 (2026-09-13a).");
  if (!ok) return no("rd3", JSON.stringify({ row: row.slice(0, 160), box: box.slice(0, 80) }));
  return true;
}

async function checkRd4() {
  const { home, P } = page("en");
  const dir = "C:\\harbour";
  P.S.projects = [{ dir, name: "Harbour tide", rev: 15, edition: "2026-10-15a", counts: { cards: 3 } }];
  P.S.open = { dir, name: "Harbour tide", project: { rev: 15, edition: "2026-10-15a", folder: "C:\\share" }, editions: [], draft: { cards: [] } };
  P.S.screen = "project"; P.S.section = "cards";
  P.S.tabs = [{ dir, name: "Harbour tide", rev: 15 }];
  P.paintTabs();
  const tabs = home.node("#tabs").innerHTML;
  const chip = /<span class="rev" title="rev(?: |&nbsp;|\u00a0)15 \(2026-10-15a\)">rev(?: |&nbsp;|\u00a0)15<\/span>/.test(tabs);
  const ok = chip;
  if (!ok) return no("rd4", JSON.stringify({ tabs: tabs.slice(0, 400) }));
  return true;
}

async function checkRd5() {
  const src = fs.readFileSync(path.join(ROOT, "ui", "app.js"), "utf8");
  const { P } = page("en");
  /* The adoption's why is a sentence of the figures view; its frame is read from the source, said through the page's T. */
  const said = flat(P.T("The newest edition is {EDITION}.", { EDITION: P.T("rev {REV}", { REV: "15 (2026-10-15a)" }) }));
  const wired = /T\("The newest edition is \{EDITION\}\.", \{ EDITION: edPlain\(rel\.rev, rel\.edition\) \}\)/.test(src)
    && /smFig\(T\("rev \{REV\}", \{ REV: rel\.rev \}\)\) \+ \(rel\.edition \? " \(" \+ rel\.edition \+ "\)" : ""\)/.test(src)
    && /EDITION: edPlain\(rel\.rev, rel\.edition\) \}\)\)/.test(src) && !/The newest edition is \{E\}, rev \{R\}\./.test(src);
  const ok = wired && said === "The newest edition is rev 15 (2026-10-15a).";
  if (!ok) return no("rd5", JSON.stringify({ wired, said }));
  return true;
}

async function checkRd6() {
  const { home, P } = page("en");
  const dir = "C:\\harbour";
  const plan = { dir, name: "Harbour tide", rev: 14, next: 15, edition: "2026-10-16a", after: "2026-10-16b", was: "2026-10-15a",
    folder: "C:\\share", fileName: "harbour-tide.ec", editions: 14, published: null, langs: ["en"],
    counts: { cards: 2 }, lint: { errors: 0, warnings: 0, rows: [] }, awaiting: [], strip: { first: false, groups: [{ label: { en: "Tides" }, cards: ["u", "c"] }] },
    licence: null, signing: { keyId: "", print: "", opens: false } };
  P.S.open = { dir, name: "Harbour tide", project: { rev: 14, edition: "2026-10-15a", folder: "C:\\share" }, editions: [], draft: { cards: [], langs: [{ code: "en" }] } };
  P.S.screen = "project"; P.S.section = "cards"; P.S.plan = plan; P.S.cover = "publish";
  let html = "";
  try { html = P.coverHtml(); } catch (e) { return no("rd6", "coverHtml threw " + (e && e.message)); }
  const t = textOf(html);
  const ok = t.includes("1 card as in rev 14 (2026-10-15a)") && t.includes("2 cards go out in rev 15 (2026-10-16a)")
    && t.includes("A copy of rev 15 (2026-10-16a) in the catalog's archive")
    && /id="prGo" title="rev(?: |&nbsp;|\u00a0)15 \(2026-10-16a\)"/.test(html.split(NB).join(" "));
  if (!ok) return no("rd6", JSON.stringify({ text: t.slice(0, 600) }));
  return true;
}

/* ---- the node half on a real archive ---- */
/** A project of lamps published three times on a fixed clock: rev 1 the pier lamp, rev 2 the gate lamp added, rev 3 the
 *  gate lamp retired. Each check that needs it builds its own, so a plant's child stands alone. */
async function lampArchive(tag) {
  const S = await import("../src/studio.mjs");
  const Pub = await import("../src/publish.mjs");
  const root = path.join(SCRATCH, tag, crypto.randomBytes(4).toString("hex"));
  const made = await S.newProject(root, "Lamp rota", [{ code: "en", name: "English" }]);
  const dir = made.dir;
  const shelf = ((await S.addTag(dir, "shelf", { en: "Lamps" })).tag).id;
  const lamp = (await S.addCard(dir, shelf, "Pier lamp", "The pier lamp is lit at dusk.")).card.id;
  const eds = [];
  const publish = async (day) => {
    const before = Pub.editionsIn(dir);
    await Pub.publishFull({ project: dir, notes: "Lamps, day " + day + ".", now: "2026-09-" + day + "T10:00:00.000Z" });
    eds.push(Pub.editionsIn(dir).filter((e) => before.indexOf(e) < 0)[0]);
  };
  await publish(11);
  const gate = (await S.addCard(dir, shelf, "Gate lamp", "The gate lamp stays dark.")).card.id;
  await publish(12);
  await S.retireCard(dir, gate);
  await publish(13);
  return { S, Pub, root, dir, shelf, lamp, gate, eds, publish };
}

async function checkRd7() {
  const Audit = await import("../src/audit.mjs");
  const Review = await import("../src/review.mjs");
  const { S, root, dir, lamp, gate, eds, publish } = await lampArchive("rd7");
  const facts = {};
  /* the card's history and a restore refused by the rev */
  const h = await S.cardHistory(dir, gate);
  facts.retired = h.retiredIn === eds[2] && h.retiredRev === 3;
  let refused = null;
  try { await S.restoreText(dir, gate, eds[0]); } catch (e) { refused = e; }
  facts.restore = !!refused && refused.said && refused.said.frame === "rev {R} holds no card {ID}, so there is no text in it to restore"
    && refused.said.vars.R === "1 (" + eds[0] + ")";
  /* the audit */
  const pack = await Audit.auditFor(dir, eds[1]);
  const pier = pack.cards.find((c) => c.id === lamp) || {};
  facts.audit = pack.revs[eds[0]] === 1 && pack.revs[eds[2]] === 3 && pier.sinceRev === 1 && pier.since === eds[0] && pack.previousRev === 1;
  const out = path.join(root, "packs");
  fs.mkdirSync(out, { recursive: true });
  const w = await Audit.writePack(dir, eds[1], out);
  const readme = fs.readFileSync(path.join(w.folder, "README.txt"), "utf8");
  const diffFile = fs.readFileSync(path.join(w.folder, "changed-since-" + eds[0] + ".txt"), "utf8");
  facts.readme = readme.includes("Lamp rota, rev 2 (" + eds[1] + ")") && readme.includes("changed against rev 1 (" + eds[0] + ")")
    && diffFile.startsWith("What rev 2 (" + eds[1] + ") changed against rev 1 (" + eds[0] + ")");
  /* the archive's release notes: headed by the rev and its date (condition 4), and naming the earlier one so */
  const notes = fs.readFileSync(path.join(dir, "archive", eds[1], "release-notes.md"), "utf8");
  facts.notes = notes.split("\n")[0] === "# Lamp rota rev 2 (" + eds[1] + ")"
    && notes.includes("Rev 2 (" + eds[1] + "), catalog id") && notes.includes("## Against rev 1 (" + eds[0] + ")");
  /* a review note: rev 1's catalog come back, the working copy at rev 3 */
  const back = Object.assign(JSON.parse(fs.readFileSync(path.join(dir, "archive", eds[0], "catalog.ec"), "utf8")), { modified: true });
  const backAt = path.join(root, "lamp-rota-back.ec");
  fs.writeFileSync(backAt, JSON.stringify(back), "utf8");
  const r = await Review.reviewProposal({ project: dir, file: backAt, beside: false, write: false });
  const note = (r.notes || []).find((n) => n && n.said && /made against rev/.test(n.said.frame));
  facts.review = !!note && note.said.vars.THEIRS === "1 (" + eds[0] + ")" && note.said.vars.OURS === "3 (" + eds[2] + ")";
  /* THE EXTENSION (the test architect's SP18, read): a publish with nothing changed in its cards is headed and set against
     the rev before it by rev and date. Its "identical to" line is not reached: the header's rev and date always differ from the
     edition before, and the diff counts them, so no publish writes that line. */
  await publish(14);
  const same = fs.readFileSync(path.join(dir, "archive", eds[3], "release-notes.md"), "utf8");
  facts.again = same.split("\n")[0] === "# Lamp rota rev 4 (" + eds[3] + ")" && same.includes("## Against rev 3 (" + eds[2] + ")")
    && same.includes("0 card(s) added, 0 removed, 0 changed");
  const ok = Object.keys(facts).every((k) => facts[k]);
  if (!ok) return no("rd7", JSON.stringify(Object.assign(facts, { eds, refused: refused && refused.said, notes: notes.slice(0, 200),
    readme: readme.split("\n").slice(0, 3), note: note && note.said, same: same.slice(0, 400) })));
  return true;
}

/* rd8: a place's caption and its label say the rev and its date (SP2, SP20) */
async function checkRd8() {
  const { home, P } = page("en");
  const dir = "C:\\harbour";
  P.S.projects = [{ dir, name: "Harbour tide", rev: 15, edition: "2026-10-15a", counts: { cards: 3 } }];
  P.S.places = { list: [{ dir, name: "Harbour tide", rev: 15, here: false, meta: "3 cards, never published",
    face: home.doc.createElement("div") }], lifted: null, naming: false, typed: "", err: null, busy: false, opening: false, keyed: false };
  P.placesPaint();
  const kids = home.node("#places").children || [];
  const cap = kids.find((k) => k.className === "cap");
  const hit = kids.find((k) => k.className === "hit");
  const capText = cap ? textOf(cap.innerHTML) : "";
  const label = hit ? flat(hit.getAttribute("aria-label") || "") : "";
  const ok = capText.includes("rev 15 (2026-10-15a)") && label === "Harbour tide, rev 15 (2026-10-15a), 3 cards, never published";
  if (!ok) return no("rd8", JSON.stringify({ capText, label, kids: kids.length }));
  return true;
}

/* rd9: the review queue's rev cell and the proposal's "Its edition" (SP3, SP4) */
async function checkRd9() {
  const { home, P } = page("en");
  P.S.open = { dir: "C:\\harbour", editions: [], name: "Harbour tide", project: { rev: 9 }, draft: { cards: [] } };
  P.S.screen = "project"; P.S.section = "queue";
  P.S.rv = { list: [{ file: "C:\\inbox\\pier-file.ec", name: "pier-file.ec", ok: true, foreign: false, rev: 7, edition: "2026-04-02b",
    proposes: {}, pending: 1 }], inbox: "C:\\inbox" };
  P.paintProposalList();
  const row = textOf(home.node("#main").innerHTML);
  const facts = textOf(P.rvFacts({ name: "pier-file.ec", rev: 7, edition: "2026-04-02b", proposes: {} }));
  const ok = row.includes("rev 7 (2026-04-02b)") && facts.includes("Its edition rev 7 (2026-04-02b)");
  if (!ok) return no("rd9", JSON.stringify({ row: row.slice(0, 300), facts: facts.slice(0, 200) }));
  return true;
}

/* rd10: the audit screen's chooser (the rev, its date in the title), its table's heading and an unchanged row (SP6, SP7, SP17) */
async function checkRd10() {
  const Audit = await import("../src/audit.mjs");
  const { dir, eds, lamp } = await lampArchive("rd10");
  const pack = await Audit.auditFor(dir, eds[1]);
  const { home, P } = page("en");
  P.S.open = { dir, editions: eds.slice(), name: "Lamp rota", project: { rev: 3 }, draft: { cards: [] } };
  P.S.screen = "project"; P.S.section = "audit"; P.S.audit = pack;
  P.paintAudit();
  const html = flat(home.node("#main").innerHTML), text = textOf(html);
  const seg = new RegExp('data-act="audit-pick" data-e="' + eds[0] + '" tabindex="0" title="rev 1 \\(' + eds[0] + '\\)">rev 1<').test(html);
  const ok = seg && text.includes("Every card in rev 2 (" + eds[1] + ")") && text.includes("unchanged since rev 1 (" + eds[0] + ")")
    && !!pack.cards.find((c) => c.id === lamp && c.sinceRev === 1);
  if (!ok) return no("rd10", JSON.stringify({ seg, text: text.slice(0, 500) }));
  return true;
}

/* rd11: both command lines' first line names the earlier edition by its rev and date (SP11, SP12; condition 5) */
async function checkRd11() {
  const { S, dir, eds, shelf } = await lampArchive("rd11");
  const audit = spawnSync(process.execPath, [path.join(ROOT, "tools", "audit.mjs"), dir, "--edition", eds[1]], { encoding: "utf8", timeout: 60000 });
  await S.addCard(dir, shelf, "Quay lamp", "The quay lamp is lit last.");
  const pub = spawnSync(process.execPath, [path.join(ROOT, "tools", "publish.mjs"), dir, "--now", "2026-09-15T10:00:00.000Z", "--notes", "Lamps, day 15."],
    { encoding: "utf8", timeout: 120000 });
  const a = String(audit.stdout || "").split(/\r?\n/).find((l) => /Lamp rota, /.test(l)) || "";
  const p = String(pub.stdout || "").split(/\r?\n/)[0] || "";
  const ok = a.includes("Lamp rota, rev 2 (" + eds[1] + "), after rev 1 (" + eds[0] + ")")
    && /^publish  rev 4 \(\S+\), after rev 3 \(/.test(p) && p.endsWith(", after rev 3 (" + eds[2] + ")");
  if (!ok) return no("rd11", JSON.stringify({ a, p, audit: audit.status, pub: pub.status, err: String(pub.stderr || "").slice(0, 200) }));
  return true;
}

/* rd12: the publish cover's big desk map names each rev with its date, the mini map the rev alone (condition 6) */
async function checkRd12() {
  const { P } = page("en");
  P.S.plan = { dir: "C:\\harbour", name: "Harbour tide", rev: 14, next: 15, edition: "2026-10-16a", was: "2026-10-15a",
    folder: "C:\\share", fileName: "harbour-tide.ec" };
  P.S.planDesks = null;
  const big = P.prMapOpts(true), mini = P.prMapOpts(false);
  const ok = flat(big.sub) === "harbour-tide.ec, rev 14 (2026-10-15a)" && String(big.chip) === "15 (2026-10-16a)"
    && String(big.was) === "14 (2026-10-15a)" && big.chipRev === 15
    && flat(mini.sub) === "rev 14" && String(mini.chip) === "15";
  if (!ok) return no("rd12", JSON.stringify({ big: { sub: big.sub, chip: big.chip, was: big.was }, mini: { sub: mini.sub, chip: mini.chip } }));
  return true;
}

/* rd13: Project Settings' Last published says the rev with its date (condition 2), and the Archive table puts its Rev
   column before its Edition column (condition 3) */
async function checkRd13() {
  const { home, P } = page("en");
  const dir = "C:\\harbour";
  P.S.open = { dir, name: "Harbour tide", editions: ["2026-10-14a", "2026-10-15a"], fileName: null,
    project: { rev: 15, edition: "2026-10-15a", folder: "C:\\share" }, draft: { cards: [], langs: [{ code: "en" }] },
    langs: { rows: [], primary: "en", builtIn: [] } };
  P.S.screen = "project"; P.S.section = "settings";
  let settings = "";
  try { P.paintProjectSettings(); settings = textOf(home.node("#main").innerHTML); } catch (e) { settings = "threw " + (e && e.message); }
  P.S.section = "archive";
  P.S.arch = { editions: [{ edition: "2026-10-14a", rev: 14, counts: { cards: 2 }, notes: "" }, { edition: "2026-10-15a", rev: 15, counts: { cards: 3 }, notes: "" }] };
  P.S.pair = []; P.S.diff = null;
  P.paintArchive();
  const arch = flat(home.node("#main").innerHTML);
  const head = /<tr><th>Rev<\/th><th>Edition<\/th>/.test(arch);
  const first = /data-e="2026-10-15a" tabindex="0">(?:<!--[^>]*-->)?<td class="mono">rev 15<\/td><td class="mono">2026-10-15a<\/td>/.test(arch);
  const ok = settings.includes("Last published rev 15 (2026-10-15a)") && head && first;
  if (!ok) return no("rd13", JSON.stringify({ settings: settings.slice(settings.indexOf("Last published"), settings.indexOf("Last published") + 60), head, first }));
  return true;
}

const CHECKS = { rd1: checkRd1, rd2: checkRd2, rd3: checkRd3, rd4: checkRd4, rd5: checkRd5, rd6: checkRd6, rd7: checkRd7,
  rd8: checkRd8, rd9: checkRd9, rd10: checkRd10, rd11: checkRd11, rd12: checkRd12, rd13: checkRd13 };

/* Each plant puts one old naming back. */
const PLANTS = [
  ["rd1", "ui/app.js", "const revText = (rev, dated) => String(rev) + (dated ? \" (\" + dated + \")\" : \"\");", "const revText = (rev, dated) => String(rev);"],
  ["rd2", "ui/app.js", "if (u.kind === \"edition\") return hasRev(u.rev) ?", "if (u.kind === \"edition\") return false ?"],
  ["rd2", "src/catalog-use.mjs", "\"unread\", \"refused\", \"lapsed\", \"unopened\", \"why\", \"rev\", \"dated\"];", "\"unread\", \"refused\", \"lapsed\", \"unopened\", \"why\"];"],
  ["rd3", "ui/app.js", "<i></i>' + (hasRev(r.rev) ?", "<i></i>' + (false ?"],
  ["rd3", "ui/app.js", "const said = !h ? \"\" : h.retiredIn && hasRev(h.retiredRev)", "const said = !h ? \"\" : h.retiredIn && false"],
  ["rd4", "ui/app.js", "const revTitle = (rev, dated) => (dated ?", "const revTitle = (rev, dated) => (false ?"],
  ["rd5", "ui/app.js", "esc(T(\"The newest edition is {EDITION}.\", { EDITION: edPlain(rel.rev, rel.edition) }))",
    "esc(T(\"The newest edition is {E}, rev {R}.\", { E: rel.edition, R: rel.rev }))"],
  ["rd6", "ui/app.js", "\"{N} cards go out in rev {REV}\"), revText(p.next, p.edition)));", "\"{N} cards go out in rev {REV}\"), p.next));"],
  ["rd7", "src/studio.mjs", "if (!was && keptRev !== null) throw", "if (false) throw"],
  ["rd7", "src/audit.mjs", "      sinceRev: how === HOW.unchanged ? revAt(steps, origin.edition) : null,\n", ""],
  ["rd7", "src/audit.mjs", "  rule(pack.name + \", \" + named(pack.rev, pack.edition));", "  rule(pack.name + \", edition \" + pack.edition + (pack.rev == null ? \"\" : \", rev \" + pack.rev));"],
  ["rd7", "src/publish.mjs", "  L.push(\"Rev \" + o.rev + \" (\" + o.edition + \"), catalog id `\" + o.id + \"`.\");",
    "  L.push(\"Rev \" + o.rev + \", edition \" + o.edition + \", catalog id `\" + o.id + \"`.\");"],
  ["rd7", "src/review.mjs", "  return String(rev) + (d ? \" (\" + d + \")\" : \"\");", "  return String(rev);"],
  ["rd7", "src/studio.mjs", "{ retiredIn = r.edition; retiredRev = r.rev == null ? null : r.rev; }", "{ retiredIn = r.edition; }"],
  /* The test architect's 407: his unguarded places and conditions 2 to 6, each put back to the old naming. */
  ["rd7", "src/publish.mjs", "  L.push(\"# \" + o.name + \" rev \" + o.rev + \" (\" + o.edition + \")\");", "  L.push(\"# \" + o.name + \" \" + o.edition);"],
  ["rd7", "src/publish.mjs", "    previousRev: before && before.rev != null && Number.isFinite(+before.rev) ? +before.rev : null,", "    previousRev: null,"],
  ["rd8", "ui/app.js", "'<span class=\"mono\">' + esc(edPlain(p.rev | 0, datedOf(p.dir))) + \"</span><span>\" + esc(p.meta)",
    "'<span class=\"mono\">' + esc(T(\"rev {REV}\", { REV: p.rev | 0 })) + \"</span><span>\" + esc(p.meta)"],
  ["rd8", "ui/app.js", "p.name + \", \" + edPlain(p.rev | 0, datedOf(p.dir)) + \", \" + p.meta", "p.name + \", \" + T(\"rev {REV}\", { REV: p.rev | 0 }) + \", \" + p.meta"],
  ["rd9", "ui/app.js", "'<td class=\"mono\">' + esc(edPlain(p.rev, p.edition)) + \"</td>\"", "'<td class=\"mono\">' + (p.rev == null ? \"\" : \"rev\" + NB + p.rev) + \"</td>\""],
  ["rd9", "ui/app.js", "kv(T(\"Its edition\"), edPlain(o.rev, o.edition) || T(\"nothing\"), 1)",
    "kv(T(\"Its edition\"), [o.edition, o.rev == null ? null : \"rev\" + NB + o.rev].filter(Boolean).join(\" \") || T(\"nothing\"), 1)"],
  ["rd10", "ui/app.js", "'\" tabindex=\"0\"' + (hasRev((p.revs || {})[e]) ?", "'\" tabindex=\"0\"' + (false ?"],
  ["rd10", "ui/app.js", "esc(hasRev(p.rev) ? bindTo(T(\"Every card in rev {R}\"", "esc(false ? bindTo(T(\"Every card in rev {R}\""],
  ["rd10", "ui/app.js", "esc(hasRev(c.sinceRev) ? T(\"unchanged since rev {R}\"", "esc(false ? T(\"unchanged since rev {R}\""],
  ["rd11", "tools/audit.mjs", "\", after \" + (pack.previousRev == null ? pack.previous :", "\", after \" + (true ? pack.previous :"],
  ["rd11", "tools/publish.mjs", "\", after \" + (prevRev == null ? prev :", "\", after \" + (true ? prev :"],
  ["rd12", "ui/app.js", "const was = big ? revText(p.rev, p.was) : p.rev, next = big ? revText(p.next, p.edition) : p.next;", "const was = p.rev, next = p.next;"],
  ["rd13", "ui/app.js", "'<span class=\"mono\">' + esc(edPlain(p.project.rev, last)) + \"</span>\"", "'<span class=\"mono\">' + esc(last) + \"</span>\""],
  ["rd13", "ui/app.js", "'<div class=\"pane\"><table><tr><th>' + esc(T(\"Rev\")) + \"</th><th>\"\n          + esc(T(\"Edition\"))",
    "'<div class=\"pane\"><table><tr><th>' + esc(T(\"Edition\")) + \"</th><th>\"\n          + esc(T(\"Rev\"))"],
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
      cwd: tree, env: Object.assign({}, process.env, { REV_DATED_ONLY: id, ETIUDA_PLANTS: "off" }), encoding: "utf8", timeout: 180000,
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
      tree = plantsTree(ROOT, "rev-dated");
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
      dropScratch(SCRATCH, "rev-dated");
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
  dropScratch(SCRATCH, "rev-dated");
  console.log("#counts checks=" + (legs.length + (PLANTS_OFF ? 0 : 1)) + " skipped=" + (PLANTS_OFF ? 1 : 0)
    + " failed=" + (legs.length - n) + " expected=" + (legs.length + 1));
  console.log("rev-dated " + (n + (PLANTS_OFF ? 0 : 1)) + "/" + (legs.length + 1) + (PLANTS_OFF ? ", 1 skipped" : ", plants " + PLANTS.length + "/" + PLANTS.length + " red"));
  process.exit(n === legs.length ? 0 : 1);
}

if (ONLY) {
  const fn = CHECKS[ONLY];
  if (!fn) { console.error("unknown " + ONLY); process.exit(2); }
  Promise.resolve().then(fn).catch((e) => { console.error(e && e.stack || e); return false; }).then((ok) => {
    console.log(ok ? "PLANT-GREEN" : "PLANT-RED");
    process.exit(ok ? 0 : 1);
  });
} else {
  main().catch((e) => {
    console.error(e && e.stack || e);
    try { dropScratch(SCRATCH, "rev-dated"); } catch { /* the verdict is the error above */ }
    process.exit(1);
  });
}
