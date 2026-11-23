/* TARGET DATABASE, ENVIRONMENT GUARD AND PLAN OUTPUT FOR THE LICENCE SCRIPTS.
 *
 * Staging is the default (etiuda-licence-staging, service/licence/wrangler.toml). Production (etiuda-licence) is reached only
 * when the caller passes --production explicitly: a production database name, config, environment or service URL without
 * --production is refused before anything runs, and --production refuses contradictory staging arguments.
 */
import child_process from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { WRANGLER_VERSION, wranglerArgv } from "../../../tools/wrangler.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));

export const STAGING_DATABASE = "etiuda-licence-staging";
export const PRODUCTION_DATABASE = "etiuda-licence";
export const STAGING_WORKER = "etiuda-licence-staging";
export const PRODUCTION_WORKER = "etiuda-licence";
export const STAGING_CONFIG = path.join(HERE, "..", "wrangler.toml");

const DB_NAME_RE = /^[a-z0-9][a-z0-9_-]{0,62}$/i;
const STAGING_TAG_RE = /(^|[-_])(staging|stage|dev|test|lab|local|preview|sandbox)([-_]|$)/i;
const PROD_TAG_RE = /(^|[-_])(prod|production|live)([-_]|$)/i;

/** True when a database or Worker name names production rather than a staging or test copy. */
export function looksLikeProductionName(name) {
  const n = String(name || "").toLowerCase();
  if (!n) return false;
  if (n === PRODUCTION_DATABASE || PROD_TAG_RE.test(n)) return true;
  return n.startsWith(PRODUCTION_DATABASE + "-") && !STAGING_TAG_RE.test(n);
}

/** True when a database, Worker or environment name clearly names a non-production tier. */
export function looksLikeStagingName(name) {
  return STAGING_TAG_RE.test(String(name || ""));
}

/** Consumes one shared target or plan argument at `args[i]`; returns the last consumed index, or -1 if unrecognised. */
export function consumeTargetArg(args, i, o) {
  const a = args[i];
  const need = flag => { if (i + 1 >= args.length) throw new Error(flag + " needs a value"); return args[i + 1]; };
  if (a === "--database") { o.database = need(a); return i + 1; }
  if (a.startsWith("--database=")) { o.database = a.slice("--database=".length); return i; }
  if (a === "--config") { o.config = need(a); return i + 1; }
  if (a.startsWith("--config=")) { o.config = a.slice("--config=".length); return i; }
  if (a === "--env") { o.env = need(a); return i + 1; }
  if (a.startsWith("--env=")) { o.env = a.slice("--env=".length); return i; }
  if (a === "--production") { o.production = true; return i; }
  if (a === "--staging") { o.staging = true; return i; }
  if (a === "--plan" || a === "--dry-run") { o.plan = true; return i; }
  return -1;
}

function readConfigMeta(configPath) {
  if (!fs.existsSync(configPath) || !fs.statSync(configPath).isFile())
    throw new Error("there is no wrangler configuration at " + configPath);
  const toml = fs.readFileSync(configPath, "utf8");
  const workerName = (toml.match(/^\s*name\s*=\s*"([^"]+)"/m) || [])[1] || null;
  const databaseName = (toml.match(/^\s*database_name\s*=\s*"([^"]+)"/m) || [])[1] || null;
  const routePatterns = [...toml.matchAll(/pattern\s*=\s*"([^"]+)"/g)].map(m => m[1]);
  const apiPrefix = (toml.match(/^\s*API_PREFIX\s*=\s*"([^"]+)"/m) || [])[1] || null;
  const isProduction = looksLikeProductionName(workerName) || looksLikeProductionName(databaseName)
    || routePatterns.some(p => /^etiuda\.dev\/licence\/v1(?:\/|\*|$)/i.test(p))
    || (apiPrefix !== null && /^\/licence\/v1\/?$/i.test(apiPrefix));
  const isStaging = looksLikeStagingName(workerName) || looksLikeStagingName(databaseName)
    || routePatterns.some(p => /licence-staging/i.test(p))
    || (apiPrefix !== null && /licence-staging/i.test(apiPrefix));
  return { workerName, databaseName, isProduction, isStaging };
}

function productionServiceOrigin() {
  try {
    const wire = fs.readFileSync(path.join(HERE, "..", "..", "..", "src", "wire.cjs"), "utf8");
    return (wire.match(/const LICENCE_ORIGIN = "(https:\/\/[^"]+)";/) || [])[1] || null;
  } catch {
    return null;
  }
}

function sameOriginPath(a, b) {
  try {
    const x = new URL(a), y = new URL(b);
    return x.protocol === y.protocol && x.host === y.host && x.pathname.replace(/\/+$/, "") === y.pathname.replace(/\/+$/, "");
  } catch {
    return false;
  }
}

/** Validates target arguments, enforces the production guard, and resolves {environment, database, worker, config, env}. */
export function resolveTarget(o = {}) {
  if (o.staging && o.production) throw new Error("cannot pass both --staging and --production");
  if (o.database !== undefined && (typeof o.database !== "string" || !DB_NAME_RE.test(o.database)))
    throw new Error("--database is a D1 database's name");
  if (o.env !== undefined && (typeof o.env !== "string" || !DB_NAME_RE.test(o.env)))
    throw new Error("--env is a Worker environment's name");

  const configPath = o.config !== undefined ? path.resolve(o.config) : (o.production ? null : STAGING_CONFIG);
  const meta = configPath ? readConfigMeta(configPath) : null;
  const prodOrigin = productionServiceOrigin();

  if (!o.production) {
    if (o.database !== undefined && looksLikeProductionName(o.database))
      throw new Error("refusing to target production database '" + o.database + "' without --production");
    if (o.env !== undefined && PROD_TAG_RE.test(o.env))
      throw new Error("refusing to target production environment '" + o.env + "' without --production");
    /* The configuration decides, the default one included: a default wrangler.toml that names production is refused too (fail closed). */
    if (meta && meta.isProduction)
      throw new Error("refusing to target production configuration '" + (o.config !== undefined ? o.config : configPath) + "' without --production");
    if (o.service !== undefined && prodOrigin && sameOriginPath(o.service, prodOrigin))
      throw new Error("refusing to target production service '" + o.service + "' without --production");
  } else {
    if (o.database !== undefined && looksLikeStagingName(o.database))
      throw new Error("--production cannot target staging database '" + o.database + "'");
    if (o.env !== undefined && looksLikeStagingName(o.env))
      throw new Error("--production cannot target staging environment '" + o.env + "'");
    if (o.config !== undefined && meta && meta.isStaging)
      throw new Error("--production cannot use staging wrangler configuration '" + o.config + "'");
    if (o.service !== undefined && /\/licence-staging\/v1\/?$/i.test(String(o.service)))
      throw new Error("--production cannot use staging service '" + o.service + "'");
  }

  const database = o.database !== undefined ? o.database
    : (o.config !== undefined && meta && meta.databaseName) ? meta.databaseName
    : (o.production ? PRODUCTION_DATABASE : STAGING_DATABASE);
  if (!o.production && looksLikeProductionName(database))
    throw new Error("refusing to target production database '" + database + "' without --production");
  if (o.production && looksLikeStagingName(database))
    throw new Error("--production cannot target staging database '" + database + "'");

  const worker = (meta && meta.workerName) ? meta.workerName : (o.production ? PRODUCTION_WORKER : STAGING_WORKER);
  return {
    environment: o.production ? "production" : "staging",
    database,
    worker,
    config: configPath,
    env: o.env || null,
  };
}

/** Builds the wrangler D1 command `{execPath, argv, displayArgv}` for `sql`. */
export function buildWranglerCommand(sql, o = {}, target, opts = {}) {
  const resolved = target || resolveTarget(o);
  const d1Args = ["d1", "execute", resolved.database];
  if (o.remote) d1Args.push("--remote");
  if (o.local) d1Args.push("--local");
  if (resolved.env) d1Args.push("--env", resolved.env);
  if (resolved.config) d1Args.push("--config", resolved.config);
  d1Args.push("--command", sql);
  try {
    const argv = wranglerArgv(d1Args, { wrangler: o.wrangler });
    return { execPath: process.execPath, argv, displayArgv: [process.execPath].concat(argv) };
  } catch (err) {
    if (opts.requireExecutable || o.wrangler !== undefined) throw err;
    return { execPath: null, argv: null, displayArgv: ["npx", "--yes", "wrangler@" + WRANGLER_VERSION].concat(d1Args) };
  }
}

const formatArg = a => (/[\s"'\\$`!*?#~<>|;&()[\]{}]/.test(a) ? JSON.stringify(a) : a);

export function formatTargetLine(target) {
  return "target: environment=" + target.environment + " worker=" + target.worker + " database=" + target.database
    + (target.env ? " env=" + target.env : "") + " config=" + (target.config || "(none)");
}

export function formatCommandLine(cmd) {
  return "command: " + cmd.displayArgv.map(formatArg).join(" ");
}

/** Prints the target environment/database and exact wrangler command line to stdout before any write runs. */
export function printTargetAndCommand(target, cmd) {
  console.log(formatTargetLine(target));
  console.log(formatCommandLine(cmd));
}

/** Runs `sql` on the resolved D1 database by wrangler (never a shell). */
export function executeSql(sql, o = {}, resolvedTarget) {
  const target = resolvedTarget || resolveTarget(o);
  const cmd = buildWranglerCommand(sql, o, target, { requireExecutable: true });
  child_process.execFileSync(cmd.execPath, cmd.argv, { stdio: "inherit", windowsHide: true });
}
