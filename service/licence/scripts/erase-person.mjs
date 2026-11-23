#!/usr/bin/env node
/* A PERSON ERASED BY HAND (section 13): for a person who can no longer sign in to ask (their account gone) and writes to us instead,
 * the very statements person/erase runs (erase.mjs), the person named by their sign-in code, printed first and run on D1 by
 * wrangler only with --execute (never with --plan). Their desks are named to their licences' leads for core.mjs ERASURE_DAYS.
 * The text has no BEGIN and COMMIT (D1 refuses them in SQL), so a statement that fails may leave those before it applied: RUN THE SAME
 * COMMAND AGAIN. The person's row goes last and every statement is idempotent, so a second run finishes the erasure (leg d17).
 * EVERY ASK IS ERASED (the test architect's read of the held integration, erasure part, finding 1): the person is named where their row's
 * erased_at is earlier than this run, so a payer erased before (their row kept for the subscription, erased_at its run's stamp) and back
 * since is erased again by a later run, while this run's own text, printed and run again after it finished, names nobody (legs d28, d25).
 * THE INVITATIONS TO THE PERSON'S ADDRESS (the Grok review beta's D5 of 2026-11-22): invites and lead_invites hold the address keyed under the
 * service's HASH_KEY, which this script never holds, and the keyed form never leaves the service: with --execute, --address with --service and
 * --root asks the service's admin/address route, signed by the root key (opened as attach-seats opens it, STUDIO_KEY_PASSPHRASE or
 * --passphrase-file), to remove the invitations, namings and candidacies to that address, and it answers their counts and nothing else; with
 * --plan nothing is asked. Without --address, the fallback below:
 * ITS ADDRESS FOLD IS SQL'S lower(), which folds A to Z alone, where the service folds with JavaScript's toLowerCase() (core.mjs keyOfAddress): for an address with a capital outside A to Z the two differ, so this script misses the invitation to it, which waits out INVITE_DAYS (accepted as written down by the test architect, 2026-11-17).
 *
 *     node service/licence/scripts/erase-person.mjs --code <sign-in code>
 *          [--address <address> --service <https://.../v1/> --root <root key file> [--passphrase-file <f>]]
 *          [--database <name>] [--config <wrangler.toml>] [--env <name>] [--production | --staging] [--plan]
 *          [--execute (--remote|--local)] [--wrangler <wrangler.js>]
 */
import { fileURLToPath } from "node:url";
import path from "node:path";
import crypto from "node:crypto";
import { SEAT_CODE_RE, ERASURE_MS } from "../core.mjs";
import { renderSql } from "../attach.mjs";
import { eraseStatements } from "../erase.mjs";
import { adminAddressBytes } from "../requests.mjs";
import { buildWranglerCommand, consumeTargetArg, executeSql, printTargetAndCommand, resolveTarget } from "./target.mjs";

function parseArgs(args) {
  const o = { execute: false, remote: false, local: false, production: false, staging: false, plan: false };
  const value = (i, name) => { if (i + 1 >= args.length) throw new Error(name + " needs a value"); return args[i + 1]; };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    const consumed = consumeTargetArg(args, i, o);
    if (consumed !== -1) { i = consumed; continue; }
    if (a === "--code") { o.code = value(i, a); i++; }
    else if (a === "--address") { o.address = value(i, a); i++; }
    else if (a === "--service") { o.service = value(i, a); i++; }
    else if (a === "--root") { o.root = value(i, a); i++; }
    else if (a === "--passphrase-file") { o.passphraseFile = value(i, a); i++; }
    else if (a === "--wrangler") { o.wrangler = value(i, a); i++; }
    else if (a === "--execute") o.execute = true;
    else if (a === "--remote") o.remote = true;
    else if (a === "--local") o.local = true;
    else throw new Error("not an argument of erase-person: " + a);
  }
  return o;
}

/** The SQL that erases the person whose sign-in code is `code`, `now` the time the relay keep counts from. */
export function makeEraseSql(code, now) {
  if (typeof code !== "string" || !SEAT_CODE_RE.test(code)) throw new Error("--code is the person's sign-in code, the 16 symbols Studio or the desk shows");
  return renderSql(eraseStatements({ person: q => "(SELECT person FROM persons WHERE code = " + q(code) + " AND erased_at < " + q(now) + ")", until: now + ERASURE_MS, now })); /* plant:erase-marker-read */
}

/** The invitations, namings and candidacies to `o.address` removed by the service's admin/address route at `o.service` (its API prefix,
 *  https), signed by the root's private half `o.rootKey`: their counts, {invites, namings, candidates}. `o.fetch` stands in for the network in a leg. */
export async function removeByAddress(o) {
  if (typeof o.service !== "string" || !/^https:\/\/[a-z0-9.-]+(?::\d{1,5})?\/[a-z][a-z0-9-]{0,40}\/v1\/$/.test(o.service))
    throw new Error("--service is the licence service's address, https, ending in its /v1/ path");
  const t = o.now === undefined ? Date.now() : o.now;
  const body = { address: o.address, t, sig: crypto.sign(null, Buffer.from(adminAddressBytes({ address: o.address, t })), o.rootKey).toString("hex") };
  const res = await (o.fetch || globalThis.fetch)(o.service + "admin/address", { method: "POST", redirect: "error",
    headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  let got = null;
  try { got = await res.json(); } catch { got = null; }
  const n = v => Number.isSafeInteger(v) && v >= 0;
  if (!res.ok || !got || got.ok !== true || !n(got.invites) || !n(got.namings) || !n(got.candidates))
    throw new Error("admin/address did not answer with the counts it removed (" + res.status + ")");
  return { invites: got.invites, namings: got.namings, candidates: got.candidates };
}

/** Whether this run asks admin/address: --address, with --execute and without --plan (the test architect's F9: a dry run never writes). */
export const addressAsked = o => o.address !== undefined && o.execute === true && o.plan !== true; /* plant:erase-dry-run */

async function main() {
  const o = parseArgs(process.argv.slice(2));
  const target = resolveTarget(o);
  const sql = makeEraseSql(o.code, Date.now());
  const cmd = buildWranglerCommand(sql, o, target);
  console.log(sql);
  printTargetAndCommand(target, cmd);
  if (o.execute && !o.plan) executeSql(sql, o, target);
  if (addressAsked(o)) {
    const { openRoot } = await import("./attach-seats.mjs");
    const got = await removeByAddress({ service: o.service, address: o.address, rootKey: await openRoot(o) });
    console.log("admin/address removed " + got.invites + " invitation(s), " + got.namings + " naming(s), " + got.candidates + " candidacy(ies)");
  } else if (o.address !== undefined) console.log("admin/address not asked (no --execute, or --plan)");
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  main().catch(err => {
    console.error(err.message || err);
    process.exit(1);
  });
}
