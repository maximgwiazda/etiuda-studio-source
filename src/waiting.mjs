/* WAITING PROPOSALS, REQUESTS, BADGE COUNT, AND NOTIFICATIONS FOR STUDIO (run S6).
 *
 * Runs after each teamWatch and relaySync completes.
 * British English, no em or en dashes.
 */
import path from "node:path";
import { showNotification, APP_IDS } from "../engine/pinned/shell/tray.cjs";
import { rosterName } from "./team.mjs";

export const WAITING_WORDS = Object.freeze({
  en: {
    proposalTitle: "{NAME} sent a proposal",
    proposalTitleNameless: "A teammate sent a proposal",
    proposalBody: "{CATALOG}. Changed cards: {C} · new cards: {N}.",
    requestTitle: "{NAME} asks to join {TEAM}",
    requestBody: "It waits on the Team screen.",
    trayProposalsWaiting: "Proposals waiting: {N}",
    trayRequestsWaiting: "Requests to join waiting: {N}",
    trayTipWaiting: "Etiuda Studio: waiting: {N}",
  },
  pl: {
    proposalTitle: "Propozycja od członka zespołu: {NAME}",
    proposalTitleNameless: "Nowa propozycja od członka zespołu",
    proposalBody: "{CATALOG}. Zmienione karty: {C} · nowe karty: {N}.",
    requestTitle: "Prośba o dołączenie do zespołu {TEAM}: {NAME}",
    requestBody: "Czeka na ekranie Zespół.",
    trayProposalsWaiting: "Czekające propozycje: {N}",
    trayRequestsWaiting: "Czekające prośby o dołączenie: {N}",
    trayTipWaiting: "Etiuda Studio: czeka: {N}",
  },
});

export function formatWaitingWord(key, lang, params) {
  const table = WAITING_WORDS[lang] || WAITING_WORDS.en;
  let text = table[key] || WAITING_WORDS.en[key] || "";
  if (params && typeof params === "object") {
    for (const [k, v] of Object.entries(params)) {
      text = text.replaceAll("{" + k + "}", String(v != null ? v : ""));
    }
  }
  return text;
}

/** Count unanswered proposals and waiting requests across catalogs. */
export async function countWaiting(opts) {
  const { projects, listProposals, desksFor, licencePaused } = opts || {};
  const list = Array.isArray(projects) ? projects : [];

  let proposalsWaiting = 0;
  let requestsWaiting = 0;
  const proposalsByProject = new Map();
  const requestsByProject = new Map();

  for (const proj of list) {
    const dir = proj && proj.dir ? String(proj.dir) : "";
    if (!dir) continue;

    /* Unanswered proposals per catalog */
    let projectProposals = [];
    if (!licencePaused && typeof listProposals === "function") {
      try {
        const res = await listProposals(dir);
        const all = (res && Array.isArray(res.proposals)) ? res.proposals : [];
        projectProposals = all.filter((p) => p && p.ok && Number(p.pending) > 0);
      } catch {
        projectProposals = [];
      }
    }
    proposalsByProject.set(dir, projectProposals);
    proposalsWaiting += projectProposals.length;

    /* Waiting requests to join per catalog */
    let projectRequests = [];
    let facts = null;
    if (typeof desksFor === "function") {
      try {
        facts = await desksFor(dir);
        projectRequests = (facts && Array.isArray(facts.requests)) ? facts.requests : [];
      } catch {
        projectRequests = [];
        facts = null;
      }
    }
    requestsByProject.set(dir, { requests: projectRequests, facts });
    requestsWaiting += projectRequests.length;
  }

  const totalWaiting = proposalsWaiting + requestsWaiting;
  return {
    proposalsWaiting,
    requestsWaiting,
    totalWaiting,
    proposalsByProject,
    requestsByProject,
  };
}

/** Check waiting items, show toasts for newly arrived ones, and update store. */
export async function checkWaiting(opts) {
  const {
    electron,
    appId = APP_IDS.studio,
    projects,
    listProposals,
    desksFor,
    licencePaused = false,
    store = {},
    readStore,
    writeStore,
    windowState = {},
    onOpenItem,
    lang = "en",
  } = opts || {};

  const counts = await countWaiting({ projects, listProposals, desksFor, licencePaused });

  const currentStore = (typeof readStore === "function" ? readStore() : store) || {};
  const toldSet = new Set(Array.isArray(currentStore.told) ? currentStore.told : []);
  let toldChanged = false;

  /* Master switch: Notifications on/off */
  const masterNotesOn = currentStore.trayNotes !== false;

  /* Individual switches */
  const notifyProposalsOn = currentStore.notifyProposals !== false;
  const notifyRequestsOn = currentStore.notifyRequests !== false;

  /* Window focus check: no toasts while window is in front and focused */
  const isFocusedInFront = !!(
    windowState.isVisible &&
    !windowState.isMinimized &&
    windowState.isFocused
  );

  const canToast = masterNotesOn && !isFocusedInFront && !licencePaused;

  const shownToasts = [];
  const list = Array.isArray(projects) ? projects : [];

  for (const proj of list) {
    const dir = proj && proj.dir ? String(proj.dir) : "";
    if (!dir) continue;
    const catName = proj.name || path.basename(dir);

    const reqData = counts.requestsByProject.get(dir);
    const facts = reqData && reqData.facts;
    const team = (facts && facts.team) ? facts.team : (facts && facts.roster ? facts : null);

    /* Proposals toasts */
    const proposals = counts.proposalsByProject.get(dir) || [];
    for (const p of proposals) {
      const pid = String(p.file || "").split(path.sep).join("/");
      if (!pid) continue;
      if (!toldSet.has(pid)) {
        if (canToast && notifyProposalsOn) {
          const verifiedDesk = !!(p && p.ok && p.desk && p.desk.id);
          const rosterSender = verifiedDesk ? rosterName(team, p.desk.id) : null;

          const title = rosterSender
            ? formatWaitingWord("proposalTitle", lang, { NAME: rosterSender })
            : formatWaitingWord("proposalTitleNameless", lang);

          const changesCount = (p.proposes && p.proposes.changes) || 0;
          const cardsCount = (p.proposes && p.proposes.cards) || 0;

          const body = formatWaitingWord("proposalBody", lang, {
            CATALOG: catName,
            C: changesCount,
            N: cardsCount,
          });

          const notif = showNotification({
            electron,
            appId,
            title,
            body,
            onClick: () => {
              if (typeof onOpenItem === "function") {
                onOpenItem({ where: "proposals", dir });
              }
            },
          });
          if (notif) {
            shownToasts.push(notif);
            toldSet.add(pid);
            toldChanged = true;
          }
        }
      }
    }

    /* Requests toasts */
    const requests = (reqData && reqData.requests) || [];
    const teamName = (facts && facts.team && facts.team.name) || (facts && facts.team && facts.team.id) || catName;

    for (const req of requests) {
      const normDir = String(dir || "").split(path.sep).join("/");
      const rid = normDir + ":" + (req.id || "");
      if (!req.id) continue;
      if (!toldSet.has(rid)) {
        if (canToast && notifyRequestsOn) {
          const deskName = req.name || req.id || "";
          const title = formatWaitingWord("requestTitle", lang, {
            NAME: deskName,
            TEAM: teamName,
          });
          const body = formatWaitingWord("requestBody", lang, {});

          const notif = showNotification({
            electron,
            appId,
            title,
            body,
            onClick: () => {
              if (typeof onOpenItem === "function") {
                onOpenItem({ where: "desks", dir });
              }
            },
          });
          if (notif) {
            shownToasts.push(notif);
            toldSet.add(rid);
            toldChanged = true;
          }
        }
      }
    }
  }

  if (toldChanged && typeof writeStore === "function") {
    const fresh = (typeof readStore === "function" ? readStore() : currentStore) || {};
    const updated = Object.assign({}, fresh, { told: Array.from(toldSet) });
    writeStore(updated);
  }

  return { counts, shownToasts };
}
