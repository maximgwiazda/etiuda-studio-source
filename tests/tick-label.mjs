/* THE WHOLE LABEL TOGGLES A TICK (desktop polish, 2026-10-12).
 *
 *     node tests/tick-label.mjs
 *
 * A tick that has a label (Whole words, Match case, the commitment line, Publish with the
 * warnings; intents having moved to chips under board 960) used to answer only on its 15px box. The press now lands on the box whichever part of the row
 * took it, and the row shows a hover and a press. It shows no pointer: Maxim's rule in the engine's rulebook,
 * "The cursor stays the arrow" (2026-08-31), holds for the row as everywhere. A tick in a table, which has no
 * label, is still only its box.
 *
 *   tl1  the click listener asks the row when the press itself is not an act
 *   tl3  Whole words and Match case toggle from their names
 *   tl4  the commitment line toggles from its words
 *   tl5  Publish with the warnings toggles from its words
 *   tl6  a table tick's cell, and a bulk row's words, do not toggle
 *   tl8  every leg ran
 *
 * PROVED BY MAKING IT FAIL: TICK_LABEL_APP and TICK_LABEL_HTML read those copies. The report of the build that
 * added this file says which part was taken out.
 *
 * Node only, no window, no Electron. Exit 0 when every check holds, 1 when any fails.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadPage } from "./page-stand-in.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const EXPECTED = 11;
const appSource = process.env.TICK_LABEL_APP
  ? fs.readFileSync(path.resolve(process.env.TICK_LABEL_APP), "utf8") : undefined;
const appText = appSource != null ? appSource : fs.readFileSync(path.join(ROOT, "ui", "app.js"), "utf8");

let asserted = 0, failed = 0;
function check(cond, line) {
  asserted++;
  if (cond) process.stdout.write("  ok   " + line + "\n");
  else { failed++; process.stdout.write("  FAIL " + line + "\n"); }
}

/* A tick's row as the page builds it: the box carries the act, the name beside it does not. */
function row(act, id) {
  const box = {
    tagName: "SPAN",
    attrs: { "data-act": act },
    getAttribute(k) { return Object.prototype.hasOwnProperty.call(this.attrs, k) ? this.attrs[k] : null; },
    setAttribute(k, v) { this.attrs[k] = String(v); },
    classList: { toggle() {}, add() {}, remove() {}, contains() { return false; } },
    closest(sel) { return sel === ".cbx" || sel === "[data-act]" ? box : null; },
  };
  if (id) box.attrs["data-id"] = id;
  const lab = { querySelector(sel) { return sel === ".cbx[data-act]" ? box : null; }, closest() { return null; } };
  const name = {
    tagName: "SPAN",
    closest(sel) {
      if (sel === ".cbx" || sel === "[data-act]") return null;
      if (sel === "label, .pw-tickrow") return lab;
      return null;
    },
  };
  return { box, name };
}
/* What a table cell is: words with no tick row around them, and the box itself. */
function cell() {
  return { tagName: "TD", closest() { return null; } };
}

function main() {
  const home = loadPage({ uiLang: "en", source: appSource });
  const P = home.page;
  const draft = {
    langs: [{ code: "en" }, { code: "pl" }],
    tags: [
      { id: "s1", kind: "shelf", label: { en: "Delivery", pl: "Dostawa" } },
      { id: "in1", kind: "request", label: { en: "A refund", pl: "Zwrot" } },
    ],
    cards: [{ id: "c1", shelf: "s1", title: { en: "Card", pl: "Karta" }, body: { en: "Text", pl: "Tekst" },
      requests: [] }],
  };
  P.S.host = { tour: { offered: true }, langs: { builtIn: ["en", "pl"], endonyms: { en: "English", pl: "Polski" } } };
  P.S.open = { dir: "D:\\proj", name: "Proj", draft, awaiting: [], lint: { errors: 0, warnings: 0, rows: [] },
    editions: [], langs: { rows: [{ code: "en" }, { code: "pl" }] } };
  P.S.screen = "project"; P.S.section = "cards"; P.S.sel = "c1"; P.S.lang = "en";
  P.S.find = { whole: true, matchCase: false, to: "", rows: null, places: 0, off: new Set(), asked: null, scope: null };
  P.S.ticks = new Set();

  const heard = home.doc.heard.filter((h) => h.type === "click").map((h) => String(h.fn));
  check(typeof P.tickFrom === "function" && heard.some((s) => s.indexOf("tickFrom(") >= 0),
    "tl1 the click asks the row when the press itself is not an act");

  const errs = [];
  function click(node) {
    const ev = { target: node, shiftKey: false, preventDefault() {}, stopPropagation() {} };
    for (const h of home.doc.heard) if (h.type === "click") {
      try { h.fn(ev); }
      catch (e) { errs.push(e && e.message ? e.message : String(e)); }
    }
  }
  const from = (node) => (typeof P.tickFrom === "function" ? P.tickFrom(node) : null);
  const card = () => P.cardById("c1");

  const whole = row("find-whole");
  const match = row("find-case");
  const strip = P.findStrip();
  check(from(whole.name) === whole.box && from(match.name) === match.box
      && /<label class="row2"><span class="cbx[^"]*"[^>]*data-act="find-whole"/.test(strip)
      && /<label class="row2"><span class="cbx[^"]*"[^>]*data-act="find-case"/.test(strip),
    "tl3a Whole words and Match case are labels, and the name resolves to the box");
  const wasWhole = P.S.find.whole;
  click(whole.name);
  check(P.S.find.whole === !wasWhole, "tl3b pressing Whole words toggles it: " + P.S.find.whole);
  click(match.name);
  check(P.S.find.matchCase === true, "tl3c pressing Match case toggles it: " + P.S.find.matchCase);

  const commit = row("commits");
  check(/<label class="row2 cn-tick"[^>]*>[\s\S]*data-act="commits"[\s\S]*This card commits the firm/.test(P.commitHtml(card()))
      && from(commit.name) === commit.box,
    "tl4a the commitment line is a label and its words resolve to the box");
  click(commit.name);
  check(card().commits === true, "tl4b pressing the commitment's words ticks it: " + JSON.stringify(card().commits));

  const warn = row("warn");
  P.S.coverWarn = false;
  check(from(warn.name) === warn.box && /<span class="pw-tickrow"><span class="cbx[\s\S]{0,240}data-act="warn"/.test(appText),
    "tl5a Publish with the warnings is a tick row and its words resolve to the box");
  click(warn.name);
  check(P.S.coverWarn === true, "tl5b pressing those words ticks it: " + JSON.stringify(P.S.coverWarn));

  const bare = cell();
  const table = row("tick", "c1").box;
  const before = P.S.ticks.has("c1");
  click(bare);
  const afterBare = P.S.ticks.has("c1");
  click(table);
  check(from(bare) == null && afterBare === before && P.S.ticks.has("c1") === !before
      && !/<label[^>]*>[^]*data-act="tick"/.test(P.tickCell(false, "Card", "tick", "")),
    "tl6 a table tick answers on its box only: the cell did nothing (" + afterBare + "), the box toggled ("
    + P.S.ticks.has("c1") + ")");

  check(errs.length === 0, "tl the presses threw nothing: " + errs.join(" | "));
  check(asserted + 1 === EXPECTED, "tl8 every leg ran: " + (asserted + 1) + " of " + EXPECTED + " assertion(s)");
  process.stdout.write("tick-label: " + asserted + " assertion(s), " + failed + " failure(s)\n");
  process.exit(failed ? 1 : 0);
}

try { main(); }
catch (e) {
  process.stderr.write("  FAIL tests/tick-label.mjs threw: " + (e && e.stack || e) + "\n");
  process.exit(1);
}
