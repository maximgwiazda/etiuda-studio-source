/* `hidden` MEANS HIDDEN ON THIS PAGE, FOR ANY ELEMENT, INCLUDING ONE NOBODY HAS WRITTEN YET.
 *
 *     node tests/hidden.mjs [--keep]
 *
 * WHAT THIS IS FOR. Studio's sheet answered `hidden` per element - `.scrim[hidden]`,
 * `.foot[hidden]`, `.chrome[hidden]`, `.mktip[hidden]`, `.discs[hidden]` - because the canvas
 * declares a display on nearly everything and an author rule beats the user agent's own
 * `[hidden]{display:none}` at any specificity. Three of those five were written after the fault
 * had already shipped and been found by looking at a screenshot. The fourth would have been
 * written the same way, on the morning the tour's Back button painted at 49x27 with the
 * attribute set (board 721, Claudia). So the five rules were replaced by one at the head of the
 * build's half of the sheet, `[hidden]{display:none!important}`, which is the engine's own
 * answer at src/template.html:691.
 *
 * WHY THE PAGE AND NOT THE FILE. The claim is about the cascade, and the cascade is decided by
 * the whole sheet, the user agent's sheet and the element's own classes together. Reading
 * `[hidden]{display:none!important}` out of ui/index.html would prove the characters are there
 * and say nothing about whether anything is hidden; that is the exact mistake the per-element
 * rules were an attempt to fix.
 *
 * THE CONTROL IS THE RULE'S ABSENCE, not a second element. Section 3 deletes the rule from the
 * live stylesheet through the CSSOM, re-measures the same element and puts the rule back: the
 * element is on the screen with a box while the rule is gone and has no box while it is there.
 * Without that leg, sections 1 and 2 would pass just as well against an element that was hidden
 * for some other reason entirely - which is what happened on 2026-09-17 next door, where a leg
 * agreed with the code because it shared the code's mistake.
 *
 * SECTION 2 IS THE ONE THAT WOULD HAVE CAUGHT THE FAULT. It plants a `.btn` - the class the
 * tour's Back button will carry - and asks whether setting `hidden` on it is enough. `.btn`
 * declares `display:inline-flex`, no rule in this sheet mentions it beside `[hidden]`, and
 * before the change this leg measured a visible button.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { openStudio } from "./shell-door.mjs";
import { clearScratch, dropScratch } from "./scratch.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const SCRATCH = path.join(ROOT, "scratch", "hidden");

/* The five the program sets the property on today, by `grep -n "\.hidden\s*=" ui/app.js` over
   the committed file: #chrome (paintChrome), #mkTip (the marker's panel), #foot (the wizard's
   row), #scrim (every cover) and #discs (the corner). Each carried a rule of its own until this
   change, so each is a claim that the one rule replaced it. A sixth, #menuList (paintMenu, the
   Menu's list), never had a rule of its own and is covered by the one, so it is not listed. */
const OWN = ["#chrome", "#mkTip", "#foot", "#scrim", "#discs"];

let asserted = 0, failed = 0;
function check(cond, line) {
  asserted++;
  if (cond) process.stdout.write("  ok   " + line + "\n");
  else { failed++; process.stderr.write("  FAIL " + line + "\n"); }
}

/** Set or clear `hidden` on one element and read what the cascade then says about its box.
 *  Both readings happen inside one evaluate, so the program cannot repaint between them. */
const PROBE = (sel) => {
  const el = document.querySelector(sel);
  if (!el) return { missing: true };
  const was = el.hasAttribute("hidden");
  const read = () => {
    const r = el.getBoundingClientRect();
    return { display: getComputedStyle(el).display, rects: el.getClientRects().length,
             w: Math.round(r.width), h: Math.round(r.height) };
  };
  el.hidden = false;
  const shown = read();
  el.hidden = true;
  const gone = read();
  if (was) el.hidden = true; else el.removeAttribute("hidden");
  return { missing: false, shown, gone };
};

async function main(argv) {
  const keep = argv.indexOf("--keep") >= 0;
  clearScratch(SCRATCH);
  const projects = path.join(SCRATCH, "projects");
  fs.mkdirSync(projects, { recursive: true });

  const studio = await openStudio("tests/hidden.mjs", {
    projects, userDataDir: path.join(SCRATCH, "ud"),
  });
  try {
    const page = studio.page;
    const run = async (fn, arg) => JSON.parse(await page.evaluate(
      "JSON.stringify((" + String(fn) + ")(" + JSON.stringify(arg) + "))"));

    /* ---- 1. the five the program already toggles -------------------------------------------- */
    for (const sel of OWN) {
      const r = await run(PROBE, sel);
      check(!r.missing && r.shown.rects >= 1 && r.shown.display !== "none"
            && r.gone.rects === 0 && r.gone.display === "none",
        "1 " + sel + " has a box without the attribute and none with it: "
        + (r.missing ? "the element is not in the page"
          : r.shown.display + "/" + r.shown.rects + " rect(s) against "
            + r.gone.display + "/" + r.gone.rects));
    }

    /* ---- 2. an element no rule in this sheet has ever named --------------------------------- */
    /* THE TOUR'S BACK BUTTON, BEFORE THE TOUR. A `.btn` in the chrome row is what step one of the
       tour will put there, and `prev.hidden = i === 0` is the line that has to work. Planted
       rather than waited for, because the point of this leg is that it holds for the NEXT such
       element as well as this one. */
    const planted = await run(() => {
      const el = document.createElement("button");
      el.className = "btn";
      el.id = "hiddenGateProbe";
      el.textContent = "Back";
      document.querySelector("#chrome").appendChild(el);
      const r = el.getBoundingClientRect();
      return { display: getComputedStyle(el).display, rects: el.getClientRects().length,
               w: Math.round(r.width), h: Math.round(r.height) };
    });
    check(planted.rects === 1 && planted.display !== "none" && planted.w > 0 && planted.h > 0,
      "2a the planted .btn is on the screen before anything is set: " + planted.display + " "
      + planted.w + "x" + planted.h);

    const probe = await run(PROBE, "#hiddenGateProbe");
    check(probe.gone.rects === 0 && probe.gone.display === "none",
      "2b and setting `hidden` on it is enough, with no rule naming it: " + probe.shown.display
      + "/" + probe.shown.rects + " rect(s) against " + probe.gone.display + "/"
      + probe.gone.rects);

    /* ---- 3. the control: the same element with the rule taken away --------------------------- */
    const control = await run(() => {
      const el = document.getElementById("hiddenGateProbe");
      el.hidden = true;
      /* WHERE THE RULE IS. One <style> in the head and nothing injects CSS at runtime, which is
         this page's own rule, so the sheet is document.styleSheets[0] and the rule is found by
         its selector rather than by a line number. */
      const sheet = document.styleSheets[0];
      const at = Array.from(sheet.cssRules)
        .findIndex(r => r.selectorText === "[hidden]");
      if (at < 0) return { found: false };
      const text = sheet.cssRules[at].cssText;
      const withRule = { display: getComputedStyle(el).display,
                         rects: el.getClientRects().length };
      sheet.deleteRule(at);
      const r = el.getBoundingClientRect();
      const without = { display: getComputedStyle(el).display, rects: el.getClientRects().length,
                        w: Math.round(r.width), h: Math.round(r.height) };
      sheet.insertRule(text, at);
      const back = { display: getComputedStyle(el).display, rects: el.getClientRects().length };
      const count = Array.from(sheet.cssRules)
        .filter(rule => rule.selectorText === "[hidden]").length;
      el.remove();
      return { found: true, text, withRule, without, back, count };
    });
    check(control.found && control.count === 1,
      "3a the sheet carries the rule once, by selector over document.styleSheets[0].cssRules: "
      + JSON.stringify(control.found ? control.text : "not found"));
    check(control.found && control.without.rects === 1 && control.without.display !== "none"
          && control.without.w > 0 && control.without.h > 0,
      "3b with the rule deleted the same hidden element is back on the screen, which is what the"
      + " tour's Back button did: " + (control.found
        ? control.without.display + " " + control.without.w + "x" + control.without.h
        : "no rule to delete"));
    check(control.found && control.withRule.rects === 0 && control.back.rects === 0
          && control.back.display === "none",
      "3c and it is gone again with the rule put back, so the rule is what does it: "
      + (control.found ? control.withRule.display + " then " + control.back.display : "-"));
  } finally { await studio.shut(); }

  if (!keep) dropScratch(SCRATCH, "hidden");
  process.stdout.write("hidden  " + asserted + " assertion(s), " + failed + " failure(s)\n");
  process.exit(failed ? 1 : 0);
}

main(process.argv.slice(2)).catch(e => {
  process.stderr.write("hidden  " + (e && e.stack ? e.stack : String(e)) + "\n");
  process.exit(2);
});
