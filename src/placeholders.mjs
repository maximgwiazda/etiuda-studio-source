/* PLATFORM PLACEHOLDERS INTO THE ENGINE'S, AND THE ONES THAT HAVE NOWHERE TO GO.
 *
 * Every helpdesk fills a name into a macro with a syntax of its own, and a pile imported with
 * those tokens left in it reads `{{customer.name}}` to the customer. The mapping below is the
 * whole of the translation, and the important half is the second one: a token with no engine
 * equivalent is FLAGGED AND LEFT ALONE, never dropped and never guessed at. A ticket number has
 * no counterpart in a program that has never heard of a ticket, and inventing one would put a
 * wrong value in front of a customer, which is worse than leaving a visible marker for the
 * author to deal with.
 *
 * THE ENGINE'S HALF OF THE TABLE IS NOT WRITTEN HERE. The set of tokens a card body may carry
 * is read from the pinned engine's own canary (src/engine.mjs), so a mapping row naming a
 * token the engine does not have is caught at import time rather than at the desk. That check
 * is the reason this file has a `verify` rather than a comment saying to keep it in step.
 *
 * WHAT A "MAPPING EXISTS" MEANS, since the flagged case is decided by its absence: the platform
 * token means the same thing the engine token means, in every card, with no context. A row is
 * added here when that is true and nowhere else.
 */

/* Matched case-insensitively and with the inner whitespace of a moustache ignored, because
   `{{ customer.name }}` and `{{customer.name}}` are one token to every platform that writes
   them. The pattern is the lookup key; the value is the engine token, or null for "no
   equivalent, flag it". */
const MAP = [
  /* THE PLATFORMS ARE NAMED NOWHERE IN THIS FILE, only their syntaxes. The content scan
     refused this table while two vendors were named in a comment, and it was right to: a
     name in a private tree is a name that migrates. A row is identified by the token it
     matches, which is the only thing the code needs anyway.
     The moustache family: the requester is the person on the other side of the chat. */
  { from: "{{customer.name}}", to: "{PAX}" },
  { from: "{{ticket.requester.name}}", to: "{PAX}" },
  { from: "{{ticket.requester.first_name}}", to: "{PAX}" },
  { from: "{{requester.name}}", to: "{PAX}" },
  { from: "{{ticket.requester.organization.name}}", to: null },
  { from: "{{ticket.id}}", to: null },
  { from: "{{ticket.title}}", to: null },
  { from: "{{ticket.url}}", to: null },
  // The agent, which the engine fills from the name the desk was asked for at first run.
  { from: "{{agent.name}}", to: "{AGENT}" },
  { from: "{{agent.first_name}}", to: "{AGENT}" },
  { from: "{{current_user.name}}", to: "{AGENT}" },
  { from: "$(agent.name)", to: "{AGENT}" },
  { from: "$(agent.first_name)", to: "{AGENT}" },
  // The percent-pair family.
  { from: "%%requester_name%%", to: "{PAX}" },
  { from: "%%customer_name%%", to: "{PAX}" },
  { from: "%%agent_name%%", to: "{AGENT}" },
  { from: "%%ticket_id%%", to: null },
];

/* A moustache, a percent pair or a dollar call, whatever is inside it. Written wide on
   purpose: a token this file has no row for still has to be SEEN, or "flag the rest" is a
   promise about tokens somebody already thought of. */
const ANY = /\{\{[^{}]{1,80}\}\}|%%[^%\s]{1,80}%%|\$\([^()\s]{1,80}\)/g;

function normalise(token) {
  return String(token).replace(/\s+/g, "").toLowerCase();
}

const BY_KEY = new Map(MAP.map(r => [normalise(r.from), r]));

/** Translate one passage. Returns the new text and every token met, each with its verdict. */
function translate(text) {
  const found = [];
  const out = String(text == null ? "" : text).replace(ANY, (tok) => {
    const row = BY_KEY.get(normalise(tok));
    if (!row) { found.push({ token: tok, to: null, known: false }); return tok; }
    if (row.to == null) { found.push({ token: tok, to: null, known: true }); return tok; }
    found.push({ token: tok, to: row.to, known: true });
    return row.to;
  });
  return { text: out, found };
}

/* THE SAME TRANSLATION, WITH THE OFFSETS IT HAPPENED AT. Board 602: the text importer has to be
 * able to put back exactly what it changed, one press, byte for byte, so every change it makes
 * to a passage carries where it was and what was there before. `translate` above answers with
 * the new text and cannot say where, because String.replace's callback never learns the offset
 * in the OUTPUT, which is the only offset a reverter can use.
 *
 * ONE TABLE AND ONE REGEX, NOT A SECOND COPY OF EITHER. The lookup is the same BY_KEY, so a row
 * added to MAP is in both answers, and neither function can drift into a different opinion about
 * what a token is. `spans` carries only the tokens that actually CHANGED: a token left alone is
 * flagged in `found` and is not a change to revert.
 *
 * A SPAN CARRIES BOTH OFFSETS. `at` is where the replacement sits in the NEW text, which is what
 * a reverter and a highlighter need; `from` is where the token sat in the OLD text, which is
 * what a caller holding its own marks into the old text needs in order to move them. A caller
 * given only one of the two has to reconstruct the other, and reconstructing it wrongly puts a
 * highlight on the characters beside the ones that changed.
 */
function translateSpans(text) {
  const src = String(text == null ? "" : text);
  const found = [];
  const spans = [];
  let out = "", read = 0;
  ANY.lastIndex = 0;
  let m;
  while ((m = ANY.exec(src)) !== null) {
    const tok = m[0];
    const row = BY_KEY.get(normalise(tok));
    out += src.slice(read, m.index);
    read = m.index + tok.length;
    if (!row || row.to == null) {
      found.push({ token: tok, to: null, known: !!row });
      out += tok;
      continue;
    }
    found.push({ token: tok, to: row.to, known: true });
    spans.push({ at: out.length, len: row.to.length, from: m.index, was: tok,
                 kind: "placeholder" });
    out += row.to;
  }
  out += src.slice(read);
  return { text: out, found, spans };
}

/** Every engine token the table claims exists must exist in the pinned engine. Called by the
 *  importer before it translates anything, so a stale row is a refusal rather than a token
 *  that renders as literal text on somebody's desk. */
function verify(engineTokens) {
  const have = new Set((engineTokens || []).map(t => "{" + t + "}"));
  const bad = MAP.filter(r => r.to != null && !have.has(r.to));
  return bad.map(r => "the mapping sends " + r.from + " to " + r.to
    + ", which the pinned engine does not declare");
}

/* A SINGLE-BRACE TOKEN THE PINNED ENGINE DOES NOT DECLARE REACHES THE CUSTOMER AS WRITTEN: the
   desk fills each token by its exact spelling, so `{agent}` stays `{agent}`. The pinned linter
   warns about it; this line is the stricter one, an error naming the nearest token, and the
   engine's warning about a token it names is dropped (`untold`). A token an engine line already
   names ({WHO}) is left to that line. The line names a card as the engine's reader does, so the
   lint list's jump opens that body in that language. */
const SINGLE = /(?<!\{)\{([A-Za-z][A-Za-z0-9_]*)(?::[^{}]*)?\}(?!\})/g;

function nearestToken(name, tokens) {
  const up = name.toUpperCase();
  if (tokens.indexOf(up) >= 0) return up;
  const dist = (a, b) => {
    let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
    for (let i = 1; i <= a.length; i++) {
      const cur = [i];
      for (let j = 1; j <= b.length; j++)
        cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = cur;
    }
    return prev[b.length];
  };
  let best = null, at = 3;
  for (const t of tokens) { const d = dist(up, t); if (d < at) { at = d; best = t; } }
  return best;
}

/* A helpdesk's own token (ANY) is named with the engine token the importer would have made of
   it, where MAP has one; the importer flags it once and only this rule sees it after. `ix` is
   the card's place in the file, which is how the engine's line names it. */
function tokensMet(catalog, engineTokens, engineLines) {
  const tokens = engineTokens || [];
  const said = (engineLines || []).join("\n");
  const out = [];
  ((catalog && catalog.cards) || []).forEach((c, ix) => {
    const body = c && c.body && typeof c.body === "object" ? c.body : {};
    for (const code of Object.keys(body)) {
      const seen = new Set();
      const met = (raw, near, platform) => out.push({ ix, id: c.id, code, raw, near, platform });
      const text = String(body[code] == null ? "" : body[code]);
      text.replace(SINGLE, (raw, name) => {
        if (tokens.indexOf(name) >= 0 || seen.has(raw) || said.indexOf(raw) >= 0) return raw;
        seen.add(raw);
        const near = nearestToken(name, tokens);
        met(raw, near ? "{" + near + "}" : null, false);
        return raw;
      });
      text.replace(ANY, (raw) => {
        if (seen.has(raw) || said.indexOf(raw) >= 0) return raw;
        seen.add(raw);
        const row = BY_KEY.get(normalise(raw));
        met(raw, row && row.to ? row.to : null, true);
        return raw;
      });
    }
  });
  return out;
}

function unknownTokens(catalog, engineTokens, engineLines) {
  return tokensMet(catalog, engineTokens, engineLines).map(t => "card " + t.id + " (" + t.code
    + "): " + t.raw + " is not a variable the desk fills"
    + (t.near ? "; the desk fills " + t.near : ", so the customer would read it as written"));
}

/* The engine's line about a token: the card by its place from 1, the language in capitals. */
const ENGINE_TOKEN = /^card (\d+): (\{[A-Za-z][A-Za-z0-9_]*(?::[^{}]*)?\}) in the (\S+) body is not a token the desk fills/;

/** The engine's warnings less those about a token one of `met` already names: the same card, the
 *  same language, and a spelling that holds the engine's, since `{{name}}` holds `{name}`. A form
 *  only the engine refuses, a bare {DAYPART} or {GREET:x}, is named by nothing here and stays. */
function untold(warnings, met) {
  return (warnings || []).filter(w => {
    const m = ENGINE_TOKEN.exec(String(w));
    return !m || !(met || []).some(t => t.ix === +m[1] - 1
      && String(t.code).toUpperCase() === m[3] && t.raw.indexOf(m[2]) >= 0);
  });
}

export { MAP, ANY, translate, translateSpans, verify, normalise, unknownTokens, tokensMet, untold };
