/* PRE-RENDERED TRAY BADGE ICONS FOR STUDIO (run S6).
 *
 *   node tools/tray-badges.mjs
 *
 * Generates badge tray icons (1 to 9, 9+) from packaging/etiuda-studio.ico
 * into packaging/tray/ as both .ico and .png files.
 * British English, no em or en dashes.
 */
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";
import { icoPngs } from "./ico-png.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ICO_FILE = path.join(ROOT, "packaging", "etiuda-studio.ico");
const OUT_DIR = path.join(ROOT, "packaging", "tray");

const BADGES = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "9+"];

const FONT3x5 = {
  "1": ["010", "110", "010", "010", "111"],
  "2": ["111", "001", "111", "100", "111"],
  "3": ["111", "001", "111", "001", "111"],
  "4": ["101", "101", "111", "001", "001"],
  "5": ["111", "100", "111", "001", "111"],
  "6": ["111", "100", "111", "101", "111"],
  "7": ["111", "001", "010", "010", "010"],
  "8": ["111", "101", "111", "101", "111"],
  "9": ["111", "101", "111", "001", "111"],
  "+": ["000", "010", "111", "010", "000"],
};

const CRC_TABLE = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  CRC_TABLE[n] = c;
}

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const len = data.length;
  const out = Buffer.alloc(12 + len);
  out.writeUInt32BE(len, 0);
  out.write(type, 4, 4, "ascii");
  data.copy(out, 8);
  const c = crc32(out.subarray(4, 8 + len));
  out.writeUInt32BE(c, 8 + len);
  return out;
}

function decodeRGBA(pngBytes) {
  let pos = 8;
  let width = 0;
  let height = 0;
  const idatChunks = [];
  while (pos < pngBytes.length) {
    const len = pngBytes.readUInt32BE(pos);
    const type = pngBytes.toString("ascii", pos + 4, pos + 8);
    if (type === "IHDR") {
      width = pngBytes.readUInt32BE(pos + 8);
      height = pngBytes.readUInt32BE(pos + 12);
    } else if (type === "IDAT") {
      idatChunks.push(pngBytes.subarray(pos + 8, pos + 8 + len));
    }
    pos += 12 + len;
  }
  const raw = zlib.inflateSync(Buffer.concat(idatChunks));
  const bpp = 4;
  const stride = width * bpp;
  const pixels = Buffer.alloc(width * height * 4);
  let rawOffset = 0;
  for (let y = 0; y < height; y++) {
    const filter = raw[rawOffset++];
    const prevLine = y > 0 ? (y - 1) * stride : null;
    const curLine = y * stride;
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? pixels[curLine + x - bpp] : 0;
      const b = prevLine !== null ? pixels[prevLine + x] : 0;
      const c = prevLine !== null && x >= bpp ? pixels[prevLine + x - bpp] : 0;
      const val = raw[rawOffset++];
      let r = 0;
      if (filter === 0) r = val;
      else if (filter === 1) r = (val + a) & 0xff;
      else if (filter === 2) r = (val + b) & 0xff;
      else if (filter === 3) r = (val + Math.floor((a + b) / 2)) & 0xff;
      else if (filter === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a);
        const pb = Math.abs(p - b);
        const pc = Math.abs(p - c);
        const pr = (pa <= pb && pa <= pc) ? a : (pb <= pc ? b : c);
        r = (val + pr) & 0xff;
      }
      pixels[curLine + x] = r;
    }
  }
  return { width, height, pixels };
}

function encodePNG(w, h, px) {
  const stride = w * 4;
  const raw = Buffer.alloc(h * (1 + stride));
  let off = 0;
  for (let y = 0; y < h; y++) {
    raw[off++] = 0;
    px.copy(raw, off, y * stride, (y + 1) * stride);
    off += stride;
  }
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  const idat = zlib.deflateSync(raw);
  return Buffer.concat([
    sig,
    makeChunk("IHDR", ihdr),
    makeChunk("IDAT", idat),
    makeChunk("IEND", Buffer.alloc(0)),
  ]);
}

function makeIco(entries) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(entries.length, 4);
  const dir = Buffer.alloc(16 * entries.length);
  let offset = 6 + 16 * entries.length;
  entries.forEach((e, i) => {
    dir[i * 16] = e.size >= 256 ? 0 : e.size;
    dir[i * 16 + 1] = e.size >= 256 ? 0 : e.size;
    dir[i * 16 + 2] = 0;
    dir[i * 16 + 3] = 0;
    dir.writeUInt16LE(1, i * 16 + 4);
    dir.writeUInt16LE(32, i * 16 + 6);
    dir.writeUInt32LE(e.bytes.length, i * 16 + 8);
    dir.writeUInt32LE(offset, i * 16 + 12);
    offset += e.bytes.length;
  });
  return Buffer.concat([header, dir, ...entries.map((e) => e.bytes)]);
}

function drawBadgeOn(base, label) {
  const { width, height, pixels } = decodeRGBA(base);
  const px = Buffer.from(pixels);

  function setPixel(x, y, r, g, b, a) {
    if (x < 0 || x >= width || y < 0 || y >= height) return;
    const idx = (y * width + x) * 4;
    const bgA = px[idx + 3] / 255;
    const fgA = a / 255;
    const outA = fgA + bgA * (1 - fgA);
    if (outA <= 0) return;
    px[idx] = Math.round((r * fgA + px[idx] * bgA * (1 - fgA)) / outA);
    px[idx + 1] = Math.round((g * fgA + px[idx + 1] * bgA * (1 - fgA)) / outA);
    px[idx + 2] = Math.round((b * fgA + px[idx + 2] * bgA * (1 - fgA)) / outA);
    px[idx + 3] = Math.round(outA * 255);
  }

  const redR = 196, redG = 43, redB = 28;

  if (width === 32) {
    if (label === "9+") {
      const rx0 = 12, rx1 = 30, ry0 = 1, ry1 = 15;
      const r = (ry1 - ry0) / 2;
      for (let y = ry0; y <= ry1; y++) {
        for (let x = rx0; x <= rx1; x++) {
          let inside = false;
          if (x < rx0 + r) {
            const dx = x - (rx0 + r), dy = y - (ry0 + r);
            if (dx * dx + dy * dy <= r * r) inside = true;
          } else if (x > rx1 - r) {
            const dx = x - (rx1 - r), dy = y - (ry0 + r);
            if (dx * dx + dy * dy <= r * r) inside = true;
          } else {
            inside = true;
          }
          if (inside) setPixel(x, y, redR, redG, redB, 255);
        }
      }
      drawGlyph(14, 4, "9", 2);
      drawGlyph(21, 4, "+", 2);
    } else {
      const cx = 22.5, cy = 8.5, radius = 7.5;
      for (let y = 1; y <= 16; y++) {
        for (let x = 15; x <= 30; x++) {
          const dx = x - cx, dy = y - cy;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist <= radius) {
            setPixel(x, y, redR, redG, redB, 255);
          } else if (dist <= radius + 0.8) {
            const a = Math.round((radius + 0.8 - dist) / 0.8 * 255);
            setPixel(x, y, redR, redG, redB, a);
          }
        }
      }
      drawGlyph(20, 4, label, 2);
    }
  } else if (width === 16) {
    if (label === "9+") {
      const rx0 = 6, rx1 = 15, ry0 = 0, ry1 = 7;
      const r = (ry1 - ry0) / 2;
      for (let y = ry0; y <= ry1; y++) {
        for (let x = rx0; x <= rx1; x++) {
          let inside = false;
          if (x < rx0 + r) {
            const dx = x - (rx0 + r), dy = y - (ry0 + r);
            if (dx * dx + dy * dy <= r * r) inside = true;
          } else if (x > rx1 - r) {
            const dx = x - (rx1 - r), dy = y - (ry0 + r);
            if (dx * dx + dy * dy <= r * r) inside = true;
          } else {
            inside = true;
          }
          if (inside) setPixel(x, y, redR, redG, redB, 255);
        }
      }
      drawGlyph(7, 1, "9", 1);
      drawGlyph(11, 1, "+", 1);
    } else {
      const cx = 11.5, cy = 4.5, radius = 4.2;
      for (let y = 0; y <= 9; y++) {
        for (let x = 7; x <= 15; x++) {
          const dx = x - cx, dy = y - cy;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist <= radius) {
            setPixel(x, y, redR, redG, redB, 255);
          } else if (dist <= radius + 0.7) {
            const a = Math.round((radius + 0.7 - dist) / 0.7 * 255);
            setPixel(x, y, redR, redG, redB, a);
          }
        }
      }
      drawGlyph(10, 2, label, 1);
    }
  }

  function drawGlyph(gx, gy, char, scale) {
    const rows = FONT3x5[char];
    if (!rows) return;
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 3; c++) {
        if (rows[r][c] === "1") {
          for (let sy = 0; sy < scale; sy++) {
            for (let sx = 0; sx < scale; sx++) {
              setPixel(gx + c * scale + sx, gy + r * scale + sy, 255, 255, 255, 255);
            }
          }
        }
      }
    }
  }

  return encodePNG(width, height, px);
}

export function buildTrayBadges() {
  if (!fs.existsSync(OUT_DIR)) {
    fs.mkdirSync(OUT_DIR, { recursive: true });
  }

  const rawIco = fs.readFileSync(ICO_FILE);
  const entries = icoPngs(rawIco);
  const png32 = entries.find((e) => e.size === 32);
  const png16 = entries.find((e) => e.size === 16);

  if (!png32 || !png16) {
    throw new Error("packaging/etiuda-studio.ico missing 32x32 or 16x16 entries");
  }

  for (const label of BADGES) {
    const b32 = drawBadgeOn(png32.bytes, label);
    const b16 = drawBadgeOn(png16.bytes, label);

    const ico = makeIco([
      { size: 32, bytes: b32 },
      { size: 16, bytes: b16 },
    ]);

    const icoOut = path.join(OUT_DIR, `tray-${label}.ico`);
    const pngOut = path.join(OUT_DIR, `tray-${label}.png`);

    fs.writeFileSync(icoOut, ico);
    fs.writeFileSync(pngOut, b32);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  buildTrayBadges();
  console.log("Built tray badge icons in packaging/tray/ for 1..9, 9+");
}
