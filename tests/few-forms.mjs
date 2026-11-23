/* EVERY COUNTED NOUN HAS ITS POLISH FEW FORM, the one 2 to 4 take.
 *
 *     node tests/few-forms.mjs
 *
 * WHY THIS FILE EXISTS. Polish counts three ways: 1 karta, 2 karty, 5 kart. ui/lang.js keeps the
 * few form in its own table, PL_FEW, keyed by the English plural, and C() falls back to the many
 * form (the genitive) where a noun has no row. So a counted noun that arrives without a row reads
 * right at 1, 5 and 12 and wrong at 2, 3 and 4, on a real screen, and nothing said so: the only
 * leg near it, tests/polish.mjs 1c, pinned how MANY rows the table has, and a new noun with no row
 * leaves that number alone. That is how "3 nowych kart" reached the review queue (polish 03,
 * item 7, 2026-09-24): four nouns counted in ui/app.js with no few form between them.
 *
 * THE CLASS, NOT THE INSTANCE. What is held here is every counted noun in the product, found by
 * reading every call that counts, and never a list written in this file:
 *   - every call of the page's C() (ui/**, under whatever name it is bound to from
 *     window.STUDIO_T.C) and of the node half's counted() (src/**, shell/**, under whatever name
 *     it is imported as), read by a small lexer that knows strings, template literals and their
 *     substitutions, comments and regular expressions, so a call inside a template is found and
 *     one inside a comment or a string is not;
 *   - an argument this scan cannot read as a literal is REFUSED rather than skipped, and so is
 *     any other way into the counting (C passed as a value, a hand-built { n, one, many }), so
 *     the set of nouns read is the set of nouns there are. The one forwarder allowed is the
 *     page's saidText, which counts `x.one` and `x.many` of an object only counted() builds, and
 *     that premise is itself a leg (1a).
 * Then: every noun's many form has a PL_FEW row (1b), every row belongs to a noun (1c, where a
 * misspelt key shows), no "{N} ..." pair in the table is counted by hand through T() (1d), and
 * the page's own C(), run from ui/lang.js as shipped, puts that row out at 2, 3, 4, 22 and 102
 * for every noun (1e).
 * Section 2 holds that a number never stands apart from its word, in any language: the matcher's
 * sight (2a), every noun through C() (2b), every frame of the table through T() with numbers in
 * its slots (2c), a number followed by a parenthesis (2c2), and, as the control, words and
 * dates (2d), and every literal in ui/** meeting a value (2e).
 *
 * WHAT IT CANNOT SEE, said rather than implied: a count built by hand from a number and a word,
 * n + " " + T("files"), carries no mark of being a count at all, and its lone space is not read by
 * 2e either (tests/polish.mjs section 8 reads the screens for it); and whether a few form is the
 * RIGHT Polish word is prose, which Maxim reads.
 *
 * PROVED BY MAKING IT FAIL: FEW_FORMS_ROOT=<an export of d882f9c's ui, src and shell> reads that
 * tree instead, and 1b names the four nouns of item 7 and nothing else, where polish.mjs 1c,
 * pinned at 25 rows that day, passed.
 *
 * Node only, no window, no Electron: ui/lang.js is run in a vm context, as a page would run it.
 * Exit 0 when every check holds, 1 when any fails, 2 when the gate itself could not run.
 */
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = process.env.FEW_FORMS_ROOT ? path.resolve(process.env.FEW_FORMS_ROOT) : path.resolve(HERE, "..");

let asserted = 0, failed = 0;
function check(cond, line) {
  asserted++;
  if (cond) process.stdout.write("  ok   " + line + "\n");
  else { failed++; process.stdout.write("  FAIL " + line + "\n"); }
}

/* ---- the lexer ---------------------------------------------------------------------------------
 * Returns the source with every string, template text, comment and regular expression blanked to
 * spaces (lengths kept, so an offset in one is an offset in the other), and the string literals
 * with their spans and values. A template's ${...} is code, and is lexed as code. */
const KEYWORDS_BEFORE_REGEX = new Set(["return", "typeof", "case", "do", "else", "in", "of", "new",
  "delete", "void", "throw", "yield", "await", "instanceof"]);
function lex(src) {
  const out = src.split("");
  const strings = [];
  const blank = (a, b) => { for (let k = a; k < b; k++) if (out[k] !== "\n") out[k] = " "; };
  const BS = String.fromCharCode(92);
  let i = 0;
  const stack = [];          /* brace depth inside each open ${ */
  let lastSig = "";          /* last significant code character, or a keyword */
  const n = src.length;
  function readTemplate(start) {
    /* at a backtick or just after a closing } of a substitution; returns index after the part */
    let j = start, text = "", subst = false;
    while (j < n) {
      const c = src[j];
      if (c === BS) { text += src.slice(j, j + 2); j += 2; continue; }
      if (c === "`") { blank(start, j + 1); return { end: j + 1, text, subst, closed: true }; }
      if (c === "$" && src[j + 1] === "{") { blank(start, j + 2); return { end: j + 2, text, subst: true, closed: false }; }
      text += c; j++;
    }
    throw new Error("unterminated template literal at offset " + start);
  }
  let tmplOpen = null;       /* the literal record of the template being built */
  while (i < n) {
    const c = src[i], d = src[i + 1];
    if (c === "/" && d === "/") { const e = src.indexOf("\n", i); const end = e < 0 ? n : e; blank(i, end); i = end; continue; }
    if (c === "/" && d === "*") { const e = src.indexOf("*/", i + 2); if (e < 0) throw new Error("unterminated comment at " + i); blank(i, e + 2); i = e + 2; continue; }
    if (c === '"' || c === "'") {
      let j = i + 1, raw = "";
      while (j < n && src[j] !== c) { if (src[j] === BS) { raw += src.slice(j, j + 2); j += 2; continue; } if (src[j] === "\n") throw new Error("unterminated string at " + i); raw += src[j]; j++; }
      const value = c === '"' ? JSON.parse('"' + raw + '"') : JSON.parse('"' + raw.split(BS + "'").join("'").split('"').join(BS + '"') + '"');
      strings.push({ start: i, end: j + 1, value, template: false, subst: false });
      blank(i, j + 1); i = j + 1; lastSig = "a"; continue;
    }
    if (c === "`") {
      /* Read from the character AFTER the opening backtick, as the continuation below reads from
         after its brace: read from the backtick itself, the template closed there, empty, and its
         text was lexed as code (0c). */
      blank(i, i + 1);
      const r = readTemplate(i + 1);
      const rec = { start: i, end: r.end, value: r.text, template: true, subst: r.subst };
      strings.push(rec);
      if (!r.closed) { stack.push(0); tmplOpen = tmplOpen || []; tmplOpen.push(rec); }
      i = r.end; lastSig = r.closed ? "a" : "("; continue;
    }
    if (c === "{" && stack.length) { stack[stack.length - 1]++; }
    if (c === "}" && stack.length) {
      if (stack[stack.length - 1] === 0) {
        stack.pop();
        const rec = tmplOpen.pop();
        const r = readTemplate(i + 1);
        blank(i, i + 1);
        rec.end = r.end; rec.subst = true;
        if (!r.closed) { stack.push(0); tmplOpen.push(rec); }
        i = r.end; lastSig = r.closed ? "a" : "("; continue;
      }
      stack[stack.length - 1]--;
    }
    if (c === "/") {
      const regexOk = lastSig === "" || "(,=:[!&|?{};+-*%<>~^".indexOf(lastSig) > -1 || KEYWORDS_BEFORE_REGEX.has(lastSig);
      if (regexOk) {
        let j = i + 1, cls = false;
        while (j < n) {
          const x = src[j];
          if (x === BS) { j += 2; continue; }
          if (x === "\n") throw new Error("unterminated regular expression at " + i);
          if (cls) { if (x === "]") cls = false; }
          else if (x === "[") cls = true;
          else if (x === "/") break;
          j++;
        }
        j++;
        while (j < n && /[a-z]/.test(src[j])) j++;
        blank(i, j); i = j; lastSig = "a"; continue;
      }
    }
    if (/[A-Za-z_$]/.test(c)) {
      let j = i; while (j < n && /[A-Za-z0-9_$]/.test(src[j])) j++;
      const w = src.slice(i, j);
      lastSig = KEYWORDS_BEFORE_REGEX.has(w) ? w : "a";
      i = j; continue;
    }
    if (/[0-9]/.test(c)) { lastSig = "a"; i++; continue; }
    if (!/\s/.test(c)) lastSig = c === ")" || c === "]" ? "a" : c;
    i++;
  }
  return { code: out.join(""), strings };
}

const lineAt = (src, i) => src.slice(0, i).split("\n").length;

/* The calls of `names` in one file: each with its argument spans. `defs` are skipped: a name
   after the keyword function, or a call whose closing bracket is followed by a brace (a method
   written in shorthand). Also returns every mention of a name that is not a call. */
function callsOf(src, lx, names, dotted) {
  const calls = [], mentions = [];
  const code = lx.code;
  const alt = names.map(x => x.replace(/[$]/g, "[$]")).join("|");
  if (!alt) return { calls, mentions };
  const re = new RegExp("(^|[^A-Za-z0-9_$.])(" + alt + ")(?![A-Za-z0-9_$])", "g");
  const found = [];
  let m;
  while ((m = re.exec(code))) found.push({ at: m.index + m[1].length, name: m[2] });
  if (dotted) {
    const re2 = /STUDIO_T\s*\.\s*C(?![A-Za-z0-9_$])/g;
    while ((m = re2.exec(code))) found.push({ at: m.index, name: m[0], dotted: true });
  }
  for (const f of found) {
    let k = f.at + f.name.length;
    while (k < code.length && /\s/.test(code[k])) k++;
    const before = code.slice(0, f.at).replace(/\s+$/, "");
    if (/(^|[^A-Za-z0-9_$])function$/.test(before)) continue;
    if (code[k] !== "(") { mentions.push({ at: f.at, name: f.name, line: lineAt(src, f.at) }); continue; }
    let depth = 0, j = k, argStart = k + 1;
    const args = [];
    for (; j < code.length; j++) {
      const ch = code[j];
      if (ch === "(" || ch === "[" || ch === "{") depth++;
      else if (ch === ")" || ch === "]" || ch === "}") { depth--; if (depth === 0) { args.push([argStart, j]); break; } }
      else if (ch === "," && depth === 1) { args.push([argStart, j]); argStart = j + 1; }
    }
    let after = j + 1; while (after < code.length && /\s/.test(code[after])) after++;
    if (code[after] === "{") continue;                     /* a method's definition */
    calls.push({ at: f.at, name: f.name, line: lineAt(src, f.at), args });
  }
  return { calls, mentions };
}

/* An argument read as a literal: nothing in it but string literals (templates without a
   substitution) joined by +, whitespace and brackets. Null if it is anything else. */
function literalOf(src, lx, span) {
  const [a, b] = span;
  const rest = lx.code.slice(a, b).replace(/[\s+()]/g, "");
  if (rest !== "") return null;
  const parts = lx.strings.filter(s => s.start >= a && s.end <= b);
  if (!parts.length || parts.some(s => s.subst)) return null;
  return parts.map(s => s.value).join("");
}

/* ---- a number loose from its word ----------------------------------------------------------------
 * Where one of `nums` meets a word in `out` across an ordinary space: a letter after it, or a
 * letter or a colon before it, which covers "3 cards", "cards: 3" and "rev 3" alike. A number
 * that is only part of a longer one is not it. Returns the places, each with its neighbourhood. */
const WORD_AFTER = /\p{L}/u, WORD_BEFORE = /[\p{L}:]/u, SPACE = /[ \t\r\n]/;
function loose(out, nums) {
  const found = [];
  for (const n of nums) {
    const s = String(n);
    for (let at = out.indexOf(s); at >= 0; at = out.indexOf(s, at + 1)) {
      const end = at + s.length;
      if (/\d/.test(out[at - 1] || "") || /\d/.test(out[end] || "")) continue;
      const after = SPACE.test(out[end] || "") && WORD_AFTER.test(out[end + 1] || "");
      const before = SPACE.test(out[at - 1] || "") && WORD_BEFORE.test(out[at - 2] || "");
      if (after || before) found.push(JSON.stringify(out.slice(Math.max(0, at - 14), end + 14)));
    }
  }
  return found;
}

/* The literals in ui/** whose edge is an ordinary space beside a word and whose neighbour across
   a + is not another literal: "rev " + x, x + " cards", and the same inside markup. A literal of
   a space alone, x + " " + y, is not read: it joins sentences as often as it counts, so that
   case is the screen's to catch (tests/polish.mjs section 8). An edge that is an attribute,
   ' title="', is markup and not a word.

   THE WRITER'S ANSWER (the test architect, 2026-11-17): the scan cannot tell a name from a count ("Num " + key, a key's name in a
   chord's label), so the writer says. The marker NAME_MARK directly after the literal on its line, only white space between the
   closing quote and the comment, makes that literal no site; it is listed as named, so every exemption is printed and counted at
   every run. A marker on a literal that would be no site without it is idle, and an idle marker is a red: markers are not
   sprinkled. `noNames` takes the exemption out, which is the plant of 2e1. Writing the join in three pieces ("Num" + " " + key)
   would also pass, and is the shape that hides a real hand-built count; the marker is the way. */
const NAME_MARK = "/* few-forms: a name, not a count */";
function edgesOf(src, noNames) {
  const sites = [], named = [], idle = [];
  let read = 0;
  const lx = lex(src);
  const code = lx.code;
  const ends = new Set(lx.strings.map(t => t.end - 1)), starts = new Set(lx.strings.map(t => t.start));
  const back = (k) => { while (k >= 0 && /\s/.test(code[k]) && !ends.has(k)) k--; return k; };
  const fwd = (k) => { while (k < code.length && /\s/.test(code[k]) && !starts.has(k)) k++; return k; };
  for (const s of lx.strings) {
    if (s.subst) continue;
    read++;
    const head = s.value.replace(/^(<[^>]*>)+/, ""), tail = s.value.replace(/(<[^>]*>)+$/, "");
    const lead = /^ \p{L}/u.test(head) && !/=["']/.test(head.split("<")[0]);
    const trail = /[\p{L}:] $/u.test(tail) && !/=["']/.test(tail.split(">").pop());
    const k = back(s.start - 1), e = fwd(s.end);
    const leftValue = code[k] === "+" && !ends.has(back(k - 1));
    const rightValue = code[e] === "+" && !starts.has(fwd(e + 1));
    const isSite = (lead && leftValue) || (trail && rightValue);
    const gap = /^[ \t]*/.exec(src.slice(s.end, s.end + 200))[0].length;
    const marked = !noNames && src.startsWith(NAME_MARK, s.end + gap);
    if (!isSite && !marked) continue;
    const label = lineAt(src, s.start) + " " + JSON.stringify(s.value.length > 30
      ? (lead && leftValue ? s.value.slice(0, 30) : s.value.slice(-30)) : s.value);
    (marked ? (isSite ? named : idle) : sites).push(label);
  }
  return { read, sites, named, idle };
}
function handBuilt() {
  const files = walk(path.join(ROOT, "ui"), /\.(m?js)$/);
  const sites = [], named = [], idle = [];
  let read = 0;
  for (const f of files) {
    const rel = path.relative(ROOT, f).split(path.sep).join("/");
    const r = edgesOf(fs.readFileSync(f, "utf8"));
    read += r.read;
    r.sites.forEach(x => sites.push(rel + ":" + x));
    r.named.forEach(x => named.push(rel + ":" + x));
    r.idle.forEach(x => idle.push(rel + ":" + x));
  }
  return { files: files.length, read, sites, named, idle };
}

/* ---- the files ------------------------------------------------------------------------------- */
function walk(dir, re) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) { if (e.name !== "node_modules") out.push(...walk(p, re)); }
    else if (re.test(e.name)) out.push(p);
  }
  return out;
}

function scanProduct() {
  const files = ["ui", "src", "shell"].flatMap(d => walk(path.join(ROOT, d), /\.(m?js)$/));
  const nouns = [];            /* { one, many, where } */
  const refused = [];          /* strings naming what could not be read */
  let calls = 0;
  for (const f of files) {
    const rel = path.relative(ROOT, f).split(path.sep).join("/");
    const src = fs.readFileSync(f, "utf8");
    let lx;
    try { lx = lex(src); } catch (e) { refused.push(rel + ": the lexer could not read it (" + e.message + ")"); continue; }
    const code = lx.code;
    /* The names that count here. The page's C() under whatever it is bound to; counted() under
       whatever it is imported as, or its own name in the file that defines it. */
    const names = new Set();
    let m;
    const bindC = /(?:const|let|var)\s+([A-Za-z_$][A-Za-z0-9_$]*)\s*=\s*(?:window\s*\.\s*)?STUDIO_T\s*\.\s*C(?![A-Za-z0-9_$])/g;
    while ((m = bindC.exec(code))) names.add(m[1]);
    /* The from-clause's path is a string, blanked to spaces in `code`, so the import is found by
       its braces and the path read back from the first literal after the word from (a trailing
       \s* here would swallow the blanked path and land on the next import's). */
    const impRe = /import\s*\{([^}]*)\}\s*from/g;
    while ((m = impRe.exec(code))) {
      const lit = lx.strings.find(s => s.start >= m.index + m[0].length);
      if (!lit || !/refusal\.mjs$/.test(lit.value)) continue;
      m[1].split(",").map(s => s.trim()).forEach(spec => {
        const p = spec.split(/\s+as\s+/);
        if (p[0] === "counted") names.add((p[1] || p[0]).trim());
      });
    }
    const defines = /(^|[^A-Za-z0-9_$])function\s+counted\s*\(/.test(code);
    if (defines) names.add("counted");
    /* A STUDIO_T mention that is not a property read hands the whole table on, C and all, to a
       name this scan does not follow. */
    const bare = /STUDIO_T(?![A-Za-z0-9_$])\s*(?!\s*\.)/g;
    while ((m = bare.exec(code))) {
      const tail = code.slice(m.index + 8).replace(/^\s+/, "");
      /* ui/lang.js's own assignment of the table is where it is made, not where it is handed on */
      const made = rel === "ui/lang.js" && tail[0] === "=" && tail[1] !== "=";
      if (tail[0] !== "." && !made) refused.push(rel + ":" + lineAt(src, m.index) + " hands window.STUDIO_T on whole");
    }
    const r = callsOf(src, lx, [...names], /(^|\/)ui\//.test(rel));
    calls += r.calls.length;
    for (const x of r.mentions) {
      /* the binding itself, the import specifier and the export of the definition are mentions
         that count nothing */
      const lineText = src.split("\n")[x.line - 1];
      const isBinding = new RegExp("(const|let|var)\\s+" + x.name + "\\s*=").test(lineText) || /STUDIO_T\s*\.\s*C/.test(x.name) && bindC.test(lineText);
      bindC.lastIndex = 0;
      const isImport = /^\s*import\s*\{/.test(lineText) || /^\s*[A-Za-z_$, ]*\}\s*from\s/.test(lineText);
      const isExport = /^\s*export\s*\{/.test(lineText);
      if (isBinding || isImport || isExport) continue;
      refused.push(rel + ":" + x.line + " uses " + x.name + " as a value, so what it counts cannot be read");
    }
    for (const c of r.calls) {
      const where = rel + ":" + c.line;
      if (c.args.length < 3) { refused.push(where + " calls " + c.name + " with " + c.args.length + " argument(s)"); continue; }
      const one = literalOf(src, lx, c.args[1]), many = literalOf(src, lx, c.args[2]);
      if (one !== null && many !== null) { nouns.push({ one, many, where }); continue; }
      /* THE FORWARDER: x.one and x.many of an object, which only counted() builds (1a holds that
         premise below). */
      const a1 = code.slice(...c.args[1]).trim(), a2 = code.slice(...c.args[2]).trim();
      const fw = /^([A-Za-z_$][A-Za-z0-9_$.]*)\.one$/.exec(a1), fw2 = /^([A-Za-z_$][A-Za-z0-9_$.]*)\.many$/.exec(a2);
      if (fw && fw2 && fw[1] === fw2[1]) { nouns.push({ forwarder: true, where }); continue; }
      refused.push(where + " counts a noun this scan cannot read: " + JSON.stringify(src.slice(c.args[1][0], c.args[2][1]).trim().slice(0, 60)));
    }
    /* An object literal carrying `many` is a counted noun built by hand, reaching the forwarder
       without passing counted(); only counted() itself may build one. */
    const manyKey = /[{,]\s*many\s*(?=[:,}])/g;
    while ((m = manyKey.exec(code))) {
      if (defines) continue;
      refused.push(rel + ":" + lineAt(src, m.index) + " builds a { many } by hand, outside counted()");
    }
  }
  return { files: files.length, calls, nouns, refused };
}

/* ---- the page's own table and C(), run as a page runs them -------------------------------------
   The source is run unchanged but for one line: the table object handed to window gains two
   read-only views of the tables, so this file compares against the rows C() itself reads. */
function loadLang() {
  const src = fs.readFileSync(path.join(ROOT, "ui", "lang.js"), "utf8");
  const ANCHOR = "window.STUDIO_T = {";
  if (src.split(ANCHOR).length !== 2) throw new Error("ui/lang.js no longer hands its table to window as " + ANCHOR);
  const window = {};
  vm.runInNewContext(src.replace(ANCHOR, ANCHOR + " __few: () => Object.assign({}, PL_FEW), __pl: () => Object.assign({}, PL),"),
    { window, String, Object, Array, JSON, Math, Number });
  return window.STUDIO_T;
}

function main() {
  const S = scanProduct();
  const L = loadLang();
  const FEW = L.__few(), PLT = L.__pl();
  const fewKeys = Object.keys(FEW);
  const nouns = S.nouns.filter(x => !x.forwarder);
  const manys = new Map();
  nouns.forEach(x => { if (!manys.has(x.many)) manys.set(x.many, []); manys.get(x.many).push(x.where); });

  /* 0: the gate's own sight. Floors, not the numbers: 56 C() and 20 counted() sites on
     2026-09-24, 33 distinct nouns. */
  check(S.files >= 20 && S.calls >= 50 && manys.size >= 25 && fewKeys.length >= 25,
    "0a the scan read " + S.files + " product files and found " + S.calls + " counting calls over "
    + manys.size + " distinct nouns; the page's table holds " + fewKeys.length + " few rows");
  const probe = lex("const C = window.STUDIO_T.C; // C(1, \"{N} a\", \"{N} as\")\n"
    + "const s = \"C(2, 'x', 'y')\"; const r = /C\\(/g; const t = `${C(3, \"{N} b\", \"{N} bs\")} and ${`${C(4, \"{N} c\" + \"\", \"{N} cs\")}`}`;\n"
    + "const d = x / 2; C(5, \"{N} d\", \"{N} ds\");");
  const pc = callsOf("", probe, ["C"], true).calls.map(c => [literalOf("", probe, c.args[1]), literalOf("", probe, c.args[2])]);
  const pcWant = [["{N} b", "{N} bs"], ["{N} c", "{N} cs"], ["{N} d", "{N} ds"]];
  check(JSON.stringify(pc) === JSON.stringify(pcWant),
    "0b the lexer finds a call inside a template's substitution, nested, and after a division, and"
    + " none in a comment, a string or a regular expression: " + JSON.stringify(pc));
  /* 0c: A TEMPLATE'S TEXT IS TEXT. 0b passes whichever way round the lexer reads a template,
     because a call in a substitution is code both ways; what tells the two apart is the text
     between the backticks. Until 2026-09-24 each template closed at its own opening backtick and
     its text was lexed as code (the lead engineer's reproduction: `${n} cards` gave two empty
     templates, neither with a substitution), so a call written in a template's TEXT was counted
     and a count built in a template could never be one 2e reads. */
  const tp = lex("const f = `${n} cards`; const g = `plain C(9, \"x\", \"y\") text`;\n");
  const tps = tp.strings.map(s => ({ template: s.template, subst: s.subst, value: s.subst ? null : s.value }));
  const tpWant = [{ template: true, subst: true, value: null },
                  { template: true, subst: false, value: "plain C(9, \"x\", \"y\") text" }];
  const tpCalls = callsOf("", tp, ["C"], true).calls.length;
  check(JSON.stringify(tps) === JSON.stringify(tpWant) && tpCalls === 0
        && !/cards|plain|text/.test(tp.code) && /\bn\b/.test(tp.code),
    "0c the lexer reads a template's text as one literal and its substitution as code: "
    + JSON.stringify(tps) + ", " + tpCalls + " call(s) found in a template's text, and the code keeps"
    + " the substitution's name and none of the text");

  /* 1a: nothing counts a noun where this gate cannot read it. */
  check(S.refused.length === 0,
    "1a every counting call names its noun as a literal, or forwards counted()'s own - "
    + S.nouns.filter(x => x.forwarder).length + " forwarder(s)"
    + (S.refused.length ? "; cannot read: " + S.refused.join("; ") : ""));

  /* 1b: THE CLASS. Every counted noun has its few form. */
  const lacking = [...manys.keys()].filter(k => !Object.prototype.hasOwnProperty.call(FEW, k));
  check(lacking.length === 0,
    "1b every one of the " + manys.size + " counted nouns has a Polish few form for 2 to 4"
    + (lacking.length ? "; none for " + lacking.map(k => JSON.stringify(k) + " (" + manys.get(k).join(", ") + ")").join(", ") : ""));

  /* 1c: every few row belongs to a counted noun. A misspelt key is one noun without a row and one
     row without a noun, and this is the half that names the spelling. */
  const orphan = fewKeys.filter(k => !manys.has(k));
  check(orphan.length === 0,
    "1c every one of the " + fewKeys.length + " few rows is the plural of a noun something counts"
    + (orphan.length ? "; counted by nothing: " + orphan.map(k => JSON.stringify(k)).join(", ") : ""));

  /* 1d: a pair "{N} <word>" in the table that no call counts is a count said through T() by
     hand, which C() never sees and which therefore has no few form on screen. A ratio "{N} of
     {TOTAL} ..." counts nothing by N: its noun follows the total, and the copywriter's Polish says it
     without agreement ("części: {N} z {TOTAL}"), so it needs no few form. */
  const forms = new Set(); nouns.forEach(x => { forms.add(x.one); forms.add(x.many); });
  const byHand = Object.keys(PLT).filter(k => /^\{N\} \S/.test(k) && !/^\{N\} of \{TOTAL\} /.test(k) && !forms.has(k));
  check(byHand.length === 0,
    "1d every \"{N} ...\" pair in the table is a form of a counted noun"
    + (byHand.length ? "; counted by nothing: " + byHand.map(k => JSON.stringify(k)).join(", ") : ""));

  /* 1e: the page's own C(), forced Polish, puts the row out at 2, 3, 4, 22 and 102 for every
     noun that has one. */
  const NB = String.fromCharCode(160);
  L.force("pl");
  const off = [];
  for (const x of nouns) {
    if (!Object.prototype.hasOwnProperty.call(FEW, x.many)) continue;
    for (const k of [2, 3, 4, 22, 102]) {
      const want = String(FEW[x.many]).replace("{N} ", k + NB).replace("{N}", String(k));
      const got = L.C(k, x.one, x.many);
      if (got !== want) { off.push(x.many + " at " + k + ": " + JSON.stringify(got)); break; }
    }
  }
  L.set("en");
  check(off.length === 0, "1e the page's C() puts each noun's few row out at 2, 3, 4, 22 and 102"
    + (off.length ? "; not so for " + off.slice(0, 6).join(", ") : ""));

  /* ---- 2. THE NUMBER STAYS WITH ITS WORD, IN EVERY LANGUAGE ------------------------------------ */

  /* 2a: the matcher's own sight, on a string it must refuse three times and one it must pass. */
  const plant = loose("rev 701 and 702 cards, cards: 703 (704) x", [701, 702, 703, 704]);
  const planted = loose(["rev", "701", "and", "702", "cards, cards:", "703"].join(NB), [701, 702, 703]);
  check(plant.length === 3 && planted.length === 0,
    "2a the matcher finds a number loose from the word before it, after it and after a colon ("
    + plant.length + " of 3), and none once each space is a no-break space (" + planted.length + ")");

  /* 2b: THE COUNTED NOUNS. Every noun the scan read, through the page's own C(), in both languages. */
  const AT = [0, 1, 2, 3, 5, 12, 22, 101, 1000];
  const cLoose = [];
  for (const [lang, go] of [["en", () => L.set("en")], ["pl", () => L.force("pl")]]) {
    go();
    for (const x of nouns) for (const k of AT) {
      const got = L.C(k, x.one, x.many);
      if (loose(got, [k]).length || got.indexOf(String(k)) < 0) { cLoose.push(lang + " " + JSON.stringify(got)); break; }
    }
  }
  L.set("en");
  check(cLoose.length === 0, "2b the page's C() binds the number to its noun for every one of the "
    + manys.size + " counted nouns at " + AT.join(", ") + ", in English and in Polish"
    + (cLoose.length ? "; loose: " + cLoose.slice(0, 6).join(", ") : ""));

  /* 2c: THE FRAMES. Every sentence in the table that takes a value, said through the page's own
     T() in both languages with a number in every slot, and again with a counted phrase (a number,
     a no-break space and a word, which is what C() hands a frame). */
  const frames = Object.keys(PLT).filter(k => /\{\w+\}/.test(k) || /\{\w+\}/.test(PLT[k]));
  const tLoose = [];
  let said = 0;
  for (const [lang, go] of [["en", () => L.set("en")], ["pl", () => L.force("pl")]]) {
    go();
    for (const f of frames) {
      const names = Array.from(new Set((f + " " + PLT[f]).match(/\{\w+\}/g).map(x => x.slice(1, -1))));
      for (const phrase of [false, true]) {
        const vars = {}, nums = [];
        names.forEach((k, i) => { nums.push(701 + i); vars[k] = phrase ? (701 + i) + NB + "Qwerk" : 701 + i; });
        const got = L.T(f, vars);
        said++;
        const l = loose(got, nums);
        if (l.length) { tLoose.push(lang + " " + l[0]); break; }
      }
    }
  }
  L.set("en");
  check(frames.length >= 150 && tLoose.length === 0, "2c the page's T() binds a number to the word"
    + " on either side of it in every one of the " + frames.length + " frames that take a value,"
    + " in English and in Polish (" + said + " sentences said)"
    + (tLoose.length ? "; loose: " + tLoose.slice(0, 6).join(" | ") : ""));

  /* 2c2: a value that is a number followed by a parenthesis (as revSaid builds) binds to the
     word before it as a number does. */
  const tParenLoose = [];
  let parenSaid = 0;
  for (const [lang, go] of [["en", () => L.set("en")], ["pl", () => L.force("pl")]]) {
    go();
    for (const f of frames) {
      const names = Array.from(new Set((f + " " + PLT[f]).match(/\{\w+\}/g).map(x => x.slice(1, -1))));
      const vars = {}, nums = [];
      names.forEach((k, i) => { nums.push(701 + i); vars[k] = (701 + i) + " (2026-11-04)"; });
      const got = L.T(f, vars);
      parenSaid++;
      const l = loose(got, nums);
      if (l.length) { tParenLoose.push(lang + " " + l[0]); break; }
    }
  }
  L.set("en");
  check(frames.length >= 150 && tParenLoose.length === 0, "2c2 and a number followed by a parenthesis"
    + " binds to the word before it in every one of the " + frames.length + " frames,"
    + " in English and in Polish (" + parenSaid + " sentences said)"
    + (tParenLoose.length ? "; loose: " + tParenLoose.slice(0, 6).join(" | ") : ""));

  /* 2d: the control. With a word, or a date, in every slot T() adds no no-break space at all, so
     2c measured the binding of numbers and not a T() that binds everything. */
  const glued = [];
  for (const [lang, go] of [["en", () => L.set("en")], ["pl", () => L.force("pl")]]) {
    go();
    for (const f of frames) for (const value of ["Qwerk", "2026-09-24"]) {
      const vars = {};
      ((f + " " + PLT[f]).match(/\{\w+\}/g) || []).forEach(x => { vars[x.slice(1, -1)] = value; });
      const got = L.T(f, vars);
      if (got.split(NB).length !== (lang === "pl" ? PLT[f] : f).split(NB).length) glued.push(lang + " " + JSON.stringify(got));
    }
  }
  L.set("en");
  check(glued.length === 0, "2d and with a word or a date in every slot the same frames say it with"
    + " the spaces they were written with" + (glued.length ? "; glued: " + glued.slice(0, 4).join(" | ") : ""));

  /* 2e: THE COUNTS BUILT BY HAND. No literal in ui/** meets a value across an ordinary space
     beside a word; the value might be a number, and this scan cannot tell. */
  const probeEdges = edgesOf("const a = n + \" cards\"; const b = \"<b>rev \" + r;"
    + " const c = \"one\" + \" two\"; const d = ' title=\"' + t; const e = x + \" \" + y;").sites;
  check(probeEdges.length === 2, "2e0 the edge scan finds a value before \" cards\" and after"
    + " \"rev \" inside markup, and not a literal joined to a literal, an attribute or a lone space: "
    + probeEdges.join(", "));
  /* 2e1 to 2e3: the writer's answer. A marked literal is no site and is named; the same literal unmarked is a site; a marker that
     is not directly after the literal exempts nothing; and with the exemption taken out (the plant) the marked one is a site again. */
  const nameMarked = "const a = \"Num \" " + NAME_MARK + " + k;";
  const nameBare = "const a = \"Num \" + k;";
  const nameLate = "const a = \"Num \" + " + NAME_MARK + " k;";
  const pm = edgesOf(nameMarked), pb = edgesOf(nameBare), pl = edgesOf(nameLate), pp = edgesOf(nameMarked, true);
  check(pm.sites.length === 0 && pm.named.length === 1 && pm.idle.length === 0 && pb.sites.length === 1 && pb.named.length === 0
    && pl.sites.length === 1 && pl.named.length === 0,
    "2e1 a literal marked as a name, not a count, is no site and is named; unmarked it is a site, and a marker past the + exempts nothing: marked "
    + pm.sites.length + " site(s) " + pm.named.length + " named, unmarked " + pb.sites.length + " site(s), late marker " + pl.sites.length + " site(s)");
  check(pp.sites.length === 1 && pp.named.length === 0,
    "2e1-plant with the exemption taken out the marked literal is a site again: " + pp.sites.length + " site(s), " + pp.named.length + " named");
  const idleProbe = edgesOf("const a = \"Num\" " + NAME_MARK + " + k;");
  check(idleProbe.idle.length === 1 && idleProbe.named.length === 0 && idleProbe.sites.length === 0,
    "2e2 a marker on a literal that is no site without it is idle, not named: " + idleProbe.idle.length + " idle, " + idleProbe.named.length + " named");
  const edges = handBuilt();
  check(edges.sites.length === 0 && edges.read >= 1000, "2e no literal in the page's "
    + edges.files + " files meets a value across an ordinary space beside a word, over "
    + edges.read + " literals, " + edges.named.length + " of them named by its writer as a name and not a count"
    + (edges.sites.length ? "; at " + edges.sites.join(", ") : ""));
  check(edges.idle.length === 0, "2e3 every marker in the page marks a site: "
    + (edges.idle.length ? "the marker is not needed here: " + edges.idle.join(", ") : "none idle"));
  for (const x of edges.named) process.stdout.write("  named  " + x + " (a name, not a count, by its writer's marker)\n");

  process.stdout.write("#counts checks=" + asserted + " failed=" + failed + " files=" + S.files
    + " calls=" + S.calls + " nouns=" + manys.size + " fewRows=" + fewKeys.length
    + " refused=" + S.refused.length + " lacking=" + lacking.length
    + " frames=" + frames.length + " loose=" + (cLoose.length + tLoose.length + tParenLoose.length + edges.sites.length + edges.idle.length) + " named=" + edges.named.length + "\n");
  process.stdout.write("few-forms  " + asserted + " assertion(s), " + failed + " failure(s)\n");
  process.exit(failed ? 1 : 0);
}

try { main(); } catch (e) {
  process.stdout.write("  FAIL few-forms could not run: " + (e && e.stack ? e.stack : String(e)) + "\n");
  process.exit(2);
}
