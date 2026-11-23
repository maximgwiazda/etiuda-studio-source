/* An import column change repaints the plan pane and the foot, not the window.
 * The worker still runs. Opening a file still paints the whole window.
 *
 *     node tests/plan-pane.mjs
 *
 * Node only, no window. The stand-in runs the page's own input handler.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadPage } from "./page-stand-in.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const app = fs.readFileSync(path.join(ROOT, "ui", "app.js"), "utf8");

let legs = 0, failures = 0;
function check(ok, what) {
  legs++;
  if (!ok) failures++;
  console.log((ok ? "  ok   " : "  FAIL ") + what);
}

function extractFn(src, name) {
  const start = src.indexOf("function " + name + "(");
  if (start < 0) return null;
  const open = src.indexOf("{", start);
  let depth = 0;
  for (let i = open; i < src.length; i++) {
    if (src[i] === "{") depth++;
    else if (src[i] === "}") {
      depth--;
      if (depth === 0) return src.slice(start, i + 1);
    }
  }
  return null;
}

const at = app.indexOf("async function wizPlan");
const planSrc = extractFn(app, "wizPlan");
const startSrc = extractFn(app, "wizStart");
const colAt = app.indexOf('el.getAttribute("data-col")');
const projAt = app.indexOf('el.getAttribute("data-proj")', colAt);
const colBlock = colAt >= 0 && projAt > colAt ? app.slice(colAt, projAt) : "";

check(!!planSrc && /async function wizPlan\(pane\)/.test(app.slice(at, at + 48)),
  "pp1 a column change can ask wizPlan for the pane alone");
check(!!planSrc && /if \(pane\) \{ paintMain\(\); paintFoot\(\); \}\s*\n\s*else paint\(\);/.test(planSrc)
      && (planSrc.match(/paint\(\)/g) || []).length === 1
      && (planSrc.match(/show\(/g) || []).length === 4,
  "pp2 every answer paints the pane, or the whole window, and paint() is the window's arm");
check(!!colBlock && /wizPlan\(true\)/.test(colBlock) && !/wizPlan\(\)/.test(colBlock),
  "pp3 the column's own handler asks for the pane");
check(!!startSrc && /return wizPlan\(\);/.test(startSrc) && !/wizPlan\(true\)/.test(startSrc),
  "pp4 opening a file still paints the whole window");
check(!!planSrc && /if \(!here\) \{ wiz\.said = said; return; \}/.test(planSrc),
  "pp5 a wizard on another tab still keeps its sentence and does not paint");

const MARK = "PLAN-MARKER-TITLE";
const TABS = "TABS-SENTINEL";
const CHROME = "CHROME-SENTINEL";
const RAIL = "RAIL-SENTINEL";
const plan = {
  columns: [{ header: "Title", field: "title", lang: null, first: MARK }],
  read: { shape: "table" },
  rows: 4, cols: 1, base: "pile.csv", encoding: "utf-8",
  fields: { title: {} }, langs: ["en"], report: { findings: [] },
};
const answers = [plan, { error: "the file could not be read" }];
const rejections = [];
process.on("unhandledRejection", (e) => { rejections.push(e && e.stack ? e.stack : String(e)); });

const { page, doc, sandbox } = loadPage({
  api: { importPlan: async () => answers.shift() },
  uiLang: "en",
});
page.S.wiz = {
  file: "pile.csv", base: "pile.csv", plan: null, step: 0, no: null,
  override: {}, landed: null, intoDir: "", into: false, said: null,
};
page.S.err = null;

function arm() {
  doc.querySelector("#tabs").innerHTML = TABS;
  doc.querySelector("#chrome").innerHTML = CHROME;
  doc.querySelector("#rail").innerHTML = RAIL;
  const ready = { sentinel: true };
  sandbox.STUDIO_READY = ready;
  return ready;
}
function still(ready) {
  return doc.querySelector("#tabs").innerHTML === TABS
    && doc.querySelector("#chrome").innerHTML === CHROME
    && doc.querySelector("#rail").innerHTML === RAIL
    && sandbox.STUDIO_READY === ready;
}
const target = {
  id: "", value: "title",
  getAttribute(k) { return k === "data-col" ? "Title" : null; },
  hasAttribute() { return false; },
};
async function fire() {
  const heard = doc.heard.filter((h) => h.type === "input");
  for (const h of heard) h.fn({ target, data: "", inputType: "" });
  await new Promise((r) => setTimeout(r, 30));
}

const ready1 = arm();
await fire();
const main1 = doc.querySelector("#main").innerHTML;
check(main1.includes(MARK) && page.S.wiz.override.Title === "title",
  "pp6 the plan pane shows the reading the worker just returned");
check(still(ready1) && rejections.length === 0,
  "pp7 that reading did not repaint the tabs, the chrome, the rail or the window"
  + (rejections.length ? " (" + rejections[0].split("\n")[0] + ")" : ""));
check(/data-act="wiz-next"/.test(doc.querySelector("#foot").innerHTML),
  "pp8 the foot follows the plan, so Next is there");

const ready2 = arm();
target.value = "";
await fire();
const main2 = doc.querySelector("#main").innerHTML;
check(!main2.includes(MARK) && /could not be read/.test(main2) && page.S.wiz.plan == null,
  "pp9 a column change that fails still redraws the plan, and only the plan");
check(still(ready2) && rejections.length === 0,
  "pp10 the failed reading did not repaint the rest of the window"
  + (rejections.length ? " (" + rejections[0].split("\n")[0] + ")" : ""));

console.log(legs + " legs, " + failures + " failures");
process.exit(failures ? 1 : 0);
