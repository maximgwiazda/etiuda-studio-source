/* THE CATALOG EACH JOINED DESK HAS LOADED (board 890).
 *
 *     import { listUses, forPage, attachUses, buildAsk, writeAsk, withdrawAsk,
 *              watchFolder, answersDue } from "./src/catalog-use.mjs";
 *
 * A desk writes desks/<id>/in-use.ec, sealed for the team and signed as its own file. This module
 * reads that file for the desks on the roster only, says which catalog it names, and never the
 * cards. An import asks that desk by writing catalog-asks/<id>.json in the shape the pinned
 * engine's askFresh accepts, and opens desks/<id>/catalog-answer.ec when the desk answers: under the
 * team key where the team lists the catalog, else with the lead's box (board 962, stage 0).
 * The page is handed the saying alone: no team key and no card.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import * as Engine from "./engine.mjs";
import { archivedCatalog, editionsIn, readProject } from "./publish.mjs";
import { removedHeld } from "./removed.mjs";
import { writeWhole } from "./whole-write.cjs";

const DESK_ID = /^k-[0-9a-f]{16}$/;
const TEAM_ID = /^t-[0-9a-f]{16}$/;
const ASK_KIND = "etiuda-catalog-ask";
const ASK_PREFIX = "etiuda-catalog-ask\n";
const PAUSE_KIND = "etiuda-team-pause";
const PAUSE_NAME = "etiuda-team-pause.json";
const WITHDRAWN_KIND = "etiuda-catalog-ask-withdrawn";
const IN_USE_KIND = "etiuda-in-use";
const ANSWER_KIND = "etiuda-catalog-answer";
const ASK_ID_RE = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,79}$/;
/* The pinned desk's ASK_CONTENT_FORMAT: an ask for a catalog the team does not list, naming the team, the only one a desk answers
   with such a catalog. */
const ASK_CONTENT_FORMAT = 2; /* plant:b1014-st-scan */
/* The told stamp the desk signs into an answer or a copy of a catalog the team does not list (`content`): the ISO 8601 UTC time its
   agent was told, in the shape the pinned desk writes it. */
const TOLD_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/;
function toldStamp(v) { return typeof v === "string" && TOLD_RE.test(v) && Number.isFinite(Date.parse(v)); } /* plant:b1014-st-told-shape */
const PIN_RE = /^sha256:[0-9a-f]{64}$/;
const CHAIN_MAX = 64;
const COPY_FILE = /^.+-([0-9a-f]{8})[.]ec$/;
const REFUSAL_COPY_GONE = "This copy can no longer be read here, so nothing was imported. The desk may have changed or withdrawn it since.";
const SPKI_ED25519 = Buffer.from("302a300506032b6570032100", "hex");
const PAGE_FIELDS = ["id", "name", "kind", "n", "title", "asOf", "importable", "waiting", "askedAt", "movedOn", "landed",
  "unread", "refused", "lapsed", "unopened", "why", "rev", "dated"]; /* plant:txrd-rd2-2 */

/* The engine's canonical JSON, the same fold signedBytesOf uses: keys sorted, no spaces. */
function canonJson(v) {
  if (v === null || typeof v !== "object") return JSON.stringify(v);
  if (Array.isArray(v)) return "[" + v.map(canonJson).join(",") + "]";
  const keys = Object.keys(v).filter((k) => v[k] !== undefined).sort();
  return "{" + keys.map((k) => JSON.stringify(k) + ":" + canonJson(v[k])).join(",") + "}";
}
/* The bytes a signature covers. `hash` is left out. `sig` keeps alg and keyId and not value. */
function signedBytesOf(doc) {
  const copy = {};
  Object.keys(doc || {}).forEach((k) => {
    if (k === "hash") return;
    if (k !== "sig") { copy[k] = doc[k]; return; }
    const s = doc.sig;
    if (s && typeof s === "object") {
      copy.sig = {};
      if (s.alg !== undefined) copy.sig.alg = s.alg;
      if (s.keyId !== undefined) copy.sig.keyId = s.keyId;
    }
  });
  return Buffer.from(canonJson(copy), "utf8");
}
function askSignedBytes(doc) {
  return Buffer.concat([Buffer.from(ASK_PREFIX, "utf8"), signedBytesOf(doc)]); /* plant:txcu-890sg */
}

function keyFor(teamKeys, team, epoch) {
  const own = (o, k) => !!o && typeof o === "object" && Object.prototype.hasOwnProperty.call(o, k);
  const byEpoch = own(teamKeys, String(team)) ? teamKeys[String(team)] : null;
  const k = own(byEpoch, String(epoch)) ? byEpoch[String(epoch)] : null;
  return k instanceof Uint8Array && k.length === 32 ? Buffer.from(k) : null;
}

function parseJson(text) {
  return JSON.parse(String(text).replace(/^\uFEFF/, ""));
}

/* The sealed envelope opened with the key this Studio holds for the team and epoch it names. */
function openInner(file, teamKeys) {
  const got = openSealedAt(file, teamKeys);
  return got ? got.inner : null;
}
/* The same, with the epoch the envelope was sealed at. */
function openSealedAt(file, teamKeys) {
  let raw;
  try { raw = fs.readFileSync(file, "utf8"); } catch { return null; }
  let env;
  try { env = parseJson(raw); } catch { return null; }
  const seal = Engine.sealRules();
  if (!env || typeof env !== "object" || env.kind !== seal.SEALED_KIND) return null;
  const key = keyFor(teamKeys, env.team, env.epoch);
  if (!key) return null;
  let text = null;
  try { text = seal.openSealed(key, env); } catch { text = null; }
  if (typeof text !== "string") return null;
  try {
    const inner = parseJson(text);
    return inner && typeof inner === "object" && !Array.isArray(inner) ? { inner, epoch: env.epoch } : null;
  } catch { return null; }
}

/* A DESK'S OWN IN-USE FILE, or null: it opens under a key this Studio holds for the team, it is an in-use file, and it is
   genuine for the desk whose folder it sits in, judged by that folder's id and never by the id the file gives itself. */
function inUseOf(folder, deskId, teamKeys) {
  const inner = openInner(path.join(folder, "desks", deskId, "in-use.ec"), teamKeys);
  if (!inner || inner.kind !== IN_USE_KIND) return null;
  return Engine.deskRules().deskFileGenuine(inner, deskId) ? inner : null; /* plant:txcu-890sf */
}

/* THE HIGHEST COUNTER ACCEPTED FOR A DESK. A file names n, counting from 1. A later file with a lower n, or with
   none once one has been accepted, is an older file come back and is not in use. cleared is not in use either, and
   its n still raises the floor when it is higher. The floor is the caller's, on the ledger it keeps. A file with
   no n, read before any floor, is the older desk's file and is in use as it was. */
function useFloor(ledger, deskId) {
  const n = ledger && ledger.useN && ledger.useN[deskId];
  return Number.isInteger(n) && n >= 1 ? n : 0;
}
function rememberUseN(ledger, deskId, n) {
  if (!ledger || !(n > useFloor(ledger, deskId))) return;
  if (!ledger.useN || typeof ledger.useN !== "object") ledger.useN = {};
  ledger.useN[deskId] = n; /* plant:f9-use-n */
}
function acceptUse(inner, deskId, ledger) {
  if (!inner) return null;
  const n = Number.isInteger(inner.n) && inner.n >= 1 ? inner.n : 0;
  const floor = useFloor(ledger, deskId);
  if (n && n < floor) return null; /* plant:f9-use-old */
  if (!n && floor) return null; /* plant:f9-use-plain */
  if (n) rememberUseN(ledger, deskId, n);
  if (inner.cleared === true) return null; /* plant:f9-use-cleared */
  return inner;
}

/* A DESK'S IN-USE FILE THAT IS THERE AND CANNOT BE READ AS ITS OWN, asked only where inUseOf found none: it does not open
   under any key this Studio holds, or it opens and is not genuine for the desk whose folder it sits in (the test
   architect's E9). Either way which catalog the desk uses is not known, and the row says so rather than looking like a
   desk with no catalog. */
function unread(folder, deskId) {
  return fs.existsSync(path.join(folder, "desks", deskId, "in-use.ec"));
}

/* THE DESKS A HANDOVER FOR A KEY IN OTHER HANDS LEFT BEHIND (Max's ruling of 2026-11-01 06:13). A desk takes a key change by
   sealing its in-use file again under the new key (the pinned desk's resealHeld), so its own genuine file, opened under a key
   this Studio holds and sealed at `want` or later, is what Studio can see of it having taken the change. */
function tookEpoch(folder, deskId, teamKeys, want) {
  let env = null;
  try { env = parseJson(fs.readFileSync(path.join(folder, "desks", deskId, "in-use.ec"), "utf8")); } catch { return false; }
  if (!env || typeof env !== "object" || !(Number(env.epoch) >= want)) return false; /* plant:lb-names-epoch */
  return !!inUseOf(folder, deskId, teamKeys); /* plant:lb-names-open */
}

/** The names of the desks a handover to a key with a fresh box left behind: of `o.desks` (the ids admitted at the handover),
 *  those still on `o.roster` whose own in-use file does not show `o.epoch` (the first key change after the handover) or a later
 *  one. A desk with no such file, none at all included, is named, since Studio cannot see that it took the change. In the
 *  roster's order, each by the name the roster gives it. */
function notTaken(o) {
  const opts = o || {};
  const folder = path.resolve(String(opts.folder || ""));
  const want = Number(opts.epoch);
  const at = new Set((Array.isArray(opts.desks) ? opts.desks : []).map(String));
  const out = [];
  if (!Number.isInteger(want) || want < 2) return out;
  rosterOf(opts.roster).forEach((m) => {
    if (!at.has(m.id)) return;
    if (tookEpoch(folder, m.id, opts.teamKeys, want)) return; /* plant:lb-names-took */
    out.push(m.name || m.id);
  });
  return out;
}

function rosterOf(roster) {
  return (Array.isArray(roster) ? roster : []).map((r) => (typeof r === "string"
    ? { id: r, name: r } : { id: r && r.id ? String(r.id) : "", name: r && r.name ? String(r.name) : "" }))
    .filter((r) => DESK_ID.test(r.id));
}

function projectIdOf(dir) {
  try { return String(readProject(dir).draft.id || ""); } catch { return ""; }
}

function editionsOf(dir) {
  const pin = Engine.deskRules().signedSha;
  let names = [];
  try { names = editionsIn(dir); } catch { names = []; }
  const out = [];
  names.forEach((name) => {
    try {
      const cat = archivedCatalog(dir, name);
      out.push({ name: String(name), sha256: pin(cat), rev: Number.isInteger(+cat.rev) ? +cat.rev : null });
    } catch { /* a broken edition is not a match */ }
  });
  return out;
}

/* The sayings. A pin that is an archived edition wins, then this project's own id, then another catalog the team lists (board 962
   stage 5, T3: `teamCats`, [{id, title, rev, editions}], named by this library's project of it, never offered for import here,
   since it is the team's own and not something a teammate brought), then a catalog of this library the team does not list (board 962
   stage 6, U1: `libraryCats`, [{id, title, rev, editions}], moved to another team, taken off, or never given; named by its project,
   never offered for import, since it is this Studio's own), then any other catalog. */
function classify(cat, projectId, editions, teamCats, libraryCats) {
  const pin = String(cat && cat.sha256 || "");
  const hit = editions.find((e) => e.sha256 === pin);
  /* Board 902: an edition in use is named by its rev and its dated edition, and a copy changed at a desk by the rev it grew
     from, with that rev's dated edition where the archive holds it. */
  const inRev = cat && cat.rev != null && Number.isInteger(+cat.rev) ? +cat.rev : null;
  if (hit) return { kind: "edition", n: hit.name, rev: hit.rev != null ? hit.rev : inRev, title: "", importable: false }; /* plant:txcu-890sa */
  const id = cat && typeof cat.id === "string" ? cat.id : "";
  if (id && id === projectId) { /* plant:txcu-890sb */
    const rev = inRev === null ? 0 : inRev, from = editions.find((e) => e.rev === rev);
    return { kind: "own", n: String(rev), dated: from ? from.name : "", title: "", importable: true };
  }
  const listed = id ? (Array.isArray(teamCats) ? teamCats : []).find((c) => c.id === id) : null; /* plant:s5w-team */
  if (listed) {
    const was = listed.editions.find((e) => e.sha256 === pin);
    const rev = was && was.rev != null ? was.rev : inRev;
    return { kind: "team", n: rev == null ? "" : String(rev), rev, title: listed.title || (cat && typeof cat.title === "string" ? cat.title : ""), importable: false };
  }
  const ours = id ? (Array.isArray(libraryCats) ? libraryCats : []).find((c) => c.id === id) : null; /* plant:s6-library */
  if (ours) {
    const was = (ours.editions || []).find((e) => e.sha256 === pin);
    const rev = was && was.rev != null ? was.rev : inRev;
    return { kind: "library", n: rev == null ? "" : String(rev), rev, title: ours.title || (cat && typeof cat.title === "string" ? cat.title : ""), importable: false };
  }
  const title = cat && typeof cat.title === "string" ? cat.title : ""; /* plant:txcu-890sc */
  return { kind: "other", n: "", title, importable: true };
}

function mtimeIso(at) {
  try { return new Date(fs.statSync(at).mtimeMs).toISOString(); } catch { return ""; }
}

function askLive(doc, deskId) {
  if (!doc || typeof doc !== "object" || doc.kind !== ASK_KIND) return false;
  if (String(doc.desk || "") !== deskId) return false; /* plant:txcu-890sh-2 */
  const when = Date.parse(String(doc.expires || ""));
  return Number.isFinite(when) && when > Date.now(); /* plant:txcu-890sh */
}

/* AN ASK WHOSE SEVEN DAYS ARE OVER: this desk's, and past its expiry. */
function askLapsed(doc, deskId) {
  if (!doc || typeof doc !== "object" || doc.kind !== ASK_KIND || String(doc.desk || "") !== deskId) return false;
  const when = Date.parse(String(doc.expires || ""));
  return Number.isFinite(when) && when <= Date.now();
}

function readAsk(folder, deskId) {
  const at = path.join(folder, "catalog-asks", deskId + ".json");
  let doc = null;
  try { doc = parseJson(fs.readFileSync(at, "utf8")); } catch { doc = null; }
  if (!askLive(doc, deskId)) {
    const lapsed = askLapsed(doc, deskId);
    return { waiting: false, askedAt: "", sha256: "", lapsedId: lapsed ? String(doc.id || "") : null, doc: lapsed ? doc : null, at };
  }
  return { waiting: true, askedAt: mtimeIso(at), sha256: String(doc.sha256 || ""), doc, at };
}

/* AN ANSWER THIS STUDIO WILL NOT LAND, to the ask waiting or lapsed: written since that ask, and held back by answerRefusal. An
   answer older than the ask is not an answer to it, so a lead who asks again sees Waiting until the desk answers. Without
   the lead key nothing is judged here and the row keeps waiting. */
function refusedAnswer(folder, deskId, ask, o) {
  if (!o.lead || !ask.doc) return false;
  let answered = NaN, asked = NaN;
  try {
    answered = fs.statSync(path.join(folder, "desks", deskId, "catalog-answer.ec")).mtimeMs;
    asked = fs.statSync(ask.at).mtimeMs;
  } catch { return false; }
  if (!(answered >= asked)) return false; /* plant:txcu-890sp-3 */
  const ans = openAnswer(folder, deskId, o.teamKeys, o.box); /* plant:s0-st-list-box */
  return !!ans && !!answerRefusal(ask.doc, ans, deskId, { folder, roster: o.roster, lead: o.lead, teamKeys: o.teamKeys,
    deskKeys: o.deskKeys, removed: o.removed, team: o.team, epoch: o.epoch, catalogs: o.catalogs });
}

/* A COPY WRITTEN SINCE THE ASK: the desk answered it, whatever the copy turns out to be. An answer older than the ask is not
   an answer to it (refusedAnswer). */
function answeredSince(folder, deskId, ask) {
  if (!ask.doc) return false;
  try {
    return fs.statSync(path.join(folder, "desks", deskId, "catalog-answer.ec")).mtimeMs >= fs.statSync(ask.at).mtimeMs;
  } catch { return false; }
}
/* THE COPY THIS STUDIO COULD NOT OPEN AS A CATALOG (board 899), recorded by the shell when its landing refused it
   (noteUnopened), for this ask and this copy: a desk that answers again with another copy is judged afresh. */
function unopenedOf(ledger, askId, ans) {
  const all = (ledger && ledger.unopened) || {};
  const rec = askId && Object.prototype.hasOwnProperty.call(all, askId) ? all[askId] : null;
  return rec && ans && rec.sha256 === ans.sha256 ? rec : null;
}

/** What each roster desk has loaded, from in-use.ec. A desk off the roster is not read. A file there that does not open,
 *  or that opens and is not that desk's own signed file, is listed as unread. `o.lead` ({ keyId, public }, this
 *  Studio's lead key) lets a row say an answer was held back; without it the row keeps waiting. A box answer is judged with
 *  `o.box`, `o.team`, `o.deskKeys` and `o.removed`, as answersDue judges it, and waits while the box is locked. */
function listUses(o) {
  const opts = o || {};
  const folder = path.resolve(String(opts.folder || ""));
  const roster = rosterOf(opts.roster);
  const projectId = opts.projectId != null ? String(opts.projectId) : projectIdOf(opts.projectDir);
  const editions = Array.isArray(opts.editions) ? opts.editions : editionsOf(opts.projectDir);
  /* The team's other catalogs, each with this library's project of it where there is one (its title, rev and editions). */
  const teamCats = (Array.isArray(opts.teamCatalogs) ? opts.teamCatalogs : []).filter((c) => c && c.id && String(c.id) !== projectId)
    .map((c) => ({ id: String(c.id), title: String(c.title || ""), rev: Number.isInteger(+c.rev) ? +c.rev : null,
      editions: Array.isArray(c.editions) ? c.editions : (c.dir ? editionsOf(c.dir) : []) }));
  /* This library's other catalogs the team does not list; a project's editions are read only for a desk that uses that catalog. */
  const listedIds = new Set(teamCats.map((c) => c.id));
  const libraryCats = (Array.isArray(opts.libraryCatalogs) ? opts.libraryCatalogs : [])
    .filter((c) => c && c.id && String(c.id) !== projectId && !listedIds.has(String(c.id)))
    .map((c) => ({ id: String(c.id), title: String(c.title || ""), dir: c.dir || "", given: Array.isArray(c.editions) ? c.editions : null }));
  const libraryOf = (id) => {
    const c = libraryCats.find((x) => x.id === id);
    if (c && !c.editions) c.editions = c.given || (c.dir ? editionsOf(c.dir) : []);
    return c ? [c] : [];
  };
  const ledger = (opts.ledger && opts.ledger.desks) || {};
  const done = (opts.ledger && opts.ledger.done) || {};
  const out = [];
  /* The roster the caller names, and no other folder under desks/. */
  const members = roster; /* plant:txcu-890se */
  members.forEach((member) => {
    const inner = inUseOf(folder, member.id, opts.teamKeys); /* plant:s2-use */
    const held = acceptUse(inner, member.id, opts.ledger);
    /* The teammate's working copies sealed to the lead's box (board 962, stage 3), unlisted ones. They stand apart from in-use.ec:
       a desk that ejected, cleared or bent its in-use file keeps its copies on the share, so they are read for every roster desk. */
    const got = boxCopiesOf(folder, member.id, { deskKeys: opts.deskKeys, box: opts.box, team: opts.team });
    const withCopies = (row) => {
      if (got.copies.length) row.copies = got.copies;
      if (got.locked) row.copiesLocked = true;
      return row;
    };
    /* A file that is there and is not this desk's own stays unread. A file that opened and is cleared, or older than
       the counter already accepted, is not in use: no row, rather than a catalog that cannot be read, unless the desk has copies. */
    if (!held) {
      if (unread(folder, member.id)) { /* plant:txcu-890sp */
        if (!inner) { out.push(withCopies({ id: member.id, name: member.name || member.id, kind: "", unread: true, importable: false, waiting: false })); return; } /* plant:s3-st-copy-unread */
      }
      if (got.copies.length || got.locked) out.push(withCopies({ id: member.id, name: member.name || member.id, kind: "", importable: false, waiting: false })); /* plant:s3-st-copy-row */
      return;
    }
    const usedId = held.catalog && typeof held.catalog.id === "string" ? held.catalog.id : "";
    const said = classify(held.catalog, projectId, editions, teamCats, libraryOf(usedId));
    const ask = readAsk(folder, member.id);
    const led = ledger[member.id] || null;
    const pin = String(held.catalog && held.catalog.sha256 || "");
    /* THE TWO WAYS AN ASK ENDS WITH NOTHING LANDED, each said with the press to ask again: the copy that came back was
       held back (refusedAnswer), or the seven days passed. Only where Import is offered at all, since both sentences end
       on asking again; a lapsed ask that was landed is not one. Refused is judged first and for a lapsed ask too, so a
       desk that did answer is never told it did not (the test architect's E10). */
    const refused = said.importable && (ask.waiting || !!ask.lapsedId) && refusedAnswer(folder, member.id, ask, { lead: opts.lead, roster, teamKeys: opts.teamKeys, box: opts.box, team: opts.team, deskKeys: opts.deskKeys, removed: opts.removed, epoch: opts.epoch, catalogs: opts.catalogs }); /* plant:txcu-890sp-2 */
    /* A DESK THAT ANSWERED IS NEVER TOLD IT DID NOT (board 899). A copy written since the ask that does not open under any key
       this Studio holds, or that the landing could not open as a catalog, is said as that, in place of Waiting and of the
       lapse; a copy that opens and has not landed yet keeps the row waiting while the ask is live, and is no lapse after. */
    const askId = ask.waiting ? String(ask.doc && ask.doc.id || "") : ask.lapsedId;
    const answered = said.importable && !!askId && !done[askId] && answeredSince(folder, member.id, ask);
    const ans = answered && !refused ? openAnswer(folder, member.id, opts.teamKeys, opts.box) : null; /* plant:s0-st-list-open */
    const record = ans ? unopenedOf(opts.ledger, askId, ans) : null;
    const unopened = answered && !refused && (!ans || !!record); /* plant:txau-unopened */
    /* A box answer the locked box has not opened is no copy that failed: the row waits. */
    const locked = unopened && !ans && boxLocked(folder, member.id, opts.box); /* plant:s0-st-locked */
    const saidUnopened = unopened && !locked;
    const lapsed = !ask.waiting && !refused && !answered && said.importable && !!ask.lapsedId && !done[ask.lapsedId]; /* plant:txau-lapsed */
    out.push({
      id: member.id,
      name: member.name || member.id,
      kind: said.kind,
      n: said.n,
      rev: said.rev,
      dated: said.dated,
      title: said.title,
      asOf: typeof held.at === "string" ? held.at : "",
      /* The shell reads the pin and the catalog's id to write the ask. forPage drops both, so the page never sees them. */
      sha256: pin,
      catalogId: held.catalog && typeof held.catalog.id === "string" ? held.catalog.id : "",
      importable: said.importable && (!ask.waiting || refused || saidUnopened),
      waiting: ask.waiting && !refused && !saidUnopened,
      refused,
      lapsed,
      unopened: saidUnopened,
      why: record && record.why ? record.why : undefined,
      askedAt: ask.askedAt,
      movedOn: !!(led && led.movedOn && led.asked && led.asked !== pin),
      landed: led && led.dir ? path.basename(String(led.dir)) : "",
    });
    withCopies(out[out.length - 1]);
  });
  return out;
}

/** The fields the page may see. Anything else on a row, including a key or a catalog, is dropped. */
function forPage(rows) {
  return (Array.isArray(rows) ? rows : []).map((r) => {
    const o = {};
    PAGE_FIELDS.forEach((k) => { if (r && r[k] !== undefined && r[k] !== "") o[k] = r[k]; });
    o.importable = !!(r && r.importable); /* plant:txcu-890sk */
    o.waiting = !!(r && r.waiting);
    o.movedOn = !!(r && r.movedOn);
    o.unread = !!(r && r.unread);
    o.refused = !!(r && r.refused);
    o.lapsed = !!(r && r.lapsed);
    o.unopened = !!(r && r.unopened);
    if (!o.why) delete o.why;
    /* Of a copy, the page sees its handle, title, rev and edition, never its catalog. */
    if (r && Array.isArray(r.copies) && r.copies.length)
      o.copies = r.copies.map((c) => ({ ref: String(c.ref), title: String(c.title || ""), rev: +c.rev || 0, edition: String(c.edition || "") })); /* plant:s3-st-copy-page */
    if (r && r.copiesLocked) o.copiesLocked = true;
    return o;
  });
}

/** `facts` as the page may see it, with the sayings attached and no team key on the object. */
function attachUses(facts, rows) {
  const out = Object.assign({}, facts || {}, { uses: forPage(rows) });
  delete out.teamKey;
  delete out.teamKeys;
  return out;
}

/** A signed ask the desk's askFresh accepts. `lead` is the opened signing key: { keyId, public, privateKey }. `content` true makes
 *  it an ask for a catalog the team does not list (askShape), naming `team`, which the desk checks against its own. */
function buildAsk(o) {
  const opts = o || {}, lead = opts.lead || {};
  const id = String(opts.id || crypto.randomBytes(8).toString("hex"));
  if (!ASK_ID_RE.test(id)) throw new Error("an ask id is refused by the desk");
  const sha = String(opts.sha256 || "");
  if (!PIN_RE.test(sha)) throw new Error("an ask names the pin the lead saw, sha256: and 64 hex");
  const desk = String(opts.desk || "");
  if (!DESK_ID.test(desk)) throw new Error("an ask names one desk");
  const expires = String(opts.expires || new Date(Date.now() + 7 * 86400000).toISOString());
  const doc = {
    format: opts.content === true ? ASK_CONTENT_FORMAT : 1, kind: ASK_KIND, id, desk, sha256: sha, expires, /* plant:b1014-st-format */
    sig: { alg: "Ed25519", keyId: String(lead.keyId || "") },
  };
  if (opts.content === true) {
    if (!TEAM_ID.test(String(opts.team || ""))) throw new Error("an ask for a catalog the team does not list names its team"); /* plant:b1014-st-named */
    doc.team = String(opts.team); /* plant:b1014-st-team */
  }
  if (!lead.privateKey) throw new Error("an ask is signed with the lead's key");
  doc.sig.value = crypto.sign(null, askSignedBytes(doc), lead.privateKey).toString("hex");
  return doc;
}

/** How the lead may ask for the catalog `catalogId` of team `team` (the held team file): { content: false } where the team lists
 *  it, { content: true } where it does not. Nothing else decides it: no setting stands between the lead and a member's catalog. */
function askShape(catalogId, team) {
  const listed = !!team && Array.isArray(team.catalogs) && team.catalogs.indexOf(String(catalogId || "")) >= 0;
  return { content: !listed }; /* plant:b1014-st-ask */
}

function askPath(folder, deskId) {
  const id = String(deskId || "");
  if (!DESK_ID.test(id)) throw new Error("an ask names one desk");
  return path.join(path.resolve(String(folder || "")), "catalog-asks", id + ".json");
}

/** Write the ask at the team folder's root, never inside the desk's own folder. */
function writeAsk(folder, deskId, doc) {
  const at = askPath(folder, deskId);
  fs.mkdirSync(path.dirname(at), { recursive: true });
  writeWhole(at, JSON.stringify(doc) + "\n");
  return at;
}

/* A SIGNATURE UNDER THE LEAD'S KEY, over the bytes `bytesFn` names. The same rule as an ask: Ed25519, the key id the
   lead names, the public half beside it. */
function leadVerified(doc, lead, bytesFn) {
  if (!doc || typeof doc !== "object" || !lead) return false;
  const sig = doc.sig && typeof doc.sig === "object" ? doc.sig : {};
  const pub = String(lead.public || ""), value = String(sig.value || "");
  if (sig.alg !== "Ed25519" || String(sig.keyId || "") !== String(lead.keyId || "")) return false;
  if (!/^[0-9a-f]{64}$/.test(pub) || !/^[0-9a-f]{128}$/.test(value)) return false;
  try {
    const key = crypto.createPublicKey({ key: Buffer.concat([SPKI_ED25519, Buffer.from(pub, "hex")]), format: "der", type: "spki" });
    return crypto.verify(null, bytesFn(doc), key, Buffer.from(value, "hex"));
  } catch { return false; }
}

function askIdOf(file) {
  try {
    const doc = parseJson(fs.readFileSync(file, "utf8"));
    const id = String(doc && doc.id || "");
    if (!doc || doc.kind !== ASK_KIND || !ASK_ID_RE.test(id)) return "";
    return id;
  } catch { return ""; }
}
function withdrawnPath(folder, deskId) {
  return path.join(path.resolve(String(folder || "")), "catalog-asks", String(deskId) + ".withdrawn.json");
}
/* The withdrawal already on disk counts only when this lead signed it for this desk. A forged file starts a new list. */
function withdrawnGenuine(doc, deskId, lead) {
  if (!doc || doc.format !== 1 || doc.kind !== WITHDRAWN_KIND || String(doc.desk || "") !== String(deskId || "")) return false;
  if (!Array.isArray(doc.ids) || doc.ids.length > 64 || !doc.ids.every((id) => typeof id === "string" && ASK_ID_RE.test(id))) return false;
  return leadVerified(doc, lead, askSignedBytes);
}
function writeWithdrawn(folder, deskId, askFile, lead) {
  const id = askIdOf(askFile);
  if (!id) return;
  const at = withdrawnPath(folder, deskId);
  let ids = [];
  try {
    const prev = parseJson(fs.readFileSync(at, "utf8"));
    if (withdrawnGenuine(prev, deskId, lead)) ids = prev.ids.slice();
  } catch { ids = []; }
  const had = ids.indexOf(id);
  if (had >= 0) ids.splice(had, 1);
  ids.push(id);
  while (ids.length > 64) ids.shift();
  const doc = {
    format: 1, kind: WITHDRAWN_KIND, desk: String(deskId), ids,
    sig: { alg: "Ed25519", keyId: String(lead.keyId || "") },
  };
  doc.sig.value = crypto.sign(null, askSignedBytes(doc), lead.privateKey).toString("hex"); /* plant:f9-withdraw-sign */
  fs.mkdirSync(path.dirname(at), { recursive: true });
  writeWhole(at, JSON.stringify(doc) + "\n");
}

/** The lead takes the ask back. The file is removed. A file that is already gone is that outcome. Where `lead` is the
 *  opened signing key, the ask's id is named first in catalog-asks/<desk>.withdrawn.json, a path the ask file cannot
 *  overwrite, signed as an ask is. At most 64 ids, newest last. Without a key the ask is still removed and the
 *  withdrawal file is left as it was. */
function withdrawAsk(folder, deskId, lead) {
  let at = "";
  try { at = askPath(folder, deskId); } catch { return false; }
  if (lead && lead.privateKey) writeWithdrawn(folder, deskId, at, lead);
  try { fs.unlinkSync(at); return true; } /* plant:txcu-890sj */
  catch (e) { return !!(e && e.code === "ENOENT"); }
}

/* The last pause time this process wrote for a team folder. The file is the record across a restart; this remembers
   a time the file no longer shows, so a later write stays strictly above it. */
const pauseWrote = new Map();
function pauseMemoKey(folder, teamId) {
  return path.resolve(String(folder || "")) + "\n" + String(teamId || "");
}
function pauseGenuine(doc, teamId, lead) {
  if (!doc || doc.format !== 1 || doc.kind !== PAUSE_KIND || String(doc.team || "") !== String(teamId || "")) return false;
  if (typeof doc.paused !== "boolean" || !Number.isInteger(doc.t) || doc.t < 0) return false;
  return leadVerified(doc, lead, askSignedBytes);
}

/** Whether a waiting desk may be admitted. A paused licence admits nobody. */
function admitOpen(paused) {
  return paused !== true;
}

/** The licence, written beside the team file for the desks that are waiting. `paused` is the licence's own flag.
 *  `lead` is the opened signing key ({ keyId, public, privateKey }). `now` is the clock, in milliseconds, which a
 *  test may inject. The same flag is not written again. A file this lead did not sign for this team is not an earlier
 *  time. The file is never removed: a licence that is not paused, and no file yet, writes nothing. */
function noteTeamPause(folder, teamId, lead, paused, now) {
  const want = paused === true;
  if (!TEAM_ID.test(String(teamId || "")) || !lead || !lead.privateKey) return { wrote: false, t: 0 };
  const at = path.join(path.resolve(String(folder || "")), PAUSE_NAME);
  let existing = null;
  try { existing = parseJson(fs.readFileSync(at, "utf8")); } catch { existing = null; }
  const genuine = pauseGenuine(existing, teamId, lead);
  const memo = pauseMemoKey(folder, teamId);
  let last = pauseWrote.get(memo) || 0;
  if (genuine && existing.t > last) last = existing.t;
  if (genuine && existing.paused === want) {
    pauseWrote.set(memo, last);
    return { wrote: false, t: existing.t };
  }
  if (!genuine && !want) return { wrote: false, t: 0 };
  const clock = Number.isInteger(now) && now >= 0 ? now : Date.now();
  const t = clock > last ? clock : last + 1;
  const doc = {
    format: 1, kind: PAUSE_KIND, team: String(teamId), paused: want, t,
    sig: { alg: "Ed25519", keyId: String(lead.keyId || "") },
  };
  doc.sig.value = crypto.sign(null, askSignedBytes(doc), lead.privateKey).toString("hex"); /* plant:f9-pause-sign */
  fs.mkdirSync(path.dirname(at), { recursive: true });
  writeWhole(at, JSON.stringify(doc) + "\n");
  pauseWrote.set(memo, t);
  return { wrote: true, t };
}

/* A box answer's envelope, its six fields taken by name in the order openAnswerLead reads them (as statsEnvelopeByName does
   for stats.estat), or null where the file is not one. */
const BOX_ENVELOPE = ["format", "kind", "team", "keyId", "enc", "ct"];
function boxEnvelopeAt(file) {
  let env;
  try { env = parseJson(fs.readFileSync(file, "utf8")); } catch { return null; }
  if (!env || typeof env !== "object" || Array.isArray(env) || env.kind !== Engine.answerLeadRules().ANSWER_LEAD_KIND) return null;
  const out = {};
  for (const k of BOX_ENVELOPE) out[k] = env[k];
  return out;
}
/* The lead's box private key where `box` gives one: the key, or a function answering it, called only for a box envelope, since
   opening the box can cost a key derivation. */
function boxKeyOf(box) {
  try { return (typeof box === "function" ? box() : box) || null; } catch { return null; }
}
/* An answer the desk sealed to the lead's box, opened with the box's private key, else null. */
function openLeadBoxed(file, deskId, box) {
  const env = boxEnvelopeAt(file);
  if (!env || !box) return null;
  const key = boxKeyOf(box);
  if (!key) return null;
  const R = Engine.answerLeadRules();
  const text = R.openAnswerLead(key, env, String(deskId));
  if (typeof text !== "string") return null;
  try {
    const inner = parseJson(text);
    return inner && typeof inner === "object" && !Array.isArray(inner) ? inner : null;
  } catch { return null; }
}
/* A box answer waiting on a box this Studio cannot open now: none given, or a key that does not come (locked). Such a row
   waits; it is not a copy that failed to open. */
function boxLocked(folder, deskId, box) {
  if (!boxEnvelopeAt(path.join(path.resolve(String(folder || "")), "desks", String(deskId), "catalog-answer.ec"))) return false;
  return !box || !boxKeyOf(box);
}
/** Whether any desk with an ask in `folder` has answered it with a box envelope: the shell asks the vault for the lead's box
 *  only then. */
function boxAnswerWaits(folder) {
  const root = path.resolve(String(folder || ""));
  let names = [];
  try { names = fs.readdirSync(path.join(root, "catalog-asks")).filter((n) => n.endsWith(".json")); } catch { return false; }
  return names.some((n) => DESK_ID.test(n.slice(0, -5)) && !!boxEnvelopeAt(path.join(root, "desks", n.slice(0, -5), "catalog-answer.ec")));
}
function openAnswer(folder, deskId, teamKeys, box) {
  const file = path.join(path.resolve(String(folder || "")), "desks", String(deskId), "catalog-answer.ec");
  const got = openSealedAt(file, teamKeys), sealed = got ? got.inner : null;
  const inner = sealed || openLeadBoxed(file, deskId, box); /* plant:s0-st-lead */
  if (!inner || inner.kind !== ANSWER_KIND || !inner.catalog || typeof inner.catalog !== "object") return null;
  return { sha256: String(inner.sha256 || ""), catalog: inner.catalog, boxed: !sealed, doc: inner, epoch: got ? got.epoch : null };
}

/* THE ASK IS THIS STUDIO'S OWN: an ask for this desk, signed by the lead key the caller names (`lead`, { keyId, public }
   from the team this Studio leads), over the bytes the desk's askFresh checks. */
function askSigned(ask, deskId, lead) {
  if (!ask || typeof ask !== "object" || ask.kind !== ASK_KIND || String(ask.desk || "") !== deskId) return false; /* plant:txcu-890sn-6 */
  const sig = ask.sig && typeof ask.sig === "object" ? ask.sig : {};
  const pub = String(lead && lead.public || ""), value = String(sig.value || "");
  if (sig.alg !== "Ed25519" || !lead || String(sig.keyId || "") !== String(lead.keyId || "")) return false;
  if (!/^[0-9a-f]{64}$/.test(pub) || !/^[0-9a-f]{128}$/.test(value)) return false;
  try {
    const key = crypto.createPublicKey({ key: Buffer.concat([SPKI_ED25519, Buffer.from(pub, "hex")]), format: "der", type: "spki" });
    return crypto.verify(null, askSignedBytes(ask), key, Buffer.from(value, "hex"));
  } catch { return false; }
}

/* WHICH ANSWER MAY LAND (board 890, the test architect's condition C1 of 2026-10-14). An answer is sealed for the team, or to
   the lead's box, whose public half the team file carries, and anyone who can write the share can write an ask, so what the
   files carry is checked beside who signed them. An answer lands only where all of this holds:
   - it is signed by its desk's roster key over the ask and the team it answers, under either seal (board 962, stages 0 and 0b);
   - under the team key, it is at the team's current key (`epoch`), unless the removal record holds it, and about a catalog
     the team lists (`catalogs`); about a catalog the team does not list, the answer carries `content`, the time its agent was
     told, which no desk before board 1014 does;
   - the ask it answers is this Studio's own, signed by its lead key for this desk;
   - its catalog is the catalog it names: the pin of the catalog, by the desk's own signedSha, is the answer's sha256;
   - and that pin is one a trusted hand put down: the pin the lead signed into the ask, or the pin in this desk's own
     signed in-use file, for a desk on the current roster (a desk answers with what it has loaded now, which may have
     moved on since the ask).
   The reason, or "" where it may land. Nothing is removed for a refusal: the file stays where it is. */
function answerRefusal(ask, ans, deskId, o) {
  /* An ask past its seven days, or one the lead's signed withdrawal names, answers nothing, put back beside its answer or not. */
  const until = Date.parse(String(ask && ask.expires || ""));
  if (!(Number.isFinite(until) && until > Date.now())) return "an ask past its seven days"; /* plant:s0b-st-live */
  if (askWithdrawnBy(o.folder, deskId, ask, o.lead)) return "an ask the lead has withdrawn"; /* plant:s0b-st-withdrawn */
  const kind = ans.boxed ? "a box answer" : "a team-key answer";
  /* What the removal record holds is owed only inside the seven days after the removal (removalGrace); past them it is a
     desk's word from outside the team, refused by name where the roster no longer gives its key. */
  const owed = o.owed === true && removalGrace(ownKey(o.removed, deskId) ? o.removed[deskId] : null, Date.now()); /* plant:f4b-owed-grace */
  if (o.owed === true && !owed && !ownKey(o.deskKeys, deskId)) /* plant:f4b-said */
    return kind + " from a desk since removed, outside the seven days after its removal";
  if (!Engine.answerLeadRules().answerLeadGenuine(ans.doc, deskId, deskKeyOf(o, deskId, owed))) /* plant:s0-st-sig */
    return kind + " not signed by this desk's roster key";
  if (String(ans.doc.ask) !== String(ask && ask.id || "")) return kind + " signed for another ask"; /* plant:s0-st-ask */
  if (String(ans.doc.team) !== String(o.team || "")) return kind + " signed for another team"; /* plant:s0-st-team */
  /* A copy the removal record holds as stored before the desk left, inside its seven days (owed, above), keeps its key number. */
  if (!ans.boxed && ans.epoch !== o.epoch && !owed) return "a team-key answer under a retired key number"; /* plant:s0b-st-epoch */
  /* Listed where the first catalog of the chain the desk signed is on the team's list (board 962, stage 3); an answer with no chain,
     from a desk before it, where the catalog's id or the id it grew from is (Claude alpha's ruling of 2026-11-08), so a copy deeper
     than one hop is refused here rather than let through. */
  const chain = signedChain(ans.doc, ans.catalog);
  if (chain === false) return kind + " whose chain does not match its catalog"; /* plant:s3-st-chain */
  const grewId = ans.catalog.grew && typeof ans.catalog.grew === "object" ? String(ans.catalog.grew.id || "") : "";
  const listed = Array.isArray(o.catalogs) && (chain ? o.catalogs.indexOf(chain[chain.length - 1]) >= 0 /* plant:s3-st-chain-listed */
    : o.catalogs.indexOf(String(ans.catalog.id || "")) >= 0 || (!!grewId && o.catalogs.indexOf(grewId) >= 0)); /* plant:s0b-st-grew-listed */
  if (!ans.boxed && !listed) return "a team-key answer about a catalog the team does not list"; /* plant:s0b-st-listed */
  /* The desk seals to the box only what it judged unlisted, so a box answer carries the time its agent was told, whatever Studio's list says. */
  const behind = ans.boxed || !listed; /* plant:s3-st-box-switch */
  if (behind && !toldStamp(ans.doc.content)) return "a catalog the team does not list, answered with no told stamp"; /* plant:b1014-st-told */
  const claimed = String(ans.sha256 || "");
  let pin = "";
  try { pin = Engine.deskRules().signedSha(ans.catalog); } catch { pin = ""; }
  if (!askSigned(ask, deskId, o.lead)) return "the ask it answers is not this Studio's own"; /* plant:txcu-890sn */
  if (!pin || pin !== claimed) return "its catalog is not the catalog it names"; /* plant:txcu-890sn-2 */
  if (claimed !== String(ask.sha256 || "") && claimed !== inUsePin(o.folder, deskId, o.roster, o.teamKeys, o.ledger)) /* plant:txcu-890sn-3 */
    return "its catalog is neither the one asked for nor the one the desk says it uses";
  return "";
}
/* The grew chain a desk signed into what it sent (board 962, stage 3): its ids, the catalog first and its first catalog last, as
   the desk's lineageOf gives them. The chain; null where none was sent (a desk before stage 3); false where it does not start at
   the catalog it came with and go on to the id that catalog grew from. */
function signedChain(doc, catalog) {
  if (!doc || typeof doc !== "object" || !Object.prototype.hasOwnProperty.call(doc, "chain")) return null;
  const c = doc.chain;
  if (!Array.isArray(c) || !c.length || c.length > CHAIN_MAX || !c.every((x) => typeof x === "string" && !!x)) return false;
  if (new Set(c).size !== c.length) return false;
  const id = catalog && typeof catalog.id === "string" ? catalog.id : "";
  const g = catalog && catalog.grew && typeof catalog.grew === "object" && typeof catalog.grew.id === "string" ? catalog.grew.id : "";
  if (!id || c[0] !== id) return false;
  if (g && g !== id ? c[1] !== g : c.length !== 1) return false; /* plant:s3-st-chain-hop */
  return c;
}
/* A box copy's envelope, its six fields taken by name in the order openBranchLead reads them, or null. */
function copyEnvelopeAt(file) {
  let env;
  try { env = parseJson(fs.readFileSync(file, "utf8")); } catch { return null; }
  if (!env || typeof env !== "object" || Array.isArray(env) || env.kind !== Engine.branchLeadRules().BRANCH_LEAD_KIND) return null;
  const out = {};
  for (const k of BOX_ENVELOPE) out[k] = env[k];
  return out;
}
function copyFilesOf(folder, deskId) {
  const dir = path.join(path.resolve(String(folder || "")), "desks", String(deskId));
  let names = [];
  try { names = fs.readdirSync(dir).filter((n) => COPY_FILE.test(n)).sort(); } catch { names = []; }
  return names.map((n) => ({ ref: COPY_FILE.exec(n)[1], file: path.join(dir, n) }));
}
/** Whether any of `deskIds` has a working copy sealed to the lead's box in `folder`: the shell asks the vault for the box only then. */
function boxCopyWaits(folder, deskIds) {
  return (Array.isArray(deskIds) ? deskIds : []).some((d) => DESK_ID.test(String(d))
    && copyFilesOf(folder, d).some((c) => !!copyEnvelopeAt(c.file)));
}
/** A teammate's working copies sealed to the lead's box (board 962, stage 3), read for a desk the roster's keys (`o.deskKeys`) name,
 *  with the box (`o.box`, its private key or a function answering it). A copy is read only where the desk's signed statement in it
 *  names this team (`o.team`) and carries a told stamp, its chain matches its file, and the file is that desk's own under the name it
 *  was found by. { copies: [{ ref, title, rev, edition, catalog }],
 *  locked, refused: [{ ref, why }] }; nothing is removed for a refusal. */
function boxCopiesOf(folder, deskId, o) {
  const opts = o || {}, out = { copies: [], locked: false, refused: [] };
  const desk = String(deskId || "");
  if (!DESK_ID.test(desk)) return out;
  const own = !!opts.deskKeys && typeof opts.deskKeys === "object" && Object.prototype.hasOwnProperty.call(opts.deskKeys, desk);
  const keyHex = own ? String(opts.deskKeys[desk] || "") : "";
  if (!keyHex) return out; /* plant:s3-st-copy-roster */
  const files = copyFilesOf(folder, desk).map((c) => Object.assign(c, { env: copyEnvelopeAt(c.file) })).filter((c) => !!c.env);
  if (!files.length) return out;
  const key = opts.box ? boxKeyOf(opts.box) : null;
  if (!key) { out.locked = true; return out; }
  const R = Engine.branchLeadRules(), D = Engine.deskRules();
  const best = new Map();
  files.forEach((c) => {
    const no = (why) => { out.refused.push({ ref: c.ref, why }); };
    const text = R.openBranchLead(key, c.env, desk);
    if (typeof text !== "string") return no("a copy that does not open under this Studio's box for this desk");
    let doc = null;
    try { doc = parseJson(text); } catch { doc = null; }
    if (!doc || typeof doc !== "object" || doc.kind !== R.BRANCH_LEAD_INNER) return no("a copy that is not a box copy, from a desk before stage 3");
    if (!toldStamp(doc.content)) return no("a copy that carries no told stamp"); /* plant:b1014-st-copy-told */
    if (!R.branchLeadGenuine(doc, desk, keyHex)) return no("a copy not signed by this desk's roster key"); /* plant:s3-st-copy-sig */
    if (String(doc.team) !== String(opts.team || "")) return no("a copy signed for another team"); /* plant:s3-st-copy-team */
    const file = doc.file;
    if (!signedChain(doc, file)) return no("a copy whose chain does not match its file"); /* plant:s3-st-copy-chain */
    if (!D.deskFileGenuine(file, desk) || !String(file.id || "").endsWith("-" + c.ref)) /* plant:s3-st-copy-file */
      return no("a copy that is not this desk's own file under this name");
    const copy = { ref: c.ref, title: typeof file.name === "string" ? file.name : "",
      rev: Number.isFinite(+file.rev) ? +file.rev : 0, edition: typeof file.date === "string" ? file.date : "", catalog: file };
    let mtime = 0;
    try { mtime = fs.statSync(c.file).mtimeMs; } catch { mtime = 0; }
    /* One copy per handle: a copy renamed at the desk can leave its old name behind, so the higher rev stands and, on a tie, the
       newer file, as collapseProposals keeps a listed copy. Import then never takes the stale one. */
    const was = best.get(c.ref);
    if (!was || copy.rev > was.copy.rev || (copy.rev === was.copy.rev && mtime > was.mtime)) best.set(c.ref, { copy, mtime }); /* plant:s3-st-copy-one */
  });
  out.copies = Array.from(best.values()).map((b) => b.copy);
  return out;
}
function askWithdrawnBy(folder, deskId, ask, lead) {
  let doc = null;
  try { doc = parseJson(fs.readFileSync(withdrawnPath(folder, deskId), "utf8")); } catch { return false; }
  return !!ask && withdrawnGenuine(doc, deskId, lead) && doc.ids.indexOf(String(ask.id || "")) >= 0;
}
/* The roster's key for a desk (`deskKeys`, {desk id: key hex}), or the key a removal record kept for it, for a copy that record
   holds as stored before the desk left, inside the removal's seven days (`owed`, answerRefusal), and nothing else. */
function deskKeyOf(o, deskId, owed) {
  if (ownKey(o.deskKeys, deskId)) return String(o.deskKeys[deskId] || "");
  return owed === true && ownKey(o.removed, deskId) && o.removed[deskId] ? String(o.removed[deskId].key || "") : ""; /* plant:s0b-st-owed-key */
}
function ownKey(m, key) { return !!m && typeof m === "object" && Object.prototype.hasOwnProperty.call(m, key); }
/* THE REMOVAL'S SEVEN DAYS (Argon's F4b on stage 0b; the test architect's follow-up of 2026-11-08 10:19, "F4b no 7-day bound
   on `o.owed` (pre-0b)"). A copy a desk stored while trusted reaches the lead for as long as the relay keeps a removed desk's
   blobs for the lead, REMOVED_KEEP_MS as the pinned engine states it, counted from the removal record's `at` (this Studio's
   own clock when it removed the desk, src/team-store.mjs markRemoved). Fails closed: no time, a time stamped ahead of the
   clock beyond the relay's own allowance (REMOVED_CLOCK_AHEAD_MS), or a pin without either constant holds the grace shut.
   The statistics a removal keeps (src/removed.mjs) are a record, not a landing, and are not bounded here. */
function removalGrace(rec, now) {
  let keep = NaN, ahead = NaN;
  try { const C = Engine.relayRules().channel; keep = Number(C.REMOVED_KEEP_MS); ahead = Number(C.REMOVED_CLOCK_AHEAD_MS); }
  catch { return false; }
  const at = rec && typeof rec.at === "number" ? rec.at : NaN;
  if (!(Number.isFinite(at) && keep > 0 && ahead >= 0)) return false;
  return now <= at + keep && at <= now + ahead; /* plant:f4b-window */
}
function inUsePin(folder, deskId, roster, teamKeys, ledger) {
  if (!rosterOf(roster).some((r) => r.id === deskId)) return ""; /* plant:txcu-890sn-4 */
  const inner = inUseOf(folder, deskId, teamKeys); /* plant:txcu-890sn-5 */
  const held = acceptUse(inner, deskId, ledger);
  const pin = held && held.catalog ? String(held.catalog.sha256 || "") : "";
  return PIN_RE.test(pin) ? pin : "";
}

/** Asks that have an answer which may land (answerRefusal) and have not been landed, each with the title the desk's in-use
 *  file gives its catalog, which names the project it lands as. `o` = { roster, lead, refused, removed, box, deskKeys, team }:
 *  the current roster, this Studio's lead key { keyId, public }, a list that hears { desk, why } for each answer held back,
 *  the removal record (src/team-store.mjs removedOf) for a desk the roster has left off, the lead's box private key (or a
 *  function answering it) for an answer sealed to the box, and for that answer's signature the roster's keys
 *  ({desk id: key hex}) and the team's id. Without a lead key nothing
 *  is due. `movedOn` is the answer's pin differing from the asked one. A roster the caller does not name keeps the
 *  older reading. */
function answersDue(folder, teamKeys, ledger, o) {
  const opts = o || {};
  const root = path.resolve(String(folder || ""));
  const dir = path.join(root, "catalog-asks");
  let names = [];
  try { names = fs.readdirSync(dir).filter((n) => n.endsWith(".json")); } catch { return []; }
  const done = (ledger && ledger.done) || {};
  /* A desk the loaded roster leaves off is owed only the copy this Studio can place before the removal. */
  const owedOff = Array.isArray(opts.roster) ? removedHeld(root, opts.removed) : null;
  const out = [];
  names.forEach((n) => {
    const desk = n.slice(0, -5);
    if (!DESK_ID.test(desk)) return;
    let ask = null;
    try { ask = parseJson(fs.readFileSync(path.join(dir, n), "utf8")); } catch { ask = null; }
    if (!ask || done[String(ask.id || "")]) return;
    const ans = openAnswer(root, desk, teamKeys, opts.box);
    if (!ans) return;
    /* A copy this Studio already could not open as a catalog is not tried again until the desk writes another. */
    if (unopenedOf(ledger, String(ask.id || ""), ans)) return; /* plant:txau-skip */
    const owed = !!owedOff && !!owedOff[desk] && !!owedOff[desk]["desks/" + desk + "/catalog-answer.ec"];
    const why = answerRefusal(ask, ans, desk, { folder: root, roster: opts.roster, lead: opts.lead, teamKeys, ledger,
      deskKeys: opts.deskKeys, removed: opts.removed, team: opts.team, epoch: opts.epoch, catalogs: opts.catalogs,
      owed });
    if (why) { if (Array.isArray(opts.refused)) opts.refused.push({ desk, why }); return; } /* plant:s2-answer */
    /* The ask's own pin does not by itself owe a desk the loaded roster has left off: only the copy this Studio
       took before the removal (src/removed.mjs). What the desk uses now stays the in-use check above. */
    if (owedOff && !rosterOf(opts.roster).some((r) => r.id === desk) && String(ans.sha256 || "") === String(ask.sha256 || "")) {
      const rel = "desks/" + desk + "/catalog-answer.ec";
      if (!(owedOff[desk] && owedOff[desk][rel])) return; /* plant:s2-owe */
    }
    const asked = String(ask.sha256 || "");
    /* The in-use title names the project only where the in-use file pins the very copy that came back: a desk that has
       moved on since its answer would otherwise lend its newer catalog's title to the older copy (the test architect's
       condition 1 on 27a7110). */
    const use = acceptUse(inUseOf(root, desk, teamKeys), desk, ledger);
    const named = use && use.catalog && String(use.catalog.sha256 || "") === String(ans.sha256 || ""); /* plant:txin-in6 */
    out.push({
      desk, askId: String(ask.id || ""), asked, sha256: ans.sha256, catalog: ans.catalog,
      movedOn: ans.sha256 !== asked, /* plant:txcu-890sl */
      title: named && typeof use.catalog.title === "string" ? use.catalog.title : "", /* plant:txin-in4 */
    });
  });
  return out;
}

/** The landing refused the copy that came back as not a catalog it can open (landCatalog's `unopened`): recorded in the
 *  ledger against the ask and the copy, so the row says the desk answered and the same copy is not landed again. True
 *  where it was recorded; any other failure is not this, and is left as it was. */
function noteUnopened(ledger, item, err) {
  if (!ledger || !item || !err || !err.unopened) return false;
  ledger.unopened = ledger.unopened || {};
  ledger.unopened[String(item.askId || "")] = { desk: String(item.desk || ""), sha256: String(item.sha256 || ""),
    why: err.unopened.why && typeof err.unopened.why.frame === "string" ? err.unopened.why : null };
  return true;
}

function fileStamp(at) {
  try {
    const s = fs.statSync(at);
    return s.size + ":" + Math.round(s.mtimeMs);
  } catch (e) { return e && e.code === "ENOENT" ? "-" : "?"; }
}
/* A desk folder's working copies as one stamp, each copy's name, size and time (board 962, stage 3), "-" where there is none. */
function copiesStamp(dir) {
  let names = [];
  try { names = fs.readdirSync(dir).filter((n) => COPY_FILE.test(n)).sort(); } catch (e) { return e && e.code === "ENOENT" ? "-" : "?"; }
  return names.length ? names.map((n) => n + "=" + fileStamp(path.join(dir, n))).join(",") : "-";
}

/* One line per folder, for the life of this process. A second arm of a folder that already failed
   says nothing again: the five-minute pass is the fallback, and a screen read must not repeat the line. */
const armLogged = new Set();
function logArmFailure(folder, err) {
  const at = path.resolve(String(folder || ""));
  if (armLogged.has(at)) return; /* plant:txjl-8jlb-2 */
  armLogged.add(at);
  process.stderr.write("studio  the desk watch could not arm on " + at + ": " + String(err && err.message || err) + "\n");
}

/* A watcher that stops on an error after it armed is said once per folder too, in its own words. */
const stopLogged = new Set();
function logWatchStop(folder, err) {
  const at = path.resolve(String(folder || ""));
  if (stopLogged.has(at)) return; /* plant:txjl-8jld-2 */
  stopLogged.add(at);
  process.stderr.write("studio  the desk watch stopped on " + at + ": " + String(err && err.message || err) + "\n");
}

/** Watch desks/ and report the desks whose in-use file, answer file, join.json, stats.estat or working copies changed stamp.
 *  The first look only remembers the stamps, so a later write is the event. `o.settle` is the quiet
 *  gap, in milliseconds, before that look (the desk's own ask watch uses 300). A join.json is
 *  named beside the two catalog files, and the second argument is `{ join: [desk ids] }` for the
 *  desks whose request file moved, so the shell can take the team watch at once.
 *  THE TEAM FOLDER ITSELF IS WATCHED TOO, not recursively: a team no desk has asked to join yet has
 *  no desks/, and the request that makes desks/ must not wait for a focus, a pass or a screen read.
 *  When desks/ appears, it is armed and looked at as a change, so that first request is reported
 *  rather than taken as the baseline; when desks/ goes away, its watch is dropped until it comes
 *  back. When nothing can arm (the folder itself is away), that is said once, with this folder and
 *  the error, and the handle still closes; a watcher that stops on an error is said once as well.
 *  The five-minute pass remains the fallback. `o.watch` stands in for fs.watch in a leg. */
function watchFolder(folder, onChange, o) {
  const root = path.resolve(String(folder || ""));
  const desks = path.join(root, "desks");
  const settle = o && Number.isFinite(+o.settle) ? +o.settle : 300;
  const watchFn = o && typeof o.watch === "function" ? o.watch : fs.watch;
  const memo = new Map();
  let timer = null, watcher = null, rootWatcher = null, closed = false;
  const scan = (report) => {
    let ids = [];
    try { ids = fs.readdirSync(desks).filter((n) => DESK_ID.test(n)); } catch { ids = []; }
    const moved = [];
    const joins = [];
    ids.forEach((id) => {
      const look = (name, now) => {
        const key = id + "/" + name;
        /* A file that is not there is not a move. A join.json that appears, or whose stamp
           changes, is, and the shell's team watch then admits and repaints. */
        if (!memo.has(key) && (now === "-" || now === "?")) memo.set(key, now);
        if (report && memo.get(key) !== now) moved.push(id); /* plant:txcu-890sd */
        if (report && name === "join.json" && memo.get(key) !== now) joins.push(id);
        memo.set(key, now);
      };
      ["in-use.ec", "catalog-answer.ec", "join.json", "stats.estat"].forEach((name) => look(name, fileStamp(path.join(desks, id, name)))); /* plant:txjl-8jla */
      /* The desk's working copies sealed to the lead's box (board 962, stage 3): one written, rewritten or removed alone is a move. */
      look("copies", copiesStamp(path.join(desks, id))); /* plant:s3-st-copy-watch */
    });
    return { ids: Array.from(new Set(moved)), join: Array.from(new Set(joins)) };
  };
  const run = () => {
    const moved = scan(true);
    if (moved.ids.length && typeof onChange === "function") onChange(moved.ids, { join: moved.join });
  };
  const schedule = () => {
    clearTimeout(timer);
    timer = setTimeout(run, settle);
  };
  const armDesks = (late) => {
    if (closed || watcher) return null;
    let w = null;
    try { w = watchFn(desks, { recursive: true }, schedule); } catch (err) { return err; }
    watcher = w;
    w.on("error", (err) => {
      if (watcher !== w) return;
      try { w.close(); } catch { /* already gone */ }
      watcher = null; /* plant:txjl-8jld */
      logWatchStop(folder, err);
    });
    if (late) schedule(); /* plant:txjl-8jlc-2 */
    return null;
  };
  const onRoot = () => {
    if (closed) return;
    let there = false;
    try { there = fs.statSync(desks).isDirectory(); } catch { there = false; }
    if (there && !watcher) armDesks(true); /* plant:txjl-8jlc */
    else if (!there && watcher) { try { watcher.close(); } catch { /* already gone */ } watcher = null; }
  };
  scan(false);
  armDesks(false);
  let rootErr = null;
  try {
    const r = watchFn(root, { recursive: false }, onRoot);
    rootWatcher = r;
    r.on("error", (err) => {
      if (rootWatcher !== r) return;
      try { r.close(); } catch { /* already gone */ }
      rootWatcher = null;
      logWatchStop(folder, err);
    });
  } catch (err) { rootErr = err; rootWatcher = null; }
  if (!watcher && !rootWatcher) logArmFailure(folder, rootErr); /* plant:txjl-8jlb */
  return {
    close() {
      closed = true;
      clearTimeout(timer);
      if (watcher) { try { watcher.close(); } catch { /* already gone */ } watcher = null; }
      if (rootWatcher) { try { rootWatcher.close(); } catch { /* already gone */ } rootWatcher = null; }
    },
    /* False where nothing armed, or every watcher has closed on an error since: the handle then watches nothing. */
    armed() { return !!(watcher || rootWatcher); },
  };
}

/** The watches worth keeping. A handle that did not arm, or whose watcher closed on an error since, is
 *  closed and taken out of `watchers`, so the next pass arms that folder again: a team folder no desk has
 *  asked to join yet has no desks/, and a share may be away when Studio starts. The keys taken out. */
function dropUnarmed(watchers) {
  const out = [];
  for (const [key, h] of Array.from(watchers)) {
    if (h && typeof h.armed === "function" && h.armed()) continue; /* plant:txjl-8jlc-3 */
    try { if (h) h.close(); } catch { /* already gone */ }
    watchers.delete(key);
    out.push(key);
  }
  return out;
}

/** Where a live report goes. A join.json takes `admit`, the call the focus pass and the five-minute
 *  pass already make, so the admission and the Desks repaint stay on that path. Any other file
 *  takes `land`. One report is one call. */
function routeWatch(detail, admit, land) {
  if (detail && Array.isArray(detail.join) && detail.join.length) { /* plant:txjl-8jla-2 */
    if (typeof admit === "function") admit(detail.join);
    return "admit";
  }
  if (typeof land === "function") land();
  return "land";
}

export { listUses, notTaken, forPage, attachUses, buildAsk, askShape, REFUSAL_COPY_GONE, signedChain, boxCopiesOf, boxCopyWaits, writeAsk, withdrawAsk, openAnswer, answersDue, boxAnswerWaits, noteUnopened, watchFolder, dropUnarmed,
  routeWatch, askSignedBytes, noteTeamPause, admitOpen, classify, editionsOf };
