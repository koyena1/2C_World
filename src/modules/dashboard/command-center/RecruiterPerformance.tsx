import React from 'react';
import { UserRound } from 'lucide-react';
import type { RecruiterMetric } from '../dashboard.metrics';
import { Avatar } from '../../../components/ui/Avatar';
import { ProgressBar, SectionCard } from './shared';

interface RecruiterPerformanceProps {
  recruiters: RecruiterMetric[];
}

const num = 'text-right tabular-nums';

/** One row per recruiter: how many candidates they handle and how many join. */
export const RecruiterPerformance: React.FC<RecruiterPerformanceProps> = ({ recruiters }) => (
  <SectionCard
    title="Recruiter Performance"
    subtitle="Key onboarding metrics by recruiter"
    className="order-5 xl:order-none"
    action={
      <span className="tone-info tone-chip w-8 h-8 rounded-lg flex items-center justify-center shrink-0" aria-hidden>
        <UserRound className="w-4 h-4" />
      </span>
    }
  >
    <div className="cc-table-wrap">
      <table className="cc-table cc-table-compact">
        <thead>
          <tr>
            <th>Recruiter</th>
            <th className={num}>Handled</th>
            <th className={num}>Joined</th>
            <th className={num}>Pending</th>
            <th className={num}>Dropped</th>
            <th className="min-w-[8.5rem]">Join Rate</th>
          </tr>
        </thead>
        <tbody>
          {recruiters.map((r) => (
            <tr key={r.name}>
              <td>
                <span className="flex items-center gap-2.5 whitespace-nowrap">
                  <Avatar initials={r.name.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase()} size="sm" />
                  <span className="cc-title font-semibold">{r.name}</span>
                </span>
              </td>
              <td className={`${num} cc-title font-semibold`}>{r.handled}</td>
              <td className={num}>{r.joined}</td>
              <td className={num}>{r.pending}</td>
              <td className={num}>{r.dropped}</td>
              <td>
                <div className="flex items-center gap-2">
                  <span className="cc-muted tabular-nums text-[11px] w-9 text-right shrink-0">{r.joinRatePct}%</span>
                  <ProgressBar value={r.joinRatePct} tone="good" className="flex-1 min-w-[3.5rem]" label={`${r.name} join rate`} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </SectionCard>
);
