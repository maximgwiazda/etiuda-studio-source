/* CARD NUMBER EXTRACTION AND CROSS-LANGUAGE COMPARISON.
 *
 * Extracts numbers a customer could act on from each populated language body of a card,
 * normalising wording, decimals, thousands separators, times, and currencies so equivalent
 * translations stay quiet while differing amounts, dates, or times raise a warning.
 */

const UNITS_KEEP = new Set([
  "am", "pm", "h", "hr", "hrs", "min", "mins", "sec", "secs", "s", "m", "d", "wk", "wks", "mo", "yr", "yrs",
  "kg", "g", "mg", "l", "ml", "km", "cm", "mm", "gb", "mb", "kb", "tb",
  "pln", "eur", "usd", "gbp", "chf", "czk", "sek", "nok", "dkk", "huf", "ron", "bgn", "cad", "aud", "zl", "z\u0142",
]);

const PRODUCT_BEFORE = new Set([
  "model", "edition", "edycja", "series", "seria", "collection", "kolekcja", "version", "wersja",
  "line", "linia", "type", "typ", "catalog", "katalog", "gen", "mk", "pro", "plus", "max", "ultra",
  "air", "mini", "lite", "classic", "standard", "premium", "basic", "enterprise", "plan", "tier",
]);

const PRODUCT_AFTER = new Set([
  "edition", "edycja", "series", "seria", "collection", "kolekcja", "model", "line", "linia", "version", "wersja",
]);

const DEADLINE_BEFORE = new Set([
  "until", "till", "by", "since", "before", "after", "from", "in", "on", "of",
  "do", "od", "przed", "po", "za", "na", "w", "roku", "r",
]);

const EN_ONES = {
  zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9,
  ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16,
  seventeen: 17, eighteen: 18, nineteen: 19,
};

const EN_TENS = {
  twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90,
};

/* Ordinals 4th upward match cardinals/digits identically in both languages; 1st-3rd are omitted so idioms and fractions
   ("first", "a second time", "drugi gatunek", "a third off") stay quiet. */
const EN_ORDINALS = {
  fourth: 4, fifth: 5, sixth: 6, seventh: 7, eighth: 8, ninth: 9, tenth: 10,
  eleventh: 11, twelfth: 12, thirteenth: 13, fourteenth: 14, fifteenth: 15, sixteenth: 16,
  seventeenth: 17, eighteenth: 18, nineteenth: 19,
  twentieth: 20, thirtieth: 30, fortieth: 40, fiftieth: 50, sixtieth: 60, seventieth: 70, eightieth: 80, ninetieth: 90,
};

const PL_FORMS = {
  zero: 0, zera: 0, zeru: 0, zerem: 0, zerze: 0,
  jeden: 1, jedna: 1, jedno: 1, jednego: 1, jednej: 1, jednemu: 1, "jedn\u0105": 1, jednym: 1,
  dwa: 2, dwie: 2, "dw\u00f3ch": 2, dwu: 2, dwaj: 2, dwoma: 2, dwiema: 2,
  trzy: 3, trzech: 3, trzej: 3, trzema: 3,
  cztery: 4, czterech: 4, czterej: 4, czterema: 4,
  "pi\u0119\u0107": 5, "pi\u0119ciu": 5, "pi\u0119cioma": 5,
  "sze\u015b\u0107": 6, "sze\u015bciu": 6, "sze\u015bcioma": 6,
  siedem: 7, siedmiu: 7, siedmioma: 7,
  osiem: 8, "o\u015bmiu": 8, "o\u015bmioma": 8,
  "dziewi\u0119\u0107": 9, "dziewi\u0119ciu": 9, "dziewi\u0119cioma": 9,
  "dziesi\u0119\u0107": 10, "dziesi\u0119ciu": 10, "dziesi\u0119cioma": 10,
  "jedena\u015bcie": 11, jedenastu: 11,
  "dwana\u015bcie": 12, dwunastu: 12,
  "trzyna\u015bcie": 13, trzynastu: 13,
  "czterna\u015bcie": 14, czternastu: 14,
  "pi\u0119tna\u015bcie": 15, "pi\u0119tnastu": 15,
  "szesna\u015bcie": 16, szesnastu: 16,
  "siedemna\u015bcie": 17, siedemnastu: 17,
  "osiemna\u015bcie": 18, osiemnastu: 18,
  "dziewi\u0119tna\u015bcie": 19, "dziewi\u0119tnastu": 19,
};

const PL_TENS = {
  "dwadzie\u015bcia": 20, dwudziestu: 20,
  "trzydzie\u015bci": 30, trzydziestu: 30,
  "czterdzie\u015bci": 40, czterdziestu: 40,
  "pi\u0119\u0107dziesi\u0105t": 50, "pi\u0119\u0107dziesi\u0119ciu": 50,
  "sze\u015b\u0107dziesi\u0105t": 60, "sze\u015b\u0107dziesi\u0119ciu": 60,
  "siedemdziesi\u0105t": 70, "siedemdziesi\u0119ciu": 70,
  "osiemdziesi\u0105t": 80, "osiemdziesi\u0119ciu": 80,
  "dziewi\u0119\u0107dziesi\u0105t": 90, "dziewi\u0119\u0107dziesi\u0119ciu": 90,
};

const PL_HUNDREDS = {
  sto: 100, stu: 100,
  "dwie\u015bcie": 200, dwustu: 200,
  trzysta: 300, trzystu: 300,
  czterysta: 400, czterystu: 400,
  "pi\u0119\u0107set": 500, "pi\u0119ciuset": 500,
  "sze\u015b\u0107set": 600, "sze\u015bciuset": 600,
  siedemset: 700, siedmiuset: 700,
  osiemset: 800, "o\u015bmiuset": 800,
  "dziewi\u0119\u0107set": 900, "dziewi\u0119ciuset": 900,
};

const PL_ORD_ENDINGS = ["y", "a", "e", "ego", "ej", "emu", "\u0105", "ym", "ych", "ymi"];
const PL_ORD_STEMS = [
  [4, "czwart"], [5, "pi\u0105t"], [6, "sz\u00f3st"], [7, "si\u00f3dm"], [8, "\u00f3sm"], [9, "dziewi\u0105t"], [10, "dziesi\u0105t"],
  [11, "jedenast"], [12, "dwunast"], [13, "trzynast"], [14, "czternast"], [15, "pi\u0119tnast"], [16, "szesnast"],
  [17, "siedemnast"], [18, "osiemnast"], [19, "dziewi\u0119tnast"],
  [20, "dwudziest"], [30, "trzydziest"], [40, "czterdziest"], [50, "pi\u0119\u0107dziesi\u0105t"],
  [60, "sze\u015b\u0107dziesi\u0105t"], [70, "siedemdziesi\u0105t"], [80, "osiemdziesi\u0105t"], [90, "dziewi\u0119\u0107dziesi\u0105t"],
];
const PL_ORDINALS = {};
const PL_ORD_TENS = {};
for (const [val, stem] of PL_ORD_STEMS) {
  for (const end of PL_ORD_ENDINGS) {
    const form = stem + end;
    PL_ORDINALS[form] = val;
    if (val >= 20) PL_ORD_TENS[form] = val;
  }
}

const WORD_NUMBERS = Object.assign({}, EN_ONES, EN_TENS, EN_ORDINALS, PL_FORMS, PL_TENS, PL_HUNDREDS, PL_ORDINALS);
/* A number word counts only in its own language: Polish "ten" (this) is no ten, and a word of one table in the other language's
   text is no number. A language with no table counts digits alone. */
const WORDS_BY_LANG = { en: Object.assign({}, EN_ONES, EN_TENS, EN_ORDINALS), pl: Object.assign({}, PL_FORMS, PL_TENS, PL_HUNDREDS, PL_ORDINALS) }; /* plant:numbers-ordinals */
const MULTIPLIERS = { en: { hundred: 100, thousand: 1000 },
  pl: { "tysi\u0105c": 1000, "tysi\u0105ca": 1000, "tysi\u0105ce": 1000, "tysi\u0119cy": 1000 } };
const langOf = (lang) => String(lang || "").toLowerCase().split(/[-_]/)[0];
const wordsFor = (lang) => WORDS_BY_LANG[langOf(lang)] || {};

/* THE WORDS FOR ONE are a number only where the next word is a unit of time, measure, currency, or multiplier that makes
   them a quantity ("one day", "jeden dzie\u0144", "one working day"); as an article, pronoun, or countable object
   ("a code", "jedn\u0105 z opcji", "the new one", "one place", "jedna sztuka") they are no number. */
const ONE_WORDS = new Set(["one", "jeden", "jedna", "jedno", "jednego", "jednej", "jednemu", "jedn\u0105", "jednym"]);
const ONE_UNITS = {
  en: new Set(["working", "business", "calendar", "day", "days", "night", "nights", "hour", "hours", "minute", "minutes",
    "week", "weeks", "month", "months", "year", "years", "pound", "euro", "dollar", "zloty", "percent", "kilogram", "kg",
    "hundred", "thousand", "million"]),
  pl: new Set(["dzie\u0144", "dnia", "dniu", "doba", "doby", "dob\u0119", "dobie", "godzina", "godziny", "godzin\u0119", "godzinie",
    "minuta", "minuty", "minut\u0119", "tydzie\u0144", "tygodnia", "tygodniu", "miesi\u0105c", "miesi\u0105ca", "miesi\u0105cu",
    "rok", "roku", "noc", "nocy", "z\u0142oty", "z\u0142otego", "z\u0142", "zl", "euro", "funt",
    "funta", "dolar", "dolara", "procent", "kilogram", "kg", "tysi\u0105c", "tysi\u0105ca"]),
};
function oneIsQuantity(tokens, i, lang) {
  const units = ONE_UNITS[langOf(lang)];
  return !!units && i + 1 < tokens.length && units.has(tokens[i + 1]);
}

const SENTENCE_PUNCT = new Set([".", ",", ";", "!", "?"]);

function pad2(n) {
  return String(n).padStart(2, "0");
}

function sameList(a, b) {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

function displayKey(key) {
  if (key.startsWith("time:")) return key.slice(5);
  if (key.startsWith("num:")) return key.slice(4);
  return key;
}

function stripNonNumbers(rawText) {
  let s = rawText
    .replace(/\{\{[^}]*\}\}/g, " ")
    .replace(/%%[^%]*%%/g, " ")
    .replace(/\$\([^)]*\)/g, " ")
    .replace(/\{[^}]*\}/g, " ");

  s = s.split(/\r?\n/).map((line) => line
    .replace(/\[(?:step|alt|branch)(?::[^\]]*)?\]/gi, " ")
    .replace(/^[ \t]*\d+[.)](?=[ \t]+\S)/, " "))
    .join("\n");

  s = s.replace(/https?:\/\/\S+/gi, " ").replace(/www\.\S+/gi, " ");

  /* Alphanumeric codes such as B2B, UTF-8, v2, HTTP/2, ID123, preserving currency prefixes like PLN50. */
  s = s.replace(
    /\b(?!(?:PLN|EUR|USD|GBP|CHF|CZK|SEK|NOK|DKK|HUF|RON|BGN|CAD|AUD)\d)[A-Za-z]+[-/]?\d+(?:[./-]\d+)*[A-Za-z0-9_-]*\b/g,
    " ",
  );

  /* Trailing letters attached to digits: keep only recognised units/currencies (plus lowercase g/l) and am/pm. */
  s = s.replace(/\b(\d+)([A-Za-z\u0142_][A-Za-z0-9_-]*)\b/g, (whole, digits, suffix) => {
    const low = suffix.toLowerCase();
    if (!UNITS_KEEP.has(low)) return " ";
    if ((suffix === "G" || suffix === "L")) return " ";
    return digits + " " + suffix;
  });

  /* Hyphen/dash between numbers denotes a range (e.g. 3-5), not a minus sign. */
  s = s.replace(/(\d)\s*[-\u2013\u2014]\s*(\d)/g, "$1 $2");
  return s;
}

function extractTimes(text, outKeys) {
  const pushTime = (h, m) => {
    const key = "time:" + pad2(h) + ":" + pad2(m); /* plant:numbers-time */
    outKeys.push(key);
  };

  let s = text.replace(/\b([01]?\d|2[0-3]):([0-5]\d)(?:\s*(a\.?m\.?|p\.?m\.?))?\b/gi, (_, hStr, mStr, ap) => {
    let h = Number(hStr);
    const m = Number(mStr);
    if (ap) {
      const pm = ap.toLowerCase().startsWith("p");
      if (pm && h < 12) h += 12;
      else if (!pm && h === 12) h = 0;
    }
    pushTime(h, m);
    return " ";
  });

  s = s.replace(/\b(1[0-2]|0?[1-9])\s*(a\.?m\.?|p\.?m\.?)\b/gi, (_, hStr, ap) => {
    let h = Number(hStr);
    const pm = ap.toLowerCase().startsWith("p");
    if (pm && h < 12) h += 12;
    else if (!pm && h === 12) h = 0;
    pushTime(h, 0);
    return " ";
  });

  s = s.replace(/\b(?:godz\.?|godzinie|o|od|do)\s+([01]?\d|2[0-3])\.([0-5]\d)\b(?![ \t]*(?:%|z\u0142|zl|pln|eur|usd|gbp|\u20ac|\u00a3|\$))/gi,
    (_, hStr, mStr) => {
      pushTime(Number(hStr), Number(mStr));
      return " ";
    });

  return s;
}

function stripProductYears(text) {
  return text.replace(/\b((?:19|20)\d{2})\b/g, (year, _, offset, full) => {
    const after = full.slice(offset + year.length);
    if (/^[ \t]*(?:%|\u20ac|\u00a3|\$|z\u0142|zl\b|pln\b|eur\b|usd\b|gbp\b|days?\b|dni\b|hours?\b)/i.test(after)) {
      return year;
    }
    const before = full.slice(Math.max(0, offset - 40), offset);
    const prevMatch = before.match(/([A-Za-z\u00c0-\u024f]+)\s*$/);
    const prev = prevMatch ? prevMatch[1].toLowerCase() : "";
    const nextMatch = after.match(/^\s*([A-Za-z\u00c0-\u024f]+)/);
    const next = nextMatch ? nextMatch[1].toLowerCase() : "";

    if (DEADLINE_BEFORE.has(prev)) return year;
    if (PRODUCT_BEFORE.has(prev) || PRODUCT_AFTER.has(next)) return " ";
    return year;
  });
}

function extractDigitNumbers(text, outKeys) {
  const pushNum = (raw) => {
    const cleaned = raw.replace(/[\s\u00a0\u202f]+/g, "").replace(/,(?=\d{3}(?:\D|$))/g, "").replace(",", ".");
    const n = Number(cleaned);
    if (Number.isFinite(n)) outKeys.push("num:" + String(n));
  };

  /* Dotted DMY dates such as 15.05.2026: split into day, month, year numbers. */
  let s = text.replace(/\b(\d{1,2})\.(\d{1,2})\.(\d{4})\b/g, (_, d, m, y) => {
    pushNum(d);
    pushNum(m);
    pushNum(y);
    return " ";
  });

  /* Grouped thousands (1 000, 1\u00a0000, 1,000, 1,000.50). */
  s = s.replace(/(?<![\d]|[\d][.,])\d{1,3}(?:(?:[ \u00a0\u202f]\d{3})+(?:[.,]\d+)?|(?:,\d{3})+(?:\.\d+)?)(?!\d|[.,]\d)/g, (m) => {
    pushNum(m);
    return " ";
  });

  /* Plain integers and decimals (14, 1.5, 1,5, 15.50). */
  s = s.replace(/(?<![\d]|[\d][.,])\d+(?:[.,]\d+)?(?!\d|[.,]\d)/g, (m) => {
    pushNum(m);
    return " ";
  });

  return s;
}

function extractWordNumbers(text, outKeys, lang) {
  let words = WORD_NUMBERS;
  words = wordsFor(lang); /* plant:numbers-word-lang */
  const mult = MULTIPLIERS[langOf(lang)] || {};
  const tokens = (text.toLowerCase().match(/[\p{L}]+(?:-[\p{L}]+)*|[.,;!?]/gu) || []);
  for (let i = 0; i < tokens.length; i++) {
    const word = tokens[i];
    if (SENTENCE_PUNCT.has(word)) continue;
    if (word.includes("-")) {
      const parts = word.split("-");
      const unitPart = EN_ONES[parts[1]] != null ? EN_ONES[parts[1]] : EN_ORDINALS[parts[1]];
      if (words === WORDS_BY_LANG.en && parts.length === 2 && EN_TENS[parts[0]] != null && unitPart >= 1 && unitPart <= 9) {
        outKeys.push("num:" + String(EN_TENS[parts[0]] + unitPart));
        continue;
      }
    }
    if (ONE_WORDS.has(word)) {
      let quantity = false;
      quantity = oneIsQuantity(tokens, i, lang); /* plant:numbers-one-unit */
      if (!quantity) continue;
    }

    const match = words[word]; /* plant:numbers-words */
    if (match === undefined) continue;

    /* Combine tens + ones (e.g. "twenty one" or "dwadzie\u015bcia cztery") or multipliers ("two hundred", "dwa tysi\u0105ce"). */
    let total = match;
    if ((EN_TENS[word] != null || PL_TENS[word] != null || PL_ORD_TENS[word] != null) && i + 1 < tokens.length) {
      const unitVal = words[tokens[i + 1]];
      if (unitVal >= 1 && unitVal <= 9) {
        total += unitVal;
        i += 1;
      }
    }
    if (i + 1 < tokens.length && mult[tokens[i + 1]] != null) {
      total *= mult[tokens[i + 1]];
      i += 1;
    }
    outKeys.push("num:" + String(total));
  }
}

export function extractNumbers(text, lang = "") {
  if (typeof text !== "string" || !text.trim()) return { keys: [], numbers: [] };
  const keys = [];
  let s = stripNonNumbers(text);
  s = extractTimes(s, keys);
  s = stripProductYears(s);
  s = extractDigitNumbers(s, keys);
  extractWordNumbers(s, keys, lang);
  keys.sort();
  return { keys, numbers: keys.map(displayKey) };
}

export function cardNumbers(card, langs) {
  const body = card && card.body && typeof card.body === "object" ? card.body : {};
  const list = Array.isArray(langs) && langs.length ? langs : Object.keys(body);
  const byLang = {};
  const keysByLang = {};
  const languages = [];

  for (const lang of list) {
    const raw = typeof body[lang] === "string" ? body[lang] : "";
    if (!raw.trim()) continue;
    const got = extractNumbers(raw, lang);
    languages.push(lang);
    byLang[lang] = got.numbers;
    keysByLang[lang] = got.keys;
  }

  const keys = languages.map((l) => keysByLang[l]);
  const differ = keys.length >= 2 && keys.some(k => !sameList(k, keys[0])); /* plant:numbers-differ */
  return { byLang, keysByLang, languages, differ };
}

function langCodes(langs) {
  return Array.isArray(langs) && langs.length
    ? langs.map((l) => (typeof l === "string" ? l : l && l.code)).filter(Boolean)
    : ["en"];
}

function keysChanged(wasKeys, nowKeys) {
  const nowSet = new Set(nowKeys);
  const out = [];
  const seen = new Set();
  for (const k of wasKeys) {
    if (!nowSet.has(k) && !seen.has(k)) {
      seen.add(k);
      out.push(k);
    }
  }
  return out;
}

export function diffCardNumbers(cardWas, cardNow, langs) {
  if (!cardWas || !cardNow || cardNow.retired) return [];
  const wasBody = cardWas.body && typeof cardWas.body === "object" ? cardWas.body : {};
  const nowBody = cardNow.body && typeof cardNow.body === "object" ? cardNow.body : {};
  const list = Array.isArray(langs) && langs.length ? langCodes(langs) : Object.keys(wasBody);
  const seen = new Set();
  const out = [];

  for (const l of list) {
    const rawWas = typeof wasBody[l] === "string" ? wasBody[l] : "";
    if (!rawWas.trim()) continue;
    const rawNow = typeof nowBody[l] === "string" ? nowBody[l] : "";
    const wasKeys = extractNumbers(rawWas, l).keys;
    const nowKeys = extractNumbers(rawNow, l).keys;
    const removed = keysChanged(wasKeys, nowKeys); /* plant:numbers-diff */
    for (const k of removed) {
      if (seen.has(k)) continue;
      seen.add(k);
      out.push({ key: k, display: displayKey(k) });
    }
  }
  return out;
}

export function cardHoldsNumberKey(card, numberKey, langs) {
  if (!card || card.retired || !numberKey) return [];
  const body = card.body && typeof card.body === "object" ? card.body : {};
  const list = Array.isArray(langs) && langs.length ? langCodes(langs) : Object.keys(body);
  const langsFound = [];
  for (const l of list) {
    const raw = typeof body[l] === "string" ? body[l] : "";
    if (!raw.trim()) continue;
    const got = extractNumbers(raw, l);
    if (got.keys.includes(numberKey)) langsFound.push(l); /* plant:numbers-holds */
  }
  return langsFound;
}

export function syncChangedWatches(cards, cardWas, cardNow, prevWatches, langs) {
  const list = langCodes(langs);
  const cardList = Array.isArray(cards) ? cards : [];
  const next = (Array.isArray(prevWatches) ? prevWatches : []).map((w) => Object.assign({}, w, {
    dismissed: Array.isArray(w && w.dismissed) ? w.dismissed.slice() : [],
  }));

  if (cardWas && cardNow && !cardNow.retired) {
    /* If an edited card restores a number it previously changed, drop that watch from this card. */
    const restored = new Set(diffCardNumbers(cardNow, cardWas, list).map(x => x.key));
    for (let i = next.length - 1; i >= 0; i--) {
      if (next[i].from === cardNow.id && restored.has(next[i].key)) next.splice(i, 1);
    }

    const changed = diffCardNumbers(cardWas, cardNow, list);
    for (const item of changed) {
      const otherMatches = cardList.filter(
        c => c && c.id !== cardNow.id && !c.retired && cardHoldsNumberKey(c, item.key, list).length > 0,
      );
      const already = next.some(w => w.from === cardNow.id && w.key === item.key);
      if (!already) {
        if (otherMatches.length) next.push({ key: item.key, display: item.display, from: cardNow.id, dismissed: [] }); /* plant:numbers-surface */
      }
    }
  }

  return next.filter((w) => w && w.key && cardList.some(
    c => c && c.id !== w.from && !c.retired && cardHoldsNumberKey(c, w.key, list).length > 0,
  ));
}

/** The watches with card `id`'s row for `numberKey` from card `fromId` dismissed: the same number changed in another card keeps its
 *  own watch, and its row stands. A new list; the given one is not changed. */
export function dismissWatches(watches, id, numberKey, fromId) {
  return (Array.isArray(watches) ? watches : []).map((w) => {
    if (!w || w.key !== String(numberKey || "")) return w;
    if (w.from !== String(fromId || "")) return w; /* plant:numbers-dismiss-from */
    const seen = Array.isArray(w.dismissed) ? w.dismissed.slice() : [];
    if (!seen.includes(id)) seen.push(id);
    return Object.assign({}, w, { dismissed: seen });
  });
}

export function changedNumberRows(draft, watches, titleOf) {
  if (!Array.isArray(watches) || !watches.length) return [];
  const cards = (draft && draft.cards) || [];
  const rawLangs = Array.isArray(draft && draft.langs) && draft.langs.length
    ? draft.langs : (Array.isArray(draft && draft.languages) ? draft.languages : []);
  const langs = langCodes(rawLangs);
  const out = [];
  const seen = new Set();

  for (const w of watches) {
    if (!w || !w.key) continue;
    const fromCard = cards.find(c => c && c.id === w.from);
    const fromTitle = fromCard ? titleOf(draft, fromCard) : "";
    const dismissed = new Set(Array.isArray(w.dismissed) ? w.dismissed : []);
    for (const c of cards) {
      if (!c || c.retired || c.id === w.from || dismissed.has(c.id)) continue;
      const langsFound = cardHoldsNumberKey(c, w.key, langs);
      if (!langsFound.length) continue;
      const pair = c.id + "\u0000" + w.key;
      if (seen.has(pair)) continue;
      seen.add(pair);
      const display = w.display || displayKey(w.key);
      out.push({
        severity: "suggestion",
        kind: "changed-number",
        number: display,
        numberKey: w.key,
        from: w.from || "",
        fromTitle,
        langs: langsFound,
        what: "Still uses " + display,
        where: titleOf(draft, c),
        card: c.id,
        go: { section: "cards", id: c.id, field: "body", lang: langsFound[0] || langs[0] || "en" },
        why: fromTitle ? "Removed from " + fromTitle : "Removed from another card",
      });
    }
  }
  return out;
}
