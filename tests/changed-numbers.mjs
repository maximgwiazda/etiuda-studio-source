/* THE CHANGED-NUMBER LIST WHEN A CARD'S NUMBER CHANGES.
 *
 *     node tests/changed-numbers.mjs
 *
 * Covers diffCardNumbers(), cardHoldsNumberKey(), changedNumberRows(), Studio's saveCard()/openProject()/
 * lintProject()/dismissChangedNumber() lifecycle (with zero auto-edits and zero publish refusal), UI rendering
 * and Dismiss action in page-stand-in.mjs, and inline scratch-copy plant proofs (skipped when ETIUDA_PLANTS=off).
 */
import { licensedOpts } from "./licensed.mjs";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import * as S from "../src/studio.mjs";
import { clearScratch, dropScratch } from "./scratch.mjs";
import { loadPage } from "./page-stand-in.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const SCRATCH = path.join(ROOT, "scratch", "changed-numbers");
const PLANTS_OFF = process.env.ETIUDA_PLANTS === "off";
const EXPECTED = 19;
const NB = new RegExp(String.fromCharCode(160), "g");

let asserted = 0, skipped = 0, failed = 0;
function check(cond, line) {
  asserted++;
  if (cond) process.stdout.write("  ok   " + line + "\n");
  else { failed++; process.stderr.write("  FAIL " + line + "\n"); }
}
function skip(line) {
  skipped++;
  process.stdout.write("  NOT RUN " + line + "\n");
}
const sha = (p) => crypto.createHash("sha256").update(fs.readFileSync(p)).digest("hex");
const wire = (p) => Promise.resolve(p)
  .then(v => JSON.parse(JSON.stringify(Object.assign({ error: null }, v))));

function plantText(real, from, to, file) {
  const n = real.split(from).length - 1;
  if (n !== 1) throw new Error("plant marker not unique in " + file + " (" + n + "): " + from);
  return real.replace(from, () => to);
}

async function runUnitChecks(N, ck = check) {
  const card = (id, en, pl, extra = {}) => Object.assign({ id, title: { en: "Card " + id }, body: { en, pl } }, extra);

  /* cn1: diffCardNumbers detects removed number when replaced, ignores rewording and initial fill. */
  const replaced = N.diffCardNumbers(
    card("a", "Reply within 14 days.", "Odpowiedz w ciągu 14 dni."),
    card("a", "Reply within 30 days.", "Odpowiedz w ciągu 14 dni."),
    ["en", "pl"]);
  ck(replaced.length === 1 && replaced[0].key === "num:14" && replaced[0].display === "14",
    "cn1 diffCardNumbers detects a changed number on the edited language: " + JSON.stringify(replaced));

  const reworded = N.diffCardNumbers(
    card("a", "Allow 14 days for delivery.", "Na dostawę masz 14 dni."),
    card("a", "Delivery takes up to fourteen days.", "Dostawa trwa do czternastu dni."),
    ["en", "pl"]);
  ck(reworded.length === 0,
    "cn2 rewording keeping the equivalent number is quiet: " + JSON.stringify(reworded));

  const initialFill = N.diffCardNumbers(
    card("a", "Reply within 14 days.", ""),
    card("a", "Reply within 14 days.", "Odpowiedz w ciągu 30 dni."),
    ["en", "pl"]);
  ck(initialFill.length === 0,
    "cn3 populating an empty language does not report an old changed number: " + JSON.stringify(initialFill));

  /* cn4: cardHoldsNumberKey finds a number in either language, ignoring retired cards. */
  const holdsEn = N.cardHoldsNumberKey(card("b", "Returns close after 14 days.", "Brak liczby."), "num:14", ["en", "pl"]);
  const holdsPl = N.cardHoldsNumberKey(card("c", "Send back later.", "Wyślij w ciągu czternastu dni."), "num:14", ["en", "pl"]);
  const holdsRet = N.cardHoldsNumberKey(card("e", "Old 14 days.", "Stare 14 dni.", { retired: true }), "num:14", ["en", "pl"]);
  ck(JSON.stringify(holdsEn) === JSON.stringify(["en"])
    && JSON.stringify(holdsPl) === JSON.stringify(["pl"])
    && holdsRet.length === 0,
    "cn4 cardHoldsNumberKey matches either language and ignores retired cards: "
    + JSON.stringify({ holdsEn, holdsPl, holdsRet }));

  /* cn5: syncChangedWatches adds a watch only when other live cards hold the old number, silent otherwise. */
  const cards = [
    card("a", "You have 30 days.", "Masz 14 dni."),
    card("b", "Returns close after 14 days.", "Zwrot po terminie."),
    card("c", "Write back soon.", "Wyślij w ciągu czternastu dni."),
    card("d", "Unique 99 limit.", "Limit 99."),
    card("e", "Retired 14 policy.", "Archiwalne 14 dni.", { retired: true }),
  ];
  const wasA = card("a", "You have 14 days.", "Masz 14 dni.");
  const watches1 = N.syncChangedWatches(cards, wasA, cards[0], [], ["en", "pl"]);
  const rows1 = N.changedNumberRows({ langs: [{ code: "en" }, { code: "pl" }], cards }, watches1, (d, x) => x.title.en);
  ck(rows1.length === 2 && rows1.map(r => r.card).sort().join(",") === "b,c",
    "cn5 three cards holding 14, changed in one lists the other two live cards (skipping retired): " + JSON.stringify(rows1));

  const wasD = card("d", "Unique 99 limit.", "Limit 99.");
  const cards2 = cards.map(x => (x.id === "d" ? card("d", "Unique 100 limit.", "Limit 100.") : x));
  const watches2 = N.syncChangedWatches(cards2, wasD, cards2[3], [], ["en", "pl"]);
  ck(watches2.length === 0,
    "cn6 unique number changed in a card produces no watch (silent): " + JSON.stringify(watches2));

  /* cn18: a dismissal names the card, the number and the card the number changed in: the same number changed in another card
     keeps its own watch (the test architect's E1 on 6cd2557d). */
  const two = [{ key: "num:14", display: "14", from: "A", dismissed: [] }, { key: "num:14", display: "14", from: "B", dismissed: [] }];
  const once = typeof N.dismissWatches === "function" ? N.dismissWatches(two, "X", "num:14", "A") : null;
  ck(!!once && once[0].dismissed.join() === "X" && once[1].dismissed.length === 0 && two[0].dismissed.length === 0,
    "cn18 dismissing card X's row for 14 from card A leaves X's row for 14 from card B: " + JSON.stringify(once));
}

async function runStudioAndUiChecks(ck = check) {
  clearScratch(SCRATCH);
  const root = path.join(SCRATCH, "projects");
  const pubDir = path.join(SCRATCH, "published");
  fs.mkdirSync(root, { recursive: true });
  fs.mkdirSync(pubDir, { recursive: true });

  const made = await S.newProject(root, "Changed Numbers", [
    { code: "en", name: "English" },
    { code: "pl", name: "Polish" },
  ]);
  const dir = made.dir;
  await S.setPublishFolder(dir, pubDir);
  const shelf = (await S.addTag(dir, "shelf", { en: "General", pl: "Ogolne" })).tag.id;

  const id = {};
  id.a = (await S.addCard(dir, shelf, "Main policy", "You have 14 days to return items.")).card.id;
  await S.saveCard(dir, id.a, { body: { en: "You have 14 days to return items.", pl: "Masz 14 dni na zwrot." } });

  id.b = (await S.addCard(dir, shelf, "Late return", "Returns close after 14 days.")).card.id;
  await S.saveCard(dir, id.b, { body: { en: "Returns close after 14 days.", pl: "Zwroty po terminie." } });

  id.c = (await S.addCard(dir, shelf, "Postal guide", "Send within two weeks.")).card.id;
  await S.saveCard(dir, id.c, { body: { en: "Send within two weeks.", pl: "Wyślij w ciągu czternastu dni." } });

  id.d = (await S.addCard(dir, shelf, "Special fee", "Fee is 99 GBP.")).card.id;
  await S.saveCard(dir, id.d, { body: { en: "Fee is 99 GBP.", pl: "Opłata to 99 PLN." } });

  id.e = (await S.addCard(dir, shelf, "Old policy", "Archived 14 days.")).card.id;
  await S.saveCard(dir, id.e, { body: { en: "Archived 14 days.", pl: "Archiwalne 14 dni." } });
  await S.retireCard(dir, id.e);

  /* Changing Card D (unique 99 -> 100) stays silent. */
  const afterD = await S.saveCard(dir, id.d, { body: { en: "Fee is 100 GBP.", pl: "Opłata to 100 PLN." } });
  const cnAfterD = afterD.lint.rows.filter(r => r.kind === "changed-number");
  ck(cnAfterD.length === 0, "cn7 changing a number held by no other card leaves checks silent: " + JSON.stringify(cnAfterD));

  /* Changing Card A (14 -> 30) surfaces Card B and Card C without auto-editing either card. */
  const afterA = await S.saveCard(dir, id.a, { body: { en: "You have 30 days to return items.", pl: "Masz 30 dni na zwrot." } });
  const rowsAfterA = afterA.lint.rows.filter(r => r.kind === "changed-number");
  const openAfterA = await S.openProject(dir);
  const bCard = openAfterA.draft.cards.find(x => x.id === id.b);
  const cCard = openAfterA.draft.cards.find(x => x.id === id.c);
  ck(rowsAfterA.length === 2
    && rowsAfterA.every(r => r.severity === "suggestion" && r.number === "14" && r.from === id.a && r.go && r.go.field === "body")
    && rowsAfterA.map(r => r.card).sort().join(",") === [id.b, id.c].sort().join(",")
    && bCard.body.en === "Returns close after 14 days."
    && cCard.body.pl === "Wyślij w ciągu czternastu dni.",
    "cn8 saveCard surfaces the 2 other live cards holding 14 and never auto-edits them: " + JSON.stringify(rowsAfterA));

  const lintRows = (await S.lintProject(dir)).rows.filter(r => r.kind === "changed-number");
  const pub = await S.publishProject(dir, await licensedOpts());
  ck(lintRows.length === 2 && pub && pub.refused === null && !!pub.ec,
    "cn9 lintProject shows changed-number rows and publishProject does not refuse publish");

  /* Editing Card B to 30 removes Card B from the list automatically while Card C remains. */
  const afterB = await S.saveCard(dir, id.b, { body: { en: "Returns close after 30 days." } });
  const rowsAfterB = afterB.lint.rows.filter(r => r.kind === "changed-number");
  ck(rowsAfterB.length === 1 && rowsAfterB[0].card === id.c,
    "cn10 updating one listed card removes it from the list while remaining card stays: " + JSON.stringify(rowsAfterB));

  /* UI renders the changed-number suggestion and Dismiss removes the row & persists in project.json only. */
  const openNow = await S.openProject(dir);
  const calls = [];
  const api = {
    dismissChangedNumber: (...a) => { calls.push(a); return wire(S.dismissChangedNumber(...a)); },
  };
  const { page, node } = loadPage({ api, uiLang: "en" });
  Object.assign(page.S, {
    dir, open: openNow, screen: "project", section: "lint", lfilter: "all", lintAs: "list",
    lang: "en", sel: null, stats: null,
  });
  page.paintLint();
  const html = node("#main").innerHTML.replace(NB, " ");
  ck(html.includes("Still uses 14") && html.includes("Removed from Main policy") && html.includes('data-act="number-dismiss"'),
    "cn11 paintLint renders changed-number suggestion row with English labels and Dismiss button");

  /* Claudette's words (2026-11-15, section 2): the row in both languages, with the
     card's title and, where none is known, the whole sentence for another card, never a piece set into the first. */
  const untitled = JSON.parse(JSON.stringify(openNow));
  for (const r of untitled.lint.rows) if (r.kind === "changed-number") delete r.fromTitle;
  const painted = (uiLang, open) => {
    const p = loadPage({ api, uiLang });
    Object.assign(p.page.S, { dir, open, screen: "project", section: "lint", lfilter: "all", lintAs: "list", lang: uiLang, sel: null, stats: null });
    p.page.paintLint();
    return p.node("#main").innerHTML.replace(NB, " ");
  };
  const enTitled = painted("en", openNow), plTitled = painted("pl", openNow), enBare = painted("en", untitled), plBare = painted("pl", untitled);
  const said = {
    plStill: plTitled.includes("Nadal zawiera 14"), plFrom: plTitled.includes("Usuni\u0119to z karty \u201eMain policy\u201d"),
    enOther: enBare.includes("Removed from another card"), plOther: plBare.includes("Usuni\u0119to z innej karty"),
    enTitled: enTitled.includes("Removed from Main policy"),
  };
  ck(Object.values(said).every(Boolean), "cn16 the changed-number row says its card's title, or another card where none is known, as whole sentences, in English and in Polish: " + JSON.stringify(said));

  const draftAt = path.join(dir, openNow.project.draft);
  const draftSha = sha(draftAt);
  await page.ACTS["number-dismiss"]({
    getAttribute: (k) => (k === "data-id" ? id.c : k === "data-num" ? "num:14" : k === "data-from" ? id.a : null),
  });
  const afterDismiss = await S.openProject(dir);
  /* Card B's own change of 14 (cn10) watches card C too: dismissing C's row from card A leaves C's row from card B (cn17), so
     that one is dismissed as well before the list is clear. */
  const fromB = afterDismiss.lint.rows.filter(r => r.kind === "changed-number");
  const cleared = fromB.length === 1 && fromB[0].card === id.c && fromB[0].from === id.b
    ? await S.dismissChangedNumber(dir, id.c, "num:14", id.b) : null;
  const afterRows = cleared ? cleared.lint.rows.filter(r => r.kind === "changed-number") : fromB;
  page.S.open = await S.openProject(dir);
  page.paintLint();
  const htmlAfter = node("#main").innerHTML.replace(NB, " ");
  ck(calls.length === 1 && sha(draftAt) === draftSha
    && !!cleared && afterRows.length === 0
    && !htmlAfter.includes("Still uses 14"),
    "cn12 Dismiss clears the changed-number suggestion in UI and persists in project.json without altering draft bytes: "
    + JSON.stringify({ calls: calls.length, shaSame: sha(draftAt) === draftSha, afterRows: afterRows.length, hasStill: htmlAfter.includes("Still uses 14") }));

  /* cn17: one card holds 14, changed in two source cards: dismissing its row from the first leaves its row from the second. */
  const made2 = await S.newProject(root, "Two Sources", [{ code: "en", name: "English" }, { code: "pl", name: "Polish" }]);
  const dir2 = made2.dir;
  const shelf2 = (await S.addTag(dir2, "shelf", { en: "General", pl: "Ogolne" })).tag.id;
  const two = {};
  for (const [k, t] of [["x", "Holder"], ["a", "Source A"], ["b", "Source B"]]) {
    two[k] = (await S.addCard(dir2, shelf2, t, "Returns close after 14 days.")).card.id;
    await S.saveCard(dir2, two[k], { body: { en: "Returns close after 14 days.", pl: "Zwroty po 14 dniach." } });
  }
  await S.saveCard(dir2, two.a, { body: { en: "Returns close after 30 days.", pl: "Zwroty po 30 dniach." } });
  await S.saveCard(dir2, two.b, { body: { en: "Returns close after 30 days.", pl: "Zwroty po 30 dniach." } });
  const before2 = (await S.lintProject(dir2)).rows.filter(r => r.kind === "changed-number" && r.card === two.x);
  const dismissed2 = await S.dismissChangedNumber(dir2, two.x, "num:14", two.a);
  const after2 = dismissed2.lint.rows.filter(r => r.kind === "changed-number" && r.card === two.x);
  /* The list shows a card once per number, the first source's row; the second source's stands behind it. */
  ck(before2.length === 1 && before2[0].from === two.a && after2.length === 1 && after2[0].from === two.b,
    "cn17 a card holding 14 changed in two cards: dismissing its row from the first leaves its row from the second: "
    + JSON.stringify({ before: before2.map(r => r.from === two.a ? "A" : r.from === two.b ? "B" : r.from), after: after2.map(r => r.from === two.a ? "A" : r.from === two.b ? "B" : r.from) }));
}

async function runPlantProofs() {
  const PLANTS = [
    {
      name: "changed-numbers-diff",
      file: "src/numbers.mjs",
      reds: ["cn1"],
      from: "const removed = keysChanged(wasKeys, nowKeys); /* plant:numbers-diff */",
      to: "const removed = [];",
    },
    {
      name: "changed-numbers-holds",
      file: "src/numbers.mjs",
      reds: ["cn4", "cn5"],
      from: "if (got.keys.includes(numberKey)) langsFound.push(l); /* plant:numbers-holds */",
      to: "if (false && got.keys.includes(numberKey)) langsFound.push(l);",
    },
    {
      name: "changed-numbers-dismiss-from",
      file: "src/numbers.mjs",
      reds: ["cn18"],
      from: "if (w.from !== String(fromId || \"\")) return w; /* plant:numbers-dismiss-from */",
      to: "",
    },
    {
      name: "changed-numbers-surface",
      file: "src/numbers.mjs",
      reds: ["cn5"],
      from: "if (otherMatches.length) next.push({ key: item.key, display: item.display, from: cardNow.id, dismissed: [] }); /* plant:numbers-surface */",
      to: "if (false && otherMatches.length) next.push({ key: item.key, display: item.display, from: cardNow.id, dismissed: [] });",
    },
  ];

  for (const p of PLANTS) {
    if (PLANTS_OFF) {
      skip("plant " + p.name + " turns " + p.reds.join(", ") + " red (ETIUDA_PLANTS=off)");
      continue;
    }
    const seen = [];
    const ck = (cond, line) => { if (!cond) seen.push(String(line).split(" ")[0]); };
    try {
      const real = fs.readFileSync(path.join(ROOT, p.file), "utf8");
      const pDir = path.join(SCRATCH, "plant-" + p.name);
      fs.mkdirSync(pDir, { recursive: true });
      const at = path.join(pDir, path.basename(p.file));
      fs.writeFileSync(at, plantText(real, p.from, p.to, p.file));
      const planted = await import(pathToFileURL(at).href);
      await runUnitChecks(planted, ck);
    } catch (e) {
      seen.push("broken:" + (e && e.message ? e.message : String(e)));
    }
    check(p.reds.every(id => seen.includes(id)) && !seen.some(s => s.startsWith("broken:")),
      "cn13 plant " + p.name + " turns " + p.reds.join(", ") + " red: " + JSON.stringify(seen));
  }
}

async function main() {
  const N = await import("../src/numbers.mjs");
  await runUnitChecks(N);
  await runStudioAndUiChecks();
  await runPlantProofs();
  dropScratch(SCRATCH, "changed-numbers");
  process.stdout.write("#counts checks=" + asserted + " skipped=" + skipped + " failed=" + failed + " expected=" + EXPECTED + "\n");
  if (asserted + skipped !== EXPECTED) {
    process.stderr.write("SUITE DID NOT COMPLETE: " + (asserted + skipped) + " of " + EXPECTED + " checks ran\n");
    return 78;
  }
  process.stdout.write("changed-numbers  " + asserted + " assertion(s), " + skipped + " skipped, " + failed + " failure(s)\n");
  return Math.min(failed, 77);
}

main().then(
  c => process.exit(c),
  e => { process.stderr.write(String(e && e.stack || e) + "\n"); process.exit(2); }
);
