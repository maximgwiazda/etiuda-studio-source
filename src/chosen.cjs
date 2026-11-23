"use strict";
/* WHAT THE PERSON CHOSE IN A PICKER STAYS IN THE SHELL. The page is told the path, to show it and
 * to hand it back with the act, and an act that writes or reads a path takes only the one the
 * last pick of its kind answered: a page that could name any path could overwrite any file the
 * person can write, or read any into an import. A pick cancelled leaves the earlier choice
 * standing, since a wizard under way still holds it. */
const fs = require("node:fs");
const path = require("node:path");

function chooser() {
  const kept = new Map();
  return {
    /** Records what a pick of `kind` answered, and answers it unchanged. */
    keep(kind, p) {
      if (p) kept.set(kind, path.resolve(String(p)));
      return p;
    },
    /** Whether `p` is what the last pick of `kind` answered. `once` spends the choice either way,
     *  for an act that is over when it has been tried. Anything but a string is refused before it
     *  is read as a path. */
    took(kind, p, once) {
      const want = kept.get(kind);
      if (once) kept.delete(kind);
      if (typeof p !== "string") return false;
      return !!want && String(p) !== "" && path.resolve(String(p)) === want;
    },
    /** Whether `p` is a path a pick answered, or a file inside a folder one answered. Nothing is spent. */
    covers(p) {
      if (typeof p !== "string" || !p) return false;
      const fold = (s) => (process.platform === "win32" ? s.toLowerCase() : s);
      const here = fold(path.resolve(String(p)));
      for (const want of kept.values()) {
        const base = fold(want);
        if (here === base) return true;
        const rel = path.relative(base, here);
        if (rel && rel !== ".." && !rel.startsWith(".." + path.sep) && !path.isAbsolute(rel)) return true;
      }
      return false;
    },
    /** The paths picks have answered. */
    places() { return Array.from(kept.values()); },
  };
}

/** The absolute path when `p` is an existing folder, else null: a file handed to the system is
 *  launched rather than shown. */
function folderAt(p) {
  if (p == null || String(p) === "") return null;
  const at = path.resolve(String(p));
  try { return fs.statSync(at).isDirectory() ? at : null; } catch { return null; }
}

module.exports = { chooser, folderAt };
