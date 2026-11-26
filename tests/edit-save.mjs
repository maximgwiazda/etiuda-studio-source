/* AN EDIT MADE ON THE SCREEN IS A FILE THE PINNED ENGINE READS. Course node 10, leg one.
 *
 *     node tests/edit-save.mjs [--keep]
 *
 * THE ORACLE IS THE ENGINE, NOT STUDIO. What this asserts is not that saveCard wrote what it was
 * asked to write - that would be Studio marking its own paper - but that the file it left behind
 * goes through `loadCatalog` in the PINNED engine's own tests/test.js, which parses it, refuses
 * anything that is not format 2, and runs the engine's v2 reader over it, throwing on the first
 * problem. A draft Studio saves is a draft a desk would accept, or this leg is red.
 *
 * THE EDIT IS MADE IN THE WINDOW, not by calling src/studio.mjs. Every part of the path is then
 * under test at once: the renderer's field, the debounce, the context bridge, the IPC handler,
 * the writer and the hash. A leg that called the module directly would pass with the preload
 * broken and the screen unusable, which is the state this whole course is trying to leave.
 *
 * WHAT IT DOES NOT TOUCH IS THE POINT OF HALF THE ASSERTIONS. One card is edited; every other
 * card, every tag and every header field must come out of the file byte for byte as it went in,
 * because the commonest way a writer like this goes wrong is quietly, by reordering a key or
 * dropping a field nothing on the screen shows.
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { openStudio } from "./shell-door.mjs";
import * as Engine from "../src/engine.mjs";
import { importCsv } from "../src/import.mjs";
import { json, lintOf, PROJECT_FILE, DRAFT_FILE } from "../src/publish.mjs";
import { clearScratch, dropScratch } from "./scratch.mjs";
import { pressWhen, settleOn } from "./press.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const SCRATCH = path.join(ROOT, "scratch", "edit-save");

let asserted = 0, failed = 0;
function check(cond, line) {
  asserted++;
  if (cond) process.stdout.write("  ok   " + line + "\n");
  else { failed++; process.stderr.write("  FAIL " + line + "\n"); }
}
const sleep = ms => new Promise(r => setTimeout(r, ms));

function pile(name, seed, rows) {
  const out = path.join(SCRATCH, "piles", name);
  const r = spawnSync(process.execPath, ["tools/fixtures/generate.mjs", "--seed", String(seed),
    "--rows", String(rows), "--out", out], { cwd: ROOT, encoding: "utf8" });
  if (r.status !== 0) throw new Error("the generator refused: " + (r.stderr || r.stdout));
  return path.join(out, "macros.csv");
}

async function plant(root, folder, csv, id, name) {
  const dir = path.join(root, folder);
  fs.mkdirSync(dir, { recursive: true });
  const made = await importCsv({ file: csv, id, name });
  fs.writeFileSync(path.join(dir, DRAFT_FILE), json(made.catalog), "utf8");
  fs.writeFileSync(path.join(dir, PROJECT_FILE),
    json({ id: made.catalog.id, name, rev: 0, edition: "", draft: DRAFT_FILE, folder: null }),
    "utf8");
  return dir;
}

/* THE TEXT THAT IS TYPED. Invented syllables like the generator's, no employer and no catalog
   wording, and it carries one of the engine's own placeholders and one the engine does not know,
   so the chips under the field have something to be right and wrong about. */
const NEW_TITLE_EN = "Ondrave plasule zubynt";
const NEW_TITLE_PL = "Ondrawe plasula zubent";
const NEW_BODY_EN = "Krenesk ustave {AGENT} mirqondo norvira.\nGrelud plasib {NOTATOKEN} zubalt.";
const NEW_BODY_PL = "Norvan sarnux ustondo {AGENT} brumor.\nGreleth ondrork plasira zubess.";
/* THE KEYWORD BAG IS ONE STRING WITH NO LANGUAGE (board 597), so it is typed once and the leg
   below reads it back whole: a separator invented by the screen or by the shell would show up
   here as a string that is not the one that was typed. */
const NEW_KEYS = "zubynt mirqondo plasule";
/* THE NOTE IS WHAT THE DESK SHOWS BESIDE THE CARD (sense pass item 10), per language, and an
   emptied one comes off the card in that language, as the bag does. */
const NEW_NOTE_EN = "Plasib ondrork {AGENT} sarnux.";
const NEW_NOTE_PL = "Ustondo grelud norvira brumor.";

async function main(argv) {
  const keep = argv.indexOf("--keep") >= 0;
  clearScratch(SCRATCH);
  fs.mkdirSync(SCRATCH, { recursive: true });
  const projects = path.join(SCRATCH, "projects");
  const dir = await plant(projects, "retail", pile("a", 41, 16), "edit-retail", "Retail, EN and PL");
  const draftAt = path.join(dir, DRAFT_FILE);
  const before = JSON.parse(fs.readFileSync(draftAt, "utf8"));

  const studio = await openStudio("tests/edit-save.mjs", {
    projects, userDataDir: path.join(SCRATCH, "ud"),
  });

  let typed = null;
  try {
    const page = studio.page;

    /* A CLICK ON THE ELEMENT, NOT A MOUSE AT A COORDINATE. setViewport does not resize an
       Electron BrowserWindow, so the page's CSS pixels and CDP's input coordinates disagree
       under this desk's devicePixelRatio and every synthesised click lands somewhere else -
       measured, the Open button was pressed at a point 20 per cent away from itself. Nothing in
       this screen reads which hand was used, so el.click() is the whole interaction here. */
    const press = async (sel) => {
      await pressWhen(page, sel, { who: "tests/edit-save.mjs" });
      await sleep(400);
    };
    const put = async (sel, value) => {
      const hit = await page.evaluate((s, v) => {
        const e = document.querySelector(s); if (!e) return false;
        e.value = v;
        e.dispatchEvent(new Event("input", { bubbles: true }));
        return true;
      }, sel, value);
      if (!hit) throw new Error("nothing at " + sel);
      await sleep(120);
    };

    await press('[data-act="open"]');
    await press('#main tr[data-act="pick"]');
    await settleOn(page, '((document.querySelector("#main .cols .pane h3") || {}).textContent || "").trim() !== ""', { bound: 30000 });
    typed = await page.evaluate(() => {
      const t = document.querySelector("#main .cols .pane h3");
      return t ? t.textContent : "";
    });

    /* Both languages, because a content change covers EN and PL together. The seg is on the
       primary language, so the Polish fields are reached by choosing Polish, and English is chosen again after. */
    await put('input.field[data-f="title"][data-l="en"]', NEW_TITLE_EN);
    await put('textarea.ta[data-f="body"][data-l="en"]', NEW_BODY_EN);
    await press('.seg span[data-act="lang"][data-v="pl"]');
    await press('#main tr.sel');
    await put('input.field[data-f="title"][data-l="pl"]', NEW_TITLE_PL);
    await put('textarea.ta[data-f="body"][data-l="pl"]', NEW_BODY_PL);
    await press('.seg span[data-act="lang"][data-v="en"]');
    await press('#main tr.sel');

    const chips = await page.evaluate(() => Array.from(
      document.querySelectorAll('[data-chips="en"] .chip')).map(c => c.textContent + (c.classList.contains("err") ? "!" : "")));
    check(chips.join(" ") === "{AGENT} {NOTATOKEN}!",
      "1a the field shows the placeholders the engine knows and marks the one it does not: "
      + JSON.stringify(chips));

    /* A category and an intent, the two fields that are ids rather than text, so the leg covers
       the half of the patch that the screen refuses on the shell's side. */
    const shelf = await page.evaluate(() => {
      const s = document.querySelector('select[data-f="shelf"]');
      const other = Array.from(s.options).find(o => o.value && o.value !== s.value);
      s.value = other.value;
      s.dispatchEvent(new Event("input", { bubbles: true }));
      return other.value;
    });
    await sleep(150);
    const hasIntent = await page.evaluate(() => !!document.querySelector('[data-act="intent-remove"]'));
    if (hasIntent) {
      await press('[data-act="intent-remove"]');
    } else {
      await press('#intentFind');
      await settleOn(page, '!!document.querySelector(\'[data-act="intent-add"]\')', { bound: 30000 });
      await press('[data-act="intent-add"]');
    }

    /* THE DEBOUNCE IS WAITED OUT BY WATCHING THE FILE, not by sleeping a number somebody chose:
       the screen saves 350 ms after the last keystroke, and a sleep long enough here today is a
       sleep too short on a slower desk. */
    const want = NEW_BODY_PL.split("\n")[0];
    let landed = false;
    for (let i = 0; i < 80 && !landed; i++) {
      await sleep(150);
      landed = fs.readFileSync(draftAt, "utf8").indexOf(want) >= 0;
    }
    check(landed, "1b the edit reached the file on disk within the debounce");

    const shown = await page.evaluate(() =>
      (document.querySelector("#main tr.sel td:last-child") || {}).textContent || "");
    check(shown.trim() === "a moment ago",
      '1c the row says when it was edited, in the canvas\'s own words: "' + shown.trim() + '"');

    /* THE BAG, TYPED, EMPTIED AND TYPED AGAIN, each step waited out on the file rather than on a
       number. Emptying it is the half worth driving through the screen: Maxim's ruling of
       2026-09-19 makes the bag optional, and an emptied box that wrote "" would leave a field
       on the card that no screen shows and that the content hash can still see, so every desk
       would take a new revision for a keyword nobody typed. */
    const onDraft = async (pred) => {
      for (let i = 0; i < 80; i++) {
        await sleep(150);
        const c = JSON.parse(fs.readFileSync(draftAt, "utf8")).cards
          .find(x => x.title && x.title.en === NEW_TITLE_EN);
        if (c && pred(c)) return true;
      }
      return false;
    };
    await put('input.field[data-f="k"]', NEW_KEYS);
    check(await onDraft(c => c.k === NEW_KEYS),
      "1d the keyword bag typed into the box reaches the file as the one string it was typed as");
    await put('input.field[data-f="k"]', "   ");
    check(await onDraft(c => !("k" in c)),
      "1e and an emptied box takes the field OFF the card rather than writing an empty string,"
      + " so a bag nobody filled cannot move the content hash");
    await put('input.field[data-f="k"]', NEW_KEYS);
    check(await onDraft(c => c.k === NEW_KEYS),
      "1f and typing it back puts it back, which is what leaves it there for the oracle below");

    const editedId = await page.evaluate(() =>
      (document.querySelector("#main tr.sel") || { getAttribute: () => "" }).getAttribute("data-id"));
    const noted = before.cards.find(c => c.id !== editedId && c.note && c.note.en);
    await press('#main tr[data-act="pick"][data-id="' + noted.id + '"]');
    await settleOn(page, 'Array.from(document.querySelectorAll("textarea.ta[data-f=\\"note\\"]")).some(t => t.value === ' + JSON.stringify(noted.note.en) + ')', { bound: 30000 });
    const shownNote = await page.evaluate(() => Array.from(
      document.querySelectorAll('textarea.ta[data-f="note"]')).map(t => t.getAttribute("data-l") + "=" + t.value));
    check(shownNote.join("|") === "en=" + noted.note.en + "|pl=",
      "1g a card's imported note is on the screen, one field per language shown: "
      + JSON.stringify(shownNote).slice(0, 120));
    await press('#main tr[data-act="pick"][data-id="' + editedId + '"]');
    await put('textarea.ta[data-f="note"][data-l="en"]', NEW_NOTE_EN);
    await put('textarea.ta[data-f="note"][data-l="pl"]', NEW_NOTE_PL);
    check(await onDraft(c => c.note && c.note.en === NEW_NOTE_EN && c.note.pl === NEW_NOTE_PL),
      "1h the note typed in both languages reaches the file");
    await put('textarea.ta[data-f="note"][data-l="pl"]', " ");
    check(await onDraft(c => c.note && c.note.en === NEW_NOTE_EN && !("pl" in c.note)),
      "1i and a note emptied in one language comes off in that language alone");
    await put('textarea.ta[data-f="note"][data-l="pl"]', NEW_NOTE_PL);
    check(await onDraft(c => c.note && c.note.pl === NEW_NOTE_PL),
      "1j and typing it back puts it back, for the oracle below");
    await studio.shut();

    /* ---- the oracle -------------------------------------------------------------------- */

    const { loadCatalog } = Engine.lint();
    let read = null, refusal = null;
    try { read = loadCatalog(draftAt); } catch (e) { refusal = e; }
    check(!!read && !refusal, "2a the pinned engine's own loadCatalog reads the saved draft"
      + (refusal ? ": " + refusal.message : ""));

    const after = JSON.parse(fs.readFileSync(draftAt, "utf8"));
    const edited = after.cards.find(c => c.title.en === NEW_TITLE_EN);
    check(!!edited, "2b the card the screen was on carries the typed English title");
    check(edited && edited.title.pl === NEW_TITLE_PL && edited.body.en === NEW_BODY_EN
      && edited.body.pl === NEW_BODY_PL,
      "2c and both bodies and the Polish title, newlines included, exactly as typed");
    check(edited && edited.shelf === shelf,
      "2d and the category the select was moved to (" + shelf + ")");

    const wasFirst = before.cards.find(c => c.id === (edited || {}).id) || {};
    check(JSON.stringify((edited || {}).requests || []) !== JSON.stringify(wasFirst.requests || []),
      "2e and the intent toggled: " + JSON.stringify(wasFirst.requests || [])
      + " became " + JSON.stringify((edited || {}).requests || []));
    check(edited && edited.k === NEW_KEYS,
      "2f and the keyword bag, read back through the pinned engine's own loadCatalog: "
      + JSON.stringify((edited || {}).k));
    const deskCard = read && (read.macros || read.cards || []).find(m => m.t === NEW_TITLE_EN);
    check(!!deskCard && deskCard.note === NEW_NOTE_EN && deskCard.notePl === NEW_NOTE_PL,
      "2g and the note in both languages, as the pinned reader hands it to the desk: "
      + JSON.stringify(deskCard ? [deskCard.note, deskCard.notePl] : "no card"));

    /* ---- the hash, by the engine's own rule ----------------------------------------------- */

    const F = await Engine.format();
    const copy = Object.assign({}, after); delete copy.hash; delete copy.sig;
    check(after.hash === F.contentHash(copy),
      "3a the file's hash is the engine's own contentHash over the engine's own canonical form"
      + " of what the file holds (" + after.hash + ")");
    check(after.hash !== before.hash,
      "3b and it moved with the edit, so a desk cannot take the old file for the new one");

    /* ---- what must NOT have changed --------------------------------------------------------- */

    const strip = (cat) => {
      const c = JSON.parse(JSON.stringify(cat));
      delete c.hash;
      c.cards = c.cards.filter(x => x.id !== (edited || {}).id);
      return c;
    };
    check(JSON.stringify(strip(after)) === JSON.stringify(strip(before)),
      "4a every other card, every tag and every header field came out exactly as it went in ("
      + (before.cards.length - 1) + " untouched card(s))");
    check(after.cards.length === before.cards.length
      && after.cards.map(c => c.id).join(",") === before.cards.map(c => c.id).join(","),
      "4b the cards are in the order they were in, and none was added or lost ("
      + after.cards.length + ")");

    const lintBefore = lintOf(Object.assign({}, before, { hash: undefined }));
    const lintAfter = lintOf(Object.assign({}, after, { hash: undefined }));
    check(lintAfter.errors.length === lintBefore.errors.length,
      "4c the pinned lint finds no error it did not find before the edit ("
      + lintBefore.errors.length + " then, " + lintAfter.errors.length + " now)");

    const notEdited = after.cards.filter(c => c.id !== (edited || {}).id);
    check(notEdited.every(c => !c.edited),
      "4d no card but the edited one was stamped as edited");
  } finally {
    await studio.shut();
  }

  if (!keep) dropScratch(SCRATCH, "edit-save");
  process.stdout.write("edit-save  " + asserted + " assertion(s), " + failed + " failure(s)\n");
  process.exit(failed ? 1 : 0);
}

main(process.argv.slice(2)).catch(e => {
  process.stderr.write("edit-save  " + (e && e.stack ? e.stack : String(e)) + "\n");
  process.exit(2);
});
