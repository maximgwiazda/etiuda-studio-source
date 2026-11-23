/* THE TEAM READER (board 962 stage 1).
 *
 * One call returning, for every team this Studio leads in teams.json, what the overview
 * and the Studio-level teams screen need, with no project open.
 *
 * Each team: connection (relay, or folder for a team held and no longer synced), lead print, catalogs listed, the project it
 * belongs to, teammates count against 30, and whether the folder is away (last known).
 * Each teammate: name, kind (desk or studio), admitted, version, catalog in use (title,
 * rev, whether this Studio's or foreign, current or behind), last heard from (newest
 * stamp of its files), statistics present.
 * Cached by stamp as the live watch does (src/catalog-use.mjs).
 * Nothing returned holds a team key, a card or an invitation. A live invitation is the count `liveInvites`.
 * A foreign catalog shows name and edition only.
 */
import fs from "node:fs";
import path from "node:path";
import * as Engine from "./engine.mjs";
import { readKeyFile, unlockKey, openLeadBox, statsKeysOf, keyIdFor } from "./sign.mjs";
import { teamsFile, relayMirror, liveInvitesOf } from "./team-store.mjs";
import { versionParts } from "./engine-floor.mjs";
import { readTeam, heldTeam } from "./team.mjs";
import { classify, editionsOf } from "./catalog-use.mjs";

const TEAM_ID = /^t-[0-9a-f]{16}$/;
const DESK_ID = /^k-[0-9a-f]{16}$/;
const STATS_ENVELOPE = ["format", "kind", "team", "keyId", "enc", "ct"];

function statsEnvelopeByName(doc) {
  if (!doc || typeof doc !== "object" || Array.isArray(doc) || doc.format !== 1) return doc;
  const out = {};
  for (const k of STATS_ENVELOPE) out[k] = doc[k];
  return out;
}

const leadPrintOf = (publicHex) => keyIdFor(publicHex).slice("studio-".length);

function fileStamp(at) {
  try {
    const s = fs.statSync(at);
    return s.size + ":" + Math.round(s.mtimeMs);
  } catch (e) { return e && e.code === "ENOENT" ? "-" : "?"; }
}

function keyFor(teamKeys, team, epoch) {
  const own = (o, k) => !!o && typeof o === "object" && Object.prototype.hasOwnProperty.call(o, k);
  const byEpoch = own(teamKeys, String(team)) ? teamKeys[String(team)] : null;
  const k = own(byEpoch, String(epoch)) ? byEpoch[String(epoch)] : null;
  return k instanceof Uint8Array && k.length === 32 ? Buffer.from(k) : null;
}

function openInner(file, teamKeys) {
  let raw;
  try { raw = fs.readFileSync(file, "utf8"); } catch { return null; }
  let env;
  try { env = JSON.parse(raw.replace(/^\uFEFF/, "")); } catch { return null; }
  const seal = Engine.sealRules();
  if (!env || typeof env !== "object" || env.kind !== seal.SEALED_KIND) return null;
  const key = keyFor(teamKeys, env.team, env.epoch);
  if (!key) return null;
  let text = null;
  try { text = seal.openSealed(key, env); } catch { text = null; }
  if (typeof text !== "string") return null;
  try {
    const inner = JSON.parse(text);
    return inner && typeof inner === "object" && !Array.isArray(inner) ? inner : null;
  } catch { return null; }
}

function pathsSame(a, b) {
  if (!a || !b) return false;
  const p1 = path.resolve(String(a)), p2 = path.resolve(String(b));
  return process.platform === "win32" ? p1.toLowerCase() === p2.toLowerCase() : p1 === p2;
}

// Caches by file path:
// inUseCache: inUsePath -> { stamp, cat: { id, title, rev, sha256 } }
const inUseCache = new Map();
const statsCache = new Map();
// Last readings for away folders: `${tid}:${deskId}` -> { cat, catalog, lastHeard, version, statistics }
const lastDeskReadings = new Map();

function cleanForPage(obj) {
  if (obj === null || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(cleanForPage);
  const out = {};
  for (const k of Object.keys(obj)) {
    if (k === "teamKey" || k === "teamKeys" || k === "secret" || k === "cards" || k === "content") continue;
    out[k] = cleanForPage(obj[k]);
  }
  return out;
}

/** Read all teams this Studio leads, returning connection, teammates and catalogs without a project open. */
export async function readAllTeams(opts) {
  const o = opts || {};
  const tf = o.teamsFile || (o.userData ? teamsFile(o.userData) : "");
  if (!tf || !fs.existsSync(tf)) return { teams: [] };

  let teamsDoc = null;
  try {
    teamsDoc = JSON.parse(fs.readFileSync(tf, "utf8").replace(/^\uFEFF/, ""));
  } catch {
    return { teams: [] };
  }
  if (!teamsDoc || typeof teamsDoc.teams !== "object") return { teams: [] };

  // Read projects in root if given
  const projects = [];
  const projectEditions = new Map();
  function getEditions(dir) {
    if (!dir) return [];
    const resolved = path.resolve(String(dir));
    if (!projectEditions.has(resolved)) {
      projectEditions.set(resolved, editionsOf(resolved));
    }
    return projectEditions.get(resolved);
  }
  const root = o.projectsRoot ? path.resolve(String(o.projectsRoot)) : null;
  if (root && fs.existsSync(root)) {
    let entries = [];
    try { entries = fs.readdirSync(root, { withFileTypes: true }); } catch { entries = []; }
    for (const ent of entries) {
      if (!ent.isDirectory()) continue;
      const pdir = path.join(root, ent.name);
      const pf = path.join(pdir, "project.json");
      if (!fs.existsSync(pf)) continue;
      try {
        const pj = JSON.parse(fs.readFileSync(pf, "utf8").replace(/^\uFEFF/, ""));
        let rev = Number.isInteger(+pj.rev) ? +pj.rev : 0;
        let draftId = typeof pj.id === "string" && pj.id ? pj.id : "";
        const draftPath = path.join(pdir, pj.draft && typeof pj.draft === "string" ? pj.draft : "draft.json");
        if (fs.existsSync(draftPath)) {
          try {
            const dr = JSON.parse(fs.readFileSync(draftPath, "utf8").replace(/^\uFEFF/, ""));
            if (!draftId && typeof dr.id === "string") draftId = dr.id;
            if (rev === 0 && Number.isInteger(+dr.rev)) rev = +dr.rev;
          } catch {}
        } else if (pj.draft && typeof pj.draft === "object") {
          if (!draftId && typeof pj.draft.id === "string") draftId = pj.draft.id;
          if (rev === 0 && Number.isInteger(+pj.draft.rev)) rev = +pj.draft.rev;
        }
        projects.push({
          dir: pdir,
          name: typeof pj.displayName === "string" && pj.displayName ? pj.displayName : ent.name,
          id: draftId,
          rev,
          folder: typeof pj.folder === "string" && pj.folder ? path.resolve(pdir, pj.folder) : ""
        });
      } catch {}
    }
  }

  // Open lead box if keyFile and passphrase available
  let leadBox = null, statsKeys = [];
  if (o.keyFile && fs.existsSync(o.keyFile) && o.passphrase) {
    try {
      const kf = readKeyFile(o.keyFile);
      if (kf) { const open = unlockKey(kf, o.passphrase); leadBox = openLeadBox(kf, open); statsKeys = statsKeysOf(kf, open); }
    } catch {}
  }

  /* This Studio's own key, by its public half, so each team says whether this Studio leads it (board 962 stage 5, T5): the cover's
     third choice and the Teams screen offer a catalog only to a sealed team this key leads, as studio:team-choose requires. */
  let ownLead = "";
  if (o.keyFile && fs.existsSync(o.keyFile)) {
    try { const kf = readKeyFile(o.keyFile); ownLead = kf && typeof kf.public === "string" ? kf.public : ""; } catch { ownLead = ""; }
  }

  const resultTeams = [];

  for (const tid of Object.keys(teamsDoc.teams)) {
    if (!TEAM_ID.test(tid)) continue;
    const entry = teamsDoc.teams[tid];
    if (!entry || typeof entry !== "object") continue;

    const isRelay = !!(entry.relay && entry.relay.rt);
    /* A TEAM KEPT FOR A SHARED FOLDER IS HELD, NOT READ (the folder team's removal): Studio no longer syncs one, so nothing is read
       from its folder, not even to see whether it is there, and no teammate is listed. It is named from the copy this Studio kept
       and marked `held`, for the screens to say once that it no longer syncs. */
    if (!isRelay) { /* plant:fh-held-reader */
      const kept = entry.file && typeof entry.file === "object" ? entry.file : null;
      const heldCatalogs = kept && Array.isArray(kept.catalogs) ? kept.catalogs.slice() : [];
      const heldFolder = typeof entry.folder === "string" ? entry.folder : "";
      const heldProjects = [];
      for (const p of projects) {
        if (heldCatalogs.includes(p.id) || (heldFolder && p.folder && pathsSame(p.folder, heldFolder)))
          heldProjects.push({ id: p.id, name: p.name, dir: p.dir, rev: p.rev });
      }
      let heldPrint = "";
      if (kept && kept.lead && kept.lead.public) { try { heldPrint = leadPrintOf(kept.lead.public); } catch {} }
      resultTeams.push({
        id: tid, connection: "folder", held: true, folder: heldFolder, relay: null, leadPrint: heldPrint, catalogs: heldCatalogs,
        sealed: false, led: false, project: heldProjects[0] || null, projects: heldProjects, teammates: [], count: 0, limit: 30,
        away: false, liveInvites: 0
      });
      continue;
    }
    const folder = relayMirror(tf, entry.relay.rt);

    let away = false;
    let unreadable = "";
    let teamObj = null;

    let folderExists = false, fileExists = false;
    if (folder) {
      try {
        folderExists = fs.existsSync(folder);
        if (folderExists) {
          fileExists = fs.existsSync(path.join(folder, "etiuda-team.json"));
        }
      } catch {}
    }

    if (folder && fileExists) {
      try {
        let held = null;
        if (o.keyFile && fs.existsSync(o.keyFile)) {
          held = await heldTeam(folder, { key: o.keyFile });
        }
        let read = null;
        if (!held) {
          read = await readTeam(folder);
        }
        let genuine = (held && held.team) || (read && read.valid && read.team) || null; /* plant:tr-verify */
        if (genuine) {
          const expectedLead = (entry.file && entry.file.lead) || entry.lead || (entry.relay && entry.relay.lead ? { public: entry.relay.lead } : null);
          if (expectedLead) {
            const expPub = typeof expectedLead === "string" ? expectedLead : expectedLead.public;
            const expKeyId = typeof expectedLead === "object" ? expectedLead.keyId : null;
            const actPub = genuine.lead && genuine.lead.public;
            const actKeyId = genuine.lead && genuine.lead.keyId;
            if ((expPub && actPub && expPub !== actPub) || (expKeyId && actKeyId && expKeyId !== actKeyId) || (expPub && !actPub)) {
              genuine = null;
              unreadable = "this team's signature does not verify under its lead key, so it changed after it was signed";
            }
          }
        }
        if (genuine) {
          teamObj = genuine;
        } else if (!unreadable) {
          unreadable = (held && held.reason)
            || (read && read.problems && read.problems.join(", "))
            || "this team's signature does not verify under its lead key, so it changed after it was signed";
        }
      } catch (e) {
        unreadable = String(e && e.message || e);
      }
    } else {
      away = true;
      if (entry.file && typeof entry.file === "object") {
        teamObj = entry.file;
      }
    }

    if (!teamObj) {
      if (unreadable) {
        resultTeams.push({
          id: tid,
          connection: "relay",
          folder: "",
          relay: { rt: entry.relay.rt, url: entry.relay.url },
          leadPrint: "",
          catalogs: [],
          sealed: false,
          led: false,
          project: null,
          projects: [],
          teammates: [],
          count: 0,
          limit: 30,
          away: false,
          unreadable,
          reason: unreadable
        });
      }
      continue;
    }

    // Lead print
    let leadPrint = "";
    if (teamObj.lead && teamObj.lead.public) {
      try { leadPrint = leadPrintOf(teamObj.lead.public); } catch {}
    }

    // Listed catalogs
    const catalogs = Array.isArray(teamObj.catalogs) ? teamObj.catalogs.slice() : [];

    // The library's catalogs of this team: every one the team lists, or whose folder is the team's (board 962 stage 5, T3). The
    // first stays `project`, which stage 1's screens read until T5 moves them; a teammate's catalog takes its title and rev from
    // its own project, so a teammate on the team's second catalog is not named or judged by the first.
    const teamProjects = [];
    for (const p of projects) {
      if (catalogs.includes(p.id) || (folder && p.folder && pathsSame(p.folder, folder))) {
        teamProjects.push({ id: p.id, name: p.name, dir: p.dir, rev: p.rev });
      }
    }
    const matchedProject = teamProjects[0] || null;

    const roster = Array.isArray(teamObj.roster) ? teamObj.roster : [];
    const teammates = [];

    for (const m of roster) {
      if (!m || !m.desk || !DESK_ID.test(String(m.desk.id))) continue;
      const deskId = String(m.desk.id);
      const name = String(m.name || m.desk.name || deskId).trim();
      const kind = typeof m.desk.kind === "string" && m.desk.kind === "studio" ? "studio" : "desk";
      /* Admitted where the lead wrapped the team key for it, as teamSummary reads it; a desk only named is not, so the cover does not
         count it among the teammates that never reported a version (board 962 stage 5, T5). */
      const admitted = m.wrap !== undefined;

      let version = "";
      let statistics = false;
      let catalogInUse = null;
      let lastHeard = null;

      const deskDir = folder ? path.join(folder, "desks", deskId) : "";
      const existsOnDisk = deskDir && fs.existsSync(deskDir);

      if (!away && existsOnDisk) {
        // Last heard from: newest stamp of files in deskDir
        let newestMtime = 0;
        try {
          const files = fs.readdirSync(deskDir);
          for (const f of files) {
            try {
              const st = fs.statSync(path.join(deskDir, f));
              if (st.mtimeMs > newestMtime) newestMtime = st.mtimeMs;
            } catch {}
          }
        } catch {}
        if (newestMtime > 0) lastHeard = new Date(newestMtime).toISOString();

        // Check stats.estat
        const statsPath = path.join(deskDir, "stats.estat");
        if (fs.existsSync(statsPath)) {
          const stamp = fileStamp(statsPath);
          const cached = statsCache.get(statsPath);
          const haveBox = !!(leadBox && leadBox.secretKey);
          /* A read with no box stores a blank version. The first call that has the box reads the file again (board 974,
             security 4). A read made with the box keeps its answer, blank or not, until the file's stamp changes. */
          if (cached && cached.stamp === stamp && (cached.opened || !haveBox)) {
            version = cached.version;
            statistics = cached.statistics;
          } else {
            let ver = "", statPresent = false;
            try {
              const sdoc = JSON.parse(fs.readFileSync(statsPath, "utf8").replace(/^\uFEFF/, ""));
              if (sdoc && sdoc.kind === "etiuda-stats-sealed") {
                statPresent = true;
                if (haveBox) {
                  let text = null;
                  for (const k of statsKeys) { text = Engine.statsRules().openStatsSealed(k, statsEnvelopeByName(sdoc), deskId); if (text != null) break; }
                  if (text != null) {
                    const ans = JSON.parse(text);
                    if (Engine.statsRules().statsAnswerGenuine(ans, deskId, String(m.desk.key || ""))) {
                      if (ans && typeof ans.engine === "string" && versionParts(ans.engine)) ver = ans.engine;
                    }
                  }
                }
              }
            } catch {}
            statsCache.set(statsPath, { stamp, version: ver, statistics: statPresent, opened: haveBox });
            version = ver;
            statistics = statPresent;
          }
        }

        // Check in-use.ec
        let catFacts = null;
        const inUsePath = path.join(deskDir, "in-use.ec");
        if (fs.existsSync(inUsePath)) {
          const stamp = fileStamp(inUsePath);
          let cached = inUseCache.get(inUsePath);
          if (!cached || cached.stamp !== stamp) {
            try {
              const inner = openInner(inUsePath, o.teamKeys || {});
              if (inner && inner.kind === "etiuda-in-use" && Engine.deskRules().deskFileGenuine(inner, deskId) && inner.catalog) {
                const c = inner.catalog;
                const catId = typeof c.id === "string" ? c.id : "";
                const title = typeof c.title === "string" ? c.title : "";
                const inRev = Number.isInteger(+c.rev) ? +c.rev : null;
                const sha256 = typeof c.sha256 === "string" ? c.sha256 : "";
                catFacts = { id: catId, title, rev: inRev, sha256 };
              }
            } catch {}
            cached = { stamp, cat: catFacts };
            inUseCache.set(inUsePath, cached);
          } else {
            catFacts = cached.cat;
          }

          if (catFacts) {
            const catId = catFacts.id || "";
            const ownP = teamProjects.find((p) => p.id === catId) || (catalogs.includes(catId) ? null : matchedProject); /* plant:tr-own-project */
            const isOwnCatalog = catalogs.includes(catId) || (matchedProject && matchedProject.id === catId);
            const projId = (ownP && ownP.id) || (isOwnCatalog ? catId : "");
            const editions = ownP && ownP.dir ? getEditions(ownP.dir) : [];
            const said = classify(catFacts, projId, editions);
            const inRev = catFacts.rev;

            if (said.kind === "other" && !isOwnCatalog) {
              // Foreign catalog: NAME AND EDITION ONLY
              catalogInUse = {
                title: catFacts.title || catId,
                rev: inRev,
                foreign: true,
                current: false,
                behind: false
              };
            } else {
              const currentRev = ownP && Number.isInteger(+ownP.rev) ? +ownP.rev : inRev;
              const isCurrent = inRev != null && currentRev != null ? inRev >= currentRev : true;
              catalogInUse = {
                title: (ownP && ownP.name) || catFacts.title || catId,
                rev: inRev,
                foreign: false,
                current: isCurrent,
                behind: !isCurrent
              };
            }
          }
        }

        // Keep last reading in memory for when folder is away
        lastDeskReadings.set(`${tid}:${deskId}`, {
          cat: catFacts,
          catalog: catalogInUse,
          lastHeard,
          version,
          statistics
        });
      } else if (away) {
        // Away folder: keep the last reading
        const last = lastDeskReadings.get(`${tid}:${deskId}`)
          || (entry.readings && entry.readings[deskId])
          || (entry.desks && entry.desks[deskId])
          || (entry.file && entry.file.readings && entry.file.readings[deskId])
          || null;
        if (last) {
          lastHeard = last.lastHeard || null;
          version = last.version || "";
          statistics = !!last.statistics;
          if (last.cat) {
            const c = last.cat;
            const catId = c.id || "";
            const ownP = teamProjects.find((p) => p.id === catId) || (catalogs.includes(catId) ? null : matchedProject);
            const isOwnCatalog = catalogs.includes(catId) || (matchedProject && matchedProject.id === catId);
            const projId = (ownP && ownP.id) || (isOwnCatalog ? catId : "");
            const editions = ownP && ownP.dir ? getEditions(ownP.dir) : [];
            const said = classify(c, projId, editions);
            const inRev = c.rev;
            if (said.kind === "other" && !isOwnCatalog) {
              catalogInUse = {
                title: c.title || catId,
                rev: inRev,
                foreign: true,
                current: false,
                behind: false
              };
            } else {
              const currentRev = ownP && Number.isInteger(+ownP.rev) ? +ownP.rev : inRev;
              const isCurrent = inRev != null && currentRev != null ? inRev >= currentRev : true;
              catalogInUse = {
                title: (ownP && ownP.name) || c.title || catId,
                rev: inRev,
                foreign: false,
                current: isCurrent,
                behind: !isCurrent
              };
            }
          } else if (last.catalog) {
            catalogInUse = last.catalog;
          }
        }
      }

      teammates.push({
        id: deskId,
        name,
        kind,
        admitted,
        version: version || "",
        catalog: catalogInUse,
        lastHeard,
        statistics,
        ...(away ? { away: true, lastKnown: true } : {})
      });
    }

    resultTeams.push({
      id: tid,
      connection: "relay",
      folder: "",
      relay: { rt: entry.relay.rt, url: entry.relay.url },
      leadPrint,
      catalogs,
      /* Sealed where this computer's record and the team file both say so, as the shell's choose and the thread's each read one. */
      sealed: entry.sealed === true && teamObj.sealed === true,
      led: !!ownLead && !!(teamObj.lead && teamObj.lead.public === ownLead),
      project: matchedProject,
      projects: teamProjects,
      teammates,
      count: teammates.length,
      limit: 30,
      away,
      liveInvites: liveInvitesOf(tf, tid, o.now, Array.isArray(teamObj.roster) ? teamObj.roster : [])
    });
  }

  return cleanForPage({ teams: resultTeams });
}
