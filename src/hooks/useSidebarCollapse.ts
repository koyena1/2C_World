import { useCallback, useState } from 'react';
import { SIDEBAR_STORAGE_KEY } from '../layouts/sidebar/sidebar.config';
import { safeGetItem, safeSetItem } from '../utils/storage';

/** Collapsed/expanded state of the sidebar, remembered across reloads. */
export const useSidebarCollapse = (initial = false) => {
  const [collapsed, setCollapsedState] = useState<boolean>(() => {
    const saved = safeGetItem(SIDEBAR_STORAGE_KEY);
    return saved === null ? initial : saved === 'true';
  });

  const setCollapsed = useCallback((next: boolean) => {
    setCollapsedState(next);
    safeSetItem(SIDEBAR_STORAGE_KEY, String(next));
  }, []);

  const toggle = useCallback(() => {
    setCollapsedState((prev) => {
      safeSetItem(SIDEBAR_STORAGE_KEY, String(!prev));
      return !prev;
    });
  }, []);

  return { collapsed, setCollapsed, toggle };
};
