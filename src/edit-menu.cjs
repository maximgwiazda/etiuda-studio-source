"use strict";
/* THE EDIT MENU (studio-chrome-no-text-context-menu, the ease-of-use pass of 2026-10-12): a right-click in a field showed
 * nothing, no Cut, Copy, Paste or Select all, and a word Windows underlined offered no suggestion. Built from what
 * Chromium hands the shell with the right-click, the context-menu event's params, in the page's language. The commands
 * are the menu's roles, because the page's own clipboard permission is refused. Selected text outside a field gets Copy;
 * anywhere else nothing opens. The desk's shell builds the same menu (the pinned engine's contextMenuFor).
 * CommonJS so that shell/main.js can require it and a node gate can read it, as src/recovery.cjs. */
const WORDS = {
  en: { undo: "Undo", cut: "Cut", copy: "Copy", paste: "Paste", selectAll: "Select all", addWord: "Add to dictionary" },
  pl: { undo: "Cofnij", cut: "Wytnij", copy: "Kopiuj", paste: "Wklej", selectAll: "Zaznacz wszystko", addWord: "Dodaj do słownika" },
};
function editWordsFor(lang) { return WORDS[lang] || WORDS.en; }

/* The menu's items for one right-click: up to five suggestions and Add to dictionary over a misspelt word, then the
 * field's commands, each enabled as the field says it can; or Copy over selected text; or nothing. */
function editMenuFor(wc, p, w) {
  const f = (p && p.editFlags) || {}, items = [];
  w = w || WORDS.en;
  if (!p) return items;
  if (p.isEditable && p.misspelledWord) {
    (p.dictionarySuggestions || []).slice(0, 5).forEach(s =>
      items.push({ label: s, click: () => wc.replaceMisspelling(s) }));
    items.push({ label: w.addWord, click: () => wc.session.addWordToSpellCheckerDictionary(p.misspelledWord) });
    items.push({ type: "separator" });
  }
  if (p.isEditable) {
    items.push({ label: w.undo, role: "undo", enabled: !!f.canUndo }, { type: "separator" },
      { label: w.cut, role: "cut", enabled: !!f.canCut }, { label: w.copy, role: "copy", enabled: !!f.canCopy },
      { label: w.paste, role: "paste", enabled: !!f.canPaste }, { type: "separator" },
      { label: w.selectAll, role: "selectAll", enabled: !!f.canSelectAll });
  } else if (String(p.selectionText || "").trim()) {
    items.push({ label: w.copy, role: "copy", enabled: !!f.canCopy });
  }
  return items;
}

module.exports = { WORDS, editWordsFor, editMenuFor };
