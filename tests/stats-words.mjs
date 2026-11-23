/* THE STATISTICS, IN WORDS (board 862: The month, in sentences; Claudia beta's sheet of 2026-10-06, accepted by Maxim
 * 2026-10-07 00:43; Claudette's words M1 to M21, state/drafts/studio-vision-words-2026-10-07.md).
 *
 *     node tests/stats-words.mjs [--keep]
 *
 * A real project published once to a share, three desks' answers written beside it as a desk writes them, read through
 * statsFor exactly as the screen reads them, and the screen's In words view painted on tests/page-stand-in.mjs. What it
 * holds: each sentence says the figure the answer carries, in English and in Polish, with its counted forms, its
 * grouping and its dates; In words is the first view and Every answer is the screen as it was; the acts do what their
 * words promise (Link them writes the link to the draft and Undo takes it back, Show them in Cards ticks exactly those
 * cards, the counting period rewrites the span file under the lead's key); its places are held while the share is
 * read; and a launch no longer lands on it. Markup, state and files only: the motion and the look are Maxim's.
 */
import "./licensed-env.mjs";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import * as S from "../src/studio.mjs";
import * as Engine from "../src/engine.mjs";
import { makeKeyFile } from "../src/sign.mjs";
import { newTeam, withDesk, writeTeam } from "../src/team.mjs";
import { jsonText } from "../src/plain-json.mjs";
import { DRAFT_FILE } from "../src/publish.mjs";
import { clearScratch, dropScratch } from "./scratch.mjs";
import { loadPage } from "./page-stand-in.mjs";
import { viewBlocks } from "../src/stats.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const SCRATCH = path.join(ROOT, "scratch", "stats-words");
const EXPECTED = 23;

let asserted = 0, failed = 0;
function check(cond, line) {
  asserted++;
  if (cond) process.stdout.write("  ok   " + line + "\n");
  else { failed++; process.stderr.write("  FAIL " + line + "\n"); }
}
const NB = String.fromCharCode(160);
const wire = (p) => Promise.resolve(p)
  .then(v => JSON.parse(JSON.stringify(Object.assign({ error: null }, v))))
  .catch(e => ({ error: e && e.message ? e.message : String(e), said: (e && e.said) || null }));
/** What a reader reads of some markup: the tags out, the entities and the no-break spaces as plain characters. */
const said = (h) => String(h).replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/&#39;/g, "'").replace(/&quot;/g, '"')
  .replace(/&amp;/g, "&").split(NB).join(" ").replace(/ +/g, " ").trim();
/** The same, with each element's words apart, as a reader hears a row of separate boxes. */
const apart = (h) => said(String(h).replace(/<[^>]+>/g, " "));
const el = (attrs) => ({ getAttribute: (k) => (k in attrs ? attrs[k] : null) });

async function main(argv) {
  clearScratch(SCRATCH);
  const root = path.join(SCRATCH, "projects"), share = path.join(SCRATCH, "share");
  fs.mkdirSync(root, { recursive: true });
  fs.mkdirSync(share, { recursive: true });
  const made = await S.newProject(root, "In words", [{ code: "en", name: "English" }, { code: "pl", name: "Polish" }]);
  const dir = made.dir, draftAt = path.join(dir, DRAFT_FILE);
  const diskNext = (id) => ((JSON.parse(fs.readFileSync(draftAt, "utf8")).cards.find(c => c.id === id) || {}).next || []).map(e => e.to);
  const shelf = (await S.addTag(dir, "shelf", { en: "General", pl: "Ogolne" })).tag.id;
  const ask = (await S.addTag(dir, "request", { en: "Where is my order", pl: "Gdzie jest zamowienie" })).tag.id;
  const id = {};
  for (const k of ["a", "b", "c", "d", "e", "f", "g", "h"]) id[k] = (await S.addCard(dir, shelf, "Card " + k.toUpperCase(), "Thank you for writing.")).card.id;
  await S.saveCard(dir, id.a, { next: [id.b] });
  await S.setPublishFolder(dir, share);
  const pub = await S.publishProject(dir, { now: "2026-09-01T09:00:00.000Z" });
  const proj = JSON.parse(fs.readFileSync(path.join(dir, "project.json"), "utf8"));
  const catalogId = proj.id || JSON.parse(fs.readFileSync(draftAt, "utf8")).id;

  /* Three answers over one declared month: two desks on the newest edition, one a revision behind.
     Each is sealed to the lead's box and read from that desk's own folder. */
  const PASS = "in-words-gate";
  const keyAt = path.join(SCRATCH, "lead-key.json");
  const keyFile = await makeKeyFile({ passphrase: PASS });
  fs.writeFileSync(keyAt, JSON.stringify(keyFile, null, 1) + "\n");
  /* Each desk has a real Ed25519 key from a fixed seed, its id the one the key makes, so it signs its answer inside
     the seal as a desk does and the lead's Studio counts it (board 891's C1). */
  const PKCS8_ED25519 = Buffer.from("302e020100300506032b657004220420", "hex");
  const pair = (fill) => {
    const priv = crypto.createPrivateKey({ key: Buffer.concat([PKCS8_ED25519, Buffer.alloc(32, fill)]), format: "der", type: "pkcs8" });
    const key = crypto.createPublicKey(priv).export({ type: "spki", format: "der" }).subarray(-32).toString("hex");
    return { id: "k-" + crypto.createHash("sha256").update(Buffer.from(key, "hex")).digest("hex").slice(0, 16), key, priv };
  };
  const roster = [
    [pair(0x1a), "dtest-one", "Lamp one"],
    [pair(0x2b), "dtest-two", "Lamp two"],
    [pair(0x3c), "dtest-three", "Lamp three"],
  ];
  let team = newTeam({ catalogs: [catalogId], lead: { keyId: keyFile.keyId, public: keyFile.public } });
  for (const [p, , label] of roster) {
    team = withDesk(team, { id: p.id, key: p.key, box: crypto.randomBytes(32).toString("hex") }, label);
  }
  const wrote = await writeTeam(share, team, { key: keyAt, passphrase: PASS });
  const desk = (p, name, sync, rev, cards, extra) => {
    const deskId = p.id;
    const inner = Object.assign({
      format: 1, kind: "etiuda-statistics", desk: name, engine: "2.0.0-dev",
      period: { from: "2026-09-01", to: "2026-09-30" }, since: "2026-09-01", sync,
      cards: cards.map(([k, n]) => ({ id: id[k], n })), intents: [], misses: 0, langs: { en: 1 }, pairs: [],
      catalog: { id: catalogId, rev }, hash: "djb2:0" }, extra || {});
    inner.sig = { alg: "Ed25519", keyId: deskId };
    inner.sig.value = crypto.sign(null, Engine.statsRules().statsAnswerSignedBytes(inner), p.priv).toString("hex");
    const env = Engine.statsRules().sealStatsLead(wrote.team.lead.box, wrote.team.id, wrote.team.lead.keyId, deskId, JSON.stringify(inner));
    const at = path.join(share, "desks", deskId);
    fs.mkdirSync(at, { recursive: true });
    fs.writeFileSync(path.join(at, "stats.estat"), jsonText(env));
  };
  desk(roster[0][0], "dtest-one", "2026-09-30 13:00", pub.rev, [["a", 12000], ["b", 40], ["c", 3]], {
    intents: [{ id: ask, n: 7 }], misses: 2,
    pairs: [{ from: id.a, to: id.c, n: 9 }, { from: id.a, to: id.b, n: 5 }, { from: id.c, to: id.d, n: 2 }] });
  desk(roster[1][0], "dtest-two", "2026-09-29 09:00", pub.rev, [["a", 30], ["c", 1]], { misses: 1, pairs: [{ from: id.a, to: id.c, n: 4 }] });
  desk(roster[2][0], "dtest-three", "2026-09-28 08:00", pub.rev - 1, [["b", 2]]);

  const calls = [];
  const api = {};
  api.saveCard = (...a) => { calls.push("saveCard"); return wire(S.saveCard(...a)); };
  const wordsNow = new Date(2026, 8, 30, 12, 0, 0);
  api.stats = (d) => { calls.push("statsFor"); return wire(S.statsFor(d, { key: keyAt, passphrase: PASS, now: wordsNow })); };
  api.setStatsSpan = (d, span) => { calls.push("setStatsSpan"); return wire(S.setStatsSpan(d, span, { key: keyAt, passphrase: PASS, now: wordsNow })); };
  api.open = (d) => wire(S.openProject(d));
  api.tabs = () => Promise.resolve({ error: null });
  api.proposals = (d) => wire(S.listProposals(d));
  const home = loadPage({ api, uiLang: "en" });
  const P = home.page;
  const main = () => home.node("#main").innerHTML;
  const rowOf = (key, h) => { const m = new RegExp('data-row="' + key + '"><p class="sm-s">([\\s\\S]*?)</p>').exec(h || main()); return m ? said(m[1].split('<span class="sm-acts">').join(" | ").split("</button><button").join("</button> | <button")) : ""; };
  const open = await wire(S.openProject(dir));
  Object.assign(P.S, { open, screen: "project", section: "stats", lang: "en", sel: null, stats: null });

  try {
    /* ---- 1. THE SENTENCES, IN ENGLISH --------------------------------------------------------------------- */

    await P.statsLoad();
    const h = main();
    const views = [...h.matchAll(/data-act="stats-view" data-v="([a-z]+)"/g)].map(m => m[1]).join(",");
    const on = (/aria-checked="true"[^>]*data-act="stats-view" data-v="([a-z]+)"|class="on"[^>]*data-v="([a-z]+)"/.exec(h) || []);
    check(views.indexOf("words") === 0 && views.indexOf("every") > 0 && /data-act="stats-view" data-v="words"[^>]*>In words</.test(h)
          && /class="[^"]*\bon\b[^"]*"[^>]*data-act="stats-view" data-v="words"/.test(h) && /id="statsSpan"/.test(h)
          && /data-act="stats-span"/.test(h) && /Counted from .+ to .+/.test(said(h)),
      "sw1a Statistics opens In words, the first of its views, with the counting period in its head and the days being"
      + " counted: " + JSON.stringify([views, on[1] || on[2]]));
    check(rowOf("desks") === "Three teammates answered for 1 September to 30 September, the newest on 30 September."
          && (/data-row="desks"[\s\S]*?<span class="sm-desks"[^>]*>((<i><\/i>){3})<\/span><span>answered<\/span>/.test(h)),
      "sw1b who answered, and how fresh, with a square for each desk: " + JSON.stringify(rowOf("desks")));
    check(rowOf("use") === "The catalog was used 12,076 times, and three of its eight cards at least once."
          && /data-count="12076"/.test(h),
      "sw1c how much the catalog carried, grouped as en-GB groups it, one to ten spelt: " + JSON.stringify(rowOf("use")));
    check(rowOf("top") === "The most used card was Card A, 12,030 times, then Card B, 42 times."
          && /data-act="stats-card" data-id="[^"]+"[^>]*>Card A</.test(h),
      "sw1d the two cards the team leans on, each a door to its card: " + JSON.stringify(rowOf("top")));
    check(rowOf("path") === "After Card A, the team went on to Card C 13 times, and the catalog does not link them yet. | Link them | 1 more path on the map"
          && new RegExp('data-act="paths-show" data-id="' + id.c + '"').test(h),
      "sw1e the team's habit the catalog lacks, Link them, and the other path like it, which opens the map at its card: "
      + JSON.stringify(rowOf("path")));
    check(rowOf("rot") === "Five cards were used by nobody, each published before the period began. | Show them in Cards"
          && rowOf("search") === "Three searches found nothing. The team was asked most about Where is my order, seven times."
          && rowOf("edition") === "Two of the three teammates hold the newest edition, rev 1 (" + pub.edition + "); one is still on an older one.",
      "sw1f the cards nobody used, what the team searched for, and who has the newest edition: "
      + JSON.stringify([rowOf("rot"), rowOf("search"), rowOf("edition")]));
    /* The command line's view of the same figures names the release by its rev and date too (board 902, the test architect's SP13). */
    const adoption = (viewBlocks(P.S.stats.views) || []).find((b) => b && b.key === "adoption") || {};
    check(adoption.title === "adoption after rev " + pub.rev + " (" + pub.edition + ")",
      "sw1h the command line's adoption block is titled by the newest edition's rev and date: " + JSON.stringify(adoption.title));
    check(/Counted from the answers of 3 teammates\./.test(said(h)) && /data-act="stats-view" data-v="every">Every answer</.test(h)
          && home.node("#said").textContent === "The teammates' answers are in.",
      "sw1g the foot says where the figures come from, and its Every answer is a door to that view; a reader is told the"
      + " answers are in");

    /* ---- 2. THE SAME ANSWER, IN POLISH -------------------------------------------------------------------- */

    const pl = loadPage({ api, uiLang: "pl" });
    pl.sandbox.STUDIO_T.set("pl");
    Object.assign(pl.page.S, { open: P.S.open, screen: "project", section: "stats", lang: "en", uiLang: "pl", stats: P.S.stats });
    pl.page.paint();
    const ph = pl.node("#main").innerHTML;
    const plRow = (k) => rowOf(k, ph);
    const want = {
      desks: "Za okres od 1 września do 30 września odpowiedzieli członkowie zespołu: 3; najnowsza odpowiedź jest z 30 września.",
      use: "Z katalogu skorzystano 12 076 razy; co najmniej raz użyto 3 z jego 8 kart.",
      path: "Po karcie Card A zespół przechodził dalej do karty Card C 13 razy, choć katalog jeszcze ich nie łączy. | Połącz te karty | 1 kolejna ścieżka na mapie",
      rot: "Nieużywane przez nikogo: 5 kart, każda opublikowana przed początkiem okresu. | Pokaż je w Kartach",
      edition: "Najnowsze wydanie, wer. 1 (" + pub.edition + "), ma w zespole 2 z 3; na starszym: 1.",
    };
    const wrong = Object.keys(want).filter(k => plRow(k) !== want[k]);
    check(wrong.length === 0 && said(ph).indexOf("12 076 razy") >= 0 && ph.indexOf("12" + NB + "076") > 0,
      "sw2a In words turns Polish whole: the few form, digits not words, the genitive month, pl-PL grouping with a no-break"
      + " space: " + JSON.stringify(wrong.map(k => [k, plRow(k)])));
    const english = ["teammates answered", "The catalog was used", "the team went on", "used by nobody", "searches found",
      "newest edition", "In words", "Ask the desks again"].filter(w => said(ph).indexOf(w) >= 0);
    check(english.length === 0 && /Słowami/.test(ph) && /Liczone od .+ do .+/.test(said(ph)),
      "sw2b CONTROL: no English frame is left on the Polish screen: " + JSON.stringify(english));

    /* ---- 3. THE ACTS -------------------------------------------------------------------------------------- */

    P.ACTS["stats-link"](el({ "data-from": id.a, "data-to": id.c }));
    await P.flush();
    const linkedRow = rowOf("path");
    const linkedOnDisk = diskNext(id.a).join(",") === [id.b, id.c].join(",");
    P.ACTS["stats-unlink"](el({ "data-from": id.a, "data-to": id.c }));
    await P.flush();
    check(linkedOnDisk && linkedRow === "After Card A, the team went on to Card C 13 times, and they are linked from the next edition. | Undo | 1 more path on the map"
          && diskNext(id.a).join(",") === id.b && /does not link them yet/.test(rowOf("path")),
      "sw3a Link them writes the link into the draft and the sentence says the desks have it from the next edition, with"
      + " Undo; Undo takes it off again and the sentence is as it was: " + JSON.stringify(linkedRow));
    const before = calls.filter(c => c === "saveCard").length;
    P.ACTS["stats-link"](el({ "data-from": id.a, "data-to": id.b }));
    await P.flush();
    check(calls.filter(c => c === "saveCard").length === before && diskNext(id.a).join(",") === id.b,
      "sw3b CONTROL: Link them on a pair the catalog already links writes nothing");
    P.ACTS["stats-show-cards"]();
    const ticked = [...P.S.ticks].map(x => Object.keys(id).find(k => id[k] === x)).sort().join(",");
    const cardsSaid = home.node("#said").textContent;
    check(P.S.section === "cards" && ticked === "d,e,f,g,h" && cardsSaid === "Cards, with these" + NB + "5" + NB + "cards ticked.",
      "sw3c Show them in Cards opens Cards with exactly the cards nobody used ticked, and says so: " + ticked + ", "
      + JSON.stringify(cardsSaid));
    P.S.section = "stats"; P.S.ticks = new Set();
    await P.statsLoad();
    await P.ACTS["stats-span"](el({ "data-v": "this-month" }));
    const spanText = fs.readFileSync(path.join(share, "stats-span.json"), "utf8");
    const spanDoc = Engine.statsRules().spanDocument(spanText);
    const genuine = !!(spanDoc && Engine.statsRules().spanGenuine(spanDoc, { keyId: keyFile.keyId, public: keyFile.public }));
    check(calls.indexOf("setStatsSpan") >= 0 && !!(spanDoc && spanDoc.span === "this-month" && genuine)
          && !fs.existsSync(path.join(share, "etiuda-request.ereq"))
          && /Counted from .+ to .+/.test(said(main())),
      "sw3d the counting period rewrites the span file under the lead's key, and no request file is written: "
      + JSON.stringify([spanDoc && spanDoc.span, genuine]));

    /* ---- 5. IN FIGURES (Figures first, board 862) ---------------------------------------------------------- */

    P.ACTS["stats-view"](el({ "data-v": "figures" }));
    const fh = main();
    const tile = (k) => { const m = new RegExp('data-tile="' + k + '"><span class="v"><span data-count="(\\d+)">([^<]*)</span>(?:<small>([^<]*)</small>)?</span><span class="k">([^<]*)<').exec(fh); return m ? [m[1], m[2], m[3] || "", m[4]].join("|") : ""; };
    const tiles = ["uses", "used", "rotting", "misses", "desks"].map(tile);
    check(tiles.join(" / ").split(NB).join(" ") ==="12076|12,076||Uses / 3|3|of 8|Used at least once / 5|5||Used by nobody / 3|3||Searches that found nothing / 3|3||Teammates that answered",
      "sf1a In figures leads with five figures, grouped, the cards used out of the catalog's: " + JSON.stringify(tiles));
    const bar = /<span class="fg-bar"[^>]*><i class="used" style="width:([\d.]+)%"><\/i><i class="nobody" style="left:([\d.]+)%;width:([\d.]+)%"><\/i>/.exec(fh);
    const ed = (/<span class="fg-ed">[\s\S]*?<\/span><span>([^<]*)<\/span><\/span>/.exec(fh) || [])[1];
    check(bar && bar.slice(1).join(",") === "37.50,37.50,62.50" && said(ed || "") === "2 of 3 on rev 1 (" + pub.edition + ")"
          && /Used: 3/.test(said(fh)) && /By nobody: 5/.test(said(fh)) && /Not judged: 0/.test(said(fh))
          && (/<span class="fg-ed"><span class="sm-desks"[^>]*>(<i><\/i>){2}<i class="off"><\/i><\/span>/.test(fh)),
      "sf1b one bar for the catalog, used then by nobody, its legend, and the desks on the newest edition beside it: "
      + JSON.stringify([bar && bar.slice(1), ed]));
    const lists = [...fh.matchAll(/<ul class="fg-list[^"]*">([\s\S]*?)<\/ul>/g)].map(m => [...m[1].matchAll(/<li[\s\S]*?<\/li>/g)].map(x => apart(x[0])));
    if (lists[2]) lists[2].sort();
    check(JSON.stringify(lists) === JSON.stringify([["Card A 12,030", "Card B 42", "Card C 4"],
          ["Card A Card C 13× Link them", "Card C Card D 2× Link them"],
          ["Card D " + pub.edition, "Card E " + pub.edition, "Card F " + pub.edition, "Card G " + pub.edition, "Card H " + pub.edition]])
          && new RegExp('data-act="paths-show" data-id="' + id.a + '">[^]*?Open the Paths map').test(fh)
          && /data-act="stats-show-cards">[^]*?Show them in Cards/.test(fh),
      "sf1c three panes of bars: the most used, the team's paths not yet links each with Link them, the cards nobody used"
      + " with their edition; Open the Paths map at the first path's card, Show them in Cards: " + JSON.stringify(lists));
    P.ACTS["stats-rule"](el({ "data-v": "top" }));
    const ruled = said((/<p class="fg-rule" data-rule="top">([\s\S]*?)<\/p>/.exec(main()) || [])[1] || "");
    const expanded = /data-act="stats-rule" data-v="top" aria-expanded="true"/.test(main());
    P.ACTS["stats-rule"](el({ "data-v": "top" }));
    check(ruled === "Only answers counted within the period rank the cards. Showing 3 of 3." && expanded
          && !/data-rule="top"/.test(main()) && /data-act="stats-rule" data-v="top" aria-expanded="false"/.test(main()),
      "sf1d How it is counted opens the pane's rule under its head and a second press folds it: " + JSON.stringify(ruled));
    P.ACTS["stats-link"](el({ "data-from": id.a, "data-to": id.c }));
    await P.flush();
    const fl = main();
    const noted = apart((/<li class="fg-note">([\s\S]*?)<\/li>/.exec(fl) || [])[1] || "");
    const inPlace = /<ul class="fg-list paths"><li class="fg-note">/.test(fl);
    const fLinked = diskNext(id.a).join(",") === [id.b, id.c].join(",") && !new RegExp('<li class="fg-path[^"]*" data-from="' + id.a + '" data-to="' + id.c + '"').test(fl);
    const fSaid = home.node("#said").textContent;
    P.ACTS["stats-unlink"](el({ "data-from": id.a, "data-to": id.c }));
    await P.flush();
    check(fLinked && inPlace && noted === "In the draft, “Card A” now leads to “Card C”; the team has it from the next edition. Undo"
          && fSaid === "In the draft, “Card A” now leads to “Card C”; the team has it from the next edition."
          && diskNext(id.a).join(",") === id.b && !/fg-note/.test(main())
          && new RegExp('<li class="fg-path" data-from="' + id.a + '" data-to="' + id.c + '"').test(main()),
      "sf2a Link them In figures writes the link, the row leaves the list and a note with Undo stands where it was, saying what happens next,"
      + " said once to a reader; Undo takes the link off and the row comes back: " + JSON.stringify(noted));
    const fpl = loadPage({ api, uiLang: "pl" });
    fpl.sandbox.STUDIO_T.set("pl");
    Object.assign(fpl.page.S, { open: P.S.open, screen: "project", section: "stats", lang: "en", uiLang: "pl", stats: P.S.stats });
    fpl.page.ACTS["stats-view"](el({ "data-v": "figures" }));
    const fp = said(fpl.node("#main").innerHTML);
    const fEnglish = ["Uses", "Used at least once", "Teammates that answered", "Used:", "By nobody", "Not judged", "Most used",
      "not yet links", "Link them", "Open the Paths map", "Show them", " of 3 on "].filter(w => fp.indexOf(w) >= 0);
    check(fEnglish.length === 0 && fp.indexOf("2 z 3 na wer. 1 (" + pub.edition + ")") >= 0 && /12 076/.test(fp) && /Użyte: 3/.test(fp)
          && /Ścieżki zespołu bez połączenia/.test(fp) && /Liczbami/.test(fp),
      "sf2b In figures turns Polish whole; CONTROL: none of its English is left: " + JSON.stringify(fEnglish));
    P.ACTS["stats-view"](el({ "data-v": "words" }));

    /* ---- 4. THE VIEWS, THE WAIT AND THE START ------------------------------------------------------------- */

    P.ACTS["stats-view"](el({ "data-v": "every" }));
    const every = main();
    P.S.section = "cards"; P.paint(); P.S.section = "stats"; P.paint();
    const kept = /class="[^"]*\bon\b[^"]*"[^>]*data-act="stats-view" data-v="every"/.test(main());
    check(/<table class="desks">/.test(every) && /data-act="stats-span"/.test(every) && !/data-act="ask-desks"/.test(every)
          && !/class="pane st-month"/.test(every) && kept,
      "sw4a Every answer is the desks' table and the counting period, with no Ask desks, and the view chosen is kept"
      + " while the project is away from the section");
    P.ACTS["stats-view"](el({ "data-v": "words" }));
    P.S.stats = null;
    home.node("#said").textContent = "";
    P.paint();
    const held = (main().match(/<div class="sm-hold">/g) || []).length;
    const waitSaid = home.node("#said").textContent;
    P.ACTS["stats-view"](el({ "data-v": "every" }));
    const everyWait = main();
    P.ACTS["stats-view"](el({ "data-v": "words" }));
    check(held === 6 && /aria-busy="true"/.test(main()) && waitSaid === "Reading the teammates' answers." && everyWait === "",
      "sw4b while the share is read, In words holds six places as two quiet lines and a reader is told; CONTROL: Every"
      + " answer waits blank, as it did: " + JSON.stringify([held, waitSaid]));

    const bare = await S.newProject(root, "No folder", [{ code: "en", name: "English" }]);
    const launch = async (on) => {
      const L = loadPage({ api, uiLang: "en" });
      L.page.S.projects = S.listProjects(root).projects;
      L.page.S.host = { tour: { offered: true }, langs: S.builtLangs() };
      await L.page.restoreTabs({ open: [{ dir, name: "In words", rev: 1 }, { dir: bare.dir, name: "No folder", rev: 0 }], on });
      await new Promise(f => setTimeout(f, 30));
      return L;
    };
    const L1 = await launch(dir), L2 = await launch(bare.dir);
    /* Maxim 2026-10-07 22:30 reverted the start on the month: a launch opens where it opened before it. */
    check(L1.page.S.section === "cards" && !/class="pane st-month"/.test(L1.node("#main").innerHTML)
          && L2.page.S.section === "cards" && L1.page.statsView() === "words",
      "sw4c a launch lands the project on screen on its cards, a project that publishes to a folder as one without; CONTROL:"
      + " Statistics still opens In words: " + JSON.stringify([L1.page.S.section, L2.page.S.section, L1.page.statsView()]));
  } catch (e) {
    check(false, "the legs stopped after " + asserted + " checks: " + (e && e.stack || e));
  }

  if (!argv.includes("--keep")) dropScratch(SCRATCH, "stats-words");
  const ok = failed === 0 && asserted === EXPECTED;
  console.log("RESULT: " + (ok ? "ok" : "FAIL") + " checks=" + asserted + " failed=" + failed + " expected=" + EXPECTED);
  process.exit(ok ? 0 : 1);
}

main(process.argv.slice(2)).catch((e) => { console.error(e && e.stack || e); process.exit(2); });
