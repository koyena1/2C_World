import React from 'react';
import { ChevronRight } from 'lucide-react';
import type { PendingActionMetric } from '../dashboard.metrics';
import { Chip, SectionCard } from './shared';

interface PendingActionsProps {
  actions: PendingActionMetric[];
  onNavigate: (view: string) => void;
}

export const PendingActions: React.FC<PendingActionsProps> = ({ actions, onNavigate }) => (
  <SectionCard title="Pending Actions" subtitle="Candidates still in onboarding that need attention">
    <ul className="cc-divide -mx-2">
      {actions.map((a) => (
        <li key={a.id}>
          <button
            type="button"
            onClick={() => onNavigate(a.target)}
            className="cc-row w-full flex items-center gap-3 px-2 py-2.5 rounded-lg text-left transition-colors"
          >
            <span className="min-w-0 flex-1">
              <span className="cc-title block text-xs font-semibold truncate">{a.label}</span>
              <span className="cc-muted block text-[11px] truncate">{a.hint}</span>
            </span>
            <Chip tone={a.count > 0 ? a.tone : 'muted'} className="tabular-nums min-w-8 justify-center">
              {a.count}
            </Chip>
            <ChevronRight className="cc-muted w-3.5 h-3.5 shrink-0" aria-hidden />
          </button>
        </li>
      ))}
    </ul>
    <p className="cc-muted text-[11px] mt-3">A candidate can appear in more than one row.</p>
  </SectionCard>
);
