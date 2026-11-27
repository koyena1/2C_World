import { useSyncExternalStore } from 'react';
import type { Candidate } from '../../types/onboarding';
import { MOCK_CANDIDATES } from '../../data/mockOnboardingData';
import { addDaysIso, todayIso } from '../../utils/today';
import { logAudit } from '../hr-ops/auditStore';

/**
 * ID card register (frontend simulation, resets on reload). One record per card issued; a reissue supersedes the
 * previous card of the same candidate. The candidate's details are snapshotted at issue time so a re-download or
 * reprint always reproduces the card exactly as it was issued.
 */
export interface IdCardRecord {
  id: string;
  /** Printed card number, e.g. IDC-2026-0007. */
  cardNo: string;
  candidateId: string;
  candidateName: string;
  userId: string;
  version: number;
  status: 'Active' | 'Superseded';
  /** ISO timestamp. */
  generatedAt: string;
  generatedBy: string;
  generatedById: string;
  /** Why it was reissued (version 2 and later). */
  reason?: string;
  batchId: string;
  /** Where the card was generated from, e.g. "Excel import: staff.xlsx" (empty for the on-screen flow). */
  source?: string;
  downloads: number;
  prints: number;
  snapshot: Candidate;
}

export interface Actor {
  id: string;
  name: string;
}

export const REISSUE_REASONS = ['Card lost', 'Card damaged', 'Details changed', 'Photograph updated', 'Other'] as const;
export type ReissueReason = (typeof REISSUE_REASONS)[number];

let records: IdCardRecord[] = [];
let counter = 0;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

const nextCardNo = () => {
  counter += 1;
  return `IDC-${todayIso().slice(0, 4)}-${String(counter).padStart(4, '0')}`;
};

const newBatchId = () => `BATCH-${Date.now().toString(36).toUpperCase()}`;

/** Issues cards for candidates. `reissueReason` marks a controlled reissue (supersedes the active card). */
export const issueCards = (candidates: Candidate[], actor: Actor, reissueReason?: string, source?: string): IdCardRecord[] => {
  const batchId = newBatchId();
  const now = new Date().toISOString();
  const issued: IdCardRecord[] = candidates.map((c) => {
    const previous = records.find((r) => r.candidateId === c.id && r.status === 'Active');
    const version = records.filter((r) => r.candidateId === c.id).length + 1;
    return {
      id: `${batchId}-${c.id}`,
      cardNo: nextCardNo(),
      candidateId: c.id,
      candidateName: `${c.firstName} ${c.lastName}`.trim(),
      userId: c.userId,
      version,
      status: 'Active',
      generatedAt: now,
      generatedBy: actor.name,
      generatedById: actor.id,
      reason: previous ? reissueReason : undefined,
      batchId,
      source,
      downloads: 0,
      prints: 0,
      snapshot: { ...c },
    };
  });
  const supersede = new Set(candidates.map((c) => c.id));
  records = [...issued, ...records.map((r) => (supersede.has(r.candidateId) && r.status === 'Active' ? { ...r, status: 'Superseded' as const } : r))];
  emit();

  const reissue = reissueReason !== undefined;
  logAudit({
    area: 'id-cards',
    action: reissue
      ? `Reissued ${issued.length} ID card${issued.length === 1 ? '' : 's'} (${reissueReason})${source ? ` from ${source}` : ''}: ${issued.map((r) => r.cardNo).join(', ')}`
      : `Generated ${issued.length} ID card${issued.length === 1 ? '' : 's'}${source ? ` from ${source}` : ''} (${issued.map((r) => r.cardNo).join(', ')})`,
    subjectId: issued.length === 1 ? issued[0].candidateId : batchId,
    actorId: actor.id,
    actorName: actor.name,
  });
  return issued;
};

export const recordUse = (ids: string[], kind: 'download' | 'print', actor: Actor, label: string) => {
  if (ids.length === 0) return;
  const set = new Set(ids);
  records = records.map((r) => (set.has(r.id) ? { ...r, downloads: r.downloads + (kind === 'download' ? 1 : 0), prints: r.prints + (kind === 'print' ? 1 : 0) } : r));
  emit();
  logAudit({ area: 'id-cards', action: `${kind === 'download' ? 'Downloaded' : 'Printed'} ${label}`, subjectId: ids.length === 1 ? ids[0] : undefined, actorId: actor.id, actorName: actor.name });
};

export const activeRecordFor = (candidateId: string): IdCardRecord | undefined => records.find((r) => r.candidateId === candidateId && r.status === 'Active');

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export const useIdCardRecords = (): IdCardRecord[] => useSyncExternalStore(subscribe, () => records, () => records);

/* A few cards issued earlier, so duplicate prevention and the history are visible straight away. */
const seed = () => {
  const earlier = [
    { idx: 0, daysAgo: 21, by: { id: 'USR-001', name: 'Ananya (Ops Lead)' } },
    { idx: 1, daysAgo: 21, by: { id: 'USR-001', name: 'Ananya (Ops Lead)' } },
    { idx: 2, daysAgo: 14, by: { id: 'USR-014', name: 'Vikram (Client HR)' } },
    { idx: 5, daysAgo: 9, by: { id: 'USR-001', name: 'Ananya (Ops Lead)' } },
    { idx: 7, daysAgo: 5, by: { id: 'USR-014', name: 'Vikram (Client HR)' } },
  ];
  earlier.forEach(({ idx, daysAgo, by }, i) => {
    const c = MOCK_CANDIDATES[idx];
    if (!c) return;
    records.push({
      id: `SEED-${i}`,
      cardNo: nextCardNo(),
      candidateId: c.id,
      candidateName: `${c.firstName} ${c.lastName}`.trim(),
      userId: c.userId,
      version: 1,
      status: 'Active',
      generatedAt: `${addDaysIso(todayIso(), -daysAgo)}T10:${String(10 + i * 7).padStart(2, '0')}:00.000Z`,
      generatedBy: by.name,
      generatedById: by.id,
      batchId: `BATCH-SEED${i}`,
      downloads: 1 + (i % 2),
      prints: i % 2,
      snapshot: { ...c },
    });
  });
  records.sort((a, b) => b.generatedAt.localeCompare(a.generatedAt));
};
seed();
