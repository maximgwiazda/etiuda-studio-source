/* DATE MODIFIED, STUDIO'S HALF (board 982, S1): THE DATE A DESK SHOWS, WRITTEN AT PUBLISH FROM RECORDED FACTS.
 *
 *     node tests/date-modified.mjs [--keep]
 *
 * Maxim, 2026-11-11 00:53: "How about if we filled the space by adding more columns there? For example, "Date modified"
 * column, saying when said category or card was last modified." The desk reads `changedAt` on a card and on a shelf or
 * request tag (engine 6ee2ecd6, catalog-v2.js v2ChangedAt); Studio writes it on what it publishes as changed
 * (src/dated.mjs says from what).
 *
 *   dm1  a first edition dates every card and both tags by the journal entry that made each, in the reader's shape
 *   dm2  after a publish the draft carries the edition's dates, and the changes list is empty
 *   dm3  a draft that differs from its edition only by dates is no change: the changes list, the rail's count, the
 *        press strip and the release notes' diff all say so
 *   dm4  a desk's proposal whose only difference is a date offers no row in review
 *   dm5  an edited card, a renamed category, a reworded intent and a new card are dated by their journal entries, and
 *        an untouched card keeps its old date
 *   dm6  a desk's change accepted in review is dated by the acceptance, never by the desk's own date
 *   dm7  a card changed by hand in the draft, with no journal entry, is dated by the project's `edited`
 *   dm8  an object undated in the edition before, and untouched, stays undated, while a touched one is dated
 *   dm9  two publishes of one project give the same bytes, dates included
 *   dm10 the published file passes the pinned engine's lint and hash, and its reader keeps every date
 *   dm11 CONTROL, holds before the change: an Undo of a delete still works across a publish that wrote dates into
 *        the draft
 *
 * Every word in the fixtures is invented. Node only, no window, no network. Exit 0 when every check holds, 1 when any
 * fails.
 */
import "./licensed-env.mjs";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as Engine from "../src/engine.mjs";
import { publishFull, DRAFT_FILE, PROJECT_FILE } from "../src/publish.mjs";
import { diffCatalogs } from "../src/diff.mjs";
import { clearScratch, dropScratch } from "./scratch.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const SCRATCH = path.join(ROOT, "scratch", "date-modified");
const EXPECTED = 12;

let asserted = 0, failed = 0;
function check(cond, line) {
  asserted++;
  if (cond) process.stdout.write("  ok   " + line + "\n");
  else { failed++; process.stderr.write("  FAIL " + line + "\n"); }
}

const readJson = (at) => JSON.parse(fs.readFileSync(at, "utf8").replace(/^\uFEFF/, ""));
const writeJson = (at, v) => fs.writeFileSync(at, JSON.stringify(v, null, 1) + "\n", "utf8");
const byId = (list) => new Map((list || []).map(x => [String(x.id), x]));

/* THE PINNED READER, imported whole as a data: URL as tests/format-pass.mjs does: its v2ChangedAt is the shape test,
   and catalogFromV2 is what a desk does with the file. */
async function reader() {
  const src = fs.readFileSync(path.join(ROOT, "engine", "pinned", "src", "modules", "catalog-v2.js"), "utf8");
  return import("data:text/javascript;base64," + Buffer.from(src).toString("base64"));
}

async function main(argv) {
  clearScratch(SCRATCH);
  const S = await import("../src/studio.mjs");
  const F = await Engine.format();
  const V2 = await reader();
  const shape = (v) => typeof V2.v2ChangedAt === "function" && V2.v2ChangedAt(v) === v && v !== "";
  const root = path.join(SCRATCH, "projects"), share = path.join(SCRATCH, "share");
  fs.mkdirSync(root, { recursive: true }); fs.mkdirSync(share, { recursive: true });

  const made = await S.newProject(root, "Harbour desk", [{ code: "en", name: "English" }]);
  const dir = made.dir;
  const journal = () => { try { return readJson(path.join(dir, "changes.json")).list || []; } catch { return []; } };
  /* The `at` of the newest journal entry that touched a card, or the tags, as the leg reads it from the file. */
  const cardAt = (id) => journal().filter(e => (e.cards || []).some(c => c.id === id)).map(e => e.at).sort().pop() || "";
  const lastAt = () => (journal().slice(-1)[0] || {}).at || "";
  const draft = () => readJson(path.join(dir, DRAFT_FILE));
  const project = () => readJson(path.join(dir, PROJECT_FILE));
  let clock = 0;
  const publish = async (notes) => {
    clock++;
    const r = await S.publishProject(dir, { folder: share, notes, now: "2026-11-0" + clock + "T09:00:00.000Z" });
    return readJson(r.ec);
  };

  const shelfId = (await S.addTag(dir, "shelf", { en: "Harbour fees" })).tag.id;
  const shelfAt = lastAt();
  const intentId = (await S.addTag(dir, "request", { en: "Asks about a mooring" })).tag.id;
  const intentAt = lastAt();
  const id = {};
  for (const w of ["Anchor", "Buoy", "Cleat"])
    id[w] = (await S.addCard(dir, shelfId, w, "The " + w.toLowerCase() + " answer, in full.")).card.id;
  const madeAt = { Anchor: cardAt(id.Anchor), Buoy: cardAt(id.Buoy), Cleat: cardAt(id.Cleat) };

  /* ---- dm1 ---- */
  const ed1 = await publish("one");
  const c1 = byId(ed1.cards), t1 = byId(ed1.tags);
  check(["Anchor", "Buoy", "Cleat"].every(w => shape((c1.get(id[w]) || {}).changedAt) && c1.get(id[w]).changedAt === madeAt[w])
    && shape((t1.get(shelfId) || {}).changedAt) && (t1.get(shelfId) || {}).changedAt === shelfAt
    && (t1.get(intentId) || {}).changedAt === intentAt && intentAt !== "",
    "dm1 a first edition dates every card and both tags by the entry that made each: "
    + JSON.stringify(Array.from(c1.values()).map(c => c.changedAt).concat(Array.from(t1.values()).map(t => t.changedAt))));

  /* ---- dm2 ---- */
  const d2 = draft(), dc2 = byId(d2.cards), dt2 = byId(d2.tags);
  const listed2 = await S.changesSince(dir);
  check(Array.from(c1.values()).every(c => (dc2.get(c.id) || {}).changedAt === c.changedAt && !!c.changedAt)
    && Array.from(t1.values()).every(t => (dt2.get(t.id) || {}).changedAt === t.changedAt && !!t.changedAt)
    && listed2.list.length === 0,
    "dm2 after a publish the draft carries the edition's dates and the changes list is empty: "
    + JSON.stringify({ draft: Array.from(dc2.values()).map(c => c.changedAt || null), listed: listed2.list.length }));

  /* ---- dm3: a date-only difference, planted by hand in the draft, is no change ---- */
  const plantedDraft = draft();
  const shifted = (v) => "2026-0" + (v ? "2" : "3") + "-04T05:06:07.000Z";
  plantedDraft.cards.forEach(c => { c.changedAt = shifted(c.changedAt); });
  plantedDraft.tags.forEach(t => { t.changedAt = shifted(t.changedAt); });
  delete plantedDraft.hash; plantedDraft.hash = F.contentHash(plantedDraft);
  const keptDraft = fs.readFileSync(path.join(dir, DRAFT_FILE));
  writeJson(path.join(dir, DRAFT_FILE), plantedDraft);
  const listed3 = await S.changesSince(dir);
  const count3 = await S.changesCount(dir);
  const plan3 = await S.publishPlan(dir, { folder: share });
  const strip3 = ((plan3 && plan3.strip && plan3.strip.groups) || []).flatMap(g => g.cards);
  const diff3 = diffCatalogs(ed1, plantedDraft, F.canonical);
  const moved3 = diff3.cards.changed.length + diff3.tags.changed.length;
  check(listed3.list.length === 0 && count3 === 0 && strip3.length > 0 && strip3.every(k => k === "u") && moved3 === 0,
    "dm3 a draft differing from its edition only by dates is no change: "
    + JSON.stringify({ listed: listed3.list.map(e => (e.cards || []).map(c => c.id).concat((e.other || {}).keys || [])),
      count: count3, strip: strip3, diffMoved: moved3 }));
  fs.writeFileSync(path.join(dir, DRAFT_FILE), keptDraft);

  /* ---- dm4: a desk's proposal whose only difference is a date ---- */
  const inbox = path.join(dir, "inbox");
  fs.mkdirSync(inbox, { recursive: true });
  const exportOf = (from, edit) => {
    const x = JSON.parse(JSON.stringify(from));
    edit(x);
    x.modified = true;
    delete x.hash; delete x.sig; x.hash = F.contentHash(x);
    return x;
  };
  const dateOnly = exportOf(ed1, x => { x.cards.find(c => c.id === id.Anchor).changedAt = "2026-05-06T07:08:09.000Z"; });
  const dateAt = path.join(inbox, "desk-date-only.ec");
  writeJson(dateAt, dateOnly);
  const o4 = await S.openProposal(dir, dateAt, {});
  check(o4 && Array.isArray(o4.changes) && o4.changes.length === 0,
    "dm4 a desk's proposal whose only difference is a date offers no row: "
    + JSON.stringify(((o4 && o4.changes) || []).map(c => c.key)));
  fs.renameSync(dateAt, path.join(SCRATCH, "desk-date-only.ec"));

  /* ---- dm5 ---- */
  await S.saveCard(dir, id.Buoy, { body: { en: "The buoy answer, reworded by the author." } });
  const buoyAt = cardAt(id.Buoy);
  await S.renameTag(dir, shelfId, { en: "Harbour dues" });
  const shelf2At = lastAt();
  await S.renameTag(dir, intentId, { en: "Asks where to moor" });
  const intent2At = lastAt();
  id.Dock = (await S.addCard(dir, shelfId, "Dock", "The dock answer, in full.")).card.id;
  const dockAt = cardAt(id.Dock);
  const ed2 = await publish("two");
  const c2 = byId(ed2.cards), t2 = byId(ed2.tags);
  check(c2.get(id.Buoy).changedAt === buoyAt && buoyAt > c1.get(id.Buoy).changedAt
    && t2.get(shelfId).changedAt === shelf2At && t2.get(intentId).changedAt === intent2At && intent2At > shelf2At
    && c2.get(id.Dock).changedAt === dockAt && dockAt !== ""
    && c2.get(id.Anchor).changedAt === c1.get(id.Anchor).changedAt && c2.get(id.Cleat).changedAt === c1.get(id.Cleat).changedAt,
    "dm5 the edited card, renamed category, reworded intent and new card are dated by their entries, the untouched keep"
    + " theirs: " + JSON.stringify({ buoy: [c2.get(id.Buoy).changedAt, buoyAt], shelf: [t2.get(shelfId).changedAt, shelf2At],
      intent: [t2.get(intentId).changedAt, intent2At], dock: [c2.get(id.Dock).changedAt, dockAt],
      anchor: [c2.get(id.Anchor).changedAt, c1.get(id.Anchor).changedAt] }));

  /* ---- dm6: a desk's change accepted in review ---- */
  const DESK_DATE = "2026-01-02T03:04:05.000Z";
  const deskFile = exportOf(ed2, x => {
    const c = x.cards.find(k => k.id === id.Cleat);
    c.body.en = "The cleat answer, as a desk put it."; c.changedAt = DESK_DATE;
  });
  const deskAt = path.join(inbox, "desk-cleat.ec");
  writeJson(deskAt, deskFile);
  const o6 = await S.openProposal(dir, deskAt, {});
  const ticks = {};
  (o6.changes || []).forEach(c => { ticks[c.key] = "accept"; });
  const done6 = await S.decideProposal(dir, deskAt, ticks, "Desk by the quay", "");
  const log = readJson(path.join(dir, "review-log.json"));
  const acceptedAt = ((log.reviews || []).slice(-1)[0] || {}).at || "";
  const ed3 = await publish("three");
  const c3 = byId(ed3.cards);
  check(done6.ok && Object.keys(ticks).join() === "card:" + id.Cleat + ":body.en"
    && c3.get(id.Cleat).changedAt === acceptedAt && acceptedAt !== "" && c3.get(id.Cleat).changedAt !== DESK_DATE,
    "dm6 a desk's change accepted in review is dated by the acceptance: "
    + JSON.stringify({ rows: Object.keys(ticks), cleat: c3.get(id.Cleat).changedAt, accepted: acceptedAt }));

  /* ---- dm7: a card changed by hand in the draft ---- */
  const hand = draft();
  hand.cards.find(c => c.id === id.Anchor).body.en = "The anchor answer, changed in the file by hand.";
  writeJson(path.join(dir, DRAFT_FILE), hand);
  const edited = project().edited;
  const ed4 = await publish("four");
  const c4 = byId(ed4.cards);
  check(c4.get(id.Anchor).changedAt === edited && shape(edited) && c4.get(id.Dock).changedAt === c2.get(id.Dock).changedAt,
    "dm7 a card changed by hand is dated by the project's edited: "
    + JSON.stringify({ anchor: c4.get(id.Anchor).changedAt, edited }));

  /* ---- dm8: an edition published before the field, its dates taken off in the archive ---- */
  const arch = path.join(dir, "archive");
  const last = fs.readdirSync(arch).filter(n => !n.endsWith(".tmp")).sort().pop();
  const archAt = path.join(arch, last, "catalog.ec");
  const old = readJson(archAt);
  old.cards.forEach(c => { delete c.changedAt; });
  old.tags.forEach(t => { delete t.changedAt; });
  writeJson(archAt, old);
  const und = draft();
  und.cards.forEach(c => { delete c.changedAt; });
  und.tags.forEach(t => { delete t.changedAt; });
  writeJson(path.join(dir, DRAFT_FILE), und);
  await S.saveCard(dir, id.Dock, { body: { en: "The dock answer, reworded once more." } });
  const dock2At = cardAt(id.Dock);
  const ed5 = await publish("five");
  const c5 = byId(ed5.cards), t5 = byId(ed5.tags);
  check(!("changedAt" in c5.get(id.Anchor)) && !("changedAt" in c5.get(id.Buoy)) && !("changedAt" in t5.get(shelfId))
    && c5.get(id.Dock).changedAt === dock2At && dock2At !== "",
    "dm8 untouched objects undated in the edition before stay undated, the touched card is dated: "
    + JSON.stringify({ anchor: c5.get(id.Anchor).changedAt || null, shelf: t5.get(shelfId).changedAt || null,
      dock: c5.get(id.Dock).changedAt || null }));

  /* ---- dm9: two publishes of one project ---- */
  await S.saveCard(dir, id.Anchor, { body: { en: "The anchor answer, settled at last." } });
  const twin = (n) => {
    const at = path.join(SCRATCH, "twin-" + n);
    fs.cpSync(dir, path.join(at, "project"), { recursive: true });
    fs.mkdirSync(path.join(at, "share"), { recursive: true });
    return at;
  };
  const a = twin("a"), b = twin("b");
  const pa = await publishFull({ project: path.join(a, "project"), folder: path.join(a, "share"), notes: "six", now: "2026-11-09T09:00:00.000Z" });
  const pb = await publishFull({ project: path.join(b, "project"), folder: path.join(b, "share"), notes: "six", now: "2026-11-09T09:00:00.000Z" });
  const ba = fs.readFileSync(pa.ec), bb = fs.readFileSync(pb.ec);
  const ed6 = JSON.parse(ba.toString("utf8"));
  check(ba.equals(bb) && byId(ed6.cards).get(id.Anchor).changedAt === cardAt(id.Anchor) && cardAt(id.Anchor) !== "",
    "dm9 two publishes of one project give the same bytes, the edited card dated: "
    + JSON.stringify({ same: ba.equals(bb), anchor: byId(ed6.cards).get(id.Anchor).changedAt || null }));

  /* ---- dm10: the second edition, where every card and both tags carry a date ---- */
  const lint = Engine.lint().lintCatalog(ed2);
  const bare = Object.assign({}, ed2); delete bare.hash; delete bare.sig;
  const runtime = V2.catalogFromV2(JSON.parse(JSON.stringify(ed2)));
  const rc = new Map((runtime.cards || []).map(c => [c.id, c]));
  const kept = ed2.cards.every(c => !c.changedAt || (rc.get(c.id) || {}).changedAt === c.changedAt)
    && ed2.tags.every(t => !t.changedAt || ((runtime.tagsChangedAt || {})[t.id]) === t.changedAt);
  const dated = ed2.cards.filter(c => shape(c.changedAt)).length + ed2.tags.filter(t => shape(t.changedAt)).length;
  check(lint.errors.length === 0 && F.contentHash(bare) === ed2.hash && kept && dated === ed2.cards.length + ed2.tags.length,
    "dm10 the published file passes the pinned lint and hash, and the reader keeps all " + dated + " of "
    + (ed2.cards.length + ed2.tags.length) + " dates: "
    + JSON.stringify({ errors: lint.errors.length, hash: F.contentHash(bare) === ed2.hash, kept }));

  /* ---- dm11 CONTROL: Undo of a delete across a publish ---- */
  await S.saveCard(dir, id.Cleat, { body: { en: "The cleat answer, once more." } });
  await S.deleteCard(dir, id.Dock);
  await publish("seven");
  let undo = null, why = "";
  try { undo = await S.undoDelete(dir); } catch (e) { why = String(e && e.message || e); }
  check(!!undo && undo.undone === true && draft().cards.some(c => c.id === id.Dock),
    "dm11 CONTROL an Undo of a delete still works across a publish: " + (why || "undone"));

  check(asserted === EXPECTED - 1, "dm every check ran: " + (asserted + 1) + " of " + EXPECTED);
  process.stdout.write("\ndate-modified  " + asserted + " assertion(s), " + failed + " failure(s)\n");
  if (!argv.includes("--keep")) dropScratch(SCRATCH, "date-modified");
  else process.stdout.write("date-modified  kept " + SCRATCH + "\n");
  process.exit(failed ? 1 : 0);
}

main(process.argv.slice(2)).catch((e) => {
  process.stderr.write("date-modified  harness: " + (e && e.stack || e) + "\n");
  process.exit(2);
});
