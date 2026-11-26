/* A FIRST TEAM FROM THE LIBRARY, A CATALOG TAKEN OFF, AND A FIRST PUBLISH (board 974, C11, C13, C12).
 *
 *     node tests/team-strand.mjs
 *
 * gate-kind: node
 *
 * 974c11   a lead with one catalog and no team presses Make a team on the Library and the team cover opens at once,
 *          asking nothing of a catalog (was: it landed on Team at that catalog's own Make a team)
 * 974c11b  with two catalogs and no team, the same press opens the same cover, with no question about which catalog
 *          (was: it asked which catalog, and each press opened Team at that catalog's Make a team)
 * 974c13   taking the only catalog off a sealed relay team leaves Catalog details matching the disk:
 *          no Part way off, no Writes to row (was: it read no folder chosen yet), and Publish opens the catalog's Team page (was: the place cover)
 * 974c13b  the same, while a second catalog stays on the team
 * 974c13e  a team act failing after its team file lands leaves no stale Part way off, Moving to or Writes to row
 * 974c12   startRelayTeam on a project with no editions: the Team section names the first publish
 *          and offers its press
 * 974c12d  an admitted desk whose team lists a catalog with no edition says it waits for the lead's
 *          first edition, and that catalog is not offered as a linked copy
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { clearScratch, dropScratch } from "./scratch.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const SCRATCH = path.join(ROOT, "scratch", "team-strand");
const NL = "\n";
const ONLY = process.env.TEAM_STRAND_ONLY || "";
const RELAY_FOLDER = "C:\\Users\\lead\\AppData\\Etiuda\\relay\\0123456789abcdef0123456789abcdef";
const FOLDER_SENTENCE = "this catalog has no folder yet: choose the folder the team reads from first";
const FIRST_PUBLISH = "Teammates receive this catalog once it is first published.";
const WAITING = "This Studio waits for the team's lead to publish a first edition.";

let asserted = 0, failed = 0;
function check(cond, line) {
  asserted++;
  if (cond) process.stdout.write("  ok   " + line + NL);
  else { failed++; process.stderr.write("  FAIL " + line + NL); }
}
async function leg(id, fn) {
  if (ONLY && id !== ONLY) return;
  try { await fn(); }
  catch (err) { check(false, id + " (threw: " + String(err && err.message || err).split(NL)[0].slice(0, 240) + ")"); }
}

const vault = {
  available() { return true; },
  seal: (t) => Buffer.from("sealed:" + Buffer.from(String(t)).reverse().toString("hex")),
  open: (b) => Buffer.from(String(Buffer.from(b)).slice(7), "hex").reverse().toString(),
};

function libraryRow(dir, name) {
  return { dir, name, id: "c-" + name.toLowerCase(), counts: { cards: 0 }, rev: 0 };
}
function langsOf() {
  return {
    rows: [{ code: "en", name: "English", primary: true, cards: 0, intents: 0, cats: 0, readable: true }],
    of: { cards: 0, intents: 0, cats: 0 },
    reads: "en, pl",
    commentLang: "en",
  };
}
function opened(dir, name, project) {
  return {
    dir, name,
    project: Object.assign({ id: "c-" + String(name || "").toLowerCase(), folder: null, rev: 0, fileName: "", sealedTeam: null, relay: null, name }, project || {}),
    draft: { tags: [], cards: [], langs: [{ code: "en", name: "English", primary: true }], id: "c-" + String(name || "").toLowerCase() },
    editions: [],
    langs: langsOf(),
    counts: { cards: 0 },
    lint: { findings: [] },
    cloud: null,
    linked: null,
  };
}
function bareDesks() {
  return {
    error: null, folder: null, id: "c-lantern", mark: null, signing: "", file: "none", reason: "",
    inside: false, keyHeld: false, canKeep: true, restorable: null, requests: [], team: null,
  };
}
function actsIn(html) {
  return [...String(html).matchAll(/data-act="([^"]+)"/g)].map((m) => m[1]);
}
const ENT = { "&#39;": "'", "&quot;": '"', "&lt;": "<", "&gt;": ">", "&amp;": "&" };
const textOf = (html) => String(html).replace(/<[^>]*>/g, " ").replace(/&#39;|&quot;|&lt;|&gt;|&amp;/g, (m) => ENT[m]);
const attr = (map) => ({ getAttribute: (k) => (Object.prototype.hasOwnProperty.call(map, k) ? map[k] : null) });

async function main() {
  const { loadPage } = await import("./page-stand-in.mjs");

  /* MOVED, 2026-11-26 (Max, findings 29 and 31: a team is made on its own, a catalog is put on afterwards). Was: a lead with one catalog and no
     team presses Make a team on the Library and lands on Team at that catalog's own Make a team; with two catalogs the same press asks which
     catalog starts the team. Now: the same press opens the team cover at once and asks nothing of a catalog, with one catalog or two. */
  await leg("974c11", async () => {
    const dir = "C:\\catalogs\\Lantern";
    const home = loadPage({
      uiLang: "en",
      api: {
        open: async (d) => opened(d, "Lantern"),
        desks: async () => bareDesks(),
        proposals: async () => ({ proposals: [], inbox: "" }),
      },
    });
    const P = home.page;
    const mainHtml = () => home.node("#main").innerHTML;
    Object.assign(P.S, {
      screen: "projects", section: "cards", projects: [libraryRow(dir, "Lantern")], teams: [], teamTab: 0,
      host: { tour: { offered: true } },
    });
    P.paintProjects();
    const library = mainHtml();
    check(/data-act="team-new"/.test(library) && /Make a team/.test(library),
      "974c11 the Library's team card offers Make a team");
    await P.ACTS["team-new"]();
    const cover = P.S.cover === "team" ? P.teamCoverHtml() : "";
    check(P.S.cover === "team" && P.S.teamWant === "new" && /data-act="do-team-new"/.test(cover),
      "974c11 the press opens the team cover at once, with that catalog not asked for");
    check(P.S.teamPickDir === "" && P.S.desksLoadedFor === "" && !/Lantern|catalog/i.test(textOf(cover)),
      "974c11 the cover names no catalog and the Team screen is not read for one");
  });

  await leg("974c11b", async () => {
    const lantern = "C:\\catalogs\\Lantern";
    const beacon = "C:\\catalogs\\Beacon";
    const home = loadPage({
      uiLang: "en",
      api: {
        open: async (d) => opened(d, d.endsWith("Beacon") ? "Beacon" : "Lantern"),
        desks: async () => bareDesks(),
        proposals: async () => ({ proposals: [], inbox: "" }),
      },
    });
    const P = home.page;
    const mainHtml = () => home.node("#main").innerHTML;
    Object.assign(P.S, {
      screen: "projects", section: "cards",
      projects: [libraryRow(lantern, "Lantern"), libraryRow(beacon, "Beacon")],
      teams: [], teamTab: 0, host: { tour: { offered: true } },
    });
    P.paintProjects();
    await P.ACTS["team-new"]();
    const cover = P.S.cover === "team" ? P.teamCoverHtml() : "";
    check(P.S.cover === "team" && P.S.teamWant === "new" && /data-act="do-team-new"/.test(cover) && actsIn(mainHtml()).indexOf("team-start-at") < 0,
      "974c11b two catalogs ask no question about which one starts the team: the cover opens");
    check(!/Lantern|Beacon|Which catalog/.test(textOf(cover + mainHtml())),
      "974c11b neither catalog is named");
  });

  async function takenOff(id, second) {
    const dir = "C:\\catalogs\\Lantern";
    const other = "C:\\catalogs\\Beacon";
    const teamId = "t-0123456789abcdef";
    const catId = "c-lantern";
    const otherId = "c-beacon";
    const team = {
      id: teamId, sealed: true, led: true, connection: "relay", teammates: [],
      catalogs: second ? [catId, otherId] : [catId],
      projects: second
        ? [{ id: catId, dir, name: "Lantern" }, { id: otherId, dir: other, name: "Beacon" }]
        : [{ id: catId, dir, name: "Lantern" }],
      relay: { url: "https://relay.etiuda.test/relay/v1", rt: "0123456789abcdef0123456789abcdef" },
    };
    const afterTeam = second
      ? Object.assign({}, team, { catalogs: [otherId], projects: [{ id: otherId, dir: other, name: "Beacon" }] })
      : Object.assign({}, team, { catalogs: [], projects: [] });
    let openedCalls = 0;
    const home = loadPage({
      uiLang: "en",
      api: {
        teamLeave: async () => ({ error: null }),
        teams: async () => ({ teams: [afterTeam] }),
        projects: async () => ({ projects: [libraryRow(dir, "Lantern")] }),
        open: async (d) => {
          openedCalls++;
          return opened(d, "Lantern", { id: catId, folder: null, sealedTeam: null, relay: null, moving: null });
        },
        desks: async () => bareDesks(),
        proposals: async () => ({ proposals: [], inbox: "" }),
        publishPlan: async () => ({ error: FOLDER_SENTENCE }),
      },
    });
    const P = home.page;
    const mainHtml = () => home.node("#main").innerHTML;
    const held = opened(dir, "Lantern", {
      id: catId, folder: RELAY_FOLDER, sealedTeam: teamId,
      relay: { rt: "0123456789abcdef0123456789abcdef", url: "https://relay.etiuda.test/relay/v1" },
    });
    Object.assign(P.S, {
      screen: "project", section: "settings", open: held, teams: [team], projects: [libraryRow(dir, "Lantern")],
      desks: {
        error: null, folder: RELAY_FOLDER, file: "ours", team: { id: teamId, sealed: true, catalogs: second ? 2 : 1, roster: [] },
        requests: [],
      },
      host: { tour: { offered: true } }, cover: null, err: null,
    });
    P.paintProjectSettings();
    const before = mainHtml();
    check(/the Etiuda relay/.test(before) && /data-act="team-catalog-leave"/.test(before),
      id + " before the press, Catalog details names the relay and offers taking off");
    await P.ACTS["team-catalog-leave"](attr({ "data-dir": dir, "data-team": teamId, "data-cat": catId }));
    await P.ACTS["do-team-catalog-leave"]();
    const after = mainHtml();
    check(!/Part way off/.test(after), id + " after taking off, no Part way off remains");
    check(!/Writes to/.test(after) && !/the Etiuda relay/.test(after),
      id + " after taking off, Catalog details has no Writes to row (was: it read no folder chosen yet)");
    if (second) check(!/also carries/.test(after), id + " the other catalog is not still named as carried from a stale row");
    await P.ACTS.publish();
    check(P.S.screen === "projects" && P.S.home === "team" && P.S.cover === null, id + " Publish on a catalog with no team opens its Team page (was: the place cover) (screen: " + String(P.S.screen) + ", open reads: " + openedCalls + ")");
  }

  await leg("974c13", async () => { await takenOff("974c13", false); });
  await leg("974c13b", async () => { await takenOff("974c13b", true); });

  await leg("974c13e", async () => {
    const dir = "C:\\catalogs\\Lantern";
    const team1Id = "t-00000000000000a1";
    const team2Id = "t-00000000000000a2";
    const catId = "c-lantern";
    const team1 = {
      id: team1Id, connection: "folder", folder: "C:\\quay", sealed: true, led: true,
      catalogs: [catId], projects: [{ id: catId, dir, name: "Lantern" }],
    };
    const team2 = {
      id: team2Id, connection: "relay", sealed: true, led: true,
      catalogs: [], projects: [],
      relay: { url: "https://relay.etiuda.test/relay/v1", rt: "0123456789abcdef0123456789abcdef" },
    };

    let diskMoved = false;
    const homeMove = loadPage({
      uiLang: "en",
      api: {
        teamMoveCatalog: async () => {
          diskMoved = true;
          return { error: "Relay sync failed after move" };
        },
        open: async (d) => {
          return diskMoved
            ? opened(d, "Lantern", { id: catId, sealedTeam: team2Id, moving: null })
            : opened(d, "Lantern", { id: catId, sealedTeam: team1Id, moving: { from: team1Id, to: team2Id } });
        },
        desks: async () => bareDesks(),
        proposals: async () => ({ proposals: [], inbox: "" }),
      },
    });
    const PM = homeMove.page;
    Object.assign(PM.S, {
      screen: "project", section: "settings",
      open: opened(dir, "Lantern", { id: catId, sealedTeam: team1Id, moving: { from: team1Id, to: team2Id } }),
      teams: [team1, team2], projects: [libraryRow(dir, "Lantern")],
      desks: bareDesks(),
      host: { tour: { offered: true } }, cover: null, err: null,
    });
    PM.paintProjectSettings();
    check(/Moving to/.test(homeMove.node("#main").innerHTML),
      "974c13e before finish, Catalog details shows Moving to");
    await PM.ACTS["team-move-finish"]();
    const afterMove = homeMove.node("#main").innerHTML;
    check(!/Moving to/.test(afterMove),
      "974c13e move failing after its team file lands leaves no stale Moving to row");

    let diskLeft = false;
    const homeLeave = loadPage({
      uiLang: "en",
      api: {
        teamLeave: async () => {
          diskLeft = true;
          return { error: "Relay unregister failed after leave" };
        },
        open: async (d) => {
          return diskLeft
            ? opened(d, "Lantern", { id: catId, sealedTeam: null, folder: null, relay: null })
            : opened(d, "Lantern", { id: catId, sealedTeam: team1Id, folder: "C:\\quay", relay: null });
        },
        desks: async () => bareDesks(),
        proposals: async () => ({ proposals: [], inbox: "" }),
      },
    });
    const PL = homeLeave.page;
    const team1NoLantern = Object.assign({}, team1, { catalogs: [], projects: [] });
    Object.assign(PL.S, {
      screen: "project", section: "settings",
      open: opened(dir, "Lantern", { id: catId, sealedTeam: team1Id, folder: "C:\\quay", relay: null }),
      teams: [team1NoLantern], projects: [libraryRow(dir, "Lantern")],
      desks: bareDesks(),
      host: { tour: { offered: true } }, cover: null, err: null,
    });
    PL.paintProjectSettings();
    check(/Part way off/.test(homeLeave.node("#main").innerHTML),
      "974c13e before finish taking off, Catalog details shows Part way off");
    await PL.ACTS["team-leave-finish"]();
    const afterLeave = homeLeave.node("#main").innerHTML;
    check(!/Part way off/.test(afterLeave),
      "974c13e leave failing after its team file lands leaves no stale Part way off row");
    check(!/C:\\quay/.test(afterLeave) && !/Writes to/.test(afterLeave),
      "974c13e leave failing after its team file lands leaves no stale Writes to row");
  });

  await leg("974c12", async () => {
    clearScratch(SCRATCH);
    fs.mkdirSync(SCRATCH, { recursive: true });
    const Sign = await import("../src/sign.mjs");
    const Studio = await import("../src/studio.mjs");
    const pair = await Sign.makePair();
    const keyAt = path.join(SCRATCH, "signing-key.json");
    fs.writeFileSync(keyAt, JSON.stringify(Sign.osFile(pair, vault.seal(pair.der)), null, 1) + NL);
    const secret = vault.open(Buffer.from(Sign.readKeyFile(keyAt).doc.private, "base64"));
    const homeDir = path.join(SCRATCH, "projects");
    const made = await Studio.newProject(homeDir, "Lantern", ["en"]);
    const teamId = "t-" + crypto.randomBytes(8).toString("hex");
    const rt = crypto.randomBytes(16).toString("hex");
    const mirror = path.join(SCRATCH, "relay-mirror", rt);
    await Studio.startRelayTeam(made.dir, {
      key: keyAt, passphrase: secret, teamId, mirror, rt,
      url: "https://relay.etiuda.test/relay/v1",
      teamKeys: { [teamId]: { 1: crypto.randomBytes(32) } },
    });
    const open = JSON.parse(JSON.stringify(await Studio.openProject(made.dir)));
    const facts = await Studio.teamFacts(made.dir, { key: keyAt, passphrase: secret });
    check(Array.isArray(open.editions) && open.editions.length === 0,
      "974c12 the project has no edition");
    check(!!facts && facts.file === "ours" && !!facts.team && facts.team.sealed === true,
      "974c12 startRelayTeam leaves a sealed team this Studio leads");
    const home = loadPage({ api: { proposals: async () => ({ proposals: [], inbox: "" }) }, uiLang: "en" });
    Object.assign(home.page.S, {
      open, desks: facts, screen: "projects", home: "team", teamDir: open.dir, host: { tour: { offered: true } },
    });
    home.page.paintDesks();
    const html = home.node("#main").innerHTML;
    check(html.indexOf(FIRST_PUBLISH) >= 0 && /data-first-publish/.test(html),
      "974c12 the Team section names the first publish");
    check(/data-act="publish"/.test(html),
      "974c12 the Team section offers the publish press");
  });

  await leg("974c12d", async () => {
    clearScratch(SCRATCH);
    fs.mkdirSync(SCRATCH, { recursive: true });
    const Store = await import("../src/team-store.mjs");
    const Member = await import("../src/member.mjs");
    const Relay = await import("../src/relay.mjs");
    const ud = path.join(SCRATCH, "desk");
    fs.mkdirSync(ud, { recursive: true });
    const teamId = "t-" + crypto.randomBytes(8).toString("hex");
    const tf = Store.teamsFile(ud);
    const lead = { keyId: "studio-lantern", public: "ab".repeat(32) };
    Store.keepFollowing(tf, vault, teamId, {
      channel: "relay", relay: { rt: "ab".repeat(16), url: Relay.RELAY_URL }, member: "k-" + crypto.randomBytes(8).toString("hex"),
      leadName: "Lantern lead",
    }, { lead, chain: [], keys: {} });
    Store.markFollowing(tf, teamId, "following");
    const mirror = Member.followMirror(tf, teamId);
    fs.mkdirSync(mirror, { recursive: true });
    fs.writeFileSync(path.join(mirror, "etiuda-team.json"), JSON.stringify({ id: teamId, catalogs: ["c-wick"] }) + NL);
    const view = Member.followView(tf, vault);
    check(!!view && view.state === "following" && Array.isArray(view.catalogs) && view.catalogs.length === 0
      && Array.isArray(view.pending) && view.pending.length === 1 && view.pending[0] === "c-wick",
      "974c12d a catalog the team lists and has not published is pending, and catalogs stays the editions");
    const home = loadPage({ api: {}, uiLang: "en" });
    home.page.S.follow = {
      state: "following", leadName: "Lantern lead", channel: "relay", catalogs: [], pending: ["c-wick"],
    };
    const html = home.page.followedRowHtml();
    check(textOf(html).indexOf(WAITING) >= 0 && /data-waiting-edition/.test(html),
      "974c12d an admitted desk says it waits for the lead's first edition");
    check(!/Make a linked copy/.test(html),
      "974c12d a catalog with no edition is not offered as a linked copy");
  });

  process.stdout.write("team-strand: " + asserted + " assertions, " + failed + " failed" + NL);
  dropScratch(SCRATCH, "team-strand");
  process.exit(failed ? 1 : 0);
}

main().catch((err) => {
  process.stderr.write("team-strand: " + String(err && err.stack || err) + NL);
  process.exit(1);
});
