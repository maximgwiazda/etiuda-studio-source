"use strict";
/* A share file is read only after its size is known, and only within the desk's team-file cap
 * (TEAM_MAX in the pinned shell). Anything larger is refused unread. CommonJS so the shell can
 * require it and the modules under src/ can import it.
 *
 * One descriptor carries the whole read: opened, measured and read, so a file renamed into place
 * between a look at the path and a read of the path (a synced share folder can do that) is never
 * read whole. At most cap + 1 bytes are read, and more than the cap is refused (the test
 * architect's edit of 931, 2026-11-11).
 */
const fs = require("node:fs");

const TEAM_READ_MAX = 1024 * 1024;

function refusal(message, code) {
  const err = new Error(message);
  err.code = code;
  return err;
}

function readWithin(file, cap) {
  const limit = cap == null ? TEAM_READ_MAX : cap;
  const fd = fs.openSync(file, "r");
  try {
    const st = fs.fstatSync(fd);
    if (!st.isFile()) throw refusal("not a file", "EISDIR");
    if (st.size > limit) throw refusal("larger than the reader allows", "EFBIG");
    /* Sized to what fstat saw plus one byte, so a file that grew since shows itself; then up to cap + 1. */
    let buf = Buffer.alloc(st.size + 1);
    let got = 0;
    for (;;) {
      const n = fs.readSync(fd, buf, got, buf.length - got, got);
      if (n === 0) break;
      got += n;
      if (got === buf.length) {
        if (buf.length > limit) break;
        const more = Buffer.alloc(limit + 1);
        buf.copy(more, 0, 0, got);
        buf = more;
      }
    }
    if (got > limit) throw refusal("larger than the reader allows", "EFBIG");
    return buf.subarray(0, got);
  } finally {
    fs.closeSync(fd);
  }
}

module.exports = { TEAM_READ_MAX, readWithin };
