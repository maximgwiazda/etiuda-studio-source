/* THE LICENCE SERVICE'S WORKER (board 936, S4): core.mjs over the pinned engine's own forms, and nothing else.
 *
 * THE FORMS ARE THE PIN'S, IMPORTED, NEVER RETYPED. A licence's bytes are the catalog fold the engine signs and Studio
 * verifies (src/modules/catalog-v2.js v2SignedBytes, which Studio's src/sign.mjs slices out of the same file); a grant's
 * and a delegation's are the relay's own (relay/core.cjs grantBytes and delegationBytes), and every grant is judged by the
 * relay's own grantWhy before it leaves. The bundler reads both files from engine/pinned/, which tools/engine-fetch.mjs
 * fills from the commit in tools/engine-pin, so a deploy runs that fetch first and builds against exactly the engine
 * Studio is built against. relay/core.cjs uses node:crypto, hence nodejs_compat in wrangler.toml, as the relay's own
 * Worker has it.
 *
 * `serviceWith` is for legs, as the relay's routeWith is: the default export is the service over the vendor's root (the
 * pinned ROOT_PUB, a constant read from no environment) and the Worker's own clock, and only a leg passes other roots.
 *
 * `scheduled` is the cron trigger's handler (wrangler.toml [triggers]): the retention purge (core.mjs purgeRetention), on the
 * same clock the routes read, with the database alone and no secret.
 */
import { v2SignedBytes } from "../../engine/pinned/src/modules/catalog-v2.js";
import relay from "../../engine/pinned/relay/core.cjs";
import { makeService, purgeRetention } from "./core.mjs";

export const RULES = Object.freeze({
  licenceBytes: v2SignedBytes,
  grantBytes: relay.grantBytes,
  delegationBytes: relay.delegationBytes,
  grantWhy: relay.grantWhy,
  storeCertBytes: relay.storeCertBytes,
  storeCertWhy: relay.storeCertWhy,
  noticeBytes: relay.noticeBytes,
  noticeWhy: relay.noticeWhy,
  callSkewMs: relay.CALL_SKEW_MS,
  grantMaxMs: relay.GRANT_MAX_MS,
  delegationMaxMs: relay.DELEGATION_MAX_MS,
});

/** The service over `o.roots` and `o.clock` (env => ms), and for sign-in `o.fetch` (the published keys' one way out, the
 *  Worker's own fetch unless given) and `o.trialOncePer`; a leg's door, as the relay's routeWith is. */
export function serviceWith(o) {
  const opts = o || {};
  const clock = opts.clock || (() => Date.now());
  const service = makeService({ rules: RULES, roots: opts.roots || [relay.ROOT_PUB], clock,
    fetch: opts.fetch, trialOncePer: opts.trialOncePer });
  return {
    fetch: (request, env) => service.fetch(request, env),
    scheduled: async (controller, env) => { await purgeRetention(env.DB, clock(env)); await service.storeEnds(env); },
  };
}

export default serviceWith();
