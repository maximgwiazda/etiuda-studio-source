/* SETTINGS SEARCH FOLDS ACCENTS IN BOTH THE QUERY AND THE ROWS, THROUGH searchFold.
 *
 * gate-kind: node
 *
 *     node tests/settings-search.mjs
 *
 * Node only, no Electron window opens.
 * Claims:
 *   ss1  in Polish, typing "jezyk" finds the Interface language row ("Język interfejsu") and omits unrelated rows
 *   ss2  in Polish, typing "JĘZYK" and "język" (with whitespace) also find that row; an unmatched search shows no rows
 *   ss3  in English, an accented query ("întérfâcé") still matches the folded row ("Interface language")
 *   ss4  in Polish, typing plain "l" ("zakladce", "lokalna") finds rows holding "ł" ("W nowej zakładce",
 *        "Wyczyść pamięć lokalną…"), and typing "ł" ("zakładce") still finds them
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
const SCRATCH = path.join(ROOT, "scratch", "settings-search");
const ONLY = process.env.SETTINGS_SEARCH_ONLY || "";
const PLANTS_OFF = process.env.ETIUDA_PLANTS === "off";
const IDS = ["ss1", "ss2", "ss3", "ss4"];
let plantsCopy = null;

function no(id, why) { console.error(id + " " + why); return false; }

function rowsIn(html) {
  return [...String(html).matchAll(/data-row="([^"]+)"/g)].map((m) => m[1]);
}

const CHECKS = {
  async ss1() {
    const { page } = loadPage({ api: {}, uiLang: "pl" });
    page.S.screen = "settings";
    page.S.sx.sec = "general";
    page.S.sx.q = "jezyk";
    const html = page.sxPageHtml();
    const rows = rowsIn(html);
    if (!rows.includes("lang") || html.indexOf("Język interfejsu") < 0) {
      return no("ss1", "jezyk did not find lang row in Polish: rows=" + JSON.stringify(rows));
    }
    if (rows.includes("theme") || rows.includes("reset")) {
      return no("ss1", "jezyk matched unrelated rows: " + JSON.stringify(rows));
    }
    return true;
  },

  async ss2() {
    const { page } = loadPage({ api: {}, uiLang: "pl" });
    page.S.screen = "settings";
    page.S.sx.sec = "general";

    for (const q of ["JĘZYK", "język", "  JĘZYK  "]) {
      page.S.sx.q = q;
      const html = page.sxPageHtml();
      const rows = rowsIn(html);
      if (!rows.includes("lang") || html.indexOf("Język interfejsu") < 0) {
        return no("ss2", JSON.stringify(q) + " did not find lang row: rows=" + JSON.stringify(rows));
      }
    }

    page.S.sx.q = "zzznoSettingHere";
    const emptyHtml = page.sxPageHtml();
    if (rowsIn(emptyHtml).length !== 0 || emptyHtml.indexOf('class="sx-none"') < 0) {
      return no("ss2", "unmatched query did not render empty state");
    }
    return true;
  },

  async ss3() {
    const { page } = loadPage({ api: {}, uiLang: "en" });
    page.S.screen = "settings";
    page.S.sx.sec = "general";

    page.S.sx.q = "întérfâcé";
    const html = page.sxPageHtml();
    const rows = rowsIn(html);
    if (!rows.includes("lang")) {
      return no("ss3", "accented query did not find Interface language row: rows=" + JSON.stringify(rows));
    }
    page.S.sx.q = "JĘZYK";
    if (rowsIn(page.sxPageHtml()).includes("lang")) {
      return no("ss3", "Polish word unexpectedly matched English rows");
    }
    return true;
  },

  async ss4() {
    const { page } = loadPage({ api: {}, uiLang: "pl" });
    page.S.screen = "settings";
    page.S.sx.sec = "layout";

    for (const q of ["zakladce", "zakładce", "ZAKLADCE", "ZAKŁADCE"]) {
      page.S.sx.q = q;
      const html = page.sxPageHtml();
      const rows = rowsIn(html);
      if (!rows.includes("open-in") || html.indexOf("zakładce") < 0) {
        return no("ss4", JSON.stringify(q) + " did not find open-in row in Polish: rows=" + JSON.stringify(rows));
      }
      if (rows.includes("lang") || rows.includes("theme")) {
        return no("ss4", JSON.stringify(q) + " matched unrelated rows: " + JSON.stringify(rows));
      }
    }

    page.S.sx.q = "lokalna";
    const clearRows = rowsIn(page.sxPageHtml());
    if (!clearRows.includes("clear") || clearRows.includes("lang")) {
      return no("ss4", "lokalna did not isolate clear row in Polish: rows=" + JSON.stringify(clearRows));
    }
    return true;
  },
};

const PLANTS = [
  ["ss1", "ui/app.js",
    '  const sxWords = (h) => searchFold(String(h).replace(/<[^>]*>/g, " ").replace(/&#39;/g, "\'").replace(/&quot;/g, \'"\')\n'
    + '    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").replace(/\\s+/g, " "));',
    '  const sxWords = (h) => String(h).replace(/<[^>]*>/g, " ").replace(/&#39;/g, "\'").replace(/&quot;/g, \'"\')\n'
    + '    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").replace(/\\s+/g, " ").toLowerCase();'],
  ["ss2", "ui/app.js",
    '      const want = searchFold(q); /* plant:sx-fold-query */',
    '      const want = q.toLowerCase();'],
  ["ss3", "ui/app.js",
    '      const want = searchFold(q); /* plant:sx-fold-query */',
    '      const want = q.toLowerCase();'],
  ["ss4", "ui/app.js",
    'const searchFold = (s) => String(s || "").replace(/[\\u0141\\u0142]/g, "l").toLocaleLowerCase().normalize("NFD").replace(/[\\u0300-\\u036f]/g, "").trim();',
    'const searchFold = (s) => String(s || "").toLocaleLowerCase().normalize("NFD").replace(/[\\u0300-\\u036f]/g, "").trim();'],
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
      env: Object.assign({}, process.env, { SETTINGS_SEARCH_ONLY: id, ETIUDA_PLANTS: "off" }),
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
  const planted = IDS.every((id) => PLANTS.some((p) => p[0] === id));
  if (!planted) {
    console.log("FAIL a check with no plant");
    dropScratch(SCRATCH, "settings-search");
    process.exit(1);
  }
  if (PLANTS_OFF) {
    console.log("SKIP the plants phase: " + PLANTS.length + " plants each turn their check red in a scratch copy (ETIUDA_PLANTS=off)");
  } else {
    const { plantsTree, treeSha, dropPlantsTree } = await import("./plants-tree.mjs");
    const before = treeSha(ROOT);
    const files = ["ui/app.js"];
    const shas = files.map((rel) => sha(fs.readFileSync(path.join(ROOT, rel))));
    let red = 0;
    let held = false;
    let same = false;
    try {
      plantsCopy = plantsTree(ROOT, "settings-search");
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
      dropScratch(SCRATCH, "settings-search");
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
  console.log("settings-search " + (n + (PLANTS_OFF ? 0 : 1)) + "/" + (IDS.length + 1)
    + (PLANTS_OFF ? ", 1 skipped" : ", plants " + PLANTS.length + "/" + PLANTS.length + " red"));
  console.log("#counts checks=" + (IDS.length + (PLANTS_OFF ? 0 : 1)) + " skipped=" + (PLANTS_OFF ? 1 : 0)
    + " failed=" + (IDS.length - n) + " expected=" + (IDS.length + 1));
  dropScratch(SCRATCH, "settings-search");
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
    try { dropScratch(SCRATCH, "settings-search"); } catch { /* verdict is error above */ }
    process.exit(1);
  });
}
