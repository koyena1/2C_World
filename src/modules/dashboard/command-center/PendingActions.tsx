import React, { useState } from 'react';
import { ChevronRight, AlertTriangle } from 'lucide-react';
import type { PendingActionMetric } from '../dashboard.metrics';
import { Chip, CompactToggle, SectionCard } from './shared';

interface PendingActionsProps {
  actions: PendingActionMetric[];
  onNavigate: (view: string) => void;
}

const INITIAL_ROWS = 4;

/** Everyday HR to-do list: each row opens the screen where the issue is resolved. */
export const PendingActions: React.FC<PendingActionsProps> = ({ actions, onNavigate }) => {
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? actions : actions.slice(0, INITIAL_ROWS);
  const more = actions.length - INITIAL_ROWS;

  return (
  <SectionCard
    title="Action Required"
    subtitle="Candidates in onboarding with pending issues"
    className="order-1 xl:order-none"
    action={
      <div className="flex items-center gap-2 shrink-0">
        {more > 0 && <CompactToggle expanded={expanded} onClick={() => setExpanded((v) => !v)} collapsedLabel="View More" />}
        <span className="tone-bad tone-chip w-8 h-8 rounded-lg flex items-center justify-center shrink-0" aria-hidden>
          <AlertTriangle className="w-4 h-4" />
        </span>
      </div>
    }
  >
    <ul className="cc-divide -mx-1">
      {shown.map((a) => (
        <li key={a.id}>
          <button
            type="button"
            onClick={() => onNavigate(a.target)}
            className="cc-row w-full flex items-center gap-3 px-2 py-2.5 rounded-lg text-left transition-colors"
          >
            <span className="min-w-0 flex-1">
              <span className={`block text-[13px] font-semibold truncate ${a.count > 0 ? 'cc-title' : 'cc-muted'}`}>{a.label}</span>
              <span className="cc-muted block text-[11px] truncate">{a.hint}</span>
            </span>
            <Chip tone={a.count > 0 ? a.tone : 'muted'} className="tabular-nums min-w-9 justify-center rounded-full text-xs">
              {a.count}
            </Chip>
            <ChevronRight className="cc-muted w-4 h-4 shrink-0" aria-hidden />
          </button>
        </li>
      ))}
    </ul>
    {expanded && <p className="cc-muted text-[11px] mt-auto pt-3">A candidate can appear in more than one row.</p>}
  </SectionCard>
  );
};
