/* THE ONE DOOR TO THE PINNED ENGINE, and the reason it is one door.
 *
 * Studio re-implements no reader, no writer, no lint rule and no count that the engine has
 * (CLAUDE.md, Maxim 2026-09-16). The way to keep a rule like that true is not discipline: it
 * is to make the engine reachable from exactly one module, so that a second implementation
 * would have to be written somewhere this file is not imported, and a reader auditing the
 * promise reads one file rather than the tree.
 *
 * IT FAILS CLOSED. Every getter below throws with the fetch command in the message when the
 * pinned tree is absent. A Studio that silently carried on with its own idea of the format
 * would write files a desk refuses, and it would do it quietly, which is the failure this
 * whole arrangement exists to prevent.
 *
 * WHAT IS TAKEN BY SLICE RATHER THAN BY IMPORT, and why that is not a shortcut. The engine's
 * card placeholder vocabulary is a `const` inside a browser module that imports half the
 * engine; importing it in node would drag in the DOM. The round-trip gate already slices the
 * shell's counting rules out by source text for the same reason and says why. A slice fails
 * LOUDLY when the declaration moves, which is the reminder that the pin has drifted; a
 * retyped copy fails silently and agrees with itself forever.
 */
import fs from "node:fs";
import crypto from "node:crypto";
import path from "node:path";
import { createRequire } from "node:module";
import { parsePlain } from "./plain-json.mjs";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const PINNED = path.join(ROOT, "engine", "pinned");
const require = createRequire(import.meta.url);

const FETCH = "run: node tools/engine-fetch.mjs";

function at(...parts) {
  const p = path.join(PINNED, ...parts);
  if (!fs.existsSync(p))
    throw new Error("no pinned engine at " + p + "; " + FETCH);
  return p;
}

/** The format 2 vocabulary: slug, the id shapes, the canonical form and the content hash. */
async function format() {
  const p = at("tools", "catalog-v2", "format.mjs");
  return import("file:///" + p.split(path.sep).join("/"));
}

/** The one-off converter's oracle: format 1 forward, format 2 back, and the differences
 *  classified. `roundTrip` is what `node tools/catalog-v2/convert.mjs` calls, and calling it
 *  here is what lets a screen's upgrade be held to the command line's bytes. */
async function converter() {
  const p = at("tools", "catalog-v2", "roundtrip.mjs");
  return import("file:///" + p.split(path.sep).join("/"));
}

/* THE FORMAT 1 READER, SLICED FOR THE THIRD REASON A SLICE IS TAKEN HERE: it is not exported.
 * `readV1` sits inside tools/catalog-v2/convert.mjs, which is a command-line script rather than
 * a module, and it is the only thing left in the engine that knows how a format 1 catalog is
 * PACKAGED - a one-line assignment to a global under a comment header, found by literal search
 * exactly as the 1.x importer found it, with two global names in circulation. Retyping that
 * here would be a second reader of a format this repository is not allowed to have one of, and
 * it would be a reader nobody ever runs twice.
 *
 * IT NO LONGER EVALUATES (Grok review kappa, finding 5): what follows was the decision until 2026-11-22. The converter's
 * `runInNewContext` is handed literalData below instead, which reads a hand-written object literal as data (bare keys,
 * single quotes, comments, trailing commas) and refuses anything that would have to run: a call, an operator, a name. So the
 * published sample still opens and a file that is a program is not a catalog. Until then:
 * IT EVALUATES, AND THAT IS THE DECISION THIS DOOR CARRIES. A catalog an engine WROTE is JSON;
 * a catalog a person wrote is a JavaScript object literal with bare keys, and the engine's own
 * published sample is one - so a converter that only parses JSON cannot open the file the spec
 * names. The command line makes it opt-in behind --eval because a script that evaluated its
 * input silently would surprise; Studio passes it true, because the person has picked this file
 * from their own disk in a program whose whole purpose at that moment is to read it, and a
 * refusal they cannot get past is not a safer program. The evaluation is the engine's own line
 * and not a second one: runInNewContext, a context with a null prototype and nothing on it, and
 * a five second ceiling. `die` is the caller's, and it throws where the command line exits,
 * which is the same substitution editionRules makes for `Date` below.
 */
/** A JavaScript object literal read as data and never run: it is turned into JSON token by token (a bare key quoted, a
 *  single-quoted string double-quoted, comments and trailing commas dropped) and handed to parsePlain, which refuses the
 *  names that reach a prototype. A call, an operator, a template or any name but true, false and null is refused. */
function literalData(src) {
  const s = String(src);
  let i = 0, out = "";
  const fail = () => { throw new Error("not a data literal near character " + i); };
  while (i < s.length) {
    const c = s[i];
    if (/\s/.test(c)) { i++; continue; }
    if (s.startsWith("//", i)) { while (i < s.length && s[i] !== "\n") i++; continue; }
    if (s.startsWith("/*", i)) { const e = s.indexOf("*/", i + 2); if (e < 0) fail(); i = e + 2; continue; }
    if (c === '"' || c === "'") {
      let j = i + 1, v = "";
      while (j < s.length && s[j] !== c) {
        if (s[j] === "\\") { v += c === "'" && s[j + 1] === "'" ? "'" : s[j] + s[j + 1]; j += 2; }
        else { v += s[j] === '"' ? '\\"' : s[j]; j++; }
      }
      if (j >= s.length) fail();
      out += '"' + v + '"';
      i = j + 1;
      continue;
    }
    if ("{}[]:,".indexOf(c) >= 0) {
      if (c === "}" || c === "]") out = out.replace(/,\s*$/, "");
      out += c; i++;
      continue;
    }
    const m = /^(-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?|[A-Za-z_$][\w$]*)/.exec(s.slice(i));
    if (!m) fail();
    const w = m[1];
    if (/^[A-Za-z_$]/.test(w) && w !== "true" && w !== "false" && w !== "null") {
      let j = i + w.length;
      while (j < s.length && /\s/.test(s[j])) j++;
      if (s[j] !== ":") fail();
      out += JSON.stringify(w);
    } else out += w;
    i += w.length;
  }
  return parsePlain(out);
}

function readCatalogV1() {
  const p = at("tools", "catalog-v2", "convert.mjs");
  const src = fs.readFileSync(p, "utf8");
  const marker = "function readV1(";
  const i = src.indexOf(marker);
  if (i < 0) throw new Error("the pinned engine has no " + JSON.stringify(marker)
    + " in tools/catalog-v2/convert.mjs; the format 1 reader has moved and this slice must"
    + " follow it rather than guess");
  let depth = 0, body = null;
  for (let k = src.indexOf("{", i); k < src.length && body == null; k++) {
    if (src[k] === "{") depth++;
    else if (src[k] === "}") { depth--; if (!depth) body = src.slice(i, k + 1); }
  }
  if (body == null) throw new Error("could not find the end of " + marker);
  return new Function("readFileSync", "runInNewContext", "evaluate", "die",
    body + "\nreturn readV1;")(
    fs.readFileSync, (code) => literalData(String(code).replace(/^\(/, "").replace(/\)$/, "")), true, /* plant:k-data */
    (msg) => { throw new Error(String(msg)); });
}

/** The lint. tests/test.js exports lintCatalog(), which validates a format 2 file through the
 *  engine's own reader before it applies a rule of its own. */
function lint() {
  return require(at("tests", "test.js"));
}

/* THE CARD PLACEHOLDER VOCABULARY, sliced out of the engine by its own canary.
 *
 * `TOKEN_CANARY` in src/modules/rail-list.js is the engine's own list of every token a card
 * body may carry, kept there because the rail's measurement has to include one of each. It is
 * therefore the closest thing the engine has to a declaration of the vocabulary, and taking it
 * means the day the engine grows a token, Studio's importer knows about it at the next fetch
 * rather than at the next time somebody remembers.
 *
 * `{DAYPART:a|b|c}` carries an argument, so the bare names are taken and the argument form is
 * matched separately by the caller. */
function cardTokens() {
  const p = at("src", "modules", "rail-list.js");
  const src = fs.readFileSync(p, "utf8");
  const marker = "const TOKEN_CANARY=";
  const i = src.indexOf(marker);
  if (i < 0) throw new Error("the pinned engine has no " + JSON.stringify(marker)
    + " in src/modules/rail-list.js; the placeholder vocabulary has moved and this slice must"
    + " follow it rather than guess");
  const nl = src.indexOf("\n", i);
  const line = src.slice(i, nl);
  const names = (line.match(/\{[A-Z][A-Z0-9_]*(?::[^}]*)?\}/g) || [])
    .map(t => t.replace(/^\{/, "").replace(/\}$/, "").split(":")[0]);
  const seen = new Set(names);
  if (!seen.size) throw new Error("the canary line carries no token: " + line);
  return { tokens: Array.from(seen).sort(), from: "src/modules/rail-list.js TOKEN_CANARY" };
}

/* WHICH LANGUAGES THE ENGINE HAS OF ITS OWN, AND WHETHER IT REFUSES ANY OTHER. Two different
 * sets, which decision A1.3 of 2026-09-11 says must not be confused: a catalog DECLARES a
 * language, and a build of the engine HAS something of its own for one.
 *
 * AND WHICH PIN THIS IS, IS READ OFF THE PIN RATHER THAN ASSUMED. Before board 646 the storage
 * was closed with the grammar: a code with no field column was refused at load, so
 * `CONTENT_LANGS` answered both questions at once. Since 646 the storage is open - the column is
 * derived from the code - and `V2_GRAMMAR_LANGS` in catalog-v2.js is the closed half by itself,
 * so a code outside it is carried rather than refused. This reads the newer declaration where
 * the pin has it and falls back to the older one where it does not, which is what lets Studio
 * be right on either side of the pin moving.
 *
 * `CONTENT_LANGS` is declared with the pair and then REWRITTEN IN PLACE by setContentLangs when
 * a catalog is adopted, which is why `BUILT_IN_LANGS` sits beside it holding a copy. */
function langSupportFrom(v2Src, contentSrc) {
  const gm = "const V2_GRAMMAR_LANGS=";
  const codesIn = (src, marker) => {
    const i = src.indexOf(marker);
    if (i < 0) return null;
    const line = src.slice(i, src.indexOf("\n", i));
    const codes = (line.match(/"[a-z]{2,8}"/g) || []).map(x => x.slice(1, -1));
    if (!codes.length) throw new Error("the declaration carries no language code: " + line);
    return codes;
  };
  const newer = codesIn(String(v2Src || ""), gm);
  if (newer) return { grammar: newer, refusesOthers: false };
  const older = codesIn(String(contentSrc || ""), "const CONTENT_LANGS=");
  if (!older) throw new Error("the pinned engine has neither " + JSON.stringify(gm)
    + " in src/modules/catalog-v2.js nor " + JSON.stringify("const CONTENT_LANGS=")
    + " in src/modules/content-model.js; the language declaration has moved and this slice"
    + " must follow it rather than guess");
  return { grammar: older, refusesOthers: true };
}
function langSupport() {
  return langSupportFrom(fs.readFileSync(at("src", "modules", "catalog-v2.js"), "utf8"),
                         fs.readFileSync(at("src", "modules", "content-model.js"), "utf8"));
}
/** The engine's own languages. The importer needs them to tell a language a catalog has not
 *  promised from one it has, and taking them from the pin means the day the engine learns one,
 *  Studio knows at the next fetch rather than at the next time somebody remembers. */
function builtInLangs() {
  return langSupport().grammar;
}

/* WHAT A LANGUAGE IS CALLED IN ITSELF, taken from the pin for the reason above it.
 *
 * The engine names an offered language by its endonym and a missing one by its code, and board
 * 532 keeps that split (`langEndonym`, src/modules/lang-tabs.js at the pin). Studio's settings
 * screen offers languages, so it says English and Polski where the engine would, and it takes
 * the table from the pin rather than keeping a second one: the day the engine learns a fourth
 * endonym, the screen says it at the next fetch.
 *
 * THE FALLBACK IS THE ENGINE'S OWN and is not a defect: a code the table does not know reads as
 * its own capitals, which is what `langEndonym` returns, and the settings screen lets a person
 * write the name themselves for exactly that case. */
function langEndonyms() {
  const p = at("src", "modules", "lang-tabs.js");
  const src = fs.readFileSync(p, "utf8");
  const marker = "const LANG_ENDONYM=";
  const i = src.indexOf(marker);
  if (i < 0) throw new Error("the pinned engine has no " + JSON.stringify(marker)
    + " in src/modules/lang-tabs.js; the table of endonyms has moved and this slice must follow"
    + " it rather than guess");
  const lit = src.slice(i + marker.length, src.indexOf("\n", i)).replace(/;\s*$/, "");
  const out = new Function("return (" + lit + ")")();
  if (!out || typeof out !== "object" || !out.en)
    throw new Error("the endonym table read from the pin has no en: " + lit);
  return out;
}

/* THE EDITION RULES THE ENGINE HAS, sliced for the same reason and with one addition: a clock.
 *
 * What an edition IS and which of two is older are the engine's: `editionParts` reads the one
 * form that can be ordered, `catalogEditionOlder` orders it (the letters run like spreadsheet
 * columns, BY LENGTH and then alphabetically, an order a plain "<" reverses), and `todayEdition`
 * names today, which is what the engine's Export stamps on every catalog it makes. STEPPING an
 * edition is not here: the engine's Export always makes a new catalog and steps nothing, so that
 * rule is Studio's own, in src/publish.mjs, built on these three.
 *
 * The one thing added is the clock. The engine reads `new Date()` because it runs when a person
 * presses a button; a publisher has to be deterministic under test, so the slice is evaluated
 * with a `Date` of the caller's choosing shadowing the global. The engine's own text is
 * unchanged, which is the whole point - the substitution happens outside it.
 */
function editionRules(fixedNow) {
  const Clock = fixedNow == null ? Date : function () { return new Date(fixedNow); };
  if (fixedNow != null) { Clock.now = () => new Date(fixedNow).getTime(); }
  const { todayEdition, editionParts, catalogEditionOlder } = rulesFrom(
    fs.readFileSync(at("src", "modules", "catalog-file.js"), "utf8"),
    ["const EDITION_DATED=", "function editionParts(", "function catalogEditionOlder(", "function todayEdition("],
    { where: "the pinned engine", file: "src/modules/catalog-file.js", constByLine: true, inject: { Date: Clock },
      names: ["todayEdition", "editionParts", "catalogEditionOlder"] });
  return { todayEdition, editionParts, catalogEditionOlder };
}

/* THE SIGNATURE'S RULE, SLICED.
 *
 * What Ed25519 signs is not the file and not the catalog: it is the canonical form of the
 * document with `hash` taken off, `sig.value` taken off and `sig.alg` and `sig.keyId` left on
 * (Maxim, 2026-09-19 21:37). That fold is the whole interoperability contract between Studio
 * and a desk, and the engine declares it in `src/modules/catalog-v2.js` as v2SigFold and
 * v2SignedBytes. Retyping it here would be a second declaration of a format this repository is
 * not allowed to have one of, so it is sliced, exactly as the placeholder vocabulary is.
 *
 * NO PIN OLDER THAN A SLICE'S DECLARATIONS CAN BE IN PLACE: tests/drift.mjs, first in the suite,
 * fails a pin more than its stated count behind the engine's main, and every feature sliced here
 * is hundreds of commits older than that. So a missing declaration is one the engine has moved,
 * and every slice here refuses it alike, naming it (board 858, P2, which took out the per-feature
 * flags and Studio's copy of the fold that stood in for a pin before the signature).
 *
 * THE SLICER COUNTS BRACES FOR A FUNCTION AND SEMICOLONS FOR A CONST, which is the engine's own
 * tests/catalog-sig.js rule. TRAP, and the engine's file carries the same warning at the site:
 * a character class holding an escaped closing bracket takes a bracket count below zero, so
 * V2_MARKER_RE is not among the declarations below and must not be added without reading that
 * comment first.
 */
const SIG_DECLS = [
  "const V2_SIG_NONE=", "const V2_SIG_ALG=",
  "const V2_HARNESS_TEST_KEYID=", "const V2_HARNESS_TEST_PUB=", "const V2_KNOWN_KEYS=",
  "function v2Canonical(", "function v2SigFold(", "function v2SignedBytes(",
  "function v2HexBytes(", "function v2SigState(",
];

/* THE SCANNER: from a declaration's first character to its end, by brackets for a function and by
 * the first semicolon outside them for a const. */
function sliceAt(src, i, marker, where) {
  const isFn = marker.startsWith("function") || marker.startsWith("async function");
  let par = 0, brk = 0, brc = 0, sawBrace = false;
  for (let k = i; k < src.length; k++) {
    const ch = src[k];
    if (ch === "(") par++;
    else if (ch === ")") par--;
    else if (ch === "[") brk++;
    else if (ch === "]") brk--;
    else if (ch === "{") { brc++; sawBrace = true; }
    else if (ch === "}") {
      brc--;
      if (isFn && sawBrace && !par && !brk && !brc) return src.slice(i, k + 1);
    } else if (ch === ";" && !isFn && !par && !brk && !brc) return src.slice(i, k + 1);
  }
  throw new Error("could not find the end of " + marker + " in " + where);
}

/* ONE SLICER FOR EVERY RULE BELOW (board 858, P4), where eleven functions each found their
 * declarations, cut them, refused a missing one in words of their own and ran the result. Each
 * declaration is found by its first characters and cut by sliceAt, a const by its line where the
 * caller says so (a regular expression whose class holds an escaped bracket defeats the count); a
 * declaration that is not there is refused by name and file. The slices run as one body, given what
 * the caller injects (node's crypto, a clock), and hand back the names asked for, with `from`. */
function slicesOf(src, decls, where, file, constByLine) {
  return decls.map(m => {
    const i = src.indexOf(m);
    if (i < 0) throw new Error(where + " has no " + JSON.stringify(m) + " in " + file
      + "; the declaration has moved and this slice must follow it rather than guess");
    return constByLine && !m.startsWith("function") ? src.slice(i, src.indexOf("\n", i)) : sliceAt(src, i, m, where);
  });
}
function rulesFrom(src, decls, o) {
  const inject = o.inject || {};
  const body = slicesOf(src, decls, o.where, o.file, o.constByLine).join("\n");
  const fns = new Function(...Object.keys(inject), body + "\nreturn { " + o.names.join(", ") + " };")(
    ...Object.values(inject));
  fns.from = o.from || o.where;
  return fns;
}
const STATES = "states: { none: V2_SIG_NONE, valid: V2_SIG_VALID, invalid: V2_SIG_INVALID, unknown: V2_SIG_UNKNOWN }";
const SIG_NAMES = ["v2Canonical", "v2SigFold", "v2SignedBytes", "v2HexBytes", "v2SigState", "V2_SIG_ALG",
  "V2_KNOWN_KEYS", STATES];
const NODE = () => ({ crypto, Buffer });

/** The signature's functions out of an engine's own text. `where` is said in every refusal and
 *  is printed by the gate, because two engines are in circulation at every pin move and a
 *  verdict that does not name its engine cannot be read (board 510). */
function sigRulesFrom(src, where) {
  return rulesFrom(src, SIG_DECLS, { where, file: "src/modules/catalog-v2.js", names: SIG_NAMES });
}

/** The signature's rule as the PINNED engine states it. */
function sigRules() {
  const p = at("src", "modules", "catalog-v2.js");
  let commit = "";
  try { commit = pin().commit.slice(0, 7); } catch (e) { commit = "unknown"; }
  return sigRulesFrom(fs.readFileSync(p, "utf8"), "the pinned engine " + commit);
}

/* THE RING, SLICED THE SAME WAY. Board 605, Maxim
 * 2026-09-20 21:37: the desk reads a ring file beside its catalogs, each entry binding one
 * public key to one catalog id. Studio writes that file (src/ring.mjs) and must never be the
 * one that says what it means, so the reader a gate checks Studio's output with is the engine's
 * own v2RingRead, sliced out of the engine's text and run unchanged.
 *
 * V2_ID_RE IS SLICED AND V2_MARKER_RE IS NOT, and the difference is not taste: the slicer counts
 * brackets, and V2_MARKER_RE's character class holds an escaped `]` that takes the count below
 * zero. V2_ID_RE's classes are balanced, so it slices; the engine's own comment at that site says
 * the same thing and must be read before either list grows.
 */
const RING_DECLS = ["const V2_RING_FORMAT=", "function v2Str(", "const V2_ID_RE=",
                    "function v2RingRead("];

/** The signature's functions AND the ring's reader, out of an engine's own text. */
function ringRulesFrom(src, where) {
  return rulesFrom(src, SIG_DECLS.concat(RING_DECLS), { where, file: "src/modules/catalog-v2.js",
    names: SIG_NAMES.concat(["v2RingRead", "V2_RING_FORMAT", "V2_RING_KIND", "V2_RING_FILE"]) });
}

/** The ring's rule as the PINNED engine states it. */
function ringRules() {
  const p = at("src", "modules", "catalog-v2.js");
  let commit = "";
  try { commit = pin().commit.slice(0, 7); } catch (e) { commit = "unknown"; }
  return ringRulesFrom(fs.readFileSync(p, "utf8"), "the pinned engine " + commit);
}

/* A DESK'S OWN FILE, AS THE DESK'S SHELL READS ONE (board 834, step 8). A file in a desk's folder is
 * that desk's only where its folder is its id, the id is the one its key makes and the signature
 * verifies under the desk prefix, and the engine states that once, in the pinned shell/main.js, as
 * deskFileGenuine. It is sliced from there with its five helpers and run with node's own crypto, so
 * the queue and every desk ignore the same files. `signedSha` is the desk's pin of an edition, which
 * `grew.sha` holds. */
const DESK_DECLS = ["const BRANCH_PREFIX =", "const SPKI_ED25519 =", "function branchIdOf(",
  "function canonJson(", "function signedBytesOf(", "function branchSignedBytes(", "function signedSha(",
  "function deskFileGenuine("];
function deskRulesFrom(src, where) {
  return rulesFrom(src, DESK_DECLS, { where, file: "shell/main.js", inject: NODE(),
    names: ["deskFileGenuine", "signedSha", "branchIdOf", "branchSignedBytes", "BRANCH_PREFIX"] });
}
let DESK = null;
/** The desk file's rule as the PINNED engine states it. */
function deskRules() {
  if (!DESK) DESK = deskRulesFrom(shellText(), "the pinned engine");
  return DESK;
}

/* THE COUNTS A DESK'S LIBRARY ROW SAYS ABOUT A FILE, the pinned shell's ecCounts with ecBlocks and
 * the marker it reads, sliced as the desk file's rule is. A macro is a BODY BLOCK, a steps or alts
 * body counting one per paragraph between its markers; the release notes counted one per card until
 * board 858 (P5), under a comment that said "by the pinned shell's rules". */
const COUNT_DECLS = ["const EC_MARKER =", "function ecBlocks(", "function ecCounts("];
let COUNTS = null;
function countRules() {
  if (!COUNTS) COUNTS = rulesFrom(shellText(), COUNT_DECLS,
    { where: "the pinned engine", file: "shell/main.js", constByLine: true, names: ["ecCounts", "ecBlocks"] });
  return COUNTS;
}

/* THE TEAM FILE'S READER, the engine's v2TeamRead and v2TeamSigState, sliced beside the signature's
 * functions as the ring's reader is: src/team.mjs writes the file and never says what it means. */
const TEAM_DECLS = ["function v2Str(", "const V2_ID_RE=", "const V2_TEAM_FORMAT=", "function v2TeamRead(",
  "function v2TeamSigState("];
function teamRules() {
  return rulesFrom(fs.readFileSync(at("src", "modules", "catalog-v2.js"), "utf8"), SIG_DECLS.concat(TEAM_DECLS),
    { where: "the pinned engine", file: "src/modules/catalog-v2.js", names: ["v2TeamRead", "v2TeamSigState", "v2SignedBytes",
      "V2_SIG_ALG", "V2_TEAM_FORMAT", "V2_TEAM_KIND", "V2_TEAM_FILE", "V2_TEAM_ID_RE", STATES] });
}

/* THE TEAM KEY'S WRAP, HPKE AS THE PINNED SHELL DECLARES IT (board 834, step 12): sliced from shell/main.js with node's
 * own crypto, as the desk file's rule is, so a wrap Studio makes is one a desk's shell opens. The binding (info and aad)
 * is sliced too: the pin carries its four declarations since engine 6128d6a, and a pin that lacks one is refused, naming
 * the declaration, as a pin before HPKE is. There is no copy of the binding in Studio to run in its place. */
const HPKE_DECLS = ["const HPKE_KEM =", "const HPKE_SUITE =", "const SPKI_X25519 =", "function hpkeLabeledExtract(",
  "function hpkeLabeledExpand(", "function hpkeX25519Public(", "function hpkeShared(", "function hpkeSchedule(",
  "function hpkeSeal(", "function hpkeOpen(", "const SEALED_TEAM_RE ="];
const WRAP_DECLS = ["const TEAM_WRAP_LABEL =", "function teamWrapInfo(", "function wrapTeamKey(", "function unwrapTeamKey("];
function hpkeRulesFrom(src, where) {
  const fns = rulesFrom(src, HPKE_DECLS.concat(WRAP_DECLS), { where, file: "shell/main.js", inject: NODE(),
    names: ["hpkeSeal", "hpkeOpen", "teamWrapInfo", "wrapTeamKey", "unwrapTeamKey"] });
  fns.pinnedWrap = slicesOf(src, WRAP_DECLS, where, "shell/main.js").join("\n");
  return fns;
}
let HPKE = null;
/** HPKE and the team key's wrap as the PINNED engine states them. */
function hpkeRules() {
  if (!HPKE) HPKE = hpkeRulesFrom(shellText(), "the pinned engine");
  return HPKE;
}

/* THE SEALED ENVELOPE, AS THE PINNED SHELL DECLARES IT (board 834, step 12, S6): sliced from shell/main.js with node's own
 * crypto, so an edition Studio seals is one a desk's shell opens, and a desk's own file a desk sealed is opened here by the
 * same function. A pin without them is refused, naming the declaration. */
const SEAL_DECLS = ["const SEALED_KIND =", "const SEALED_TEAM_RE =", "function sealedAad(", "function sealCatalog(",
  "function openSealed("];
function sealRulesFrom(src, where) {
  return rulesFrom(src, SEAL_DECLS, { where, file: "shell/main.js", inject: NODE(),
    names: ["sealCatalog", "openSealed", "SEALED_KIND"] });
}
let SEAL = null;
/** The sealed envelope's seal and open as the PINNED engine states them. */
function sealRules() {
  if (!SEAL) SEAL = sealRulesFrom(shellText(), "the pinned engine");
  return SEAL;
}

/* A DESK'S REQUEST TO JOIN A TEAM, AS THE PINNED SHELL DECLARES IT (board 834, step 12, S5): the request's genuineness, the
 * commitment and the signing of the lead's file of openings, sliced from shell/main.js with node's own crypto. No code is
 * sliced: a desk is let in by its invitation or by the lead's press, never by a number read out (board 1017). A pin without
 * them is refused. */
const JOIN_DECLS = ["const SPKI_ED25519 =", "function branchIdOf(", "function canonJson(", "function signedBytesOf(",
  "const SEALED_TEAM_RE =", "const JOIN_PREFIX =", "const JOIN_KIND =", "const JOIN_HEX_RE =", "function joinHash(",
  "function joinCommit(", "function joinSignedBytes(", "function joinGenuine(", "function joinsSignedBytes(",
  "function joinOpening("];
function joinRulesFrom(src, where) {
  return rulesFrom(src, JOIN_DECLS, { where, file: "shell/main.js", inject: NODE(),
    names: ["joinCommit", "joinGenuine", "joinOpening", "joinSignedBytes", "joinsSignedBytes", "branchIdOf", "JOIN_KIND",
      "JOINS_KIND", "JOINS_NAME"] });
}
let JOIN = null;
/** The join rule as the PINNED engine states it. */
function joinRules() {
  if (!JOIN) JOIN = joinRulesFrom(shellText(), "the pinned engine");
  return JOIN;
}

/* AN INVITATION, AS THE PINNED SHELL DECLARES IT (board 885, S2): the proof a request carries, the invitation's id and
 * the check code the lead reads out, sliced from shell/main.js with node's own crypto, so the code Studio shows is reckoned
 * by the function the desk checks it with, and a proof is checked by the function that made it. inviteRead comes
 * with them (the folder rule went from the engine with the folder join, engine fold 131): an invitation Studio makes is read back by the desk's own reader before anyone is given it, so
 * Studio never hands out a blob a desk would refuse, and keeps no second copy of what a desk will take. A pin without any
 * of them is refused, naming the declaration. */
/* A PIN BEFORE THE ENGINE'S FOLDER REMOVAL (its P2) reads an invitation that names a folder: its inviteRead calls inviteFolder,
   and for a folder invitation placeKept with the two pure rules that one calls. A pin after it reads relay invitations only and
   has no inviteFolder (it keeps the place rules for its own use, and Studio's place slice below carries them). So the slice asks
   for those four of a pin whose text has inviteFolder and of no other, and one list slices on both. The four lines go with the
   last pin that carries inviteFolder. */
const INVITE_DECLS = ["const SEALED_TEAM_RE =", "const INVITE_HIDDEN_RE =", "function memberProof(",
  "function inviteIdOf(", "function inviteRead(", "function inviteRelay(", "function teamChannelOf("]; /* plant:invite-place */
const INVITE_FOLDER_DECLS = ["function inviteFolder(", "function placeKindOk(", "function placeSlash(", "function placeKept("];
const inviteDeclsFor = (src) => (String(src).indexOf("function inviteFolder(") >= 0 ? INVITE_DECLS.concat(INVITE_FOLDER_DECLS) : INVITE_DECLS); /* plant:fsg-invite-folder */
function inviteRulesFrom(src, where) {
  return rulesFrom(src, inviteDeclsFor(src), { where, file: "shell/main.js", inject: NODE(),
    names: ["memberProof", "inviteIdOf", "inviteRead", "INVITE_HIDDEN_RE"] });
}
let INVITE = null;
/** The invitation's rules as the PINNED engine states them. */
function inviteRules() {
  if (!INVITE) INVITE = inviteRulesFrom(shellText(), "the pinned engine");
  return INVITE;
}

/* A folder's place, as the shell resolves it (board 945, item 4): the kind and the path relative to a sync root.
   The pure rules, from placeKindOk through placeKept, and readSyncRecords, are sliced. The io readSyncRecords
   takes when none is given is Studio's own src/sync-roots.cjs, injected as the liveSyncIo the slice calls.
   The slice never carries liveSyncIo, the execFile destructure or the shell's fs require. A pin that does not
   carry the declarations yet leaves placeRules() null, and callers keep the absolute path. driveTops names Drive's
   folders and driveSeen is the desk's own look for Drive's roots (board 955, condition 2), run by driveLook below. */
const { syncIo, dirList } = require("./sync-roots.cjs");
const PLACE_DECLS = ["function placeKindOk(", "function driveTops(", "function placeSlash(", "function placeLeaf(", "function placeJoin(",
  "function placeUnder(", "function placeRest(", "function syncRootsFrom(", "function placeOf(",
  "function placeCandidates(", "function placeResolve(", "function placeKept(", "function readSyncRecords(",
  "async function driveSeen("];
const PLACE_NAMES = ["placeOf", "placeResolve", "syncRootsFrom", "readSyncRecords", "driveSeen"];
function placeRulesFrom(src, where) {
  return rulesFrom(src, PLACE_DECLS, { where, file: "shell/main.js",
    inject: Object.assign(NODE(), { liveSyncIo: syncIo }),
    names: PLACE_NAMES });
}
let PLACE;
/** The place rule as the PINNED engine states it, or null where this pin does not carry it yet. */
function placeRules() {
  if (PLACE !== undefined) return PLACE;
  try { PLACE = placeRulesFrom(shellText(), "the pinned engine"); }
  catch (e) { PLACE = null; }
  return PLACE;
}
/* DRIVE'S ROOTS, LOOKED FOR AS THE DESK LOOKS (board 955, condition 2): the pin's driveSeen, over the letters D to Z
   that no record names as a mapped network letter, through src/sync-roots.cjs's one listing, within the desk's 3 s and
   one folder at a time. What it finds is kept on syncIo for the place rules' synchronous readers; a later look replaces
   it. Off Windows, or on a pin without driveSeen, nothing is looked at. */
let LOOKING = null;
function driveLook() {
  if (LOOKING) return LOOKING;
  const rules = placeRules();
  if (process.platform !== "win32" || !rules || typeof rules.driveSeen !== "function") return Promise.resolve([]);
  let rec = null;
  try { rec = rules.readSyncRecords(Object.assign({}, syncIo(), { drives: null })); } catch (e) { rec = null; }
  if (!rec) return Promise.resolve([]);
  LOOKING = rules.driveSeen(rec, dirList, 3000)
    .then(found => { syncIo.drives = found; return found; }, () => syncIo.drives || []) /* plant:st-drive-keep */
    .then(found => { LOOKING = null; return found; });
  return LOOKING;
}
/** A look before `folder`'s place is written, only where it could be on Drive: a path on a letter D to Z that no root
 *  already places under another kind. A OneDrive, Dropbox, mapped or network folder is placed as before, nothing looked at. */
async function driveLookFor(folder) {
  const rules = placeRules();
  if (!rules) return [];
  const f = String(folder || "");
  if (!/^[D-Zd-z]:([\\/]|$)/.test(f)) return [];
  let place = null;
  try { place = rules.placeOf(f, rules.syncRootsFrom(rules.readSyncRecords(null))); } catch (e) { place = null; }
  if (place && place.kind !== "gdrive") return []; /* plant:st-look-skip */
  return driveLook();
}

/* THE TEAM FILE'S REVISION AND CHANNEL AS THE DESK READS THEM (board 900, the relay's step 1): the pinned shell's teamRevOf
 * and teamChannelOf, which src/team.mjs restated until the pin carried them, so a team file Studio writes names a channel
 * and a rev by the very rule the desk heeds it by. A pin without them is refused, naming the declaration. */
const TEAMFILE_DECLS = ["function teamRevOf(", "function teamChannelOf("];
function teamFileRulesFrom(src, where) {
  return rulesFrom(src, TEAMFILE_DECLS, { where, file: "shell/main.js", names: ["teamRevOf", "teamChannelOf"] });
}
let TEAMFILE = null;
/** The team file's rev and channel as the PINNED engine reads them. */
function teamFileRules() {
  if (!TEAMFILE) TEAMFILE = teamFileRulesFrom(shellText(), "the pinned engine");
  return TEAMFILE;
}

/* THE RELAY (board 900, relay slice 1): the channel layer and its blob rules, the same two files the desk's shell runs
 * (shell/relay/), which keep a led team's mirror in step with the relay while Studio runs; and the relay's own message
 * bytes (relay/core.cjs createBytes, devicesBytes, invitesBytes, helloBytes), so a call Studio signs is the one the relay
 * checks. Required as they stand, never sliced: they are whole modules with no shell around them. */
let RELAY = null;
function relayStatusNamesFrom(src) {
  const text = String(src || "");
  const m = /\bconst STATUS\s*=\s*\{([^}]+)\}/.exec(text);
  const set = new Set();
  if (m) {
    for (const match of m[1].matchAll(/"([^"]+)":/g)) set.add(match[1]);
  }
  for (const match of text.matchAll(/error:\s*"([^"]+)"/g)) set.add(match[1]);
  return set;
}
function relayStatusNames() {
  const file = path.join(ROOT, "engine", "pinned", "relay", "team.cjs");
  let src = "";
  try { src = fs.readFileSync(file, "utf8"); } catch { src = ""; }
  return relayStatusNamesFrom(src);
}
/** The relay's channel layer, blob rules and message bytes as the PINNED engine states them. */
function relayRules() {
  if (!RELAY) {
    const ch = at("shell", "relay", "channel.cjs"), blob = at("shell", "relay", "blob.cjs"), core = at("relay", "core.cjs");
    RELAY = { channel: require(ch), blob: require(blob), core: require(core), statusReasons: relayStatusNames() };
  }
  return RELAY;
}

/* THE STATISTICS SPAN AND THE LEAD'S SEAL (board 891). Both are the pinned shell's own functions, cut with the
 * declarations they close over, so Studio signs a span the desk's spanGenuine accepts and opens a stats.estat the
 * desk's sealStatsLead wrote. A pin without one of them is refused, naming the declaration.
 * The counting-period helpers (board 559) are cut with the pin that has them. An older desk's shell still has
 * spanDocument and not those three, so a read of that shell leaves them out rather than refusing the desk. */
const STATS_SPAN_GRAMMAR = ["const SPAN_DAYS_KEPT =", "function ymdReal(", "function spanShape("];
const STATS_SPAN_DECLS = ["const SPKI_ED25519 =", "function canonJson(", "function signedBytesOf(",
  ...STATS_SPAN_GRAMMAR,
  "function spanDocument(", "function spanSignedBytes(", "function spanGenuine("];
function statsSpanDecls(src) {
  const text = String(src || "");
  const grammar = STATS_SPAN_GRAMMAR.filter((m) => text.indexOf(m) >= 0);
  return ["const SPKI_ED25519 =", "function canonJson(", "function signedBytesOf(",
    ...grammar,
    "function spanDocument(", "function spanSignedBytes(", "function spanGenuine("];
}
const STATS_LEAD_DECLS = ["const HPKE_KEM =", "const HPKE_SUITE =", "const SPKI_X25519 =", "function hpkeLabeledExtract(",
  "function hpkeLabeledExpand(", "function hpkeX25519Public(", "function hpkeShared(", "function hpkeSchedule(",
  "function hpkeSeal(", "function hpkeOpen(", "const SEALED_TEAM_RE =", "const STATS_SEAL_KIND =",
  "const STATS_SEAL_LABEL =", "function statsSealInfo(", "function sealStatsLead(", "function openStatsSealed("];
/* The desk signs its answer inside the seal (the test architect's C1 on 891): an answer is counted only where the
 * roster's key for that folder signed it, since the lead's box is public and anyone could seal to it. */
const STATS_ANSWER_DECLS = ["const SPKI_ED25519 =", "function canonJson(", "function signedBytesOf(",
  "function branchIdOf(", "const STATS_ANSWER_PREFIX =", "function statsAnswerSignedBytes(", "function statsAnswerGenuine("];
function statsRulesFrom(src, where) {
  const decls = statsSpanDecls(src);
  const spanNames = ["spanDocument", "spanSignedBytes", "spanGenuine"];
  /* The shell asks spanShape rather than keeping a grammar of its own. An older shell has no such
     function, and naming it there would refuse the read, so it is handed back only when the slice has it. */
  if (decls.indexOf("function spanShape(") >= 0) spanNames.push("spanShape");
  const span = rulesFrom(src, decls, { where, file: "shell/main.js", inject: NODE(),
    names: spanNames });
  const seal = rulesFrom(src, STATS_LEAD_DECLS, { where, file: "shell/main.js", inject: NODE(),
    names: ["sealStatsLead", "openStatsSealed", "STATS_SEAL_KIND"] });
  const answer = rulesFrom(src, STATS_ANSWER_DECLS, { where, file: "shell/main.js", inject: NODE(),
    names: ["statsAnswerSignedBytes", "statsAnswerGenuine"] });
  return Object.assign({}, span, seal, answer);
}
let STATS = null;
/** The span and the lead's statistics seal as the PINNED engine states them. */
function statsRules() {
  if (!STATS) STATS = statsRulesFrom(shellText(), "the pinned engine");
  return STATS;
}

/* A DESK'S ANSWER ABOUT A CATALOG ITS TEAM DOES NOT LIST, SEALED TO THE LEAD'S BOX (board 962, stage 0): the pinned shell's
 * sealAnswerLead and openAnswerLead, cut with the HPKE they close over, so Studio opens the envelope the desk wrote by the
 * function that wrote it, and answerLeadGenuine, the desk's signature inside it (the test architect's criterion: the box is
 * public). A pin without them is refused, naming the declaration. */
const ANSWER_LEAD_DECLS = ["const SPKI_ED25519 =", "function canonJson(", "function signedBytesOf(", "function branchIdOf(",
  "const HPKE_KEM =", "const HPKE_SUITE =", "const SPKI_X25519 =", "function hpkeLabeledExtract(",
  "function hpkeLabeledExpand(", "function hpkeX25519Public(", "function hpkeShared(", "function hpkeSchedule(",
  "function hpkeSeal(", "function hpkeOpen(", "const SEALED_TEAM_RE =", "const ANSWER_LEAD_KIND =",
  "const ANSWER_LEAD_LABEL =", "function answerLeadInfo(", "function sealAnswerLead(", "function openAnswerLead(",
  "const ANSWER_LEAD_PREFIX =", "function answerLeadSignedBytes(", "function answerLeadGenuine("];
function answerLeadRulesFrom(src, where) {
  return rulesFrom(src, ANSWER_LEAD_DECLS, { where, file: "shell/main.js", inject: NODE(),
    names: ["sealAnswerLead", "openAnswerLead", "ANSWER_LEAD_KIND", "answerLeadSignedBytes", "answerLeadGenuine"] });
}
let ANSWER_LEAD = null;
/** The lead's-box answer envelope as the PINNED engine states it. */
function answerLeadRules() {
  if (!ANSWER_LEAD) ANSWER_LEAD = answerLeadRulesFrom(shellText(), "the pinned engine");
  return ANSWER_LEAD;
}

/* A DESK'S WORKING COPY SEALED TO THE LEAD'S BOX (board 962, stage 3): the pinned shell's sealBranchLead and openBranchLead, cut
 * with the HPKE they close over, and branchLeadGenuine, the desk's signed statement inside (team, switch, chain, desk file), so
 * Studio opens and judges the copy by the functions the desk wrote it with. A pin without them is refused, naming the declaration. */
const BRANCH_LEAD_DECLS = ["const SPKI_ED25519 =", "function canonJson(", "function signedBytesOf(", "function branchIdOf(",
  "const HPKE_KEM =", "const HPKE_SUITE =", "const SPKI_X25519 =", "function hpkeLabeledExtract(",
  "function hpkeLabeledExpand(", "function hpkeX25519Public(", "function hpkeShared(", "function hpkeSchedule(",
  "function hpkeSeal(", "function hpkeOpen(", "const BRANCH_LEAD_KIND =", "const BRANCH_LEAD_LABEL =", "function branchLeadInfo(",
  "function sealBranchLead(", "const BRANCH_LEAD_INNER =", "const BRANCH_LEAD_PREFIX =", "function branchLeadSignedBytes(",
  "function branchLeadGenuine(", "function openBranchLead("];
function branchLeadRulesFrom(src, where) {
  return rulesFrom(src, BRANCH_LEAD_DECLS, { where, file: "shell/main.js", inject: NODE(),
    names: ["sealBranchLead", "openBranchLead", "BRANCH_LEAD_KIND", "BRANCH_LEAD_INNER", "branchLeadSignedBytes", "branchLeadGenuine"] });
}
let BRANCH_LEAD = null;
/** The lead's-box working copy as the PINNED engine states it. */
function branchLeadRules() {
  if (!BRANCH_LEAD) BRANCH_LEAD = branchLeadRulesFrom(shellText(), "the pinned engine");
  return BRANCH_LEAD;
}

/* THE SHELL'S DECLARATIONS ARE SHIPPED AS SLICES, NOT AS THE SHELL (board 865). The desk's shell/main.js
 * stays out of the package (electron-builder.js, board 822: it names child_process, and tests/no-model.mjs 7
 * holds the package to the lint's pair alone), yet the rules above run declarations cut from it. So
 * tools/engine-fetch.mjs cuts them at the fetch, by this function and the lists above, into
 * engine/pinned/.shell-slices.js, and every rule reads that file, in the tree as in the package: the
 * window legs then run the path a customer's machine runs, which is how the fault went unseen for three
 * days. Each slice is the pinned shell's own text, byte for byte, cut by the same rule its reader cuts it
 * by; a declaration two rules share is written once. Before the file is accepted, each rule's
 * declarations cut again from it must equal the same cut from the shell, so a marker that a slice's body
 * repeats earlier in the file is refused rather than run. tests/drift.mjs holds the file to the pin's
 * shell, and no-model 9 holds every getter to the package's layout. */
/* The desk's folder checks (folderRules, below). */
const FOLDER_TRUST_DECLS = ["const SPKI_ED25519 =", "function canonJson(", "function signedBytesOf(", "const SEALED_TEAM_RE =",
  "function teamWhole(", "function catalogSigValid(", "const HANDOVER_PREFIX =", "const HANDOVER_KIND =",
  "function handoverSignedBytes(", "function handoverGenuine(", "function handedTo(", "function handedPath(", "function forkIn("];
const SHELL_RULES = [
  { decls: DESK_DECLS }, { decls: COUNT_DECLS, constByLine: true }, { decls: HPKE_DECLS.concat(WRAP_DECLS) },
  { decls: SEAL_DECLS }, { decls: JOIN_DECLS }, { decls: INVITE_DECLS, declsFor: inviteDeclsFor }, { decls: PLACE_DECLS },
  { decls: STATS_SPAN_DECLS }, { decls: STATS_LEAD_DECLS }, { decls: STATS_ANSWER_DECLS },
  { decls: TEAMFILE_DECLS }, { decls: FOLDER_TRUST_DECLS }, { decls: ANSWER_LEAD_DECLS },
  { decls: BRANCH_LEAD_DECLS },
];
const SHELL_SLICES = ".shell-slices.js";
/* THE INSTALLER HOOKS AND SWAP HELPERS STUDIO'S INSTALLER RUNS, cut from the pin's shell/installer.nsh.
 * From engine 071aa623 that file also defines the desk's customInit and customWelcomePage and
 * includes the desk's turning script. Including the file whole would compile those, and Studio's own
 * customInit would then be skipped because the desk's welcome macro is already defined. The cut is
 * the five hooks (with the cache-dir guard between them) plus the staged-upgrade swap macros and
 * board-995 helpers up to the desk's turning block. The desk's turning macros stay in the pinned
 * file, which the package does not ship, and out of the NSIS build. */
const INSTALLER_HOOKS = ".installer-hooks.nsh";
const INSTALLER_HOOK_MACROS = ["customHeader", "customInstall", "customCheckAppRunning", "customRemoveFiles", "customUnInstall"];
function installerHooksFrom(src, pin) {
  const lines = String(src || "").split(/\r?\n/);
  const seen = [];
  const out = [];
  const macroAt = (line) => {
    const m = /^[ \t]*!macro[ \t]+(\S+)/.exec(line);
    return m ? m[1] : "";
  };
  for (let i = 0; i < lines.length; i++) {
    const name = macroAt(lines[i]);
    if (seen.length === INSTALLER_HOOK_MACROS.length && (
      /^#\s*THE TURNING SIDEBAR\b/.test(lines[i])
      || /^[ \t]*!ifndef[ \t]+BUILD_RESOURCES_DIR\b/.test(lines[i])
      || /^[ \t]*!include\b/.test(lines[i])
      || name === "customInit" || name === "customWelcomePage"
    )) break;
    if (name) {
      let end = -1;
      for (let j = i + 1; j < lines.length; j++) {
        if (/^[ \t]*!macroend[ \t]*$/.test(lines[j])) { end = j; break; }
      }
      if (end < 0) throw new Error("shell/installer.nsh has no !macroend for " + name);
      if (seen.length < INSTALLER_HOOK_MACROS.length) {
        seen.push(name);
        if (INSTALLER_HOOK_MACROS.indexOf(name) < 0)
          throw new Error("shell/installer.nsh defines !macro " + name + " before its five hooks are complete");
      }
      out.push(lines.slice(i, end + 1).join("\n"));
      i = end;
      continue;
    }
    if (/MUI_CUSTOMFUNCTION_(?:UN)?GUIINIT/.test(lines[i])) continue;
    if (/^[ \t]*!ifdef BUILD_UNINSTALLER[ \t]*$/.test(lines[i])) {
      let depth = 1;
      i++;
      while (i < lines.length && depth) {
        if (/^[ \t]*!if(?:def|ndef)?\b/.test(lines[i])) depth++;
        else if (/^[ \t]*!endif[ \t]*$/.test(lines[i])) depth--;
        i++;
      }
      i--;
      continue;
    }
    out.push(lines[i]);
  }
  const missing = INSTALLER_HOOK_MACROS.filter(h => seen.indexOf(h) < 0);
  if (missing.length)
    throw new Error("shell/installer.nsh has no !macro " + missing[0] + "; the hooks have moved");
  const body = out.join("\n").replace(/^\n+/, "").replace(/\n{3,}/g, "\n\n");
  const text = "# Cut from the engine's shell/installer.nsh at " + String(pin || "an unnamed pin")
    + " by Studio's tools/engine-fetch.mjs. The hooks and swap helpers only: the desk's customInit and welcome stay out.\n"
    + body + "\n";
  if (/!macro[ \t]+customInit\b/.test(text) || /!include\b/.test(text) || /customWelcomePage/.test(text))
    throw new Error("the installer hooks cut still carries the desk's turning");
  if (text.indexOf("UPDATER_CACHE_DIR") < 0)
    throw new Error("the installer hooks cut lost the updater cache guard");
  return text;
}
function shellSlicesFrom(src, pin) {
  const where = "the pinned engine " + String(pin || "").slice(0, 7);
  /* A rule whose list depends on the pin (declsFor) is asked of the text it is cut from, so the file and the shell cut alike. */
  const declsOf = (r, text) => (r.declsFor ? r.declsFor(text) : r.decls);
  const cut = (text, r) => slicesOf(text, declsOf(r, text), where, "shell/main.js", r.constByLine);
  const kept = new Map();
  for (const r of SHELL_RULES) cut(src, r).forEach((s, i) => { const d = declsOf(r, src)[i]; if (!kept.has(d)) kept.set(d, s); });
  const text = "/* Cut from the engine's shell/main.js at " + String(pin || "an unnamed pin") + " by Studio's"
    + " tools/engine-fetch.mjs, for src/engine.mjs; never edited (board 865). */\n"
    + [...kept.values()].join("\n") + "\n";
  for (const r of SHELL_RULES)
    if (cut(text, r).join("\n") !== cut(src, r).join("\n"))
      throw new Error(where + ": the shell's declarations " + JSON.stringify(r.decls[0]) + " and on do not cut"
        + " the same from " + SHELL_SLICES + " as from shell/main.js; a marker repeats inside another slice");
  return text;
}
function shellText() {
  return fs.readFileSync(at(".shell-slices.js"), "utf8");
}

/* THE CARD AND HEADER KEYS THE ENGINE NAMES, read off its declarations. A key a card carries and the
 * engine does not name (`src`, or a field a newer build adds) is carried whole and is no word. */
function namedFields() {
  const src = fs.readFileSync(at("src", "modules", "catalog-v2.js"), "utf8");
  const list = (name) => {
    const m = new RegExp("const " + name + "=(\\[[^\\]]*\\]);").exec(src);
    if (!m) throw new Error("the pinned engine has no const " + name + "= in src/modules/catalog-v2.js;"
      + " the named fields have moved and this read must follow them rather than guess");
    return JSON.parse(m[1].replace(/\s+/g, " "));
  };
  return { card: list("V2_CARD_NAMED"), head: list("V2_HEAD_NAMED") };
}

/* THIS STUDIO'S OWN ENGINE, read from the pin the way the named fields are. A proposal whose
 * minEngine is above it is one this Studio cannot fully read, and the comparison is this
 * string, not a second copy of the version typed in src/. */
function engineVersion() {
  const src = fs.readFileSync(at("src", "modules", "env.js"), "utf8");
  const m = /const E_VERSION="([^"]*)"/.exec(src);
  if (!m) throw new Error("the pinned engine has no const E_VERSION= in src/modules/env.js");
  return m[1];
}

/* WHAT A WORD IS, SLICED, because Studio asks a question about words and the engine already
 * has the answer. `splitWords` in src/modules/words.js folds the diacritics a Polish agent does
 * not type at chat speed and then splits on everything that is neither a letter nor a digit,
 * and that pair of rules is what the engine's own search calls a word. A second definition here
 * would let Studio tell an author a bag word is missing from a card whose text the engine would
 * have matched it against, which is exactly the kind of quiet disagreement the pin exists to
 * prevent.
 *
 * SLICED RATHER THAN IMPORTED, AND THE REASON IS NOT THE DOM THIS TIME: engine/pinned carries no
 * package.json of its own, so every .js under it is read against THIS tree's "type": "commonjs"
 * and an ES module there cannot be imported at all ("Unexpected token 'export'", measured
 * 2026-09-20). Only the .mjs under tools/catalog-v2 import. FOLD and FOLD_RE come with the two
 * functions because splitWords closes over them.
 */
function wordRules() {
  return rulesFrom(fs.readFileSync(at("src", "modules", "words.js"), "utf8"),
    ["const FOLD=", "const FOLD_RE=", "function foldDiacritics(", "function splitWords("],
    { where: "the pinned engine", file: "src/modules/words.js", from: "src/modules/words.js",
      names: ["foldDiacritics", "splitWords"] });
}

/* THE RULE A CATALOG'S FILE IS NAMED BY, the engine's, sliced as the word rule is: a project's
 * name is its folder's, so a name typed here becomes a folder by the rule the desk's Export names
 * a file by, and the two cannot disagree about what a name may hold. */
function fileStem() {
  return rulesFrom(fs.readFileSync(at("src", "modules", "catalog-file.js"), "utf8"), ["function catalogFileStem("],
    { where: "the pinned engine", file: "src/modules/catalog-file.js", names: ["catalogFileStem"] }).catalogFileStem;
}

/* THE DRESS A DESK GIVES A CATEGORY, SLICED: the hue slot it deals and the drawing it wears, by the engine's
 * own order of authority (src/modules/cat-identity.js catSlot and catIconKey): what the catalog declares, then
 * the category's place among the shelves for the hue, its primary name read against the hints for the drawing,
 * and the musical pool by hash. A person's own pick on a desk is that desk's and is not Studio's to know. */
function catLooks() {
  const icons = rulesFrom(fs.readFileSync(at("src", "modules", "icons.js"), "utf8"),
    ["const _STAR=", "const CAT_IC_NUDGE=", "function catIconInner(", "const CAT_ICONS=", "const E_HUE_CYCLE=",
      "const CAT_ICON_MUSIC=", "const CAT_ICON_HINTS=", "const CAT_ICON_KEYS=", "const E_HUE_NAMES="],
    { where: "the pinned engine", file: "src/modules/icons.js",
      names: ["catIconInner", "CAT_ICONS", "E_HUE_CYCLE", "CAT_ICON_MUSIC", "CAT_ICON_HINTS", "CAT_ICON_KEYS", "E_HUE_NAMES"] });
  const { catHash } = rulesFrom(fs.readFileSync(at("src", "modules", "cat-identity.js"), "utf8"),
    ["function catHash("], { where: "the pinned engine", file: "src/modules/cat-identity.js", names: ["catHash"] });
  const cycle = icons.E_HUE_CYCLE;
  /** One shelf's dress: `hue` a slot the engine deals, `icon` the drawing's inner markup. */
  function lookOf(tag, at, name) {
    const id = String(tag.id || "");
    const declared = parseInt(tag.hue, 10);
    const hue = Number.isFinite(declared) && cycle.indexOf(declared) >= 0 ? declared
      : cycle[(at > -1 ? at : catHash(id)) % cycle.length];
    let key = typeof tag.icon === "string" && icons.CAT_ICONS[tag.icon] ? tag.icon : "";
    for (let i = 0; !key && i < icons.CAT_ICON_HINTS.length; i++)
      if (icons.CAT_ICON_HINTS[i][0].test(String(name || id))) key = icons.CAT_ICON_HINTS[i][1];
    if (!key) key = icons.CAT_ICON_MUSIC[catHash(id) % icons.CAT_ICON_MUSIC.length];
    return { hue, icon: icons.catIconInner(key) };
  }
  /* WHAT A CATEGORY'S EDITOR OFFERS (board 1018, piece A), as the desk's offers it (editors.js iconGridKeys and colGrid):
     the drawings by key, a retired one left out, and the hue slots in the cycle's deal order with the engine's own name for
     each. A key or a slot outside these is refused by src/studio.mjs saveTag, unless the category already wears it. */
  const offered = {
    icons: icons.CAT_ICON_KEYS.slice(),
    hues: cycle.map((n) => ({ slot: n, name: icons.E_HUE_NAMES[n] || String(n) })),
  };
  return { lookOf, offered, from: "src/modules/icons.js" };
}

/* THE FORMS A CARD'S OWN ADDRESS MAY TAKE (board 1018, piece B), by grammar language, as the desk's card editor offers them
 * (card-fields.js PAX_ADDRESS_FORMS): the team's choices in the pinned variables.js, sliced, bar the first name, which a card
 * writes as no form at all. */
function addressForms() {
  const v = rulesFrom(fs.readFileSync(at("src", "modules", "variables.js"), "utf8"),
    ["const VAR_ADDRESS_PL=", "const VAR_ADDRESS_EN="],
    { where: "the pinned engine", file: "src/modules/variables.js", names: ["VAR_ADDRESS_PL", "VAR_ADDRESS_EN"] });
  return { en: v.VAR_ADDRESS_EN.filter((k) => k !== "first"), pl: v.VAR_ADDRESS_PL.filter((k) => k !== "first") };
}

/** The pin this tree was fetched at, for a release notes file that has to say what it was
 *  built against. The manifest is written by tools/engine-fetch.mjs. */
function pin() {
  const p = at(".engine-pin.json");
  const m = JSON.parse(fs.readFileSync(p, "utf8"));
  return { commit: m.pin || m.commit || "", files: (m.files || []).length };
}

/* THE DESK'S GROUP POLICY TEMPLATE, as the pin carries it (sense pass finding 17): the ADMX and an ADML for each language
 * folder beside it, named by the fetch's own manifest rather than by a listing, so the packaged app reads its asar the
 * way it reads every other pinned file. Text, read and never changed here; src/studio.mjs savePolicy fills a copy. */
function policyTemplate() {
  const m = JSON.parse(fs.readFileSync(at(".engine-pin.json"), "utf8"));
  const held = (m.files || []).map((f) => String(f[0])).filter((f) => f.startsWith("shell/policy/"));
  const adml = {};
  held.forEach((f) => {
    const lang = /^shell\/policy\/([A-Za-z]{2,3}-[A-Za-z]{2,4})\/etiuda\.adml$/.exec(f);
    if (lang) adml[lang[1]] = fs.readFileSync(at(...f.split("/")), "utf8");
  });
  if (held.indexOf("shell/policy/etiuda.admx") < 0 || !Object.keys(adml).length)
    throw new Error("the pinned engine carries no Group Policy template (shell/policy); " + FETCH);
  return { admx: fs.readFileSync(at("shell", "policy", "etiuda.admx"), "utf8"), adml };
}

/** The pinned engine's sample catalog file, read-only; opened through the catalog-file upgrade. */
function sampleCatalog() {
  return at("shell", "sample-catalog.ec");
}

/* Marker-aware body text, sliced from the pin so a flattener does not retype the marker rule.
 * catalog-v2.js is a .js ESM file inside a CommonJS package, so it cannot be imported; the
 * export line is dropped and the rest is evaluated, the same substitution tests/search-lab.mjs
 * already uses for catalogFromV2. */
function v2BodyTools() {
  const p = at("src", "modules", "catalog-v2.js");
  const src = fs.readFileSync(p, "utf8");
  if (src.indexOf("function v2Unmark(") < 0)
    throw new Error("the pinned engine has no function v2Unmark( in src/modules/catalog-v2.js;"
      + " the body-marker rule has moved and this slice must follow it rather than guess");
  const body = src.replace(/\nexport \{[\s\S]*$/, "\n");
  return new Function(body + "\nreturn { v2Unmark, v2PartText, V2_MARKER_RE };")();
}

/* THE CHECKS THE DESK JUDGES A TEAM'S FILES WITH (board 945 stage 3 (b)), the desk's own, cut from its shell/main.js with node's
 * crypto as the desk file's rule is: a team file whole under its lead (teamWhole), a catalog's signature under one key
 * (catalogSigValid, asked with the key), a lead handed on one genuine step at a time (handedTo, handedPath) and a lead key
 * shown in two hands (forkIn). So a team file Studio follows is one a desk follows, by the same lines (src/member.mjs). The folder
 * syncer that these once served went out of the engine with the shared folder and Studio runs none: nothing of the engine's
 * folder directory is fetched, required or shipped. */
function folderRulesFrom(src, where) {
  return rulesFrom(src, FOLDER_TRUST_DECLS, { where, file: "shell/main.js", inject: NODE(),
    names: ["teamWhole", "catalogSigValid", "handedTo", "handedPath", "forkIn"] });
}
let FOLDER = null;
/** The desk's folder checks as the PINNED engine states them. */
function folderRules() {
  if (!FOLDER) FOLDER = folderRulesFrom(shellText(), "the pinned engine");
  return FOLDER; /* plant:fsg-syncer */
}

/* THE BODY'S MARKERS AS THE PINNED ENGINE WRITES THEM (the Replies block, the Studio batch of 2026-10-12): v2Mark and the
   marker's one shape, sliced from catalog-v2.js as the signature's rules are, so Studio never writes a marker of its own. */
const BODY_DECLS = ["function v2Str(", "const V2_MARKER_RE=", "function v2Mark("];
function bodyRules() {
  return rulesFrom(fs.readFileSync(at("src", "modules", "catalog-v2.js"), "utf8"), BODY_DECLS,
    { where: "the pinned engine", file: "src/modules/catalog-v2.js", names: ["v2Mark", "V2_MARKER_RE"] });
}

/* CARD FLAGS, AS THE PINNED ENGINE HASHES THEM (card-flag.js): seen over the card's words in one language, and f over r. */
const FLAG_DECLS = ["const SHA_K=", "function flagSha256(", "function flagWordsHash(", "function flagDigest("];
let FLAG = null;
function flagRules() {
  if (!FLAG) {
    const sig = sigRules(), body = bodyRules(), tools = v2BodyTools();
    const fns = rulesFrom(fs.readFileSync(at("src", "modules", "card-flag.js"), "utf8"), FLAG_DECLS, {
      where: "the pinned engine", file: "src/modules/card-flag.js",
      inject: {
        v2Canonical: sig.v2Canonical,
        v2Mark: body.v2Mark,
        cardFieldKey: (f) => ({ t: "t", body: "body", note: "note" }[f] || ""),
      },
      names: ["flagWordsHash", "flagDigest"],
    });
    FLAG = { flagWordsHash: fns.flagWordsHash, flagDigest: fns.flagDigest, v2Unmark: tools.v2Unmark, from: fns.from };
  }
  return FLAG;
}

export { format, lint, converter, readCatalogV1, cardTokens, builtInLangs, langSupport, bodyRules, flagRules,
  langSupportFrom, langEndonyms,
         editionRules, sigRules, sigRulesFrom, ringRules, ringRulesFrom, wordRules, fileStem,
         deskRules, deskRulesFrom, countRules, shellSlicesFrom, SHELL_SLICES, installerHooksFrom, INSTALLER_HOOKS, teamRules, hpkeRules, hpkeRulesFrom, sealRules, sealRulesFrom, joinRules, joinRulesFrom, inviteRules, inviteRulesFrom, statsRules, statsRulesFrom, answerLeadRules, answerLeadRulesFrom, branchLeadRules, branchLeadRulesFrom, namedFields, engineVersion,
         teamFileRules, teamFileRulesFrom, relayRules, relayStatusNames, relayStatusNamesFrom, placeRules, placeRulesFrom, driveLook, driveLookFor, folderRules, folderRulesFrom,
         pin, policyTemplate, sampleCatalog, PINNED, ROOT, v2BodyTools, catLooks, addressForms };
