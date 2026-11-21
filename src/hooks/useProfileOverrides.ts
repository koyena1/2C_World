import { useCallback, useSyncExternalStore } from 'react';
import { safeGetItem, safeSetItem } from '../utils/storage';

/**
 * Editable profile fields (name + email) per role, remembered in localStorage and shared by
 * every component that shows the user (sidebar footer, header menu, profile dialog).
 * Role is deliberately NOT editable here.
 */
export interface ProfileEdits {
  name: string;
  email: string;
}

const STORAGE_KEY = '2coms_profile_edits';
type Store = Record<string, ProfileEdits>;

let cache: Store | null = null;
const listeners = new Set<() => void>();

const read = (): Store => {
  if (cache) return cache;
  try {
    cache = JSON.parse(safeGetItem(STORAGE_KEY) ?? '{}') as Store;
  } catch {
    cache = {};
  }
  return cache;
};

const subscribe = (fn: () => void) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

export const saveProfileEdits = (roleKey: string, edits: ProfileEdits) => {
  cache = { ...read(), [roleKey]: edits };
  safeSetItem(STORAGE_KEY, JSON.stringify(cache));
  listeners.forEach((fn) => fn());
};

/** Saved edits for a role (or undefined) plus a `save` function. */
export const useProfileOverrides = (roleKey: string) => {
  const edits = useSyncExternalStore(subscribe, () => read()[roleKey]);
  const save = useCallback((next: ProfileEdits) => saveProfileEdits(roleKey, next), [roleKey]);
  return { edits, save };
};
