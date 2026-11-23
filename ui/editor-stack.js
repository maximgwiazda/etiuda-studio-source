"use strict";
/* WHERE THE OPEN EDITORS STAND, AND WHAT THE STACK DOES, AS ARITHMETIC AND RECORDS (board 1018, piece F).
 *
 * Max's rule of 21 November, as the board's row records it: no dragging; each open editor takes its own place, side by side
 * while there is room and a stack when there is not; one action button with a count, which shows the minimised editors side by
 * side, shrunk, to pick one. This file is placement and state only. It has no DOM, reads no window and binds no look: how an
 * editor is drawn and how it saves wait on Max's choice among the designer's directions.
 *
 * PORTED from the desk, the engine's src/modules/dialog.js on branch engine-fold-126-2026-11-22 (the editors stack's own tip
 * is 6db35047; the file is the same at both), with the same numbers:
 *   constants          dialog.js 491 to 493: ED_EDGE 8, ED_GAP 24, ED_HEAD 34, ED_SHOW_S 0.5, ED_SHOW_GAP 28; the card is 560 wide
 *                      (src/template.html 3002, .modal-card max-width) and the band 36 (the desk measures it; tests/module-calls.mjs
 *                      7939 gives 36), so the first top is band + 8 = 44
 *   layout()           edPlaceSync 531 to 556 (one alone, a row, a stack) and edShowLay 676 to 698 (the showcase)
 *   open and close     edAfterOpen 766 to 781, edAlreadyOpen 1090 to 1101, closeModal 447 to 460
 *   minimise and rest  edMinimise 612, edToDesk 603, edToFront 622, edBringUp 633, edRestEnd 576, edRestStart 586
 *   button and marks   edFabPress 637, edMarks 646 to 667 (the count, amber while a minimised one is unsaved, one comes straight back)
 *   showcase and keys  edShowOpen 670, edShowEnd 700, edShowPick 714, edKeys 720 to 743
 *   focus order        edF6 1065 to 1075, edDirtyWins 1119 to 1128 (what Esc held keeps for the one Undo)
 * What is left to the page, as on the desk: measuring the card and its band, moving nodes between the front and the shells so that
 * typing survives, the classes and the focus, and the dialog of another kind opened over editors (the desk's edHold, which holds
 * them whole). Nothing here keeps a place: no editor is dragged, so nothing is stored.
 *
 * WHERE IT WILL BE CALLED: the page's editor host, when the editors' piece (board 1018, piece G) replaces the single cover for
 * the card, intent and category editors. It asks layout() after every open, close, minimise, restore, key and resize, and draws
 * what comes back. Nothing calls it yet, and ui/app.js and ui/index.html do not load it.
 *
 * THE STATE is one plain object from create(): wins (one record per kind, {kind, id, seq, min, dirty}), hist (most recently in
 * front last), active (the record in hand), rest (the desk in front, every editor minimised), show (the showcase is up), showAt
 * (the ringed thumbnail) and seq. A function that acts changes the state and returns true where it acted, as the desk's do.
 */
(function (root) {
  const KINDS = Object.freeze(["card", "intent", "category"]);
  const CARD_W = 560, BAND = 36, EDGE = 8, GAP = 24, HEAD = 34, SHOW_S = 0.5, SHOW_GAP = 28, BACK_STEP = 0.03;

  function create() {
    return { wins: [], hist: [], active: null, rest: false, show: false, showAt: 0, seq: 0 };
  }
  const byKind = (st, kind) => st.wins.filter((r) => r.kind === kind)[0] || null;
  const showing = (st) => st.wins.filter((r) => !r.min).sort((a, b) => a.seq - b.seq);
  const minimised = (st) => st.wins.filter((r) => r.min).sort((a, b) => a.seq - b.seq);
  const toFrontOfHist = (st, rec) => { st.hist = st.hist.filter((r) => r !== rec); st.hist.push(rec); };
  const last = (list) => list[list.length - 1];

  /* ---- Placement. view is {W, H, w (the card's width, 560), band (36), heights: {kind: its height}}. The answer is
     {mode, items}: mode "alone" (nothing placed: one editor, or the desk in front, stands where every dialog stands, centred),
     "row", "stack" or "show"; each item {kind, x, y, room (the height it may fill from y), scale, back, z, pick, off}. */
  function layout(st, view) {
    const W = view.W, H = view.H, w = view.w == null ? CARD_W : view.w, band = view.band == null ? BAND : view.band;
    const heights = view.heights || {}, h = (r) => Number(heights[r.kind]) || 0;
    const floor = band + EDGE, foot = H - EDGE;
    if (st.show) {
      const list = minimised(st), n = list.length;
      const s = Math.min(SHOW_S, (W - 2 * EDGE - (n - 1) * SHOW_GAP) / Math.max(1, n * w));
      const row = n * w * s + (n - 1) * SHOW_GAP, x0 = Math.round((W - row) / 2);
      const tall = Math.max.apply(null, [0].concat(list.map(h)));
      const top = Math.max(floor, Math.round((H - tall * s) / 2)), room = (foot - top) / s;
      return {
        mode: "show",
        items: st.wins.slice().sort((a, b) => a.seq - b.seq).map((r) => {
          const i = list.indexOf(r);
          return i < 0 ? { kind: r.kind, off: true }
            : { kind: r.kind, x: Math.round(x0 + i * (w * s + SHOW_GAP)), y: top, room, scale: s, pick: i === st.showAt, off: false };
        }),
      };
    }
    const up = showing(st);
    if (st.rest || up.length < 2) return { mode: "alone", items: [] };
    const row = up.length * w + (up.length - 1) * GAP;
    if (row <= W - 2 * EDGE) {
      /* Each measured uncapped but for the window's room, so a stack's cap never sets the row's top. */
      const tall = Math.max.apply(null, up.map((r) => Math.min(h(r), Math.max(0, foot - floor))));
      const top = Math.max(floor, Math.round((H - tall) / 2)), x0 = Math.round((W - row) / 2);
      return {
        mode: "row",
        items: up.map((r, i) => ({ kind: r.kind, x: x0 + i * (w + GAP), y: top, room: foot - top, scale: 1, back: false })),
      };
    }
    const behind = st.hist.filter((r) => !r.min && r !== st.active).reverse();
    const top = floor + behind.length * HEAD, left = Math.round((W - w) / 2);
    const front = st.active && !st.active.min ? st.active : last(up);
    const fh = h(front);
    const items = [{ kind: front.kind, x: left, y: top, room: foot - top, scale: 1, back: false }];
    behind.forEach((r, i) => items.push({
      kind: r.kind, x: left, y: top - (i + 1) * HEAD, room: fh + (i + 1) * HEAD,
      scale: Math.round((1 - BACK_STEP * (i + 1)) * 100) / 100, back: true, z: behind.length - i,
    }));
    return { mode: "stack", items };
  }

  /* ---- Opening. An editor opens once per kind: the kind's window takes another entry in its place (its seq kept); asked for the
     entry it already shows, that window comes forward untouched, minimised or not. A new kind takes the next seq and the front,
     the desk's rest ending. True where a window was made or brought forward. */
  function open(st, kind, id) {
    if (KINDS.indexOf(kind) < 0) return false;
    const w = byKind(st, kind);
    if (st.show) endShow(st);
    if (w) {
      if (w.id !== id) { w.id = id; w.dirty = false; }
      if (w !== st.active) { activate(st, w); return true; }
      w.min = false;
      endRest(st);
      toFrontOfHist(st, w);
      return true;
    }
    const rec = { kind, id, seq: ++st.seq, min: false, dirty: false };
    st.wins.push(rec);
    st.active = rec;
    toFrontOfHist(st, rec);
    endRest(st);
    return true;
  }
  function alreadyOpen(st, kind, id) {
    const w = byKind(st, kind);
    return !!w && w.id === id;
  }
  /* The editor in hand closes. The most recent still showing comes forward; where every other is minimised, the desk does. */
  function close(st) {
    const gone = st.active;
    if (!gone) return false;
    st.wins = st.wins.filter((r) => r !== gone);
    st.hist = st.hist.filter((r) => r !== gone);
    if (!st.wins.length) { st.active = null; st.rest = false; st.show = false; st.showAt = 0; return true; }
    const next = last(st.hist.filter((r) => !r.min)) || last(st.hist) || last(st.wins);
    st.active = next;
    toFrontOfHist(st, next);
    if (next.min && !st.rest) st.rest = true;
    if (st.show && minimised(st).length < 2) st.show = false;
    return true;
  }
  /* Every editor closes at once (Esc held, the tour). The records that held unsaved work come back in the order the desk
     keeps them for its one Undo: the one in hand first, then by seq. */
  function closeAll(st) {
    const kept = st.wins.filter((r) => r.dirty)
      .sort((a, b) => ((a === st.active ? 0 : 1) - (b === st.active ? 0 : 1)) || (a.seq - b.seq))
      .map((r) => ({ kind: r.kind, id: r.id, seq: r.seq, front: r === st.active }));
    st.wins = []; st.hist = []; st.active = null; st.rest = false; st.show = false; st.showAt = 0;
    return kept;
  }
  function setDirty(st, kind, dirty) {
    const w = byKind(st, kind);
    if (!w) return false;
    w.dirty = !!dirty;
    return true;
  }

  /* ---- Standing aside. */
  function endRest(st) {
    if (!st.rest) return false;
    st.rest = false;
    if (st.active) st.active.min = false;
    return true;
  }
  function activate(st, rec) {
    if (!rec || rec === st.active || st.wins.indexOf(rec) < 0) return false;
    rec.min = false;
    st.active = rec;
    toFrontOfHist(st, rec);
    endRest(st);
    return true;
  }
  /* A press on an editor standing aside brings it forward. */
  function bringForward(st, kind) { return activate(st, byKind(st, kind)); }
  /* Every editor to the button, the desk in front (also the click on the background). */
  function toDesk(st) {
    if (st.rest || st.show || !st.wins.length) return false;
    st.wins.forEach((r) => { r.min = true; });
    st.rest = true;
    return true;
  }
  /* The editor in hand to the button; the most recent still showing comes forward, else the desk does. */
  function minimise(st) {
    if (!st.active || st.rest || st.show) return false;
    const next = last(st.hist.filter((r) => r !== st.active && !r.min));
    if (!next) return toDesk(st);
    st.active.min = true;
    activate(st, next);
    return true;
  }
  function toFront(st) { return st.rest ? endRest(st) : false; }
  /* One minimised editor shown again, the others left where they are. */
  function bringUp(st, kind) {
    const rec = byKind(st, kind);
    if (!rec) return false;
    rec.min = false;
    if (rec !== st.active) { activate(st, rec); return true; }
    if (st.rest) return toFront(st);
    return true;
  }

  /* ---- The one action button. */
  function fabPress(st) {
    if (st.show || !st.wins.length) return false;
    const list = minimised(st);
    if (!list.length) return false;
    if (list.length === 1) return bringUp(st, list[0].kind);
    return openShow(st);
  }
  /* What the button says: how many wait, whether the one that waits alone, and amber while a minimised one is unsaved. */
  function marks(st) {
    const list = minimised(st);
    const unsaved = list.some((r) => r.dirty);
    return {
      visible: list.length > 0, count: list.length, one: list.length === 1, unsaved,
      /* The desk lifts the button above the dim while editors show. */
      above: list.length > 0 && !st.rest && !st.show,
      dots: st.wins.filter((r) => r.dirty).map((r) => r.kind),
    };
  }

  /* ---- The showcase: every minimised editor side by side, the last used ringed. */
  function openShow(st) {
    const list = minimised(st);
    if (list.length < 2) return false;
    st.showAt = Math.max(0, list.indexOf(last(st.hist.filter((r) => r.min))));
    st.show = true;
    return true;
  }
  function endShow(st) {
    if (!st.show) return false;
    st.show = false;
    return true;
  }
  function pick(st, kind) {
    endShow(st);
    return bringUp(st, kind);
  }
  /* The keys the stack takes, the desk's edKeys. {key, repeat}: the answer is {taken, act}, act one of "close-all" (Esc held,
     wherever the editors are), "leave" (a short Esc in the showcase), "pick" (with kind), "move" (the ring) or "" (taken and
     nothing more). A short Esc with no showcase is not the stack's: the keyboard's X closes the editor in hand. */
  function keys(st, e) {
    if (!e || !st.wins.length) return { taken: false, act: "" };
    if (e.key === "Escape" && e.repeat) return { taken: true, act: "close-all" };
    if (!st.show) return { taken: false, act: "" };
    const list = minimised(st);
    if (e.key === "Escape") { endShow(st); return { taken: true, act: "leave" }; }
    const d = /^[1-9]$/.test(e.key || "") ? Number(e.key) : 0;
    if (d && d <= list.length) { const kind = list[d - 1].kind; pick(st, kind); return { taken: true, act: "pick", kind }; }
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      st.showAt = (st.showAt + (e.key === "ArrowRight" ? 1 : list.length - 1)) % list.length;
      return { taken: true, act: "move" };
    }
    if (e.key === "Enter" || e.key === " ") {
      const rec = list[st.showAt];
      if (rec) { pick(st, rec.kind); return { taken: true, act: "pick", kind: rec.kind }; }
      return { taken: true, act: "" };
    }
    return { taken: true, act: "" };
  }

  /* ---- Focus order. F6 goes through the editors showing in the order they were opened, then to the desk with every one
     minimised; from the desk it does what the button does. Not while the showcase is up. */
  function f6(st) {
    if (!st.active || st.show) return false;
    if (st.rest) return fabPress(st);
    const list = showing(st), i = list.indexOf(st.active);
    if (i >= 0 && i < list.length - 1) return activate(st, list[i + 1]);
    return toDesk(st);
  }

  const api = Object.freeze({
    KINDS, CARD_W, BAND, EDGE, GAP, HEAD, SHOW_S, SHOW_GAP, BACK_STEP,
    create, layout, open, alreadyOpen, close, closeAll, setDirty, bringForward, bringUp, toDesk, toFront, minimise,
    fabPress, marks, openShow, endShow, pick, keys, f6, showing, minimised,
  });
  if (typeof module === "object" && module && module.exports) module.exports = api;
  else root.STUDIO_EDITOR_STACK = api;
})(typeof window !== "undefined" ? window : this);
