/* EVERY PAIR IN THE TABLE IS ONE SOMETHING SAYS (board 858, H8).
 *
 *     node tests/lang-reached.mjs
 *
 * tests/polish.mjs 5a holds one direction: every literal ui/app.js hands to T() or C() is a pair of
 * ui/lang.js. Nothing held the other. A pair whose English nothing says any more stays in the table
 * for ever, translated, counted and read by nobody; "Appearance" was one (P16, removed 2026-10-07)
 * and was found by hand. And polish.mjs opens a window, so it runs only behind the window wall,
 * while this question needs no window: it is a reading of source text, and it runs in the node
 * chain.
 *
 * THE READING. Every English key of the PL table is looked for as a string literal anywhere under
 * ui/, src/ and shell/ (.js, .mjs, .cjs, .html), ui/lang.js included outside its own three tables.
 * Literals are read by tests/source-text.mjs's scanner, which skips comments and regex literals, so a key
 * kept only in a comment is not a key said (the trap of 2026-09-27: a text leg reads comments). Each
 * file first goes through withoutComments by its name, because the scanner reads JavaScript and an
 * .html file's <!-- --> comments are text to it (the test architect's read of 2026-10-07: a pair named
 * only inside an HTML comment read as said).
 * Adjacent literals joined by `+` are one literal, as the parser joins them; a `${...}` or a
 * non-literal operand of `+` is a hole, and a key the holes can fill counts as said by a pattern.
 * That second form is generous on purpose (", English" after a hole says "Title, English" and any
 * other key ending so), so this leg errs towards calling a pair said, and what it lists is
 * certainly said by no literal at all. The same method as the engine's i18n-scan whole-literal
 * reading and as the test architect's read of 2026-10-07.
 *
 *   lr1  every PL key is said, whole or by a pattern, save those named in KNOWN_UNSAID, exactly
 *   lr2  every PL_FEW key is a PL key, so no few form belongs to a plural the table lacks
 *   lr3  no key is written twice in PL (an object literal keeps the second silently), save KNOWN_TWICE
 *   lr4  CONTROLS, on invented text: a pair nothing says is listed; a pair said only in a comment,
 *        line, block or an .html file's <!-- -->, is listed; a pair said in a string or a page's
 *        live attribute is not; a key built as `x + ", tail"` is said by a pattern; a pair said
 *        only inside a regex literal is listed
 *
 * KNOWN_UNSAID and KNOWN_TWICE are ratchets, compared for equality: a new orphan reddens lr1, and so does removing
 * one from the table without removing it here. The one entry of each today is ui/lang.js's to take out
 * (ui/ belongs to the lead engineer), named in the test architect's report of 2026-10-07.
 *
 * Node only, no window. Exit 0 when every check holds, 1 when any fails.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { scanJs as scan, jsWithoutComments as blankComments, withoutComments, HOLE } from "./source-text.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");

/* Keys in ui/lang.js that no screen says yet, each named here until one does. */
const KNOWN_UNSAID = [
  "A name and a role. It is kept in the team file and shown to every teammate.",
];
/* "Card" is written at two lines of PL, both "Karta" today; a change to the first would be lost to
   the second without a word. Also ui/lang.js's to take out, and a ratchet as above. */
const KNOWN_TWICE = ["Card"];

let asserted = 0, failed = 0;
function check(cond, line) {
  asserted++;
  if (cond) process.stdout.write("  ok   " + line + "\n");
  else { failed++; process.stdout.write("  FAIL " + line + "\n"); }
}

/** The text of `const <name> = { ... }` in ui/lang.js, comments blanked, or null. */
function tableOf(langSrc, name) {
  const a = langSrc.indexOf("const " + name + " = {");
  if (a < 0) return null;
  const b = langSrc.indexOf("\n  };", a);
  return { at: a, end: b, text: blankComments(langSrc.slice(a, b)) };
}

/** The keys of a table block: a double-quoted string followed by a colon. */
function keysOf(block) {
  const keys = [];
  scan(block, {
    literal(text, a, b) { if (/^\s*:/.test(block.slice(b, b + 8))) keys.push(text); },
  });
  return keys;
}

/** Every string literal of a file, `+` chains joined, as { whole: [...], patterns: [...] }. */
function literals(src) {
  const whole = [], patterns = [];
  /* `plus` is a `+` seen since the last operand. A literal after it continues the chain, or, with
     no chain open, starts one with a hole (a non-literal stood before the plus); a non-literal
     operand after it puts a hole at the chain's end. Anything else closes the chain. */
  let chain = null, plus = false;
  const flush = () => { if (chain !== null) (chain.indexOf(HOLE) > -1 ? patterns : whole).push(chain); chain = null; };
  scan(src, {
    literal(s) {
      if (chain !== null && plus) chain += s;
      else { flush(); chain = (plus ? HOLE : "") + s; }
      plus = false;
    },
    operator(op) {
      if (op === "+") { plus = true; return; }
      if (plus && chain !== null && (op === "v" || op === "(")) { chain += HOLE; plus = false; return; }
      flush(); plus = false;
    },
  });
  flush();
  return { whole, patterns };
}

/** Whether a pattern (holes as NUL) can be filled to give `key`. */
function fills(pattern, key) {
  const parts = pattern.split(HOLE);
  if (parts.join("").replace(/\s+/g, "").length < 3) return false;
  let at = 0;
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i];
    if (i === 0) { if (!key.startsWith(p)) return false; at = p.length; continue; }
    if (i === parts.length - 1) return p === "" || (key.length - p.length >= at && key.endsWith(p));
    const q = key.indexOf(p, at); if (q < 0) return false; at = q + p.length;
  }
  return true;
}

/** The question itself, over ui/lang.js's text and the other files, each a [name, text] pair: the name
    says how its comments are taken out (an .html file's own, its styles' and its scripts'). */
export function reach(langSrc, files) {
  const PL = tableOf(langSrc, "PL");
  const keys = PL ? keysOf(PL.text) : [];
  let rest = langSrc;
  for (const name of ["NO_TWIN", "PL_FEW", "PL"]) {
    const t = tableOf(rest, name);
    if (t) rest = rest.slice(0, t.at) + rest.slice(t.end);
  }
  const whole = new Set(), patterns = [];
  for (const [name, text] of files.concat([["lang.js", rest]])) {
    const r = literals(withoutComments(text, name));
    r.whole.forEach(s => whole.add(s));
    r.patterns.forEach(p => patterns.push(p));
  }
  const byPattern = [], unsaid = [];
  for (const k of new Set(keys)) {
    if (whole.has(k)) continue;
    if (patterns.some(p => fills(p, k))) byPattern.push(k); else unsaid.push(k);
  }
  const few = tableOf(langSrc, "PL_FEW");
  return { keys, whole, patterns, byPattern, unsaid, fewKeys: few ? keysOf(few.text) : null };
}

function sourceFiles() {
  const out = [];
  const walk = d => {
    for (const f of fs.readdirSync(path.join(ROOT, d)).sort()) {
      const rel = d + "/" + f, st = fs.statSync(path.join(ROOT, rel));
      if (st.isDirectory()) walk(rel);
      else if (/[.](m?js|cjs|html)$/.test(f) && rel !== "ui/lang.js") out.push(rel);
    }
  };
  ["ui", "src", "shell"].forEach(walk);
  return out;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  const langSrc = fs.readFileSync(path.join(ROOT, "ui", "lang.js"), "utf8");
  const names = sourceFiles();
  const r = reach(langSrc, names.map(f => [f, fs.readFileSync(path.join(ROOT, f), "utf8")]));
  const distinct = new Set(r.keys);
  const unsaid = r.unsaid.slice().sort(), known = KNOWN_UNSAID.slice().sort();
  check(distinct.size > 900 && JSON.stringify(unsaid) === JSON.stringify(known),
    "lr1 of the " + distinct.size + " English keys of ui/lang.js's PL table, " + (distinct.size - r.byPattern.length - unsaid.length)
    + " are a whole literal and " + r.byPattern.length + " a pattern in " + names.length + " files of ui/, src/ and shell/;"
    + " unsaid " + JSON.stringify(unsaid) + ", known " + JSON.stringify(known)
    + (unsaid.length > known.length ? " (a pair nothing says: take it out of the table)" : "")
    + (unsaid.length < known.length ? " (a known one is said again or gone: take it off KNOWN_UNSAID)" : ""));
  const plSet = new Set(r.keys);
  const strayFew = (r.fewKeys || []).filter(k => !plSet.has(k));
  check(r.fewKeys && r.fewKeys.length > 5 && strayFew.length === 0,
    "lr2 every one of the " + (r.fewKeys ? r.fewKeys.length : 0) + " PL_FEW keys is a PL key"
    + (strayFew.length ? ": not " + JSON.stringify(strayFew) : ""));
  const seen = new Map(); r.keys.forEach(k => seen.set(k, (seen.get(k) || 0) + 1));
  const twice = [...seen].filter(([, n]) => n > 1).map(([k]) => k).sort();
  check(JSON.stringify(twice) === JSON.stringify(KNOWN_TWICE.slice().sort()),
    "lr3 the keys written twice in PL are " + JSON.stringify(twice) + ", known " + JSON.stringify(KNOWN_TWICE));

  /* lr4, the controls, on invented text in the table's own shape. */
  const LANG = 'const PL = {\n    "Zorbit plume": "a",\n    "Zorbit kept in a comment": "b",\n'
    + '    "Zorbit block": "c",\n    "Zorbit said": "d",\n    "Zorbit, English": "e",\n    "Zorbit in a regex": "f",\n'
    + '    "Zorbit in a page comment": "g",\n    "Zorbit on the page": "h",\n  };\n'
    + '  const PL_FEW = {\n  };\n';
  const APP = 'T("Zorbit said");\n// T("Zorbit kept in a comment")\n/* T("Zorbit block") */\n'
    + 'const f = head + ", English";\nconst re = /Zorbit in a regex/;\n';
  const PAGE = '<!-- <b title="Zorbit in a page comment"> -->\n<b title="Zorbit on the page">\n';
  const c = reach(LANG, [["app.js", APP], ["index.html", PAGE]]);
  check(JSON.stringify(c.unsaid.slice().sort()) === JSON.stringify(["Zorbit block", "Zorbit in a page comment", "Zorbit in a regex",
          "Zorbit kept in a comment", "Zorbit plume"])
        && JSON.stringify(c.byPattern) === JSON.stringify(["Zorbit, English"]),
    "lr4 controls: a pair nothing says, one said only in a line or a block comment, one only in an HTML comment and one only"
    + " in a regex are listed, a string and a page's live attribute are said, and a hole before \", English\" says it by a"
    + " pattern: unsaid " + JSON.stringify(c.unsaid)
    + ", pattern " + JSON.stringify(c.byPattern));

  console.log("#counts checks=" + asserted + " failed=" + failed);
  console.log("lang-reached: " + asserted + " check(s), " + failed + " failure(s)");
  process.exit(failed ? 1 : 0);
}
