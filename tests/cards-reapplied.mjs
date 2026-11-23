/* FOUR OF polish-02-bugs' FIXES, RE-APPLIED ONTO MAIN'S REBUILT CARDS SCREEN (board 765, ledger item 18).
 *
 *     node tests/cards-reapplied.mjs
 *
 * The branch's own oracle, tests/cards-reach.mjs, opens a real window on its own split screen and cannot stand here: main kept its
 * own screen (retire, history, ticks, the tabs as open projects), so each fix is read at the place it now lives. Page behaviour
 * runs on tests/page-stand-in.mjs against the real verbs and a real project; the two stylesheet fixes are read the way
 * tests/editor-sticky.mjs on the sticky-editor branch reads one, by the cascade at a width. The fault numbers are the branch's
 * commit message's.
 *
 *   cra1  fault 18: New card with no title is refused in the verb's own words, on the cover, and leaves nothing behind (no card,
 *         no category made first); it used to return without a word
 *   cra2  CONTROL for cra1: a title still makes the card and closes the cover
 *   cra3  fault 23: the tab's and the Publish button's revision is the frame "rev {REV}", so the Polish tab says "wer." and the
 *         English one still says "rev", the number held to its word by a no-break space in both
 *   cra4  fault 10: a field's, a select's, a text area's and a tick box's edge is at least 3:1 against the surfaces it sits on
 *         (--bg, --panel, --chrome), in both themes
 *   cra5  CONTROL for cra4: the edge the canvas had (--field-line) is below 3:1 on the same surfaces, so the arithmetic can fail
 *   cra6  fault 8: the pane that holds the cards table scrolls sideways, so a table wider than its half (Polish, a card open)
 *         is reached rather than cut; and the table is that pane's direct child, which the rule's selector reads
 *   cra7  every leg ran
 *
 * WHAT IT CANNOT SEE, said rather than implied: that an edge looks like an edge, that the table scrolls under the thumb, and how
 * the Polish chip fits. Those are Maxim's eye. cra4 states the measure the eye reads, a contrast ratio of a border against the
 * ground it sits on, and not the look.
 *
 * PROVED BY MAKING IT FAIL: CRA_HTML=<a copy of ui/index.html> and CRA_APP=<a copy of ui/app.js> read those copies. Main's two
 * files redden cra1, cra3, cra4 and cra6 (cra2 and cra5 are green, being controls); a copy with the dark --edge darkened reddens
 * cra4; one with `.cbx` out of the rule's list, cra4; one with the table pane's rule out, cra6; an app.js with the old silent
 * `if (!name) return;`, cra1; one with the tab's old "rev" + NB, cra3.
 *
 * Node only, no window, no Electron. Exit 0 when every check holds, 1 when any fails.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as S from "../src/studio.mjs";
import { clearScratch } from "./scratch.mjs";
import { buildProject } from "./card-life-fixture.mjs";
import { loadPage } from "./page-stand-in.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const SCRATCH = path.join(ROOT, "scratch", "cards-reapplied");
const EXPECTED = 7;
const NB = String.fromCharCode(160);

let asserted = 0, failed = 0;
function check(cond, line) {
  asserted++;
  if (cond) process.stdout.write("  ok   " + line + "\n");
  else { failed++; process.stdout.write("  FAIL " + line + "\n"); }
}

const html = fs.readFileSync(process.env.CRA_HTML ? path.resolve(process.env.CRA_HTML) : path.join(ROOT, "ui", "index.html"), "utf8");
const appSource = process.env.CRA_APP ? fs.readFileSync(path.resolve(process.env.CRA_APP), "utf8") : undefined;

/* ---- a small cascade over the page's own <style>: rules in source order, each with the width conditions around it ---- */
function readRules(text) {
  const css = (/<style[^>]*>([\s\S]*?)<\/style>/.exec(text) || [])[1];
  if (css == null) throw new Error("no <style> in index.html");
  const src = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const rules = [];
  const parse = (chunk, media) => {
    let k = 0;
    while (k < chunk.length) {
      const open = chunk.indexOf("{", k);
      if (open < 0) break;
      const head = chunk.slice(k, open).trim();
      let depth = 0, j = open;
      for (; j < chunk.length; j++) {
        if (chunk[j] === "{") depth++;
        else if (chunk[j] === "}" && --depth === 0) break;
      }
      const body = chunk.slice(open + 1, j);
      k = j + 1;
      if (head.startsWith("@media")) {
        const conds = head.slice(6).split(/\band\b/).map((c) => c.trim()).filter(Boolean);
        /* a condition that is not a width (print, a colour scheme, reduced motion, `not all`) is read as never holding */
        parse(body, media.concat(conds.map((c) => {
          const m = /^\((min|max)-width:\s*(\d+)px\)$/.exec(c);
          return m ? { kind: m[1], px: +m[2] } : { kind: "never", px: 0 };
        })));
      } else if (!head.startsWith("@")) {
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
function styleAt(w, sels) {
  const out = {};
  RULES.forEach((r) => { if (sels.indexOf(r.sel) >= 0 && holds(r, w)) Object.assign(out, r.decl); });
  return out;
}
/* a theme's tokens: the light block, then the dark block over it */
const tokens = (dark) => Object.assign({}, styleAt(1280, [":root"]), dark ? styleAt(1280, [":root[data-theme=dark]"]) : {});
const lum = (hex) => {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
const hexOf = (t, name) => {          /* a token's colour, following var(--other) once */
  let v = t[name];
  const ref = /^var\((--[\w-]+)\)$/.exec(v || "");
  if (ref) v = t[ref[1]];
  return /^#[0-9a-f]{6}$/i.test(v || "") ? v : null;
};
const SURFACES = ["--bg", "--panel", "--chrome"];
const lowest = (dark, edge) => {
  const t = tokens(dark), e = hexOf(t, edge);
  if (!e) return { min: 0, why: "no " + edge };
  const all = SURFACES.map((s) => ({ s, r: hexOf(t, s) ? ratio(e, hexOf(t, s)) : 0 }));
  return { min: Math.min(...all.map((x) => x.r)), all: all.map((x) => x.s + " " + x.r.toFixed(2)).join(", ") };
};

const wire = (p) => Promise.resolve(p)
  .then((v) => JSON.parse(JSON.stringify(Object.assign({ error: null }, v))))
  .catch((e) => ({ error: e && e.message ? e.message : String(e), said: (e && e.said) || null, disk: !!(e && e.disk) }));

function apiOver() {
  const calls = [];
  const api = { calls };
  for (const k of ["addCard", "addTag", "deleteCard", "duplicateCard", "saveCard"])
    api[k] = (...a) => { calls.push(k + ":" + JSON.stringify(a.slice(1))); return wire(S[k](...a)); };
  return api;
}

async function main() {
  clearScratch(SCRATCH);
  const root = path.join(SCRATCH, "projects");
  fs.mkdirSync(root, { recursive: true });
  const { dir } = await buildProject(root);
  const cardsOnDisk = () => JSON.parse(fs.readFileSync(path.join(dir, "draft.json"), "utf8")).cards.length;
  const tagsOnDisk = () => JSON.parse(fs.readFileSync(path.join(dir, "draft.json"), "utf8")).tags.length;

  /* ---- fault 18: New card with no title ---------------------------------------------------------------------------- */
  const api = apiOver();
  const home = loadPage({ api, uiLang: "en", source: appSource });
  const P = home.page;
  const open = await wire(S.openProject(dir));
  Object.assign(P.S, { open, screen: "project", section: "cards", lang: "en", cover: "card", err: null });
  const cards0 = cardsOnDisk(), tags0 = tagsOnDisk();
  await P.ACTS["do-card-new"]();
  const dlg = home.node("#dlg").innerHTML;
  const refusal = /a card needs a title in en/.test(dlg);
  check(api.calls.length === 1 && /^addCard:\["","",""\]$/.test(api.calls[0]) && P.S.cover === "card" && refusal
      && cardsOnDisk() === cards0 && tagsOnDisk() === tags0,
    "cra1 an empty title is asked of the verb, which refuses it in its own words on the cover that stays open, and nothing is written: calls "
    + JSON.stringify(api.calls) + ", cover " + JSON.stringify(P.S.cover) + ", the cover says it " + refusal
    + ", cards " + cards0 + " -> " + cardsOnDisk() + ", tags " + tags0 + " -> " + tagsOnDisk());

  /* ---- the control: a title still makes the card ------------------------------------------------------------------- */
  const api2 = apiOver();
  const h2 = loadPage({ api: api2, uiLang: "en", source: appSource });
  Object.assign(h2.page.S, { open: await wire(S.openProject(dir)), screen: "project", section: "cards", lang: "en", cover: "card", err: null });
  /* the stand-in answers every selector with an element; the first-category input exists only on a catalog with no category */
  h2.doc.absent = new Set(["#newCardCatName"]);
  h2.node("#newCard").value = "A card made by the control";
  h2.node("#newCardCat").value = (open.draft.tags.find((t) => t.kind === "shelf") || {}).id;
  await h2.page.ACTS["do-card-new"]();
  check(api2.calls.length === 1 && /^addCard:\[".*","A card made by the control",""\]$/.test(api2.calls[0]) && h2.page.S.cover === null
      && cardsOnDisk() === cards0 + 1,
    "cra2 CONTROL: a title makes the card and closes the cover: calls " + JSON.stringify(api2.calls) + ", cover "
    + JSON.stringify(h2.page.S.cover) + ", cards " + cards0 + " -> " + cardsOnDisk());

  /* ---- fault 23: the revision chip is a frame ----------------------------------------------------------------------- */
  const chips = (lang) => {
    const h = loadPage({ api: apiOver(), uiLang: lang, source: appSource });
    /* with a folder, since the Publish chip stands beside Publish, which a project with none replaces (folder-check fc5) */
    const withFolder = Object.assign({}, open, { project: Object.assign({}, open.project, { folder: "C:/Share/team" }) });
    Object.assign(h.page.S, { open: withFolder, screen: "project", section: "cards", lang,
      tabs: [{ dir, name: "Proj", rev: 3 }] });
    h.page.paintTabs();
    h.page.paint();
    /* Since board 902 the chip may carry its dated edition in a title. */
    const tab = (/<span class="rev"[^>]*>([^<]*)<\/span>/.exec(h.node("#tabs").innerHTML) || [])[1];
    const pub = (/<span class="count">([^<]*)<\/span>/.exec(h.node("#chrome").innerHTML) || [])[1];
    return { tab, pub };
  };
  const en = chips("en"), pl = chips("pl");
  const rev = (open.project && open.project.rev | 0) + 1;
  check(en.tab === "rev" + NB + "3" && en.pub === "rev" + NB + rev && /^wer\.[ ]3$/.test(pl.tab || "")
      && new RegExp("^wer\\.[\\u00a0]" + rev + "$").test(pl.pub || ""),
    "cra3 the tab and the Publish chip say rev in English and wer. in Polish, the number held to its word: en "
    + JSON.stringify(en) + ", pl " + JSON.stringify(pl));

  /* ---- fault 10: the edge token -------------------------------------------------------------------------------------- */
  const edge = ["input.field", "select.field", "textarea.ta", ".cbx"];
  const edged = new Set(RULES.filter((r) => /^var\(--edge\)$/.test(r.decl["border-color"] || "")).map((r) => r.sel));
  const lightE = lowest(false, "--edge"), darkE = lowest(true, "--edge");
  check(edge.every((s) => edged.has(s)) && lightE.min >= 3 && darkE.min >= 3,
    "cra4 the four controls take --edge, and it is 3:1 or more on every surface: rule covers " + JSON.stringify(edge.filter((s) => edged.has(s)))
    + "; light [" + lightE.all + "]; dark [" + darkE.all + "]");

  const lightO = lowest(false, "--field-line"), darkO = lowest(true, "--field-line");
  check(lightO.min < 3 && darkO.min < 3,
    "cra5 CONTROL: the edge the canvas had is under 3:1 on the same surfaces: light " + lightO.min.toFixed(2) + ", dark " + darkO.min.toFixed(2));

  /* ---- fault 8: the table's pane scrolls sideways -------------------------------------------------------------------- */
  const PANES = [".cols>.pane:has(>table)", ".pad>.cols>.pane:has(>table)", "#main .cols>.pane:has(>table)", "#main .pad>.cols>.pane:has(>table)"];
  const pane = styleAt(1100, PANES), wide = styleAt(1920, PANES);
  Object.assign(P.S, { sel: ((open.draft.cards || [])[0] || {}).id, cover: null, err: null });
  P.paintCards();
  const holder2 = home.node("#main .pad > .cols > .pane");
  const direct = holder2.children.some((c) => c && (c.tagName === "TABLE" || c.__rows));
  check(/^(auto|scroll)$/.test(pane["overflow-x"] || pane.overflow || "") && /^(auto|scroll)$/.test(wide["overflow-x"] || wide.overflow || "") && direct,
    "cra6 the pane holding the cards table scrolls sideways from 1100, and the table is its direct child: " + JSON.stringify([pane, direct]));

  check(asserted + 1 === EXPECTED, "cra7 every leg ran: " + (asserted + 1) + " of " + EXPECTED + " assertion(s)");
  process.stdout.write("cards-reapplied: " + asserted + " assertion(s), " + failed + " failure(s)\n");
  process.exit(failed ? 1 : 0);
}

main().catch((e) => {
  process.stderr.write("  FAIL tests/cards-reapplied.mjs threw: " + (e && e.stack || e) + "\n");
  process.exit(1);
});
