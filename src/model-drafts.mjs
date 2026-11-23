/* A MODEL'S DRAFTS (board 992, stage 4): what the customer's own AI service is shown for a drafting job, and where its
 * answer waits until the lead accepts or discards it.
 *
 * WHOSE WORD. Maxim, 2026-11-11 19:15: "1) first version id those three jobs, yes", the product designer's three jobs
 * (etiuda-ai-role-2026-11-11/role.md in the office): bringing in old replies, the other language for a card, a card from a
 * described situation. Her rules hold for each: the lead starts it and sees what goes and where before it goes; a model's
 * words are marked until the lead accepts them, with a one-press Discard; a model's draft never blocks publishing.
 *
 * WHAT GOES. jobParts reads the working copy and nothing else, and says the job's texts exactly: for the other language
 * the card's title and body in a language it is written in and up to LANGUAGE_EXAMPLES cards already written in the
 * language asked for, the card's own category first; for a situation the lead's sentences, up to SITUATION_EXAMPLES cards
 * of the category chosen in every language the catalog has, and the names of its categories and intents. The shell's
 * line before a send counts these texts (src/customer-ai.mjs aiSends) and the shell sends these texts, so what the lead
 * is shown is what goes. No path, no team, no licence, no key and no other card is read into them.
 *
 * WHERE A DRAFT WAITS. In the project's own folder, model-drafts.json beside draft.json and the inbox, for the inbox's
 * reasons (src/studio.mjs, "WHERE A PROPOSAL ARRIVES"): the folder is the customer's and a draft is about its catalog. It
 * is not in the catalog: the working copy is not touched until Accept, so an unaccepted draft is never published, and
 * nothing here is read by a publish but the count Publishing says as information.
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { writeWhole } from "./whole-write.cjs";

export const DRAFTS_FILE = "model-drafts.json";
export const DRAFTS_KIND = "etiuda-studio-model-drafts";
export const LANGUAGE_EXAMPLES = 3;
export const SITUATION_EXAMPLES = 4;
/* The product designer's box: three lines, 600 characters at most (surfaces.md, section 1). */
export const SITUATION_MAX = 600;

const own = (o, k) => (o && typeof o === "object" && Object.prototype.hasOwnProperty.call(o, k) ? o[k] : undefined);
const said = (o, l) => { const v = own(o, l); return typeof v === "string" ? v : ""; };
export const langsOf = (draft) => ((draft && draft.langs) || []).map((l) => l && l.code).filter(Boolean);
/** A card's title and body in one language, as one text. */
export function cardText(card, lang) {
  return [said(card.title, lang).trim(), said(card.body, lang).trim()].filter(Boolean).join("\n\n");
}
/** Whether a card holds steps or alternatives: its body is then the replies block's, which a drafted text cannot fill. */
export const shapedCard = (card) => !!card && (card.bodyShape === "steps" || card.bodyShape === "alts");
/** A tag's name in `lang`, else in the first language that has one, else its id. */
export function tagName(tag, lang, langs) {
  const words = tag.kind === "request" ? tag.clause : tag.label;
  if (said(words, lang).trim()) return said(words, lang).trim();
  for (const l of langs || []) if (said(words, l).trim()) return said(words, l).trim();
  return String(tag.id);
}

/** WHAT A JOB SENDS, read off `draft` (the working copy): {job, texts, chars, examples, ...} or {refused} where the job has
 *  nothing to go on. `o` is {card, lang} for "language" and {text, shelf} for "situation". `texts` is everything that goes,
 *  in its order; `chars` the length of the part the lead wrote or chose (the card, or the description). */
export function jobParts(draft, job, o) {
  const opts = o || {}, langs = langsOf(draft), primary = langs[0] || "en";
  /* A language as the catalog names it ("English", "Polski"), for the prompt; its code where it names none. */
  const langName = (code) => { const l = ((draft && draft.langs) || []).find((x) => x && x.code === code); return (l && String(l.label || "").trim()) || code; };
  const cards = (Array.isArray(draft && draft.cards) ? draft.cards : []).filter((c) => c && c.id && !c.retired);
  const tags = Array.isArray(draft && draft.tags) ? draft.tags : [];
  if (job === "language") {
    const card = cards.find((c) => c.id === String(opts.card || ""));
    const to = String(opts.lang || "");
    if (!card || langs.indexOf(to) < 0) return { refused: "card" };
    /* Steps or alternatives are not one body to write in another language (Argon's finding 7 of the 992 review). */
    if (shapedCard(card)) return { refused: "shaped" };
    if (said(card.body, to).trim()) return { refused: "written" };
    const from = [primary].concat(langs).find((l) => l !== to && said(card.body, l).trim());
    if (!from) return { refused: "empty" };
    const text = cardText(card, from);
    const near = cards.filter((c) => c.id !== card.id && said(c.body, to).trim());
    const ranked = near.filter((c) => c.shelf && c.shelf === card.shelf).concat(near.filter((c) => !(c.shelf && c.shelf === card.shelf)));
    const examples = ranked.slice(0, LANGUAGE_EXAMPLES).map((c) => cardText(c, to));
    return { job, card: card.id, from, to, fromName: langName(from), toName: langName(to), text, examples,
      texts: [text].concat(examples), chars: text.length };
  }
  if (job === "situation") {
    const text = String(opts.text == null ? "" : opts.text).trim().slice(0, SITUATION_MAX);
    if (!text) return { refused: "empty" };
    const shelf = tags.find((t) => t.kind === "shelf" && t.id === String(opts.shelf || ""));
    const examples = !shelf ? [] : cards.filter((c) => c.shelf === shelf.id && langs.some((l) => said(c.body, l).trim()))
      .slice(0, SITUATION_EXAMPLES)
      .map((c) => langs.filter((l) => cardText(c, l)).map((l) => "[" + l + "]\n" + cardText(c, l)).join("\n\n"));
    const names = "Categories: " + tags.filter((t) => t.kind === "shelf").map((t) => tagName(t, primary, langs)).join("; ")
      + "\nIntents: " + tags.filter((t) => t.kind === "request").map((t) => tagName(t, primary, langs)).join("; ");
    const named = (kind) => tags.filter((t) => t.kind === kind).map((t) => ({ id: String(t.id), name: tagName(t, primary, langs) }));
    return { job, shelf: shelf ? shelf.id : "", category: shelf ? tagName(shelf, primary, langs) : "", langs,
      langNames: langs.map(langName), shelves: named("shelf"), intents: named("request"), text, examples, names,
      texts: [text].concat(examples, [names]), chars: text.length };
  }
  return { refused: "job" };
}

/* ---- the store ------------------------------------------------------------------------------------------------- */

const atOf = (dir) => path.join(path.resolve(String(dir || "")), DRAFTS_FILE);
/** The drafts waiting in the project at `dir`, oldest first; none where the file is absent or not of its kind. */
export function draftsRead(dir) {
  let doc = null;
  try { doc = JSON.parse(fs.readFileSync(atOf(dir), "utf8").replace(/^﻿/, "")); } catch { doc = null; }
  return doc && doc.kind === DRAFTS_KIND && Array.isArray(doc.drafts) ? doc.drafts.filter((d) => d && typeof d.id === "string") : [];
}
function draftsWrite(dir, drafts) {
  const at = atOf(dir);
  if (!drafts.length) { try { fs.unlinkSync(at); } catch { /* none kept */ } return; }
  writeWhole(at, JSON.stringify({ format: 1, kind: DRAFTS_KIND, drafts }, null, 1) + "\n");
}
/** Keeps `draft` ({job, card?, lang?, fields, service, model, host}) under a new id; a language draft replaces one waiting
 *  for the same card and language, since the lead asked again. Answers the draft as kept. */
export function draftKeep(dir, draft) {
  const kept = Object.assign({ id: "d-" + crypto.randomBytes(6).toString("hex"), at: new Date().toISOString() }, draft);
  const rest = draftsRead(dir).filter((d) => !(kept.job === "language" && d.job === "language" && d.card === kept.card && d.lang === kept.lang));
  draftsWrite(dir, rest.concat([kept]));
  return kept;
}
/** The draft `id`, or null. */
export function draftFind(dir, id) { return draftsRead(dir).find((d) => d.id === String(id)) || null; }
/** Takes the draft `id` away; true where there was one. */
export function draftDrop(dir, id) {
  const all = draftsRead(dir), rest = all.filter((d) => d.id !== String(id));
  if (rest.length === all.length) return false;
  draftsWrite(dir, rest);
  return true;
}
