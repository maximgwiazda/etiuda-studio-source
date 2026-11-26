/* THE PROJECTS SCREEN, measured in the real window at 900x560, 1280x880 and 1920x1080 in both
 * languages: every Open reachable, every name readable, the empty, missing and damaged states
 * saying what is true, the Polish revision cell, the rail beside the list, the ring and the `.miss` ink.
 *     node tests/projects-screen.mjs [--keep]
 * Each leg's control is in the same window: the old nowrap path, the one name too long for any
 * field, and the value each colour replaced. */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { openStudio } from "./shell-door.mjs";
import * as Engine from "../src/engine.mjs";
import { json, PROJECT_FILE, DRAFT_FILE } from "../src/publish.mjs";
import { clearScratch, dropScratch } from "./scratch.mjs";
import { pressWhen, settleOn } from "./press.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const SCRATCH = path.join(ROOT, "scratch", "projects-screen");
const LONG_PATH = "D:\\Shares\\Team catalogs\\onboarding-and-recovery\\published";
const LONG_NAME = "Onboarding, account recovery and the first ninety days for new business customers";
const SIZES = [[900, 560], [1280, 880], [1920, 1080]];

let asserted = 0, failed = 0;
function check(cond, line) {
  asserted++;
  if (cond) process.stdout.write("  ok   " + line + "\n");
  else { failed++; process.stderr.write("  FAIL " + line + "\n"); }
}
const sleep = ms => new Promise(r => setTimeout(r, ms));

/* WCAG relative luminance over a computed `rgb(...)`. */
const lum = (rgb) => {
  const c = String(rgb).match(/[\d.]+/g).slice(0, 3).map(n => +n / 255)
    .map(v => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
const r2 = n => Math.round(n * 100) / 100;

/* The folder is the project's name; nothing inside carries one. */
async function plant(root, F, id, name, extra) {
  const dir = path.join(root, name);
  fs.mkdirSync(dir, { recursive: true });
  const shelf = { id: F.tagId("Greeting"), kind: "shelf", label: { en: "Greeting", pl: "Powitanie" } };
  const cat = { format: F.FORMAT, kind: F.KIND, id, rev: 0,
    langs: [{ code: "en", label: "EN" }, { code: "pl", label: "PL" }], commentLang: "en",
    tags: [shelf], minEngine: "2.0.0",
    cards: [{ id: "c-1", shelf: shelf.id, bodyShape: "plain", title: { en: "Card", pl: "Karta" },
              body: { en: "Widuma tosork.", pl: "Widuma tosork." } }] };
  cat.hash = F.contentHash(cat);
  fs.writeFileSync(path.join(dir, DRAFT_FILE), json(cat), "utf8");
  fs.writeFileSync(path.join(dir, PROJECT_FILE), json(Object.assign(
    { id, rev: 0, edition: "", draft: DRAFT_FILE, folder: null }, extra || {})), "utf8");
}

async function launch(tag, projects, theme, lang) {
  const ud = path.join(SCRATCH, "ud-" + tag);
  fs.mkdirSync(ud, { recursive: true });
  fs.writeFileSync(path.join(ud, "studio.json"),
    JSON.stringify({ theme, tour: { offered: true } }), "utf8");
  return openStudio("tests/projects-screen.mjs " + tag, { words: true, projects, userDataDir: ud,
    env: { STUDIO_LANG: lang } });
}
const size = async (page, w, h) => { await page.setViewport({ width: w, height: h }); await sleep(350); };

/* The row is the Open (board 901) and the name is a span until a rename starts. The 180px floor is
   the column, which is what used to be the field's box; the cut is the span, whose ink can run past it. */
const TABLE = `(() => {
  const pane = document.querySelector("#main .pane"), pr = pane.getBoundingClientRect();
  const opens = Array.from(document.querySelectorAll('#main tr[data-act="open"]'));
  const names = Array.from(document.querySelectorAll("#main .pn[data-proj]"));
  const cells = names.map(n => n.closest("td"));
  return {
    opens: opens.length,
    out: opens.filter(b => b.getBoundingClientRect().right > pr.right + 0.5).length,
    sideways: pane.scrollWidth - pane.clientWidth,
    narrowest: Math.min.apply(null, cells.map(td => td.clientWidth)),
    cut: names.filter(n => n.scrollWidth > n.clientWidth).map(n => n.textContent),
    rail: Math.round(document.querySelector("#rail").getBoundingClientRect().height),
  };
})()`;

async function several(root, lang, theme) {
  const st = await launch("several-" + lang, root, theme, lang);
  const page = st.page;
  const state = async (js) => JSON.parse(await page.evaluate("JSON.stringify(" + js + ")"));
  try {
    await page.click('#rail [data-act="home"][data-v="library"]');
    await sleep(250);
    const seen = {};
    for (const [w, h] of SIZES) { await size(page, w, h); seen[w] = await state(TABLE); }
    const all = Object.keys(seen).map(w => seen[w]);
    check(all.every(t => t.opens === 6 && t.out === 0 && t.sideways <= 0),
      "1a " + lang + ": every row of six is inside its pane and the pane never scrolls sideways,"
      + " at 900, 1280 and 1920: " + JSON.stringify(Object.keys(seen).map(w => w + ":" + seen[w].out
        + " out, " + seen[w].sideways + "px over")));

    /* THE CONTROL: the whole path back in the cell on one line, as it stood before W3 (2026-10-06: the file and
       its folder, the path on hover) and with the canvas's own nowrap, at the default window. */
    await size(page, 1280, 880);
    await page.evaluate(() => {
      const table = document.querySelector("#main .lib-pane table");
      if (table) table.style.minWidth = "4000px";
    });
    await sleep(200);
    const ctl = await state(TABLE);
    await page.evaluate(() => {
      const table = document.querySelector("#main .lib-pane table");
      if (table) table.style.minWidth = "";
    });
    await sleep(200);
    check(ctl.out > 0 || ctl.sideways > 0 || ctl.narrowest < 120,
      "1b CONTROL " + lang + ": with the path held to one line again the same table pushes the row out,"
      + " scrolls the pane, or squeezes the names (" + ctl.out + " out, " + ctl.sideways
      + "px over, narrowest name " + ctl.narrowest + "px)");

    check(all.every(t => t.narrowest >= 180 && t.cut.length === 1 && t.cut[0] === LONG_NAME),
      "2a " + lang + ": every name column is at least 180px at every size and every name but the"
      + " control is whole in it: narrowest " + JSON.stringify(Object.keys(seen).map(w => seen[w].narrowest))
      + ", cut " + JSON.stringify(all[1].cut.map(n => n.slice(0, 20))));
    check(all[1].cut.indexOf(LONG_NAME) >= 0,
      "2b CONTROL " + lang + ": the " + LONG_NAME.length + "-character name reads as cut, so the"
      + " cut measure bites");

    const rows = await state(`Array.from(document.querySelectorAll("#main tr")).slice(1).map(tr => ({
      name: (tr.querySelector(".pn") || {}).textContent || "",
      unread: tr.classList.contains("unread"),
      edge: getComputedStyle(tr.children[0], "::before").borderLeftStyle,
      cells: Array.from(tr.children).slice(1).map(td => td.textContent.trim()) }))`);
    const bad = rows.find(r => r.name === "half-copied") || {};
    const good = rows.find(r => r.name === "Support desk") || {};
    const damaged = lang === "pl" ? /^Plik project\.json jest uszkodzony/ : /^project\.json is damaged/;
    const fresh = lang === "pl" ? /jeszcze nie opublikowano|jeszcze żadnej|nie wybrano jeszcze folderu/
      : /never published|no folder chosen yet/;
    /* At rest every name is text. A damaged row refuses F2; a readable row opens the field, and Escape leaves it. */
    const renameUp = async (name) => {
      const found = await page.evaluate((name) => {
        const span = Array.from(document.querySelectorAll("#main .pn")).find(s => s.textContent === name);
        const tr = span && span.closest("tr");
        if (tr && tr.focus) tr.focus();
        return !!tr;
      }, name);
      if (!found) return false;
      await page.keyboard.press("F2");
      await sleep(250);
      const up = await page.evaluate(() => !!document.querySelector("#main input[data-naming]"));
      if (up) { await page.keyboard.press("Escape"); await sleep(200); }
      return up;
    };
    const badLocked = !(await renameUp("half-copied"));
    const goodRenames = await renameUp("Support desk");
    check(bad.unread && bad.edge === "dashed" && badLocked && damaged.test(bad.cells[0] || "")
          && !fresh.test(bad.cells.join(" ")),
      "4a " + lang + ": the damaged project's row is marked by the dashed edge, its name cannot be"
      + " typed over, and it says the file is damaged rather than a draft's words: "
      + JSON.stringify((bad.cells || [])[0]));
    check(good.name && !good.unread && good.edge !== "dashed" && goodRenames,
      "4b CONTROL " + lang + ": a readable project's row carries neither the edge nor the lock");

    const revs = rows.filter(r => !r.unread).map(r => (r.cells[6] || "").replace(/\u00a0/g, " ").replace(/\s+/g, " "));
    check(lang === "pl" ? revs.indexOf("14") >= 0 && revs.every(v => !/rev/.test(v))
      : revs.indexOf("rev 14") >= 0,
      "5a " + lang + ": the revision cells read " + JSON.stringify(revs)
      + (lang === "pl" ? ", with no English under WERSJA" : ", unchanged in English"));

    /* A REFUSAL IS HEARD AND THE HAND STAYS ON ITS ROW (sense pass 3, item 26). The damaged
       project's Open is pressed from the keyboard; its refusal repaints the list. */
    const badOpen = '#main tr.unread[data-act="open"]';
    await page.focus(badOpen);
    await page.keyboard.press("Enter");
    await settleOn(page, '((document.querySelector("#main .dashed") || {}).textContent || "").trim() !== ""', { bound: 30000 });
    /* The refusal is announced into #said (ui/app.js announce). The status bar's #sbSaid, which says
       only the save's held and refused states, comes first in the page, so the first status region
       is not this one. */
    const heard = await state(`(() => {
      const a = document.activeElement, live = document.querySelector('#said[role="status"]');
      return { focus: a && a.getAttribute ? a.getAttribute("data-act") + " " + (a.closest("tr.unread") ? "damaged" : "other") : "none",
               live: live ? live.textContent : null, outside: !!live && !live.closest("#main"),
               shown: (document.querySelector("#main .dashed") || {}).textContent || "" };
    })()`);
    check(heard.focus === "open damaged",
      "4c " + lang + ": after the damaged project's Open is refused, focus is on that row's Open"
      + " again, not the top of the page: " + JSON.stringify(heard.focus));
    check(heard.outside && heard.shown && heard.live === heard.shown,
      "4d " + lang + ": and the refusal on the screen is said into a status region outside the"
      + " list: " + JSON.stringify((heard.live || "").slice(0, 60)));

    /* The focus ring and the `.miss` ink, on the pane they sit on. The ring is reached by Tab
       from the search field, because a focus() from script does not raise :focus-visible. */
    await page.focus("#q");
    for (let i = 0; i < 20; i++) {
      await page.keyboard.press("Tab");
      if (await page.evaluate(() => {
        const e = document.activeElement;
        return !!(e && e.matches && e.matches('#main tr[data-act="open"]'));
      })) break;
    }
    const ink = await state(`(() => {
      const f = document.activeElement;
      const cs = getComputedStyle(f), pane = getComputedStyle(document.querySelector("#main .pane"));
      const root = getComputedStyle(document.documentElement);
      const probe = document.createElement("span"); document.body.appendChild(probe);
      const colour = v => { probe.style.color = v; return getComputedStyle(probe).color; };
      const out = { fv: !!(f && f.matches && f.matches('#main tr[data-act="open"]:focus-visible')),
        ring: cs.outlineColor, style: cs.outlineStyle, width: cs.outlineWidth,
        panel: pane.backgroundColor,
        miss: getComputedStyle(document.querySelector("#main .miss")).color,
        dim: colour("var(--dim)"), band: colour(root.getPropertyValue("--band")),
        canvasMiss: colour("#9aa4b2") };
      probe.remove(); if (f && f.blur) f.blur(); return out;
    })()`);
    const ringOn = ink.style === "solid" ? ratio(ink.ring, ink.panel) : 0;
    check(ink.fv && ink.style === "solid" && ink.width === "2px" && ringOn >= 3,
      "6b " + theme + ": a focused project row shows a 2px ring at " + r2(ringOn) + ":1 against the pane,"
      + " where 3:1 is the floor for a focus mark: " + JSON.stringify(ink.ring) + " " + ink.width);
    check(ratio(ink.band, ink.panel) < 3 || theme === "light",
      "6c CONTROL " + theme + ": the band the ring used to take is " + r2(ratio(ink.band, ink.panel))
      + ":1 here" + (theme === "light" ? " (the light theme's is the same colour as the ring)" : ""));
    check(ratio(ink.miss, ink.panel) >= 4.5 && ratio(ink.miss, ink.panel) < ratio(ink.dim, ink.panel),
      "6d " + theme + ": the words for a missing thing are " + r2(ratio(ink.miss, ink.panel))
      + ":1, readable and quieter than --dim's " + r2(ratio(ink.dim, ink.panel)) + ":1");
    check(theme === "dark" ? ratio(ink.canvasMiss, ink.panel) > ratio(ink.dim, ink.panel)
      : ratio(ink.canvasMiss, ink.panel) < 4.5,
      "6e CONTROL " + theme + ": the canvas's #9aa4b2 is " + r2(ratio(ink.canvasMiss, ink.panel))
      + ":1 here, " + (theme === "dark" ? "louder than --dim" : "under 4.5"));
    return seen;
  } finally { await st.shut(); }
}

/* COUNTS:PREDICATES
   Members that must be there, in order where the order is the claim.
   One more member still passes. A missing member is named. A floor stays
   where a scanner that saw nothing would otherwise pass. */
function missingMembers(seen, required, ordered) {
  const have = (seen || []).map(s => String(s));
  if (!ordered) return required.filter(name => have.indexOf(String(name)) < 0);
  let from = 0;
  const missing = [];
  for (const name of required) {
    const at = have.indexOf(String(name), from);
    if (at < 0) missing.push(name);
    else from = at + 1;
  }
  return missing;
}

function projectActsHeld(acts, required) {
  const have = acts || [];
  const need = required || [];
  const missing = missingMembers(have, need, true);
  if (need.length === 0 && have.length !== 0) have.forEach(a => missing.push(String(a)));
  return { ok: missing.length === 0, missing };
}
/* COUNTS:END */

async function none(root, lang, missing) {
  const st = await launch((missing ? "missing-" : "empty-") + lang, root, "light", lang);
  const page = st.page;
  const state = async (js) => JSON.parse(await page.evaluate("JSON.stringify(" + js + ")"));
  try {
    const seen = {};
    for (const [w, h] of SIZES.slice(0, 2)) {
      await size(page, w, h);
      seen[w] = await state(`({
        table: !!document.querySelector("#main table"),
        said: (document.querySelector("#main .none") || {}).textContent || "",
        acts: Array.from(document.querySelectorAll("#main .none [data-act]")).map(b => b.getAttribute("data-act")),
        legend: document.querySelectorAll("#main .desk").length,
        rail: Math.round(document.querySelector("#rail").getBoundingClientRect().height),
        beside: (() => { const r = document.querySelector("#rail").getBoundingClientRect(),
          m = document.querySelector("#main").getBoundingClientRect();
          return r.width > 120 && r.right <= m.left + 1 && Math.abs(r.top - m.top) <= 2; })(),
        reach: Array.from(document.querySelectorAll("#main .none [data-act]")).every(b => {
          const r = b.getBoundingClientRect(); return r.right <= innerWidth && r.bottom <= innerHeight; }) })`);
    }
    const s = seen[1280], want = missing ? ["new", "bring", "sample-open", "pick-root"] : ["new", "bring", "sample-open"];
    const words = missing
      ? (lang === "pl" ? /Folderu .* jeszcze nie ma/ : /The folder .* is not there yet/)
      : (lang === "pl" ? /(?:Projekty|Katalogi) są przechowywane w folderze/ : /(?:Projects|Catalogs) are kept in/);
    const acts3 = projectActsHeld(s.acts, want);
    check(!s.table && s.said.indexOf(root) >= 0 && words.test(s.said) && s.legend === 0
          && acts3.ok && seen[900].reach && seen[1280].reach,
      "3" + (missing ? "b" : "a") + " " + lang + ": " + (missing ? "a projects folder that is not there"
        : "a projects folder with nothing in it") + " names the folder under the mark, offers " + (s.acts.join(", ") || "nothing the chrome above it offers")
      + (acts3.missing.length ? ", missing " + acts3.missing.join(", ") : "")
      + " within the window at 900 and 1280, and paints no header row or marker legend: "
      + JSON.stringify(s.said.slice(0, 60)));
    if (missing) check(!fs.existsSync(root),
      "3c CONTROL: the launch made no folder, so the screen was describing one that is not there");
    /* The rail stays on the left at every width (Max, 2026-11-14: "left side panel should stay as left side panel"); until
       then this leg held it to a band of 80px over the list at 900. tests/rail-left.mjs holds every screen headless. */
    check(seen[900].beside && seen[1280].beside,
      "6a " + lang + ": at 900x560 and 1280x880 the rail stands on the left beside the list, " + seen[900].rail + "px tall at 900");
    await pressWhen(page, '.tab.add[data-act="new-tab"]', { who: "tests/projects-screen.mjs" });
    await settleOn(page, '!!(document.querySelector("#main .newcat h1") || {}).textContent', { bound: 30000 });
    const up = await page.evaluate(() => document.querySelector("#scrim").hidden
      && (document.querySelector("#main .newcat h1") || {}).textContent);
    /* a page in its own tab since board 1019 (12); it opened the New catalog cover before */
    check(!!up, "3" + (missing ? "d" : "e") + " " + lang + ": the chrome's New catalog opens its"
      + " page in a tab: " + JSON.stringify(up));
    return seen;
  } finally { await st.shut(); }
}

async function main(argv) {
  const keep = argv.indexOf("--keep") >= 0;
  clearScratch(SCRATCH);
  const F = await Engine.format();
  const root = path.join(SCRATCH, "several");
  const day = n => new Date(Date.now() - n * 86400000).toISOString();
  await plant(root, F, "support-desk", "Support desk",
    { rev: 14, edition: "2026-09-19", folder: "\\\\files\\support\\etiuda", published: day(4),
      requested: day(1), opened: day(0) });
  await plant(root, F, "obsluga-klienta", "Obsługa klienta i reklamacje",
    { rev: 3, edition: "2026-09-02", folder: "\\\\files\\obsluga\\katalog", published: day(21) });
  await plant(root, F, "onboarding", LONG_NAME,
    { rev: 27, edition: "2026-09-22", folder: LONG_PATH, published: day(1), requested: day(0) });
  await plant(root, F, "billing-replies", "Billing replies");
  await plant(root, F, "trial", "Trial");
  fs.mkdirSync(path.join(root, "half-copied"), { recursive: true });
  fs.writeFileSync(path.join(root, "half-copied", PROJECT_FILE), "{ \"id\": \"half-copied\", \"na", "utf8");

  await several(root, "en", "light");
  await several(root, "pl", "dark");

  const empty = path.join(SCRATCH, "empty");
  fs.mkdirSync(empty, { recursive: true });
  await none(empty, "en", false);
  await none(path.join(SCRATCH, "not-there"), "pl", true);

  if (!keep) dropScratch(SCRATCH, "projects-screen");
  process.stdout.write("projects-screen  " + asserted + " assertion(s), " + failed + " failure(s)\n");
  process.exit(failed ? 1 : 0);
}

main(process.argv.slice(2)).catch(e => {
  process.stderr.write("projects-screen  " + (e && e.stack ? e.stack : String(e)) + "\n");
  process.exit(2);
});
