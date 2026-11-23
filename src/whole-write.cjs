"use strict";
/* A FILE STUDIO REWRITES IS REPLACED WHOLE OR LEFT AS IT WAS. Written in place, a file is
 * truncated and then filled, and a write cut off between the two leaves half of it. So the bytes
 * go to a sibling, are flushed, and a rename puts them over the old file in one step.
 * CommonJS so that `shell/main.js` can require it and the modules under `src/` import it.
 */
const fs = require("node:fs");
const crypto = require("node:crypto");
const { threadId } = require("node:worker_threads");

/* A RENAME OVER A FILE ANOTHER PROGRAM HAS OPEN IS REFUSED ON WINDOWS for as long as it holds
   it, and a virus scanner or a sync client opening a file just written is the ordinary case, so
   the rename is asked again for a few seconds before the refusal stands. */
const BUSY = ["EPERM", "EACCES", "EBUSY"];
const TRIES = 60, PAUSE_MS = 50;
const nap = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);

/* TWO STUDIOS ON ONE PROJECTS ROOT (a share, say) WRITE ONE DRAFT BETWEEN THEM. Every save reads the file, changes its own
   field and writes the whole file back, so a save that read before the other's rename and renamed after it puts the other's
   change out (measured, 2026-11-22: 8 to 18 of 60 saves each, back to back). A caller that read the file hands writeWhole the
   bytes it read, `was`; the write then takes the file's lock, a directory made beside it (a directory is made once or refused,
   on a share too), looks at the file again, and renames only if it still holds those bytes. Otherwise it throws with `stale`
   set, and the caller reads again and redoes its change on what is there. The lock is held for that look and that rename
   only, so a lock older than LOCK_STALE_MS belongs to a Studio that died and is broken. A lock that stays for LOCK_WAIT_MS
   is thrown with `locked` set. Neither carries a system code, so nothing else reads them as a fault of the disk. */
const LOCK_WAIT_MS = 2000, LOCK_PAUSE_MS = 4, LOCK_STALE_MS = 15000;
const lockOf = (at) => at + ".lock";

/** Take the lock beside `at`, or throw `locked`. Returns what to call to let go. */
function lockFile(at) {
  const lock = lockOf(at);
  const until = Date.now() + LOCK_WAIT_MS;
  let stuck = false;
  for (;;) {
    try { fs.mkdirSync(lock); return () => { try { fs.rmdirSync(lock); } catch { /* broken as stale, or gone */ } }; }
    catch (e) {
      if (!e || e.code !== "EEXIST") throw e;
      let age = 0;
      try { age = Date.now() - fs.statSync(lock).mtimeMs; } catch { age = 0; }
      /* A STALE LOCK THAT WILL NOT GO (something inside it, or no right to delete on a share) is not another Studio saving: it is thrown
         with `stuck` naming the folder, so the sentence can say which folder to remove (the test architect's read, D1). */
      if (age > LOCK_STALE_MS) {
        try { fs.rmdirSync(lock); continue; }
        catch (b) { if (b && b.code === "ENOENT") continue; stuck = true; /* another Studio broke it first, or it will not go */ }
      }
      if (Date.now() >= until) {
        const l = new Error("another Studio holds " + lock);
        if (stuck) l.stuck = lock; else l.locked = true; /* plant:esv-lock-stuck */
        l.path = at; throw l;
      }
      nap(LOCK_PAUSE_MS);
    }
  }
}

/** A unique temporary sibling in the target's own directory, per write, thread and process. */
function tempName(at) {
  const tid = threadId ?? 0;
  const rand = crypto.randomBytes(6).toString("hex");
  return at + "." + process.pid + "." + tid + "." + rand + ".tmp";
}

/** Rename `from` to `to`, a folder as well as a file, asking again while the refusal is BUSY's. */
function renamePatiently(from, to, tries = TRIES, pauseMs = PAUSE_MS) {
  for (let i = 1; ; i++) {
    try { fs.renameSync(from, to); return; }
    catch (e) {
      if (i >= tries || !e || BUSY.indexOf(e.code) < 0) throw e; /* plant:rename-busy */
      nap(pauseMs);
    }
  }
}

/** Write `text` to `at` as UTF-8, whole or not at all. A failure is thrown with `path` naming
 *  `at` rather than the sibling, because that is the file the person knows. `o.mode` is the sibling's mode, which the rename
 *  carries to `at` (OWNER_ONLY for a signing key and its copies); none leaves the system's default. `o.was` is the Buffer the
 *  caller read `at` as: the file is then replaced only while it still holds exactly those bytes (see the lock above), or the
 *  write throws `stale` (changed under it) or `locked` (another Studio's lock would not let go), leaving the file as it was. */
function writeWhole(at, text, o) {
  const tmp = tempName(at); /* plant:write-unique-temp */
  const mode = o && Number.isInteger(o.mode) ? o.mode : undefined;
  let fd = null;
  try {
    fd = fs.openSync(tmp, "w", mode); /* plant:k27-owner-only */
    try { fs.writeSync(fd, String(text), null, "utf8"); fs.fsyncSync(fd); }
    finally { fs.closeSync(fd); fd = null; }
    if (o && Buffer.isBuffer(o.was)) {
      const unlock = lockFile(at); /* plant:esv-lock */
      try {
        let now = null;
        try { now = fs.readFileSync(at); } catch (e) { if (!e || e.code !== "ENOENT") throw e; }
        if (!(now && now.equals(o.was))) { const e = new Error("changed since it was read: " + at); e.stale = true; throw e; } /* plant:esv-stale */
        renamePatiently(tmp, at);
      } finally { unlock(); }
    } else renamePatiently(tmp, at);
  } catch (e) {
    if (fd !== null) { try { fs.closeSync(fd); } catch { /* ignore */ } }
    try { fs.unlinkSync(tmp); } catch { /* never made, or already gone */ } /* plant:write-clean-temp */
    if (e && typeof e === "object") e.path = at;
    throw e;
  }
}

/* Read and written by the account that made it alone, where the system decides by the mode (Windows decides by the folder's access list). */
const OWNER_ONLY = 0o600;

module.exports = { writeWhole, renamePatiently, tempName, lockOf, TRIES, PAUSE_MS, BUSY, OWNER_ONLY, LOCK_WAIT_MS, LOCK_STALE_MS };
