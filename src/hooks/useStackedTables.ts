import { useEffect, type RefObject } from 'react';

/**
 * Keeps `data-label` on every cell of `table.cc-table-stack` equal to its column header, so the phone
 * card layout (design-system.css) can show "Label: value". Re-runs when the table's rows change.
 */
export const useStackedTables = (root: RefObject<HTMLElement | null>): void => {
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const label = () => {
      el.querySelectorAll<HTMLTableElement>('table.cc-table-stack').forEach((table) => {
        const heads = Array.from(table.querySelectorAll('thead th')).map((th) => (th.textContent ?? '').trim());
        table.querySelectorAll('tbody tr').forEach((tr) => {
          let col = 0;
          Array.from(tr.children).forEach((cell) => {
            const td = cell as HTMLElement;
            const text = heads[col] ?? '';
            if (td.getAttribute('data-label') !== text) td.setAttribute('data-label', text);
            col += Number(td.getAttribute('colspan') ?? 1) || 1;
          });
        });
      });
    };
    label();
    const mo = new MutationObserver(label);
    mo.observe(el, { childList: true, subtree: true });
    return () => mo.disconnect();
  }, [root]);
};
