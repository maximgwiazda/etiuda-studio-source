/* THE WINDOW FITS THE SCREEN IT IS ON, AND ITS PAGE ZOOMS (sense pass 3, item 33).
 *
 *     node tests/window-size.mjs [--keep]
 *
 * Two claims that could be wrong:
 *   1. src/window-size.cjs, which shell/main.js sizes the window by, keeps Studio's 900x560
 *      minimum and 1280x880 opening size where the screens have room, and gives way to a work
 *      area that has less: a 1080p screen at 200 per cent is 492 DIPs tall.
 *   2. In the window, Ctrl and plus zooms the page, Ctrl and minus zooms it out, and Ctrl and 0
 *      puts it back. The window has no application menu, which is where the keys used to live.
 *      The zoom is read in the page, as its device pixel ratio.
 */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { openStudio } from "./shell-door.mjs";
import { clearScratch, dropScratch } from "./scratch.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const SCRATCH = path.join(ROOT, "scratch", "window-size");

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

  /* ---- 1. the size, against the screens ------------------------------------------------------ */

  let W = null;
  try { W = createRequire(import.meta.url)("../src/window-size.cjs"); } catch (e) { W = null; }
  check(!!W && typeof W.roomFor === "function", "1 CONTROL: src/window-size.cjs has roomFor()");
  if (W) {
    const d = (w, h) => ({ workAreaSize: { width: w, height: h } });
    const roomy = W.roomFor([d(1920, 1032)], d(1920, 1032));
    check(roomy.minWidth === 900 && roomy.minHeight === 560 && roomy.width === 1280
          && roomy.height === 880,
      "1a on a 1080p screen at 100 per cent the window keeps its 900x560 minimum and opens at"
      + " 1280x880: " + JSON.stringify(roomy));
    const tight = W.roomFor([d(960, 492)], d(960, 492));
    check(tight.minHeight <= 492 && tight.height <= 492 && tight.width <= 960
          && tight.minWidth <= tight.width,
      "1b on the same screen at 200 per cent, 960x492 DIPs of work area, the window's minimum"
      + " and its opening size both fit: " + JSON.stringify(tight));
    const two = W.roomFor([d(2560, 1400), d(960, 492)], d(2560, 1400));
    check(two.minHeight <= 492 && two.height === 880,
      "1c with a second, smaller screen the window may still shrink to fit that one, and opens"
      + " at its usual size on the roomy one: " + JSON.stringify(two));
  }

  /* ---- 2. the zoom keys, in the window ------------------------------------------------------- */

  const st = await openStudio("tests/window-size.mjs", { projects: path.join(SCRATCH, "projects"),
    userDataDir: path.join(SCRATCH, "ud") });
  try {
    const page = st.page;
    /* The zoom as the page's device pixel ratio against its own at the start. The chords are
       dispatched in the page as the keyboard's own keydown would arrive: a key sent over the
       debugging port stops reaching this window after its first zoom, which is the harness and
       not the product: every key after the first went unseen by the page. */
    const dpr0 = await page.evaluate(() => devicePixelRatio);
    const zoom = async () => Math.round(100 * (await page.evaluate(() => devicePixelRatio)) / dpr0)
      / 100;
    const chord = async (key, code, times) => {
      for (let i = 0; i < (times || 1); i++) {
        await page.evaluate((k, c) => document.body.dispatchEvent(new KeyboardEvent("keydown",
          { key: k, code: c, ctrlKey: true, bubbles: true, cancelable: true })), key, code);
        await sleep(500);
      }
    };
    const at0 = await zoom();
    await chord("=", "Equal");
    const inward = await zoom();
    await chord("-", "Minus", 2);
    const outward = await zoom();
    await chord("0", "Digit0");
    const back = await zoom();
    check(inward > at0 && outward < at0 && back === at0,
      "2a Ctrl and plus zooms the page in, Ctrl and minus twice zooms it out past where it was,"
      + " and Ctrl and 0 puts it back: " + JSON.stringify({ at0, inward, outward, back }));
  } finally { await st.shut(); }

  if (!keep) dropScratch(SCRATCH, "window-size");
  process.stdout.write("window-size  " + asserted + " assertion(s), " + failed + " failure(s)\n");
  process.exit(failed ? 1 : 0);
}

main(process.argv.slice(2)).catch(e => {
  process.stderr.write("window-size  " + (e && e.stack ? e.stack : String(e)) + "\n");
  process.exit(2);
});
