import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface KpiDetailColumn {
  key: string;
  label: string;
  align?: 'left' | 'center' | 'right';
  /** Extra classes for the cells of this column (e.g. 'font-mono whitespace-nowrap'). */
  className?: string;
}

export interface KpiDetailData {
  title: string;
  /** Line under the title; defaults to the record count. */
  subtitle?: string;
  columns: KpiDetailColumn[];
  /** One object per row, keyed by column key. Values may be any React node (badges, buttons ...). */
  rows: Array<Record<string, React.ReactNode>>;
  emptyText?: string;
  /** Extra control next to Close (e.g. "Open full page"). */
  action?: React.ReactNode;
}

interface KpiDetailPanelProps {
  detail: KpiDetailData | null;
  onClose: () => void;
  className?: string;
}

const ALIGN = { left: 'text-left', center: 'text-center', right: 'text-right' } as const;
const ROW_LIMIT = 100;

/**
 * Detail table that opens under a row of KPI cards when one is clicked. Same card / table look as the
 * rest of the portal; close with the button, Esc, or by clicking the same KPI card again.
 */
export const KpiDetailPanel: React.FC<KpiDetailPanelProps> = ({ detail, onClose, className }) => {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!detail) return;
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [detail?.title]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!detail) return null;
  const shown = detail.rows.slice(0, ROW_LIMIT);

  return (
    <section ref={ref} className={cn('cc-card p-3.5 sm:p-5 flex flex-col min-w-0 animate-in fade-in duration-150', className)} aria-label={detail.title}>
      <header className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <h2 className="cc-title text-sm font-bold tracking-tight">{detail.title}</h2>
          <p className="cc-muted text-xs mt-0.5">{detail.subtitle ?? `${detail.rows.length} record${detail.rows.length === 1 ? '' : 's'}`}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {detail.action}
          <button type="button" onClick={onClose} className="cc-btn cc-btn-secondary !h-8 !px-2.5" aria-label="Close details" title="Close (Esc)">
            <X className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Close</span>
          </button>
        </div>
      </header>

      {detail.rows.length === 0 ? (
        <p className="cc-muted text-xs py-6 text-center">{detail.emptyText ?? 'No records for this figure.'}</p>
      ) : (
        <>
          <div className="cc-table-wrap max-h-[22rem] overflow-auto">
            <table className="cc-table">
              <thead>
                <tr>
                  {detail.columns.map((c) => (
                    <th key={c.key} className={ALIGN[c.align ?? 'left']}>{c.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {shown.map((row, i) => (
                  <tr key={i}>
                    {detail.columns.map((c) => (
                      <td key={c.key} className={cn(ALIGN[c.align ?? 'left'], c.className)}>{row[c.key] ?? '—'}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {detail.rows.length > ROW_LIMIT && (
            <p className="cc-muted text-[11px] mt-2">Showing the first {ROW_LIMIT} of {detail.rows.length} records.</p>
          )}
        </>
      )}
    </section>
  );
};
