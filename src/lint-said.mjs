/* THE LINT'S SENTENCES AS FRAMES, SO A POLISH SCREEN CAN SAY THEM (polish 04, item 9). A line is
 * said as the first frame that rebuilds it exactly through say(), the pattern being made from the
 * frame; a line none rebuilds is shown as written, which is what a pin's new wording looks like,
 * and tests/lint-jump.mjs holds its fixtures' findings to a frame. `names` are the values a frame
 * carries: other braces in it, {INTENT} or {WHO}, are the engine's own words. */
import { say } from "./refusal.mjs";

const FRAMES = [
  ["card {ID}: no title in {LANG}, the primary language", ["ID", "LANG"]],
  ["card {ID}: no body in {LANG}, the primary language", ["ID", "LANG"]],
  ["card {ID}: shelf absent", ["ID"]],
  ["card {ID}: shelf {SHELF} names no tag", ["ID", "SHELF"]],
  ["card {ID}: shelf {SHELF} is a {KIND}", ["ID", "SHELF", "KIND"]],
  ["card {ID}: requests names {TAG}, which is no tag", ["ID", "TAG"]],
  ["card {ID}: requests names {TAG}, a {KIND}", ["ID", "TAG", "KIND"]],
  ["card {ID}: the id is claimed twice", ["ID"]],
  ["card {ID}: bodyShape absent", ["ID"]],
  ["card {ID}: bodyShape \"{SHAPE}\" is not plain, steps or alts", ["ID", "SHAPE"]],
  ["card {ID} ({LANG}): {LINE} is a line in brackets that is not a marker", ["ID", "LANG", "LINE"]],
  ["card {ID} ({LANG}): {LINE} labels a step, and only an alternative takes a label",
    ["ID", "LANG", "LINE"]],
  ["card {ID} ({LANG}): bodyShape is plain and the body carries {N} marker(s)",
    ["ID", "LANG", "N"]],
  ["card {ID} ({LANG}): bodyShape is {SHAPE} and the body does not open with a marker",
    ["ID", "LANG", "SHAPE"]],
  ["card {ID} ({LANG}): bodyShape is {SHAPE} and the body opens with {FIRST}",
    ["ID", "LANG", "SHAPE", "FIRST"]],
  ["card {ID} ({LANG}): {N} block(s) against {M} in {PRIMARY}",
    ["ID", "LANG", "N", "M", "PRIMARY"]],
  ["card {ID} ({LANG}): {TOKEN} is not a variable the desk fills; the desk fills {NEAR}",
    ["ID", "LANG", "TOKEN", "NEAR"]],
  ["card {ID} ({LANG}): {TOKEN} is not a variable the desk fills, so the customer would read it"
    + " as written", ["ID", "LANG", "TOKEN"]],
  ["tag {ID}: the id is claimed twice", ["ID"]],
  ["tag {ID}: no clause in {LANG}, the primary language", ["ID", "LANG"]],
  ["intent {N} (\"{CLAUSE}\") has no {CODE} clause - invisible in {MODE} mode",
    ["N", "CLAUSE", "CODE", "MODE"]],
  ["intent {N} points at unknown category \"{KEY}\"", ["N", "KEY"]],
  ["intents.{K} length {A} != intents.{PRIMARY} length {N} (engine pads, but alignment is"
    + " positional - check for a slipped row)", ["K", "A", "PRIMARY", "N"]],
  ["\"fav\" is a reserved category key (virtual Favourites)", []],
  ["roles.always names a category that does not exist: \"{K}\"", ["K"]],
  ["roles.opener names a category that does not exist: \"{K}\"", ["K"]],
  ["{NAME} names a category that does not exist: \"{K}\"", ["NAME", "K"]],
  ["{NAME}[\"{K}\"] is empty - drop the key instead", ["NAME", "K"]],
  ["{MAP} covers {HAVE} of {ALL} categories; the rest fall back to {CODE}: {KEYS}",
    ["MAP", "HAVE", "ALL", "CODE", "KEYS"]],
  ["who: duplicate entry \"{ENTRY}\"", ["ENTRY"]],
  ["{WHO} token in {N} place(s) - the engine no longer resolves it, rename to {ROLE}: {LIST}",
    ["N", "LIST"]],
  ["no categories declared", []],
  ["no cards", []],
  ["facts: {N} line(s) over 100 chars - the panel is white-space:pre and will scroll sideways",
    ["N"]],
  ["title ({KEY}) is required", ["KEY"]],
  ["{LANG} ({KEY}) is required", ["LANG", "KEY"]],
  ["unknown category \"{C}\"", ["C"]],
  ["intent link {X} is out of range (0..{MAX})", ["X", "MAX"]],
  ["intent link \"{X}\" is not numeric - fine locally, fragile in a distributed file", ["X"]],
  ["intent link {X} is out of range", ["X"]],
  ["seq without alt does nothing (blocks only split when alt is set)", []],
  ["{BASE} {PRIMARY} blocks vs {N} {LANG} blocks - copies at the same index will diverge",
    ["BASE", "PRIMARY", "N", "LANG"]],
  /* The engine's lines for the one format revision (board 834): sixteen sentences for the six fields. `{STATE}`
     is the reader's own word, absent or malformed; it is not named WHAT, which would make a head frame. */
  ["card {ID}: {FLAG} is {VALUE}, wanted true or absent", ["ID", "FLAG", "VALUE"]],
  ["card {ID}: next is not a list", ["ID"]],
  ["card {ID}: next[{I}] is not an entry with a to", ["ID", "I"]],
  ["card {ID}: next[{I}] names the card itself", ["ID", "I"]],
  ["card {ID}: next[{I}] names {TO}, which is no card", ["ID", "I", "TO"]],
  ["card {ID}: next[{I}] names {TO} a second time", ["ID", "I", "TO"]],
  ["notes: not a table of text by language", []],
  ["notes.{CODE}: a language this catalog does not declare", ["CODE"]],
  ["notes.{CODE}: not text", ["CODE"]],
  ["{FIELD}: not an entry", ["FIELD"]],
  ["grew.id: {STATE}, wanted the id of the catalog it grew from", ["STATE"]],
  ["grew.rev: {STATE}, wanted the rev it grew from", ["STATE"]],
  ["grew.sha: {STATE}, wanted sha256: and 64 lower-case hex characters", ["STATE"]],
  ["desk.id: {STATE}, wanted k- and 16 lower-case hex characters", ["STATE"]],
  ["desk.name: not text", []],
  ["desk.{PART}: {STATE}, wanted 64 lower-case hex characters", ["PART", "STATE"]],
  /* The tails of the lines that name a card by its place, after "card N (title): ". */
  ["same title as card {N} in this category, so at the desk the two are hard to tell apart; one"
    + " needs a title of its own, or the two can become one card", ["N"]],
  ["Polish body puts a bare \"{WORDS}\" in front of {INTENT}. The clause is in the instrumental,"
    + " so the preposition is the {Z} token, which alternates z and ze by what follows it",
    ["WORDS"]],
  /* Waiting for the pin move past the desk's Words half (row 817); Claude alpha's ruling of 2026-11-08. */
  ["{TOKEN} in the {CODE} body is not a token the desk fills, so it is copied as written",
    ["TOKEN", "CODE"]],
  ["reply {N} is empty in {CODE}, so the desks skip it and every later reply moves up a place", ["N", "CODE"]],
  /* The catalog's variables (board 845): an inline form short of its rules, {GENDER} with no nonbinary word, a card
     overriding {PAX} under a team's address. The braced names in the second and third are the engine's own words. */
  ["This card gives {VAR} fewer words than it has rules; the rest write the first.", ["VAR"]],
  ["This card gives {GENDER} no words for nonbinary, so for a nonbinary customer the desk leaves that place to the agent.", []],
  ["This card sets {PAX} by hand, apart from the catalog's address.", []],
  /* The head a place-named line is said under, around its tail. */
  ["card {N} (\"{TITLE}\"): {WHAT}", ["N", "TITLE", "WHAT"]],
  ["card {N}: {WHAT}", ["N", "WHAT"]],
];

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const MATCHERS = FRAMES.map(([frame, names]) => {
  const order = [];
  const src = frame.split(/(\{[A-Z]+\})/).map((bit) => {
    const m = /^\{([A-Z]+)\}$/.exec(bit);
    if (m && names.indexOf(m[1]) >= 0) { order.push(m[1]); return "([^]+?)"; }
    return esc(bit);
  }).join("");
  return { frame, order, re: new RegExp("^" + src + "$") };
});

/** The frame a line is, with its values, or null where no frame rebuilds it exactly. A line
 *  naming a card by its place is its head around its tail, the tail a frame of its own. */
function lintSaid(line, inner) {
  const s = String(line == null ? "" : line);
  for (const m of MATCHERS) {
    const head = m.order.indexOf("WHAT") >= 0;
    if (head === !!inner) continue;
    const got = m.re.exec(s);
    if (!got) continue;
    const vars = {};
    m.order.forEach((k, i) => { vars[k] = got[i + 1]; });
    if (head && !/^\d+$/.test(vars.N)) continue;
    if (head) { vars.WHAT = lintSaid(vars.WHAT); if (!vars.WHAT) continue; }
    if (say(m.frame, vars) === s) return { frame: m.frame, vars };
  }
  return inner ? null : lintSaid(s, true);
}

function lintLang(code) {
  const c = String(code || "").toLowerCase();
  if (c === "en") return { frame: "English" };
  if (c === "pl") return { frame: "Polish" };
  return String(code || "").toUpperCase();
}

function catMapLabel(name) {
  const s = String(name || "");
  const code = s === "categoriesPl" ? "pl" : s.startsWith("categories:") ? s.slice(11) : "";
  return code ? { frame: "the {LANG} category names", vars: { LANG: lintLang(code) } } : s;
}

const IMPORT_REWRITE = {
  "\"fav\" is a reserved category key (virtual Favourites)": () => ({
    frame: '"fav" is a key kept for Favourites, so it cannot name a category', vars: {},
  }),
  "{NAME} names a category that does not exist: \"{K}\"": (v) => ({
    frame: '{NAME} names a category that does not exist: "{K}"',
    vars: { NAME: catMapLabel(v.NAME), K: v.K },
  }),
  "{NAME}[\"{K}\"] is empty - drop the key instead": (v) => ({
    frame: '{NAME} gives the category "{K}" no text: remove that key instead',
    vars: { NAME: catMapLabel(v.NAME), K: v.K },
  }),
  "roles.always names a category that does not exist: \"{K}\"": (v) => ({
    frame: 'the categories always shown name one that does not exist: "{K}"', vars: v,
  }),
  "roles.opener names a category that does not exist: \"{K}\"": (v) => ({
    frame: 'the opening category names one that does not exist: "{K}"', vars: v,
  }),
  "title ({KEY}) is required": (v) => ({
    frame: "the title ({KEY}) is required", vars: v,
  }),
  "{LANG} ({KEY}) is required": (v) => ({
    frame: "the {LANG} text ({KEY}) is required",
    vars: { LANG: lintLang(v.LANG), KEY: v.KEY },
  }),
  "unknown category \"{C}\"": (v) => ({
    frame: 'unknown category: "{C}"', vars: v,
  }),
  "intent link {X} is out of range (0..{MAX})": (v) => ({
    frame: "the intent link {X} is out of range: the intents run from 0 to {MAX}", vars: v,
  }),
  "intent link \"{X}\" is not numeric - fine locally, fragile in a distributed file": (v) => ({
    frame: 'the intent link "{X}" is not a number. It works on this computer but can break in a'
      + " file passed to others", vars: v,
  }),
  "intent link {X} is out of range": (v) => ({
    frame: "the intent link {X} is out of range", vars: v,
  }),
  "seq without alt does nothing (blocks only split when alt is set)": () => ({
    frame: "Steps without Alternatives do nothing: the blocks split only when the card has"
      + " Alternatives", vars: {},
  }),
  "{BASE} {PRIMARY} blocks vs {N} {LANG} blocks - copies at the same index will diverge": (v) => ({
    frame: "the {PRIMARY} text has blocks: {BASE}, and the {LANG} text: {N}. Copies at the"
      + " same place will not match",
    vars: { PRIMARY: lintLang(v.PRIMARY), BASE: v.BASE, LANG: lintLang(v.LANG), N: v.N },
  }),
  "who: duplicate entry \"{ENTRY}\"": (v) => ({
    frame: 'the team list has the same entry twice: "{W}"', vars: { W: v.ENTRY },
  }),
  "intents.{K} length {A} != intents.{PRIMARY} length {N} (engine pads, but alignment is positional - check for a slipped row)": (v) => ({
    frame: "the intents' fields {K} and {PRIMARY} hold different numbers of entries ({A} against"
      + " {N}). Entries are matched by place, so a slipped row pairs the wrong ones",
    vars: v,
  }),
};

function toImportFrame(said) {
  if (!said) return null;
  if (said.vars && said.vars.WHAT) {
    return { frame: said.frame, vars: { ...said.vars, WHAT: toImportFrame(said.vars.WHAT) } };
  }
  const map = IMPORT_REWRITE[said.frame];
  return map ? map(said.vars || {}) : said;
}

/** Frame an engine lint line for the import cover, applying the cover's wording rewrites while
 *  preserving lintSaid()'s verbatim reconstruction contract for other callers. */
function importLintSaid(line) {
  const said = lintSaid(line);
  if (!said) return null; /* plant:frames-unframed */
  return toImportFrame(said);
}

export { FRAMES as LINT_FRAMES, lintSaid, importLintSaid };
