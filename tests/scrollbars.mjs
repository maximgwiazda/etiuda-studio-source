/* STUDIO TAKES THE DESK'S THIN SCROLLBARS AND ACCENT SELECTION (board 1005).
 *
 *     node tests/scrollbars.mjs
 *
 * Headless Chrome on ui/index.html with window.STUDIO stubbed, no Electron window.
 * What the eye sees:
 *   sb1  every scroll container in Studio (at least .sx-page, .dlg .body, .va .main, .pm-panel, #tourBody,
 *        .vr-menu, .stk-scroll, .stk-done, .mt-page) shows a thin scrollbar whose width is at most what the
 *        desk's own rule gives in the same Chrome and strictly narrower than the platform's wide bar, with
 *        scrollbarWidth "thin" and scrollbarColor matching --scroll-thumb in both light and dark themes;
 *        containers that hide their bar on purpose (.tabs-bar) stay hidden
 *   sb2  selected text in a text field and in a selectable region takes Studio's accent (--mark) at 30 per cent
 *        in both light and dark themes
 *
 * Proved by making each claim fail on a scratch copy of the tree (ETIUDA_PLANTS=off skips).
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-core";
import { plantText } from "./plant-copy.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const SELF = fileURLToPath(import.meta.url);
const HTML_FILE = path.join(ROOT, "ui", "index.html");
const ONLY = process.env.SCROLLBARS_ONLY || "";
const PLANTS_OFF = process.env.ETIUDA_PLANTS === "off";
const IDS = ["sb1", "sb2"];

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

const CONTAINERS = [
  ".sx-page",
  ".dlg .body",
  ".va .main",
  ".pm-panel",
  "#tourBody",
  ".vr-menu",
  ".stk-scroll",
  ".stk-done",
  ".mt-page",
];

function no(id, why) {
  console.error(id + " " + why);
  return false;
}

async function measureDeskReference(browser) {
  const page = await browser.newPage();
  try {
    await page.setContent(`<!doctype html><style>
      :root{
        --bg:#f7f8fa;
        --scroll-thumb:color-mix(in srgb,rgb(71,85,105) 40%,var(--bg));
        --scroll-thumb-hover:color-mix(in srgb,rgb(71,85,105) 65%,var(--bg));
      }
      .plain{width:200px;height:100px;overflow:auto}
      .desk *{scrollbar-width:thin;scrollbar-color:var(--scroll-thumb) transparent}
      .desk *::-webkit-scrollbar{width:6px;height:6px}
      .desk *::-webkit-scrollbar-track{background:transparent}
      .desk *::-webkit-scrollbar-thumb{background-color:var(--scroll-thumb);border-radius:999px}
      .desk *::-webkit-scrollbar-thumb:hover{background-color:var(--scroll-thumb-hover)}
      .desk *::-webkit-scrollbar-corner{background:transparent}
      .box{width:200px;height:100px;overflow:auto}
    </style>
    <div class="plain" id="plain"><div style="height:400px">x</div></div>
    <div class="desk"><div class="box" id="desk"><div style="height:400px">x</div></div></div>`);
    return await page.evaluate(() => {
      const plain = document.getElementById("plain");
      const desk = document.getElementById("desk");
      return {
        plainWidth: plain.offsetWidth - plain.clientWidth,
        deskWidth: desk.offsetWidth - desk.clientWidth,
      };
    });
  } finally {
    await page.close();
  }
}

async function openStudioPage(browser) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 860, deviceScaleFactor: 1 });
  await page.evaluateOnNewDocument(() => {
    try { localStorage.setItem("studio.tourDone", "1"); } catch (e) {}
    const noOp = () => {};
    window.STUDIO = new Proxy({
      host: async () => ({ version: "0.1.0", platform: "win32", tour: { offered: true, taken: true, at: 0 } }),
      projects: async () => ({ root: "C:/studio", projects: [], sample: "" }),
      teams: async () => ({ teams: [] }),
    }, {
      get: (t, k) => (k in t ? t[k] : (typeof k !== "string" || k === "then" ? undefined : /^on[A-Z]/.test(k) ? noOp : async () => ({ error: null }))),
    });
  });
  await page.goto("file:///" + HTML_FILE.replace(/\\/g, "/"), { waitUntil: "load" });
  await page.waitForSelector("#band", { timeout: 10000 });
  await page.evaluate(() => {
    document.body.classList.remove("e-launch", "e-launch-out");
    document.querySelectorAll(".e-launch-veil").forEach((v) => v.remove());
  });
  return page;
}

const CHECKS = {
  async sb1(browser) {
    const ref = await measureDeskReference(browser);
    if (!(ref.deskWidth > 0 && ref.deskWidth < ref.plainWidth)) {
      return no("sb1", "unexpected desk reference width: " + JSON.stringify(ref));
    }
    const page = await openStudioPage(browser);
    try {
      await page.evaluate(() => {
        const host = document.createElement("div");
        host.id = "__sbHost";
        host.style.cssText = "position:fixed;inset:0;z-index:9999;background:var(--bg);padding:12px";
        host.innerHTML = [
          '<div class="sxp" style="height:140px"><div class="sx-page" data-sb=".sx-page"><div style="height:400px">sx</div></div></div>',
          '<div class="dlg" style="height:140px"><div class="body" data-sb=".dlg .body"><div style="height:400px">dlg</div></div></div>',
          '<div class="va" style="height:140px;display:flex"><div class="main" data-sb=".va .main" style="flex:1;height:140px"><div style="height:400px">va</div></div></div>',
          '<div class="pm-frame" style="height:140px;min-height:140px"><div class="pm-panel" data-sb=".pm-panel" style="max-height:110px"><div style="height:400px">pm</div></div></div>',
          '<div class="tour-card" style="height:160px"><div id="tourBody" data-sb="#tourBody" style="max-height:110px"><div style="height:400px">tour</div></div></div>',
          '<div style="position:relative;height:140px"><div class="vr-menu" data-sb=".vr-menu" style="position:static;max-height:110px"><div style="height:400px">vr</div></div></div>',
          '<div class="stk-card hand" style="height:140px"><div class="stk-scroll" data-sb=".stk-scroll" style="height:110px"><div style="height:400px">stks</div></div></div>',
          '<div class="stk-tray" style="height:140px"><div class="stk-done" data-sb=".stk-done" style="height:110px"><div style="height:400px;flex:0 0 auto">stkd</div></div></div>',
          '<div style="height:140px"><div class="mt-page" data-sb=".mt-page"><div style="height:400px">mt</div></div></div>',
          '<div class="tabs" style="width:200px"><div class="tabs-bar" id="__sbTabs" style="width:200px;height:36px"><span style="flex:0 0 600px;height:20px">tabs</span></div></div>',
          '<div id="__sbThumbProbe" style="color:var(--scroll-thumb)"></div>',
        ].join("");
        document.body.appendChild(host);
      });

      const problems = [];
      for (const theme of ["light", "dark"]) {
        const res = await page.evaluate((th, containers) => {
          document.documentElement.setAttribute("data-theme", th);
          const probe = document.getElementById("__sbThumbProbe");
          const expectedThumb = getComputedStyle(probe).color;
          const items = containers.map((name) => {
            const el = document.querySelector('#__sbHost [data-sb="' + name + '"]');
            const cs = getComputedStyle(el);
            const borders = (parseFloat(cs.borderLeftWidth) || 0) + (parseFloat(cs.borderRightWidth) || 0);
            return {
              name,
              barWidth: el.offsetWidth - el.clientWidth - borders,
              overflows: el.scrollHeight > el.clientHeight,
              scrollbarWidth: cs.scrollbarWidth,
              scrollbarColor: cs.scrollbarColor,
            };
          });
          const tabs = document.getElementById("__sbTabs");
          const tCs = getComputedStyle(tabs);
          return {
            expectedThumb,
            items,
            tabs: {
              barHeight: tabs.offsetHeight - tabs.clientHeight,
              overflowsX: tabs.scrollWidth > tabs.clientWidth,
              scrollbarWidth: tCs.scrollbarWidth,
            },
          };
        }, theme, CONTAINERS);

        const wantColor = res.expectedThumb + " rgba(0, 0, 0, 0)";
        for (const it of res.items) {
          if (!it.overflows) problems.push(theme + " " + it.name + " did not overflow");
          if (!(it.barWidth > 0 && it.barWidth <= ref.deskWidth && it.barWidth < ref.plainWidth)) {
            problems.push(theme + " " + it.name + " barWidth=" + it.barWidth + " (desk=" + ref.deskWidth + ", plain=" + ref.plainWidth + ")");
          }
          if (it.scrollbarWidth !== "thin") {
            problems.push(theme + " " + it.name + " scrollbarWidth=" + it.scrollbarWidth);
          }
          if (it.scrollbarColor !== wantColor) {
            problems.push(theme + " " + it.name + " scrollbarColor=" + JSON.stringify(it.scrollbarColor) + " want " + JSON.stringify(wantColor));
          }
        }
        if (!res.tabs.overflowsX || res.tabs.barHeight !== 0 || res.tabs.scrollbarWidth !== "none") {
          problems.push(theme + " .tabs-bar not hidden: " + JSON.stringify(res.tabs));
        }
      }
      if (problems.length) return no("sb1", problems.join("; "));
      console.log("  info desk reference barWidth=" + ref.deskWidth + "px, plain=" + ref.plainWidth + "px across " + CONTAINERS.length + " containers");
      return true;
    } finally {
      await page.close();
    }
  },

  async sb2(browser) {
    const page = await openStudioPage(browser);
    try {
      await page.evaluate(() => {
        const host = document.createElement("div");
        host.id = "__selHost";
        host.innerHTML = [
          '<input id="__selInput" class="field" value="Selected text">',
          '<span id="__selMono" class="mono">C:/studio/catalog</span>',
          '<div id="__selProbe" style="background-color:color-mix(in srgb,var(--mark) 30%,transparent)"></div>',
        ].join("");
        document.body.appendChild(host);
      });

      const problems = [];
      for (const theme of ["light", "dark"]) {
        const res = await page.evaluate((th) => {
          document.documentElement.setAttribute("data-theme", th);
          const probe = document.getElementById("__selProbe");
          const inp = document.getElementById("__selInput");
          const mono = document.getElementById("__selMono");
          return {
            expected: getComputedStyle(probe).backgroundColor,
            inputBg: getComputedStyle(inp, "::selection").backgroundColor,
            monoBg: getComputedStyle(mono, "::selection").backgroundColor,
            mark: getComputedStyle(document.documentElement).getPropertyValue("--mark").trim(),
          };
        }, theme);
        if (!res.expected || res.expected === "rgba(0, 0, 0, 0)") {
          problems.push(theme + " probe resolved empty: " + JSON.stringify(res));
        }
        if (res.inputBg !== res.expected) {
          problems.push(theme + " input ::selection=" + JSON.stringify(res.inputBg) + " want " + JSON.stringify(res.expected));
        }
        if (res.monoBg !== res.expected) {
          problems.push(theme + " .mono ::selection=" + JSON.stringify(res.monoBg) + " want " + JSON.stringify(res.expected));
        }
      }
      if (problems.length) return no("sb2", problems.join("; "));
      const htmlSrc = fs.readFileSync(HTML_FILE, "utf8");
      const styleMatch = /<style[^>]*>([\s\S]*?)<\/style>/i.exec(htmlSrc);
      const css = styleMatch ? styleMatch[1] : "";
      if (!/::selection\s*\{\s*background\s*:\s*color-mix\(\s*in\s+srgb\s*,\s*var\(--mark\)\s+30%\s*,\s*transparent\s*\)/i.test(css)) {
        return no("sb2", "::selection rule with color-mix(in srgb,var(--mark) 30%,transparent) missing in ui/index.html");
      }
      return true;
    } finally {
      await page.close();
    }
  },
};

const PLANTS = [
  ["sb1", "ui/index.html",
    "*{scrollbar-width:thin;scrollbar-color:var(--scroll-thumb) transparent}\n"
    + "*::-webkit-scrollbar{width:6px;height:6px}\n"
    + "*::-webkit-scrollbar-track{background:transparent}\n"
    + "*::-webkit-scrollbar-thumb{background-color:var(--scroll-thumb);border-radius:999px}\n"
    + "*::-webkit-scrollbar-thumb:hover{background-color:var(--scroll-thumb-hover)}\n"
    + "*::-webkit-scrollbar-corner{background:transparent}",
    ""],
  ["sb2", "ui/index.html",
    "::selection{background:color-mix(in srgb,var(--mark) 30%,transparent)}",
    ""],
];

function sha(buf) {
  return crypto.createHash("sha256").update(buf).digest("hex");
}

function plantOnce(plantsCopy, id, rel, from, to) {
  const file = path.join(plantsCopy, rel);
  const buf = fs.readFileSync(file);
  const was = sha(buf);
  const next = plantText(buf.toString("utf8"), from, to, rel);
  let child = null;
  try {
    fs.writeFileSync(file, next, "utf8");
    child = spawnSync(process.execPath, [path.join(plantsCopy, path.relative(ROOT, SELF))], {
      cwd: plantsCopy,
      env: Object.assign({}, process.env, { SCROLLBARS_ONLY: id, ETIUDA_PLANTS: "off" }),
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
  const planted = IDS.every((id) => PLANTS.some((p) => p[0] === id));
  if (!planted) {
    console.log("FAIL a check with no plant");
    process.exit(1);
  }

  if (PLANTS_OFF) {
    console.log("NOT RUN plants phase: " + PLANTS.length + " plants each turn their check red in a scratch copy (ETIUDA_PLANTS=off)");
  } else {
    const { plantsTree, treeSha, dropPlantsTree } = await import("./plants-tree.mjs");
    const before = treeSha(ROOT);
    const files = ["ui/index.html"];
    const shas = files.map((rel) => sha(fs.readFileSync(path.join(ROOT, rel))));
    let plantsCopy = null;
    let red = 0;
    let held = false;
    let same = false;
    try {
      plantsCopy = plantsTree(ROOT, "scrollbars");
      for (const [id, rel, from, to] of PLANTS) {
        const ok = plantOnce(plantsCopy, id, rel, from, to);
        console.log((ok ? "plant " : "PLANT FAIL ") + id + (ok ? " red" : ""));
        if (ok) red++;
      }
      held = treeSha(ROOT) === before;
      console.log((held ? "ok   " : "FAIL ") + "the checkout's sha256 over src/, shell/ and ui/ is unchanged after the plants phase");
      same = files.every((rel, i) => sha(fs.readFileSync(path.join(ROOT, rel))) === shas[i]);
      console.log((same ? "ok   " : "FAIL ") + "the planted files are byte for byte as they were (sha256)");
    } finally {
      if (plantsCopy) dropPlantsTree(plantsCopy, ROOT);
    }
    if (red !== PLANTS.length || !held || !same) {
      process.exit(1);
    }
  }

  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    ignoreDefaultArgs: ["--hide-scrollbars"],
    args: ["--no-sandbox"],
  });
  let n = 0;
  try {
    for (const id of IDS) {
      let ok = false;
      try { ok = await CHECKS[id](browser); }
      catch (e) { console.error(id + " " + ((e && e.stack) || e)); ok = false; }
      console.log((ok ? "ok   " : "FAIL ") + id);
      if (ok) n++;
    }
  } finally {
    await Promise.race([browser.close(), new Promise((r) => setTimeout(r, 10000))]);
  }
  console.log("scrollbars " + (n + (PLANTS_OFF ? 0 : 1)) + "/" + (IDS.length + 1)
    + (PLANTS_OFF ? ", 1 skipped" : ", plants " + PLANTS.length + "/" + PLANTS.length + " red"));
  console.log("#counts checks=" + (IDS.length + (PLANTS_OFF ? 0 : 1)) + " skipped=" + (PLANTS_OFF ? 1 : 0)
    + " failed=" + (IDS.length - n) + " expected=" + (IDS.length + 1));
  process.exit(n === IDS.length ? 0 : 1);
}

if (ONLY) {
  const fn = CHECKS[ONLY];
  if (!fn) { console.error("unknown " + ONLY); process.exit(2); }
  puppeteer.launch({
    executablePath,
    headless: true,
    ignoreDefaultArgs: ["--hide-scrollbars"],
    args: ["--no-sandbox"],
  }).then(async (browser) => {
    try {
      const ok = await fn(browser);
      console.log(ok ? "PLANT-GREEN" : "PLANT-RED");
      process.exit(ok ? 0 : 1);
    } finally {
      await Promise.race([browser.close(), new Promise((r) => setTimeout(r, 10000))]);
    }
  }).catch((e) => {
    console.error((e && e.stack) || e);
    process.exit(2);
  });
} else {
  main().catch((e) => {
    console.error((e && e.stack) || e);
    process.exit(1);
  });
}
