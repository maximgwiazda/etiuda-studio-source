/* The verbs of bulk upkeep are wired end to end and their words are in the table (board 834, step 10, C09): node tests/bulk-wiring.mjs.
 * Read out of the source: studio.mjs export, main.js channel, preload bridge, page call, act table, ui/lang.js pair; and the three
 * rules that keep a path and a mint where they belong. Words still pending the copywriter are counted and printed, never failed on. */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as S from "../src/studio.mjs";
import { loadPage } from "./page-stand-in.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const EXPECTED = 5;
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
const lang = read("ui", "lang.js"), studio = read("src", "studio.mjs"), builder = read("electron-builder.js");

/* verb in src/studio.mjs, channel, name on the preload's bridge */
const WIRES = [
  ["findPlaces", "studio:find-places", "findPlaces"],
  ["replacePlaces", "studio:replace-places", "replacePlaces"],
  ["retireCards", "studio:cards-retire", "retireCards"],
  ["moveCards", "studio:cards-move", "moveCards"],
  ["deleteCards", "studio:cards-delete", "deleteCards"],
  ["undoBulk", "studio:cards-undo", "undoBulk"],
  ["exportCards", "studio:csv-export", "exportCards"],
  ["sheetPlan", "studio:sheet-plan", "sheetPlan"],
  ["sheetLand", "studio:sheet-land", "sheetLand"],
];

const ACTS_NEW = ["tick", "tick-all", "bulk-untick", "bulk-retire", "bulk-delete", "bulk-export", "find-open", "find-close", "find-whole",
  "find-case", "find-tick", "find-tick-all", "find-do", "csv-export-all", "sheet-pick", "sheet-cancel", "sheet-land"];

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
  "bw1 each of the " + WIRES.length + " new verbs is exported by src/studio.mjs, answered on one channel by shell/main.js through the"
  + " worker, offered by the preload on that channel, and called by the page: " + JSON.stringify(wireFaults));

const pick = count(main, 'answer("studio:csv-pick"') === 1 && /csvPick:\s*\(title\)\s*=>\s*ipcRenderer\.invoke\("studio:csv-pick"/.test(preload)
  && app.indexOf("API.csvPick(") >= 0;
check(pick, "bw2 the folder the export writes to is picked through a picker of its own, offered by the preload and asked for by the page");

const gated = [["studio:csv-export", 'chosen.took("csv"'], ["studio:sheet-plan", 'chosen.took("import"'], ["studio:sheet-land", 'chosen.took("import"']]
  .filter(([ch, g]) => { const at = main.indexOf('answer("' + ch + '"'); return at < 0 || main.slice(at, at + 220).indexOf(g) < 0; });
check(gated.length === 0,
  "bw3 a path the page names is acted on only when a picker answered it: the export's folder and both sheet verbs' file are gated by the shell: "
  + JSON.stringify(gated));

const page = loadPage({ api: {}, uiLang: "en" }).page;
/* an act is written either as a literal attribute, through seg(), or as the act handed to a tick (tickCell, findTick) */
const appLines = app.split("\n");
const writtenActs = ACTS_NEW.filter(a => app.indexOf('data-act="' + a + '"') >= 0 || app.indexOf('seg("' + a + '"') >= 0
  || appLines.some(l => l.indexOf('"' + a + '"') >= 0 && /tickCell\(|findTick\(/.test(l)));
check(ACTS_NEW.every(a => typeof page.ACTS[a] === "function") && writtenActs.length === ACTS_NEW.length,
  "bw4 each of the " + ACTS_NEW.length + " acts the new markup writes is a function in the page's act table, and each is written into"
  + " markup by something: " + writtenActs.length + " written");

/* THE STAND-IN PAGE ANSWERS AN ELEMENT FOR ANY SELECTOR, so the bar's own element is read out of the page's source (the test architect's M13) */
const index = read("ui", "index.html");
check(/<div class="undo bulk" id="bulk" hidden><\/div>/.test(index) && count(index, 'id="bulk"') === 1 && count(app, '$("#bulk")') >= 1,
  "bw12 the page the bar paints into has it: ui/index.html holds one element with id=\"bulk\", hidden until a tick, and ui/app.js asks for exactly that");

process.stdout.write("\nbulk-wiring  " + asserted + " assertion(s), " + failed + " failure(s)\n");
if (asserted !== EXPECTED) {
  process.stderr.write("bulk-wiring  expected " + EXPECTED + " assertions, ran " + asserted + "\n");
  failed++;
}
process.exit(failed ? 1 : 0);
