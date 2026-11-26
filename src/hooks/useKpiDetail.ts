import { useCallback, useState } from 'react';

/**
 * Which KPI card (if any) currently has its detail table open on a page.
 * Clicking the same card again closes it; opening another one switches the table.
 */
export const useKpiDetail = <Id extends string = string>() => {
  const [activeId, setActiveId] = useState<Id | null>(null);
  const toggle = useCallback((id: Id) => setActiveId((cur) => (cur === id ? null : id)), []);
  const close = useCallback(() => setActiveId(null), []);
  return { activeId, toggle, close, isActive: (id: Id) => activeId === id };
};
