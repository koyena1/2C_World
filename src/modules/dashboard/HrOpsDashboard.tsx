import React, { useMemo } from 'react';
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
import { CandidatePipeline } from './command-center/CandidatePipeline';
import { ClientAnalytics } from './command-center/ClientAnalytics';
import { JoiningOverview } from './command-center/JoiningOverview';
import { KpiOverview } from './command-center/KpiOverview';
import { PendingActions } from './command-center/PendingActions';
import { RecentActivity } from './command-center/RecentActivity';
import { RecruiterPerformance } from './command-center/RecruiterPerformance';

interface HrOpsDashboardProps {
  /** Live candidate list: every figure on this page is derived from it. */
  candidates: Candidate[];
  onNavigate: (view: string) => void;
  onOpenInviteModal?: () => void;
  onOpenCandidateProfile?: (candidateId: string) => void;
}

const formatReferenceDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

/**
 * HR Operations Command Center.
 * Thin composition layer: metrics come from dashboard.metrics.ts, each section is its
 * own component in ./command-center, colours come from styles/design-system.css.
 */
export const HrOpsDashboard: React.FC<HrOpsDashboardProps> = ({
  candidates,
  onNavigate,
  onOpenInviteModal,
  onOpenCandidateProfile,
}) => {
  const kpis = useMemo(() => computeKpis(candidates), [candidates]);
  const pipeline = useMemo(() => computePipeline(candidates), [candidates]);
  const statusMix = useMemo(() => computeStatusMix(candidates), [candidates]);
  const pendingActions = useMemo(() => computePendingActions(candidates), [candidates]);
  const clients = useMemo(() => computeClientMetrics(candidates), [candidates]);
  const recruiters = useMemo(() => computeRecruiterMetrics(candidates), [candidates]);
  const joining = useMemo(() => computeJoiningOverview(candidates), [candidates]);
  const activity = useMemo(() => computeRecentActivity(candidates), [candidates]);

  return (
    <div className="ops-dashboard flex-1 flex flex-col">
      <PageHeader
        icon={LayoutDashboard}
        title="HR Operations Command Center"
        subtitle={`Live onboarding status · figures as of ${formatReferenceDate(DASHBOARD_REFERENCE_DATE)} (demo date)`}
        actions={
          onOpenInviteModal && (
            <button
              type="button"
              onClick={onOpenInviteModal}
              className="cc-btn-primary inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg transition-[filter] shadow-xs"
              title="Send digital onboarding invitation link to new joiner"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              Invite Candidate
            </button>
          )
        }
      />

      <div className="cc-container cc-stack py-5">
        <KpiOverview kpis={kpis} onNavigate={onNavigate} />

        <div className="cc-grid grid-cols-1 lg:grid-cols-3">
          <CandidatePipeline stages={pipeline} statusMix={statusMix} total={kpis.total} />
          <PendingActions actions={pendingActions} onNavigate={onNavigate} />
        </div>

        <div className="cc-grid grid-cols-1 lg:grid-cols-3">
          <ClientAnalytics clients={clients} />
          <JoiningOverview
            data={joining}
            onOpenCandidate={(id) => (onOpenCandidateProfile ? onOpenCandidateProfile(id) : onNavigate('directory'))}
          />
        </div>

        <div className="cc-grid grid-cols-1 lg:grid-cols-3">
          <RecruiterPerformance recruiters={recruiters} />
          <RecentActivity events={activity} />
        </div>
      </div>
    </div>
  );
};
