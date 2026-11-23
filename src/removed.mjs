/* WHAT A DESK SINCE REMOVED SAID WHILE IT WAS TRUSTED (board 900, F2; Claude alpha's ruling of 2026-10-17 11:01).
 *
 *     import { deskSnapshot, removedHeld } from "./src/removed.mjs";
 *
 * The ruling, quoted from the record: "A file a desk stored before its removal counts as a record of what it said while
 * trusted: its statistics stay in the totals, never as live state, and its row says 'from a desk since removed'. Nothing it
 * sends after the removal lands." The same on a folder and on the relay.
 *
 * WHAT COUNTS AS STORED BEFORE is what Studio itself can place before the removal, never the desk's own word (Claude
 * alpha's criterion for F-kappa1 of the test architect's read of 2026-10-18). At the removal Studio keeps the sha256 of
 * every file the desk's folder held then (deskSnapshot, src/team-store.mjs markRemoved): those bytes are its record. On
 * the relay the channel layer's own record beside the mirror names, for each file it wrote, the writer and the moment it
 * landed by Studio's own clock, and a file of that desk whose bytes are the ones the layer took, landed at or before the
 * removal, counts too. The counter under an upload is not asked: it is the writer's own number, so a desk since removed,
 * holding its signing key and the old team key, could seal a file after its removal under any counter it chose, and a
 * relay that kept it would have it counted. So a file stored on the relay before the removal that reaches the mirror only
 * after it, when the lead was away, is not counted either: Studio cannot place it. Anything else in its folder, a new file
 * or other bytes, is not read: not a row, not a figure, not live state; each such file is named in `left`, so the screens
 * that read the record can say that it was not counted. */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import * as Engine from "./engine.mjs";

const DESK_ID = /^k-[0-9a-f]{16}$/;
const sha256 = (b) => crypto.createHash("sha256").update(b).digest("hex");

/* Every file under desks/<id>/ in `folder`, as relative paths with forward slashes. */
function filesOf(folder, id) {
  const out = [], root = path.join(path.resolve(String(folder || ".")), "desks", id);
  const walk = (dir, rel, depth) => {
    if (depth > 8) return;
    let names = [];
    try { names = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const n of names) {
      const r = rel + "/" + n.name;
      if (n.isDirectory()) walk(path.join(dir, n.name), r, depth + 1);
      else if (n.isFile() && !/\.tmp$/i.test(n.name)) out.push(r);
    }
  };
  walk(root, "desks/" + id, 0);
  return out.sort();
}

/** What desk `id`'s folder in `folder` holds now: {path: sha256 hex}, the record a removal keeps. */
function deskSnapshot(folder, id) {
  const out = {};
  if (!DESK_ID.test(String(id))) return out;
  for (const rel of filesOf(folder, String(id))) {
    try { out[rel] = sha256(fs.readFileSync(path.join(path.resolve(String(folder)), ...rel.split("/")))); } catch { /* gone meanwhile */ }
  }
  return out;
}

/* The channel layer's record beside a mirror (<mirror>.json), as the layer reads it back, or null on a folder. */
function layerRecord(folder) {
  const at = path.resolve(String(folder || ".")) + ".json";
  let x = null;
  try { x = JSON.parse(fs.readFileSync(at, "utf8")); } catch { return null; }
  try { return Engine.relayRules().channel.stateOf(x); } catch { return null; }
}

/** For each desk in `removed` (src/team-store.mjs removedOf: {id: {key, at, epoch, files}}), the files of its folder in
 *  `folder` that count as its record, with their bytes' sha256: {id: {path: sha}}. A desk whose folder holds none is
 *  named with an empty map. Every other file of its folder is pushed onto `left`, where an array is given, as {desk, path}. */
function removedHeld(folder, removed, left) {
  const out = {}, layer = layerRecord(folder);
  for (const id of Object.keys(removed || {})) {
    const rec = removed[id];
    if (!DESK_ID.test(id) || !rec) continue;
    const kept = {};
    for (const rel of filesOf(folder, id)) {
      let sha = null;
      try { sha = sha256(fs.readFileSync(path.join(path.resolve(String(folder)), ...rel.split("/")))); } catch { continue; }
      const was = rec.files && rec.files[rel] === sha; /* plant:f2-snapshot */
      const a = layer && layer.applied && Object.prototype.hasOwnProperty.call(layer.applied, rel) ? layer.applied[rel] : null;
      const before = !!a && a.writer === id && a.sha === sha && !a.del && a.at <= rec.at; /* plant:f2-counter */
      if (was || before) kept[rel] = sha;
      else if (Array.isArray(left)) left.push({ desk: id, path: rel });
    }
    out[id] = kept;
  }
  return out;
}

export { deskSnapshot, removedHeld };
