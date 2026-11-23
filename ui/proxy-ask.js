/* A COMPANY PROXY'S QUESTION FOR A USER NAME AND PASSWORD, asked where Chromium could not answer the proxy with the Windows
 * account (src/wire.cjs, A COMPANY PROXY). One question at a time in the family's paper bubble, centred on the window, the rest
 * waiting by id; an id already held changes nothing, since the page asks for every open question as it loads.
 *
 * WHAT IS TYPED GOES TO THE SHELL AND NOWHERE ELSE: never stored, logged or kept in this page, and both fields are emptied as the
 * question closes. An empty user name is "Not now", and the password goes with an answer only when there is a name. The words
 * are ui/app.js's (proxyAskWords), handed in at each opening, so the table and its legs read them where they read every other.
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.StudioProxyAsk = factory();
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  /** `o.doc` the document, `o.host` the bridge (onProxyAsk, proxyAsks, proxyAnswer), `o.words()` the six words in the
   *  interface's language: {title, again, user, pass, no, yes}, `o.hang(el)`, where given, what hangs the question from its
   *  origin. Answers {take, shown} once wired, or null with no bridge. */
  function wire(o) {
    const doc = o && o.doc, host = o && o.host;
    if (!doc || !host || typeof host.onProxyAsk !== "function" || typeof host.proxyAnswer !== "function") return null;
    const queue = new Map();
    let shown = 0;

    function take(q) {
      const id = q && Number.isInteger(q.id) && q.id > 0 ? q.id : 0;
      if (!id || queue.has(id)) return;
      queue.set(id, { id, host: q && typeof q.host === "string" ? q.host : "", port: q && Number.isInteger(q.port) && q.port > 0 && q.port < 65536 ? q.port : 0, again: !!q && q.again === true });
      if (!shown) next();
    }
    function next() {
      const q = queue.values().next().value;
      shown = q ? q.id : 0;
      if (q) open(q);
    }
    function send(id, username, password) {
      queue.delete(id);
      try { Promise.resolve(host.proxyAnswer(id, username, password)).catch(() => {}); } catch { /* the shell has gone */ }
      next();
    }
    /* A field the person is typing in keeps the keyboard: a question arriving mid-sentence would otherwise take the rest of that
       sentence, and Enter would send it to the proxy as a user name. */
    function typing() {
      const a = doc.activeElement;
      return !!(a && (a.tagName === "INPUT" || a.tagName === "TEXTAREA" || a.tagName === "SELECT" || a.isContentEditable));
    }
    function el(tag, attrs, text) {
      const e = doc.createElement(tag);
      Object.keys(attrs || {}).forEach((k) => e.setAttribute(k, attrs[k]));
      if (text != null) e.textContent = String(text);
      return e;
    }
    function open(q) {
      const w = (typeof o.words === "function" && o.words()) || {};
      const wrap = el("div", { class: "bub paper s-proxy-ask", "data-side": "none", role: "dialog", "aria-modal": "true", "aria-labelledby": "sProxyTitle" });
      wrap.id = "sProxyAsk";
      wrap.appendChild(el("h3", { id: "sProxyTitle" }, w.title || ""));
      wrap.appendChild(el("p", { class: "s-proxy-at mono" }, q.host + (q.port ? ":" + q.port : "")));
      if (q.again) wrap.appendChild(el("p", { class: "s-proxy-again" }, w.again || ""));
      const user = el("input", { class: "field", id: "sProxyUser", type: "text", autocomplete: "off", spellcheck: "false", placeholder: w.user || "", "aria-label": w.user || "" });
      const pass = el("input", { class: "field", id: "sProxyPass", type: "password", autocomplete: "off", spellcheck: "false", placeholder: w.pass || "", "aria-label": w.pass || "" });
      wrap.appendChild(user);
      wrap.appendChild(pass);
      const acts = el("div", { class: "s-proxy-acts" });
      const no = el("button", { type: "button", class: "btn", id: "sProxyNo" }, w.no || "");
      const yes = el("button", { type: "button", class: "btn solid", id: "sProxyYes" }, w.yes || "");
      acts.appendChild(no);
      acts.appendChild(yes);
      wrap.appendChild(acts);
      doc.body.appendChild(wrap);
      if (typeof o.hang === "function") { try { o.hang(wrap); } catch { /* it stays centred */ } }
      let done = false;
      const answer = (name, word) => {
        if (done) return;
        done = true;
        user.value = ""; pass.value = ""; /* plant:sp-ask-empty */
        try { wrap.remove(); } catch { /* already gone */ }
        send(q.id, name, word);
      };
      const signIn = () => { const name = String(user.value || "").trim(); answer(name, name ? String(pass.value || "") : ""); }; /* plant:sp-ask-name-first */
      const notNow = () => answer("", "");
      wrap.addEventListener("keydown", (e) => {
        if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); notNow(); return; } /* plant:sp-ask-escape */
        if (e.key === "Enter" && (e.target === user || e.target === pass)) { e.preventDefault(); e.stopPropagation(); signIn(); }
      });
      yes.addEventListener("click", signIn);
      no.addEventListener("click", notNow);
      if (!typing()) { try { user.focus(); } catch { /* not focusable yet */ } } /* plant:sp-ask-keyboard */
    }

    host.onProxyAsk(take);
    /* Every question already open, asked for once wired: one asked before this page loaded waits for it. */
    try { Promise.resolve(typeof host.proxyAsks === "function" ? host.proxyAsks() : null).then((list) => { if (Array.isArray(list)) list.forEach(take); }, () => {}); } catch { /* the shell has gone */ }
    return { take, shown: () => shown };
  }

  return { wire };
});
