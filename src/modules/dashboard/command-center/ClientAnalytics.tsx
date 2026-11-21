import React from 'react';
import type { ClientMetric } from '../dashboard.metrics';
import { Chip, SectionCard } from './shared';

interface ClientAnalyticsProps {
  clients: ClientMetric[];
}

const Legend: React.FC<{ tone: string; label: string }> = ({ tone, label }) => (
  <span className={`tone-${tone} inline-flex items-center gap-1.5`}>
    <span className="tone-fill w-2 h-2 rounded-full" />
    <span className="cc-muted text-[11px]">{label}</span>
  </span>
);

export const ClientAnalytics: React.FC<ClientAnalyticsProps> = ({ clients }) => {
  const max = Math.max(1, ...clients.map((c) => c.total));

  return (
    <SectionCard
      title="Client-wise Analytics"
      subtitle="Candidate distribution and onboarding progress by client"
      className="lg:col-span-2"
      action={
        <div className="hidden sm:flex items-center gap-3 shrink-0">
          <Legend tone="good" label="Joined" />
          <Legend tone="info" label="In onboarding" />
          <Legend tone="bad" label="Dropped / deferred" />
        </div>
      }
    >
      <ul className="space-y-4">
        {clients.map((c) => (
          <li key={c.clientId}>
            <div className="flex items-center justify-between gap-3 mb-1.5">
              <span className="cc-title text-xs font-semibold truncate">{c.clientName}</span>
              <span className="flex items-center gap-2 shrink-0">
                {c.blockers > 0 && <Chip tone="bad">{c.blockers} blocked</Chip>}
                <span className="cc-muted text-[11px] tabular-nums">
                  <span className="cc-title font-bold">{c.total}</span> candidates
                </span>
              </span>
            </div>

            {/* Bar length = share of the largest client; segments = status split */}
            <div className="cc-track h-2.5 rounded-full overflow-hidden flex" style={{ width: `${(c.total / max) * 100}%`, minWidth: '3rem' }}>
              <div className="tone-good tone-fill h-full" style={{ width: `${(c.joined / c.total) * 100}%` }} title={`${c.joined} joined`} />
              <div className="tone-info tone-fill h-full" style={{ width: `${(c.inProgress / c.total) * 100}%` }} title={`${c.inProgress} in onboarding`} />
              <div className="tone-bad tone-fill h-full" style={{ width: `${(c.dropped / c.total) * 100}%` }} title={`${c.dropped} dropped or deferred`} />
            </div>

            <p className="cc-muted text-[11px] mt-1.5 tabular-nums">
              {c.joined} joined · {c.inProgress} in onboarding · {c.dropped} dropped/deferred · {c.kycVerified} KYC verified
            </p>
          </li>
        ))}
      </ul>
    </SectionCard>
  );
};
