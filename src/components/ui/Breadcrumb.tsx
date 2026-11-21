import React from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface BreadcrumbItem {
  label: string;
  /** When set, the item renders as a button that calls this (used for the root). */
  onClick?: () => void;
}

interface BreadcrumbProps {
  /** Ancestors first; the LAST item is the current page and is shown as a highlighted chip. */
  items: BreadcrumbItem[];
  className?: string;
}

/** "Root › Current page" breadcrumb. Ancestors collapse away on very small screens. */
export const Breadcrumb: React.FC<BreadcrumbProps> = ({ items, className }) => (
  <nav aria-label="Breadcrumb" className={cn('flex items-center gap-2 min-w-0 text-sm', className)}>
    {items.map((item, index) => {
      const isLast = index === items.length - 1;

      return isLast ? (
        <span
          key={item.label}
          aria-current="page"
          className={cn(
            'truncate px-3 py-1 rounded-lg border font-semibold',
            'bg-slate-100 border-slate-200 text-slate-900',
            'dark:bg-slate-800 dark:border-slate-700 dark:text-slate-100'
          )}
        >
          {item.label}
        </span>
      ) : (
        <React.Fragment key={item.label}>
          {item.onClick ? (
            <button
              type="button"
              onClick={item.onClick}
              title="Go to Dashboard"
              className="hidden sm:inline shrink-0 font-medium text-slate-500 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 hover:underline underline-offset-4 cursor-pointer rounded focus-visible:outline-2 focus-visible:outline-sky-500"
            >
              {item.label}
            </button>
          ) : (
            <span className="hidden sm:inline shrink-0 font-medium text-slate-500 dark:text-slate-400">{item.label}</span>
          )}
          <ChevronRight className="hidden sm:inline w-3.5 h-3.5 shrink-0 text-slate-400" aria-hidden />
        </React.Fragment>
      );
    })}
  </nav>
);
