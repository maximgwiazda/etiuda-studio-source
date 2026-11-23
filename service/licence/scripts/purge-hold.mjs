#!/usr/bin/env node
/* A PURGE HELD BY MAX'S OWN COMMAND (section 13; the accountant's caveat (1), "prepared, not advised"): while a row of scope "orders"
 * stands in purge_holds, core.mjs purgeRetention purges no order, whatever its year; the reason names why, such as "art. 70 § 2-4
 * suspension (and others)" (Ordynacja podatkowa: a limitation period suspended or interrupted, by a deferral, a bankruptcy, enforcement). Nothing in the service writes or
 * clears a hold; this script prints the SQL that does, and runs it on D1 by wrangler only with --execute (never with --plan).
 *
 *     node service/licence/scripts/purge-hold.mjs (--set orders --reason "<reason>" | --clear orders)
 *          [--database <name>] [--config <wrangler.toml>] [--env <name>] [--production | --staging] [--plan]
 *          [--execute (--remote|--local)] [--wrangler <wrangler.js>]
 */
import { fileURLToPath } from "node:url";
import path from "node:path";
import { ORDERS_HOLD } from "../core.mjs";
import { renderSql, statement } from "../attach.mjs";
import { buildWranglerCommand, consumeTargetArg, executeSql, printTargetAndCommand, resolveTarget } from "./target.mjs";

const SCOPES = [ORDERS_HOLD];

function parseArgs(args) {
  const o = { execute: false, remote: false, local: false, production: false, staging: false, plan: false };
  const value = (i, name) => { if (i + 1 >= args.length) throw new Error(name + " needs a value"); return args[i + 1]; };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    const consumed = consumeTargetArg(args, i, o);
    if (consumed !== -1) { i = consumed; continue; }
    if (a === "--set") { o.set = value(i, a); i++; }
    else if (a === "--clear") { o.clear = value(i, a); i++; }
    else if (a === "--reason") { o.reason = value(i, a); i++; }
    else if (a === "--wrangler") { o.wrangler = value(i, a); i++; }
    else if (a === "--execute") o.execute = true;
    else if (a === "--remote") o.remote = true;
    else if (a === "--local") o.local = true;
    else throw new Error("not an argument of purge-hold: " + a);
  }
  return o;
}

/** The SQL that sets or clears a hold, `now` the time a set is stamped with. */
export function makeHoldSql(o, now) {
  if ((o.set === undefined) === (o.clear === undefined)) throw new Error("name one of --set <scope> or --clear <scope>");
  const scope = o.set !== undefined ? o.set : o.clear;
  if (!SCOPES.includes(scope)) throw new Error("a hold's scope is one of: " + SCOPES.join(", "));
  if (o.clear !== undefined) {
    if (o.reason !== undefined) throw new Error("--clear takes no --reason");
    return renderSql([statement(q => "DELETE FROM purge_holds WHERE scope = " + q(scope))]);
  }
  if (typeof o.reason !== "string" || !o.reason.trim() || o.reason.length > 200 || /[\x00-\x1f\x7f]/.test(o.reason))
    throw new Error("--reason names why the purge is held, such as \"art. 70 § 2-4 suspension (and others)\", on one line");
  return renderSql([statement(q => "INSERT INTO purge_holds (scope, reason, since) VALUES (" + q(scope) + ", " + q(o.reason.trim()) + ", " + q(now)
    + ") ON CONFLICT (scope) DO UPDATE SET reason = excluded.reason")]);
}

async function main() {
  const o = parseArgs(process.argv.slice(2));
  const sql = makeHoldSql(o, Date.now());
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
