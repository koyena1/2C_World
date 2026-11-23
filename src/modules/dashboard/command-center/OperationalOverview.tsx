import React, { useState } from 'react';
import {
  AlertTriangle,
  CalendarClock,
  ClipboardCheck,
  ClipboardList,
  FileClock,
  Hourglass,
  LogOut,
  Scale,
  ShieldCheck,
  UserCheck,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { TrendBadge } from '../../../components/page/TrendBadge';
import type { TrendInput } from '../../../utils/trends';
import { accessFor, type FeatureId } from '../../hr-ops/hrOps.config';
import { UPCOMING_WINDOW_LABEL, type CommandCenterKpis } from '../dashboard.metrics';
import { hrOpsCounts } from './HrOpsExtras';
import { CompactToggle, SectionCard } from './shared';

interface OperationalOverviewProps {
  kpis: CommandCenterKpis;
  trends: { total?: TrendInput; joined?: TrendInput; kycVerified?: TrendInput; pendingOffers?: TrendInput; blockers?: TrendInput; upcoming?: TrendInput };
  role: string;
  onNavigate: (view: string) => void;
  /** Open items across every Action Required row (the Pending Actions card). */
  pendingActions: { total: number; categories: number };
}

/** Cards shown on phones before "View" (the first four); from the md breakpoint up all of them are shown. */
const INITIAL_TILES = 4;

const share = (part: number, whole: number) => (whole > 0 ? `${Math.round((part / whole) * 100)}%` : '0%');

interface Stat {
  label: string;
  value: number;
  detail: string;
  icon: LucideIcon;
  tone: 'good' | 'warn' | 'bad' | 'info' | 'violet' | 'teal';
  /** Page the card opens; omit for a card that is not a link. */
  view?: string;
  trend?: TrendInput;
  feature?: FeatureId;
}

/**
 * Operational Overview: the secondary figures (formerly separate KPI cards) with their trends and
 * detail lines, so nothing was lost when the headline row went down to three cards.
 */
export const OperationalOverview: React.FC<OperationalOverviewProps> = ({ kpis, trends, role, onNavigate, pendingActions }) => {
  const [expanded, setExpanded] = useState(false);
  const c = hrOpsCounts();
  const offerParts = [
    kpis.offersNotIssued > 0 && `${kpis.offersNotIssued} not issued`,
    kpis.offersUnsigned > 0 && `${kpis.offersUnsigned} unsigned`,
    kpis.offersDraft > 0 && `${kpis.offersDraft} draft`,
  ].filter(Boolean);

  const all: Stat[] = [
    { label: 'Total Candidates', value: kpis.total, detail: `Across ${kpis.clients} client${kpis.clients === 1 ? '' : 's'}`, icon: Users, tone: 'info', view: 'directory', trend: trends.total },
    { label: 'Joined', value: kpis.joined, detail: `${share(kpis.joined, kpis.total)} of all candidates`, icon: UserCheck, tone: 'good', view: 'directory', trend: trends.joined },
    { label: 'Pending Actions', value: pendingActions.total, detail: `Open items in ${pendingActions.categories} categor${pendingActions.categories === 1 ? 'y' : 'ies'} (see Action Required)`, icon: ClipboardList, tone: 'bad' },
    { label: 'In Progress', value: kpis.activeCandidates, detail: `${kpis.total} total − ${kpis.joined} joined − ${kpis.total - kpis.joined - kpis.activeCandidates} dropped`, icon: Hourglass, tone: 'info', view: 'directory' },
    { label: 'KYC Verified', value: kpis.kycVerified, detail: `${share(kpis.kycVerified, kpis.total)} of all candidates`, icon: ShieldCheck, tone: 'violet', view: 'kyc', trend: trends.kycVerified },
    { label: 'Pending Offers', value: kpis.pendingOffers, detail: offerParts.length ? offerParts.join(' · ') : 'No offers pending', icon: FileClock, tone: 'teal', view: 'offer-letters', trend: trends.pendingOffers },
    { label: 'Operational Blockers', value: kpis.blockers, detail: `Of ${kpis.activeCandidates} candidates still in onboarding`, icon: AlertTriangle, tone: 'bad', view: 'directory', trend: trends.blockers },
    { label: 'Upcoming Joining', value: kpis.upcomingJoining, detail: `${kpis.joiningToday} today · ${UPCOMING_WINDOW_LABEL}`, icon: CalendarClock, tone: 'warn', view: 'directory', trend: trends.upcoming },
    { label: 'Contracts expiring in 35 days', value: c.contractsExpiring, detail: `${c.intimationsDue} client intimation(s) due`, icon: ClipboardCheck, tone: 'warn', view: 'contract-exit', feature: 'contract-closure' },
    { label: 'Pending regularizations', value: c.regularizations, detail: 'Target: resolved within 24 hours', icon: CalendarClock, tone: 'info', view: 'attendance', feature: 'attendance-regularization' },
    { label: 'Compliance items open', value: c.uanPending + c.esicDuplicates, detail: `${c.uanPending} UAN pending · ${c.esicDuplicates} ESIC duplicates`, icon: Scale, tone: 'bad', view: 'compliance', feature: 'uan-esic-log' },
    { label: 'Exit documents pending', value: c.exitDocsPending, detail: 'Exit cases missing documents', icon: LogOut, tone: 'violet', view: 'contract-exit', feature: 'exit-documentation' },
  ];
  const stats = all.filter((s) => !s.feature || accessFor(s.feature, role) !== 'none');

  return (
    <SectionCard
      title="Overview"
      subtitle="Onboarding and HR operations at a glance"
      action={stats.length > INITIAL_TILES ? <CompactToggle className="md:hidden" expanded={expanded} onClick={() => setExpanded((v) => !v)} collapsedLabel="View" /> : undefined}
    >
      <ul className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-2.5">
        {stats.map((s, i) => {
          const TileTag = s.view ? 'button' : 'div';
          return (
          <li key={s.label} className={`min-w-0 ${i >= INITIAL_TILES && !expanded ? 'hidden md:block' : ''}`}>
            <TileTag
              {...(s.view ? { type: 'button' as const, onClick: () => onNavigate(s.view as string) } : {})}
              className={`tone-${s.tone} ops-tile w-full h-full min-h-[6.9rem] text-left rounded-xl border border-[color:var(--cc-card-border)] p-2.5 sm:p-3 flex flex-col gap-1`}
            >
              <span className="flex items-center justify-between gap-2">
                <span className="cc-muted text-[11px] font-semibold leading-tight">{s.label}</span>
                <span className="tone-chip w-6 h-6 rounded-md flex items-center justify-center shrink-0">
                  <s.icon className="w-3.5 h-3.5" aria-hidden />
                </span>
              </span>
              <span className="cc-title text-xl font-bold tabular-nums leading-none">{s.value}</span>
              <span className="cc-muted text-[10px] leading-snug">{s.detail}</span>
              {s.trend && <TrendBadge {...s.trend} />}
            </TileTag>
          </li>
          );
        })}
      </ul>
    </SectionCard>
  );
};
