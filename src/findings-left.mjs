/* A FINDING LEFT AS IT IS (the review door's "Leave as it is"): the lead's answer to a finding about a card, kept in
 * project.json's `findingsLeft` and never in the catalog, as `notPromises` keeps a likely commitment turned down. An entry
 * is the card's id, the finding with every value that names a card by its place taken out, and the card's content hash:
 * a changed card asks again, and a card moved to another place does not. `reason` has room for the lead's words.
 * This file imports nothing, so a leg can load a rewritten copy of it in memory. */

/** The finding's identity, from `said`, src/lint-said.mjs's lintSaid(line): its frame and the values a move does not
 *  change. A line no frame rebuilds is kept as it reads after the card's head. */
function findingKey(said, line) {
  const head = !!(said && said.vars && said.vars.WHAT && typeof said.vars.WHAT === "object");
  const inner = head ? said.vars.WHAT : said;
  if (!inner || !inner.frame) {
    const m = /^card \d+(?: \("[^]*?"\))?: ([^]*)$/.exec(String(line));
    return m ? m[1] : String(line);
  }
  /* A value its frame writes as "card {X}" names a card, by place or by id; the entry is keyed by the card already. */
  const named = new Set();
  (inner.frame.match(/card \{[A-Z]+\}/g) || []).forEach((x) => named.add(x.slice(6, -1))); /* plant:left-place */
  const vars = inner.vars || {};
  return [inner.frame].concat(Object.keys(vars).filter((k) => !named.has(k)).sort()
    .map((k) => k + "=" + (typeof vars[k] === "string" ? vars[k] : JSON.stringify(vars[k])))).join("\n");
}

/** A card's content hash: the pinned format's own djb2 over its canonical form. `card` comes undated (src/dated.mjs). */
function cardHash(F, card) {
  return String(F.djb2(F.canonical(card == null ? null : card)));
}

/** The project's entries, by card id, each { finding, hash, reason }; anything malformed is dropped. */
function findingsLeftOf(project) {
  const m = project && project.findingsLeft;
  const out = {};
  if (!m || typeof m !== "object" || Array.isArray(m)) return out;
  for (const id of Object.keys(m)) {
    if (!Array.isArray(m[id])) continue;
    const list = m[id].filter((e) => e && typeof e.finding === "string" && typeof e.hash === "string")
      .map((e) => ({ finding: e.finding, hash: e.hash, reason: typeof e.reason === "string" ? e.reason : null }));
    if (list.length) out[id] = list;
  }
  return out;
}

/** Whether the card's finding is left, for the card as it is now. */
function isLeft(kept, card, key, hash) {
  let hits = ((kept && kept[card]) || []).filter((e) => e.finding === key);
  hits = hits.filter((e) => e.hash === hash); /* plant:left-hash */
  return hits.length > 0;
}

/** The rows a list shows: a row about a card whose finding is left is not one. `keyOf(line)` and `hashOf(id)` as above. */
function withoutLeft(rows, kept, keyOf, hashOf) {
  if (!kept || !Object.keys(kept).length) return rows;
  const out = [];
  for (const r of rows) {
    if (r && r.card && kept[r.card] && isLeft(kept, r.card, keyOf(r.why), hashOf(r.card))) continue; /* plant:left-drop */
    out.push(r);
  }
  return out;
}

/** The entries with this finding left on the card as it is now; the card's entries for an earlier state of it go. */
function withLeft(kept, card, key, hash, reason) {
  const out = Object.assign({}, kept);
  out[card] = ((kept && kept[card]) || []).filter((e) => e.hash === hash && e.finding !== key)
    .concat([{ finding: key, hash, reason: typeof reason === "string" && reason.trim() ? reason.trim() : null }]);
  return out;
}

export { findingKey, cardHash, findingsLeftOf, isLeft, withoutLeft, withLeft };
