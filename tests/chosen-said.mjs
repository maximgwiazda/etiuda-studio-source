/* WHAT IS CHOSEN IS SAID, AND A PICKER'S WORDS ARE THE PAGE'S.
 *
 *     node tests/chosen-said.mjs
 *
 * Two claims from the code pass survey of 2026-09-27, each held as a class rather than as the
 * sites the survey happened to name.
 *
 *   1  a screen reader is told which tab, rail row, wizard step and segment is on (finding 22).
 *      ui/app.js writes the class "on" only through its doors: saidOn() and saidOnIn(), which
 *      give a role and a state with the class, and four older ones that each write a state of
 *      their own (a tick's aria-checked, a disc's and the tour's aria-hidden). Any other line
 *      writing "on" is a control whose look says something its reader is not told (1b). saidOn()
 *      leaves every class exactly as the markup had it (1d), and every group of segments is a
 *      radiogroup (1e).
 *   2  a picker's words are the page's (finding 26). Every API.*Pick call in ui/app.js hands the
 *      preload as many values as it takes, so no word is left for the shell to fill in (2a); the
 *      words among them go through T() and each has Polish (2b); and a pair ui/lang.js says it
 *      took from the engine is the engine's at the pin (2c). tests/shell-guards.mjs section 5
 *      holds the other half: the shell writes nothing of its own into a dialog.
 *
 * WHAT IT CANNOT SEE, said rather than implied: what a screen reader actually speaks, which needs
 * NVDA in a window; whether these roles are the ones a listener expects, which is a judgement; an
 * "on" written through a variable rather than a literal, which no text scan reads; and whether
 * the Polish is good Polish, which Maxim reads.
 *
 * PROVED BY MAKING IT FAIL: CHOSEN_SAID_ROOT=<a folder holding ui/ and shell/> reads that tree
 * instead. An export of 87b623d's reddens 1b, naming the ten writes finding 22 stood on, and 1c to
 * 1e; its app.js beside today's preload reddens 2a, the export's call two values of three and the
 * upgrade's one of two, which is finding 26 seen from the page; today's tree with the pair taken
 * out of ui/lang.js and the upgrade's word passed bare reddens 2b and 2c.
 *
 * Node only, no window, no Electron. Exit 0 when every check holds, 1 when any fails.
 */
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { jsLiterals } from "./js-literals.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OWN = path.resolve(HERE, "..");
const ROOT = process.env.CHOSEN_SAID_ROOT ? path.resolve(process.env.CHOSEN_SAID_ROOT) : OWN;
const EXPECTED = 11;

let asserted = 0, failed = 0;
function check(cond, line) {
  asserted++;
  if (cond) process.stdout.write("  ok   " + line + "\n");
  else { failed++; process.stdout.write("  FAIL " + line + "\n"); }
}

/* ---- reading the source ------------------------------------------------------------------------
 * The comments are blanked, character for character so that every offset and line stays where it
 * was, and the strings are kept, since the literal "on" is what is looked for. A slash is a
 * regular expression where the last thing written could not end an operand, which is enough for
 * this file's patterns; a pattern holding a quote would otherwise open a string that runs on. */
function blankComments(src) {
  let out = "", i = 0, prev = "";
  while (i < src.length) {
    const c = src[i], d = src[i + 1];
    if (c === "/" && d === "*") {
      const j = src.indexOf("*/", i + 2), end = j < 0 ? src.length : j + 2;
      out += src.slice(i, end).replace(/[^\n]/g, " "); i = end; continue;
    }
    if (c === "/" && d === "/") {
      let j = src.indexOf("\n", i); if (j < 0) j = src.length;
      out += " ".repeat(j - i); i = j; continue;
    }
    if (c === '"' || c === "'" || c === "`") {
      let j = i + 1;
      while (j < src.length && src[j] !== c) j += src[j] === "\\" ? 2 : 1;
      out += src.slice(i, j + 1); i = j + 1; prev = c; continue;
    }
    if (c === "/" && (prev === "" || "(,=:[!&|?{};+-*%<>~^".indexOf(prev) >= 0)) {
      let j = i + 1, inClass = false;
      while (j < src.length && src[j] !== "\n") {
        if (src[j] === "\\") { j += 2; continue; }
        if (src[j] === "[") inClass = true;
        else if (src[j] === "]") inClass = false;
        else if (src[j] === "/" && !inClass) break;
        j++;
      }
      out += src.slice(i, j + 1); i = j + 1; prev = "/"; continue;
    }
    out += c; if (!/\s/.test(c)) prev = c; i++;
  }
  return out;
}

/* A function of the page's top level, from its line to the "  }" that closes it. */
function bodyOf(code, name) {
  const m = new RegExp("\\n  (?:async )?function " + name + "\\(").exec(code);
  if (!m) return "";
  const end = code.indexOf("\n  }\n", m.index + 1);
  return code.slice(m.index, end < 0 ? code.length : end + 4);
}

/* EVERY LITERAL "on" OR " on", with the function it is written in and its line. */
function onWrites(code) {
  const out = [], re = /(["'])\s?on\1/g;
  let m;
  while ((m = re.exec(code))) {
    const before = code.slice(0, m.index);
    const fns = [...before.matchAll(/\n\s*(?:async )?function (\w+)\(/g)];
    const line = before.split("\n").length;
    const lines = code.split("\n");
    /* The word as a value, not a class: compared (=== "on"), an array's item (["on", ...]) or a choice between the two values
       (? "on" : "off"). Section 9's owner's switch (decision 47) carries "on" and "off" as its data; only a class write is 1b's. */
    const near = before.slice(-16), after = code.slice(m.index + m[0].length, m.index + m[0].length + 12);
    const value = /[=!]==\s*$/.test(near) || /^\s*[=!]==/.test(after) || /\[\s*$/.test(near) || (/\?\s*$/.test(near) && /^\s*:\s*["']off["']/.test(after));
    if (value) continue;
    out.push({ fn: fns.length ? fns[fns.length - 1][1] : "", line,
               text: (lines[line - 1] + "\n" + (lines[line] || "")) });
  }
  return out;
}

/* THE DOORS, each with the state it writes beside the class. A door's name alone lets nothing
   through: 1c holds each one to its own attribute. */
const DOORS = { saidOn: /SAID_ON\[kind\]/, saidOnIn: /SAID_ON\[kind\][\s\S]*setAttribute\(k\[1\]/,
                tick: /setAttribute\("aria-checked"/, discBtn: /setAttribute\("aria-hidden"/,
                tourStep: /removeAttribute\("aria-hidden"\)/, tourClose: /setAttribute\("aria-hidden"/ };
/* A .cbx written inline carries ticked(), the checkbox's own door, in the same statement. */
/* A row written with its own role's state beside the class (role="radio" or "checkbox" and aria-checked in the same statement, as
   section 9's switch rows are) says the state as well. */
const inDoor = (w) => Object.prototype.hasOwnProperty.call(DOORS, w.fn) || /\bticked\(/.test(w.text)
  || (/role="(?:radio|checkbox)"/.test(w.text) && /aria-checked="/.test(w.text));

/* Balanced arguments of a call whose "(" is at `at`, split at the top level. */
function argsAt(code, at) {
  const args = []; let depth = 0, from = at + 1, i = at;
  for (; i < code.length; i++) {
    const c = code[i];
    if (c === '"' || c === "'" || c === "`") {
      let j = i + 1; while (j < code.length && code[j] !== c) j += code[j] === "\\" ? 2 : 1; i = j; continue;
    }
    if (c === "(" || c === "[" || c === "{") depth++;
    else if (c === ")" || c === "]" || c === "}") {
      depth--;
      if (depth === 0) { args.push(code.slice(from, i).trim()); break; }
    } else if (c === "," && depth === 1) { args.push(code.slice(from, i).trim()); from = i + 1; }
  }
  return args.filter((a, k) => a !== "" || k < args.length - 1);
}

function loadLang(root) {
  const src = fs.readFileSync(path.join(root, "ui", "lang.js"), "utf8");
  const ANCHOR = "window.STUDIO_T = {";
  const window = {};
  vm.runInNewContext(src.replace(ANCHOR, ANCHOR + " __pl: () => Object.assign({}, PL),"),
    { window, String, Object, Array, JSON, Math, Number });
  return { src, PL: window.STUDIO_T.__pl() };
}

function main() {
  const app = fs.readFileSync(path.join(ROOT, "ui", "app.js"), "utf8");
  const code = blankComments(app);

  /* ---- 1. WHAT IS CHOSEN IS SAID ------------------------------------------------------------ */
  {
    const planted = blankComments("(function () {\n  function paintX() {\n    /* \"on\" */\n"
      + "    return '<span class=\"' + (a ? \"on\" : \"\") + '\">';\n  }\n})();\n");
    const seen = onWrites(planted);
    check(seen.length === 1 && seen[0].fn === "paintX" && seen[0].line === 4 && !inDoor(seen[0]),
      "1a CONTROL: a planted write of the class in a painter is found, in its function and on its"
      + " line, and the same word inside a comment is not: " + JSON.stringify(seen.map(w => [w.fn, w.line])));
  }
  {
    /* The owner's switch rule, proved both ways: a radio row whose aria-checked is there is in a door, the same row with it
       dropped is a loose write, and "on" as a value (compared, an array's item, a choice of "on" or "off") is no write at all. */
    const planted = blankComments("(function () {\n"
      + "  function rowsX() {\n    return '<div class=\"r' + (v === now ? \" on\" : \"\") + '\" role=\"radio\" aria-checked=\"' + (v === now) + '\">';\n  }\n"
      + "  function rowsY() {\n    return '<div class=\"r' + (v === now ? \" on\" : \"\") + '\" role=\"radio\">';\n  }\n"
      + "  const z = v === \"on\" ? 1 : 0, w = [\"on\", \"x\"], q = a ? \"on\" : \"off\";\n})();\n");
    const seen = onWrites(planted);
    check(seen.length === 2 && seen[0].fn === "rowsX" && inDoor(seen[0]) && seen[1].fn === "rowsY" && !inDoor(seen[1]),
      "1f CONTROL: a radio row with aria-checked says its state, the same row without it is loose, and \"on\" as a value is not a"
      + " write: " + JSON.stringify(seen.map(w => [w.fn, inDoor(w)])));
  }
  const writes = onWrites(code);
  const loose = writes.filter(w => !inDoor(w));
  check(writes.length > 0 && loose.length === 0,
    "1b every one of the " + writes.length + " literal \"on\" writes in ui/app.js is in a door that"
    + " says the state as well" + (loose.length ? "; not these: "
      + loose.map(w => w.fn + ":" + w.line).join(", ") : ""));
  {
    const bad = Object.keys(DOORS).filter(n => !DOORS[n].test(bodyOf(code, n)));
    check(bad.length === 0, "1c each of the " + Object.keys(DOORS).length + " doors writes its own"
      + " state beside the class" + (bad.length ? "; not: " + bad.join(", ") : ""));
  }
  {
    /* The table and the two functions as they stand in the file, run on their own. */
    const from = app.indexOf("  const SAID_ON = {"), last = bodyOf(app, "saidOnIn");
    let saidOn = null, saidOnIn = null;
    try {
      if (from < 0 || !last) throw new Error("no SAID_ON");
      const f = new Function(app.slice(from, app.indexOf(last) + last.length)
        + "\nreturn [saidOn, saidOnIn];")();
      saidOn = f[0]; saidOnIn = f[1];
    } catch { saidOn = null; saidOnIn = null; }
    const want = [
      [["page", true, "tab"], ' class="tab on" role="link" aria-current="page"'],
      [["page", false, "tab"], ' class="tab" role="link" aria-current="false"'],
      [["filter", true], ' class="on" role="link" aria-current="true"'],
      [["filter", false], ' class="" role="link" aria-current="false"'],
      [["step", true, "step"], ' class="step on" role="link" aria-current="step"'],
      [["step", false, "step done"], ' class="step done" role="link" aria-current="false"'],
      [["radio", true], ' class="on" role="radio" aria-checked="true"'],
      [["radio", false], ' class="" role="radio" aria-checked="false"'],
    ];
    const off = saidOn ? want.map(([a, w]) => [a, saidOn(...a), w]).filter(([, g, w]) => g !== w) : [];
    check(!!saidOn && off.length === 0,
      "1d saidOn() gives each shape its role and its state and the class the markup always had"
      + " (\"tab on\", \"step done\", \"on\", \"\")" + (!saidOn ? "; no saidOn() in ui/app.js" : "")
      + (off.length ? "; wrong: " + off.map(([a, g]) => JSON.stringify(a) + " gave " + JSON.stringify(g)).join(", ") : ""));
    const attrs = {}, cls = new Set(["on"]);
    const el = { classList: { toggle: (c, on) => { if (on) cls.add(c); else cls.delete(c); } },
                 setAttribute: (k, v) => { attrs[k] = v; } };
    let moved = "";
    try { saidOnIn(el, "radio", false); moved = [...cls].join(" ") + "|" + attrs["aria-checked"];
          saidOnIn(el, "radio", true); moved += "," + [...cls].join(" ") + "|" + attrs["aria-checked"]; }
    catch (e) { moved = "threw " + (e && e.message); }
    check(moved === "|false,on|true",
      "1d2 a segment changed in place by saidOnIn() moves its class and its aria-checked together: "
      + moved);
  }
  {
    /* The markup the page writes, read from its string and template literals in order, comments and regex literals set aside,
       so a pattern that names the class is not taken for a group (the test architect, 2026-11-01 08:22). */
    const { lits, kinds } = jsLiterals(app);
    const markup = lits.filter((l, k) => kinds[k] !== "re").join("");
    const groups = [...markup.matchAll(/class="seg\b/g)].map(m => {
      const tag = markup.slice(m.index, markup.indexOf(">", m.index));
      return /role="radiogroup"/.test(tag);
    });
    check(groups.length >= 3 && groups.every(Boolean),
      "1e every one of the " + groups.length + " segment groups ui/app.js writes is a radiogroup"
      + " around its radios");
  }

  /* ---- 2. A PICKER'S WORDS ARE THE PAGE'S ---------------------------------------------------- */
  const preload = fs.readFileSync(path.join(ROOT, "shell", "preload.js"), "utf8");
  const takes = {};
  for (const m of preload.matchAll(/(\w+):\s*\(([^)]*)\)\s*=>\s*ipcRenderer\.invoke\("([^"]+)"/g)) {
    takes[m[1]] = m[2].split(",").map(s => s.trim()).filter(Boolean).length;
  }
  const pickers = Object.keys(takes).filter(n => /Pick$|^pick[A-Z]/.test(n));
  const calls = [];
  for (const m of code.matchAll(/\bAPI\.(\w+)\(/g)) {
    if (pickers.indexOf(m[1]) < 0) continue;
    calls.push({ name: m[1], line: code.slice(0, m.index).split("\n").length,
                 args: argsAt(code, m.index + m[0].length - 1) });
  }
  const short = calls.filter(c => c.args.length !== takes[c.name]);
  check(pickers.length >= 6 && calls.length >= pickers.length && short.length === 0,
    "2a every one of the " + calls.length + " calls of the preload's " + pickers.length + " pickers"
    + " hands over as many values as the picker takes, so the shell fills in no word of its own"
    + (short.length ? "; short: " + short.map(c => c.name + ":" + c.line + " gives " + c.args.length
      + " of " + takes[c.name]).join(", ") : ""));
  {
    const { PL } = loadLang(ROOT);
    const words = [], bare = [];
    for (const c of calls) {
      for (const a of c.args) {
        for (const t of a.matchAll(/\bT\("((?:[^"\\]|\\.)*)"\)/g)) words.push(JSON.parse('"' + t[1] + '"'));
        const rest = a.replace(/\bT\("(?:[^"\\]|\\.)*"\)/g, "");
        for (const s of rest.matchAll(/"((?:[^"\\]|\\.)*)"/g)) if (/[A-Z][a-z]|[a-z] [a-z]/.test(s[1])) bare.push(s[1]);
      }
    }
    const noPolish = words.filter(w => !Object.prototype.hasOwnProperty.call(PL, w) || PL[w] === w);
    check(words.length >= calls.length && noPolish.length === 0 && bare.length === 0,
      "2b the " + words.length + " words those calls hand over all go through T() and each is a"
      + " different word in Polish" + (noPolish.length ? "; no Polish: " + JSON.stringify(noPolish) : "")
      + (bare.length ? "; not through T(): " + JSON.stringify(bare) : ""));
  }
  {
    /* THE PAIRS ui/lang.js SAYS ARE THE ENGINE'S, read against the pin rather than against the
       table, since a table read against itself agrees with whatever it holds. The pin is this
       tree's own even under CHOSEN_SAID_ROOT: an export of ui and shell carries none. */
    const { src, PL } = loadLang(ROOT);
    const pinAt = path.join(OWN, "engine", "pinned", "src", "modules", "ui-lang.js");
    const pin = fs.existsSync(pinAt) ? fs.readFileSync(pinAt, "utf8") : "";
    const cited = [...src.matchAll(/grep -o '"([^"]*)":"\[\^"\]\*"' engine\/pinned\/src\/modules\/ui-lang\.js/g)]
      .map(m => m[1]);
    const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const differ = cited.filter(k => {
      const m = pin.match(new RegExp('"' + esc(k) + '":"([^"]*)"'));
      return !m || m[1] !== PL[k];
    });
    check(!!pin && cited.indexOf("Etiuda catalog file") >= 0 && differ.length === 0,
      "2c each of the " + cited.length + " pairs ui/lang.js cites from the engine by its grep line"
      + " is the engine's pair at the pin, the file type's name among them"
      + (!pin ? "; no pinned engine here, run node tools/engine-fetch.mjs" : "")
      + (differ.length ? "; not: " + JSON.stringify(differ) : ""));
  }

  check(asserted + 1 === EXPECTED, "9 every leg ran: " + (asserted + 1) + " of " + EXPECTED + " assertion(s)");
  process.stdout.write("chosen-said: " + asserted + " assertion(s), " + failed + " failure(s)\n");
  process.exit(failed ? 1 : 0);
}

try { main(); }
catch (e) {
  process.stderr.write("  FAIL tests/chosen-said.mjs threw: " + (e && e.stack || e) + "\n");
  process.exit(1);
}
