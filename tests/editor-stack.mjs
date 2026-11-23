/* THE EDITORS' STACK STANDS WHERE THE DESK'S DOES, AND DOES WHAT THE DESK'S DOES (board 1018, piece F).
 *
 * gate-kind: node
 *
 *     node tests/editor-stack.mjs
 *
 * ui/editor-stack.js is placement and state with no DOM, ported from the desk's dialog.js (engine branch
 * engine-fold-126-2026-11-22, tip 6db35047 for the stack). The oracle is the desk's own rule set: tests/module-calls.mjs legs
 * 1018a to 1018g and the 983 legs that concern placement. Rules are ported, not DOM assertions: where the desk reads
 * offsetLeft and offsetTop off stub nodes, this reads x and y off layout(), and the numbers are the desk's own
 * (a 1280 by 800 window, a 560 card 500 high, a band of 36).
 *
 * WHICH LEGS WERE TAKEN, and from where
 *   ef1018a  1018a  place by width: 960, 1280 and 1920 with two and three editors
 *   ef1018b  1018b  the stack's heads, each a head higher and a step smaller; closing the front sets the rest side by side
 *   ef1018c  1018c  minimise: the other comes forward alone, typing kept; one minimised comes back at once from the button
 *   ef1018d  1018d  the background click minimises every editor; the count; amber only while a minimised one is unsaved
 *   ef1018e  1018e  the showcase: half size side by side, the last used ringed; digit, arrows, Enter, Esc, a press
 *   ef1018f  1018f  Esc held closes all and leaves the one Undo's records; a short Esc is not the stack's
 *   ef983w2  983w2 and 983w3  the next editor takes its place by the rule, from inside an editor and from the desk
 *   ef983w4  983w4  F6 walks the editors showing in the order opened, then the desk; from the desk it presses the button
 *   ef983w5  983w5  an entry already open comes forward untouched; another entry of an open kind takes that kind's window
 *   ef983b2  983b2 and 983b4  a narrow window stacks, the newest in front, heads above it, each a step smaller
 *   ef983b5  983b5  the front's room is a head shorter for each editor behind it
 *   ef983b6  983b6  crossing the room two need stacks and unstacks; the boundary is the desk's (row <= W - 16)
 *   ef983r1  983r1 and 983r2 and 983r3  the desk in front: every editor minimised, none takes room; the button brings one back
 *   ef983t1  983t1 and 983t4  closing every editor at once keeps the unsaved ones in the Undo's order; clean ones keep nothing
 *   ef983d   983a to 983g, 983k, 983n  no drag: no place is kept, nothing moves it, and layout reads state and window only
 * NOT TAKEN, because they assert the desk's DOM or other modules: 1018g (the sheet's CSS lines and the Polish words), 983b1 and
 * 983b3's node moves and Undo bubbles, 983b7 and 983b8 (modality and the X's click), 983r4 to 983r9 and 983z2 (focus, a dialog of
 * another kind opened over a resting editor, the keys of other modules), 983s* and 983w6 (what an entry shows after another
 * editor saved), 983k's scan of every openDialog site. Those belong to the page's host, piece G.
 *
 * PROVED BY MAKING IT FAIL: STACK_SRC=<a module> reads that module instead, and ef10 plants one fault per deciding line
 * in a copy held in memory (ETIUDA_PLANTS=off skips them); the line of each is in the report.
 *
 * Node only, no window, no DOM. Exit 0 when every check holds, 1 when any fails.
 */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const SRC = process.env.STACK_SRC ? path.resolve(process.env.STACK_SRC) : path.join(ROOT, "ui", "editor-stack.js");
const PLANTS_OFF = process.env.ETIUDA_PLANTS === "off";
const srcText = fs.readFileSync(SRC, "utf8");

function load(text) {
  const mod = { exports: {} };
  new Function("module", "window", text).call({}, mod, undefined);
  return mod.exports;
}

const EXPECTED = 83 + (PLANTS_OFF ? 0 : 1);
let asserted = 0, failed = 0;
function check(cond, line) {
  asserted++;
  if (cond) process.stdout.write("  ok   " + line + "\n");
  else { failed++; process.stdout.write("  FAIL " + line + "\n"); }
}
const J = (x) => JSON.stringify(x);

/* All the legs, over one module, so the plants can run the same legs over a planted copy and read which turned red. */
function legs(S, say) {
  const out = [];
  const leg = (id, cond) => out.push([id, !!cond]);
  /* The page measures the card: 560, or the window less the dialog's 16 px of padding a side where it is narrower (the desk's 983b legs). */
  const view = (W, H) => ({ W: W, H: H == null ? 800 : H, w: Math.min(560, W - 32), band: 36, heights: { card: 500, intent: 500, category: 500 } });
  const rig = (W, kinds, H) => {
    const st = S.create();
    kinds.forEach((k) => S.open(st, k, k + "1"));
    return { st, v: view(W, H), lay: () => S.layout(st, view(W, H)) };
  };
  const at = (lay) => lay.items.map((i) => i.kind + " " + i.x + " " + i.y).sort().join(", ");

  /* ef1018a: the desk's 1018a, number for number. */
  {
    const l = (W, kinds) => { const r = rig(W, kinds), a = r.lay(); return a.mode + ": " + at(a); };
    leg("ef1018a.1", l(960, ["card", "intent"]) === "stack: card 200 44, intent 200 78");
    leg("ef1018a.2", l(1280, ["card", "intent"]) === "row: card 68 150, intent 652 150");
    leg("ef1018a.3", l(1280, ["card", "intent", "category"]) === "stack: card 360 44, category 360 112, intent 360 78");
    leg("ef1018a.4", l(1920, ["card", "intent", "category"]) === "row: card 96 150, category 1264 150, intent 680 150");
    leg("ef1018a.5", [S.CARD_W, S.EDGE, S.GAP, S.HEAD, S.SHOW_S, S.SHOW_GAP, S.BAND].join() === "560,8,24,34,0.5,28,36");
  }
  /* ef1018b */
  {
    const r = rig(1280, ["card", "intent", "category"]);
    const a = r.lay();
    const heads = a.items.filter((i) => i.back).map((i) => [i.kind, i.y, i.scale, i.z].join(" ")).sort().join(", ");
    const front = a.items.filter((i) => !i.back)[0];
    leg("ef1018b.1", heads === "card 44 0.94 1, intent 78 0.97 2");
    leg("ef1018b.2", front.kind === "category" && front.x + "," + front.y === "360,112" && front.room === 680 && front.scale === 1);
    S.close(r.st);
    const b = r.lay();
    leg("ef1018b.3", b.mode === "row" && r.st.active.kind === "intent" && at(b) === "card 68 150, intent 652 150" && b.items.every((i) => !i.back && i.scale === 1));
  }
  /* ef1018c */
  {
    const r = rig(1280, ["card", "intent"]);
    S.setDirty(r.st, "intent", true);
    leg("ef1018c.1", S.open(r.st, "about", "x") === false && r.st.wins.length === 2);
    const rec = r.st.active;
    S.minimise(r.st);
    const m = S.marks(r.st);
    leg("ef1018c.2", r.st.active.kind === "card" && rec.min === true && r.st.wins.indexOf(rec) >= 0 && rec.dirty === true);
    leg("ef1018c.3", m.visible && m.count === 1 && m.one && m.unsaved && m.above);
    leg("ef1018c.4", r.lay().mode === "alone" && r.lay().items.length === 0);
    leg("ef1018c.5", S.fabPress(r.st) === true && r.st.active.kind === "intent" && !rec.min && !S.marks(r.st).visible && r.st.show === false);
    leg("ef1018c.6", r.lay().mode === "row" && at(r.lay()) === "card 68 150, intent 652 150");
    /* One alone has nowhere to go: minimise sends it to the desk. */
    const one = rig(1280, ["card"]);
    leg("ef1018c.7", S.minimise(one.st) === true && one.st.rest === true && one.st.wins[0].min === true && S.marks(one.st).count === 1);
  }
  /* ef1018d */
  {
    const r = rig(1280, ["card", "intent", "category"]);
    const none = S.marks(r.st);
    leg("ef1018d.1", !none.visible && none.count === 0 && !none.above);
    leg("ef1018d.2", S.toDesk(r.st) === true && r.st.rest && r.st.wins.every((w) => w.min));
    const m = S.marks(r.st);
    leg("ef1018d.3", m.visible && m.count === 3 && !m.unsaved && !m.above && !m.one);
    const d = rig(1280, ["card", "intent"]);
    S.setDirty(d.st, "intent", true);
    leg("ef1018d.4", S.marks(d.st).dots.join() === "intent" && !S.marks(d.st).visible);
    S.minimise(d.st);
    const one = S.marks(d.st);
    leg("ef1018d.5", one.count === 1 && one.unsaved && one.above);
    S.toDesk(d.st);
    const two = S.marks(d.st);
    leg("ef1018d.6", two.count === 2 && two.unsaved && !two.above);
    /* Clean ones are never amber. */
    const c = rig(1280, ["card", "intent"]);
    S.minimise(c.st);
    leg("ef1018d.7", S.marks(c.st).unsaved === false);
    /* Amber is for a minimised editor's unsaved work only: one still showing does not turn it. */
    S.setDirty(c.st, "card", true);
    leg("ef1018d.9", c.st.active.kind === "card" && S.marks(c.st).count === 1 && S.marks(c.st).unsaved === false);
    /* The click with the desk already in front, or the showcase up, does nothing more. */
    leg("ef1018d.8", S.toDesk(r.st) === false);
  }
  /* ef1018e */
  {
    const r = rig(1280, ["card", "intent", "category"]);
    S.toDesk(r.st);
    leg("ef1018e.1", S.fabPress(r.st) === true && r.st.show === true);
    const th = () => S.layout(r.st, view(1280)).items.map((i) => [i.kind, i.x, i.y, i.scale, i.pick ? "ring" : ""].join(" ")).sort().join(", ");
    leg("ef1018e.2", S.layout(r.st, view(1280)).mode === "show" && th() === "card 192 275 0.5 , category 808 275 0.5 ring, intent 500 275 0.5 ");
    leg("ef1018e.3", S.keys(r.st, { key: "ArrowRight" }).act === "move" && th() === "card 192 275 0.5 ring, category 808 275 0.5 , intent 500 275 0.5 ");
    leg("ef1018e.4", S.keys(r.st, { key: "ArrowLeft" }).act === "move" && S.keys(r.st, { key: "ArrowLeft" }).act === "move" && r.st.showAt === 1);
    const esc = S.keys(r.st, { key: "Escape", repeat: false });
    leg("ef1018e.5", esc.taken && esc.act === "leave" && !r.st.show && r.st.rest && S.marks(r.st).count === 3);
    /* A press on one brings back that one alone. */
    S.fabPress(r.st);
    leg("ef1018e.6", S.pick(r.st, "intent") && !r.st.show && r.st.active.kind === "intent" && S.marks(r.st).count === 2 && S.showing(r.st).length === 1);
    /* A digit picks; the others stay minimised and nothing is closed. */
    S.fabPress(r.st);
    const dg = S.keys(r.st, { key: "1" });
    leg("ef1018e.7", dg.act === "pick" && dg.kind === "card" && r.st.active.kind === "card" && !r.st.show && S.marks(r.st).count === 1 && r.st.wins.length === 3);
    /* Enter and Space pick the ringed one; a digit past the count and Tab are taken and do nothing. */
    const q = rig(1280, ["card", "intent", "category"]);
    S.toDesk(q.st); S.fabPress(q.st);
    leg("ef1018e.8", S.keys(q.st, { key: "9" }).act === "" && S.keys(q.st, { key: "Tab" }).taken === true && q.st.show);
    const en = S.keys(q.st, { key: "Enter" });
    leg("ef1018e.9", en.act === "pick" && en.kind === "category" && q.st.active.kind === "category" && !q.st.show);
    /* The keys are not the stack's with no showcase up. */
    leg("ef1018e.10", S.keys(q.st, { key: "ArrowRight" }).taken === false && S.keys(q.st, { key: "Enter" }).taken === false);
    /* The thumbnails shrink to fit a window too narrow for half size, never below the edge. */
    const n = rig(900, ["card", "intent", "category"]);
    S.toDesk(n.st); S.fabPress(n.st);
    const nl = S.layout(n.st, view(900)).items;
    leg("ef1018e.11", Math.abs(nl[0].scale - (900 - 16 - 56) / 1680) < 1e-9 && nl[0].x === 8 && nl[2].x + 560 * nl[2].scale <= 892.5);
    /* Two minimised: the first top is at least band + 8 in a short window. */
    const sh = rig(1280, ["card", "intent"], 300);
    S.toDesk(sh.st); S.fabPress(sh.st);
    leg("ef1018e.12", S.layout(sh.st, view(1280, 300)).items.every((i) => i.y === 44));
    /* Editors showing stand off (hidden) while the showcase is up. */
    const off = rig(1280, ["card", "intent", "category"]);
    S.minimise(off.st); S.minimise(off.st);
    S.fabPress(off.st);
    const oi = S.layout(off.st, view(1280)).items;
    leg("ef1018e.13", oi.filter((i) => i.off).map((i) => i.kind).join() === "card" && oi.filter((i) => !i.off).length === 2);
  }
  /* ef1018f */
  {
    const r = rig(1280, ["card", "intent", "category"]);
    S.setDirty(r.st, "card", true);
    S.minimise(r.st);
    const short = S.keys(r.st, { key: "Escape", repeat: false });
    leg("ef1018f.1", short.taken === false && short.act === "");
    S.close(r.st);
    leg("ef1018f.2", r.st.active.kind === "card" && r.st.wins.length === 2 && S.marks(r.st).count === 1);
    const held = S.keys(r.st, { key: "Escape", repeat: true });
    leg("ef1018f.3", held.taken === true && held.act === "close-all");
    const kept = S.closeAll(r.st);
    leg("ef1018f.4", J(kept.map((k) => k.kind)) === '["card"]' && r.st.wins.length === 0 && r.st.active === null && !S.marks(r.st).visible);
    leg("ef1018f.5", S.keys(r.st, { key: "Escape", repeat: true }).taken === false);
    /* Esc held works with the desk in front and in the showcase. */
    const d = rig(1280, ["card", "intent"]);
    S.toDesk(d.st);
    leg("ef1018f.6", S.keys(d.st, { key: "Escape", repeat: true }).act === "close-all");
    S.fabPress(d.st);
    leg("ef1018f.7", S.keys(d.st, { key: "Escape", repeat: true }).act === "close-all" && d.st.show);
  }
  /* ef983w2 */
  {
    const r = rig(1280, ["card"]);
    leg("ef983w2.1", r.lay().mode === "alone");
    S.open(r.st, "category", "k1");
    const a = r.lay();
    leg("ef983w2.2", a.mode === "row" && at(a) === "card 68 150, category 652 150" && a.items.every((i) => i.y === 150));
    const x = a.items.map((i) => i.x);
    leg("ef983w2.3", x[1] - x[0] - S.CARD_W === 24 && x[0] === Math.round((1280 - (2 * 560 + 24)) / 2));
    const n = rig(900, ["card"]);
    S.open(n.st, "intent", "i1");
    leg("ef983w2.4", n.lay().mode === "stack" && n.st.active.kind === "intent");
  }
  /* ef983w4 */
  {
    const r = rig(1280, ["card", "intent", "category"]);
    S.bringForward(r.st, "card");
    leg("ef983w4.1", r.st.active.kind === "card" && r.st.hist[r.st.hist.length - 1].kind === "card");
    const order = [];
    for (let i = 0; i < 3; i++) { S.f6(r.st); order.push(r.st.rest ? "desk" : r.st.active.kind); }
    leg("ef983w4.2", order.join() === "intent,category,desk");
    leg("ef983w4.3", r.st.wins.every((w) => w.min) && r.lay().mode === "alone");
    leg("ef983w4.4", S.f6(r.st) === true && r.st.show === true);
    S.keys(r.st, { key: "Escape", repeat: false });
    const one = rig(1280, ["card", "intent"]);
    S.minimise(one.st);
    S.toDesk(one.st);
    leg("ef983w4.5", S.f6(one.st) === true && one.st.show === true && one.st.rest === true);
    /* Closing the last showing editor leaves the desk in front. */
    const c = rig(1280, ["card", "intent"]);
    S.minimise(c.st);
    S.close(c.st);
    leg("ef983w4.6", c.st.rest === true && c.st.active.kind === "intent" && c.st.active.min === true);
    leg("ef983w4.7", S.f6(S.create()) === false);
  }
  /* ef983w5 */
  {
    const r = rig(1280, ["card", "intent"]);
    S.minimise(r.st);
    const seqBefore = r.st.wins.map((w) => w.seq).join();
    leg("ef983w5.1", S.alreadyOpen(r.st, "intent", "intent1") && !S.alreadyOpen(r.st, "intent", "i2") && !S.alreadyOpen(r.st, "category", "x"));
    S.open(r.st, "intent", "intent1");
    leg("ef983w5.2", r.st.active.kind === "intent" && r.st.wins.length === 2 && r.st.wins.map((w) => w.seq).join() === seqBefore);
    S.open(r.st, "card", "card1");
    leg("ef983w5.3", r.st.active.kind === "card" && r.st.wins.every((w) => !w.min));
    S.setDirty(r.st, "intent", true);
    S.open(r.st, "intent", "other");
    const w = r.st.wins.filter((x) => x.kind === "intent")[0];
    leg("ef983w5.4", r.st.wins.length === 2 && w.id === "other" && w.seq === 2 && r.st.active === w && w.dirty === false);
    /* From the desk, an open entry comes forward and the desk steps back. */
    const d = rig(1280, ["card", "intent"]);
    S.toDesk(d.st);
    S.open(d.st, "card", "card1");
    leg("ef983w5.5", !d.st.rest && d.st.active.kind === "card" && !d.st.active.min && S.marks(d.st).count === 1);
  }
  /* ef983b2: a narrow window. */
  {
    const r = rig(546, ["card", "intent"], 900);
    const a = r.lay();
    const f = a.items.filter((i) => !i.back)[0];
    leg("ef983b2.1", a.mode === "stack" && f.kind === "intent" && f.x + "," + f.y === "16,78" && at(a) === "card 16 44, intent 16 78");
    const t = rig(546, ["card", "intent", "category"], 900);
    const b = t.lay().items.filter((i) => i.back).map((i) => [i.kind, i.y, i.scale, i.z].join(" ")).sort().join(" + ");
    leg("ef983b2.2", b === "card 44 0.94 1 + intent 78 0.97 2" && t.lay().items.filter((i) => !i.back)[0].x + "," + t.lay().items.filter((i) => !i.back)[0].y === "16,112");
    S.bringForward(t.st, "card");
    const c = t.lay();
    const cb = c.items.filter((i) => i.back).map((i) => [i.kind, i.y, i.scale, i.z].join(" ")).sort().join(" + ");
    leg("ef983b2.3", c.items.filter((i) => !i.back)[0].kind === "card" && cb === "category 78 0.97 2 + intent 44 0.94 1");
  }
  /* ef983b5 */
  {
    const r = rig(546, ["card", "intent"], 900);
    const one = r.lay().items.filter((i) => !i.back)[0].room;
    S.open(r.st, "category", "k1");
    const two = r.lay().items.filter((i) => !i.back)[0].room;
    leg("ef983b5.1", one === 814 && two === 780);
    const h = r.lay().items.filter((i) => i.back).map((i) => i.room).sort((a, b) => a - b);
    leg("ef983b5.2", h.join() === "534,568");
  }
  /* ef983b6 */
  {
    const r = rig(1280, ["card", "category"]);
    const side = (W) => { const a = S.layout(r.st, view(W)); return a.mode + " / " + r.st.active.kind + " / " + at(a); };
    const wide = side(1280), narrow = side(1000), again = side(1280);
    leg("ef983b6.1", wide === "row / category / card 68 150, category 652 150" && narrow === "stack / category / card 220 44, category 220 78" && again === wide);
    leg("ef983b6.2", S.layout(r.st, view(1144 + 16)).mode === "row" && S.layout(r.st, view(1144 + 15)).mode === "stack");
    const t = rig(1920, ["card", "intent", "category"]);
    leg("ef983b6.3", S.layout(t.st, view(1728 + 16)).mode === "row" && S.layout(t.st, view(1728 + 15)).mode === "stack");
  }
  /* ef983r1: the desk in front. */
  {
    const r = rig(546, ["card"], 900);
    S.toDesk(r.st);
    leg("ef983r1.1", r.st.rest && r.st.active.min && S.marks(r.st).visible && S.marks(r.st).count === 1);
    leg("ef983r1.2", r.lay().mode === "alone" && r.lay().items.length === 0);
    const t = rig(1280, ["card", "intent"]);
    S.toDesk(t.st);
    leg("ef983r1.3", t.lay().mode === "alone");
    S.fabPress(t.st);
    S.pick(t.st, "card");
    leg("ef983r1.4", !t.st.rest && !t.st.show && t.st.active.kind === "card" && t.lay().mode === "alone" && S.showing(t.st).length === 1);
    S.bringUp(t.st, "intent");
    leg("ef983r1.5", t.lay().mode === "row" && S.marks(t.st).count === 0);
    const held = rig(1280, ["card", "intent"]);
    held.st.rest = true;
    leg("ef983r1.7", held.lay().mode === "alone");
    leg("ef983r1.6", S.toDesk(S.create()) === false && S.fabPress(S.create()) === false);
  }
  /* ef983t1 */
  {
    const r = rig(1280, ["card", "intent", "category"]);
    S.setDirty(r.st, "card", true); S.setDirty(r.st, "category", true);
    const kept = S.closeAll(r.st);
    leg("ef983t1.1", J(kept.map((k) => [k.kind, k.front])) === '[["category",true],["card",false]]');
    const c = rig(1280, ["card", "intent"]);
    leg("ef983t1.2", S.closeAll(c.st).length === 0 && c.st.wins.length === 0);
  }
  /* ef983d: no drag, nothing kept. */
  {
    const r = rig(1280, ["card", "intent"]);
    const before = J(r.st), a = J(r.lay()), b = J(r.lay());
    leg("ef983d.1", a === b && J(r.st) === before);
    const names = Object.keys(S).join(" ");
    leg("ef983d.2", !/drag|place|store|save|remember|glide/i.test(names.replace(/\blayout\b/, "")) && !("x" in r.st.wins[0]) && !("y" in r.st.wins[0]));
    const one = [546, 900, 1280, 1920].map((W) => S.layout(rig(W, ["card"]).st, view(W)).mode);
    leg("ef983d.3", one.every((m) => m === "alone"));
    /* The same window and the same state give the same places however the editors were opened. */
    const x = rig(1280, ["card", "intent"]), y = rig(1280, ["intent"]);
    S.open(y.st, "card", "card1");
    S.bringForward(y.st, "intent");
    leg("ef983d.4", at(x.lay()) === "card 68 150, intent 652 150" && y.lay().mode === "row");
  }
  return out;
}

const base = legs(load(srcText), true);
base.forEach(([id, ok]) => check(ok, id));
check(new Set(base.map((b) => b[0])).size === base.length, "ef10x every leg id is its own");

/* ef10 PLANTS: one deciding line each, changed in a copy held in memory, every leg run on it; the legs that turn red are named. A
   plant that turns nothing red, or an occurrence that is not found exactly once, fails here. */
if (!PLANTS_OFF) {
  const PLANTS = [
    ["gap", "GAP = 24", "GAP = 12"],
    ["head", "HEAD = 34", "HEAD = 30"],
    ["card-w", "CARD_W = 560", "CARD_W = 500"],
    ["edge", "EDGE = 8,", "EDGE = 4,"],
    ["band", "BAND = 36,", "BAND = 30,"],
    ["show-s", "SHOW_S = 0.5", "SHOW_S = 0.4"],
    ["show-gap", "SHOW_GAP = 28", "SHOW_GAP = 20"],
    ["back-step", "BACK_STEP = 0.03", "BACK_STEP = 0.02"],
    ["row-fits", "if (row <= W - 2 * EDGE)", "if (row < W - 2 * EDGE)"],
    ["row-centre", "x0 = Math.round((W - row) / 2);\n      return {\n        mode: \"row\"", "x0 = 0;\n      return {\n        mode: \"row\""],
    ["row-top", "const top = Math.max(floor, Math.round((H - tall) / 2)), x0", "const top = floor, x0"],
    ["stack-order", "st.hist.filter((r) => !r.min && r !== st.active).reverse()", "st.hist.filter((r) => !r.min && r !== st.active)"],
    ["stack-room", "room: fh + (i + 1) * HEAD", "room: fh"],
    ["one-alone", "if (st.rest || up.length < 2)", "if (st.rest || up.length < 1)"],
    ["rest-alone", "if (st.rest || up.length < 2)", "if (up.length < 2)"],
    ["show-scale", "const s = Math.min(SHOW_S, (W - 2 * EDGE - (n - 1) * SHOW_GAP) / Math.max(1, n * w));", "const s = SHOW_S;"],
    ["show-ring", "st.showAt = Math.max(0, list.indexOf(last(st.hist.filter((r) => r.min))));", "st.showAt = 0;"],
    ["show-arrows", "(st.showAt + (e.key === \"ArrowRight\" ? 1 : list.length - 1)) % list.length", "(st.showAt + 1) % list.length"],
    ["show-off", "return i < 0 ? { kind: r.kind, off: true }", "return i < 0 ? { kind: r.kind, off: false, x: 0, y: 0 }"],
    ["fab-one", "if (list.length === 1) return bringUp(st, list[0].kind);", "if (list.length === 1) return openShow(st);"],
    ["fab-amber", "const unsaved = list.some((r) => r.dirty);", "const unsaved = st.wins.some((r) => r.dirty);"],
    ["fab-above", "above: list.length > 0 && !st.rest && !st.show,", "above: list.length > 0,"],
    ["min-next", "if (!next) return toDesk(st);", "if (!next) return false;"],
    ["min-next-recent", "const next = last(st.hist.filter((r) => r !== st.active && !r.min));", "const next = st.hist.filter((r) => r !== st.active && !r.min)[0];"],
    ["esc-held", "if (e.key === \"Escape\" && e.repeat) return { taken: true, act: \"close-all\" };", "if (e.key === \"Escape\" && e.repeat && st.show) return { taken: true, act: \"close-all\" };"],
    ["esc-short", "if (e.key === \"Escape\") { endShow(st); return { taken: true, act: \"leave\" }; }", "if (e.key === \"Escape\") { return { taken: true, act: \"leave\" }; }"],
    ["f6-order", "const list = showing(st), i = list.indexOf(st.active);", "const list = st.hist.filter((r) => !r.min), i = list.indexOf(st.active);"],
    ["f6-desk", "if (st.rest) return fabPress(st);", "if (st.rest) return false;"],
    ["close-next", "const next = last(st.hist.filter((r) => !r.min)) || last(st.hist) || last(st.wins);", "const next = last(st.wins);"],
    ["close-desk", "if (next.min && !st.rest) st.rest = true;", ""],
    ["open-kind", "const w = byKind(st, kind);\n    if (st.show) endShow(st);", "const w = null;\n    if (st.show) endShow(st);"],
    ["open-seq", "if (w.id !== id) { w.id = id; w.dirty = false; }", "if (w.id !== id) { w.id = id; w.dirty = false; w.seq = ++st.seq; }"],
    ["open-kinds", "if (KINDS.indexOf(kind) < 0) return false;", ""],
    ["undo-order", "((a === st.active ? 0 : 1) - (b === st.active ? 0 : 1)) || (a.seq - b.seq)", "(a.seq - b.seq)"],
    ["undo-clean", "st.wins.filter((r) => r.dirty)\n      .sort", "st.wins\n      .sort"],
  ];
  const turned = {};
  for (const [tag, from, to] of PLANTS) {
    if (srcText.split(from).length !== 2) { turned[tag] = "marker:" + (srcText.split(from).length - 1); continue; }
    let red;
    try { red = legs(load(srcText.replace(from, () => to)), false).filter((l) => !l[1]).map((l) => l[0].split(".")[0]); }
    catch (e) { red = ["threw"]; }
    turned[tag] = red.length ? "red " + Array.from(new Set(red)).join("+") : "held";
  }
  const bad = Object.keys(turned).filter((k) => turned[k].indexOf("red") !== 0);
  check(bad.length === 0, "ef10 each deciding line planted turns a leg red: " + (bad.length ? "NOT RED " + J(bad.map((k) => k + "=" + turned[k])) : Object.keys(turned).length + " planted"));
  if (process.env.EDITOR_STACK_PLANTS === "list") Object.keys(turned).forEach((k) => process.stdout.write("       plant " + k + ": " + turned[k] + "\n"));
}

check(asserted + 1 === EXPECTED, "ef10e every leg ran: " + (asserted + 1) + " of " + EXPECTED + " assertion(s)");
process.stdout.write("editor-stack: " + asserted + " assertion(s), " + failed + " failure(s)\n");
process.exit(failed ? 1 : 0);
