/* THE PROJECTS LIST, BOARD 831. The Written to cell keeps one line per fact and fades at the end,
 * the first-run invitation is the blue bubble hung off the Menu button, and the name field shows the
 * whole name.
 *
 *     node tests/projects-band.mjs
 *
 * Node only, on the page stand-in (tests/page-stand-in.mjs). It reads the painted markup and the sheet.
 *   c  the Written to lines are in the cut pass and carry no ellipsis. Each stays one line, and the
 *      whole path is the cell's title and each line's, which is what a hover reads
 *   b  the invitation is the blue bubble in the page, hung off the Menu button, and the projects
 *      paint does not write a band
 *   n  the name field's value and its title are the whole name, and the column's floor holds the two
 *      names the sheet clipped
 *   w  Written to's floor is 210px, which holds one line of the empty folder at both cell paddings
 *   a  Last asked's heading and its cells share one hook. It is hidden below 995 and from 1100
 *      to 1286, and shown from 995 to 1099 and from 1287, and no later rule shows it again
 */
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { loadPage } from "./page-stand-in.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const SHEET = fs.readFileSync(path.join(ROOT, "ui", "index.html"), "utf8");
const APP = fs.readFileSync(path.join(ROOT, "ui", "app.js"), "utf8");

let failures = 0, legs = 0;
function check(ok, what) { legs++; if (!ok) failures++; console.log((ok ? "  ok   " : "  FAIL ") + what); }

/* The sheet's rules, comments taken out, each selector with its declarations. */
function rulesOf(html) {
  const a = html.indexOf("<style>"), b = html.indexOf("</style>");
  const css = html.slice(a, b).replace(/\/\*[\s\S]*?\*\//g, "");
  const out = [];
  const re = /([^{}]+)\{([^{}]*)\}/g;
  for (let m; (m = re.exec(css));) {
    const body = m[2].replace(/\s+/g, "");
    m[1].split(",").forEach((s) => {
      const sel = s.trim().replace(/\s+/g, " ");
      if (sel) out.push({ sel, body });
    });
  }
  return out;
}
const rules = rulesOf(SHEET);
const bodyOf = (sel) => (rules.find((r) => r.sel === sel) || { body: "" }).body;
const hasDecl = (sel, decl) => bodyOf(sel).indexOf(decl) >= 0;

const B = String.fromCharCode(92);
const text = (h) => String(h == null ? "" : h).replace(/<[^>]*>/g, "").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'");

/* ---- c. one line each, the whole path on hover ------------------------------------------------ */

const FILE_HYPHEN = "obsluga-klienta-sklep-internetowy.ec";
const FILE_WORD = "CustomerCareEnglishDesksNorthTeam.ec";
const FOLDER_HYPHEN = B + B + "serwer-biuro" + B + "wspolne" + B + "Katalogi zespolu";
const FOLDER_WORD = "D:" + B;
const spanOf = (raw, cls) => {
  const m = new RegExp('<span class="' + cls + '"([^>]*)>([^<]*)</span>').exec(raw || "");
  if (!m) return { text: "", title: null };
  const t = /title="([^"]*)"/.exec(m[1]);
  return { text: text(m[2]), title: t ? text(t[1]) : null };
};
const cell = (h) => {
  const td = /<td class="wt"(?: title="([^"]*)")?>([\s\S]*?)<\/td>/.exec(h) || [];
  const file = spanOf(td[2], "mono wt-f");
  const where = spanOf(td[2], "wt-in");
  return {
    title: td[1] === undefined ? null : text(td[1]),
    file: file.text, where: where.text, fileTitle: file.title, whereTitle: where.title,
    raw: td[2] || "",
  };
};
/* The cut pass's own list, read the way tests/fade-off.mjs reads it. */
const cutList = () => {
  const m = /const CUT_SEL = ([^;]+);/.exec(APP);
  if (!m) return [];
  try { return String(vm.runInNewContext(m[1])).split(",").map((s) => s.trim()); }
  catch (e) { return []; }
};
const LINES = ["#main .projects .desk .wt-f", "#main .projects .wt-in"];
/* c1 READS THE CASCADE (the test architect lambda's condition on 47cfe10: a later rule breaking the file name mid-word
 * left the leg green). Every rule in the sheet that can reach a Written to line itself is found, media rules included,
 * by a plain descendant matcher over the line's real ancestors: a child combinator is read as a descendant, a
 * pseudo-class or an attribute test as matching, the html and body elements as holding every class the sheet gives them, and a rule for a
 * pseudo-element as not reaching the line. Over-matching only makes the leg stricter. None of the rules found may let
 * the line wrap: every white-space it meets is nowrap, every overflow-wrap normal, no word-break breaks a word, no
 * ellipsis, and one of them clips it. */
const compound = (s) => {
  if (/::/.test(s)) return null;
  const not = [...s.matchAll(/:not\(\.([\w-]+)\)/g)].map((m) => m[1]);
  const bare = s.replace(/:not\([^)]*\)/g, "").replace(/\[[^\]]*\]/g, "").replace(/:[\w-]+(\([^)]*\))?/g, "");
  return { tag: ((/^[a-z][\w-]*/i.exec(bare) || [""])[0]).toLowerCase(), not,
    ids: [...bare.matchAll(/#([\w-]+)/g)].map((m) => m[1]), cls: [...bare.matchAll(/\.([\w-]+)/g)].map((m) => m[1]) };
};
const fits = (c, el) => !!c && (!c.tag || c.tag === "*" || c.tag === el.tag) && c.ids.every((i) => el.id === i)
  && c.cls.every((k) => el.cls.indexOf(k) >= 0) && c.not.every((k) => el.cls.indexOf(k) < 0);
const reaches = (sel, el, up) => {
  const parts = sel.replace(/\s*[>+~]\s*/g, " ").split(" ").filter(Boolean).map(compound);
  if (!fits(parts[parts.length - 1], el)) return false;
  let j = up.length - 1;
  for (let i = parts.length - 2; i >= 0; i--) {
    while (j >= 0 && !fits(parts[i], up[j])) j--;
    if (j < 0) return false;
    j--;
  }
  return true;
};
/* The line's ancestors as projectsPaint and writtenTo write them, outermost first. The html and body elements hold
 * every class the sheet ever gives them (a selector that begins at :root, html or body), as any may be on at once. */
const rootCls = (re) => [...new Set(rules.filter((r) => re.test(r.sel.split(" ")[0]))
  .flatMap((r) => [...r.sel.split(" ")[0].replace(/:not\([^)]*\)/g, "").matchAll(/\.([\w-]+)/g)].map((m) => m[1])))];
const UP = [{ tag: "html", cls: rootCls(/^(:root|html)/) }, { tag: "body", cls: rootCls(/^body/) }, { tag: "div", id: "main", cls: [] },
  { tag: "div", cls: ["pad", "projects"] }, { tag: "div", cls: ["pane"] }, { tag: "table", cls: [] }, { tag: "tr", cls: [] },
  { tag: "td", cls: ["wt"] }, { tag: "span", cls: ["desk"] }, { tag: "span", cls: ["wt-l"] }];
const ELS = [{ tag: "span", cls: ["mono", "wt-f"] }, { tag: "span", cls: ["wt-in"] }];
const valuesOf = (rs, prop) => rs.map((r) => (new RegExp("(?:^|;)" + prop + ":([^;]*)").exec(r.body) || [])[1])
  .filter((v) => v !== undefined).map((v) => v.replace(/!important$/, ""));
const holds = (el) => {
  const rs = rules.filter((r) => reaches(r.sel, el, UP));
  const ws = valuesOf(rs, "white-space"), wrap = valuesOf(rs, "overflow-wrap").concat(valuesOf(rs, "word-wrap"));
  const ok = ws.length > 0 && ws.every((v) => v === "nowrap") && wrap.every((v) => v === "normal")
    && valuesOf(rs, "word-break").every((v) => v === "normal" || v === "keep-all")
    && valuesOf(rs, "overflow").indexOf("hidden") >= 0 && valuesOf(rs, "text-overflow").every((v) => !/ellipsis/.test(v));
  return { ok, sels: rs.map((r) => r.sel) };
};
const cuts = cutList();
const held = ELS.map(holds);
check(LINES.every((sel) => cuts.indexOf(sel) >= 0) && held.every((h) => h.ok),
  "c1 the two Written to lines are in the cut pass, and no rule that reaches either, in sheet order, lets it wrap or ends it in an ellipsis: "
  + JSON.stringify(LINES.map((sel, i) => ({ sel: sel, inCut: cuts.indexOf(sel) >= 0, ok: held[i].ok, rules: held[i].sels }))));
check(hasDecl("#main .projects td.wt", "max-width:0") && hasDecl("#main .projects td.wt", "width:22%"),
  "c2 the column takes 22 per cent and may shrink, so it does not push Open: " + bodyOf("#main .projects td.wt"));

const home = loadPage({ api: null, uiLang: "en" });
const P = home.page;
P.S.screen = "projects";
P.S.home = "library";
const proj = (dir, name, folder, fileName) => ({
  dir, name, folder, fileName, counts: { cards: 1 }, rev: fileName ? 2 : 0,
  published: fileName ? "2026-10-09T09:40:00Z" : null, lastEdition: "", requested: null,
});

/* ---- b. the blue bubble, unchanged ------------------------------------------------------------ */

/* The invitation on Studio main: a fixed bubble after the band, not a band the projects paint writes. */
const BUBBLE_MARK = 'id="tourInvite" class="bub" hidden role="dialog" aria-labelledby="tourInviteTitle"';
const BUBBLE_NOTE = "It hangs off the Menu button, as the desk's hangs off its settings button";
const BUBBLE_CSS = "THE INVITE, the same panel with its own words, hung off the Menu button.";
const COVER_CSS = "A COVER IS IN FRONT OF THE INVITE AND UNDER IT AT ONCE";
P.S.host = { tour: { offered: false, taken: false, at: 0 } };
P.S.projects = [
  proj("C:" + B + "p" + B + "a", "A", FOLDER_HYPHEN, FILE_HYPHEN),
];
P.S.screen = "projects";
P.paintMain();
const mainOn = home.node("#main").innerHTML;
const paintAt = APP.indexOf("function tourInvitePaint");
const paintFn = paintAt < 0 ? "" : APP.slice(paintAt, paintAt + 900);
check(SHEET.indexOf(BUBBLE_MARK) >= 0 && SHEET.indexOf(BUBBLE_NOTE) >= 0
  && SHEET.indexOf(BUBBLE_CSS) >= 0 && SHEET.indexOf(COVER_CSS) >= 0
  && SHEET.indexOf("#tourInvite.in-flow") < 0 && SHEET.indexOf("THE INVITE is not here") < 0
  && APP.indexOf("function tourBand") < 0 && APP.indexOf("function tourOffer") < 0
  && APP.indexOf("tourBand()") < 0 && APP.indexOf('class="bub in-flow"') < 0
  && APP.indexOf("The invite hangs off a band") >= 0
  && APP.indexOf('$("#tourInvite").hidden = true;') >= 0
  && APP.indexOf('else if ($("#tourInvite") && !$("#tourInvite").hidden) tourInvitePaint();') >= 0
  && paintFn.indexOf('const b = $("#btnMenu").getBoundingClientRect();') >= 0
  && paintFn.indexOf("tourPlace(inv, { top: b.top, left: b.left, width: b.width, height: b.height }, { width: 300 });") >= 0
  && mainOn.indexOf("tourInvite") < 0,
  "b1 the invitation is the blue bubble hung off the Menu button, and the projects page paints no band");

/* ---- n. the name, whole ----------------------------------------------------------------------- */

/* Claudia's shot clipped these to "Obsługa klienta, sklep intern" and "Customer care, English desk:"
 * (the colon is the field's edge in the shot; the name the sheet was drawn from has no colon).
 * Segoe UI at 13.5px, System.Drawing MeasureString, ClearType: the Polish name is 215.5px of ink and
 * the English 181.6. The cell pads 14px a side and the field pads 10px and borders 1px a side, 50px
 * together, so that canvas asks for a border box of at least 266. Chrome lays the same Polish name
 * at 204.8px of ink, and the cell need is 254.8px. The floor is 256, 1.2px over that need. */
const LONG_PL = "Obsługa klienta, sklep internetowy";
const LONG_EN = "Customer care, English desks";
const CLIP_PL = "Obsługa klienta, sklep intern";
const CLIP_EN = "Customer care, English desk";
const NAME_FLOOR = 256;
P.S.host = { tour: { offered: true, taken: false, at: 0 } };
P.S.projects = [
  proj("C:" + B + "p" + B + "pl", LONG_PL, FOLDER_HYPHEN, FILE_HYPHEN),
  proj("C:" + B + "p" + B + "en", LONG_EN, FOLDER_WORD, FILE_WORD),
];
P.paintMain();
/* SINCE BOARD 901 THE NAME IS TEXT ON THE ROW, a field only while it is renamed in place: its words and its title are the
   whole name, as the field's value and title were. */
const names = [...home.node("#main").innerHTML.matchAll(/<span class="pn"[^>]*>[^<]*<\/span>/g)].map((m) => m[0]);
const attr = (tag, k) => { if (k === "value") { const m = />([^<]*)</.exec(tag); return m ? text(m[1]) : null; }
  const m = new RegExp(k + '="([^"]*)"').exec(tag); return m ? text(m[1]) : null; };
check(names.length === 2
  && attr(names[0], "value") === LONG_PL && attr(names[0], "title") === LONG_PL
  && attr(names[1], "value") === LONG_EN && attr(names[1], "title") === LONG_EN
  && LONG_PL.indexOf(CLIP_PL) === 0 && LONG_PL.length > CLIP_PL.length
  && LONG_EN.indexOf(CLIP_EN) === 0 && LONG_EN.length > CLIP_EN.length,
  "n1 the field's value and its title are the whole name, past the clip the sheet measured: "
  + JSON.stringify(names.map((t) => attr(t, "value"))));
const floors = rules.filter((r) => r.sel === "#main .projects td.t-title").map((r) => {
  const m = /min-width:(\d+)px/.exec(r.body);
  return m ? +m[1] : 0;
});
check(floors.length >= 1 && floors.every((n) => n >= NAME_FLOOR),
  "n2 the name column's floor is " + NAME_FLOOR + "px at every width, which holds both measured names: "
  + JSON.stringify(floors));
check(floors.length >= 1 && floors.every((n) => n === NAME_FLOOR),
  "n3 the name column's floor is " + NAME_FLOOR + "px, the Chrome cell need of 254.8px with 1.2px of slack: "
  + JSON.stringify(floors));

/* ---- w. Written to's floor -------------------------------------------------------------------- */

/* "nie wybrano jeszcze folderu" is 164.7px of ink. One line needs a cell of 192.7px at 14px of
 * padding a side, and 180.7px at 8px. 210px holds both, and with the name floor it stays inside
 * the 1018px pane at 1280. */
const WRITTEN_FLOOR = 210;
const writtenFloors = rules.filter((r) => r.sel === "#main .projects td.wt").map((r) => {
  const m = /min-width:(\d+)px/.exec(r.body);
  return m ? +m[1] : 0;
});
check(writtenFloors.length >= 1 && writtenFloors.every((n) => n === WRITTEN_FLOOR),
  "w1 Written to's floor is " + WRITTEN_FLOOR + "px at every width, which holds one line of the empty folder: "
  + JSON.stringify(writtenFloors));

/* ---- p. the Last publish cell answers its heading ---------------------------------------------- */

/* In Polish the cell under "Ostatnia publikacja" says "jeszcze żadnej" (the copywriter's word, board 831); the same
 * English said anywhere else keeps "jeszcze nie opublikowano", and English is unchanged. */
const lastPublish = (lang) => {
  const pg = loadPage({ api: null, uiLang: lang });
  pg.page.S.host = { tour: { offered: true, taken: false, at: 0 } };
  pg.page.S.screen = "projects";
  pg.page.S.home = "library";
  pg.page.S.projects = [proj("C:" + B + "p" + B + "fresh", "Fresh", null, null)];
  pg.page.paintMain();
  const row = (/<tr class="pick"[\s\S]*?<\/tr>/.exec(pg.node("#main").innerHTML) || [""])[0];
  const tds = [...row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((m) => text(m[1]).trim());
  return { cell: tds[7], elsewhere: pg.sandbox.STUDIO_T.T("never published") };
};
const pl = lastPublish("pl"), en = lastPublish("en");
check(pl.cell === "jeszcze nie" && pl.elsewhere === "jeszcze nie opublikowano"
  && en.cell === "not yet" && en.elsewhere === "never published",
  "p1 a catalog never published says \"jeszcze nie\" under Published in Polish and \"not yet\" in English, and the phrase said elsewhere keeps its Polish: "
  + JSON.stringify({ pl, en }));

/* ---- a. Last asked steps aside unless the Polish row has 8px to spare -------------------- */

/* Measured headless, Polish, with the column forced shown. Slack is the pane's clientWidth less
 * the table at min-content. It is at least 8px from 995 to 1099 (the rail was then stacked; at 995
 * the pane is 965 and the table is 956.3) and from 1287 (the pane beside the rail is 1025 and the
 * table is 1016.3). At 994 and at 1286 the slack is 7.7px. The heading and the cells carry the
 * same hook, so the media rules hide both. 995, 1100 and 1286 are the edges. */
const ASKED_LOW = 995;
const ASKED_RAIL = 1100;
const ASKED_HIGH = 1286;

/* The sheet, comments taken out, each rule with the media condition it sits in. An @ rule other
 * than @media is skipped whole, braces and all, so a keyframe cannot move the condition. */
function sheetRules(html) {
  const a = html.indexOf("<style>"), b = html.indexOf("</style>");
  const css = html.slice(a + 7, b).replace(/\/\*[\s\S]*?\*\//g, "");
  const out = [], stack = [];
  let i = 0;
  const skipBlock = (brace) => {
    let d = 0;
    for (let k = brace; k < css.length; k++) {
      if (css[k] === "{") d++;
      else if (css[k] === "}") { d--; if (d === 0) return k + 1; }
    }
    return css.length;
  };
  while (i < css.length) {
    while (i < css.length && /\s/.test(css[i])) i++;
    if (i >= css.length) break;
    if (css[i] === "}") { if (stack.length) stack.pop(); i++; continue; }
    if (css[i] === "@") {
      const brace = css.indexOf("{", i);
      const head = css.slice(i, brace).trim();
      if (/^@media\b/i.test(head)) { stack.push(head.replace(/^@media\s+/i, "").trim()); i = brace + 1; continue; }
      i = skipBlock(brace);
      continue;
    }
    const brace = css.indexOf("{", i);
    if (brace < 0) break;
    const end = css.indexOf("}", brace + 1);
    const body = css.slice(brace + 1, end).replace(/\s+/g, "");
    css.slice(i, brace).split(",").forEach((s) => {
      const sel = s.trim().replace(/\s+/g, " ");
      if (sel) out.push({ sel, body, media: stack.length ? stack[stack.length - 1] : "" });
    });
    i = end + 1;
  }
  return out;
}
/* A width query only. "not all and (min-width:Npx)" is below N. "(min-width:A) and (max-width:B)"
 * is the closed band from A to B. Anything else this sheet uses (a height, a reduced-motion
 * preference) does not hide the column by width. An unknown condition is null, so a hide under
 * it fails the leg rather than passing unseen. */
function queryMatches(cond, px) {
  if (!cond) return true;
  let rest = cond.replace(/\s+/g, " ").trim(), neg = false;
  if (/^not\s+/i.test(rest)) { neg = true; rest = rest.replace(/^not\s+/i, ""); }
  rest = rest.replace(/^all\s+and\s+/i, "").trim();
  const both = /^\(min-width:\s*(\d+)px\)\s+and\s+\(max-width:\s*(\d+)px\)$/i.exec(rest);
  const min = /^\(min-width:\s*(\d+)px\)$/i.exec(rest);
  const max = /^\(max-width:\s*(\d+)px\)$/i.exec(rest);
  if (/^\(max-height:\s*\d+px\)$/i.test(rest) || /^\(prefers-[^)]+\)$/i.test(rest)) return neg ? true : false;
  let on = null;
  if (both) on = px >= +both[1] && px <= +both[2];
  else if (min) on = px >= +min[1];
  else if (max) on = px <= +max[1];
  if (on === null) return null;
  return neg ? !on : on;
}
function coversAsked(sel, el) {
  if (sel.indexOf("#main") < 0 || sel.indexOf(".projects") < 0 || sel.indexOf(".asked") < 0) return false;
  const subject = sel.split(" ").pop();
  if (subject.indexOf(".asked") < 0) return false;
  const tag = /^[a-z]+/i.exec(subject);
  return !tag || tag[0].toLowerCase() === el;
}
const askedRules = sheetRules(SHEET);
const hiding = askedRules.filter((r) => r.body.indexOf("display:none") >= 0
  && (coversAsked(r.sel, "th") || coversAsked(r.sel, "td")));
const hiddenAt = (px) => {
  const hit = { th: false, td: false, unknown: false };
  hiding.forEach((r) => {
    const on = queryMatches(r.media, px);
    if (on === null) { hit.unknown = true; return; }
    if (!on) return;
    if (coversAsked(r.sel, "th")) hit.th = true;
    if (coversAsked(r.sel, "td")) hit.td = true;
  });
  return hit;
};
/* Hidden below 995, and from 1100 to 1286. Shown from 995 to 1099 and from 1287. Both the heading
 * and the cells, at every width from 900 to 1440. */
const wantHide = (px) => px < ASKED_LOW || (px >= ASKED_RAIL && px <= ASKED_HIGH);
const band = [];
for (let px = 900; px <= 1440; px++) {
  const hit = hiddenAt(px);
  const hide = hit.th && hit.td && !hit.unknown;
  const show = !hit.th && !hit.td && !hit.unknown;
  if (wantHide(px) ? !hide : !show) band.push(px + ":" + JSON.stringify(hit));
}
const medias = hiding.map((r) => r.media).join(" ");
check(band.length === 0
  && medias.indexOf(ASKED_LOW + "px") >= 0
  && medias.indexOf(ASKED_RAIL + "px") >= 0 && medias.indexOf(ASKED_HIGH + "px") >= 0,
  "a2 the media rules hide the Last asked heading and its cells below " + ASKED_LOW
  + " and from " + ASKED_RAIL + " to " + ASKED_HIGH + ", and show both from " + ASKED_LOW
  + " to 1099 and from " + (ASKED_HIGH + 1) + ": "
  + JSON.stringify({ hiding: hiding.map((r) => ({ sel: r.sel, media: r.media })), band: band.slice(0, 8) }));

/* Walk every rule that reaches the heading or a cell, in sheet order, media included. Inside a
 * band where the column is hidden, a later rule must not show it again. Over 900 to 1440. */
const ASKED_UP = [{ tag: "html", cls: rootCls(/^(:root|html)/) }, { tag: "body", cls: rootCls(/^body/) },
  { tag: "div", id: "main", cls: [] }, { tag: "div", cls: ["pad", "projects"] }, { tag: "div", cls: ["pane"] },
  { tag: "table", cls: [] }, { tag: "tr", cls: [] }];
const reachesAsked = (sel, tag) => reaches(sel, { tag: tag, cls: ["asked"] }, ASKED_UP);
/* The matcher reads an attribute test as matching, so [hidden] would reach every cell. That rule
 * is display:none and it is not this column: a subject with no tag, id or class left once the
 * attribute is taken off is skipped. A subject that still names .asked, including .asked[hidden],
 * is kept, and so is every other subject that names an element. */
const subjectBare = (sel) => sel.trim().split(/\s+/).pop()
  .replace(/:not\([^)]*\)/g, "").replace(/\[[^\]]*\]/g, "").replace(/::?[\w-]+(\([^)]*\))?/g, "");
function displayTrail(tag, px) {
  const hits = [];
  let unknown = false;
  askedRules.forEach((r) => {
    if (!subjectBare(r.sel)) return;
    if (!reachesAsked(r.sel, tag)) return;
    const disp = /(?:^|;)display:([^;!]*)/.exec(r.body);
    if (!disp) return;
    const on = queryMatches(r.media, px);
    if (on === null) { unknown = true; return; }
    if (!on) return;
    hits.push(disp[1]);
  });
  let hid = false, again = false;
  hits.forEach((d) => { if (d === "none") hid = true; else if (hid) again = true; });
  return { last: hits.length ? hits[hits.length - 1] : "", again, unknown };
}
const again = [];
for (let px = 900; px <= 1440; px++) {
  ["th", "td"].forEach((tag) => {
    const t = displayTrail(tag, px);
    const bad = t.unknown || (wantHide(px) ? t.again || t.last !== "none" : t.last === "none");
    if (bad) again.push(px + " " + tag + " " + JSON.stringify(t));
  });
}
check(again.length === 0,
  "a3 no later rule shows Last asked again inside a band where it is hidden, and the heading and the cells stay hidden together below "
  + ASKED_LOW + " and from " + ASKED_RAIL + " to " + ASKED_HIGH + ": " + JSON.stringify(again.slice(0, 6)));

/* ---- s. the cells' side padding, which the slack rests on --------------------------------------- */

/* The test architect lambda's condition on 1010a4b: the 8.7px of slack rests on the cells giving up 6px a side below
 * 1160 (8px, not 14), and setting that back to 10px stayed green. Every projects heading and cell, at every width from
 * 900 to 1440, takes its side padding from the rules that reach it, media included, in cascade order (specificity,
 * then sheet order), the shorthand read as CSS reads it. */
const specOf = (sel) => {
  const s = sel.trim().replace(/::?[\w-]+(\([^)]*\))?/g, (m) => (m.startsWith("::") ? "" : " .p"));
  return [(s.match(/#[\w-]+/g) || []).length, (s.match(/\.[\w-]+|\[[^\]]*\]/g) || []).length,
    (s.replace(/#[\w-]+|\.[\w-]+|\[[^\]]*\]/g, " ").match(/(^|\s|>)[a-z][\w-]*/gi) || []).length];
};
const beats = (a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2];
const PAD_UP = ASKED_UP;
const sides = (tag, cls, px) => {
  const hit = askedRules.map((r, i) => ({ r, i })).filter(({ r }) => {
    const on = queryMatches(r.media, px);
    return on === true && reaches(r.sel, { tag, cls }, PAD_UP);
  }).sort((a, b) => beats(specOf(a.r.sel), specOf(b.r.sel)) || a.i - b.i);
  let left = "0", right = "0";
  hit.forEach(({ r }) => r.body.split(";").forEach((d) => {
    const [p, v] = [d.slice(0, d.indexOf(":")), d.slice(d.indexOf(":") + 1).replace(/!important$/, "")];
    if (p === "padding") {
      const v4 = (d.slice(d.indexOf(":") + 1).match(/-?[\d.]+(px|em|rem|%)?|0/g) || []);
      if (v4.length) { right = v4[1] || v4[0]; left = v4[3] || v4[1] || v4[0]; }
    } else if (p === "padding-left" || p === "padding-inline-start") left = v;
    else if (p === "padding-right" || p === "padding-inline-end") right = v;
    else if (p === "padding-inline") { const v2 = v.match(/-?[\d.]+(px|em|rem|%)?/g) || []; left = v2[0] || left; right = v2[1] || v2[0] || right; }
  }));
  return left + "/" + right;
};
const PAD_CELLS = [["th", []], ["th", ["asked"]], ["td", []], ["td", ["t-title"]], ["td", ["mono"]], ["td", ["asked"]], ["td", ["wt"]]];
const padOff = [];
for (let px = 900; px <= 1440; px++) {
  const want = px < 1160 ? "8px/8px" : "14px/14px";
  PAD_CELLS.forEach(([tag, cls]) => {
    const got = sides(tag, cls, px);
    if (got !== want) padOff.push(px + " " + tag + (cls.length ? "." + cls.join(".") : "") + " " + got);
  });
}
check(padOff.length === 0,
  "s1 every projects heading and cell pads 8px a side below 1160 and 14px a side from 1160, at every width from 900 to 1440: "
  + JSON.stringify(padOff.slice(0, 6)));

console.log(legs + " leg(s), " + failures + " failure(s)");
process.exit(failures ? 1 : 0);
