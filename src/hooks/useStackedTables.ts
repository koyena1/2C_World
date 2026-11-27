import { useEffect, type RefObject } from 'react';

/**
 * Turns every data table into labelled cards on phones and small tablets.
 *
 * The card layout itself is pure CSS in design-system.css and only exists below 1024px (`.cc-table-stack`), so
 * desktop tables are untouched. This hook only (1) tags tables with that class and (2) keeps `data-label` on each
 * cell equal to its column header so a card can show "Label: value".
 *
 * Opt out for true grids (calendars, rosters, matrices) with `data-no-stack` on the <table> or on any ancestor.
 */

const headerLabels = (table: HTMLTableElement): string[] => {
  // Use the LAST header row (grouped headers keep their group row above), expanding colspans.
  const rows = Array.from(table.querySelectorAll('thead tr'));
  const last = rows[rows.length - 1];
  if (!last) return [];
  const out: string[] = [];
  Array.from(last.children).forEach((cell) => {
    const span = Number(cell.getAttribute('colspan') ?? 1) || 1;
    const text = (cell.textContent ?? '').replace(/\s+/g, ' ').trim();
    for (let i = 0; i < span; i += 1) out.push(text);
  });
  return out;
};

const optedOut = (table: HTMLTableElement) => Boolean(table.closest('[data-no-stack]'));

export const stackTables = (root: ParentNode): void => {
  root.querySelectorAll<HTMLTableElement>('table').forEach((table) => {
    if (optedOut(table)) return;
    if (!table.classList.contains('cc-table-stack')) table.classList.add('cc-table-stack');
    const heads = headerLabels(table);
    table.querySelectorAll('tbody tr').forEach((tr) => {
      let col = 0;
      Array.from(tr.children).forEach((cell) => {
        const el = cell as HTMLElement;
        const span = Number(el.getAttribute('colspan') ?? 1) || 1;
        const text = span > 1 ? '' : heads[col] ?? '';
        if (el.getAttribute('data-label') !== text) el.setAttribute('data-label', text);
        col += span;
      });
    });
  });
};

/** Pass a ref to limit the work to one subtree, or omit it to cover the whole document (modals and drawers included). */
export const useStackedTables = (root?: RefObject<HTMLElement | null>): void => {
  useEffect(() => {
    const el: HTMLElement | null = root?.current ?? document.body;
    if (!el) return;
    const run = () => stackTables(el);
    run();
    // Runs in the observer callback (right after the DOM change, before paint), so a new table never flashes unstacked.
    const mo = new MutationObserver(run);
    // class changes too: React rewrites a table's className when its (theme-dependent) class string changes, dropping the tag.
    mo.observe(el, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
    return () => mo.disconnect();
  }, [root]);
};
