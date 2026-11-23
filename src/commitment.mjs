/* THE LIKELY-COMMITMENT DETECTOR: A PURE MODULE, NO SCREEN, NO WORDS (board 814, slice S3e).
 *
 * A commitment is a reply the customer can hold the firm to. Studio's lint is meant to suggest
 * which cards are likely ones, so the team lead can confirm each with a tick. This module is the
 * finding half of that and nothing else: it takes a card's text and its language and says
 * whether the card is a likely commitment, by which rule, and by which clause. The lint row, the
 * words, the Dismiss memory and the screen are other pieces and wait for Maxim's reading.
 *
 *     likelyCommitment(text, "en" | "pl", options?)
 *       -> { likely, rule, kind, phrase }
 *
 *   likely  true or false.
 *   rule    the copywriter's rule id ("E1" to "E11", "P1" to "P11"), or null.
 *   kind    the rule's group, for the lint's "recognised by" line, as a stable key and no words:
 *           later (a promise for later), dated (a thing promised by a date), waived (a charge
 *           waived), wording (a promise in so many words), condition (a promise on a condition),
 *           done (an act reported as done). The screen's words for them are not here.
 *   phrase  the clause that matched, about sixty characters, cut with "..." (the finding's {PHRASE}).
 *
 * THE GRAMMAR IS THE COPYWRITER'S, state/drafts/copy-chains-lint-2026-10-04.md section 2, rules
 * E1 to E11 and P1 to P11 for commitments and EN1 to EN11 and PN1 to PN11 for the near misses.
 * Every rule there says how sure it is, and so says this file where it does less than the draft.
 *
 * HOW A CARD IS READ, the draft's "Read before matching", in order:
 *   1  every {TOKEN} (capital letters, digits and underscores in braces) is removed and the
 *      sentence read around the gap;
 *   2  the card is split into blocks on its blank lines, since an alternative or a step is a
 *      reply of its own, and one committing block makes the card a likely commitment;
 *   3  a block is split into sentences on a full stop, question mark or exclamation mark that is
 *      followed by a space or the end, and on every line end, so "3.5" and "15:00" stay whole;
 *      a question mark scopes to its own sentence;
 *   4  English has the curly apostrophe folded to the straight one; Polish is lower-cased with
 *      the diacritics kept, and a card typed with none at all is read once more against the word
 *      lists with theirs taken off (the draft's guess, and a cheap one);
 *   5  the first sentence that fires gives the rule, and the clause around the match, between
 *      commas and semicolons, gives the phrase.
 *
 * THE WORD LISTS ARE DATA, in WORDS below, so that a catalog's own nouns and verbs can be added
 * without touching a rule. Acts of the firm's, the things it hands over and the time words are
 * the lists the draft calls "likely, extend per catalog".
 *
 * THE THREE OPEN QUESTIONS are Maxim's, each behind its own named option, defaulted to the
 * copywriter's view (her report, 2026-10-04). Nothing else in the build decides them:
 *   alreadyDone         true   an act the firm reports as done counts (E11, P11);
 *   conditionalOnCheck  true   a promise on a fact still to be checked counts (E10, P10);
 *   reassurance         false  "we'll sort it out" and "we'll fix it", with no act named, are held back (EN10, PN10), unless the sentence
 *                              names a day, a date or a deadline, when the date is the promise and it flags (2026-10-06);
 *                              on, E1's and P1's form fires on it, as the draft says it would.
 *
 * WHAT IT CANNOT DO, said rather than implied: understand a sentence. A rule that needs the
 * meaning is a list here and will miss what the list lacks (the draft says so beside each),
 * and a catalog typed in some third register will want its own words. Held-back near misses are
 * the cautious side: a card the lead should tick by hand is missed rather than a card that is
 * not a commitment suggested, since a suggestion that is wrong is an accusation.
 */

export const OPTIONS = Object.freeze({
  alreadyDone: true,
  conditionalOnCheck: true,
  reassurance: false,
});

/* The word lists, as data. Spaces in an entry stand for any run of white space. */
export const WORDS = {
  en: {
    // The firm's acts, base form (E1, E2); the -ing form (E3); past and participle (E5, E11).
    act: ["refund", "credit", "reimburse", "pay back", "send", "dispatch", "ship", "post",
      "replace", "remake", "repair", "fix", "exchange", "swap", "cancel", "change", "add", "hold",
      "reserve", "extend", "waive", "cover", "discount", "issue", "book", "arrange", "collect",
      "deliver", "return", "reship", "reissue"],
    acting: ["refunding", "crediting", "reimbursing", "paying back", "sending", "dispatching",
      "shipping", "posting", "replacing", "remaking", "repairing", "fixing", "exchanging",
      "swapping", "cancelling", "canceling", "changing", "adding", "holding", "reserving",
      "extending", "waiving", "covering", "discounting", "issuing", "booking", "arranging",
      "collecting", "delivering", "returning", "calling back", "calling you back", "emailing"],
    done: ["refunded", "credited", "reimbursed", "paid back", "sent", "dispatched", "shipped",
      "posted", "replaced", "remade", "repaired", "fixed", "exchanged", "swapped", "cancelled",
      "canceled", "changed", "added", "held", "reserved", "extended", "waived", "covered",
      "discounted", "issued", "booked", "arranged", "collected", "delivered", "emailed", "returned",
      "reshipped", "reissued"],
    // The things the firm hands over (E4, E7); a catalog's own nouns belong here.
    things: ["refund", "parcel", "package", "order", "replacement", "code", "invoice", "link",
      "credit", "delivery", "payment", "money", "difference", "voucher", "receipt", "confirmation",
      "shipment", "amount", "lamp", "shade", "bulb", "item"],
    // Somebody else's act (EN7): a subject that is not the firm.
    others: ["courier", "carrier", "post office", "postal service", "bank", "manufacturer", "maker",
      "supplier", "shipper"],
    // A habit or a policy stated in general (EN3).
    habit: ["usually", "normally", "always", "generally", "typically", "as a rule", "as usual",
      "often", "tend to", "most of the time", "in general"],
    // A general subject with no "your" or "this" (EN3).
    general: ["orders", "returns", "customers", "refunds", "exchanges", "parcels", "deliveries",
      "items", "goods", "replacements", "packages", "payments"],
    // A possibility, a hedge (EN1, EN2, EN8).
    hedge: ["can", "could", "may", "might", "would", "should", "ought to", "try", "trying", "hope",
      "hoping", "aim", "aiming", "expect", "expecting", "probably", "perhaps", "maybe", "possibly",
      "able to", "cannot", "unable", "can't", "couldn't", "wouldn't", "shouldn't"],
    // A hedge that opens a complement in the clause before the promise (EN8).
    opens: ["hope", "hoping", "expect", "expecting", "think", "believe", "probably", "perhaps",
      "maybe", "possibly"],
    // A channel outside the chat, or a span: where one is named the agent's own steps are a promise (EN6, narrowed).
    outside: ["by email", "by e-mail", "by phone", "by text", "by sms", "by post", "daily", "every day",
      "as it goes"],
    // A negation: before a waiver, in the same clause, it says the charge is NOT waived (EN9's refusal, read as a waiver).
    negation: ["not", "isn't", "aren't", "never", "no longer", "cannot", "can't", "doesn't", "don't"],
    // A condition of courtesy, not a fact still to be checked (E10): the promise stands whatever the customer answers.
    // This is the builder's reading, listed for the copywriter.
    courtesy: ["that's all right", "that's alright", "that's ok", "that's okay", "that's fine", "that helps",
      "that suits", "that works", "it suits", "it helps", "you like", "you wish", "you want", "you'd like",
      "you need", "you were wondering", "you don't mind", "you agree", "you're happy", "you are happy",
      "you'd be happy"],
    // A charge waived or a burden lifted (E6).
    waived: ["costs nothing", "cost nothing", "nothing to pay", "won't be charged",
      "will not be charged", "no charge", "no extra charge", "no additional charge", "no cost",
      "no extra cost", "no fee", "free of charge", "at our cost", "at our expense",
      "is on us", "are on us"],
    // The reassurance with no act named (EN10), the forms that follow "we'll" or "I'll".
    reassure: ["sort it out", "sort this out", "sort that out", "sort things out",
      "sort everything out", "sort out", "sort it", "take care of it", "take care of this",
      "take care of that", "take care of everything", "put it right", "put this right",
      "put that right", "put things right", "put everything right", "look after it",
      "look after this", "look after that"],
    // The object of "fix" that makes it a reassurance and not an act (EN10, as "naprawimy to" is PN10): "We'll fix it." names
    // nothing the firm will do. Held back unless the reassurance option is on; "fix the shade" has a thing and is E1.
    fixObject: ["it", "this", "that", "everything", "things"],
    // Performatives (E8).
    promise: ["promise", "guarantee", "confirm"],
  },
  pl: {
    // First person, perfective, present form = the future (P1); the draft's list of acts with
    // both members of each aspect pair (the imperfective ones are in `acting`).
    acts1: ["zwrócę", "zwrócimy", "oddam", "oddamy", "wyślę", "wyślemy", "przyślę", "przyślemy",
      "nadam", "nadamy", "wymienię", "wymienimy", "naprawię", "naprawimy", "anuluję", "anulujemy",
      "zmienię", "zmienimy", "dopiszę", "dopiszemy", "wstrzymam", "wstrzymamy", "zarezerwuję",
      "zarezerwujemy", "odłożę", "odłożymy", "przedłużę", "przedłużymy", "pokryję", "pokryjemy",
      "zlecę", "zlecimy", "umówię", "umówimy", "odbiorę", "odbierzemy", "oddzwonię", "oddzwonimy",
      "przygotuję", "przygotujemy", "wystawię", "wystawimy", "dostarczę", "dostarczymy",
      "dotrzymam", "dotrzymamy", "wypłacę", "wypłacimy"],
    // First person, imperfective (P2), which is the future only with a time beside it.
    acting: ["wysyłam", "wysyłamy", "zwracam", "zwracamy", "oddaję", "oddajemy", "przysyłam",
      "przysyłamy", "nadaję", "nadajemy", "wymieniam", "wymieniamy", "naprawiam", "naprawiamy",
      "zmieniam", "zmieniamy", "dopisuję", "dopisujemy", "wstrzymuję", "wstrzymujemy",
      "rezerwuję", "rezerwujemy", "odkładam", "odkładamy", "przedłużam", "przedłużamy",
      "pokrywam", "pokrywamy", "zlecam", "zlecamy", "umawiam", "umawiamy", "odbieram", "odbieramy",
      "oddzwaniam", "oddzwaniamy", "przygotowuję", "przygotowujemy", "wystawiam", "wystawiamy",
      "dostarczam", "dostarczamy", "wypłacam", "wypłacamy"],
    // The stem of the passive participle, which takes -a, -e or -y (P5, P11).
    participle: ["zwrócon", "oddan", "wysłan", "przysłan", "nadan", "wymienion", "naprawion",
      "anulowan", "zmienion", "dopisan", "wstrzyman", "zarezerwowan", "odłożon", "przedłużon",
      "pokryt", "zlecon", "umówion", "odebran", "przygotowan", "wystawion", "dostarczon",
      "wypłacon"],
    // The impersonal past, -no and -to (P11).
    impersonal: ["zlecono", "zwrócono", "wysłano", "przesłano", "anulowano", "wymieniono",
      "naprawiono", "zmieniono", "dopisano", "wstrzymano", "zarezerwowano", "odłożono",
      "przedłużono", "pokryto", "umówiono", "przygotowano", "wystawiono", "odebrano", "oddano",
      "nadano", "dostarczono", "wypłacono"],
    // The stem of the past, before -liśmy, -łyśmy, -łem or -łam (P11).
    past: ["wysła", "zwróci", "przysła", "nada", "wymieni", "naprawi", "anulowa", "zmieni",
      "dopisa", "wstrzyma", "zarezerwowa", "odłoży", "przedłuży", "pokry", "zleci", "umówi",
      "odebra", "oddzwoni", "przygotowa", "wystawi", "odda", "dostarczy", "wypłaci"],
    // The thing as subject of a verb of arriving or returning (P4); nominative only.
    things: ["zwrot", "kwota", "pieniądze", "paczka", "przesyłka", "zamówienie", "kod", "faktura",
      "link", "wymiana", "lampa", "abażur", "towar", "różnica", "potwierdzenie", "wpłata"],
    // `dotrze` and `dotrą` are not here: arriving is the carrier's act (draft section 4 item 1, PN7).
    arriving: ["wróci", "wrócą", "przyjdzie", "przyjdą", "wyruszy", "wyruszą", "wyjdzie", "wyjdą",
      "trafi", "trafią", "pojawi się", "pojawią się"],
    // Somebody else's act (PN7).
    others: ["kurier", "kuriera", "kurierem", "bank", "banku", "poczta", "poczty", "przewoźnik",
      "przewoźnika", "producent", "producenta", "dostawca", "dostawcy"],
    habit: ["zwykle", "zazwyczaj", "na ogół", "z reguły", "standardowo", "zawsze", "przeważnie",
      "najczęściej", "często"],
    // A general object with no "this" (PN3), nominative and accusative plural.
    general: ["zamówienia", "zwroty", "przesyłki", "paczki", "reklamacje", "wymiany", "dostawy",
      "klienci"],
    // A negation: before a waiver, in the same clause, it says the charge is NOT waived (PN9's refusal, read as a waiver).
    negation: ["nie"],
    // A condition of courtesy, not a fact still to be checked (P10). The builder's reading, listed for the copywriter.
    courtesy: ["to pasuje", "pasuje", "to odpowiada", "to wygodne", "to nie kłopot", "to nie problem",
      "sobie życzy", "sobie życzą"],
    // A charge waived (P6).
    waived: ["nie ma dopłaty", "nie ma opłat", "nie ma dodatkowych kosztów",
      "nie ma dodatkowych opłat", "na nasz koszt", "na koszt sklepu", "na koszt firmy",
      "bez dopłaty", "bez opłat", "bez dodatkowych kosztów", "bez dodatkowych opłat",
      "bezpłatnie", "bezpłatny", "bezpłatna", "bezpłatne", "gratis", "nie pobierzemy",
      "nie pobiorę", "nie obciążymy", "nie obciążę", "nie policzymy", "nie policzę",
      "nie naliczymy", "nie naliczę"],
    // `nie trzeba` followed, within two words, by one of these (P6).
    unneeded: ["dopłacać", "płacić", "odsyłać", "zwracać", "odsyłać z powrotem"],
    // Performatives (P8).
    promise: ["obiecuję", "obiecujemy", "gwarantuję", "gwarantujemy", "daję słowo", "dajemy słowo",
      "potwierdzam", "potwierdzamy"],
    // The customer's choice (P9): after jeśli, or alone as "do wyboru".
    choice: ["woli", "wolą", "woleć", "wolicie", "preferuje", "preferują", "lepszy", "lepsza",
      "lepsze", "wygodniejszy", "wygodniejsza", "wygodniejsze", "lepiej"],
    // A hedge or a possibility (PN1, PN8).
    hedge: ["powinien", "powinna", "powinno", "powinny", "powinni", "postaramy się",
      "postaram się", "spróbujemy", "spróbuję", "mamy nadzieję", "mam nadzieję", "raczej",
      "chyba", "prawdopodobnie", "być może", "możliwe", "oczekujemy", "ewentualnie", "możemy",
      "mogę", "można", "da się", "gdyby", "byłoby"],
    // A hedge that opens a complement in the clause before the promise (PN8).
    opens: ["mamy nadzieję", "mam nadzieję", "oczekujemy", "prawdopodobnie", "być może", "chyba",
      "raczej", "postaramy się", "postaram się", "spróbujemy", "spróbuję"],
    // Reassurance with no act named (PN10): a verb that takes the object "to", "wszystko" or
    // "sprawa", and verbs that are the reassurance whole.
    reassureObject: ["to", "wszystko", "sprawa", "sprawę", "problem"],
    reassureForms: ["załatwię", "załatwimy", "rozwiążę", "rozwiążemy"],
    // A channel outside the chat, or a span: where one is named the agent's own steps are a promise (PN6, narrowed).
    outside: ["mailem", "e-mailem", "telefonicznie", "SMS-em", "na bieżąco", "codziennie"],
    // The agent's own steps inside the chat, which P3 keeps out (PN6) unless `outside` is named.
    steps: ["sprawdzać", "pytać", "zaglądać", "sprawdzić", "zapytać", "zajrzeć"],
  },
};

const NONE = Object.freeze({ likely: false, rule: null, kind: null, phrase: null });

const LB = String.raw`(?<![\p{L}\p{N}])`;
const RB = String.raw`(?![\p{L}\p{N}])`;
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const alt = (list) => list.map((w) => esc(w).replace(/ /g, String.raw`\s+`)).join("|");
const ASCII = { ą: "a", ć: "c", ę: "e", ł: "l", ń: "n", ó: "o", ś: "s", ź: "z", ż: "z",
  Ą: "A", Ć: "C", Ę: "E", Ł: "L", Ń: "N", Ó: "O", Ś: "S", Ź: "Z", Ż: "Z" };
const asciiFold = (s) => s.replace(/[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/g, (ch) => ASCII[ch]);
const DIACRITIC = /[ąćęłńóśźżĄĆĘŁŃÓŚŹŻ]/;
const TOKEN = /\{[A-Z][A-Z0-9_]*\}/g;
/* The curly single quotes and the modifier apostrophe, by code point so no one has to read them. */
const CURLY = new RegExp("[" + String.fromCharCode(0x2018, 0x2019, 0x2bc) + "]", "g");

/* ---------- reading a card ---------- */

function tidy(line) {
  return line.replace(/[ \t]{2,}/g, " ").replace(/[ \t]+([,.;:!?])/g, "$1")
    .replace(/,\s*([.!?])/g, "$1").replace(/^[\s,;:]+/, "").trim();
}

/* The sentences of a card, in order, each with its block. */
function sentencesOf(text, lang) {
  let t = String(text).replace(/\r\n?/g, "\n").replace(TOKEN, " ");
  if (lang === "en") t = t.replace(CURLY, "'");
  const out = [];
  t.split(/\n[ \t]*\n/).forEach((block, b) => {
    for (const line of block.split("\n")) {
      for (const part of tidy(line).split(/(?<=[.!?])\s+/)) {
        const s = part.trim();
        if (/\p{L}/u.test(s)) out.push({ s, block: b });
      }
    }
  });
  return out;
}

/* Clause boundaries inside a sentence: commas, semicolons and a colon followed by a space. */
function segmentsOf(s) {
  const segs = [];
  let start = 0;
  const re = /[,;]|:\s/g;
  let m;
  while ((m = re.exec(s))) {
    segs.push({ start, end: m.index });
    start = m.index + m[0].length;
  }
  segs.push({ start, end: s.length });
  return segs;
}

/* What the matcher reads of one sentence. `h` is the same length as `s`, so an offset in one is
   an offset in the other. */
function context(s, lang, fold, opts) {
  let h = s;
  if (lang === "pl") {
    const low = s.toLowerCase();
    h = low.length === s.length ? low : s;
    if (fold) h = asciiFold(h);
  }
  return { s, h, segs: segmentsOf(s), opts, lang };
}

function phraseOf(c, i, n) {
  const segs = c.segs;
  let seg = segs[0];
  for (const g of segs) if (i >= g.start && i < g.end + 1) seg = g;
  let p = c.s.slice(seg.start, seg.end).trim().replace(/[.!?]+$/, "");
  if (p.length > 60) {
    let cut = p.slice(0, 57);
    const sp = cut.lastIndexOf(" ");
    if (sp > 30) cut = cut.slice(0, sp);
    p = cut.replace(/[\s,;:.!?-]+$/, "") + "...";
  }
  return p;
}

/* A hedge in the matched clause (H.here), or one in the clause before it that opens a complement
   (H.before: "we hope that, ..." or "mamy nadzieję, że ..."). A modal in the clause before is
   another clause's business: "you can keep the old one, we'll refund the postage" stands. */
function hedged(c, i, H) {
  const segs = c.segs;
  let k = 0;
  for (let j = 0; j < segs.length; j++) if (i >= segs[j].start && i < segs[j].end + 1) k = j;
  return H.here.test(c.h.slice(segs[k].start, segs[k].end))
    || (k > 0 && H.before.test(c.h.slice(segs[k - 1].start, segs[k - 1].end)));
}

/* The clause of the sentence an offset sits in, as {start, end} (commas and semicolons bound it). */
function clauseBounds(c, i) {
  let k = c.segs[0];
  for (const g of c.segs) if (i >= g.start && i < g.end + 1) k = g;
  return k;
}

function globalMatches(re, h) {
  return [...h.matchAll(new RegExp(re.source, re.flags.includes("g") ? re.flags : re.flags + "g"))];
}

const hit = (m, n) => ({ i: m.index, n: n === undefined ? m[0].length : n });

/* ---------- English ---------- */

function english() {
  const W = WORDS.en;
  const ACT = String.raw`(?:${alt(W.act)}|call(?:\s+you)?\s+back|keep\s+(?:[\w'-]+\s+){0,3}aside`
    + String.raw`|get\s+(?!back\b)(?:[\w'-]+\s+){1,5}to\s+you|put\s+(?:[\w'-]+\s+){1,4}in\s+the\s+post)`;
  const ACT_ING = Symbol("ing");
  const ACT_EMAIL = String.raw`(?:${ACT}|email)`;
  const ING = String.raw`(?:${alt(W.acting)})`;
  const THINGS = alt(W.things);
  const TIME = new RegExp(String.raw`(?:${LB}now${RB}|${LB}today${RB}|${LB}tonight${RB}`
    + String.raw`|${LB}tomorrow${RB}|${LB}straight\s+away${RB}|${LB}right\s+away${RB}`
    + String.raw`|${LB}at\s+once${RB}|${LB}immediately${RB}|${LB}first\s+thing${RB}`
    + String.raw`|${LB}this\s+(?:morning|afternoon|evening|week)${RB}`
    + String.raw`|${LB}next\s+(?:week|month|working\s+day|business\s+day)${RB}`
    + String.raw`|${LB}later\s+today${RB}`
    + String.raw`|${LB}(?:on|by|until|before|from)\s+(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday|noon|midday|tonight|tomorrow|(?:the\s+)?end\s+of)${RB}`
    + String.raw`|${LB}within${RB}|${LB}in\s+the\s+next${RB}`
    + String.raw`|${LB}in\s+(?:a|an|one|two|three|four|five|six|seven|ten|\d+|a\s+few|a\s+couple\s+of)\s+(?:minute|hour|day|working\s+day|business\s+day|week)s?${RB})`, "iu");
  // A hedge, but "may" after a preposition is the month ("in May", "by May"), not the modal.
  const HEDGE = { here: new RegExp(LB + String.raw`(?<!(?:by|in|before|until|from|during|for|of|since)\s+)` + "(?:" + alt(W.hedge) + ")" + RB, "iu"),
    before: new RegExp(LB + "(?:" + alt(W.opens) + ")" + RB, "iu") };
  const HABIT = new RegExp(LB + "(?:" + alt(W.habit) + ")" + RB, "iu");
  const GENERAL = new RegExp("^(?:" + alt(W.general) + ")" + RB, "iu");
  const OWN = new RegExp(LB + "(?:your|this|that|these|those|my)" + RB, "iu");
  const OTHER = new RegExp(LB + "(?:" + alt(W.others) + ")" + RB, "iu");
  const REASSURE = new RegExp("^(?:" + alt(W.reassure) + ")" + RB, "iu");
  const FIX_VAGUE = new RegExp("^fix\\s+(?:" + alt(W.fixObject) + ")" + RB, "iu");
  /* A day, a date or a deadline in the sentence (Maxim 2026-10-06 19:10): what makes "We'll fix it by Friday." a promise the
     customer can hold the firm to, where "We'll fix it." is held back. Narrower than TIME on purpose: "now", "straight away",
     "immediately" and "at once" name no day, date or deadline, and "in a few minutes" is no deadline either. */
  const DAYS = "monday|tuesday|wednesday|thursday|friday|saturday|sunday";
  const MONTHS = "january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sept?|oct|nov|dec";
  const FULL_MONTHS = "january|february|march|april|may|june|july|august|september|october|november|december";
  const FIX_DATED = new RegExp(String.raw`(?:${LB}(?:${DAYS})${RB}|${LB}(?:today|tonight|tomorrow)${RB}|${LB}this\s+(?:morning|afternoon|evening|week|month)${RB}`
    + String.raw`|${LB}next\s+(?:week|month|working\s+day|business\s+day)${RB}`
    + String.raw`|${LB}(?:by|before|until|on|from)\s+(?:noon|midday|midnight|(?:the\s+)?(?:end|close)\s+of|the\s+\d{1,2}(?:st|nd|rd|th)|\d{1,2}[./]\d{1,2}${RB}|\d{1,2}(?::\d{2})?\s*(?:am|pm))`
    + String.raw`|${LB}\d{1,2}(?:st|nd|rd|th)?\s+(?:of\s+)?(?:${MONTHS})${RB}|${LB}(?:${MONTHS})\s+\d{1,2}${RB}`
    + String.raw`|${LB}within\s+(?:[\w-]+\s+){1,2}?(?:(?:working|business)\s+)?(?:hour|day|week|month)s?${RB}`
    + String.raw`|${LB}in\s+the\s+next\s+(?:[\w-]+\s+)?(?:hour|day|week|month|working\s+day|business\s+day)s?${RB}`
    + String.raw`|${LB}weekend${RB}|${LB}(?:by|in|before|until|from|during|for)\s+(?:${FULL_MONTHS})${RB}`
    + String.raw`|${LB}in\s+(?:a|an|one|two|three|four|five|six|seven|ten|\d+|a\s+few|a\s+couple\s+of)\s+(?:hour|day|working\s+day|business\s+day|week|month)s?${RB})`, "iu");
  const ADVERBS = /^(?:(?:also|just|now|then|gladly|happily|definitely|certainly|immediately|promptly|personally|both|still|first)\s+)+/i;
  const SPLIT = /\s*(?:,|;|\band\b|\bthen\b|\bbut\b)\s*/i;
  /* EN6, narrowed (draft section 4 item 2): "get back to you" is the agent's own step inside the chat, and is held back,
     unless the sentence names a channel outside the chat or a span, when it is a promise to keep the customer informed. */
  const OUTSIDE = new RegExp(LB + "(?:" + alt(W.outside) + ")" + RB, "iu");
  const GETBACK = /^get\s+back\s+to\s+you/i;

  /* After a lead such as "we'll", the first words of each of the next few segments must open
     on an act. Reading the segment's own first word is what keeps "I'll check with the
     warehouse and come back to you" (EN6) and "we'll try to get it out" (EN8) out, with no list
     of what they are: neither opens on an act. */
  function afterLead(c, lead, acts, needTime) {
    for (const m of globalMatches(lead, c.h)) {
      const from = m.index + m[0].length;
      const tail = c.h.slice(from).split(SPLIT).slice(0, 4);
      let off = from;
      for (const raw of tail) {
        const seg = raw.replace(ADVERBS, "");
        const withTime = TIME.test(c.h);
        const act = new RegExp("^(?:" + (acts === ACT_ING ? ING : (withTime ? ACT_EMAIL : ACT)) + ")" + RB, "iu");
        let ok = act.test(seg);
        if (!ok && acts !== ACT_ING && GETBACK.test(seg) && OUTSIDE.test(c.h)) ok = true;
        // A reassurance with a day, a date or a deadline in the sentence is a commitment, as "fix it" is (Claude α 2026-10-06, on Maxim's delegation of 19:10).
        if (!ok && acts !== ACT_ING && (c.opts.reassurance || FIX_DATED.test(c.h))) ok = REASSURE.test(seg);
        // "We'll fix it." is a reassurance with no act named (10h): held back by default, as "Naprawimy to." is.
        // With a day, a date or a deadline in the sentence it is the date that is promised, and it flags (Maxim 2026-10-06 19:10).
        if (ok && acts !== ACT_ING && !c.opts.reassurance && FIX_VAGUE.test(seg) && !FIX_DATED.test(c.h)) ok = false;
        if (needTime && !withTime) ok = false;
        if (ok && !hedged(c, m.index, HEDGE)) return hit(m, off + raw.length - m.index);
        off += raw.length + 1;
      }
    }
    return null;
  }
  const LEAD_WILL = new RegExp(LB + String.raw`(?:we|i)(?:'ll|\s+will)\s+`, "iu");
  const LEAD_GOING = new RegExp(LB + String.raw`(?:we|i)(?:'m|'re|\s+am|\s+are)\s+going\s+to\s+`, "iu");
  const LEAD_ING = new RegExp(LB + String.raw`(?:we|i)(?:'m|'re|\s+am|\s+are)\s+`, "iu");

  const E5 = new RegExp(LB + String.raw`will\s+be\s+(?:(?:also|then|now)\s+)?(?:${alt(W.done)})${RB}`, "iu");
  const SUBJ = String.raw`(?:the|your|our|a|an|this|that|my|these)\s+(?:[\w'-]+\s+){0,3}?(?:${THINGS})s?`;
  const VERB = String.raw`(?:will\s+(?!not\b|be\s)[a-z]+|arrives?|goes\s+(?:out|back|off|by|to|through|straight(?!\s+(?:in|into|on|onto)\b))|ships|leaves|reaches|comes|lands|is\s+(?:sent|dispatched|shipped|posted|credited|refunded)|gets\s+(?:sent|to\s+you))`;
  const E4 = new RegExp(LB + SUBJ + String.raw`(?:\s+[\w'-]+){0,8}?\s+${VERB}${RB}`, "iu");
  const E7 = new RegExp(LB + String.raw`you(?:'ll|\s+will)\s+(?:(?:also|then|both)\s+)?(?:get|receive|have)(?:\s+[\w'-]+){0,8}?\s+(?:${THINGS})s?${RB}`, "iu");
  const E6 = new RegExp(LB + "(?:" + alt(W.waived) + String.raw`|no\s+need\s+to\s+(?:send|return|post|ship|pay|bring|take)|(?<=\p{L})'s\s+on\s+us)` + RB, "iu");
  const E8 = [
    new RegExp(LB + String.raw`(?:we|i)\s+(?:both\s+)?(?:promise|guarantee)` + RB, "iu"),
    new RegExp(LB + String.raw`(?:my|our)\s+word` + RB, "iu"),
    new RegExp(LB + String.raw`(?:we|i)\s+(?:can\s+)?confirm` + RB, "iu"),
  ];
  const DONE = alt(W.done);
  /* E11, by the firm: "we" or "I", a passive with no agent, or "our <team>" as the subject. A third party as subject
     ("the courier has collected it"), the customer ("you have sent a photo") and a hedge are not the firm's done act. */
  const NEGATION = new RegExp(LB + "(?:" + alt(W.negation) + ")" + RB, "iu");
  const COURTESY = new RegExp(LB + "(?:" + alt(W.courtesy) + ")" + RB, "iu");
  const NEGATIVE_WAIVER = new RegExp(LB + String.raw`(?:no|not|nothing|won't|will\s+not)` + RB + "|n't", "iu");
  const E11 = [
    new RegExp(LB + String.raw`(?:i've|we've|(?:i|we)\s+have)\s+(?:(?:already|now|just|also|both)\s+)?(?:${DONE})${RB}`, "iu"),
    new RegExp(LB + String.raw`(?:i|we)\s+(?:(?:already|just|also|both)\s+)?(?:${DONE})${RB}`, "iu"),
    new RegExp(LB + String.raw`(?:(?:has|have)\s+(?:(?:now|already)\s+)?been|was|were)\s+(?:${DONE})${RB}`, "iu"),
    new RegExp(LB + String.raw`our\s+[\w'-]+\s+(?:has|have)\s+(?:(?:now|already)\s+)?(?:${DONE})${RB}`, "iu"),
  ];
  const COND_CHOICE = new RegExp(LB + String.raw`(?:if\s+you(?:'d|\s+would)?\s+(?:rather|prefer)|if\s+you'd\s+prefer|whichever\s+(?:one\s+)?you(?:'d)?\s+(?:choose|prefer|pick))` + RB, "iu");
  const COND_FACT = new RegExp(LB + String.raw`(?:if|unless|in\s+case|provided(?:\s+that)?|assuming|as\s+long\s+as)` + RB, "iu");
  const QUESTION_OPEN = /^(?:shall|should|would|could|can|do|does|did|is|are|will|may|might|have|has)\s+(?:i|we|you|it|the|your)\b/i;

  const first = (re, c) => { const m = re.exec(c.h); return m ? hit(m) : null; };

  const tests = {
    E8: (c) => {
      for (const re of E8) { const m = re.exec(c.h); if (m) return hit(m); }
      return null;
    },
    E1: (c) => afterLead(c, LEAD_WILL, ACT),
    E2: (c) => afterLead(c, LEAD_GOING, ACT),
    E3: (c) => afterLead(c, LEAD_ING, ACT_ING, true),
    E5: (c) => { const m = E5.exec(c.h); return m && !hedged(c, m.index, HEDGE) ? hit(m) : null; },
    E4: (c) => {
      const m = E4.exec(c.h);
      if (!m || !TIME.test(c.h) || hedged(c, m.index, HEDGE)) return null;
      if (OTHER.test(c.h.slice(0, m.index + m[0].length))) return null;
      return hit(m);
    },
    E7: (c) => { const m = E7.exec(c.h); return m && !hedged(c, m.index, HEDGE) ? hit(m) : null; },
    E6: (c) => {
      const m = E6.exec(c.h);
      if (!m || hedged(c, m.index, HEDGE)) return null;
      // "The return is not free of charge": a negation in the clause, ahead of a phrase that carries none, refuses.
      if (!NEGATIVE_WAIVER.test(m[0]) && NEGATION.test(c.h.slice(clauseBounds(c, m.index).start, m.index))) return null;
      return hit(m);
    },
  };
  const core = [["E8", "wording"], ["E1", "later"], ["E2", "later"], ["E3", "later"],
    ["E5", "later"], ["E4", "dated"], ["E7", "dated"], ["E6", "waived"]];

  return {
    core, tests,
    question: (c) => /\?[\s"')\]]*$/.test(c.s) || QUESTION_OPEN.test(c.s),
    // EN3: a habit stated in general, or a general subject with no "your" or "this".
    general: (c) => HABIT.test(c.h) || (GENERAL.test(c.h) && !OWN.test(c.h)),
    choice: (c) => COND_CHOICE.test(c.h),
    // E10: a condition that is a fact still to be checked. One of courtesy ("if that's all right") is not.
    fact: (c) => globalMatches(COND_FACT, c.h).some((m) => !COURTESY.test(c.h.slice(m.index).split(/[,;]/)[0])),
    choiceRule: ["E9", "condition"], factRule: ["E10", "condition"],
    standalone: null,
    done: (c) => {
      for (const re of E11) {
        for (const m of globalMatches(re, c.h)) {
          if (hedged(c, m.index, HEDGE)) continue;
          const k = clauseBounds(c, m.index);
          if (OTHER.test(c.h.slice(k.start, k.end))) continue;
          if (/^(?:was|were)\b/i.test(m[0]) && (/\bwhere\b/i.test(c.h.slice(k.start, m.index)) || /\bheld\s+for\s+[a-z]+ing\b/i.test(c.h.slice(m.index)))) continue; /* plant:commit-e11-where */
          return hit(m);
        }
      }
      return null;
    },
    doneRule: ["E11", "done"],
  };
}

/* ---------- Polish ---------- */

function polish(fold) {
  const F = fold ? asciiFold : (x) => x;
  const W = WORDS.pl;
  const R = (src) => new RegExp(F(src), "iu");
  const WA = (list) => R(LB + "(?:" + alt(list) + ")" + RB);
  const NEG = new RegExp(F(String.raw`(?:^|[^\p{L}])(?:nie|nigdy)\s+$`), "iu");
  const PART = String.raw`(?:${alt(W.participle)})[aey]`;

  const PERF1 = WA(W.acts1);
  const IMPERF1 = WA(W.acting);
  const TIME = R(LB + String.raw`(?:dziś|dzisiaj|jutro|pojutrze|teraz|od\s+razu|natychmiast|(?:w|we)\s+(?:poniedziałek|wtorek|środę|czwartek|piątek|sobotę|niedzielę)|do\s+(?:poniedziałku|wtorku|środy|czwartku|piątku|soboty|niedzieli)|w\s+przyszłym\s+tygodniu)` + RB);
  const HEDGE = {
    here: R(LB + "(?:" + alt(W.hedge) + ")" + RB
      + String.raw`|${LB}\p{L}+(?:łby|łaby|łoby|liby|łyby|łbym|łabym|libyśmy|łybyśmy)${RB}`),
    before: WA(W.opens),
  };
  const HABIT = WA(W.habit);
  const GENERAL = R("^(?:" + alt(W.general) + ")" + RB);
  const DEMONSTRATIVE = R(LB + String.raw`(?:to|ta|tę|ten|tej|tego|twoje|twój|twoja|państwa)` + RB);
  const OTHER = WA(W.others);
  const STEPS = WA(W.steps);
  const OUTSIDE = WA(W.outside);

  const P3 = R(LB + String.raw`będ(?:ę|ziemy)(?:\s+[\p{L}-]+){0,3}?\s+([\p{L}]+[aiyeuó]ć)` + RB);
  const P5 = R(LB + String.raw`zostan(?:ie|ą)\s+(?:(?:też|już|także|wtedy)\s+)?${PART}` + RB);
  const SUBJ = R(LB + "(?:" + alt(W.things) + ")" + RB);
  const P6A = WA(W.waived);
  const P6B = R(LB + String.raw`nie\s+trzeba\s+(?:(?!(?:ani|albo|lub|i)\b)[\p{L}-]+\s+){0,2}?(?:${alt(W.unneeded)})` + RB);
  const P7 = [
    R(LB + String.raw`(?:otrzyma|otrzymają|dostanie|dostaną)\s+(?:pan|pani|państwo)` + RB),
    R(LB + String.raw`(?:pan|pani|państwo)\s+(?:otrzyma|otrzymają|dostanie|dostaną)` + RB),
  ];
  const P8 = WA(W.promise);
  const THING_ANY = WA(W.things);
  const P11 = [
    WA(W.impersonal),
    R(LB + String.raw`został(?:o|a|y)\s+(?:już\s+)?${PART}` + RB),
    R(LB + "(?:" + alt(W.past) + String.raw`)(?:liśmy|łyśmy|łem|łam)` + RB),
  ];
  const P9CHOICE = WA(W.choice);
  const P9IF = WA(["jeśli", "jeżeli"]);
  const P9ALONE = R(LB + String.raw`(?:(?:jest|są|będzie|będą|zostaje|zostają|mamy|macie|oferujemy|dajemy|pozostaje|pozostają)\s+do\s+wyboru|do\s+wyboru(?:\s+(?:jest|są|będzie|będą|zostaje|zostają|mamy|macie|oferujemy|dajemy|pozostaje|pozostają)\b|:|[^,;]*\b(?:albo|lub)\b))` + RB); /* plant:commit-p9-offer */
  const P10IF = WA(["jeśli", "jeżeli", "o ile", "pod warunkiem"]);
  const NEGATION = WA(W.negation);
  const COURTESY = WA(W.courtesy);
  const NEGATIVE_WAIVER = R(LB + "(?:nie|bez)" + RB);
  const REASSURE_OBJ = WA(W.reassureObject);
  const REASSURE_PLAIN = WA(W.reassureForms);
  const REASSURE_SIE = R(LB + "(?:zajmiemy|zajmę)" + RB);
  const SIE = R(LB + "się" + RB);
  const NAPRAW = R(LB + "(?:naprawię|naprawimy)" + RB);
  /* A day, a date or a deadline in the sentence (Maxim 2026-10-06 19:10), as English's FIX_DATED: "od razu", "natychmiast" and
     "teraz" name none. */
  const PL_DAYS = "poniedziałek|poniedziałku|wtorek|wtorku|środę|środy|czwartek|czwartku|piątek|piątku|sobotę|soboty|niedzielę|niedzieli";
  const PL_MONTHS = "stycznia|lutego|marca|kwietnia|maja|czerwca|lipca|sierpnia|września|października|listopada|grudnia";
  const PL_MONTHS_ANY = "styczeń|stycznia|styczniu|luty|lutego|lutym|marzec|marca|marcu|kwiecień|kwietnia|kwietniu|maj|maja|maju|czerwiec|czerwca|czerwcu|lipiec|lipca|lipcu|sierpień|sierpnia|sierpniu|wrzesień|września|wrześniu|październik|października|październiku|listopad|listopada|listopadzie|grudzień|grudnia|grudniu";
  const FIX_DATED = R(String.raw`(?:${LB}(?:dziś|dzisiaj|jutro|jutra|pojutrze|${PL_DAYS})${RB}`
    + String.raw`|${LB}(?:w|na)\s+(?:tym|przyszłym|następnym)\s+(?:tygodniu|miesiącu)${RB}|${LB}na\s+(?:przyszły|następny)\s+tydzień${RB}`
    + String.raw`|${LB}do\s+(?:końca\s+(?:dnia|tygodnia|miesiąca|roku)|rana|południa|wieczora|północy)${RB}`
    + String.raw`|${LB}weekend(?:u|zie|em)?${RB}|${LB}(?:do|w|we|na|przed)\s+(?:${PL_MONTHS_ANY})${RB}`
    + String.raw`|${LB}(?:do|na|przed)\s+\d{1,2}[./]\d{1,2}${RB}|${LB}do\s+(?:godz(?:iny|\.)?\s*)?\d{1,2}:\d{2}${RB}`
    + String.raw`|${LB}\d{1,2}\s+(?:${PL_MONTHS})${RB}`
    + String.raw`|${LB}w\s+ciągu\s+(?:[\p{L}\d-]+\s+){0,2}?(?:dni|dnia|dzień|doby|godzin\p{L}*|tygodni\p{L}*|miesi\p{L}+)${RB}`
    + String.raw`|${LB}za\s+(?:\d+|jeden|jedną|dwa|dwie|trzy|cztery|pięć|kilka|parę)\s+(?:dni|dzień|godzin\p{L}*|tygodn\p{L}*|miesi\p{L}+)${RB})`);

  const negated = (c, i) => NEG.test(c.h.slice(0, i));
  const clauseText = (c, i) => {
    for (const g of c.segs) if (i >= g.start && i < g.end + 1) return c.h.slice(g.start, g.end);
    return c.h;
  };

  const tests = {
    P8: (c) => {
      for (const m of globalMatches(P8, c.h)) if (!negated(c, m.index) && !hedged(c, m.index, HEDGE)) return hit(m);
      return null;
    },
    P1: (c) => {
      for (const m of globalMatches(PERF1, c.h)) {
        if (negated(c, m.index) || hedged(c, m.index, HEDGE)) continue;
        // PN10: "wszystko naprawimy" names no act; it is held back unless the option is on.
        // With a day, a date or a deadline in the sentence it is the date that is promised, and it flags (Maxim 2026-10-06 19:10).
        if (NAPRAW.test(m[0]) && REASSURE_OBJ.test(clauseText(c, m.index)) && !c.opts.reassurance && !FIX_DATED.test(c.h)) continue;
        return hit(m);
      }
      if (c.opts.reassurance || FIX_DATED.test(c.h)) {
        for (const m of globalMatches(REASSURE_PLAIN, c.h)) {
          if (!negated(c, m.index) && !hedged(c, m.index, HEDGE)) return hit(m);
        }
        for (const m of globalMatches(REASSURE_SIE, c.h)) {
          if (SIE.test(clauseText(c, m.index)) && !negated(c, m.index) && !hedged(c, m.index, HEDGE)) return hit(m);
        }
      }
      return null;
    },
    P2: (c) => {
      if (!TIME.test(c.h)) return null;
      for (const m of globalMatches(IMPERF1, c.h)) {
        if (!negated(c, m.index) && !hedged(c, m.index, HEDGE)) return hit(m);
      }
      return null;
    },
    P3: (c) => {
      for (const m of globalMatches(P3, c.h)) {
        if (negated(c, m.index) || hedged(c, m.index, HEDGE)) continue;
        if (STEPS.test(m[1]) && !OUTSIDE.test(c.h)) continue;
        return hit(m);
      }
      return null;
    },
    P5: (c) => {
      for (const m of globalMatches(P5, c.h)) if (!negated(c, m.index) && !hedged(c, m.index, HEDGE)) return hit(m);
      return null;
    },
    P4: (c) => {
      // The thing, then within five words a verb of arriving or returning, with no "nie" before it.
      for (const s of globalMatches(SUBJ, c.h)) {
        const rest = c.h.slice(s.index + s[0].length);
        const m = new RegExp("^(?:\\s+[\\p{L}-]+){0,5}?\\s+(" + F("(?:" + alt(W.arriving) + ")") + ")" + RB, "iu").exec(rest);
        if (!m) continue;
        const at = s.index + s[0].length + m.index + m[0].length - m[1].length;
        const between = c.h.slice(s.index, at);
        if (NEG.test(between) || hedged(c, s.index, HEDGE) || OTHER.test(c.h.slice(0, at))) continue;
        return { i: s.index, n: at + m[1].length - s.index };
      }
      return null;
    },
    P7: (c) => {
      if (!THING_ANY.test(c.h)) return null;
      for (const re of P7) { const m = re.exec(c.h); if (m && !hedged(c, m.index, HEDGE)) return hit(m); }
      return null;
    },
    P6: (c) => {
      for (const re of [P6A, P6B]) {
        const m = re.exec(c.h);
        if (!m || hedged(c, m.index, HEDGE)) continue;
        // "Przesyłka zwrotna nie jest bezpłatna": a "nie" in the clause, ahead of a phrase that carries none, refuses.
        if (!NEGATIVE_WAIVER.test(m[0]) && NEGATION.test(c.h.slice(clauseBounds(c, m.index).start, m.index))) continue;
        return hit(m);
      }
      return null;
    },
  };
  const core = [["P8", "wording"], ["P1", "later"], ["P2", "later"], ["P3", "later"],
    ["P5", "later"], ["P4", "dated"], ["P7", "dated"], ["P6", "waived"]];

  return {
    core, tests,
    question: (c) => /\?[\s"')\]]*$/.test(c.s) || /^czy(?![\p{L}\p{N}])/iu.test(c.s),
    // PN3: a habit stated in general, or a general object with no "this".
    general: (c) => HABIT.test(c.h) || (GENERAL.test(c.h) && !DEMONSTRATIVE.test(c.h)),
    choice: (c) => (P9IF.test(c.h) && P9CHOICE.test(c.h)) || P9ALONE.test(c.h),
    standalone: (c) => { const m = P9ALONE.exec(c.h); return m ? hit(m) : null; },
    // P10: a condition that is a fact still to be checked. One of courtesy ("jeśli to pasuje") is not.
    fact: (c) => globalMatches(P10IF, c.h).some((m) => !COURTESY.test(c.h.slice(m.index).split(/[,;]/)[0])),
    choiceRule: ["P9", "condition"], factRule: ["P10", "condition"],
    done: (c) => {
      for (const re of P11) {
        const m = re.exec(c.h);
        if (!m || negated(c, m.index) || hedged(c, m.index, HEDGE)) continue;
        const k = clauseBounds(c, m.index);
        if (OTHER.test(c.h.slice(k.start, k.end))) continue;
        return hit(m);
      }
      return null;
    },
    doneRule: ["P11", "done"],
  };
}

const SETS = { en: english(), pl: polish(false), plAscii: polish(true) };

/* ---------- the driver ---------- */

function firstCore(set, c) {
  for (const [rule, kind] of set.core) {
    const m = set.tests[rule](c);
    if (m) return { rule, kind, m };
  }
  return null;
}

export function likelyCommitment(text, lang, options) {
  const L = String(lang || "").toLowerCase().slice(0, 2);
  if ((L !== "en" && L !== "pl") || typeof text !== "string") return NONE;
  const opts = { ...OPTIONS, ...(options || {}) };
  const fold = L === "pl" && !DIACRITIC.test(text);
  const set = L === "en" ? SETS.en : (fold ? SETS.plAscii : SETS.pl);

  for (const { s } of sentencesOf(text, L)) {
    const c = context(s, L, fold, opts);
    if (set.question(c)) continue;
    if (set.general(c)) continue;

    let found = null;
    const inner = firstCore(set, c);
    if (set.choice(c)) {
      // E9, P9: the firm binds itself to honour the customer's choice.
      const alone = set.standalone && set.standalone(c);
      if (alone) found = { rule: set.choiceRule[0], kind: set.choiceRule[1], m: alone };
      else if (inner) found = { rule: set.choiceRule[0], kind: set.choiceRule[1], m: inner.m };
    } else if (set.fact(c) && inner) {
      // E10, P10: a promise on a fact still to be checked, which Maxim rules on. Off, the whole
      // sentence is held back, or its main clause would fire as an ordinary promise.
      if (!opts.conditionalOnCheck) continue;
      found = { rule: set.factRule[0], kind: set.factRule[1], m: inner.m };
    }
    if (!found && inner) found = inner;
    if (!found && opts.alreadyDone) {
      const m = set.done(c);
      if (m) found = { rule: set.doneRule[0], kind: set.doneRule[1], m };
    }
    if (found) {
      return { likely: true, rule: found.rule, kind: found.kind,
        phrase: phraseOf(c, found.m.i, found.m.n) };
    }
  }
  return NONE;
}
