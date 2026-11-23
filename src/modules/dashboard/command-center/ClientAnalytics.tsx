import React from 'react';
import { Building2 } from 'lucide-react';
import type { ClientMetric } from '../dashboard.metrics';
import { ProgressBar, SectionCard } from './shared';

interface ClientAnalyticsProps {
  clients: ClientMetric[];
}

const num = 'text-right tabular-nums';

/** One row per client: volumes, blockers and how much of the client's pool has joined. */
export const ClientAnalytics: React.FC<ClientAnalyticsProps> = ({ clients }) => (
  <SectionCard
    title="Client-wise Analytics"
    subtitle="Onboarding progress and issues by client"
    className="order-4 xl:order-none"
    action={
      <span className="tone-violet tone-chip w-8 h-8 rounded-lg flex items-center justify-center shrink-0" aria-hidden>
        <Building2 className="w-4 h-4" />
      </span>
    }
  >
    <div className="cc-table-wrap">
      <table className="cc-table cc-table-compact">
        <thead>
          <tr>
            <th>Client</th>
            <th className={num}>Total</th>
            <th className={num}>Joined</th>
            <th className={num}>Onboarding</th>
            <th className={num}>Dropped</th>
            <th className={num}>KYC Verified</th>
            <th className={num}>Blocked</th>
            <th className="min-w-[7rem]">Joined %</th>
          </tr>
        </thead>
        <tbody>
          {clients.map((c) => {
            const joinedPct = c.total > 0 ? Math.round((c.joined / c.total) * 1000) / 10 : 0;
            return (
              <tr key={c.clientId}>
                <td className="cc-title font-semibold max-w-[9.5rem] truncate" title={c.clientName}>{c.clientName}</td>
                <td className={`${num} cc-title font-semibold`}>{c.total}</td>
                <td className={num}>{c.joined}</td>
                <td className={num}>{c.inProgress}</td>
                <td className={num}>{c.dropped}</td>
                <td className={num}>{c.kycVerified}</td>
                <td className={`${num} font-semibold ${c.blockers > 0 ? 'tone-bad tone-text' : 'cc-muted'}`}>{c.blockers}</td>
                <td>
                  <div className="flex items-center gap-2">
                    <span className="cc-muted tabular-nums text-[11px] w-10 text-right shrink-0">{joinedPct}%</span>
                    <ProgressBar value={joinedPct} tone="good" className="flex-1 min-w-[2.5rem]" label={`${c.clientName} joined`} />
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  </SectionCard>
);
