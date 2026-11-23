#!/usr/bin/env node
/* A LICENCE'S LEAD SEATS, FOR THE VENDOR (board 980; Claude alpha's decision 15 (b)): run by hand, never deployed. It lists the
 * lead seats of a licence by their codes, each with the days it was last seen and proved and whether it counts now, and frees
 * one: the seat is marked unseen and unproved, so it stops counting at once and only its person's fresh sign-in takes it again;
 * nothing is removed. The SQL is printed first and run on D1 by wrangler only with --execute, as attach-seats.mjs runs it.
 *
 *     node service/licence/scripts/lead-seats.mjs (--licence <id> | --owner <code>) [--free <code>]
 *          [--database <name>] [--config <wrangler.toml>] [--env <name>] [--production | --staging] [--plan]
 *          [--execute (--remote|--local)] [--wrangler <wrangler.js>]
 *
 * --owner names the licences by their owner's sign-in code (the one Studio shows on the licence card); --licence by id. A code
 * is a pseudonym and says nothing of the person.
 */
import { fileURLToPath } from "node:url";
import path from "node:path";
import { SEAT_CODE_RE, PROOF_DAYS, ENTRA_PROOF_DAYS } from "../core.mjs";
import { buildWranglerCommand, consumeTargetArg, executeSql, printTargetAndCommand, resolveTarget } from "./target.mjs";

const DAY = 24 * 3600000;

function parseArgs(args) {
  const o = { execute: false, remote: false, local: false, production: false, staging: false, plan: false };
  const value = (i, name) => { if (i + 1 >= args.length) throw new Error(name + " needs a value"); return args[i + 1]; };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    const consumed = consumeTargetArg(args, i, o);
    if (consumed !== -1) { i = consumed; continue; }
    const named = { "--licence": "licence", "--owner": "owner", "--free": "free", "--wrangler": "wrangler" }[a];
    if (named) { o[named] = value(i, a); i++; }
    else if (a === "--execute") o.execute = true;
    else if (a === "--remote") o.remote = true;
    else if (a === "--local") o.local = true;
    else throw new Error("not an argument of lead-seats: " + a);
  }
  return o;
}

const quote = s => "'" + String(s).replace(/'/g, "''") + "'";

/** The SQL that lists a licence's lead seats, or frees one of them by its code. */
export function makeLeadSeatsSql(o, now) {
  const at = now === undefined ? Date.now() : now;
  if ((o.licence === undefined) === (o.owner === undefined)) throw new Error("name the licence by --licence <id> or --owner <code>, one of them");
  if (o.licence !== undefined && !/^[1-9][0-9]{0,15}$/.test(String(o.licence))) throw new Error("--licence is a licence's id, a whole number");
  if (o.owner !== undefined && !SEAT_CODE_RE.test(o.owner)) throw new Error("--owner is the owner's sign-in code, 16 symbols");
  if (o.free !== undefined && !SEAT_CODE_RE.test(o.free)) throw new Error("--free is the code of the seat to free, 16 symbols");
  /* The owner is the person the sign-in code names. A desk sign-in writes that row and no lead seat. */
  const ownerPerson = "(SELECT person FROM persons WHERE code = " + quote(o.owner) + ")"; /* plant:lead-owner-by-person */
  const licences = o.licence !== undefined ? "(" + Number(o.licence) + ")"
    : "(SELECT id FROM licences WHERE owner = " + ownerPerson + ")";
  if (o.free !== undefined)
    return "UPDATE seats SET seen_at = 0, proved_at = 0 WHERE kind = 'lead' AND code = " + quote(o.free) + " AND licence IN " + licences + ";";
  const day = col => "CASE WHEN s." + col + " > 0 THEN date(s." + col + " / 1000, 'unixepoch') END";
  /* As the service counts: ENTRA_PROOF_DAYS where the licence's seats follow Entra, PROOF_DAYS otherwise. */
  const proofWindow = "(CASE l.seat_source WHEN 'entra' THEN " + ENTRA_PROOF_DAYS + " ELSE " + PROOF_DAYS + " END)"; /* plant:lead-counted-entra */
  return "SELECT s.licence AS licence, s.code AS code, " + day("seen_at") + " AS seen, " + day("proved_at") + " AS proved, "
    + "(s.seen_at > " + at + " - l.grace_days * " + DAY + " AND s.proved_at > " + at + " - " + proofWindow + " * " + DAY + ") AS counted, "
    + "(l.owner = s.person) AS owner FROM seats s JOIN licences l ON l.id = s.licence WHERE s.kind = 'lead' AND s.licence IN "
    + licences + " ORDER BY s.licence, s.seated_at, s.code;";
}

function main() {
  const o = parseArgs(process.argv.slice(2));
  const target = resolveTarget(o);
  const sql = makeLeadSeatsSql(o);
  const cmd = buildWranglerCommand(sql, o, target);
  console.log(sql);
  printTargetAndCommand(target, cmd);
  if (o.execute && !o.plan) executeSql(sql, o, target);
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  try { main(); } catch (err) { console.error(err.message || err); process.exit(1); }
}
