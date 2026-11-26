/* ENTER CONFIRMS A DIALOG, AND A STRIP'S OWN BUTTON (desktop polish, 2026-10-12).
 *
 *     node tests/cover-enter.mjs
 *
 * A single-line field in a dialog presses the solid button in the dialog's foot. Ctrl+Enter
 * does that from a textarea, and Enter alone in a textarea does not. New project's language
 * box presses Add a language, the button in its own row, and does not make the project. The
 * Enter in the counting period presses nothing, and a desk's code presses Admit. A project name,
 * a card field and a finder keep the Enter they already had. Publish's own listener is this
 * one handler now.
 *
 * With the focus on no field (the cover's words, or nothing at all), Enter presses the solid
 * button of a cover that has a field (ce16, ce17). A cover with no field is a confirmation, and
 * there Enter presses only a primary marked data-enter: Start a team on the Etiuda relay (ce20);
 * Remove, Cancel an opened invitation, Hand over, Move the team, Discard and the team's Seal press
 * nothing (ce21, the test architect's E1 of 2026-11-01). A control inside keeps its own Enter.
 * Reset Studio? resets only by its own press: Enter in its typed word, or with the focus on nothing, presses nothing
 * even with RESET typed (ce22).
 * Enter in a text field is unchanged. An input method's Enter presses nothing (ce18), and
 * Escape in a field presses only Cancel (ce19).
 *
 * The page runs on tests/page-stand-in.mjs. The key is handed the event a keydown would, and
 * the button it would press is the one the painted markup's selectors name.
 *
 * PROVED BY MAKING IT FAIL: COVER_ENTER_APP=<a copy of ui/app.js> reads that copy. A copy whose
 * confirmKey returns "" reddens ce2, ce3, ce5 and ce10 (ce9 retired, P2). Two plants, each removed in a scratch
 * copy (tests/plant-copy.mjs): the no-field guard (f11-enter) reddens ce21, and the relay start's
 * mark (f11-relay-enter) reddens ce20. ETIUDA_PLANTS=off skips both and counts them.
 *
 * Node only, no window, no Electron. Exit 0 when every check holds, 1 when any fails.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadPage } from "./page-stand-in.mjs";
import { copyPlants } from "./plant-copy.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const SELF = fileURLToPath(import.meta.url);
const EXPECTED = 25; /* 26 less ce9, retired with the code door (P2) */
const PLANTS_OFF = process.env.ETIUDA_PLANTS === "off";
let skipped = 0;
function skip(line) {
  skipped++;
  process.stdout.write("  SKIP  " + line + "\n");
}
const source = process.env.COVER_ENTER_APP
  ? fs.readFileSync(path.resolve(process.env.COVER_ENTER_APP), "utf8") : undefined;

let asserted = 0, failed = 0;
function check(cond, line) {
  asserted++;
  if (cond) process.stdout.write("  ok   " + line + "\n");
  else { failed++; process.stdout.write("  FAIL " + line + "\n"); }
}

const SOLID = ".foot button.btn.solid:not([disabled])";
const ROW_BTN = "button[data-act]:not([disabled])";

function button(act, enter) {
  return {
    tagName: "BUTTON", disabled: false,
    getAttribute: (k) => (k === "data-act" ? act : k === "data-enter" && enter ? "" : null),
    closest: () => null,
  };
}
function field(tag, id, where) {
  return {
    tagName: tag, id: id || "", disabled: false, readOnly: false,
    getAttribute: (k) => (where.attr && Object.prototype.hasOwnProperty.call(where.attr, k) ? where.attr[k] : null),
    closest: (sel) => (where.closest ? where.closest(sel) : null),
  };
}
function key(target, extra) {
  let prevented = false;
  const e = Object.assign({ key: "Enter", target, preventDefault() { prevented = true; } }, extra || {});
  const act = P.confirmKey(e);
  return { act, prevented };
}

const home = loadPage({ uiLang: "en", source });
const P = home.page;
const pressed = [];
function watch(act) {
  P.ACTS[act] = () => { pressed.push(act); };
}
["do-new", "do-card-new", "do-tag-new", "do-lang-new", "do-publish", "do-key-backup",
  "new-lang-add"].forEach(watch);

const heard = home.doc.heard.some((h) => h.type === "keydown" && h.fn === P.confirmKey);
check(typeof P.confirmKey === "function" && heard,
  "ce1 Enter in a dialog is one keydown handler, confirmKey: " + (heard ? "listening" : "not listening"));

const solid = button("do-new");
const add = button("new-lang-add");
const dlg = {
  querySelector: (sel) => (sel === SOLID ? solid : null),
};
const langRow = {
  querySelector: (sel) => (sel === ROW_BTN ? add : null),
};
function inDlg(tag, id, row) {
  return field(tag, id, {
    closest: (sel) => (sel === "#dlg" ? dlg : sel === ".row2" ? row : sel === "button" ? null : null),
  });
}

P.S.cover = "new";
let r = key(inDlg("INPUT", "newName", null));
check(r.act === "do-new" && r.prevented && pressed.join() === "do-new",
  "ce2 Enter in New project's name presses New project: " + r.act + " pressed " + pressed.join());

pressed.length = 0;
r = key(inDlg("INPUT", "newProjLang", langRow));
check(r.act === "new-lang-add" && pressed.join() === "new-lang-add",
  "ce3 Enter in the language box adds the language and does not make the project: " + r.act);

pressed.length = 0;
solid.getAttribute = (k) => (k === "data-act" ? "do-card-new" : null);
r = key(inDlg("TEXTAREA", "newCardBody", null));
check(r.act === "" && pressed.length === 0,
  "ce4 Enter in New card's text does not confirm: " + JSON.stringify(r.act));
r = key(inDlg("TEXTAREA", "newCardBody", null), { ctrlKey: true });
check(r.act === "do-card-new" && pressed.join() === "do-card-new",
  "ce5 Ctrl+Enter in that text presses New card: " + r.act);

pressed.length = 0;
r = key(inDlg("INPUT", "newName", null), { shiftKey: true });
check(r.act === "" && pressed.length === 0, "ce6 Shift+Enter confirms nothing: " + JSON.stringify(r.act));
r = key(field("INPUT", "title", {
  attr: { "data-f": "title" },
  closest: (sel) => (sel === "#dlg" ? dlg : null),
}));
check(r.act === "" && pressed.length === 0, "ce7 a card's own field keeps Enter: " + JSON.stringify(r.act));

pressed.length = 0;
r = key(field("SELECT", "statsSpan", { closest: () => null }));
check(r.act === "" && pressed.length === 0,
  "ce8 Enter in the counting period presses nothing: " + JSON.stringify(r.act));

/* RETIRED, P2 (no code is typed in a desk's row): ce9, "Enter in a desk's code admits that desk". */
solid.getAttribute = (k) => (k === "data-act" ? "do-publish" : null);
pressed.length = 0;
r = key(inDlg("INPUT", "fileName", null));
check(r.act === "do-publish" && pressed.join() === "do-publish",
  "ce10 Enter in the publish cover's file name still publishes: " + r.act);
P.__set("prBusy", true);
pressed.length = 0;
r = key(inDlg("INPUT", "fileName", null));
check(r.act === "" && pressed.length === 0, "ce11 a publish already going is not pressed again");
P.__set("prBusy", false);

function cover(kind, extra) {
  Object.assign(P.S, { cover: kind, err: null, coverKind: null, keyWant: null, keyCopy: null, newLangs: null }, extra || {});
  P.paintCoverOnly();
  return home.node("#dlg").innerHTML;
}
P.S.host = { langs: { builtIn: ["en", "pl"], endonyms: { en: "English", pl: "Polski" } }, tour: { offered: true } };
P.S.open = {
  dir: "p", name: "P", editions: [], langs: { rows: [] },
  draft: { langs: [{ code: "en" }, { code: "pl" }], tags: [{ id: "s", kind: "shelf", label: { en: "Greeting" } }], cards: [] },
  lint: { errors: 0, warnings: 0 }, awaiting: [],
};
/* New catalog is a page in its own tab since board 1019 (12), not a cover: its Enter is tests/new-catalog-one.mjs nco9. */
const covers = {
  lang: cover("lang"),
  tag: cover("tag", { coverKind: "shelf" }),
  intent: cover("tag", { coverKind: "request" }),
  card: cover("card"),
  key: cover("key", { keyWant: "backup" }),
};

const app = source != null ? source : fs.readFileSync(path.join(ROOT, "ui", "app.js"), "utf8");
check(!/e\.key !== "Enter" \|\| S\.cover !== "publish"/.test(app),
  "ce14 publish is not a second Enter handler of its own");

/* ---- WITH THE FOCUS ON NO FIELD (the test architect's condition 2 on this batch, 2026-10-13) ------------------------
   The publish cover's foot says "Enter publishes". A click on the cover's words leaves the focus on nothing (the body,
   in a window), and Enter there presses the cover's solid button, as it did before this batch. Each cover is read
   from its own painted markup: whether it holds a field, and the act its foot's solid button carries. */
const FIELD = 'input:not([type="hidden"]), textarea, select';
function painted(html) {
  const m = /<div class="foot[^"]*">[^]*?<button class="btn solid"(?: id="[^"]*")? data-act="([^"]+)"([^>]*)>/.exec(html) || [];
  const act = m[1] || null, enter = /\sdata-enter\b/.test(m[2] || "");
  const btn = act ? button(act, enter) : null;
  const typed = /<(input|textarea|select)\b(?![^>]*type="hidden")/.test(html);
  return { act, enter, typed, querySelector: (sel) => (sel === SOLID ? btn : sel === FIELD ? (typed ? {} : null) : null) };
}
const dlgNode = home.node("#dlg");
const dlgWas = dlgNode.querySelector;
/** Enter with the focus on nothing, the cover's dialog answering as its painted markup does. */
function nowhere(kind, box, extra) {
  P.S.cover = kind;
  dlgNode.querySelector = box.querySelector;
  try { return key(home.doc.body, extra); } finally { dlgNode.querySelector = dlgWas; }
}
/* The cover's own words, which take no focus and carry no act. */
const words = (box) => ({ tagName: "SPAN", closest: (sel) => (sel === "#dlg" ? box : null) });
/* A control inside the cover: a tick (a span with an act) and a button keep their own Enter. */
function control(box, tag) {
  const c = {
    tagName: tag, disabled: false, getAttribute: (k) => (k === "data-act" ? "warn" : null),
    closest: (sel) => (sel === "#dlg" ? box : /\[data-act\]|(^|, )button\b/.test(sel) ? c : null),
  };
  return c;
}
["do-key-restore", "do-team-new", "do-team-exports", "cover-close", "warn",
  "do-member-remove", "do-invite-cancel", "do-team-handover", "vr-discard-go"].forEach(watch);

P.S.plan = { dir: "p", next: 2, lint: { errors: 0, warnings: 1, rows: [] }, langs: ["en"] };
const pubWarn = painted(cover("publish"));
P.S.plan = { dir: "p", next: 2, lint: { errors: 1, warnings: 0, rows: [{ severity: "error", why: "Two cards carry one title." }] },
  langs: ["en"] };
const pubErr = painted(cover("publish"));
pressed.length = 0;
P.S.cover = "publish";
const w1 = key(words(pubWarn));
const w2 = nowhere("publish", pubWarn);
const w3 = nowhere("publish", pubErr);
check(pubWarn.act === "do-publish" && pubErr.act === "do-publish"
    && w1.act === "do-publish" && w1.prevented && w2.act === "do-publish" && w2.prevented && w3.act === "do-publish"
    && pressed.join() === "do-publish,do-publish,do-publish",
  "ce16a Enter with the focus on the publish cover's words, or on nothing, publishes, with the warnings and with an error: "
  + JSON.stringify([w1.act, w2.act, w3.act]) + " pressed " + pressed.join());

pressed.length = 0;
P.__set("prBusy", true);
const b1 = nowhere("publish", pubWarn);
P.__set("prBusy", false);
const b2 = nowhere("publish", pubWarn, { ctrlKey: true });
const b3 = nowhere("publish", pubWarn, { shiftKey: true });
const b4 = nowhere("publish", pubWarn, { defaultPrevented: true });
const b5 = nowhere(null, pubWarn);
check([b1, b2, b3, b4, b5].every((x) => x.act === "" && !x.prevented) && pressed.length === 0,
  "ce16b from nothing, Enter presses nothing while a publish is going, with Ctrl or Shift, when a handler before it took"
  + " the key, or with no cover up: " + JSON.stringify([b1, b2, b3, b4, b5].map((x) => x.act)) + " pressed " + pressed.join());

pressed.length = 0;
P.S.cover = "publish";
const c1 = key(control(pubWarn, "SPAN"));
const c2 = key(control(pubWarn, "BUTTON"));
check(c1.act === "" && !c1.prevented && c2.act === "" && !c2.prevented && pressed.length === 0,
  "ce16c a tick and a button inside the cover keep their own Enter: confirmKey presses nothing over them: "
  + JSON.stringify([c1.act, c2.act]) + " pressed " + pressed.join());

/* Every cover with a field, from nothing, presses its own solid button. The team's Seal and Start the new team
   have no field and are confirmations, pressed for themselves (ce21 holds the destructive no-field set). */
const withField = {
  lang: painted(covers.lang), tag: painted(covers.tag), intent: painted(covers.intent),
  card: painted(covers.card), key: painted(covers.key), keyRestore: painted(cover("key", { keyWant: "restore" })), publish: pubWarn,
};
const kindOf = { intent: "tag", keyRestore: "key" };
/* MOVED 2026-11-26 (findings 29 and 31): the team's covers that asked where a team meets, Seal and Start the new team over another lead's, are
   gone; the team made on its own is the one cover with a press and no field. */
const started = painted(cover("team", { teamWant: "new" }));
const went = {}, wrong = [];
for (const [name, box] of Object.entries(withField)) {
  pressed.length = 0;
  const r = nowhere(kindOf[name] || name, box);
  went[name] = r.act;
  if (!box.typed || !box.act || r.act !== box.act || pressed.join() !== box.act) wrong.push(name);
}
pressed.length = 0;
check(wrong.length === 0 && started.act === "do-team-new" && !started.typed,
  "ce17 from nothing, each cover with a field presses its own solid button, and the team's cover, which has none, has its own solid button and no field"
  + " (ce20 holds its Enter): " + JSON.stringify(went) + (wrong.length ? "; wrong " + wrong.join() : ""));

/* ---- AN IME'S ENTER (the test architect's E7) ---------------------------------------------------------------------
   The Enter that ends a composition belongs to the input method, in a language's code and anywhere else. */
pressed.length = 0;
P.S.cover = "lang";
const i1 = key(field("INPUT", "newLang", { closest: (sel) => (sel === "#dlg" ? withField.lang : null) }), { isComposing: true });
const i2 = nowhere("lang", withField.lang, { isComposing: true });
check(i1.act === "" && !i1.prevented && i2.act === "" && !i2.prevented && pressed.length === 0,
  "ce18 Enter while an input method is composing presses nothing, in the code and from nothing: "
  + JSON.stringify([i1.act, i2.act]) + " pressed " + pressed.join());

/* ---- ESCAPE (the test architect's E8) -----------------------------------------------------------------------------
   Escape in a dialog's field goes back: dispatched through every keydown listener the page put on the document, in
   capture order, it presses Cancel's act and nothing else. */
function dispatch(ev) {
  const errs = [];
  for (const capture of [true, false]) {
    for (const h of home.doc.heard) {
      if (h.type !== "keydown" || h.capture !== capture) continue;
      try { h.fn(ev); } catch (x) { errs.push(x && x.message ? x.message : String(x)); }
      if (ev.immediate) return errs;
    }
    if (ev.stopped) return errs;
  }
  return errs;
}
pressed.length = 0;
P.S.cover = "lang";
const escField = Object.assign(field("INPUT", "newLang", { closest: (sel) => (sel === "#dlg" ? withField.lang : null) }),
  { matches: () => false, value: "Typed" });
const esc = {
  key: "Escape", target: escField, altKey: false, metaKey: false, ctrlKey: false, shiftKey: false, isComposing: false,
  defaultPrevented: false, stopped: false, immediate: false,
  preventDefault() { this.defaultPrevented = true; }, stopPropagation() { this.stopped = true; },
  stopImmediatePropagation() { this.stopped = true; this.immediate = true; },
};
const escErrs = dispatch(esc);
check(pressed.join() === "cover-close" && escErrs.length === 0,
  "ce19 Escape in Add a language's code, through every keydown listener, presses only Cancel's act: " + pressed.join()
  + (escErrs.length ? "; threw " + escErrs.join(" | ") : ""));

/* ENTER ON A COVER WITH NO TEXT FIELD (Argon's first-day review, F11, and the test architect's E1 of 2026-11-01
   13:15). Argon's cover is Start a team on the Etiuda relay: a team made for the first time, with no field unless
   the trial is offered, and Enter starts it (ce20). Every other cover with no field is a confirmation, and an Enter
   still held from the last field must not press it: Remove, Cancel an opened invitation, Hand over, Move the team,
   Discard, and the team's Seal, Start the new team, automatic joining and a desk's export (ce21). Enter in Add a
   language's code still adds it (in New project's name until New catalog became a page, board 1019 (12)). */
const relayStart = painted(cover("team", { teamWant: "new" }));
pressed.length = 0;
const rs = nowhere("team", relayStart);

const rsPressed = pressed.join();
pressed.length = 0;
P.S.cover = "lang";
const named = key(field("INPUT", "newLang", { closest: (sel) => (sel === "#dlg" ? withField.lang : null) }));
const kept = named.act === "do-lang-new" && named.prevented && pressed.join() === "do-lang-new";
check(!relayStart.typed && relayStart.act === "do-team-new" && relayStart.enter && rs.act === "do-team-new" && rs.prevented
    && rsPressed === "do-team-new" && kept,
  "ce20 Enter on Start a team on the Etiuda relay, which has no field, starts it, and Enter in a text field still"
  + " presses: " + JSON.stringify({ act: relayStart.act, marked: relayStart.enter, pressed: rsPressed })
  + (kept ? "" : "; name " + named.act));

const roster = { team: { sealed: true, roster: [{ id: "d-1", name: "Reception" }] }, file: "ours", relay: true };
const confirmations = [
  ["remove", painted(cover("team", { teamWant: "remove", memberGoing: "d-1", desks: roster })), "do-member-remove"],
  ["cancel", painted(cover("team", { teamWant: "cancel", cancelId: "i-1", desks: roster })), "do-invite-cancel"],
  ["handover", painted(cover("team", { teamWant: "handover", desks: roster })), "do-team-handover"],
  ["discard", painted(cover("vr-discard")), "cover-close"],
  ["exports-plain", painted(cover("team", { teamWant: "exports-plain", desks: null })), "do-team-exports"],
];
const fired = [];
for (const [name, box, act] of confirmations) {
  pressed.length = 0;
  const r = nowhere(name === "discard" ? "vr-discard" : "team", box);
  if (box.typed || box.act !== act || box.enter || r.act !== "" || r.prevented || pressed.length) {
    fired.push(name + "=" + JSON.stringify({ act: box.act, typed: box.typed, marked: box.enter, pressed: r.act || pressed.join() }));
  }
}
check(fired.length === 0,
  "ce21 Enter on a confirmation with no field presses nothing: Remove, Cancel an opened invitation, Hand over, Discard,"
  + " and a desk's export (was also Seal, Start the new team and Unseal, which went with the Publishing switch, 2026-11-26): "
  + (fired.length ? fired.join(", ") : "the five, none pressed"));

/* RESET STUDIO? (the lead engineer's decision of 2026-11-14 on the test architect's read): the word typed, its Reset is
   enabled and solid, and still Enter in the field or from nothing presses nothing, as the desk's Reset Etiuda?. */
watch("do-reset-studio");
const resetBox = painted(cover("reset-studio", { resetWord: "RESET", resetBusy: false }));
pressed.length = 0;
P.S.cover = "reset-studio";
const rw = key(field("INPUT", "resetStudioWord", { closest: (sel) => (sel === "#dlg" ? resetBox : null) }));
const rn = nowhere("reset-studio", resetBox);
check(resetBox.act === "do-reset-studio" && resetBox.typed && rw.act === "" && !rw.prevented && rn.act === "" && !rn.prevented
    && pressed.length === 0,
  "ce22 Enter in Reset Studio?'s typed word, RESET typed, or from nothing, presses nothing: its solid "
  + JSON.stringify(resetBox.act) + ", field " + JSON.stringify(rw.act) + ", nothing " + JSON.stringify(rn.act)
  + " pressed " + pressed.join());
P.S.resetWord = "";

copyPlants({
  root: ROOT, self: SELF, label: "cover-enter", onlyVar: "COVER_ENTER_ONLY", check, skip,
  plants: [
    { mark: "f11-enter", leg: "ce21", rel: "ui/app.js", line: "" },
    { mark: "ton-cover", leg: "ce20", rel: "ui/app.js", line: '        + "</div>";' },
    { mark: "reset-word-enter", leg: "ce22", rel: "ui/app.js", line: "" },
  ],
});

check(asserted + skipped + 1 === EXPECTED,
  "ce15 every leg ran: " + (asserted + skipped + 1) + " of " + EXPECTED + (skipped ? ", " + skipped + " skipped" : ""));
process.stdout.write("cover-enter: " + asserted + " assertion(s), " + skipped + " skipped, " + failed + " failure(s)"
  + (PLANTS_OFF ? " (ETIUDA_PLANTS=off)" : "") + "\n");
process.stdout.write("#counts checks=" + asserted + " skipped=" + skipped + " failed=" + failed + " expected=" + EXPECTED + "\n");
process.exit(failed ? 1 : 0);
