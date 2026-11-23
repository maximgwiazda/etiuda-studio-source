/* A TABLE IN DISGUISE: ONE COLUMN THAT REPEATS. Board 641, Maxim's rule of 2026-09-20.
 *
 *     import { detectPeriod, proposePeriodic } from "./src/periodic.mjs";
 *     const found = detectPeriod(values);          // { period, skip, score, ... } or null
 *     const t = proposePeriodic(values, rowNumbers);  // { head, rows } the importer can map
 *
 * An export is sometimes not a table at all. One column, a few hundred rows, and the rows come
 * round in a cycle: a name, then the text, then a line that is the same every time. A person
 * reading it sees the table immediately and an importer expecting a header row sees one column
 * called whatever the first cell said.
 *
 * THE RULE IS FIND THE PERIOD AND ASSIGN ROLES BY CHARACTER PROFILE, NOT THIS VENDOR'S CYCLE OF
 * THREE. A reader written around three cells would work on one helpdesk's export and on nothing
 * else, and the next file would look like a bug rather than a shape nobody wrote code for. So
 * the period is measured, the roles are decided from what the cells in each position ARE, and a
 * cycle of two, four or seven is the same code path as a cycle of three.
 *
 * HOW THE PERIOD IS MEASURED. Every candidate period N partitions the column by position in the
 * cycle: rows 0, N, 2N in the first group, rows 1, N+1 in the second, and so on. If N is the
 * real period the groups are homogeneous in character and different from each other, and if it
 * is not they are all the same soup. That is one-way analysis of variance and the statistic is
 * eta squared - the share of a feature's variance the partition explains - computed over three
 * features that describe what a cell IS rather than what it says: how long it is, how much of
 * it is white space, and how many lines it has. The score of a period is its best feature's
 * eta squared, because a cycle may be obvious in length and invisible in everything else.
 *
 * WHY THE SMALLEST PERIOD WINS. Refining a partition can never lower eta squared, so period six
 * always scores at least as well as period three and a "highest score" rule would report a
 * cycle six long on a file whose cycle is three. The smallest period that passes the floor is
 * taken, and a multiple is preferred only where it is MATERIALLY better - the margin below -
 * which is what a person means by saying the cycle is really six with two similar halves.
 *
 * THE RAGGED LAST CYCLE IS NORMAL. An export ends where the content ended, so the last cycle is
 * often short; the partition has groups of unequal size and nothing here divides by a count
 * that assumes otherwise. What the detection refuses to do is guess: no period found is said
 * out loud and the caller falls through to whatever it would have done with one column, because
 * a wrong period would cut a customer's cards in the wrong place and every card after the first
 * would be wrong in the same invisible way.
 */
const MIN_ROWS_PER_GROUP = 3;   /* a group of one or two says nothing about a profile */
const MAX_PERIOD = 12;          /* beyond this a "cycle" is a table with a header per row */
const SCORE_FLOOR = 0.55;       /* below this the groups are not distinguishable at all */
const MULTIPLE_MARGIN = 0.15;   /* how much better a multiple must be to beat its divisor */
const MAX_SKIP = 3;             /* leading rows a title or a header may take */
/* MAX_SKIP above is a ceiling and not a guess: a skip is only taken where the cell it drops
   is the sole exception in an otherwise constant position, which is the rule at leadingStrays. */

/** What a cell IS. Length, white-space share and line count describe the shape of a value
 *  without reading a word of it, which is what makes this rule work in any language. */
function features(v) {
  const s = v == null ? "" : String(v);
  const spaces = (s.match(/\s/g) || []).length;
  const lines = (s.match(/\n/g) || []).length;
  return [Math.log1p(s.length), s.length ? spaces / s.length : 0, Math.log1p(lines)];
}

function mean(xs) { return xs.reduce((a, b) => a + b, 0) / (xs.length || 1); }

/** The share of one feature's variance that a partition explains, between 0 and 1. Zero
 *  variance in the feature is zero explained: a column of identical lengths tells us nothing
 *  about its period, and dividing by it would say the opposite. */
function eta2(values, groupOf, groups) {
  const m = mean(values);
  let total = 0;
  values.forEach(x => { total += (x - m) * (x - m); });
  if (total <= 1e-12) return 0;
  let within = 0;
  for (let g = 0; g < groups; g++) {
    const xs = values.filter((x, i) => groupOf(i) === g);
    if (!xs.length) continue;
    const gm = mean(xs);
    xs.forEach(x => { within += (x - gm) * (x - gm); });
  }
  return Math.max(0, 1 - within / total);
}

/** One candidate's score: the best of the three features, each measured over the same
 *  partition, ADJUSTED FOR HOW MANY GROUPS IT TOOK TO GET IT.
 *
 *  THE ADJUSTMENT IS NOT A TUNING, IT IS THE ANSWER TO A MEASURED FALSE POSITIVE. Every period
 *  from two to twelve is tried, so a column of thirty-six cells offers eleven chances to find a
 *  pattern, and a partition into eleven groups of three explains a third of the variance of
 *  pure noise by arithmetic alone: a shuffled copy of a real cycle scored 0.586 at period 11 and
 *  passed the floor. The correction is the ordinary one for exactly this - eta squared adjusted
 *  for degrees of freedom, 1 - (1 - eta2)(n - 1)/(n - k) - which leaves a real cycle of three
 *  over a hundred rows where it was (0.964 to 0.963 on the file this was written for) and takes
 *  that shuffled column to 0.42. A score that rises with the number of groups is not a score. */
function scoreOf(profiles, period, skip) {
  const used = profiles.slice(skip);
  if (used.length < period * MIN_ROWS_PER_GROUP) return -1;
  const groupOf = (i) => i % period;
  let best = 0;
  for (let f = 0; f < 3; f++) {
    const xs = used.map(p => p[f]);
    best = Math.max(best, eta2(xs, groupOf, period));
  }
  const n = used.length;
  if (n - period <= 1) return -1;
  return Math.max(0, 1 - (1 - best) * (n - 1) / (n - period));
}

/* HOW A LEADING ROW IS FOUND, AND HOW NARROW THAT CLAIM DELIBERATELY IS.
 *
 * Not by the score. A column that is a cycle of three behind one heading still partitions
 * almost perfectly on those same three positions - the heading contaminates one group with one
 * cell and eta squared moves by less than a hundredth on a file of a hundred rows. Not by
 * variance either, for the same reason, and not by counting outliers: on invented and on real
 * prose alike the FIRST cell of a group is an outlier about as often as any other, so an
 * outlier count drops by one whenever a row is dropped and the measure says nothing.
 *
 * The one unambiguous case is this: a leading cell that lands in a group whose OTHER cells are
 * all identical. That group is the constant position of the cycle - the standing line about
 * availability, the footer, the disclaimer - and a cell that differs from it is not a member of
 * it. So a leading cell is skipped when it is the sole exception in an otherwise constant
 * position, and in no other case.
 *
 * WHAT THIS GIVES UP, SAID OUT LOUD. A file with a heading and no constant position keeps its
 * heading, which lands in the first cycle and shifts that one row's fields. A period that is
 * right for a hundred cards and wrong for the first is the honest outcome of having no evidence
 * about the first row, and the alternative - taking a skip whenever the leading cell looks
 * unusual - would cut the cycle in the wrong place on files that were never headed at all,
 * which is measurably what happened when this was tried (three of the five fixtures moved).
 */
function leadingStrays(vals, period) {
  let skip = 0;
  while (skip < MAX_SKIP && skip < vals.length) {
    /* The cells this one would sit with: its own arithmetic progression down the column. */
    const others = [];
    for (let i = skip + period; i < vals.length; i += period) others.push(String(vals[i]));
    const constant = others.length >= MIN_ROWS_PER_GROUP
      && new Set(others).size === 1;
    if (!constant || String(vals[skip]) === others[0]) break;
    skip++;
  }
  return skip;
}

/** The period of a one-column pile. The answer ALWAYS comes back as an object and `found` says
 *  which kind it is, because "no period" is a finding a person has to be told in the same
 *  words every other verdict is told in - with the best candidate and how far under the floor
 *  it fell - rather than a null the caller quietly swallows. `skip` is the number of leading
 *  rows outside the cycle, a title cell or a header, and is only taken where it makes a real
 *  difference, because a skip that buys nothing is a guess about the first row. */
function detectPeriod(values) {
  const vals = (values || []).map(v => (v == null ? "" : String(v)));
  if (vals.length < 2 * MIN_ROWS_PER_GROUP)
    return { found: false, best: null, rows: vals.length, considered: [],
             why: "no period: " + vals.length + " rows is too few to see a cycle in" };
  const profiles = vals.map(features);
  const table = [];
  for (let n = 2; n <= Math.min(MAX_PERIOD, Math.floor(vals.length / MIN_ROWS_PER_GROUP)); n++) {
    const skip = leadingStrays(vals, n);
    table.push({ period: n, skip, score: scoreOf(profiles, n, skip) });
  }
  const considered = table.map(c => ({ period: c.period, skip: c.skip, score: round3(c.score) }));
  if (!table.length)
    return { found: false, best: null, rows: vals.length, considered,
             why: "no period: " + vals.length + " rows is too few to see a cycle in" };
  const passing = table.filter(c => c.score >= SCORE_FLOOR);
  if (!passing.length) {
    const best = table.slice().sort((a, b) => b.score - a.score)[0];
    return { found: false, rows: vals.length, considered,
             best: { period: best.period, skip: best.skip, score: round3(best.score) },
             why: "no period: the closest candidate was a cycle of " + best.period + " at "
               + round3(best.score) + ", under the floor of " + SCORE_FLOOR + ", so the column"
               + " was read as one column" };
  }
  let chosen = passing[0];
  /* A multiple only where it explains materially more: see WHY THE SMALLEST PERIOD WINS. */
  for (let k = 2; k * chosen.period <= MAX_PERIOD; k++) {
    const bigger = table.find(c => c.period === k * chosen.period);
    if (bigger && bigger.score >= chosen.score + MULTIPLE_MARGIN) { chosen = bigger; k = 1; }
  }
  const cycles = Math.ceil((vals.length - chosen.skip) / chosen.period);
  const ragged = (vals.length - chosen.skip) % chosen.period !== 0;
  return {
    found: true,
    period: chosen.period, skip: chosen.skip, score: round3(chosen.score),
    rows: vals.length, cycles, ragged,
    groups: groupProfiles(vals, chosen.period, chosen.skip),
    considered,
    why: "a cycle of " + chosen.period + (chosen.skip ? " after " + chosen.skip
      + " leading row(s)" : "") + " explains " + Math.round(chosen.score * 100)
      + "% of the variation in what the cells are",
  };
}

function round3(x) { return Math.round(x * 1000) / 1000; }

/** What each position in the cycle is like, in the terms the role rule below reads. */
function groupProfiles(vals, period, skip) {
  const out = [];
  for (let g = 0; g < period; g++) {
    const cells = [];
    for (let i = skip + g; i < vals.length; i += period) cells.push(vals[i]);
    const nonEmpty = cells.filter(c => c.trim() !== "");
    const lens = nonEmpty.map(c => c.length).sort((a, b) => a - b);
    const distinct = new Set(nonEmpty).size;
    out.push({
      index: g,
      count: cells.length,
      filled: nonEmpty.length,
      medianLength: lens.length ? lens[Math.floor(lens.length / 2)] : 0,
      maxLength: lens.length ? lens[lens.length - 1] : 0,
      spaceFree: nonEmpty.length
        ? nonEmpty.filter(c => !/\s/.test(c)).length / nonEmpty.length : 0,
      multiline: nonEmpty.length
        ? nonEmpty.filter(c => /\n/.test(c)).length / nonEmpty.length : 0,
      distinct,
      identical: nonEmpty.length >= 2 && distinct === 1,
      unique: nonEmpty.length ? distinct / nonEmpty.length : 0,
    });
  }
  return out;
}

/* ---- roles ------------------------------------------------------------------------------- */

/* THE ROLES, IN THE ORDER THEY ARE CLAIMED, and each rule is about character rather than about
 * position, so that a cycle whose text comes first reads the same as one whose name does.
 *
 *   body   the longest position, where it is long enough to be prose and clearly longer than
 *          the rest. A cycle whose positions are all short has no body and says so.
 *   note   a position identical in every cycle. It is a fixed annotation - a standing line
 *          about availability, a footer, a disclaimer - and it distinguishes no card, so it
 *          goes to the card's note where it is kept and mapped rather than dropped. Dropping
 *          it would be content silently lost; putting it in the body would repeat it on every
 *          card in the catalog.
 *   id     a position whose values are unique and carry no white space at all, WHERE SOME OTHER
 *          position is already the title. On its own such a position is the title, because a
 *          card must have one and a slug is a readable name; beside a prose-like short position
 *          it is the author's own identity for the row.
 *   title  the shortest position left.
 *
 * Anything after that is left unclaimed on purpose, with its profile in the report, because the
 * wizard's override table is where a person says what a fifth position is - and an importer
 * that guesses a fifth role would be inventing a field name rather than reading one.
 */
const LONG_ENOUGH = 60;      /* characters: below this a position is not prose */
const CLEARLY_LONGER = 2;    /* times the next position's median */
const MOSTLY_UNIQUE = 0.9;
const MOSTLY_SPACE_FREE = 0.9;

function assignRoles(groups) {
  const roles = groups.map(g => ({ index: g.index, field: null, rule: null, profile: g }));
  const left = () => roles.filter(r => r.field === null && r.rule === null);

  const byLength = groups.slice().sort((a, b) => b.medianLength - a.medianLength);
  const longest = byLength[0];
  const next = byLength[1];
  if (longest && longest.filled
      && (longest.medianLength >= LONG_ENOUGH || longest.multiline > 0)
      && (!next || longest.medianLength >= CLEARLY_LONGER * Math.max(1, next.medianLength))) {
    const r = roles[longest.index];
    r.field = "body";
    r.rule = "the longest position in the cycle, median " + longest.medianLength
      + " characters against " + (next ? next.medianLength : 0) + " for the next";
  }

  left().forEach(r => {
    if (!r.profile.identical) return;
    r.field = "note";
    r.rule = "identical in all " + r.profile.filled + " of its occurrences, so it distinguishes"
      + " no card; kept as the card's note rather than dropped";
  });

  const rest = left();
  if (rest.length) {
    const slugs = rest.filter(r => r.profile.spaceFree >= MOSTLY_SPACE_FREE
                                && r.profile.unique >= MOSTLY_UNIQUE);
    const shortest = rest.slice().sort((a, b) => a.profile.medianLength - b.profile.medianLength);
    if (rest.length === 1) {
      rest[0].field = "title";
      rest[0].rule = slugs.length
        ? "the one position left, unique and without white space: a slug reads as the title"
        : "the one position left";
    } else {
      const title = shortest.find(r => slugs.indexOf(r) < 0) || shortest[0];
      title.field = "title";
      title.rule = "the shortest position left, median " + title.profile.medianLength
        + " characters";
      const slug = slugs.find(r => r !== title);
      if (slug) {
        slug.field = "id";
        slug.rule = "unique and without white space in every cycle, beside a shorter position"
          + " that reads as the title";
      }
    }
  }

  roles.filter(r => r.field === null).forEach(r => {
    r.rule = "nothing claimed it: median " + r.profile.medianLength + " characters, "
      + Math.round(r.profile.unique * 100) + "% distinct; send it somewhere with the override"
      + " table or drop it deliberately";
  });
  return roles;
}

/* ---- the table a periodic column implies -------------------------------------------------- */

/** A header a mapper can read for a claimed role, and a name that claims nothing for the rest.
 *  Two positions of one role cannot both be that role - which one is the id decides every
 *  card's identity - so the second keeps its position's name and the wizard settles it. */
function headerFor(role, taken) {
  if (role.field && !taken.has(role.field)) { taken.add(role.field); return role.field; }
  return "cell " + (role.index + 1) + " of the cycle";
}

/** The table the cycle implies, in the shape src/csv.mjs's table() returns, so that every
 *  column verdict, language guess and lint finding downstream is the one a real CSV would get.
 *  `rowNumbers` are the source rows the values came from, kept so that a finding can point at
 *  the cell in the file rather than at a row in a table that was never written down. */
function proposePeriodic(values, rowNumbers, detected) {
  const found = detected || detectPeriod(values);
  if (!found.found) return null;
  const vals = (values || []).map(v => (v == null ? "" : String(v)));
  const at = rowNumbers && rowNumbers.length === vals.length
    ? rowNumbers.slice() : vals.map((v, i) => i + 1);
  const roles = assignRoles(found.groups);
  const taken = new Set();
  const heads = roles.map(r => headerFor(r, taken));
  const rows = [];
  for (let i = found.skip; i < vals.length; i += found.period) {
    const row = { __row: at[i] };
    for (let g = 0; g < found.period; g++) {
      row[heads[g]] = i + g < vals.length ? vals[i + g] : "";
    }
    /* A cycle of nothing but empty cells is not a card: the same rule table() applies to a
       blank row of a CSV, applied here for the same reason. */
    if (heads.some(h => String(row[h] || "").trim() !== "")) rows.push(row);
  }
  const skipped = [];
  for (let i = 0; i < found.skip; i++) skipped.push({ row: at[i], value: vals[i] });
  return {
    head: heads, rows, duplicateHeaders: [],
    periodic: {
      period: found.period, skip: found.skip, score: found.score, cycles: rows.length,
      ragged: found.ragged, rowsRead: vals.length, skipped,
      roles: roles.map((r, g) => ({ index: r.index, header: heads[g], field: r.field,
                                    rule: r.rule, profile: r.profile })),
    },
  };
}

export { detectPeriod, proposePeriodic, assignRoles, features, eta2, scoreOf, leadingStrays,
         SCORE_FLOOR, MAX_PERIOD, MULTIPLE_MARGIN };
