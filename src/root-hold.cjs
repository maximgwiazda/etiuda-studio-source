"use strict";
/* ONE STUDIO HOLDS A PROJECTS FOLDER AT A TIME (Max, 2026-11-22 21:14, by Claude alpha: two Studios working in one shared projects
 * folder is retired). A Studio takes a hold on its projects folder, a small file in it, and keeps it fresh while it runs and lets go
 * of it when it quits. A second Studio that finds a live hold opens nothing from that folder and says so; it does not edit beside the
 * first, which is what lost saves (the editing review of 2026-11-22). CommonJS so that `shell/main.js` can require it.
 *
 * A HOLD IS NEVER A REASON TO REFUSE FOR EVER. A hold left by a Studio that died is taken over with no step by anyone:
 *   - on this computer, when the process that wrote it is gone;
 *   - anywhere, when it has not been refreshed for STALE_MS. The age is judged against a probe file made in the same folder a
 *     moment ago, so both times are the folder's own clock (a share stamps files by the server's, which is not this computer's).
 * A TAKEOVER, AND A BEAT, IS A COMPARE AND SWAP, NOT A WRITE AND A LOOK BACK (the test architect's re-read, D3: two Studios both
 * told they held it in 1 of 30 tries). Each replaces the file only while it still holds the bytes that were judged (src/whole-write.cjs,
 * `was`: a lock directory made once or refused, a look, a rename), so of two Studios that both found it stale exactly one writes, and
 * the other looks again and finds the first's live hold. A Studio whose beat finds the file changed under it looks again the same way.
 * What cannot be read or replaced (a folder where the file should be, no right to delete on a share) is not "another Studio has
 * it": it comes back as `trouble` naming the file, for a sentence that says what is wrong. A folder this account may not write to
 * at all is not held either way: nothing can be saved there, and the saves already say so.
 */
const crypto = require("node:crypto");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { writeWhole } = require("./whole-write.cjs");
const { cloudOf, onSystemDisk } = require("./where.cjs");

const HOLD_FILE = ".etiuda-studio-hold";
const BEAT_MS = 10000, STALE_MS = 45000;

/** Whether a projects folder can be shared at all, as its path says: on a synced folder, on a share (a UNC name), or on a disk that is
 *  not the system's, which may be a mapped share (src/where.cjs). A folder on the system disk is this computer's alone: no hold is
 *  taken there, and nothing is written into it. */
function needed(root, env) {
  const at = path.resolve(String(root));
  return !!cloudOf(at, env || process.env) || /^[\\/]{2}/.test(at) || !onSystemDisk(at, env || process.env);
}

/** Who this Studio is: made once per process. */
function holder() {
  return { id: crypto.randomBytes(8).toString("hex"), pid: process.pid, host: os.hostname(), since: new Date().toISOString() };
}
const textOf = (me) => JSON.stringify({ kind: "etiuda-studio-hold", id: me.id, pid: me.pid, host: me.host, since: me.since, beat: new Date().toISOString() }) + "\n";
const holdAt = (root) => path.join(path.resolve(root), HOLD_FILE);

function alive(pid) {
  try { process.kill(pid, 0); return true; }
  catch (e) { return !!(e && e.code === "EPERM"); }
}

/** The hold's age in ms by the folder's own clock: its mtime against a probe made beside it now. The local clock where no probe can be made. */
function ageOf(file) {
  let held;
  try { held = fs.statSync(file).mtimeMs; } catch { return 0; }
  const probe = file + ".probe-" + crypto.randomBytes(4).toString("hex");
  try {
    fs.writeFileSync(probe, "", { flag: "wx" });
    const now = fs.statSync(probe).mtimeMs;
    return now - held;
  } catch { return Date.now() - held; }
  finally { try { fs.unlinkSync(probe); } catch { /* never made */ } }
}

function parse(raw) {
  try { const d = JSON.parse(raw); return d && typeof d === "object" && typeof d.id === "string" ? d : null; }
  catch { return null; }
}
const trouble = (file, e) => ({ state: "trouble", file, why: (e && e.code) || String(e) });
const byOf = (d) => (d ? { host: d.host || "", pid: d.pid || 0, since: d.since || "" } : null);
/* A folder nobody may write to, or one that is not there: nothing can be held, and nothing can be saved either. */
const UNHOLDABLE = ["EPERM", "EACCES", "EROFS", "ENOENT", "ENOTDIR", "EDQUOT", "ENOSPC"];

function live(file, d, me) {
  if (d && d.host === me.host && Number.isInteger(d.pid) && !alive(d.pid)) return false; /* plant:rh-live */
  return ageOf(file) <= STALE_MS; /* plant:rh-age */
}

/** Take the hold on `root`, or find who has it. { state: "mine" } | { state: "other", by } | { state: "free" } (nothing can be held
 *  there) | { state: "trouble", file, why }. */
function take(root, me) {
  const file = holdAt(root);
  for (let i = 0; i < 4; i++) {
    let bytes = null;
    try { bytes = fs.readFileSync(file); }
    catch (e) {
      if (!e || e.code !== "ENOENT") return trouble(file, e); /* plant:rh-trouble */
      try { fs.writeFileSync(file, textOf(me), { flag: "wx" }); return { state: "mine" }; }
      catch (w) {
        if (w && w.code === "EEXIST") continue;
        return w && UNHOLDABLE.indexOf(w.code) >= 0 ? { state: "free" } : trouble(file, w);
      }
    }
    const d = parse(bytes.toString("utf8"));
    if (d && d.id === me.id) {
      try { writeWhole(file, textOf(me), { was: bytes }); } /* plant:rh-cas-beat */
      catch (e) { if (e && (e.stale || e.locked)) continue; /* the file changed under the beat: look again */ /* a beat that missed: the next one tries again */ }
      return { state: "mine" };
    }
    if (live(file, d, me)) return { state: "other", by: byOf(d) }; /* plant:rh-other */
    try { writeWhole(file, textOf(me), { was: bytes }); } /* plant:rh-cas-take */
    catch (e) {
      if (e && (e.stale || e.locked)) continue; /* another Studio took it first, or is taking it now: look at what it wrote */
      return trouble(file, e);
    }
    return { state: "mine" };
  }
  return trouble(file, new Error("the hold changed under every look"));
}

/** Let go: the file goes only if it is still this Studio's. */
function drop(root, me) {
  const file = holdAt(root);
  try {
    const d = parse(fs.readFileSync(file, "utf8"));
    if (d && d.id === me.id) fs.unlinkSync(file);
  } catch { /* gone, or not readable: nothing of ours to remove */ }
}

module.exports = { holder, take, drop, needed, holdAt, HOLD_FILE, BEAT_MS, STALE_MS };
