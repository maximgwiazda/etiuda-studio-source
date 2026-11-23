/* THE AUDIT PACK ON THE SCREEN, AGAINST THE AUDIT PACK AT THE COMMAND LINE. Board 606 and 607.
 *
 *     node tests/audit-screen.mjs [--keep]
 *
 * THE CLAIM IS THAT THE PAGE SHOWS WHAT `node tools/audit.mjs` PRINTS, so the measurement is both
 * of them: one project is published twice with one card typed in the authoring program and one
 * changed by an accepted proposal, and the rows the table paints are held against the lines the
 * command line writes to its own stdout - not against src/audit.mjs, which both of them call and
 * which would therefore agree with either.
 *
 * THE CONTROL IS ON THE SCREEN'S OWN WORDS. Two cards changed in this edition, one by a decision
 * and one by the owner's typing, so a page that painted one word for every changed card fails;
 * and the account beside the accepted one is the operating system's own, which a page that read
 * the catalog rather than the archive could not know at all.
 *
 * THE STATEMENT ABOUT THE NAMES IS MEASURED WHERE IT SITS. Claudia's five shapes all put it above
 * the first row of data, and her measurement of that is `aboveFold`; a reader who meets a column
 * of names before the sentence saying what a name is worth has already been misled. It is read
 * here in page coordinates rather than by counting elements.
 *
 * AND THE ARCHIVE MUST NOT MOVE. Every edition's catalog is fingerprinted before the window opens
 * and again after it shuts, because the pack is only evidence while the thing it describes is
 * immutable, and "reads only" is a property of the folder rather than of code that means well.
 */
import "./licensed-env.mjs";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { openStudio } from "./shell-door.mjs";
import * as Engine from "../src/engine.mjs";
import { importCsv } from "../src/import.mjs";
import { publishFull, editionsIn, PROJECT_FILE, DRAFT_FILE, ARCHIVE,
         CATALOG_IN_ARCHIVE } from "../src/publish.mjs";
import { saveCard } from "../src/studio.mjs";
import { makeKeyFile } from "../src/sign.mjs";
import { verifyPack, LIMITS, README_IN_PACK } from "../src/audit.mjs";
import { clearScratch, dropScratch } from "./scratch.mjs";
import { pressWhen, settleOn } from "./press.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const SCRATCH = path.join(ROOT, "scratch", "audit-screen");
const ID = "audit-screen-pile";
const CLOCK = "2026-09-20T09:00:00";
const WHO = "the agent at desk 4";
const PASS = "a passphrase this gate invents";
const TAIL = "\nGrelira thelork ustuma widesk.";

let asserted = 0, failed = 0;
function check(cond, line) {
  asserted++;
  if (cond) process.stdout.write("  ok   " + line + "\n");
  else { failed++; process.stderr.write("  FAIL " + line + "\n"); }
}
const sleep = ms => new Promise(r => setTimeout(r, ms));
const sha = p => crypto.createHash("sha256").update(fs.readFileSync(p)).digest("hex").slice(0, 16);
const readJson = p => JSON.parse(fs.readFileSync(p, "utf8").replace(/^﻿/, ""));
const cardOf = (cat, id) => (cat.cards || []).find(c => c.id === id);
const flat = v => String(v == null ? "" : v).replace(/\s+/g, " ").trim();

/* COUNTS:PREDICATES
   Members that must be there, in order where the order is the claim.
   One more member still passes. A missing member is named. A floor stays
   where a scanner that saw nothing would otherwise pass. */
function limitsHeld(painted, required) {
  const have = (painted || []).map(s => String(s));
  const need = (required || []).map(s => String(s));
  const missing = need.filter(name => have.indexOf(name) < 0);
  if (have.length < need.length) missing.push("limits under " + need.length);
  if (need.length < 3) missing.push("limits to look for under 3");
  return { ok: missing.length === 0, missing };
}
/* COUNTS:END */

async function main(argv) {
  const keep = argv.indexOf("--keep") >= 0;
  clearScratch(SCRATCH);
  const projects = path.join(SCRATCH, "projects");
  const dir = path.join(projects, ID);
  fs.mkdirSync(dir, { recursive: true });
  const F = await Engine.format();
  const ACCOUNT = String(os.userInfo().username);

  const keyAt = path.join(SCRATCH, "signing-key.json");
  fs.writeFileSync(keyAt, JSON.stringify(await makeKeyFile({ passphrase: PASS }), null, 1) + "\n",
    "utf8");
  const KEY = { key: keyAt, passphrase: PASS };

  const gen = spawnSync(process.execPath, ["tools/fixtures/generate.mjs", "--seed", "77",
    "--rows", "10", "--out", path.join(SCRATCH, "pile")], { cwd: ROOT, encoding: "utf8" });
  if (gen.status !== 0) throw new Error("the generator refused: " + (gen.stderr || gen.stdout));
  const made = await importCsv({ file: path.join(SCRATCH, "pile", "macros.csv"),
                                 id: ID, name: ID });
  fs.writeFileSync(path.join(dir, DRAFT_FILE), JSON.stringify(made.catalog, null, 1) + "\n");
  fs.writeFileSync(path.join(dir, PROJECT_FILE), JSON.stringify(
    { id: ID, name: ID, rev: 0, edition: "" }, null, 1) + "\n");

  const first = await publishFull(Object.assign({ project: dir, notes: "The first one.",
    now: CLOCK }, KEY));
  const published = readJson(first.ec);
  const ids = published.cards.map(c => c.id);
  const TYPED = ids[2], DECIDED = ids[5];

  /* One card typed in the authoring program, and one changed by a proposal somebody accepted.
     THE PROPOSAL IS BUILT FROM THE DRAFT AS IT STANDS, not from the published edition: the queue
     compares an arriving file with the WORKING COPY, so a proposal made from the edition before
     the typing would also propose undoing the typing, and this gate would then be measuring two
     changes on one card it never meant to make. */
  await saveCard(dir, TYPED,
    { body: { en: cardOf(readJson(path.join(dir, DRAFT_FILE)), TYPED).body.en + TAIL } });
  const proposal = JSON.parse(JSON.stringify(readJson(path.join(dir, DRAFT_FILE))));
  proposal.rev = published.rev; proposal.date = published.date;
  cardOf(proposal, DECIDED).body.en += TAIL;
  proposal.modified = true;
  delete proposal.hash; delete proposal.sig;
  proposal.hash = F.contentHash(proposal);
  const proposalAt = path.join(SCRATCH, "from-desk-4.ec");
  fs.writeFileSync(proposalAt, JSON.stringify(proposal, null, 1) + "\n", "utf8");
  const decided = spawnSync(process.execPath, ["tools/review.mjs", dir, proposalAt,
    "--from", WHO, "--accept", "card:" + DECIDED + ":body.en"], { cwd: ROOT, encoding: "utf8" });
  if (decided.status !== 0) throw new Error("the queue refused: " + decided.stderr);
  const second = await publishFull(Object.assign({ project: dir, notes: "After the review.",
    now: CLOCK }, KEY));

  const eds = editionsIn(dir);
  check(eds.length === 2 && eds[1] === second.edition,
    "0a two editions in the archive, " + eds.join(" then ") + ", the second holding one card"
    + " typed here and one accepted from a proposal");
  const before = eds.map(e => sha(path.join(dir, ARCHIVE, e, CATALOG_IN_ARCHIVE)));

  /* ---- the window ----------------------------------------------------------------------------- */

  /* The folder a person would pick, with something of their own already in it: the pack goes
     into a folder of its own inside it and leaves the rest alone. */
  const packAt = path.join(SCRATCH, "pack");
  fs.mkdirSync(packAt, { recursive: true });
  fs.writeFileSync(path.join(packAt, "somebody-elses-notes.txt"), "not ours\n", "utf8");
  const studio = await openStudio("tests/audit-screen.mjs", {
    projects, userDataDir: path.join(SCRATCH, "ud"),
    env: { STUDIO_TEST_PACK: packAt, STUDIO_SIGNING_KEY: keyAt },
  });

  let shown = null, written = "", picked = null;
  try {
    const page = studio.page;
    const press = async (sel, ms) => {
      await pressWhen(page, sel, { who: "tests/audit-screen.mjs" });
      await sleep(ms || 400);
    };
    const state = async (js) => JSON.parse(await page.evaluate("JSON.stringify(" + js + ")"));

    await press('[data-act="open"][data-dir="' + dir.replace(/\\/g, "\\\\") + '"]', 900);
    /* EACH READ WAITS FOR THE SCREEN IT READS (board 801): the audit section and an edition's
       pick both ask the disk and paint when the answer comes, so the fact is the screen painted
       with that answer, not a time. A screen that never gets there is read anyway and fails in
       the legs below, in their own words. */
    await press('[data-act="section"][data-v="archive"]', 1);
    await settleOn(page, '(window.STUDIO_READY || {}).screen === "archive"');
    await press('[data-act="arch-audit"]', 1);
    await settleOn(page, `(window.STUDIO_READY || {}).screen === "audit"
      && document.querySelectorAll('#main [data-act="audit-pick"]').length > 0`);

    shown = await state(`(function () {
      const rows = Array.from(document.querySelectorAll("#main table tr"))
        .filter(tr => tr.querySelector("td"))
        .map(tr => Array.from(tr.querySelectorAll("td")).map(td => td.textContent));
      const tiles = Array.from(document.querySelectorAll("#main [data-tile]"))
        .map(kv => [kv.getAttribute("data-tile")]
          .concat(Array.from(kv.children).map(c => c.textContent)));
      const panes = Array.from(document.querySelectorAll("#main .pane > h3"))
        .map(h => h.textContent);
      const say = document.querySelector("#main .pane .lede");
      const firstCell = document.querySelector("#main table td");
      const box = (e) => { const r = e.getBoundingClientRect();
        return { top: r.top + window.scrollY, bottom: r.bottom + window.scrollY }; };
      return {
        rows: rows, tiles: tiles, panes: panes,
        say: say ? say.textContent : "",
        sayBox: say ? box(say) : null,
        firstCellBox: firstCell ? box(firstCell) : null,
        seg: Array.from(document.querySelectorAll('[data-act="audit-pick"]'))
          .map(e => e.textContent + (e.className.indexOf("on") >= 0 ? "*" : "")),
        limits: Array.from(document.querySelectorAll("#main [data-limit]"))
          .map(e => e.textContent),
      };
    })()`);

    await press('[data-act="audit-export"]', 1);
    /* The pack names a chip (board 976, item 11). The eye reads the last two steps; the whole
       path, which this holds to the file on disk, is the chip's data-path. */
    await settleOn(page, `((document.querySelector("#main .pad > .lede:last-of-type [data-ctx=path]")
      || {}).getAttribute("data-path") || "") !== ""`);
    written = await state(`(document.querySelector("#main .pad > .lede:last-of-type [data-ctx=path]")
      || {}).getAttribute("data-path") || ""`);

    /* The earlier edition picked, which is the one act on this screen that asks the disk again. */
    await press('[data-act="audit-pick"][data-e="' + eds[0] + '"]', 1);
    await settleOn(page, `!!document.querySelector('#main [data-act="audit-pick"].on[data-e="`
      + eds[0] + `"]') && document.querySelectorAll("#main table tr td").length > 0`);
    picked = await state(`Array.from(document.querySelectorAll("#main table tr"))
      .filter(tr => tr.querySelector("td"))
      .map(tr => Array.from(tr.querySelectorAll("td")).map(td => td.textContent))`);
  } finally {
    await studio.shut();
  }
  await sleep(400);

  /* ---- the same edition at the command line ---------------------------------------------------- */

  const r = spawnSync(process.execPath, ["tools/audit.mjs", dir, "--edition", second.edition,
    "--key", keyAt], { cwd: ROOT, encoding: "utf8" });
  const out = String(r.stdout || "").split("\n");
  /* Its framing lines begin "audit  " at column 0 and every card line is indented by two, which
     is how this reads the body out without knowing what is in it. */
  const cli = out.filter(l => /^ {2}\S/.test(l)).map(l => flat(l));
  check(r.status === 0 && cli.length === 10,
    "1a node tools/audit.mjs printed " + cli.length + " card line(s) and exited " + r.status);

  /* The command line writes a hyphen where there is no account and the screen leaves the
     cell empty, which is the diff renderer's rule; the hyphen is put back here so that the
     two are compared on what they say rather than on how each says nothing. */
  const screenRows = (shown.rows || []).map(c => flat(c[0] + " " + c[2] + " "
    + (flat(c[3]) === "" ? "-" : c[3]) + " " + c[4]));
  /* THE ONE PLACE THE TWO DOORS SAY THE SAME THING DIFFERENTLY, ON PURPOSE: a spreadsheet
     and a command line cannot show the who-decided column and the row at once, so
     howWord() appends how an unchanged card got into the edition it has stood since, while
     the screen shows that in its own column instead. Both sides are collapsed to the clause
     they share before being compared, and nothing else about either line is touched. */
  const sameSince = (l) => flat(String(l)
    .replace(/unchanged since (rev \d+ \([^\s,)]+\)|[^\s,]+)(, \w+ there)?/, "unchanged since")
    .replace(/unchanged since-/, "unchanged since -"));
  const want = cli.map(sameSince);
  const screenWant = screenRows.map(sameSince);
  const off = screenWant.findIndex((l, i) => l !== want[i]);
  check(screenRows.length === cli.length && off < 0,
    "1b and the table's rows are those same lines, in that order (" + screenRows.length
    + " row(s) against " + cli.length + ")"
    + (off < 0 ? "" : "\n       screen: " + JSON.stringify(screenWant[off])
      + "\n       cli:    " + JSON.stringify(want[off])));

  /* ---- 2. THE DISTINCTION, ON THE SCREEN ------------------------------------------------------- */

  const rowFor = id => (shown.rows || []).find(c => flat(c[0]) === id) || [];
  const typed = rowFor(TYPED), dec = rowFor(DECIDED);
  check(flat(typed[2]) === "written here" && flat(typed[3]) === "",
    "2a the card typed in the authoring program reads " + JSON.stringify(flat(typed[2]))
    + " and the column that says who decided is empty rather than filled with a word");
  check(flat(dec[2]) === "accepted" && flat(dec[3]) === ACCOUNT && /^\d{4}-/.test(flat(dec[4])),
    "2b THE CONTROL: the card changed by an accepted proposal reads " + JSON.stringify(flat(dec[2]))
    + " by " + JSON.stringify(flat(dec[3])) + " at " + JSON.stringify(flat(dec[4]))
    + ", so 2a is a leg on the word rather than on the table having a third column");
  const tiles = (shown.tiles || []).map(t => flat(t[0]) + " " + flat(t[1]) + " " + flat(t[2]));
  check(tiles.length === 5 && tiles[0] === "cards 10 Cards in this edition"
        && tiles[1] === "accepted 1 Accepted from a proposal"
        && tiles[2] === "written 1 Written here by the owner"
        && tiles[3] === "unchanged 8 Unchanged since an earlier edition"
        && tiles[4] === "unaccounted 0 Unaccounted for",
    "2c and the five counts above the table say the same: " + JSON.stringify(tiles));

  /* ---- 3. THE STATEMENT, WHERE CLAUDIA MEASURED IT --------------------------------------------- */

  check(/not verified/.test(shown.say) && shown.sayBox && shown.firstCellBox
        && shown.sayBox.bottom <= shown.firstCellBox.top,
    "3a the statement about the names ends at y=" + (shown.sayBox || {}).bottom + " and the"
    + " first cell of data begins at y=" + (shown.firstCellBox || {}).top + ", so it is read"
    + " first, as it is in all five of Claudia's shapes");
  const limitsOn = limitsHeld((shown.limits || []).map(flat), LIMITS.map(flat));
  check(limitsOn.ok,
    "3b the limits src/audit.mjs writes are painted on the page, in its words"
    + (limitsOn.missing.length ? ", missing " + limitsOn.missing.map(s => JSON.stringify(s.slice(0, 70))).join(", ") : ""));

  /* ---- 4. THE EXPORT, WHICH IS THE FOLDER THAT LEAVES THE BUILDING ----------------------------- */

  const wantAt = path.join(packAt, "audit-" + ID + "-" + second.edition);
  check(flat(written) === wantAt && fs.existsSync(path.join(packAt, "somebody-elses-notes.txt")),
    "4a the press wrote the pack into a folder of its own inside the one the pick answered with,"
    + " leaving what was already there: " + JSON.stringify(path.basename(flat(written))));
  const v = await verifyPack(wantAt);
  check(v.ok && v.hash.ok && v.signature.state === "valid",
    "4b and a reader with that folder and nothing else recomputes its hash and verifies its"
    + " signature: " + JSON.stringify(v.hash.ok) + ", " + v.signature.state);
  check(fs.readFileSync(path.join(wantAt, v.catalog.name)).equals(
        fs.readFileSync(path.join(dir, ARCHIVE, second.edition, CATALOG_IN_ARCHIVE)))
        && fs.existsSync(path.join(wantAt, README_IN_PACK)),
    "4c the catalog in it is the archived file byte for byte, beside the README that indexes it");

  /* ---- 5. THE OTHER EDITION, AND THE ARCHIVE AFTERWARDS ---------------------------------------- */

  check((picked || []).length === 10
        && (picked || []).every(c => flat(c[2]) === "written here"),
    "5a picking the first edition reads the archive again and shows its own account: every one"
    + " of its " + (picked || []).length + " cards arrived with the import and none of them by"
    + " a decision");
  const after = eds.map(e => sha(path.join(dir, ARCHIVE, e, CATALOG_IN_ARCHIVE)));
  check(before.join(",") === after.join(","),
    "5b and nothing in the archive moved while all of that happened: " + after.join(", "));

  process.stdout.write("\naudit-screen  " + asserted + " assertion(s), " + failed + " failed\n");
  if (!keep) dropScratch(SCRATCH, "audit-screen");
  process.stdout.write("RESULT: " + (failed ? "FAIL" : "PASS") + "\n");
  process.exit(failed ? 1 : 0);
}

main(process.argv.slice(2)).catch(e => {
  process.stderr.write("audit-screen  " + (e && e.stack ? e.stack : String(e)) + "\n");
  process.exit(2);
});
