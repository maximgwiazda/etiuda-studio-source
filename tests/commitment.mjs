/* THE LIKELY-COMMITMENT DETECTOR FINDS WHAT THE COPYWRITER'S GRAMMAR SAYS, AND ONLY THAT.
 *
 *     node tests/commitment.mjs
 *
 * The oracle is the grammar as written, state/drafts/copy-chains-lint-2026-10-04.md section 2:
 * every invented example in its tables is a leg. A commitment example must flag under its own
 * rule (E1 to E11, P1 to P11) and in its own kind, and a near-miss example (EN1 to EN11, PN1 to
 * PN11) must not flag at all. The examples are the draft's own and invented, none from a
 * catalog; the few legs that are this file's own say so in their line.
 *
 *   cd1  English commitments, one leg per example, rule and kind
 *   cd2  English near misses, none flags
 *   cd3  Polish commitments, as cd1
 *   cd4  Polish near misses, as cd2
 *   cd5  control: a card of plain information flags nothing, in both languages
 *   cd6  the reading steps: tokens removed, blocks, a question scoped to its own sentence, the
 *        apostrophe folded, Polish case and diacritics, and the phrase's length and cut
 *   cd7  the three open questions, each behind its own option: the defaults, each flipped, and
 *        the options moving nothing else
 *   cd8  the word lists are wired: every entry of each list reaches a rule, so a list that
 *        stopped being read would turn this red rather than quietly shrink the detector
 *   cd12 a dated "fix it" and every other held-back reassurance is a commitment in both languages; the undated and hedged forms stay held back
 *   cd9  the shape of an answer, a language it does not know, and input that is not text
 *
 * WHAT IT CANNOT SEE, said rather than implied: whether a card is in fact a commitment, which
 * needs the sentence understood and is the lead's tick; how the rules fare on a catalog's own
 * register, which wants a fixture of that catalog's; and any of the screen, which does not exist
 * yet. A rule the draft marks "guess" is held to the draft's verdict and nothing more.
 *
 * PROVED BY MAKING IT FAIL: COMMITMENT_SRC=<a module> reads that module instead. A module that
 * flags nothing reddens every commitment leg (cd1, cd3, cd6, cd7, cd8) and none of the near-miss
 * legs; the planted faults, one per leg, are in the report.
 *
 * Node only, no window, no Electron. Exit 0 when every check holds, 1 when any fails.
 */
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const SRC = process.env.COMMITMENT_SRC
  ? path.resolve(process.env.COMMITMENT_SRC) : path.join(ROOT, "src", "commitment.mjs");
const { likelyCommitment: detect, OPTIONS, WORDS } = await import(pathToFileURL(SRC).href);

const EXPECTED = 251;
let asserted = 0, failed = 0;
function check(cond, line) {
  asserted++;
  if (cond) process.stdout.write("  ok   " + line + "\n");
  else { failed++; process.stdout.write("  FAIL " + line + "\n"); }
}
const J = (x) => JSON.stringify(x);

const KIND = {
  E1: "later", E2: "later", E3: "later", E5: "later", E4: "dated", E7: "dated", E6: "waived",
  E8: "wording", E9: "condition", E10: "condition", E11: "done",
  P1: "later", P2: "later", P3: "later", P5: "later", P4: "dated", P7: "dated", P6: "waived",
  P8: "wording", P9: "condition", P10: "condition", P11: "done",
};

/* ---------- the draft's examples ---------- */

const EN_COMMIT = [
  ["E1", "We'll send a new shade out tomorrow, {PAX}."],
  ["E1", "I'll refund the postage today."],
  ["E1", "We'll send the new lamp off on Friday."], // the draft's "where the two languages part", as settled in its section 4
  // This file's own, from section 4's narrowing of EN6: a channel outside the chat makes "get back to you" a promise.
  ["E1", "I'll check with the warehouse and get back to you by email this afternoon."],
  ["E2", "We're going to cover the return label."],
  ["E3", "I'm cancelling the second order now."],
  ["E3", "We're sending the replacement on Monday."],
  ["E4", "The refund will reach your card within five working days."],
  ["E4", "Your new code arrives by email in the next hour."],
  ["E4", "Your parcel goes out from the warehouse first thing tomorrow."],
  ["E5", "The difference will be refunded today."],
  ["E5", "Your order will be held until Friday."],
  ["E6", "The swap costs nothing."],
  ["E6", "Keep the old one, there's no need to post it back."],
  ["E6", "You won't be charged for the second delivery."],
  ["E6", "The postage is on us."],
  // This file's own, with the read's "for later" item 1: a waiver stands, and a negation in another clause does not undo it.
  ["E6", "The return is free of charge."],
  ["E6", "The return is not tracked, but the swap is free of charge."],
  ["E7", "You'll get the tracking link by email this evening."],
  ["E7", "You'll have the full amount back by Friday."],
  ["E8", "You have my word it goes out today."],
  ["E8", "We guarantee the colour match."],
  ["E8", "I can confirm your booking for 3 pm."],
  ["E9", "If you'd rather have the money than wait, say the word and the refund goes out this afternoon."],
  ["E10", "If the bulb holder turns out faulty, we'll replace the whole lamp."],
  ["E11", "I've refunded the full amount."],
  ["E11", "Your order has been cancelled."],
  ["E11", "We sent the new invoice this morning."],
  ["E11", "Our warehouse has dispatched the new lamp."], // this file's own: the firm as a third-person subject
  // This file's own, with the read's "for later" item 3: a condition of courtesy leaves a plain promise plain (E1, not E10).
  ["E1", "We'll refund the postage today if that's all right."],
  ["E1", "We'll send the new shade tomorrow, in case you were wondering."],
];

const EN_NEAR = [
  ["EN1", "We can send a new one tomorrow if that helps."],
  ["EN1", "It may be possible to swap the colour."],
  ["EN2", "That would normally take a week."],
  ["EN2", "We could look at a partial refund."],
  ["EN2", "I'd be glad to refund it."], // the draft's own aside under EN2
  ["EN3", "We usually dispatch within two working days."],
  ["EN3", "Returns are accepted within 30 days."],
  ["EN3", "Orders over a set amount ship free."],
  ["EN4", "Shall I send a new one, or would you prefer the money back?"],
  ["EN4", "Would Friday suit you?"],
  ["EN5", "Could you send a photo of the label?"],
  ["EN5", "Please keep the box for now."],
  ["EN6", "I'll check with the warehouse and come back to you in a few minutes."],
  ["EN6", "I'll check with the warehouse and get back to you in a few minutes."], // section 4: no channel, no span
  ["EN6", "Let me look into this."],
  ["EN6", "One moment while I find the order."],
  ["EN7", "The courier usually comes before noon."],
  ["EN7", "The post office runs slower before the holidays."],
  ["EN8", "We'll try to get it out today."],
  ["EN8", "It should arrive by Friday."],
  ["EN9", "We can't exchange an engraved piece."],
  ["EN9", "We won't send it until the payment clears."],
  ["EN10", "We'll sort it out."],
  ["EN10", "Leave it with me, we'll put it right."],
  ["EN10", "We'll fix it."], // this file's own, Maxim's 10h: held back in both languages, as "Naprawimy to." is
  ["EN11", "What a shame the shade didn't survive the trip."],
  ["EN11", "Thank you for all the detail."],
];

/* This file's own, each a promise's form that a guard has to take back: a question that carries one,
   a promise negated, and a clause that is a hope. Labelled "own" because the draft has no such
   example; they are what a near-miss table made of sentences with no promise in them would not
   see. */
const EN_NEAR_OWN = [
  ["own", "We'll send a new one tomorrow, shall we?"],
  ["own", "Will the refund reach your card within five working days?"],
  ["own", "The refund will not reach your card within five working days."],
  ["own", "We will not refund the postage today."],
  ["own", "We hope that, the refund will reach your card by Friday."],
  // The read's "for later" items 1 and 2, with the draft's own wording: a refusal is not a waiver, and a done act counts
  // only where the firm did it and says so without a hedge.
  ["own", "Unfortunately the return is not free of charge."],
  ["own", "Your order might have been cancelled."],
  ["own", "We may have sent it twice."],
  ["own", "The courier has collected the parcel."],
  ["own", "Your order has been collected by the courier."],
  ["own", "You have sent a photo of the label."],
];

const PL_COMMIT = [
  ["P1", "Jutro wyślemy nowy abażur, {PAX}."],
  ["P1", "Koszt przesyłki zwrócę jeszcze dziś."],
  ["P1", "Drugie zamówienie anuluję od razu."],
  ["P2", "Wysyłamy jutro rano."],
  ["P2", "Zwrot zlecam teraz."],
  ["P3", "Będziemy na bieżąco dawać znać mailem."],
  ["P3", "Będziemy na bieżąco sprawdzać status zamówienia."], // section 4: a span keeps P3 firing on a step verb
  ["P4", "Zwrot wróci na kartę w ciągu pięciu dni roboczych."],
  ["P4", "Nowy kod przyjdzie mailem w ciągu godziny."],
  ["P4", "Paczka wyruszy z magazynu jutro rano."],
  ["P4", "Nowa lampa wyruszy w piątek."], // the draft's "where the two languages part", as settled in its section 4
  ["P5", "Różnica zostanie zwrócona dziś."],
  ["P5", "Zamówienie zostanie wstrzymane do piątku."],
  ["P6", "Za wymianę nie ma dopłaty."],
  ["P6", "Starej sztuki nie trzeba odsyłać."],
  ["P6", "Przesyłka zwrotna jest na koszt sklepu."],
  ["P6", "Nie pobierzemy opłaty za drugą dostawę."],
  ["P6", "Przesyłka zwrotna jest bezpłatna."], // this file's own, the twin of the refusal below
  ["P1", "Wyślemy nową lampę jutro, jeśli to pasuje."], // this file's own: a condition of courtesy leaves P1 plain, not P10
  ["P7", "Zwrot otrzyma Pani do piątku."],
  ["P7", "Link dostanie Pan jeszcze dziś."],
  ["P8", "Daję słowo, że paczka wyjdzie dziś."],
  ["P8", "Gwarantujemy zgodność koloru."],
  ["P8", "Potwierdzam rezerwację na 15:00."],
  ["P9", "Jeśli zwrot okaże się wygodniejszy, pieniądze wyjdą do banku jeszcze po południu."],
  ["P9", "Do wyboru jest nowa lampa albo zwrot pieniędzy."],
  ["P10", "Jeśli oprawka okaże się wadliwa, przyślemy nową lampę."],
  ["P11", "Zlecono zwrot całej kwoty."],
  ["P11", "Zamówienie zostało anulowane."],
  ["P11", "Nową fakturę wysłaliśmy rano."],
];

const PL_NEAR = [
  ["PN1", "Możemy wysłać nową jeszcze jutro."],
  ["PN1", "Da się zmienić kolor."],
  ["PN1", "Mogę zaproponować rabat na kolejne zamówienie."],
  ["PN2", "To zajęłoby zwykle tydzień."],
  ["PN2", "Moglibyśmy rozważyć częściowy zwrot."],
  ["PN3", "Zwykle wysyłamy w ciągu dwóch dni roboczych."],
  ["PN3", "Zwroty przyjmujemy do 30 dni od odbioru."],
  ["PN3", "Zamówienia powyżej ustalonej kwoty wysyłamy bez opłat."],
  ["PN4", "Czy wysłać nową lampę, czy lepszy będzie zwrot pieniędzy?"],
  ["PN4", "Czy piątek będzie dobrym terminem?"],
  ["PN5", "Proszę o zdjęcie etykiety."],
  ["PN5", "Prośba o zachowanie kartonu na kilka dni."],
  ["PN6", "Już sprawdzam i za kilka minut wracam z odpowiedzią."],
  ["PN6", "Zapytam magazyn i zaraz dam znać."],
  ["PN6", "Będziemy sprawdzać i zaraz wrócimy z odpowiedzią."], // section 4: inside the chat, no channel, no span
  ["PN7", "Kurier zwykle przyjeżdża przed południem."],
  ["PN7", "Poczta przed świętami jeździ wolniej."],
  // Draft section 4 item 1: arriving is the carrier's act, so these two stay silent without a promise word.
  ["PN7", "Paczka dotrze w piątek."],
  ["PN7", "Nowa lampa dotrze w piątek."],
  ["PN8", "Postaramy się wysłać dziś."],
  ["PN8", "Paczka powinna dotrzeć do piątku."],
  ["PN8", "Mamy nadzieję, że towar wróci w przyszłym tygodniu."],
  ["PN9", "Grawerowanych rzeczy nie da się wymienić."],
  ["PN9", "Nie wyślemy paczki przed zaksięgowaniem wpłaty."],
  ["PN10", "Zaraz się tym zajmiemy."],
  ["PN10", "Wszystko naprawimy."],
  ["PN11", "Szkoda, że abażur nie przetrwał drogi."],
  ["PN11", "Dziękuję za wszystkie szczegóły."],
];

/* The controls. The English one is the brief's; the Polish are this file's own, in the house's
   impersonal register (no Pan or Pani, no second person, no first person at all). */
const PL_NEAR_OWN = [
  ["own", "Czy wyślemy nową lampę jutro?"],
  ["own", "Czy zwrot wróci na kartę w ciągu pięciu dni roboczych"],
  ["own", "Nie anulujemy zamówienia po wysyłce."],
  ["own", "Paczka nie wyruszy w piątek."],
  ["own", "Mamy nadzieję, że wyślemy paczkę jutro."],
  ["own", "Przesyłka zwrotna nie jest bezpłatna."],
  ["own", "Wymiana nie odbywa się na koszt sklepu."],
  ["own", "Paczka została odebrana przez kuriera."],
  ["own", "Zamówienie chyba zostało anulowane."],
];

const CONTROL = [
  ["en", "Our shop is open until six."],
  ["en", "Our shop is open from nine until six on weekdays.\n\nThe lamps are made by hand."],
  ["pl", "Sklep jest czynny do godziny osiemnastej."],
  ["pl", "Sklep jest czynny w dni robocze od dziewiątej.\n\nLampy są wykonane ręcznie."],
  ["pl", "Informacje o godzinach otwarcia są na stronie sklepu."],
];

/* Legs are named by rule and counted within it, so a failing line says which example. */
function named(table, prefix) {
  const seen = {};
  return table.map(([rule, text]) => {
    seen[rule] = (seen[rule] || 0) + 1;
    return { id: prefix + "." + rule + String.fromCharCode(96 + seen[rule]), rule, text };
  });
}
const short = (t) => t.replace(/\n/g, "\\n").slice(0, 70);

/* ---------- cd1 to cd5 ---------- */

for (const [prefix, table, lang] of [["cd1", EN_COMMIT, "en"], ["cd3", PL_COMMIT, "pl"]]) {
  for (const { id, rule, text } of named(table, prefix)) {
    const r = detect(text, lang);
    check(r.likely === true && r.rule === rule && r.kind === KIND[rule]
      && typeof r.phrase === "string" && r.phrase.length > 0 && r.phrase.length <= 60,
      id + " flags under " + rule + " (" + KIND[rule] + "): " + short(text)
      + (r.likely === true && r.rule === rule && r.kind === KIND[rule] ? ""
        : "  got " + J(r)));
  }
}

for (const [prefix, table, lang] of [["cd2", EN_NEAR.concat(EN_NEAR_OWN), "en"], ["cd4", PL_NEAR.concat(PL_NEAR_OWN), "pl"]]) {
  for (const { id, rule, text } of named(table, prefix)) {
    const r = detect(text, lang);
    check(r.likely === false && r.rule === null, id + " (" + rule + ") flags nothing: " + short(text)
      + (r.likely ? "  got " + J(r) : ""));
  }
}

CONTROL.forEach(([lang, text], i) => {
  const r = detect(text, lang);
  check(r.likely === false && r.rule === null && r.phrase === null,
    "cd5" + String.fromCharCode(97 + i) + " plain information (" + lang + ") flags nothing: " + short(text)
    + (r.likely ? "  got " + J(r) : ""));
});

/* ---------- cd6 reading steps ---------- */

{
  let r = detect("{GREET} {PAX}, we'll refund the postage today.", "en");
  check(r.likely && r.rule === "E1" && r.phrase === "we'll refund the postage today",
    "cd6a tokens are removed and the sentence read around the gap, the phrase without them: " + J(r));
  r = detect("The refund for {PAX} will reach the card within five working days.", "en");
  check(r.likely && r.rule === "E4",
    "cd6a2 a token inside a clause is removed, so it does not break the rule's reach (E4): " + J(r));
  r = detect("{GREET} {PAX}", "en");
  check(!r.likely, "cd6b a card of tokens alone flags nothing: " + J(r));
  r = detect("Thanks for waiting.\n\nWe'll refund the postage today.", "en");
  check(r.likely && r.rule === "E1", "cd6c a second block that commits makes the card a likely commitment: " + J(r));
  r = detect("We'll refund the postage today.\n\nThanks for waiting.", "en");
  check(r.likely && r.rule === "E1", "cd6d and so does a first block that commits, the last one plain: " + J(r));
  r = detect("Would Friday suit you? We'll send it tomorrow.", "en");
  check(r.likely && r.rule === "E1" && r.phrase === "We'll send it tomorrow",
    "cd6e a question mark scopes to its own sentence: " + J(r));
  r = detect("Will you be at home tomorrow? Shall I send it then?", "en");
  check(!r.likely, "cd6f two questions, one without a mark's help in its opening, flag nothing: " + J(r));
  r = detect("We" + String.fromCharCode(0x2019) + "ll send a new shade out tomorrow.", "en");
  check(r.likely && r.rule === "E1", "cd6g the curly apostrophe is folded before the contractions: " + J(r));
  r = detect("I'll refund 3.5 pounds today.", "en");
  check(r.likely && r.rule === "E1" && r.phrase.includes("3.5"),
    "cd6h a decimal point does not end a sentence, so the phrase keeps it: " + J(r));
  r = detect("Potwierdzam rezerwację na 15:00.", "pl");
  check(r.likely && r.phrase === "Potwierdzam rezerwację na 15:00",
    "cd6i a colour in a time of day does not cut the phrase: " + J(r));
  r = detect("WYŚLEMY JUTRO NOWĄ LAMPĘ.", "pl");
  check(r.likely && r.rule === "P1", "cd6j Polish is read lower-cased, diacritics kept: " + J(r));
  // The draft's guess (reading step 4), and this file's own sentences.
  r = detect("Jutro wyslemy nowy abazur.", "pl");
  check(r.likely && r.rule === "P1", "cd6k a Polish card typed with no diacritics is read against the lists with theirs off (P1): " + J(r));
  r = detect("Zwrot wroci na karte w ciagu pieciu dni roboczych.", "pl");
  check(r.likely && r.rule === "P4", "cd6l the same for P4: " + J(r));
  r = detect("Za wymiane nie ma doplaty.", "pl");
  check(r.likely && r.rule === "P6", "cd6m the same for P6: " + J(r));
  r = detect("Zwroty przyjmujemy do 30 dni od odbioru. Sklep jest czynny do godziny osiemnastej.", "pl");
  check(!r.likely, "cd6n and a diacritic-free card of information still flags nothing: " + J(r));
  const long = "We'll send the replacement lamp out to the address on file with the original order tomorrow.";
  r = detect(long, "en");
  check(r.likely && r.phrase.length <= 60 && r.phrase.endsWith("...") && !r.phrase.endsWith("....")
    && r.phrase.startsWith("We'll send the replacement"),
    "cd6o a long clause is cut to about sixty characters with three dots: " + J(r));
  r = detect("The postage is on us.", "en");
  check(r.likely && r.phrase === "The postage is on us" && !r.phrase.includes("..."),
    "cd6p a short clause is given whole, with no dots and no full stop: " + J(r));
  r = detect("Keep the old one, there's no need to post it back.", "en");
  check(r.likely && r.phrase === "there's no need to post it back",
    "cd6q the phrase is the clause between commas, not the sentence: " + J(r));
  // This file's own: a modal in another clause does not take a promise with it, nor does a
  // hedge hold back an act the firm does name.
  r = detect("You can keep the old one, we'll refund the postage today.", "en");
  check(r.likely && r.rule === "E1", "cd6r a modal in the neighbouring clause leaves a promise standing: " + J(r));
  r = detect("We'll pack it and send it out today.", "en");
  check(r.likely && r.rule === "E1", "cd6s a second act after 'and' is read as well: " + J(r));
  r = detect("We're looking into it.", "en");
  check(!r.likely, "cd6t E3 without an act flags nothing (EN6): " + J(r));
  r = detect("We're sending the replacement.", "en");
  check(!r.likely, "cd6u E3 with no time beside the act flags nothing, as the draft says: " + J(r));
  r = detect("Wysyłamy paczkę.", "pl");
  check(!r.likely, "cd6v P2 with no time beside the act flags nothing, as the draft says: " + J(r));
  r = detect("The refund will reach your card.", "en");
  check(!r.likely, "cd6w E4 with no time flags nothing, as the draft says: " + J(r));
  r = detect("The bank confirms the refund will reach you tomorrow.", "en");
  check(!r.likely, "cd6x a thing promised by somebody else's act is not the firm's (EN7): " + J(r));
}

/* ---------- cd7 the three open questions ---------- */

{
  check(J(OPTIONS) === J({ alreadyDone: true, conditionalOnCheck: true, reassurance: false })
    && Object.isFrozen(OPTIONS),
    "cd7a the defaults are the copywriter's view: already-done in, promise-on-a-check in, reassurance held back; and frozen: " + J(OPTIONS));

  // Question 1.
  for (const [lang, text, rule] of [["en", "I've refunded the full amount.", "E11"],
    ["en", "Your order has been cancelled.", "E11"], ["en", "We sent the new invoice this morning.", "E11"],
    ["pl", "Zlecono zwrot całej kwoty.", "P11"], ["pl", "Zamówienie zostało anulowane.", "P11"],
    ["pl", "Nową fakturę wysłaliśmy rano.", "P11"]]) {
    const on = detect(text, lang), off = detect(text, lang, { alreadyDone: false });
    check(on.rule === rule && !off.likely,
      "cd7b alreadyDone: " + short(text) + " is " + rule + " on and nothing off; got " + on.rule + " / " + J(off));
  }
  // Question 2.
  for (const [lang, text, rule] of [["en", "If the bulb holder turns out faulty, we'll replace the whole lamp.", "E10"],
    ["pl", "Jeśli oprawka okaże się wadliwa, przyślemy nową lampę.", "P10"]]) {
    const on = detect(text, lang), off = detect(text, lang, { conditionalOnCheck: false });
    check(on.rule === rule && !off.likely,
      "cd7c conditionalOnCheck: " + short(text) + " is " + rule + " on and nothing off, its main clause not firing alone; got "
      + on.rule + " / " + J(off));
  }
  // Question 3.
  for (const [lang, text, rule] of [["en", "We'll sort it out.", "E1"],
    ["en", "Leave it with me, we'll put it right.", "E1"], ["en", "We'll fix it.", "E1"], ["pl", "Wszystko naprawimy.", "P1"],
    ["pl", "Zaraz się tym zajmiemy.", "P1"]]) {
    const off = detect(text, lang), on = detect(text, lang, { reassurance: true });
    check(!off.likely && on.rule === rule,
      "cd7d reassurance: " + short(text) + " is held back by default and " + rule + " when on; got " + J(off) + " / " + on.rule);
  }
  // Reassurance on does not let a step through.
  for (const [lang, text] of [["en", "I'll check with the warehouse and come back to you in a few minutes."],
    ["pl", "Zapytam magazyn i zaraz dam znać."], ["pl", "Już sprawdzam i za kilka minut wracam z odpowiedzią."]]) {
    check(!detect(text, lang, { reassurance: true }).likely,
      "cd7e reassurance on still leaves the agent's own steps out (EN6, PN6): " + short(text));
  }
  // The options move nothing else: every rule the draft calls certain or likely gives the same
  // rule with all three flipped; every near miss but the two reassurance ones stays out.
  const flipped = { alreadyDone: false, conditionalOnCheck: false, reassurance: true };
  const guess = new Set(["E10", "E11", "P10", "P11"]);
  const moved = [];
  for (const [table, lang] of [[EN_COMMIT, "en"], [PL_COMMIT, "pl"]]) {
    for (const [rule, text] of table) {
      if (guess.has(rule)) continue;
      if (detect(text, lang, flipped).rule !== rule) moved.push(rule + " " + short(text));
    }
  }
  for (const [table, lang] of [[EN_NEAR, "en"], [PL_NEAR, "pl"]]) {
    for (const [rule, text] of table) {
      if (rule === "EN10" || rule === "PN10") continue;
      if (detect(text, lang, flipped).likely) moved.push(rule + " " + short(text));
    }
  }
  check(moved.length === 0, "cd7f the three options move no other rule and no other near miss"
    + (moved.length ? ": moved " + J(moved) : ""));
  check(detect("We'll refund the postage today.", "en", { reassurance: undefined }).rule === "E1"
    && detect("I've refunded the full amount.", "en", {}).rule === "E11",
    "cd7g an option left out keeps its default");
  // The read's "for later" item 3: conditionalOnCheck holds back only a promise whose act depends on a fact still to be
  // checked. A plain promise that merely carries an "if" or an "in case" is the same rule with the option on or off.
  for (const [lang, text, rule] of [["en", "We'll refund the postage today if that's all right.", "E1"],
    ["en", "We'll send the new shade tomorrow, in case you were wondering.", "E1"],
    ["pl", "Wyślemy nową lampę jutro, jeśli to pasuje.", "P1"]]) {
    const on = detect(text, lang), off = detect(text, lang, { conditionalOnCheck: false });
    check(on.rule === rule && off.rule === rule,
      "cd7h conditionalOnCheck: " + short(text) + " is " + rule + " with the option on and off, a plain promise; got "
      + on.rule + " / " + off.rule);
  }
}

/* ---------- cd8 the word lists are wired ---------- */

{
  const missed = (list, make, want) => list.filter((w) => {
    const [lang, text, opts] = make(w);
    const r = detect(text, lang, opts);
    return !(r.likely && r.rule === want);
  });
  const none = (list, make) => list.filter((w) => {
    const [lang, text, opts] = make(w);
    return detect(text, lang, opts).likely;
  });
  const en = WORDS.en, pl = WORDS.pl;
  const gate = (id, line, bad) => check(bad.length === 0, id + " " + line + (bad.length ? ": not read " + J(bad) : ""));
  /* A list that is not in the module yet is a red leg and not a crashed file. */
  en.outside = en.outside || [];
  pl.outside = pl.outside || [];
  en.fixObject = en.fixObject || [];
  en.negation = en.negation || [];
  en.courtesy = en.courtesy || [];
  pl.negation = pl.negation || [];
  pl.courtesy = pl.courtesy || [];
  gate("cd8a", "every English act reaches E1 (" + en.act.length + ")",
    missed(en.act, (w) => ["en", "We'll " + w + " the shade.", {}], "E1"));
  gate("cd8b", "every English -ing act reaches E3 (" + en.acting.length + ")",
    missed(en.acting, (w) => ["en", "We're " + w + " it now.", {}], "E3"));
  gate("cd8c", "every English past act reaches E11 (" + en.done.length + ")",
    missed(en.done, (w) => ["en", "We have " + w + " it.", {}], "E11"));
  gate("cd8d", "every English past act reaches E5 (" + en.done.length + ")",
    missed(en.done, (w) => ["en", "It will be " + w + " today.", {}], "E5"));
  gate("cd8e", "every English thing reaches E4 and E7 (" + en.things.length + ")",
    missed(en.things, (w) => ["en", "The " + w + " will reach you tomorrow.", {}], "E4")
      .concat(missed(en.things, (w) => ["en", "You'll get the " + w + " by email.", {}], "E7")));
  gate("cd8f", "every English waiver reaches E6 (" + en.waived.length + ")",
    missed(en.waived, (w) => ["en", "Here, " + w + ".", {}], "E6"));
  gate("cd8g", "every English reassurance reaches E1 when on and nothing when off (" + en.reassure.length + ")",
    missed(en.reassure, (w) => ["en", "We'll " + w + ".", { reassurance: true }], "E1")
      .concat(none(en.reassure, (w) => ["en", "We'll " + w + ".", {}])));
  gate("cd8ag", "every English object of 'fix' that is no thing holds 'We'll fix X.' back, and reaches E1 when the reassurance is on ("
    + en.fixObject.length + ")",
    missed(en.fixObject, (w) => ["en", "We'll fix " + w + ".", { reassurance: true }], "E1")
      .concat(none(en.fixObject, (w) => ["en", "We'll fix " + w + ".", {}]))
      .concat(en.fixObject.length ? [] : ["the module has no list"]));
  gate("cd8h", "every English habit word holds a promise back (" + en.habit.length + ")",
    none(en.habit, (w) => ["en", "The refund will reach your card today, " + w + ".", {}]));
  gate("cd8i", "every English general subject holds a promise back, and 'this' lets it through (" + en.general.length + ")",
    none(en.general, (w) => ["en", w + " will be refunded today.", {}])
      .concat(missed(en.general, (w) => ["en", w + " in this list will be refunded today.", {}], "E5")));
  gate("cd8j", "every English other party takes the promise off the firm (" + en.others.length + ")",
    none(en.others, (w) => ["en", "The " + w + " confirms the refund will reach you tomorrow.", {}]));
  /* The frame fires E4 with no hedge in it ("will also reach", the benign twin, asserted to fire), so a hedge entry that
     is not read is a sentence that fires and not one that was never going to. */
  gate("cd8k", "every English hedge holds back a sentence that fires E4 without it (" + en.hedge.length + ")",
    none(en.hedge, (w) => ["en", "The refund will " + w + " reach your card today.", {}])
      .concat(missed(["also"], (w) => ["en", "The refund will " + w + " reach your card today.", {}], "E4")));
  gate("cd8ac", "every English negation takes a waiver back (" + en.negation.length + ")",
    none(en.negation, (w) => ["en", "The return " + w + " free of charge.", {}]).concat(en.negation.length ? [] : ["the module has no list"]));
  gate("cd8ad", "every English courtesy leaves a promise plain with the option off (" + en.courtesy.length + ")",
    missed(en.courtesy, (w) => ["en", "We'll refund the postage today if " + w + ".", { conditionalOnCheck: false }], "E1").concat(en.courtesy.length ? [] : ["the module has no list"]));
  gate("cd8aa","every English channel or span reaches 'get back to you' as E1 (" + en.outside.length + ")",
    missed(en.outside, (w) => ["en", "I'll check and get back to you " + w + ".", {}], "E1")
      .concat(en.outside.length ? [] : ["the module has no list"]));
  gate("cd8l", "every English performative reaches E8 (" + en.promise.length + ")",
    missed(en.promise, (w) => ["en", "We " + w + " the colour match.", {}], "E8"));

  gate("cd8m", "every Polish first-person act reaches P1 (" + pl.acts1.length + ")",
    missed(pl.acts1, (w) => ["pl", w + " paczkę.", {}], "P1"));
  gate("cd8n", "every Polish imperfective act reaches P2 with a time (" + pl.acting.length + ")",
    missed(pl.acting, (w) => ["pl", w + " paczkę jutro.", {}], "P2"));
  gate("cd8o", "every Polish participle reaches P5 and P11 (" + pl.participle.length + ")",
    missed(pl.participle, (w) => ["pl", "Paczka zostanie " + w + "a jutro.", {}], "P5")
      .concat(missed(pl.participle, (w) => ["pl", "Paczka zostało " + w + "a.", {}], "P11")));
  gate("cd8p", "every Polish impersonal past reaches P11 (" + pl.impersonal.length + ")",
    missed(pl.impersonal, (w) => ["pl", w + " paczkę.", {}], "P11"));
  gate("cd8q", "every Polish past stem reaches P11, masculine and feminine (" + pl.past.length + ")",
    missed(pl.past, (w) => ["pl", "Paczkę " + w + "liśmy.", {}], "P11")
      .concat(missed(pl.past, (w) => ["pl", "Paczkę " + w + "łyśmy.", {}], "P11")));
  gate("cd8r", "every Polish thing and every verb of arriving reach P4 (" + pl.things.length + " and " + pl.arriving.length + ")",
    missed(pl.things, (w) => ["pl", w + " wyruszy jutro.", {}], "P4")
      .concat(missed(pl.arriving, (w) => ["pl", "Paczka " + w + " jutro.", {}], "P4")));
  gate("cd8s", "every Polish waiver reaches P6 (" + pl.waived.length + ")",
    missed(pl.waived, (w) => ["pl", "Za wymianę " + w + ".", {}], "P6")
      .concat(missed(pl.unneeded, (w) => ["pl", "Starej sztuki nie trzeba " + w + ".", {}], "P6")));
  gate("cd8t", "every Polish performative reaches P8 (" + pl.promise.length + ")",
    missed(pl.promise, (w) => ["pl", w + " zgodność koloru.", {}], "P8"));
  gate("cd8u", "every Polish habit word holds a promise back (" + pl.habit.length + ")",
    none(pl.habit, (w) => ["pl", "Zwrot wróci jutro, " + w + ".", {}]));
  gate("cd8v", "every Polish general object holds a promise back, and 'tej' lets it through (" + pl.general.length + ")",
    none(pl.general, (w) => ["pl", w + " wysyłamy jutro.", {}])
      .concat(missed(pl.general, (w) => ["pl", w + " z tej listy wysyłamy jutro.", {}], "P2")));
  gate("cd8w", "every Polish other party takes the promise off the firm (" + pl.others.length + ")",
    none(pl.others, (w) => ["pl", w + " mówi, że zwrot wróci jutro.", {}]));
  gate("cd8x", "every Polish hedge holds a promise back (" + pl.hedge.length + ")",
    none(pl.hedge, (w) => ["pl", "Zwrot " + w + " wróci jutro.", {}]));
  gate("cd8y", "every Polish choice word reaches P9 after jeśli (" + pl.choice.length + ")",
    missed(pl.choice, (w) => ["pl", "Jeśli " + w + ", paczka wyjdzie dziś.", {}], "P9"));
  gate("cd8ab", "every Polish channel or span lets P3 fire on a step verb, and every step verb is held back without one ("
    + pl.outside.length + " and " + pl.steps.length + ")",
    missed(pl.outside, (w) => ["pl", "Będziemy " + w + " sprawdzać status zamówienia.", {}], "P3")
      .concat(none(pl.steps.filter(w => /ć$/.test(w)), (w) => ["pl", "Będziemy " + w + " status zamówienia.", {}]))
      .concat(pl.outside.length ? [] : ["the module has no list"]));
  gate("cd8ae", "every Polish negation takes a waiver back (" + pl.negation.length + ")",
    none(pl.negation, (w) => ["pl", "Przesyłka zwrotna " + w + " jest bezpłatna.", {}]).concat(pl.negation.length ? [] : ["the module has no list"]));
  gate("cd8af", "every Polish courtesy leaves a promise plain with the option off (" + pl.courtesy.length + ")",
    missed(pl.courtesy, (w) => ["pl", "Wyślemy nową lampę jutro, jeśli " + w + ".", { conditionalOnCheck: false }], "P1").concat(pl.courtesy.length ? [] : ["the module has no list"]));
  gate("cd8z", "every Polish reassurance reaches P1 when on and nothing when off",
    missed(pl.reassureForms, (w) => ["pl", w + " to.", { reassurance: true }], "P1")
      .concat(none(pl.reassureForms, (w) => ["pl", w + " to.", {}])));
}

/* ---------- cd11 the channels and spans (10e): Claudette's own, "regularly" and "each day" out, "as it goes" in ---------- */

{
  const frame = (w) => "I'll check with the warehouse and get back to you " + w + ".";
  check(!detect(frame("regularly"), "en").likely,
    "cd11a 'regularly' is no span: the agent's own step inside the chat is held back, as with none: " + J(detect(frame("regularly"), "en")));
  check(!detect(frame("each day"), "en").likely,
    "cd11b 'each day' is no span either (Claudette's is 'every day'): " + J(detect(frame("each day"), "en")));
  check(detect(frame("as it goes"), "en").rule === "E1",
    "cd11c 'as it goes' is a span: the same sentence is a promise to keep the customer informed (E1): " + J(detect(frame("as it goes"), "en")));
  check(detect(frame("every day"), "en").rule === "E1" && !WORDS.en.outside.some((w) => w === "regularly" || w === "each day"),
    "cd11d CONTROL: 'every day' still is one, and the list holds neither of the two taken out");
}

/* ---------- cd12 a dated "fix it" is a commitment (Maxim 2026-10-06 19:10, delegated; board 844) ----------
   "We'll fix it." stays held back (10h-A, cd2 and cd7d). With a day, a date or a deadline in the same sentence it is
   the date the customer can hold the firm to, flagged in both languages as "We'll repair it by Friday." already is. */

{
  const flagged = (list, lang, rule, opts) => list.filter((t) => {
    const r = detect(t, lang, opts);
    return !(r.likely && r.rule === rule && r.kind === "later" && r.phrase && r.phrase.length <= 60);
  });
  const held = (list, lang, opts) => list.filter((t) => detect(t, lang, opts).likely);
  const EN_DATED = ["We'll fix it by Friday.", "We'll fix it for you by tomorrow.", "I'll fix this on Monday.",
    "We will fix it within three working days.", "We'll fix everything by 12 October.", "We'll fix that by the end of the week.",
    "We'll fix it today.", "Leave it with us, we'll fix it next week.", "We'll fix it by the 10th.", "We'll fix it in two days."];
  const EN_GOING = ["We're going to fix it by Friday."];
  const PL_DATED = ["Naprawimy to do piątku.", "Naprawię to jutro.", "Wszystko naprawimy w przyszłym tygodniu.",
    "Naprawimy to do 12 października.", "Naprawimy to w ciągu trzech dni.", "Naprawimy to do końca tygodnia.",
    "Naprawimy to we wtorek.", "Naprawimy to do 10.10."];
  check(flagged(EN_DATED, "en", "E1").length === 0,
    "cd12a a dated English 'fix it' flags under E1 (later), " + EN_DATED.length + " forms: not flagged " + J(flagged(EN_DATED, "en", "E1")));
  check(flagged(EN_GOING, "en", "E2").length === 0,
    "cd12b the same through 'going to' flags under E2: not flagged " + J(flagged(EN_GOING, "en", "E2")));
  check(flagged(PL_DATED, "pl", "P1").length === 0,
    "cd12c a dated Polish 'naprawimy to' flags under P1 (later), " + PL_DATED.length + " forms: not flagged " + J(flagged(PL_DATED, "pl", "P1")));
  check(flagged(["Naprawimy to do piatku.", "Wszystko naprawimy w przyszlym tygodniu."], "pl", "P1").length === 0,
    "cd12d the same read without its diacritics, as a card typed that way is");
  // The controls: the undated forms stay held back, with the option off (the default) and the date in another sentence.
  const EN_UNDATED = ["We'll fix it.", "We'll fix it for you.", "I'll fix this.", "We'll fix everything.", "We'll fix it. The shop shuts on Friday.",
    "We'll fix it now.", "We'll fix it straight away.", "We'll fix it immediately.",
    "We'll sort it out within our returns policy.", "We'll fix it, but you may need to pay."]; // the architect's read: bare "within" is no deadline
  const PL_UNDATED = ["Naprawimy to.", "Naprawimy to dla Pana.", "Wszystko naprawimy.", "Naprawię to. Sklep jest nieczynny w piątek.",
    "Naprawimy to od razu.", "Naprawimy to natychmiast.",
    "Naprawimy to do końca.", "Załatwimy to do końca."]; // "do końca" alone means completely, no deadline
  check(held(EN_UNDATED, "en").length === 0,
    "cd12e CONTROL: the undated English forms stay held back, and so do 'now', 'straight away' and 'immediately' (no day, date or deadline, the brief's reading), "
    + EN_UNDATED.length + " forms: flagged " + J(held(EN_UNDATED, "en")));
  check(held(PL_UNDATED, "pl").length === 0,
    "cd12f CONTROL: the undated Polish forms stay held back, and so do 'od razu' and 'natychmiast', " + PL_UNDATED.length + " forms: flagged " + J(held(PL_UNDATED, "pl")));
  // A hedge or a negation still takes a dated one back; the option on changes nothing.
  const HEDGED = [["en", "We'll try to fix it by Friday."], ["en", "We might fix it by Friday."], ["en", "We hope we'll fix it by Friday."],
    ["pl", "Naprawimy to chyba do piątku."], ["pl", "Nie naprawimy tego do piątku."], ["pl", "Postaramy się naprawić to do piątku."]];
  check(HEDGED.filter(([l, t]) => detect(t, l).likely).length === 0,
    "cd12g a hedge or a negation still holds a dated 'fix it' back: flagged " + J(HEDGED.filter(([l, t]) => detect(t, l).likely)));
  check(flagged(EN_DATED, "en", "E1", { reassurance: true }).length === 0 && flagged(PL_DATED, "pl", "P1", { reassurance: true }).length === 0
    && J(detect("We'll fix it by Friday.", "en", { reassurance: true })) === J(detect("We'll fix it by Friday.", "en")),
    "cd12h the reassurance option moves a dated form not at all: it is the same answer on and off");
  // The other held-back reassurances (Claude α 2026-10-06, extending the ruling: the date is the promise): every word of
  // the lists, in both languages, flags with a date in the sentence and is held back without one.
  const en = WORDS.en, pl = WORDS.pl;
  const enList = (en.reassure || []).map((w) => "We'll " + w + " by Friday.");
  const enBare = (en.reassure || []).map((w) => "We'll " + w + ".");
  const plForms = (pl.reassureForms || []).map((w) => w + " to do piątku.");
  const plBare = (pl.reassureForms || []).map((w) => w + " to.");
  const PL_SIE = ["Zajmiemy się tym do piątku.", "Zajmę się tym jutro.", "Zajmiemy się tym w przyszłym tygodniu."];
  check(enList.length > 0 && flagged(enList, "en", "E1").length === 0 && flagged(["Leave it with me, I'll put it right by tomorrow."], "en", "E1").length === 0,
    "cd12i every English reassurance word flags under E1 with a date in the sentence (" + enList.length + "): not flagged "
    + J(flagged(enList, "en", "E1")));
  check(plForms.length > 0 && flagged(plForms, "pl", "P1").length === 0 && flagged(PL_SIE, "pl", "P1").length === 0
    && flagged(["Zalatwimy to do piatku.", "Zajmiemy sie tym do piatku."], "pl", "P1").length === 0,
    "cd12j every Polish reassurance form and 'zajmiemy się tym' flags under P1 with a date in the sentence (" + (plForms.length + PL_SIE.length)
    + "), diacritics or none: not flagged " + J(flagged(plForms.concat(PL_SIE), "pl", "P1")));
  const RE_UNDATED = [["en", "We'll sort it out. The shop shuts on Friday."], ["en", "We'll sort it out right away."],
    ["en", "We'll put it right immediately."], ["pl", "Zajmiemy się tym."], ["pl", "Załatwię to od razu."],
    ["pl", "Zajmę się tym natychmiast."], ["pl", "Załatwimy to. Sklep jest nieczynny w piątek."],
    ["pl", "Załatwimy to do końca."], ["pl", "Zajmiemy się tym do końca."], ["en", "We'll sort it out within our returns policy."]];
  check(held(enBare, "en").length === 0 && held(plBare, "pl").length === 0 && RE_UNDATED.filter(([l, t]) => detect(t, l).likely).length === 0,
    "cd12k CONTROL: every reassurance word held back without a date (" + (enBare.length + plBare.length + RE_UNDATED.length) + " forms), 'right away', 'od razu' and a date in another sentence included: flagged "
    + J(held(enBare, "en").concat(held(plBare, "pl"), RE_UNDATED.filter(([l, t]) => detect(t, l).likely))));
  const RE_HEDGED = [["en", "We hope we'll sort it out by Friday."], ["en", "We hope we'll sort it out in May."], ["en", "We might sort it out by Friday."],
    ["pl", "Chyba załatwimy to do piątku."], ["pl", "Nie załatwimy tego do piątku."], ["pl", "Postaramy się zająć się tym do piątku."]];
  check(RE_HEDGED.filter(([l, t]) => detect(t, l).likely).length === 0
    && J(detect("We'll sort it out by Friday.", "en", { reassurance: true })) === J(detect("We'll sort it out by Friday.", "en"))
    && J(detect("Zajmiemy się tym do piątku.", "pl", { reassurance: true })) === J(detect("Zajmiemy się tym do piątku.", "pl")),
    "cd12l a hedge or a negation still holds a dated reassurance back, and the option on changes a dated one not at all: flagged "
    + J(RE_HEDGED.filter(([l, t]) => detect(t, l).likely)));
  // The architect's read, and Claude α's call on its misses (2026-10-06): a month with no day, the weekend and "od jutra" are dated.
  const MONTH_EN = ["We'll fix it by October.", "We'll sort it out in May.", "I'll fix it before December.", "We'll put it right until March.",
    "We will fix this in September."];
  const MONTH_PL = ["Naprawimy to do października.", "Naprawimy to w październiku.", "Załatwimy to w maju.", "Zajmiemy się tym do marca.",
    "Naprawimy to na październik.", "Naprawimy to we wrześniu.", "Załatwimy to w grudniu."];
  check(flagged(MONTH_EN.slice(0, 3), "en", "E1").length === 0 && flagged(MONTH_EN.slice(3), "en", "E1").length === 0
    && flagged(MONTH_PL, "pl", "P1").length === 0 && flagged(["Naprawimy to do pazdziernika.", "Naprawimy to w pazdzierniku."], "pl", "P1").length === 0,
    "cd12m a month with no day is a date, in both languages, fix and reassurance alike (" + (MONTH_EN.length + MONTH_PL.length) + " forms): not flagged "
    + J(flagged(MONTH_EN, "en", "E1").concat(flagged(MONTH_PL, "pl", "P1"))));
  const WEEKEND_EN = ["We'll fix it this weekend.", "We'll fix it by the weekend.", "We'll sort it out over the weekend.", "We'll put it right next weekend."];
  const WEEKEND_PL = ["Naprawimy to na weekend.", "Naprawimy to w weekend.", "Załatwimy to do weekendu.", "Zajmiemy się tym przed weekendem."];
  check(flagged(WEEKEND_EN, "en", "E1").length === 0 && flagged(WEEKEND_PL, "pl", "P1").length === 0
    && !detect("We'll fix it. We do not ship on weekends.", "en").likely && !detect("Naprawimy to. Nie wysyłamy w weekendy.", "pl").likely,
    "cd12n the weekend is a date in both languages (" + (WEEKEND_EN.length + WEEKEND_PL.length) + " forms), and the plural 'weekends' of a habit is not: not flagged "
    + J(flagged(WEEKEND_EN, "en", "E1").concat(flagged(WEEKEND_PL, "pl", "P1"))));
  const JUTRA = ["Zajmiemy się tym od jutra.", "Naprawimy to do jutra.", "Załatwimy to od jutra."];
  check(flagged(JUTRA, "pl", "P1").length === 0 && flagged(["Zajmiemy sie tym od jutra."], "pl", "P1").length === 0,
    "cd12o 'od jutra' and 'do jutra' are dated, the Polish list having had 'jutro' only: not flagged " + J(flagged(JUTRA, "pl", "P1")));
}

/* ---------- cd9 the shape of an answer ---------- */

{
  const NO = { likely: false, rule: null, kind: null, phrase: null };
  check(J(detect("Our shop is open until six.", "en")) === J(NO), "cd9a a card that is not a commitment answers exactly " + J(NO));
  check(J(detect("We'll refund the postage today.", "de")) === J(NO) && J(detect("We'll refund the postage today.", "")) === J(NO)
    && J(detect("We'll refund the postage today.")) === J(NO),
    "cd9b a language it has no grammar for answers not-likely and does not guess");
  check(J(detect(null, "en")) === J(NO) && J(detect(undefined, "pl")) === J(NO) && J(detect(42, "en")) === J(NO)
    && J(detect("", "en")) === J(NO),
    "cd9c input that is not text, or is empty, answers not-likely");
  check(detect("We'll refund the postage today.", "EN").rule === "E1" && detect("Wyślemy paczkę dziś.", "pl-PL").rule === "P1",
    "cd9d a language tag is read by its first two letters, in either case");
  check(J(detect("We'll refund the postage today.", "en")) === J(detect("We'll refund the postage today.", "en")),
    "cd9e the same card gives the same answer twice, so no state is kept between calls");
}

/* ---------- cd13 four misread sentences held silent while true promises of those rules still fire ---------- */

{
  const FALSE_READS = [
    ["cd13a", "en", "E4", "The voucher code goes in the field under the total, before checkout, and the discount updates at once.",
      "The voucher code goes out by email today."],
    ["cd13b", "pl", "P6", "Przy fakturze firmowej duplikat ma ten sam adres co pierwotny dokument i niczego nie trzeba podpisywać ani odsyłać.",
      "Uszkodzonej ramki nie trzeba nam odsyłać."],
    ["cd13c", "en", "E11", "A pale patch on the rim is simply where it was held for glazing.",
      "Your order was held at the studio until Friday."],
    ["cd13d", "pl", "P9", "Jeśli szukasz krótkiego wpisu na karnet, polecamy zdanie: \"Na miły upominek, do wyboru według uznania.\"",
      "Do wyboru jest nowa ramka albo zwrot pieniędzy."],
  ];
  for (const [id, lang, rule, quiet, loud] of FALSE_READS) {
    const q = detect(quiet, lang), l = detect(loud, lang);
    check(!q.likely && l.likely && l.rule === rule && l.kind === KIND[rule],
      id + " " + rule + " non-promise stays silent and true promise fires: quiet=" + J(q) + " loud=" + J(l));
  }
  const srcText = fs.readFileSync(SRC, "utf8");
  if (process.env.ETIUDA_PLANTS === "off" || process.env.COMMITMENT_SRC) {
    check(true, "cd13e plants for E4/P6/E11/P9 guards skipped (ETIUDA_PLANTS=off or COMMITMENT_SRC)");
  } else {
    const modOf = (t) => import("data:text/javascript;base64," + Buffer.from(t).toString("base64"));
    const PLANTS = [
      ["commit-e4-goes", "en", "The voucher code goes in the field under the total, before checkout, and the discount updates at once.",
        "goes\\s+(?:out|back|off|by|to|through|straight(?!\\s+(?:in|into|on|onto)\\b))", "goes"],
      ["commit-p6-conj", "pl", "Przy fakturze firmowej duplikat ma ten sam adres co pierwotny dokument i niczego nie trzeba podpisywać ani odsyłać.",
        "(?:(?!(?:ani|albo|lub|i)\\b)[\\p{L}-]+\\s+){0,2}?", "(?:[\\p{L}-]+\\s+){0,2}?"],
      ["commit-e11-where", "en", "A pale patch on the rim is simply where it was held for glazing.",
        "if (/^(?:was|were)\\b/i.test(m[0]) && (/\\bwhere\\b/i.test(c.h.slice(k.start, m.index)) || /\\bheld\\s+for\\s+[a-z]+ing\\b/i.test(c.h.slice(m.index)))) continue; /* plant:commit-e11-where */",
        "/* plant:commit-e11-where removed */"],
      ["commit-p9-offer", "pl", "Jeśli szukasz krótkiego wpisu na karnet, polecamy zdanie: \"Na miły upominek, do wyboru według uznania.\"",
        "const P9ALONE = R(LB + String.raw`(?:(?:jest|są|będzie|będą|zostaje|zostają|mamy|macie|oferujemy|dajemy|pozostaje|pozostają)\\s+do\\s+wyboru|do\\s+wyboru(?:\\s+(?:jest|są|będzie|będą|zostaje|zostają|mamy|macie|oferujemy|dajemy|pozostaje|pozostają)\\b|:|[^,;]*\\b(?:albo|lub)\\b))` + RB); /* plant:commit-p9-offer */",
        "const P9ALONE = WA([\"do wyboru\"]);"],
    ];
    const turned = {};
    for (const [tag, lang, text, from, to] of PLANTS) {
      if (srcText.split(from).length !== 2) { turned[tag] = "marker:" + (srcText.split(from).length - 1); continue; }
      const planted = await modOf(srcText.replace(from, () => to));
      turned[tag] = planted.likelyCommitment(text, lang).likely ? "red" : "held";
    }
    check(Object.keys(turned).every((k) => turned[k] === "red"),
      "cd13e each of the four guards lifted turns its check red: " + J(turned));
  }
}

check(asserted + 1 === EXPECTED, "cd10 every leg ran: " + (asserted + 1) + " of " + EXPECTED + " assertion(s)");
process.stdout.write("commitment: " + asserted + " assertion(s), " + failed + " failure(s)\n");
process.exit(failed ? 1 : 0);
