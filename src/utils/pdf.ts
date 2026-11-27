/**
 * Minimal PDF writer: pages of a given size (mm) holding JPEG images and thin lines (cut marks).
 * Enough for ID cards without pulling in a PDF library. Coordinates are in millimetres from the top-left.
 */

export interface PdfImage {
  jpeg: Uint8Array;
  pxW: number;
  pxH: number;
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface PdfLine {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface PdfPage {
  widthMm: number;
  heightMm: number;
  images: PdfImage[];
  lines?: PdfLine[];
}

const PT = 72 / 25.4;
const f = (n: number) => (Math.round(n * 1000) / 1000).toString();

export const dataUrlToBytes = (dataUrl: string): Uint8Array => {
  const bin = atob(dataUrl.slice(dataUrl.indexOf(',') + 1));
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) out[i] = bin.charCodeAt(i);
  return out;
};

export const buildPdfBytes = (pages: PdfPage[], title = '2COMS ID Cards'): Uint8Array => {
  const enc = new TextEncoder();
  const objects: Uint8Array[] = []; // index 0 => object 1
  const add = (parts: Array<string | Uint8Array>) => {
    const chunks = parts.map((p) => (typeof p === 'string' ? enc.encode(p) : p));
    const len = chunks.reduce((n, c) => n + c.length, 0);
    const buf = new Uint8Array(len);
    let o = 0;
    chunks.forEach((c) => {
      buf.set(c, o);
      o += c.length;
    });
    objects.push(buf);
    return objects.length; // object number
  };

  // 1: catalog, 2: pages (patched below)
  add(['']);
  add(['']);

  const pageObjs: number[] = [];
  pages.forEach((page) => {
    const wPt = page.widthMm * PT;
    const hPt = page.heightMm * PT;
    const xobjs: string[] = [];
    let content = '';

    page.images.forEach((img, i) => {
      const imgObj = add([
        `<< /Type /XObject /Subtype /Image /Width ${img.pxW} /Height ${img.pxH} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${img.jpeg.length} >>\nstream\n`,
        img.jpeg,
        '\nendstream',
      ]);
      xobjs.push(`/Im${i} ${imgObj} 0 R`);
      const x = img.x * PT;
      const w = img.w * PT;
      const h = img.h * PT;
      const y = hPt - (img.y * PT + h);
      content += `q ${f(w)} 0 0 ${f(h)} ${f(x)} ${f(y)} cm /Im${i} Do Q\n`;
    });

    if (page.lines?.length) {
      content += '0.5 w 0.55 G\n';
      page.lines.forEach((l) => {
        content += `${f(l.x1 * PT)} ${f(hPt - l.y1 * PT)} m ${f(l.x2 * PT)} ${f(hPt - l.y2 * PT)} l S\n`;
      });
    }

    const contentBytes = enc.encode(content);
    const contentObj = add([`<< /Length ${contentBytes.length} >>\nstream\n`, contentBytes, '\nendstream']);
    const pageObj = add([
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${f(wPt)} ${f(hPt)}] /Resources << /XObject << ${xobjs.join(' ')} >> >> /Contents ${contentObj} 0 R >>`,
    ]);
    pageObjs.push(pageObj);
  });

  const infoObj = add([`<< /Title (${title.replace(/[()]/g, "")}) /Producer (2COMS Connect) >>`]);
  objects[0] = enc.encode('<< /Type /Catalog /Pages 2 0 R >>');
  objects[1] = enc.encode(`<< /Type /Pages /Kids [${pageObjs.map((n) => `${n} 0 R`).join(' ')}] /Count ${pageObjs.length} >>`);

  const header = enc.encode('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');
  const parts: Uint8Array[] = [header];
  const offsets: number[] = [];
  let pos = header.length;
  objects.forEach((body, i) => {
    offsets.push(pos);
    const open = enc.encode(`${i + 1} 0 obj\n`);
    const close = enc.encode('\nendobj\n');
    parts.push(open, body, close);
    pos += open.length + body.length + close.length;
  });

  let xref = `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.forEach((o) => {
    xref += `${String(o).padStart(10, '0')} 00000 n \n`;
  });
  xref += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R /Info ${infoObj} 0 R >>\nstartxref\n${pos}\n%%EOF`;
  parts.push(enc.encode(xref));

  const total = parts.reduce((n, c) => n + c.length, 0);
  const out = new Uint8Array(total);
  let at = 0;
  parts.forEach((c) => {
    out.set(c, at);
    at += c.length;
  });
  return out;
};

export const buildPdf = (pages: PdfPage[], title = '2COMS ID Cards'): Blob =>
  new Blob([buildPdfBytes(pages, title) as BlobPart], { type: 'application/pdf' });
