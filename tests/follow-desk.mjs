/* THE TOUR AND THE MAXIMISE BUTTON FOLLOW THE DESK, AND THE STATUS BAR SAYS A PUBLISH (Maxim, 2026-10-08 12:56: "With Studio
 * tour and maximize button, follow the desk."; board 873c).
 *
 *     node tests/follow-desk.mjs
 *
 * Node only, no window: the sheet and the markup are read as text, the desk's own from the pinned engine's page, and the page's
 * code runs on tests/page-stand-in.mjs. Claims, one section each:
 *   1  the tour darkens nothing and holds nothing: its ring is the desk's ring, no rule of the tour darkens what is around it,
 *      nothing of it but the panel takes a pointer, the panel is not modal, and the tour stands down while a cover is up, as
 *      the desk's goes behind its windows (the places cannot open under the tour: placesOpen)
 *   2  the tour's keys are its own only while the keyboard is in its panel; elsewhere Tab and Escape are the page's
 *   3  a paint while the tour stands places it again, without scrolling, and never in the middle of showing a step
 *   4  the maximise button pictures the window's state: two glyphs, the desk's own, one shown by the body's class, and its name
 *      Maximise or Restore, in the desk's words in both languages (the shell's half is tests/shell-guards.mjs 13)
 *   5  after a publish lands the status bar says the rev that went out, until the next save; a refused publish and another
 *      project say what they said before
 * The window legs that read the same things are tests/tour.mjs (5c, the keys, and 3, the walk) and the press's window legs.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadPage } from "./page-stand-in.mjs";
import { clearScratch, dropScratch } from "./scratch.mjs";
import * as Studio from "../src/studio.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const EXPECTED = 26;
const NB = String.fromCharCode(160);

let asserted = 0, failed = 0;
function check(cond, line) {
  asserted++;
  if (cond) process.stdout.write("  ok   " + line + "\n");
  else { failed++; process.stderr.write("  FAIL " + line + "\n"); }
}
const settle = (ms) => new Promise((r) => setTimeout(r, ms || 10));
const thrown = [];
process.on("unhandledRejection", (e) => { thrown.push(String(e && e.stack || e).slice(0, 300)); });

/* ---- the sheet, as rules ----------------------------------------------------------------------- */
function cssOf(html) {
  const a = html.search(/<style[^>]*>/), b = html.indexOf("</style>");
  if (a < 0 || b < a) throw new Error("follow-desk: no <style> in the page");
  return html.slice(html.indexOf(">", a) + 1, b);
}
function rulesOf(css) {
  const out = [];
  const walk = (text) => {
    let i = 0;
    while (i < text.length) {
      const open = text.indexOf("{", i);
      if (open < 0) break;
      const head = text.slice(i, open).trim();
      let depth = 1, j = open + 1;
      while (j < text.length && depth > 0) { if (text[j] === "{") depth++; else if (text[j] === "}") depth--; j++; }
      const body = text.slice(open + 1, j - 1);
      if (head.startsWith("@") && /\{/.test(body)) walk(body);
      else out.push({ sel: head.replace(/\s+/g, " "), decls: body.replace(/\s+/g, " ") });
      i = j;
    }
  };
  walk(css.replace(/\/\*[\s\S]*?\*\//g, ""));
  return out;
}
const decl = (d, prop) => {
  const m = new RegExp("(?:^|;)\\s*" + prop.replace(/-/g, "\\-") + "\\s*:\\s*([^;]+)", "i").exec(d);
  return m ? m[1].replace(/!important/i, "").trim() : null;
};
/** The tour's rules: every rule whose selector names one of its parts. */
const TOUR_SEL = /#tour(?:Root|Hole|Shade|Card)\b|\.tour-(?:hole|shade|card)\b/;
/** What darkens in a set of rules: a shadow reaching past the window, or a full-bleed box with a visible tint (by var or rgba). */
function darkening(rules) {
  return rules.filter((r) => {
    const shadow = /box-shadow\s*:[^;]*\b\d{4,}px/i.test(r.decls);
    const bg = decl(r.decls, "background") || decl(r.decls, "background-color") || "";
    const alpha = (/rgba?\(([^)]*)\)/i.exec(bg) || [])[1];
    const tinted = /var\(--tour-scrim\)/.test(bg) || (alpha != null && parseFloat(alpha.split(/[,/]/)[3] || "1") >= 0.15);
    return shadow || tinted;
  }).map((r) => r.sel);
}
/** What takes a pointer among the tour's parts, the panel apart. */
const holding = (rules) => rules.filter((r) => TOUR_SEL.test(r.sel) && !/tour-card|#tourCard/.test(r.sel)
  && /^auto$/.test(decl(r.decls, "pointer-events") || "")).map((r) => r.sel);

const PAGE = fs.readFileSync(path.join(ROOT, "ui", "index.html"), "utf8");
const DESK_AT = path.join(ROOT, "engine", "pinned", "engine", "etiuda.html");
if (!fs.existsSync(DESK_AT)) throw new Error("follow-desk: no pinned engine page; run node tools/engine-fetch.mjs");
const DESK = fs.readFileSync(DESK_AT, "utf8");
const css = cssOf(PAGE), rules = rulesOf(css), deskRules = rulesOf(cssOf(DESK));
const tourRules = rules.filter((r) => TOUR_SEL.test(r.sel));

/* ---- 1. the tour, from the sheet and the markup ------------------------------------------------- */
{
  const ringOf = (rs) => { const r = rs.find((x) => x.sel === ".tour-hole"); return r ? decl(r.decls, "box-shadow") : null; };
  const ring = ringOf(rules), deskRing = ringOf(deskRules);
  check(!!deskRing && ring === deskRing,
    "1a the ring is the desk's, read from the pinned page: " + JSON.stringify(ring) + " against " + JSON.stringify(deskRing));
  const dark = darkening(tourRules);
  check(tourRules.length >= 4 && dark.length === 0 && !/--tour-scrim/.test(css),
    "1b no rule of the tour darkens anything (" + tourRules.length + " rules read)" + (dark.length ? ": " + dark.join(", ") : ""));
  const held = holding(rules);
  const shade = /id="tourShade"|class="tour-shade"/.test(PAGE) || rules.some((r) => /tour-shade|#tourShade/.test(r.sel));
  const card = (/<div class="tour-card bub" id="tourCard"[^>]*>/.exec(PAGE) || [""])[0];
  check(held.length === 0 && !shade && /aria-modal="false"/.test(card),
    "1c nothing of the tour but its panel takes a pointer, there is no shade, and the panel is not modal: held "
    + JSON.stringify(held) + ", shade " + shade + ", " + JSON.stringify(card.replace(/\s+/g, " ")));
  const down = (what) => rules.some((r) => r.sel.split(",").some((s) => s.includes(":root:has(" + what + ":not([hidden]))")
    && /#tourRoot$/.test(s.trim())) && decl(r.decls, "visibility") === "hidden");
  check(down("#scrim"), "1d the tour stands down while a cover is up: " + down("#scrim"));
  /* controls: the same readers over a doctored sheet */
  const old = rulesOf(css + "\n.tour-hole{box-shadow:0 0 0 9999px rgba(8,12,20,.739),0 0 0 2.5px var(--bub)}"
    + "\n#tourRoot.no-hole .tour-shade{background:rgba(8,12,20,.739)}\n");
  const oldDark = darkening(old.filter((r) => TOUR_SEL.test(r.sel)));
  check(oldDark.length - dark.length === 2 && oldDark.includes(".tour-hole") && oldDark.includes("#tourRoot.no-hole .tour-shade"),
    "1E CONTROL: the old spotlight shadow and the old fallback shade, planted, are each found: " + JSON.stringify(oldDark));
  const oldHeld = holding(rulesOf(css + "\n#tourRoot.on{pointer-events:auto}\n"));
  check(oldHeld.length - held.length === 1 && oldHeld.includes("#tourRoot.on"), "1F CONTROL: a root that takes the pointer, planted, is found: " + JSON.stringify(oldHeld));
}

/* ---- the page on the stand-in ------------------------------------------------------------------ */
function page(o) {
  const home = loadPage(Object.assign({ source: fs.readFileSync(path.join(ROOT, "ui", "app.js"), "utf8") }, o || {}));
  const P = home.page;
  P.S.host = { tour: { offered: true }, version: "0.0.0" };
  return { home, P };
}
const keyEvent = (key, o) => Object.assign({ key, shiftKey: false, ctrlKey: false, altKey: false, metaKey: false, prevented: false,
  target: null, preventDefault() { this.prevented = true; }, stopPropagation() {} }, o || {});

/* ---- 2. the keys --------------------------------------------------------------------------------- */
{
  const { home, P } = page();
  const doc = home.doc;
  /* The tour's own listener is the one that reads its panel; the page's listener also closes the tour, for Ctrl+Shift+M (sense D). */
  const tourKeys = doc.heard.filter((h) => h.type === "keydown" && /tourClose\(false\)/.test(String(h.fn)) && /tourCard/.test(String(h.fn)));
  check(tourKeys.length === 1, "2a the tour's one key listener is found on the document: " + tourKeys.length);
  const press = (key, o) => { const e = keyEvent(key, o); if (tourKeys[0]) tourKeys[0].fn(e); return e; };
  const card = home.node("#tourCard"), inside = { id: "tourNext" }, outside = { id: "q" };
  card.contains = (el) => el === inside;
  ["#tourSkip", "#tourPrev", "#tourNext"].forEach((s) => { home.node(s).hidden = false; });
  P.S.tour = 2; doc.focused = outside;
  const tabOut = press("Tab"), arrowOut = press("ArrowRight"), escOut = press("Escape");
  check(!tabOut.prevented && !arrowOut.prevented && !escOut.prevented && P.S.tour === 2,
    "2b with the keyboard on the page, Tab, an arrow and Escape are the page's and the tour stands: prevented "
    + [tabOut.prevented, arrowOut.prevented, escOut.prevented].join("/") + ", step " + P.S.tour);
  doc.focused = inside;
  const tabIn = press("Tab");
  check(tabIn.prevented && P.S.tour === 2, "2c with the keyboard in the panel, Tab walks the panel: prevented " + tabIn.prevented);
  const escIn = press("Escape");
  check(escIn.prevented && P.S.tour === null, "2d and Escape there skips the tour: prevented " + escIn.prevented + ", step " + P.S.tour);
  doc.focused = null;
  P.S.tour = null;
  const idle = press("Tab");
  check(!idle.prevented, "2E CONTROL: with no tour, the listener leaves Tab alone");
}

/* ---- 3. placed again after a paint ---------------------------------------------------------------- */
{
  const { P } = page();
  const placed = [];
  const set = (n, v) => { try { P.__set(n, v); } catch (e) { thrown.push("no " + n + " in the page"); } };
  set("tourPaint", (scroll) => { placed.push(scroll); return Promise.resolve(null); });
  P.S.tour = 3;
  P.paint();
  check(placed.length === 1 && placed[0] === false, "3a a paint while the tour stands places it again, without scrolling: " + JSON.stringify(placed));
  placed.length = 0;
  set("tourBusy", true);
  P.paint();
  check(placed.length === 0, "3b and not while a step is being shown: " + JSON.stringify(placed));
  set("tourBusy", false);
  P.S.tour = null;
  P.paint();
  check(placed.length === 0, "3C CONTROL: with no tour a paint places nothing: " + JSON.stringify(placed));
}

/* ---- 4. the maximise button ----------------------------------------------------------------------- */
{
  const { home, P } = page();
  const cls = new Set();
  home.doc.body.classList = { add: (c) => cls.add(c), remove: (c) => cls.delete(c), toggle: (c, on) => { if (on) cls.add(c); else cls.delete(c); },
    contains: (c) => cls.has(c) };
  const max = home.node("#winMax");
  const say = typeof P.winMaxSay === "function" ? P.winMaxSay : (() => {});
  say(true);
  const up = { max: cls.has("s-max"), title: max.title, label: max.getAttribute("aria-label") };
  say(false);
  const down = { max: cls.has("s-max"), title: max.title, label: max.getAttribute("aria-label") };
  check(typeof P.winMaxSay === "function" && up.max && up.title === "Restore" && up.label === "Restore"
    && !down.max && down.title === "Maximise" && down.label === "Maximise",
    "4a the window's state reaches the button: maximised " + JSON.stringify(up) + ", restored " + JSON.stringify(down));
  const pl = page({ uiLang: "pl" });
  const plMax = pl.home.node("#winMax");
  if (typeof pl.P.winMaxSay === "function") { pl.P.winMaxSay(true); }
  const plUp = plMax.title;
  if (typeof pl.P.winMaxSay === "function") { pl.P.winMaxSay(false); }
  const plDown = plMax.title;
  const deskPl = fs.readFileSync(path.join(ROOT, "engine", "pinned", "src", "modules", "ui-lang.js"), "utf8");
  const deskSays = (en) => (new RegExp('"' + en + '":"([^"]*)"').exec(deskPl) || [])[1];
  check(plUp === deskSays("Restore") && plDown === deskSays("Maximise") && !!plUp && !!plDown,
    "4b in Polish the button says the desk's words: " + JSON.stringify([plUp, plDown]) + " against " + JSON.stringify([deskSays("Restore"), deskSays("Maximise")]));
  /* the glyphs: Studio's button holds the desk's two, and the sheet shows one by the body's class */
  const shapes = (html, cls_) => (new RegExp('<svg class="ic ' + cls_ + '"[^>]*>([\\s\\S]*?)</svg>').exec(html) || [])[1] || null;
  const deskBtn = (/<button[^>]*id="winMax"[\s\S]*?<\/button>/.exec(DESK) || [""])[0];
  const ourBtn = (/<button[^>]*id="winMax"[\s\S]*?<\/button>/.exec(PAGE) || [""])[0];
  const same = ["win-g-max", "win-g-restore"].map((c) => shapes(ourBtn, c) !== null && shapes(ourBtn, c) === shapes(deskBtn, c));
  check(same[0] && same[1], "4c the button holds the desk's two glyphs, shape for shape: max " + same[0] + ", restore " + same[1]);
  const hides = (sel) => rules.some((r) => r.sel.split(",").map((s) => s.trim()).includes(sel) && decl(r.decls, "display") === "none");
  check(hides("body:not(.s-max) #winMax .win-g-restore") && hides("body.s-max #winMax .win-g-max"),
    "4d the sheet shows the restore glyph only under body.s-max and the maximise glyph only without it: "
    + hides("body:not(.s-max) #winMax .win-g-restore") + ", " + hides("body.s-max #winMax .win-g-max"));
  /* A language changed while maximised reaches the button only through the band's paint, which names it from the state it holds. */
  say(true);
  try { await P.ACTS["set-lang"]({ getAttribute: () => "pl" }); } catch (e) { thrown.push("set-lang: " + String(e && e.stack || e).slice(0, 300)); }
  check(max.title === deskSays("Restore") && max.getAttribute("aria-label") === deskSays("Restore") && cls.has("s-max"),
    "4e the language changed while maximised, the button says Restore in Polish: " + JSON.stringify([max.title, max.getAttribute("aria-label")]));
}

/* ---- 5. the status bar after a publish ------------------------------------------------------------- */
/* A real project, made by Studio's own verbs in this leg's scratch, and opened as the shell hands it over; its rev is set to
   the one the stand-in's publish answers, which is all of the publish this section is about. */
const SCRATCH = path.join(ROOT, "scratch", "follow-desk");
clearScratch(SCRATCH);
fs.mkdirSync(SCRATCH, { recursive: true });
const MADE = (await Studio.newProject(SCRATCH, "Mirabelka", [{ code: "en", name: "English" }, { code: "pl", name: "Polish" }])).dir;
const wire = (p) => Promise.resolve(p).then((v) => JSON.parse(JSON.stringify(Object.assign({ error: null }, v))));
const openAt = async (dir, rev) => { const o = await wire(Studio.openProject(MADE)); o.dir = dir; o.project.rev = rev; return o; };
async function publishOnce(o) {
  const DIR = "C:\\Projects\\Mirabelka", OTHER = "C:\\Projects\\Ogrod";
  const api = {
    publish: async () => (o.refuse ? { error: null, refused: true, said: "moved" } : { error: null, rev: 8, edition: "2026-10-16a", ec: DIR + "\\out\\m.ec",
      folder: DIR + "\\out" }),
    open: (dir) => openAt(dir, o.refuse ? 7 : 8),
    projects: async () => ({ error: null, root: "C:\\Projects", projects: [] }),
    tour: async () => ({ error: null }),
  };
  const { home, P } = page({ api, uiLang: o.lang });
  P.__set("prGo", async () => {});
  P.S.screen = "project";
  P.S.open = await openAt(DIR, 7);
  P.S.tabs = [{ dir: DIR, name: "Mirabelka", rev: 7 }];
  P.S.cover = "publish";
  P.S.plan = { dir: DIR, next: 8, lint: { errors: 0 }, langs: ["en"] };
  const before = P.statusLeftHtml();
  try { await P.ACTS["do-publish"](); } catch (e) { thrown.push("do-publish: " + String(e && e.stack || e).slice(0, 300)); }
  await settle(30);
  const after = P.statusLeftHtml();
  const out = { before, after, P, home, DIR, OTHER };
  return out;
}
const stateOf = (html) => (/<span class="sb-st" data-state="(\w+)">([^<]*)<\/span>/.exec(html) || []).slice(1).join(" ");

const landed = await publishOnce({});
check(/draft saved/.test(stateOf(landed.before)) && stateOf(landed.after) === "saved published rev 8 (2026-10-16a)",
  "5a after the press lands the bar says the rev that went out: before " + JSON.stringify(stateOf(landed.before))
  + ", after " + JSON.stringify(stateOf(landed.after)));
{
  const P = landed.P;
  const was = P.S.open;
  P.S.open = Object.assign({}, was, { dir: landed.OTHER });
  const other = stateOf(P.statusLeftHtml());
  P.S.open = was;
  check(other === "saved draft saved", "5b another project's bar says what it said before: " + JSON.stringify(other));
  P.S.saving++; P.paintStatus(); P.S.saving--; P.paintStatus();
  const edited = stateOf(P.statusLeftHtml());
  check(edited === "saved draft saved", "5c the next save makes it the draft's again: " + JSON.stringify(edited));
}
const refused = await publishOnce({ refuse: true });
check(stateOf(refused.after) === "saved draft saved",
  "5D CONTROL: a publish the folder refused leaves the bar as it was: " + JSON.stringify(stateOf(refused.after)));
const pl = await publishOnce({ lang: "pl" });
check(stateOf(pl.after) === "saved wersja" + NB + "8 (2026-10-16a) opublikowana",
  "5e in Polish: " + JSON.stringify(stateOf(pl.after)));

dropScratch(SCRATCH, "tests/follow-desk.mjs");
check(thrown.length === 0, "6 nothing the page ran threw on the stand-in" + (thrown.length ? ": " + thrown.join(" | ") : ""));
check(asserted + 1 === EXPECTED, "7 every leg ran: " + (asserted + 1) + " of " + EXPECTED + " assertion(s)");
process.stdout.write("follow-desk: " + asserted + " assertion(s), " + failed + " failure(s)\n");
process.exit(failed ? 1 : 0);
