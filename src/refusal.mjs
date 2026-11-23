/* A REFUSAL A PERSON MEETS AT A SCREEN, CARRIED AS ITS FRAME AND ITS VARIABLES.
 *
 * Board 523, Maxim's ruling of 2026-09-18 on 479: the refusals join the copywriter's pass as a
 * class, with the plural written by count. Two things follow from that and this file is both.
 *
 * THE SHELL CANNOT TRANSLATE AN ENGLISH SENTENCE IT IS HANDED. These sentences are thrown here,
 * in the node half, and painted there, in the page; the table that holds the Polish is in the
 * page (`ui/lang.js`). An error whose message is "no card \"abc\" in this catalog" has already
 * lost the id, so the page would have to parse English back into a frame and a variable, and a
 * parse that is wrong once paints a sentence nobody wrote. So a refusal travels as WHAT IT WAS
 * BUILT FROM: the frame, which is the key of the table, and the variables, which are values.
 * `shell/main.js` puts `e.said` on the wire beside `error`, and `ui/app.js` says it at PAINT
 * TIME, because which screen is being painted is what decides whether Polish may be spoken.
 *
 * THE ENGLISH IS BUILT HERE AND IS STILL THE Error's MESSAGE, unchanged, so every command-line
 * tool prints exactly what it printed before and nothing outside the shell has to know this
 * file exists.
 *
 * A COUNT IS NOT A NUMBER IN THE SENTENCE, IT IS A COUNTED NOUN. `card(s)` is a sentence that
 * has given up in front of the reader, and Polish cannot write one at all: 1 karta, 2 karty,
 * 5 kart. So a count goes in as `counted(n, "{N} card", "{N} cards")` - the two English forms
 * are the table's keys, the Polish few form is in the table's own PL_FEW - and each side picks
 * the form its language needs. THE PHRASE THAT COMES BACK IS NOMINATIVE AND CAN STAND NOWHERE
 * ELSE (the copywriter's rule, `copywriter-studio-pass-2.md` section 4.2): "2 karty" cannot
 * follow "w" and cannot be a verb's object, so every frame in this program puts the count at the
 * head as a subject, behind a colon where the words before it agree with nothing, or after a
 * comma as a bare statement of quantity. A frame that takes a finite verb after a count is
 * wrong in Polish however it is translated, because the verb's form changes with the count.
 *
 * WHAT IS NOT IN THE CLASS STAYS A PLAIN `throw new Error`. Two kinds: a sentence that can only
 * come from a command line, because it names a flag or a tool, and a sentence reporting a fault
 * in the program rather than in what a person did, whose reader is whoever gets the bug report.
 * Translating the second kind would dress a defect as a choice the person made.
 */
"use strict";

/** A count and the two English forms of its noun, for a slot in a frame. */
export function counted(n, one, many) {
  return { n: Number(n) || 0, one: String(one), many: String(many) };
}

const isCount = (v) => v !== null && typeof v === "object" && typeof v.n === "number";

/** The English of a frame: the form English picks, with an ORDINARY space before the noun. The
 *  page says the frame again through its own C() and T(), which bind a number to its word with a
 *  no-break space in every language; a command line is not laid out in lines, so here it is not. */
export function say(frame, vars) {
  return String(frame).replace(/\{(\w+)\}/g, (m, k) => {
    if (!vars || !Object.prototype.hasOwnProperty.call(vars, k)) return m;
    const v = vars[k];
    /* A value that is itself a frame, a lint line inside an import's note, is said in place. */
    if (v && typeof v === "object" && typeof v.frame === "string") return say(v.frame, v.vars);
    if (!isCount(v)) return String(v);
    return String(v.n === 1 ? v.one : v.many).replace("{N}", String(v.n));
  });
}

/** The Error to throw: English in `message`, the frame and its variables in `said`. `cli`, where
 *  given, is the command line's own English, for a frame whose way forward there is a flag or a
 *  tool and on the screen is a field or a button. */
export function refuse(frame, vars, cli) {
  const e = new Error(say(cli || frame, vars));
  e.said = { frame: String(frame), vars: vars || {} };
  return e;
}

/* A FAULT OF THE DISK OR THE SHARE, SAID AS WHAT HAPPENED AND THE WAY ON. Node's own sentence
   ("EPERM: operation not permitted, open ...") is neither, and it reached the Polish screen in
   English. Three families have a way on a person can take; any other fault of the system, or one with no path to
   name, is passed through as it was, since nobody at the desk can act on it, but it is marked all the same: `disk` tells the page
   the edit itself was sound, so an edit the disk refused is kept for the next save and the close holds for it. A fault the
   system names (EIO, ETIMEDOUT, ECONNRESET, EMFILE and the rest, which are the faults of a share that comes and goes) lost
   the edit when it was left unmarked (the editing review of 2026-11-22). A refusal, which has its own sentence, and an
   error that is not the system's (a mistake in the program, a code like ERR_INVALID_ARG_TYPE) are not the disk's. */
const SYSTEM_CODE = /^(E[A-Z0-9]+|UNKNOWN)$/;
const GONE = ["ENOENT", "ENOTDIR", "ENETUNREACH", "EHOSTUNREACH", "EHOSTDOWN", "ENETDOWN"];
const HELD = ["EPERM", "EACCES", "EBUSY", "EROFS"];
const FULL = ["ENOSPC", "EDQUOT"];

export function diskRefusal(e) {
  if (!e || typeof e !== "object" || e.said || typeof e.code !== "string") return e;
  if (!e.path) { if (SYSTEM_CODE.test(e.code)) e.disk = true; return e; }
  const P = String(e.path);
  let r = null;
  if (GONE.indexOf(e.code) >= 0) r = refuse("Could not reach {P}, perhaps because the drive or"
    + " share it is on is not connected. Once it is, try again.", { P });
  else if (HELD.indexOf(e.code) >= 0) r = refuse("Could not write to {P}, perhaps because it is"
    + " read-only or another program has it open. Once it is free, try again.", { P });
  else if (FULL.indexOf(e.code) >= 0) r = refuse("Could not write to {P}, because the drive it is"
    + " on is full. Once there is room on it, try again.", { P });
  if (!r) { if (SYSTEM_CODE.test(e.code)) e.disk = true; return e; } /* plant:esv-any-fault */
  r.disk = true;
  r.code = e.code;
  return r;
}

/** A NOTE AT THE HEAD OF A SCREEN, WHICH IS NOT A REFUSAL AND IS SAID THE SAME WAY. The review
 *  queue reports what it noticed about a file it accepted - another catalog's id, a missing
 *  export marker, a rev behind the working copy - and those sentences are painted on the same
 *  Polish screen as every refusal, so they need the same treatment for the same reason: the
 *  English has already lost the id and the number a translation would put back. The shape is
 *  deliberately the one refusalOf returns, so ui/app.js reads a note and a refusal through one
 *  saidText() and the page needs no second reader. The NAME is separate because a note is not a
 *  refusal: nothing was stopped, and a reader of src/review.mjs must not have to work that out
 *  from the shape. */
export function noteOf(frame, vars) {
  return refusalOf(frame, vars);
}

/** The same pair for a refusal that is RETURNED rather than thrown - the tag and the card whose
 *  deletion is refused come back with the cards or the intents that are in the way, and the
 *  sentence rides along beside them. */
export function refusalOf(frame, vars) {
  return { message: say(frame, vars), said: { frame: String(frame), vars: vars || {} } };
}
