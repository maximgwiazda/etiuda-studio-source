/* THE REVIEW DOOR'S SCREEN, THE STACK: what the eye and the hand meet, measured in a real layout.
 *
 *     node tests/review-door.mjs
 *
 * Max asked for "a unified place signified by the action button, that can be used to rapidly go through all stuff that
 * requires manual review", to be "intuitive, nice looking, fast, and robust", and chose the product designer's stack
 * (variant A). Her handoff's measures and the copywriter's words are the oracle; nothing here asks the page whether it
 * agrees with itself.
 *
 * Headless Chrome on ui/index.html and ui/app.js, a stub window.STUDIO, and one catalog made and opened by the real verbs
 * (src/studio.mjs newProject and openProject) into scratch. The inbox, the files' rows, the drafts and the requests are the
 * stub's, invented here: eight things (a teammate's three rows, one held for checking first; two imported rows, one long;
 * a model's draft; an error the lint found; a request to join), or forty.
 *   rd1  the Review disc opens the stack, and so does the rail's Review row: its title, the count line in her words
 *   rd2  every waiting file is read whole when the door opens, so each of its rows is a card
 *   rd3  the kind chips count by kind, in the kinds' order, the drafts in the neutral slate (light and dark)
 *   rd4  a chip is a filter: pressed, the pile holds that kind only; pressed again, everything
 *   rd5  with forty waiting, the hand's top is 62 px below the stage's, the edges below step 38 px and narrow 1.4 per cent each, the nearest
 *        edge above shows 30 px, and no readable edge reaches into the 110 px foot
 *   rd6  with forty waiting, only the cards near the hand are elements, however far the hand has moved; the rest is the
 *        pile's one drawn block and "More below"
 *   rd7  Up, Down, J and K move; they are silent while focus is in a field
 *   rd8  the wheel moves one thing for each 50 px gathered and forgets after 300 ms at rest; over a long change it
 *        scrolls the change first
 *   rd9  a move with forty waiting places within one and a half times eight's median or 1.5 ms more (and within 4 ms under the
 *        release profile), a hundred and twenty within twice forty's, since only the cards near the hand are placed (the median
 *        of 30 moves each, keydown to layout, one page and one load, printed together); and a hundred and twenty start no more
 *        motions a move than forty, the load-free proof of it
 *   rd10 Esc leaves for the section the door was opened from
 *   rd11 a row whose words changed since the door last read its file comes back first, with the chip
 *   rd12 a card's source opens that file's own table, and its Back returns to the stack
 *   rd13 nothing waits: said in her words, the rail reads 0
 *   rd14 a kind with nothing under it says so, how many wait elsewhere, and offers Show everything
 *   rd15 a window under about 900 px of room folds Decided under the stack; a wide one keeps the two columns
 *   rd16 A and R each make a record and the card leaves the pile; Decided newest first, its heading, Apply's count, the live line
 *   rd17 S, Later: the card goes to the pile's bottom with its tag, still waiting
 *   rd18 Shift A takes the rest of the teammate's file, named with the number of others, never the row held for checking first
 *   rd19 Ctrl Z takes back the last answer, then the one before
 *   rd20 Take back on a Decided row
 *   rd21 Take everything back
 *   rd22 a second answer within 340 ms of the first is ignored
 *   rd23 a request's code field: A with no code puts the caret there, the keys type in it and decide nothing, Esc leaves it,
 *        Enter admits; Decided then says an admission cannot be taken back
 *   rd24 Apply calls each kind's own verb with what it should (a stand-in that records them), says "Applying: {N}…" with its
 *        rows dimmed and the pile answering meanwhile, and what was written leaves Decided
 *   rd25 a landing refused and the admissions refused as a whole stay in Decided
 *   rd26 the copywriter's five words: the drafts' chip and tags, both nothing-waits lines, a desk, a finding's source
 *   rd27 a card changed since it was seen says who sent it again and when, and the dropped answer only when one was
 *   rd28 the category chip on every edge and on the hand, wherever the row carries its card's category
 *   rd29 the hint's keys take the same small boxes the answer buttons carry, and the words between stay as they are
 *   rd30 with forty waiting, "More below" sits at the drawn block's foot, left of the stage's middle, and reads how many
 *        are not readable cards; with one card and no block it is absent
 *   rd31 a body taller than its box fades its last lines until it is scrolled to the end; a short body does not, and
 *        the text grows no ellipsis
 *   rd32 Decided's list fades its foot while it scrolls and more remains; one row that fits does not, nor the list at
 *        its end
 *   rd33 on a Polish screen the door's category chip equals the Cards table's chip for the same card, and a row with
 *        no category stays empty
 *   rd57 a kept shared card (a teammate's added card naming `from: {desk, card}`) is one row for every keeper's copy, naming the
 *        keepers, and one answer lands in each keeper's file; no `from`, or a malformed one, is an ordinary row
 * THE MOTION, the product designer's table (260 ms a move, 340 ms an answer's flight and Later's drop, the ease
 * cubic-bezier(.2,.8,.2,1)), read from the computed style at the moment it starts and sampled frame by frame after:
 *   rd34 the door opens with nothing sliding; a move: every card slides from where it was to its new place, a card coming
 *        into the window from where it stood in the pile (none from the stage's top), the hand's body fading in from half; the
 *        incoming hand reaches 62 px without passing it
 *   rd35 a flick of the wheel ends on a whole thing: six moves for 390 px gathered in thirteen steps, the hand never past
 *        its place, and the pile at rest on the cards' own places, the 30 px left over forgotten
 *   rd36 an answer: the card leaves the stage where the hand was, shrinks to a third and flies to the top of Decided (340 ms,
 *        its fade ease-in) and is gone after; its row drops in from the left as the card reaches its slot (130 ms, over by
 *        470), never absent at any 10 ms step of its own clock, the rows there sliding down; a second answer mid-landing ends
 *        with both rows in order
 *   rd37 Later: the card drops straight down out of the stage (340 ms) and is gone after
 *   rd38 a take back, by Ctrl Z or a row's Take back: the row fades where it stands (100 ms, its box not moving) while the
 *        row under it closes up (260 ms), and the card comes back into the hand by the ordinary move, from just above the
 *        card it goes in front of
 *   rd39 with Studio's motion off (html.e-still) and with the system's reduced motion: no slide and no flight, the cards
 *        simply in their new places and Decided's row simply there
 * THE REFUSALS, everything Apply can be refused kept in Decided with its reason (the copywriter's "Not applied: {REASON}."):
 *   rd40 proposal rows changed, already decided or with a gone file stay in Decided with their reason and Take back while
 *        unchanged rows apply; a second Apply after clearing applies them
 *   rd41 per-desk admission refusals stay in Decided with their reason and Take back while other kinds apply; a second Apply
 *        after clearing admits them
 *   rd42 a finding refused for no card stays in Decided with its reason and Take back while other items apply; a second
 *        Apply after restoring applies it
 *   rd43 a draft gone at accept or discard stays in Decided with its reason and Take back while other items apply; a second
 *        Apply after restoring applies it
 *   rd44 whole-team admission refusals (licence paused, teammate limit, backup key) are said once above Decided's rows, never
 *        repeated per admission; non-admissions still apply and a second Apply succeeds
 *   rd45 "Whose proposal this is": one line a file under Apply for each file with something accepted; stack keys do nothing
 *        in it; typed attribution reaches proposalDecide and empty keeps the fallback; the fields are one group under one heading and each is named by its file, a 40-character name whole at 1280 and 900 px in both languages
 *   rd46 whenever an admission waits in Decided, Decided says an admission cannot be taken back once applied (EN and PL); gone
 *        when none waits
 *   rd47 a file applied whole leaves the inbox and says so where Decided was for the sitting (EN and PL)
 *   rd48 the archive question asks once per aboveEngine or unknownHead file before archiving; Cancel keeps its rows in Decided
 *        with a reason without archiving while other files apply; Archive anyway applies it
 *   rd49 the screen reader line announces every answer, Later, Take back and the last item, in English and Polish
 *   rd50 a numbers warning is a Checks card; Leave as it is sends its own line of numbers to leaveFinding at Apply
 * THE PLANTS (tests/plant-copy.mjs), each in a scratch copy: stk-field (the field's silence) turns rd7 red, stk-cull (the
 * cards far from the hand taken out) rd6, stk-foot (the foot kept free) rd5, stk-wheel (the wheel's forgetting) rd8,
 * stk-held (Shift A's skipping a held row) rd18, stk-guard (the 340 ms rest) rd22, stk-code (a request's A waiting for its
 * code) rd23, stk-keep (a refused landing kept in Decided) rd25, stk-sent (who and when only when an answer was dropped) rd27,
 * stk-where (a path edit's category only from the row's own shelf text) rd28, stk-more (the count left centred
 * on the stage) rd30, stk-fade (a long body's foot left unfaded) rd31, stk-list (Decided's list left unfaded) rd32,
 * stk-said (a shelf's other language left as the row wrote it) rd33, stk-enter (a card coming in starting where it stood)
 * rd34, stk-ease (the ease without overshoot, in ui/index.html) rd35, stk-fly (the flight's aim at Decided) and stk-land
 * (the row waiting out the flight, in ui/index.html) rd36, stk-still (motion off, in ui/index.html) rd39,
 * stk-keep-refused (a refused answer dropped from Decided) and stk-file-check (the file not re-read at Apply) rd40,
 * stk-team-once (a whole-team refusal not said once) rd44, stk-from (the attribution field absent) stk-from-desc (the field not named by its file's name) and stk-from-head (the heading above the fields absent) rd45, stk-admit-note
 * (the admission note absent) rd46, stk-whole (the whole-file line absent) rd47, stk-above (the archive question skipped)
 * rd48, stk-say (the screen reader line plain) rd49, stk-all (every card placed on a move, not the cards near the hand) rd9, door-numbers (a numbers warning not a card of the door) rd50,
 * stk-cut (the door's two titles left out of the cut pass, so a long one is clipped hard and not faded) rd51,
 * stk-kept-group (a shared card's copies left as separate rows), stk-kept-valid (a malformed `from` taken as valid) and stk-kept-apply
 * (an answer not landing in every keeper's file) and stk-kept-same (copies with different wording grouped) rd57.
 * The geometry legs read the stack at rest: look() finishes the stack's running motions first, and leaves out a card in
 * flight or being let go, which the eye no longer counts as the pile.
 * Not here: whether the motion reads well, which is the designer's eye; a window leg.
 * REVIEW_DOOR_SHOTS=<folder> writes the seven states, light and dark, and adds no check. Nothing is written otherwise.
 *
 * Node only, headless Chrome via puppeteer-core, no Electron window.
 */
import { licensedOpts } from "./licensed.mjs";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-core";
import * as Engine from "../src/engine.mjs";
import * as Flags from "../src/flags.mjs";
import * as Studio from "../src/studio.mjs";
import { ARCHIVE, CATALOG_IN_ARCHIVE, editionsIn } from "../src/publish.mjs";
import { makeKeyFile } from "../src/sign.mjs";
import { clearScratch, dropScratch } from "./scratch.mjs";
import { copyPlants } from "./plant-copy.mjs";

const SELF = fileURLToPath(import.meta.url);
const NL = String.fromCharCode(10);
const HERE = path.dirname(SELF);
const ROOT = path.resolve(HERE, "..");
/* REVIEW_DOOR_HTML=<a copy of ui/index.html beside its scripts> runs the legs on another page, without the plants. */
const HTML_FILE = process.env.REVIEW_DOOR_HTML ? path.resolve(process.env.REVIEW_DOOR_HTML) : path.join(ROOT, "ui", "index.html");
const SCRATCH = path.join(ROOT, "scratch", "review-door");
const ONLY = process.env.REVIEW_DOOR_ONLY || "";
const SHOTS = process.env.REVIEW_DOOR_SHOTS ? path.resolve(process.env.REVIEW_DOOR_SHOTS) : "";
const LEGS = ["rd1", "rd2", "rd3", "rd4", "rd5", "rd6", "rd7", "rd8", "rd9", "rd10", "rd11", "rd12", "rd13", "rd14", "rd15",
  "rd16", "rd17", "rd18", "rd19", "rd20", "rd21", "rd22", "rd24", "rd25", "rd26", "rd27", "rd28", "rd29", "rd30",
  "rd31", "rd32", "rd33", "rd34", "rd35", "rd36", "rd37", "rd38", "rd39", "rd40", "rd42", "rd43", "rd45",
  "rd47", "rd48", "rd49", "rd50", "rd51", "rd52", "rd53", "rd54", "rd55", "rd56", "rd57"];
const PLANTS = 37; /* 40 less the three plants of the retired rd23, rd44 and rd46 (P2) */
const EXPECTED = LEGS.length + PLANTS + 1 + 1;

const CHROME_PATHS = [
  process.env.ETIUDA_CHROME,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
].filter(Boolean);
const executablePath = CHROME_PATHS.find((p) => fs.existsSync(p));
if (!executablePath) { process.stderr.write("No Chrome browser found to drive\n"); process.exit(1); }

let checks = 0, fails = 0, skipped = 0;
function skip(line) { skipped++; process.stdout.write("  SKIP  " + line + "\n"); }
function check(ok, line, detail) {
  checks++;
  const id = /^(rd[0-9]+)/.exec(line);
  if (id && typeof said !== "undefined") said.add(id[1]);
  if (ok) process.stdout.write("  ok   " + line + "\n");
  else { fails++; process.stdout.write("  FAIL " + line + (detail ? ": " + JSON.stringify(detail) : "") + "\n"); }
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const wire = (p) => Promise.resolve(p).then((v) => JSON.parse(JSON.stringify(Object.assign({ error: null }, v))));
const wants = (id) => !ONLY || ONLY === id;
const said = new Set();
/** A part of the run whose page could not be driven fails each of its legs not yet said, rather than ending the run. */
async function guard(ids, fn) {
  try { await fn(); } catch (e) {
    ids.filter((id) => wants(id) && !said.has(id)).forEach((id) => check(false, id + " (threw: " + String(e && e.message || e).split(String.fromCharCode(10))[0].slice(0, 160) + ")"));
  }
}

/* ---- the invented inbox ------------------------------------------------------------------------------------------- */
const LONG = "A lamp bought in December comes back until the end of January, in its box, with the shade wrapped as it"
  + " arrived and the order number inside. ";
function row(i, o) {
  return Object.assign({ key: "r" + i, op: "edit", scope: "card", kind: null, id: "c-" + i, path: "body.en", title: "Row " + i,
    was: "Delivery takes " + i + " days.", becomes: "Delivery takes " + (i + 1) + " days.", decided: false, conflict: false,
    also: [{ field: "shelf", lang: null, text: "Delivery" }] }, o || {});
}
function inbox(nTeam, nImport) {
  const team = Array.from({ length: nTeam }, (_, i) => row(i, i === 0 ? { conflict: true, op: "remove", title: "Changing the bulb" } : {}));
  const imp = Array.from({ length: nImport }, (_, i) => row(100 + i, i === 1 ? { op: "add", title: "Returns after Christmas",
    was: null, becomes: LONG.repeat(14) } : { title: "Imported " + i }));
  /* Each file's rows, and its own one row in the inbox's list. */
  return {
    list: { inbox: "S:\\inbox", proposals: [
      { name: "desk-four.ec", file: "S:\\inbox\\desk-four.ec", ok: true, pending: nTeam, desk: { id: "k-4", name: "Desk four" } },
      { name: "winter.ec", file: "S:\\inbox\\winter.ec", ok: true, pending: nImport, imported: true },
      { name: "done.ec", file: "S:\\inbox\\done.ec", ok: true, pending: 0 }] },
    files: {
      "S:\\inbox\\desk-four.ec": { ok: true, file: "S:\\inbox\\desk-four.ec", name: "desk-four.ec", deskName: "Desk four",
        desk: { id: "k-4", name: "Desk four" }, edition: "2026-11-15T11:42:00.000Z", changes: team, notes: [], proposes: {},
        waiting: {}, pending: nTeam, decidedBefore: 0 },
      "S:\\inbox\\winter.ec": { ok: true, file: "S:\\inbox\\winter.ec", name: "winter.ec", importedFrom: "winter-prices.csv",
        edition: null, changes: imp, notes: [], proposes: {}, waiting: {}, pending: nImport, decidedBefore: 0 },
    },
  };
}

/* The system's motion setting is the machine's, not the leg's: a Windows machine with animations off, as a hosted build
   machine may be, reports reduced motion and every slide and flight measures 0 s. So each page states no preference, and
   rd39 states "reduce" on its own pages, where reduced motion is what it reads. */
const MOTION_ON = [{ name: "prefers-reduced-motion", value: "no-preference" }];

async function boot(browser, data, opened, catalogs, width, lang) {
  const page = await browser.newPage();
  await page.emulateMediaFeatures(MOTION_ON);
  await page.setViewport({ width: width || 1280, height: 800 });
  await page.evaluateOnNewDocument((data, opened, catalogs, lang) => {
    window.__door = data;
    window.__opens = [];
    window.__calls = [];
    const copy = (v) => JSON.parse(JSON.stringify(v));
    const base = {
      host: async () => ({ version: "0.1.0", uiLang: lang || "en", tour: { offered: true, taken: true, at: 0 }, lang: data.lang || "" }),
      projects: async () => ({ root: "C:/studio", projects: catalogs, sample: "" }),
      open: async () => Object.assign(copy(opened), { lint: copy(window.__door.lint) }),
      teams: async () => ({ teams: [{ id: "North quay", projects: [{ id: "harbour", dir: opened.dir, name: "North quay" }], catalogs: ["harbour"], teammates: [] }] }),
      proposals: async (dir) => (window.__realProposals ? window.__realProposals(dir) : copy(window.__door.list)),
      proposalOpen: async (dir, file, l) => {
        window.__opens.push(file);
        if (window.__realProposalOpen) return window.__realProposalOpen(dir, file, l);
        const f = window.__door.files[file];
        if (f) return copy(f);
        return { error: null, ok: false, refusal: "Could not reach " + file + ", perhaps because the file or folder was moved, deleted, or on a drive that is not connected.",
          said: { frame: "Could not reach {P}, perhaps because the file or folder was moved, deleted, or on a drive that is not connected.", vars: { P: file } }, file };
      },
      desks: async () => ({ error: null, folder: "S:\\Team", requests: copy(window.__door.requests) }),
      aiDrafts: async () => ({ error: null, drafts: copy(window.__door.drafts) }),
      aiSettings: async () => ({ provider: window.__door.drafts.length ? "stand-in" : "" }),
      /* Apply's calls, each recorded and answered as the real verb would; window.__hold delays a landing, __failDecide and
         __failAdmit refuse the call as a whole. */
      proposalDecide: async (dir, file, decisions, from, note) => {
        const d = {};
        Object.keys(decisions).sort().forEach((k) => { d[k] = decisions[k]; });
        window.__calls.push(["proposalDecide", file, d, from, note]);
        if (window.__hold) await window.__hold;
        if (window.__failDecide) return { error: null, ok: false, refusal: "refused here", said: null };
        const f = window.__door.files[file];
        if (!f) return { error: null, ok: false, refusal: "Could not reach " + file + ", perhaps because the file or folder was moved, deleted, or on a drive that is not connected.",
          said: { frame: "Could not reach {P}, perhaps because the file or folder was moved, deleted, or on a drive that is not connected.", vars: { P: file } } };
        const acc = [], rej = [];
        Object.keys(d).forEach((k) => { const c = f.changes.find((x) => x.key === k); if (c && !c.decided) { c.decided = true; (d[k] === "accept" ? acc : rej).push(k); } });
        const pending = f.changes.filter((c) => !c.decided).map((c) => c.key);
        f.pending = pending.length;
        const p = window.__door.list.proposals.find((x) => x.file === file);
        if (p) p.pending = pending.length;
        return { error: null, ok: true, accepted: acc, rejected: rej, pending, decidedTo: pending.length ? null : "S:\\archive\\x.ec" };
      },
      deskAdmit: async (dir, typed) => {
        window.__calls.push(["deskAdmit", copy(typed)]);
        if (window.__failAdmit) return { error: "The licence is paused, so teammates cannot be admitted for now." };
        if (window.__admitResult) return copy(window.__admitResult);
        const ids = Object.keys(typed), refIds = new Set(Object.keys(window.__deskRefused || {}));
        const ok = ids.filter((id) => !refIds.has(id));
        const refused = ids.filter((id) => refIds.has(id)).map((id) => ({ id, why: window.__deskRefused[id] }));
        window.__door.requests = window.__door.requests.filter((r) => ok.indexOf(r.id) < 0);
        return { error: null, folder: "S:\\Team", requests: copy(window.__door.requests), admitted: ok, refused };
      },
      deskRefuse: async (dir, id) => {
        window.__calls.push(["deskRefuse", id]);
        if (window.__failDeskRefuse) return copy(window.__failDeskRefuse);
        window.__door.requests = window.__door.requests.filter((r) => r.id !== id);
        return { error: null, folder: "S:\\Team", requests: copy(window.__door.requests) };
      },
      leaveFinding: async (dir, id, why, reason) => {
        window.__calls.push(["leaveFinding", id, why, reason]);
        if (window.__leaveResult) return copy(window.__leaveResult);
        const L = window.__door.lint;
        L.rows = L.rows.filter((r) => !(r.card === id && r.why === why));
        return { error: null, left: true, lint: copy(L) };
      },
      flagKeep: async (dir, id) => {
        window.__calls.push(["flagKeep", id]);
        if (window.__realFlagKeep) return window.__realFlagKeep(dir, id);
        if (window.__flagKeepResult) return copy(window.__flagKeepResult);
        const flags = (window.__door.list && window.__door.list.flags) || [];
        window.__door.list.flags = flags.filter((f) => f.card !== id);
        return { error: null, ok: true, card: id, settled: 1, f: [] };
      },
      aiDraftAccept: async (dir, id, ls, titles, bodies, shelf, requests) => {
        window.__calls.push(["aiDraftAccept", id, ls, titles, bodies, shelf, requests]);
        if (window.__draftAcceptResult) return copy(window.__draftAcceptResult);
        window.__door.drafts = window.__door.drafts.filter((d) => d.id !== id);
        return { error: null, drafts: copy(window.__door.drafts), made: null };
      },
      aiDraftDiscard: async (dir, id) => {
        window.__calls.push(["aiDraftDiscard", id]);
        if (window.__draftDiscardResult) return copy(window.__draftDiscardResult);
        window.__door.drafts = window.__door.drafts.filter((d) => d.id !== id);
        return { error: null, drafts: copy(window.__door.drafts), discarded: true };
      },
      onMaximized: () => {}, onTrayGo: () => {}, onOpenDir: () => {}, onTask: () => {},
      onTeamMoved: () => {}, onRelayLapse: () => {}, onRelaySyncNote: () => {},
    };
    window.STUDIO = new Proxy(base, {
      get(t, k) {
        if (k in t) return t[k];
        if (typeof k !== "string" || k === "then") return undefined;
        return /^on[A-Z]/.test(k) ? () => {} : async () => ({ error: null });
      },
    });
  }, data, opened, catalogs, lang);
  page.on("pageerror", (e) => { if (process.env.REVIEW_DOOR_DEBUG) process.stderr.write("pageerror " + e.message + "\n"); });
  await page.goto("file:///" + HTML_FILE.replace(/\\/g, "/"), { waitUntil: "load" });
  await page.waitForSelector("#rail a", { timeout: 8000 });
  await page.waitForFunction(() => !document.querySelector(".e-launch-veil"), { timeout: 10000 });
  await page.evaluate(() => document.querySelector('#rail [data-act="home"][data-v="library"]').click());
  await page.waitForSelector('#main [data-act="open"]', { timeout: 8000 });
  await page.evaluate(() => document.querySelector('#main [data-act="open"]').click());
  await page.waitForFunction(() => !!document.querySelector('#rail a[data-v="proposals"]'), { timeout: 8000 });
  await sleep(250);
  return page;
}
/** Into the stack by the disc (or the rail's row), waiting until the cards are placed. */
async function enter(page, by) {
  await page.evaluate((by) => {
    const el = by === "rail" ? document.querySelector('#rail a[data-v="proposals"]') : document.querySelector("#discReview");
    el.click();
  }, by || "disc");
  await page.waitForFunction(() => !!document.querySelector("#stk") && (document.querySelector("#stkStage .stk-card.hand")
    || document.querySelector("#stkStage .stk-empty")), { timeout: 8000 }).catch(() => {});
  await sleep(60);
}
/** The stack as the eye sees it: the stage's box, every card's box relative to it, the hand, the chips. */
const look = (page) => page.evaluate(() => {
  /* at rest: the stack's motions finished where they were going */
  document.getAnimations().forEach((a) => { try { const t = a.effect && a.effect.target; if (t && t.closest && t.closest("#stk")) a.finish(); } catch (e) { /* an endless one */ } });
  /* the copy binds a number to its word with a no-break space; the eye reads a space */
  const flat = (s) => String(s || "").split(String.fromCharCode(160)).join(" ");
  const stage = document.querySelector("#stkStage"), sr = stage ? stage.getBoundingClientRect() : null;
  const cards = stage ? Array.from(stage.querySelectorAll(".stk-card:not(.stk-fly):not(.stk-leave)")).map((el) => {
    const r = el.getBoundingClientRect();
    return { key: el.getAttribute("data-key"), hand: el.classList.contains("hand"), kind: el.className.replace(/.*stk-(team|import|model|check|join|flag).*/, "$1"),
      top: Math.round((r.top - sr.top) * 10) / 10, w: Math.round(r.width * 10) / 10, h: Math.round(r.height), op: getComputedStyle(el).opacity,
      title: (el.querySelector(".stk-t") || {}).textContent, changed: !!el.querySelector('[data-changed="1"]') };
  }) : [];
  const chips = Array.from(document.querySelectorAll("#stkKinds .stk-kc")).map((b) => ({ k: b.getAttribute("data-k"),
    text: b.textContent.replace(/\s+/g, " ").trim(), on: b.classList.contains("on"),
    ink: getComputedStyle(b.querySelector("i")).backgroundColor }));
  const pile = document.querySelector("#stkPile"), more = document.querySelector("#stkMore");
  const tray = document.querySelector("#stkTray");
  return { H: sr ? Math.round(sr.height) : 0, sw: sr ? sr.width : 0, cards, chips, hand: cards.find((c) => c.hand) || null,
    lede: flat((document.querySelector("#stkLede") || {}).textContent), h1: (document.querySelector("#stk h1") || {}).textContent || "",
    pileH: pile ? pile.getBoundingClientRect().height : 0, more: more && !more.hidden ? flat(more.textContent) : "",
    empty: flat(Array.from((document.querySelector("#stkStage .stk-empty") || { children: [] }).children).map((e) => e.textContent).join(" ")),
    tray: tray ? tray.getBoundingClientRect().toJSON() : null, stage: sr ? sr.toJSON() : null,
    num: (document.querySelector('#rail a[data-v="proposals"] .num') || {}).textContent,
    section: (document.querySelector("#rail a.on") || {}).getAttribute ? document.querySelector("#rail a.on").getAttribute("data-v") : "" };
});
const key = (page, k) => page.keyboard.press(k);
/** Decided as the eye reads it: the heading, Apply, the lines, each row (newest first) and the quiet button; and the live line. */
const tray = (page) => page.evaluate(() => {
  const flat = (s) => String(s || "").split(String.fromCharCode(160)).join(" ").replace(/\s+/g, " ").trim();
  const t = document.querySelector("#stkTray"), ap = t && t.querySelector("#stkApply");
  return { h: flat((t && t.querySelector("h3") || {}).textContent), apply: ap ? flat(ap.textContent) : "", off: !!(ap && ap.disabled),
    rows: t ? Array.from(t.querySelectorAll("#stkDone .stk-d")).map((d) => ({ key: d.getAttribute("data-key"), t: flat(d.querySelector(".stk-dt").textContent),
      w: flat(d.querySelector(".stk-dw").textContent), ref: flat((d.querySelector(".stk-refused") || {}).textContent),
      no: d.classList.contains("no"), busy: d.classList.contains("busy"), back: !!d.querySelector(".stk-back") })) : [],
    admit: !!(t && t.querySelector("[data-admit]")), admitText: flat((t && t.querySelector("[data-admit]") || {}).textContent), teamRefused: flat((t && t.querySelector("[data-team-refused]") || {}).textContent),
    froms: t ? Array.from(t.querySelectorAll(".stk-from-row")).map((el) => ({ file: flat((el.querySelector(".stk-from-file") || {}).textContent),
      dataFile: (el.querySelector(".stk-from") || {}).getAttribute ? el.querySelector(".stk-from").getAttribute("data-file") : "",
      val: (el.querySelector(".stk-from") || {}).value || "" })) : [],
    wholes: t ? Array.from(t.querySelectorAll(".stk-whole")).map((p) => flat(p.textContent)) : [],
    quiet: !!(t && t.querySelector(".stk-quiet")), said: flat((document.querySelector("#said") || {}).textContent),
    focus: document.activeElement ? document.activeElement.className : "" };
});
/** One answer's key, then the 340 ms the keys rest after it. */
const answer = async (page, k) => { await key(page, k); await sleep(380); };
const chord = async (page, mod, k) => { await page.keyboard.down(mod); await page.keyboard.press(k); await page.keyboard.up(mod); };

async function main() {
  clearScratch(SCRATCH);
  const root = path.join(SCRATCH, "projects");
  fs.mkdirSync(root, { recursive: true });
  const made = await Studio.newProject(root, "Harbour lamps", [{ code: "en", name: "English" }, { code: "pl", name: "Polish" }]);
  const dir = made.dir;
  const shelf = (await Studio.addTag(dir, "shelf", { en: "Delivery", pl: "Dostawa" })).tag.id;
  const ids = [];
  for (const t of ["Courier costs", "Parcel lockers", "Returns window", "Brass arm", "Opal shade"]) {
    const r = await Studio.addCard(dir, shelf, t, t + " in Poland.");
    ids.push(r && r.card ? r.card.id : null);
  }
  const opened = await wire(Studio.openProject(dir));
  const cardIds = (opened.draft && opened.draft.cards ? opened.draft.cards : []).map((c) => c.id);
  const finding = (i) => ({ severity: i % 2 ? "warning" : "error", what: "The Polish text is empty.", where: "", card: cardIds[i % cardIds.length],
    go: null, why: "card " + (i + 1) + ": the Polish text is empty " + i });
  const catalogs = [{ id: "harbour", name: "Harbour lamps", dir, rev: 0, counts: { cards: 5 }, langs: ["en", "pl"],
    changes: 0, checks: 0, opened: "2026-11-15T10:00:00.000Z", edited: "2026-11-15T10:00:00.000Z" }];
  const req = [{ id: "k-3f9a0c71b2e4d856", name: "Cora, at a desk", state: "ready", kind: "desk", asked: "2026-11-15T09:12:00Z" }];
  const draft = [{ id: "d-1", job: "new", fields: { title: { en: "A drafted card" }, body: { en: "Gift wrap is free in December." } } }];
  const eight = Object.assign(inbox(3, 2), { lint: { errors: 1, warnings: 0, rows: [finding(0)] }, requests: req, drafts: draft });
  const forty = Object.assign(inbox(17, 16), { lint: { errors: 3, warnings: 2, rows: [0, 1, 2, 3, 4].map(finding) }, requests: req, drafts: draft });
  const none = { list: { inbox: "S:\\inbox", proposals: [] }, files: {}, lint: { errors: 0, warnings: 0, rows: [] }, requests: [], drafts: [] };

  const browser = await puppeteer.launch({ executablePath, headless: true, args: ["--hide-scrollbars", "--no-sandbox", "--allow-file-access-from-files"] });
  try {
    let page = await boot(browser, eight, opened, catalogs);
    if (wants("rd1") || wants("rd2") || wants("rd3")) await guard(["rd1","rd2","rd3"], async () => {
      await enter(page, "disc");
      const a = await look(page), opens = await page.evaluate(() => window.__opens.slice());
      if (wants("rd1")) {
        await page.evaluate(() => document.querySelector('#rail a[data-v="cards"]').click());
        await sleep(150);
        const gone = await page.evaluate(() => !document.querySelector("#stk"));
        await enter(page, "rail");
        const b = await look(page);
        check(a.h1 === "Review" && a.lede === "Waiting on you: 7. Nothing is written until you apply it." && gone && !!b.hand && b.section === "proposals",
          "rd1 the Review disc opens the stack, and so does the rail's Review row: \"Review\", \"Waiting on you: 7. Nothing is written until you apply it.\" (P2: eight with a request ready for its code, which is no card now)",
          { h1: a.h1, lede: a.lede, gone, rail: !!b.hand, section: b.section });
      }
      if (wants("rd2")) {
        const read = ["S:\\inbox\\desk-four.ec", "S:\\inbox\\winter.ec"].every((f) => opens.indexOf(f) >= 0) && opens.indexOf("S:\\inbox\\done.ec") < 0;
        const sum = a.chips.reduce((n, c) => n + Number((/(\d+)$/.exec(c.text) || [])[1] || 0), 0);
        check(read && sum === 7 && a.num === "7", "rd2 every waiting file is read whole when the door opens (a decided file is not), so its rows are cards: 7 by the chips, 7 on the rail (P2: eight with the request)", { opens, sum, num: a.num });
      }
      if (wants("rd3")) {
        await page.evaluate(() => document.documentElement.setAttribute("data-theme", "light"));
        await sleep(60);
        const words = a.chips.map((c) => c.k + ":" + c.text).join("|");
        const slate = (await look(page)).chips.find((c) => c.k === "model").ink;
        await page.evaluate(() => document.documentElement.setAttribute("data-theme", "dark"));
        await sleep(60);
        const dark = (await look(page)).chips.find((c) => c.k === "model").ink;
        await page.evaluate(() => document.documentElement.setAttribute("data-theme", "light"));
        check(words === "team:From teammates 3|import:Imported 2|model:AI drafts 1|check:Checks 1|flag:Flagged by desks 0"
          && slate === "rgb(71, 85, 105)" && dark === "rgb(154, 164, 178)",
          "rd3 the kind chips count by kind in the kinds' order, the drafts in the neutral slate, #475569 light and #9aa4b2 dark (P2: the Asking to join chip is gone with the request card)", { words, slate, dark });
      }
    });
    if (wants("rd4")) await guard(["rd4"], async () => {
      if (!(await page.$("#stk"))) await enter(page);
      await page.evaluate(() => document.querySelector('#stkKinds [data-k="import"]').click());
      await sleep(60);
      const on = await look(page);
      await page.evaluate(() => document.querySelector('#stkKinds [data-k="import"]').click());
      await sleep(60);
      const off = await look(page);
      const kinds = (l) => Array.from(new Set(l.cards.filter((c) => c.op !== "0").map((c) => c.kind))).sort().join(",");
      check(kinds(on) === "import" && on.cards.length === 2 && on.chips.find((c) => c.k === "import").on && kinds(off) === "check,import,model,team"
        && !off.chips.some((c) => c.on), "rd4 a chip is a filter: Imported pressed holds its two cards only; pressed again, every kind (P2: four kinds wait, the request's is gone)", { on: kinds(on), n: on.cards.length, off: kinds(off) });
    });
    await page.close();
    if (wants("rd5")) await guard(["rd5"], async () => {
      page = await boot(browser, forty, opened, catalogs);
      await enter(page);
      await page.evaluate(() => document.querySelector("#stkStage").focus());
      await key(page, "ArrowDown"); await key(page, "ArrowDown");
      await sleep(40);
      const l = await look(page), hand = l.hand;
      const below = l.cards.filter((c) => c.top > hand.top && !c.hand && c.op === "1").sort((x, y) => x.top - y.top);
      const above = l.cards.filter((c) => c.top < hand.top).sort((x, y) => y.top - x.top);
      const first = below[0], second = below[1];
      const readable = below.filter((c, i) => i === 0 || Math.abs(c.top - below[i - 1].top - 38) < 0.6);
      const last = readable[readable.length - 1];
      const ok = Math.abs(hand.top - 62) < 0.6 && first && Math.abs(first.top - (62 + hand.h + 38 - 44)) < 1.1
        && second && Math.abs(second.top - first.top - 38) < 0.6 && Math.abs(second.w / first.w - (1 - 0.028) / (1 - 0.014)) < 0.003
        && above[0] && Math.abs(above[0].top - (62 - 30)) < 0.6 && last && last.top + 44 <= l.H - 110 + 0.6;
      check(ok, "rd5 the hand's top is 62 px down, the edges below step 38 and narrow 1.4 per cent each, the nearest above shows 30, and no readable edge reaches into the 110 px foot",
        { H: l.H, hand: hand && hand.top, hh: hand && hand.h, first: first && first.top, second: second && second.top, ratio: second && first && second.w / first.w,
          above: above[0] && above[0].top, lastBottom: last && last.top + 44 });
      await page.close();
    });

    /* ---- forty ---------------------------------------------------------------------------------------------------- */
    let t8 = null, t40 = null, n8 = 0, n40 = 0;
    /* The motion a move starts, counted: one animation a card that moves, so a pile of any size starts as many as the cards near the hand. */
    const animsPerMove = (pg) => pg.evaluate(() => {
      const ours = (a) => { const t = a.effect && a.effect.target; return !!(t && t.closest && t.closest("#stk")); };
      document.getAnimations().forEach((a) => { try { if (ours(a)) a.finish(); } catch (e) { /* an endless one */ } });
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "j", bubbles: true, cancelable: true }));
      void document.querySelector("#stkStage").offsetHeight;
      return document.getAnimations().filter(ours).length;
    });
    const timeMoves = async (pg) => pg.evaluate(() => {
      const ms = [];
      for (let i = 0; i < 30; i++) {
        const d = i % 2 ? "ArrowUp" : "ArrowDown";
        const t0 = performance.now();
        document.dispatchEvent(new KeyboardEvent("keydown", { key: d, bubbles: true, cancelable: true }));
        void document.querySelector("#stkStage").offsetHeight;
        ms.push(performance.now() - t0);
      }
      ms.sort((a, b) => a - b);
      return ms[15];
    });
    if (wants("rd6") || wants("rd9")) await guard(["rd6","rd9"], async () => {
      page = await boot(browser, forty, opened, catalogs);
      await enter(page);
      const start = await look(page);
      await page.evaluate(() => document.querySelector("#stkStage").focus());
      for (let i = 0; i < 16; i++) await key(page, "j");
      await sleep(40);
      const l = await look(page);
      if (wants("rd6")) {
        const n = l.cards.length, sum = l.chips.reduce((s, c) => s + Number((/(\d+)$/.exec(c.text) || [])[1] || 0), 0);
        const moreN = Number((/(\d+)$/.exec(start.more) || [])[1] || 0);
        check(sum === 39 && start.cards.length <= 16 && n >= 8 && n <= 22 && start.pileH > 0 && moreN > 0 && moreN < 40,
          "rd6 with thirty-nine waiting (forty with the request that is no card now, P2) only the cards near the hand are elements, at the top and with the hand moved sixteen down; the rest is the pile's drawn block and \"More below\"",
          { sum, first: start.cards.length, elements: n, pile: start.pileH, more: start.more });
      }
      if (wants("rd9")) { n40 = await animsPerMove(page); t40 = await timeMoves(page); }
      await page.close();
      if (wants("rd9")) {
        page = await boot(browser, eight, opened, catalogs);
        await enter(page);
        n8 = await animsPerMove(page);
        t8 = await timeMoves(page);
        await page.close();
        /* A hundred and twenty: past the cards near the hand, the pile's size must cost nothing more. */
        page = await boot(browser, Object.assign(inbox(57, 56), { lint: forty.lint, requests: req, drafts: draft }), opened, catalogs);
        await enter(page);
        await page.evaluate(() => document.querySelector("#stkStage").focus());
        for (let i = 0; i < 16; i++) await key(page, "j");
        const n120 = await animsPerMove(page);
        const t120 = await timeMoves(page);
        await page.close();
        process.stdout.write("#timing a move, keydown to layout, median of 30 alternating moves: eight " + t8.toFixed(2) + " ms, forty "
          + t40.toFixed(2) + " ms, a hundred and twenty " + t120.toFixed(2) + " ms; animations a move starts: " + n8 + ", " + n40 + ", " + n120 + "\n");
        /* WHAT RD9 GUARDS is that a move places only the cards near the hand, so it is measured against this run's own eight on the
           same page and the same load, not against the wall; the count of motions a move starts is load-free and is the proof of
           locality. The absolute 4 ms for forty is the release profile's, held only there, as the tree's other timing limits are.
           The forty-against-eight clause is a guard against the cost drifting, not what catches the plant: stk-all goes red on the
           count every time (113 motions against forty's 33) and on that clause only now and then (the test architect, 2026-11-16).
           THE TWO RELATIVE CLAUSES ARE THE RELEASE PROFILE'S TOO (the test architect, 2026-11-16): load moves eight's and forty's medians
           unevenly, so a ratio of two medians is not load-free; it read 3.5 ms against 3.3 with an area and four runs alive, twice.
           The count of motions stays here in every run. */
        const release = process.env.ETIUDA_PROFILE === "release";
        if (!release) process.stdout.write("#timing forty within 4 ms, forty against eight and a hundred and twenty against forty are held only with"
          + " ETIUDA_PROFILE=release; not held in this run" + NL);
        check((!release || (t40 <= Math.max(t8 * 1.5, t8 + 1.5) && t40 <= 4 && t120 <= Math.max(t40 * 2, t40 + 2))) && n40 > 0 && n120 <= n40 + 1,
          "rd9 a move with a hundred and twenty waiting starts no more motions than forty's (and, under the release profile, forty places within one and a half times eight's median or 1.5 ms more and within 4 ms, a hundred and twenty within twice forty's or 2 ms more): only the cards near the hand are placed and moved (median of 30 moves each, keydown to layout, one page and one load; animations counted by getAnimations after one move)", { t8, t40, t120, n8, n40, n120, release });
      }
    });

    /* ---- moving ------------------------------------------------------------------------------------------------- */
    if (wants("rd7") || wants("rd8") || wants("rd10")) await guard(["rd7","rd8","rd10"], async () => {
      page = await boot(browser, eight, opened, catalogs);
      await page.evaluate(() => document.querySelector('#rail a[data-v="cards"]').click());
      await sleep(150);
      await enter(page);
      if (wants("rd7")) {
        const h0 = (await look(page)).hand.key;
        await page.focus("#q").catch(() => {});
        const inField = await page.evaluate(() => document.activeElement && document.activeElement.id);
        await key(page, "ArrowDown"); await key(page, "j");
        const h1 = (await look(page)).hand.key;
        await page.evaluate(() => { document.activeElement.blur(); document.querySelector("#stkStage").focus(); });
        await key(page, "j");
        const h2 = (await look(page)).hand.key;
        await key(page, "ArrowDown"); await key(page, "k");
        const h3 = (await look(page)).hand.key;
        check(inField === "q" && h1 === h0 && h2 !== h0 && h3 === h2, "rd7 J, K and the arrows move the hand and are silent while focus is in a field", { inField, h0, h1, h2, h3 });
      }
      if (wants("rd8")) {
        const at = async () => (await look(page)).hand.key;
        const wheel = (dy, sel) => page.evaluate((dy, sel) => {
          const t = document.querySelector(sel || "#stkStage");
          t.dispatchEvent(new WheelEvent("wheel", { deltaY: dy, bubbles: true, cancelable: true }));
        }, dy, sel);
        const a0 = await at();
        await wheel(20); await wheel(20); const a1 = await at(); await wheel(20); const a2 = await at();
        await wheel(30); await sleep(360); await wheel(30); const a3 = await at();
        /* the long change in hand: the winter file's second row */
        let guard = 0;
        while (((await look(page)).hand.title || "") !== "Returns after Christmas" && guard++ < 10) await key(page, "j");
        const before = await at();
        const lg = await look(page), lh = lg.hand;
        const lb = lg.cards.filter((c) => c.top > lh.top && c.op === "1").sort((x, y) => x.top - y.top);
        const fits = lb.length >= 2 && Math.abs(lb[1].top - lb[0].top - 38) < 0.6 && lb[1].top + 44 <= lg.H - 110 + 0.6;
        const s0 = await page.evaluate(() => document.querySelector(".stk-card.hand .stk-scroll").scrollTop);
        await page.evaluate(() => { const s = document.querySelector(".stk-card.hand .stk-scroll"); s.scrollTop += 120; });
        await wheel(60, ".stk-card.hand .stk-scroll");
        const mid = await at();
        await page.evaluate(() => { const s = document.querySelector(".stk-card.hand .stk-scroll"); s.scrollTop = s.scrollHeight; });
        await wheel(60, ".stk-card.hand .stk-scroll");
        const end = await at();
        check(a1 === a0 && a2 !== a0 && a3 === a2 && before && mid === before && end !== before && s0 === 0 && fits,
          "rd8 the wheel moves one thing for each 50 px gathered and forgets after 300 ms at rest; over a long change it scrolls the change, and moves the pile at its end, two edges under it clear of the foot",
          { a0, a1, a2, a3, before, mid, end, fits, H: lg.H, edges: lb.slice(0, 2).map((c) => c.top) });
      }
      if (wants("rd10")) {
        await page.evaluate(() => document.querySelector("#stkStage").focus());
        await key(page, "Escape");
        await sleep(120);
        const l = await look(page);
        check(l.section === "cards" && !(await page.$("#stk")), "rd10 Esc leaves the stack for the section it was opened from", { section: l.section });
      }
      await page.close();
    });

    /* ---- changed, the source, nothing ----------------------------------------------------------------------------- */
    if (wants("rd11") || wants("rd12")) await guard(["rd11","rd12"], async () => {
      page = await boot(browser, eight, opened, catalogs);
      await enter(page);
      if (wants("rd11")) {
        await page.evaluate(() => { const f = window.__door.files["S:\\inbox\\desk-four.ec"]; f.changes[2].becomes = "Delivery takes nine days."; });
        await page.evaluate(() => document.querySelector("#stkStage").focus());
        await key(page, "Escape");
        await sleep(120);
        await enter(page);
        const l = await look(page);
        check(l.hand && l.hand.changed && l.hand.title === "Row 2" && l.cards.filter((c) => c.changed).length === 1,
          "rd11 a row whose words changed since the door last read its file comes back first, with \"Changed since you saw it\"", { hand: l.hand });
      }
      if (wants("rd12")) {
        await page.evaluate(() => { const b = document.querySelector(".stk-card.hand .stk-src") || document.querySelector('.stk-src[data-act="stk-src"]'); b.click(); });
        await page.waitForFunction(() => !!document.querySelector("#main table.rvq"), { timeout: 8000 }).catch(() => {});
        const table = await page.evaluate(() => !!document.querySelector("#main table.rvq"));
        await page.evaluate(() => document.querySelector('#main [data-act="rv-back"]').click());
        await page.waitForFunction(() => !!document.querySelector("#stk .stk-card.hand"), { timeout: 8000 }).catch(() => {});
        const back = await page.evaluate(() => !!document.querySelector("#stk .stk-card.hand"));
        check(table && back, "rd12 a card's source opens that file's own table, and its Back returns to the stack", { table, back });
      }
      await page.close();
    });
    for (const leg of ["rd13", "rd14"].filter(wants)) await guard([leg], async () => {
      page = await boot(browser, leg === "rd13" ? none : Object.assign({}, eight, { requests: [] }), opened, catalogs);
      await page.evaluate(() => document.querySelector('#rail a[data-v="proposals"]').click());
      await page.waitForFunction(() => !!document.querySelector("#stkStage .stk-empty, #stkStage .stk-card.hand"), { timeout: 8000 });
      if (leg === "rd13") {
        const l = await look(page);
        check(l.empty.replace(/\s+/g, " ").trim() === "Nothing waits on you. New changes, drafts, findings and requests will show here."
          && l.num === "0" && l.lede === "Waiting on you: 0. Nothing is written until you apply it.",
          "rd13 nothing waits: \"Nothing waits on you.\" and the line of what will show, and the rail reads 0", { empty: l.empty, num: l.num, lede: l.lede });
      } else {
        await page.evaluate(() => document.querySelector('#stkKinds [data-k="flag"]').click());
        await sleep(60);
        const l = await look(page);
        const said = l.empty.replace(/\s+/g, " ").trim();
        await page.evaluate(() => document.querySelector('#stkStage [data-act="stk-all"]').click());
        await sleep(60);
        const all = await look(page);
        check(said === "Nothing waits under Flagged by desks. Waiting elsewhere: 7. Show everything" && all.hand && all.cards.length >= 7,
          "rd14 a kind with nothing under it says so and how many wait elsewhere, and Show everything brings the pile back (P2: the kind is Flagged by desks, where it was Asking to join)", { said, back: all.cards.length });
      }
      await page.close();
    });
    if (wants("rd15")) await guard(["rd15"], async () => {
      page = await boot(browser, eight, opened, catalogs, 900);
      await enter(page);
      const narrow = await look(page);
      await page.setViewport({ width: 1280, height: 800 });
      await sleep(120);
      const wide = await look(page);
      check(narrow.tray && narrow.tray.top >= narrow.stage.bottom - 1 && narrow.sw > 500 && wide.tray.left >= wide.stage.right + 20 && Math.abs(wide.tray.width - 290) < 1,
        "rd15 at 900 px Decided folds under the stack; at 1280 it stands beside it, 290 px wide", { narrow: { tray: narrow.tray, stage: narrow.stage }, wide: { tray: wide.tray, sw: wide.sw } });
      await page.close();
    });

    /* ---- the answers, Decided and Apply ------------------------------------------------------------------------- */
    /** A fresh page of eight in the stack, the stage focused. */
    const fresh = async (data, lang) => {
      const pg = await boot(browser, data || eight, opened, catalogs, null, lang);
      await enter(pg);
      await pg.evaluate(() => document.querySelector("#stkStage").focus());
      return pg;
    };
    const hand = async (pg) => ((await look(pg)).hand || {}).title || "";
    if (wants("rd16")) await guard(["rd16"], async () => {
      page = await fresh();
      const h0 = await hand(page);
      await answer(page, "a");
      const a = await tray(page), la = await look(page);
      await answer(page, "r");
      const b = await tray(page), lb = await look(page);
      check(h0 === "Changing the bulb" && a.rows.length === 1 && a.rows[0].t === "Changing the bulb" && a.rows[0].w === "Accepted · from Desk four" && !a.rows[0].no
        && la.lede === "Waiting on you: 6. Nothing is written until you apply it." && la.hand.title === "Row 1" && !la.cards.some((c) => c.title === "Changing the bulb")
        && b.rows.length === 2 && b.rows[0].t === "Row 1" && b.rows[0].no && b.rows[0].w === "Rejected · from Desk four" && b.h === "Decided: 2"
        && b.apply === "Apply decided: 2" && !b.off && b.said === "Rejected: Row 1. Waiting: 5." && lb.hand.title === "Row 2",
        "rd16 A and R each make a record and the card leaves the pile: Decided newest first, a tick for Accepted and a hollow row for Rejected, \"Apply decided: 2\", the live line (P2: the pile held eight with a request, seven now, so the counts are one less)",
        { h0, a: a.rows, lede: la.lede, b: b.rows, h: b.h, apply: b.apply, said: b.said, hand: lb.hand && lb.hand.title });
      await page.close();
    });
    if (wants("rd17")) await guard(["rd17"], async () => {
      page = await fresh();
      await answer(page, "s");
      const l = await look(page), t = await tray(page);
      for (let i = 0; i < 10; i++) await key(page, "j");
      const end = await look(page);
      const tag = await page.evaluate(() => Array.from(document.querySelectorAll(".stk-card.hand .stk-strip .stk-q")).map((e) => e.textContent).join("|"));
      check(l.hand.title === "Row 1" && l.lede === "Waiting on you: 7. Nothing is written until you apply it." && t.rows.length === 0
        && end.hand.title === "Changing the bulb" && tag.split("|").indexOf("Later") >= 0,
        "rd17 S puts the card in hand at the pile's bottom, still waiting, with its Later tag; nothing is decided", { hand: l.hand.title, lede: l.lede, last: end.hand.title, tag });
      await page.close();
    });
    if (wants("rd18")) await guard(["rd18"], async () => {
      page = await fresh();
      const heldOffer = await page.evaluate(() => !!document.querySelector('.stk-card.hand [data-a="rest"]'));
      await chord(page, "Shift", "A");
      await sleep(380);
      const t0 = await tray(page);
      await key(page, "j");
      const offer = await page.evaluate(() => { const b = document.querySelector('.stk-card.hand [data-a="rest"]'); return b ? b.textContent.split(String.fromCharCode(160)).join(" ") : ""; });
      await chord(page, "Shift", "A");
      await sleep(380);
      const t1 = await tray(page), l = await look(page);
      check(!heldOffer && t0.rows.length === 0 && offer.indexOf("Accept the rest from Desk four: 1") >= 0
        && t1.rows.map((r) => r.t).sort().join(",") === "Row 1,Row 2" && t1.rows.every((r) => !r.no) && l.lede === "Waiting on you: 5. Nothing is written until you apply it."
        && l.cards.some((c) => c.title === "Changing the bulb"),
        "rd18 Shift A accepts the rest of the teammate's file, named with the number of others, and never takes the row held for checking first", { heldOffer, t0: t0.rows.length, offer, t1: t1.rows.map((r) => r.t), lede: l.lede });
      await page.close();
    });
    if (wants("rd19")) await guard(["rd19"], async () => {
      page = await fresh();
      await answer(page, "a");
      await answer(page, "r");
      await chord(page, "Control", "z");
      const one = await tray(page), h1 = await hand(page);
      await chord(page, "Control", "z");
      const none = await tray(page), l = await look(page);
      check(one.rows.length === 1 && one.rows[0].t === "Changing the bulb" && h1 === "Row 1" && none.rows.length === 0 && l.hand.title === "Changing the bulb"
        && l.lede === "Waiting on you: 7. Nothing is written until you apply it.",
        "rd19 Ctrl Z takes back the last answer, then the one before, each card back in hand", { one: one.rows.map((r) => r.t), h1, none: none.rows.length, hand: l.hand.title });
      await page.close();
    });
    if (wants("rd20") || wants("rd21")) await guard(["rd20", "rd21"], async () => {
      page = await fresh();
      await answer(page, "a");
      await answer(page, "a");
      if (wants("rd20")) {
        const two = await tray(page);
        await page.evaluate(() => { const rows = document.querySelectorAll("#stkDone .stk-d"); rows[rows.length - 1].querySelector(".stk-back").click(); });
        await sleep(60);
        const t = await tray(page), h = await hand(page);
        check(two.rows.length === 2 && t.rows.length === 1 && t.rows[0].t === "Row 1" && h === "Changing the bulb",
          "rd20 Take back on a Decided row returns that card to the hand and leaves the other answer", { two: two.rows.map((r) => r.t), after: t.rows.map((r) => r.t), hand: h });
        await answer(page, "r");
      }
      if (wants("rd21")) {
        const before = await tray(page);
        await page.evaluate(() => document.querySelector("#stkTray .stk-quiet").click());
        await sleep(60);
        const t = await tray(page), l = await look(page);
        check(before.rows.length === 2 && before.quiet && t.rows.length === 0 && !t.quiet && t.off && t.apply === "Apply decided: 0"
          && l.lede === "Waiting on you: 7. Nothing is written until you apply it.",
          "rd21 Take everything back, the quiet button at Decided's foot, empties Decided and the pile holds all seven again (P2: eight with the request)", { before: before.rows.length, after: t.rows.length, apply: t.apply, lede: l.lede });
      }
      await page.close();
    });
    if (wants("rd22")) await guard(["rd22"], async () => {
      page = await fresh();
      await key(page, "a"); await key(page, "a");
      const one = await tray(page);
      await sleep(380);
      await key(page, "a");
      const two = await tray(page);
      check(one.rows.length === 1 && two.rows.length === 2, "rd22 a second A within the 340 ms of an answer is ignored; after it, A answers again", { one: one.rows.length, two: two.rows.length });
      await page.close();
    });
    /* RETIRED, P2 (a request is no card, and no code is typed): rd23, "a request's A with no code puts the caret in the code field, where A, R and J type and decide nothing; Esc leaves the field; Enter admits, and Decided says an admission cannot be taken back". */
    const two = Object.assign({}, eight, { requests: req.concat([{ id: "k-77aa01bb", name: "Dorian, at a desk", state: "ready", kind: "desk", asked: "2026-11-15T09:30:00Z" }]) });
    if (wants("rd24")) await guard(["rd24"], async () => {
      page = await fresh(two);
      await key(page, "j");
      for (const k of ["a", "r", "a", "r", "a", "r"]) await answer(page, k);
      const before = await tray(page);
      await page.evaluate(() => { window.__hold = new Promise((r) => { window.__release = r; }); document.querySelector("#stkApply").click(); });
      await sleep(80);
      const during = await tray(page);
      await page.evaluate(() => document.querySelector("#stkStage").focus());
      await key(page, "a");
      await sleep(60);
      const usable = await tray(page);
      await page.evaluate(() => window.__release());
      await page.waitForFunction(() => /^Apply decided/.test((document.querySelector("#stkApply") || {}).textContent || ""), { timeout: 8000 }).catch(() => {});
      await sleep(120);
      const after = await tray(page), l = await look(page);
      const calls = (await page.evaluate(() => window.__calls)).map((c) => JSON.stringify(c)).sort();
      const want = [
        ["proposalDecide", "S:\\inbox\\desk-four.ec", { r1: "accept", r2: "reject" }, "Desk four", null],
        ["proposalDecide", "S:\\inbox\\winter.ec", { r100: "accept", r101: "reject" }, "winter-prices.csv", null],
        ["leaveFinding", cardIds[0], "card 1: the Polish text is empty 0", null],
        ["aiDraftAccept", "d-1", ["en", "pl"], ["A drafted card", ""], ["Gift wrap is free in December.", ""], "", []],
      ].map((c) => JSON.stringify(c)).sort();
      check(before.rows.length === 6 && before.apply === "Apply decided: 6" && during.apply === "Applying: 6…" && during.off && during.rows.every((r) => r.busy && !r.back)
        && usable.rows.length === 7 && usable.rows[0].t === "Changing the bulb" && usable.rows[0].back && !usable.rows[0].busy
        && JSON.stringify(calls) === JSON.stringify(want) && after.rows.length === 1 && after.rows[0].t === "Changing the bulb" && after.apply === "Apply decided: 1"
        && after.wholes.join("|") === "winter-prices.csv: applied in full and removed from the inbox." && l.lede === "Waiting on you: 0. Nothing is written until you apply it.",
        "rd24 Apply writes each kind through its own call (each file's rows with its attribution, the left finding, the draft; P2: the admissions and the refusal went with the request card); while it runs it reads \"Applying: 6…\", its rows dimmed without Take back and the pile still answering; after it, what was written leaves Decided",
        { before: before.apply, during: during.apply, busy: during.rows.map((r) => r.busy + "/" + r.back), usable: usable.rows.length, calls, after: after.rows.map((r) => r.t), apply: after.apply, wholes: after.wholes, lede: l.lede });
      await page.close();
    });
    if (wants("rd25")) await guard(["rd25"], async () => {
      page = await fresh();
      await page.evaluate(() => { window.__failDecide = true; window.__failAdmit = true; });
      await key(page, "j");
      await answer(page, "a");
      for (let i = 0; i < 4; i++) await key(page, "j");
      const f = await look(page);
      await answer(page, "r");
      await page.evaluate(() => document.querySelector("#stkApply").click());
      await page.waitForFunction(() => /^Apply decided/.test((document.querySelector("#stkApply") || {}).textContent || ""), { timeout: 8000 }).catch(() => {});
      await sleep(120);
      const after = await tray(page);
      const calls = (await page.evaluate(() => window.__calls)).map((c) => c[0]).sort().join(",");
      check(f.hand.kind === "check" && calls === "leaveFinding,proposalDecide" && after.rows.map((r) => r.t).sort().join("|") === "Row 1"
        && after.rows.every((r) => r.back) && !after.off,
        "rd25 a landing refused leaves its record in Decided, Take back and Apply still there; the finding that was written leaves (P2: and no longer an admission refused as a whole)",
        { kind: f.hand.kind, calls, after: after.rows.map((r) => r.t), off: after.off });
      await page.close();
    });
    if (wants("rd26")) await guard(["rd26"], async () => {
      const langDraft = { id: "d-pl", job: "language", card: cardIds[0], lang: "pl",
        fields: { body: { pl: "Inny tekst." }, title: { pl: "" } } };
      const door = Object.assign({}, eight, { drafts: draft.concat([langDraft]) });
      const one = Object.assign(inbox(1, 0), { lint: { errors: 0, warnings: 0, rows: [] }, requests: [], drafts: [] });
      const strip = (pg) => pg.evaluate(() => {
        const el = document.querySelector(".stk-card.hand");
        if (!el) return null;
        return { title: (el.querySelector(".stk-t") || {}).textContent || "",
          tag: (el.querySelector(".stk-tag") || {}).textContent || "",
          src: (el.querySelector(".stk-src") || {}).textContent || "",
          kind: (el.className.match(/stk-(team|import|model|check|join|flag)/) || [])[1] || "" };
      });
      const walk = async (pg) => {
        await pg.evaluate(() => { const s = document.querySelector("#stkStage"); if (s) s.focus(); });
        const seen = [];
        for (let i = 0; i < 12; i++) {
          const s = await strip(pg);
          if (s) seen.push(s);
          await key(pg, "j");
          await sleep(25);
        }
        return seen;
      };
      const pick = (seen, kind, title) => seen.find((s) => s.kind === kind && s.title === title) || { tag: "", src: "" };
      const saidEmpty = async (data) => {
        const pg = await boot(browser, data, opened, catalogs);
        await pg.evaluate(() => document.querySelector('#rail a[data-v="proposals"]').click());
        await pg.waitForFunction(() => !!document.querySelector("#stkStage .stk-empty"), { timeout: 8000 });
        const text = (await look(pg)).empty.replace(/\s+/g, " ").trim();
        await pg.close();
        return text;
      };
      const saidApplied = async (data) => {
        const pg = await boot(browser, data, opened, catalogs);
        await enter(pg);
        await pg.evaluate(() => document.querySelector("#stkStage").focus());
        await answer(pg, "a");
        await pg.evaluate(() => document.querySelector("#stkApply").click());
        await pg.waitForFunction(() => /Applied:|Zastosowano:/.test((document.querySelector("#stkStage .stk-empty") || {}).textContent || ""), { timeout: 8000 });
        const text = (await look(pg)).empty.replace(/\s+/g, " ").trim();
        await pg.close();
        return text;
      };
      page = await boot(browser, door, opened, catalogs);
      await enter(page);
      const en = await walk(page);
      const chips = (await look(page)).chips.map((c) => c.k + ":" + c.text).join("|");
      await page.close();
      const empty = await saidEmpty(none);
      const applied = await saidApplied(one);
      page = await boot(browser, Object.assign({}, door, { lang: "pl" }), opened, catalogs);
      await enter(page);
      const pl = await walk(page);
      const plChips = (await look(page)).chips.map((c) => c.k + ":" + c.text).join("|");
      await page.close();
      const plEmpty = await saidEmpty(Object.assign({}, none, { lang: "pl" }));
      const plApplied = await saidApplied(Object.assign({}, one, { lang: "pl" }));
      const draftEn = pick(en, "model", "A drafted card"), langEn = pick(en, "model", "Courier costs");
      const teamEn = pick(en, "team", "Row 1"), findEn = pick(en, "check", "Courier costs");
      const draftPl = pick(pl, "model", "A drafted card"), langPl = pick(pl, "model", "Courier costs");
      const teamPl = pick(pl, "team", "Row 1"), findPl = pick(pl, "check", "Courier costs");
      const ok = chips.indexOf("model:AI drafts 2") >= 0
        && draftEn.tag === "AI draft: new card" && langEn.tag === "AI draft: Polish text"
        && teamEn.src === "from Desk four" && findEn.src === "from the checks"
        && empty === "Nothing waits on you. New changes, drafts, findings and requests will show here."
        && applied === "Nothing waits on you. Applied: 1. New changes, drafts, findings and requests will show here."
        && plChips.indexOf("model:Szkice AI 2") >= 0
        && draftPl.tag === "Szkic AI: nowa karta" && langPl.tag === "Szkic AI: tekst w języku Polski"
        && teamPl.src === "od stanowiska Desk four" && findPl.src === "z kontroli"
        && plEmpty === "Nic nie czeka na decyzję. Tu pojawią się nowe zmiany, szkice, uwagi i prośby."
        && plApplied === "Nic nie czeka na decyzję. Zastosowano: 1. Tu pojawią się nowe zmiany, szkice, uwagi i prośby.";
      check(ok, "rd26 the copywriter's five words: the drafts' chip and tags, both nothing-waits lines, a desk as od stanowiska, a finding from the checks, in English and in Polish",
        { chips, draftEn, langEn, teamEn, findEn, empty, applied, plChips, draftPl, langPl, teamPl, findPl, plEmpty, plApplied });
    });
    if (wants("rd27")) await guard(["rd27"], async () => {
      const two = Object.assign(inbox(2, 0), { lint: { errors: 0, warnings: 0, rows: [] }, requests: [], drafts: [] });
      const readSent = (pg) => pg.evaluate(() => {
        const hand = document.querySelector(".stk-card.hand");
        const was = hand ? hand.querySelector(".stk-was") : null;
        const flat = (s) => String(s || "").split(String.fromCharCode(160)).join(" ");
        return { title: hand ? (hand.querySelector(".stk-t") || {}).textContent : "",
          chip: !!(hand && hand.querySelector('[data-changed="1"]')), sent: flat(was ? was.textContent : "") };
      });
      const changed = async (data) => {
        const pg = await boot(browser, data, opened, catalogs);
        await enter(pg);
        await pg.evaluate(() => document.querySelector("#stkStage").focus());
        await answer(pg, "a");
        await pg.evaluate(() => {
          const f = window.__door.files["S:\\inbox\\desk-four.ec"];
          f.changes[0].becomes = "The bulb is changed.";
          f.changes[1].becomes = "Delivery takes nine days.";
        });
        await pg.evaluate(() => document.querySelector("#stkStage").focus());
        await key(pg, "Escape");
        await sleep(120);
        await enter(pg);
        const first = await readSent(pg);
        await pg.evaluate(() => document.querySelector("#stkStage").focus());
        await key(pg, "j");
        await sleep(40);
        const second = await readSent(pg);
        await pg.close();
        return { first, second };
      };
      const en = await changed(two);
      const pl = await changed(Object.assign({}, two, { lang: "pl" }));
      const clock = (s) => ((/\d{2}:\d{2}/.exec(s) || [])[0] || "");
      const ok = en.first.title === "Changing the bulb" && en.first.chip
        && /^Desk four sent this again at \d{2}:\d{2}, so the earlier answer was dropped\.$/.test(en.first.sent)
        && en.second.title === "Row 1" && en.second.chip
        && /^Desk four sent this again at \d{2}:\d{2}\.$/.test(en.second.sent)
        && clock(en.first.sent) && clock(en.first.sent) === clock(en.second.sent)
        && pl.first.chip && /^Stanowisko Desk four przesłało to ponownie o \d{2}:\d{2}, więc wcześniejsza decyzja przestała obowiązywać\.$/.test(pl.first.sent)
        && pl.second.chip && /^Stanowisko Desk four przesłało to ponownie o \d{2}:\d{2}\.$/.test(pl.second.sent)
        && clock(pl.first.sent) === clock(pl.second.sent);
      check(ok, "rd27 a card changed since it was seen always says who sent it again and when, and says the earlier answer was dropped only when one was",
        { en, pl });
    });
    if (wants("rd28")) await guard(["rd28"], async () => {
      const edit = (i, title, also) => ({ key: "b" + i, op: "edit", scope: "card", kind: null, id: cardIds[i], path: "body.en",
        title, was: "Was " + i + ".", becomes: "Now " + i + ".", decided: false, conflict: false, also: also || [] });
      const team = [edit(0, "Courier costs"), edit(1, "Parcel lockers")];
      const imp = [edit(4, "Imported shade", [{ field: "shelf", lang: null, text: "Care" }])];
      const door = {
        list: { inbox: "S:\\inbox", proposals: [
          { name: "desk-four.ec", file: "S:\\inbox\\desk-four.ec", ok: true, pending: 2, desk: { id: "k-4", name: "Desk four" } },
          { name: "winter.ec", file: "S:\\inbox\\winter.ec", ok: true, pending: 1, imported: true }] },
        files: {
          "S:\\inbox\\desk-four.ec": { ok: true, file: "S:\\inbox\\desk-four.ec", name: "desk-four.ec", deskName: "Desk four",
            desk: { id: "k-4", name: "Desk four" }, edition: "2026-11-15T11:42:00.000Z", changes: team, notes: [], proposes: {},
            waiting: {}, pending: 2, decidedBefore: 0 },
          "S:\\inbox\\winter.ec": { ok: true, file: "S:\\inbox\\winter.ec", name: "winter.ec", importedFrom: "winter-prices.csv",
            edition: null, changes: imp, notes: [], proposes: {}, waiting: {}, pending: 1, decidedBefore: 0 },
        },
        lint: { errors: 1, warnings: 1, rows: [
          { severity: "error", what: "The Polish text is empty.", where: "", card: cardIds[3], go: null, why: "brass empty" },
          { severity: "warning", what: "A finding with no card.", where: "", card: "no-such", go: null, why: "no card here" }] },
        requests: req,
        drafts: [
          { id: "d-lang", job: "language", card: cardIds[2], lang: "pl", fields: { body: { pl: "Inny." }, title: { pl: "" } } },
          { id: "d-new", job: "new", fields: { title: { en: "A drafted card" }, body: { en: "Gift wrap is free." } } },
          { id: "d-shelf", job: "new", fields: { title: { en: "Shaded draft" }, body: { en: "A shade." }, shelf } },
        ],
      };
      const read = async (data) => {
        const pg = await boot(browser, data, opened, catalogs);
        await enter(pg);
        const rows = await pg.evaluate(() => Array.from(document.querySelectorAll("#stkStage .stk-card")).map((el) => {
          const cat = el.querySelector(".stk-cat");
          const src = el.querySelector(".stk-src");
          const br = el.getBoundingClientRect();
          const cr = cat ? cat.getBoundingClientRect() : null;
          const sr = src ? src.getBoundingClientRect() : null;
          return { kind: (el.className.match(/stk-(team|import|model|check|join)/) || [])[1] || "",
            title: (el.querySelector(".stk-t") || {}).textContent || "", cat: cat ? cat.textContent : "",
            hand: el.classList.contains("hand"), op: getComputedStyle(el).opacity,
            gap: cr ? Math.round((br.right - cr.right) * 10) / 10 : null,
            srcBefore: !!(cr && sr ? cr.left + 0.5 >= sr.right : !src) };
        }));
        await pg.close();
        return rows;
      };
      const en = await read(door);
      const pl = await read(Object.assign({}, door, { lang: "pl" }));
      const one = (rows, kind, title) => rows.find((r) => r.kind === kind && r.title === title) || { cat: "missing", op: "0", gap: null };
      const placed = (r) => !!r.cat && r.op === "1" && r.gap >= 2 && r.gap <= 28 && r.srcBefore;
      const hand = one(en, "team", "Courier costs"), edge = one(en, "team", "Parcel lockers");
      const care = one(en, "import", "Imported shade"), lang = one(en, "model", "Returns window");
      const fresh = one(en, "model", "A drafted card"), shaded = one(en, "model", "Shaded draft");
      const brass = one(en, "check", "Brass arm"), lost = one(en, "check", "A finding with no card.");
      const plLang = one(pl, "model", "Returns window");
      const ok = hand.cat === "Delivery" && hand.hand && placed(hand) && edge.cat === "Delivery" && !edge.hand && placed(edge)
        && care.cat === "Care" && lang.cat === "Delivery" && fresh.cat === "" && shaded.cat === "Delivery"
        && brass.cat === "Delivery" && lost.cat === "" && plLang.cat === "Delivery"; /* P2: a request's card, whose chip was empty, is no card */
      check(ok, "rd28 the category chip is on the hand and on an edge wherever the row carries its card's category, at the right of the source",
        { hand, edge, care, lang, fresh, shaded, brass, lost, plLang, n: en.length });
    });
    if (wants("rd29")) await guard(["rd29"], async () => {
      const hintOf = async (data) => {
        const pg = await boot(browser, data, opened, catalogs);
        await enter(pg);
        const h = await pg.evaluate(() => {
          const el = document.querySelector("#stkHint");
          const kbds = el ? Array.from(el.querySelectorAll("kbd")) : [];
          const sample = document.querySelector(".stk-k:not(.yes) kbd");
          const box = (n) => { const s = getComputedStyle(n); return { font: s.fontFamily, size: s.fontSize, pad: s.padding,
            bw: s.borderTopWidth, bs: s.borderTopStyle, radius: s.borderRadius }; };
          return { text: el ? el.textContent : "", keys: kbds.map((k) => k.textContent), boxes: kbds.map(box),
            sample: sample ? box(sample) : null };
        });
        await pg.close();
        return h;
      };
      const same = (a, b) => !!(a && b && a.font === b.font && a.size === b.size && a.pad === b.pad
        && a.bw === b.bw && a.bs === b.bs && a.radius === b.radius);
      const en = await hintOf(eight);
      const pl = await hintOf(Object.assign({}, eight, { lang: "pl" }));
      const enWords = "Up, Down or the wheel to move · A yes · R no · S later · Ctrl+Z takes the last one back";
      const plWords = "Góra, Dół lub kółko: przejście · A tak · R nie · S później · Ctrl+Z cofa ostatnią decyzję";
      const ok = en.text === enWords && en.keys.join(",") === "Up,Down,A,R,S,Ctrl+Z" && en.boxes.length === 6
        && en.boxes.every((b) => same(b, en.sample))
        && pl.text === plWords && pl.keys.join(",") === "Góra,Dół,A,R,S,Ctrl+Z" && pl.boxes.every((b) => same(b, pl.sample));
      check(ok, "rd29 Up, Down, A, R, S and Ctrl+Z take the answer buttons' key boxes, and the words between them stay as they are",
        { en, pl });
    });
    if (wants("rd30")) await guard(["rd30"], async () => {
      const placeOf = async (data) => {
        const pg = await boot(browser, data, opened, catalogs);
        await enter(pg);
        const m = await pg.evaluate(() => {
          const flat = (s) => String(s || "").split(String.fromCharCode(160)).join(" ");
          const stage = document.querySelector("#stkStage");
          const more = document.querySelector("#stkMore");
          const pile = document.querySelector("#stkPile");
          const sr = stage.getBoundingClientRect();
          const mr = more && !more.hidden ? more.getBoundingClientRect() : null;
          const pr = pile ? pile.getBoundingClientRect() : null;
          const sum = Array.from(document.querySelectorAll("#stkKinds .stk-kc b")).reduce((n, b) => n + (Number(b.textContent) || 0), 0);
          const readable = Array.from(document.querySelectorAll("#stkStage .stk-card")).filter((el) => getComputedStyle(el).opacity === "1").length;
          return { sum, readable, text: mr ? flat(more.textContent) : "",
            pileH: pr ? pr.height : 0,
            leftOf: !!(mr && mr.right < sr.left + sr.width / 2),
            atLeft: !!(mr && pr && Math.abs(mr.left - pr.left) <= 12),
            atFoot: !!(mr && pr && pr.height > 0 && Math.abs(mr.bottom - pr.bottom) <= 10),
            inStage: !!(mr && mr.left >= sr.left - 1 && mr.right <= sr.right + 1 && mr.top >= sr.top - 1 && mr.bottom <= sr.bottom + 1) };
        });
        await pg.close();
        return m;
      };
      const oneDoor = Object.assign(inbox(1, 0), { lint: { errors: 0, warnings: 0, rows: [] }, requests: [], drafts: [] });
      const many = await placeOf(forty);
      const one = await placeOf(oneDoor);
      const n = many.sum - many.readable;
      const ok = many.pileH > 0 && many.inStage && many.leftOf && many.atLeft && many.atFoot
        && many.text === "More below: " + n && n > 0 && n < many.sum
        && one.pileH < 2 && one.text === "";
      check(ok, "rd30 with forty waiting, More below sits at the block's foot, left of the stage's middle, and reads how many are not readable; with one card and no block it is absent",
        { many, one, n });
    });
    if (wants("rd31")) await guard(["rd31"], async () => {
      const bodyOf = (pg) => pg.evaluate(() => {
        const sc = document.querySelector(".stk-card.hand .stk-scroll");
        const cs = sc ? getComputedStyle(sc) : null;
        const mask = cs ? (cs.webkitMaskImage || cs.maskImage || "none") : "none";
        return { title: (document.querySelector(".stk-card.hand .stk-t") || {}).textContent || "",
          over: !!(sc && sc.scrollHeight > sc.clientHeight + 1),
          fade: !!(sc && sc.classList.contains("is-fading")),
          masked: mask !== "none" && /gradient/.test(mask),
          dots: sc ? /\u2026|\.\.\./.test(sc.textContent) : true };
      });
      page = await boot(browser, eight, opened, catalogs);
      await enter(page);
      await page.evaluate(() => document.querySelector("#stkStage").focus());
      const short = await bodyOf(page);
      for (let i = 0; i < 4; i++) await key(page, "j");
      await sleep(40);
      const long = await bodyOf(page);
      await page.evaluate(() => {
        const sc = document.querySelector(".stk-card.hand .stk-scroll");
        if (sc) { sc.scrollTop = sc.scrollHeight; sc.dispatchEvent(new Event("scroll")); }
      });
      await sleep(30);
      const end = await bodyOf(page);
      await page.close();
      const ok = !short.over && !short.fade && !short.dots
        && long.title === "Returns after Christmas" && long.over && long.fade && long.masked && !long.dots
        && end.over && !end.fade && !end.masked && !end.dots;
      check(ok, "rd31 a body taller than its box fades its foot until it is scrolled to the end, and a short body does not; the text grows no ellipsis",
        { short, long, end });
    });
    if (wants("rd32")) await guard(["rd32"], async () => {
      const listOf = (pg) => pg.evaluate(() => {
        const el = document.querySelector("#stkDone");
        const cs = el ? getComputedStyle(el) : null;
        const raw = cs ? (cs.webkitMaskImage && cs.webkitMaskImage !== "none" ? cs.webkitMaskImage : (cs.maskImage || "none")) : "none";
        return { over: !!(el && el.scrollHeight > el.clientHeight + 1),
          fade: !!(el && el.classList.contains("is-fading")),
          masked: raw !== "none" && /gradient/.test(raw),
          n: el ? el.querySelectorAll(".stk-d").length : 0,
          sh: el ? el.scrollHeight : 0, ch: el ? el.clientHeight : 0 };
      });
      page = await boot(browser, eight, opened, catalogs);
      await enter(page);
      await page.evaluate(() => document.querySelector("#stkStage").focus());
      await answer(page, "a");
      const few = await listOf(page);
      for (const k of ["a", "r", "a", "a", "a", "r"]) await answer(page, k);
      await sleep(80);
      await page.waitForFunction(() => /Nothing left to decide/.test((document.querySelector("#stkStage .stk-empty") || {}).textContent || ""), { timeout: 8000 });
      const many = await listOf(page);
      await page.evaluate(() => {
        const el = document.querySelector("#stkDone");
        if (el) { el.scrollTop = el.scrollHeight; el.dispatchEvent(new Event("scroll")); }
      });
      await sleep(30);
      const end = await listOf(page);
      await page.close();
      const ok = few.n === 1 && !few.over && !few.fade
        && many.n === 7 && many.over && many.fade && many.masked
        && end.over && !end.fade && !end.masked;
      check(ok, "rd32 Decided's list fades its foot while it scrolls and more remains, and does not when it is at its end or when one row fits",
        { few, many, end });
    });
    if (wants("rd51")) await guard(["rd51"], async () => {
      /* A TITLE THAT RUNS OUT FADES AND NEVER ENDS IN DOTS, as the eye sees it (tests/fade-off.mjs holds the sheet and the
         selector; the test architect, 2026-11-16): a 200-character title on the hand, and in Decided once answered, is one
         line the cut pass has marked at its right end with its whole words as the tooltip; a short title is left alone. */
      const longTitle = "Returning a lamp bought in December when its shade arrived cracked and the box is gone. ".repeat(3).slice(0, 200);
      const data = JSON.parse(JSON.stringify(eight));
      data.files["S:\\inbox\\desk-four.ec"].changes[1].title = longTitle;
      const titleOf = (pg, sel, want) => pg.evaluate((sel, want) => {
        const el = Array.from(document.querySelectorAll(sel)).find((e) => (e.textContent || "") === want) || null;
        if (!el) return null;
        const cs = getComputedStyle(el);
        return { cut: el.classList.contains("is-cut"), right: el.classList.contains("cut-r"), over: el.scrollWidth > el.clientWidth + 1,
          clip: cs.textOverflow, wrap: cs.whiteSpace, tip: el.getAttribute("title") || "",
          dots: el.textContent.indexOf(String.fromCharCode(8230)) >= 0 || el.textContent.indexOf("...") >= 0 };
      }, sel, want);
      const handTitle = (pg) => pg.evaluate(() => (document.querySelector(".stk-card.hand .stk-t") || {}).textContent || "");
      page = await boot(browser, data, opened, catalogs);
      await enter(page);
      await page.evaluate(() => document.querySelector("#stkStage").focus());
      const first = await handTitle(page);
      await sleep(120);
      const short = await titleOf(page, ".stk-card.hand .stk-t", first);
      for (let i = 0; i < 12 && (await handTitle(page)) !== longTitle; i++) { await key(page, "j"); await sleep(40); }
      await sleep(160);
      const rest = await titleOf(page, ".stk-card.hand .stk-t", longTitle);
      await answer(page, "a");
      await sleep(160);
      const done = await titleOf(page, "#stkDone .stk-dt", longTitle);
      await page.close();
      const faded = (t) => !!t && t.cut && t.right && t.over && t.clip === "clip" && t.wrap === "nowrap" && t.tip === longTitle.trim() && !t.dots;
      const ok = longTitle.length === 200 && first !== longTitle && !!short && !short.cut && !short.dots && faded(rest) && faded(done);
      check(ok, "rd51 a 200-character title fades at its end on the hand and in Decided, one line with its whole words as the tooltip,"
        + " and neither ends in an ellipsis; a short title is left as it is", { first, short, rest, done });
    });
    if (wants("rd56")) await guard(["rd56"], async () => {
      /* THE LEDE RUNS ON ONE LINE WHERE THERE IS ROOM, and the chips stay where they are (the product designer, 2026-11-16: "the
         lede on one line where there is room, by the container query on the door's own stk, with the chips untouched at every
         width"; and her ruling of the same day: "one number, 1116, both languages"). The threshold is the stk container's content
         width, 1116: the lowest width above the last one at which the chips differed with the rule forced on, measured on 2026-11-16
         over the widest case the door can show (every count the widest two digits, "44" on the stand-in, the lede's number the widest
         three; English last differing at 980, Polish at 1112), plus four px. Each case is read with the rule as the page has it and
         again with it undone (flex-shrink back to 1): at 900, 1280, 1370 and 1380 (container 1110 and 1120, either side of 1116) every
         chip's left edge and row must be the same either way, and the lede must be one line from 1380 up and keep the lines it has
         without the rule below. Three cases: the committed fixture in English (its own counts), then the widest case in English and
         in Polish. The leg holds no pixel value of the stand-in's fonts: both reads are the page's own. */
      const readCase = async (lang, widest, width) => {
        const pg = await boot(browser, eight, opened, catalogs, width, lang);
        await enter(pg);
        if (widest) await pg.evaluate(() => {
          const b = document.querySelector("#stkKinds .stk-kc b"), keep = b.textContent;
          let best = 0, bw = 0;
          for (let d = 0; d <= 9; d++) { b.textContent = String(d) + String(d); const w = b.getBoundingClientRect().width; if (w > bw) { bw = w; best = d; } }
          b.textContent = keep;
          document.querySelectorAll("#stkKinds .stk-kc b").forEach((x) => { x.textContent = String(best) + String(best); });
          const lede = document.querySelector("#stkLede");
          lede.textContent = lede.textContent.replace(/[0-9]+/, String(best) + String(best) + String(best));
        });
        const take = () => pg.evaluate(() => {
          const lede = document.querySelector("#stkLede"), kinds = document.querySelector("#stkKinds"), stk = document.querySelector("#stk");
          const lh = parseFloat(getComputedStyle(lede).lineHeight) || 20, cs = getComputedStyle(stk);
          const c = Array.from(kinds.querySelectorAll(".stk-kc")).map((e) => { const b = e.getBoundingClientRect(); return [Math.round(b.left), Math.round(b.top)]; });
          return { lines: Math.round(lede.getBoundingClientRect().height / lh), six: c.length, x: c.map((e) => e[0]).join(","), rows: c.map((e) => (e[1] - c[0][1]) / 32).join(","),
            cw: Math.round(stk.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight)) };
        });
        const withRule = await take();
        await pg.evaluate(() => { const st = document.createElement("style"); st.textContent = ".stk-ttl{flex-shrink:1 !important}"; document.head.appendChild(st); });
        const without = await take();
        await pg.close();
        return { withRule, without };
      };
      const got = {};
      for (const [tag, lang, widest] of [["fixture-en", "en", false], ["widest-en", "en", true], ["widest-pl", "pl", true]]) {
        for (const w of [900, 1280, 1370, 1380]) got[tag + " " + w] = await readCase(lang, widest, w);
      }
      const bad = Object.keys(got).filter((k) => {
        const r = got[k], w = Number(k.split(" ")[1]);
        return !(r.withRule.six === 5 && r.withRule.x === r.without.x && r.withRule.rows === r.without.rows
          && (w >= 1380 ? r.withRule.lines === 1 : r.withRule.lines === r.without.lines));
      });
      check(bad.length === 0 && Object.keys(got).length === 12,
        "rd56 with five kinds in the stack (six before P2, the request's gone), the committed fixture in English and the widest case (counts 44, lede 444) in English and in Polish: at 900, 1280, 1370 and 1380 every chip is where it is without the rule, and the lede is one line from 1380 (container 1120, over the query's 1116) and as it is without the rule below",
        { bad, got });
    });
    if (wants("rd33")) await guard(["rd33"], async () => {
      const edit = (i, title, also) => ({ key: "p" + i, op: "edit", scope: "card", kind: null, id: cardIds[i], path: "body.en",
        title, was: "Was.", becomes: "Now.", decided: false, conflict: false, also: also || [] });
      const door = {
        lang: "pl",
        list: { inbox: "S:\\inbox", proposals: [
          { name: "desk-four.ec", file: "S:\\inbox\\desk-four.ec", ok: true, pending: 2, desk: { id: "k-4", name: "Desk four" } }] },
        files: {
          "S:\\inbox\\desk-four.ec": { ok: true, file: "S:\\inbox\\desk-four.ec", name: "desk-four.ec", deskName: "Desk four",
            desk: { id: "k-4", name: "Desk four" }, edition: "2026-11-15T11:42:00.000Z",
            changes: [edit(0, "Courier costs", [{ field: "shelf", lang: null, text: "Dostawa" }]), edit(1, "Parcel lockers")],
            notes: [], proposes: {}, waiting: {}, pending: 2, decidedBefore: 0 },
        },
        lint: { errors: 0, warnings: 0, rows: [] },
        requests: [{ id: "k-3f9a0c71b2e4d856", name: "Cora, at a desk", state: "ready", kind: "desk", asked: "2026-11-15T09:12:00Z" }],
        drafts: [],
      };
      page = await boot(browser, door, opened, catalogs);
      await page.evaluate(() => document.querySelector('#rail a[data-v="cards"]').click());
      await page.waitForSelector("#main tr.pick .cell-chip", { timeout: 8000 });
      const table = await page.evaluate((ida, idb) => {
        const chip = (cid) => {
          const tr = document.querySelector('#main tr.pick[data-id="' + cid + '"]');
          const el = tr && tr.querySelector("td .cell-chip");
          return el ? el.textContent : "";
        };
        return { a: chip(ida), b: chip(idb) };
      }, cardIds[0], cardIds[1]);
      await enter(page, "rail");
      const seen = await page.evaluate(() => ({
        h1: (document.querySelector("#stk h1") || {}).textContent || "",
        rows: Array.from(document.querySelectorAll("#stkStage .stk-card")).map((el) => ({
          title: (el.querySelector(".stk-t") || {}).textContent || "",
          cat: (el.querySelector(".stk-cat") || {}).textContent || "",
          kind: (el.className.match(/stk-(team|import|model|check|join)/) || [])[1] || "",
        })),
      }));
      await page.close();
      const same = seen.rows.find((r) => r.title === "Courier costs") || { cat: "" };
      const bare = seen.rows.find((r) => r.title === "Parcel lockers") || { cat: "missing" };
      const ok = seen.h1 === "Przegląd" && table.a !== "" && same.cat === table.a && bare.cat === table.b && table.b !== ""; /* P2: a request's card, whose chip was empty, is no card */
      check(ok, "rd33 on a Polish screen the door's category chip equals the Cards table's chip for the same card, and a row with no category stays empty",
        { h1: seen.h1, table, same, bare });
    });
    if (wants("rd57")) await guard(["rd57"], async () => {
      /* A KEPT SHARED CARD (board 1013): a teammate's custom card carrying `from: {desk, card}`, the sender's desk and the card's id in the sender's catalog. */
      const SHARED = { desk: "k-s", card: "c-shared" }, SHARED2 = { desk: "k-s", card: "c-other" };
      const addRow = (key, id, title, from) => ({ key, op: "add", scope: "card", kind: "card", id, path: null, title, was: null, becomes: "A lamp for the porch.",
        decided: false, conflict: false, also: [], to: Object.assign({ id, title: { en: title } }, from === undefined ? {} : { from }) });
      const mk = (n, name, rows) => ({ ok: true, file: "S:\\inbox\\k" + n + ".ec", name: "k" + n + ".ec", deskName: name, desk: { id: "k-" + n, name },
        edition: "2026-11-15T11:42:00.000Z", changes: rows, notes: [], proposes: {}, waiting: {}, pending: rows.length, decidedBefore: 0 });
      const files = [mk(4, "Desk four", [addRow("k1", "c-a", "Brass lamp", SHARED)]), mk(5, "Desk five", [addRow("k2", "c-b", "Brass lamp", SHARED)]),
        mk(6, "Desk six", [addRow("k3", "c-c", "Plain lamp")]), mk(7, "Desk seven", [addRow("k4", "c-d", "Odd lamp", { desk: "k-s" })]), mk(8, "Desk eight", [addRow("k5", "c-e", "Odd lamp", { desk: "k-s" })]),
        mk(9, "Desk nine", [addRow("k6", "c-f", "Candle", SHARED2)]), mk(10, "Desk ten", [addRow("k7", "c-g", "Candle", SHARED2)])];
      files[5].changes[0].becomes = "A candle for the hall."; files[6].changes[0].becomes = "A candle for the stair.";
      const door = { list: { inbox: "S:\\inbox", proposals: files.map((f) => ({ name: f.name, file: f.file, ok: true, pending: 1, desk: f.desk })) },
        files: {}, lint: { errors: 0, warnings: 0, rows: [] }, requests: [], drafts: [] };
      files.forEach((f) => { door.files[f.file] = f; });
      page = await fresh(door);
      const l0 = await look(page);
      const src = await page.evaluate(() => (document.querySelector("#stkStage .stk-card.hand .stk-src") || {}).textContent || "");
      const titles = l0.cards.map((c) => c.title).sort();
      await answer(page, "a");
      const t1 = await tray(page), l1 = await look(page);
      await page.evaluate(() => document.querySelector("#stkApply").click());
      await page.waitForFunction(() => /^Apply decided: 0/.test((document.querySelector("#stkApply") || {}).textContent || ""), { timeout: 8000 }).catch(() => {});
      await sleep(120);
      const calls = (await page.evaluate(() => window.__calls)).map((c) => JSON.stringify(c)).sort();
      const want = [["proposalDecide", files[0].file, { k1: "accept" }, "Desk four", null], ["proposalDecide", files[1].file, { k2: "accept" }, "Desk five", null]].map((c) => JSON.stringify(c)).sort();
      check(titles.join("|") === "Brass lamp|Candle|Candle|Odd lamp|Odd lamp|Plain lamp" && l0.hand && l0.hand.title === "Brass lamp" && src === "from Desk four, Desk five"
        && l0.lede === "Waiting on you: 6. Nothing is written until you apply it." && t1.rows.length === 1 && t1.rows[0].t === "Brass lamp" && l1.cards.length === 5
        && JSON.stringify(calls) === JSON.stringify(want),
        "rd57 two keepers' copies of one shared card are one row naming both, a card with no `from`, two with the same malformed one, and two keepers whose wording differs, stay their own rows, and one Accept lands in each keeper's file",
        { titles, hand: l0.hand && l0.hand.title, src, lede: l0.lede, rows: t1.rows.map((r) => r.t), left: l1.cards.length, calls });
      await page.close();
    });
    /* Stills of the seven states, light and dark, only when a folder is named. No check: EXPECTED does not move. */
    /* ---- the motion ------------------------------------------------------------------------------------------------ */
    /** In the page: the stack at rest, then `act` (a key, or a burst of wheel steps), then every card's top in the stage at the
     *  moment the motion starts and at each frame for `ms`; the transitions as the computed style and the running animations
     *  give them at that moment, and the hand's body's own animation. */
    const film = (pg, act, ms) => pg.evaluate(async (act, ms) => {
      const stage = document.querySelector("#stkStage");
      const ours = (a) => { const t = a.effect && a.effect.target; return !!(t && t.closest && t.closest("#stk")); };
      document.getAnimations().forEach((a) => { try { if (ours(a)) a.finish(); } catch (e) { /* an endless one */ } });
      const snap = () => {
        const s = stage.getBoundingClientRect(), o = {};
        stage.querySelectorAll(".stk-card").forEach((el) => {
          o[el.getAttribute("data-key")] = { top: Math.round((el.getBoundingClientRect().top - s.top) * 10) / 10, op: +getComputedStyle(el).opacity,
            hand: el.classList.contains("hand"), out: el.classList.contains("stk-leave") || el.classList.contains("stk-fly") };
        });
        return o;
      };
      const before = snap(), frames = [], t0 = performance.now();
      let wheeled = Promise.resolve();
      if (act.key) document.dispatchEvent(new KeyboardEvent("keydown", { key: act.key, bubbles: true, cancelable: true }));
      if (act.wheel) {
        stage.dispatchEvent(new WheelEvent("wheel", { deltaY: act.wheel.dy, bubbles: true, cancelable: true }));
        wheeled = (async () => {
          for (let i = 1; i < act.wheel.n; i++) {
            await new Promise((r) => setTimeout(r, act.wheel.gap));
            stage.dispatchEvent(new WheelEvent("wheel", { deltaY: act.wheel.dy, bubbles: true, cancelable: true }));
          }
        })();
      }
      const start = snap();
      const hand = stage.querySelector(".stk-card.hand"), cs = hand ? getComputedStyle(hand) : null;
      const timing = cs ? { prop: cs.transitionProperty, dur: cs.transitionDuration, ease: cs.transitionTimingFunction } : null;
      const moving = Array.from(stage.querySelectorAll(".stk-card")).map((el) => el.getAnimations().filter((a) => a.transitionProperty === "transform")
        .map((a) => Math.round(Number(a.effect.getTiming().duration)))).filter((x) => x.length).map((x) => x[0]);
      /* a card new to the window glides by an animation of its own */
      const enters = Array.from(stage.querySelectorAll(".stk-card")).filter((el) => !before[el.getAttribute("data-key")])
        .map((el) => el.getAnimations().filter((a) => !a.transitionProperty && !a.animationName).map((a) => Math.round(Number(a.effect.getTiming().duration)) + " " + a.effect.getTiming().easing).join("|"));
      const body = hand ? hand.querySelector(".stk-body").getAnimations().map((a) => [a.animationName, Math.round(Number(a.effect.getTiming().duration))]) : [];
      const bodyOp = hand ? +getComputedStyle(hand.querySelector(".stk-body")).opacity : null;
      await new Promise((res) => { const f = () => { frames.push(snap()); if (performance.now() - t0 < ms) requestAnimationFrame(f); else res(); }; requestAnimationFrame(f); });
      await wheeled;
      const still = document.getAnimations().filter((a) => ours(a) && a.playState === "running").length;
      const last = stage.querySelector(".stk-card.hand");
      return { before, start, frames, end: snap(), timing, moving, enters, body, bodyOp, still,
        hand: hand ? hand.getAttribute("data-key") : null, endHand: last ? last.getAttribute("data-key") : null };
    }, act, ms);
    const EASE2 = "cubic-bezier(0.2, 0.8, 0.2, 1), cubic-bezier(0.2, 0.8, 0.2, 1)";
    /** A card's tops through a film, its place at the start first. */
    const pathOf = (m, k) => [m.start[k]].concat(m.frames.map((f) => f[k])).filter(Boolean).map((p) => p.top);
    const falls = (p) => p.every((t, i) => i === 0 || t <= p[i - 1] + 0.5);
    if (wants("rd34")) await guard(["rd34"], async () => {
      page = await boot(browser, forty, opened, catalogs);
      await enter(page);
      /* the door just opened: nothing slides from where the sheet first drew it */
      const opening = await page.evaluate(() => document.getAnimations().filter((a) => {
        const t = a.effect && a.effect.target; return t && t.closest && t.closest("#stk") && a.transitionProperty; }).map((a) => a.effect.target.className + ":" + a.transitionProperty));
      await page.evaluate(() => document.querySelector("#stkStage").focus());
      await key(page, "j"); await key(page, "j");
      await sleep(320);
      const m = await film(page, { key: "j" }, 420), b = m.before, s = m.start;
      const keys = Object.keys(b), was = keys.find((k) => b[k].hand);
      const below = keys.filter((k) => b[k].top > b[was].top).sort((x, y) => b[x].top - b[y].top);
      const lastTop = below.length ? b[below[below.length - 1]].top : null;
      const stayed = keys.filter((k) => s[k]).every((k) => Math.abs(s[k].top - b[k].top) < 0.6);
      const came = Object.keys(s).filter((k) => !b[k]);
      const cameFrom = came.map((k) => s[k].top);
      const path = pathOf(m, m.hand);
      const between = path.filter((t) => t > 63 && t < path[0] - 1).length;
      const topmost = Math.min(...m.frames.concat([s]).flatMap((f) => Object.values(f).map((p) => p.top)));
      const end = m.end[m.hand];
      check(m.timing && m.timing.prop === "transform, opacity" && m.timing.dur === "0.26s, 0.26s" && m.timing.ease === EASE2
        && m.moving.length >= 6 && m.moving.every((d) => d === 260) && m.hand === below[0] && stayed
        && came.length >= 1 && cameFrom.every((t) => Math.abs(t - lastTop) < 1.1) && topmost >= 9.5
        && m.enters.length === came.length && m.enters.every((e) => e === "260 cubic-bezier(0.2, 0.8, 0.2, 1)")
        && falls(path) && between >= 3 && Math.min(...path) >= 61.4 && end && Math.abs(end.top - 62) < 0.6
        && m.body.length === 1 && m.body[0][0] === "stk-body-in" && m.body[0][1] === 260 && Math.abs(m.bodyOp - 0.5) < 0.05
        && m.still === 0 && !Object.values(m.end).some((p) => p.out) && opening.length === 0,
        "rd34 the door opens with nothing sliding; a move slides every card from where it was (260 ms, cubic-bezier(.2,.8,.2,1), from the computed style), a card coming in from where it stood in the pile and none from the stage's top; the incoming hand falls to 62 px without passing it while its body fades in from half strength; nothing is left moving or let go",
        { timing: m.timing, moving: m.moving, enters: m.enters, hand: m.hand, first: below[0], stayed, came: cameFrom, lastTop, topmost, path: path.slice(0, 12), between,
          end: end && end.top, body: m.body, bodyOp: m.bodyOp, still: m.still, opening });
      await page.close();
    });
    if (wants("rd35")) await guard(["rd35"], async () => {
      page = await boot(browser, forty, opened, catalogs);
      await enter(page);
      const order = (await look(page)).cards.slice().sort((x, y) => x.top - y.top).map((c) => c.key);
      /* a trackpad's flick: thirteen steps of 30 px, 16 ms apart; 390 px gathered is six moves and 30 px that rest forgets */
      const m = await film(page, { wheel: { n: 13, dy: 30, gap: 16 } }, 13 * 16 + 440);
      const path = pathOf(m, m.endHand);
      await page.evaluate(() => document.querySelector("#stkStage").dispatchEvent(new WheelEvent("wheel", { deltaY: 30, bubbles: true, cancelable: true })));
      const l = await look(page), h = l.hand;
      const below = l.cards.filter((c) => c.top > h.top).sort((x, y) => x.top - y.top), above = l.cards.filter((c) => c.top < h.top).sort((x, y) => y.top - x.top);
      check(m.endHand === order[6] && h.key === order[6] && path.filter((t) => t > 63 && t < path[0] - 1).length >= 3 && falls(path) && Math.min(...path) >= 61.4
        && Math.abs(path[path.length - 1] - 62) < 0.6 && m.still === 0 && below[0] && Math.abs(below[0].top - (62 + h.h + 38 - 44)) < 1.1
        && above[0] && Math.abs(above[0].top - 32) < 0.6,
        "rd35 a flick of the wheel (390 px in 13 steps) ends on a whole thing: six moves, the hand falling to 62 px and never past it, the pile at rest on the cards' own places, and the 30 px left over forgotten",
        { want: order[6], end: m.endHand, after: h.key, path: path.slice(0, 16), last: path[path.length - 1], still: m.still, below: below[0] && below[0].top, hh: h.h, above: above[0] && above[0].top });
      await page.close();
    });
    /** In the page: the stack at rest, then `k` pressed (with Ctrl where `ctrl`), and the card or row that flies or leaves as a
     *  result read at the moment it starts, at its end (its transitions or animation sought to their last frame) and once it
     *  is over; the box it flies to, and the Decided row it becomes. */
    const flight = (pg, k, ctrl, rowKey) => pg.evaluate(async (k, ctrl, rowKey) => {
      const wait = (ms) => new Promise((r) => setTimeout(r, ms));
      const ours = (a) => { const t = a.effect && a.effect.target; return !!(t && t.closest && t.closest("#stk")); };
      document.getAnimations().forEach((a) => { try { if (ours(a)) a.finish(); } catch (e) { /* an endless one */ } });
      const box = (r) => r ? { left: Math.round(r.left * 10) / 10, top: Math.round(r.top * 10) / 10, width: Math.round(r.width * 10) / 10, right: Math.round(r.right * 10) / 10, bottom: Math.round(r.bottom * 10) / 10 } : null;
      const stage = document.querySelector("#stkStage"), sr = box(stage.getBoundingClientRect());
      const hand = stage.querySelector(".stk-card.hand"), was = { key: hand.getAttribute("data-key"), box: box(hand.getBoundingClientRect()) };
      const rowAt = (key) => Array.from(document.querySelectorAll("#stkDone .stk-d")).find((d) => d.getAttribute("data-key") === key) || null;
      const gone = rowKey ? rowAt(rowKey) : null, goneBox = gone ? box(gone.getBoundingClientRect()) : null;
      document.dispatchEvent(new KeyboardEvent("keydown", { key: k, ctrlKey: !!ctrl, bubbles: true, cancelable: true }));
      await Promise.resolve();
      const fly = document.querySelector("#stk .stk-card.stk-fly"), ghost = document.querySelector("#stk > .stk-d.stk-out");
      const out = { stage: sr, was, goneBox };
      if (fly) {
        const cs = getComputedStyle(fly), as = fly.getAnimations();
        out.fly = { inStage: fly.parentNode === stage, start: box(fly.getBoundingClientRect()), dur: cs.transitionDuration, ease: cs.transitionTimingFunction,
          props: as.map((a) => a.transitionProperty + ":" + Math.round(Number(a.effect.getTiming().duration))).sort() };
        as.forEach((a) => { a.pause(); a.currentTime = Number(a.effect.getTiming().duration) - 0.01; });
        out.fly.end = box(fly.getBoundingClientRect());
        out.fly.endOp = +getComputedStyle(fly).opacity;
        as.forEach((a) => a.play());
      }
      if (ghost) {
        const as = ghost.getAnimations();
        out.ghost = { start: box(ghost.getBoundingClientRect()), anims: as.map((a) => Math.round(Number(a.effect.getTiming().duration))) };
        as.forEach((a) => { a.pause(); a.currentTime = Number(a.effect.getTiming().duration) / 2; });
        out.ghost.mid = box(ghost.getBoundingClientRect());
        as.forEach((a) => { a.currentTime = Number(a.effect.getTiming().duration) - 0.01; });
        out.ghost.end = box(ghost.getBoundingClientRect());
        out.ghost.endOp = +getComputedStyle(ghost).opacity;
        as.forEach((a) => a.play());
      }
      const done = document.querySelector("#stkDone");
      out.done = box(done.getBoundingClientRect());
      const row = rowAt(was.key);
      if (row) {
        out.row = { anims: row.getAnimations().map((a) => [a.animationName || "", Math.round(Number(a.effect.getTiming().duration)), Math.round(Number(a.effect.getTiming().delay))]),
          op0: +getComputedStyle(row).opacity };
        await wait(170);
        out.row.op170 = +getComputedStyle(row).opacity;
      }
      out.slid = Array.from(done.querySelectorAll(".stk-d")).filter((d) => d !== row).map((d) => d.getAnimations().filter((a) => !a.animationName)
        .map((a) => [Math.round(Number(a.effect.getTiming().duration)), String((a.effect.getKeyframes()[0] || {}).transform || "")])).filter((x) => x.length).map((x) => x[0]);
      const back = stage.querySelector(".stk-card.hand"), cardAt = (el) => Math.round((el.getBoundingClientRect().top - stage.getBoundingClientRect().top) * 10) / 10;
      /* a card moves by the sheet's transition, or by its own glide when it is new to the window */
      const moves = (el) => (el ? el.getAnimations().filter((a) => a.transitionProperty === "transform" || (!a.transitionProperty && !a.animationName)).map((a) => Math.round(Number(a.effect.getTiming().duration))) : []);
      out.hand = back ? { key: back.getAttribute("data-key"), top: cardAt(back), anims: moves(back) } : null;
      out.wasAnims = moves(Array.from(stage.querySelectorAll(".stk-card")).find((e) => e.getAttribute("data-key") === was.key && e !== back));
      await wait(row ? 290 : 460);
      out.over = { fly: !!document.querySelector("#stk .stk-card.stk-fly"), ghost: !!document.querySelector("#stk > .stk-d.stk-out") };
      const fin = stage.querySelector(".stk-card.hand");
      out.endHand = fin ? { key: fin.getAttribute("data-key"), top: cardAt(fin) } : null;
      if (row) { await wait(330); out.row.op800 = +getComputedStyle(row).opacity; }
      return out;
    }, k, ctrl, rowKey);
    /** In the page: A pressed, then the answer's whole landing stepped by its own clock (every motion in the stack paused and
     *  sought, 10 ms at a time, in one task so no timer runs): the flying card's and its row's opacity at each step, the card's
     *  box at the moment the row starts, and where the row's drop starts and ends. */
    const landing = (pg) => pg.evaluate(async () => {
      const ours = (a) => { const t = a.effect && a.effect.target; return !!(t && t.closest && t.closest("#stk")); };
      document.getAnimations().forEach((a) => { try { if (ours(a)) a.finish(); } catch (e) { /* an endless one */ } });
      const key = document.querySelector("#stkStage .stk-card.hand").getAttribute("data-key");
      document.dispatchEvent(new KeyboardEvent("keydown", { key: "a", bubbles: true, cancelable: true }));
      await Promise.resolve();
      void document.body.offsetHeight;
      const fly = document.querySelector("#stk .stk-card.stk-fly");
      const row = Array.from(document.querySelectorAll("#stkDone .stk-d")).find((d) => d.getAttribute("data-key") === key);
      const anims = document.getAnimations().filter(ours);
      anims.forEach((a) => a.pause());
      const drop = row ? row.getAnimations().find((a) => a.animationName === "stk-drop") : null;
      const starts = drop ? Math.round(Number(drop.effect.getTiming().delay)) : null, ends = drop ? Math.round(Number(drop.effect.getComputedTiming().endTime)) : null;
      const flyEnd = fly ? Math.max(...fly.getAnimations().map((a) => Number(a.effect.getComputedTiming().endTime))) : 0;
      const steps = [];
      let atStart = null;
      for (let t = 0; t <= 520; t += 10) {
        anims.forEach((a) => { a.currentTime = Math.min(t, Number(a.effect.getComputedTiming().endTime) - 0.01); });
        const fo = fly && t < flyEnd ? +getComputedStyle(fly).opacity : 0, ro = row ? +getComputedStyle(row).opacity : 0;
        steps.push([t, Math.round(fo * 100) / 100, Math.round(ro * 100) / 100]);
        if (starts != null && t === Math.round(starts / 10) * 10 && fly) { const b = fly.getBoundingClientRect(); atStart = { top: b.top, mid: b.left + b.width / 2 }; }
      }
      anims.forEach((a) => { try { a.finish(); } catch (e) { /* gone */ } });
      const d = document.querySelector("#stkDone").getBoundingClientRect();
      return { starts, ends, flyEnd, steps, atStart, done: { top: d.top, left: d.left, right: d.right } };
    });
    if (wants("rd36")) await guard(["rd36"], async () => {
      page = await fresh();
      await look(page);
      const m = await flight(page, "a");
      await sleep(400);
      const m2 = await flight(page, "r");
      await page.close();
      /* the landing by its own clock, and a second answer pressed while the first is still landing */
      page = await fresh();
      await look(page);
      const g = await landing(page);
      const lost = g.steps.filter(([t, fo, ro]) => t <= g.ends && Math.max(fo, ro) < 0.3).map(([t]) => t);
      await sleep(400);
      const quick = await page.evaluate(async () => {
        const wait = (ms) => new Promise((res) => setTimeout(res, ms));
        document.dispatchEvent(new KeyboardEvent("keydown", { key: "a", bubbles: true, cancelable: true }));
        await wait(360);
        document.dispatchEvent(new KeyboardEvent("keydown", { key: "r", bubbles: true, cancelable: true }));
        await wait(700);
        return { rows: Array.from(document.querySelectorAll("#stkDone .stk-d .stk-dt")).map((e) => e.textContent), fly: document.querySelectorAll("#stk .stk-fly").length,
          running: document.getAnimations().filter((a) => { const t = a.effect && a.effect.target; return t && t.closest && t.closest("#stk") && a.playState === "running"; }).length };
      });
      const f = m.fly, s = f && f.start, e = f && f.end, d = m.done, w = m.was.box;
      const mid = e ? e.left + e.width / 2 : null;
      /* "at its slot" at 130 ms is within 8 px of Decided's top, or within 12 per cent of the travel where Decided sits lower (the
         ease leaves 10.7 per cent of the travel at 130 ms, and the attribution fields put Decided lower when a file has an accepted row) */
      check(f && !f.inStage && Math.abs(s.left - w.left) < 1 && Math.abs(s.top - w.top) < 1 && Math.abs(s.width - w.width) < 1
        && f.dur === "0.34s, 0.34s" && f.ease === "cubic-bezier(0.2, 0.8, 0.2, 1), ease-in" && f.props.join(",") === "opacity:340,transform:340"
        && Math.abs(e.width - w.width / 3) < 2 && mid >= d.left && mid <= d.right && Math.abs(e.top - d.top) < 4 && f.endOp < 0.05
        && m.row && m.row.anims.length === 1 && m.row.anims[0].join(",") === "stk-drop,340,130" && m.row.op0 < 0.05 && m.row.op800 > 0.99
        && !m.over.fly && m2.slid.length === 1 && m2.slid[0][0] === 340 && /translateY\(-/.test(m2.slid[0][1])
        && g.starts === 130 && g.ends === 470 && lost.length === 0 && g.atStart && Math.abs(g.atStart.top - g.done.top) < Math.max(8, 0.12 * (g.done.top - w.top))
        && g.atStart.mid >= g.done.left && g.atStart.mid <= g.done.right
        && quick.rows.join("|") === "Row 2|Row 1|Changing the bulb" && quick.fly === 0 && quick.running === 0,
        "rd36 an answer's card leaves the stage where the hand was, shrinks to a third and flies to the top of Decided in 340 ms, fading ease-in, and is gone after; its row drops in from the left as the card reaches its slot (at 130 ms, over by 470), so at no step is the thing absent, the rows already there sliding down to make room; a second answer pressed while the first lands ends with both rows in order and nothing in flight",
        { start: s, hand: w, dur: f && f.dur, ease: f && f.ease, props: f && f.props, end: e, done: d, endOp: f && f.endOp, row: m.row, over: m.over, slid: m2.slid,
          starts: g.starts, ends: g.ends, lost, atStart: g.atStart, landingDone: g.done, steps: g.steps.filter(([t]) => t % 40 === 0), quick });
      await page.close();
    });
    if (wants("rd37")) await guard(["rd37"], async () => {
      page = await fresh();
      await look(page);
      const m = await flight(page, "s");
      const f = m.fly, s = f && f.start, e = f && f.end, w = m.was.box;
      check(f && f.inStage && Math.abs(s.left - w.left) < 1 && Math.abs(s.top - w.top) < 1 && f.dur === "0.34s, 0.34s"
        && f.props.join(",") === "opacity:340,transform:340" && Math.abs((e.left + e.width / 2) - (w.left + w.width / 2)) < 1
        && e.top >= m.stage.bottom - 1 && !m.over.fly,
        "rd37 Later: the card drops straight down out of the stage in 340 ms, its middle not moving sideways, and is gone after",
        { start: s, hand: w, dur: f && f.dur, props: f && f.props, end: e, stage: m.stage, over: m.over });
      await page.close();
    });
    if (wants("rd38")) await guard(["rd38"], async () => {
      page = await fresh();
      await look(page);
      /* two answered, the newer taken back: its row fades where it stands and the older closes up over it */
      await answer(page, "a");
      const bulb = (await look(page)).hand.key;
      await answer(page, "a");
      await sleep(400);
      const m = await flight(page, "z", true, (await tray(page)).rows[0].key);
      const t = await tray(page), l = await look(page);
      const g = m.ghost, h = m.hand, gb = m.goneBox;
      /* and by a row's own Take back, the same leaving */
      await answer(page, "a");
      await sleep(400);
      const byButton = await page.evaluate(async () => {
        document.querySelector("#stkDone .stk-d .stk-back").click();
        await Promise.resolve();
        return { ghost: !!document.querySelector("#stk > .stk-d.stk-out"), rows: document.querySelectorAll("#stkDone .stk-d").length };
      });
      const same = (a, b) => a && b && Math.abs(a.top - b.top) < 0.5 && Math.abs(a.left - b.left) < 0.5 && Math.abs(a.width - b.width) < 0.5;
      check(g && same(g.start, gb) && same(g.mid, gb) && same(g.end, gb) && g.endOp < 0.05 && g.anims.join(",") === "100" && t.rows.length === 1
        && m.slid.length === 1 && m.slid[0][0] === 260 && /translateY\([0-9]/.test(m.slid[0][1])
        && h && h.key === bulb && h.top < 61 && h.anims.join(",") === "260" && m.wasAnims.join(",") === "260" && !m.over.ghost
        && m.endHand && m.endHand.key === bulb && Math.abs(m.endHand.top - 62) < 0.6 && l.hand.key === bulb && byButton.ghost && byButton.rows === 1,
        "rd38 a take back, by Ctrl Z or a row's Take back: the row fades where it stands in 100 ms, its box not moving, while the row under it closes up over 260 ms, and the card comes back into the hand by the ordinary move (260 ms, from just above the card it goes in front of, to 62 px)",
        { ghost: g, gone: gb, rows: t.rows.length, slid: m.slid, hand: h, was: m.wasAnims, over: m.over, end: m.endHand, byButton });
      await page.close();
    });
    if (wants("rd39")) await guard(["rd39"], async () => {
      /* Studio's own switch (html.e-still, as applyAnimations sets it) and the system's reduced motion, each on a fresh page */
      const off = async (how) => {
        const pg = await fresh();
        if (how === "still") await pg.evaluate(() => document.documentElement.classList.add("e-still"));
        else await pg.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
        await look(pg);
        const r = await pg.evaluate(async () => {
          const stage = document.querySelector("#stkStage"), wait = (ms) => new Promise((res) => setTimeout(res, ms));
          const running = () => document.getAnimations().filter((a) => { const t = a.effect && a.effect.target; return t && t.closest && t.closest("#stk"); }).length;
          const top = () => { const h = stage.querySelector(".stk-card.hand"); return h ? Math.round(h.getBoundingClientRect().top - stage.getBoundingClientRect().top) : null; };
          const press = async (key, ctrl) => { document.dispatchEvent(new KeyboardEvent("keydown", { key, ctrlKey: !!ctrl, bubbles: true, cancelable: true })); await Promise.resolve(); void document.body.offsetHeight; };
          const out = {};
          await press("j");
          out.move = { anims: running(), top: top(), dur: getComputedStyle(stage.querySelector(".stk-card.hand")).transitionDuration };
          await press("a");
          out.answer = { anims: running(), fly: document.querySelectorAll("#stk .stk-fly").length, rows: document.querySelectorAll("#stkDone .stk-d").length, top: top() };
          await wait(380);
          await press("s");
          out.later = { anims: running(), fly: document.querySelectorAll("#stk .stk-fly").length, top: top() };
          await wait(380);
          await press("z", true);
          out.back = { anims: running(), ghosts: document.querySelectorAll("#stk > .stk-d.stk-out").length, rows: document.querySelectorAll("#stkDone .stk-d").length, top: top() };
          return out;
        });
        await pg.close();
        return r;
      };
      const a = await off("still"), b = await off("reduce");
      const fine = (r) => r.move.anims === 0 && r.move.top === 62 && r.move.dur === "0s, 0s" && r.answer.anims === 0 && r.answer.fly === 0
        && r.answer.rows === 1 && r.answer.top === 62 && r.later.anims === 0 && r.later.fly === 0 && r.later.top === 62
        && r.back.anims === 0 && r.back.ghosts === 0 && r.back.rows === 0 && r.back.top === 62;
      check(fine(a) && fine(b),
        "rd39 with Studio's motion off, and with the system's reduced motion, nothing slides or flies: after a move, an answer, Later and Ctrl Z no animation runs, the hand is at 62 px at once, no card is in flight and Decided's row is simply there, then simply gone",
        { still: a, reduce: b });
    });
    if (wants("rd40")) await guard(["rd40"], async () => {
      page = await fresh();
      await answer(page, "a");
      await answer(page, "a");
      await answer(page, "r");
      await answer(page, "a");
      await page.evaluate(() => {
        const d = window.__door.files["S:\\inbox\\desk-four.ec"];
        window.__origBecomes = d.changes[0].becomes;
        d.changes[0].becomes = "Changed externally.";
        d.changes[2].decided = true;
        window.__savedWinter = window.__door.files["S:\\inbox\\winter.ec"];
        delete window.__door.files["S:\\inbox\\winter.ec"];
      });
      await page.evaluate(() => document.querySelector("#stkApply").click());
      await page.waitForFunction(() => /^Apply decided/.test((document.querySelector("#stkApply") || {}).textContent || ""), { timeout: 8000 }).catch(() => {});
      await sleep(120);
      const t1 = await tray(page);
      const byTitle = {};
      t1.rows.forEach((r) => { byTitle[r.t] = r; });
      await page.evaluate(() => {
        const d = window.__door.files["S:\\inbox\\desk-four.ec"];
        d.changes[0].becomes = window.__origBecomes;
        d.changes[2].decided = false;
        window.__door.files["S:\\inbox\\winter.ec"] = window.__savedWinter;
      });
      await page.evaluate(() => document.querySelector("#stkApply").click());
      await page.waitForFunction(() => {
        const ap = document.querySelector("#stkApply");
        return ap && ap.textContent.replace(/\s+/g, " ").trim() === "Apply decided: 0";
      }, { timeout: 8000 }).catch(() => {});
      await sleep(120);
      const t2 = await tray(page);
      check(t1.rows.length === 3 && !byTitle["Row 1"]
        && byTitle["Changing the bulb"] && byTitle["Changing the bulb"].ref === "Not applied: it changed after it was opened." && byTitle["Changing the bulb"].back
        && byTitle["Row 2"] && byTitle["Row 2"].ref === "Not applied: decided in an earlier review." && byTitle["Row 2"].back
        && byTitle["Imported 0"] && /^Not applied: Could not reach S:\\inbox\\winter\.ec/.test(byTitle["Imported 0"].ref) && byTitle["Imported 0"].back
        && t2.rows.length === 0 && t2.off,
        "rd40 proposal rows changed, already decided or with a gone file stay in Decided with \"Not applied: {REASON}.\" and Take back while unchanged rows apply; a second Apply after clearing applies them",
        { rows1: t1.rows.map((r) => [r.t, r.ref, r.back]), rows2: t2.rows.length });
      await page.close();
    });
    /* RETIRED, P2 (no admission is made from the Review stack: a request is no card): rd41, "per-desk admission refusals stay in Decided with their reason and Take back while other kinds apply; a second Apply after clearing admits them". */
    if (wants("rd42")) await guard(["rd42"], async () => {
      page = await fresh();
      await answer(page, "a");
      await page.evaluate(() => document.querySelector('#stkKinds [data-k="check"]').click());
      await sleep(60);
      await answer(page, "r");
      await page.evaluate((cid) => {
        window.__leaveResult = { error: "no card", said: { frame: "no card {ID} in this catalog", vars: { ID: JSON.stringify(cid) } } };
      }, cardIds[0]);
      await page.evaluate(() => document.querySelector("#stkApply").click());
      await page.waitForFunction(() => /^Apply decided/.test((document.querySelector("#stkApply") || {}).textContent || ""), { timeout: 8000 }).catch(() => {});
      await sleep(120);
      const t1 = await tray(page);
      await page.evaluate(() => { window.__leaveResult = null; });
      await page.evaluate(() => document.querySelector("#stkApply").click());
      await page.waitForFunction(() => {
        const ap = document.querySelector("#stkApply");
        return ap && ap.textContent.replace(/\s+/g, " ").trim() === "Apply decided: 0";
      }, { timeout: 8000 }).catch(() => {});
      await sleep(120);
      const t2 = await tray(page);
      check(t1.rows.length === 1 && t1.rows[0].ref === "Not applied: no card " + JSON.stringify(cardIds[0]) + " in this catalog." && t1.rows[0].back
        && t2.rows.length === 0 && t2.off,
        "rd42 a finding refused for no card stays in Decided with \"Not applied: no card ...\" and Take back while other items apply; a second Apply after restoring applies it",
        { rows1: t1.rows.map((r) => [r.t, r.ref, r.back]), rows2: t2.rows.length });
      await page.close();
    });
    if (wants("rd43")) await guard(["rd43"], async () => {
      page = await fresh();
      await answer(page, "a");
      await page.evaluate(() => document.querySelector('#stkKinds [data-k="model"]').click());
      await sleep(60);
      await answer(page, "a");
      await page.evaluate(() => {
        window.__draftAcceptResult = { error: "gone", said: { frame: "the draft is no longer waiting, so nothing was accepted", vars: {} } };
      });
      await page.evaluate(() => document.querySelector("#stkApply").click());
      await page.waitForFunction(() => /^Apply decided/.test((document.querySelector("#stkApply") || {}).textContent || ""), { timeout: 8000 }).catch(() => {});
      await sleep(120);
      const t1 = await tray(page);
      await page.evaluate(() => { window.__draftAcceptResult = null; });
      await page.evaluate(() => document.querySelector("#stkApply").click());
      await page.waitForFunction(() => {
        const ap = document.querySelector("#stkApply");
        return ap && ap.textContent.replace(/\s+/g, " ").trim() === "Apply decided: 0";
      }, { timeout: 8000 }).catch(() => {});
      await sleep(120);
      const t2 = await tray(page);
      await page.close();
      /* Also a discard when the draft is already gone (`discarded: false`). */
      page = await fresh();
      await page.evaluate(() => document.querySelector('#stkKinds [data-k="model"]').click());
      await sleep(60);
      await answer(page, "r");
      await page.evaluate(() => {
        window.__draftDiscardResult = { error: null, discarded: false, drafts: [] };
      });
      await page.evaluate(() => document.querySelector("#stkApply").click());
      await page.waitForFunction(() => /^Apply decided/.test((document.querySelector("#stkApply") || {}).textContent || ""), { timeout: 8000 }).catch(() => {});
      await sleep(120);
      const t3 = await tray(page);
      await page.evaluate(() => { window.__draftDiscardResult = null; });
      await page.evaluate(() => document.querySelector("#stkApply").click());
      await page.waitForFunction(() => {
        const ap = document.querySelector("#stkApply");
        return ap && ap.textContent.replace(/\s+/g, " ").trim() === "Apply decided: 0";
      }, { timeout: 8000 }).catch(() => {});
      await sleep(120);
      const t4 = await tray(page);
      check(t1.rows.length === 1 && t1.rows[0].ref === "Not applied: the draft is no longer waiting, so nothing was accepted." && t1.rows[0].back && t2.rows.length === 0
        && t3.rows.length === 1 && t3.rows[0].ref === "Not applied: it changed after it was opened." && t3.rows[0].back && t4.rows.length === 0,
        "rd43 a draft gone at accept or discard stays in Decided with \"Not applied: {REASON}.\" and Take back while other items apply; a second Apply after restoring applies it",
        { t1: t1.rows.map((r) => [r.t, r.ref]), t2: t2.rows.length, t3: t3.rows.map((r) => [r.t, r.ref]), t4: t4.rows.length });
      await page.close();
    });
    /* RETIRED, P2 (as rd41): rd44, "whole-team admission refusals (licence paused, teammate limit, backup key) are said once above Decided's rows, never repeated per admission; non-admissions still apply and a second Apply succeeds". */
    if (wants("rd45")) await guard(["rd45"], async () => {
      page = await fresh();
      await answer(page, "a");
      await answer(page, "r");
      await key(page, "j");
      await answer(page, "r");
      const tOnlyRej = await tray(page);
      await answer(page, "a");
      const tBoth = await tray(page);
      /* the fields are one group named by one visible heading, the existing line, shown once; each field is named by its file's name */
      const desc = await page.evaluate(() => {
        const text = (id) => (document.getElementById(id) || {}).textContent || "";
        const g = document.querySelector('#stkTray [role="group"]');
        const heads = Array.from(document.querySelectorAll("#stkTray .stk-from-head"));
        return { group: !!g, labelled: g ? text(g.getAttribute("aria-labelledby")).trim() : null, heads: heads.map((h) => h.textContent.trim()),
          shown: heads.length === 1 && heads[0].getBoundingClientRect().height > 0,
          fields: Array.from(document.querySelectorAll(".stk-from")).map((f) => ({ file: f.getAttribute("data-file"),
            name: (f.getAttribute("aria-labelledby") || "").split(/\s+/).filter(Boolean).map(text).join(" ").trim(), inGroup: !!(g && g.contains(f)) })) };
      });
      const descOk = desc.group && desc.labelled === "Whose proposal this is" && desc.heads.length === 1 && desc.heads[0] === "Whose proposal this is" && desc.shown
        && desc.fields.length === 2 && desc.fields.every((d) => d.inGroup && d.name === d.file.split("\\").pop());
      await page.evaluate(() => { const f = document.querySelector('.stk-from[data-file="S:\\\\inbox\\\\winter.ec"]'); if (f) f.focus(); });
      await page.keyboard.type("arsjk");
      await key(page, "Escape");
      await chord(page, "Control", "z");
      await sleep(60);
      const tKeys = await tray(page), stays = !!(await page.$("#stk"));
      await page.evaluate(() => {
        const f = document.querySelector('.stk-from[data-file="S:\\\\inbox\\\\winter.ec"]');
        if (f) { f.value = "Courier agency"; f.dispatchEvent(new Event("input", { bubbles: true })); }
      });
      await page.evaluate(() => document.querySelector("#stkApply").click());
      await page.waitForFunction(() => {
        const ap = document.querySelector("#stkApply");
        return ap && ap.textContent.replace(/\s+/g, " ").trim() === "Apply decided: 0";
      }, { timeout: 8000 }).catch(() => {});
      await sleep(120);
      const calls = (await page.evaluate(() => window.__calls.filter((c) => c[0] === "proposalDecide")));
      const byFile = {};
      calls.forEach((c) => { byFile[c[1]] = c[3]; });
      const pend = (ok, line, detail) => ({ ok, line, detail });
      const held = pend(tOnlyRej.froms.length === 1 && tOnlyRej.froms[0].dataFile === "S:\\inbox\\desk-four.ec"
        && tBoth.froms.length === 2 && tBoth.froms.some((x) => x.dataFile === "S:\\inbox\\winter.ec") && descOk
        && tKeys.rows.length === 4 && stays
        && byFile["S:\\inbox\\desk-four.ec"] === "Desk four" && byFile["S:\\inbox\\winter.ec"] === "Courier agency",
        "rd45 \"Whose proposal this is\": one line a file under Apply for each file with something accepted; stack keys do nothing in it; typed attribution reaches proposalDecide and empty keeps the fallback; the fields are one group under that line as a heading, shown once, each named by its own file's name",
        { onlyRej: tOnlyRej.froms, both: tBoth.froms, desc, keysRows: tKeys.rows.length, stays, byFile });
      await page.close();
      /* NO FILE NAME IS CUT: a name of 40 characters with no place to break, at 1280 and at 900 px, in English and in Polish, is whole in
         its label (the label's scroll width within its client width, and every line box of its text inside the tray) and the field beside
         or under it keeps room to type in */
      const longName = "winterpricereviewdeskfour2026springq1.ec";
      const longDoor = JSON.parse(JSON.stringify(eight));
      const lk = "S:\\inbox\\winter.ec";
      longDoor.files[lk].name = longName;
      longDoor.list.proposals.find((p) => p.file === lk).name = longName;
      const whole = [];
      for (const [width, lang] of [[1280, "en"], [1280, "pl"], [900, "en"], [900, "pl"]]) {
        page = await boot(browser, Object.assign({}, longDoor, { lang }), opened, catalogs, width, lang);
        await enter(page);
        await page.evaluate(() => document.querySelector("#stkStage").focus());
        await answer(page, "a");
        await page.evaluate(() => document.querySelector('#stkKinds [data-k="import"]').click());
        await sleep(60);
        await answer(page, "a");
        const m = await page.evaluate((name) => {
          const tray = document.querySelector("#stkTray"), tr = tray.getBoundingClientRect();
          const label = Array.from(document.querySelectorAll(".stk-from-file")).find((el) => el.textContent === name);
          if (!label) return { found: false };
          const range = document.createRange();
          range.selectNodeContents(label);
          const rects = Array.from(range.getClientRects());
          const f = label.closest(".stk-from-row").querySelector(".stk-from");
          return { found: true, scroll: label.scrollWidth, client: label.clientWidth, lines: rects.length,
            inside: rects.every((r) => r.left >= tr.left - 0.5 && r.right <= tr.right + 0.5), field: Math.round(f.getBoundingClientRect().width),
            heading: (document.querySelector(".stk-from-head") || {}).textContent || "" };
        }, longName);
        whole.push(Object.assign({ width, lang }, m));
        await page.close();
      }
      const wholeOk = (longName.length === 40 && whole.every((m) => m.found && m.scroll <= m.client + 1 && m.inside && m.lines >= 1 && m.field >= 120)
        && whole.filter((m) => m.lang === "pl").every((m) => m.heading === "Czyja to propozycja")
        && whole.filter((m) => m.lang === "en").every((m) => m.heading === "Whose proposal this is"));
      check(held.ok && wholeOk, held.line + "; and a file name of 40 characters is whole in its label, at 1280 and 900 px wide and in both languages, under the one heading that says what the fields are",
        Object.assign({}, held.detail, { whole }));
    });
    /* RETIRED, P2 (as rd41): rd46, "whenever an admission waits in Decided, Decided says an admission cannot be taken back once applied (EN and PL); gone when none waits". */
    if (wants("rd47")) await guard(["rd47"], async () => {
      page = await fresh();
      await page.evaluate(() => document.querySelector('#stkKinds [data-k="import"]').click());
      await sleep(60);
      await answer(page, "a");
      await answer(page, "r");
      await page.evaluate(() => document.querySelector("#stkApply").click());
      await page.waitForFunction(() => {
        const ap = document.querySelector("#stkApply");
        return ap && ap.textContent.replace(/\s+/g, " ").trim() === "Apply decided: 0";
      }, { timeout: 8000 }).catch(() => {});
      await sleep(120);
      const t1 = await tray(page), l1 = await look(page);
      await key(page, "Escape");
      await sleep(120);
      await enter(page, "disc");
      const t2 = await tray(page);
      const impChip = l1.chips.find((c) => c.k === "import");
      await page.close();
      page = await fresh(eight, "pl");
      await page.evaluate(() => document.querySelector('#stkKinds [data-k="import"]').click());
      await sleep(60);
      await answer(page, "a");
      await answer(page, "r");
      await page.evaluate(() => document.querySelector("#stkApply").click());
      await page.waitForFunction(() => !!document.querySelector("#stkTray .stk-whole"), { timeout: 8000 }).catch(() => {});
      await sleep(120);
      const tPl = await tray(page);
      check(t1.wholes.join("|") === "winter-prices.csv: applied in full and removed from the inbox."
        && impChip && /0$/.test(impChip.text)
        && t2.wholes.join("|") === "winter-prices.csv: applied in full and removed from the inbox."
        && tPl.wholes.join("|") === "winter-prices.csv: zastosowano w całości i usunięto ze skrzynki.",
        "rd47 a file applied whole leaves the inbox and says \"{FILE}: applied in full and removed from the inbox.\" where Decided was for the sitting (EN and PL)",
        { t1: t1.wholes, imp: impChip && impChip.text, t2: t2.wholes, pl: tPl.wholes });
      await page.close();
    });
    if (wants("rd48")) await guard(["rd48"], async () => {
      const aboveData = JSON.parse(JSON.stringify(eight));
      aboveData.files["S:\\inbox\\desk-four.ec"].aboveEngine = true;
      aboveData.files["S:\\inbox\\desk-four.ec"].minEngine = "99.0";
      aboveData.files["S:\\inbox\\desk-four.ec"].engine = "1.0";
      aboveData.files["S:\\inbox\\winter.ec"].unknownHead = true;
      page = await fresh(aboveData);
      for (let i = 0; i < 5; i++) await answer(page, "a");
      await page.evaluate(() => document.querySelector('#stkKinds [data-k="check"]').click());
      await sleep(60);
      await answer(page, "r");
      await page.evaluate(() => document.querySelector("#stkApply").click());
      await page.waitForSelector('.rv-above[data-above][role="alertdialog"]', { timeout: 5000 }).catch(() => {});
      const q1 = await page.evaluate(() => {
        const d = document.querySelector('.rv-above[data-above][role="alertdialog"]');
        return d ? d.querySelector("p").textContent : "";
      });
      await page.evaluate(() => { const b = document.querySelector('[data-act="stk-above-no"]'); if (b) b.click(); });
      await page.waitForFunction(() => {
        const d = document.querySelector('.rv-above[data-above][role="alertdialog"]');
        return d && /Etiuda 99\.0 or newer/.test(d.textContent || "");
      }, { timeout: 5000 }).catch(() => {});
      const q2 = await page.evaluate(() => {
        const d = document.querySelector('.rv-above[data-above][role="alertdialog"]');
        return d ? d.querySelector("p").textContent : "";
      });
      await page.evaluate(() => { const b = document.querySelector('[data-act="stk-above-yes"]'); if (b) b.click(); });
      await page.waitForFunction(() => /^Apply decided/.test((document.querySelector("#stkApply") || {}).textContent || ""), { timeout: 8000 }).catch(() => {});
      await sleep(120);
      const t1 = await tray(page);
      const calls1 = await page.evaluate(() => window.__calls.slice());
      /* Second Apply archives winter.ec when answered yes. */
      await page.evaluate(() => document.querySelector("#stkApply").click());
      await page.waitForSelector('.rv-above[data-above][role="alertdialog"]', { timeout: 5000 }).catch(() => {});
      await page.evaluate(() => { const b = document.querySelector('[data-act="stk-above-yes"]'); if (b) b.click(); });
      await page.waitForFunction(() => {
        const ap = document.querySelector("#stkApply");
        return ap && ap.textContent.replace(/\s+/g, " ").trim() === "Apply decided: 0";
      }, { timeout: 8000 }).catch(() => {});
      await sleep(120);
      const t2 = await tray(page);
      await page.close();
      /* aboveEngine declined keeps its records in Decided with its reason. */
      page = await fresh(aboveData);
      await page.evaluate(() => document.querySelector('#stkKinds [data-k="team"]').click());
      await sleep(60);
      for (let i = 0; i < 3; i++) await answer(page, "a");
      await page.evaluate(() => document.querySelector("#stkApply").click());
      await page.waitForSelector('.rv-above[data-above][role="alertdialog"]', { timeout: 5000 }).catch(() => {});
      await page.evaluate(() => { const b = document.querySelector('[data-act="stk-above-no"]'); if (b) b.click(); });
      await page.waitForFunction(() => /^Apply decided/.test((document.querySelector("#stkApply") || {}).textContent || ""), { timeout: 8000 }).catch(() => {});
      await sleep(120);
      const t3 = await tray(page);
      check(/cannot show\. Archiving keeps it whole\./.test(q1) && /Etiuda 99\.0 or newer/.test(q2)
        && !calls1.some((c) => c[0] === "proposalDecide" && c[1] === "S:\\inbox\\winter.ec")
        && calls1.some((c) => c[0] === "proposalDecide" && c[1] === "S:\\inbox\\desk-four.ec")
        && calls1.some((c) => c[0] === "leaveFinding")
        && t1.rows.length === 2 && t1.rows.every((r) => r.ref === "Not applied: This proposal holds things this Studio cannot show. Archiving keeps it whole." && r.back)
        && t2.rows.length === 0 && t2.wholes.some((w) => /^winter-prices\.csv/.test(w))
        && t3.rows.length === 3 && t3.rows.every((r) => /^Not applied: This proposal asks for Etiuda 99\.0 or newer/.test(r.ref)),
        "rd48 archive question asks once per aboveEngine/unknownHead file before archiving; Cancel keeps its rows in Decided with a reason without archiving while other files apply; Archive anyway applies it",
        { q1, q2, calls1: calls1.map((c) => c[0] + ":" + c[1]), t1: t1.rows.map((r) => [r.t, r.ref]), t2: [t2.rows.length, t2.wholes], t3: t3.rows.map((r) => r.ref) });
      await page.close();
    });
    if (wants("rd49")) await guard(["rd49"], async () => {
      const sayFor = async (lang) => {
        page = await fresh(two, lang);
        const s = {};
        await answer(page, "a"); s.acc = (await tray(page)).said;
        await answer(page, "r"); s.rej = (await tray(page)).said;
        await answer(page, "s"); s.lat = (await tray(page)).said;
        await chord(page, "Control", "z"); await sleep(60); s.tb = (await tray(page)).said;
        await answer(page, "r");
        await answer(page, "a");
        await answer(page, "a");
        await answer(page, "a");
        await answer(page, "r"); s.left = (await tray(page)).said;
        await answer(page, "a"); s.last = (await tray(page)).said;
        await page.close();
        return s;
      };
      const en = await sayFor("en"), pl = await sayFor("pl");
      check(en.acc === "Accepted: Changing the bulb. Waiting: 6."
        && en.rej === "Rejected: Row 1. Waiting: 5."
        && en.lat === "Moved to the end: Row 2. Waiting: 5."
        && en.tb === "Taken back: Row 1. Waiting: 6."
        && en.left === "Left as it is: Courier costs. Waiting: 1."
        && en.last === "Accepted: Row 2. Nothing left to decide."
        && pl.acc === "Zaakceptowano: Changing the bulb. Czeka: 6."
        && pl.rej === "Odrzucono: Row 1. Czeka: 5."
        && pl.lat === "Przeniesiono na koniec: Row 2. Czeka: 5."
        && pl.tb === "Cofnięto: Row 1. Czeka: 6."
        && pl.left === "Bez zmian: Courier costs. Czeka: 1."
        && pl.last === "Zaakceptowano: Row 2. Nie ma już nic do decyzji.",
        "rd49 screen reader line announces every answer, Later, Take back and the last item in both English and Polish (P2: the admission and the refusal lines went with the request card, and the counts are one less)",
        { en, pl });
    });
    if (wants("rd50")) await guard(["rd50"], async () => {
      /* a numbers warning (Studio's own kind of warning row, left as it is like any finding) is a Checks card, and R then Apply
         sends its own line to leaveFinding, after which it is gone from Decided */
      const numRow = { severity: "warning", kind: "numbers", what: "Numbers differ between languages", where: "Row 1", card: cardIds[0], go: null,
        why: "en: 14; pl: 30", languages: ["en", "pl"], byLang: { en: ["14"], pl: ["30"] } };
      const numData = Object.assign(inbox(1, 0), { lint: { errors: 0, warnings: 1, rows: [numRow] }, requests: [], drafts: [] });
      page = await fresh(numData);
      await page.evaluate(() => document.querySelector('#stkKinds [data-k="check"]').click());
      await sleep(60);
      const hand = (await look(page)).hand;
      await answer(page, "r");
      const t1 = await tray(page);
      await page.evaluate(() => document.querySelector("#stkApply").click());
      await page.waitForFunction(() => {
        const ap = document.querySelector("#stkApply");
        return ap && ap.textContent.replace(/\s+/g, " ").trim() === "Apply decided: 0";
      }, { timeout: 8000 }).catch(() => {});
      await sleep(120);
      const t2 = await tray(page);
      const calls = await page.evaluate(() => window.__calls.filter((c) => c[0] === "leaveFinding"));
      check(hand && hand.kind === "check" && t1.rows.length === 1
        && calls.length === 1 && calls[0][1] === cardIds[0] && calls[0][2] === "en: 14; pl: 30"
        && t2.rows.length === 0,
        "rd50 a numbers warning is a Checks card of the door, and Leave as it is sends its own line of numbers to leaveFinding at Apply and leaves Decided",
        { hand: hand && [hand.kind, hand.title], decided: t1.rows.length, calls, after: t2.rows.length });
      await page.close();
    });

    /* ---- desk flags in the review stack (rd52..rd54) ------------------------------------------------------------ */
    if (wants("rd52") || wants("rd53") || wants("rd54") || wants("rd55")) {
      const F = await Engine.format();
      const V = Engine.sigRules();
      const pinSrc = fs.readFileSync(path.join(ROOT, "engine", "pinned", "src", "modules", "catalog-v2.js"), "utf8");
      const E = await import("data:text/javascript;base64," + Buffer.from(pinSrc).toString("base64") + "#rdflags");
      const PASS = "passphrase for review door flags";
      const keyAt = path.join(SCRATCH, "flag-lead.key");
      const keyObj = await makeKeyFile({ passphrase: PASS });
      fs.writeFileSync(keyAt, JSON.stringify(keyObj, null, 1) + "\n", "utf8");
      const mkDesk = (name) => {
        const pair = crypto.generateKeyPairSync("ed25519");
        const raw = pair.publicKey.export({ type: "spki", format: "der" }).subarray(-32);
        const box = crypto.generateKeyPairSync("x25519").publicKey.export({ type: "spki", format: "der" }).subarray(-32).toString("hex");
        const id = "k-" + crypto.createHash("sha256").update(raw).digest("hex").slice(0, 16);
        const block = { id, key: raw.toString("hex"), box };
        if (name) block.name = name;
        return { id, block, pair };
      };
      const writeSignedDesk = (shareDir, desk, fromEd, flags) => {
        const doc = JSON.parse(JSON.stringify(E.catalogToV2(E.catalogFromV2(JSON.parse(JSON.stringify(fromEd))))));
        doc.id = desk.id + "-" + crypto.createHash("sha256").update(String(fromEd.id)).digest("hex").slice(0, 8);
        doc.rev = 1; doc.date = "2026-11-16"; doc.modified = true;
        doc.grew = { id: String(fromEd.id), rev: Number(fromEd.rev), sha: "sha256:" + crypto.createHash("sha256").update(V.v2SignedBytes(fromEd)).digest("hex") };
        doc.desk = JSON.parse(JSON.stringify(desk.block));
        doc.flags = flags;
        delete doc.hash; delete doc.sig;
        doc.hash = F.contentHash(doc);
        doc.sig = { alg: "Ed25519", keyId: desk.id };
        const msg = Buffer.concat([Buffer.from("etiuda-desk-branch\n", "utf8"), Buffer.from(V.v2SignedBytes(doc))]);
        doc.sig.value = crypto.sign(null, msg, desk.pair.privateKey).toString("hex");
        const at = path.join(shareDir, "desks", desk.id, "cat-" + desk.id.slice(2, 8) + ".ec");
        fs.mkdirSync(path.dirname(at), { recursive: true });
        fs.writeFileSync(at, JSON.stringify(doc, null, 1) + "\n", "utf8");
      };
      const setupFlagProj = async (tag) => {
        const pRoot = path.join(SCRATCH, "flag-projects-" + tag);
        const shareDir = path.join(SCRATCH, "flag-share-" + tag);
        fs.mkdirSync(pRoot, { recursive: true });
        fs.mkdirSync(shareDir, { recursive: true });
        const mk = await Studio.newProject(pRoot, "Harbour lamps " + tag, [{ code: "en", name: "English" }, { code: "pl", name: "Polish" }]);
        const fDir = mk.dir;
        const sh = (await Studio.addTag(fDir, "shelf", { en: "Returns", pl: "Zwroty" })).tag.id;
        const c1 = (await Studio.addCard(fDir, sh, "Returns window", "A lamp can be returned within 30 days of delivery.")).card.id;
        const c2 = (await Studio.addCard(fDir, sh, "Parcel lockers", "A parcel locker holds the lamp for 48 hours.")).card.id;
        await Studio.saveCard(fDir, c1, { title: { pl: "Okres zwrotu" }, body: { pl: "Lampę można zwrócić w ciągu 30 dni od dostawy." } });
        await Studio.saveCard(fDir, c2, { title: { pl: "Paczkomaty" }, body: { pl: "Paczkomat przechowuje lampę przez 48 godzin." } });
        const pub = await Studio.publishProject(fDir, { folder: shareDir, notes: "Ed 1", now: "2026-11-16T01:00:00.000Z", key: keyAt, passphrase: PASS, ...(await licensedOpts()) });
        if (pub.refused) throw new Error("flag publish refused: " + JSON.stringify(pub));
        const eds = editionsIn(fDir);
        const ed1 = JSON.parse(fs.readFileSync(path.join(fDir, ARCHIVE, eds[eds.length - 1], CATALOG_IN_ARCHIVE), "utf8"));
        const op = await wire(Studio.openProject(fDir));
        const cards = op.draft.cards;
        const seen1 = Flags.flagSeenOfCard(cards.find((c) => c.id === c1), "en");
        const seen2 = Flags.flagSeenOfCard(cards.find((c) => c.id === c2), "en");
        const catList = [{ id: op.project.id, name: op.project.name, dir: fDir, rev: 1, counts: { cards: 2 }, langs: ["en", "pl"],
          changes: 0, checks: 0, opened: "2026-11-16T01:00:00.000Z", edited: "2026-11-16T01:00:00.000Z" }];
        return { fDir, shareDir, c1, c2, ed1, op, seen1, seen2, catList };
      };
      const bootRealFlags = async (fx, lang) => {
        const pg = await browser.newPage();
        await pg.emulateMediaFeatures(MOTION_ON);
        await pg.setViewport({ width: 1280, height: 800 });
        await pg.exposeFunction("__hostOpen", async (d) => wire(Studio.openProject(d)));
        await pg.exposeFunction("__hostProposals", async (d) => wire(Studio.listProposals(d, { folder: fx.shareDir, removed: fx.removed })));
        await pg.exposeFunction("__hostProposalOpen", async (d, f, l) => wire(Studio.openProposal(d, f, { lang: l })));
        await pg.exposeFunction("__hostFlagKeep", async (d, id) => wire(Flags.flagKeep(d, id, { folder: fx.shareDir, removed: fx.removed })));
        await pg.evaluateOnNewDocument((catList, fDir, lang) => {
          window.__calls = [];
          const base = {
            host: async () => ({ version: "0.1.0", uiLang: lang || "en", tour: { offered: true, taken: true, at: 0 }, lang: "" }),
            projects: async () => ({ root: fDir, projects: catList, sample: "" }),
            open: async (d) => window.__hostOpen(d),
            teams: async () => ({ teams: [] }),
            proposals: async (d) => window.__hostProposals(d),
            proposalOpen: async (d, f, l) => window.__hostProposalOpen(d, f, l),
            flagKeep: async (d, id) => { window.__calls.push(["flagKeep", id]); return window.__hostFlagKeep(d, id); },
            desks: async () => ({ error: null, folder: "", requests: [] }),
            aiDrafts: async () => ({ error: null, drafts: [] }),
            aiSettings: async () => ({ provider: "" }),
            onMaximized: () => {}, onTrayGo: () => {}, onOpenDir: () => {}, onTask: () => {},
            onTeamMoved: () => {}, onRelayLapse: () => {}, onRelaySyncNote: () => {},
          };
          window.STUDIO = new Proxy(base, {
            get(t, k) {
              if (k in t) return t[k];
              if (typeof k !== "string" || k === "then") return undefined;
              return /^on[A-Z]/.test(k) ? () => {} : async () => ({ error: null });
            },
          });
        }, fx.catList, fx.fDir, lang || "en");
        await pg.goto("file:///" + HTML_FILE.replace(/\\/g, "/"), { waitUntil: "load" });
        await pg.waitForSelector("#rail a", { timeout: 8000 });
        await pg.waitForFunction(() => !document.querySelector(".e-launch-veil"), { timeout: 10000 });
        await pg.evaluate(() => document.querySelector('#rail [data-act="home"][data-v="library"]').click());
        await pg.waitForSelector('#main [data-act="open"]', { timeout: 8000 });
        await pg.evaluate(() => document.querySelector('#main [data-act="open"]').click());
        await pg.waitForFunction(() => !!document.querySelector('#rail a[data-v="proposals"]'), { timeout: 8000 });
        await sleep(250);
        return pg;
      };
      const readFlagHand = (pg) => pg.evaluate(() => {
        const el = document.querySelector(".stk-card.hand");
        if (!el) return null;
        const flat = (s) => String(s || "").split(String.fromCharCode(160)).join(" ").replace(/\s+/g, " ").trim();
        const notes = Array.from(el.querySelectorAll(".stk-flag-note")).map((n) => ({
          text: flat(n.textContent),
          borderLeftColor: getComputedStyle(n).borderLeftColor,
        }));
        const btns = Array.from(el.querySelectorAll(".stk-keys .stk-k")).map((b) => {
          const kbd = b.querySelector("kbd");
          const label = Array.from(b.childNodes).filter((n) => n.nodeType === 3).map((n) => n.textContent).join("").trim();
          return (kbd ? kbd.textContent.trim() + " " : "") + label;
        });
        const bodyParas = Array.from(el.querySelectorAll(".stk-scroll > p:not(.stk-flag-note):not(.stk-was)")).map((p) => flat(p.textContent));
        return {
          kind: (el.className.match(/stk-(team|import|model|check|join|flag)/) || [])[1] || "",
          tag: flat((el.querySelector(".stk-tag") || {}).textContent),
          title: flat((el.querySelector(".stk-t") || {}).textContent),
          src: flat((el.querySelector(".stk-src") || {}).textContent),
          where: flat((el.querySelector(".stk-cat") || {}).textContent),
          bodyParas,
          notes,
          was: flat((el.querySelector(".stk-was") || {}).textContent),
          btns,
          fullText: flat(el.textContent),
          tagInk: el.querySelector(".stk-tag") ? getComputedStyle(el.querySelector(".stk-tag")).color : "",
        };
      });

      if (wants("rd52")) await guard(["rd52"], async () => {
        const fx = await setupFlagProj("rd52");
        const marta = mkDesk("Marta, desk 4");
        const nameless = mkDesk("");
        writeSignedDesk(fx.shareDir, marta, fx.ed1, [
          { card: fx.c1, lang: "en", seen: fx.seen1, r: "11111111111111111111111111111111", note: "The shop told a customer 14 days yesterday. Which is right?" },
        ]);
        writeSignedDesk(fx.shareDir, nameless, fx.ed1, [
          { card: fx.c1, lang: "en", seen: fx.seen1, r: "22222222222222222222222222222222" },
          { card: fx.c2, lang: "en", seen: fx.seen2, r: "33333333333333333333333333333333" },
        ]);
        const readLang = async (lang) => {
          const pg = await bootRealFlags(fx, lang);
          await enter(pg);
          await pg.evaluate(() => document.documentElement.setAttribute("data-theme", "light"));
          await sleep(60);
          const lightLook = await look(pg);
          const hALight = await readFlagHand(pg);
          await pg.evaluate(() => document.documentElement.setAttribute("data-theme", "dark"));
          await sleep(60);
          const darkLook = await look(pg);
          const hADark = await readFlagHand(pg);
          await pg.evaluate(() => document.documentElement.setAttribute("data-theme", "light"));
          await key(pg, "j");
          await sleep(60);
          const hBLight = await readFlagHand(pg);
          await pg.evaluate(() => document.documentElement.setAttribute("data-theme", "dark"));
          await sleep(60);
          const hBDark = await readFlagHand(pg);
          await pg.close();
          const pick = (xs, t) => xs.find((h) => h && h.title === t) || null;
          return {
            lightLook,
            darkLook,
            hand1Light: pick([hALight, hBLight], "Returns window"),
            hand1Dark: pick([hADark, hBDark], "Returns window"),
            hand2: pick([hALight, hBLight], "Parcel lockers"),
          };
        };
        const en = await readLang("en");
        const pl = await readLang("pl");
        const noTime = (h) => h && !/\d{4}-\d{2}-\d{2}|\b\d{1,2}:\d{2}\b/.test(h.fullText);
        const enChip = en.lightLook.chips.find((c) => c.k === "flag");
        const enChipDark = en.darkLook.chips.find((c) => c.k === "flag");
        const plChip = pl.lightLook.chips.find((c) => c.k === "flag");
        const okEn = en.lightLook.cards.length === 2
          && en.lightLook.num === "2"
          && enChip && enChip.text === "Flagged by desks 2" && enChip.ink === "rgb(166, 27, 86)"
          && enChipDark && enChipDark.ink === "rgb(244, 114, 166)"
          && en.hand1Light && en.hand1Light.kind === "flag"
          && en.hand1Light.tag === "Looks wrong to a desk" && en.hand1Light.tagInk === "rgb(166, 27, 86)"
          && en.hand1Dark && en.hand1Dark.tagInk === "rgb(244, 114, 166)"
          && en.hand1Light.title === "Returns window" && en.hand1Light.where === "Returns"
          && en.hand1Light.src === "from Marta, desk 4"
          && en.hand1Light.bodyParas[0] === "A lamp can be returned within 30 days of delivery."
          && en.hand1Light.notes.length === 1
          && en.hand1Light.notes[0].text === "Marta, desk 4: The shop told a customer 14 days yesterday. Which is right?"
          && en.hand1Light.notes[0].borderLeftColor === "rgb(166, 27, 86)"
          && en.hand1Dark.notes[0].borderLeftColor === "rgb(244, 114, 166)"
          && en.hand1Light.was === "Other desks that flagged it too: 1."
          && en.hand1Light.btns.join("|") === "A Mend the card|R Leave as it is|S Later"
          && noTime(en.hand1Light)
          && en.hand2 && en.hand2.kind === "flag" && en.hand2.src === "from a desk"
          && en.hand2.notes.length === 0 && en.hand2.was === "" && noTime(en.hand2);
        const okPl = pl.lightLook.cards.length === 2
          && plChip && plChip.text === "Zgłoszenia ze stanowisk 2"
          && pl.hand1Light && pl.hand1Light.tag === "Zgłoszone ze stanowiska"
          && pl.hand1Light.src === "od stanowiska Marta, desk 4"
          && pl.hand1Light.was === "Inne stanowiska, które też to zgłosiły: 1."
          && pl.hand1Light.btns.join("|") === "A Popraw kartę|R Zostaw bez zmian|S Później"
          && pl.hand2 && pl.hand2.src === "od jednego ze stanowisk" && pl.hand2.was === "";
        check(okEn && okPl,
          "rd52 flags from two desks (two on one card, one with a note, one nameless) show one item per card of the sixth kind with count, tag, note, source, other desks, no time, both themes and both languages",
          { enChip, enChipDark, enH1: en.hand1Light, enH2: en.hand2, plChip, plH1: pl.hand1Light, plH2: pl.hand2 });
      });

      if (wants("rd53")) await guard(["rd53"], async () => {
        const fx = await setupFlagProj("rd53");
        const marta = mkDesk("Marta, desk 4");
        const nameless = mkDesk("");
        writeSignedDesk(fx.shareDir, marta, fx.ed1, [
          { card: fx.c1, lang: "en", seen: fx.seen1, r: "44444444444444444444444444444444", note: "Check days." },
        ]);
        writeSignedDesk(fx.shareDir, nameless, fx.ed1, [
          { card: fx.c2, lang: "en", seen: fx.seen2, r: "55555555555555555555555555555555" },
        ]);
        const flagsFile = path.join(fx.fDir, Flags.FLAGS_FILE);
        const pg = await bootRealFlags(fx, "en");
        await enter(pg);
        await pg.evaluate(() => document.querySelector("#stkStage").focus());
        /* S (Later) puts first card at bottom, still waiting */
        const firstTitle = ((await look(pg)).hand || {}).title;
        await answer(pg, "s");
        const afterS = await look(pg);
        const stillWaitingAfterS = Flags.flagsWaiting(fx.fDir, { folder: fx.shareDir }).length === 2 && !fs.existsSync(flagsFile);

        /* A (Mend the card) opens card in Cards editor with body focused, nothing settled */
        const secondTitle = (afterS.hand || {}).title;
        await answer(pg, "a");
        await sleep(120);
        const atCards = await pg.evaluate(() => ({
          sec: (document.querySelector("#rail a.on") || {}).getAttribute ? document.querySelector("#rail a.on").getAttribute("data-v") : "",
          fld: document.activeElement && document.activeElement.getAttribute ? document.activeElement.getAttribute("data-f") : "",
        }));
        const stillWaitingAfterA = Flags.flagsWaiting(fx.fDir, { folder: fx.shareDir }).length === 2 && !fs.existsSync(flagsFile);

        /* Return to Review, answer R (Leave as it is) on the hand, verify nothing written before Apply decided */
        await enter(pg, "rail");
        await pg.evaluate(() => document.querySelector("#stkStage").focus());
        await answer(pg, "r");
        const tBeforeApply = await tray(pg);
        const stillWaitingAfterR = Flags.flagsWaiting(fx.fDir, { folder: fx.shareDir }).length === 2 && !fs.existsSync(flagsFile);

        /* Apply decided -> calls flagKeep, settles in flags.json, leaves Decided, drops Review count to 1 */
        await pg.evaluate(() => document.querySelector("#stkApply").click());
        await pageWaitZero(pg);
        await sleep(120);
        const tAfterApply = await tray(pg);
        const lAfterApply = await look(pg);
        const calls = await pg.evaluate(() => window.__calls.filter((c) => c[0] === "flagKeep"));
        const waitingAfterApply = Flags.flagsWaiting(fx.fDir, { folder: fx.shareDir });
        await pg.close();

        function pageWaitZero(p) {
          return p.waitForFunction(() => {
            const ap = document.querySelector("#stkApply");
            return ap && ap.textContent.replace(/\s+/g, " ").trim() === "Apply decided: 0";
          }, { timeout: 8000 }).catch(() => {});
        }

        const ok = !!firstTitle && afterS.hand && afterS.hand.title !== firstTitle
          && !!secondTitle && stillWaitingAfterS
          && atCards.sec === "cards" && atCards.fld === "body" && stillWaitingAfterA
          && tBeforeApply.rows.length === 1 && tBeforeApply.rows[0].t === secondTitle
          && /^Left as it is/.test(tBeforeApply.rows[0].w) && tBeforeApply.rows[0].no && stillWaitingAfterR
          && calls.length === 1 && tAfterApply.rows.length === 0 && lAfterApply.num === "1"
          && waitingAfterApply.length === 1 && fs.existsSync(flagsFile);
        check(ok,
          "rd53 S moves flag to Later, A opens the card to mend it without settling, R moves to Decided without writing before Apply decided, and Apply settles via flagKeep and drops Review count",
          { firstTitle, afterS: afterS.hand && afterS.hand.title, atCards, tBeforeApply, tAfterApply, num: lAfterApply.num, calls, waitingAfterApply: waitingAfterApply.length });
      });

      if (wants("rd54")) await guard(["rd54"], async () => {
        const fx = await setupFlagProj("rd54");
        const marta = mkDesk("Marta, desk 4");
        const d7 = mkDesk("Desk 7");
        writeSignedDesk(fx.shareDir, marta, fx.ed1, [
          { card: fx.c1, lang: "en", seen: fx.seen1, r: "66666666666666666666666666666666", note: "First desk note." },
        ]);
        writeSignedDesk(fx.shareDir, d7, fx.ed1, [
          { card: fx.c1, lang: "en", seen: fx.seen1, r: "77777777777777777777777777777777", note: "Second desk note." },
        ]);
        const pg = await bootRealFlags(fx, "en");
        await enter(pg);
        const l = await look(pg);
        const h = await readFlagHand(pg);
        await pg.close();
        check(l.num === "1" && l.cards.length === 1 && h && h.kind === "flag"
          && h.notes.length === 2
          && h.notes[0].text === "Desk 7: Second desk note."
          && h.notes[1].text === "Marta, desk 4: First desk note."
          && h.was === "Other desks that flagged it too: 1.",
          "rd54 Review count 1 always has its flag item in the stack (count-and-stack coupling) and several notes render one under another",
          { num: l.num, cards: l.cards.length, notes: h && h.notes, was: h && h.was });
      });
      if (wants("rd55")) await guard(["rd55"], async () => {
        /* THE REVIEW NUMBER NEVER NAMES WHAT THE STACK CANNOT SHOW. A flag on a card the draft no longer holds, and a flag from a
           desk since removed, are neither items of the stack nor part of its count: the same project read with them added
           shows the same number and the same one card, and the two reads the screen is built from agree. */
        const fx = await setupFlagProj("rd55");
        const marta = mkDesk("Marta, desk 4");
        writeSignedDesk(fx.shareDir, marta, fx.ed1, [
          { card: fx.c1, lang: "en", seen: fx.seen1, r: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", note: "Is this still 30 days?" },
        ]);
        const read = async () => {
          const pg = await bootRealFlags(fx, "en");
          await enter(pg);
          const l = await look(pg);
          const h = await readFlagHand(pg);
          await pg.close();
          const listed = await Studio.listProposals(fx.fDir, { folder: fx.shareDir, removed: fx.removed });
          const waiting = Flags.flagsWaiting(fx.fDir, { folder: fx.shareDir, removed: fx.removed });
          return { num: l.num, cards: l.cards.length, title: h && h.title, src: h && h.src, was: h && h.was,
            listedFlags: listed.flags.length, waiting: waiting.length };
        };
        const before = await read();
        /* A card the draft held when a desk flagged it and holds no longer. */
        const shelf = fx.op.draft.tags[0].id;
        const c3 = (await Studio.addCard(fx.fDir, shelf, "Gift wrap", "A lamp can be gift wrapped for a small fee.")).card.id;
        const ghost = mkDesk("Desk 9");
        writeSignedDesk(fx.shareDir, ghost, fx.ed1, [
          { card: c3, lang: "en", seen: "0".repeat(64), r: "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb", note: "Gift wrap is not offered." },
        ]);
        await Studio.deleteCard(fx.fDir, c3);
        /* A desk since removed, its file a record of what it said while trusted, flagging a card the draft does hold. */
        const gone = mkDesk("Desk 3");
        writeSignedDesk(fx.shareDir, gone, fx.ed1, [
          { card: fx.c2, lang: "en", seen: fx.seen2, r: "cccccccccccccccccccccccccccccccc", note: "Lockers hold it five days now." },
        ]);
        const rel = "desks/" + gone.id + "/cat-" + gone.id.slice(2, 8) + ".ec";
        fx.removed = { [gone.id]: { at: Date.now(), files: { [rel]: crypto.createHash("sha256").update(fs.readFileSync(path.join(fx.shareDir, ...rel.split("/")))).digest("hex") } } };
        const after = await read();
        check(before.num === "1" && before.cards === 1 && before.title === "Returns window" && before.listedFlags === 1 && before.waiting === 1
          && JSON.stringify(after) === JSON.stringify(before),
          "rd55 a flag on a card the draft no longer holds and a flag from a desk since removed move neither the stack nor the Review number: one card, number 1, one item in the listing and in the waiting flags, as before they were added",
          { before, after });
      });
    }
    if (SHOTS && !ONLY) {
      fs.mkdirSync(SHOTS, { recursive: true });
      let nShot = 0;
      const shot = async (pg, name) => {
        for (const theme of ["light", "dark"]) {
          /* A native button face keeps the scheme it is leaving, so a shot at 50 ms records a grey
             fill. The disc is the build's when its background is the panel, as on every other screen. */
          await pg.emulateMediaFeatures([{ name: "prefers-color-scheme", value: theme }]);
          await pg.evaluate((t) => {
            document.documentElement.style.colorScheme = t;
            document.documentElement.setAttribute("data-theme", t);
          }, theme);
          await pg.waitForFunction(() => {
            const el = document.querySelector("#discNew");
            if (!el) return true;
            const probe = document.createElement("span");
            probe.style.backgroundColor = "var(--panel)";
            document.body.appendChild(probe);
            const want = getComputedStyle(probe).backgroundColor;
            probe.remove();
            return getComputedStyle(el).backgroundColor === want;
          }, { timeout: 4000 });
          await pg.screenshot({ path: path.join(SHOTS, name + "-" + theme + ".png"), type: "png" });
          nShot++;
        }
      };
      page = await boot(browser, eight, opened, catalogs);
      await enter(page);
      await page.evaluate(() => document.querySelector("#stkStage").focus());
      await answer(page, "a"); await answer(page, "a"); await answer(page, "r");
      await shot(page, "ordinary");
      await page.close();
      page = await boot(browser, forty, opened, catalogs);
      await enter(page);
      await shot(page, "forty");
      await page.close();
      page = await boot(browser, eight, opened, catalogs);
      await enter(page);
      await page.evaluate(() => document.querySelector("#stkStage").focus());
      for (let i = 0; i < 4; i++) await key(page, "j");
      await sleep(40);
      const longTitle = ((await look(page)).hand || {}).title || "";
      if (longTitle !== "Returns after Christmas") throw new Error("long still is \"" + longTitle + "\"");
      await shot(page, "long");
      await page.close();
      const changedDoor = Object.assign(inbox(2, 0), { lint: { errors: 0, warnings: 0, rows: [] }, requests: [], drafts: [] });
      page = await boot(browser, changedDoor, opened, catalogs);
      await enter(page);
      await page.evaluate(() => document.querySelector("#stkStage").focus());
      await answer(page, "a");
      await page.evaluate(() => {
        const f = window.__door.files["S:\\inbox\\desk-four.ec"];
        f.changes[0].becomes = "The bulb is changed.";
        f.changes[1].becomes = "Delivery takes nine days.";
      });
      await page.evaluate(() => document.querySelector("#stkStage").focus());
      await key(page, "Escape");
      await sleep(150);
      await enter(page);
      const changedHand = (await look(page)).hand;
      if (!changedHand || !changedHand.changed || changedHand.title !== "Changing the bulb") throw new Error("changed still " + JSON.stringify(changedHand));
      await shot(page, "changed");
      await page.close();
      page = await boot(browser, eight, opened, catalogs);
      await enter(page);
      await page.evaluate(() => document.querySelector("#stkStage").focus());
      for (const k of ["a", "a", "r", "a", "a", "a", "r"]) await answer(page, k);
      await key(page, "a");
      await page.keyboard.type("4417 9026");
      await key(page, "Enter");
      await sleep(80);
      await page.waitForFunction(() => /Nothing left to decide/.test((document.querySelector("#stkStage .stk-empty") || {}).textContent || ""), { timeout: 8000 });
      await shot(page, "all-decided");
      await page.close();
      page = await boot(browser, none, opened, catalogs);
      await page.evaluate(() => document.querySelector('#rail a[data-v="proposals"]').click());
      await page.waitForFunction(() => !!document.querySelector("#stkStage .stk-empty"), { timeout: 8000 });
      await shot(page, "nothing-waits");
      await page.close();
      page = await boot(browser, Object.assign({}, eight, { requests: [] }), opened, catalogs);
      await enter(page);
      await page.evaluate(() => document.querySelector('#stkKinds [data-k="join"]').click());
      await sleep(80);
      await page.waitForFunction(() => /Nothing waits under/.test((document.querySelector("#stkStage .stk-empty") || {}).textContent || ""), { timeout: 8000 });
      await shot(page, "nothing-under-a-kind");
      await page.close();
      process.stdout.write("#stills " + nShot + " files in " + SHOTS + "\n");
    }
  } finally {
    await browser.close();
    dropScratch(SCRATCH, "tests/review-door.mjs");
  }
  const ran = ONLY ? 1 : LEGS.length;
  if (!ONLY) {
    copyPlants({
      root: ROOT, self: SELF, label: "review-door", onlyVar: "REVIEW_DOOR_ONLY", check, skip, timeout: 240000,
      plants: [
        { mark: "stk-field", leg: "rd7", rel: "ui/app.js", line: "" },
        { mark: "stk-cull", leg: "rd6", rel: "ui/app.js", line: "" },
        { mark: "stk-foot", leg: "rd5", rel: "ui/app.js", line: "    const rows = Math.max(2, Math.floor((H - STK.top - hh) / STK.row) || 0);" },
        { mark: "stk-wheel", leg: "rd8", rel: "ui/app.js", line: "" },
        { mark: "stk-held", leg: "rd18", rel: "ui/app.js", line: "  const stkRestOf = (x) => (x.kind === \"team\" ? stkPile().filter((y) => y.kind === \"team\" && y.file === x.file) : []);" },
        { mark: "stk-guard", leg: "rd22", rel: "ui/app.js", line: "" },
        { mark: "stk-keep", leg: "rd25", rel: "ui/app.js", line: "      if (!r || r.error || !r.ok) { rows.forEach((x) => written.add(x.key)); continue; }" },
        { mark: "stk-sent", leg: "rd27", rel: "ui/app.js", line: "    const sent = changed && changed.dropped ? T(\"{DESK} sent this again at {TIME}, so the earlier answer was dropped.\", { DESK: changed.who || \"\", TIME: stkClock(changed.at) }) : \"\";" },
        { mark: "stk-where", leg: "rd28", rel: "ui/app.js", line: "          where: stkShelf(c)," },
        { mark: "stk-more", leg: "rd30", rel: "ui/app.js", line: "    if (!more.hidden) more.style.left = \"50%\";" },
        { mark: "stk-fade", leg: "rd31", rel: "ui/app.js", line: "      scroll.classList.remove(\"is-fading\");" },
        { mark: "stk-list", leg: "rd32", rel: "ui/app.js", line: "    done.classList.remove(\"is-fading\");" },
        { mark: "stk-said", leg: "rd33", rel: "ui/app.js", line: "  const stkWhere = (c) => stkShelf(c) || stkCardShelf(c && (c.id || c.card));" },
        { mark: "stk-enter", leg: "rd34", rel: "ui/app.js", line: "          enter.set(el, { transform: \"translateY(0px)\" });" },
        { mark: "stk-ease", leg: "rd35", rel: "ui/index.html", line: ".stk{--stk-ease:cubic-bezier(.2,1.8,.3,1)}" },
        { mark: "stk-land", leg: "rd36", rel: "ui/index.html", line: ".stk{--stk-land:340ms}" },
        { mark: "stk-fly", leg: "rd36", rel: "ui/app.js", line: "        if (d) el.style.transform = \"translateY(62px) scale(0.3333)\";" },
        { mark: "stk-still", leg: "rd39", rel: "ui/index.html", line: "" },
        { mark: "stk-keep-refused", leg: "rd40", rel: "ui/app.js", line: "      if (!have.has(k) && !(st.applying && st.applying.has(k))) delete st.answers[k];" },
        { mark: "stk-file-check", leg: "rd40", rel: "ui/app.js", line: "      if (false && API.proposalOpen) {" },
        { mark: "stk-from", leg: "rd45", rel: "ui/app.js", line: "" },
        { mark: "door-numbers", leg: "rd50", rel: "ui/app.js", line: "  const doorCheck = (r) => !!r && r.severity === \"error\" && r.kind !== \"numbers\";" },
        { mark: "stk-all", leg: "rd9", rel: "ui/app.js", line: "    for (steps.push(...Array(w.length).fill(STK.row)); k <= steps.length && st.at + k < w.length; k++) {" },
        { mark: "stk-from-desc", leg: "rd45", rel: "ui/app.js", line: "        + '\"'" },
        { mark: "stk-from-head", leg: "rd45", rel: "ui/app.js", line: "      + \"\"" },
        { mark: "stk-whole", leg: "rd47", rel: "ui/app.js", line: '      + ""' },
        { mark: "stk-above", leg: "rd48", rel: "ui/app.js", line: "      if (false) {" },
        { mark: "stk-say", leg: "rd49", rel: "ui/app.js", line: '      const line = label + ": " + title;' },
        { mark: "stk-cut", leg: "rd51", rel: "ui/app.js", line: '    + ".pwc-labels>span,.pw-path,.pwc-where .nm,.dm-fold .nm,.dm-fold .sub,.dm-desk .nm,.dm-desk .st,"' },
        { mark: "stk-flag-item", leg: "rd54", rel: "ui/app.js", line: "    if (false) {" },
        { mark: "flag-drop-removed", leg: "rd55", rel: "src/flags.mjs", line: "    const dropped = false;" },
        { mark: "stk-lede-one-line", leg: "rd56", rel: "ui/index.html", line: "" },
        { mark: "stk-kept-group", leg: "rd57", rel: "ui/app.js", line: "" },
        { mark: "stk-kept-valid", leg: "rd57", rel: "ui/app.js", line: "    const ok = f && typeof f === \"object\";" },
        { mark: "stk-kept-apply", leg: "rd57", rel: "ui/app.js", line: "" },
        { mark: "stk-kept-same", leg: "rd57", rel: "ui/app.js", line: "            const g = kf.desk + String.fromCharCode(0) + kf.card;" },
        { mark: "flag-unknown-card", leg: "rd55", rel: "src/flags.mjs", line: '    if (typeof e.card !== "string") return fail("unknown card");' },
      ],
    });
  }
  const want = ONLY ? ran + 1 : EXPECTED;
  check(checks + skipped + 1 === want, "rd0 every leg ran: " + (checks + skipped + 1) + " of " + want);
  process.stdout.write("#counts checks=" + checks + " skipped=" + skipped + " failed=" + fails + " expected=" + want + "\n");
  process.stdout.write(fails ? "review-door: " + fails + " of " + checks + " FAILED\n" : "review-door: all " + checks + " checks hold\n");
  process.exit(fails ? 1 : 0);
}

main().catch((e) => { process.stderr.write(String(e && e.stack || e) + "\n"); process.exit(2); });
