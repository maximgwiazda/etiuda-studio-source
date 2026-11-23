/* SOURCE TEXT WITH ITS COMMENTS TAKEN OUT, AND NOTHING ELSE (board 858).
 *
 * A text leg reads comments: a call kept only in a comment counts as a call, and a module named
 * only in a comment counts as reached (the test architect's trap of 2026-09-27, and Claudius δ's
 * carve of 2026-10-07 for import-oracle 6 and shell-guards 12a and 12c). A regular expression
 * cannot take comments out safely, because "//" and "/*" also occur inside strings, template
 * literals and regex literals, so the one scanner here walks the text and knows them apart.
 *
 *   scanJs(src, on)        one pass; calls on.comment(a, b), on.literal(text, a, b, holes),
 *                          on.regex(a, b) and on.operator(token, at) as it meets each. A template's
 *                          `${...}` is read as a hole (NUL) in its text.
 *   withoutComments(t, f)  the text with every comment replaced by spaces, newlines kept, so a
 *                          line number still means the same line. By the file's name: .js, .mjs and
 *                          .cjs as JavaScript; .html with its <!-- --> comments blanked, the
 *                          comments of its <style> blanked, and each inline <script> as JavaScript.
 *
 * What it cannot see, said here so nobody relies on it: a comment inside a template literal's
 * `${...}` stays (the hole is skipped whole), and a slash after `}` is read as a regex where it is
 * a division. Neither occurs in the tree's sources on 2026-10-07; the test architect's report of
 * that day checked the scanner against esbuild's output for every file under ui/, src/ and shell/.
 */

const BS = String.fromCharCode(92);
const HOLE = String.fromCharCode(0);
/* After these words an expression begins, so a slash there opens a regex. */
const OPENS = /^(return|typeof|case|in|of|delete|void|throw|new|do|else|yield|await|instanceof)$/;

export function scanJs(src, on) {
  const n = src.length;
  let i = 0, last = "";   // the last significant token: "v" for an operand, else the punctuator
  if (src.startsWith("#!")) { const e = src.indexOf("\n"); i = e < 0 ? n : e; }
  while (i < n) {
    const c = src[i], d = src[i + 1];
    if (c === "/" && d === "/") {
      let e = src.indexOf("\n", i); if (e < 0) e = n;
      if (on.comment) on.comment(i, e);
      i = e; continue;
    }
    if (c === "/" && d === "*") {
      let e = src.indexOf("*/", i + 2); e = e < 0 ? n : e + 2;
      if (on.comment) on.comment(i, e);
      i = e; continue;
    }
    if (c === '"' || c === "'" || c === "`") {
      let j = i + 1, s = "", holes = false;
      while (j < n && src[j] !== c) {
        if (src[j] === BS) {
          const x = src[j + 1];
          if (x === "u" && src[j + 2] !== "{") { s += String.fromCharCode(parseInt(src.substr(j + 2, 4), 16)); j += 6; continue; }
          s += x === "n" ? "\n" : x === "t" ? "\t" : x === "\n" ? "" : x; j += 2; continue;
        }
        if (c === "`" && src[j] === "$" && src[j + 1] === "{") {
          let depth = 1; j += 2;
          while (j < n && depth) { if (src[j] === "{") depth++; else if (src[j] === "}") depth--; j++; }
          s += HOLE; holes = true; continue;
        }
        if (c !== "`" && src[j] === "\n") break;   // an unclosed quote ends at its line, as a parser would refuse it
        s += src[j]; j++;
      }
      if (on.literal) on.literal(s, i, j + 1, holes);
      i = j + 1; last = "v"; continue;
    }
    if (c === "/" && last !== "v" && last !== ")" && last !== "]") {
      let j = i + 1, cls = false;
      while (j < n && src[j] !== "\n") {
        if (src[j] === BS) { j += 2; continue; }
        if (src[j] === "[") cls = true; else if (src[j] === "]") cls = false;
        else if (src[j] === "/" && !cls) break;
        j++;
      }
      j++;
      while (j < n && /[a-z]/.test(src[j])) j++;
      if (on.regex) on.regex(i, j);
      i = j; last = "v"; continue;
    }
    if (/\s/.test(c)) { i++; continue; }
    if (/[A-Za-z0-9_$]/.test(c)) {
      let j = i; while (j < n && /[A-Za-z0-9_$.]/.test(src[j])) j++;
      last = OPENS.test(src.slice(i, j)) ? "(" : "v";
      if (on.operator) on.operator("v", i);
      i = j; continue;
    }
    if (on.operator) on.operator(c, i);
    last = c; i++;
  }
}

const blank = (s) => s.replace(/[^\n]/g, " ");

export function jsWithoutComments(src) {
  let out = "", at = 0;
  scanJs(src, { comment(a, b) { out += src.slice(at, a) + blank(src.slice(a, b)); at = b; } });
  return out + src.slice(at);
}

function cssWithoutComments(src) {
  let out = "", i = 0;
  while (i < src.length) {
    const c = src[i];
    if (c === '"' || c === "'") {
      let j = i + 1; while (j < src.length && src[j] !== c && src[j] !== "\n") j += src[j] === BS ? 2 : 1;
      out += src.slice(i, j + 1); i = j + 1; continue;
    }
    if (c === "/" && src[i + 1] === "*") {
      let e = src.indexOf("*/", i + 2); e = e < 0 ? src.length : e + 2;
      out += blank(src.slice(i, e)); i = e; continue;
    }
    out += c; i++;
  }
  return out;
}

function htmlWithoutComments(src) {
  let t = src.replace(/<!--[^]*?-->/g, blank);
  t = t.replace(/(<style[^>]*>)([^]*?)(<\/style>)/gi, (m, a, body, b) => a + cssWithoutComments(body) + b);
  t = t.replace(/(<script[^>]*>)([^]*?)(<\/script>)/gi, (m, a, body, b) => a + jsWithoutComments(body) + b);
  return t;
}

export function withoutComments(text, file) {
  return /[.]html?$/i.test(String(file || "")) ? htmlWithoutComments(text) : jsWithoutComments(text);
}

export { HOLE };
