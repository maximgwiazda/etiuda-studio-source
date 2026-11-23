/* THE MAIN PROCESS COERCES EVERY PAGE ARGUMENT ITSELF (board 858, P8).
 *
 *     node tests/ipc-coerce.mjs
 *
 * Two legs. The audit reads shell/preload.js and shell/main.js: every channel the preload
 * exposes has a handler whose own body guards each argument it reads, and every exposed
 * function passes its arguments through except the one a comment names, the dropped file.
 * Each use of a page value is judged on its own: `||` and `&&` guard nothing, a field read
 * and a name the value was given (`const p = dir;`) are followed to the sink, and openPath,
 * openExternal and trashItem take only what folderAt or samplePath answered.
 * The behaviour leg loads shell/main.js under a stub of the electron module, as
 * tests/shell-guards.mjs does, and hands several handlers an object, an array, a number,
 * null and a string with a NUL. It then drives every channel the preload exposes with {},
 * ["C:\\x"] and { toString: "x" }, a picker answered first where the act needs one: each is
 * answered rather than rejecting the invoke, and a non-primitive may reach a sink, a file
 * main writes whole included, only for a parameter named in SENT, the objects the thread is
 * handed as the page sent them.
 *
 * PROVED BY MAKING IT FAIL, in a scratch copy of the tree (tests/plants-tree.mjs), then putting
 * that copy's bytes back. Taking projectDir() off studio:open's handler reddens both legs. Putting
 * String() back on the preload's open, with no comment saying why, reddens the audit. This
 * checkout's shell/main.js and shell/preload.js are never written. The test architect's nine
 * single plants of 2026-10-13 (L1 to L9 in his verdict on board 858) each redden this leg too,
 * run one at a time from outside it.
 *
 * ETIUDA_PLANTS=off skips that plants phase and counts it as the one check it is. The two green
 * legs still run, on this checkout. The release profile runs with plants on.
 *
 * Node only. It does not launch the program. Exit 0 when both plants go red and both legs
 * then hold, 1 otherwise.
 */
import "./reg-stand-on.mjs";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import Module, { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import { withoutComments } from "./source-text.mjs";
import { plantText } from "./plant-copy.mjs";
import { seatEnv } from "./seated.mjs";

const PLANTS_OFF = process.env.ETIUDA_PLANTS === "off";
const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
let MAIN = path.join(ROOT, "shell", "main.js");
let PRELOAD = path.join(ROOT, "shell", "preload.js");
let UI = path.join(ROOT, "ui", "index.html");
const require = createRequire(import.meta.url);

const OPEN_FROM = 'const home = projectDir(dir); /* plant:txic-open */';
const OPEN_TO = 'const home = dir; /* plant:txic-open */';
const PRE_FROM = 'open: (dir) => ipcRenderer.invoke("studio:open", dir),';
const PRE_TO = 'open: (dir) => ipcRenderer.invoke("studio:open", String(dir || "")),';

/* What a guard returns is a primitive, a list of them or a value main chose. JSON.parse is not one:
   it makes whatever object the page's text describes. */
const GUARD_LAST = new Set(["String", "Number", "Boolean", "OPTS", "LIST", "keptTabs", "folderAt",
  "applyTheme", "catalogKind", "took", "stringify", "isArray", "studioSpanToken",
  "projectDir", "projectPlace", "teamKeyFor", "confinedTabs", "proposalFile", "importInto", "shownPath"]);
/* The sinks: the thread (thread.call, and bringBack and desksNow, which call it), a file read or
   write, a child process, the shell, the clipboard, the dialogs, and the key and the vault, which
   are the team store's and the signing library's calls (src/team-store.mjs, src/sign.mjs,
   src/invite.mjs) that main makes with what the page named. */
const SINK_LAST = new Set(["bringBack", "desksNow", "openPath", "openExternal", "trashItem", "writeText", "writeStore",
  "writeWhole", "statSync", "existsSync", "readFileSync", "writeFileSync", "appendFileSync", "copyFileSync", "renameSync",
  "rmSync", "readdirSync", "mkdirSync", "unlinkSync", "spawn", "spawnSync", "execFile", "execFileSync", "fork",
  "resolve", "join", "dirname", "basename", "pick",
  "keepTeamKey", "forgetTeam", "chooseSealed", "keepInvite", "endInvite", "inviteSecretOf", "invitesOf",
  "keptTeam", "teamForFolder", "admittedOf", "makeInvite", "readKeyFile", "makeKeyFile", "unlockKey",
  "wrapKey", "keepHere", "encryptString", "decryptString"]);
/* Objects the thread is handed as the page sent them. `|| {}` is not a guard, so each of these
   would be a hole without the name; the handler's decision is to hand that object on, and the
   verb named in the reason reads it field by field (src/studio.mjs unless said). The behaviour
   leg lets the three hostile values through for these parameters alone, and the audit refuses
   an entry naming a parameter no handler has, so the list cannot outlive its handlers. */
const SENT = [
  ["studio:import-plan", "override", "the column map; the importer reads it header by header (src/import.mjs mapHeaders)"],
  ["studio:import-land", "override", "the same column map, when the import lands"],
  ["studio:save-card", "patch", "the card's edited fields; saveCard reads only the fields it knows, each by its type"],
  ["studio:proposal-decide", "decisions", "the verdicts by pattern; decideProposal keeps only the values accept and reject"],
  ["studio:proposal-revert", "reverts", "the marks to put back, once seen to be an array; revertProposalMarks keeps only entries whose marks are an array"],
  ["studio:tag-add", "text", "the tag's name by language; textFor makes each a string and refuses a missing primary"],
  ["studio:tag-rename", "text", "the renamed tag's name by language, read by textFor as for a new tag"],
  ["studio:tag-save", "patch", "the tag's edited fields; saveTag reads only the fields it knows, each by its type (board 1018)"],
  ["studio:publish", "o", "four fields copied by name (notes, leadNotes, override, fileName), each typed by publishProject; shell-guards 2i and 2j hold the rest out"],
];
function sentAs(channel, param) {
  return SENT.some((s) => s[0] === channel && s[1] === param);
}
const SHELL_SINK = new Set(["openPath", "openExternal", "trashItem"]);

function sha(buf) { return crypto.createHash("sha256").update(buf).digest("hex"); }
function lineAt(src, index) {
  let n = 1;
  for (let i = 0; i < index; i++) if (src[i] === "\n") n++;
  return n;
}
function skipString(src, i) {
  const q = src[i];
  i++;
  while (i < src.length) {
    if (src[i] === "\\") { i += 2; continue; }
    if (q === "`" && src[i] === "$" && src[i + 1] === "{") {
      i += 2;
      let depth = 1;
      while (i < src.length && depth) {
        if (src[i] === '"' || src[i] === "'" || src[i] === "`") { i = skipString(src, i); continue; }
        if (src[i] === "{") depth++;
        else if (src[i] === "}") depth--;
        if (depth) i++;
      }
      i++;
      continue;
    }
    if (src[i] === q) return i + 1;
    i++;
  }
  return i;
}
function matchParen(src, open) {
  let depth = 0;
  for (let i = open; i < src.length; i++) {
    const c = src[i];
    if (c === '"' || c === "'" || c === "`") { i = skipString(src, i) - 1; continue; }
    if (c === "(") depth++;
    else if (c === ")") { depth--; if (depth === 0) return i; }
  }
  return -1;
}
function splitCommas(src) {
  const parts = [];
  let start = 0, depth = 0;
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (c === '"' || c === "'" || c === "`") { i = skipString(src, i) - 1; continue; }
    if (c === "(" || c === "[" || c === "{") depth++;
    else if (c === ")" || c === "]" || c === "}") depth--;
    else if (c === "," && depth === 0) { parts.push(src.slice(start, i)); start = i + 1; }
  }
  parts.push(src.slice(start));
  return parts;
}
function blankStrings(src) {
  let out = "";
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (c === '"' || c === "'" || c === "`") {
      const j = skipString(src, i);
      out += " ".repeat(Math.max(0, j - i)).replace(/ /g, (k, n) => src[i + n] === "\n" ? "\n" : " ");
      i = j - 1;
      continue;
    }
    out += c;
  }
  return out;
}
function lastIdent(callee) {
  const m = /([\w$]+)$/.exec(callee);
  return m ? m[1] : callee;
}
function calleeBefore(text, paren) {
  let i = paren - 1;
  while (i >= 0 && /\s/.test(text[i])) i--;
  const end = i + 1;
  while (i >= 0 && /[\w$.]/.test(text[i])) i--;
  return text.slice(i + 1, end);
}
function isGuard(callee) { return callee === "!" || GUARD_LAST.has(lastIdent(callee)); }
function isSink(callee) {
  if (/(^|\.)thread\.call$/.test(callee)) return true;
  return SINK_LAST.has(lastIdent(callee));
}
function prevNonSpace(text, index) {
  let i = index - 1;
  while (i >= 0 && /\s/.test(text[i])) i--;
  return i;
}
function nextNonSpace(text, index) {
  let i = index;
  while (i < text.length && /\s/.test(text[i])) i++;
  return i;
}
function operatorGuard(text, index, name) {
  if (/typeof\s*$/.test(text.slice(Math.max(0, index - 10), index))) return true;
  const p = prevNonSpace(text, index);
  const prev = p >= 0 ? text[p] : "";
  const prev2 = p > 0 ? text[p - 1] : "";
  const n = nextNonSpace(text, index + name.length);
  const next = n < text.length ? text[n] : "";
  const next2 = n + 1 < text.length ? text[n + 1] : "";
  if (prev === "!" && prev2 !== "=") return true;
  if (prev === "+" && (p < 1 || !/[\w$.)]/.test(prev2))) return true;
  if ((next === "=" && next2 === "=") || (next === "!" && next2 === "=")) return true;
  if (prev === "=" && (prev2 === "=" || prev2 === "!")) return true;
  /* `||` and `&&` are not guards: `id || ""` still hands an object on. */
  return false;
}
/* The call whose argument this occurrence sits in, and where its paren opens. A grouping paren
   (none named before it) is looked through, `(x || "")` inside a sink being still inside the
   sink, unless a coercing operator stands before it: `!(x && y)` and `+(x)` give a primitive,
   which is reported as the guard "!". */
function enclosingCall(text, index) {
  let depth = 0;
  for (let i = index; i >= 0; i--) {
    const c = text[i];
    if (c === ")") depth++;
    else if (c === "(") {
      if (depth > 0) { depth--; continue; }
      const callee = calleeBefore(text, i);
      /* Object.assign hands on what it was given, so the call round it is the one that counts. */
      if (callee === "Object.assign") continue;
      if (callee) return { callee, paren: i };
      const p = prevNonSpace(text, i);
      const before = p >= 0 ? text[p] : "";
      const unary = before === "!" || before === "~" || (before === "+" && (p < 1 || !/[\w$.)\]]/.test(text[prevNonSpace(text, p)] || "")))
        || /\b(?:typeof|void)\s*$/.test(text.slice(Math.max(0, i - 8), i));
      if (unary) return { callee: "!", paren: i };
      if (before === ")" || before === "]") return { callee: "", paren: i };
    }
  }
  return { callee: "", paren: -1 };
}
function innermostCall(text, index) {
  return enclosingCall(text, index).callee;
}
function classOf(text, index, name) {
  if (operatorGuard(text, index, name)) return "ok";
  const n = nextNonSpace(text, index + name.length);
  const next = n < text.length ? text[n] : "";
  if (next === "." || next === "[") return "object";
  const callee = innermostCall(text, index);
  if (callee && isGuard(callee)) return "ok";
  if (callee && isSink(callee)) return "fail";
  return "indirect";
}
function occurrences(text, name) {
  const re = new RegExp("\\b" + name + "\\b", "g");
  const at = [];
  let m;
  while ((m = re.exec(text))) {
    if (text[m.index - 1] === ".") continue;
    /* A key in an object literal is not a use; the middle of `c ? name : other` is. */
    const n = nextNonSpace(text, m.index + name.length);
    const p = prevNonSpace(text, m.index);
    if (text[n] === ":" && (p < 0 || text[p] === "{" || text[p] === ",")) continue;
    at.push(m.index);
  }
  return at;
}
/* This occurrence only. A comparison, a call to String or a typeof on a different copy of the
   name, even in the same argument, does not cover this one. `||` and `&&` do not cover it either. */
function argumentCovers(text, index, name) {
  if (operatorGuard(text, index, name)) return true;
  const callee = innermostCall(text, index);
  return !!(callee && isGuard(callee));
}
function afterMember(text, index, name) {
  let i = nextNonSpace(text, index + name.length);
  if (text[i] === ".") {
    i++;
    while (i < text.length && /[\w$]/.test(text[i])) i++;
    return i;
  }
  if (text[i] !== "[") return -1;
  let depth = 0;
  for (; i < text.length; i++) {
    const c = text[i];
    if (c === '"' || c === "'" || c === "`") { i = skipString(text, i) - 1; continue; }
    if (c === "[") depth++;
    else if (c === "]") { depth--; if (depth === 0) return i + 1; }
  }
  return -1;
}
/* A field read is guarded when the field itself is compared or passed to a guard. `opts.numbered
   === true` is; `asked.notes` copied into a sink is not. */
function fieldGuarded(text, index, name) {
  const end = afterMember(text, index, name);
  if (end < 0) return false;
  const n = nextNonSpace(text, end);
  const c = text[n] || "";
  const c2 = text[n + 1] || "";
  if ((c === "=" && c2 === "=") || (c === "!" && c2 === "=")) return true;
  const callee = innermostCall(text, index);
  return !!(callee && isGuard(callee));
}
/* `const k = kinds || {}` then only String(k.files) and String(k.all). The parameter never
   reaches a sink whole, and every use of the alias is a guarded field. */
function aliasFieldGuarded(body, name) {
  const re = new RegExp("(?:const|let)\\s+([A-Za-z_$][\\w$]*)\\s*=\\s*" + name + "\\b");
  const m = re.exec(body);
  if (!m) return false;
  const alias = m[1];
  const uses = occurrences(body, alias).filter((i) => !/(?:const|let|var)\s+$/.test(body.slice(Math.max(0, i - 12), i)));
  return uses.length > 0 && uses.every((i) => fieldGuarded(body, i, alias));
}
/* The value of this occurrence can be what a sink is called with, read by precedence: the branch
   of `?:` can be and its condition cannot; either side of `||` or `??` can be, and so can either
   side of `&&`; a comparison, arithmetic, `!`, `typeof` or a unary sign gives a primitive and
   cannot be. `x && typeof x === "object" ? clone(x) : null` hands the clone on, not x; `x || {}`
   hands x on. Inside a group, an array or an object literal, what the occurrence's own element or
   property value can be is what the bracket hands on. */
function topLevel(s) {
  const at = { q: -1, colon: -1, or: [], and: [], prim: false, spans: [] };
  let depth = 0, open = -1;
  for (let i = 0; i < s.length; i++) {
    const c = s[i], n = s[i + 1];
    if (c === '"' || c === "'" || c === "`") { i = skipString(s, i) - 1; continue; }
    if (c === "(" || c === "[" || c === "{") { if (depth === 0) open = i; depth++; continue; }
    if (c === ")" || c === "]" || c === "}") { depth--; if (depth === 0) at.spans.push([open, i]); continue; }
    if (depth !== 0) continue;
    if (c === "?" && n === "?") { at.or.push([i, 2]); i++; continue; }
    if (c === "?" && n === ".") { i++; continue; }
    if (c === "?") { if (at.q < 0) at.q = i; continue; }
    if (c === ":") { if (at.q >= 0 && at.colon < 0) at.colon = i; continue; }
    if (c === "|" && n === "|") { at.or.push([i, 2]); i++; continue; }
    if (c === "&" && n === "&") { at.and.push([i, 2]); i++; continue; }
    if (c === "=" && n === ">") { at.prim = true; i++; continue; }
    if (c === "=" && n !== "=" && !"=!<>".includes(s[i - 1] || "")) continue;
    if ("=!<>+-*/%^|&~".includes(c)) {
      if ((c === "+" || c === "-") && n === c) { i++; continue; }
      if ("+-!~".includes(c) && !/[\w$)\]]/.test(s[prevNonSpace(s, i)] || "")) continue;
      at.prim = true;
      continue;
    }
    if (/[A-Za-z_$]/.test(c) && !/[\w$.]/.test(s[i - 1] || "")) {
      const w = /^[A-Za-z_$][\w$]*/.exec(s.slice(i))[0];
      if (w === "instanceof" || w === "in") at.prim = true;
      i += w.length - 1;
    }
  }
  return at;
}
function operandAt(s, offset, ops) {
  let from = 0;
  for (const [i, len] of ops) {
    if (offset < i) return [from, i];
    from = i + len;
  }
  return [from, s.length];
}
function canBeResult(expr, offset) {
  const s = expr;
  const at = topLevel(s);
  if (at.q >= 0 && at.colon >= 0) {
    if (offset < at.q) return false;
    if (offset < at.colon) return canBeResult(s.slice(at.q + 1, at.colon), offset - (at.q + 1));
    return canBeResult(s.slice(at.colon + 1), offset - (at.colon + 1));
  }
  for (const ops of [at.or, at.and]) {
    if (!ops.length) continue;
    const [a, b] = operandAt(s, offset, ops);
    return canBeResult(s.slice(a, b), offset - a);
  }
  if (at.prim) return false;
  const lead = s.trim();
  if (lead[0] === "!" || lead[0] === "~" || /^(?:typeof|void|delete)\b/.test(lead) || /^[+-]/.test(lead)) return false;
  const span = at.spans.find(([o, c]) => offset > o && offset < c);
  if (!span) return true;
  const [o, c] = span;
  const inner = s.slice(o + 1, c), local = offset - o - 1;
  /* `(a ? pairs : []).map(...)` hands on what the method makes, not the bracket's value. */
  const after = nextNonSpace(s, c + 1);
  if (s[after] === "." || s[after] === "[" || s[after] === "(" || (s[after] === "?" && s[after + 1] === ".")) return false;
  if (s[o] === "(") {
    const p = prevNonSpace(s, o);
    if (p >= 0 && /[\w$)\]]/.test(s[p])) return true;
    return canBeResult(inner, local);
  }
  let from = 0;
  for (const part of splitCommas(inner)) {
    if (local >= from && local <= from + part.length) {
      const here = local - from;
      if (s[o] === "[") return canBeResult(part, here);
      const lead2 = /^\s*(?:\.\.\.)?/.exec(part)[0].length;
      let d = 0, kc = -1;
      for (let i = 0; i < part.length; i++) {
        const ch = part[i];
        if (ch === '"' || ch === "'" || ch === "`") { i = skipString(part, i) - 1; continue; }
        if (ch === "(" || ch === "[" || ch === "{") d++;
        else if (ch === ")" || ch === "]" || ch === "}") d--;
        else if (d === 0 && (ch === "?" || ch === "|" || ch === "&")) break;
        else if (d === 0 && ch === ":") { kc = i; break; }
      }
      if (kc >= 0) return here > kc ? canBeResult(part.slice(kc + 1), here - kc - 1) : false;
      return canBeResult(part.slice(lead2), here - lead2);
    }
    from += part.length + 1;
  }
  return true;
}
function valueReachesSink(text, index) {
  const { callee, paren } = enclosingCall(text, index);
  if (!callee || !isSink(callee)) return false;
  let start = paren + 1, d = 1;
  for (let j = paren + 1; j < text.length; j++) {
    const ch = text[j];
    if (ch === '"' || ch === "'" || ch === "`") { j = skipString(text, j) - 1; continue; }
    if (ch === "(" || ch === "[" || ch === "{") d++;
    else if (ch === ")" || ch === "]" || ch === "}") {
      d--;
      if (d === 0) return index >= start && index < j && canBeResult(text.slice(start, j), index - start);
    } else if (ch === "," && d === 1) {
      if (index >= start && index < j) return canBeResult(text.slice(start, j), index - start);
      start = j + 1;
    }
  }
  return false;
}
function channelAt(src, index) {
  const before = src.slice(0, index);
  const re = /(?:answer|hear)\("([^"]+)"/g;
  let last = "", m;
  while ((m = re.exec(before))) last = m[1];
  return last;
}
function rhsOf(src, name, before) {
  const re = new RegExp("(?:const|let|var)\\s+" + name + "\\s*=\\s*", "g");
  const head = src.slice(0, before);
  let end = -1, m;
  while ((m = re.exec(head))) end = m.index + m[0].length;
  if (end < 0) return "";
  let i = end;
  while (i < head.length && head[i] !== ";" && head[i] !== "\n") i++;
  return head.slice(end, i).trim();
}
/* openPath, openExternal and trashItem may be fed only by folderAt, samplePath or keyFileNow, or by a
   literal (the maker's address), or, for openExternal alone, by src/update-note.mjs releasePage (board 991: the kept version
   note's release page, verified under the root and admitted again as https://etiuda.dev/ and nothing else; tests/update-note.mjs
   un9 holds what it admits), or by src/wire.cjs identityAuthorize (board 980, stage 2: a sign-in provider's page, admitted as
   https at the door's fixed hosts and "" otherwise; tests/no-model.mjs 5z3 and 11am to 11ay, tests/sign-in.mjs si5 hold what it
   admits), or by src/buy-path.cjs buyAddress (board 1020: Buy's portal or order page from the kept state alone, "" otherwise;
   tests/studio-buy-path.mjs sbuy2 holds what it admits). A parameter guarded somewhere else does not feed them. */
const FED = /^(?:await\s+)?(?:folderAt|samplePath|keyFileNow)\s*\(/, RELEASE_FED = /^(?:U\.releasePage|wire\.identityAuthorize|BUY\.buyAddress)\s*\(/;
function shellArgOk(src, callAt, arg, sink) {
  const one = arg.trim();
  if (FED.test(one) || (sink === "openExternal" && RELEASE_FED.test(one))) return true;
  if (/^["'`]/.test(one)) return true;
  if (!/^[A-Za-z_$][\w$]*$/.test(one)) return false;
  const rhs = rhsOf(src, one, callAt);
  if (FED.test(rhs) || (sink === "openExternal" && RELEASE_FED.test(rhs))) return true;
  if (/^["'`]/.test(rhs)) return true;
  return false;
}
function shellFeedHoles(src) {
  const holes = [];
  const re = /\.(openPath|openExternal|trashItem)\s*\(/g;
  let m;
  while ((m = re.exec(src))) {
    if (!SHELL_SINK.has(m[1])) continue;
    const paren = m.index + m[0].length - 1;
    const close = matchParen(src, paren);
    if (close < 0) continue;
    const arg = src.slice(paren + 1, close);
    if (shellArgOk(src, m.index, arg, m[1])) continue;
    holes.push({
      channel: channelAt(src, m.index) || "(shell)",
      param: arg.trim().slice(0, 60),
      why: "shell sink fed by neither folderAt nor samplePath",
      line: lineAt(src, m.index),
      sink: m[1],
    });
  }
  return holes;
}
function parseFn(rest) {
  let i = 0;
  while (/\s/.test(rest[i] || "")) i++;
  if (rest.startsWith("async", i) && !/[\w$]/.test(rest[i + 5] || "")) i += 5;
  while (/\s/.test(rest[i] || "")) i++;
  if (rest[i] !== "(") return { params: [], body: rest.slice(i) };
  const end = matchParen(rest, i);
  const params = splitCommas(rest.slice(i + 1, end)).map(s => s.trim()).filter(Boolean)
    .map(s => s.replace(/\s*=[\s\S]*$/, "").trim());
  i = end + 1;
  while (/\s/.test(rest[i] || "")) i++;
  if (rest.startsWith("=>", i)) i += 2;
  while (/\s/.test(rest[i] || "")) i++;
  return { params, body: rest.slice(i) };
}
function handlersOf(src) {
  const out = [];
  const re = /^(answer|hear)\("/gm;
  let m;
  while ((m = re.exec(src))) {
    const open = src.indexOf("(", m.index);
    const close = matchParen(src, open);
    if (close < 0) { out.push({ error: "unclosed " + m[0], line: lineAt(src, m.index) }); break; }
    const call = src.slice(open + 1, close);
    const ch = /^"([^"]+)"/.exec(call.trim());
    if (!ch) { re.lastIndex = close; continue; }
    const rest = call.trim().slice(ch[0].length).replace(/^,\s*/, "");
    const fn = parseFn(rest);
    out.push({ kind: m[1], channel: ch[1], params: fn.params, body: fn.body, line: lineAt(src, m.index) });
    re.lastIndex = close + 1;
  }
  return out;
}
/* Each `const` or `let` with its name and where its initialiser runs. */
function declarators(body) {
  const out = [];
  const re = /\b(?:const|let|var)\s+/g;
  let m;
  while ((m = re.exec(body))) {
    let i = m.index + m[0].length;
    for (;;) {
      const id = /^([A-Za-z_$][\w$]*)\s*=(?![=>])\s*/.exec(body.slice(i));
      if (!id) break;
      const from = i + id[0].length;
      let d = 0, j = from;
      for (; j < body.length; j++) {
        const c = body[j];
        if (c === '"' || c === "'" || c === "`") { j = skipString(body, j) - 1; continue; }
        if (c === "(" || c === "[" || c === "{") d++;
        else if (c === ")" || c === "]" || c === "}") { if (d === 0) break; d--; }
        else if (d === 0 && (c === ";" || c === ",")) break;
      }
      out.push({ name: id[1], from, to: j });
      if (body[j] !== ",") break;
      i = nextNonSpace(body, j + 1);
    }
  }
  return out;
}
/* The field a member read gives, `o.notes` or `o[k]`, reaches a sink as the page sent it. A
   method called on the parameter is not a field handed on. */
function memberFlows(text, index, name) {
  let end = afterMember(text, index, name);
  if (end < 0) return false;
  for (;;) {
    const n = nextNonSpace(text, end);
    if (text[n] === "(") return false;
    if (text[n] !== "." && text[n] !== "[") break;
    let j = n;
    if (text[j] === ".") { j++; while (j < text.length && /[\w$]/.test(text[j])) j++; end = j; continue; }
    let d = 0;
    for (; j < text.length; j++) {
      if (text[j] === "[") d++;
      else if (text[j] === "]") { d--; if (d === 0) { j++; break; } }
    }
    end = j;
  }
  return valueReachesSink(text, index);
}
/* One use of a page value: "ok" when it is coerced, compared or refused there; "fail" when it
   can reach a sink as sent, itself, by one of its fields, or through a name it was given
   (`const p = dir;` then `openPath(p)`); "object" or "indirect" otherwise. */
function judgeUse(body, name, i, depth, via) {
  let k = classOf(body, i, name);
  if (k === "object") {
    if (fieldGuarded(body, i, name)) k = "ok";
    else if (memberFlows(body, i, name)) k = "fail";
  }
  else if (k === "fail" && !valueReachesSink(body, i)) k = "indirect";
  if (k === "fail" && argumentCovers(body, i, name)) k = "ok";
  if (k === "indirect" && depth < 3) {
    const d = declarators(body).find((x) => i >= x.from && i < x.to && x.name !== name
      && canBeResult(body.slice(x.from, x.to), i - x.from));
    if (d) {
      const uses = occurrences(body, d.name).filter((j) => j >= d.to);
      const sub = uses.map((j) => judgeUse(body, d.name, j, depth + 1, via));
      if (sub.includes("fail")) { via.push(d.name); k = "fail"; }
    }
  }
  return k;
}
function guardParams(handler) {
  const body = blankStrings(handler.body);
  const skip = new Set(["e", "_e", "event"]);
  const params = handler.params.filter((p, i) => !(i === 0 && skip.has(p)));
  const holes = [];
  let guarded = 0, unread = 0;
  for (const name of params) {
    if (!/^[A-Za-z_$][\w$]*$/.test(name)) { holes.push({ channel: handler.channel, param: name, why: "not a plain name" }); continue; }
    const at = occurrences(body, name);
    if (!at.length) { unread++; continue; }
    /* Each occurrence that reaches a sink is judged on its own. One guarded use does not
       excuse another, and a guard elsewhere in the same argument does not cover this use. */
    const via = [];
    const kinds = at.map((i) => judgeUse(body, name, i, 0, via));
    if (sentAs(handler.channel, name)) { guarded++; continue; }
    const fails = kinds.filter((k) => k === "fail").length;
    if (fails) {
      holes.push({ channel: handler.channel, param: name, line: handler.line, uses: fails,
        why: "reaches a sink unguarded" + (via.length ? " through " + Array.from(new Set(via)).join(", ") : "") });
      continue;
    }
    if (!kinds.includes("ok") && !aliasFieldGuarded(body, name))
      holes.push({ channel: handler.channel, param: name, why: "read and never guarded", line: handler.line });
    else guarded++;
  }
  return { guarded, unread, holes };
}
function isLiteral(s) {
  return /^"(?:[^"\\]|\\.)*"$/.test(s) || /^'(?:[^'\\]|\\.)*'$/.test(s)
    || /^(?:true|false|null)$/.test(s) || /^-?\d+(?:\.\d+)?$/.test(s);
}
function passThrough(value) {
  const body = value.trim().replace(/,\s*$/, "").trim();
  const head = /^(?:async\s*)?\(([^)]*)\)\s*=>\s*([\s\S]*)$/.exec(body);
  if (!head) return { pass: false, channel: "", kind: "" };
  const params = splitCommas(head[1]).map(s => s.trim()).filter(Boolean);
  if (params.some(p => !/^[A-Za-z_$][\w$]*$/.test(p))) return { pass: false, channel: "", kind: "" };
  const expr = head[2].trim().replace(/,\s*$/, "").trim();
  const call = /^ipcRenderer\.(invoke|send|on)\(\s*"([^"]+)"\s*([\s\S]*)\)$/.exec(expr);
  if (!call) {
    const any = /ipcRenderer\.(invoke|send|on)\(\s*"([^"]+)"/.exec(expr);
    return { pass: false, channel: any ? any[2] : "", kind: any ? any[1] : "", params };
  }
  const kind = call[1], channel = call[2];
  let rest = call[3].trim();
  if (kind === "on") {
    const inner = rest.replace(/^,\s*/, "").trim();
    const got = /^\(([^)]*)\)\s*=>\s*([A-Za-z_$][\w$]*)\(([A-Za-z_$][\w$]*)\)$/.exec(inner);
    if (!got) return { pass: false, channel, kind };
    const heard = splitCommas(got[1]).map(s => s.trim()).filter(Boolean);
    const pass = params.length === 1 && heard.length === 2 && got[2] === params[0] && got[3] === heard[1];
    return { pass, channel, kind, params };
  }
  if (rest.startsWith(",")) rest = rest.slice(1).trim();
  const args = rest === "" ? [] : splitCommas(rest).map(s => s.trim());
  if (!params.length) return { pass: args.every(isLiteral), channel, kind, params };
  return { pass: args.length === params.length && args.every((a, i) => a === params[i]), channel, kind, params };
}
function preloadMembers(raw, stripped) {
  const bridge = stripped.indexOf("contextBridge.exposeInMainWorld");
  const re = /^  ([A-Za-z][A-Za-z0-9]*):\s/gm;
  const marks = [];
  let m;
  while ((m = re.exec(stripped))) {
    if (m.index > bridge) marks.push({ name: m[1], index: m.index, head: m.index + m[0].length });
  }
  return marks.map((mk, i) => {
    let end = i + 1 < marks.length ? marks[i + 1].index : stripped.length;
    if (i + 1 === marks.length) {
      const close = stripped.lastIndexOf("\n});");
      if (close > mk.head) end = close;
    }
    const gap = raw.slice(i === 0 ? bridge : marks[i - 1].index, mk.index);
    const shape = passThrough(stripped.slice(mk.head, end));
    return { name: mk.name, gap, ...shape, line: lineAt(raw, mk.index) };
  });
}
function audit() {
  const mainRaw = fs.readFileSync(MAIN, "utf8");
  const preRaw = fs.readFileSync(PRELOAD, "utf8");
  const mainSrc = withoutComments(mainRaw, "main.js");
  const preSrc = withoutComments(preRaw, "preload.js");
  const handlers = handlersOf(mainSrc);
  const byChannel = new Map(handlers.filter(h => h.channel).map(h => [h.channel, h]));
  const members = preloadMembers(preRaw, preSrc);
  const holes = [];
  const unexplained = [];
  const explained = [];
  let guarded = 0, unread = 0, pass = 0;
  const rows = [];
  for (const h of handlers) if (h.holes) holes.push(h);
  for (const h of handlers.filter(x => x.channel)) {
    const g = guardParams(h);
    guarded += g.guarded; unread += g.unread; holes.push(...g.holes);
  }
  holes.push(...shellFeedHoles(mainSrc));
  for (const [channel, param] of SENT) {
    const h = byChannel.get(channel);
    if (!h || !h.params.includes(param)) holes.push({ channel, param, why: "the allow-list names a parameter no handler has" });
  }
  for (const member of members) {
    if (member.pass) pass++;
    else if (member.gap.includes("because")) explained.push(member.name);
    else unexplained.push(member.name);
    const handler = byChannel.get(member.channel);
    const pageToMain = member.kind === "invoke" || member.kind === "send";
    if (pageToMain && !handler) holes.push({ channel: member.channel, param: "*", why: "no handler in shell/main.js" });
    const paramHoles = holes.filter(h => h.channel === member.channel);
    rows.push({
      member: member.name,
      channel: member.channel,
      args: (member.params || []).join(", "),
      preload: member.pass ? (member.params && member.params.length ? "passes through" : "no page argument") : "shapes, comment says why",
      main: handler ? handler.kind + " shell/main.js:" + handler.line : "main sends this to the page",
      full: pageToMain ? (handler && paramHoles.length === 0 ? "yes" : "no") : "page receives it",
    });
  }
  const explainedOk = unexplained.length === 0 && explained.length === 1 && explained[0] === "importDropped";
  const ok = holes.length === 0 && explainedOk && members.length > 40 && pass + explained.length === members.length;
  return { ok, holes, unexplained, explained, guarded, unread, pass, members: members.length, rows,
    handlers: handlers.filter(h => h.channel).length };
}

function quiet(v) {
  if (v && typeof v.text === "string") return { textLength: v.text.length, error: v.error || null };
  try { return JSON.parse(JSON.stringify(v)); }
  catch { return String(v); }
}
function same(got, want) {
  if (Object.is(got, want)) return true;
  if (typeof got === "string" || typeof want === "string") return got === want;
  try { return JSON.stringify(got) === JSON.stringify(want); }
  catch { return false; }
}

async function behaviour() {
  const ud = fs.mkdtempSync(path.join(os.tmpdir(), "etiuda-studio-ipc-coerce-"));
  const projects = path.join(ud, "projects");
  fs.mkdirSync(projects, { recursive: true });
  const placed = (v) => path.join(projects, String(v == null ? "" : v));
  const calls = [];
  const sinks = [];
  const note = (kind, args) => { sinks.push({ kind, args }); };
  const shaped = (v, tag, seen) => {
    if (!v || typeof v !== "object" || seen.has(v)) return false;
    seen.add(v);
    if (tag === "array" && Array.isArray(v) && v.length === 1 && v[0] === "C:\\x") return true;
    if (tag === "toString" && !Array.isArray(v) && Object.prototype.hasOwnProperty.call(v, "toString") && v.toString === "x") return true;
    return Object.values(v).some((x) => shaped(x, tag, seen));
  };
  const shapedText = (a, tag) => {
    if (typeof a !== "string" || !/^\s*[[{]/.test(a)) return false;
    let doc;
    try { doc = JSON.parse(a); } catch { return false; }
    return shaped(doc, tag, new Set());
  };
  const written = (s, tag) => s.args.some((a) => shapedText(a, tag)) && !shapedText(s.was, tag);
  const carries = (value, hostile, seen) => {
    if (Object.is(value, hostile)) return true;
    if (!value || typeof value !== "object") return false;
    if (seen.has(value) || Buffer.isBuffer(value) || value instanceof Uint8Array) return false;
    if (value instanceof Map || value instanceof Set || value instanceof Date || value instanceof RegExp) return false;
    seen.add(value);
    let vals;
    try { vals = Array.isArray(value) ? value : Object.values(value); }
    catch { return false; }
    for (const v of vals) if (carries(v, hostile, seen)) return true;
    return false;
  };
  const actions = [];
  let zoom = 0;
  const handlers = {}, listeners = {};
  const display = { bounds: { x: 0, y: 0, width: 1920, height: 1080 }, workAreaSize: { width: 1920, height: 1032 } };
  class Win {
    constructor() {
      this.webContents = {
        id: 1, on() {}, once() {}, send() {}, setWindowOpenHandler() {},
        getURL: () => pathToFileURL(UI).href, reload() {}, forcefullyCrashRenderer() {},
        getZoomLevel: () => zoom, setZoomLevel: (n) => { zoom = n; },
      };
      windows.push(this);
    }
    on() {} once() {} isDestroyed() { return false; } isMaximized() { return false; }
    close() {} loadFile() {} show() {} showInactive() {} setMinimumSize() {}
    minimize() { actions.push("minimize"); }
    maximize() { actions.push("maximize"); }
    unmaximize() { actions.push("unmaximize"); }
  }
  const windows = [];
  const electron = {
    app: {
      commandLine: { appendSwitch() {}, hasSwitch: () => false, removeSwitch() {} },
      getPath: () => ud, getVersion: () => "0.0.0", getLocale: () => "en-GB",
      requestSingleInstanceLock: () => true,
      whenReady: () => Promise.resolve(),
      on() {}, quit() {}, exit() {},
    },
    BrowserWindow: Object.assign(Win, {
      fromWebContents: () => windows[0] || new Win(),
      getAllWindows: () => windows,
    }),
    Menu: { setApplicationMenu() {}, buildFromTemplate: () => ({ popup() {} }) },
    dialog: { showMessageBox: () => Promise.resolve({ response: 0 }), showOpenDialog: () => Promise.resolve({ canceled: true, filePaths: [] }), showSaveDialog: () => Promise.resolve({ canceled: true, filePath: "" }) },
    nativeTheme: { themeSource: "system", shouldUseDarkColors: false },
    clipboard: { writeText(t) { note("clipboard", [t]); } },
    safeStorage: { isEncryptionAvailable: () => false, encryptString: (s) => Buffer.from(String(s)), decryptString: () => "" },
    screen: { getAllDisplays: () => [display], getPrimaryDisplay: () => display, on() {}, removeListener() {} },
    session: { defaultSession: { setPermissionRequestHandler() {}, setPermissionCheckHandler() {}, setDevicePermissionHandler() {}, setSpellCheckerLanguages() {}, setSpellCheckerDictionaryDownloadURL() {}, setSpellCheckerEnabled() {} } },
    shell: {
      openPath: (p) => { note("openPath", [p]); return Promise.resolve(""); },
      openExternal(p) { note("openExternal", [p]); },
      trashItem: (p) => { note("trashItem", [p]); return Promise.resolve(); },
    },
    ipcMain: {
      handle: (ch, fn) => { handlers[ch] = fn; },
      on: (ch, fn) => { listeners[ch] = fn; },
    },
  };
  const thread = { call: (verb, ...a) => { const row = [verb].concat(a); calls.push(row); note("thread", row); return Promise.resolve({ verb }); } };
  const noted = (kind, fn) => (...a) => { note(kind, a); return fn(...a); };
  const cp = {
    execFileSync: noted("execFileSync", () => ""), execSync: noted("execSync", () => ""),
    spawnSync: noted("spawnSync", () => ({ status: 0, stdout: "", stderr: "" })),
    execFile: noted("execFile", () => ({ on() {}, unref() {} })),
    spawn: noted("spawn", () => ({ on() {}, unref() {}, stdout: { on() {} }, stderr: { on() {} } })),
    exec: noted("exec", () => ({ on() {}, unref() {} })),
    fork: noted("fork", () => ({ on() {}, unref() {} })),
  };
  const realFs = require("node:fs");
  const fsNames = new Set(["readFileSync", "writeFileSync", "appendFileSync", "openSync", "writeSync", "unlinkSync", "mkdirSync", "statSync", "copyFileSync", "rmSync", "renameSync"]);
  /* A file main writes whole (studio.json, the key file) is text by then, so a page value written
     as sent is found by its shape in the JSON: ["C:\\x"] as that array, { toString: "x" } as an
     object whose own toString is "x". {} has no shape to find and is judged by the other sinks.
     What the file held before the write is kept beside it, so a shape an earlier write put there
     is not counted against the act that only rewrote the file. */
  const realWhole = require(path.join(ROOT, "src", "whole-write.cjs"));
  const whole = {
    writeWhole: (at, text) => {
      let was = null;
      try { was = realFs.readFileSync(at, "utf8"); } catch { was = null; }
      sinks.push({ kind: "writeWhole", args: [at, text], was });
      return realWhole.writeWhole(at, text);
    },
    renamePatiently: realWhole.renamePatiently,
  };
  const wrappedFs = new Proxy(realFs, {
    get(t, k, r) {
      const v = Reflect.get(t, k, r);
      if (typeof v !== "function" || !fsNames.has(k)) return v;
      return (...a) => { note("fs." + k, a); return v.apply(t, a); };
    },
  });
  const picked = {
    STUDIO_TEST_FILE: path.join(ud, "picked.txt"),
    STUDIO_TEST_CSV: path.join(ud, "csv-out"),
    STUDIO_TEST_RESTORE: path.join(ud, "restore.json"),
    STUDIO_TEST_SAVE: path.join(ud, "save.ec"),
    STUDIO_TEST_STATS: path.join(ud, "stats.xlsx"),
    STUDIO_TEST_PACK: path.join(ud, "pack"),
    STUDIO_TEST_V1: path.join(ud, "v1.js"),
    STUDIO_TEST_FOLDER: path.join(ud, "folder"),
    STUDIO_TEST_BACKUP: path.join(ud, "backup.json"),
    STUDIO_TEST_ROOT: projects,
  };
  const envWas = {};
  for (const k of ["STUDIO_NO_PROXY_SERVER", "STUDIO_PROJECTS"].concat(Object.keys(picked))) {
    envWas[k] = process.env[k];
  }
  process.env.STUDIO_NO_PROXY_SERVER = "off";
  process.env.STUDIO_PROJECTS = projects;
  for (const k of Object.keys(picked)) process.env[k] = picked[k];
  /* A Studio that works, as a lead's does (the gate refuses a closed channel of one that does not). */
  for (const [k, v] of Object.entries(await seatEnv(ud, true, {}))) { if (v === null) delete process.env[k]; else process.env[k] = v; }
  const load = Module._load;
  Module._load = function (req) {
    if (req === "electron") return electron;
    if (req === "node:child_process" || req === "child_process") return cp;
    if (req === "node:fs" || req === "fs") return wrappedFs;
    if (/studio-thread\.cjs$/.test(String(req))) return thread;
    if (/whole-write\.cjs$/.test(String(req))) return whole;
    return load.apply(this, arguments);
  };
  const checks = [];
  const said = [];
  const stderrWrite = process.stderr.write.bind(process.stderr);
  process.stderr.write = (chunk, enc, cb) => {
    said.push(Buffer.isBuffer(chunk) ? chunk.toString("utf8") : String(chunk));
    return stderrWrite(chunk, enc, cb);
  };
  const fail = (name, got, want) => checks.push({ name, ok: false, got: quiet(got), want: quiet(want) });
  const keep = (name, got, want) => {
    if (same(got, want)) checks.push({ name, ok: true });
    else fail(name, got, want);
  };
  const event = () => ({
    senderFrame: { parent: null, url: pathToFileURL(UI).href },
    sender: { getZoomLevel: () => zoom, setZoomLevel: (n) => { zoom = n; } },
  });
  const ask = async (ch, ...a) => {
    if (handlers[ch]) return await handlers[ch](event(), ...a);
    if (listeners[ch]) { listeners[ch](event(), ...a); return null; }
    throw new Error("no door for " + ch);
  };
  const last = (verb) => {
    for (let i = calls.length - 1; i >= 0; i--) if (calls[i][0] === verb) return calls[i];
    return null;
  };
  try {
    delete require.cache[MAIN];
    require(MAIN);
    for (let i = 0; i < 1000 && !windows.length; i++) await new Promise(r => setTimeout(r, 25));
    const obj = { bad: true }, arr = ["pl"], num = 7, nul = "a\0b";
    const openGot = async (v) => {
      const n = calls.length;
      await ask("studio:open", v);
      const hit = calls.slice(n).filter((c) => c[0] === "openProject");
      return hit.length ? hit[0][1] : "NONE";
    };
    keep("open object", await openGot(obj), placed("[object Object]"));
    keep("open array", await openGot(arr), placed("pl"));
    keep("open number", await openGot(num), placed("7"));
    keep("open null", await openGot(null), "NONE");
    keep("open nul", await openGot(nul), "NONE");
    await ask("studio:card-add", "d", "sh", "t", "b", obj);
    keep("card-add object", last("addCard").slice(1), [placed("d"), "sh", "t", "b", "[object Object]"]);
    await ask("studio:card-add", "d", "sh", "t", "b");
    keep("card-add omitted", last("addCard").slice(1), [placed("d"), "sh", "t", "b", ""]);
    await ask("studio:card-add", "d", "sh", "t", "b", null);
    keep("card-add null", last("addCard")[5], "");
    await ask("studio:card-add", "d", "sh", "t", "b", num);
    keep("card-add number", last("addCard")[5], "7");
    await ask("studio:card-add", "d", "sh", "t", "b", ["steps"]);
    keep("card-add array", last("addCard")[5], "steps");
    await ask("studio:card-add", "d", "sh", "t", "b", "alts\0");
    keep("card-add nul", last("addCard")[5], "alts\0");
    const z0 = zoom;
    await ask("studio:zoom", obj); keep("zoom object", zoom, z0);
    await ask("studio:zoom", arr); keep("zoom array", zoom, z0);
    await ask("studio:zoom", num); keep("zoom number", zoom, z0);
    await ask("studio:zoom", null); keep("zoom null", zoom, z0);
    await ask("studio:zoom", "in\0"); keep("zoom nul", zoom, z0);
    await ask("studio:zoom", "in"); keep("zoom in", zoom, z0 + 0.5);
    const beforeAct = actions.length;
    for (const how of [obj, arr, num, null, "minimize\0"]) await ask("studio:window", how);
    keep("window hostile", actions.length, beforeAct);
    await ask("studio:window", "minimize"); keep("window minimize", actions[actions.length - 1], "minimize");
    keep("theme dark", (await ask("studio:theme", "dark")).theme, "dark");
    keep("theme light", (await ask("studio:theme", "light")).theme, "light");
    for (const v of [obj, arr, num, null, "dark\0"]) keep("theme " + typeof v, (await ask("studio:theme", v)).theme, "system");
    keep("lang pl", (await ask("studio:ui-lang", "pl")).lang, "pl");
    for (const v of [obj, ["pl"], 1, null, "pl\0"]) keep("lang hostile", (await ask("studio:ui-lang", v)).lang, "en");
    await ask("studio:cards-retire", obj, ["x", 2, null]);
    keep("retire mixed", last("retireCards").slice(1), [placed("[object Object]"), ["x", "2", "null"]]);
    await ask("studio:cards-retire", "d", obj); keep("retire object ids", last("retireCards")[2], []);
    await ask("studio:cards-retire", "d", null); keep("retire null ids", last("retireCards")[2], []);
    await ask("studio:change-undo", "d", "4\0", null);
    keep("undo nul index", last("undoChange").slice(1), [placed("d"), 0, null]);
    await ask("studio:change-undo", "d", 4.9, "2");
    keep("undo floor", last("undoChange").slice(1), [placed("d"), 4, 2]);
    await ask("studio:change-undo", "d", obj, obj);
    keep("undo objects", last("undoChange").slice(1), [placed("d"), 0, 0]);
    await ask("studio:change-undo", "d", [3], null);
    keep("undo array", last("undoChange").slice(1), [placed("d"), 3, null]);
    const en = await ask("studio:agreement", "en");
    const pl = await ask("studio:agreement", "pl");
    const others = [];
    for (const v of [obj, null, "pl\0", 1]) others.push(await ask("studio:agreement", v));
    checks.push({ name: "agreement pl differs", ok: !!(en && pl && en.text && pl.text && en.text !== pl.text && en.text.length > 20) });
    checks.push({ name: "agreement hostile is english", ok: others.every(r => r && r.text === en.text) });
    await ask("studio:stats-span", "d", null);
    keep("span null", last("setStatsSpan")[2], "rolling-30");
    await ask("studio:stats-span", "d", { from: 1, to: ["d"] });
    keep("span number array", last("setStatsSpan")[2], "rolling-30");
    await ask("studio:stats-span", "d", "a\0");
    keep("span nul object", last("setStatsSpan")[2], "rolling-30");
    await ask("studio:stats-span", "d", "rolling-7");
    keep("span rolling-7", last("setStatsSpan")[2], "rolling-7");
    await ask("studio:stats-span", "d", "rolling-401");
    keep("span rolling-401", last("setStatsSpan")[2], "rolling-30");
    await ask("studio:stats-span", "d", "range-2026-04-01-2026-04-10");
    keep("span range", last("setStatsSpan")[2], "range-2026-04-01-2026-04-10");
    await ask("studio:stats-span", "d", "range-2026-02-30-2026-03-01");
    keep("span impossible day", last("setStatsSpan")[2], "rolling-30");
    await ask("studio:tag-move", "d", "id", "2"); keep("tag delta string", last("moveTag")[3], 2);
    await ask("studio:tag-move", "d", "id", null); keep("tag delta null", last("moveTag")[3], 0);
    await ask("studio:tag-move", "d", "id", obj); keep("tag delta object", last("moveTag")[3], 0);
    await ask("studio:tag-move", "d", "id", "2\0"); keep("tag delta nul", last("moveTag")[3], 0);
    await ask("studio:tag-move", "d", "id", [4]); keep("tag delta array", last("moveTag")[3], 4);
    await ask("studio:lang-move", obj, "en", 0, obj);
    keep("lang-move object confirms", last("moveLang")[4], { confirm: true });
    await ask("studio:lang-move", "d", "en", 0, arr);
    keep("lang-move array confirms", last("moveLang")[4], { confirm: true });
    await ask("studio:lang-move", "d", "en", 0, null);
    keep("lang-move null does not", last("moveLang")[4], { confirm: false });
    await ask("studio:lang-move", "d", "en", 0, 0);
    keep("lang-move zero does not", last("moveLang")[4], { confirm: false });
    for (const v of [obj, arr, 1, null, "true\0"]) {
      const r = await ask("studio:member-remove", "d", "t", "m", v);
      keep("member-remove refuses", { removed: r && r.removed, refused: r && r.refused }, { removed: false, refused: "not confirmed" });
    }
    await ask("studio:new", obj, null, { numbered: 1 });
    keep("new name object", last("newProject")[2], "[object Object]");
    keep("new numbered one is not", last("newProject")[4], { numbered: false });
    await ask("studio:new", "Widuma", null, { numbered: true });
    keep("new numbered true", last("newProject")[4], { numbered: true });
    await ask("studio:new", "Widuma", [{ code: 1, label: null }], null);
    keep("new langs", last("newProject")[3], [{ code: "1", label: "" }]);
    const kept = path.join(projects, "kept");
    fs.mkdirSync(kept, { recursive: true });
    const tabs = await ask("studio:tabs", { open: [{ dir: [kept, "other"], name: "Nope", rev: 1 }, { dir: kept, name: { n: 1 }, rev: "4" }], on: kept });
    keep("tabs drops a non-string dir", tabs && tabs.tabs, { open: [{ dir: kept, name: "[object Object]", rev: 4 }], on: kept });
    /* Hole 3: a falsy primitive or a string used to be read as an object. */
    for (const v of [false, 0, "", "abc"]) {
      await ask("studio:find-places", "d", v);
      keep("opts " + JSON.stringify(v), last("findPlaces")[2], { find: "", replace: "", whole: true, matchCase: false });
    }
    await ask("studio:find-places", "d", { find: "a", replace: "b", whole: false, matchCase: true });
    keep("opts object", last("findPlaces")[2], { find: "a", replace: "b", whole: false, matchCase: true });
    /* Hole 2: a non-string path is refused, and the log names its type, rather than String() throwing.
       The picker is answered first, so the gate holds a choice to compare against and reads the value. */
    await ask("studio:csv-pick", "t");
    said.length = 0;
    let pathThrew = false, pathAnswer;
    try { pathAnswer = await ask("studio:csv-export", "d", null, { toString: "x" }); }
    catch (e) { pathThrew = true; pathAnswer = e && e.message; }
    const pathLine = said.join("");
    keep("non-string path is refused", { threw: pathThrew, answered: pathAnswer, type: /named object\b/.test(pathLine) },
      { threw: false, answered: null, type: true });
    /* Every channel, each page parameter, the three values. A picker-gated act is primed, so the
       value under test meets a gate holding a choice: a hostile path is read by the gate itself, and
       any other value is the one that reaches the handler. Each placement must be answered, a
       refusal included, and never reject the invoke. */
    const hostile = [["object", {}], ["array", ["C:\\x"]], ["toString", { toString: "x" }]];
    const gated = {
      "studio:import-plan": ["file", "studio:import-pick", ["t"]],
      "studio:import-land": ["file", "studio:import-pick", ["t"]],
      "studio:sheet-plan": ["file", "studio:import-pick", ["t"]],
      "studio:sheet-land": ["file", "studio:import-pick", ["t"]],
      "studio:set-folder": ["folder", "studio:pick-folder", ["t"]],
      "studio:key-restore": ["file", "studio:key-restore-pick", ["t"]],
      "studio:csv-export": ["folder", "studio:csv-pick", ["t"]],
      "studio:export-edition": ["file", "studio:export-pick", ["t", "n"]],
      "studio:stats-export": ["file", "studio:stats-export-pick", ["t", "n", "k"]],
      "studio:audit-pack": ["folder", "studio:audit-pack-pick", ["t"]],
      "studio:v1-plan": ["file", "studio:v1-pick", ["t"]],
      "studio:v1-land": ["file", "studio:v1-pick", ["t"]],
    };
    const gatePath = {
      "studio:import-pick": picked.STUDIO_TEST_FILE,
      "studio:pick-folder": picked.STUDIO_TEST_FOLDER,
      "studio:key-restore-pick": picked.STUDIO_TEST_RESTORE,
      "studio:csv-pick": picked.STUDIO_TEST_CSV,
      "studio:export-pick": picked.STUDIO_TEST_SAVE,
      "studio:stats-export-pick": picked.STUDIO_TEST_STATS,
      "studio:audit-pack-pick": picked.STUDIO_TEST_PACK,
      "studio:v1-pick": picked.STUDIO_TEST_V1,
    };
    const members = preloadMembers(fs.readFileSync(PRELOAD, "utf8"), withoutComments(fs.readFileSync(PRELOAD, "utf8"), "preload.js"));
    const seenCh = new Set();
    let placements = 0;
    for (const member of members) {
      if (member.kind !== "invoke" && member.kind !== "send") continue;
      if (!member.channel || seenCh.has(member.channel)) continue;
      seenCh.add(member.channel);
      const params = member.params || [];
      if (!params.length) continue;
      for (let i = 0; i < params.length; i++) {
        for (const [tag, value] of hostile) {
          placements++;
          const gate = gated[member.channel];
          const args = params.map((name, n) => {
            if (n === i) return value;
            if (gate && name === gate[0]) return gatePath[gate[1]];
            return "";
          });
          if (gate) {
            try { await ask(gate[1], ...gate[2]); } catch { /* the prime is the gate's own answer */ }
          }
          const from = sinks.length;
          let rejected = null;
          try { await ask(member.channel, ...args); }
          catch (e) {
            rejected = String(e && e.message || e);
            if (rejected.startsWith("no door"))
              fail("sweep " + member.channel + " " + params[i] + " " + tag, e.message, "a handler");
          }
          keep("sweep " + member.channel + " " + params[i] + " " + tag + " answers", rejected, null);
          const hit = sinks.slice(from).some((s) => carries(s.args, value, new Set()) || written(s, tag));
          if (!sentAs(member.channel, params[i]))
            keep("sweep " + member.channel + " " + params[i] + " " + tag, hit, false);
          else checks.push({ name: "sweep " + member.channel + " " + params[i] + " " + tag + " allowed", ok: true });
        }
      }
    }
    checks.push({ name: "sweep placements " + placements, ok: placements > 200 });
  } catch (err) {
    checks.push({ name: "behaviour load", ok: false, got: String(err && err.stack || err), want: "no throw" });
  } finally {
    process.stderr.write = stderrWrite;
    Module._load = load;
    for (const k of Object.keys(envWas)) {
      if (envWas[k] === undefined) delete process.env[k]; else process.env[k] = envWas[k];
    }
  }
  return { ok: checks.length > 0 && checks.every(c => c.ok), checks: checks.length, failures: checks.filter(c => !c.ok) };
}

function replaceOnce(file, from, to, rel) {
  const text = fs.readFileSync(file, "utf8");
  fs.writeFileSync(file, plantText(text, from, to, rel));
}

function dropLoaded(tree) {
  if (!tree) return;
  const prefix = path.resolve(tree).toLowerCase();
  for (const key of Object.keys(require.cache)) {
    if (path.resolve(key).toLowerCase().startsWith(prefix)) delete require.cache[key];
  }
}

async function main() {
  const checkoutMain = path.join(ROOT, "shell", "main.js");
  const checkoutPre = path.join(ROOT, "shell", "preload.js");
  const mainBuf = fs.readFileSync(checkoutMain);
  const preBuf = fs.readFileSync(checkoutPre);
  const before = { main: sha(mainBuf), preload: sha(preBuf) };
  const plants = [];
  let greenA = null, greenB = null;
  let tree = null;
  try {
    /* ETIUDA_PLANTS=off (a merge's area run) skips the plants phase and counts it as the one check it is.
       The two green legs still run, on this checkout. */
    if (PLANTS_OFF) {
      console.log("SKIP the plants phase: both plants turn their legs red in a scratch copy, and the checkout's bytes are unchanged after it (ETIUDA_PLANTS=off)");
      greenA = audit();
      greenB = await behaviour();
    } else {
      const plantsMod = await import("./plants-tree.mjs");
      tree = plantsMod.plantsTree(ROOT, "ipc-coerce");
      MAIN = path.join(tree, "shell", "main.js");
      PRELOAD = path.join(tree, "shell", "preload.js");
      UI = path.join(tree, "ui", "index.html");
      replaceOnce(MAIN, OPEN_FROM, OPEN_TO, "shell/main.js");
      const redA = audit();
      const redB = await behaviour();
      const openHole = redA.holes.filter(h => h.channel === "studio:open" && h.param === "dir");
      const openFail = redB.failures.filter(f => (/^(open |sweep studio:open )/.test(String(f.name))) && f.name !== "open nul");
      const otherFail = redB.failures.filter(f => !(/^(open |sweep studio:open )/.test(String(f.name))) && f.name !== "open nul");
      plants.push({ name: "main guard removed from studio:open", auditRed: openHole.length === 1 && redA.holes.length === openHole.length,
        behaviourRed: openFail.length >= 3 && otherFail.length === 0, holes: redA.holes, failures: redB.failures.map(f => f.name) });
      fs.writeFileSync(MAIN, mainBuf);
      replaceOnce(PRELOAD, PRE_FROM, PRE_TO, "shell/preload.js");
      const redP = audit();
      plants.push({ name: "preload coerces studio:open with no comment", auditRed: redP.unexplained.indexOf("open") >= 0 && !redP.ok,
        unexplained: redP.unexplained, explained: redP.explained });
      fs.writeFileSync(PRELOAD, preBuf);
      greenA = audit();
      greenB = await behaviour();
    }
  } finally {
    if (tree) {
      try { fs.writeFileSync(path.join(tree, "shell", "main.js"), mainBuf); } catch { /* the copy */ }
      try { fs.writeFileSync(path.join(tree, "shell", "preload.js"), preBuf); } catch { /* the copy */ }
      dropLoaded(tree);
      const plantsMod = await import("./plants-tree.mjs");
      plantsMod.dropPlantsTree(tree, ROOT);
    }
  }
  const afterMain = fs.readFileSync(checkoutMain);
  const afterPre = fs.readFileSync(checkoutPre);
  const restored = afterMain.equals(mainBuf) && afterPre.equals(preBuf);
  const plantOk = plants.length === 2 && plants.every(p => p.auditRed) && plants[0].behaviourRed;
  const auditOk = !!(greenA && greenA.ok);
  const behaviourOk = !!(greenB && greenB.ok);
  if (!PLANTS_OFF) {
    console.log("ic1 plants " + plants.map(p => p.name + " audit=" + p.auditRed + (p.behaviourRed === undefined ? "" : " behaviour=" + p.behaviourRed)).join("; "));
    if (!plants[0] || !plants[0].auditRed || !plants[0].behaviourRed) console.log("ic1 plant detail " + JSON.stringify(plants[0]));
    if (!plants[1] || !plants[1].auditRed) console.log("ic1 preload plant " + JSON.stringify(plants[1]));
  }
  console.log("ic2 audit channels " + (greenA ? greenA.members : 0) + " handlers " + (greenA ? greenA.handlers : 0)
    + " pass-through " + (greenA ? greenA.pass : 0) + " explained " + (greenA ? greenA.explained.join(",") : "")
    + " guarded-params " + (greenA ? greenA.guarded : 0) + " unread-params " + (greenA ? greenA.unread : 0)
    + " holes " + (greenA ? greenA.holes.length : -1) + " unexplained " + (greenA ? greenA.unexplained.join(",") : ""));
  if (greenA && !greenA.ok) console.log("ic2 holes " + JSON.stringify(greenA.holes).slice(0, 2000));
  if (greenA && greenA.unexplained.length) console.log("ic2 unexplained " + greenA.unexplained.join(","));
  console.log("ic3 behaviour checks " + (greenB ? greenB.checks : 0) + " failures " + (greenB ? greenB.failures.length : -1));
  if (greenB && greenB.failures.length) console.log("ic3 failures " + JSON.stringify(greenB.failures).slice(0, 2500));
  console.log("ic4 restored " + restored + " main " + before.main + " preload " + before.preload);
  if (greenA && greenA.rows) console.log("ROWS " + JSON.stringify(greenA.rows));
  if ((!PLANTS_OFF && !plantOk) || !restored) {
    console.log("ipc-coerce: FAIL");
    process.exit(1);
  }
  const failed = (auditOk ? 0 : 1) + (behaviourOk ? 0 : 1);
  console.log("#counts checks=" + (2 + (PLANTS_OFF ? 0 : 1)) + " skipped=" + (PLANTS_OFF ? 1 : 0)
    + " failed=" + failed + " expected=3");
  const ok = failed === 0;
  console.log(ok ? "ipc-coerce: ok" : "ipc-coerce: FAIL");
  process.exit(ok ? 0 : 1);
}

main();
