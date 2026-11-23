/* THE REVIEW QUEUE: AN AGENT'S EXPORT READ AS A PROPOSAL. Course node 9, spec 3.3.
 *
 *     import { reviewProposal, parseDecisions } from "./src/review.mjs";
 *     await reviewProposal({ project, file, rules, from });   // what tools/review.mjs calls
 *
 * A desk that loads a catalog and exports it writes the whole document back out with
 * `modified: true` on it and the origin's `id` and `rev` still in place (engine spec 5, and
 * `catalog-v2.js` line 360 in the pinned tree). That file is the only channel an agent has:
 * there is no live collaboration here and no merge server, so what arrives is a whole catalog
 * and what has to come out of it is a list of the things this agent changed, each one of which
 * the owner accepts or rejects.
 *
 * THE COMPARISON IS THE PUBLISHER'S, NOT A SECOND ONE. `src/diff.mjs` already matches tags and
 * cards by id and reports one row per differing field path, and it is the same machinery the
 * release notes are written from. A review queue with its own idea of what a change is would
 * eventually disagree with the release notes about what was in a revision, so this file adds
 * nothing to the comparison: it names the rows, decides them, and applies them.
 *
 * WHAT LANDS IS COMPARED WITH THE WORKING COPY, WHAT IS OFFERED WITH THE FILE'S OWN BASE. A
 * change lands in `draft.json`, so each row runs from the draft's value; but a field the file
 * never changed is the author's own work since, and offering it would undo that work (sense
 * pass 3, item 1). So a row is offered only where the file differs from the copy it was made
 * from, and is held back from every bulk accept where the draft moved too (`baseOf`).
 *
 * ELEVEN FIELDS ARE NEVER A PROPOSAL: `id`, `rev`, `date`, `hash`, `sig`, `modified`, `evaluation`,
 * `answered`, `grew`, `desk` and `flags`. The first is identity and a mismatch is a refusal rather
 * than a change; the next two belong to the publisher and every export carries the ones it was
 * handed; the next three are derived or are the export marker itself; `evaluation` is the mark a
 * publish stamps on an edition (an evaluation copy, or one from a newer build) and is never the
 * catalog's content; `answered` is the lead's outgoing list stamped onto an edition at publish from
 * the project's answers and is never catalog content or taken from a desk file; the last three
 * describe a desk's own file (where it grew from, who it is, and its flags) and are never the
 * catalog's content. Offering "rev 3 -> rev 3" for acceptance would train the eye to skim the
 * queue, which is the one thing a review queue must not do.
 *
 * A DECISION IS REMEMBERED BY WHAT IT DECIDED, not by where it was made. A rejected change is
 * stored as its key AND a fingerprint of the two values, using the engine's own `djb2` over the
 * engine's own canonical form. So re-reviewing the same file offers nothing again, while an
 * agent who comes back with a DIFFERENT wording at the same field is asked afresh: the pair is
 * not the pair that was refused.
 *
 * A DESK'S OWN FILE IS A PROPOSAL BY SIGNATURE AND GREW-FROM (board 834, step 8). A file in
 * `desks/<id>/` that the engine calls genuine there, grown from this catalog, is that desk's
 * proposal: its base is the archived edition its `grew` pins, so its removals are offered and
 * the lead's edits since are left out. Its decisions are remembered per desk and by the desk's
 * value alone, so a refused row comes back only when the agent changes it, whatever the lead does.
 */
import fs from "node:fs";
import crypto from "node:crypto";
import os from "node:os";
import path from "node:path";
import { diffCatalogs, excerpt, readCatalogDocument as readDocument, catalogFromText, HEADER_FIELDS } from "./diff.mjs";
/* THE REFUSALS A PERSON MEETS AT A SCREEN GO THROUGH refuse(), which keeps the English as
   the Error's message and carries the frame and its variables beside it so the page can say
   the same thing in Polish (board 523, src/refusal.mjs). A plain `throw new Error` below
   names a flag or reports a fault in this program, and stays English on purpose. */
import { refusalOf, noteOf, counted } from "./refusal.mjs";
import { writeWhole, renamePatiently } from "./whole-write.cjs";
import { HOSTILE, readJson, jsonText as json } from "./plain-json.mjs";
import { DESK_FILE_HEADER } from "./format-fields.mjs";
/* A DATE IS NEVER A ROW (board 982, src/dated.mjs): a desk dates the agent's own cards, so its file differs from the
   edition by those dates; the diff leaves them out, and so does every comparison below that reads a whole card or tag. */
import { undated } from "./dated.mjs";
/* THE ONE THING THIS FILE TAKES FROM THE TEXT IMPORTER: the name its report goes out
   under. A sidecar this file read without checking the kind would be any JSON file
   somebody happened to leave under that stem. */
import { REPORT_KIND as MARKS_KIND } from "./import-text.mjs";
/* src/import.mjs's REPORT_KIND, written out rather than imported: that module loads the pinned
   engine at import time, and this one is careful to load it only inside reviewProposal.
   tests/import-sense.mjs holds the two strings equal. */
const IMPORT_KIND = "etiuda-studio-import-report";

/** A refusal this file ANSWERS rather than throws, in the shape its callers already read:
 *  `refusal` is the English sentence and `said` is what it was built from, for the page. */
function noted(frame, vars) {
  const r = refusalOf(frame, vars);
  return { ok: false, refusal: r.message, said: r.said };
}

const REVIEW_LOG = "review-log.json";
const LOG_KIND = "etiuda-studio-review-log";

/* WHO ACCEPTED, AND WHY IT IS THE OPERATING SYSTEM'S ACCOUNT. Board item 606, Maxim on
 * 2026-09-19 21:37: the audit pack is for an internal quality manager and has to prove that
 * every card was approved before it was published, so the queue records who accepted each
 * proposal and when.
 *
 * `from` ALREADY IN THIS FILE IS THE OTHER PERSON. It is whose proposal arrived - the agent at
 * a desk - and it is typed by the reviewer, because nothing in an exported catalog says who
 * exported it. `by` is the reviewer themselves, read from the machine and never typed: the
 * ruling is no accounts, no sign-in and no typed name, and a name somebody types in to say who
 * they are is the weakest evidence of the three anyway.
 *
 * IT IS NOT THE WINDOWS ACCOUNT, IT IS THE OPERATING SYSTEM'S. The family goes multiplatform
 * (Maxim, the same evening: Ubuntu next), so this is `os.userInfo()`, which answers on every
 * platform node runs on, with the environment behind it for the case where the uid has no entry
 * in the password file - a container, an account deleted while it was signed in - because a
 * record that says "unknown" is worth more than a review that throws.
 *
 * WHAT IT PROVES AND WHAT IT DOES NOT, which the archive says in the same words: the account is
 * unverified. It shows which desk account decided, not which person sat at it. Carrying the
 * hostname beside it was considered and left out: nothing else this program writes carries one,
 * a catalog can be published from any machine an owner has, and a file bound for an auditor is
 * the wrong place to start collecting machine identifiers nobody asked for.
 */
const ACCOUNT_STATEMENT =
  "Every name in this record is the account name the operating system reported for whoever"
  + " was running Etiuda Studio when the decision was taken. It is not verified: this family of"
  + " programs has no accounts and asks nobody to sign in, so the name shows which computer"
  + " account decided and not which person sat at it.";

/** The account the operating system reports for this process, or "unknown". */
function whoDecides() {
  let name = "";
  try { name = String(os.userInfo().username || "").trim(); } catch { name = ""; }
  if (!name) name = String(process.env.USER || process.env.USERNAME || "").trim();
  return name || "unknown";
}

/** Where the importer's report for a file in the inbox sits: beside it, under the same stem. */
function besideOf(file) {
  return String(file).replace(/\.(ec|json)$/i, "") + ".lint.json";
}

/* ---- THE MARKS THE TEXT IMPORTER LEAVES BESIDE A PROPOSAL (604) ------------------------------
 *
 * A text import writes two files into the inbox: the proposal, which is a catalog, and
 * `<stem>.lint.json`, which is the importer's own report. Every passage the model reworded and
 * every platform token it translated is in that report as `{card, lang, marks}`, each mark an
 * offset into the PROPOSED body - src/import-text.mjs says at length why it is never an offset
 * into the source file. Maxim ruled on 2026-09-19 that every such passage is highlighted in the
 * review and reversible there in one press, and the review queue is the only screen that ever
 * sees a proposal, so the marks have to arrive on the row that shows the body they mark.
 *
 * A ROW CARRIES THEM PER LANGUAGE, because a row's side is one language and which one is the
 * reading language, a question this file does not answer (src/studio.mjs's primaryOf does). A
 * card arriving carries every language it has; a `body.<lang>` row carries that one.
 *
 * A MISSING OR UNREADABLE SIDECAR IS NOT A REFUSAL AND NOT A NOTE. Every proposal that did not
 * come from the text importer has no such file, which is the ordinary case and the only case
 * there was before 602, and a queue that said something about its absence would say it about
 * every desk's export forever. Marks are an extra a row may have.
 */
function marksBeside(file) {
  const at = besideOf(file);
  let doc = null;
  try { doc = readJson(at, { plain: true }); } catch { return null; }
  if (!doc || doc.kind !== MARKS_KIND || !Array.isArray(doc.marks)) return null;
  const cards = new Map();
  doc.marks.forEach(m => {
    if (!m || !Array.isArray(m.marks) || !m.marks.length) return;
    const id = String(m.card), lang = String(m.lang);
    if (!cards.has(id)) cards.set(id, {});
    cards.get(id)[lang] = m.marks.map(x => ({
      at: +x.at, len: +x.len, was: String(x.was == null ? "" : x.was),
      kind: String(x.kind || "reword") })).sort((a, b) => a.at - b.at);
  });
  const splices = new Map();
  (Array.isArray(doc.splices) ? doc.splices : []).forEach(s => {
    if (!s || s.card == null || !s.lang) return;
    const id = String(s.card);
    if (!splices.has(id)) splices.set(id, []);
    splices.get(id).push(String(s.lang));
  });
  /* A CARD BESIDE A STRETCH NO ANSWER COVERED (board 770): "end" where the stretch follows it,
     "start" where it comes before. */
  const unread = new Map();
  const side = (id, s) => {
    if (id == null) return;
    const k = String(id);
    if (!unread.has(k)) unread.set(k, []);
    if (unread.get(k).indexOf(s) < 0) unread.get(k).push(s);
  };
  (Array.isArray(doc.unread) ? doc.unread : []).forEach(u => {
    if (!u) return;
    side(u.before, "end");
    side(u.after, "start");
  });
  /* WHICH SERVICE AND MODEL WROTE IT, where the customer's own AI service did (board 992, job 1): the queue tags the file. */
  const m = doc.model && typeof doc.model === "object" ? doc.model : null;
  const model = m ? { service: String(m.service || ""), model: String(m.model || ""), host: String(m.host || "") } : null;
  return { at, cards, splices, unread, model };
}

/* THE PERSON'S OWN IMPORT, KNOWN BY THE REPORT STUDIO WROTE BESIDE IT (sense pass 2026-09-22,
 * items 18 and 42). An import into a project lands as a file in the inbox with its importer's
 * report under the same stem, and the queue read it as a document from nowhere: "another
 * catalog", "not an engine export: a document built somewhere else", a revision it was "made
 * against". All true of a file dropped in by a stranger and all wrong about a spreadsheet the
 * person chose a minute ago. Either importer's report names the file it read, so that name is
 * what the queue says instead, and what the attribution field starts from. The file is still
 * read as another catalog's cards coming in, which is the design; only the account changes.
 * A missing or foreign report is the ordinary case and says nothing. */
function importedAs(file) {
  const at = besideOf(file);
  let doc = null;
  try { doc = readJson(at, { plain: true }); } catch { return null; }
  if (!doc || (doc.kind !== IMPORT_KIND && doc.kind !== MARKS_KIND)) return null;
  const source = String(doc.source || "").trim();
  return source && source !== "(text)" ? source : null;
}

/** True when the report beside the file is the importer's and names a paste. A missing
 *  report is the ordinary case and is not a paste. */
function pasteBeside(file) {
  const at = besideOf(file);
  let doc = null;
  try { doc = readJson(at, { plain: true }); } catch { return false; }
  return !!(doc && doc.paste === true);
}

/**
 * The file's marks put onto the rows they belong to, and `marks` set to null on every other
 * row so that a caller never has to ask whether the field is there.
 *
 * @returns how many REWORDED passages the rows of this queue carry, which is the number the
 * list's own column shows. Counted over the rows rather than over the file: a card whose body
 * the working copy already holds makes no row, and a file with nothing to decide saying "3
 * reworded" would be pointing at nothing. One count per language, because a passage reworded
 * in two languages is two passages. Placeholder marks are deliberately not in it - every
 * import swaps placeholders, so counting them would put a number on every row and destroy the
 * signal the column exists to carry (Claudia, 2026-09-21).
 */
function attachMarks(changes, marks) {
  changes.forEach(c => { c.marks = null; c.spliced = null; c.unread = null; });
  if (!marks) return 0;
  let reworded = 0;
  changes.forEach(c => {
    if (c.scope !== "card") return;
    /* A SPLICE IS SAID ON THE ROW THAT SHOWS THE BODY: every language of a card arriving, the
       one language of a body row. */
    const joined = (marks.splices && marks.splices.get(String(c.id))) || [];
    const onRow = c.path == null && c.op === "add" ? joined
      : joined.filter(l => String(c.path || "") === "body." + l);
    if (onRow.length) c.spliced = onRow.slice();
    const near = marks.unread && marks.unread.get(String(c.id));
    if (near && c.path == null && c.op === "add") c.unread = near.slice();
    const per = marks.cards.get(String(c.id));
    if (!per) return;
    let take = null;
    if (c.path == null && c.op === "add") take = Object.assign({}, per);
    else {
      const bits = String(c.path || "").split(".");
      if (bits[0] === "body" && bits[1] && per[bits[1]]) {
        take = {}; take[bits[1]] = per[bits[1]];
      }
    }
    if (!take || !Object.keys(take).length) return;
    c.marks = take;
    Object.keys(take).forEach(lang => take[lang]
      .forEach(m => { if (m.kind === "reword") reworded++; }));
  });
  return reworded;
}

/* THE FOLDER A DESK WRITES ITS OWN FILE INTO, inside the folder the catalog is published to. */
const DESKS = "desks";

/** The name a desk goes by here: its own, else its id. The team file's roster is not read. */
function deskLabel(desk) {
  return (desk && desk.name) || (desk && desk.id) || "";
}

/** Every catalog file in the desks' folders under `folder`, as [key, file]: the key is its place. */
function deskFilesIn(folder) {
  if (!folder) return [];
  const root = path.join(path.resolve(folder), DESKS);
  let ids = [];
  try { ids = fs.readdirSync(root).filter(n => /^k-[0-9a-f]{16}$/.test(n)).sort(); } catch { return []; }
  return ids.reduce((out, id) => {
    let names = [];
    try { names = fs.readdirSync(path.join(root, id)).filter(n => /\.ec$/i.test(n)).sort(); } catch { names = []; }
    return out.concat(names.map(n => [DESKS + "/" + id + "/" + n, path.join(root, id, n)]));
  }, []);
}

/** The desk whose own file this is, or null: read from `desks/<id>/` and genuine there by the
 *  pinned engine's own rule (src/engine.mjs deskRules). `grew` is what it says it grew from. */
function deskOf(doc, file, D) {
  const at = path.resolve(String(file || ""));
  if (!doc || path.basename(path.dirname(path.dirname(at))) !== DESKS
      || !D.deskFileGenuine(doc, path.basename(path.dirname(at)))) return null;
  const g = doc.grew && typeof doc.grew === "object" && typeof doc.grew.id === "string" ? doc.grew : null;
  return { id: doc.desk.id, name: typeof doc.desk.name === "string" ? doc.desk.name : "",
           key: doc.desk.key, box: doc.desk.box,
           grew: g ? { id: g.id, rev: Number(g.rev), sha: String(g.sha || "") } : null };
}

/** The team key `teamKeys` holds for a team and epoch ({team id: {epoch: 32 bytes}}), or null. */
function teamKeyOf(teamKeys, team, epoch) {
  const own = (o, k) => !!o && typeof o === "object" && Object.prototype.hasOwnProperty.call(o, k);
  const byEpoch = own(teamKeys, String(team)) ? teamKeys[String(team)] : null;
  const k = own(byEpoch, String(epoch)) ? byEpoch[String(epoch)] : null;
  return k instanceof Uint8Array && k.length === 32 ? Buffer.from(k) : null;
}

/** A file in `desks/<id>/` as its desk wrote it, or one handed in to the project's inbox (`inbox`, that folder's path):
 *  an envelope sealed for the team (the engine's shell, step 12) is opened with the key `teamKeys` holds for that team
 *  and epoch (S, src/engine.mjs sealRules), and the catalog inside is what deskOf or the inbox's review then judges, as
 *  any export (6b-A). Anything else, or an envelope no key here opens, is handed back as it was read. */
function openedDeskFile(doc, file, teamKeys, S, inbox) {
  const at = path.resolve(String(file || ""));
  const where = path.basename(path.dirname(path.dirname(at))) === DESKS
    || (!!inbox && path.dirname(at) === path.resolve(String(inbox)));
  if (!doc || doc.kind !== S.SEALED_KIND || !where) return doc;
  const key = teamKeyOf(teamKeys, doc.team, doc.epoch);
  const text = key ? S.openSealed(key, doc) : null;
  if (text === null) return doc;
  try {
    const inner = catalogFromText(text, file);
    return inner && typeof inner === "object" && !Array.isArray(inner) && inner.kind !== S.SEALED_KIND ? inner : doc;
  } catch { return doc; }
}

/** Fields the queue never offers, and why is at the head of this file. */
const NEVER = new Set(["id", "rev", "date", "hash", "sig", "modified", "evaluation", "answered"].concat(DESK_FILE_HEADER)); /* plant:flag-answered-never */

const clone = v => JSON.parse(JSON.stringify(v === undefined ? null : v));

function byId(list) {
  const m = new Map();
  (Array.isArray(list) ? list : []).forEach(x => { if (x && x.id) m.set(String(x.id), x); });
  return m;
}

/* A KEY A PERSON CAN TYPE INTO A DECISIONS FILE, and one that cannot collide.
 *
 * `card:c-refund-late:body.pl` is a key somebody can read out over a telephone, which is the
 * property a text decisions file needs; the alternative, an index into a list, changes meaning
 * the moment the list is regenerated. The separator is a colon and the path separator a dot,
 * so a key is only unambiguous while no id and no field name carries either. The engine's ids
 * are slugs and its field names are identifiers, so that holds today - and `assertKeysUnique`
 * below refuses the whole review rather than letting two changes share a key, because the way
 * this fails silently is one accepted decision quietly applying to two fields. */
function keyFor(c) {
  if (c.scope === "header") return "header:" + c.path;
  const tail = c.op === "add" ? "+" : c.op === "remove" ? "-" : "";
  const head = (c.scope === "card" ? "card" : "tag") + tail;
  return c.op === "add" || c.op === "remove"
    ? head + ":" + c.id
    : head + ":" + c.id + ":" + c.path;
}

/* THE KEY READ BACK, which is how the archive's acceptance record knows which card a decision
 * was about. The log keeps decisions as keys, because a key is what a person reads and types;
 * grouping them by card therefore means undoing `keyFor` rather than storing the pieces twice,
 * and two stores of one fact drift. The split is on the FIRST colon and then the second, so a
 * field path may hold a dot and an id may not hold a colon, which is the property `keyFor` and
 * `assertKeysUnique` already depend on. A key from a future shape is handed back with a null
 * scope rather than guessed at: the record then files it under `other` and names it whole. */
function parseKey(key) {
  const s = String(key);
  const i = s.indexOf(":");
  if (i < 0) return { scope: null, op: "change", id: null, path: null };
  const head = s.slice(0, i), rest = s.slice(i + 1);
  if (head === "header") return { scope: "header", op: "change", id: null, path: rest };
  const op = head.endsWith("+") ? "add" : head.endsWith("-") ? "remove" : "change";
  const scope = op === "change" ? head : head.slice(0, -1);
  if (scope !== "card" && scope !== "tag")
    return { scope: null, op: "change", id: null, path: null };
  if (op !== "change") return { scope, op, id: rest, path: null };
  const j = rest.indexOf(":");
  return j < 0
    ? { scope, op, id: rest, path: null }
    : { scope, op, id: rest.slice(0, j), path: rest.slice(j + 1) };
}

/** The engine's hash over the engine's canonical form of the pair this change would make, a whole card's or tag's date
 *  left out, so a desk that only dated it again is not asked about afresh. */
function fingerprint(F, from, to) {
  return F.djb2(F.canonical([from === undefined ? null : undated(from), to === undefined ? null : undated(to)]));
}

function assertKeysUnique(changes) {
  const seen = new Map();
  changes.forEach(c => {
    if (seen.has(c.key)) throw new Error("two changes share the key " + JSON.stringify(c.key)
      + "; an id or a field name in this catalog carries a colon or a dot, and a decision on"
      + " that key would apply to both. The queue refuses rather than guess which was meant.");
    seen.set(c.key, c);
  });
}

/* ---- identity ------------------------------------------------------------------------------ */

/* WHAT MAKES A FILE A PROPOSAL AGAINST THIS PROJECT, and what makes it a different catalog.
 *
 * Identity is the file's own `id` (Maxim, 2026-09-16 16:02, board item 431), so a proposal
 * whose id is not the project's is refused outright: applying it field by field would silently
 * merge two catalogs into one and there would be no record afterwards that it had happened.
 *
 * A NOTE IS SAID IN THE READER'S LANGUAGE, WHICH IS WHY IT IS NOT A STRING. Every note below
 * is built by `noteOf` (src/refusal.mjs) and travels as the frame it was built from and its
 * variables, exactly as a refusal does, because it is painted at the head of the same screen:
 * `6-queue-after-pl-light.png` of board 539 is four lines of English on an otherwise Polish
 * queue, and that is what this buys back. The English is unchanged and is still `message`, so
 * `node tools/review.mjs` prints what it always printed, and the REVIEW LOG keeps the English
 * sentence rather than the frame - an audit record read in another program has no table to say
 * a frame with, and the log's shape is older than this class.
 *
 * A MISSING `modified` FLAG IS A NOTE AND NOT A REFUSAL. The engine writes it for a catalog
 * that came from a file, so an agent's export carries it; but a file that reached this folder
 * some other way - hand-edited, converted from v1, written by a future Studio - is still a
 * document with this catalog's id, and refusing it would mean the queue only accepts what one
 * version of one program happened to write. The note says which it was.
 *
 * SINCE 539 A DIFFERENT ID IS A DIFFERENT KIND OF PROPOSAL RATHER THAN A REFUSAL (Maxim,
 * 2026-09-19 05:23). Importing a pile of somebody else's macros into an open project and
 * reviewing an agent's export of this project are the same act seen twice: in both cases a
 * document arrives, is compared against the working copy, and every difference is accepted or
 * rejected one at a time. The refusal made the first act impossible and bought nothing, because
 * the second act's protection is not the id at all - it is that NOTHING IS APPLIED WITHOUT A
 * DECISION, which holds whatever the file says its id is.
 *
 * WHAT THE WIDENING IS NOT. It is not a merge of two catalogs: a file from another origin
 * offers ADDITIONS and CHANGES only, never a removal and never a header field, so a forty-row
 * pile imported into a twenty-three card project cannot propose to delete the twenty-three or
 * to rename the project. That filter is in proposalChanges and is driven by this answer's
 * `foreign` flag, and it is the whole of the difference between the two paths: a proposal whose
 * id IS this catalog's takes exactly the path it took before, header rows and removals and all.
 *
 * A FILE WITH NO ID AT ALL IS STILL A REFUSAL. An id is what a document says it is; without one
 * there is nothing to report at the head of the queue, nothing to write into the log, and no
 * way for a second reviewer to tell two dropped files apart. The engine gives every catalog an
 * id and so does Studio's importer, so a file without one was built by neither. */
/* A REV AS A NOTE SAYS IT (board 902): the number, and the dated edition it was published as in parentheses, where
   `head.datedOf` finds one. */
function revSaid(head, rev, dated) {
  const d = dated != null ? dated : (head && typeof head.datedOf === "function" ? head.datedOf(rev) : "");
  return String(rev) + (d ? " (" + d + ")" : ""); /* plant:txrd-rd7-5 */
}
function checkOrigin(head, proposal, imported, desk) {
  const notes = [];
  const a = String(head.id || ""), b = String(proposal.id || "");
  if (!b) return noted("this file does not say which catalog it belongs to, so there is"
    + " nothing to review it against. A file exported from a desk, or made by Studio's import,"
    + " always says;"
    + " exporting it again from the desk is enough.");
  /* An import of the person's own names its file and nothing else: its missing export marker
     and its revision are facts about a document Studio made a minute ago, not about where it
     came from. */
  /* AN IMPORT IS COMING IN WHATEVER ID ITS FILE NAME MINTS: a sheet named after the project gets
     the project's own id, and read as a desk's export it offered to remove every card it left
     out, under a note saying nothing would be. */
  if (imported) {
    notes.push(noteOf("imported here from {FILE}, so every row below is a card or a tag coming"
      + " in from that file. Nothing it leaves out is offered for removal and nothing about the"
      + " catalog's own name or languages is offered at all", { FILE: imported }));
    return { ok: true, foreign: true, foreignId: b, notes };
  }
  /* A DESK'S FILE GROWN FROM THIS CATALOG IS ITS PROPOSAL, though its id is the desk's: its own rev
     counts the desk's writes, so the edition it was made against is the one its grew names. */
  if (desk && desk.grew && a && desk.grew.id === a) {
    const hr = Number(head.rev), gr = desk.grew.rev;
    if (Number.isFinite(hr) && gr < hr)
      notes.push(noteOf("the proposal was made against rev {THEIRS} and the working copy is at"
        + " rev {OURS}, so its author had not seen the later rev", { THEIRS: revSaid(head, gr), OURS: revSaid(head, hr, head.edition) })); /* plant:txrw-rw1-6 */
    return { ok: true, foreign: false, foreignId: null, desk, notes };
  }
  if (a && b !== a) {
    /* Said at the head of the queue and written into the review log, so that an acceptance
       record read a year later says which catalog each accepted card came out of. */
    notes.push(noteOf("this file is from a different catalog: it says id {THEIRS} and this"
      + " catalog is {OURS}, so every row below is a card, an intent or a category coming IN."
      + " Nothing it leaves out is offered for removal and nothing about the"
      + " catalog's own name or languages is offered at all", { THEIRS: JSON.stringify(b), OURS: JSON.stringify(a) }));
    if (proposal.modified !== true) notes.push(noteOf("it does not carry modified: true, so it"
      + " is not an engine export: it is a document built somewhere else"));
    return { ok: true, foreign: true, foreignId: b, notes };
  }
  if (proposal.modified !== true) notes.push(noteOf("the proposal does not carry modified:"
    + " true, so it was not written by an engine export of this catalog; its id says it is"
    + " this catalog all the same"));
  const hr = Number(head.rev), pr = Number(proposal.rev);
  if (Number.isFinite(hr) && Number.isFinite(pr) && pr < hr)
    notes.push(noteOf("the proposal was made against rev {THEIRS} and the working copy is at"
      + " rev {OURS}, so its author had not seen the later rev", { THEIRS: revSaid(head, pr), OURS: revSaid(head, hr, head.edition) }));
  if (Number.isFinite(pr) && Number.isFinite(hr) && pr > hr)
    notes.push(noteOf("the proposal claims rev {THEIRS}, ahead of this catalog's {OURS};"
      + " only the origin bumps rev, so this file has been through another publisher",
      { THEIRS: revSaid(head, pr, ""), OURS: revSaid(head, hr, head.edition) }));
  return { ok: true, foreign: false, foreignId: null, notes };
}

/* ---- what the file was made from (sense pass 3, item 1) -------------------------------------- */

/* A FOLDER OF FILES THAT ARE NEVER REWRITTEN, read once per process: an archived edition and a
   decided proposal are immutable once in place, and a queue reviews every inbox file against the
   same few. The listing is kept while the folder's own time stands, which a file added or taken
   away moves, so a share pays one stat per review rather than one per file in the folder. */
const FOLDERS = new Map();
function folderOf(at, dirs) {
  let st;
  try { st = fs.statSync(at); } catch { return null; }
  let was = FOLDERS.get(at);
  if (!was || was.mtime !== st.mtimeMs) {
    let names = [];
    try {
      names = fs.readdirSync(at, { withFileTypes: true })
        .filter(d => (dirs ? d.isDirectory() : d.isFile())).map(d => d.name).sort();
    } catch { names = []; }
    was = { mtime: st.mtimeMs, names, read: new Map() };
    FOLDERS.set(at, was);
  }
  return was;
}
/** What `read` makes of one file of a folder, kept once it is something. */
function keptRead(folder, name, read) {
  if (folder.read.has(name)) return folder.read.get(name);
  const v = read();
  if (v) folder.read.set(name, v);
  return v;
}

/** A catalog's cards and tags by id, each as the engine's canonical form. */
function shapeOf(doc, F) {
  const one = (list) => {
    const m = new Map();
    (Array.isArray(list) ? list : []).forEach(x => {
      if (x && x.id) m.set(String(x.id), F.canonical(undated(x)));
    });
    return m;
  };
  return { cards: one(doc.cards), tags: one(doc.tags) };
}

/** How many cards and tags differ between two shapes, by id. */
function distance(a, b) {
  let n = 0;
  ["cards", "tags"].forEach(k => {
    a[k].forEach((v, id) => { if (b[k].get(id) !== v) n++; });
    b[k].forEach((v, id) => { if (!a[k].has(id)) n++; });
  });
  return n;
}

/* WHICH COPY A FILE WAS MADE FROM. A desk's export before engine ecd66dd kept the loaded rev, or
 * claimed rev + 1 when an edition was chosen in its dialog, so this catalog's own file is read
 * against the archived edition nearest to it among revs rev-2 to rev; the nearest is the one the
 * desk held, and a tie goes to the earlier, which holds rows back rather than offering them.
 * Another catalog's file is read against the last decided file from the same source, and the
 * pinned engine's export, with its new id and rev 1, is one; whether it should be is open ruling
 * R1. `primary` null: not known.
 */
function baseOf(dir, proposal, origin, imported, F, Publish, D) {
  /* The archive's names sort in the order the editions were published (src/publish.mjs,
     viewInput), so it is read from the newest back, and only as far as the revs it needs. */
  const archAt = path.join(dir, Publish.ARCHIVE);
  const arch = folderOf(archAt, true);
  const names = arch ? arch.names : [];
  const edition = (name) => keptRead(arch, name, () => {
    try {
      const doc = JSON.parse(fs.readFileSync(path.join(archAt, name, Publish.CATALOG_IN_ARCHIVE),
        "utf8").replace(/^\uFEFF/, ""));
      return { doc, shape: shapeOf(doc, F) };
    } catch { return null; }
  });
  let latest = null;
  for (let i = names.length - 1; i >= 0 && !latest; i--) latest = edition(names[i]);
  const seen = latest ? [latest.doc] : [];
  /* A DESK'S PROPOSAL NAMES ITS BASE: the edition at its grew's rev whose signed bytes hash to its
     grew's sha, and no other. Where none matches, nothing shows which copy it was made from. */
  if (origin.desk) {
    const g = origin.desk.grew;
    let found = null;
    for (let i = names.length - 1; i >= 0 && !found; i--) {
      const e = edition(names[i]);
      if (!e || Number(e.doc.rev) !== g.rev) continue;
      if (e.sha === undefined) e.sha = D.signedSha(e.doc);
      if (e.sha === g.sha) found = e;
    }
    return { primary: found ? found.doc : null, others: [], seen: seen.concat(found ? [found.doc] : []) };
  }
  if (origin.foreign) {
    const home = path.join(dir, DECIDED);
    const decided = folderOf(home, false);
    const files = (decided ? decided.names : [])
      .filter(n => /\.(ec|json|js)$/i.test(n) && !/\.lint\.json$/i.test(n));
    let best = null;
    files.forEach(n => {
      const at = path.join(home, n);
      const got = keptRead(decided, n, () => {
        let doc = null;
        try { doc = readDocument(at); } catch { return null; }
        return { doc, from: importedAs(at), t: fs.statSync(at).mtimeMs };
      });
      if (!got || (imported ? got.from !== imported : got.from !== null)) return;
      if (!imported && String(got.doc.id || "") !== String(origin.foreignId)) return;
      if (!best || got.t > best.t || (got.t === best.t && n > best.n)) best = { t: got.t, n, doc: got.doc };
    });
    return { primary: best ? best.doc : null, others: [], seen };
  }
  const pr = Number(proposal.rev);
  if (!Number.isFinite(pr)) return { primary: null, others: [], seen };
  const near = [];
  for (let i = names.length - 1; i >= 0; i--) {
    const e = edition(names[i]);
    if (!e) continue;
    const rev = Number(e.doc.rev);
    if (rev < pr - 2) break;
    if (rev <= pr) near.push(e);
  }
  if (!near.length) return { primary: null, others: [], seen };
  if (near.length === 1) return { primary: near[0].doc, others: [], seen: seen.concat([near[0].doc]) };
  const mine = shapeOf(proposal, F);
  const ranked = near.map(e => ({ d: e.doc, n: distance(e.shape, mine) }))
    .sort((x, y) => (x.n - y.n) || (Number(x.d.rev) - Number(y.d.rev)));
  return { primary: ranked[0].d, others: ranked.slice(1).map(x => x.d),
           seen: seen.concat(near.map(e => e.doc)) };
}

/** One row's value in a document: the header field, the whole card or tag, or a field of it. */
function valueIn(doc, c) {
  if (!doc) return undefined;
  const own = (o, k) => (o !== null && typeof o === "object" && !Array.isArray(o)
    && Object.prototype.hasOwnProperty.call(o, k) ? o[k] : undefined);
  if (c.scope === "header") return own(doc, c.path);
  const list = c.scope === "card" ? doc.cards : doc.tags;
  const x = (Array.isArray(list) ? list : []).find(y => y && String(y.id) === String(c.id));
  if (c.path == null || x === undefined) return x;
  return String(c.path).split(".").reduce((v, k) => own(v, k), x);
}

/* A ROW IS DROPPED where the file holds the base's value, the difference being the author's;
 * HELD where the draft moved from the base too, or where no base is known and the row would
 * change or remove something here, or where it proposes a value another candidate edition held
 * or brings back a card an edition had. A held row is accepted only by its own key.
 */
function classify(changes, base, F) {
  const eq = (x, y) => F.canonical(x === undefined ? null : undated(x))
    === F.canonical(y === undefined ? null : undated(y));
  return changes.filter(c => {
    if (base.primary) {
      const was = valueIn(base.primary, c);
      if (eq(c.to, was)) return false;
      c.conflict = !eq(c.from, was);
    } else c.conflict = c.op !== "add";
    if (!c.conflict && c.op === "add")
      c.conflict = base.seen.some(d => valueIn(d, c) !== undefined);
    else if (!c.conflict && c.op !== "remove")
      c.conflict = base.others.some(d => eq(c.to, valueIn(d, c)));
    return true;
  });
}

/* ---- the queue ------------------------------------------------------------------------------ */

/**
 * Every field-level change the proposal makes to the head, as decidable rows.
 * @param head      the working copy, a format 2 document
 * @param proposal  the agent's exported file
 * @param F         the pinned engine's format module
 * @param opts.foreign  the file is another catalog's, so it may only add and change
 *
 * WHAT A FOREIGN FILE MAY PROPOSE, and the reasoning is at checkOrigin: additions and changes,
 * never a removal and never a header field. The filter is here rather than at the call site
 * because `keyFor` and `assertKeysUnique` run below it, and a key that is built and then thrown
 * away is a key that can still collide with one that is kept.
 */
function proposalChanges(head, proposal, F, opts) {
  const foreign = !!(opts && opts.foreign);
  const d = diffCatalogs(head, proposal, F.canonical);
  const out = [];

  if (!foreign) d.header.filter(h => !NEVER.has(h.field)).forEach(h =>
    out.push({ scope: "header", op: "change", id: null, kind: null, path: h.field,
               from: h.from, to: h.to }));

  const pTags = byId(proposal.tags), hTags = byId(head.tags);
  const pCards = byId(proposal.cards), hCards = byId(head.cards);

  d.tags.added.forEach(t => out.push({ scope: "tag", op: "add", id: t.id, kind: t.kind,
                                       path: null, from: undefined, to: pTags.get(t.id) }));
  if (!foreign) d.tags.removed.forEach(t => out.push({ scope: "tag", op: "remove", id: t.id,
                                         kind: t.kind,
                                         path: null, from: hTags.get(t.id), to: undefined }));
  /* A FIELD A FOREIGN FILE LEAVES OUT IS NOT OFFERED FOR REMOVAL EITHER, for the reason a card
     it leaves out is not: an import has no column for a note, an icon or a second language, and
     its silence about them emptied every one on a card it met (Studio polish 04, item 1). */
  const offered = (f) => !NEVER.has(f.path) && !(foreign && f.to === undefined);
  d.tags.changed.forEach(t => t.fields.filter(offered).forEach(f =>
    out.push({ scope: "tag", op: "change", id: t.id, kind: t.kind, path: f.path,
               from: f.from, to: f.to })));

  d.cards.added.forEach(c => out.push({ scope: "card", op: "add", id: c.id, kind: "card",
                                        path: null, from: undefined, to: pCards.get(c.id) }));
  if (!foreign) d.cards.removed.forEach(c => out.push({ scope: "card", op: "remove", id: c.id,
                                          kind: "card",
                                          path: null, from: hCards.get(c.id), to: undefined }));
  d.cards.changed.forEach(c => c.fields.filter(offered).forEach(f =>
    out.push({ scope: "card", op: f.path === "shelf" ? "move" : "change", id: c.id,
               kind: "card", path: f.path, from: f.from, to: f.to })));

  const kept = opts && opts.base ? classify(out, opts.base, F) : out;
  const mine = !!(opts && opts.desk);
  kept.forEach(c => {
    c.key = keyFor(c); c.conflict = !!c.conflict;
    c.fingerprint = mine ? fingerprint(F, undefined, c.to) : fingerprint(F, c.from, c.to);
  });
  kept.sort((x, y) => x.key.localeCompare(y.key));
  assertKeysUnique(kept);
  return kept;
}

/* ONE LINE A PERSON READS, AND THE WINDOW IS THE DIFF'S OWN.
 *
 * Measured before this used `excerpt`: a sentence appended to a card body printed two identical
 * sixty-character excerpts, because truncating from the head of a string shows the part that
 * did not change. That is the exact fault src/diff.mjs names at its own excerpt function, and
 * writing a second truncation here reproduced it within an hour of reading the comment - so the
 * queue borrows that function rather than having a shorter one of its own.
 *
 * A NEWLINE IS SHOWN AS TWO CHARACTERS. A card body is several lines, and a real newline in the
 * middle of a row turns a queue of one row per change into something nobody can scan. The
 * flattening happens here rather than in the diff, because the diff's output is read as a
 * document where a wrapped body is fine and the queue's is read as a list. */
function changeLine(c, opts) {
  const o = opts || {};
  const flat = s => String(s).split("\n").join(" \\n ").split("\r").join("");
  const what = c.op === "add" ? "add    " : c.op === "remove" ? "remove " :
               c.op === "move" ? "move   " : "change ";
  const head = what + c.key;
  if (o.values === false || c.op === "add" || c.op === "remove") return head;
  const [a, b] = excerpt(c.from, c.to, o.width || 60);
  return head + "  " + flat(a) + "  ->  " + flat(b);
}

/* ---- applying ------------------------------------------------------------------------------- */

/** Set or delete one dotted path inside an object. `to === undefined` deletes the leaf.
 *  A step that names a prototype is refused: the door refuses such a file before any row. */
function setPath(obj, dotted, to) {
  const parts = String(dotted).split(".");
  const bad = parts.find(k => HOSTILE.has(k));
  if (bad !== undefined) throw new Error("a change at " + JSON.stringify(String(dotted))
    + " names " + bad + ", which would reach the program's own objects; nothing was set");
  let at = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const k = parts[i];
    if (at[k] === null || typeof at[k] !== "object" || Array.isArray(at[k])) at[k] = {};
    at = at[k];
  }
  const last = parts[parts.length - 1];
  if (to === undefined) delete at[last];
  else at[last] = clone(to);
}

/* WHERE AN ACCEPTED NEW CARD GOES IN THE ARRAY, which is not a cosmetic question: the order of
 * `cards` is the order the engine lays them out inside a shelf. Appending every accepted card
 * to the end would drop an agent's arrangement on the floor, and re-sorting the whole array
 * would be this file having an opinion about a catalog it did not write. So a new card is put
 * after whichever card precedes it in the PROPOSAL and already exists here, and at the end only
 * when it is the proposal's first card or none of its predecessors survived. */
function insertNear(list, item, proposal) {
  const order = (proposal.cards || []).map(c => String(c && c.id));
  const at = order.indexOf(String(item.id));
  for (let i = at - 1; i >= 0; i--) {
    const j = list.findIndex(c => String(c && c.id) === order[i]);
    if (j > -1) { list.splice(j + 1, 0, item); return; }
  }
  if (at === 0) list.unshift(item); else list.push(item);
}

/**
 * The working copy with the accepted changes in it. The head handed in is not touched.
 * @returns { catalog, applied: [key], skipped: [{key, why}] }
 */
function applyChanges(head, proposal, changes, accepted) {
  const out = clone(head);
  out.tags = Array.isArray(out.tags) ? out.tags : [];
  out.cards = Array.isArray(out.cards) ? out.cards : [];
  const applied = [], skipped = [];
  const take = changes.filter(c => accepted.has(c.key));

  /* Removals last, so that a change to a field of a card and the removal of that same card
     cannot depend on which order the keys sorted in. A proposal cannot contain both, but a
     decisions file assembled by hand from two reviews can. */
  const order = { add: 0, change: 1, move: 1, remove: 2 };
  take.sort((a, b) => (order[a.op] - order[b.op]) || a.key.localeCompare(b.key));

  take.forEach(c => {
    const list = c.scope === "card" ? out.cards : out.tags;
    if (c.scope === "header") { setPath(out, c.path, c.to); applied.push(c.key); return; }
    if (c.op === "add") {
      if (list.some(x => String(x && x.id) === String(c.id))) {
        skipped.push({ key: c.key, why: "already here" }); return;
      }
      if (c.scope === "card") insertNear(list, clone(c.to), proposal);
      else list.push(clone(c.to));
      applied.push(c.key); return;
    }
    const i = list.findIndex(x => String(x && x.id) === String(c.id));
    if (i < 0) { skipped.push({ key: c.key, why: "no longer in the working copy" }); return; }
    if (c.op === "remove") { list.splice(i, 1); applied.push(c.key); return; }
    setPath(list[i], c.path, c.to);
    applied.push(c.key);
  });

  return { catalog: out, applied, skipped };
}

/* ---- the log ------------------------------------------------------------------------------- */

function readLog(dir) {
  const at = path.join(dir, REVIEW_LOG);
  if (!fs.existsSync(at)) return { kind: LOG_KIND, schema: 1, reviews: [], decided: [] };
  const log = JSON.parse(fs.readFileSync(at, "utf8").replace(/^\uFEFF/, ""));
  log.reviews = Array.isArray(log.reviews) ? log.reviews : [];
  log.decided = Array.isArray(log.decided) ? log.decided : [];
  return log;
}

function writeLog(dir, log) {
  writeWhole(path.join(dir, REVIEW_LOG), json(log));
}

/* WHICH REVIEWS HAVE ALREADY GONE OUT IN AN EDITION, so that the archive's acceptance record
 * covers what landed SINCE the last publish and no decision is counted into two editions.
 *
 * The watermark is a count of review entries rather than a time, because `reviews` is only ever
 * appended to and a count cannot be confused by two decisions inside one millisecond or by a
 * clock the caller fixed. It lives in the log rather than in the archive for the reason the
 * archive exists: an edition can be pruned, and a pruned edition must not make the next record
 * repeat everything that ever happened. `published` is written by src/publish.mjs, which is the
 * only writer of an edition.
 */
function acceptancesSince(dir) {
  const has = fs.existsSync(path.join(dir, REVIEW_LOG));
  const log = readLog(dir);
  const marks = Array.isArray(log.published) ? log.published : [];
  const last = marks.length ? Number(marks[marks.length - 1].through) : 0;
  const from = Number.isFinite(last) && last > 0 ? last : 0;
  const all = log.reviews || [];
  return { log: has, reviews: all.slice(from), first: all.length > from ? from + 1 : null,
           through: all.length };
}

/** Say that everything up to `mark.through` went out in an edition. No log, nothing to say. */
function markPublished(dir, mark) {
  if (!fs.existsSync(path.join(dir, REVIEW_LOG))) return false;
  const log = readLog(dir);
  log.published = (Array.isArray(log.published) ? log.published : []).concat([mark]);
  writeLog(dir, log);
  return true;
}

/** What was decided before about this desk's proposals, or about files from no desk, as key ->
 *  { decision, fingerprint, from }. The last word wins. */
function decidedBefore(log, desk) {
  const m = new Map(), who = desk || null;
  (log.decided || []).forEach(d => { if ((d.desk || null) === who) m.set(d.key, d); });
  return m;
}

function sha256(file) {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

/* ---- decisions ------------------------------------------------------------------------------ */

/* A DECISIONS FILE IS RULES IN ORDER AND THE LAST MATCH WINS, which is the one resolution rule
 * a person can hold in their head while writing the file. It means "reject everything, then
 * accept these three" is expressible in four lines, and it means a rule typed twice is not an
 * error to be reported but a decision revised. A key may carry `*`, so an author who has read
 * the queue can decide a whole card or a whole field at once.
 *
 *     # reviewed 2026-09-17
 *     reject *
 *     accept card:c-vorilka-1:body.en
 *     accept card+:*
 */
function parseDecisions(text) {
  const rules = [];
  String(text || "").split(/\r?\n/).forEach((raw, i) => {
    const line = raw.replace(/#.*$/, "").trim();
    if (!line) return;
    const m = /^(accept|reject)\s+(\S.*)$/i.exec(line);
    if (!m) throw new Error("line " + (i + 1) + " of the decisions file is neither an accept nor"
      + " a reject: " + JSON.stringify(raw.trim()));
    rules.push({ verb: m[1].toLowerCase(), pattern: m[2].trim() });
  });
  return rules;
}

/* A `*` in a key, and nothing else. Built by SPLITTING on the star and escaping the pieces
 * rather than by a substitution with a sentinel character in it: a sentinel is a character a
 * key could contain, and this repository has already had one invisible byte land in a file
 * through an escape that was taken literally. */
function globToRe(pattern) {
  const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, ch => "\\" + ch);
  return new RegExp("^" + String(pattern).split("*").map(esc).join(".*") + "$");
}

/** key -> "accept" | "reject" for the keys the rules touch. The last matching rule wins.
 *  A key in `held` is accepted only by a rule that names it without a star. */
function resolveDecisions(rules, keys, held) {
  const out = new Map();
  const res = rules.map(r => ({ verb: r.verb, re: globToRe(r.pattern),
                                star: String(r.pattern).indexOf("*") >= 0 }));
  keys.forEach(k => {
    let verdict = null;
    res.forEach(r => {
      if (r.re.test(k) && !(r.verb === "accept" && r.star && held && held.has(k)))
        verdict = r.verb;
    });
    if (verdict) out.set(k, verdict);
  });
  return out;
}

/* WHERE A PROPOSAL GOES WHEN NOTHING IN IT IS LEFT TO DECIDE (sense pass 2026-09-22, item 19):
 * `<project>/decided`, beside the inbox and beside the archive, for the archive's reason - the
 * file stays the project's, next to the review log that says what was done with each row, and
 * it stops being listed as something to do. Nothing ever left the inbox before: the list kept
 * every decided file at Waiting 0 while the rail said 0 files, and an import of the same file
 * name was refused for ever. A name already there gains -2, -3 before its extension, so a sheet
 * imported and decided twice keeps both; the importer's report beside it moves with it, under
 * the same new stem, because the queue reads the two as a pair.
 *
 * CALLED BY THE TWO DOORS AND NOT BY reviewProposal: the screen's decideProposal and
 * tools/review.mjs both put a settled inbox file away, so the doors agree, while the module
 * itself still answers about a file wherever it is, which tests/review-screen.mjs section 6
 * holds it to.
 */
const DECIDED = "decided";

function putAway(home, file) {
  const into = path.join(home, DECIDED);
  fs.mkdirSync(into, { recursive: true });
  const ext = path.extname(file), stem = path.basename(file, ext);
  let name = stem, n = 2;
  while (fs.existsSync(path.join(into, name + ext))) name = stem + "-" + n++;
  const to = path.join(into, name + ext);
  /* ASKED AGAIN WHILE ANOTHER PROGRAM HOLDS IT, as writeWhole asks (Grok review kappa, finding 3): a scanner or a sync client
     opening the file a moment after it was decided is the ordinary case, and the decision has landed by then. */
  renamePatiently(file, to);
  const side = path.join(path.dirname(file), stem + ".lint.json");
  if (fs.existsSync(side)) renamePatiently(side, path.join(into, name + ".lint.json"));
  return to;
}

/* A TOP-LEVEL FIELD THIS STUDIO DOES NOT KNOW. It is not a row, and it is not written onto the
 * draft: the lead cannot review it, so it must not ride into the next published edition. The
 * proposal file keeps it, and the screen warns once before that file is archived. The known
 * header, the fields the queue never offers, the document's own structure and every key the
 * pinned engine names are Studio's. Anything else at the top level, other than a hostile key,
 * is one of these fields. */
function unknownHeadKeys(doc, named) {
  const known = new Set(HEADER_FIELDS);
  NEVER.forEach((k) => known.add(k));
  ["format", "kind", "tags", "cards", "notes", "name"].forEach((k) => known.add(k));
  (named || []).forEach((k) => known.add(k));
  if (!doc || typeof doc !== "object" || Array.isArray(doc)) return [];
  return Object.keys(doc).filter((k) => !known.has(k) && !HOSTILE.has(k));
}

/* ---- the whole act -------------------------------------------------------------------------- */

/**
 * Open a proposal against a project, decide what the rules decide, and land the accepted
 * changes in the working copy.
 *
 * @param o.project    the project folder: project.json beside draft.json
 * @param o.file       the agent's exported file
 * @param o.rules      decision rules, as parseDecisions returns them
 * @param o.from       the attribution: whose proposal this is. Required to decide anything.
 * @param o.note       a free note recorded with the review
 * @param o.again      re-offer changes decided in an earlier review
 * @param o.now        a fixed clock for the log entry
 * @param o.write      false to look without touching anything
 * @param o.head, o.proposal, o.log, o.canon   what a listing has already read: the project as
 *                     readProject answers it, the file as readCatalogDocument does, the review
 *                     log, and the engine's canonical form kept per object. For a look only.
 * @param o.beside     false where the listing has found no report beside the file
 *
 * NOTHING IS WRITTEN BY A REVIEW THAT DECIDES NOTHING. Reading the queue is the commonest
 * thing anybody does with it, and a read that leaves a log entry behind turns the log into a
 * record of who looked rather than of what was decided. It is also what makes "review the same
 * file twice and the project is byte for byte where it was" a claim worth asserting.
 */
async function reviewProposal(o) {
  const opts = o || {};
  const Engine = await import("./engine.mjs");
  const Publish = await import("./publish.mjs");
  /* defineProperty and not an assignment: the module's own `canonical` refuses to be set. */
  const F = opts.canon ? Object.defineProperty(Object.create(await Engine.format()), "canonical",
    { value: opts.canon }) : await Engine.format();

  const dir = path.resolve(opts.project);
  const p = opts.head || Publish.readProject(dir);
  const draft = p.draft;
  const headId = String(draft.id || p.project.id || "");
  const headRev = Number(p.project.rev);

  /* A FILE THAT IS NOT A CATALOG AT ALL is answered in the page's words; a disk's own error, which
     carries a code, goes on to the shell's diskRefusal as before. */
  let proposal = opts.proposal || null;
  if (!proposal) try { proposal = (await import("./diff.mjs")).readCatalogDocument(opts.file); }
  catch (e) {
    if (e && e.code) throw e;
    if (e && e.said) return { ok: false, refusal: e.message, said: e.said, changes: [], notes: [] };
    return Object.assign(noted("this is not a catalog file, so there is nothing in it to review"),
      { changes: [], notes: [] });
  }
  /* A desk file or an inbox file the listing did not hand over is opened here as the listing opens it. */
  if (!opts.proposal && opts.teamKeys)
    proposal = openedDeskFile(proposal, opts.file, opts.teamKeys, Engine.sealRules(), opts.inbox || null);
  const imported = opts.beside === false ? null : importedAs(opts.file);
  const paste = opts.beside === false ? false : pasteBeside(opts.file);
  const D = Engine.deskRules();
  /* The dated edition an archived rev was published as, the newest carrying it, read only where a note names that rev. */
  const datedOf = (rev) => {
    let names = [];
    try { names = Publish.editionsIn(dir); } catch { return ""; }
    for (let i = names.length - 1; i >= 0; i--) {
      try { if (Number(Publish.archivedCatalog(dir, names[i]).rev) === Number(rev)) return names[i]; } catch { /* unread, no name */ }
    }
    return "";
  };
  /* THE FILE "BRING UP TO THE ORIGINAL" WROTE INTO A LINKED COPY'S INBOX (src/link.mjs) is this catalog's own proposal,
     read against the original's edition the copy last took in, so the copy's own edits since are conflicts and never
     rows that undo them. Only that file as written is; anything else under its name is read as before. */
  const sync = imported || !opts.file ? null : (await import("./link.mjs")).syncOf(dir, p.project, opts.file);
  const origin = sync
    ? { ok: true, foreign: false, foreignId: null, linked: sync, notes: [noteOf("brought from the original catalog at rev {REV}:"
        + " each row is a change made there since this copy last took it in", { REV: String(sync.rev) })] }
    : checkOrigin({ id: headId, rev: headRev, edition: String(p.project.edition || ""), datedOf }, proposal, imported,
      imported ? null : deskOf(proposal, opts.file, D));
  if (!origin.ok)
    return { ok: false, refusal: origin.refusal, said: origin.said, changes: [], notes: [] };

  const base = sync ? { primary: sync.base, others: [], seen: sync.base ? [sync.base] : [] }
    : baseOf(dir, proposal, origin, imported, F, Publish, D);
  const changes = proposalChanges(draft, proposal, F, { foreign: origin.foreign, base,
                                                        desk: !!origin.desk });
  const held = changes.filter(c => c.conflict).length;
  const heldRows = counted(held, "{N} row", "{N} rows");
  if (held) origin.notes.push(base.primary
    ? noteOf("{ROWS} changed here as well since the copy this file was made from, so look at"
      + " each such row before accepting it", { ROWS: heldRows })
    : noteOf("nothing here shows which copy this file was made from, so {ROWS} may undo a"
      + " change made here; look at each such row before accepting it", { ROWS: heldRows }));
  /* ATTACHED HERE AND NOT INSIDE proposalChanges, which is handed two documents and no
     path: the marks are a property of the FILE this proposal arrived as, not of the
     comparison between it and the working copy. */
  const marks = opts.beside === false ? null : marksBeside(opts.file);
  const reworded = attachMarks(changes, marks);
  const deskId = origin.desk ? origin.desk.id : null;
  const before = decidedBefore(opts.log || readLog(dir), deskId);

  const known = [], fresh = [];
  changes.forEach(c => {
    const was = before.get(c.key);
    if (!opts.again && was && was.fingerprint === c.fingerprint) known.push({ c, was });
    else fresh.push(c);
  });

  const verdicts = resolveDecisions(opts.rules || [], fresh.map(c => c.key),
    new Set(fresh.filter(c => c.conflict).map(c => c.key)));
  const accepted = fresh.filter(c => verdicts.get(c.key) === "accept");
  const rejected = fresh.filter(c => verdicts.get(c.key) === "reject");
  const pending = fresh.filter(c => !verdicts.has(c.key));

  /* A DESK'S PROPOSAL IS ATTRIBUTED TO THE DESK, by the name the lead gave it or its own. */
  const from = String(opts.from || "").trim()
    || (origin.desk ? String(opts.deskName || origin.desk.name || origin.desk.id).trim() : "");
  if ((accepted.length || rejected.length) && !from)
    return Object.assign(noted("a decision has to be attributable: write whose proposal this"
      + " is. {ACCEPTED} would have been accepted and {REJECTED} rejected, and nothing was"
      + " written.", {
        ACCEPTED: counted(accepted.length, "{N} change", "{N} changes"),
        REJECTED: counted(rejected.length, "{N} change", "{N} changes") }),
      { changes, known, pending, notes: origin.notes });

  const acceptedKeys = new Set(accepted.map(c => c.key));
  const landed = accepted.length ? applyChanges(draft, proposal, changes, acceptedKeys)
    : { catalog: draft, applied: [], skipped: [] };

  const result = { ok: true, importedFrom: imported, ...(paste ? { paste: true } : {}),
                   notes: origin.notes, changes, known,
                   accepted, rejected, pending,
                   applied: landed.applied, skipped: landed.skipped, draftAt: p.draftAt,
                   wrote: [], project: p.project, proposal,
                   foreign: !!origin.foreign, foreignId: origin.foreignId || null,
                   desk: origin.desk || null, linked: origin.linked ? origin.linked.from : null,
                   proposalAt: path.resolve(opts.file),
                   reworded, marksAt: marks ? marks.at : null, model: marks ? marks.model : null };

  if (opts.write === false || (!landed.applied.length && !accepted.length && !rejected.length))
    return result;

  /* The working copy, with the engine's own hash recomputed over what it now holds. A draft
     carrying the hash of what it used to be is a file the engine's reader calls broken, and the
     next publish would refuse it. An unknown top-level field is not written here: the proposal
     file keeps it, and copying it would publish a field the lead never reviewed. */
  /* ONE DECISION, ONE COMMIT (Grok review kappa, finding 3, verified B): the draft as it was is kept, and a log that will not
     take the decision takes the draft back with it, so the accepts and the rejects land together or not at all, and a retry
     cannot find a rejected change waiting while its accepts sit in the draft unlogged. */
  let draftWas = null;
  if (landed.applied.length) {
    const next = landed.catalog;
    delete next.hash; delete next.sig;
    next.hash = F.contentHash(next);
    draftWas = fs.readFileSync(p.draftAt, "utf8");
    writeWhole(p.draftAt, json(next));
    result.wrote.push(p.draftAt);
    result.catalog = next;
  }

  try {
  const log = readLog(dir);
  const at = opts.now ? String(opts.now) : new Date().toISOString();
  /* Read at the moment the decision is written, and not passed in by anybody: see the note at
     ACCOUNT_STATEMENT for why this is the machine's answer rather than a name somebody types. */
  const by = whoDecides();
  const entry = {
    at, by, from, note: String(opts.note || "").trim() || null,
    source: path.basename(opts.file), sourceSha256: sha256(opts.file),
    proposalHash: proposal.hash || null, proposalRev: proposal.rev == null ? null : proposal.rev,
    proposalEdition: proposal.date || null, modified: proposal.modified === true,
    /* WHICH CATALOG THE ACCEPTED CARDS CAME OUT OF, null where the file is this project's own
       (539). An acceptance record read a year later has to say where a card came from, and the
       file's name is not that: an inbox is a folder anybody can drop a renamed file into. */
    fromCatalog: origin.foreign ? origin.foreignId : origin.linked ? origin.linked.from : null,
    /* THE DESK WHOSE OWN FILE IT WAS, where it was one: what the decisions below are kept under. */
    ...(deskId ? { desk: deskId } : {}),
    /* THE ENGLISH SENTENCE, NOT THE FRAME: see the note at checkOrigin. */
    notes: origin.notes.map(n => n.message),
    accepted: accepted.map(c => c.key), rejected: rejected.map(c => c.key),
    pending: pending.map(c => c.key),
    applied: landed.applied, skipped: landed.skipped,
  };
  log.reviews.push(entry);
  const decided = new Map((log.decided || []).map(d => [(d.desk || "") + " " + d.key, d]));
  accepted.concat(rejected).forEach(c => decided.set((deskId || "") + " " + c.key, Object.assign({
    key: c.key, decision: acceptedKeys.has(c.key) ? "accept" : "reject",
    fingerprint: c.fingerprint, from, by, at, source: entry.source,
  }, deskId ? { desk: deskId } : {})));
  log.decided = Array.from(decided.values())
    .sort((a, b) => a.key.localeCompare(b.key) || String(a.desk || "").localeCompare(String(b.desk || "")));
  writeLog(dir, log);
  result.wrote.push(path.join(dir, REVIEW_LOG));
  result.entry = entry;
  return result;
  } catch (e) {
    /* The log refused the decision: the draft is put back as it was, so nothing of it has landed. */
    if (draftWas != null) writeWhole(p.draftAt, draftWas); /* plant:k-commit */
    throw e;
  }
}

/* A MODEL'S DRAFT ACCEPTED IN THE CARD (board 992, stage 4) is a decision like a row of this queue, and the audit pack has to
 * say it the same way: who accepted it, when, and where the words came from. So it is written as one review of the log,
 * every key accepted and applied (src/publish.mjs acceptanceRecord files a key by both), `from` naming the model and the
 * service and `note` whether the lead edited it first, and each key decided. `by` is read here, as reviewProposal reads it. */
function recordAccepted(dir, keys, from, note, source) {
  const home = path.resolve(String(dir || ""));
  const log = readLog(home);
  const at = new Date().toISOString(), by = whoDecides(), list = (keys || []).map(String);
  log.reviews.push({ at, by, from: String(from), note: note == null ? null : String(note), source: String(source),
    sourceSha256: null, proposalHash: null, proposalRev: null, proposalEdition: null, modified: false, fromCatalog: null,
    notes: [], accepted: list, rejected: [], pending: [], applied: list, skipped: [] });
  const decided = new Map((log.decided || []).map(d => [(d.desk || "") + " " + d.key, d]));
  list.forEach(key => decided.set(" " + key, { key, decision: "accept", fingerprint: null, from: String(from), by, at, source: String(source) }));
  log.decided = Array.from(decided.values())
    .sort((a, b) => a.key.localeCompare(b.key) || String(a.desk || "").localeCompare(String(b.desk || "")));
  writeLog(home, log);
  return { at, by };
}

/** Record that the lead kept a flagged card as it is ("Leave as it is"), settling its waiting flags without storing any desk note. */
function recordFlagKept(dir, cardId, fList, desks) {
  const home = path.resolve(String(dir || ""));
  const log = readLog(home);
  const at = new Date().toISOString(), by = whoDecides();
  const from = Array.isArray(desks) && desks.length ? desks.slice().sort().join(", ") : "flag";
  log.reviews.push({ at, by, from, note: null, source: "flag",
    sourceSha256: null, proposalHash: null, proposalRev: null, proposalEdition: null, modified: false, fromCatalog: null,
    notes: [], accepted: [], rejected: [], pending: [], applied: [], skipped: [],
    flagKept: { card: String(cardId), f: (fList || []).slice() } });
  writeLog(home, log);
  return { at, by };
}

export { REVIEW_LOG, LOG_KIND, DECIDED, DESKS, deskLabel, deskFilesIn, deskOf, openedDeskFile, teamKeyOf, putAway, unknownHeadKeys, besideOf, recordAccepted, recordFlagKept,
         NEVER, ACCOUNT_STATEMENT, whoDecides, keyFor, parseKey,
         fingerprint, checkOrigin, importedAs, proposalChanges, baseOf, classify, marksBeside,
         attachMarks,
         changeLine, applyChanges, setPath, insertNear, readLog, writeLog, decidedBefore,
         acceptancesSince, markPublished,
         parseDecisions, globToRe, resolveDecisions, reviewProposal, sha256, json, clone };
