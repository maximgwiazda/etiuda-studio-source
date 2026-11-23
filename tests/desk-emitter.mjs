/* A DESK'S STATISTICS ANSWER, MADE BY THE ENGINE'S OWN `src/modules/desk-stats.js` AT A NAMED
 * COMMIT, read out of the engine's object database and imported whole (it imports nothing).
 * TWO ENGINES, BECAUSE STUDIO READS BOTH: LIFETIME is the last whose answer carries lifetime
 * counters beside the requested span; "by-day" is the pin once the pin counts by day (board 521),
 * else 521's own commit, whose answer holds the span's counts and `since`, the first day counted.
 */
import { engineRepo, blob, gitText, readPin } from "../tools/engine-fetch.mjs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const FILE = "src/modules/desk-stats.js";
const LIFETIME = "9afea338fa1d06e355e256dcd06d43df363a7237";
const FIRST_BY_DAY = "207bc96b5cb46630ac847a9d0eba33ea2ff498b8";

function sourceAt(repo, commit) {
  const r = gitText(repo, ["rev-parse", "--verify", "--quiet", commit + ":" + FILE]);
  const sha = r.status === 0 ? r.out.trim() : "";
  return sha ? blob(repo, sha).toString("utf8") : null;
}

/** The counters of one engine, imported, and a sentence naming where they came from. */
async function emitter(kind) {
  const repo = engineRepo({}).dir;
  let commit = LIFETIME;
  if (kind === "by-day") {
    const pin = readPin(path.join(ROOT, "tools", "engine-pin")).pin;
    const atPin = sourceAt(repo, pin);
    commit = atPin && /daysSince/.test(atPin) ? pin : FIRST_BY_DAY;
  } else if (kind !== "lifetime") throw new Error("no emitter called " + kind);
  const src = sourceAt(repo, commit);
  if (!src) throw new Error("the engine at " + commit.slice(0, 7) + " has no " + FILE + " in "
    + repo);
  const mod = await import("data:text/javascript;base64," + Buffer.from(src).toString("base64"));
  return Object.assign({ commit: commit.slice(0, 7), kind }, mod);
}

/* ONE DESK'S ANSWER. `uses` is [[cardId, day], ...], one copy each, bumped in that order; the
   request's span goes to statsDoc as the host passes it; the envelope is the shell's fixed list
   (`writeStatsAnswer` in the engine's shell/main.js), in its order, `since` only when the page
   sent a day. The hash is not the channel's: nothing in Studio checks it. */
function answerFrom(E, o) {
  const pack = {};
  (o.uses || []).forEach(([id, day]) => E.bumpUse(pack, id, day));
  const page = E.statsDoc(pack, { engine: "2.0.0-dev", period: o.period,
    catalog: o.catalog || null });
  const out = {
    format: 1, kind: "etiuda-statistics", desk: o.desk, engine: String(page.engine || ""),
    period: { from: String(o.period.from), to: String(o.period.to) },
    sync: o.sync || String(o.period.to) + " 12:00",
    cards: page.cards, intents: page.intents, misses: page.misses | 0, langs: page.langs,
  };
  if (/^\d{4}-\d{2}-\d{2}$/.test(String(page.since || ""))) out.since = String(page.since);
  if (page.catalog && page.catalog.id) out.catalog = page.catalog;
  out.hash = "djb2:0";
  return out;
}

export { emitter, answerFrom, LIFETIME, FIRST_BY_DAY };
