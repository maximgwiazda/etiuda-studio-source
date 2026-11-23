/* AN IMPORTER'S PROPOSED CATALOG AGAINST A FLATTEN KEY AND THE SOURCE FILE.
 *
 *     scoreCatalog(proposed, key, sourceText) -> report
 *
 * INVENTION IS FIRST. A proposed body that does not appear verbatim in the source would poison
 * a customer's catalog; the other numbers are about segmentation and filing. Every count names
 * its method on the report, so a second tool could be written from it.
 *
 * THE KEY IS GROUND TRUTH, not the proposed ids. An importer mints new ids; matching is by
 * pasteable body text against the stretches the flattener recorded as offsets into the source.
 */
import { v2BodyTools } from "../../src/engine.mjs";
import { pasteable, tagsById } from "./flatten.mjs";

const SCHEMA = 1;
const KIND = "etiuda-studio-import-score";

function extractBodies(card, tools) {
  const shape = card && card.bodyShape ? card.bodyShape : "plain";
  const body = (card && card.body) || {};
  const out = [];
  Object.keys(body).forEach(lang => {
    const text = pasteable(body[lang], shape, tools);
    if (text) out.push({ lang, text });
  });
  return out;
}

function setEq(a, b) {
  if (a.size !== b.size) return false;
  for (const x of a) if (!b.has(x)) return false;
  return true;
}

function scoreCatalog(proposed, key, source, opts) {
  const o = opts || {};
  const tools = o.tools || v2BodyTools();
  const src = String(source == null ? "" : source);
  if (!key || key.kind !== "etiuda-studio-flatten-key")
    throw new Error("score wants a flatten key");
  const stretches = (key.stretches || []).map((s, i) => ({
    i: s.i == null ? i : s.i,
    card: String(s.card),
    lang: s.lang,
    start: s.start,
    end: s.end,
    text: src.slice(s.start, s.end),
    intent: Array.isArray(s.intent) ? s.intent.map(String) : [],
    intentClauses: Array.isArray(s.intentClauses) ? s.intentClauses.slice() : [],
    category: String(s.category || ""),
    categoryLabels: s.categoryLabels || {},
  }));

  const trueOrder = [];
  const trueOf = new Map();
  stretches.forEach(s => {
    if (!trueOf.has(s.card)) {
      trueOrder.push(s.card);
      trueOf.set(s.card, {
        id: s.card, stretches: [],
        intent: s.intent, intentClauses: s.intentClauses,
        category: s.category, categoryLabels: s.categoryLabels,
      });
    }
    const row = trueOf.get(s.card);
    row.stretches.push(s);
    if (!row.intent.length && s.intent.length) row.intent = s.intent;
    if (!row.intentClauses.length && s.intentClauses.length)
      row.intentClauses = s.intentClauses;
  });

  const proposedCards = (proposed && Array.isArray(proposed.cards)) ? proposed.cards : [];
  const proposedTags = tagsById(proposed || {});
  const rows = proposedCards.map((card, idx) => ({
    idx, card, bodies: extractBodies(card, tools),
  }));

  let invented = 0, verbatim = 0;
  rows.forEach(p => p.bodies.forEach(b => {
    if (src.indexOf(b.text) < 0) invented++;
    else verbatim++;
  }));
  const bodyN = invented + verbatim;

  /* Same-id pairing first. The original catalog scored as a perfect import still carries the
     key's ids; an importer of a shapeless file mints new ones. Binding by id keeps two cards
     that happen to share a sentence from counting as a split of each other. */
  const lockedTrue = new Set();
  const lockedProp = new Set();
  const idPair = new Map();
  rows.forEach(p => {
    const incomingId = p.card && p.card.id ? String(p.card.id) : "";
    if (!incomingId || !trueOf.has(incomingId) || lockedTrue.has(incomingId)
        || lockedProp.has(p.idx)) return;
    lockedTrue.add(incomingId);
    lockedProp.add(p.idx);
    idPair.set(incomingId, p.idx);
  });

  const cover = stretches.map(() => new Set());
  const exactHits = [];
  const freeRows = rows.filter(p => !lockedProp.has(p.idx));
  freeRows.forEach(p => p.bodies.forEach(b => {
    stretches.forEach(s => {
      if (lockedTrue.has(s.card)) return;
      if (s.text === b.text) {
        cover[s.i].add(p.idx);
        exactHits.push({ pidx: p.idx, lang: b.lang, sidx: s.i });
      }
    });
  }));
  stretches.forEach(s => {
    if (lockedTrue.has(s.card) || cover[s.i].size) return;
    freeRows.forEach(p => p.bodies.forEach(b => {
      if (b.text.length > s.text.length && b.text.indexOf(s.text) >= 0)
        cover[s.i].add(p.idx);
    }));
  });
  stretches.forEach(s => {
    if (lockedTrue.has(s.card) || cover[s.i].size) return;
    freeRows.forEach(p => p.bodies.forEach(b => {
      if (b.text && b.text.length < s.text.length && s.text.indexOf(b.text) >= 0
          && src.indexOf(b.text) >= 0)
        cover[s.i].add(p.idx);
    }));
  });

  const trueToProp = new Map();
  trueOrder.forEach(id => trueToProp.set(id, new Set()));
  idPair.forEach((pidx, tid) => trueToProp.get(tid).add(pidx));
  stretches.forEach(s => cover[s.i].forEach(pidx => trueToProp.get(s.card).add(pidx)));
  const propToTrue = new Map();
  rows.forEach(p => propToTrue.set(p.idx, new Set()));
  trueToProp.forEach((set, tid) => set.forEach(pidx => propToTrue.get(pidx).add(tid)));

  let exact = 0, split = 0, merged = 0, missed = 0, inexact = 0;
  const exactPairs = [];
  trueOrder.forEach(tid => {
    const props = Array.from(trueToProp.get(tid));
    if (!props.length) { missed++; return; }
    if (props.length > 1) { split++; return; }
    const pidx = props[0];
    if (propToTrue.get(pidx).size > 1) { merged++; return; }
    const t = trueOf.get(tid);
    const pBodies = rows[pidx].bodies;
    const allExact = t.stretches.every(s => pBodies.some(b => b.text === s.text));
    const extra = pBodies.some(b => !t.stretches.some(s => s.text === b.text));
    if (allExact && !extra) { exact++; exactPairs.push({ trueId: tid, pidx }); }
    else inexact++;
  });

  let langRight = 0;
  exactPairs.forEach(pair => {
    const tLangs = new Set(trueOf.get(pair.trueId).stretches.map(s => s.lang));
    const pLangs = new Set(rows[pair.pidx].bodies.map(b => b.lang));
    if (setEq(tLangs, pLangs)) langRight++;
  });

  let intentRight = 0, intentOf = 0, catRight = 0;
  exactPairs.forEach(pair => {
    const t = trueOf.get(pair.trueId);
    const card = rows[pair.pidx].card;
    if (t.intent.length) {
      intentOf++;
      const got = Array.isArray(card.requests) ? card.requests.map(String) : [];
      let ok = got.length === t.intent.length && got.every(id => t.intent.indexOf(id) >= 0);
      if (!ok) {
        const gotClauses = new Set();
        got.forEach(incomingId => {
          const tag = proposedTags.get(incomingId);
          if (!tag || !tag.clause) return;
          Object.keys(tag.clause).forEach(k => {
            const v = String(tag.clause[k] || "").trim();
            if (v) gotClauses.add(v);
          });
        });
        const want = new Set(t.intentClauses.map(x => String(x).trim()).filter(Boolean));
        ok = want.size > 0 && setEq(gotClauses, want);
      }
      if (ok) intentRight++;
    }
    const shelf = String(card.shelf || "");
    let catOk = shelf !== "" && shelf === t.category;
    if (!catOk && shelf) {
      const tag = proposedTags.get(shelf);
      const labels = tag && tag.label ? tag.label : {};
      const want = new Set(Object.keys(t.categoryLabels).map(k => t.categoryLabels[k]));
      catOk = Object.keys(labels).some(k => want.has(String(labels[k] || "").trim()));
    }
    if (catOk) catRight++;
  });

  return {
    kind: KIND, schema: SCHEMA,
    invention: {
      n: invented, of: bodyN,
      method: "each proposed card body is made pasteable the same way the flattener writes a"
        + " stretch (plain text trimmed; steps/alts through the engine's v2Unmark and"
        + " v2PartText). A body is invented when that string is not a substring of the source"
        + " file. Counted over proposed bodies, not over cards.",
    },
    verbatim: {
      n: verbatim, of: bodyN,
      method: "the complement of invention: pasteable proposed bodies that do appear as a"
        + " substring of the source file, counted the same way.",
    },
    boundaries: {
      exact, split, merged, missed, inexact,
      trueCards: trueOrder.length,
      proposedCards: proposedCards.length,
      method: "true cards are the distinct card ids in the key, in first-seen order. A"
        + " proposed card whose id is a true card id is bound to it first, so the original"
        + " catalog scored as a perfect import is not split by a shared sentence. Remaining"
        + " cards: a proposed card covers a stretch when its pasteable body equals the stretch,"
        + " contains it, or is a verbatim substring of it, and equality, if present, is the"
        + " only cover. A true card is exact when exactly one proposed card covers it, that"
        + " proposed card covers no other true card, and every stretch equals a proposed body"
        + " of that card with no leftover proposed body. Split: more than one proposed card"
        + " covers it. Merged: one proposed card covers it and at least one other true card."
        + " Missed: none. Inexact: one-to-one but the bodies are not an exact cover.",
    },
    language: {
      right: langRight, of: exactPairs.length,
      method: "over exact card pairs only. Right when the set of language codes on the proposed"
        + " card's pasteable bodies equals the set of language codes on that true card's"
        + " stretches.",
    },
    intent: {
      right: intentRight, of: intentOf,
      method: "over exact card pairs whose key stretch lists at least one intent id. Right when"
        + " the proposed card's request ids equal those ids, or when the proposed request"
        + " clauses (every language) equal the clauses stored on the key. True cards with no"
        + " intent in the key are not in the denominator.",
    },
    category: {
      right: catRight, of: exactPairs.length,
      method: "over exact card pairs. Right when the proposed card's shelf id equals the key's"
        + " category id, or when a label of the proposed shelf tag equals a label stored on the"
        + " key for that true card.",
    },
  };
}

function printScore(report, write) {
  const out = write || (l => process.stdout.write(l + "\n"));
  const inv = report.invention, ver = report.verbatim, b = report.boundaries;
  out("score  invention " + inv.n + " of " + inv.of + " proposed bodies");
  out("score  verbatim " + ver.n + " of " + ver.of + " proposed bodies");
  out("score  boundaries exact " + b.exact + " split " + b.split + " merged " + b.merged
    + " missed " + b.missed + " inexact " + b.inexact + " of " + b.trueCards
    + " true cards (" + b.proposedCards + " proposed)");
  out("score  language " + report.language.right + " of " + report.language.of
    + " exact cards");
  out("score  intent " + report.intent.right + " of " + report.intent.of
    + " exact cards whose key has an intent");
  out("score  category " + report.category.right + " of " + report.category.of
    + " exact cards");
}

export { scoreCatalog, printScore, extractBodies, SCHEMA, KIND };
