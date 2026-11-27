import { readXls } from './xls';
import { readXlsx, type Sheet } from './xlsx';

export type { Sheet } from './xlsx';
export { writeXlsx } from './xlsx';

export type SpreadsheetKind = 'xlsx' | 'xls';

/** Detects the format from the file's first bytes (not just its extension) and reads every worksheet. */
export const readSpreadsheet = async (buffer: ArrayBuffer): Promise<{ kind: SpreadsheetKind; sheets: Sheet[] }> => {
  const head = new Uint8Array(buffer, 0, Math.min(8, buffer.byteLength));
  if (head[0] === 0x50 && head[1] === 0x4b) return { kind: 'xlsx', sheets: await readXlsx(buffer) };
  if (head[0] === 0xd0 && head[1] === 0xcf && head[2] === 0x11 && head[3] === 0xe0) return { kind: 'xls', sheets: readXls(buffer) };
  throw new Error('This file is not an Excel workbook. Upload a .xlsx or .xls file (CSV files are not supported here).');
};
