import { buildPdf, buildPdfBytes, dataUrlToBytes, type PdfImage, type PdfLine, type PdfPage } from '../../utils/pdf';
import { buildZip } from '../../utils/zip';
import type { Candidate } from '../../types/onboarding';
import { CARD_MM_H, CARD_MM_W, CARD_PX_H, CARD_PX_W, renderCard, type RenderedCard } from './idCardRender';

export interface ExportCard {
  /** File-name stem, e.g. "2C-2026-8941_Priya_Sharma". */
  name: string;
  rendered: RenderedCard;
}

export const fileStem = (c: { userId: string; firstName: string; lastName: string }) => `${c.userId}_${`${c.firstName}_${c.lastName}`.replace(/[^A-Za-z0-9]+/g, '_')}`;

/** Renders cards (front + back) for the given candidates, reporting progress. */
export const renderMany = async (list: Candidate[], onProgress?: (done: number, total: number) => void): Promise<ExportCard[]> => {
  const out: ExportCard[] = [];
  for (let i = 0; i < list.length; i += 1) {
    out.push({ name: fileStem(list[i]), rendered: await renderCard(list[i]) });
    onProgress?.(i + 1, list.length);
    if (i % 4 === 3) await new Promise((r) => setTimeout(r, 0)); // let the UI breathe on big batches
  }
  return out;
};

const jpeg = (canvas: HTMLCanvasElement): PdfImage['jpeg'] => dataUrlToBytes(canvas.toDataURL('image/jpeg', 0.93));

const fullImage = (canvas: HTMLCanvasElement, x: number, y: number): PdfImage => ({
  jpeg: jpeg(canvas),
  pxW: CARD_PX_W,
  pxH: CARD_PX_H,
  x,
  y,
  w: CARD_MM_W,
  h: CARD_MM_H,
});

/** Card-size pages: front then back for every card. */
const cardPages = (cards: ExportCard[]): PdfPage[] =>
  cards.flatMap((c) => [
    { widthMm: CARD_MM_W, heightMm: CARD_MM_H, images: [fullImage(c.rendered.front, 0, 0)] },
    { widthMm: CARD_MM_W, heightMm: CARD_MM_H, images: [fullImage(c.rendered.back, 0, 0)] },
  ]);

export const cardsPdf = (cards: ExportCard[], title: string): Blob => buildPdf(cardPages(cards), title);

/* ---------------- A4 print sheets ---------------- */

export const A4_W = 210;
export const A4_H = 297;
export const SHEET_COLS = 2;
export const SHEET_ROWS = 5;
export const SHEET_PER_PAGE = SHEET_COLS * SHEET_ROWS;
const GAP_X = 6;
const GAP_Y = 3;
const MARGIN_X = (A4_W - (SHEET_COLS * CARD_MM_W + (SHEET_COLS - 1) * GAP_X)) / 2; // 16.4 mm
const MARGIN_Y = (A4_H - (SHEET_ROWS * CARD_MM_H + (SHEET_ROWS - 1) * GAP_Y)) / 2; // 7.5 mm

interface Slot {
  x: number;
  y: number;
}

/** Position of the n-th card on a sheet. `mirror` flips the columns so the back lines up behind the front when printed duplex (flip on long edge). */
const slotFor = (n: number, mirror: boolean): Slot => {
  const row = Math.floor(n / SHEET_COLS);
  const col = n % SHEET_COLS;
  const c = mirror ? SHEET_COLS - 1 - col : col;
  return { x: MARGIN_X + c * (CARD_MM_W + GAP_X), y: MARGIN_Y + row * (CARD_MM_H + GAP_Y) };
};

const guides = (slot: Slot): PdfLine[] => [
  { x1: slot.x, y1: slot.y, x2: slot.x + CARD_MM_W, y2: slot.y },
  { x1: slot.x, y1: slot.y + CARD_MM_H, x2: slot.x + CARD_MM_W, y2: slot.y + CARD_MM_H },
  { x1: slot.x, y1: slot.y, x2: slot.x, y2: slot.y + CARD_MM_H },
  { x1: slot.x + CARD_MM_W, y1: slot.y, x2: slot.x + CARD_MM_W, y2: slot.y + CARD_MM_H },
];

const chunk = <T,>(list: T[], size: number): T[][] => Array.from({ length: Math.ceil(list.length / size) }, (_, i) => list.slice(i * size, i * size + size));

/** A4 sheets, 10 cards per page (2 x 5): each fronts page is followed by its matching backs page. */
export const a4SheetsPdf = (cards: ExportCard[]): Blob => {
  const pages: PdfPage[] = [];
  chunk(cards, SHEET_PER_PAGE).forEach((group) => {
    (['front', 'back'] as const).forEach((side) => {
      const images: PdfImage[] = [];
      const lines: PdfLine[] = [];
      group.forEach((c, n) => {
        const slot = slotFor(n, side === 'back');
        images.push(fullImage(c.rendered[side], slot.x, slot.y));
        lines.push(...guides(slot));
      });
      pages.push({ widthMm: A4_W, heightMm: A4_H, images, lines });
    });
  });
  return buildPdf(pages, '2COMS ID Cards - A4 print sheets');
};

/** One PDF per card (front + back) bundled in a ZIP. */
export const cardsZip = (cards: ExportCard[]): Blob => {
  const used = new Map<string, number>();
  return buildZip(
    cards.map((c) => {
      const n = (used.get(c.name) ?? 0) + 1;
      used.set(c.name, n);
      return { name: `${c.name}${n > 1 ? `_${n}` : ''}.pdf`, data: buildPdfBytes(cardPages([c]), c.name) };
    })
  );
};

/* ---------------- file / print helpers ---------------- */

export const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
};

const png = (c: HTMLCanvasElement) => c.toDataURL('image/png');

/**
 * Opens the browser print dialog for the cards. `win` must be opened synchronously inside the click handler
 * (before any await) so pop-up blockers allow it; it is filled in here once the cards are rendered.
 */
export const printCards = (win: Window, cards: ExportCard[], mode: 'a4' | 'single', title: string) => {
  let body = '';
  let css = '';
  if (mode === 'single') {
    css = `@page{size:${CARD_MM_W}mm ${CARD_MM_H}mm;margin:0}.page{width:${CARD_MM_W}mm;height:${CARD_MM_H}mm;page-break-after:always;overflow:hidden}.page img{width:${CARD_MM_W}mm;height:${CARD_MM_H}mm;display:block}`;
    body = cards.map((c) => `<div class="page"><img src="${png(c.rendered.front)}"></div><div class="page"><img src="${png(c.rendered.back)}"></div>`).join('');
  } else {
    css = `@page{size:A4;margin:0}.sheet{position:relative;width:${A4_W}mm;height:${A4_H}mm;page-break-after:always;overflow:hidden}.sheet img{position:absolute;width:${CARD_MM_W}mm;height:${CARD_MM_H}mm;outline:0.2mm solid #bbb}`;
    chunk(cards, SHEET_PER_PAGE).forEach((group) => {
      (['front', 'back'] as const).forEach((side) => {
        body += `<div class="sheet">${group
          .map((c, n) => {
            const s = slotFor(n, side === 'back');
            return `<img style="left:${s.x}mm;top:${s.y}mm" src="${png(c.rendered[side])}">`;
          })
          .join('')}</div>`;
      });
    });
  }
  win.document.open();
  win.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${title}</title><style>html,body{margin:0;padding:0;background:#fff}${css}@media screen{body{background:#e5e7eb}.page,.sheet{background:#fff;margin:8px auto;box-shadow:0 1px 6px rgba(0,0,0,.25)}}</style></head><body>${body}</body></html>`);
  win.document.close();
  const run = () => {
    win.focus();
    win.print();
  };
  const imgs = Array.from(win.document.images);
  if (imgs.every((i) => i.complete)) setTimeout(run, 150);
  else {
    let left = imgs.filter((i) => !i.complete).length;
    imgs.forEach((i) => i.addEventListener('load', () => {
      left -= 1;
      if (left === 0) setTimeout(run, 150);
    }));
  }
};
