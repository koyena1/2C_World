import React from 'react';
import type { Tone } from '../../modules/dashboard/command-center/types';

export interface DonutSlice {
  key: string;
  label: string;
  count: number;
  tone: Tone;
}

interface DonutChartProps {
  slices: DonutSlice[];
  total: number;
  /** Small caption under the total in the centre of the ring. */
  caption: string;
  ariaLabel: string;
}

const RADIUS = 38;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/** Shared SVG donut + legend (Dashboard joining status, Bulk Import categories, ...). No chart library needed. */
export const DonutChart: React.FC<DonutChartProps> = ({ slices, total, caption, ariaLabel }) => {
  let offset = 0;
  return (
    <div className="flex flex-col sm:flex-row items-center gap-4">
      <div className="relative w-28 h-28 shrink-0">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90" role="img" aria-label={ariaLabel}>
          <circle cx="50" cy="50" r={RADIUS} fill="none" strokeWidth="12" style={{ stroke: 'var(--cc-track)' }} />
          {total > 0 &&
            slices.map((s) => {
              const length = (s.count / total) * CIRCUMFERENCE;
              const circle = (
                <circle
                  key={s.key}
                  cx="50"
                  cy="50"
                  r={RADIUS}
                  fill="none"
                  strokeWidth="12"
                  strokeDasharray={`${length} ${CIRCUMFERENCE - length}`}
                  strokeDashoffset={-offset}
                  style={{ stroke: `var(--cc-${s.tone})` }}
                />
              );
              offset += length;
              return circle;
            })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="cc-title text-xl font-bold leading-none tabular-nums">{total}</span>
          <span className="cc-muted text-[10px] mt-1">{caption}</span>
        </div>
      </div>

      <ul className="space-y-1.5 text-xs w-full min-w-0">
        {slices.map((s) => (
          <li key={s.key} className={`tone-${s.tone} flex items-center gap-2`}>
            <span className="tone-fill w-2 h-2 rounded-full shrink-0" />
            <span className="cc-text flex-1 leading-tight">{s.label}</span>
            <span className="cc-title font-semibold tabular-nums">{s.count}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};
