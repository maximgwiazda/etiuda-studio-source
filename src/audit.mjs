/* THE AUDIT PACK: HOW EVERY CARD IN A PUBLISHED EDITION CAME TO BE THERE. Board 606 and 607.
 *
 *     import { auditFor, writePack, verifyPack } from "./src/audit.mjs";
 *     const pack = await auditFor(projectDir, "2026-09-19");   // the page reads this
 *     await writePack(projectDir, "2026-09-19", outFolder);    // the auditor gets this
 *     await verifyPack(outFolder);                             // and repeats this
 *
 * Maxim ruled on 2026-09-19 21:37: the pack is for an internal quality manager who has to show
 * that every card was approved before it was published; the person is the operating system's
 * account; and the pack says on its own face that the name is unverified. Claudia drew it on
 * 2026-09-20 as two artefacts rather than one - a page for the manager's daily use, and a folder
 * that leaves the building - because an auditor checks a signature with their own tools rather
 * than trusting a screenshot of ours.
 *
 * EVERYTHING HERE IS READ OUT OF THE ARCHIVE AND NOTHING OUT OF THE WORKING COPY. draft.json and
 * review-log.json both keep moving: the draft is whatever the owner has typed since, and the log
 * grows with every decision. An archived edition does not move - src/publish.mjs refuses to write
 * over one - so a pack assembled from the archive says the same thing today and in two years,
 * which is the only property that makes it evidence rather than a screenshot of a program.
 *
 * THE FOUR STATES A CARD CAN BE IN, and the third is the one that needs the walk.
 *   accepted      it changed in this edition and an acceptance in this edition's record stands
 *                 behind it, with the account that decided, when, and which proposal file.
 *   written here  it changed in this edition and no decision stands behind it: the owner typed
 *                 it, or an import landed it. This is not a fault and it is not an approval, and
 *                 a pack that quietly counted it as one would be the false evidence an audit
 *                 pack exists to prevent.
 *   unchanged     it did not change in this edition; it has stood since an earlier edition whose
 *                 own record accounts for it, and that edition is named.
 *   unaccounted   nothing in the archive says how it got there. An edition published before this
 *                 record existed has no acceptances.json at all, and an archive whose earlier
 *                 editions were pruned cannot tell a card written at its earliest surviving
 *                 edition from one carried into it. Both are this state, and the count of it is
 *                 the number a quality manager is actually after.
 *
 * THE CHANGE MAP IS RECOMPUTED FROM THE ARCHIVED CATALOGS, NOT READ OFF THE RECORDS. Every
 * acceptances.json carries a `changedCards`, and using it would be cheaper; but an edition
 * published before board 606 has no record at all, and its catalog is still there. The catalogs
 * are the bytes that shipped and they are what a stranger would compare, so they are what this
 * walks, with the same diffCatalogs and the same canonical form the release notes were written
 * from. Where a record does carry `changedCards` the two are compared and the agreement is
 * reported per edition, because a silent disagreement between an archived record and the bytes
 * beside it is exactly the thing an audit pack must not paper over.
 *
 * WHAT THIS MAY NOT CLAIM (board 607, in the manager's words on the page and in the README). A
 * signature proves the file came from a key and has not changed since. It does not say who holds
 * that key; there is no trusted time source here, so every time in the pack is the clock of the
 * computer that wrote it; and a key that leaked cannot be withdrawn from a pack already sent,
 * because the pack does not record whether that key is still in use. Every question that needs a
 * person or a date is answered from what the artefact records, never inferred from the signature.
 */
import fs from "node:fs";
import path from "node:path";
import * as Engine from "./engine.mjs";
import { diffCatalogs, diffLines, summary } from "./diff.mjs";
import { ARCHIVE, CATALOG_IN_ARCHIVE, REPORT_IN_ARCHIVE, ACCEPTANCES_IN_ARCHIVE,
         editionsIn, primaryOf, projectName } from "./publish.mjs";
import { ACCOUNT_STATEMENT } from "./review.mjs";
import { readKeyFile } from "./sign.mjs";
import { ringPath, readRingFile } from "./ring.mjs";
import { folderHere } from "./team-store.mjs";
import { readTeam } from "./team.mjs";
import { csvOf } from "./csv.mjs";
import { refuse } from "./refusal.mjs";
import { readJson } from "./plain-json.mjs";

const PACK_KIND = "etiuda-studio-audit-pack";
const README_IN_PACK = "README.txt";
const RECORD_CSV = "approval-record.csv";
const PUBLIC_KEY_IN_PACK = "public-key.txt";

/* THE THREE LIMITS OF BOARD 607, WRITTEN ONCE. The page paints them, the README prints them and
   the gate holds the pack to carrying all three; three copies of these sentences would be three
   things to keep in step, and the one that fell behind would be the one somebody read. */
const LIMITS = [
  "A signature proves that this catalog came from the key named in this pack and has not"
  + " changed since it was signed. It does not show who holds that key.",
  "There is no trusted time source. Every time in this pack is the reading of the clock on the"
  + " computer where the decision was taken or where the catalog was published.",
  "Nothing in this pack is confirmed by a server, so it shows that the key named here signed, but not whether that"
  + " key was later copied or replaced.",
];

const HOW = { accepted: "accepted", written: "written", unchanged: "unchanged",
              unaccounted: "unaccounted" };

function maybeJson(p) { try { return readJson(p); } catch { return null; } }

/** The card's own title in the catalog's reading language, which is what the manager scans the
 *  table by. A card with no title in that language shows its id and nothing invented. */
function titleOf(catalog, card) {
  const lang = primaryOf(catalog);
  const t = ((card || {}).title || {})[lang];
  return typeof t === "string" && t.trim() ? t.trim() : "";
}

/* ---- the walk -------------------------------------------------------------------------------- */

/* ONE PASS OVER THE ARCHIVE, OLDEST FIRST, and it is the whole engine of this file.
 *
 * For each archived edition up to and including the one asked for: the catalog it shipped, the
 * set of cards that changed in it against the edition before, and its acceptance record where it
 * has one. The card ids are then resolved against the LAST edition in which each changed, which
 * is the edition whose record can say anything about it.
 *
 * THE EARLIEST SURVIVING EDITION IS A SPECIAL CASE AND IT IS NOT A CORNER. Its diff is taken
 * against nothing, so every card in it reads as added - which is true when it really was the
 * first edition of the catalog and false when everything before it was pruned. The record itself
 * says which: `previous` is null in the first, and names an edition that is not in the archive in
 * the second. In the second case a card with no acceptance at that edition is unaccounted for
 * rather than written here, because the archive genuinely cannot tell the two apart.
 */
async function walkArchive(home, upTo) {
  const F = await Engine.format();
  const all = editionsIn(home);
  const want = all.indexOf(upTo);
  if (want < 0) throw refuse("the archive at {P} has no edition {E}; it has {LIST}",
    { P: path.join(home, ARCHIVE), E: upTo, LIST: all.join(", ") || "none" });

  const steps = [];
  let before = {};
  for (let i = 0; i <= want; i++) {
    const edition = all[i];
    const at = path.join(home, ARCHIVE, edition);
    const catalog = maybeJson(path.join(at, CATALOG_IN_ARCHIVE));
    const record = maybeJson(path.join(at, ACCEPTANCES_IN_ARCHIVE));
    const d = diffCatalogs(before, catalog || {}, F.canonical);
    const changed = new Set();
    ["added", "changed"].forEach(w =>
      (d.cards[w] || []).forEach(c => changed.add(String(c.id))));
    /* The record's own account of the same question, where it has one. `changedCards` includes
       removed cards and this set does not, so the comparison is over what is still in the
       catalog: a card that left cannot be a row of the table either way. */
    const said = record && Array.isArray(record.changedCards)
      ? new Set(record.changedCards.map(String)) : null;
    const agrees = said === null ? null
      : Array.from(changed).every(id => said.has(id));
    const accepted = new Map();
    if (record) (record.cards || []).forEach(c => accepted.set(String(c.id), c.accepted || []));
    /* An edition is the foot of the archive when it is the first one kept AND its own record
       does not say it was the first one published. */
    const pruned = i === 0 && (!record || record.previous != null);
    steps.push({ edition, at, catalog, record, changed, accepted, agrees, pruned,
                 reaches: !!record });
    before = catalog || {};
  }
  return { all, steps, F };
}

/** Which edition a card last changed in, and what that edition's record says about it. */
function originOf(steps, id) {
  for (let i = steps.length - 1; i >= 0; i--) {
    const s = steps[i];
    if (!s.changed.has(id)) continue;
    const rows = s.accepted.get(id) || [];
    if (rows.length) return { at: i, edition: s.edition, how: HOW.accepted, rows };
    if (!s.reaches || s.pruned) return { at: i, edition: s.edition, how: HOW.unaccounted, rows };
    return { at: i, edition: s.edition, how: HOW.written, rows };
  }
  return { at: -1, edition: null, how: HOW.unaccounted, rows: [] };
}

/* ---- the signature ---------------------------------------------------------------------------- */

/* THE RING'S SHAPE IS THE ENGINE'S, AND IT CHANGED UNDER US. Before engine 0f09226 v2SigState
 * took a flat {keyId:public}; after it, {catalogId:{keyId:public}}, an entry binding a key to ONE
 * catalog. Hand the old shape to the new engine and a perfectly signed catalog reads `unknown` -
 * not `invalid`, so nothing looks broken: the Audit screen's signature row and `tools/audit.mjs
 * --verify` would both have said "signed by a key this desk does not know" about a file this desk
 * had just signed itself. That is what the pin move to 32af894 turned red, and it was a live fault
 * in two places rather than a test's business. Every pin the drift gate admits binds.
 */
function ringFor(V, doc, keys) {
  const id = String((doc || {}).id || "");
  return id ? { [id]: keys } : {};
}

/* THE ENGINE'S OWN VERDICT, NEVER A SECOND ONE. `E.sigRules()` slices v2SignedBytes and
 * v2SigState out of the pinned engine's catalog-v2.js and runs them unchanged, so the four states
 * this pack prints are the four states a desk would print about the same file. With no key to
 * check against the engine's own answer is `unknown`, which is the honest word for "there is a
 * signature here and nothing to check it against" and is not the same as `none`.
 *
 * THE KEY IS THE ONE THE SIGNATURE NAMES, NEVER MERELY THE ONE AT HAND (sense pass item 12).
 * After a rotation this copy holds key B while edition one was signed with A, and a pack that put
 * B's public half under A's id made a stranger's verifyPack read an untouched catalog as invalid.
 * So the key file is used only when its id is the signature's; otherwise the id is looked up in
 * the ring beside the published catalog, which keeps every key that ever signed for it because a
 * ring is only ever appended to (src/ring.mjs); otherwise there is no key and the state is
 * `unknown`. The ring file is read in the work folder, then where the project last published,
 * then in the project folder, which is where a publish with no folder named puts it. Where that
 * file is absent, the same lookup reads the ring inside a team file the engine reads as valid,
 * which is where a relay team keeps it.
 */
function ringHit(keys, catalogId, keyId, file) {
  const hit = Array.isArray(keys) && keys.find(e => e && String(e.catalog) === String(catalogId)
    && String(e.keyId) === keyId && /^[0-9a-f]{64}$/.test(String(e.public || "")));
  return hit ? { file, keyId, public: String(hit.public), from: "ring" } : null;
}
async function keyFromRing(home, catalogId, keyId, opts) {
  if (!home) return null;
  const project = maybeJson(path.join(home, "project.json")) || {};
  const folders = [];
  for (const f of [folderHere(project, opts), home]) {
    if (!f) continue;
    const abs = path.resolve(home, String(f));
    if (!folders.includes(abs)) folders.push(abs);
  }
  for (const folder of folders) {
    let read = null;
    try { read = readRingFile(ringPath(folder)); } catch { read = null; }
    const hit = read && ringHit(read.doc.keys, catalogId, keyId, read.file);
    if (hit) return hit;
  }
  for (const folder of folders) {
    let read = null;
    try { read = await readTeam(folder); } catch { read = null; }
    if (!read || !read.valid || !read.team) continue;
    const hit = ringHit(read.team.ring && read.team.ring.keys, catalogId, keyId, read.at);
    if (hit) return hit;
  }
  return null;
}

async function signatureOf(catalog, keyFile, home, opts) {
  const sig = (catalog || {}).sig;
  const V = Engine.sigRules();
  const named = sig && sig.keyId ? String(sig.keyId) : null;
  let held = null, problem = null;
  if (keyFile) {
    try { held = readKeyFile(keyFile); }
    catch (e) { problem = e && e.message ? e.message : String(e); }
  }
  const key = !named ? null
    : held && held.keyId === named
      ? { file: held.file, keyId: held.keyId, public: held.public, from: "key" }
      : await keyFromRing(home, (catalog || {}).id, named, opts);
  const ring = ringFor(V, catalog, key ? { [key.keyId]: key.public } : {});
  const state = await V.v2SigState(catalog || {}, ring);
  return {
    present: !!(sig && sig.value),
    alg: sig ? (sig.alg || null) : null,
    keyId: sig ? (sig.keyId || null) : null,
    state,
    states: V.states,
    key,
    keyProblem: problem,
    rule: V.from,
  };
}

/* ---- the pack ---------------------------------------------------------------------------------- */

/* AN EDITION BY ITS REV FIRST AND ITS DATE AFTER (board 902): the rev a walked step's catalog carries, a catalog file's rev,
   and the two as a sentence says them. */
const revOf = (doc) => (doc && doc.rev != null && doc.rev !== "" && Number.isFinite(+doc.rev) ? +doc.rev : null);
function revAt(steps, edition) {
  const s = steps.find(x => x.edition === edition);
  return s ? revOf(s.catalog) : null;
}
function revIn(file) { return revOf(maybeJson(file)); }
const named = (rev, edition) => (rev == null ? "edition " + edition : "rev " + rev + " (" + edition + ")");

/**
 * Everything the page paints and everything the folder is written from, for one archived edition.
 * @param {string} dir      the project folder
 * @param {string} edition  an edition in its archive
 * @param {object} [o]      o.keyFile - the signing key file, for its public half alone
 */
async function auditFor(dir, edition, o) {
  const opts = o || {};
  const home = path.resolve(String(dir || ""));
  const { all, steps, F } = await walkArchive(home, String(edition || ""));
  const here = steps[steps.length - 1];
  if (!here.catalog) throw refuse("no archived catalog file at {P}",
    { P: path.join(here.at, CATALOG_IN_ARCHIVE) });
  const catalog = here.catalog;
  const file = path.join(here.at, CATALOG_IN_ARCHIVE);
  const report = maybeJson(path.join(here.at, REPORT_IN_ARCHIVE));
  const previous = steps.length > 1 ? steps[steps.length - 2].edition : null;

  const cards = (catalog.cards || []).map(c => {
    const id = String(c.id);
    const origin = originOf(steps, id);
    const row = origin.rows.length ? origin.rows[origin.rows.length - 1] : null;
    const how = origin.at === steps.length - 1 ? origin.how
      : origin.how === HOW.unaccounted ? HOW.unaccounted : HOW.unchanged;
    return {
      id, title: titleOf(catalog, c), how, origin: origin.how,
      since: how === HOW.unchanged ? origin.edition : null,
      sinceRev: how === HOW.unchanged ? revAt(steps, origin.edition) : null, /* plant:txrd-rd7-2 */
      by: row ? row.by : null,
      at: row ? row.at : null,
      from: row ? (row.from || null) : null,
      source: row ? (row.source || null) : null,
      keys: origin.rows.map(r => r.key),
    };
  });

  const n = w => cards.filter(c => c.how === w).length;
  /* UNCHANGED IS NOT A SYNONYM FOR APPROVED, and the count says so rather than leaving a reader
     to assume the kinder reading. A card that has stood since an earlier edition got into that
     edition one of the two ways any card does, and "0 unaccounted for" beside a column of
     unchanged rows would otherwise read as "everything was approved". The row itself already
     shows it - an unchanged card whose origin was an acceptance carries that account and its
     time - and these two numbers are the same fact said where the totals are. */
  const unchangedBy = w => cards.filter(c => c.how === HOW.unchanged && c.origin === w).length;
  /* THE HASH RECOMPUTED HERE AND NOW, over the document as it sits in the archive. The engine's
     own contentHash leaves `hash` and `sig` out of what it covers, so this is the same question a
     desk asks when it loads the file, asked of the bytes the archive kept. */
  const recomputed = F.contentHash(catalog);
  const diffPrev = previous
    ? diffCatalogs(steps[steps.length - 2].catalog || {}, catalog, F.canonical, { values: true })
    : null;

  return {
    kind: PACK_KIND, schema: 1,
    dir: home, archive: path.join(home, ARCHIVE), at: here.at,
    edition: here.edition, previous,
    /* EVERY EDITION IN THE ARCHIVE, not only the ones this walk reached: the screen's chooser is
       built from this, and a chooser built from what the page remembered of the project would
       lose an edition published while it was open. */
    all: all.slice(),
    /* Each edition's rev, for the chooser's label (board 902); an edition whose catalog will not read has none. */
    revs: Object.fromEntries(all.map(e => [e, revIn(path.join(home, ARCHIVE, e, CATALOG_IN_ARCHIVE))])),
    previousRev: previous ? revAt(steps, previous) : null,
    id: catalog.id || null, name: projectName(home, maybeJson(path.join(home, "project.json"))),
    rev: Number.isFinite(+catalog.rev) ? +catalog.rev : null,
    lang: primaryOf(catalog),
    catalog: { file, bytes: fs.statSync(file).size,
               hash: catalog.hash || null, recomputed, ok: catalog.hash === recomputed },
    signature: await signatureOf(catalog, opts.keyFile || null, home, opts),
    person: { source: "operating system account", verified: false,
              statement: ACCOUNT_STATEMENT },
    limits: LIMITS.slice(),
    record: here.record,
    counts: {
      cards: cards.length,
      accepted: n(HOW.accepted), written: n(HOW.written),
      unchanged: n(HOW.unchanged), unaccounted: n(HOW.unaccounted),
      unchangedAccepted: unchangedBy(HOW.accepted), unchangedWritten: unchangedBy(HOW.written),
      decisions: cards.reduce((a, c) => a + c.keys.length, 0),
    },
    cards,
    editions: steps.map(s => ({ edition: s.edition, record: s.reaches, pruned: s.pruned,
                                changed: s.changed.size, agrees: s.agrees })),
    diff: diffPrev
      ? { previous, same: diffPrev.same, summary: summary(diffPrev),
          lines: diffLines(diffPrev, { values: true, width: 70 }) }
      : { previous: null, same: false, summary: null, lines: [] },
    report: report ? { rev: report.rev, hash: report.hash, counts: report.counts,
                       override: report.override || null } : null,
  };
}

/* ---- the folder that leaves the building --------------------------------------------------------
 *
 * WRITTEN ON ONE ACT, AND EVERY BYTE OF THE EVIDENCE IS A COPY RATHER THAN A RE-SERIALISATION.
 * The catalog and the acceptance record are copied out of the archive with fs.copyFileSync: a
 * document rebuilt from its own parse would carry this program's idea of the formatting, and the
 * hash and the signature are over the canonical form rather than over the file, so a re-written
 * file would still verify and would still not be the file that shipped. An auditor comparing the
 * folder with the archive byte for byte is a thing that has to be able to succeed.
 *
 * THE NAMES ARE THE ONES CLAUDIA DREW (etiuda-shots/606/pack-p3-folder-light.png), and the README
 * is her index: one row per file saying what it is, what it opens in, what it proves and what it
 * does not. `verifyPack` below finds the catalog by that naming rule and by nothing else, so the
 * rule is documented in the README rather than being a secret between two functions here.
 */
function packNames(pack) {
  const ec = "catalog-" + pack.edition + ".json";
  return { ec, sig: ec + ".sig", key: PUBLIC_KEY_IN_PACK,
           diff: pack.previous ? "changed-since-" + pack.previous + ".txt" : "first-edition.txt",
           record: ACCEPTANCES_IN_ARCHIVE, csv: RECORD_CSV, readme: README_IN_PACK };
}

/* THE PACK GETS A FOLDER OF ITS OWN INSIDE THE ONE THE PERSON CHOSE, and the name says what it
   is and which edition it is of, as Claudia drew it. The person picks a place to put a pack, not
   a folder to become one: writing seven files straight into whatever was picked would scatter
   them through somebody's Documents, and a second pack written beside the first would then
   overwrite a README describing a different edition while leaving that edition's catalog behind
   it. The id and the edition are both already the format's own id shape, so nothing here has to
   be made safe for a file name. */
function packFolder(pack) {
  return "audit-" + String(pack.id || "catalog") + "-" + String(pack.edition);
}

/* THE FOUR STATES IN THE WORDS THE README, THE CSV AND THE COMMAND LINE ALL USE. An unchanged
   card says which of the two ways it got into the edition it has stood since, because the reader
   of a spreadsheet cannot see the account column and the row at once the way the screen shows
   them, and "unchanged" alone would let a column of them read as approved. */
function howWord(c) {
  return c.how === HOW.accepted ? "accepted"
       : c.how === HOW.written ? "written here"
       : c.how === HOW.unchanged
         ? "unchanged since " + (c.sinceRev == null ? c.since : "rev " + c.sinceRev + " (" + c.since + ")")
           + (c.origin === HOW.accepted ? ", accepted there" : ", written there")
       : "unaccounted for";
}

function recordCsv(pack) {
  const rows = [["card", "title", "how it got here", "who decided", "when", "from", "key"]];
  pack.cards.forEach(c => rows.push([c.id, c.title, howWord(c), c.by == null ? "" : c.by,
    c.at || "", c.from || c.source || "", c.keys.join(" ")]));
  return csvOf(rows);
}

/* A PLAIN TEXT FILE IS A LAYOUT AND NOT A STRING. `lead` is what the first line begins with and
   `hang` what every line after it begins with, because a bullet whose second line starts in
   column one reads as a second bullet and an indented description whose second line does not
   stay indented reads as the next file's name. */
function wrap(text, width, lead, hang) {
  const head = lead || "", tail = hang == null ? head.replace(/[^\s]/g, " ") : hang;
  const out = [];
  String(text).split("\n").forEach(para => {
    let line = head;
    let started = false;
    para.split(/\s+/).filter(Boolean).forEach(word => {
      const at = started ? line + " " + word : line + word;
      if (started && at.length > width) { out.push(line); line = tail + word; }
      else line = at;
      started = true;
    });
    out.push(line);
  });
  return out.join("\n");
}

function readme(pack, names, files) {
  const L = [];
  const rule = s => L.push(s);
  rule("AUDIT PACK");
  rule("");
  rule(pack.name + ", " + named(pack.rev, pack.edition)); /* plant:txrd-rd7-3 */
  rule("Catalog id " + pack.id);
  rule("");
  rule("READ THIS FIRST");
  rule(wrap(pack.person.statement, 92));
  rule("");
  rule("WHAT THIS PACK SHOWS");
  rule(wrap("Every card in this edition of the catalog, and how it came to be there: accepted"
    + " from a proposal that somebody reviewed, written in the authoring program with no"
    + " proposal behind it, unchanged since an earlier edition, or unaccounted for, which means"
    + " this archive does not say.", 92));
  rule("");
  rule("  " + pack.counts.cards + " cards in this edition");
  rule("  " + pack.counts.accepted + " accepted from a proposal");
  rule("  " + pack.counts.written + " written here by the owner");
  rule("  " + pack.counts.unchanged + " unchanged since an earlier edition");
  rule("      of those, " + pack.counts.unchangedAccepted + " accepted in the edition they"
    + " arrived in and " + pack.counts.unchangedWritten + " written there");
  rule("  " + pack.counts.unaccounted + " unaccounted for");
  rule("");
  rule("WHAT THIS PACK DOES NOT SHOW");
  LIMITS.forEach(l => { rule(wrap(l, 92, "  - ", "    ")); });
  rule("");
  rule("THE CATALOG'S OWN CHECKS");
  rule("  content hash    " + (pack.catalog.hash || "none"));
  rule("  recomputed      " + pack.catalog.recomputed
    + (pack.catalog.ok ? "  (the same)" : "  (DIFFERENT)"));
  rule("  signature       " + (pack.signature.present
    ? pack.signature.alg + ", key " + pack.signature.keyId + ", " + pack.signature.state
    : "none: this catalog was published unsigned"));
  rule("");
  rule(wrap("The content hash is the Etiuda reader's own hash over the catalog's canonical form,"
    + " which is what a desk recomputes when it loads the file. The signature is over the same"
    + " canonical form with the hash left out and the signature's own value absent. Etiuda"
    + " Studio repeats both checks over this folder alone with:", 92));
  rule("");
  rule("  node tools/audit.mjs --verify <this folder>");
  rule("");
  rule("WHAT EACH FILE IS");
  rule("");
  files.forEach(f => {
    rule("  " + f.name);
    rule(wrap(f.what, 92, "      ", "      "));
  });
  rule("");
  rule(wrap("The catalog in this folder is named catalog-<edition>.json and its signature is"
    + " that name with .sig after it. Nothing here is a program: every file opens in something"
    + " you already have, and the folder copies, posts and prints whole.", 92));
  rule("");
  return L.join("\n") + "\n";
}

/**
 * The folder, written on one act.
 * @param {string} dir      the project folder
 * @param {string} edition  an edition in its archive
 * @param {string} to       where to put the pack; it gets a folder of its own inside this one
 * @param {object} [o]      o.keyFile, o.pack (an auditFor answer already in hand)
 */
async function writePack(dir, edition, to, o) {
  const opts = o || {};
  const pack = opts.pack || await auditFor(dir, edition, opts);
  const into = path.resolve(String(to || ""));
  if (!into) throw refuse("an audit pack needs a folder to write");
  const at = path.join(into, packFolder(pack));
  const names = packNames(pack);
  /* NOTHING IS EVER WRITTEN OVER. An archived edition is immutable, so a second pack of the same
     one would hold the same bytes; but a folder of that name that somebody has since put
     something else into is not this program's to empty, and the refusal names the path rather
     than asking the person to guess which of their folders it meant. */
  if (fs.existsSync(at))
    throw refuse("{P} already holds an audit pack; a pack is written into a folder of its own",
      { P: at });
  fs.mkdirSync(at, { recursive: true });

  const files = [];
  const put = (name, what, write) => { write(path.join(at, name)); files.push({ name, what }); };

  put(names.ec, "The published catalog itself, byte for byte as the desks read it. Everything"
    + " else in this folder is about this file.",
    p => fs.copyFileSync(pack.catalog.file, p));

  if (pack.signature.present)
    put(names.sig, "The detached " + pack.signature.alg + " signature of that catalog, as"
      + " hexadecimal on one line. Checked against the public key below.",
      p => fs.writeFileSync(p, sigValueOf(pack) + "\n", "utf8"));

  if (pack.signature.present && pack.signature.key)
    put(names.key, "The public half of key " + pack.signature.keyId + ", as hexadecimal on one"
      + " line. " + (pack.signature.key.from === "ring"
        ? "It was taken from the ring beside the published catalog, since this copy of Etiuda"
          + " Studio now signs with another key"
        : "It is the key this copy of Etiuda Studio signs with") + "; it does not show who holds"
      + " it.",
      p => fs.writeFileSync(p, pack.signature.key.public + "\n", "utf8"));

  put(names.csv, "One row per card in this edition: how it got here, who decided it, when, and"
    + " which proposal it came from. Opens in a spreadsheet.",
    p => fs.writeFileSync(p, recordCsv(pack), "utf8"));

  if (fs.existsSync(path.join(pack.at, ACCEPTANCES_IN_ARCHIVE)))
    put(names.record, "The acceptance record the archive kept for this edition, byte for byte:"
      + " every decision that landed since the edition before, with the account that took it.",
      p => fs.copyFileSync(path.join(pack.at, ACCEPTANCES_IN_ARCHIVE), p));

  put(names.diff, pack.previous
    ? "What this edition changed against " + named(pack.previousRev, pack.previous) + ", field by field."
    : "A note that this is the first published edition of this catalog, so there is nothing to"
      + " compare it with.",
    p => fs.writeFileSync(p, diffText(pack), "utf8"));

  /* THE README IS WRITTEN LAST AND NAMES ITSELF FIRST. It is the index of the folder, so a
     reader holding it must be able to account for every file they can see - including the one
     they are reading, which was missing from the list until tests/audit.mjs 3d asked for it.
     It is also the file `verifyPack` looks for to decide that a folder is a pack at all. */
  files.unshift({ name: README_IN_PACK, what: "This page: what the pack shows, what it does not"
    + " show, and what each of the other files is." });
  fs.writeFileSync(path.join(at, README_IN_PACK), readme(pack, names, files), "utf8");

  return { folder: at, into, edition: pack.edition, files: files.map(f => ({
    name: f.name, what: f.what, bytes: fs.statSync(path.join(at, f.name)).size })) };
}

function sigValueOf(pack) {
  const at = path.join(pack.at, CATALOG_IN_ARCHIVE);
  const doc = readJson(at);
  return String((doc.sig || {}).value || "");
}

function diffText(pack) {
  if (!pack.previous)
    return "This is the first published edition of this catalog, so there is nothing to"
      + " compare it with.\n";
  const L = ["What " + named(pack.rev, pack.edition) + " changed against " + named(pack.previousRev, pack.previous), ""];
  L.push(pack.diff.summary);
  L.push("");
  if (pack.diff.same) L.push("No structural change: the content is identical.");
  else pack.diff.lines.forEach(l => L.push(l));
  L.push("");
  return L.join("\n");
}

/* ---- the stranger's repetition ------------------------------------------------------------------
 *
 * READS THE FOLDER AND NOTHING ELSE. Not the project, not the archive, not the key file that
 * wrote it: whatever this answers, an auditor holding a copy of the folder on their own disk
 * would get the same answer, which is the only sense in which a pack "verifies in a stranger's
 * hands". The one thing it borrows is the pinned engine's own rules for the canonical form and
 * the signature, because those are the format rather than this folder.
 *
 * A BYTE CHANGED IN THE CATALOG FAILS THE HASH, and that is the leg with teeth: the hash covers
 * the canonical form of everything but itself and the signature, so an edited card body, a moved
 * field or a card removed all move it. tests/audit.mjs builds that failing case first.
 */
async function verifyPack(folder) {
  const at = path.resolve(String(folder || ""));
  if (!fs.existsSync(path.join(at, README_IN_PACK)))
    throw refuse("there is no audit pack at {P}: a pack carries a {F}", { P: at,
      F: README_IN_PACK });
  const found = fs.readdirSync(at)
    .filter(n => /^catalog-.+\.json$/.test(n)).sort();
  if (found.length !== 1)
    throw refuse("an audit pack holds one catalog-<edition>.json and {P} holds {N}",
      { P: at, N: String(found.length) });
  const ecAt = path.join(at, found[0]);
  const doc = readJson(ecAt);
  const F = await Engine.format();
  const recomputed = F.contentHash(doc);

  const keyAt = path.join(at, PUBLIC_KEY_IN_PACK);
  const pub = fs.existsSync(keyAt)
    ? String(fs.readFileSync(keyAt, "utf8")).trim() : "";
  const V = Engine.sigRules();
  const keyId = String(((doc.sig || {}).keyId) || "");
  const ring = ringFor(V, doc, pub && keyId ? { [keyId]: pub } : {});
  const state = await V.v2SigState(doc, ring);

  /* The detached copy beside the catalog is checked against the one inside it, because a pack
     whose two copies of the signature disagreed would verify on one and not on the other and
     nothing would say which a reader had used. */
  const sigAt = path.join(at, found[0] + ".sig");
  const detached = fs.existsSync(sigAt) ? String(fs.readFileSync(sigAt, "utf8")).trim() : null;
  const inside = String(((doc.sig || {}).value) || "") || null;

  const signature = {
    present: !!inside, keyId: keyId || null, alg: (doc.sig || {}).alg || null,
    publicKey: pub || null, state, states: V.states,
    detached, detachedAgrees: detached == null ? null : detached === inside,
    rule: V.from,
  };
  const hash = { stored: doc.hash || null, recomputed, ok: doc.hash === recomputed };
  return {
    folder: at, catalog: { file: ecAt, name: found[0], bytes: fs.statSync(ecAt).size },
    edition: doc.date || null, rev: Number.isFinite(+doc.rev) ? +doc.rev : null,
    hash, signature,
    ok: hash.ok
      && (!signature.present || (state === V.states.valid && signature.detachedAgrees !== false)),
  };
}

export { auditFor, writePack, verifyPack, packNames, packFolder, recordCsv,
         howWord, diffText,
         LIMITS, HOW, PACK_KIND, README_IN_PACK, RECORD_CSV, PUBLIC_KEY_IN_PACK };
