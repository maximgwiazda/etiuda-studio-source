/* A PASTE ON THE SCREEN IS THE COMMAND LINE'S --paste. Rule 17: the paste event, the press,
 * the shell, the proposals, and the file on disk.
 *
 *     node tests/paste-screen.mjs [--keep]
 *
 * THIS LEG OPENS A WINDOW. The build run that wrote it does not run it. The lead engineer does.
 * It sets no STUDIO_TEST_FILE and does not press Choose a file: a native dialog would hang.
 * The paste is one plain text with no blank line, so two cards exist only because the HTML
 * headings were read. The same text is given to `node tools/import.mjs --paste`, with the same
 * --map the screen's language choice sends. A second paste, one block and no heading, is the
 * one-block notice. This file is not run by the build run that wrote it.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { importCsv } from "../src/import.mjs";
import { json, PROJECT_FILE, DRAFT_FILE } from "../src/publish.mjs";
import { INBOX } from "../src/studio.mjs";
import { openStudio } from "./shell-door.mjs";
import { clearScratch, dropScratch } from "./scratch.mjs";
import { pressWhen, settleOn } from "./press.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const SCRATCH = path.join(ROOT, "scratch", "paste-screen");

const TITLE_A = "How to reset a password";
const BODY_A = "Open the account page and choose Reset. The link is for you and it arrives by email.";
const TITLE_B = "Where an order is";
const BODY_B = "An order is on the Orders page once payment has cleared and you can see it from there.";
const PLAIN = TITLE_A + "\n" + BODY_A + "\n" + TITLE_B + "\n" + BODY_B;
const HTML = "<h1>" + TITLE_A + "</h1><p>" + BODY_A + "</p><h2>" + TITLE_B + "</h2><p>" + BODY_B + "</p>";

let asserted = 0, failed = 0;
function check(cond, line) {
  asserted++;
  if (cond) process.stdout.write("  ok   " + line + "\n");
  else { failed++; process.stderr.write("  FAIL " + line + "\n"); }
}
const sha = (p) => crypto.createHash("sha256").update(fs.readFileSync(p)).digest("hex");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function plant(root) {
  const dir = path.join(root, "desk");
  fs.mkdirSync(dir, { recursive: true });
  const csv = path.join(SCRATCH, "desk.csv");
  fs.writeFileSync(csv,
    "Title,Text\r\n"
    + "How the desk opens,\"The desk opens on the cards, and you can search from there.\"\r\n"
    + "How a card is saved,\"A card is saved when you leave the field, and the draft keeps it.\"\r\n",
    "utf8");
  const made = await importCsv({ file: csv, id: "desk-catalog" });
  fs.writeFileSync(path.join(dir, DRAFT_FILE), json(made.catalog), "utf8");
  fs.writeFileSync(path.join(dir, PROJECT_FILE),
    json({ id: made.catalog.id, rev: 0, edition: "", draft: DRAFT_FILE, folder: null }), "utf8");
  return dir;
}

function runPaste(outDir, id, lang) {
  const plainAt = path.join(SCRATCH, "plain.txt");
  const htmlAt = path.join(SCRATCH, "page.html");
  fs.writeFileSync(plainAt, PLAIN, "utf8");
  fs.writeFileSync(htmlAt, HTML, "utf8");
  const code = lang || "en";
  const args = ["tools/import.mjs", "--paste", outDir, "--plain", plainAt, "--html", htmlAt,
    "--map", "Title=title." + code, "--map", "Text=body." + code];
  if (id) args.push("--id", id);
  return spawnSync(process.execPath, args, { cwd: ROOT, encoding: "utf8" });
}

/** The paste event, on the door's area, carrying both clipboard types. */
async function pasteBoth(page) {
  return page.evaluate((plain, html) => {
    const box = document.querySelector("#wizPaste");
    if (!box) return { value: "", delivered: false };
    box.focus();
    const dt = new DataTransfer();
    dt.setData("text/plain", plain);
    dt.setData("text/html", html);
    const ev = new ClipboardEvent("paste", { bubbles: true, cancelable: true, clipboardData: dt });
    const delivered = !!(ev.clipboardData && ev.clipboardData.getData("text/html") === html
      && ev.clipboardData.getData("text/plain") === plain);
    box.dispatchEvent(ev);
    return { value: box.value, delivered };
  }, PLAIN, HTML);
}

async function main(argv) {
  const keep = argv.indexOf("--keep") >= 0;
  clearScratch(SCRATCH);
  fs.mkdirSync(SCRATCH, { recursive: true });
  const projects = path.join(SCRATCH, "projects");
  const home = await plant(projects);
  const studio = await openStudio("tests/paste-screen.mjs", {
    words: true, projects, userDataDir: path.join(SCRATCH, "ud"),
  });
  const page = studio.page;
  const press = async (sel, ms) => {
    await pressWhen(page, sel, { who: "tests/paste-screen.mjs" });
    await sleep(ms || 400);
  };
  try {
    await pressWhen(page, '[data-act="open"]', { who: "tests/paste-screen.mjs", attr: ["data-dir", home] });
    await sleep(700);
    await press('[data-act="import"]', 400);
    const door = await settleOn(page, 'window.STUDIO_READY && window.STUDIO_READY.screen === "import0" && document.querySelector("#wizPaste")');
    const doorText = await page.evaluate(() => document.body.innerText || "");
    const waiting = await page.evaluate(() => {
      const go = document.querySelector('[data-act="wiz-paste-go"]');
      return !!(go && go.disabled);
    });
    check(door.met && doorText.indexOf("Paste text") >= 0 && doorText.indexOf("Choose a file") >= 0
      && doorText.indexOf("Split into cards") >= 0 && doorText.indexOf("Replies to bring in") >= 0
      && doorText.indexOf("in text with no headings") >= 0
      && doorText.indexOf("Split into cards opens once text is pasted above.") >= 0
      && waiting,
      "1 the Import row opens the paste door, and the press waits: " + JSON.stringify(doorText.slice(0, 80)));

    const first = await pasteBoth(page);
    const armed = await page.evaluate(() => {
      const go = document.querySelector('[data-act="wiz-paste-go"]');
      return !!(go && go.disabled);
    });
    check(first.delivered && first.value === PLAIN && armed === false,
      "1 the paste event lands the plain text, the event carried the HTML, and the press opens: "
      + JSON.stringify({ delivered: first.delivered, value: (first.value || "").slice(0, 40), waiting: armed }));
    await press('[data-act="wiz-paste-go"]', 400);
    const split = await settleOn(page,
      'window.STUDIO_READY && window.STUDIO_READY.screen === "import0" && !document.querySelector("#wizPaste")'
      + ' && ((document.body.innerText || "").indexOf("Replies found:") >= 0)');
    const mid = await page.evaluate(() => ({
      text: document.body.innerText || "",
      lang: (document.querySelector("#wizPasteLang") || {}).value || "",
      opts: Array.from(document.querySelectorAll("#wizPasteLang option")).map((o) => o.value),
    }));
    check(split.met && mid.text.indexOf("Replies found: 2") >= 0
      && mid.text.indexOf("Which language are these replies in?") >= 0
      && mid.text.indexOf("Next: where it lands") >= 0
      && mid.text.indexOf("Studio found one reply only") < 0
      && mid.opts.indexOf("en") >= 0 && mid.opts.indexOf("pl") >= 0 && mid.lang === "en",
      "1 the split counts two, asks the language, and does not show the one-block notice: "
      + JSON.stringify({ lang: mid.lang, opts: mid.opts }));
    const lang = mid.lang || "en";
    await press('[data-act="wiz-paste-next"]', 500);
    const read = await settleOn(page, 'window.STUDIO_READY && window.STUDIO_READY.screen === "import1"');
    const h1 = await page.evaluate(() => (document.querySelector("#main h1") || {}).textContent || "");
    check(read.met && h1 === "What is in this file",
      "1 Next goes on to the file's first cover (h1=" + JSON.stringify(h1) + ")");

    await press('[data-act="wiz-land"][data-v="one"]', 400);
    /* THE SOURCE IS THE PROPOSAL'S FACTS. Go through them opens the stack (board 1016 item 7), which
       draws no facts pane. Open the landed file from the queue, as review-screen reads its facts. */
    await press('[data-act="section"][data-v="proposals"]', 400);
    await press('[data-act="rv-open"][data-file*="pasted.ec"]', 400);
    const opened = await settleOn(page, 'document.querySelector("#main .facts .kv")');
    const facts = await page.evaluate(() => Array.from(document.querySelectorAll("#main .facts .kv"))
      .map((row) => row.querySelector(".k").textContent + ": " + row.querySelector(".v").textContent));
    check(opened.met && facts.some((f) => /^Where it came from: imported from pasted text$/.test(f)),
      "1 into this project the queue says imported from pasted text: " + JSON.stringify(facts));

    const proposal = path.join(home, INBOX, "pasted.ec");
    const landed = fs.existsSync(proposal) ? JSON.parse(fs.readFileSync(proposal, "utf8")) : null;
    const titleOf = (card) => card && card.title ? card.title[lang] : "";
    check(!!landed && landed.cards.length === 2 && titleOf(landed.cards[0]) === TITLE_A
      && titleOf(landed.cards[1]) === TITLE_B,
      "1 the inbox holds two cards, split on the headings, in " + lang + ": "
      + (landed ? landed.cards.length : "absent"));
    const cliInto = runPaste(path.join(SCRATCH, "cli-into"), null, lang);
    const cliDraft = path.join(SCRATCH, "cli-into", "pasted.draft.json");
    check(cliInto.status === 0 && fs.existsSync(proposal) && fs.existsSync(cliDraft)
      && sha(proposal) === sha(cliDraft),
      "1 the inbox file matches --paste --map for " + lang + " (" + (cliInto.status) + ")");
    const cliLint = path.join(SCRATCH, "cli-into", "pasted.lint.json");
    const screenLint = path.join(home, INBOX, "pasted.lint.json");
    check(fs.existsSync(screenLint) && fs.existsSync(cliLint) && sha(screenLint) === sha(cliLint),
      "1 and the report beside it matches too");

    await press('[data-act="import"]', 400);
    await settleOn(page, 'document.querySelector("#wizPaste")');
    const only = "Only one reply\nIt stays one card.";
    const one = await page.evaluate((plain) => {
      const box = document.querySelector("#wizPaste");
      if (!box) return { value: "" };
      box.focus();
      const dt = new DataTransfer();
      dt.setData("text/plain", plain);
      dt.setData("text/html", "");
      box.dispatchEvent(new ClipboardEvent("paste", { bubbles: true, cancelable: true, clipboardData: dt }));
      return { value: box.value };
    }, only);
    check(one.value === only, "1b a paste with nothing to split on lands in the area");
    await press('[data-act="wiz-paste-go"]', 400);
    await settleOn(page, '(document.body.innerText || "").indexOf("Replies found: 1") >= 0', { bound: 30000 });
    const told = await page.evaluate(() => document.body.innerText || "");
    check(told.indexOf("Replies found: 1") >= 0
      && told.indexOf("Studio found one reply only") >= 0
      && told.indexOf("Which language are these replies in?") >= 0,
      "1b one block says the count, the notice and the language question");
    await press('[data-act="wiz-cancel"]', 300);

    await press('[data-act="import"]', 400);
    await settleOn(page, 'document.querySelector("#wizPaste")');
    const second = await pasteBoth(page);
    check(second.delivered && second.value === PLAIN, "2 the same paste lands a second time");
    await press('[data-act="wiz-paste-go"]', 400);
    await settleOn(page, '!!document.querySelector("#wizPasteLang")', { bound: 30000 });
    const again = await page.evaluate(() => (document.querySelector("#wizPasteLang") || {}).value || "");
    await press('[data-act="wiz-paste-next"]', 500);
    await settleOn(page, 'window.STUDIO_READY && window.STUDIO_READY.screen === "import1"');
    await press('[data-act="wiz-into"][data-v="new"]', 500);
    await press('[data-act="wiz-next"]', 800);
    await press('[data-act="wiz-land"]', 400);
    const made = await settleOn(page, 'window.STUDIO_READY && window.STUDIO_READY.screen === "import3"');
    check(made.met, "2 a new project lands on the third cover");

    const dirs = fs.readdirSync(projects).map((n) => path.join(projects, n))
      .filter((d) => fs.existsSync(path.join(d, PROJECT_FILE)));
    const fresh = dirs.map((d) => ({ d, id: JSON.parse(fs.readFileSync(path.join(d, PROJECT_FILE), "utf8")).id }))
      .filter((x) => x.id !== "desk-catalog");
    check(fresh.length === 1, "2 one new project folder: " + fresh.length);
    const id = fresh.length ? fresh[0].id : "";
    const screenDraft = fresh.length ? path.join(fresh[0].d, path.basename(fresh[0].d) + ".draft.json") : "";
    const cliNew = runPaste(path.join(SCRATCH, "cli-new"), id, again || lang);
    const newDraft = path.join(SCRATCH, "cli-new", id + ".draft.json");
    check(cliNew.status === 0 && !!id && fs.existsSync(screenDraft) && fs.existsSync(newDraft)
      && sha(screenDraft) === sha(newDraft),
      "2 the new project's draft matches --paste --id " + id + " (" + cliNew.status + ")");
  } finally { await studio.shut(); }

  if (!keep) dropScratch(SCRATCH, "paste-screen");
  process.stdout.write("paste-screen  " + asserted + " assertion(s), " + failed + " failure(s)\n");
  process.exit(failed ? 1 : 0);
}

main(process.argv.slice(2)).catch((e) => {
  process.stderr.write("paste-screen  " + (e && e.stack ? e.stack : String(e)) + "\n");
  process.exit(2);
});
