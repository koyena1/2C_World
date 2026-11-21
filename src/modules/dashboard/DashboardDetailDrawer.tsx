import React, { useState } from 'react';
import {
  X,
  UserCheck,
  FileText,
  Send,
  Building2,
  Users,
  AlertTriangle,
  Clock,
  Sparkles,
  Search,
  Filter,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Phone,
  Mail,
  Zap,
  ShieldCheck,
  AlertCircle,
  Download,
  RotateCcw,
  SlidersHorizontal,
  Layers,
  ArrowUpRight,
  MessageSquare
} from 'lucide-react';
import {
  JoinerCandidate,
  MOCK_JOINER_CANDIDATES,
  MOCK_CLIENT_HEALTH,
  MOCK_DOCUMENT_VERIFICATION_METRICS,
  MOCK_PENDING_DOC_REVIEWS,
  MOCK_LETTER_SUMMARIES,
  MOCK_SOURCING_HR_PERFORMANCE,
  MOCK_AT_RISK_CANDIDATES,
  MOCK_SLA_BREACHES,
  MOCK_DELIVERY_FAILURES,
  MOCK_RECENT_ACTIVITIES,
  MOCK_KPI_CARDS,
  MOCK_2CWORLD_INSIGHTS,
  MOCK_WORK_QUEUES,
  MOCK_PIPELINE_STAGES,
} from '../../data/mockDashboardData';
import { useTheme } from '../../hooks/useTheme';

export type DetailDrawerType =
  | 'joining'
  | 'docs'
  | 'letters'
  | 'clients'
  | 'recruiters'
  | 'risks'
  | 'metrics'
  | 'pipeline'
  | 'suggestions'
  | 'queue'
  | 'activity'
  | 'candidate'
  | null;

interface DashboardDetailDrawerProps {
  isOpen: boolean;
  type: DetailDrawerType;
  selectedCandidateData?: JoinerCandidate | null;
  onClose: () => void;
  onNavigate: (view: string) => void;
  onOpenCandidateProfile?: (id: string) => void;
  onOpenLetterSender?: () => void;
  onOpenDocReview?: (candidateName: string) => void;
  onShowToast?: (message: string) => void;
  onSelectCandidateModal?: (cand: JoinerCandidate) => void;
  filteredCandidatesList?: JoinerCandidate[];
}

export const DashboardDetailDrawer: React.FC<DashboardDetailDrawerProps> = ({
  isOpen,
  type,
  selectedCandidateData,
  onClose,
  onNavigate,
  onOpenCandidateProfile,
  onOpenLetterSender,
  onOpenDocReview,
  onShowToast,
  onSelectCandidateModal,
  filteredCandidatesList,
}) => {
  const { isDark } = useTheme();

  // Internal search and sub-tab state
  const [joinerSubTab, setJoinerSubTab] = useState<'today' | 'tomorrow' | '7days' | '30days'>('today');
  const [joinerSearch, setJoinerSearch] = useState('');
  const [clientSearch, setClientSearch] = useState('');
  const [recruiterSearch, setRecruiterSearch] = useState('');
  const [riskTabFilter, setRiskTabFilter] = useState<'all' | 'at-risk' | 'sla' | 'failures'>('all');
  const [workQueueFilter, setWorkQueueFilter] = useState<'all' | 'critical' | 'high'>('all');
  const [activityCategoryFilter, setActivityCategoryFilter] = useState<string>('all');

  if (!isOpen || !type) return null;

  const candidatePool = filteredCandidatesList || MOCK_JOINER_CANDIDATES;

  // Filter joiners based on sub-tab and search
  const filteredJoiners = candidatePool.filter((c) => {
    let matchTab = true;
    if (joinerSubTab === 'today') matchTab = c.joiningDate === '2026-10-05';
    else if (joinerSubTab === 'tomorrow') matchTab = c.joiningDate === '2026-10-06';
    else if (joinerSubTab === '7days') matchTab = c.joiningDate >= '2026-10-05' && c.joiningDate <= '2026-10-12';
    else if (joinerSubTab === '30days') matchTab = c.joiningDate >= '2026-10-01' && c.joiningDate <= '2026-10-31';

    const matchSearch =
      joinerSearch === '' ||
      c.name.toLowerCase().includes(joinerSearch.toLowerCase()) ||
      c.candidateCode.toLowerCase().includes(joinerSearch.toLowerCase()) ||
      c.client.toLowerCase().includes(joinerSearch.toLowerCase()) ||
      c.designation.toLowerCase().includes(joinerSearch.toLowerCase());

    return matchTab && matchSearch;
  });

  // Filter clients
  const filteredClients = MOCK_CLIENT_HEALTH.filter(
    (c) => clientSearch === '' || c.clientName.toLowerCase().includes(clientSearch.toLowerCase())
  );

  // Filter recruiters
  const filteredRecruiters = MOCK_SOURCING_HR_PERFORMANCE.filter(
    (r) => recruiterSearch === '' || r.name.toLowerCase().includes(recruiterSearch.toLowerCase())
  );

  // Filter work queues
  const filteredWorkQueues = MOCK_WORK_QUEUES.filter((q) => {
    if (workQueueFilter === 'all') return true;
    if (workQueueFilter === 'critical') return q.priority === 'Critical';
    if (workQueueFilter === 'high') return q.priority === 'High';
    return true;
  });

  // Filter activity feed
  const filteredActivities = MOCK_RECENT_ACTIVITIES.filter((a) => {
    if (activityCategoryFilter === 'all') return true;
    return a.category.toLowerCase() === activityCategoryFilter.toLowerCase();
  });

  const getDrawerHeaderInfo = () => {
    switch (type) {
      case 'joining':
        return {
          title: 'Joining Readiness & Candidate Tracker',
          badge: '14 Today · 19 Tomorrow',
          icon: <UserCheck className="w-5 h-5 text-emerald-400" />,
          description: 'Track candidate arrival, pre-joining verification clearances, blockers, and day-1 induction status.',
        };
      case 'docs':
        return {
          title: 'Documentation & Verification Desk',
          badge: '23 Pending · 17 KYC Issues',
          icon: <FileText className="w-5 h-5 text-amber-400" />,
          description: 'Review candidate submitted documents, manage Aadhaar/PAN API checks, and resolve ₹1 penny drop failures.',
        };
      case 'letters':
        return {
          title: 'Letter Operations & Dispatch Queue',
          badge: '15 Pending Send · 3 Bounces',
          icon: <Send className="w-5 h-5 text-purple-400" />,
          description: 'Issue, track, and re-trigger offer letters, appointment letters, salary annexures, and delivery statuses.',
        };
      case 'clients':
        return {
          title: 'Client-wise Onboarding Health',
          badge: '7 Active Accounts · 91% Health',
          icon: <Building2 className="w-5 h-5 text-sky-400" />,
          description: 'Monitor account-level onboarding volumes, joining compliance, SLA adherence, and client HR escalations.',
        };
      case 'recruiters':
        return {
          title: 'Sourcing HR Performance & Velocity',
          badge: '18 Active Recruiters · 84% Offer Conversion',
          icon: <Users className="w-5 h-5 text-indigo-400" />,
          description: 'Track recruiter onboarding speed, document submission compliance, and offer-to-joining drop-off rates.',
        };
      case 'risks':
        return {
          title: 'Risks, SLA Breaches & Delivery Failures',
          badge: '8 At-Risk · 5 SLA Breaches · 3 Bounces',
          icon: <AlertTriangle className="w-5 h-5 text-rose-400" />,
          description: 'Inspect candidates at risk of dropping out, tickets aging beyond 48 hours, and email/SMS dispatch failures.',
        };
      case 'metrics':
        return {
          title: 'All Operational KPIs & Health Indicators',
          badge: '12 Live Telemetry Metrics',
          icon: <SlidersHorizontal className="w-5 h-5 text-sky-400" />,
          description: 'Comprehensive operational indicators spanning intake, verification, letters, and joining execution.',
        };
      case 'pipeline':
        return {
          title: 'Onboarding Pipeline 14-Stage Visual Funnel',
          badge: '164 Ingested · 74% Complete',
          icon: <Layers className="w-5 h-5 text-sky-400" />,
          description: 'Complete lifecycle stage conversion milestones from candidate sourcing to Day-1 joined.',
        };
      case 'suggestions':
        return {
          title: '2CWorld AI Operational Recommendations',
          badge: '164 Candidates Scanned · 3 Critical',
          icon: <Sparkles className="w-5 h-5 text-sky-400" />,
          description: 'AI-assisted root cause detection and automated action proposals to accelerate daily joining operations.',
        };
      case 'queue':
        return {
          title: 'Operational Work Queues',
          badge: '12 Priority Queues',
          icon: <Clock className="w-5 h-5 text-emerald-400" />,
          description: 'Prioritized operational action queues for pre-joining exceptions, KYC overrides, and letter dispatch.',
        };
      case 'activity':
        return {
          title: 'Recent Operational Activity Feed',
          badge: 'Live Audit Log',
          icon: <Clock className="w-5 h-5 text-sky-400" />,
          description: 'Real-time audit log of joining confirmations, verification overrides, and letter dispatches.',
        };
      case 'candidate':
        return {
          title: selectedCandidateData ? selectedCandidateData.name : 'Candidate Detail',
          badge: selectedCandidateData ? selectedCandidateData.candidateCode : 'Drilldown',
          icon: <UserCheck className="w-5 h-5 text-sky-400" />,
          description: 'Direct contact, blocking issues, and instant operational actions for selected candidate.',
        };
      default:
        return {
          title: 'Operational Details',
          badge: 'HR Ops',
          icon: <Building2 className="w-5 h-5 text-sky-400" />,
          description: 'Executive details panel.',
        };
    }
  };

  const headerInfo = getDrawerHeaderInfo();

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      />

      {/* Slide-over Panel */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-6 sm:pl-10">
        <div className={`w-screen max-w-4xl lg:max-w-5xl shadow-2xl flex flex-col justify-between transition-colors duration-150 animate-in slide-in-from-right duration-200 border-l ${
          isDark
            ? 'bg-slate-900 border-slate-800 text-slate-100'
            : 'bg-white border-slate-200 text-slate-900'
        }`}>
          {/* Header */}
          <div className={`p-4 sm:p-5 border-b flex items-center justify-between shrink-0 ${
            isDark ? 'bg-slate-950/90 border-slate-800' : 'bg-slate-50/90 border-slate-200'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center border shadow-xs ${
                isDark ? 'bg-slate-800 border-slate-750' : 'bg-white border-slate-200'
              }`}>
                {headerInfo.icon}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className={`text-base font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {headerInfo.title}
                  </h2>
                  <span className={`text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full border ${
                    isDark
                      ? 'bg-sky-950/80 text-sky-300 border-sky-800/80'
                      : 'bg-sky-50 text-sky-700 border-sky-200'
                  }`}>
                    {headerInfo.badge}
                  </span>
                </div>
                <p className={`text-xs mt-0.5 max-w-2xl ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {headerInfo.description}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className={`p-2 rounded-lg transition-colors ${
                  isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-200/60'
                }`}
                title="Close drawer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Drawer Body (Scrollable Workspace) */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 text-xs">
            {/* ========================================================================= */}
            {/* 1. JOINING TRACKER DRAWER VIEW                                            */}
            {/* ========================================================================= */}
            {type === 'joining' && (
              <div className="space-y-4">
                {/* Sub-tabs & Search Toolbar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-750/50">
                  <div className={`flex items-center border rounded-lg p-0.5 ${
                    isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'
                  }`}>
                    {(['today', 'tomorrow', '7days', '30days'] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => setJoinerSubTab(t)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                          joinerSubTab === t
                            ? 'bg-sky-600 text-white shadow-xs'
                            : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {t === 'today' ? 'Today (14)' : t === 'tomorrow' ? 'Tomorrow (19)' : t === '7days' ? 'Next 7 Days (48)' : 'Next 30 Days (92)'}
                      </button>
                    ))}
                  </div>

                  <div className="relative min-w-[220px]">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search joiner, client, code..."
                      value={joinerSearch}
                      onChange={(e) => setJoinerSearch(e.target.value)}
                      className={`w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border focus:outline-none focus:border-sky-500 ${
                        isDark ? 'bg-slate-950 border-slate-750 text-slate-200' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>
                </div>

                {/* Table */}
                <div className={`border rounded-xl overflow-hidden shadow-xs ${
                  isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                }`}>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className={`border-b text-[11px] font-semibold uppercase tracking-wider ${
                          isDark ? 'bg-slate-950/80 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'
                        }`}>
                          <th className="py-2.5 px-3">Candidate</th>
                          <th className="py-2.5 px-3">Client & Role</th>
                          <th className="py-2.5 px-3">Joining Date</th>
                          <th className="py-2.5 px-3">Readiness / Blocker</th>
                          <th className="py-2.5 px-3">Recruiter</th>
                          <th className="py-2.5 px-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className={`divide-y ${isDark ? 'divide-slate-800 text-slate-300' : 'divide-slate-100 text-slate-700'}`}>
                        {filteredJoiners.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="py-10 text-center text-slate-400">
                              No candidates match your filter.
                            </td>
                          </tr>
                        ) : (
                          filteredJoiners.map((c) => (
                            <tr
                              key={c.id}
                              className={`transition-colors ${isDark ? 'hover:bg-slate-800/60' : 'hover:bg-slate-50'}`}
                            >
                              <td className="py-2.5 px-3">
                                <div className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{c.name}</div>
                                <div className="font-mono text-[11px] text-sky-500">{c.candidateCode}</div>
                              </td>
                              <td className="py-2.5 px-3">
                                <div className={`font-medium ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{c.client}</div>
                                <div className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{c.designation}</div>
                              </td>
                              <td className="py-2.5 px-3 font-mono font-bold whitespace-nowrap">
                                <span className={c.joiningDate === '2026-10-05' ? 'text-emerald-500' : ''}>
                                  {c.joiningDate}
                                </span>
                              </td>
                              <td className="py-2.5 px-3">
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                                  c.blockingIssue === 'No Blocking Issue'
                                    ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800'
                                    : 'bg-rose-950/80 text-rose-300 border border-rose-800'
                                }`}>
                                  {c.blockingIssue === 'No Blocking Issue' ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                                  <span>{c.blockingIssue}</span>
                                </span>
                              </td>
                              <td className="py-2.5 px-3">
                                <div>{c.recruiter}</div>
                                <div className="text-[11px] text-slate-400">{c.phone}</div>
                              </td>
                              <td className="py-2.5 px-3 text-right">
                                <div className="inline-flex items-center gap-1.5">
                                  <button
                                    onClick={() => {
                                      if (onShowToast) onShowToast(`Marked ${c.name} as Joined!`);
                                    }}
                                    className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-medium text-[11px] transition-colors"
                                    title="Confirm Joining"
                                  >
                                    Mark Joined
                                  </button>
                                  <button
                                    onClick={() => {
                                      if (onSelectCandidateModal) onSelectCandidateModal(c);
                                    }}
                                    className={`p-1 rounded border transition-colors ${
                                      isDark ? 'border-slate-700 hover:bg-slate-800 text-slate-300' : 'border-slate-300 hover:bg-slate-100 text-slate-700'
                                    }`}
                                    title="View Full Card"
                                  >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* 2. DOCUMENTS & KYC DESK DRAWER VIEW                                       */}
            {/* ========================================================================= */}
            {type === 'docs' && (
              <div className="space-y-4">
                {/* 4 Metric Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                    <span className="text-[10px] text-slate-400 font-semibold uppercase block">Pending Reviews</span>
                    <span className="text-xl font-bold font-mono text-amber-500">23</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Physical proofs uploaded</span>
                  </div>
                  <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                    <span className="text-[10px] text-slate-400 font-semibold uppercase block">KYC Mismatches</span>
                    <span className="text-xl font-bold font-mono text-rose-500">17</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Name/DOB discrepancy</span>
                  </div>
                  <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                    <span className="text-[10px] text-slate-400 font-semibold uppercase block">Bank Penny Drops</span>
                    <span className="text-xl font-bold font-mono text-rose-400">4 Failed</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">₹1 test rejected by NPCI</span>
                  </div>
                  <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                    <span className="text-[10px] text-slate-400 font-semibold uppercase block">Rejection Rate</span>
                    <span className="text-xl font-bold font-mono text-sky-400">6.4%</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Re-upload requested</span>
                  </div>
                </div>

                {/* Quick Action Trigger to KYC Desk */}
                <div className={`p-3 rounded-xl border flex items-center justify-between ${
                  isDark ? 'bg-sky-950/40 border-sky-800' : 'bg-sky-50 border-sky-200'
                }`}>
                  <div>
                    <h4 className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Dedicated KYC Verification Workspace</h4>
                    <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      Perform side-by-side Aadhaar, PAN, and Bank proof verification with automated text extraction.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      onClose();
                      onNavigate('kyc');
                    }}
                    className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg font-semibold text-xs transition-colors shrink-0"
                  >
                    Launch KYC Desk
                  </button>
                </div>

                {/* Table of pending document reviews */}
                <div className={`border rounded-xl overflow-hidden shadow-xs ${
                  isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                }`}>
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className={`border-b text-[11px] font-semibold uppercase tracking-wider ${
                        isDark ? 'bg-slate-950/80 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'
                      }`}>
                        <th className="py-2.5 px-3">Candidate</th>
                        <th className="py-2.5 px-3">Client</th>
                        <th className="py-2.5 px-3">Document Type</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3">Uploaded</th>
                        <th className="py-2.5 px-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${isDark ? 'divide-slate-800 text-slate-300' : 'divide-slate-100 text-slate-700'}`}>
                      {MOCK_PENDING_DOC_REVIEWS.map((doc) => (
                        <tr key={doc.id} className={`transition-colors ${isDark ? 'hover:bg-slate-800/60' : 'hover:bg-slate-50'}`}>
                          <td className="py-2.5 px-3 font-semibold text-sky-400">{doc.candidateName}</td>
                          <td className="py-2.5 px-3">{doc.clientName}</td>
                          <td className="py-2.5 px-3 font-medium">{doc.documentType}</td>
                          <td className="py-2.5 px-3">
                            <span className="text-amber-500 font-medium">{doc.status}</span>
                          </td>
                          <td className="py-2.5 px-3 font-mono">{doc.uploadedAt}</td>
                          <td className="py-2.5 px-3 text-right">
                            <button
                              onClick={() => {
                                if (onOpenDocReview) onOpenDocReview(doc.candidateName);
                                onClose();
                              }}
                              className="px-2.5 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded font-medium text-[11px] transition-colors"
                            >
                              Inspect Proof
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* 3. LETTERS OPERATIONS DRAWER VIEW                                         */}
            {/* ========================================================================= */}
            {type === 'letters' && (
              <div className="space-y-4">
                {/* Clean 4-Card Summary Strip */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                    <span className="text-[10px] text-slate-400 font-semibold uppercase block">Rolled Out / Sent</span>
                    <span className="text-xl font-bold font-mono text-sky-400">54</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Dispatched to pool</span>
                  </div>

                  <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                    <span className="text-[10px] text-slate-400 font-semibold uppercase block">Not Sent</span>
                    <span className="text-xl font-bold font-mono text-rose-400">18</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Ready for rollout</span>
                  </div>

                  <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                    <span className="text-[10px] text-slate-400 font-semibold uppercase block">Pending</span>
                    <span className="text-xl font-bold font-mono text-purple-400">4</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Drafting / Approval</span>
                  </div>

                  <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                    <span className="text-[10px] text-slate-400 font-semibold uppercase block">Sent But Not Signed</span>
                    <span className="text-xl font-bold font-mono text-amber-400">12</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Awaiting eSign</span>
                  </div>
                </div>

                {/* Submodule Redirection Card */}
                <div className={`p-4 rounded-xl border space-y-3 ${
                  isDark ? 'bg-purple-950/20 border-purple-800/60' : 'bg-purple-50/70 border-purple-200'
                }`}>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-purple-600 text-white flex items-center justify-center font-bold text-xs">
                      2C
                    </div>
                    <div>
                      <h4 className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        Detailed Offer Letter Operations
                      </h4>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        Candidate Directory → Offer Letter Operations
                      </p>
                    </div>
                  </div>

                  <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                    Track full candidate-level offer letter statuses, filter by joining dates and KYC blocks, preview official offer letters, and manage one-click dispatch actions in the dedicated submodule.
                  </p>

                  <button
                    onClick={() => {
                      onClose();
                      onNavigate('offer-letters');
                    }}
                    className="w-full py-2 px-3 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-bold text-xs flex items-center justify-center gap-2 transition-colors shadow-xs"
                  >
                    <span>Open Offer Letter Operations Submodule</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* 4. CLIENT-WISE ONBOARDING HEALTH DRAWER VIEW                              */}
            {/* ========================================================================= */}
            {type === 'clients' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search active client account..."
                      value={clientSearch}
                      onChange={(e) => setClientSearch(e.target.value)}
                      className={`w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border focus:outline-none focus:border-sky-500 ${
                        isDark ? 'bg-slate-950 border-slate-750 text-slate-200' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>
                  <span className={`text-[11px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Showing {filteredClients.length} Enterprise Accounts
                  </span>
                </div>

                <div className={`border rounded-xl overflow-hidden shadow-xs ${
                  isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                }`}>
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className={`border-b text-[11px] font-semibold uppercase tracking-wider ${
                        isDark ? 'bg-slate-950/80 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'
                      }`}>
                        <th className="py-2.5 px-3">Client Account</th>
                        <th className="py-2.5 px-3">Active Pipeline</th>
                        <th className="py-2.5 px-3">Joining Today</th>
                        <th className="py-2.5 px-3">Pending Docs</th>
                        <th className="py-2.5 px-3">Letters Pending</th>
                        <th className="py-2.5 px-3">Health Status</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${isDark ? 'divide-slate-800 text-slate-300' : 'divide-slate-100 text-slate-700'}`}>
                      {filteredClients.map((c) => (
                        <tr key={c.id} className={`transition-colors ${isDark ? 'hover:bg-slate-800/60' : 'hover:bg-slate-50'}`}>
                          <td className="py-2.5 px-3 font-semibold text-sky-400">{c.clientName}</td>
                          <td className="py-2.5 px-3 font-mono font-medium">{c.activeCandidates} candidates</td>
                          <td className="py-2.5 px-3 font-mono font-bold text-emerald-400">{c.joiningToday}</td>
                          <td className="py-2.5 px-3 font-mono text-amber-400">{c.documentsPending}</td>
                          <td className="py-2.5 px-3 font-mono font-bold">{c.lettersPending}</td>
                          <td className="py-2.5 px-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              c.riskLevel === 'Healthy'
                                ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800'
                                : c.riskLevel === 'Needs Attention'
                                ? 'bg-amber-950/80 text-amber-300 border border-amber-800'
                                : 'bg-rose-950/80 text-rose-300 border border-rose-800'
                            }`}>
                              {c.riskLevel}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* 5. SOURCING HR PERFORMANCE DRAWER VIEW                                    */}
            {/* ========================================================================= */}
            {type === 'recruiters' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search recruiter by name..."
                      value={recruiterSearch}
                      onChange={(e) => setRecruiterSearch(e.target.value)}
                      className={`w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border focus:outline-none focus:border-sky-500 ${
                        isDark ? 'bg-slate-950 border-slate-750 text-slate-200' : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    />
                  </div>
                  <span className={`text-[11px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    18 Recruiters Active
                  </span>
                </div>

                <div className={`border rounded-xl overflow-hidden shadow-xs ${
                  isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                }`}>
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className={`border-b text-[11px] font-semibold uppercase tracking-wider ${
                        isDark ? 'bg-slate-950/80 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'
                      }`}>
                        <th className="py-2.5 px-3">Recruiter</th>
                        <th className="py-2.5 px-3">Sourced (Today)</th>
                        <th className="py-2.5 px-3">Joined Candidates</th>
                        <th className="py-2.5 px-3">Docs Pending</th>
                        <th className="py-2.5 px-3">Offer Conversion</th>
                        <th className="py-2.5 px-3">Rank</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${isDark ? 'divide-slate-800 text-slate-300' : 'divide-slate-100 text-slate-700'}`}>
                      {filteredRecruiters.map((r) => (
                        <tr key={r.id} className={`transition-colors ${isDark ? 'hover:bg-slate-800/60' : 'hover:bg-slate-50'}`}>
                          <td className="py-2.5 px-3 font-semibold text-white">{r.name}</td>
                          <td className="py-2.5 px-3 font-mono">{r.candidatesSourcedToday}</td>
                          <td className="py-2.5 px-3 font-mono font-bold text-emerald-400">{r.joinedCandidates}</td>
                          <td className="py-2.5 px-3 font-mono text-sky-400">{r.documentsPending}</td>
                          <td className="py-2.5 px-3 font-mono font-bold">{r.conversionPct}%</td>
                          <td className="py-2.5 px-3">
                            <span className="font-mono font-bold text-amber-400">#{r.rank}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* 6. RISKS, SLA & DELIVERY FAILURES DRAWER VIEW                             */}
            {/* ========================================================================= */}
            {type === 'risks' && (
              <div className="space-y-4">
                <div className={`flex items-center border rounded-lg p-0.5 ${
                  isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'
                }`}>
                  <button
                    onClick={() => setRiskTabFilter('all')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                      riskTabFilter === 'all' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    All Issues (16)
                  </button>
                  <button
                    onClick={() => setRiskTabFilter('at-risk')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                      riskTabFilter === 'at-risk' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    At-Risk Candidates (8)
                  </button>
                  <button
                    onClick={() => setRiskTabFilter('sla')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                      riskTabFilter === 'sla' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    SLA Breaches (5)
                  </button>
                  <button
                    onClick={() => setRiskTabFilter('failures')}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                      riskTabFilter === 'failures' ? 'bg-rose-700 text-white' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Delivery Failures (3)
                  </button>
                </div>

                {/* At-Risk Table */}
                {(riskTabFilter === 'all' || riskTabFilter === 'at-risk') && (
                  <div className="space-y-2">
                    <h4 className="font-bold text-rose-400 text-xs uppercase tracking-wider">At-Risk Candidates (8)</h4>
                    <div className={`border rounded-xl overflow-hidden shadow-xs ${
                      isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                    }`}>
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className={`border-b text-[11px] font-semibold uppercase tracking-wider ${
                            isDark ? 'bg-slate-950/80 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'
                          }`}>
                            <th className="py-2.5 px-3">Candidate</th>
                            <th className="py-2.5 px-3">Client</th>
                            <th className="py-2.5 px-3">Risk Trigger</th>
                            <th className="py-2.5 px-3">Last Activity</th>
                            <th className="py-2.5 px-3 text-right">Mitigation</th>
                          </tr>
                        </thead>
                        <tbody className={`divide-y ${isDark ? 'divide-slate-800 text-slate-300' : 'divide-slate-100 text-slate-700'}`}>
                          {MOCK_AT_RISK_CANDIDATES.map((c) => (
                            <tr key={c.id} className={`transition-colors ${isDark ? 'hover:bg-slate-800/60' : 'hover:bg-slate-50'}`}>
                              <td className="py-2.5 px-3 font-semibold text-white">{c.name}</td>
                              <td className="py-2.5 px-3">{c.client}</td>
                              <td className="py-2.5 px-3 font-medium text-rose-400">{c.riskReason}</td>
                              <td className="py-2.5 px-3 font-mono">{c.lastActivity}</td>
                              <td className="py-2.5 px-3 text-right">
                                <button
                                  onClick={() => {
                                    if (onShowToast) onShowToast(`Triggered outreach for ${c.name}`);
                                  }}
                                  className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded text-[11px] font-medium transition-colors"
                                >
                                  Take Action
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* SLA Breaches */}
                {(riskTabFilter === 'all' || riskTabFilter === 'sla') && (
                  <div className="space-y-2 mt-4">
                    <h4 className="font-bold text-amber-400 text-xs uppercase tracking-wider">SLA Aging Breaches &gt; 48 Hours (5)</h4>
                    <div className={`border rounded-xl overflow-hidden shadow-xs ${
                      isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                    }`}>
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className={`border-b text-[11px] font-semibold uppercase tracking-wider ${
                            isDark ? 'bg-slate-950/80 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'
                          }`}>
                            <th className="py-2.5 px-3">Ticket Category</th>
                            <th className="py-2.5 px-3">Pending Items</th>
                            <th className="py-2.5 px-3">Oldest Pending</th>
                            <th className="py-2.5 px-3">Average Aging</th>
                            <th className="py-2.5 px-3 text-right">Escalate</th>
                          </tr>
                        </thead>
                        <tbody className={`divide-y ${isDark ? 'divide-slate-800 text-slate-300' : 'divide-slate-100 text-slate-700'}`}>
                          {MOCK_SLA_BREACHES.map((sla) => (
                            <tr key={sla.id} className={`transition-colors ${isDark ? 'hover:bg-slate-800/60' : 'hover:bg-slate-50'}`}>
                              <td className="py-2.5 px-3 font-semibold text-white">{sla.category}</td>
                              <td className="py-2.5 px-3 text-sky-400 font-mono">{sla.count} tickets</td>
                              <td className="py-2.5 px-3">{sla.oldestPending}</td>
                              <td className="py-2.5 px-3 font-mono text-amber-400 font-bold">{sla.avgAging}</td>
                              <td className="py-2.5 px-3 text-right">
                                <button
                                  onClick={() => {
                                    if (onShowToast) onShowToast(`Escalated SLA ticket: ${sla.category}`);
                                  }}
                                  className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded text-[11px] font-medium transition-colors"
                                >
                                  {sla.actionLabel}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ========================================================================= */}
            {/* 7. ALL 12 METRICS DRAWER VIEW                                             */}
            {/* ========================================================================= */}
            {type === 'metrics' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {MOCK_KPI_CARDS.map((kpi) => (
                    <div
                      key={kpi.id}
                      className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between ${
                        isDark ? 'bg-slate-950 border-slate-800 hover:border-sky-500' : 'bg-slate-50 border-slate-200 hover:border-sky-400'
                      }`}
                    >
                      <div>
                        <span className={`text-[11px] font-medium line-clamp-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          {kpi.label}
                        </span>
                        <div className={`text-2xl font-bold font-mono tracking-tight mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {kpi.count}
                        </div>
                      </div>
                      <div className={`pt-2 mt-2 border-t ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                        <span className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{kpi.trendText}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* 8. PIPELINE 14-STAGE FULL FUNNEL DRAWER VIEW                              */}
            {/* ========================================================================= */}
            {type === 'pipeline' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
                  {MOCK_PIPELINE_STAGES.map((stg) => (
                    <div
                      key={stg.step}
                      className={`p-3 rounded-lg border transition-all ${
                        isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                        <span className="font-mono font-bold text-sky-500">Step {stg.step}</span>
                        <span className="font-semibold">{stg.percentage}%</span>
                      </div>
                      <div className={`text-xs font-semibold leading-tight line-clamp-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {stg.name}
                      </div>
                      <div className={`text-base font-bold font-mono mt-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {stg.count}
                      </div>
                      {stg.stuckCount > 0 && (
                        <div className="text-[10px] text-amber-500 font-semibold mt-0.5">
                          {stg.stuckCount} pending
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* 9. 2CWORLD AI ALL RECOMMENDATIONS DRAWER VIEW                             */}
            {/* ========================================================================= */}
            {type === 'suggestions' && (
              <div className="space-y-3">
                {MOCK_2CWORLD_INSIGHTS.map((insight) => (
                  <div
                    key={insight.id}
                    className={`p-4 rounded-xl border transition-all ${
                      isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                        insight.priority === 'Critical'
                          ? 'bg-rose-950 text-rose-300 border border-rose-800'
                          : insight.priority === 'High'
                          ? 'bg-amber-950 text-amber-300 border border-amber-800'
                          : 'bg-sky-950 text-sky-300 border border-sky-800'
                      }`}>
                        {insight.priority} Priority · {insight.category}
                      </span>
                      <span className={`text-xs font-mono font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        {insight.affectedCount} candidates affected
                      </span>
                    </div>

                    <h4 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{insight.title}</h4>
                    <p className={`text-xs mt-1 leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                      {insight.description}
                    </p>

                    <div className="mt-3 flex items-center justify-end">
                      <button
                        onClick={() => {
                          if (insight.actionId === 'open-letter-sender' && onOpenLetterSender) {
                            onOpenLetterSender();
                          } else if (insight.actionId === 'open-kyc-queue') {
                            onNavigate('kyc');
                          } else if (onShowToast) {
                            onShowToast(`Triggered AI Action: ${insight.suggestedAction}`);
                          }
                          onClose();
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg font-semibold text-xs transition-colors"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        <span>{insight.suggestedAction}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ========================================================================= */}
            {/* 10. WORK QUEUES DRAWER VIEW                                               */}
            {/* ========================================================================= */}
            {type === 'queue' && (
              <div className="space-y-4">
                <div className={`flex items-center border rounded-lg p-0.5 max-w-xs ${
                  isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'
                }`}>
                  <button
                    onClick={() => setWorkQueueFilter('all')}
                    className={`flex-1 py-1 text-xs font-semibold rounded ${
                      workQueueFilter === 'all' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    All (12)
                  </button>
                  <button
                    onClick={() => setWorkQueueFilter('critical')}
                    className={`flex-1 py-1 text-xs font-semibold rounded ${
                      workQueueFilter === 'critical' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Critical (4)
                  </button>
                  <button
                    onClick={() => setWorkQueueFilter('high')}
                    className={`flex-1 py-1 text-xs font-semibold rounded ${
                      workQueueFilter === 'high' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    High (5)
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {filteredWorkQueues.map((q) => (
                    <div
                      key={q.id}
                      className={`p-3.5 rounded-xl border flex flex-col justify-between ${
                        isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{q.title}</span>
                          <span className={`text-[9px] font-bold uppercase px-1.5 py-0.2 rounded ${
                            q.priority === 'Critical'
                              ? 'bg-rose-950 text-rose-300 border border-rose-800'
                              : q.priority === 'High'
                              ? 'bg-amber-950 text-amber-300 border border-amber-800'
                              : 'bg-sky-950 text-sky-300 border border-sky-800'
                          }`}>
                            {q.priority}
                          </span>
                        </div>
                        <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{q.explanation}</p>
                      </div>

                      <div className={`mt-3 pt-2.5 border-t flex items-center justify-between ${
                        isDark ? 'border-slate-800' : 'border-slate-200'
                      }`}>
                        <span className={`font-mono font-bold text-xs ${isDark ? 'text-white' : 'text-slate-900'}`}>{q.count} cases</span>
                        <button
                          onClick={() => {
                            if (q.category === 'letters' && onOpenLetterSender) onOpenLetterSender();
                            else if (q.category === 'kyc') onNavigate('kyc');
                            else if (onShowToast) onShowToast(`Opened queue: ${q.title}`);
                            onClose();
                          }}
                          className="text-xs font-semibold text-sky-500 hover:underline flex items-center gap-1"
                        >
                          <span>{q.actionLabel}</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ========================================================================= */}
            {/* 11. RECENT OPERATIONAL ACTIVITY FEED                                      */}
            {/* ========================================================================= */}
            {type === 'activity' && (
              <div className="space-y-4">
                <div className={`flex items-center border rounded-lg p-0.5 max-w-sm ${
                  isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'
                }`}>
                  {['all', 'joining', 'verification', 'letter'].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setActivityCategoryFilter(cat)}
                      className={`flex-1 py-1 text-xs font-semibold capitalize rounded ${
                        activityCategoryFilter === cat ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <div className="space-y-2.5">
                  {filteredActivities.map((act) => (
                    <div
                      key={act.id}
                      className={`p-3 rounded-xl border flex items-start justify-between gap-3 ${
                        isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold uppercase px-1.5 py-0.2 rounded border ${
                            isDark ? 'bg-slate-900 text-sky-400 border-slate-700' : 'bg-white text-sky-700 border-slate-200'
                          }`}>
                            {act.category}
                          </span>
                          <span className={`font-semibold text-xs ${isDark ? 'text-white' : 'text-slate-900'}`}>{act.action}</span>
                        </div>
                        <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{act.target}</p>
                      </div>
                      <div className={`text-[10px] font-mono whitespace-nowrap text-right ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        <div>{act.timestamp}</div>
                        <div className="text-slate-500">{act.actor}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Drawer Footer */}
          <div className={`p-4 border-t flex items-center justify-between shrink-0 ${
            isDark ? 'bg-slate-950/80 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'
          }`}>
            <span className="text-[11px] font-mono">2cworld · Talent Lifecycle HR Operations</span>
            <button
              onClick={onClose}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border ${
                isDark
                  ? 'border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white'
                  : 'border-slate-300 text-slate-700 hover:bg-slate-100'
              }`}
            >
              Close Drawer (Esc)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
