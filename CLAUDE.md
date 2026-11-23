# Etiuda Studio - rules of this repository

Studio is the manager's program: it makes catalogs cheap for the owner to build and expensive
for customers to leave. It is proprietary and source-available: its tree, never its history, is published in the public
repository `etiuda-studio-source` under the Etiuda Source-Available Licence (`LICENSE`, the engine's text word for word). Etiuda
is sold whole, as one subscription, the lead's seat coming with Studio; Studio is not a tier of its own (Max, 2026-11-23
10:17: "Studio is not a "paid tier" for the longest time. The whole thing is paid."; the office's decisions, 2026-10-12
23:20: one Studio, no higher tier). The spec
is `../Etiuda-Studio-spec.md`; the channel contract is `../Etiuda-Studio-channel-draft-2026-09-15-a.md`,
its open items answered into the office's
decisions. The engine's rulebook, `../etiuda/CLAUDE.md` (the older
`../Etiuda-session-rules.md` is superseded since 2026-09-22), applies here unchanged wherever it
does not say "engine".

## Non-negotiables

- **Every file here is published.** Since 2026-11-23 the tree goes, history-less, to the public repository
  `etiuda-studio-source` at each landing and each hosted test (Max, 10:22: "yes, then make full use of github
  testing"; 10:40, of a second, public repository for the code only: "yes"), and only through
  `tools/publish-tree.mjs`, which scans the whole tree and refuses on a hit. So a file and a comment are read by
  anyone, and a commit message is written as if it were: no catalog, no customer export, no engine copy, no
  employer's or customer's name, and nothing private to the office is ever committed here. This repository and its
  history stay private: `.git/hooks/pre-push` refuses every push but the one private remote named in `tools/pre-push`; `tools/pre-commit` is the engine's
  content scan and reads `.git/etiuda-names`, which no clone carries. Install both hooks in every
  clone by hand.
- **The engine is pinned by commit, never copied.** `ENGINE_PIN` in `tools/engine-pin` names one
  commit of the public engine repository. The build fetches that commit's format modules from
  the engine repository (by path on this desk, by the public remote elsewhere) and fails closed
  without the pin. A drift gate fails when the pin lags the engine's `main` by more than the
  number of commits it states. Nothing under `src/` here re-implements a reader, writer, lint
  rule or count that the engine has; a catalog Studio writes is bytes the pinned engine wrote,
  so a desk's hash check cannot disagree with Studio's. Maxim, 2026-09-16.
- **One writer.** The lead engineer seat owns this tree as it owns the engine's. A bounded item
  with an oracle may go to a Grok or Gemini build run that he or a chief launches in a worktree; the test architect
  judges it before the merge. Nobody pushes; the chief of staff pushes under Maxim's standing permission.
- **The customer's content stays inside the company's network, or leaves it only sealed, or goes, on the lead's act, to the AI service the customer configured (Maxim, 2026-11-11 19:07: "if client is plugging their own APi into Etiuda, it means they are intentionally waiving this privacy heuristic for their ApI"); a call that carries none may go out.**
  Maxim, 2026-10-06 21:22: "sensitive content is safe, and stays within the company's computer network,
  or if not, it's safely encrypted." Studio writes files onto the customer's own share, or seals them under the
  team's key, or an invitation's, for the team's relay at etiuda.dev, and reads what the desks wrote there; a
  catalog's text, a reply, the team's figures and anything about a customer never leave a machine unsealed. Studio's calls are made by the shell alone, through one file, `src/wire.cjs`, to
  etiuda.dev over https, or to a public timestamping service given only a hash, or to the endpoint the customer or their Group Policy configured for their own AI service, each body holding exactly
  what its route names. One more act sends nothing: Buy opens the system browser, the shell alone choosing the address, either at the team's order page on etiuda.dev with the person's identifier in the address's fragment only, never in a query and never sent by Studio, or, for an owner who already pays, at the payment provider's portal address the licence service answers, held to that provider's portal host; nothing else is opened, and while no order page is set Buy is hidden (the Head of Core's decision, 2026-11-22). `tests/no-model.mjs` forbids every other connection, and holds that file to its
  exact statements once it lands; a new call or a new field is decided by the Head of Core (Claude alpha), with a change to that gate
  first, and the agreement lists every one (Maxim, 2026-11-22 08:37: "You are the Head of Core, you are perfectly equipped to make that decision yourself."; 08:48, on this file: "Yes, Studio gets the same change."). No account and no telemetry; no model ships and none is called by default: the one model call is the customer's own service, started by the lead (board 992; Maxim 2026-11-11 18:44, 18:59).
- **Fixtures are synthetic.** A macro pile is customer content from its first byte. Test input
  is generated by a committed generator from a seed, or invented by hand with no employer name
  and no catalog wording; the output of the generator is not committed. The content scan runs
  over the fixture folder like any other path.
- **British English, no em or en dashes.** "Catalog" stays American. Comments are as public as
  code, and this tree is published.
