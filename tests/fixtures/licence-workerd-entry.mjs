/* THE LICENCE SERVICE'S WORKER UNDER A TEST ROOT, for tests/licence-workerd.mjs alone, never deployed.
 *
 * worker.mjs's default export trusts the vendor's root (the pinned ROOT_PUB), whose private half no test holds, so a leg that
 * runs the Worker in Cloudflare's own runtime enters here instead: the same serviceWith over the same core.mjs, with the root
 * the leg made for its run (the variable TEST_ROOT) and NOTHING else changed. No fetch is passed, so the providers' keys go out
 * through the runtime's own globalThis.fetch exactly as the deployed Worker's do; a clock is not passed either.
 */
import { serviceWith } from "../../service/licence/worker.mjs";

let service = null, root = null;

export default {
  fetch(request, env) {
    if (!service || root !== env.TEST_ROOT) { root = env.TEST_ROOT; service = serviceWith({ roots: [root] }); }
    return service.fetch(request, env);
  },
};
