/* THE "ALL SETTINGS" PAGE, ITS RAIL ROW AND THE CRUMB BACK TO IT (node, no browser).
 *
 * gate-kind: node
 *
 *     node tests/all-settings.mjs
 *
 * Node only, no Electron window opens.
 * Claims:
 *   as1  in English and Polish, Settings opens on "All settings" (the designer's choice, as the desk does); with S.sx.sec = "all",
 *        the "All settings" row stands first in .sx-nav and is the sole marked row
 *   as2  in English and Polish, with S.sx.sec = "all", sxPageHtml() shows every listed section once,
 *        in list order, with the exact rows (in order) and card count of each section's own page
 *   as3  in English and Polish, a single section's crumb is a link ("All settings") that returns
 *        to S.sx.sec = "all" via ACTS["sx-all"]; a search keeps the plain "Settings" crumb
 *   as4  ACTS["sx-sec"] refuses unknown ids and accepts "all"; followChanged() repaints live on "all"
 *
 * Proved by making each claim fail on a scratch copy of the tree (ETIUDA_PLANTS=off skips).
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { loadPage } from "./page-stand-in.mjs";
import { plantText } from "./plant-copy.mjs";
import { clearScratch, dropScratch } from "./scratch.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const SELF = fileURLToPath(import.meta.url);
const SCRATCH = path.join(ROOT, "scratch", "all-settings");
const ONLY = process.env.ALL_SETTINGS_ONLY || "";
const PLANTS_OFF = process.env.ETIUDA_PLANTS === "off";
const IDS = ["as1", "as2", "as3", "as4"];
let plantsCopy = null;

function no(id, why) { console.error(id + " " + why); return false; }

function rowsIn(html) {
  return [...String(html).matchAll(/data-row="([^"]+)"/g)].map((m) => m[1]);
}

function cardsIn(html) {
  return (String(html).match(/class="sx-card"/g) || []).length;
}

function makePage(lang) {
  const ctx = loadPage({
    api: {
      aiSettings: async () => ({ provider: "", endpoint: "", address: "", model: "", hasKey: false, managed: {}, providers: [], said: [] }),
      followState: async () => ({ follow: { state: "following", channel: "relay", leadName: "Ada", catalogs: [] } }),
    },
    uiLang: lang,
  });
  ctx.page.S.host = {
    version: "0.1.0",
    platform: "win32",
    loginItem: { openAtLogin: false },
    signIn: ["microsoft", "google"],
  };
  ctx.page.S.screen = "settings";
  return ctx;
}

const CHECKS = {
  async as1() {
    for (const [lang, label] of [["en", "All settings"], ["pl", "Wszystkie ustawienia"]]) {
      const { page } = makePage(lang);
      if (page.S.sx.sec !== "all") {
        return no("as1", lang + " Settings does not open on All settings: S.sx.sec is " + page.S.sx.sec);
      }
      page.S.sx.sec = "all";
      page.S.sx.q = "";
      const html = page.settingsPageHtml();
      const nav = (/<nav class="sx-nav"[\s\S]*?<\/nav>/.exec(html) || [""])[0];
      const links = [...nav.matchAll(/<a([^>]*)>([\s\S]*?)<\/a>/g)]
        .filter((m) => !/data-act="to-screen"/.test(m[1]))
        .map((m) => ({
          attrs: m[1],
          text: m[2].replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim(),
          on: /\bclass="[^"]*\bon\b/.test(m[1]),
          current: /aria-current="page"/.test(m[1]),
        }));
      if (!links.length || links[0].text !== label || !/data-act="sx-all"/.test(links[0].attrs)) {
        return no("as1", lang + " first nav link is not All settings: " + JSON.stringify(links[0]));
      }
      const onLinks = links.filter((l) => l.on || l.current);
      if (onLinks.length !== 1 || onLinks[0] !== links[0]) {
        return no("as1", lang + " marked rows in nav expected only index 0, got " + JSON.stringify(onLinks));
      }
    }
    return true;
  },

  async as2() {
    for (const [lang, tip] of [["en", "Opens this section alone"], ["pl", "Otwiera tylko tę sekcję"]]) {
      const { page } = makePage(lang);
      const listed = page.__get("sxListed")();
      const expectedRows = [];
      let expectedCards = 0;
      for (const sec of listed) {
        page.S.sx.sec = sec.id;
        page.S.sx.q = "";
        const secHtml = page.sxPageHtml();
        expectedRows.push(...rowsIn(secHtml));
        expectedCards += cardsIn(secHtml);
      }

      page.S.sx.sec = "all";
      page.S.sx.q = "";
      const allHtml = page.sxPageHtml();
      const blockIds = [...allHtml.matchAll(/<section class="sx-block" data-sec="([^"]+)">/g)].map((m) => m[1]);
      const expectedIds = listed.map((s) => s.id);
      if (JSON.stringify(blockIds) !== JSON.stringify(expectedIds)) {
        return no("as2", lang + " section blocks mismatch: got " + JSON.stringify(blockIds) + " vs " + JSON.stringify(expectedIds));
      }
      for (const sec of listed) {
        const re = new RegExp('<button[^>]*data-act="sx-sec"[^>]*data-v="' + sec.id + '"[^>]*title="' + tip + '"[^>]*>' + sec.name().replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "</button>");
        if (!re.test(allHtml)) {
          return no("as2", lang + " missing heading button for " + sec.id);
        }
      }
      const actualRows = rowsIn(allHtml);
      if (JSON.stringify(actualRows) !== JSON.stringify(expectedRows)) {
        return no("as2", lang + " row ids mismatch: got " + JSON.stringify(actualRows) + " vs " + JSON.stringify(expectedRows));
      }
      const actualCards = cardsIn(allHtml);
      if (actualCards !== expectedCards) {
        return no("as2", lang + " card count mismatch: got " + actualCards + " vs " + expectedCards);
      }
    }
    return true;
  },

  async as3() {
    for (const [lang, crumbWord, settingsWord] of [["en", "All settings", "Settings"], ["pl", "Wszystkie ustawienia", "Ustawienia"]]) {
      const { page } = makePage(lang);
      page.S.sx.sec = "general";
      page.S.sx.q = "";
      const secHtml = page.sxPageHtml();
      const crumbLink = /<a class="sx-crumb sx-back"[^>]*data-act="sx-all"[^>]*>([^<]+)<\/a>/.exec(secHtml);
      if (!crumbLink || crumbLink[1] !== crumbWord) {
        return no("as3", lang + " single-section crumb is not link '" + crumbWord + "': " + secHtml.slice(0, 140));
      }

      page.S.sx.q = "theme";
      const searchPageHtml = page.settingsPageHtml();
      const searchBody = page.sxPageHtml();
      if (!searchBody.startsWith('<div class="sx-crumb">' + settingsWord + "</div>")) {
        return no("as3", lang + " search crumb changed: " + searchBody.slice(0, 120));
      }
      const nav = (/<nav class="sx-nav"[\s\S]*?<\/nav>/.exec(searchPageHtml) || [""])[0];
      if (/\bclass="[^"]*\bon\b/.test(nav)) {
        return no("as3", lang + " search left a nav row marked");
      }

      page.ACTS["sx-all"]();
      if (page.S.sx.sec !== "all" || page.S.sx.q !== "") {
        return no("as3", lang + " ACTS['sx-all'] did not switch to all: " + JSON.stringify(page.S.sx));
      }
    }
    return true;
  },

  async as4() {
    const { page, node } = makePage("en");
    page.S.sx.sec = "general";
    page.ACTS["sx-sec"]({ getAttribute: () => "no-such-section" });
    if (page.S.sx.sec !== "general") {
      return no("as4", "sx-sec accepted unknown section: " + page.S.sx.sec);
    }
    page.ACTS["sx-sec"]({ getAttribute: () => "all" });
    if (page.S.sx.sec !== "all") {
      return no("as4", "sx-sec did not accept 'all': " + page.S.sx.sec);
    }
    page.ACTS["sx-sec"]({ getAttribute: () => "account" });
    if (page.S.sx.sec !== "account") {
      return no("as4", "sx-sec did not switch to account");
    }
    page.ACTS["sx-sec"]({ getAttribute: () => "ai" });
    if (page.S.sx.sec !== "ai") {
      return no("as4", "sx-sec did not switch to ai");
    }

    page.S.sx.sec = "all";
    page.S.sx.q = "";
    page.S.cover = null;
    await page.followChanged();
    const sxPage = node("#sxPage");
    const painted = sxPage ? sxPage.innerHTML : "";
    if (!painted.includes("Led by Ada")) {
      return no("as4", "followChanged did not repaint teams inside the all-settings page");
    }
    return true;
  },
};

const PLANTS = [
  ["as1", "ui/app.js",
    '      + "<a" + saidOn("page", !searching && S.sx.sec === "all") + \' data-act="sx-all" tabindex="0">\' + I("facts") + "<span>" + esc(T("All settings")) + "</span></a>" /* plant:sx-all-row */',
    '      + ""'],
  ["as1", "ui/app.js",
    '      + listed.map((x) => "<a" + saidOn("page", !searching && x.id === S.sx.sec) + \' data-act="sx-sec" data-v="\' + x.id + \'" tabindex="0">\' /* plant:sx-all-two-marks */',
    '      + listed.map((x, idx) => "<a" + saidOn("page", !searching && (x.id === S.sx.sec || (S.sx.sec === "all" && idx === 0))) + \' data-act="sx-sec" data-v="\' + x.id + \'" tabindex="0">\''],
  ["as2", "ui/app.js",
    '        + err + \'<div class="sx-all">\' + listed.map((s) => sxBlockHtml(s)).join("") + "</div>"; /* plant:sx-all-drop */',
    '        + err + \'<div class="sx-all">\' + listed.slice(1).map((s) => sxBlockHtml(s)).join("") + "</div>";'],
  ["as3", "ui/app.js",
    '    return \'<a class="sx-crumb sx-back" href="#settings" data-act="sx-all">\' + esc(T("All settings")) + "</a><h2>" + esc(sec.name()) /* plant:sx-crumb-plain */',
    '    return \'<div class="sx-crumb">\' + esc(T("Settings")) + "</div><h2>" + esc(sec.name())'],
];

function sha(buf) { return crypto.createHash("sha256").update(buf).digest("hex"); }
function plantOnce(id, rel, from, to) {
  const tree = plantsCopy;
  const file = path.join(tree, rel);
  const buf = fs.readFileSync(file);
  const was = sha(buf);
  const next = plantText(buf.toString("utf8"), from, to, rel);
  let child = null;
  try {
    fs.writeFileSync(file, next, "utf8");
    child = spawnSync(process.execPath, [path.join(tree, path.relative(ROOT, SELF))], {
      cwd: tree,
      env: Object.assign({}, process.env, { ALL_SETTINGS_ONLY: id, ETIUDA_PLANTS: "off" }),
      encoding: "utf8",
      timeout: 120000,
    });
  } finally {
    fs.writeFileSync(file, buf);
    if (sha(fs.readFileSync(file)) !== was) throw new Error(id + " restore mismatch in " + rel);
  }
  const red = !!(child && child.status === 1 && String(child.stdout || "").includes("PLANT-RED"));
  if (!red) {
    console.error(id + " plant did not bite: status " + (child && child.status));
    console.error(String((child && child.stdout) || "") + String((child && child.stderr) || ""));
  }
  return red;
}

async function main() {
  clearScratch(SCRATCH);
  fs.mkdirSync(SCRATCH, { recursive: true });
  const planted = IDS.slice(0, 3).every((id) => PLANTS.some((p) => p[0] === id));
  if (!planted) {
    console.log("FAIL a check with no plant");
    dropScratch(SCRATCH, "all-settings");
    process.exit(1);
  }
  if (PLANTS_OFF) {
    console.log("NOT RUN the plants phase: " + PLANTS.length + " plants each turn their check red in a scratch copy (ETIUDA_PLANTS=off)");
  } else {
    const { plantsTree, treeSha, dropPlantsTree } = await import("./plants-tree.mjs");
    const before = treeSha(ROOT);
    const files = ["ui/app.js"];
    const shas = files.map((rel) => sha(fs.readFileSync(path.join(ROOT, rel))));
    let red = 0;
    let held = false;
    let same = false;
    try {
      plantsCopy = plantsTree(ROOT, "all-settings");
      for (const [id, rel, from, to] of PLANTS) {
        const ok = plantOnce(id, rel, from, to);
        console.log((ok ? "plant " : "PLANT FAIL ") + id + (ok ? " red" : ""));
        if (ok) red++;
      }
      held = treeSha(ROOT) === before;
      console.log((held ? "ok   " : "FAIL ") + "the checkout's sha256 over src/, shell/ and ui/ is unchanged after the plants phase");
      same = files.every((rel, i) => sha(fs.readFileSync(path.join(ROOT, rel))) === shas[i]);
      console.log((same ? "ok   " : "FAIL ") + "the planted files are byte for byte as they were (sha256)");
    } finally {
      dropPlantsTree(plantsCopy, ROOT);
    }
    if (red !== PLANTS.length || !held || !same) {
      dropScratch(SCRATCH, "all-settings");
      process.exit(1);
    }
  }

  let n = 0;
  for (const id of IDS) {
    let ok = false;
    try { ok = await CHECKS[id](); }
    catch (e) { console.error(id + " " + ((e && e.stack) || e)); ok = false; }
    console.log((ok ? "ok   " : "FAIL ") + id);
    if (ok) n++;
  }
  console.log("all-settings " + (n + (PLANTS_OFF ? 0 : 1)) + "/" + (IDS.length + 1)
    + (PLANTS_OFF ? ", 1 skipped" : ", plants " + PLANTS.length + "/" + PLANTS.length + " red"));
  console.log("#counts checks=" + (IDS.length + (PLANTS_OFF ? 0 : 1)) + " skipped=" + (PLANTS_OFF ? 1 : 0)
    + " failed=" + (IDS.length - n) + " expected=" + (IDS.length + 1));
  dropScratch(SCRATCH, "all-settings");
  process.exit(n === IDS.length ? 0 : 1);
}

if (ONLY) {
  const fn = CHECKS[ONLY];
  if (!fn) { console.error("unknown " + ONLY); process.exit(2); }
  fs.mkdirSync(SCRATCH, { recursive: true });
  Promise.resolve(fn()).then((ok) => {
    console.log(ok ? "PLANT-GREEN" : "PLANT-RED");
    process.exit(ok ? 0 : 1);
  }).catch((e) => {
    console.error((e && e.stack) || e);
    process.exit(2);
  });
} else {
  main().catch((e) => {
    console.error((e && e.stack) || e);
    try { dropScratch(SCRATCH, "all-settings"); } catch { /* verdict is error above */ }
    process.exit(1);
  });
}
