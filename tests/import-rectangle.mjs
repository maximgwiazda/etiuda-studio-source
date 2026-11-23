/* A SHEET'S USED RECTANGLE IS WHAT GETS BUILT, AND A FAR CORNER IS NOT A PILE OF CELLS.
 *
 *     node tests/import-rectangle.mjs [--keep]
 *
 * One cell addressed at the far corner of a sheet asks sheetGrid for every slot from A1 out to
 * that corner. The leg is a few-kilobyte workbook. Before the guard it comes back as a grid;
 * with the guard it is refused by name, and the same refusal is what the cover's reading
 * (attempt) carries. A second cell, XFD1048576, is read in a child whose heap is capped, and
 * only once the nearer corner was already refused, so a run without the guard fails the
 * assertion instead of building the corner.
 *
 * The plant lifts the guard in a scratch copy. ETIUDA_PLANTS=off skips that proof and prints
 * NOT RUN.
 */
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { readWorkbook, sheetGrid, colLetters } from "../src/workbook.mjs";
import { attempt } from "../src/source.mjs";
import { book } from "../tools/fixtures/workbook.mjs";
import { clearScratch, dropScratch } from "./scratch.mjs";
import { copyPlants } from "./plant-copy.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const SCRATCH = path.join(ROOT, "scratch", "import-rectangle");
const SELF = fileURLToPath(import.meta.url);
const ONLY = process.env.IMPORT_RECT_ONLY || "";
const PLANTS_OFF = process.env.ETIUDA_PLANTS === "off";

if (process.env.IMPORT_RECT_FAR) {
  try {
    const buf = fs.readFileSync(process.env.IMPORT_RECT_FAR);
    const sheet = readWorkbook(buf).sheets[0];
    const grid = sheetGrid(sheet);
    process.stdout.write("GRID " + grid.length + "x" + (grid[0] ? grid[0].length : 0) + "\n");
  } catch (e) {
    process.stdout.write("REFUSED " + (e && e.message ? e.message : String(e)) + "\n");
  }
  process.exit(0);
}

/* The budget is the reader's own constant once it exists, and the million a far corner was
   measured against before that constant was written. */
function budgetOf() {
  const src = fs.readFileSync(path.join(ROOT, "src", "workbook.mjs"), "utf8");
  const m = /const CELL_BUDGET = (\d+)/.exec(src);
  return m ? Number(m[1]) : 1048576;
}

let asserted = 0, failed = 0, skipped = 0;
function check(cond, line) {
  asserted++;
  if (cond) process.stdout.write("  ok   " + line + "\n");
  else { failed++; process.stdout.write("  FAIL " + line + "\n"); }
}
function skip(line) {
  skipped++;
  process.stdout.write("  NOT RUN " + line + "\n");
}
const want = (id) => !ONLY || ONLY === id;

function corner(rows, columns, text) {
  const ref = colLetters(columns) + String(rows);
  const buf = book([{ name: "Cards", rows: [{ r: rows, cells: [{ ref, inline: text }] }] }], []);
  return { ref, buf };
}

function main() {
  clearScratch(SCRATCH);
  fs.mkdirSync(SCRATCH, { recursive: true });
  const budget = budgetOf();
  const columns = Math.max(2, Math.ceil(Math.sqrt(budget)));
  const rows = Math.floor(budget / columns) + 1;

  if (want("iu1")) {
    const modest = corner(rows, columns, "near");
    const t0 = Date.now();
    let refused = null, grid = null;
    try { grid = sheetGrid(readWorkbook(modest.buf).sheets[0]); }
    catch (e) { refused = e; }
    const ms = Date.now() - t0;
    const said = refused && refused.message ? refused.message : "";
    check(!!refused && refused.said && /used rectangle/.test(said)
      && said.indexOf(String(budget)) >= 0 && modest.buf.length < 20000 && ms < 2000
      && rows * columns > budget,
      "iu1 a " + modest.buf.length + "-byte workbook, one cell at " + modest.ref
      + " (" + rows + " by " + columns + ", past " + budget + "), is refused in " + ms
      + " ms and no grid is built: " + (said || (grid ? "a grid of " + grid.length : "NOTHING WAS THROWN")));
    const got = attempt({ buf: modest.buf });
    check(!!got.refusal && /used rectangle/.test(got.refusal.message),
      "iu1 and the cover's reading carries that refusal: "
      + (got.refusal ? got.refusal.message : "the file was read"));

    let farLine = "not asked";
    let farMs = 0;
    if (refused) {
      const far = corner(1048576, 16384, "far");
      const at = path.join(SCRATCH, "xfd.xlsx");
      fs.writeFileSync(at, far.buf);
      const ft = Date.now();
      const child = spawnSync(process.execPath, ["--max-old-space-size=256", SELF], {
        cwd: ROOT, encoding: "utf8", timeout: 10000, windowsHide: true,
        env: Object.assign({}, process.env, { IMPORT_RECT_FAR: at, IMPORT_RECT_ONLY: "iu1",
          ETIUDA_PLANTS: "off" }),
      });
      farMs = Date.now() - ft;
      farLine = String(child.stdout || "").trim();
      check(far.buf.length < 20000 && far.ref === "XFD1048576" && farLine.startsWith("REFUSED")
        && /used rectangle/.test(farLine) && farMs < 2000,
        "iu1 and XFD1048576, " + far.buf.length + " bytes, is refused in a capped child in "
        + farMs + " ms: " + farLine.slice(0, 180));
    }

    const small = corner(2, 2, "kept");
    const smallGrid = sheetGrid(readWorkbook(small.buf).sheets[0]);
    check(smallGrid.length === 2 && smallGrid[1][1] === "kept",
      "iu1 a sheet of two by two still builds, and its cell is kept");
  }

  if (!ONLY) {
    copyPlants({
      root: ROOT, self: SELF, label: "import-rectangle", onlyVar: "IMPORT_RECT_ONLY",
      check, skip, timeout: 120000,
      plants: [
        { mark: "cell-budget", leg: "iu1", rel: "src/workbook.mjs",
          line: "  /* plant:cell-budget lifted */" },
      ],
    });
  }

  if (!process.argv.includes("--keep")) dropScratch(SCRATCH, "import-rectangle");
  process.stdout.write("import-rectangle: " + asserted + " assertion(s), " + skipped
    + " skipped, " + failed + " failure(s)"
    + (PLANTS_OFF ? " (ETIUDA_PLANTS=off)" : "") + "\n");
  process.exit(failed ? 1 : 0);
}

main();
