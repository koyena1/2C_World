import React, { useMemo, useState } from 'react';
import { LayoutDashboard, PlusCircle } from 'lucide-react';
import type { Candidate } from '../../types/onboarding';
import {
  computeClientMetrics,
  computeJoiningOverview,
  computeKpis,
  computePendingActions,
  computePipeline,
  computeRecentActivity,
  computeRecruiterMetrics,
  computeStatusMix,
  DASHBOARD_REFERENCE_DATE,
} from './dashboard.metrics';
import { PageHeader } from '../../components/page/PageHeader';
import { SelectMenu } from '../../components/ui/SelectMenu';
import {
  blockersTrend,
  joinedTrend,
  kycVerifiedTrend,
  pendingOffersTrend,
  totalCandidatesTrend,
  upcomingJoiningTrend,
} from '../../utils/candidateTrends';
import { CandidatePipeline } from './command-center/CandidatePipeline';
import { ClientAnalytics } from './command-center/ClientAnalytics';
import { JoiningOverview } from './command-center/JoiningOverview';
import { hrOpsActions } from './command-center/HrOpsExtras';
import { OperationalOverview } from './command-center/OperationalOverview';
import { PendingActions } from './command-center/PendingActions';
import { RecentActivity } from './command-center/RecentActivity';
import { RecruiterPerformance } from './command-center/RecruiterPerformance';

interface HrOpsDashboardProps {
  /** Live candidate list: every figure on this page is derived from it. */
  candidates: Candidate[];
  onNavigate: (view: string) => void;
  onOpenInviteModal?: () => void;
  onOpenCandidateProfile?: (candidateId: string) => void;
  /** Active role: decides which module shortcuts are shown. */
  role: string;
}

const formatReferenceDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

/**
 * HR Operations Command Center.
 * Thin composition layer: metrics come from dashboard.metrics.ts, each section is its
 * own component in ./command-center, colours come from styles/design-system.css.
 *
 * Reading order = daily priority: KPIs -> what needs action + who joins next -> funnel and
 * client health -> recruiters and the activity feed. The Client / Recruiter filters simply
 * narrow the candidate list that every figure is computed from.
 */
export const HrOpsDashboard: React.FC<HrOpsDashboardProps> = ({
  candidates: allCandidates,
  onNavigate,
  onOpenInviteModal,
  onOpenCandidateProfile,
  role,
}) => {
  const [clientFilter, setClientFilter] = useState<string>('');
  const [recruiterFilter, setRecruiterFilter] = useState<string>('');

  const clientOptions = useMemo(() => [...new Set(allCandidates.map((c) => c.clientName))].sort(), [allCandidates]);
  const recruiterOptions = useMemo(() => [...new Set(allCandidates.map((c) => c.recruiterName))].sort(), [allCandidates]);

  const candidates = useMemo(
    () =>
      allCandidates.filter(
        (c) => (!clientFilter || c.clientName === clientFilter) && (!recruiterFilter || c.recruiterName === recruiterFilter)
      ),
    [allCandidates, clientFilter, recruiterFilter]
  );

  const kpis = useMemo(() => computeKpis(candidates), [candidates]);
  const kpiTrends = useMemo(
    () => ({
      total: totalCandidatesTrend(candidates),
      joined: joinedTrend(candidates),
      kycVerified: kycVerifiedTrend(candidates),
      pendingOffers: pendingOffersTrend(candidates),
      blockers: blockersTrend(candidates),
      upcoming: upcomingJoiningTrend(candidates),
    }),
    [candidates]
  );
  const pipeline = useMemo(() => computePipeline(candidates), [candidates]);
  const statusMix = useMemo(() => computeStatusMix(candidates), [candidates]);
  const pendingActions = useMemo(() => [...computePendingActions(candidates), ...hrOpsActions(role)], [candidates, role]);
  const clients = useMemo(() => computeClientMetrics(candidates), [candidates]);
  const recruiters = useMemo(() => computeRecruiterMetrics(candidates), [candidates]);
  const joining = useMemo(() => computeJoiningOverview(candidates), [candidates]);
  const activity = useMemo(() => computeRecentActivity(candidates, 5), [candidates]);

  return (
    <div className="ops-dashboard flex-1 flex flex-col">
      <PageHeader
        icon={LayoutDashboard}
        title="HR Operations Command Center"
        subtitle={`Monitor onboarding, resolve issues and ensure joining readiness · as of ${formatReferenceDate(DASHBOARD_REFERENCE_DATE)}`}
        actions={
          <>
            <div className="min-w-[9.5rem] flex-1 sm:flex-none">
              <label htmlFor="dash-client" className="cc-muted block text-[10px] font-semibold mb-0.5">Client Account</label>
              <SelectMenu id="dash-client" value={clientFilter} onChange={(e) => setClientFilter(e.target.value)} className="cc-input">
                <option value="">All Clients</option>
                {clientOptions.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </SelectMenu>
            </div>
            <div className="min-w-[9.5rem] flex-1 sm:flex-none">
              <label htmlFor="dash-recruiter" className="cc-muted block text-[10px] font-semibold mb-0.5">Recruiter</label>
              <SelectMenu id="dash-recruiter" value={recruiterFilter} onChange={(e) => setRecruiterFilter(e.target.value)} className="cc-input">
                <option value="">All Recruiters</option>
                {recruiterOptions.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </SelectMenu>
            </div>
            {onOpenInviteModal && (
              <button
                type="button"
                onClick={onOpenInviteModal}
                className="cc-btn cc-btn-primary w-full sm:w-auto sm:self-end"
                title="Send digital onboarding invitation link to new joiner"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                Invite Candidate
              </button>
            )}
          </>
        }
      />

      <div className="cc-container cc-stack py-5">
        {/* 1. Overview: the three primary KPIs first, then the operational figures */}
        <OperationalOverview
          kpis={kpis}
          trends={kpiTrends}
          role={role}
          pendingActions={{ total: pendingActions.reduce((n, a) => n + a.count, 0), categories: pendingActions.filter((a) => a.count > 0).length }}
          onNavigate={onNavigate}
        />

        {/* 2. Two independent columns from xl up (each card keeps its own height, so expanding Action Required
            only lengthens the left column and the right column's cards sit directly under each other: no gaps).
            Below xl the column wrappers disappear (display: contents) and the cards stack in the order set by their order-N classes. */}
        <div className="cc-grid grid-cols-1 xl:grid-cols-12 items-start">
          <div className="contents xl:flex xl:flex-col xl:col-span-4 xl:gap-[var(--cc-gap)] xl:min-w-0">
            <PendingActions actions={pendingActions} onNavigate={onNavigate} />
            <CandidatePipeline stages={pipeline} statusMix={statusMix} total={kpis.total} />
            <RecentActivity events={activity} />
          </div>
          <div className="contents xl:flex xl:flex-col xl:col-span-8 xl:gap-[var(--cc-gap)] xl:min-w-0">
            <JoiningOverview
              data={joining}
              onOpenCandidate={(id) => (onOpenCandidateProfile ? onOpenCandidateProfile(id) : onNavigate('directory'))}
            />
            <ClientAnalytics clients={clients} />
            <RecruiterPerformance recruiters={recruiters} />
          </div>
        </div>
      </div>
    </div>
  );
};
