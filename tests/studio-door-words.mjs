/* STUDIO'S DOOR, ACCOUNT'S SEAT ROW AND THE EVALUATION LINES OUT (piece S-3):
 * node tests/studio-door-words.mjs
 *
 * Node only, opens no window. Loaded over tests/page-stand-in.mjs against ui/app.js and ui/lang.js.
 * The copywriter's literals below are extracted from the words files (never retyped).
 */
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
import { loadPage } from "./page-stand-in.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const APP_PATH = path.join(ROOT, "ui", "app.js");
const LANG_PATH = path.join(ROOT, "ui", "lang.js");
const APP = fs.readFileSync(APP_PATH, "utf8");
const LANG = fs.readFileSync(LANG_PATH, "utf8");

let asserted = 0, failed = 0;
function check(cond, line) {
  asserted++;
  if (cond) process.stdout.write("  ok   " + line + "\n");
  else { failed++; process.stdout.write("  FAIL " + line + "\n"); }
}

const plain = (h) => String(h || "").replace(/<svg[\s\S]*?<\/svg>/g, " ").replace(/<[^>]*>/g, " ")
  .replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">")
  .replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();

/* Extracted verbatim from words-desk-and-studio-door-2026-11-17.md and words-separate-trials-2026-11-17.md. */
const WORDS = {
  "s1": {
    "head": {
      "en": "Etiuda Studio starts with a sign-in.",
      "pl": "Etiuda Studio zaczyna się od zalogowania."
    },
    "line": {
      "en": "Signing in with Microsoft or Google brings the licence this account holds, or else starts Etiuda Studio's fourteen days. Projects open once that is done.",
      "pl": "Zalogowanie kontem Microsoft lub Google daje dostęp do licencji tego konta, a jeśli jej nie ma, rozpoczyna czternaście dni Etiudy Studio. Projekty otwierają się po zalogowaniu."
    }
  },
  "s3": {
    "head": {
      "en": "Etiuda Studio's trial has ended.",
      "pl": "Okres próbny Etiudy Studio się skończył."
    },
    "line": {
      "en": "It ended on {STUDIO_END}, and no project opens until a licence is bought.",
      "pl": "Skończył się {STUDIO_END} i żaden projekt się nie otworzy do czasu zakupu licencji."
    },
    "btn": {
      "en": "Save the drafts as files…",
      "pl": "Zapisz wersje robocze jako pliki…"
    },
    "beside": {
      "en": "Each project's current draft can still be saved in a folder of your choice, as a catalog file and its cards as a CSV file. Published editions are already files in each project's archive on this computer.",
      "pl": "Bieżącą wersję roboczą każdego projektu można jeszcze zapisać w wybranym folderze jako plik katalogu, a jej karty jako plik CSV. Opublikowane wydania są już plikami w archiwum każdego projektu na tym komputerze."
    }
  },
  "s5": {
    "head": {
      "en": "This account manages the licence but has no seat on it.",
      "pl": "To konto zarządza licencją, ale nie ma w niej miejsca."
    },
    "line": {
      "en": "Projects open only for an account with a seat. The licence is managed from the card below.",
      "pl": "Projekty otwierają się tylko na koncie z miejscem w licencji. Licencją zarządza się na karcie poniżej."
    }
  },
  "seat4": {
    "val": {
      "en": "Trial, day {N} of 14",
      "pl": "Okres próbny, dzień {N} z 14"
    },
    "line": {
      "en": "Etiuda Studio's own fourteen days, until {DATE}, on up to three computers.",
      "pl": "Własne czternaście dni Etiudy Studio, do {DATE}, najwyżej na trzech komputerach."
    }
  },
  "seat5": {
    "val": {
      "en": "Trial, day {N} of 14",
      "pl": "Okres próbny, dzień {N} z 14"
    },
    "line": {
      "en": "Etiuda Studio's own fourteen days, until {STUDIO_END}. Etiuda on this account runs on them too: its own fourteen days ended on {DESK_END}.",
      "pl": "Własne czternaście dni Etiudy Studio, do {STUDIO_END}. Etiuda na tym koncie też z nich korzysta: jej własne czternaście dni skończyły się {DESK_END}."
    }
  },
  "seat6": {
    "val": {
      "en": "Trial ended",
      "pl": "Okres próbny skończony"
    },
    "line": {
      "en": "Etiuda Studio's trial ended on {STUDIO_END}, and Etiuda's on {DESK_END}. No project opens now; each project's draft can still be saved as a catalog file.",
      "pl": "Okres próbny Etiudy Studio skończył się {STUDIO_END}, a Etiudy {DESK_END}. Żaden projekt się teraz nie otwiera; wersję roboczą każdego projektu można jeszcze zapisać jako plik katalogu."
    }
  },
  "seat6a": {
    "val": {
      "en": "Trial ended",
      "pl": "Okres próbny skończony"
    },
    "line": {
      "en": "Etiuda Studio's trial ended on {STUDIO_END}. No project opens now; each project's draft can still be saved as a catalog file.",
      "pl": "Okres próbny Etiudy Studio skończył się {STUDIO_END}. Żaden projekt się teraz nie otwiera; wersję roboczą każdego projektu można jeszcze zapisać jako plik katalogu."
    }
  }
};

const GONE_FROM_DOOR = [
  "Not now",
  "Nie teraz",
  "Sign in to Etiuda Studio",
  "Logowanie do Etiudy Studio",
  "Your Studio seat belongs to your account",
  "Without signing in you can look round, edit, check and export.",
  "A team on the relay needs a licence. Signing in brings one: a first sign-in starts the fourteen-day trial.",
  "Publishing to a team waits for sign-in.",
  "Statistics wait for sign-in.",
  "Proposals and flags from desks wait for sign-in.",
  "Everything else in this catalog works without it.",
];

const REMOVED_KEYS = [
  "Sign in to Etiuda Studio",
  "Your Studio seat belongs to your account, so it comes with you to any computer you sign in on, up to three.",
  "Without signing in you can look round, edit, check and export. Publishing to a team, statistics and taking proposals wait for it.",
  "A team on the relay needs a licence. Signing in brings one: a first sign-in starts the fourteen-day trial.",
  "Proposals and flags from desks wait for sign-in.",
  "Everything else in this catalog works without it.",
  "Trial · ends {DATE}",
  "Fourteen days of your own, started when you signed in.",
];

const OFFERED = ["microsoft", "google"];
const BASE_HOST = { version: "0.1.0", tour: { offered: true }, langs: [], signing: { keyId: "", problem: null }, signIn: OFFERED, signinDoor: false };
const DAY = 86400000;
const NOW = Date.UTC(2026, 10, 10, 12, 0);
const STUDIO_END_ISO = "2026-11-20";
const DESK_END_ISO = "2026-11-05";

function pageFor(lic, o = {}) {
  const calls = [];
  const api = Object.assign({
    signing: async () => ({ error: null, signing: { keyId: "", problem: null } }),
    licence: async () => Object.assign({ error: null }, JSON.parse(JSON.stringify(lic))),
    licenceCheck: async () => Object.assign({ error: null }, JSON.parse(JSON.stringify(lic))),
    licenceSeats: async () => ({ error: null, seats: [], counts: null }),
    seatNames: async () => ({ error: null, names: {} }),
    projects: async () => ({ root: "C:/studio", projects: [] }),
    archive: async () => ({ editions: [] }),
    exportPick: async (_t, name) => ({ file: "C:/out/" + name }),
    exportEdition: async (dir, ed, file) => ({ file, bytes: 12 }),
    csvPick: async () => ({ folder: "C:/out/csv" }),
    exportCards: async (_d, _i, folder) => ({ folder, cards: 1, files: [] }),
  }, o.api || {});
  for (const k of Object.keys(api)) {
    const fn = api[k];
    api[k] = (...a) => { calls.push([k].concat(a)); return fn(...a); };
  }
  const home = loadPage({ api, uiLang: o.lang || "en", source: o.source || APP });
  const P = home.page;
  P.S.host = Object.assign({}, BASE_HOST, o.host || {});
  P.S.lic = JSON.parse(JSON.stringify(lic));
  P.S.screen = "projects";
  P.paint();
  return { home, P, calls, get: (n) => { try { return P.__get(n); } catch { return null; } },
    main: () => home.node("#main").innerHTML, dlg: () => home.node("#dlg").innerHTML };
}

function readLangTable(langSource) {
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  vm.runInContext(langSource, sandbox, { filename: "ui/lang.js" });
  return sandbox.window.STUDIO_T;
}

async function runSuite(source, langSource, ck) {
  const leg = async (id, fn) => { try { await fn(); } catch (e) { ck(false, id + " threw: " + String(e && e.stack || e).split("\n").slice(0, 2).join(" / ")); } };

  const LIC_NONE = { licence: { status: "none", trial: null, unusable: null }, works: false, grant: null, by: null, signIn: OFFERED, provider: null };
  const LIC_WORKS = { licence: { status: "active", org: "North Quay", seats: 2, devicesEach: 3, updatesUntil: "2027-11-01", trial: null, unusable: null },
    works: true, grant: { until: "2027-11-01", paid: true }, by: "signin", provider: "microsoft", signIn: OFFERED, signinCode: "7K3MQ9TV2XRBHN4W" };
  const LIC_TRIAL_ON = { licence: { status: "trial", trial: { until: STUDIO_END_ISO, ends: Date.parse(STUDIO_END_ISO + "T00:00:00Z"), over: false, signed: true }, unusable: null },
    works: true, grant: { until: STUDIO_END_ISO, paid: false }, by: "signin", provider: "microsoft", signIn: OFFERED, signinCode: "7K3MQ9TV2XRBHN4W", now: NOW };
  const LIC_TRIAL_COVER = Object.assign({}, LIC_TRIAL_ON, { trials: { studio: STUDIO_END_ISO, desk: DESK_END_ISO, day: 4 } });
  const LIC_TRIAL_ENDED_6A = { licence: { status: "trial-ended", trial: { until: STUDIO_END_ISO, ends: Date.parse(STUDIO_END_ISO + "T00:00:00Z"), over: true, signed: true }, unusable: null },
    works: false, grant: null, by: "signin", provider: "microsoft", signIn: OFFERED, signinCode: "7K3MQ9TV2XRBHN4W" };
  const LIC_TRIAL_ENDED_6 = Object.assign({}, LIC_TRIAL_ENDED_6A, { trials: { studio: STUDIO_END_ISO, desk: DESK_END_ISO } });
  const LIC_ADMIN = { licence: { status: "active", trial: null, unusable: null }, works: false, grant: null, by: "admin", provider: "microsoft", signIn: OFFERED,
    admin: { provider: "microsoft", org: "North Quay", seats: { lead: { held: 1, of: 2 }, desk: { held: 2, of: 10 } }, waiting: { desk: 0 }, paidUntil: "2027-11-30", updatesUntil: "2027-11-30" } };
  const LIC_STOPPED_OTHER = { licence: { status: "none", trial: null, unusable: { reason: "revoked" } },
    works: false, grant: null, by: "signin", provider: "microsoft", signIn: OFFERED, signinCode: "7K3MQ9TV2XRBHN4W" };
  const LIC_NO_PROVIDER = { licence: { status: "none", trial: null, unusable: null }, works: false, grant: null, by: null, signIn: [] };

  await leg("dw1", async () => {
    const p = pageFor(LIC_NONE);
    const fn = p.get("studioDoorState");
    const ok = typeof fn === "function"
      && fn({ lic: LIC_WORKS, host: BASE_HOST }).state === "none"
      && fn({ lic: LIC_NONE, host: Object.assign({}, BASE_HOST, { signinDoor: true }) }).state === "first"
      && fn({ lic: LIC_TRIAL_ENDED_6A, host: BASE_HOST }).state === "trial-over"
      && fn({ lic: LIC_ADMIN, host: BASE_HOST }).state === "admin"
      && fn({ lic: LIC_STOPPED_OTHER, host: BASE_HOST }).state === "stopped-other"
      && fn({ lic: LIC_NO_PROVIDER, host: { signIn: [] } }).state === "none";
    const dsTrial = typeof fn === "function" ? fn({ lic: LIC_TRIAL_ON, host: BASE_HOST }) : {};
    const closedStill = pageFor(LIC_NONE, { source, host: { signinDoor: true } });
    const closedMem = closedStill.get("doorShown") && closedStill.get("doorShown")();
    ck(ok && dsTrial.day === 4 && dsTrial.studioEnd === STUDIO_END_ISO && closedMem === true,
      "dw1 studioDoorState returns the closed set and doorShown ignores first-time signinDoor memory");
  });

  await leg("dw2", async () => {
    const parts = {};
    for (const lang of ["en", "pl"]) {
      const p = pageFor(LIC_NONE, { lang, source, host: { signinDoor: true } });
      const html = p.main(), txt = plain(html);
      const h1 = plain((/<h1>([\s\S]*?)<\/h1>/.exec(html) || [])[1] || "");
      const lede = plain((/<p class="lede">([\s\S]*?)<\/p>/.exec(html) || [])[1] || "");
      p.P.S.signFail = { where: "door", provider: "microsoft", why: "unreached", said: { frame: "x", vars: {} } };
      p.P.paint();
      const failHtml = p.main();
      parts[lang] = h1 === WORDS.s1.head[lang]
        && lede === WORDS.s1.line[lang]
        && /data-signin-door/.test(html)
        && /class="si-steps"/.test(html)
        && !/data-act="door-later"|data-door-save/.test(html + failHtml)
        && GONE_FROM_DOOR.every((g) => txt.indexOf(g) < 0 && plain(failHtml).indexOf(g) < 0);
    }
    ck(parts.en && parts.pl, "dw2 S1 first opening matches copywriter EN/PL words, has steps, and has no Not now or gone lines: " + JSON.stringify(parts));
  });

  await leg("dw3", async () => {
    const parts = {};
    for (const lang of ["en", "pl"]) {
      const p = pageFor(LIC_TRIAL_ENDED_6A, { lang, source });
      const html = p.main(), txt = plain(html);
      const signDay = p.get("signDay");
      const dayStr = signDay ? signDay(STUDIO_END_ISO) : STUDIO_END_ISO;
      const wantLine = WORDS.s3.line[lang].split("{STUDIO_END}").join(dayStr);
      const h1 = plain((/<h1>([\s\S]*?)<\/h1>/.exec(html) || [])[1] || "");
      const lede = plain((/<p class="lede">([\s\S]*?)<\/p>/.exec(html) || [])[1] || "");
      const outIdx = html.indexOf("data-door-save"), actsIdx = html.indexOf("si-acts");
      const saveBtn = plain((/<button[^>]*data-door-save[^>]*>([\s\S]*?)<\/button>/.exec(html) || [])[1] || "");
      parts[lang] = h1 === WORDS.s3.head[lang]
        && lede === wantLine
        && /data-act="acct-check"/.test(html)
        && /data-act="lic-signin"[^>]*data-other/.test(html)
        && /data-act="acct-signout"/.test(html)
        && actsIdx >= 0 && outIdx > actsIdx
        && /margin-top:18px/.test(html) && /border-top:1px solid/.test(html)
        && saveBtn === WORDS.s3.btn[lang]
        && txt.indexOf(WORDS.s3.beside[lang]) >= 0
        && GONE_FROM_DOOR.every((g) => txt.indexOf(g) < 0);
    }
    ck(parts.en && parts.pl, "dw3 S3 trial-over matches EN/PL words, presses and way-out below rule: " + JSON.stringify(parts));
  });

  await leg("dw4", async () => {
    const p1 = pageFor(LIC_TRIAL_ENDED_6A, {
      source,
      api: {
        projects: async () => ({ root: "C:/studio", projects: [{ dir: "C:/studio/alpha", name: "Alpha", fileName: "alpha.ec", lastEdition: "2026-11-01-01" }] }),
      },
    });
    const html = p1.main();
    const actMatch = /<button[^>]*data-act="([^"]+)"[^>]*data-door-save/.exec(html) || /<button[^>]*data-door-save[^>]*data-act="([^"]+)"/.exec(html);
    if (actMatch && p1.P.ACTS[actMatch[1]]) await p1.P.ACTS[actMatch[1]]();
    const calledEdition = p1.calls.some((c) => c[0] === "projects")
      && p1.calls.some((c) => c[0] === "exportPick")
      && p1.calls.some((c) => c[0] === "exportEdition" && c[1] === "C:/studio/alpha" && c[2] === "2026-11-01-01");

    const p2 = pageFor(LIC_TRIAL_ENDED_6A, {
      source,
      api: {
        projects: async () => ({ root: "C:/studio", projects: [{ dir: "C:/studio/beta", name: "Beta", fileName: "beta.ec", lastEdition: "" }] }),
      },
    });
    if (actMatch && p2.P.ACTS[actMatch[1]]) await p2.P.ACTS[actMatch[1]]();
    const calledDraftCsv = p2.calls.some((c) => c[0] === "csvPick")
      && p2.calls.some((c) => c[0] === "exportCards" && c[1] === "C:/studio/beta");
    ck(!!actMatch && calledEdition && calledDraftCsv,
      "dw4 way-out button reaches open export channels on stopped Studio: " + JSON.stringify({ act: actMatch && actMatch[1], calledEdition, calledDraftCsv }));
  });

  await leg("dw5", async () => {
    const parts = {};
    for (const lang of ["en", "pl"]) {
      const p = pageFor(LIC_ADMIN, { lang, source });
      const html = p.main();
      const h1 = plain((/<h1>([\s\S]*?)<\/h1>/.exec(html) || [])[1] || "");
      const lede = plain((/<p class="lede">([\s\S]*?)<\/p>/.exec(html) || [])[1] || "");
      const acctPop = p.get("acctPopHtml") ? p.get("acctPopHtml")() : "";
      const hasOpen = /data-act="acct-open"/.test(html) && /data-act="acct-open"/.test(acctPop);
      if (p.P.ACTS["acct-open"]) p.P.ACTS["acct-open"]();
      const sxHtml = p.main();
      parts[lang] = h1 === WORDS.s5.head[lang] && lede === WORDS.s5.line[lang] && hasOpen
        && !/data-door-save/.test(html) && /data-admin-licence/.test(sxHtml);
    }
    ck(parts.en && parts.pl, "dw5 S5 admin door matches EN/PL words and Licence card stays reachable: " + JSON.stringify(parts));
  });

  await leg("dw6", async () => {
    const parts = {};
    for (const lang of ["en", "pl"]) {
      const p = pageFor(LIC_STOPPED_OTHER, { lang, source });
      const html = p.main(), txt = plain(html);
      const h1 = plain((/<h1>([\s\S]*?)<\/h1>/.exec(html) || [])[1] || "");
      parts[lang] = /data-signin-door/.test(html)
        && h1.length > 0 && h1 !== WORDS.s3.head[lang]
        && /data-door-save/.test(html)
        && /data-act="lic-signin"/.test(html)
        && GONE_FROM_DOOR.every((g) => txt.indexOf(g) < 0);
    }
    ck(parts.en && parts.pl, "dw6 stopped-other uses plain placeholder (not S3) with way out and sign-in: " + JSON.stringify(parts));
  });

  await leg("dw7", async () => {
    const seatRow = (lic, lang) => {
      const p = pageFor(lic, { lang, source });
      p.P.S.screen = "settings"; p.P.S.sx = { sec: "account", q: "" };
      const html = p.get("settingsPageHtml") ? p.get("settingsPageHtml")() : "";
      const m = /<div class="sx-row" data-row="seat"[\s\S]*?<\/div><\/div>/.exec(html);
      const day = p.get("signDay");
      return { raw: m ? m[0] : "", txt: plain(m ? m[0] : ""), day: (iso) => (day ? day(iso) : iso) };
    };
    const parts = {};
    for (const lang of ["en", "pl"]) {
      const s4 = seatRow(LIC_TRIAL_ON, lang);
      const s5 = seatRow(LIC_TRIAL_COVER, lang);
      const s6 = seatRow(LIC_TRIAL_ENDED_6, lang);
      const s6a = seatRow(LIC_TRIAL_ENDED_6A, lang);
      const paid = seatRow(LIC_WORKS, lang);
      const adm = seatRow(LIC_ADMIN, lang);
      const fill = (s, map) => Object.keys(map).reduce((a, k) => a.split(k).join(map[k]), s);
      const stEnd = s4.day(STUDIO_END_ISO), dkEnd = s4.day(DESK_END_ISO);
      const want4Val = WORDS.seat4.val[lang].split("{N}").join("4");
      const want4Line = WORDS.seat4.line[lang].split("{DATE}").join(stEnd);
      const want5Line = fill(WORDS.seat5.line[lang], { "{STUDIO_END}": stEnd, "{DESK_END}": dkEnd });
      const want6Line = fill(WORDS.seat6.line[lang], { "{STUDIO_END}": stEnd, "{DESK_END}": dkEnd });
      const want6aLine = WORDS.seat6a.line[lang].split("{STUDIO_END}").join(stEnd);
      parts[lang] = {
        r4: s4.txt.indexOf(want4Val) >= 0 && s4.txt.indexOf(want4Line) >= 0,
        r5: s5.txt.indexOf(want4Val) >= 0 && s5.txt.indexOf(want5Line) >= 0,
        r6: s6.txt.indexOf(WORDS.seat6.val[lang]) >= 0 && s6.txt.indexOf(want6Line) >= 0,
        r6a: s6a.txt.indexOf(WORDS.seat6a.val[lang]) >= 0 && s6a.txt.indexOf(want6aLine) >= 0,
        paid: lang === "en" ? (paid.txt.indexOf("Held by this account, on up to three computers.") >= 0 && paid.txt.indexOf("Etiuda Studio, lead seat") >= 0)
          : (paid.txt.indexOf("Przypisane do tego konta, na najwyżej trzech komputerach.") >= 0 && paid.txt.indexOf("Etiuda Studio, miejsce lidera") >= 0),
        admin: lang === "en" ? (adm.txt.indexOf("No seat") >= 0 && adm.txt.indexOf("This account administers the licence") >= 0)
          : (adm.txt.indexOf("Bez miejsca w licencji") >= 0 && adm.txt.indexOf("To konto administruje licencją") >= 0),
      };
    }
    const ok = ["en", "pl"].every((l) => Object.values(parts[l]).every(Boolean));
    ck(ok, "dw7 Account Seat row matches states 4, 5, 6, 6a, paid S4 and admin in EN/PL: " + JSON.stringify(parts));
  });

  await leg("dw8", async () => {
    const p = pageFor(LIC_NONE, { source });
    const hasPaidWaits = !!p.get("paidWaits") || !!p.get("paidHtml") || !!p.get("teamTrialWanted");
    p.P.S.open = { dir: "C:/studio/a", name: "A", project: { rev: 0 }, draft: { langs: [{ code: "en" }], cards: [] },
      editions: [], counts: { cards: 0, intents: 0, cats: 0 }, lint: { errors: 0, warnings: 0, rows: [] } };
    p.P.S.screen = "project"; p.P.S.section = "proposals"; p.P.S.rv = null;
    p.get("paintProposals")();
    const props = p.main();
    p.P.S.section = "stats"; p.P.S.stats = null;
    p.get("paintStats")();
    const stats = p.main();
    p.P.S.cover = "licence";
    const licDlg = p.get("licenceCoverHtml")();
    p.P.S.cover = "team"; p.P.S.teamWant = "sealed"; p.P.S.teamLic = LIC_NONE;
    const teamDlg = p.get("teamCoverHtml")();

    const T = readLangTable(langSource);
    const tKeys = new Set(T.table().plain);
    const missingPl = [];
    for (const group of Object.values(WORDS)) {
      for (const pair of Object.values(group)) {
        if (!tKeys.has(pair.en)) missingPl.push("missing:" + pair.en);
        else {
          T.force("pl");
          if (T.T(pair.en) !== pair.pl) missingPl.push("mismatch:" + pair.en);
        }
      }
    }
    const orphanKeys = REMOVED_KEYS.filter((k) => tKeys.has(k));
    const readyOk = T.ready("door") === true && T.ready("settings") === true && T.ready("licence") === true;
    ck(!hasPaidWaits && !/data-signin-paid/.test(props + stats) && teamDlg.indexOf("fourteen-day trial") < 0 && missingPl.length === 0 && orphanKeys.length === 0 && readyOk && /data-lic-signin/.test(licDlg),
      "dw8 evaluation lines out and Polish table complete/clean: " + JSON.stringify({ hasPaidWaits, missingPl, orphanKeys, readyOk }));
  });

  /* A project edited after its last edition: the way out writes that edition AND the current cards, so the edits go out too. */
  await leg("dw10", async () => {
    const CURRENT = { "C:/studio/alpha": ["card-1", "card-2-edited-after-edition"], "C:/studio/beta": ["card-b"] };
    const written = {};
    const p = pageFor(LIC_TRIAL_ENDED_6A, {
      source,
      api: {
        projects: async () => ({ root: "C:/studio", projects: [
          { dir: "C:/studio/alpha", name: "Alpha", fileName: "alpha.ec", lastEdition: "2026-11-01-01" },
          { dir: "C:/studio/beta", name: "Beta", fileName: "beta.ec", lastEdition: "" } ] }),
        exportCards: async (dir, ids, folder) => {
          if (ids === null) written[dir] = { folder, cards: CURRENT[dir].slice() };
          return { folder, cards: (CURRENT[dir] || []).length, files: [] };
        },
      },
    });
    const html = p.main();
    const actMatch = /<button[^>]*data-act="([^"]+)"[^>]*data-door-save/.exec(html) || /<button[^>]*data-door-save[^>]*data-act="([^"]+)"/.exec(html);
    if (actMatch && p.P.ACTS[actMatch[1]]) await p.P.ACTS[actMatch[1]]();
    const edition = p.calls.some((c) => c[0] === "exportEdition" && c[1] === "C:/studio/alpha" && c[2] === "2026-11-01-01");
    const alpha = written["C:/studio/alpha"], beta = written["C:/studio/beta"];
    const alphaCurrent = !!alpha && alpha.folder === "C:/out/csv" && alpha.cards.indexOf("card-2-edited-after-edition") >= 0;
    const betaCurrent = !!beta && beta.cards.indexOf("card-b") >= 0;
    ck(!!actMatch && edition && alphaCurrent && betaCurrent,
      "dw10 way out writes the current cards of a project with an edition (edited since) as well as of one without: " + JSON.stringify({ edition, alphaCurrent, betaCurrent }));
  });

  /* THE REFUSED LICENCE FILE (class B, 2026-11-22; since S-1b a stopped Studio stood at the door without the file, the reason or the way on).
     One check id per reason the licence file's verification gives (src/licence.mjs verifyLicence): the door and Account's seat row name the
     file, say the reason in plain words and say what to do. The words are the copywriter's; old sentences in the commit that moved them. */
  const LIC_FILE = "etiuda-studio-license.js";
  const REFUSED = {
    unreadable: { why: "it cannot be read as a licence", next: "A", pl: { why: "nie da się go odczytać jako licencji" } },
    signature: { why: "its signature does not match its contents", next: "A", pl: { why: "podpis nie zgadza się z treścią" } },
    revoked: { why: "the key that signed it has since been withdrawn by Etiuda", next: "A", pl: { why: "klucz, którym go podpisano, został od tego czasu wycofany przez Etiudę" } },
    delegation: { why: "the key that signed it was not allowed to sign on the day it was issued", next: "A", pl: { why: "klucz, którym go podpisano, nie mógł podpisywać w dniu jego wystawienia" } },
    delegator: { why: "Etiuda never vouched for the key that signed it", next: "A", pl: { why: "Etiuda nigdy nie poświadczyła klucza, którym go podpisano" } },
    format: { why: "it is a licence of a format this version does not read", next: "B", pl: { why: "to licencja w formacie, którego ta wersja nie czyta" } },
    nokey: { why: "this copy of Studio cannot check a licence yet", next: "C", pl: { why: "ta kopia programu nie może jeszcze sprawdzać licencji" } },
  };
  const NEXT = {
    A: { en: "Check now asks for a fresh licence, and so does signing in again. If the new one is refused too, write to contact@etiuda.dev with this message.",
         pl: "Sprawdź teraz prosi o nową licencję, podobnie jak ponowne zalogowanie. Jeśli i nowa zostanie odrzucona, wystarczy napisać na kontakt@etiuda.dev, podając ten komunikat." },
    B: { en: "Check now asks for a licence this version reads. If none comes, write to contact@etiuda.dev.",
         pl: "Sprawdź teraz prosi o licencję, którą ta wersja czyta. Jeśli żadna nie przyjdzie, wystarczy napisać na kontakt@etiuda.dev." },
    C: { en: "Nothing on this computer can mend this: it needs a newer version of Studio. If none is to hand, write to contact@etiuda.dev.",
         pl: "Na tym komputerze nie da się tego naprawić: potrzebna jest nowsza wersja Studia. Jeśli jej nie ma, wystarczy napisać na kontakt@etiuda.dev." },
  };
  const FIRST = { en: "The licence file {FILE} was refused: {WHY}.", pl: "Plik licencji {FILE} został odrzucony: {WHY}." };
  const refusedLic = (reason, file) => ({ licence: { status: "none", trial: null, unusable: file === null ? { reason } : { reason, file: LIC_FILE } },
    works: false, grant: null, by: "signin", provider: "microsoft", signIn: OFFERED, signinCode: "7K3MQ9TV2XRBHN4W" });
  for (const reason of Object.keys(REFUSED)) {
    await leg("dw11-" + reason, async () => {
      const parts = {};
      for (const lang of ["en", "pl"]) {
        const why = lang === "en" ? REFUSED[reason].why : REFUSED[reason].pl.why;
        const want = FIRST[lang].split("{FILE}").join(LIC_FILE).split("{WHY}").join(why) + " " + NEXT[REFUSED[reason].next][lang];
        const p = pageFor(refusedLic(reason), { lang, source });
        const lede = plain((/<p class="lede">([\s\S]*?)<\/p>/.exec(p.main()) || [])[1] || "");
        const q = pageFor(refusedLic(reason), { lang, source });
        q.P.S.screen = "settings"; q.P.S.sx = { sec: "account", q: "" };
        const html = q.get("settingsPageHtml") ? q.get("settingsPageHtml")() : "";
        const row = plain((/<div class="sx-row" data-row="seat"[\s\S]*?<\/div><\/div>/.exec(html) || [""])[0]);
        parts[lang] = { door: lede === want, seat: row.indexOf(want) >= 0, path: lede.indexOf("\\") < 0 && lede.indexOf("/") < 0 };
      }
      ck(["en", "pl"].every((l) => Object.values(parts[l]).every(Boolean)),
        "dw11-" + reason + " a licence file refused as '" + reason + "' is named, its reason said and the way on said, on the door and Account's seat row, EN and PL: " + JSON.stringify(parts));
    });
  }
  /* What the test architect's window leg (publish-screen 5d, e82ff02b) reads off the door, held here without a window: the heading, the file
     by its base name, "signature does not match" (or its Polish twin), no project offered, and nothing written. */
  await leg("dw11-door", async () => {
    const parts = {};
    for (const lang of ["en", "pl"]) {
      const p = pageFor(refusedLic("signature"), { lang, source,
        api: { projects: async () => ({ root: "C:/studio", projects: [{ dir: "C:/studio/alpha", name: "Alpha", fileName: "alpha.ec", lastEdition: "" }] }) } });
      const mainHtml = p.main(), at = mainHtml.indexOf("data-signin-door"), door = at < 0 ? "" : plain(mainHtml.slice(at));
      const heading = lang === "en" ? "No licence is active for this Studio." : "Żadna licencja nie jest aktywna dla tego Studia.";
      const twin = lang === "en" ? "signature does not match" : "podpis nie zgadza się";
      const writes = p.calls.filter((c) => !/^(licence|licenceSeats|signing|seatNames|projects|archive)$/.test(c[0]));
      parts[lang] = { heading: door.indexOf(heading) >= 0, file: door.indexOf(LIC_FILE) >= 0, twin: door.indexOf(twin) >= 0,
        opens: (p.main().match(/data-act="open"/g) || []).length === 0, writes: writes.length === 0 };
    }
    ck(["en", "pl"].every((l) => Object.values(parts[l]).every(Boolean)),
      "dw11-door the refused-licence door has its heading, names the file by base name, says the signature does not match, offers no project and writes nothing, EN and PL: " + JSON.stringify(parts));
  });
  await leg("dw11-nofile", async () => {
    const p = pageFor(refusedLic("signature", null), { source });
    const lede = plain((/<p class="lede">([\s\S]*?)<\/p>/.exec(p.main()) || [])[1] || "");
    ck(lede === "The licence file was refused: its signature does not match its contents. " + NEXT.A.en,
      "dw11-nofile a shell that sends no file name still says the refusal and the way on: " + JSON.stringify(lede));
  });
}

const PLANTS = [
  { mark: "s3-door-state", reds: ["dw1", "dw2", "dw3", "dw5", "dw6"],
    from: "  if (offered.length > 0 && !works) { /* plant:s3-door-state */",
    to: "  if (false) { /* plant:s3-door-state */" },
  { mark: "s3-no-later", reds: ["dw1", "dw2"],
    from: "    return studioDoorState(S).state !== \"none\"; /* plant:s3-no-later */",
    to: "    return studioDoorState(S).state !== \"none\" && !(S.host && S.host.signinDoor); /* plant:s3-no-later */" },
  { mark: "s3-door-save", reds: ["dw4"],
    from: "      /* plant:s3-door-save */",
    to: "      return; /* plant:s3-door-save */" },
  { mark: "s3-door-cards", reds: ["dw4", "dw10"],
    from: "        if (API.csvPick && API.exportCards) { /* plant:s3-door-cards */",
    to: "        if (false) { /* plant:s3-door-cards */" },
  { mark: "lr-why", reds: ["dw11-nokey"],
    from: 'const why = r === "nokey" ? T("this copy of Studio cannot check a licence yet") /* plant:lr-why */',
    to: 'const why = r === "nokey" ? T("it cannot be read as a licence") /* plant:lr-why */' },
  { mark: "lr-file", reds: ["dw11-unreadable", "dw11-signature", "dw11-revoked", "dw11-delegation", "dw11-delegator", "dw11-format", "dw11-nokey"],
    from: 'const first = file ? T("The licence file {FILE} was refused: {WHY}.", { FILE: file, WHY: why }) /* plant:lr-file */',
    to: 'const first = file ? T("The licence file was refused: {WHY}.", { WHY: why }) /* plant:lr-file */' },
  { mark: "lr-next-nokey", reds: ["dw11-nokey"],
    from: 'const next = r === "nokey" ? T("Nothing on this computer can mend this',
    to: 'const next = false ? T("Nothing on this computer can mend this' },
  { mark: "lr-next-format", reds: ["dw11-format"],
    from: '      : r === "format" ? T("Check now asks for a licence this version reads',
    to: '      : false ? T("Check now asks for a licence this version reads' },
  { mark: "s3-seat-trial", reds: ["dw7"],
    from: "    if (ds.status === \"trial\") { /* plant:s3-seat-trial */",
    to: "    if (false) { /* plant:s3-seat-trial */" },
];

async function main() {
  await runSuite(APP, LANG, check);
  const off = process.env.ETIUDA_PLANTS === "off";
  if (!off) {
    for (const p of PLANTS) {
      if (APP.split(p.from).length !== 2) {
        check(false, "dw9 plant " + p.mark + " anchor count=" + (APP.split(p.from).length - 1));
        continue;
      }
      const seen = [];
      await runSuite(APP.replace(p.from, () => p.to), LANG, (cond, line) => {
        if (!cond) seen.push(String(line).split(" ")[0]);
      });
      check(p.reds.every((r) => seen.includes(r)), "dw9 plant " + p.mark + " turns " + p.reds.join(",") + " red: " + JSON.stringify(seen));
    }
  }
  const skipped = off ? PLANTS.length : 0;
  process.stdout.write("#counts checks=" + asserted + " skipped=" + skipped + " failed=" + failed + "\n");
  process.stdout.write("studio-door-words  " + asserted + " assertion(s), " + skipped + " skipped, " + failed + " failure(s)\n");
  process.exit(failed ? 1 : 0);
}
main().catch((e) => { process.stderr.write(String(e && e.stack || e) + "\n"); process.exit(2); });
