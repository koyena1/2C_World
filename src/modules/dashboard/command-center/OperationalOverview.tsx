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
import { KpiDetailPanel } from '../../../components/page/KpiDetailPanel';
import { useKpiDetail } from '../../../hooks/useKpiDetail';
import type { Candidate } from '../../../types/onboarding';
import { buildOverviewDetail, type OverviewTileId } from './overviewDetails';
import type { TrendInput } from '../../../utils/trends';
import { accessFor, type FeatureId } from '../../hr-ops/hrOps.config';
import { UPCOMING_WINDOW_LABEL, type CommandCenterKpis, type PendingActionMetric } from '../dashboard.metrics';
import { hrOpsCounts, type OpsScope } from './HrOpsExtras';
import { CompactToggle, SectionCard } from './shared';

interface OperationalOverviewProps {
  kpis: CommandCenterKpis;
  trends: { total?: TrendInput; joined?: TrendInput; kycVerified?: TrendInput; pendingOffers?: TrendInput; blockers?: TrendInput; upcoming?: TrendInput };
  role: string;
  onNavigate: (view: string) => void;
  /** Open items across every Action Required row (the Pending Actions card). */
  pendingActions: { total: number; categories: number };
  /** Candidates for the selected dashboard period, the rows behind the candidate tiles. */
  candidates: Candidate[];
  /** Everyone as of the period's last day (for "upcoming joining", which looks ahead of the period). */
  allCandidates: Candidate[];
  /** Range the HR-operations figures are counted over. */
  opsScope: OpsScope;
  /** Last day of the selected period. */
  refDate: string;
  /** Every Action Required row (detail of the Pending Actions tile). */
  actions: PendingActionMetric[];
}

/** Cards shown on phones before "View" (the first four); from the md breakpoint up all of them are shown. */
const INITIAL_TILES = 4;

const share = (part: number, whole: number) => (whole > 0 ? `${Math.round((part / whole) * 100)}%` : '0%');

interface Stat {
  id: OverviewTileId;
  label: string;
  value: number;
  detail: string;
  icon: LucideIcon;
  tone: 'good' | 'warn' | 'bad' | 'info' | 'violet' | 'teal';
  /** Page the full list lives on; offered as "Open page" inside the detail table. */
  view?: string;
  trend?: TrendInput;
  feature?: FeatureId;
}

/**
 * Operational Overview: the secondary figures (formerly separate KPI cards) with their trends and
 * detail lines, so nothing was lost when the headline row went down to three cards.
 */
export const OperationalOverview: React.FC<OperationalOverviewProps> = ({ kpis, trends, role, onNavigate, pendingActions, candidates, allCandidates, opsScope, refDate, actions }) => {
  const [expanded, setExpanded] = useState(false);
  const { activeId, toggle, close } = useKpiDetail<OverviewTileId>();
  const c = hrOpsCounts(opsScope);
  const offerParts = [
    kpis.offersNotIssued > 0 && `${kpis.offersNotIssued} not issued`,
    kpis.offersUnsigned > 0 && `${kpis.offersUnsigned} unsigned`,
    kpis.offersDraft > 0 && `${kpis.offersDraft} draft`,
  ].filter(Boolean);

  const all: Stat[] = [
    { id: 'total', label: 'Total Candidates', value: kpis.total, detail: `Across ${kpis.clients} client${kpis.clients === 1 ? '' : 's'}`, icon: Users, tone: 'info', view: 'directory', trend: trends.total },
    { id: 'joined', label: 'Joined', value: kpis.joined, detail: `${share(kpis.joined, kpis.total)} of all candidates`, icon: UserCheck, tone: 'good', view: 'directory', trend: trends.joined },
    { id: 'pending-actions', label: 'Pending Actions', value: pendingActions.total, detail: `Open items in ${pendingActions.categories} categor${pendingActions.categories === 1 ? 'y' : 'ies'} (see Action Required)`, icon: ClipboardList, tone: 'bad' },
    { id: 'in-progress', label: 'In Progress', value: kpis.activeCandidates, detail: `${kpis.total} total − ${kpis.joined} joined − ${kpis.total - kpis.joined - kpis.activeCandidates} dropped`, icon: Hourglass, tone: 'info', view: 'directory' },
    { id: 'kyc-verified', label: 'KYC Verified', value: kpis.kycVerified, detail: `${share(kpis.kycVerified, kpis.total)} of all candidates`, icon: ShieldCheck, tone: 'violet', view: 'kyc', trend: trends.kycVerified },
    { id: 'pending-offers', label: 'Pending Offers', value: kpis.pendingOffers, detail: offerParts.length ? offerParts.join(' · ') : 'No offers pending', icon: FileClock, tone: 'teal', view: 'offer-letters', trend: trends.pendingOffers },
    { id: 'blockers', label: 'Operational Blockers', value: kpis.blockers, detail: `Of ${kpis.activeCandidates} candidates still in onboarding`, icon: AlertTriangle, tone: 'bad', view: 'directory', trend: trends.blockers },
    { id: 'upcoming', label: 'Upcoming Joining', value: kpis.upcomingJoining, detail: `${kpis.joiningToday} today · ${UPCOMING_WINDOW_LABEL}`, icon: CalendarClock, tone: 'warn', view: 'directory', trend: trends.upcoming },
    { id: 'contracts', label: 'Contracts expiring in 35 days', value: c.contractsExpiring, detail: `${c.intimationsDue} client intimation(s) due`, icon: ClipboardCheck, tone: 'warn', view: 'contract-exit', feature: 'contract-closure' },
    { id: 'regularizations', label: 'Pending regularizations', value: c.regularizations, detail: 'Target: resolved within 24 hours', icon: CalendarClock, tone: 'info', view: 'attendance', feature: 'attendance-regularization' },
    { id: 'compliance', label: 'Compliance items open', value: c.uanPending + c.esicDuplicates, detail: `${c.uanPending} UAN pending · ${c.esicDuplicates} ESIC duplicates`, icon: Scale, tone: 'bad', view: 'compliance', feature: 'uan-esic-log' },
    { id: 'exit-docs', label: 'Exit documents pending', value: c.exitDocsPending, detail: 'Exit cases missing documents', icon: LogOut, tone: 'violet', view: 'contract-exit', feature: 'exit-documentation' },
  ];
  const stats = all.filter((s) => !s.feature || accessFor(s.feature, role) !== 'none');

  const active = stats.find((s) => s.id === activeId);
  const detail = active
    ? {
        ...buildOverviewDetail(active.id, { candidates, allCandidates, scope: opsScope, refDate, actions }),
        action: active.view ? (
          <button type="button" onClick={() => onNavigate(active.view as string)} className="cc-btn cc-btn-secondary !h-8 !px-2.5">
            Open page
          </button>
        ) : undefined,
      }
    : null;

  return (
    <SectionCard
      title="Overview"
      subtitle="Onboarding and HR operations at a glance"
      action={stats.length > INITIAL_TILES ? <CompactToggle className="md:hidden" expanded={expanded} onClick={() => setExpanded((v) => !v)} collapsedLabel="View" /> : undefined}
    >
      <ul className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-2.5">
        {stats.map((s, i) => {
          return (
          <li key={s.label} className={`min-w-0 ${i >= INITIAL_TILES && !expanded ? 'hidden md:block' : ''}`}>
            <button
              type="button"
              onClick={() => toggle(s.id)}
              aria-pressed={activeId === s.id}
              className={`tone-${s.tone} ops-tile cursor-pointer w-full h-full min-h-[6.9rem] text-left rounded-xl border border-[color:var(--cc-card-border)] p-2.5 sm:p-3 flex flex-col gap-1 ${activeId === s.id ? 'cc-card-selected' : ''}`}
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
            </button>
          </li>
          );
        })}
      </ul>

      {detail && (
        <KpiDetailPanel
          className="mt-3 sm:mt-4 border-[color:var(--ops-card-border)]"
          detail={detail}
          onClose={close}
        />
      )}
    </SectionCard>
  );
};
