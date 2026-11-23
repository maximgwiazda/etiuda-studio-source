#!/usr/bin/env node
/* THE PAYMENT NOTICES FOR MAX'S EYE (service/licence/pay.mjs: "Max's list is every held row and every outcome in PAY_LISTED"): each
 * payment notice the route held, which changed nothing, and each it applied and listed, newest first, by provider and event id, so
 * the notice can be found in the provider's dashboard. A held notice is money taken with no seats given, or a notice the route
 * would not act on, such as "held:second-subscription" (a second subscription for a licence that has a live one, Max, 2026-11-19);
 * it reaches Max the day it arrives only when this is run, and he refunds it at the provider or applies it by hand
 * (attach-seats.mjs --paddle-sub). Nothing here writes: the SQL is one SELECT, printed first and run on D1 by wrangler only with --execute.
 *
 *     node service/licence/scripts/pay-held.mjs [--limit <n, 1 to 500, 100 by default>]
 *          [--database <name>] [--config <wrangler.toml>] [--env <name>] [--production | --staging] [--plan]
 *          [--execute (--remote|--local)] [--wrangler <wrangler.js>]
 */
import { fileURLToPath } from "node:url";
import path from "node:path";
import { PAY_LISTED } from "../pay.mjs";
import { buildWranglerCommand, consumeTargetArg, executeSql, printTargetAndCommand, resolveTarget } from "./target.mjs";

function parseArgs(args) {
  const o = { execute: false, remote: false, local: false, production: false, staging: false, plan: false, limit: 100 };
  const value = (i, name) => { if (i + 1 >= args.length) throw new Error(name + " needs a value"); return args[i + 1]; };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    const consumed = consumeTargetArg(args, i, o);
    if (consumed !== -1) { i = consumed; continue; }
    if (a === "--limit") { o.limit = Number(value(i, a)); i++; }
    else if (a === "--wrangler") { o.wrangler = value(i, a); i++; }
    else if (a === "--execute") o.execute = true;
    else if (a === "--remote") o.remote = true;
    else if (a === "--local") o.local = true;
    else throw new Error("not an argument of pay-held: " + a);
  }
  return o;
}

/** The one SELECT: held outcomes and the listed ones, newest first, `at` read as a UTC time. */
export function makeHeldSql(o) {
  const limit = o && o.limit !== undefined ? o.limit : 100;
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 500) throw new Error("--limit is a whole number from 1 to 500");
  const listed = PAY_LISTED.map(p => "outcome LIKE '" + p.replace(/'/g, "''") + "%'");
  const where = ["outcome LIKE 'held:%'"].concat(listed).join(" OR "); /* plant:pay-held-where */
  return "SELECT provider, event_id, type, occurred_at, outcome, datetime(at / 1000, 'unixepoch') AS recorded FROM pay_events WHERE "
    + where + " ORDER BY at DESC, event_id LIMIT " + limit + ";";
}

async function main() {
  const o = parseArgs(process.argv.slice(2));
  const sql = makeHeldSql(o);
  const target = resolveTarget(o);
  const cmd = buildWranglerCommand(sql, o, target);
  console.log(sql);
  printTargetAndCommand(target, cmd);
  if (o.execute && !o.plan) executeSql(sql, o, target);
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  main().catch(err => {
    console.error(err.message || err);
    process.exit(1);
  });
}
