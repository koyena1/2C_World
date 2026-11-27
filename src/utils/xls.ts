import { isDateFormat, numberToText, serialToIso, type Sheet } from './xlsx';

/**
 * Reader for legacy Excel 97-2003 (.xls, BIFF8 inside an OLE2 container). Reads text, numbers and dates of the
 * worksheets (formula cells use their stored result). Dependency-free; throws a readable Error when a file is not
 * a BIFF8 workbook.
 */

const FREESECT = 0xfffffffe;
const ENDOFCHAIN = 0xfffffffe;

const u16 = (b: Uint8Array, o: number) => b[o] | (b[o + 1] << 8);
const u32 = (b: Uint8Array, o: number) => (b[o] | (b[o + 1] << 8) | (b[o + 2] << 16) | (b[o + 3] << 24)) >>> 0;

/* ---------------- OLE2 compound file ---------------- */

const readCompoundStream = (file: Uint8Array, wanted: string[]): Uint8Array => {
  const sig = [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1];
  if (!sig.every((v, i) => file[i] === v)) throw new Error('This is not a valid .xls file.');
  const sectorSize = 1 << u16(file, 0x1e);
  const miniSize = 1 << u16(file, 0x20);
  const cutoff = u32(file, 0x38);
  const sectorOffset = (s: number) => (s + 1) * sectorSize;

  // FAT
  const difat: number[] = [];
  for (let i = 0; i < 109; i += 1) {
    const v = u32(file, 0x4c + i * 4);
    if (v < FREESECT) difat.push(v);
  }
  let nextDifat = u32(file, 0x44);
  for (let guard = 0; nextDifat < FREESECT && guard < 4096; guard += 1) {
    const off = sectorOffset(nextDifat);
    for (let i = 0; i < sectorSize / 4 - 1; i += 1) {
      const v = u32(file, off + i * 4);
      if (v < FREESECT) difat.push(v);
    }
    nextDifat = u32(file, off + sectorSize - 4);
  }
  const fat: number[] = [];
  difat.forEach((s) => {
    const off = sectorOffset(s);
    for (let i = 0; i < sectorSize / 4; i += 1) fat.push(u32(file, off + i * 4));
  });

  const chain = (start: number): number[] => {
    const out: number[] = [];
    let s = start;
    while (s < ENDOFCHAIN && out.length <= fat.length) {
      out.push(s);
      s = fat[s];
    }
    return out;
  };
  const readChain = (start: number, size?: number): Uint8Array => {
    const secs = chain(start);
    const out = new Uint8Array(secs.length * sectorSize);
    secs.forEach((s, i) => out.set(file.subarray(sectorOffset(s), sectorOffset(s) + sectorSize), i * sectorSize));
    return size === undefined ? out : out.subarray(0, size);
  };

  // directory
  const dir = readChain(u32(file, 0x30));
  const entries: Array<{ name: string; type: number; start: number; size: number }> = [];
  for (let o = 0; o + 128 <= dir.length; o += 128) {
    const nameLen = u16(dir, o + 0x40);
    if (nameLen < 2) continue;
    let name = '';
    for (let i = 0; i < (nameLen - 2) / 2; i += 1) name += String.fromCharCode(u16(dir, o + i * 2));
    entries.push({ name, type: dir[o + 0x42], start: u32(dir, o + 0x74), size: u32(dir, o + 0x78) });
  }
  const root = entries.find((e) => e.type === 5);
  const stream = entries.find((e) => e.type === 2 && wanted.includes(e.name));
  if (!stream) throw new Error('No workbook was found in this .xls file (it may be password protected or not an Excel file).');

  if (stream.size >= cutoff) return readChain(stream.start, stream.size);

  // small stream: lives in the mini stream of the root entry
  const miniFat: number[] = [];
  const mf = readChain(u32(file, 0x3c));
  for (let i = 0; i + 4 <= mf.length; i += 4) miniFat.push(u32(mf, i));
  const miniStream = root ? readChain(root.start, root.size) : new Uint8Array(0);
  const out = new Uint8Array(stream.size);
  let s = stream.start;
  let pos = 0;
  while (s < ENDOFCHAIN && pos < stream.size) {
    const chunk = miniStream.subarray(s * miniSize, s * miniSize + miniSize);
    out.set(chunk.subarray(0, Math.min(chunk.length, stream.size - pos)), pos);
    pos += miniSize;
    s = miniFat[s];
  }
  return out;
};

/* ---------------- BIFF8 records ---------------- */

interface Rec {
  id: number;
  data: Uint8Array;
}

const records = (wb: Uint8Array, from = 0): Rec[] => {
  const out: Rec[] = [];
  let p = from;
  while (p + 4 <= wb.length) {
    const id = u16(wb, p);
    const len = u16(wb, p + 2);
    out.push({ id, data: wb.subarray(p + 4, p + 4 + len) });
    p += 4 + len;
  }
  return out;
};

const rkValue = (rk: number): number => {
  let v: number;
  if (rk & 2) v = rk >> 2; // signed integer
  else {
    const buf = new DataView(new ArrayBuffer(8));
    buf.setUint32(4, (rk & 0xfffffffc) >>> 0, true);
    v = buf.getFloat64(0, true);
  }
  return rk & 1 ? v / 100 : v;
};

/** Reads strings that may continue across CONTINUE records (each continuation re-states the char encoding). */
class ChunkReader {
  private i = 0;
  private p = 0;
  constructor(private chunks: Uint8Array[]) {}
  get done() {
    return this.i >= this.chunks.length;
  }
  private cur() {
    return this.chunks[this.i];
  }
  private ensure() {
    while (!this.done && this.p >= this.cur().length) {
      this.i += 1;
      this.p = 0;
    }
  }
  byte(): number {
    this.ensure();
    return this.done ? 0 : this.cur()[this.p++];
  }
  u16() {
    return this.byte() | (this.byte() << 8);
  }
  u32() {
    return (this.byte() | (this.byte() << 8) | (this.byte() << 16) | (this.byte() << 24)) >>> 0;
  }
  skip(n: number) {
    let left = n;
    while (left > 0 && !this.done) {
      this.ensure();
      if (this.done) break;
      const take = Math.min(left, this.cur().length - this.p);
      this.p += take;
      left -= take;
    }
  }
  chars(count: number, wide: boolean): string {
    let out = '';
    let isWide = wide;
    let left = count;
    while (left > 0 && !this.done) {
      if (this.p >= this.cur().length) {
        this.i += 1;
        this.p = 0;
        if (this.done) break;
        isWide = (this.cur()[this.p++] & 1) === 1; // continuation: new grbit
        continue;
      }
      if (isWide) {
        if (this.p + 1 >= this.cur().length) {
          this.p = this.cur().length;
          continue;
        }
        out += String.fromCharCode(this.cur()[this.p] | (this.cur()[this.p + 1] << 8));
        this.p += 2;
      } else {
        out += String.fromCharCode(this.cur()[this.p++]);
      }
      left -= 1;
    }
    return out;
  }
  /** XLUnicodeRichExtendedString */
  richString(): string {
    const cch = this.u16();
    const flags = this.byte();
    const runs = flags & 0x08 ? this.u16() : 0;
    const ext = flags & 0x04 ? this.u32() : 0;
    const s = this.chars(cch, (flags & 0x01) === 1);
    this.skip(runs * 4 + ext);
    return s;
  }
}

const shortString = (b: Uint8Array, o: number, lenBytes: 1 | 2): string => {
  const cch = lenBytes === 1 ? b[o] : u16(b, o);
  const flags = b[o + lenBytes];
  const start = o + lenBytes + 1;
  let s = '';
  if (flags & 1) for (let i = 0; i < cch; i += 1) s += String.fromCharCode(u16(b, start + i * 2));
  else for (let i = 0; i < cch; i += 1) s += String.fromCharCode(b[start + i]);
  return s;
};

export const readXls = (buffer: ArrayBuffer): Sheet[] => {
  const wb = readCompoundStream(new Uint8Array(buffer), ['Workbook', 'Book']);
  const recs = records(wb);

  // globals
  let date1904 = false;
  const sstChunks: Uint8Array[] = [];
  const formats = new Map<number, string>();
  const xfFormat: number[] = [];
  const boundSheets: Array<{ name: string; offset: number; hidden: boolean; type: number }> = [];
  let inSst = false;
  for (let i = 0; i < recs.length; i += 1) {
    const r = recs[i];
    if (r.id === 0x000a && boundSheets.length > 0) break; // end of the globals substream
    if (r.id === 0x0022) date1904 = r.data[0] === 1;
    else if (r.id === 0x00fc) {
      inSst = true;
      sstChunks.push(r.data.subarray(8)); // skip total + unique counts
    } else if (r.id === 0x003c && inSst) sstChunks.push(r.data);
    else {
      if (r.id !== 0x003c) inSst = false;
      if (r.id === 0x041e) formats.set(u16(r.data, 0), shortString(r.data, 2, 2));
      else if (r.id === 0x00e0) xfFormat.push(u16(r.data, 2));
      else if (r.id === 0x0085) boundSheets.push({ offset: u32(r.data, 0), hidden: (r.data[4] & 3) !== 0, type: r.data[5], name: shortString(r.data, 6, 1) });
    }
  }
  const sst: string[] = [];
  if (sstChunks.length) {
    const reader = new ChunkReader(sstChunks);
    // number of unique strings is in the SST header
    const sstRec = recs.find((r) => r.id === 0x00fc);
    const unique = sstRec ? u32(sstRec.data, 4) : 0;
    for (let n = 0; n < unique && !reader.done; n += 1) sst.push(reader.richString());
  }

  const isDateXf = (xf: number) => {
    const fmt = xfFormat[xf] ?? 0;
    return isDateFormat(fmt, formats.get(fmt));
  };

  const sheets: Sheet[] = [];
  boundSheets.forEach((bs) => {
    if (bs.type !== 0) return; // worksheets only (not charts / macro sheets)
    const sheetRecs = records(wb, bs.offset);
    const grid: string[][] = [];
    const put = (row: number, col: number, value: string) => {
      (grid[row] ??= [])[col] = value;
    };
    const num = (xf: number, n: number) => (isDateXf(xf) ? serialToIso(n, date1904) : numberToText(n));
    let lastFormula: { row: number; col: number } | null = null;
    for (let i = 0; i < sheetRecs.length; i += 1) {
      const r = sheetRecs[i];
      if (r.id === 0x000a && i > 0) break; // EOF of this sheet
      const d = r.data;
      switch (r.id) {
        case 0x00fd: // LABELSST
          put(u16(d, 0), u16(d, 2), sst[u32(d, 6)] ?? '');
          break;
        case 0x0204: // LABEL (BIFF8 uses a 16-bit length)
          put(u16(d, 0), u16(d, 2), shortString(d, 6, 2));
          break;
        case 0x0203: // NUMBER
          put(u16(d, 0), u16(d, 2), num(u16(d, 4), new DataView(d.buffer, d.byteOffset + 6, 8).getFloat64(0, true)));
          break;
        case 0x027e: // RK
          put(u16(d, 0), u16(d, 2), num(u16(d, 4), rkValue(u32(d, 6))));
          break;
        case 0x00bd: {
          // MULRK
          const row = u16(d, 0);
          const first = u16(d, 2);
          const count = (d.length - 6) / 6;
          for (let k = 0; k < count; k += 1) put(row, first + k, num(u16(d, 4 + k * 6), rkValue(u32(d, 6 + k * 6))));
          break;
        }
        case 0x0006: {
          // FORMULA: cached result
          const row = u16(d, 0);
          const col = u16(d, 2);
          if (d[12] === 0xff && d[13] === 0xff) {
            lastFormula = d[6] === 0 ? { row, col } : null; // string result follows in a STRING record
            if (d[6] === 1) put(row, col, d[8] ? 'TRUE' : 'FALSE');
          } else {
            lastFormula = null;
            put(row, col, num(u16(d, 4), new DataView(d.buffer, d.byteOffset + 6, 8).getFloat64(0, true)));
          }
          break;
        }
        case 0x0207: // STRING (text result of the previous formula)
          if (lastFormula) put(lastFormula.row, lastFormula.col, shortString(d, 0, 2));
          lastFormula = null;
          break;
        default:
          break;
      }
    }
    const rows: string[][] = [];
    for (let r = 0; r < grid.length; r += 1) {
      const line = grid[r] ?? [];
      for (let c = 0; c < line.length; c += 1) if (line[c] === undefined) line[c] = '';
      rows[r] = line;
    }
    sheets.push({ name: bs.name, rows });
  });
  if (sheets.length === 0) throw new Error('No worksheets were found in this .xls file.');
  return sheets;
};
