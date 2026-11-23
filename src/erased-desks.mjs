/* THE DESKS OF A PERSON WHO ASKED TO BE ERASED (section 13 of the licence design; Claude alpha's ruling of 2026-11-13 22:32: "The
 * lead's Studio takes an erased person's desks off its teams by itself at its next check, with nobody pressing, since the person asked
 * and the request is not the lead's to refuse; and the lead is told once, on Desks, that a person removed their data and their desks
 * left the team, with how many, never which person beyond what the lead already sees on that row").
 *
 *     import { erasedRemovals, takeOffErased, leftAfter, leftTaken } from "./erased-desks.mjs";
 *
 * The licence service names, in a lead's check answer and for thirty days, the public keys of the desks of a person who asked to be
 * erased (`erased`). At each check this Studio takes each such desk off every team it leads, by the same removal a lead's Remove makes,
 * once: a desk taken off for an erasure is marked by team and key, and the mark is kept while the service still names the key, so a
 * desk the lead lets back in within the thirty days is not taken off again. A removal that fails is tried at the next check. Nothing
 * here reaches a team or a network: the shell hands in its teams and its removal (shell/main.js licenceStep).
 */

const KEY = /^[0-9a-f]{64}$/;

/** The removals owed: for each team ({team, folder, roster: [{deskId, public}]}), each desk whose public key `erased` names and that
 *  `done` (the marks "<team>:<key>" kept) does not, as {team, folder, member, pub, mark}. */
function erasedRemovals(erased, teams, done) {
  const want = new Set((Array.isArray(erased) ? erased : []).map(String).filter((k) => KEY.test(k)));
  const was = new Set(Array.isArray(done) ? done.map(String) : []);
  const out = [];
  for (const t of Array.isArray(teams) ? teams : []) {
    for (const d of t && Array.isArray(t.roster) ? t.roster : []) {
      const pub = String(d && d.public || ""), mark = String(t.team) + ":" + pub;
      if (want.has(pub) && !was.has(mark)) out.push({ team: String(t.team), folder: t.folder, member: String(d.deskId), pub, mark }); /* plant:erased-once */
    }
  }
  return out;
}

/** One check's taking off: `io` {teams: async () => teams as above, remove: async (team, folder, member) => the removal's reply, done:
 *  the marks kept}. Answers {done, left}: the marks to keep (those still named, and the removals that landed now) and, by team, how many
 *  desks left it now. A reply that did not remove (an error, a refusal, a throw) is left for the next check. */
async function takeOffErased(erased, io) {
  const named = new Set((Array.isArray(erased) ? erased : []).map(String).filter((k) => KEY.test(k)));
  const kept = (Array.isArray(io.done) ? io.done.map(String) : []).filter((m) => named.has(m.slice(m.indexOf(":") + 1)));
  const left = {};
  if (!named.size) return { done: kept, left };
  let teams = [];
  try { teams = await io.teams(); } catch { teams = []; }
  for (const r of erasedRemovals([...named], teams, kept)) {
    let reply = null;
    try { reply = await io.remove(r.team, r.folder, r.member); } catch { reply = null; }
    if (!reply || reply.error || reply.removed !== true) continue; /* plant:erased-landed */
    kept.push(r.mark);
    left[r.team] = (left[r.team] || 0) + 1;
  }
  return { done: kept, left };
}

/** What the lead has yet to be told, by team, with this check's `left` added. */
function leftAfter(held, left) {
  const out = Object.assign({}, held && typeof held === "object" ? held : {});
  for (const [team, n] of Object.entries(left || {})) if (Number.isSafeInteger(n) && n > 0) out[team] = (Number.isSafeInteger(out[team]) ? out[team] : 0) + n;
  return out;
}

/** The count to tell the lead for `team`, once: {count, rest}, the rest what is still to be told elsewhere. */
function leftTaken(held, team) {
  const rest = Object.assign({}, held && typeof held === "object" ? held : {});
  const count = Number.isSafeInteger(rest[team]) ? rest[team] : 0;
  delete rest[team]; /* plant:erased-told-once */
  return { count, rest };
}

export { erasedRemovals, takeOffErased, leftAfter, leftTaken };
