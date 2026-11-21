/** Client-side file download helpers (no backend involved). */

export const downloadBlob = (blob: Blob, fileName: string): void => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const downloadText = (
  content: string,
  fileName: string,
  mimeType = 'text/plain;charset=utf-8;'
): void => {
  downloadBlob(new Blob([content], { type: mimeType }), fileName);
};

export const downloadCsv = (content: string, fileName: string): void =>
  downloadText(content, fileName, 'text/csv;charset=utf-8;');
