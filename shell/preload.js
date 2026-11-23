"use strict";
/* THE ONLY DOOR BETWEEN THE PAGE AND THE DISK. contextIsolation and sandbox are both on in the
 * window, so the page has no node at all and reaches the file system through the named calls
 * below and through nothing else. Every one of them is a verb the screens actually perform;
 * there is no general "read this path", because a bridge that can read any path is a bridge
 * whose safety depends on the page rather than on the shell.
 *
 * EVERYTHING CROSSES AS DATA. An object handed over the bridge arrives as a proxy the page
 * cannot copy or extend, so each call returns whatever ipcRenderer.invoke resolves to, which
 * Electron has already structured-cloned, and the page owns what it gets.
 *
 * THE PAGE'S VALUES GO THROUGH UNCHANGED. The main process checks, coerces or refuses every
 * argument in its own handler, so this file does not shape them again. The one exception is a
 * dropped file's path, which only this process can read off the File.
 */
const { contextBridge, ipcRenderer, webUtils } = require("electron");

contextBridge.exposeInMainWorld("STUDIO", {
  host: () => ipcRenderer.invoke("studio:host"),
  signing: () => ipcRenderer.invoke("studio:signing"),
  /* The About's two doors: the agreement's text in one of two languages, and the maker's link,
     which hands over no address (shell/main.js says which it opens). */
  agreement: (lang) => ipcRenderer.invoke("studio:agreement", lang),
  maker: () => ipcRenderer.send("studio:maker"),

  minimize: () => ipcRenderer.send("studio:window", "minimize"),
  maximize: () => ipcRenderer.send("studio:window", "maximize"),
  close: () => ipcRenderer.send("studio:window", "close"),
  zoom: (how) => ipcRenderer.send("studio:zoom", how),
  onMaximized: (fn) => ipcRenderer.on("studio:maximized", (_e, v) => fn(v)),
  onTrayGo: (fn) => ipcRenderer.on("studio:tray-go", (_e, v) => fn(v)),
  onOpenDir: (fn) => ipcRenderer.on("studio:open-dir", (_e, dir) => fn(dir)),
  onTask: (fn) => ipcRenderer.on("studio:task", (_e, task) => fn(task)),

  setLoginItem: (on) => ipcRenderer.invoke("studio:login-item-set", on),
  setClosePolicy: (quit) => ipcRenderer.invoke("studio:close-policy-set", quit),
  setNotifications: (on) => ipcRenderer.invoke("studio:notifications-set", on),
  setTrayBadge: (on) => ipcRenderer.invoke("studio:tray-badge-set", on),
  setTrayBubble: (on) => ipcRenderer.invoke("studio:tray-bubble-set", on),
  setNotifyProposals: (on) => ipcRenderer.invoke("studio:notify-proposals-set", on),
  setNotifyRequests: (on) => ipcRenderer.invoke("studio:notify-requests-set", on),

  theme: (v) => ipcRenderer.invoke("studio:theme", v),

  projects: () => ipcRenderer.invoke("studio:projects"),
  rowFacts: (dir) => ipcRenderer.invoke("studio:row-facts", dir),
  teams: () => ipcRenderer.invoke("studio:teams"),
  pickRoot: (title) => ipcRenderer.invoke("studio:pick-root", title),
  uiLang: (v) => ipcRenderer.invoke("studio:ui-lang", v),
  /* The tour's three remembered values (board 720). An object rather than three calls, because
     skipping writes two of them at once and two round trips could be interrupted between. */
  tour: (v) => ipcRenderer.invoke("studio:tour", v),
  /* The projects open in the band and the one on screen, sent whole at every change. */
  tabs: (v) => ipcRenderer.invoke("studio:tabs", v),
  pickFolder: (title) => ipcRenderer.invoke("studio:pick-folder", title),
  newProject: (name, langs, opts) => ipcRenderer.invoke("studio:new", name, langs, opts),
  /* A closed tab's project, removed only where "+" made it and nobody touched it (src/studio.mjs discardUntouched). */
  discardUntouched: (dir) => ipcRenderer.invoke("studio:discard-untouched", dir),
  clearLocalMemory: () => ipcRenderer.invoke("studio:clear-local-memory"),
  clearLocalMemoryUndo: () => ipcRenderer.invoke("studio:clear-local-memory-undo"),
  maintenance: () => ipcRenderer.invoke("studio:maintenance"),
  prefs: (patch) => ipcRenderer.invoke("studio:prefs", patch),
  shortcuts: (raw) => ipcRenderer.invoke("studio:shortcuts", raw),
  resetDefaults: () => ipcRenderer.invoke("studio:reset-defaults"),

  open: (dir) => ipcRenderer.invoke("studio:open", dir), /* plant:txic-preload */
  saveCard: (dir, id, patch) => ipcRenderer.invoke("studio:save-card", dir, id, patch),
  setFolder: (dir, folder) => ipcRenderer.invoke("studio:set-folder", dir, folder),
  importPick: (title, kinds) => ipcRenderer.invoke("studio:import-pick", title, kinds),
  importPlan: (file, override, into) => ipcRenderer.invoke("studio:import-plan", file, override, into),
  importLand: (file, override, into, fingerprint) => ipcRenderer.invoke("studio:import-land", file, override, into, fingerprint),
  /* The paste's plain text and its HTML, as the clipboard offered them. The shell writes the
     CSV. Neither argument is turned into a string here, so a value keeps its shape until the
     shell reads it (tests/ipc-coerce.mjs). */
  importPaste: (plain, html) => ipcRenderer.invoke("studio:import-paste", plain, html),
  /* A file dropped on the window (board 862). Its path is read here off the File the drop carried,
     because webUtils answers a File only in this process, and the shell keeps that path as the import's choice. */
  importDropped: (file) => {
    let at = "";
    try { at = webUtils.getPathForFile(file); } catch (e) { at = ""; }
    return ipcRenderer.invoke("studio:import-dropped", String(at || ""));
  },

  proposals: (dir) => ipcRenderer.invoke("studio:proposals", dir),
  /* The Desks screen (board 834): what the folder's team says, Sealed or Plain, and the desks asking to join, each change
     signed by the key the operating system keeps, so nothing here carries a passphrase. */
  desks: (dir) => ipcRenderer.invoke("studio:desks", dir),
  teamSealed: (dir, sealed, fresh) => ipcRenderer.invoke("studio:team-sealed", dir, sealed, fresh),
  /* A team first made on the Etiuda relay (board 926): the other choice beside a shared folder. It carries the project and nothing
     else; the reply holds no path, address or relay team id. */
  teamRelay: (dir) => ipcRenderer.invoke("studio:team-relay", dir),
  /* A catalog with no team joins a sealed team this Studio leads (board 962 stage 5, T3 and T5): the project and the team id, the
     cover's third choice and the Teams screen's Add a catalog to this team the callers. */
  teamChoose: (dir, teamId) => ipcRenderer.invoke("studio:team-choose", dir, teamId),
  teamEnd: (teamId) => ipcRenderer.invoke("studio:team-end", teamId),
  teamLeave: (dir, teamId, catalog) => ipcRenderer.invoke("studio:team-leave", dir, teamId, catalog),
  teamLetGo: (dir) => ipcRenderer.invoke("studio:team-let-go", dir),
  teamMoveCatalog: (dir, teamId) => ipcRenderer.invoke("studio:team-move-catalog", dir, teamId),
  teamHandover: (dir, why) => ipcRenderer.invoke("studio:team-handover", dir, why),
  deskRefuse: (dir, id) => ipcRenderer.invoke("studio:desk-refuse", dir, id),
  memberRemove: (dir, team, member, confirm) => ipcRenderer.invoke("studio:member-remove", dir, team, member, confirm),
  seatFree: (dir, desk) => ipcRenderer.invoke("studio:seat-free", dir, desk),
  teamExports: (dir, sealed) => ipcRenderer.invoke("studio:team-exports", dir, sealed),
  teamSharing: (dir, on) => ipcRenderer.invoke("studio:team-sharing", dir, on),
  /* Invitations (board 885, S2): made, copied and cancelled by the shell, the link going to the
     clipboard from there and never to the page (a desk that proves one is let in by the shell's watch, with no press);
     and the watch telling the page that a team's folder moved. */
  inviteMake: (dir, name, person) => ipcRenderer.invoke("studio:invite-make", dir, name, person),
  inviteCopy: (dir, id, form) => ipcRenderer.invoke("studio:invite-copy", dir, id, form),
  inviteCancel: (dir, id, confirm) => ipcRenderer.invoke("studio:invite-cancel", dir, id, confirm),
  /* The Desks line's own key move, and the dismiss of one refused attempt. Neither cancels an invitation. */
  teamKeyMove: (dir) => ipcRenderer.invoke("studio:team-key-move", dir),
  triedDismiss: (dir, id, desk) => ipcRenderer.invoke("studio:tried-dismiss", dir, id, desk),
  /* For the IT department (sense pass finding 17): the desk's Group Policy template saved, filled in with the lead's
     key, into a folder the shell asks for; or the value put on the clipboard by the shell. */
  policySave: (dir, title) => ipcRenderer.invoke("studio:policy-save", dir, title),
  policyCopy: (dir) => ipcRenderer.invoke("studio:policy-copy", dir),
  /* The catalog a joined desk has loaded (board 890): the lead asks for it, or takes the ask back.
     The pin is read in the shell. These two pass the folder and the desk through as they came. */
  catalogImport: (dir, desk) => ipcRenderer.invoke("studio:catalog-import", dir, desk),
  catalogWithdraw: (dir, desk) => ipcRenderer.invoke("studio:catalog-withdraw", dir, desk),
  /* A working copy the team does not list (board 962, stage 3). The shell judges the switch and the copy again. */
  copyImport: (dir, desk, ref) => ipcRenderer.invoke("studio:copy-import", dir, desk, ref),
  onTeamMoved: (fn) => ipcRenderer.on("studio:team-moved", (_e, folder) => fn(folder)),
  /* The signing key (K4 to K8): made here and kept by the operating system; a backup copy under a passphrase typed for it;
     a copy picked and read for its key, then restored by its passphrase. */
  keyMake: () => ipcRenderer.invoke("studio:key-make"),
  keyAside: () => ipcRenderer.invoke("studio:key-aside"),
  keyBackup: (passphrase, title, kind) => ipcRenderer.invoke("studio:key-backup", passphrase, title, kind),
  keyRestorePick: (title, kind) => ipcRenderer.invoke("studio:key-restore-pick", title, kind),
  keyRestore: (file, passphrase) => ipcRenderer.invoke("studio:key-restore", file, passphrase),
  removeSigningKey: () => ipcRenderer.invoke("studio:key-remove"),
  resetStudio: () => ipcRenderer.invoke("studio:reset"),
  resetAgain: () => ipcRenderer.invoke("studio:reset-again"),
  resetStop: () => ipcRenderer.invoke("studio:reset-stop"),
  /* The licence service (board 936, S6): what this Studio holds, and the quiet check at once. The shell signs and judges. */
  licence: () => ipcRenderer.invoke("studio:licence"),
  licenceCheck: () => ipcRenderer.invoke("studio:licence-check"),
  /* Sign-in (board 980): the provider's name alone; the shell opens the browser, and no token ever comes back here. */
  licenceSignIn: (provider) => ipcRenderer.invoke("studio:licence-signin", provider),
  licenceSignInStop: () => ipcRenderer.invoke("studio:licence-signin-stop"),
  licenceSignInAgain: () => ipcRenderer.invoke("studio:licence-signin-again"),
  /* The provider's page of the sign-in this page pressed, while it waits; the page takes only an https string (signInLinkTook). */
  onSignInLink: (fn) => ipcRenderer.on("studio:signin-link", (_e, link) => fn(link)),
  /* A company proxy's question for a user name and password, {id, host, port, again}; the open ones asked for as the page loads;
     the page's answer by id, an empty user name being "Not now". The shell judges each; nothing is kept on this side. */
  onProxyAsk: (fn) => ipcRenderer.on("studio:proxy-ask", (_e, q) => fn(q)),
  proxyAsks: () => ipcRenderer.invoke("studio:proxy-asks"),
  proxyAnswer: (id, username, password) => ipcRenderer.invoke("studio:proxy-answer", id, username, password),
  /* Settings, Account (board 980): sign out on this computer and the door's Not now. */
  licenceSignOut: () => ipcRenderer.invoke("studio:licence-signout"),
  signinDoorClose: () => ipcRenderer.invoke("studio:signin-door"),
  /* The owner's lead seats (decision 15), each by the person's pseudonym, never a code (board 1017); one freed. */
  licenceSeats: () => ipcRenderer.invoke("studio:licence-seats"),
  licenceSeatFree: (person) => ipcRenderer.invoke("studio:licence-seat-free", person),
  /* Board 1017: a lead named by address or from the licence's people, a naming withdrawn, a candidate confirmed. */
  licenceNameAddress: (address) => ipcRenderer.invoke("studio:licence-name-address", address),
  licenceNamePerson: (person) => ipcRenderer.invoke("studio:licence-name-person", person),
  licenceNamingWithdraw: (naming) => ipcRenderer.invoke("studio:licence-naming-withdraw", naming),
  licenceConfirm: (naming, person) => ipcRenderer.invoke("studio:licence-candidate-confirm", naming, person),
  /* The named person's own Accept of a naming (board 1011). */
  licenceAccept: () => ipcRenderer.invoke("studio:licence-accept"),
  licenceTeam: () => ipcRenderer.invoke("studio:licence-team"),
  licenceSwitch: (on) => ipcRenderer.invoke("studio:licence-switch", on),
  /* The lead's list of people who signed in, on a team's screen, each by pseudonym, and one admitted from the list (board 980, 1017). */
  peopleList: (dir) => ipcRenderer.invoke("studio:people-list", dir),
  personAdmit: (dir, person, from) => ipcRenderer.invoke("studio:person-admit", dir, person, from),
  /* Board 1017's member invitation: an address invited, withdrawn, and an unvouched Join confirmed or declined. */
  personInvite: (dir, address) => ipcRenderer.invoke("studio:person-invite", dir, address),
  personInviteWithdraw: (dir, invite) => ipcRenderer.invoke("studio:person-invite-withdraw", dir, invite),
  personConfirm: (dir, ask) => ipcRenderer.invoke("studio:person-confirm", dir, ask),
  personDecline: (dir, ask) => ipcRenderer.invoke("studio:person-decline", dir, ask),
  seatStay: (dir, codes) => ipcRenderer.invoke("studio:seat-stay", dir, codes),
  /* The update offer (board 991): what stands, its "Later", and the release page asked by name, with no address handed over. */
  update: () => ipcRenderer.invoke("studio:update"),
  updateLater: () => ipcRenderer.invoke("studio:update-later"),
  updateOpen: () => ipcRenderer.send("studio:update-open"),
  /* Buy (board 1020), asked by name: the shell builds the address from what the service last said, so the page hands over none. */
  buyOpen: () => ipcRenderer.send("studio:buy-open"),
  onUpdate: (fn) => ipcRenderer.on("studio:update-looked", (_e, v) => fn(v)),
  /* Where each team on the relay stands past working inside its grant, and the steps not yet given as a notice (board 935, G2);
     the shell says when one is due, and the page then asks; a step counts as told once the lead closes its notice. */
  relayLapse: () => ipcRenderer.invoke("studio:relay-lapse"),
  relayLapseSeen: (seen) => ipcRenderer.invoke("studio:relay-lapse-seen", seen),
  onRelayLapse: (fn) => ipcRenderer.on("studio:relay-lapse-due", (_e, v) => fn(v)),
  onRelaySyncNote: (fn) => ipcRenderer.on("studio:relay-sync-note", (_e, v) => fn(v)),
  proposalOpen: (dir, file, lang) => ipcRenderer.invoke("studio:proposal-open", dir, file, lang),
  proposalDecide: (dir, file, decisions, from, note) => ipcRenderer.invoke("studio:proposal-decide", dir, file, decisions, from, note),
  /* THE SIBLING OF proposalDecide (604): the marked passages a person pressed, put back into
     the proposal before the ticks land. A list of {card, lang, marks}. */
  proposalRevert: (dir, file, reverts) => ipcRenderer.invoke("studio:proposal-revert", dir, file, reverts),
  flagKeep: (dir, id) => ipcRenderer.invoke("studio:flag-keep", dir, id),

  addTag: (dir, kind, text) => ipcRenderer.invoke("studio:tag-add", dir, kind, text),
  renameTag: (dir, id, text) => ipcRenderer.invoke("studio:tag-rename", dir, id, text),
  saveTag: (dir, id, patch) => ipcRenderer.invoke("studio:tag-save", dir, id, patch),
  moveTag: (dir, id, delta) => ipcRenderer.invoke("studio:tag-move", dir, id, delta),
  deleteTag: (dir, id) => ipcRenderer.invoke("studio:tag-delete", dir, id),

  addLang: (dir, code, label) => ipcRenderer.invoke("studio:lang-add", dir, code, label),
  moveLang: (dir, code, delta, confirm) => ipcRenderer.invoke("studio:lang-move", dir, code, delta, confirm),
  removeLang: (dir, code, confirm) => ipcRenderer.invoke("studio:lang-remove", dir, code, confirm),
  setCommentLang: (dir, code) => ipcRenderer.invoke("studio:comment-lang", dir, code),

  saveFacts: (dir, text) => ipcRenderer.invoke("studio:facts", dir, text),
  saveVariables: (dir, variables) => ipcRenderer.invoke("studio:variables", dir, variables),

  upgradePick: (title, kind) => ipcRenderer.invoke("studio:v1-pick", title, kind),
  bringPick: (title, all) => ipcRenderer.invoke("studio:bring-pick", title, all),
  samplePick: () => ipcRenderer.invoke("studio:sample-pick"),
  upgradePlan: (file) => ipcRenderer.invoke("studio:v1-plan", file),
  upgradeLand: (file, name) => ipcRenderer.invoke("studio:v1-land", file, name),

  addCard: (dir, shelf, title, body, shape) => ipcRenderer.invoke("studio:card-add", dir, shelf, title, body, shape),
  duplicateCard: (dir, id) => ipcRenderer.invoke("studio:card-duplicate", dir, id),
  deleteCard: (dir, id) => ipcRenderer.invoke("studio:card-delete", dir, id),
  retireCard: (dir, id) => ipcRenderer.invoke("studio:card-retire", dir, id),
  restoreCard: (dir, id) => ipcRenderer.invoke("studio:card-restore", dir, id),
  undoDelete: (dir) => ipcRenderer.invoke("studio:card-undo", dir),
  dismissLikely: (dir, id, phrase) => ipcRenderer.invoke("studio:card-not-promise", dir, id, phrase),
  dismissPair: (dir, from, to) => ipcRenderer.invoke("studio:pair-not-path", dir, from, to),
  dismissEnd: (dir, id) => ipcRenderer.invoke("studio:end-not-path", dir, id),
  leaveFinding: (dir, id, why, reason) => ipcRenderer.invoke("studio:finding-left", dir, id, why, reason),
  dismissChangedNumber: (dir, id, key, from) => ipcRenderer.invoke("studio:number-dismiss", dir, id, key, from),
  cardHistory: (dir, id) => ipcRenderer.invoke("studio:card-history", dir, id),
  restoreText: (dir, id, edition) => ipcRenderer.invoke("studio:card-restore-text", dir, id, edition),
  diffCardEditions: (dir, id, a, b) => ipcRenderer.invoke("studio:card-diff", dir, id, a, b),

  findPlaces: (dir, o) => ipcRenderer.invoke("studio:find-places", dir, o),
  replacePlaces: (dir, o, keys) => ipcRenderer.invoke("studio:replace-places", dir, o, keys),
  retireCards: (dir, ids) => ipcRenderer.invoke("studio:cards-retire", dir, ids),
  moveCards: (dir, ids, shelf) => ipcRenderer.invoke("studio:cards-move", dir, ids, shelf),
  deleteCards: (dir, ids) => ipcRenderer.invoke("studio:cards-delete", dir, ids),
  undoBulk: (dir) => ipcRenderer.invoke("studio:cards-undo", dir),
  commitCards: (dir, ids) => ipcRenderer.invoke("studio:cards-commit", dir, ids),
  dismissMany: (dir, pairs) => ipcRenderer.invoke("studio:cards-not-promise", dir, pairs),
  changesSince: (dir) => ipcRenderer.invoke("studio:changes", dir),
  undoChange: (dir, n, spot) => ipcRenderer.invoke("studio:change-undo", dir, n, spot),
  csvPick: (title) => ipcRenderer.invoke("studio:csv-pick", title),
  exportCards: (dir, ids, folder) => ipcRenderer.invoke("studio:csv-export", dir, ids, folder),
  sheetPlan: (dir, file) => ipcRenderer.invoke("studio:sheet-plan", dir, file),
  sheetLand: (dir, file, fingerprint) => ipcRenderer.invoke("studio:sheet-land", dir, file, fingerprint),

  renameProject: (dir, name) => ipcRenderer.invoke("studio:rename", dir, name),
  changeFileName: (dir, name) => ipcRenderer.invoke("studio:file-name", dir, name),
  linkedCopy: (dir) => ipcRenderer.invoke("studio:linked-copy", dir),
  bringUp: (dir) => ipcRenderer.invoke("studio:bring-up", dir),
  /* Board 962 stage 7: a Studio on another Studio's team (V2, V3, V4). */
  followJoin: (text, name) => ipcRenderer.invoke("studio:follow-join", text, name),
  followLeave: () => ipcRenderer.invoke("studio:follow-leave"),
  followState: () => ipcRenderer.invoke("studio:follow-state"),
  /* The followed team's state moved (an admission, a refusal, a removal, a move): the page reads followState again. */
  onFollowChanged: (fn) => ipcRenderer.on("studio:follow-changed", (_e, v) => fn(v)),
  baseTake: (catalog) => ipcRenderer.invoke("studio:base-take", catalog),
  archive: (dir) => ipcRenderer.invoke("studio:archive", dir),
  diffEditions: (dir, a, b) => ipcRenderer.invoke("studio:diff", dir, a, b),
  /* `kind` is the file type's name in the dialog's list, in the interface's language, as
     importPick's `kinds` are: the shell has no table of its own. */
  exportPick: (title, name, kind) => ipcRenderer.invoke("studio:export-pick", title, name, kind),
  exportEdition: (dir, edition, file) => ipcRenderer.invoke("studio:export-edition", dir, edition, file),
  restoreEdition: (dir, edition) => ipcRenderer.invoke("studio:edition-restore", dir, edition),

  audit: (dir, edition) => ipcRenderer.invoke("studio:audit", dir, edition),
  auditPackPick: (title) => ipcRenderer.invoke("studio:audit-pack-pick", title),
  auditPack: (dir, edition, folder) => ipcRenderer.invoke("studio:audit-pack", dir, edition, folder),

  publishPlan: (dir) => ipcRenderer.invoke("studio:publish-plan", dir),
  publish: (dir, o) => ipcRenderer.invoke("studio:publish", dir, o),
  setStatsSpan: (dir, span) => ipcRenderer.invoke("studio:stats-span", dir, span),
  stats: (dir) => ipcRenderer.invoke("studio:stats", dir),
  statsExportPick: (title, name, kind) => ipcRenderer.invoke("studio:stats-export-pick", title, name, kind),
  statsExport: (dir, file, words) => ipcRenderer.invoke("studio:stats-export", dir, file, words),
  reveal: (dir) => ipcRenderer.invoke("studio:reveal", dir),

  /* THE OBJECT MENUS' VERBS (board 901): text to the clipboard, written by the shell because the page's own clipboard is
     refused; an item shown in the file manager, selected and never launched; and a project's folder to the Recycle Bin,
     only a project directly in Studio's projects folder (shell/main.js says which it refuses). */
  copy: (text) => ipcRenderer.invoke("studio:copy", text),
  show: (p) => ipcRenderer.invoke("studio:show", p),
  removeProject: (dir) => ipcRenderer.invoke("studio:project-remove", dir),

  /* THE CUSTOMER'S OWN AI SERVICE (board 992): Settings reads what is in force and never the key, saves the person's fields
     (a key typed once, "" to keep the one kept), and tests the connection with a fixed sentence and no catalog text. */
  aiSettings: () => ipcRenderer.invoke("studio:ai-settings"),
  aiSave: (provider, endpoint, model, key, forget) => ipcRenderer.invoke("studio:ai-save", provider, endpoint, model, key, forget),
  aiTest: () => ipcRenderer.invoke("studio:ai-test"),
  /* The drafting jobs (stage 4): the line the lead reads before a send, which sends nothing; the lead's Send; the drafts
     waiting; and the lead's Accept and Discard. */
  aiJobLine: (dir, job, card, lang, text, shelf) => ipcRenderer.invoke("studio:ai-job-line", dir, job, card, lang, text, shelf),
  aiJobSend: (dir, job, card, lang, text, shelf, stamp) => ipcRenderer.invoke("studio:ai-job-send", dir, job, card, lang, text, shelf, stamp),
  aiDrafts: (dir) => ipcRenderer.invoke("studio:ai-drafts", dir),
  aiDraftAccept: (dir, id, langs, titles, bodies, shelf, requests) => ipcRenderer.invoke("studio:ai-draft-accept", dir, id, langs, titles, bodies, shelf, requests),
  aiDraftDiscard: (dir, id) => ipcRenderer.invoke("studio:ai-draft-discard", dir, id),
  aiJobCancel: (dir, job) => ipcRenderer.invoke("studio:ai-job-cancel", dir, job),
  onAiImportProgress: (fn) => ipcRenderer.on("studio:ai-import-progress", (_e, v) => fn(v)),
});
