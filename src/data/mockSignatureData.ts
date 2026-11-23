import { useSyncExternalStore } from 'react';

/** Required consent wording shown next to the signature upload (requirement 13). */
export const SIGNATURE_CONSENT_TEXT =
  'I hereby give consent to 2COMS to use my uploaded signature for all official purposes during my employment tenure.';

export interface StoredSignature {
  candidateId: string;
  /** Object URL of the uploaded file, or a data-URI drawn signature for seeded employees. */
  imageUrl: string;
  fileName: string;
  consentText: string;
  /** ISO timestamp of consent + submission. */
  consentAt: string;
  submittedBy: string;
}

/** Mock "drawn" signature (SVG data URI) so seeded employees have something to show. */
export const drawnSignatureSvg = (name: string): string => {
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="340" height="90" viewBox="0 0 340 90">` +
    `<text x="14" y="56" font-size="34" font-style="italic" fill="#1e3a8a" ` +
    `font-family="'Segoe Script','Brush Script MT','Snell Roundhand',cursive">${name.replace(/[<&]/g, '')}</text>` +
    `<path d="M10 72 C80 62 160 80 320 66" stroke="#1e3a8a" stroke-width="2" fill="none" stroke-linecap="round"/></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

const seed = (candidateId: string, name: string, at: string, by: string): StoredSignature => ({
  candidateId,
  imageUrl: drawnSignatureSvg(name),
  fileName: `${name.toLowerCase().replace(/\s+/g, '-')}-signature.png`,
  consentText: SIGNATURE_CONSENT_TEXT,
  consentAt: at,
  submittedBy: by,
});

/** Seeded employees (all at signature-enabled clients) who already uploaded a signature. */
let signatures: Record<string, StoredSignature> = {
  'cand-001': seed('cand-001', 'Priya Sharma', '2026-09-22T10:42:00.000Z', 'Priya Sharma (employee)'),
  'cand-002': seed('cand-002', 'Rahul Verma', '2026-09-24T14:05:00.000Z', 'Rahul Verma (employee)'),
  'cand-006': seed('cand-006', 'Arjun Nair', '2026-09-12T09:18:00.000Z', 'Vikram (Client HR)'),
};
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export const saveSignature = (sig: StoredSignature) => {
  signatures = { ...signatures, [sig.candidateId]: sig };
  emit();
};

export const removeSignature = (candidateId: string) => {
  const { [candidateId]: _gone, ...rest } = signatures;
  signatures = rest;
  emit();
};

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

/** Live map candidateId -> stored signature (shared by the Candidate 360 panel and the letter previews). */
export const useSignatures = (): Record<string, StoredSignature> => useSyncExternalStore(subscribe, () => signatures);
export const useSignature = (candidateId: string | undefined): StoredSignature | undefined =>
  useSignatures()[candidateId ?? ''];
