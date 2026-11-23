"use strict";
/* WHAT STUDIO HANDS THE ENGINE'S PAGE WATCH (engine/pinned/shell/page-watch.cjs): the recovery window's
 * words in the two languages the page speaks, `lang` decided by the shell, and Studio's own look of it.
 * CommonJS so that shell/main.js can require it and a node gate can read it. */
const WORDS = {
  en: { lang: "en", title: "Etiuda Studio", gone: "Etiuda Studio stopped unexpectedly.",
        hung: "Etiuda Studio is not responding.", restart: "Restart",
        close: "Close Etiuda Studio", wait: "Wait" },
  pl: { lang: "pl", title: "Etiuda Studio", gone: "Etiuda Studio niespodziewanie się zatrzymało.",
        hung: "Etiuda Studio nie odpowiada.", restart: "Uruchom ponownie",
        close: "Zamknij Etiuda Studio", wait: "Czekaj" },
};
function wordsFor(lang) { return WORDS[lang] || WORDS.en; }

/* The page file's name, a width that holds the longer Polish line, and Studio's blue in both themes. */
const LOOK = { name: "etiuda-studio-recovery", width: 420,
               accent: { over: "#dceafe", fill: "#2563eb", darkFill: "#2563eb" } };

module.exports = { WORDS, wordsFor, LOOK };
