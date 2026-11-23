/* A DRAFT BACK TO THE IMPORTER'S OWN COLUMN SHAPE, as a module Studio ships (board 834, step 10, C09).
 *
 * It lived in tools/export-csv.mjs, which the installer does not carry (electron-builder takes src/**
 * and ui/**), the same reason src/csv.mjs exists. The command line is a wrapper over this now.
 *
 * Writes three files the importer already reads: macros.csv (one row per card, `id` first),
 * categories.csv (key, label, then label_<code> for each other language), intents.csv (clause_<primary>,
 * then clause_<code> for each other language). The headers are the generator's and the mapping table's,
 * so an import of this folder is a round trip rather than a second guess; a catalog in one language
 * writes the two small files exactly as before.
 *
 * Category keys are the tag id with the `t-` prefix taken off, because the importer mints a shelf with
 * tagId(key) and that function puts `t-` back. `ids`, where given, limits the rows to those cards, in
 * the draft's order; the two other files are written whole either way.
 */
import fs from "node:fs";
import path from "node:path";
import * as Engine from "./engine.mjs";
import { readProject } from "./publish.mjs";
import { csvOf } from "./csv.mjs";
import { readJson } from "./plain-json.mjs";

/* The one CSV writer in the tree is src/csv.mjs's (board 606). */
const csv = csvOf;

function draftOf(arg) {
  const p = path.resolve(arg);
  if (!fs.existsSync(p)) throw new Error("nothing at " + p);
  if (fs.statSync(p).isFile()) return readJson(p);
  try { return readProject(p).draft; }
  catch (e) {
    const found = fs.readdirSync(p).filter(n => /\.draft\.json$/i.test(n));
    if (found.length === 1) return readJson(path.join(p, found[0]));
    throw e;
  }
}

function langCodes(catalog) {
  const listed = (catalog.langs || []).map(l => l && l.code).filter(Boolean);
  return listed.length ? listed : ["en"];
}

/** The key the importer will feed to tagId so the minted id is this tag's id. */
function keyOf(F, incomingId) {
  const raw = String(incomingId || "");
  const stripped = raw.startsWith("t-") ? raw.slice(2) : raw;
  if (F.tagId(stripped) === raw) return stripped;
  return stripped;
}

async function exportCsv(opts) {
  const o = opts || {};
  const catalog = o.catalog || draftOf(o.project || o.file);
  const outDir = path.resolve(o.out);
  const F = await Engine.format();

  const codes = langCodes(catalog);
  /* THE PRIMARY IS THE FIRST LANGUAGE DECLARED, which is Studio's primary (src/publish.mjs primaryOf) and the one the
     importer reads as primary, since it is the first body column written below. It was the comment language where the
     catalog named one, which is an axis of its own (setCommentLang): a catalog commented in its second language wrote
     that language's clauses into the intents column, and an import filed them under the first. */
  const primary = codes[0];
  const others = codes.slice(1);
  const tags = Array.isArray(catalog.tags) ? catalog.tags : [];
  const shelves = tags.filter(t => t && t.kind === "shelf");
  const requests = tags.filter(t => t && t.kind === "request");

  const shelfKey = {};
  shelves.forEach(t => { shelfKey[t.id] = keyOf(F, t.id); });
  const clauseOf = {};
  requests.forEach(t => {
    clauseOf[t.id] = String(((t.clause || {})[primary]) || "").trim();
  });

  const head = ["id", "category"];
  codes.forEach(code => head.push("title_" + code));
  codes.forEach(code => head.push("body_" + code));
  codes.forEach(code => head.push("note_" + code));
  /* THE BAG IS ONE COLUMN AND NOT ONE PER LANGUAGE, because `k` is one string shared by every
     language (spec 2.4). Written even where no card carries one, so the export's shape does not
     depend on its content: a column that appeared and vanished would make two exports of the
     same catalog two different files to anyone diffing them. The importer maps "keywords" by
     its own alias table, which is what makes this round trip rather than merely write. */
  head.push("keywords");
  head.push("intents", "role");

  const roles = Array.isArray(catalog.role) ? catalog.role.slice() : [];
  const all = Array.isArray(catalog.cards) ? catalog.cards : [];
  /* A ROW KEEPS ITS PLACE IN THE DRAFT whatever is left out, because `role` is read by position. */
  const only = Array.isArray(o.ids) ? new Set(o.ids.map(String)) : null;
  const cards = all.filter(c => !only || only.has(String(c.id)));
  const fallbackShelf = shelves.length ? shelfKey[shelves[0].id] : "imported";

  const rows = cards.map((card) => {
    const i = all.indexOf(card);
    const row = {
      id: String(card.id || ""),
      category: shelfKey[card.shelf] || fallbackShelf,
    };
    codes.forEach(code => {
      row["title_" + code] = String(((card.title || {})[code]) || "");
      row["body_" + code] = String(((card.body || {})[code]) || "");
      row["note_" + code] = String(((card.note || {})[code]) || "");
    });
    row.keywords = String(card.k || "");
    const links = Array.isArray(card.requests) ? card.requests : [];
    row.intents = links.map(id => clauseOf[id]).filter(Boolean).join(";");
    row.role = i < roles.length ? String(roles[i] || "") : "";
    return head.map(h => row[h]);
  });

  fs.mkdirSync(outDir, { recursive: true });
  const macrosAt = path.join(outDir, "macros.csv");
  const catsAt = path.join(outDir, "categories.csv");
  const intentsAt = path.join(outDir, "intents.csv");
  fs.writeFileSync(macrosAt, csv([head].concat(rows)));
  fs.writeFileSync(catsAt, csv([["key", "label"].concat(others.map(code => "label_" + code))].concat(shelves.map(t => {
    const k = keyOf(F, t.id);
    const label = ((t.label || {})[primary]) || k;
    return [k, String(label || "")].concat(others.map(code => String(((t.label || {})[code]) || "")));
  }))));
  fs.writeFileSync(intentsAt, csv([["clause_" + primary].concat(others.map(code => "clause_" + code))].concat(
    requests.map(t => [clauseOf[t.id] || ""].concat(others.map(code => String(((t.clause || {})[code]) || "").trim()))))));
  return {
    macros: macrosAt, categories: catsAt, intents: intentsAt,
    cards: cards.length, cats: shelves.length, intents: requests.length, primary,
  };
}

export { exportCsv, draftOf };
