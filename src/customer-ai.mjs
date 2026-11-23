/* THE CUSTOMER'S OWN AI SERVICE (board 992): which services Studio can speak to, how a request to one is built, how its
 * answer is read, and the one `ask` the import pipeline calls whatever service is behind it.
 *
 * WHOSE WORD. Maxim, 2026-11-11 18:44: "Etiuda own code calling no model was about not implementing a model such as Jev or
 * Claude out of the box. But we made plans for allowing customers bring in their own API to Studio, used for better
 * automated catalog authorisation and imports." And 18:59: "it's supposed to be a general capability for adding API from
 * any one frontier model out there". So nothing here calls anything until a person, or their organisation's Group
 * Policy, has chosen a service, and Studio ships no key of any kind.
 *
 * WHAT LEAVES THE MACHINE, AND TO WHERE. A request goes to one address only: the endpoint the person or the policy
 * configured for the chosen service, or, where they named none, that service's own published address in PROVIDERS. It
 * carries the instruction the feature asks with, the text the person chose to import or author with, and the model's
 * name; its headers carry the content type, the key, and for Anthropic the API version. Nothing else is read into it:
 * not the licence, a signing key, a team, the relay, a path, a name, or any other field of the configuration. requestFor
 * below is the one builder, it reads exactly those fields, and tests/customer-ai.mjs and tests/no-model.mjs hold it.
 * This file makes no request itself: the shell hands aiAsk src/wire.cjs's customerAiRequest as `door`, and that door
 * refuses anything but an https endpoint of the admitted shape, a route's name and the headers named there.
 *
 * EACH SERVICE WAS WRITTEN FROM ITS PROVIDER'S DOCUMENTATION AS READ ON 2026-11-11 (the lead engineer's report of that
 * day names the pages; the addresses and header names stand only on PROVIDERS' lines below): OpenAI's chat completions
 * (a POST to the base address's chat completions route, the key as a bearer token, the text in choices[0].message
 * .content); Azure OpenAI's v1 API, the same request and answer at the resource's /openai/v1/ with the key in a header of
 * its own; Anthropic's Messages API (a POST to the base address's messages route, the key and the API version each in a
 * header of its own, the instruction as the top-level system, max_tokens required, the text in content[]'s text blocks).
 * Google's Gemini through Google's own Interactions API, stable v1, which Google calls generally available and recommends
 * for every new project (read 2026-11-11 by Claudius iota-prime): a POST to the base address's interactions route, the key
 * in Google's own key header, the instruction as system_instruction, the text as input, store false; the answer is the
 * model_output steps' text blocks, and its status says whether it was cut (incomplete) or failed. Google's OpenAI
 * compatibility, which Google marks beta, is still reachable as "compatible" with its address. "compatible" is any other
 * service that speaks the OpenAI protocol, a company's own gateway first among them, and has no address of its own: the
 * person gives one.
 *
 * A SECOND PROTOCOL IS A NEW ENTRY HERE, NEVER A CHANGE TO THE PIPELINE. The pipeline sees aiAsk's ask and nothing of
 * what is behind it. A service of a protocol already here is one line of PROVIDERS; a new protocol is a builder in
 * requestFor and a reader in replyFrom, and tests/no-model.mjs 14 holds the lines that name a vendor's address.
 */
import { refusalOf, counted } from "./refusal.mjs";

/* THE SERVICES. Each on one line, which tests/no-model.mjs 14 holds word for word: a vendor's address may stand in this
   file only on its own service's line, so no service can be sent to another's host. `endpoint` is the published address,
   used only where the person and the policy named none; "" means the person must give one. */
export const PROVIDERS = Object.freeze({
  openai: Object.freeze({ protocol: "chat", auth: "authorization", endpoint: "https://api.openai.com/v1/" }),
  anthropic: Object.freeze({ protocol: "messages", auth: "x-api-key", endpoint: "https://api.anthropic.com/v1/" }),
  google: Object.freeze({ protocol: "interactions", auth: "x-goog-api-key", endpoint: "https://generativelanguage.googleapis.com/v1/" }),
  azure: Object.freeze({ protocol: "chat", auth: "api-key", endpoint: "" }),
  compatible: Object.freeze({ protocol: "chat", auth: "authorization", endpoint: "" }),
});
/* The routes and the one version header, each held by tests/no-model.mjs 14 as the provider lines are. */
const CHAT_ROUTE = "chat/completions";
const MESSAGES_ROUTE = "messages";
const MESSAGES_VERSION = ["anthropic-version", "2026-10-21"];
const INTERACTIONS_ROUTE = "interactions";
/* Anthropic requires a ceiling on the answer's length; an import piece's answer is a few thousand tokens. */
const MESSAGES_MAX_TOKENS = 8192;
/** The route a protocol's request goes to, under the endpoint. */
function routeOf(protocol) {
  return protocol === "messages" ? MESSAGES_ROUTE : protocol === "interactions" ? INTERACTIONS_ROUTE : CHAT_ROUTE;
}

/* THE REFUSALS, each a frame of src/refusal.mjs with its Polish in ui/lang.js. */
export const SAID = Object.freeze({
  none: "No AI service is set up yet. One is chosen from the Menu, under Settings, then AI service.",
  provider: "The AI service named in the settings is not one Studio knows, so nothing was sent: {NAME}",
  endpoint: "The AI service's address must be a full https address with no user name, query or fragment, so nothing was sent: {URL}",
  model: "No model is named for the AI service, so nothing was sent. The model is named from the Menu, under Settings, then AI service.",
  unreached: "The AI service could not be reached: {WHY}",
  late: "The AI service did not answer in time, so the request was given up.",
  key: "The AI service did not accept the key it was given, status {STATUS}. The key is checked from the Menu, under Settings, then AI service.",
  busy: "The AI service is busy and asked Studio to wait; a later try may go through.",
  failed: "The AI service answered with an error, status {STATUS}: {WHY}",
  big: "The AI service's answer was larger than Studio reads, so it was set aside.",
  empty: "The AI service's answer held no text Studio could read.",
  cut: "The AI service stopped its answer early, at the length it allows: {CHARS}",
  managed: "The AI service is set by the organisation's Group Policy, so this setting cannot be changed here.",
  unsealed: "This computer cannot keep the AI service's key for this account: no keyring is open to seal it, so the key was not kept.",
  policy: "Group Policy names an AI service setting Studio cannot use, so it is ignored: {NAME}",
  keyAway: "The organisation's Group Policy sets the AI service's key, and that key goes only to the address the policy sets or to the service's own, never to an address typed here, so nothing was sent.",
  keyNoService: "Not sent: the organisation set a key without naming its service.",
});

const said = (k, vars) => refusalOf(SAID[k], vars);

/** The endpoint as Studio keeps it: an https URL in its canonical form, its path ending in "/", with the service's own
 *  route taken off where the person pasted the whole address. "" where it is not an https address of the admitted shape
 *  (no user, no password, no query, no fragment), which src/wire.cjs would refuse anyway. */
export function endpointShape(text, provider) {
  let u = null;
  try { u = new URL(String(text == null ? "" : text).trim()); } catch { return ""; }
  if (u.protocol !== "https:" || u.username !== "" || u.password !== "" || u.search !== "" || u.hash !== "" || !u.hostname) return "";
  const p = PROVIDERS[provider];
  const route = p ? routeOf(p.protocol) : "";
  let path = u.pathname;
  if (route && path.toLowerCase().endsWith("/" + route)) path = path.slice(0, -route.length);
  else if (route && path.toLowerCase().endsWith("/" + route + "/")) path = path.slice(0, -route.length - 1);
  if (!path.endsWith("/")) path += "/";
  u.pathname = path;
  return u.href;
}

/** Where a request for `config` goes: the endpoint configured, or the chosen service's own published address. "" where
 *  there is neither, which is a refusal. THE ONE PLACE AN ADDRESS IS CHOSEN. */
export function endpointFor(config) {
  const p = PROVIDERS[config && config.provider];
  if (!p) return "";
  const given = String((config && (config.endpoint || config.given)) || "");
  return given ? endpointShape(given, config.provider) : p.endpoint;
}

/* DEFAULT (1), Claude alpha 2026-11-11 18:55, for Maxim to confirm or change: where Group Policy and the person's own
   setting disagree, the policy wins, field by field, and the page shows the field read-only with a line saying the
   organisation set it (`managed`). To change the rule, change this one function. */
function policyWins(policyValue, personValue) {
  return policyValue ? { value: policyValue, managed: true } : { value: personValue || "", managed: false };
}

/** The configuration in force: `person` is what the person saved ({provider, endpoint, model}), `policy` what Group
 *  Policy set (aiPolicyFrom's `got`). Answers {provider, endpoint, given, model, managed: {provider, endpoint, model, key}, keyAway, keyNoService},
 *  `endpoint` the address a request would go to and `given` the one the person or policy wrote. The key is chosen by keyFor, apart.
 *  `keyNoService` is true where the policy set a key and named neither a provider nor an address: the key works at one service
 *  only, so nothing is sent until IT names the service or address. `keyAway` is true where the policy set a key and a provider
 *  and the address in force is neither the policy's own nor, with none set, the service's published one: the organisation's key
 *  never goes to an address the person typed (the test architect's finding on the 992 core), and aiReady then refuses. */
export function aiConfig(person, policy) {
  const me = person && typeof person === "object" ? person : {}, org = policy && typeof policy === "object" ? policy : {};
  const provider = policyWins(org.provider, me.provider), model = policyWins(org.model, me.model);
  /* The person's address belongs to the service the person chose: where the policy chose another service and named no
     address, the person's address is not carried over to it. */
  const ownEndpoint = org.provider && org.provider !== me.provider ? "" : me.endpoint;
  const orgEndpoint = org.endpoint || org.endpointRefused || "";
  const endpoint = policyWins(orgEndpoint, ownEndpoint);
  const config = { provider: String(provider.value), endpoint: String(endpoint.value), model: String(model.value) };
  const at = endpointFor(config), published = PROVIDERS[config.provider] ? PROVIDERS[config.provider].endpoint : "";
  const keyNoService = !!org.key && !provider.managed && !endpoint.managed; /* plant:ai-key-no-service */
  const keyHome = endpoint.managed ? at !== "" : (provider.managed && at !== "" && at === published);
  return {
    provider: config.provider, endpoint: at, given: config.endpoint, model: config.model,
    managed: { provider: provider.managed, endpoint: endpoint.managed, model: model.managed, key: !!org.key },
    keyAway: !!org.key && !keyNoService && !keyHome,
    keyNoService,
  };
}

/* THE KEY. It is kept sealed by the operating system (Electron's safeStorage, the shell's `vault`), never in plain text,
   never logged, never handed to the page, and sealed together with the address it was given for: a key is used only
   for that address, so a policy or an edited settings file that moves the address does not move the key with it. */
export const KEY_KIND = "etiuda-studio-ai-key";
/** The file's object for `key` given for `endpoint`, sealed by `vault`. Null where the vault cannot seal. */
export function keySealed(vault, endpoint, key) {
  if (!vault || !vault.available()) return null;
  const sealed = Buffer.from(vault.seal(JSON.stringify({ for: String(endpoint), key: String(key) }))).toString("base64");
  return { format: 1, kind: KEY_KIND, sealed };
}
/** The key in `doc` (keySealed's object, as read back), or "" where it was given for another address or cannot be
 *  opened on this account. */
export function keyOpened(vault, doc, endpoint) {
  if (!vault || !doc || doc.kind !== KEY_KIND || typeof doc.sealed !== "string") return "";
  try {
    const inner = JSON.parse(String(vault.open(Buffer.from(doc.sealed, "base64"))));
    return inner && inner.for === String(endpoint) && typeof inner.key === "string" ? inner.key : "";
  } catch { return ""; }
}
/** The key in force for `config` (aiConfig's answer): the policy's where it set one (default (1)) and the address in force
 *  is its home (config.keyAway false), "" where it is not, else the person's own kept for this address. */
export function keyFor(policy, vault, doc, config) {
  if (policy && policy.key) return config && config.endpoint && !config.keyAway && !config.keyNoService ? String(policy.key) : "";
  return keyOpened(vault, doc, config ? config.endpoint : "");
}

/* GROUP POLICY. HKLM\SOFTWARE\Policies\Etiuda, read by src/ai-policy.cjs as `reg query` prints it. The desk's reader
   (the engine's shell/main.js, joinPolicyFacts) voids the whole key on a line it does not know; this one is lenient on
   purpose, since the key holds the desk's values beside these: a line it does not know is passed over, and a value of
   its own that it cannot use is said and ignored alone. Values are REG_SZ (or REG_EXPAND_SZ, taken as written). */
const POLICY_NAMES = { aiprovider: "provider", aiendpoint: "endpoint", aimodel: "model", aikey: "key" };
const POLICY_SHOWN = { provider: "AiProvider", endpoint: "AiEndpoint", model: "AiModel", key: "AiKey" };
/** {got: {provider?, endpoint?, model?, key?}, said: [refusalOf]} from reg query's text. */
export function aiPolicyFrom(text) {
  const got = {}, bad = [];
  let own = false;
  for (const line of String(text || "").split(/\r?\n/)) {
    /* reg query heads the key's own values with the key's name and a subkey's with the subkey's: only the key's own are read. */
    if (/^HKEY_/i.test(line)) { own = /^HKEY_LOCAL_MACHINE\\SOFTWARE\\Policies\\Etiuda$/i.test(line.trim()); continue; }
    const m = own ? /^ {4}(\S(?:.*?\S)?) {4}(REG_[A-Z_]+)(?: {4}(.*))?$/.exec(line) : null;
    if (!m) continue;
    const field = POLICY_NAMES[m[1].toLowerCase()];
    if (!field) continue;
    const value = String(m[3] || "").trim();
    if (m[2] !== "REG_SZ" && m[2] !== "REG_EXPAND_SZ") {
      bad.push(field);
      if (field === "endpoint") got.endpointRefused = POLICY_SHOWN.endpoint;
      continue;
    }
    if (!value) continue;
    /* A control character, or the replacement character a value outside the console's code page comes back as. */
    if (/[\u0000-\u001f\u007f]/.test(value) || value.indexOf(String.fromCharCode(0xfffd)) >= 0) {
      bad.push(field);
      if (field === "endpoint") got.endpointRefused = POLICY_SHOWN.endpoint;
      continue;
    }
    got[field] = value;
  }
  if (got.provider !== undefined && !PROVIDERS[got.provider.toLowerCase()]) { bad.push("provider"); delete got.provider; }
  if (got.provider !== undefined) got.provider = got.provider.toLowerCase();
  if (got.endpoint !== undefined) {
    const shaped = endpointShape(got.endpoint, got.provider);
    if (shaped) got.endpoint = shaped; else { bad.push("endpoint"); got.endpointRefused = got.endpoint; delete got.endpoint; } /* plant:ai-policy-endpoint */
  }
  return { got, said: bad.map((k) => said("policy", { NAME: POLICY_SHOWN[k] })) };
}

/** Null where a request can be made for `config`, else the refusal ({message, said}) saying what is missing. */
export function aiReady(config) {
  if (config && config.keyNoService) return said("keyNoService");
  if (!config || !config.provider) return said("none");
  if (!PROVIDERS[config.provider]) return said("provider", { NAME: String(config.provider) });
  if (!endpointFor(config)) return said("endpoint", { URL: String(config.endpoint || config.given || "") });
  if (!String(config.model || "").trim()) return said("model");
  if (config.keyAway) return said("keyAway");
  return null;
}

/** THE ONE BUILDER OF WHAT LEAVES: {endpoint, route, headers, body} for `config` ({provider, endpoint, model, key}),
 *  the instruction `prompt` and the person's `text`. It reads those fields and nothing else; `body` is the JSON's bytes. */
export function requestFor(config, prompt, text) {
  const p = PROVIDERS[config.provider];
  const model = String(config.model).trim(), key = String(config.key || "");
  const headers = { "content-type": "application/json" };
  if (key) headers[p.auth] = p.auth === "authorization" ? "Bearer " + key : key;
  const route = routeOf(p.protocol);
  let doc = null;
  if (p.protocol === "messages") {
    headers[MESSAGES_VERSION[0]] = MESSAGES_VERSION[1];
    doc = { model, max_tokens: MESSAGES_MAX_TOKENS, system: String(prompt), messages: [{ role: "user", content: String(text) }] };
  } else if (p.protocol === "interactions") {
    /* store false: Google keeps an interaction for later turns by default (55 days on a paid project, its overview says), and
       Studio asks one question at a time and never comes back for it, so the person's text is not kept there for Studio. */
    doc = { model, system_instruction: String(prompt), input: String(text), store: false };
  } else {
    doc = { model, messages: [{ role: "system", content: String(prompt) }, { role: "user", content: String(text) }] };
  }
  return { endpoint: endpointFor(config), route, headers, body: Buffer.from(JSON.stringify(doc), "utf8") };
}

/* The service's own words for an error, one line and short, for the person or their IT to act on. */
function theirWords(doc) {
  const e = doc && doc.error;
  const m = e && typeof e === "object" ? e.message : typeof e === "string" ? e : "";
  return String(m || "").replace(/[\u0000-\u001f\u007f]+/g, " ").trim().slice(0, 200);
}

/** The answer's text, or the refusal, from the service's {status, bytes}: {ok: true, text} or {ok: false, ...refusalOf}. */
export function replyFrom(provider, status, bytes) {
  const no = (r) => ({ ok: false, refusal: r.message, said: r.said });
  if (status === 401 || status === 403) return no(said("key", { STATUS: String(status) }));
  if (status === 429) return no(said("busy"));
  if (!(status >= 200 && status < 300)) return no(said("failed", { STATUS: String(status), WHY: "-" })); /* plant:ai-error-words */
  let doc = null;
  try { doc = JSON.parse(Buffer.from(bytes || []).toString("utf8")); } catch { doc = null; }
  if (!doc || typeof doc !== "object") return no(said("empty"));
  let text = "", stop = "";
  const protocol = PROVIDERS[provider] ? PROVIDERS[provider].protocol : "";
  const texts = (list) => (Array.isArray(list) ? list : []).filter((b) => b && b.type === "text" && typeof b.text === "string").map((b) => b.text).join("");
  if (protocol === "messages") {
    text = texts(doc.content);
    stop = doc.stop_reason === "max_tokens" ? "cut" : "";
  } else if (protocol === "interactions") {
    /* The answer is the model_output steps' text; a thought step's summary is the model's working, not its answer. A status
       other than completed is said: incomplete is an answer cut at its length, the rest Google's own words from errors. */
    const steps = Array.isArray(doc.steps) ? doc.steps : [];
    text = steps.filter((s) => s && s.type === "model_output").map((s) => texts(s.content)).join("");
    if (doc.status === "incomplete") stop = "cut";
    else if (doc.status !== undefined && doc.status !== "completed") {
      const first = Array.isArray(doc.errors) ? doc.errors[0] : null;
      return no(said("failed", { STATUS: String(doc.status).slice(0, 40), WHY: theirWords({ error: first }) || "-" }));
    }
  } else {
    const first = Array.isArray(doc.choices) ? doc.choices[0] : null;
    const content = first && first.message ? first.message.content : null;
    text = typeof content === "string" ? content : "";
    stop = first && first.finish_reason === "length" ? "cut" : "";
  }
  if (stop === "cut") return no(said("cut", { CHARS: counted(text.length, "{N} character", "{N} characters") }));
  if (!text.trim()) return no(said("empty"));
  return { ok: true, text };
}

/* What src/wire.cjs throws, read back into a refusal. Its sentences are the door's own (bounded's "did not answer within",
   its cap's "answered more than", its refusal's "sends to the AI service only"), held by tests/customer-ai.mjs against the
   real file; anything else is the network's own word, Chromium's net::ERR_ name where it gives one. */
function thrownSaid(err) {
  const m = String(err && err.message || err || "");
  if (/did not answer within/.test(m)) return said("late");
  if (/answered more than/.test(m)) return said("big");
  if (/sends to the AI service only/.test(m)) return said("endpoint", { URL: "" });
  return said("unreached", { WHY: m.replace(/[\u0000-\u001f\u007f]+/g, " ").trim().slice(0, 200) || "-" });
}

/* THE JOBS. Maxim, 2026-11-11 19:15: "first version id those three jobs, yes", the three of the product designer's page of
   19:05 (etiuda-ai-role-2026-11-11/role.md): bringing in old replies (src/import-text.mjs, built), the other language for a
   card, and a card from a described situation; and the connection test in Settings, which sends TEST_PROMPT alone. Her
   page's three rules hold for each: the lead starts it and sees what is sent and where before it goes (aiSends), the
   model's words arrive marked in the review queue, and nothing a model says gates publishing. Maxim, 19:07: "Nothing
   leaves the computer by default. But if client is plugging their own APi into Etiuda, it means they are intentionally
   waiving this privacy heuristic for their ApI". So nothing is sent unless a service is configured (aiReady) and a job
   the lead started asks (aiAsk takes the job by name; tests/no-model.mjs 14 holds that the shell asks only from the
   lead's acts). A later job is a name here and its own prompt, never a second door. */
export const JOBS = Object.freeze(["import", "language", "situation", "test"]);

/** WHAT A JOB WOULD SEND, AND WHERE, for the line the lead reads before it goes: `texts` are the strings the job will
 *  send (the pasted file for an import; the card and its voice cards for a language; the lead's sentences and the voice
 *  cards for a situation). Answers {job, service, address, host, managed, pieces, chars, refusal}: `address` the one URL
 *  base a send goes to and `host` its host, `managed` true where the organisation set the address, `chars` the texts'
 *  length summed, and `refusal` ({message, said}) where nothing can be sent yet, else null. Sends nothing. */
export function aiSends(config, job, texts) {
  const list = Array.isArray(texts) ? texts.map((t) => String(t == null ? "" : t)) : [];
  const address = config ? endpointFor(config) : "";
  let host = "";
  try { host = address ? new URL(address).host : ""; } catch { host = ""; }
  return { job: String(job), service: String(config && config.provider || ""), address, host,
    managed: !!(config && config.managed && config.managed.endpoint), pieces: list.length,
    chars: list.reduce((n, t) => n + t.length, 0), refusal: aiReady(config) };
}

/** THE ONE ASK EVERY JOB CALLS (src/import-text.mjs's opts.ask for an import): `config` is {provider, endpoint, model,
 *  key, keyAway}, `door` src/wire.cjs's customerAiRequest, `job` one of JOBS. Answers async ({prompt, body}) => {ok: true,
 *  text} or {ok: false, refusal, said}, and never throws once made. The model is the configuration's: a `model` the
 *  pipeline passes is not read, so what is sent is what the person or the policy chose. `keyAway` (aiConfig's) is carried
 *  into the ask's own aiReady, so the ask refuses the organisation's key at an address the person typed by itself, not only
 *  where its caller checked first (the test architect's note on fold 7). */
export function aiAsk(config, door, job) {
  if (JOBS.indexOf(job) < 0) throw new Error("aiAsk wants the job it asks for, one of " + JOBS.join(", ") + ": " + String(job));
  const cfg = { provider: String(config && config.provider || ""), endpoint: String(config && config.endpoint || ""),
    given: String(config && config.given || ""), model: String(config && config.model || ""), key: String(config && config.key || ""),
    keyAway: !!(config && config.keyAway), keyNoService: !!(config && config.keyNoService) };
  return async (q) => {
    const no = aiReady(cfg);
    if (no) return { ok: false, refusal: no.message, said: no.said };
    const req = requestFor(cfg, q && q.prompt, q && q.body);
    let res = null;
    try { res = await door(req.endpoint, req.route, req.headers, req.body); }
    catch (err) { const r = thrownSaid(err); return { ok: false, refusal: r.message, said: r.said }; }
    return replyFrom(cfg.provider, res.status, res.bytes);
  };
}

/* THE CONNECTION TEST in Settings asks this and nothing else: no catalog text goes with it. */
export const TEST_PROMPT = "Answer with the single word ok.";
export const TEST_TEXT = "ok";
