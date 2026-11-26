/* THE PUBLISHING WINDOW, THE PRESS (decisions 2026-10-07 00:49, 22:15 and 23:49: Claudia's press with Claudia gamma's map).
 *
 *     node tests/publish-press.mjs [--keep]
 *
 * A real project published through src/studio.mjs, read by publishPlan's strip, and the press painted on
 * tests/page-stand-in.mjs. What it holds: the strip reads every card against the last edition (new, changed, retired,
 * as it was), and before a first edition every card is new; the press says the revision, the edition, the strip's
 * counts, its gates and where the file goes, sealed or plain, and turns Polish whole; Publish writes the file and the
 * window lands on the new rev with the bubble under its tab, a press finishing the drawing; and a refusal leaves the
 * press where it was, ready to press again. Markup, state and files only: the motion and the look are Maxim's.
 */
import "./licensed-env.mjs";
import { licensedOpts } from "./licensed.mjs";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import * as S from "../src/studio.mjs";
import { clearScratch, dropScratch } from "./scratch.mjs";
import { loadPage } from "./page-stand-in.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const SCRATCH = path.join(ROOT, "scratch", "publish-press");
const EXPECTED = 32; /* 32 at the merge base, and pr2s and pr2t on main, one retired by the folder removal, and pr3i retired with the folder team's branch of the map (2026-11-26) */

/* ETIUDA_PLANTS=off (a merge's area run) skips the plant legs pr3i, pr3l and pr3n and counts them toward EXPECTED;
   the release profile runs with plants on, so they still run there. */
const PLANTS_OFF = process.env.ETIUDA_PLANTS === "off";
let asserted = 0, failed = 0, skipped = 0;
function check(cond, line) {
  asserted++;
  if (cond) process.stdout.write("  ok   " + line + "\n");
  else { failed++; process.stderr.write("  FAIL " + line + "\n"); }
}
function skip(line) {
  skipped++;
  process.stdout.write("  SKIP  " + line + "\n");
}
const NB = String.fromCharCode(160);
const wire = (p) => Promise.resolve(p)
  .then(v => JSON.parse(JSON.stringify(Object.assign({ error: null }, v))))
  .catch(e => ({ error: e && e.message ? e.message : String(e), said: (e && e.said) || null }));
/** What a reader reads of some markup: the tags out, the entities and the no-break spaces as plain characters. */
const said = (h) => String(h).replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&#39;/g, "'").replace(/&quot;/g, '"')
  .replace(/&amp;/g, "&").split(NB).join(" ").replace(/\s+/g, " ").trim();
const kinds = (st) => st.groups.map(g => g.cards.join(""));

async function main(argv) {
  clearScratch(SCRATCH);
  const root = path.join(SCRATCH, "projects"), share = path.join(SCRATCH, "share");
  fs.mkdirSync(root, { recursive: true });
  fs.mkdirSync(share, { recursive: true });
  const made = await S.newProject(root, "Press", [{ code: "en", name: "English" }, { code: "pl", name: "Polish" }]);
  const dir = made.dir;
  const open = (await S.addTag(dir, "shelf", { en: "Opening", pl: "Powitanie" })).tag.id;
  const close = (await S.addTag(dir, "shelf", { en: "Closing", pl: "Pożegnanie" })).tag.id;
  const id = {};
  for (const [k, t] of [["a", open], ["b", open], ["c", close], ["d", close]])
    id[k] = (await S.addCard(dir, t, "Card " + k.toUpperCase(), "Thank you for writing.")).card.id;

  try {
    /* ---- 1. THE STRIP, read against the last edition -------------------------------------------------------------- */
    const before = (await S.publishPlan(dir)).strip;
    check(before && before.first === true && kinds(before).join("|") === "nn|nn"
          && before.groups.map(g => g.label.en).join(",") === "Opening,Closing",
      "pr1a before a first edition every card is new, by its category in the draft's order: " + JSON.stringify(before));
    await S.setPublishFolder(dir, share);
    await S.publishProject(dir, { now: "2026-09-01T09:00:00.000Z" });
    const same = (await S.publishPlan(dir)).strip;
    await S.saveCard(dir, id.b, { title: { en: "Card B, changed", pl: "Karta B" } });
    await S.retireCard(dir, id.c, true);
    id.e = (await S.addCard(dir, close, "Card E", "Good morning.")).card.id;
    await S.deleteCard(dir, id.d);
    const moved = (await S.publishPlan(dir)).strip;
    check(same.first === false && kinds(same).join("|") === "uu|uu" && kinds(moved).join("|") === "uc|rnr",
      "pr1b after a publish every card is as it was; then a changed, a retired, a new and a deleted card read c, r, n and r;"
      + " CONTROL: the same edition untouched reads u throughout: " + JSON.stringify([kinds(same), kinds(moved)]));

    /* ---- 2. THE PRESS, painted ----------------------------------------------------------------------------------- */
    const desks = { value: null };
    const calls = [];
    const licence = await licensedOpts();
    const api = {
      publishPlan: (d) => wire(S.publishPlan(d, licence)),
      desks: () => Promise.resolve(desks.value),
      publish: (d, o) => { calls.push(["publish", o]); return wire(S.publishProject(d, o)); },
      open: (d) => wire(S.openProject(d)),
      projects: () => wire(S.listProjects(root)),
      tabs: () => Promise.resolve({ error: null }),
      proposals: (d) => wire(S.listProposals(d)),
    };
    const home = loadPage({ api, uiLang: "en" });
    const P = home.page;
    const opened = await wire(S.openProject(dir));
    /* A team is the only way to publish (2026-11-26): the press opens for a catalog the project's record puts on one. */
    opened.project.sealedTeam = "t-0123456789abcdef";
    Object.assign(P.S, { open: opened, screen: "project", section: "cards", lang: "en", sel: null,
      tabs: [{ dir, name: "Press", rev: 1 }], host: { tour: { offered: true }, langs: S.builtLangs() } });
    await P.ACTS.publish();
    const h = home.node("#dlg").innerHTML;
    const legend = said((/id="pwcLegend">([\s\S]*?)<\/div>/.exec(h) || [])[1]);
    const line = said((/<p class="pwc-line">([\s\S]*?)<\/p>/.exec(h) || [])[1]);
    check(P.S.cover === "publish" && /<h2>Publish Press<\/h2>/.test(h) && said((/aria-label="(rev[^"]*)"/.exec(h) || [])[1]) === "rev 1 becomes rev 2"
          && /^1 new card 1 card changed 2 cards retired 1 card as in rev 1 \(\S+\) 3 cards go out in rev 2 \(\S+\)$/.test(legend)
          && line === "Every desk that reads the folder is offered this edition, and nothing changes for anyone until they accept it.",
      "pr2a the press names the project, the revision it makes, the strip's counts and the line under the title: "
      + JSON.stringify([legend, line]));
    const gates = [...h.matchAll(/<div class="pwc-gate" data-gate="[a-z]+"><span class="g ([a-z]+)"/g)].map(m => m[1]);
    check(gates.length === 7 && gates.every(g => g === "ok") && /7 of 7/.test(said(h)) && /id="notes"/.test(h)
          && /id="leadNote-en"/.test(h) && /id="leadNote-pl"[^>]* hidden/.test(h) && /data-act="pr-lead" data-v="pl"/.test(h),
      "pr2b seven gates pass, the signature's among them, the notes and the lead's note in each language are there, one language's box shown at a time: "
      + gates.join(","));
    check(/<span class="pw-chip">[\s\S]*?Sealed<\/span>/.test(h) && !/Plain/.test(said(h)) && !/class="kdisc/.test(h),
      "pr2c with no team facts the press says Sealed and never Plain, and prints no key (was: it said the edition is plain)");
    desks.value = { team: { sealed: true, epoch: 3, leadPrint: "87ad0879ac3e9ff6", roster: [
      { name: "Ola", admitted: true }, { name: "Jan", admitted: true }, { name: "Ewa", admitted: false }] } };
    await P.ACTS.publish();
    const hs = home.node("#dlg").innerHTML;
    check(/data-gate="seal">(?:(?!data-gate=)[^])*?<span class="ksig"><span class="kdisc" role="img" aria-label="Studio&#39;s signing key"[^]*?<span class="mono">87ad 0879 ac3e 9ff6<\/span>/.test(hs) && said(hs).indexOf("Where it goes 2 teammates") >= 0
          && said(hs).indexOf("Sealed for the team: only an admitted teammate can open it.") >= 0
          && !/epoch/i.test(said(hs))
          && said(hs).indexOf("Sealed for the team, epoch 3: only an admitted desk opens it.") < 0
          && said(hs).indexOf("2 teammates admitted read this folder. 1 more is named and not admitted yet.") >= 0,
      "pr2d sealed, it prints the team's key in four groups after Studio's disc, counts the admitted desks and names the one not admitted yet");
    const plan = P.S.plan;
    P.S.plan = Object.assign({}, plan, { lint: Object.assign({}, plan.lint, { errors: 1, rows: [{ severity: "error", why: "Two cards"
      + " carry one title." }] }) });
    const he = P.coverHtml();
    check(/<span class="g stop"/.test(he) && /id="override"/.test(he) && /6 of 7/.test(said(he)) && /Two cards carry one title\./.test(he),
      "pr2e CONTROL: an error stops the lint gate, shows the engine's sentence and asks for the note; six of seven pass");
    /* THE SIGNATURE'S GATE (publish-screen-never-signs, the Studio batch of 2026-10-12) says what the shell's plan says: signed
       with the key's print where this computer opens it, unsigned and why where it does not, or where there is no key. */
    const signSaid = (sg) => { P.S.plan = Object.assign({}, plan, { signing: sg });
      return said((/data-gate="sign">([^]*?)<\/div><\/div>/.exec(P.coverHtml()) || [])[1] || ""); };
    const sOpen = signSaid({ keyId: "studio-87ad0879ac3e9ff6", print: "87ad0879ac3e9ff6", opens: true });
    const sShut = signSaid({ keyId: "studio-87ad0879ac3e9ff6", print: "87ad0879ac3e9ff6", opens: false });
    const sNone = signSaid({ keyId: "", print: "", opens: false });
    const sBroken = signSaid({ keyId: "", print: "", opens: false, unreadable: true });
    check(/^Signed/.test(sOpen) && /87ad 0879 ac3e 9ff6/.test(sOpen) && /written beside the catalog/.test(sOpen)
          && /^Unsigned/.test(sShut) && /could not open the signing key/.test(sShut)
          && /^Unsigned/.test(sNone) && /no signing key yet/.test(sNone)
          && /^Unsigned/.test(sBroken) && /file on this computer cannot be read/.test(sBroken) && !/There is no signing key yet/.test(sBroken),
      "pr2g the signature's gate says signed with the key's print where this computer opens it, and unsigned with the reason"
      + " where it cannot or there is no key: " + JSON.stringify([sOpen.slice(0, 40), sShut.slice(0, 40), sNone.slice(0, 40)]));
    /* AFTER SIGNED EDITIONS AN UNSIGNED ONE DOES NOT GO (Grok's review mu, 2026-11-22, the second B): where the plan says an earlier
       edition was signed and this computer cannot sign, the gate stops and says where the key is restored; where it signs, it
       passes as before. */
    const signStop = (sg, before) => { P.S.plan = Object.assign({}, plan, { signing: sg, signedBefore: before });
      const h = P.coverHtml();
      return { said: said((/data-gate="sign">([^]*?)<\/div><\/div>/.exec(h) || [])[1] || ""),
        stop: /data-gate="sign"><span class="g stop"/.test(h), count: (/(\d) of 7/.exec(said(h)) || [])[1] }; };
    const shutKey = { keyId: "studio-87ad0879ac3e9ff6", print: "87ad0879ac3e9ff6", opens: false };
    const stShut = signStop(shutKey, true), stNone = signStop({ keyId: "", print: "", opens: false }, true);
    const stOpen = signStop({ keyId: "studio-87ad0879ac3e9ff6", print: "87ad0879ac3e9ff6", opens: true }, true);
    const stFirst = signStop(shutKey, false);
    const restoreLine = "Earlier editions of this catalog were signed and the signing key cannot be opened here now, so this edition cannot be published unsigned: desks that trust the key would refuse it. Restore the key from the Menu, under Settings, then Signing key.";
    check(stShut.stop && stShut.said.indexOf(restoreLine) >= 0 && stShut.count === "6" && stNone.stop && stNone.said.indexOf(restoreLine) >= 0
          && !stOpen.stop && /^Signed/.test(stOpen.said) && stOpen.count === "7"
          && !stFirst.stop && /could not open the signing key/.test(stFirst.said) && stFirst.count === "7",
      "pr2s after signed editions, a key this computer cannot open stops the signature's gate and says where the key is restored;"
      + " a key that opens passes, and with nothing signed before the gate is as it was: " + JSON.stringify([stShut, stOpen.stop, stFirst.stop]));
    P.S.plan = plan;

    const pl = loadPage({ api, uiLang: "pl" });
    pl.sandbox.STUDIO_T.set("pl");
    Object.assign(pl.page.S, { open: opened, screen: "project", section: "cards", lang: "en", uiLang: "pl", plan, planDesks: desks.value,
      cover: "publish" });
    const ph = said(pl.page.coverHtml());
    const english = ["Publish", "Checks", "Note for this edition", "What it passes", "What you write", "Where it goes",
      "Rev", "Edition", "Last published", "Second today", "card", "go out", "Sealed", "admitted", "Change folder",
      "Enter publishes", "of 6", "Every desk that reads the folder is offered this edition",
      "rev "].filter(w => ph.indexOf(w) >= 0);
    check(pl.sandbox.STUDIO_T.ready("publish") && english.length === 0 && /Kontrola/.test(ph) && !/Przez co przechodzi/.test(ph)
          && !/Opis wydania/.test(ph) && /7 z 7/.test(ph)
          && /3 karty wycofane|2 karty wycofane/.test(ph) && /Przyjęci członkowie zespołu czytający ten folder: 2\./.test(ph)
          && ph.indexOf("Notatka do tego wydania") >= 0
          && ph.indexOf("Każde stanowisko, które czyta ten folder, dostanie propozycję tego wydania, a u nikogo nic się nie zmieni, dopóki jej nie przyjmie.") >= 0
          && ph.indexOf("Zapieczętowane dla zespołu: otworzy je tylko przyjęty członek zespołu.") >= 0 && !/epok/i.test(ph),
      "pr2f the press turns Polish whole, its counted words in their few forms: " + JSON.stringify(english));

    /* ---- 3. PUBLISH: the file, the drawing, the landing ---------------------------------------------------------- */
    home.doc.absent = new Set(["#fileName", "#override"]);    /* a name fixed by the first publish has no box */
    home.node("#notes").value = "The courier hours.";
    home.node("#leadNote-pl").value = "Kurier o 15:00.";
    const going = P.ACTS["do-publish"]();
    await new Promise(f => setTimeout(f, 300));
    const busyMid = P.__get("prBusy");
    P.ACTS["cover-close"]();                      /* Escape while it draws finishes the drawing and does not close under it */
    const coverMid = P.S.cover;
    await going;
    const pub = calls.find(c => c[0] === "publish");
    const proj = JSON.parse(fs.readFileSync(path.join(dir, "project.json"), "utf8"));
    check(busyMid === true && coverMid === "publish" && pub && pub[1].notes === "The courier hours." && pub[1].leadNotes && pub[1].leadNotes.pl === "Kurier o 15:00."
          && proj.rev === 2 && P.S.cover === null && P.S.tabs[0].rev === 2 && P.__get("prBusy") === false,
      "pr3a Publish writes rev 2 with the notes typed, and the window lands once the drawing is finished: "
      + JSON.stringify([busyMid, coverMid, proj.rev, P.S.cover, P.S.tabs[0].rev]));
    check(home.node("#pressed").hidden === false && said(home.node("#pressedTitle").textContent) === "Rev 2 is in the folder."
          && /^Edition \S+\. 2 teammates admitted read this folder\. 1 more is named/.test(said(home.node("#pressedBody").textContent))
          && /^Rev 2 \(\S+\) is in the folder\.$/.test(said(home.node("#said").textContent)),
      "pr3b the bubble under the tab says the new rev is in the folder and where, and a reader is told: "
      + JSON.stringify([home.node("#pressedTitle").textContent, home.node("#pressedBody").textContent, home.node("#said").textContent, home.node("#pressed").hidden]));
    const bodyWithout = said(home.node("#pressedBody").textContent);
    P.__get("prLanded")({ rev: 2, edition: "2026-10-22", ec: "press.ec", folder: share, syncPending: true }, {}, P.__get("prDeskLine")());
    const bodyWith = said(home.node("#pressedBody").textContent);
    check(!bodyWithout.includes("The edition is published. The team will have it shortly, and nothing more needs doing.")
          && bodyWith.includes("The edition is published. The team will have it shortly, and nothing more needs doing."),
      "pr3e a publish reply with syncPending shows the pending sentence beside the landed notice, and one without does not: "
      + JSON.stringify([bodyWithout.includes("shortly"), bodyWith.includes("shortly")]));

    /* (a) the press caption says W2's caption, in English and in Polish. MOVED 2026-11-26 with the folder team's branch of the map: was "the press caption on a relay
       team says W2's caption and a folder team's says today's" ("The edition is in the team's folder." / "Wydanie jest już w folderze zespołu."); the caption is one now, the
       relay's, whatever place the page is handed. */
    const relayFolder = path.join(SCRATCH, "relay", "0123456789abcdef0123456789abcdef");
    const capOf = (page, dir) => { try { return page.__get("prPressCap")(dir); } catch { return ""; } };
    const enRelayCap = capOf(P, relayFolder);
    const enFolderCap = capOf(P, share);
    const plRelayCap = capOf(pl.page, relayFolder);
    const w2RelayEn = "Each running desk takes the file once the relay has it and offers it to the person at it; a desk that is closed finds it when it next starts.";
    const w2FolderEn = "The edition is in the team's folder.";
    const w2RelayPl = "Każde włączone stanowisko weźmie plik, gdy tylko dotrze on do przekaźnika, i zaproponuje go osobie, która przy nim pracuje; wyłączone znajdzie go przy następnym uruchomieniu.";
    const w2FolderPl = "Wydanie jest już w folderze zespołu.";
    check(enRelayCap === w2RelayEn && enFolderCap === w2RelayEn && plRelayCap === w2RelayPl,
      "pr3f the press caption says W2's relay caption in English and in Polish, whatever place the page is handed (no folder team's caption is left): "
      + JSON.stringify([enRelayCap === w2RelayEn, enFolderCap === w2RelayEn, plRelayCap === w2RelayPl]));

    /* (b) a publish reply with syncFailed shows the W2 failure sentence in English and Polish, and a sync that outlasts the wait still says today's sentence */
    P.__get("prLanded")({ rev: 2, edition: "2026-10-22", ec: "press.ec", folder: relayFolder, syncFailed: true }, {}, P.__get("prDeskLine")());
    const bodyFailedEn = said(home.node("#pressedBody").textContent);
    pl.page.__get("prLanded")({ rev: 2, edition: "2026-10-22", ec: "press.ec", folder: relayFolder, syncFailed: true }, {}, pl.page.__get("prDeskLine")());
    const bodyFailedPl = said(pl.node("#pressedBody").textContent);
    const failLineEn = "The relay could not be reached just now. The edition is written, and Studio sends it at its next look, within a few minutes; nothing more needs doing.";
    const failLinePl = "Nie udało się teraz połączyć z przekaźnikiem. Wydanie jest zapisane, a Studio wyśle je przy następnym sprawdzeniu, w ciągu kilku minut; nic więcej nie trzeba robić.";
    check(bodyFailedEn.includes(failLineEn) && !bodyFailedEn.includes("shortly")
          && !bodyFailedEn.includes(w2FolderEn)
          && bodyFailedPl.includes(failLinePl) && !bodyFailedPl.includes("za chwilę")
          && !bodyFailedPl.includes(w2FolderPl)
          && bodyWith.includes("The edition is published. The team will have it shortly, and nothing more needs doing.")
          && !bodyWith.includes(failLineEn),
      "pr3g a publish reply with syncFailed shows the W2 failure sentence in English and Polish, and a sync that outlasts the wait still says today's sentence: "
      + JSON.stringify([bodyFailedEn.includes("could not be reached"), bodyFailedPl.includes("Nie udało się teraz połączyć")]));

    /* (c) pr3o: the rolled-forward sentence is gone with the team file and head a folder publish no longer writes (the folder team's
       removal). A reply that still carries ringHeadLater, as an older shell's would, says nothing of it: the ordinary folder sentence stands.
       plant:w4-ring-head-later (twice: in the page and in this leg's plant, pr3p) stood on that sentence's line, which is gone; plant:w4-ring-head-later the mark stays until the plant guard has a way to retire one. */
    const w4LaterEn = "The edition is in the team's folder. The team's own records could not be brought up to date this time, so they follow with the next publish; nothing needs doing now.";
    const w4LaterPl = "Wydanie jest już w folderze zespołu. Zapisów zespołu nie udało się tym razem zaktualizować, więc zostaną uzupełnione przy następnej publikacji; teraz nic nie trzeba robić.";
    P.__get("prLanded")({ rev: 2, edition: "2026-10-22", ec: "press.ec", folder: share, ringHeadLater: true }, {}, P.__get("prDeskLine")());
    const bodyLaterEn = said(home.node("#pressedBody").textContent);
    pl.page.__get("prLanded")({ rev: 2, edition: "2026-10-22", ec: "press.ec", folder: share, ringHeadLater: true }, {}, pl.page.__get("prDeskLine")());
    const bodyLaterPl = said(pl.node("#pressedBody").textContent);
    P.__get("prLanded")({ rev: 2, edition: "2026-10-22", ec: "press.ec", folder: share }, {}, P.__get("prDeskLine")());
    const bodyOrdEn = said(home.node("#pressedBody").textContent);
    pl.page.__get("prLanded")({ rev: 2, edition: "2026-10-22", ec: "press.ec", folder: share }, {}, pl.page.__get("prDeskLine")());
    const bodyOrdPl = said(pl.node("#pressedBody").textContent);
    check(!bodyLaterEn.includes(w4LaterEn) && !bodyLaterEn.includes("records could not") && !bodyLaterEn.includes(w2FolderEn)
          && !bodyLaterPl.includes(w4LaterPl) && !bodyLaterPl.includes("Zapisów zespołu nie udało się") && !bodyLaterPl.includes(w2FolderPl),
      "pr3o a reply that carries ringHeadLater says nothing of it, in English and Polish, and no folder sentence follows (was: the ordinary folder sentence stood, and before that a rolled-forward publish showed her line): "
      + JSON.stringify([bodyLaterEn.includes("records could not"), bodyLaterPl.includes("Zapisów zespołu nie udało się")]));

    /* (d) Grok's review 29, finding 2: a publish that went above a newer edition the folder already held says so, with that rev, in
       English and Polish (Claudette's words, 2026-11-15), and an ordinary publish does not. */
    const r2En = "The folder already held rev 5 of this catalog, newer than this project's, so this edition went out above it.";
    const r2Pl = "W folderze była już wersja 5 tego katalogu, nowsza niż w tym projekcie, więc to wydanie wyszło z wyższym numerem.";
    P.__get("prLanded")({ rev: 6, edition: "2026-10-22", ec: "press.ec", folder: share, folderNewer: 5 }, {}, P.__get("prDeskLine")());
    const bodyAboveEn = said(home.node("#pressedBody").textContent);
    pl.page.__get("prLanded")({ rev: 6, edition: "2026-10-22", ec: "press.ec", folder: share, folderNewer: 5 }, {}, pl.page.__get("prDeskLine")());
    const bodyAbovePl = said(pl.node("#pressedBody").textContent);
    check(bodyAboveEn.includes(r2En) && bodyAbovePl.includes(r2Pl) && !bodyOrdEn.includes("already held rev") && !bodyOrdPl.includes("była już wersja"),
      "pr3q a publish that went above a newer edition in the folder says the folder held rev 5, in English and Polish, and an ordinary publish"
      + " does not: " + JSON.stringify([bodyAboveEn.includes(r2En), bodyAbovePl.includes(r2Pl)]));

    /* MOVED 2026-11-26 with the folder team's branch of the map. Was: "a folder map says what that desk wrote back and does not send the edition on, and a relay map still
       names the new edition" (prHeldLine, the key's folderHonest, prFliesToDesks's folder). Now the map has one kind of team: it names the new edition, sends it on, and the
       folder team's lines are gone from the page. */
    let keyRelay = "", flyRelay = null, noFolderBranch = false, mapUses = false, goUses = false, heldWhy = "";
    const gone = (name) => { try { P.__get(name); return false; } catch { return true; } };
    const savedPlan = P.S.plan, savedDesks = P.S.planDesks;
    try {
      P.S.plan = { folder: relayFolder, rev: 1, next: 2, edition: "2026-10-22", was: "2026-09-01", fileName: "press.ec" };
      P.S.planDesks = { team: { sealed: true, roster: [
        { name: "Ola", admitted: true }, { name: "Jan", admitted: true }, { name: "Ewa", admitted: false },
      ] }, uses: [{ name: "Ola", kind: "edition", rev: 1, n: "2026-09-01" }] };
      keyRelay = P.__get("prMapKey")(false);
      flyRelay = P.__get("prFliesToDesks")();
      noFolderBranch = gone("prHeldLine") && gone("prFolderWritten") && String(P.__get("prMapOpts")).indexOf("folderHonest") < 0
        && String(P.__get("deskMap")).indexOf("folderHonest") < 0 && P.__get("prMapOpts")(true).folderHonest === undefined;
      mapUses = String(P.__get("deskMap")).indexOf("prMapParts") >= 0;
      goUses = String(P.__get("prGo")).indexOf("prFliesToDesks") >= 0;
    } catch (e) { heldWhy = e && e.message ? e.message : String(e); }
    finally { P.S.plan = savedPlan; P.S.planDesks = savedDesks; }
    check(keyRelay.indexOf("has the new edition") >= 0 && keyRelay.indexOf("reads this folder") >= 0 && flyRelay === true && noFolderBranch && mapUses && goUses,
      "pr3h the map has one kind of team: its key names the new edition, the chip flies on to the desks, and the folder team's lines (what a desk wrote back, folderHonest, the folder sentence) are gone from the page: "
      + JSON.stringify([keyRelay, flyRelay, noFolderBranch, mapUses, goUses, heldWhy]));

    const appPath = path.join(ROOT, "ui", "app.js");
    const goodApp = fs.readFileSync(appPath);
    const goodHash = crypto.createHash("sha256").update(goodApp).digest("hex");
    const plantOne = (needle, repl, run) => {
      const text = goodApp.toString("utf8");
      if (text.indexOf(needle) < 0) return { red: false, why: "plant missed" };
      const page = loadPage({ api, uiLang: "en", source: text.replace(needle, repl) });
      let red = false, why = "";
      try { red = run(page.page, page) !== true; }
      catch (e) { red = true; why = e && e.message ? e.message : String(e); }
      const back = crypto.createHash("sha256").update(fs.readFileSync(appPath)).digest("hex");
      if (back !== goodHash) throw new Error("sha256 restore failed");
      return { red, why };
    };
    /* pr3i RETIRED 2026-11-26 with the folder team's branch of the map: removing the folder sentence (plant:f2-folder-written), the still-on-the-desk guard (plant:f2-folder-flies)
       or the written-back line (plant:f2-folder-held) made that claim again. The three lines are gone from the page; their marks stay as comments there. */

    /* The plant of pr3q: the press's sentence for a newer edition in the folder taken out turns it red. */
    if (PLANTS_OFF) {
      skip("pr3r the sentence for a newer edition in the folder planted out turns pr3q red, and the file is unchanged (ETIUDA_PLANTS=off)");
    } else {
      const above = plantOne(
        'const above = r && r.folderNewer ? " " + T("The folder already held rev {N} of this catalog, newer than this project\'s, so this edition went out above it.", { N: r.folderNewer }) : ""; /* plant:r2-press */',
        'const above = ""; /* plant:r2-press */',
        (page, box) => {
          page.__get("prLanded")({ rev: 6, edition: "2026-10-22", ec: "press.ec", folder: share, folderNewer: 5 }, {}, "2 teammates admitted read this folder.");
          return said(box.node("#pressedBody").textContent).includes(r2En);
        });
      check(above.red && crypto.createHash("sha256").update(fs.readFileSync(appPath)).digest("hex") === goodHash,
        "pr3r the sentence for a newer edition in the folder planted out turns pr3q red, and the file is unchanged: " + JSON.stringify(above));
    }

    /* The plant of pr2s: the cover's reading of an earlier signed edition lifted turns it red. */
    if (PLANTS_OFF) {
      skip("pr2t the cover's reading of an earlier signed edition planted out turns pr2s red, and the file is unchanged (ETIUDA_PLANTS=off)");
    } else {
      const stopped = plantOne(
        "const unsignedRefused = !sg.opens && p.signedBefore === true; /* plant:s1-cover */",
        "const unsignedRefused = false; /* plant:s1-cover */",
        (page) => {
          Object.assign(page.S, { open: opened, screen: "project", section: "cards", lang: "en", uiLang: "en", planDesks: null, cover: "publish",
            plan: Object.assign({}, plan, { signing: shutKey, signedBefore: true }) });
          const h = page.coverHtml();
          return /data-gate="sign"><span class="g stop"/.test(h) && said(h).indexOf(restoreLine) >= 0;
        });
      check(stopped.red && crypto.createHash("sha256").update(fs.readFileSync(appPath)).digest("hex") === goodHash,
        "pr2t the cover's reading of an earlier signed edition planted out turns pr2s red, and the file is unchanged: " + JSON.stringify(stopped));
    }

    /* A publish whose relay sync failed or is pending stops at the relay, leaving every desk unmarked.
       A successful relay sync marks each desk as having the edition. */
    const marksFor = async (reply) => {
      const box = loadPage({ api, uiLang: "en" });
      const page = box.page, doc = box.doc;
      doc.createElementNS = (ns, tag) => doc.createElement(tag);
      const dm = doc.querySelector("#pwcBig .dm");
      dm.clientWidth = 1000; dm.clientHeight = 600;
      page.S.plan = { folder: relayFolder, rev: 1, next: 2, edition: "2026-10-30", fileName: "press.ec", langs: ["en"] };
      page.S.planDesks = { team: { sealed: true, roster: [{ name: "Ola", admitted: true }, { name: "Jan", admitted: true }] } };
      let marks = [], sent = false, finished = false, keysText = "";
      const realDm = page.__get("deskMap");
      page.__set("deskMap", (root, o) => {
        const api = realDm(root, o);
        const kEl = (root.children || []).find((c) => c && c.className === "dm-keys");
        if (kEl) keysText = kEl.innerHTML;
        return {
          ...api,
          send(dur) { sent = true; return api.send(dur); },
          finish() { finished = true; return api.finish(); },
          destroy() {
            const paths = root.children[1] ? root.children[1].children : [];
            marks = paths.map((p) => p.getAttribute("marker-end")).filter(Boolean);
            api.destroy();
          },
        };
      });
      const p = page.__get("prGo")(reply);
      page.__get("prSkip")();
      await p;
      return { marks, sent, finished, flies: page.__get("prFliesToDesks")(reply), keysText };
    };

    const mapFailed = await marksFor({ rev: 2, edition: "2026-10-30", ec: "press.ec", syncFailed: true });
    const mapPending = await marksFor({ rev: 2, edition: "2026-10-30", ec: "press.ec", syncPending: true });
    const mapGood = await marksFor({ rev: 2, edition: "2026-10-30", ec: "press.ec" });

    check(mapFailed.flies === false && mapFailed.marks.length === 0 && !mapFailed.sent && !mapFailed.finished
          && mapGood.flies === true && mapGood.marks.length === 2 && mapGood.sent && mapGood.finished,
      "pr3j a failed sync leaves every desk unmarked on the relay publish map: "
      + JSON.stringify([mapFailed.flies, mapFailed.marks, mapGood.flies, mapGood.marks]));

    check(mapPending.flies === false && mapPending.marks.length === 0 && !mapPending.sent && !mapPending.finished
          && mapGood.flies === true && mapGood.marks.length === 2 && mapGood.sent && mapGood.finished,
      "pr3k a pending sync leaves every desk unmarked on the relay publish map: "
      + JSON.stringify([mapPending.flies, mapPending.marks, mapGood.flies, mapGood.marks]));

    check(mapFailed.keysText.indexOf("has the new edition") < 0
          && mapPending.keysText.indexOf("has the new edition") < 0
          && mapGood.keysText.indexOf("has the new edition") >= 0
          && P.__get("prMapKey")(false, { syncFailed: true }).indexOf("has the new edition") < 0
          && P.__get("prMapKey")(false, { syncPending: true }).indexOf("has the new edition") < 0
          && P.__get("prMapKey")(false).indexOf("has the new edition") >= 0,
      "pr3m a failed or pending sync drops 'has the new edition' from the publish map key: "
      + JSON.stringify([mapFailed.keysText, mapPending.keysText, mapGood.keysText]));

    if (PLANTS_OFF) {
      skip("pr3l removing the failed or pending sync map guard sends the edition to the desks when the relay does not hold it, and the file is unchanged (ETIUDA_PLANTS=off)");
      skip("pr3n removing the failed or pending sync map key guard keeps 'has the new edition' on the map key, and the file is unchanged (ETIUDA_PLANTS=off)");
    } else {
      const syncMapPlant = plantOne(
        "return !(r && (r.syncFailed || r.syncPending)); /* plant:w3-sync-map */",
        "return true; /* plant:w3-sync-map */",
        (page) => page.__get("prFliesToDesks")({ syncFailed: true }) === false
          && page.__get("prFliesToDesks")({ syncPending: true }) === false);
      const treeW3 = crypto.createHash("sha256").update(fs.readFileSync(appPath)).digest("hex");
      check(syncMapPlant.red && treeW3 === goodHash,
        "pr3l removing the failed or pending sync map guard sends the edition to the desks when the relay does not hold it, and the file is unchanged: "
        + JSON.stringify({ syncMap: syncMapPlant.red, why: syncMapPlant.why }));

      const syncKeyPlant = plantOne(
        'if (!(r && (r.syncFailed || r.syncPending))) parts.push(["ln", T("has the new edition")]); /* plant:w3-sync-key */',
        'parts.push(["ln", T("has the new edition")]); /* plant:w3-sync-key */',
        (page) => page.__get("prMapKey")(false, { syncFailed: true }).indexOf("has the new edition") < 0
          && page.__get("prMapKey")(false, { syncPending: true }).indexOf("has the new edition") < 0);
      const treeW3k = crypto.createHash("sha256").update(fs.readFileSync(appPath)).digest("hex");
      check(syncKeyPlant.red && treeW3k === goodHash,
        "pr3n removing the failed or pending sync map key guard keeps 'has the new edition' on the map key, and the file is unchanged: "
        + JSON.stringify({ syncKey: syncKeyPlant.red, why: syncKeyPlant.why }));

    }

    /* a refusal: the folder holds another catalog's file under the name this one would take */
    const other = await S.newProject(root, "Other", [{ code: "en", name: "English" }]);
    await S.setPublishFolder(other.dir, share);
    await S.addCard(other.dir, (await S.addTag(other.dir, "shelf", { en: "General", pl: "Ogólne" })).tag.id, "One", "Hello.");
    const oOpen = await wire(S.openProject(other.dir));
    oOpen.project.sealedTeam = "t-0123456789abcdef";
    Object.assign(P.S, { open: oOpen, tabs: [{ dir: other.dir, name: "Other", rev: 0 }] });
    home.doc.absent = new Set(["#override"]);
    await P.ACTS.publish();
    home.node("#fileName").value = path.basename(proj.fileName || "press.ec").replace(/\.ec$/, "");
    calls.length = 0;
    await P.ACTS["do-publish"]();
    const refused = home.node("#dlg").innerHTML;
    check(calls.length === 1 && P.S.cover === "publish" && /data-err/.test(refused) && P.__get("prBusy") === false
          && JSON.parse(fs.readFileSync(path.join(other.dir, "project.json"), "utf8")).rev !== 1,
      "pr3c CONTROL: a refused publish leaves the press up with the refusal said in it, nothing written, and the button free: "
      + said((/<div class="pw-refuse" data-err>([\s\S]*?)<\/div>/.exec(refused) || [])[1] || ""));
    const ec = fs.readdirSync(share).filter(n => /\.ec$/.test(n));
    check(ec.length === 1,
      "pr3d the share holds the one catalog published, and the refused one wrote nothing beside it: " + ec.join(","));

    /* ---- 4. WARNED BEFORE IT PUBLISHES (updates 6; the version policy, point 5) ----------------------------------------
       The test architect's conditions: "Warning before publishing under "newer" is a defect fix: confirm, and say every desk
       will show the evaluation mark", and "Before a publish that raises minEngine above any active desk, or that stamps
       "newer", the lead is warned." Max, 2026-11-17 20:41, took the mark away with the "newer" state (a paid licence that ends
       stops Studio), so only the first half is left, and a build released after the licence's updates publishes at the first
       press like any other. The press is painted from a plan of its own; the shell's publish is a stand-in that
       records the call and refuses, so nothing is written. */
    const pressOf = (src, lang, licence, roster) => {
      const pressed = [];
      const h = loadPage({ api: { publish: (d, o) => { pressed.push(o); return Promise.resolve({ error: "the stand-in publishes nothing" }); } },
        uiLang: lang, source: src });
      if (lang === "pl") h.sandbox.STUDIO_T.set("pl");
      const Q = h.page;
      Object.assign(Q.S, { open: opened, screen: "project", section: "cards", lang: "en", uiLang: lang, cover: "publish", prSure: false,
        plan: Object.assign({}, plan, { licence: licence, lint: Object.assign({}, plan.lint, { errors: 0, rows: [] }) }),
        planDesks: { minEngine: "2.0.0", team: { sealed: true, epoch: 1, leadPrint: "87ad0879ac3e9ff6", roster } } });
      return { h, Q, pressed };
    };
    const ENDED = { status: "active", canPublish: true, org: "Harbour Ltd", seats: 2, devicesEach: 2, updatesUntil: "2026-06-30" };
    const ACTIVE = { status: "active", canPublish: true, org: "Harbour Ltd", seats: 2, devicesEach: 2, updatesUntil: "2027-06-30" };
    const UP = [{ name: "Ola", admitted: true, version: "2.0.0", below: false }];
    const OLD = UP.concat([{ name: "Older lamp", admitted: true, version: "1.9.0", below: true }]);
    const u6a = async (src) => {
      const { h, Q, pressed } = pressOf(src, "en", ENDED, UP);
      await Q.ACTS["do-publish"]();
      return pressed.length === 1 && !Q.S.prSure && !/data-sure/.test(h.node("#dlg").innerHTML);
    };
    const u6b = async (src) => {
      const { Q, pressed } = pressOf(src, "en", ACTIVE, UP);
      await Q.ACTS["do-publish"]();
      return pressed.length === 1 && !Q.S.prSure;
    };
    const p5c = async (src) => {
      const { h, Q, pressed } = pressOf(src, "en", ACTIVE, OLD);
      await Q.ACTS["do-publish"]();
      const ask = said(h.node("#dlg").innerHTML), asked = pressed.length;
      Q.ACTS["pr-sure-no"]();
      const after = said(h.node("#dlg").innerHTML);
      return asked === 0 && ask.indexOf("This edition needs Etiuda 2.0.0 or newer, and these desks run an older one:"
          + " Older lamp (1.9.0). They keep the edition they have until a newer Etiuda is installed there.") >= 0 && ask.indexOf("Publish anyway") >= 0
        && ask.indexOf("reported") < 0
        && ask.indexOf("Ola (") < 0 && !Q.S.prSure && after.indexOf("Publish anyway") < 0 && pressed.length === 0;
    };
    /* p5d: the members admitted that have not reported a version, counted after the warning's two sentences (the copywriter,
       2026-11-01, f21c8b89), one and more, in English and in Polish; a desk not admitted is not counted. */
    const QUIET = { name: "Quiet lamp", admitted: true, version: "", below: false };
    const p5d = async (src) => {
      const two = OLD.concat([QUIET, Object.assign({}, QUIET, { name: "Second quiet" }), Object.assign({}, QUIET, { name: "Asking", admitted: false })]);
      const asks = [];
      for (const [lang, roster] of [["en", OLD.concat([QUIET])], ["en", two], ["pl", OLD.concat([QUIET])], ["pl", two]]) {
        const { h, Q } = pressOf(src, lang, ACTIVE, roster);
        await Q.ACTS["do-publish"]();
        asks.push(said(h.node("#dlg").innerHTML));
      }
      process.stdout.write("       " + asks.map((a) => { const i = a.indexOf("Publish anyway") >= 0 ? a.indexOf("Cancel") : a.indexOf("Anuluj"); return a.slice(Math.max(0, i - 110), i); }).join(" | ") + "\n");
      return asks[0].indexOf("installed there. 1 desk has not reported its version yet, so it may need a newer Etiuda too.") >= 0
        && asks[1].indexOf("installed there. Desks that have not reported their version yet: 2. Some of them may need a newer Etiuda too.") >= 0
        && asks[2].indexOf("nowsza Etiuda. Jedno stanowisko nie podało jeszcze wersji, więc także ono może potrzebować nowszej Etiudy.") >= 0
        && asks[3].indexOf("nowsza Etiuda. Stanowiska, które nie podały jeszcze wersji: 2. Także one mogą potrzebować nowszej Etiudy.") >= 0;
    };
    check(await u6a(undefined), "u6a a build released after the licence's updates ended publishes at the first press, as any other does,"
      + " and nothing is asked: no mark is stamped any more");
    check(await u6b(undefined), "u6b CONTROL: under a licence whose updates cover the build, and no desk below the edition, the first press"
      + " publishes and nothing is asked");
    check(await p5c(undefined), "p5c an edition asking for a newer Etiuda than a member reports asks first, naming that member and its version"
      + " and not the one up to date, and Cancel leaves the press with nothing published (red where it publishes unasked)");
    check(await p5d(undefined), "p5d the members admitted that have not reported a version are counted after the warning, one and two, in"
      + " English and in Polish, in the copywriter's words (red where the count is not said)");
    /* u6p: each guard removed from the page's source, in memory, turns its leg red. */
    if (PLANTS_OFF) {
      skip("u6p the plants of p5c, p5d (plants off)");
    } else {
      const { plantsTree, treeSha, dropPlantsTree } = await import("./plants-tree.mjs");
      const before = treeSha(ROOT), copy = plantsTree(ROOT, "publish-press-u6");
      const reds = [];
      try {
        const at = path.join(copy, "ui", "app.js"), buf = fs.readFileSync(at), want = crypto.createHash("sha256").update(buf).digest("hex");
        const cut = async (tag, edit, leg) => {
          const lines = buf.toString("utf8").split("\n"), mark = "plant:" + tag + " ", n = lines.filter((l) => l.indexOf(mark) >= 0).length;
          fs.writeFileSync(at, lines.map((l) => (l.indexOf(mark) >= 0 ? edit(l) : l)).join("\n"));
          const red = n === 1 && !(await leg(fs.readFileSync(at, "utf8")));
          fs.writeFileSync(at, buf);
          return red && crypto.createHash("sha256").update(fs.readFileSync(at)).digest("hex") === want;
        };
        reds.push(await cut("u6-ask", () => "", p5c));
        reds.push(await cut("p5-below", (l) => l.replace(/=> [^;]*;/, "=> [];"), p5c));
        reds.push(await cut("p5-unreported", (l) => l.replace(/= prRoster\(\)[^;]*;/, "= 0;"), p5d));
      } finally { dropPlantsTree(copy, ROOT); }
      reds.push(treeSha(ROOT) === before);
      check(reds.every(Boolean), "u6p removing the ask, the desks below or the unreported count, each in a scratch copy put back"
        + " by its sha256, turns p5c, p5c and p5d red, and this checkout is unchanged: " + JSON.stringify(reds));
    }
  } catch (e) {
    check(false, "the legs stopped after " + asserted + " checks: " + (e && e.stack || e));
  }

  if (!argv.includes("--keep")) dropScratch(SCRATCH, "publish-press");
  const ok = failed === 0 && asserted + skipped === EXPECTED;
  console.log("#counts checks=" + asserted + " skipped=" + skipped + " failed=" + failed + " expected=" + EXPECTED);
  console.log("RESULT: " + (ok ? "ok" : "FAIL") + " checks=" + asserted + " skipped=" + skipped + " failed=" + failed + " expected=" + EXPECTED);
  process.exit(ok ? 0 : 1);
}

main(process.argv.slice(2)).catch((e) => { console.error(e && e.stack || e); process.exit(2); });
