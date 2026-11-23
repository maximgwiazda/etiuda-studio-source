#!/usr/bin/env node
/* A TEAM MOVED OFF ENTRA'S GATE BY HAND (decision 49, option (b); Claude alpha, 2026-11-13 20:55): the SQL that releases a lead key's
 * teams, printed first, and run on D1 by wrangler only with --execute, as refund-licence does. The key's next grant then carries the
 * service's signed release, which alone lifts the relay's gate on its teams; a grant with seats again sets the mark back. Max's act.
 *
 *     node service/licence/scripts/release-seats.mjs --lead <the lead key's public half, 64 hex>
 *          [--database <name>] [--config <wrangler.toml>] [--env <name>] [--production | --staging] [--plan] [--execute (--remote|--local)]
 */
import { fileURLToPath } from "node:url";
import path from "node:path";
import { buildWranglerCommand, consumeTargetArg, executeSql, printTargetAndCommand, resolveTarget } from "./target.mjs";

function parseArgs(args) {
  const o = { execute: false, remote: false, local: false, production: false, staging: false, plan: false };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    const consumed = consumeTargetArg(args, i, o);
    if (consumed !== -1) { i = consumed; continue; }
    if (a === "--lead") { if (i + 1 >= args.length) throw new Error("--lead needs a value"); o.lead = args[++i]; }
    else if (a === "--wrangler") { if (i + 1 >= args.length) throw new Error("--wrangler needs a value"); o.wrangler = args[++i]; }
    else if (a === "--execute") o.execute = true;
    else if (a === "--remote") o.remote = true;
    else if (a === "--local") o.local = true;
    else throw new Error("not an argument of release-seats: " + a);
  }
  return o;
}

/** The statement that releases the key `lead`'s mark, or a throw where it is not a key's public half. */
export function makeReleaseSql(lead) {
  if (typeof lead !== "string" || !/^[0-9a-f]{64}$/.test(lead)) throw new Error("--lead is a lead key's public half, 64 lowercase hex");
  return "UPDATE entra_keys SET released = 1 WHERE lead = '" + lead + "';"; /* plant:release-sql */
}

async function main() {
  const o = parseArgs(process.argv.slice(2));
  const target = resolveTarget(o);
  const sql = makeReleaseSql(o.lead);
  console.log(sql);
  printTargetAndCommand(target, buildWranglerCommand(sql, o, target));
  if (o.execute && !o.plan) executeSql(sql, o, target);
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  main().catch(err => {
    console.error(err.message || err);
    process.exit(1);
  });
}
