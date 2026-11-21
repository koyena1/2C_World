import React from 'react';
import { History } from 'lucide-react';
import type { ActivityEvent, ActivityKind } from '../dashboard.metrics';
import type { Tone } from './types';
import { Chip, EmptyNote, SectionCard } from './shared';

interface RecentActivityProps {
  events: ActivityEvent[];
}

const KIND_TONE: Record<ActivityKind, Tone> = {
  Onboarding: 'good',
  KYC: 'info',
  Offer: 'violet',
};

/** Latest onboarding, verification and offer events across the candidate list. */
export const RecentActivity: React.FC<RecentActivityProps> = ({ events }) => (
  <SectionCard
    title="Recent Activity"
    subtitle="Latest onboarding, verification and offer updates"
    className="xl:col-span-7 2xl:col-span-5 xl:order-2 2xl:order-4"
    action={
      <span className="tone-teal tone-chip w-8 h-8 rounded-lg flex items-center justify-center shrink-0" aria-hidden>
        <History className="w-4 h-4" />
      </span>
    }
  >
    {events.length === 0 ? (
      <EmptyNote>No activity recorded yet.</EmptyNote>
    ) : (
      <ul className="cc-divide">
        {events.map((e) => (
          <li key={e.id} className="flex items-start gap-3 py-2.5 first:pt-0 last:pb-0">
            <Chip tone={KIND_TONE[e.kind]} className="mt-0.5 w-[5.5rem] justify-center rounded-full shrink-0">{e.kind}</Chip>
            <div className="min-w-0 flex-1">
              <p className="cc-title text-xs font-semibold break-words">{e.title}</p>
              <p className="cc-muted text-[11px] break-words">
                {e.candidate}{e.actor ? ` · by ${e.actor}` : ''}
              </p>
            </div>
            <time className="cc-muted text-[11px] tabular-nums text-right shrink-0 max-w-[6.5rem]">{e.atLabel}</time>
          </li>
        ))}
      </ul>
    )}
  </SectionCard>
);
