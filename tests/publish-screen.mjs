/* PUBLISHING FROM THE SCREEN IS PUBLISHING FROM THE COMMAND LINE. Course node 10, leg two.
 *
 *     node tests/publish-screen.mjs [--keep]
 *
 * THE CLAIM IS BYTE FOR BYTE AND IT IS TESTED THAT WAY. Two identical copies of one project are
 * published, one by pressing Publish in the window and one by `node tools/publish.mjs`, and the
 * catalog, the archived copy, the release notes and the report must come out with the same
 * sha256 on both sides. Anything less than bytes would pass with the screen quietly stamping a
 * different edition, writing a different indent, or counting by a rule of its own - and a desk
 * checks a catalog's hash, so a Studio whose two doors disagree is a Studio that ships files
 * some desks refuse.
 *
 * THE SECOND HALF IS THE REFUSAL. A catalog the pinned lint calls broken must not publish from
 * the screen either, and the cover must ask for the note that will be kept in the archive before
 * it will. That the button does nothing while the box is empty is asserted by pressing it and
 * then looking at the disk, not by reading the button's own state.
 *
 * AND THE THING THAT IS NOT A REFUSAL. A draft awaiting a second language publishes (board 510,
 * Maxim, 2026-09-18): the cover counts what it is waiting for, asks for nothing, and the press
 * writes the file. It is asserted on the screen because the cover is where the ruling changed
 * what a person sees - the module's own half is tests/publish.mjs 1h and 1i.
 *
 * THE REQUEST FOR STATISTICS IS NOT ON THIS COVER SINCE BOARD 560 (Maxim, 2026-09-19). The row
 * that asked the desks moved to the Statistics screen then, and left the app with board 891, when
 * live statistics replaced the request. What this file keeps of it is one assertion that the cover
 * kept nothing: a move tested only where it landed passes just as well with the control standing
 * in both places.
 *
 * WHY TWO COPIES AND NOT TWO PUBLISHES OF ONE. The second publish of one project is a different
 * revision by design and would rightly differ; tests/publish.mjs settles determinism the same
 * way and for the same reason.
 */
/* The command line's half publishes through the node modules, and a publish with no licence refuses since S-2, so the process
 * carries the paid licence a lead holds (tests/licensed-env.mjs). The windows are seated by the door and take no STUDIO_ variable
 * from this process (tests/shell-door.mjs studioEnv). Neither licence is written into what 3c compares. */
import "./licensed-env.mjs";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { openStudio } from "./shell-door.mjs";
import * as Engine from "../src/engine.mjs";
import { importCsv } from "../src/import.mjs";
import { json, PROJECT_FILE, DRAFT_FILE, ARCHIVE, CATALOG_IN_ARCHIVE,
         RELEASE_IN_ARCHIVE, NOTES_IN_ARCHIVE, REPORT_IN_ARCHIVE } from "../src/publish.mjs";
import { createTestLicence, localDay, LICENCE_KIND } from "../src/licence.mjs";
import { makeKeyFile } from "../src/sign.mjs";
import { clearScratch, dropScratch } from "./scratch.mjs";
import { pressWhen, settleOn } from "./press.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const SCRATCH = path.join(ROOT, "scratch", "publish-screen");
const NOTES = "Krenesk ondrave: plasule zubynt mirqondo.";
const WHY = "Norvan ustave brumor: greleth plasib zubess ondrork.";

let asserted = 0, failed = 0;
function check(cond, line) {
  asserted++;
  if (cond) process.stdout.write("  ok   " + line + "\n");
  else { failed++; process.stderr.write("  FAIL " + line + "\n"); }
}
const sleep = ms => new Promise(r => setTimeout(r, ms));
const sha = p => crypto.createHash("sha256").update(fs.readFileSync(p)).digest("hex");

function pile(name, seed, rows, faults) {
  const out = path.join(SCRATCH, "piles", name);
  const r = spawnSync(process.execPath, ["tools/fixtures/generate.mjs", "--seed", String(seed),
    "--rows", String(rows), "--out", out].concat((faults || []).map(f => "--" + f)),
    { cwd: ROOT, encoding: "utf8" });
  if (r.status !== 0) throw new Error("the generator refused: " + (r.stderr || r.stdout));
  return path.join(out, "macros.csv");
}

/** `hurt` is a hand on the draft after the import, for a fault no vendor export carries; the
 *  stale hash it leaves is stripped and recomputed by the publisher before it lints. `drop`
 *  is the importer's own column override, which is how a one-language vendor export arrives. */
async function plant(root, folder, csv, id, name, hurt, drop) {
  const dir = path.join(root, folder);
  fs.mkdirSync(dir, { recursive: true });
  const made = await importCsv({ file: csv, id, name, override: drop || null });
  if (hurt) hurt(made.catalog);
  fs.writeFileSync(path.join(dir, DRAFT_FILE), json(made.catalog), "utf8");
  /* THE PROJECT'S OWN FOLDER IS CHOSEN AS ITS SHARE, by name: a publish with none chosen is
     refused since sense pass 2 (tests/bad-day.mjs 3a), and every leg here reads the .ec there. */
  fs.writeFileSync(path.join(dir, PROJECT_FILE),
    json({ id: made.catalog.id, name, rev: 0, edition: "", draft: DRAFT_FILE, folder: dir }),
    "utf8");
  return { dir, catalog: made.catalog };
}


async function main(argv) {
  const keep = argv.indexOf("--keep") >= 0;
  clearScratch(SCRATCH);
  fs.mkdirSync(SCRATCH, { recursive: true });
  const projects = path.join(SCRATCH, "projects");

  /* The two copies are made from ONE import, so the drafts are the same bytes before either is
     published; the id is the same because the id is what a desk decides a catalog's identity by,
     and the folder's name is the same because it is the project's and heads the release notes. */
  const clean = pile("clean", 53, 22, []);
  const a = await plant(projects, "twin", clean, "twin-catalog", "Retail, EN and PL");
  const b = await plant(path.join(SCRATCH, "cli"), "twin", clean, "twin-catalog", "Retail, EN and PL");
  check(sha(path.join(a.dir, DRAFT_FILE)) === sha(path.join(b.dir, DRAFT_FILE)),
    "0a the two copies start as the same bytes");

  /* BROKEN BY SPEC 2.7'S OWN RULE AND NOT BY A SECOND LANGUAGE'S ABSENCE, which is a state
     that publishes since board 510 and would leave this section asserting a refusal that no
     longer happens. A card with no title in the primary language is an error on every engine
     this build can be pinned to. */
  const broken = await plant(projects, "c-broken", pile("broken", 54, 12, []),
    "broken-catalog", "Travel desk", (c) => { c.cards[2].title.en = ""; });
  /* The one-language shape, which is what a vendor export is: the Polish columns dropped at the
     importer's door, so the draft declares en alone. Its quick facts carry one line over the
     lint's 100 characters, a warning and not an error, so this cover offers the warnings tick
     that 2l and 2m press. */
  const waiting = await plant(projects, "d-waiting", pile("waiting", 55, 12, []),
    "waiting-catalog", "Pilot desk", (c) => { c.facts = "Ondrave plasule: " + "zubynt ".repeat(16); },
    { title_pl: null, body_pl: null });

  /* ONE KEY FOR BOTH DOORS (Clement omega's read of first-key, condition 4): a screen with no key now makes one at its first
     publish and signs (the sense pass of 2026-10-14, finding 9), and the command line signs only with a key it is named. So
     both are given one passphrase key file, the window by STUDIO_SIGNING_KEY and the command line by --key, each with
     STUDIO_KEY_PASSPHRASE; Ed25519 is deterministic, so section 3 compares the same signed bytes. */
  const KEY_AT = path.join(SCRATCH, "twin-key.json"), KEY_WORDS = "Ondrave plasule zubynt for both doors";
  fs.writeFileSync(KEY_AT, JSON.stringify(await makeKeyFile({ passphrase: KEY_WORDS }), null, 1) + "\n");
  const studio = await openStudio("tests/publish-screen.mjs", { words: true,
    projects, userDataDir: path.join(SCRATCH, "ud"), env: { STUDIO_SIGNING_KEY: KEY_AT, STUDIO_KEY_PASSPHRASE: KEY_WORDS },
  });

  try {
    const page = studio.page;
    /* THE PRESS DRAWS THE EDITION GOING OUT once the file is written (the Publishing window, 2026-10-08): where Publish
       goes ahead, Escape finishes the drawing as a person's would, so what is read next is the window landed. */
    const press = async (sel, ms) => {
      await pressWhen(page, sel, { who: "tests/publish-screen.mjs" });
      if (sel === '[data-act="do-publish"]') await page.evaluate(() => { if (document.querySelector("#prGo[aria-busy]"))
        document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })); });
      await sleep(ms || 400);
    };
    const put = async (sel, v) => {
      const hit = await page.evaluate((s, value) => {
        const e = document.querySelector(s); if (!e) return false;
        e.value = value; e.dispatchEvent(new Event("input", { bubbles: true })); return true;
      }, sel, v);
      if (!hit) throw new Error("nothing at " + sel);
      await sleep(120);
    };
    /* From the Library (board 982 E): Overview shows a catalog only once it has been opened, so a planted one is opened from there. */
    const openNamed = async (dir) => {
      await press('[data-act="to-projects"]');
      await press('#rail [data-act="home"][data-v="library"]');
      await pressWhen(page, '[data-act="open"]', { who: "tests/publish-screen.mjs", attr: ["data-dir", dir] });
      await sleep(600);
    };

    /* ---- 1. THE CLEAN ONE, THROUGH THE COVER ------------------------------------------------ */

    await openNamed(a.dir);
    await press('[data-act="publish"]', 700);
    await settleOn(page, '!document.querySelector("#scrim").hidden && !!document.querySelector("#dlg")', { bound: 30000 });
    const cover = await page.evaluate(() => {
      const d = document.querySelector("#dlg");
      const rev = d && d.querySelector(".facts [aria-label]");
      return d ? { up: !document.querySelector("#scrim").hidden, text: d.textContent,
        rev: rev ? rev.getAttribute("aria-label").split(String.fromCharCode(160)).join(" ") : "" } : null;
    });
    /* The line under the title is the offer (board 873): every desk that reads the folder is offered this edition. */
    check(cover && cover.up && /Checks/.test(cover.text) && /Where it goes/.test(cover.text)
          && /Every desk that reads the folder is offered this edition, and nothing changes for anyone until they accept it\./.test(cover.text),
      "1a the press comes up on Publish with its checks, where it goes, and the line under the title");
    check(cover && cover.rev === "rev 0 becomes rev 1",
      "1b it names the revision the publish will write: " + JSON.stringify(cover && cover.rev));

    /* THE OTHER HALF OF BOARD 560'S MOVE, ASSERTED WHERE THE CONTROL USED TO BE. The row is
       tested on the Statistics screen; what can only be tested here is that nothing of it is
       left on the cover that publishes - no span, no button, and no mention of the file. */
    const kept = await page.evaluate(() => ({
      fields: !!document.querySelector("#askFrom") || !!document.querySelector("#askTo"),
      button: !!document.querySelector('[data-act="ask-desks"]'),
    }));
    check(!kept.fields && !kept.button
          && !/Asks the desks|Ask for statistics|etiuda-request/.test(cover.text),
      "1g the cover keeps nothing of the request for statistics, which is on the Statistics"
      + " screen since 560: fields " + kept.fields + ", button " + kept.button);
    await put("#notes", NOTES);

    /* THE COVER WRITES THE CATALOG AND NOTHING BESIDE IT: no second output is offered, by its
       control or by the name of a file it would write. */
    const second = await page.evaluate(() => ({
      box: !!document.querySelector('#dlg [data-act="build"]'),
      html: /\.html\b/.test(document.querySelector("#dlg").textContent),
    }));
    check(!second.box && !second.html,
      "1e the cover offers no second output: box " + second.box + ", an .html name " + second.html);

    /* 2k now sees only a cover with warnings, since the waiting fixture carries one, so the
       other half of item 35 is held here: the twin has none, and the tick is not offered. */
    const warnTick = await page.evaluate(() => !!document.querySelector('#dlg [data-act="warn"]'));
    check(!warnTick, "1h the warnings tick is not offered over no warnings (item 35): tick "
      + warnTick + ", " + JSON.stringify((/\d+ errors?[^]{0,40}?\d+ warnings?/.exec(cover.text) || [""])[0]));

    await press('[data-act="do-publish"]', 4000);

    /* THE FILE IS NAMED BY THE SLUG OF THE FOLDER'S NAME (the record's own `name` is an older key nothing reads), fixed at the first publish (board 18), and not by the catalog id. */
    const ecA = path.join(a.dir, "twin.ec");
    check(fs.existsSync(ecA), "1c the screen wrote the catalog into the folder chosen for it, the project's own");
    const after = await page.evaluate(() => (document.querySelector('[data-act="publish"]')
      || {}).textContent || "");
    check(/rev 2/.test(after), "1d and the screen now offers the next revision: "
      + JSON.stringify(after));

    /* ---- 2. THE BROKEN ONE, AND THE NOTE THE COVER ASKS FOR ---------------------------------- */

    await openNamed(broken.dir);
    await press('[data-act="section"][data-v="lint"]', 500);
    await settleOn(page, 'document.querySelectorAll("#main tbody tr").length > 0', { bound: 30000 });
    const lint = await page.evaluate(() => ({
      rows: document.querySelectorAll("#main tbody tr").length,
      chips: Array.from(document.querySelectorAll("#main .chip")).map(c => c.textContent),
      tail: (document.querySelector("#main .dashed") || {}).textContent || "",
    }));
    check(lint.rows > 0 && lint.chips.indexOf("Error") >= 0,
      "2a the lint list shows the pinned engine's errors (" + lint.rows + " row(s), chips "
      + JSON.stringify(lint.chips.slice(0, 3)) + ")");
    check(/needs a note saying why/.test(lint.tail),
      "2b and says publishing over them needs a note");

    await press('[data-act="publish"]', 700);
    await settleOn(page, '!!document.querySelector("#override")', { bound: 30000 });
    const asks = await page.evaluate(() => !!document.querySelector("#override"));
    check(asks, "2c the cover asks for the override note when errors stand");
    /* A REFUSED PRESS SHOWS WHY (polish 03, item 9): pressed from the foot of a scrolled cover it
       brought the box to the top of the view and the sentences saying why out of it above. */
    await page.evaluate(() => { const b = document.querySelector("#prGates");
      b.scrollTop = b.scrollHeight; });
    await press('[data-act="do-publish"]', 900);
    await settleOn(page, 'Array.from(document.querySelectorAll("#override")).some(b => Array.from((b.closest(".pwc-gate") || document.body).querySelectorAll(".n")).some(n => /needs a note saying why/.test(n.textContent)))', { bound: 30000 });
    const why = await page.evaluate(() => {
      const body = document.querySelector("#prGates").getBoundingClientRect();
      const box = document.querySelector("#override");
      const said = Array.from(box.closest(".pwc-gate").querySelectorAll(".n"))
        .filter(n => /needs a note saying why/.test(n.textContent));
      const r = said.length ? said[0].getBoundingClientRect() : null;
      return { said: !!r && r.top >= body.top - 1 && r.bottom <= body.bottom + 1,
        focused: document.activeElement === box, label: box.getAttribute("placeholder") || "" };
    });
    check(why.said && why.focused && why.label.length > 0,
      "2n and the refused press brings the sentence saying why into view with the box, focused"
      + " and labelled " + JSON.stringify(why.label));
    const ecB = path.join(broken.dir, "c-broken.ec");
    check(!fs.existsSync(ecB) && !fs.existsSync(path.join(broken.dir, ARCHIVE)),
      "2d pressing Publish with the note empty wrote nothing at all");

    await put("#override", WHY);
    await press('[data-act="do-publish"]', 1400);
    check(fs.existsSync(ecB), "2e and with the note it publishes");
    const eds = fs.readdirSync(path.join(broken.dir, ARCHIVE));
    const notes = fs.readFileSync(path.join(broken.dir, ARCHIVE, eds[0], RELEASE_IN_ARCHIVE), "utf8");
    const report = JSON.parse(fs.readFileSync(path.join(broken.dir, ARCHIVE, eds[0],
      REPORT_IN_ARCHIVE), "utf8"));
    check(notes.indexOf(WHY) >= 0 && report.override === WHY,
      "2f the note is in the release notes and in the archived report, word for word");
    check(report.lint.errors > 0 && report.lint.errorLines.length === report.lint.errors,
      "2g and the archive records every error it went out over (" + report.lint.errors + ")");

    /* ---- 2 (second half). THE ONE-LANGUAGE DRAFT, WHICH PUBLISHES ---------------------------
     *
     * Board 510, Maxim, 2026-09-18: the absence of a second language is a state and not a
     * fault, so the cover reports it and asks nothing. Three things are therefore measured on
     * the screen rather than in the module: that the count per language is on the cover, that
     * the cover does NOT ask for an override note, and that pressing Publish with no note
     * writes the catalog. The third is the one that would have failed yesterday.
     */
    await openNamed(waiting.dir);
    await press('[data-act="publish"]', 900);
    await settleOn(page, '((document.querySelector("#dlg .pwc-gate[data-gate=\\"lint\\"]") || {}).textContent || "").trim() !== ""', { bound: 30000 });
    const wait = await page.evaluate(() => {
      const gate = (n) => (document.querySelector('#dlg .pwc-gate[data-gate="' + n + '"]') || {}).textContent || "";
      return { checked: gate("lint") + " " + gate("langs"),
               asks: !!document.querySelector("#override"),
               /* Every tick on the cover with the words beside it. The warnings tick stands on
                  this cover, so the claim is that no tick is about the awaiting state, not that
                  the cover has no tick at all. */
               ticks: Array.from(document.querySelectorAll("#dlg .cbx"))
                 .map(b => ((b.parentNode || {}).textContent || "").trim()) };
    });
    check(/Awaiting its PL text on 12 cards\./.test(wait.checked),
      "2h the cover counts what the draft is awaiting, naming the language by its code (532 and"
      + " 549), beside the lint counts: "
      + JSON.stringify(wait.checked));
    check(!wait.asks && !wait.ticks.some(w => /waiting|awaiting|language/i.test(w)),
      "2i and it asks for nothing: no override box, and no tick on the cover is about the"
      + " awaiting state (" + JSON.stringify(wait.ticks) + ")");
    const warnN = +((/(\d+) warnings?/.exec(wait.checked) || [])[1] || 0);
    check(wait.ticks.some(w => /warnings unfixed/.test(w)) === warnN > 0,
      "2k the warnings tick is offered only over warnings (item 35): " + warnN + " warning(s), ticks "
      + JSON.stringify(wait.ticks));

    /* A TICK IS SEEN IN BOTH THEMES (sense pass item 28): the warnings box, ticked and
       then unticked, its two fills read off the page in each theme and held at 4.5:1 or more,
       and its state said to a screen reader. Put back unticked, which is how 2j expects it. */
    const lum = (rgb) => {
      const c = (rgb.match(/\d+(\.\d+)?/g) || []).slice(0, 3).map(Number).map(v => v / 255)
        .map(v => v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
      return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
    };
    const ratio = (a, b) => { const x = lum(a), y = lum(b);
      return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
    const fills = {};
    const theme0 = await page.evaluate(() => document.documentElement.getAttribute("data-theme"));
    for (const th of ["light", "dark"]) {
      await page.evaluate((t) => document.documentElement.setAttribute("data-theme", t), th);
      await press('#dlg [data-act="warn"]', 250);
      await settleOn(page, '(document.querySelector("#dlg [data-act=\\"warn\\"]") || {}).getAttribute("aria-checked") === "true"', { bound: 30000 });
      const on = await page.evaluate(() => { const b = document.querySelector('#dlg [data-act="warn"]');
        return { bg: getComputedStyle(b).backgroundColor, aria: b.getAttribute("aria-checked") }; });
      await press('#dlg [data-act="warn"]', 250);
      await settleOn(page, '(document.querySelector("#dlg [data-act=\\"warn\\"]") || {}).getAttribute("aria-checked") === "false"', { bound: 30000 });
      const off = await page.evaluate(() => { const b = document.querySelector('#dlg [data-act="warn"]');
        return { bg: getComputedStyle(b).backgroundColor, aria: b.getAttribute("aria-checked") }; });
      fills[th] = { ratio: +ratio(on.bg, off.bg).toFixed(2), on: on.bg, off: off.bg,
                    aria: on.aria + "/" + off.aria };
    }
    await page.evaluate((t) => document.documentElement.setAttribute("data-theme", t), theme0);
    check(fills.light.ratio >= 4.5 && fills.dark.ratio >= 4.5,
      "2l a ticked box differs from an empty one at 4.5:1 or more in both themes: "
      + JSON.stringify(fills));
    check(fills.light.aria === "true/false" && fills.dark.aria === "true/false",
      "2m and the box says its state as a checkbox, ticked then not: " + fills.light.aria);
    await press('[data-act="do-publish"]', 2500);
    const ecW = path.join(waiting.dir, "d-waiting.ec");
    const edsW = fs.existsSync(path.join(waiting.dir, ARCHIVE))
      ? fs.readdirSync(path.join(waiting.dir, ARCHIVE)) : [];
    const notesW = edsW.length
      ? fs.readFileSync(path.join(waiting.dir, ARCHIVE, edsW[0], RELEASE_IN_ARCHIVE), "utf8") : "";
    check(fs.existsSync(ecW) && notesW.indexOf("- awaiting: pl, 12 card(s) lacking text") >= 0
          && notesW.indexOf("on an override note") < 0,
      "2j pressing Publish with no note at all writes the catalog, and the archive's release"
      + " notes carry the same count per language ["
      + JSON.stringify(notesW.split("\n").filter(l => /awaiting/.test(l))) + "]");

  } finally {
    await studio.shut();
  }
  await sleep(400);

  /* ---- 3. THE SAME PROJECT, THROUGH THE COMMAND LINE ----------------------------------------- */

  const cli = spawnSync(process.execPath, ["tools/publish.mjs", b.dir, "--notes", NOTES, "--key", KEY_AT],
    { cwd: ROOT, encoding: "utf8", env: Object.assign({}, process.env, { STUDIO_KEY_PASSPHRASE: KEY_WORDS }) });
  check(cli.status === 0, "3a node tools/publish.mjs published the twin, exit " + cli.status
    + (cli.status === 0 ? "" : ": " + cli.stderr.trim()));

  const ecTwin = path.join(b.dir, "twin.ec");
  const edA = fs.readdirSync(path.join(a.dir, ARCHIVE));
  const edB = fs.readdirSync(path.join(b.dir, ARCHIVE));
  check(edA.length === 1 && edB.length === 1 && edA[0] === edB[0],
    "3b both stamped the same edition, by the engine's own rule: " + edA[0] + " and " + edB[0]);

  const pairs = [
    ["the catalog a desk reads", path.join(a.dir, "twin.ec"), ecTwin],
    ["the archived copy", path.join(a.dir, ARCHIVE, edA[0], CATALOG_IN_ARCHIVE),
     path.join(b.dir, ARCHIVE, edB[0], CATALOG_IN_ARCHIVE)],
    ["the release notes", path.join(a.dir, ARCHIVE, edA[0], RELEASE_IN_ARCHIVE),
     path.join(b.dir, ARCHIVE, edB[0], RELEASE_IN_ARCHIVE)],
    ["the notes beside them", path.join(a.dir, ARCHIVE, edA[0], NOTES_IN_ARCHIVE),
     path.join(b.dir, ARCHIVE, edB[0], NOTES_IN_ARCHIVE)],
    ["the report", path.join(a.dir, ARCHIVE, edA[0], REPORT_IN_ARCHIVE),
     path.join(b.dir, ARCHIVE, edB[0], REPORT_IN_ARCHIVE)],
  ];
  for (const [what, x, y] of pairs) {
    const sx = fs.existsSync(x) ? sha(x) : "absent";
    const sy = fs.existsSync(y) ? sha(y) : "absent";
    check(sx === sy && sx !== "absent",
      "3c " + what + " is the same bytes from the screen and from the command line ("
      + sx.slice(0, 16) + ")");
  }

  /* ---- 4. THE CATALOG AND NOTHING BESIDE IT ------------------------------------------------ */

  const html = fs.readdirSync(a.dir).filter(n => /\.html$/i.test(n));
  check(html.length === 0, "4a the publish from the screen wrote no .html beside the catalog: "
    + JSON.stringify(html));

  /* The bytes being equal is the claim; that they are also a catalog is worth one more line,
     because two identical broken files would satisfy every assertion above. */
  const { loadCatalog } = Engine.lint();
  let read = null, refusal = null;
  try { read = loadCatalog(ecTwin); } catch (e) { refusal = e; }
  check(!!read && !refusal, "3d and the file both doors wrote is one the pinned engine reads"
    + (refusal ? ": " + refusal.message : ""));

  const doc = JSON.parse(fs.readFileSync(ecTwin, "utf8"));
  const F = await Engine.format();
  const bare = Object.assign({}, doc); delete bare.hash; delete bare.sig;
  check(doc.rev === 1 && doc.date === edA[0] && doc.hash === F.contentHash(bare),
    "3e carrying rev 1, the edition it was archived under, and its own content hash");


  /* ---- 5. a newer build carries the mark, and the licence is named on the cover ---------------
     A licence whose updates ended on 2025-06-01, signed with a key made here and trusted through
     the variable the licence tests use, against a build STUDIO_RELEASED says was released on
     2026-09-23. The cover says the mark and does not pause. Nothing is pressed, because a press
     would publish. */
  const pair = crypto.generateKeyPairSync("ed25519");
  const pubHex = pair.publicKey.export({ type: "spki", format: "der" }).subarray(-32).toString("hex");
  const licAt = path.join(SCRATCH, "lapsed-licence.js");
  /* A format-2 licence, the persons by name, which Studio still reads as three seats. */
  const lapsed = await createTestLicence({ format: 2, kind: LICENCE_KIND,
    org: "Zubynt Ondrave", persons: ["Brumor Ustave", "Greleth Plasib", "Ondrork Zubess"],
    issued: "2024-06-01", updatesUntil: "2025-06-01" }, pair.privateKey, "vendor-root-test");
  fs.writeFileSync(licAt, "window.E_LICENSE = " + JSON.stringify(lapsed) + ";" + String.fromCharCode(10), "utf8");
  const edsBefore = fs.readdirSync(path.join(a.dir, ARCHIVE)).length;
  const coverRead = async (page, press) => {
    await page.setViewport({ width: 1280, height: 860, deviceScaleFactor: 1 });
    const who = "tests/publish-screen.mjs 5";
    await pressWhen(page, '#rail [data-act="home"][data-v="library"]', { who });
    await pressWhen(page, '[data-act="open"]', { who, attr: ["data-dir", a.dir] });
    await sleep(900);
    /* THE READ WAITS FOR ITS OWN FACT (board 801): the cover paints when the publish plan comes
       back, and the refusal when the publish answer does, so each read waits for that paint, not
       for a time. A cover or a refusal that never comes is read anyway and 5a to 5d fail on it. */
    await pressWhen(page, '[data-act="publish"]', { who });
    await settleOn(page, `(window.STUDIO_READY || {}).cover === "publish"
      && !!document.querySelector("#dlg h2")`);
    if (press) {
      await pressWhen(page, '[data-act="do-publish"]', { who });
      await settleOn(page, `((document.querySelector("#dlg [data-err]") || {}).textContent || "")
        !== ""`);
    }
    return JSON.parse(await page.evaluate(`JSON.stringify((() => {
      const said = document.querySelector("#dlg [data-err]");
      let box = said && said.parentElement;
      while (box && !/(auto|scroll)/.test(getComputedStyle(box).overflowY)) box = box.parentElement;
      const r = said ? said.getBoundingClientRect() : null, v = box ? box.getBoundingClientRect() : null;
      const kv = document.querySelector('#dlg .pwc-gate[data-gate="licence"]');
      return { said: said ? said.textContent : "", inView: !!(r && v && r.top >= v.top - 0.5
                 && r.bottom <= v.bottom + 0.5 && r.bottom <= innerHeight),
               top: r ? Math.round(r.top) : null, fold: v ? Math.round(v.bottom) : null,
               licence: kv ? kv.textContent : "",
               screen: (window.STUDIO_READY || {}).screen || "",
               h2: (document.querySelector("#dlg h2") || {}).textContent || "",
               opens: document.querySelectorAll('[data-act="open"]').length };
    })())`));
  };
  const coverOf = async (env, who, press) => {
    const win = await openStudio("tests/publish-screen.mjs " + who, { words: true,
      projects, userDataDir: path.join(SCRATCH, "ud-" + who), env });
    try { return await coverRead(win.page, press); } finally { await win.shut(); }
  };

  const lock = await coverOf({ STUDIO_VENDOR_KEY: pubHex, STUDIO_LICENCE_FILE: licAt,
    STUDIO_RELEASED: "2026-09-23" }, "lock", false);
  check(!lock.said
        && lock.licence.indexOf("Zubynt Ondrave, seats: 3, devices per seat: 3, updates"
          + " until 2025-06-01") >= 0
        && !/valuation/.test(lock.licence)
        && lock.licence.indexOf("Publishing is locked") < 0
        && fs.readdirSync(path.join(a.dir, ARCHIVE)).length === edsBefore,
    "5a a build released after the licence's updates is read as any other: the cover says the licence, no evaluation"
    + " mark, and nothing is written because nothing was pressed: " + JSON.stringify(lock.licence));
  check(lock.licence.indexOf(licAt) >= 0,
    "5b and the cover names the file the licence was read from: " + JSON.stringify(lock.licence));

  /* THE SAME LICENCE UNDER A BUILD RELEASED INSIDE ITS UPDATES, which is the use that does not
     expire: the cover counts the EULA's way and nothing refuses. No press, because a publish
     here would move the archive 5a counted. */
  const within = await coverOf({ STUDIO_VENDOR_KEY: pubHex, STUDIO_LICENCE_FILE: licAt,
    STUDIO_RELEASED: "2025-05-30" }, "within", false);
  check(within.licence.indexOf("Zubynt Ondrave, seats: 3, devices per seat: 3, updates"
          + " until 2025-06-01") >= 0 && !within.said,
    "5c CONTROL: the same licence under a build of 2025-05-30 reads active, with the EULA's count,"
    + " more than a year after its updates ended: " + JSON.stringify(within.licence));

  /* AN UNUSABLE LICENCE IS NO LICENCE. The vendor root key is embedded now (board 742), so a genuine licence signed by a
     throwaway key and checked with no key handed in is the root's refusal: its signature is not the root's. The window is
     signed in (the door's seat) with that file as its licence and no STUDIO_VENDOR_KEY, the seat's own root taken out too.
     SINCE S-1b A STUDIO WITH NO LICENCE IT CAN USE STANDS AT THE DOOR (shell/main.js worksNow): no project opens, so the
     publish cover, where this read the file and the reason until then, is not reached, and what is read is the door's own
     sentence and that no Open is offered. The file's name and the reason must be on the screen Studio stops at, with what to
     do: a paying person whose licence file is refused and told nothing is stranded (class B, the test architect with the lead
     engineer, 2026-11-22; S-1b dropped them unasked). So 5d asks the door for the file's name and the refusal's reason, as it
     asked the publish cover before S-1b, and is red until the product puts them back; the next step's words are the
     copywriter's and are not bound here. The door stands
     only where a way to sign in is offered, and this tree ships no client id, so the window asks the sign-in preview
     (ETIUDA_SIGNIN_PREVIEW=1), which offers both providers by name and signs nobody in (shell/main.js signInOffer). */
  const doorOf = async (env, who) => {
    const win = await openStudio("tests/publish-screen.mjs " + who, { words: true,
      projects, userDataDir: path.join(SCRATCH, "ud-" + who), env });
    try {
      await settleOn(win.page, '!!document.querySelector("#main [data-signin-door]")', { bound: 30000 });
      return JSON.parse(await win.page.evaluate(`JSON.stringify({
        door: ((document.querySelector("#main [data-signin-door]") || {}).textContent || ""),
        opens: document.querySelectorAll('[data-act="open"]').length,
        cover: (window.STUDIO_READY || {}).cover || "" })`));
    } finally { await win.shut(); }
  };
  const nokey = await doorOf({ STUDIO_LICENCE_FILE: licAt, STUDIO_VENDOR_KEY: null, ETIUDA_SIGNIN_PREVIEW: "1" }, "nokey");
  check(nokey.door.indexOf("No licence is active for this Studio.") >= 0
        && nokey.door.indexOf(path.basename(licAt)) >= 0 && /signature does not match/.test(nokey.door)
        && nokey.opens === 0 && !nokey.cover && fs.readdirSync(path.join(a.dir, ARCHIVE)).length === edsBefore,
    "5d a genuine licence signed by a key that is not the root's reads as no licence: signed in, the window stands at the"
    + " door naming the licence file and saying its signature does not match, offers no project to open and writes nothing"
    + " (was, since S-1b: the door said only that the licence file could not be used): "
    + JSON.stringify([nokey.door.slice(0, 240), nokey.opens]));

  /* ---- 6. the folder changed on the cover (bug hunt 3, item 14) -----------------------------
     A folder changed on the Publish cover and then cancelled was forgotten by the project's
     Settings, and a change the disk refused said nothing. STUDIO_TEST_FOLDER answers the pick. */
  const elsewhere = path.join(SCRATCH, "elsewhere");
  fs.mkdirSync(elsewhere, { recursive: true });
  const folderWin = await openStudio("tests/publish-screen.mjs folder", { projects,
    userDataDir: path.join(SCRATCH, "ud-folder"), env: { STUDIO_TEST_FOLDER: elsewhere } });
  const projAt = path.join(waiting.dir, PROJECT_FILE);
  let moved = null, refusedMove = null;
  try {
    const page = folderWin.page;
    const click = async (sel, ms) => {
      await pressWhen(page, sel, { who: "tests/publish-screen.mjs 6" });
      await sleep(ms || 500);
    };
    await click('#rail [data-act="home"][data-v="library"]', 400);
    await click('[data-act="open"][data-dir="' + waiting.dir.replace(/\\/g, "\\\\") + '"]', 900);
    await click('[data-act="publish"]', 900);
    await click('[data-act="change-folder"]', 700);
    await click('[data-act="cover-close"]', 400);
    await pressWhen(page, '[data-act="section"][data-v="settings"]', { who: "tests/publish-screen.mjs 6" });
    await settleOn(page, `Array.from(document.querySelectorAll("#main .mono")).some((e) => e.textContent === ${JSON.stringify(elsewhere)})`, { bound: 30000 });
    moved = await page.evaluate(() => Array.from(document.querySelectorAll("#main .mono"))
      .map((e) => e.textContent));
    try {
      fs.chmodSync(projAt, 0o444);
      await click('[data-act="publish"]', 900);
      await pressWhen(page, '[data-act="change-folder"]', { who: "tests/publish-screen.mjs 6" });
      await settleOn(page, '((document.querySelector("#dlg [data-err]") || {}).textContent || "").trim() !== ""', { bound: 30000 });
      refusedMove = await page.evaluate(() =>
        (document.querySelector("#dlg [data-err]") || {}).textContent || "");
    } finally { fs.chmodSync(projAt, 0o666); }
  } finally { fs.chmodSync(projAt, 0o666); await folderWin.shut(); }
  check(moved.indexOf(elsewhere) >= 0
        && JSON.parse(fs.readFileSync(projAt, "utf8")).folder === elsewhere,
    "6a a folder changed on the cover and then cancelled is the folder Settings shows, as it is"
    + " the one on disk: " + JSON.stringify(moved));
  check(refusedMove !== "",
    "6b a change the disk refuses is said on the cover: " + JSON.stringify(refusedMove));

  if (!keep) dropScratch(SCRATCH, "publish-screen");
  process.stdout.write("publish-screen  " + asserted + " assertion(s), " + failed + " failure(s)\n");
  process.exit(failed ? 1 : 0);
}

main(process.argv.slice(2)).catch(e => {
  process.stderr.write("publish-screen  " + (e && e.stack ? e.stack : String(e)) + "\n");
  process.exit(2);
});
