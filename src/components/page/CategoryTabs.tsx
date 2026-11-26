import React, { useEffect, useRef } from 'react';
import { cn } from '../../utils/cn';
import { SelectMenu } from '../ui/SelectMenu';

export interface CategoryTab {
  /** Value reported to onChange. */
  value: string;
  label: React.ReactNode;
  /** Shown as a red badge on the tab's top-right corner. Omit to hide. */
  count?: number;
}

type Breakpoint = 'sm' | 'md' | 'lg';

interface CategoryTabsProps {
  tabs: CategoryTab[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
  /** Below this breakpoint the tabs collapse into one dropdown (no sideways scrolling). Omit to always show tabs. */
  selectBelow?: Breakpoint;
}

// Literal class names so Tailwind can see them.
const SELECT_ONLY: Record<Breakpoint, string> = { sm: 'sm:hidden', md: 'md:hidden', lg: 'lg:hidden' };
// `!` because .cc-tabs sets display:flex in plain CSS, which would otherwise beat the utility.
const TABS_ONLY: Record<Breakpoint, string> = { sm: '!hidden sm:!flex', md: '!hidden md:!flex', lg: '!hidden lg:!flex' };

/** The standard category switcher (All Categories, Candidate Lifecycle, ...). Look lives in design-system.css (.cc-tab, .cc-count-badge). */
export const CategoryTabs: React.FC<CategoryTabsProps> = ({ tabs, value, onChange, className, selectBelow }) => {
  const listRef = useRef<HTMLDivElement>(null);
  const firstRun = useRef(true);

  // When the selection changes (e.g. "Save & next"), scroll that chip into view inside the row only.
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    const list = listRef.current;
    const active = list?.querySelector<HTMLElement>('[aria-selected="true"]');
    if (!list || !active) return;
    const target = active.offsetLeft - (list.clientWidth - active.offsetWidth) / 2;
    list.scrollTo({ left: Math.max(0, target), behavior: 'smooth' });
  }, [value]);

  return (
    <>
      {selectBelow && (
        <div className={cn('w-full min-w-0', SELECT_ONLY[selectBelow], className)}>
          <SelectMenu value={value} onChange={(e) => onChange(e.target.value)} aria-label="Section" className="cc-input font-semibold">
            {tabs.map((t) => (
              <option key={t.value} value={t.value}>
                {typeof t.label === 'string' ? t.label : t.value}
                {t.count !== undefined ? ` (${t.count})` : ''}
              </option>
            ))}
          </SelectMenu>
        </div>
      )}
      <div ref={listRef} className={cn('cc-tabs', selectBelow && TABS_ONLY[selectBelow], className)} role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={tab.value === value}
            onClick={() => onChange(tab.value)}
            className={cn('cc-tab', tab.value === value && 'cc-tab-active')}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className="cc-count-badge" aria-label={`${tab.count} items`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>
    </>
  );
};
