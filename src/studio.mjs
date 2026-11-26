/* WHAT THE SCREENS ASK THE DISK FOR. One module, called only from shell/main.js, and every
 * function here is a whole verb the authoring screen performs: list the projects, open one,
 * save a card, lint, plan a publish, publish. The page never names a path of its own.
 *
 * IT RE-IMPLEMENTS NOTHING THE ENGINE HAS. The hash, the canonical form, the ids and the lint
 * all arrive through src/engine.mjs, the one door to the pin, and publishing is src/publish.mjs
 * unchanged - the screen's Publish and `node tools/publish.mjs` call the same function with the
 * same arguments, which is what makes "publish from the screen equals publish from the command
 * line" a thing a test can assert byte for byte rather than a thing this file promises.
 *
 * A PROJECT IS A FOLDER, and the folder is the customer's, not Studio's: project.json beside
 * the draft, an `archive` folder of editions, and the notes inside each edition. Studio keeps
 * nothing about a catalog in its own settings, so a project copied to another machine is whole.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import * as Engine from "./engine.mjs";
import { importCsv, writeImport, awaitingCards, NO_PRIMARY } from "./import.mjs";
import { pasteCsv, PASTE_NAME, pasteAccount, isPasteFile, pasteFileIn } from "./paste.mjs";
import { attempt, looksLikeZip } from "./source.mjs";
import { FIELDS, mapHeaders } from "./mapping.mjs";
import { translate, unknownTokens, tokensMet, untold } from "./placeholders.mjs";
import { lintSaid } from "./lint-said.mjs";
import { likelyCommitment } from "./commitment.mjs";
import { cardNumbers, syncChangedWatches, changedNumberRows, dismissWatches } from "./numbers.mjs";
import { newCardId, findRows, replaceRows, unknownIds, retireMany, moveMany, deleteMany } from "./bulk.mjs";
import { patchFromSheet, sheetDiff } from "./sheet.mjs";
import { exportCsv } from "./export-csv.mjs";
import { reviewProposal, putAway, unknownHeadKeys, readLog, besideOf, deskOf, openedDeskFile, deskLabel, deskFilesIn, DECIDED, DESKS, REVIEW_LOG, teamKeyOf, recordAccepted } from "./review.mjs";
import * as Drafts from "./model-drafts.mjs";
/* THE MARKS ARE src/import-text.mjs's AND SO IS THE ARITHMETIC ON THEM. This module cuts a
   body at them and puts one back; neither operation is written twice. */
import { markSegments, revertMark, writeTextImport, knownFiling, importPieceCount } from "./import-text.mjs";
import { decode, cellText } from "./csv.mjs";
import { diffCatalogs, diffLines, diffRows, summary,
         readCatalogDocument, catalogFromText } from "./diff.mjs";
import { auditFor, writePack } from "./audit.mjs";
import { readKeyFile, defaultKeyFile, keyIdFor, unlockKey, pairOf, passphraseFile, openLeadBox, statsKeysOf, signCatalog, signatureHolds, ensureLeadBox, keepLeadBox, recoverySecret } from "./sign.mjs";
import { openLeadBook, sealLeadBook } from "./lead-book.mjs";
import { readTeam, heldTeam, heldCopy, newTeam, withSealed, withCatalog, withoutCatalog, withExportsSealed, withSharing, withSignin, withChannel, withHandover, writeTeam, teamPath, newEpoch, withRecovery, openRecovery, recoveryOf,
  rosterName, revsFile, conflictSiblingName, revFloor, raiseRevFloor, forkRevFloor } from "./team.mjs";
import { HEAD_NAME, headOf, headGone, editionsLed } from "./relay.mjs";
import { RING_KIND, RING_FORMAT, readRingFile, ringPath, addToRing, entryFor } from "./ring.mjs";
import { listJoins, refuseJoin, admitWaiting, inviteSightings, closeRequest, seatAsked } from "./join.mjs";
import { endInvite, invitesOf, liveInvitesOf, relayInvitesOf, markRelayInvite, markRemoved, clearKeyPending, teamsFile, folderHere, placeFor, askedOf, noteFirstSeen, noticesOf, noteTried, clearTried,
  MAX_TEAMS, MAX_TEAMMATES, REFUSAL_TEAMMATES_LIMIT, REFUSAL_TEAMS_LIMIT, REFUSAL_TEAMS_UNREADABLE, studioTeammates, keptTeam, teamHeldBy, endTeam } from "./team-store.mjs";
import { hintOf, readSeat, checkSeat } from "./desk-seat.mjs";
import { removedHeld, deskSnapshot } from "./removed.mjs";
import { FLAGS_FILE, validateDeskFlags, deskAllowedForFlags, readFlagStore, settledSetOf, unsettledDeskFlags, aggregateWaitingFlags,
  flagsInReviewCount, flagsWaiting, flagKeep, flagsAnswered } from "./flags.mjs";
import { defaultLicenceFile, readLicenceFile, licenceState, localDay } from "./licence.mjs";
import { seatHolds } from "./publish.mjs";
import { readStatsAll, readSpan, writeSpan, rowOf, HEAD, refusalLines, viewsOf,
         viewBlocks, spanKept, spanCounted, spanTrackOf, spanPresetRows, ymd } from "./stats.mjs";
import { writeStatsBook } from "./stats-book.mjs";
import { readAllTeams } from "./team-reader.mjs";
import * as Link from "./link.mjs";
/* EVERY REFUSAL A PERSON CAN MEET AT A SCREEN GOES THROUGH refuse(), which keeps the English as
   the Error's message and carries the frame and its variables beside it so the page can say the
   same thing in Polish (board 523). A plain `throw new Error` below is deliberate and means one
   of two things: the sentence names a flag or a tool and can only come from a command line, or
   it reports a fault in this program rather than in what a person did. See src/refusal.mjs. */
import { refuse, refusalOf, noteOf, counted, say } from "./refusal.mjs";
import { ENGINE_FLOOR, minEngineFor, versionBelow, versionParts } from "./engine-floor.mjs";
import { readJson } from "./plain-json.mjs";
/* DATE MODIFIED (board 982): a card's or a tag's date is written at publish and is never a change, so every comparison of
   the draft with an edition here goes through sameOf, which leaves it out (src/dated.mjs). */
import { CHANGES_FILE, DATE_KEY, sameOf, standing, undated, undatedDoc } from "./dated.mjs";
import { findingKey, cardHash, findingsLeftOf, withoutLeft, withLeft } from "./findings-left.mjs";
import { writeWhole, renamePatiently, OWNER_ONLY } from "./whole-write.cjs";
import { cloudOf, onSystemDisk } from "./where.cjs";
import {
  publishFull, signedEarlier, carryEdition, readProject, editionsIn, archivedCatalog, lintOf, awaitingOf, stampEdition, editionRules,
  viewInput,
  json, primaryOf, fileSlug, suggestFileName, fixedName, projectName, holdsId, EMPTY_SLUG_REFUSAL,
  DEVICE_NAME,
  PROJECT_FILE, DRAFT_FILE, plainName, ARCHIVE, CATALOG_IN_ARCHIVE, NOTES_IN_ARCHIVE, REPORT_IN_ARCHIVE,
} from "./publish.mjs";

/* TWO ACTS MINT AN ID FROM WORDS AND BOTH REFUSE IN THE SAME WORDS, so the frame is named once: a
   frame is the key of the page's table, and two copies of one sentence would be two keys the
   copywriter has to keep in step by hand. */
/* A WINDOWS DEVICE NAME IS NO FOLDER THE DESKTOP'S OWN TOOLS CAN OPEN: PowerShell and backup
   tools read `con` as the console, in any case. The folder alone takes a suffix (DEVICE_NAME is
   src/publish.mjs's, which names files by the same rule). */
function projectDir(root, stem) {
  return path.join(root, DEVICE_NAME.test(stem) ? stem + "-project" : stem);
}

/* A NEW CATALOG'S ID IS RANDOM, made once at creation and kept by every edition, never derived
   from its name, since an id minted from a name freezes that name. THE FOLDER IS NAMED BY THE
   RULE THE ENGINE NAMES A CATALOG'S FILE BY, from the name typed, which project.json keeps as typed. */
function newCatalogId(F) {
  const id = crypto.randomUUID();
  if (!F.idOk(id)) throw new Error("a random catalog id failed the format's id rule: " + id);
  return id;
}
function newProjectDir(root, name) {
  return projectDir(root, Engine.fileStem()(name));
}

const ID_REFUSAL = "{TEXT} gives the id {ID}, which the format refuses: an id is 3 to 64"
  + " characters of a to z, 0 to 9 and the hyphen";

/* THE FOUR A PERSON MEETS WHEN THEY DECLARE A LANGUAGE (board 579), named here for the reason
   above: two of them are raised from both the new-project path and the settings screen, and two
   copies of one sentence would be two keys the copywriter has to keep in step by hand. Each
   puts its counted nouns at the head of a clause, behind a colon, because a counted phrase in
   Polish is nominative and can stand nowhere else. */
const LANG_CODE_REFUSAL = "{CODE} is not a language code: a code is two or three letters,"
  + " as en and pl are";
const LANG_TWICE_REFUSAL = "this catalog already declares {CODE}";
const LANG_NONE_REFUSAL = "a catalog speaks at least one language, and none was declared";
const LANG_LAST_REFUSAL = "{CODE} is the only language this catalog declares, and a catalog"
  + " speaks at least one";
/* words: placeholder. "Cards pinned to it: {PINS}." is new in both sentences; the rest is unchanged. */
const LANG_GOING_REFUSAL = "removing {CODE} discards its text and nothing else holds a copy:"
  + " {CARDS}, {INTENTS}, {CATS}. Cards pinned to it: {PINS}. Ask again to remove it.";
/* Said only when an archived edition still holds text in this language,
   so the sentence above would be false. */
const LANG_GOING_HELD_REFUSAL = "removing {CODE} discards its text from the draft: {CARDS},"
  + " {INTENTS}, {CATS}. Cards pinned to it: {PINS}. A published edition keeps a copy, and the"
  + " removal can be undone from Changes. Ask again to remove it.";
const LANG_PRIMARY_REFUSAL = "every card must carry the primary language, and some have no {CODE}"
  + " text: {CARDS}. Ask again to make it the primary.";


/* A PROJECT FILE THAT WILL NOT PARSE IS SAID TO BE DAMAGED, BY NAME, AND LEFT AS IT IS (sense pass
   2, finding 8): the parser's own sentence named neither the file nor a way on, and the list
   dropped the project without a word. A fault of the disk itself is rethrown for the shell. */
function readOrRefuse(at, seen) {
  try {
    if (!seen) return readJson(at);
    /* The bytes are read once and parsed from that one read, so that what a verb changes and what it later swears it read are the same file. */
    const raw = fs.readFileSync(at);
    const doc = JSON.parse(raw.toString("utf8").replace(/^\uFEFF/, ""));
    seen.raw = raw;
    return doc;
  } catch (e) {
    if (e && typeof e.code === "string") throw e;
    const home = path.dirname(at);
    if (editionsIn(home).length) throw refuse("{FILE} is damaged and cannot be read, so this catalog"
      + " cannot open. Studio has left the file as it is; every"
      + " published rev is kept whole in {ARCHIVE}.", { FILE: at, ARCHIVE: path.join(home, ARCHIVE) });
    throw refuse("{FILE} is damaged and cannot be read, so this catalog cannot open. Studio"
      + " has left the file as it is.", { FILE: at });
  }
}

/* A SAVE THAT FOUND THE DRAFT CHANGED UNDER IT READS IT AGAIN AND REDOES ITS CHANGE ON WHAT IS THERE. Two Studios on one projects
   root (src/whole-write.cjs says how a write finds out) take turns this way and neither reverts the other. It is asked again
   a dozen times, a little apart and by chance, so that two writers do not meet at the same moment for ever; a draft that
   still is not free, or another Studio's lock that will not let go, is a refusal marked as the disk's, so the page keeps the
   edit and sends it with the next save and at the close. The sentence is the engineer's, a placeholder for the copywriter. */
const STALE_TRIES = 12;
async function unlessStale(dir, once) {
  const home = path.resolve(dir);
  const busy = () => Object.assign(refuse("Another copy of Studio is saving this catalog at the same moment, in {DIR}, so this change is not written yet."
    + " Nothing is lost: it stays here and is written with the next change, or on leaving this catalog.", { DIR: home }), { disk: true });
  for (let i = 1; ; i++) {
    try { return await once(); }
    catch (e) {
      if (!(e && (e.stale || e.locked || e.stuck))) throw e;
      if (e.stuck) throw Object.assign(refuse("Studio could not remove the folder {LOCK}, left behind by a copy of Studio that stopped while saving, so this change is not written yet."
        + " Nothing is lost: it stays here, and once that folder is deleted, it is written with the next change or on leaving this catalog.", { LOCK: e.stuck }), { disk: true });
      if (e.locked || i >= STALE_TRIES) throw busy(); /* plant:esv-retry */
      await new Promise((r) => setTimeout(r, 1 + Math.floor(Math.random() * 15)));
    }
  }
}

/* ---- the projects in a folder ---------------------------------------------------------------
 *
 * A PROJECT IS RECOGNISED BY ITS DRAFT, not by its name. An immediate subfolder is a project if
 * it holds project.json, or a single `<stem>.draft.json`, which is what `node tools/import.mjs`
 * leaves behind. The second form has no project.json until somebody opens it: listing a folder
 * is a read, and a program that writes into a folder merely because it was looked at is a
 * program nobody can point at a share.
 */
function draftsIn(dir) {
  try { return fs.readdirSync(dir).filter(n => /\.draft\.json$/i.test(n)); }
  catch { return []; }
}

function projectAt(dir) {
  const at = path.join(dir, PROJECT_FILE);
  let p, has = true;
  try { p = readOrRefuse(at); }
  catch (e) { if (!e || (e.code !== "ENOENT" && e.code !== "ENOTDIR")) throw e; has = false; }
  if (has) {
    const draftName = p.draft || DRAFT_FILE;
    /* A DRAFT NAME IS ONE PLAIN SEGMENT, a file in this folder. project.json is joined to the folder as a path, so a name that goes up
       (`..\South lamps\draft.json`) made every save and open here write and read another project's draft (the editing review of
       2026-11-22). Nothing in Studio writes such a name; this is for a project.json edited or damaged by hand, which is not a catalog. */
    if (!plainName(draftName)) return null; /* plant:esv-draft-name */
    if (!fs.existsSync(path.join(dir, draftName))) return null;
    return { project: p, draftName, born: false };
  }
  const found = draftsIn(dir);
  if (found.length !== 1) return null;           /* none, or two, and Studio will not guess */
  const draft = readOrRefuse(path.join(dir, found[0]));
  return {
    project: {
      id: draft.id || "",
      rev: Number.isFinite(+draft.rev) ? +draft.rev : 0, edition: draft.date || "",
      draft: found[0], folder: null,
    },
    draftName: found[0], born: true,
  };
}

/* The counts the rail and the project list show, each by one rule, stated here because a number
   on a screen whose rule is not written down is an impression. Cards: entries in `cards`.
   Intents: tags of kind `request`. Categories: tags of kind `shelf`. These are the draft's, as
   written. The published file is counted by the desk's own rule instead (src/publish.mjs, the
   pinned shell's ecCounts), which agrees on all three but where no request has a clause in the
   primary language: the desk then counts no intents, because it offers none. */
function countsOf(draft) {
  const tags = draft.tags || [];
  return {
    cards: (draft.cards || []).length,
    intents: tags.filter(t => t.kind === "request").length,
    cats: tags.filter(t => t.kind === "shelf").length,
  };
}

/* ---- the languages a catalog declares (board 579) ----------------------------------------
 *
 * TWO SETS, AND CONFUSING THEM IS THE FAULT THIS SECTION EXISTS TO PREVENT (decision A1.3 of
 * 2026-09-11). A catalog DECLARES a language; a build of the engine HAS SOMETHING OF ITS OWN for
 * one. The declared set is open and is the manager's to choose; the engine's is closed and is
 * the pin's, and `Engine.langSupport()` reads it from the pin rather than from a copy here.
 *
 * AND WHAT THE ENGINE DOES WITH A LANGUAGE OUTSIDE ITS OWN SET DEPENDS ON WHICH PIN IS IN PLACE,
 * so it is read rather than assumed. Before board 646 it was a REFUSAL: `v2LangProblems` pushed
 * "langs: this build has no columns for de, it reads en and pl" into the errors, the reader
 * refused such a catalog outright and `publishFull` refused to write one without an override
 * note. Since 646 the column is derived from the code and nothing is refused for being unknown;
 * what is closed is the grammar alone. `readable` is therefore the pin's answer and not a
 * constant, and `grammared` is the other question, asked separately.
 *
 * THE COUNTS ARE COMPUTED ONCE, HERE, and travel with every verb that touches the draft. The
 * screen shows them on every row and the removal spends them in its warning; two
 * implementations of one count is how a warning comes to say a number the act then disproves.
 */
const LANG_CODE = /^[a-z]{2,3}$/;

/* THE OLDEST DESK A CATALOG THIS STUDIO WRITES ASKS FOR, stamped into every new draft as `minEngine` and
   said by the About's "Publishes for" row, which reads it from here through the host rather than typing it
   again (tests/studio-about.mjs holds every literal `minEngine` under src/ to this one). */
const MIN_ENGINE = ENGINE_FLOOR;

/** Is there text under this code in this map? An empty string is no text, as it is everywhere
 *  else in this program: a field emptied on purpose is a field with nothing in it. */
const inLang = (o, code) => !!String(((o || {})[code]) || "").trim();

/** What one declared language holds, field by field, so that a warning can spend the same
 *  numbers the removal will. `cards` is cards with ANY text in it, which is what the row says;
 *  the field counts are what the removal block itemises. `pins` is cards whose language pin is
 *  this language: the removal clears each, and the confirmation counts them. */
function langUses(draft, code) {
  const cards = draft.cards || [], tags = draft.tags || [];
  const titles = cards.filter(c => inLang(c.title, code)).length;
  const bodies = cards.filter(c => inLang(c.body, code)).length;
  const notes = cards.filter(c => inLang(c.note, code)).length;
  /* An intent counts where any of its three texts is in the language, since removeLang takes all three (the test
     architect's F2): one whose Polish is only its topic or its comment action loses words too. */
  const intents = tags.filter(t => t.kind === "request"
    && (inLang(t.clause, code) || inLang(t.topic, code) || inLang(t.action, code))).length; /* plant:f2-uses */
  const cats = tags.filter(t => t.kind === "shelf" && inLang(t.label, code)).length;
  /* The same predicate the clearing uses, so the confirmation cannot name a number the act then disproves. */
  const pins = cards.filter(c => c.lockLang === code).length; /* plant:f2-pins */
  return {
    code,
    cards: cards.filter(c => inLang(c.title, code) || inLang(c.body, code)
                             || inLang(c.note, code)).length,
    titles, bodies, notes, intents, cats, pins,
    greet: !!(draft.greet && draft.greet[code]),
    stop: !!(draft.stop && draft.stop[code]),
    total: titles + bodies + notes + intents + cats,
  };
}

/** Cards a language could not be the primary of: no title or no body in it. */
function langLacking(draft, code) {
  return (draft.cards || []).filter(c => !inLang(c.title, code) || !inLang(c.body, code)).length;
}

/** Languages an archived edition still holds text in. "No other copy" is true only when this
 *  set does not contain the code: the archive is a copy of what was published. */
function langsHeldInArchive(home) {
  const held = new Set();
  const eds = editionsIn(home);
  for (const ed of eds) {
    let cat = null;
    try { cat = archivedCatalog(home, ed); } catch { cat = null; }
    if (!cat) continue;
    for (const l of cat.langs || []) {
      if (!l || !l.code || held.has(l.code)) continue;
      const u = langUses(cat, l.code);
      if (u.total > 0 || u.greet || u.stop) held.add(l.code);
    }
  }
  return held;
}

/** Every declared language with its counts, the totals it is counted against, and whether the
 *  pinned engine can read it at all. One call per verb, never one per row. `home` is the project
 *  directory when the caller has one, so each row can say whether an edition still holds that
 *  language; without it, `held` is false. */
function langState(draft, home) {
  const declared = (draft.langs || []).filter(l => l && l.code);
  const held = home ? langsHeldInArchive(home) : new Set();
  const support = Engine.langSupport();
  const builtIn = support.grammar;
  const endonyms = Engine.langEndonyms();
  return {
    builtIn,
    /* WHETHER THIS PIN REFUSES A CODE OF ITS OWN ACCORD. False since board 646, and the screen's
       hard sentence hangs on it: on a pin that carries a catalog whatever it declares, telling
       somebody their desk will refuse it would be a lie. */
    refusesOthers: support.refusesOthers,
    /* THE CODES THE ENGINE HAS OF ITS OWN, COMMA-SEPARATED AND NOT "en and pl": the list goes
       into a sentence that is also spoken in Polish, and an English conjunction inside it would
       be a word nobody translated. */
    reads: builtIn.join(", "),
    commentLang: draft.commentLang || "",
    of: countsOf(draft),
    rows: declared.map((l, i) => Object.assign(langUses(draft, l.code), {
      /* THE NAME IS THE ENGINE'S ENDONYM WHERE IT HAS ONE and the declared label otherwise,
         which is the order the engine itself uses: `langEndonym` falls back to the code's own
         capitals, and the label a person wrote is a better answer than that. */
      name: endonyms[l.code] || String(l.label || "").trim() || String(l.code).toUpperCase(),
      label: l.label || "",
      primary: i === 0,
      /* TWO QUESTIONS, NOT ONE. Whether a desk built from this pin will READ the catalog at all,
         and whether the engine has grammar of its own for the language. They were one answer
         while the storage was closed with the grammar; since board 646 they part. */
      readable: !support.refusesOthers || builtIn.indexOf(l.code) >= 0,
      grammared: builtIn.indexOf(l.code) >= 0,
      held: held.has(l.code),
    })),
  };
}

function lastPublishOf(dir) {
  const eds = editionsIn(dir);
  if (!eds.length) return null;
  const last = eds[eds.length - 1];
  const at = path.join(dir, ARCHIVE, last, REPORT_IN_ARCHIVE);
  /* The report carries no timestamp on purpose: two publishes of one project must give the same
     bytes, and a clock inside the record is the usual way that stops being true. So the WHEN is
     the project's own, written by publishProject below, and the edition is the archive's. */
  return { edition: last, editions: eds.length, hasReport: fs.existsSync(at) };
}

function linkedRow(project) {
  const link = project && project.linked;
  if (!link || typeof link !== "object" || !link.from) return null;
  return { from: String(link.from), team: link.team ? String(link.team) : null };
}

function listProjects(root, o) {
  const out = [];
  let names = [];
  try { names = fs.readdirSync(root); } catch { return { root, made: false, projects: out }; }
  for (const n of names.sort()) {
    const dir = path.join(root, n);
    let stat = null;
    try { stat = fs.statSync(dir); } catch { continue; }
    if (!stat.isDirectory()) continue;
    /* A PROJECT WHOSE FILES WILL NOT READ KEEPS ITS ROW, naming the file, and its Open says why
       (readOrRefuse); a folder that is not a project is still passed over in silence. */
    let found = null, unreadable = null, draft = null;
    try { found = projectAt(dir); }
    catch (e) { unreadable = e && e.said ? String(e.said.vars.FILE) : path.join(dir, PROJECT_FILE); }
    if (!found && !unreadable) continue;
    if (found) {
      try { draft = readOrRefuse(path.join(dir, found.draftName)); }
      catch (e) { unreadable = path.join(dir, found.draftName); }
    }
    const last = lastPublishOf(dir);
    if (unreadable) {
      out.push({ dir, id: "", name: n, fileName: null, rev: 0, edition: "",
        counts: { cards: 0, intents: 0, cats: 0 }, lastEdition: last ? last.edition : "",
        folder: folderHere(found && found.project, o) || null,
        published: (found && found.project.published) || null, requested: null, opened: null,
        away: false, editions: last ? last.editions : 0, unreadable,
        langs: [], edited: null, changes: null });
      continue;
    }
    out.push({
      dir, id: found.project.id, name: projectName(dir, found.project),
      fileName: fixedName(dir, found.project, String(draft.id || found.project.id)),
      rev: found.project.rev || 0,
      edition: found.project.edition || "",
      counts: countsOf(draft),
      langs: (Array.isArray(draft.langs) ? draft.langs : []).map((l) => l && l.code).filter(Boolean),
      edited: found.project.edited || null,
      /* An empty journal is already 0. A journal with entries is filled after the table shows. */
      changes: changesListed(dir),
      /* The revision is the project's own counter and the EDITION is what the file on a desk
         calls itself, so a row saying rev 14 says nothing a person can hold against the copy
         in front of them. It comes off the archive rather than off project.json, because the
         archive is what was actually written. */
      lastEdition: last ? last.edition : "",
      folder: folderHere(found.project, o) || null,
      published: found.project.published || null,
      /* WHEN THE DESKS WERE LAST ASKED, and null before they ever were: the channel draft's own
         rule for the desk's sync row (7.2) is that a row reading "never" opens on what is
         missing, and the list obeys it by leaving the cell empty. */
      requested: found.project.requested || null,
      opened: found.project.opened || null,
      away: !!found.project.away,
      editions: last ? last.editions : 0,
      linked: linkedRow(found.project),
    });
  }
  return { root, projects: out };
}

/* ---- the projects open in tabs -------------------------------------------------------------- */

/* THE BAND'S OPEN PROJECTS AS STUDIO'S STORE KEEPS THEM: folders, the name and rev each tab last
   showed, and the one on screen ("" for the list). Only strings and numbers cross, and only so many. */
const TABS_KEPT = 64;
function keptTabs(v) {
  const o = (v && typeof v === "object") ? v : {};
  const seen = new Set(), open = [];
  for (const t of Array.isArray(o.open) ? o.open : []) {
    const dir = t && typeof t.dir === "string" ? t.dir : "";
    if (!dir || !path.isAbsolute(dir) || seen.has(dir) || open.length >= TABS_KEPT) continue;
    seen.add(dir);
    open.push({ dir, name: String(t.name == null ? "" : t.name).slice(0, 200), rev: Number(t.rev) | 0 });
  }
  const on = typeof o.on === "string" && seen.has(o.on) ? o.on : "";
  return { open, on };
}

/* WHICH OF THEM COME BACK AT A LAUNCH. A folder that holds no project now is left out; one whose
   parent cannot be read, a share that is down, is held `away` rather than dropped, and the page
   keeps it in what it writes so that the launch that reaches the share again opens it. */
function openTabs(kept) {
  const k = keptTabs(kept);
  const open = [], away = [];
  for (const t of k.open) {
    if (!fs.existsSync(path.dirname(t.dir))) { away.push(t); continue; }
    let found = null;
    try { found = projectAt(t.dir); } catch { found = true; }    /* unreadable: its open says why */
    if (found) open.push(t);
  }
  return { open, away, on: open.some((t) => t.dir === k.on) ? k.on : "" };
}

/* ---- opening one ---------------------------------------------------------------------------- */

function writeProject(dir, project) {
  writeWhole(path.join(dir, PROJECT_FILE), json(project));
}

/* WHAT A DRAFT IS AWAITING, AND WHICH CARDS - THE ONE DOOR TO IT IN THIS FILE (board 548).
 *
 * The state was reachable from the publish cover alone: `publishPlan` asked the classifier and
 * `openProject` did not, so the cards table, the card editor and the lint list could not say
 * anything about it and the rail counted two findings while eight cards waited. Three readers
 * ask this now - the open, the save and the cover - so a screen and the cover it opens cannot
 * come to different views of one draft.
 *
 * OVER withHash() RATHER THAN OVER THE DRAFT AS IT LIES, for the reason findings() gives: the
 * probe inside the classifier recomputes the hash, so a stale hash on the base would look like
 * a finding the absent language had caused and inflate the count by one.
 *
 * `ids` IS null WHERE THE ENGINE COULD NOT BE ASKED which cards, and the count still stands;
 * src/import.mjs says at length when that happens and why silence is the right failure.
 */
async function awaitingFor(draft) {
  const doc = withHash(draft);
  const F = await Engine.format();
  FORMAT = F;
  const found = awaitingOf(doc, lintOf(doc), F.contentHash);
  const { lintCatalog } = Engine.lint();
  const byCard = awaitingCards(doc, found.rows, lintCatalog);
  return {
    classed: found.classed,
    rows: found.rows.map(a => ({ lang: a.lang, cards: a.cards,
                                 ids: byCard[a.lang] || null, said: a.sample || "" })),
  };
}

/** Everything the authoring screen needs for one project, in one answer: a second round trip
 *  per section would let the draft on the screen and the draft on the disk drift apart. */
async function openProject(dir, o) {
  const home = path.resolve(dir);
  const found = projectAt(home);
  if (!found) throw refuse("{DIR} holds no catalog: a catalog folder holds project.json, or the"
    + " one draft an import wrote", { DIR: home }, "no catalog in {DIR}; a catalog folder holds"
    + " project.json, or one <id>.draft.json that node tools/import.mjs wrote");
  const draft = readOrRefuse(path.join(home, found.draftName));
  const project = Object.assign({}, found.project, { draft: found.draftName });
  /* THE OPEN IS THE FIRST WRITE, never the list; but a Studio out of sight (the tray, or a start with Windows) opens what its page restores
     without writing, so that it writes nothing into a folder it holds no hold on (shell/main.js, the hold). */
  if (!(o && o.noStamp)) {
    project.opened = new Date().toISOString();
    writeProject(home, project);
  }
  const awaits = await awaitingFor(draft);
  const shown = Object.assign({}, project);
  const here = folderHere(shown, o);
  if (here) shown.folder = here;
  const env = (o && o.env) || process.env;
  const cloud = cloudOf(home, env); /* plant:c9-cloud-of */
  if (cloud) shown.cloud = cloud;
  return {
    dir: home, name: projectName(home, project),
    fileName: fixedName(home, project, String(draft.id || project.id)), project: shown, draft,
    cloud,
    counts: countsOf(draft),
    langs: langState(draft, home),
    editions: editionsIn(home),
    lint: findings(draft, awaits.classed, awaits.rows, project.notPromises, project.endsMeant, project.findingsLeft, project.changedNumbers),
    awaiting: awaits.rows,
    tokens: Engine.cardTokens().tokens,
    likely: likelyAll(draft, project.notPromises),
    looks: looksOf(draft),
    /* The icons and the colours a category's fields offer (board 1018, piece A; src/engine.mjs catLooks), and the forms a
       card's own address may take (piece B). */
    offered: Object.assign({}, (LOOKS || (LOOKS = Engine.catLooks())).offered, { address: Engine.addressForms() }),
    changes: await changesCount(home),
    /* A LINKED COPY'S LINK, null on any other catalog: what the details screen's sign and press read (src/link.mjs). A copy
       taken from a followed team's catalog is read against o.followed, which the shell hands over. */
    linked: Link.linkState(home, o),
  };
}

/** Each category's dress as a desk shows it (src/engine.mjs catLooks), by tag id: `hue` and `icon`. */
let LOOKS = null;
function looksOf(draft) {
  if (!LOOKS) LOOKS = Engine.catLooks();
  const primary = primaryOf(draft), out = {};
  (draft.tags || []).filter(t => t && t.kind === "shelf").forEach((t, i) => {
    const l = t.label || {};
    out[t.id] = LOOKS.lookOf(t, i, l[primary] || Object.keys(l).map(k => l[k]).find(Boolean) || t.id);
  });
  return out;
}

/* A PROJECT IS BORN IN THE LANGUAGES IT IS GIVEN, and the pair below is a fallback rather than
 * a rule (board 579, Maxim 2026-09-19). It used to be `en` and `pl` written into the literal, so
 * a catalog for a Czech company began life declaring two languages nobody there wrote and the
 * only way out was a hand-edited file. What a caller passes nothing gets is the PINNED ENGINE'S
 * OWN built-in set, which is en and pl today and is what a desk built from this pin can actually
 * read: a project born with no declaration speaks what the thing that reads it speaks. */
async function newProject(root, name, langs, opts) {
  const clean = String(name || "").trim();
  if (!clean) throw refuse("a catalog needs a name");
  const declared = declaredFrom(langs, Engine.builtInLangs(), Engine.langEndonyms());
  const F = await Engine.format();
  const id = newCatalogId(F);
  const { named, dir } = claimProjectDir(root, clean, !!(opts && opts.numbered));
  const draft = {
    format: F.FORMAT, kind: F.KIND, id, rev: 0,
    langs: declared,
    /* THE COMMENT LANGUAGE IS A SEPARATE AXIS and its default is the primary rather than `en`:
       a catalog that declares de and cs has nowhere to put an English comment, and the engine
       does not refuse such a field, it IGNORES it (`setCommentLang`, content-model.js at the
       pin: "A code this catalog does not speak is ignored"), which is worse, because the
       manager's choice then disappears without a word. */
    commentLang: declared[0].code, tags: [], cards: [], minEngine: MIN_ENGINE,
  };
  draft.hash = F.contentHash(draft);
  const text = json(draft);
  fs.writeFileSync(path.join(dir, DRAFT_FILE), text, "utf8");
  /* `born` marks a project whose name nobody chose (the band's "+"), with its draft's bytes as made, for discardUntouched. */
  const born = opts && opts.numbered ? { born: { name: named, draft: sha256Text(text) } } : {};
  writeProject(dir, Object.assign({ id, rev: 0, edition: "", draft: DRAFT_FILE, folder: null, displayName: named }, born));
  return openProject(dir, opts);
}

const sha256Text = (t) => crypto.createHash("sha256").update(String(t), "utf8").digest("hex");

/* A "+" PROJECT NOBODY TOUCHED GOES WHEN ITS TAB CLOSES (22a-A, "Remove it when its tab closes"). Untouched is exact:
   project.json as "+" wrote it but for the open's stamp, the draft byte for byte as made, and nothing else in the
   folder. Each file goes by name and the folder by a plain rmdir; where that fails, both files are written back. */
function discardUntouched(dir) {
  const home = path.resolve(String(dir || "")), keep = { removed: false };
  const draftAt = path.join(home, DRAFT_FILE), projectAt = path.join(home, PROJECT_FILE);
  let names, projectText, draftText, project, draft;
  try {
    names = fs.readdirSync(home).sort().join("|");
    projectText = fs.readFileSync(projectAt, "utf8"); draftText = fs.readFileSync(draftAt, "utf8");
    project = JSON.parse(projectText); draft = JSON.parse(draftText);
  } catch { return keep; }
  const born = project && typeof project === "object" ? project.born : null;
  if (names !== [DRAFT_FILE, PROJECT_FILE].sort().join("|") || !born || typeof born !== "object"
      || Object.keys(born).sort().join("|") !== "draft|name" || typeof born.name !== "string"
      || born.draft !== sha256Text(draftText) || newProjectDir(path.dirname(home), born.name) !== home) return keep;
  const want = { id: draft && draft.id, rev: 0, edition: "", draft: DRAFT_FILE, folder: null, displayName: born.name, born };
  const rest = Object.assign({}, project);
  delete rest.opened;
  if (Object.keys(rest).sort().join("|") !== Object.keys(want).sort().join("|")
      || Object.keys(want).some((k) => JSON.stringify(rest[k]) !== JSON.stringify(want[k]))) return keep;
  try {
    fs.unlinkSync(draftAt); fs.unlinkSync(projectAt); fs.rmdirSync(home);
  } catch {
    if (!fs.existsSync(draftAt)) fs.writeFileSync(draftAt, draftText, "utf8");
    if (!fs.existsSync(projectAt)) fs.writeFileSync(projectAt, projectText, "utf8");
    return keep;
  }
  return { removed: true };
}

/* A FOLDER THAT EXISTS IS NEVER WRITTEN INTO: the mkdir refuses it. `numbered` then takes the next
   free name on upgradeFacts' rule, "<name> 2" and on, which the tab band's "+" asks for; without
   it the name typed is refused as before. */
function claimProjectDir(root, name, numbered) {
  fs.mkdirSync(root, { recursive: true });
  for (let n = 1; n < 100; n++) {
    const named = n === 1 ? name : name + " " + n;
    const dir = newProjectDir(root, named);
    try { fs.mkdirSync(dir); return { named, dir }; }
    catch (e) {
      if (e.code !== "EEXIST") throw e;
      if (!numbered) throw refuse("there is already a folder at {DIR}", { DIR: dir });
    }
  }
  throw refuse("there is already a folder at {DIR}", { DIR: newProjectDir(root, name + " 99") });
}

/* ---- the lint list ---------------------------------------------------------------------------
 *
 * The verdict is the pinned engine's, whole and unedited: `lintOf` returns its own two lists of
 * sentences and Studio adds one rule, src/placeholders.mjs's unknownTokens, stricter than the
 * engine's warning about the same token, which it drops. What this does add is the one thing a list
 * on a screen needs and a line of text has not got, which is WHERE to go, and it gets it by
 * READING THE ENGINE'S OWN SENTENCE rather than by re-deriving the finding. Deriving it a second
 * time would mean a second linter, and the one thing worse than a lint with no jump is a jump
 * that lands on a card the lint was not talking about.
 *
 * THE PARSE IS DELIBERATELY TIMID, and every shape it knows is written out below. A sentence it
 * does not recognise keeps its whole text and gets NO Jump rather than a wrong one, so the day
 * the engine's wording moves at a pin bump the findings all still show with one fewer affordance.
 * tests/lint-jump.mjs drives one fixture per rule of the pinned linter through the screen and
 * reads back where each landed, so the table above cannot rot quietly.
 *
 * THE ENGINE NAMES A CARD TWO WAYS AND BOTH ARE HERE. Its runtime lint counts `card 7 ("Title")`
 * from 1 over `cards`, because the runtime shape has no ids to speak of; its FILE reader names
 * one `card c-tosan` by the id in the file, and the two sets of sentences arrive in the same
 * list. A `card 7` and a card whose id is a number cannot be confused, because an id is three
 * characters at least and starts a to z or 0 to 9 with a hyphen allowed after - digits alone
 * would have to be a three-digit number, which the index never is in a catalog of that size, so
 * the index form is tried first and the id form only on what it leaves.
 *
 * AN INTENT IS NAMED BY ITS POSITION and a category by its key, which IS the tag id
 * (catalog-v2.js: "The key the runtime uses IS the tag id"). So both resolve to a tag in the
 * draft, and the jump carries the tag's own id rather than the number the sentence used.
 */
const CARD_IX_AT = /^card (\d+)(?: \("([^]*?)"\))?: ([^]*)$/;
const CARD_ID_AT = /^card ([a-z0-9][a-z0-9-]{2,63})(?: \(([a-z]{2,3})\))?: ([^]*)$/;
const INTENT_AT = /^intent (\d+)(?: \("([^]*?)"\))? ([^]*)$/;
const TAG_AT = /^tag ([a-z0-9][a-z0-9-]{2,63}): ([^]*)$/;
const CAT_NAMED_AT = /names a category that does not exist: "([^"]*)"|^categoriesPl\["([^"]*)"\]/;
const FAV_AT = /^"fav" is a reserved category key/;
const COVERS_AT = new RegExp("^(?:categoriesPl|categories:([a-z]{2,3})) covers [0-9]+ of [0-9]+"
  + " categories; the rest fall back to [A-Z]{2,3}: (.+)$");

/* WHICH FIELD OF A CARD THE FINDING IS ABOUT, by the engine's own wording for it. The pairs are
   one per sentence the pinned linter and the pinned reader write about a card; anything else
   opens the card with nothing focused, which is still the right card. */
function fieldOf(tail, primary, code) {
  const t = String(tail);
  if (/^English \(en\) is required/.test(t)) return { field: "body", lang: "en" };
  if (/^Polish \(pl\) is required/.test(t)) return { field: "body", lang: "pl" };
  if (/^title \(t\) is required/.test(t) || /^same title as card /.test(t))
    return { field: "title", lang: primary };
  let m = /^no title in ([a-z]{2,3})/.exec(t);
  if (m) return { field: "title", lang: m[1] };
  m = /^no body in ([a-z]{2,3})/.exec(t);
  if (m) return { field: "body", lang: m[1] };
  if (/^shelf /.test(t) || /^unknown category/.test(t)) return { field: "shelf", lang: "" };
  if (/^requests names/.test(t) || /^intent link/.test(t)) return { field: "requests", lang: "" };
  if (/^Polish body puts a bare/.test(t)) return { field: "body", lang: "pl" };
  m = / in the ([A-Z]{2,3}) body is not a token the desk fills/.exec(t);
  if (m) return { field: "body", lang: m[1].toLowerCase() };
  if (/EN blocks vs/.test(t) || /^seq without alt/.test(t)) return { field: "body", lang: primary };
  if (code) return { field: "body", lang: code };
  return { field: "", lang: "" };
}

function whereTo(line, draft) {
  const s = String(line);
  const primary = primaryOf(draft);
  const cards = draft.cards || [];
  const tags = draft.tags || [];
  const card = (c, tail, code) => (c
    ? Object.assign({ section: "cards", id: c.id }, fieldOf(tail, primary, code)) : null);
  const tag = (t, field, lang) => (t
    ? { section: t.kind === "request" ? "intents" : "categories", id: t.id,
        field: field || "", lang: lang || "" } : null);

  let m = CARD_IX_AT.exec(s);
  if (m) return card(cards[(+m[1]) - 1], m[3], "");
  m = CARD_ID_AT.exec(s);
  if (m) return card(cards.find(c => c.id === m[1]), m[3], m[2] || "");
  m = INTENT_AT.exec(s);
  if (m) {
    const t = tags.filter(x => x.kind === "request")[+m[1]];
    /* THE CODE IS READ OUT OF "invisible in XX mode", which is the one half of this sentence
       both engines write. Before the engine's 646 the rule was Polish's alone and said "has no
       Polish clause"; since 646 it is written for every declared language past the primary and
       says "has no PL clause", so a test on the word Polish quietly sends the finding to the
       PRIMARY clause field - the right intent, the wrong language box, and nothing on the screen
       to say so. The trailing clause reads the same in both wordings and carries the code
       itself, so this is right on either side of that pin and right for a code neither engine
       has met. Caught at the pin move to 32af894 by tests/lint-jump.mjs leg 0a. */
    const code = /invisible in ([A-Za-z]{2,3}) mode/.exec(m[3]);
    return tag(t, "clause", code ? code[1].toLowerCase() : primary);
  }
  m = TAG_AT.exec(s);
  if (m) {
    const t = tags.find(x => x.id === m[1]);
    const lang = /no clause in ([a-z]{2,3})/.exec(m[2]);
    return tag(t, "clause", lang ? lang[1] : "");
  }
  m = CAT_NAMED_AT.exec(s);
  if (m) return tag(tags.find(x => x.id === (m[1] || m[2])), "label", primary);
  if (FAV_AT.test(s)) return tag(tags.find(x => x.id === "fav"), "label", primary);
  m = COVERS_AT.exec(s);
  if (m) return tag(tags.find(x => x.id === m[2].split(", ")[0]), "label", m[1] || "pl");
  return null;
}

/* The engine's line names the map by its field and each category by its key; the row says the
   language by its code and each category by its name in the primary language. `why` keeps the line. */
function coversSaid(said, draft, m) {
  if (!said) return said;
  const primary = primaryOf(draft);
  const names = m[2].split(", ").map(k => {
    const t = (draft.tags || []).find(x => x.id === k);
    return (t && t.label && t.label[primary]) || k;
  });
  return { frame: said.frame, vars: Object.assign({}, said.vars,
    { MAP: (m[1] || "pl").toUpperCase(), KEYS: names.join(", ") }) };
}

/* `classed` is the awaiting classifier's set of engine lines a language's absence accounts for
   (board 510), and `awaits` its findings. Both arrive from awaitingFor() above, and they are
   two halves of one answer: what the state takes out of the error list and what it puts back
   as a kind of its own.

   THE LIST SHOWS A THIRD KIND SINCE BOARD 544, and the rail's count is the rows a person can
   see. Maxim ruled it on 2026-09-19 over the drawing that kept the list to faults: a row under
   "What is wrong" does call the state a fault, and the answer to that is the row's own dashed
   pill rather than a second place to look. What the list must not do is count a thing it does
   not show, which is what it did while the cover said eight and the rail said two.

   AN AWAITING ROW NAMES NO CARD AND JUMPS NOWHERE. It is one finding about the catalog however
   many cards it covers, so `card` and `go` are null and the screen's own act is to filter the
   cards table to the ids beside it. `what` here is the English a command line prints; the page
   builds its own sentence from `lang` and `cards`, because a count in Polish is a counted noun
   and a sentence with one cannot be assembled from an English one. */
/* AN EMPTY REPLY IS DROPPED ON THE DESKS (Clément's read of studio-replies, C1): the pinned reader takes a bare unlabelled
   marker for no reply at all, so that language reads one reply fewer and every reply after it moves up a place, a step 1
   no Polish desk would send. The format's lint counts the marker, so it says nothing; this line says it, as an error. */
function emptyReplies(draft) {
  const out = [];
  (draft.cards || []).forEach((c, i) => {
    if (c.bodyShape !== "alts" && c.bodyShape !== "steps") return;
    for (const l of Object.keys(c.body || {})) {
      const blocks = String(c.body[l] || "").split(/\n\s*\n/).map(b => b.trim());
      const at = blocks.findIndex(b => b === "[alt]" || b === "[step]");
      if (at >= 0) out.push("card " + (i + 1) + ": reply " + (at + 1) + " is empty in " + l.toUpperCase()
        + ", so the desks skip it and every later reply moves up a place");
    }
  });
  return out;
}
function findings(draft, classed, awaits, dismissed, endsMeant, left, changedNumbers) {
  const held = classed || new Set();
  const all = lintOf(withHash(draft));
  const tokens = Engine.cardTokens().tokens;
  const r = { errors: all.errors.filter(e => !held.has(e))
    .concat(unknownTokens(draft, tokens, all.errors)).concat(emptyReplies(draft)),
    warnings: untold(all.warnings, tokensMet(draft, tokens, all.errors)) };
  const one = (line, severity) => {
    const go = whereTo(line, draft);
    const m = CARD_IX_AT.exec(String(line));
    /* A ROW ABOUT A CARD IS PLACED BY THE CARD'S TITLE, which is what the table shows; the
       reader's own sentences name it by id (sense pass item 25). */
    const named = go && go.section === "cards"
      ? (draft.cards || []).find(c => c.id === go.id) : null;
    const cov = COVERS_AT.exec(String(line));
    const said = cov ? coversSaid(lintSaid(String(line)), draft, cov)
      : lintSaid(m ? m[3] : String(line));
    return {
      severity,
      what: cov && said ? say(said.frame, said.vars) : m ? m[3] : String(line),
      /* The two sentences as frames where src/lint-said.mjs has one, for a Polish screen. */
      said,
      whySaid: m ? lintSaid(String(line)) : said,
      where: named ? cardTitle(draft, named) : (m ? (m[2] || "") : ""),
      /* Kept beside `go` because it is what the row has always carried and what says, in one
         field, whether this finding is about a card at all. */
      card: go && go.section === "cards" ? go.id : null,
      go,
      why: String(line),
    };
  };
  const waiting = (awaits || []).map(a => ({
    severity: "awaiting",
    lang: a.lang, cards: a.cards, ids: a.ids || null,
    what: "awaiting its " + String(a.lang).toUpperCase() + " text"
      + (a.cards == null ? "" : " on " + a.cards + " card(s)"),
    where: "", card: null, go: null,
    why: a.said || "",
  }));
  const suggested = suggestionsOf(draft, dismissed, endsMeant)
    .concat(changedNumberRows(draft, changedNumbers, cardTitle));
  /* A PATH'S END IS LISTED AND NOT COUNTED (paths-terminus-noise, the Studio batch of 2026-10-12): most paths are meant to
     end, so `suggestions` counts the likely commitments alone and `ends` the path ends the list still shows. */
  const ends = suggested.filter(s => s.kind === "ends").length;
  /* A FINDING LEFT AS IT IS (src/findings-left.mjs) is neither listed nor counted; `left` is project.json's findingsLeft. */
  const keep = leftOut(draft, left);
  /* A NUMBERS WARNING IS LEFT BY THE SAME RULE (Max, 2026-11-15: "Not every change requires corection in both languages"): its
     fingerprint is its own line of numbers, so it comes back when the numbers change, and, like any left finding, when its card does. */
  const numberWarns = keep(numbersWarnings(draft)); /* plant:left-numbers */
  const errors = keep(r.errors.map(l => one(l, "error"))), warnings = keep(r.warnings.map(l => one(l, "warning")));
  return {
    errors: errors.length, warnings: warnings.length + numberWarns.length, awaiting: waiting.length,
    suggestions: suggested.length - ends, ends,
    rows: errors.concat(warnings).concat(numberWarns).concat(waiting).concat(suggested),
  };
}

function numbersWarnings(draft) {
  const rawLangs = Array.isArray(draft && draft.langs) && draft.langs.length
    ? draft.langs : (Array.isArray(draft && draft.languages) ? draft.languages : []);
  const langs = rawLangs.length
    ? rawLangs.map((l) => (typeof l === "string" ? l : l && l.code)).filter(Boolean)
    : ["en"];
  const out = [];
  for (const c of (draft && draft.cards) || []) {
    if (!c || c.retired) continue;
    const res = cardNumbers(c, langs);
    if (!res.differ) continue;
    const why = res.languages
      .map((l) => l + ": " + (res.byLang[l] && res.byLang[l].length ? res.byLang[l].join(", ") : "none"))
      .join("; ");
    out.push({
      severity: "warning",
      kind: "numbers",
      byLang: res.byLang,
      languages: res.languages,
      what: "Numbers differ between languages",
      where: cardTitle(draft, c),
      card: c.id,
      go: { section: "cards", id: c.id, field: "body", lang: res.languages[0] || langs[0] || "en" },
      why,
    });
  }
  return out;
}

/** The filter findings() puts its error and warning rows through, for the draft as it is. */
function leftOut(draft, left) {
  const kept = findingsLeftOf({ findingsLeft: left });
  if (!FORMAT || !Object.keys(kept).length) return (rows) => rows;
  const F = FORMAT, hashes = new Map();
  const hashOf = (id) => {
    if (!hashes.has(id)) hashes.set(id, cardHash(F, undated((draft.cards || []).find(c => c && c.id === id) || null)));
    return hashes.get(id);
  };
  return (rows) => withoutLeft(rows, kept, (line) => findingKey(lintSaid(String(line)), line), hashOf);
}

/** The lead's "Leave as it is" for a finding about a card, kept in the project and never in the draft. `why` is the
 *  finding's own line, as its row carries it; a finding no longer there is not kept, and the answer carries the lint as it is. */
async function leaveFinding(dir, id, why, reason) {
  const home = path.resolve(dir);
  const found = projectAt(home);
  if (!found) throw refuse("no catalog in {DIR}", { DIR: home });
  const draft = readOrRefuse(path.join(home, found.draftName));
  const card = (draft.cards || []).find(c => c && c.id === id);
  if (!card) throw refuse(NO_CARD, { ID: JSON.stringify(id) });
  const awaits = await awaitingFor(draft);
  const p = found.project, key = findingKey(lintSaid(String(why)), String(why));
  const now = findings(draft, awaits.classed, awaits.rows, p.notPromises, p.endsMeant, p.findingsLeft, p.changedNumbers);
  const there = now.rows.some(r => (r.severity === "error" || r.severity === "warning") && r.card === id
    && findingKey(lintSaid(String(r.why)), r.why) === key);
  if (!there) return { id, left: false, lint: now };
  const kept = withLeft(findingsLeftOf(p), String(id), key, cardHash(FORMAT, undated(card)), reason);
  writeProject(home, Object.assign({}, p, { draft: found.draftName, findingsLeft: kept }));
  return { id, left: true, lint: findings(draft, awaits.classed, awaits.rows, p.notPromises, p.endsMeant, kept, p.changedNumbers) };
}

/* THE FOURTH KIND, A SUGGESTION (board 814, S3e), and it is Studio's own: the pinned engine's lint never writes one, so
   none of these comes through `one()` or the engine's sentences, and `errors` and `warnings` count exactly what they
   counted before. Two findings, in the copywriter's words (state/drafts/copy-chains-lint-2026-10-04.md, L1 to L7):
     - a likely commitment, src/commitment.mjs's reading through likelyOf(), so a ticked card and one dismissed for the
       same words have none here either, as they have none in the editor;
     - a path that ends: a card another card links to and that links to none, the editor's own rule (ui/app.js,
       nextHtml). A card nothing links to is on no path and gets nothing.
   A RETIRED CARD GETS NEITHER: no desk offers it, so nobody needs a decision about it; a retired card that links still
   counts as a card before it on the path, as it does in the editor, because its link comes back with it.
   A SUGGESTION NEVER HOLDS UP PUBLISHING: src/publish.mjs's verdict is the engine's alone and the cover's note is gated
   on `errors`. `what` and `why` are the English a command line prints; the page words its own row from `phrase`,
   `ruleKind` and `from`, in the order one card's rows sit together, as the cards table has them. */
const RULE_KIND_EN = { later: "a promise for later", dated: "a thing promised by a date", waived: "a charge waived",
  wording: "a promise in so many words", condition: "a promise on a condition", done: "an act reported as done" };

function suggestionsOf(draft, dismissed, endsMeant) {
  const cards = draft.cards || [];
  const linksTo = (x) => (Array.isArray(x.next) ? x.next : []).map(e => e && e.to).filter(t => typeof t === "string");
  const out = [];
  for (const c of cards) {
    if (!c || c.retired) continue;
    const where = cardTitle(draft, c);
    const lk = likelyOf(draft, c, dismissed);
    if (lk) out.push({
      severity: "suggestion", kind: "commitment",
      phrase: lk.phrase, rule: lk.rule, ruleKind: lk.kind, lang: lk.lang,
      what: "“" + lk.phrase + "” reads like a commitment",
      where, card: c.id, go: { section: "cards", id: c.id, field: "commits", lang: lk.lang },
      why: "recognised by: " + (RULE_KIND_EN[lk.kind] || lk.rule),
    });
    if (linksTo(c).length) continue;
    const before = cards.filter(x => x && x.id !== c.id && linksTo(x).indexOf(c.id) >= 0);
    if (!before.length || endCovered(endsMeant, c.id, before.map(x => x.id))) continue;
    const from = before.map(x => cardTitle(draft, x));
    out.push({
      severity: "suggestion", kind: "ends", from, fromIds: before.map(x => x.id),
      what: "terminus: nothing comes next on the path",
      where, card: c.id, go: { section: "cards", id: c.id, field: "next", lang: "" },
      why: "before it on the path: " + from.join(", "),
    });
  }
  return out;
}

/* THE PINNED FORMAT, kept by awaitingFor for findings(), which is synchronous and is called only after awaitingFor has
   answered; where it is not kept yet, no finding is left out. */
let FORMAT = null;

/* THE LINT JUDGES A DOCUMENT WHOSE HASH IS ITS OWN. A draft carries the hash it had when it was
   last written, and the engine's reader calls a stale hash an error, so linting a draft anybody
   has touched would report a defect that does not exist and drown the real ones. src/publish.mjs
   strips and recomputes for exactly this reason and says so at length; this is the same act on
   the working copy, and nothing here is written. */
function withHash(draft) {
  const copy = Object.assign({}, draft);
  delete copy.hash; delete copy.sig;
  return copy;
}

async function lintProject(dir) {
  const home = path.resolve(dir);
  const found = projectAt(home);
  if (!found) throw refuse("no catalog in {DIR}", { DIR: home });
  const draft = readJson(path.join(home, found.draftName));
  const awaits = await awaitingFor(draft);
  return findings(draft, awaits.classed, awaits.rows, found.project.notPromises, found.project.endsMeant,
    found.project.findingsLeft, found.project.changedNumbers);
}

/* THE REPLIES AS A BODY (author-alternatives-and-steps-not-authorable, the Studio batch of 2026-10-12): a shape and its replies,
   each in the languages it is written in, become the body by the pinned engine's own v2Mark, so no marker is typed by a
   person. A language with any reply written carries every reply, an empty one as its bare marker, because the format holds
   each language to the primary's count; one with none written is left out and speaks the primary. A blank line inside a
   reply would split it in two on a desk, so it is kept as one line break, by v2Mark's own split (a run of blank lines, or
   a line of spaces or a non-breaking space, is one). One reply keeps its blank lines: the replies it joins stay apart.
   Each marker built here must be one the pinned engine's V2_MARKER_RE reads (Clément's read of studio-replies). An empty
   reply in a language that has others is written and named by Studio's lint (emptyReplies), since a desk drops it.
   saveCard's `replies` writes through this, and so does addCard's shaped card (E2), so a card born of a shape and a card
   given one in the editor carry the same bytes. */
const REPLY_SHAPES = ["plain", "steps", "alts"];
function repliesBody(shape, given) {
  if (REPLY_SHAPES.indexOf(shape) < 0) throw refuse("a card holds one reply, alternatives or steps");
  const blocks = (Array.isArray(given) ? given : []).map(b => ({
    label: b && b.label && typeof b.label === "object" ? b.label : {},
    text: b && b.text && typeof b.text === "object" ? b.text : {} }));
  if (!blocks.length) throw refuse("a card needs at least one reply with text in it");
  const flat = (v) => String(v == null ? "" : v).replace(/\r\n?/g, "\n").trim();
  const one = (v) => flat(v).replace(/\n\s*\n/g, "\n").trim();
  const langs = [];
  blocks.forEach(b => Object.keys(b.text).forEach(l => { if (langs.indexOf(l) < 0) langs.push(l); }));
  const R = Engine.bodyRules(), body = {};
  for (const l of langs) {
    const texts = blocks.map(b => (shape === "plain" ? flat : one)(b.text[l]));
    if (!texts.some(Boolean)) continue;
    if (shape === "plain") { body[l] = texts.filter(Boolean).join("\n\n"); continue; }
    body[l] = texts.map((t, i) => {
      const label = shape === "alts" ? String(blocks[i].label[l] || "").replace(/[\]\n\r]/g, " ").trim() : "";
      const marker = shape === "steps" ? "[step]" : label ? "[alt:" + label + "]" : "[alt]";
      if (!R.V2_MARKER_RE.test(marker)) throw refuse("the version of Etiuda this Studio is built on does not read {MARK} as a marker", { MARK: marker });
      return t ? R.v2Mark(t, marker) : marker;
    }).join("\n\n");
  }
  return body;
}

/* ---- saving one card -------------------------------------------------------------------------
 *
 * THE WHOLE DRAFT IS REWRITTEN, HASH LAST, and the hash is the engine's own contentHash over the
 * engine's own canonical form. There is no second writer: a file Studio saves is a file the
 * pinned engine would have written, so a desk's hash check cannot disagree with Studio's, and
 * the leg that proves it reads this file back through the engine's reader rather than through
 * anything here.
 *
 * A PATCH IS A FIELD AND A LANGUAGE, never a whole card. The screen sends what the person typed;
 * everything it did not send is left exactly as it was, so two fields edited in either order
 * give one file. `shelf` takes a tag id or the empty string, `requests` a list of tag ids, and
 * an id naming no tag is refused here rather than written and caught by the lint later.
 *
 * `k` IS THE ONE FIELD WITH NO LANGUAGE, and an emptied one is TAKEN OFF the card rather than
 * written as "". The bag is optional by Maxim's ruling of 2026-09-19, and a card carrying an
 * empty string where it carries nothing is a difference the content hash can see and a reader
 * cannot, so every desk would get a new revision for a field nobody filled.
 */
function saveCard(dir, id, patch) { return unlessStale(dir, () => saveCardOnce(dir, id, patch)); }
async function saveCardOnce(dir, id, patch) {
  const home = path.resolve(dir);
  const found = projectAt(home);
  if (!found) throw refuse("no catalog in {DIR}", { DIR: home });
  const draftAt = path.join(home, found.draftName);
  const seen = {};
  const draft = readOrRefuse(draftAt, seen);
  const card = (draft.cards || []).find(c => c.id === id);
  if (!card) throw refuse("no card {ID} in {FILE}",
    { ID: JSON.stringify(id), FILE: draftAt });
  const cardWas = JSON.parse(JSON.stringify(card)), hashWas = draft.hash;

  const tags = draft.tags || [];
  const known = (kind, tid) => tags.some(t => t.id === tid && t.kind === kind);

  if (patch.title && typeof patch.title === "object") {
    card.title = Object.assign({}, card.title);
    for (const k of Object.keys(patch.title)) card.title[k] = String(patch.title[k] == null ? "" : patch.title[k]);
  }
  if (patch.body && typeof patch.body === "object") {
    card.body = Object.assign({}, card.body);
    for (const k of Object.keys(patch.body)) card.body[k] = String(patch.body[k] == null ? "" : patch.body[k]);
  }
  /* THE REPLIES BLOCK (author-alternatives-and-steps-not-authorable, the Studio batch of 2026-10-12): the body is written by
     repliesBody, above, which addCard's shaped card goes through too. */
  if (patch.replies && typeof patch.replies === "object") {
    const body = repliesBody(patch.replies.shape, patch.replies.blocks);
    card.bodyShape = patch.replies.shape;
    card.body = body;
  }
  /* A NOTE EMPTIED IN ONE LANGUAGE IS TAKEN OFF IN THAT LANGUAGE, and the whole field when none
     is left, by `k`'s reason below: a note is optional, and "" where nothing was moves the hash. */
  if (patch.note && typeof patch.note === "object") {
    const note = Object.assign({}, card.note);
    for (const k of Object.keys(patch.note)) {
      const v = String(patch.note[k] == null ? "" : patch.note[k]);
      if (v.trim()) note[k] = v; else delete note[k];
    }
    if (Object.keys(note).length) card.note = note; else delete card.note;
  }
  if (typeof patch.shelf === "string") {
    if (patch.shelf && !known("shelf", patch.shelf))
      throw refuse("no category {ID} in this catalog", { ID: JSON.stringify(patch.shelf) });
    if (patch.shelf) card.shelf = patch.shelf; else delete card.shelf;
  }
  if (typeof patch.k === "string") {
    const bag = patch.k.trim();
    if (bag) card.k = bag; else delete card.k;
  }
  if (Array.isArray(patch.requests)) {
    const want = patch.requests.map(String).filter((v, i, a) => a.indexOf(v) === i);
    for (const tid of want) if (!known("request", tid))
      throw refuse("no intent {ID} in this catalog", { ID: JSON.stringify(tid) });
    if (want.length) card.requests = want; else delete card.requests;
  }
  /* THE CARDS THAT FOLLOW, AS IDS IN ORDER (board 814, S3b). An entry already on the card is kept whole, so a key a
     later engine adds to one survives, as the pinned reader keeps it; a new one is `{ to }`. The card itself and a
     repeat are left out, which the pinned reader would refuse, and an emptied list takes the key off. */
  if (Array.isArray(patch.next)) {
    const ids = new Set((draft.cards || []).map(c => c.id));
    const had = new Map((Array.isArray(card.next) ? card.next : [])
      .filter(e => e && typeof e === "object" && typeof e.to === "string").map(e => [e.to, e]));
    const want = patch.next.map(String).filter((v, i, a) => v !== id && a.indexOf(v) === i);
    for (const to of want) if (!ids.has(to)) throw refuse(NO_CARD, { ID: JSON.stringify(to) });
    if (want.length) card.next = want.map(to => had.get(to) || { to }); else delete card.next;
  }
  /* The pinned reader takes the flag as true or absent, never false. */
  if (typeof patch.commits === "boolean") {
    if (patch.commits) card.commits = true; else delete card.commits;
  }
  /* THE CARD'S OWN FLAGS, ADDRESS AND LANGUAGE (board 1018, piece B), every field the format names on a card that had no
     write path here (catalog-v2.js V2_CARD_NAMED), each by the format's own reading. The three intent and name flags are
     true or absent, as `commits` is. `paxVoc` and `paxOwn` are 1, 0 or absent, and absent is not off: a desk derives it
     (card-fields.js paxVocOn, paxOwnOn), so null hands the card back to the derived value. `address` holds a form per
     grammar language, en and pl alone: a form the desk offers or the one the card already wears, and "" takes that
     language off, the whole key when none is left. `lockLang` is a language this catalog declares, or "" for none. */
  /* A field of these given in a shape the format cannot hold is refused, never skipped (the test architect's F1). */
  for (const f of ["firstOnly", "allIntents", "intentTop"])
    if (f in patch && typeof patch[f] !== "boolean") throw refuse("{FIELD} cannot be {VALUE}", { FIELD: f, VALUE: JSON.stringify(patch[f]) }); /* plant:f1-card-types */
  if ("address" in patch && (!patch.address || typeof patch.address !== "object" || Array.isArray(patch.address)
      || Object.keys(patch.address).some(k => patch.address[k] != null && typeof patch.address[k] !== "string")))
    throw refuse("{FIELD} cannot be {VALUE}", { FIELD: "address", VALUE: JSON.stringify(patch.address) }); /* plant:f1-card-address */
  if ("lockLang" in patch && typeof patch.lockLang !== "string")
    throw refuse("{FIELD} cannot be {VALUE}", { FIELD: "lockLang", VALUE: JSON.stringify(patch.lockLang) }); /* plant:f1-card-lock */
  for (const f of ["firstOnly", "allIntents", "intentTop"]) {
    if (typeof patch[f] !== "boolean") continue;
    if (patch[f]) card[f] = true; else delete card[f]; /* plant:b1018-flags */
  }
  for (const f of ["paxVoc", "paxOwn"]) {
    if (!(f in patch)) continue;
    const v = patch[f];
    if (v === null) delete card[f];
    else if (typeof v === "boolean" || v === 0 || v === 1) card[f] = v ? 1 : 0; /* plant:b1018-pax */
    else throw refuse("{FIELD} is on, off or left for the desk to work out, not {VALUE}", { FIELD: f, VALUE: JSON.stringify(v) });
  }
  if (patch.address && typeof patch.address === "object" && !Array.isArray(patch.address)) {
    const forms = Engine.addressForms();
    const ad = Object.assign({}, card.address && typeof card.address === "object" ? card.address : {});
    for (const L of Object.keys(patch.address)) {
      const v = String(patch.address[L] == null ? "" : patch.address[L]);
      if (L !== "en" && L !== "pl") throw refuse("forms of address exist for en and pl only, not {CODE}", { CODE: L });
      if (!v) delete ad[L];
      else if (forms[L].indexOf(v) >= 0 || v === ad[L]) ad[L] = v; /* plant:b1018-address */
      else throw refuse("{FORM} is not a form of address this version of Etiuda offers", { FORM: JSON.stringify(v) });
    }
    if (Object.keys(ad).length) card.address = ad; else delete card.address;
  }
  if (typeof patch.lockLang === "string") {
    const l = patch.lockLang.trim();
    const codes = (draft.langs || []).map(x => x && x.code).filter(Boolean);
    if (!l) delete card.lockLang;
    else if (codes.indexOf(l) >= 0) card.lockLang = l; /* plant:b1018-lock */
    else throw refuse("this catalog has no language {CODE}", { CODE: l });
  }

  const F = await Engine.format();
  delete draft.hash; delete draft.sig;
  draft.hash = F.contentHash(draft);
  writeWhole(draftAt, json(draft), { was: seen.raw });
  journal(home, null, { cards: [cardWas], facts: draft.facts, hash: hashWas }, { cards: [card], facts: draft.facts, hash: draft.hash }, F,
    (draft.cards || []).indexOf(card));

  const changedNumbers = syncChangedWatches(draft.cards, cardWas, card, found.project.changedNumbers,
    draft.langs || draft.languages);
  const project = Object.assign({}, found.project, {
    draft: found.draftName, id: draft.id,
    edited: new Date().toISOString(),
  });
  if (changedNumbers.length) project.changedNumbers = changedNumbers;
  else delete project.changedNumbers;
  writeProject(home, project);

  /* THE SAVE ANSWERS WITH THE AWAITING STATE AS WELL AS THE LINT, because filling a Polish body
     is exactly the act that ends one: the row's mark, the strip above the table and the rail's
     count all follow the file rather than waiting for the next open. */
  const awaits = await awaitingFor(draft);
  return { card, hash: draft.hash, counts: countsOf(draft), changes: await changesCount(home),
           lint: findings(draft, awaits.classed, awaits.rows, project.notPromises, project.endsMeant, project.findingsLeft, project.changedNumbers), awaiting: awaits.rows,
           edited: project.edited, likely: likelyOf(draft, card, project.notPromises) };
}

/* ---- a likely commitment, suggested and never written (board 814, step 11, S3b) ----
 * src/commitment.mjs reads each language's body at its OPTIONS defaults, in the catalog's language order, and the
 * first that fires is the suggestion. A ticked card gets none, and neither does one dismissed for the same words: a
 * dismissal is the project's (`notPromises` in project.json, card id to the phrase it was given for), because the
 * catalog's flag is true or absent and cannot say "not a commitment". Changed words bring the suggestion back. */
function likelyOf(draft, card, dismissed) {
  if (!card || card.commits || !card.body || typeof card.body !== "object") return null;
  for (const l of (draft.langs || []).map(x => x && x.code).filter(Boolean)) {
    const r = likelyCommitment(String(card.body[l] || ""), l);
    if (!r.likely) continue;
    if (dismissed && typeof dismissed === "object" && dismissed[card.id] === r.phrase) return null;
    return { rule: r.rule, kind: r.kind, phrase: r.phrase, lang: l };
  }
  return null;
}

/** Every card's suggestion, by id, for the cards that have one. */
function likelyAll(draft, dismissed) {
  const out = {};
  (draft.cards || []).forEach((c) => { const r = c && likelyOf(draft, c, dismissed); if (r) out[c.id] = r; });
  return out;
}

/** The lead's "not a commitment" for a card's suggestion, kept in the project and never in the draft. */
async function dismissLikely(dir, id, phrase) {
  const home = path.resolve(dir);
  const found = projectAt(home);
  if (!found) throw refuse("no catalog in {DIR}", { DIR: home });
  const draft = readOrRefuse(path.join(home, found.draftName));
  if (!(draft.cards || []).some(c => c.id === id)) throw refuse(NO_CARD, { ID: JSON.stringify(id) });
  const kept = Object.assign({}, found.project.notPromises);
  kept[String(id)] = String(phrase == null ? "" : phrase);
  writeProject(home, Object.assign({}, found.project, { draft: found.draftName, notPromises: kept }));
  /* THE LINT TRAVELS WITH THE DISMISSAL (S3e): the list's suggestion row for this card goes with it, and the page takes
     the answer's lint rather than waiting for the next verb that happens to carry one. */
  const awaits = await awaitingFor(draft);
  return { id, dismissed: true, lint: findings(draft, awaits.classed, awaits.rows, kept, found.project.endsMeant,
    found.project.findingsLeft, found.project.changedNumbers) };
}

/* ---- a path's end turned down (board 814, S3e-2) ----
 * A card others link to and that links to none is a suggestion (suggestionsOf, "ends"), and the last card of every chain
 * is one by design, so the lead can say "this path is meant to end here". The answer is the project's, as a likely
 * commitment's is (`endsMeant` in project.json, card id to the ids of the cards that linked to it when it was dismissed),
 * never the catalog's. It covers those cards only: a card that links to it later brings the row back, because a new way
 * in is a new question; a card that stops linking keeps it dismissed. */
function endsMeantOf(project) {
  const m = project && project.endsMeant;
  const out = {};
  if (!m || typeof m !== "object" || Array.isArray(m)) return out;
  for (const k of Object.keys(m)) if (Array.isArray(m[k])) out[k] = m[k].filter(x => typeof x === "string");
  return out;
}
function endCovered(endsMeant, id, beforeIds) {
  const kept = endsMeantOf({ endsMeant })[id];
  return !!kept && beforeIds.every(x => kept.indexOf(x) >= 0);
}
async function dismissEnd(dir, id) {
  const home = path.resolve(dir);
  const found = projectAt(home);
  if (!found) throw refuse("no catalog in {DIR}", { DIR: home });
  const draft = readOrRefuse(path.join(home, found.draftName));
  const cards = draft.cards || [];
  if (!cards.some(c => c.id === id)) throw refuse(NO_CARD, { ID: JSON.stringify(id) });
  const before = cards.filter(x => x && x.id !== id && (Array.isArray(x.next) ? x.next : []).some(e => e && e.to === id))
    .map(x => x.id);
  const kept = endsMeantOf(found.project);
  kept[String(id)] = before;
  const project = Object.assign({}, found.project, { draft: found.draftName, endsMeant: kept });
  writeProject(home, project);
  const awaits = await awaitingFor(draft);
  return { id, dismissed: true, endsMeant: kept,
           lint: findings(draft, awaits.classed, awaits.rows, project.notPromises, kept, project.findingsLeft, project.changedNumbers) };
}

/** Dismisses a changed-number review suggestion for one listed card, kept in project.json and never in the draft. */
async function dismissChangedNumber(dir, id, numberKey, fromId) {
  const home = path.resolve(dir);
  const found = projectAt(home);
  if (!found) throw refuse("no catalog in {DIR}", { DIR: home });
  const draft = readOrRefuse(path.join(home, found.draftName));
  if (!(draft.cards || []).some(c => c.id === id)) throw refuse(NO_CARD, { ID: JSON.stringify(id) });
  const watches = dismissWatches(found.project.changedNumbers, id, numberKey, fromId);
  const project = Object.assign({}, found.project, { draft: found.draftName });
  if (watches.length) project.changedNumbers = watches;
  else delete project.changedNumbers;
  writeProject(home, project);
  const awaits = await awaitingFor(draft);
  return { id, dismissed: true,
           lint: findings(draft, awaits.classed, awaits.rows, project.notPromises, project.endsMeant, project.findingsLeft, project.changedNumbers) };
}

/* ---- a team's arrow turned down on the Paths map (board 814, S3c) ----
 * The team's "B after A" totals reach Studio through the statistics (src/stats.mjs, teamOf's `pairs`), and the map draws
 * each pair that is not yet a link as a dotted arrow the lead may adopt or dismiss. A dismissal is the project's, as a
 * likely commitment's is (`notPaths` in project.json, a list of {from, to}), never the catalog's: the catalog says which
 * cards follow which and has no way to say "not this one". Both cards must be in the draft. The list comes back whole, and
 * statsFor carries it, so the map that reads the totals reads the dismissals in the same answer. */
const pathKey = (p) => JSON.stringify([String(p && p.from), String(p && p.to)]);
function notPathsOf(project) {
  return (Array.isArray(project && project.notPaths) ? project.notPaths : [])
    .filter(p => p && typeof p.from === "string" && typeof p.to === "string");
}
async function dismissPair(dir, from, to) {
  const home = path.resolve(dir);
  const found = projectAt(home);
  if (!found) throw refuse("no catalog in {DIR}", { DIR: home });
  const draft = readOrRefuse(path.join(home, found.draftName));
  for (const id of [from, to])
    if (!(draft.cards || []).some(c => c.id === id)) throw refuse(NO_CARD, { ID: JSON.stringify(id) });
  const kept = notPathsOf(found.project);
  const one = { from: String(from), to: String(to) };
  if (!kept.some(p => pathKey(p) === pathKey(one))) kept.push(one);
  writeProject(home, Object.assign({}, found.project, { draft: found.draftName, notPaths: kept }));
  return { from: one.from, to: one.to, dismissed: true, notPaths: kept };
}

/* ---- the import wizard's three covers ---------------------------------------------------------
 *
 * THE SCREENS ARE A VIEW OVER `node tools/import.mjs` AND NOT A SECOND IMPORTER. `importPlan`
 * runs exactly the import the Land button will run and throws the answer away; `importLand` runs
 * it again and writes through `writeImport`, the one writer the command line also uses. So the
 * wizard cannot offer a decision the importer has not got, and tests/import-screen.mjs holds the
 * two doors to the same sha256 on both files.
 *
 * RUNNING THE IMPORT TWICE IS DELIBERATE. Holding the first answer and writing it later would
 * make the screen's draft the one computed before the last change to the mapping, and the wizard
 * exists precisely so that the mapping can be changed; an import of a few thousand rows costs
 * a second or two on the worker thread, and a stale draft costs a customer their catalog.
 *
 * THE HASH IS NOT A CACHED DRAFT. Land reads the file again, so a mapping changed on the cover
 * is the mapping that is written. The hash is only the bytes the cover read. Land refuses,
 * before it writes, when the file is no longer those bytes. An empty hash means no cover offered
 * one, which is the command line and every caller from before this check, and that is not a
 * refusal.
 *
 * WHERE AN IMPORT LANDS. A new folder under the projects root, named after the catalog's name
 * and holding a draft of that name, never into the project that happens to be open: an import
 * is a pile of somebody else's macros and overwriting an authored draft with it is not a thing a
 * screen should be able to do by accident. A folder already there is a refusal with its path in it.
 */
/* THE FACTS THE WIZARD'S FIRST COVER SHOWS COME FROM THE SAME READING THE IMPORT DOES (641).
   This was a second reader - decode the bytes, parse a CSV - and the day the importer learned to
   open a workbook that second reader started answering about a zip: windows-1252, a column
   called whatever the compressed bytes looked like, and a row count that agreed with nothing.
   src/source.mjs is the one door for both, so the cover cannot disagree with the import it is
   previewing, and `shape` is here so the cover can say WHAT was found rather than only how much.

   AND THE READING COMES BACK EVEN WHEN THE READER REFUSED THE FILE (642). `attempt` is
   `examine` with the throw turned into a value, so a file nothing can be imported from still
   answers with what kind of file it is; `refusal` is the Error or null and the caller decides
   what to do with it. The notes ride here too, because on a plan that succeeds they are already
   in the report - importCsv forwards every one of them into its findings - and a refusal without
   them would tell a person LESS about the same file than a success does. */
function fileFacts(file) {
  const got = attempt({ file });
  const src = got.src;
  const isTableTwice = n => (n.said && n.said.frame && n.said.frame.startsWith("Some names appear more than once in the heading row"))
    || (typeof n.what === "string" && n.what.startsWith("Some names appear more than once in the heading row"));
  const notes = src.notes.filter(n => !isTableTwice(n)).map(n => Object.assign({}, n));
  (src.table.duplicateHeaders || []).forEach(h => {
    const s = noteOf("More than one column is headed {NAME}, and only the last of them"
      + " was read. Once each has a name of its own in the file, a second import reads them all.",
      { NAME: JSON.stringify(h) });
    notes.push({ severity: "error", what: s.message, said: s.said });
  });
  return { encoding: src.encoding, rows: src.table.rows.length, head: src.table.head,
           first: src.table.rows[0] || {}, shape: src.shape, source: src.source,
           periodic: src.periodic, fork: src.fork, sample: src.sample,
           notes, refusal: got.refusal };
}

/* THE READING, SHAPED FOR A CALLER IN ONE PLACE. A plan and a refusal carry the same four facts
   and the same `read` block, from here, because a refusal that shaped a reading of its own
   would be the second reader 641 was about: a screen could then draw something the import never
   saw. WHAT THE FILE WAS AND WHICH FORK IT IMPLIES (641, 642) is what a cover has to say before
   anything is mapped, so it is carried rather than read a second time to draw it. */
function planRead(facts) {
  return { encoding: facts.encoding, rows: facts.rows, cols: facts.head.length,
           read: { source: facts.source, shape: facts.shape, periodic: facts.periodic,
                   fork: facts.fork, sample: facts.sample } };
}

/* Where an import would land under the second answer, so the wizard's first step can name the
   project without asking a second verb for it. Null when no project is open. */
function landsIn(target, at) {
  return target ? { dir: target.dir, id: target.id, name: target.name,
                    at: path.join(target.dir, INBOX, proposalName(at)) } : null;
}

/* A REFUSAL THAT CARRIES THE READING (642, from Claudia's drawing of the wizard's first cover).
 *
 * A file the importer cannot make a plan from is not a file nothing is known about. The reader
 * opened it: it knows what kind of file it is, how many rows or cells are in it, whether a cycle
 * was found and what the fork would be. All of that used to die with the throw, and the person
 * brought the very file the AI import exists for - a pile with no structure in it - and got
 * three unreachable steps, a sentence written for the override table, and Cancel. So the plan
 * answers with the reading and the refusal TOGETHER, and what a cover does with the two is the
 * screen's business rather than this function's.
 *
 * IT IS RECOGNISED BY `refusal` AND NOT BY A MISSING KEY. A plan that succeeded is the object it
 * always was, to the byte, so there is no `ok` on it to test against; a caller asks whether
 * `refusal` is there. `said` rides beside it exactly as it does on the wire, because the page
 * says a refusal at paint time and cannot translate an English sentence it was handed.
 */
function refusedPlan(at, target, facts, e, mapping) {
  return Object.assign({ file: at, base: path.basename(at) }, planRead(facts), {
    into: landsIn(target, at),
    notes: facts.notes,
    refusal: e.message, said: e.said || null,
  }, mapping || {});
}

/* A REFUSAL THE MAPPING TABLE CAN ANSWER CARRIES THE MAPPING TABLE (sense pass 2026-09-22, item
 * 4). The table was painted only when a plan succeeded, and a plan succeeded only when an alias
 * already knew a body column, so a Polish heading, a heading nobody listed and every text file
 * ended at a screen offering Cancel, pointing at a table that was not on it. When the one
 * refusal is that no column was read as text in the primary language, the columns come back
 * with it, by the same mapHeaders over the same heading the importer read, each with its first
 * row beside it, so the page can paint the table and the person can say which column is the
 * text. Every other refusal is not a question of mapping and carries nothing more.
 */
function mappingFor(e, facts, override) {
  if (!e || !e.said || e.said.frame !== NO_PRIMARY || !facts.head.length) return null;
  return {
    columns: mapHeaders(facts.head, override || {}).columns.map(c => Object.assign({}, c,
      { first: cellText(facts.first[c.header] == null ? "" : facts.first[c.header]) })),
    fields: FIELDS,
    langs: [],
  };
}

/* THE TARGET OF AN IMPORT, WHICH IS A QUESTION THE WIZARD NOW ASKS (539, Maxim 2026-09-19
 * 05:23, the door being frame B with G). A new project is what an import has always made; the
 * other answer is this project, and the pile then arrives as a PROPOSAL in the review queue
 * rather than as a draft - additions for the cards this catalog has not got, changes for the
 * ones it has, and nothing at all offered for removal. Why that is the same machinery rather
 * than a second importer is written at checkOrigin in src/review.mjs.
 *
 * `into` IS A FOLDER OR IT IS NOTHING. The page passes the open project's own dir, which it
 * already holds; a dir that is not a project refuses here rather than writing a file into
 * somebody's Documents folder and calling it an inbox.
 */
function intoProject(into) {
  const dir = String(into || "").trim();
  if (!dir) return null;
  const home = path.resolve(dir);
  if (!fs.existsSync(path.join(home, PROJECT_FILE)))
    throw refuse("there is no catalog at {DIR}, so an import cannot land in it", { DIR: home });
  const p = readProject(home);
  return { dir: home, id: String(p.draft.id || p.project.id || ""),
           name: projectName(home, p.project), draft: p.draft };
}

async function importPlan(root, file, override, into) {
  const at = path.resolve(String(file || ""));
  if (!fs.existsSync(at)) throw refuse("no file at {P}", { P: at });
  const target = intoProject(into);
  const seen = shaOf(fs.readFileSync(at));
  const facts = fileFacts(at);
  if (facts.refusal) return refusedPlan(at, target, facts, facts.refusal);
  let made;
  /* THE IMPORTER'S OWN REFUSALS COME BACK THE SAME WAY, AND A FAULT IN THE PROGRAM DOES NOT.
     A sentence with no frame is a bug report rather than an account of something a person did,
     and it goes on rising to the shell's guard as it always has. */
  const F = await Engine.format();
  try {
    made = await importCsv({ file: at, override: override || {}, id: target ? undefined : newCatalogId(F) });
    if (shaOf(fs.readFileSync(at)) !== seen) throw refuse(FILE_CHANGED);
  }
  catch (e) {
    if (!e || !e.said) throw e;
    return refusedPlan(at, target, facts, e, mappingFor(e, facts, override));
  }
  const { catalog, report, stem } = made;

  /* The duplicate rows name cards by id, because that is what survives a re-import; a person
     reads titles. The map is built for the rows in the report and for nothing else. */
  const titles = {};
  const want = new Set();
  report.duplicates.exact.concat(report.duplicates.near)
    .forEach(d => { want.add(d.of); want.add(d.twin); });
  (catalog.cards || []).forEach(c => {
    if (want.has(c.id)) titles[c.id] = (c.title || {})[report.primary] || c.id;
  });

  /* WHAT EACH TRANSLATED TOKEN BECAME. The report aggregates by token and keeps the count
     rather than the target, and the screen has to say what it turned into; the target is asked
     of the same table the importer translated through, so the two cannot disagree. */
  const to = {};
  report.placeholders.mapped.forEach(x => {
    const f = translate(x.token).found[0];
    if (f && f.to) to[x.token] = f.to;
  });

  let dir = newProjectDir(root, stem);
  if ((isPasteFile(at) || !!report.paste) && !target) {
    for (let n = 1; n < 1000; n++) {
      const candidateName = n === 1 ? stem : stem + " " + n;
      const candidateDir = newProjectDir(root, candidateName);
      if (!fs.existsSync(candidateDir)) {
        dir = candidateDir;
        break;
      }
    }
  }
  /* Object.assign RATHER THAN A LITERAL, and the four facts in the middle of it: the keys come
     out in the order they went in, so a plan that succeeds keeps the order it had before the
     refusal shared this reading with it. fingerprint is the last key, the sha256 of the bytes
     this plan read, which is what Land compares. */
  return Object.assign({
    file: at, base: path.basename(at), to,
  }, planRead(facts), {
    id: target ? catalog.id : null, name: path.basename(dir), dir, exists: fs.existsSync(dir),
    into: landsIn(target, at),
    /* Every column's verdict with the first row's own text beside it, which is the one thing
       that tells a person whether the guess is right. */
    columns: report.columns.map(c => Object.assign({}, c,
      { first: cellText(facts.first[c.header] == null ? "" : facts.first[c.header]) })),
    fields: FIELDS,
    langs: report.languages.map(l => l.code),
    titles,
    report,
    fingerprint: seen,
  });
}

/* A paste is the customer's own text, so its file goes once it has landed; a refused landing leaves it for the next try. */
async function importLand(root, file, override, into, fingerprint) {
  const landed = await landImport(root, file, override, into, fingerprint);
  if (isPasteFile(path.resolve(String(file || "")))) fs.rmSync(path.resolve(String(file || "")), { force: true }); /* plant:paste-gone */
  return landed;
}
async function landImport(root, file, override, into, fingerprint) {
  const at = path.resolve(String(file || ""));
  if (!fs.existsSync(at)) throw refuse("no file at {P}", { P: at });
  const seen = shaOf(fs.readFileSync(at));
  const shown = fingerprint == null ? "" : String(fingerprint);
  /* One line, so a plant can lift the comparison. An empty shown is a caller with no cover. */
  if (shown && shown !== seen) throw refuse(FILE_CHANGED); /* plant:file-changed */
  const target = intoProject(into);
  const F = await Engine.format();
  const { catalog, report, stem } = await importCsv({ file: at, override: override || {},
                                                id: target ? undefined : newCatalogId(F) });
  if (shaOf(fs.readFileSync(at)) !== seen) throw refuse(FILE_CHANGED);

  /* INTO THIS PROJECT: the pile is written into the inbox as the document it is, and nothing
     else is touched. The catalog keeps its OWN id, which is what makes the review queue read it
     as a file from another catalog and offer it as additions and changes; rewriting the id to
     this project's would have hidden where the cards came from and would have let the queue
     offer to remove every card the pile happens not to have. The lint report goes beside it
     under the same stem, exactly as writeImport puts it beside a draft. */
  const isPaste = isPasteFile(at) || !!report.paste;
  if (target) {
    const inbox = path.join(target.dir, INBOX);
    let proposalAt = path.join(inbox, proposalName(at));
    if (fs.existsSync(proposalAt)) {
      /* A FILE OF THE SAME NAME WITH NOTHING LEFT TO DECIDE IS PUT AWAY, NOT A REASON TO REFUSE
         (sense pass 2026-09-22, item 19). Importing an updated sheet a second time was refused
         "a proposal is already waiting" with nothing waiting at all, because nothing ever left
         the inbox. One with rows still waiting is refused as before, and now says how many. */
      const was = await reviewProposal({ project: target.dir, file: proposalAt, rules: [],
                                         write: false });
      if (was.ok && !was.pending.length) {
        putAway(target.dir, proposalAt);
      } else if (isPaste) {
        const ext = path.extname(proposalAt);
        const pstem = path.basename(proposalAt, ext);
        let n = 2;
        while (fs.existsSync(path.join(inbox, `${pstem}-${n}${ext}`))) n++;
        proposalAt = path.join(inbox, `${pstem}-${n}${ext}`);
      } else {
        throw refuse("there is already a file at {DIR} with {ROWS} still waiting; an import"
          + " never writes over a proposal that is waiting", { DIR: proposalAt,
            ROWS: counted(was.ok ? was.pending.length : 0, "{N} row", "{N} rows") });
      }
    }
    fs.mkdirSync(inbox, { recursive: true });
    fs.writeFileSync(proposalAt, json(catalog), "utf8");
    fs.writeFileSync(proposalAt.replace(/\.ec$/, ".lint.json"), json(report), "utf8");
    return { into: true, dir: target.dir, name: target.name, file: proposalAt,
             proposal: path.basename(proposalAt), id: catalog.id, report };
  }

  let dir = newProjectDir(root, stem);
  if (isPaste) {
    for (let n = 1; n < 1000; n++) {
      const candidateName = n === 1 ? stem : stem + " " + n;
      const candidateDir = newProjectDir(root, candidateName);
      if (!fs.existsSync(candidateDir)) {
        dir = candidateDir;
        break;
      }
    }
  } else {
    if (fs.existsSync(dir)) throw refuse("there is already a folder at {DIR}; an import never writes"
      + " over a catalog that is already there", { DIR: dir });
  }
  const { draftAt } = writeImport(dir, catalog, report, path.basename(dir));
  writeProject(dir, { id: catalog.id, rev: 0,
    edition: "", draft: path.basename(draftAt), folder: null });
  return Object.assign(await openProject(dir), { report });
}

/* A PASTE BECOMES THE FILE THE WIZARD ALREADY PLANS. The plain text and the HTML are split by
   src/paste.mjs and written as their own file under `base` (Studio's own work folder; the
   temporary directory where none is given), and that path is what importPlan and importLand
   then read. A second paste is a second file, so the first one's bytes stay until it lands.
   No model, and no second writer: the CSV is the importer's. An empty paste is refused before
   a file is written, so a header with no rows never reaches the importer. */
function writePaste(plain, html, base) {
  const account = pasteAccount(String(plain || ""), String(html || ""));
  if (!account.replies) throw refuse("the paste has no reply in it");
  const at = pasteFileIn(base);
  fs.mkdirSync(path.dirname(at), { recursive: true });
  fs.writeFileSync(at, pasteCsv(account.pieces), "utf8");
  return { file: at, replies: account.replies, oneBlock: account.oneBlock };
}

/* ---- the review queue's screen ----------------------------------------------------------------
 *
 * WHERE A PROPOSAL ARRIVES: `<project>/inbox`, beside `archive`, and for the archive's reasons.
 * A project is a folder and the folder is the customer's, so a project copied to another machine
 * carries its waiting proposals with it and a project deleted takes them away; nothing about a
 * catalog lives in Studio's own settings. It is also the one folder an agent can be given the
 * path of without being given the working copy, and dropping a file into it is the whole
 * protocol - there is no server here and no live collaboration (spec 3.3). Files directly in it,
 * no recursion: `.ec` and `.json`, and `.js`, which is what a desk's Export writes.
 *
 * AND EVERY DESK'S OWN FILE OF THIS CATALOG (board 834, step 8): `desks/<id>/` in the folder the
 * catalog is published to, where each desk writes its edits as it makes them. A file there is
 * listed only where it is genuine and grew from this catalog; anything else in a desk's folder is
 * ignored here as on every desk. Studio never writes into a desk's folder, so a decided desk file
 * stays where it is and its rows stay decided.
 *
 * THE SCREEN DECIDES NOTHING THE COMMAND LINE CANNOT. A tick on a row becomes one rule of the
 * exact form `node tools/review.mjs --accept <key>` builds, and the same `reviewProposal` does
 * the rest, so tests/review-screen.mjs can hold the two doors to the same draft bytes. The keys
 * are the ones the command line prints, which is also what lets somebody read a queue on one and
 * decide it on the other.
 */
const INBOX = "inbox";


/* THE NAME AN IMPORTED PILE WAITS UNDER, taken from the file the person chose rather than from
   the catalog's id: the person knows which file they picked and will look for that word, and
   two piles named by one catalog id would collide where two named by their files do not. The
   extension becomes `.ec` because that is what the folder holds and what listProposals reads. */
function proposalName(file) {
  const base = path.basename(String(file || "")).replace(/\.[^.]+$/, "");
  return (base || "import") + ".ec";
}

/** Which team keys a listing was handed, as text a kept row is keyed on: a key handed later reads a sealed file afresh. */
function keysStamp(teamKeys) {
  if (!teamKeys || typeof teamKeys !== "object") return "";
  return Object.keys(teamKeys).sort().map(t => t + ":" + Object.keys(teamKeys[t] || {}).sort().join(",")).join(";");
}

/* A LONG INBOX IS READ ONCE (sense pass 3, item 19). Kept per project and process: each file's
 * row while it, its report, the working copy, the log and the archive and decided folders stand;
 * each file's catalog while the file stands, so a changed working copy is compared without
 * reading the inbox again. A card or tag with the JSON text of one held is held once (`pool`),
 * and its canonical form computed once. NOTHING KEPT IS EVER WRITTEN TO: the verbs that decide
 * read every file afresh. */
const LISTED = new Map();
function listedFor(home) {
  let k = LISTED.get(home);
  if (!k) {
    k = { rows: new Map(), docs: new Map(), pool: new Map(), text: new WeakMap(),
          mate: { cards: new Map(), tags: new Map() } };
    LISTED.set(home, k);
  }
  return k;
}
const CANON = new WeakMap();
function canonKept(F) {
  return (v) => {
    if (v === null || typeof v !== "object") return F.canonical(v);
    let c = CANON.get(v);
    if (c === undefined) { c = F.canonical(v); CANON.set(v, c); }
    return c;
  };
}
/** A file's size and time, or "-" where it is not there: what a kept reading is keyed on. */
function stampOf(at) {
  try { const st = fs.statSync(at); return st.size + ":" + st.mtimeMs; } catch { return "-"; }
}
/** The same, asked without waiting, so that a folder's worth are asked at once. */
function stampNow(at) {
  return fs.promises.stat(at).then(st => st.size + ":" + st.mtimeMs, () => "-");
}
/** Whether two parsed JSON values have the same JSON text, keys in order, without writing it. */
function sameText(a, b) {
  if (a === b) return true;
  if (!a || !b || typeof a !== "object" || typeof b !== "object") return false;
  const list = Array.isArray(a);
  if (list !== Array.isArray(b)) return false;
  if (list) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) if (!sameText(a[i], b[i])) return false;
    return true;
  }
  const ka = Object.keys(a), kb = Object.keys(b);
  if (ka.length !== kb.length) return false;
  for (let i = 0; i < ka.length; i++) {
    if (ka[i] !== kb[i] || !sameText(a[ka[i]], b[ka[i]])) return false;
  }
  return true;
}
/** Each card and tag of `doc` replaced by the held object with the same JSON text, if any. The
 *  one last held under its id is asked first: a desk file is mostly the working copy's cards. */
function held(kept, doc) {
  const hold = (mates) => (x) => {
    if (!x || typeof x !== "object") return x;
    const mate = mates.get(x.id);
    if (mate && sameText(mate, x)) return mate;
    const t = JSON.stringify(x);
    let was = kept.pool.get(t);
    if (!was) { kept.pool.set(t, x); kept.text.set(x, t); was = x; }
    mates.set(x.id, was);
    return was;
  };
  if (Array.isArray(doc.cards)) doc.cards = doc.cards.map(hold(kept.mate.cards));
  if (Array.isArray(doc.tags)) doc.tags = doc.tags.map(hold(kept.mate.tags));
  return doc;
}
/** The file's catalog as the listing last read it, or from `text`; null where it will not
 *  read, which leaves the refusal to reviewProposal's own reading. */
function docFor(kept, file, stamp, text) {
  const was = kept.docs.get(file);
  if (was && was.stamp === stamp) return was.doc;
  let doc = null;
  try { doc = text == null ? null : catalogFromText(text, file); } catch { doc = null; }
  if (!doc || typeof doc !== "object" || Array.isArray(doc)) {
    kept.docs.delete(file);
    return null;
  }
  kept.docs.set(file, { stamp, doc: held(kept, doc) });
  return doc;
}
/** The pool rebuilt from what the kept catalogs and the working copy still hold, once it has
 *  grown well past them: every save leaves one card nobody holds any more. */
function prunePool(kept, draft) {
  const live = (draft.cards || []).length + (draft.tags || []).length;
  if (kept.pool.size <= 3 * live + 5000) return;
  const pool = new Map();
  const keep = (x) => { const t = kept.text.get(x); if (t !== undefined) pool.set(t, x); };
  [draft].concat(Array.from(kept.docs.values(), d => d.doc)).forEach(d => {
    (d.cards || []).forEach(keep); (d.tags || []).forEach(keep);
  });
  kept.pool = pool;
}

/* ONE LISTING OF A PROJECT AT A TIME: one asked while another runs starts when that one ends,
   from what it kept, and reads the folder afresh. Two at once read every file twice. */
const LISTING = new Map();
async function listProposals(dir, o) {
  const home = path.resolve(dir), teamKeys = (o && o.teamKeys) || null, removed = (o && o.removed) || null;
  const ahead = LISTING.get(home) || Promise.resolve();
  const mine = ahead.then(() => readInbox(home, teamKeys, removed, o), () => readInbox(home, teamKeys, removed, o));
  LISTING.set(home, mine);
  const done = () => { if (LISTING.get(home) === mine) LISTING.delete(home); };
  mine.then(done, done);
  return mine;
}

/* One row per desk catalog. A higher rev wins. An equal rev keeps the name that is not a conflict
   copy of another in the group, else the earlier name. An inbox file, and a file with no catalog
   id, keeps its own row. The identity is how the choice is made and is not a field of the row. */
function revNum(row) {
  const v = row && row.rev;
  return typeof v === "number" && Number.isFinite(v) ? v : -1;
}
function conflictNamedAmong(name, names) {
  for (let i = 0; i < names.length; i++) {
    if (names[i] !== name && conflictSiblingName(names[i], name)) return true;
  }
  return false;
}
function betterProposal(a, b, names) {
  const ar = revNum(a), br = revNum(b);
  if (ar !== br) return ar > br;
  const ac = conflictNamedAmong(a.name, names), bc = conflictNamedAmong(b.name, names);
  if (ac !== bc) return !ac;
  if (a.name !== b.name) return a.name < b.name;
  return false;
}
function collapseProposals(rows, identities) {
  const byId = new Map();
  rows.forEach((row, i) => {
    const id = identities[i];
    if (!id) return;
    if (!byId.has(id)) byId.set(id, []);
    byId.get(id).push(i);
  });
  const drop = new Set();
  for (const idxs of byId.values()) {
    if (idxs.length < 2) continue;
    const names = idxs.map(i => rows[i].name);
    let keep = idxs[0];
    for (let n = 1; n < idxs.length; n++) {
      if (betterProposal(rows[idxs[n]], rows[keep], names)) keep = idxs[n];
    }
    idxs.forEach(i => { if (i !== keep) drop.add(i); });
  }
  return rows.filter((row, i) => !drop.has(i));
}

/* A DESK SINCE REMOVED (board 900, F2): `removed` (src/team-store.mjs removedOf, by desk id) names the desks taken off this
   project's team. A file of one is a row only where it is the record of what it said while trusted (src/removed.mjs
   removedHeld), and the row says so (`removed`); anything it sent after its removal is no row at all. */
/* The largest inbox file read, the workbook reader's own ceiling (src/workbook.mjs), and the mark of one larger. */
const INBOX_MAX = 64 * 1024 * 1024;
const TOO_BIG = Symbol("too big");
async function readInbox(home, teamKeys, removed, o) {
  const at = path.join(home, INBOX);
  let names = [];
  /* `.lint.json` IS THE ONE NAME THIS FOLDER HOLDS THAT IS NOT A PROPOSAL. An import into this
     project writes the importer's own report beside the pile under the same stem, as
     writeImport does beside a draft, and a report is not a catalog: listed here it would be one
     permanent refusal row on a screen whose whole job is that a row means a decision. */
  try { names = fs.readdirSync(at)
          .filter(n => /\.(ec|json|js)$/i.test(n) && !/\.lint\.json$/i.test(n)).sort(); }
  catch { names = []; }
  const kept = listedFor(home);
  const countFlags = flagsInReviewCount();
  /* THE PROJECT, THE LOG AND THE CANONICAL FORM ONCE FOR THE WHOLE LISTING. Where the project
     will not read, every file is reviewed on its own as before and says why. */
  let look = null, headStamp = null, desks = [], formerly = {}, teamRoster = null, cardsById = new Map(), cardIds = new Set(), settled = new Set();
  try {
    const head = readProject(home);
    head.draft = held(kept, head.draft);
    look = { head, log: readLog(home), canon: canonKept(await Engine.format()) };
    cardsById = new Map((head.draft.cards || []).filter(c => c && c.id).map(c => [String(c.id), c]));
    cardIds = new Set(cardsById.keys());
    settled = settledSetOf(readFlagStore(home));
    const folder = folderHere(head.project, o) || null;
    desks = deskFilesIn(folder); /* plant:s2-edit */
    formerly = removed && folder ? removedHeld(folder, removed) : {};
    const teamRead = folder ? await readTeam(folder) : null;
    if (teamRead && teamRead.team && Array.isArray(teamRead.team.roster)) {
      teamRoster = new Set(teamRead.team.roster.map(e => e && e.desk && e.desk.id).filter(Boolean).map(String));
    }
    headStamp = [stampOf(head.draftAt), head.draft.hash, head.project.id, head.project.rev,
      stampOf(path.join(home, REVIEW_LOG)), stampOf(path.join(home, FLAGS_FILE)),
      countFlags ? "flags1" : "flags0",
      stampOf(path.join(home, ARCHIVE)),
      stampOf(path.join(home, DECIDED)), keysStamp(teamKeys), JSON.stringify(formerly),
      teamRead && teamRead.at ? stampOf(teamRead.at) : "-",
      /* which inbox file a linked copy's last press wrote: that file is read against the link's base (src/link.mjs) */
      JSON.stringify((head.project.linked && head.project.linked.pending) || null)].join("|");
    prunePool(kept, head.draft);
  } catch { look = null; }
  const ownId = look ? String(look.head.draft.id || look.head.project.id || "") : "";
  const D = desks.length ? Engine.deskRules() : null;
  const opened = (doc, file) => (doc && teamKeys ? openedDeskFile(doc, file, teamKeys, Engine.sealRules(), at) : doc);
  /* EVERY FILE IS ASKED AFTER AT ONCE AND READ AT ONCE, where it has to be read at all: on a
     share each question is a round trip, and two hundred of them one after another were most of
     a listing. */
  const keys0 = names.concat(desks.map(d => d[0]));
  const files = names.map(n => path.join(at, n)).concat(desks.map(d => d[1]));
  const stamps = await Promise.all(files.map(f => Promise.all([stampNow(f), stampNow(besideOf(f))])));
  const keys = stamps.map(s => headStamp && s.concat([headStamp]).join("|"));
  const texts = await Promise.all(files.map((f, i) => {
    const was = kept.rows.get(keys0[i]), doc = kept.docs.get(f);
    if (!look || (keys[i] && was && was.key === keys[i]) || (doc && doc.stamp === stamps[i][0]))
      return null;
    /* NO FILE PAST INBOX_MAX IS READ (Grok review kappa, D): the inbox is a folder an agent is given, and a file of gigabytes
       would be held whole on the way into Review. It is listed as refused, by its name. */
    return fs.promises.stat(f).then((st) => (st.size > INBOX_MAX ? TOO_BIG /* plant:k-cap */
    /* Decoded in one piece: readFile's own "utf8" decodes chunk by chunk, and on a long inbox
       that was a quarter of the queue screen's wait. */
      : fs.promises.readFile(f).then(b => b.toString("utf8"))), () => null);
  }));
  const proposals = [];
  const identities = [];
  const flagEntries = [];
  for (let i = 0; i < files.length; i++) {
    const name = path.basename(files[i]), file = files[i], key = keys[i], at0 = keys0[i];
    const was = kept.rows.get(at0);
    /* A desk since removed: its record is a row that says so, and nothing else of its folder is one. */
    const goneId = i >= names.length ? String(at0).split("/")[1] : "";
    const gone = !!goneId && Object.prototype.hasOwnProperty.call(formerly, goneId);
    if (gone && !formerly[goneId][at0]) { kept.rows.delete(at0); continue; } /* plant:f2-queue-after */
    if (key && was && was.key === key) {
      if (was.row) { proposals.push(was.row); identities.push(was.identity || null); flagEntries.push(was.flagEntry || null); }
      continue;
    }
    /* A PAUSE BETWEEN FILES, so that a verb asked for meanwhile is not held behind the rest. */
    await new Promise(r => setImmediate(r));
    let r = null, refusal = null, said = null;
    if (texts[i] === TOO_BIG) {
      const big = refuse("{FILE} is larger than {N} MB, so Etiuda does not read it", { FILE: name, N: INBOX_MAX / (1024 * 1024) });
      proposals.push({ name, file, ok: false, refusal: big.message, said: big.said || null, changes: 0, proposes: null, pending: 0,
        flags: 0, reworded: null, model: null, known: 0, rev: null, edition: null, modified: false });
      identities.push(null); flagEntries.push(null);
      continue;
    }
    /* A DESK'S FILE IS LISTED ONLY AS A PROPOSAL AGAINST THIS CATALOG; anything else there is not a row. */
    const read = look ? docFor(kept, file, stamps[i][0], texts[i]) : null;
    const doc = opened(read, file);
    const desk = i >= names.length ? (() => {
      const d = doc ? deskOf(doc, file, D) : null;
      return d && d.grew && d.grew.id === ownId ? d : null;
    })() : undefined;
    if (desk === null) { if (key) kept.rows.set(at0, { key, row: null }); continue; }
    let deskFlags = [];
    if (desk && doc.flags !== undefined && deskAllowedForFlags(desk.id, gone, teamRoster)) {
      const validated = validateDeskFlags(doc.flags, desk.id, cardIds);
      deskFlags = unsettledDeskFlags(validated.flags, settled);
    }
    try {
      r = await reviewProposal(Object.assign({ project: home, file, rules: [], write: false },
        look || {}, doc ? { proposal: doc } : {}, stamps[i][1] === "-" ? { beside: false } : {},
        desk ? { deskName: deskLabel(desk) } : {}));
    }
    catch (e) { refusal = e && e.message ? e.message : String(e); said = (e && e.said) || null; }
    if (r && !r.ok) { refusal = r.refusal; said = r.said || null; }
    const row = {
      name, file,
      /* THE SENTENCE AND WHAT IT WAS BUILT FROM, both: `refusal` is what the command line
         prints and what an older page would show, `said` is what ui/app.js says in Polish. */
      ok: !!(r && r.ok), refusal: refusal || null, said,
      changes: r && r.ok ? r.changes.length : 0,
      /* THE SAME FOUR COUNTS THE HEAD PANE CARRIES, so that the size and the kind of a waiting
         file are legible without opening it (539's tail). The number of rows above was all the
         list had, and a folder holding one import of thirty-three rows beside one desk's export
         of two said "33" and "2" in a column called Changes, which is true of the second and
         says nothing useful about the first. proposesOf counts rows of this queue and nothing
         else, so these add up to `changes` and nothing is lost by saying them instead. */
      proposes: r && r.ok ? proposesOf(r.changes) : null,
      pending: (r && r.ok ? r.pending.length : 0) + (countFlags ? deskFlags.length : 0),
      flags: deskFlags.length,
      /* HOW MANY REWORDED PASSAGES ARE WAITING IN IT (604). A file the text importer wrote
         is the only one that has any, so the column is empty on every other row rather
         than zero: nothing to read is not the same fact as a model having changed nothing.
         Translated placeholders are deliberately not counted - see attachMarks. */
      reworded: r && r.ok ? r.reworded : null,
      /* THE SERVICE AND MODEL THAT WROTE IT, where the customer's own AI service brought the replies in (board 992, job 1). */
      model: (r && r.ok && r.model) || null,
      known: r && r.ok ? r.known.length : 0,
      rev: r && r.ok && r.proposal.rev != null ? r.proposal.rev : null,
      edition: r && r.ok ? (r.proposal.date || null) : null,
      modified: !!(r && r.ok && r.proposal.modified === true),
      /* WHICH OF THE TWO KINDS OF PROPOSAL THIS IS (539): this project's own catalog come back
         from a desk, or another catalog's cards coming in. The list says it per row because the
         two read differently and a person picking one off a folder of four should not have to
         open it to learn which. */
      foreign: !!(r && r.ok && r.foreign), fromCatalog: (r && r.ok && r.foreignId) || null,
      /* A FILE THE IMPORTER WROTE, a sheet's or a paste's (its report beside it): the review door's "Imported" with `foreign`. */
      imported: !!(r && r.ok && (r.importedFrom || r.paste)),
      /* WHOSE OWN FILE IT IS, where it is a desk's: the name it goes by here and its id. */
      desk: r && r.ok && r.desk ? { id: r.desk.id, name: deskLabel(r.desk) } : null,
      /* THE ORIGINAL'S ID, where this is the file a linked copy's press brought (src/link.mjs). */
      linked: (r && r.ok && r.linked) || null,
    };
    if (gone) row.removed = true; /* plant:f2-queue-mark */
    const identity = desk && doc && typeof doc.id === "string" && doc.id ? desk.id + "\n" + doc.id : null;
    const flagEntry = desk && deskFlags.length ? { deskId: desk.id, deskLabel: deskLabel(desk), deskName: desk.name || "", flags: deskFlags } : null;
    proposals.push(row);
    identities.push(identity);
    flagEntries.push(flagEntry);
    if (key) kept.rows.set(at0, { key, row, identity, flagEntry }); else kept.rows.delete(at0);
  }
  /* A file gone from the inbox, or from a desk's folder, is forgotten with it. */
  const here = new Set(keys0), there = new Set(files);
  Array.from(kept.rows.keys()).forEach(n => { if (!here.has(n)) kept.rows.delete(n); });
  Array.from(kept.docs.keys()).forEach(f => { if (!there.has(f)) kept.docs.delete(f); });
  let out = proposals;
  out = collapseProposals(out, identities); /* plant:f3-one-proposal */
  const keptRows = new Set(out);
  const keptFlags = flagEntries.filter((e, i) => e && keptRows.has(proposals[i]));
  return { inbox: at, proposals: out, flags: aggregateWaitingFlags(keptFlags, cardsById), flagsCounted: countFlags };
}

/* WHAT A ROW IS ABOUT, IN THE WORDS THE CATALOG ITSELF USES (539, the queue being frame E). A
   key is `card:c-refund-late:body.pl`, which is exactly right for reading out over a telephone
   and useless for deciding whether a body should change: the person deciding knows the card by
   its title. The title comes from the working copy where the card is already here and from the
   proposal where it is not, because a card being added has no title here yet. A tag is named by
   its label the same way, and a header row by nothing - it is the catalog itself. */
function rowTitle(head, proposal, c, lang) {
  const pick = (v) => {
    if (v == null) return null;
    if (typeof v === "string") return v;
    return v[lang] != null ? String(v[lang]) : (Object.values(v).find(x => x != null) || null);
  };
  const find = (doc, list, id) => ((doc && doc[list]) || []).find(x => x && String(x.id) === id);
  if (c.scope === "header") return null;
  const id = String(c.id);
  const list = c.scope === "card" ? "cards" : "tags";
  const x = find(head, list, id) || find(proposal, list, id);
  if (!x) return null;
  return c.scope === "card" ? pick(x.title) : pick(x.label) || pick(x.topic) || pick(x.clause);
}

/* WHAT THE FILE PROPOSES, AS FOUR COUNTS, which is the head pane's last column in Claudia's
   frame and the sentence on the Accept all door. They count ROWS OF THIS QUEUE and nothing
   else, so the four of them add up to the number in the lede: a person who reads "9 new cards,
   7 changes, 3 intents, 4 categories" and then counts twenty-three rows has been told the
   truth twice. Removals and header rows are counted too, and are always zero for a file from
   another catalog - see proposalChanges - which is why they are not in the frame. */
function proposesOf(changes) {
  const n = (f) => changes.filter(f).length;
  return {
    cards: n(c => c.scope === "card" && c.op === "add"),
    changes: n(c => c.scope === "card" && (c.op === "change" || c.op === "move")),
    intents: n(c => c.scope === "tag" && c.op === "add" && c.kind === "request"),
    cats: n(c => c.scope === "tag" && c.op === "add" && c.kind === "shelf"),
    tagChanges: n(c => c.scope === "tag" && c.op === "change"),
    removed: n(c => c.op === "remove"),
    header: n(c => c.scope === "header"),
  };
}

/* WHETHER THIS ROW'S BODY IS CUT AT ITS MARKS (604). Every body is shown whole (rowSides), so
 * the offsets land on the string the screen shows. A row with a `path` is never marked: a text
 * import writes a catalog with its own id, so every card it proposes is an ADD.
 */
function marksShown(c, lang, marks) {
  return !!(c.scope === "card" && c.op === "add" && c.path == null
            && marks && marks[lang] && marks[lang].length);
}

/* WHAT THE TWO SIDES OF A ROW SAY, WHOLE: a row is accepted whole, so nothing in it is cut.
 *
 * A ROW WITH NO PATH IS A WHOLE CARD OR A WHOLE TAG arriving or leaving, and the document it is
 * made of is not what a person decides about: a card coming in showed eighty characters of
 * `{"id":"...","shelf":"...","title":{"en":...` and a thirty-three row import was thirty-three
 * of those. Such a side says the thing the way the rest of the interface says it - a card is
 * its body in the reading language, as the cards table reads it; an intent is its clause and a
 * category its label, as the tags table does - and the title is not repeated here because the
 * row's own first column already carries it.
 *
 * A ROW WITH A PATH IS A FIELD AND ITS VALUE IS A VALUE: a string is itself, and a field holding
 * a list or a block shows the document it is, because there is nothing else it could show.
 *
 * ABSENT AND EMPTY ARE TWO ANSWERS AND THE MODULE DISTINGUISHES THEM: null where the side is
 * not there at all, "" where it is there and has no text in this language. The screen has a
 * word for each, in both languages, where `excerpt`'s own "(absent)" is English and belongs to
 * the command line that prints it.
 */
function rowSides(c, lang, marks) {
  const inLang = (v) => {
    if (v == null) return "";
    if (typeof v === "string") return v;
    return String(v[lang] != null ? v[lang] : "");
  };
  if (c.path == null) {
    const say = (v) => {
      if (v === undefined || v === null) return null;
      return inLang(c.scope === "card" ? v.body : (c.kind === "request" ? v.clause : v.label));
    };
    return [say(c.from), say(c.to)];
  }
  const side = (v) => (v === undefined ? null : typeof v === "string" ? v : JSON.stringify(v));
  return [side(c.from), side(c.to)];
}

/* THE REST OF THE WORDS A WHOLE CARD OR TAG CARRIES, for a row with no path: the side shows the
 * body (or clause, or label) in the reading language and the first column its title, and an add
 * or a removal accepts every language of every field. Settings and references to ids are not
 * words and are left out; a card's category is named by its label. Each is {field, lang, text}.
 */
/* `src` is the converter's note of where a card came from, carried and never a word; `address` is a card's form
   of address, a setting the engine names; and any key on a card the pinned engine does not name is carried whole and
   is none either (`named`). */
const NOT_WORDS = ["id", "kind", "icon", "bodyShape", "lockLang", "src", "address"];
function alsoOf(c, lang, head, proposal, named) {
  if (c.path != null || c.scope === "header") return null;
  const unnamed = (f) => c.scope === "card" && named && named.card.indexOf(f) < 0;
  const v = c.op === "remove" ? c.from : c.to;
  if (!v || typeof v !== "object") return null;
  const shown = c.scope === "card" ? ["title", "body"]
    : ["label", c.kind === "request" ? "clause" : "label"];
  const out = [];
  const first = shown.filter((f) => f in v);
  first.concat(Object.keys(v).filter((f) => first.indexOf(f) < 0)).forEach((f) => {
    const x = v[f];
    if (NOT_WORDS.indexOf(f) >= 0 || unnamed(f)) return;
    if (f === "shelf" && c.scope === "card") {
      const tag = rowTitle(head, proposal, { scope: "tag", id: x }, lang);
      if (tag) out.push({ field: f, lang: null, text: tag });
      return;
    }
    if (typeof x === "string") { if (x.trim()) out.push({ field: f, lang: null, text: x }); return; }
    if (!x || typeof x !== "object" || Array.isArray(x)) return;
    Object.keys(x).forEach((l) => {
      if (typeof x[l] !== "string" || !x[l].trim()) return;
      if (l === lang && shown.indexOf(f) >= 0) return;
      out.push({ field: f, lang: l, text: x[l] });
    });
  });
  return out.length ? out : null;
}

/** One proposal as rows a person decides, each carrying the key the command line prints.
 *  `o.lang` is the screen's reading language, where it names one the catalog declares. */
async function openProposal(dir, file, o) {
  const home = path.resolve(dir);
  const at = path.resolve(file);
  const p = readProject(home);
  const r = await reviewProposal({ project: home, file: at, rules: [], write: false, teamKeys: (o && o.teamKeys) || null,
    inbox: path.join(home, INBOX) });
  const name = path.basename(at);
  if (!r.ok) return { ok: false, refusal: r.refusal, said: r.said || null, file: at, name };
  const known = new Set(r.known.map(k => k.c.key));
  const head = p.draft;
  const named = Engine.namedFields();
  /* THE READING LANGUAGE IS A CODE, and `langs` is a list of {code, label}: this line handed
     rowTitle the whole entry, which is not a key of any title, and its pick() fell back to
     whichever language came first in the card. That was English by accident on every catalog
     the importer writes. primaryOf is the answer the rest of this module already uses. */
  const want = o && o.lang ? String(o.lang) : "";
  const lang = want && (head.langs || []).some(l => l && l.code === want) ? want : primaryOf(head);
  return {
    ok: true, file: at, name, notes: r.notes,
    draftAt: r.draftAt,
    model: (r && r.ok && r.model) || null,
    /* THE FILE THE PERSON IMPORTED, where Studio's importer wrote this one (items 18 and 42):
       the head pane says it and the attribution field starts from it. */
    importedFrom: r.importedFrom || null,
    /* A paste, so the queue can say so beside the file's own name. Absent is not a paste. */
    paste: !!r.paste,
    /* A DESK'S OWN FILE: the name it goes by, which the attribution field starts from. */
    desk: r.desk ? { id: r.desk.id, name: deskLabel(r.desk) } : null,
    deskName: r.desk ? deskLabel(r.desk) : null,
    /* The head pane's four facts. `fromCatalog` is null where the file is this project's own
       catalog come back from a desk, and the pane says so in its own words rather than showing
       an empty cell. */
    foreign: !!r.foreign, fromCatalog: r.foreignId || null,
    edition: r.proposal.date || null,
    rev: r.proposal.rev == null ? null : r.proposal.rev,
    proposes: proposesOf(r.changes),
    /* WHAT THE ACCEPT ALL DOOR TICKS: every row not decided in an earlier review and not held
       back by src/review.mjs's classify. */
    waiting: proposesOf(r.changes.filter(c => !known.has(c.key) && !c.conflict)),
    /* HOW MANY REWORDED PASSAGES THE WHOLE FILE CARRIES, which is the list's own column and is
       counted in src/review.mjs over the rows of this queue. */
    reworded: r.reworded || 0,
    changes: r.changes.map(c => {
      const [was, becomes] = rowSides(c, lang, c.marks);
      const mine = marksShown(c, lang, c.marks) ? c.marks[lang] : null;
      const cardLang = (c.to && c.to.body && Object.keys(c.to.body)[0]) || (c.to && c.to.title && Object.keys(c.to.title)[0]) || lang || "en";
      return { key: c.key, op: c.op, scope: c.scope, kind: c.kind || null, id: c.id,
               path: c.path, title: rowTitle(head, r.proposal, c, lang),
               was, becomes, decided: known.has(c.key), conflict: !!c.conflict,
               also: alsoOf(c, lang, head, r.proposal, named),
               cardLang, origLang: cardLang, to: copyOf(c.to),
               /* THE LANGUAGE THE SIDE IS IN, so the press that puts a passage back can name
                  the body it belongs to without the page guessing which one it read. */
               lang: mine ? lang : null,
               /* THE BODY ALREADY CUT AT THE MARKS. The page cannot import this module and
                  Studio's CSP gives it no way to fetch one, so the cutting happens here; and
                  because a segment carries the words it replaced, a press that puts one back is
                  a swap in the page rather than a second implementation of revertMark in it.
                  `i` is the mark's place in the row's own list, which is what the writing verb
                  below takes. */
               segs: mine ? segsOf(becomes, mine) : null,
               marks: mine ? mine.map(m => ({ at: m.at, len: m.len, kind: m.kind })) : null,
               spliced: c.spliced || null, unread: c.unread || null };
    }),
    pending: r.pending.length, decidedBefore: r.known.length,
    /* A NEWER DESK'S minEngine, AND A FIELD THIS STUDIO DOES NOT KNOW, SAID ONCE BEFORE THE
       FILE IS ARCHIVED. engine is the pin's own version. aboveEngine is that version below the
       proposal's minEngine, by major, minor and patch. unknownHead is a top-level field outside
       the known header. It is not copied onto the draft. Where both apply, the screen says so
       once. */
    minEngine: r.proposal.minEngine == null ? null : r.proposal.minEngine,
    engine: Engine.engineVersion(),
    aboveEngine: versionBelow(Engine.engineVersion(), r.proposal.minEngine) === true, /* plant:u7-above */
    unknownHead: unknownHeadKeys(r.proposal, named.head).length > 0, /* plant:u7-head */
  };
}

/** One body cut into the runs a highlighter paints, each marked run carrying the words it
 *  replaced and its place in the row's list of marks. */
function segsOf(text, list) {
  let i = -1;
  return markSegments(text, list).map(s => s.mark
    ? { text: s.text, was: String(s.mark.was == null ? "" : s.mark.was),
        kind: String(s.mark.kind || "reword"), i: ++i }
    : { text: s.text, i: null });
}

/** The refusal of a press made in a view the file has moved on from; ui/app.js knows it by this frame and reads the file again. */
const PRESS_MOVED_ON = "Nothing was put back: this passage changed in another window after it was shown here. It now shows as it stands, and pressing it again puts that back.";

/**
 * ONE PRESS, WRITTEN: the named marks put back and the proposal rewritten with the file's own
 * words in their place. The sibling of decideProposal, and it runs BEFORE it.
 *
 * WHY IT WRITES THE PROPOSAL AND NOT THE WORKING COPY. Nothing is written into the catalog
 * until the rows are landed, which is what the screen promises in those words, and a revert is
 * not a decision: it changes what the proposal proposes. So the file in the inbox is rewritten
 * and the queue then offers exactly what a person chose to accept. The page holds the presses
 * in session state and calls this once, at Land, the way it holds the ticks (Claudia,
 * 2026-09-21).
 *
 * @param reverts  [{card, lang, marks: [i]}], `i` being the mark's place in the sorted list the
 *                 report holds for that body - the same `i` openProposal put on the segment.
 *
 * HIGHEST INDEX FIRST, which is revertBody's own order and the reason it is right: a mark put
 * back moves every mark AFTER it and leaves every mark before it where it was, so taking them
 * from the end makes a set of presses a set rather than a sequence.
 *
 * THE REFUSALS HERE ARE PLAIN ERRORS ON PURPOSE, EXCEPT ONE. Every plain one says the program asked for
 * something the file it was handed a moment ago does not have - a card, a language or a mark
 * that is not in it - and the page builds this call only out of rows this module gave it. There
 * is no sentence a person could act on, which is the test src/refusal.mjs sets. The exception is
 * PRESS_MOVED_ON: a person pressed a passage in a view that another window or program has since
 * moved on from, and there is a sentence they can act on (the view reads the file again; press again).
 */
async function revertProposalMarks(dir, file, reverts) {
  const home = path.resolve(dir);
  const at = path.resolve(String(file || ""));
  const want = (Array.isArray(reverts) ? reverts : [])
    .filter(w => w && ((Array.isArray(w.marks) && w.marks.length) || (w.toLang && w.toLang !== w.lang)));
  if (!want.length) return { ok: true, reverted: 0, wrote: [] };
  if (path.dirname(at) !== path.join(home, INBOX))
    throw new Error("a proposal is reverted where it waits, in " + path.join(home, INBOX)
      + ", and this file is at " + at);
  const lintAt = at.replace(/\.(ec|json)$/i, "") + ".lint.json";
  if (!fs.existsSync(at) || !fs.existsSync(lintAt))
    throw new Error("a mark is put back out of the report the text importer wrote beside the"
      + " proposal, and one of the two is missing: " + at + ", " + lintAt);
  const catalog = JSON.parse(fs.readFileSync(at, "utf8"));
  const report = JSON.parse(fs.readFileSync(lintAt, "utf8"));
  let reverted = 0;
  want.forEach(w => {
    const id = String(w.card), lang = String(w.lang);
    const card = (catalog.cards || []).find(c => c && String(c.id) === id);
    if (!card || !card.body) throw new Error("no card " + id + " in " + path.basename(at));
    const entry = (report.marks || []).find(m => m && String(m.card) === id
                                                && String(m.lang) === lang);
    /* A PASSAGE NAMED BY ITS WORDS, AND THE BODY IT WAS READ IN (board 1016 item 7, the test architect's N1): the page sends
       each mark as {text, was, n}, the n-th marked run of the body reading `text` where the file had `was`, with `seen`, the
       body those runs were read in. A call whose body has moved on since (`seen` no longer the body) was written already
       and changes nothing; a run no longer marked is not looked for under another's index. So the same call made twice, by
       any route, leaves the body as one call does. A bare index is the command line's older form and is taken as it was. */
    const named = (w.marks || []).filter(m => m && typeof m === "object");
    const body0 = String(card.body[lang] == null ? "" : card.body[lang]);
    const stale = named.length > 0 && w.seen != null && String(w.seen) !== body0; /* plant:rv-seen */
    /* A PRESS THE FILE HAS MOVED ON FROM IS SKIPPED, AND SAID WHEN THE PASSAGE IS STILL THERE (the test architect's R2): a view read
       before another window wrote presses a passage the file still marks, and answering ok with nothing put back lost the
       press without a word. Refused before anything is written, so the view reads the file again and the person presses again.
       A passage already put back, by the other window or by the half of a write that landed, is not marked any more and
       stays answered as it was. */
    const marked = (m) => entry.marks.some(x => body0.slice(x.at, x.at + x.len) === String(m.text)
      && String(x.was == null ? "" : x.was) === String(m.was == null ? "" : m.was));
    const stillMarked = stale && !!entry && Array.isArray(entry.marks) && named.some(marked); /* plant:rv-said */
    if (stillMarked)
      throw refuse(PRESS_MOVED_ON); /* Words: placeholder. */
    if (w.marks && w.marks.length && !stale && !(named.length === w.marks.length && (!entry || !Array.isArray(entry.marks)))) {
      if (!entry || !Array.isArray(entry.marks))
        throw new Error("no marks on " + id + " in " + lang + " in " + path.basename(lintAt));
      let text = body0;
      let list = entry.marks.slice().sort((a, b) => a.at - b.at);
      const targets = [];
      named.forEach(m => {
        const same = list.filter(x => text.slice(x.at, x.at + x.len) === String(m.text)
          && String(x.was == null ? "" : x.was) === String(m.was == null ? "" : m.was));
        const t = same[Math.max(0, m.n | 0)];
        if (t && targets.indexOf(t) < 0) targets.push(t);
      });
      Array.from(new Set(w.marks.filter(m => typeof m !== "object").map(Number)))
        .filter(i => Number.isInteger(i) && i >= 0).forEach(i => {
          if (i >= list.length)
            throw new Error("mark " + i + " of " + id + " in " + lang + ": the body has "
              + list.length);
          if (targets.indexOf(list[i]) < 0) targets.push(list[i]);
        });
      /* LAST FIRST, which is revertMark's own order: a run put back moves every run after it, and none before. */
      targets.sort((a, b) => b.at - a.at).forEach(t => {
        const r = revertMark(text, list, list.indexOf(t));
        text = r.text; list = r.marks; reverted++;
      });
      card.body[lang] = text;
      entry.marks = list;
    }
    if (w.toLang && w.toLang !== lang) {
      const toL = String(w.toLang);
      /* A language moves only on a card in one language and only to a language code the card does not hold: on a card the
         model gave in two languages, moving one over the other would lose a reply without a sign. */
      if (!LANG_CODE.test(toL)) throw new Error("no language code for " + id + ": " + JSON.stringify(toL));
      const held = Object.keys(card.body).filter(l => card.body[l] != null);
      if (held.length > 1)
        throw new Error(id + " is in " + held.join(" and ") + ", so its language is not moved to " + toL);
      if (card.body[toL] != null) throw new Error(id + " already has " + toL + ", so " + lang + " is not moved over it");
      if (card.body && card.body[lang] != null) {
        card.body[toL] = card.body[lang];
        delete card.body[lang];
      }
      if (card.title && card.title[lang] != null) {
        card.title[toL] = card.title[lang];
        delete card.title[lang];
      }
      if (entry) entry.lang = toL;
      (report.splices || []).forEach(s => {
        if (s && String(s.card) === id && String(s.lang) === lang) s.lang = toL;
      });
    }
  });
  /* A REVERTED SPAN IS NOT A CHANGE ANY MORE, so its mark goes; `counts` is the import's own
     record of what it proposed on the day and does not move, which is why the two can differ
     and why the report says so itself. */
  report.marks = (report.marks || []).filter(m => m && m.marks && m.marks.length);
  report.reverted = (+report.reverted || 0) + reverted;
  report.revertRule = "marks put back from the review queue since the import ran. `counts` is"
    + " the import's record of what it proposed and does not move; `marks` is what is still a"
    + " change and does.";
  /* THE HASH OF WHAT IT NOW HOLDS, exactly as reviewProposal recomputes the draft's: a catalog
     carrying the hash of what it used to be is a file the engine's reader calls broken. A
     signature over the old bytes goes with it. */
  const F = await Engine.format();
  delete catalog.hash; delete catalog.sig;
  catalog.hash = F.contentHash(catalog);
  /* EACH FILE IS REPLACED WHOLE, the proposal first and its report after (the test architect's P2): a write cut off leaves either file as it was, never truncated. Where the second fails after the first
     landed, a call sent again finds the body moved on from what it read (`seen`, above) and changes nothing, and a press
     named by its words is never looked for at another passage's place, so a half-landed pair is never put back twice. */
  writeWhole(at, json(catalog));
  writeWhole(lintAt, json(report));
  return { ok: true, reverted, wrote: [at, lintAt], hash: catalog.hash };
}

/** The ticks, as the rules `node tools/review.mjs` would have been given. `o.teamKeys` opens a desk's sealed file. */
async function decideProposal(dir, file, decisions, from, note, o) {
  const teamKeys = (o && o.teamKeys) || null;
  const home = path.resolve(dir);
  const d = decisions || {};
  /* Sorted by key, which changes no outcome - the patterns are exact and share no key, so the
     last-match rule never fires - and makes the call the screen builds reproducible. */
  const rules = Object.keys(d).sort()
    .filter(k => d[k] === "accept" || d[k] === "reject")
    .map(k => ({ verb: d[k], pattern: k }));
  const deskName = (() => {
    try { let doc = readCatalogDocument(path.resolve(file));
          if (teamKeys) doc = openedDeskFile(doc, file, teamKeys, Engine.sealRules(), path.join(home, INBOX));
          const dk = deskOf(doc, file, Engine.deskRules());
          return dk ? deskLabel(dk) : null; } catch { return null; }
  })();
  const r = await reviewProposal({ project: home, file: path.resolve(file), rules,
    from: typeof from === "string" ? from : null, deskName, teamKeys, inbox: path.join(home, INBOX),
    note: typeof note === "string" ? note : null, write: true });
  if (!r.ok) return { ok: false, refusal: r.refusal, said: r.said || null };
  /* A FILE WITH NOTHING LEFT WAITING LEAVES THE INBOX (item 19), and only a file in this
     project's inbox: a review of a file somewhere else moves nothing that is not the project's. */
  const at = path.resolve(file);
  /* The proposal file is archived by rename, so its bytes stay its own. An unknown field is
     not copied onto the draft on the way. */
  const decidedTo = !r.pending.length && path.dirname(at) === path.join(home, INBOX)
    && fs.existsSync(at) ? putAway(home, at) : null;
  return { ok: true, applied: r.applied, skipped: r.skipped,
           accepted: r.accepted.map(c => c.key), rejected: r.rejected.map(c => c.key),
           pending: r.pending.map(c => c.key), wrote: r.wrote, decidedTo };
}

/* ---- a linked copy, and the one press that brings it up to its original (src/link.mjs) ------------------------------- */

/** A linked copy of the catalog at `dir`, beside it in its root, opened as New project opens one. */
async function makeLinkedCopy(dir, o) {
  const r = await Link.linkedCopy(dir, { claim: claimProjectDir, newId: newCatalogId, name: o && o.name, root: o && o.root });
  return openProject(r.dir, o);
}
/** The copy's link as the details screen shows it, or null. */
async function linkedState(dir, o) { return Link.linkState(dir, o); }
/** "Bring up to the original": the original's latest published edition into the inbox, for the review; o.followed for a copy
 *  taken from a followed team's catalog. */
async function bringUpToOriginal(dir, o) { return Link.bringUp(dir, o); }
/** "Take as a base" (board 962, stage 7, V3): a catalog of this Studio's own from the newest edition of `catalog` in the team it
 *  follows, opened as New project opens one, with `inUse` beside it for the shell's in-use file. */
async function takeBase(catalog, o) {
  const r = await Link.baseCopy(catalog, { followed: o && o.followed, claim: claimProjectDir, newId: newCatalogId, name: o && o.name, root: o && o.root });
  return Object.assign(await openProject(r.dir, o), { inUse: r.inUse });
}

/* ---- the archive, and what changed between two editions ----------------------------------------
 *
 * THE ARCHIVE IS THE RETENTION FEATURE (spec 3.2) and until now the screen could only count it.
 * Three acts make it worth keeping: read the timeline, see what changed between any two of its
 * editions, and take one out as a file. The third is the rollback path the spec names - the
 * engine handles a rollback by being handed an earlier catalog, so Studio's whole part in it is
 * to hand over bytes it has kept.
 *
 * NOTHING HERE RE-READS A CATALOG ITS OWN WAY. The editions are `editionsIn`, the catalog of one
 * is `archivedCatalog`, and the comparison is `diffCatalogs` with the pinned engine's canonical
 * form - the same three the command line uses, in the same order, which is what lets
 * tests/archive-screen.mjs hold the diff on the screen and the diff at the command line to the
 * same lines. src/diff.mjs says at length why a textual diff of two format 2 files is useless.
 *
 * AN EXPORT IS A COPY AND NOT A RE-SERIALISATION. The archived catalog.ec is written out byte
 * for byte, because it is the file that was published: a catalog rebuilt from its own parse
 * would carry this program's idea of the formatting and a different hash the day either
 * changes, and the one thing a rollback must not do is hand a desk a file that is nearly the
 * one it had.
 */
function editionNotes(at) {
  try { return fs.readFileSync(path.join(at, NOTES_IN_ARCHIVE), "utf8").trim(); }
  catch { return ""; }
}

function archiveTimeline(dir) {
  const home = path.resolve(dir);
  const eds = editionsIn(home);
  const editions = eds.map(edition => {
    const at = path.join(home, ARCHIVE, edition);
    let report = null;
    try { report = readJson(path.join(at, REPORT_IN_ARCHIVE)); } catch { report = null; }
    /* An archive written before the report existed, or one somebody copied in by hand, still
       has its catalog: the counts come off that rather than being left blank. */
    let counts = report && report.counts ? report.counts : null;
    let rev = report ? report.rev : null;
    if (!counts || rev == null) {
      try {
        const cat = archivedCatalog(home, edition);
        counts = counts || countsOf(cat);
        if (rev == null) rev = Number.isFinite(+cat.rev) ? +cat.rev : null;
      } catch { /* an edition folder with no catalog in it is listed and says nothing */ }
    }
    return {
      edition, rev, counts: counts || null,
      hash: report ? report.hash : null,
      lint: report ? report.lint : null,
      override: report ? report.override : null,
      notes: editionNotes(at),
      at, file: path.join(at, CATALOG_IN_ARCHIVE),
    };
  });
  return { dir: home, editions };
}

/** Two archived editions, compared over the format's own structure. */
async function diffEditions(dir, a, b) {
  const home = path.resolve(dir);
  const have = editionsIn(home);
  for (const e of [a, b]) if (have.indexOf(e) < 0)
    throw refuse("the archive at {P} has no edition {E}; it has {LIST}",
      { P: path.join(home, ARCHIVE), E: e, LIST: have.join(", ") || "none" });
  const F = await Engine.format();
  const d = diffCatalogs(archivedCatalog(home, a), archivedCatalog(home, b), F.canonical,
    { values: true });
  const cuts = [];
  const lines = diffLines(d, { values: true, width: 70, cuts });
  /* The lines AND the same lines in three columns (board 479). Both, because the columns are
     parsed from the lines and a reader of either has to be able to check one against the other -
     which is what tests/archive-screen.mjs does against `node tools/diff.mjs`. */
  return { a, b, same: d.same, summary: summary(d), lines, rows: diffRows(lines, cuts) };
}

/** One archived edition, written where the person chose, byte for byte. */
function exportEdition(dir, edition, to, o) {
  const home = path.resolve(dir);
  if (editionsIn(home).indexOf(edition) < 0)
    throw refuse("the archive at {P} has no edition {E}",
      { P: path.join(home, ARCHIVE), E: edition });
  const from = path.join(home, ARCHIVE, edition, CATALOG_IN_ARCHIVE);
  if (!fs.existsSync(from)) throw refuse("no archived catalog file at {P}", { P: from });
  const at = path.resolve(String(to || ""));
  if (!at || at === from) throw refuse("an export needs a file to write, and not the archived"
    + " copy itself");
  /* The archive's copy is the plain one, which is the lead's to export (the ledger's item 6), but never into the folder this
     project publishes to sealed. */
  const found = projectAt(home), folder = found && found.project.sealedTeam && folderHere(found.project, o);
  if (folder && insideOf(folder, [at]))
    throw refuse("{FOLDER} is where this catalog publishes sealed, and a plain copy there would be read by anyone;"
      + " nothing was written.", { FOLDER: path.resolve(folder) });
  fs.copyFileSync(from, at);
  return { file: at, from, bytes: fs.statSync(at).size };
}

/* ---- a whole edition taken back into the draft (the outside review of 2026-10-21, its item 1) ----
 *
 * THE ROLLBACK GOES FORWARD. An export hands a desk an earlier file, which a desk that already holds a later rev
 * does not take as news; this puts the earlier content into the draft instead, so the next Publish sends it as a
 * new edition with the next rev, sealed or through the relay as every publish is. The archive is only read.
 *
 * ONE CHANGE, THROUGH changeMany, so the undo bar takes it back byte for byte and the Changes list holds it as one
 * entry; the changes the draft held since the last edition are in that snapshot and that entry, never lost.
 *
 * THE CONTENT IS THE EDITION'S WHOLE, its languages included: its cards are written in its languages, so a draft that
 * kept a language the edition lacks would hold every card as awaiting it. What stays the draft's own is what says
 * which catalog this is and what a publish stamps on it: the id, the rev and date (the publisher counts past the
 * project's rev and the archive's, never from these), and the lead's note, which belongs to the edition it went out
 * with. The hash and the signature are withDraft's to write over what the draft now holds, and the evaluation
 * mark is the edition's stamp, so the draft does not keep it. project.json is not
 * touched beyond withDraft's edited stamp, so the file name, the folder, the team and the sealing stay as they were.
 */
const OWN_ON_ROLLBACK = ["id", "rev", "date", "notes"];

async function restoreEdition(dir, edition) {
  const home = path.resolve(dir);
  const have = editionsIn(home), want = String(edition == null ? "" : edition);
  if (have.indexOf(want) < 0)
    throw refuse("the archive at {P} has no edition {E}; it has {LIST}",
      { P: path.join(home, ARCHIVE), E: want, LIST: have.join(", ") || "none" });
  const kept = archivedCatalog(home, want);
  const rev = editionHead(home, want, kept).rev;
  return changeMany(dir, (draft, F) => {
    const own = {};
    OWN_ON_ROLLBACK.forEach((k) => { if (k in draft) own[k] = draft[k]; });
    const next = JSON.parse(JSON.stringify(kept));
    OWN_ON_ROLLBACK.forEach((k) => { if (k in own) next[k] = own[k]; else delete next[k]; });
    delete next.hash; delete next.sig; delete next.evaluation;
    const bare = Object.assign({}, draft);
    delete bare.hash; delete bare.sig; delete bare.evaluation;
    if (F.canonical(undatedDoc(bare)) === F.canonical(undatedDoc(next))) return { refused: "no changes" };
    Object.keys(draft).forEach((k) => { delete draft[k]; });
    Object.assign(draft, next);
    return { did: { kind: "rollback", edition: want, rev }, restored: want, rev };
  });
}

/* ---- the audit pack ---------------------------------------------------------------------------
 *
 * TWO VERBS AND NEITHER OF THEM KNOWS ANYTHING. The whole account of an edition is src/audit.mjs,
 * so the screen and `node tools/audit.mjs` read the same walk over the same archive and can be
 * held to the same rows; what this file adds is the two things only a running Studio knows - which
 * edition is meant when nobody named one, and where this copy's signing key file is.
 *
 * THE KEY IS READ FOR ITS PUBLIC HALF AND NOTHING ELSE, exactly as the Settings row reads it: the
 * pack states which key signed the catalog and carries that key's public half so a stranger can
 * check the signature, and no passphrase is asked for anywhere on this path.
 */
function auditEdition(dir, edition, keyFile, o) {
  const home = path.resolve(String(dir || ""));
  const have = editionsIn(home);
  if (!have.length) throw refuse("nothing has been published from {P} yet, so there is no"
    + " edition to account for", { P: home });
  const want = String(edition || "") || have[have.length - 1];
  const opts = o || {};
  return auditFor(home, want, { keyFile: keyFile || null, userData: opts.userData, teamsFile: opts.teamsFile });
}

async function exportAuditPack(dir, edition, to, keyFile, o) {
  const home = path.resolve(String(dir || ""));
  const at = String(to || "");
  if (!at) throw refuse("an audit pack needs a folder to write");
  const pack = await auditEdition(home, edition, keyFile, o);
  return writePack(home, pack.edition, at, { keyFile: keyFile || null, pack });
}

/* ---- the intents and the categories -----------------------------------------------------------
 *
 * ONE VERB PER ACT, THE DRAFT REWRITTEN WHOLE AND THE HASH LAST, exactly as saveCard does, and
 * through the same engine door: a file Studio writes is a file the pinned engine would have
 * written, and there is no second writer anywhere in this repository.
 *
 * THE TWO BREEDS ARE ONE TABLE WITH TWO NAMES FOR THEIR TEXT. A shelf carries `label`, a request
 * carries `clause`, and the pinned reader refuses a request with no clause in the primary
 * language (catalog-v2.js, v2Problems), so an empty primary name is refused here rather than
 * written and discovered by a desk.
 *
 * THE ID NEVER FOLLOWS THE NAME. It is minted once, from the name, by the pinned format's own
 * tagId, and a rename leaves it exactly as it was. The id is what a card's `shelf` and
 * `requests` point at, what the engine's personal layer has been keyed by since its item 340,
 * and what a diff against an earlier edition matches on; a rename that moved it would silently
 * orphan every desk's own notes about that intent and every card's link to it.
 *
 * ORDER IS CONTENT, for a request. The runtime links an intent BY POSITION - catalogFromV2
 * builds index-aligned arrays out of the request tags in file order - so the order here is the
 * order a desk shows them in, and moving one moves it on every desk at the next publish. A
 * move swaps two slots of the SAME KIND and leaves every other slot where it was, so reordering
 * the intents cannot disturb the categories.
 *
 * A TAG IN USE IS NOT DELETED, IT IS REFUSED, and the refusal carries the cards rather than a
 * count: the person has to go to them, so the screen needs their ids to offer the journey. A
 * card with no shelf is a card the pinned reader refuses outright ("shelf absent"), so deleting
 * a category out from under one would write a file no desk could load.
 */
const TEXT_OF = { shelf: "label", request: "clause" };


/** Every card that names this tag, by the format's own two rules. */
function cardsUsing(draft, tag) {
  const primary = primaryOf(draft);
  return (draft.cards || [])
    .filter(c => tag.kind === "shelf" ? c.shelf === tag.id
                                      : (c.requests || []).indexOf(tag.id) >= 0)
    .map(c => ({ id: c.id, title: String((c.title || {})[primary] || c.id) }));
}

/** An id nothing else in this catalog claims. The format allows 64 characters, so the suffix is
 *  cut into the slug rather than appended past the limit. */
function freeId(draft, base) {
  const taken = new Set((draft.tags || []).map(t => t.id)
    .concat((draft.cards || []).map(c => c.id)));
  if (!taken.has(base)) return base;
  for (let n = 2; n < 1000; n++) {
    const suffix = "-" + n;
    const id = base.slice(0, 64 - suffix.length) + suffix;
    if (!taken.has(id)) return id;
  }
  throw refuse("a thousand intents and categories already have an id made from {BASE}; a name with different letters makes a new one, since capitals, accents and punctuation do not count", { BASE: JSON.stringify(base) });
}

/* The one read-change-write for every verb below. A function that throws leaves the file exactly
   as it was, because nothing is written until it has returned; a function that answers a refusal
   returns it to the screen with the draft untouched. */
function withDraft(dir, act, o) { return unlessStale(dir, () => withDraftOnce(dir, act, o)); }
async function withDraftOnce(dir, act, o) {
  const home = path.resolve(dir);
  const found = projectAt(home);
  if (!found) throw refuse("no catalog in {DIR}", { DIR: home });
  const draftAt = path.join(home, found.draftName);
  const seen = {};
  const draft = readOrRefuse(draftAt, seen);
  /* The bytes read on THIS attempt, for a caller that keeps them as the draft's before-state (changeMany's Undo): a retry overwrites
     them, so what is kept is what the landed write was made from, never what a first, stale attempt read (the test architect's H1). */
  if (o && o.seen) o.seen.raw = seen.raw; /* plant:esv-undo-landed */
  const F = await Engine.format();
  const before = o && o.journal === false ? null : JSON.parse(JSON.stringify(draft));
  const out = act(draft, F) || {};
  if (out.refused) return Object.assign({ dir: home }, out);
  delete draft.hash; delete draft.sig;
  draft.hash = F.contentHash(draft);
  /* `o.exact` is the bytes to write, where the caller has them whole (undoBulk's): written under the same lock and compare as any save. */
  writeWhole(draftAt, o && o.exact ? o.exact : json(draft), { was: seen.raw });
  if (before) journal(home, out.did || null, before, draft, F);
  const edited = new Date().toISOString();
  writeProject(home, Object.assign({}, found.project,
    { draft: found.draftName, id: draft.id, edited }));
  /* THE AWAITING STATE TRAVELS WITH EVERY VERB THAT TOUCHES THE DRAFT, not with the save alone:
     a new card in a two-language catalog is a card awaiting the second one from the moment it
     exists, and a rail that dropped the state on New card would have counted differently
     depending on which act a person had last performed. */
  const awaits = await awaitingFor(draft);
  return Object.assign({ refused: null, dir: home, tags: draft.tags || [], looks: looksOf(draft), changes: await changesCount(home),
    counts: countsOf(draft), langs: langState(draft, home),
    lint: findings(draft, awaits.classed, awaits.rows, found.project.notPromises, found.project.endsMeant,
      found.project.findingsLeft, found.project.changedNumbers),
    awaiting: awaits.rows, hash: draft.hash, edited }, out);
}

/** The text of a tag, trimmed, and refused when the primary language is empty. */
function textFor(draft, kind, text, was) {
  const primary = primaryOf(draft);
  const out = Object.assign({}, was || {});
  for (const code of Object.keys(text || {})) {
    const v = String(text[code] == null ? "" : text[code]).trim();
    if (v) out[code] = v; else delete out[code];
  }
  /* TWO FRAMES AND NOT ONE WITH THE NOUN AS A VARIABLE. The noun takes an article in English
     and a gender in Polish, and the sentence built by concatenation had been saying "a intent"
     since it was written. */
  if (!out[primary]) throw refuse(kind === "shelf"
    ? "a category needs a name in {LANG}, the primary language this catalog declares"
    : "an intent needs a name in {LANG}, the primary language this catalog declares",
    { LANG: primary });
  return out;
}

async function addTag(dir, kind, text) {
  if (kind !== "shelf" && kind !== "request")
    throw new Error("a tag is a shelf or a request, not " + JSON.stringify(kind));
  return withDraft(dir, (draft, F) => {
    const body = textFor(draft, kind, text, null);
    const id = freeId(draft, F.tagId(body[primaryOf(draft)]));
    if (!F.idOk(id)) throw refuse(ID_REFUSAL,
      { TEXT: JSON.stringify(body[primaryOf(draft)]), ID: JSON.stringify(id) });
    const tag = { id, kind };
    tag[TEXT_OF[kind]] = body;
    draft.tags = (draft.tags || []).concat([tag]);
    return { tag };
  });
}

/* ---- one save verb for a tag (board 1018, piece A) --------------------------------------------
 *
 * EVERY FIELD THE FORMAT CARRIES FOR A TAG IS WRITTEN HERE, and a rename is this verb with the name alone. An intent
 * carries its `clause` (the name the primary requires, by textFor), a `topic` and a comment `action`, each by language; a
 * category its `label`, an `icon`, a `hue` and the `supporting` mark (the pinned catalog-v2.js reads each at catalogFromV2
 * and writes it at catalogToV2). A field the patch does not name is left exactly as it was, and a key this build does not
 * know is kept, as renameTag always kept it.
 *
 * THE SAME VALIDATION THE FORMAT APPLIES, AND THE DESK'S OFFERS. A topic or an action emptied in a language is taken off in
 * that language, and the whole field when none is left, by `note`'s reason in saveCard: "" where nothing was moves the hash.
 * A language this catalog does not declare is refused. An icon is a key the pinned engine offers (src/engine.mjs catLooks
 * `offered`) or the one the category already wears, so a drawing a newer engine retired survives a save; a hue is a slot
 * in the engine's cycle (cat-identity.js hueIsOffered), since a slot outside it reads as no colour on every desk. "" or
 * null clears either, which hands the category back to the look a desk derives. `supporting` is true or absent, never
 * false, as the format reads it. An icon, a hue or the mark on an intent is refused: the format has no home for them there.
 */
const TAG_FIELDS = { shelf: ["label", "icon", "hue", "supporting"], request: ["clause", "topic", "action"] };

/** A text field by language that may be empty: trimmed, emptied languages taken off, undeclared ones refused. */
function optionalText(draft, given, was) {
  const codes = (draft.langs || []).map(l => l && l.code).filter(Boolean);
  const out = Object.assign({}, was && typeof was === "object" ? was : {});
  for (const code of Object.keys(given)) {
    if (codes.indexOf(code) < 0) throw refuse("this catalog has no language {CODE}", { CODE: code });
    const v = String(given[code] == null ? "" : given[code]).trim();
    if (v) out[code] = v; else delete out[code];
  }
  return out;
}

/* A FIELD THE VERB DOES NOT WRITE IS REFUSED, NEVER ANSWERED AS SAVED (the test architect's read of 1018, F1): a key this kind
   of tag does not carry, a text field that is not a map of words by language, a mark that is not true or false. A patch
   that would be answered "saved" while the file stays as it was is a status bar that lies. */
const isMap = (v) => !!v && typeof v === "object" && !Array.isArray(v);
function typeRefusal(field, value) {
  return refuse("{FIELD} cannot be {VALUE}", { FIELD: field, VALUE: JSON.stringify(value) });
}
function wordsMap(field, v) {
  if (!isMap(v) || Object.keys(v).some(k => v[k] != null && typeof v[k] !== "string")) throw typeRefusal(field, v);
  return v;
}

async function saveTag(dir, id, patch) {
  const p = patch && typeof patch === "object" ? patch : {};
  return withDraft(dir, (draft) => {
    const tag = (draft.tags || []).find(t => t.id === id);
    if (!tag) throw refuse("no tag {ID} in this catalog", { ID: JSON.stringify(id) });
    const own = TAG_FIELDS[tag.kind] || [];
    const name = TEXT_OF[tag.kind];
    if (tag.kind !== "shelf" && ["icon", "hue", "supporting"].some(f => f in p)) /* plant:a1018-intent-look */
      throw refuse("an intent has no icon, colour or supporting mark; only a category has them");
    const stray = Object.keys(p).find(k => k !== "text" && own.indexOf(k) < 0); /* plant:f1-tag-stray */
    if (stray) throw refuse(tag.kind === "shelf" ? "a category has no field {FIELD}" : "an intent has no field {FIELD}", { FIELD: stray });
    for (const f of ["text", name, "topic", "action"]) if (f in p) wordsMap(f, p[f]); /* plant:f1-tag-words */
    if ("supporting" in p && typeof p.supporting !== "boolean") throw typeRefusal("supporting", p.supporting); /* plant:f1-tag-supporting */
    const text = isMap(p.text) ? p.text : (isMap(p[name]) ? p[name] : null);
    if (text) tag[name] = textFor(draft, tag.kind, text, tag[name]);
    for (const f of ["topic", "action"]) {
      if (!isMap(p[f])) continue;
      const m = optionalText(draft, p[f], tag[f]);
      if (Object.keys(m).length) tag[f] = m; else delete tag[f]; /* plant:a1018-text */
    }
    if (tag.kind === "shelf") {
      const offered = (LOOKS || (LOOKS = Engine.catLooks())).offered;
      if ("icon" in p) {
        const ic = p.icon == null ? "" : String(p.icon);
        if (!ic) delete tag.icon;
        else if (offered.icons.indexOf(ic) >= 0 || ic === tag.icon) tag.icon = ic; /* plant:a1018-icon */
        else throw refuse("{ICON} is not an icon this version of Etiuda offers", { ICON: JSON.stringify(ic) });
      }
      if ("hue" in p) {
        const raw = p.hue;
        const n = typeof raw === "number" ? raw : (typeof raw === "string" && /^\d+$/.test(raw) ? +raw : NaN);
        if (raw == null || raw === "") delete tag.hue;
        else if (Number.isInteger(n) && offered.hues.some(h => h.slot === n)) tag.hue = n; /* plant:a1018-hue */
        else throw refuse("{HUE} is not a colour this version of Etiuda offers", { HUE: JSON.stringify(raw) });
      }
      if (typeof p.supporting === "boolean") {
        if (p.supporting) tag.supporting = true; else delete tag.supporting; /* plant:a1018-supporting */
      }
    }
    return { tag };
  });
}

async function renameTag(dir, id, text) {
  return saveTag(dir, id, { text: text && typeof text === "object" ? text : {} });
}

/** One place earlier or later among the tags of its own kind. At either end it is a no-op, and
 *  it says so rather than pretending: the screen leaves the buttons up and the file alone. */
async function moveTag(dir, id, delta) {
  return withDraft(dir, (draft) => {
    const tags = draft.tags || [];
    const at = tags.findIndex(t => t.id === id);
    if (at < 0) throw refuse("no tag {ID} in this catalog", { ID: JSON.stringify(id) });
    const slots = tags.map((t, i) => (t.kind === tags[at].kind ? i : -1)).filter(i => i >= 0);
    const which = slots.indexOf(at);
    const to = which + (+delta < 0 ? -1 : 1);
    if (to < 0 || to >= slots.length) return { refused: "at the end", moved: false };
    const a = slots[which], b = slots[to];
    const keep = tags[a]; tags[a] = tags[b]; tags[b] = keep;
    return { tag: keep, moved: true };
  });
}

async function deleteTag(dir, id) {
  return withDraft(dir, (draft) => {
    const tags = draft.tags || [];
    const at = tags.findIndex(t => t.id === id);
    if (at < 0) throw refuse("no tag {ID} in this catalog", { ID: JSON.stringify(id) });
    const tag = tags[at];
    const used = cardsUsing(draft, tag);
    if (used.length) {
      const name = tagWords(tag, primaryOf(draft), primaryOf(draft)) || tag.id;
      /* The category half of this sentence is the engine's own, from its Library: the wording a
         person already meets when they try to delete a category that still has cards in it. */
      return Object.assign({ refused: "in use", tag: { id: tag.id, kind: tag.kind, name },
        cards: used },
        refusalOf(tag.kind === "shelf"
          ? "{TAG} is on {CARDS}. Move or delete cards in this category first."
          : "{TAG} is on {CARDS}. Take it off them first.",
          { TAG: name, CARDS: counted(used.length, "{N} card", "{N} cards") }));
    }
    tags.splice(at, 1);
    return { tag: { id: tag.id, kind: tag.kind }, deleted: true };
  });
}

/* ---- the cards: one made, one copied, one taken away -------------------------------------------
 *
 * THE SAME READ-CHANGE-WRITE AS EVERY OTHER VERB, through withDraft: the draft is rewritten
 * whole and the engine's own contentHash goes on last, so a card made on the screen sits in a
 * file the pinned engine would have written, and there is no second writer here either.
 *
 * A CARD IS BORN IN A CATEGORY. The pinned reader refuses a card with no shelf outright -
 * "card <id>: shelf absent", catalog-v2.js v2Problems - and a refused file is a catalog no desk
 * can load AT ALL rather than a catalog with one card missing, so a shelf-less card is not a
 * state a person is allowed to reach by pressing a button. The cover therefore carries the
 * category beside the title, and an id naming no shelf is refused here rather than written.
 *
 * THE ID IS RANDOM, MADE ONCE AND NEVER DERIVED FROM A TITLE (Maxim, decisions 2026-10-01 00:20, 12b, as
 * a catalog's id is since 2026-09-28 22:53): an id that reads like a title invites editing in a
 * spreadsheet, the one edit that breaks a round trip. A desk's stars, hides, edits and its own order
 * are all keyed by the card id since the engine's item 340, so an id that moved with a retitling
 * would orphan every one of them silently; an id that never follows the title cannot. It is checked
 * against everything already in the draft by freeId.
 *
 * A DUPLICATE IS THE CARD WORD FOR WORD WITH A NEW ID, and it is deliberately NOT retitled. The
 * pinned linter calls two cards sharing a category and a title a duplicate, because the engine
 * derived its old ids from that pair, so the copy arrives with that error already against it and
 * the lint list says so with a Jump to the title - which is the one place the person is going
 * anyway. Appending a word of this program's own to the title would put wording Studio invented
 * inside somebody's catalog, and content is the one thing this program may not write.
 *
 * EACH OF THE THREE ANSWERS WITH THE ONE CARD, NEVER THE LIST: the page places it where the file
 * does (ui/app.js, tookCard), and tests/card-verbs.mjs holds the order the two agree on.
 *
 * A CARD THE INTENTS REACH IS DELETED LIKE ANY OTHER (Maxim, 2026-09-22): the link lives on the
 * card, so nothing is left pointing at it, unlike a tag in use.
 */

function cardTitle(draft, card) {
  return String((card.title || {})[primaryOf(draft)] || card.id);
}

async function addCard(dir, shelf, title, body, shape, more) {
  return withDraft(dir, (draft, F) => {
    const primary = primaryOf(draft);
    const words = String(title == null ? "" : title).trim();
    if (!words) throw refuse("a card needs a title in {LANG}, the primary language this"
      + " catalog declares", { LANG: primary });
    const tid = String(shelf || "");
    if (!(draft.tags || []).some(t => t.id === tid && t.kind === "shelf"))
      throw refuse("no category {ID} in this catalog", { ID: JSON.stringify(tid) });
    /* A CARD MAY BE BORN SHAPED (the Studio batch of 2026-10-12, E2): the New card cover names Steps or Alternatives, so a
       lead says so once, at the start. No shape, "" and "plain" are the card this verb has always made; a word the format
       has not got is refused in saveCard's words, before anything is written. */
    const form = shape == null || shape === "" ? "plain" : String(shape);
    if (REPLY_SHAPES.indexOf(form) < 0) throw refuse("a card holds one reply, alternatives or steps");
    const id = freeId(draft, newCardId());
    /* The key order the importer writes a card in, so that two cards in one file cannot differ
       by the order of their fields alone. */
    const card = { id, shelf: tid };
    card.title = {}; card.title[primary] = words;
    card.bodyShape = form;
    /* THE BODY IS BORN WITH THE CARD WHEN IT IS GIVEN: a card with none is an error the reader
       refuses on, and that refusal also silences the awaiting count (sense pass item 25). On a
       shaped card the text is its first reply, written by repliesBody as the Replies block writes it. */
    const text = String(body == null ? "" : body);
    if (text.trim() && form === "plain") { card.body = {}; card.body[primary] = text; }
    else if (text.trim()) card.body = repliesBody(form, [{ text: { [primary]: text } }]);
    /* A CARD BORN WHOLE (board 992, Argon's finding 6 of its review): `more` gives a plain card its other languages' title and
       body and its intents in the same write, so the card a model's situation draft makes is one change in changes.json and one
       Undo takes it away whole; made and then saved, it was two, and one Undo left the card in its first language alone. Each
       is set as saveCard sets it: a language's text as given where it holds any, an intent only where the catalog has it. */
    const m = more && typeof more === "object" ? more : {};
    const others = (k) => Object.keys(m[k] && typeof m[k] === "object" ? m[k] : {}).filter((l) => l !== primary && String(m[k][l] == null ? "" : m[k][l]).trim());
    others("title").forEach((l) => { card.title[l] = String(m.title[l]); });
    if (form === "plain") others("body").forEach((l) => { card.body = card.body || {}; card.body[l] = String(m.body[l]); });
    if (Array.isArray(m.requests)) {
      const want = m.requests.map(String).filter((v, i, a) => a.indexOf(v) === i);
      for (const rid of want) if (!(draft.tags || []).some(t => t.id === rid && t.kind === "request"))
        throw refuse("no intent {ID} in this catalog", { ID: JSON.stringify(rid) });
      if (want.length) card.requests = want;
    }
    draft.cards = (draft.cards || []).concat([card]);
    return { card, made: true };
  });
}

async function duplicateCard(dir, id) {
  return withDraft(dir, (draft, F) => {
    const cards = draft.cards || [];
    const at = cards.findIndex(c => c.id === id);
    if (at < 0) throw refuse("no card {ID} in this catalog", { ID: JSON.stringify(id) });
    const copy = JSON.parse(JSON.stringify(cards[at]));
    /* A copy is never born retired; it keeps `commits` and its own outgoing `next` (the same
       reply), and no card gains a link to it (the lead engineer's ruling, board 834). */
    delete copy.retired;
    copy.id = freeId(draft, newCardId());
    /* Beside the card it was made from rather than at the foot of the list: the table is in
       file order, and a copy that landed two hundred rows away would have to be searched for. */
    cards.splice(at + 1, 0, copy);
    draft.cards = cards;
    return { card: copy, from: id, made: true };
  });
}

/* ---- SINCE THE LAST EDITION (board 862, Claudia γ): every change to the draft since the last publish ----
 * Studio kept the last change, for the undo bar; it now keeps each one, in changes.json beside project.json: the cards it
 * touched as they were and as they became, and the quick facts, so any one can be undone on its own while what it
 * changed is still as it left it. A save straight after a save of the same card's same fields joins it. A publish starts
 * the list again; a card changed elsewhere (a proposal landed, a file edited by hand) is found against the last edition. */
const COALESCE_MS = 5 * 60 * 1000;
/* THE LISTING'S DRAFT COUNT. An empty journal is 0 without loading the engine. A journal that has entries waits for
   changesCount, which is the same count the row fills in after the table is on screen. */
function changesListed(home) {
  const j = changesOf(home);
  if (!j || !Array.isArray(j.list) || !j.list.length) return 0;
  return null;
}
function changesOf(home) {
  try { const j = readJson(path.join(home, CHANGES_FILE)); if (j && Array.isArray(j.list)) return j; } catch { /* none yet */ }
  return { kind: "etiuda-studio-changes", n: 0, list: [] };
}
/* A JOURNAL THAT CANNOT BE WRITTEN NEVER FAILS THE ACT IT RECORDS: the draft is already written by then, and the list
   still finds the card against the last edition (changesSince). */
const keepChanges = (home, j) => { try { writeWhole(path.join(home, CHANGES_FILE), json(j)); } catch { /* see above */ } };
/* A CHANGE STILL STANDING is src/dated.mjs's `standing` since board 982, where a publish dates what it touched. */
const changesCount = async (home) => {
  const F = await Engine.format();
  const same = sameOf(F);
  const j = changesOf(home);
  return j.list.filter((e, i, a) => standing(e, same, i, a)).length;
};
const copyOf = (x) => (x === undefined ? null : JSON.parse(JSON.stringify(x)));
/* THE REST OF THE CATALOG: its categories, requests, variables, languages and whatever else it holds beside its cards and
   quick facts, read key by key at the top level, so that a change there is a change too (the test architect's read of
   2026-10-07: a category renamed or added after a publish left the page saying the draft was the same as the edition).
   The hash and signature are the engine's, an edition's rev and date are the publish's stamps, and evaluation
   is the mark a publish stamps on an edition, so none is a change.
   A key a side lacks is left out of that side, so an undo can take it off again. */
const NOT_OTHER = new Set(["cards", "facts", "hash", "sig", "rev", "date", "evaluation"]);
function otherMoved(was, now, same) {
  const keys = Array.from(new Set(Object.keys(was || {}).concat(Object.keys(now || {}))))
    .filter(k => !NOT_OTHER.has(k) && !same((was || {})[k], (now || {})[k])).sort();
  if (!keys.length) return null;
  const pick = (o) => keys.reduce((m, k) => { if (o && k in o) m[k] = copyOf(o[k]); return m; }, {});
  return { keys, was: pick(was), now: pick(now) };
}
/** The fields of a card that differ between two of its states, by the engine's canonical form. Its date is not a field
 *  a person changed: a publish wrote it (board 982). */
function fieldsMoved(was, now, same) {
  const keys = new Set(Object.keys(was || {}).concat(Object.keys(now || {})));
  return Array.from(keys).filter(k => k !== DATE_KEY && !same((was || {})[k], (now || {})[k])).sort();
}
function journal(home, did, before, after, F, at) {
  const same = sameOf(F);
  const was = new Map((before.cards || []).map((c, i) => [c && c.id, { c, i }]));
  const now = new Map((after.cards || []).map((c, i) => [c && c.id, { c, i }]));
  const cards = [];
  was.forEach((x, id) => { const y = now.get(id);
    if (!y) cards.push({ id, at: x.i, was: copyOf(x.c), now: null });
    else if (!same(x.c, y.c)) cards.push({ id, at: at != null ? at : y.i, was: copyOf(x.c), now: copyOf(y.c) }); });
  now.forEach((y, id) => { if (!was.has(id)) cards.push({ id, at: y.i, was: null, now: copyOf(y.c) }); });
  const facts = same(before.facts, after.facts) ? null : { was: copyOf(before.facts), now: copyOf(after.facts) };
  const other = otherMoved(before, after, same);
  if (!cards.length && !facts && !other) return;
  const j = changesOf(home), last = j.list[j.list.length - 1], stamp = new Date().toISOString();
  if (!did && !facts && !other && last && !last.did && !last.facts && !last.other && cards.length === 1 && last.cards.length === 1
      && last.cards[0].id === cards[0].id && last.hash === before.hash && Date.parse(stamp) - Date.parse(last.at) < COALESCE_MS
      && fieldsMoved(last.cards[0].was, last.cards[0].now, same).join() === fieldsMoved(cards[0].was, cards[0].now, same).join()) {
    last.cards[0].now = cards[0].now; last.at = stamp; last.hash = after.hash;
  } else {
    j.n = (j.n | 0) + 1;
    const entry = Object.assign({ n: j.n, at: stamp, cards, hash: after.hash }, facts ? { facts } : {}, other ? { other } : {}, did ? { did } : {});
    /* A later edit makes the field diff refuse, saying the card has changed since. The draft as it
       was before the rollback is what Changes puts back, including after that edit. */
    if (did && did.kind === "rollback") entry.snap = copyOf(before);
    j.list.push(entry);
  }
  keepChanges(home, j);
}
/** The last change taken out of the list, when the undo bar has just put the draft back from it. */
function unjournal(home, hash) {
  const j = changesOf(home), last = j.list[j.list.length - 1];
  if (last && last.hash === hash) { j.list.pop(); keepChanges(home, j); }
}
/** The list starts again from a new edition. */
function journalFrom(home, rev) { keepChanges(home, { kind: "etiuda-studio-changes", n: 0, list: [], since: rev }); }

/** Every change since the last edition, newest first, with the edition's rev and what the next publish makes. */
async function changesSince(dir) {
  const home = path.resolve(dir);
  const found = projectAt(home);
  if (!found) throw refuse("no catalog in {DIR}", { DIR: home });
  const draft = readOrRefuse(path.join(home, found.draftName));
  const F = await Engine.format();
  const same = sameOf(F);
  const j = changesOf(home), rev = found.project.rev | 0, eds = editionsIn(home);
  /* Undoing a rollback drops every journal entry after it. The page asks before that drop
     when the count is not zero. A copy, so the count is not written into changes.json. */
  const list = j.list.filter((e, i, a) => standing(e, same, i, a)).map((e) => {
    if (!(e.did && e.did.kind === "rollback" && e.snap)) return e;
    return Object.assign({ later: j.list.filter((x) => x.n > e.n).length }, e);
  });
  if (eds.length) {
    let base = null;
    try { base = archivedCatalog(home, eds[eds.length - 1]); } catch { base = null; }
    const known = new Set();
    list.forEach(e => e.cards.forEach(c => known.add(c.id)));
    const was = new Map(((base && base.cards) || []).map((c, i) => [c && c.id, { c, i }]));
    const elsewhere = [];
    (draft.cards || []).forEach((c, i) => { if (!c || known.has(c.id)) return; const w = was.get(c.id);
      if (!w) elsewhere.push({ id: c.id, at: i, was: null, now: copyOf(c) });
      else if (!same(w.c, c)) elsewhere.push({ id: c.id, at: i, was: copyOf(w.c), now: copyOf(c) }); });
    const ids = new Set((draft.cards || []).map(c => c && c.id));
    was.forEach((w, id) => { if (!ids.has(id) && !known.has(id)) elsewhere.push({ id, at: w.i, was: copyOf(w.c), now: null }); });
    elsewhere.forEach((c, i) => list.unshift({ n: -(i + 1), at: found.project.edited || "", cards: [c], hash: "", elsewhere: true }));
    /* and the rest of the catalog against the edition, where no change listed already holds the key: one line */
    const held = new Set();
    list.forEach(e => e.other && e.other.keys.forEach(k => held.add(k)));
    const rest = base ? otherMoved(base, draft, same) : null;
    const keys = rest ? rest.keys.filter(k => !held.has(k)) : [];
    if (keys.length) list.unshift({ n: -(elsewhere.length + 1), at: found.project.edited || "", cards: [], hash: "", elsewhere: true,
      other: otherMoved(keys.reduce((m, k) => { if (k in base) m[k] = base[k]; return m; }, {}),
        keys.reduce((m, k) => { if (k in draft) m[k] = draft[k]; return m; }, {}), same) });
  }
  return { rev, next: rev + 1, published: found.project.published || null, list: list.slice().reverse(), n: j.n | 0 };
}

/** One change undone on its own, or one place of a replace: refused where what it changed has changed since. */
async function undoChange(dir, n, spot) {
  const home = path.resolve(dir);
  const listed = await changesSince(home);
  const e = listed.list.find(x => x.n === +n);
  if (!e) throw refuse("Studio no longer holds this change, so it cannot be undone");
  const one = spot != null && e.did && Array.isArray(e.did.spots) ? e.did.spots[+spot] : null;
  if (spot != null && (!one || one.undone)) throw refuse("this place is no longer in the change, so it cannot be undone");
  /* The rollback keeps the whole pre-restore draft. A later edit does not close this way back:
     the field diff would refuse, and the draft comes back as it was, later edits included in
     that return only as what is left behind. Entries from before the rollback stand again.
     The Changes screen asks first when journal entries sit after this one. This drop is the yes. */
  const rawRoll = changesOf(home).list.find(x => x.n === e.n);
  if (!one && rawRoll && rawRoll.snap && rawRoll.did && rawRoll.did.kind === "rollback") {
    const out = await withDraft(home, (draft) => {
      Object.keys(draft).forEach((k) => { delete draft[k]; });
      Object.assign(draft, copyOf(rawRoll.snap));
      return { undone: e.n };
    }, { journal: false });
    if (out.refused) return out;
    const j = changesOf(home);
    j.list = j.list.filter((x) => x.n < rawRoll.n);
    keepChanges(home, j);
    const found = projectAt(home);
    const back = readOrRefuse(path.join(home, found.draftName));
    return Object.assign(out, { draft: back, changes: await changesCount(home),
      likely: likelyAll(back, found.project.notPromises) });
  }
  const SINCE = "the card has changed since, so this change can no longer be undone on its own";
  let after = null;
  const out = await withDraft(home, (draft, F) => {
    const same = sameOf(F);
    const cards = draft.cards || (draft.cards = []);
    if (one) {
      const card = one.id ? cards.find(c => c.id === one.id) : null;
      const text = one.id ? String(((card || {})[one.field] || {})[one.lang] || "") : String(draft.facts || "");
      const to = String(e.did.to);
      /* A REPLACEMENT OF NOTHING LEAVES NOTHING TO FIND AT THE PLACE: the slice below is "" wherever it is looked at, so it cannot say
         the place still stands, and a field rewritten since got the old words put into the middle of it (the editing review of
         2026-11-22: "the  sat" rewritten to "hello there" undid to "hellcato there"). Such a place is undone only while the field is
         still the text this change left, which the journal kept; once it is not, the place has changed. */
      const kept = one.id ? ((e.cards.find(c => c.id === one.id) || {}).now || {})[one.field] : null;
      const leftText = one.id ? String((kept || {})[one.lang] || "") : String(e.facts && e.facts.now != null ? e.facts.now : "");
      const emptyMoved = to === "" && text !== leftText;
      if ((one.id && !card) || emptyMoved /* plant:esv-spot-empty */ || text.slice(one.at, one.at + to.length) !== to)
        throw refuse("this place has changed since, so it can no longer be undone on its own");
      const next = text.slice(0, one.at) + one.was + text.slice(one.at + to.length);
      if (one.id) { card[one.field] = Object.assign({}, card[one.field]); card[one.field][one.lang] = next; after = card; }
      else { draft.facts = next; after = next; }
      return { undone: e.n, spot: +spot };
    }
    for (const c of e.cards) {
      const i = cards.findIndex(x => x.id === c.id);
      if (c.now === null) { if (i >= 0) throw refuse(SINCE); continue; }
      if (i < 0 || (c.was === null ? !same(cards[i], c.now)
        : fieldsMoved(c.was, c.now, same).some(k => !same(cards[i][k], c.now[k])))) throw refuse(SINCE);
    }
    if (e.facts && !same(draft.facts, e.facts.now)) throw refuse("the quick facts have changed since, so this change can no longer be undone on its own");
    if (e.other && e.other.keys.some(k => !same(draft[k], e.other.now[k])))
      throw refuse("the catalog has changed there since, so this change can no longer be undone on its own");
    const tagsWere = draft.tags || [];
    e.cards.slice().sort((a, b) => a.at - b.at).forEach((c) => {
      const i = cards.findIndex(x => x.id === c.id);
      if (c.now === null) cards.splice(Math.min(c.at, cards.length), 0, copyOf(c.was));
      else if (c.was === null) cards.splice(i, 1);
      else fieldsMoved(c.was, c.now, same).forEach((k) => { if (c.was[k] === undefined) delete cards[i][k]; else cards[i][k] = copyOf(c.was[k]); });
    });
    if (e.facts) { if (e.facts.was == null) delete draft.facts; else draft.facts = e.facts.was; }
    if (e.other) e.other.keys.forEach((k) => { if (k in e.other.was) draft[k] = copyOf(e.other.was[k]); else delete draft[k]; });
    /* a category this change made, with cards in it since, stays: the cards would name a category the draft lacks */
    const kept = new Set((draft.tags || []).map(t => t && t.id));
    if (tagsWere.some(t => t && !kept.has(t.id) && cardsUsing(draft, t).length))
      throw refuse("a card is in a category this change made, so the change can no longer be undone on its own");
    return { undone: e.n };
  }, { journal: false });
  if (out.refused) return out;
  const j = changesOf(home), k = j.list.findIndex(x => x.n === e.n);
  if (k >= 0 && one) {
    const kept = j.list[k], s = kept.did.spots, to = String(kept.did.to);
    s[+spot].undone = true;
    s.forEach((x) => { if (x !== s[+spot] && !x.undone && x.id === one.id && x.field === one.field && x.lang === one.lang && x.at > one.at)
      x.at += String(one.was).length - to.length; });
    const c = one.id ? kept.cards.find(x => x.id === one.id) : null;
    if (c) c.now = copyOf(after);
    if (!one.id && kept.facts) kept.facts.now = after;
    kept.hash = out.hash;
  } else if (k >= 0) j.list.splice(k, 1);
  if (k >= 0) keepChanges(home, j);
  const found = projectAt(home);
  return Object.assign(out, { draft: readOrRefuse(path.join(home, found.draftName)), changes: await changesCount(home),
    likely: likelyAll(readOrRefuse(path.join(home, found.draftName)), found.project.notPromises) });
}

/* The last delete per project, kept here and not in the page: the card, its place and the draft's
   hash as the delete left it. Undo is offered only while that hash is still the draft's. */
const GONE = new Map();

/* A DELETED CARD LEAVES NO LINK TO IT BEHIND (board 834, step 11, S3a). A card's `next` names the cards that
 * may follow it, so once a card is gone every entry whose `to` is that card names nothing, and the pinned lint
 * calls it an error. The entries are dropped from the cards that held them, and a `next` left empty is taken
 * off the card, as the importer never writes an empty one. The answer is each card as it was before, whole, so
 * Undo can put it back with its keys in their order; a card no one linked to is not touched at all. Only
 * `next` is read: a `next` that is not a list is the lint's to say and is left as it is. */
function dropLinksTo(draft, goneIds) {
  const before = [];
  (draft.cards || []).forEach((card) => {
    if (!card || !Array.isArray(card.next)) return;
    const kept = card.next.filter(n => !(n && goneIds.has(n.to)));
    if (kept.length === card.next.length) return;
    before.push(JSON.parse(JSON.stringify(card)));
    if (kept.length) card.next = kept; else delete card.next;
  });
  return before;
}

async function deleteCard(dir, id) {
  const home = path.resolve(dir);
  let gone = null;
  const out = await withDraft(dir, (draft) => {
    const cards = draft.cards || [];
    const at = cards.findIndex(c => c.id === id);
    if (at < 0) throw refuse("no card {ID} in this catalog", { ID: JSON.stringify(id) });
    const card = cards[at];
    gone = { card, at, title: cardTitle(draft, card) };
    cards.splice(at, 1);
    draft.cards = cards;
    gone.links = dropLinksTo(draft, new Set([id]));
    /* The page's copy of each card that lost a link follows the file (ui/app.js, tookCard), as its Undo's does. */
    const unlinked = gone.links.map((was) => {
      const now = cards.find(c => c.id === was.id);
      return { id: was.id, next: now && now.next ? now.next : null };
    });
    return { card: { id: card.id }, deleted: true, title: gone.title, undoable: true, unlinked };
  });
  GONE.set(home, { card: gone.card, at: gone.at, links: gone.links, hash: out.hash });
  return out;
}

/** The deleted card back at its place with its id; refused once anything else has changed the draft. */
async function undoDelete(dir) {
  const home = path.resolve(dir);
  const gone = GONE.get(home);
  if (!gone) throw refuse("Studio no longer remembers the deleted card, so the deletion cannot be undone");
  const out = await withDraft(dir, (draft) => {
    if (draft.hash !== gone.hash) {
      GONE.delete(home);
      throw refuse("the catalog has changed since the card was deleted, so the deletion can no longer be undone");
    }
    const cards = draft.cards || [];
    cards.splice(Math.min(gone.at, cards.length), 0, gone.card);
    /* The cards that lost a link to it are put back as they were. The draft is the one the delete left (the
       hash above), so each is still there under its id. */
    gone.links.forEach((was) => {
      const i = cards.findIndex(c => c.id === was.id);
      if (i >= 0) cards[i] = was;
    });
    draft.cards = cards;
    return { card: gone.card, at: Math.min(gone.at, cards.length - 1), undone: true,
             title: cardTitle(draft, gone.card),
             relinked: gone.links.map(was => ({ id: was.id, next: was.next || null })) };
  }, { journal: false });
  GONE.delete(home);
  unjournal(home, gone.hash);
  /* the count read after the entry has left the list, never inside withDraft before it */
  return Object.assign(out, { changes: await changesCount(home) });
}

/* ---- retiring a card and restoring it (board 834, step 6, C07) ----
 * A retired card is the card with `retired: true`, and nothing else about it changes. The flag is
 * `true` or absent, never `false`, which the engine's reader refuses (tests/format-pass.mjs fp3b). */
function flagCard(dir, id, on) {
  return withDraft(dir, (draft) => {
    const card = (draft.cards || []).find(c => c.id === id);
    if (!card) throw refuse("no card {ID} in this catalog", { ID: JSON.stringify(id) });
    if (on) card.retired = true; else delete card.retired;
    return { card, changed: true };
  });
}
const retireCard = (dir, id) => flagCard(dir, id, true);
const restoreCard = (dir, id) => flagCard(dir, id, false);

/* ---- find and replace, the acts on several cards, and the sheet round trip (board 834, step 10, C09) ----
 * Every act here is ONE change to the draft, and the answer carries the whole draft so the page takes it as it
 * stands. Undo is a snapshot: the draft as it was and the hash this change left, honoured only while the draft
 * still has that hash (the same guard as undoDelete's), so one press puts back everything the act did.
 * The text and the rules of a place are src/bulk.mjs's, a sheet's are src/sheet.mjs's. */
const UNDO = new Map();

async function changeMany(dir, act) {
  const home = path.resolve(dir);
  const found = projectAt(home);
  const was = {};
  let kept = null;
  const out = await withDraft(dir, (draft, F) => {
    kept = draft;
    return act(draft, F);
  }, { seen: was });
  if (out.refused) return out;
  UNDO.set(home, { raw: was.raw, file: found.draftName, hash: out.hash });
  return Object.assign(out, { draft: kept, undoable: true, likely: likelyAll(kept, found.project.notPromises) });
}

function draftOn(dir) {
  const home = path.resolve(dir);
  const found = projectAt(home);
  if (!found) throw refuse("no catalog in {DIR}", { DIR: home });
  return readOrRefuse(path.join(home, found.draftName));
}

const NO_CARD = "no card {ID} in this catalog";
function knownCards(draft, ids) {
  const list = (Array.isArray(ids) ? ids : []).map(String);
  const miss = unknownIds(draft, list)[0];
  if (miss !== undefined) throw refuse(NO_CARD, { ID: JSON.stringify(miss) });
  return list;
}

/** The places the typed text has in the draft on disk, row by row: a read, nothing is written. */
async function findPlaces(dir, opts) {
  const o = opts || {};
  const r = findRows(draftOn(dir), o);
  return { places: r.places, rows: r.rows.map(x => ({ key: x.key, kind: x.kind, id: x.id, title: x.title,
    retired: x.retired, places: x.places.map(p => ({ field: p.field, lang: p.lang, pre: p.pre, hit: p.hit,
      post: p.post })) })) };
}

/** Replaces in the rows named, as one change. */
function replacePlaces(dir, opts, keys) {
  const o = opts || {};
  return changeMany(dir, (draft) => {
    const want = new Set((keys || []).map(String)), to = String(o.replace == null ? "" : o.replace), spots = [];
    findRows(draft, o).rows.filter(r => want.has(r.key)).forEach((r) => {
      const by = new Map();
      r.places.forEach((p) => { const k = p.field + "\n" + p.lang; if (!by.has(k)) by.set(k, []); by.get(k).push(p); });
      by.forEach((ps) => {
        let shift = 0;
        ps.slice().sort((a, b) => a.start - b.start).forEach((p) => {
          spots.push({ id: r.kind === "facts" ? "" : r.id, field: p.field, lang: p.lang, at: p.start + shift, was: p.hit,
            pre: p.pre, post: p.post });
          shift += to.length - (p.end - p.start);
        });
      });
    });
    const r = replaceRows(draft, o, keys);
    if (!r.places) return { refused: "no places" };
    return { did: { kind: "replace", places: r.places, cards: r.cards, facts: r.facts, find: String(o.find == null ? "" : o.find),
      to, spots } };
  });
}

function retireCards(dir, ids) {
  return changeMany(dir, (draft) => {
    const list = knownCards(draft, ids);
    const n = retireMany(draft, list);
    if (!n) return { refused: "no changes" };
    return { did: { kind: "retire", cards: n } };
  });
}

function moveCards(dir, ids, shelf) {
  return changeMany(dir, (draft) => {
    const list = knownCards(draft, ids);
    const tid = String(shelf || "");
    const tag = (draft.tags || []).find(t => t.id === tid && t.kind === "shelf");
    if (!tag) throw refuse("no category {ID} in this catalog", { ID: JSON.stringify(tid) });
    const n = moveMany(draft, list, tid);
    if (!n) return { refused: "no changes" };
    return { did: { kind: "move", cards: n, shelf: tid } };
  });
}

function deleteCards(dir, ids) {
  return changeMany(dir, (draft) => {
    const list = knownCards(draft, ids);
    const n = deleteMany(draft, list);
    dropLinksTo(draft, new Set(list));    /* Undo here is the snapshot of the bytes, which holds every link as it was */
    return { did: { kind: "delete", cards: n } };
  });
}

/* BY KIND (board 862): the ticked findings of one kind marked as commitments, the flag the editor's tick writes, as one
   change the undo bar takes back; and the rest turned down at once, each kept against the words it was given for, as
   dismissLikely keeps one. */
function commitCards(dir, ids) {
  return changeMany(dir, (draft) => {
    const list = new Set(knownCards(draft, ids));
    let n = 0;
    (draft.cards || []).forEach((c) => { if (list.has(c.id) && !c.commits) { c.commits = true; n++; } });
    if (!n) return { refused: "no changes" };
    return { did: { kind: "commit", cards: n } };
  });
}

async function dismissMany(dir, pairs) {
  const home = path.resolve(dir);
  const found = projectAt(home);
  if (!found) throw refuse("no catalog in {DIR}", { DIR: home });
  const draft = readOrRefuse(path.join(home, found.draftName));
  const list = (Array.isArray(pairs) ? pairs : []).map(p => [String((p || {}).id || ""), String((p || {}).phrase == null ? "" : p.phrase)]);
  knownCards(draft, list.map(p => p[0]));
  const kept = Object.assign({}, found.project.notPromises);
  list.forEach(([id, phrase]) => { kept[id] = phrase; });
  writeProject(home, Object.assign({}, found.project, { draft: found.draftName, notPromises: kept }));
  const awaits = await awaitingFor(draft);
  return { dismissed: list.length, lint: findings(draft, awaits.classed, awaits.rows, kept, found.project.endsMeant,
    found.project.findingsLeft, found.project.changedNumbers),
           likely: likelyAll(draft, kept) };
}

/** Takes back the last of the acts above, while the draft is as that act left it. */
async function undoBulk(dir) {
  const home = path.resolve(dir);
  const u = UNDO.get(home);
  if (!u) throw refuse("Studio no longer remembers this change, so it cannot be undone");
  let kept = null;
  /* NOT JOURNALLED, as undoDelete and undoChange are not: the act taken back is the journal's last entry and leaves it
     below (unjournal), where a reversal journalled as a change of its own stayed on the Changes page beside it while
     the draft was as it had been (the test architect's read of 2026-10-07). */
  const out = await withDraft(dir, (draft) => {
    if (draft.hash !== u.hash) {
      UNDO.delete(home);
      throw refuse("the catalog has changed since, so this change can no longer be undone");
    }
    Object.keys(draft).forEach(k => { delete draft[k]; });
    Object.assign(draft, JSON.parse(u.raw.toString("utf8").replace(/^﻿/, "")));
    kept = draft;
    return { undone: true };
  }, { journal: false, exact: u.raw });
  /* THE BYTES THE DRAFT HAD ARE WRITTEN BACK, not the draft written afresh: the hash is the same either way
     (it is the engine's, over the content), and the file is then exactly what the person had. They are the one write above
     (`exact`), under the lock and the compare, where a second write after it left a gap another Studio's save could fall in. */
  UNDO.delete(home);
  unjournal(home, u.hash);
  const found = projectAt(home);
  return Object.assign(out, { changes: await changesCount(home), draft: kept, likely: likelyAll(kept, found ? found.project.notPromises : null) });
}

/** The ticked cards, or every card where none are named, as the importer's three files in `folder`. */
async function exportCards(dir, ids, folder) {
  const draft = draftOn(dir);
  const list = ids == null ? null : knownCards(draft, ids);
  const r = await exportCsv({ catalog: draft, out: folder, ids: list });
  return { folder: path.resolve(folder), cards: r.cards, files: [r.macros, r.categories, path.join(path.resolve(folder), "intents.csv")] };
}

const SHEET_NO_ID = "Rows are matched to cards by an id column, and this sheet has none; every sheet exported from Studio"
  + " has one, headed id";
const SHEET_SHOWN = 20;
const SHEET_CHANGED = "the sheet has changed since it was shown, so nothing from it has gone into the draft; chosen again, it shows"
  + " what it holds now";
const FILE_CHANGED = "the file has changed since it was shown, so nothing from it has gone in; chosen again, it shows"
  + " what it holds now";
const CATALOG_CHANGED = "the catalog has changed since the sheet was shown, so nothing from the sheet has gone into the draft; chosen"
  + " again, the sheet is compared with the catalog as it is now";
/* A catalog id the sheet's own name cannot refuse: the importer takes one from the file's name, a two-character name is no id,
   and the sheet's catalog is thrown away (only its cards are read). */
const SHEET_CATALOG_ID = "sheet-import";

const shaOf = (buf) => crypto.createHash("sha256").update(buf).digest("hex");

/** The sheet read and laid over the draft, in memory. `fingerprint` is the sha256 of the sheet's bytes, a colon and the draft's
 *  hash: what was shown is what lands only while both are as they were (the test architect's P5 and P6). */
async function sheetOver(dir, file) {
  const draft = draftOn(dir);
  const F = await Engine.format();
  const minted = new Set();
  const mint = () => { const id = newCardId(); minted.add(id); return id; };
  const sheet = shaOf(fs.readFileSync(file));
  const inc = await importCsv({ file, primary: primaryOf(draft), mintId: mint, id: SHEET_CATALOG_ID });
  /* a sheet saved again while it was being read is not the one this answers for */
  if (shaOf(fs.readFileSync(file)) !== sheet) throw refuse(SHEET_CHANGED);
  if (!inc.report.columns.some(c => c.field === "id")) throw refuse(SHEET_NO_ID);
  const r = patchFromSheet(draft, inc, { minted, mint });
  return { draft, F, inc, r, minted, fingerprint: sheet + ":" + draft.hash, sheet };
}

/** What a sheet would do to the open project: nothing is written. */
async function sheetPlan(dir, file) {
  const { draft, F, inc, r, fingerprint } = await sheetOver(dir, file);
  const d = sheetDiff(draft, r.patched, F);
  return { file: path.basename(String(file)), fingerprint, rows: inc.catalog.cards.length,
    counts: { changed: r.changed.length, added: r.added.length, unchanged: r.unchanged.length,
      missing: r.missing.length },
    same: d.same && !r.added.length, diff: { same: d.same, rows: d.rows }, added: r.added,
    notRead: inc.report.columns.some(c => c.field === "requests" || c.field === "role"),
    missing: r.missing.slice(0, SHEET_SHOWN), notes: r.notes, skippedLangs: r.skippedLangs };
}

/** The same, put into the draft as one change, and only if the sheet and the catalog are those the fingerprint was made of. */
async function sheetLand(dir, file, fingerprint) {
  const { r, sheet, draft } = await sheetOver(dir, file);
  const shown = String(fingerprint == null ? "" : fingerprint);
  if (shown.slice(0, 65) !== sheet + ":") throw refuse(SHEET_CHANGED);
  if (shown.slice(65) !== String(draft.hash)) throw refuse(CATALOG_CHANGED);
  if (!r.changed.length && !r.added.length) return { refused: "no changes", dir: path.resolve(dir) };
  return changeMany(dir, (draft) => {
    Object.keys(draft).forEach(k => { delete draft[k]; });
    Object.assign(draft, r.patched);
    return { did: { kind: "sheet", cards: r.changed.length + r.added.length } };
  });
}

/* ---- what a card has been: its history, read from the editions already kept ----
 * One row per archived edition in which the card changed, kinds added, retired, restored, title,
 * text, or changed (some other field). All cards are walked in one pass and kept per archive. */
const HISTORY = new Map();

function firstLine(text) { return String(text || "").split(/\r?\n/)[0].trim(); }

function editionHead(home, edition, cat) {
  const at = path.join(home, ARCHIVE, edition);
  let rev = null;
  try { rev = readJson(path.join(at, REPORT_IN_ARCHIVE)).rev; } catch { rev = null; }
  if (rev == null) rev = Number.isFinite(+cat.rev) ? +cat.rev : null;
  return { edition, rev, note: firstLine(editionNotes(at)) };
}

function kindsOf(was, card, same) {
  const kinds = [];
  if (!was) { kinds.push("added"); if (card.retired) kinds.push("retired"); return kinds; }
  if (!was.retired && card.retired) kinds.push("retired");
  if (was.retired && !card.retired) kinds.push("restored");
  if (!same(was.title, card.title)) kinds.push("title");
  if (!same(was.body, card.body)) kinds.push("text");
  if (!kinds.length && !same(was, card)) kinds.push("changed");
  return kinds;
}

async function historiesOf(home) {
  const eds = editionsIn(home);
  const stamp = eds.map(e => {
    try {
      const s = fs.statSync(path.join(home, ARCHIVE, e, CATALOG_IN_ARCHIVE));
      return e + ":" + s.size + ":" + s.mtimeMs;
    } catch { return e + ":-"; }
  }).join("|");
  const kept = HISTORY.get(home);
  if (kept && kept.stamp === stamp) return kept;
  const F = await Engine.format();
  const same = sameOf(F);
  const byId = new Map(), have = new Map();
  let prev = new Map(), last = null;
  for (const edition of eds) {
    let cat;
    try { cat = archivedCatalog(home, edition); } catch { continue; }
    const head = editionHead(home, edition, cat);
    const cur = new Map();
    (Array.isArray(cat.cards) ? cat.cards : []).forEach(c => { if (c && c.id) cur.set(String(c.id), c); });
    cur.forEach((card, id) => {
      const kinds = kindsOf(prev.get(id), card, same);
      if (kinds.length) {
        if (!byId.has(id)) byId.set(id, []);
        byId.get(id).push({ edition, rev: head.rev, kinds, note: head.note });
      }
      have.set(id, head);
    });
    prev = cur; last = head;
  }
  const out = { stamp, byId, have, last };
  HISTORY.set(home, out);
  return out;
}

/** One card's history, newest first, the edition its retirement began in, and the newest edition holding it. */
async function cardHistory(dir, id) {
  const home = path.resolve(dir);
  const h = await historiesOf(home);
  const asc = (h.byId.get(String(id)) || []).slice();
  let retiredIn = null, retiredRev = null;
  asc.forEach(r => {
    if (r.kinds.indexOf("retired") >= 0) { retiredIn = r.edition; retiredRev = r.rev == null ? null : r.rev; } /* plant:txrd-rd7-6 */
    if (r.kinds.indexOf("restored") >= 0) { retiredIn = null; retiredRev = null; }
  });
  return { id: String(id), rows: asc.slice().reverse(), retiredIn, retiredRev,
           last: h.have.get(String(id)) || null };
}

/** An older edition's title and bodies written into the draft's card whole, as one new change. */
async function restoreText(dir, id, edition) {
  const home = path.resolve(dir);
  const have = editionsIn(home);
  if (have.indexOf(edition) < 0)
    throw refuse("the archive at {P} has no edition {E}; it has {LIST}",
      { P: path.join(home, ARCHIVE), E: edition, LIST: have.join(", ") || "none" });
  const kept = archivedCatalog(home, edition), keptRev = Number.isFinite(+kept.rev) && kept.rev !== null && kept.rev !== "" ? +kept.rev : null;
  const was = (kept.cards || []).find(c => c && c.id === id);
  /* Board 902: the rev first and the dated edition in parentheses after it, or the dated edition where there is no rev. */
  if (!was && keptRev !== null) throw refuse("rev {R} holds no card {ID}, so there is no text in it to restore", /* plant:txrd-rd7 */
    { R: keptRev + " (" + edition + ")", ID: JSON.stringify(id) });
  if (!was) throw refuse("edition {E} holds no card {ID}, so there is no text in it to restore",
    { E: edition, ID: JSON.stringify(id) });
  return withDraft(dir, (draft) => {
    const card = (draft.cards || []).find(c => c.id === id);
    if (!card) throw refuse("no card {ID} in this catalog", { ID: JSON.stringify(id) });
    for (const f of ["title", "body"]) {
      if (was[f] !== undefined) card[f] = JSON.parse(JSON.stringify(was[f]));
      else delete card[f];
    }
    if (was.bodyShape !== undefined) card.bodyShape = was.bodyShape;
    else delete card.bodyShape;
    return { card, restored: edition };
  });
}

/** Two editions compared over one card: the Archive's own diff over a catalog holding only that card. */
async function diffCardEditions(dir, id, a, b) {
  const home = path.resolve(dir);
  const have = editionsIn(home);
  for (const e of [a, b]) if (have.indexOf(e) < 0)
    throw refuse("the archive at {P} has no edition {E}; it has {LIST}",
      { P: path.join(home, ARCHIVE), E: e, LIST: have.join(", ") || "none" });
  const F = await Engine.format();
  const only = (edition) => {
    const cat = archivedCatalog(home, edition);
    const card = (cat.cards || []).find(c => c && c.id === id);
    return { cat, doc: { cards: card ? [card] : [] } };
  };
  const [x, y] = [only(a), only(b)];
  const d = diffCatalogs(x.doc, y.doc, F.canonical, { values: true });
  const cuts = [];
  const lines = diffLines(d, { values: true, width: 70, cuts });
  return { id, a, b, heads: { a: editionHead(home, a, x.cat), b: editionHead(home, b, y.cat) },
           same: d.same, summary: summary(d), lines, rows: diffRows(lines, cuts) };
}

/* ---- a catalog file opened as a project -------------------------------------------------------
 *
 * THE UPGRADE IS `node tools/catalog-v2/convert.mjs` AND NOT A SECOND CONVERTER. The pinned
 * `roundTrip` is the whole of it: it converts forward, converts back, compares the two format 1
 * files and classifies every difference as one the converter chose or one nobody chose. The
 * command line calls that function, prints its counts and writes `JSON.stringify(v2, null, 1)`;
 * this calls the same function with the same options and writes through `json`, which is that
 * same line. tests/upgrade-screen.mjs holds the two doors to one sha256 on the file.
 *
 * SO THE SCREEN REFUSES EXACTLY WHAT THE COMMAND LINE REFUSES. A problem, or a difference on
 * the way back that the converter did not choose, means nothing is written at all - not a
 * catalog with a note on it. A conversion nobody can check is a conversion nobody should run
 * over the only copy of somebody's content, which is what roundtrip.mjs says at its head, and a
 * screen that landed one anyway would be the reason that oracle stops meaning anything.
 *
 * WHAT IT CHANGED IS THE CONVERTER'S OWN SENTENCES, each with the count beside it: the same
 * lines `convert.mjs` prints under "declared". They are not translated and not reworded here,
 * for the reason the review queue's screen gives - a line the command line already prints is
 * wording that is already in the product, and an invented paraphrase of it is not.
 *
 * IT RUNS TWICE, ONCE FOR THE COVER AND ONCE FOR THE LANDING, as the import wizard does and for
 * the same reason: holding the first answer and writing it later would make what lands
 * different from what was shown the moment anything about the file changed underneath.
 */
/* WHICH SHAPE THE PICKED FILE IS, ASKED BEFORE A WORD OF IT IS READ. Board item 501.
 *
 * A desk's own catalog picked here read as a ruin: the cards counted, 0 categories, 0 intents,
 * and three findings per card saying it names a category the file does not declare and has no
 * title and no body in the primary language. Nothing was wrong with the file. This door handed
 * EVERY file to the format 1 reader, and a format 1 card carries `c`, `t`, `en` and `pl` where a
 * format 2 card carries `shelf`, `title` and `body`, with the categories and the intents at the
 * head of the document rather than in `tags` - so the converter was faithfully reporting that a
 * format 2 document is not a format 1 one. Measured over the shipped sample, which is the same
 * shape and public: 29 cards, 0 categories, 0 intents, 87 problems, three per card.
 *
 * THE DECLARATION DECIDES AND THE PINNED READER GIVES THE VERDICT. `format` and `kind` are the
 * two fields the format exists to declare, and they are compared with the pinned format's own
 * constants rather than with a literal here; a document that declares them is then handed to the
 * engine's own loadCatalog, and its refusal - a stale hash, a repeated id, anything a desk would
 * turn away - is the problem this cover shows, with nothing written. No shape is guessed from
 * the cards, because guessing is what produced the finding above.
 *
 * A FILE THAT DECLARES NEITHER FALLS THROUGH UNTOUCHED, container and evaluation and all: a
 * hand-written format 1 catalog is a JavaScript object literal with bare keys rather than JSON,
 * so the sniff can only ever be a soft one that the pinned format 1 reader gets to answer for.
 *
 * A FORMAT 2 DOCUMENT IS TAKEN AS IT STANDS. There is nothing to convert, so nothing is declared
 * changed and the cover's What changes row does not appear, and the counts are the tags' own
 * kinds, which is where this format keeps its categories and its intents.
 */
/* WHICH DOOR A FILE GOES THROUGH (import-no-spreadsheet-door, the Studio batch of 2026-10-12): "catalog" for an Etiuda
   catalog, a format 2 document or a format 1 one by the pinned readers, which the upgrade opens; "import" for anything
   else, which the import wizard reads by its bytes. A format 1 reading counts only where it declares format 1 (or the
   format's kind) over a list of cards, so a vendor's JSON export that happens to parse is not taken for a catalog. */
async function bringKind(file) {
  const at = path.resolve(String(file || ""));
  const F = await Engine.format();
  try { const doc = readCatalogDocument(at); if (doc && doc.kind === F.KIND) return { kind: "catalog" }; } catch { /* not format 2 */ }
  /* A FILE THAT NAMES A 1.x CATALOG IN ITS FIRST 4 KB GOES TO THE UPGRADE, at any extension and declared or not (Clément's
     read of studio-import): the wizard read such a file's source lines as a column and made a project of junk from it.
     The upgrade opens it or refuses it truthfully. The same sniff notACatalog makes. */
  let head = "";
  try { head = fs.readFileSync(at, "utf8").slice(0, 4096); } catch { head = ""; }
  if (/\b(PB_CATALOG|PB_SAMPLE)\b/.test(head)) return { kind: "catalog" };
  if (/\.(js|json|ec)$/i.test(at)) {
    try { const v1 = Engine.readCatalogV1()(at); if (v1 && (+v1.format === 1 || v1.kind === "playbook-catalog") && Array.isArray(v1.cards)) return { kind: "catalog" }; } catch { /* not format 1 */ }
  }
  return { kind: "import" };
}
async function upgradeOf(file) {
  const at = path.resolve(String(file || ""));
  if (!fs.existsSync(at)) throw refuse("no file at {P}", { P: at });
  const F = await Engine.format();
  let doc = null;
  try { doc = readCatalogDocument(at); } catch { doc = null; }
  if (doc && +doc.format === +F.FORMAT && doc.kind === F.KIND) {
    const { loadCatalog } = Engine.lint();
    const problems = [];
    try { loadCatalog(at); }
    catch (e) { problems.push(e && e.message ? e.message : String(e)); }
    const D = Engine.deskRules();
    if (!problems.length && doc.desk && D.deskFileGenuine(doc, doc.desk.id))
      return { at, v2: asNewCatalog(doc, F, D), declared: [], problems, differs: [], adoptedFrom: adoptedFromOf(doc),
               named: path.basename(at).replace(/\.ec$/i, "") };
    return { at, v2: doc, declared: [], problems, differs: [] };
  }
  const R = await Engine.converter();
  const readV1 = Engine.readCatalogV1();
  let v1 = null;
  try { v1 = readV1(at); } catch { v1 = null; }
  if (!v1 || typeof v1 !== "object" || Array.isArray(v1)) throw notACatalog(at);
  const r = R.roundTrip(v1, {});
  return {
    at, v2: r.v2,
    /* Only the kinds that happened: a row saying that none of something was lost is a row
       about nothing. The counts are the converter's own, in its own order. */
    declared: Object.keys(r.declared).filter(k => r.declared[k])
      .map(k => ({ what: k, n: r.declared[k] })),
    problems: r.problems.slice(),
    /* Paths, never values, exactly as the command line prints them: an unexpected difference is
       a defect in the converter and the path is what finds it, while the words on either side
       belong to whoever wrote the catalog. */
    differs: r.unexpected.map(d => d.path + " (" + d.kind + ")"),
  };
}

/* A DESK'S OWN FILE OPENED AS A PROJECT IS A NEW CATALOG (design note, section 6): one id is one
   catalog, so it is given a new one and comes in at no edition. An import starts its own lineage and keeps no `grew`:
   a desk judges a catalog listed by the ROOT of its grew chain, so a `grew` naming the desk's file would make the
   team's own catalog read unlisted on every member's desk once the lead publishes it (its work sealed to the lead's
   box, Private offered on it). The link back to the file it was made from is kept in the team file's `adopted` (board 1015,
   below), never as a field of the catalog. The desk's block and signature describe the desk's file and stay with it. */
/* WHAT THE TEAM FILE KEEPS OF A MEMBER'S DESK FILE MADE INTO A CATALOG (board 1015): the desk's id and the SHA-256 of the file's own
   id, which a team file never carries itself (the id can hold its author's name, and every member reads the team file). Only a
   genuine desk file has one; null otherwise. It rides in the project's own file until the catalog joins a team. */
function adoptedFromOf(doc) {
  const D = Engine.deskRules();
  if (!doc || !doc.desk || typeof doc.desk.id !== "string" || !doc.id || !D.deskFileGenuine(doc, doc.desk.id)) return null;
  return { desk: doc.desk.id, original: crypto.createHash("sha256").update(String(doc.id), "utf8").digest("hex") };
}
function asNewCatalog(doc, F, D) {
  const out = JSON.parse(JSON.stringify(doc));
  delete out.grew; /* plant:grew-drop */
  ["desk", "sig", "hash", "modified", "date"].forEach(k => { delete out[k]; });
  out.id = newCatalogId(F);
  out.rev = 0;
  out.hash = F.contentHash(out);
  return out;
}

/* WHAT THE FORMAT 1 READER REFUSED, SAID IN A FRAME rather than in its parser's English. A file
   that opens like a catalog is called damaged; one the importer reads as a table is sent to the
   door that reads tables. */
function notACatalog(at) {
  const FILE = path.basename(at);
  let head = "";
  try { head = fs.readFileSync(at, "utf8").slice(0, 4096).replace(/^﻿/, "").trimStart(); }
  catch { head = ""; }
  const catalogLike = /^[{[]/.test(head) || /\b(E_CATALOG|PB_CATALOG|PB_SAMPLE)\b/.test(head);
  const read = catalogLike ? null : attempt({ file: at });
  if (read && !read.refusal && read.src.table.rows.length
      && ["table", "periodic", "column"].indexOf(read.src.shape) >= 0)
    return refuse("{FILE} is a table rather than a catalog file: Import into this catalog, in any"
      + " open catalog, reads tables and can make one a new catalog", { FILE });
  return refuse("{FILE} could not be read as a catalog file, perhaps because it is damaged or is not"
    + " a catalog file at all", { FILE });
}

/* A CATALOG ALREADY IN STUDIO COMES IN AS A SECOND PROJECT under a name of its own, and keeps
   its id, which is what makes its next publish the next revision of the same catalog on every
   desk. `free` is the first name whose folder is not taken, for the cover to offer. */
function upgradeFacts(root, u) {
  const v2 = u.v2;
  /* A new catalog's folder is named by its file, since its id was minted a moment ago and says nothing. */
  const base = u.named ? Engine.fileStem()(u.named) : v2.id;
  const dir = projectDir(root, base);
  const exists = fs.existsSync(dir);
  let free = null;
  for (let n = 2; exists && !free && n < 100; n++) {
    const name = base + " " + n;
    const at = projectDir(root, Engine.fileStem()(name));
    if (!fs.existsSync(at)) free = { name, dir: at };
  }
  return {
    file: u.at, base: path.basename(u.at),
    id: v2.id, name: path.basename(dir), rev: +v2.rev || 0, edition: v2.date || "",
    dir, exists, free,
    counts: countsOf(v2),
    shapes: ["plain", "steps", "alts"].map(k =>
      ({ shape: k, n: (v2.cards || []).filter(c => c.bodyShape === k).length })),
    langs: (v2.langs || []).map(l => l.code),
    declared: u.declared,
    problems: u.problems,
    differs: u.differs,
  };
}

async function upgradePlan(root, file) {
  return upgradeFacts(root, await upgradeOf(file));
}

async function upgradeLand(root, file, name, o) {
  const u = await upgradeOf(file);
  const facts = upgradeFacts(root, u);
  /* THE BRACKETED PLURAL IS GONE FROM BOTH (board 523): a count is a counted noun, and the
     count stands at the head as the subject because Polish can put it nowhere else. */
  if (facts.problems.length) throw refuse("{PROBLEMS}, nothing written: {LIST}", {
    PROBLEMS: counted(facts.problems.length, "{N} problem", "{N} problems"),
    LIST: facts.problems.slice(0, 4).join("; ") });
  if (facts.differs.length) throw refuse("{DIFFERENCES} on the way back, nothing written: {LIST}", {
    DIFFERENCES: counted(facts.differs.length, "{N} unexpected difference",
      "{N} unexpected differences"),
    LIST: facts.differs.slice(0, 4).join("; ") });
  const named = String(name || "").trim();
  const dir = named ? projectDir(root, Engine.fileStem()(named)) : facts.dir;
  if (fs.existsSync(dir)) throw refuse("there is already a folder at {DIR}; an upgrade never writes"
    + " over a catalog that is already there", { DIR: dir });
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, DRAFT_FILE), json(u.v2), "utf8");
  /* THE REVISION AND THE EDITION COME OFF THE FILE, unlike an import's, which starts at zero: a
     format 1 catalog has been published before, its `version` label became the edition and its
     revision is whatever the converter carried, so the next publish from here is the next
     revision of the same catalog rather than its first. */
  /* Desks may already read this catalog under the file it came from, so its first publish suggests that. A desk's catalog
     landed by an answer came from no file a desk reads, so its caller names it (`o`, landCatalog). */
  const shown = o && typeof o.displayName === "string" ? { displayName: o.displayName } : {};
  /* A member's desk file made into a catalog: who it came from, kept with the project until it joins a team (chooseTeam). */
  const from = (o && o.adoptedFrom) || u.adoptedFrom;
  const came = from && from.desk && from.original ? { adoptedFrom: { desk: String(from.desk), original: String(from.original) } } : {};
  writeProject(dir, Object.assign({ id: u.v2.id, rev: +u.v2.rev || 0,
    edition: u.v2.date || "", draft: DRAFT_FILE, folder: null,
    fileNameFrom: o && typeof o.fileNameFrom === "string" ? o.fileNameFrom : path.basename(u.at) }, shown, came));
  return Object.assign(await openProject(dir), { upgrade: facts });
}

/* ---- quick facts ------------------------------------------------------------------------------
 *
 * ONE TEXT AND NOT ONE PER LANGUAGE, because that is what the format carries: `facts` is a
 * STRING on the catalog (spec 2.0.0 section 2.4, and catalog-v2.js reads
 * `typeof data.facts === "string"` and nothing else), which the engine paints in its quick facts
 * panel whatever language the desk is reading in. A table keyed by language written here would
 * be hashed into the file and then silently dropped by every desk that loaded it, which is worse
 * than not offering it at all. Whether format 2 should carry one per language is a question for
 * the engine and it is in the office queue.
 *
 * AN EMPTIED TEXT IS WRITTEN AS THE EMPTY STRING rather than taken out of the file, in the
 * engine's own words at the line that reads it: quick facts emptied on purpose is not quick
 * facts never written, and the reader falls back to its built-in text on absence alone. Nothing
 * writes this key until somebody edits it, so a catalog that never had facts does not gain one.
 */
async function saveFacts(dir, text) {
  return withDraft(dir, (draft) => {
    draft.facts = String(text == null ? "" : text);
    return { facts: draft.facts };
  });
}

/* ---- the team's variables ----------------------------------------------------------------------
 *
 * THE FORMAT'S `variables`, WRITTEN WHOLE: the page holds the one object a lead edits and sends it as
 * it stands, so there is no partial write to merge. Its shape is the engine's (catalog-v2.js
 * v2VarProblems at the pin), which the lint reports through the engine's reader; nothing here
 * re-reads it. A list emptied and the hours put back leave no key behind, so a catalog that never
 * had variables does not gain one.
 */
async function saveVariables(dir, variables) {
  return withDraft(dir, (draft) => {
    const v = variables && typeof variables === "object" && !Array.isArray(variables) ? variables : {};
    const list = Array.isArray(v.list) ? v.list : [];
    const out = {};
    if (v.hours && typeof v.hours === "object") out.hours = v.hours;
    if (list.length) out.list = list;
    if (Object.keys(out).length) draft.variables = JSON.parse(JSON.stringify(out));
    else delete draft.variables;
    return { variables: draft.variables || null };
  });
}

/* ---- the project's own name -------------------------------------------------------------------
 *
 * THE NAME IS PROJECT.JSON'S `displayName` AND THE FOLDER FOLLOWS IT (Maxim, 2026-09-30 11:15), ALL OR
 * NOTHING: the folder moves first, the name is written after, and a failed write moves the folder back.
 * The older `name` key of a record is neither read nor rewritten (the 2026-09-29 ruling, 0a0e104).
 */
const RENAME_STUCK_REFUSAL = "The name could not be written, and the folder could not be put"
  + " back either: the catalog now lies in {NOW}, and was in {WAS}."
  + " Nothing is lost. Open it where it lies, or move the folder back by hand.";
async function renameProject(dir, name, o) {
  const clean = String(name || "").trim();
  if (!clean) throw refuse("a catalog needs a name");
  const home = path.resolve(String(dir || ""));
  const found = projectAt(home);
  if (!found) throw refuse("no catalog in {DIR}", { DIR: home });
  const to = projectDir(path.dirname(home), Engine.fileStem()(clean));
  /* The same folder on disk under another spelling (a change of case, as Windows reads it) is renamed rather than
     refused. It is asked of the disk, not of toLowerCase(), which folds some letters Windows does not. */
  if (to !== home) {
    const same = fs.existsSync(to) && fs.realpathSync.native(to) === fs.realpathSync.native(home);
    if (!same && fs.existsSync(to))
      throw refuse("there is already a folder at {DIR}", { DIR: to });
    /* A share inside the project would move with the folder, away from the desks reading it; the same folder on disk
       moves nothing, so it is not asked. */
    const resolved = folderHere(found.project, o);
    const share = resolved ? path.resolve(resolved) : "";
    const rel = share ? path.relative(home, share) : "..";
    if (!same && rel !== ".." && !rel.startsWith(".." + path.sep) && !path.isAbsolute(rel))
      throw refuse("The team reads this catalog from {DIR}, which is inside the catalog's own folder,"
        + " so renaming it would move that folder out of its reach. Change folder beside Writes"
        + " to chooses one outside the catalog, and the rename can follow.", { DIR: share });
    renamePatiently(home, to);
  }
  try {
    writeProject(to, Object.assign({}, found.project, { draft: found.draftName, displayName: clean }));
  } catch (e) {
    if (to !== home) {
      try { renamePatiently(to, home); }
      catch { throw refuse(RENAME_STUCK_REFUSAL, { NOW: to, WAS: home }); }
      if (e && typeof e === "object" && e.path) e.path = path.join(home, PROJECT_FILE);
    }
    throw e;
  }
  return { dir: to, was: home, name: clean, id: found.project.id };
}

/* ---- the published file's own name ---------------------------------------------------------------
 *
 * THE ONE ACT THAT RENAMES A FILE DESKS ALREADY READ: it moves the one .ec and records the name, and
 * nothing else on the share, in the archive or in the draft moves (the ring and stats/ are keyed by id).
 */
const CHANGE_TAKEN_REFUSAL = "{FOLDER} already holds a file named {FILE}, so the catalog keeps {NAME}."
  + " Any name not yet in that folder will do.";
const CHANGE_STUCK_REFUSAL = "The name could not be recorded, and the file could not be put back either:"
  + " the catalog file now lies in {FOLDER} as {NOW}, and its record still says {WAS}. Choosing {NOW} under"
  + " Change file name repairs the record, and until then a publish is refused.";
const CHANGE_OTHER_REFUSAL = "{FILE} in {FOLDER} is another catalog's file, so it stays where it is and this"
  + " catalog's file keeps its name.";

async function changeFileName(dir, name, o) {
  const home = path.resolve(String(dir || ""));
  const p = readProject(home);
  const id = String(p.draft.id || p.project.id);
  const from = fixedName(home, p.project, id);
  if (!from) throw new Error("changeFileName is called for a project that has published, and "
    + home + " has not: its first publish fixes the name");
  const slug = await fileSlug(name);
  if (!slug) throw refuse(EMPTY_SLUG_REFUSAL, { TEXT: JSON.stringify(String(name == null ? "" : name)) });
  const to = slug + ".ec";
  if (to === from) return { fileName: from, moved: false, dir: home };
  const record = () => writeProject(home, Object.assign({}, p.project, { fileName: to }));
  const resolvedName = folderHere(p.project, o);
  const shown = resolvedName ? path.resolve(resolvedName) : null;
  const folder = shown || null;
  if (!folder) { record(); return { fileName: to, moved: false, dir: home }; }
  fs.statSync(folder);                 /* a share that does not answer throws here, the disk's own refusal */
  const fromAt = path.join(folder, from), toAt = path.join(folder, to);
  if (!fs.existsSync(fromAt)) { record(); return { fileName: to, moved: false, dir: home }; }
  if (!holdsId(fromAt, id, o && o.teamKeys)) throw refuse(CHANGE_OTHER_REFUSAL, { FILE: from, FOLDER: shown }); /* plant:fp8-rename-keys */
  if (fs.existsSync(toAt)) throw refuse(CHANGE_TAKEN_REFUSAL, { FOLDER: shown, FILE: to, NAME: from });
  renamePatiently(fromAt, toAt);
  try { record(); }
  catch (e) {
    try { renamePatiently(toAt, fromAt); }
    catch { throw refuse(CHANGE_STUCK_REFUSAL, { FOLDER: shown, NOW: to, WAS: from }); }
    throw e;
  }
  return { fileName: to, moved: true, dir: home };
}

/* ---- declaring, ordering and removing a language ------------------------------------------
 *
 * THE FOUR VERBS ARE THE TAG VERBS' SHAPE, deliberately: a declared language is an ordered list
 * a person adds to, moves within and takes out of, and the one above it is the primary. What
 * makes this list different from the tags' is that removing an entry cannot refuse on use - a
 * language is always in use - so the refusal is replaced by a two-step, and the sentence a
 * person meets carries the numbers rather than the word "permanently".
 */

/** What a desk built from the pin can READ, and what the engine calls each language in itself:
 *  the two halves of the answer the New project cover and the settings screen both open on.
 *  Both come out of the pinned engine's own source, so neither is a second table here. */
function builtLangs() {
  return { builtIn: Engine.builtInLangs(), endonyms: Engine.langEndonyms() };
}

/** The end-user agreement in `lang` (pl, or English for anything else), as the About's "Read the licence"
 *  shows it: packaging/license_<lang>.txt, the installer's own licence page, which electron-builder.js also
 *  ships inside the program for this one reader. Read off the disk the program runs from; nothing is asked
 *  of a network, which is the promise the agreement itself makes. */
function agreementText(lang) {
  const file = new URL("../packaging/license_" + (lang === "pl" ? "pl" : "en") + ".txt", import.meta.url);
  return fs.readFileSync(file, "utf8").replace(/^\uFEFF/, "");
}

/** The declared set a caller asked for, checked; `fallback` is what nothing asks for. */
function declaredFrom(langs, fallback, endonyms) {
  const want = Array.isArray(langs) && langs.length ? langs : fallback;
  const out = [];
  for (const x of want) {
    const code = String((x && x.code != null ? x.code : x) || "").trim().toLowerCase();
    if (!LANG_CODE.test(code)) throw refuse(LANG_CODE_REFUSAL, { CODE: JSON.stringify(code) });
    if (out.some(l => l.code === code)) throw refuse(LANG_TWICE_REFUSAL, { CODE: code });
    const label = String((x && x.label) || "").trim()
      || (endonyms || {})[code] || code.toUpperCase();
    out.push({ code, label });
  }
  if (!out.length) throw refuse(LANG_NONE_REFUSAL);
  return out;
}

async function addLang(dir, code, label) {
  const want = String(code || "").trim().toLowerCase();
  if (!LANG_CODE.test(want)) throw refuse(LANG_CODE_REFUSAL, { CODE: JSON.stringify(want) });
  const endonyms = Engine.langEndonyms();
  return withDraft(dir, (draft) => {
    const langs = draft.langs || (draft.langs = []);
    if (langs.some(l => l && l.code === want)) throw refuse(LANG_TWICE_REFUSAL, { CODE: want });
    const name = String(label || "").trim() || endonyms[want] || want.toUpperCase();
    langs.push({ code: want, label: name });
    return { lang: { code: want, label: name } };
  });
}

/** Up or down by one, and the entry that reaches the head IS the primary: nothing else in the
 *  format says which language a catalog reads first. The refusal at either end is the tag
 *  list's, a value rather than a throw, because pressing an arrow on the top row is not a
 *  mistake a person needs a sentence about.
 *
 *  A LANGUAGE SOME CARDS LACK IS MADE THE PRIMARY ONLY ON THE SECOND ASK, carrying how many
 *  (Maxim, 2026-09-22): every card must carry the primary, so one press would otherwise turn
 *  a clean catalog into one the reader refuses. It is removeLang's two-step. */
async function moveLang(dir, code, delta, opts) {
  const o = opts || {};
  return withDraft(dir, (draft) => {
    const langs = draft.langs || [];
    const at = langs.findIndex(l => l && l.code === code);
    if (at < 0) throw new Error("no language " + JSON.stringify(String(code))
      + " in this catalog; moveLang is called with a code the draft it was handed declares");
    const to = at + (+delta < 0 ? -1 : 1);
    if (to < 0 || to >= langs.length) return { refused: "at the end", moved: false };
    const was = langs[0].code;
    const keep = langs[at]; langs[at] = langs[to]; langs[to] = keep;
    const head = langs[0].code;
    const lacking = head === was ? 0 : langLacking(draft, head);
    if (lacking && !o.confirm) return Object.assign({ refused: "not confirmed", moved: false,
      lang: head, lacking, of: (draft.cards || []).length },
      refusalOf(LANG_PRIMARY_REFUSAL,
        { CODE: head, CARDS: counted(lacking, "{N} card", "{N} cards") }));
    return { lang: keep, moved: true, primary: head };
  });
}

/* REMOVING A LANGUAGE DISCARDS ITS TEXT FROM THE DRAFT. Where no archived edition holds that
 * language, nothing else has a copy, and the warning says so. Where one does, that sentence
 * would be false: the edition still holds what was published, and the warning says that instead.
 * Either way the screen says the draft's text can be put back from Changes. The act takes
 * `confirm` and refuses without it, carrying the same counts the screen showed, so a script,
 * an agent and a person all meet a warning that is true.
 *
 * THE GREETING AND THE NOISE WORDS GO WITH IT, and they are not an afterthought: the pinned
 * reader's `v2LangProblems` calls `greet.de` on a catalog that no longer declares de an ERROR,
 * so a removal that left them behind would leave a catalog nothing can load. Measured against
 * the pin rather than remembered.
 */
async function removeLang(dir, code, opts) {
  const o = opts || {};
  return withDraft(dir, (draft) => {
    const langs = draft.langs || [];
    const at = langs.findIndex(l => l && l.code === code);
    if (at < 0) throw new Error("no language " + JSON.stringify(String(code))
      + " in this catalog; removeLang is called with a code the draft it was handed declares");
    if (langs.length < 2) throw refuse(LANG_LAST_REFUSAL, { CODE: code });
    const uses = langUses(draft, code);
    if (!o.confirm) {
      const held = langsHeldInArchive(path.resolve(dir)).has(code);
      return Object.assign({ refused: "not confirmed", uses, removed: false, held },
        refusalOf(held ? LANG_GOING_HELD_REFUSAL : LANG_GOING_REFUSAL, {
          CODE: code,
          CARDS: counted(uses.cards, "{N} card", "{N} cards"),
          INTENTS: counted(uses.intents, "{N} intent", "{N} intents"),
          CATS: counted(uses.cats, "{N} category", "{N} categories"),
          PINS: counted(uses.pins, "{N} card", "{N} cards"),
        }));
    }
    langs.splice(at, 1);
    for (const c of draft.cards || [])
      for (const f of ["title", "body", "note"]) if (c[f]) delete c[f][code];
    for (const t of draft.tags || [])
      for (const f of ["label", "clause", "topic", "action"]) if (t[f]) delete t[f][code];
    /* A topic or an action left with no language goes whole, as saveTag takes it off (board 1018, piece A). */
    for (const t of draft.tags || [])
      for (const f of ["topic", "action"]) if (t[f] && !Object.keys(t[f]).length) delete t[f];
    /* A card pinned to the language goes back to following the language in use (the test architect's F2): a pin to a
       language the catalog no longer declares is one a desk ignores, Studio refuses to set again, and a later add of the
       language would bring back without anyone choosing it. */
    for (const c of draft.cards || []) if (c.lockLang === code) delete c.lockLang; /* plant:f2-pin */
    if (draft.greet) delete draft.greet[code];
    if (draft.stop) delete draft.stop[code];
    if (draft.commentLang === code) draft.commentLang = langs[0].code;
    return { uses, removed: true, primary: langs[0].code };
  });
}

/** Which language the comments in this catalog are written in, which is an axis of its own: a
 *  catalog may speak five and be commented in one. */
async function setCommentLang(dir, code) {
  return withDraft(dir, (draft) => {
    const langs = draft.langs || [];
    if (!langs.some(l => l && l.code === code))
      throw new Error("no language " + JSON.stringify(String(code)) + " in this catalog;"
        + " setCommentLang is called with a code the draft it was handed declares");
    draft.commentLang = code;
    return { commentLang: code };
  });
}

function setPublishFolder(dir, folder, opts) {
  const home = path.resolve(dir);
  const found = projectAt(home);
  if (!found) throw refuse("no catalog in {DIR}", { DIR: home });
  const check = folder ? folderCheck(folder, home, { probe: true }) : null;
  /* A SHARE CAN BE OUT OF REACH WHEN IT IS CHOSEN (a drive not mapped yet, a network down): it is recorded, and its check
     says so. What is refused is a file in a folder's place, and a folder Studio cannot write to. */
  if (check && check.file) throw refuse("{DIR} is a file, not a folder.", { DIR: check.folder });
  if (check && check.exists && !check.writable) throw refuse("Studio cannot write to {DIR}, so it cannot publish an edition there.",
    { DIR: check.folder });
  const project = Object.assign({}, found.project,
    { draft: found.draftName, folder: folder ? path.resolve(folder) : null });
  const o = opts || {};
  let live = o.placeFns && typeof o.placeFns.placeOf === "function" ? o.placeFns : null;
  if (!live) {
    try {
      const rules = Engine.placeRules();
      if (rules && typeof rules.placeOf === "function") live = rules;
    } catch (e) { live = null; }
  }
  /* No reader yet (the pin does not carry one): a folder that did not change keeps a place already written, and a
     different folder drops it, so a stale root is never left beside a path it no longer describes. */
  if (!project.folder) delete project.place;
  else if (live) {
    const place = placeFor(project.folder, Object.assign({}, o, { placeFns: live }));
    if (place) project.place = place;
    else delete project.place;
  } else if (String(found.project.folder || "") !== String(project.folder || "")) delete project.place;
  writeProject(home, project);
  return { folder: project.folder, check };
}

/* THE TEAM'S FOLDER CHECKED WHEN IT IS CHOSEN (start-folder-unchecked, the Studio batch of 2026-10-12): that it is a folder,
   that Studio can write a file there and take it back (only when it is chosen, `probe`), and where it lives. `cloud` is
   "onedrive" for a folder the OneDrive client keeps in step and "sharepoint" for a library it syncs beside its own folder,
   by the folders Windows names for that client, and "dropbox" or "gdrive" by those clients' folders (cloudOf); `local` is a
   folder on this computer's own system disk, which the desks on other computers read only if it is shared with them; a
   network path, and a drive letter Studio cannot tell from a mapped share, are neither. Nothing in the folder is read.
   THE PROBE IS WRITTEN EXCLUSIVELY AND TAKEN BACK ONLY WHEN WRITTEN (Clément's read of studio-folder): a file of its name
   is never overwritten or removed, and a take-back the folder refuses (a share that lets a file be made but not removed,
   or a sync client holding it) is named in `leftover` and said, rather than left without a word. */
function folderCheck(folder, home, o) {
  const at = path.resolve(String(folder));
  const out = { folder: at, exists: false, writable: false, cloud: "", local: false,
    inside: !!home && insideOf(at, [home, path.join(home, ARCHIVE)]) };
  try { const st = fs.statSync(at); out.exists = st.isDirectory(); out.file = !st.isDirectory(); } catch { out.exists = false; }
  if (out.exists && o && o.probe) {
    let wrote = "";
    for (let n = 0; n < 3 && !wrote; n++) {
      const probe = path.join(at, ".etiuda-probe-" + process.pid + "-" + Date.now() + "-" + crypto.randomBytes(4).toString("hex"));
      try { fs.writeFileSync(probe, "", { flag: "wx" }); wrote = probe; }
      catch (e) { if (!e || e.code !== "EEXIST") break; }
    }
    out.writable = !!wrote;
    if (wrote) { try { fs.unlinkSync(wrote); } catch { out.leftover = path.basename(wrote); } }
  } else out.writable = out.exists;
  out.cloud = cloudOf(at, process.env);
  out.local = !out.cloud && !/^[\\/]{2}/.test(at) && onSystemDisk(at, process.env);
  return out;
}
/* onSystemDisk and cloudOf are src/where.cjs: the shell asks the same two questions of the projects folder (root-hold.cjs). */

/* ---- the team at the folder, for the Desks screen (board 834, the sealed team) ---------------------------------------
 * teamFacts reads the folder's team file as this Studio's key judges it; setTeamSealed reads, changes, signs and writes it in
 * one call, because a held team does not cross a thread (src/team.mjs). No team key comes here but a new team's, which the
 * shell has kept under `teamId` before it calls. */
const insideOf = (folder, homes) => homes.some(h => {
  const rel = path.relative(path.resolve(folder), path.resolve(h));
  return !rel || (!rel.startsWith("..") && !path.isAbsolute(rel));
});
/* A desk's key as the desk itself prints it for comparing (the engine's desk-look.js deskKey): the 16 hex of its id. */
const deskPrint = (id) => String(id || "").replace(/^k-/, "");
/* The 16 hex the desks compare for a lead: the public half's own fingerprint, never a keyId a file chose (keyIdFor). */
const leadPrintOf = (publicHex) => keyIdFor(publicHex).slice("studio-".length);

/* EACH DESK'S ETIUDA VERSION, AS THE DESK ALREADY REPORTS IT (the version policy Max adopted 2026-11-01 01:27, point 5: "The
   Desks table shows each desk's Etiuda version, read from what the desk already reports"). A desk says its version in one
   place, the `engine` of its statistics answer (desks/<id>/stats.estat), sealed to the lead's box and signed by the desk;
   it is read here as statsFor reads it, opened and taken only where the roster's key for that folder signed it. A desk with
   no answer yet, or one that does not open, has no version here rather than a guessed one. {desk id: version}. */
function deskVersions(folder, team, keyFile, secret) {
  const out = {};
  if (!folder || !team || !secret) return out;
  const read = readKeyFile(keyFile);
  if (!read) return out;
  let keys = [];
  try { keys = statsKeysOf(read, unlockKey(read, secret)); } catch { keys = []; }
  if (!keys.length) return out;
  const R = Engine.statsRules();
  for (const e of team.roster || []) {
    if (!e || !e.desk || !/^k-[0-9a-f]{16}$/.test(String(e.desk.id))) continue;
    const id = String(e.desk.id);
    let doc = null;
    try { doc = JSON.parse(fs.readFileSync(path.join(folder, "desks", id, "stats.estat"), "utf8").replace(/^\uFEFF/, "")); }
    catch { continue; }
    const text = statsOpenAny(R, keys, statsEnvelopeByName(doc), id);
    if (text == null) continue;
    let answer = null;
    try { answer = JSON.parse(text); } catch { continue; }
    if (!R.statsAnswerGenuine(answer, id, String(e.desk.key || ""))) continue; /* plant:p5-version-genuine */
    if (answer && typeof answer.engine === "string" && versionParts(answer.engine)) out[id] = answer.engine;
  }
  return out;
}

/* A desk's statistics opened under the first of `keys` that opens them (src/sign.mjs statsKeysOf), or null. */
function statsOpenAny(R, keys, env, deskId) {
  for (const k of keys) { const text = R.openStatsSealed(k, env, deskId); if (text != null) return text; }
  return null;
}

function teamSummary(team, id, versions, minEngine) {
  const lists = team.catalogs.indexOf(String(id)) >= 0;
  const v = versions && typeof versions === "object" ? versions : {};
  return { id: team.id, epoch: team.epoch, catalogs: Array.isArray(team.catalogs) ? team.catalogs.length : 0, sealed: team.sealed === true && lists, lists, exportsSealed: team.exportsSealed === true,
    recovery: team.recovery !== undefined,
    ...(team.sharing === "off" ? { sharing: "off" } : {}),
    ...(team.channel && team.channel.kind === "relay" ? { relay: true } : {}),
    /* The 16 hex a desk shows the agent to compare once it is let in: the pinned shell's leadPrint, made from the public half. */
    leadPrint: leadPrintOf(team.lead.public),
    roster: team.roster.filter(e => e && e.desk).map(e => {
      const own = typeof e.desk.name === "string" ? e.desk.name : "", named = rosterName(team, e.desk.id);
      /* What the member says it is, and the door it came by: a label each, granting nothing (board 885, S2). An admitted
         member with no door came by the only door there was before, its request and its code. */
      return { id: e.desk.id, name: named || own || e.desk.id, own: named && own && own !== named ? own : "",
               rosterName: named || null,
               said: own, invite: typeof e.invite === "string" ? e.invite : "",
               key: deskPrint(e.desk.id), admitted: e.wrap !== undefined,
               kind: typeof e.desk.kind === "string" && e.desk.kind ? e.desk.kind : "desk",
               door: e.door === "invitation" || e.door === "auto" ? e.door : e.wrap !== undefined ? "code" : "",
               /* Its Etiuda version as it reports it, "" where it has not; `below` where the next edition asks for more. */
               version: typeof v[e.desk.id] === "string" ? v[e.desk.id] : "", /* plant:p5-version-row */
               below: !!(minEngine && typeof v[e.desk.id] === "string" && versionBelow(v[e.desk.id], minEngine) === true) };
    }) };
}

/** The team a project's own record names: {team, rt} (the seal mark's team id, the relay place's team id), or null where it names none. */
function teamMarkOf(project) {
  const p = project || {};
  const team = typeof p.sealedTeam === "string" ? p.sealedTeam : "";
  const rt = p.relay && typeof p.relay.rt === "string" ? p.relay.rt : "";
  return team || rt ? { team, rt } : null;
}
/** The team a project names taken off its record: the seal mark and the relay place. The one way leaveTeam, undoRelayTeam and letGoTeam
 *  do it, so a project let go of reads the same as one taken off. Returns the record it was given. */
function clearTeamMark(project) {
  delete project.sealedTeam;
  delete project.relay;
  return project;
}
/** Whether a project's Team screen offers to let go of its team: it names one, and this Studio's teams file, read whole, keeps no row
 *  for it. Never for a team this Studio holds, and never where teams.json cannot be read, which says nothing of who holds what. */
function letGoOffered(project, o) {
  const mark = teamMarkOf(project), opts = o || {};
  const tf = opts.teamsFile || (opts.userData ? teamsFile(opts.userData) : "");
  return !!mark && !!tf && teamHeldBy(tf, mark) === "none"; /* plant:letgo-held */
}
const LET_GO_NOT_OFFERED = "This Studio now holds that team's keys, or the project names no team any more, so nothing was let go.";

/** A project lets go of a team this Studio holds no keys for (a fresh profile after a reinstall, or a projects folder copied to a new
 *  computer): the team mark comes off its project.json through clearTeamMark, and the place at that team's mirror with it, as
 *  undoRelayTeam gives it back. Nothing else is written: not the draft, the catalog, the relay, teams.json or the mirror's path.
 *  Refused, with nothing written, wherever the Team screen would not have offered it (letGoOffered). */
async function letGoTeam(dir, o) {
  const opts = o || {}, home = path.resolve(String(dir || "."));
  const found = projectAt(home);
  if (!found) throw refuse("no catalog in {DIR}", { DIR: home });
  if (!letGoOffered(found.project, opts)) throw refuse(LET_GO_NOT_OFFERED); /* plant:letgo-refuse */
  const next = Object.assign({}, found.project);
  const rt = found.project.relay ? String(found.project.relay.rt || "") : "";
  const atMirror = !!rt && !!next.folder && path.basename(path.resolve(String(next.folder))) === rt;
  clearTeamMark(next);
  if (atMirror) next.folder = null; /* plant:letgo-mirror */
  writeProject(home, next); /* plant:letgo-write */
  return { letGo: true };
}

/** The team's facts for the catalog at `dir`. */
async function teamFacts(dir, o) {
  return teamFactsRead(dir, o);
}
async function teamFactsRead(dir, o) {
  const opts = o || {};
  /* A TEAM WITH NO CATALOG IS READ AT ITS MIRROR (`opts.atFolder`, named by the shell from the team's id): no project is read, so the
     team lists no catalog as this one's, nothing is inside, and the next edition's floor is the engine's own. */
  const own = typeof opts.atFolder === "string" && opts.atFolder !== ""; /* plant:tib-facts-own */
  const home = own ? "" : path.resolve(dir);
  const found = own ? null : projectAt(home);
  if (!own && !found) throw refuse("no catalog in {DIR}", { DIR: home });
  const resolved = own ? opts.atFolder : folderHere(found.project, opts);
  const shown = resolved ? path.resolve(resolved) : null;
  const folder = shown || null;
  const key = readKeyFile(opts.key), id = own ? "" : String(readProject(home).draft.id || "");
  const out = { folder: shown, id, mark: own ? null : found.project.sealedTeam || null, signing: key ? key.keyId : "", file: "none", reason: "",
                team: null, inside: false, requests: [], letGo: own ? false : letGoOffered(found.project, opts) };
  if (!folder) return out;
  if (!own) out.inside = insideOf(shown, [home, path.join(home, ARCHIVE)]);
  const read = await readTeam(folder);
  if (!read.team) { out.file = fs.existsSync(read.at) ? "broken" : "none"; return out; }
  /* K8: the key the folder's team trusts, so a Studio with none offers to restore that one before making another. */
  if (read.valid && read.team.lead) {
    out.lead = leadPrintOf(read.team.lead.public);
    out.leadPub = String(read.team.lead.public || "");
    out.leadKeyId = String(read.team.lead.keyId || "");
  }
  const held = key ? await heldTeam(folder, { key: opts.key }) : { team: null, reason: "" };
  if (!held.team) { out.file = held.older ? "older" : "theirs"; out.reason = held.reason; return out; }
  const tf = opts.teamsFile || (opts.userData ? teamsFile(opts.userData) : null);
  if (tf) clearKeyPending(tf, held.team.id, Number(held.team.epoch));
  /* The first pass that lists a request records when this Studio saw it. A later pass does not move that time. */
  let invites = opts.invites;
  if (tf) invites = withSeen(invites, noteFirstSeen(tf, held.team.id, inviteSightings(folder, held.team), opts.now));
  /* The edition the next publish would write asks for minEngine (src/engine-floor.mjs), and each desk's version is set beside
     it, so the press can warn before an edition no desk below it can show (the version policy, point 5). */
  let next = ENGINE_FLOOR;
  if (!own) { try { next = minEngineFor(readProject(home).draft); } catch { next = ENGINE_FLOOR; } }
  const versions = deskVersions(folder, held.team, opts.key, opts.passphrase);
  return Object.assign(out, { file: "ours", letGo: false, minEngine: next, team: teamSummary(held.team, id, versions, next),
    requests: listJoins(folder, held.team, { invites: invites, now: opts.now }),
    tried: tf ? noticesOf(tf, held.team.id) : [] });
}

/* THE RECOVERY COPY IS KEPT UNDER THE SIGNING KEY whenever this Studio writes a team whose key it holds (P2): `secret` opens
   the key (src/sign.mjs unlockKey) and the copy is wrapped under what src/team.mjs recoveryOf derives from it, so nothing
   is asked of the lead. A team whose key is not held here keeps whatever copy it had. */
function ownRecovery(team, teamKeys, keyFile, secret) {
  const teamKey = teamKeyOf(teamKeys, team.id, team.epoch);
  return teamKey ? withRecovery(team, teamKey, recoveryOf(keyFile, secret)) : team;
}

const REFUSAL_FOLDER_TEAM = "Nothing was changed: Etiuda Studio makes a team on the Etiuda relay, not in a shared folder. Make a team starts one there.";

/** Seal what this project's folder publishes, or not. Sealed and no team at the folder makes one, sealed by default, with
 *  this catalog and nobody on its roster; a team this Studio kept for the folder (`o.kept`) is put back where its file has
 *  gone. Plain writes the team saying so and makes this project forget it sealed. `o.key` and `o.passphrase`, the key's
 *  secret, sign; `o.teamKeys` refresh the recovery copy. */
async function setTeamSealed(dir, sealed, o) {
  const opts = o || {}, home = path.resolve(dir), on = sealed === true;
  const found = projectAt(home);
  if (!found) throw refuse("no catalog in {DIR}", { DIR: home });
  const sealedAt = folderHere(found.project, opts);
  const shown = sealedAt ? path.resolve(sealedAt) : null;
  if (!shown) throw refuse("Publishing needs the folder the team reads from, and Change"
    + " beside Writes to chooses it.");
  const folder = shown;
  const key = readKeyFile(opts.key);
  if (!key) throw refuse("A team file is signed with this Studio's signing key, and Settings shows there is none yet.");
  if (on && insideOf(shown, [home, path.join(home, ARCHIVE)]))
    throw refuse("This catalog is kept inside {FOLDER}, so a sealed copy there would sit beside the catalog in the"
      + " clear; nothing was changed.", { FOLDER: shown });
  const id = String(readProject(home).draft.id || "");
  const read = await readTeam(folder);
  if (!read.team && fs.existsSync(read.at))
    throw refuse("The team file in {FOLDER} does not read whole, so it is left as it is.", { FOLDER: shown });
  let base = null;
  /* `o.fresh` writes a new team over a whole one another key leads, never over this Studio's own or a broken file: the K8
     cost of a lost key with no backup copy, every desk asking to join the new team. */
  const fresh = on && opts.fresh === true && !!read.team && read.valid;
  if (read.team) {
    /* An older file of this Studio's own team put back on the share is neither written over nor taken for another's. */
    const held = await heldTeam(folder, { key: opts.key });
    if (held.older) throw refuse("The team file in {FOLDER} is older than one this Studio has already seen, so it is left as it is.",
      { FOLDER: shown });
    if (!fresh && !held.team) throw refuse("The team file in {FOLDER} is not this Studio's own, so it is left as it is.", { FOLDER: shown });
    if (fresh && held.team) throw new Error("the team in " + folder + " is this Studio's own; nothing was written");
    if (!fresh) base = held.team;
  } else if (opts.kept) {
    const copy = await heldCopy(opts.kept, { key: opts.key });
    if (!copy.team) throw new Error("the team file this Studio kept for " + folder + " does not hold: " + copy.reason);
    base = copy.team;
  }
  if (!on && base && Array.isArray(base.catalogs) && base.catalogs.length > 1) { /* plant:td-plain-two */
    throw refuse("Publishing cannot be set to Plain for a team with more than one catalog. Nothing was changed.");
  }
  if (!base && on) {
    const tf = opts.teamsFile || (opts.userData ? teamsFile(opts.userData) : "");
    if (tf) {
      const tm = studioTeammates(tf, opts);
      if (tm.ok && tm.teamsCount >= MAX_TEAMS) throw refuse(REFUSAL_TEAMS_LIMIT);
    }
  }
  if (!base && on && !/^t-[0-9a-f]{16}$/.test(String(opts.teamId || "")))
    throw new Error("a new team is named by the id its key was kept under, and none was given; nothing was written");
  const team = base ? withSealed(base, on, id) : on
    ? newTeam({ id: opts.teamId, catalogs: [id], lead: { keyId: key.keyId, public: key.public }, sealed: true, exportsSealed: true })
    : null;
  /* A TEAM IS WRITTEN ON THE RELAY ALONE (the folder team's removal, Max, 2026-11-22 15:37: "remove it, burn it with fire"): a new team at a
     plain folder, and a rewrite of a folder team's file, are refused with nothing written. A team is started on the relay by its own verb
     (startRelayTeam); no path is added here to move one. The sentence is English until the copywriter words it. */
  if (team && !(team.channel && team.channel.kind === "relay")) throw refuse(REFUSAL_FOLDER_TEAM); /* plant:fh-seal-relay-only */
  let written = null;
  if (team) {
    if (!opts.passphrase) throw notOpened();
    /* A kept copy below the floor kept for it is refused by writeTeam itself, which writes nothing; said here as heldTeam's
       older file is said above (board 929). */
    try {
      written = (await writeTeam(folder, ownRecovery(team, opts.teamKeys, opts.key, opts.passphrase),
        { key: opts.key, passphrase: opts.passphrase })).team;
    } catch (e) {
      if (e && e.older === true) throw refuse("The team file in {FOLDER} is older than one this Studio has already seen, so it is left as it is.",
        { FOLDER: shown });
      throw e;
    }
  }
  /* The lead choosing Sealed marks the project now, not at the first sealed publish: between the two the team file alone
     decided, and a file taken off the share sent that publish out in the clear (the test architect's read; tests/team-desks.mjs
     td2i). exportEdition keys on the same mark. */
  if (on && written) writeProject(home, Object.assign({}, found.project, { draft: found.draftName, sealedTeam: written.id }));
  if (!on && found.project.sealedTeam) {
    const next = Object.assign({}, found.project, { draft: found.draftName });
    delete next.sealedTeam;
    writeProject(home, next);
  }
  return { folder: shown, created: !base && !!written, team: written ? teamSummary(written, id) : null,
           written: written ? JSON.parse(JSON.stringify(written)) : null };
}

/** A project's first team, started on the Etiuda relay (board 926): the lead's choice at the place a team is first made, in
 *  place of a shared folder. The shell has kept the team's key (`o.teamId`, epoch 1) and the mirror (`o.mirror`, named by
 *  `o.rt`; src/team-store.mjs keepRelay) before it calls, and `o.url` is where this build makes new teams (src/relay.mjs NEW_TEAMS_URL). This writes the signed
 *  team file into the mirror, sealed by default as a new team on a folder is, with the relay as its channel and the ring
 *  inside it (src/team.mjs withChannel), and points the project's publish place at the mirror, so the project publishes
 *  into it as it does into a folder. The relay's own space is not made here: the runner makes it for every kept relay team
 *  (src/relay.mjs relayRunner). A project that published before brings its latest edition and its ring along, into the mirror and
 *  before the first sync, sealed as the team's are (src/publish.mjs carryEdition; the test architect's R1), so a desk admitted
 *  to the team finds a catalog at its first catch-up; one that never published moves as it did. A failure leaves nothing behind:
 *  the team file this call wrote goes, with what it carried, and the mirror folder where this call made it and it is empty.
 *  With no `dir` the team is made on its own: it lists no catalog and no project is read or written; a catalog joins it
 *  afterwards (chooseTeam). */
async function startRelayTeam(dir, o) {
  const opts = o || {}, own = dir == null || dir === "", home = own ? null : path.resolve(dir); /* plant:ton-own */
  const found = own ? null : projectAt(home);
  if (!own && !found) throw refuse("no catalog in {DIR}", { DIR: home });
  const key = readKeyFile(opts.key);
  if (!key) throw refuse("A team file is signed with this Studio's signing key, and Settings shows there is none yet.");
  const tf = opts.teamsFile || (opts.userData ? teamsFile(opts.userData) : "");
  if (tf) {
    const tm = studioTeammates(tf, opts);
    if (tm.ok && tm.teamsCount >= MAX_TEAMS) throw refuse(REFUSAL_TEAMS_LIMIT);
  }
  if (!/^t-[0-9a-f]{16}$/.test(String(opts.teamId || "")))
    throw new Error("a new team is named by the id its key was kept under, and none was given; nothing was written");
  const mirror = path.resolve(String(opts.mirror || ""));
  if (!/^[0-9a-f]{32}$/.test(String(opts.rt || "")) || path.basename(mirror) !== String(opts.rt))
    throw new Error("a team on the relay is kept at the mirror named by its relay team id, and none was given; nothing was written");
  if (!opts.passphrase) throw notOpened();
  const id = own ? "" : String(readProject(home).draft.id || "");
  let team = newTeam({ id: opts.teamId, catalogs: own ? [] : [id], lead: { keyId: key.keyId, public: key.public }, sealed: true, exportsSealed: true });
  team = withChannel(team, { kind: "relay", rt: String(opts.rt), url: String(opts.url || "") }, { format: RING_FORMAT, kind: RING_KIND, keys: [] }); /* plant:rs926-channel */
  team = ownRecovery(team, opts.teamKeys, opts.key, opts.passphrase);
  const madeDir = !fs.existsSync(mirror);
  fs.mkdirSync(mirror, { recursive: true });
  let written;
  try {
    written = (await writeTeam(mirror, team, { key: opts.key, passphrase: opts.passphrase })).team;
    if (!own) {
      /* A project that published before brings its latest edition and its ring into the mirror, sealed as the team's are, before
         the first sync (src/publish.mjs carryEdition); one that never published has nothing to bring. */
      await carryEdition({ project: home, folder: mirror, key: opts.key, teamKeys: opts.teamKeys }); /* plant:r1-carry */
      writeProject(home, Object.assign({}, found.project, { draft: found.draftName, folder: mirror, sealedTeam: written.id, relay: { rt: String(opts.rt), url: String(opts.url || ""), lead: key.public } })); /* plant:rs926-place */
    }
  } catch (e) {
    if (!own) takeBackCarried(home, mirror, String(opts.teamId), [id], opts.teamKeys);
    try { fs.unlinkSync(teamPath(mirror)); } catch { /* never written */ }
    if (madeDir) { try { fs.rmdirSync(mirror); } catch { /* not empty, or gone */ } } /* plant:rs926-undo */
    throw e;
  }
  return { team: teamSummary(written, id), written: JSON.parse(JSON.stringify(written)) };
}

/* THE SENTENCES OF A CHOOSE (board 962 stage 5, T3). English until the copywriter words them; the shell's own are beside its handler. */
const CHOOSE_HAS_TEAM = "This catalog has a team already, so it did not join another.";
const CHOOSE_NOT_OURS = "The team file in {FOLDER} is not the team this Studio leads, so this catalog did not join it.";
const CHOOSE_NOT_SEALED = "This team's catalogs go out in the clear, so another catalog cannot join it.";
const CHOOSE_TAKEN = "{FOLDER} already holds {FILE}, which is another catalog, so this catalog did not join the team. Under another file name it can.";
const CHOOSE_ON_ANOTHER = "This catalog is on another team this Studio leads, so it did not join this one.";

/** A catalog with no team joins a sealed team this Studio leads (board 962 stage 5, 3.1), on a folder or the relay. The shell has
 *  checked what only it knows (no move or handover under way, the relay told, the grant) inside the team's lock, and names the
 *  team's place: `o.teamId`, `o.folder` (what the project will publish to: the share, or the relay's mirror), `o.work` (where
 *  the team file is read and written, the folder's work copy or the mirror), `o.relay` {rt, url} on the relay, `o.elsewhere` the
 *  catalog ids other teams of this Studio list, `o.key`, `o.passphrase` and `o.teamKeys`.
 *
 *  IN THIS ORDER, SO A STOP AT ANY POINT LEAVES NOTHING A DESK MISREADS AND A SECOND PRESS FINISHES IT: the refusals, before
 *  anything is written; the team file listing the catalog, with the lead's ring entry for it where the team carries a ring (a
 *  team listing a catalog with no file at its root names no edition in the head, so a desk sees nothing yet); the catalog's
 *  latest published edition carried in, sealed under the team key (src/publish.mjs carryEdition: nothing where the latest is
 *  unsigned or signed by another key, and then the catalog reaches the team at its next publish); the project pointed at the
 *  team's place last. A second press finds the id listed and skips the team write. */
async function chooseTeam(dir, o) {
  const opts = o || {}, home = path.resolve(String(dir || "."));
  const found = projectAt(home);
  if (!found) throw refuse("no catalog in {DIR}", { DIR: home });
  const key = readKeyFile(opts.key);
  if (!key) throw refuse("A team file is signed with this Studio's signing key, and Settings shows there is none yet.");
  const teamId = String(opts.teamId || "");
  if (!/^t-[0-9a-f]{16}$/.test(teamId)) throw new Error("a team is named by its id, and none was given; nothing was written");
  const shown = path.resolve(String(opts.folder || "")), work = path.resolve(String(opts.work || opts.folder || ""));
  if (!opts.folder || !fs.existsSync(work)) throw refuse(CHOOSE_NOT_OURS, { FOLDER: shown });
  const id = String(readProject(home).draft.id || "");
  /* 1. A catalog with a team of its own, or a team file of this Studio's at the place it publishes to, keeps it (stage 6 moves). */
  if (found.project.sealedTeam) throw refuse(CHOOSE_HAS_TEAM); /* plant:choose-has-team */
  const here = folderHere(found.project, opts);
  if (here && !(found.project.relay && found.project.relay.rt)) {
    try {
      const at = path.resolve(here), r = await readTeam(at);
      if (r.team && r.valid && r.team.lead && r.team.lead.public === key.public && r.team.id !== teamId) throw refuse(CHOOSE_HAS_TEAM);
    } catch (e) {
      if (e && e.said) throw e;
      /* A team file there that cannot be read may list this catalog: refused, or the catalog could end on two teams (the test
         architect's read of 973f615f, 3). A missing file does not throw, and that path stays open. */
      throw refuse("The team file in {FOLDER} does not read whole, so it is left as it is.", { FOLDER: path.resolve(here) }); /* plant:choose-own-unread */
    }
  }
  /* One catalog, one team of this Studio: a desk would otherwise hold one pin under two teams' envelopes (pinsTorn). */
  if ((Array.isArray(opts.elsewhere) ? opts.elsewhere : []).map(String).indexOf(id) >= 0) throw refuse(CHOOSE_ON_ANOTHER); /* plant:choose-elsewhere */
  /* 2. The team as this key leads it, not older than seen, and sealed: a Plain team cannot seal the joining catalog. */
  const held = await heldTeam(work, { key: opts.key });
  if (!held.team || held.team.id !== teamId) throw refuse(CHOOSE_NOT_OURS, { FOLDER: shown }); /* plant:choose-ours */
  if (held.team.sealed !== true) throw refuse(CHOOSE_NOT_SEALED); /* plant:choose-sealed */
  if (held.team.channel && held.team.channel.kind === "relay" && (!opts.relay || held.team.channel.rt !== String(opts.relay.rt)))
    throw refuse(CHOOSE_NOT_OURS, { FOLDER: shown });
  /* 3. The file name this catalog publishes under, where it is fixed, must not be another catalog's file at the team's root. */
  const name = fixedName(home, found.project, id, home);
  if (name && fs.existsSync(path.join(work, name)) && !holdsId(path.join(work, name), id, opts.teamKeys)) /* plant:choose-taken */
    throw refuse(CHOOSE_TAKEN, { FOLDER: shown, FILE: name });
  if (!opts.passphrase) throw notOpened();
  /* 4. The team lists the catalog, and vouches for it in its ring where it carries one; a stale refusal reads the file once more. */
  let written = held.team;
  if (written.catalogs.indexOf(id) < 0) {
    const entry = await entryFor(key, id);
    for (let round = 0; ; round++) {
      const base = round ? (await heldTeam(work, { key: opts.key })).team : written;
      if (!base || base.id !== teamId || base.sealed !== true) throw refuse(CHOOSE_NOT_OURS, { FOLDER: shown });
      if (base.catalogs.indexOf(id) >= 0) { written = base; break; }
      try {
        written = (await writeTeam(work, ownRecovery(withCatalog(base, id, entry, found.project.adoptedFrom),opts.teamKeys, opts.key, opts.passphrase),
          { key: opts.key, passphrase: opts.passphrase })).team;
        break;
      } catch (e) {
        if (e && e.stale && round === 0) continue;
        if (e && e.older === true) throw refuse("The team file in {FOLDER} is older than one this Studio has already seen, so it is left as it is.", { FOLDER: shown });
        throw e;
      }
    }
  }
  if (opts.stopAfter === 4) throw new Error("stopped after step 4, as the gate asked");
  /* 5. The latest published edition comes along, sealed under the team key (CARRY_TAKEN_REFUSAL refuses another catalog's file). */
  const carried = await carryEdition({ project: home, folder: work, key: opts.key, teamKeys: opts.teamKeys }); /* plant:choose-carry */
  /* The head names what the team leads, and the relay's runner writes it at its next sync, from the root this choose leaves behind.
     A team kept in a folder is no longer written here: Studio writes no head, and no ring, at a shared folder (the folder team's removal).
     plant:choose-head stood on that write, which is gone; the mark stays until the plant guard has a way to retire one. */
  if (opts.stopAfter === 5) throw new Error("stopped after step 5, as the gate asked");
  /* 6. The project publishes to the team's place from now on. */
  const next = Object.assign({}, found.project, { draft: found.draftName, folder: shown, sealedTeam: teamId });
  if (opts.relay) next.relay = { rt: String(opts.relay.rt), url: String(opts.relay.url || ""), lead: key.public };
  else delete next.relay;
  /* A catalog move under way (board 962 stage 6, 3.2) ends here: the catalog is on its team, the one the press aimed at. */
  delete next.moving; /* plant:choose-drops-moving */
  writeProject(home, next); /* plant:choose-project */
  return { folder: shown, team: teamSummary(written, id), written: JSON.parse(JSON.stringify(written)), carried: !!carried };
}

/* THE SENTENCES OF A LEAVE (board 962 stage 6, U1). English until the copywriter words them. */
const LEAVE_NOT_OURS = "The team file in {FOLDER} is not the team this Studio leads, so the catalog was not taken off it. Nothing was changed.";
const LEAVE_OLDER = "The team file in {FOLDER} is older than one this Studio has already seen, so it is left as it is."; // the choose's own sentence

/** A catalog leaves its team (board 962 stage 6, 3.1), on a folder or the relay: `dir` is its project, or null for a catalog the
 *  team lists whose project is not in this library, named then by `o.catalog`. The shell has checked what only it knows inside the
 *  team's lock (no move or handover of the team under way, the relay told, the grant) and names the team's place as it does for
 *  chooseTeam: `o.teamId`, `o.folder` (the share, or the relay's mirror), `o.work` (where the team's files are read and written),
 *  `o.relay` {rt, url} on the relay, `o.root` the library (every project of the team on this catalog is let go, not only `dir`),
 *  `o.moving` {from, to} where the leave is the first half of a catalog move (written into the project before anything else),
 *  `o.key`, `o.passphrase` and `o.teamKeys`.
 *
 *  IN THIS ORDER, SO A STOP AT ANY POINT LEAVES NOTHING A DESK MISREADS AND A SECOND PRESS FINISHES IT:
 *  1. the team as this key leads it, not older than seen;
 *  2. the team file no longer listing the catalog, nor vouching any key for it in its ring, rev plus one; a stale refusal reads the
 *     file once more. From here no desk's headView names the catalog and no desk seals a copy of it under the team key;
 *  3. the head rewritten to the editions the team still leads, or deleted where it leads none, by the relay's runner at its next sync,
 *     from the root this leave leaves behind (nothing is written at a shared folder);
 *  4. the catalog's files at the team's root taken out: each .ec sealed for this team that opens, under a key this Studio holds, as
 *     this catalog, and nothing else. The relay's runner owes each as a deletion, after its writes;
 *  5. the catalog's entries in etiuda-ring.json at the root dropped, on either channel: a stale one vouches only the lead's own key,
 *     and on the relay the runner would copy it back into the team file's ring (ringIn);
 *  6. every library project of the team on this catalog no longer naming the team or its place: no folder, no seal mark, no relay,
 *     no place. It publishes nowhere until it is given a team or a folder, and stage 5's choose takes it as a catalog with no team.
 *  A second press finds the id unlisted and skips the team write, and finds no file to take out. */
async function leaveTeam(dir, o) {
  const opts = o || {};
  const key = readKeyFile(opts.key);
  if (!key) throw refuse("A team file is signed with this Studio's signing key, and Settings shows there is none yet.");
  const teamId = String(opts.teamId || "");
  if (!/^t-[0-9a-f]{16}$/.test(teamId)) throw new Error("a team is named by its id, and none was given; nothing was written");
  const shown = path.resolve(String(opts.folder || "")), work = path.resolve(String(opts.work || opts.folder || ""));
  if (!opts.folder || !fs.existsSync(work)) throw refuse(LEAVE_NOT_OURS, { FOLDER: shown });
  const home = dir ? path.resolve(String(dir)) : null;
  const found = home ? projectAt(home) : null;
  if (home && !found) throw refuse("no catalog in {DIR}", { DIR: home });
  const id = found ? String(readProject(home).draft.id || "") : String(opts.catalog || "");
  if (!id) throw new Error("a catalog is named by its id, and none was given; nothing was written");
  /* A project on another team is not this team's to let go; mid-move it may name either half. */
  const mv = found && found.project.moving ? found.project.moving : null;
  if (found && found.project.sealedTeam && found.project.sealedTeam !== teamId && !(mv && (mv.from === teamId || mv.to === teamId)))
    throw refuse(LEAVE_NOT_OURS, { FOLDER: shown });
  /* The first half of a catalog move names it in the project before anything is written, so a stop anywhere after shows it. */
  if (found && opts.moving && opts.moving.from && opts.moving.to && !(mv && mv.from === String(opts.moving.from) && mv.to === String(opts.moving.to))) {
    writeProject(home, Object.assign({}, found.project, { draft: found.draftName, moving: { from: String(opts.moving.from), to: String(opts.moving.to) } })); /* plant:leave-moving */
  }
  /* 1. The team as this key leads it. */
  const held = await heldTeam(work, { key: opts.key });
  if (held.older) throw refuse(LEAVE_OLDER, { FOLDER: shown });
  if (!held.team || held.team.id !== teamId) throw refuse(LEAVE_NOT_OURS, { FOLDER: shown }); /* plant:leave-ours */
  if (held.team.channel && held.team.channel.kind === "relay" && (!opts.relay || held.team.channel.rt !== String(opts.relay.rt)))
    throw refuse(LEAVE_NOT_OURS, { FOLDER: shown });
  if (!opts.passphrase) throw notOpened();
  /* 2. The team stops listing the catalog, and its ring stops vouching for it. */
  const listsIt = (t) => t.catalogs.indexOf(id) >= 0 || (!!t.ring && Array.isArray(t.ring.keys) && t.ring.keys.some((k) => k && String(k.catalog) === id));
  let written = held.team;
  if (listsIt(written)) {
    for (let round = 0; ; round++) {
      const base = round ? (await heldTeam(work, { key: opts.key })).team : written;
      if (!base || base.id !== teamId) throw refuse(LEAVE_NOT_OURS, { FOLDER: shown });
      if (!listsIt(base)) { written = base; break; }
      try {
        const next = ownRecovery(withoutCatalog(base, id), opts.teamKeys, opts.key, opts.passphrase);
        written = (await writeTeam(work, next, { key: opts.key, passphrase: opts.passphrase })).team; /* plant:leave-team-write */
        break;
      } catch (e) {
        if (e && e.stale && round === 0) continue;
        if (e && e.older === true) throw refuse(LEAVE_OLDER, { FOLDER: shown });
        throw e;
      }
    }
  }
  if (opts.stopAfter === 2) throw new Error("stopped after step 2, as the gate asked");
  /* 3. The head names only what the team still leads, and the relay's runner rewrites it at its next sync, from the root this leave
     leaves behind. Studio writes no head at a shared folder any more (the folder team's removal), so there is nothing to do here.
     plant:leave-head and plant:leave-head-gone stood on those writes, which are gone; the marks stay until the plant guard has a way to retire one. */
  if (opts.stopAfter === 3) throw new Error("stopped after step 3, as the gate asked");
  /* 4. The catalog's files at the root go: sealed for this team and opening as this catalog, nothing else. */
  let removed = 0, names = [];
  try { names = fs.readdirSync(work, { withFileTypes: true }).filter((e) => e.isFile() && /\.ec$/i.test(e.name)).map((e) => e.name).sort(); } catch { names = []; }
  for (const name of names) {
    const at = path.join(work, name);
    let doc = null;
    try { doc = readJson(at); } catch { doc = null; }
    if (!doc || doc.kind !== Engine.sealRules().SEALED_KIND || doc.team !== teamId || !holdsId(at, id, opts.teamKeys)) continue;
    fs.unlinkSync(at); /* plant:leave-take-file */
    removed++;
  }
  if (opts.stopAfter === 4) throw new Error("stopped after step 4, as the gate asked");
  /* 5. The ring file at the root vouches nothing for the catalog. Taking a key out of a ring stays an administrator's act
     (src/ring.mjs); this takes out a catalog that has left the folder, every key for it at once. */
  let ring = null;
  try { ring = readRingFile(ringPath(work)); } catch { ring = null; }
  if (ring && ring.doc.keys.some((k) => k && String(k.catalog) === id)) {
    const keep = ring.doc.keys.filter((k) => !(k && String(k.catalog) === id));
    if (keep.length) {
      writeWhole(ring.file, JSON.stringify(Object.assign({}, ring.doc, { keys: keep }), null, 1) + "\n"); /* plant:leave-ring */
    } else fs.unlinkSync(ring.file);
  }
  if (opts.stopAfter === 5) throw new Error("stopped after step 5, as the gate asked");
  /* 6. Every library project of the team on this catalog lets the team go; a project mid-move keeps `moving` for the choose. */
  const homes = teamProjects(opts.root, teamId).filter((t) => { try { return String(readProject(t.dir).draft.id || "") === id; } catch { return false; } })
    .map((t) => path.resolve(t.dir));
  if (home && homes.indexOf(home) < 0) homes.push(home);
  let freed = 0;
  for (const h of homes) {
    const f = projectAt(h);
    if (!f || (f.project.sealedTeam && f.project.sealedTeam !== teamId)) continue;
    if (!f.project.sealedTeam && !f.project.moving) continue;
    const next = Object.assign({}, f.project, { draft: f.draftName, folder: null });
    clearTeamMark(next); delete next.place;
    writeProject(h, next); /* plant:leave-project */
    freed++;
  }
  return { team: teamSummary(written, id), written: JSON.parse(JSON.stringify(written)), removed, freed };
}

/** Takes out of a relay mirror what carryEdition put there for this team: the project's edition, named as carryEdition
 *  names it (fixedName on the latest archived edition's catalog id, not the draft id as it stands now), where that file
 *  is sealed for `teamId`, and the ring file, where every entry in it is for a catalog in `catalogs`. Nothing else is
 *  touched, an edition of another team or in the clear and a ring that holds another catalog's entry are left as they are,
 *  and it is safe to run where nothing was carried, or twice. Given `teamKeys`, a file of that name sealed for the team that
 *  does not open as this catalog is another catalog's, which carryEdition refused to write over, and it stays (board 962
 *  stage 5); without them the file is judged by its team alone, as before. */
function takeBackCarried(home, mirror, teamId, catalogs, teamKeys) {
  let name = null, catalogId = "";
  try {
    const p = readProject(home);
    const taken = editionsIn(home);
    if (taken.length) {
      catalogId = String(archivedCatalog(home, taken[taken.length - 1]).id || "");
      name = fixedName(home, p.project, catalogId, home); /* plant:r1-take-name */
    }
  } catch { name = null; }
  if (name) {
    const at = path.join(mirror, name);
    let doc = null;
    try { doc = readJson(at); } catch { doc = null; }
    const ours = !teamKeys || holdsId(at, catalogId, teamKeys); /* plant:ce-take-holds */
    if (ours && doc && doc.kind === Engine.sealRules().SEALED_KIND && doc.team === teamId) { try { fs.unlinkSync(at); } catch { /* gone */ } } /* plant:r1-take-ec */
  }
  let ring = null;
  try { ring = readRingFile(ringPath(mirror)); } catch { ring = null; }
  if (ring && ring.doc.keys.every((e) => e && catalogs.indexOf(String(e.catalog)) >= 0)) { try { fs.unlinkSync(ring.file); } catch { /* gone */ } } /* plant:r1-take-ring */
}

/** Takes back what startRelayTeam wrote, for a failure that came after it (board 926, the test architect's edit E1): the shell
 *  threw after the thread's writes landed, its own record of the team or the thread's reply being what failed, and a team
 *  forgotten there with its file and the project's place left behind could neither be pressed again nor be read. This puts the
 *  project's place back to `o.folder` (null for none) where the project still points at the mirror, takes the seal mark off where
 *  the mark is this team's, and then takes the team file out of the mirror where it is this team's own, and the mirror folder
 *  where it is empty. What startRelayTeam carried into the mirror (the sealed edition and the ring) goes with the team file, by the
 *  same test of being this team's. The place goes first, so a failure part way leaves the project as it was, free to press again, and not a
 *  mark with no team behind it. It touches only what is this team's: a project that points elsewhere, a mirror holding another
 *  team's file or a file that will not read are left as they are, and it is safe to run where nothing was written, or twice. */
async function undoRelayTeam(dir, o) {
  const opts = o || {}, home = dir == null || dir === "" ? null : path.resolve(dir); /* a team made on its own has no project to put back */
  const tf = opts.teamsFile || (opts.userData ? teamsFile(opts.userData) : "");
  if (!/^t-[0-9a-f]{16}$/.test(String(opts.teamId || "")))
    throw new Error("a team to take back is named by its id, and none was given; nothing was changed");
  const mirror = path.resolve(String(opts.mirror || ""));
  if (!/^[0-9a-f]{32}$/.test(String(opts.rt || "")) || path.basename(mirror) !== String(opts.rt))
    throw new Error("a team on the relay is kept at the mirror named by its relay team id, and none was given; nothing was changed");
  const found = home ? projectAt(home) : null;
  if (found) {
    const next = Object.assign({}, found.project, { draft: found.draftName });
    let moved = false;
    if (next.folder && path.resolve(String(next.folder)) === mirror) { next.folder = opts.folder ? path.resolve(String(opts.folder)) : null; moved = true; } /* plant:rs926-restore */
    if (next.sealedTeam === opts.teamId) { clearTeamMark(next); moved = true; } /* plant:rs926-unmark */
    if (moved) writeProject(home, next);
  }
  const read = await readTeam(mirror);
  if (read.team && read.team.id === opts.teamId) {
    /* What was carried into the mirror goes before the team file, so a failure part way leaves the file there and the next
       undo still knows the mirror is this team's. */
    if (home) takeBackCarried(home, mirror, opts.teamId, read.team.catalogs || [], opts.teamKeys);
    fs.unlinkSync(teamPath(mirror)); /* plant:rs926-unlink */
  }
  try { fs.rmdirSync(mirror); } catch { /* not empty, or gone */ }
  return { undone: true };
}

/** Hands the team at `dir` (or `o.folder`) to the new signing key `o.key`: appends the handover step signed by `o.oldKey`,
 *  updates the lead to the new key, raises the rev at the same epoch, updates the ring, and writes the signed team file.
 *  THE LEAD BOX FOLLOWS THE HANDOVER'S REASON (Max's ruling of 2026-11-01 06:13), `o.reason`: "new-computer" carries the old
 *  key's box into the new key file, so a desk away across the handover and a later key change still finds its copy;
 *  "other-hands", or no reason (the behaviour before the ruling), gives the new key a box of its own, so once the team's keys
 *  next change the old key opens nothing published after that. Returns { team, written, box: "kept" or "fresh", desks }, where
 *  `desks` are the admitted desks on the roster at the handover, whom a fresh box may leave behind. */
/* The projects under `root` whose project.json names team `teamId` as sealed: [{dir, project}], the project as projectAt reads it
   with its draft's name, so writeProject keeps it whole. None where no root is given. */
function teamProjects(root, teamId) {
  if (!root || !teamId) return [];
  let names = [];
  try { names = fs.readdirSync(path.resolve(String(root)), { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name); } catch { return []; }
  const out = [];
  for (const n of names) {
    const dir = path.join(path.resolve(String(root)), n);
    let found = null;
    try { found = projectAt(dir); } catch { found = null; }
    if (found && found.project && found.project.sealedTeam === String(teamId))
      out.push({ dir, project: Object.assign({}, found.project, { draft: found.draftName }) });
  }
  return out;
}

async function handoverTeam(dir, o) {
  const opts = o || {}, home = path.resolve(String(dir || "."));
  const found = projectAt(home);
  const resolved = found ? folderHere(found.project, opts) : null;
  const folder = opts.folder ? path.resolve(String(opts.folder)) : (resolved ? path.resolve(resolved) : home);

  const oldRead = readKeyFile(opts.oldKey);
  if (!oldRead) throw new Error("no old key at " + opts.oldKey);
  const oldOpen = unlockKey(oldRead, opts.oldPassphrase);

  const newRead = readKeyFile(opts.key);
  if (!newRead) throw new Error("no new key at " + opts.key);
  const newOpen = unlockKey(newRead, opts.passphrase);

  const heldOld = await heldTeam(folder, { key: opts.oldKey });
  if (!heldOld.team) throw new Error("old lead does not hold team at " + folder + (heldOld.reason ? ": " + heldOld.reason : ""));

  const newLead = { keyId: newOpen.keyId, public: newOpen.public };
  const oldBox = openLeadBox(oldRead, oldOpen);
  /* plant:lead-box-why */
  const keepBox = opts.reason === "new-computer";
  let leadBox = null;
  /* plant:lead-box-keep */
  if (keepBox && oldBox) {
    /* A new key that already carries a box of its own cannot take the team's (keepLeadBox), said to the lead in the copywriter's
       words (0008906f). findOldKey finds the team's old key by the lead the team names, so setting the used key aside and making
       a fresh one leaves the handover's old key where it was. */
    try { leadBox = keepLeadBox(newRead, newOpen, oldBox); }
    catch (e) {
      /* plant:lb-used-key */
      if (/already carries a box of its own/.test(String(e && e.message))) throw refuse("This new signing key has already been used elsewhere, so this team's keys cannot move under it, and nothing was changed. Make a fresh key for the handover from the Menu, under Settings, then Signing key, with Set this key aside and make a new one; or, if the old key may be in other hands, choose that answer instead.");
      throw e;
    }
  } else {
    leadBox = ensureLeadBox(newRead, newOpen);
    if (oldBox && leadBox && leadBox.public === oldBox.public)
      throw new Error("the new key carries the old key's box, so it cannot have a box of its own for this team; nothing was written");
  }
  if (leadBox && leadBox.public) newLead.box = leadBox.public;
  const boxSaid = oldBox && leadBox && leadBox.public === oldBox.public ? "kept" : "fresh";
  const atHandover = (Array.isArray(heldOld.team.roster) ? heldOld.team.roster : [])
    .filter((e) => e && e.desk && e.wrap !== undefined).map((e) => String(e.desk.id));

  const step = {
    format: 1,
    kind: "etiuda-team-handover",
    team: heldOld.team.id,
    from: { keyId: oldOpen.keyId, public: oldOpen.public },
    to: { keyId: newOpen.keyId, public: newOpen.public },
    sig: { alg: "Ed25519", keyId: oldOpen.keyId, value: "" }
  };
  const blob = Engine.relayRules().blob;
  const bytes = blob.handoverSignedBytes(step);
  step.sig.value = crypto.sign(null, bytes, oldOpen.privateKey).toString("hex"); /* plant:folder-handover-step */
  if (!blob.handoverGenuine(step, heldOld.team.id, oldOpen)) throw new Error("handover step could not be verified");

  let teamDoc = withHandover(heldOld.team, step, newLead);

  /* Reseal recovery and leadBook under new recovery secret */
  /* plant:handover-rebind */
  if (true) {
    const oldRec = recoverySecret(oldOpen);
    const newRec = recoverySecret(newOpen);
    const tk = openRecovery(heldOld.team, oldRec)
      || teamKeyFor(heldOld.team, opts.oldKey, opts.oldPassphrase, "", opts.teamKeys);
    if (tk && heldOld.team.recovery) {
      teamDoc = withRecovery(teamDoc, tk, newRec);
    }
    if (heldOld.team.leadBook) {
      const book = openLeadBook(heldOld.team, oldRec);
      if (book) sealLeadBook(teamDoc, newRec, book);
    }
  }

  /* Update ring: folder ring and/or relay team.ring */
  const catalogs = Array.isArray(teamDoc.catalogs) ? teamDoc.catalogs : [];
  const ringFile = ringPath(folder);
  for (const catId of catalogs) {
    try {
      const entry = await entryFor(newRead, catId);
      addToRing(ringFile, entry);
    } catch { /* folder may not have ring file yet */ }
  }

  if (teamDoc.channel && teamDoc.channel.kind === "relay") {
    let ringDoc = teamDoc.ring;
    if (!ringDoc || !Array.isArray(ringDoc.keys)) {
      ringDoc = { format: RING_FORMAT, kind: RING_KIND, keys: [] };
    } else {
      ringDoc = { format: RING_FORMAT, kind: RING_KIND, keys: ringDoc.keys.slice() };
    }
    for (const catId of catalogs) {
      if (!ringDoc.keys.some((e) => e && e.catalog === catId && e.public === newOpen.public)) {
        ringDoc.keys.push({ catalog: catId, keyId: newOpen.keyId, alg: "Ed25519", public: newOpen.public });
      }
    }
    teamDoc = withChannel(teamDoc, teamDoc.channel, ringDoc);
  }

  /* Carry over rev floor across handover */
  const hadFloor = revFloor(opts.oldKey, heldOld.team.id) || { epoch: heldOld.team.epoch, rev: (heldOld.team && heldOld.team.rev) || 0 };
  raiseRevFloor(opts.key, Object.assign({}, heldOld.team, hadFloor));

  const written = (await writeTeam(folder, teamDoc, { key: opts.key, passphrase: opts.passphrase })).team;

  /* Keep old key's floor raised to the handover rev so older pre-handover files cannot be held or signed */
  /* plant:handover-rev-carry */
  if (true) {
    try { raiseRevFloor(opts.oldKey, written); } catch {}
  }

  /* Re-sign current editions, head and stats-span under new lead key */
  /* plant:handover-resign */
  if (true) {
    const seal = Engine.sealRules();
    const tk = teamKeyFor(heldOld.team, oldRead, opts.oldPassphrase, "", opts.teamKeys);
    let ecFiles = [];
    try { ecFiles = fs.readdirSync(folder).filter((n) => /\.ec$/i.test(n)).sort(); } catch { ecFiles = []; }
    for (const ecFile of ecFiles) {
      const filePath = path.join(folder, ecFile);
      let rawText = "";
      try { rawText = fs.readFileSync(filePath, "utf8"); } catch { continue; }
      let parsed = null;
      try { parsed = JSON.parse(rawText.replace(/^\uFEFF/, "")); } catch { continue; }
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) continue;

      let wasSealed = false;
      let catDoc = parsed;
      if (parsed.kind === seal.SEALED_KIND) {
        wasSealed = true;
        if (!tk) continue;
        let text = null;
        try { text = seal.openSealed(tk, parsed); } catch { text = null; }
        if (typeof text !== "string") continue;
        try { catDoc = JSON.parse(text); } catch { continue; }
      }
      if (!catDoc || typeof catDoc !== "object" || Array.isArray(catDoc)) continue;
      const catalogId = typeof catDoc.id === "string" ? catDoc.id : "";
      if (!catalogs.includes(catalogId)) continue;
      /* Only an edition the old lead signed (Grok's review 9 of the relay member, finding 1): a file another hand put at the root,
         unsigned or signed by another key, would otherwise come out of the handover signed by the new lead and named in its head. */
      let own = false;
      try { own = signatureHolds(catDoc, oldRead.public); } catch { own = false; }
      if (!own) continue; /* plant:m9-handover-own */

      const signedCat = await signCatalog(catDoc, { privateKey: newOpen.privateKey, keyId: newOpen.keyId });
      if (wasSealed) {
        const sealedDoc = seal.sealCatalog(tk, written.id, parsed.epoch || written.epoch, json(signedCat));
        writeWhole(filePath, json(sealedDoc));
      } else {
        writeWhole(filePath, json(signedCat));
      }
    }

    /* Re-sign etiuda-head.json if head exists or led editions present */
    const headPath = path.join(folder, HEAD_NAME);
    const keys = tk ? { [written.epoch]: tk } : null;
    const editions = editionsLed(folder, written, keys, { leads: [oldRead.public, newOpen.public] });
    if (fs.existsSync(headPath) || editions.length) {
      const headT = opts.now ? Date.parse(opts.now) : Date.now();
      const headDoc = headOf(newOpen, written, Number.isFinite(headT) ? headT : Date.now(), editions);
      writeWhole(headPath, JSON.stringify(headDoc, null, 1) + "\n");
    }

    /* Re-sign stats-span.json if present */
    const spanPath = path.join(folder, "stats-span.json");
    if (fs.existsSync(spanPath)) {
      let spanToken = "rolling-30";
      try {
        const rawSpan = JSON.parse(fs.readFileSync(spanPath, "utf8"));
        const kept = spanKept(rawSpan && rawSpan.span);
        if (kept) spanToken = kept;
      } catch { /* keep default */ }
      writeSpan(folder, spanToken, newOpen, opts.now);
    }
  }

  if (found && found.project && found.project.relay) {
    found.project.relay.lead = newOpen.public;
    writeProject(home, found.project);
  }
  /* EVERY LIBRARY CATALOG OF THIS TEAM LEARNS THE NEW LEAD, not only the one pressed (board 962 stage 5, T3; decided, question 5):
     a team may list more than one catalog, and a project still naming the old lead would read the relay's team as another key's. */
  for (const other of teamProjects(opts.projectsRoot, written.id)) {
    if (path.resolve(other.dir) === home || !other.project.relay) continue;
    other.project.relay.lead = newOpen.public; /* plant:handover-every-lead */
    writeProject(other.dir, other.project);
  }
  return { team: teamSummary(written, String(catalogs[0] || "")), written, box: boxSaid, desks: atHandover };
}

/* A DESK'S stats.estat ENVELOPE, ITS FIELDS TAKEN BY NAME (updates 4). The pinned engine's openStatsSealed asks for exactly
   six keys in one order, so a newer desk that added a seventh, or wrote them in another order, would read as a quiet desk. Within
   format 1 the six it reads are handed over by name, in its order, and anything else is left behind: none of it is bound by the
   seal (its info binds the team and the desk, its aad is empty), and the answer inside is still checked against the desk's own
   signature. Another format, or no object, is handed over as it came, for the engine to refuse. */
const STATS_ENVELOPE = ["format", "kind", "team", "keyId", "enc", "ct"];
function statsEnvelopeByName(doc) {
  if (!doc || typeof doc !== "object" || Array.isArray(doc) || doc.format !== 1) return doc;
  const out = {};
  for (const k of STATS_ENVELOPE) out[k] = doc[k];
  return out;
}

/* The days `token` counts on the local calendar day `ymdText`, noon, so the day does not depend on the hour. */
function periodOnDay(token, ymdText) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(ymdText || ""));
  if (!m) return null;
  return spanCounted(token, new Date(+m[1], +m[2] - 1, +m[3], 12, 0, 0));
}
/** The answer counts this span: the lead's own days, or the same rolling length, month or
 *  range ending on an earlier day. A different length or shape does not. No days matches nothing. */
function periodMatches(r, span) {
  const days = span && span.days;
  if (!days || !days.from || !days.to) return false;
  const d = r && r.data ? r.data : {};
  const p = d.period || {};
  const from = ymd(p.from), to = ymd(p.to);
  if (!from || !to || from > to) return false;
  if (from === days.from && to === days.to) return true;
  const token = span && span.span;
  if (!token || to > days.to) return false;
  if (token === "last-month") return false;
  if (token === "this-month" && from !== days.from) return false;
  const onEnd = periodOnDay(token, to);
  return !!(onEnd && onEnd.from === from && onEnd.to === to);
}
/** The name under the track: the roster name, then the name the answer declares, then the folder id. */
function spanDeskName(team, r) {
  const id = r && r.name ? String(r.name) : "";
  const named = rosterName(team, id);
  if (named) return named;
  const desk = r && r.data && typeof r.data.desk === "string" ? r.data.desk.trim() : "";
  if (desk && desk !== "-") return desk;
  return id;
}

/** THE DESKS' ANSWERS, AS THE COMMAND LINE PRINTS THEM. Every cell handed to the screen is one
 *  src/stats.mjs made: the header is its HEAD, each row is its rowOf over the file's own object,
 *  the team's figures are its "all desks" block, and a refused file carries its two lines. So
 *  the section cannot show a column, a rounding or a period the tool does not, and
 *  tests/stats-screen.mjs holds the two doors to the same share.
 *
 *  THE REFUSAL IS A FIELD AND NOT A THROW: a share that has no stats folder yet is the ordinary
 *  state of a share published to this morning, and the screen says what it read rather than
 *  showing an error box over a project that is perfectly well. `refusal` rather than `error`
 *  because the shell's own envelope owns that name. */
async function statsFor(dir, o) {
  const home = path.resolve(dir);
  const found = projectAt(home);
  if (!found) throw refuse("no catalog in {DIR}", { DIR: home });
  const opts = o || {};
  const statsAt = folderHere(found.project, opts);
  const shown = statsAt ? path.resolve(statsAt) : null;
  const folder = shown || null;
  const bare = { folder: shown, head: [], rows: [], refused: [], quiet: [],
                 live: { n: 0, time: "-" }, span: "rolling-30", days: null,
                 refusal: null,
                 /* the team's arrows the lead turned down on the Paths map (dismissPair), beside the totals they hide */
                 notPaths: notPathsOf(found.project) };
  if (!folder) return bare;
  const read = opts.key ? readKeyFile(opts.key) : null;
  if (!read || opts.passphrase == null || opts.passphrase === "") return bare;
  let open;
  try { open = unlockKey(read, opts.passphrase); }
  catch (e) { return Object.assign(bare, { refusal: e && e.message ? e.message : String(e) }); }
  const held = await heldTeam(folder, { key: opts.key });
  if (!held.team) return bare;
  const lead = { keyId: open.keyId, public: open.public };
  let span = readSpan(folder, lead, opts.now);
  if (!span) {
    try { span = writeSpan(folder, "rolling-30", open, opts.now); }
    catch (e) { return Object.assign(bare, { refusal: e && e.message ? e.message : String(e) }); }
  }
  let keys = [];
  try { keys = statsKeysOf(read, open); }
  catch (e) { return Object.assign(bare, { refusal: e && e.message ? e.message : String(e) }); }
  const roster = (held.team.roster || []).filter((e) => e && e.desk).map((e) => String(e.desk.id));
  const keyOf = new Map((held.team.roster || []).filter((e) => e && e.desk).map((e) => [String(e.desk.id), String(e.desk.key || "")]));
  /* A DESK SINCE REMOVED (F2): its statistics as it stored them while trusted, read under the key it had then, in the
     totals and never live (src/stats.mjs readLive). `o.removed` is src/team-store.mjs removedOf for this team. */
  const removedRec = opts.removed && typeof opts.removed === "object" ? opts.removed : {};
  const formerly = {}, left = [];
  const heldBefore = removedHeld(folder, removedRec, left);
  /* Its statistics file where Studio cannot place those bytes before the removal: not counted, and said (F-kappa1). */
  const removedLeft = left.filter((l) => l.path === "desks/" + l.desk + "/stats.estat" && roster.indexOf(l.desk) < 0) /* plant:rs-left */
    .map((l) => ({ name: l.path }));
  for (const id of Object.keys(heldBefore)) {
    const sha = heldBefore[id]["desks/" + id + "/stats.estat"];
    if (sha && roster.indexOf(id) < 0) { formerly[id] = sha; keyOf.set(id, String(removedRec[id].key || "")); }
  }
  /* Opened is not accepted: the lead's box is public, so an answer counts only where the roster's key for that
     folder signed it (the desk's own signature inside the seal, board 891's C1). */
  const opener = keys.length
    ? (doc, deskId) => {
      const R = Engine.statsRules();
      const text = statsOpenAny(R, keys, statsEnvelopeByName(doc), deskId); /* plant:u4-envelope */
      if (text == null) return null;
      let answer = null;
      try { answer = JSON.parse(text); } catch { return null; }
      return R.statsAnswerGenuine(answer, deskId, keyOf.get(String(deskId)) || "") ? text : null; /* plant:s2-roster-key */
    }
    : () => null;
  let got;
  try { got = await readStatsAll(folder, { roster, open: opener, removed: formerly, signed: keys.length > 0 }); }
  catch (e) { return Object.assign(bare, { refusal: e && e.message ? e.message : String(e) }); }
  let input = {};
  try { input = viewInput(home); } catch (e) { input = {}; }
  /* AN ANSWER THAT COUNTS A DIFFERENT PERIOD is left out of the figures. One that ends on an
     earlier day of this same span still counts. A desk since removed is left out and not named.
     The row stays in the table either way. */
  const inSpan = [], omit = [];
  for (const r of got.rows || []) {
    if (!periodMatches(r, span)) { /* plant:span-559-omit */
      if (!r.removed) omit.push(spanDeskName(held.team, r));
      continue;
    }
    inSpan.push(r);
  }
  const views = viewsOf(inSpan, input);
  const track = spanTrackOf(got.rows, opts.now);
  const presets = spanPresetRows(opts.now, track.first);
  const quiet = (got.quiet || []).map((q) => ({ desk: rosterName(held.team, q.desk) || q.desk, since: q.since || "-" }));
  return Object.assign(bare, {
    head: HEAD.split("\t"),
    rows: got.rows.map(r => Object.assign({ name: r.name, cells: rowOf(r.data).split("\t") }, r.removed ? { removed: true } : {})),
    refused: got.refused.map(r => ({ name: r.name, lines: refusalLines(r), extra: r.extra,
                                     keys: r.keys })),
    quiet, live: got.live, span: span.span, days: span.days, removedLeft,
    views,
    blocks: viewBlocks(views),
    spanOmit: omit, spanTrack: track, spanPresets: presets,
  });
}

/* A SHEET NAME EXCEL WILL KEEP: 31 characters, and none of the marks a sheet name refuses.
   An empty word becomes the sheet's number, so this file invents no English sentence. */
function sheetTitle(raw, n) {
  let s = String(raw || "").replace(/[:\\/?*[\]]/g, " ").replace(/\s+/g, " ").trim().replace(/^'+|'+$/g, "");
  if (!s) s = String(n);
  return s.slice(0, 31);
}

function uniqueSheetTitles(list) {
  const used = new Set();
  return list.map((raw, i) => {
    let s = sheetTitle(raw, i + 1);
    const key = (x) => x.toLowerCase();
    if (!used.has(key(s))) { used.add(key(s)); return s; }
    let n = 2, next = "";
    do {
      const tail = " " + n;
      next = (s.slice(0, 31 - tail.length) + tail).slice(0, 31);
      n += 1;
    } while (used.has(key(next)));
    used.add(key(next));
    return next;
  });
}

function langHead(pattern, code) {
  const c = String(code || "").toUpperCase();
  const p = String(pattern || "");
  if (!p) return c;
  if (p.indexOf("{LANG}") >= 0) return p.split("{LANG}").join(c);
  return p + " " + c;
}

/* AN INTENT IS NAMED BY ITS TOPIC AND THEN ITS CLAUSE (board 1018, piece C), as the desk names it; a category by its label. */
function tagWords(tag, lang, primary) {
  const pick = (bag) => String((bag || {})[lang] || (bag || {})[primary] || "");
  return tag && tag.kind === "request" ? (pick(tag.topic) || pick(tag.clause)) : pick(tag && tag.label); /* plant:c1018-tag-words */
}

/** The workbook for the period the Statistics view is showing. The figures are statsFor's,
 *  unread and unrecounted. A number is written as a number. Language totals are the team's,
 *  once, on the last row of the cards sheet. A card's language cells are the counts the desks
 *  sent for that card and language, and a language a desk did not count stays empty. */
async function exportStatsBook(dir, file, words, o) {
  const said = words && typeof words === "object" && !Array.isArray(words) ? words : {};
  const word = (k) => String(said[k] == null ? "" : said[k]);
  const facts = await statsFor(dir, o || {});
  if (facts.refusal) throw new Error(facts.refusal);
  if (!facts.folder || !facts.views) {
    throw refuse("this catalog has no folder yet: choose the folder the team reads from first");
  }
  const found = readProject(path.resolve(dir));
  const draft = found.draft;
  const primary = primaryOf(draft);
  const codes = ((draft && draft.langs) || []).map((l) => l && l.code).filter(Boolean);
  const asked = word("lang");
  const lang = codes.indexOf(asked) >= 0 ? asked : primary;
  const views = facts.views;
  const periodTeam = (views.periodTeam && views.periodTeam.langs && views.periodTeam.langs.length)
    ? views.periodTeam : (views.team || { misses: 0, intents: [], langs: [] });
  const team = periodTeam;
  const langs = Array.isArray(team.langs) ? team.langs : [];
  const sent = views.cardLangs && typeof views.cardLangs === "object" && !Array.isArray(views.cardLangs)
    ? views.cardLangs : {};
  const langCells = (id) => langs.map((l) => {
    const bag = sent[String(id)];
    const n = bag && typeof bag === "object" ? Number(bag[l.code]) : NaN;
    return Number.isFinite(n) && n > 0 ? n : null;
  });
  const cards = Array.isArray(draft.cards) ? draft.cards : [];
  const byId = new Map(cards.map((c) => [String(c.id), c]));
  const shelves = new Map((draft.tags || []).filter((t) => t && t.kind === "shelf").map((t) => [t.id, t]));
  const requests = new Map((draft.tags || []).filter((t) => t && t.kind === "request").map((t) => [t.id, t]));
  const ranked = views.top && Array.isArray(views.top.every) ? views.top.every : [];
  const seen = new Set();
  const body = [];
  for (const row of ranked) {
    const id = String(row[0]);
    seen.add(id);
    const card = byId.get(id);
    const copies = Number(row[2]);
    const shelf = card ? shelves.get(card.shelf) : null;
    /* A card retired since, still copied in the period, keeps its row and says so in Status (the copywriter, 436896c9). */
    body.push([String(row[1] || ""), shelf ? tagWords(shelf, lang, primary) : "", card && card.retired ? word("retired") : "",
      Number.isFinite(copies) ? copies : 0].concat(langCells(id)));
  }
  for (const card of cards) {
    const id = String(card.id);
    if (seen.has(id) || card.retired) continue;
    seen.add(id);
    const shelf = shelves.get(card.shelf);
    const title = String((card.title || {})[primary] || "");
    body.push([title, shelf ? tagWords(shelf, lang, primary) : "", "", 0].concat(langCells(id)));
  }
  const heads = [word("title"), word("category"), word("status"), word("copies")].concat(langs.map((l) => langHead(word("copiesLang"), l.code)));
  const cardRows = [heads].concat(body);
  const periodCopies = Number.isFinite(periodTeam.uses)
    ? periodTeam.uses
    : body.reduce((sum, r) => sum + (Number(r[3]) || 0), 0);
  cardRows.push([word("totals"), "", "", periodCopies].concat(langs.map((l) => {
    const n = Number(l.n);
    return Number.isFinite(n) ? n : 0;
  })));
  const searches = [[word("count")], [Number(team.misses) || 0]];
  const intentRows = [[word("intent"), word("times")]];
  for (const item of team.intents || []) {
    const tag = requests.get(item.id);
    const name = tag ? (tagWords(tag, lang, primary) || item.id) : String(item.id);
    const n = Number(item.n);
    intentRows.push([name, Number.isFinite(n) ? n : 0]);
  }
  const names = uniqueSheetTitles([word("cards"), word("searches"), word("intents")]);
  writeStatsBook(String(file || ""), {
    sheets: [
      { name: names[0], rows: cardRows },
      { name: names[1], rows: searches },
      { name: names[2], rows: intentRows },
    ],
  });
  return { file: String(file || "") };
}

/** Rewrite stats-span.json at once under the lead's key. A token the grammar accepts is kept. Anything else is the rolling thirty days. */
async function setStatsSpan(dir, span, o) {
  const home = path.resolve(dir);
  const found = projectAt(home);
  if (!found) throw refuse("no catalog in {DIR}", { DIR: home });
  const opts = o || {};
  const spanAt = folderHere(found.project, opts);
  const folder = spanAt ? path.resolve(spanAt) : null;
  if (!folder) throw refuse("this catalog has no folder yet: choose the folder the team reads from first");
  const read = readKeyFile(opts.key);
  if (!read) throw refuse("A team file is signed with this Studio's signing key, and Settings shows there is none yet.");
  let open;
  try { open = unlockKey(read, opts.passphrase); }
  catch (e) { throw refuse("The signing key did not open on this computer, so nothing was written."); }
  const held = await heldTeam(folder, { key: opts.key });
  if (!held.team) throw refuse(held.reason || "there is no team here this Studio leads, so there is nothing to open");
  const token = spanKept(span) || "rolling-30";
  const written = writeSpan(folder, token, open, opts.now);
  return { folder, span: written.span, days: written.days, file: "stats-span.json" };
}

/* ---- the publish cover ------------------------------------------------------------------------
 *
 * What the cover shows before anything is written, and every line of it is computed the way the
 * publisher will compute it rather than described: the revision by the same increment, the
 * edition by the same proposeEdition advanced past the archive by the same stampEdition,
 * and today's SECOND edition by running that function again with the first already taken. A
 * dialog that predicts differently from the act it introduces is worse than one that predicts
 * nothing.
 */
/** The licence as the cover says it: the state publishFull will act on and the file it was read
 *  from, which no other screen names. A full licence moves with no calendar day, and a trial's clock
 *  is the one src/licence.mjs reads. */
async function licenceLine(o) {
  const opts = o || {};
  const at = opts.licenceFile ? path.resolve(String(opts.licenceFile)) : null;
  const read = await licenceState(readLicenceFile(at), { file: at, now: opts.now,
    trustedKey: opts.trustedKey, released: opts.released, seen: opts.seen && typeof opts.seen === "object" ? opts.seen : undefined });
  /* A licence the root signed, from its file; else this Studio's own certificate, with what the service said of the licence (`shown`),
     never a licence file the service issued (Max, 2026-11-22 15:37; the shell's licenceShown says the same on the Licence cover). */
  const s = opts.shown && typeof opts.shown === "object" ? opts.shown : null, ends = s && Number.isSafeInteger(s.trialEnds) ? s.trialEnds : null;
  const seated = !read.root && seatHolds(Object.assign({}, opts, { licenceFile: at }), at);
  const st = read.root ? read
    : seated && ends !== null ? { status: "trial", canPublish: true, trial: { until: localDay(new Date(ends)), ends, over: false, signed: true } }
    : seated ? { status: "active", canPublish: true, org: s && s.org, seats: s && s.seats, devicesEach: s && s.seats ? 3 : null, updatesUntil: s && s.updatesUntil }
    : { status: "none", canPublish: false, unusable: read.status === "none" ? read.unusable : null };
  return { status: st.status, canPublish: !!st.canPublish, paused: !!st.paused, file: at,
           org: st.org || null, seats: st.seats || null, devicesEach: st.devicesEach || null,
           updatesUntil: st.updatesUntil || null,
           trial: st.trial || null, unusable: st.unusable || null };
}

async function publishPlan(dir, opts) {
  const home = path.resolve(dir);
  const p = readProject(home);
  /* WHAT THE DRAFT IS AWAITING, BY THE SAME CLASSIFIER THE PUBLISHER WILL ASK (board 510), and
     through the one door the open and the save go through since board 548. */
  const awaits = await awaitingFor(p.draft);
  const awaiting = awaits.rows;
  const rules = editionRules(null);
  const taken = editionsIn(home);
  const rev = (Number.isFinite(+p.project.rev) ? +p.project.rev : 0) + 1;
  const edition = stampEdition(rules, p.project.edition || p.draft.date || "", taken);
  const after = stampEdition(rules, edition, taken.concat([edition]));
  const name = projectName(home, p.project);
  const fixed = fixedName(home, p.project, String(p.draft.id));
  const planAt = folderHere(p.project, opts);
  const planFolder = planAt ? path.resolve(planAt) : null;
  const suggested = fixed || await suggestFileName(
    typeof p.project.fileNameFrom === "string" ? p.project.fileNameFrom : name,
    planFolder, String(p.draft.id));
  return {
    dir: home, name, fileName: suggested, fileFixed: !!fixed, id: p.draft.id,
    rev: p.project.rev || 0, next: rev,
    /* The dated edition the last publish was stamped with, for the rev it stands beside (board 902). */
    was: String(p.project.edition || ""),
    edition, after,
    published: p.project.published || null,
    folder: planFolder,
    editions: taken.length,
    counts: countsOf(p.draft),
    /* NO FINDING IS LEFT OUT HERE: the cover asks for the note over every error, as src/publish.mjs refuses without one. */
    lint: findings(p.draft, awaits.classed, awaits.rows, p.project.notPromises, p.project.endsMeant, null,
      p.project.changedNumbers),
    awaiting,
    /* The codes the lead's note can be written in, one box each on the cover. */
    langs: (p.draft.langs || []).map(l => l.code),
    licence: await licenceLine(opts),
    strip: await stripFor(home, p.draft),
    where: planFolder ? folderCheck(planFolder, home) : null,
    /* Whether an edition already out was signed, so the cover can say an unsigned one will not go (src/publish.mjs signedEarlier,
       Grok's review mu). The file in the folder is read where this computer can open it, as the publisher reads it. */
    signedBefore: signedEarlier(home, planFolder ? path.join(planFolder, suggested) : "", String(p.draft.id || ""), opts && opts.teamKeys), /* plant:s1-plan */
  };
}

/* THE PRESS'S STRIP (the Publishing window, decisions 2026-10-07 00:49): every card by its category in the draft's order,
   read against the last edition as changesSince reads it: "n" new since, "c" changed, "u" as it was, "r" live there and
   retired or gone here. A card retired on both sides is not drawn; before a first edition every live card is "n". */
async function stripFor(home, draft) {
  const F = await Engine.format();
  const same = sameOf(F);
  const eds = editionsIn(home);
  let base = null;
  if (eds.length) { try { base = archivedCatalog(home, eds[eds.length - 1]); } catch { base = null; } }
  const live = (c) => !!c && !c.retired;
  const shelves = (cat) => ((cat && cat.tags) || []).filter(t => t && t.kind === "shelf");
  const was = new Map(((base && base.cards) || []).filter(c => c && c.id).map(c => [c.id, c]));
  const groups = new Map();
  shelves(draft).forEach(t => groups.set(t.id, { id: t.id, label: Object.assign({}, t.label || {}), cards: [] }));
  const into = (shelf, k, from) => {
    const id = typeof shelf === "string" ? shelf : "";
    if (!groups.has(id)) {
      const t = shelves(from).find(x => x.id === id);
      groups.set(id, { id, label: t ? Object.assign({}, t.label || {}) : {}, cards: [] });
    }
    groups.get(id).cards.push(k);
  };
  const ids = new Set();
  (draft.cards || []).forEach(c => {
    if (!c || !c.id) return;
    ids.add(c.id);
    const w = was.get(c.id);
    const k = !live(c) ? (live(w) ? "r" : null) : !base || !live(w) ? "n" : same(w, c) ? "u" : "c";
    if (k) into(c.shelf, k, draft);
  });
  was.forEach((w, id) => { if (!ids.has(id) && live(w)) into(w.shelf, "r", base); });
  return { first: !base, groups: Array.from(groups.values()).filter(g => g.cards.length) };
}

/** The screen's Publish. One call into src/publish.mjs with the project folder, which is what
 *  tools/publish.mjs does with the same arguments; nothing about the file depends on which of
 *  the two asked for it. */
async function publishProject(dir, o) {
  const home = path.resolve(dir);
  const opts = o || {};
  const p = readProject(home);
  /* NO FOLDER, NO PUBLISH (sense pass 2, finding 14): the project's own folder stood in for the
     share and was recorded as one, so the list marked a folder no desk reads as the desks'.
     A relay team publishes into this computer's mirror. The shared project.json keeps the folder
     the first computer wrote. */
  const beforeFolder = p.project.folder ? String(p.project.folder) : null;
  const relayTeam = !!(p.project.relay && /^[0-9a-f]{32}$/.test(String(p.project.relay.rt || "")));
  const resolved = folderHere(p.project, opts);
  const folder = opts.folder ? String(opts.folder) : resolved; /* plant:h2-publish */
  if (!folder) throw refuse("Publishing needs the folder the team reads from, and Change"
    + " beside Writes to chooses it.");
  const work = path.resolve(folder);
  let done;
  try {
    done = await publishFull({
      project: home,
      folder: work,
      shown: path.resolve(folder),
      notes: typeof opts.notes === "string" ? opts.notes : null,
      leadNotes: opts.leadNotes && typeof opts.leadNotes === "object" ? opts.leadNotes : null,
      override: typeof opts.override === "string" ? opts.override : null,
      now: typeof opts.now === "string" ? opts.now : null,
      fileName: typeof opts.fileName === "string" ? opts.fileName : undefined,
      licenceFile: opts.licenceFile,
      seen: opts.seen && typeof opts.seen === "object" ? opts.seen : undefined,
      seat: opts.seat && typeof opts.seat === "object" ? opts.seat : undefined,
      userData: opts.userData,
      teamsFile: opts.teamsFile,
      trustedKey: opts.trustedKey,
      released: opts.released,
      leadKey: opts.leadKey,
      teamKeys: opts.teamKeys,
      pendingKeys: opts.pendingKeys,
      unsealed: opts.unsealed,
      key: opts.key,
      passphrase: opts.passphrase,
    });
  } catch (e) {
    if (e && e.refusal === "lint") return { refused: "lint", errors: e.lint.errors, message: e.message };
    throw e;
  }
  /* WHEN, written here and not by the publisher. The publisher's own record carries no clock
     because two publishes of one project must give the same bytes; a project's "last publish"
     is Studio's fact about its own folder, so it lives in project.json where a byte comparison
     never looks. */
  const after = projectAt(home);
  if (after) writeProject(home, Object.assign({}, after.project,
    { draft: after.draftName, folder: relayTeam ? beforeFolder : path.resolve(folder), published: new Date().toISOString() }));
  journalFrom(home, done.rev);
  /* An Undo of a delete or of a bulk act still stands across a publish that wrote the edition's dates into the draft:
     the draft is the one the act left, dates aside, so the hash it is remembered by follows (board 982). */
  if (done.draftHash) [GONE, UNDO].forEach((m) => { const u = m.get(home); if (u && u.hash === done.draftHash.was) u.hash = done.draftHash.now; });
  return {
    refused: null, rev: done.rev, edition: done.edition,
    ec: work !== path.resolve(folder) && done.ec ? path.join(path.resolve(folder), path.basename(done.ec)) : done.ec, archive: done.archive,
    counts: done.counts, folder: path.resolve(folder),
    lint: { errors: done.lint.errors.length, warnings: done.lint.warnings.length },
    editions: editionsIn(home).length,
    /* A newer edition of this catalog the folder already held, which this one went above (Grok's review 29, finding 2). */
    ...(done.folderNewer ? { folderNewer: done.folderNewer } : {}),
  };
}

/** WHERE "OPEN A FOLDER" LANDS (sense pass 2, finding 29). A folder that is itself a project is
 *  opened and the list becomes its parent's; taken as the root, it listed nothing, since a project
 *  holds no projects. */
function rootFor(chosen) {
  const at = path.resolve(String(chosen || ""));
  const own = fs.existsSync(path.join(at, PROJECT_FILE)) || draftsIn(at).length === 1;
  return own ? { root: path.dirname(at), open: at } : { root: at, open: null };
}

/* WHICH KEY THIS STUDIO WOULD SIGN WITH, and the reason the shell asks through here rather
 * than reading the file itself: src/ is the only half of this program that knows what a key
 * file is, and the shell's rule is that every verb the page performs is a whole verb in this
 * module (board 605).
 *
 * IT OPENS NOTHING. The keyId and the public half sit in the clear in the key file precisely so
 * that this question can be answered without a passphrase; the private half is untouched here
 * and the settings row shows only what a desk would have to be told anyway.
 *
 * A KEY FILE THAT IS THERE AND WRONG IS A STATE OF ITS OWN and is reported rather than swallowed:
 * absent is `keyId: ""` with no problem, present and unreadable is `keyId: ""` with the sentence
 * src/sign.mjs wrote. A row that showed "no signing key" over a file the person can see on disk
 * would send them looking in the wrong place.
 */
function signingKey(file) {
  const at = path.resolve(String(file || ""));
  try {
    const read = readKeyFile(at);
    return read
      ? { file: read.file, name: path.basename(read.file), keyId: read.keyId, public: read.public,
          print: leadPrintOf(read.public), kept: read.kept, problem: null }
      : { file: at, name: path.basename(at), keyId: "", public: "", print: "", kept: "", problem: null };
  } catch (e) {
    /* `name` is what a screen says: the English and its full path stay for the command line. */
    return { file: at, name: path.basename(at), keyId: "", public: "", print: "", kept: "",
             problem: e && e.message ? e.message : String(e) };
  }
}

/* ---- the key's backup copy (K6, K7; Maxim 2026-10-07 20:42) ------------------------------------------------------------
 * A BACKUP COPY IS A PASSPHRASE-WRAPPED KEY FILE, the same file the command line makes and reads, so its public half sits
 * outside the lock and the restore cover can show whose key it holds before anything is typed. The private half crosses
 * this thread as the secret the shell's vault opened and leaves only wrapped; scrypt runs here, not in the window's
 * process. The passphrase is not kept. */
const notOpened = () => refuse("The signing key did not open on this computer, so nothing was written.");
function openedPair(keyFile, secret) {
  const read = readKeyFile(keyFile);
  if (!read) throw refuse("A team file is signed with this Studio's signing key, and Settings shows there is none yet.");
  try { return pairOf(unlockKey(read, secret)); } catch { throw notOpened(); }
}
/** Writes the backup copy of the key in `keyFile` to `file` under `passphrase`. However weak, the passphrase is the lead's
 *  to choose (finding 31, Maxim 2026-10-16 07:09); only an empty one, which is none, is refused, as it always was.
 *  `o.relays`, where the shell sends them, are this Studio's relay teams, and `o.epochs` its team keys, one row an
 *  epoch, a pending one marked so. Each list is sealed under the signing key's own seed (HKDF-SHA256, info
 *  etiuda-backup-relays or etiuda-backup-epochs, AES-256-GCM), so a copy read without its passphrase gives neither a
 *  team's place nor a key, and an edited copy cannot name another. No second scrypt: the passphrase opens the key,
 *  and the rows open with it. */
const RELAY_ROW_MAX = 64;
const RELAY_SEAL_INFO = "etiuda-backup-relays";
function relaySealKey(pair) {
  const der = Buffer.from(String(pair && pair.der || ""), "hex");
  return Buffer.from(crypto.hkdfSync("sha256", der.subarray(Math.max(0, der.length - 32)), Buffer.alloc(0), RELAY_SEAL_INFO, 32));
}
function relaySealAad(pair) {
  return Buffer.from(RELAY_SEAL_INFO + "\n" + String(pair.keyId) + "\n" + String(pair.public), "utf8");
}
function recoveryCopy(rc, epoch) {
  if (!rc || typeof rc !== "object" || Array.isArray(rc) || rc.epoch !== epoch) return null;
  const salt = typeof rc.salt === "string" ? rc.salt : "", iv = typeof rc.iv === "string" ? rc.iv : "";
  const ct = typeof rc.ct === "string" ? rc.ct : "";
  if (!/^[0-9a-f]+$/.test(salt) || !/^[0-9a-f]+$/.test(iv) || !/^[0-9a-f]+$/.test(ct)) return null;
  return { epoch, kdf: rc.kdf, N: rc.N, r: rc.r, p: rc.p, cipher: rc.cipher, salt, iv, ct };
}
function relayRowsForBackup(rows) {
  const out = [];
  for (const row of Array.isArray(rows) ? rows : []) {
    if (out.length >= RELAY_ROW_MAX) break;
    if (!row || typeof row !== "object") continue;
    const team = String(row.team || ""), rt = String(row.rt || ""), epoch = row.epoch;
    if (!/^t-[0-9a-f]{16}$/.test(team) || !/^[0-9a-f]{32}$/.test(rt) || !Number.isInteger(epoch) || epoch < 1) continue;
    const recovery = recoveryCopy(row.recovery, epoch);
    if (!recovery) continue;
    const built = { team, rt, epoch, recovery };
    if (typeof row.url === "string" && /^https:\/\//.test(row.url)) built.url = row.url;
    if (typeof row.sealed === "boolean") built.sealed = row.sealed;
    out.push(built);
  }
  return out;
}
function sealRelayRows(pair, relays) {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv("aes-256-gcm", relaySealKey(pair), iv);
  c.setAAD(relaySealAad(pair));
  const ct = Buffer.concat([c.update(Buffer.from(JSON.stringify(relays), "utf8")), c.final(), c.getAuthTag()]);
  return { v: 1, iv: iv.toString("hex"), ct: ct.toString("hex") };
}
function openRelaySeal(pair, blob) {
  if (!blob || typeof blob !== "object" || Array.isArray(blob) || blob.v !== 1) return null;
  if (typeof blob.iv !== "string" || typeof blob.ct !== "string") return null;
  if (!/^[0-9a-f]{24}$/.test(blob.iv) || !/^[0-9a-f]+$/.test(blob.ct) || blob.ct.length < 34 || blob.ct.length % 2 !== 0) return null;
  const ct = Buffer.from(blob.ct, "hex");
  try {
    const d = crypto.createDecipheriv("aes-256-gcm", relaySealKey(pair), Buffer.from(blob.iv, "hex"));
    d.setAAD(relaySealAad(pair));
    d.setAuthTag(ct.subarray(ct.length - 16));
    const rows = JSON.parse(Buffer.concat([d.update(ct.subarray(0, ct.length - 16)), d.final()]).toString("utf8"));
    return Array.isArray(rows) ? rows : null;
  } catch { return null; }
}
/* Team keys on the backup copy, sealed the same way as the relay rows and under their own info, so one seal opened
   with the other key is not a row. A pending epoch is marked. Nothing here is a cap: every row the shell sends is sealed. */
const EPOCH_SEAL_INFO = "etiuda-backup-epochs";
function epochSealKey(pair) {
  const der = Buffer.from(String(pair && pair.der || ""), "hex");
  return Buffer.from(crypto.hkdfSync("sha256", der.subarray(Math.max(0, der.length - 32)), Buffer.alloc(0), EPOCH_SEAL_INFO, 32));
}
function epochSealAad(pair) {
  return Buffer.from(EPOCH_SEAL_INFO + "\n" + String(pair.keyId) + "\n" + String(pair.public), "utf8");
}
function epochRowsForBackup(rows) {
  const out = [];
  for (const row of Array.isArray(rows) ? rows : []) {
    if (!row || typeof row !== "object") continue;
    const team = String(row.team || ""), epoch = Number(row.epoch);
    if (!/^t-[0-9a-f]{16}$/.test(team) || !Number.isInteger(epoch) || epoch < 1) continue;
    let key;
    try { key = Buffer.from(row.key); } catch { continue; }
    if (key.length !== 32) continue;
    const built = { team, epoch, key: key.toString("hex") };
    if (row.pending === true) built.pending = true;
    out.push(built);
  }
  return out;
}
function sealEpochRows(pair, epochs) {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv("aes-256-gcm", epochSealKey(pair), iv);
  c.setAAD(epochSealAad(pair));
  const ct = Buffer.concat([c.update(Buffer.from(JSON.stringify(epochs), "utf8")), c.final(), c.getAuthTag()]);
  return { v: 1, iv: iv.toString("hex"), ct: ct.toString("hex") };
}
function openEpochSeal(pair, blob) {
  if (!blob || typeof blob !== "object" || Array.isArray(blob) || blob.v !== 1) return null;
  if (typeof blob.iv !== "string" || typeof blob.ct !== "string") return null;
  if (!/^[0-9a-f]{24}$/.test(blob.iv) || !/^[0-9a-f]+$/.test(blob.ct) || blob.ct.length < 34 || blob.ct.length % 2 !== 0) return null;
  const ct = Buffer.from(blob.ct, "hex");
  try {
    const d = crypto.createDecipheriv("aes-256-gcm", epochSealKey(pair), Buffer.from(blob.iv, "hex"));
    d.setAAD(epochSealAad(pair));
    d.setAuthTag(ct.subarray(ct.length - 16));
    const rows = JSON.parse(Buffer.concat([d.update(ct.subarray(0, ct.length - 16)), d.final()]).toString("utf8"));
    return Array.isArray(rows) ? rows : null;
  } catch { return null; }
}
function epochsFromCopy(file, pair) {
  const read = readKeyFile(file);
  const rows = openEpochSeal(pair, read && read.doc && read.doc.epochs);
  if (!rows) return [];
  const out = [];
  for (const row of rows) {
    if (!row || typeof row !== "object") continue;
    const team = String(row.team || ""), epoch = Number(row.epoch);
    if (!/^t-[0-9a-f]{16}$/.test(team) || !Number.isInteger(epoch) || epoch < 1) continue;
    if (typeof row.key !== "string" || !/^[0-9a-f]{64}$/.test(row.key)) continue;
    const key = Buffer.from(row.key, "hex");
    const built = { team, epoch, key };
    if (row.pending === true) built.pending = true;
    out.push(built);
  }
  return out;
}
async function backupKey(file, keyFile, secret, passphrase, o) {
  if (!String(passphrase == null ? "" : passphrase)) throw refuse("A backup copy needs a passphrase; nothing was written.");
  const pair = openedPair(keyFile, secret);
  const copy = passphraseFile(pair, passphrase);
  const relays = relayRowsForBackup(o && o.relays);
  if (relays.length) copy.relays = sealRelayRows(pair, relays); /* plant:s932-seal */
  const epochs = epochRowsForBackup(o && o.epochs);
  if (epochs.length) copy.epochs = sealEpochRows(pair, epochs);
  const member = memberRowForBackup(o && o.member);
  if (member) copy.member = sealMemberRow(pair, member); /* plant:962s7n-backup */
  const people = peopleRowForBackup(o && o.people);
  if (people) copy.people = sealPeopleRow(pair, people); /* plant:f4b-backup */
  const at = path.resolve(String(file || ""));
  writeWhole(at, JSON.stringify(copy, null, 1) + "\n", { mode: OWNER_ONLY });
  return { file: at, keyId: pair.keyId, print: leadPrintOf(pair.public) };
}
/** What a backup copy says without its passphrase: its key, as the rows print it. */
function readBackup(file) {
  let read = null;
  try { read = readKeyFile(file); } catch { read = null; }
  if (!read || read.kept !== "passphrase") throw refuse("To restore the signing key, pick the file Studio wrote with Make a backup copy…, whose name begins etiuda-studio-key- unless it was renamed; {FILE} is not such a copy.", { FILE: path.basename(String(file || "")) });
  return { file: read.file, keyId: read.keyId, print: leadPrintOf(read.public) };
}
/** The relay teams sealed in the copy, each team key opened from its recovery copy. A clear array, a failed tag, or a row
 *  whose recovery does not open is no row. An address is kept only when it is https; the shell fills the built-in one. */
function relaysFromCopy(file, passphrase, pair) {
  const read = readKeyFile(file);
  const rows = openRelaySeal(pair, read && read.doc && read.doc.relays);
  if (!rows) return [];
  let secret = "";
  try { secret = recoveryOf(file, passphrase); } catch { return []; }
  const out = [];
  for (const row of rows) {
    if (out.length >= RELAY_ROW_MAX) break;
    if (!row || typeof row !== "object") continue;
    const team = String(row.team || ""), rt = String(row.rt || ""), epoch = row.epoch;
    if (!/^t-[0-9a-f]{16}$/.test(team) || !/^[0-9a-f]{32}$/.test(rt) || !Number.isInteger(epoch) || epoch < 1) continue;
    const key = openRecovery({ id: team, epoch, recovery: row.recovery }, secret);
    if (!key || key.length !== 32) continue;
    const built = { team, rt, epoch, key };
    if (typeof row.url === "string" && /^https:\/\//.test(row.url)) built.url = row.url;
    if (typeof row.sealed === "boolean") built.sealed = row.sealed;
    out.push(built);
  }
  return out;
}
/* THE MEMBER KEY AND THE TEAM THIS STUDIO FOLLOWS (board 962, stage 7, V2; Argon's review of 2026-11-09, finding 8), sealed as the
   relay rows are under their own info: {key: {key, box, sign, boxSecret}, follow: the row src/team-store.mjs followBackupRow makes}.
   Without it a lost member key leaves this Studio's old entry on the other team's roster, holding a place, and it rejoins. */
const MEMBER_SEAL_INFO = "etiuda-backup-member";
function memberSealKey(pair) {
  const der = Buffer.from(String(pair && pair.der || ""), "hex");
  return Buffer.from(crypto.hkdfSync("sha256", der.subarray(Math.max(0, der.length - 32)), Buffer.alloc(0), MEMBER_SEAL_INFO, 32));
}
function memberSealAad(pair) {
  return Buffer.from(MEMBER_SEAL_INFO + "\n" + String(pair.keyId) + "\n" + String(pair.public), "utf8");
}
function memberRowForBackup(m) {
  const k = m && m.key;
  if (!k || !/^[0-9a-f]{64}$/.test(String(k.key)) || !/^[0-9a-f]{64}$/.test(String(k.box)) || !/^[0-9a-f]+$/.test(String(k.sign))
    || !/^[0-9a-f]+$/.test(String(k.boxSecret))) return null;
  const out = { key: { key: k.key, box: k.box, sign: k.sign, boxSecret: k.boxSecret } };
  if (m.follow && typeof m.follow === "object") out.follow = JSON.parse(JSON.stringify(m.follow));
  return out;
}
function sealMemberRow(pair, row) {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv("aes-256-gcm", memberSealKey(pair), iv);
  c.setAAD(memberSealAad(pair));
  const ct = Buffer.concat([c.update(Buffer.from(JSON.stringify(row), "utf8")), c.final(), c.getAuthTag()]);
  return { v: 1, iv: iv.toString("hex"), ct: ct.toString("hex") };
}
function memberFromCopy(file, pair) {
  const read = readKeyFile(file), blob = read && read.doc && read.doc.member;
  if (!blob || typeof blob !== "object" || blob.v !== 1 || !/^[0-9a-f]{24}$/.test(String(blob.iv)) || !/^[0-9a-f]+$/.test(String(blob.ct))
    || String(blob.ct).length < 34 || String(blob.ct).length % 2 !== 0) return null;
  const ct = Buffer.from(blob.ct, "hex");
  try {
    const d = crypto.createDecipheriv("aes-256-gcm", memberSealKey(pair), Buffer.from(blob.iv, "hex"));
    d.setAAD(memberSealAad(pair));
    d.setAuthTag(ct.subarray(ct.length - 16));
    return memberRowForBackup(JSON.parse(Buffer.concat([d.update(ct.subarray(0, ct.length - 16)), d.final()]).toString("utf8")));
  } catch { return null; }
}
/* THE LEAD'S BOOKS OF PEOPLE AND SEATS (Hydrogen's review of 2026-11-12, finding 4 (b)), sealed as the member row is under their
   own info: {people: the shell's team-people.json, seats: its desk-seats.json}, each by team id. They are the lead's record of whom
   it admitted by code, whom it removed and which person each desk's certificate named: the service's pseudonyms, codes and times,
   never a token or a name. Without them a lead carrying on from another computer cannot tell its own admission from the
   organisation's, so a Remove there withdraws nothing at the service and lets a removed person's next desk back in. A copy is a
   snapshot: what changed after it was made is not in it, as with its relay rows. */
const PEOPLE_SEAL_INFO = "etiuda-backup-people";
const PEOPLE_TEAMS_MAX = 256, PEOPLE_EACH_MAX = 4096;
const UNSAFE_KEYS = new Set(["__proto__", "constructor", "prototype"]);
const plainObject = (v) => !!v && typeof v === "object" && !Array.isArray(v);
const plainCopy = (v) => JSON.parse(JSON.stringify(v), (k, x) => (UNSAFE_KEYS.has(k) ? undefined : x));
function peopleRowForBackup(p) {
  if (!plainObject(p)) return null;
  const people = {}, seats = {};
  const teamsOf = (o) => (plainObject(o) ? Object.keys(o).filter((k) => /^t-[0-9a-f]{16}$/.test(k)).slice(0, PEOPLE_TEAMS_MAX) : []);
  for (const id of teamsOf(p.people)) {
    const m = plainObject(p.people[id]) ? p.people[id] : {}, out = {};
    for (const who of Object.keys(m).filter((k) => /^[0-9a-f]{64}$/.test(k)).slice(0, PEOPLE_EACH_MAX)) if (plainObject(m[who])) out[who] = plainCopy(m[who]);
    if (Object.keys(out).length) people[id] = out;
  }
  for (const id of teamsOf(p.seats)) {
    const desks = plainObject(p.seats[id]) && plainObject(p.seats[id].desks) ? p.seats[id].desks : {}, out = {};
    for (const d of Object.keys(desks).filter((k) => !UNSAFE_KEYS.has(k) && k.length <= 128).slice(0, PEOPLE_EACH_MAX)) if (plainObject(desks[d])) out[d] = plainCopy(desks[d]);
    if (Object.keys(out).length) seats[id] = { desks: out };
  }
  return Object.keys(people).length || Object.keys(seats).length ? { people, seats } : null;
}
function peopleSealKey(pair) {
  const der = Buffer.from(String(pair && pair.der || ""), "hex");
  return Buffer.from(crypto.hkdfSync("sha256", der.subarray(Math.max(0, der.length - 32)), Buffer.alloc(0), PEOPLE_SEAL_INFO, 32));
}
function peopleSealAad(pair) {
  return Buffer.from(PEOPLE_SEAL_INFO + "\n" + String(pair.keyId) + "\n" + String(pair.public), "utf8");
}
function sealPeopleRow(pair, row) {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv("aes-256-gcm", peopleSealKey(pair), iv);
  c.setAAD(peopleSealAad(pair));
  const ct = Buffer.concat([c.update(Buffer.from(JSON.stringify(row), "utf8")), c.final(), c.getAuthTag()]);
  return { v: 1, iv: iv.toString("hex"), ct: ct.toString("hex") };
}
function peopleFromCopy(file, pair) {
  const read = readKeyFile(file), blob = read && read.doc && read.doc.people;
  if (!blob || typeof blob !== "object" || blob.v !== 1 || !/^[0-9a-f]{24}$/.test(String(blob.iv)) || !/^[0-9a-f]+$/.test(String(blob.ct))
    || String(blob.ct).length < 34 || String(blob.ct).length % 2 !== 0) return null;
  const ct = Buffer.from(blob.ct, "hex");
  try {
    const d = crypto.createDecipheriv("aes-256-gcm", peopleSealKey(pair), Buffer.from(blob.iv, "hex"));
    d.setAAD(peopleSealAad(pair));
    d.setAuthTag(ct.subarray(ct.length - 16));
    return peopleRowForBackup(plainCopy(JSON.parse(Buffer.concat([d.update(ct.subarray(0, ct.length - 16)), d.final()]).toString("utf8"))));
  } catch { return null; }
}
/** The key a backup copy holds, opened by `passphrase`, as the shell seals it again for this computer. `relays`, where
 *  the copy sealed any, are the relay teams that key brings back, and `epochs` the team keys, each epoch, a pending
 *  one marked so, and `people` the lead's books of people and seats. A seal that does not open leaves that list off and the key
 *  still restored. */
/* Whether a lead box opens under the opened key: it is outside the passphrase's additional data, so a copy can carry one that does not. */
function boxOpens(opened, box) {
  try { return !!openLeadBox({ doc: { box } }, opened); } catch { return false; }
}
function openBackup(file, passphrase) {
  const read = readBackup(file) && readKeyFile(file);
  let opened;
  try { opened = unlockKey(read, passphrase); }
  catch { throw refuse("The passphrase does not open this copy. Nothing was changed."); }
  const pair = pairOf(opened);
  /* A box that does not open is left off, so the restore keeps a box in the key's place that does, and the next team write goes on. */
  if (pair.box && !boxOpens(opened, pair.box)) { delete pair.box; pair.boxDropped = true; } /* plant:k27-box-opens */
  const relays = relaysFromCopy(file, passphrase, pair);
  const epochs = epochsFromCopy(file, pair);
  const extra = {};
  if (relays.length) extra.relays = relays;
  if (epochs.length) extra.epochs = epochs;
  const member = memberFromCopy(file, pair);
  if (member) extra.member = member;
  const people = peopleFromCopy(file, pair);
  if (people) extra.people = people;
  return Object.keys(extra).length ? Object.assign(pair, extra) : pair;
}

/* THE DESKS ASKING TO JOIN (board 834, step 12, S5), on the same screen as the Desks roster: the team at the project's folder as
 * this Studio holds it, read only through heldTeam under the key file the shell names, so a team signed by any other key
 * has nothing to open, refuse or admit into. */
async function heldAtProject(dir, keyFile, o) {
  /* A TEAM WITH NO CATALOG HAS NO PROJECT TO NAME ITS FOLDER: the shell names the mirror itself (`o.atFolder`, from the team's id) and
     the team is read there under this Studio's key, as it is at a project's. */
  const at = o && typeof o.atFolder === "string" && o.atFolder ? path.resolve(o.atFolder) : "";
  if (at) { /* plant:tib-held-at */
    if (!readKeyFile(keyFile)) return { folder: at, shown: at, team: null, reason: "there is no signing key here" };
    const held = await heldTeam(at, { key: keyFile });
    return { folder: at, shown: at, team: held.team, reason: held.reason };
  }
  const home = path.resolve(dir), found = projectAt(home);
  if (!found) throw refuse("no catalog in {DIR}", { DIR: home });
  const named = o && typeof o.folder === "string" && o.folder ? path.resolve(o.folder) : "";
  const resolvedHold = folderHere(found.project, o);
  const shown = named || (resolvedHold ? path.resolve(resolvedHold) : null);
  if (!shown) return { folder: null, shown: null, team: null, reason: "this project publishes nowhere yet" };
  const folder = shown;
  if (!readKeyFile(keyFile)) return { folder, shown, team: null, reason: "there is no signing key here" };
  const held = await heldTeam(folder, { key: keyFile });
  return { folder, shown, team: held.team, reason: held.reason };
}
/** The Desks screen's one read: teamFacts, whose `requests` are the desks asking to join, each invitation among them read
 *  against the book `o.invites` (the shell's teams.json) at `o.now`. */
async function desksFor(dir, keyFile, o) {
  const opts = o || {};
  return teamFacts(dir, { key: keyFile, invites: opts.invites, now: opts.now, teamsFile: opts.teamsFile, userData: opts.userData,
    passphrase: opts.passphrase, atFolder: opts.atFolder }); /* plant:tib-desks-at */
}
/* The lead's key opened by `secret`, to sign the file of openings (src/join.mjs); refused, with nothing written, where it does not open. */
function joinsSigner(keyFile, secret) {
  if (!String(secret == null ? "" : secret)) throw notOpened();
  try { return unlockKey(readKeyFile(keyFile), secret); } catch { throw notOpened(); }
}
const END_NOT_LEAD = "This Studio does not lead that team, so the team was not ended.";
const END_LIVE_INVITE = "This team still has an invitation that can let a teammate in, so it was not ended. Once the invitation is withdrawn, the team can be ended. Nothing was changed.";
/** Drops the local slot of a team this key leads. The share's team file is left where it is. */
async function endLedTeam(teamId, keyFile, o) {
  const id = String(teamId || "");
  const opts = o || {};
  const tf = opts.teamsFile || (opts.userData ? teamsFile(opts.userData) : "");
  const kept = tf && /^t-[0-9a-f]{16}$/.test(id) ? keptTeam(tf, id) : null;
  const key = readKeyFile(keyFile);
  if (!kept || !key || !key.public) throw refuse(END_NOT_LEAD);
  let leads = !!(kept.file && kept.file.lead && kept.file.lead.public === key.public && kept.file.lead.keyId === key.keyId);
  let roster = kept.file && Array.isArray(kept.file.roster) ? kept.file.roster : [];
  if (kept.folder) {
    const at = kept.folder;
    if (fs.existsSync(path.join(at, "etiuda-team.json"))) {
      const held = await heldTeam(at, { key: keyFile });
      leads = !!(held.team && held.team.id === id && held.team.lead && held.team.lead.public === key.public);
      if (held.team && Array.isArray(held.team.roster)) roster = held.team.roster;
    }
  }
  if (!leads) throw refuse(END_NOT_LEAD);
  if (liveInvitesOf(tf, id, opts.now, roster) > 0) throw refuse(END_LIVE_INVITE);
  endTeam(tf, id);
  return { ended: id, teamsCount: studioTeammates(tf, opts).teamsCount };
}
async function refuseDeskJoin(dir, keyFile, id, o) {
  const h = await heldAtProject(dir, keyFile, o);
  if (!h.team) throw refuse("there is no team here this Studio leads, so there is nothing to refuse");
  refuseJoin(h.folder, h.team, String(id || ""), joinsSigner(keyFile, (o || {}).passphrase));
  return desksFor(dir, keyFile, o);
}
/** The team key this Studio does not hold for the team at the project's folder, out of the team's recovery copy under the
 *  signing key (P2): how a key restored from its backup brings the team back. Null where it holds the key already, there
 *  is no team of its own, or the copy does not open. */
async function teamKeyBack(dir, keyFile, secret, o) {
  const h = await heldAtProject(dir, keyFile, o);
  if (!h.team || teamKeyOf(o && o.teamKeys, h.team.id, h.team.epoch)) return null;
  let key = null;
  try { key = openRecovery(h.team, recoveryOf(keyFile, secret)); } catch { key = null; }
  return key ? { id: h.team.id, epoch: h.team.epoch, key, sealed: h.team.sealed === true, folder: h.shown,
                 written: JSON.parse(JSON.stringify(h.team)) } : null;
}
/** THE KEY OF THE TEAM FILE A RELAY MIRROR HOLDS, out of that file's recovery copy under the signing key (Claude alpha's ruling of
 *  2026-11-23 00:37): how the lead's other computer, which reached the newest team file through a remaining desk's copy, takes its
 *  key. {id, epoch, key, aside}: `aside` true where this Studio keeps a different key under that number (one it made in a fork,
 *  to be set aside); null where it holds that key already, the file is not its own, or the copy does not open. */
async function teamKeyFromFile(folder, keyFile, secret, o) {
  let held = null;
  try { held = await heldTeam(String(folder || ""), { key: keyFile }); } catch { held = null; }
  /* A fork: the relay's file, at an epoch or rev below one this Studio wrote and never sent, stands. Its floor comes down to it. */
  if (held && held.older && o && o.fork === true) {
    try {
      const raw = (await readTeam(String(folder || ""))).team;
      if (raw && forkRevFloor(keyFile, raw)) held = await heldTeam(String(folder || ""), { key: keyFile }); /* plant:rmo-fork-floor */
    } catch { held = null; }
  }
  const team = held && held.team;
  if (!team || !team.lead || !Number.isInteger(team.epoch)) return null;
  let key = null;
  try { key = openRecovery(team, recoveryOf(keyFile, secret)); } catch { key = null; }
  if (!key) return null;
  const have = teamKeyOf(o && o.teamKeys, team.id, team.epoch);
  if (have && Buffer.from(have).equals(key)) return null;
  return { id: team.id, epoch: team.epoch, key, aside: !!have };
}
/** Whether a desk's Export of the team's sealed catalog stays sealed or goes out in the clear (23b-B): the team file's
 *  `exportsSealed`, which the desk's shell reads. Signed with the key `secret` opens; `written` is as writeTeam gives it. */
async function setTeamExports(dir, keyFile, sealed, secret, o) {
  const h = await heldAtProject(dir, keyFile, o);
  if (!h.team) throw new Error("no team this Studio leads is at this project's folder (" + h.reason + "); nothing was written");
  if (!String(secret == null ? "" : secret)) throw notOpened();
  const written = (await writeTeam(h.folder, ownRecovery(withExportsSealed(h.team, sealed === true), o && o.teamKeys, keyFile, secret),
    { key: keyFile, passphrase: secret })).team;
  return Object.assign(await desksFor(dir, keyFile, o), { written: JSON.parse(JSON.stringify(written)) });
}

/** Whether the desks may share a card with a named teammate (board 1013, piece 6): the team file's `sharing`, which the desks'
 *  shells read where they read the roster. Signed with the key `secret` opens; `written` is as writeTeam gives it. */
async function setTeamSharing(dir, keyFile, on, secret, o) {
  const h = await heldAtProject(dir, keyFile, o);
  if (!h.team) throw new Error("no team this Studio leads is at this project's folder (" + h.reason + "); nothing was written");
  if (!String(secret == null ? "" : secret)) throw notOpened();
  const written = (await writeTeam(h.folder, ownRecovery(withSharing(h.team, on === true), o && o.teamKeys, keyFile, secret),
    { key: keyFile, passphrase: secret })).team;
  return Object.assign(await desksFor(dir, keyFile, o), { written: JSON.parse(JSON.stringify(written)) });
}

/* ---- invitations and auto-admit (board 885, S2) -----------------------------------------------------------------------
 * Studio decides here who is let into a team it leads, and nothing here sends anything. An invitation's blob is made by the
 * shell (src/invite.mjs makeInvite), which keeps the secret sealed in teams.json and puts the blob on the clipboard; the
 * verbs below are handed the book of invitations for one call, as an admission is handed the team key, and keep nothing. */

/** The team this Studio leads at `folder`, held only through heldTeam under the key file the shell names. */
async function heldAtFolder(folder, keyFile) {
  const at = folder ? path.resolve(String(folder)) : null;
  if (!at) return { folder: null, team: null, reason: "this team names no folder" };
  if (!readKeyFile(keyFile)) return { folder: at, team: null, reason: "there is no signing key here" };
  const held = await heldTeam(at, { key: keyFile });
  return { folder: at, team: held.team, reason: held.reason };
}

/* The team key for the held team's epoch, as an admission finds it: the one the shell keeps (`teamKeys`), else the recovery
   copy under the signing key `secret` opens, else the copy under a passphrase of its own (`recovery`); null where none opens. */
function teamKeyFor(team, keyFile, secret, recovery, teamKeys) {
  const kept = teamKeyOf(teamKeys, team.id, team.epoch);
  if (kept) return kept;
  let own = null;
  try { own = openRecovery(team, recoveryOf(keyFile, secret)); } catch { own = null; }
  return own || (recovery ? openRecovery(team, recovery) : null);
}

/** What an invitation from this project's folder names, for the shell to make one: the team this Studio leads there, the
 *  folder and the lead key, with the lead's box where the team file names one. Refused where this Studio leads no team there. */
async function inviteTarget(dir, keyFile, o) {
  const tf = o && (o.teamsFile || (o.userData ? teamsFile(o.userData) : ""));
  if (tf) {
    const tm = studioTeammates(tf, o);
    if (!tm.ok && tm.unreadable) {
      throw refuse(REFUSAL_TEAMS_UNREADABLE);
    }
    if (tm.count >= MAX_TEAMMATES) {
      throw refuse(REFUSAL_TEAMMATES_LIMIT);
    }
  }
  const h = await heldAtProject(dir, keyFile, o);
  if (!h.team) throw refuse("There is no team here led from this Studio, so nobody can be invited.");
  /* The lead's box as the team file names it (lead.box), for an invitation on the relay to carry (N2 of the slice 1 review). */
  const box = /^[0-9a-f]{64}$/.test(String(h.team.lead.box || "")) ? { box: h.team.lead.box } : {};
  return { team: h.team.id, folder: h.shown, lead: Object.assign({ keyId: h.team.lead.keyId, public: h.team.lead.public }, box) }; /* plant:rs-target-box */
}

/* ---- the Group Policy template for the IT department (sense pass finding 17) ------------------------------------------
 * A desk reads the lead's key from machine policy, and the engine's template is what an administrator loads to set it
 * (src/engine.mjs policyTemplate, through the pin). The Desks screen saves that template with this team's lead key in
 * place as its text box's default, so enabling the policy is all that is left; or it copies the value. Nothing else is
 * changed: the ADMX is the pin's bytes, and each ADML is the pin's with one <defaultValue> in the LeadKey box. The key
 * is the team file's own, 64 lowercase hex, as the ADML asks for it. */
const POLICY_VALUES = ["LeadKey"];
const POLICY_HIVES = { Machine: "HKEY_LOCAL_MACHINE", User: "HKEY_CURRENT_USER" };
const attrsOf = (tag) => {
  const out = {};
  String(tag).replace(/([\w:]+)="([^"]*)"/g, (m, k, v) => { out[k] = v; return m; });
  return out;
};
const xmlText = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const noTeamToGive = () => refuse("There is no team here led from this Studio, so there is nothing to give the IT department.");
/** The pin's template with `lead` as the LeadKey box's default: { "etiuda.admx": text, "<lang>/etiuda.adml": text }
 *  and the registry lines the value goes under. A template the pin carries in any other shape refuses whole. */
function policyFilled(lead) {
  const t = Engine.policyTemplate(), value = { LeadKey: String(lead || "") };
  if (!/^[0-9a-f]{64}$/.test(value.LeadKey)) throw new Error("the team's lead key is not 64 lowercase hex");
  const policies = t.admx.match(/<policy\b[\s\S]*?<\/policy>/g) || [], box = {}, lines = [];
  for (const name of POLICY_VALUES) {
    const hits = policies.map((p) => ({ p: attrsOf(p.match(/<policy\b[^>]*>/)[0]),
      text: (p.match(/<text\b[^>]*>/g) || []).map(attrsOf).filter((a) => a.valueName === name) })).filter((x) => x.text.length);
    if (hits.length !== 1 || hits[0].text.length !== 1) throw new Error("the pinned template has " + hits.length + " policies writing " + name);
    const max = Number(hits[0].text[0].maxLength || Infinity);
    if (!value[name] || value[name].length > max) throw new Error("the team's " + name + " does not fit the template's box");
    box[name] = hits[0].text[0].id;
    lines.push((POLICY_HIVES[hits[0].p.class] || hits[0].p.class) + "\\" + hits[0].p.key, name + " = " + value[name]);
  }
  const files = { "etiuda.admx": t.admx };
  for (const [lang, text] of Object.entries(t.adml)) {
    let out = text;
    for (const name of POLICY_VALUES) {
      const id = box[name].replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const re = new RegExp('(<textBox refId="' + id + '">[\\s\\S]*?(\\r?\\n[ \\t]*)<label>[\\s\\S]*?</label>)([\\s\\S]*?</textBox>)', "g");
      const found = out.match(re) || [];
      if (found.length !== 1 || found[0].split("<textBox").length !== 2 || /<defaultValue>/.test(found[0]))
        throw new Error("the pinned " + lang + " ADML has no one box for " + name);
      out = out.replace(re, (m, head, indent, tail) => head + indent + "<defaultValue>" + xmlText(value[name]) + "</defaultValue>" + tail);
    }
    files[lang + "/etiuda.adml"] = out;
  }
  return { files, lines: lines.filter((l, i) => lines.indexOf(l) === i) };
}
/** Saves the template, filled for the team this Studio leads at the project's folder, into the folder `out`: etiuda.admx and
 *  <lang>/etiuda.adml, as a PolicyDefinitions folder holds them. */
async function savePolicy(dir, out, keyFile, o) {
  const h = await heldAtProject(dir, keyFile, o);
  if (!h.team) throw noTeamToGive();
  const filled = policyFilled(h.team.lead.public), at = path.resolve(String(out || ""));
  for (const [rel, text] of Object.entries(filled.files)) {
    const file = path.join(at, ...rel.split("/"));
    fs.mkdirSync(path.dirname(file), { recursive: true });
    writeWhole(file, text);
  }
  return { folder: at, files: Object.keys(filled.files) };
}
/** The LeadKey value as text for the clipboard: the registry key the desk reads, then LeadKey. */
async function policyValues(dir, keyFile, o) {
  const h = await heldAtProject(dir, keyFile, o);
  if (!h.team) throw noTeamToGive();
  const eol = process.platform === "win32" ? "\r\n" : "\n";
  return { text: policyFilled(h.team.lead.public).lines.join(eol) + eol };
}

/* The book's rows with the times this Studio recorded, copied so the caller's object is left as it was. A time in `seen`
   is the file's, and it wins over one the caller already held. */
function withSeen(book, seen) {
  const src = book && typeof book === "object" ? book : {};
  const got = seen && typeof seen === "object" ? seen : {};
  const out = {};
  Object.keys(src).forEach((id) => {
    const row = src[id] && typeof src[id] === "object" ? Object.assign({}, src[id]) : src[id];
    if (row && typeof row === "object" && got[id] && typeof got[id] === "object")
      row.seen = Object.assign({}, row.seen || {}, got[id]);
    out[id] = row;
  });
  return out;
}
/* The book again, as `file` holds it now. An id the file no longer calls live keeps the earlier record's team and
   expiry and loses its secret, so inviteState will not call it valid. An id the file does not hold is withdrawn. */
function bookAtWrite(file, teamId, book, now) {
  const fresh = {};
  invitesOf(file, teamId, now).forEach((i) => { fresh[i.id] = i.state; });
  const src = book && typeof book === "object" ? book : {};
  const out = {};
  Object.keys(src).forEach((id) => {
    const st = Object.prototype.hasOwnProperty.call(fresh, id) ? fresh[id] : "";
    if (st === "live") { out[id] = src[id]; return; }
    const prev = src[id] && typeof src[id] === "object" ? src[id] : {};
    const copy = Object.assign({}, prev, { state: st || "withdrawn" });
    delete copy.secret;
    out[id] = copy;
  });
  return out;
}

/* The licence reference a desk's certificate must name: `o.seatRef` where given, else the one this Studio's sign-in kept in the
   shell's licence-service.json beside its settings (`o.userData`), else "" and no desk is let in by its certificate. */
function seatRefOf(o) {
  const ok = (v) => (typeof v === "string" && /^[0-9a-f]{32}$/.test(v) ? v : "");
  if (o.seatRef !== undefined) return ok(o.seatRef);
  if (!o.userData) return "";
  try {
    const s = JSON.parse(fs.readFileSync(path.join(String(o.userData), "licence-service.json"), "utf8"));
    return s && s.by === "signin" ? ok(s.licenceRef) : "";
  } catch { return ""; }
}

/* The people of team `teamId` the lead admitted by code, and those marked removed: `o.people` where given ({team id: {person: {code,
   at, removed?}}}), else the shell's team-people.json beside its settings (`o.userData`), else none. An entry with `removed` is a
   person one of whose desks the lead removed (shell/main.js forgetAdmitted), not let in by any certificate until admitted again. */
function teamPeople(o, teamId) {
  let all = o.people;
  if (all === undefined && o.userData) {
    try { all = JSON.parse(fs.readFileSync(path.join(String(o.userData), "team-people.json"), "utf8")); } catch { all = null; }
  }
  const mine = all && typeof all === "object" && !Array.isArray(all) ? all[String(teamId)] : null;
  const rows = mine && typeof mine === "object" && !Array.isArray(mine) ? Object.entries(mine).filter(([p]) => /^[0-9a-f]{64}$/.test(p)) : [];
  const gone = (v) => !!v && typeof v === "object" && Number.isFinite(v.removed);
  return { admitted: rows.filter(([, v]) => !gone(v)).map(([p]) => p), removed: rows.filter(([, v]) => gone(v)).map(([p]) => p) };
}
function admittedPeople(o, teamId) { return teamPeople(o, teamId).admitted; }

/* When the lead last freed each person's seat on team `teamId` ({person: ms}): `o.seatBooks` where given, else the shell's
   desk-seats.json beside its settings (`o.userData`). A certificate issued then or before seats nobody, as the book reads it. */
function freedPeople(o, teamId) {
  let all = o.seatBooks;
  if (all === undefined && o.userData) {
    try { all = JSON.parse(fs.readFileSync(path.join(String(o.userData), "desk-seats.json"), "utf8")); } catch { all = null; }
  }
  const book = all && typeof all === "object" && !Array.isArray(all) ? all[String(teamId)] : null;
  const desks = book && book.desks && typeof book.desks === "object" ? book.desks : {};
  const out = {};
  for (const e of Object.values(desks)) {
    const f = e && e.freed;
    if (f && typeof f.seat === "string" && Number.isFinite(f.at)) out[f.seat] = Math.max(out[f.seat] || 0, f.at);
  }
  return out;
}

/** The watch's admission, nobody present (src/join.mjs admitWaiting, by the book `o.invites` at `o.now`): every desk asking
 *  to join the team this Studio leads at `folder`, on the relay, whose request proves a live invitation or names a known
 *  person's desk (below). A team kept for a shared folder admits nobody (`reason` "folder"). The team is signed with the key `secret` opens. With
 *  no secret (a key that needs its passphrase) nothing is let in and `needKey` says so; with no team key, `needRecovery`.
 *  Where `o.teamsFile` is this Studio's teams.json, the book is read again at the start of the write and an id that file
 *  no longer calls live is skipped. Answers {folder, team, admitted, skipped, spent, doors, dropDoors, written}, `doors` the
 *  desks let in at a relay team's standing door ({desk, door, box}, for the lead's answer) and `dropDoors` the door requests refused
 *  ({desk, door}, to be dropped at the relay); nothing is written where nobody was let in. */
async function watchAdmit(folder, keyFile, secret, o) {
  const opts = o || {};
  const named = folder ? path.resolve(String(folder)) : null;
  const h = await heldAtFolder(named, keyFile);
  const none = { folder: named, team: null, admitted: [], skipped: [], spent: [], written: null };
  if (!h.team) return Object.assign(none, { reason: h.reason });
  /* A team kept for a shared folder is held, not watched: nothing is written there, the sighting book included (the folder team's removal). */
  if (!(h.team.channel && h.team.channel.kind === "relay")) return Object.assign(none, { reason: "folder" }); /* plant:fh-admit-held */
  const team = { id: h.team.id, epoch: h.team.epoch };
  /* THE TIME THIS STUDIO FIRST SAW each request naming an invitation, written before anyone is let in and before a locked
     key returns, so a later request cannot put itself first by the time it states. */
  const tf = opts && (opts.teamsFile || (opts.userData ? teamsFile(opts.userData) : ""));
  let invites = opts.invites;
  if (tf) invites = withSeen(invites, noteFirstSeen(tf, h.team.id, inviteSightings(h.folder, h.team), opts.now));
  if (!String(secret == null ? "" : secret)) return Object.assign(none, { team, needKey: true });
  const teamKey = teamKeyFor(h.team, keyFile, secret, "", opts.teamKeys);
  if (!teamKey) return Object.assign(none, { team, needRecovery: true });
  const askedFn = (desk) => (typeof opts.asked === "function" ? opts.asked(desk) : (opts.asked && typeof opts.asked === "object" && opts.asked[desk] ? opts.asked[desk] : (typeof opts.teamsFile === "string" && opts.teamsFile ? askedOf(opts.teamsFile, h.team.id, desk) : null)));
  let canAdmit = null;
  if (tf) {
    const tm = studioTeammates(tf, opts);
    let runningCount = tm.count;
    const runningRoster = new Set(tm.rosterDesks);
    const runningInvites = new Set(tm.openInvites);
    canAdmit = (deskId, doc) => {
      if (runningRoster.has(deskId)) return true;
      const invId = doc && doc.invite && typeof doc.invite.id === "string" ? doc.invite.id : null;
      const hasOpenInvite = invId && runningInvites.has(invId);
      if (hasOpenInvite) {
        if (runningCount <= MAX_TEAMMATES) {
          runningInvites.delete(invId);
          runningRoster.add(deskId);
          return true;
        }
        return REFUSAL_TEAMMATES_LIMIT;
      }
      if (runningCount < MAX_TEAMMATES) {
        runningCount++;
        runningRoster.add(deskId);
        return true;
      }
      return REFUSAL_TEAMMATES_LIMIT;
    };
  }
  /* A KNOWN PERSON'S DESK, NOBODY ACTING (board 980, the person's own sign-in; A4 at a relay team's standing door, as A3 was on a folder team
     before its removal): a desk asking to join with no invitation whose seat certificate stands for this Studio's licence and names a person a
     roster desk's certificate names now, or one the lead admitted by code, is let in as automatic joining would let it in. A person
     marked removed is not, whatever another of their desks holds, until the lead admits them again. */
  const ref = seatRefOf(opts);
  let known = null;
  if (ref) {
    const at = opts.now || Date.now();
    /* A seat the lead freed (Free seat) is not known by a certificate issued before the freeing, the roster's or the asking desk's. */
    const freedAt = freedPeople(opts, h.team.id);
    const stands = (got) => got && got.ok === true && !(got.issued <= (freedAt[got.person] || 0)); /* plant:a3-freed */
    const persons = new Set(Object.values(seatsOfRoster(h.folder, h.team, { ref, now: at, revoked: opts.revoked }))
      .filter((x) => stands(x.got)).map((x) => x.got.person));
    /* And a person the lead admitted to this team by code (the Team screen's Admit), its first desk included. */
    const people = teamPeople(opts, h.team.id);
    for (const p of people.admitted) persons.add(p); /* plant:nd20-admitted */
    for (const p of people.removed) persons.delete(p); /* plant:a4-removed */
    /* The seat beside the request (a folder's seat.json), else the one inside it (the relay's door uploads the request alone). */
    known = (desk, doc) => {
      const c = seatHeld(readSeat(h.folder, desk) || seatAsked(h.folder, desk), { desk, deskKey: doc && doc.desk ? String(doc.desk.key || "") : "", ref, now: at, revoked: opts.revoked });
      return stands(c) && persons.has(c.person); /* plant:a3-person */
    };
  }
  let r = admitWaiting(h.folder, h.team, teamKey, invites, opts.now, askedFn, canAdmit, known);
  /* AT THE START OF THE WRITE, not at the load. A withdraw that landed after the shell read the book is in the file
     and not in that object; the id is skipped and the team is not written for it. */
  if (r.admitted.length && typeof opts.teamsFile === "string" && opts.teamsFile)
    r = admitWaiting(h.folder, h.team, teamKey, bookAtWrite(opts.teamsFile, h.team.id, invites, opts.now), opts.now, askedFn, canAdmit, known);
  let written = null;
  if (r.admitted.length) {
    written = (await writeTeam(h.folder, withRecovery(r.team, teamKey, recoveryOf(keyFile, secret)),
      { key: keyFile, passphrase: secret })).team;
  }
  /* A later request naming an invitation already spent is refused in the file of openings the lead signs, so it is listed no more
     and its desk reads its request turned down, in the words a refused invitation already has there. */
  const late = (r.skipped || []).filter((x) => x.why === "spent").map((x) => x.id);
  if (late.length) {
    try {
      const signer = joinsSigner(keyFile, secret);
      const pending = (tf ? inviteSightings(h.folder, written || h.team) : []).filter((s) => late.indexOf(s.desk) >= 0);
      for (const id of late) refuseJoin(h.folder, written || h.team, id, signer); /* plant:spend-refuse-later */
      if (tf && pending.length) noteTried(tf, h.team.id, pending, invites, opts.now);
    } catch (e) { /* the next pass refuses it */ }
  }
  return { folder: named, team, admitted: r.admitted, skipped: r.skipped, spent: r.spent, doors: r.doors || [], dropDoors: r.refused || [],
           written: written ? JSON.parse(JSON.stringify(written)) : null };
}

/** THE DESKS' SEATS, AT THE WATCH (board 980; src/desk-seat.mjs): for the team this Studio leads at `folder`, each roster desk's
 *  desks/<id>/seat.json, read where the verbs read (the share's mirror, or the relay's), its seat certificate checked under the
 *  delegation against `o.ref` (this Studio's licence reference) and the roster's key for that desk (checkSeat, with `o.revoked`).
 *  Where `o.hint` is given (desk-seat.mjs hintFor, null for a lead that did not sign in) and the team file says otherwise, the
 *  team file is signed again with the key `secret` opens, saying it, so a desk already in learns which provider admits it; that is
 *  the one write, and nothing here adds, removes or re-keys a desk: a seat is never the roster's business (Argon 1). Answers
 *  {folder, team: {id, epoch}, opened: {desk id: {key, got}}, hinted}, `got` checkSeat's answer or null where the desk has no
 *  seat.json; {team: null, reason} where no team is held here, and `needKey` where no secret was given. */
async function seatProofs(folder, keyFile, secret, o) {
  const opts = o || {};
  const named = folder ? path.resolve(String(folder)) : null;
  const h = await heldAtFolder(named, keyFile);
  const none = { folder: named, team: null, opened: {}, hinted: false };
  if (!h.team) return Object.assign(none, { reason: h.reason });
  if (!String(secret == null ? "" : secret)) return Object.assign(none, { team: { id: h.team.id, epoch: h.team.epoch }, needKey: true });
  let team = h.team, hinted = false;
  if (opts.hint !== undefined) {
    const want = opts.hint === null ? null : hintOf(opts.hint);
    if (JSON.stringify(team.signin === undefined ? null : team.signin) !== JSON.stringify(want)) { /* plant:s3-hint-write */
      team = (await writeTeam(h.folder, ownRecovery(withSignin(team, want), opts.teamKeys, keyFile, secret),
        { key: keyFile, passphrase: secret })).team;
      hinted = true;
    }
  }
  /* A lead with no licence reference from a sign-in has no certificate to check, so nothing of a desk is read for it. */
  if (!opts.ref) return { folder: named, team: { id: team.id, epoch: team.epoch }, opened: {}, hinted }; /* plant:s3-proofs-floor */
  return { folder: named, team: { id: team.id, epoch: team.epoch }, opened: seatsOfRoster(h.folder, team, opts), hinted };
}

/** Each roster desk's seat certificate at `folder`, checked (desk-seat.mjs checkSeat) against `o.ref`, the roster's key, `o.now`
 *  (the clock where none) and `o.revoked`: {desk id: {key, got}}, `got` null where the desk has no seat.json and its request
 *  carries none (a desk let in at a relay team's door, whose request is still in the mirror). */
function seatsOfRoster(folder, team, o) {
  const opened = {};
  for (const e of team.roster || []) {
    if (!e || !e.desk || !/^k-[0-9a-f]{16}$/.test(String(e.desk.id))) continue;
    const id = String(e.desk.id), key = String(e.desk.key || "");
    const doc = readSeat(folder, id) || seatAsked(folder, id);
    opened[id] = { key, got: !doc ? null : seatHeld(doc, { desk: id, deskKey: key, ref: o.ref, now: o.now || Date.now(), revoked: o.revoked }) };
  }
  return opened;
}
/* checkSeat for one desk's file, a throw read as shape, so one file never faults the judgement of the team's others. */
function seatHeld(doc, o) {
  try { return checkSeat(doc, o); } catch { return { ok: false, why: "shape" }; }
}

/* THE SEALED EDITIONS AT THE EPOCH JUST CLOSING. Only *.ec in the publish folder itself: the archive stays in the clear,
 * and a file sealed for an older epoch is what a member already holds. Among one catalog's files at this epoch, the
 * highest revision is sealed again, and a tie on the edition string is sealed again too, so neither copy of the newest
 * stays readable by the key that is about to leave. A file that will not open refuses the whole removal; with
 * `o.skipUnopened` (resealBehind, which no person is waiting on) it is left out instead, as nothing here could seal it. */
function editionsToReseal(folder, team, teamKeys, targetKey, targetEpoch, o) {
  const lenient = !!(o && o.skipUnopened);
  if (!team || team.sealed !== true) return { plan: [], all: [], unopened: [] };
  const S = Engine.sealRules();
  let entries = [];
  try { entries = fs.readdirSync(folder, { withFileTypes: true }); }
  catch (e) { throw e; }
  const current = [];
  for (const ent of entries) {
    if (!ent.isFile() || !/\.ec$/i.test(ent.name)) continue;
    const at = path.join(folder, ent.name);
    let doc = null, raw = null;
    try { raw = fs.readFileSync(at, "utf8"); doc = JSON.parse(raw.replace(/^\uFEFF/, "")); } catch { doc = null; }
    if (!doc || typeof doc !== "object" || doc.kind !== S.SEALED_KIND || +doc.format !== 2) continue;
    if (String(doc.team) !== String(team.id)) continue;
    const sealedEpoch = Number(doc.epoch);
    if (!Number.isFinite(sealedEpoch) || sealedEpoch > targetEpoch) continue;
    current.push({ at, name: ent.name, doc, sealedEpoch, raw });
  }
  if (!current.length) return { plan: [], all: [], unopened: [] };
  /* A file the lenient pass holds the key of its number for and still cannot open (sealed under a key this Studio set aside, or
     torn) is named in `unopened`, so its caller counts it owed and looks again, never as done. One at a number whose key this
     Studio never held (an older revision on the lead's other computer) is left out as before: nothing here would reseal it, and
     counting it would keep every look of the watch owed for good. */
  const unopened = [];
  const opened = current.map((f) => {
    const key = f.sealedEpoch === targetEpoch ? targetKey
      : (teamKeyOf(teamKeys, team.id, f.sealedEpoch) || (f.sealedEpoch === team.epoch ? targetKey : null));
    if (!key && lenient) return null;
    if (!key) throw refuse("This Studio does not hold the team's current key, so nobody was removed."); /* plant:txrw-rw1-5 */
    let text = null;
    try { text = S.openSealed(key, f.doc); } catch (e) { if (!lenient) throw e; }
    if (text == null && lenient) { unopened.push(f.name); return null; } /* plant:rmo-unopened-owed */
    if (text == null) throw refuse("A file sealed for the team does not open with the key this Studio holds, so nobody was removed.");
    return { at: f.at, name: f.name, text, sealedEpoch: f.sealedEpoch, raw: f.raw };
  }).filter(Boolean);
  const groups = new Map();
  for (const item of opened) {
    let cat = null;
    try { cat = JSON.parse(item.text); } catch { cat = null; }
    /* A file that names no catalog id is grouped by its own name, behind a character no id holds; built, not typed,
       as few-forms' lexer reads string literals with JSON and refuses the escape. */
    const id = cat && typeof cat.id === "string" && cat.id ? cat.id : String.fromCharCode(0) + item.name;
    const rev = cat && Number.isFinite(+cat.rev) ? +cat.rev : 0;
    const edition = cat && cat.edition != null ? String(cat.edition) : "";
    const list = groups.get(id) || [];
    list.push({ at: item.at, name: item.name, text: item.text, rev, edition, sealedEpoch: item.sealedEpoch, raw: item.raw });
    groups.set(id, list);
  }
  const all = [], plan = [];
  /* plant:tr-two-catalogs-reseal */ for (const list of groups.values()) {
    list.sort((a, b) => (b.rev - a.rev) || (a.edition < b.edition ? 1 : a.edition > b.edition ? -1 : 0)
      || (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
    const best = list[0];
    const newest = list.filter((x) => x.rev === best.rev && x.edition === best.edition);
    for (const x of newest) {
      all.push(x);
      if (x.sealedEpoch < targetEpoch) plan.push(x);
    }
  }
  return { plan, all, unopened };
}

/* The team file is written before any edition is sealed again. Once the team file lands, a later failure rolls forward,
   not back: the new team file, its key kept durably, and editions already resealed stay. A failure before the team file
   lands restores as before. An edition whose write is refused does not hold back the ones after it, since each left at
   the old key is one the removed key opens; the first refusal is thrown once the rest are written, and what it left is
   sealed again by resealBehind at the watch's next look (board 974, C2). */
async function sealAfterTeam(folder, team, keyFile, secret, plan, teamKey) {
  const at = teamPath(folder), revsAt = revsFile(keyFile);
  let teamWas = null, revsWas = null;
  try { teamWas = fs.readFileSync(at, "utf8"); }
  catch (e) { if (!e || e.code !== "ENOENT") throw e; }
  try { revsWas = fs.readFileSync(revsAt, "utf8"); }
  catch (e) { if (!e || e.code !== "ENOENT") throw e; }
  let wasEpoch = null;
  try { wasEpoch = JSON.parse(teamWas).epoch; } catch {}
  let written = null, landed = wasEpoch === team.epoch;
  if (landed) {
    try { written = JSON.parse(teamWas); } catch {}
  }
  const undone = [];
  try {
    if (!landed) {
      written = (await writeTeam(folder, team, { key: keyFile, passphrase: secret })).team; /* plant:f7-team-first */
      landed = true;
    }
    const S = Engine.sealRules();
    let refused = null;
    for (const item of plan) {
      try {
        const prev = fs.readFileSync(item.at, "utf8");
        let cur = null;
        try { cur = JSON.parse(prev); } catch {}
        if (cur && cur.kind === S.SEALED_KIND && cur.team === team.id && Number(cur.epoch) === Number(team.epoch)) {
          continue;
        }
        writeWhole(item.at, json(S.sealCatalog(teamKey, team.id, team.epoch, item.text)));
        undone.push({ at: item.at, prev });
      } catch (e) {
        if (!refused) refused = e;
      }
    }
    if (refused) throw refused;
  } catch (e) {
    if (landed) { e.landed = true; throw e; } /* plant:f7-roll-forward */
    for (let i = undone.length - 1; i >= 0; i--) {
      if (undone[i].prev === null) fs.rmSync(undone[i].at, { force: true });
      else writeWhole(undone[i].at, undone[i].prev);
    }
    if (teamWas != null) writeWhole(at, teamWas);
    else { try { fs.rmSync(at, { force: true }); } catch { /* none */ } }
    if (revsWas != null) writeWhole(revsAt, revsWas);
    else { try { fs.rmSync(revsAt, { force: true }); } catch { /* none */ } }
    throw e;
  }
  return { written };
}

/** THE RESEAL A REMOVAL OR A KEY MOVE LEFT UNFINISHED, COMPLETED WITH NO ACT BY THE LEAD (board 974, C2). Once a removal's or a
 *  move's team file has landed, an edition whose reseal was then refused (held open by another program past whole-write's
 *  patience, a share gone away) stays at the key number just closed: the removed desk's key still opens the newest edition,
 *  and a desk admitted since cannot open it. A newer edition this lead's other Studio sealed at the old key number, reaching
 *  this folder after the removal, is the same case. The watch calls this (shell/main.js watchOnce) at start, at each look that
 *  finds the folder changed, which a removal's team file does, and at every look after one that left something owed. The
 *  newest edition of each catalog that this Studio's own team at the folder seals, where it is still at an older key number,
 *  is sealed again at the team file's, as the removal would have sealed it. Nothing is signed, so no passphrase is asked. A
 *  file that does not open with a key held here is left as it is (editionsToReseal's skipUnopened); a file that changed since
 *  it was read is left for the next look, so a newer copy that just landed is never overwritten. `owed` is true where
 *  anything was left, and the watch asks again. A file named in `o.skip` is left alone and not counted as owed (the shell's
 *  resealSkip: the share no longer lists it, or holds its own copy waiting for a key). */
async function resealBehind(folder, keyFile, o) {
  const opts = o || {};
  const named = folder ? path.resolve(String(folder)) : null;
  const h = await heldAtFolder(named, keyFile);
  const none = { folder: named, team: null, resealed: [], owed: false };
  if (!h.team || h.team.sealed !== true) return none;
  const team = { id: h.team.id, epoch: h.team.epoch };
  const key = teamKeyOf(opts.teamKeys, h.team.id, h.team.epoch);
  if (!key) return Object.assign(none, { team, needKey: true, owed: true });
  const behind = editionsToReseal(h.folder, h.team, opts.teamKeys, key, h.team.epoch, { skipUnopened: true }), plan = behind.plan;
  const S = Engine.sealRules(), resealed = [];
  const skip = new Set((Array.isArray(opts.skip) ? opts.skip : []).map(String));
  /* A file that does not open here is owed, not finished: the watch keeps looking (resealOwed) until it opens or goes. */
  let owed = behind.unopened.length > 0;
  for (const item of plan) {
    let left = false;
    left = skip.has(item.name); /* plant:c3-reseal-left */
    if (left) continue;
    try {
      if (fs.readFileSync(item.at, "utf8") !== item.raw) { owed = true; continue; }
      writeWhole(item.at, json(S.sealCatalog(key, h.team.id, h.team.epoch, item.text)));
      resealed.push(item.name);
    } catch { owed = true; }
  }
  return { folder: named, team, resealed: resealed.sort(), owed };
}

/** AN EDITION SEALED UNDER A KEY SET ASIDE (Claude alpha's ruling of 2026-11-23 06:44, the key this Studio made under a number a fork
 *  gave to the other computer's file): each catalog file in `folder` sealed for team `teamId` at key number `epoch` that does not open
 *  with the key that stands there (`newKey`) and does open with the one set aside (`oldKey`) is sealed again under `newKey`, at the same
 *  number, so a member holding only the standing key reads it, and a removal's reseal opens it. A file that opens with neither is left
 *  as it is. {resealed: [names]}. */
function resealAside(folder, teamId, epoch, oldKey, newKey) {
  const S = Engine.sealRules(), named = path.resolve(String(folder || "")), resealed = [];
  const was = oldKey ? Buffer.from(oldKey) : null, now = newKey ? Buffer.from(newKey) : null;
  if (!was || !now || !Number.isSafeInteger(Number(epoch))) return { resealed };
  let entries = [];
  try { entries = fs.readdirSync(named, { withFileTypes: true }); } catch { return { resealed }; }
  for (const ent of entries) {
    if (!ent.isFile() || !/\.ec$/i.test(ent.name)) continue;
    const at = path.join(named, ent.name);
    let raw = null, doc = null;
    try { raw = fs.readFileSync(at, "utf8"); doc = JSON.parse(raw.replace(/^\uFEFF/, "")); } catch { doc = null; }
    if (!doc || doc.kind !== S.SEALED_KIND || +doc.format !== 2 || String(doc.team) !== String(teamId) || Number(doc.epoch) !== Number(epoch)) continue;
    let opensNow = null, text = null;
    try { opensNow = S.openSealed(now, doc); } catch { opensNow = null; }
    if (opensNow != null) continue;
    try { text = S.openSealed(was, doc); } catch { text = null; }
    if (text == null) continue;
    try {
      if (fs.readFileSync(at, "utf8") !== raw) continue;
      writeWhole(at, json(S.sealCatalog(now, String(teamId), Number(epoch), text))); /* plant:rmo-reseal-aside */
      resealed.push(ent.name);
    } catch { /* left as it was; the next pass that sets the key aside finds it again */ }
  }
  return { resealed: resealed.sort() };
}

/** Moves the team at the project's folder to a new key and removes nobody. The newest sealed edition of each catalog at
 *  the epoch just closed is sealed again under the new key, as a removal does, and the team file is written before any
 *  of those editions. Nothing is written unless `o.confirm`
 *  is true. Where `o.nextKey` is given it is the new epoch's key, already kept for `o.nextEpoch`. `teamKey` in the
 *  answer is for the shell to keep, and to strip before the page sees it. This does not end an invitation: the caller
 *  has already marked the one it is cancelling. */
async function moveEpoch(dir, keyFile, teamId, secret, o) {
  const opts = o || {};
  if (opts.confirm !== true) {
    let facts = {};
    try { facts = await desksFor(dir, keyFile, opts); } catch { facts = {}; }
    const said = refuse("The team was not moved to a new key, as the move was not confirmed.");
    return Object.assign(facts, { moved: false, refused: "not confirmed", said: said.said });
  }
  const h = await heldAtProject(dir, keyFile, opts);
  if (!h.team) throw refuse("there is no team here led from this Studio, so there was no team to move to a new key");
  if (String(h.team.id) !== String(teamId || ""))
    throw refuse("This folder holds a different team, so it was not moved to a new key.");
  if (!String(secret == null ? "" : secret)) throw notOpened();
  const handed = opts.nextKey == null ? null : Buffer.from(opts.nextKey);
  if (handed && handed.length !== 32)
    throw new Error("the new team key kept for this move is not 32 bytes long, so nothing was written");
  const completing = opts.nextEpoch != null && Number(opts.nextEpoch) === h.team.epoch;
  if (handed && Number(opts.nextEpoch) !== h.team.epoch + 1 && !completing)
    throw new Error("the new team key kept for this move is for key number " + opts.nextEpoch
      + ", and this team is at key number " + h.team.epoch + ", so nothing was written");
  const targetEpoch = completing ? h.team.epoch : h.team.epoch + 1;
  const targetKey = handed || teamKeyOf(opts.teamKeys, h.team.id, targetEpoch);
  let next = null;
  if (completing) {
    if (!targetKey) throw new Error("no team key held for key number " + targetEpoch);
    next = { team: h.team, teamKey: targetKey };
  } else {
    next = await newEpoch(h.team, Object.assign({ key: keyFile, secret }, targetKey ? { teamKey: targetKey } : {}));
  }
  const reseal = editionsToReseal(h.folder, next.team, opts.teamKeys, next.teamKey, next.team.epoch);
  const written = (await sealAfterTeam(h.folder, next.team, keyFile, secret, reseal.plan, next.teamKey)).written;
  const triedFile = opts.teamsFile || (opts.userData ? teamsFile(opts.userData) : "");
  if (triedFile) clearTried(triedFile, h.team.id); /* plant:seen-clear */
  return Object.assign(await desksFor(dir, keyFile, opts), {
    moved: true,
    written: written ? JSON.parse(JSON.stringify(written)) : null,
    teamKey: next.teamKey,
    resealed: reseal.all.map((p) => p.name).sort(),
    epoch: next.team.epoch,
  });
}

/* A removal whose team file has landed, and whose reseal was then refused (board 978). The teammate is already
   removed. {FILE} is the catalog still owed, and resealBehind finishes it at the next look. */
const REMOVAL_RESEAL_OWED = "{NAME} is off the team. One catalog, {FILE}, has not yet been sealed again for the team as it now stands. Studio tries again each time it checks the team's folder, and at its next start, so it finishes by itself while Studio is open.";

/** Takes `memberId` off the team at the project's folder, forward only. A new epoch and a new team key, wrapped again
 *  for every admitted member who remains (a named desk with no wrap is left unwrapped, as a new epoch already does, so
 *  a removal does not hand the key to a desk that was never admitted), and the newest sealed edition of each catalog
 *  at the epoch just closed sealed again under the new key. The team file is written before any of those editions. The
 *  member's own request to join, where it is still on the share, is marked as a removed member's old request (src/join.mjs
 *  closeRequest), so the Desks screen does not list the
 *  desk as asking again. Nothing is written unless `o.confirm` is true. A write that fails before the team file lands
 *  puts back every file written before it, the invitation and its secret included. Once that file has landed, the
 *  removal stands: its record is kept, and a reseal still owed is finished by resealBehind. Where `o.nextKey` is given it is the new epoch's key,
 *  already kept for `o.nextEpoch`, and a removal makes its own only where none was handed in. `teamKey` in the answer
 *  is for the shell to keep, and to strip before the page sees it. */
async function removeMember(dir, keyFile, teamId, memberId, secret, o) {
  const opts = o || {};
  if (opts.confirm !== true) {
    let facts = {};
    try { facts = await desksFor(dir, keyFile, opts); } catch { facts = {}; }
    const said = refuse("Nobody was removed, as the removal was not confirmed.");
    return Object.assign(facts, { removed: false, refused: "not confirmed", said: said.said });
  }
  const h = await heldAtProject(dir, keyFile, opts);
  if (!h.team) throw refuse("there is no team here led from this Studio, so there is nobody to remove");
  if (String(h.team.id) !== String(teamId || ""))
    throw refuse("This folder holds a different team, so nobody was removed.");
  const member = String(memberId || "");
  const onRoster = h.team.roster.some((e) => e && e.desk && e.desk.id === member);
  const completing = opts.nextEpoch != null && Number(opts.nextEpoch) === h.team.epoch;
  if (!onRoster && !completing)
    throw refuse("This member is not on the team's list, so nothing changed.");
  if (!String(secret == null ? "" : secret)) throw notOpened();
  const leaving = h.team.roster.find((e) => e && e.desk && e.desk.id === member);
  const endedInvite = leaving && /^[0-9a-f]{16}$/.test(String(leaving.invite || "")) ? String(leaving.invite) : "";
  /* A caller that names no teamsFile cannot end that invitation, and the entry it drops would let the same secret in
     again, so it is the caller's fault, thrown before anything is written. A plain Error, as no person can act on it. */
  if (endedInvite && !(typeof opts.teamsFile === "string" && opts.teamsFile))
    throw new Error("removeMember: " + member + " came in by invitation " + endedInvite
      + ", and no teamsFile was named to end it in, so nothing was written");
  /* The shell keeps this key before it asks, and a stop after the share moves must still open with it. A removal
     this module runs on its own makes the key here, as it always did. */
  const handed = opts.nextKey == null ? null : Buffer.from(opts.nextKey);
  if (handed && handed.length !== 32)
    throw new Error("removeMember: the key kept for this removal is 32 bytes; nothing was written");
  if (handed && Number(opts.nextEpoch) !== h.team.epoch + 1 && !completing)
    throw new Error("removeMember: the key kept for this removal is for number " + opts.nextEpoch
      + ", and this team is at " + h.team.epoch + ", so nothing was written");
  const targetEpoch = completing ? h.team.epoch : h.team.epoch + 1;
  const targetKey = handed || teamKeyOf(opts.teamKeys, h.team.id, targetEpoch);
  let next = null;
  if (completing) {
    if (!targetKey) throw new Error("no team key held for key number " + targetEpoch);
    next = { team: h.team, teamKey: targetKey };
  } else {
    next = await newEpoch(h.team, Object.assign({ key: keyFile, remove: member, secret }, targetKey ? { teamKey: targetKey } : {}));
  }
  const reseal = editionsToReseal(h.folder, next.team, opts.teamKeys, next.teamKey, next.team.epoch);
  const signer = completing ? null : joinsSigner(keyFile, secret);
  const undone = [];
  let written = null, inviteWas = null;
  try {
    if (!completing) {
      const mark = closeRequest(h.folder, h.team, member, signer);
      if (mark) undone.push(mark);
      /* The invitation ends, and on the relay every invitation that let this desk in is let go, before the team file is
         written: a stop between them cannot let that secret onto the new epoch, and the lead's channel seals no team file
         from this one on under an invitation's key (N1 of the slice 1 review). A write that fails puts the teams file back
         as it was read here, the secret and the invitations' marks with the other files. */
      if (typeof opts.teamsFile === "string" && opts.teamsFile) {
        try { inviteWas = fs.readFileSync(opts.teamsFile); } catch { inviteWas = null; }
        if (endedInvite) endInvite(opts.teamsFile, h.team.id, endedInvite, "spent", member);
        for (const i of relayInvitesOf(opts.teamsFile, null, h.team.id))
          if (!i.gone && (i.id === endedInvite || i.desk === member)) markRelayInvite(opts.teamsFile, h.team.id, i.id, { gone: true }); /* plant:rs-remove-gone */
      }
    }
    written = (await sealAfterTeam(h.folder, next.team, keyFile, secret, reseal.plan, next.teamKey)).written;
  } catch (e) {
    if (!e || !e.landed) {
      for (let i = undone.length - 1; i >= 0; i--) {
        if (undone[i].prev === null) fs.rmSync(undone[i].at, { force: true });
        else writeWhole(undone[i].at, undone[i].prev);
      }
      if (inviteWas != null) writeWhole(opts.teamsFile, inviteWas.toString("utf8"));
      throw e;
    }
    /* The team file has landed, so the member is off the roster whatever the reseal did. The error keeps the disk's
       own message (EBUSY, and the path of the file). The sentence and the file's name ride beside it, and the record
       is written here so a caller that does not load the shell still has it. The shell writes the same record again,
       which keeps the first one. */
    const file = path.basename(String(e.path || ""));
    const shown = (leaving && leaving.desk && (rosterName(h.team, member) || String(leaving.desk.name || ""))) || member;
    e.resealOwed = file;
    e.said = refusalOf(REMOVAL_RESEAL_OWED, { NAME: shown, FILE: file }).said;
    e.removed = member;
    e.removedDesk = leaving && leaving.desk ? { id: member, key: String(leaving.desk.key || "") } : { id: member, key: "" };
    e.removedFiles = deskSnapshot(h.folder, member);
    e.removedAt = Date.now();
    e.epoch = next.team.epoch;
    e.team = { id: h.team.id, epoch: next.team.epoch };
    e.folder = h.folder;
    e.teamKey = next.teamKey;
    if (endedInvite) e.endedInvite = endedInvite;
    try { e.written = JSON.parse(fs.readFileSync(teamPath(h.folder), "utf8")); } catch { e.written = null; }
    if (typeof opts.teamsFile === "string" && opts.teamsFile && /^[0-9a-f]{64}$/.test(String(e.removedDesk.key))) {
      try { markRemoved(opts.teamsFile, h.team.id, e.removedDesk, e.removedAt, next.team.epoch, e.removedFiles); }
      catch { /* the shell records the same removal where this write did not land */ }
    }
    throw e;
  }
  return Object.assign(await desksFor(dir, keyFile, opts), {
    removed: member,
    /* The removed desk's key and what its folder holds, for the shell to keep as its record (board 900, F2). */
    removedDesk: leaving && leaving.desk ? { id: member, key: String(leaving.desk.key || "") } : { id: member, key: "" },
    removedFiles: deskSnapshot(h.folder, member),
    removedAt: Date.now(),
    written: written ? JSON.parse(JSON.stringify(written)) : null,
    teamKey: next.teamKey,
    resealed: reseal.all.map((p) => p.name).sort(),
    epoch: next.team.epoch,
  }, endedInvite ? { endedInvite } : {});
}

/** Land a desk's catalog as a NEW project, whole: the document the desk answered with is the draft, through the door
 *  Studio already opens a desk's own file by (upgradeLand, with asNewCatalog's fork). Every field the document carries
 *  comes with it, including any a newer engine adds, because nothing is rebuilt: no second writer of the format and no
 *  table in between, which lost the variables, the greetings, the comment language and every card flag (Claude alpha's
 *  ruling of 2026-10-14 18:26 on "either to inspect or adopt", Maxim 2026-10-13 16:04).
 *
 *  WHAT IS NEW, and only this: one id is one catalog, so the copy gets a new id at no edition (rev 0); it keeps no `grew` (it starts its own
 *  lineage, so the team that lists it reads it listed); the desk's block, its signature, the `modified` mark and the edition date describe the
 *  desk's file and stay with it; the hash is the copy's own. The document is written to Studio's own temporary folder
 *  (never the share) and read by the pinned engine's loader there before anything is written to the projects folder,
 *  so a file a desk would refuse is refused here too, with nothing written.
 *
 *  THE PROJECT'S NAME (sense pass finding 21, the pivot plan's item 13): the title the desk's in-use file gives the catalog
 *  (`o.title`), else the catalog's own name, else "<desk name>'s catalog" in the language the lead reads Studio in
 *  (`o.desk`, `o.lang`); a project already under that name takes the next number, as the band's "+" does. The first
 *  publish suggests its file name from the same name, never from the temporary file's. */
const LANDED_NAME = {
  en: { desk: "{DESK}'s catalog", none: "A desk's catalog" },
  pl: { desk: "Katalog ze stanowiska {DESK}", none: "Katalog ze stanowiska" },
};
/** Text fit for a name: no control character and no bidirectional override or isolate (U+202A to U+202E, U+2066 to
 *  U+2069), trimmed, and at most 120 characters counted by code point, so a character outside the basic plane is never
 *  cut in half (the test architect's condition 4 on 27a7110). A name of dots and spaces alone names nothing. */
const BIDI = (c) => (c >= 0x202a && c <= 0x202e) || (c >= 0x2066 && c <= 0x2069);
function nameText(v) {
  if (typeof v !== "string") return "";
  const kept = Array.from(v).filter((ch) => { const c = ch.codePointAt(0); return c >= 32 && c !== 127 && !BIDI(c); }).join("").trim(); /* plant:txin-in7-2 */
  const cut = Array.from(kept).slice(0, 120).join("").trim(); /* plant:txin-in7 */
  return /^[.\s]*$/.test(cut) ? "" : cut; /* plant:txin-in7-3 */
}
/* A COPY THAT CAME BACK AND DOES NOT OPEN AS A CATALOG (board 899): the pinned loader, or the reading Studio opens a
   desk's file by, refuses it. The Error carries `unopened`, so the shell can record that the desk answered and the row can
   say so, with the loader's reason as a frame where src/lint-said.mjs has one and it carries no card's words; a reason it
   cannot frame, or that would carry a card's words to the page, is left out and the row says the rest. */
const CARD_WORDS = ["LINE", "TITLE", "WORDS", "CLAUSE", "FIRST", "VALUE", "ENTRY", "NEAR", "TOKEN"];
function wordsFree(said) {
  return !!said && Object.keys(said.vars || {}).every((k) => CARD_WORDS.indexOf(k) < 0
    && !(said.vars[k] && typeof said.vars[k] === "object" && said.vars[k].frame && !wordsFree(said.vars[k])));
}
function unopenedCopy(reason, said) {
  const line = String(reason || "").replace(/ \(and \d+ more\)$/, "");
  const framed = said || (line ? lintSaid(line) : null);
  /* The message reaches the shell's log, so it carries the loader's line only where the row may show it too (the test
     architect's condition 2 on 27a7110). */
  const clean = !!framed && wordsFree(framed);
  const e = new Error("the copy the desk answered with does not open as a catalog" + (line && clean ? ": " + line : "")); /* plant:txau-clean */
  e.unopened = { why: clean ? framed : null };
  return e;
}
function landedName(catalog, o) {
  const opts = o || {};
  const own = nameText(opts.title) || nameText(catalog && catalog.name); /* plant:txin-in1-2 */
  if (own) return own;
  const words = LANDED_NAME[opts.lang] || LANDED_NAME.en, desk = nameText(opts.desk); /* plant:txin-in3 */
  return desk ? words.desk.replace("{DESK}", desk) : words.none;
}
/* The copy landCopy writes under `tempDir` is a customer's catalog in the clear, so it goes once read, landed or refused, and
   the folder with it when nothing else is in it. */
async function landCatalog(root, catalog, tempDir, o) {
  const dir = path.resolve(String(tempDir || ""));
  const had = new Set(fs.existsSync(dir) ? fs.readdirSync(dir) : []);
  try { return await landCopy(root, catalog, tempDir, o); }
  finally {
    for (const name of fs.existsSync(dir) ? fs.readdirSync(dir) : []) {
      if (!had.has(name) && /^brought-[0-9a-f]{8}\.ec$/.test(name)) fs.rmSync(path.join(dir, name), { force: true }); /* plant:brought-gone */
    }
    try { fs.rmdirSync(dir); } catch { /* not empty, or gone */ }
  }
}
async function landCopy(root, catalog, tempDir, o) {
  const cards = Array.isArray(catalog && catalog.cards) ? catalog.cards : [];
  if (!cards.length) throw unopenedCopy("", { frame: "it holds no card", vars: {} });
  const F = await Engine.format();
  const name = "brought-" + crypto.randomBytes(4).toString("hex");
  const at = path.join(path.resolve(String(tempDir || "")), name + ".ec");
  fs.mkdirSync(path.dirname(at), { recursive: true });
  fs.writeFileSync(at, json(asNewCatalog(catalog, F, Engine.deskRules())), "utf8"); /* plant:txcu-890si */
  let read = null;
  try { read = await upgradeOf(at); } catch (e) { if (e && e.said) throw unopenedCopy(""); throw e; }
  const why = read.problems[0] || read.differs[0] || "";
  if (why) throw unopenedCopy(why); /* plant:txau-throw */
  const base = landedName(catalog, o);
  let named = base;
  for (let n = 2; n < 100 && fs.existsSync(projectDir(root, Engine.fileStem()(named))); n++) named = base + " " + n; /* plant:txin-in2 */
  return upgradeLand(root, at, named, { displayName: named, fileNameFrom: base, adoptedFrom: adoptedFromOf(catalog) }); /* plant:txin-in1 */
}

/* ---- A MODEL'S DRAFTS (board 992, stage 4; src/model-drafts.mjs says what goes and where a draft waits) ---------------- */

/** What a drafting job sends, read off the working copy at `dir` (src/model-drafts.mjs jobParts). */
async function modelJobParts(dir, job, o) {
  const home = path.resolve(String(dir || ""));
  const found = projectAt(home);
  if (!found) throw refuse("no catalog in {DIR}", { DIR: home });
  const draft = readOrRefuse(path.join(home, found.draftName));
  if (String(job) === "import") return importParts(draft, o || {});
  return Drafts.jobParts(draft, String(job), o || {});
}
/* WHAT BRINGING IN OLD REPLIES SENDS (board 992, job 1): the text the lead pasted, or the text of the file they chose ("card",
   which the shell has checked is that choice), its line endings settled as src/import-text.mjs settles them, so what the
   line counts is what goes; and the names of the project's categories and intents, which importText puts in its instruction
   so that a reply is filed where the catalog already files it. A workbook is not text and is refused ("file"), as is a text
   with nothing in it ("empty"). Nothing of the catalog's cards is read into it. */
const AI_IMPORT_MAX = 200000;
const AI_IMPORT_PIECE = 20000;
function importParts(draft, o) {
  let buf = null, file = "";
  if (o.card) {
    file = path.resolve(String(o.card));
    try { buf = fs.readFileSync(file); } catch { return { refused: "file" }; }
    if (looksLikeZip(buf)) return { refused: "file" };
  } else buf = Buffer.from(String(o.text == null ? "" : o.text), "utf8");
  const text = decode(buf).text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  if (!text.trim()) return { refused: "empty" };
  if (text.length > AI_IMPORT_MAX) return { refused: "ceiling", chars: text.length, max: AI_IMPORT_MAX };
  const langs = Drafts.langsOf(draft);
  const parts = importPieceCount(text, AI_IMPORT_PIECE);
  return { job: "import", text, file: file ? path.basename(file) : "", known: knownFiling(draft, langs[0] || ""),
    texts: [text], chars: text.length, parts, examples: [], category: "" };
}
/* An import's proposal is named for what made it, so the inbox says so and a second one takes the next number. */
const MODEL_IMPORT = "model-import";
const MODEL_IMPORT_NAME = /^model-import(?:-[0-9]+)?\.ec$/;
/** The model's import of old replies, into the project's inbox beside its report (src/import-text.mjs writeTextImport, the one
 *  writer of a text import): {file, name}. */
async function modelImportKeep(dir, catalog, report) {
  const home = path.resolve(String(dir || ""));
  if (!projectAt(home)) throw refuse("no catalog in {DIR}", { DIR: home });
  const inbox = path.join(home, INBOX);
  let name = MODEL_IMPORT + ".ec";
  for (let n = 2; fs.existsSync(path.join(inbox, name)); n++) name = MODEL_IMPORT + "-" + n + ".ec";
  const w = writeTextImport(inbox, name, catalog, report);
  return { file: w.at, name };
}
/** The drafts waiting in the project at `dir`. */
async function modelDrafts(dir) { return { drafts: Drafts.draftsRead(path.resolve(String(dir || ""))) }; }
/** A model's answer kept as a draft; the working copy is not touched. */
async function modelDraftKeep(dir, draft) { return { draft: Drafts.draftKeep(path.resolve(String(dir || "")), draft) }; }
/** Discard: the draft goes and the card stays as it was. */
async function modelDraftDiscard(dir, id) {
  const home = path.resolve(String(dir || ""));
  /* An import the lead cancelled before its answer came is taken back out of the inbox, unseen: "import:<name>", only a file of
     the model import's own name whose report says a model wrote it. */
  const asked = String(id || "");
  if (asked.indexOf("import:") === 0) {
    const name = asked.slice("import:".length), at = path.join(home, INBOX, name), beside = at.replace(/\.ec$/, ".lint.json");
    let rep = null;
    try { rep = MODEL_IMPORT_NAME.test(name) ? JSON.parse(fs.readFileSync(beside, "utf8")) : null; } catch { rep = null; }
    const ours = !!(rep && rep.model && typeof rep.model === "object");
    if (ours) { fs.unlinkSync(at); fs.unlinkSync(beside); }
    return { discarded: ours, drafts: Drafts.draftsRead(home) };
  }
  return { discarded: Drafts.draftDrop(home, id), drafts: Drafts.draftsRead(home) };
}
/* ACCEPT MAKES IT CATALOG CONTENT, as the lead left it. `edit` is the fields as the lead holds them in the card or the New
   card cover ({title, body} by language, and for a new card {shelf, requests}); a field the lead did not touch is the
   model's. A language draft fills that language's title where the card has none, and its body; a new card is made by
   addCard in the category chosen, its other languages and its intents set after. The decision goes into the review log
   (src/review.mjs recordAccepted) naming the model and the service, edited or not, so the audit pack says who accepted
   what a model wrote. A refusal (a category gone, a card deleted meanwhile) keeps the draft. */
async function modelDraftAccept(dir, id, edit) {
  const home = path.resolve(String(dir || ""));
  const d = Drafts.draftFind(home, id);
  /* The copywriter's words (words-992-own-ai-2026-11-11.md, "Accepting a model's draft"), this refusal and the empty text's below. */
  if (!d) throw refuse("the draft is no longer waiting, so nothing was accepted");
  /* The shell hands the fields as lists of strings (shell/main.js studio:ai-draft-accept): the languages, a title and a body
     for each, the category ("" for the model's) and the intents. Each is read below by its type. */
  const got = edit && typeof edit === "object" ? edit : {};
  const ls = Array.isArray(got.langs) ? got.langs.map(String) : [];
  const e = { title: {}, body: {} };
  ls.forEach((l, i) => {
    if (Array.isArray(got.titles) && typeof got.titles[i] === "string") e.title[l] = got.titles[i];
    if (Array.isArray(got.bodies) && typeof got.bodies[i] === "string") e.body[l] = got.bodies[i];
  });
  if (typeof got.shelf === "string" && got.shelf) e.shelf = got.shelf;
  if (Array.isArray(got.requests) && d.job === "situation") e.requests = got.requests.map(String);
  const f = d.fields || {};
  const pick = (k, l) => { const v = e[k] && typeof e[k] === "object" ? e[k][l] : undefined; return typeof v === "string" ? v : String(((f[k] || {})[l]) || ""); };
  let edited = false, keys = [], out = null;
  if (d.job === "language") {
    const l = String(d.lang), title = pick("title", l), body = pick("body", l);
    edited = title !== String((f.title || {})[l] || "") || body !== String((f.body || {})[l] || "");
    if (!body.trim()) throw refuse("the draft's text is empty, so nothing was accepted");
    const patch = { body: { [l]: body } };
    const draft = readOrRefuse(path.join(home, projectAt(home).draftName));
    const card = (draft.cards || []).find(c => c.id === d.card);
    /* A CARD THAT TOOK STEPS OR ALTERNATIVES SINCE THE DRAFT WAS ASKED FOR (Argon's finding 7 of the 992 review): its body is
       the replies block's, which a drafted text cannot fill, so the draft is refused and waits for Discard. */
    if (card && Drafts.shapedCard(card)) throw refuse("the card now holds steps or alternatives, and a draft is a single text, so nothing was accepted");
    if (card && !String((card.title || {})[l] || "").trim() && title.trim()) patch.title = { [l]: title };
    out = await saveCard(home, d.card, patch);
    keys = Object.keys(patch).map(k => "card:" + d.card + ":" + k + "." + l);
  } else {
    const draft = readOrRefuse(path.join(home, projectAt(home).draftName));
    const langs = Drafts.langsOf(draft), primary = langs[0] || "en";
    const shelf = typeof e.shelf === "string" ? e.shelf : String(f.shelf || "");
    const requests = Array.isArray(e.requests) ? e.requests.map(String) : (Array.isArray(f.requests) ? f.requests.map(String) : []);
    edited = shelf !== String(f.shelf || "") || requests.join("|") !== (f.requests || []).join("|")
      || langs.some(l => pick("title", l) !== String((f.title || {})[l] || "") || pick("body", l) !== String((f.body || {})[l] || ""));
    /* One write, so one change and one Undo (addCard's `more`). */
    const title = {}, body = {};
    langs.slice(1).forEach(l => { if (pick("title", l).trim()) title[l] = pick("title", l); if (pick("body", l).trim()) body[l] = pick("body", l); });
    const made = await addCard(home, shelf, pick("title", primary), pick("body", primary), "", { title, body, requests });
    const cid = made.card.id;
    keys = ["card+:" + cid];
    out = Object.assign({}, made, { made: cid });
  }
  /* The copywriter's record, "Drafted by the model {MODEL} at {SERVICE}, {EDITED}", in the log's English: who accepted it and
     when are the log's own `by` and `at`, as for every decision. */
  const from = "Drafted by the model " + String(d.model || "") + " at " + String(d.service || "") + (d.host ? " (" + d.host + ")" : "");
  recordAccepted(home, keys, from, edited ? "edited before accepting" : "not edited", "model draft " + d.id);
  Drafts.draftDrop(home, d.id);
  return Object.assign({}, out, { accepted: d.id, edited, drafts: Drafts.draftsRead(home) });
}

export { listProjects, openProject, newProject, discardUntouched, saveCard, setPublishFolder, bringKind, folderCheck, cloudOf, teamFacts, setTeamSealed, startRelayTeam, chooseTeam, leaveTeam, undoRelayTeam, letGoTeam, handoverTeam, lintProject, rootFor,
         keptTabs, openTabs, signingKey, defaultKeyFile, defaultLicenceFile,
         publishPlan, publishProject, countsOf, findings, importPlan, importLand, writePaste, landCatalog,
         setStatsSpan, statsFor, exportStatsBook,
         listProposals, openProposal, decideProposal, revertProposalMarks,
         flagsWaiting, flagKeep, flagsAnswered,
         marksShown, INBOX, DECIDED, proposalName,
         addTag, renameTag, saveTag, moveTag, deleteTag, cardsUsing,
         addCard, duplicateCard, deleteCard, undoDelete, retireCard, restoreCard,
         findPlaces, replacePlaces, retireCards, moveCards, deleteCards, undoBulk, exportCards, commitCards, dismissMany, changesCount, changesSince, undoChange,
         sheetPlan, sheetLand,
         cardHistory, restoreText, diffCardEditions,
         upgradePlan, upgradeLand, saveFacts, saveVariables,
         archiveTimeline, diffEditions, exportEdition, restoreEdition, renameProject, changeFileName,
         addLang, moveLang, removeLang, setCommentLang, langState, langUses,
         builtLangs, agreementText, MIN_ENGINE,
         auditEdition, exportAuditPack,
         desksFor, refuseDeskJoin, removeMember, moveEpoch, moveEpoch as moveTeamKey, resealBehind, resealAside, setTeamExports, setTeamSharing, teamKeyBack, teamKeyFromFile,
         inviteTarget, watchAdmit, seatProofs, savePolicy, policyValues,
         backupKey, readBackup, openBackup,
         dismissLikely, dismissPair, dismissEnd, leaveFinding, dismissChangedNumber, alsoOf,
         readAllTeams, makeLinkedCopy, linkedState, bringUpToOriginal, takeBase, endLedTeam,
         modelJobParts, modelDrafts, modelDraftKeep, modelDraftDiscard, modelDraftAccept, modelImportKeep };
