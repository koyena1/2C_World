import React from 'react';
import { cn } from '../../utils/cn';

interface SectionCardProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
  /** Numbered chip before the title (workflow steps). */
  step?: number;
  /** Same blue-border hover as stat cards (see .cc-card-hover in design-system.css). */
  hoverable?: boolean;
  children: React.ReactNode;
}

/** Shared content card: white surface with a title row (Candidate Pipeline, Import Categories, Recent Activity, ...). */
export const SectionCard: React.FC<SectionCardProps> = ({ title, subtitle, action, className, step, hoverable, children }) => (
  <section className={cn('cc-card p-3.5 sm:p-5 flex flex-col min-w-0', hoverable && 'cc-card-hover', className)}>
    <header className="flex items-start justify-between gap-3 mb-3 sm:mb-4">
      <div className="min-w-0 flex items-start gap-2.5">
        {step !== undefined && (
          <span className="cc-accent-chip w-6 h-6 rounded-full text-[11px] font-bold flex items-center justify-center shrink-0 tabular-nums">
            {step}
          </span>
        )}
        <div className="min-w-0">
          <h2 className="cc-title text-sm font-bold tracking-tight">{title}</h2>
          {subtitle && <p className="cc-muted text-xs mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action}
    </header>
    {children}
  </section>
);
