/* STUDIO'S WORDS OF C07 AND C09 REACH THE PAGE (board 844, package 22: W3a, W3b, W3c, W3d, 10e, 10h).
 *
 *     node tests/words-studio.mjs
 *
 * The draft's rows themselves (her Polish character for character, the English as a literal in its place, the English
 * they replaced gone) were retired on 2026-11-11 (Max 18:54, Claude α's ruling 19:10): a row could go red only when the
 * words were changed on purpose. A pair missing from the table is
 * tests/polish.mjs's 5a and 7a, and the lint frames' tests/format-said.mjs.
 *
 *   wd5  the lint's {STATE} reaches the page through the table, in Polish, for both states, and stays English in English
 *
 * Node only, no window. Exit 0 when every check holds, 1 when any fails.
 */
import { loadPage } from "./page-stand-in.mjs";

const EXPECTED = 6;

let asserted = 0, failed = 0;
function check(cond, line) {
  asserted++;
  if (cond) process.stdout.write("  ok   " + line + "\n");
  else { failed++; process.stdout.write("  FAIL " + line + "\n"); }
}

/* The state word reaches the page through the table: said as a refusal, in each language. */
{
  const said = { frame: "grew.id: {STATE}, wanted the id of the catalog it grew from", vars: { STATE: "absent" } };
  const said2 = { frame: "desk.{PART}: {STATE}, wanted 64 lower-case hex characters", vars: { PART: "sig", STATE: "malformed" } };
  const pl = loadPage({ api: {}, uiLang: "pl" }).page, en = loadPage({ api: {}, uiLang: "en" }).page;
  pl.S.err = said; en.S.err = said;
  const a = pl.errText(), b = en.errText();
  pl.S.err = said2; en.S.err = said2;
  const c = pl.errText(), d = en.errText();
  check(a === "grew.id: brak; ma tu być identyfikator katalogu, z którego wyrósł ten katalog",
    "wd5 a Polish page says an absent field: " + JSON.stringify(a));
  check(c === "desk.sig: błędna wartość; poprawny zapis to 64 małe znaki szesnastkowe",
    "wd5 a Polish page says a malformed one: " + JSON.stringify(c));
  check(b === "grew.id: absent, wanted the id of the catalog it grew from" && d === "desk.sig: malformed, wanted 64 lower-case hex characters",
    "wd5 CONTROL: an English page still says the engine's own words: " + JSON.stringify([b, d]));
}

/* ---- Part 2, board 966: Audit leaves rail, becomes action on editions in Archive ------------- */
{
  const home = loadPage({ api: {}, uiLang: "en" });
  const P = home.page;
  P.S.screen = "project";
  P.S.section = "cards";
  P.S.open = {
    dir: "C:/Projects/demo",
    name: "demo",
    langs: { rows: [{ code: "en", name: "English" }] },
    draft: { cards: [] },
    editions: [],
    counts: { cards: 1, intents: 0, cats: 0 },
    lint: { errors: 0, warnings: 0, rows: [] },
  };
  P.paintRail();
  const railHtml = (home.doc.querySelector("#rail") || {}).innerHTML || "";
  check(!railHtml.includes('data-v="audit"') && !railHtml.includes(">Audit<"),
    "b966 the rail has no Audit row");

  // An edition in Archive offers Audit action, and pressing it opens the Audit screen on that edition
  P.S.section = "archive";
  P.S.pair = [];
  const ED = "2026-11-08-01";
  P.S.arch = {
    editions: [
      { edition: ED, rev: 1, counts: { cards: 5 }, notes: "First edition" },
    ],
  };
  P.paintArchive();
  const archHtml = (home.doc.querySelector("#main") || {}).innerHTML || "";
  let auditLoadedWith = null;
  P.API = P.API || {};
  P.API.audit = async (dir, edition) => {
    auditLoadedWith = edition;
    return { edition, all: [edition], cards: [], counts: {} };
  };
  const hasAuditBtn = archHtml.includes('data-act="arch-audit"') && archHtml.includes(P.T("Audit"));
  let actSuccess = false;
  if (P.ACTS && typeof P.ACTS["arch-audit"] === "function") {
    P.ACTS["arch-audit"]({ getAttribute: (attr) => (attr === "data-e" ? ED : "") });
    actSuccess = P.S.section === "audit";
  }
  check(hasAuditBtn && actSuccess,
    "b966 an edition's Audit action opens the screen for that edition");

  // A draft with no published editions offers none
  P.S.section = "archive";
  P.S.arch = { editions: [] };
  P.paintArchive();
  const draftHtml = (home.doc.querySelector("#main") || {}).innerHTML || "";
  const draftOffersAudit = draftHtml.includes('data-act="arch-audit"');
  check(!draftOffersAudit && draftHtml.includes(P.T("never published")),
    "b966 a draft offers none");
}

process.stdout.write("\nwords-studio  " + asserted + " assertion(s), " + failed + " failure(s)\n");
if (asserted !== EXPECTED) {
  process.stdout.write("words-studio  expected " + EXPECTED + " assertions, ran " + asserted + "\n");
  failed++;
}
process.exit(failed ? 1 : 0);
