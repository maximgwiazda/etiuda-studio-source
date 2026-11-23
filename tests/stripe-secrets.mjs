/* STRIPE'S TWO SECRETS, FROM THE KEYRING TO THE WORKER (the payment design, B2, for Stripe; Max, 2026-11-13 17:37: "Agreed on
 * Stripe").
 *
 *     node tests/stripe-secrets.mjs
 *
 * `node tools/sign.mjs stripe --staging` reads etiuda-stripe/test-webhook-secret and etiuda-stripe/test-restricted-key from the
 * keyring, where the office's tools/stripe-keep.py keeps them, and puts them into the licence service's Worker as
 * STRIPE_WEBHOOK_SECRET and STRIPE_API_KEY, the names service/licence/pay-stripe.mjs reads, each by `wrangler secret put` with
 * its value on wrangler's stdin. Without --staging it puts the live pair into a Worker that is not a staging one.
 *
 * NO LEG OPENS THE REAL KEYRING. Every run goes through a driver that imports the tool and hands it an in-memory reader (the
 * test architect's E3: nothing in the environment can name a reader), answering from a file this leg wrote. wrangler is a
 * stand-in that keeps what each run of it was handed, so nothing reaches Cloudflare and no Worker is touched.
 *
 *   ss1  a staging run reads exactly the two test entries and puts STRIPE_WEBHOOK_SECRET then STRIPE_API_KEY, each run as exactly
 *        `secret put <NAME> --config <the service's wrangler.toml>`, its value on a pipe to wrangler's stdin, and lists nothing
 *   ss2  the names put are the ones pay-stripe.mjs reads and wrangler.toml declares, and a value the tool puts is one the
 *        service's own stripeProvider().config accepts, a value it refuses one the service refuses
 *   ss3  no value reaches any output, any argument or wrangler's inherited passphrase; wrangler's metrics are off
 *   ss4  each refusal is one line with nothing put: an entry missing, empty or unreadable, a secret key, a key of the other mode,
 *        a misshapen signing secret, --staging against a Worker that is not staging or its absence against one that is,
 *        --staging with a value, an --out, a configuration that is not there
 *   ss5  a put wrangler refuses stops the rest and says what was put and what was not
 *   ss6  without --staging, against a Worker that is not staging, it reads and puts the live pair
 *   ss7  with --cf-keyring and --cf-account the Cloudflare token reaches each put in wrangler's environment alone; one without the
 *        other is refused
 *   ss8  the header's usage and the usage refusal name the stripe command
 *
 * PROVED BY MAKING IT FAIL: run before the command existed (every leg red); then each plant marked in tools/sign.mjs
 * (stripe-stdin, stripe-mode, stripe-stop, stripe-shape) set in turn, each turning a leg here red; the report of 2026-11-13 names
 * which.
 *
 * Node only. It does not launch the program.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { clearScratch, dropScratch } from "./scratch.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const SCRATCH = path.join(ROOT, "scratch", "stripe-secrets");
const TOOL = path.join(ROOT, "tools", "sign.mjs");
const TOML = path.join(ROOT, "service", "licence", "wrangler.toml");
const NL = String.fromCharCode(10);
const EXPECTED = 8;

let asserted = 0, failed = 0;
function check(cond, line) {
  asserted++;
  if (!cond) failed++;
  process.stdout.write((cond ? "  ok   " : "  FAIL ") + line + NL);
}
const put = (p, text) => { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, text); return p; };
const sha = (v) => crypto.createHash("sha256").update(String(v)).digest("hex");
const alnum = (n) => { let s = ""; while (s.length < n) s += crypto.randomBytes(48).toString("base64").replace(/[^A-Za-z0-9]/g, ""); return s.slice(0, n); };

clearScratch(SCRATCH);
const LAB = path.join(SCRATCH, "lab"), CAP = path.join(SCRATCH, "capture"), SW = path.join(SCRATCH, "stand-ins");
for (const d of [LAB, CAP, SW]) fs.mkdirSync(d, { recursive: true });

/* The values: made here, of the shapes Stripe gives (docs.stripe.com/keys: "rk_test_" in a sandbox, "rk_live_" in live mode;
   docs.stripe.com/webhooks: a signing secret "beginning with whsec_"), and planted nowhere else. */
const HOOK_T = "whsec_" + alnum(32), HOOK_L = "whsec_" + alnum(32);
const KEY_T = "rk_test_" + alnum(99), KEY_L = "rk_live_" + alnum(99);
const SK_T = "sk_test_" + alnum(99), CF_TOKEN = "cf-" + alnum(40), CF_ACCOUNT = crypto.randomBytes(16).toString("hex");
const VALUES = [HOOK_T, HOOK_L, KEY_T, KEY_L, SK_T, CF_TOKEN];
const TEST_RING = { "etiuda-stripe/test-webhook-secret": HOOK_T, "etiuda-stripe/test-restricted-key": KEY_T };
const LIVE_RING = { "etiuda-stripe/live-webhook-secret": HOOK_L, "etiuda-stripe/live-restricted-key": KEY_L };

/* wrangler's stand-in: each run keeps its arguments, its stdin, whether stdin was a pipe, and what of its environment matters. */
const standIn = put(path.join(SW, "wrangler.mjs"), [
  "import fs from \"node:fs\"; import path from \"node:path\"; import crypto from \"node:crypto\";",
  "const dir = process.env.STANDIN_CAPTURE; let input = \"\";",
  "const n = fs.readdirSync(dir).length;",
  "const seen = () => ({ argv: process.argv.slice(2), stdin: input, tty: !!process.stdin.isTTY,",
  "  pass: Object.prototype.hasOwnProperty.call(process.env, \"STUDIO_KEY_PASSPHRASE\"), metrics: process.env.WRANGLER_SEND_METRICS,",
  "  cf: process.env.CLOUDFLARE_API_TOKEN === undefined ? null : crypto.createHash(\"sha256\").update(process.env.CLOUDFLARE_API_TOKEN).digest(\"hex\"),",
  "  account: process.env.CLOUDFLARE_ACCOUNT_ID === undefined ? null : process.env.CLOUDFLARE_ACCOUNT_ID });",
  "process.stdin.setEncoding(\"utf8\"); process.stdin.on(\"data\", (d) => { input += d; });",
  "process.stdin.on(\"end\", () => {",
  "  fs.writeFileSync(path.join(dir, String(n).padStart(3, \"0\") + \".json\"), JSON.stringify(seen()));",
  "  if (String(n) === String(process.env.STANDIN_FAIL_AT)) { process.stderr.write(\"stand-in: no such account\\n\"); process.exit(1); }",
  "  process.stdout.write(\"Success! Uploaded secret \" + process.argv[4] + \"\\n\");",
  "});", ""].join(NL));

/* The driver: the tool imported and `stripe` run in this very process, with an in-memory reader that answers from the leg's file
   keyed "<service>/<user>", logs each entry it was asked for, and answers as a keyring that did not start for an entry mapped to
   false. The real keyring is never opened. */
const driverAt = put(path.join(SW, "driver.mjs"), [
  "import fs from \"node:fs\"; import path from \"node:path\"; import { pathToFileURL } from \"node:url\";",
  "const [tool, ringFile, ringLog, ...args] = process.argv.slice(2);",
  "const reader = (service, user) => {",
  "  fs.appendFileSync(ringLog, JSON.stringify([service, user]) + \"\\n\");",
  "  const v = JSON.parse(fs.readFileSync(ringFile, \"utf8\"))[service + \"/\" + user];",
  "  return v === false ? { status: 1, stdout: \"\" } : { status: 0, stdout: typeof v === \"string\" ? v + \"\\n\" : \"\" };",
  "};",
  "const sign = await import(pathToFileURL(tool).href);",
  "const { parse } = await import(pathToFileURL(path.join(path.dirname(tool), \"publish.mjs\")).href);",
  "if (typeof sign.stripeMain !== \"function\") { process.stderr.write(\"sign  there is no stripe command\\n\"); process.exit(3); }",
  "await sign.stripeMain(parse(args), { keyringReader: reader });", ""].join(NL));

const prodToml = put(path.join(SCRATCH, "prod", "wrangler.toml"),
  "name = \"etiuda-licence\"\nmain = \"worker.mjs\"\n[vars]\nAPI_PREFIX = \"/licence/v1/\"\n");

let runs = 0;
const all = [];
function run(more, o = {}) {
  const cap = path.join(CAP, "run-" + (++runs));
  fs.mkdirSync(cap, { recursive: true });
  const ringFile = put(cap + "-ring.json", JSON.stringify(o.ring === undefined ? TEST_RING : o.ring)), ringLog = cap + "-ring.log";
  const env = Object.assign({}, process.env, { STANDIN_CAPTURE: cap, STUDIO_KEY_PASSPHRASE: "planted passphrase " + runs });
  for (const k of ["STANDIN_FAIL_AT", "CLOUDFLARE_API_TOKEN", "CLOUDFLARE_ACCOUNT_ID", "CLOUDFLARE_API_KEY", "CLOUDFLARE_EMAIL", "STUDIO_KEYRING_READER"]) delete env[k];
  if (o.failAt !== undefined) env.STANDIN_FAIL_AT = String(o.failAt);
  const args = ["stripe", "--wrangler", standIn].concat(more);
  const r = spawnSync(process.execPath, [driverAt, TOOL, ringFile, ringLog].concat(args), { cwd: LAB, encoding: "utf8", env });
  const puts = fs.readdirSync(cap).sort().map((n) => JSON.parse(fs.readFileSync(path.join(cap, n), "utf8")));
  const reads = fs.existsSync(ringLog) ? fs.readFileSync(ringLog, "utf8").split(NL).filter(Boolean).map((l) => JSON.parse(l)) : [];
  const out = { name: o.name || more.join(" "), status: r.status, stdout: String(r.stdout), stderr: String(r.stderr), puts, reads, args };
  all.push(out);
  process.stdout.write("  -- " + out.name + ": exit " + out.status + ", " + puts.length + " put(s), " + reads.length + " read(s)"
    + (out.stderr.trim() ? "; " + out.stderr.trim().split(NL).join(" / ") : "") + NL);
  return out;
}
const putArgv = (name, config) => JSON.stringify(["secret", "put", name, "--config", config]);

/* ---- ss1 the staging run ---------------------------------------------------------------------------------------------- */
const good = run(["--staging"], { name: "staging" });
check(good.status === 0 && good.puts.length === 2
  && JSON.stringify(good.puts.map((p) => p.argv)) === JSON.stringify([JSON.parse(putArgv("STRIPE_WEBHOOK_SECRET", TOML)), JSON.parse(putArgv("STRIPE_API_KEY", TOML))])
  && good.puts.every((p) => p.tty === false) && good.puts[0].stdin === HOOK_T && good.puts[1].stdin === KEY_T
  && JSON.stringify(good.reads) === JSON.stringify([["etiuda-stripe", "test-webhook-secret"], ["etiuda-stripe", "test-restricted-key"]])
  && /STRIPE_WEBHOOK_SECRET, STRIPE_API_KEY/.test(good.stdout),
  "ss1 a staging run reads exactly etiuda-stripe/test-webhook-secret and test-restricted-key and puts STRIPE_WEBHOOK_SECRET then STRIPE_API_KEY,"
  + " each as exactly `secret put <NAME> --config <the service's wrangler.toml>`, its value on a pipe to wrangler's stdin, and lists nothing");

/* ---- ss2 the names and the shapes are the service's -------------------------------------------------------------------- */
{
  const src = fs.readFileSync(path.join(ROOT, "service", "licence", "pay-stripe.mjs"), "utf8"), toml = fs.readFileSync(TOML, "utf8");
  const namesHold = ["STRIPE_WEBHOOK_SECRET", "STRIPE_API_KEY"].every((n) => src.includes("env." + n) && new RegExp("^#\\s+" + n + "\\s", "m").test(toml));
  const { stripeProvider } = await import(pathToFileURL(path.join(ROOT, "service", "licence", "pay-stripe.mjs")).href);
  const serviceTakes = (hook, key) => stripeProvider().config({ STRIPE_WEBHOOK_SECRET: hook, STRIPE_API_KEY: key, STRIPE_VERSION: "2025-03-31.basil", STRIPE_PRICES: "{}", STRIPE_MODE: "test" }) !== null;
  const samples = [
    ["both well formed", HOOK_T, KEY_T],
    ["a secret key", HOOK_T, SK_T],
    ["a key too short", HOOK_T, "rk_test_" + alnum(9)],
    ["a key too long", HOOK_T, "rk_test_" + alnum(241)],
    ["a key with a hyphen", HOOK_T, "rk_test_" + alnum(20) + "-" + alnum(5)],
    ["a signing secret too short", "whsec_" + alnum(7), KEY_T],
    ["a signing secret with a space", "whsec_" + alnum(10) + " " + alnum(10), KEY_T],
    ["a signing secret without whsec_", alnum(32), KEY_T],
  ];
  const rows = samples.map(([name, hook, key]) => {
    const r = run(["--staging"], { name: "shape: " + name, ring: { "etiuda-stripe/test-webhook-secret": hook, "etiuda-stripe/test-restricted-key": key } });
    const tool = r.status === 0 && r.puts.length === 2, service = serviceTakes(hook, key);
    return { name, tool, service, clean: r.status === 0 || r.puts.length === 0 };
  });
  rows.forEach((x) => process.stdout.write("  -- " + x.name + ": tool " + (x.tool ? "puts" : "refuses") + ", service " + (x.service ? "takes" : "refuses") + NL));
  check(namesHold && rows.every((x) => x.tool === x.service && x.clean) && rows.filter((x) => x.tool).length === 1,
    "ss2 the names put are the ones pay-stripe.mjs reads and wrangler.toml declares, and over " + rows.length
    + " shapes the tool puts exactly what the service's own stripeProvider().config takes, refusing the rest with nothing put");
}

/* ---- ss6 the live pair (run before ss3, which reads every run) ---------------------------------------------------------- */
const live = run(["--config", prodToml], { name: "live", ring: LIVE_RING });

/* ---- ss4 refusals ------------------------------------------------------------------------------------------------------- */
const refusals = [
  ["missing", run(["--staging"], { name: "missing", ring: { "etiuda-stripe/test-webhook-secret": HOOK_T } }), /test-restricted-key is empty or missing/],
  ["empty", run(["--staging"], { name: "empty", ring: Object.assign({}, TEST_RING, { "etiuda-stripe/test-webhook-secret": "" }) }), /test-webhook-secret is empty or missing/],
  ["no answer", run(["--staging"], { name: "no answer", ring: Object.assign({}, TEST_RING, { "etiuda-stripe/test-restricted-key": false }) }), /test-restricted-key could not be read/],
  ["secret key", run(["--staging"], { name: "secret key", ring: Object.assign({}, TEST_RING, { "etiuda-stripe/test-restricted-key": SK_T }) }), /secret key/],
  ["live key under --staging", run(["--staging"], { name: "live key under --staging", ring: Object.assign({}, TEST_RING, { "etiuda-stripe/test-restricted-key": KEY_L }) }), /is a live key/],
  ["test key in live", run(["--config", prodToml], { name: "test key in live", ring: Object.assign({}, LIVE_RING, { "etiuda-stripe/live-restricted-key": KEY_T }) }), /is a test key/],
  ["--staging against production", run(["--staging", "--config", prodToml], { name: "--staging against production" }), /not a staging/],
  ["live against staging", run([], { name: "live against staging", ring: LIVE_RING }), /--staging/],
  ["--staging with a value", run(["--staging", "yes"], { name: "--staging with a value" }), /--staging takes no value/],
  ["--out", run(["--staging", "--out", path.join(SCRATCH, "nowhere")], { name: "--out" }), /writes no file/],
  ["no config", run(["--staging", "--config", path.join(SCRATCH, "no-such.toml")], { name: "no config" }), /no wrangler configuration/],
];
check(refusals.every(([, r, said]) => r.status === 2 && r.puts.length === 0 && said.test(r.stderr) && r.stderr.trim().split(NL).length === 1 && r.stderr.startsWith("sign  "))
  && ["--staging against production", "live against staging", "--staging with a value", "--out", "no config"].every((n) => refusals.find((x) => x[0] === n)[1].reads.length === 0),
  "ss4 each refusal is one line with nothing put (" + refusals.length + " cases: an entry missing, empty or unreadable, a secret key, a key of the other mode either way,"
  + " --staging against a Worker that is not staging or its absence against one that is, --staging with a value, an --out, no configuration),"
  + " and a refusal of the arguments or the Worker reads no entry at all");

/* ---- ss5 a put wrangler refuses ------------------------------------------------------------------------------------------ */
const failFirst = run(["--staging"], { name: "wrangler refuses the first", failAt: 0 }), failSecond = run(["--staging"], { name: "wrangler refuses the second", failAt: 1 });
check(failFirst.status === 2 && failFirst.puts.length === 1 && /nothing was put/.test(failFirst.stderr)
  && failSecond.status === 2 && failSecond.puts.length === 2 && /put STRIPE_WEBHOOK_SECRET; not put STRIPE_API_KEY/.test(failSecond.stderr),
  "ss5 a put wrangler refuses stops the rest: refused first, the second is never tried and it says nothing was put; refused second, it names what was put and what was not");

/* ---- ss6 ------------------------------------------------------------------------------------------------------------------ */
check(live.status === 0 && live.puts.length === 2 && live.puts[0].stdin === HOOK_L && live.puts[1].stdin === KEY_L
  && JSON.stringify(live.puts[0].argv) === putArgv("STRIPE_WEBHOOK_SECRET", prodToml)
  && JSON.stringify(live.reads) === JSON.stringify([["etiuda-stripe", "live-webhook-secret"], ["etiuda-stripe", "live-restricted-key"]]),
  "ss6 without --staging, against a Worker whose name is not a staging one, it reads etiuda-stripe/live-* and puts the live pair");

/* ---- ss7 the Cloudflare token from the keyring ----------------------------------------------------------------------------- */
const cfArgs = ["--staging", "--cf-keyring", "argos-test/token", "--cf-account", CF_ACCOUNT];
const viaRing = run(cfArgs, { name: "with the Cloudflare keyring", ring: Object.assign({ "argos-test/token": CF_TOKEN }, TEST_RING) });
const accountAlone = run(["--staging", "--cf-account", CF_ACCOUNT], { name: "account alone" });
const ringAlone = run(["--staging", "--cf-keyring", "argos-test/token"], { name: "keyring alone", ring: Object.assign({ "argos-test/token": CF_TOKEN }, TEST_RING) });
check(viaRing.status === 0 && viaRing.puts.length === 2 && viaRing.puts.every((p) => p.cf === sha(CF_TOKEN) && p.account === CF_ACCOUNT)
  && good.puts.every((p) => p.cf === null && p.account === null)
  && accountAlone.status === 2 && accountAlone.puts.length === 0 && ringAlone.status === 2 && ringAlone.puts.length === 0 && ringAlone.reads.length === 0,
  "ss7 with --cf-keyring and --cf-account the token reaches each put in wrangler's environment with the account (and without them none does);"
  + " one without the other is refused with nothing read or put");

/* ---- ss3 nothing leaks (read over every run above) ------------------------------------------------------------------------- */
{
  const leaks = [];
  for (const r of all) {
    const text = r.stdout + r.stderr + JSON.stringify(r.args) + JSON.stringify(r.puts.map((p) => p.argv));
    for (const v of VALUES) if (text.includes(v) || text.includes(v.slice(-24))) leaks.push(r.name + " holds " + v.slice(0, 6) + "...");
    if (r.puts.some((p) => p.pass || p.metrics !== "false")) leaks.push(r.name + ": a put inherited the passphrase or ran with metrics on");
  }
  const control = [HOOK_T, KEY_T].every((v) => ("x" + v + "y").includes(v.slice(-24)));
  leaks.forEach((l) => process.stdout.write("  -- leak: " + l + NL));
  check(control && leaks.length === 0 && all.length > 20,
    "ss3 over " + all.length + " runs no value (whole, or its last 24 characters) is in any output, any argument the tool was given or gave wrangler,"
    + " and no put inherited the passphrase or ran with wrangler's metrics on");
}

/* ---- ss8 the usage ------------------------------------------------------------------------------------------------------- */
{
  const head = fs.readFileSync(TOOL, "utf8").split("*/")[0];
  const u = spawnSync(process.execPath, [TOOL], { cwd: LAB, encoding: "utf8", env: Object.assign({}, process.env, { STUDIO_KEY_PASSPHRASE: "" }) });
  check(head.includes("node tools/sign.mjs stripe [--staging]") && u.status === 2 && String(u.stderr).includes("node tools/sign.mjs stripe [--staging]"),
    "ss8 the header's usage and the usage refusal name `node tools/sign.mjs stripe [--staging]`");
}

process.stdout.write("#counts checks=" + asserted + " failed=" + failed + " expected=" + EXPECTED + NL);
dropScratch(SCRATCH, "stripe-secrets");
process.exit(failed || asserted !== EXPECTED ? 1 : 0);
