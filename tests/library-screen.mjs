/* Studio's Overview without its table, and a Library screen for every catalog (board 982, findings 13 and 14, section E).
 *
 *     node tests/library-screen.mjs
 *
 * Headless Chrome on ui/index.html and ui/app.js, with a stub window.STUDIO holding six invented catalogs.
 * What the eye sees, and what the hand does:
 *   l1 the rail's head shows two rows, Overview and Library with the count of catalogs, and no filter rows; clicking each shows its screen
 *   l2 Overview shows the four counts, the Connections map, at most four Opened recently cards and the dashed card with the count; no table. A card's click opens that catalog; the dashed card's click shows the Library
 *   l3 the Library shows the filters with their counts and no Put away; each filter leaves exactly the rows it names; the search field finds a catalog by name on both screens
 *   l4 at window widths 900, 1280, 1500, 1700, 2000 and 2560: the Library's table is exactly as wide as its box, every row's Open and three dots end inside the box, and Languages and Last edited are shown only where the table's box is 1500 px or wider; the Overview shows no horizontal scrollbar either
 *   l5 a row's click and its Open each open that catalog; the three dots open the menu the row's right-click opens, with the same items, and no put-away item
 *   l6 each cell says what its catalog holds
 *   l8 at 1280 and 2000 each filter is one line with no glyph, no cell wraps, and Open and the dots end at the pane's right edge
 *   l9 at 2000 the rail's three home rows carry a glyph, and the Opened recently cards are equal columns across the row
 *   l10 in Polish, at every width from 900 to 2560, the dashed card is never alone on a row as a card: the last equal column on
 *       the cards' row with its words on one line, or a one-line strip across the row under them
 *   l11 in Polish the Published cell and a recent card say "wersja 4"
 *   l12 in Polish, light and dark, Draft and Checks carry the state dot before their words; Reaches and Published none
 *   l13 the three dots pressed by Enter put the hand on the menu's first item
 * l7 is tests/connections-field.mjs, run beside this file.
 *
 * Node only, headless Chrome via puppeteer-core, no Electron window.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-core";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const HTML_FILE = path.join(ROOT, "ui", "index.html");

const CHROME_PATHS = [
  process.env.ETIUDA_CHROME,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
].filter(Boolean);

const executablePath = CHROME_PATHS.find((p) => fs.existsSync(p));
if (!executablePath) {
  process.stderr.write("No Chrome browser found to drive\n");
  process.exit(1);
}

let checks = 0, fails = 0;
function check(ok, line, detail) {
  checks++;
  if (ok) process.stdout.write("  ok   " + line + "\n");
  else {
    fails++;
    process.stdout.write("  FAIL " + line + (detail ? ": " + JSON.stringify(detail) : "") + "\n");
  }
}

const EDITED = new Date(Date.now() - 2.5 * 86400000).toISOString();
const CATALOGS = [
  { id: "harbour", name: "Harbour lamps", dir: "C:/studio/harbour", rev: 4, counts: { cards: 14 }, langs: ["en", "pl"], changes: 0, checks: 0, opened: "2026-11-11T10:00:00.000Z", edited: EDITED },
  { id: "quay", name: "Quay ropes", dir: "C:/studio/quay", rev: 2, counts: { cards: 38 }, langs: ["en"], changes: 3, checks: 2, opened: "2026-11-10T10:00:00.000Z", edited: EDITED },
  { id: "pier", name: "Pier signs", dir: "C:/studio/pier", rev: 0, counts: { cards: 7 }, langs: ["pl"], changes: 0, checks: 0, opened: "2026-11-09T10:00:00.000Z", edited: EDITED },
  { id: "bollards", name: "Bollards", dir: "C:/studio/bollards", rev: 1, counts: { cards: 9 }, langs: ["en", "pl"], changes: 0, checks: 5, opened: "2026-11-08T10:00:00.000Z", edited: EDITED },
  { id: "fenders", name: "Fenders", dir: "C:/studio/fenders", rev: 6, counts: { cards: 4 }, langs: ["en"], changes: 1, checks: 0, opened: "2026-11-01T10:00:00.000Z", edited: EDITED },
  { id: "lanterns", name: "Lanterns", dir: "C:/studio/lanterns", rev: 0, counts: { cards: 2 }, langs: ["pl"], changes: 0, checks: 0, opened: null, edited: null },
];
const TEAMS = [{
  id: "North quay",
  projects: [{ id: "harbour", dir: "C:/studio/harbour", name: "" }],
  catalogs: ["harbour"],
  teammates: [{ id: "ada", name: "Ada", admitted: true }],
}];

async function boot(browser, width, lang) {
  const page = await browser.newPage();
  await page.setViewport({ width, height: 900 });
  await page.evaluateOnNewDocument((catalogs, teams, lang) => {
    window.__opened = [];
    window.STUDIO = {
      host: async () => ({ version: "0.1.0", tour: { offered: true, taken: false, at: 0 }, uiLang: lang || undefined }),
      projects: async () => ({ root: "C:/studio", projects: catalogs, sample: "" }),
      teams: async () => ({ teams }),
      open: async (dir) => { window.__opened.push(dir); return { error: "held" }; },
      onMaximized: () => {},
      onTrayGo: () => {},
      onOpenDir: () => {},
      onTask: () => {},
      onTeamMoved: () => {},
      onRelayLapse: () => {},
      onRelaySyncNote: () => {},
    };
  }, CATALOGS, TEAMS, lang || "");
  const url = "file:///" + HTML_FILE.replace(/\\/g, "/");
  await page.goto(url, { waitUntil: "load" });
  await page.waitForSelector("#main .projects", { timeout: 5000 });
  /* The opening covers the window for a few seconds. A hand reaches the rail once it has gone. */
  await page.waitForFunction(() => !document.querySelector(".e-launch-veil"), { timeout: 8000 });
  return page;
}

async function main() {
  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ["--hide-scrollbars", "--no-sandbox"],
  });
  try {
    const page = await boot(browser, 1400);

    const head = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll("#rail a")).map((a) => a.innerText.replace(/\s+/g, " ").trim());
      const text = document.querySelector("#rail") ? document.querySelector("#rail").innerText : "";
      return { rows, text };
    });
    const overviewRow = head.rows.find((r) => r === "Overview" || r.startsWith("Overview "));
    const libraryRow = head.rows.find((r) => /^Library\b/.test(r));
    const filterGone = !/Opened recently|Drafts|Read by a team|Put away|Odłóż/.test(head.text)
      && !head.rows.some((r) => /^(All|Published|Drafts)\b/.test(r));
    check(!!overviewRow && !!libraryRow && /Library\s+6\b/.test(libraryRow) && filterGone,
      "l1 the rail's head shows Overview and Library with the count of catalogs, and no filter rows",
      head);

    /* The opening veil and the first-run tour sit over the rail once the window changes size, so a
       coordinate click lands on them. The row is pressed through the control, as the cards and the filters are. */
    async function pressHome(which) {
      await page.evaluate((which) => {
        const a = document.querySelector('#rail [data-act="home"][data-v="' + which + '"]');
        if (a) a.click();
      }, which);
    }
    await pressHome("library");
    await page.waitForFunction(() => /Library/.test((document.querySelector("#main h1") || {}).textContent || ""));
    const onLibrary = await page.evaluate(() => (document.querySelector("#main h1") || {}).textContent);
    await pressHome("overview");
    await page.waitForFunction(() => /Overview/.test((document.querySelector("#main h1") || {}).textContent || ""));
    const onOverview = await page.evaluate(() => (document.querySelector("#main h1") || {}).textContent);
    check(onLibrary === "Library" && onOverview === "Overview",
      "l1 clicking each row shows its screen", { onLibrary, onOverview });

    const ov = await page.evaluate(() => {
      const main = document.querySelector("#main");
      const text = main ? main.innerText : "";
      const cards = Array.from(main.querySelectorAll("button")).map((b) => b.innerText.replace(/\s+/g, " ").trim());
      const recent = cards.filter((t) => /cards|rev |not yet/.test(t));
      const dashed = cards.find((t) => /All catalogs in the Library/.test(t)) || "";
      return {
        title: (main.querySelector("h1") || {}).textContent || "",
        counts: /6/.test(text) && /catalogs/.test(text),
        connections: /Connections/.test(text),
        table: !!main.querySelector("table"),
        recent,
        dashed,
        h1: (main.querySelector("h1") || {}).textContent || "",
      };
    });
    const named = (name) => ov.recent.some((t) => t.indexOf(name) >= 0);
    check(ov.h1 === "Overview" && ov.counts && ov.connections && !ov.table
      && ov.recent.length === 4 && ov.recent.length <= 4
      && !named("Fenders") && named("Harbour lamps")
      && /All catalogs in the Library:\s*6/.test(ov.dashed),
      "l2 Overview shows the four counts, the Connections map, at most four Opened recently cards and the dashed card, and no table",
      { recent: ov.recent, dashed: ov.dashed, table: ov.table });

    const openedBefore = await page.evaluate(() => window.__opened.slice());
    await page.evaluate(() => {
      const b = Array.from(document.querySelectorAll("#main button")).find((x) => /Harbour lamps/.test(x.innerText));
      if (b) b.click();
    });
    await page.waitForFunction(() => window.__opened.length > 0);
    const openedCard = await page.evaluate(() => window.__opened.slice());
    await page.evaluate(() => {
      const b = Array.from(document.querySelectorAll("#main button")).find((x) => /All catalogs in the Library/.test(x.innerText));
      if (b) b.click();
    });
    await page.waitForFunction(() => /Library/.test((document.querySelector("#main h1") || {}).textContent || ""));
    const afterDash = await page.evaluate(() => (document.querySelector("#main h1") || {}).textContent);
    check(openedCard.length === openedBefore.length + 1 && openedCard[openedCard.length - 1] === "C:/studio/harbour"
      && afterDash === "Library",
      "l2 a card opens that catalog and the dashed card shows the Library",
      { openedCard, afterDash });

    const filters = await page.evaluate(() => {
      const bar = document.querySelector("#main");
      const text = bar ? bar.innerText : "";
      const links = Array.from(document.querySelectorAll("#main a, #main button")).map((a) => a.innerText.replace(/\s+/g, " ").trim());
      return { text, links, put: /Put away|Odłóż/.test(text) };
    });
    const wantFilters = [
      ["All", "6"],
      ["With changes to publish", "2"],
      ["Published", "4"],
      ["Read by a team", "1"],
    ];
    const filtersOk = wantFilters.every(([name, n]) => filters.links.some((t) => t.indexOf(name) >= 0 && t.indexOf(n) >= 0));
    check(filtersOk && !filters.put,
      "l3 the Library shows the filters with their counts and no Put away",
      filters.links.filter((t) => /All|Changes|Published|Read by|Put away|Odłóż/.test(t)));

    async function rowNames() {
      return page.evaluate(() => Array.from(document.querySelectorAll("#main tr")).slice(1)
        .map((tr) => ((tr.querySelector(".pn") || {}).textContent || "").trim()).filter(Boolean));
    }
    async function pressFilter(name) {
      await page.evaluate((name) => {
        const a = Array.from(document.querySelectorAll("#main a")).find((x) => x.innerText.replace(/\s+/g, " ").indexOf(name) === 0);
        if (a) a.click();
      }, name);
      await page.waitForFunction((name) => {
        const a = Array.from(document.querySelectorAll("#main a")).find((x) => x.innerText.replace(/\s+/g, " ").indexOf(name) === 0);
        return a && (a.getAttribute("aria-current") === "page" || a.classList.contains("on"));
      }, {}, name);
    }
    await pressFilter("All");
    const allRows = await rowNames();
    await pressFilter("With changes to publish");
    const changeRows = await rowNames();
    await pressFilter("Published");
    const pubRows = await rowNames();
    await pressFilter("Read by a team");
    const teamRows = await rowNames();
    const same = (a, b) => JSON.stringify(a.slice().sort()) === JSON.stringify(b.slice().sort());
    check(same(allRows, ["Harbour lamps", "Quay ropes", "Pier signs", "Bollards", "Fenders", "Lanterns"])
      && same(changeRows, ["Quay ropes", "Fenders"])
      && same(pubRows, ["Harbour lamps", "Quay ropes", "Bollards", "Fenders"])
      && same(teamRows, ["Harbour lamps"]),
      "l3 each filter leaves exactly the rows it names",
      { allRows, changeRows, pubRows, teamRows });

    await pressFilter("All");
    await page.click("#q");
    await page.keyboard.type("Fenders");
    await page.waitForFunction(() => {
      const names = Array.from(document.querySelectorAll("#main tr")).slice(1)
        .map((tr) => ((tr.querySelector(".pn") || {}).textContent || "").trim()).filter(Boolean);
      return names.length === 1 && names[0] === "Fenders";
    });
    const foundLib = await rowNames();
    await pressHome("overview");
    await page.waitForFunction(() => /Overview/.test((document.querySelector("#main h1") || {}).textContent || ""));
    const foundOv = await page.evaluate(() => Array.from(document.querySelectorAll("#main button"))
      .map((b) => b.innerText.replace(/\s+/g, " ").trim()).filter((t) => /Fenders|Harbour lamps|Quay ropes/.test(t)));
    check(foundLib.length === 1 && foundLib[0] === "Fenders" && foundOv.length === 1 && /Fenders/.test(foundOv[0]),
      "l3 the search field finds a catalog by name on both screens", { foundLib, foundOv });

    await page.evaluate(() => {
      const q = document.querySelector("#q");
      if (q) { q.value = ""; q.dispatchEvent(new Event("input", { bubbles: true })); }
    });
    await page.waitForFunction(() => {
      const onLibrary = /Library/.test((document.querySelector("#main h1") || {}).textContent || "");
      const rows = document.querySelectorAll("#main tr").length;
      const cards = Array.from(document.querySelectorAll("#main button")).filter((b) => /Harbour lamps|Quay ropes|Pier signs|Bollards/.test(b.innerText)).length;
      return onLibrary ? rows >= 5 : cards >= 4;
    });

    const widths = [900, 1280, 1500, 1700, 2000, 2560];
    const widthReport = [];
    let widthOk = true;
    for (const w of widths) {
      await page.setViewport({ width: w, height: 900 });
      await new Promise((r) => setTimeout(r, 80));
      await pressHome("overview");
      await page.waitForFunction(() => /Overview/.test((document.querySelector("#main h1") || {}).textContent || ""));
      const ovScroll = await page.evaluate(() => {
        const main = document.querySelector("#main");
        return { scroll: main.scrollWidth, client: main.clientWidth };
      });
      await pressHome("library");
      await page.waitForFunction(() => /Library/.test((document.querySelector("#main h1") || {}).textContent || ""));
      const box = await page.evaluate(() => {
        const table = document.querySelector("#main table");
        const pane = table ? table.parentElement : null;
        const head = (name) => Array.from(document.querySelectorAll("#main th")).find((th) => th.textContent.trim() === name);
        const shown = (th) => {
          if (!th) return false;
          const cs = getComputedStyle(th);
          return cs.display !== "none" && th.getClientRects().length > 0;
        };
        const opens = Array.from(document.querySelectorAll("#main tr")).slice(1).map((tr) => {
          const buttons = Array.from(tr.querySelectorAll("button"));
          const open = buttons.find((b) => b.textContent.trim() === "Open");
          const more = buttons.find((b) => b.textContent.trim() === "···" || /More for/.test(b.getAttribute("aria-label") || ""));
          const right = pane.getBoundingClientRect().right;
          return {
            open: open ? open.getBoundingClientRect().right <= right + 1 : false,
            more: more ? more.getBoundingClientRect().right <= right + 1 : false,
          };
        });
        return {
          box: pane ? pane.clientWidth : 0,
          scroll: pane ? pane.scrollWidth : 0,
          client: pane ? pane.clientWidth : 0,
          lang: shown(head("Languages")),
          edited: shown(head("Last edited")),
          opens,
        };
      });
      const fit = box.scroll <= box.client + 1 && box.opens.length === 6 && box.opens.every((r) => r.open && r.more);
      const cols = (box.box >= 1500) === box.lang && box.lang === box.edited;
      const ovFit = ovScroll.scroll <= ovScroll.client + 1;
      if (!fit || !cols || !ovFit) widthOk = false;
      widthReport.push({ w, box: box.box, scroll: box.scroll, client: box.client, lang: box.lang, edited: box.edited, ov: ovScroll, fit, cols, ovFit });
    }
    check(widthOk,
      "l4 at 900, 1280, 1500, 1700, 2000 and 2560 the Library table is as wide as its box, Open and the three dots end inside it, Languages and Last edited show only at a box of 1500 or wider, and the Overview does not scroll sideways",
      widthReport);

    await page.setViewport({ width: 1400, height: 900 });
    await pressHome("library");
    await page.evaluate(() => {
      const q = document.querySelector("#q");
      if (q) { q.value = ""; q.dispatchEvent(new Event("input", { bubbles: true })); }
    });
    await page.evaluate(() => {
      const a = Array.from(document.querySelectorAll("#main a")).find((x) => x.innerText.replace(/\s+/g, " ").indexOf("All") === 0);
      if (a) a.click();
    });
    await page.waitForFunction(() => document.querySelectorAll("#main tr").length >= 7);

    const beforeOpen = await page.evaluate(() => window.__opened.length);
    await page.evaluate(() => {
      const tr = Array.from(document.querySelectorAll("#main tr")).find((r) => /Quay ropes/.test(r.innerText));
      if (tr) tr.click();
    });
    await page.waitForFunction((n) => window.__opened.length > n, {}, beforeOpen);
    const byRow = await page.evaluate(() => window.__opened[window.__opened.length - 1]);
    await page.evaluate(() => {
      const tr = Array.from(document.querySelectorAll("#main tr")).find((r) => /Quay ropes/.test(r.innerText));
      const b = tr && Array.from(tr.querySelectorAll("button")).find((x) => x.textContent.trim() === "Open");
      if (b) b.click();
    });
    await page.waitForFunction((n) => window.__opened.length > n, {}, beforeOpen + 1);
    const byButton = await page.evaluate(() => window.__opened[window.__opened.length - 1]);

    await page.evaluate(() => {
      const tr = Array.from(document.querySelectorAll("#main tr")).find((r) => /Quay ropes/.test(r.innerText));
      const name = tr && tr.querySelector(".pn");
      if (name) name.dispatchEvent(new MouseEvent("contextmenu", { bubbles: true, cancelable: true, clientX: 30, clientY: 30 }));
    });
    await page.waitForSelector("#ctxMenu[hidden=false], #ctxMenu:not([hidden])", { timeout: 2000 }).catch(() => {});
    const rightItems = await page.evaluate(() => Array.from(document.querySelectorAll("#ctxMenu [role='menuitem']")).map((b) => b.innerText.replace(/\s+/g, " ").trim()));
    await page.keyboard.press("Escape");
    await page.evaluate(() => {
      const tr = Array.from(document.querySelectorAll("#main tr")).find((r) => /Quay ropes/.test(r.innerText));
      const b = tr && Array.from(tr.querySelectorAll("button")).find((x) => x.textContent.trim() === "···");
      if (b) b.click();
    });
    await page.waitForFunction(() => document.querySelectorAll("#ctxMenu [role='menuitem']").length > 0);
    const moreItems = await page.evaluate(() => Array.from(document.querySelectorAll("#ctxMenu [role='menuitem']")).map((b) => b.innerText.replace(/\s+/g, " ").trim()));
    const noAway = !rightItems.concat(moreItems).some((t) => /Put away|Odłóż/.test(t));
    check(byRow === "C:/studio/quay" && byButton === "C:/studio/quay"
      && rightItems.length > 0 && JSON.stringify(rightItems) === JSON.stringify(moreItems) && noAway,
      "l5 a row and its Open each open that catalog, and the three dots open the same menu as the right-click, with no put-away item",
      { byRow, byButton, rightItems, moreItems });

    const cells = await page.evaluate(() => {
      const heads = Array.from(document.querySelectorAll("#main th")).map((th) => th.textContent.trim());
      const row = (name) => {
        const tr = Array.from(document.querySelectorAll("#main tr")).find((r) => ((r.querySelector(".pn") || {}).textContent || "") === name);
        if (!tr) return null;
        const tds = Array.from(tr.children);
        const out = {};
        heads.forEach((h, i) => { out[h] = (tds[i] ? tds[i].innerText : "").replace(/\s+/g, " ").trim(); });
        return out;
      };
      return { heads, harbour: row("Harbour lamps"), quay: row("Quay ropes"), pier: row("Pier signs"), bollards: row("Bollards") };
    });
    check(cells.harbour && cells.harbour.Draft === "as published" && cells.harbour.Checks === "all clear"
      && cells.harbour.Published === "rev 4" && cells.harbour.Reaches === "North quay"
      && cells.harbour.Languages === "EN, PL" && /ago|today|day/.test(cells.harbour["Last edited"] || "")
      && cells.quay && cells.quay.Draft === "edits not published: 3" && cells.quay.Checks === "to look at: 2"
      && cells.pier && cells.pier.Published === "not yet" && cells.pier.Reaches === "nobody yet"
      && cells.bollards && cells.bollards.Checks === "to look at: 5",
      "l6 each cell says what its catalog holds", cells);

    /* l8 and l9 (Claudius kappa, the designer's read of 05:34). l8, the Library at 1280 and 2000: each filter is one
       line, its label then its count, with no glyph; no cell of the table wraps; Open and the dots end within 16 px of
       the pane's right edge. l9, the Overview at 2000: the rail's three home rows carry a glyph, and the Opened recently cards
       and the Library's card are equal columns across the row's whole width. */
    const l8 = [];
    for (const w of [1280, 2000]) {
      await page.setViewport({ width: w, height: 900 });
      await pressHome("library");
      await page.waitForFunction(() => /Library/.test((document.querySelector("#main h1") || {}).textContent || ""));
      await new Promise((r) => setTimeout(r, 120));
      l8.push(await page.evaluate((w) => {
        const lines = (el) => { const r = document.createRange(); r.selectNodeContents(el); const rs = Array.from(r.getClientRects()).filter((b) => b.width > 0 && b.height > 0); if (!rs.length) return 0; const top = Math.min(...rs.map((b) => b.top)), bottom = Math.max(...rs.map((b) => b.bottom)), h = Math.max(...rs.map((b) => b.height)); return Math.round((bottom - top) / h); };
        const pills = Array.from(document.querySelectorAll("#main .lib-filters a"));
        const pillsBad = pills.filter((a) => a.querySelector("svg") || lines(a) > 1).map((a) => a.innerText.replace(/\s+/g, " ").trim());
        const wrapped = Array.from(document.querySelectorAll("#main .lib-pane td")).filter((td) => td.offsetParent && td.innerText.trim() && lines(td) > 1).map((td) => td.innerText.trim()).slice(0, 4);
        const pane = document.querySelector("#main .lib-pane").getBoundingClientRect();
        const gaps = Array.from(document.querySelectorAll("#main .lib-pane td.lib-acts")).map((td) => { const b = td.lastElementChild.getBoundingClientRect(); return Math.round(pane.right - b.right); });
        return { w, pills: pills.length, pillsBad, wrapped, maxGap: Math.max(...gaps) };
      }, w));
    }
    check(l8.every((x) => x.pills === 4 && !x.pillsBad.length && !x.wrapped.length && x.maxGap <= 16),
      "l8 at 1280 and 2000 each filter is one line with no glyph, no cell wraps, and Open and the dots end at the pane's right edge", l8);
    await page.setViewport({ width: 2000, height: 900 });
    await pressHome("overview");
    await page.waitForFunction(() => /Overview/.test((document.querySelector("#main h1") || {}).textContent || ""));
    await new Promise((r) => setTimeout(r, 120));
    const l9 = await page.evaluate(() => {
      const rows = Array.from(document.querySelectorAll('#rail [data-act="home"]')).map((a) => !!a.querySelector("svg"));
      const box = document.querySelector("#main .lw-recent");
      const cards = box ? Array.from(box.children).map((c) => c.getBoundingClientRect()) : [];
      const b = box ? box.getBoundingClientRect() : null;
      const widths = cards.map((r) => Math.round(r.width));
      const oneRow = cards.every((r) => Math.abs(r.top - cards[0].top) < 2);
      return { rows, n: cards.length, widths, oneRow, reach: b && cards.length ? Math.round(b.right - cards[cards.length - 1].right) : null };
    });
    check(l9.rows.length === 3 && l9.rows.every(Boolean) && l9.n === 5 && l9.oneRow
      && Math.max(...l9.widths) - Math.min(...l9.widths) <= 2 && l9.reach !== null && l9.reach <= 2,
      "l9 at 2000 the home rail's Team, Overview and Library rows carry a glyph, and the five Opened recently cards are equal columns across the row", l9);

    /* l13 (the test architect's keyboard pass, 2026-11-11): the three dots pressed by Enter put the hand on the menu's
       first item, as the Menu key does, not on the menu's box. */
    await page.setViewport({ width: 1400, height: 900 });
    await pressHome("library");
    await page.waitForFunction(() => document.querySelectorAll("#main tr").length >= 7);
    await page.evaluate(() => {
      const tr = Array.from(document.querySelectorAll("#main tr")).find((r) => /Quay ropes/.test(r.innerText));
      const b = tr && Array.from(tr.querySelectorAll("button")).find((x) => x.textContent.trim() === "···");
      if (b) b.focus();
    });
    await page.keyboard.press("Enter");
    await page.waitForFunction(() => document.querySelectorAll("#ctxMenu [role='menuitem']").length > 0, { timeout: 2000 }).catch(() => {});
    const l13 = await page.evaluate(() => {
      const a = document.activeElement, first = document.querySelector("#ctxMenu [role='menuitem']");
      return { on: a ? (a.id || a.tagName) + (a.getAttribute("role") ? "[" + a.getAttribute("role") + "]" : "") : null, first: !!first && a === first };
    });
    await page.keyboard.press("Escape");
    check(l13.first, "l13 the three dots pressed by Enter put the hand on the menu's first item", l13);

    /* l10 to l12, in Polish, where the words are longest (the designer's dark Polish look, 2026-11-11). */
    const pl = await boot(browser, 1280, "pl");
    const plHome = async (which, h1) => {
      await pl.evaluate((which) => { const a = document.querySelector('#rail [data-act="home"][data-v="' + which + '"]'); if (a) a.click(); }, which);
      await pl.waitForFunction((h1) => ((document.querySelector("#main h1") || {}).textContent || "") === h1, {}, h1);
      await new Promise((r) => setTimeout(r, 120));
    };
    /* l10: the dashed card is never an orphan card. Either it is the last of equal columns on the cards' own row, its
       words on one line, or it is one line across the whole row under the cards. */
    const l10 = [];
    for (const w of [900, 1100, 1280, 1500, 1700, 2000, 2560]) {
      await pl.setViewport({ width: w, height: 900 });
      await plHome("overview", "Przegląd");
      l10.push(await pl.evaluate((w) => {
        const box = document.querySelector("#main .lw-recent");
        const all = box ? Array.from(box.children) : [];
        const more = all.find((b) => b.classList.contains("more"));
        const cards = all.filter((b) => b !== more).map((b) => b.getBoundingClientRect());
        if (!more || !cards.length) return { w, ok: false, why: "no cards" };
        const m = more.getBoundingClientRect(), bx = box.getBoundingClientRect(), b = more.querySelector("b");
        const r = document.createRange(); r.selectNodeContents(b);
        const lineRs = Array.from(r.getClientRects()).filter((x) => x.width > 0);
        const oneLine = lineRs.length > 0 && Math.max(...lineRs.map((x) => x.bottom)) - Math.min(...lineRs.map((x) => x.top)) < 1.6 * lineRs[0].height;
        const sameRow = Math.abs(m.top - cards[cards.length - 1].top) < 2;
        const widths = cards.map((c) => c.width).concat(m.width);
        const equal = Math.max(...widths) - Math.min(...widths) <= 2;
        const strip = Math.abs(m.left - bx.left) <= 1 && Math.abs(m.right - bx.right) <= 1 && m.top >= Math.max(...cards.map((c) => c.bottom)) - 1
          && m.height <= 48;
        const fits = b.scrollWidth <= b.clientWidth + 1;
        return { w, sameRow, equal, strip, oneLine, fits, height: Math.round(m.height), width: Math.round(m.width), box: Math.round(bx.width),
          ok: oneLine && fits && ((sameRow && equal) || strip) };
      }, w));
    }
    check(l10.every((x) => x.ok),
      "l10 in Polish at 900, 1100, 1280, 1500, 1700, 2000 and 2560 the dashed card is never alone on a row as a card: it is the last equal column on the cards' row with its words on one line, or a one-line strip across the row under them", l10);

    /* l11 (the copywriter, 2026-11-11): the revision says its word in Polish, in the Library's Published cell and on a card. */
    await pl.setViewport({ width: 1280, height: 900 });
    await plHome("overview", "Przegląd");
    const l11card = await pl.evaluate(() => {
      const b = Array.from(document.querySelectorAll("#main .lw-rc")).find((x) => /Harbour lamps/.test(x.innerText));
      return b ? b.innerText.replace(/\s+/g, " ").trim() : "";
    });
    await plHome("library", "Biblioteka");
    const l11cell = await pl.evaluate(() => {
      const heads = Array.from(document.querySelectorAll("#main th")).map((th) => th.textContent.trim());
      const tr = Array.from(document.querySelectorAll("#main tr")).find((r) => ((r.querySelector(".pn") || {}).textContent || "") === "Harbour lamps");
      /* The columns stand in a fixed order: Catalog, Languages, Cards, Draft, Checks, Reaches, Last edited, Published. */
      return tr ? { cell: tr.children[7].innerText.replace(/\s+/g, " ").trim(), head: heads[7] } : { cell: "(no row)" };
    });
    check(/^wersja\s4$/.test(l11cell.cell) && /\bwersja\s4\b/.test(l11card),
      "l11 in Polish the Library's Published cell and the Opened recently card say \"wersja 4\", not a bare number", { l11cell, l11card });

    /* l12 (the designer's 3b): a 7 px round dot 8 px before the words of Draft and Checks, centred on the line, green where
       all is published or clear and amber where something waits; the words keep the ink colour; no dot in Reaches or
       Published, nor in a cell still being filled. Light and dark. */
    const l12 = [];
    for (const theme of ["light", "dark"]) {
      await pl.evaluate((t) => document.documentElement.setAttribute("data-theme", t), theme);
      await new Promise((r) => setTimeout(r, 80));
      l12.push(await pl.evaluate((theme) => {
        const want = theme === "dark" ? { ok: "rgb(76, 195, 138)", look: "rgb(229, 164, 67)" } : { ok: "rgb(46, 158, 106)", look: "rgb(217, 138, 31)" };
        const heads = Array.from(document.querySelectorAll("#main th")).map((th) => th.textContent.trim());
        const col = (name) => ({ draft: 3, checks: 4, reaches: 5, published: 7 })[name];
        const rowOf = (name) => Array.from(document.querySelectorAll("#main tr")).find((r) => ((r.querySelector(".pn") || {}).textContent || "") === name);
        const dotIn = (td) => {
          const kids = Array.from(td.querySelectorAll("*")).filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.width < 12 && r.height > 0 && r.height < 12; });
          const pseudo = getComputedStyle(td, "::before");
          if (!kids.length) return pseudo.content && pseudo.content !== "none" && pseudo.content !== "normal" ? { pseudo: true } : null;
          const d = kids[0], dr = d.getBoundingClientRect(), cs = getComputedStyle(d);
          const range = document.createRange();
          const walk = document.createTreeWalker(td, NodeFilter.SHOW_TEXT);
          let textNode = null;
          while (!textNode && walk.nextNode()) if (walk.currentNode.textContent.trim()) textNode = walk.currentNode;
          if (!textNode) return { w: dr.width, h: dr.height, colour: cs.backgroundColor, noText: true };
          range.selectNodeContents(textNode);
          const tr = range.getClientRects()[0];
          return { w: Math.round(dr.width * 10) / 10, h: Math.round(dr.height * 10) / 10, round: parseFloat(cs.borderTopLeftRadius) >= dr.width / 2 - 0.5,
            colour: cs.backgroundColor, gap: Math.round((tr.left - dr.right) * 10) / 10,
            off: Math.round(((dr.top + dr.bottom) / 2 - (tr.top + tr.bottom) / 2) * 10) / 10, ink: getComputedStyle(td).color };
        };
        const ink = getComputedStyle(document.querySelector("#main")).color;
        const cell = (name, h) => { const tr = rowOf(name); return tr ? tr.children[col(h)] : null; };
        const harbourDraft = dotIn(cell("Harbour lamps", "draft") || document.body);
        const quayDraft = dotIn(cell("Quay ropes", "draft") || document.body);
        const quayChecks = dotIn(cell("Quay ropes", "checks") || document.body);
        const harbourChecks = dotIn(cell("Harbour lamps", "checks") || document.body);
        const others = ["reaches", "published"].map((h) => (Array.from(document.querySelectorAll("#main tr")).slice(1)
          .some((tr) => tr.children[col(h)] && dotIn(tr.children[col(h)])) ? "dot in " + h : "")).filter(Boolean);
        const shape = (d) => !!d && d.w === 7 && d.h === 7 && d.round && Math.abs(d.gap - 8) <= 0.6 && Math.abs(d.off) <= 1 && d.ink === ink;
        return { theme, heads, harbourDraft, quayDraft, quayChecks, harbourChecks, others,
          ok: shape(harbourDraft) && shape(quayDraft) && shape(quayChecks) && shape(harbourChecks)
            && harbourDraft.colour === want.ok && harbourChecks.colour === want.ok && quayDraft.colour === want.look && quayChecks.colour === want.look
            && !others.length };
      }, theme));
    }
    check(l12.every((x) => x.ok),
      "l12 in Polish, light and dark, Draft and Checks carry a 7 px round dot 8 px before their words and centred on the line, green for as published and all clear, amber for waiting, the words in ink; Reaches and Published carry none", l12);
    await pl.close();

  } finally {
    await browser.close();
  }
  process.stdout.write("#counts checks=" + checks + " failures=" + fails + " expected=16\n");
  process.exit(fails || checks !== 16 ? 1 : 0);
}

main().catch((err) => {
  process.stderr.write(String(err && err.stack || err) + "\n");
  process.exit(2);
});
