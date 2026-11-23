/* THE KEYBOARD SHORTCUTS REGISTRY FOR STUDIO.
 *
 * Board 965, run S4 and S4b of the Settings plan (office brief settings-965-967-969-plan-2026-11-08.md).
 * Every Studio shortcut is registered here with its default chord and metadata.
 * Handlers ask this registry, keeping it the single place a key is looked up.
 * Rebinding (S4b) matches the desk: press to record, one owner per chord, Reset shortcuts restores.
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.StudioKeys = factory();
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  /* Every registered shortcut in Studio. */
  const SHORTCUTS = [
    {
      id: "rename",
      glyph: "edit",
      label: "Rename",
      hint: "Rename what is focused, where it stands",
      def: { code: "F2", key: "F2", ctrl: 0, alt: 0, shift: 0, meta: 0 },
      display: "F2",
      chip: "new key"
    },
    {
      id: "maintenance",
      glyph: "settings",
      label: "Maintenance panel",
      hint: "Open the Maintenance tab: readings about this computer, and its recovery tools",
      def: { code: "KeyM", key: "m", ctrl: 1, alt: 0, shift: 1, meta: 0 },
      display: "Ctrl+Shift+M",
      chip: "new key"
    },
    {
      id: "places",
      glyph: "places",
      label: "All open catalogs",
      hint: "See the open catalogs side by side",
      def: { code: "ArrowUp", key: "ArrowUp", ctrl: 1, alt: 0, shift: 0, meta: 0 },
      display: "Ctrl+Up"
    },
    {
      id: "find",
      glyph: "search",
      label: "Find and replace",
      hint: "Find and replace text across the catalog",
      def: { code: "KeyH", key: "h", ctrl: 1, alt: 0, shift: 0, meta: 0 },
      display: "Ctrl+H"
    },
    {
      id: "undo",
      glyph: "undo",
      label: "Undo",
      hint: "Take back what was just done, while its Undo button is on screen",
      def: { code: "KeyZ", key: "z", ctrl: 1, alt: 0, shift: 0, meta: 0 },
      display: "Ctrl+Z"
    },
    {
      id: "tabNext",
      glyph: "tab",
      label: "Next tab",
      hint: "Switch to the next tab, round to the first after the last",
      def: { code: "Tab", key: "Tab", ctrl: 1, alt: 0, shift: 0, meta: 0 },
      display: "Ctrl+Tab"
    },
    {
      id: "tabPrev",
      glyph: "tab",
      label: "Previous tab",
      hint: "Switch to the previous tab, round to the last after the first",
      def: { code: "Tab", key: "Tab", ctrl: 1, alt: 0, shift: 1, meta: 0 },
      display: "Ctrl+Shift+Tab"
    },
    {
      id: "tabClose",
      glyph: "close",
      label: "Close tab",
      hint: "Close the tab in front",
      def: { code: "KeyW", key: "w", ctrl: 1, alt: 0, shift: 0, meta: 0 },
      def2: { code: "F4", key: "F4", ctrl: 1, alt: 0, shift: 0, meta: 0 },
      display: "Ctrl+W"
    },
    {
      id: "findings",
      glyph: "lint",
      label: "Next finding",
      hint: "Go to the next finding in the catalog",
      def: { code: "F8", key: "F8", ctrl: 0, alt: 0, shift: 0, meta: 0 },
      display: "F8"
    },
    {
      id: "nextMoveUp",
      glyph: "move-up",
      label: "Move next card up",
      hint: "Move the focused one of Next cards up the list",
      def: { code: "ArrowUp", key: "ArrowUp", ctrl: 0, alt: 1, shift: 0, meta: 0 },
      display: "Alt+Up"
    },
    {
      id: "nextMoveDown",
      glyph: "move-down",
      label: "Move next card down",
      hint: "Move the focused one of Next cards down the list",
      def: { code: "ArrowDown", key: "ArrowDown", ctrl: 0, alt: 1, shift: 0, meta: 0 },
      display: "Alt+Down"
    },
    {
      id: "nextRemove",
      glyph: "remove",
      label: "Remove next card",
      hint: "Take the focused card off Next cards; the card itself stays",
      def: { code: "Delete", key: "Delete", ctrl: 0, alt: 0, shift: 0, meta: 0 },
      display: "Delete"
    },
    {
      id: "pathsBack",
      glyph: "back",
      label: "Back along the path",
      hint: "Step back along the path on the Paths map",
      def: { code: "Backspace", key: "Backspace", ctrl: 0, alt: 0, shift: 0, meta: 0 },
      display: "Backspace"
    },
    {
      id: "zoomIn",
      glyph: "zoom-in",
      label: "Zoom in",
      hint: "Make text and controls larger",
      def: { code: "Equal", key: "=", ctrl: 1, alt: 0, shift: 0, meta: 0 },
      def2: { code: "NumpadAdd", key: "+", ctrl: 1, alt: 0, shift: 0, meta: 0 },
      display: "Ctrl++"
    },
    {
      id: "zoomOut",
      glyph: "zoom-out",
      label: "Zoom out",
      hint: "Make text and controls smaller",
      def: { code: "Minus", key: "-", ctrl: 1, alt: 0, shift: 0, meta: 0 },
      def2: { code: "NumpadSubtract", key: "-", ctrl: 1, alt: 0, shift: 0, meta: 0 },
      display: "Ctrl+-"
    },
    {
      id: "zoomReset",
      glyph: "zoom-reset",
      label: "Reset zoom",
      hint: "Return text and controls to their usual size",
      def: { code: "Digit0", key: "0", ctrl: 1, alt: 0, shift: 0, meta: 0 },
      def2: { code: "Numpad0", key: "0", ctrl: 1, alt: 0, shift: 0, meta: 0 },
      display: "Ctrl+0"
    },
    {
      id: "shelfMoveLeft",
      glyph: "back",
      label: "Move card left",
      hint: "Move the focused card to the nearest open category on the left",
      def: { code: "ArrowLeft", key: "ArrowLeft", ctrl: 0, alt: 1, shift: 0, meta: 0 },
      display: "Alt+Left"
    },
    {
      id: "shelfMoveRight",
      glyph: "forward",
      label: "Move card right",
      hint: "Move the focused card to the nearest open category on the right",
      def: { code: "ArrowRight", key: "ArrowRight", ctrl: 0, alt: 1, shift: 0, meta: 0 },
      display: "Alt+Right"
    }
  ];

  function emptyChord() {
    return { code: "", key: "", ctrl: 0, alt: 0, shift: 0, meta: 0 };
  }

  function cloneChord(c) {
    return Object.assign(emptyChord(), c || {});
  }

  function chordFromEvent(e) {
    if (!e) return null;
    let key = e.key, code = e.code || "";
    if (key && key.length === 1) key = key.toLowerCase();
    if (key === "Control" || key === "Alt" || key === "Shift" || key === "Meta") return null;
    return {
      code: code,
      key: key,
      ctrl: e.ctrlKey ? 1 : 0,
      alt: e.altKey ? 1 : 0,
      shift: e.shiftKey ? 1 : 0,
      meta: e.metaKey ? 1 : 0
    };
  }

  function chordsEqual(a, b) {
    if (!a || !b) return false;
    if ((a.ctrl ? 1 : 0) !== (b.ctrl ? 1 : 0)) return false;
    if ((a.alt ? 1 : 0) !== (b.alt ? 1 : 0)) return false;
    if ((a.shift ? 1 : 0) !== (b.shift ? 1 : 0)) return false;
    if ((a.meta ? 1 : 0) !== (b.meta ? 1 : 0)) return false;
    if (a.code && b.code && a.code === b.code) return true;
    return String(a.key || "").toLowerCase() === String(b.key || "").toLowerCase();
  }

  function isPrintableKey(c) {
    if (!c) return false;
    var code = c.code || "";
    var key = c.key || "";
    if (code.indexOf("Key") === 0 || code.indexOf("Digit") === 0) return true;
    if (key.length === 1 && key !== " ") return true;
    return false;
  }

  function isRefusedChord(c) {
    if (!c) return false;
    var ctrl = c.ctrl ? 1 : 0;
    var alt = c.alt ? 1 : 0;
    var shift = c.shift ? 1 : 0;
    var meta = c.meta ? 1 : 0;

    // Ctrl with A, C, V, X, Y or Z: text-editing chords
    if (ctrl === 1 && alt === 0 && meta === 0 && shift === 0) {
      var k = (c.key || "").toLowerCase();
      var code = c.code || "";
      if (["a", "c", "v", "x", "y", "z"].indexOf(k) >= 0 || /^Key[ACVXYZ]$/i.test(code)) {
        return true;
      }
    }

    // Space, Enter, Tab, Backspace or Delete with no modifier
    if (ctrl === 0 && alt === 0 && meta === 0 && shift === 0) {
      var key = c.key || "";
      var code = c.code || "";
      if (key === "Space" || code === "Space" || key === " " ||
          key === "Enter" || code === "Enter" ||
          key === "Tab" || code === "Tab" ||
          key === "Backspace" || code === "Backspace" ||
          key === "Delete" || code === "Delete") {
        return true;
      }
    }

    // Printable key with no modifier, or Shift with a printable key (counts as printable)
    if (ctrl === 0 && alt === 0 && meta === 0) {
      if (isPrintableKey(c)) {
        return true;
      }
    }

    // AltGr is Ctrl+Alt: on a Polish layout Ctrl+Alt with A, C, E, L, N, O, S, X or Z types a letter, so Ctrl+Alt with a
    // printable key, with or without Shift, is typing too (the test architect, 2026-11-09)
    if (ctrl === 1 && alt === 1 && meta === 0 && isPrintableKey(c)) {
      return true;
    }

    return false;
  }

  var scMap = {};
  var scMap2 = {};

  function initMaps() {
    scMap = {};
    scMap2 = {};
    SHORTCUTS.forEach(function (d) {
      scMap[d.id] = cloneChord(d.def);
      scMap2[d.id] = cloneChord(d.def2 || emptyChord());
    });
  }
  initMaps();

  function loadShortcuts(raw) {
    initMaps();
    if (raw && typeof raw === "object") {
      Object.keys(raw).forEach(function (k) {
        var alt = /~2$/.test(k), id = alt ? k.slice(0, -2) : k;
        if (!scMap[id]) return;
        var def = SHORTCUTS.find(function (d) { return d.id === id; });
        if (def && def.fixed) return;
        var c = raw[k];
        if (alt) scMap2[id] = (c && (c.code || c.key)) ? cloneChord(c) : emptyChord();
        else if (c && typeof c === "object") scMap[id] = (c.code || c.key) ? cloneChord(c) : emptyChord();
      });
    }
  }

  function getStoredOverrides() {
    var out = {};
    SHORTCUTS.forEach(function (d) {
      if (d.fixed) return;
      var c = scMap[d.id];
      if (!chordsEqual(c, d.def)) out[d.id] = cloneChord(c);
      var a = scMap2[d.id] || emptyChord();
      if (!chordsEqual(a, d.def2 || emptyChord())) out[d.id + "~2"] = cloneChord(a);
    });
    return out;
  }

  function scChord(id) {
    if (scMap && scMap[id]) return scMap[id];
    var d = SHORTCUTS.find(function (x) { return x.id === id; });
    return d ? cloneChord(d.def) : emptyChord();
  }

  function scChord2(id) {
    if (scMap2 && scMap2[id]) return scMap2[id];
    var d = SHORTCUTS.find(function (x) { return x.id === id; });
    return d ? cloneChord(d.def2 || emptyChord()) : emptyChord();
  }

  /* Clearing the alternative is an assignment, as on the desk (keydown.js): through scTake an empty chord would "clash"
     with any action whose first slot an earlier displacement left empty, and reset it. */
  function scClear2(id) {
    if (!scMap2) initMaps();
    if (scMap && scMap[id]) scMap2[id] = emptyChord();
  }

  function scTake(id, slot, chord) {
    if (isRefusedChord(chord)) return null;
    var clash = null;
    var back = [];
    SHORTCUTS.forEach(function (d) {
      if (d.fixed) return;
      if (!(d.id === id && slot === 1) && chordsEqual(scMap[d.id], chord)) {
        clash = d;
        scMap[d.id] = cloneChord(d.def);
        back.push(d.id);
      }
      if (!(d.id === id && slot === 2) && chordsEqual(scMap2[d.id], chord)) {
        clash = d;
        scMap2[d.id] = emptyChord();
      }
    });
    if (slot === 2) scMap2[id] = cloneChord(chord);
    else scMap[id] = cloneChord(chord);
    back.forEach(function (b) {
      var c = scMap[b];
      if (SHORTCUTS.some(function (d) {
        return !d.fixed && d.id !== b && (chordsEqual(scMap[d.id], c) || chordsEqual(scMap2[d.id], c));
      })) {
        scMap[b] = emptyChord();
      }
    });
    return clash;
  }

  function resetShortcuts() {
    initMaps();
  }

  function getShortcut(id) {
    return SHORTCUTS.find(function (d) { return d.id === id; }) || null;
  }

  function matchKey(e, id) {
    var c = chordFromEvent(e);
    if (!c) return false;
    var c1 = scChord(id);
    if (c1 && (c1.code || c1.key) && chordsEqual(c, c1)) return true;
    var c2 = scChord2(id);
    if (c2 && (c2.code || c2.key) && chordsEqual(c, c2)) return true;
    return false;
  }

  function lookupKey(e) {
    var c = chordFromEvent(e);
    if (!c) return null;
    for (var i = 0; i < SHORTCUTS.length; i++) {
      var d = SHORTCUTS[i];
      var c1 = scChord(d.id), c2 = scChord2(d.id);
      if ((c1 && (c1.code || c1.key) && chordsEqual(c, c1)) ||
          (c2 && (c2.code || c2.key) && chordsEqual(c, c2))) return d.id;
    }
    return null;
  }

  function formatChord(c, def) {
    /* The default's own text stands for the default chord, and never for a number pad's key that merely types the same character
       (chordsEqual falls back to the key, as matching a pressed key must): that one is written out, "Ctrl+Num -". */
    if (def && def.display && (!c || (chordsEqual(c, def.def) && !/^Numpad/.test(c.code || "")))) return def.display;
    if (!c || (!c.code && !c.key)) return "-";
    var parts = [];
    if (c.ctrl) parts.push("Ctrl");
    if (c.alt) parts.push("Alt");
    if (c.shift) parts.push("Shift");
    if (c.meta) parts.push("Meta");
    var lab = c.code || c.key || "";
    if (lab.indexOf("Key") === 0) lab = lab.slice(3);
    else if (lab.indexOf("Digit") === 0) lab = lab.slice(5);
    else if (lab === "ArrowUp") lab = "Up";
    else if (lab === "ArrowDown") lab = "Down";
    else if (lab === "ArrowLeft") lab = "Left";
    else if (lab === "ArrowRight") lab = "Right";
    else if (lab === "Escape") lab = "Esc";
    else if (lab === "Equal") lab = "+";
    else if (lab === "Minus") lab = "-";
    else if (lab.indexOf("Numpad") === 0) {
      /* A number pad's key names the number pad, so a row's two chords never read alike ("Ctrl++" and "Ctrl+Num +"). */
      var pad = lab.slice(6);
      var padNames = { Add: "+", Subtract: "-", Multiply: "*", Divide: "/", Decimal: ".", Equal: "=" };
      lab = "Num " /* few-forms: a name, not a count */ + (Object.prototype.hasOwnProperty.call(padNames, pad) ? padNames[pad] : pad);
    }
    else if (lab.length === 1) lab = lab.toUpperCase();
    parts.push(lab);
    return parts.join("+");
  }

  var scCaptureId = null;
  var scCaptureSlot = 1;

  function startCapture(id, slot) {
    scCaptureId = id;
    scCaptureSlot = slot === 2 ? 2 : 1;
  }

  function stopCapture() {
    scCaptureId = null;
  }

  function captureState() {
    return { id: scCaptureId, slot: scCaptureSlot };
  }

  return {
    SHORTCUTS: SHORTCUTS,
    getShortcut: getShortcut,
    matchKey: matchKey,
    lookupKey: lookupKey,
    chordFromEvent: chordFromEvent,
    chordsEqual: chordsEqual,
    formatChord: formatChord,
    emptyChord: emptyChord,
    cloneChord: cloneChord,
    loadShortcuts: loadShortcuts,
    getStoredOverrides: getStoredOverrides,
    scChord: scChord,
    scChord2: scChord2,
    scTake: scTake,
    scClear2: scClear2,
    resetShortcuts: resetShortcuts,
    startCapture: startCapture,
    stopCapture: stopCapture,
    captureState: captureState,
    isRefusedChord: isRefusedChord,
    isFieldKey: isRefusedChord
  };
});
