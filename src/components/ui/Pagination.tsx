import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationSummaryProps {
  page: number;
  total: number;
  pageSize: number;
  /** Plural noun, e.g. "candidates". */
  itemLabel?: string;
}

/** "Showing X–Y of Z candidates" (left side of a table toolbar). */
export const PaginationSummary: React.FC<PaginationSummaryProps> = ({ page, total, pageSize, itemLabel = 'items' }) => {
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);
  return (
    <p className="cc-pagination-summary">
      Showing <strong>{start}–{end}</strong> of <strong>{total}</strong> {itemLabel}
    </p>
  );
};

interface PaginationControlsProps {
  /** 1-based current page. */
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  /** Show "1 of N" between the arrows on phones (hidden from sm up). */
  mobileIndicator?: boolean;
}

/** Two compact square arrow buttons (Previous Page / Next Page) for a table toolbar. Look: .cc-page-btn in design-system.css. */
export const PaginationControls: React.FC<PaginationControlsProps> = ({ page, totalPages, onPageChange, mobileIndicator }) => (
  <div role="group" aria-label="Pagination" className="cc-pagination-nav">
    <button
      type="button"
      disabled={page <= 1}
      onClick={() => onPageChange(Math.max(1, page - 1))}
      title="Previous Page"
      aria-label="Previous Page"
      className="cc-page-btn"
    >
      <ChevronLeft className="w-4 h-4" />
    </button>
    {mobileIndicator && (
      <span className="sm:hidden cc-muted text-[11px] font-semibold tabular-nums whitespace-nowrap px-0.5" aria-live="polite">
        {page} of {totalPages}
      </span>
    )}
    <button
      type="button"
      disabled={page >= totalPages}
      onClick={() => onPageChange(Math.min(totalPages, page + 1))}
      title="Next Page"
      aria-label="Next Page"
      className="cc-page-btn"
    >
      <ChevronRight className="w-4 h-4" />
    </button>
  </div>
);
