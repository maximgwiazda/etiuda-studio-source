"use strict";
/* Where the tray bubble stands. o: { bounds: the tray icon as Electron reads it, display: { bounds, workArea }, size: { width, height } of the bubble }.
 * Pointing on the icon only where it sits in the taskbar strip, bottom or top; a hidden overflow, empty or unreadable bounds, or a
 * side taskbar give the bottom corner by the notification area, with no pointer. Returns the bubble { x, y, side, tip }. */
function bubblePlace(o) {
  const { bounds, display, size } = o || {};
  const area = display && display.workArea, disp = display && display.bounds, W = size.width, H = size.height;
  const corner = { x: area.x + area.width - W - 12, y: area.y + area.height - H - 12, side: "none", tip: null };
  const ok = bounds && [bounds.x, bounds.y, bounds.width, bounds.height].every(Number.isFinite) && bounds.width > 0 && bounds.height > 0;
  if (!ok) return corner;
  const below = bounds.y >= area.y + area.height && bounds.y < disp.y + disp.height;
  const above = bounds.y + bounds.height <= area.y && bounds.y + bounds.height > disp.y;
  if (!below && !above) return corner;
  const centre = bounds.x + bounds.width / 2;
  const x = Math.max(area.x + 8, Math.min(area.x + area.width - W - 8, Math.round(centre - W / 2)));
  const tip = Math.max(20, Math.min(W - 20, Math.round(centre - x)));
  return below ? { x: x, y: area.y + area.height - H - 10, side: "above", tip: tip } : { x: x, y: area.y + 10, side: "below", tip: tip };
}

module.exports = { bubblePlace };
