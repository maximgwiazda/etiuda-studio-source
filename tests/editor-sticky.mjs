/* THE CARD EDITOR STAYS IN PLACE WHILE THE TABLE SCROLLS (the cards screen, from 1100px wide).
 *
 *     node tests/editor-sticky.mjs
 *
 * The cards screen is a two-column grid, the table pane beside #cardEditor, inside one scroller (#main). The table has no height
 * limit, so the editor used to scroll away with the first rows. It is now `position:sticky` with a cap on its height and its own
 * scroll for the fields, so a card too tall for the window is still reachable. This leg reads ui/index.html's rules the way the
 * browser cascades them at a given width, and the markup ui/app.js paints, on the stand-in of tests/page-stand-in.mjs.
 *
 *   stk1  from 1100px the editor is sticky, pinned 16px from the top of the scroller (the pad's own 16)
 *   stk2  it is not sticky below 1100px, where the editor sits under the table: a pinned box there would cover the rows
 *   stk3  it aligns to the start of its grid row: a stretched grid item fills the row and a sticky box that fills its row has
 *         nowhere to move, so without this the pin does nothing
 *   stk4  its height is capped at the window less what is always around #main (the band, the chrome row and the pad), so the
 *         box is never taller than the room it sticks in
 *   stk5  its fields scroll inside it: the box is a column, and the scrolling child may shrink
 *   stk6  nothing between the editor and the scroller clips or scrolls (a sticky box sticks to its nearest scrolling ancestor,
 *         which must be #main), and the cards screen is a plain pad, not the split pad whose overflow is hidden
 *   stk7  the markup the rules were written for is the markup painted: the editor is the second child of the .cols the screen
 *         builds, and its fields are in a `.sc` that is its direct child
 *   stk8  the two columns are still side by side from 1100 and one column below (the premise of stk2)
 *   stk9  every leg ran
 *
 * WHAT IT CANNOT SEE, said rather than implied: that the editor really stays on the screen, how tall it looks, whether the
 * 176px cap leaves room at the foot or lets the last field be cut by the undo and ticked bars. That is Maxim's eye; the
 * number is one `calc` in ui/index.html. A pin is layout, and node has none.
 *
 * PROVED BY MAKING IT FAIL: STICKY_HTML=<a copy of ui/index.html> and STICKY_APP=<a copy of ui/app.js> read those copies.
 * main's index.html (no rule) reddens stk1, stk3, stk4 and stk5; a copy with the rule's media widened to 600px reddens
 * stk2; with `align-self:start` removed, stk3; with the cap removed, stk4; with `.sc` overflow hidden, stk5; with
 * `.cols{overflow:hidden}` added, stk6; and an app.js that wraps the editor in a div, stk7.
 *
 * Node only, no window, no Electron. Exit 0 when every check holds, 1 when any fails.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadPage } from "./page-stand-in.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const EXPECTED = 9;

let asserted = 0, failed = 0;
function check(cond, line) {
  asserted++;
  if (cond) process.stdout.write("  ok   " + line + "\n");
  else { failed++; process.stdout.write("  FAIL " + line + "\n"); }
}

const html = fs.readFileSync(process.env.STICKY_HTML ? path.resolve(process.env.STICKY_HTML) : path.join(ROOT, "ui", "index.html"), "utf8");
const appSource = process.env.STICKY_APP ? fs.readFileSync(path.resolve(process.env.STICKY_APP), "utf8") : undefined;

/* ---- a small cascade over the page's own <style>: rules in source order, each with the width conditions around it ---- */
function readRules(text) {
  const css = (/<style[^>]*>([\s\S]*?)<\/style>/.exec(text) || [])[1];
  if (css == null) throw new Error("no <style> in index.html");
  const src = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const rules = [];
  let i = 0;
  const parse = (chunk, media) => {
    let k = 0;
    while (k < chunk.length) {
      const open = chunk.indexOf("{", k);
      if (open < 0) break;
      const head = chunk.slice(k, open).trim();
      const { body, end } = (() => {
        let depth = 0, j = open;
        for (; j < chunk.length; j++) {
          if (chunk[j] === "{") depth++;
          else if (chunk[j] === "}" && --depth === 0) break;
        }
        return { body: chunk.slice(open + 1, j), end: j + 1 };
      })();
      k = end;
      if (head.startsWith("@media")) {
        const conds = head.slice(6).split(/\band\b/).map((c) => c.trim()).filter(Boolean);
        parse(body, media.concat(conds.map((c) => {
          const m = /^\((min|max)-width:\s*(\d+)px\)$/.exec(c);
          /* a condition that is not a width (print, a colour scheme, reduced motion) is not read: its rules are taken as
             never applying, which is the right answer for a width probe and leaves the editor's own rules, which carry
             only widths, as the whole of the reading */
          return m ? { kind: m[1], px: +m[2] } : { kind: "never", px: 0 };
        })));
      } else if (head.startsWith("@")) {
        /* @font-face, @keyframes and the like: nothing here is about the editor */
      } else {
        const decl = {};
        body.split(";").forEach((d) => {
          const c = d.indexOf(":");
          if (c > 0) decl[d.slice(0, c).trim()] = d.slice(c + 1).trim();
        });
        head.split(",").forEach((sel) => rules.push({ sel: sel.replace(/\s*>\s*/g, ">").replace(/\s+/g, " ").trim(), media, decl }));
      }
    }
  };
  parse(src, []);
  return rules;
}
const RULES = readRules(html);
const holds = (r, w) => r.media.every((m) => (m.kind === "min" ? w >= m.px : m.kind === "max" ? w <= m.px : false));
/* what the cascade gives a box at a width: the declarations of every rule naming one of `sels`, later over earlier */
function styleAt(w, sels) {
  const out = {};
  RULES.forEach((r) => { if (sels.indexOf(r.sel) >= 0 && holds(r, w)) Object.assign(out, r.decl); });
  return out;
}
const EDITOR = ["#cardEditor", ".pane#cardEditor", ".cols>#cardEditor", ".cols>.pane#cardEditor"];
const EDITOR_SC = EDITOR.map((s) => s + ">.sc");
const px = (v) => { const m = /^(-?\d+(?:\.\d+)?)px$/.exec(String(v || "")); return m ? +m[1] : null; };
const summary = (o) => JSON.stringify(o);

function main() {
  const wide = styleAt(1100, EDITOR), narrow = styleAt(1099, EDITOR), huge = styleAt(1920, EDITOR);

  check(wide.position === "sticky" && huge.position === "sticky" && px(wide.top) === 16 && px(huge.top) === 16,
    "stk1 from 1100px the editor is sticky, 16px from the top: at 1100 " + summary({ p: wide.position, top: wide.top })
    + ", at 1920 " + summary({ p: huge.position, top: huge.top }));

  check(!narrow.position || narrow.position === "static",
    "stk2 at 1099px the editor is not pinned: " + summary({ p: narrow.position, top: narrow.top }));

  check(wide["align-self"] === "start" && huge["align-self"] === "start",
    "stk3 the editor aligns to the start of its row, which a sticky grid item needs to move: " + summary({ a: wide["align-self"] }));

  const cap = /^calc\(\s*100vh\s*-\s*(\d+)px\s*\)$/.exec(wide["max-height"] || "");
  /* what always surrounds #main: the band (--band-h), the chrome row (9 + 32 + 9 padding and field, and its 1px line) and the
     pad's top and bottom 16 */
  const band = px((RULES.find((r) => r.sel === ":root" && r.decl["--band-h"]) || { decl: {} }).decl["--band-h"]);
  const floor = (band == null ? NaN : band) + (9 + 32 + 9 + 1) + 32;
  check(!!cap && +cap[1] >= floor && !!huge["max-height"],
    "stk4 the height is capped at the window less at least what is always around #main (" + floor + "px): "
    + JSON.stringify(wide["max-height"] || null));

  const sc = styleAt(1100, EDITOR_SC);
  check(wide.display === "flex" && wide["flex-direction"] === "column" && /^(auto|scroll)$/.test(sc.overflow || sc["overflow-y"] || "")
      && sc["min-height"] === "0",
    "stk5 the fields scroll inside the box (a flex column, the scrolling child allowed to shrink): "
    + summary({ display: wide.display, dir: wide["flex-direction"], sc }));

  const scroller = styleAt(1100, [".va .main", ".main", "#main"]);
  /* .pane is overflow:hidden for its own corners; it is the sticky box here, not an ancestor of it, so it is not read */
  const ancestors = styleAt(1100, [".pad", ".cols"]);
  const aClips = ["overflow", "overflow-x", "overflow-y", "contain"].filter((k) => ancestors[k] && !/^(visible|none)$/.test(ancestors[k]));

  const { page: P, node } = loadPage({ uiLang: "en", source: appSource });
  const draft = {
    langs: [{ code: "en" }, { code: "pl" }],
    tags: [{ id: "s1", kind: "shelf", label: { en: "Delivery", pl: "Dostawa" } }],
    cards: [1, 2, 3].map((n) => ({ id: "c-" + n, shelf: "s1", title: { en: "Card " + n, pl: "Karta " + n },
      body: { en: "Text " + n, pl: "Tekst " + n }, requests: [] })),
  };
  P.S.open = { draft, awaiting: [], lint: { errors: 0, warnings: 0 } };
  P.S.screen = "project"; P.S.section = "cards"; P.S.sel = "c-2";
  P.paintCards();
  const main = node("#main").innerHTML;

  check(/^(auto|scroll)$/.test(scroller.overflow || scroller["overflow-y"] || "") && aClips.length === 0
      && /^<div class="pad">/.test(main),
    "stk6 #main is the scroller, .pad and .cols clip nothing, and the screen is a plain pad: scroller "
    + summary(scroller) + ", clipping " + summary(aClips) + ", opens " + JSON.stringify(main.slice(0, 22)));

  check(/<div class="cols"><div class="pane" style="min-width:0"><\/div><div class="pane" id="cardEditor"><h3 class="t">[^]*<\/h3><div class="row2 acts ed-acts">[^]*<\/div><div class="sc">/.test(main),
    "stk7 the editor is the second child of the screen's .cols, its acts sit under the heading, and its fields are in its direct .sc: "
    + JSON.stringify((/<div class="cols">[^]{0,140}/.exec(main) || [""])[0]));

  const cols = (w) => styleAt(w, [".cols"])["grid-template-columns"];
  check(cols(1099) === "1fr" && cols(1100) === "1fr 1fr" && cols(1920) === "1fr 1fr",
    "stk8 .cols is one column at 1099 and two from 1100: " + summary([cols(1099), cols(1100), cols(1920)]));

  check(asserted + 1 === EXPECTED, "stk9 every leg ran: " + (asserted + 1) + " of " + EXPECTED + " assertion(s)");
  process.stdout.write("editor-sticky: " + asserted + " assertion(s), " + failed + " failure(s)\n");
  process.exit(failed ? 1 : 0);
}

try { main(); }
catch (e) {
  process.stderr.write("  FAIL tests/editor-sticky.mjs threw: " + (e && e.stack || e) + "\n");
  process.exit(1);
}
