import React from 'react';
import type { RecruiterMetric } from '../dashboard.metrics';
import { Avatar } from '../../../components/ui/Avatar';
import { ProgressBar, SectionCard } from './shared';

interface RecruiterPerformanceProps {
  recruiters: RecruiterMetric[];
}

const Stat: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <div className="text-center">
    <div className="cc-title text-sm font-bold tabular-nums">{value}</div>
    <div className="cc-muted text-[10px]">{label}</div>
  </div>
);

export const RecruiterPerformance: React.FC<RecruiterPerformanceProps> = ({ recruiters }) => (
  <SectionCard
    title="Recruiter Performance"
    subtitle="Candidates handled by each recruiter"
    className="lg:col-span-1"
  >
    <ul className="cc-divide">
      {recruiters.map((r) => (
        <li key={r.name} className="py-3 first:pt-0 last:pb-0">
          <div className="flex items-center gap-3">
            <Avatar initials={r.name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()} size="md" />
            <div className="min-w-0 flex-1">
              <p className="cc-title text-xs font-semibold truncate">{r.name}</p>
              <p className="cc-muted text-[11px]">Join rate {r.joinRatePct}%</p>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-3 mt-3 pl-12">
            <Stat label="Handled" value={r.handled} />
            <Stat label="Joined" value={r.joined} />
            <Stat label="Pending" value={r.pending} />
            <Stat label="Dropped" value={r.dropped} />
          </div>
          <ProgressBar value={r.joinRatePct} tone="good" className="mt-3" label={`${r.name} join rate`} />
        </li>
      ))}
    </ul>
  </SectionCard>
);
