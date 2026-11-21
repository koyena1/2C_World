import React from 'react';
import { ChevronRight, AlertTriangle } from 'lucide-react';
import type { PendingActionMetric } from '../dashboard.metrics';
import { Chip, SectionCard } from './shared';

interface PendingActionsProps {
  actions: PendingActionMetric[];
  onNavigate: (view: string) => void;
}

/** Everyday HR to-do list: each row opens the screen where the issue is resolved. */
export const PendingActions: React.FC<PendingActionsProps> = ({ actions, onNavigate }) => (
  <SectionCard
    title="Action Required"
    subtitle="Candidates in onboarding with pending issues"
    className="xl:col-span-4"
    action={
      <span className="tone-bad tone-chip w-8 h-8 rounded-lg flex items-center justify-center shrink-0" aria-hidden>
        <AlertTriangle className="w-4 h-4" />
      </span>
    }
  >
    <ul className="cc-divide -mx-1">
      {actions.map((a) => (
        <li key={a.id}>
          <button
            type="button"
            onClick={() => onNavigate(a.target)}
            className="cc-row w-full flex items-center gap-3 px-2 py-3 rounded-lg text-left transition-colors"
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
    <p className="cc-muted text-[11px] mt-auto pt-3">A candidate can appear in more than one row.</p>
  </SectionCard>
);
