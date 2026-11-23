/* THE CARET ONLY WHERE SOMEBODY TYPES.
 *
 *     node tests/cursor.mjs [--keep] [--text]
 *
 * gate-node-arm: --text
 *
 * THE RULE IS MAXIM'S (the engine's rulebook, "The cursor stays the arrow", 2026-08-31), and for
 * Studio in his words of 2026-09-28 23:47: "there are plenty of different places in Etiuda
 * Studio, where mouse cursor changes into caret when it shouldn't." The text cursor shows only
 * where text can be typed; everywhere else the arrow. A read-only or disabled field takes no
 * typing, so it keeps the arrow too.
 *
 * WHY IT BROKE AND WHY TWO HALVES. Left alone, Chromium's `cursor:auto` draws an I-beam over any
 * run of text, and the canvas set `default` on five tags only, so every heading, count and table
 * cell showed the caret. A static reading cannot see a rule that is MISSING except by asking for
 * the one that must be there, and a driven reading cannot see a cursor waiting behind a :hover or
 * a class nobody painted today. So:
 *
 *   1. THE SHEETS AND THE SCRIPT, READ AS TEXT. The arrow is declared on html. Every `cursor:` in
 *      ui/index.html is `default`, or `text` on a rule whose every selector ends on a field.
 *      ui/app.js sets no cursor, and the recovery window's own page (the pinned shell/page-watch.cjs) sets
 *      only the arrow. And every tag ui/app.js paints `contenteditable="false"` (the Variables
 *      page's chips inside a writing box) has an arrow rule of its own, since the box's caret is
 *      inherited by its children (1h). `--text` runs this half alone, with no window.
 *   2. EVERY SCREEN, DRIVEN. On each screen tests/screen-walk.mjs reaches, every element with a
 *      box has the computed cursor `default`, except a field that takes typing, which has `text`
 *      (or `auto`, which over a field is the same caret).
 *
 * EACH HALF HAS A PLANTED CONTROL, because a checker that finds nothing looks exactly like a
 * clean sheet: section 1 feeds the same function a sheet carrying an I-beam on a heading, a hand
 * and a custom cursor; section 2 plants a heading set to `auto` and a span set to `pointer` into
 * the live page and asserts the same classifier names both.
 */
import fs from "node:fs";
import path from "node:path";
import { openStudio } from "./shell-door.mjs";
import { clearScratch, dropScratch } from "./scratch.mjs";
import { ROOT, plantWalkable, walkScreens } from "./screen-walk.mjs";

const SCRATCH = path.join(ROOT, "scratch", "cursor");

let asserted = 0, failed = 0;
function check(cond, line) {
  asserted++;
  if (cond) process.stdout.write("  ok   " + line + "\n");
  else { failed++; process.stderr.write("  FAIL " + line + "\n"); }
}

/* ---- 1. the text -------------------------------------------------------------------------- */

/** The subject of a selector: its last compound, read after the last combinator. */
function subjectOf(sel) {
  let depth = 0, cut = 0;
  for (let i = 0; i < sel.length; i++) {
    const c = sel[i];
    if (c === "(" || c === "[") depth++;
    else if (c === ")" || c === "]") depth--;
    else if (depth === 0 && (c === " " || c === ">" || c === "+" || c === "~")) cut = i + 1;
  }
  return sel.slice(cut).trim();
}
const EDITABLE_SUBJECT = (s) => (/^(input|textarea)(?![-\w])/.test(s) || /\[contenteditable/.test(s))
  && !/type=["']?(checkbox|radio|range|file|color|button|submit|hidden)/.test(s);

/** Every fault in a stylesheet's text: a cursor other than the arrow, or a caret off a field. */
export function sheetFaults(css) {
  const out = [];
  const bare = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const re = /([^{}]+)\{([^{}]*)\}/g;
  let m;
  while ((m = re.exec(bare))) {
    const sels = m[1].trim().split(",").map((s) => s.trim()).filter(Boolean);
    const cur = /(?:^|;)\s*cursor\s*:\s*([^;]+)/g;
    let d;
    while ((d = cur.exec(m[2]))) {
      const v = d[1].replace(/!important/, "").trim();
      if (v === "default") continue;
      if (v === "text" && sels.every((s) => EDITABLE_SUBJECT(subjectOf(s)))) continue;
      out.push("cursor:" + v + " on " + sels.join(","));
    }
  }
  return out;
}

/** Every place a script sets a cursor: any `cursor` token in code, comments removed. */
export function scriptFaults(js) {
  const code = js.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:"'\\])\/\/.*$/gm, "$1");
  const out = [];
  code.split("\n").forEach((line, i) => {
    if (/\bcursor\b/i.test(line)) out.push((i + 1) + ": " + line.trim());
  });
  return out;
}

const ARROW_ON_HTML = /(^|[}\s])html\s*\{[^}]*cursor\s*:\s*default/;

function textHalf() {
  const html = fs.readFileSync(path.join(ROOT, "ui", "index.html"), "utf8");
  const css = (html.match(/<style>([\s\S]*?)<\/style>/) || [])[1] || "";
  check(css.length > 20000, "1a the sheet was read out of ui/index.html: " + css.length + " characters");
  const planted = sheetFaults("h2{cursor:text}.x:hover{cursor:pointer}"
    + "@media (min-width:1px){.y{cursor:url(a.cur),auto}}.z{cursor:auto}"
    + "input.field,textarea{cursor:text}.ok{cursor:default}input[type=checkbox]{cursor:text}");
  check(planted.length === 5, "1b the reading catches what it looks for: 5 planted faults, found "
    + planted.length + " (" + planted.join("; ") + ")");
  const faults = sheetFaults(css);
  check(faults.length === 0, "1c the sheet sets no cursor but the arrow, and the caret only on a"
    + " field" + (faults.length ? ": " + faults.join("; ") : ""));
  const bare = css.replace(/\/\*[\s\S]*?\*\//g, "");
  check(ARROW_ON_HTML.test(bare) && !ARROW_ON_HTML.test("body{cursor:default}"),
    "1d the arrow is declared once for the whole page, on html, so a surface nobody has written"
    + " yet inherits it (" + (bare.match(/cursor\s*:/g) || []).length + " cursor declarations)");
  const js = fs.readFileSync(path.join(ROOT, "ui", "app.js"), "utf8");
  const plantedJs = scriptFaults("el.style.cursor = 'pointer';\n/* cursor in a comment */\nx();");
  check(plantedJs.length === 1, "1e the script reading catches a planted style.cursor and skips a"
    + " comment: " + plantedJs.length);
  const jsFaults = scriptFaults(js);
  check(jsFaults.length === 0, "1f ui/app.js sets no cursor" + (jsFaults.length ? ": "
    + jsFaults.slice(0, 5).join(" | ") : ""));
  const watch = fs.readFileSync(path.join(ROOT, "engine", "pinned", "shell", "page-watch.cjs"), "utf8");
  const said = (watch.match(/cursor\s*:\s*[a-z-]+/g) || []).map((x) => x.replace(/\s/g, ""));
  check(said.length > 0 && said.every((x) => x === "cursor:default"),
    "1g the recovery window's own page sets only the arrow: " + JSON.stringify(said));
  /* 1h. A NON-EDITABLE THING INSIDE A WRITING BOX KEEPS THE ARROW. `cursor` is inherited, and the writing
     box (`[contenteditable="true"]{cursor:text}`) hands its caret to every child; the page's own words in it,
     painted `contenteditable="false"` (the Variables page's chips), are not typed in. So each tag the script
     paints that way needs a rule that sets the arrow on one of its classes. */
  const chips = nonEditableTags(js);
  const bareChips = chips.filter((t) => !t.some((c) => arrowOnClass(css, c)));
  check(chips.length > 0 && bareChips.length === 0,
    "1h every tag painted contenteditable=\"false\" has an arrow rule of its own, so the caret of the box around it is not inherited: "
    + JSON.stringify(chips) + (bareChips.length ? "; no arrow on " + JSON.stringify(bareChips) : ""));
  const plantedMarkup = "x = '<span class=\"chip zz-word\" contenteditable=\"false\">' + y + '<b contenteditable=\"true\" class=\"zz-box\">';";
  const plantedChips = nonEditableTags(plantedMarkup);
  const plantedBare = (sheet) => plantedChips.filter((t) => !t.some((c) => arrowOnClass(sheet, c))).length;
  check(plantedChips.length === 1 && plantedChips[0].join() === "chip,zz-word" && plantedBare(css) === 1
        && plantedBare(css + ".zz-word{cursor:default}") === 0 && plantedBare(css + ".zz-word{cursor:text}") === 1
        && plantedBare(css + "/* .zz-word{cursor:default} */") === 1,
    "1i CONTROL: a planted non-editable tag with no arrow rule is named, one with the rule is not, a caret rule or a comment is no arrow, and a box that is editable is not taken for one: " + JSON.stringify(plantedChips));
}

/** The class list of every tag this script paints with contenteditable="false", comments out. */
function nonEditableTags(js) {
  const code = js.replace(/\/\*[\s\S]*?\*\//g, " ");
  const out = [];
  for (const m of code.matchAll(/<[a-z]+\b[^<>]*\bcontenteditable="false"[^<>]*>/g)) {
    const c = /\bclass="([^"]*)"/.exec(m[0]);
    out.push(c ? c[1].split(/\s+/).filter(Boolean) : []);
  }
  return out;
}
/** Does a rule of the sheet set `cursor:default` on a selector ending on this class? */
function arrowOnClass(css, cls) {
  const bare = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const re = /([^{}]+)\{([^{}]*)\}/g;
  const hit = new RegExp("(^|[^-\\w])\\." + cls.replace(/[-]/g, "\\-") + "(?![-\\w])");
  for (let m; (m = re.exec(bare));) {
    if (!/(?:^|;)\s*cursor\s*:\s*default\s*(?:!important)?\s*(?:;|$)/.test(m[2])) continue;
    if (m[1].split(",").some((s) => hit.test(subjectOf(s.trim())))) return true;
  }
  return false;
}

/* ---- 2. the page -------------------------------------------------------------------------- */

/** Run in the page: every element with a box, and whether its cursor is the one it owes. */
const CURSORS = `(() => {
  const TYPED = new Set(["", "text", "search", "email", "url", "tel", "password", "number",
    "date", "datetime-local", "month", "week", "time"]);
  const editable = (el) => {
    if (el.isContentEditable) return true;
    if (el.tagName === "TEXTAREA") return !el.readOnly && !el.disabled;
    if (el.tagName === "INPUT") return TYPED.has((el.getAttribute("type") || "").toLowerCase())
      && !el.readOnly && !el.disabled;
    return false;
  };
  const name = (el) => el.tagName.toLowerCase() + (el.id ? "#" + el.id : "")
    + (typeof el.className === "string" && el.className.trim()
      ? "." + el.className.trim().split(/\\s+/).join(".") : "")
    + (el.textContent && el.children.length === 0 ? " '" + el.textContent.trim().slice(0, 24) + "'" : "");
  const bad = [];
  let fields = 0, plain = 0;
  for (const el of document.querySelectorAll("body *")) {
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility !== "visible") continue;
    if (editable(el)) {
      fields++;
      if (cs.cursor !== "text" && cs.cursor !== "auto") bad.push(name(el) + " is a field and shows " + cs.cursor);
    } else {
      plain++;
      if (cs.cursor !== "default") bad.push(name(el) + " shows " + cs.cursor);
    }
  }
  return JSON.stringify({ bad, fields, plain });
})()`;

async function main(argv) {
  const keep = argv.indexOf("--keep") >= 0;
  textHalf();
  if (argv.indexOf("--text") >= 0) return finish();

  clearScratch(SCRATCH);
  fs.mkdirSync(SCRATCH, { recursive: true });
  const w = await plantWalkable(SCRATCH);
  const studio = await openStudio("tests/cursor.mjs", {
    projects: w.projects, userDataDir: path.join(SCRATCH, "ud"),
    env: { STUDIO_TEST_FILE: w.intake },
  });
  try {
    const page = studio.page;
    const control = JSON.parse(await page.evaluate(`(() => {
      const box = document.createElement("div");
      box.id = "cursorProbe";
      box.style.cssText = "position:fixed;left:0;top:0;z-index:999";
      box.innerHTML = '<h2 style="cursor:auto">Heading</h2><span style="cursor:pointer">Hand</span>'
        + '<input class="field" id="cpTyped" value="typed">'
        + '<input class="field" id="cpRead" readonly style="cursor:default" value="read">';
      document.body.appendChild(box);
      const got = JSON.parse(${CURSORS});
      box.remove();
      return JSON.stringify(got);
    })()`));
    const ctl = control.bad.filter((b) => /Heading|Hand|#cpTyped|#cpRead/.test(b));
    check(ctl.length === 2 && ctl.some((b) => /Heading.*auto/.test(b))
        && ctl.some((b) => /Hand.*pointer/.test(b)),
      "2a the page reading names a planted I-beam heading and a planted hand, and passes a planted"
      + " field and its read-only twin: " + ctl.join("; "));

    let screens = 0, fields = 0, plain = 0;
    const walked = await walkScreens(page, w.dir, async (name) => {
      const r = JSON.parse(await page.evaluate(CURSORS));
      screens++; fields += r.fields; plain += r.plain;
      check(r.bad.length === 0, "2b " + name + ": " + r.plain + " elements show the arrow and "
        + r.fields + " field(s) the caret" + (r.bad.length ? "; " + r.bad.length + " do not: "
          + r.bad.slice(0, 6).join(" | ") : ""));
    });
    check(screens >= 18 && fields > 0,
      "2c " + screens + " screens walked (" + walked.names.join(", ") + "), " + plain
      + " element readings and " + fields + " field readings, so the walk saw fields as well as"
      + " text");
  } finally {
    await studio.shut();
    if (!keep) dropScratch(SCRATCH, "cursor");
  }
  return finish();
}

function finish() {
  process.stdout.write((failed ? "FAILED " : "PASSED ") + (asserted - failed) + "/" + asserted
    + " tests/cursor.mjs\n");
  process.exit(failed ? 1 : 0);
}

main(process.argv.slice(2)).catch((e) => {
  process.stderr.write("tests/cursor.mjs could not run: " + (e && e.stack || e) + "\n");
  process.exit(1);
});
