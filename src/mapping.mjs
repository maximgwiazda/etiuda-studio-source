/* COLUMNS TO FIELDS, AND THE OVERRIDE THAT BEATS EVERY RULE BELOW.
 *
 * A macro export names its columns whatever the platform that wrote it felt like naming them,
 * so mapping is a guess, and the whole design here is about making the guess auditable:
 *
 *   - Every column gets a verdict, including the ones nothing matched. A column silently
 *     dropped is content silently lost, and the importer's report names each one.
 *   - Every verdict says WHICH RULE decided it, by name. "title_en was mapped" is an
 *     assertion; "title_en -> title.en by the suffix rule" is a finding somebody can argue
 *     with, which is what a mapping screen has to show.
 *   - The manual override table beats every rule, is applied before them rather than after,
 *     and an override naming a column the CSV does not have is an error rather than a shrug:
 *     a mapping that quietly does nothing is worse than one that refuses.
 *
 * THE FIELD VOCABULARY IS THE ENGINE'S, not this file's invention: a format 2 card carries
 * `title`, `body` and `note` keyed by language code, one `shelf`, a list of `requests`, and one
 * `k` - the search keyword bag, which is a single string shared by every language for the reason
 * the engine gives at the site and the spec repeats in 2.4: the words somebody types to find a
 * card only accumulate, and splitting them asks which language a reference code belongs to.
 * `id` and `role` are the two columns that are not card fields: the first is the author's own
 * identity for the row, the second is a value the card's text may refer to.
 */

import * as Engine from "./engine.mjs";
import { noteOf } from "./refusal.mjs";

/** The fields a column can land on. `lang: true` means the field is keyed by language code
 *  and a column mapping to it must say which language it is in. */
const FIELDS = {
  id: { lang: false, what: "the author's own identity for the row" },
  shelf: { lang: false, what: "the category key the card is filed under" },
  requests: { lang: false, what: "the intent clauses this card answers, separated by ;" },
  role: { lang: false, what: "who is on the chat, the value {ROLE} fills" },
  /* ONE BAG AND NOT ONE PER LANGUAGE, so `lang: false` and a second keyword column is an
     ambiguity the override table has to settle rather than a second language's bag. A pile
     carrying "Keywords (EN)" and "Keywords (PL)" is therefore refused until somebody says which
     is the bag or merges them, which is the right answer: merging two columns silently would
     write a bag whose provenance nothing records. */
  keys: { lang: false, what: "the search keywords, one bag shared by every language" },
  title: { lang: true, what: "the card's title" },
  body: { lang: true, what: "the card's text" },
  note: { lang: true, what: "the card's note, which the desk shows beside the card" },
};

/* The names each platform uses, lower-cased and stripped to letters and digits so that
   "Macro: Title", "macro_title" and "Macro Title" are one key. Kept as data rather than as a
   chain of regexes, because a source adapter is added by adding rows here. */
/* THE POLISH NAMES SINCE THE SENSE PASS OF 2026-09-22 (item 4), because a spreadsheet made on a
   Polish desk is headed in Polish and every such file ended at a refusal. Each is the folded
   key of a word a person writes over that column: "Tytuł" is tytul, "Treść" is tresc,
   "Odpowiedź" is odpowiedz. "Temat" is a title and "Tematy" is not taken, because "topics" here
   means intents and the Polish plural would claim the wrong one. */
const ALIASES = {
  id: ["id", "macroid", "key", "reference", "externalid", "identifier",
       "identyfikator", "klucz"],
  shelf: ["category", "folder", "group", "tag", "tags", "section", "categorykey", "shelf",
          "kategoria", "kategorie", "grupa", "dzial", "sekcja"],
  requests: ["intents", "intent", "requests", "topics", "usecases", "triggers",
             "intencje", "intencja", "prosby"],
  role: ["role", "who", "persona", "speaker", "rola", "kto"],
  keys: ["k", "keywords", "keyword", "searchterms", "searchwords", "searchkeywords",
         "synonyms", "aliases", "terms", "slowakluczowe", "slowokluczowe", "synonimy"],
  title: ["title", "name", "subject", "macroname", "macrotitle", "shortcut", "label",
          "tytul", "nazwa", "temat", "tytulmakra", "nazwamakra", "skrot", "etykieta"],
  body: ["body", "text", "content", "message", "answer", "reply", "response", "macrotext",
         "cannedresponse", "bodyplaintext", "bodymarkdown", "bodyhtml", "responsetext",
         "replytext", "messagetext",
         "tresc", "tekst", "odpowiedz", "wiadomosc", "zawartosc", "trescmakra"],
  note: ["note", "comment", "internalnote", "internalcomment", "description", "remark",
         "notatka", "komentarz", "uwaga", "uwagi", "opis"],
};

/* A language is named by a suffix, a prefix, or a parenthesis: body_en, en_body, "Body (PL)".
   Two letters only, because a column called "Body (English)" is rarer than a column called
   "Body (Engineering)" and a wrong guess here mislabels a whole language. */
const LANG_RE = /^(?:([a-z]{2})[_\s-]+(.*)|(.*?)[_\s-]+([a-z]{2})|(.*?)\s*\(([a-z]{2})\))$/;

/* A POLISH HEADING KEEPS ITS LETTERS' BASES (sense pass 2026-09-22, item 4). The key stripped
   everything outside a-z, so "Treść" became "tre" and no alias could ever name it. Diacritics
   are folded first, and "ł", which Unicode does not decompose, by hand. */
function key(header) {
  return String(header || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/ł/g, "l").replace(/[^a-z0-9]+/g, "");
}

/* Polish alias keys, as introduced in the sense pass of 2026-09-22 (item 4). */
const POLISH_KEYS = [
  "identyfikator", "klucz",
  "kategoria", "kategorie", "grupa", "dzial", "sekcja",
  "intencje", "intencja", "prosby",
  "rola", "kto",
  "slowakluczowe", "slowokluczowe", "synonimy",
  "tytul", "nazwa", "temat", "tytulmakra", "nazwamakra", "skrot", "etykieta",
  "tresc", "tekst", "odpowiedz", "wiadomosc", "zawartosc", "trescmakra",
  "notatka", "komentarz", "uwaga", "uwagi", "opis",
];
function isPolishHeader(header) {
  return /[ąćęłńóśźż]/i.test(header) || POLISH_KEYS.includes(key(header));
}


/* A LANGUAGE NAMED IN WORDS, "Comment (English)" or "Treść (polski)": every two-letter code's
   name in English, in Polish and in itself, as the platform's own Intl names it, folded by key().
   A code Intl has no name for answers with the code, and is left out. */
let NAMED = null;
function languageNamed(word) {
  if (!NAMED) {
    NAMED = new Map();
    const a = "abcdefghijklmnopqrstuvwxyz";
    for (const x of a) for (const y of a) {
      const code = x + y;
      [["en"], ["pl"], [code]].forEach(loc => {
        let name = "";
        try { name = new Intl.DisplayNames(loc, { type: "language" }).of(code) || ""; }
        catch { name = ""; }
        const k = key(name);
        if (k && k !== code && !NAMED.has(k)) NAMED.set(k, code);
      });
    }
  }
  return NAMED.get(key(word)) || null;
}
const NAME_RE = /^(.*?)\s*\(([^()]+)\)$|^(.*?)[_\s-]+([^_\s-]+)$/;

/* A COLUMN HEADED BY A BARE LANGUAGE CODE IS THAT LANGUAGE'S REPLY TEXT.
   People head language columns with the bare code all the time (pl, en, PL, EN).
   Checked after aliases so that a column like "id" keeps its identity field.

   ONLY THE LANGUAGES THE PINNED ENGINE HAS OF ITS OWN, and not every code Intl can name (verdict
   on board 776). A bare heading has no field word beside it to say it is text, and nearly every
   two-letter word names some language: "No" and "Nr" head a numbering column, "To" a recipient.
   Claimed as text, such a column became the primary, since the primary is the first language a
   body column names, and the sheet's real text was dropped. The affix and named rules above keep
   every code, because there the field word already says the column is text. */
function knownLanguage(code) {
  if (!/^[a-z]{2}$/.test(code)) return null;
  return Engine.builtInLangs().includes(code) ? code : null;
}

/** One column's verdict. `field` null means nothing claimed it. */
function mapColumn(header) {
  const raw = String(header || "").trim();
  const flat = raw.toLowerCase();
  const m = LANG_RE.exec(flat);
  if (m) {
    const lang = (m[1] || m[4] || m[6] || "").trim();
    const rest = (m[2] || m[3] || m[5] || "").trim();
    const k = key(rest);
    for (const f of Object.keys(ALIASES)) {
      if (!FIELDS[f].lang) continue;
      if (ALIASES[f].includes(k)) return { header: raw, field: f, lang, rule: "language affix" };
    }
  }
  const n = NAME_RE.exec(raw);
  const named = n ? languageNamed(n[2] || n[4]) : null;
  if (named) {
    const k = key(n[1] != null ? n[1] : n[3]);
    for (const f of Object.keys(ALIASES)) {
      if (!FIELDS[f].lang) continue;
      if (ALIASES[f].includes(k)) return { header: raw, field: f, lang: named, rule: "language named" };
    }
  }
  const k = key(raw);
  for (const f of Object.keys(ALIASES)) {
    if (!ALIASES[f].includes(k)) continue;
    /* A bare "body" with no language on it is the primary language's, which is the one
       assumption in this file and the one worth naming in the report. */
    return FIELDS[f].lang
      ? { header: raw, field: f, lang: null, rule: "alias, no language named" }
      : { header: raw, field: f, lang: null, rule: "alias" };
  }
  const bare = knownLanguage(flat);
  if (bare) return { header: raw, field: "body", lang: bare, rule: "bare language code" };
  return { header: raw, field: null, lang: null, rule: "nothing claimed it" };
}

/** The whole header row, with the override table applied first.
 *  An override is `{ "<header>": "<field>" }` or `{ "<header>": "<field>.<lang>" }`, and
 *  `{ "<header>": null }` drops a column deliberately, which is a decision worth recording
 *  rather than a column that happens to match nothing. */
function mapHeaders(headers, override) {
  const ov = override || {};
  const errorNotes = [];
  for (const h of Object.keys(ov)) {
    if (!headers.includes(h))
      errorNotes.push(noteOf("the column override names a column the file does not have: \"{H}\"", /* plant:wf-override */
        { H: h }));
  }
  const cols = headers.map(h => {
    if (Object.prototype.hasOwnProperty.call(ov, h)) {
      const v = ov[h];
      if (v == null) return { header: h, field: null, lang: null, rule: "override, dropped" };
      const [f, lang] = String(v).split(".");
      if (!FIELDS[f]) {
        errorNotes.push(noteOf("the column override sends \"{H}\" to \"{F}\", which is no field",
          { H: h, F: f }));
        return { header: h, field: null, lang: null, rule: "override, unknown field" };
      }
      if (FIELDS[f].lang && !lang)
        errorNotes.push(noteOf("the column override sends \"{H}\" to {F}, which takes one value per"
          + " language: write {F}.en or {F}.pl", { H: h, F: f }));
      return { header: h, field: f, lang: lang || null, rule: "override" };
    }
    return mapColumn(h);
  });
  /* A HELPDESK CALLS ITS REPLY THE COMMENT, so where no column is the text a column headed
     Comment is, and a Comment beside a Body stays the note. A bare language code does not count
     as a column that is the text here, for the reason below. */
  const bareCode = c => c.rule === "bare language code";
  if (!cols.some(c => c.field === "body" && !bareCode(c))) cols.forEach(c => {
    if (c.field === "note" && c.rule !== "override" && /^(comment|komentarz)/.test(key(c.header)))
      Object.assign(c, { field: "body", rule: "comment, and no other column is the text" });
  });
  /* A BARE CODE NEVER TAKES THE TEXT FROM A COLUMN THAT ALREADY HOLDS IT (verdict on board 776).
     The importer's primary is the first language a body column names, and a text column with no
     language named fills the primary only where no column names it, so "Tytuł, Treść, EN" with EN
     claimed would have made English the primary and dropped Treść without a word. Beside such a
     column a bare code stays unclaimed, as it was before the rule existed, and the importer says
     so; the override table gives it a language when that is what the author meant. */
  if (cols.some(c => c.field === "body" && !c.lang && !bareCode(c))) cols.forEach(c => {
    if (bareCode(c)) Object.assign(c, { field: null, lang: null,
      rule: "bare language code beside a text column with no language named" });
  });
  /* A BARE TEXT COLUMN BESIDE A LANGUAGE-NAMED ONE TAKES THE MAIN LANGUAGE (board 778).
     The importer takes the primary from the first body column that names a language, and a bare
     body column fills the primary only where no column names one. So beside a language-named
     column (like "body_en"), a bare text column (like "Treść") was dropped without a finding
     because English was made primary and Treść had no language. Beside a language-named body
     column, a text column with no language named takes the language its heading declares (or the
     main language of the sheet), so "Tytuł, Treść, body_en" keeps Treść under pl. */
  if (cols.some(c => c.field === "body" && c.lang) && cols.some(c => c.field === "body" && !c.lang)) {
    const sheetHasPl = cols.some(c => isPolishHeader(c.header));
    cols.forEach(c => {
      if (c.field === "body" && !c.lang) {
        const lang = (isPolishHeader(c.header) || sheetHasPl) ? "pl" : "en";
        Object.assign(c, { lang, rule: "alias, main language of the sheet" });
      }
    });
  }
  /* Two columns on one non-language field is an ambiguity the importer must not resolve by
     picking the first: which one is the id decides every card's identity. */
  const collisions = [];
  for (const f of Object.keys(FIELDS)) {
    if (FIELDS[f].lang) continue;
    const on = cols.filter(c => c.field === f);
    const distinct = Array.from(new Set(on.map(c => c.header)));
    if (distinct.length > 1) {
      errorNotes.push(noteOf("columns claiming {F}: {N} ({LIST}). Name one in the override table",
        { F: f, N: distinct.length, LIST: distinct.map(h => JSON.stringify(h)).join(", ") }));
      collisions.push({ field: f, lang: null, columns: distinct, first: distinct[0] });
    }
  }
  for (const f of Object.keys(FIELDS)) {
    if (!FIELDS[f].lang) continue;
    const byLang = {};
    cols.filter(c => c.field === f).forEach(c => {
      const l = c.lang || "?";
      byLang[l] = byLang[l] || [];
      byLang[l].push(c);
    });
    Object.keys(byLang).forEach(l => {
      const on = byLang[l];
      const distinct = Array.from(new Set(on.map(c => c.header)));
      if (distinct.length > 1) {
        const LANGPART = l === "?"
          ? { frame: " {S}", vars: { S: { frame: "with no language named" } } }
          : "." + l;
        errorNotes.push(noteOf("columns claiming {F}{LANGPART}: {N}. Name one in the override table",
          { F: f, LANGPART, N: distinct.length }));
        collisions.push({ field: f, lang: l === "?" ? null : l, columns: distinct, first: distinct[0] });
      }
    });
  }
  return { columns: cols, errors: errorNotes.map(n => n.message), errorNotes, collisions };
}

export { FIELDS, ALIASES, mapColumn, mapHeaders, key };
