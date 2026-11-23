/* STUDIO'S BUY, FROM WHAT THE SERVICE SAYS OF THE PERSON'S PAYMENTS (board 1020, Studio's half).
 *
 *     node tests/studio-buy-path.mjs          ETIUDA_PLANTS=off skips the plants
 *
 * gate-kind: node
 *
 * THE CRITERION (Claudius's brief of 2026-11-22, from the service's contract):
 * Studio's Buy, at the trial-over door and in Account, sends an owner who already pays for a team licence (`pays.team`) to the
 * provider's portal, or, with no portal, offers no second checkout; it never sends them to a second checkout (one subscription per
 * licence, Max 2026-11-19 03:46: "Yes, one subscription per licence."). Someone who does not pay gets Buy to the team's order page,
 * with the hidden handoff identifier as the desk does ("#code=" after the page). The order page stays unset in builds until the site
 * goes live. A held payment (`held`, with its kind) shows one line in Account, by kind. The already-pays line names where seats are
 * added only once the portal is on; until then the no-portal form.
 *
 * THE SERVICE IS STOOD IN BY ITS ANSWERS: each case is an answer of the shape the service's contract gives (pays.team with a portal
 * and without, nobody paying, each held kind), taken by Studio's own client (src/licence-client.mjs keepWho, the function every sign-in,
 * renewal and check answer passes through), then read by src/buy-path.cjs as the shell reads it, then drawn by ui/app.js on the page
 * stand-in (tests/page-stand-in.mjs). No window, no network, no service.
 *
 *   sbuy1  keepWho keeps `pays.team` (its provider, and its portal only where it is Stripe's own login link), ignores `deskOnly`, keeps
 *          the first readable `held` entry, and forgets both when an answer carries neither
 *   sbuy2  buyAddress: pays.team with a portal is the portal; pays.team with none is nowhere; nobody paying is the team's order page in
 *          Studio's language (/en/order/team/, /pl/zamowienie/zespol/ under the origin) with "#code=" and the person's own code;
 *          nowhere with the origin unset (a build), of another shape, for a person with no code, not signed in, on a managed computer,
 *          or for an account the service said is managed
 *   sbuy3  buyView tells the page a yes or no and never an address: offer, pays with the portal as a boolean, held
 *   sbuy4  the trial-over door, EN and PL: an owner who pays with a portal reads the copywriter's line and Add seats; with no portal
 *          her no-portal line and no Buy; nobody paying, Buy and the order page's line; a build with no order page, no Buy
 *   sbuy5  Account's rows, EN and PL: the same three cases on a trial; no Buy row on a paid seat the person does not pay for (a lead
 *          named on another's licence); the Buy press asks the shell by name with no address
 *   sbuy6  a held payment is one line in Account, by each of the four kinds, with its day and provider, EN and PL; none where none is held;
 *          on a managed computer the line shows and Buy does not
 *   sbuy7  the shell: studio:buy-open opens only what buyAddress answers for the kept state, ORDER_ORIGIN, the managed flag and the
 *          page's language; it stays open while Studio does not work (OPEN_STOPPED); licenceNow hands the page buyView; ORDER_ORIGIN is
 *          "" but for the lab file's origin; a sign-in, a sign-out and an administrator's card forget what was kept; the preload asks by name
 *   sbuy8  the lab file (src/signin-lab.cjs) takes the site's origin in the desk's form and refuses the whole file for a path or another
 *   sbuy10 a sign-in refused "no-licence" carries that answer's own code (and its payment facts) for Buy, and no other refusal carries one
 *   sbuy11 after that refusal, Buy is the team's order page with that code in the fragment only, as for a signed-in person; never where
 *          managed (the computer's policy or the service's mark), never in a build, never for an administrator
 *   sbuy12 the code is never kept past the next answer: a check ok or refused, another refusal, a sign-in or a sign-out drops it
 *   sbuy13 the page: Buy under that refusal at the door and in Account and under no other refusal; the press reads the view again; the
 *          managed trial-over door says the organisation's line, not the build's
 *   sbuy14 a checkout pending (a held entry of kind "pending" and no pays) keeps Buy's address: the trial-over door offers Buy with the
 *          pending line beside it; Account, while the trial runs, shows the line and no second Buy (C6, and the test architect's F3)
 *   sbuy9  plants: each deciding line, changed in a copy, turns its legs red; the real files are unchanged
 * Claude alpha's four conditions on the open (2026-11-22): the two shapes (sbuy2, and tests/no-model.mjs 5z5 holds them in the gate),
 * the fragment only and never sent by Studio (sbuy2, sbuy7), the plain sentence where Buy is hidden (sbuy4); the fourth, the test
 * architect's read of the gate's new lines, is his before the fold.
 */
import fs from "node:fs";
import crypto from "node:crypto";
import path from "node:path";
import vm from "node:vm";
import module from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import { loadPage } from "./page-stand-in.mjs";
import { clearScratch, dropScratch } from "./scratch.mjs";

const require = module.createRequire(import.meta.url);
const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const SRC = path.join(ROOT, "src");
const BUY_PATH = path.join(SRC, "buy-path.cjs");
const CLIENT_PATH = path.join(SRC, "licence-client.mjs");
const MAIN_PATH = path.join(ROOT, "shell", "main.js");
const PRELOAD_PATH = path.join(ROOT, "shell", "preload.js");
const LAB_PATH = path.join(SRC, "signin-lab.cjs");
const APP_PATH = path.join(ROOT, "ui", "app.js");
const LANG_PATH = path.join(ROOT, "ui", "lang.js");
const SCRATCH = path.join(ROOT, "scratch", "studio-buy-path");
const read = (f) => { try { return fs.readFileSync(f, "utf8"); } catch { return ""; } };

let asserted = 0, failed = 0;
function check(cond, line) {
  asserted++;
  if (cond) process.stdout.write("  ok   " + line + "\n");
  else { failed++; process.stdout.write("  FAIL " + line + "\n"); }
}

/* The copywriter's lines (2026-11-22, lines 7, 15 to 21 of her file), copied verbatim; the row titles and
   Buy are placeholders of this build, marked so in ui/app.js. */
const WORDS = {
  order: { en: "The order page opens in the browser, and the licence bought there is this account's.",
    pl: "Strona zamówienia otworzy się w przeglądarce, a kupiona tam licencja będzie należeć do tego konta." },
  portal: { en: "This account already pays for its licence, so this opens its subscription at {PROVIDER} instead of a second order; seats are added there.",
    pl: "To konto już płaci za licencję, więc ten przycisk otwiera jego subskrypcję w serwisie {PROVIDER} zamiast drugiego zamówienia; tam dodaje się miejsca." },
  addSeats: { en: "Add seats…", pl: "Dodaj miejsca…" },
  /* The trial-over door where the organisation holds the licence (words-studio-buy-2026-11-22.md, second addendum). */
  managedDoor: { en: "Your organisation holds the Etiuda licence for this account, so there is nothing to buy here. Its IT department gives the seat, and Check now looks for it again.",
    pl: "Licencję Etiudy dla tego konta ma organizacja, więc nie ma tu czego kupować. Miejsce daje jej dział IT, a przycisk Sprawdź teraz szuka go ponownie." },
  /* The copywriter's line (words-studio-buy-2026-11-22.md, addendum). Moved 2026-11-22: old the desk line adapted as a placeholder
     ("... who names this account by its email address; the naming then appears here, ..."), new hers. */
  none: { en: "Buying is not available in this build of Etiuda Studio. A lead seat comes from a licence's owner: a naming sent to this account's email address appears under Account with one Accept, and Check now looks for it again.",
    pl: "W tej wersji Etiudy Studio nie ma zakupu. Miejsce lidera daje właściciel licencji: wskazanie wysłane na adres e-mail tego konta pojawia się w części Konto z jednym przyciskiem Przyjmij, a przycisk Sprawdź teraz szuka go ponownie." },
  noPortal: { en: "This account already pays for its licence, and a licence holds one subscription, so no second order is taken.",
    pl: "To konto już płaci za licencję, a jedna licencja ma jedną subskrypcję, więc drugiego zamówienia nie ma." },
  "already-pays": { en: "A second payment from this account, of {DATE}, is held: the licence it already pays for takes more seats at {PROVIDER} instead, and the second payment is refunded.",
    pl: "Druga płatność z tego konta, z {DATE}, jest wstrzymana: licencja, za którą to konto już płaci, przyjmuje dodatkowe miejsca w serwisie {PROVIDER}, a druga płatność zostanie zwrócona." },
  managed: { en: "A payment from this account, of {DATE}, is held, because this account's organisation holds its Etiuda licence. It is refunded or attached by hand, and this line then goes by itself.",
    pl: "Płatność z tego konta, z {DATE}, jest wstrzymana, bo licencję Etiudy dla tego konta ma jego organizacja. Zostanie zwrócona albo przypisana ręcznie, a wtedy ten wiersz sam zniknie." },
  review: { en: "A payment from this account, of {DATE}, is held for a look by hand. It is refunded or attached to a licence, and this line then goes by itself.",
    pl: "Płatność z tego konta, z {DATE}, jest wstrzymana do ręcznego sprawdzenia. Zostanie zwrócona albo przypisana do licencji, a wtedy ten wiersz sam zniknie." },
  pending: { en: "{PROVIDER} has not yet confirmed this account's payment of {DATE}. The licence comes by itself once it does.",
    pl: "{PROVIDER} nie potwierdził jeszcze płatności tego konta z {DATE}. Licencja przyjdzie sama, gdy to nastąpi." },
};
const KINDS = ["already-pays", "managed", "review", "pending"];

const PORTAL = "https://billing.stripe.com/p/login/test_8wM5kE3xQ9rT";
const ORIGIN = "https://etiuda.dev";
const ORDER_EN = ORIGIN + "/en/order/team/", ORDER_PL = ORIGIN + "/pl/zamowienie/zespol/";
const CODE = "7K3MQ9TV2XRBHN4W";
/* Another person's code, the one a refusal "no-licence" carries. */
const CODE2 = "9QX2RT8VW4ZA7K3M";
/* Noon UTC: the same day here, the next at UTC+14, so the held line's local day can be told from another zone's (buy-held-local). */
const AT = Date.UTC(2026, 10, 21, 12, 0);
/* What the service answers, as its contract gives it (pay.mjs buyerFacts), each case beside an ok answer. */
const ANS = {
  portal: { ok: true, pays: { team: { provider: "stripe", portal: PORTAL } } },
  noPortal: { ok: true, pays: { team: { provider: "stripe" } } },
  deskOnly: { ok: true, pays: { deskOnly: { provider: "stripe", portal: PORTAL } } },
  none: { ok: true },
  badPortal: { ok: true, pays: { team: { provider: "stripe", portal: "https://evil.example/p/login/test_8wM5kE3xQ9rT" } } },
  held: (kind, provider) => ({ ok: true, held: [{ kind: "nonsense", provider: "stripe", at: AT + 1 }, { kind, provider: provider || "stripe", at: AT }] }),
};

/* ---- loading a module from text, so a plant can change a copy ---------------------------------------------------------------- */
function cjsFrom(text, file) {
  const m = { exports: {} };
  vm.runInThisContext("(function (module, exports, require, __filename, __dirname) {" + text + "\n})", { filename: file })(m, m.exports, module.createRequire(file), file, path.dirname(file));
  return m.exports;
}
/* src/licence-client.mjs from text: its relative imports pointed at the real files, and its buy-path import at the copy `buyFile`. */
let clientSeq = 0;
async function clientFrom(text, buyFile) {
  fs.mkdirSync(SCRATCH, { recursive: true });
  const abs = (rel) => pathToFileURL(path.join(SRC, rel)).href;
  let t = text.replace(/from "\.\/([^"]+)"/g, (_m, rel) => 'from "' + (rel === "buy-path.cjs" && buyFile ? pathToFileURL(buyFile).href : abs(rel)) + '"')
    .replace(/from "\.\.\/([^"]+)"/g, (_m, rel) => 'from "' + pathToFileURL(path.join(ROOT, rel)).href + '"');
  const at = path.join(SCRATCH, "licence-client-" + process.pid + "-" + (++clientSeq) + ".mjs");
  fs.writeFileSync(at, t);
  return import(pathToFileURL(at).href);
}
function buyFileFrom(text) {
  fs.mkdirSync(SCRATCH, { recursive: true });
  const at = path.join(SCRATCH, "buy-path-" + process.pid + "-" + (++clientSeq) + ".cjs");
  fs.writeFileSync(at, text);
  return at;
}

const plain = (h) => String(h || "").replace(/<svg[\s\S]*?<\/svg>/g, " ").replace(/<[^>]*>/g, " ")
  .replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">")
  .replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();

const OFFERED = ["microsoft", "google"];
const BASE_HOST = { version: "0.1.0", tour: { offered: true }, langs: [], signing: { keyId: "", problem: null }, signIn: OFFERED, signinDoor: false };
const STUDIO_END_ISO = "2026-11-20";
const LIC_TRIAL_ENDED = { licence: { status: "trial-ended", trial: { until: STUDIO_END_ISO, ends: Date.parse(STUDIO_END_ISO + "T00:00:00Z"), over: true, signed: true }, unusable: null },
  works: false, grant: null, by: "signin", provider: "microsoft", signIn: OFFERED };
const LIC_TRIAL_ON = { licence: { status: "trial", trial: { until: "2026-12-01", ends: Date.parse("2026-12-01T00:00:00Z"), over: false, signed: true }, unusable: null },
  works: true, grant: { until: "2026-12-01", paid: false }, by: "signin", provider: "microsoft", signIn: OFFERED, trials: { studio: "2026-12-01", day: 4 } };
/* Signed in as nobody, sign-in offered: the first door. */
const LIC_OUT = { licence: { status: "none", trial: null, unusable: null }, works: false, grant: null, by: null, provider: null, signIn: OFFERED };
const LIC_PAID = { licence: { status: "active", org: "North Quay", seats: 2, devicesEach: 3, updatesUntil: "2027-11-01", trial: null, unusable: null },
  works: true, grant: { until: "2027-11-01", paid: true }, by: "signin", provider: "microsoft", signIn: OFFERED };

function pageFor(lic, buy, o = {}) {
  const calls = [];
  const api = {
    signing: async () => ({ error: null, signing: { keyId: "", problem: null } }),
    licence: async () => Object.assign({ error: null }, JSON.parse(JSON.stringify(lic))),
    licenceSeats: async () => ({ error: null, seats: [], counts: null }),
    projects: async () => ({ root: "C:/studio", projects: [] }),
    archive: async () => ({ editions: [] }),
    buyOpen: (...a) => { calls.push(["buyOpen"].concat(a)); },
  };
  Object.assign(api, o.api || {});
  const home = loadPage({ api, uiLang: o.lang || "en", source: o.source || APP });
  const P = home.page;
  P.S.host = Object.assign({}, BASE_HOST);
  P.S.lic = Object.assign(JSON.parse(JSON.stringify(lic)), buy === undefined ? {} : { buy: JSON.parse(JSON.stringify(buy)) });
  P.S.screen = "projects";
  P.paint();
  const get = (n) => { try { return P.__get(n); } catch { return null; } };
  const door = () => { const f = get("doorHtml"); return f ? f() : ""; };
  const rows = () => { const f = get("acctRowsHtml"); return f ? f().join("") : ""; };
  return { P, calls, get, door, rows };
}
const VIEW = {
  portal: { offer: true, pays: { provider: "stripe", portal: true }, held: null },
  noPortal: { offer: false, pays: { provider: "stripe", portal: false }, held: null },
  order: { offer: true, pays: null, held: null },
  build: { offer: false, pays: null, held: null },
  held: (kind, provider) => ({ offer: false, pays: null, held: { kind, provider: provider || "stripe", at: AT } }),
};
const sub = (s, v) => Object.keys(v).reduce((a, k) => a.split("{" + k + "}").join(v[k]), s);
/* The held payment's day on this computer's clock, as the desk draws it: "21 Nov 2026", "21 lis 2026". Moved 2026-11-22 (the test
   architect's D5): old the UTC day, new the local day. */
const dayOf = (lang) => new Intl.DateTimeFormat(lang === "pl" ? "pl" : "en-GB", { day: "numeric", month: "short", year: "numeric" }).format(AT);
/* The <div data-row="k"> row's own markup, up to the next row. */
const rowOf = (html, k) => { const i = html.indexOf('data-row="' + k + '"'); if (i < 0) return ""; const j = html.indexOf('<div class="sx-row', i + 1); return html.slice(i, j < 0 ? undefined : j); };
const buyBtn = (html) => /data-act="buy-open"/.test(html);

async function runSuite(o, ck) {
  const leg = async (id, fn) => { try { await fn(); } catch (e) { ck(false, id + " threw: " + String(e && e.stack || e).split("\n").slice(0, 2).join(" / ")); } };
  const B = o.buy;
  const C = o.client;

  await leg("sbuy1", async () => {
    const keep = (a, st) => C.keepWho(Object.assign({ by: "signin" }, st || {}), a).signinBuy;
    const portal = keep(ANS.portal), none = keep(ANS.none, { signinBuy: { pays: { provider: "stripe" } } });
    const noPortal = keep(ANS.noPortal), desk = keep(ANS.deskOnly), bad = keep(ANS.badPortal);
    const held = keep(ANS.held("review", "paddle"));
    /* The service's managed mark (the test architect's finding C): kept from an answer carrying it, cause or none, and forgotten by one
       that does not. */
    const marked = C.keepWho({ by: "signin" }, { ok: true, managed: true }).signinManaged;
    const unmarked = C.keepWho({ by: "signin", signinManaged: true }, { ok: true }).signinManaged;
    const ok = JSON.stringify(portal) === JSON.stringify({ pays: { provider: "stripe", portal: PORTAL } })
      && JSON.stringify(noPortal) === JSON.stringify({ pays: { provider: "stripe" } })
      && desk === undefined && none === undefined
      && JSON.stringify(bad) === JSON.stringify({ pays: { provider: "stripe" } })
      && JSON.stringify(held) === JSON.stringify({ held: { kind: "review", provider: "paddle", at: AT } })
      && marked === true && unmarked === undefined;
    ck(ok, "sbuy1 keepWho keeps pays.team (a portal only of Stripe's login shape), not deskOnly, the first readable held, the service's managed mark, and forgets each: "
      + JSON.stringify({ portal, noPortal, desk, none, bad, held, marked, unmarked }));
  });

  await leg("sbuy2", async () => {
    const st = (buy, extra) => Object.assign({ by: "signin", signinCode: CODE }, buy ? { signinBuy: buy } : {}, extra || {});
    const got = {
      portal: B.buyAddress(st({ pays: { provider: "stripe", portal: PORTAL } }), ORIGIN, false, "en"),
      noPortal: B.buyAddress(st({ pays: { provider: "stripe" } }), ORIGIN, false, "en"),
      order: B.buyAddress(st(null), ORIGIN, false, "en"),
      orderPl: B.buyAddress(st(null), ORIGIN, false, "pl"),
      heldOnly: B.buyAddress(st({ held: { kind: "pending", provider: "stripe", at: AT } }), ORIGIN, false, "en"),
      build: B.buyAddress(st(null), "", false, "en"),
      shape: B.buyAddress(st(null), "https://etiuda.dev.example.com", false, "en"),
      noCode: B.buyAddress(st(null, { signinCode: undefined }), ORIGIN, false, "en"),
      out: B.buyAddress(st(null, { by: "key" }), ORIGIN, false, "en"),
      managed: B.buyAddress(st({ pays: { provider: "stripe", portal: PORTAL } }), ORIGIN, true, "en"),
      managedOrder: B.buyAddress(st(null), ORIGIN, true, "en"),
      /* The test architect's finding C: an account the service said is managed, on a computer with no policy, is offered no Buy, by its
         kept mark or by its no-role refusal; as the desk refuses on licenceManaged. */
      serviceManaged: B.buyAddress(st(null, { signinManaged: true }), ORIGIN, false, "en"),
      serviceManagedPays: B.buyAddress(st({ pays: { provider: "stripe", portal: PORTAL } }, { signinManaged: true }), ORIGIN, false, "en"),
      noRole: B.buyAddress(st(null, { signinNoRole: true, signinCause: "assigned" }), ORIGIN, false, "en"),
      /* Claude alpha's condition 1: a kept state written by hand, its portal of another host or scheme, opens nothing; nor does an order
         origin with a path (the desk's form is the origin alone), a query, or http. */
      otherHost: B.buyAddress(st({ pays: { provider: "stripe", portal: "https://billing.stripe.com.example.net/p/login/test_8wM5kE3xQ9rT" } }), ORIGIN, false, "en"),
      httpPortal: B.buyAddress(st({ pays: { provider: "stripe", portal: "http://billing.stripe.com/p/login/test_8wM5kE3xQ9rT" } }), ORIGIN, false, "en"),
      originPath: B.buyAddress(st(null), ORIGIN + "/en/order/team/", false, "en"),
      originQuery: B.buyAddress(st(null), ORIGIN + "?x=1", false, "en"),
      originHttp: B.buyAddress(st(null), "http://etiuda.dev", false, "en"),
    };
    /* Condition 2: the identifier in the fragment only, never in a query string. */
    const frag = [got.order, got.orderPl].every((a) => a.indexOf("?") < 0 && a.split("#")[0].indexOf(CODE) < 0 && a.split("#")[1] === "code=" + CODE);
    const ok = got.portal === PORTAL && got.noPortal === "" && got.order === ORDER_EN + "#code=" + CODE && got.orderPl === ORDER_PL + "#code=" + CODE
      /* Moved twice on 2026-11-22: first to nowhere (Grok alpha's C6), then back to the order page (the test architect's F3, Claude alpha's
         rule: a pending checkout never hides Buy from a person whose trial is over; sbuy14). */
      && got.heldOnly === ORDER_EN + "#code=" + CODE
      && got.build === "" && got.shape === "" && got.noCode === "" && got.out === "" && got.managed === "" && got.managedOrder === ""
      && got.serviceManaged === "" && got.serviceManagedPays === "" && got.noRole === ""
      && got.otherHost === "" && got.httpPortal === "" && got.originPath === "" && got.originQuery === "" && got.originHttp === "" && frag;
    ck(ok, "sbuy2 buyAddress: portal, nowhere with no portal, the team's order page in Studio's language with #code= (the fragment only) for a non-payer, nowhere in a build, for another shape or host, no code, signed out, a managed computer or an account the service said is managed: " + JSON.stringify(got));
  });

  await leg("sbuy3", async () => {
    const st = (buy, extra) => Object.assign({ by: "signin", signinCode: CODE }, buy ? { signinBuy: buy } : {}, extra || {});
    const v1 = B.buyView(st({ pays: { provider: "stripe", portal: PORTAL }, held: { kind: "already-pays", provider: "stripe", at: AT } }), ORIGIN, false);
    const v2 = B.buyView(st(null), ORIGIN, false), v3 = B.buyView(st({ pays: { provider: "paddle" } }), "", false);
    const v4 = B.buyView(st({ pays: { provider: "stripe", portal: PORTAL }, held: { kind: "review", provider: "stripe", at: AT } }), ORIGIN, true);
    const v5 = B.buyView(st({ pays: { provider: "stripe", portal: PORTAL }, held: { kind: "managed", provider: "stripe", at: AT } }, { signinManaged: true }), ORIGIN, false);
    const ok = JSON.stringify(v1) === JSON.stringify({ offer: true, pays: { provider: "stripe", portal: true }, held: { kind: "already-pays", provider: "stripe", at: AT } })
      && JSON.stringify(v2) === JSON.stringify({ offer: true, pays: null, held: null })
      && JSON.stringify(v3) === JSON.stringify({ offer: false, pays: { provider: "paddle", portal: false }, held: null })
      /* Moved 2026-11-22 (Claudius): old "nothing on a managed computer"; new "no Buy and no pays on a managed computer, the held entry
         still told", as the desk tells it. */
      /* Moved again (the managed door's line): the view now also says `barred`, so the door can say the organisation holds the licence. */
      && JSON.stringify(v4) === JSON.stringify({ offer: false, pays: null, held: { kind: "review", provider: "stripe", at: AT }, barred: true })
      && JSON.stringify(v5) === JSON.stringify({ offer: false, pays: null, held: { kind: "managed", provider: "stripe", at: AT }, barred: true })
      && JSON.stringify([v1, v2, v3]).indexOf("https:") < 0;
    ck(ok, "sbuy3 buyView: offer, pays with the portal as a yes or no, held, no Buy and no pays but the held entry on a managed computer or for an account the service said is managed, and no address: " + JSON.stringify({ v1, v2, v3, v4, v5 }));
  });

  await leg("sbuy4", async () => {
    const parts = {};
    for (const lang of ["en", "pl"]) {
      const portal = pageFor(LIC_TRIAL_ENDED, VIEW.portal, { lang, source: o.app }).door();
      const noPortal = pageFor(LIC_TRIAL_ENDED, VIEW.noPortal, { lang, source: o.app }).door();
      const order = pageFor(LIC_TRIAL_ENDED, VIEW.order, { lang, source: o.app }).door();
      const build = pageFor(LIC_TRIAL_ENDED, VIEW.build, { lang, source: o.app }).door();
      const bare = pageFor(LIC_TRIAL_ENDED, undefined, { lang, source: o.app }).door();
      const btnText = (h) => plain((/<button[^>]*data-act="buy-open"[^>]*>([\s\S]*?)<\/button>/.exec(h) || [])[1] || "");
      parts[lang] = {
        portal: /data-signin-door/.test(portal) && plain(portal).indexOf(sub(WORDS.portal[lang], { PROVIDER: "Stripe" })) >= 0 && btnText(portal) === WORDS.addSeats[lang],
        noPortal: plain(noPortal).indexOf(WORDS.noPortal[lang]) >= 0 && !buyBtn(noPortal) && plain(noPortal).indexOf(WORDS.order[lang]) < 0,
        order: plain(order).indexOf(WORDS.order[lang]) >= 0 && buyBtn(order) && btnText(order) !== WORDS.addSeats[lang],
        build: !buyBtn(build) && plain(build).indexOf(WORDS.order[lang]) < 0 && !buyBtn(bare),
        /* Claude alpha's condition 3: where the order page is unset, Buy hidden and one plain sentence in its place, as on the desk. */
        none: plain(build).indexOf(WORDS.none[lang]) >= 0 && plain(order).indexOf(WORDS.none[lang]) < 0 && plain(portal).indexOf(WORDS.none[lang]) < 0,
      };
    }
    const ok = Object.values(parts).every((p) => Object.values(p).every(Boolean));
    ck(ok, "sbuy4 the trial-over door: Add seats to the portal, the no-portal line and no Buy, Buy to the order page, no Buy in a build and the plain sentence in its place, EN and PL: " + JSON.stringify(parts));
  });

  await leg("sbuy5", async () => {
    const parts = {};
    for (const lang of ["en", "pl"]) {
      const portal = rowOf(pageFor(LIC_TRIAL_ON, VIEW.portal, { lang, source: o.app }).rows(), "buy");
      const noPortal = rowOf(pageFor(LIC_TRIAL_ON, VIEW.noPortal, { lang, source: o.app }).rows(), "buy");
      const orderP = pageFor(LIC_TRIAL_ON, VIEW.order, { lang, source: o.app });
      const order = rowOf(orderP.rows(), "buy");
      const build = rowOf(pageFor(LIC_TRIAL_ON, VIEW.build, { lang, source: o.app }).rows(), "buy");
      const namedLead = rowOf(pageFor(LIC_PAID, VIEW.order, { lang, source: o.app }).rows(), "buy");
      const owner = rowOf(pageFor(LIC_PAID, VIEW.portal, { lang, source: o.app }).rows(), "buy");
      let asked = null;
      if (lang === "en" && orderP.P.ACTS["buy-open"]) { orderP.P.ACTS["buy-open"](); asked = orderP.calls.filter((c) => c[0] === "buyOpen"); }
      parts[lang] = {
        portal: plain(portal).indexOf(sub(WORDS.portal[lang], { PROVIDER: "Stripe" })) >= 0 && buyBtn(portal) && plain(portal).indexOf(WORDS.addSeats[lang]) >= 0,
        noPortal: !!noPortal && plain(noPortal).indexOf(WORDS.noPortal[lang]) >= 0 && !buyBtn(noPortal),
        order: plain(order).indexOf(WORDS.order[lang]) >= 0 && buyBtn(order),
        build: build === "",
        namedLead: namedLead === "",
        owner: buyBtn(owner),
        asked: lang === "pl" || (!!asked && asked.length === 1 && asked[0].length === 1),
      };
    }
    const ok = Object.values(parts).every((p) => Object.values(p).every(Boolean));
    ck(ok, "sbuy5 Account's Buy row: Add seats, the no-portal line, Buy to the order page, none in a build or on a seat not paid for, and the press names no address: " + JSON.stringify(parts));
  });

  await leg("sbuy6", async () => {
    const parts = {};
    for (const lang of ["en", "pl"]) {
      for (const kind of KINDS) {
        const prov = kind === "review" ? "paddle" : "stripe", name = prov === "paddle" ? "Paddle" : "Stripe";
        const html = rowOf(pageFor(LIC_TRIAL_ON, VIEW.held(kind, prov), { lang, source: o.app }).rows(), "payment");
        parts[lang + ":" + kind] = !!html && plain(html).indexOf(sub(WORDS[kind][lang], { DATE: dayOf(lang), PROVIDER: name })) >= 0
          && KINDS.filter((k) => k !== kind).every((k) => plain(html).indexOf(sub(WORDS[k][lang], { DATE: dayOf(lang), PROVIDER: name })) < 0);
      }
      parts[lang + ":none"] = rowOf(pageFor(LIC_TRIAL_ON, VIEW.order, { lang, source: o.app }).rows(), "payment") === "";
      /* A managed computer: the held line shows, as on the desk; Buy does not, whatever the view says. */
      const managedRows = pageFor(Object.assign({}, LIC_TRIAL_ON, { policy: { any: true, managed: true, shared: false } }),
        Object.assign(VIEW.held("managed"), { offer: true }), { lang, source: o.app }).rows();
      parts[lang + ":managed"] = plain(rowOf(managedRows, "payment")).indexOf(sub(WORDS.managed[lang], { DATE: dayOf(lang), PROVIDER: "Stripe" })) >= 0
        && rowOf(managedRows, "buy") === "";
    }
    ck(Object.values(parts).every(Boolean), "sbuy6 one held line in Account by each kind with its day and provider, none where nothing is held, shown on a managed computer with no Buy, EN and PL: " + JSON.stringify(parts));
  });

  await leg("sbuy7", async () => {
    const m = o.main, pre = o.preload;
    const facts = {
      lab: /^let ORDER_ORIGIN = "";$/m.test(m) && /\nif \(SIGNIN_LAB && SIGNIN_LAB\.order\) ORDER_ORIGIN = SIGNIN_LAB\.order;/.test(m) && (m.match(/\bORDER_ORIGIN = /g) || []).length === 2,
      open: /hear\("studio:buy-open", \(\) => \{ buyOpen\(\); \}\);/.test(m)
        && /const buy = BUY\.buyAddress\(readServiceState\(\), ORDER_ORIGIN, managedHere\(\), recoveryLang\(\)\);\s*\n\s*if \(buy\) shell\.openExternal\(buy\);/.test(m)
        && (m.match(/openExternal\(buy\)/g) || []).length === 1,
      stopped: /const OPEN_STOPPED = new Set\(\[[\s\S]*?"studio:buy-open"[\s\S]*?\]\);/.test(m.slice(0, m.indexOf("const CLOSED_STOPPED"))),
      view: /\n {4}buy: BUY\.buyView\(st, ORDER_ORIGIN, managedHere\(\)\),/.test(m),
      forget: /const SIGNED_IN_STATE = \[[^\]]*"signinBuy", "signinManaged"/.test(m) && /\n {2}delete next\.signinBuy;\n {2}delete next\.signinManaged;\n/.test(m),
      preload: /buyOpen: \(\) => ipcRenderer\.send\("studio:buy-open"\)/.test(pre),
      /* Condition 2: the address goes to the system's browser alone: buyAddress is called once in the shell, and src/buy-path.cjs
         requires nothing, so it reaches no door of its own. */
      sentNowhere: (m.match(/BUY\.buyAddress\(/g) || []).length === 1 && !/\brequire\s*\(|\bimport\b|\bfetch\s*\(/.test(o.buyText.replace(/\/\*[\s\S]*?\*\//g, "")),
    };
    ck(Object.values(facts).every(Boolean), "sbuy7 the shell opens only buyAddress's answer in the page's language, by name, while Studio does not work too; the page gets buyView; ORDER_ORIGIN only from the lab; kept facts forgotten: " + JSON.stringify(facts));
  });

  await leg("sbuy8", async () => {
    const L = o.lab;
    const base = { service: "http://127.0.0.1:8787/licence/v1/" };
    const take = (order) => L.labOf(JSON.stringify(Object.assign({}, base, order === undefined ? {} : { order })));
    /* Moved 2026-11-22 (the test architect's D3): old "takes an order page of the desk's shape" (a whole page); new "takes the site's
       origin, the desk's form since engine 7aa73820, and refuses a page path". */
    const got = { none: take(undefined).order, good: take(ORIGIN).order, sub: take("https://www.etiuda.dev").order,
      path: !!take(ORIGIN + "/en/order/team/").refused, other: !!take("https://example.com").refused, query: !!take(ORIGIN + "?x=1").refused,
      http: !!take("http://etiuda.dev").refused,
      same: (/const BUY_ORDER_ORIGIN = (\/.*\/);/.exec(o.labText) || [])[1] === String(o.buy.ORDER_ORIGIN) };
    ck(got.none === null && got.good === ORIGIN && got.sub === "https://www.etiuda.dev" && got.path && got.other && got.query && got.http && got.same,
      "sbuy8 the lab file takes the site's origin in the desk's form (buy-path's, written out alike), null where none, and refuses the whole file for a path or another: " + JSON.stringify(got));
  });

  /* ---- Claudius's ruling of 2026-11-22 on the test architect's finding 2: Buy after a sign-in refused "no-licence" ---------------- */
  await leg("sbuy10", async () => {
    const { publicKey, privateKey } = crypto.generateKeyPairSync("ed25519");
    const open = { public: Buffer.from(publicKey.export({ format: "jwk" }).x, "base64url").toString("hex"), privateKey };
    const ask = (status, body) => async () => ({ status, bytes: Buffer.from(JSON.stringify(body), "utf8") });
    const NL = { ok: false, reason: "no-licence", me: CODE2, pays: { team: { provider: "stripe" } }, held: [{ kind: "review", provider: "stripe", at: AT }] };
    const r1 = await C.signIn(ask(403, NL), open, "microsoft", "id.token.x", Date.now(), "");
    const r2 = await C.signIn(ask(403, { ok: false, reason: "full", me: CODE2 }), open, "microsoft", "id.token.x", Date.now(), "");
    const r3 = await C.signIn(ask(403, Object.assign({}, NL, { managed: true })), open, "microsoft", "id.token.x", Date.now(), "");
    const k1 = B.noLicenceKept(r1), k2 = B.noLicenceKept(r2), k3 = B.noLicenceKept(r3);
    const k4 = B.noLicenceKept({ ok: false, reason: "signin-no-licence", me: "not a code" });
    const k5 = B.noLicenceKept({ ok: false, reason: "signin-full", me: CODE2 });
    const ok = r1.reason === "signin-no-licence" && r1.me === CODE2 && r2.me === undefined
      && JSON.stringify(k1) === JSON.stringify({ code: CODE2, buy: { pays: { provider: "stripe" }, held: { kind: "review", provider: "stripe", at: AT } } })
      && k2 === null && k4 === null && k5 === null && !!k3 && k3.managed === true && k3.code === CODE2;
    ck(ok, "sbuy10 a sign-in refused no-licence carries that answer's code (and its payment facts) for Buy, and no other refusal does: " + JSON.stringify({ r1me: r1.me, r2me: r2.me, k1, k2, k3, k4, k5 }));
  });

  await leg("sbuy11", async () => {
    const nl = (extra) => Object.assign({ code: CODE2 }, extra || {});
    const got = {
      out: B.buyAddress({ signinNoLicence: nl() }, ORIGIN, false, "en"),
      outPl: B.buyAddress({ signinNoLicence: nl() }, ORIGIN, false, "pl"),
      before: B.buyAddress({ by: "key", signinNoLicence: nl() }, ORIGIN, false, "en"),
      staleCode: B.buyAddress({ signinCode: CODE, signinNoLicence: nl() }, ORIGIN, false, "en"),
      signedIn: B.buyAddress({ by: "signin", signinCode: CODE, signinNoLicence: nl() }, ORIGIN, false, "en"),
      admin: B.buyAddress({ by: "admin", signinNoLicence: nl() }, ORIGIN, false, "en"),
      marked: B.buyAddress({ signinNoLicence: nl({ managed: true }) }, ORIGIN, false, "en"),
      computer: B.buyAddress({ signinNoLicence: nl() }, ORIGIN, true, "en"),
      build: B.buyAddress({ signinNoLicence: nl() }, "", false, "en"),
      pays: B.buyAddress({ signinNoLicence: nl({ buy: { pays: { provider: "stripe", portal: PORTAL } } }) }, ORIGIN, false, "en"),
      none: B.buyAddress({}, ORIGIN, false, "en"),
    };
    const v1 = B.buyView({ signinNoLicence: nl() }, ORIGIN, false), v2 = B.buyView({ signinNoLicence: nl({ managed: true }) }, ORIGIN, false);
    const frag = [got.out, got.outPl].every((a) => a.indexOf("?") < 0 && a.split("#")[0].indexOf(CODE2) < 0 && a.split("#")[1] === "code=" + CODE2);
    const ok = got.out === ORDER_EN + "#code=" + CODE2 && got.outPl === ORDER_PL + "#code=" + CODE2 && got.before === got.out && got.staleCode === got.out
      && got.signedIn === ORDER_EN + "#code=" + CODE && got.admin === "" && got.marked === "" && got.computer === "" && got.build === ""
      && got.pays === PORTAL && got.none === "" && frag
      && JSON.stringify(v1) === JSON.stringify({ offer: true, pays: null, held: null, refused: true })
      && JSON.stringify(v2) === JSON.stringify({ offer: false, pays: null, held: null, barred: true });
    ck(ok, "sbuy11 after a refusal no-licence, Buy is the team's order page with that refusal's code in the fragment only; not managed, not in a build, not for an administrator; a signed-in person's own code wins: " + JSON.stringify({ got, v1, v2 }));
  });

  await leg("sbuy12", async () => {
    const after = async (st, a) => (await C.afterCheck(null, null, a, st, null, Date.now)).state;
    const s1 = await after({ by: "key", signinNoLicence: { code: CODE2 } }, { ok: true });
    const s2 = await after({ by: "key", signinNoLicence: { code: CODE2 } }, { ok: false, reason: "refused" });
    const s3 = await after({ by: "signin", signinCode: CODE, signinNoLicence: { code: CODE2 } }, { ok: true });
    const m = o.main;
    const facts = {
      check: [s1, s2, s3].every((s) => s && s.signinNoLicence === undefined) && s3.by === "signin",
      refusal: /if \(!a \|\| a\.ok !== true\) \{\n {4}if \(way === "signin"\) keepRefused\(a\);/.test(m)
        && /const st = readServiceState\(\), kept = BUY\.noLicenceKept\(a\);/.test(m)
        && /if \(kept\) next\.signinNoLicence = kept; else delete next\.signinNoLicence;/.test(m),
      success: /\n {2}delete next\.signinNoLicence;\n {2}if \(way === "signin"\) \{/.test(m),
      signout: /const SIGNED_IN_STATE = \[[^\]]*"signinNoLicence"/.test(m),
    };
    ck(Object.values(facts).every(Boolean), "sbuy12 the refusal's code is never kept past the next answer: a check ok or refused drops it, another refusal drops it, a sign-in and a sign-out drop it: " + JSON.stringify(facts));
  });

  await leg("sbuy13", async () => {
    const parts = {};
    const REFUSED = { offer: true, pays: null, held: null, refused: true };
    const fail = (why, where) => ({ where: where || "door", provider: "microsoft", why, said: { frame: "x", vars: {}, why } });
    for (const lang of ["en", "pl"]) {
      const at = (view, why, where) => {
        const p = pageFor(LIC_OUT, view, { lang, source: o.app });
        p.P.S.signFail = fail(why, where);
        p.P.paint();
        return where === "account" ? (p.get("acctTopHtml") ? p.get("acctTopHtml")() : "") : p.door();
      };
      const door = at(REFUSED, "signin-no-licence"), acct = at(REFUSED, "signin-no-licence", "account");
      parts[lang] = {
        door: buyBtn(door) && plain(door).indexOf(WORDS.order[lang]) >= 0,
        account: buyBtn(acct),
        otherRefusals: ["signin-full", "signin-org", "signin-no-role", "unreached"].every((w) => !buyBtn(at(REFUSED, w)) && !buyBtn(at(REFUSED, w, "account"))),
        notRefusedView: !buyBtn(at({ offer: true, pays: null, held: null }, "signin-no-licence")),
        build: !buyBtn(at({ offer: false, pays: null, held: null, refused: true }, "signin-no-licence")),
        managedDoor: (() => {
          const svc = pageFor(LIC_TRIAL_ENDED, { offer: false, pays: null, held: null, barred: true }, { lang, source: o.app }).door();
          const pc = pageFor(Object.assign({}, LIC_TRIAL_ENDED, { policy: { any: true, managed: true, shared: false } }), VIEW.build, { lang, source: o.app }).door();
          return [svc, pc].every((h) => plain(h).indexOf(WORDS.managedDoor[lang]) >= 0 && plain(h).indexOf(WORDS.none[lang]) < 0 && !buyBtn(h));
        })(),
      };
    }
    /* The press: a refusal no-licence reads the shell's view again, so Buy stands under the fact. */
    let reloaded = false;
    const pr = pageFor(LIC_OUT, undefined, { source: o.app, api: {
      licenceSignIn: async () => ({ error: "refused", said: { frame: "x", vars: {}, why: "signin-no-licence" } }),
      licence: async () => { reloaded = true; return Object.assign({ error: null }, JSON.parse(JSON.stringify(LIC_OUT)), { buy: REFUSED }); } } });
    reloaded = false;
    if (pr.P.ACTS["lic-signin"]) await pr.P.ACTS["lic-signin"]({ getAttribute: () => "microsoft" });
    const pressed = reloaded && buyBtn(pr.door());
    ck(Object.values(parts).every((p) => Object.values(p).every(Boolean)) && pressed,
      "sbuy13 under a refusal no-licence Buy stands at the door and in Account, under no other refusal; the managed door says the organisation's line, not the build's; the press reads the view again: "
      + JSON.stringify({ parts, pressed }));
  });
  /* A CHECKOUT ON ITS WAY (Grok alpha's review of 2026-11-22, C6, on Claude alpha's rule as Claudius relayed it: "a checkout whose first
     payment never arrives never hides Buy from a person whose trial is over"). Moved 2026-11-22 (the test architect's read of e01e2b37, F3):
     old "a pending entry hides Buy and the door shows its held line in Buy's place"; new: Buy keeps its address, the trial-over door
     offers Buy with the pending line beside it, and Account, while the trial still runs, shows the pending line and no second Buy. */
  await leg("sbuy14", async () => {
    const st = (buy, extra) => Object.assign({ by: "signin", signinCode: CODE }, buy ? { signinBuy: buy } : {}, extra || {});
    const pending = { kind: "pending", provider: "stripe", at: AT };
    const addr = {
      pending: B.buyAddress(st({ held: pending }), ORIGIN, false, "en"),
      pendingPays: B.buyAddress(st({ pays: { provider: "stripe", portal: PORTAL }, held: pending }), ORIGIN, false, "en"),
      refused: B.buyAddress({ by: null, signinNoLicence: { code: CODE2, buy: { held: pending } } }, ORIGIN, false, "en"),
    };
    const view = B.buyView(st({ held: pending }), ORIGIN, false);
    const PENDING_VIEW = { offer: true, pays: null, held: pending };
    const parts = {};
    for (const lang of ["en", "pl"]) {
      const line = sub(WORDS.pending[lang], { DATE: dayOf(lang), PROVIDER: "Stripe" });
      const door = pageFor(LIC_TRIAL_ENDED, PENDING_VIEW, { lang, source: o.app }).door();
      const rows = pageFor(LIC_TRIAL_ON, PENDING_VIEW, { lang, source: o.app }).rows();
      parts[lang] = {
        door: buyBtn(door) && plain(door).indexOf(line) >= 0 && plain(door).indexOf(WORDS.none[lang]) < 0,
        account: !buyBtn(rows) && plain(rowOf(rows, "payment")).indexOf(line) >= 0,
      };
    }
    const ok = addr.pending === ORDER_EN + "#code=" + CODE && addr.pendingPays === PORTAL && addr.refused === ORDER_EN + "#code=" + CODE2
      && view.offer === true && JSON.stringify(view.held) === JSON.stringify(pending)
      && Object.values(parts).every((x) => Object.values(x).every(Boolean));
    ck(ok, "sbuy14 a checkout pending: Buy keeps the order page, the trial-over door offers Buy with the pending line beside it, and Account while the trial runs shows the line and no second Buy, EN and PL: "
      + JSON.stringify({ addr, view, parts }));
  });
}

/* Each plant: the file it changes, the text and its replacement, and the legs it must turn red. */
const PLANTS = [
  { mark: "buy-portal-shape", file: "buy", from: "const PORTAL = /^https:\\/\\/billing\\.stripe\\.com\\/p\\/login\\/(?:test_)?[A-Za-z0-9]{8,64}$/; /* plant:buy-portal-shape */",
    to: "const PORTAL = /^https:\\/\\//; /* plant:buy-portal-shape */", reds: ["sbuy1"] },
  { mark: "buy-order-shape", file: "buy", from: "const ORDER_ORIGIN = /^https:\\/\\/(?:[a-z0-9-]+\\.)*etiuda\\.dev$/; /* plant:buy-order-shape */",
    to: "const ORDER_ORIGIN = /^https:\\/\\//; /* plant:buy-order-shape */", reds: ["sbuy2"] },
  { mark: "buy-held-kind", file: "buy", from: "if (!plain(e) || HELD_KINDS.indexOf(e.kind) < 0 || PAY_PROVIDERS.indexOf(e.provider) < 0) return null; /* plant:buy-held-kind */",
    to: "if (!plain(e) || PAY_PROVIDERS.indexOf(e.provider) < 0) return null; /* plant:buy-held-kind */", reds: ["sbuy1"] },
  { mark: "buy-pays-team", file: "buy", from: "const p = plain(a.pays) ? paysOf(a.pays.team) : null; /* plant:buy-pays-team */",
    to: "const p = plain(a.pays) ? paysOf(a.pays.team || a.pays.deskOnly) : null; /* plant:buy-pays-team */", reds: ["sbuy1"] },
  { mark: "buy-held-first", file: "buy", from: "const h = Array.isArray(a.held) ? a.held.map(heldOf).find((x) => x) || null : null; /* plant:buy-held-first */",
    to: "const h = Array.isArray(a.held) ? heldOf(a.held[0]) : null; /* plant:buy-held-first */", reds: ["sbuy1"] },
  { mark: "buy-signed-managed", file: "buy", from: "  const who = buyBarred(s, managed) ? null : buyerOf(s);\n  if (!who) return \"\"; /* plant:buy-signed-managed */",
    to: "  const who = buyerOf(s);\n  if (!who) return \"\"; /* plant:buy-signed-managed */", reds: ["sbuy2"] },
  { mark: "buy-pays-portal", file: "buy", from: "if (pays) return pays.portal || \"\"; /* plant:buy-pays-portal */",
    to: "if (pays && pays.portal) return pays.portal; /* plant:buy-pays-portal */", reds: ["sbuy2"] },
  { mark: "buy-order-code", file: "buy", from: "if (typeof origin !== \"string\" || !ORDER_ORIGIN.test(origin) || typeof who.code !== \"string\" || !CODE.test(who.code)) return \"\"; /* plant:buy-order-code */",
    to: "if (typeof origin !== \"string\" || !ORDER_ORIGIN.test(origin)) return \"\"; /* plant:buy-order-code */", reds: ["sbuy2"] },
  { mark: "buy-view-managed", file: "buy", from: "const pays = kept && !buyBarred(s, managed) ? paysOf(kept.pays) : null, held = kept ? heldOf(kept.held) : null; /* plant:buy-view-managed */",
    to: "const pays = kept && !buyBarred(s, managed) ? paysOf(kept.pays) : null, held = kept && !buyBarred(s, managed) ? heldOf(kept.held) : null; /* plant:buy-view-managed */", reds: ["sbuy3"] },
  { mark: "buy-held-managed", file: "app", from: "    const b = S.lic && S.lic.buy && typeof S.lic.buy === \"object\" && signedIn() ? S.lic.buy : null; /* plant:buy-held-managed */",
    to: "    const b = buyNow(); /* plant:buy-held-managed */", reds: ["sbuy6"] },
  { mark: "buy-fragment", file: "buy", from: "  return origin + ORDER_PATHS[lang === \"pl\" ? \"pl\" : \"en\"] + \"#code=\" + who.code; /* plant:buy-order-lang */",
    to: "  return origin + ORDER_PATHS[lang === \"pl\" ? \"pl\" : \"en\"] + \"?code=\" + who.code; /* plant:buy-order-lang */", reds: ["sbuy2"] },
  { mark: "buy-sent", file: "buy", from: "\"use strict\";\n", to: "\"use strict\";\nconst https = require(\"node:https\");\n", reds: ["sbuy7"] },
  { mark: "buy-address-twice", file: "main", from: "    if (buy) shell.openExternal(buy);\n",
    to: "    if (buy) shell.openExternal(buy);\n    void BUY.buyAddress(readServiceState(), ORDER_ORIGIN, managedHere(), recoveryLang());\n", reds: ["sbuy7"] },
  { mark: "buy-none", file: "app", from: "    if (!w) return b ? '<p class=\"si-cap\" data-buy-none>' + esc(T(\"Buying is not available in this build of Etiuda Studio. A lead seat comes from a licence's owner: a naming sent to this account's email address appears under Account with one Accept, and Check now looks for it again.\")) + \"</p>\" : \"\"; /* plant:buy-none */",
    to: "    if (!w) return \"\"; /* plant:buy-none */", reds: ["sbuy4"] },
  { mark: "buy-order-lang", file: "buy", from: "  return origin + ORDER_PATHS[lang === \"pl\" ? \"pl\" : \"en\"] + \"#code=\" + who.code; /* plant:buy-order-lang */",
    to: "  return origin + ORDER_PATHS.en + \"#code=\" + who.code; /* plant:buy-order-lang */", reds: ["sbuy2"] },
  { mark: "buy-service-managed", file: "buy", from: "  return managed === true || s.signinManaged === true || s.signinNoRole === true; /* plant:buy-service-managed */",
    to: "  return managed === true; /* plant:buy-service-managed */", reds: ["sbuy2", "sbuy3"] },
  { mark: "buy-keep-managed", file: "client", from: "  if (a.managed === true) next.signinManaged = true; else delete next.signinManaged; /* plant:buy-keep-managed */",
    to: "  /* plant:buy-keep-managed */", reds: ["sbuy1"] },
  { mark: "buy-held-local", file: "app", from: "{ day: \"numeric\", month: \"short\", year: \"numeric\" }).format(at); } /* plant:buy-held-local */",
    to: "{ day: \"numeric\", month: \"short\", year: \"numeric\", timeZone: \"Pacific/Kiritimati\" }).format(at); } /* plant:buy-held-local */", reds: ["sbuy6"] },
  { mark: "client-no-licence-carry", file: "client", from: "  if (no.reason === \"no-licence\") { /* plant:client-no-licence-carry */",
    to: "  if (false) { /* plant:client-no-licence-carry */", reds: ["sbuy10"] },
  { mark: "buy-refused-reason", file: "buy", from: "if (!plain(a) || a.ok === true || a.reason !== \"signin-no-licence\" || typeof a.me !== \"string\" || !CODE.test(a.me)) return null; /* plant:buy-refused-reason */",
    to: "if (!plain(a) || a.ok === true || typeof a.me !== \"string\" || !CODE.test(a.me)) return null; /* plant:buy-refused-reason */", reds: ["sbuy10"] },
  { mark: "buy-refused-only", file: "buy", from: "  const nl = s.by !== \"admin\" && plain(s.signinNoLicence) ? s.signinNoLicence : null; /* plant:buy-refused-only */",
    to: "  const nl = plain(s.signinNoLicence) ? s.signinNoLicence : null; /* plant:buy-refused-only */", reds: ["sbuy11"] },
  { mark: "buy-refused-own-code", file: "buy", from: "  return nl && nl.managed !== true ? { code: nl.code, kept: plain(nl.buy) ? nl.buy : null, refused: true } : null;",
    to: "  return nl && nl.managed !== true ? { code: s.signinCode || nl.code, kept: plain(nl.buy) ? nl.buy : null, refused: true } : null;", reds: ["sbuy11"] },
  { mark: "buy-view-barred", file: "buy", from: "  const barred = buyBarred(s, managed) || (s.by !== \"signin\" && plain(s.signinNoLicence) && s.signinNoLicence.managed === true); /* plant:buy-view-barred */",
    to: "  const barred = false; /* plant:buy-view-barred */", reds: ["sbuy3", "sbuy11"] },
  { mark: "buy-refused-drop-check", file: "client", from: "  if (r && r.state && typeof r.state === \"object\") { r.state = Object.assign({}, r.state); delete r.state.signinNoLicence; } /* plant:buy-refused-drop-check */",
    to: "  /* plant:buy-refused-drop-check */", reds: ["sbuy12"] },
  { mark: "buy-refused-keep", file: "main", from: "  if (kept) next.signinNoLicence = kept; else delete next.signinNoLicence; /* plant:buy-refused-keep */",
    to: "  if (kept) next.signinNoLicence = kept; /* plant:buy-refused-keep */", reds: ["sbuy12"] },
  { mark: "buy-refused-door", file: "app", from: "    if (!f || f.why !== \"signin-no-licence\" || !b || b.refused !== true || managedOn() || signedIn()) return \"\"; /* plant:buy-refused-door */",
    to: "    if (!f || !b || b.refused !== true || managedOn() || signedIn()) return \"\"; /* plant:buy-refused-door */", reds: ["sbuy13"] },
  { mark: "buy-refused-reload", file: "app", from: "if (why === \"signin-no-licence\" && API.licence) {",
    to: "if (false) {", reds: ["sbuy13"] },
  { mark: "buy-managed-line", file: "app", from: "    if (v && (managedOn() || v.barred === true)) return",
    to: "    if (false) return", reds: ["sbuy13"] },
  { mark: "buy-view-portal", file: "buy", from: "pays: pays ? { provider: pays.provider, portal: !!pays.portal } : null, held }, /* plant:buy-view-portal */",
    to: "pays: pays ? { provider: pays.provider, portal: pays.portal || false } : null, held }, /* plant:buy-view-portal */", reds: ["sbuy3"] },
  { mark: "buy-keep", file: "client", from: "if (buy) next.signinBuy = buy; else delete next.signinBuy; /* plant:buy-keep */",
    to: "if (buy) next.signinBuy = buy; /* plant:buy-keep */", reds: ["sbuy1"] },
  { mark: "buy-door", file: "app", from: "    const buyAt = ds.state === \"trial-over\" ? buyHtml() : \"\"; /* plant:buy-door */",
    to: "    const buyAt = \"\"; /* plant:buy-door */", reds: ["sbuy4"] },
  { mark: "buy-pays-first", file: "app", from: "    if (b.pays) return b.pays.portal /* plant:buy-pays-first */",
    to: "    if (b.pays && b.offer && !b.pays) return b.pays.portal /* plant:buy-pays-first */", reds: ["sbuy4", "sbuy5"] },
  { mark: "buy-portal-btn", file: "app", from: "      ? { line: T(\"This account already pays for its licence, so this opens its subscription at {PROVIDER} instead of a second order; seats are added there.\", { PROVIDER: payName(b.pays.provider) }), btn: T(\"Add seats…\") } /* plant:buy-portal-btn */",
    to: "      ? { line: T(\"This account already pays for its licence, and a licence holds one subscription, so no second order is taken.\"), btn: \"\" } /* plant:buy-portal-btn */", reds: ["sbuy4", "sbuy5"] },
  { mark: "buy-offer", file: "app", from: "    if (b.offer) return { line: T(\"The order page opens in the browser, and the licence bought there is this account's.\"), btn: T(\"Buy\"), note: pend }; /* plant:buy-offer */",
    to: "    return { line: T(\"The order page opens in the browser, and the licence bought there is this account's.\"), btn: T(\"Buy\"), note: pend }; /* plant:buy-offer */", reds: ["sbuy4"] },
  { mark: "buy-row-seat", file: "app", from: "    if (buyRowShown(ds)) { /* plant:buy-row-seat */",
    to: "    if (buyNow()) { /* plant:buy-row-seat */", reds: ["sbuy5"] },
  { mark: "buy-held-line", file: "app", from: "    const line = PAY_HELD_LINES[h.kind]; /* plant:buy-held-line */",
    to: "    const line = PAY_HELD_LINES.review; /* plant:buy-held-line */", reds: ["sbuy6"] },
  { mark: "buy-open-name", file: "app", from: "    \"buy-open\": () => { if (API && API.buyOpen) API.buyOpen(); }, /* plant:buy-open-name */",
    to: "    \"buy-open\": () => { if (API && API.buyOpen) API.buyOpen(\"" + ORDER_EN + "\"); }, /* plant:buy-open-name */", reds: ["sbuy5"] },
  { mark: "buy-stopped", file: "main", from: "\"studio:update\", \"studio:update-later\", \"studio:update-open\", \"studio:buy-open\",",
    to: "\"studio:update\", \"studio:update-later\", \"studio:update-open\",", reds: ["sbuy7"] },
  /* Grok alpha's C6: a checkout pending hides Buy, and the door shows its held line in Buy's place. */
  /* Moved with the test architect's F3: buy-pending-hides retired (a pending checkout no longer hides Buy); buy-pending-line now the line beside
     Buy at the door; buy-pending-running the running trial's Account with no second Buy. */
  { mark: "buy-pending-line", file: "app", from: "      + (w.note ? '<p class=\"si-cap\" data-buy-pending>' + esc(w.note) + \"</p>\" : \"\") + \"</div>\"; /* plant:buy-pending-line */",
    to: "      + \"</div>\"; /* plant:buy-pending-line */", reds: ["sbuy14"] },
  { mark: "buy-pending-running", file: "app", from: "    if (pend && !trialOver) return null; /* plant:buy-pending-running */",
    to: "    /* plant:buy-pending-running */", reds: ["sbuy14"] },
  { mark: "lab-order", file: "lab", from: "  if (given(\"order\") && (typeof d.order !== \"string\" || !BUY_ORDER_ORIGIN.test(d.order))) return { refused: \"the order origin is not https on etiuda.dev with no path\" }; /* plant:lab-order */",
    to: "  /* plant:lab-order */", reds: ["sbuy8"] },
];

async function main() {
  clearScratch(SCRATCH);
  const texts = { buy: read(BUY_PATH), client: read(CLIENT_PATH), app: read(APP_PATH), main: read(MAIN_PATH), preload: read(PRELOAD_PATH), lab: read(LAB_PATH) };
  const before = JSON.stringify(Object.values(texts).map((t) => t.length));
  const setFrom = async (t) => {
    const buyFile = t.buy ? buyFileFrom(t.buy) : null;
    let buy = { buyAddress: () => { throw new Error("no src/buy-path.cjs"); }, buyView: () => { throw new Error("no src/buy-path.cjs"); } };
    if (t.buy) buy = cjsFrom(t.buy, buyFile);
    let client = { keepWho: () => { throw new Error("no keepWho"); } };
    try { client = await clientFrom(t.client, buyFile); } catch (e) { client = { keepWho: () => { throw e; } }; }
    let lab = { labOf: () => ({ refused: "no lab" }) };
    try { lab = cjsFrom(t.lab, LAB_PATH); } catch { /* the leg says so */ }
    return { buy, client, lab, labText: t.lab, buyText: t.buy, app: t.app, main: t.main, preload: t.preload };
  };
  await runSuite(await setFrom(texts), check);
  const off = process.env.ETIUDA_PLANTS === "off";
  if (!off) {
    for (const p of PLANTS) {
      const t = Object.assign({}, texts);
      if (t[p.file].split(p.from).length !== 2) { check(false, "sbuy9 plant " + p.mark + " anchor count " + (t[p.file].split(p.from).length - 1)); continue; }
      t[p.file] = t[p.file].replace(p.from, () => p.to);
      const seen = [];
      await runSuite(await setFrom(t), (cond, line) => { if (!cond) seen.push(String(line).split(" ")[0]); });
      check(p.reds.every((r) => seen.includes(r)), "sbuy9 plant " + p.mark + " turns " + p.reds.join(",") + " red: " + JSON.stringify(seen));
    }
    const after = JSON.stringify([BUY_PATH, CLIENT_PATH, APP_PATH, MAIN_PATH, PRELOAD_PATH, LAB_PATH].map((f) => read(f).length));
    check(after === before, "sbuy9 the real files are unchanged by the plants");
  }
  dropScratch(SCRATCH, "studio-buy-path");
  const skipped = off ? PLANTS.length + 1 : 0;
  /* EXPECTED: the thirteen legs, one check per plant and the unchanged files. Moved 2026-11-22: old twelve legs, new thirteen (sbuy14). */
  const EXPECTED = 13 + PLANTS.length + 1;
  if (asserted + skipped !== EXPECTED) check(false, "the count: " + (asserted + skipped) + " checks, " + EXPECTED + " expected");
  process.stdout.write("#counts checks=" + asserted + " skipped=" + skipped + " failed=" + failed + "\n");
  process.stdout.write("studio-buy-path  " + asserted + " assertion(s), " + skipped + " skipped, " + failed + " failure(s)\n");
  process.exit(failed ? 1 : 0);
}
main().catch((e) => { process.stderr.write(String(e && e.stack || e) + "\n"); process.exit(2); });
