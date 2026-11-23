/* THE TRAY'S BASE PICTURE, cut from packaging/etiuda-studio.ico so it can be made again.
 *
 *     node tools/tray-base.mjs
 *
 * Electron on Linux reads an .ico as an empty image, so the tray takes a PNG. The badge PNGs
 * already sit beside their .ico files. The base does not: this writes packaging/tray/base.png
 * from the icon's own 32px frame, or the nearest square frame when 32 is absent. A PNG frame's
 * bytes are copied. Only when the icon holds no PNG frame is the nearest bitmap decoded.
 */
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";

const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const WANT = 32;

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return (~c) >>> 0;
}

function chunk(type, data) {
  const body = Buffer.concat([Buffer.from(type), data]);
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const sum = Buffer.alloc(4);
  sum.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, sum]);
}

/** An uncompressed RGBA PNG. Used only when the icon has no PNG frame to copy. */
function pngFromRgba(w, h, rgba) {
  const stride = w * 4 + 1;
  const raw = Buffer.alloc(stride * h);
  for (let y = 0; y < h; y++) {
    raw[y * stride] = 0;
    rgba.copy(raw, y * stride + 1, y * w * 4, (y + 1) * w * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([PNG_MAGIC, chunk("IHDR", ihdr), chunk("IDAT", zlib.deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]);
}

/** A 32-bit bitmap frame stored in an .ico (bottom up, BGRA, height often counted twice). */
function decodeBitmap(bytes, size) {
  const b = Buffer.from(bytes);
  if (b.length < 40 || b.readUInt32LE(0) !== 40) throw new Error("the bitmap frame is not a 40-byte header");
  const width = b.readInt32LE(4);
  const heightRaw = b.readInt32LE(8);
  const height = Math.abs(heightRaw) === size * 2 ? size : Math.abs(heightRaw);
  if (width !== size || height !== size) throw new Error("the bitmap frame is " + width + "x" + height + ", not " + size);
  if (b.readUInt16LE(12) !== 1 || b.readUInt16LE(14) !== 32) throw new Error("only a 32-bit bitmap frame can be decoded");
  const start = 40;
  if (start + width * height * 4 > b.length) throw new Error("the bitmap frame is short");
  const rgba = Buffer.alloc(width * height * 4);
  for (let y = 0; y < height; y++) {
    const srcY = height - 1 - y;
    for (let x = 0; x < width; x++) {
      const s = start + (srcY * width + x) * 4;
      const d = (y * width + x) * 4;
      rgba[d] = b[s + 2];
      rgba[d + 1] = b[s + 1];
      rgba[d + 2] = b[s];
      rgba[d + 3] = b[s + 3];
    }
  }
  return pngFromRgba(width, height, rgba);
}

function framesOf(ico) {
  const b = Buffer.from(ico);
  if (b.length < 6 || b.readUInt16LE(0) !== 0 || b.readUInt16LE(2) !== 1) throw new Error("not an .ico file: the header is not 0, 1");
  const n = b.readUInt16LE(4), out = [];
  for (let i = 0; i < n; i++) {
    const at = 6 + 16 * i;
    if (at + 16 > b.length) throw new Error("entry " + i + " runs past the end of the file");
    const w = b[at] || 256, h = b[at + 1] || 256, len = b.readUInt32LE(at + 8), off = b.readUInt32LE(at + 12);
    if (w !== h) throw new Error("entry " + i + " is " + w + "x" + h + ", not square");
    if (off + len > b.length) throw new Error("entry " + i + " runs past the end of the file");
    const bytes = Buffer.from(b.subarray(off, off + len));
    out.push({ size: w, bytes, png: bytes.subarray(0, 8).equals(PNG_MAGIC) });
  }
  if (!out.length) throw new Error("the .ico holds no entries");
  return out;
}

function nearest(list) {
  return list.slice().sort((a, b) => Math.abs(a.size - WANT) - Math.abs(b.size - WANT) || b.size - a.size)[0];
}

/** The base tray PNG's bytes: the 32px PNG frame, else the nearest, else the nearest bitmap decoded. */
export function trayBaseBytes(ico) {
  const frames = framesOf(ico);
  const pngs = frames.filter((f) => f.png);
  if (pngs.length) return Buffer.from(nearest(pngs).bytes);
  const bmp = nearest(frames);
  return decodeBitmap(bmp.bytes, bmp.size);
}

function invoked() {
  const arg = process.argv[1];
  if (!arg) return false;
  return path.resolve(arg) === fileURLToPath(import.meta.url);
}

if (invoked()) {
  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  const ico = fs.readFileSync(path.join(root, "packaging", "etiuda-studio.ico"));
  const bytes = trayBaseBytes(ico);
  const out = path.join(root, "packaging", "tray", "base.png");
  fs.writeFileSync(out, bytes);
  process.stdout.write("tray base " + bytes.length + " bytes -> packaging/tray/base.png\n");
}
