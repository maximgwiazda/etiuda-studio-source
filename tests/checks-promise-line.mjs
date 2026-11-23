/* THE CHECKS LIST SAYS ITS PROMISE SUGGESTIONS IN ONE LINE WITH A COUNT (board 1016, item 8, ruled B by Max on 2026-11-20 15:04:
 * "Okay, I agree with B."). The rows of the One list that read like a commitment collapse to a line "Promise suggestions: N";
 * pressing it shows them as the list always showed them, and pressing again puts them away. Other findings stay as they were.
 *
 *     node tests/checks-promise-line.mjs
 *
 * Markup only (tests/page-stand-in.mjs): the look is Max's. Checks cpl1 to cpl6, EXPECTED below.
 */
import "./licensed-env.mjs";
import { loadPage } from "./page-stand-in.mjs";

const EXPECTED = 7;
let asserted = 0, failed = 0;
function check(cond, line) {
  asserted++;
  if (cond) process.stdout.write("  ok   " + line + "\n");
  else { failed++; process.stderr.write("  FAIL " + line + "\n"); }
}

const sug = (n) => ({ severity: "suggestion", kind: "commitment", card: "c" + n, lang: "en", phrase: "We will reply " + n,
  where: "Card " + n, ruleKind: "later", rule: "later", why: "x", what: "x" });
const rows = [{ severity: "warning", kind: "other", what: "A warning stays", where: "Card W", why: "w", go: null },
  { severity: "suggestion", kind: "ends", card: "e1", where: "Card E", from: ["Card A"] }]
  .concat([1, 2, 3].map(sug));
const lint = { rows, errors: 0, warnings: 1, awaiting: 0, suggestions: 4, ends: 1 };

const h = loadPage({ api: {}, uiLang: "en" }), P = h.page;
const paint = (extra) => {
  Object.assign(P.S, { open: { dir: "d", draft: { cards: [] }, lint }, screen: "project", section: "lint", lfilter: "all", lang: "en",
    sel: null, lintAs: "list" }, extra || {});
  P.paintLint();
  return h.node("#main").innerHTML;
};
const NB = new RegExp(String.fromCharCode(160), "g");
let html = paint({ lsugOpen: false });
check(/Promise suggestions: 3/.test(html.replace(NB, " ")) && /data-act="lint-sug"/.test(html),
  "cpl1 the three commitment rows are one line with the count, and a button that opens it");
check(html.indexOf("We will reply") < 0 && html.indexOf("reads like a commitment") < 0,
  "cpl2 while it is shut, no commitment row is listed");
check(/A warning stays/.test(html) && /terminus: nothing comes next/.test(html),
  "cpl3 the warning and the path's end keep their rows");
html = paint({ lsugOpen: true });
check([...html.matchAll(/reads like a commitment/g)].length === 3 && /data-act="lint-sug"/.test(html) && /Promise suggestions: 3/.test(html.replace(NB, " ")),
  "cpl4 opened, the three rows show as they did, under the same line");
html = paint({ lsugOpen: false, lfilter: "suggestions" });
check(/Promise suggestions: 3/.test(html.replace(NB, " ")) && /terminus/.test(html) && html.indexOf("A warning") < 0,
  "cpl5 the Suggestions filter keeps the line and the path's end, and no warning");
const none = Object.assign({}, lint, { rows: rows.slice(0, 2) });
Object.assign(P.S, { open: { dir: "d", draft: { cards: [] }, lint: none }, lsugOpen: false });
P.paintLint();
html = h.node("#main").innerHTML;
check(html.indexOf("Promise suggestions") < 0 && html.indexOf('data-act="lint-sug"') < 0,
  "cpl6 CONTROL: with no commitment suggestion there is no line");
const one = Object.assign({}, lint, { rows: [rows[0], sug(9)] });
Object.assign(P.S, { open: { dir: "d", draft: { cards: [] }, lint: one }, lsugOpen: false });
P.paintLint();
check(/Promise suggestions: 1(?!\d)/.test(h.node("#main").innerHTML.replace(NB, " ")), "cpl7 one is counted as the one key says it");

process.stdout.write("checks-promise-line: " + asserted + " asserted, " + failed + " failed\n");
if (failed || asserted !== EXPECTED) { process.stderr.write("EXPECTED " + EXPECTED + "\n"); process.exit(1); }
