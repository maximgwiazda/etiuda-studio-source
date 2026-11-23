/* THE CUSTOMER'S OWN AI SERVICE, ITS PARTS ONE BY ONE (board 992).
 *
 *     node tests/customer-ai.mjs
 *
 * src/customer-ai.mjs builds each request and reads each answer; src/wire.cjs's AI door sends it. tests/no-model.mjs 14 holds
 * where a request may go; this file holds what it is, what comes back, the key and the policy. No network: the door is
 * driven through Electron's net stood in, and nothing starts Studio.
 *
 * THE RECORDED SHAPES are each provider's own documented example, read on 2026-11-11 (the lead engineer's report of that
 * day names the pages): OpenAI's chat completions example (developers.openai.com, chat completions create), Azure OpenAI's
 * v1 chat example (learn.microsoft.com, Microsoft Foundry REST reference, Azure OpenAI chat), Anthropic's Messages example
 * (platform.claude.com, "Using the Messages API"), and Google's own Interactions API, stable v1 (aistudio.google.com,
 * api-reference/interactions-api/create-interaction?api-version=v1, its "Simple Request" example and example response, and
 * the v1beta reference's ThoughtStep example; read 2026-11-11 by the lead engineer, Claudius iota-prime). The answers below
 * are the documented ones, cut to the fields a reader reads, Google's whole.
 *
 *   ca1  OpenAI: the request is the documented one, at the published address, the key as a bearer token; the documented
 *        answer reads as its text
 *   ca2  Azure OpenAI: the same request at the resource's address, the key in api-key; no address of its own, so none
 *        configured is a refusal; the documented answer reads
 *   ca3  Google's own Interactions API (v1): the documented request at the published address, the key in its own header,
 *        store false; the documented answer reads from its model_output step and not a thought's summary; status incomplete
 *        is cut, status failed is Google's own words; Google's OpenAI compatibility is still reached as "compatible"
 *   ca4  Anthropic: x-api-key, anthropic-version 2026-10-21, top-level system, max_tokens; the documented answer reads, and
 *        stop_reason max_tokens is a refusal, not a short answer
 *   ca5  WHAT LEAVES: given a configuration carrying a licence, a signing key, a team, a relay and a path beside its own
 *        fields, nothing of them is in the address, the headers or the body; the body's keys and the headers' names are
 *        exactly the protocol's. CONTROL: the same reading finds a planted extra header
 *   ca6  each answer the person must act on is its refusal: 401 and 403 the key, 429 busy, another status the service's own
 *        words, an answer that is not JSON or holds no text, an answer cut at its length
 *   ca7  what the real door throws comes back as its refusal through aiAsk: an answer past the cap, the network's own
 *        error; and the door's sentences that aiAsk reads are the door's own
 *   ca8  THE KEY: sealed, the file holds neither the key nor its base64; it opens for the address it was given for and for
 *        no other; a vault that cannot seal keeps nothing; a file not of its kind opens nothing
 *   ca9  GROUP POLICY, read leniently: reg query's text with the desk's values, a DWORD and lines it does not know beside
 *        the four of Studio's yields all four; one bad value is said and dropped alone; a service it does not know is said
 *   ca10 DEFAULT (1): the policy wins field by field and says so; a service the policy chose does not take the person's
 *        address; the policy's key wins; a key kept for another address is not used
 *   ca11 aiReady says what is missing, in order: a service, a known one, an address, a model
 *   ca12 every refusal frame has its Polish in ui/lang.js
 *   ca13 shell/main.js writes ai-service.json with no key in it, and the key only through keySealed
 *   ca14 the jobs, and what the lead is shown before a send (aiSends)
 *   ca15 the organisation's key goes only to the policy's address or, with none set, the service's published one: with the
 *        person's own address in force the shell's path refuses and no request carries it (red on 5168ab03..d4f27ad4)
 *   ca16 aiAsk refuses by itself where the configuration it is handed says keyAway, sending nothing; CONTROL: keyAway false
 *        sends (red on f9a147c7)
 *
 * Node only, no window, no network. Exit 0 when every check holds, 1 otherwise.
 */
import "./reg-stand-on.mjs";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import * as C from "../src/customer-ai.mjs";
import { importText, writeTextImport } from "../src/import-text.mjs";
import { loadPage } from "./page-stand-in.mjs";

const PLANTS_OFF = process.env.ETIUDA_PLANTS === "off";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
let failed = 0, asserted = 0;
function check(cond, line) {
  asserted++;
  if (cond) process.stdout.write("  ok   " + line + "\n");
  else { failed++; process.stderr.write("  FAIL " + line + "\n"); }
}
const json = (b) => JSON.parse(Buffer.from(b).toString("utf8"));
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const bytes = (o) => Buffer.from(JSON.stringify(o));

/* ---- ca1 to ca4, the recorded shapes ---------------------------------------------------------------------------- */
{
  const r = C.requestFor({ provider: "openai", endpoint: "", model: "gpt-6-astra", key: "K1" }, "You are a helpful assistant.", "Hello!");
  const doc = json(r.body);
  const answer = { id: "chatcmpl-1", object: "chat.completion", choices: [{ index: 0, message: { role: "assistant", content: "Hello! How can I assist you today?" }, finish_reason: "stop" }],
    usage: { prompt_tokens: 19, completion_tokens: 10, total_tokens: 29 } };
  const got = C.replyFrom("openai", 200, bytes(answer));
  check(r.endpoint + r.route === "https://api.openai.com/v1/chat/completions"
    && same(r.headers, { "content-type": "application/json", authorization: "Bearer K1" })
    && same(doc, { model: "gpt-6-astra", messages: [{ role: "system", content: "You are a helpful assistant." }, { role: "user", content: "Hello!" }] })
    && got.ok && got.text === "Hello! How can I assist you today?",
  "ca1 OpenAI: the documented request at " + r.endpoint + r.route + ", a bearer token, and the documented answer read as its text");
}
{
  const at = "https://example-resource.openai.azure.com/openai/v1/";
  const r = C.requestFor({ provider: "azure", endpoint: at, model: "gpt-4o-mini", key: "K2" }, "you are a helpful assistant that talks like a pirate", "can you tell me how to care for a parrot?");
  const answer = { id: "chatcmpl-7R1nGnsXO8n4oi9UPz2f3UHdgAYMn", created: 1686676106,
    choices: [{ index: 0, finish_reason: "stop", message: { role: "assistant", content: "Ahoy matey!" } }], usage: { completion_tokens: 3, prompt_tokens: 30, total_tokens: 33 } };
  const got = C.replyFrom("azure", 200, bytes(answer));
  const none = C.aiReady({ provider: "azure", endpoint: "", model: "gpt-4o-mini" });
  check(r.endpoint + r.route === at + "chat/completions" && same(r.headers, { "content-type": "application/json", "api-key": "K2" })
    && same(json(r.body).messages.map(m => m.role), ["system", "user"]) && got.ok && got.text === "Ahoy matey!"
    && !!none && none.said.frame === C.SAID.endpoint,
  "ca2 Azure OpenAI: the documented request at the resource's own /openai/v1/, the key in api-key, the documented answer read;"
    + " with no address configured it is refused: " + (none ? none.message : "not refused"));
}
{
  /* Google's own Interactions API, stable v1, as its create page documents it (read 2026-11-11): the "Simple Request"
     example's body and its example response, verbatim; the thought step is the reference's ThoughtStep example. */
  const r = C.requestFor({ provider: "google", endpoint: "", model: "gemini-3.8-flash", key: "K3" }, "Answer briefly.", "Hello, how are you?");
  const answer = { created: "2025-11-26T12:25:15Z", id: "v1_ChdPU0F4YWFtNkFwS2kxZThQZ05lbXdROBIXT1NBeGFhbTZBcEtpMWU4UGdOZW13UTg",
    model: "gemini-3.6-flash", object: "interaction", status: "completed",
    steps: [{ type: "model_output", content: [{ type: "text", text: "Hello! I'm functioning perfectly and ready to assist you.\n\nHow are you doing today?" }] }],
    updated: "2025-11-26T12:25:15Z", usage: { input_tokens_by_modality: [{ modality: "text", tokens: 7 }], total_cached_tokens: 0,
      total_input_tokens: 7, total_output_tokens: 20, total_thought_tokens: 22, total_tokens: 49, total_tool_use_tokens: 0 } };
  const got = C.replyFrom("google", 200, bytes(answer));
  const thought = { type: "thought", signature: "thought_sig_abcd1234", summary: [{ type: "text", text: "The model is searching Google for the capital of France." }] };
  const thinking = C.replyFrom("google", 200, bytes(Object.assign({}, answer, { steps: [thought].concat(answer.steps) })));
  const cut = C.replyFrom("google", 200, bytes(Object.assign({}, answer, { status: "incomplete" })));
  const failed = C.replyFrom("google", 200, bytes(Object.assign({}, answer, { status: "failed", steps: [],
    errors: [{ code: "https://example.test/errors/overloaded", message: "The model is overloaded\nnow" }] })));
  const pasted = C.endpointShape("https://generativelanguage.googleapis.com/v1/interactions", "google");
  /* Google's OpenAI compatibility stays reachable, as any service that speaks that protocol is: "compatible" with its address. */
  const compat = C.requestFor({ provider: "compatible", endpoint: "https://generativelanguage.googleapis.com/v1beta/openai/", model: "gemini-3.8-flash", key: "K3" }, "p", "t");
  check(r.endpoint + r.route === "https://generativelanguage.googleapis.com/v1/interactions"
    && same(r.headers, { "content-type": "application/json", "x-goog-api-key": "K3" })
    && same(json(r.body), { model: "gemini-3.8-flash", system_instruction: "Answer briefly.", input: "Hello, how are you?", store: false })
    && got.ok && got.text === answer.steps[0].content[0].text && thinking.ok && thinking.text === got.text
    && !cut.ok && cut.said.frame === C.SAID.cut && !failed.ok && failed.said.frame === C.SAID.failed
    && failed.said.vars.STATUS === "failed" && failed.said.vars.WHY === "The model is overloaded now"
    && pasted === "https://generativelanguage.googleapis.com/v1/"
    && compat.endpoint + compat.route === "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions" && compat.headers.authorization === "Bearer K3",
  "ca3 Google's own Interactions API: the documented request at " + r.endpoint + r.route + " with the key in x-goog-api-key, the"
    + " instruction as system_instruction and store false; the documented answer read from its model_output step, a thought"
    + " step's summary not read as the answer, status incomplete refused as cut (" + cut.refusal + "), status failed in Google's own"
    + " words (" + failed.refusal + "); the whole address pasted is taken to its base (" + pasted + "); and Google's OpenAI"
    + " compatibility still reached as another OpenAI-compatible service (" + compat.endpoint + compat.route + ")");
}
{
  const r = C.requestFor({ provider: "anthropic", endpoint: "", model: "claude-opus-5-5", key: "K4" }, "Be brief.", "Hello, Claude");
  const answer = { id: "msg_01XFDUDYJgAACzvnptvVoYEL", type: "message", role: "assistant", content: [{ type: "text", text: "Hello!" }],
    model: "claude-opus-5-5", stop_reason: "end_turn", stop_sequence: null, usage: { input_tokens: 12, output_tokens: 6 } };
  const got = C.replyFrom("anthropic", 200, bytes(answer));
  const cut = C.replyFrom("anthropic", 200, bytes(Object.assign({}, answer, { stop_reason: "max_tokens" })));
  check(r.endpoint + r.route === "https://api.anthropic.com/v1/messages"
    && same(r.headers, { "content-type": "application/json", "x-api-key": "K4", "anthropic-version": "2026-10-21" })
    && same(json(r.body), { model: "claude-opus-5-5", max_tokens: 8192, system: "Be brief.", messages: [{ role: "user", content: "Hello, Claude" }] })
    && got.ok && got.text === "Hello!" && !cut.ok && cut.said.frame === C.SAID.cut,
  "ca4 Anthropic: the documented request at " + r.endpoint + r.route + " with x-api-key and anthropic-version 2026-10-21, the"
    + " documented answer read, and an answer stopped at max_tokens refused: " + cut.refusal);
}

/* ---- ca5, what leaves ------------------------------------------------------------------------------------------- */
{
  const PLANTS = { licence: "LICENCE-PLANT-71", signingKey: "SIGNING-PLANT-72", team: "TEAM-PLANT-73", relay: "RELAY-PLANT-74",
    path: "C:\\Users\\someone\\PATH-PLANT-75", catalog: "CATALOG-PLANT-76" };
  const leaks = (req) => { const all = req.endpoint + req.route + JSON.stringify(req.headers) + req.body.toString("utf8");
    return Object.values(PLANTS).filter(v => all.indexOf(v) >= 0 || all.indexOf(JSON.stringify(v).slice(1, -1)) >= 0); };
  const rows = [];
  for (const id of Object.keys(C.PROVIDERS)) {
    const cfg = Object.assign({ provider: id, endpoint: "https://gateway.example.test/v1/", model: "m", key: "k" }, PLANTS);
    const req = C.requestFor(cfg, "the instruction", "the person's text");
    const doc = json(req.body);
    const keys = Object.keys(doc).sort().join(","), heads = Object.keys(req.headers).sort().join(",");
    const proto = C.PROVIDERS[id].protocol;
    const wantKeys = proto === "messages" ? "max_tokens,messages,model,system" : proto === "interactions" ? "input,model,store,system_instruction" : "messages,model";
    const wantHeads = ["content-type", C.PROVIDERS[id].auth].concat(proto === "messages" ? ["anthropic-version"] : []).sort().join(",");
    rows.push({ id, ok: leaks(req).length === 0 && keys === wantKeys && heads === wantHeads, keys, heads });
  }
  const planted = C.requestFor({ provider: "openai", endpoint: "", model: "m", key: "k" }, "i", "t");
  planted.headers["x-licence"] = PLANTS.licence;
  check(rows.every(r => r.ok) && leaks(planted).length === 1,
    "ca5 nothing of a licence, a signing key, a team, the relay, a path or a catalog in the configuration leaves with any"
    + " service's request, whose body and headers are exactly the protocol's: " + rows.map(r => r.id + (r.ok ? "" : " LEAKS") + " {" + r.keys + "} [" + r.heads + "]").join("; ")
    + "; CONTROL: a planted header is found (" + leaks(planted).length + ")");
}

/* ---- ca6, the answers a person acts on --------------------------------------------------------------------------- */
{
  const f = (status, body, provider = "openai") => C.replyFrom(provider, status, Buffer.from(body));
  const k401 = f(401, '{"error":{"message":"Incorrect key provided","type":"invalid_request_error"}}'), k403 = f(403, "{}");
  const busy = f(429, '{"error":{"message":"Rate limit reached"}}');
  const fivehundred = f(500, '{"type":"error","error":{"type":"api_error","message":"Overloaded\\u0000\\nnow"}}', "anthropic");
  const notJson = f(200, "<html>gateway</html>"), noText = f(200, '{"choices":[{"message":{"content":null},"finish_reason":"stop"}]}');
  const cut = f(200, '{"choices":[{"message":{"content":"{\\"cards\\":["},"finish_reason":"length"}]}');
  check(k401.said.frame === C.SAID.key && k401.said.vars.STATUS === "401" && k403.said.frame === C.SAID.key
    && busy.said.frame === C.SAID.busy && fivehundred.said.frame === C.SAID.failed && fivehundred.said.vars.STATUS === "500"
    && fivehundred.said.vars.WHY === "-" && fivehundred.refusal.indexOf("Overloaded") < 0
    && notJson.said.frame === C.SAID.empty && noText.said.frame === C.SAID.empty && cut.said.frame === C.SAID.cut
    && [k401, k403, busy, fivehundred, notJson, noText, cut].every(a => a.ok === false && typeof a.refusal === "string"),
  "ca6 401 and 403 are the key, 429 busy, 500 keeps only the status (" + fivehundred.refusal + "), an answer"
    + " not JSON or with no text empty, an answer cut at its length its own refusal");
}

/* ---- ca7, the real door's throws through aiAsk ------------------------------------------------------------------- */
{
  const Module = require("node:module"), load = Module._load;
  let mode = "big";
  const electron = { net: { fetch: async () => {
    if (mode === "down") throw new Error("net::ERR_NAME_NOT_RESOLVED");
    const chunk = new Uint8Array(1024 * 1024).fill(32);
    let sent = 0;
    return { status: 200, headers: { get: () => null }, body: new ReadableStream({ pull(c) { if (sent++ < 6) c.enqueue(chunk); else c.close(); } }) };
  } } };
  Module._load = function (request) { return request === "electron" ? electron : load.apply(this, arguments); };
  const wireAt = path.join(ROOT, "src", "wire.cjs");
  try {
    delete require.cache[require.resolve(wireAt)];
    const wire = require(wireAt);
    const ask = C.aiAsk({ provider: "compatible", endpoint: "https://gateway.example.test/v1/", model: "m", key: "k" }, wire.customerAiRequest, "import");
    const big = await ask({ prompt: "p", body: "t" });
    mode = "down";
    const down = await ask({ prompt: "p", body: "t" });
    let refusedSaid = null;
    try { await wire.customerAiRequest("http://gateway.example.test/v1/", "messages", {}, Buffer.from("{}")); }
    catch (e) { refusedSaid = e.message; }
    const text = fs.readFileSync(wireAt, "utf8");
    const sentences = [' did not answer within " + Math.round', ' answered more than " + cap', '"Studio sends to the AI service only'];
    check(big.ok === false && big.said.frame === C.SAID.big && down.said.frame === C.SAID.unreached
      && down.said.vars.WHY === "net::ERR_NAME_NOT_RESOLVED" && /sends to the AI service only/.test(String(refusedSaid))
      && sentences.every(s => text.indexOf(s) >= 0),
    "ca7 through the real door, an answer of 6 MiB is set aside (" + big.refusal + "), a network error is said in the network's own word ("
      + down.refusal + "), and the door's three sentences aiAsk reads are in src/wire.cjs");
  } finally {
    Module._load = load;
    try { delete require.cache[require.resolve(wireAt)]; } catch { /* gone */ }
  }
}

/* ---- ca8, the key ------------------------------------------------------------------------------------------------ */
{
  /* A stand-in for the operating system's seal: a reversible scramble, so a sealed key is not its own bytes. */
  const scramble = (b) => Buffer.from(b).map((x, i) => x ^ (0x5a + i % 7));
  const vault = { available: () => true, seal: (t) => scramble(Buffer.from(String(t), "utf8")), open: (b) => scramble(b).toString("utf8") };
  const KEY = "sk-test-" + "q".repeat(32), AT = "https://gateway.example.test/v1/", OTHER = "https://elsewhere.example.test/v1/";
  const doc = C.keySealed(vault, AT, KEY);
  const file = JSON.stringify(doc, null, 1);
  const none = C.keySealed({ available: () => false, seal: () => { throw new Error("no"); } }, AT, KEY);
  check(!!doc && doc.kind === C.KEY_KIND && file.indexOf(KEY) < 0 && file.indexOf(Buffer.from(KEY).toString("base64").slice(0, 20)) < 0
    && C.keyOpened(vault, JSON.parse(file), AT) === KEY && C.keyOpened(vault, JSON.parse(file), OTHER) === ""
    && none === null && C.keyOpened(vault, { kind: "other", sealed: doc.sealed }, AT) === ""
    && C.keyOpened(vault, { kind: C.KEY_KIND, sealed: "not-sealed" }, AT) === "",
  "ca8 the key file holds neither the key nor its base64, opens for its own address and for no other, a vault that cannot seal"
    + " keeps nothing, and a file not of its kind or not sealed opens nothing");
}

/* ---- ca9, the policy --------------------------------------------------------------------------------------------- */
{
  const H = "HKEY_LOCAL_MACHINE\\SOFTWARE\\Policies\\Etiuda";
  const all = ["", H, "    TeamFolder    REG_SZ    \\\\server\\share\\team", "    LeadKey    REG_SZ    " + "a".repeat(64),
    "    SomeFlag    REG_DWORD    0x1", "    AiProvider    REG_SZ    Anthropic", "    AiEndpoint    REG_SZ    https://Gateway.example.test/llm/v1/messages",
    "    AiModel    REG_SZ    claude-opus-5-5", "    AiKey    REG_SZ    secret-from-it", "", H + "\\Sub", "    AiModel    REG_SZ    not-this-one", "",
    "a line reg never writes"].join("\r\n");
  const p = C.aiPolicyFrom(all);
  const oneBad = C.aiPolicyFrom(all.replace("https://Gateway.example.test/llm/v1/messages", "http://gateway.example.test/v1/"));
  const dword = C.aiPolicyFrom(["", H, "    AiModel    REG_DWORD    0x1", "    AiProvider    REG_SZ    openai"].join("\r\n"));
  const unknown = C.aiPolicyFrom(["", H, "    AiProvider    REG_SZ    someone-else"].join("\r\n"));
  check(same(p.got, { provider: "anthropic", endpoint: "https://gateway.example.test/llm/v1/", model: "claude-opus-5-5", key: "secret-from-it" })
    && p.said.length === 0 && oneBad.got.endpoint === undefined && oneBad.got.model === "claude-opus-5-5" && oneBad.said.length === 1
    && oneBad.said[0].said.vars.NAME === "AiEndpoint" && dword.got.provider === "openai" && dword.got.model === undefined
    && dword.said[0].said.vars.NAME === "AiModel" && unknown.said[0].said.vars.NAME === "AiProvider" && same(C.aiPolicyFrom("").got, {}),
  "ca9 the four values read beside the desk's, a DWORD, a subkey and a line reg never writes, the address taken to its canonical"
    + " base (" + p.got.endpoint + "); a bad address, a DWORD model and an unknown service are each said and dropped alone");
}

/* ---- ca10, default (1) ------------------------------------------------------------------------------------------- */
{
  const person = { provider: "compatible", endpoint: "https://mine.example.test/v1/", model: "my-model" };
  const free = C.aiConfig(person, {});
  const org = C.aiConfig(person, { endpoint: "https://org.example.test/v1/" });
  const orgService = C.aiConfig(person, { provider: "anthropic" });
  const vault = { available: () => true, seal: (t) => Buffer.from(String(t)).reverse(), open: (b) => Buffer.from(b).reverse().toString() };
  const mine = C.keySealed(vault, person.endpoint, "my-key");
  check(free.endpoint === person.endpoint && !free.managed.endpoint && org.endpoint === "https://org.example.test/v1/" && org.managed.endpoint
    && !org.managed.model && org.model === "my-model" && orgService.provider === "anthropic" && orgService.endpoint === "https://api.anthropic.com/v1/"
    && orgService.managed.provider
    && C.keyFor({ endpoint: "https://org.example.test/v1/", key: "org-key" }, vault, mine, C.aiConfig(person, { endpoint: "https://org.example.test/v1/", key: "org-key" })) === "org-key"
    && C.keyFor({}, vault, mine, org) === "" && C.keyFor({}, vault, mine, free) === "my-key",
  "ca10 the policy wins field by field and says so; a service the policy chose does not take the person's address; the policy's"
    + " key wins; the person's key kept for their address is not sent to the policy's");
}

/* ---- ca15, the managed key goes only to a managed address (the test architect's finding on the 992 core) ------------
   His words: "an organisation that pushes AiProvider and AiKey without an address sends its key to whatever address the
   person once typed." The shell's path is driven as aiAskNow drives it (aiConfig, keyFor, aiReady, then aiAsk), with a door
   that records every request, and no request may carry the organisation's key to the person's own address. */
{
  const vault = { available: () => true, seal: (t) => Buffer.from(String(t)).reverse(), open: (b) => Buffer.from(b).reverse().toString() };
  const ORG_KEY = "org-managed-key-0123456789";
  const seen = [];
  const door = async (endpoint, route, headers, body) => { seen.push(endpoint + route + " " + JSON.stringify(headers) + " " + body.toString("utf8"));
    return { status: 200, bytes: Buffer.from('{"choices":[{"message":{"content":"ok"},"finish_reason":"stop"}]}') }; };
  const askAsTheShellDoes = async (person, policy) => {
    const cfg = C.aiConfig(person, policy);
    const key = C.keyFor(policy, vault, null, cfg);
    const no = C.aiReady(cfg);
    if (no) return { sent: false, said: no.said.frame };
    const a = await C.aiAsk({ provider: cfg.provider, endpoint: cfg.endpoint, model: cfg.model, key }, door, "test")({ prompt: "p", body: "b" });
    return { sent: true, ok: a.ok };
  };
  const away = await askAsTheShellDoes({ provider: "openai", endpoint: "https://mine.example.test/v1/", model: "m" }, { provider: "openai", key: ORG_KEY });
  const awayHits = seen.filter(s => s.indexOf(ORG_KEY) >= 0).length;
  seen.length = 0;
  const published = await askAsTheShellDoes({ provider: "openai", endpoint: "", model: "m" }, { provider: "openai", key: ORG_KEY });
  const publishedTo = seen.slice();
  seen.length = 0;
  const managed = await askAsTheShellDoes({ provider: "compatible", endpoint: "https://mine.example.test/v1/", model: "m" },
    { provider: "compatible", endpoint: "https://org.example.test/v1/", key: ORG_KEY });
  const managedTo = seen.slice();
  check(awayHits === 0 && away.sent === false && away.said === C.SAID.keyAway
    && publishedTo.length === 1 && publishedTo[0].indexOf("https://api.openai.com/v1/chat/completions") === 0 && publishedTo[0].indexOf(ORG_KEY) > 0
    && managedTo.length === 1 && managedTo[0].indexOf("https://org.example.test/v1/chat/completions") === 0 && managedTo[0].indexOf(ORG_KEY) > 0,
  "ca15 a key the organisation set goes only to the address it set, or with none set to the service's published one: with the"
    + " person's own address in force no request carries it (" + awayHits + " request(s) did; " + (away.sent ? "sent" : "refused: " + away.said)
    + "), and it does go to the published address (" + publishedTo.length + ") and to the policy's own (" + managedTo.length + ")");
}

/* ---- ca16, the ask refuses by itself (the test architect's note on fold 7) ---------------------------------------------
   His words: "`aiAsk`'s own `cfg` copies provider, endpoint, model and key and not `keyAway`, so the refusal lives in the
   shell's `aiAskNow` alone." Here aiAsk is handed the organisation's key with keyAway set, as no caller should, and must send
   nothing; the CONTROL is the same configuration with keyAway false, which does send, so the leg reads the refusal and not a
   door that never answers. */
{
  const ORG_KEY = "org-managed-key-9876543210";
  const seen = [];
  const door = async (endpoint, route, headers, body) => { seen.push(endpoint + route + " " + JSON.stringify(headers) + " " + body.toString("utf8"));
    return { status: 200, bytes: Buffer.from('{"choices":[{"message":{"content":"ok"},"finish_reason":"stop"}]}') }; };
  const cfg = { provider: "openai", endpoint: "https://mine.example.test/v1/", model: "m", key: ORG_KEY };
  const away = await C.aiAsk(Object.assign({}, cfg, { keyAway: true }), door, "test")({ prompt: "p", body: "b" });
  const awayHits = seen.length;
  seen.length = 0;
  const home = await C.aiAsk(Object.assign({}, cfg, { keyAway: false }), door, "test")({ prompt: "p", body: "b" });
  check(awayHits === 0 && away.ok === false && away.said && away.said.frame === C.SAID.keyAway && home.ok === true && seen.length === 1,
    "ca16 aiAsk handed the organisation's key with keyAway set refuses by itself and sends nothing (" + awayHits + " request(s), "
    + (away.ok ? "answered" : "refused: " + (away.said ? away.said.frame.slice(0, 60) : "?")) + "); CONTROL: with keyAway false it sends ("
    + seen.length + ")");
}

/* ---- ca11, what is missing ------------------------------------------------------------------------------------- */
{
  const frames = [C.aiReady({}), C.aiReady({ provider: "nobody" }), C.aiReady({ provider: "compatible" }),
    C.aiReady({ provider: "compatible", endpoint: "https://x.example.test/v1/" }), C.aiReady({ provider: "openai", model: "m" })];
  check(same(frames.map(f => f && f.said.frame), [C.SAID.none, C.SAID.provider, C.SAID.endpoint, C.SAID.model, null]),
    "ca11 aiReady says a service, a known one, an address and a model are missing, in that order, and nothing for a whole configuration");
}

/* ---- ca12, the Polish -------------------------------------------------------------------------------------------- */
{
  const lang = fs.readFileSync(path.join(ROOT, "ui", "lang.js"), "utf8");
  const missing = Object.keys(C.SAID).filter(k => lang.indexOf(JSON.stringify(C.SAID[k]) + ":") < 0);
  check(missing.length === 0, "ca12 every one of the " + Object.keys(C.SAID).length + " refusal frames has its Polish in ui/lang.js"
    + (missing.length ? "; MISSING " + missing.join(", ") : ""));
}

/* ---- ca13, what the shell writes --------------------------------------------------------------------------------- */
{
  const main = fs.readFileSync(path.join(ROOT, "shell", "main.js"), "utf8");
  const settings = main.match(/writeWhole\(aiServiceAt\(\), JSON\.stringify\(\{([^}]*)\}/);
  const fields = settings ? settings[1].split(",").map(s => s.split(":")[0].trim()).sort().join(",") : "";
  const keyWrites = (main.match(/aiKeyWrite\(([^)]*)\)/g) || []).filter(s => !/aiKeyWrite\(doc\)/.test(s));
  check(fields === "endpoint,format,kind,model,provider"
    && keyWrites.length > 0 && keyWrites.every(s => /aiKeyWrite\((?:null|sealed|C\.keySealed\()/.test(s)),
    "ca13 shell/main.js writes ai-service.json with {" + fields + "} and no key, and writes the key file only with keySealed's"
    + " object or nothing: " + keyWrites.join(" "));
}

/* ---- ca13b, a key never follows a changed address (Claude α, 22:33, on Argon's finding 1 of the 992 review) ---------- */
{
  const main = fs.readFileSync(path.join(ROOT, "shell", "main.js"), "utf8");
  const at = main.indexOf('answer("studio:ai-save"'), end = main.indexOf('answer("studio:ai-test"', at);
  const save = at >= 0 && end > at ? main.slice(at, end) : "";
  check(!!save && !/keyOpened\(/.test(save) && /else if \(next\.endpoint !== cfg\.endpoint\) aiKeyWrite\(null\);/.test(save),
    "ca13b saving another address without a new key drops the kept key, and the save never opens a kept key to seal it again"
    + " for the new address");
}

/* ---- ca14, the jobs and what the lead is shown first ------------------------------------------------------------- */
{
  const cfg = C.aiConfig({ provider: "compatible", endpoint: "https://gateway.example.test/llm/v1", model: "m" }, {});
  const shown = C.aiSends(cfg, "language", ["Card text in English.", "A voice card.", "Another voice card."]);
  const orgShown = C.aiSends(C.aiConfig({}, { provider: "openai", endpoint: "https://org.example.test/v1/", model: "m" }), "situation", ["What happened."]);
  const none = C.aiSends(C.aiConfig({}, {}), "import", ["text"]);
  let refusedJob = "";
  try { C.aiAsk(cfg, async () => { throw new Error("must not be reached"); }, "chat"); } catch (e) { refusedJob = e.message; }
  check(same(C.JOBS, ["import", "language", "situation", "test"]) && shown.address === "https://gateway.example.test/llm/v1/"
    && shown.host === "gateway.example.test" && shown.pieces === 3 && shown.chars === 21 + 13 + 19 && shown.refusal === null && !shown.managed
    && orgShown.managed && orgShown.host === "org.example.test" && none.refusal && none.refusal.said.frame === C.SAID.none && none.address === ""
    && /wants the job it asks for/.test(refusedJob),
  "ca14 the first version's three jobs and the test are the jobs; before a send the lead can be shown the address, its host,"
    + " whether the organisation set it, how many texts and how many characters (" + shown.host + ", " + shown.pieces + ", "
    + shown.chars + "); with nothing configured nothing can be sent; an ask for a job not named is refused as it is made");
}

/* ---- ca17, a policy address Studio rejects blocks the send (review 18, finding 1) -------------------------------- */
{
  const H = "HKEY_LOCAL_MACHINE\\SOFTWARE\\Policies\\Etiuda";
  const ORG_KEY = "org-policy-key-0001";
  const vault = { available: () => true, seal: (t) => Buffer.from(String(t)).reverse(), open: (b) => Buffer.from(b).reverse().toString() };
  const probeRejected = async (Mod) => {
    const seen = [];
    const door = async (endpoint, route, headers, body) => {
      seen.push({ url: endpoint + route, headers, body: body.toString("utf8") });
      return { status: 200, bytes: Buffer.from('{"choices":[{"message":{"content":"ok"},"finish_reason":"stop"}]}') };
    };
    const cases = [
      { name: "query", url: "https://gw.corp.example/openai/v1/?api-version=2024-10-21", person: { provider: "openai", endpoint: "", model: "" } },
      { name: "http", url: "http://gw.corp.example/v1/", person: { provider: "openai", endpoint: "", model: "" } },
      { name: "other-provider", url: "http://gw.corp.example/v1/", person: { provider: "anthropic", endpoint: "https://mine.example.test/v1/", model: "claude" } },
    ];
    const results = [];
    for (const c of cases) {
      const text = [H, "    AiProvider    REG_SZ    openai", "    AiEndpoint    REG_SZ    " + c.url, "    AiModel    REG_SZ    m", "    AiKey    REG_SZ    " + ORG_KEY].join("\r\n");
      const p = Mod.aiPolicyFrom(text);
      const cfg = Mod.aiConfig(c.person, p.got);
      const key = Mod.keyFor(p.got, vault, null, cfg);
      const no = Mod.aiReady(cfg);
      const n0 = seen.length;
      if (!no) await Mod.aiAsk({ provider: cfg.provider, endpoint: cfg.endpoint, model: cfg.model, key, keyAway: cfg.keyAway }, door, "test")({ prompt: "p", body: "b" });
      const direct = await Mod.aiAsk(Object.assign({}, cfg, { key }), door, "test")({ prompt: "p", body: "b" });
      const hits = seen.slice(n0);
      results.push({
        name: c.name,
        ok: hits.length === 0 && key === "" && cfg.managed.endpoint === true && !!no && no.said.frame === Mod.SAID.endpoint
          && no.said.vars.URL === c.url && direct.ok === false && direct.said && direct.said.frame === Mod.SAID.endpoint,
        hits,
        frame: no ? no.said.frame : "ready",
        keyGiven: !!key,
        managedEndpoint: cfg.managed.endpoint,
      });
    }
    return results;
  };
  const r17 = await probeRejected(C);
  check(r17.every((r) => r.ok),
    "ca17 a policy address Studio rejects (query, http, or with a different person provider) blocks the send with no request and no key given: "
    + r17.map((r) => r.name + "=" + (r.ok ? "refused" : "SENT(" + r.hits.map((h) => h.url).join(",") + ",frame=" + r.frame + ",key=" + r.keyGiven + ",managed=" + r.managedEndpoint + ")")).join("; "));
  if (PLANTS_OFF) process.stdout.write("  NOT RUN ca17p plant:ai-policy-endpoint proof (ETIUDA_PLANTS=off)\n");
  else {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "etiuda-ca17p-"));
    try {
      const src = fs.readFileSync(path.join(ROOT, "src", "customer-ai.mjs"), "utf8");
      const planted = src
        .replace('from "./refusal.mjs"', 'from ' + JSON.stringify(pathToFileURL(path.join(ROOT, "src", "refusal.mjs")).href))
        .replace("got.endpointRefused = got.endpoint; delete got.endpoint;", "delete got.endpoint;");
      const at = path.join(dir, "customer-ai.mjs");
      fs.writeFileSync(at, planted, "utf8");
      const P = await import(pathToFileURL(at).href + "?p=" + Date.now());
      const pr = await probeRejected(P);
      check(planted !== src && pr.every((r) => !r.ok && r.hits.some((h) => h.url === "https://api.openai.com/v1/chat/completions" && h.headers.authorization === "Bearer " + ORG_KEY)),
        "ca17p plant: dropping endpointRefused in aiPolicyFrom turns ca17 red with the policy key sent to OpenAI's published address");
    } finally { fs.rmSync(dir, { recursive: true, force: true }); }
  }
}

/* ---- ca18, a service error message never reaches the page or a file (review 18, finding 2) -------------------- */
{
  const SECRET = "sk-test-0000";
  const ERR_MSG = "Incorrect API key provided: " + SECRET;
  const ERR_BODY = Buffer.from(JSON.stringify({ error: { message: ERR_MSG } }), "utf8");
  const probeErrMsg = async (Mod) => {
    const r400 = Mod.replyFrom("openai", 400, ERR_BODY);
    const r500 = Mod.replyFrom("anthropic", 500, ERR_BODY);
    const p1 = "First reply: we will replace the damaged item.";
    const p2 = "Second reply: your parcel is on its way to you.";
    const src = p1 + "\n\n" + p2;
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "etiuda-ca18-"));
    try {
      let call = 0;
      const door = async () => {
        call++;
        if (call <= 2) return { status: 400, bytes: ERR_BODY };
        const cardJson = JSON.stringify({
          cards: [{
            title: { en: "Parcel on its way" }, category: "shipping", categoryLabel: { en: "Shipping" }, intents: [],
            bodies: [{ lang: "en", spans: [{ text: p2 }] }],
          }],
        });
        return { status: 200, bytes: Buffer.from(JSON.stringify({ choices: [{ index: 0, message: { role: "assistant", content: cardJson }, finish_reason: "stop" }] })) };
      };
      const ask = Mod.aiAsk({ provider: "openai", endpoint: "", model: "m", key: "k" }, door, "import");
      const out = await importText({ text: src, ask, chunkChars: 48, placeholders: false, join: false, id: "t-18", name: "t-18" });
      const inbox = path.join(tmp, "inbox");
      const wrote = writeTextImport(inbox, "model-import.ec", out.catalog, out.report);
      const lintJson = fs.readFileSync(wrote.lintAt, "utf8");
      const clean = (s) => String(s).indexOf(SECRET) < 0 && String(s).indexOf("Incorrect API key") < 0;
      return {
        ok: !r400.ok && r400.said.frame === Mod.SAID.failed && r400.said.vars.STATUS === "400" && r400.said.vars.WHY === "-"
          && clean(r400.refusal) && clean(JSON.stringify(r400.said))
          && !r500.ok && r500.said.vars.STATUS === "500" && r500.said.vars.WHY === "-" && clean(r500.refusal)
          && !!out.catalog && clean(lintJson),
        r400: r400.refusal,
        hasSecretInLint: lintJson.indexOf(SECRET) >= 0,
      };
    } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
  };
  const r18 = await probeErrMsg(C);
  check(r18.ok,
    "ca18 non-2xx service error messages never leave replyFrom or reach inbox/<name>.lint.json (400=" + r18.r400 + ", lintSecret=" + r18.hasSecretInLint + ")");
  if (PLANTS_OFF) process.stdout.write("  NOT RUN ca18p plant:ai-error-words proof (ETIUDA_PLANTS=off)\n");
  else {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "etiuda-ca18p-"));
    try {
      const src = fs.readFileSync(path.join(ROOT, "src", "customer-ai.mjs"), "utf8");
      const planted = src
        .replace('from "./refusal.mjs"', 'from ' + JSON.stringify(pathToFileURL(path.join(ROOT, "src", "refusal.mjs")).href))
        .replace('WHY: "-"', 'WHY: theirWords((() => { try { return JSON.parse(Buffer.from(bytes || []).toString("utf8")); } catch { return null; } })()) || "-"');
      const at = path.join(dir, "customer-ai.mjs");
      fs.writeFileSync(at, planted, "utf8");
      const P = await import(pathToFileURL(at).href + "?p=" + Date.now());
      const pr = await probeErrMsg(P);
      check(planted !== src && !pr.ok && pr.hasSecretInLint && pr.r400.indexOf(SECRET) >= 0,
        "ca18p plant: copying theirWords on non-2xx turns ca18 red with the secret in both replyFrom and .lint.json");
    } finally { fs.rmSync(dir, { recursive: true, force: true }); }
  }
}

/* ---- ca19, a policy key with no provider and no address sends nothing (review 18, 2026-11-15) --------------------- */
{
  const H = "HKEY_LOCAL_MACHINE\\SOFTWARE\\Policies\\Etiuda";
  const ORG_KEY = "sk-test-0000";
  const USER_KEY = "user-own-key-0001";
  const vault = { available: () => true, seal: (t) => Buffer.from(String(t)).reverse(), open: (b) => Buffer.from(b).reverse().toString() };
  const ROW_EN = "Your organisation has set a key for an AI service without naming the service, so nothing is sent. Its IT department can name it.";
  const ROW_PL = "Organizacja ustawiła klucz do usługi AI, ale nie wskazała tej usługi, więc nic nie jest wysyłane. Może ją wskazać dział IT organizacji.";
  const REFUSAL_EN = "Not sent: the organisation set a key without naming its service.";
  const REFUSAL_PL = "Nie wysłano: organizacja ustawiła klucz bez wskazania usługi.";
  const probeKeyNoService = async (Mod) => {
    const seen = [];
    const door = async (endpoint, route, headers, body) => {
      seen.push({ url: endpoint + route, headers, body: body.toString("utf8") });
      const isAnthropic = route === "messages", isGoogle = route === "interactions";
      const bytes = isAnthropic ? Buffer.from('{"content":[{"type":"text","text":"ok"}],"stop_reason":"end_turn"}')
        : isGoogle ? Buffer.from('{"status":"completed","steps":[{"type":"model_output","content":[{"type":"text","text":"ok"}]}]}')
        : Buffer.from('{"choices":[{"message":{"content":"ok"},"finish_reason":"stop"}]}');
      return { status: 200, bytes };
    };
    const policy = Mod.aiPolicyFrom([H, "    AiKey    REG_SZ    " + ORG_KEY].join("\r\n")).got;
    const rows = [];
    for (const id of [""].concat(Object.keys(Mod.PROVIDERS))) {
      const person = { provider: id, endpoint: "", model: id ? "m" : "" };
      const cfg = Mod.aiConfig(person, policy);
      const key = Mod.keyFor(policy, vault, null, cfg);
      const no = Mod.aiReady(cfg);
      const sends = Mod.aiSends(cfg, "language", ["Card text."]);
      const n0 = seen.length;
      if (!no) await Mod.aiAsk({ provider: cfg.provider, endpoint: cfg.endpoint, model: cfg.model, key, keyAway: cfg.keyAway }, door, "test")({ prompt: Mod.TEST_PROMPT, body: Mod.TEST_TEXT });
      const directTest = await Mod.aiAsk(Object.assign({}, cfg, { key }), door, "test")({ prompt: Mod.TEST_PROMPT, body: Mod.TEST_TEXT });
      const directJob = await Mod.aiAsk(Object.assign({}, cfg, { key }), door, "language")({ prompt: "p", body: "b" });
      const hits = seen.slice(n0);
      rows.push({
        id: id || "none",
        ok: hits.length === 0 && key === "" && !!Mod.SAID.keyNoService && !!no && no.said.frame === Mod.SAID.keyNoService
          && no.message === REFUSAL_EN && !!sends.refusal && sends.refusal.said.frame === Mod.SAID.keyNoService
          && directTest.ok === false && directTest.said && directTest.said.frame === Mod.SAID.keyNoService
          && directJob.ok === false && directJob.said && directJob.said.frame === Mod.SAID.keyNoService,
        hits,
        frame: no ? no.said.frame : "ready",
      });
    }
    const ctrlPolicy = { key: ORG_KEY, provider: "anthropic" };
    const ctrlCfg = Mod.aiConfig({ provider: "openai", endpoint: "", model: "m" }, ctrlPolicy);
    const ctrlKey = Mod.keyFor(ctrlPolicy, vault, null, ctrlCfg);
    const nCtrl = seen.length;
    const ctrlAns = await Mod.aiAsk(Object.assign({}, ctrlCfg, { key: ctrlKey }), door, "test")({ prompt: Mod.TEST_PROMPT, body: Mod.TEST_TEXT });
    const ctrlHits = seen.slice(nCtrl);
    const freeCfg = Mod.aiConfig({ provider: "openai", endpoint: "", model: "m" }, {});
    const freeSealed = Mod.keySealed(vault, freeCfg.endpoint, USER_KEY);
    const freeKey = Mod.keyFor({}, vault, freeSealed, freeCfg);
    const nFree = seen.length;
    const freeAns = await Mod.aiAsk(Object.assign({}, freeCfg, { key: freeKey }), door, "test")({ prompt: Mod.TEST_PROMPT, body: Mod.TEST_TEXT });
    const freeHits = seen.slice(nFree);
    return {
      rows,
      ctrlOk: ctrlAns.ok === true && ctrlHits.length === 1 && ctrlHits[0].url === "https://api.anthropic.com/v1/messages"
        && ctrlHits[0].headers["x-api-key"] === ORG_KEY,
      freeOk: freeAns.ok === true && freeHits.length === 1 && freeHits[0].url === "https://api.openai.com/v1/chat/completions"
        && freeHits[0].headers.authorization === "Bearer " + USER_KEY,
    };
  };
  const r19 = await probeKeyNoService(C);
  const pageHtml = (uiLang, ai) => {
    const P = loadPage({ api: { aiSettings: async () => ai }, uiLang });
    P.page.__get("S").ai = ai;
    return { html: P.page.__get("sxAiRows")().join(""), saidText: P.page.__get("saidText") };
  };
  const providers = Object.keys(C.PROVIDERS).map((id) => ({ id, endpoint: C.PROVIDERS[id].endpoint }));
  const baseAi = { endpoint: "", model: "m", hasKey: false, managed: { provider: false, endpoint: false, model: false, key: true }, sealable: true, ready: false, said: [], providers };
  const enNone = pageHtml("en", Object.assign({}, baseAi, { provider: "", address: "", model: "" }));
  const plNone = pageHtml("pl", Object.assign({}, baseAi, { provider: "", address: "", model: "" }));
  const enPicked = pageHtml("en", Object.assign({}, baseAi, { provider: "anthropic", address: "https://api.anthropic.com/v1/" }));
  const plPicked = pageHtml("pl", Object.assign({}, baseAi, { provider: "anthropic", address: "https://api.anthropic.com/v1/" }));
  const enFreeNone = pageHtml("en", Object.assign({}, baseAi, { provider: "", address: "", model: "", managed: { provider: false, endpoint: false, model: false, key: false } }));
  const pageOk = enNone.html.indexOf(ROW_EN) >= 0 && plNone.html.indexOf(ROW_PL) >= 0
    && enPicked.html.indexOf(ROW_EN) >= 0 && enPicked.html.indexOf("What a job sends goes to") < 0
    && plPicked.html.indexOf(ROW_PL) >= 0 && plPicked.html.indexOf("To, co wysyła zadanie, trafia do") < 0
    && enFreeNone.html.indexOf(ROW_EN) < 0
    && enNone.saidText({ frame: C.SAID.keyNoService || "", vars: {} }) === REFUSAL_EN
    && plNone.saidText({ frame: C.SAID.keyNoService || "", vars: {} }) === REFUSAL_PL;
  check(r19.rows.every((r) => r.ok) && r19.ctrlOk && r19.freeOk && pageOk,
    "ca19 policy { key } with no provider or address sends nothing for any provider ("
    + r19.rows.map((r) => r.id + "=" + (r.ok ? "refused" : "SENT(" + r.hits.map((h) => h.url).join(",") + ",frame=" + r.frame + ")")).join("; ")
    + "); pageOk=" + pageOk + "; CONTROL: policy { key, provider } and no policy still send (" + r19.ctrlOk + ", " + r19.freeOk + ")");
  if (PLANTS_OFF) process.stdout.write("  NOT RUN ca19p plant:ai-key-no-service proof (ETIUDA_PLANTS=off)\n");
  else {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "etiuda-ca19p-"));
    try {
      const src = fs.readFileSync(path.join(ROOT, "src", "customer-ai.mjs"), "utf8");
      const planted = src
        .replace('from "./refusal.mjs"', 'from ' + JSON.stringify(pathToFileURL(path.join(ROOT, "src", "refusal.mjs")).href))
        .replace(
          "const keyNoService = !!org.key && !provider.managed && !endpoint.managed; /* plant:ai-key-no-service */\n  const keyHome = endpoint.managed ? at !== \"\" : (provider.managed && at !== \"\" && at === published);",
          "const keyNoService = false;\n  const keyHome = endpoint.managed ? at !== \"\" : (at !== \"\" && at === published);"
        );
      const at = path.join(dir, "customer-ai.mjs");
      fs.writeFileSync(at, planted, "utf8");
      const P = await import(pathToFileURL(at).href + "?p=" + Date.now());
      const pr = await probeKeyNoService(P);
      const sentPublished = ["openai", "anthropic", "google"].every((id) => {
        const row = pr.rows.find((x) => x.id === id);
        return row && !row.ok && row.hits.some((h) => h.url.indexOf(P.PROVIDERS[id].endpoint) === 0
          && h.headers[P.PROVIDERS[id].auth] === (P.PROVIDERS[id].auth === "authorization" ? "Bearer " + ORG_KEY : ORG_KEY));
      });
      check(planted !== src && sentPublished,
        "ca19p plant: restoring the old fall-through in aiConfig turns ca19 red with the policy key sent to each published address");
    } finally { fs.rmSync(dir, { recursive: true, force: true }); }
  }
}

process.stdout.write("customer-ai: " + asserted + " assertion(s), " + failed + " failure(s)\n");
process.exit(failed ? 1 : 0);
