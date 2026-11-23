/* A FILE FROM A SHARE IS READ AS PLAIN DATA OR REFUSED (sense pass 3, items 7 and 10).
 *
 * A key named `__proto__`, `constructor` or `prototype` reaches the program's own objects
 * through any path built from keys, and nesting deeper than any catalog or statistics file has
 * overflows every recursive reader after the parse. Both are refused here, by a walk that keeps
 * its own stack, so the check cannot itself overflow on the file it is judging.
 */
import fs from "node:fs";
import { refuse } from "./refusal.mjs";

const HOSTILE = new Set(["__proto__", "constructor", "prototype"]);
const MAX_DEPTH = 64;

/** Null where `v` is plain data, else { key } or { depth } for the first problem found. */
function plainProblem(v, maxDepth) {
  const limit = maxDepth || MAX_DEPTH;
  const stack = [[v, 1]];
  while (stack.length) {
    const [x, d] = stack.pop();
    if (x === null || typeof x !== "object") continue;
    if (d > limit) return { depth: limit };
    if (Array.isArray(x)) { x.forEach(y => stack.push([y, d + 1])); continue; }
    for (const k of Object.keys(x)) {
      if (HOSTILE.has(k)) return { key: k };
      stack.push([x[k], d + 1]);
    }
  }
  return null;
}

/** The error a door throws for such a file, said in the page's words. */
function plainRefusal(p) {
  return p.key !== undefined
    ? refuse("this file carries a key named {KEY}, which no catalog or statistics file has, so"
      + " it is not read", { KEY: p.key })
    : refuse("this file nests deeper than any catalog or statistics file does, so it is not"
      + " read");
}

/** JSON.parse, then refused unless the result is plain data. */
function parsePlain(text) {
  const v = JSON.parse(text);
  const p = plainProblem(v);
  if (p) throw plainRefusal(p);
  return v;
}

/* ONE READER AND ONE WRITER FOR A JSON FILE (board 858, P6), where five modules each wrote the reader
 * and four the writer. The reader drops a leading byte order mark, which a file saved by a Windows
 * editor may carry; `plain` reads it through parsePlain, which a file a desk or a share wrote must be. */
function readJson(p, opts) {
  const text = fs.readFileSync(p, "utf8").replace(/^\uFEFF/, "");
  return opts && opts.plain ? parsePlain(text) : JSON.parse(text);
}
/** The text a JSON file is written as here: one space of indent and a final newline. */
const jsonText = (v) => JSON.stringify(v, null, 1) + "\n";

export { parsePlain, plainProblem, plainRefusal, readJson, jsonText, HOSTILE, MAX_DEPTH };
