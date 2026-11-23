/* WHICH LANGUAGE A COLUMN IS ACTUALLY IN, and the case the header cannot answer.
 *
 * The header is evidence, not proof. A pile exported by somebody who filled the Polish column
 * with English, or who swapped the two, carries headers that say one thing and text that says
 * another; the engine then declares two languages and a Polish desk reads English all day. The
 * header is checked BY the text rather than trusted, and where the two disagree the importer
 * flags it and keeps the header's verdict, because overruling an author's own column heading on
 * a heuristic is how an importer loses content.
 *
 * THE HEURISTIC, stated so a second tool could be written from it:
 *   - a Polish letter outside the Latin-1 alphabet (a-ogonek, c-acute, e-ogonek, l-stroke,
 *     n-acute, o-acute, s-acute, z-acute, z-dot) is worth 3 points to PL;
 *   - each occurrence of a word from the PL list below is worth 1 point to PL, and each from
 *     the EN list 1 point to EN, matched as whole words, case folded;
 *   - the verdict is the side with the higher score, and UNDETERMINED when the winner scores
 *     under FLOOR or leads by less than MARGIN times the loser.
 *
 * UNDETERMINED IS A VERDICT AND NOT A FAILURE. The generator's piles are an invented syllabary
 * with no function word and no diacritic in either language, so every column of every fixture
 * is undetermined - which is correct, and is why the header's verdict stands where the text is
 * silent. A heuristic that returned a confident answer on those piles would be reading noise.
 */

/* Whole words, because "i" inside "with" is not the Polish "i" and a substring match would
   score Polish on every English sentence in the pile. */
const PL_WORDS = ["i", "w", "z", "ze", "na", "do", "nie", "sie", "się", "jest", "to", "że",
                  "ze", "dla", "od", "po", "przy", "tym", "tego", "jak", "ale", "lub", "oraz",
                  "przez", "bez", "juz", "już", "tylko", "moze", "może", "prosze", "proszę",
                  "dziekuje", "dziękuję", "panstwa", "państwa", "prosimy", "zostal", "został"];
const EN_WORDS = ["the", "and", "of", "to", "in", "is", "for", "with", "you", "your", "we",
                  "our", "on", "at", "that", "this", "it", "be", "are", "will", "can", "please",
                  "thank", "thanks", "from", "have", "has", "not", "but", "or", "as", "if"];

const PL_LETTERS = /[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/g;

const FLOOR = 4;      // under this many points nothing has been shown
const MARGIN = 1.5;   // and a lead thinner than this is not a lead

function words(text) {
  return String(text || "").toLowerCase().split(/[^\p{L}]+/u).filter(Boolean);
}

/** One passage's score. Exported so a test can drive the curve rather than one point on it. */
function score(text) {
  const s = String(text || "");
  const diacritics = (s.match(PL_LETTERS) || []).length;
  const w = words(s);
  let pl = diacritics * 3, en = 0;
  for (const x of w) {
    if (PL_WORDS.includes(x)) pl++;
    if (EN_WORDS.includes(x)) en++;
  }
  return { pl, en, diacritics, words: w.length };
}

/** The verdict over a column of passages: "pl", "en" or null for undetermined. */
function detect(passages) {
  const total = { pl: 0, en: 0, diacritics: 0, words: 0 };
  for (const p of passages || []) {
    const s = score(p);
    total.pl += s.pl; total.en += s.en;
    total.diacritics += s.diacritics; total.words += s.words;
  }
  const hi = Math.max(total.pl, total.en), lo = Math.min(total.pl, total.en);
  let verdict = null;
  if (hi >= FLOOR && (lo === 0 || hi >= lo * MARGIN)) verdict = total.pl > total.en ? "pl" : "en";
  return { verdict, ...total,
           why: verdict
             ? verdict + " by " + total.pl + " Polish point(s) against " + total.en
               + " English, over " + total.words + " word(s)"
             : "undetermined: " + total.pl + " Polish point(s) against " + total.en
               + " English over " + total.words + " word(s), under the floor of " + FLOOR
               + " or inside the margin of " + MARGIN };
}

export { detect, score, PL_WORDS, EN_WORDS, FLOOR, MARGIN };
