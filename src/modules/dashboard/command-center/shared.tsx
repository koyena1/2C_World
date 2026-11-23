import React from 'react';
import { cn } from '../../../utils/cn';
import type { Tone } from './types';

export { SectionCard } from '../../../components/page/SectionCard';

interface ProgressBarProps {
  /** 0-100 */
  value: number;
  tone?: Tone;
  className?: string;
  label?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ value, tone = 'info', className, label }) => (
  <div
    className={cn('cc-track h-2 rounded-full overflow-hidden', `tone-${tone}`, className)}
    role="progressbar"
    aria-valuenow={Math.round(value)}
    aria-valuemin={0}
    aria-valuemax={100}
    aria-label={label}
  >
    <div className="tone-fill h-full rounded-full transition-[width] duration-500" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
  </div>
);

export const EmptyNote: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <p className="cc-muted text-xs py-6 text-center">{children}</p>
);

export const Chip: React.FC<{ tone: Tone; children: React.ReactNode; className?: string }> = ({ tone, children, className }) => (
  <span className={cn(`tone-${tone} tone-chip`, 'inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold whitespace-nowrap', className)}>
    {children}
  </span>
);

interface CompactToggleProps {
  expanded: boolean;
  onClick: () => void;
  /** Label while collapsed, e.g. "View More" or "View". */
  collapsedLabel: string;
  expandedLabel?: string;
  className?: string;
}

/** Small subtle expand/collapse control that sits beside a section heading. */
export const CompactToggle: React.FC<CompactToggleProps> = ({ expanded, onClick, collapsedLabel, expandedLabel = 'Show Less', className }) => (
  <button
    type="button"
    onClick={onClick}
    aria-expanded={expanded}
    className={cn(
      'inline-flex items-center gap-1 h-6 px-2 rounded-md border border-[color:var(--cc-card-border)] cc-muted text-[11px] font-semibold',
      'hover:text-[color:var(--cc-title)] hover:border-[color:var(--cc-hover-border)] transition-colors whitespace-nowrap',
      className
    )}
  >
    {expanded ? expandedLabel : collapsedLabel}
    <svg viewBox="0 0 24 24" className={cn('w-3 h-3 transition-transform', expanded && 'rotate-180')} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="m6 9 6 6 6-6" />
    </svg>
  </button>
);
