/* A PASTE'S WAY BACK, AND A PASTE LANDED IN WORDS (follows 5 and 7 of the paste triage): node tests/paste-back.mjs [--keep].
 *
 * The page runs on tests/page-stand-in.mjs over the real verbs of src/studio.mjs on a scratch root, as tests/triage.mjs
 * drives it; nothing opens a window. The paste file the shell writes is redirected under the scratch root, so nothing is
 * written outside the tree.
 *
 *   pb1  after Split into cards, Back returns to the paste box with the text still in it, and writes nothing
 *   pb2  Start over on a paste reopens the paste box with its text, and does not ask for a file
 *   pb3  Start over on a file is still the file picker
 *   pb4  Cancel on a paste says what it drops, on the box, after the split and on the first cover; on a file it says nothing
 *   pb5  in the stack, where a paste's rows are decided, its card names it in words and names no .csv or .ec file
 *   pb6  applied whole from the stack, the line where Decided was says the paste in words; an import into a project with no
 *        cards lands directly and its landing text says the same
 *   pb7  a second paste waits beside the first as its own file, and its row is the one in hand
 *   pb8  in Polish
 *
 * MOVED WITH BOARD 1016 ITEM 7 (the stack is the one way to decide; the walk and the table's Land are gone), old and then new:
 *   pb5b "one at a time, the landing text says pasted text" - "in the stack, a paste's card names it in words".
 *   pb6a "from the list, the landing text and the banner over it say pasted text" - "applied whole from the stack, the line
 *        where Decided was says pasted text".
 *   pb7a "... and is the one opened" - "... and its row is the one in hand".
 *   pb8b "in Polish the landing text says wklejonego tekstu" - "in Polish the stack's card says wklejonego tekstu".
 *   pb9  the paste screen's language list holds the project's declared languages beside built-in ones
 *
 * WHAT IT CANNOT SEE: the paste event and the box's own focus, which tests/paste-screen.mjs drives in a window.
 *
 * PROVED BY MAKING IT FAIL: PASTE_BACK_APP=<a copy of ui/app.js> reads that copy instead.
 *
 * Node only, no window, no Electron. Exit 0 when every check holds, 1 when any fails.
 */
import fs from "node:fs";
import crypto from "node:crypto";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { clearScratch, dropScratch } from "./scratch.mjs";
import { loadPage } from "./page-stand-in.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const SCRATCH = path.join(ROOT, "scratch", "paste-back");
const EXPECTED = 16;
const source = process.env.PASTE_BACK_APP ? fs.readFileSync(path.resolve(process.env.PASTE_BACK_APP), "utf8") : undefined;

let asserted = 0, failed = 0;
function check(cond, line) {
  asserted++;
  if (cond) process.stdout.write("  ok   " + line + "\n");
  else { failed++; process.stdout.write("  FAIL " + line + "\n"); }
}
const wire = (p) => Promise.resolve(p)
  .then(v => JSON.parse(JSON.stringify(Object.assign({ error: null }, v))))
  .catch(e => ({ error: e && e.message ? e.message : String(e), said: (e && e.said) || null, disk: !!(e && e.disk) }));
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const el = (attrs) => ({ getAttribute: (k) => (attrs[k] == null ? null : attrs[k]), closest: () => null });
const NB = String.fromCharCode(160);
const plain = (s) => String(s == null ? "" : s).split(NB).join(" ");
const textOf = (html) => plain(String(html || "").replace(/<[^>]*>/g, ""));
const treeSig = (dir) => {
  const out = [];
  const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).sort((x, y) => x.name.localeCompare(y.name)).forEach((e) => {
    const at = path.join(d, e.name);
    if (e.isDirectory()) walk(at);
    else out.push(path.relative(dir, at) + ":" + crypto.createHash("sha256").update(fs.readFileSync(at)).digest("hex"));
  });
  walk(dir);
  return out.join("\n");
};
const NAMES_A_FILE = /\.(csv|ec)\b/i;
const PASTED = /^Landed in the draft from pasted text: .+\.$/;
const IN_WORDS = "Imported from pasted text";

const TWO = "How to reset a password\nOpen the account page and choose Reset.\n\nWhere an order is\nAn order is on the Orders page once payment has cleared.";
const TWO_B = "Opening hours\nThe desk opens at nine.\n\nClosing time\nThe desk closes at five.";

async function main(argv) {
  /* os.tmpdir() is read at each call, and is where the shell writes the paste file: under the scratch root. */
  const tmp = path.join(SCRATCH, "tmp");
  clearScratch(SCRATCH);
  fs.mkdirSync(tmp, { recursive: true });
  process.env.TEMP = tmp; process.env.TMP = tmp; process.env.TMPDIR = tmp;
  const under = path.resolve(os.tmpdir()).toLowerCase().startsWith(path.resolve(SCRATCH).toLowerCase());
  if (!under) { process.stdout.write("paste-back  the temporary folder would be outside the tree: " + os.tmpdir() + "\n"); process.exit(2); }
  const S = await import("../src/studio.mjs");
  const root = path.join(SCRATCH, "projects");
  fs.mkdirSync(root, { recursive: true });
  const L = [{ code: "en" }, { code: "pl" }];
  const csv = path.join(SCRATCH, "rows.csv");
  fs.writeFileSync(csv, ["Title,Body EN,Body PL,Category", "Row 0,Text 0,Tekst 0,Delivery", "Row 1,Text 1,Tekst 1,Delivery"].join("\n") + "\n");
  const carded = async (dir) => S.addCard(dir, (await S.addTag(dir, "shelf", { en: "Delivery", pl: "Dostawa" })).tag.id, "Held card", "We open at nine.");

  let picks = 0;
  const pageOver = (uiLang) => {
    const api = {
      newProject: (n, l, o) => wire(S.newProject(root, n, l, o)),
      open: (d) => wire(S.openProject(d)),
      projects: () => wire(S.listProjects(root)),
      proposals: (d) => wire(S.listProposals(d)),
      proposalOpen: (d, f, l) => wire(S.openProposal(d, f, { lang: l })),
      proposalDecide: (d, f, dec, from, note) => wire(S.decideProposal(d, f, dec, from, note)),
      proposalRevert: (d, f, r) => wire(S.revertProposalMarks(d, f, r)),
      tabs: () => Promise.resolve({ error: null }),
      importPlan: (f, o, i) => wire(S.importPlan(root, f, o || {}, i || "")),
      importLand: (f, o, i, fingerprint) => wire(S.importLand(root, f, o || {}, i || "", fingerprint)),
      importPaste: (p, h) => wire(S.writePaste(p, h)),
      importPick: () => { picks++; return Promise.resolve({ error: null }); },
      importDropped: () => Promise.resolve({ error: null, file: csv }),
      cardHistory: (d, i) => wire(S.cardHistory(d, i)),
      discardUntouched: (d) => wire(S.discardUntouched(d)),
    };
    const home = loadPage({ api, uiLang, source });
    home.page.S.host = { tour: { offered: true }, langs: S.builtLangs() };
      /* The box and the language select are read from the state, as the stand-in has no value to give. */
    home.doc.absent = new Set(["#wizPaste", "#wizPasteLang"]);
    return { P: home.page, home };
  };

  const { P, home } = pageOver("en");
  const main = () => home.node("#main").innerHTML;
  const foot = () => home.node("#foot").innerHTML;
  const chrome = () => home.node("#chrome").innerHTML;
  const said = () => plain(home.node("#said").textContent);
  /* The button with this act in some markup, whole. */
  const buttonOf = (html, act) => { const m = new RegExp('<button[^>]*data-act="' + act + '"[^>]*>[\\s\\S]*?</button>').exec(html); return m ? m[0] : ""; };
  const actOfStartOver = () => { const m = /data-act="([^"]+)"[^>]*>[^<]*Start over<\/button>/.exec(chrome()); return m ? m[1] : ""; };

  const into = async (dir) => {
    await P.ACTS["to-projects"]();
    await P.ACTS.open(el({ "data-act": "open", "data-dir": dir }));
    await sleep(30);
    await P.ACTS.import(el({ "data-act": "import" }));
  };
  const split = async (text) => {
    P.S.wiz.pasteText = text; P.S.wiz.pastePlain = text; P.S.wiz.pasteHtml = "";
    await P.ACTS["wiz-paste-go"](el({ "data-act": "wiz-paste-go" }));
  };
  const next = async () => { await P.ACTS["wiz-paste-next"](el({ "data-act": "wiz-paste-next" })); await sleep(30); };
  const landed = async (door) => { await P.ACTS["wiz-land"](el({ "data-act": "wiz-land", "data-v": door || "" })); await sleep(30); };
  /* The stack's card in hand, and every card of one file answered yes and applied, through the closure's own names. */
  const handOf = (pg) => { const st = pg.S.stack, pile = pg.__get("stkPile"); return st && pile ? pile()[st.at] || null : null; };
  const applyAll = async (pg, file) => {
    const st = pg.S.stack, left = pg.__get("stkLeft")().filter((x) => x.file === file);
    left.forEach((x, i) => { st.answers[x.key] = pg.__get("stkRecord")(x, "yes", ++st.seq, ""); });
    await pg.__get("stkApply")();
    await sleep(30);
    return st;
  };

  const a = await S.newProject(root, "North shop", L);
  await carded(a.dir);

  /* ---- 1. BACK TO THE TEXT ---------------------------------------------------------------------------------------- */

  await into(a.dir);
  const doorHtml = main();
  check(P.S.wiz && P.S.wiz.pasteDoor && doorHtml.indexOf('id="wizPaste"') >= 0, "pb0 the Import row opens the paste box");
  const sig1 = treeSig(a.dir);
  await split(TWO);
  const readFoot = foot();
  check(P.S.wiz.pasteRead && /Replies found: 2/.test(textOf(main())) && /<button[^>]*data-act="wiz-paste-back"[^>]*>[\s\S]*Back<\/button>/.test(readFoot),
    "pb1a after Split into cards the foot offers Back beside Cancel and Next");
  const backAct = P.ACTS["wiz-paste-back"];
  if (backAct) await backAct(el({ "data-act": "wiz-paste-back" }));
  check(!!backAct && P.S.wiz && P.S.wiz.pasteDoor && !P.S.wiz.pasteRead && !P.S.wiz.plan && P.S.wiz.pasteText === TWO
        && main().indexOf('id="wizPaste"') >= 0 && main().indexOf("How to reset a password") >= 0 && treeSig(a.dir) === sig1,
    "pb1b Back returns to the paste box with the text still in it, and nothing is written");
  await split(TWO);
  await next();

  /* ---- 2. START OVER ON A PASTE ------------------------------------------------------------------------------------ */

  const over = actOfStartOver();
  const pickedBefore = picks;
  if (over && P.ACTS[over]) await P.ACTS[over](el({ "data-act": over }));
  check(P.S.wiz && P.S.wiz.pasteDoor && !P.S.wiz.plan && !P.S.wiz.pasteRead && P.S.wiz.pasteText === TWO
        && main().indexOf('id="wizPaste"') >= 0 && picks === pickedBefore,
    "pb2a Start over on a paste reopens the paste box with its text, and asks for no file (its act: " + JSON.stringify(over) + ")");
  await split(TWO);
  await next();
  check(P.S.wiz.plan && /Where it lands|Languages|What is in this file/.test(textOf(main())) && P.S.wiz.pasteKept !== undefined,
    "pb2b the box can be split and gone on from again after Start over");

  /* ---- 3. START OVER ON A FILE ------------------------------------------------------------------------------------- */

  await P.ACTS["wiz-cancel"](el({ "data-act": "wiz-cancel" }));
  await P.dropTake({ name: "rows.csv" });
  check(P.S.wiz && P.S.wiz.plan && actOfStartOver() === "wiz-pick", "pb3 Start over on a file is still the file picker: " + JSON.stringify(actOfStartOver()));

  /* ---- 4. CANCEL SAYS WHAT IT DROPS --------------------------------------------------------------------------------- */

  const drops = (html) => { const b = buttonOf(html, "wiz-cancel"); const t = /title="([^"]*)"/.exec(b), l = /aria-label="([^"]*)"/.exec(b);
    return !!(t && l && t[1] === l[1] && /pasted text/.test(t[1]) && /drops/.test(t[1])); };
  const fileCancel = buttonOf(foot(), "wiz-cancel");
  await P.ACTS["wiz-cancel"](el({ "data-act": "wiz-cancel" }));
  await into(a.dir);
  const atBox = foot();
  await split(TWO);
  const atRead = foot();
  await next();
  const atCover = foot();
  check(drops(atBox) && drops(atRead) && drops(atCover) && fileCancel && !/title=/.test(fileCancel),
    "pb4 Cancel on a paste says what it drops: on the box " + drops(atBox) + ", after the split " + drops(atRead) + ", on the first cover "
    + drops(atCover) + "; on a file it says nothing");
  await P.ACTS["wiz-cancel"](el({ "data-act": "wiz-cancel" }));

  /* Cancel returns to the screen the wizard was opened from (board 960 item 3) */
  P.S.section = "cards";
  await P.dropTake({ name: "rows.csv" });
  check(!!P.S.wiz, "pb4b wizard opens while on cards");
  await P.ACTS["wiz-cancel"](el({ "data-act": "wiz-cancel" }));
  check(!P.S.wiz && P.S.section === "cards", "pb4c Cancel returns to Cards screen where wizard opened from: " + P.S.section);

  /* ---- 5. THE LANDING TEXT, ONE AT A TIME ---------------------------------------------------------------------------- */

  const b = await S.newProject(root, "South shop", L);
  await carded(b.dir);
  await into(b.dir);
  await split(TWO);
  await next();
  await landed("one");
  const h5 = handOf(P);
  const s5 = plain(h5 && h5.src);
  check(!!h5 && h5.kind === "import" && s5 === IN_WORDS && !NAMES_A_FILE.test(s5),
    "pb5b in the stack, a paste's card names it in words: " + JSON.stringify(s5));

  /* ---- 6. THE LIST, AND A PROJECT WITH NO CARDS ----------------------------------------------------------------------- */

  const c = await S.newProject(root, "East shop", L);
  await carded(c.dir);
  await into(c.dir);
  await split(TWO);
  await next();
  await landed("");
  const h6 = handOf(P);
  const st6 = h6 ? await applyAll(P, h6.file) : null;
  const s6 = plain(st6 && st6.wholes.length ? st6.wholes[st6.wholes.length - 1] : "");
  const left6 = ((await wire(S.listProposals(c.dir))).proposals || []).filter((p) => p.ok && p.pending > 0).length;
  check(s6 === IN_WORDS && !NAMES_A_FILE.test(s6) && left6 === 0,
    "pb6a applied whole from the stack, the line where Decided was says pasted text: " + JSON.stringify(s6));

  const bare = await S.newProject(root, "Bare shop", L);
  await into(bare.dir);
  await split(TWO);
  await next();
  await landed("");
  const s6b = said();
  check(P.S.section === "cards" && PASTED.test(s6b) && !NAMES_A_FILE.test(s6b),
    "pb6b into a project with no cards, the landing text says pasted text: " + JSON.stringify(s6b));

  /* ---- 7. A SECOND PASTE ---------------------------------------------------------------------------------------------- */

  const d = await S.newProject(root, "West shop", L);
  await carded(d.dir);
  await into(d.dir);
  await split(TWO);
  await next();
  await landed("");
  await into(d.dir);
  await split(TWO_B);
  await next();
  await landed("");
  const waitingFiles = ((await wire(S.listProposals(d.dir))).proposals || []).map((p) => path.basename(p.file)).sort();
  const h7 = handOf(P), second = h7 && h7.file ? path.basename(h7.file) : "";
  const pasteProposal = (n) => /^pasted(-[a-z0-9]+)*\.ec$/.test(n);
  check(waitingFiles.length === 2 && waitingFiles[0] !== waitingFiles[1]
        && waitingFiles.every(pasteProposal) && pasteProposal(second) && waitingFiles.indexOf(second) >= 0,
    "pb7a the second paste waits beside the first as its own file, and its row is the one in hand: "
    + waitingFiles.join(",") + " / " + second);

  /* ---- 8. IN POLISH ------------------------------------------------------------------------------------------------ */

  const pl = pageOver("pl");
  await pl.P.ACTS["to-projects"]();
  const e = await S.newProject(root, "Central shop", L);
  await carded(e.dir);
  await pl.P.ACTS.open(el({ "data-act": "open", "data-dir": e.dir }));
  await sleep(30);
  await pl.P.ACTS.import(el({ "data-act": "import" }));
  const dropsPl = (html) => { const m = /<button[^>]*data-act="wiz-cancel"[^>]*>/.exec(html); return m ? /title="Zamyka import bez zachowania wklejonego tekstu. Nic nie trafia do katalogu\."/.test(m[0])
    && /aria-label="Zamyka import bez zachowania wklejonego tekstu. Nic nie trafia do katalogu\."/.test(m[0]) : false; };
  pl.P.S.wiz.pasteText = TWO; pl.P.S.wiz.pastePlain = TWO; pl.P.S.wiz.pasteHtml = "";
  await pl.P.ACTS["wiz-paste-go"](el({}));
  const plRead = pl.home.node("#foot").innerHTML;
  check(dropsPl(plRead) && /<button[^>]*data-act="wiz-paste-back"[^>]*>[\s\S]*Wstecz<\/button>/.test(plRead),
    "pb8a in Polish the split's foot has Wstecz, and Cancel says what it drops");
  await pl.P.ACTS["wiz-paste-next"](el({}));
  await sleep(30);
  await pl.P.ACTS["wiz-land"](el({ "data-v": "" }));
  await sleep(30);
  const h8 = handOf(pl.P);
  const s8 = plain(h8 && h8.src);
  check(s8 === "Import z wklejonego tekstu" && !NAMES_A_FILE.test(s8),
    "pb8b in Polish the stack's card says wklejonego tekstu: " + JSON.stringify(s8));

  /* ---- 9. DECLARED LANGUAGES BESIDE BUILT-IN ONES ------------------------------------------------------------------ */

  const custom = await S.newProject(root, "Custom shop", [{ code: "en" }, { code: "de" }]);
  await carded(custom.dir);
  await into(custom.dir);
  await split(TWO);
  const opts = Array.from(main().matchAll(/<option value="([^"]+)"/g)).map((m) => m[1]);
  check(opts.indexOf("de") >= 0 && opts.indexOf("en") >= 0 && opts.indexOf("pl") >= 0,
    "pb9 the paste screen's language list holds the project's declared languages beside built-in ones: " + opts.join(","));

  return finish(argv);
}

function finish(argv) {
  process.stdout.write("\npaste-back  " + asserted + " assertion(s), " + failed + " failure(s)\n");
  if (asserted !== EXPECTED) {
    process.stdout.write("paste-back  expected " + EXPECTED + " assertions, ran " + asserted + "\n");
    failed++;
  }
  if (!argv.includes("--keep")) dropScratch(SCRATCH, "paste-back");
  else process.stdout.write("paste-back  kept " + SCRATCH + "\n");
  process.exit(failed ? 1 : 0);
}

main(process.argv.slice(2)).catch((e) => {
  process.stdout.write("paste-back  " + (e && e.stack ? e.stack : String(e)) + "\n");
  process.exit(2);
});
