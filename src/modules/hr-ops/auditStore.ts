import { useSyncExternalStore } from 'react';

/**
 * In-memory audit trail (frontend simulation, resets on reload). Modules call `logAudit` when a user
 * changes something, so the "who / when" shown in the UI comes from one place.
 */
export interface AuditEntry {
  id: string;
  /** Feature or page the change belongs to, e.g. 'uan-esic-log'. */
  area: string;
  /** What changed, in one plain sentence. */
  action: string;
  /** Optional subject, e.g. a candidate id. */
  subjectId?: string;
  actorId: string;
  actorName: string;
  /** ISO timestamp. */
  at: string;
}

let entries: AuditEntry[] = [];
const listeners = new Set<() => void>();

export const logAudit = (entry: Omit<AuditEntry, 'id' | 'at'>): AuditEntry => {
  const full: AuditEntry = { ...entry, id: `AUD-${entries.length + 1}`, at: new Date().toISOString() };
  entries = [full, ...entries];
  listeners.forEach((l) => l());
  return full;
};

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

/** Live list (newest first), optionally filtered by area and/or subject. */
export const useAuditLog = (filter?: { area?: string; subjectId?: string }): AuditEntry[] => {
  const all = useSyncExternalStore(subscribe, () => entries);
  return filter ? all.filter((e) => (!filter.area || e.area === filter.area) && (!filter.subjectId || e.subjectId === filter.subjectId)) : all;
};

/** 'dd Mon yyyy, hh:mm AM' for audit columns. */
export const formatAuditTime = (iso: string): string =>
  new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
