/* Studio Connections panel on the page's own field (board 982, finding 13, section D).
 *
 *     node tests/connections-field.mjs
 *
 * Headless Chrome on ui/index.html and ui/app.js.
 * What the eye sees (computed styles and dimensions):
 *   c1 at window widths 2000 and 1280, the Connections map draws no ground of its own: every box between the map's places and #main has a computed background-image of none, a background-color with alpha 0, no border and no box-shadow
 *   c2 every place on the map has an opaque background (alpha 1) of the panel's ground colour; each ghost place keeps a dashed border
 *   c3 the invitation is a card: opaque panel ground, a 1 px border, radius 12 px, padding 16px 18px
 *   c4 on the Overview, the title, the lede, every section heading and the line at the right of "Connections" each stand on an opaque ground of #main's own colour, the words' own hug where the dots give way only where the words are; and on every other screen that sits on #main's dot field, its title and lede do the same
 *   c5 at 900, 1280 and 2000, the Overview shows no horizontal scrollbar (its scrolling box has scrollWidth no more than clientWidth plus 1)
 *   c8 in Polish, a team's map: every place holds its words whole, inside the map, apart from its neighbours (the designer, 2026-11-11)
 *   c9 Enter on the second team tab keeps the hand on it
 *   c10 a team tab's focus ring is clipped by no box around it
 *   c11 a team of seventeen: the chip naming the rest ends on the right edge of the map's last column, under the teammates
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

const executablePath = CHROME_PATHS.find(p => fs.existsSync(p));
if (!executablePath) {
  process.stderr.write("No Chrome browser found to drive\n");
  process.exit(1);
}

let checks = 0, fails = 0;
function check(ok, line, detail) {
  checks++;
  if (ok) {
    process.stdout.write("  ok   " + line + "\n");
  } else {
    fails++;
    process.stdout.write("  FAIL " + line + (detail ? ": " + JSON.stringify(detail) : "") + "\n");
  }
}

/* c6 (Claudius kappa): the page ground is for words standing on the dot field; a word inside a card keeps the card's. */
const WORN_IN_CARDS = () => {
  const main = document.querySelector("#main"), mainBg = getComputedStyle(main).backgroundColor, out = [];
  const alphaOf = c => { const m = String(c).match(/rgba?\(([^)]+)\)/); if (!m) return 0; const p = m[1].split(","); return p.length > 3 ? +p[3] : 1; };
  for (const el of main.querySelectorAll("h1,h2,h3,.lede,.sec,.sx-crumb")) {
    let a = el.parentElement, ground = null;
    while (a && a !== main) { if (alphaOf(getComputedStyle(a).backgroundColor) > 0.5) { ground = a; break; } a = a.parentElement; }
    if (ground && getComputedStyle(el).backgroundColor === mainBg && getComputedStyle(ground).backgroundColor !== mainBg)
      out.push(el.tagName + "." + el.className + " in " + ground.tagName + "." + ground.className);
  }
  return out;
};
async function inspectOverviewAt(browser, width) {
  const page = await browser.newPage();
  await page.setViewport({ width, height: 900 });
  await page.evaluateOnNewDocument(() => {
    window.STUDIO = {
      host: async () => ({ version: "0.1.0" }),
      projects: async () => [
        {
          id: "p1",
          name: "Project One",
          dir: "C:/projects/p1",
          counts: { cards: 10 },
          rev: 1,
        },
      ],
      onMaximized: () => {},
      onTrayGo: () => {},
      onOpenDir: () => {},
      onTask: () => {},
      onTeamMoved: () => {},
      onRelayLapse: () => {},
      onRelaySyncNote: () => {},
    };
  });

  const url = "file:///" + HTML_FILE.replace(/\\/g, "/");
  await page.goto(url, { waitUntil: "load" });
  await page.waitForSelector("#main .projects", { timeout: 5000 });

  const data = await page.evaluate(() => {
    function parseAlpha(c) {
      if (!c || c === "transparent") return 0;
      let m = c.match(/rgba?\s*\(\s*[\d.]+\s*,\s*[\d.]+\s*,\s*[\d.]+(?:\s*,\s*([\d.]+))?\s*\)/);
      if (m) return m[1] !== undefined ? parseFloat(m[1]) : 1;
      m = c.match(/\/\s*([\d.]+)\s*\)/);
      if (m) return parseFloat(m[1]);
      return 1;
    }

    const main = document.querySelector("#main");
    const mainCs = getComputedStyle(main);
    const mainBg = mainCs.backgroundColor;
    const scrollWidth = main.scrollWidth;
    const clientWidth = main.clientWidth;

    // Check intermediate boxes between map places and #main
    const places = Array.from(document.querySelectorAll(".pad.projects .fam .dm-fold, .pad.projects .fam .dm-desk"));
    const ancestorBoxes = new Set();
    for (const pl of places) {
      let cur = pl.parentElement;
      while (cur && cur !== main) {
        ancestorBoxes.add(cur);
        cur = cur.parentElement;
      }
    }

    const intermediateBoxes = Array.from(ancestorBoxes).map(el => {
      const cs = getComputedStyle(el);
      const bgImg = cs.backgroundImage;
      const bgCol = cs.backgroundColor;
      const alpha = parseAlpha(bgCol);
      const hasBorder = (parseFloat(cs.borderTopWidth) > 0 && cs.borderTopStyle !== "none" && parseAlpha(cs.borderTopColor) > 0) ||
                        (parseFloat(cs.borderRightWidth) > 0 && cs.borderRightStyle !== "none" && parseAlpha(cs.borderRightColor) > 0) ||
                        (parseFloat(cs.borderBottomWidth) > 0 && cs.borderBottomStyle !== "none" && parseAlpha(cs.borderBottomColor) > 0) ||
                        (parseFloat(cs.borderLeftWidth) > 0 && cs.borderLeftStyle !== "none" && parseAlpha(cs.borderLeftColor) > 0);
      const hasShadow = cs.boxShadow !== "none";
      return {
        tag: el.tagName,
        className: el.className,
        bgImg,
        bgCol,
        alpha,
        hasBorder,
        borderTopWidth: cs.borderTopWidth,
        borderTopStyle: cs.borderTopStyle,
        hasShadow,
        boxShadow: cs.boxShadow,
      };
    });

    // Check places on the map
    const probe = document.createElement("div");
    probe.style.backgroundColor = "var(--panel)";
    document.body.appendChild(probe);
    const panelBg = getComputedStyle(probe).backgroundColor;
    probe.remove();

    const placesInfo = places.map(pl => {
      const cs = getComputedStyle(pl);
      const alpha = parseAlpha(cs.backgroundColor);
      return {
        className: pl.className,
        bgCol: cs.backgroundColor,
        alpha,
        matchesPanel: cs.backgroundColor === panelBg,
      };
    });

    const ghostPlaces = Array.from(document.querySelectorAll(".pad.projects .fam .ghost, .pad.projects .fam .dm-desk.named"));
    const ghostsInfo = ghostPlaces.map(g => {
      const cs = getComputedStyle(g);
      return {
        className: g.className,
        borderTopStyle: cs.borderTopStyle,
        isDashed: cs.borderTopStyle === "dashed",
      };
    });

    // Check invitation card
    const famgo = document.querySelector(".pad.projects .famgo");
    const famgoCs = famgo ? getComputedStyle(famgo) : null;
    const famgoInfo = famgoCs ? {
      bgCol: famgoCs.backgroundColor,
      alpha: parseAlpha(famgoCs.backgroundColor),
      matchesPanel: famgoCs.backgroundColor === panelBg,
      borderTopWidth: famgoCs.borderTopWidth,
      borderTopStyle: famgoCs.borderTopStyle,
      borderRadius: famgoCs.borderTopLeftRadius,
      paddingTop: famgoCs.paddingTop,
      paddingRight: famgoCs.paddingRight,
      paddingBottom: famgoCs.paddingBottom,
      paddingLeft: famgoCs.paddingLeft,
    } : null;

    // Check text grounds on Overview
    const h1 = document.querySelector(".pad.projects > h1");
    const lede = document.querySelector(".pad.projects > .lede");
    const famhSec = document.querySelector(".pad.projects .famh .sec");
    const famhRight = document.querySelector(".pad.projects .famh > *:not(.sec)");
    const tableSec = document.querySelector(".pad.projects > .sec");

    const textElements = [
      { name: "h1", el: h1 },
      { name: "lede", el: lede },
      { name: "famhSec", el: famhSec },
      { name: "famhRight", el: famhRight },
      { name: "tableSec", el: tableSec },
    ].filter(x => x.el).map(x => {
      /* The words stand on the page's ground through their hug, as wide as the words and no wider (tests/dots-hug.mjs holds the hug). */
      const cs = getComputedStyle(x.el.querySelector(".dg-hug") || x.el);
      return {
        name: x.name,
        bgCol: cs.backgroundColor,
        alpha: parseAlpha(cs.backgroundColor),
        matchesMainBg: cs.backgroundColor === mainBg,
      };
    });

    // c7: the invitation never lies over a place on the map; under the map it starts at This Studio's left edge
    const goR = famgo ? famgo.getBoundingClientRect() : null;
    const placeRs = Array.from(document.querySelectorAll(".pad.projects .fam .dm-fold, .pad.projects .fam .dm-desk")).map(p => p.getBoundingClientRect());
    const studioR = placeRs.length ? placeRs.reduce((a, b) => (b.left < a.left ? b : a)) : null;
    const overlaps = goR ? placeRs.filter(r => r.left < goR.right && goR.left < r.right && r.top < goR.bottom && goR.top < r.bottom).length : -1;
    const mapBottom = placeRs.length ? Math.max(...placeRs.map(r => r.bottom)) : 0;
    const panelLayout = goR ? { overlaps, beside: goR.left >= Math.max(...placeRs.map(r => r.right)), under: goR.top >= mapBottom - 1,
      leftOnStudio: !!studioR && Math.abs(goR.left - studioR.left) <= 2 } : null;

    return {
      panelLayout,
      scrollWidth,
      clientWidth,
      mainBg,
      panelBg,
      intermediateBoxes,
      placesInfo,
      ghostsInfo,
      famgoInfo,
      textElements,
    };
  });

  await page.close();
  return data;
}

/* c8 to c10 (Claudius sigma, 2026-11-11): a team's map in Polish, where the words are longest, and the team tabs by the keys.
   The stub's team (one folder, one teammate, as tests/library-screen.mjs has it) and a fuller one of six teammates, every
   state a teammate can be in and a folder's path for the channel. */
const TEAM_ONE = { id: "North quay", connection: "folder", projects: [{ id: "harbour", dir: "C:/studio/harbour", name: "" }], catalogs: ["harbour"],
  teammates: [{ id: "ada", name: "Ada", admitted: true }] };
const TEAM_SIX = { id: "Harbour office", connection: "folder", folder: "\\\\office\\share\\catalogs", projects: [{ id: "harbour", dir: "C:/studio/harbour", name: "" }],
  catalogs: ["harbour"], teammates: [
    { id: "t1", name: "Ada", admitted: true },
    { id: "t2", name: "Bart\u0142omiej Wi\u015bniewski", admitted: true, catalog: { title: "Harbour lamps", rev: 12, current: true } },
    { id: "t3", name: "Celina", admitted: false },
    { id: "t4", name: "Dorota", admitted: true, catalog: { title: "Harbour lamps", rev: 9, behind: true } },
    { id: "t5", name: "Eustachy", admitted: true, catalog: { title: "Quay ropes", rev: 3, foreign: true } },
    { id: "t6", name: "Feliks", admitted: true },
  ] };
const MAP_CATALOGS = [{ id: "harbour", name: "Harbour lamps", dir: "C:/studio/harbour", rev: 12, counts: { cards: 14 }, opened: "2026-11-11T10:00:00.000Z" }];

async function openPolish(browser, width, teams) {
  const page = await browser.newPage();
  await page.setViewport({ width, height: 900 });
  await page.evaluateOnNewDocument((catalogs, teams) => {
    const no = () => {};
    window.STUDIO = new Proxy({
      host: async () => ({ version: "0.1.0", tour: { offered: true, taken: true, at: 0 }, uiLang: "pl" }),
      projects: async () => ({ root: "C:/studio", projects: catalogs, sample: "" }),
      teams: async () => ({ teams }),
    }, { get: (o, k) => (k in o ? o[k] : typeof k !== "string" || k === "then" ? undefined : /^on[A-Z]/.test(k) ? no : async () => ({ error: null })) });
  }, MAP_CATALOGS, teams);
  await page.goto("file:///" + HTML_FILE.replace(/\\/g, "/"), { waitUntil: "load" });
  await page.waitForSelector("#main .projects", { timeout: 5000 });
  await page.waitForFunction((n) => document.querySelectorAll("#main .fam .dm-desk").length >= n, { timeout: 5000 }, teams.length ? 1 : 2);
  await page.waitForFunction(() => !document.querySelector(".e-launch-veil"), { timeout: 8000 }).catch(() => {});
  await new Promise((r) => setTimeout(r, 150));
  return page;
}

/* What the eye sees of a map: every place's words inside its place, every place inside the map's box, no two places
   over one another, places in one row at least 32 px apart, and the gaps between the three stages. */
const MAP_SEEN = () => {
  const fam = document.querySelector("#main .fam"), mapBox = fam.getBoundingClientRect();
  const places = Array.from(fam.querySelectorAll(".dm-fold, .dm-desk"));
  const rs = places.map((p) => p.getBoundingClientRect());
  const cut = [];
  places.forEach((p) => p.querySelectorAll(".nm, .sub, .st").forEach((t) => {
    if (t.scrollWidth > t.clientWidth) cut.push(t.textContent.trim() + " [" + t.clientWidth + "<" + t.scrollWidth + "]");
  }));
  const outside = rs.filter((r) => r.left < mapBox.left - 0.5 || r.right > mapBox.right + 0.5).length;
  let overlap = 0, tight = [];
  for (let i = 0; i < rs.length; i++) for (let j = i + 1; j < rs.length; j++) {
    const a = rs[i], b = rs[j];
    const rows = a.top < b.bottom && b.top < a.bottom;
    if (rows && a.left < b.right && b.left < a.right) overlap++;
    else if (rows) { const g = Math.max(b.left - a.right, a.left - b.right); if (g < 32) tight.push(Math.round(g)); }
  }
  const folds = places.filter((p) => p.classList.contains("dm-fold")).map((p) => p.getBoundingClientRect()).sort((a, b) => a.left - b.left);
  const desks = places.filter((p) => p.classList.contains("dm-desk")).map((p) => p.getBoundingClientRect());
  const deskLeft = Math.min(...desks.map((r) => r.left));
  const studio = folds[0], chans = folds.slice(1), chanRight = Math.max(...chans.map((r) => r.right));
  const stageGaps = [Math.round(Math.min(...chans.map((r) => r.left)) - studio.right), Math.round(deskLeft - chanRight)];
  return { cut, outside, overlap, tight, stageGaps, places: places.length };
};

async function inspectTeamMaps(browser) {
  /* The unconnected map at each width the team's maps are drawn at: since the rail stands beside the page at every width
     (tests/rail-left.mjs), the map's box at 900 is narrower than at 1280 and both maps close up there, so a team's stages are
     held to the unconnected map's at the same width, never to 1280's. */
  const out = { none: {}, maps: [] };
  for (const w of [900, 1280, 2000]) {
    const none = await openPolish(browser, w, []);
    out.none[w] = await none.evaluate("(" + MAP_SEEN.toString() + ")()");
    await none.close();
  }
  for (const [name, team] of [["one", TEAM_ONE], ["six", TEAM_SIX]]) for (const w of [900, 1280, 2000]) {
    const page = await openPolish(browser, w, [team]);
    const seen = await page.evaluate("(" + MAP_SEEN.toString() + ")()");
    const scroll = await page.evaluate(() => { const m = document.querySelector("#main"); return m.scrollWidth - m.clientWidth; });
    out.maps.push(Object.assign({ name, w, scroll }, seen));
    await page.close();
  }
  return out;
}

/* c11 (the designer, 2026-11-11: "Put its right edge on the map's last column's right edge, at every width, as it already looks
   at 900."). Seventeen teammates, so sixteen are drawn and the chip names the one more. */
const TEAM_MANY = { id: "Quay", connection: "relay", projects: [{ id: "harbour", dir: "C:/studio/harbour", name: "" }], catalogs: ["harbour"],
  teammates: Array.from({ length: 17 }, (_, i) => ({ id: "m" + i, name: "Biurko " + (i + 1), admitted: true,
    catalog: { title: "Harbour lamps", rev: 12, current: i % 3 === 0 } })) };
async function inspectMoreChip(browser) {
  const out = [];
  for (const w of [900, 1280, 2000]) {
    const page = await openPolish(browser, w, [TEAM_MANY]);
    out.push(await page.evaluate((w) => {
      const fam = document.querySelector("#main .fam"), chip = fam && fam.querySelector(".fam-more .btn");
      const desks = Array.from(fam.querySelectorAll(".dm-desk")).map((d) => d.getBoundingClientRect());
      if (!chip || !desks.length) return { w, ok: false, why: "no chip or no teammates" };
      const c = chip.getBoundingClientRect(), box = fam.getBoundingClientRect();
      const mapRight = Math.max(...desks.map((r) => r.right)), lowest = Math.max(...desks.map((r) => r.bottom));
      const off = Math.round((c.right - mapRight) * 10) / 10;
      return { w, desks: desks.length, chipRight: Math.round(c.right), mapRight: Math.round(mapRight), off, under: c.top >= lowest,
        inside: c.left >= box.left && c.right <= box.right + 0.5 && c.bottom <= box.bottom + 0.5,
        ok: desks.length === 16 && Math.abs(off) <= 1 && c.top >= lowest && c.left >= box.left && c.right <= box.right + 0.5 && c.bottom <= box.bottom + 0.5 };
    }, w));
    await page.close();
  }
  return out;
}

async function inspectTeamTabs(browser) {
  const page = await openPolish(browser, 1280, [TEAM_ONE, TEAM_SIX]);
  const cdp = await (page.createCDPSession ? page.createCDPSession() : page.target().createCDPSession());
  await cdp.send("Emulation.setFocusEmulationEnabled", { enabled: true });
  await page.waitForSelector('#main .teams [data-act="team-tab"]', { timeout: 5000 });
  /* The hand comes from the keys: Tab from the control before the tabs, as a keyboard user arrives. */
  await page.evaluate(() => { const t = document.querySelector('#main .teams [data-act="team-tab"][data-i="1"]'); t.focus(); });
  await page.keyboard.press("Enter");
  await new Promise((r) => setTimeout(r, 200));
  const after = await page.evaluate(() => {
    const a = document.activeElement;
    const on = document.querySelector('#main .teams [data-act="team-tab"].on');
    return { focused: a && a.getAttribute ? a.getAttribute("data-i") : null, act: a && a.getAttribute ? a.getAttribute("data-act") : null,
      on: on ? on.getAttribute("data-i") : null };
  });
  /* Each tab's ring, read as the eye sees it: the outline's outer edge against every box that clips it. */
  const RING = () => {
    const a = document.activeElement, cs = getComputedStyle(a);
    const visible = a.matches(":focus-visible") && cs.outlineStyle !== "none" && parseFloat(cs.outlineWidth) > 0;
    const grow = parseFloat(cs.outlineOffset) + parseFloat(cs.outlineWidth);
    const r = a.getBoundingClientRect(), ring = { left: r.left - grow, top: r.top - grow, right: r.right + grow, bottom: r.bottom + grow };
    const clipped = [];
    for (let p = a.parentElement; p && p !== document.documentElement; p = p.parentElement) {
      const ps = getComputedStyle(p);
      if (ps.overflowX === "visible" && ps.overflowY === "visible") continue;
      const b = p.getBoundingClientRect();
      const box = { left: b.left + parseFloat(ps.borderLeftWidth), top: b.top + parseFloat(ps.borderTopWidth),
        right: b.right - parseFloat(ps.borderRightWidth), bottom: b.bottom - parseFloat(ps.borderBottomWidth) };
      const by = Math.max(box.left - ring.left, box.top - ring.top, ring.right - box.right, ring.bottom - box.bottom);
      if (by > 0.5) clipped.push((p.className || p.tagName) + " by " + Math.round(by * 10) / 10);
    }
    return { tab: a.getAttribute("data-i"), visible, offset: cs.outlineOffset, width: cs.outlineWidth, clipped };
  };
  const rings = [await page.evaluate(RING)];
  await page.keyboard.down("Shift"); await page.keyboard.press("Tab"); await page.keyboard.up("Shift");
  await new Promise((r) => setTimeout(r, 100));
  rings.push(await page.evaluate(RING));
  await page.close();
  return { after, rings };
}

async function inspectOtherScreens(browser) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });
  await page.evaluateOnNewDocument(() => {
    window.STUDIO = {
      host: async () => ({ version: "0.1.0" }),
      projects: async () => [
        {
          id: "p1",
          name: "Project One",
          dir: "C:/projects/p1",
          counts: { cards: 10 },
          rev: 1,
        },
      ],
      onMaximized: () => {},
      onTrayGo: () => {},
      onOpenDir: () => {},
      onTask: () => {},
      onTeamMoved: () => {},
      onRelayLapse: () => {},
      onRelaySyncNote: () => {},
    };
  });

  const url = "file:///" + HTML_FILE.replace(/\\/g, "/");
  await page.goto(url, { waitUntil: "load" });
  await page.waitForSelector("#main .projects", { timeout: 5000 });

  // Settings
  await page.evaluate(() => {
    const btn = document.querySelector('[data-act="settings"]');
    if (btn) btn.click();
  });
  await page.waitForSelector(".sx-page", { timeout: 5000 });

  const settingsInfo = await page.evaluate((wornSrc) => {
    const worn = (0, eval)(wornSrc)();
    const mainBg = getComputedStyle(document.querySelector("#main")).backgroundColor;
    const crumb = document.querySelector(".sx-page .sx-crumb");
    const groupHead = document.querySelector(".sx-page .sx-group > h3");
    const h2 = document.querySelector(".sx-page h2");
    const lede = document.querySelector(".sx-page .lede");
    return {
      screen: "Settings", worn,
      crumb: crumb ? { text: crumb.textContent, matches: getComputedStyle(crumb.querySelector(".dg-hug") || crumb).backgroundColor === mainBg } : null,
      groupHead: groupHead ? { text: groupHead.textContent, matches: getComputedStyle(groupHead.querySelector(".dg-hug") || groupHead).backgroundColor === mainBg } : null,
      h2: h2 ? { text: h2.textContent, bg: getComputedStyle(h2.querySelector(".dg-hug") || h2).backgroundColor, matches: getComputedStyle(h2.querySelector(".dg-hug") || h2).backgroundColor === mainBg } : null,
      lede: lede ? { text: lede.textContent, bg: getComputedStyle(lede.querySelector(".dg-hug") || lede).backgroundColor, matches: getComputedStyle(lede.querySelector(".dg-hug") || lede).backgroundColor === mainBg } : null,
    };
  }, "(" + WORN_IN_CARDS.toString() + ")");
  /* Settings opens on "All settings" where the tree has that page (2026-11-16), and that page has no line above its heading:
     the line's ground is then read on a single section, so c4 judges it as before. */
  if (!settingsInfo.crumb) {
    await page.evaluate(() => { const a = document.querySelector('.sx-nav a[data-act="sx-sec"]'); if (a) a.click(); });
    await page.waitForSelector(".sx-page .sx-crumb", { timeout: 5000 });
    settingsInfo.crumb = await page.evaluate(() => {
      const mainBg = getComputedStyle(document.querySelector("#main")).backgroundColor;
      const crumb = document.querySelector(".sx-page .sx-crumb");
      return crumb ? { text: crumb.textContent, matches: getComputedStyle(crumb.querySelector(".dg-hug") || crumb).backgroundColor === mainBg } : null;
    });
  }

  // Maintenance
  await page.evaluate(() => {
    const btn = document.querySelector(".sx-foot a");
    if (btn) btn.click();
  });
  await page.waitForSelector(".mt-page", { timeout: 5000 });

  const maintInfo = await page.evaluate((wornSrc) => {
    const worn = (0, eval)(wornSrc)();
    const mainBg = getComputedStyle(document.querySelector("#main")).backgroundColor;
    const h1 = document.querySelector(".mt-page h1");
    const lede = document.querySelector(".mt-page .lede");
    return {
      screen: "Maintenance", worn,
      h1: h1 ? { text: h1.textContent, bg: getComputedStyle(h1.querySelector(".dg-hug") || h1).backgroundColor, matches: getComputedStyle(h1.querySelector(".dg-hug") || h1).backgroundColor === mainBg } : null,
      lede: lede ? { text: lede.textContent, bg: getComputedStyle(lede.querySelector(".dg-hug") || lede).backgroundColor, matches: getComputedStyle(lede.querySelector(".dg-hug") || lede).backgroundColor === mainBg } : null,
    };
  }, "(" + WORN_IN_CARDS.toString() + ")");

  await page.close();
  return { settingsInfo, maintInfo };
}

async function main() {
  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ["--hide-scrollbars", "--no-sandbox"],
  });

  try {
    const at2000 = await inspectOverviewAt(browser, 2000);
    const at1280 = await inspectOverviewAt(browser, 1280);
    const at900 = await inspectOverviewAt(browser, 900);
    const otherScreens = await inspectOtherScreens(browser);

    // c1 at window widths 2000 and 1280, the Connections map draws no ground of its own: every box between the map's places and #main has a computed background-image of none, a background-color with alpha 0, no border and no box-shadow
    const c1_2000_ok = at2000.intermediateBoxes.length > 0 && at2000.intermediateBoxes.every(b => b.bgImg === "none" && b.alpha === 0 && !b.hasBorder && !b.hasShadow);
    const c1_1280_ok = at1280.intermediateBoxes.length > 0 && at1280.intermediateBoxes.every(b => b.bgImg === "none" && b.alpha === 0 && !b.hasBorder && !b.hasShadow);
    check(c1_2000_ok && c1_1280_ok,
      "c1 at window widths 2000 and 1280, the Connections map draws no ground of its own: every box between the map's places and #main has a computed background-image of none, a background-color with alpha 0, no border and no box-shadow",
      { at2000: at2000.intermediateBoxes, at1280: at1280.intermediateBoxes });

    // c2 every place on the map has an opaque background (alpha 1) of the panel's ground colour; each ghost place keeps a dashed border
    const c2_places_ok = at1280.placesInfo.length > 0 && at1280.placesInfo.every(p => p.alpha === 1 && p.matchesPanel);
    const c2_ghosts_ok = at1280.ghostsInfo.length > 0 && at1280.ghostsInfo.every(g => g.isDashed);
    check(c2_places_ok && c2_ghosts_ok,
      "c2 every place on the map has an opaque background (alpha 1) of the panel's ground colour; each ghost place keeps a dashed border",
      { places: at1280.placesInfo, ghosts: at1280.ghostsInfo });

    // c3 the invitation is a card: opaque panel ground, a 1 px border, radius 12 px, padding 16px 18px
    const f = at1280.famgoInfo;
    const c3_ok = !!f && f.alpha === 1 && f.matchesPanel &&
      f.borderTopWidth === "1px" && f.borderTopStyle === "solid" &&
      parseInt(f.borderRadius, 10) === 12 &&
      f.paddingTop === "16px" && f.paddingBottom === "16px" &&
      f.paddingLeft === "18px" && f.paddingRight === "18px";
    check(c3_ok,
      "c3 the invitation is a card: opaque panel ground, a 1 px border, radius 12 px, padding 16px 18px",
      f);

    // c4 on the Overview, the title, the lede, every section heading and the line at the right of "Connections" each stand on an opaque ground of #main's own colour, the words' own hug where the dots give way only where the words are; and on every other screen that sits on #main's dot field, its title and lede do the same
    const c4_ov_ok = at1280.textElements.length >= 4 && at1280.textElements.every(t => t.alpha === 1 && t.matchesMainBg);
    const c4_set_ok = !!otherScreens.settingsInfo.h2?.matches && !!otherScreens.settingsInfo.lede?.matches && !!otherScreens.settingsInfo.crumb?.matches && !!otherScreens.settingsInfo.groupHead?.matches;
    const c4_maint_ok = !!otherScreens.maintInfo.h1?.matches && !!otherScreens.maintInfo.lede?.matches;
    check(c4_ov_ok && c4_set_ok && c4_maint_ok,
      "c4 on the Overview, the title, the lede, every section heading and the line at the right of \"Connections\" each stand on an opaque ground of #main's own colour, the words' own hug where the dots give way only where the words are; and on every other screen that sits on #main's dot field, its title and lede do the same",
      { overview: at1280.textElements, settings: otherScreens.settingsInfo, maintenance: otherScreens.maintInfo });

    // c7 at 900 the invitation stands under the map at This Studio's left edge and over no place; at 2000 beside the map
    const p9 = at900.panelLayout, p20 = at2000.panelLayout;
    check(!!p9 && !!p20 && p9.overlaps === 0 && p9.under && p9.leftOnStudio && p20.overlaps === 0 && p20.beside,
      "c7 at 900 the invitation stands under the map, its left edge on This Studio's, over no place; at 2000 it stands beside the map", { at900: p9, at2000: p20 });

    // c6 no word inside a card of its own ground wears the page ground, on Settings and Maintenance
    const worn6 = [].concat(otherScreens.settingsInfo.worn || [], otherScreens.maintInfo.worn || []);
    check(worn6.length === 0, "c6 on Settings and Maintenance no word inside a card wears the page ground", worn6.slice(0, 8));

    // c5 at 900, 1280 and 2000, the Overview shows no horizontal scrollbar (its scrolling box has scrollWidth no more than clientWidth plus 1)
    const c5_900_ok = at900.scrollWidth <= at900.clientWidth + 1;
    const c5_1280_ok = at1280.scrollWidth <= at1280.clientWidth + 1;
    const c5_2000_ok = at2000.scrollWidth <= at2000.clientWidth + 1;
    check(c5_900_ok && c5_1280_ok && c5_2000_ok,
      "c5 at 900, 1280 and 2000, the Overview shows no horizontal scrollbar (its scrolling box has scrollWidth no more than clientWidth plus 1)",
      { at900: { scrollWidth: at900.scrollWidth, clientWidth: at900.clientWidth },
        at1280: { scrollWidth: at1280.scrollWidth, clientWidth: at1280.clientWidth },
        at2000: { scrollWidth: at2000.scrollWidth, clientWidth: at2000.clientWidth } });

    /* c8 (the designer, 2026-11-11: "a node is as wide as its words and nodes stand apart as in the unconnected map"). */
    const maps = await inspectTeamMaps(browser);
    const noneGap = (w) => Math.min(...maps.none[w].stageGaps);
    const c8bad = maps.maps.filter((m) => m.cut.length || m.outside || m.overlap || m.tight.length || m.scroll > 1
      || (m.name === "one" && Math.min(...m.stageGaps) < noneGap(m.w) - 1));
    check(maps.maps.length === 6 && !c8bad.length,
      "c8 in Polish at 900, 1280 and 2000, for a team of one teammate and one of six, every place on the map holds its words whole, stays inside the map, overlaps no other and stands at least 32 px from its neighbour in a row; the one-teammate team's stages stand as far apart as the unconnected map's at the same width",
      { noneGaps: Object.fromEntries(Object.entries(maps.none).map(([w, n]) => [w, n.stageGaps])), bad: c8bad.length ? c8bad : undefined, maps: maps.maps.map((m) => ({ name: m.name, w: m.w, gaps: m.stageGaps, cut: m.cut.length })) });

    /* c9 and c10 (the test architect's keyboard pass, 2026-11-11, items 9 and 10). */
    const tabs = await inspectTeamTabs(browser);
    check(tabs.after.act === "team-tab" && tabs.after.focused === "1" && tabs.after.on === "1",
      "c9 Enter on the second team tab switches to it and the hand stays on that tab", tabs.after);
    check(tabs.rings.length === 2 && tabs.rings.every((r) => r.visible && !r.clipped.length) && tabs.rings[1].tab === "0",
      "c10 the focus ring of the first and the second team tab is drawn whole, clipped by no box around it", tabs.rings);

    const chips = await inspectMoreChip(browser);
    check(chips.length === 3 && chips.every((x) => x.ok),
      "c11 in Polish at 900, 1280 and 2000, a team of seventeen: the chip naming the one more ends within 1 px of the right edge of the map's last column, under every teammate and inside the map", chips);

  } finally {
    await browser.close();
  }

  process.stdout.write("#counts checks=" + checks + " failures=" + fails + " expected=11\n");
  process.exit(fails || checks !== 11 ? 1 : 0);
}

main().catch(err => {
  process.stderr.write(String(err && err.stack || err) + "\n");
  process.exit(2);
});
