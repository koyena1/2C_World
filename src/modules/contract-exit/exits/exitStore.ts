import { useSyncExternalStore } from 'react';
import { EXIT_CASES, ELIGIBILITY_RULES, buildSeedExitDocs, type ExitCase, type ExitDocEntry, type ExitDocMap, type EligibilityRule } from '../../../data/mockExitData';

/** Shared in-memory state so Exits and Exit Documents tabs show the same cases (resets on reload). */
interface State {
  cases: ExitCase[];
  docs: ExitDocMap;
  rules: EligibilityRule[];
}

let state: State = { cases: EXIT_CASES, docs: buildSeedExitDocs(), rules: ELIGIBILITY_RULES };
const listeners = new Set<() => void>();
const set = (next: State) => {
  state = next;
  listeners.forEach((l) => l());
};
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export const useExitStore = (): State => useSyncExternalStore(subscribe, () => state);

export const nextCaseId = (): string => `EX-${1000 + state.cases.length + 1}`;
export const nextEmpCode = (): string => `EMP-${20410 + state.cases.length + 1}`;

export const addExitCase = (c: ExitCase) => set({ ...state, cases: [c, ...state.cases], docs: { ...state.docs, [c.id]: {} } });
export const updateExitCase = (id: string, patch: Partial<ExitCase>) =>
  set({ ...state, cases: state.cases.map((c) => (c.id === id ? { ...c, ...patch } : c)) });
export const setExitDoc = (caseId: string, docId: string, entry: ExitDocEntry) =>
  set({ ...state, docs: { ...state.docs, [caseId]: { ...state.docs[caseId], [docId]: entry } } });
export const toggleRule = (id: string) =>
  set({ ...state, rules: state.rules.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)) });
