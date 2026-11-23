/* THE PNG ENTRIES OF AN .ico, as the Linux build's menu icons (tools/package.mjs, step 1b).
 *
 * An .ico is a six-byte header, sixteen bytes per entry, then each entry's image. Every entry of
 * packaging/etiuda-studio.ico is a whole PNG file, so the pictures are its own bytes sliced out,
 * nothing redrawn. An entry that is not a PNG (an old-style bitmap) is refused rather than
 * converted, because a converted picture is one nobody looked at. Square sizes only; a width byte
 * of 0 means 256, as the format says.
 */

const PNG_MAGIC = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

/** Every entry of `ico` as {size, bytes}, largest first. Throws on anything but an icon of PNGs. */
export function icoPngs(ico) {
  const b = Buffer.from(ico);
  if (b.length < 6 || b.readUInt16LE(0) !== 0 || b.readUInt16LE(2) !== 1)
    throw new Error("not an .ico file: the header is not 0, 1");
  const n = b.readUInt16LE(4), out = [];
  for (let i = 0; i < n; i++) {
    const at = 6 + 16 * i;
    if (at + 16 > b.length) throw new Error("entry " + i + " runs past the end of the file");
    const w = b[at] || 256, h = b[at + 1] || 256, len = b.readUInt32LE(at + 8), off = b.readUInt32LE(at + 12);
    if (w !== h) throw new Error("entry " + i + " is " + w + "x" + h + ", not square");
    if (off + len > b.length) throw new Error("entry " + i + " runs past the end of the file");
    const bytes = b.subarray(off, off + len);
    if (!bytes.subarray(0, 8).equals(PNG_MAGIC)) throw new Error("entry " + i + " (" + w + "px) is not a PNG");
    out.push({ size: w, bytes: Buffer.from(bytes) });
  }
  if (!out.length) throw new Error("the .ico holds no entries");
  return out.sort((x, y) => y.size - x.size);
}
