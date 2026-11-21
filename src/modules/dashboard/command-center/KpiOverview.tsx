import React from 'react';
import { AlertTriangle, CalendarClock, FileClock, ShieldCheck, UserCheck, Users } from 'lucide-react';
import { UPCOMING_WINDOW_LABEL, type CommandCenterKpis } from '../dashboard.metrics';
import { KpiCard } from '../../../components/page/KpiCard';
import type { TrendInput } from '../../../utils/trends';

interface KpiOverviewProps {
  kpis: CommandCenterKpis;
  /** Only the cards whose history can be rebuilt from dated records get a trend. */
  trends?: { total?: TrendInput; joined?: TrendInput };
  onNavigate: (view: string) => void;
}

const share = (part: number, whole: number) => (whole > 0 ? `${Math.round((part / whole) * 100)}%` : '0%');

export const KpiOverview: React.FC<KpiOverviewProps> = ({ kpis, trends, onNavigate }) => {
  const offerParts = [
    kpis.offersNotIssued > 0 && `${kpis.offersNotIssued} not issued`,
    kpis.offersUnsigned > 0 && `${kpis.offersUnsigned} unsigned`,
    kpis.offersDraft > 0 && `${kpis.offersDraft} draft`,
  ].filter(Boolean);

  return (
    <div className="cc-grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
      <KpiCard
        label="Total Candidates"
        value={kpis.total}
        detail={`Across ${kpis.clients} client${kpis.clients === 1 ? '' : 's'}`}
        trend={trends?.total}
        icon={Users}
        tone="info"
        onClick={() => onNavigate('directory')}
      />
      <KpiCard
        label="Joined"
        value={kpis.joined}
        detail={`${share(kpis.joined, kpis.total)} of all candidates`}
        trend={trends?.joined}
        icon={UserCheck}
        tone="good"
        onClick={() => onNavigate('directory')}
      />
      <KpiCard
        label="KYC Verified"
        value={kpis.kycVerified}
        detail={`${share(kpis.kycVerified, kpis.total)} of all candidates`}
        icon={ShieldCheck}
        tone="violet"
        onClick={() => onNavigate('kyc')}
      />
      <KpiCard
        label="Pending Offers"
        value={kpis.pendingOffers}
        detail={offerParts.length ? offerParts.join(' · ') : 'No offers pending'}
        icon={FileClock}
        tone="teal"
        onClick={() => onNavigate('offer-letters')}
      />
      <KpiCard
        label="Operational Blockers"
        value={kpis.blockers}
        detail={`Of ${kpis.activeCandidates} candidates still in onboarding`}
        icon={AlertTriangle}
        tone="bad"
        onClick={() => onNavigate('directory')}
      />
      <KpiCard
        label="Upcoming Joining"
        value={kpis.upcomingJoining}
        detail={`${kpis.joiningToday} today · ${UPCOMING_WINDOW_LABEL}`}
        icon={CalendarClock}
        tone="warn"
        onClick={() => onNavigate('directory')}
      />
    </div>
  );
};
