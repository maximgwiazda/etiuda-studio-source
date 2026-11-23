/* EVERY SCREEN A PERSON CAN REACH, WALKED ONCE, for a gate that asks a question of every screen
 * rather than of one (tests/cursor.mjs). A gate hands in one callback and is called on each
 * screen with its name, so a failure names the screen it was on.
 *
 * THE SECTIONS ARE READ OFF THE RAIL, NOT LISTED HERE, so a section added tomorrow is walked
 * tomorrow with nobody editing this file. Import is left to the end, because pressing it opens
 * the wizard, which owns the window until it is landed or cancelled. The covers are opened by
 * their own buttons on the screen that carries them.
 *
 * The fixture: a project imported from a generated pile, published once from the command line
 * so that the archive and the publish cover have a revision to show, and one proposal in the
 * inbox so that the review queue and an open proposal are screens with rows.
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import * as Engine from "../src/engine.mjs";
import { importCsv } from "../src/import.mjs";
import { json, PROJECT_FILE, DRAFT_FILE } from "../src/publish.mjs";
import { INBOX } from "../src/studio.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(HERE, "..");
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function pile(scratch, name, seed, rows) {
  const out = path.join(scratch, "piles", name);
  const r = spawnSync(process.execPath, ["tools/fixtures/generate.mjs", "--seed", String(seed),
    "--rows", String(rows), "--out", out], { cwd: ROOT, encoding: "utf8" });
  if (r.status !== 0) throw new Error("the generator refused: " + (r.stderr || r.stdout));
  return path.join(out, "macros.csv");
}

/** One project, published once, with one proposal waiting: returns its folder, the projects
 *  root, and a second pile the wizard can be pointed at. */
export async function plantWalkable(scratch) {
  const projects = path.join(scratch, "projects");
  const dir = path.join(projects, "retail");
  fs.mkdirSync(dir, { recursive: true });
  const made = await importCsv({ file: pile(scratch, "clean", 71, 16), id: "walk-catalog",
    name: "Retail, EN and PL" });
  fs.writeFileSync(path.join(dir, DRAFT_FILE), json(made.catalog), "utf8");
  fs.writeFileSync(path.join(dir, PROJECT_FILE), json({ id: made.catalog.id,
    name: "Retail, EN and PL", rev: 0, edition: "", draft: DRAFT_FILE, folder: dir }), "utf8");
  const pub = spawnSync(process.execPath, ["tools/publish.mjs", dir, "--notes", "Zubynt."],
    { cwd: ROOT, encoding: "utf8" });
  if (pub.status !== 0) throw new Error("the fixture would not publish: " + pub.stderr);

  /* A desk's copy come back with one body edited, a revision behind: the queue's one row. */
  const F = await Engine.format();
  const head = JSON.parse(fs.readFileSync(path.join(dir, DRAFT_FILE), "utf8"));
  const own = JSON.parse(JSON.stringify(head));
  own.rev = 0;
  const body = own.cards[0].body;
  Object.keys(body).forEach((k) => { body[k] = String(body[k]) + " Wretilo."; });
  delete own.hash; own.hash = F.contentHash(own);
  fs.mkdirSync(path.join(dir, INBOX), { recursive: true });
  fs.writeFileSync(path.join(dir, INBOX, "from-a-desk.ec"), json(own), "utf8");

  const intake = path.join(scratch, "piles", "intake.csv");
  fs.copyFileSync(pile(scratch, "intake", 72, 10), intake);
  return { projects, dir, intake };
}

/** Walk every screen of one window; `visit(name)` is awaited on each. */
export async function walkScreens(page, dir, visit) {
  const press = async (sel, ms) => {
    const hit = await page.evaluate((s) => {
      const e = document.querySelector(s); if (!e) return false;
      e.click(); return true;
    }, sel);
    if (!hit) throw new Error("nothing at " + sel);
    await sleep(ms || 300);
  };
  const names = [];
  const at = async (name) => { names.push(name); await visit(name); };

  await at("projects");
  /* New catalog is a page in its own tab since board 1019 (12); the walk keeps the name it had as a cover. */
  await press('[data-act="new"]', 350);
  await at("cover-new");
  await press('#main .newcat [data-act="close-screen"][data-v="new"]', 300);
  /* the Menu is a list since 2026-10-06 (S1): the list, Settings from it, and the About from Settings' About page; Settings
     is a tab of sections since board 965, each section walked, and the tab is closed by its cross before the catalog opens */
  await press('[data-act="menu"]', 400);
  await at("menu-list");
  await press('#menuList [data-act="settings"]', 500);
  const sxSections = await page.evaluate(() => Array.from(
    document.querySelectorAll('.sx-nav [data-act="sx-sec"]')).map((e) => e.getAttribute("data-v")));
  for (const s of sxSections) {
    await press('.sx-nav [data-act="sx-sec"][data-v="' + s + '"]', 300);
    await at("settings-" + s);
  }
  await press('#main [data-act="about"]', 400);
  await at("cover-about");
  await press('[data-act="cover-close"]', 300);
  await press('#tabs [data-act="close-screen"][data-v="settings"]', 400);

  let opened = await page.evaluate((d) => {
    const e = Array.from(document.querySelectorAll('[data-act="open"]'))
      .find((x) => x.getAttribute("data-dir") === d);
    if (!e) return false;
    e.click(); return true;
  }, dir);
  if (!opened) {
    await press('#rail [data-act="home"][data-v="library"]', 400);
    opened = await page.evaluate((d) => {
      const e = Array.from(document.querySelectorAll('[data-act="open"]'))
        .find((x) => x.getAttribute("data-dir") === d);
      if (!e) return false;
      e.click(); return true;
    }, dir);
  }
  if (!opened) throw new Error("no project row for " + dir);
  await sleep(800);
  await at("cards");
  await press("#main tr.pick", 350);
  await at("editor");
  await press('[data-act="card-new"]', 350);
  await at("cover-card");
  await press('[data-act="cover-close"]', 300);

  const sections = await page.evaluate(() => Array.from(
    document.querySelectorAll('#rail [data-act="section"]')).map((e) => e.getAttribute("data-v")));
  for (const s of sections.filter((x) => x !== "import" && x !== "cards")) {
    await press('[data-act="section"][data-v="' + s + '"]', 700);
    await at(s);
    if (s === "intents" || s === "categories") {
      await press('[data-act="tag-new"]', 350);
      await at("cover-tag-" + s);
      await press('[data-act="cover-close"]', 300);
    }
    if (s === "proposals") {
      await press('[data-act="rv-open"]', 800);
      await at("proposal-open");
      await press('[data-act="rv-back"]', 400);
    }
    if (s === "settings") {
      await press('[data-act="lang-new"]', 400);
      await at("cover-lang");
      await press('[data-act="cover-close"]', 300);
    }
  }
  await press('[data-act="publish"]', 800);
  await at("cover-publish");
  await press('[data-act="cover-close"]', 300);

  if (sections.indexOf("import") >= 0) {
    /* The chrome row opens the paste door. Choose a file is the pick, answered by STUDIO_TEST_FILE. */
    await press('[data-act="import"]', 400);
    await press('[data-act="wiz-pick"]', 1800);
    await at("wizard-columns");
    await press('[data-act="wiz-into"][data-v="new"]', 500);
    await press('[data-act="wiz-next"]', 800);
    await at("wizard-look");
  }
  return { names, sections };
}
