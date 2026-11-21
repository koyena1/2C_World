import React from 'react';
import { cn } from '../../utils/cn';

export interface CategoryTab {
  /** Value reported to onChange. */
  value: string;
  label: string;
  /** Shown as a red badge on the tab's top-right corner. Omit to hide. */
  count?: number;
}

interface CategoryTabsProps {
  tabs: CategoryTab[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

/** The standard category switcher (All Categories, Candidate Lifecycle, ...). Look lives in design-system.css (.cc-tab, .cc-count-badge). */
export const CategoryTabs: React.FC<CategoryTabsProps> = ({ tabs, value, onChange, className }) => (
  <div className={cn('cc-tabs', className)} role="tablist">
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
);
