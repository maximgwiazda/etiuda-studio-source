/* SOURCE-SHAPE EXPORT TO THE IMPORTER, and the oracle is the generator's manifest plus the
 * importer plus an independent count of the export file's own bytes.
 *
 *     node tests/adapt.mjs [--keep]
 *
 * For each JSON shape: generate with a seed, adapt, import with tools/import.mjs. csv-columns
 * is already a CSV, so the gate imports it directly. Counts against the manifest and against
 * rows, groups and planted tokens parsed from the export file in this test; ids against the
 * source file; the importer's placeholder count on the draft against
 * manifest.counts.withPlaceholder and against the file; the one-language pile against the
 * awaiting-pl state the importer writes. A missing draft is a failed check, not an early
 * return. EXPECTED, beside the leg list, is the floor on the tally. One HTML-only row per
 * shape that carries an HTML reply; one empty-plain action beside HTML on each of the three
 * shapes that carry a plain/HTML pair. Two refusals: missing comment_value, missing body.
 * One list-shaped file whose rows sit in three groups.
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { table } from "../src/csv.mjs";
import * as Engine from "../src/engine.mjs";
import { clearScratch, dropScratch } from "./scratch.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const SCRATCH = path.join(ROOT, "scratch", "adapt-legs");

const SHAPE_LEGS = ["macros-actions", "folders-responses", "csv-columns", "templates-list",
                    "macros-list"];
const HTML_SHAPES = ["macros-actions", "folders-responses", "templates-list", "macros-list"];
/* 14 checks per JSON shape, 13 for csv-columns, 2+2 refusals, 2 per HTML shape,
   2+2+2 empty-plain, 4 for three groups, 1 floor. */
const EXPECTED = 92;

/* WHICH VERDICT THE PINNED ENGINE GIVES A LANGUAGE CARDS LACK: one error per card before engine
   505, one awaiting finding after it (board 510). Read off the engine's own return shape and
   never the pin's hash, the same probe tests/import.mjs uses and for the same reason - any
   argument serves, because the newer lint carries the key on every return path and the older on
   none. */
const CLASSES_AWAITING = Array.isArray(Engine.lint().lintCatalog(null).awaiting);

const HTML_TWO = "<p>One para.</p><p>Two para.</p>";
const HTML_BODY = "One para.\n\nTwo para.";

let asserted = 0, failed = 0;
function check(cond, line) {
  asserted++;
  if (cond) process.stdout.write("  ok   " + line + "\n");
  else { failed++; process.stderr.write("  FAIL " + line + "\n"); }
}

function run(args) {
  return spawnSync(process.execPath, args, { cwd: ROOT, encoding: "utf8" });
}

function idsOf(shape, doc) {
  if (shape === "macros-actions" || shape === "macros-list")
    return (doc.macros || []).map(m => String(m.id));
  if (shape === "templates-list") return (doc.templates || []).map(t => String(t.id));
  const out = [];
  (doc.folders || []).forEach(f => (f.canned_responses || []).forEach(item => {
    out.push(String(item.id));
  }));
  return out;
}

function idsFromCsv(text) {
  return table(text).rows.map(r => String(r.id));
}

function lastSegment(link) {
  const s = String(link);
  const cut = s.lastIndexOf("/");
  return cut < 0 ? s : s.slice(cut + 1);
}

function groupsOf(values) {
  const set = new Set(values.filter(v => v !== ""));
  return set.size ? set.size : 1;
}

function plantedIn(texts) {
  return texts.filter(t => /\{\{[^}]+\}\}/.test(String(t == null ? "" : t))).length;
}

function templateShelfOf(item) {
  const link = item && item._links && item._links.related
    && item._links.related.parent_folder;
  if (link != null && String(link) !== "") return lastSegment(link);
  return item.folder_id == null ? "" : String(item.folder_id);
}

function countsFromExport(shape, text) {
  if (shape === "csv-columns") {
    const body = table(text).rows;
    return {
      rows: body.length,
      groups: 1,
      planted: plantedIn(body.map(r => r.body_plain_text)),
    };
  }
  const doc = JSON.parse(text);
  if (shape === "macros-actions") {
    const macros = doc.macros || [];
    const shelves = macros.map(m => {
      const raw = String(m.title || "");
      const cut = raw.lastIndexOf("::");
      return cut < 0 ? "" : raw.slice(0, cut);
    });
    const bodies = macros.map(m => {
      const acts = m.actions || [];
      let found = "";
      for (let i = 0; i < acts.length; i++) {
        if (acts[i] && acts[i].field === "comment_value") { found = acts[i].value; break; }
      }
      return found;
    });
    return { rows: macros.length, groups: groupsOf(shelves), planted: plantedIn(bodies) };
  }
  if (shape === "folders-responses") {
    const folders = doc.folders || [];
    const shelves = [];
    const bodies = [];
    folders.forEach(f => (f.canned_responses || []).forEach(item => {
      shelves.push(f.name == null ? "" : String(f.name));
      bodies.push(item.content != null ? item.content : item.content_html);
    }));
    return { rows: bodies.length, groups: groupsOf(shelves), planted: plantedIn(bodies) };
  }
  if (shape === "templates-list") {
    const items = doc.templates || [];
    return {
      rows: items.length,
      groups: groupsOf(items.map(templateShelfOf)),
      planted: plantedIn(items.map(t => t.body)),
    };
  }
  const macros = doc.macros || [];
  const bodies = macros.map(m => {
    const acts = m.actions || [];
    for (let i = 0; i < acts.length; i++) {
      if (!acts[i] || acts[i].name !== "setResponseText") continue;
      const args = acts[i].arguments || {};
      return args.body_text != null ? args.body_text : args.body_html;
    }
    return "";
  });
  return { rows: macros.length, groups: 1, planted: plantedIn(bodies) };
}

function bodyOf(csvAt) {
  const rows = table(fs.readFileSync(csvAt, "utf8")).rows;
  return rows[0] ? String(rows[0].body) : "";
}

function adaptFixture(shape, doc, label) {
  const at = path.join(SCRATCH, label + ".json");
  const csvAt = path.join(SCRATCH, label + ".csv");
  fs.writeFileSync(at, JSON.stringify(doc, null, 1) + "\n", "utf8");
  return { r: run(["tools/adapt.mjs", shape, at, csvAt]), csvAt };
}

function htmlDoc(shape) {
  if (shape === "macros-actions")
    return { macros: [{
      id: "row-html-ma", title: "cat-glem::Vor plas", active: true, position: 1,
      description: "",
      actions: [{ field: "comment_value_html", value: HTML_TWO }],
    }] };
  if (shape === "folders-responses")
    return { folders: [{
      id: "cat-glem", name: "cat-glem",
      canned_responses: [{
        id: "row-html-folders", title: "Vor plas", folder_id: "cat-glem",
        content_html: HTML_TWO, attachments: [],
      }],
    }] };
  if (shape === "templates-list")
    return { templates: [{
      id: "row-html-tl", name: "Vor plas", subject: "", body: HTML_TWO,
      folder_id: "cat-glem",
    }] };
  return { macros: [{
    id: "row-html-ml", name: "Vor plas",
    actions: [{
      arguments: { body_html: HTML_TWO }, name: "setResponseText", type: "user",
    }],
  }] };
}

function htmlReplyLeg(shape) {
  const got = adaptFixture(shape, htmlDoc(shape), "html-" + shape);
  check(got.r.status === 0, shape + " html reply adapt exit " + got.r.status
    + (got.r.status === 0 ? "" : "; " + String(got.r.stderr || got.r.stdout).split("\n")[0]));
  if (got.r.status !== 0) {
    check(false, shape + " html reply body (adapt failed)");
    return;
  }
  const body = bodyOf(got.csvAt);
  const blank = body.indexOf(HTML_BODY) !== -1;
  const noTag = body.indexOf("<") === -1;
  check(blank && noTag, shape + " html reply body has a blank line and no tag "
    + JSON.stringify(body));
}

function shapeLeg(shape, seed, rows) {
  const dir = path.join(SCRATCH, shape);
  const gen = run(["tools/fixtures/generate.mjs", "--seed", String(seed),
    "--rows", String(rows), "--shape", shape, "--out", dir]);
  check(gen.status === 0, shape + " generate exit " + gen.status
    + (gen.status === 0 ? "" : "; " + String(gen.stderr || gen.stdout).split("\n")[0]));
  const manifestAt = path.join(dir, "manifest.json");
  if (!fs.existsSync(manifestAt)) {
    check(false, shape + " wrote a manifest");
    return;
  }
  const manifest = JSON.parse(fs.readFileSync(manifestAt, "utf8"));
  const directCsv = shape === "csv-columns";
  const exportName = (manifest.files || []).find(n => n !== "manifest.json");
  const exportAt = path.join(dir, exportName || "");
  check(!!exportName && fs.existsSync(exportAt), shape + " wrote " + (exportName || "no export"));
  const fileCounts = (!exportName || !fs.existsSync(exportAt))
    ? { rows: 0, groups: 0, planted: 0 }
    : countsFromExport(shape, fs.readFileSync(exportAt, "utf8"));
  check(fileCounts.rows === rows,
    shape + " file rows " + fileCounts.rows + " equal requested " + rows);

  let csvAt;
  if (directCsv) {
    csvAt = exportAt;
  } else {
    csvAt = path.join(SCRATCH, shape + ".csv");
    const adapted = run(["tools/adapt.mjs", shape, exportAt, csvAt]);
    check(adapted.status === 0, shape + " adapt exit " + adapted.status
      + (adapted.status === 0 ? "" : "; " + String(adapted.stderr || adapted.stdout).split("\n")[0]));
  }

  const id = "adapt-" + shape;
  const outDir = path.join(SCRATCH, "import-" + shape);
  const imported = run(["tools/import.mjs", csvAt, outDir, "--id", id, "--name", "Adapt " + shape]);
  const lintAt = path.join(outDir, id + ".lint.json");
  const draftAt = path.join(outDir, id + ".draft.json");
  check(imported.status === 0 && fs.existsSync(lintAt),
    shape + " import wrote the lint report, exit " + imported.status
    + (fs.existsSync(lintAt) ? "" : "; " + String(imported.stderr || imported.stdout).split("\n")[0]));
  check(fs.existsSync(draftAt), shape + " import wrote the draft");
  if (!fs.existsSync(lintAt) || !fs.existsSync(draftAt)) return;

  const report = JSON.parse(fs.readFileSync(lintAt, "utf8"));
  const draft = JSON.parse(fs.readFileSync(draftAt, "utf8"));
  check(report.counts.macros === manifest.counts.rows,
    shape + " macros " + report.counts.macros + " equal manifest rows " + manifest.counts.rows);
  check(report.counts.macros === fileCounts.rows,
    shape + " macros " + report.counts.macros + " equal file rows " + fileCounts.rows);
  check(report.counts.cats === manifest.counts.categories,
    shape + " categories " + report.counts.cats
    + " equal manifest categories " + manifest.counts.categories);
  check(report.counts.cats === fileCounts.groups,
    shape + " categories " + report.counts.cats
    + " equal file groups " + fileCounts.groups);

  const wantIds = directCsv
    ? idsFromCsv(fs.readFileSync(exportAt, "utf8"))
    : idsOf(shape, JSON.parse(fs.readFileSync(exportAt, "utf8")));
  const gotIds = new Set((draft.cards || []).map(c => c.id));
  const missing = wantIds.filter(incomingId => !gotIds.has(incomingId));
  check(wantIds.length > 0 && missing.length === 0,
    shape + " every id survived (" + wantIds.length + " of " + gotIds.size + ")");

  const planted = ((manifest.planted || {}).placeholders || [])[0];
  const verdict = (report.placeholders.mapped || []).concat(report.placeholders.flagged || []);
  const hit = planted && verdict.find(v => v.token === planted.token);
  const n = hit ? hit.n : 0;
  check(!!planted && n === manifest.counts.withPlaceholder,
    shape + " placeholder " + JSON.stringify(planted && planted.token)
    + " count " + n + " equal planted " + manifest.counts.withPlaceholder
    + " [" + verdict.map(v => v.token + " x" + v.n).join(", ") + "]");
  check(!!planted && n === fileCounts.planted,
    shape + " placeholder " + JSON.stringify(planted && planted.token)
    + " count " + n + " equal file " + fileCounts.planted
    + " [" + verdict.map(v => v.token + " x" + v.n).join(", ") + "]");

  const lintFindings = (report.findings || []).filter(f =>
    String(f.what || "").indexOf("Etiuda's checks:") === 0);
  const awaiting = (report.findings || []).filter(f => f.severity === "awaiting");
  const eng = report.engineLint || {};
  const sample = awaiting.length === 1 ? String(awaiting[0].sample || "") : "";
  /* WRITTEN TO READ ON EITHER PIN (board 510): before engine 505 the absence was one error per
     card and Studio classed them, after it the engine says it once itself, so what is asserted
     is what both must be true of - the finding is one, it names pl, its card count is the
     engine's and covers the pile, and classing moved every error it took out of the count
     rather than losing one.
     AMENDED 2026-09-18 BY THE TEST ARCHITECT, two clauses with no teeth at the newer pin.
     `sample.length > 0` held for any non-empty string while the line claims the engine's own
     verdict for pl, so the sample must NAME the language the finding names: `pl:` at the head of
     the newer engine's line, `(pl)` inside the older one's. And `eng.errors + eng.awaiting ===
     raw.errors` reads 0 + 0 === 0 at the newer pin, because engineLint.awaiting is the size of
     the classed set and nothing is classed when the engine is ASKED rather than probed; measured
     by calling awaitingOver with a stub lint of each shape rather than by reading the code. That
     clause stands as arithmetic for the older pin; what carries a number on both is
     engineFindings, one line there and one error per card here, and never nought.
     AMENDED AGAIN 2026-09-18 AT THE PIN MOVE TO 4c377cb, which turned the note above into a red
     leg: 0 + 1 === 0 is false, and the build it reddened was correct. The identity is the
     DIFFERENTIAL path's classing arithmetic and is asserted there; where the engine is ASKED,
     what carries the number is its own awaiting line, whose count src/import.mjs parses, so the
     leg asserts that line whole with the pile's card count in it. */
  check(lintFindings.length === 0 && eng.errors === 0 && eng.warnings === 0
    && awaiting.length === 1 && awaiting[0].lang === "pl"
    && awaiting[0].cards === report.counts.cards
    && awaiting[0].engineFindings > 0
    && (CLASSES_AWAITING
          ? new RegExp("^pl: " + report.counts.cards + " card\\(s\\) lacking text$").test(sample)
          : eng.errors + eng.awaiting === (eng.raw || {}).errors)
    && new RegExp("(^|[^a-z])" + awaiting[0].lang + "([^a-z]|$)").test(sample),
    shape + " one-language pile is one awaiting finding for pl over "
    + awaiting[0].cards + " card(s), " + JSON.stringify(eng) + " over " + awaiting.length
    + " awaiting finding(s)");
}

function main(argv) {
  clearScratch(SCRATCH);
  fs.mkdirSync(SCRATCH, { recursive: true });

  SHAPE_LEGS.forEach(shape => shapeLeg(shape, 7, 40));

  const badAt = path.join(SCRATCH, "missing-comment.json");
  fs.writeFileSync(badAt, JSON.stringify({
    macros: [{
      id: "row-miss-one",
      title: "cat-glem::Vor plas",
      active: true,
      position: 1,
      description: "",
      actions: [{ field: "status", value: "open" }],
    }],
  }, null, 1) + "\n", "utf8");
  const bad = run(["tools/adapt.mjs", "macros-actions", badAt, path.join(SCRATCH, "missing.csv")]);
  const err = String(bad.stderr || "");
  check(bad.status === 2, "missing comment_value exits " + bad.status);
  check(/comment_value/.test(err), "and names comment_value ["
    + err.trim().replace(/\s+/g, " ") + "]");

  const missBodyAt = path.join(SCRATCH, "missing-body.json");
  fs.writeFileSync(missBodyAt, JSON.stringify({
    templates: [{
      id: "row-miss-body",
      name: "Vor plas",
      subject: "",
      folder_id: "cat-glem",
    }],
  }, null, 1) + "\n", "utf8");
  const missBody = run(["tools/adapt.mjs", "templates-list", missBodyAt,
    path.join(SCRATCH, "missing-body.csv")]);
  const missErr = String(missBody.stderr || "");
  check(missBody.status === 2, "missing body exits " + missBody.status);
  check(/\bbody\b/.test(missErr), "and names body ["
    + missErr.trim().replace(/\s+/g, " ") + "]");

  HTML_SHAPES.forEach(htmlReplyLeg);

  const threeDoc = { templates: [
    { _links: { related: { parent_folder: "folders/grp-alpha" } },
      id: "row-shelf-alpha-first", name: "Vor plas", subject: "", body: "One.",
      attachments: [], is_available_for_all_inboxes: true, inbox_ids: [] },
    { _links: { related: { parent_folder: "folders/grp-alpha" } },
      id: "row-shelf-alpha-second", name: "Imb kren", subject: "", body: "Two.",
      attachments: [], is_available_for_all_inboxes: true, inbox_ids: [] },
    { _links: { related: { parent_folder: "folders/grp-beta" } },
      id: "row-shelf-beta-first", name: "Tos wid", subject: "", body: "Three.",
      attachments: [], is_available_for_all_inboxes: true, inbox_ids: [] },
    { _links: { related: { parent_folder: "folders/grp-beta" } },
      id: "row-shelf-beta-second", name: "Glem norv", subject: "", body: "Four.",
      attachments: [], is_available_for_all_inboxes: true, inbox_ids: [] },
    { _links: { related: { parent_folder: "folders/grp-gamma" } },
      id: "row-shelf-gamma-first", name: "Zub farl", subject: "", body: "Five.",
      attachments: [], is_available_for_all_inboxes: true, inbox_ids: [] },
    { _links: { related: { parent_folder: "folders/grp-gamma" } },
      id: "row-shelf-gamma-second", name: "Mirq ust", subject: "", body: "Six.",
      attachments: [], is_available_for_all_inboxes: true, inbox_ids: [] },
  ] };
  const three = adaptFixture("templates-list", threeDoc, "three-groups");
  check(three.r.status === 0, "templates-list three groups adapt exit " + three.r.status
    + (three.r.status === 0 ? "" : "; "
      + String(three.r.stderr || three.r.stdout).split("\n")[0]));
  const threeId = "adapt-three-groups";
  const threeOut = path.join(SCRATCH, "import-three-groups");
  const threeImp = run(["tools/import.mjs", three.csvAt, threeOut, "--id", threeId,
    "--name", "Three groups"]);
  const threeLint = path.join(threeOut, threeId + ".lint.json");
  check(threeImp.status === 0 && fs.existsSync(threeLint),
    "templates-list three groups import wrote the lint report, exit " + threeImp.status
    + (fs.existsSync(threeLint) ? "" : "; "
      + String(threeImp.stderr || threeImp.stdout).split("\n")[0]));
  const threeReport = fs.existsSync(threeLint)
    ? JSON.parse(fs.readFileSync(threeLint, "utf8")) : { counts: { cats: 0 }, categories: [] };
  const threeCats = threeReport.counts.cats;
  check(threeCats === 3,
    "templates-list three groups shelves " + threeCats + " after import");
  const threeExport = JSON.parse(fs.readFileSync(path.join(SCRATCH, "three-groups.json"), "utf8"));
  const plantedShelves = Array.from(new Set((threeExport.templates || []).map(templateShelfOf))).sort();
  const importedShelves = (threeReport.categories || []).map(c => c.key).sort();
  check(plantedShelves.join("\0") === importedShelves.join("\0")
    && plantedShelves.join(",") === "grp-alpha,grp-beta,grp-gamma",
    "templates-list three groups shelf names " + JSON.stringify(importedShelves)
    + " equal planted " + JSON.stringify(plantedShelves));

  const emptyPlain = adaptFixture("macros-actions", {
    macros: [{
      id: "row-empty-plain",
      title: "cat-glem::Vor plas",
      active: true,
      position: 1,
      description: "",
      actions: [
        { field: "comment_value", value: "" },
        { field: "comment_value_html", value: "<p>From html.</p>" },
      ],
    }],
  }, "empty-plain");
  check(emptyPlain.r.status === 0, "empty plain beside html adapt exit " + emptyPlain.r.status
    + (emptyPlain.r.status === 0 ? "" : "; "
      + String(emptyPlain.r.stderr || emptyPlain.r.stdout).split("\n")[0]));
  const emptyBody = emptyPlain.r.status === 0 ? bodyOf(emptyPlain.csvAt) : "";
  check(emptyBody === "From html.", "empty plain beside html yields the html text "
    + JSON.stringify(emptyBody));

  const emptyPlainFolders = adaptFixture("folders-responses", {
    folders: [{
      id: "cat-glem", name: "cat-glem",
      canned_responses: [{
        id: "row-empty-plain-folders", title: "Vor plas", folder_id: "cat-glem",
        content: "", content_html: "<p>From html.</p>", attachments: [],
      }],
    }],
  }, "empty-plain-folders");
  check(emptyPlainFolders.r.status === 0,
    "folders-responses empty plain beside html adapt exit " + emptyPlainFolders.r.status
    + (emptyPlainFolders.r.status === 0 ? "" : "; "
      + String(emptyPlainFolders.r.stderr || emptyPlainFolders.r.stdout).split("\n")[0]));
  const emptyFoldersBody = emptyPlainFolders.r.status === 0
    ? bodyOf(emptyPlainFolders.csvAt) : "";
  check(emptyFoldersBody === "From html.",
    "folders-responses empty plain beside html yields the html text "
    + JSON.stringify(emptyFoldersBody));

  const emptyPlainList = adaptFixture("macros-list", {
    macros: [{
      id: "row-empty-plain-list", name: "Vor plas",
      actions: [{
        arguments: { body_text: "", body_html: "<p>From html.</p>" },
        name: "setResponseText", type: "user",
      }],
    }],
  }, "empty-plain-list");
  check(emptyPlainList.r.status === 0,
    "macros-list empty plain beside html adapt exit " + emptyPlainList.r.status
    + (emptyPlainList.r.status === 0 ? "" : "; "
      + String(emptyPlainList.r.stderr || emptyPlainList.r.stdout).split("\n")[0]));
  const emptyListBody = emptyPlainList.r.status === 0 ? bodyOf(emptyPlainList.csvAt) : "";
  check(emptyListBody === "From html.",
    "macros-list empty plain beside html yields the html text "
    + JSON.stringify(emptyListBody));

  check(asserted + 1 === EXPECTED, "tally " + (asserted + 1) + " equal expected " + EXPECTED);

  if (!argv.includes("--keep")) dropScratch(SCRATCH, "adapt");
  process.stdout.write("adapt-legs: " + asserted + " assertion(s), " + failed + " failure(s)\n");
  process.exit(failed ? 1 : 0);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]))
  main(process.argv.slice(2));
