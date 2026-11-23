/* A LINKED COPY AND THE ONE PRESS THAT BRINGS IT UP TO ITS ORIGINAL (board 962, added 2026-11-08 16:36).
 *
 * One team per Studio catalog. A lead who leads two teams gives the second a linked copy: a catalog of its own, with its
 * own id and its own team, whose project.json records one thing more, the link, `linked`:
 *
 *     { from: <the original's catalog id>, dir: <where the original was last found>,
 *       brought: { rev, edition } | null,         the original's edition last brought here
 *       pending: { file, sha256, base, rev } }    the file the last press put in the inbox, while it waits there
 *
 * "BRING UP TO THE ORIGINAL" IS PRESSED ON THE COPY, RUNS ORIGINAL TO COPY ONLY, AND IS NEVER AUTOMATIC (settled 16:37 by
 * the test architect and the lead engineer). It brings the original's latest published edition, read by the rule
 * carryEdition reads it by (src/publish.mjs latestEdition), into the copy's inbox as a proposal under the copy's own id,
 * so the existing review queue decides it row by row and nothing lands in the draft unasked. Nothing published moves: not
 * the copy's archive, not its place, not the original.
 *
 * THE COPY'S OWN EDITS ARE NEVER OVERWRITTEN, BECAUSE THE REVIEW IS GIVEN THE RIGHT BASE. A proposal is read against the
 * copy it was made from (src/review.mjs classify): a row is offered only where the file differs from that base, and is
 * a conflict, held back from Accept all, where the copy's draft moved from it too. For this file the base is the
 * original's edition last brought here, kept byte for byte under `linked/` in the copy's folder, and src/review.mjs asks
 * syncOf below for it. So a change made in the original since the last press is a row, a change made only in the copy is
 * no row at all, and a field both changed is a conflict. With no base yet (a copy made before the original ever
 * published) every change and removal is a conflict, which is the queue's own rule for a file of unknown origin.
 *
 * THE BASE IS THE EDITION THE COPY HAS SEEN, not merely the last one brought: while an earlier press's file still waits
 * undecided in the inbox, a second press replaces it and keeps that file's base, since the copy never took in what it
 * offered. Only the file this program wrote, by its name and its sha256 as recorded, is read against the link's base; a
 * file dropped into the inbox under the same name is an ordinary proposal.
 *
 * A PRESS WITH NOTHING NEW DOES NOTHING: no file, no record, not a byte.
 *
 * THE ORIGINAL IS ONE OF TWO KINDS (board 962, stage 7, V3, 2026-11-09). Beside a catalog in this Studio's own library
 * (`linked.dir`), it may be a catalog of the team this Studio follows as a teammate (src/member.mjs): "Take as a base" makes
 * the copy from that team's newest edition, and the link records `team` in place of `dir`. Max, 2026-11-04 16:35: "Desk
 * doesn't need to know that catalog came from the central. [...] It's team leader's role to decide what to do with catalogs
 * which came from above." So the record of what the copy was built on is this link and the editions kept under `linked/`, both
 * Studio's own, and never a field of the catalog: the copy's draft gets a new id and loses every signature and stamp, and
 * nothing it publishes names the followed team, its lead or its catalog. A followed team's editions are read here only as the
 * shell hands them over (`o.followed`, made by followedFor below where the vault is), already judged by src/member.mjs; this
 * module never opens the followed mirror, and a link naming a team never falls back to a library folder.
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import * as Engine from "./engine.mjs";
import { refuse } from "./refusal.mjs";
import { readJson } from "./plain-json.mjs";
import { writeWhole } from "./whole-write.cjs";
import { latestEdition, readProject, projectName, fixedName, json, PROJECT_FILE, DRAFT_FILE } from "./publish.mjs";

/* src/studio.mjs's INBOX, written out because that module imports this one; tests/link-sync.mjs holds the two equal. */
const INBOX = "inbox";
const LINK_DIR = "linked";
const SYNC_TAIL = ".original.ec";

const NOT_LINKED_REFUSAL = "this catalog is not a linked copy, so there is no original to bring it up to";
const ORIGINAL_GONE_REFUSAL = "the original of this linked copy, catalog {ID}, is not in {DIR} any more, so nothing was"
  + " brought";
const NO_ID_REFUSAL = "this catalog has no id yet, so a linked copy of it could not say what it was copied from";
const COPY_NAME = "{NAME} (linked copy)";
const NOT_FOLLOWED_REFUSAL = "the team that holds the original is out of reach from here, so nothing was brought";
const NOT_OFFERED_REFUSAL = "the team this Studio is on holds no edition of that catalog this Studio can open, so no copy was made";

const sha256 = (buf) => crypto.createHash("sha256").update(buf).digest("hex");
const keptAt = (home, rev) => path.join(home, LINK_DIR, "rev-" + Number(rev) + ".ec");
const TEAM_ID = /^t-[0-9a-f]{16}$/;
/* What a publish stamps on an edition, and what a draft keeps as its own, are never a copy's: the original's signature names
   its lead's key, and grew and desk name where a desk's file came from. */
const NOT_THE_COPYS = ["hash", "sig", "evaluation", "modified", "date", "notes", "grew", "desk"];

function pathsSame(a, b) {
  const norm = (p) => path.resolve(String(p)).replace(/[\\/]+$/, "").toLowerCase();
  return norm(a) === norm(b);
}

/** A catalog already in `root` that is a linked copy of `from`, or null. A library copy has no team, and where it records a
 *  folder that folder is the original (`o.home`). A copy taken from a followed catalog names that team (`o.team`). */
function findHeld(root, from, o) {
  const id = String(from || "");
  const opts = o || {};
  const team = opts.team ? String(opts.team) : "";
  const home = opts.home ? String(opts.home) : "";
  if (!id || !root) return null;
  let names = [];
  try { names = fs.readdirSync(root).sort(); } catch { return null; }
  for (const n of names) {
    const dir = path.join(root, n);
    let st = null;
    try { st = fs.statSync(dir); } catch { continue; }
    if (!st.isDirectory()) continue;
    let project = null;
    try { project = readJson(path.join(dir, PROJECT_FILE)); } catch { continue; }
    const link = project && project.linked;
    if (!link || typeof link !== "object" || String(link.from || "") !== id) continue;
    if (team) {
      if (String(link.team || "") !== team) continue;
      return dir;
    }
    if (link.team) continue;
    if (home && typeof link.dir === "string" && link.dir && !pathsSame(link.dir, home)) continue;
    return dir;
  }
  return null;
}

/** A copy's first draft made from the original's `draft`: every stamp above gone, a new id, rev 0, its own content hash. */
function ownDraft(draft, F, newId) {
  NOT_THE_COPYS.forEach((k) => { delete draft[k]; }); /* plant:962s7g-strip */
  draft.id = newId(F); /* plant:962s7i-id */
  draft.rev = 0;
  draft.hash = F.contentHash(draft);
  return draft;
}

/** A followed team's file stem, safe as a file name, from the name its edition has in the mirror. */
function stemOf(file) {
  const s = path.basename(String(file || "")).replace(/\.ec$/i, "").replace(/[^A-Za-z0-9._-]+/g, "-").replace(/^[.-]+/, "");
  return s || "original";
}
/** A name for a copy taken from a followed team's catalog, which carries none: its file stem as words. */
function nameOf(stem) {
  const w = String(stem || "").replace(/[-_.]+/g, " ").trim();
  return w ? w.charAt(0).toUpperCase() + w.slice(1) : "";
}

/** The id a project's catalog carries, or "". */
function idOf(home) {
  try {
    const p = readProject(home);
    return String(p.draft.id || p.project.id || "");
  } catch { return ""; }
}

/** Where the original is: the folder last recorded if it still holds that catalog, else a sibling folder of the copy that
 *  does (a rename moves a project's folder within its root). null where neither holds it. */
function originalAt(home, link) {
  const want = String(link.from || "");
  if (!want) return null;
  const tried = new Set([home]);
  const holds = (dir) => {
    if (!dir || tried.has(dir)) return false;
    tried.add(dir);
    return fs.existsSync(path.join(dir, PROJECT_FILE)) && idOf(dir) === want;
  };
  if (typeof link.dir === "string" && path.isAbsolute(link.dir) && holds(path.resolve(link.dir))) return path.resolve(link.dir);
  const root = path.dirname(home);
  let names = [];
  try { names = fs.readdirSync(root).sort(); } catch { return null; }
  for (const n of names) {
    const dir = path.join(root, n);
    if (holds(dir)) return dir;
  }
  return null;
}

/**
 * THE ORIGINAL, OF EITHER KIND: {kind, found, dir, team, name, newest: {rev, edition, text()} | null, stem()}. A link naming a
 * team is a followed team's catalog, found only where `followed` (followedFor's answer) is that team, still followed, and holds
 * an edition of `from`; any other link is a library folder, found by originalAt as before.
 */
function sourceOf(home, link, followed) {
  let kind = "folder";
  if (link.team != null) kind = "team"; /* plant:962s7j-kind */
  if (kind === "team") {
    const team = String(link.team), f = followed && typeof followed === "object" ? followed : null;
    let on = false;
    on = TEAM_ID.test(team) && !!f && f.team === team && f.state === "following"; /* plant:962s7j-state */
    const ed = on && Array.isArray(f.editions)
      ? f.editions.find((e) => e && e.catalog === String(link.from) && Number.isSafeInteger(e.rev)) : null;
    const stem = ed ? stemOf(ed.file) : "";
    return { kind, found: !!ed, dir: null, team, name: ed ? nameOf(stem) || null : null,
             newest: ed ? { rev: ed.rev, edition: path.basename(String(ed.file || "")), text: () => String(ed.text) } : null,
             stem: () => stem };
  }
  const at = home ? originalAt(home, link) : null;
  if (!at) return { kind, found: false, dir: null, team: null, name: null, newest: null, stem: () => "" };
  let name = null;
  try { name = projectName(at, readProject(at).project); } catch { name = null; }
  const newest = latestEdition(at);
  return { kind, found: true, dir: at, team: null, name,
           newest: newest ? { rev: Number(newest.catalog.rev), edition: newest.name, text: newest.text } : null,
           stem: () => String(fixedName(at, readProject(at).project, String(link.from)) || "original.ec").replace(/\.ec$/, "") };
}

/**
 * THE FOLLOWED TEAM'S CATALOGS, as the shell hands them to the verbs here: {team, state, editions: [{catalog, rev, file,
 * text?}]}, or null where no team is followed. Called in the shell, where the vault opens the followed record; the editions are
 * src/member.mjs followedEditions's, each already judged under the pinned lead. `o.text` keeps each edition's catalog text, for
 * a take or a press; without it only what the sign needs crosses to the thread.
 */
async function followedFor(teamsFile, vault, o) {
  const [M, K] = await Promise.all([import("./member.mjs"), import("./team-store.mjs")]);
  const f = K.followingOf(teamsFile, vault);
  if (!f) return null;
  const withText = !!(o && o.text);
  return { team: f.team, state: f.state,
           editions: M.followedEditions(teamsFile, vault).map((e) => withText
             ? { catalog: e.catalog, rev: e.rev, file: e.file, text: e.text } : { catalog: e.catalog, rev: e.rev, file: e.file }) };
}

/** The earlier press's file, where it still waits in the inbox as written. */
function pendingHere(home, link) {
  const p = link && link.pending;
  if (!p || typeof p.file !== "string" || !p.file) return false;
  const at = path.join(home, INBOX, path.basename(p.file));
  try { return sha256(fs.readFileSync(at)) === p.sha256; } catch { return false; }
}

/**
 * WHAT THE COPY SHOWS: whether it is linked, to what, the edition last brought, the original's latest, and `newer`, the
 * sign that the original has published since. null for a catalog that is no linked copy. Reads only. `o.followed` is
 * followedFor's answer, which a copy taken from a followed team's catalog is read against; `team` names that team, null for a
 * library original.
 */
function linkState(dir, o) {
  const home = path.resolve(String(dir || ""));
  let project;
  try { project = readJson(path.join(home, PROJECT_FILE)); } catch { return null; }
  const link = project && project.linked;
  if (!link || typeof link !== "object" || !link.from) return null;
  const src = sourceOf(home, link, o && o.followed);
  const at = src.dir, name = src.name;
  const latest = src.newest ? { rev: src.newest.rev, edition: src.newest.edition } : null;
  const brought = link.brought && Number.isFinite(Number(link.brought.rev))
    ? { rev: Number(link.brought.rev), edition: String(link.brought.edition || "") } : null;
  return { from: String(link.from), found: src.found, dir: at, team: src.team, name, brought, latest,
           newer: !!latest && (!brought || latest.rev > brought.rev),
           waiting: pendingHere(home, link) ? path.join(home, INBOX, path.basename(link.pending.file)) : null };
}

/**
 * MAKE A LINKED COPY of the catalog at `dir`, beside it in the same root: a new id, rev 0, no folder and no team, its draft
 * the original's latest published edition (or its draft, where it never published), and the link. The smallest honest
 * way to make one, since Studio had none: the copy is what the original's desks were given, so the first press offers
 * exactly what the original changed after it.
 *
 * @param o.claim   src/studio.mjs claimProjectDir, which takes the next free folder name.
 * @param o.newId   src/studio.mjs newCatalogId.
 * @param o.name    the copy's name; "<original> (linked copy)" where none is given.
 * @param o.root    the folder of catalogs the copy goes into; the original's own where none is given.
 * @returns {{dir: string}}
 */
async function linkedCopy(dir, o) {
  const opts = o || {};
  const home = path.resolve(String(dir || ""));
  const orig = readProject(home);
  const from = String(orig.draft.id || orig.project.id || "");
  if (!from) throw refuse(NO_ID_REFUSAL);
  const root = opts.root ? path.resolve(String(opts.root)) : path.dirname(home);
  const held = findHeld(root, from, { home });
  if (held) return { dir: held, held: true };
  const F = await Engine.format();
  const newest = latestEdition(home);
  const text = newest ? newest.text() : null;
  const draft = ownDraft(text ? JSON.parse(text.replace(/^﻿/, "")) : JSON.parse(JSON.stringify(orig.draft)), F, opts.newId);
  const wanted = String(opts.name || "").trim()
    || COPY_NAME.replace("{NAME}", projectName(home, orig.project));
  const { named, dir: at } = opts.claim(root, wanted, true);
  fs.writeFileSync(path.join(at, DRAFT_FILE), json(draft), "utf8");
  const brought = newest ? { rev: Number(newest.catalog.rev), edition: newest.name } : null;
  if (newest) {
    fs.mkdirSync(path.join(at, LINK_DIR), { recursive: true });
    writeWhole(keptAt(at, brought.rev), text);
  }
  writeWhole(path.join(at, PROJECT_FILE), json({ id: draft.id, rev: 0, edition: "", draft: DRAFT_FILE, folder: null,
    displayName: named, linked: { from, dir: home, brought } }));
  return { dir: at };
}

/**
 * TAKE AS A BASE: a catalog of this Studio's own made from the newest edition of `catalog` in the team it follows, linked to it
 * as a copy is linked to a library original (stage 7, 3.3). A new id, rev 0, no folder and no team; the edition kept byte for
 * byte under `linked/` as the base the first press is read against; the link `{from, team, brought}` in project.json alone. The
 * lead's deliberate act, and the only way a followed team's catalog becomes one of this Studio's.
 *
 * @param o.followed  followedFor's answer with each edition's text.
 * @param o.claim, o.newId, o.name, o.root   as linkedCopy's; root is required, since there is no original folder to sit beside.
 * @returns {{dir: string, inUse: {id, rev, sha256}}}   inUse is what the member's in-use file names: the followed catalog, the
 *   rev taken and its signed sha256, as a desk pins an edition.
 */
async function baseCopy(catalog, o) {
  const opts = o || {}, f = opts.followed;
  const from = String(catalog || "");
  const src = from && f ? sourceOf(null, { from, team: f.team }, f) : null;
  if (!src || !src.newest || !opts.root) throw refuse(NOT_OFFERED_REFUSAL);
  const root = path.resolve(String(opts.root));
  const held = findHeld(root, from, { team: src.team });
  if (held) return { dir: held, held: true, inUse: null };
  const F = await Engine.format();
  const text = src.newest.text();
  const signed = JSON.parse(text.replace(/^﻿/, ""));
  const draft = ownDraft(JSON.parse(JSON.stringify(signed)), F, opts.newId);
  const wanted = String(opts.name || "").trim() || src.name || nameOf(src.stem()) || "Catalog";
  const { named, dir: at } = opts.claim(root, wanted, true);
  fs.writeFileSync(path.join(at, DRAFT_FILE), json(draft), "utf8");
  const brought = { rev: src.newest.rev, edition: src.newest.edition };
  fs.mkdirSync(path.join(at, LINK_DIR), { recursive: true });
  writeWhole(keptAt(at, brought.rev), text); /* plant:962s7g-kept */
  writeWhole(path.join(at, PROJECT_FILE), json({ id: draft.id, rev: 0, edition: "", draft: DRAFT_FILE, folder: null,
    displayName: named, linked: { from, team: src.team, brought } }));
  return { dir: at, inUse: inUseOf(from, brought.rev, signed) };
}

/** What a member's in-use file names for the followed catalog `id` at `rev`: its signed sha256 as the desk's own pin reads it. */
function inUseOf(id, rev, signed) {
  let pin = "";
  pin = Engine.deskRules().signedSha(signed); /* plant:962s7g-inuse */
  return { id: String(id), rev: Number(rev), sha256: pin };
}

/**
 * BRING UP TO THE ORIGINAL: the original's latest published edition into this copy's inbox, as a proposal the review
 * decides. Answers {brought: false} and writes nothing where the original has published nothing newer than the edition
 * last brought; otherwise {brought: true, file, rev, edition, base}, and for a copy of a followed team's catalog `inUse` as
 * baseCopy answers it. `o.followed` is followedFor's answer with the text, which such a copy is brought up from.
 */
async function bringUp(dir, o) {
  const home = path.resolve(String(dir || ""));
  const p = readProject(home);
  const link = p.project.linked;
  if (!link || typeof link !== "object" || !link.from) throw refuse(NOT_LINKED_REFUSAL);
  const src = sourceOf(home, link, o && o.followed);
  if (!src.found && src.kind === "team") throw refuse(NOT_FOLLOWED_REFUSAL);
  if (!src.found) throw refuse(ORIGINAL_GONE_REFUSAL, { ID: String(link.from), DIR: path.dirname(home) });
  const newest = src.newest;
  const rev = newest ? Number(newest.rev) : NaN;
  const was = link.brought && Number.isFinite(Number(link.brought.rev)) ? Number(link.brought.rev) : null;
  if (!newest || !Number.isFinite(rev) || (was != null && rev <= was)) return { brought: false, rev: was };
  const text = newest.text();
  fs.mkdirSync(path.join(home, LINK_DIR), { recursive: true });
  if (!fs.existsSync(keptAt(home, rev))) writeWhole(keptAt(home, rev), text);
  /* The base is what the copy has seen: the earlier file's, while that file still waits undecided. */
  const base = pendingHere(home, link) ? (link.pending.base == null ? null : Number(link.pending.base)) : was;
  const F = await Engine.format();
  const doc = JSON.parse(text.replace(/^﻿/, ""));
  doc.id = String(p.draft.id || p.project.id || "");
  doc.rev = Number(p.project.rev) || 0;
  delete doc.sig; delete doc.hash; delete doc.evaluation; delete doc.modified;
  doc.hash = F.contentHash(doc);
  const stem = src.stem();
  const file = path.join(home, INBOX, stem + SYNC_TAIL);
  fs.mkdirSync(path.join(home, INBOX), { recursive: true });
  const bytes = json(doc);
  writeWhole(file, bytes);
  /* The record moves last: a crash before it leaves a file the review reads as an ordinary proposal and an edition not
     yet marked brought, so the next press brings it again. A followed team's link keeps its team and gains no folder. */
  const next = Object.assign({}, link, src.kind === "folder" ? { dir: src.dir } : {}, { brought: { rev, edition: newest.edition },
    pending: { file: path.basename(file), sha256: sha256(Buffer.from(bytes, "utf8")), base, rev } }); /* plant:962s7h-sync */
  writeWhole(path.join(home, PROJECT_FILE), json(Object.assign({}, p.project, { linked: next })));
  const out = { brought: true, file, rev, edition: newest.edition, base };
  if (src.kind === "team") out.inUse = inUseOf(link.from, rev, JSON.parse(text.replace(/^﻿/, "")));
  return out;
}

/**
 * FOR src/review.mjs: where `file` is the proposal the last press wrote, as written, the base it is read against (the
 * original's edition the copy had seen, or null) and where it came from; otherwise null. Reads no engine.
 */
function syncOf(dir, project, file) {
  const link = project && project.linked;
  if (!link || !link.pending || !file) return null;
  const home = path.resolve(String(dir || "")), at = path.resolve(String(file));
  if (path.dirname(at) !== path.join(home, INBOX) || path.basename(at) !== link.pending.file) return null;
  if (!pendingHere(home, link)) return null;
  let base = null;
  if (link.pending.base != null) {
    try { base = readJson(keptAt(home, link.pending.base)); } catch { base = null; }
  }
  return { base, from: String(link.from), rev: Number(link.pending.rev) };
}

export { linkState, linkedCopy, baseCopy, bringUp, syncOf, originalAt, followedFor, INBOX, LINK_DIR, SYNC_TAIL,
         NOT_LINKED_REFUSAL, ORIGINAL_GONE_REFUSAL, NO_ID_REFUSAL, NOT_FOLLOWED_REFUSAL, NOT_OFFERED_REFUSAL, COPY_NAME };
