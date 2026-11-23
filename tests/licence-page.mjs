/* THE LICENCE COVER, ON THE PAGE (board 936, S6): node tests/licence-page.mjs
 *
 * ui/app.js runs on tests/page-stand-in.mjs with a stand-in of the shell's two licence channels (shell/preload.js), each
 * answering as tests/licence-studio.mjs shows the real ones answer, and every call recorded. Markup, state and calls only.
 *
 *   lp1  the Settings tab's Teams and keys page carries the Licence row and its door (board 965, S1; Settings' foot until
 *        then), and the door opens the licence cover, which reads what this
 *        Studio holds from the shell
 *   lp2  the cover says the licence publishing acts on, the relay grant's end (the lead's-month review: shown nowhere else),
 *        as a trial where the grant is not paid, "not open" where there is none, and when it was last checked, with Check
 *        now only once activated
 *   lp3  signing in is the one way to a seat (board 980, stage 4): where a provider is offered and nobody signed in, the cover
 *        offers the door's Sign in, which opens the door; a Studio activated before sign-in (by a purchase key, an address's code
 *        or a trial by code) is told its licence is now kept by signing in; signed in, or with no provider, there is no way in
 *        here; and nowhere a field or a solid press; Settings' Account says the same to a Studio activated before sign-in
 *   lp6  a key made again is said, and signing in again moves the licence; Check now asks the shell, and its refusal is said in
 *        the cover with nothing else changed
 *   lp7  in Polish every word of the cover is the table's pair, the screen is ready, and a seat is "miejsce", never a desk's word
 *   lp8  the publish cover's licence line says why a revoked licence is not used, a trial and its end,
 *        a file that could not be read, and, for no licence, nothing the page invents (the door's words are S-3's);
 *        a build released after a licence's updates reads as any licence does, with no mark, in English and in Polish
 *   lp9  plants: each line of the cover a careless edit would break, changed in a copy of the page, turns its leg red
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadPage } from "./page-stand-in.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const APP = fs.readFileSync(path.join(ROOT, "ui", "app.js"), "utf8");
const EXPECTED = 36;

let asserted = 0, failed = 0;
function check(cond, line) {
  asserted++;
  if (cond) process.stdout.write("  ok   " + line + "\n");
  else { failed++; process.stdout.write("  FAIL " + line + "\n"); }
}
const el = (attrs) => ({ getAttribute: (k) => (attrs[k] == null ? null : attrs[k]) });
/* Markup as read: tags gone, entities back, and the no-break space fill() binds a number with read as a space. */
const text = (h) => String(h || "").replace(/<[^>]*>/g, "").split("&quot;").join('"').split("&#39;").join("'")
  .split("&lt;").join("<").split("&gt;").join(">").split("&amp;").join("&").split(String.fromCharCode(160)).join(" ");

const HELD = { licence: { status: "active", org: "Kappa Tools", seats: 2, devicesEach: 3, updatesUntil: "2027-11-02",
  released: null, trial: null, unusable: null }, grant: { until: "2026-12-09", paid: true }, by: "key", checked: "2026-10-25",
  keyChanged: false, hasKey: true, signing: { keyId: "studio-1", print: "abcd" } };
const NONE = { licence: { status: "none", trial: null, unusable: null },
  grant: null, by: null, checked: null, keyChanged: false, hasKey: false, signing: { keyId: "", problem: null } };
const clone = (o) => JSON.parse(JSON.stringify(o));

/** The page over `source`, its licence channels answering from `answers` (a channel's name to a function of its arguments). */
function pageWith(source, answers, lang) {
  const calls = [];
  const on = (name, dflt) => (...a) => { calls.push([name].concat(a)); return Promise.resolve((answers[name] || dflt)(...a)); };
  const api = {
    signing: () => Promise.resolve({ error: null, signing: { keyId: "", problem: null } }),
    licence: on("licence", () => Object.assign({ error: null }, clone(NONE))),
    licenceCheck: on("licenceCheck", () => Object.assign({ error: null }, clone(HELD))),
  };
  const home = loadPage({ api, uiLang: lang || "en", source });
  const P = home.page;
  P.S.host = { version: "0.1.0", tour: { offered: true }, langs: [], signing: { keyId: "", problem: null } };
  P.paint();
  return { home, P, calls, dlg: () => home.node("#dlg").innerHTML };
}
const flush = () => new Promise((r) => setTimeout(r, 0));
const foot = (h) => (/<div class="foot">(.*)<\/div>$/.exec(String(h)) || [])[1] || "";
const solid = (h) => { const m = /<button class="btn solid" data-act="([^"]+)">(.*?)<\/button>/.exec(foot(h)); return m ? { act: m[1], said: text(m[2]) } : null; };

async function legs(source, ck) {
  const leg = async (id, fn) => { try { await fn(); } catch (e) { ck(false, id + " threw: " + (e && e.stack ? e.stack.split("\n").slice(0, 2).join(" / ") : e)); } };

  await leg("lp1", async () => {
    const w = pageWith(source, {});
    await w.P.ACTS.settings();
    if (w.P.S.sx) { w.P.S.sx.sec = "teams"; w.P.paint(); }
    const page = w.home.node("#main").innerHTML;
    const row = (/<div class="sx-row" data-row="licence">(.*?)<\/div><\/div>/.exec(page) || [])[1] || "";
    ck(w.P.S.screen === "settings" && /<b>Licence<\/b>/.test(row) && /data-act="licence">Licence…<\/button>/.test(row),
      "lp1a the Settings tab's Teams and keys page carries the Licence row with its door, Licence…: " + JSON.stringify(text(row)));
    await w.P.ACTS.licence(el({ "data-act": "licence" }));
    ck(w.P.S.cover === "licence" && w.calls.length === 1 && w.calls[0][0] === "licence" && /<h2>Licence<\/h2>/.test(w.dlg()),
      "lp1b the door opens the licence cover, which reads what this Studio holds from the shell: " + JSON.stringify(w.calls));
  });

  await leg("lp2", async () => {
    const w = pageWith(source, { licence: () => Object.assign({ error: null }, clone(HELD)) });
    await w.P.ACTS.licence();
    const h = text(w.dlg());
    ck(h.indexOf("Kappa Tools, seats: 2, devices per seat: 3, updates until 2027-11-02") >= 0,
      "lp2a the licence row is the publish cover's own line: " + JSON.stringify(h.slice(0, 160)));
    ck(h.indexOf("Open until 9 December 2026") >= 0 && h.indexOf("for the trial") < 0
      && h.indexOf("The quiet check renews it while the licence is paid.") >= 0,
      "lp2b the relay row names the grant's end, the day the lead would otherwise not see");
    ck(h.indexOf("25 October 2026") >= 0 && /data-act="lic-check"/.test(w.dlg()),
      "lp2c the last check is named, with Check now beside it");
    const t = pageWith(source, { licence: () => Object.assign({ error: null }, clone(HELD), { grant: { until: "2026-11-08", paid: false }, by: "trial" }) });
    await t.P.ACTS.licence();
    ck(text(t.dlg()).indexOf("Open until 8 November 2026, for the trial") >= 0, "lp2d a grant not paid is said as the trial's");
    const n = pageWith(source, {});
    await n.P.ACTS.licence();
    const nh = text(n.dlg());
    ck(nh.indexOf("Not open for this Studio") >= 0 && nh.indexOf("not yet") >= 0 && !/data-act="lic-check"/.test(n.dlg())
      && !/Evaluation|evaluation/.test(nh),
      "lp2e with nothing held: no licence line, the relay not open, not yet checked, and no Check now");
  });

  await leg("lp3", async () => {
    const MOVED = "Licences are now held by signing in. This Studio's licence file stays where it is but no longer counts: publishing needs this Studio signed in, and signing in brings the licence this account holds.";
    const offered = { signIn: ["microsoft", "google"] };
    const m = pageWith(source, { licence: () => Object.assign({ error: null }, clone(HELD), offered, { signinMoved: true }) });
    await m.P.ACTS.licence();
    const mh = text(m.dlg());
    ck(/data-lic-signin/.test(m.dlg()) && mh.indexOf(MOVED) >= 0 && /data-act="door-open">Sign in<\/button>/.test(m.dlg())
      && mh.indexOf("Kappa Tools") >= 0 && mh.indexOf("Open until 9 December 2026") >= 0,
      "lp3a a Studio activated before sign-in keeps what it holds and is told its licence is now kept by signing in, with Sign in beside: "
      + JSON.stringify(mh.slice(0, 240)));
    const n = pageWith(source, { licence: () => Object.assign({ error: null }, clone(NONE), offered) });
    await n.P.ACTS.licence();
    ck(/data-lic-signin/.test(n.dlg()) && text(n.dlg()).indexOf("Not signed in") >= 0 && text(n.dlg()).indexOf(MOVED) < 0
      && /data-act="door-open">Sign in<\/button>/.test(n.dlg()),
      "lp3b nobody signed in, nothing held: Not signed in, and Sign in");
    await n.P.ACTS["door-open"]();
    ck(n.P.S.cover === null && n.P.S.signDoor === "open", "lp3c Sign in closes the cover and opens the door: " + JSON.stringify([n.P.S.cover, n.P.S.signDoor]));
    const z = pageWith(source, { licence: () => Object.assign({ error: null }, clone(NONE)) });
    await z.P.ACTS.licence();
    const zm = pageWith(source, { licence: () => Object.assign({ error: null }, clone(HELD), { signinMoved: true }) });
    await zm.P.ACTS.licence();
    ck(!/data-lic-signin|data-act="door-open"/.test(z.dlg() + zm.dlg()) && text(zm.dlg()).indexOf("Kappa Tools") >= 0,
      "lp3d with no provider offered there is no way in from the cover, and what is held is still said");
    const si = pageWith(source, { licence: () => Object.assign({ error: null }, clone(HELD), offered, { by: "signin", provider: "microsoft" }) });
    await si.P.ACTS.licence();
    ck(!/data-lic-signin/.test(si.dlg()), "lp3e signed in, the cover offers no way in");
    const all = [m, n, z, zm, si].map((w) => w.dlg()).join("");
    ck(!/<input/.test(all) && [m, n, z, zm, si].every((w) => !solid(w.dlg())) && !/Activate|purchase|Purchase|code from the email/.test(text(all)),
      "lp3f nowhere a field, a solid press, a purchase key, an address or a code");
    const acct = (w) => { w.P.S.screen = "settings"; w.P.S.sx = { sec: "account", q: "" }; return text(w.P.__get("settingsPageHtml")()); };
    const am = acct(m), an = acct(n);
    ck(am.indexOf("Not signed in") >= 0 && am.indexOf(MOVED) >= 0 && an.indexOf(MOVED) < 0
      && an.indexOf("Signing in gives this account its Studio seat, on any computer it signs in on, up to three.") >= 0,
      "lp3g Settings' Account says the same to a Studio activated before sign-in, beside its providers, and its usual line to one that was not");
  });

  await leg("lp6", async () => {
    const w = pageWith(source, { licence: () => Object.assign({ error: null }, clone(HELD), { keyChanged: true, grant: null }) });
    await w.P.ACTS.licence();
    ck(text(w.dlg()).indexOf("This Studio's signing key has changed since its licence was issued.") >= 0
      && text(w.dlg()).indexOf("Signing in again moves the licence to the new key: Use another account, under Account, signs in afresh, with the same account or another. A team on the relay stays with the key it was made with") >= 0
      && text(w.dlg()).indexOf("or make the team again and invite its teammates anew.") >= 0,
      "lp6a a key made again is said: signing in again moves the licence to the new key, and a team on the relay stays with the key it was made with, kept by its backup copy or made again with its teammates invited anew");
    await w.P.ACTS["lic-check"]();
    ck(w.calls[1] && w.calls[1][0] === "licenceCheck" && text(w.dlg()).indexOf("Open until 9 December 2026") >= 0,
      "lp6b Check now asks the shell and repaints what it answers");
    const said = "The licence service could not be reached, so nothing was changed. Try again later.";
    const r = pageWith(source, { licence: () => Object.assign({ error: null }, clone(HELD)), licenceCheck: () => ({ error: said, said: { frame: said, vars: {} } }) });
    await r.P.ACTS.licence();
    await r.P.ACTS["lic-check"]();
    const rh = text(r.dlg());
    ck(rh.indexOf(said) >= 0 && rh.indexOf("Open until 9 December 2026") >= 0 && rh.indexOf("Kappa Tools") >= 0,
      "lp6c a refusal of Check now is said in the cover, and what is held stays as it was");
  });

  await leg("lp7", async () => {
    const w = pageWith(source, { licence: () => Object.assign({ error: null }, clone(HELD), { signIn: ["microsoft"], signinMoved: true }) }, "pl");
    await w.P.ACTS.licence();
    const all = text(w.dlg());
    const T = w.home.sandbox.STUDIO_T;
    ck(T.ready("licence") === true && all.indexOf("Licencja") >= 0 && all.indexOf("Otwarty do 9 grudnia 2026") >= 0
      && all.indexOf("Sprawdź teraz") >= 0 && all.indexOf("Zaloguj się") >= 0 && all.indexOf("Licencje są teraz utrzymywane przez logowanie.") >= 0,
      "lp7a in Polish the cover is the table's words, and the screen is ready: " + JSON.stringify(all.slice(0, 200)));
    const english = ["Licence", "Open until", "Sign in", "Licences are now kept", "Checked", "Check now"]
      .filter((x) => new RegExp("(^|[^A-Za-z])" + x + "([^A-Za-z]|$)").test(all));
    ck(english.length === 0 && /miejsca: 2/.test(all) && !/stanowisk/.test(all),
      "lp7b no English is left, and the seats are \"miejsca\", never a desk's word: " + JSON.stringify(english));
  });

  await leg("lp8", async () => {
    const w = pageWith(source, {});
    const said = w.P.licenceSaid({ status: "none", file: "C:/x/etiuda-studio-license.js", unusable: { reason: "revoked" } });
    ck(text(said.where).indexOf("was not used: the key that signed it was withdrawn by Etiuda") >= 0,
      "lp8a the publish cover says a revoked licence was not used and why: " + JSON.stringify(text(said.where)));
    /* A trial is a signed licence (src/licence.mjs TRIAL_KIND): a licence until its end, then the one calm sentence. */
    const trial = { until: "2026-11-08", ends: Date.UTC(2026, 10, 8, 13), signed: true };
    const live = w.P.licenceSaid({ status: "trial", canPublish: true, file: "C:/x/etiuda-studio-license.js", trial: Object.assign({ over: false }, trial) });
    const ended = w.P.licenceSaid({ status: "trial-ended", canPublish: false, paused: true, file: "C:/x/etiuda-studio-license.js",
      trial: Object.assign({ over: true }, trial) });
    ck(text(live.v) === "Trial licence until 2026-11-08" && text(ended.v) === "The trial ended on 2026-11-08. Publishing, statistics and"
      + " proposals are paused until a licence is bought; editing, checks and export stay open. Signing in then brings the licence here." && !/Evaluation/.test(text(live.v) + text(ended.v)),
      "lp8b the publish cover says a trial's licence and its end, and after the end the one calm sentence, never evaluation: "
      + JSON.stringify([text(live.v), text(ended.v)]));
    const pl = pageWith(source, {}, "pl");
    await pl.P.ACTS.licence();
    const plEnded = pl.P.licenceSaid({ status: "trial-ended", canPublish: false, paused: true, file: null, trial: Object.assign({ over: true }, trial) });
    const plLive = pl.P.licenceSaid({ status: "trial", canPublish: true, file: null, trial: Object.assign({ over: false }, trial) });
    ck(text(plEnded.v) === "Okres próbny skończył się dnia 2026-11-08. Publikowanie, statystyki i propozycje są wstrzymane do czasu zakupu licencji; edycja, kontrola i eksport działają dalej. Zalogowanie się przeniesie potem licencję tutaj."
      && text(plLive.v) === "Licencja próbna do dnia 2026-11-08",
      "lp8c and in Polish they are the table's pairs: " + JSON.stringify([text(plLive.v), text(plEnded.v)]));
    const noneEn = w.P.licenceSaid({ status: "none", canPublish: false, paused: false, file: "C:/x/etiuda-studio-license.js", trial: null, unusable: null });
    const nonePl = pl.P.licenceSaid({ status: "none", canPublish: false, paused: false, file: null, trial: null, unusable: null });
    ck(text(noneEn.v) === "" && text(nonePl.v) === "" && text(noneEn.where).indexOf("A licence file goes at C:/x/etiuda-studio-license.js.") >= 0
      && !/valuation/.test(text(noneEn.v) + text(noneEn.where) + text(nonePl.v)),
      "lp8d with no licence the line says nothing of an evaluation or a pause, and the cover still names where the file goes: "
      + JSON.stringify([text(noneEn.v), text(noneEn.where)]));
    const HELD_EN = "The licence file could not be read just now, perhaps because another program has it open. Publishing goes on as normal, and Studio tries again at its next look.";
    const HELD_PL = "Nie udało się teraz odczytać pliku licencji, być może dlatego, że ma go otwartego inny program. Publikowanie działa normalnie, a Studio spróbuje ponownie przy następnym sprawdzeniu.";
    const heldLic = { licence: { status: "held", canPublish: true, paused: false, org: null, seats: null,
      devicesEach: null, updatesUntil: null, released: null, trial: null, unusable: null },
      grant: null, by: null, checked: null, keyChanged: false, hasKey: false, signing: { keyId: "", problem: null } };
    const heldAnswer = () => Object.assign({ error: null }, JSON.parse(JSON.stringify(heldLic)));
    const cover = pageWith(source, { licence: heldAnswer });
    await cover.P.ACTS.licence();
    const saidHeld = w.P.licenceSaid({ status: "held", canPublish: true, paused: false,
      file: "C:/x/etiuda-studio-license.js", trial: null, unusable: null });
    ck(text(cover.dlg()).indexOf(HELD_EN) >= 0 && text(saidHeld.v) === HELD_EN
      && text(saidHeld.v).indexOf("evaluation period ended") < 0,
      "lp8i the licence line and the publish cover say the file could not be read, and neither is the pause: "
      + JSON.stringify(text(saidHeld.v)));
    const coverPl = pageWith(source, { licence: heldAnswer }, "pl");
    await coverPl.P.ACTS.licence();
    const saidHeldPl = pl.P.licenceSaid({ status: "held", canPublish: true, paused: false, file: null,
      trial: null, unusable: null });
    ck(text(coverPl.dlg()).indexOf(HELD_PL) >= 0 && text(saidHeldPl.v) === HELD_PL,
      "lp8j and in Polish the line is the table's pair: " + JSON.stringify(text(saidHeldPl.v)));
    const lapsed = { status: "active", canPublish: true, paused: false, file: "C:/x/etiuda-studio-license.js",
      org: "Kappa Tools", seats: 2, devicesEach: 3, updatesUntil: "2025-06-01" };
    const lapsedEn = w.P.licenceSaid(lapsed), lapsedPl = pl.P.licenceSaid(lapsed);
    ck(text(lapsedEn.v) === "Kappa Tools, seats: 2, devices per seat: 3, updates until 2025-06-01"
      && text(lapsedPl.v) === "Kappa Tools, miejsca: 2, urządzenia na miejsce: 3, aktualizacje do 2025-06-01"
      && text(lapsedEn.where) === "C:/x/etiuda-studio-license.js" && !/valuation|oceny/.test(text(lapsedEn.v) + text(lapsedEn.where) + text(lapsedPl.v) + text(lapsedPl.where)),
      "lp8f a licence whose updates ended long ago reads as any licence, in English and in Polish, with no mark and the file named: "
      + JSON.stringify([text(lapsedEn.v), text(lapsedPl.v), text(lapsedEn.where)]));
  });
}

/* One line of ui/app.js, changed in a copy. `reds` are the legs that must read red against it. */
const PLANTS = [
  { name: "no-door", reds: ["lp1a"], from: "sxRow(\"licence\", \"licence\", T(\"Licence\"), \"\", sxBtn(\"licence\", T(\"Licence…\")))", to: "\"\"" },
  { name: "no-end", reds: ["lp2b"], from: "      : g.paid ? esc(T(\"Open until {DATE}\", { DATE: day(g.until) }))", to: "      : g.paid ? esc(T(\"Open\"))" },
  { name: "trial-as-paid", reds: ["lp2d"], from: "      : esc(T(\"Open until {DATE}, for the trial\", { DATE: day(g.until) }));",
    to: "      : esc(T(\"Open until {DATE}\", { DATE: day(g.until) }));" },
  { name: "refusal-unsaid", reds: ["lp6c"], from: "    if (!r || r.error) { S.err = errOf(r); paintCover(); return false; }", to: "    if (!r || r.error) { S.err = null; paintCover(); return false; }" },
  { name: "acct-moved-unsaid", reds: ["lp3g"], from: "const why = n.signinMoved === true ?", to: "const why = false ?" },
  { name: "moved-unsaid", reds: ["lp3a"], from: "esc(moved || T(\"Not signed in\"))", to: "esc(T(\"Not signed in\"))" },
  { name: "rekey-unsaid", reds: ["lp6a"], from: "(n.keyChanged ?", to: "(false ?" },
  { name: "trial-as-evaluation", reds: ["lp8b", "lp8c"], from: "      : l.status === \"trial-ended\" && tr ? T(", to: "      : false ? T(" },
  { name: "held-as-evaluation", reds: ["lp8i", "lp8j"], from: "      : l.status === \"held\" ? T(", to: "      : false ? T(" },
  { name: "revoked-unsaid", reds: ["lp8a"], from: "      : u.reason === \"revoked\" ? T(\"the key that signed it was withdrawn by Etiuda\")\n", to: "" },
];

async function main() {
  await legs(APP, check);
  for (const p of PLANTS) {
    const n = APP.split(p.from).length - 1;
    if (n !== 1) { check(false, "lp9 plant " + p.name + ": the line it changes is in ui/app.js " + n + " times, not once"); continue; }
    const seen = [];
    await legs(APP.split(p.from).join(p.to), (cond, line) => { if (!cond) seen.push(String(line).split(" ")[0]); });
    check(p.reds.every((id) => seen.includes(id)), "lp9 plant " + p.name + " turns " + p.reds.join(" and ") + " red: " + JSON.stringify(seen));
  }
  process.stdout.write("#counts checks=" + asserted + " failed=" + failed + " expected=" + EXPECTED + " plants=" + PLANTS.length + "\n");
  if (asserted !== EXPECTED) { process.stdout.write("SUITE DID NOT COMPLETE: " + asserted + " of " + EXPECTED + "\n"); return 78; }
  process.stdout.write("licence-page  " + asserted + " assertion(s), " + failed + " failure(s)\n");
  return failed ? 1 : 0;
}
main().then((c) => process.exit(c), (e) => { process.stderr.write(String(e && e.stack || e) + "\n"); process.exit(2); });
