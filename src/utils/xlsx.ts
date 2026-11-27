import { buildZip } from './zip';

/**
 * Dependency-free Excel support: writes .xlsx workbooks and reads .xlsx workbooks (the readers for the legacy
 * .xls format live in xls.ts). Cells come back as plain strings; date-formatted cells become YYYY-MM-DD.
 */

export interface Sheet {
  name: string;
  /** Rows of cell text (first row = header for the data sheets). */
  rows: string[][];
}

/* ------------------------------------------------------------------ */
/* helpers shared with the .xls reader                                 */
/* ------------------------------------------------------------------ */

const pad = (n: number) => String(n).padStart(2, '0');

/** Excel serial date (1900 or 1904 system) to YYYY-MM-DD; keeps a time fraction out of the way. */
export const serialToIso = (serial: number, date1904 = false): string => {
  const base = date1904 ? Date.UTC(1904, 0, 1) : Date.UTC(1899, 11, 30);
  const d = new Date(base + Math.floor(serial) * 86_400_000);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
};

const BUILTIN_DATE_FORMATS = new Set([14, 15, 16, 17, 18, 19, 20, 21, 22, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 45, 46, 47, 50, 51, 52, 53, 54, 55, 56, 57, 58]);

export const isDateFormat = (id: number, code?: string): boolean => {
  if (code === undefined) return BUILTIN_DATE_FORMATS.has(id);
  const stripped = code.replace(/"[^"]*"/g, '').replace(/\\./g, '').replace(/\[(?!h|m|s)[^\]]*\]/gi, '');
  return /[ymdhs]/i.test(stripped) && !/^general$/i.test(code.trim());
};

/** Plain text for a numeric cell: integers stay integers, no float noise. */
export const numberToText = (n: number): string => {
  if (Number.isInteger(n)) return String(n);
  return String(Math.round(n * 1e10) / 1e10);
};

export const columnIndex = (ref: string): number => {
  const letters = ref.replace(/[^A-Za-z]/g, '').toUpperCase();
  let n = 0;
  for (let i = 0; i < letters.length; i += 1) n = n * 26 + (letters.charCodeAt(i) - 64);
  return n - 1;
};

/* ------------------------------------------------------------------ */
/* writing                                                             */
/* ------------------------------------------------------------------ */

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');

const colName = (i: number): string => {
  let n = i + 1;
  let s = '';
  while (n > 0) {
    const r = (n - 1) % 26;
    s = String.fromCharCode(65 + r) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
};

export interface WriteSheet extends Sheet {
  /** Column widths in characters. */
  widths?: number[];
  /** Style of the first row: 'header' (bold white on blue) or none. */
  headerRow?: boolean;
  /** Wrap long text and align to the top (instruction sheets). */
  wrap?: boolean;
  /** Keep the first row visible while scrolling. */
  freezeHeader?: boolean;
}

const sheetXml = (sheet: WriteSheet): string => {
  const cols = sheet.widths?.length
    ? `<cols>${sheet.widths.map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`).join('')}</cols>`
    : '';
  const rows = sheet.rows
    .map((row, r) => {
      const style = r === 0 && sheet.headerRow ? 1 : sheet.wrap ? 2 : 0;
      const cells = row
        .map((v, c) => (v === '' ? '' : `<c r="${colName(c)}${r + 1}" t="inlineStr"${style ? ` s="${style}"` : ''}><is><t xml:space="preserve">${esc(v)}</t></is></c>`))
        .join('');
      return `<row r="${r + 1}"${r === 0 && sheet.headerRow ? ' ht="30" customHeight="1"' : ''}>${cells}</row>`;
    })
    .join('');
  const view = sheet.freezeHeader
    ? '<sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>'
    : '';
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">${view}${cols}<sheetData>${rows}</sheetData></worksheet>`;
};

const STYLES_XML =
  '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
  '<fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font></fonts>' +
  '<fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF1D4ED8"/><bgColor indexed="64"/></patternFill></fill></fills>' +
  '<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>' +
  '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
  '<cellXfs count="3">' +
  '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>' +
  '<xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment vertical="center" wrapText="1"/></xf>' +
  '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment vertical="top" wrapText="1"/></xf>' +
  '</cellXfs></styleSheet>';

export const writeXlsx = (sheets: WriteSheet[]): Blob => {
  const enc = new TextEncoder();
  const f = (name: string, text: string) => ({ name, data: enc.encode(text) });
  const files = [
    f(
      '[Content_Types].xml',
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
        sheets.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('') +
        '</Types>'
    ),
    f('_rels/.rels', '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>'),
    f(
      'xl/workbook.xml',
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${sheets
        .map((s, i) => `<sheet name="${esc(s.name)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`)
        .join('')}</sheets></workbook>`
    ),
    f(
      'xl/_rels/workbook.xml.rels',
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${sheets
        .map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`)
        .join('')}<Relationship Id="rId${sheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`
    ),
    f('xl/styles.xml', STYLES_XML),
    ...sheets.map((s, i) => f(`xl/worksheets/sheet${i + 1}.xml`, sheetXml(s))),
  ];
  const zip = buildZip(files);
  return new Blob([zip], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
};

/* ------------------------------------------------------------------ */
/* reading                                                             */
/* ------------------------------------------------------------------ */

const decodeEntities = (s: string) =>
  s
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h: string) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d: string) => String.fromCodePoint(Number(d)))
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');

const attrs = (s: string): Record<string, string> => {
  const out: Record<string, string> = {};
  for (const m of s.matchAll(/([\w:]+)="([^"]*)"/g)) out[m[1]] = decodeEntities(m[2]);
  return out;
};

/** Text of all <t> runs inside a fragment (rich text runs joined, phonetic runs ignored). */
const textOf = (xml: string): string => {
  const cleaned = xml.replace(/<rPh\b[\s\S]*?<\/rPh>/g, '');
  let out = '';
  for (const m of cleaned.matchAll(/<t\b[^>]*>([\s\S]*?)<\/t>|<t\b[^>]*\/>/g)) out += decodeEntities(m[1] ?? '');
  return out;
};

interface ZipFile {
  name: string;
  method: number;
  data: Uint8Array;
  size: number;
}

const readZip = (buf: Uint8Array): Map<string, ZipFile> => {
  const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  let eocd = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65_557); i -= 1) {
    if (view.getUint32(i, true) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error('This file is not a valid .xlsx workbook.');
  const count = view.getUint16(eocd + 10, true);
  let p = view.getUint32(eocd + 16, true);
  const dec = new TextDecoder();
  const files = new Map<string, ZipFile>();
  for (let n = 0; n < count; n += 1) {
    if (view.getUint32(p, true) !== 0x02014b50) throw new Error('The workbook is damaged (bad directory).');
    const method = view.getUint16(p + 10, true);
    const compSize = view.getUint32(p + 20, true);
    const size = view.getUint32(p + 24, true);
    const nameLen = view.getUint16(p + 28, true);
    const extraLen = view.getUint16(p + 30, true);
    const commentLen = view.getUint16(p + 32, true);
    const localOff = view.getUint32(p + 42, true);
    const name = dec.decode(buf.subarray(p + 46, p + 46 + nameLen)).split(String.fromCharCode(92)).join('/');
    const lNameLen = view.getUint16(localOff + 26, true);
    const lExtraLen = view.getUint16(localOff + 28, true);
    const start = localOff + 30 + lNameLen + lExtraLen;
    files.set(name, { name, method, size, data: buf.subarray(start, start + compSize) });
    p += 46 + nameLen + extraLen + commentLen;
  }
  return files;
};

const inflate = async (file: ZipFile): Promise<Uint8Array> => {
  if (file.method === 0) return file.data;
  if (file.method !== 8) throw new Error('This workbook uses an unsupported compression method.');
  if (typeof DecompressionStream === 'undefined') throw new Error('This browser cannot open compressed .xlsx files. Please use a current version of Chrome, Edge, Firefox or Safari.');
  const stream = new Blob([file.data as BlobPart]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
};

const text = async (files: Map<string, ZipFile>, name: string): Promise<string | null> => {
  const f = files.get(name);
  return f ? new TextDecoder().decode(await inflate(f)) : null;
};

export const readXlsx = async (buffer: ArrayBuffer): Promise<Sheet[]> => {
  const files = readZip(new Uint8Array(buffer));
  const workbook = await text(files, 'xl/workbook.xml');
  if (!workbook) throw new Error('This file is not a valid .xlsx workbook (workbook.xml is missing).');
  const rels = (await text(files, 'xl/_rels/workbook.xml.rels')) ?? '';
  const date1904 = /<workbookPr\b[^>]*date1904="(1|true)"/.test(workbook);

  const relTarget = new Map<string, string>();
  for (const m of rels.matchAll(/<Relationship\b([^>]*?)\/?>/g)) {
    const a = attrs(m[1]);
    if (a.Id) relTarget.set(a.Id, a.Target?.startsWith('/') ? a.Target.slice(1) : `xl/${a.Target}`);
  }

  const sharedXml = await text(files, 'xl/sharedStrings.xml');
  const shared: string[] = [];
  if (sharedXml) for (const m of sharedXml.matchAll(/<si\b[^>]*>([\s\S]*?)<\/si>|<si\b[^>]*\/>/g)) shared.push(textOf(m[1] ?? ''));

  // number formats -> which cell styles are dates
  const stylesXml = (await text(files, 'xl/styles.xml')) ?? '';
  const customFmt = new Map<number, string>();
  for (const m of stylesXml.matchAll(/<numFmt\b([^>]*?)\/?>/g)) {
    const a = attrs(m[1]);
    if (a.numFmtId) customFmt.set(Number(a.numFmtId), a.formatCode ?? '');
  }
  const dateStyle: boolean[] = [];
  const cellXfs = /<cellXfs\b[^>]*>([\s\S]*?)<\/cellXfs>/.exec(stylesXml)?.[1] ?? '';
  for (const m of cellXfs.matchAll(/<xf\b([^>]*?)(?:\/>|>[\s\S]*?<\/xf>)/g)) {
    const id = Number(attrs(m[1]).numFmtId ?? 0);
    dateStyle.push(isDateFormat(id, customFmt.get(id)));
  }

  const sheets: Sheet[] = [];
  for (const m of workbook.matchAll(/<sheet\b([^>]*?)\/?>/g)) {
    const a = attrs(m[1]);
    const target = relTarget.get(a['r:id'] ?? '');
    const xml = target ? await text(files, target) : null;
    if (!xml) continue;
    const rows: string[][] = [];
    for (const rowM of xml.matchAll(/<row\b([^>]*?)(?:\/>|>([\s\S]*?)<\/row>)/g)) {
      const rowIdx = Number(attrs(rowM[1]).r ?? rows.length + 1) - 1;
      const line: string[] = [];
      for (const cm of (rowM[2] ?? '').matchAll(/<c\b([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
        const ca = attrs(cm[1]);
        const col = ca.r ? columnIndex(ca.r) : line.length;
        const inner = cm[2] ?? '';
        const v = /<v\b[^>]*>([\s\S]*?)<\/v>/.exec(inner)?.[1];
        let value = '';
        if (ca.t === 's') value = shared[Number(v)] ?? '';
        else if (ca.t === 'inlineStr') value = textOf(inner);
        else if (ca.t === 'str') value = decodeEntities(v ?? '');
        else if (ca.t === 'b') value = v === '1' ? 'TRUE' : 'FALSE';
        else if (ca.t === 'e') value = '';
        else if (v !== undefined && v !== '') {
          const n = Number(v);
          value = Number.isFinite(n) ? (dateStyle[Number(ca.s ?? 0)] ? serialToIso(n, date1904) : numberToText(n)) : decodeEntities(v);
        }
        line[col] = value;
      }
      for (let i = 0; i < line.length; i += 1) if (line[i] === undefined) line[i] = '';
      rows[rowIdx] = line;
    }
    for (let i = 0; i < rows.length; i += 1) if (rows[i] === undefined) rows[i] = [];
    sheets.push({ name: a.name ?? `Sheet${sheets.length + 1}`, rows });
  }
  if (sheets.length === 0) throw new Error('No worksheets were found in this workbook.');
  return sheets;
};
