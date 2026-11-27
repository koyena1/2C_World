import type { Candidate } from '../../types/onboarding';
import { buildQrMatrix } from '../invite/QrOnboardingPanel';

/** Standard CR80 card (85.6 x 54 mm) at 300 dpi. */
export const CARD_PX_W = 1012;
export const CARD_PX_H = 638;
export const CARD_MM_W = 85.6;
export const CARD_MM_H = 54;

export const fullName = (c: Candidate) => `${c.firstName} ${c.lastName}`.trim();

/** Employee ID shown on the card and searchable: the previous employee ID, else the client's candidate code. */
export const employeeIdOf = (c: Candidate) => c.oldEmployeeId || c.clientCandidateCode || '';

export const formatCardDate = (iso?: string) =>
  iso ? new Date(`${iso}T00:00:00`).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';

/** Mandatory information for a card. A photograph and the details printed on the card must be present. */
export const idCardIssues = (c: Candidate): string[] => {
  const issues: string[] = [];
  if (!c.avatarUrl) issues.push('Photograph');
  if (!c.firstName.trim() || !c.lastName.trim()) issues.push('Name');
  if (!c.designation.trim()) issues.push('Designation');
  if (!c.clientName.trim()) issues.push('Client');
  if (!c.workLocation.trim()) issues.push('Work location');
  if (!c.dateOfJoining) issues.push('Joining date');
  if (!c.bloodGroup?.trim()) issues.push('Blood group');
  if (!c.emergencyContact?.trim()) issues.push('Emergency contact');
  if (!c.phone?.trim()) issues.push('Phone');
  return issues;
};

/* ---------------- photographs ---------------- */

const photoCache = new Map<string, Promise<HTMLImageElement | null>>();

/** Loads a candidate photograph; resolves null when it cannot be loaded (the card then shows a placeholder). */
export const loadPhoto = (url?: string): Promise<HTMLImageElement | null> => {
  if (!url) return Promise.resolve(null);
  const hit = photoCache.get(url);
  if (hit) return hit;
  const p = new Promise<HTMLImageElement | null>((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = url;
  });
  photoCache.set(url, p);
  return p;
};

/** Shrinks an uploaded photograph to a card-friendly size (keeps stored data small). */
export const fileToPhotoDataUrl = (file: File, maxSide = 480): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read the file.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('This file is not a valid image.'));
      img.onload = () => {
        const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext('2d')?.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.9));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });

/* ---------------- drawing ---------------- */

const FONT = 'Roboto, Arial, sans-serif';

const roundRect = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
};

const fit = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number) => {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let t = text;
  while (t.length > 1 && ctx.measureText(`${t}…`).width > maxWidth) t = t.slice(0, -1);
  return `${t}…`;
};

const wrap = (ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number): string[] => {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = '';
  words.forEach((w) => {
    const next = line ? `${line} ${w}` : w;
    if (ctx.measureText(next).width > maxWidth && line) {
      lines.push(line);
      line = w;
    } else {
      line = next;
    }
  });
  if (line) lines.push(line);
  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines);
    kept[maxLines - 1] = fit(ctx, `${kept[maxLines - 1]} ${lines.slice(maxLines).join(' ')}`, maxWidth);
    return kept;
  }
  return lines;
};

const prepare = (canvas: HTMLCanvasElement) => {
  canvas.width = CARD_PX_W;
  canvas.height = CARD_PX_H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.clearRect(0, 0, CARD_PX_W, CARD_PX_H);
  // Square corners keep the printed / PDF card clean (the card is trimmed along its edge).
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, CARD_PX_W, CARD_PX_H);
  return ctx;
};

/** Front of the card: header band, photograph, name, designation, client, IDs, dates and a verification QR. */
export const drawCardFront = (canvas: HTMLCanvasElement, c: Candidate, photo: HTMLImageElement | null) => {
  const ctx = prepare(canvas);
  if (!ctx) return;

  const grad = ctx.createLinearGradient(0, 0, CARD_PX_W, 0);
  grad.addColorStop(0, '#0b1d3a');
  grad.addColorStop(1, '#1d4ed8');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, CARD_PX_W, 132);
  ctx.fillStyle = '#ffffff';
  ctx.textBaseline = 'alphabetic';
  ctx.font = `700 44px ${FONT}`;
  ctx.fillText('2COMS Connect', 40, 70);
  ctx.font = `500 22px ${FONT}`;
  ctx.fillStyle = 'rgba(255,255,255,0.82)';
  ctx.fillText('Employee Identity Card', 40, 104);
  ctx.textAlign = 'right';
  ctx.fillStyle = '#ffffff';
  ctx.font = `600 24px ${FONT}`;
  ctx.fillText(c.userId, CARD_PX_W - 40, 84);
  ctx.textAlign = 'left';

  // photograph (cover-fit in a rounded frame)
  const px = 40;
  const py = 160;
  const pw = 230;
  const ph = 290;
  ctx.save();
  roundRect(ctx, px, py, pw, ph, 22);
  ctx.clip();
  if (photo) {
    const scale = Math.max(pw / photo.width, ph / photo.height);
    const dw = photo.width * scale;
    const dh = photo.height * scale;
    ctx.drawImage(photo, px + (pw - dw) / 2, py + (ph - dh) / 3, dw, dh);
  } else {
    ctx.fillStyle = '#eaf1ff';
    ctx.fillRect(px, py, pw, ph);
    ctx.fillStyle = '#1d4ed8';
    ctx.font = `700 92px ${FONT}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${c.firstName[0] ?? ''}${c.lastName[0] ?? ''}`.toUpperCase(), px + pw / 2, py + ph / 2);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
  }
  ctx.restore();
  roundRect(ctx, px, py, pw, ph, 22);
  ctx.strokeStyle = '#b9cef5';
  ctx.lineWidth = 4;
  ctx.stroke();

  // identity
  const tx = 300;
  const qrCell = 6;
  const matrix = buildQrMatrix(`2COMS|${c.userId}|${fullName(c)}`);
  const qrSize = matrix.length * qrCell;
  const textMax = CARD_PX_W - tx - qrSize - 90;
  ctx.fillStyle = '#0b1d3a';
  ctx.font = `700 44px ${FONT}`;
  ctx.fillText(fit(ctx, fullName(c), CARD_PX_W - tx - 40), tx, 206);
  ctx.fillStyle = '#1d4ed8';
  ctx.font = `600 28px ${FONT}`;
  ctx.fillText(fit(ctx, c.designation, CARD_PX_W - tx - 40), tx, 246);
  ctx.fillStyle = '#5b6b82';
  ctx.font = `500 23px ${FONT}`;
  ctx.fillText(fit(ctx, c.clientName, CARD_PX_W - tx - 40), tx, 280);

  const rows: Array<[string, string]> = [
    ['Employee ID', employeeIdOf(c) || '-'],
    ['Joining Date', formatCardDate(c.dateOfJoining)],
    ['Blood Group', c.bloodGroup || '-'],
    ['Valid Until', formatCardDate(c.endOfContract)],
  ];
  rows.forEach(([label, value], i) => {
    const x = tx + (i % 2) * 215;
    const y = 338 + Math.floor(i / 2) * 78;
    ctx.fillStyle = '#5b6b82';
    ctx.font = `600 16px ${FONT}`;
    ctx.fillText(label.toUpperCase(), x, y);
    ctx.fillStyle = '#0b1d3a';
    ctx.font = `600 24px ${FONT}`;
    ctx.fillText(fit(ctx, value, 205), x, y + 32);
  });

  // QR
  const qx = CARD_PX_W - 40 - qrSize;
  const qy = 330;
  ctx.fillStyle = '#ffffff';
  roundRect(ctx, qx - 10, qy - 10, qrSize + 20, qrSize + 20, 10);
  ctx.fill();
  ctx.strokeStyle = '#d9e5f6';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#0f172a';
  matrix.forEach((row, r) => row.forEach((on, col) => on && ctx.fillRect(qx + col * qrCell, qy + r * qrCell, qrCell, qrCell)));
  void textMax;

  // footer
  ctx.fillStyle = '#eaf1ff';
  ctx.fillRect(0, CARD_PX_H - 64, CARD_PX_W, 64);
  ctx.fillStyle = '#1d4ed8';
  ctx.font = `600 20px ${FONT}`;
  ctx.fillText(fit(ctx, `${c.workLocation}  ·  ${c.department}`, CARD_PX_W - 80), 40, CARD_PX_H - 24);
};

/** Back of the card: emergency details, address, terms, signature line and a barcode of the User ID. */
export const drawCardBack = (canvas: HTMLCanvasElement, c: Candidate) => {
  const ctx = prepare(canvas);
  if (!ctx) return;

  ctx.fillStyle = '#0b1d3a';
  ctx.fillRect(0, 0, CARD_PX_W, 84);
  ctx.fillStyle = '#ffffff';
  ctx.textBaseline = 'alphabetic';
  ctx.font = `700 30px ${FONT}`;
  ctx.fillText('2COMS Consulting Pvt Ltd', 40, 54);
  ctx.textAlign = 'right';
  ctx.font = `500 20px ${FONT}`;
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.fillText('Connect HRMS', CARD_PX_W - 40, 54);
  ctx.textAlign = 'left';

  const field = (label: string, value: string, x: number, y: number, maxW: number) => {
    ctx.fillStyle = '#5b6b82';
    ctx.font = `600 16px ${FONT}`;
    ctx.fillText(label.toUpperCase(), x, y);
    ctx.fillStyle = '#0b1d3a';
    ctx.font = `600 23px ${FONT}`;
    ctx.fillText(fit(ctx, value || '-', maxW), x, y + 30);
  };
  field('Emergency Contact', c.emergencyContact || '-', 40, 140, 450);
  field('Phone', c.phone || '-', 530, 140, 440);

  ctx.fillStyle = '#5b6b82';
  ctx.font = `600 16px ${FONT}`;
  ctx.fillText('ADDRESS', 40, 222);
  ctx.fillStyle = '#0b1d3a';
  ctx.font = `500 22px ${FONT}`;
  wrap(ctx, c.currentAddress || c.permanentAddress || '-', CARD_PX_W - 80, 2).forEach((line, i) => ctx.fillText(line, 40, 252 + i * 30));

  ctx.fillStyle = '#5b6b82';
  ctx.font = `500 18px ${FONT}`;
  const terms = [
    'This card is the property of 2COMS Consulting and must be worn while on duty.',
    'It is non-transferable. Report loss immediately to HR; misuse may lead to action.',
    'If found, please return to the nearest 2COMS office.',
  ];
  terms.forEach((t, i) => ctx.fillText(fit(ctx, t, CARD_PX_W - 80), 40, 340 + i * 26));

  // signature
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(40, 500);
  ctx.lineTo(300, 500);
  ctx.stroke();
  ctx.fillStyle = '#5b6b82';
  ctx.font = `500 16px ${FONT}`;
  ctx.fillText('Authorised Signatory', 40, 524);

  // barcode from the User ID (decorative Code-39-style bars, readable text underneath)
  const code = c.userId;
  let x = 560;
  ctx.fillStyle = '#0f172a';
  for (let i = 0; i < code.length; i += 1) {
    const v = code.charCodeAt(i);
    for (let b = 0; b < 7; b += 1) {
      const w = ((v >> b) & 1 ? 5 : 2) + 1;
      if (b % 2 === 0) ctx.fillRect(x, 440, w, 92);
      x += w + 2;
      if (x > CARD_PX_W - 40) break;
    }
  }
  ctx.fillStyle = '#0b1d3a';
  ctx.font = `600 20px ${FONT}`;
  ctx.textAlign = 'center';
  ctx.fillText(code, (560 + Math.min(x, CARD_PX_W - 40)) / 2, 566);
  ctx.textAlign = 'left';

  ctx.fillStyle = '#eaf1ff';
  ctx.fillRect(0, CARD_PX_H - 56, CARD_PX_W, 56);
  ctx.fillStyle = '#1d4ed8';
  ctx.font = `600 18px ${FONT}`;
  ctx.fillText('www.2coms.com  ·  hr@2coms.com', 40, CARD_PX_H - 20);
};

export interface RenderedCard {
  front: HTMLCanvasElement;
  back: HTMLCanvasElement;
}

export const renderCard = async (c: Candidate): Promise<RenderedCard> => {
  const photo = await loadPhoto(c.avatarUrl);
  const front = document.createElement('canvas');
  const back = document.createElement('canvas');
  drawCardFront(front, c, photo);
  drawCardBack(back, c);
  return { front, back };
};
