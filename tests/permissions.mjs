/* THE WINDOW ASKS FOR NOTHING AND ANSWERS ONLY ITS OWN PAGE (enterprise pack item 12).
 *
 *     node tests/permissions.mjs [--keep]
 *
 * Three claims that could be wrong:
 *   1. src/own-frame.cjs, which every channel in shell/main.js asks before it answers, accepts
 *      the top frame of ui/index.html and refuses a subframe, another document and another
 *      scheme; and no channel in shell/main.js is opened past it.
 *   2. In the window, every permission request and every permission check is refused: a
 *      notification asked for is denied, and the media check that would put the names of this
 *      machine's devices on the page answers no.
 *   3. A document that is not Studio's page, loaded into the window with the preload's bridge
 *      in it, gets nothing through that bridge; Studio's own page, before and after, gets its
 *      answers as before.
 * Device names and project paths are never printed: a count and a type are.
 */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import { openStudio } from "./shell-door.mjs";
import { waitLaunchGone } from "./launch-wait.mjs";
import { clearScratch, dropScratch } from "./scratch.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const SCRATCH = path.join(ROOT, "scratch", "permissions");
const UI = path.join(ROOT, "ui", "index.html");

let asserted = 0, failed = 0;
function check(cond, line) {
  asserted++;
  if (cond) process.stdout.write("  ok   " + line + "\n");
  else { failed++; process.stderr.write("  FAIL " + line + "\n"); }
}
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function main(argv) {
  const keep = argv.indexOf("--keep") >= 0;
  clearScratch(SCRATCH);
  fs.mkdirSync(path.join(SCRATCH, "projects"), { recursive: true });

  /* ---- 1. the predicate, and that nothing goes round it ---------------------------------- */

  let F = null;
  try { F = createRequire(import.meta.url)("../src/own-frame.cjs"); } catch (e) { F = null; }
  check(!!F && typeof F.ownFrame === "function", "1 CONTROL: src/own-frame.cjs has ownFrame()");
  if (F) {
    const top = url => ({ parent: null, url });
    const own = pathToFileURL(UI).href;
    check(F.ownFrame(top(own), UI) === true && F.ownFrame(top(own + "#x"), UI) === true,
      "1a the top frame of ui/index.html is Studio's own, with or without a fragment");
    const swapped = own.replace(/^file:\/\/\/([a-z]):/i,
      (m, d) => "file:///" + (d === d.toUpperCase() ? d.toLowerCase() : d.toUpperCase()) + ":");
    check(process.platform !== "win32" || F.ownFrame(top(swapped), UI) === true,
      "1b on Windows the drive letter's case does not matter: " + (swapped !== own));
    const far = "C:\\Users\\\u0141ucja Nowak\\AppData\\Local\\Programs\\Etiuda Studio\\resources"
      + "\\app.asar\\ui\\index.html";
    const farUrl = "file:///C:/Users/%C5%81ucja%20Nowak/AppData/Local/Programs/Etiuda%20Studio"
      + "/resources/app.asar/ui/index.html";
    check(process.platform !== "win32" || F.ownFrame(top(farUrl), far) === true,
      "1c an installed copy under a profile with a space and a Polish letter is still its own page");
    const refused = [
      ["a subframe at the page's own address", { parent: {}, url: own }],
      ["another document beside it", top(pathToFileURL(path.join(ROOT, "ui", "other.html")).href)],
      ["a data: document", top("data:text/html,<p>x</p>")],
      ["the same path under https", top("https://example.com/" + own.replace(/^file:\/\/\//, ""))],
      ["no frame at all", null],
      ["a frame already gone", { parent: null, get url() { throw new Error("disposed"); } }],
    ];
    const through = refused.filter(([, f]) => F.ownFrame(f, UI) !== false).map(([w]) => w);
    check(through.length === 0, "1d refused: " + refused.map(([w]) => w).join(", ")
      + (through.length ? "; LET THROUGH: " + through.join(", ") : ""));
  }

  /* Every channel the preload names is opened through the two doors, and ipcMain is reached
     once, where the doors are made: never destructured, never called by its own name. */
  const main_ = fs.readFileSync(path.join(ROOT, "shell", "main.js"), "utf8");
  const pre = fs.readFileSync(path.join(ROOT, "shell", "preload.js"), "utf8");
  const asked = new Set([...pre.matchAll(/ipcRenderer\.(?:invoke|send)\("(studio:[a-z0-9-]+)"/g)]
    .map(m => m[1]));
  const doors = new Set([...main_.matchAll(/^(?:answer|hear)\("(studio:[a-z0-9-]+)"/gm)]
    .map(m => m[1]));
  const reached = (main_.match(/require\("electron"\)\.ipcMain\b/g) || []).length;
  const round = (main_.match(/\bipcMain\s*\.\s*[a-zA-Z]+\s*\(|\{[^}]*\bipcMain\b[^}]*\}\s*=\s*require/g)
    || []).length;
  const missing = [...asked].filter(c => !doors.has(c));
  check(asked.size > 40 && missing.length === 0 && reached === 1 && round === 0,
    "1e all " + asked.size + " channels the preload names open through answer() or hear(), and"
    + " ipcMain is reached once in shell/main.js and never round them (" + reached + ", " + round + ")"
    + (missing.length ? "; NOT THROUGH A DOOR: " + missing.join(", ") : ""));

  /* ---- 2 and 3. the window ------------------------------------------------------------------ */

  const foreign = path.join(SCRATCH, "foreign.html");
  fs.writeFileSync(foreign, "<!DOCTYPE html>\n<meta charset=\"utf-8\">\n<p>not Studio</p>\n");
  const st = await openStudio("tests/permissions.mjs", { projects: path.join(SCRATCH, "projects"),
    userDataDir: path.join(SCRATCH, "ud") });
  try {
    const page = st.page;
    const home = page.url();

    /* 2. Asked from Studio's own page, since that is the page that could ever ask. */
    const perm = await page.evaluate(async () => {
      const out = { notify: null, states: {}, devices: 0, named: 0 };
      try { out.notify = await Notification.requestPermission(); } catch (e) { out.notify = "threw " + e.name; }
      for (const name of ["notifications", "geolocation", "camera", "microphone", "midi"]) {
        try { out.states[name] = (await navigator.permissions.query({ name })).state; }
        catch (e) { out.states[name] = "threw " + e.name; }
      }
      try {
        const ds = await navigator.mediaDevices.enumerateDevices();
        out.devices = ds.length;
        out.named = ds.filter(d => d.label).length;
      } catch (e) { out.devices = -1; }
      return out;
    });
    check(perm.notify === "denied", "2a a notification asked for is denied: " + perm.notify);
    const granted = Object.keys(perm.states).filter(k => perm.states[k] === "granted");
    check(granted.length === 0,
      "2b no permission reads as granted: " + JSON.stringify(perm.states));
    check(perm.named === 0,
      "2c the media check answers no, so no device's name reaches the page: " + perm.named
      + " named of " + perm.devices + (perm.devices > 0 ? "" : " (NO DEVICE HERE, the leg is blunt)"));

    /* 3. Studio's own page first, then another document with the bridge in it. */
    const dpr0 = await page.evaluate(() => devicePixelRatio);
    const ownAsk = async () => page.evaluate(async () => {
      const p = await window.STUDIO.projects(), h = await window.STUDIO.host();
      return { projects: !!(p && Array.isArray(p.projects)), host: !!(h && h.version) };
    });
    const before = await ownAsk();
    await page.evaluate(() => window.STUDIO.zoom("in"));
    await sleep(500);
    const ownZoom = await page.evaluate(() => devicePixelRatio);
    await page.evaluate(() => window.STUDIO.zoom("reset"));
    await sleep(500);
    check(before.projects && before.host && ownZoom > dpr0,
      "3a CONTROL: Studio's own page gets its projects, its host and its zoom: "
      + JSON.stringify(before) + " dpr " + dpr0 + " to " + ownZoom);

    const strangers = [["a file beside Studio", pathToFileURL(foreign).href],
                       ["a data: document", "data:text/html,<p>not Studio</p>"]];
    for (const [who, url] of strangers) {
      await page.goto(url, { waitUntil: "load" });
      await waitLaunchGone(page, { who: "tests/permissions.mjs " + who });
      const at = await page.evaluate(() => devicePixelRatio);
      const got = await page.evaluate(async () => {
        const has = !!(window.STUDIO && typeof window.STUDIO.projects === "function");
        if (!has) return { has };
        const p = await window.STUDIO.projects(), h = await window.STUDIO.host();
        window.STUDIO.zoom("in");
        return { has, projects: p === null ? null : typeof p, host: h === null ? null : typeof h };
      });
      await sleep(500);
      const after = await page.evaluate(() => devicePixelRatio);
      check(got.has, "3b CONTROL: " + who + " has the preload's bridge, so the refusal below is"
        + " the shell's and not an absent bridge");
      check(got.has && got.projects === null && got.host === null && after === at,
        "3c " + who + " is answered nothing: projects " + got.projects + ", host " + got.host
        + ", zoom " + at + " to " + after);
    }

    await page.goto(home, { waitUntil: "load" });
    let ready = false;
    for (let i = 0; i < 167 && !ready; i++) {
      ready = await page.evaluate(() => !!window.STUDIO_READY).catch(() => false);
      if (!ready) await sleep(150);
    }
    await waitLaunchGone(page, { who: "tests/permissions.mjs back on Studio" });
    const back = await ownAsk();
    check(ready && back.projects && back.host,
      "3d back on Studio's own page, its calls are answered again: ready " + ready + ", " + JSON.stringify(back));
  } finally { await st.shut(); }

  if (!keep) dropScratch(SCRATCH, "permissions");
  process.stdout.write("permissions  " + asserted + " assertion(s), " + failed + " failure(s)\n");
  process.exit(failed ? 1 : 0);
}

main(process.argv.slice(2)).catch(e => {
  process.stderr.write("permissions  " + (e && e.stack ? e.stack : String(e)) + "\n");
  process.exit(2);
});
