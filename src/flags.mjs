/* DESK CARD FLAGS: read and validated from rostered genuine desk files, grouped per card,
 * settled when kept or when an edition moves, and carried in answered for 12 editions after first carry.
 * British English, no em or en dashes.
 */
import fs from "node:fs";
import path from "node:path";
import * as Engine from "./engine.mjs";
import { deskOf, openedDeskFile, deskLabel, deskFilesIn, recordFlagKept } from "./review.mjs";
import { removedHeld } from "./removed.mjs";
import { conflictSiblingName } from "./team.mjs";
import { folderHere } from "./team-store.mjs";
import { readJson, jsonText as json } from "./plain-json.mjs";
import { writeWhole } from "./whole-write.cjs";
import { catalogFromText } from "./diff.mjs";

const FLAGS_FILE = "flags.json";
const FLAGS_KIND = "etiuda-studio-flags";
const FLAG_CAP = 100;
const ANSWER_EDITIONS_AFTER = 12; /* plant:flag-edition-bound */
const NOTE_CAP = 500; /* plant:flag-validate-note-cap */
const CONTROL_RE = /[\u0000-\u001f\u007f]/; /* plant:flag-validate-control */
const SEEN_RE = /^[0-9a-f]{64}$/;
const R_RE = /^[0-9a-f]{32}$/;
const REQUIRED_KEYS = ["card", "lang", "seen", "r"];
const ALLOWED_KEYS = new Set(["card", "lang", "seen", "r", "note"]);

/** Switch for the Review screen: on together with the Review stack's flag item. */
let FLAGS_IN_REVIEW_COUNT = true; /* plant:flag-count-switch-off */

function flagsInReviewCount() {
  return FLAGS_IN_REVIEW_COUNT;
}

function setFlagsInReviewCount(on) {
  FLAGS_IN_REVIEW_COUNT = !!on;
}

/** SHA-256 of the canonical card words in `lang`, computed through the pinned engine's own rules. */
function flagSeenOfCard(card, lang) {
  const R = Engine.flagRules();
  const code = String(lang || "");
  const str = (map) => (map && typeof map === "object" && !Array.isArray(map) && typeof map[code] === "string"
    ? map[code] : "");
  const shaped = card && (card.bodyShape === "steps" || card.bodyShape === "alts") ? card.bodyShape : "plain";
  const rawBody = str(card && card.body);
  const body = shaped !== "plain" && rawBody ? R.v2Unmark(rawBody) : rawBody;
  return R.flagWordsHash({
    t: str(card && card.title),
    body,
    note: str(card && card.note),
    alt: shaped !== "plain" ? 1 : 0,
    seq: shaped === "steps" ? 1 : 0,
  }, "en");
}

/** SHA-256 of `"etiuda-flag\n" + r`, computed through the pinned engine's own rule. */
function flagDigest(r) {
  return Engine.flagRules().flagDigest(r);
}

/** Validate a desk file's `flags` array. Breaks any rule -> ignore whole list and log one line with desk id and rule, never the note. */
function validateDeskFlags(flags, deskId, cardIds) {
  if (flags === undefined) return { ok: true, flags: [], reason: null };
  const fail = (reason) => {
    process.stderr.write("studio  desk " + String(deskId || "") + " flags ignored: " + reason + "\n");
    return { ok: false, flags: [], reason };
  };
  if (!Array.isArray(flags)) return fail("not an array");
  if (flags.length > FLAG_CAP) return fail("too long (" + flags.length + ")");
  const out = [];
  for (let i = 0; i < flags.length; i++) {
    const e = flags[i];
    if (!e || typeof e !== "object" || Array.isArray(e)) return fail("entry " + i + " not an object");
    const keys = Object.keys(e);
    for (let k = 0; k < REQUIRED_KEYS.length; k++) {
      if (!Object.prototype.hasOwnProperty.call(e, REQUIRED_KEYS[k])) return fail("missing " + REQUIRED_KEYS[k]);
    }
    for (let k = 0; k < keys.length; k++) {
      if (!ALLOWED_KEYS.has(keys[k])) return fail("extra key " + keys[k]);
    }
    if (typeof e.card !== "string" || !cardIds.has(e.card)) return fail("unknown card"); /* plant:flag-unknown-card */
    if (typeof e.lang !== "string" || !e.lang || CONTROL_RE.test(e.lang)) return fail("bad lang");
    if (typeof e.seen !== "string" || !SEEN_RE.test(e.seen)) return fail("bad seen");
    if (typeof e.r !== "string" || !R_RE.test(e.r)) return fail("bad r");
    let note = "";
    if (Object.prototype.hasOwnProperty.call(e, "note")) {
      if (typeof e.note !== "string") return fail("bad note");
      if (e.note.length > NOTE_CAP) return fail("note too long");
      if (CONTROL_RE.test(e.note)) return fail("note control character");
      note = e.note;
    }
    const rec = { card: e.card, lang: e.lang, seen: e.seen, r: e.r };
    if (note) rec.note = note;
    out.push(rec);
  }
  return { ok: true, flags: out, reason: null };
}

/** True when `deskId` is still held by the roster (neither marked removed nor dropped from a team file's roster). */
function deskAllowedForFlags(deskId, gone, teamRoster) {
  const dropped = !!gone || (teamRoster !== null && !teamRoster.has(String(deskId))); /* plant:flag-drop-removed */
  return !dropped;
}

/** Read the project's flag settlement store (`flags.json`). Holds only `{ f, o, left }`, never notes or times. */
function readFlagStore(dir) {
  const at = path.join(path.resolve(String(dir || "")), FLAGS_FILE);
  const empty = { kind: FLAGS_KIND, schema: 1, answered: [] };
  if (!fs.existsSync(at)) return empty;
  try {
    const raw = readJson(at);
    if (!raw || typeof raw !== "object" || Array.isArray(raw) || !Array.isArray(raw.answered)) return empty;
    const answered = raw.answered
      .filter((e) => e && typeof e === "object" && !Array.isArray(e)
        && SEEN_RE.test(String(e.f || ""))
        && (e.o === "kept" || e.o === "changed")
        && Number.isInteger(e.left) && e.left >= 0)
      .map((e) => ({ f: e.f, o: e.o, left: e.left }));
    return { kind: FLAGS_KIND, schema: 1, answered };
  } catch { return empty; }
}

function writeFlagStore(dir, store) {
  const at = path.join(path.resolve(String(dir || "")), FLAGS_FILE);
  const clean = {
    kind: FLAGS_KIND,
    schema: 1,
    answered: (store.answered || []).slice().sort((a, b) => (a.f < b.f ? -1 : a.f > b.f ? 1 : 0))
      .map((e) => ({ f: e.f, o: e.o, left: e.left })),
  };
  writeWhole(at, json(clean));
}

function settledSetOf(store) {
  const settled = new Set((store && Array.isArray(store.answered) ? store.answered : []).map((e) => e.f)); /* plant:flag-keep-store */
  return settled;
}

function unsettledDeskFlags(validFlags, settled) {
  return (validFlags || []).filter((e) => !settled.has(flagDigest(e.r)));
}

/** Group unsettled flags across desks into one waiting item per card. */
function aggregateWaitingFlags(entries, cardsById) {
  const groups = new Map();
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const deskName = entry.deskName !== undefined ? String(entry.deskName || "").trim() : "";
    for (let j = 0; j < entry.flags.length; j++) {
      const rec = entry.flags[j];
      const key = rec.card; /* plant:flag-group-card */
      let g = groups.get(key);
      if (!g) {
        g = { card: rec.card, langs: new Set(), desks: new Map(), changed: false, notes: [] };
        groups.set(key, g);
      }
      g.langs.add(rec.lang);
      if (!g.desks.has(entry.deskId) || (!g.desks.get(entry.deskId) && deskName)) {
        g.desks.set(entry.deskId, deskName);
      }
      const cardObj = cardsById.get(rec.card) || null;
      if (cardObj && flagSeenOfCard(cardObj, rec.lang) !== rec.seen) g.changed = true;
      if (rec.note) {
        g.notes.push({ desk: entry.deskId, label: entry.deskLabel, name: deskName, lang: rec.lang, note: rec.note });
      }
    }
  }
  return Array.from(groups.values())
    .sort((a, b) => (a.card < b.card ? -1 : a.card > b.card ? 1 : 0))
    .map((g) => {
      const deskList = Array.from(g.desks.entries())
        .map(([id, name]) => ({ id, name }))
        .sort((a, b) => (a.name ? 0 : 1) - (b.name ? 0 : 1)
          || a.name.localeCompare(b.name)
          || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
      return {
        card: g.card,
        langs: Array.from(g.langs).sort(),
        count: g.desks.size,
        changed: g.changed,
        desk: deskList.length ? deskList[0].name : "",
        notes: g.notes.sort((a, b) => a.label.localeCompare(b.label)
          || (a.desk < b.desk ? -1 : a.desk > b.desk ? 1 : 0)
          || (a.lang < b.lang ? -1 : a.lang > b.lang ? 1 : 0)),
      };
    });
}

function readProjectSync(dir) {
  const home = path.resolve(String(dir || ""));
  const project = readJson(path.join(home, "project.json"));
  const draft = readJson(path.join(home, project.draft || "draft.json"));
  return { home, project, draft };
}

function teamRosterSync(folder) {
  if (!folder) return null;
  const T = Engine.teamRules();
  const root = path.resolve(String(folder));
  const at = path.join(root, T.V2_TEAM_FILE);
  let best = null;
  const tryFile = (p) => {
    try {
      const text = fs.readFileSync(p, "utf8").replace(/^\uFEFF/, "");
      const read = T.v2TeamRead(text);
      if (!read || !read.team) return;
      if (!best || read.team.epoch > best.epoch || (read.team.epoch === best.epoch && (read.team.rev | 0) > (best.rev | 0))) {
        best = read.team;
      }
    } catch { /* absent or unreadable */ }
  };
  tryFile(at);
  try {
    for (const name of fs.readdirSync(root).sort()) {
      if (conflictSiblingName(T.V2_TEAM_FILE, name)) tryFile(path.join(root, name));
    }
  } catch { /* ignore */ }
  if (!best || !Array.isArray(best.roster)) return null;
  return new Set(best.roster.map((e) => e && e.desk && e.desk.id).filter(Boolean).map(String));
}

function betterFile(a, b, names) {
  if (a.rev !== b.rev) return a.rev > b.rev;
  const ac = names.some((n) => n !== a.name && conflictSiblingName(n, a.name));
  const bc = names.some((n) => n !== b.name && conflictSiblingName(n, b.name));
  if (ac !== bc) return !ac;
  return a.name < b.name;
}

/** Collect validated, unsettled desk flags for `dir`, picking the winning file per `(desk.id, doc.id)` as `readInbox` does. */
function collectDeskFlags(dir, opts) {
  const o = opts || {};
  const { home, project, draft } = readProjectSync(dir);
  const cardsById = new Map((draft.cards || []).filter((c) => c && c.id).map((c) => [String(c.id), c]));
  const cardIds = new Set(cardsById.keys());
  const ownId = String(draft.id || project.id || "");
  const folder = o.folder ? path.resolve(String(o.folder)) : (folderHere(project, o) || null);
  const store = readFlagStore(home);
  const settled = settledSetOf(store);
  if (!folder) return { home, project, draft, cardsById, store, entries: [] };
  const desks = deskFilesIn(folder);
  if (!desks.length) return { home, project, draft, cardsById, store, entries: [] };
  const D = Engine.deskRules();
  const S = o.teamKeys ? Engine.sealRules() : null;
  const formerly = o.removed ? removedHeld(folder, o.removed) : {};
  const teamRoster = o.teamRoster !== undefined ? o.teamRoster : teamRosterSync(folder);
  const byId = new Map();
  for (let i = 0; i < desks.length; i++) {
    const [rel, file] = desks[i];
    const goneId = String(rel).split("/")[1] || "";
    const gone = !!goneId && Object.prototype.hasOwnProperty.call(formerly, goneId);
    if (gone && !formerly[goneId][rel]) continue;
    let doc = null;
    try { doc = catalogFromText(fs.readFileSync(file, "utf8"), file); } catch { continue; }
    if (S && o.teamKeys) doc = openedDeskFile(doc, file, o.teamKeys, S, null);
    const desk = doc ? deskOf(doc, file, D) : null;
    if (!desk || !desk.grew || desk.grew.id !== ownId) continue;
    if (!deskAllowedForFlags(desk.id, gone, teamRoster)) continue;
    const identity = typeof doc.id === "string" && doc.id ? desk.id + "\n" + doc.id : rel;
    const rev = typeof doc.rev === "number" && Number.isFinite(doc.rev) ? doc.rev : -1;
    const cand = { name: path.basename(file), rev, desk, doc };
    if (!byId.has(identity)) byId.set(identity, []);
    byId.get(identity).push(cand);
  }
  const entries = [];
  for (const list of byId.values()) {
    const names = list.map((x) => x.name);
    let best = list[0];
    for (let i = 1; i < list.length; i++) {
      if (betterFile(list[i], best, names)) best = list[i];
    }
    const validated = best.doc.flags !== undefined ? validateDeskFlags(best.doc.flags, best.desk.id, cardIds) : { ok: true, flags: [] };
    const waiting = unsettledDeskFlags(validated.flags, settled);
    if (waiting.length) {
      entries.push({ deskId: best.desk.id, deskLabel: deskLabel(best.desk), deskName: best.desk.name || "", flags: waiting });
    }
  }
  return { home, project, draft, cardsById, store, entries };
}

/** Piece 2: every flagged card waiting on the lead, one item per card. */
function flagsWaiting(project, opts) {
  const { cardsById, entries } = collectDeskFlags(project, opts);
  return aggregateWaitingFlags(entries, cardsById);
}

/** Piece 3: settle every flag currently waiting on `cardId` as `kept`, remembering each by its `f` and logging the decision. */
function flagKeep(project, cardId, opts) {
  const id = String(cardId == null ? "" : cardId);
  const { home, store, entries } = collectDeskFlags(project, opts);
  const settled = settledSetOf(store);
  const keptF = [];
  const desks = new Set();
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    for (let j = 0; j < entry.flags.length; j++) {
      const rec = entry.flags[j];
      if (rec.card !== id) continue;
      const f = flagDigest(rec.r);
      if (!settled.has(f)) {
        settled.add(f);
        keptF.push(f);
        desks.add(entry.deskLabel);
      }
    }
  }
  if (!keptF.length) return { ok: true, card: id, settled: 0, f: [] };
  const next = store.answered.slice();
  for (let i = 0; i < keptF.length; i++) {
    next.push({ f: keptF[i], o: "kept", left: ANSWER_EDITIONS_AFTER + 1 });
  }
  writeFlagStore(home, { answered: next });
  recordFlagKept(home, id, keptF, Array.from(desks));
  return { ok: true, card: id, settled: keptF.length, f: keptF };
}

/** Compute `{ home, answered, newlyChanged }` for `catalogDoc` (or draft when null). */
function answeredForCatalog(project, catalogDoc, opts) {
  const { home, draft, store, entries } = collectDeskFlags(project, opts);
  const doc = catalogDoc || draft;
  const cardsById = new Map(((doc && doc.cards) || []).filter((c) => c && c.id).map((c) => [String(c.id), c]));
  const byF = new Map();
  const settled = settledSetOf(store);
  for (let i = 0; i < store.answered.length; i++) {
    const e = store.answered[i];
    if (e.left > 0) byF.set(e.f, { f: e.f, o: e.o });
  }
  const newlyChanged = [];
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    for (let j = 0; j < entry.flags.length; j++) {
      const rec = entry.flags[j];
      const f = flagDigest(rec.r);
      if (settled.has(f)) continue;
      const cardObj = cardsById.get(rec.card) || null;
      if (!cardObj) continue;
      const currentSeen = flagSeenOfCard(cardObj, rec.lang);
      if (currentSeen !== rec.seen) { /* plant:flag-changed-lang */
        if (!byF.has(f)) {
          byF.set(f, { f, o: "changed" });
          newlyChanged.push(f);
        }
      }
    }
  }
  const answered = Array.from(byF.values()).sort((a, b) => (a.f < b.f ? -1 : a.f > b.f ? 1 : 0));
  return { home, answered, newlyChanged };
}

/** Piece 4 & 5: what the next edition of `project` would carry in `answered`. */
function flagsAnswered(project, opts) {
  return answeredForCatalog(project, null, opts).answered;
}

/** Update `flags.json` after a published edition lands: decrement carried counts and record newly-changed flags. */
function commitPublishedFlags(dir, newlyChanged) {
  const home = path.resolve(String(dir || ""));
  const store = readFlagStore(home);
  const changed = Array.isArray(newlyChanged) ? newlyChanged : [];
  if (!store.answered.length && !changed.length) return;
  const byF = new Map();
  for (let i = 0; i < store.answered.length; i++) {
    const e = store.answered[i];
    byF.set(e.f, { f: e.f, o: e.o, left: e.left > 0 ? e.left - 1 : 0 });
  }
  for (let i = 0; i < changed.length; i++) {
    const f = changed[i];
    if (!byF.has(f)) byF.set(f, { f, o: "changed", left: ANSWER_EDITIONS_AFTER });
  }
  writeFlagStore(home, { answered: Array.from(byF.values()) });
}

export {
  FLAGS_FILE,
  flagSeenOfCard,
  flagDigest,
  validateDeskFlags,
  deskAllowedForFlags,
  readFlagStore,
  writeFlagStore,
  settledSetOf,
  unsettledDeskFlags,
  aggregateWaitingFlags,
  collectDeskFlags,
  answeredForCatalog,
  commitPublishedFlags,
  flagsInReviewCount,
  setFlagsInReviewCount,
  flagsWaiting,
  flagKeep,
  flagsAnswered,
};
