/* THE FOUR JSON EXPORTS, READ BY THE PROGRAM THAT SHIPS (sense pass 2026-09-22, item 20).
 *
 * This was tools/adapt.mjs alone, and electron-builder ships no part of tools/, so the four
 * export shapes a support platform hands a customer had no door in the installed program at
 * all: the tour said "point this at a spreadsheet or an export" and the picker could not even
 * see a .json. The rules are unchanged and moved here whole; tools/adapt.mjs is now the command
 * line's door over them, and src/source.mjs reads a JSON file through `shapeOf` and `adapt`,
 * so a picked export becomes the same seven columns the command line writes as a CSV.
 *
 * Columns id, shelf, title, body, note, requests, role; requests and role empty, because the
 * JSON shapes do not carry them. A field an export must carry and does not is a refusal naming
 * the field, built by refuse() so the screen can say it in Polish.
 */
import { refuse } from "./refusal.mjs";

/* NOT NAMED AFTER THE BUILDER, because tests/polish.mjs reads every call of it in src/ as a
   frame, and the field names below would read as sentences. */
function missing(field) {
  throw refuse("this export could not be read: it has no {FIELD} where one is needed",
    { FIELD: field });
}

const COLUMNS = ["id", "shelf", "title", "body", "note", "requests", "role"];

/** Tags off; paragraph breaks kept as blank lines. Placeholders have no tags and pass through.
 *  A character reference is decoded, a link keeps its address, and script and style contents
 *  are dropped before the tags go, so they never become part of the reply. */
function htmlToText(html) {
  let s = String(html == null ? "" : html);
  s = htmlFaithful(s); /* plant:html-faithful */
  return s.trim();
}

/* Named references an export actually writes. `&nbsp;` is a space, which is what this function
 * returned before the rest of the names were decoded. An unknown name stays as it was written. */
const HTML_NAMED = {
  amp: "&", lt: "<", gt: ">", quot: "\"", apos: "'", nbsp: " ",
  pound: "\u00a3", copy: "\u00a9", reg: "\u00ae", deg: "\u00b0", middot: "\u00b7",
  Agrave: "\u00c0", Aacute: "\u00c1", Acirc: "\u00c2", Atilde: "\u00c3", Auml: "\u00c4",
  Aring: "\u00c5", AElig: "\u00c6", Ccedil: "\u00c7", Egrave: "\u00c8", Eacute: "\u00c9",
  Ecirc: "\u00ca", Euml: "\u00cb", Igrave: "\u00cc", Iacute: "\u00cd", Icirc: "\u00ce",
  Iuml: "\u00cf", Ntilde: "\u00d1", Ograve: "\u00d2", Oacute: "\u00d3", Ocirc: "\u00d4",
  Otilde: "\u00d5", Ouml: "\u00d6", Oslash: "\u00d8", Ugrave: "\u00d9", Uacute: "\u00da",
  Ucirc: "\u00db", Uuml: "\u00dc", Yacute: "\u00dd", szlig: "\u00df", agrave: "\u00e0",
  aacute: "\u00e1", acirc: "\u00e2", atilde: "\u00e3", auml: "\u00e4", aring: "\u00e5",
  aelig: "\u00e6", ccedil: "\u00e7", egrave: "\u00e8", eacute: "\u00e9", ecirc: "\u00ea",
  euml: "\u00eb", igrave: "\u00ec", iacute: "\u00ed", icirc: "\u00ee", iuml: "\u00ef",
  ntilde: "\u00f1", ograve: "\u00f2", oacute: "\u00f3", ocirc: "\u00f4", otilde: "\u00f5",
  ouml: "\u00f6", oslash: "\u00f8", ugrave: "\u00f9", uacute: "\u00fa", ucirc: "\u00fb",
  uuml: "\u00fc", yacute: "\u00fd", yuml: "\u00ff",
  ndash: "\u2013", mdash: "\u2014", lsquo: "\u2018", rsquo: "\u2019",
  sbquo: "\u201a", ldquo: "\u201c", rdquo: "\u201d", bdquo: "\u201e",
  hellip: "\u2026", bull: "\u2022", euro: "\u20ac", trade: "\u2122",
  Aogon: "\u0104", aogon: "\u0105", Cacute: "\u0106", cacute: "\u0107",
  Eogon: "\u0118", eogon: "\u0119", Lstrok: "\u0141", lstrok: "\u0142",
  Nacute: "\u0143", nacute: "\u0144", Sacute: "\u015a", sacute: "\u015b",
  Zacute: "\u0179", zacute: "\u017a", Zdot: "\u017b", zdot: "\u017c",
};

function htmlFaithful(html) {
  let s = String(html == null ? "" : html);
  s = s.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  s = dropHtmlBlock(s, "script");
  s = dropHtmlBlock(s, "style");
  s = keepLinkAddresses(s);
  s = s.replace(/<\s*br\s*\/?\s*>/gi, "\n");
  s = s.replace(/<\s*\/\s*(p|div|h[1-6]|li|tr)\s*>/gi, "\n\n");
  s = s.replace(/<\s*(p|div|h[1-6]|li|tr)(?:\s[^>]*)?>/gi, "");
  s = s.replace(/<[^>]+>/g, "");
  s = decodeHtmlRefs(s);
  s = s.replace(/[ \t]+\n/g, "\n").replace(/\n[ \t]+/g, "\n");
  s = s.replace(/\n{3,}/g, "\n\n");
  return s;
}

/* A closed block goes, contents and all. A self-closing tag goes and the text after it stays.
 * An unclosed tag drops the rest of the reply, which is the only way not to keep the script. */
function dropHtmlBlock(s, tag) {
  const open = new RegExp("<\\s*" + tag + "\\b", "gi");
  let out = "", from = 0, m;
  while ((m = open.exec(s))) {
    out += s.slice(from, m.index);
    const gt = s.indexOf(">", m.index);
    if (gt < 0) { from = s.length; break; }
    if (/\/\s*>$/.test(s.slice(m.index, gt + 1))) {
      from = gt + 1;
      open.lastIndex = from;
      continue;
    }
    const close = new RegExp("<\\s*/\\s*" + tag + "\\s*>", "gi");
    close.lastIndex = gt + 1;
    const end = close.exec(s);
    if (!end) { from = s.length; break; }
    from = end.index + end[0].length;
    open.lastIndex = from;
  }
  return out + s.slice(from);
}

function keepLinkAddresses(s) {
  return s.replace(/<\s*a\b([^>]*)>([\s\S]*?)<\s*\/\s*a\s*>/gi, (whole, attrs, label) => {
    void whole;
    const href = /\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+))/i.exec(attrs || "");
    const address = href ? (href[1] != null ? href[1] : (href[2] != null ? href[2] : href[3] || "")) : "";
    const visible = String(label).replace(/<[^>]+>/g, "");
    if (!address || visible.indexOf(address) >= 0) return label;
    return label + " (" + address + ")";
  });
}

/* One pass, so `&amp;lt;` stays `&lt;` rather than becoming a tag that the strip already missed. */
function decodeHtmlRefs(s) {
  return String(s).replace(/&(#x[0-9a-fA-F]+|#\d+|[A-Za-z][A-Za-z0-9]*);/g, (m, body) => {
    if (body.charAt(0) === "#") {
      const hex = body.charAt(1) === "x" || body.charAt(1) === "X";
      const n = parseInt(body.slice(hex ? 2 : 1), hex ? 16 : 10);
      if (!Number.isFinite(n) || n < 0 || n > 0x10FFFF || (n >= 0xD800 && n <= 0xDFFF)) return m;
      try { return String.fromCodePoint(n); } catch { return m; }
    }
    return Object.prototype.hasOwnProperty.call(HTML_NAMED, body) ? HTML_NAMED[body] : m;
  });
}

function actionNamed(actions, field) {
  if (!Array.isArray(actions)) return null;
  for (let i = 0; i < actions.length; i++) {
    if (actions[i] && actions[i].field === field) return actions[i];
  }
  return null;
}

function replyMacrosActions(macro) {
  const plain = actionNamed(macro.actions, "comment_value");
  const html = actionNamed(macro.actions, "comment_value_html");
  /* Empty plain is absence: the HTML reply is used then, not a blank body. */
  const plainText = plain && plain.value != null ? String(plain.value) : "";
  if (plainText) return plainText;
  if (html) return htmlToText(html.value);
  if (plain) return "";
  missing("comment_value");
}

function splitMacrosTitle(title) {
  const raw = String(title);
  const cut = raw.lastIndexOf("::");
  if (cut < 0) return { shelf: "", title: raw };
  return { shelf: raw.slice(0, cut), title: raw.slice(cut + 2) };
}

function fromMacrosActions(doc) {
  if (!doc || !Array.isArray(doc.macros)) missing("macros");
  return doc.macros.map(macro => {
    if (macro == null || macro.id == null) missing("id");
    if (macro.title == null) missing("title");
    const parts = splitMacrosTitle(macro.title);
    return {
      id: String(macro.id),
      shelf: parts.shelf,
      title: parts.title,
      body: replyMacrosActions(macro),
      note: macro.description == null ? "" : String(macro.description),
      requests: "",
      role: "",
    };
  });
}

function replyFoldersResponses(item) {
  const plainText = item.content != null ? String(item.content) : "";
  if (plainText) return plainText;
  if (item.content_html != null) return htmlToText(item.content_html);
  if (item.content != null) return "";
  missing("content");
}

function fromFoldersResponses(doc) {
  if (!doc || !Array.isArray(doc.folders)) missing("folders");
  const out = [];
  for (let i = 0; i < doc.folders.length; i++) {
    const folder = doc.folders[i];
    if (folder == null || folder.name == null) missing("name");
    const shelf = String(folder.name);
    const items = folder.canned_responses;
    if (items == null) continue;
    if (!Array.isArray(items)) missing("canned_responses");
    for (let j = 0; j < items.length; j++) {
      const item = items[j];
      if (item == null || item.id == null) missing("id");
      if (item.title == null) missing("title");
      out.push({
        id: String(item.id),
        shelf: shelf,
        title: String(item.title),
        body: replyFoldersResponses(item),
        note: "",
        requests: "",
        role: "",
      });
    }
  }
  return out;
}

/** Last path segment of a parent-folder link, or the whole value when it is already an id. */
function lastSegment(link) {
  const s = String(link);
  const cut = s.lastIndexOf("/");
  return cut < 0 ? s : s.slice(cut + 1);
}

/* Grouping is the parent-folder link; the create-body field is the fallback when the link is absent. */
function templateShelf(item) {
  const link = item && item._links && item._links.related
    && item._links.related.parent_folder;
  if (link != null && String(link) !== "") return lastSegment(link);
  return item.folder_id == null ? "" : String(item.folder_id);
}

function fromTemplatesList(doc) {
  if (!doc || !Array.isArray(doc.templates)) missing("templates");
  return doc.templates.map(item => {
    if (item == null || item.id == null) missing("id");
    if (item.name == null) missing("name");
    if (item.body == null) missing("body");
    return {
      id: String(item.id),
      shelf: templateShelf(item),
      title: String(item.name),
      body: htmlToText(item.body),
      note: "",
      requests: "",
      role: "",
    };
  });
}

function replyMacrosList(macro) {
  if (!Array.isArray(macro.actions)) missing("actions");
  for (let i = 0; i < macro.actions.length; i++) {
    const act = macro.actions[i];
    if (!act || act.name !== "setResponseText") continue;
    const args = act.arguments || {};
    const plainText = args.body_text != null ? String(args.body_text) : "";
    if (plainText) return plainText;
    if (args.body_html != null) return htmlToText(args.body_html);
    if (args.body_text != null) return "";
  }
  missing("body_text");
}

function fromMacrosList(doc) {
  if (!doc || !Array.isArray(doc.macros)) missing("macros");
  return doc.macros.map(macro => {
    if (macro == null || macro.id == null) missing("id");
    if (macro.name == null) missing("name");
    return {
      id: String(macro.id),
      shelf: "",
      title: String(macro.name),
      body: replyMacrosList(macro),
      note: "",
      requests: "",
      role: "",
    };
  });
}

const SHAPES = ["macros-actions", "folders-responses", "templates-list", "macros-list"];

function adapt(shape, doc) {
  if (shape === "macros-actions") return fromMacrosActions(doc);
  if (shape === "folders-responses") return fromFoldersResponses(doc);
  if (shape === "templates-list") return fromTemplatesList(doc);
  if (shape === "macros-list") return fromMacrosList(doc);
  throw new Error("shape is " + SHAPES.join(" or ") + ", got " + JSON.stringify(shape));
}

/** Which of the four shapes a parsed export is, by the keys each one is built from, or null.
 *  The two macro shapes share their top-level key and differ in each macro: one is titled and
 *  carries field actions, the other is named and carries named actions. */
function shapeOf(doc) {
  if (!doc || typeof doc !== "object" || Array.isArray(doc)) return null;
  if (Array.isArray(doc.folders)) return "folders-responses";
  if (Array.isArray(doc.templates)) return "templates-list";
  if (Array.isArray(doc.macros)) {
    const m = doc.macros.find(x => x && typeof x === "object");
    if (!m) return null;
    if (m.title != null) return "macros-actions";
    if (m.name != null) return "macros-list";
  }
  return null;
}

export { adapt, shapeOf, htmlToText, fromMacrosActions, fromFoldersResponses,
         fromTemplatesList, fromMacrosList, COLUMNS, SHAPES };
