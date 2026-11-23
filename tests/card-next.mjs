/* THE COMMITMENT MARK AND THE CARDS THAT FOLLOW, IN THE CARD EDITOR (board 814, step 11, S3b).
 *
 *     node tests/card-next.mjs [--keep]
 *
 * What the file holds after the editor's acts, read back from disk and through the pinned engine's own lint; what a
 * delete and its Undo tell the page about the lists they changed; the suggestion src/commitment.mjs makes and the
 * lead's dismissal of it, kept in project.json and never in the draft; and the editor as tests/page-stand-in.mjs
 * paints it and presses it. Markup and files only: the drag, the bubble's place and the look are Maxim's to judge.
 */
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

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const SCRATCH = path.join(ROOT, "scratch", "card-next");
const EXPECTED = 53;

let asserted = 0, failed = 0;
function check(cond, line) {
  asserted++;
  if (cond) process.stdout.write("  ok   " + line + "\n");
  else { failed++; process.stderr.write("  FAIL " + line + "\n"); }
}
const read = (...p) => fs.readFileSync(path.join(ROOT, ...p), "utf8");
const sha = (p) => crypto.createHash("sha256").update(fs.readFileSync(p)).digest("hex");
const wire = (p) => Promise.resolve(p)
  .then(v => JSON.parse(JSON.stringify(Object.assign({ error: null }, v))))
  .catch(e => ({ error: e && e.message ? e.message : String(e), said: (e && e.said) || null }));
const refusalOf = async (p) => { try { await p; return null; } catch (e) { return e; } };
const ids8 = (c) => ((c && c.next) || []).map(e => e.to).join(",");

/* The words are this file's own, written for it: a promise in each language and replies that promise nothing. */
const PROMISE_EN = "Thank you for waiting. We will send you a replacement today.";
const PROMISE_EN_2 = "We will refund the full amount by Friday.";
const PROMISE_PL = "Wyślemy nową lampę jutro.";
const PLAIN_EN = "Thank you for writing. Have a lovely day.";

async function main(argv) {
  clearScratch(SCRATCH);
  const root = path.join(SCRATCH, "projects");
  fs.mkdirSync(root, { recursive: true });
  const made = await S.newProject(root, "Card next", [{ code: "en", name: "English" }, { code: "pl", name: "Polish" }]);
  const dir = made.dir;
  const draftAt = path.join(dir, DRAFT_FILE), projAt = path.join(dir, "project.json");
  const disk = () => JSON.parse(fs.readFileSync(draftAt, "utf8"));
  const onDisk = (id) => disk().cards.find(c => c.id === id);
  const shelf = ((await S.addTag(dir, "shelf", { en: "General", pl: "Ogolne" })).tag).id;
  const other = ((await S.addTag(dir, "shelf", { en: "Other", pl: "Inne" })).tag).id;
  const id = {};
  for (const [k, body, sh] of [["a", PLAIN_EN, shelf], ["b", PLAIN_EN, shelf], ["c", PLAIN_EN, shelf],
    ["d", PLAIN_EN, shelf], ["e", PLAIN_EN, shelf], ["f", PLAIN_EN, other], ["p", PROMISE_EN, shelf], ["q", PLAIN_EN, shelf],
    ["r", PLAIN_EN, shelf]]) {
    id[k] = (await S.addCard(dir, sh, "Card " + k.toUpperCase(), body)).card.id;
  }
  await S.saveCard(dir, id.f, { title: { pl: "Zwrot pieniędzy" } });
  await S.retireCard(dir, id.r);
  const lintOf = () => (Engine.lint().lintCatalog(disk()) || []);
  const linkFindings = () => JSON.stringify(lintOf()).match(/next\[|commits is/g) || [];

  /* ---- 1. WHAT A SAVE WRITES -------------------------------------------------------------------- */

  let r = await S.saveCard(dir, id.a, { next: [id.b, id.c] });
  check(JSON.stringify(onDisk(id.a).next) === JSON.stringify([{ to: id.b }, { to: id.c }]) && linkFindings().length === 0,
    "cn1a a list saved as ids is written as entries in that order, and the pinned lint finds nothing about it: "
    + JSON.stringify(onDisk(id.a).next));
  /* an entry carrying a key a later engine might add, planted in the file by hand */
  const planted = disk();
  const pa = planted.cards.find(c => c.id === id.a);
  if (pa.next && pa.next[0]) pa.next[0].later = 1;
  delete planted.hash; planted.hash = (await Engine.format()).contentHash(planted);
  fs.writeFileSync(draftAt, JSON.stringify(planted, null, 2) + "\n");
  r = await S.saveCard(dir, id.a, { next: [id.c, id.b] });
  check(JSON.stringify(onDisk(id.a).next) === JSON.stringify([{ to: id.c }, { to: id.b, later: 1 }]),
    "cn1b a reorder keeps each entry whole, a key of its own included: " + JSON.stringify(onDisk(id.a).next));
  r = await S.saveCard(dir, id.a, { next: [id.a, id.b, id.b, id.d] });
  check(JSON.stringify(onDisk(id.a).next) === JSON.stringify([{ to: id.b, later: 1 }, { to: id.d }])
        && JSON.stringify(r.card.next) === JSON.stringify(onDisk(id.a).next),
    "cn1c the card itself and a repeat are left out, and the answer is the list as written: " + JSON.stringify(r.card.next));
  const before1d = sha(draftAt);
  const no = await refusalOf(S.saveCard(dir, id.a, { next: [id.b, "c-nowhere"] }));
  check(no && /no card "c-nowhere" in this catalog/.test(no.message) && sha(draftAt) === before1d,
    "cn1d a card that is not in the catalog is refused with the catalog's own sentence, and the file is untouched: "
    + (no && no.message));
  await S.saveCard(dir, id.a, { next: [] });
  check(!("next" in onDisk(id.a)),
    "cn1e an emptied list takes the key off the card rather than writing an empty one");
  await S.saveCard(dir, id.b, { commits: true });
  const on = onDisk(id.b).commits;
  await S.saveCard(dir, id.b, { commits: false });
  check(on === true && !("commits" in onDisk(id.b)) && linkFindings().length === 0,
    "cn1f the mark is written true, and taken off rather than written false, which the pinned reader refuses: "
    + JSON.stringify([on, onDisk(id.b).commits]));
  await S.saveCard(dir, id.c, { next: [id.d], commits: true });
  const c1g = JSON.stringify([onDisk(id.c).next, onDisk(id.c).commits]);
  await S.saveCard(dir, id.c, { title: { en: "Card C, retitled" } });
  check(JSON.stringify([onDisk(id.c).next, onDisk(id.c).commits]) === c1g,
    "cn1g CONTROL: a save that names neither leaves the list and the mark as they were: " + c1g);
  await S.saveCard(dir, id.c, { title: { en: "Card C" }, next: [], commits: false });

  /* Sections 2 to 7 lean on names a tree without this build lacks; a throw there is one failure naming where. */
  try {
    /* ---- 2. THE SUGGESTION ------------------------------------------------------------------------ */

    let open = await S.openProject(dir);
    check(open.likely[id.p] && open.likely[id.p].lang === "en" && open.likely[id.p].phrase === "We will send you a replacement today"
          && !open.likely[id.q] && Object.keys(open.likely).length === 1,
      "cn2a the open answers each card the detector reads as a commitment, with the words it found and their language,"
      + " and no other: " + JSON.stringify(open.likely));
    r = await S.saveCard(dir, id.p, { commits: true });
    open = await S.openProject(dir);
    check(r.likely === null && !open.likely[id.p],
      "cn2b a ticked card is suggested nowhere, neither in its save's answer nor at the next open");
    r = await S.saveCard(dir, id.p, { commits: false });
    check(r.likely && r.likely.phrase === "We will send you a replacement today",
      "cn2c taken off again, the suggestion comes back with the save's answer");
    const draftSha = sha(draftAt);
    const dis = await S.dismissLikely(dir, id.p, r.likely.phrase);
    open = await S.openProject(dir);
    check(dis.dismissed === true && JSON.parse(fs.readFileSync(projAt, "utf8")).notPromises[id.p] === r.likely.phrase
          && sha(draftAt) === draftSha && !open.likely[id.p],
      "cn2d Dismiss is kept in project.json by card and words, the draft's bytes are untouched, and the next open is silent");
    const said2i = r.likely.phrase;
    const save2i = await S.saveCard(dir, id.p, { title: { en: "Card P, retitled" } });
    const kept2i = JSON.parse(fs.readFileSync(projAt, "utf8")).notPromises || {};
    const bulk2i = await S.moveCards(dir, [id.e], other);
    const undo2i = await S.undoBulk(dir);
    await S.saveCard(dir, id.p, { title: { en: "Card P" } });
    check(save2i.likely === null && kept2i[id.p] === said2i && bulk2i.likely && !bulk2i.likely[id.p]
          && undo2i.likely && !undo2i.likely[id.p],
      "cn2i a dismissal outlives a save that keeps the words, and neither that save nor an act on many cards nor its Undo"
      + " brings the suggestion back: " + JSON.stringify([save2i.likely, kept2i[id.p], Object.keys(bulk2i.likely || {}).length]));
    r = await S.saveCard(dir, id.p, { body: { en: PROMISE_EN_2 } });
    check(r.likely && r.likely.phrase === "We will refund the full amount by Friday",
      "cn2e changed words bring the suggestion back: " + JSON.stringify(r.likely));
    await S.saveCard(dir, id.q, { body: { pl: PROMISE_PL } });
    open = await S.openProject(dir);
    check(open.likely[id.q] && open.likely[id.q].lang === "pl" && open.likely[id.q].phrase === "Wyślemy nową lampę jutro",
      "cn2f a promise in the second language is found in it: " + JSON.stringify(open.likely[id.q]));
    const bulk = await S.moveCards(dir, [id.e], other);
    check(JSON.stringify(bulk.likely) === JSON.stringify(open.likely),
      "cn2g an act on many cards answers the whole map, the same one the open gives: " + JSON.stringify(Object.keys(bulk.likely || {})));
    const noCard = await refusalOf(S.dismissLikely(dir, "c-nowhere", "x"));
    check(noCard && /no card "c-nowhere"/.test(noCard.message),
      "cn2h CONTROL: a dismissal for a card that is not there is refused");
    await S.undoBulk(dir);

    /* ---- 3. A DELETE AND ITS UNDO, AS THE PAGE IS TOLD ------------------------------------------- */

    await S.saveCard(dir, id.a, { next: [id.b, id.c] });
    await S.saveCard(dir, id.d, { next: [id.c] });
    const del = await S.deleteCard(dir, id.b);
    check(JSON.stringify(del.unlinked) === JSON.stringify([{ id: id.a, next: [{ to: id.c }] }]),
      "cn3a a delete names each card that lost a link to it, with its list as it now stands: " + JSON.stringify(del.unlinked));
    const und = await S.undoDelete(dir);
    check(JSON.stringify(und.relinked) === JSON.stringify([{ id: id.a, next: [{ to: id.b }, { to: id.c }] }]),
      "cn3b its Undo names the same card with the list it had: " + JSON.stringify(und.relinked));
    const del2 = await S.deleteCard(dir, id.c);
    check(JSON.stringify(del2.unlinked) === JSON.stringify([{ id: id.a, next: [{ to: id.b }] }, { id: id.d, next: null }]),
      "cn3c a list left empty is named with no list: " + JSON.stringify(del2.unlinked));
    await S.undoDelete(dir);

    /* ---- 4. THE EDITOR AS THE PAGE PAINTS IT ------------------------------------------------------ */

    const calls = [];
    const api = {};
    for (const k of ["saveCard", "deleteCard", "undoDelete", "dismissLikely", "moveCards", "undoBulk", "cardHistory"])
      api[k] = (...a) => { calls.push([k, a.slice(1)]); return wire(S[k](...a)); };
    const home = loadPage({ api, uiLang: "en" });
    const P = home.page;
    await S.saveCard(dir, id.e, { commits: true });
    await S.saveCard(dir, id.a, { next: [id.b, id.c, id.d, id.e, id.f] });
    open = await wire(S.openProject(dir));
    Object.assign(P.S, { open, screen: "project", section: "cards", lang: "en", sel: id.a });
    const A = () => P.cardById(id.a);
    let ed = P.editorHtml(A());
    const rows = [...ed.matchAll(/<li class="cn-row" data-i="(\d)" data-id="([^"]+)"[^>]*>.*?<\/li>/g)];
    check(ed.indexOf('id="cardCommit"') > 0 && ed.indexOf('id="cardCommit"') < ed.indexOf('id="cardNext"')
          && ed.indexOf('id="cardNext"') < ed.indexOf('id="cardBag"')
          && rows.map(m => m[2]).join(",") === [id.b, id.c, id.d, id.e, id.f].join(","),
      "cn4a the editor holds the mark, then the list in the file's order, then the keywords");
    const keys = rows.map(m => (/<span class="key( off)?"[^>]*>Ctrl\+(\d)</.exec(m[0]) || []).slice(1).join(""));
    check(keys.join(",") === "1,2,3,4, off5",
      "cn4b the first four carry Ctrl+1 to 4 and the fifth only a hidden place for one: " + keys.join(","));
    check(rows.filter(m => /class="cn-mark"/.test(m[0])).map(m => m[2]).join(",") === id.e,
      "cn4c the mark is shown beside the one listed card that carries it, and no other");
    const door = /<button class="btn sm cn-door"([^>]*)>/.exec(ed);
    /* Held until S3c built the map; since then it opens the map at the card (tests/paths-map.mjs pm4a and pm4b). */
    check(door && !/disabled/.test(door[1]) && /data-act="paths-show"/.test(door[1])
          && door[1].indexOf('data-id="' + id.a + '"') >= 0 && /Show on the Paths map/.test(ed),
      "cn4d the door to the Paths map is drawn, open, and names the card it opens the map at");
    const C = P.cardById(id.c), Q = P.cardById(id.q), Pc = P.cardById(id.p);
    check(/Terminus: nothing comes next on the path\./.test(P.nextHtml(C)) && !/cn-end/.test(P.nextHtml(Q))
          && !/cn-row/.test(P.nextHtml(C)) && /data-act="next-pick"/.test(P.nextHtml(Q)),
      "cn4e an empty list says the path ends only on a card another card leads to; both offer Add a card");
    /* Since In the margin (board 862) the suggestion sits under the text box of its language when that box is on screen
       (tests/vision-gamma.mjs section 2), and under the tick, as before, when it is not. */
    P.S.lang = "pl";
    check(/id="cardLikely"/.test(P.commitHtml(Pc)) && /Checks: “We will refund the full amount by Friday” reads like a commitment\./.test(P.commitHtml(Pc))
          && /data-act="commits-dismiss"/.test(P.commitHtml(Pc)) && !/cardLikely/.test(P.commitHtml(A())),
      "cn4f the suggestion sits under the tick with the words it found and Dismiss while its language's box is off screen, and only where there is one");
    P.S.lang = "en";
    check(!/cardLikely/.test(P.commitHtml(Pc)) && /class="bub mg-bub"/.test(P.editorHtml(Pc)),
      "cn4f2 and under its own text box once that box is on screen");
    const E = P.cardById(id.e);
    check(/class="cn-mark"/.test(P.rowHtml(E)) && !/cn-mark/.test(P.rowHtml(A())) && /class="cn-mark"/.test(P.edHead(E))
          && /class="cbx on"/.test(P.commitHtml(E)) && !/cardLikely/.test(P.commitHtml(E)),
      "cn4g a ticked card wears the mark after its title in the table and the heading, its tick is on, nothing is suggested");
    check(!/cn-mark/.test(P.edHead(A())) && /class="cbx"/.test(P.commitHtml(A())),
      "cn4h CONTROL: a card without the mark has none in its heading and an empty tick");

    /* ---- 5. THE ACTS ------------------------------------------------------------------------------ */

    const ev = (target, key, mods) => Object.assign({ target, key, altKey: false, ctrlKey: false, shiftKey: false,
      preventDefault() { this.prevented = true; }, stopPropagation() {} }, mods || {});
    const rowEl = (i) => { const el = { getAttribute: (k) => (k === "data-i" ? String(i) : null), id: "" };
      el.closest = (sel) => (sel === ".cn-row" ? el : null); return el; };
    const ids = () => (A().next || []).map(e => e.to).join(",");
    const diskIds = () => (onDisk(id.a).next || []).map(e => e.to).join(",");

    P.ACTS["next-remove"]({ getAttribute: (k) => (k === "data-i" ? "4" : null) });
    await P.flush();
    check(ids() === [id.b, id.c, id.d, id.e].join(",") && diskIds() === ids(),
      "cn5a the cross takes its row off, on the page at once and in the file after the save");
    let did = P.nextKey(ev(rowEl(0), "ArrowDown", { altKey: true }));
    await P.flush();
    check(did === "move" && ids() === [id.c, id.b, id.d, id.e].join(",") && diskIds() === ids(),
      "cn5b Alt+Down on a focused row moves it one place down, and the file follows: " + diskIds());
    did = P.nextKey(ev(rowEl(0), "ArrowUp", { altKey: true }));
    check(did === "" && ids() === [id.c, id.b, id.d, id.e].join(","),
      "cn5c CONTROL: Alt+Up on the first row moves nothing");
    did = P.nextKey(ev(rowEl(2), "Delete"));
    await P.flush();
    check(did === "remove" && diskIds() === [id.c, id.b, id.e].join(","),
      "cn5d Delete on a focused row takes it off");
    P.ACTS["next-pick"]();
    const found = P.nextFound(A(), "").map(c => c.id);
    check(found.join(",") === [id.d, id.p, id.q].join(","),
      "cn5e with nothing typed the picker offers the cards of the card's own category, less itself, the listed and the"
      + " retired: " + found.join(","));
    check(P.nextFound(A(), "zwrot").map(c => c.id).join(",") === id.f && P.nextFound(A(), "card q").map(c => c.id).join(",") === id.q,
      "cn5f typed, every word is looked for in a title in any language, across categories");
    const field = { id: "nextFind", closest: () => null, getAttribute: () => null };
    P.S.nextPick.q = "card"; P.S.nextPick.at = 0;
    const walk = P.nextKey(ev(field, "ArrowDown"));
    const take = P.nextKey(ev(field, "Enter"));
    await P.flush();
    check(walk === "walk" && take === "add" && diskIds() === [id.c, id.b, id.e, id.f].join(",")
          && P.S.nextPick && P.S.nextPick.q === "",
      "cn5g in the picker the arrow walks to the second card found (Card F, of another category) and Enter adds it at the end, and the picker stays open,"
      + " emptied, for the next: " + diskIds());
    const esc = ev(field, "Escape");
    check(P.nextKey(esc) === "close" && P.S.nextPick === null && esc.prevented,
      "cn5h Escape closes the picker");
    P.S.sel = id.d;
    const tickEl = { classList: { toggle() {} }, setAttribute() {} };
    P.ACTS.commits(tickEl);
    await P.flush();
    const d1 = onDisk(id.d).commits;
    P.ACTS.commits(tickEl);
    await P.flush();
    check(d1 === true && !("commits" in onDisk(id.d)) && !P.cardById(id.d).commits,
      "cn5i the tick writes the mark and a second press takes it off, page and file alike");
    P.S.sel = id.p;
    const before5j = calls.length;
    await P.ACTS["commits-dismiss"]();
    const sent = calls.slice(before5j).find(x => x[0] === "dismissLikely");
    check(sent && sent[1][0] === id.p && sent[1][1] === "We will refund the full amount by Friday" && !P.likelyFor(P.cardById(id.p)),
      "cn5j Dismiss sends the card and the words it was shown, and the suggestion leaves the page");
    /* a save's answer arriving while a newer one for the same card waits: the order on the page is the newer one's */
    P.S.sel = id.a;
    const pageOrder = ids();
    P.tookLinks(A(), { card: { next: [{ to: id.b }] }, likely: null }, { next: [id.e] });
    const unsettled = ids();
    P.tookLinks(A(), { card: { next: [{ to: id.b }] }, likely: null }, { title: { en: "Typed since" } });
    check(unsettled === pageOrder && ids() === id.b,
      "cn5k an answer to an older save does not put back the order a newer one is carrying; one carrying only a title"
      + " does not hold the list back");
    await P.flush();

    /* ---- 6. THE PAGE AFTER A DELETE AND ITS UNDO --------------------------------------------------- */

    await S.saveCard(dir, id.a, { next: [id.b, id.c] });
    open = await wire(S.openProject(dir));
    P.S.open = open;
    P.S.sel = id.b;
    await P.ACTS["card-del"]();
    check((A().next || []).map(e => e.to).join(",") === id.c,
      "cn6a after a delete the page's copy of a card that linked to it lists what the file lists");
    await P.ACTS["card-undo"]();
    check((A().next || []).map(e => e.to).join(",") === [id.b, id.c].join(","),
      "cn6b and after its Undo the list it had, in order");

    /* ---- 7. WIRING AND WORDS ---------------------------------------------------------------------- */

    const main = read("shell", "main.js"), preload = read("shell", "preload.js"), app = read("ui", "app.js"), lang = read("ui", "lang.js");
    const handler = /answer\("studio:card-not-promise"[^]*?thread\.call\("dismissLikely"[,)]/.test(main);
    const offered = /dismissLikely:\s*\([^)]*\)\s*=>\s*ipcRenderer\.invoke\("studio:card-not-promise"/.test(preload);
    check(typeof S.dismissLikely === "function" && handler && offered && app.indexOf("API.dismissLikely(") >= 0
          && main.split('answer("studio:card-not-promise"').length === 2,
      "cn7a the dismissal is exported, answered on one channel through the worker, offered by the preload and called by the page");
    const WORDS = ["Commitment", "This card commits the firm", "Desks then show it with a stamp.",
      "For a card that tells the customer what the firm will do, or has done: a refund, a parcel sent, a date kept.",
      "Checks: “{PHRASE}” reads like a commitment.", "Dismiss", "Terminus: nothing comes next on the path.",
      "Commitment: the customer can hold the firm to this.", "Next cards",
      "After this card, every desk offers these in this order. Drag to reorder.", "Show on the Paths map",
      "Take it off this list", "Add a card", "Find a card by its title",
      "No card's title holds that."];
    const missing = WORDS.filter(w => lang.indexOf(JSON.stringify(w) + ":") < 0 || app.indexOf(JSON.stringify(w).slice(0, 30)) < 0);
    check(missing.length === 0,
      "cn7b every word the editor gains is asked for by the page and has its Polish in ui/lang.js: " + JSON.stringify(missing));
    const pl = loadPage({ api, uiLang: "pl" }).page;
    Object.assign(pl.S, { open, screen: "project", section: "cards", lang: "en", sel: id.a, uiLang: "pl" });
    const plEd = pl.editorHtml(pl.cardById(id.a));
    check(/Następne karty/.test(plEd) && /Ta karta zobowiązuje firmę/.test(plEd) && !/Next cards|commits the firm/.test(plEd),
      "cn7c the editor's new parts turn Polish whole with the screen");

    /* ---- 8. THE TEAM'S CANDIDATES IN THE EDITOR (S3c carve A) -------------------------------------------- */

    /* A desk's answer, written for this file: from A the team copied Q seven times (no link yet), B three (a link
       already), D twice (no link yet, dismissed below) and R once (retired); nothing from any other card. */
    const share = path.join(SCRATCH, "share");
    fs.mkdirSync(share, { recursive: true });
    const PASS8 = "card-next-gate";
    const keyAt8 = path.join(SCRATCH, "lead-key.json");
    const lead8 = await makeKeyFile({ passphrase: PASS8 });
    fs.writeFileSync(keyAt8, JSON.stringify(lead8, null, 1) + "\n");
    /* A real Ed25519 desk key from a fixed seed, its id the one it makes, so the answer is signed inside the seal as a
       desk signs it and the lead's Studio counts it (board 891's C1). */
    const PKCS8_ED25519 = Buffer.from("302e020100300506032b657004220420", "hex");
    const deskPriv = crypto.createPrivateKey({ key: Buffer.concat([PKCS8_ED25519, Buffer.alloc(32, 0x4d)]), format: "der", type: "pkcs8" });
    const deskKey = crypto.createPublicKey(deskPriv).export({ type: "spki", format: "der" }).subarray(-32).toString("hex");
    const desk8 = "k-" + crypto.createHash("sha256").update(Buffer.from(deskKey, "hex")).digest("hex").slice(0, 16);
    let team8 = newTeam({ catalogs: ["card-next"], lead: { keyId: lead8.keyId, public: lead8.public } });
    team8 = withDesk(team8, {
      id: desk8, key: deskKey, box: crypto.randomBytes(32).toString("hex"),
    }, "Lamp desk");
    const wrote8 = await writeTeam(share, team8, { key: keyAt8, passphrase: PASS8 });
    const pairs = [[id.a, id.q, 7], [id.a, id.b, 3], [id.a, id.d, 2], [id.a, id.r, 1]];
    const inner8 = {
      format: 1, kind: "etiuda-statistics", desk: "dtest-one", engine: "2.0.0-dev",
      period: { from: "2026-09-01", to: "2026-09-30" }, sync: "2026-09-30 13:00",
      cards: [{ id: id.a, n: 3 }], intents: [], misses: 0, langs: { en: 3 },
      pairs: pairs.map(([from, to, n]) => ({ from, to, n })), catalog: { id: "card-next", rev: 1 }, hash: "djb2:0" };
    inner8.sig = { alg: "Ed25519", keyId: desk8 };
    inner8.sig.value = crypto.sign(null, Engine.statsRules().statsAnswerSignedBytes(inner8), deskPriv).toString("hex");
    const env8 = Engine.statsRules().sealStatsLead(wrote8.team.lead.box, wrote8.team.id, wrote8.team.lead.keyId, desk8, JSON.stringify(inner8));
    fs.mkdirSync(path.join(share, "desks", desk8), { recursive: true });
    fs.writeFileSync(path.join(share, "desks", desk8, "stats.estat"), jsonText(env8));
    const proj8 = JSON.parse(fs.readFileSync(projAt, "utf8"));
    fs.writeFileSync(projAt, JSON.stringify(Object.assign(proj8, { folder: share }), null, 2) + "\n");
    const calls8 = [];
    const api8 = {};
    for (const k of ["saveCard", "dismissPair"])
      api8[k] = (...a) => { calls8.push(k); return wire(S[k](...a)); };
    /* rolling-30 of 30 September 2026 is this answer's declared period, so the span counts it. */
    const spanNow = new Date(2026, 8, 30, 12, 0, 0);
    api8.stats = (d) => { calls8.push("statsFor"); return wire(S.statsFor(d, { key: keyAt8, passphrase: PASS8, now: spanNow })); };
    const home8 = loadPage({ api: api8, uiLang: "en" });
    const T8 = home8.page;
    const settle = async () => { for (let i = 0; i < 1250 && !T8.S.stats; i++) await new Promise(f => setTimeout(f, 20)); };
    const reads = () => calls8.filter(k => k === "statsFor").length;
    Object.assign(T8.S, { open: await wire(S.openProject(dir)), screen: "project", section: "cards", lang: "en",
      sel: id.a, stats: null });
    const A8 = () => T8.cardById(id.a);
    const first = T8.editorHtml(A8());
    const readsAtPaint = reads();
    await settle();
    const field8 = home8.node("#cardNext").outerHTML;
    const teamRows = (h) => [...String(h).matchAll(/<li class="pm-team"><span class="tt">([^<]*)<\/span>/g)].map(m => m[1]);
    check(!/id="cardTeam"/.test(first) && readsAtPaint === 0 && reads() === 1 && T8.S.stats && !T8.S.err
          && /The team also copied/.test(field8) && teamRows(field8).join(",") === "Card Q,Card D",
      "cn8a the editor paints at once without the team, reads the statistics once in the background, then puts its"
      + " Next field back with the team's candidates, most copied first: " + JSON.stringify([readsAtPaint, reads(), !!T8.S.stats, teamRows(field8)]));
    const nextA = T8.nextHtml(A8());
    const qRow = (/<li class="pm-team">(?:(?!<\/li>).)*Card Q(?:(?!<\/li>).)*<\/li>/.exec(nextA) || [""])[0];
    check(/7 times/.test(qRow.replace(/\u00a0/g, " ")) && qRow.indexOf('data-act="paths-adopt" data-from="' + id.a + '" data-to="' + id.q + '"') > 0
          && qRow.indexOf('data-act="paths-dismiss" data-from="' + id.a + '" data-to="' + id.q + '"') > 0
          && /Link them/.test(qRow) && /Dismiss/.test(qRow),
      "cn8b a candidate's row says how often the team copied it, with Link them (W14 of the vision words) and Dismiss for that pair");
    T8.editorHtml(T8.cardById(id.e)); T8.editorHtml(A8());
    await new Promise(f => setTimeout(f, 40));
    check(!/cardTeam/.test(T8.nextHtml(T8.cardById(id.e))) && !/cardTeam/.test(T8.nextHtml(T8.cardById(id.q)))
          && reads() === 1,
      "cn8c CONTROL: a card the team copied nothing after shows no list, and later paints read nothing more");
    await T8.ACTS["paths-dismiss"]({ getAttribute: (k) => ({ "data-from": id.a, "data-to": id.d })[k] || null });
    const afterDis = home8.node("#cardNext").outerHTML;
    check(teamRows(afterDis).join(",") === "Card Q" && teamRows(T8.nextHtml(A8())).join(",") === "Card Q"
          && T8.S.section === "cards"
          && JSON.stringify(JSON.parse(fs.readFileSync(projAt, "utf8")).notPaths) === JSON.stringify([{ from: id.a, to: id.d }]),
      "cn8d CONTROL: a dismissed pair is shown no more, the project keeps it, and the editor stays where it was: "
      + teamRows(afterDis).join(","));
    T8.pm().root = id.a; T8.pm().sel = { id: id.a }; T8.pm().panel = true;   /* asked for: Walk the map opens it on demand */
    const panel = T8.pathsPanelHtml(T8.pathsModel(id.a));
    check(panel.split("The team also copied").length === 2 && panel.split('id="cardNext"').length === 2
          && panel.indexOf('id="cardNext"') < panel.indexOf("The team also copied"),
      "cn8f the map's panel shows the team's list once, inside the Next field it shares with the editor");
    T8.ACTS["paths-adopt"]({ getAttribute: (k) => ({ "data-from": id.a, "data-to": id.q })[k] || null });
    await T8.flush();
    check(ids8(onDisk(id.a)) === [id.b, id.c, id.q].join(",") && !/cardTeam/.test(T8.nextHtml(A8()))
          && /data-id="[^"]+"[^>]*>(?:(?!<\/li>).)*Card Q/.test(home8.node("#cardNext").outerHTML) && T8.S.section === "cards"
          && !/pm-canvas|pmPanel/.test(home8.node("#main").innerHTML),
      "cn8e Adopt in the editor puts the card at the end of the list, on the page and in the file, and its candidate"
      + " row goes: " + ids8(onDisk(id.a)));
    /* a folder that cannot be read: the answer carries a refusal and no views, and a statistics door that throws */
    const apiBad = { stats: () => { calls8.push("bad"); return Promise.resolve({ error: null, refusal: "the share refused the read", rows: [] }); } };
    const apiThrow = { stats: () => { calls8.push("throw"); return Promise.reject(new Error("no share")); } };
    const quiet = [];
    for (const a of [apiBad, apiThrow]) {
      const h = loadPage({ api: a, uiLang: "en" }).page;
      Object.assign(h.S, { open: T8.S.open, screen: "project", section: "cards", lang: "en", sel: id.a, stats: null });
      h.editorHtml(h.cardById(id.a));
      await new Promise(f => setTimeout(f, 40));
      quiet.push(!h.S.err && !/cardTeam/.test(h.nextHtml(h.cardById(id.a))));
      await new Promise(f => setTimeout(f, 40));          /* a second paint's read, had it asked for one, lands here */
    }
    check(quiet.join(",") === "true,true" && calls8.filter(k => k === "bad" || k === "throw").length === 2,
      "cn8g a folder that cannot be read, or a read that fails, shows nothing and raises no error: " + quiet.join(","));

    /* ---- 9. THE NEXT LIST IN THE SHOWN LANGUAGE (S3c carve C) --------------------------------------------- */

    const madePl = await S.newProject(root, "Card next pl", [{ code: "pl", name: "Polski" }, { code: "en", name: "English" }]);
    const dpl = madePl.dir;
    const shPl = ((await S.addTag(dpl, "shelf", { pl: "Ogolne", en: "General" })).tag).id;
    const pid = {};
    for (const [k, pl, en] of [["x", "Karta X", "Card X"], ["y", "Karta Y", "Card Y"], ["z", "Karta Z", ""]]) {
      pid[k] = (await S.addCard(dpl, shPl, pl, { pl: PLAIN_EN })).card.id;
      if (en) await S.saveCard(dpl, pid[k], { title: { en } });
    }
    await S.saveCard(dpl, pid.x, { next: [pid.y, pid.z] });
    const tPl = loadPage({ api: {}, uiLang: "en" }).page;
    Object.assign(tPl.S, { open: await wire(S.openProject(dpl)), screen: "project", section: "cards", lang: "en",
      sel: pid.x, stats: {} });
    const rowsOf = (h) => [...h.matchAll(/<span class="tt">([^<]*)<\/span>/g)].map(m => m[1]).join(",");
    const X = tPl.cardById(pid.x);
    const enRows = rowsOf(tPl.nextHtml(X));
    tPl.S.nextPick = { dir: dpl, id: pid.x, q: "karta", at: 0 };
    const enFound = rowsOf(tPl.nextFoundHtml(tPl.cardById(pid.y)));
    tPl.S.lang = "pl";
    const plRows = rowsOf(tPl.nextHtml(X));
    check(enRows === "Card Y,Karta Z" && enFound === "Card X,Karta Z" && plRows === "Karta Y,Karta Z",
      "cn9a a Polish-primary catalog shown in EN lists its Next cards and the picker's finds by their English titles,"
      + " a card with none by its Polish one, and shown in PL by the Polish: " + [enRows, enFound, plRows].join(" | "));
    P.S.lang = "pl";
    const oneLang = rowsOf(P.nextHtml(A()));
    P.S.lang = "en";
    check(oneLang === rowsOf(P.nextHtml(A())) && oneLang === "Card B,Card C",
      "cn9b CONTROL: a catalog whose cards have one title lists the same rows whichever language is shown: " + oneLang);
  } catch (e) {
    check(false, "the legs stopped after " + asserted + " checks: " + (e && e.message));
  }

  if (!argv.includes("--keep")) dropScratch(SCRATCH, "card-next");
  const ok = failed === 0 && asserted === EXPECTED;
  console.log("RESULT: " + (ok ? "ok" : "FAIL") + " checks=" + asserted + " failed=" + failed + " expected=" + EXPECTED);
  process.exit(ok ? 0 : 1);
}

main(process.argv.slice(2)).catch((e) => { console.error(e && e.stack || e); process.exit(2); });
