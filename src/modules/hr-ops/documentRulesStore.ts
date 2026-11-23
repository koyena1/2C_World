import { useSyncExternalStore } from 'react';
import { DOCUMENT_SIZE_RULES, type DocumentSizeRule } from '../../data/mockDocumentRulesData';

/** Live (in-memory) copy of the document size rules so a change in User Settings shows up on every upload. */
let rules: DocumentSizeRule[] = DOCUMENT_SIZE_RULES;
const listeners = new Set<() => void>();

export const setDocumentRules = (next: DocumentSizeRule[]) => {
  rules = next;
  listeners.forEach((l) => l());
};

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export const useDocumentRules = (): DocumentSizeRule[] => useSyncExternalStore(subscribe, () => rules);
