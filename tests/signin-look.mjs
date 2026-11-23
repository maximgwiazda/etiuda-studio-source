/* FOUR LOOK EDITS OF THE SIGN-IN SWEEP (the product designer's headless sweep of Studio on main 63ac9823, 2026-11-12 19:12).
 *
 *     node tests/signin-look.mjs
 *
 * Headless Chrome on ui/index.html and ui/app.js with window.STUDIO stubbed, as her sweep drives them; no Electron window.
 * What the eye sees:
 *   L1 the Remove cover (decisions 27 and 29): every sentence in its body starts under the heading's first letter, in each of its
 *      four forms (all three lines, a kept admission, a desk not signed in, a lead who stays)
 *   L2 the door after "not allowed by the organisation": its one solid button is the desk's "Use another account" (EN and PL, the
 *      engine's own words), and pressing it brings back the providers' buttons, so another account can be chosen
 *   L3 the Team screen of a signed-in lead: the people list's Admit buttons and the Members table's Remove buttons share one
 *      right edge (within a pixel)
 *   L4 the same pane: no label's ground patch touches what stands above it (the pane's hairline, the dashed box, the list)
 * Each leg was red on main 63ac9823 before the edit it guards.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-core";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const URL_ = "file:///" + path.join(ROOT, "ui", "index.html").replace(/\\/g, "/");
const executablePath = [process.env.ETIUDA_CHROME, "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe", "/usr/bin/google-chrome", "/usr/bin/chromium",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"].filter(Boolean).find((p) => fs.existsSync(p));
if (!executablePath) { process.stderr.write("No Chrome browser found to drive\n"); process.exit(1); }

let checks = 0, fails = 0;
function check(ok, line, detail) {
  checks++;
  if (!ok) fails++;
  process.stdout.write((ok ? "  ok   " : "  FAIL ") + line + (!ok && detail !== undefined ? ": " + JSON.stringify(detail) : "") + "\n");
}

/* The page's world, invented: a catalog, its team of two in a shared folder, a lead signed in with Microsoft. */
const OPEN = { dir: "C:/studio/harbour", name: "Harbour lamps", fileName: null,
  project: { id: "p-harbour", rev: 0, edition: "", draft: "draft.json", folder: null, displayName: "Harbour lamps", opened: "2026-11-12T01:45:20.910Z" },
  draft: { format: 2, kind: "etiuda-catalog", id: "p-harbour", rev: 0, langs: [{ code: "en", label: "English" }, { code: "pl", label: "Polski" }], commentLang: "en", tags: [], cards: [], minEngine: "2.0.0" },
  cloud: "", counts: { cards: 0, intents: 0, cats: 0 }, langs: { builtIn: ["en", "pl"], refusesOthers: false, reads: "en, pl", commentLang: "en", of: { cards: 0, intents: 0, cats: 0 }, rows: [] },
  editions: [], lint: { errors: 0, warnings: 0, awaiting: 0, suggestions: 0, ends: 0, rows: [] }, awaiting: [], tokens: [], likely: {}, looks: {}, changes: 0, linked: null };
const DESKS = { error: null, folder: "S:/teams/north-quay", id: "cat-harbour", mark: null, signing: "k-lead", file: "ours", reason: "", inside: false, keyHeld: true, canKeep: true, restorable: null, requests: [],
  team: { id: "North quay", epoch: 3, sealed: true, lists: true, exportsSealed: true, relay: true, roster: [
    { id: "k-e5c80a17b2e4d856", name: "Ewa", own: "", key: "e5c80a17b2e4d856", admitted: true },
    { id: "k-7d0355e1c95b7f13", name: "Anna (evenings)", own: "Anna K.", key: "7d0355e1c95b7f13", admitted: true }] } };
const CATALOGS = [{ id: "harbour", name: "Harbour lamps", dir: "C:/studio/harbour", rev: 0, counts: { cards: 0 }, langs: ["en", "pl"], changes: 0, checks: 0, opened: "2026-11-11T10:00:00.000Z", edited: "2026-11-10T10:00:00.000Z" }];
const SIGNED = { error: null, licence: { status: "active" }, by: "signin", provider: "microsoft", signIn: ["microsoft", "google"], signinCode: "7K3MQ9TV2XRBHN4W", checkedAt: Date.now() - 40 * 60000 };
const SEATS = { error: null, counts: { lead: { held: 2, of: 3 } }, seats: [{ code: "7K3MQ9TV2XRBHN4W", you: true, proved: "2026-11-03" }, { code: "D4WPL8YC6FJS3ZQA", proved: "2026-11-09" }] };
/* Moved for board 1017: the shell hands the page each person by pseudonym, never a code, with the name and address the service gives once added. */
const PEOPLE = { error: null, people: [{ person: "a1".repeat(32), signedIn: "2026-11-12", name: "Ada", address: "ada@example.com" }, { person: "b2".repeat(32), signedIn: "2026-11-10", added: false }] };
const RM = {
  all: { lic: { ...SIGNED, signinOwner: true }, removal: { "k-7d0355e1c95b7f13": { computers: 2, scope: "licence", lead: true, code: "D4WPL8YC6FJS3ZQA" } } },
  kept: { lic: SIGNED, removal: { "k-7d0355e1c95b7f13": { computers: 1, scope: "kept" } } },
  unsigned: { lic: SIGNED, removal: {} },
  leadstays: { lic: SIGNED, removal: { "k-7d0355e1c95b7f13": { computers: 1, scope: "licence", lead: true } } },
};

const W = (ms) => new Promise((r) => setTimeout(r, ms));
async function pageOf(browser, o) {
  const pg = await browser.newPage();
  await pg.setViewport({ width: 1280, height: 900 });
  await pg.evaluateOnNewDocument((catalogs, open, desks, o, seats, people) => {
    const no = () => {};
    const lic = o.lic || { error: null, licence: { status: "none" }, signIn: ["microsoft", "google"] };
    window.STUDIO = new Proxy({
      host: async () => ({ version: "0.1.0", tour: { offered: true, taken: true, at: 0 }, signIn: ["microsoft", "google"], signinDoor: true }),
      projects: async () => ({ root: "C:/studio", projects: catalogs, sample: "" }), teams: async () => ({ teams: [] }),
      open: async () => open, desks: async () => desks, licence: async () => lic, licenceCheck: async () => lic, licenceSeats: async () => seats,
      seatNames: async () => ({ error: null, names: { M2HXC7RK9BTE5VQD: "Ada" } }), peopleList: async () => people,
      licenceSignIn: async () => ({ error: { why: o.signin || "unreached" }, said: { why: o.signin || "unreached" } }),
    }, { get: (t, k) => (k in t ? t[k] : typeof k !== "string" || k === "then" ? undefined : /^on[A-Z]/.test(k) ? no : async () => ({ error: null })) });
  }, CATALOGS, OPEN, { ...DESKS, ...(o.dk || {}) }, o, SEATS, PEOPLE);
  await pg.goto(URL_, { waitUntil: "load" });
  await pg.waitForSelector("#rail", { timeout: 15000 });
  await W(1500);
  await pg.evaluate(() => { document.body.classList.remove("e-launch", "e-launch-out"); document.querySelectorAll(".e-launch-veil").forEach((v) => v.remove()); });
  return pg;
}
const press = (pg, sel) => pg.evaluate((s) => { const e = document.querySelector(s); if (e) e.click(); return !!e; }, sel);
async function toLang(pg, lang) {
  await press(pg, "#btnMenu"); await W(300);
  await press(pg, '#menuList [data-act="settings"]'); await W(500);
  await press(pg, '[data-act="set-lang"][data-v="' + lang + '"]'); await W(500);
  await pg.evaluate(() => { const t = document.querySelector('[data-act="to-projects"]'); t && t.click(); }); await W(500);
}
async function toTeam(pg) {
  await pg.evaluate(() => { const t = document.querySelector('[data-act="to-projects"]'); t && t.click(); }); await W(400);
  await press(pg, '#rail [data-act="home"][data-v="overview"]'); await W(600);
  await press(pg, '#main [data-act="open"]'); await W(1500);
  await press(pg, '#rail [data-act="to-team"]'); await W(1200);
}

const browser = await puppeteer.launch({ executablePath, headless: true, args: ["--hide-scrollbars", "--allow-file-access-from-files"],
  userDataDir: fs.mkdtempSync(path.join(os.tmpdir(), "signin-look-")) });
try {
  /* L1: the left edge of the heading's first letter against each body sentence's, by a Range on the first text node. */
  for (const [form, o] of Object.entries(RM)) {
    const pg = await pageOf(browser, { lic: o.lic, dk: { seats: { signedIn: true, removal: o.removal } } });
    await toTeam(pg);
    const went = await press(pg, '[data-act="member-remove"][data-id="k-7d0355e1c95b7f13"]'); await W(700);
    const m = await pg.evaluate(() => {
      const first = (el) => { const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, { acceptNode: (n) => (n.data.trim() ? 1 : 3) }); const n = w.nextNode();
        if (!n) return null; const r = document.createRange(); r.setStart(n, n.data.search(/\S/)); r.setEnd(n, n.data.search(/\S/) + 1); return r.getBoundingClientRect().left; };
      const h = document.querySelector("#dlg h2"), ledes = [...document.querySelectorAll("#dlg .body .lede")];
      return { h: h ? first(h) : null, ledes: ledes.map((l) => first(l)) };
    });
    const off = m.ledes.map((x) => Math.round((x - m.h) * 10) / 10);
    check(went && m.h != null && m.ledes.length > 0 && off.every((d) => Math.abs(d) <= 0.5),
      "L1 Remove cover (" + form + "): " + m.ledes.length + " sentence(s) start under the heading's first letter", { heading: m.h, offsets: off });
    await pg.close();
  }

  /* L2: the door's answer to the organisation's refusal, in both languages, and what its button does. */
  for (const [lang, word] of [["en", "Use another account"], ["pl", "Użyj innego konta"]]) {
    const pg = await pageOf(browser, { signin: "signin-org" });
    await toLang(pg, lang);
    const pressed = await press(pg, '[data-signin-door] [data-act="lic-signin"][data-v="microsoft"]'); await W(700);
    const b = await pg.evaluate(() => {
      const s = [...document.querySelectorAll("[data-signin-door] .si-acts .btn.solid")];
      return { fact: !!document.querySelector("[data-signin-door] [data-signin-fact]"), solid: s.map((e) => ({ t: e.textContent.trim(), act: e.getAttribute("data-act") })) };
    });
    check(pressed && b.fact && b.solid.length === 1 && b.solid[0].t === word, "L2 door, not allowed (" + lang + "): the solid button reads \"" + word + "\"", b);
    if (b.solid.length === 1) await press(pg, "[data-signin-door] .si-acts .btn.solid"); await W(600);
    const a = await pg.evaluate(() => ({ door: !!document.querySelector("[data-signin-door]"), fact: !!document.querySelector("[data-signin-door] [data-signin-fact]"),
      provs: [...document.querySelectorAll('[data-signin-door] .si-provs [data-act="lic-signin"]')].map((e) => e.getAttribute("data-v")) }));
    check(a.door && !a.fact && a.provs.includes("microsoft") && a.provs.includes("google"),
      "L2 door, not allowed (" + lang + "): its press brings back both providers' buttons, the fact gone", a);
    await pg.close();
  }

  /* L3 and L4: the Team screen of a signed-in lead. */
  {
    const pg = await pageOf(browser, { lic: SIGNED });
    await toTeam(pg);
    const t = await pg.evaluate(() => {
      const right = (sel) => [...document.querySelectorAll(sel)].filter((e) => e.getClientRects().length).map((e) => Math.round(e.getBoundingClientRect().right * 10) / 10);
      const pane = document.querySelector("#main .si-people") && document.querySelector("#main .si-people").closest(".pane");
      const labels = pane ? [...pane.querySelectorAll(".lede")].filter((e) => e.getClientRects().length) : [];
      const patch = labels.map((l) => {
        const cs = getComputedStyle(l), r = l.getBoundingClientRect();
        const ground = cs.backgroundColor !== "rgba(0, 0, 0, 0)" && cs.backgroundColor !== "transparent";
        const spread = ground ? Math.max(0, ...[...cs.boxShadow.matchAll(/(-?\d+(?:\.\d+)?)px\s+(-?\d+(?:\.\d+)?)px\s+(-?\d+(?:\.\d+)?)px\s+(-?\d+(?:\.\d+)?)px/g)].map((m) => Number(m[4]))) : 0;
        /* what stands above: the previous visible sibling, or the pane's heading with its hairline */
        let p = l.previousElementSibling; while (p && !p.getClientRects().length) p = p.previousElementSibling;
        if (!p) { let up = l.parentElement; while (up && up !== pane && !p) { p = up.previousElementSibling; up = up.parentElement; } }
        const above = p ? p.getBoundingClientRect().bottom : pane.getBoundingClientRect().top;
        return { text: l.textContent.trim().slice(0, 24), ground, top: Math.round((r.top - spread) * 10) / 10, above: Math.round(above * 10) / 10 };
      });
      return { admit: right('#main .si-people [data-act="person-admit"]'), remove: right('#main [data-act="member-remove"]'), patch };
    });
    const all = [...t.admit, ...t.remove];
    check(t.admit.length > 0 && t.remove.length > 0 && Math.max(...all) - Math.min(...all) <= 1,
      "L3 Team screen: Admit and Remove share one right edge", { admit: t.admit, remove: t.remove });
    check(t.patch.length >= 3, "L4 Team screen: the pane carries its three labels", t.patch.map((p) => p.text));
    for (const p of t.patch) check(!p.ground || p.top >= p.above + 0.5, "L4 label \"" + p.text + "\": its ground touches nothing above it", p);
    await pg.close();
  }
} finally { await browser.close(); }
process.stdout.write("signin-look: " + (checks - fails) + " of " + checks + (fails ? ", " + fails + " FAILED" : "") + "\n");
process.exit(fails ? 1 : 0);
