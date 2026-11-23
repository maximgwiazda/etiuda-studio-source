/* tests/js-literals.mjs: the tokeniser plant-hold uses to tell a test file's literals from its code, shared so a suite can import
   it without running plant-hold (chosen-said 1e reads the markup ui/app.js writes from its string and template literals). */
const REGEX_AFTER = new Set(["return", "typeof", "case", "do", "else", "in", "of", "new", "delete", "void", "throw", "yield", "await", "instanceof"]);

/* Splits source into code (comments removed, literals replaced by a space) and the literals' text. Regular expression
   literals are told from division by what precedes the slash, the usual heuristic. */
export function jsLiterals(text) {
  const src = String(text);
  const lits = [], kinds = [];
  let code = "";
  let i = 0;
  const braces = [];
  let prev = "";
  let word = "";
  const regexOk = () => prev === "" || "(,=:[!&|?{};+-*%<>~^".indexOf(prev) >= 0 || REGEX_AFTER.has(word);
  function note(ch) {
    if (/\s/.test(ch)) return;
    if (/[A-Za-z0-9_$]/.test(ch)) { word = (/[A-Za-z0-9_$]/.test(prev) ? word : "") + ch; }
    else word = "";
    prev = ch;
  }
  function template() {
    let buf = "";
    i++;
    while (i < src.length) {
      const c = src[i];
      if (c === "\\") { buf += src.slice(i, i + 2); i += 2; continue; }
      if (c === "`") { i++; lits.push(buf); kinds.push("tpl"); return true; }
      if (c === "$" && src[i + 1] === "{") { lits.push(buf); kinds.push("tpl"); buf = ""; i += 2; braces.push("tpl"); return false; }
      buf += c; i++;
    }
    lits.push(buf); kinds.push("tpl");
    return true;
  }
  while (i < src.length) {
    const c = src[i], d = src[i + 1];
    if (c === "/" && d === "/") { const e = src.indexOf("\n", i); i = e < 0 ? src.length : e; continue; }
    if (c === "/" && d === "*") { const e = src.indexOf("*/", i + 2); code += " "; i = e < 0 ? src.length : e + 2; continue; }
    if (c === "'" || c === "\"") {
      let buf = "";
      i++;
      while (i < src.length && src[i] !== c && src[i] !== "\n") {
        if (src[i] === "\\") { buf += src.slice(i, i + 2); i += 2; continue; }
        buf += src[i]; i++;
      }
      i++;
      lits.push(buf); kinds.push("str"); code += " \"\" "; note("\""); prev = "a"; word = "";
      continue;
    }
    if (c === "`") { template(); code += " \"\" "; prev = "a"; word = ""; continue; }
    if (c === "/" && regexOk()) {
      let buf = "", cls = false;
      i++;
      while (i < src.length && src[i] !== "\n") {
        const r = src[i];
        if (r === "\\") { buf += src.slice(i, i + 2); i += 2; continue; }
        if (r === "[") cls = true;
        else if (r === "]") cls = false;
        else if (r === "/" && !cls) break;
        buf += r; i++;
      }
      i++;
      while (i < src.length && /[a-z]/.test(src[i])) i++;
      lits.push(buf); kinds.push("re"); code += " /re/ "; prev = "a"; word = "";
      continue;
    }
    if (c === "{") braces.push("{");
    if (c === "}" && braces.length && braces[braces.length - 1] === "tpl") {
      braces.pop();
      template();
      code += " \"\" "; prev = "a"; word = "";
      continue;
    }
    if (c === "}" && braces.length) braces.pop();
    code += c;
    note(c);
    i++;
  }
  /* kinds runs beside lits, "str", "tpl" or "re", so a reader can set regex literals aside (chosen-said 1e). */
  return { code, lits, kinds };
}
