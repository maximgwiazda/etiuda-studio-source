/* Calls read by their shape. A regex that wants ")" immediately after grab("name" or
 * onScreen("name" misses a second argument, and a slice of seg() that stops at the first "],"
 * drops the second language. This file reads the sources. It does not launch a window.
 *
 *   node tests/call-shape.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const EXPECTED = 1;
let asserted = 0, failed = 0;
function check(ok, line) {
  asserted++;
  if (ok) console.log("  ok   " + line);
  else { failed++; console.log("  FAIL " + line); }
}
function strip(src) {
  return String(src).replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:\\])\/\/.*$/gm, "$1");
}
/* Calls of name( whose first argument is a string, and whether a comma at depth 1 follows it.
   A second argument keeps the call visible. A character of an identifier before the name is a
   different call. */
function callsOf(src, name) {
  const s = strip(src);
  const needle = name + "(";
  const out = [];
  let i = 0;
  while ((i = s.indexOf(needle, i)) >= 0) {
    const prev = i > 0 ? s[i - 1] : "";
    if (/[A-Za-z0-9_$]/.test(prev)) { i += needle.length; continue; }
    let j = i + needle.length;
    while (j < s.length && (s[j] === " " || s[j] === "\n" || s[j] === "\r" || s[j] === "\t")) j++;
    let first = null;
    if (s[j] === "\"" || s[j] === "'") {
      const q = s[j];
      let k = j + 1;
      while (k < s.length && s[k] !== q) { if (s[k] === "\\") k++; k++; }
      first = s.slice(j + 1, k);
      j = k + 1;
    }
    let depth = 1, more = false;
    for (; j < s.length && depth > 0; j++) {
      const c = s[j];
      if (c === "(" || c === "[" || c === "{") depth++;
      else if (c === ")" || c === "]" || c === "}") depth--;
      else if (c === "," && depth === 1) more = true;
      else if (c === "\"" || c === "'") {
        const q = c; j++;
        while (j < s.length && s[j] !== q) { if (s[j] === "\\") j++; j++; }
      }
    }
    out.push({ name: first, more });
    i = j;
  }
  return out;
}
/* The screen table's own keys, depth 1 of NO_TWIN, so a name the table does not know is a stray. */
function screenKeys(src) {
  const s = strip(src);
  const at = s.indexOf("const NO_TWIN = {");
  if (at < 0) return [];
  let depth = 0, keys = [], i = s.indexOf("{", at);
  for (; i < s.length; i++) {
    const c = s[i];
    if (c === "{" || c === "[" || c === "(") depth++;
    else if (c === "}" || c === "]" || c === ")") { depth--; if (depth === 0) break; }
    else if (c === "\"" || c === "'") {
      const q = c; i++;
      while (i < s.length && s[i] !== q) { if (s[i] === "\\") i++; i++; }
    } else if (depth === 1 && /[A-Za-z]/.test(c)) {
      const m = /^[A-Za-z][A-Za-z0-9]*/.exec(s.slice(i));
      const rest = s.slice(i + m[0].length);
      if (/^\s*:/.test(rest)) keys.push(m[0]);
      i += m[0].length - 1;
    }
  }
  return keys;
}
const app = fs.readFileSync(path.join(ROOT, "ui", "app.js"), "utf8");
const lang = fs.readFileSync(path.join(ROOT, "ui", "lang.js"), "utf8");

const keys = screenKeys(lang);
const screens = callsOf(app, "onScreen").map((c) => c.name).filter(Boolean);
const strays = Array.from(new Set(screens.filter((n) => keys.indexOf(n) < 0)));
const known = new Set(screens);
check(keys.length >= 15 && screens.length >= 15 && strays.length === 0 && known.has("cards") && known.has("settings"),
  "1c every screen name ui/app.js passes to onScreen is a key of the table, " + new Set(screens).size
  + " names over " + keys.length + " keys" + (strays.length ? ": " + strays.join(", ") : ""));

console.log("#counts checks=" + asserted + " failed=" + failed + " expected=" + EXPECTED);
if (asserted !== EXPECTED) {
  console.log("SUITE DID NOT COMPLETE: " + asserted + " of " + EXPECTED + " checks ran");
  process.exit(78);
}
console.log(failed ? "  RESULT: FAIL " + failed + " of " + asserted : "  RESULT: ok " + asserted + " check(s)");
process.exit(Math.min(failed, 63));
