/* THE TAB STRIP UNDER THE HAND AND THE EYE: node tests/tab-strip.mjs [--keep].
 *
 * Board 982, findings 16 and 17, Max, 2026-11-11 00:26: "tabs in Studio are not reorderable, like in Etiuda. They should
 * be re-orderable by dragging." and "new tab + button is not alligned with close tab x button, and also seems to be
 * constructed differently. Both x button and + button should be svg glyphs, as in Desk."
 *
 * What only a rendered window shows, read off the real layout with the real mouse (CDP's own pointer, through the page's
 * own listeners, so the click the browser sends after a release is the one a hand makes):
 *
 *   ts2  a tab dragged a quarter into the next one takes its place, and the release switches nothing
 *   ts3  a press without movement on another tab switches to it and moves nothing
 *   ts4  a second launch on the same profile opens the band in the order the drag left
 *
 * WHAT IT CANNOT SEE, said rather than implied: whether the glide reads well, and the strip at every width and theme,
 * which are Max's eye; the screen tabs' drag and the cross's slip, which tests/open-tabs.mjs ot11 reads on the stand-in.
 *
 * Window leg: it opens Studio twice through tests/shell-door.mjs, on a scratch profile and folder.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as S from "../src/studio.mjs";
import { openStudio } from "./shell-door.mjs";
import { clearScratch, dropScratch } from "./scratch.mjs";
import { pressWhen, settleOn } from "./press.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const SCRATCH = path.join(ROOT, "scratch", "tab-strip");
const WHO = "tests/tab-strip.mjs";

let asserted = 0, failed = 0;
function check(cond, line) {
  asserted++;
  if (cond) process.stdout.write("  ok   " + line + "\n");
  else { failed++; process.stderr.write("  FAIL " + line + "\n"); }
}
const sleep = ms => new Promise(r => setTimeout(r, ms));

/* The strip as laid out: each catalog tab's name and box, and which one is on screen. */
const READ = `JSON.stringify((() => {
  const box = (e) => { if (!e) return null; const r = e.getBoundingClientRect(); return { l: r.left, t: r.top, w: r.width, h: r.height }; };
  const tabs = Array.from(document.querySelectorAll('#tabsBar .tab[data-act="to-project"]'));
  return {
    tabs: tabs.map((t) => ({ name: (t.querySelector('.nm') || {}).textContent || '', on: t.classList.contains('on'), box: box(t) })),
  };
})())`;

async function openCatalog(page, dir) {
  await pressWhen(page, '[data-act="to-projects"]', { who: WHO });
  await sleep(300);
  await pressWhen(page, '[data-act="open"]', { who: WHO, attr: ["data-dir", dir] });
  await settleOn(page, '(window.STUDIO_READY || {}).screen === "cards"', { bound: 30000 });
  await sleep(300);
}

async function main(argv) {
  clearScratch(SCRATCH);
  const projects = path.join(SCRATCH, "projects");
  fs.mkdirSync(projects, { recursive: true });
  const L = [{ code: "en" }, { code: "pl" }];
  const A = await S.newProject(projects, "Alpha strip", L), B = await S.newProject(projects, "Beta strip", L);
  const ud = path.join(SCRATCH, "ud");
  let dragged = [];

  const studio = await openStudio(WHO, { words: true, projects, userDataDir: ud });
  try {
    const page = studio.page;
    await openCatalog(page, A.dir);
    await openCatalog(page, B.dir);
    let s = JSON.parse(await page.evaluate(READ));

    /* ---- ts2, a drag (finding 16) ---- */
    const before = s.tabs.map((t) => t.name), onBefore = (s.tabs.find((t) => t.on) || {}).name;
    const a = s.tabs[0].box, b = s.tabs[1].box, y = a.t + a.h / 2;
    await page.mouse.move(a.l + 30, y);
    await page.mouse.down();
    for (let i = 1; i <= 3; i++) { await page.mouse.move(a.l + 30 + 3 * i, y); await sleep(30); }
    const target = b.l + b.w * 0.6;
    for (let i = 1; i <= 8; i++) { await page.mouse.move(a.l + 39 + (target - a.l - 39) * i / 8, y); await sleep(40); }
    await sleep(160);
    await page.mouse.move(target + 1, y);
    await page.mouse.up();
    await sleep(700);
    s = JSON.parse(await page.evaluate(READ));
    dragged = s.tabs.map((t) => t.name);
    const onAfter = (s.tabs.find((t) => t.on) || {}).name;
    check(before.join() === "Alpha strip,Beta strip" && dragged.join() === "Beta strip,Alpha strip" && onAfter === onBefore,
      "ts2 the first tab dragged 60% into the second takes its place, and the release leaves " + JSON.stringify(onBefore)
      + " on screen: " + JSON.stringify({ before, after: dragged, onAfter }));

    /* ---- ts3, a press that does not move ---- */
    const other = s.tabs.find((t) => !t.on);
    if (other) await page.mouse.click(other.box.l + 30, other.box.t + other.box.h / 2);
    await settleOn(page, `(document.querySelector('#tabsBar .tab.on .nm') || {}).textContent === ${JSON.stringify(other ? other.name : "")}`, { bound: 15000 });
    s = JSON.parse(await page.evaluate(READ));
    check(!!other && (s.tabs.find((t) => t.on) || {}).name === other.name && s.tabs.map((t) => t.name).join() === dragged.join(),
      "ts3 a press without movement on " + JSON.stringify(other && other.name) + " switches to it and the order stays: "
      + JSON.stringify(s.tabs.map((t) => t.name + (t.on ? " (on)" : ""))));
    await sleep(500);   /* the band's last write (studio:tabs) is on disk before the window goes */
  } finally {
    await studio.shut();
  }
  await sleep(300);

  /* ---- ts4, the next launch ---- */
  const again = await openStudio(WHO, { words: true, projects, userDataDir: ud });
  try {
    await settleOn(again.page, 'document.querySelectorAll(\'#tabsBar .tab[data-act="to-project"]\').length === 2', { bound: 30000 });
    const s = JSON.parse(await again.page.evaluate(READ));
    const relaunched = s.tabs.map((t) => t.name);
    check(dragged.length === 2 && relaunched.join() === dragged.join(),
      "ts4 a second launch on the same profile opens the band in the order the drag left: " + JSON.stringify({ dragged, relaunched }));
  } finally {
    await again.shut();
  }

  if (!argv.includes("--keep")) dropScratch(SCRATCH, "tab-strip");
  else process.stdout.write("tab-strip  kept " + SCRATCH + "\n");
  process.stdout.write("tab-strip  " + asserted + " assertion(s), " + failed + " failure(s)\n");
  process.exit(failed ? 1 : 0);
}

main(process.argv.slice(2)).catch(e => {
  process.stderr.write("tab-strip  " + (e && e.stack ? e.stack : String(e)) + "\n");
  process.exit(2);
});
