/* THE NUMBERS CHECK OVER ONE CARD AND STUDIO'S CHECKS LIST.
 *
 *     node tests/numbers-check.mjs
 *
 * Pure cardNumbers() / extractNumbers() rules over invented cards, Studio's findings() / lintProject() /
 * openProject() / saveCard() / publishPlan() / publishProject() integration, UI rendering in paintLint() and
 * coverHtml(), and inline scratch-copy plant proofs (skipped with a NOT RUN line when ETIUDA_PLANTS=off).
 */
import "./licensed-env.mjs";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import * as S from "../src/studio.mjs";
import { clearScratch, dropScratch } from "./scratch.mjs";
import { loadPage } from "./page-stand-in.mjs";
import { copyPlants } from "./plant-copy.mjs";

const SELF = fileURLToPath(import.meta.url);

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const SCRATCH = path.join(ROOT, "scratch", "numbers-check");
const PLANTS_OFF = process.env.ETIUDA_PLANTS === "off";
const EXPECTED = 33;
const ONLY = process.env.NUMBERS_ONLY || "";
const NB = new RegExp(String.fromCharCode(160), "g");

let asserted = 0, skipped = 0, failed = 0;
function check(cond, line) {
  asserted++;
  if (cond) process.stdout.write("  ok   " + line + "\n");
  else { failed++; process.stderr.write("  FAIL " + line + "\n"); }
}
function skip(line) {
  skipped++;
  process.stdout.write("  NOT RUN " + line + "\n");
}

function plantText(real, from, to, file) {
  const n = real.split(from).length - 1;
  if (n !== 1) throw new Error("plant marker not unique in " + file + " (" + n + "): " + from);
  return real.replace(from, () => to);
}

async function runUnitChecks(N, ck = check) {
  const mk = (en, pl, extra = {}) => Object.assign({ id: "c1", title: { en: "Sample", pl: "Przyklad" }, body: { en, pl } }, extra);

  /* nc1: Differing amount flagged. */
  const diff = N.cardNumbers(mk("Reply within 14 days.", "Odpowiedz w ciągu 30 dni."), ["en", "pl"]);
  ck(diff.differ === true
    && JSON.stringify(diff.byLang.en) === JSON.stringify(["14"])
    && JSON.stringify(diff.byLang.pl) === JSON.stringify(["30"]),
    "nc1 differing amount across languages is flagged: " + JSON.stringify(diff));

  /* nc2: Differing count of numbers is flagged. */
  const countDiff = N.cardNumbers(mk("Get 10% off within 7 days.", "Zniżka 10%."), ["en", "pl"]);
  ck(countDiff.differ === true
    && JSON.stringify(countDiff.byLang.en) === JSON.stringify(["10", "7"])
    && JSON.stringify(countDiff.byLang.pl) === JSON.stringify(["10"]),
    "nc2 extra number on one side is flagged: " + JSON.stringify(countDiff));

  /* nc3: Reworded sentence with same numbers in different order is silent. */
  const reword = N.cardNumbers(
    mk("Order at least 2 items for 50 GBP.", "Za 50 PLN zamów co najmniej 2 sztuki."),
    ["en", "pl"]);
  ck(reword.differ === false
    && JSON.stringify(reword.byLang.en) === JSON.stringify(["2", "50"])
    && JSON.stringify(reword.byLang.pl) === JSON.stringify(["2", "50"]),
    "nc3 reworded sentence with same numbers in different order stays silent: " + JSON.stringify(reword));

  /* nc4: Number words vs digits (EN and PL inflections), plus guarded 'one' and ordinals. */
  const wordsEnPl = N.cardNumbers(
    mk("We reply in three days or 5 hours and one working day.",
       "Odpowiadamy w 3 dni lub pięciu godzinach oraz jednego dnia roboczego."),
    ["en", "pl"]);
  ck(wordsEnPl.differ === false
    && JSON.stringify(wordsEnPl.byLang.en) === JSON.stringify(["1", "3", "5"])
    && JSON.stringify(wordsEnPl.byLang.pl) === JSON.stringify(["1", "3", "5"]),
    "nc4 cardinal number words and Polish inflections match digits: " + JSON.stringify(wordsEnPl));

  const guarded = N.cardNumbers(
    mk("Choose the new one a second time. Write back and I will send you one. No one else asks first.",
       "Wybierz nową znów. Napisz do mnie, a prześlę nowy. Nikt inny nie pyta pierwszy raz."),
    ["en", "pl"]);
  ck(guarded.differ === false && guarded.byLang.en.length === 0 && guarded.byLang.pl.length === 0,
    "nc5 pronoun 'one' idioms and ordinals are ignored: " + JSON.stringify(guarded));

  /* nc6: Format pairs (decimals, 24h vs 12h time, thousands separators, currency signs/codes). */
  const decimals = N.cardNumbers(
    mk("The fee is 1.50 days for 1.5 kg.", "Opłata wynosi 1,5 dnia dla 1,5 kg."),
    ["en", "pl"]);
  ck(decimals.differ === false, "nc6 decimal separator and trailing zeros match (1.50 vs 1,5): " + JSON.stringify(decimals));

  const times = N.cardNumbers(
    mk("Open from 2 pm until 5:30 p.m.", "Czynne od 14:00 do 17:30."),
    ["en", "pl"]);
  ck(times.differ === false
    && JSON.stringify(times.byLang.en) === JSON.stringify(["14:00", "17:30"])
    && JSON.stringify(times.byLang.pl) === JSON.stringify(["14:00", "17:30"]),
    "nc7 12h and 24h times normalize identically: " + JSON.stringify(times));

  const thousands = N.cardNumbers(
    mk("Limit is 1,000 points or 2 500 credits.", "Limit to 1\u00a0000 punktów lub 2500 kredytów."),
    ["en", "pl"]);
  ck(thousands.differ === false
    && JSON.stringify(thousands.byLang.en) === JSON.stringify(["1000", "2500"])
    && JSON.stringify(thousands.byLang.pl) === JSON.stringify(["1000", "2500"]),
    "nc8 thousands separators match plain digits: " + JSON.stringify(thousands));

  const currency = N.cardNumbers(
    mk("Refund is £50, €15.50 or USD 20.", "Zwrot to 50 PLN, 15,50 € lub 20 USD."),
    ["en", "pl"]);
  ck(currency.differ === false
    && JSON.stringify(currency.byLang.en) === JSON.stringify(["15.5", "20", "50"])
    && JSON.stringify(currency.byLang.pl) === JSON.stringify(["15.5", "20", "50"]),
    "nc9 currency symbols and codes before or after match: " + JSON.stringify(currency));

  /* nc10: Ignored placeholders, step marks, list step labels, URLs, alphanumeric codes, product years. */
  const ignored = N.cardNumbers(
    mk("[step]\n1. Send {PAX_2} and {{order.1}} for Model 2024.\n[alt:Option 2]\nUse B2B UTF-8 v2 at https://example.com/123.",
       "[step]\n1) Wyślij {PAX_9} oraz {{order.7}} dla Edycja 2024.\n[alt:Opcja 5]\nUżyj B2B UTF-8 v2 na https://example.com/999."),
    ["en", "pl"]);
  ck(ignored.differ === false && ignored.byLang.en.length === 0 && ignored.byLang.pl.length === 0,
    "nc10 tokens, step marks, list labels, URLs, codes and product-name years are ignored: " + JSON.stringify(ignored));

  /* nc11: Actionable deadline years are NOT skipped. */
  const deadlineYear = N.cardNumbers(
    mk("Offer valid until 2027.", "Oferta ważna do 2026."),
    ["en", "pl"]);
  ck(deadlineYear.differ === true
    && JSON.stringify(deadlineYear.byLang.en) === JSON.stringify(["2027"])
    && JSON.stringify(deadlineYear.byLang.pl) === JSON.stringify(["2026"]),
    "nc11 actionable deadline year difference is flagged: " + JSON.stringify(deadlineYear));

  /* nc21: number words count in their own language only: Polish "ten" (this) is no ten, and a Polish number word in English
     text is no number (Claudius's rule 1 on Max's ruling: a fact a customer could act on in one language and not the other). */
  const ownLang = N.cardNumbers(mk("This code works at the Sto counter.", "Ten kod działa przy ladzie."), ["en", "pl"]);
  ck(ownLang.differ === false && ownLang.byLang.en.length === 0 && ownLang.byLang.pl.length === 0,
    "nc21 number words count only in their own language: Polish ten and an English text's sto are no numbers: " + JSON.stringify(ownLang));

  /* nc22: the words for one count only where a unit follows that makes them a quantity (one day, jeden dzień); as an article
     they are no number, and a quantity on one side only is still flagged. */
  const article = N.cardNumbers(mk("Pick an option and give us a code.", "Wybierz jedną z opcji i podaj jeden kod albo jedno hasło."), ["en", "pl"]);
  const quantity = N.cardNumbers(mk("Wait one day, then one working day more.", "Poczekaj jeden dzień, potem jeszcze jeden dzień roboczy."), ["en", "pl"]);
  const oneSided = N.cardNumbers(mk("Wait one day.", "Poczekaj chwilę."), ["en", "pl"]);
  ck(article.differ === false && article.byLang.pl.length === 0
    && quantity.differ === false && JSON.stringify(quantity.byLang.pl) === JSON.stringify(["1", "1"])
    && oneSided.differ === true && JSON.stringify(oneSided.byLang.en) === JSON.stringify(["1"]),
    "nc22 the words for one are a number only before a unit (one day, jeden dzień), never as an article: "
    + JSON.stringify({ article: article.byLang, quantity: quantity.byLang, oneSided: oneSided.byLang }));

  /* nc25: Symmetric number-word and 'one' handling across EN and PL: all eight false-warning shapes stay silent, plus digit-vs-word parity. */
  const symmetricPairs = [
    ["pronoun-vs-sztuka", "Unfortunately one of the bundle got scratched.", "Niestety jedna sztuka z paczki się zarysowała."],
    ["one-piece-vs-rzecz", "One piece can travel back on its own within four days.", "Jedną rzecz można odesłać osobno w ciągu czterech dni."],
    ["pronoun-aside", "I can put one aside from the shipment due in 10 days.", "Mogę odłożyć jedną sztukę z dostawy za 10 dni."],
    ["ordinal-vs-cardinal", "Workshops welcome visitors from six years old, and a first sketch drawn at six stays special.", "Warsztaty są dla gości od szóstego roku życia, a pierwszy szkic w wieku sześciu lat zostaje w pamięci."],
    ["one-spot-price", "A ticket for 180 zł covers one spot at the bench.", "Bilet za 180 zł obejmuje jedno miejsce przy stole."],
    ["range-price-one-spot", "Pick any sum from 40 zł to 800 zł; 180 zł covers one spot, plus 15 zł for wrapping.", "Wybierz kwotę od 40 zł do 800 zł; jedno miejsce kosztuje 180 zł, a pakowanie 15 zł."],
    ["two-spots-price", "A voucher of 180 zł buys one spot, and 360 zł buys two.", "Bon na 180 zł daje jedno miejsce, a na 360 zł dwa."],
    ["alone-vs-jednej-osoby", "Each apron is stitched for you alone.", "Każdy fartuch szyjemy specjalnie dla jednej osoby."],
    ["digit-vs-word", "Keep it for 3 days.", "Zachowaj to przez trzy dni."],
    ["digit-vs-ordinal", "Suitable from age 8.", "Odpowiednie od ósmego roku życia."],
  ];
  const badSym = symmetricPairs
    .map(([name, en, pl]) => ({ name, res: N.cardNumbers(mk(en, pl), ["en", "pl"]) }))
    .filter(({ res }) => res.differ);
  ck(badSym.length === 0,
    "nc25 number words, 'one' idioms, ordinals, prices and digit-vs-word match across EN and PL: " + JSON.stringify(badSym));

  /* nc26: True number differences (count or value) still warn, whether digits, cardinals, or ordinals. */
  const repeatDiff = N.cardNumbers(
    mk("A replacement ships within four working days, or another colour ships within four working days.",
       "Zamiennik wyjedzie w ciągu czterech dni roboczych, a w innym kolorze w tym samym czasie."),
    ["en", "pl"]);
  const valueDiff = N.cardNumbers(mk("Reply within 6 days.", "Odpowiedz w ciągu pięciu dni."), ["en", "pl"]);
  const ordDiff = N.cardNumbers(mk("Suitable from age 9.", "Odpowiednie od ósmego roku życia."), ["en", "pl"]);
  ck(repeatDiff.differ === true && JSON.stringify(repeatDiff.byLang.en) === JSON.stringify(["4", "4"]) && JSON.stringify(repeatDiff.byLang.pl) === JSON.stringify(["4"])
    && valueDiff.differ === true && ordDiff.differ === true && JSON.stringify(ordDiff.byLang.pl) === JSON.stringify(["8"]),
    "nc26 true number count and value differences still warn: "
    + JSON.stringify({ repeatDiff: repeatDiff.byLang, valueDiff: valueDiff.byLang, ordDiff: ordDiff.byLang }));

  /* nc12: Single active language card is silent. */
  const oneLang = N.cardNumbers(mk("Pay £20 within 5 days.", ""), ["en", "pl"]);
  ck(oneLang.differ === false, "nc12 single populated language stays silent: " + JSON.stringify(oneLang));
}

async function runStudioAndUiChecks(N, ck = check) {
  clearScratch(SCRATCH);
  const root = path.join(SCRATCH, "projects");
  const pubDir = path.join(SCRATCH, "published");
  fs.mkdirSync(root, { recursive: true });
  fs.mkdirSync(pubDir, { recursive: true });

  const made = await S.newProject(root, "Numbers Studio", [
    { code: "en", name: "English" },
    { code: "pl", name: "Polish" },
  ]);
  const dir = made.dir;
  await S.setPublishFolder(dir, pubDir);
  const shelf = (await S.addTag(dir, "shelf", { en: "General", pl: "Ogolne" })).tag.id;

  const bad = (await S.addCard(dir, shelf, "Refund window", "Refunds arrive within 14 days for £50.")).card.id;
  await S.saveCard(dir, bad, { body: { en: "Refunds arrive within 14 days for £50.", pl: "Zwroty docierają w ciągu 30 dni za 50 PLN." } });

  const good = (await S.addCard(dir, shelf, "Opening hours", "Open daily at 2 pm.")).card.id;
  await S.saveCard(dir, good, { body: { en: "Open daily at 2 pm.", pl: "Czynne codziennie o 14:00." } });

  const retired = (await S.addCard(dir, shelf, "Old notice", "Pay 10 GBP.")).card.id;
  await S.saveCard(dir, retired, { body: { en: "Pay 10 GBP.", pl: "Zapłać 99 PLN." } });
  await S.retireCard(dir, retired);

  const open = await S.openProject(dir);
  const numRows = open.lint.rows.filter(r => r.severity === "warning" && r.kind === "numbers");
  ck(numRows.length === 1 && numRows[0].card === bad && open.lint.warnings === 1 && open.lint.errors === 0
    && numRows[0].go && numRows[0].go.section === "cards" && numRows[0].go.id === bad && numRows[0].go.field === "body",
    "nc13 numbers mismatch is a warning row in openProject findings with Jump to card body, skipping equal & retired cards: "
    + JSON.stringify(numRows));

  const linted = await S.lintProject(dir);
  ck(linted.warnings === 1 && linted.rows.some(r => r.severity === "warning" && r.kind === "numbers" && r.card === bad),
    "nc14 lintProject includes the numbers warning");

  const plan = await S.publishPlan(dir);
  ck(plan.lint.warnings === 1 && plan.lint.rows.some(r => r.kind === "numbers" && r.card === bad),
    "nc15 publishPlan includes the numbers warning in the publish warning count");

  /* Numbers warning never refuses publish even without an override note. */
  const pub = await S.publishProject(dir, "");
  ck(pub && pub.refused === null && !!pub.ec,
    "nc16 publishProject does not refuse publish over a numbers warning: " + JSON.stringify(pub));

  /* UI rendering on lint screen + publish cover. */
  const { page, node } = loadPage({ uiLang: "en" });
  Object.assign(page.S, {
    dir, open, screen: "project", section: "lint", lfilter: "all", lintAs: "list",
    lang: "en", sel: null, stats: null, plan, planDesks: null, coverWarn: false,
  });
  page.paintLint();
  const lintHtml = node("#main").innerHTML;
  ck(lintHtml.includes("Numbers differ between languages") && lintHtml.includes("Warning") && lintHtml.includes("14") && lintHtml.includes("30"),
    "nc17 paintLint renders numbers mismatch warning with English label and per-language numbers");
  const pl = loadPage({ uiLang: "pl" });
  Object.assign(pl.page.S, { dir, open, screen: "project", section: "lint", lfilter: "all", lintAs: "list", lang: "pl", sel: null, stats: null, plan, planDesks: null, coverWarn: false });
  pl.page.paintLint();
  ck(pl.node("#main").innerHTML.includes("Liczby r\u00f3\u017cni\u0105 si\u0119 w zale\u017cno\u015bci od j\u0119zyka"),
    "nc23 the numbers warning is said in Polish in Claudette's words");

  const cover = page.coverHtml().replace(NB, " ");
  ck(cover.includes("1 warning") && cover.includes("Publish with the warnings unfixed"),
    "nc18 publish cover displays the warning count and unfixed-warnings tick");

  /* Editing PL to match EN clears the warning on saveCard. */
  const saved = await S.saveCard(dir, bad, { body: { pl: "Zwroty docierają w ciągu 14 dni za 50 PLN." } });
  ck(saved.lint.warnings === 0 && !saved.lint.rows.some(r => r.kind === "numbers"),
    "nc19 fixing the differing number clears the warning on saveCard");
}

/* nc24: A NUMBERS WARNING THE LEAD HAS LEFT AS IT IS (Max, 2026-11-15: "Not every change requires corection in both languages")
 * goes by the rule every left finding goes by (src/findings-left.mjs): not listed, not counted, kept in project.json, back when its
 * numbers change (its fingerprint is its own line of numbers) and when its card does (the card's hash); the publish plan, which
 * shows everything, still counts it. */
async function runLeftNumbers() {
  clearScratch(SCRATCH);
  const root = path.join(SCRATCH, "projects");
  fs.mkdirSync(root, { recursive: true });
  const made = await S.newProject(root, "Numbers Left", [{ code: "en", name: "English" }, { code: "pl", name: "Polish" }]);
  const dir = made.dir;
  const shelf = (await S.addTag(dir, "shelf", { en: "General", pl: "Ogolne" })).tag.id;
  const card = (await S.addCard(dir, shelf, "Refund window", "Refunds arrive within 14 days for 50 GBP.")).card.id;
  await S.saveCard(dir, card, { body: { en: "Refunds arrive within 14 days for 50 GBP.", pl: "Zwroty docierają w ciągu 30 dni za 50 PLN." } });
  const row = (await S.openProject(dir)).lint.rows.find((r) => r.kind === "numbers" && r.card === card);
  const left = row ? await S.leaveFinding(dir, card, row.why, null) : null;
  const again = await S.openProject(dir);
  const plan = await S.publishPlan(dir);
  const edited = await S.saveCard(dir, card, { body: { pl: "Zwroty docierają w ciągu 31 dni za 50 PLN." } });
  const back = edited.lint.rows.find((r) => r.kind === "numbers" && r.card === card);
  check(!!row && !!left && left.left === true && left.lint.warnings === 0 && !left.lint.rows.some((r) => r.kind === "numbers")
    && again.lint.warnings === 0 && !again.lint.rows.some((r) => r.kind === "numbers")
    && plan.lint.warnings === 1 && plan.lint.rows.some((r) => r.kind === "numbers" && r.card === card)
    && edited.lint.warnings === 1 && !!back && back.why !== row.why,
    "nc24 a numbers warning left as it is is neither listed nor counted, in the answer and at the next open, while the publish plan still counts it, and it comes back when its numbers change: "
    + JSON.stringify({ left: left && [left.left, left.lint.warnings], open: again.lint.warnings, plan: plan.lint.warnings, back: back && back.why }));
}

async function runPlantProofs(N) {
  const PLANTS = [
    {
      name: "numbers-differ-guard",
      file: "src/numbers.mjs",
      reds: ["nc1", "nc2"],
      from: "const differ = keys.length >= 2 && keys.some(k => !sameList(k, keys[0])); /* plant:numbers-differ */",
      to: "const differ = false;",
    },
    {
      name: "numbers-words-map",
      file: "src/numbers.mjs",
      reds: ["nc4"],
      from: "const match = words[word]; /* plant:numbers-words */",
      to: "const match = undefined;",
    },
    {
      name: "numbers-word-lang",
      file: "src/numbers.mjs",
      reds: ["nc21"],
      from: "words = wordsFor(lang); /* plant:numbers-word-lang */",
      to: "words = WORD_NUMBERS;",
    },
    {
      name: "numbers-one-unit",
      file: "src/numbers.mjs",
      reds: ["nc22"],
      from: "quantity = oneIsQuantity(tokens, i, lang); /* plant:numbers-one-unit */",
      to: "quantity = true;",
    },
    {
      name: "numbers-time-norm",
      file: "src/numbers.mjs",
      reds: ["nc7"],
      from: "const key = \"time:\" + pad2(h) + \":\" + pad2(m); /* plant:numbers-time */",
      to: "const key = \"num:\" + String(h);",
    },
    {
      name: "numbers-ordinals",
      file: "src/numbers.mjs",
      reds: ["nc25"],
      from: "const WORDS_BY_LANG = { en: Object.assign({}, EN_ONES, EN_TENS, EN_ORDINALS), pl: Object.assign({}, PL_FORMS, PL_TENS, PL_HUNDREDS, PL_ORDINALS) }; /* plant:numbers-ordinals */",
      to: "const WORDS_BY_LANG = { en: Object.assign({}, EN_ONES, EN_TENS), pl: Object.assign({}, PL_FORMS, PL_TENS, PL_HUNDREDS) };",
    },
  ];

  for (const p of PLANTS) {
    if (PLANTS_OFF) {
      skip("plant " + p.name + " turns " + p.reds.join(", ") + " red (ETIUDA_PLANTS=off)");
      continue;
    }
    const seen = [];
    const ck = (cond, line) => { if (!cond) seen.push(String(line).split(" ")[0]); };
    try {
      const real = fs.readFileSync(path.join(ROOT, p.file), "utf8");
      const pDir = path.join(SCRATCH, "plant-" + p.name);
      fs.mkdirSync(pDir, { recursive: true });
      const at = path.join(pDir, path.basename(p.file));
      fs.writeFileSync(at, plantText(real, p.from, p.to, p.file));
      const planted = await import(pathToFileURL(at).href);
      await runUnitChecks(planted, ck);
    } catch (e) {
      seen.push("broken:" + (e && e.message ? e.message : String(e)));
    }
    check(p.reds.every(id => seen.includes(id)) && !seen.some(s => s.startsWith("broken:")),
      "nc20 plant " + p.name + " turns " + p.reds.join(", ") + " red: " + JSON.stringify(seen));
  }
}

async function main() {
  if (ONLY === "nc24") {
    await runLeftNumbers();
    dropScratch(SCRATCH, "numbers-check");
    return Math.min(failed, 77);
  }
  const N = await import("../src/numbers.mjs");
  await runUnitChecks(N);
  await runStudioAndUiChecks(N);
  await runLeftNumbers();
  await runPlantProofs(N);
  copyPlants({
    root: ROOT, self: SELF, label: "numbers-check", onlyVar: "NUMBERS_ONLY", check, skip: (line) => skip(line), timeout: 120000,
    plants: [{ mark: "left-numbers", leg: "nc24", rel: "src/studio.mjs", line: "  const numberWarns = numbersWarnings(draft);" }],
  });
  dropScratch(SCRATCH, "numbers-check");
  process.stdout.write("#counts checks=" + asserted + " skipped=" + skipped + " failed=" + failed + " expected=" + EXPECTED + "\n");
  if (asserted + skipped !== EXPECTED) {
    process.stderr.write("SUITE DID NOT COMPLETE: " + (asserted + skipped) + " of " + EXPECTED + " checks ran\n");
    return 78;
  }
  process.stdout.write("numbers-check  " + asserted + " assertion(s), " + skipped + " skipped, " + failed + " failure(s)\n");
  return Math.min(failed, 77);
}

main().then(
  c => process.exit(c),
  e => { process.stderr.write(String(e && e.stack || e) + "\n"); process.exit(2); }
);
