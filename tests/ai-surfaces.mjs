/* THE CUSTOMER'S OWN AI SERVICE, ITS SURFACES (board 992, stages 3 and 4).
 *
 *     node tests/ai-surfaces.mjs
 *
 * tests/customer-ai.mjs holds what a request is and where it goes; tests/no-model.mjs 14 holds that only the lead's acts ask.
 * This file holds what the lead sees and presses: Settings' AI service card (stage 3) on the page as tests/page-stand-in.mjs
 * runs it, with the shell's answers stood in. The words are the copywriter's (office brief words-992-own-ai-2026-11-11, the
 * oracle, row for row below), so a row here that moves is a change to her words and is hers first.
 *
 *   as1  with no service set, the AI service section is listed and says nothing is sent anywhere; it offers None and the
 *        five services by the shell's own list, and draws no address, model or key field
 *   as2  with a service set: the address's hint names the service's own address as the shell gave it, the key is a
 *        password field drawn empty, with the kept-key line where one is kept, and the line under the fields names the
 *        host the jobs send to, in monospace
 *   as3  a field the organisation set is drawn disabled with "Set by the organisation", and the line says who can change it
 *   as4  a key typed is sent once to studio:ai-save and the field emptied; an address typed is sent with the key "", the
 *        other fields as they stand; a service chosen is sent with no address carried over from another
 *   as5  the connection test says Testing…, then the host and model that answered, or the refusal's own sentence
 *   as6  every Stage 3 row is the copywriter's, the English a literal of ui/app.js and the Polish hers
 *
 * STAGE 4, the drafting jobs: the shell's AI section run as it stands (shellSection, below) over a scratch catalog, the
 * door recording every request; and the page's side on the stand-in.
 *   as7  the line before a send names the host, the model and the counts of what would go, and sends and writes nothing
 *   as8  Send asks once, at the configured address, with exactly the texts the line counted; the answer waits as a draft
 *        beside the catalog and the card is untouched
 *   as9  each failure (the key refused, not reached, too late, busy, an error, an answer that is not a card) keeps nothing,
 *        leaves the card as it was and says which of the failure lines it is
 *   as10 nothing is sent for a card already written in that language, for a job this place does not open, or with no
 *        service set, where the line says what is missing
 *   as11 Accept writes the lead's edit into the card and records, for the audit pack, the model, the service, edited or
 *        not, who and when; the draft is gone
 *   as12 a situation sends the description, the category's cards and the names of categories and intents, and nothing of
 *        another category; its draft takes a category and intents only by the catalog's own names
 *   as13 Accept of a situation's draft makes the card, both languages, its category and intent, recorded unedited
 *   as14 Discard takes the draft away and leaves the card as it was
 *   as15 the other language's button stands in an empty body only, and only while a service is set
 *   as16 the press shows the line and sends nothing; Cancel brings the button back; a failure stands in the button's place
 *        with its one action, or who can change it where the organisation set the service
 *   as17 a draft fills the empty language marked, with Accept and Discard, in fields that are not the card's; the queue
 *        lists it tagged model, its kind, no source
 *   as18 the New card cover's situation box, its button hidden while empty, nothing with no service set; a situation's
 *        draft fills the cover marked
 *   as19 every Stage 4 row the page says is the copywriter's
 *   as20 Publishing says the drafts waiting as information, and every gate stands as it did without them
 *
 * Node only, no window, no network, nothing starts Studio. Exit 0 when every check holds, 1 otherwise.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import vm from "node:vm";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import { loadPage } from "./page-stand-in.mjs";
import { dropScratch } from "./scratch.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
let failed = 0, asserted = 0;
function check(cond, line) {
  asserted++;
  if (cond) process.stdout.write("  ok   " + line + "\n");
  else { failed++; process.stderr.write("  FAIL " + line + "\n"); }
}
/* Each check's code runs in a block of its own, so one that throws on an older tree (a channel or a function not there yet)
   is that one check red and the rest still read. */
let blocks = 0;
async function block(fn) {
  blocks++;
  try { await fn(); } catch (e) { check(false, "block " + blocks + " threw before its check: " + String(e && e.message || e).slice(0, 200)); }
}
const textOf = (html) => String(html || "").replace(/<[^>]*>/g, " ").replace(/&#39;/g, "'").replace(/&quot;/g, '"')
  .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();
const tick = () => new Promise((r) => setTimeout(r, 0));

/* The shell's list of services as studio:ai-settings answers it (src/customer-ai.mjs PROVIDERS, read through the answer). */
const PROVIDERS = [{ id: "openai", endpoint: "https://published.example.test/v1/" }, { id: "anthropic", endpoint: "https://other.example.test/v1/" },
  { id: "google", endpoint: "https://third.example.test/v1/" }, { id: "azure", endpoint: "" }, { id: "compatible", endpoint: "" }];
const NONE_SET = { error: null, provider: "", endpoint: "", address: "", model: "", hasKey: false,
  managed: { provider: false, endpoint: false, model: false, key: false }, sealable: true, ready: false, said: [], providers: PROVIDERS };
const SET = Object.assign({}, NONE_SET, { provider: "openai", address: "https://published.example.test/v1/", model: "m-1", hasKey: true, ready: true });

function settingsPage(answer, api, lang) {
  const saved = [], tests = [];
  const stand = Object.assign({
    aiSettings: async () => answer,
    aiSave: async (...a) => { saved.push(a); return Object.assign({}, answer, { provider: a[0], endpoint: a[1], model: a[2] }); },
    aiTest: async () => { tests.push(1); return { error: null, ok: true, ms: 12 }; },
  }, api || {});
  const P = loadPage({ api: stand, uiLang: lang || "en" });
  const S = P.page.__get("S");
  S.ai = answer; S.screen = "projects";
  const html = () => P.page.__get("sxAiRows")().join("");
  return { P, S, html, saved, tests, rows: () => P.page.__get("sxAiRows")() };
}
const changeOf = (P) => P.doc.heard.filter((h) => h.type === "change").map((h) => h.fn);
const input = (attr, value) => ({ value, getAttribute: (k) => (k === "data-ai-f" ? attr : null), closest: () => null });

/* ---- as1 to as3, the card ----------------------------------------------------------------------------------------- */
await block(async () => {
  const { P, html } = settingsPage(NONE_SET);
  const h = html(), t = textOf(h);
  const sections = P.page.__get("SX_SECTIONS").filter((x) => x.rows().length > 0).map((x) => x.id);
  const options = Array.from(h.matchAll(/<option value="([^"]*)"/g), (m) => m[1]);
  check(sections.indexOf("ai") >= 0 && /No service is set, so Studio sends nothing anywhere\./.test(t)
    && options.join(",") === ",openai,anthropic,google,azure,compatible" && /<option value="" selected>None</.test(h)
    && !/data-ai-f=/.test(h),
  "as1 no service set: the section is listed (" + sections.join(", ") + "), says nothing is sent anywhere, offers None and "
    + options.filter(Boolean).length + " services, and draws no field");
});
await block(async () => {
  const { html } = settingsPage(SET);
  const h = html(), t = textOf(h);
  const key = (h.match(/<input[^>]*data-ai-f="key"[^>]*>/) || [""])[0];
  check(/Left empty, the service's own address is used: https:\/\/published\.example\.test\/v1\//.test(t)
    && /type="password"/.test(key) && /value=""/.test(key) && /A key is kept\. Typing a new one replaces it\./.test(key)
    && /What a job sends goes to <span class="mono">published\.example\.test<\/span> and nowhere else\./.test(h)
    && !/Set by the organisation/.test(t),
  "as2 a service set: the address's hint names the shell's address, the key is a password field drawn empty with the kept"
    + " line, and the jobs' host is named in monospace");
  const az = textOf(settingsPage(Object.assign({}, SET, { provider: "azure", address: "", hasKey: false })).html());
  check(/Needed for this service: the full https address the organisation gives for it\./.test(az) && !/nowhere else/.test(az),
    "as2b a service with no address of its own asks for one, and with none given names no host");
});
await block(async () => {
  const managed = Object.assign({}, SET, { managed: { provider: true, endpoint: false, model: true, key: true } });
  const h = settingsPage(managed).html();
  const disabled = Array.from(h.matchAll(/<(select|input)[^>]*?(data-act="ai-provider"|data-ai-f="(\w+)")[^>]*>/g))
    .filter((m) => / disabled/.test(m[0])).map((m) => m[3] || "provider");
  check(disabled.join(",") === "provider,model,key" && (textOf(h).match(/Set by the organisation(?! in Group Policy)/g) || []).length === 3
    && /Whoever manages Etiuda for the organisation can change this\./.test(textOf(h)),
  "as3 the fields the organisation set are disabled (" + disabled.join(", ") + ") and marked, with the line saying who can change them");
});

/* ---- as4 and as5, what the presses send --------------------------------------------------------------------------- */
await block(async () => {
  const { P, S, saved } = settingsPage(SET);
  const fire = changeOf(P);
  const keyField = input("key", "sk-typed-once");
  fire.forEach((fn) => fn({ target: keyField }));
  await tick(); await tick();
  const afterKey = saved.slice();
  S.ai = SET;
  fire.forEach((fn) => fn({ target: input("endpoint", "https://gateway.example.test/v1/") }));
  await tick(); await tick();
  S.ai = Object.assign({}, SET, { provider: "compatible", endpoint: "https://gateway.example.test/v1/" });
  const ACTS = P.page.__get("ACTS");
  await ACTS["ai-provider"]({ value: "anthropic", getAttribute: () => null });
  check(afterKey.length === 1 && afterKey[0][3] === "sk-typed-once" && afterKey[0][4] === false && keyField.value === ""
    && saved.length === 3 && saved[1].join("|") === "openai|https://gateway.example.test/v1/|m-1||false"
    && saved[2].join("|") === "anthropic||m-1||false",
  "as4 the key is sent once and its field emptied; an address is sent with the key \"\"; a service chosen starts from no"
    + " address: " + JSON.stringify(saved.map((a) => a.map((x, i) => (i === 3 && x ? "<key>" : x)))));
});
await block(async () => {
  let answer = { error: null, ok: true, ms: 12 };
  const { P, S, html } = settingsPage(SET, { aiTest: async () => answer });
  const ACTS = P.page.__get("ACTS");
  const going = ACTS["ai-test"]();
  const during = textOf(html());
  await going;
  const ok = html();
  answer = { error: "The AI service did not accept the key it was given, status 401. The key is checked from the Menu, under Settings, then AI service.",
    said: { frame: "The AI service did not accept the key it was given, status {STATUS}. The key is checked from the Menu, under Settings, then AI service.", vars: { STATUS: "401" } } };
  await ACTS["ai-test"]();
  const no = textOf(html());
  check(/Testing…/.test(during) && /Connected: <span class="mono">published\.example\.test<\/span> answered, model <span class="mono">m-1<\/span>\./.test(ok)
    && /did not accept the key it was given, status 401/.test(no) && S.aiTest.state === "fail",
  "as5 the test says Testing…, then the host and model that answered, or the refusal's own sentence");
});

/* ---- as6, the copywriter's words ---------------------------------------------------------------------------------- */
/* [the English, the Polish], Stage 3 of her brief, in her order; the vendors' names are their own and not rows. */
const STAGE3 = [
  ["AI service", "Usługa AI"],
  ["Studio can use an AI service of the organisation's choosing to bring in old replies, draft a card's other language, or draft a new card from a short description. Nothing is sent until the lead starts a job and presses Send, and then only to the address below.",
    "Studio może korzystać z usługi AI wybranej przez organizację, by wczytywać dawne odpowiedzi, szkicować drugi język karty albo nową kartę z krótkiego opisu. Nic nie jest wysyłane, dopóki lider zespołu nie rozpocznie zadania i nie naciśnie Wyślij, a wtedy tylko pod adres podany niżej."],
  ["No service is set, so Studio sends nothing anywhere.", "Nie ustawiono żadnej usługi, więc Studio niczego nigdzie nie wysyła."],
  ["Service", "Usługa"], ["None", "Brak"], ["Another OpenAI-compatible service", "Usługa zgodna z OpenAI"],
  ["Address", "Adres"],
  ["Left empty, the service's own address is used: {URL}", "Puste pole oznacza własny adres usługi: {URL}"],
  ["Needed for this service: the full https address the organisation gives for it.", "Wymagany dla tej usługi: pełny adres https, który podaje dla niej organizacja."],
  ["Model", "Model"], ["The model's name exactly as the service lists it.", "Nazwa modelu dokładnie taka, jak podaje ją usługa."],
  ["Key", "Klucz"],
  ["Kept on this computer, sealed by the system for this account, and never written to a log.", "Przechowywany na tym komputerze, zapieczętowany przez system dla tego konta i nigdy niezapisywany w dzienniku."],
  ["A key is kept. Typing a new one replaces it.", "Klucz jest zachowany. Wpisanie nowego go zastępuje."],
  ["Test the connection", "Sprawdź połączenie"],
  ["Asks the model for a one-word answer. No catalog text is sent.", "Prosi model o odpowiedź jednym słowem. Żaden tekst z katalogu nie jest wysyłany."],
  ["Testing…", "Sprawdzanie…"],
  ["Connected: {HOST} answered, model {MODEL}.", "Połączono: {HOST} odpowiada, model {MODEL}."],
  ["What a job sends goes to {HOST} and nowhere else.", "To, co wysyła zadanie, trafia do {HOST} i nigdzie indziej."],
  ["Set by the organisation", "Ustawione przez organizację"],
  ["Whoever manages Etiuda for the organisation can change this.", "Zmienić to może osoba, która zarządza Etiudą w organizacji."],
];
const box = {};
box.window = box;
vm.createContext(box);
vm.runInContext(fs.readFileSync(path.join(ROOT, "ui", "lang.js"), "utf8"), box, { filename: "lang.js" });
box.STUDIO_T.force("pl");
const TABLE = new Set(box.STUDIO_T.table().plain);
const APP = fs.readFileSync(path.join(ROOT, "ui", "app.js"), "utf8").replace(/"\s*\+\s*"/g, "");
const rowsOff = (rows) => rows.filter(([en, pl]) => !(TABLE.has(en) && box.STUDIO_T.T(en) === pl && APP.indexOf(JSON.stringify(en)) >= 0)).map((r) => r[0]);
await block(async () => {
  const off = rowsOff(STAGE3);
  check(off.length === 0, "as6 the " + STAGE3.length + " rows of Stage 3 are the copywriter's, English and Polish" + (off.length ? "; OFF: " + JSON.stringify(off) : ""));
});

/* ---- as21 to as24, the sentences made true (the copywriter's words-992-own-ai-2026-11-11, "From Argon's review" and "Reset
   defaults and Clear local memory keep the AI service and its key") ------------------------------------------------------ */
const TOUR_TAIL = ["Beyond that, Studio connects to etiuda.dev for its licence and, about once an hour, to see whether a newer version is out, which an administrator can switch off; it never downloads or installs anything by itself. Where an AI service is set, a job the lead starts sends to that service alone, and only once the lead has seen what goes. What the lead sends to it may include customers' own words, where the lead chose them; etiuda.dev never receives them in a form it can read.",
  "Poza tym Studio łączy się z etiuda.dev w sprawie licencji oraz mniej więcej co godzinę, by sprawdzić, czy jest nowsza wersja, co administrator może wyłączyć; niczego samo nie pobiera ani nie instaluje. Jeśli ustawiono usługę AI, zadanie rozpoczęte przez lidera zespołu wysyła tekst tylko do niej i dopiero wtedy, gdy lider zespołu zobaczy, co zostanie wysłane. Wysyłany tam tekst może zawierać słowa klientów, jeśli wybrał je lider zespołu; do etiuda.dev nigdy nie trafiają one w postaci możliwej do odczytania."];
await block(async () => {
  const keys = Array.from(TABLE).filter((k) => k.indexOf("A catalog is one folder on disk holding") >= 0);
  const en = keys[0] || "";
  check(keys.length === 1 && en.endsWith(" " + TOUR_TAIL[0]) && box.STUDIO_T.T(en).endsWith(" " + TOUR_TAIL[1]) && APP.indexOf(TOUR_TAIL[0]) >= 0
    && APP.indexOf("connects only to etiuda.dev") < 0,
  "as21 the tour's first step ends in the copywriter's tail from \"Beyond that\", English on the page and Polish in the table:"
    + " the licence, the hourly version look an administrator can switch off, the AI service's jobs, nothing a customer wrote");
});
await block(async () => {
  const policy = settingsPage(Object.assign({}, SET, { managed: { provider: false, endpoint: false, model: false, key: true } })).html();
  const own = settingsPage(SET).html(), none = settingsPage(Object.assign({}, SET, { hasKey: false })).html();
  const row = (h) => textOf(h.slice(h.indexOf('data-ai-f="endpoint"'), h.indexOf('data-act="ai-test"')));
  check(/Set by the organisation in Group Policy, where every user of this computer can read it\./.test(row(policy))
    && !/sealed by the system/.test(row(policy)) && !/data-act="ai-forget"/.test(policy)
    && /Kept on this computer, sealed by the system for this account/.test(row(own)) && /data-act="ai-forget"[^>]*>Forget the key</.test(own)
    && !/data-act="ai-forget"/.test(none),
  "as22 a key Group Policy set says it is set there and readable by every user of the computer, never that it is sealed, and offers"
    + " no Forget the key; a key kept here is the sealed one, with Forget the key; with none kept the button is not drawn");
});
await block(async () => {
  const { P, saved } = settingsPage(SET);
  const said = [];
  P.page.__set("sayOnly", (t) => { said.push(t); });
  await P.page.__get("ACTS")["ai-forget"]();
  const managed = settingsPage(Object.assign({}, SET, { managed: { provider: false, endpoint: false, model: false, key: true } }));
  await managed.P.page.__get("ACTS")["ai-forget"]();
  check(saved.length === 1 && saved[0].join("|") === "openai||m-1||true" && said.join() === "Key forgotten" && managed.saved.length === 0,
  "as23 Forget the key sends studio:ai-save with forget and no key, the service, address and model as they stand, and says Key"
    + " forgotten; with a policy key it sends nothing: " + JSON.stringify(saved) + " " + JSON.stringify(said));
});
const KEPT_LINES = [
  ["Puts every setting back as it ships, except the AI service and its key. Catalogs are not touched. The key is removed from the Menu, under Settings, then AI service, with Forget the key.",
    "Przywraca wszystkie ustawienia do stanu wyjściowego, z wyjątkiem usługi AI i jej klucza. Katalogi zostają bez zmian. Klucz usuwa się z menu, w Ustawieniach, w części Usługa AI, przyciskiem Usuń klucz."],
  ["Goes from this computer: Studio's other settings, the Opened recently list and the open catalog tabs.",
    "Znikną z tego komputera: pozostałe ustawienia Studia, lista Ostatnio otwierane i zakładki otwartych katalogów."],
  ["Stays: every catalog and its folder, the licence, the teams and the relay, the signing key and its backup copies, and the AI service with its key, which Forget the key removes, from the Menu, under Settings, then AI service.",
    "Zostają: wszystkie katalogi z ich folderami, licencja, zespoły i przekaźnik, klucz podpisu i jego kopie zapasowe oraz usługa AI z kluczem, który usuwa przycisk Usuń klucz z menu, w Ustawieniach, w części Usługa AI."],
  ["Forget the key", "Usuń klucz"],
  ["Removes the AI service's key kept on this computer. Nothing is sent.", "Usuwa klucz usługi AI przechowywany na tym komputerze. Nic nie jest wysyłane."],
  ["Key forgotten", "Usunięto klucz"],
  ["Set by the organisation in Group Policy, where every user of this computer can read it.", "Ustawiony przez organizację w zasadach grupy, gdzie może go odczytać każdy użytkownik tego komputera."],
];
await block(async () => {
  const off = rowsOff(KEPT_LINES);
  const clear = textOf(settingsPage(SET).P.page.__get("clearCoverHtml")());
  check(off.length === 0 && clear.indexOf(KEPT_LINES[2][0]) >= 0 && clear.indexOf(KEPT_LINES[1][0]) >= 0,
  "as24 Reset defaults and Clear local memory say the AI service and its key stay and where Forget the key removes it, and the"
    + " key's rows are the copywriter's, English and Polish" + (off.length ? "; OFF: " + JSON.stringify(off) : ""));
});

/* as38, the key fix's answer: an address moved with no new key forgets the key kept, says so, and the card says so. */
await block(async () => {
  const { P, S, html } = settingsPage(SET, { aiSave: async (...a) => Object.assign({}, SET, { endpoint: a[1], hasKey: false, keyDropped: true }) });
  P.page.__get("S").screen = "projects";
  const before = html();
  await P.page.__get("aiSave")({ endpoint: "https://gateway-b.example.test/v1/" }, "");
  const after = html();
  await P.page.__get("aiSave")({ endpoint: "https://gateway-b.example.test/v1/" }, "");
  S.ai = SET;
  check(!/data-ai-dropped/.test(before) && /The key kept here was given for the previous service or address, so it was forgotten rather than sent to this one\. A key for this one goes in the Key field\./.test(textOf(after))
    && rowsOff([["The key kept here was given for the previous service or address, so it was forgotten rather than sent to this one. A key for this one goes in the Key field.",
      "Zachowany klucz podano dla poprzedniej usługi lub adresu, więc został usunięty, zamiast trafić pod nowy. Klucz dla nowego wpisuje się w polu Klucz."]]).length === 0,
  "as38 the card says, in the copywriter's words, that the key kept for the address before was forgotten rather than sent, when the save answers keyDropped");
});
/* ==== STAGE 4, THE DRAFTING JOBS ====================================================================================
   The shell's AI section is run as it stands in shell/main.js, from its head to the quiet check's, in a context holding
   what it names: the real src/customer-ai.mjs and src/refusal.mjs, src/studio.mjs's verbs as the thread runs them, a user
   data folder and a project in scratch, a stand-in seal for the key, Group Policy read as nothing, and a door that records
   every request and answers as the check asks. Nothing reaches a network. */
const MAIN_TEXT = fs.readFileSync(path.join(ROOT, "shell", "main.js"), "utf8");
const SECTION = ["/* THE CUSTOMER'S OWN AI SERVICE (board 992;", "/* THE QUIET CHECK."];
const Studio = await import(pathToFileURL(path.join(ROOT, "src", "studio.mjs")).href);
const SCRATCH = fs.mkdtempSync(path.join(os.tmpdir(), "etiuda-studio-ai-surfaces-"));
const requireHere = createRequire(import.meta.url);
const CHOSEN = { file: "" };
function shellSection(policyFn, mainOverride) {
  const src = typeof mainOverride === "string" ? mainOverride : MAIN_TEXT;
  const at = src.indexOf(SECTION[0]), end = src.indexOf(SECTION[1], at);
  if (at < 0 || end < 0) throw new Error("ai-surfaces: the AI section of shell/main.js has moved");
  const handlers = {}, sent = [];
  let answerWith = () => ({ status: 200, bytes: Buffer.from("{}") });
  const userData = fs.mkdtempSync(path.join(SCRATCH, "ud-"));
  const sentEvents = [];
  const box = {
    console, Buffer, Date, JSON, Object, Array, String, Number, Promise, URL, process,
    ROOT, path, fs,
    require: (p) => (/ai-policy\.cjs$/.test(String(p)) ? { aiPolicyText: () => (typeof policyFn === "function" ? policyFn() : "") } : requireHere(p)),
    lazy: (file) => { let m = null; return async () => m || (m = await import(pathToFileURL(path.join(ROOT, "src", file)).href)); },
    app: { getPath: () => userData },
    writeWhole: requireHere(path.join(ROOT, "src", "whole-write.cjs")).writeWhole,
    vault: { available: () => true, seal: (t) => Buffer.from(String(t), "utf8").reverse(), open: (b) => Buffer.from(b).reverse().toString("utf8") },
    answer: (channel, fn) => { handlers[channel] = fn; },
    guard: async (fn) => { try { return Object.assign({ error: null }, await fn()); } catch (e) { return { error: e && e.message ? e.message : String(e), said: (e && e.said) || null }; } },
    wire: { customerAiRequest: async (endpoint, route, headers, body) => {
      const b = Buffer.from(body).toString("utf8");
      sent.push({ to: endpoint + route, headers, body: b });
      return answerWith(b);
    } },
    thread: { call: async (verb, ...a) => Studio[verb](...a) },
    /* the import's picker (src/chosen.cjs): only the file a leg says was chosen */
    chosen: { took: (kind, f) => kind === "import" && !!CHOSEN.file && f === CHOSEN.file },
    /* shell/main.js's own guard for a catalog's folder (the second wall, review 26), defined before the section: a direct child of
       the projects root, which here is this leg's `root`. The wall's own leg is tests/ipc-wall.mjs. */
    projectDir: (d) => {
      const home = path.resolve(String(d == null ? "" : d));
      if (!d || path.dirname(home) !== path.resolve(root)) throw new Error("That catalog is not one Studio lists.");
      return home;
    },
    /* shell/main.js's own guard for a list, defined after the section */
    LIST: (a) => (Array.isArray(a) ? a.map(String) : []),
    theWindow: { isDestroyed: () => false, webContents: { send: (ch, ...args) => { sentEvents.push({ ch, args }); } } },
  };
  box.refusal = box.lazy("refusal.mjs");
  vm.createContext(box);
  vm.runInContext(src.slice(at, end), box, { filename: "shell/main.js (the AI section)" });
  return { handlers, sent, answer: (fn) => { answerWith = fn; }, userData, sentEvents, theWindow: box.theWindow };
}
const chat = (content) => ({ status: 200, bytes: Buffer.from(JSON.stringify({ choices: [{ index: 0, message: { role: "assistant", content }, finish_reason: "stop" }] })) });
const call = (sh, channel, ...a) => sh.handlers[channel]({}, ...a);
const readDraft = (dir) => fs.readFileSync(path.join(dir, "draft.json"), "utf8");
const cardIn = (dir, id) => JSON.parse(readDraft(dir)).cards.find((c) => c.id === id);

/* One catalog in English and Polish: the category Returns with three cards written in both, one written in English alone
   (the one a job asks the Polish for), a card in another category, and two intents. */
const root = fs.mkdtempSync(path.join(SCRATCH, "root-"));
const made = await Studio.newProject(root, "Surfaces", "en");
const dir = made.dir;
const returns = (await Studio.addTag(dir, "shelf", { en: "Returns", pl: "Zwroty" })).tag.id;
const other = (await Studio.addTag(dir, "shelf", { en: "Billing", pl: "Płatności" })).tag.id;
const refundIntent = (await Studio.addTag(dir, "request", { en: "Asks for a refund", pl: "Prosi o zwrot" })).tag.id;
await Studio.addTag(dir, "request", { en: "Asks where the parcel is", pl: "Pyta o paczkę" });
const both = [];
for (const [en, pl] of [["We have sent the return label.", "Wysłaliśmy etykietę zwrotną."], ["Your refund is on its way.", "Zwrot jest w drodze."],
  ["The parcel came back to us.", "Paczka wróciła do nas."]]) {
  const c = (await Studio.addCard(dir, returns, "Title " + both.length, en)).card;
  await Studio.saveCard(dir, c.id, { title: { pl: "Tytuł " + both.length }, body: { pl } });
  both.push(c.id);
}
const lone = (await Studio.addCard(dir, returns, "Late refund", "We refund within five days of the parcel reaching us.")).card.id;
await Studio.addCard(dir, other, "Invoice", "Your invoice is attached.");
const LONE_TEXT = "Late refund\n\nWe refund within five days of the parcel reaching us.";

const sh = shellSection();
await call(sh, "studio:ai-save", "compatible", "https://gateway.example.test/llm/v1/", "m-7", "k-secret-77", false);
await block(async () => {
  /* as38b: a move with no key answers keyDropped and keeps none; a save that moves nothing, or with no key kept, says nothing */
  const moved = await call(sh, "studio:ai-save", "compatible", "https://gateway-b.example.test/llm/v1/", "m-7", "", false);
  const again = await call(sh, "studio:ai-save", "compatible", "https://gateway.example.test/llm/v1/", "m-7", "", false);
  const back = await call(sh, "studio:ai-save", "compatible", "https://gateway.example.test/llm/v1/", "m-7", "k-secret-77", false);
  const still = await call(sh, "studio:ai-save", "compatible", "https://gateway.example.test/llm/v1/", "m-7", "", false);
  check(moved.keyDropped === true && moved.hasKey === false && !again.keyDropped && back.hasKey === true && !still.keyDropped && still.hasKey === true,
  "as38b an address moved with no new key answers keyDropped and keeps no key; with no key kept, or nothing moved, the answer says nothing of it");
});
await block(async () => {
  const before = readDraft(dir);
  const r = await call(sh, "studio:ai-job-line", dir, "language", lone, "pl", "", "");
  check(!r.error && r.line && r.line.host === "gateway.example.test" && r.line.model === "m-7" && r.line.chars === LONE_TEXT.length
    && r.line.examples === 3 && r.line.refusal === null && sh.sent.length === 0 && readDraft(dir) === before,
  "as7 the line before a send names the host, the model, the card's " + (r.line && r.line.chars) + " characters and "
    + (r.line && r.line.examples) + " cards written in Polish, and sends nothing (" + sh.sent.length + " request(s)) and writes nothing");
});
let langDraft = null;
await block(async () => {
  const before = readDraft(dir);
  sh.answer(() => chat('```json\n{"title": "Spóźniony zwrot", "body": "Zwracamy pieniądze w ciągu pięciu dni od otrzymania paczki."}\n```'));
  const r = await call(sh, "studio:ai-job-send", dir, "language", lone, "pl", "", "");
  const req = sh.sent[0] || { body: "{}" }, doc = JSON.parse(req.body), user = (doc.messages || [])[1] || {}, system = (doc.messages || [])[0] || {};
  const examples = both.map((id) => { const c = cardIn(dir, id); return c.title.pl + "\n\n" + c.body.pl; });
  langDraft = r.draft;
  check(!r.error && r.draft && r.draft.card === lone && r.draft.lang === "pl" && r.draft.fields.body.pl.startsWith("Zwracamy")
    && sh.sent.length === 1 && req.to === "https://gateway.example.test/llm/v1/chat/completions"
    && String(user.content).indexOf(LONE_TEXT) >= 0 && examples.every((x) => String(user.content).indexOf(x) >= 0)
    && /in Polski/.test(system.content) && /JSON/.test(system.content)
    && readDraft(dir) === before && Studio.modelDrafts && fs.existsSync(path.join(dir, "model-drafts.json")) && !cardIn(dir, lone).body.pl,
  "as8 Send asks once, at the configured address, with the card and the three Polish cards the line counted, for the card's"
    + " text in Polish as JSON; the answer is kept as a draft beside the catalog and the card is untouched");
});
await block(async () => {
  const before = readDraft(dir), drafts = fs.readFileSync(path.join(dir, "model-drafts.json"), "utf8");
  const tries = [
    ["key", () => ({ status: 401, bytes: Buffer.from('{"error":{"message":"bad key"}}') })],
    ["unreached", () => { throw new Error("net::ERR_NAME_NOT_RESOLVED"); }],
    ["late", () => { throw new Error("the AI service did not answer within 180 seconds"); }],
    ["busy", () => ({ status: 429, bytes: Buffer.from("{}") })],
    ["failed", () => ({ status: 500, bytes: Buffer.from('{"error":{"message":"down"}}') })],
    ["unusable", () => chat("Sure! Here is the card in Polish: Zwracamy pieniądze.")],
    ["unusable", () => chat('{"title": "Bez treści", "body": ""}')],
  ];
  const got = [];
  for (const [want, fn] of tries) {
    sh.answer(fn);
    const r = await call(sh, "studio:ai-job-send", dir, "language", lone, "pl", "", "");
    got.push(want + "=" + (r.failed ? r.failed.why : r.draft ? "DRAFT" : "?"));
  }
  check(got.every((g) => g.split("=")[0] === g.split("=")[1]) && readDraft(dir) === before
    && fs.readFileSync(path.join(dir, "model-drafts.json"), "utf8") === drafts,
  "as9 a failure keeps nothing and leaves the card as it was, and says which line it is: " + got.join(", "));
});
await block(async () => {
  /* both[0] has its Polish already, so the line refuses it; a card asked for afresh above was refused before any request */
  const n = sh.sent.length;
  const written = await call(sh, "studio:ai-job-line", dir, "language", both[0], "pl", "", "");
  const notHere = await call(sh, "studio:ai-job-send", dir, "import", path.join(dir, "draft.json"), "", "", "");
  const test = await call(sh, "studio:ai-job-send", dir, "test", "", "", "", "");
  await call(sh, "studio:ai-save", "", "", "m-7", "", false);
  const unsetLine = await call(sh, "studio:ai-job-line", dir, "language", lone, "pl", "", "");
  const unsetSend = await call(sh, "studio:ai-job-send", dir, "language", lone, "pl", "", "");
  await call(sh, "studio:ai-save", "compatible", "https://gateway.example.test/llm/v1/", "m-7", "", false);
  check(written.line === null && written.refused === "written" && notHere.failed && notHere.failed.refused === "file"
    && test.failed && unsetLine.line && unsetLine.line.refusal && /No AI service is set up yet/.test(unsetLine.line.refusal.message)
    && unsetSend.failed && unsetSend.failed.why === "unset" && unsetSend.failed.sent === false && sh.sent.length === n,
  "as10 nothing is sent for a card already written in that language, for an import of a file the person did not choose, for the test,"
    + " or with no service set, where the line says so: " + (sh.sent.length - n) + " request(s)");
});
await block(async () => {
  /* the configuration's key was kept when the address was saved again with no new key: the job still reaches it */
  /* as the page sends it: the title as the model wrote it, the body as the lead edited it */
  const r = await call(sh, "studio:ai-draft-accept", dir, langDraft.id, ["pl"], [langDraft.fields.title.pl], ["Zwracamy pieniądze w ciągu pięciu dni."], "", []);
  const card = cardIn(dir, lone), log = JSON.parse(fs.readFileSync(path.join(dir, "review-log.json"), "utf8"));
  const entry = log.reviews[log.reviews.length - 1] || {};
  check(!r.error && card.body.pl === "Zwracamy pieniądze w ciągu pięciu dni." && card.title.pl === "Spóźniony zwrot"
    && /^Drafted by the model m-7 at compatible/.test(entry.from) && entry.note === "edited before accepting"
    && entry.accepted.join() === entry.applied.join() && entry.accepted.indexOf("card:" + lone + ":body.pl") >= 0
    && r.drafts.length === 0 && !fs.existsSync(path.join(dir, "model-drafts.json")),
  "as11 Accept writes the lead's edit of the draft into the card, its title where the card had none, and records who accepted"
    + " what the model drafted, edited (" + entry.note + ", " + entry.accepted.join(" ") + "); the draft is gone");
});
let sitDraft = null;
await block(async () => {
  sh.answer(() => chat("x"));
  const before = readDraft(dir);
  const r0 = await call(sh, "studio:ai-job-line", dir, "situation", "", "", "A parcel was returned damaged. We refund in full.", returns);
  sh.answer(() => chat(JSON.stringify({ title: { en: "Damaged return", pl: "Uszkodzony zwrot" },
    body: { en: "We are sorry. We refund in full.", pl: "Przepraszamy. Zwracamy całą kwotę." }, category: "returns", intents: ["Asks for a refund", "Nobody's intent"] })));
  const n = sh.sent.length;
  const r = await call(sh, "studio:ai-job-send", dir, "situation", "", "", "A parcel was returned damaged. We refund in full.", returns);
  const user = JSON.parse(sh.sent[n].body).messages[1].content;
  sitDraft = r.draft;
  check(!r0.error && r0.line.examples === 4 && r0.line.category === "Returns" && r0.line.chars === 49 && sh.sent.length === n + 1
    && /Categories: Returns; Billing/.test(user) && /Intents: Asks for a refund; Asks where the parcel is/.test(user)
    && user.indexOf("Invoice") < 0 && r.draft && r.draft.fields.shelf === returns && r.draft.fields.requests.join() === refundIntent
    && readDraft(dir) === before,
  "as12 a situation's line counts the description and the four cards of Returns; Send sends those and the names of the"
    + " categories and intents, no card of another category; the draft takes Returns by name and the one intent the catalog has");
});
await block(async () => {
  const before = readDraft(dir);
  const extra = (await call(sh, "studio:ai-job-send", dir, "language", lone, "pl", "", "")).draft;
  const gone = await call(sh, "studio:ai-draft-discard", dir, extra ? extra.id : "none");
  const f = sitDraft.fields;
  const r = await call(sh, "studio:ai-draft-accept", dir, sitDraft.id, ["en", "pl"], [f.title.en, f.title.pl], [f.body.en, f.body.pl], f.shelf, f.requests);
  const doc = JSON.parse(readDraft(dir)), made = doc.cards.find((c) => c.id === r.made) || {};
  const entry = JSON.parse(fs.readFileSync(path.join(dir, "review-log.json"), "utf8")).reviews.pop();
  check(extra === null && gone.discarded === false && before === before
    && made.title && made.title.en === "Damaged return" && made.title.pl === "Uszkodzony zwrot" && made.body.pl === "Przepraszamy. Zwracamy całą kwotę."
    && made.shelf === returns && (made.requests || []).join() === refundIntent && entry.accepted.join() === "card+:" + r.made && entry.note === "not edited",
  "as13 a card already written in Polish asks nothing; Discard of nothing waiting changes nothing; Accept of the situation's"
    + " draft makes the card, both languages, Returns and its intent, recorded as accepted unedited");
});
await block(async () => {
  sh.answer(() => chat('{"title": "Inny", "body": "Inna treść."}'));
  const lone2 = (await Studio.addCard(dir, returns, "Lost parcel", "We look for it with the carrier.")).card.id;
  const before = readDraft(dir);
  const d = (await call(sh, "studio:ai-job-send", dir, "language", lone2, "pl", "", "")).draft;
  const gone = await call(sh, "studio:ai-draft-discard", dir, d.id);
  check(gone.discarded === true && gone.drafts.length === 0 && readDraft(dir) === before && !cardIn(dir, lone2).body.pl,
    "as14 Discard takes the draft away and leaves the card as it was, its Polish still empty");
});
/* as27, Argon's finding 4: a connection that breaks may break after the text went, so it is not "could not reach". */
await block(async () => {
  const lone3 = (await Studio.addCard(dir, returns, "Wrong size", "We swap the size.")).card.id;
  const got = {};
  for (const [name, word] of [["reset", "net::ERR_CONNECTION_RESET"], ["refused", "net::ERR_CONNECTION_REFUSED"], ["dns", "net::ERR_NAME_NOT_RESOLVED"]]) {
    sh.answer(() => { throw new Error(word); });
    got[name] = (await call(sh, "studio:ai-job-send", dir, "language", lone3, "pl", "", "")).failed || {};
  }
  check(got.reset.why === "dropped" && got.reset.sent === true && got.reset.said === null && /ERR_CONNECTION_RESET/.test(got.reset.code)
    && got.refused.why === "unreached" && got.refused.sent === false && got.dns.why === "unreached" && got.dns.sent === false,
  "as27 a connection reset is a drop, the text perhaps sent (" + got.reset.why + ", sent " + got.reset.sent + "), and only a name not"
    + " found or a connection refused is not reached (" + got.refused.why + ", " + got.dns.why + ", sent " + got.dns.sent + ")");
});
/* ==== JOB 1, BRINGING IN OLD REPLIES (board 992; the product designer's surfaces.md 1a) =================================
   The import's line and Send through the AI section as it stands, src/import-text.mjs's importText behind Send, the answer
   the door gives in the import's own JSON. */
const PASTED = "We have sent you the return label.\r\n\r\nYour refund is on its way to your card.";
const SETTLED = PASTED.replace(/\r\n/g, "\n");
const IMPORT_ANSWER = JSON.stringify({ cards: [
  { title: { en: "Return label" }, category: "returns", categoryLabel: { en: "Returns" }, intents: ["Asks for a refund"],
    bodies: [{ lang: "en", spans: [{ text: "We have sent you the return label." }] }] },
  { title: { en: "Refund on its way" }, category: "returns", categoryLabel: { en: "Returns" }, intents: [],
    bodies: [{ lang: "en", spans: [{ text: "Your refund is on its way to your card." }] }] }] });
const inboxNames = () => { try { return fs.readdirSync(path.join(dir, "inbox")).sort(); } catch { return []; } };
let imported = null;
await block(async () => {
  sh.answer(() => chat(IMPORT_ANSWER));
  const n = sh.sent.length, before = readDraft(dir), was = inboxNames();
  const line = await call(sh, "studio:ai-job-line", dir, "import", "", "", PASTED, "");
  const quiet = sh.sent.length === n && inboxNames().join() === was.join();
  const r = await call(sh, "studio:ai-job-send", dir, "import", "", "", PASTED, "");
  const req = sh.sent[n] || { body: "{}", to: "" }, doc = JSON.parse(req.body), msgs = doc.messages || [];
  const wrote = inboxNames().filter((x) => was.indexOf(x) < 0);
  const report = r.proposal ? JSON.parse(fs.readFileSync(r.proposal.file.replace(/\.ec$/, ".lint.json"), "utf8")) : {};
  const listed = ((await Studio.listProposals(dir)).proposals || []).find((p) => r.proposal && p.file === r.proposal.file) || {};
  imported = r.proposal;
  check(!line.error && line.line && line.line.chars === SETTLED.length && line.line.file === "" && line.line.host === "gateway.example.test" && quiet
    && !r.error && r.proposal && r.proposal.name === "model-import.ec" && r.proposal.cards === 2 && wrote.join() === "model-import.ec,model-import.lint.json"
    && sh.sent.length === n + 1 && req.to === "https://gateway.example.test/llm/v1/chat/completions"
    && String((msgs[1] || {}).content).indexOf(SETTLED) >= 0 && /Returns/.test(String((msgs[0] || {}).content)) && /Asks for a refund/.test(String((msgs[0] || {}).content))
    && report.model && report.model.model === "m-7" && report.model.service === "compatible" && listed.ok === true && listed.model && listed.model.model === "m-7"
    && readDraft(dir) === before,
  "as30 the import's line counts the pasted text (" + (line.line && line.line.chars) + " characters, its line endings settled) and sends nothing;"
    + " Send asks the configured address once with that text and the categories and intents, and the proposal (" + (r.proposal && r.proposal.cards)
    + " cards) waits in the inbox with its report, which names the service and model, and the queue lists it as the model's; the catalog untouched");
});
await block(async () => {
  const n = sh.sent.length;
  const txt = path.join(SCRATCH, "replies.txt"), book = path.join(SCRATCH, "replies.xlsx");
  fs.writeFileSync(txt, SETTLED, "utf8");
  fs.writeFileSync(book, Buffer.concat([Buffer.from([0x50, 0x4b, 0x03, 0x04]), Buffer.alloc(40)]));
  CHOSEN.file = "";
  const unchosen = await call(sh, "studio:ai-job-line", dir, "import", txt, "", "", "");
  CHOSEN.file = txt;
  const chosenLine = await call(sh, "studio:ai-job-line", dir, "import", txt, "", "", "");
  CHOSEN.file = book;
  const bookLine = await call(sh, "studio:ai-job-line", dir, "import", book, "", "", "");
  const blank = await call(sh, "studio:ai-job-line", dir, "import", "", "", "  \n ", "");
  CHOSEN.file = "";
  check(unchosen.line === null && unchosen.refused === "file" && chosenLine.line && chosenLine.line.file === "replies.txt" && chosenLine.line.chars === SETTLED.length
    && bookLine.line === null && bookLine.refused === "file" && blank.line === null && blank.refused === "empty" && sh.sent.length === n,
  "as31 a file is read only where the person chose it, by its name and its text's characters; a workbook is not text and an empty"
    + " box is nothing, each refused with nothing sent (" + (sh.sent.length - n) + " request(s))");
});
await block(async () => {
  const was = inboxNames(), n = sh.sent.length;
  sh.answer(() => ({ status: 401, bytes: Buffer.from('{"error":{"message":"bad key"}}') }));
  const key = await call(sh, "studio:ai-job-send", dir, "import", "", "", PASTED, "");
  sh.answer(() => chat("I could not find any replies in this."));
  const prose = await call(sh, "studio:ai-job-send", dir, "import", "", "", PASTED, "");
  const unchanged = inboxNames().join() === was.join();
  sh.answer(() => chat(IMPORT_ANSWER));
  const late = await call(sh, "studio:ai-job-send", dir, "import", "", "", PASTED, "");
  const took = await call(sh, "studio:ai-draft-discard", dir, "import:" + late.proposal.name);
  const notOurs = await call(sh, "studio:ai-draft-discard", dir, "import:../draft.json");
  check(key.failed && key.failed.why === "key" && key.failed.sent === true && prose.failed && prose.failed.why === "unusable" && prose.failed.sent === true
    && unchanged && late.proposal && late.proposal.name === "model-import-2.ec" && took.discarded === true && notOurs.discarded === false
    && inboxNames().join() === was.join() && fs.existsSync(path.join(dir, "draft.json")),
  "as32 a refused key and an answer that is not the import's keep nothing and say their lines (" + (key.failed && key.failed.why) + ", "
    + (prose.failed && prose.failed.why) + "); a proposal that came back after Cancel is taken out of the inbox, and only a model import's");
});
/* as25, Argon's finding 6: a situation's draft accepted in two languages with an intent is ONE change, so one Undo takes it away. */
await block(async () => {
  const changes = () => { try { return JSON.parse(fs.readFileSync(path.join(dir, "changes.json"), "utf8")).list; } catch { return []; } };
  sh.answer(() => chat(JSON.stringify({ title: { en: "Broken item", pl: "Uszkodzony towar" }, body: { en: "We replace it.", pl: "Wymieniamy go." },
    category: "Returns", intents: ["Asks for a refund"] })));
  const d = (await call(sh, "studio:ai-job-send", dir, "situation", "", "", "An item arrived broken. We replace it.", returns)).draft;
  const before = changes().length, f = d.fields;
  const r = await call(sh, "studio:ai-draft-accept", dir, d.id, ["en", "pl"], [f.title.en, f.title.pl], [f.body.en, f.body.pl], f.shelf, f.requests);
  const after = changes(), last = after[after.length - 1] || { cards: [] }, born = (last.cards[0] || {}).now || {};
  const undone = last.n != null ? await Studio.undoChange(dir, last.n) : null;
  check(!r.error && after.length === before + 1 && last.cards.length === 1 && last.cards[0].was === null
    && born.title && born.title.pl === "Uszkodzony towar" && born.body && born.body.pl === "Wymieniamy go." && (born.requests || []).join() === refundIntent
    && undone && !undone.error && !JSON.parse(readDraft(dir)).cards.some((c) => c.id === r.made),
  "as25 a situation's draft accepted in English and Polish with an intent is one change (" + (after.length - before) + "), the card"
    + " born whole in it, and one Undo takes the card away");
});
/* as26, Argon's finding 7: a card with steps or alternatives is asked for nothing, and a draft asked for before it took them is
   refused at Accept, the card as it was. */
await block(async () => {
  sh.answer(() => chat('{"title": "Zgubiona", "body": "Szukamy jej."}'));
  const id = (await Studio.addCard(dir, returns, "Missing", "We look for it.")).card.id;
  const d = (await call(sh, "studio:ai-job-send", dir, "language", id, "pl", "", "")).draft;
  await Studio.saveCard(dir, id, { replies: { shape: "steps", blocks: [{ text: { en: "We look for it." } }, { text: { en: "We tell you." } }] } });
  const before = readDraft(dir), n = sh.sent.length;
  const line = await call(sh, "studio:ai-job-line", dir, "language", id, "pl", "", "");
  const sent = await call(sh, "studio:ai-job-send", dir, "language", id, "pl", "", "");
  const acc = await call(sh, "studio:ai-draft-accept", dir, d.id, ["pl"], [d.fields.title.pl], [d.fields.body.pl], "", []);
  check(line.line === null && line.refused === "shaped" && sent.draft === null && sh.sent.length === n
    && /steps or alternatives/.test(String(acc.error)) && readDraft(dir) === before && Studio.modelDrafts && (await Studio.modelDrafts(dir)).drafts.some((x) => x.id === d.id),
  "as26 a card with steps asks nothing (" + (sh.sent.length - n) + " request(s), refused " + line.refused + "), and the draft asked"
    + " for before it took them is refused at Accept and keeps waiting, the card as it was: " + String(acc.error).slice(0, 60));
  await call(sh, "studio:ai-draft-discard", dir, d.id);
});

/* ---- the page's side of the jobs --------------------------------------------------------------------------------- */
function cardPage(ai, api, uiLang, source) {
  const asked = [];
  const P = loadPage({ api: Object.assign({
    aiJobLine: async (...a) => { asked.push(["line"].concat(a)); return { error: null, line: { host: "gateway.example.test", model: "m-7", service: "compatible", managed: false, chars: 1240, examples: 3, category: "", refusal: null } }; },
    aiJobSend: async (...a) => { asked.push(["send"].concat(a)); return { error: null, draft: null, failed: { why: "key", said: null, sent: true, host: "gateway.example.test" } }; },
  }, api || {}), uiLang: uiLang || "en", source });
  const S = P.page.__get("S");
  S.ai = ai;
  S.open = { dir: "D", draft: { langs: [{ code: "en" }, { code: "pl" }], tags: [{ id: "returns", kind: "shelf", label: { en: "Returns" } }],
    cards: [{ id: "c1", shelf: "returns", title: { en: "Late refund" }, body: { en: "We refund within five days." } },
      { id: "c2", shelf: "returns", title: { en: "Label", pl: "Etykieta" }, body: { en: "Sent.", pl: "Wysłana." } }] },
    lint: { errors: 0, warnings: 0 }, editions: [], project: {} };
  S.screen = "project"; S.section = "cards"; S.sel = "c1"; S.lang = "both";
  const editor = (id) => P.page.__get("editorHtml")(P.page.__get("cardById")(id || "c1"));
  return { P, S, asked, editor, ACTS: P.page.__get("ACTS") };
}
const P_KEY = "import||";
const btn = (job, card, lang) => ({ getAttribute: (k) => ({ "data-job": job, "data-card": card, "data-lang": lang })[k] || null });
await block(async () => {
  const off = cardPage(NONE_SET), on = cardPage(SET);
  const asks = Array.from(on.editor().matchAll(/data-act="ai-ask"[^>]*/g), (m) => m[0]);
  check(!/ai-ask|ai-job/.test(off.editor()) && asks.length === 1 && /data-job="language"/.test(asks[0]) && /data-lang="pl"/.test(asks[0])
    && !/data-act="ai-ask"/.test(on.editor("c2")) && /Draft with the organisation&#39;s model/.test(on.editor()),
  "as15 the other language's button stands in the empty Polish body alone, only while a service is set, and not on a card"
    + " written in both");
});
await block(async () => {
  const { S, asked, editor, ACTS } = cardPage(SET);
  await ACTS["ai-ask"](btn("language", "c1", "pl"));
  const line = textOf(editor()).replace(/ ([,.)])/g, "$1"), html = editor();
  await ACTS["ai-cancel"](btn("language", "c1", "pl"));
  const back = editor();
  await ACTS["ai-ask"](btn("language", "c1", "pl"));
  await ACTS["ai-send"](btn("language", "c1", "pl"));
  const failed = editor();
  S.ai = Object.assign({}, SET, { managed: { provider: true, endpoint: true, model: true, key: true } });
  const managed = textOf(editor());
  check(asked.filter((a) => a[0] === "send").length === 1 && asked[0].slice(0, 4).join("|") === "line|D|language|c1"
    && /Sends this card \(1,?240[\s ]characters\) to gateway\.example\.test, model m-7, with 3[\s ]cards already written in that language as examples\./.test(line)
    && /<span class="mono">gateway\.example\.test<\/span>/.test(html) && /data-act="ai-send"/.test(html) && /data-act="ai-cancel"/.test(html)
    && /data-act="ai-ask"/.test(back) && !/data-act="ai-send"/.test(back)
    && /gateway\.example\.test<\/span> did not accept the key, so nothing was drafted\./.test(failed) && /data-act="ai-settings"/.test(failed)
    && /Whoever manages Etiuda for the organisation can change this\./.test(managed),
  "as16 the press shows the line with the counts, the host and the model, Send and Cancel, and sends nothing; Cancel brings the"
    + " button back; a refused key says so in the button's place with Open Settings, or who can change it where the organisation set it");
});
await block(async () => {
  const { S, editor, P } = cardPage(SET);
  S.aiDrafts = { dir: "D", drafts: [{ id: "d-1", job: "language", card: "c1", lang: "pl", service: "compatible", model: "m-7",
    fields: { title: { pl: "Spóźniony zwrot" }, body: { pl: "Zwracamy w ciągu pięciu dni." } } }] };
  const h = editor();
  const plBlock = h.slice(h.indexOf("Written by the model"));
  S.rv = { list: [], inbox: "D/inbox" }; S.section = "proposals";
  P.page.__get("paintProposalList")();
  const queue = P.node("#main").innerHTML;
  check(/Written by the model, not yet accepted/.test(h) && /data-act="ai-accept" data-draft="d-1"/.test(h) && /data-act="ai-discard" data-draft="d-1"/.test(h)
    && /<div class="ai-draft"><textarea class="ta" data-ai-d="body" data-draft="d-1" data-l="pl">Zwracamy w ciągu pięciu dni\.<\/textarea>/.test(h)
    && !/data-f="body"[^>]*data-l="pl"|data-f="title" data-l="pl"/.test(plBlock.slice(0, plBlock.indexOf('data-f="note"')))
    && /<span class="chip model">model<\/span> other language PL/.test(queue) && /no source: written by the model/.test(queue),
  "as17 a draft fills the empty language's title and body, marked with the bar and the line, Accept and Discard, in fields that"
    + " are not the card's; the queue lists it tagged model, other language, no source");
});
await block(async () => {
  /* the card took steps after its draft was asked for; repliesOf may still be null on the stand-in, as it is before CV2 loads */
  const { S, editor } = cardPage(SET);
  const c1 = S.open.draft.cards[0];
  c1.bodyShape = "steps";
  S.aiDrafts = { dir: "D", drafts: [{ id: "d-9", job: "language", card: "c1", lang: "pl", fields: { title: { pl: "T" }, body: { pl: "B" } } }] };
  const h = editor();
  S.aiDrafts = { dir: "D", drafts: [] };
  const bare = editor();
  check(!/data-ai-d=/.test(h) && !/data-act="ai-accept"/.test(h) && /data-act="ai-discard" data-draft="d-9"/.test(h) && /Written by the model, not yet accepted/.test(h)
    && !/data-act="ai-ask"/.test(bare),
  "as26b on a card with steps a waiting draft fills no field and offers Discard alone, and no draft button is drawn");
});
await block(async () => {
  const { P } = cardPage(SET);
  const fail = P.page.__get("aiFailHtml"), lineOf = P.page.__get("aiLineHtml");
  const drop = textOf(fail({ why: "dropped", said: null, code: "net::ERR_CONNECTION_RESET", host: "gateway.example.test" }, ""));
  const none = textOf(lineOf("situation", { host: "h.test", model: "m", chars: 50, examples: 0, category: "" })).replace(/ ([,.)])/g, "$1");
  const some = textOf(lineOf("situation", { host: "h.test", model: "m", chars: 50, examples: 4, category: "Returns" })).replace(/ ([,.)])/g, "$1");
  check(/The connection to gateway\.example\.test broke before an answer came, so nothing was drafted\./.test(drop) && !/Could not reach/.test(drop)
    && /title="net::ERR_CONNECTION_RESET"/.test(fail({ why: "dropped", said: null, code: "net::ERR_CONNECTION_RESET", host: "g" }, ""))
    && /^Sends the description \(50[\s ]characters\) and the names of the categories and intents to h\.test, model m\.$/.test(none.trim())
    && /4[\s ]cards from Returns as examples/.test(some),
  "as28 a drop says the connection broke and nothing was drafted, its network word in the title; a situation with no category's"
    + " cards names no examples (\"" + none.trim() + "\"), one with them names them");
});
/* ---- job 1 on the page ---- */
function importPage(ai, api, uiLang) {
  const asked = [];
  const P = loadPage({ api: Object.assign({
    aiJobLine: async (...a) => { asked.push(["line"].concat(a)); return { error: null, line: { host: "gateway.example.test", model: "m-7", service: "compatible", managed: false, chars: 18400, examples: 0, category: "", file: a[2] ? "replies.txt" : "", refusal: null } }; },
    aiJobSend: async (...a) => { asked.push(["send"].concat(a)); return { error: null, draft: null, proposal: { file: "D/inbox/model-import.ec", name: "model-import.ec", cards: 12 }, failed: null }; },
    proposals: async () => { asked.push(["proposals"]); return { error: null, inbox: "D/inbox", proposals: [] }; },
    proposalOpen: async (...a) => { asked.push(["open"].concat(a)); return { error: null, ok: true, changes: [], known: [], pending: [], notes: [], file: a[1] }; },
  }, api || {}), uiLang: uiLang || "en" });
  const S = P.page.__get("S");
  S.ai = ai;
  S.open = { dir: "D", draft: { langs: [{ code: "en" }], tags: [], cards: [] }, lint: { errors: 0, warnings: 0 }, editions: [], project: {}, counts: { cards: 3 } };
  S.screen = "project"; S.section = "import";
  S.wiz = { pasteDoor: true, file: "", plan: null, step: 0, no: null, pasteText: "", intoDir: "D", into: true, target: "into", override: {} };
  const said = [];
  P.page.__set("sayOnly", (x) => { said.push(x); });
  return { P, S, asked, said, door: () => P.page.__get("wizDoor")(), main: () => P.page.__get("wizMain")(), ACTS: P.page.__get("ACTS") };
}
await block(async () => {
  const on = importPage(SET), off = importPage(NONE_SET);
  const empty = on.door();
  on.S.wiz.pasteText = "Some replies";
  const full = on.door();
  on.S.wiz = { file: "C:/x/replies.txt", plan: null, no: { read: { source: "csv" } }, intoDir: "D", into: true, target: "into", override: {} };
  const cover = on.main();
  on.S.wiz.no = { read: { source: "workbook" } };
  const book = on.main();
  const row = full.slice(full.indexOf('data-act="wiz-pick"'));
  check(/data-act="ai-ask" data-job="import" data-card="" data-lang="" disabled>Split with the organisation&#39;s model</.test(empty)
    && /data-act="ai-ask" data-job="import" data-card="" data-lang="">Split with the organisation&#39;s model</.test(full)
    && row.indexOf('data-act="wiz-paste-go"') < row.indexOf('data-job="import"') && /class="btn solid" data-act="wiz-paste-go"/.test(full)
    && !/data-job="import"/.test(off.door()) && /data-job="import" data-card="C:\/x\/replies\.txt"/.test(cover) && !/data-job="import"/.test(book),
  "as33 the Import step offers Split with the organisation's model after Split into cards, which stays the solid one, disabled while"
    + " the box is empty, only while a service is set; the cover of a text file no plan could be made from offers it, a workbook's does not");
});
await block(async () => {
  const { S, asked, said, door, ACTS } = importPage(SET);
  S.wiz.pasteText = "Some replies";
  const b = btn("import", "", "");
  await ACTS["ai-ask"](b);
  const line = textOf(door()).replace(/ ([,.)])/g, "$1");
  const sends0 = asked.filter((a) => a[0] === "send").length;
  await ACTS["ai-cancel"](b);
  const back = door();
  await ACTS["ai-ask"](b);
  const wiz = S.wiz;
  await ACTS["ai-send"](b);
  check(asked[0].slice(0, 6).join("|") === "line|D|import|||Some replies" && sends0 === 0
    && /Sends this text \(18,?400[\s\u00a0]characters\) and the names of the categories and intents to gateway\.example\.test, model m-7\./.test(line)
    && /data-act="wiz-paste-go"/.test(back) && !/data-act="ai-send"/.test(back)
    && asked.filter((a) => a[0] === "send").length === 1 && asked.find((a) => a[0] === "send").slice(1, 3).join("|") === "D|import"
    && S.wiz === null && S.section === "proposals" && asked.some((a) => a[0] === "open" && a[2] === "D/inbox/model-import.ec")
    && /^Replies found:[s ]12$/.test(said.join()) && wiz !== null,
  "as34 the press shows the import's line and sends nothing; Cancel gives the row back; Send sends once through the job's own"
    + " channel, and the proposal opens in Proposals with the count found: " + JSON.stringify(said));
});
await block(async () => {
  const { S, door, ACTS } = importPage(SET, { aiJobSend: async () => ({ error: null, draft: null, proposal: null, failed: { why: "unusable", said: null, sent: true, host: "gateway.example.test" } }) });
  S.wiz.pasteText = "Some replies";
  const b = btn("import", "", "");
  await ACTS["ai-ask"](b);
  S.aiJob[P_KEY] = { state: "drafting", line: {} };
  const splitting = door();
  S.aiJob[P_KEY] = { state: "line", line: { host: "gateway.example.test", model: "m-7", chars: 12, file: "" }, words: "Some replies", shelf: "" };
  await ACTS["ai-send"](b);
  const failed = door();
  check(/Splitting…/.test(splitting) && /data-act="ai-cancel"/.test(splitting) && /<textarea class="ta" id="wizPaste" rows="14" readonly>/.test(splitting)
    && /The answer could not be used\. Nothing was added\./.test(textOf(failed)) && /data-act="wiz-paste-go"/.test(failed) && !/readonly/.test(failed),
  "as35 while it splits the row says Splitting… with Cancel and the box is read-only; after a failure the sentence stands with the"
    + " row, Split into cards still there");
});
await block(async () => {
  const { S, P } = cardPage(SET);
  S.rv = { list: [{ name: "model-import.ec", file: "D/inbox/model-import.ec", ok: true, foreign: true, proposes: {}, pending: 2, reworded: 0, model: { service: "compatible", model: "m-7", host: "h" } },
    { name: "desk.ec", file: "D/inbox/desk.ec", ok: true, foreign: false, proposes: {}, pending: 1, reworded: 0, model: null }], inbox: "D/inbox" };
  S.section = "proposals";
  P.page.__get("paintProposalList")();
  const rows = P.node("#main").innerHTML.split("<tr").filter((x) => /data-file=/.test(x));
  check(rows.length === 2 && /<span class="chip model">model<\/span>/.test(rows[0]) && !/chip model/.test(rows[1]),
  "as36 the queue tags the model's import \"model\", and no other file");
});
await block(async () => {
  const { S, P } = cardPage(SET);
  const keys = P.doc.heard.filter((h) => h.type === "keydown" && h.capture).map((h) => h.fn);
  const esc = () => { const e = { key: "Escape", stopped: false, preventDefault() { this.stopped = true; }, stopPropagation() {} }; keys.forEach((fn) => fn(e)); return e; };
  S.aiJob = { "situation||": { state: "drafting", line: {} } };
  const first = esc();
  const idle = esc();
  check(first.stopped && !S.aiJob["situation||"] && !idle.stopped,
  "as29 Escape while a job is drafting, the focus anywhere, is that job's Cancel and goes no further; with nothing working it is"
    + " left to the cover");
});
await block(async () => {
  const { S, P } = cardPage(SET);
  S.aiDrafts = { dir: "D", drafts: [{ id: "d-2", job: "situation", fields: { title: { en: "Damaged", pl: "Uszkodzony" }, body: { en: "Sorry.", pl: "Przepraszamy." }, shelf: "returns", requests: [] } }] };
  const cover = (() => { S.cover = "card"; S.aiShow = "d-2"; return P.page.__get("cardCoverHtml")(); })();
  S.aiShow = null;
  const form = P.page.__get("cardCoverHtml")();
  S.ai = NONE_SET;
  const formOff = P.page.__get("cardCoverHtml")();
  check(/Written by the model, not yet accepted/.test(cover) && (cover.match(/class="ai-draft"/g) || []).length === 5
    && /What happened, and what does the team do about it\?/.test(form) && /maxlength="600"/.test(form)
    && /data-act="ai-ask" data-job="situation"[^>]* hidden>/.test(form) && !/newCardSituation|ai-ask/.test(formOff),
  "as18 the New card cover gains the situation's box with its button hidden while the box is empty, nothing with no service"
    + " set, and a situation's draft fills it marked: two titles, two bodies and the category");
});

await block(async () => {
  const { S, P } = cardPage(SET);
  S.plan = { dir: "D", next: 2, lint: { errors: 0, warnings: 0, rows: [] }, langs: ["en", "pl"] };
  const none = P.page.__get("coverHtml")();
  S.aiDrafts = { dir: "D", drafts: [{ id: "d-1", job: "language", card: "c1", lang: "pl", fields: {} }, { id: "d-2", job: "situation", fields: {} }] };
  const two = P.page.__get("coverHtml")();
  const gates = (h) => Array.from(h.matchAll(/data-gate="([^"]*)"><span class="g (\w+)"/g), (m) => m[1] + ":" + m[2]).join(",");
  check(!/data-ai-waiting/.test(none) && /Drafts waiting to be accepted, not in this edition: 2/.test(textOf(two))
    && gates(two) === gates(none) && /langs:ok/.test(gates(two)),
  "as20 Publishing says the drafts waiting as information, two here, and every gate stands as it did without them: " + gates(two));
});

const JOB1 = [
  ["Split with the organisation's model", "Podział przez model organizacji"],
  ["Sends this text ({CHARS}) and the names of the categories and intents to {HOST}, model {MODEL}.", "Do {HOST}, model {MODEL}, trafi ten tekst ({CHARS}) oraz nazwy kategorii i intencji."],
  ["Sends the text of {FILE} ({CHARS}) and the names of the categories and intents to {HOST}, model {MODEL}.", "Do {HOST}, model {MODEL}, trafi tekst pliku {FILE} ({CHARS}) oraz nazwy kategorii i intencji."],
  ["Splitting…", "Dzielenie…"],
  ["Sends this text ({CHARS}), in {PARTS}, and the names of the categories and intents to {HOST}, model {MODEL}.", "Do {HOST}, model {MODEL}, trafi ten tekst ({CHARS}), podzielony na części: {N}, oraz nazwy kategorii i intencji."],
  ["Sends the text of {FILE} ({CHARS}), in {PARTS}, and the names of the categories and intents to {HOST}, model {MODEL}.", "Do {HOST}, model {MODEL}, trafi tekst pliku {FILE} ({CHARS}), podzielony na części: {N}, oraz nazwy kategorii i intencji."],
  ["Splitting… part {N} of {TOTAL}", "Dzielenie… część {N} z {TOTAL}"],
  ["{N} of {TOTAL} parts were sent before Cancel; the rest were not. Their cards are in the review queue.", "Przed anulowaniem wysłano części: {N} z {TOTAL}; pozostałych nie wysłano. Karty z nich są w kolejce do przeglądu."],
  ["This text is {CHARS}, and one import carries at most {MAX}, so nothing was sent. A shorter part of it can be brought in instead, or the whole of it split with Split into cards, which sends nothing.", "Ten tekst ma {CHARS}, a jeden import obejmuje najwyżej {MAX}, więc nic nie zostało wysłane. Zamiast tego można wczytać jego krótszą część albo podzielić całość przyciskiem Podziel na karty, który niczego nie wysyła."],
];
await block(async () => {
  const off = rowsOff(JOB1);
  check(off.length === 0, "as37 the " + JOB1.length + " rows of job 1 are the copywriter's, English and Polish" + (off.length ? "; OFF: " + JSON.stringify(off) : ""));
});
/* ---- as19, the Stage 4 words ------------------------------------------------------------------------------------- */
const STAGE4 = [
  ["Draft with the organisation's model", "Szkic przez model organizacji"],
  ["What happened, and what does the team do about it?", "Co się stało i co zespół z tym robi?"],
  ["Sends this card ({CHARS}) to {HOST}, model {MODEL}, with {CARDS} already written in that language as examples.",
    "Do {HOST}, model {MODEL}, trafi ta karta ({CHARS}), a jako przykłady karty już napisane w tym języku: {N}."],
  ["Sends the description ({CHARS}), {CARDS} from {CATEGORY} as examples, and the names of the categories and intents to {HOST}, model {MODEL}.",
    "Do {HOST}, model {MODEL}, trafi opis ({CHARS}), nazwy kategorii i intencji, a jako przykłady karty z kategorii {CATEGORY}: {N}."],
  ["Send", "Wyślij"], ["Drafting…", "Szkicowanie…"], ["model", "model"], ["other language", "drugi język"], ["new card", "nowa karta"],
  ["no source: written by the model", "bez źródła: napisane przez model"],
  ["Written by the model, not yet accepted", "Napisane przez model, jeszcze nie przyjęte"],
  ["Drafts waiting to be accepted, not in this edition: {N}", "Szkice czekające na przyjęcie, poza tym wydaniem: {N}"],
  ["Could not reach {HOST}, so nothing was drafted.", "Nie udało się połączyć z {HOST}, więc nic nie powstało."],
  ["{HOST} did not accept the key, so nothing was drafted.", "{HOST} nie przyjął klucza, więc nic nie powstało."],
  ["{HOST} is busy and asked for a pause, so nothing was drafted.", "{HOST} jest zajęty i poprosił o przerwę, więc nic nie powstało."],
  ["No answer came in time. The text was sent; nothing was added.", "Odpowiedź nie nadeszła na czas. Tekst został wysłany; nic nie dodano."],
  ["The answer could not be used. Nothing was added.", "Odpowiedzi nie dało się wykorzystać. Nic nie dodano."],
  ["{HOST} answered with an error, so nothing was drafted.", "{HOST} odpowiedział błędem, więc nic nie powstało."],
  ["Open Settings", "Otwórz Ustawienia"], ["Cancel", "Anuluj"], ["Accept", "Przyjmij"], ["Discard", "Odrzuć"], ["Try again", "Spróbuj ponownie"],
];
await block(async () => {
  const off = rowsOff(STAGE4);
  check(off.length === 0, "as19 the " + STAGE4.length + " rows of Stage 4 the page says are the copywriter's, English and Polish"
    + (off.length ? "; OFF: " + JSON.stringify(off) : ""));
});

/* ==== IMPORT IN PARTS (board 992; surfaces.md 1a, words-992-own-ai-2026-11-11) ========================= */
const P_REPLY = "We have received your returned item and processed the refund to your original payment method.\n\n";
const head20k = "Opening reply line.\n\n" + P_REPLY.repeat(Math.floor((20000 - 23) / P_REPLY.length));
const T20000 = head20k + "x".repeat(20000 - head20k.length);
const mid20k1 = "Opening reply line.\n\n" + "a".repeat(10000) + "\n\nSecond reply line.\n\n";
const T20001 = mid20k1 + "b".repeat(20001 - mid20k1.length);
const replies61k = [];
let cur61k = 0;
for (let i = 0; cur61k < 61300; i++) {
  const target = Math.min(1000, 61300 - cur61k);
  const head = "Customer reply " + i + ":\nWe assist with order " + i + ". ";
  const pad = "x".repeat(Math.max(0, target - head.length - 2));
  const rep = head + pad + "\n\n";
  replies61k.push(rep);
  cur61k += rep.length;
}
if (cur61k > 61300) {
  const diff = cur61k - 61300;
  replies61k[replies61k.length - 1] = replies61k[replies61k.length - 1].slice(0, -diff);
}
const T61300 = replies61k.join("");
const T200001 = "Too long text.\n\n" + "e".repeat(200001 - 16);

function answerPieceCards(b) {
  try {
    const doc = JSON.parse(b);
    const msgs = doc.messages || [];
    const text = (msgs[msgs.length - 1] && msgs[msgs.length - 1].content) || "";
    const matches = text.match(/Customer reply \d+:\n[^\n]+/g) || [];
    const cards = matches.map((m, i) => {
      const span = m.split("\n")[1];
      return {
        title: { en: "Reply " + i },
        category: "returns",
        categoryLabel: { en: "Returns" },
        intents: ["Asks for a refund"],
        bodies: [{ lang: "en", spans: [{ text: span }] }]
      };
    });
    if (cards.length) return chat(JSON.stringify({ cards }));
  } catch {}
  return chat(IMPORT_ANSWER);
}

await block(async () => {
  const l20k = await call(sh, "studio:ai-job-line", dir, "import", "", "", T20000, "");
  const l20k1 = await call(sh, "studio:ai-job-line", dir, "import", "", "", T20001, "");
  const l61k = await call(sh, "studio:ai-job-line", dir, "import", "", "", T61300, "");
  const { P } = cardPage(SET);
  const aiLineHtml = P.page.__get("aiLineHtml");
  const s20k = textOf(aiLineHtml("import", l20k.line || {})).replace(/ ([,.)])/g, "$1");
  const s20k1 = textOf(aiLineHtml("import", l20k1.line || {})).replace(/ ([,.)])/g, "$1");
  const s61k = textOf(aiLineHtml("import", l61k.line || {})).replace(/ ([,.)])/g, "$1");
  check(l20k.line && l20k.line.parts === 1 && l20k1.line && l20k1.line.parts === 2 && l61k.line && l61k.line.parts === 4
    && /Sends this text \(20,?000[\s\u00a0]characters\) and the names of the categories and intents to gateway\.example\.test, model m-7\./.test(s20k)
    && /Sends this text \(20,?001[\s\u00a0]characters\), in 2 parts, and the names of the categories and intents to gateway\.example\.test, model m-7\./.test(s20k1)
    && /Sends this text \(61,?300[\s\u00a0]characters\), in 4 parts, and the names of the categories and intents to gateway\.example\.test, model m-7\./.test(s61k),
  "as40 the line's part count equals importText's cut, for 20,000 (1), 20,001 (2) and 61,300 (4) characters");
});

let wasEvents = 0;
await block(async () => {
  const was = sh.sent.length;
  wasEvents = (sh.sentEvents || []).length;
  sh.answer((b) => answerPieceCards(b));
  const r = await call(sh, "studio:ai-job-send", dir, "import", "", "", T61300, "");
  const asks = sh.sent.length - was;
  check(!r.error && r.proposal && asks === 4,
  "as41 one Send makes exactly that many asks: 4 asks for 61,300 characters");
});

await block(async () => {
  const events = (sh.sentEvents || []).slice(wasEvents).filter((e) => e.ch === "studio:ai-import-progress");
  check(events.length === 4 && events[0].args[0].total === 4 && events[3].args[0].n === 4,
  "as42 the progress is told once per piece (" + events.length + " tell(s))");
});

await block(async () => {
  let askedCount = 0;
  sh.answer((b) => {
    askedCount++;
    if (askedCount === 2) {
      call(sh, "studio:ai-job-cancel", dir, "import");
    }
    return answerPieceCards(b);
  });
  const was = inboxNames();
  const r = await call(sh, "studio:ai-job-send", dir, "import", "", "", T61300, "");
  const asks = askedCount;
  const { S, door, ACTS } = importPage(SET, {
    aiJobSend: async () => r
  });
  S.wiz.pasteText = T61300;
  const b = btn("import", "", "");
  await ACTS["ai-ask"](b);
  await ACTS["ai-send"](b);
  await ACTS["ai-cancel"](b);
  const cancelledText = textOf(door()).replace(/\u00a0/g, " ").replace(/ ([,.)])/g, "$1");
  const wrote = inboxNames().filter((x) => was.indexOf(x) < 0);
  check(asks === 2 && r.proposal && wrote.some((x) => x.endsWith(".ec"))
    && /2 of 4 parts were sent before Cancel; the rest were not\. Their cards are in the review queue\./.test(cancelledText),
  "as43 Cancel after piece 2 of 4 makes no third ask, its line says 2 of 4, and the two answered pieces' proposals are in the queue");
});

await block(async () => {
  const was = sh.sent.length;
  const line = await call(sh, "studio:ai-job-line", dir, "import", "", "", T200001, "");
  const send = await call(sh, "studio:ai-job-send", dir, "import", "", "", T200001, "");
  const { S, door, ACTS } = importPage(SET, {
    aiJobLine: async () => line,
    aiJobSend: async () => send,
  });
  S.wiz.pasteText = T200001;
  const b = btn("import", "", "");
  await ACTS["ai-ask"](b);
  const ceilingText = textOf(door()).replace(/ ([,.)])/g, "$1");
  check(line.line === null && line.refused === "ceiling" && send.failed && send.failed.why === "ceiling" && send.failed.sent === false
    && sh.sent.length === was && /one import carries at most 200,?000[\s\u00a0]characters, so nothing was sent/.test(ceilingText),
  "as44 a text over AI_IMPORT_MAX makes no ask at all (0 request(s)) and shows the ceiling line");
});

await block(async () => {
  const p14pl3en = { pl: 14, en: 3 };
  const enPage = importPage(SET, {
    aiJobSend: async () => ({ error: null, draft: null, proposal: { file: "D/inbox/model-import.ec", name: "model-import.ec", cards: 17, byLang: p14pl3en }, failed: null }),
  }, "en");
  enPage.S.wiz.pasteText = "17 replies";
  await enPage.ACTS["ai-ask"](btn("import", "", ""));
  await enPage.ACTS["ai-send"](btn("import", "", ""));

  const plPage = importPage(SET, {
    aiJobSend: async () => ({ error: null, draft: null, proposal: { file: "D/inbox/model-import.ec", name: "model-import.ec", cards: 17, byLang: p14pl3en }, failed: null }),
  }, "pl");
  plPage.S.wiz.pasteText = "17 odpowiedzi";
  await plPage.ACTS["ai-ask"](btn("import", "", ""));
  await plPage.ACTS["ai-send"](btn("import", "", ""));

  /* Local split keeps today's bare line */
  const localEn = importPage(SET, {}, "en");
  localEn.S.wiz.pasteReplies = 17;
  localEn.S.wiz.pasteRead = true;
  const localEnMain = textOf(localEn.main());

  const localPl = importPage(SET, {}, "pl");
  localPl.S.wiz.pasteReplies = 17;
  localPl.S.wiz.pasteRead = true;
  const localPlMain = textOf(localPl.main());

  /* T() binds a count to the word before it with a no-break space, as everywhere in Studio: the words compare with it read
     as a plain space, so the product keeps its typography. */
  const plain = (said) => said.join().replace(/ /g, " ");
  check(plain(enPage.said) === "Replies found: 17 (Polish: 14, English: 3)"
    && plain(plPage.said) === "Znalezione odpowiedzi: 17 (polski: 14, angielski: 3)"
    && /Replies found:\s*17/.test(localEnMain) && !/Replies found:\s*17\s*\(/.test(localEnMain)
    && /Znalezione odpowiedzi:\s*17/.test(localPlMain) && !/Znalezione odpowiedzi:\s*17\s*\(/.test(localPlMain),
  "as45 after a model split Studio names the languages found and their reply counts in English (Polish: 14, English: 3) and Polish with lower-case names (polski: 14, angielski: 3); a local split keeps the bare line");
});

await block(async () => {
  const modelOpen = await Studio.openProposal(dir, imported.file);
  const { S, P, ACTS } = cardPage(SET, {
    proposalOpen: async () => modelOpen,
    proposals: async (d) => Studio.listProposals(d),
    proposalRevert: async (d, f, revs) => Studio.revertProposalMarks(d, f, revs),
    proposalDecide: async (d, f, decs, from, note) => Studio.decideProposal(d, f, decs, from, note),
    open: async (d) => Studio.openProject(d),
  });
  S.open.dir = dir;
  S.open.draft = JSON.parse(readDraft(dir));
  S.rv = { open: modelOpen, reverted: {}, list: [], inbox: path.join(dir, "inbox") };
  S.section = "proposals";
  const rvRow = P.page.__get("rvRow");
  const c = modelOpen.changes.find((x) => x.scope === "card" && x.op === "add" && x.id === "c-returns-return-label");
  const rowHtml = rvRow(c);

  /* A model-split proposal shows a language picker set to its language */
  const hasPicker = /data-act="rv-lang"/.test(rowHtml) && /<option value="en" selected>/.test(rowHtml);

  /* Changing it changes the language the proposal's text goes into when accepted. The table decides nothing since board 1016
     item 7 (it was the row's Accept and the table's Land): the picker writes the proposal at once, and the acceptance is the
     verb the stack's Apply calls (stkApply, proposalDecide) on the file as the picker left it. */
  await ACTS["rv-lang"]({ getAttribute: (k) => ({ "data-act": "rv-lang", "data-k": c.key })[k] || null, value: "pl" });
  await Studio.decideProposal(dir, modelOpen.file, { [c.key]: "accept" }, "The lead", null);
  const cardAfter = cardIn(dir, c.id) || {};

  /* A local-split proposal shows no new picker */
  const localEc = path.join(dir, "inbox", "local-no-model.ec");
  fs.writeFileSync(localEc, JSON.stringify({
    id: "local-no-model", rev: 1, langs: [{ code: "en" }],
    cards: [{ id: "c-local-1", shelf: returns, title: { en: "Local reply" }, body: { en: "Local body." }, bodyShape: "plain" }]
  }), "utf8");
  const localOpen = await Studio.openProposal(dir, localEc);
  S.rv.open = localOpen;
  const cLocal = localOpen.changes.find((x) => x.scope === "card" && x.op === "add");
  const localRow = rvRow(cLocal);

  check(hasPicker && c.cardLang === "pl" && cardAfter.body && cardAfter.body.pl === "We have sent you the return label."
    && cardAfter.title && cardAfter.title.pl === "Return label" && !cardAfter.body.en && !cardAfter.title.en
    && !/data-act="rv-lang"/.test(localRow),
  "as46 a model-split proposal shows a language picker set to its language; choosing another and accepting puts the text under the chosen language; a local-split proposal shows no new picker");
});

/* A MODEL CARD IN TWO LANGUAGES KEEPS BOTH (the test architect's hold on fold 25): no picker on its row, the act changes nothing,
   and the module refuses to move a language on it, to a language it holds, or to anything that is not a language code. */
await block(async () => {
  const biEc = path.join(dir, "inbox", "bi-model.ec");
  const biCard = { id: "c-bi-1", shelf: returns, title: { en: "Delay", pl: "Opóźnienie" },
    body: { en: "Your parcel is a day late.", pl: "Paczka spóźni się o jeden dzień." }, bodyShape: "plain" };
  fs.writeFileSync(biEc, JSON.stringify({ id: "bi-model", rev: 1, langs: [{ code: "en" }, { code: "pl" }], cards: [biCard] }), "utf8");
  fs.writeFileSync(path.join(dir, "inbox", "bi-model.lint.json"), JSON.stringify({ marks: [], splices: [] }), "utf8");
  const before = fs.readFileSync(biEc, "utf8");
  const biOpen = await Studio.openProposal(dir, biEc);
  biOpen.model = true;
  let wrote = 0;
  const { S, P, ACTS } = cardPage(SET, {
    proposalRevert: async (d, f, revs) => { wrote++; return Studio.revertProposalMarks(d, f, revs); },
  });
  S.open.dir = dir;
  S.rv = { open: biOpen, decided: {}, reverted: {}, list: [], inbox: path.join(dir, "inbox"), from: "The lead" };
  S.section = "proposals";
  const rvRow = P.page.__get("rvRow");
  const cBi = biOpen.changes.find((x) => x.scope === "card" && x.op === "add");
  const noPicker = !!cBi && !/data-act="rv-lang"/.test(rvRow(cBi));
  const langBefore = cBi && cBi.cardLang;
  if (cBi) await ACTS["rv-lang"]({ getAttribute: (k) => ({ "data-act": "rv-lang", "data-k": cBi.key })[k] || null, value: langBefore === "en" ? "pl" : "en" });
  const pageKept = !!cBi && cBi.cardLang === langBefore && cBi.to.body.en === biCard.body.en && cBi.to.body.pl === biCard.body.pl;
  const refused = async (revs) => { try { await Studio.revertProposalMarks(dir, biEc, revs); return ""; } catch (e) { return String(e.message || e); } };
  const twoLangs = await refused([{ card: "c-bi-1", lang: "en", toLang: "de", marks: [] }]);
  const overHeld = await refused([{ card: "c-bi-1", lang: "en", toLang: "pl", marks: [] }]);
  const notCode = await refused([{ card: "c-bi-1", lang: "en", toLang: "../x", marks: [] }]);
  const fileKept = fs.readFileSync(biEc, "utf8") === before;
  check(noPicker && pageKept && wrote === 0 && /en and pl/.test(twoLangs) && /en and pl|already has/.test(overHeld)
      && /no language code/.test(notCode) && fileKept,
    "as47 a model card in two languages keeps both: no picker on its row, the act moves nothing and writes nothing, and the module refuses a move on it ("
    + JSON.stringify([twoLangs.slice(0, 60), overHeld.slice(0, 60), notCode.slice(0, 60)]) + "), the file unchanged");
});

/* as48, Send sends what the person confirmed: if the policy address, example cards or import file changed between line and
   send, Send refuses with nothing sent and asks for a new line (review 18, finding 3). */
await block(async () => {
  const H = "HKEY_LOCAL_MACHINE\\SOFTWARE\\Policies\\Etiuda";
  const makePolicy = (ep) => [H, "    AiProvider    REG_SZ    compatible", "    AiEndpoint    REG_SZ    " + ep,
    "    AiModel    REG_SZ    m-7", "    AiKey    REG_SZ    org-k-18"].join("\r\n");
  const probeChanged = async (mainOverride) => {
    let policyText = makePolicy("https://gw-one.example.test/v1/");
    const sh3 = shellSection(() => policyText, mainOverride);
    const lone4 = (await Studio.addCard(dir, returns, "Late delivery", "Your parcel is late.")).card.id;
    const savedBefore = JSON.parse(readDraft(dir)).cards.find((c) => c.id === both[0]).body.en;

    sh3.answer(() => chat('{"title": "Spóźniona paczka", "body": "Paczka jest spóźniona."}'));
    const lPol = await call(sh3, "studio:ai-job-line", dir, "language", lone4, "pl", "", "");
    policyText = makePolicy("https://gw-two.example.test/v1/");
    const sPol = await call(sh3, "studio:ai-job-send", dir, "language", lone4, "pl", "", "");
    const polSentWhileStale = sh3.sent.length;
    const lPol2 = await call(sh3, "studio:ai-job-line", dir, "language", lone4, "pl", "", "");
    const sPol2 = await call(sh3, "studio:ai-job-send", dir, "language", lone4, "pl", "", "", lPol2.line && lPol2.line.stamp);

    sh3.answer(() => chat(JSON.stringify({ title: { en: "Delayed", pl: "Opóźnienie" },
      body: { en: "We check with the carrier.", pl: "Sprawdzamy u przewoźnika." }, category: "Returns", intents: [] })));
    const lEx = await call(sh3, "studio:ai-job-line", dir, "situation", "", "", "Parcel delayed at depot.", returns);
    await Studio.saveCard(dir, both[0], { body: { en: "Updated return label text." } });
    const nEx = sh3.sent.length;
    const sEx = await call(sh3, "studio:ai-job-send", dir, "situation", "", "", "Parcel delayed at depot.", returns);
    const exSentWhileStale = sh3.sent.length - nEx;
    const lEx2 = await call(sh3, "studio:ai-job-line", dir, "situation", "", "", "Parcel delayed at depot.", returns);
    const sEx2 = await call(sh3, "studio:ai-job-send", dir, "situation", "", "", "Parcel delayed at depot.", returns, lEx2.line && lEx2.line.stamp);

    const swapFile = path.join(SCRATCH, "swap-replies.txt");
    const FIRST_FILE = "First file reply: we send a new one.";
    const SECOND_FILE = "Other file reply: we issue a refund.";
    fs.writeFileSync(swapFile, FIRST_FILE, "utf8");
    CHOSEN.file = swapFile;
    sh3.answer(() => chat(JSON.stringify({ cards: [{ title: { en: "Refund" }, category: "returns", categoryLabel: { en: "Returns" },
      intents: [], bodies: [{ lang: "en", spans: [{ text: SECOND_FILE }] }] }] })));
    await call(sh3, "studio:ai-job-line", dir, "import", swapFile, "", "", "");
    fs.writeFileSync(swapFile, SECOND_FILE, "utf8");
    const nFile = sh3.sent.length;
    const sFile = await call(sh3, "studio:ai-job-send", dir, "import", swapFile, "", "", "");
    const fileSentWhileStale = sh3.sent.length - nFile;
    const lFile2 = await call(sh3, "studio:ai-job-line", dir, "import", swapFile, "", "", "");
    const sFile2 = await call(sh3, "studio:ai-job-send", dir, "import", swapFile, "", "", "", lFile2.line && lFile2.line.stamp);
    CHOSEN.file = "";
    await Studio.saveCard(dir, both[0], { body: { en: savedBefore } });
    return {
      ok: !lPol.error && lPol.line && lPol.line.host === "gw-one.example.test"
        && sPol.draft === null && sPol.failed && sPol.failed.why === "changed" && sPol.failed.sent === false && polSentWhileStale === 0
        && sPol2.draft && sh3.sent[0] && sh3.sent[0].to === "https://gw-two.example.test/v1/chat/completions"
        && !lEx.error && sEx.draft === null && sEx.failed && sEx.failed.why === "changed" && sEx.failed.sent === false && exSentWhileStale === 0
        && sEx2.draft && sh3.sent[1] && sh3.sent[1].body.indexOf("Updated return label text.") >= 0
        && sFile.proposal === null && sFile.failed && sFile.failed.why === "changed" && sFile.failed.sent === false && fileSentWhileStale === 0
        && sFile2.proposal && sh3.sent[2] && sh3.sent[2].body.indexOf(SECOND_FILE) >= 0,
      polSentWhileStale, exSentWhileStale, fileSentWhileStale,
    };
  };
  const r48 = await probeChanged();
  const pageStale = cardPage(SET, {
    aiJobLine: async () => ({ error: null, line: { host: "gateway.example.test", model: "m-7", service: "compatible", managed: false, chars: 100, examples: 1, category: "", refusal: null, stamp: "stamp-1" } }),
    aiJobSend: async (...a) => ({ error: null, draft: null, failed: { why: "changed", sent: false, host: "gateway.example.test", seenStamp: a[6] } }),
  });
  await pageStale.ACTS["ai-ask"](btn("language", "c1", "pl"));
  await pageStale.ACTS["ai-send"](btn("language", "c1", "pl"));
  const staleHtml = pageStale.editor();
  const stampPassed = pageStale.S.aiJob["language|c1|pl"] && pageStale.S.aiJob["language|c1|pl"].failed && pageStale.S.aiJob["language|c1|pl"].failed.seenStamp === "stamp-1";

  check(r48.ok && stampPassed && /What would be sent changed after the line was shown/.test(textOf(staleHtml)) && /data-act="ai-ask"/.test(staleHtml),
  "as48 changing policy address (" + r48.polSentWhileStale + "), example cards (" + r48.exSentWhileStale + ") or import file (" + r48.fileSentWhileStale
    + ") between line and send refuses with nothing sent until a new line is shown, and the page passes the stamp and asks for a new line");

  if (process.env.ETIUDA_PLANTS === "off") process.stdout.write("  NOT RUN as48p plant:ai-line-changed proof (ETIUDA_PLANTS=off)\n");
  else {
    const plantedMain = MAIN_TEXT.replace("if (shownStamp && got.stamp !== shownStamp) { /* plant:ai-line-changed */", "if (false) {");
    const pr48 = await probeChanged(plantedMain);
    check(plantedMain !== MAIN_TEXT && !pr48.ok && pr48.polSentWhileStale === 1 && pr48.exSentWhileStale === 1 && pr48.fileSentWhileStale === 1,
      "as48p plant: bypassing the stamp check in studio:ai-job-send turns as48 red with all three changed sends going out ("
      + pr48.polSentWhileStale + ", " + pr48.exSentWhileStale + ", " + pr48.fileSentWhileStale + ")");
  }
});

/* as49, policy key with no service named refuses the test and every job through shell/main.js, and shows the row sentences. */
await block(async () => {
  const H = "HKEY_LOCAL_MACHINE\\SOFTWARE\\Policies\\Etiuda";
  const sh4 = shellSection(() => [H, "    AiKey    REG_SZ    sk-test-0000"].join("\r\n"));
  const lone3 = (await Studio.addCard(dir, returns, "Unfinished", "We check the parcel.")).card.id;
  await call(sh4, "studio:ai-save", "anthropic", "", "claude-opus-5-5", "", false);
  const shown = await call(sh4, "studio:ai-settings");
  const testRes = await call(sh4, "studio:ai-test");
  const lineRes = await call(sh4, "studio:ai-job-line", dir, "language", lone3, "pl", "", "");
  const sendRes = await call(sh4, "studio:ai-job-send", dir, "language", lone3, "pl", "", "");
  const sitRes = await call(sh4, "studio:ai-job-send", dir, "situation", "", "", "Parcel delayed.", returns);
  const enHtml = textOf(settingsPage(shown, {}, "en").html());
  const plHtml = textOf(settingsPage(shown, {}, "pl").html());
  const REF_EN = "Not sent: the organisation set a key without naming its service.";
  const ROW_EN = "Your organisation has set a key for an AI service without naming the service, so nothing is sent. Its IT department can name it.";
  const ROW_PL = "Organizacja ustawiła klucz do usługi AI, ale nie wskazała tej usługi, więc nic nie jest wysyłane. Może ją wskazać dział IT organizacji.";
  check(sh4.sent.length === 0 && shown.keyNoService === true && shown.hasKey === false && shown.ready === false
    && testRes.error === REF_EN && testRes.said && testRes.said.frame === REF_EN
    && lineRes.line && lineRes.line.refusal && lineRes.line.refusal.message === REF_EN
    && sendRes.failed && sendRes.failed.why === "unset" && sendRes.failed.sent === false && sendRes.failed.said && sendRes.failed.said.frame === REF_EN
    && sitRes.failed && sitRes.failed.why === "unset" && sitRes.failed.sent === false && sitRes.failed.said && sitRes.failed.said.frame === REF_EN
    && enHtml.indexOf(ROW_EN) >= 0 && plHtml.indexOf(ROW_PL) >= 0 && enHtml.indexOf("What a job sends goes to") < 0,
  "as49 shell AI channels refuse studio:ai-test, studio:ai-job-line and studio:ai-job-send with no request (" + sh4.sent.length
    + "), and Settings shows the row sentences in English and Polish");
});

/* as50 and as51 (Studio fold 96's cover and save mends; the test architect's drafts, junior dd, 2026-11-22 17:32): what a lead
   typed is not lost to a model's answer. */
/* A node of the stand-in given the fields of the markup last written to it, each holding a value typed until the page writes the
   markup again, as a browser's would; the document finds the ones with an id. Only these two legs need it. */
const unent = (s) => String(s).replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
function liveFields(P, sel) {
  const el = P.node(sel), doc = P.doc;
  let html = "";
  const parse = () => Array.from(html.matchAll(/<(input|select)\b([^>]*)>|<textarea\b([^>]*)>([\s\S]*?)<\/textarea>/g), (m) => {
    const attrs = {}; for (const a of (m[2] || m[3]).matchAll(/([\w-]+)(?:="([^"]*)")?/g)) attrs[a[1]] = unent(a[2] || "");
    return { id: attrs.id || "", attrs, value: m[3] != null ? unent(m[4]) : m[1] === "input" ? attrs.value || "" : "",
      getAttribute(k) { return k in this.attrs ? this.attrs[k] : null; }, hasAttribute(k) { return k in this.attrs; },
      previousElementSibling: null, focus() {}, closest() { return null; } };
  });
  for (const k of ["innerHTML", "outerHTML"]) Object.defineProperty(el, k, { get: () => html, set: (v) => { html = String(v); el.fields = parse(); }, configurable: true });
  el.fields = [];
  el.querySelectorAll = (s) => (/\[id\]/.test(s) ? el.fields.filter((f) => f.id) : []);
  const q = doc.querySelector.bind(doc), byId = doc.getElementById;
  doc.getElementById = (id) => el.fields.find((f) => f.id === id) || (byId ? byId(id) : null);
  doc.querySelector = (s) => { const m = /^#([\w-]+)$/.exec(s); return (m && el.fields.find((f) => f.id === m[1])) || q(s); };
  return (pick) => el.fields.find(pick) || null;
}
const typeIn = (P, f, v) => { f.value = v; P.doc.heard.filter((h) => h.type === "input").forEach((h) => h.fn({ target: f })); };
const later = () => { let res; const p = new Promise((r) => { res = r; }); return { p, res }; };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/* Each leg is a function of the page's source, so a plant can run the same leg on a source with one deciding line made void. */
async function as50run(source) {
  const sent = later();
  const { S, P, ACTS } = cardPage(SET, { aiJobSend: async () => sent.p, aiDraftDiscard: async () => ({ error: null, drafts: [] }) }, "en", source);
  const field = liveFields(P, "#dlg"), byId = (id) => field((f) => f.id === id);
  S.cover = "card"; S.coverKind = "plain"; S.err = null;
  P.page.__get("paintCover")();
  typeIn(P, byId("newCard"), "Parcel arrived damaged");
  typeIn(P, byId("newCardSituation"), "The parcel came crushed; the team sends a replacement.");
  S.aiJob["situation||"] = { state: "line", line: { host: "gateway.example.test", model: "m-7", chars: 54, examples: 0 }, words: S.aiSituation, shelf: "returns" };
  const going = ACTS["ai-send"](btn("situation", "", ""));
  typeIn(P, byId("newCardBody"), "We are sorry. A replacement leaves today.");
  sent.res({ error: null, draft: { id: "d-9", job: "situation", fields: { title: { en: "Damaged parcel" }, body: { en: "Model words." }, shelf: "returns", requests: [] } } });
  await going;
  const drafted = P.node("#dlg").innerHTML.indexOf('data-ai-d="title"') >= 0;
  await ACTS["ai-discard"]({ getAttribute: (k) => (k === "data-draft" ? "d-9" : null) });
  const t = byId("newCard"), b = byId("newCardBody");
  return { drafted, ok: !!(drafted && t && b && t.value === "Parcel arrived damaged" && b.value === "We are sorry. A replacement leaves today."),
    said: "title " + JSON.stringify(t && t.value) + ", text " + JSON.stringify(b && b.value) };
}
async function as51run(source) {
  const sent = later(), saves = [];
  let disk = { en: "We refund within five days." };
  const answer = (patch) => { disk = Object.assign({}, disk, (patch.body || {})); return { error: null, edited: true, counts: {}, lint: { errors: 0, warnings: 0 }, awaiting: 0,
    card: { id: "c1", shelf: "returns", title: { en: "Late refund" }, body: Object.assign({}, disk) } }; };
  const { S, P, ACTS } = cardPage(SET, { aiJobSend: async () => sent.p,
    saveCard: (dir, id, patch) => { const d = later(); saves.push({ patch, d }); return d.p; } }, "en", source);
  const field = liveFields(P, "#cardEditor"), en = () => field((f) => f.attrs["data-f"] === "body" && f.attrs["data-l"] === "en");
  P.node("#cardEditor").outerHTML = P.page.__get("editorHtml")(P.page.__get("cardById")("c1"));
  S.aiJob["language|c1|pl"] = { state: "line", line: { host: "gateway.example.test", model: "m-7", chars: 27, examples: 0 }, words: "", shelf: "" };
  const going = ACTS["ai-send"](btn("language", "c1", "pl"));
  typeIn(P, en(), "We refund within five days. A");
  await wait(420);                                    /* the 350 ms pause: save 1 goes with "... A" */
  typeIn(P, en(), "We refund within five days. A B");  /* typed while save 1 is out */
  saves[0].d.res(answer(saves[0].patch));
  await wait(5);
  sent.res({ error: null, draft: { id: "d-1", job: "language", card: "c1", lang: "pl", fields: { body: { pl: "Zwrot w pięć dni." } } } });
  await going;
  typeIn(P, en(), en().value + "x");
  await wait(420);
  for (let i = 0; i < 5 && saves.some((s) => !s.done); i++) { saves.filter((s) => !s.done).forEach((s) => { s.done = true; s.d.res(answer(s.patch)); }); await wait(5); }
  return { ok: disk.en === "We refund within five days. A Bx", said: JSON.stringify(disk.en) };
}
await block(async () => {
  const r = await as50run();
  check(r.ok, "as50 a situation's draft arriving on the New card cover, then Discard, gives back the title and the text typed in the cover: "
    + r.said + " (the draft was on the cover: " + r.drafted + ")");
});
await block(async () => {
  const r = await as51run();
  check(r.ok, "as51 a language's draft landing after a save answered and before the newer typing is saved keeps that typing in the field and on"
    + " disk: " + r.said);
});
/* as50p, as51p: each deciding line made void turns its own leg red, and no other. A line is found by its plant mark and replaced whole. */
{
  const LINES = fs.readFileSync(path.join(ROOT, "ui", "app.js"), "utf8").split("\n");
  const plant = (mark, to) => {
    const at = LINES.map((l, i) => (l.indexOf("/* plant:" + mark + " */") >= 0 ? i : -1)).filter((i) => i >= 0);
    if (at.length !== 1) return null;
    const out = LINES.slice(); out[at[0]] = to; return out.join("\n");
  };
  const PLANTS = [
    { mark: "nc-hold", to: "      if (ncDrafted()) void 0;", red: "as50", green: "as51" },
    { mark: "nc-back", to: "      else if (ncHeld) ncHeld = null;", red: "as50", green: "as51" },
    { mark: "save-keeps-typing", to: "      if (newer) void 0;", red: "as51", green: "as50" },
  ];
  const RUN = { as50: as50run, as51: as51run };
  for (const pl of PLANTS) {
    await block(async () => {
      if (process.env.ETIUDA_PLANTS === "off") { process.stdout.write("  NOT RUN " + pl.red + "p plant:" + pl.mark + " proof (ETIUDA_PLANTS=off)\n"); return; }
      const src = plant(pl.mark, pl.to);
      const red = src ? await RUN[pl.red](src) : null, green = src ? await RUN[pl.green](src) : null;
      check(!!src && !red.ok && green.ok, pl.red + "p plant:" + pl.mark + " made void turns " + pl.red + " red (" + (red && red.said) + ") and leaves " + pl.green
        + " green (" + (green && green.ok) + ")");
    });
  }
}

dropScratch(SCRATCH, "tests/ai-surfaces.mjs");
process.stdout.write("ai-surfaces: " + asserted + " assertion(s), " + failed + " failure(s)\n");
process.exit(failed ? 1 : 0);
