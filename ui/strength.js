"use strict";
/* THE PASSPHRASE'S STRENGTH, ONE MEASURE FOR THE COVER AND THE COMMAND LINE.
 *
 * Finding 31, as Maxim ruled it on 2026-10-16 07:09: "It's up to the lead/manager with Studio to decide the security
 * measure, sometimes "kot" is indeed the most appropriate passphrase." So this is a measure the lead reads and is free to
 * ignore: nothing is refused for it and nothing asks twice. The backup copy's cover says it under the field as it is typed
 * (ui/app.js, through window.STUDIO_STRENGTH), and tools/sign.mjs make says it once on stderr after the key is made (by
 * require), so the two read one measure and cannot disagree.
 *
 * THE MEASURE. Its rough bits are the length in characters times log2 of the pool they come from (26 lower case, 26 upper
 * case, 10 digits, 1 space, 18 Polish letters, 33 other marks); below 45 it is weak, below 70 fair, else strong. A first
 * try anyone would make is weak whatever its bits, read in lower case with the spaces taken out:
 *   - fewer than five different characters;
 *   - one piece of at most half the length said again and again, the last copy perhaps cut short, with up to two
 *     characters added at either end ("horsehorsehorse1", "lamplamplamplamplamplampX");
 *   - a walk along the keyboard, the alphabet or the digits, with at most two steps off it;
 *   - nothing but the commonest words, or no letter at all, beside digits and marks, read once as typed and once with
 *     its trailing digits and marks taken off and the usual stand-ins read back as letters ("P@ssw0rd123").
 * keyStrength gives "" for an empty passphrase, else "weak", "fair" or "strong"; SAID is the line each says, the
 * English that ui/lang.js carries to Polish. A label of a rough level, and no estimate of time to guess.
 */
(function (root) {
  const WALKS = ["abcdefghijklmnopqrstuvwxyz", "01234567890", "qwertyuiop", "asdfghjkl", "zxcvbnm", "qwertzuiop", "yxcvbnm",
    "1qaz2wsx3edc4rfv5tgb6yhn7ujm8ik9ol0p", "1qay2wsx3edc4rfv5tgb6zhn7ujm8ik9ol0p"];
  const STEPS = new Set(WALKS.flatMap((w) => Array.from(w).slice(1).flatMap((c, i) => [w[i] + c, c + w[i]])));
  const WORDS = ["password", "passwort", "passphrase", "haslo", "haselko", "qwerty", "qwertz", "letmein", "welcome",
    "witaj", "admin", "administrator", "iloveyou", "kocham", "secret", "sekret", "etiuda", "studio", "login", "test",
    "polska", "abc", "zaq", "xsw"];
  const STAND_INS = { "0": "o", "@": "a", "4": "a", "3": "e", "$": "s", "5": "s", "1": "i", "7": "t" };
  const POOLS = [[/[a-z]/, 26], [/[A-Z]/, 26], [/[0-9]/, 10], [/ /, 1], [/[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/, 18],
    [/[^a-zA-Z0-9 ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/, 33]];
  const SAID = { weak: "Strength: weak", fair: "Strength: fair", strong: "Strength: strong" };

  /* One piece said again: a period d of at most half the length whose run from the start covers all but two characters
     at most, read forward and backward, so a character or two added at either end does not hide it. */
  function repeated(chars) {
    const n = chars.length;
    const covers = (list) => {
      for (let d = 1; d <= n / 2; d++) {
        let run = d;
        while (run < n && list[run] === list[run - d]) run++;
        if (run >= n - 2 && run >= 2 * d) return true;
      }
      return false;
    };
    return n > 0 && (covers(chars) || covers(chars.slice().reverse()));
  }
  /* Nothing but the first words: ends[i] is whether the letters from i on are such words alone. */
  function onlyWords(text) {
    const letters = text.normalize("NFD").replace(/ł/g, "l").replace(/[^\p{L}]/gu, "");
    const ends = new Array(letters.length + 1).fill(false);
    ends[letters.length] = true;
    for (let i = letters.length - 1; i >= 0; i--) ends[i] = WORDS.some((w) => ends[i + w.length] && letters.startsWith(w, i));
    return ends[0];
  }
  function firstTry(flat) {
    const chars = Array.from(flat);
    if (new Set(chars).size < 5) return true;
    if (repeated(chars)) return true;
    if (chars.slice(1).filter((c, i) => c !== chars[i] && !STEPS.has(chars[i] + c)).length <= 2) return true;
    if (onlyWords(flat)) return true;
    const bare = flat.replace(/[^\p{L}]+$/u, "");
    return !!bare && onlyWords(Array.from(bare).map((c) => STAND_INS[c] || c).join(""));
  }
  function keyStrength(passphrase) {
    const p = String(passphrase == null ? "" : passphrase), all = Array.from(p);
    if (!all.length) return "";
    const pool = POOLS.reduce((sum, [re, size]) => sum + (all.some((c) => re.test(c)) ? size : 0), 0);
    const bits = all.length * Math.log2(Math.max(pool, 2));
    return firstTry(p.toLowerCase().replace(/\s+/g, "")) || bits < 45 ? "weak" : bits < 70 ? "fair" : "strong";
  }

  const api = Object.freeze({ keyStrength, SAID });
  if (typeof module === "object" && module && module.exports) module.exports = api;
  else root.STUDIO_STRENGTH = api;
})(typeof window !== "undefined" ? window : this);
