import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../../utils/cn';

export type KpiTone = 'good' | 'warn' | 'bad' | 'info' | 'violet' | 'teal' | 'muted';

interface KpiCardProps {
  label: string;
  value: React.ReactNode;
  detail?: string;
  icon: LucideIcon;
  tone: KpiTone;
  /** Makes the card a button. */
  onClick?: () => void;
  className?: string;
}

/** Dashboard-style KPI tile: label + tinted icon, large value, small detail line. */
export const KpiCard: React.FC<KpiCardProps> = ({ label, value, detail, icon: Icon, tone, onClick, className }) => {
  const content = (
    <>
      <div className="flex items-center justify-between gap-2">
        <span className="cc-muted text-[11px] sm:text-xs font-semibold leading-tight">{label}</span>
        <span className="tone-chip w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4" />
        </span>
      </div>
      <div>
        <div className="cc-title text-2xl sm:text-3xl font-bold tracking-tight leading-none tabular-nums">{value}</div>
        {detail && <p className="cc-muted text-[10px] sm:text-[11px] mt-1 sm:mt-2 leading-snug line-clamp-2 sm:line-clamp-none">{detail}</p>}
      </div>
    </>
  );
  const base = cn('cc-card cc-card-hover text-left p-3 sm:p-4 flex flex-col gap-2 sm:gap-3 min-w-0', `tone-${tone}`, className);

  return onClick ? (
    <button type="button" onClick={onClick} className={cn(base, 'cc-card-link')}>
      {content}
    </button>
  ) : (
    <div className={base}>{content}</div>
  );
};
