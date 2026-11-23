#!/usr/bin/env node
/* A REFUND, MARKED BY HAND (board 936, S5 and S7): the SQL that marks one licence refunded, printed first, and run
 * on D1 by wrangler only with --execute (and never with --plan).
 *
 *     node service/licence/scripts/refund-licence.mjs (--id <n> | <n>)
 *          [--database <name>] [--config <wrangler.toml>] [--env <name>] [--production | --staging] [--plan]
 *          [--execute (--remote|--local)] [--wrangler <wrangler.js>]
 *
 * The licence is named by its id, which is no secret (lead-seats.mjs --owner finds it by its owner's sign-in code). wrangler
 * runs by this node, never a shell (tools/wrangler.mjs), against staging by default or --production when named.
 */
import { fileURLToPath } from "node:url";
import path from "node:path";
import { buildWranglerCommand, consumeTargetArg, executeSql, printTargetAndCommand, resolveTarget } from "./target.mjs";

const BY_ID = "the licence is named by its id, a whole number";

function parseArgs(args) {
  const o = { execute: false, remote: false, local: false, production: false, staging: false, plan: false };
  const value = (i, name) => { if (i + 1 >= args.length) throw new Error(name + " needs a value"); return args[i + 1]; };
  const positional = [];
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    const consumed = consumeTargetArg(args, i, o);
    if (consumed !== -1) { i = consumed; continue; }
    if (a === "--id") {
      o.id = value(i, a); i++;
    } else if (a === "--wrangler") {
      o.wrangler = value(i, a); i++;
    } else if (a === "--execute") {
      o.execute = true;
    } else if (a === "--remote") {
      o.remote = true;
    } else if (a === "--local") {
      o.local = true;
    } else if (a.startsWith("--id=")) {
      o.id = a.slice(5);
    } else if (!a.startsWith("-")) {
      positional.push(a);
    } else {
      throw new Error("not an argument of refund-licence: " + a);
    }
  }
  if (positional.length > 0) {
    const val = positional[0].trim();
    if (positional.length > 1 || !/^\d+$/.test(val) || val.length >= 20) throw new Error(BY_ID);
    if (o.id === undefined) o.id = parseInt(val, 10);
  }
  return o;
}

export async function makeRefundSql(target) {
  let id;
  if (typeof target === "number") id = target;
  else if (typeof target === "string" && /^\d+$/.test(target.trim()) && target.trim().length < 20) id = parseInt(target.trim(), 10);
  else if (target && typeof target === "object" && target.id !== undefined) id = target.id;
  if (id === undefined) throw new Error("Target must be an integer licence id");
  const numId = Number(id);
  if (!Number.isInteger(numId) || numId <= 0) throw new Error("Invalid licence id: " + id);
  return `UPDATE licences SET refunded = 1, refunded_at = COALESCE(refunded_at, unixepoch() * 1000) WHERE id = ${numId};`;
}

async function main() {
  const parsed = parseArgs(process.argv.slice(2));
  const dbTarget = resolveTarget(parsed);
  if (parsed.id === undefined) {
    console.error("Usage: node refund-licence.mjs (--id <id> | <id>) [--database <name>] [--config <wrangler.toml>] [--env <name>] [--production | --staging] [--plan] [--execute] [--remote] [--local]");
    process.exit(1);
  }
  const sql = await makeRefundSql(parsed.id);
  const cmd = buildWranglerCommand(sql, parsed, dbTarget);
  console.log(sql);
  printTargetAndCommand(dbTarget, cmd);

  if (parsed.execute && !parsed.plan) executeSql(sql, parsed, dbTarget);
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  main().catch(err => {
    console.error(err.message || err);
    process.exit(1);
  });
}
