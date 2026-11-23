/* THE RELAY ADDRESSES THIS BUILD KNOWS, judged on the string.
 *
 *     import { relayKnown } from "./src/relay-known.mjs";
 *
 * relayKnown(url) is true only for the relay this build reaches (src/wire.cjs RELAY_ORIGIN, which a development tree alone may
 * move with ETIUDA_RELAY_ORIGIN, the way a leg points its own relay) and, in a test service build, staging's (RELAY_TEST); the
 * address as given, one trailing slash taken off, nothing resolved. It is the licence service's judgement of a door
 * (service/licence/core.mjs doorRelayOk), and src/relay.mjs doorRelayExact asks it. A followed team is held to it everywhere
 * an address reaches Studio from outside (Claude alpha's decision of 2026-11-17 20:33, the desk's rule mirrored): an
 * invitation (src/member.mjs joinTeam), the store's every write of a followed record (src/team-store.mjs keepFollowing and
 * retargetFollowing, the backup copy's restore included), a followed team's file (src/member.mjs heed), and a record already
 * on disk (src/member.mjs armRelay). An address that only resolves to the relay (a dot segment, the default port, a host
 * in capitals) is not known: the door (src/wire.cjs relayAdmitted) refuses a dot segment outright, so a record holding one
 * would point at a relay nothing can reach, and the string's own form is the one no reading can widen.
 *
 * Pure but for the two constants src/wire.cjs fixes as it loads; no file, no network. Its own module so that the store,
 * which src/relay.mjs imports, asks it without importing src/relay.mjs back. */
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { RELAY_ORIGIN, RELAY_TEST } = require("./wire.cjs");
const RELAY_BARE = RELAY_ORIGIN.replace(/\/$/, "");
const TEST_BARE = RELAY_TEST ? RELAY_TEST.replace(/\/$/, "") : "";

/** Whether `url` names a relay this build knows: the relay, or staging's in a test service build, as the string itself with
 *  one trailing slash taken off. */
function relayKnown(url) {
  if (typeof url !== "string") return false;
  const bare = url.endsWith("/") ? url.slice(0, -1) : url;
  return bare === RELAY_BARE || (!!TEST_BARE && bare === TEST_BARE);
}

export { relayKnown };
