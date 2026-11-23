/* STUDIO'S SAVED DATA AND THE FORMAT IT WAS WRITTEN IN (updates 2, Studio's half; the test architect's condition: "Studio's
 * store gains a format field with the same rule": a Studio meeting saved data written by a newer format refuses, naming
 * the version needed, never falls back to an older copy, never overwrites it).
 *
 * studio.json and teams.json carry `format` and `writtenBy`, the version of Studio that last wrote them. A file whose format
 * is a number above SAVED_FORMAT was written by a newer Studio: it is read as nothing, so no meaning this version does not
 * know is taken from it, and it is never written over, so installing that newer version again opens it as it was. A file
 * with no format is one an older Studio wrote, and it reads as before. A file that does not parse is no newer file, and
 * keeps the rule it had (studio.json starts again, teams.json is refused for a write).
 *
 * CommonJS, so the shell requires it and src/team-store.mjs imports it. */
const fs = require("node:fs");
const path = require("node:path");

const SAVED_FORMAT = 1;
const VERSION_RE = /^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.+-]{1,40})?$/;

let ownVersion = null;
/** This Studio's own version, as its package.json says, which is app.getVersion() in the packaged program. */
function studioVersion() {
  if (ownVersion !== null) return ownVersion;
  try { ownVersion = String(JSON.parse(fs.readFileSync(path.join(__dirname, "..", "package.json"), "utf8")).version || ""); }
  catch { ownVersion = ""; }
  return ownVersion;
}

/** Null where `doc` is saved data this Studio reads; else {format, version}, `version` the Studio that wrote it, or ""
 *  where the file names none. */
function savedNewer(doc) {
  if (!doc || typeof doc !== "object" || Array.isArray(doc)) return null;
  if (typeof doc.format !== "number" || !(doc.format > SAVED_FORMAT)) return null; /* plant:u2-newer */
  const v = typeof doc.writtenBy === "string" && VERSION_RE.test(doc.writtenBy) ? doc.writtenBy : "";
  return { format: doc.format, version: v };
}

/** `doc` as this Studio writes it: its format and its own version on it. */
function stamped(doc, version) {
  return Object.assign({}, doc, { format: SAVED_FORMAT, writtenBy: String(version == null ? studioVersion() : version) });
}

/** studio.json as read: {doc, newer}. A newer file reads as {} with `newer` saying why. */
function readSaved(file) {
  let doc;
  try { doc = JSON.parse(fs.readFileSync(file, "utf8").replace(/^﻿/, "")); } catch { return { doc: {}, newer: null }; }
  const newer = savedNewer(doc);
  if (newer) return { doc: {}, newer }; /* plant:u2-store-read */
  return { doc: doc && typeof doc === "object" && !Array.isArray(doc) ? doc : {}, newer: null };
}

/** Writes `next` to `file` with `write(file, text)`, stamped; false, and nothing written, where the file there now was
 *  written by a newer Studio. */
function writeSaved(file, next, write, version) {
  let onDisk = null;
  try { onDisk = JSON.parse(fs.readFileSync(file, "utf8").replace(/^﻿/, "")); } catch { onDisk = null; }
  if (savedNewer(onDisk)) return false; /* plant:u2-store-write */
  write(file, JSON.stringify(stamped(next, version), null, 1) + "\n");
  return true;
}

/* The copywriter's sentence (Claudette, 2026-11-01), and, where the file names no version, the one without it. */
const NEWER_SAID = "This Studio's saved data were written by Etiuda Studio {VERSION} or newer, so this version leaves them untouched. Installing Etiuda Studio {VERSION} or newer opens them as they were.";
const NEWER_SAID_BARE = "This Studio's saved data were written by a newer Etiuda Studio, so this version leaves them untouched. Installing the newest Etiuda Studio opens them as they were.";
/** What the lead is told, as a frame and its values. */
function newerSaid(newer) {
  return newer && newer.version ? { frame: NEWER_SAID, vars: { VERSION: newer.version } } : { frame: NEWER_SAID_BARE, vars: {} };
}
/** The same in English, filled, for a refusal thrown where no page is listening. */
function newerLine(newer) {
  const s = newerSaid(newer);
  return s.frame.split("{VERSION}").join(String(s.vars.VERSION || ""));
}

module.exports = { SAVED_FORMAT, studioVersion, savedNewer, stamped, readSaved, writeSaved, newerSaid, newerLine,
  NEWER_SAID, NEWER_SAID_BARE };
