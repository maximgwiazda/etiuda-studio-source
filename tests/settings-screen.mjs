/* THE SETTINGS TAB, AND THE THEME BUTTON BESIDE IT.
 *
 *     node tests/settings-screen.mjs [--keep]
 *
 * WHAT IS BEING PROVED, and it is a ruling rather than a feature. Maxim ruled on 2026-09-17 at
 * 23:02 that Studio's theme button cycles light and dark only and that system is reachable
 * through Settings alone, as in Etiuda. Two claims, and each is false in a different way: the
 * first fails if a run of presses ever lands on system, the second if what the Menu button
 * opens cannot put it back. So the button is pressed four times in a row and every step read,
 * and Settings is asked for system afterwards.
 *
 * SECTION 1 IS A SECOND RULING, board 965 of 2026-11-08 (Max, 01:20: "I prefer B"; 01:23: "tab
 * should say "Settings" when Settings are open"): Settings is a tab of sections, the section list
 * beside each section's page, where from board 465 to then it was one cover of rows. The rows are
 * read by their own labels and in their own order across the sections, and no row holds a field
 * at all, because the ruling of board 465 stands that nothing here handles a key of any kind. The slot for a model's key that board 465 also drew
 * went on 2026-09-29, with Maxim's ruling of 2026-09-28 13:19 that Etiuda's own code calls no
 * model; tests/no-model.mjs holds that it stays gone.
 *
 * THE ORACLE IS THE STORE AND THE DOCUMENT, NEVER THE PAGE'S OWN STATE. What a person sees is
 * `data-theme` on the document, which is what the stylesheet's token blocks key off; what
 * survives a restart is `theme` in the shell's own store, which is where shell/main.js reads it
 * from at the next launch and hands it to nativeTheme. A screen that painted one and stored the
 * other would look right for exactly one session, so both are read at every step.
 *
 * SYSTEM IS READ AGAINST THE MACHINE'S OWN ANSWER, not against a constant: the desk this runs on
 * may be light or dark and either is correct, so the assertion is that the document agrees with
 * what Windows itself says.
 *
 * AND THAT ANSWER IS READ FROM OUTSIDE THE WINDOW, which is not a nicety. `matchMedia` in the
 * renderer does NOT report the machine: Electron's nativeTheme.themeSource drives it, and
 * shell/main.js sets that source from the chosen theme, so a page told to be light reports
 * prefers-color-scheme: light however dark Windows is. Measured on 2026-09-17 at this desk,
 * where the control leg below read light against light and failed while both readings were
 * correct. The machine is therefore asked through the registry value Windows keeps for it,
 * AppsUseLightTheme, which nothing in this program can move.
 */
import { createRequire } from "node:module";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { openStudio } from "./shell-door.mjs";
import { makeKeyFile } from "../src/sign.mjs";
import { clearScratch, dropScratch } from "./scratch.mjs";
import { pressWhen, settleOn } from "./press.mjs";
import { PROXY_STATES } from "./win-proxy-oracle.mjs";

/* The trademark sentence of each About credit on screen: the credit's first line after "© 2026 Maxim Gwiazda. ". */
const TM_READ = `Array.from(document.querySelectorAll("#dlg .foot .ab-cr"))
  .map(e => e.innerHTML.split("<br>")[0].split("Gwiazda. ").slice(1).join("Gwiazda. "))`;

/** What Windows itself is asking for, read where no page can reach: 1 is light, absent is dark. */
function windowsAsks() {
  const out = String(execFileSync("powershell.exe", ["-NoProfile", "-NonInteractive", "-Command",
    "(Get-ItemProperty -Path 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Themes"
    + "\\Personalize' -Name AppsUseLightTheme -ErrorAction SilentlyContinue).AppsUseLightTheme"],
    { encoding: "utf8", timeout: 60000 })).trim();
  return out === "1" ? "light" : "dark";
}

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const SCRATCH = path.join(ROOT, "scratch", "settings-screen");

/* A NET LOG IS WRITTEN OUT AT A CLEAN EXIT, NOT BEFORE (board 805 c). Chromium writes the header
 * at once and holds the events in a buffer, so a log read while the window runs, or after the
 * window is killed, is a header over an empty list: measured 2026-09-26, 0 events at ready, 0
 * three seconds later and 0 after a kill, against 13 once the same build closed cleanly. An empty
 * list and a quiet start then read alike, and anything the window did at idle sits in the unwritten
 * tail where no leg can see it. So `closed` says whether the file parsed WHOLE, which only a log
 * Chromium finished writing does; the repair below (a missing "]}" put back) is kept for the
 * control arm, whose one job is to show that discovery happens, and a truncated log that shows it
 * still shows it. */
function readNetLog(filePath) {
  if (!fs.existsSync(filePath)) return null;
  let raw = "";
  try { raw = fs.readFileSync(filePath, "utf8"); } catch { return null; }
  let doc = null, closed = false;
  try { doc = JSON.parse(raw); closed = true; }
  catch {
    try { doc = JSON.parse(raw.replace(/,\s*$/, "") + "]}"); } catch { doc = null; }
  }
  if (!doc || !doc.constants || !doc.constants.logEventTypes || !Array.isArray(doc.events)) {
    return null;
  }
  const T = {};
  for (const k of Object.keys(doc.constants.logEventTypes)) {
    T[doc.constants.logEventTypes[k]] = k;
  }
  const hosts = new Set();
  let pacDeciderCount = 0;
  let ipv6CheckCount = 0;
  for (const ev of doc.events) {
    const name = T[ev.type] || "";
    if (name.indexOf("PAC_FILE_DECIDER") >= 0) pacDeciderCount++;
    if (name === "HOST_RESOLVER_MANAGER_IPV6_REACHABILITY_CHECK") ipv6CheckCount++;
    if (ev.params && ev.params.host) hosts.add(String(ev.params.host));
  }
  return {
    closed,
    eventsCount: doc.events.length,
    hosts: [...hosts],
    pacDeciderCount,
    ipv6CheckCount,
    hasWpad: [...hosts].some(h => /wpad/i.test(h)),
  };
}

/* One window of a net-log arm: open, idle, close the way a person closes it, and only then read.
 * The close is CDP Browser.close, which lets Chromium finish the log; the door's own shut() is a
 * kill, which does not, and it runs after as the fallback that takes down whatever is left. The
 * answer says whether the main process ended by itself within the bound, and the log is read
 * after shut() has returned, so the file is never read while anything still writes it. */
const IDLE_MS = 1500;
async function netLogArm(who, opts, logAt) {
  const s = await openStudio(who, opts);
  let exitedAlone = false;
  try {
    await sleep(IDLE_MS);
    const gone = new Promise(r => {
      if (s.child.exitCode !== null) r(true);
      else s.child.once("exit", () => r(true));
    });
    try { await s.browser.close(); } catch (e) { /* judged by the exit below, not by the call */ }
    exitedAlone = await Promise.race([gone, sleep(15000).then(() => false)]);
  } finally {
    await s.shut();
  }
  return { log: readNetLog(logAt), exitedAlone, code: s.child.exitCode };
}

let asserted = 0, failed = 0, notRun = 0;
function check(cond, line) {
  asserted++;
  if (cond) process.stdout.write("  ok   " + line + "\n");
  else { failed++; process.stderr.write("  FAIL " + line + "\n"); }
}
const sleep = ms => new Promise(r => setTimeout(r, ms));

/* COUNTS:PREDICATES
   Members that must be there, in order where the order is the claim.
   One more member still passes. A missing member is named. A floor stays
   where a scanner that saw nothing would otherwise pass. */
function missingMembers(seen, required, ordered) {
  const have = (seen || []).map(s => String(s));
  if (!ordered) return required.filter(name => have.indexOf(String(name)) < 0);
  let from = 0;
  const missing = [];
  for (const name of required) {
    const at = have.indexOf(String(name), from);
    if (at < 0) missing.push(name);
    else from = at + 1;
  }
  return missing;
}

function settingsFitHeld(fit) {
  const missing = [];
  if (fit.vw !== 900) missing.push("width " + fit.vw);
  if ((fit.rows || 0) < 2) missing.push("General's rows under 2");
  if (!(fit.navW > 0)) missing.push("no section list");
  if (fit.wide) missing.push("the page scrolls sideways");
  if (fit.past) missing.push(fit.past + " row(s) past the window");
  return { ok: missing.length === 0, missing };
}
const THEME_VALUES = ["light", "dark", "system*"];
function themeValuesHeld(values) {
  const missing = missingMembers(values, THEME_VALUES, true);
  return { ok: missing.length === 0, missing };
}
const THEME_WORDS = ["Light", "Dark", "System"];
function themeWordsHeld(words) {
  const missing = missingMembers(words, THEME_WORDS, true);
  return { ok: missing.length === 0, missing };
}
const LANG_ROWS = ["en:English*", "pl:Polski"];
function langRowsHeld(rows) {
  const missing = missingMembers(rows, LANG_ROWS, true);
  return { ok: missing.length === 0, missing };
}
const SETTINGS_ABOUT = ["About Etiuda Studio"];
function settingsAboutHeld(btns) {
  const missing = missingMembers(btns, SETTINGS_ABOUT, true);
  if ((btns || []).indexOf("Apply") >= 0) missing.push("Apply on the page");
  return { ok: missing.length === 0, missing };
}
/* COUNTS:END */

async function main(argv) {
  const keep = argv.indexOf("--keep") >= 0;
  clearScratch(SCRATCH);
  const projects = path.join(SCRATCH, "projects");
  fs.mkdirSync(projects, { recursive: true });

  /* 0b's TWO ARMS ARE TWINS, one property apart: the switch. Each opens on a profile of its own,
     idles, closes cleanly and is read afterwards (netLogArm). The control shows that on this desk
     a start WITHOUT the switch does proxy discovery, which is what gives the main arm's silence a
     meaning; the main arm is the shipped start. Neither is the window the rest of this suite
     drives, so 0a below still meets a fresh profile. */
  const controlNetLog = path.join(SCRATCH, "netlog-control.json");
  const control = await netLogArm("tests/settings-screen.mjs control", {
    projects, userDataDir: path.join(SCRATCH, "ud-control"),
    env: { STUDIO_NO_PROXY_SERVER: "off", STUDIO_NET_LOG: controlNetLog },
  }, controlNetLog);
  const netLogPath = path.join(SCRATCH, "netlog.json");
  const shipped = await netLogArm("tests/settings-screen.mjs net log", {
    projects, userDataDir: path.join(SCRATCH, "ud-netlog"),
    env: { STUDIO_NET_LOG: netLogPath },
  }, netLogPath);
  const plantedArms = {};
  for (const st of ["policy", "manual"]) {
    const plantAt = path.join(SCRATCH, "proxy-plant-" + st + ".json");
    const logAt = path.join(SCRATCH, "netlog-" + st + ".json");
    fs.writeFileSync(plantAt, JSON.stringify({ answers: PROXY_STATES[st].answers }), "utf8");
    plantedArms[st] = await netLogArm("tests/settings-screen.mjs " + st, {
      projects, userDataDir: path.join(SCRATCH, "ud-" + st),
      env: { STUDIO_NET_LOG: logAt, STUDIO_PROXY_PLANT: plantAt },
    }, logAt);
  }

  const studio = await openStudio("tests/settings-screen.mjs", {
    projects, userDataDir: path.join(SCRATCH, "ud"),
  });
  const storeAt = path.join(studio.userDataDir, "studio.json");
  const stored = () => {
    try { return JSON.parse(fs.readFileSync(storeAt, "utf8")).theme || ""; }
    catch (e) { return ""; }
  };

  const windows = windowsAsks();
  let opened = null, hostAsks = "", cycle = [], back = null, after = null, chose = null;
  try {
    const page = studio.page;
    const press = async (sel, ms) => {
      await pressWhen(page, sel, { who: "tests/settings-screen.mjs" });
      await sleep(ms || 300);
    };
    const state = async (js) => JSON.parse(await page.evaluate("JSON.stringify(" + js + ")"));

    /* What the window reports before anything has been chosen, which under themeSource
       "system" is Windows's own answer and is read here as a second opinion on it. */
    hostAsks = await page.evaluate(
      "matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'");
    check(hostAsks === windows,
      "0a a fresh profile opens under the system theme, so the window reports what Windows asks"
      + " for: " + hostAsks + " against the registry's " + windows);

    /* CHROMIUM SWITCHES: where Windows' flags say direct alone, Studio does no proxy discovery, so no wpad lookup and no
       IPv6 probe at idle; the probe still fires on the first hostname lookup (board 803, item 3). Where automatic
       detection is on, Chromium's resolver is left to find an office's proxy. 0b reads which this desk is. */
    /* THE MAIN ARM'S LOG MUST BE WRITTEN OUT: present, parsed whole (Chromium finished it) and
       holding events. A log that is absent, cut off or empty says nothing about what is absent
       from it, and before board 805 c this leg judged exactly such a log, 0 events, as clean.

       A QUIET CONTROL IS NOT RUN, NEVER OK (board 805 d). Where the control shows neither a wpad
       lookup nor a PAC decider, this desk cannot tell the switch's absence from its presence, so
       a clean main arm proves nothing and is counted apart, in the summary line. A main arm that
       does show discovery, or whose log was not written out, fails whatever the control shows,
       because neither needs the control to mean something; a control with no log fails too. */
    const mainLog = shipped.log, controlLog = control.log;
    const written = !!mainLog && mainLog.closed && mainLog.eventsCount > 0;
    const cleanNoProxy = !!mainLog && !mainLog.hasWpad && mainLog.pacDeciderCount === 0
      && mainLog.ipv6CheckCount === 0;
    const controlShows = !!controlLog && (controlLog.hasWpad || controlLog.pacDeciderCount > 0);
    const said = JSON.stringify({
      main: mainLog ? { closed: mainLog.closed, events: mainLog.eventsCount, hosts: mainLog.hosts,
        pacDecider: mainLog.pacDeciderCount, ipv6Checks: mainLog.ipv6CheckCount,
        exitedAlone: shipped.exitedAlone } : null,
      control: controlLog ? { closed: controlLog.closed, events: controlLog.eventsCount,
        hosts: controlLog.hosts, pacDecider: controlLog.pacDeciderCount } : null,
    });
    const shippedShows = !!mainLog && (mainLog.hasWpad || mainLog.pacDeciderCount > 0);
    /* NO ORACLE READS THIS DESK'S REGISTRY: a test run reads no part of it, and the reg-stand mark means a stand-in, never
       the registry behind one (the test architect, 2026-11-16). The oracle's rule for each state is tests/win-proxy-oracle.mjs,
       the pinned win-proxy.cjs answered from planted reg text (a proxy by policy, a manual proxy with an exception list, no proxy,
       automatic detection), proved in node per state. The arms here run on the real shell, whose state this leg cannot plant,
       so the state is read off Chromium's own behaviour: a main arm that discovers is automatic detection, one that is silent
       against a control that discovers is "no proxy", and a named proxy cannot be seen from here. */
    const stateSeen = shippedShows ? "automatic" : "none";
    const told = said + " the state read off Chromium's behaviour is " + stateSeen + ": " + PROXY_STATES[stateSeen].means;
    if (!written) {
      check(false, "0b the main arm's net log was written out at a clean close: " + told);
    } else if (!controlLog || !controlShows) {
      notRun++;
      process.stdout.write("  --   0b NOT RUN: the control arm, started without the switch, shows"
        + " neither a wpad lookup nor a PAC decider on this desk, so the shipped start proves"
        + " nothing here: " + told + "\n");
    } else if (stateSeen === "automatic") {
      check(shippedShows,
        "0b where this desk leaves automatic detection on, Studio discovers as its control does, so an office's proxy"
        + " is found: " + told);
    } else {
      check(cleanNoProxy,
        "0b at start, where proxies are off, Studio does no proxy discovery, so there is no wpad lookup and no IPv6 probe"
        + " at idle, against a control that does discover: " + told);
    }
    /* The policy and manual proxy states, planted into the real shell through STUDIO_PROXY_PLANT: each opens on its own
       profile, idles, closes cleanly and is judged against what the state means (no WPAD, no PAC decider, no IPv6 probe). */
    for (const st of ["policy", "manual"]) {
      const arm = plantedArms[st];
      const log = arm && arm.log;
      const armWritten = !!log && log.closed && log.eventsCount > 0;
      const armNoDiscovery = !!log && !log.hasWpad && log.pacDeciderCount === 0 && log.ipv6CheckCount === 0;
      const armSaid = JSON.stringify(log ? { closed: log.closed, events: log.eventsCount, hosts: log.hosts,
        pacDecider: log.pacDeciderCount, ipv6Checks: log.ipv6CheckCount, exitedAlone: arm.exitedAlone } : null);
      check(armWritten && armNoDiscovery,
        "0b (" + st + ") " + PROXY_STATES[st].means + ": " + armSaid);
    }


    /* ---- 1. the Settings tab behind the Menu button ---------------------------------------- */
    const screenEn = await page.evaluate("document.body.innerText");
    /* THE MENU IS A LIST SINCE 2026-10-06 (S1): Settings is its first row, and the About's row
       wears the version (1l). SETTINGS IS A TAB OF SECTIONS SINCE BOARD 965 (Max, 2026-11-08
       01:20 and 01:23): each section is pressed in the list and its page read. */
    await press("#btnMenu", 300);
    await settleOn(page, '((document.querySelector("#menuList [data-act=\\"about\\"] small") || {}).textContent || "").trim() !== ""', { bound: 30000 });
    const badge = await state(`(document.querySelector('#menuList [data-act="about"] small') || {}).textContent || ""`);
    await press('#menuList [data-act="settings"]', 400);
    await settleOn(page, '(window.STUDIO_READY || {}).screen === "settings-tab" && document.querySelector("#scrim").hidden', { bound: 30000 });
    const section = async (id) => {
      await press('.sx-nav [data-act="sx-sec"][data-v="' + id + '"]', 300);
      await settleOn(page, '!!document.querySelector(\'.sx-nav [data-v="' + id + '"][aria-current="page"]\')', { bound: 30000 });
    };
    opened = await state(`{
      screen: window.STUDIO_READY.screen,
      cover: window.STUDIO_READY.cover,
      scrim: !document.querySelector("#scrim").hidden,
      h1: (document.querySelector(".sx-nav h1, .sx-nav .grp") || {}).textContent || "",
      tab: Array.from(document.querySelectorAll("#tabs .tab.screen")).map(e => e.textContent.trim()
        + (e.getAttribute("aria-current") === "page" ? "*" : "")),
      tabNm: (() => {
        const el = document.querySelector("#tabs .tab.screen .nm");
        if (!el) return null;
        const b = el.getBoundingClientRect();
        return { width: Math.round(b.width), height: Math.round(b.height), text: el.textContent.trim() };
      })(),
      sections: Array.from(document.querySelectorAll('.sx-nav [data-act="sx-sec"]')).map(e => e.getAttribute("data-v")),
    }`);
    for (const id of opened.sections) {
      await section(id);
      if (id === "general") Object.assign(opened, await state(`{
        root: (document.querySelector('#main [data-row="root"] .mono') || {}).textContent || "",
        langs: Array.from(document.querySelectorAll('#main [data-act="set-lang"]'))
          .map(e => e.getAttribute("data-v") + ":" + e.textContent + (e.classList.contains("on") ? "*" : "")),
      }`));
      if (id === "appearance") Object.assign(opened, await state(`{
        values: Array.from(document.querySelectorAll('#main [data-act="set-theme"]'))
          .map(e => e.getAttribute("data-v") + (e.classList.contains("on") ? "*" : "")),
        words: Array.from(document.querySelectorAll('#main [data-act="set-theme"]')).map(e => e.textContent),
        note: (document.querySelector('#main [data-row="theme"] .t small') || {}).textContent || "",
      }`));
      if (id === "teams") Object.assign(opened, await state(`{
        signing: (document.querySelector('#main [data-row="key"] .c') || {}).textContent || "",
      }`));
      if (id === "about") opened.about = await state(`Array.from(document.querySelectorAll("#main .sx-page .btn")).map(e => e.textContent)`);
    }
    /* The trademark notice is the About's since 2026-10-06, reached from Settings' About page. */
    await press('#main [data-act="about"]', 400);
    await settleOn(page, 'Array.from(document.querySelectorAll("#dlg p, #dlg span")).some(e => /Etiuda/.test(e.textContent))', { bound: 30000 });
    opened.tm = await state(TM_READ);
    opened.version = badge;
    await press('#dlg [data-act="cover-close"]', 300);
    opened.back = await state(`(window.STUDIO_READY || {}).screen`);
    check(opened.screen === "settings-tab" && !opened.cover && !opened.scrim && opened.h1 === "Settings"
          && opened.tab.join() === "Settings*" && opened.back === "settings-tab"
          && opened.tabNm && opened.tabNm.text === "Settings" && opened.tabNm.width >= 40 && opened.tabNm.height > 0,
      "1a the Menu button opens Settings as a tab named Settings, in front, with no cover (board 965), its name visible ("
      + (opened.tabNm ? opened.tabNm.width + "x" + opened.tabNm.height + "px" : "missing") + "), and the About's cover"
      + " closes back to it: " + JSON.stringify({ tab: opened.tab, tabNm: opened.tabNm, h1: opened.h1, back: opened.back }));
    /* AT STUDIO'S OWN MINIMUM the section list and the page share the window's width and the page
       scrolls down rather than sideways, so a row added later is one scroll away, never cut. */
    await page.setViewport({ width: 900, height: 560 });
    await sleep(400);
    await section("general");
    const fit = await state(`(() => {
      const nav = document.querySelector(".sx-nav"), pg = document.querySelector(".sx-page");
      const rows = Array.from(document.querySelectorAll("#main .sx-row"));
      const nm = document.querySelector("#tabs .tab.screen .nm");
      const nb = nm ? nm.getBoundingClientRect() : null;
      return { vw: innerWidth, vh: innerHeight, navW: nav ? Math.round(nav.getBoundingClientRect().width) : 0,
               wide: pg ? pg.scrollWidth > pg.clientWidth + 1 : true,
               rows: rows.length, past: rows.filter(r => r.getBoundingClientRect().right > innerWidth + 1).length,
               tabNm: nb ? { width: Math.round(nb.width), height: Math.round(nb.height) } : null };
    })()`);
    const fit1 = settingsFitHeld(fit);
    check(fit1.ok && fit.tabNm && fit.tabNm.width >= 40 && fit.tabNm.height > 0,
      "1b2 at Studio's own " + fit.vw + "x" + fit.vh + " minimum the section list (" + fit.navW + "px) and the page fit"
      + " side by side, the Settings tab's name visible (" + (fit.tabNm ? fit.tabNm.width + "x" + fit.tabNm.height + "px" : "missing") + "), the page scrolling no way but down and no row running past the window"
      + (fit1.missing.length ? ", missing " + fit1.missing.join(", ") : ""));
    await page.setViewport({ width: 1299, height: 891 });
    await sleep(400);

    check(opened.root === projects,
      "1c the Library folder's row names the folder the projects live in, as the shell reports it: "
      + JSON.stringify(opened.root) + " against " + JSON.stringify(projects));
    const theme1 = themeValuesHeld(opened.values);
    check(theme1.ok,
      "1d the theme's values are there with the desk's own choice marked, which on a"
      + " profile nobody has touched is system"
      + (theme1.missing.length ? ", missing " + theme1.missing.join(", ") : "")
      + ": " + JSON.stringify(opened.values));
    const words1 = themeWordsHeld(opened.words);
    check(words1.ok
      && opened.note === "System follows your computer's own setting.",
      "1e in the engine's own words, the hint included"
      + (words1.missing.length ? ", missing " + words1.missing.join(", ") : "")
      + ": " + JSON.stringify(opened.words) + " "
      + JSON.stringify(opened.note));
    /* THE LANGUAGE NAMES ARE NOT TRANSLATED AND MUST NOT BE, which is the engine's own practice
       in the same control: each language is named in itself, so neither name moves when the
       interface does. */
    const langs1 = langRowsHeld(opened.langs);
    check(langs1.ok,
      "1f the interface language offers the languages Studio has a table for, each named in"
      + " itself, with this desk's own marked"
      + (langs1.missing.length ? ", missing " + langs1.missing.join(", ") : "")
      + ": " + JSON.stringify(opened.langs));
    /* THE SIGNING KEY'S ROW READS THE FILE, not a page variable, so the leg is driven twice on
       one window: the profile this gate makes has no key file, and then one is made beside it
       and the window is opened again. A row that painted an empty state whatever the disk held
       would pass the first half and fail the second. */
    check(/^no signing key yet/.test(opened.signing),
      "1i with no key file beside this profile the signing row says so: "
      + JSON.stringify(opened.signing));
    const foot1 = settingsAboutHeld(opened.about);
    check(foot1.ok,
      "1h no Apply, because every choice here takes effect as it is made; the About's door on the About page"
      + (foot1.missing.length ? ", missing " + foot1.missing.join(", ") : "")
      + ": " + JSON.stringify(opened.about));
    const PKG = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8"));
    check(opened.version === PKG.version,
      "1l Studio shows its own version on screen, on the Menu's About row: "
      + JSON.stringify(opened.version));
    await section("appearance");

    /* ---- 2. the button cycles two values, never three -------------------------------------- */
    /* FOUR PRESSES, because the fault ruled out is a third stop: a cycle of three would show it
       on the third press at the latest, and a fourth proves the two-stop cycle repeats rather
       than drifting. The screen is left on Settings so that each press can be read off the
       control as well as off the document. */
    for (let i = 0; i < 4; i++) {
      await press("#btnTheme", 300);
      await settleOn(page, 'document.documentElement.getAttribute("data-theme") !== ""', { bound: 30000 });
      cycle.push(await state(`{
        doc: document.documentElement.getAttribute("data-theme"),
        on: (document.querySelector('#main [data-act="set-theme"].on') || {}).getAttribute
          ? document.querySelector('#main [data-act="set-theme"].on').getAttribute("data-v") : "",
      }`));
      cycle[cycle.length - 1].store = stored();
    }
    const docs = cycle.map(c => c.doc);
    const first = windows === "dark" ? "light" : "dark";
    const want = [first, first === "dark" ? "light" : "dark"];
    check(docs.join(",") === [want[0], want[1], want[0], want[1]].join(","),
      "2a four presses give two values and no third: " + JSON.stringify(docs)
      + " with Windows asking for " + windows);
    check(cycle.every(c => c.store === c.doc) && cycle.every(c => c.store !== "system"),
      "2b each press is stored as the value it painted and system is never among them: "
      + JSON.stringify(cycle.map(c => c.store)));
    check(cycle.every(c => c.on === c.doc),
      "2c and the Settings control follows the button press by press: "
      + JSON.stringify(cycle.map(c => c.on)));

    /* ---- 3. system is reachable through the Settings tab ----------------------------------- */
    await press('#main [data-act="set-theme"][data-v="system"]', 400);
    await settleOn(page, '((document.querySelector("#main [data-act=\\"set-theme\\"].on") || {}).textContent || "").trim() === "System"', { bound: 30000 });
    back = await state(`{
      doc: document.documentElement.getAttribute("data-theme"),
      on: (document.querySelector('#main [data-act="set-theme"].on') || {}).textContent || "",
    }`);
    back.store = stored();
    check(back.store === "system" && back.doc === windows && back.on === "System",
      "3a the Settings tab puts system back, which the button cannot: stored " + JSON.stringify(back.store)
      + " and the page painted " + back.doc + " with Windows itself asking for " + windows);

    /* THE CONTROL FOR 3a. A page that could only ever paint what Windows asks for would pass 3a
       without following anything, so the other value is chosen explicitly and the page is read
       disagreeing with the registry on purpose. */
    await press('#main [data-act="set-theme"][data-v="' + (windows === "dark" ? "light" : "dark")
      + '"]', 400);
    await settleOn(page, 'document.documentElement.getAttribute("data-theme") === ' + JSON.stringify(windows === "dark" ? "light" : "dark"), { bound: 30000 });
    after = await state(`document.documentElement.getAttribute("data-theme")`);
    check(after !== windows,
      "3b control: with the other value chosen the page disagrees with Windows on purpose ("
      + after + " against " + windows + "), so 3a's agreement is the choice being followed and"
      + " not the only thing this screen can paint");
    /* ---- 4. the band's two buttons wear a glyph and keep their word ------------------------ */
    /* THE ONE PLACE A GLYPH REPLACED A WORD rather than joining it, so it is the one place where
       a missing drawing would cost a person something: an empty button. tests/icons.mjs holds
       every name ui/app.js asks for against the folder, which is the static half; this is the
       painted half, read off the window. The theme button's glyph names the theme it WOULD give,
       so on a dark page it is theme-light and one press later it is theme-dark. */
    await press('#main [data-act="set-theme"][data-v="dark"]', 400);
    await settleOn(page, 'document.documentElement.getAttribute("data-theme") === "dark"', { bound: 30000 });
    const band = await state(`{
      theme: { svg: document.querySelectorAll("#btnTheme svg").length,
               paths: document.querySelectorAll("#btnTheme svg *").length,
               word: document.querySelector("#btnTheme").textContent,
               title: document.querySelector("#btnTheme").title,
               label: document.querySelector("#btnTheme").getAttribute("aria-label") },
      menu: { svg: document.querySelectorAll("#btnMenu svg").length,
              title: document.querySelector("#btnMenu").title },
      lit: document.querySelector("#btnTheme svg").outerHTML,
    }`);
    await press("#btnTheme", 400);
    await settleOn(page, '!!document.querySelector("#btnTheme svg")', { bound: 30000 });
    const flipped = await state(`document.querySelector("#btnTheme svg").outerHTML`);
    check(band.theme.svg === 1 && band.theme.paths > 0 && band.menu.svg === 1,
      "4a both band buttons carry one drawn glyph: " + band.theme.paths + " element(s) in the"
      + " theme button's");
    check(band.theme.word === "" && band.theme.title === "Theme" && band.theme.label === "Theme"
      && band.menu.title === "Menu",
      "4b with the word kept as the tooltip and the accessible name rather than dropped: "
      + JSON.stringify(band.theme.title) + " and " + JSON.stringify(band.menu.title));
    check(flipped !== band.lit,
      "4c and the theme button's glyph is the theme it would give, so it is a different drawing"
      + " after the press");

    /* ---- 5. the interface language is a choice that survives the window --------------------
     *
     * THE ORACLE IS THE STORE AND THEN A SECOND LAUNCH, for the reason the theme's is: a control
     * that painted the choice without keeping it would look right for exactly one session. What
     * the SCREENS then paint is ui/lang.js's business and not this control's - a screen whose
     * words have no Polish stays English on a Polish desk - so this section reads the choice and
     * never the words.
     */
    await section("general");
    await press('#main [data-act="set-lang"][data-v="pl"]', 500);
    await settleOn(page, '((document.querySelector("#main [data-act=\\"set-lang\\"].on") || {}).getAttribute("data-v") || "") === "pl"', { bound: 30000 });
    chose = await state(`{
      on: (document.querySelector('#main [data-act="set-lang"].on') || {}).getAttribute
        ? document.querySelector('#main [data-act="set-lang"].on').getAttribute("data-v") : "",
      screen: window.STUDIO_READY.screen,
    }`);
    try { chose.store = JSON.parse(fs.readFileSync(storeAt, "utf8")).lang || ""; }
    catch { chose.store = ""; }
    check(chose.on === "pl" && chose.store === "pl" && chose.screen === "settings-tab",
      "5a choosing Polski marks the control and is kept in the shell's own store, the Settings tab"
      + " staying in front: " + JSON.stringify(chose));

    /* ---- 6. the trademark notice, at the About's foot and nowhere behind it --------------------
       The shape is asked rather than the sentence, so the word a registration adds leaves this
       leg standing. The control is the screen behind the cover, read in each language. The About
       took the notice from Settings' foot on 2026-10-06 and is reached from Settings' About page. */
    await section("about");
    await press('#main [data-act="about"]', 400);
    await settleOn(page, 'Array.from(document.querySelectorAll("#dlg p, #dlg span")).some(e => /znakiem/.test(e.textContent) || /Etiuda/.test(e.textContent))', { bound: 30000 });
    const tmPl = await state(TM_READ);
    await press('#dlg [data-act="cover-close"]', 400);
    await settleOn(page, 'document.querySelector("#scrim").hidden', { bound: 30000 });
    const screenPl = await page.evaluate("document.body.innerText");
    const TM_EN = /^Etiuda is a (registered )?trademark of (?:Max|Maxim) Gwiazda\.$/;
    const TM_PL = /^Etiuda jest (zarejestrowanym )?znakiem towarowym (?:Maxa|Maxima) Gwiazdy\.$/;
    check(opened.tm.length === 1 && TM_EN.test(opened.tm[0])
          && tmPl.length === 1 && TM_PL.test(tmPl[0]),
      "6a the About's foot carries the trademark notice once, after the copyright, in each language: "
      + JSON.stringify(opened.tm) + " " + JSON.stringify(tmPl));
    const bare = (t) => !/trademark|znakiem towarowym/.test(t);
    check(bare(screenEn) && bare(screenPl) && screenEn.length > 0 && screenPl !== screenEn,
      "6b control: the screen behind the cover carries it in neither language ("
      + screenEn.length + " and " + screenPl.length + " characters read, and they differ)");
  } finally {
    await studio.shut();
  }
  await sleep(300);

  /* THE SECOND LAUNCH, ON THE SAME PROFILE. Nothing in the environment says anything about a
     language here - the door removes every STUDIO_ the call does not set - so a window that
     opens with the choice opened with it from the store. */
  const again = await openStudio("tests/settings-screen.mjs", {
    projects, userDataDir: path.join(SCRATCH, "ud"),
  });
  try {
    const kept = JSON.parse(await again.page.evaluate(`JSON.stringify({
      host: null, lang: window.STUDIO_T.lang(), ready: window.STUDIO_T.ready() })`));
    await pressWhen(again.page, "#btnMenu", { who: "tests/settings-screen.mjs" });
    await pressWhen(again.page, '#menuList [data-act="settings"]', { who: "tests/settings-screen.mjs" });
    await settleOn(again.page, '!!document.querySelector(\'#main [data-act="set-lang"].on\')', { bound: 30000 });
    kept.on = await again.page.evaluate(
      `(document.querySelector('#main [data-act="set-lang"].on') || {}).getAttribute
        ? document.querySelector('#main [data-act="set-lang"].on').getAttribute("data-v") : ""`);
    check(kept.on === "pl",
      "5b and a second launch on the same profile opens with it chosen, with no variable set"
      + " anywhere: " + JSON.stringify(kept));
  } finally { await again.shut(); }
  await sleep(300);

  /* THE THIRD LAUNCH, WITH A KEY FILE BESIDE IT. 1i read the empty state; this reads the other
     one, and it is a different window with a different environment rather than the same page
     told to repaint, because what is being proved is that the row reads a FILE. The key is made
     by src/sign.mjs into the scratch folder and pointed at by STUDIO_SIGNING_KEY, so nothing
     touches the profile an installed Studio would use. */
  const keyAt = path.join(SCRATCH, "signing-key.json");
  const madeKey = await makeKeyFile({ passphrase: "a passphrase this gate invents" });
  /* polish 04, item 21: the window opens on a key file that is not a key, and the real one is
     written while it is open, as the command line would write it. */
  fs.writeFileSync(keyAt, "{ not a key", "utf8");
  const third = await openStudio("tests/settings-screen.mjs", {
    projects, userDataDir: path.join(SCRATCH, "ud"), env: { STUDIO_SIGNING_KEY: keyAt },
  });
  try {
    await pressWhen(third.page, "#btnMenu", { who: "tests/settings-screen.mjs" });
    await pressWhen(third.page, '#menuList [data-act="settings"]', { who: "tests/settings-screen.mjs" });
    await pressWhen(third.page, '.sx-nav [data-act="sx-sec"][data-v="teams"]', { who: "tests/settings-screen.mjs" });
    await settleOn(third.page, '((document.querySelector(\'#main [data-row="key"]\') || {}).textContent || "").indexOf("signing-key.json") >= 0', { bound: 30000 });
    const broken = await third.page.evaluate(`((document.querySelector('#main [data-row="key"]') || {}).textContent || "")
      .split(String.fromCharCode(10)).join(" ")`);
    check(broken.indexOf("signing-key.json") >= 0 && broken.indexOf(SCRATCH) < 0
          && !/no signing key yet|not JSON/.test(broken),
      "1k a key file that is not a key says so by the file's name, not as no key and not as a"
      + " sentence carrying the whole path: " + JSON.stringify(broken));
    fs.writeFileSync(keyAt, JSON.stringify(madeKey, null, 1) + "\n", "utf8");
    /* G1 (2026-10-07 20:45): the key is printed as the desks compare it, its 16 hex in fours after Studio's disc. */
    const fours = madeKey.keyId.replace(/^studio-/, "").replace(/(.{4})(?=.)/g, "$1 ");
    await pressWhen(third.page, "#btnMenu", { who: "tests/settings-screen.mjs" });
    await pressWhen(third.page, '#menuList [data-act="settings"]', { who: "tests/settings-screen.mjs" });
    await settleOn(third.page, '((document.querySelector(\'#main [data-row="key"] .ksig\') || {}).textContent || "").indexOf(' + JSON.stringify(fours) + ') >= 0', { bound: 30000 });
    const shown = await third.page.evaluate(`((document.querySelector('#main [data-row="key"] .ksig') || {}).textContent || "").trim()`);
    const fields = await third.page.evaluate(
      `document.querySelectorAll("#main .sx-page input, #main .sx-page textarea").length`);
    check(shown === fours && fields === 0,
      "1j and with a key file written beside the profile while the window is open, the row"
      + " shows that key in fours when Settings is asked for again, still with no field on the page: "
      + JSON.stringify(shown) + " against the file's "
      + JSON.stringify(fours));
  } finally { await third.shut(); }
  await sleep(300);

  if (!keep) dropScratch(SCRATCH, "settings-screen");
  /* NOT RUN IS NOT A PASS (boards 803 and 819, folded into one harness item with the engine's
     tests/desk.js on 2026-09-29). 0b's quiet control, which is any machine with Windows'
     "Automatically detect settings" off, used to exit 0, so npm test and every release gate over it
     went green having proved nothing about the proxy. A run with a leg not run and nothing failed
     now exits 78, no verdict, and says why; a failure still exits 1, since a red is a verdict. */
  if (!failed && notRun)
    process.stdout.write("  SUITE DID NOT COMPLETE: " + notRun + " leg(s) not run, and a leg not run is not a pass;"
      + " for 0b, turn on Windows' \"Automatically detect settings\" (Settings, Network, Proxy) so the"
      + " control without the switch discovers, and run again\n");
  process.stdout.write("settings-screen  " + asserted + " assertion(s), " + failed + " failure(s), "
    + notRun + " not run\n");
  process.exit(failed ? 1 : (notRun ? 78 : 0));
}

main(process.argv.slice(2)).catch(e => {
  process.stderr.write("settings-screen  " + (e && e.stack ? e.stack : String(e)) + "\n");
  process.exit(2);
});
