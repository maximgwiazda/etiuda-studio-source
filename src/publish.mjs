/* PUBLISH: VALIDATE, BUMP, STAMP, WRITE, ARCHIVE. Course node 7, spec 3.2 and 3.4.
 *
 *     import { publish } from "./src/publish.mjs";
 *     await publish({ csv, folder });                  // what tests/round-trip.mjs calls
 *     await publish({ project, notes, override, now }); // what tools/publish.mjs calls
 *
 * THE TWO SHAPES ARE ONE ACT. The gate hands in a CSV and a folder and wants one unsigned .ec
 * in that folder; a person hands in a project folder and wants the same file plus an archive
 * they can roll back from. Making these two code paths would make the thing the gate proves
 * different from the thing Maxim runs, which is the oldest way to have a green gate over a
 * broken product. So the CSV shape imports into a project held in memory and then does exactly
 * what the project shape does, archive included.
 *
 * REFUSAL IS THE DEFAULT AND THE OVERRIDE IS RECORDED. A lint error means the engine would
 * refuse the file or a desk would show something wrong; publishing over that takes an explicit
 * note, the note goes into the archive beside the catalog, and the release notes say on their
 * face that this revision was published over N errors. A LANGUAGE AWAITING TEXT IS NOT SUCH AN
 * ERROR since board 510 (Maxim, 2026-09-18): it publishes untouched and is counted per language
 * on the cover and in the notes, which is the difference between an unfinished catalog and a
 * broken one. A quality floor nobody can cross is not
 * a floor, it is a wall, and authors route around walls; a floor with a signed step over it is
 * a floor that holds.
 *
 * DETERMINISM, which Clement's gate expects and which is easy to lose by accident. The same
 * project published twice with the same clock gives the same bytes. Three things had to be
 * arranged for that: the edition comes from the clock the caller passes rather than from
 * `new Date()`; nothing written carries a timestamp, a duration, a path of this machine or a
 * run id; and the release notes are generated from the diff rather than from the order a
 * directory listing happened to come back in, so every list is sorted by id. The one thing that
 * is NOT deterministic across two publishes of the same project is `rev`, and that is the
 * point of rev: the second publish is a different revision.
 *
 * SIGNING IS LAST AND IS OPTIONAL, since board 605 (Maxim, 2026-09-19 21:37). With a key file
 * and its passphrase the finished payload is signed and the `.ec` carries `sig`; with neither
 * it goes out unsigned exactly as it always did, and the release notes say which on their face.
 * The ORDER is the engine's writer's: `hash` is computed first and over everything but itself,
 * then the signature is taken over the finished document with its own value absent, so signing
 * cannot move the hash and a desk checking one is not checking the other. Nothing between the
 * signature and the write may touch the document, which is why the two writes below - the
 * published file and the archived copy - are handed the same object.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as Engine from "./engine.mjs";
import { importCsv, awaitingOver } from "./import.mjs";
import { unknownTokens, tokensMet, untold } from "./placeholders.mjs";
import { readKeyFile, unlockKey, signCatalog, verifySignature } from "./sign.mjs";
/* The ring: which key a desk should trust for this catalog. Written beside the .ec at publish
   and nowhere else, because the binding is to a catalog id and this is where the id is settled. */
import { entryFor, addToRing, ringPath } from "./ring.mjs";
import { diffCatalogs, diffLines, summary } from "./diff.mjs";
/* The review queue's own file and its own key, read here and written nowhere else: src/review.mjs
   holds the log's shape, and this file holds the archive's. The import goes one way - review.mjs
   reaches this file only through a dynamic import inside a function - so there is no cycle. */
import { acceptancesSince, markPublished, parseKey, teamKeyOf,
         ACCOUNT_STATEMENT } from "./review.mjs";
import { readTeam, heldTeam, conflictSiblingName } from "./team.mjs";
import { clearKeyPending, teamsFile, teamForFolder, relayTeams, keptTeam } from "./team-store.mjs";
/* THE REFUSALS A PERSON MEETS AT A SCREEN GO THROUGH refuse(), which keeps the English as
   the Error's message and carries the frame and its variables beside it so the page can say
   the same thing in Polish (board 523, src/refusal.mjs). A plain `throw new Error` below
   names a flag or reports a fault in this program, and stays English on purpose. */
import { refuse } from "./refusal.mjs";
import { minEngineFor } from "./engine-floor.mjs";
import { CHANGES_FILE, datesFor, datesIntoDraft } from "./dated.mjs";
import { readJson, jsonText as json } from "./plain-json.mjs";
import { answeredForCatalog, commitPublishedFlags } from "./flags.mjs";
import { writeWhole, renamePatiently } from "./whole-write.cjs";
import { licenceState, readLicenceFile, defaultLicenceFile, packagedAt, TRIAL_PAUSED, clockFor } from "./licence.mjs";
import { checkOwnSeat } from "./desk-seat.mjs";
/* An installed Studio takes its licence file from the caller or its own folder, never the environment. */
const INSTALLED = packagedAt(path.dirname(fileURLToPath(import.meta.url)));
/** The licence file a publish acts on: the caller's, else a development tree's variable, else the one in o.userData. */
const licenceFileFor = (o) => o.licenceFile
  || (INSTALLED ? "" : process.env.STUDIO_LICENSE_FILE || process.env.STUDIO_LICENCE_FILE || "")
  || (o.userData ? defaultLicenceFile(o.userData) : null);

/**
 * WHETHER THIS STUDIO'S OWN SEAT CERTIFICATE HOLDS (review xi; Max, 2026-11-22 15:37: Studio's gate rests on the sign-in's seat
 * certificate alone): `o.seat`, the certificate the shell holds, for the public half of `o.leadKey`, on the clock licenceState reads by
 * (the shell's `o.seen` floor). The shell has already let the act through on it; this thread judges it again for itself.
 */
export function seatHolds(o, licFile) {
  if (!o.seat || typeof o.seat !== "object" || !o.leadKey) return false;
  let pub = "";
  try { const read = readKeyFile(o.leadKey); pub = read ? String(read.public || "") : ""; } catch { return false; }
  const seen = o.seen && typeof o.seen === "object" ? o.seen : undefined;
  return checkOwnSeat(o.seat, { key: pub, now: clockFor({ now: o.now, seen }, o.seat.issued), trustedKey: o.trustedKey,
    file: licFile, seen }).ok === true; /* plant:publish-seat */
}

const PROJECT_FILE = "project.json";
const DRAFT_FILE = "draft.json";
/** A name that is one plain segment of its folder: not empty, not . or .., no separator of either kind and no drive colon. */
const plainName = (n) => typeof n === "string" && n !== "" && n !== "." && n !== ".." && !/[\\/:]/.test(n);
const ARCHIVE = "archive";
const CATALOG_IN_ARCHIVE = "catalog.ec";
const NOTES_IN_ARCHIVE = "notes.md";
const RELEASE_IN_ARCHIVE = "release-notes.md";
const REPORT_IN_ARCHIVE = "report.json";
const ACCEPTANCES_IN_ARCHIVE = "acceptances.json";

/* One JSON writer for everything, so two files this program writes can never differ in their
   whitespace: the determinism gate compares bytes, and "the same catalog with a different
   indent" would read as a difference. Exported since the authoring screen arrived, because
   src/studio.mjs saves the draft between publishes and a second writer there would make the
   file a person edited differ from the file the importer wrote by its indent alone. */


/* THE PUBLISHED FILE'S NAME: a lower-case slug fixed at the first publish and changed only by
   Studio's changeFileName. Each frame is named once, as ID_REFUSAL is, and the Polish is in the page. */
const TAKEN_REFUSAL = "{FOLDER} already holds {FILE}, which is another catalog's file, so nothing was"
  + " published. Under another file name this one can go out.";
const ELSEWHERE_REFUSAL = "{FOLDER} already holds {FILE}, which is this catalog's file under another name,"
  + " so nothing was published. Choosing {FILE} under Change file name in"
  + " Catalog details, or taking that file away, lets the next publish go out.";
/* A project that has never been published has no Change file name row. The person edited the
   cover's File name, so the refusal points there and only there (board 831). */
const COVER_ELSEWHERE_REFUSAL = "{FOLDER} already holds {FILE}, which is this catalog's file under another name, so"
  + " nothing was published. Putting {FILE} back as the file name on this screen, or taking that file"
  + " out of the folder, lets the publish go out.";
/* Bringing a catalog's latest edition into a team's place (carryEdition) meets a file of the same name that is another
   catalog, or one this Studio cannot open as this one: that file stays as it was and nothing is written. */
/* THE DESTINATION MOVED ON WHILE THE EDITION WAS MADE: another Studio leading the same team wrote a newer edition of this
   catalog there between this publish's first read and its write. Nothing is written over it, the archive gives the edition back,
   and the next publish counts past it (Grok's review 29, finding 2). Claudette's words, 2026-11-15. */
const MOVED_ON_REFUSAL = "{FILE} in the folder moved on to rev {REV} while this edition was being made, so nothing was written"
  + " there. Publishing again goes out above it.";
/* THE TEAM'S KEY MOVED ON WHILE THE EDITION WAS MADE (Grok's review 29, finding 1). Claudette's words, 2026-11-15. */
const KEY_MOVED_REFUSAL = "The team's key changed while this edition was being made, so nothing was written over {FILE}. The next"
  + " publish seals it under the team's current key.";
const CARRY_TAKEN_REFUSAL = "{FILE} in the team's place is another catalog's file, or a file this Studio cannot open, so it was left"
  + " as it is and nothing was written. Under another file name, this catalog can go there.";
const EMPTY_SLUG_REFUSAL = "{TEXT} leaves no letter from a to z or digit for a file name";

/* A WINDOWS DEVICE NAME IS NO STEM A FILE CAN BE MADE UNDER: `con` and `con.ec` both read as the console. */
const DEVICE_NAME = /^(con|prn|aux|nul|com[0-9]|lpt[0-9])$/i;
const FILE_NAME_OK = /^[a-z0-9][a-z0-9-]{0,63}\.ec$/;
const fileNameOk = (n) => typeof n === "string" && FILE_NAME_OK.test(n)
  && !DEVICE_NAME.test(n.slice(0, -3));

/** The slug a file is named by, from any text; "" where the text leaves nothing to name it by. */
async function fileSlug(text) {
  const F = await Engine.format();
  const s = F.slug(String(text == null ? "" : text).trim().replace(/\.ec$/i, ""), 64);
  return DEVICE_NAME.test(s) ? s + "-catalog" : s;
}

/** The catalog the file at `at` holds, or null where it will not parse. An envelope counts by the catalog inside where
 *  `teamKeys` opens it ({team id: {epoch: key}}), and otherwise holds none. */
function docHeld(at, teamKeys) {
  try {
    let doc = readJson(at);
    if (teamKeys && doc && doc.kind === Engine.sealRules().SEALED_KIND) {
      const key = teamKeyOf(teamKeys, doc.team, doc.epoch), text = key ? Engine.sealRules().openSealed(key, doc) : null;
      doc = text === null ? null : JSON.parse(text);
    }
    return doc && typeof doc === "object" ? doc : null;
  } catch { return null; }
}

/** The catalog id the file at `at` carries, or "" where it will not parse or names none, read as docHeld reads it. */
function idHeld(at, teamKeys) {
  const doc = docHeld(at, teamKeys);
  return !!doc && typeof doc.id === "string" ? doc.id : "";
}

/** The rev of catalog `id` in the file at `at`, read as docHeld reads it; 0 where it is absent, another catalog's, or carries
 *  no whole rev. The edition about to replace that file goes above it (Grok's review 29, finding 2). */
function revHeld(at, id, teamKeys) {
  if (!id || !fs.existsSync(at)) return 0;
  const doc = docHeld(at, teamKeys);
  return !!doc && doc.id === id && Number.isSafeInteger(doc.rev) && doc.rev > 0 ? doc.rev : 0;
}

/** Whether the file at `at` is a catalog carrying `id`, read as idHeld reads it. */
function holdsId(at, id, teamKeys) {
  return !!id && idHeld(at, teamKeys) === id;
}

/* NO UNSIGNED EDITION AFTER SIGNED ONES (Grok's review mu, 2026-11-22, the second B). A desk that trusts the lead refuses an
   unsigned file of the catalog once it has taken a signed one, and the next launch then has no catalog. A key whose private half
   will not open on this computer reached here as no key, and the edition went out unsigned over the signed ones. So a publish with
   no key, where the archive's last edition or the file it would replace was signed, is refused before anything is written, and the
   cover says so beforehand. A first edition with no key, and editions after unsigned ones, go out unsigned as they always did.
   The words are a placeholder for the copywriter. */
const SIGNED_BEFORE = "Nothing was published: earlier editions of this catalog were signed, the signing key cannot be opened here now, and desks"
  + " that trust it would refuse an unsigned edition. Restore the key from the Menu, under Settings, then Signing key.";
const SIGNED_BEFORE_CLI = "Nothing was published: earlier editions of this catalog were signed, the signing key cannot be opened here now, and desks"
  + " that trust it would refuse an unsigned edition. Name the key with --key and its passphrase.";
const signedDoc = (d) => !!d && !!d.sig && typeof d.sig === "object" && typeof d.sig.value === "string" && d.sig.value !== "";
/** Whether an edition of catalog `id` already out was signed: the last one in the archive at `archiveHome`, or the file at `at`
 *  (read as docHeld reads it, a sealed one opened with `teamKeys`), which the next edition would replace. */
function signedEarlier(archiveHome, at, id, teamKeys) {
  const taken = editionsIn(archiveHome);
  if (taken.length) {
    let last = null;
    try { last = archivedCatalog(archiveHome, taken[taken.length - 1]); } catch { last = null; }
    if (signedDoc(last)) return true;
  }
  if (!at || !id || !fs.existsSync(at)) return false;
  const doc = docHeld(at, teamKeys);
  return !!doc && doc.id === id && signedDoc(doc);
}

/** The first free name for a catalog: the slug of `text`, then -2, -3 ... The names in `folder`
 *  that are absent, or are this catalog's own, are free; with no folder nothing is checked. */
async function suggestFileName(text, folder, id, teamKeys) {
  const base = (await fileSlug(text)) || "catalog";
  /* A copy of this catalog already in the folder keeps its name: a second file with the id would be refused. */
  if (folder && !holdsId(path.join(folder, base + ".ec"), id, teamKeys)) {
    const twin = copyOf(folder, id, base + ".ec", teamKeys);
    if (twin) return twin;
  }
  for (let n = 1; n < 10000; n++) {
    const tail = n === 1 ? "" : "-" + n;
    const name = base.slice(0, 64 - tail.length).replace(/-+$/, "") + tail + ".ec";
    const at = folder ? path.join(folder, name) : null;
    if (!at || !fs.existsSync(at) || holdsId(at, id, teamKeys)) return name;
  }
  throw new Error("no free file name near " + base + " in " + folder);
}

/** A project's name: `displayName` in project.json, else its folder's. The older `name` key is neither read nor rewritten. */
function projectName(home, project) {
  const n = project && typeof project.displayName === "string" ? project.displayName.trim() : "";
  return n || path.basename(home);
}

/** The first other .ec in `folder` that carries `id`, or "": this catalog under a second name.
 *  A conflict copy of `not` is the same file under a sync client's name, not a second catalog. */
function copyOf(folder, id, not, teamKeys) {
  let names = [];
  try { names = fs.readdirSync(folder); } catch { return ""; }
  names = names.filter(n => !conflictSiblingName(not, n)); /* plant:f3-no-elsewhere */
  return names.filter(n => /\.ec$/i.test(n) && n !== not).sort()
    .find(n => holdsId(path.join(folder, n), id, teamKeys)) || "";
}

/* THE READING LANGUAGE OF A CATALOG, and it lives here because three callers now ask.
   Format 2's `langs` is a list of {code,label} and the FIRST is the primary, so a bare
   langs[0] is an object and a key of no title: pick() would then fall back to the card's
   own first language, which is English by accident on everything the importer writes.
   src/studio.mjs held this and src/audit.mjs needed it; one statement, one answer. */
function primaryOf(draft) { return ((((draft || {}).langs || [])[0] || {}).code) || "en"; }

/** A project on disk: project.json beside draft.json, and an archive folder that may be empty. */
/* READ, AND A FILE THAT IS NOT THERE IS SAID SO, rather than asked about first: on a share every
   question is a round trip (sense pass 3, item 20). */
const ABSENT = ["ENOENT", "ENOTDIR"];
function readOr(at, absent) {
  try { return readJson(at); }
  catch (e) { if (e && ABSENT.indexOf(e.code) >= 0) throw absent(); throw e; }
}

function readProject(dir) {
  const at = path.join(dir, PROJECT_FILE);
  const project = readOr(at, () => refuse("{DIR} has no project.json: a catalog folder holds"
    + " project.json and draft.json, and an import makes the draft", { DIR: dir },
    "no project.json in {DIR}; a"
    + " project folder holds project.json and draft.json (node tools/import.mjs makes the draft)"));
  /* A draft name that is not one plain segment is refused like one with no file behind it: the join below would leave the folder. */
  if (project.draft && !plainName(project.draft)) throw refuse("the catalog names its draft as {NAME} and there is nothing"
    + " at {P}", { NAME: project.draft, P: dir });
  const draftAt = path.join(dir, project.draft || DRAFT_FILE);
  const draft = readOr(draftAt, () => refuse("the catalog names its draft as {NAME} and there is nothing"
    + " at {P}", { NAME: project.draft || DRAFT_FILE, P: draftAt }));
  return { dir, project, draft, draftAt };
}

/** Every edition already archived, newest last by the engine's own ordering. */
function editionsIn(dir) {
  const at = path.join(dir, ARCHIVE);
  if (!fs.existsSync(at)) return [];
  return fs.readdirSync(at).filter(n => fs.statSync(path.join(at, n)).isDirectory()).sort();
}

/** The catalog of an archived edition, for a diff or a rollback. */
function archivedCatalog(dir, edition) {
  const at = path.join(dir, ARCHIVE, edition, CATALOG_IN_ARCHIVE);
  if (!fs.existsSync(at)) throw refuse("no archived catalog file at {P}", { P: at });
  return readJson(at);
}

/* THE NAME ALREADY FIXED, or null before the first publish. In order: project.json's own record,
   the last archived report's `file` (a publish cut off before project.json), and `<id>.ec` for a
   project whose archive holds any edition, which is every one published before file names were kept. */
function fixedName(home, project, id, archiveHome) {
  if (fileNameOk(project.fileName)) return project.fileName;
  const at = archiveHome || home;
  const eds = editionsIn(at);
  if (!eds.length) return null;
  try {
    const file = readJson(path.join(at, ARCHIVE, eds[eds.length - 1], REPORT_IN_ARCHIVE)).file;
    if (fileNameOk(file)) return file;
  } catch { /* an older or damaged report names none */ }
  return id + ".ec";
}

/* WHAT A PUBLISH OF THIS PROJECT WRITES: the fixed name, else on the first publish the caller's
   own or a suggestion (from the file a brought-in catalog came from, else the project's name). */
async function publishedName(home, archiveHome, project, draft, folder, given, teamKeys) {
  const id = String(draft.id);
  const fixed = fixedName(home, project, id, archiveHome);
  if (fixed) {
    if (given != null && (await fileSlug(given)) + ".ec" !== fixed)
      throw new Error("a file name was handed to a publish of a project whose name is already fixed as "
        + fixed + "; only changeFileName renames it");
    return fixed;
  }
  if (given != null) {
    const slug = await fileSlug(given);
    if (!slug) throw refuse(EMPTY_SLUG_REFUSAL, { TEXT: JSON.stringify(String(given)) });
    return slug + ".ec";
  }
  const from = typeof project.fileNameFrom === "string" ? project.fileNameFrom : projectName(home, project);
  return suggestFileName(from, folder, id, teamKeys);
}

/* WHAT THE AGGREGATE VIEWS NEED OUT OF A PROJECT, and it is here rather than on either door
 * because both doors ask for it: `node tools/stats-read.mjs` with a project named, and the
 * Statistics section through src/studio.mjs. Two copies of these ten lines is how the older one
 * stays wrong, which this tree has already paid for once (board 629).
 *
 * THE ARCHIVE IS OLDEST FIRST BY ITS OWN NAMES. An edition is stamped `YYYY-MM-DD` and then
 * letters, so `editionsIn`'s lexicographic sort is chronological, and the first edition carrying
 * a card id is that card's publication - which is the only date in this tree that says when a
 * card reached a desk. The draft's own cards carry no such date, which is why the views read the
 * archive at all.
 *
 * THE TITLE IS CARRIED AND NEVER COUNTED. It is the primary language's, for a reader of the
 * table; every figure is over ids.
 */
function viewInput(dir) {
  const p = readProject(path.resolve(dir));
  const primary = primaryOf(p.draft);
  const cards = (p.draft.cards || []).map(c => ({
    id: String(c.id),
    title: String(((c.title || {})[primary]) || ""),
  }));
  const editions = editionsIn(p.dir).map(ed => {
    const cat = archivedCatalog(p.dir, ed);
    return { edition: ed, rev: +cat.rev || 0, ids: (cat.cards || []).map(c => String(c.id)) };
  });
  return { cards, editions, catalogId: p.project.id || p.draft.id || null };
}

/* THE EDITION STEP IS STUDIO'S OWN. The engine's Export makes a new catalog every time, dated
 * today, so the engine steps no edition and the rule lives here. What an edition is, which is
 * older and what today is called still come from the pin (Engine.editionRules); only the step
 * is this file's, and it must stay the successor under the engine's catalogEditionOlder:
 * "z" steps to "aa", never to "ba". An edition dated today or later gets its next letter, so a
 * publish is never proposed older than the project's; anything else proposes today. */
function nextEditionLetters(s) {
  const a = String(s || "").split("");
  for (let i = a.length - 1; i >= 0; i--) {
    if (a[i] !== "z") { a[i] = String.fromCharCode(a[i].charCodeAt(0) + 1); return a.join(""); }
    a[i] = "a";
  }
  return "a" + a.join("");
}

/** The edition rules a publish stamps by, under a clock of the caller's choosing (null is now). */
function editionRules(fixedNow) {
  const { todayEdition, editionParts, catalogEditionOlder } = Engine.editionRules(fixedNow);
  const proposeEdition = (current) => {
    const today = todayEdition();
    const was = editionParts(current);
    return (was && was.date >= today) ? was.date + nextEditionLetters(was.s) : today;
  };
  return { proposeEdition, nextEditionLetters, editionParts, catalogEditionOlder, todayEdition };
}

/* THE EDITION, and the one place this differs from a fresh proposal.
 *
 * A project has the archive, so the proposal over the project's current edition then advances
 * by nextEditionLetters while that edition is already in the archive. Two publishes on one day
 * therefore land on today and today-a whichever order the project's own field is in, and an
 * archive folder is never written over.
 */
function stampEdition(rules, current, taken) {
  let ed = rules.proposeEdition(current || "");
  const have = new Set(taken);
  while (have.has(ed)) {
    const parts = rules.editionParts(ed);
    ed = parts ? parts.date + rules.nextEditionLetters(parts.s) : ed + "a";
  }
  return ed;
}

/** The lint verdict, the pinned engine's alone. `awaiting` is that engine's own list where it
 *  has one and null where it has not, which is how the class below tells the two pins apart. */
function lintOf(catalog) {
  const { lintCatalog } = Engine.lint();
  const r = lintCatalog(catalog);
  return { errors: r.errors, warnings: r.warnings,
           awaiting: Array.isArray(r.awaiting) ? r.awaiting : null };
}

/* A DRAFT AWAITING A LANGUAGE PUBLISHES, AND SAYS SO EVERYWHERE THE FILE GOES. Maxim, board
 * 510, 2026-09-18: a one-language draft is a state and not a fault, so it goes out with no
 * override note and no tick, and what it is waiting for is counted per language on the publish
 * cover and in the release notes the archive keeps. It refused until this ruling, for the
 * reason it always had: the older engine called every such card an error and this gate refused
 * on the count. Errors refuse as before, and they are a different thing - a broken catalog, not
 * an unfinished one.
 *
 * THE LINES THE STATE ACCOUNTS FOR LEAVE THE ERROR COUNT, and that is what makes the ruling
 * true on the pin this build stands at rather than only on a later one. An engine without an
 * awaiting class of its own calls each such card an error - forty cards, forty errors - so a
 * refusal reading the error count would refuse the very draft the ruling lets through, and the
 * cover would ask for a note the publisher no longer wants. `classed` is the classifier's own
 * set of those lines, the importer builds it the same way for its own report, and the raw count
 * is kept in the archived report so nothing the engine said is lost.
 *
 * The classifier is the IMPORTER'S, one implementation of it in the tree, so the cover, the
 * command line and this gate cannot come to different views of what a draft is waiting for. */
function awaitingOf(catalog, base, contentHash) {
  const { lintCatalog } = Engine.lint();
  const got = awaitingOver(catalog, base, lintCatalog, Engine.builtInLangs(), contentHash);
  return { rows: got.rows, classed: got.classed, notes: got.notes };
}

/** The verdict the publisher acts on: the engine's own warnings less those Studio's placeholder
 *  rule says as an error, its errors less the lines the awaiting state accounts for plus that
 *  rule, and the raw counts it started from. */
function verdictOf(lint, classed, catalog) {
  const tokens = Engine.cardTokens().tokens;
  const errors = lint.errors.filter(e => !classed.has(e))
    .concat(catalog ? unknownTokens(catalog, tokens, lint.errors) : []);
  const warnings = catalog ? untold(lint.warnings, tokensMet(catalog, tokens, lint.errors))
    : lint.warnings;
  return { errors, warnings, raw: lint.errors.length, rawWarnings: lint.warnings.length };
}

/* THE REFUSAL NAMES WHAT IS IN THE WAY. It names errors only since 510: a language nobody has
 * written yet no longer stands in the way, and "fix them" was always the wrong instruction for
 * it. */
function refusalLine(lint) {
  return "the lint found " + lint.errors.length + " error(s) and nothing was published."
    + " Fix them, or publish over them with an override note that will be recorded in the"
    + " archive and printed in the release notes."
    + "\n  " + lint.errors.slice(0, 8).join("\n  ")
    + (lint.errors.length > 8 ? "\n  " + "and " + (lint.errors.length - 8) + " more" : "");
}

function releaseNotes(o) {
  const L = [];
  /* The rev first and the dated edition after it (board 902, the test architect's condition 4). */
  L.push("# " + o.name + " rev " + o.rev + " (" + o.edition + ")"); /* plant:txrd-rd7-7 */
  L.push("");
  L.push("Rev " + o.rev + " (" + o.edition + "), catalog id `" + o.id + "`."); /* plant:txrd-rd7-4 */
  /* THE ONE LINE THAT SAYS WHETHER THIS FILE IS SIGNED, and it says it in both directions: an
     unsigned catalog is a normal catalog rather than a failure, and a reader of the archive
     months later must not have to infer either state from the absence of a sentence. */
  L.push("Built against engine " + String(o.pin).slice(0, 7) + ", "
    + (o.sig ? "signed with key `" + o.sig.keyId + "` (" + o.sig.alg + ")." : "unsigned."));
  L.push("");
  L.push("## What is in it");
  L.push("");
  L.push("- " + o.counts.cards + " cards");
  L.push("- " + o.counts.macros + " macros");
  L.push("- " + o.counts.intents + " intents");
  L.push("- " + o.counts.cats + " categories");
  L.push("- languages: " + o.langs.join(", "));
  L.push("");
  L.push("## Lint");
  L.push("");
  const awaits = o.awaiting || [];
  if (!o.lint.errors.length && !o.lint.warnings.length && !awaits.length)
    L.push("Clean: no errors, no warnings.");
  else {
    L.push(o.lint.errors.length + " error(s), " + o.lint.warnings.length + " warning(s)"
      + (awaits.length ? ", " + awaits.length + " language(s) awaiting text." : "."));
    /* THE NOTE SAYS WHAT IT WAS WRITTEN OVER, AND SINCE 510 THAT IS ERRORS ALONE. A language
       awaiting text is published without a note at all, so listing it here would say a decision
       had been taken where none was asked for. A note given where nothing refused is still
       recorded, because the author wrote it and the archive keeps what the author wrote. */
    if (o.override) {
      L.push("");
      L.push(o.lint.errors.length
        ? "**Published over " + o.lint.errors.length + " error(s) on an override note.**"
        : "**An override note was given, over nothing that refused.**");
      L.push("");
      L.push("> " + String(o.override).split("\n").join("\n> "));
    }
    if (awaits.length) {
      L.push("");
      awaits.forEach(a => L.push("- awaiting: " + a.lang
        + (a.cards == null ? "" : ", " + a.cards + " card(s) lacking text")));
    }
    if (o.lint.errors.length) {
      L.push("");
      o.lint.errors.slice().sort().forEach(e => L.push("- error: " + e));
    }
    if (o.lint.warnings.length) {
      L.push("");
      o.lint.warnings.slice().sort().forEach(w => L.push("- warning: " + w));
    }
  }
  L.push("");
  /* Board 902: the earlier edition by its rev first and its date after, where the archive gave a rev. */
  const before = !o.previous ? "" : o.previousRev == null ? "edition " + o.previous : "rev " + o.previousRev + " (" + o.previous + ")";
  L.push("## Against " + (o.previous ? before : "nothing"));
  L.push("");
  if (!o.previous) L.push("This is the first published edition of this catalog.");
  else if (o.diff.same) L.push("No structural change: the content is identical to "
    + before + ".");
  else {
    L.push(summary(o.diff));
    L.push("");
    diffLines(o.diff, { values: false }).forEach(l => L.push("- " + l));
  }
  L.push("");
  L.push("## Notes");
  L.push("");
  L.push(o.notes ? o.notes : "No notes were given for this rev.");
  L.push("");
  return L.join("\n");
}

/* THE ACCEPTANCE RECORD: WHICH CARDS OF THIS EDITION SOMEBODY APPROVED, WHO, AND WHEN.
 *
 * Board item 606, Maxim on 2026-09-19 21:37. The audit pack is for an internal quality manager
 * who has to show that every card was approved before it was published, and until now the only
 * place an approval existed was the project's review log - a file that says what the queue
 * decided but not what went out in which edition. So each edition's archive now carries the
 * acceptances that landed since the previous one, grouped by card, and the pack is assembled
 * from the archive alone rather than from a log that keeps moving.
 *
 * WHAT IS RECORDED IS WHAT LANDED. An accepted change that could not be applied - the card had
 * gone from the working copy - is counted and not filed under the card, because an acceptance
 * that never reached the catalog is not evidence about the catalog. The count keeps it visible.
 *
 * THE HONEST HALF IS THE CARDS WITH NOTHING BEHIND THEM. A card edited straight in the
 * authoring program, or a whole catalog imported from a pile, never passes the queue and has no
 * acceptance to show; a record that quietly listed every changed card as approved would be
 * exactly the false evidence an audit pack must not produce. So the diff against the previous
 * edition names what changed, and every changed card with no decision behind it is listed under
 * `changedWithoutAcceptance`, which is the manager's worklist rather than a defect.
 *
 * THE FILE CARRIES ITS OWN CAVEAT, once, in the words src/review.mjs keeps: the account is the
 * operating system's and it is not verified.
 */
function acceptanceRecord(o) {
  const cards = new Map(), other = [];
  let notApplied = 0;
  (o.acceptances.reviews || []).forEach(r => {
    const applied = new Set(r.applied || []);
    (r.accepted || []).forEach(key => {
      if (!applied.has(key)) { notApplied++; return; }
      const k = parseKey(key);
      const row = { key, op: k.op, path: k.path,
                    by: r.by == null ? null : String(r.by),
                    at: r.at || null, from: r.from || null, source: r.source || null };
      if (k.scope === "card" && k.id) {
        if (!cards.has(k.id)) cards.set(k.id, []);
        cards.get(k.id).push(row);
      } else other.push(Object.assign({ scope: k.scope }, row));
    });
  });

  const changed = new Set();
  const d = o.diff && o.diff.cards ? o.diff.cards : { added: [], changed: [], removed: [] };
  ["added", "changed", "removed"].forEach(w =>
    (d[w] || []).forEach(c => { if (c && c.id != null) changed.add(String(c.id)); }));
  const without = Array.from(changed).filter(id => !cards.has(id)).sort();

  const byCard = Array.from(cards.keys()).sort().map(id => ({
    id, accepted: cards.get(id).sort((a, b) => a.key.localeCompare(b.key)) }));
  const decisions = byCard.reduce((n, c) => n + c.accepted.length, 0) + other.length;

  return {
    kind: "etiuda-studio-acceptance-record", schema: 1,
    id: o.id, rev: o.rev, edition: o.edition, previous: o.previous,
    person: { source: "operating system account", verified: false,
              statement: ACCOUNT_STATEMENT },
    window: { firstReview: o.acceptances.first, lastReview: o.acceptances.through,
              reviews: (o.acceptances.reviews || []).length },
    cards: byCard,
    other: other.sort((a, b) => String(a.key).localeCompare(String(b.key))),
    changedCards: Array.from(changed).sort(),
    changedWithoutAcceptance: without,
    counts: {
      reviews: (o.acceptances.reviews || []).length,
      acceptedDecisions: decisions,
      acceptedCards: byCard.length,
      changedCards: changed.size,
      changedWithoutAcceptance: without.length,
      acceptedNotApplied: notApplied,
    },
  };
}

/** The note table the edition carries: text by language code, in the catalog's own order, each
 *  trimmed, blank ones left out, and null where nothing is left. A code the catalog does not
 *  declare is a fault of the caller (the engine's v2Problems refuses it in a file), so it throws
 *  here, where nothing has been written. */
function leadNotesOf(given, langs) {
  if (given == null) return null;
  if (typeof given !== "object" || Array.isArray(given))
    throw new Error("the lead's notes are a table of text by language code");
  const declared = (langs || []).map(l => l.code);
  Object.keys(given).forEach(code => {
    if (typeof given[code] === "string" && given[code].trim() && declared.indexOf(code) < 0)
      throw new Error("the lead's note names " + JSON.stringify(code)
        + ", a language this catalog does not declare");
  });
  const out = {};
  declared.forEach(code => {
    const v = typeof given[code] === "string" ? given[code].trim() : "";
    if (v) out[code] = v;
  });
  return Object.keys(out).length ? out : null;
}

/* Epochs named as waiting on the team file: a list, or the list `pendingKeys` holds for this team. */
function pendingEpochs(pendingKeys, team) {
  const raw = Array.isArray(pendingKeys) ? pendingKeys
    : (pendingKeys && typeof pendingKeys === "object" ? pendingKeys[String(team)] : null);
  return (Array.isArray(raw) ? raw : []).map(Number).filter((n) => Number.isInteger(n) && n >= 1);
}

/* The newest epoch `teamKeys` holds a usable key (32 bytes) for, for this team, or null where it holds none.
   Epochs in `pending` are kept ahead of the team file and do not count (board 920). */
function newestEpochHeld(teamKeys, team, pending) {
  const own = (o, k) => !!o && typeof o === "object" && Object.prototype.hasOwnProperty.call(o, k);
  const byEpoch = own(teamKeys, String(team)) ? teamKeys[String(team)] : null;
  if (!byEpoch || typeof byEpoch !== "object") return null;
  const skip = new Set((Array.isArray(pending) ? pending : []).map(Number));
  const held = Object.keys(byEpoch).map(Number).filter(e => Number.isFinite(e) && !skip.has(e) && teamKeyOf(teamKeys, team, e));
  return held.length ? Math.max(...held) : null;
}

/* SEALED WHERE THE TEAM AT THE FOLDER SAYS SO (board 834, step 12, S6). A team file there that lists this catalog and says
 * `sealed` gets the share's copy sealed for the team's epoch by the pinned engine's sealCatalog, and only where the file is
 * this Studio's own (heldTeam, under `o.key`) and `o.teamKeys` holds that epoch's key; otherwise, or where the team file
 * will not read whole, or where `o.teamKeys` holds a newer epoch than the file's (a rollback), nothing is written. The archive keeps the catalog in the clear, so it may not sit inside the folder. */
async function sealedByFile(folder, id, homes, o) {
  const read = await readTeam(folder);
  if (!read.team) {
    if (!fs.existsSync(read.at)) return null;
    throw new Error("the team file at " + read.at + " does not read whole, so whether it seals this catalog cannot be told;"
      + " nothing was written");
  }
  if (read.team.catalogs.indexOf(String(id)) < 0 || read.team.sealed !== true) return null;
  const lead = o.leadKey || o.key;
  const held = lead ? await heldTeam(folder, { key: lead }) : { team: null, reason: "no signing key was named" };
  if (!held.team) throw new Error("the team file at " + read.at + " seals this catalog and is not this Studio's own: " + held.reason + "; nothing was written");
  const key = teamKeyOf(o.teamKeys, held.team.id, held.team.epoch);
  if (!key) throw new Error("the team at " + path.resolve(folder) + " seals this catalog, and this Studio does not hold the team's"
    + " current key; nothing was written"); /* plant:txrw-rw1-7 */
  const tf = o.teamsFile || (o.userData ? teamsFile(o.userData) : null);
  if (tf) clearKeyPending(tf, held.team.id, Number(held.team.epoch));
  if (Array.isArray(o.pendingKeys)) {
    o.pendingKeys = o.pendingKeys.filter((e) => Number(e) > Number(held.team.epoch));
  } else if (o.pendingKeys && typeof o.pendingKeys === "object" && Array.isArray(o.pendingKeys[held.team.id])) {
    o.pendingKeys[held.team.id] = o.pendingKeys[held.team.id].filter((e) => Number(e) > Number(held.team.epoch));
  }
  /* A team file older than a key this Studio holds is a rollback: a desk removed at the newer epoch still holds the older
     epoch's key and may write its older file back. Nothing is sealed for the older epoch, and nothing goes out in the clear. */
  const newer = newestEpochHeld(o.teamKeys, held.team.id, pendingEpochs(o.pendingKeys, held.team.id)); /* plant:rs920-pending */
  if (newer !== null && newer > Number(held.team.epoch))
    throw new Error("the team file at " + read.at + " is older than a team key this Studio holds, so this is an older file"
      + " of the team's written back; nothing was written");
  homes.forEach(h => {
    const rel = path.relative(path.resolve(folder), path.resolve(h));
    if (!rel || (!rel.startsWith("..") && !path.isAbsolute(rel)))
      throw new Error("the catalog is kept in the clear at " + path.resolve(h) + ", inside the folder it would be published"
        + " to sealed; nothing was written");
  });
  return { team: held.team.id, epoch: held.team.epoch, key };
}

/* NOTHING IN THE CLEAR INTO A SEALED TEAM'S PLACE (board 962 stage 6, 3.1, widened by Argon's finding 4). A catalog the team does
 * not list, with no seal mark of its own, used to go out in the clear wherever the folder's team file did not list it; a catalog
 * taken off a team, or pointed at a team's folder by Change, would then sit there readable by anyone who reads the share. So a
 * publish with no sealing is refused, with nothing written, where the folder holds a team file that says sealed (this Studio's or
 * another's, verified or not), or where this computer's teams file keeps the folder, or the share it mirrors (`o.shown`), as a
 * sealed team of this Studio's that the lead has not turned to Plain here (`o.unsealed`). A team file that does not read is refused
 * by sealedByFile before this. */
const CLEAR_INTO_SEALED = "{FOLDER} is the place of a sealed team, and this catalog is not one of its catalogs, so it was not"
  + " published there in the clear. Nothing was written.";
async function clearRefused(folder, o) {
  const opts = o || {}, at = path.resolve(String(folder));
  const shownAt = opts.shown ? path.resolve(String(opts.shown)) : at;
  const read = await readTeam(at);
  if (read.team && read.team.sealed === true) throw refuse(CLEAR_INTO_SEALED, { FOLDER: shownAt });
  const tf = opts.teamsFile || (opts.userData ? teamsFile(opts.userData) : null);
  if (!tf) return;
  const same = (a, b) => (process.platform === "win32" ? a.toLowerCase() === b.toLowerCase() : a === b);
  const ids = new Set();
  for (const f of new Set([at, shownAt])) {
    const t = teamForFolder(tf, f);
    if (t) ids.add(t);
    for (const w of relayTeams(tf)) if (w.folder && same(path.resolve(String(w.folder)), f)) ids.add(w.team);
  }
  const plain = [].concat(opts.unsealed || []).map(String);
  for (const t of ids) {
    const kept = keptTeam(tf, t);
    if (kept && kept.sealed === true && plain.indexOf(String(t)) < 0) throw refuse(CLEAR_INTO_SEALED, { FOLDER: shownAt });
  }
}

/* ONCE SEALED, SEALED (the test architect's read of S6's Studio half). A project whose lead has chosen Sealed for a team
 * (setTeamSealed, src/studio.mjs), or that has published sealed for one, keeps `sealedTeam` in its own record, and from then
 * on the team file at the folder can no longer send it out in the clear: a file deleted, unsigned, saying not sealed or
 * dropping the catalog leaves the share untouched. Only the lead's own Plain, made in this Studio and handed in as
 * `o.unsealed` (team ids), lets it out in the clear again. */
async function sealingFor(folder, id, homes, o, mark) {
  const sealing = await sealedByFile(folder, id, homes, o);
  if (sealing) return sealing;
  if (!mark || [].concat(o.unsealed || []).map(String).indexOf(String(mark)) >= 0) {
    await clearRefused(folder, o); /* plant:clear-into-sealed */
    return null;
  }
  const read = await readTeam(folder);
  const lead = o.leadKey || o.key;
  const held = read.team && lead ? await heldTeam(folder, { key: lead }) : null;
  const why = !fs.existsSync(read.at) ? "the folder holds no team file now"
    : !held || !held.team ? "the team file at " + read.at + " is not this Studio's own"
      + (held && held.reason ? ": " + held.reason : "")
    : held.team.id !== String(mark) ? "the team file at " + read.at + " is another team's"
    : "the team file at " + read.at + " says it does not seal this catalog, and only Plain on the Desks screen turns sealing off";
  throw new Error("this project has published sealed for team " + mark + ", and " + why + "; nothing was written");
}

/**
 * @param {object} o
 *   o.project   a project folder, or
 *   o.csv       a CSV to import into a project held in memory
 *   o.folder    where the .ec goes. Defaults to the project folder.
 *   o.fileName  the file's name on a project's first publish, as text: its slug is used. Handed
 *               once the name is fixed and different, it is a fault of the caller.
 *   o.notes     the author's notes for this revision.
 *   o.leadNotes the lead's note for this edition, {code: text} over the catalog's languages. It is
 *               written into the edition itself, where a desk's offer shows it; o.notes is not.
 *   o.override  a note permitting publication over lint errors. Refuses without one.
 *   o.now       a fixed clock, for the determinism gate. Defaults to the real one.
 *   o.key       a signing key file (src/sign.mjs). Absent, the catalog goes out unsigned.
 *   o.passphrase the passphrase that opens it. Given a key and no passphrase this refuses
 *               rather than publishing unsigned: a person who named a key meant to sign, and
 *               a file that quietly went out unsigned would be discovered at a desk.
 *   o.ring      false to publish signed and write no ring beside the .ec. Anything else, a
 *               signed publish merges this key's entry for this catalog into etiuda-ring.json
 *               in the same folder, adding to whatever is already there.
 *   o.archive   a folder to archive into. Defaults to <project>/archive, and in the CSV shape
 *               to <folder>/.studio, which the desk's own listing cannot see: it lists *.ec in
 *               the folder itself and does not recurse (shell/main.js ecFilesIn).
 *   o.licenceFile the licence to act on; else STUDIO_LICENCE_FILE, else the one in o.userData.
 *   o.trustedKey, o.released  a development tree's alone (src/licence.mjs, contextFor).
 *   o.teamKeys  the team keys this Studio holds, {team id: {epoch: 32 bytes}}: the one for the epoch of a team at
 *               the folder that seals this catalog is what the share's copy is sealed with (sealingFor).
 *   o.pendingKeys epochs kept ahead of the team file, {team id: [epoch]} or one list: a key kept for a removal
 *               whose write has not landed is not a newer epoch than the file (board 920).
 *   o.leadKey   the lead's key file, read for its public half only, so a team file at the folder can be known as this
 *               Studio's own without signing the catalog. Defaults to o.key.
 *   o.unsealed  the team ids the lead has turned to Plain in this Studio: a project that published sealed for one of
 *               them may publish in the clear again, and forgets that it sealed.
 */
async function publishFull(o) {
  const opts = o || {};
  if (!opts.project && !opts.csv)
    throw new Error("publish wants a project folder or a CSV");

  let project, draft, home, draftAt = null, importReport = null;
  if (opts.project) {
    const p = readProject(path.resolve(opts.project));
    project = p.project; draft = p.draft; home = p.dir; draftAt = p.draftAt;
  } else {
    const made = await importCsv({ file: opts.csv, primary: opts.primary || null,
                                   id: opts.id || null });
    draft = made.catalog; importReport = made.report;
    project = { id: draft.id, rev: 0, edition: "" };
    home = path.resolve(opts.archive || path.join(path.resolve(opts.folder || "."), ".studio"));
  }
  const folder = path.resolve(opts.folder || home);
  const archiveHome = path.resolve(opts.archive || home);
  /* The CSV shape keeps <id>.ec, which tests/round-trip.mjs is the contract of. */
  const ecName = opts.project
    ? await publishedName(home, archiveHome, project, draft, folder, opts.fileName, opts.teamKeys)
    : String(draft.id) + ".ec";

  /* ---- the licence: a trial or paid period past its end, and no licence at all, are what it refuses ---
     A valid licence publishes, whatever day its build was released. A missing or unusable file is no licence
     (board 745). The state is always computed here from the file, never handed in whole, so no
     caller can publish past a pause by describing a licence it does not have. A licence's clock is
     the newest time the shell has seen, handed in as `seen` with the licence it verified for a held
     read (src/licence.mjs, review xi, A1 and A4), and never an archive folder's name (B6). */
  const licFile = licenceFileFor(opts);
  const lic = await licenceState(readLicenceFile(licFile),
    { file: licFile, trustedKey: opts.trustedKey, released: opts.released, now: opts.now,
      seen: opts.seen && typeof opts.seen === "object" ? opts.seen : undefined });
  /* THE LICENCE FILE GOES AS AN EVERYDAY ENTITLEMENT (Max, 2026-11-22 15:37, as Claude alpha carried it out): this Studio's own seat
     certificate publishes, and so does a licence the root signed by hand, the one narrow path; a licence the service issued is read as none. */
  const byHand = lic.root === true;
  if (!seatHolds(opts, licFile) && !(byHand && lic.canPublish)) { /* plant:publish-entitled */
    if (byHand && lic.status === "trial-ended") throw refuse(TRIAL_PAUSED, { DATE: lic.trial.until });
    if (byHand && lic.status === "paid-ended") throw new Error("the paid period ended on " + lic.paidUntil + ", so nothing was published");
    /* Reached by no screen: the shell stops a Studio that holds no licence at the door, before any act (shell/main.js worksNow). */
    if (lic.status === "none" || !byHand) throw new Error("this Studio holds no licence it can use, so nothing was published");
    throw new Error("a licence state of " + lic.status
      + " refused publishing, and only a trial or paid period past its end, or no licence may");
  }

  /* ---- bump, stamp, hash --------------------------------------------------------------- */

  const F = await Engine.format();
  const rules = editionRules(opts.now == null ? null : opts.now);
  const taken = editionsIn(archiveHome);
  const previous = taken.length ? taken[taken.length - 1] : null;
  const before = previous ? archivedCatalog(archiveHome, previous) : null;
  /* An archived rev may already be on the desks though the project's record never moved (a
     publish cut off at its last write), so the next rev counts past both. */
  const revOf = (v) => (Number.isFinite(+v) ? +v : 0);
  /* And past the file it is about to replace (Grok's review 29, finding 2): a newer edition of this catalog at that name, another
     Studio's of the same team or one this project's record never claimed, is never written over by a lower rev. The lead is not
     stopped by it: the edition goes above it, and the press says the folder held a newer one. */
  const ownRev = Math.max(revOf(project.rev), before ? revOf(before.rev) : 0);
  const atRev = revHeld(path.join(folder, ecName), String(draft.id || project.id || ""), opts.teamKeys); /* plant:r2-dest-rev */
  const rev = Math.max(ownRev, atRev) + 1;
  const folderNewer = atRev > ownRev ? atRev : 0;
  const edition = stampEdition(rules, project.edition || draft.date || "", taken);

  /* The published document: the draft with its revision and edition on it, and the engine's
     own content hash recomputed last, because the hash covers everything but itself. */
  const catalog = Object.assign({}, draft, { rev, date: edition });
  delete catalog.hash; delete catalog.sig;
  /* DATE MODIFIED (board 982, src/dated.mjs): each card, shelf and request new or changed against the edition before is
     dated from what Studio recorded, never from this clock, before the lint, the hash and the signature, which cover it.
     The journal counts only while it is this edition's: Studio starts it again at each publish of its own (journalFrom,
     src/studio.mjs), and one left from before a publish made elsewhere would date a change by an older one. */
  const acceptances = acceptancesSince(home);
  let changes = null;
  if (opts.project) {
    try { changes = readJson(path.join(home, CHANGES_FILE)); } catch { changes = null; }
    if (changes && changes.since != null && revOf(changes.since) !== revOf(project.rev)) changes = null;
  }
  Object.assign(catalog, datesFor({ before, doc: catalog, journal: changes, acceptances: acceptances.reviews, parseKey,
    edited: opts.project ? project.edited : null, F }));
  /* THE OLDEST DESK THIS EDITION ASKS FOR is the floor this line of Studio writes for, raised only by a feature the edition
     uses that older desks cannot show (src/engine-floor.mjs; the version policy, point 1). Whatever the draft carried, an
     import of a newer desk's file included, does not raise it. */
  catalog.minEngine = minEngineFor(catalog); /* plant:p1-min-engine */
  /* THE LEAD'S NOTE FOR THIS EDITION, written before the hash and the signature because both
     cover it. It is the engine's own `notes` table (text by language), which the desk's offer
     shows; it is not the archive's notes.md, which stays the author's account of the revision.
     Nobody gave a note, or every box was blank, and the edition carries none, not even an older
     note the draft brought in; a draft without one publishes as its own to the byte. */
  const lead = leadNotesOf(opts.leadNotes, catalog.langs);
  if (lead) catalog.notes = lead; else delete catalog.notes;
  /* An older Studio stamped a mark on an edition it published; a draft that carries one (it travels with a copied project) goes out
     without it, before the hash and the signature, both of which cover every key. */
  delete catalog.evaluation;
  const flagPlan = opts.project
    ? answeredForCatalog(home, catalog, {
        folder, teamKeys: opts.teamKeys, removed: opts.removed,
        userData: opts.userData, teamsFile: opts.teamsFile,
      })
    : { answered: [], newlyChanged: [] };
  if (flagPlan.answered.length) catalog.answered = flagPlan.answered;
  else delete catalog.answered;
  catalog.hash = F.contentHash(catalog);

  /* ---- validate what will be written, and refuse unless an override note says otherwise ---
   *
   * THE LINT JUDGES THE PUBLISHED CATALOG, NOT THE DRAFT, and the difference is not academic.
   * A draft carries the hash it had when it was last written, so the first edit an author makes
   * leaves a hash that is no longer the hash of what the file holds - which the engine's reader
   * calls an error. Linting the draft would therefore refuse every catalog anybody had touched,
   * and the author's only recourse would be an override note over a defect that does not exist.
   * So the hash is stripped and recomputed above, and what is linted here is the exact document
   * that is about to be written. Nothing has been written at this point: a refusal costs no
   * edition and leaves no folder.
   */
  const engineLint = lintOf(catalog);
  const found = awaitingOf(catalog, engineLint, F.contentHash);
  const awaiting = found.rows;
  const lint = verdictOf(engineLint, found.classed, catalog);
  const override = String(opts.override || "").trim();
  if (lint.errors.length && !override) {
    const e = new Error(refusalLine(lint));
    e.lint = lint;
    e.awaiting = awaiting;
    e.refusal = "lint";
    throw e;
  }

  /* ---- what changed ------------------------------------------------------------------- */

  const diff = diffCatalogs(before || {}, catalog, F.canonical);

  /* ---- counts, by the pinned shell's rules through the file it is about to write --------
     ecCounts itself, sliced (src/engine.mjs countRules), so the release notes and a desk's Library
     row cannot disagree: a macro is a body block, and intents are counted only where a request has
     a clause in the primary language, as the desk counts them (board 858, P5). */

  const desk = Engine.countRules().ecCounts(catalog);
  const counts = {
    cards: (catalog.cards || []).length,
    macros: desk.macros,
    intents: desk.intents,
    cats: desk.cats,
  };

  /* ---- sign, if a key was named -----------------------------------------------------------
   *
   * AFTER THE LINT AND BEFORE THE WRITE, and it is the last thing that touches the document.
   * The signature covers the finished payload with its own value absent, so anything edited
   * afterwards - a field added, a null normalised away, a hash recomputed - invalidates it
   * silently. `published` is therefore what both writes below take, and nothing may be assigned
   * into it past this point.
   *
   * A REFUSAL HERE COSTS NOTHING, because nothing has been written yet: a wrong passphrase
   * leaves no edition, no archive folder and no half-signed file on the share.
   */
  let sig = null, published = catalog, ringEntry = null, open = null;
  const ringAt = ringPath(folder);
  if (opts.key) {
    const read = readKeyFile(opts.key);
    if (!read) throw new Error("no signing key file at " + path.resolve(String(opts.key)));
    if (!opts.passphrase) throw new Error("the key file at " + read.file + " needs its"
      + " passphrase; pass one with --passphrase-file or in STUDIO_KEY_PASSPHRASE");
    open = unlockKey(read, opts.passphrase);
    published = await signCatalog(catalog, { privateKey: open.privateKey, keyId: open.keyId });
    sig = { alg: published.sig.alg, keyId: published.sig.keyId };
    /* THE RING, PLANNED HERE AND WRITTEN BELOW (board 605). A signature is worth nothing until a
       desk is told which key to trust for this catalog, and that binding cannot be made earlier
       than this: a key is generated with no catalog in view, and the id is only certainly right
       at the moment the key signs the document that declares it. So the entry is written at
       publish, into the folder the .ec goes to, and a key that has never signed anything has no
       entry anywhere. src/ring.mjs says the rest, including why writing it beside the catalog is
       a convenience rather than the trust.
       THE DRY RUN IS WHAT KEEPS THE REFUSAL FREE: a ring Studio cannot read, or a catalog id the
       format would drop, refuses here where nothing has been written, beside the wrong-passphrase
       refusal and for the same reason. `ring: false` turns the whole thing off for a publish that
       is not meant to carry trust anywhere. */
    if (opts.ring !== false) {
      ringEntry = await entryFor(read, catalog.id);
      addToRing(ringAt, ringEntry, { dry: true });
    }
  }

  /* ---- seal, where the team beside the catalogs says so: decided before anything is written --- */
  const sealing = await sealingFor(folder, catalog.id, [home, archiveHome], opts, opts.project ? project.sealedTeam : null);
  /* NO UNSIGNED EDITION AFTER SIGNED ONES, refused here, after the team's own refusals and still before anything is written. */
  if (!opts.key && signedEarlier(archiveHome, path.join(folder, ecName), String(draft.id || project.id || ""), opts.teamKeys))
    throw refuse(SIGNED_BEFORE, {}, SIGNED_BEFORE_CLI); /* plant:s1-signed-before */

  /* ---- write: the archive, then the share, then the project's own record -----------------
     A desk is only ever given an edition the archive holds: it is staged beside the archive and
     renamed in whole, the share takes it after, a refused share takes it back out, and a cut past
     the share leaves an unclaimed edition that the rev above counts past. */
  const ecAt = path.join(folder, ecName);
  if (fs.existsSync(ecAt) && !holdsId(ecAt, catalog.id, opts.teamKeys))
    throw refuse(TAKEN_REFUSAL, { FOLDER: folder, FILE: ecName });
  /* A record that lost a name change leaves the file under the new name: a second file with this id would list as a second catalog. */
  const twin = opts.project && !fs.existsSync(ecAt) ? copyOf(folder, catalog.id, ecName, opts.teamKeys) : "";
  if (twin) throw refuse(fixedName(home, project, String(catalog.id), archiveHome)
    ? ELSEWHERE_REFUSAL : COVER_ELSEWHERE_REFUSAL, { FOLDER: folder, FILE: twin });
  const archiveAt = path.join(archiveHome, ARCHIVE, edition);
  if (fs.existsSync(archiveAt))
    throw refuse("the archive already holds {E} at {P}; an archived edition is immutable and"
      + " this one would have been written over", { E: edition, P: archiveAt });
  const staging = path.join(archiveHome, ARCHIVE + "." + edition + "." + process.pid + ".tmp");
  const dropFolder = (p) => { try { fs.rmSync(p, { recursive: true, force: true }); } catch { /* gone */ } };
  const notesContent = opts.notes ? String(opts.notes).trim() : "No notes were given for this rev.";
  /* The notes are headed by the project's name, or the CSV's in that shape. */
  const notes = releaseNotes({
    name: opts.project ? projectName(home, project) : path.basename(path.resolve(opts.csv), path.extname(opts.csv)),
    id: catalog.id, rev, edition, counts, lint, awaiting, diff, previous,
    previousRev: before && before.rev != null && Number.isFinite(+before.rev) ? +before.rev : null, /* plant:txrd-rd7-8 */
    langs: (catalog.langs || []).map(l => l.code),
    notes: opts.notes ? String(opts.notes).trim() : "",
    override: override || null, pin: Engine.pin().commit, sig,
  });
  const report = {
    kind: "etiuda-studio-publish-report", schema: 1,
    id: catalog.id, rev, edition, hash: catalog.hash, file: ecName,
    /* The team and epoch the share's copy is sealed for, and null where it went out in the clear. */
    sealed: sealing ? { team: sealing.team, epoch: sealing.epoch } : null,
    /* What a desk will be told to trust, and null where the file went out unsigned. The
       signature's own value is NOT kept here: the archived catalog carries it, and a second
       copy of it in a report is a second thing to keep in step. */
    sig, counts, previous,
    lint: { errors: lint.errors.length, warnings: lint.warnings.length,
            errorLines: lint.errors.slice().sort(), warningLines: lint.warnings.slice().sort(),
            /* What the pinned engine said before the state took its share of it, so that an
               archived report can be read against that engine's own output. */
            raw: { errors: lint.raw, warnings: lint.rawWarnings },
            awaiting: awaiting.length,
            awaitingLines: awaiting.map(a => a.lang
              + (a.cards == null ? "" : ": " + a.cards + " card(s) lacking text")).sort() },
    override: override || null,
    diff: summary(diff),
    pin: Engine.pin().commit,
    importReport: importReport
      ? { errors: importReport.errors, warnings: importReport.warnings,
          counts: importReport.counts }
      : null,
  };
  /* The acceptances (read above, where they date what they landed) go into the edition, and the mark that stops them
     being counted into a second one is set only once the share holds it. The review log lives in the project folder, so
     the CSV shape has none and the record is written all the same, saying that nothing was decided. */
  try {
    dropFolder(staging);
    fs.mkdirSync(staging, { recursive: true });
    writeWhole(path.join(staging, CATALOG_IN_ARCHIVE), json(published));
    fs.writeFileSync(path.join(staging, NOTES_IN_ARCHIVE), notesContent + "\n", "utf8");
    fs.writeFileSync(path.join(staging, RELEASE_IN_ARCHIVE), notes, "utf8");
    fs.writeFileSync(path.join(staging, REPORT_IN_ARCHIVE), json(report), "utf8");
    fs.writeFileSync(path.join(staging, ACCEPTANCES_IN_ARCHIVE), json(acceptanceRecord({
      id: catalog.id, rev, edition, previous, diff, acceptances })), "utf8");
    fs.mkdirSync(path.join(archiveHome, ARCHIVE), { recursive: true });
    renamePatiently(staging, archiveAt);
  } catch (e) { dropFolder(staging); throw e; }

  try {
    fs.mkdirSync(folder, { recursive: true });
    /* Read again at the write: a newer edition that landed there since the rev above was counted is not written over. */
    const nowRev = revHeld(ecAt, String(catalog.id), opts.teamKeys);
    if (nowRev >= rev) throw refuse(MOVED_ON_REFUSAL, { FILE: ecName, REV: nowRev }); /* plant:r2-moved-on */
    /* And the team file, for a sealed edition: a removal another Studio of the team made since the seal's epoch was chosen above
       (a new epoch, the editions resealed) is not written over by a seal under the old epoch, which the removed desk still opens
       (Grok's review 29, finding 1). Nothing is written, the archive gives the edition back, and the next publish seals under the
       team's current key, or says this Studio does not hold it yet. */
    if (sealing) {
      const lead = opts.leadKey || opts.key;
      const now = lead ? await heldTeam(folder, { key: lead }) : null;
      if (!now || !now.team || String(now.team.id) !== String(sealing.team) || Number(now.team.epoch) !== Number(sealing.epoch))
        throw refuse(KEY_MOVED_REFUSAL, { FILE: ecName }); /* plant:r1-key-moved */
    }
    /* Whole or not at all (src/whole-write.cjs). The sibling it goes through does not end in .ec,
       so a desk listing the share never offers it. */
    writeWhole(ecAt, sealing ? json(Engine.sealRules().sealCatalog(sealing.key, sealing.team, sealing.epoch, json(published)))
      : json(published));
  } catch (e) {
    /* Renamed out before it is removed, so a removal cut short leaves no part edition behind. */
    try { renamePatiently(archiveAt, staging); dropFolder(staging); } catch { /* the rev counts past it */ }
    throw e;
  }
  /* Beside the catalog and immediately after it, so that the two files a person carries to a
     desk are never a step apart. The merge appends: a second key for this catalog, or another
     publisher's catalog in the same folder, leaves every entry already there where it was. */
  const ring = ringEntry ? addToRing(ringAt, ringEntry) : null;
  /* The publish no longer embeds the ring in a team file, nor writes etiuda-head.json, at a shared folder: a team kept for one is held
     and no longer synced (the folder team's removal). On the relay the runner writes both from the mirror at its next sync.
     plant:folder-publish-team-ring, plant:folder-publish-head, plant:publish-roll-log and plant:publish-roll-forward stood on those
     writes, which are gone; the marks stay until the plant guard has a way to retire one. */
  if (acceptances.reviews.length)
    markPublished(home, { edition, rev, through: acceptances.through });
  if (opts.project)
    commitPublishedFlags(home, flagPlan.newlyChanged);

  /* THE DRAFT TAKES THE EDITION'S DATES, so it holds what the edition holds and the next publish finds them where the
     desks have them. Read again rather than taken from the start of the publish; its own hash is written over what it now
     holds, as every write of the draft does. A draft that cannot be written loses nothing: no comparison reads a date. */
  let draftHash = null;
  if (draftAt) {
    try {
      const was = readJson(draftAt);
      const next = was && typeof was === "object" ? datesIntoDraft(was, published, F) : null;
      if (next) {
        delete next.hash; delete next.sig;
        next.hash = F.contentHash(next);
        writeWhole(draftAt, json(next));
        draftHash = { was: was.hash == null ? null : was.hash, now: next.hash };
      }
    } catch (e) { process.stderr.write("studio  the draft could not take the edition's dates: " + String(e && e.message || e) + "\n"); }
  }

  /* The project's own record moves last, so a crash between the archive and here leaves an
     archive with an edition the project has not claimed rather than the other way round: the
     first is visible and recoverable, the second silently skips an edition. */
  if (opts.project) {
    const next = Object.assign({}, project, { rev, edition, id: catalog.id, fileName: ecName });
    if (sealing) next.sealedTeam = sealing.team; else delete next.sealedTeam;
    writeWhole(path.join(home, PROJECT_FILE), json(next));
  }

  return { ec: ecAt, fileName: ecName, edition, rev, folderNewer, archive: archiveAt, counts, lint, awaiting, report, sig,
           sealed: report.sealed, ring, releaseNotes: path.join(archiveAt, RELEASE_IN_ARCHIVE),
           draftHash };
}

/**
 * THE PUBLISHED EDITION COMES ALONG (the test architect's R1, first-hour triage of 2026-10-20). A project that published before
 * its team moved onto the relay has its latest edition in the place it published to, and the relay's mirror holds none, so the
 * first catch-up of an admitted desk found no catalog. This puts that edition, and the key's entry in the ring, into the mirror
 * the team file has just been written to, sealed as the team's own are, before the first sync.
 *
 * CARRIED, NOT PUBLISHED AGAIN, because the move is the lead's choice of a channel and not of an edition: a second publish cuts
 * rev 2, stamps a new edition, runs the lint over the draft as it stands now (a draft that has changed, or one that published
 * under an override, would refuse the move) and sends the desks content the lead has not pressed Publish for. The carried copy
 * is the archive's own bytes, the edition the desks were already given, signed as it was, so rev and edition stay as they were.
 * It is read from the project's own archive and never from the old place, which may be a share that is gone.
 *
 * WHAT IS CARRIED, ONLY: the newest archived edition, where its signature verifies under this lead's key (a key id that
 * does not verify, a ring entry for another key, or none, would send the desk a catalog it has no reason to trust, so then
 * nothing is carried and the lead's next publish gives the desk its first catalog), where the project's file name is fixed,
 * and where the team file at `o.folder` lists the catalog and seals
 * (sealedByFile, the check a publish makes). A project that never published has no edition and returns null, as the move was.
 * A file of the same name at `o.folder` that is another catalog, or one `o.teamKeys` cannot open as this one, is refused with
 * CARRY_TAKEN_REFUSAL before anything is written (board 962 stage 5); an older edition of this catalog is written over.
 *
 * @param {object} o
 *   o.project   the project folder.
 *   o.folder    the mirror, which already holds the team file.
 *   o.key       the lead's key file (src/sign.mjs); read for its public half only.
 *   o.teamKeys  the team keys this Studio holds, as publishFull takes them.
 * @returns {object|null} what was written ({ec, ring, rev, edition}), or null where nothing was carried.
 */
async function carryEdition(o) {
  const opts = o || {};
  const home = path.resolve(String(opts.project || "")), folder = path.resolve(String(opts.folder || ""));
  const newest = latestEdition(home);
  if (!newest) return null;
  const { name: latest, catalog } = newest;
  const read = opts.key ? readKeyFile(opts.key) : null;
  if (!read || !catalog.sig || catalog.sig.keyId !== read.keyId || !await verifySignature(catalog, read.public)) return null; /* plant:r1-signer */
  const id = String(catalog.id || "");
  const name = fixedName(home, readProject(home).project, id, home);
  if (!name) return null;
  const sealing = await sealedByFile(folder, id, [home], Object.assign({}, opts, { leadKey: opts.key }));
  if (!sealing) return null;
  const ecAt = path.join(folder, name);
  /* A file of that name that is not this catalog, or that no team key here opens as this catalog, is another catalog's, and
     writing over it would lose it (board 962 stage 5, section 4). An older edition of this catalog is written over, as before. */
  if (fs.existsSync(ecAt) && !holdsId(ecAt, id, opts.teamKeys)) throw refuse(CARRY_TAKEN_REFUSAL, { FILE: name, FOLDER: folder }); /* plant:ce-taken */
  /* A newer edition of this catalog already in the team's place stays: carrying the archive's older one over it would hand the
     desks a lower rev (Grok's review 29, finding 2), and the lead's next publish goes above it. */
  if (revHeld(ecAt, id, opts.teamKeys) > (Number.isFinite(+catalog.rev) ? +catalog.rev : 0)) return null; /* plant:r2-carry-newer */
  const entry = await entryFor(read, id);
  addToRing(ringPath(folder), entry, { dry: true });
  const bytes = newest.text();
  writeWhole(ecAt, json(Engine.sealRules().sealCatalog(sealing.key, sealing.team, sealing.epoch, bytes))); /* plant:r1-seal */
  const ring = addToRing(ringPath(folder), entry); /* plant:r1-ring */
  return { ec: ecAt, ring: ring.file, rev: catalog.rev, edition: catalog.date };
}

/** A project's newest archived edition: its folder name, its catalog, and its archived bytes on asking; null before the
 *  first publish. carryEdition carries it into a team's place, and the one-press sync (src/link.mjs) brings it into a
 *  linked copy, so both read one edition by one rule. */
function latestEdition(home) {
  const taken = editionsIn(home);
  if (!taken.length) return null;
  const name = taken[taken.length - 1];
  return { name, catalog: archivedCatalog(home, name),
           text: () => fs.readFileSync(path.join(home, ARCHIVE, name, CATALOG_IN_ARCHIVE), "utf8") };
}

/* THE GATE'S ENTRY POINT, AND WHY IT IS A BARE STRING.
 *
 * tests/round-trip.mjs does `st.ec = await mod.publish(...)` and then hands st.ec to
 * fs.existsSync and path.basename, both of which reject anything but a string PRIMITIVE - a
 * String object with the details hung off it throws inside node's own path validation, which
 * would read as the publisher failing rather than as the shape being wrong. So the contract
 * with the gate is a path and nothing else, and a caller wanting the rest calls publishFull.
 */
async function publish(o) { return (await publishFull(o)).ec; }

export { publish, publishFull, signedEarlier, carryEdition, latestEdition, licenceFileFor, readProject, editionsIn, archivedCatalog, stampEdition, editionRules, lintOf, primaryOf,
         fileSlug, suggestFileName, fixedName, projectName, holdsId, idHeld, EMPTY_SLUG_REFUSAL, CARRY_TAKEN_REFUSAL, DEVICE_NAME,
         awaitingOf, releaseNotes, acceptanceRecord, json, viewInput,
         PROJECT_FILE, DRAFT_FILE, plainName, ARCHIVE, CATALOG_IN_ARCHIVE, RELEASE_IN_ARCHIVE,
         NOTES_IN_ARCHIVE, REPORT_IN_ARCHIVE, ACCEPTANCES_IN_ARCHIVE };
