#!/bin/sh
# THE SIGN-IN PREVIEW IN ONE COMMAND, on Ubuntu: starts the installed Etiuda Studio with ETIUDA_SIGNIN_PREVIEW=1 set for that one
# start (shell/main.js SIGNIN_PREVIEW_ASKED), as tools/signin-preview.cmd does on Windows. Never packaged: the files list in
# electron-builder.js holds no tools/ (tests/sign-in.mjs si70). With --where it prints the program it would start, and starts
# nothing. To preview an AppImage, name it as the argument.
#
#   sh tools/signin-preview.sh                          the installed .deb, /opt/Etiuda Studio/etiuda-studio
#   sh tools/signin-preview.sh ~/Downloads/etiuda-studio-*.AppImage
#   sh tools/signin-preview.sh --where
set -u
where=0
if [ "${1:-}" = "--where" ]; then where=1; shift; fi
exe="${1:-/opt/Etiuda Studio/etiuda-studio}"
if [ ! -x "$exe" ]; then
  echo "Etiuda Studio was not found at $exe. Name an AppImage as the argument to preview that one." >&2
  exit 1
fi
if [ "$where" = 1 ]; then echo "$exe"; exit 0; fi
if pgrep -x etiuda-studio >/dev/null 2>&1; then
  echo "Etiuda Studio is open already, and a second start only brings it forward without the preview. Quit it (the tray menu, Quit Etiuda Studio), then run this again." >&2
  exit 1
fi
ETIUDA_SIGNIN_PREVIEW=1 exec "$exe"
