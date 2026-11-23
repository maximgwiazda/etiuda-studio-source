/* The six new verbs are wired end to end and their words are in the table (board 834, step 6): node tests/card-life-wiring.mjs.
 * Read out of the source: studio.mjs export, main.js channel, preload bridge, page call, act table, ui/lang.js pair. Words
 * still pending the copywriter are counted and printed, never failed on. */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as S from "../src/studio.mjs";
import { loadPage } from "./page-stand-in.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const EXPECTED = 7;
const PENDING = "[PL pending] ";

let asserted = 0, failed = 0;
function check(cond, line) {
  asserted++;
  if (cond) process.stdout.write("  ok   " + line + "\n");
  else { failed++; process.stderr.write("  FAIL " + line + "\n"); }
}
const read = (...p) => fs.readFileSync(path.join(ROOT, ...p), "utf8");
const count = (text, needle) => text.split(needle).length - 1;

const main = read("shell", "main.js"), preload = read("shell", "preload.js"), app = read("ui", "app.js");
const lang = read("ui", "lang.js"), studio = read("src", "studio.mjs");

/* verb in src/studio.mjs, channel, name on the preload's bridge */
const WIRES = [
  ["retireCard", "studio:card-retire", "retireCard"],
  ["restoreCard", "studio:card-restore", "restoreCard"],
  ["undoDelete", "studio:card-undo", "undoDelete"],
  ["cardHistory", "studio:card-history", "cardHistory"],
  ["restoreText", "studio:card-restore-text", "restoreText"],
  ["diffCardEditions", "studio:card-diff", "diffCardEditions"],
  /* and a whole edition back into the draft, from the Archive (the outside review of 2026-10-21, item 1) */
  ["restoreEdition", "studio:edition-restore", "restoreEdition"],
];

/* the English keys this build asks T() for in ui/app.js, and the refusal frames it raises in
   src/studio.mjs; every one needs a pair in ui/lang.js */
const PAGE_WORDS = ["Active {N}", "Retired {N}", "All {N}", "retired", "Retire", "Restore",
  "Retired in edition {E}. The desks keep it out of sight, together with its stars, own edits and counts, until it is restored.",
  "Retired in this draft. Once the draft is published, the desks keep it out of sight, together with its stars, own edits and counts, until it is restored.",
  "History", "From the published editions in the archive, as far back as the first.",
  "added", "title", "text", "restored", "details", "“{NOTE}”", "Compare", "Restore this text",
  "Deleted the card “{TITLE}”.", "Card history: {TITLE}", "Pick any two revs to compare them in the Archive's table.",
  "Restore the text of rev {N}",
  "It comes back as a new change in the draft. Nothing in the archive changes.",
  "Restore to the draft…", "Restore rev {R} ({EDITION}) to the draft?", "Restore edition {EDITION} to the draft?",
  "The draft's cards, languages and other content become this edition's. The catalog's id, rev, date and the lead's note stay as they are, and so does a category rename not yet published.",
  "The next Publish sends it out as a new edition, rev {N}.",
  "Nothing in the archive changes, and every edition already published stays as it is.",
  "The restore can be undone from Changes, even after a later edit: the draft comes back as it was just before the restore, its unpublished changes included.",
  "Restore to the draft", "Restored rev {R} ({EDITION}) to the draft.", "Restored edition {EDITION} to the draft.",
  "The draft already holds this edition's content."];
const REFUSALS = ["Studio no longer remembers the deleted card, so the deletion cannot be undone",
  "the catalog has changed since the card was deleted, so the deletion can no longer be undone",
  "edition {E} holds no card {ID}, so there is no text in it to restore"];
const ACTS_NEW = ["card-view", "card-retire", "card-restore", "card-undo", "hist-compare", "hist-restore",
  "hist-pick", "hist-back", "arch-restore", "arch-restore-go"];

/** The Polish of an English key as ui/lang.js writes it, or null. The key is found as a JSON string
 *  followed by a colon, which is how every pair in the table is written. */
function plOf(key) {
  const k = JSON.stringify(key);
  const at = lang.indexOf(k + ":");
  if (at < 0) return null;
  const rest = lang.slice(at + k.length + 1).replace(/^\s+/, "");
  const m = /^"((?:[^"\\]|\\.)*)"/.exec(rest);
  return m ? JSON.parse('"' + m[1] + '"') : null;
}

const wireFaults = [];
for (const [verb, channel, api] of WIRES) {
  const handler = new RegExp("answer\\(" + JSON.stringify(channel) + "[^]*?thread\\.call\\(" + JSON.stringify(verb) + "[,)]").test(main);
  const once = count(main, "answer(" + JSON.stringify(channel)) === 1 && count(preload, JSON.stringify(channel)) === 1;
  const offered = new RegExp(api + ":\\s*\\([^)]*\\)\\s*=>\\s*ipcRenderer\\.invoke\\(" + JSON.stringify(channel)).test(preload);
  const used = app.indexOf("API." + api + "(") >= 0 || app.indexOf("API." + api + ")") >= 0;
  if (typeof S[verb] !== "function" || !handler || !once || !offered || !used)
    wireFaults.push({ verb, exported: typeof S[verb], handler, once, offered, used });
}
check(wireFaults.length === 0,
  "cw1 each of the " + WIRES.length + " new verbs is exported by src/studio.mjs, answered on one channel by shell/main.js"
  + " through the worker, offered by the preload on that channel, and called by the page: " + JSON.stringify(wireFaults));

const page = loadPage({ api: {}, uiLang: "en" }).page;
/* an act is written either as a literal attribute or through seg(), the chrome's segmented control */
const writtenActs = ACTS_NEW.filter(a => app.indexOf('data-act="' + a + '"') >= 0 || app.indexOf('seg("' + a + '"') >= 0);
check(ACTS_NEW.every(a => typeof page.ACTS[a] === "function") && writtenActs.length === ACTS_NEW.length,
  "cw2 each of the " + ACTS_NEW.length + " acts the new markup writes is a function in the page's act table, and each is"
  + " written into markup by something: " + writtenActs.length + " written");

/* a key is asked for when T( is followed by it: all of a short one, the first 30 characters of a long one split over lines */
const asked = (w) => app.indexOf("T(" + (w.length <= 30 ? JSON.stringify(w) : JSON.stringify(w.slice(0, 30)).slice(0, -1))) >= 0;
const unwritten = PAGE_WORDS.filter(w => !asked(w));
check(unwritten.length === 0,
  "cw3 every one of the " + PAGE_WORDS.length + " words this build lists is one ui/app.js really asks T() for"
  + " (a stale list is as bad as a missing pair): " + JSON.stringify(unwritten));

const frames = REFUSALS.filter(f => studio.indexOf(f.slice(0, 40)) < 0);
check(frames.length === 0,
  "cw4 every one of the " + REFUSALS.length + " refusal frames listed is one src/studio.mjs really raises: "
  + JSON.stringify(frames));

const all = PAGE_WORDS.concat(REFUSALS);
const braces = (s) => (String(s).match(/\{\w+\}/g) || []).slice().sort().join(" ");
const bad = all.filter(k => { const pl = plOf(k); return pl === null || pl === k || braces(pl) !== braces(k); });
check(bad.length === 0,
  "cw5 each of the " + all.length + " words and frames has a Polish value in ui/lang.js that is not its English and"
  + " carries exactly its braces: " + JSON.stringify(bad));

const pending = all.filter(k => (plOf(k) || "").indexOf(PENDING) === 0);
process.stdout.write("#pending " + pending.length + " of " + all.length + " words and frames wait for the copywriter: "
  + JSON.stringify(pending.map(k => k.slice(0, 48))) + "\n");
check(pending.every(k => plOf(k) === PENDING + k),
  "cw6 a pending value is the marker and the English and nothing else, so no Polish is invented here");

const flagFalse = [["src/studio.mjs", studio], ["ui/app.js", app]].filter(([, t]) => /retired\s*(=|:)\s*false/.test(t));
check(flagFalse.length === 0,
  "cw7 nothing in Studio writes `retired: false`, which the engine's reader refuses (the flag is true or absent): "
  + JSON.stringify(flagFalse.map(x => x[0])));

process.stdout.write("\ncard-life-wiring  " + asserted + " assertion(s), " + failed + " failure(s)\n");
if (asserted !== EXPECTED) {
  process.stderr.write("card-life-wiring  expected " + EXPECTED + " assertions, ran " + asserted + "\n");
  failed++;
}
process.exit(failed ? 1 : 0);
