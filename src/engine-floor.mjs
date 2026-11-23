/* THE OLDEST DESK AN EDITION ASKS FOR, AND WHAT MAY RAISE IT (the version policy Max adopted 2026-11-01 01:27, point 1;
 * the test architect's condition: "A 2.x Studio writes catalog format 2, and format 1 for the team, sealed and span
 * envelopes. It raises minEngine only when the lead turns on a feature older desks cannot show, and it says so at that
 * press.").
 *
 * ENGINE_FLOOR is the oldest desk this line of Studio writes for: every edition is stamped with it, whatever version of
 * Studio wrote it and whatever its draft carried, unless the edition uses a feature named in FEATURE_ENGINE. Today no
 * feature is named, so every edition asks for the floor. A feature older desks cannot show is added there with the
 * version that first shows it and the words the press says when the lead turns it on; nothing else raises the stamp.
 *
 * A desk's own version is read from what it already reports (its signed statistics answer's `engine`). A preview build
 * (2.0.0-dev) reads what its release reads, so a prerelease part is not counted below its release here. */

const ENGINE_FLOOR = "2.0.0";

/* A feature older desks cannot show: { test(doc) -> boolean, engine: "x.y.z" }. None yet. */
const FEATURE_ENGINE = Object.freeze({});

const VERSION_RE = /^(\d+)\.(\d+)\.(\d+)(?:[-+][0-9A-Za-z.+-]*)?$/;

/** [major, minor, patch] of a version string, or null where it is no version. */
function versionParts(v) {
  const m = VERSION_RE.exec(String(v == null ? "" : v).trim());
  return m ? [+m[1], +m[2], +m[3]] : null;
}

/** Whether version `a` is below `b`, by major, minor and patch. Null where either is no version. */
function versionBelow(a, b) {
  const x = versionParts(a), y = versionParts(b);
  if (!x || !y) return null;
  for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] < y[i];
  return false;
}

/** The features of FEATURE_ENGINE an edition uses, by name. */
function featuresOf(doc) {
  return Object.keys(FEATURE_ENGINE).filter((k) => {
    try { return !!FEATURE_ENGINE[k].test(doc); } catch { return false; }
  });
}

/** The minEngine an edition carries: the floor, raised only by a feature it uses. */
function minEngineFor(doc) {
  let out = ENGINE_FLOOR;
  for (const k of featuresOf(doc)) if (versionBelow(out, FEATURE_ENGINE[k].engine)) out = FEATURE_ENGINE[k].engine;
  return out;
}

export { ENGINE_FLOOR, FEATURE_ENGINE, versionParts, versionBelow, featuresOf, minEngineFor };
