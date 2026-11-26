import React from 'react';
import { ArrowDown, ArrowUp, Minus } from 'lucide-react';
import { cn } from '../../utils/cn';
import { computeTrend, PERIOD_LABEL, type TrendInput } from '../../utils/trends';

export type TrendBadgeProps = TrendInput & { className?: string };

/**
 * "↑ +12% vs last month". Green = good for the business, red = bad, grey = no change / neutral.
 * Renders NOTHING when a percentage can't be computed honestly (no earlier value to compare to),
 * so cards never show a made-up or misleading figure.
 */
export const TrendBadge: React.FC<TrendBadgeProps> = ({ className, ...input }) => {
  const trend = computeTrend(input);
  if (!trend) return null;

  const Icon = trend.direction === 'up' ? ArrowUp : trend.direction === 'down' ? ArrowDown : Minus;
  const tone = trend.outcome === 'good' ? 'tone-good' : trend.outcome === 'bad' ? 'tone-bad' : 'tone-muted';
  const period = input.periodLabel ?? PERIOD_LABEL[input.period];
  const meaning =
    trend.outcome === 'good' ? ', an improvement' : trend.outcome === 'bad' ? ', a decline' : '';

  return (
    <p
      className={cn(tone, 'flex flex-wrap items-center gap-x-1 gap-y-0 text-[11px] leading-tight font-semibold tabular-nums', className)}
      aria-label={`${trend.direction === 'flat' ? 'No change' : `${trend.direction === 'up' ? 'Up' : 'Down'} ${trend.text.replace(/^[+-]/, '')}`} ${period}${meaning}`}
    >
      <Icon className="tone-text w-3 h-3 shrink-0" strokeWidth={2.75} aria-hidden />
      <span className="tone-text">{trend.text}</span>
      <span className="cc-muted font-normal">{period}</span>
    </p>
  );
};
