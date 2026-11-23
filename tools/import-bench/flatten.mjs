/* A CATALOG INTO THE SHAPE A CUSTOMER WOULD BRING: a plain text file of replies, no ids, no
 * fields, no structure, and a key beside it that says which stretch came from which card.
 *
 *     flattenCatalog(catalog) -> { text, key }
 *     writeFlatten(outDir, text, key) -> { textAt, keyAt }
 *
 * THE TEXT IS UNHELPED. The key is the answer, and it is a separate file on purpose: a key
 * mixed into the text would make every importer look better than it is. Offsets into the text
 * identify a stretch; the body itself is not copied into the key.
 *
 * RAGGEDNESS IS DETERMINISTIC. The same catalog always writes the same mess, so a scorer run
 * twice is comparable. How the gaps are chosen is in key.ragged.recipe, not inferred from the
 * bytes.
 */
import fs from "node:fs";
import path from "node:path";
import { v2BodyTools } from "../../src/engine.mjs";

const SCHEMA = 1;
const KIND = "etiuda-studio-flatten-key";

const RECIPE = "Cards in catalog order, one stretch per language that has a non-empty pasteable"
  + " body, languages in langs order. Pasteable text is the body as stored for a plain card,"
  + " and the engine's v2Unmark plus v2PartText for steps and alts, so marker lines and alt"
  + " labels do not appear. Between stretches, mulberry32 seeded from the catalog id and the"
  + " card count picks one of three gaps: nothing (a single newline, no blank line, no heading),"
  + " blank (two or three newlines), or heading (two newlines, one heading line, two newlines)."
  + " A heading is, with equal thirds, the card's title in that language, the word Reply or"
  + " Odpowiedz matching the stretch language, or the first four words of the stretch. No id,"
  + " field name, JSON or marker line is written into the text.";

function rng(seed) {
  let a = (seed >>> 0) || 1;
  return function () {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seedOf(catalog) {
  const s = String(catalog.id || "") + ":" + String((catalog.cards || []).length);
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

function firstWords(text, n) {
  return String(text || "").split(/\s+/).filter(Boolean).slice(0, n).join(" ");
}

function pasteable(raw, shape, tools) {
  const s = String(raw == null ? "" : raw).replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const trimmed = s.trim();
  if (!trimmed) return "";
  if (shape !== "steps" && shape !== "alts") return trimmed;
  const unmarked = tools.v2Unmark(trimmed);
  if (!unmarked) return trimmed;
  return unmarked.split(/\n\s*\n/).map(b => tools.v2PartText(b).trim()).filter(Boolean).join("\n\n");
}

function tagsById(catalog) {
  const out = new Map();
  (catalog.tags || []).forEach(t => { if (t && t.id) out.set(String(t.id), t); });
  return out;
}

function flattenCatalog(catalog, opts) {
  const o = opts || {};
  if (!catalog || +catalog.format !== 2)
    throw new Error("flatten wants a format 2 catalog");
  const cards = Array.isArray(catalog.cards) ? catalog.cards : [];
  if (!cards.length) throw new Error("flatten: the catalog has no cards");
  const tools = o.tools || v2BodyTools();
  const langs = (catalog.langs || []).map(l => l && l.code).filter(Boolean);
  const codes = langs.length ? langs : ["en"];
  const tags = tagsById(catalog);
  const seed = o.seed == null ? seedOf(catalog) : (o.seed >>> 0);
  const rand = rng(seed);

  const pieces = [];
  cards.forEach(card => {
    const shape = card.bodyShape || "plain";
    const body = card.body || {};
    const title = card.title || {};
    const shelf = String(card.shelf || "");
    const shelfTag = tags.get(shelf);
    const intentIds = Array.isArray(card.requests) ? card.requests.map(String) : [];
    const intentClauses = [];
    intentIds.forEach(incomingId => {
      const t = tags.get(incomingId);
      if (!t || !t.clause) return;
      Object.keys(t.clause).forEach(k => {
        const v = String(t.clause[k] || "").trim();
        if (v) intentClauses.push(v);
      });
    });
    const categoryLabels = {};
    if (shelfTag && shelfTag.label) {
      Object.keys(shelfTag.label).forEach(k => {
        const v = String(shelfTag.label[k] || "").trim();
        if (v) categoryLabels[k] = v;
      });
    }
    codes.forEach(code => {
      const text = pasteable(body[code], shape, tools);
      if (!text) return;
      pieces.push({
        card: String(card.id), lang: code, text,
        intent: intentIds, intentClauses, category: shelf,
        categoryLabels, title: String(title[code] || "").trim(),
      });
    });
  });
  if (!pieces.length) throw new Error("flatten: no pasteable body in any language");

  let text = "";
  const stretches = [];
  const seps = { none: 0, blank: 0, heading: 0 };
  pieces.forEach((p, i) => {
    let sepBefore = null, heading = null;
    if (i > 0) {
      const g = rand();
      if (g < 1 / 3) {
        sepBefore = "none";
        text += "\n";
      } else if (g < 2 / 3) {
        sepBefore = "blank";
        text += rand() < 0.5 ? "\n\n" : "\n\n\n";
      } else {
        sepBefore = "heading";
        const h = rand();
        if (h < 1 / 3 && p.title) heading = p.title;
        else if (h < 2 / 3) heading = p.lang === "pl" ? "Odpowiedz" : "Reply";
        else heading = firstWords(p.text, 4) || (p.lang === "pl" ? "Odpowiedz" : "Reply");
        text += "\n\n" + heading + "\n\n";
      }
      seps[sepBefore]++;
    }
    const start = text.length;
    text += p.text;
    stretches.push({
      i, card: p.card, lang: p.lang, start, end: text.length,
      intent: p.intent, intentClauses: p.intentClauses,
      category: p.category, categoryLabels: p.categoryLabels,
      sepBefore, heading,
    });
  });
  if (!/\n$/.test(text)) text += "\n";

  const key = {
    kind: KIND, schema: SCHEMA,
    catalog: {
      id: catalog.id || "",
      rev: catalog.rev == null ? null : catalog.rev,
      hash: catalog.hash || "",
      cards: cards.length,
      langs: codes.slice(),
    },
    ragged: { recipe: RECIPE, seed, separators: seps },
    stretches,
  };
  return { text, key };
}

function writeFlatten(outDir, text, key) {
  fs.mkdirSync(outDir, { recursive: true });
  const textAt = path.join(outDir, "replies.txt");
  const keyAt = path.join(outDir, "replies.key.json");
  fs.writeFileSync(textAt, text, "utf8");
  fs.writeFileSync(keyAt, JSON.stringify(key, null, 1) + "\n", "utf8");
  return { textAt, keyAt };
}

export { flattenCatalog, writeFlatten, pasteable, tagsById, RECIPE, SCHEMA, KIND };
