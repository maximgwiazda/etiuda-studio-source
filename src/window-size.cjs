"use strict";
/* THE WINDOW'S SIZE AGAINST THE SCREENS IT HAS (sense pass 3, item 33). Studio's minimum is
 * 900x560 and it opens at 1280x880, in DIPs; a 1080p screen at 200 per cent has a work area 492
 * DIPs tall, so the minimum alone put the window's foot below the screen. Where every screen has
 * room nothing changes; where one has less, the window may shrink to that one's work area.
 * CommonJS so that shell/main.js can require it.
 */
const MIN_W = 900, MIN_H = 560, OPEN_W = 1280, OPEN_H = 880;

/** `displays` is Electron's screen.getAllDisplays(), `primary` its getPrimaryDisplay(). */
function roomFor(displays, primary) {
  const areas = (displays || []).map(d => d && d.workAreaSize).filter(a => a && a.height > 0);
  const least = areas.length ? Math.min.apply(null, areas.map(a => a.height)) : MIN_H;
  const home = (primary && primary.workAreaSize) || { width: OPEN_W, height: OPEN_H };
  return {
    minWidth: MIN_W,
    minHeight: Math.min(MIN_H, least),
    width: Math.max(MIN_W, Math.min(OPEN_W, home.width)),
    height: Math.max(Math.min(MIN_H, least), Math.min(OPEN_H, home.height)),
  };
}

module.exports = { roomFor, MIN_W, MIN_H, OPEN_W, OPEN_H };
