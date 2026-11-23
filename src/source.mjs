/* WHAT THE FILE IS, DECIDED BEFORE ANYTHING IS MAPPED. Boards 641 and 642.
 *
 *     import { examine } from "./src/source.mjs";
 *     const src = examine({ file });   // { source, shape, table, fork, notes, ... }
 *
 * Two questions used to be answered by assumption. What kind of file is this - a CSV, or a
 * workbook nobody could open at all - and what shape is inside it: a table with a header row,
 * or one column that comes round in a cycle, or a pile with no structure in it. Both are
 * answered here, from the bytes, and the answer is what the wizard shows before a single
 * column is mapped.
 *
 * THE FORK IS OFFERED AFTER THE FILE HAS BEEN READ, which is Maxim's ruling of 2026-09-20 on
 * board 642 and is the reason this module exists rather than a flag on the importer. Whether to
 * spend a model on an import is a choice a person makes, and it cannot be made honestly before
 * the shape is known: a table needs no model, a periodic column needs no model, and a pile with
 * neither is exactly where one earns its keep. So:
 *
 *   - the DETERMINISTIC path is the default wherever structure was found. It is exact, it costs
 *     nothing and it sends nothing off the desk, and those three are stated in `fork` rather
 *     than left for a person to infer from the absence of a warning.
 *   - the MODEL is PROPOSED, never taken, and only where no structure was found. `fork.model`
 *     carries what would be sent and how much of it, because Studio's rulebook says the only
 *     outward call is on the customer's own key, explicit and per action.
 *   - the deterministic table is returned WHATEVER the fork says. A person who declines the
 *     model, or whose key runs out in the middle of an import, still gets what the reader could
 *     find on its own: nothing a model touches is ever the only copy of anything.
 *
 * NOTHING HERE MAPS A COLUMN, GUESSES A LANGUAGE OR WRITES A CARD. What comes back is the table
 * src/csv.mjs's table() would have returned for the same content, so every verdict downstream -
 * the column rules, the language detection, the engine's own lint - is the one a real CSV would
 * have got, and a periodic column is not a second importer.
 */
import fs from "node:fs";
import { decode, rows as csvRows, table as csvTable, agreedWidth, delimiterOf } from "./csv.mjs";
import { readWorkbook, sheetGrid, trimGrid, firstSheetWithCells } from "./workbook.mjs";
import { detectPeriod, proposePeriodic } from "./periodic.mjs";
import { adapt, shapeOf, COLUMNS as EXPORT_COLUMNS } from "./adapt.mjs";
import { refuse, noteOf, counted } from "./refusal.mjs";

/* Score bands for periodic cycle clarity proposed by Claudette in section W-import (adjustable). */
const CYCLE_BANDS = {
  high: 0.90,
  mid: 0.75,
};

const ZIP_MAGIC = [0x50, 0x4B, 0x03, 0x04];

/** A workbook by its bytes and not by its name. An export saved with the wrong extension is
 *  ordinary, and the first four bytes are not a guess. */
function looksLikeZip(buf) {
  return buf.length >= 4 && ZIP_MAGIC.every((b, i) => buf[i] === b);
}

/** A name is present when, after the same trim csvTable uses, it is a non-empty
 *  string. A first row is a header only if every column of the agreed width that
 *  holds a non-empty cell in any row has a present name: an empty name over empty
 *  cells is not a missing name, and an empty name over content is not a header. */
function headerNamesPresent(raw, width) {
  if (!raw.length) return false;
  const head = raw[0].map(h => String(h).trim());
  for (let j = 0; j < width; j++) {
    if (head[j]) continue;
    if (raw.some(r => String(r[j] == null ? "" : r[j]).trim())) return false;
  }
  return true;
}

/** Three ways csvTable drops a body cell: past the header, under an empty
 *  name, or under a name a later column repeats. Counted apart so one kind
 *  of loss cannot hide another. */
function lossesFrom(raw, head) {
  const lastAt = new Map();
  head.forEach((h, j) => { if (h) lastAt.set(h, j); });
  let extra = 0, unnamed = 0, overwritten = 0;
  for (let i = 1; i < raw.length; i++) {
    raw[i].forEach((c, j) => {
      if (!String(c == null ? "" : c).trim()) return;
      if (j >= head.length) extra++;
      else if (!String(head[j] || "").trim()) unnamed++;
      else if (lastAt.get(head[j]) !== j) overwritten++;
    });
  }
  return { extra, unnamed, overwritten };
}

/** The file as lines, not as CSV fields. Used only when commas are present and the
 *  rows do not agree, so a comma inside a sentence is not a column break. */
function lineCells(text) {
  const s = text.charCodeAt(0) === 0xFEFF ? text.slice(1) : text;
  return s.split(/\r\n|\n|\r/).filter(line => line.trim());
}

/* BLANK LINES ARE THE ONE STRUCTURE A FILE OF REPLIES RELIABLY HAS (sense pass 2026-09-22,
 * item 2). A customer with no export pastes their replies into a text file, one under another
 * with a blank line between, and the reader threw the blank lines away before it looked for a
 * cycle. Six replies whose bodies ran to two lines became thirteen line-cells with titles and
 * bodies mixed, and eight replies of two and three lines came out "a cycle of 7, explaining all
 * of the variation": a confident cut in the wrong places, which is worse than no cut at all.
 *
 * So a block of lines between blank lines is one cell, unless every block has the same number
 * of lines AND the lines come round in a cycle of exactly that length from the first line, in
 * which case the blocks ARE the cycle and reading the lines finds it as it always did (a title
 * line over a body line, blank, and again). A blank line inside a quoted CSV field is part of
 * the field, not a break, so the blocks are asked for only where the CSV reading itself has a
 * blank row.
 *
 * AND A FILE OF BLOCKS HAS NO HEADING. A one-column CSV names its column in its first row; a
 * text file of replies has a reply there, and reading it as the column's name lost the first
 * reply into a heading nobody wrote. The column is named BLOCK_HEAD instead, which no alias
 * claims, so the reply is content and a person says what it becomes.
 */
const BLOCK_HEAD = "blocks";

function blocksOf(text) {
  const s = text.charCodeAt(0) === 0xFEFF ? text.slice(1) : text;
  const out = [];
  let cur = [];
  s.split(/\r\n|\n|\r/).forEach(line => {
    if (line.trim()) cur.push(line);
    else if (cur.length) { out.push(cur); cur = []; }
  });
  if (cur.length) out.push(cur);
  return out;
}

/** The table a grid of cells means, by the same three rules src/csv.mjs's table() follows:
 *  the first row names the columns, a row of nothing but white space is not a row, and a
 *  short row's missing cells are empty rather than undefined. The row numbers are the
 *  workbook's own, so a finding points at the cell a person can go and look at. */
function gridTable(grid, top) {
  const head = (grid[0] || []).map(h => String(h).trim());
  const dup = head.filter((h, i) => h && head.indexOf(h) !== i);
  const body = [];
  for (let i = 1; i < grid.length; i++) {
    const r = grid[i];
    if (!r.some(v => String(v).trim())) continue;
    const o = { __row: top + i + 1 };
    head.forEach((h, j) => { if (h) o[h] = r[j] == null ? "" : r[j]; });
    body.push(o);
  }
  return { head, rows: body, duplicateHeaders: Array.from(new Set(dup)) };
}

/* ---- the fork ----------------------------------------------------------------------------- */

/** What a model would be handed, measured rather than described: a person deciding whether to
 *  send their content somewhere is owed the size of what leaves. */
function wouldSend(values) {
  const characters = values.reduce((a, v) => a + String(v == null ? "" : v).length, 0);
  return { cells: values.length, characters,
           kilobytes: Math.round(Buffer.byteLength(values.join("\n"), "utf8") / 102.4) / 10 };
}

function forkFor(shape, values, provider) {
  const found = shape !== "column";
  const deterministic = {
    name: "deterministic",
    available: true,
    byDefault: found,
    what: found
      ? (shape === "table" ? "read the header row and map the columns"
                           : "read the repeating cycle and map its positions")
      : "import the file as one column and let a person split it by hand",
    exact: true, sends: "nothing leaves this desk", costs: "nothing",
  };
  const modelWhat = noteOf("ask a model to find the cards in the text");
  const model = {
    name: "model",
    available: !!provider,
    proposed: !found,
    byDefault: false,
    provider: provider || null,
    what: modelWhat.message,
    said: modelWhat.said,
    wouldSend: wouldSend(values),
    why: found
      ? "the file has a structure the reader can follow, so a model would be spending a key on"
        + " a question already answered"
      : "no structure was found in the file, which is where a model is worth asking",
    fixableWithout: true,
  };
  return { paths: [deterministic, model], byDefault: "deterministic",
           why: found ? deterministic.what : model.why };
}

/* ---- the file as it actually is (642) -------------------------------------------------------
 *
 * A COVER THAT SHOWS THE FILE RATHER THAN ASSERTING WHAT WAS FOUND IN IT. Maxim ruled variant B
 * on 2026-09-21 12:26, for a table and for a column alike: the top of the person's own file is
 * drawn beside the reading, so the reader's guess becomes checkable in one glance instead of
 * trusted. That needs the file's OWN cells on the wire - not the import's, which are trimmed,
 * mapped and renamed by the time anything downstream sees them - and it needs them from the one
 * reader, or the cover would be the second reader board 641 was about.
 *
 * SMALL BY CONSTRUCTION, because a plan is made again on every change to the mapping and a
 * refusal carries this too: a header and two rows, or three repeats of a cycle, or six blocks
 * of a pile, each cell cut at 400 characters. Nothing here is a presentation decision - where a
 * cell is cut for the eye is the screen's, and it cuts again.
 */
const SAMPLE_CELL = 400;
const sampleCell = (v) => {
  const s = String(v == null ? "" : v);
  return s.length > SAMPLE_CELL ? s.slice(0, SAMPLE_CELL) : s;
};

function sampleOf(shape, rows0, column, periodic) {
  if (shape === "table" && rows0 && rows0.length) {
    return { kind: "table", head: rows0[0].map(sampleCell),
             rows: rows0.slice(1, 3).map(r => r.map(sampleCell)),
             under: Math.max(0, rows0.length - 1) };
  }
  if (shape === "periodic" && periodic && column) {
    const p = periodic.period | 0, skip = periodic.skip | 0;
    const repeats = [];
    for (let i = skip; p > 0 && i + p <= column.length && repeats.length < 3; i += p)
      repeats.push(column.slice(i, i + p).map(sampleCell));
    /* The roles are NOT repeated here: they are already on the reading, under `periodic`, and a
       sample carrying its own copy is two answers to one question. */
    return { kind: "cycle", repeats, times: periodic.cycles | 0 };
  }
  if (shape === "column" && column)
    return { kind: "pile", cells: column.slice(0, 6).map(sampleCell),
             more: Math.max(0, column.length - 6) };
  return null;
}

/** The bytes, from whichever of the three a caller gave. One place, so that a reading and an
 *  attempt at one cannot differ in what they read before they differ in what they found. */
function bufOf(o) {
  return o.buf ? o.buf
    : (o.text != null ? Buffer.from(String(o.text), "utf8") : fs.readFileSync(o.file));
}

/* A hidden row is still read, and a sheet that is not visible is still the import when no
   visible sheet has a cell. The cover says which. These sentences are English until a twin
   exists; the missing-twin list cannot hold them while its own gate wants that list empty. */
function reportHidden(sheet, note) {
  const n = (sheet && sheet.hiddenRows) || 0;
  if (n) note("warning", noteOf("hidden rows read on the sheet \"{SHEET}\": {N}. They are in the import",
    { SHEET: sheet.name, N: n }));
  if (sheet && sheet.state !== "visible")
    note("warning", noteOf("the sheet \"{SHEET}\" is hidden, and no visible sheet has anything in"
      + " its cells, so the import is this sheet's cells", { SHEET: sheet.name }));
}

/* ---- the whole answer ---------------------------------------------------------------------- */

/** Read a file and say what it is. `file` or `buf` or `text`; `provider` is the name of the
 *  model door the project has configured, or nothing, and is only reported. */
function examine(o) {
  const opts = o || {};
  const buf = bufOf(opts);
  const notes = [];
  /* A sentence, or a frame built by noteOf() with its English as `what` and the frame beside it
     as `said`, so the wizard can say it in Polish (item 21); see the same helper in import.mjs. */
  const note = (severity, what) => notes.push(what && typeof what === "object"
    ? { severity, what: what.message, said: what.said } : { severity, what });

  let source, table, column, workbook = null, encoding = "utf-8", replaced = 0, offsets = [];
  /* The file's own rows where there are any, kept for the sample alone: the CSV path's `raw`
     is declared below the workbook branch, so done() cannot close over it on both paths. */
  let rows0 = null;
  /* True where the cells are blocks of a text file rather than rows of a column, so the first
     one is content and not the column's name (item 2). */
  let headless = false;

  if (looksLikeZip(buf)) {
    source = "workbook";
    workbook = readWorkbook(buf);
    const sheet = firstSheetWithCells(workbook);
    if (!sheet) {
      note("error", noteOf("every sheet in this workbook is empty"));
      return done([], null);
    }
    reportHidden(sheet, note); /* plant:hidden-read */
    const other = workbook.sheets.filter(s => s !== sheet && s.cells.length);
    if (other.length)
      note("warning", noteOf("sheets with content in this workbook: {N}. Only \"{SHEET}\" was"
        + " read; import the others separately", { N: other.length + 1, SHEET: sheet.name }));
    workbook.unread.forEach(u => note("warning", noteOf("not read on a sheet: {WHAT} (parts: {N})."
      + " Such content cannot become cards", { WHAT: { frame: u.what }, N: u.parts })));
    workbook.notes.forEach(n => {
      if (n.what === "date-not-converted")
        note("warning", noteOf("the cell {REF} is formatted as a date and was read as the number"
          + " the file holds, not converted, because a workbook counts its dates from a starting"
          + " day of its own", { REF: n.ref }));
      if (n.what === "number-shown")
        note("warning", noteOf("the cell {REF} shows \"{SHOWN}\" and was read as that text, not as"
          + " the stored number \"{STORED}\"", { REF: n.ref, SHOWN: n.shown, STORED: n.stored }));
      if (n.what === "number-not-shown")
        note("warning", noteOf("the cell {REF} has a number format this import cannot show, so the"
          + " stored number \"{STORED}\" was kept", { REF: n.ref, STORED: n.stored }));
      if (n.what === "formula-without-value")
        note("warning", noteOf("the cell {REF} holds a formula and no saved result, so it was read"
          + " as empty. Open the workbook, let it calculate, save it and import again", { REF: n.ref }));
      if (n.what === "error-value")
        note("warning", noteOf("the cell {REF} holds a spreadsheet error and was read as that"
          + " error's own text", { REF: n.ref }));
      if (n.what === "shared-string-missing")
        note("error", noteOf("the cell {REF} points at text this workbook does not hold",
          { REF: n.ref }));
    });
    if (sheet.merges.length)
      note("warning", noteOf("merged regions on the sheet: {N}. The value of each is in its"
        + " top-left cell and the rest of the region is empty in the file, so a merged heading"
        + " reads as one cell and blanks", { N: sheet.merges.length }));
    const trimmed = trimGrid(sheetGrid(sheet));
    const grid = trimmed.rows;
    if (!grid.length) { note("error", noteOf("the sheet has no cell with anything in it")); return done([], null); }
    if (grid[0].length > 1) {
      table = gridTable(grid, trimmed.top);
      rows0 = grid;
      return done(grid.map(r => r[0]), "table");
    }
    column = grid.map(r => String(r[0] == null ? "" : r[0]));
    return periodicOrColumn();
  }

  /* A SUPPORT PLATFORM'S JSON EXPORT (sense pass 2026-09-22, item 20), read by the same rules
     `node tools/adapt.mjs` writes a CSV by, into the same seven columns, and from there it is
     a table like any other: the mapping, the languages and the lint are the ones a CSV gets.
     Recognised by its first character and a parse, never by its name. A JSON file that is none
     of the four shapes is refused by name rather than read as a column of braces. */
  const exported = exportOf(buf);
  if (exported) {
    source = "export";
    encoding = exported.encoding;
    const grid = [EXPORT_COLUMNS.slice()].concat(exported.rows.map(r =>
      EXPORT_COLUMNS.map(c => r[c] == null ? "" : String(r[c]))));
    table = gridTable(grid, 0);
    rows0 = grid;
    return done(grid.map(r => r[0]), "table");
  }

  source = "csv";
  const dec = decode(buf);
  encoding = dec.encoding;
  replaced = dec.replaced;
  offsets = dec.offsets || [];
  /* The separator the rows agree on, comma, semicolon or tab (sense pass 2026-09-22, item 1);
     a comma where none of the three makes a table, which is what this read before. */
  const delim = delimiterOf(dec.text);
  const raw = csvRows(dec.text, delim).filter(r => r.some(v => String(v).trim()));
  /* A TABLE IS ROWS THAT AGREE, with a header of present names. Max width made a
     comma in one sentence into a spreadsheet; row agreement alone still accepts a
     first line whose second cell is empty, and csvTable then drops every cell
     under that empty name with no note, because spare counts fields past head.length. */
  const agreed = agreedWidth(raw);
  if (agreed >= 2 && headerNamesPresent(raw, agreed)) {
    rows0 = raw;
    table = csvTable(dec.text, delim);
    const spare = raw.reduce((a, r) => a + Math.max(0, r.length - table.head.length), 0);
    const lost = lossesFrom(raw, table.head);
    if (spare) {
      const rowsOver = raw.filter(r => r.length > table.head.length).length;
      note("warning", noteOf("Some rows have more fields than the heading row, and fields with"
        + " no heading were not imported: {FIELDS} left out, from {ROWS}.", {
          ROWS: counted(rowsOver, "{N} row", "{N} rows"),
          FIELDS: counted(spare, "{N} field", "{N} fields"),
        }));
    }
    if (lost.unnamed) {
      note("warning", noteOf("Some fields sit under a heading with no name, so they were not"
        + " imported: {FIELDS}. A name added in the file, and a second import, brings them in.", {
          FIELDS: counted(lost.unnamed, "{N} field", "{N} fields"),
        }));
    }
    if (table.duplicateHeaders.length) {
      note("warning", noteOf("Some names appear more than once in the heading row, and of the"
        + " columns sharing a name only the last was read: {NAMES} repeated, {FIELDS} left out.", {
          NAMES: counted(table.duplicateHeaders.length, "{N} name", "{N} names"),
          FIELDS: counted(lost.overwritten, "{N} field", "{N} fields"),
        }));
    }
    return done(raw.map(r => r[0]), "table");
  }
  const blankRow = csvRows(dec.text, delim).some(r => !r.some(v => String(v).trim()));
  const blocks = blankRow ? blocksOf(dec.text) : [];
  if (blocks.length >= 2) {
    headless = true;
    const k = blocks[0].length;
    if (blocks.every(b => b.length === k)) {
      const lines = [].concat(...blocks);
      const cyc = k === 1 ? null : detectPeriod(lines);
      if (k === 1 || (cyc.found && cyc.period === k && !cyc.skip)) {
        column = lines;
        return periodicOrColumn();
      }
    }
    column = blocks.map(b => b.join("\n"));
    /* NO CYCLE IS LOOKED FOR AMONG BLOCKS. Blocks that alternate a short reply and a long one
       come round in a cycle of two by every feature the detector measures, and cutting them
       into pairs is the confident wrong cut this reading exists to stop. */
    return periodicOrColumn("its " + blocks.length + " blocks of text have blank lines between"
      + " them and differ in length, so each block was read as one cell and no cycle was looked"
      + " for; nothing in a block was dropped");
  }
  if (raw.some(r => r.length > 1)) {
    column = lineCells(dec.text);
    if (agreed >= 2) {
      note("warning", noteOf("The file's rows all have the same number of fields, but the first"
        + " row gives no name to a column that holds content, so Studio read the file as one column"
        + " rather than as a table. Nothing in it was lost. Once every column that holds content"
        + " has a name in the first row, Studio reads the file as a table."));
    } else {
      note("warning", noteOf("The file has commas in it, but not the same number on every line, so"
        + " Studio read it as one column rather than as a table. Nothing after a comma was lost."));
    }
    return periodicOrColumn();
  }
  column = raw.map(r => String(r[0] == null ? "" : r[0]));
  return periodicOrColumn();

  /* ---- the two one-column endings, which is where the whole of 641 lives ------------------- */

  function periodicOrColumn(blockWhy) {
    const found = blockWhy
      ? { found: false, best: null, rows: column.length, considered: [], why: blockWhy }
      : detectPeriod(column);
    if (found.found) {
      const proposed = proposePeriodic(column, column.map((v, i) => i + 1), found);
      table = { head: proposed.head, rows: proposed.rows, duplicateHeaders: [] };
      const rowsCount = counted(proposed.rows.length, "{N} row", "{N} rows");
      if (found.score >= CYCLE_BANDS.high) {
        note("warning", noteOf("The file's one column repeats the same pattern, so each repeat became one row"
          + " of a table, {ROWS} in all. The pattern is very clear.", { ROWS: rowsCount }));
      } else if (found.score >= CYCLE_BANDS.mid) {
        note("warning", noteOf("The file's one column repeats the same pattern, so each repeat became one row"
          + " of a table, {ROWS} in all. The pattern is clear, if looser in places, so it is worth"
          + " a glance to see that each row holds what belongs together.", { ROWS: rowsCount }));
      } else {
        note("warning", noteOf("The file's one column repeats the same pattern, so each repeat became one row"
          + " of a table, {ROWS} in all. The pattern is a subtle one, so it is worth checking"
          + " carefully that each row holds what belongs together. A sheet with a heading over"
          + " each column is read as it stands.", { ROWS: rowsCount }));
      }
      if (found.ragged)
        note("warning", noteOf("The last repeat is shorter than the others, as in an export that ends"
          + " where its content ends, so the last row's missing fields were left empty."));
      if (found.skip)
        note("warning", noteOf("The column opens with something that belongs to no repeat, a heading"
          + " or a title perhaps, so it was left out of the table: {CELLS}.", {
            CELLS: counted(found.skip, "{N} cell", "{N} cells"),
          }));
      return done(column, "periodic", proposed.periodic);
    }
    /* NO PERIOD MEANS SAY SO AND FALL THROUGH, NEVER GUESS. One column, read the way a CSV of
       one column is read, and the fork proposes a model because this is the case a model is
       for. A wrong period would cut a customer's cards in the wrong place and every card after
       the first would be wrong in the same invisible way. */
    /* THE DETECTOR'S OWN ACCOUNT IS ON THE READING, `detection.why`, which the report keeps;
       the note a person reads names what was found, in a frame the screen can say in Polish. */
    note("warning", blockWhy
      ? noteOf("this file is blocks of text with blank lines between them, of different"
        + " lengths, so each block was read as one cell and no pattern was looked for; nothing"
        + " in a block was dropped")
      : noteOf("this file is one column with no repeating pattern in it, so it was read as one"
        + " column: {CELLS}", { CELLS: counted(column.length, "{N} cell", "{N} cells") }));
    const head = [headless ? BLOCK_HEAD : String(column[0] || "").trim()];
    const from = headless ? 0 : 1;
    table = { head, rows: column.slice(from).filter(v => String(v).trim()).map((v, i) => {
      const o = { __row: i + 1 + from };
      if (head[0]) o[head[0]] = v;
      return o;
    }), duplicateHeaders: [] };
    return done(column, "column", { detection: found });
  }

  function done(values, shape, extra) {
    return {
      source, shape: shape || "empty",
      table: table || { head: [], rows: [], duplicateHeaders: [] },
      encoding, replaced, offsets,
      workbook: workbook
        ? { sheets: workbook.sheets.map(s => ({ name: s.name, state: s.state,
              cells: s.cells.length, rows: s.rows, columns: s.columns,
              merges: s.merges.length, hiddenRows: s.hiddenRows })),
            unread: workbook.unread, date1904: workbook.date1904 }
        : null,
      periodic: (extra && extra.period) ? extra : null,
      detection: (extra && extra.detection) ? extra.detection : null,
      fork: forkFor(shape || "empty", values, opts.provider),
      /* THE FILE ITSELF, cut small, so a cover can show it rather than assert what it says
         (642). Null where there is nothing to show: a workbook nobody could open has no
         cells, and an absence dressed as a sample would be drawn as an empty file. */
      sample: sampleOf(shape || "empty", rows0, column,
                       (extra && extra.period) ? extra : null),
      notes,
    };
  }
}

/** A JSON export's rows, or null where the bytes are not JSON at all. The shape is asked of the
 *  parsed document, so a file named .txt that holds an export is still one. */
function exportOf(buf) {
  const dec = decode(buf);
  const text = dec.text.charCodeAt(0) === 0xFEFF ? dec.text.slice(1) : dec.text;
  if (!/^\s*\{/.test(text)) return null;
  let doc;
  try { doc = JSON.parse(text); } catch { return null; }
  const shape = shapeOf(doc);
  if (!shape) throw refuse("this JSON file is none of the exports Studio reads: a list of"
    + " macros, of folders of responses, or of templates");
  return { shape, rows: adapt(shape, doc), encoding: dec.encoding };
}

/* ---- a reading that survives a refusal (642) ------------------------------------------------
 *
 * `examine` throws when the bytes cannot be read at all - a zip that is not a workbook, a
 * password-protected book, a sheet with nothing on it - and a caller whose job is to SHOW what
 * is in a file is then left holding a sentence and no facts. Claudia's drawing of the wizard's
 * first cover is the reason this exists: the cover has to say what was found before it offers
 * the fork, and a file that could not be read is exactly the file a person most needs told
 * about.
 *
 * SO THE THROW BECOMES A VALUE, and nothing else changes. `src` is always an examine-shaped
 * answer and `refusal` is the Error or null; the success path is `examine` itself, to the
 * byte, and only the failure gets a shape of its own.
 */

/** WHAT CAN STILL BE SAID ABOUT A FILE THAT CANNOT BE READ AT ALL. The source is the one
 *  `examine` would have decided, from the first four bytes rather than from the name, so
 *  "we opened this as a workbook and it is not one" survives; nothing else is claimed.
 *  `fork` is NULL on purpose. A fork is a choice between two ways of importing a file and
 *  there is no way at all here, so a path marked unavailable would dress an absence up as a
 *  choice somebody could make. */
function unread(buf) {
  return { source: looksLikeZip(buf) ? "workbook" : "csv", shape: "unread",
           table: { head: [], rows: [], duplicateHeaders: [] },
           encoding: null, replaced: 0, workbook: null, periodic: null, detection: null,
           fork: null, sample: null, notes: [] };
}

/** A reading and a refusal, rather than a reading or a throw. Same arguments as `examine`. */
function attempt(o) {
  const opts = o || {};
  const buf = bufOf(opts);
  try { return { src: examine({ buf, provider: opts.provider || null }), refusal: null }; }
  catch (e) {
    /* A FAULT IN THE PROGRAM IS NOT A READING THAT FAILED. Only the refusal class - a sentence
       built for a person, carrying its frame (src/refusal.mjs) - becomes a value here. Anything
       else is a bug and goes on rising, because catching one and calling it "this file could not
       be read" ships a defect to a customer as their own problem. */
    if (!e || !e.said) throw e;
    return { src: unread(buf), refusal: e };
  }
}

export { examine, attempt, gridTable, looksLikeZip, wouldSend, CYCLE_BANDS };
