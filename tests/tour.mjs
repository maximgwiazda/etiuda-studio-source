/* THE TOUR: that it is the engine's bubble, that it walks, and that it remembers (board 720).
 *
 *     node tests/tour.mjs [--keep]
 *
 * WHAT COULD BE WRONG HERE, which is what each section is. The tour is ten steps of prose over
 * a floating panel, and prose is Maxim's to read; what a gate can hold is the mechanism under
 * it, and the mechanism has four ways of failing that nothing else in this tree would notice.
 *
 *   1. THE PANEL STOPS BEING THE ENGINE'S. The family is defined once, in the engine's
 *      src/template.html, published as engine/bubble.css and spliced into this page by
 *      tools/bubble-css.mjs. Two things can break that: the spliced bytes drifting from the
 *      pinned file, which nothing at runtime would show, and somebody writing a second placer
 *      here because the import looked awkward. Section 1 is both, in node, over the committed
 *      files.
 *   2. A STEP POINTS AT NOTHING. Every step has an anchor and a section it is shown on, and an
 *      anchor is a selector over a screen that is repainted on every act. A selector that has
 *      stopped matching does not throw: the panel lands in the middle of the window with no
 *      pointer and the tour reads as a slideshow. Section 3 walks all ten and asserts the
 *      spotlight is on something with a box, every time.
 *   3. THE PANEL LEAVES THE WINDOW. placeBubble puts it below its target where it fits and then
 *      above, beside, and over it; the one case it cannot solve is a target that leaves no room
 *      anywhere, and the answer then is the middle of the window rather than the edge of it.
 *      Section 3 measures the panel's four edges against the viewport at the default window and
 *      section 5 does it again at Studio's own 900x560 minimum, which is where the design pass
 *      found every placement question worth asking.
 *   4. THE TOUR FORGETS, OR REMEMBERS TOO MUCH. Studio's tour resumes where the desk's
 *      restarts, so there are three remembered values and each is a different way to annoy
 *      somebody: asking twice, offering Continue to a person who finished, or losing the step.
 *      Section 4 skips at step four, shuts the window, opens a new one on the same profile and
 *      reads the Settings row.
 *
 * THE STRINGS ARE HELD TO THE TABLE HERE AND NOWHERE ELSE. `T(step.title)` and `T(step.body)`
 * are the only two calls in ui/app.js whose argument is not a literal, so tests/polish.mjs's
 * source scan cannot see them and lists them as known-indirect. Section 2 is what that
 * exemption is worth: the tour publishes the strings it would ask for, out of the same array it
 * reads, and they are held against ui/lang.js read as TEXT - a second implementation of the
 * table, which is that file's own habit and the reason it is written to be readable as text.
 *
 * THE BACK BUTTON IS SECTION 3'S FIRST ASSERTION AND IT IS NOT DECORATION. `prev.hidden = i===0`
 * is a no-op on a page whose .btn declares a display, which is what board 721 fixed with one
 * global rule; tests/hidden.mjs guards the rule and this guards the tour's reliance on it, which
 * are two different claims. If this leg ever goes red with hidden.mjs green, something has put
 * a display back on that button.
 */
import "./licensed-env.mjs";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { openStudio } from "./shell-door.mjs";
import { source, region, spliced, OPEN, SHUT } from "../tools/bubble-css.mjs";
import * as Engine from "../src/engine.mjs";
import { newProject, addTag, addCard } from "../src/studio.mjs";
import { publishFull } from "../src/publish.mjs";
import { unknownTokens } from "../src/placeholders.mjs";
import { clearScratch, dropScratch } from "./scratch.mjs";
import { pressWhen, settleOn } from "./press.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const SCRATCH = path.join(ROOT, "scratch", "tour");

let asserted = 0, failed = 0;
function check(cond, line) {
  asserted++;
  if (cond) process.stdout.write("  ok   " + line + "\n");
  else { failed++; process.stderr.write("  FAIL " + line + "\n"); }
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Every pair of ui/lang.js, read as text, and every string of one NO_TWIN list. The regexes are
 *  tests/polish.mjs's own, because two readers of one file that disagree prove nothing. */
function tableOf() {
  const src = fs.readFileSync(path.join(ROOT, "ui", "lang.js"), "utf8");
  const pairs = new Set();
  const re = /"((?:[^"\\]|\\.)*)":\s*\n?\s*"((?:[^"\\]|\\.)*)"/g;
  let m;
  while ((m = re.exec(src))) pairs.add(JSON.parse('"' + m[1] + '"'));
  const at = src.indexOf("    tour: [");
  if (at < 0) throw new Error("ui/lang.js declares no `tour` list in NO_TWIN");
  const end = src.indexOf("\n    ],", at);
  const list = [];
  const lre = /^      "((?:[^"\\]|\\.)*)",$/gm;
  const blk = src.slice(at, end);
  while ((m = lre.exec(blk))) list.push(JSON.parse('"' + m[1] + '"'));
  return { pairs, list };
}

/** The tour walked one step at a time, each frame measured in the page rather than inferred. */
const FRAME = () => {
  const card = document.getElementById("tourCard");
  const hole = document.getElementById("tourHole");
  const root = document.getElementById("tourRoot");
  const r = card.getBoundingClientRect();
  const h = hole.getBoundingClientRect();
  const tip = card.querySelector(":scope > .bub-tip");
  const cs = getComputedStyle(card);
  return {
    open: !root.hidden && root.classList.contains("on"),
    step: (window.STUDIO_READY || {}).tour || 0,
    section: (window.STUDIO_READY || {}).screen || "",
    side: card.getAttribute("data-side") || "",
    title: (document.getElementById("tourTitle") || {}).textContent || "",
    backHidden: document.getElementById("tourPrev").hasAttribute("hidden"),
    backRects: document.getElementById("tourPrev").getClientRects().length,
    next: (document.getElementById("tourNext") || {}).textContent || "",
    card: { top: Math.round(r.top), left: Math.round(r.left),
            right: Math.round(r.right), bottom: Math.round(r.bottom),
            w: Math.round(r.width), h: Math.round(r.height) },
    hole: { w: Math.round(h.width), h: Math.round(h.height),
            shown: getComputedStyle(hole).display !== "none" },
    tip: !!tip,
    fill: cs.backgroundColor,
    radius: cs.borderTopLeftRadius,
    vw: innerWidth, vh: innerHeight,
    bodyScrolls: (() => { const p = document.getElementById("tourBody");
      return p.scrollHeight > p.clientHeight; })(),
  };
};

const press = async (page, sel, ms) => {
  await pressWhen(page, sel, { who: "tests/tour.mjs" });
  await sleep(ms || 260);
  return true;
};

/* COUNTS:PREDICATES
   Members that must be there, in order where the order is the claim.
   One more member still passes. A missing member is named. A floor stays
   where a scanner that saw nothing would otherwise pass. */
function missingMembers(seen, required, ordered) {
  const have = (seen || []).map(s => String(s));
  if (!ordered) return required.filter(name => have.indexOf(String(name)) < 0);
  let from = 0;
  const missing = [];
  for (const name of required) {
    const at = have.indexOf(String(name), from);
    if (at < 0) missing.push(name);
    else from = at + 1;
  }
  return missing;
}

const TOUR_STRINGS = ["A catalog is a folder","Desks","Bring in the replies you already have","Every card, in every language","Writing a card","What the checks are for","Publishing writes a file","Changes coming back","Proving what you shipped","Everything else","Etiuda Studio runs on this computer. A catalog is one folder on disk holding its draft, every edition you have published, and the details that travel with it. Copy the folder and you have copied the catalog. <b>What travels, and how</b>: on the Etiuda relay, everything travels sealed under the team's key, so the relay carries it without being able to read it and only the team opens it; in a shared folder, editions travel however that folder is shared, over the organisation's own network or a sync service it chose. Beyond that, Studio connects to etiuda.dev for its licence and, about once an hour, to see whether a newer version is out, which an administrator can switch off; it never downloads or installs anything by itself. Where an AI service is set, a job the lead starts sends to that service alone, and only once the lead has seen what goes. What the lead sends to it may include customers' own words, where the lead chose them; etiuda.dev never receives them in a form it can read.","Every computer on the team is a teammate. Here you invite teammates and remove one that should no longer be on the team. An invitation, a link on the relay or a code to paste for a shared folder, works once: the teammate that takes it comes in by itself, and a request that arrives without one waits here for your answer.","Point this at a spreadsheet or an export and Studio reads it here, on this computer. It shows you what it made of every column and lets you correct the guesses before anything is kept. Into an empty catalog the rows go straight in; once it has cards, they land in <b>Proposals</b>, not in the catalog, so an import you dislike is discarded rather than undone.<br><br>In the Library, <b>Bring in your replies</b> turns any file into a new catalog, a whole catalog file included.","One row a card. A language gets a column, and the column says whether that card has text in it yet, not what the text is. <b>empty</b> is a card waiting for its translation, which is a state and not a fault: the catalog publishes as it stands and a desk set to that language shows the first language instead of a hole.<br><br>Add or remove a language under <b>Catalog details</b> in the list at the left, and a column appears here.","Click a row and it opens here. What you type is kept as you type it, in the catalog's draft, so there is nothing to save; the desks see it once you publish.<br><br>A word in braces like <span class='mono'>{AGENT}</span> is filled in at the desk that uses the card, so one card serves everybody. The chip under the text says which ones this card uses.","Studio checks the catalog when you open it, after an import, and again before you publish. A finding names the card it is about and <b>Jump to it</b> opens that card with the finding still on screen. A row about a language still awaited names that language instead, and <b>Show the cards</b> opens the cards still waiting for its text.<br><br>A duplicate title, a variable no desk fills, a card with nothing in it: the sort of thing nobody notices until an agent sends it to a customer.","Publish stamps the draft with the next rev, writes it into the folder your team reads from, and keeps a copy in the catalog's own archive. Before it does, it shows you what it is about to write and what the checks found.<br><br><b>Each desk offers the new edition to the person at it, and none of them loads it on its own.</b> Nobody's screen changes under their hands while they are talking to a customer.","An agent who improves a card at their own desk exports it, and the file lands in this folder. Studio reads it, shows you each change beside the wording it would replace, and writes nothing until you say so.<br><br>When something is waiting, two circles appear in the corner beside <b>+</b>: one opens the queue, one opens it with every row already ticked.","Every edition you publish is kept in <b>Archive</b>, and any two of them can be compared line by line. <b>Audit</b> on an edition accounts for it: how many cards were written here, how many came from a proposal and who accepted it, and whether the content still hashes to what the file claims.<br><br><b>Export this pack</b> writes that account out as a folder to hand to somebody who asks.","This button opens the Menu, with the settings of <b>this copy of Studio</b>: where catalogs are kept, light or dark, the language of the buttons, and the key a published catalog is signed with.<br><br>This tour is here too, whenever you want it again."];
const TOUR_STEPS = 10;
function tourStringsHeld(pack, unanswered) {
  const strings = (pack && pack.strings) || [];
  const missing = missingMembers(strings, TOUR_STRINGS, true);
  const untranslated = (unanswered || []).map(s => String(s).slice(0, 80));
  if ((pack && pack.count || 0) < TOUR_STEPS) missing.push("steps under " + TOUR_STEPS);
  if (strings.length < TOUR_STRINGS.length) missing.push("strings under " + TOUR_STRINGS.length);
  return { ok: missing.length === 0 && untranslated.length === 0, missing, untranslated };
}
/* COUNTS:END */

async function main(argv) {
  const keep = argv.indexOf("--keep") >= 0;
  clearScratch(SCRATCH);
  const projects = path.join(SCRATCH, "projects");
  fs.mkdirSync(projects, { recursive: true });
  const ud = path.join(SCRATCH, "ud");

  /* ---- 1. the panel is the engine's, in bytes and in code ------------------------------------ */

  const html = fs.readFileSync(path.join(ROOT, "ui", "index.html"), "utf8");
  const from = source();
  const held = region(html).held;
  check(held === from && spliced(html) === html,
    "1a the bubble spliced into ui/index.html is the pinned file byte for byte: "
    + Buffer.byteLength(held) + " of " + Buffer.byteLength(from) + " byte(s), "
    + from.split("\n").length + " line(s), between " + JSON.stringify(OPEN.slice(8, 30))
    + " and " + JSON.stringify(SHUT.slice(8, 26)));

  /* THE CONTROL IS ONE CHARACTER, because 1a would pass just as well against a page whose
     markers happened to sit either side of the right number of bytes. */
  const bentAt = html.indexOf("\n", html.indexOf(OPEN)) + 1;
  const bent = html.slice(0, bentAt) + "/**/" + html.slice(bentAt);
  check(region(bent).held !== from && spliced(bent) === html,
    "1b CONTROL: four characters added inside the region make it disagree, and splicing the"
    + " bent page gives the committed one back - " + (Buffer.byteLength(region(bent).held)
      - Buffer.byteLength(from)) + " byte(s) of difference");

  /* NO SECOND PLACER. The engine's bubble.js is imported; a copy of it here is what board 719
     removed, and the shape of the copy that was here before is what these names come from. */
  const appSrc = fs.readFileSync(path.join(ROOT, "ui", "app.js"), "utf8");
  const imports = (appSrc.match(/import\("\.\.\/engine\/pinned\/src\/modules\/bubble\.js"\)/g)
    || []).length;
  const copied = ["BUB_ORDER", "function placeBubble"].filter(n => appSrc.indexOf(n) >= 0);
  check(imports === 1 && copied.length === 0,
    "1c the placer is imported from the pin once and copied nowhere: " + imports
    + " dynamic import(s) of engine/pinned/src/modules/bubble.js, "
    + JSON.stringify(copied) + " copied name(s) in ui/app.js");

  /* ---- 2, 3, 4. the real window ------------------------------------------------------------- */

  const { dir: tourProj } = await newProject(projects, "Harbour Parcels", ["en", "pl"]);
  const cat = (await addTag(tourProj, "shelf", { en: "Deliveries", pl: "Dostawy" })).tag;
  const req = (await addTag(tourProj, "request", { en: "Track parcel", pl: "Sledz paczke" })).tag;
  await addCard(tourProj, cat.id, "Late parcel", "We'll send a new one tomorrow.", "plain",
    { title: { pl: "Opozniona paczka" }, body: { pl: "Wyslemy nowa jutro." }, requests: [req.id] });
  await addCard(tourProj, cat.id, "Return cost", "The return is free of charge.", "plain",
    { title: { pl: "Koszt zwrotu" }, body: { pl: "Zwrot jest bezplatny." } });
  await addCard(tourProj, cat.id, "Parcel box", "Please send a photo of the label.", "plain", {});
  await publishFull({ project: tourProj, notes: "First edition." });

  const studio = await openStudio("tests/tour.mjs", { words: true,
    projects, userDataDir: ud,
  });
  const frames = [];
  let strings = null, invite = null, afterNotNow = null, atFinish = null, rowAfter = null;
  try {
    const page = studio.page;
    const read = async (fn) => JSON.parse(await page.evaluate(
      "JSON.stringify((" + String(fn) + ")())"));
    await sleep(900);

    /* ---- 2. every string the tour can ask for is answered by the table -------------------- */
    strings = await read(() => (window.STUDIO_TOUR || { strings: [] }));
    const { pairs, list } = tableOf();
    const unanswered = strings.strings.filter(s => !pairs.has(s) && list.indexOf(s) < 0);
    const tour1 = tourStringsHeld(strings, unanswered);
    check(tour1.ok,
      "2a every string of the steps is answered by ui/lang.js, a pair in the table or a line of"
      + " NO_TWIN.tour, matched whole and read out of the file as text"
      + (tour1.missing.length ? ", missing " + tour1.missing.map(s => JSON.stringify(String(s).slice(0, 50))).join(", ") : "")
      + (tour1.untranslated.length ? ", untranslated " + JSON.stringify(tour1.untranslated[0]) : ""));
    /* THE CONTROL: a string the table has never seen is not answered, so 2a is a match and not
       a formality over a list that answers everything. */
    check(!pairs.has("a string no screen of this program says") &&
          list.indexOf("a string no screen of this program says") < 0,
      "2b CONTROL: a string neither file carries is unanswered, so 2a is a lookup rather than"
      + " a list that says yes");
    /* THE TOUR TEACHES WHAT THE DESK FILLS: its braces go through the lint's own placeholder
       rule, so the step and the Lint screen cannot disagree about a spelling. */
    const taught = (text) => unknownTokens({ cards: [{ id: "tour", body: { en: text } }] },
      Engine.cardTokens().tokens, []);
    const wrong = taught(strings.strings.join(" "));
    check(/\{AGENT\}/.test(strings.strings.join(" ")) && wrong.length === 0
          && taught("like {agent} is filled").length === 1,
      "2c every placeholder the tour names is one the pinned desk fills, by the lint's own rule"
      + (wrong.length ? ": " + wrong[0] : "") + "; CONTROL: the old {agent} is refused by it");

    /* ---- 3. the invite, and the ten steps --------------------------------------------------- */

    invite = await read(() => {
      const inv = document.getElementById("tourInvite");
      const btn = document.getElementById("btnMenu");
      const a = inv.getBoundingClientRect(), b = btn.getBoundingClientRect();
      return { hidden: inv.hidden, shown: (window.STUDIO_READY || {}).invite,
        inv: { top: Math.round(a.top), left: Math.round(a.left), w: Math.round(a.width),
               h: Math.round(a.height), right: Math.round(a.right),
               bottom: Math.round(a.bottom) },
        btn: { top: Math.round(b.top), left: Math.round(b.left), w: Math.round(b.width) },
        side: inv.getAttribute("data-side") || "",
        tip: !!inv.querySelector(":scope > .bub-tip"),
        fill: getComputedStyle(inv).backgroundColor,
        vw: innerWidth, vh: innerHeight };
    });
    const hangsOff = invite.inv.top > invite.btn.top
      && invite.inv.top - (invite.btn.top + 30) < 40;
    check(invite.shown === true && invite.hidden === false && invite.tip === true
          && hangsOff && invite.inv.right <= invite.vw && invite.inv.bottom <= invite.vh,
      "3a a fresh profile with the planted project offers the tour, hung off the Menu button and"
      + " wholly on screen: invite at " + invite.inv.left + "," + invite.inv.top + " "
      + invite.inv.w + "x" + invite.inv.h + " against the button at " + invite.btn.left + ","
      + invite.btn.top + ", side " + JSON.stringify(invite.side) + ", window " + invite.vw
      + "x" + invite.vh);

    /* THE OFFER IS REACHED WHERE IT IS SEEN, AND THE NAME SAYS WHAT IT IS (sense pass 3, item 34).
       Blur leaves the sequential focus start where the opening put it, on the search field, so the
       walk begins at a button planted before the band. The name is text until F2, and the name the
       accessibility tree gives the field is read then, not an attribute. Escape puts the text back
       before the tour starts. */
    await page.evaluate(() => {
      const s = document.createElement("button");
      s.type = "button";
      s.id = "tabTop";
      s.tabIndex = 0;
      s.textContent = "top";
      s.style.cssText = "position:absolute;width:8px;height:8px;opacity:0.01;top:0;left:0";
      document.body.insertBefore(s, document.body.firstChild);
      s.focus();
    });
    const stops = [];
    for (let i = 0; i < 40; i++) {
      await page.keyboard.press("Tab");
      stops.push(await page.evaluate(() => {
        const e = document.activeElement;
        if (!e || e === document.body) return "body";
        return e.id || (e.closest(".work") ? "work" : e.closest("#band") ? "band" : e.tagName);
      }));
    }
    await page.evaluate(() => { const s = document.getElementById("tabTop"); if (s) s.remove(); });
    const offerAt = stops.indexOf("tourNotNow"), workAt = stops.indexOf("work");
    check(offerAt >= 0 && workAt >= 0 && offerAt < workAt,
      "3a1 walked by Tab from the top, the invite's first button is stop " + (offerAt + 1)
      + " and the first stop in the work area is " + (workAt + 1) + ": " + JSON.stringify(stops.slice(0, 16)));
    const resting = await page.evaluate(() => {
      const n = document.querySelector("#main .pn[data-proj]");
      return n ? n.textContent : "";
    });
    await page.evaluate(() => {
      const tr = document.querySelector('#main tr[data-act="open"]');
      if (tr) tr.focus();
    });
    await page.keyboard.press("F2");
    await sleep(250);
    const field = await page.$("#main input[data-naming][data-proj]");
    const ax = field ? await page.accessibility.snapshot({ root: field, interestingOnly: false })
      : null;
    check(resting.trim().length > 0 && !!ax && ax.role === "textbox" && (ax.name === "Catalog name" || ax.name === "Project name"),
      "3a2 the project's name is " + JSON.stringify(resting)
      + " and, while it is renamed, a textbox named " + JSON.stringify(ax && ax.name));
    await page.keyboard.press("Escape");
    await sleep(200);

    await press(page, '[data-act="tour-start"]', 500);
    for (let i = 0; i < TOUR_STEPS; i++) {
      frames.push(await read(FRAME));
      if (i < TOUR_STEPS - 1) await press(page, '[data-act="tour-next"]', 420);
    }

    const steps = frames.map((f, i) => ({ i: i + 1, f }));
    const wrongStep = steps.filter(({ i, f }) => f.step !== i || !f.open);
    check(wrongStep.length === 0,
      "3b Next walks all " + TOUR_STEPS + " steps in order and the panel is up at each: "
      + JSON.stringify(frames.map(f => f.step))
      + (wrongStep.length ? ", wrong at " + wrongStep[0].i : ""));

    check(frames[0].backHidden === true && frames[0].backRects === 0
          && frames[1].backHidden === false && frames[1].backRects === 1,
      "3c Back is hidden on step one and painted on step two, which is `prev.hidden = i===0`"
      + " actually hiding it: step 1 " + frames[0].backRects + " rect(s), step 2 "
      + frames[1].backRects + " rect(s)");

    const noHole = steps.filter(({ f }) => !f.hole.shown || f.hole.w <= 0 || f.hole.h <= 0);
    check(noHole.length === 0,
      "3d every step lights something with a box rather than falling back to the middle of the"
      + " window: " + JSON.stringify(frames.map(f => f.hole.w + "x" + f.hole.h))
      + (noHole.length ? ", nothing at step " + noHole[0].i : ""));

    const off = steps.filter(({ f }) => f.card.left < 0 || f.card.top < 0
      || f.card.right > f.vw || f.card.bottom > f.vh);
    const sides = {};
    frames.forEach(f => { sides[f.side] = (sides[f.side] || 0) + 1; });
    /* AND NOT ONE OF THEM IS `none`, WHICH IS THE STRONGER CLAIM. `none` is the family's last
       resort: the panel goes in the middle of the window with no pointer, over the thing it
       points at, and it is still wholly on screen - so a leg that only measured the edges
       passes on a tour that has stopped pointing at anything. Two steps reached it during this
       node and both were an anchor chosen carelessly rather than a window too small: step 7 lit
       the whole work area, and step 2 lit the rail's Import row, which below 1100px is the
       width of the window. Both were measured, not guessed, and both are fixed at the anchor. */
    check(off.length === 0 && Object.keys(sides).every(s =>
        ["below", "above", "right", "left"].indexOf(s) >= 0),
      "3e every panel hangs off a side and none leaves the window at " + frames[0].vw + "x"
      + frames[0].vh + ": " + JSON.stringify(sides) + " over " + TOUR_STEPS + " steps, 0 off screen, 0 with"
      + " no pointer"
      + (off.length ? ", step " + off[0].i + " at " + JSON.stringify(off[0].f.card) : ""));

    /* THE PANEL WEARS THE SPLICED RULES. Cobalt is the family's fill in both themes and 14px is
       its radius; the pointer is created by placeBubble and carries the side it wrote. A panel
       that had lost the spliced region would still be a div in the right place. */
    const wrongLook = steps.filter(({ f }) => f.fill !== "rgb(37, 99, 235)"
      || f.radius !== "14px" || !f.tip);
    check(wrongLook.length === 0,
      "3f and it wears the engine's own rules at every step: fill "
      + JSON.stringify(frames[0].fill) + ", radius " + frames[0].radius + ", pointer present "
      + frames.filter(f => f.tip).length + " of " + TOUR_STEPS);

    /* THE CONTROL FOR 3f, and it is the spliced region itself: delete the family's own rule from
       the live sheet and the same panel loses the fill, which is what says the look comes from
       the engine's bytes rather than from anything of Studio's. */
    const control = await read(() => {
      const card = document.getElementById("tourCard");
      const sheet = document.styleSheets[0];
      const at = Array.from(sheet.cssRules).findIndex(r => r.selectorText === ".bub");
      if (at < 0) return { found: false };
      const text = sheet.cssRules[at].cssText;
      const withIt = getComputedStyle(card).backgroundColor;
      sheet.deleteRule(at);
      const without = getComputedStyle(card).backgroundColor;
      sheet.insertRule(text, at);
      return { found: true, withIt, without,
               back: getComputedStyle(card).backgroundColor };
    });
    check(control.found && control.withIt === "rgb(37, 99, 235)"
          && control.without !== control.withIt && control.back === control.withIt,
      "3g CONTROL: with the spliced .bub rule deleted from the live sheet the same panel reads "
      + JSON.stringify(control.without) + " instead of " + JSON.stringify(control.withIt)
      + ", and has it back when the rule is put back");

    check(frames[TOUR_STEPS - 1].next !== frames[0].next,
      "3h the last step's button is not the others': " + JSON.stringify(frames[TOUR_STEPS - 1].next)
      + " against " + JSON.stringify(frames[0].next));

    /* THE TOUR PUBLISHES NOTHING BEHIND ITSELF, and the leg exists because the tour DRIVES the
       program: every step presses a rail row and step five presses a card. Step seven points at
       Publish with the cover shut, deliberately - a tour that puts a writing action one click
       from the spotlight will one day publish somebody's half-finished catalog - so the edition
       step nine accounts for must be the one the planting made and no other. A second one
       would mean a step had pressed something it only meant to point at. */
    const home = fs.readdirSync(projects).map(n => path.join(projects, n))
      .filter(d => fs.existsSync(path.join(d, "project.json")))[0];
    const archived = fs.readdirSync(path.join(home, "archive")).sort();
    const claims = JSON.parse(fs.readFileSync(path.join(home, "project.json"), "utf8"));
    check(archived.length === 1 && claims.rev === 1 && claims.edition === archived[0],
      "3i and the whole walk published nothing behind itself: " + archived.length
      + " edition(s) in the archive after " + TOUR_STEPS + " steps, " + JSON.stringify(archived[0])
      + ", the project still at rev " + claims.rev);

    /* ---- 4. it remembers, and what it remembers ---------------------------------------------- */

    await press(page, '[data-act="tour-next"]', 420);          /* Finish */
    atFinish = await read(() => ({
      open: !document.getElementById("tourRoot").hidden,
      step: (window.STUDIO_READY || {}).tour || 0,
      invite: (window.STUDIO_READY || {}).invite,
    }));
    check(atFinish.open === false && atFinish.step === 0 && atFinish.invite === false,
      "4a Finish takes the tour off the screen and does not offer it again: open "
      + atFinish.open + ", invite " + atFinish.invite);

    /* THE ROW AFTER A FINISH, and it is the one that says the tour is findable at all: a person
       who skipped or finished has nowhere else to look for it. */
    await press(page, '[data-act="menu"]', 400);
    await settleOn(page, '((document.querySelector(\'[data-act="tour-show"]\') || {}).textContent || "").trim() !== ""', { bound: 30000 });
    rowAfter = await page.evaluate(
      `(document.querySelector('[data-act="tour-show"]') || {}).textContent || ""`);
    await press(page, '[data-act="tour-show"]', 600);
    await settleOn(page, '(window.STUDIO_READY || {}).tour === 1', { bound: 30000 });
    const atOne = await read(FRAME);
    await press(page, '[data-act="tour-next"]', 380);
    await press(page, '[data-act="tour-next"]', 380);
    await press(page, '[data-act="tour-next"]', 380);
    await settleOn(page, '(window.STUDIO_READY || {}).tour === 4', { bound: 30000 });
    const atFour = await read(FRAME);
    await press(page, '[data-act="tour-skip"]', 420);
    afterNotNow = await read(() => ({
      open: !document.getElementById("tourRoot").hidden,
      invite: (window.STUDIO_READY || {}).invite,
    }));
    /* The Menu is a list since 2026-10-06 (S1) and its second row is this one, with the desk's ellipsis (M3). */
    check(rowAfter.trim() === "Show tour…" && atOne.step === 1 && atFour.step === 4
          && afterNotNow.open === false && afterNotNow.invite === false,
      "4b a finished tour is offered from the Menu as " + JSON.stringify(rowAfter.trim())
      + " and starts again at step " + atOne.step + "; Skip at step " + atFour.step
      + " closes it and still does not bring the invite back");

    /* THE RESUME ITSELF, which is the one place this tour departs from the desk's. The row has
       to say which step it would open on - a row that resumed silently would be pressed twice
       by anybody wanting to know - and pressing it has to land there. */
    await press(page, '[data-act="menu"]', 420);
    await settleOn(page, '((document.querySelector(\'[data-act="tour-show"]\') || {}).textContent || "").trim() !== ""', { bound: 30000 });
    const rowPart = await page.evaluate(
      `(document.querySelector('[data-act="tour-show"]') || {}).textContent || ""`);
    await press(page, '[data-act="tour-show"]', 600);
    await settleOn(page, '(window.STUDIO_READY || {}).tour === 4', { bound: 30000 });
    const resumed = await read(FRAME);
    /* the frame binds "of" to its number with a no-break space (ui/lang.js fill, few-forms 2c), read here as a space */
    check(rowPart.split(String.fromCharCode(160)).join(" ").indexOf("4 of " + TOUR_STEPS) >= 0 && resumed.step === 4
          && resumed.title === atFour.title,
      "4c and the row then reads " + JSON.stringify(rowPart.trim()) + ", which opens on step "
      + resumed.step + " - the same step by its title, " + JSON.stringify(resumed.title));

    /* ---- 5. Studio's own minimum window ----------------------------------------------------- */

    /* Back to step one from where 4c left it, by the Back button rather than by reopening, so
       that the walk below starts where the walk above did. */
    await press(page, '[data-act="tour-prev"]', 340);
    await press(page, '[data-act="tour-prev"]', 340);
    await press(page, '[data-act="tour-prev"]', 340);
    await page.setViewport({ width: 900, height: 560 });
    await sleep(500);
    const min = [];
    for (let i = 0; i < TOUR_STEPS; i++) {
      min.push(await read(FRAME));
      if (i < TOUR_STEPS - 1) await press(page, '[data-act="tour-next"]', 380);
    }
    const tooSmall = min[0].vw > 1000;
    const offMin = min.filter(f => f.card.left < 0 || f.card.top < 0
      || f.card.right > f.vw || f.card.bottom > f.vh);
    const sidesMin = {};
    min.forEach(f => { sidesMin[f.side] = (sidesMin[f.side] || 0) + 1; });
    check(!tooSmall,
      "5a the window really is at Studio's minimum for this section, read from the page: "
      + min[0].vw + "x" + min[0].vh
      + (tooSmall ? " - setViewport did not reach the renderer, so 5b proves nothing" : ""));
    check(!tooSmall && offMin.length === 0 && !sidesMin.none,
      "5b and every panel still hangs off a side there, over " + TOUR_STEPS + " steps at " + min[0].vw + "x"
      + min[0].vh + ": " + JSON.stringify(sidesMin) + ", " + offMin.length + " off screen, "
      + min.filter(f => f.bodyScrolls).length + " of " + TOUR_STEPS + " with a scrolling body");

    /* ---- 5c. the keyboard (Studio polish 04, item 13) -------------------------------------- */

    const held = [];
    for (let i = 0; i < 6; i++) {
      await page.keyboard.press("Tab");
      await sleep(80);
      held.push(await read(() => {
        const a = document.activeElement;
        return a && a.closest && a.closest("#tourCard") ? a.id : "outside:" + (a ? a.tagName : "");
      }));
    }
    await page.keyboard.press("Escape");
    await sleep(500);
    const escaped = await read(() => ({ open: !document.getElementById("tourRoot").hidden,
      step: (window.STUDIO_READY || {}).tour || 0 }));
    check(held.every(id => /^tour/.test(id)) && new Set(held).size > 1
          && escaped.open === false && escaped.step === 0,
      "5c the panel holds the keyboard: six Tabs stay inside it (" + held.join(", ")
      + "), and Escape closes the tour (open " + escaped.open + ", step " + escaped.step + ")");
  } finally { await studio.shut(); }

  /* ---- 6. the store keeps the three values, and a new window reads them ---------------------- */

  const stored = JSON.parse(fs.readFileSync(path.join(ud, "studio.json"), "utf8")).tour || {};
  check(stored.offered === true && stored.taken === true && Number.isInteger(stored.at)
        && stored.at >= 0 && stored.at < TOUR_STEPS,
    "6a the desk's own store carries the three values after all that: "
    + JSON.stringify(stored));

  const again = await openStudio("tests/tour.mjs", { words: true,
    projects, userDataDir: ud,
  });
  let second = null;
  try {
    await sleep(900);
    second = await again.page.evaluate(
      `JSON.stringify({ invite: (window.STUDIO_READY || {}).invite })`);
    second = JSON.parse(second);
  } finally { await again.shut(); }
  check(second.invite === false,
    "6b and a second window on the same profile does not offer the tour again: invite "
    + second.invite);

  /* ---- 7. a tour left by closing the window (bug hunt 3, item 17) ----------------------------
     Neither Skip nor Finish ran, so nothing set `offered` and every launch asked "New here?"
     again. 3a is the control that a fresh profile is asked. */
  const udLeft = path.join(SCRATCH, "ud-left");
  const left = await openStudio("tests/tour.mjs left", {
    projects, userDataDir: udLeft,
  });
  try {
    await sleep(900);
    await press(left.page, '[data-act="tour-start"]', 500);
    for (let i = 0; i < 3; i++) await press(left.page, '[data-act="tour-next"]', 420);
  } finally { await left.shut(); }
  const leftStored = JSON.parse(fs.readFileSync(path.join(udLeft, "studio.json"), "utf8")).tour || {};
  const back = await openStudio("tests/tour.mjs left again", {
    projects, userDataDir: udLeft,
  });
  let third = null;
  try {
    await sleep(900);
    third = JSON.parse(await back.page.evaluate(
      `JSON.stringify({ invite: (window.STUDIO_READY || {}).invite })`));
  } finally { await back.shut(); }
  check(leftStored.at === 3 && leftStored.offered === true && third.invite === false,
    "7a a tour left at step 4 by closing the window is not offered again at the next launch,"
    + " and it keeps its place: stored " + JSON.stringify(leftStored) + ", invite " + third.invite);

  if (!keep) dropScratch(SCRATCH, "tour");
  process.stdout.write("tour  " + asserted + " assertion(s), " + failed + " failure(s)\n");
  process.exit(failed ? 1 : 0);
}

main(process.argv.slice(2)).catch(e => {
  process.stderr.write("tour  " + (e && e.stack ? e.stack : String(e)) + "\n");
  process.exit(2);
});
