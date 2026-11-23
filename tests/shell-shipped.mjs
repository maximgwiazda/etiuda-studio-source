/* WHAT OF THE PINNED ENGINE'S SHELL STUDIO SHIPS, BY NAME, EACH BESIDE THE LINE THAT READS IT (the test architect's
 * read, 2026-11-03 12:23): what ships is what the product reads, not what the packaging config happens to let
 * through. tests/installer.mjs 2f holds the installed asar to exactly this set; tests/shell-readers.mjs holds, without a
 * window, that each still has its reader and that Studio reads no other pinned shell file.
 *
 * NEVER SHIPPED: the desk's shell/main.js, which src/engine.mjs reads only at the fetch to cut
 * engine/pinned/.shell-slices.js; shell/clip-suggest.cjs, which that shell requires and Studio does
 * not read; and shell/installer.nsh, whose five hooks the fetch cuts for the build. The desk's
 * customInit stays in that file and out of the build. */
export const SHELL_SHIPPED = [
  { file: "engine/pinned/shell/page-watch.cjs", reader: "shell/main.js", reads: 'require("../engine/pinned/shell/page-watch.cjs")' },
  { file: "engine/pinned/shell/win-proxy.cjs", reader: "shell/main.js", reads: 'require("../engine/pinned/shell/win-proxy.cjs")' },
  { file: "engine/pinned/shell/tray.cjs", reader: "shell/main.js", reads: 'require("../engine/pinned/shell/tray.cjs")' },
  { file: "engine/pinned/shell/proxy-net.cjs", reader: "src/wire.cjs", reads: 'require("../engine/pinned/shell/proxy-net.cjs")' },
  { file: "engine/pinned/shell/folder/syncer.cjs", reader: "src/engine.mjs", reads: 'require(at("shell", "folder", "syncer.cjs"))' },
  { file: "engine/pinned/shell/folder/syncer-worker.cjs", reader: "src/engine.mjs", reads: 'worker: at("shell", "folder", "syncer-worker.cjs")' },
  { file: "engine/pinned/shell/relay/channel.cjs", reader: "src/engine.mjs", reads: 'at("shell", "relay", "channel.cjs")' },
  { file: "engine/pinned/shell/relay/blob.cjs", reader: "src/engine.mjs", reads: 'at("shell", "relay", "blob.cjs")' },
  { file: "engine/pinned/shell/policy/etiuda.admx", reader: "src/engine.mjs", reads: 'at("shell", "policy", "etiuda.admx")' },
  { file: "engine/pinned/shell/policy/en-US/etiuda.adml", reader: "src/engine.mjs", reads: "/^shell\\/policy\\/([A-Za-z]{2,3}-[A-Za-z]{2,4})\\/etiuda\\.adml$/" },
  { file: "engine/pinned/shell/policy/pl-PL/etiuda.adml", reader: "src/engine.mjs", reads: "/^shell\\/policy\\/([A-Za-z]{2,3}-[A-Za-z]{2,4})\\/etiuda\\.adml$/" },
  { file: "engine/pinned/shell/sample-catalog.ec", reader: "src/engine.mjs", reads: 'at("shell", "sample-catalog.ec")' },
];
export const SHELL_KEPT_OUT = ["engine/pinned/shell/main.js", "engine/pinned/shell/clip-suggest.cjs", "engine/pinned/shell/installer.nsh", "engine/pinned/shell/desk-ai.cjs"];
