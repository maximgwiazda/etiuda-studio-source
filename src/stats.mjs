/* THE STATISTICS FILES THE DESKS ANSWERED WITH, read as declared. Channel draft 2026-09-15-a
 * section 5.
 *
 * `node tools/stats-read.mjs` is the command line over this and the Statistics section of the
 * authoring screen is the screen over it: one row per desk, built HERE by rowOf, so the table a
 * person reads on the screen and the table a script reads on the command line are one table and
 * not two that agree. A DESK'S ROW CARRIES ITS TECHNICAL STATE AND NO COUNT OF USE: what it
 * copied, searched for and missed is summed across the desks by teamOf and shown only so. Nor
 * does it carry the desk's `sync`: a live answer is rewritten within minutes of any use, so its
 * stamp is that desk's last use, and only the team's newest stamp is shown (ruling of
 * 2026-09-23 02:08: no usage per desk but its edition). IT IS
 * IN src/ RATHER THAN tools/ BECAUSE electron-builder ships `src/**` and no part of `tools/`,
 * and the Statistics section calls this module.
 *
 * THE PERIOD ON A ROW IS PRINTED EXACTLY AS THE FILE DECLARES IT AND IS MARKED DECLARED, NOT
 * COMPUTED. The counting period the lead chose is stats-span.json beside the catalogs, and the
 * days it names are spanCounted's. An answer carrying `since` counted by day and its figures
 * are the span's, from `since` where that is later than `from`; an answer without it carries the
 * desk's lifetime counters beside whatever span it declared.
 *
 * LIVE ANSWERS ARE desks/<branch id>/stats.estat, SEALED TO THE LEAD'S BOX. The old stats/
 * folder is not read and not written.
 *
 * A FILE CARRYING A KEY OUTSIDE THE RULED NOUNS IS REFUSED AND ITS KEYS ARE PRINTED. The ruling
 * of 2026-09-14 22:33 names what a desk may send; a desk sending more than that is not a desk
 * whose extra field should be quietly dropped into a total.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import * as Engine from "./engine.mjs";
import { parsePlain, jsonText as json } from "./plain-json.mjs";
import { writeWhole } from "./whole-write.cjs";

const RULED = [
  "format", "kind", "desk", "engine", "period", "period.from", "period.to", "sync",
  "cards", "cards[].id", "cards[].n", "cards[].at", "cards[].langs", "cards[].langs.*",
  "intents", "intents[].id", "intents[].n",
  "misses", "langs", "langs.*", "since",
  "pairs", "pairs[].from", "pairs[].to", "pairs[].n",
  "catalog", "catalog.id", "catalog.rev", "hash",
  /* The desk's own signature inside the seal (board 891's C1), checked before the judge sees the answer. */
  "sig", "sig.alg", "sig.keyId", "sig.value"
];

function keyPaths(v, prefix, out) {
  out = out || new Set();
  if (Array.isArray(v)) { v.forEach(x => keyPaths(x, prefix + "[]", out)); return out; }
  if (v === null || typeof v !== "object") return out;
  Object.keys(v).forEach(k => {
    const p = prefix ? prefix + "." + k : k;
    out.add(p);
    keyPaths(v[k], p, out);
  });
  return out;
}

function listN(rows, idKey) {
  if (!Array.isArray(rows) || !rows.length) return "-";
  return rows.map(r => String(r && r[idKey] != null ? r[idKey] : "") + ":" + ((r && r.n) | 0)).join(",");
}

function rowOf(data) {
  const cat = data.catalog && data.catalog.id ? String(data.catalog.id) : "-";
  const rev = data.catalog && data.catalog.id ? String(+data.catalog.rev || 0) : "-";
  const period = (data.period && data.period.from && data.period.to)
    ? String(data.period.from) + ".." + String(data.period.to) : "-";
  return [
    String(data.desk || "-"),
    cat,
    rev,
    period,
    ymd(data.since) || "-"
  ].join("\t");
}

const HEAD = ["desk", "catalog", "rev", "period (declared, not computed)", "since"]
  .join("\t");

/* ONE FILE'S VERDICT: a row, or a refusal naming what was wrong. `text` reads the file, and a
   read that throws is refused like a parse that does.
   A SIGNED ANSWER WITHIN FORMAT 1 KEEPS ITS UNKNOWN KEYS OUT OF THE VERDICT (updates 4; the version policy Max adopted
   2026-11-01 01:27, point 3; the test architect's condition: "Studio's statistics judge ignores unknown keys once the
   envelope and the desk's signature verify within format 1, and checks the fields it needs by name"). `signed` is the
   caller's word that the opener verified the desk's own signature over these very bytes (src/studio.mjs statsFor), so a
   newer desk that reports one more field is still counted by what this Studio reads by name, and never dropped whole. A
   format other than 1 is refused, naming it. An answer nobody verified keeps the ruling of 2026-09-14 22:33 whole. */
const NEEDED_FORMAT = 1;
function judge(name, text, rows, refused, signed) {
  /* ONE FILE IS REFUSED ALONE, WHATEVER IS WRONG WITH IT: the parse and the key walk are both
     inside the file's own try, and a file too deep for the walk is refused before it. */
  let data, keys;
  try {
    data = parsePlain(text().replace(/^\uFEFF/, "").trim());
    if (!data || typeof data !== "object" || Array.isArray(data)) {
      refused.push({ name, keys: [], extra: ["(not an object)"] });
      return;
    }
    keys = [...keyPaths(data, "")].sort();
  } catch (e) {
    const plain = e && e.said && e.said.vars ? e.said.vars.KEY : null;
    refused.push({ name, keys: [], extra: [!(e && e.said) ? "(not json)"
      : plain ? "(key " + plain + ")" : "(nested too deep)"] });
    return;
  }
  /* `langs` IS THE ONE RULED NOUN WHOSE KEYS ARE THE CATALOG'S AND NOT THE RULING'S. It was
     written out as langs.en and langs.pl, which refused a desk whose catalog declares any
     other code - and since board 646 a catalog may declare any set of any size. The shape is
     still ruled: a language code and a whole number under it, nothing else. */
  /* THE NAMED EDIT OF THE 646 VERDICT (Gemini, 2026-09-21 16:15). The pattern above read
     [a-z0-9-]{2,8}, which put back a narrower version of the very data loss this change
     removed: a desk reporting en-US, pt-BR, an uppercase DE, a one-letter code, or anything
     past eight characters had its WHOLE statistics file discarded. The verdict noticed that
     leg 646a of this same build declares qqq-x-invented, so the build's own fixture would
     have been refused here. The shape is still ruled - a language code and a whole number
     under it, nothing else - and the code is now whatever the catalog declares. */
  const lang = (k) => /^langs\.[a-zA-Z0-9-]{1,64}$/.test(k) && RULED.indexOf("langs.*") >= 0;
  const cardLang = (k) => /^cards\[\]\.langs\.[a-zA-Z0-9-]{1,64}$/.test(k) && RULED.indexOf("cards[].langs.*") >= 0;
  if (signed === true) { /* plant:u4-unknown */
    if (data.format !== NEEDED_FORMAT) { refused.push({ name, keys, extra: ["(format " + String(data.format) + ")"] }); return; } /* plant:u4-format */
    /* By name: `langs` and a card's `langs` are a code and a number. A key under either that is not a code is refused.
       Every other key Studio does not read is left out of the verdict. */
    const odd = keys.filter(k => (/^langs\./.test(k) && !lang(k)) || (/^cards\[\]\.langs\./.test(k) && !cardLang(k)));
    if (odd.length) refused.push({ name, keys, extra: odd });
    else rows.push({ name, data, keys });
    return;
  }
  const extra = keys.filter(k => RULED.indexOf(k) < 0 && !lang(k) && !cardLang(k));
  if (extra.length) refused.push({ name, keys, extra });
  else rows.push({ name, data, keys });
}

/* LIVE ANSWERS LIVE IN desks/<branch id>/stats.estat, sealed to the lead's box. The old stats/ folder is not read.
   `o.roster` is the branch ids this team lists. `o.open(doc, deskId)` returns the plaintext, or anything else when
   the file does not open. An off-roster folder is skipped before it is opened. A file that does not open is a quiet
   desk, not a row and not a total.
   A DESK SINCE REMOVED (board 900, F2; Claude alpha's ruling of 2026-10-17 11:01): `o.removed` names, by desk id, the
   sha256 of the stats.estat it stored while trusted (src/removed.mjs removedHeld). That file, and no other bytes, is read
   as a row marked `removed` and counted in the totals, never as live state: not in `live`, never quiet. */
const DESK_ID = /^k-[0-9a-f]{16}$/;
const SPAN_FILE = "stats-span.json";
const SPAN_KIND = "etiuda-stats-span";

function localYmd(d) {
  const p = (n) => String(n).padStart(2, "0");
  return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate());
}
/* today is a local calendar day. Shifting it goes by UTC dates, so a month boundary does not depend on the hour.
   The engine's statsShiftYmd, including the empty string it returns for a day it cannot read. */
function shiftYmd(ymd, days) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(ymd || ""));
  if (!m) return "";
  const x = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]) + days * 864e5);
  const p = (n) => String(n).padStart(2, "0");
  return x.getUTCFullYear() + "-" + p(x.getUTCMonth() + 1) + "-" + p(x.getUTCDate());
}
/* The page keeps SPAN_DAYS_KEPT day buckets, today included. The same constant the pinned shell names. */
const SPAN_DAYS_KEPT = 400;
function ymdReal(s) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s || ""));
  if (!m) return false;
  const y = +m[1], mo = +m[2], d = +m[3];
  const x = new Date(Date.UTC(y, mo - 1, d));
  return x.getUTCFullYear() === y && x.getUTCMonth() === mo - 1 && x.getUTCDate() === d;
}
/* Four shapes and no other, the pinned shell's spanShape. rolling-N takes N from 1 to SPAN_DAYS_KEPT
   with no leading zero. A range names two real dates, the first not after the second. */
function spanShape(span) {
  if (typeof span !== "string" || !span) return null;
  if (span === "this-month" || span === "last-month") return { kind: span };
  const rolling = /^rolling-([1-9]\d*)$/.exec(span);
  if (rolling) {
    const n = +rolling[1];
    return n <= SPAN_DAYS_KEPT ? { kind: "rolling", n: n } : null;
  }
  const range = /^range-(\d{4}-\d{2}-\d{2})-(\d{4}-\d{2}-\d{2})$/.exec(span);
  if (!range || !ymdReal(range[1]) || !ymdReal(range[2]) || range[1] > range[2]) return null;
  return { kind: "range", from: range[1], to: range[2] };
}
/** The token when spanShape accepts it, or "" when it does not. A range outside the kept days is still a token. */
function spanKept(span) {
  return spanShape(span) ? String(span) : "";
}
/** The days a span token counts, clipped as the pinned shell's spanPeriod clips them. Null when the token
 *  is not in the grammar, or when a range lies wholly outside the kept days. */
function spanCounted(span, now) {
  const shape = spanShape(span);
  if (!shape) return null;
  const today = localYmd(now || new Date());
  if (shape.kind === "rolling") return { from: shiftYmd(today, 1 - shape.n), to: today };
  if (shape.kind === "this-month") return { from: today.slice(0, 8) + "01", to: today };
  if (shape.kind === "last-month") {
    const end = shiftYmd(today.slice(0, 8) + "01", -1);
    if (!ymdReal(end)) return null;
    return { from: end.slice(0, 8) + "01", to: end };
  }
  if (shape.kind !== "range") return null;
  const oldest = shiftYmd(today, 1 - SPAN_DAYS_KEPT);
  const from = shape.from > oldest ? shape.from : oldest;
  const to = shape.to < today ? shape.to : today;
  if (from > to) return null;
  return { from: from, to: to };
}
/* The six presets on the counting-period band, in the order the band paints them. */
const SPAN_PRESET_TOKENS = ["rolling-7", "rolling-30", "this-month", "last-month", "rolling-90", "rolling-365"];
/** Each preset's days on `now`, and whether that window starts on or after `first`, the first day counted. */
function spanPresetRows(now, first) {
  return SPAN_PRESET_TOKENS.map((token) => {
    const days = spanCounted(token, now);
    return {
      token: token,
      from: days ? days.from : "",
      to: days ? days.to : "",
      fits: !!(days && first && days.from >= first),
    };
  });
}
/** The track: the earliest `since` among answers that are still on the roster, or the oldest kept day,
 *  whichever is later, and never after today. A desk since removed does not move the track. */
function spanTrackOf(rows, now) {
  const today = localYmd(now || new Date());
  const oldest = shiftYmd(today, 1 - SPAN_DAYS_KEPT) || today;
  let since = "";
  for (const r of rows || []) {
    if (r && r.removed) continue;
    const s = ymd(dataOf(r).since);
    if (s && (!since || s < since)) since = s;
  }
  let first = since && since > oldest ? since : oldest;
  if (!first || first > today) first = today;
  return { first: first, today: today };
}
function spanAt(folder) { return path.join(path.resolve(String(folder || ".")), SPAN_FILE); }

/** The span file when spanDocument accepts it and spanGenuine verifies it under `lead`. Otherwise null.
 *  `now` is the clock spanCounted reads, so a caller that fixed the day and the file agree. */
function readSpan(folder, lead, now) {
  let text = null;
  try { text = fs.readFileSync(spanAt(folder), "utf8"); } catch { return null; }
  const R = Engine.statsRules();
  const doc = R.spanDocument(text);
  if (!doc || !lead || !R.spanGenuine(doc, lead)) return null;
  return { span: doc.span, days: spanCounted(doc.span, now), doc };
}

/** Write stats-span.json in the engine's shape, signed under the lead's key. A token the grammar
 *  accepts is written as itself. Anything else is the rolling thirty days. */
function writeSpan(folder, span, open, now) { /* plant:txsl-891sb */
  const token = spanKept(span) || "rolling-30";
  const R = Engine.statsRules();
  const doc = { format: 1, kind: SPAN_KIND, span: token, sig: { alg: "Ed25519", keyId: String(open.keyId) } };
  doc.sig.value = crypto.sign(null, Buffer.from(R.spanSignedBytes(doc)), open.privateKey).toString("hex");
  writeWhole(spanAt(folder), json(doc));
  return { span: token, days: spanCounted(token, now), doc };
}

function readLive(folder, o) {
  const opts = o || {};
  const roster = new Set((opts.roster || []).map(String));
  const desks = path.join(path.resolve(String(folder || ".")), "desks");
  let ids = [];
  try { ids = fs.readdirSync(desks).filter((n) => DESK_ID.test(n)).sort(); } catch { ids = []; }
  const rows = [], refused = [], quiet = [];
  const open = typeof opts.open === "function" ? opts.open : () => null;
  /* `o.signed`: the opener hands back text only where the desk's own signature verified (updates 4). */
  const signed = opts.signed === true;
  let liveN = 0, liveTime = "";
  for (const id of ids) {
    if (!roster.has(id)) continue; /* plant:txsl-891sf */
    const file = path.join(desks, id, "stats.estat");
    let raw = null;
    try { raw = fs.readFileSync(file, "utf8"); } catch { raw = null; }
    let doc = null;
    if (raw != null) {
      try { doc = JSON.parse(String(raw).replace(/^\uFEFF/, "").trim()); } catch { doc = null; }
    }
    const text = raw == null ? null : open(doc, id); /* plant:txsl-891se */
    if (typeof text !== "string") { quiet.push({ desk: id, since: "-" }); continue; }
    const before = rows.length, refusedBefore = refused.length;
    judge(id, () => text, rows, refused, signed);
    if (rows.length === before) {
      if (refused.length === refusedBefore) quiet.push({ desk: id, since: "-" });
      continue;
    }
    liveN += 1; /* plant:txsl-891sd */
    const sync = String((rows[rows.length - 1].data || {}).sync || "");
    if (sync && sync > liveTime) liveTime = sync;
  }
  /* The desks since removed, after the roster's and apart from it: only the bytes named, a row marked `removed`, never live
     and never quiet. */
  const removed = opts.removed && typeof opts.removed === "object" ? opts.removed : {};
  for (const id of ids) {
    if (roster.has(id) || !Object.prototype.hasOwnProperty.call(removed, id)) continue;
    let bytes = null;
    try { bytes = fs.readFileSync(path.join(desks, id, "stats.estat")); } catch { continue; }
    if (crypto.createHash("sha256").update(bytes).digest("hex") !== removed[id]) continue; /* plant:f2-stats-after */
    const raw = bytes.toString("utf8");
    let doc = null;
    try { doc = JSON.parse(raw.replace(/^\uFEFF/, "").trim()); } catch { doc = null; }
    const text = open(doc, id);
    if (typeof text !== "string") continue;
    const before = rows.length;
    judge(id, () => text, rows, refused, signed);
    if (rows.length > before) rows[rows.length - 1].removed = true; /* plant:f2-stats-mark */
  }
  return { rows, refused, quiet, live: { n: liveN, time: liveTime || "-" } };
}
function readStats(folder, o) { return readLive(folder, o); }
async function readStatsAll(folder, o) { return readLive(folder, o); }

/* THE TEAM'S FIGURES, EACH BY ONE RULE, over every accepted answer. `uses` is every
   `cards[].n` added up; `intents` each intent id's n added up, by n descending then id, a total
   order; `misses` every file's misses added up; `langs` each code's count added up, in the order
   the codes first appear, because the languages are the catalogs' own. `pairs` each from-to
   pair's n added up, by n descending then from then to, a total order. `desks` is how many
   answers those are over. Nothing is averaged and nothing is deduplicated: two desks that each
   used one card twice are four uses. */
function teamOf(rows, win) {
  const w = win || windowOf(rows);
  const wf = w && w.from, wt = w && w.to;
  let uses = 0, misses = 0, desks = 0;
  const intents = new Map(), langs = new Map(), pairs = new Map();
  for (const r of rows || []) {
    if (r && r.removed) {
      const d = dataOf(r);
      const p = d.period || {};
      const rf = ymd(p.from), rt = ymd(p.to);
      if (!wf || !wt || !rf || !rt || rf > wt || rt < wf) continue;
    }
    desks += 1;
    const d = dataOf(r);
    (Array.isArray(d.cards) ? d.cards : []).forEach(c => { uses += (c && c.n) | 0; }); /* plant:txsl-891sj */
    (Array.isArray(d.intents) ? d.intents : []).forEach(i => {
      const id = i && i.id != null ? String(i.id) : "";
      if (id) intents.set(id, (intents.get(id) || 0) + ((i && i.n) | 0));
    });
    (Array.isArray(d.pairs) ? d.pairs : []).forEach(p => {
      const from = p && p.from != null ? String(p.from) : "";
      const to = p && p.to != null ? String(p.to) : "";
      const n = (p && p.n) | 0;
      if (!from || !to || n <= 0) return;
      const key = JSON.stringify([from, to]);
      const e = pairs.get(key) || { from, to, n: 0 };
      e.n += n;
      pairs.set(key, e);
    });
    if (d.langs && typeof d.langs === "object")
      Object.keys(d.langs).forEach(k => langs.set(k, (langs.get(k) || 0) + (d.langs[k] | 0)));
    misses += d.misses | 0;
  }
  const byUse = Array.from(intents.entries())
    .sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));
  return { desks, uses, misses,
           intents: byUse.map(([id, n]) => ({ id, n })),
           langs: Array.from(langs.entries()).map(([code, n]) => ({ code, n })),
           pairs: Array.from(pairs.values()).sort((a, b) => b.n - a.n
             || (a.from < b.from ? -1 : a.from > b.from ? 1 : 0)
             || (a.to < b.to ? -1 : a.to > b.to ? 1 : 0)) };
}

/** What a refused file is said to be refused for, in the two lines both doors print. */
function refusalLines(r) {
  return [
    "extra keys in " + r.name + ": " + r.extra.join(", "),
    "keys: " + (r.keys.length ? r.keys.join(",") : "(none)"),
  ];
}

/* ---- THE FOUR AGGREGATE VIEWS (M2; spec 3.9 off the shelf, Maxim 2026-09-16 16:08) ----------
 *
 * Four questions a manager asks of a catalog: which cards are used, which are used by nobody,
 * how much of the catalog is used at all, and who has taken up the newest edition. They are
 * computed HERE, out of the same accepted rows the table above is built from, so the command
 * line and the Statistics section print one set of numbers and not two that agree - the rule
 * this file was written under and the reason rowOf lives here rather than on either door.
 *
 * WHAT EACH VIEW COUNTS IS WRITTEN DOWN, at its own function, in the form a second
 * implementation could be written from. A view whose definition lives only in code is a view
 * nobody can check, and these four are named by the specification and defined by nobody.
 *
 * THE HONESTY IS THE HARD PART AND IT IS THREE RULES, each of which was a wrong number before
 * it was a rule:
 *
 *  - A DESK THAT HAS NOT ANSWERED IS NOT A DESK WITH NO USE. Nothing here divides by the number
 *    of desks an organisation has, because no file on the share says what that number is: every
 *    figure is over the answers that are in the folder, and how many that is travels beside
 *    them so a reader can weigh them.
 *  - A CARD PUBLISHED YESTERDAY IS NOT A ROTTING CARD. A card is judged only when it was
 *    published before the period the answers cover began; the rest are counted as not judged
 *    and named as such, never folded into the rotting list to make it look thorough.
 *  - NO RATE IS INVENTED OUT OF A COUNT NOBODY SENT. Searches that found nothing are a ruled
 *    noun and the number of searches is not, so misses are a count here and never a share.
 *
 * AND THE PERIOD IS THE DESKS' OWN. The window below is the span the answers declare, the
 * earliest `from` to the latest `to`, marked declared wherever it is printed, and beside it how
 * many answers are lifetime counts and how many were counted from a day after their `from`.
 */

const TOP_N = 10;
const YMD = /^\d{4}-\d{2}-\d{2}$/;

/** A date as the files carry it, or null. Ten characters, because a sync stamp carries a time
 *  after them and an edition carries a letter. */
function ymd(v) {
  const s = String(v == null ? "" : v).slice(0, 10);
  return YMD.test(s) ? s : null;
}

function dataOf(r) { return (r && r.data) || r || {}; }

/* USES PER CARD, ACROSS THE ANSWERS. For every card id an accepted answer reports with n >= 1:
   `uses` is the sum of that card's n over every accepted answer, `desks` is how many answers
   carry it at all, and `last` is the greatest `at` any of them carries (a row without one adds
   nothing, and a card nobody dated has no last-used date rather than an old one). A card no
   answer mentions is absent here, which is not the same as a card used nought times, and the
   two views below that need the difference take it from the catalog instead. */
function usesByCard(rows) {
  const by = new Map();
  (rows || []).forEach(r => {
    const d = dataOf(r);
    const seen = new Set();
    (Array.isArray(d.cards) ? d.cards : []).forEach(c => {
      const id = c && c.id != null ? String(c.id) : "";
      const n = (c && c.n) | 0;
      if (!id || n <= 0) return;
      const e = by.get(id) || { uses: 0, desks: 0, last: "" };
      e.uses += n;
      if (!seen.has(id)) { e.desks += 1; seen.add(id); }
      const at = ymd(c.at);
      if (at && at > e.last) e.last = at;
      by.set(id, e);
    });
  });
  return by;
}

/* THE WINDOW THE ANSWERS COVER, DECLARED BY THEM. The earliest `period.from` and the latest
   `period.to` over the answers that declare a usable pair; `without` is how many declare none,
   and those answers still count in every other figure, because a use is a use whatever the file
   says about the period it was counted in. If no answer declares a period there is no window,
   and the one view that needs one refuses to judge rather than picking a span of its own. */
function windowOf(rows) {
  let from = "", to = "", without = 0, lifetime = 0, late = 0, since = "";
  const list = (rows || []).filter(r => !(r && r.removed));
  list.forEach(r => {
    const d = dataOf(r);
    const p = d.period || {};
    const f = ymd(p.from), t = ymd(p.to), s = ymd(d.since);
    if (!s) lifetime += 1;
    if (!f || !t) { without += 1; return; }
    if (!from || f < from) from = f;
    if (!to || t > to) to = t;
    if (s && s > f) { late += 1; if (s > since) since = s; }
  });
  return { from: from || null, to: to || null, without, over: list.length - without,
           lifetime, late, since: since || null };
}

/* WHICH CARDS AN ANSWER PLACES INSIDE ITS OWN PERIOD. An answer with `since` holds only the
   span's counts, so each card it carries with n >= 1 is `used`. An answer without it holds
   lifetime counts, and only `at`, the last copy, can place one: inside [from, to] is `used`,
   before `from` says the desk did not copy it in the period, after `to` or absent is `unknown`. */
function periodUse(rows, win) {
  const w = win || windowOf(rows);
  const wf = w && w.from, wt = w && w.to;
  const used = new Set(), unknown = new Set();
  (rows || []).forEach(r => {
    if (r && r.removed) {
      const d = dataOf(r);
      const p = d.period || {};
      const rf = ymd(p.from), rt = ymd(p.to);
      if (!wf || !wt || !rf || !rt || rf > wt || rt < wf) return;
    }
    const d = dataOf(r);
    const p = d.period || {};
    const f = ymd(p.from), t = ymd(p.to), byDay = !!ymd(d.since);
    (Array.isArray(d.cards) ? d.cards : []).forEach(c => {
      const id = c && c.id != null ? String(c.id) : "";
      if (!id || ((c && c.n) | 0) <= 0) return;
      const at = ymd(c.at);
      if (byDay || (f && t && at && at >= f && at <= t)) used.add(id);
      else if (!f || !t || !at || at > t) unknown.add(id);
    });
  });
  unknown.forEach(id => { if (used.has(id)) unknown.delete(id); });
  return { used, unknown };
}

/** The oldest and newest sync stamp among the answers, to the day. */
function syncsOf(rows) {
  let oldest = "", newest = "";
  (rows || []).forEach(r => {
    if (r && r.removed) return;
    const s = ymd(dataOf(r).sync);
    if (!s) return;
    if (!oldest || s < oldest) oldest = s;
    if (!newest || s > newest) newest = s;
  });
  return { oldest: oldest || null, newest: newest || null };
}

/* THE EDITION EACH CARD FIRST APPEARED IN. `editions` is the project's archive, oldest first,
   each entry the edition's name, its revision and the ids of the cards in it; the first entry
   carrying an id is that card's publication, and its date is the edition's own name, which the
   engine stamps as a day and a letter. A card the archive does not carry has never been
   published and has no date to be judged by. */
function firstPublished(editions) {
  const at = new Map();
  (Array.isArray(editions) ? editions : []).forEach(e => {
    const date = ymd(e && e.edition) || ymd(e && e.date);
    (Array.isArray(e && e.ids) ? e.ids : []).forEach(id => {
      const k = String(id);
      if (!at.has(k)) at.set(k, { edition: String((e && e.edition) || ""), date });
    });
  });
  return at;
}

/* THE FOUR VIEWS.
 *
 *   rows      the accepted answers, as readStats returns them
 *   o.cards   the cards of the project's current draft, [{id, title}], or null when no project
 *             was named; the title is the primary language's and is shown, never counted
 *   o.editions the archive, oldest first, [{edition, rev, ids}], or [] when nothing is published
 *   o.catalogId the project's catalog id, so a desk answering about another catalog is told
 *             apart from a desk that is behind
 *
 * 1. MOST USED. Every card id an answer COUNTED BY DAY (one carrying `since`) reports with
 *    n >= 1, by uses descending and then by id ascending, which is a total order so the table is
 *    the same table twice. A lifetime answer's n holds copies from before the period and cannot
 *    rank a card within it, so it is left out whole and `left` says how many were. The first
 *    TOP_N are shown and how many there are in all travels with them. It counts nothing but
 *    cards: intents are a different question and misses are not a card.
 *
 * 2. NOBODY USED (the specification's rotting). A card of the project's CURRENT DRAFT that no
 *    accepted answer places a use of inside that answer's period (periodUse), AND that was first
 *    published on or before the window's first day. Everything else unused is `notJudged`: a card
 *    a lifetime answer copied at a day it cannot place in the period, a card first published
 *    after that day, a card never published at all, and every unused card when there is no window
 *    or no archive to judge against. No grace period is applied beyond that day.
 *
 * 3. COVERAGE. Over the cards of the current draft: `used` in the period by any answering desk,
 *    `rotting` by the rule above, `notJudged` the rest. The three add up to the number of cards
 *    exactly, which is the check a reader can run on the tiles. `outside` is beside them rather
 *    than inside: card ids the answers report that this draft does not carry, which is a desk on
 *    an older edition or a card since removed, and belongs in no share of anything. `misses` is
 *    every answer's own misses added up, a count and never a rate.
 *
 * 4. ADOPTION AFTER A RELEASE. The release is the NEWEST EDITION IN THE ARCHIVE, which is what
 *    actually reached the desks, rather than the project's own rev field, which is this
 *    machine's memory of it. Of the accepted answers: `on` carry this catalog's id at that
 *    edition's revision, `behind` carry it at a lower one, `ahead` at a higher one, and `other`
 *    carry another catalog's id or no catalog at all - which is what a desk with nothing loaded
 *    honestly answers, and folding it into `behind` would invent a desk that is one release
 *    late. Never published means there is no release to have been adopted, and it says so.
 */
function viewsOf(rows, o) {
  const opts = o || {};
  const list = rows || [];
  const cards = Array.isArray(opts.cards) ? opts.cards : null;
  const editions = Array.isArray(opts.editions) ? opts.editions : [];
  const catalogId = opts.catalogId == null ? null : String(opts.catalogId);
  const use = usesByCard(list);
  const win = windowOf(list);
  const inPeriod = periodUse(list, win);
  const sync = syncsOf(list);
  const first = firstPublished(editions);
  const last = editions.length ? editions[editions.length - 1] : null;
  const release = last
    ? { edition: String(last.edition || ""), date: ymd(last.edition) || ymd(last.date),
        rev: +last.rev || 0 }
    : null;
  const title = new Map((cards || []).map(c => [String(c.id), String((c && c.title) || "")]));

  const speaks = list.filter(r => ymd(dataOf(r).since));
  const period = usesByCard(speaks);
  const ranked = Array.from(period.keys()).map(id => ({
    id, uses: period.get(id).uses, desks: period.get(id).desks, last: period.get(id).last }));
  ranked.sort((a, b) => b.uses - a.uses || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  const topRow = r => [r.id, title.get(r.id) || "", String(r.uses), String(r.desks), r.last || "-"];
  const top = {
    head: ["card", "title", "uses", "desks", "last used"],
    rows: ranked.slice(0, TOP_N).map(topRow),
    /* Every row, for the screen's Show all; the command line prints the first TOP_N. */
    every: ranked.map(topRow),
    all: ranked.length,
    left: list.length - speaks.length,
  };

  let used = 0, notJudged = 0;
  const rot = [];
  (cards || []).forEach(c => {
    const id = String(c.id);
    if (inPeriod.used.has(id)) { used += 1; return; }
    if (inPeriod.unknown.has(id)) { notJudged += 1; return; }
    const f = first.get(id);
    if (!win.from || !f || !f.date || f.date > win.from) { notJudged += 1; return; }
    /* THE EDITION AND NOT THE DATE AS WELL. An edition is stamped as a day and then letters,
       so the two were the same ten characters on every row of the first screen built from this
       and differed only where two editions went out in one day; one column carries both. */
    rot.push([id, title.get(id) || "", f.edition]);
  });
  rot.sort((a, b) => (a[2] < b[2] ? -1 : a[2] > b[2] ? 1
    : (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0)));
  const why = !cards ? "no project named"
    : !list.length ? "no desk has answered"
    : !editions.length ? "nothing published yet"
    : !win.from ? "no desk declared a period"
    : null;
  const rotting = {
    head: ["card", "title", "first published"],
    rows: rot.slice(0, TOP_N),
    every: rot,
    all: rot.length,
    why,
  };

  const outside = cards
    ? Array.from(use.keys()).filter(id => !title.has(id)).length : null;
  let misses = 0;
  list.forEach(r => { misses += dataOf(r).misses | 0; });
  const coverage = cards
    ? { cards: cards.length, used, rotting: rot.length, notJudged, outside, misses, why }
    : { cards: null, used: null, rotting: null, notJudged: null, outside: null, misses,
        why: "no project named" };

  const live = list.filter(r => !(r && r.removed));
  let on = 0, behind = 0, ahead = 0, other = 0;
  if (release) {
    live.forEach(r => {
      const c = dataOf(r).catalog;
      if (!c || !c.id) { other += 1; return; }
      if (catalogId && String(c.id) !== catalogId) { other += 1; return; }
      const rev = +c.rev || 0;
      if (rev === release.rev) on += 1;
      else if (rev < release.rev) behind += 1;
      else ahead += 1;
    });
  }
  const adoption = {
    release,
    answers: live.length,
    on, behind, ahead, other,
    why: !cards ? "no project named"
      : !release ? "nothing published yet"
      : !live.length ? "no desk has answered" : null,
  };

  /* Per card, the languages the desks counted for it, over the answers that counted by day.
     A code that is not usable, or a count of nothing, is left out. A card nobody counted by
     language is absent, rather than filled with noughts. */
  const cardLangs = {};
  speaks.forEach(r => {
    const list = dataOf(r).cards;
    if (!Array.isArray(list)) return;
    list.forEach(c => {
      const id = c && c.id != null ? String(c.id) : "";
      const bagIn = c && c.langs;
      if (!id || !bagIn || typeof bagIn !== "object" || Array.isArray(bagIn)) return;
      Object.keys(bagIn).forEach(code => {
        if (!code || /[\s:]/.test(code)) return;
        const n = bagIn[code] | 0;
        if (n <= 0) return;
        const bag = cardLangs[id] || (cardLangs[id] = {});
        bag[code] = (bag[code] | 0) + n;
      });
    });
  });

  return {
    answers: { desks: list.length, oldest: sync.oldest, newest: sync.newest },
    team: teamOf(list, win),
    periodTeam: teamOf(speaks, win),
    window: win,
    top, rotting, coverage, adoption, cardLangs,
  };
}

/* THE BLOCKS BOTH DOORS PRINT. One shape for six things: a title, an optional head row and the
   rows, every cell already a string. The command line writes them out with tabs and a blank
   line between blocks; the section paints the team's figures and the two lists as tables and
   two sets of figures as tiles, cell for cell, and tests/stats-screen.mjs holds the two to each
   other. A figure that appeared on one door and not the other is the failure this shape exists
   to make impossible. */
function viewBlocks(v) {
  const kv = (k, s) => [k, s == null ? "-" : String(s)];
  const answers = {
    key: "answers", title: "answers", head: null, rows: [
      kv("desks", v.answers.desks),
      kv("oldest sync", v.answers.oldest),
      kv("newest sync", v.answers.newest),
      kv("window from (declared)", v.window.from),
      kv("window to (declared)", v.window.to),
      kv("answers without a period", v.window.without),
      kv("answers counted since the desk began", v.window.lifetime),
      kv("answers counted from a later day", v.window.late),
      kv("latest day counting began", v.window.since),
    ],
  };
  const t = v.team;
  const team = {
    key: "team", title: "all desks: " + t.desks,
    head: ["uses", "intents", "misses", "langs"],
    rows: [[String(t.uses), listN(t.intents, "id"), String(t.misses),
      t.langs.length ? t.langs.map(l => l.code + "=" + l.n).join(" ") : "-"]],
  };
  const top = {
    key: "top", title: "most used: " + v.top.rows.length + " of " + v.top.all
      + (v.top.left ? " (answers counted since the desk began, left out: " + v.top.left + ")"
        : ""),
    head: v.top.head, rows: v.top.rows,
  };
  const rotting = {
    key: "rotting",
    title: "nobody used: " + v.rotting.rows.length + " of " + v.rotting.all
      + (v.rotting.why ? " (" + v.rotting.why + ")" : ""),
    head: v.rotting.head, rows: v.rotting.rows,
  };
  const c = v.coverage;
  const coverage = {
    key: "coverage", title: "coverage" + (c.why ? " (" + c.why + ")" : ""), head: null, rows: [
      kv("cards", c.cards), kv("used", c.used), kv("rotting", c.rotting),
      kv("not judged", c.notJudged), kv("outside this catalog", c.outside),
      kv("searches that found nothing", c.misses),
    ],
  };
  const a = v.adoption;
  const adoption = {
    key: "adoption",
    title: "adoption after " + (a.release ? (a.release.rev == null ? a.release.edition
      : "rev " + a.release.rev + (a.release.edition ? " (" + a.release.edition + ")" : "")) : "-")
      + (a.why ? " (" + a.why + ")" : ""),
    head: null, rows: [
      kv("answers", a.answers), kv("on the newest", a.on), kv("on an older one", a.behind),
      kv("on a newer one", a.ahead), kv("on another catalog", a.other),
    ],
  };
  return [team, answers, top, rotting, coverage, adoption];
}

/** A block as the command line prints it: the title, the head if it has one, then the rows. */
function blockLines(b) {
  const out = [b.title];
  if (b.head) out.push(b.head.join("\t"));
  b.rows.forEach(r => out.push(r.join("\t")));
  return out;
}

export { RULED, keyPaths, readStats, readStatsAll, readSpan, writeSpan, spanCounted, spanKept, spanTrackOf,
         spanPresetRows, rowOf, HEAD, teamOf, refusalLines,
         TOP_N, ymd, usesByCard, periodUse, windowOf, syncsOf, firstPublished, viewsOf, viewBlocks,
         blockLines };
