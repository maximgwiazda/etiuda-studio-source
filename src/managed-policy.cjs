"use strict";
/* WHAT AN ORGANISATION SET FOR A MANAGED INSTALLATION (decision 49, held for Max's ruling). Six machine policy values of the key
 * HKLM\SOFTWARE\Policies\Etiuda, the key's own (never a subkey's), names compared without case, read from the text of reg query
 * (src/ai-policy.cjs aiPolicyText, the shell's one read of the key) and never written. The desk reads the same six from reg
 * export's text by the same rules, so one machine gives both apps one answer.
 *
 * THE CRITERION, Claude alpha's words: "a large company's IT decides, in tools it already uses and without touching each computer,
 * who may use Etiuda, in which role and with which account, and an ordinary user on a managed computer is shown nothing to buy,
 * try, switch or administer; a small company and a person on their own notice nothing." With none of the six set, `any` is false
 * and every surface and request is today's, byte for byte.
 *
 * Pure: no file, process or network is touched here. */

const NAMES = { managed: "managed", sharedcomputer: "shared", allowpersonalaccounts: "personal", signinprovider: "provider",
  signintenant: "tenant", supportcontact: "contact" };
const STRING_TYPES = ["REG_SZ", "REG_EXPAND_SZ"];
const GUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
/* A Google Workspace domain: labels of letters, digits and inner hyphens, at least two, 4 to 253 characters in all. */
const DOMAIN = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/i;
const CONTACT_MAX = 200;
const CONTROL = /[\u0000-\u001f\u007f-\u009f]/;
/* The personal Microsoft account tenant (Microsoft's ID token claims reference): a token from it is a personal account. */
const MSA_TENANT = "9188040d-6c67-4c5b-b112-36a304b66dad";

/** The answer with nothing set: what every surface reads as today's. */
const NONE = Object.freeze({ any: false, managed: false, shared: false, personal: true, provider: "", tenant: "", closed: false, contact: "" });

/* A switch's value: off where empty, 0 or reg's 0x0..., on otherwise, whatever its type. */
const offValue = (v) => v === "" || v === "0" || /^0x0+$/i.test(v);

/** The kind of a tenant value: "microsoft" for a GUID, "google" for a domain, "" for anything else. */
function tenantKind(v) {
  if (GUID.test(v)) return "microsoft";
  return v.length >= 4 && v.length <= 253 && DOMAIN.test(v) ? "google" : "";
}

/** {any, managed, shared, personal, provider, tenant, closed, contact} from reg query's text of the key; NONE where it holds none
 *  of the six. `closed` is a pin that cannot be honoured (a bad provider or tenant, or the two disagreeing): then no provider at all
 *  is offered, which is failing closed. */
function managedPolicyFrom(text) {
  const raw = {};
  let own = false;
  for (const line of String(text || "").split(/\r?\n/)) {
    /* reg query heads the key's own values with the key's name and a subkey's with the subkey's: only the key's own are read. */
    if (/^HKEY_/i.test(line)) { own = /^HKEY_LOCAL_MACHINE\\SOFTWARE\\Policies\\Etiuda$/i.test(line.trim()); continue; }
    const m = own ? /^ {4}(\S(?:.*?\S)?) {4}(REG_[A-Z_]+)(?: {4}(.*))?$/.exec(line) : null; /* plant:mp-own */
    if (!m) continue;
    const field = NAMES[m[1].toLowerCase()];
    if (field) raw[field] = { type: m[2], value: String(m[3] || "").trim() };
  }
  const has = (k) => Object.prototype.hasOwnProperty.call(raw, k);
  const str = (k) => has(k) && STRING_TYPES.indexOf(raw[k].type) >= 0;
  const managed = has("managed") && !offValue(raw.managed.value); /* plant:mp-managed */
  const shared = has("shared") && !offValue(raw.shared.value);
  /* AllowPersonalAccounts has three states: unset (absent or empty) follows Managed, 0 is false, anything else true. */
  const personalSet = has("personal") && raw.personal.value !== "";
  const personal = personalSet ? !offValue(raw.personal.value) : !managed; /* plant:mp-personal */
  let provider = "", providerBad = false;
  if (has("provider")) {
    const v = raw.provider.value.toLowerCase();
    if (str("provider") && (v === "microsoft" || v === "google")) provider = v; else providerBad = true; /* plant:mp-provider */
  }
  let tenant = "", tenantBad = false, kind = "";
  if (has("tenant")) {
    const v = raw.tenant.value;
    kind = str("tenant") ? tenantKind(v) : "";
    if (kind) tenant = v.toLowerCase(); else tenantBad = true; /* plant:mp-tenant */
  }
  /* SupportContact: shown as written, never a link; any other form is ignored, as if unset, and then counts for nothing. */
  let contact = "";
  if (str("contact")) {
    const v = raw.contact.value, n = Array.from(v).length;
    if (n >= 1 && n <= CONTACT_MAX && !CONTROL.test(v)) contact = v; /* plant:mp-contact */
  }
  const closed = providerBad || tenantBad || (!!provider && !!tenant && kind !== provider); /* plant:mp-closed */
  const any = has("managed") || has("shared") || has("personal") || has("provider") || has("tenant") || contact !== "";
  if (!any) return NONE;
  return Object.freeze({ any: true, managed, shared, personal, provider: provider || kind, tenant, closed, contact });
}

module.exports = { managedPolicyFrom, tenantKind, NONE, MSA_TENANT };
