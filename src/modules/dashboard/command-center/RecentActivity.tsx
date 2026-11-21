import React from 'react';
import type { ActivityEvent, ActivityKind } from '../dashboard.metrics';
import { Chip, EmptyNote, SectionCard } from './shared';
import type { Tone } from './types';

interface RecentActivityProps {
  events: ActivityEvent[];
}

const KIND_TONE: Record<ActivityKind, Tone> = {
  Onboarding: 'info',
  KYC: 'violet',
  Offer: 'teal',
};

export const RecentActivity: React.FC<RecentActivityProps> = ({ events }) => (
  <SectionCard title="Recent Activity" subtitle="Latest onboarding, verification and offer updates" className="lg:col-span-2">
    {events.length === 0 ? (
      <EmptyNote>No activity recorded yet.</EmptyNote>
    ) : (
      <ul className="cc-divide">
        {events.map((e) => (
          <li key={e.id} className="flex items-start gap-3 py-2.5 first:pt-0 last:pb-0">
            <Chip tone={KIND_TONE[e.kind]} className="mt-0.5 w-20 justify-center">{e.kind}</Chip>
            <div className="min-w-0 flex-1">
              <p className="cc-title text-xs font-semibold truncate">{e.title}</p>
              <p className="cc-muted text-[11px] truncate">
                {e.candidate}{e.actor ? ` · by ${e.actor}` : ''}
              </p>
            </div>
            <time className="cc-muted text-[11px] tabular-nums shrink-0">{e.atLabel}</time>
          </li>
        ))}
      </ul>
    )}
  </SectionCard>
);
