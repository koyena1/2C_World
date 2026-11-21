import React from 'react';
import {
  X,
  User,
  Building2,
  Calendar,
  Phone,
  Mail,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Sparkles,
  Zap,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Send,
  MessageSquare
} from 'lucide-react';
import {
  JoinerCandidate,
  WorkQueueItem,
  TwoCWorldAiInsight,
  SlaBreachItem,
  AtRiskCandidateItem
} from '../../data/mockDashboardData';
import { useTheme } from '../../hooks/useTheme';

export type DrawerContentType =
  | { type: 'candidate'; data: JoinerCandidate }
  | { type: 'queue'; data: WorkQueueItem }
  | { type: 'insight'; data: TwoCWorldAiInsight }
  | { type: 'sla'; data: SlaBreachItem }
  | { type: 'at-risk'; data: AtRiskCandidateItem }
  | null;

interface RightDetailDrawerProps {
  isOpen: boolean;
  content: DrawerContentType;
  onClose: () => void;
  onNavigate: (view: string) => void;
  onOpenCandidateProfile?: (id: string) => void;
  onOpenLetterSender?: () => void;
  onOpenDocReview?: (candidateName: string) => void;
  onShowToast?: (message: string) => void;
}

export const RightDetailDrawer: React.FC<RightDetailDrawerProps> = ({
  isOpen,
  content,
  onClose,
  onNavigate,
  onOpenCandidateProfile,
  onOpenLetterSender,
  onOpenDocReview,
  onShowToast,
}) => {
  const { isDark } = useTheme();

  if (!isOpen || !content) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      />

      {/* Slide-over panel */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className={`w-screen max-w-md border-l shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-200 ${
          isDark 
            ? 'bg-slate-900 border-slate-800 text-slate-100' 
            : 'bg-white border-slate-200 text-slate-900'
        }`}>
          
          {/* Header */}
          <div className={`p-5 border-b flex items-center justify-between ${
            isDark ? 'border-slate-800 bg-slate-950/80' : 'border-slate-100 bg-slate-50/80'
          }`}>
            <div className="flex items-center gap-2.5">
              {content.type === 'candidate' && (
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  isDark ? 'bg-sky-500/20 border border-sky-500/30 text-sky-400' : 'bg-sky-50 border border-sky-200 text-sky-600'
                }`}>
                  <User className="w-4 h-4" />
                </div>
              )}
              {content.type === 'queue' && (
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  isDark ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400' : 'bg-emerald-50 border border-emerald-200 text-emerald-600'
                }`}>
                  <Clock className="w-4 h-4" />
                </div>
              )}
              {content.type === 'insight' && (
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  isDark ? 'bg-sky-500/20 border border-sky-500/30 text-sky-400' : 'bg-sky-50 border border-sky-200 text-sky-600'
                }`}>
                  <Sparkles className="w-4 h-4" />
                </div>
              )}
              {content.type === 'sla' && (
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  isDark ? 'bg-amber-500/20 border border-amber-500/30 text-amber-400' : 'bg-amber-50 border border-amber-200 text-amber-600'
                }`}>
                  <Clock className="w-4 h-4" />
                </div>
              )}
              {content.type === 'at-risk' && (
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  isDark ? 'bg-rose-500/20 border border-rose-500/30 text-rose-400' : 'bg-rose-50 border border-rose-200 text-rose-600'
                }`}>
                  <AlertTriangle className="w-4 h-4" />
                </div>
              )}

              <div>
                <span className={`text-[10px] font-bold uppercase tracking-wider ${
                  isDark ? 'text-slate-400' : 'text-slate-500'
                }`}>
                  {content.type === 'candidate' && 'Candidate Quick Drill-Down'}
                  {content.type === 'queue' && 'Operational Work Queue'}
                  {content.type === 'insight' && '2CWorld AI Action Item'}
                  {content.type === 'sla' && 'SLA Aging Audit'}
                  {content.type === 'at-risk' && 'At Risk Candidate'}
                </span>
                <h3 className={`text-sm font-bold line-clamp-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {content.type === 'candidate' && content.data.name}
                  {content.type === 'queue' && content.data.title}
                  {content.type === 'insight' && content.data.title}
                  {content.type === 'sla' && content.data.category}
                  {content.type === 'at-risk' && content.data.name}
                </h3>
              </div>
            </div>

            <button
              onClick={onClose}
              className={`p-1.5 rounded-lg transition-colors ${
                isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
            {/* 1. CANDIDATE DRILL-DOWN */}
            {content.type === 'candidate' && (
              <>
                <div className={`p-3 rounded-xl border space-y-2 ${
                  isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Candidate Code:</span>
                    <span className="font-mono font-bold text-sky-600">{content.data.candidateCode}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Target Client:</span>
                    <span className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{content.data.client}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Work Location:</span>
                    <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>{content.data.location} · {content.data.branch}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Designation:</span>
                    <span className={isDark ? 'text-slate-200' : 'text-slate-800'}>{content.data.designation}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Joining Date:</span>
                    <span className="font-mono font-bold text-emerald-600">{content.data.joiningDate}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Recruiter:</span>
                    <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>{content.data.recruiter}</span>
                  </div>
                </div>

                <div className={`p-3 rounded-xl border space-y-2 ${
                  isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  <span className={`text-[10px] font-bold uppercase tracking-wider block mb-1 ${
                    isDark ? 'text-slate-400' : 'text-slate-500'
                  }`}>
                    Status & Readiness
                  </span>
                  <div className="flex items-center justify-between">
                    <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Joining Status:</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                      isDark ? 'bg-sky-950 text-sky-300 border-sky-800' : 'bg-sky-50 text-sky-700 border-sky-200'
                    }`}>
                      {content.data.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Blocking Issue:</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        content.data.blockingIssue === 'No Blocking Issue'
                          ? (isDark ? 'bg-emerald-950 text-emerald-300 border-emerald-800' : 'bg-emerald-50 text-emerald-700 border-emerald-200')
                          : (isDark ? 'bg-rose-950 text-rose-300 border-rose-800' : 'bg-rose-50 text-rose-700 border-rose-200')
                      }`}
                    >
                      {content.data.blockingIssue}
                    </span>
                  </div>
                </div>

                <div className={`p-3 rounded-xl border space-y-2 ${
                  isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  <span className={`text-[10px] font-bold uppercase tracking-wider block mb-1 ${
                    isDark ? 'text-slate-400' : 'text-slate-500'
                  }`}>
                    Direct Contact Channels
                  </span>
                  <div className="flex items-center justify-between">
                    <span className={`flex items-center gap-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      <Phone className="w-3.5 h-3.5" /> Phone:
                    </span>
                    <span className={`font-mono font-medium ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{content.data.phone}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`flex items-center gap-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      <Mail className="w-3.5 h-3.5" /> Email:
                    </span>
                    <span className={isDark ? 'text-slate-200' : 'text-slate-800'}>{content.data.email}</span>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  {content.data.blockingIssue === 'Document Pending' && (
                    <button
                      onClick={() => {
                        onClose();
                        if (onOpenDocReview) onOpenDocReview(content.data.name);
                      }}
                      className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-lg transition-colors"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>Review Pending Documents</span>
                    </button>
                  )}

                  {content.data.blockingIssue === 'Bank Failed' && (
                    <button
                      onClick={() => {
                        if (onShowToast) onShowToast(`Bank re-verification link triggered for ${content.data.name}`);
                        onClose();
                      }}
                      className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-lg transition-colors"
                    >
                      <Zap className="w-4 h-4" />
                      <span>Send Bank Correction SMS / WhatsApp</span>
                    </button>
                  )}

                  {content.data.blockingIssue === 'Offer Letter Not Sent' && (
                    <button
                      onClick={() => {
                        onClose();
                        if (onOpenLetterSender) onOpenLetterSender();
                      }}
                      className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-lg transition-colors"
                    >
                      <Send className="w-4 h-4" />
                      <span>Launch Letter Sender</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      if (onShowToast) onShowToast(`Automated WhatsApp greeting and joining instructions sent to ${content.data.name}`);
                    }}
                    className={`w-full flex items-center justify-center gap-1.5 py-2 px-3 border font-medium rounded-lg transition-colors ${
                      isDark 
                        ? 'bg-slate-800 hover:bg-slate-750 border-slate-700 text-slate-200' 
                        : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800'
                    }`}
                  >
                    <MessageSquare className="w-4 h-4 text-emerald-500" />
                    <span>Send WhatsApp Joining Instructions</span>
                  </button>

                  <button
                    onClick={() => {
                      if (onShowToast) onShowToast(`Candidate ${content.data.name} marked as Joined successfully!`);
                      onClose();
                    }}
                    className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg transition-colors"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirm & Mark as Joined</span>
                  </button>
                </div>
              </>
            )}

            {/* 2. WORK QUEUE DRILL-DOWN */}
            {content.type === 'queue' && (
              <>
                <div className={`p-3.5 rounded-xl border space-y-2 ${
                  isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Priority Level:</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                        content.data.priority === 'Critical'
                          ? (isDark ? 'bg-rose-950 text-rose-300 border-rose-800' : 'bg-rose-50 text-rose-700 border-rose-200')
                          : content.data.priority === 'High'
                          ? (isDark ? 'bg-amber-950 text-amber-300 border-amber-800' : 'bg-amber-50 text-amber-700 border-amber-200')
                          : (isDark ? 'bg-sky-950 text-sky-300 border-sky-800' : 'bg-sky-50 text-sky-700 border-sky-200')
                      }`}
                    >
                      {content.data.priority}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Total In Queue:</span>
                    <span className={`font-mono text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{content.data.count} candidates</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Operational Category:</span>
                    <span className={`uppercase font-mono ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{content.data.category}</span>
                  </div>
                </div>

                <div className={`p-3.5 rounded-xl border ${
                  isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  <h4 className={`font-semibold mb-1 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>Queue Description</h4>
                  <p className={`leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{content.data.explanation}</p>
                </div>

                <div className={`p-3.5 rounded-xl border space-y-2 ${
                  isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  <h4 className={`font-semibold mb-1 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>Recommended HR Ops Workflow</h4>
                  <ul className={`list-disc list-inside space-y-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    <li>Prioritize candidates joining within the next 24 hours.</li>
                    <li>Verify automated API matches before manual document override.</li>
                    <li>Ensure audit timestamp is logged upon task completion.</li>
                  </ul>
                </div>

                <button
                  onClick={() => {
                    onClose();
                    if (content.data.category === 'letters' && onOpenLetterSender) {
                      onOpenLetterSender();
                    } else if (content.data.category === 'kyc') {
                      onNavigate('kyc');
                    } else if (onShowToast) {
                      onShowToast(`Processing batch queue: ${content.data.title}`);
                    }
                  }}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 px-3 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-lg transition-colors"
                >
                  <Zap className="w-4 h-4" />
                  <span>Execute {content.data.actionLabel}</span>
                </button>
              </>
            )}

            {/* 3. 2CWORLD AI INSIGHT DRILL-DOWN */}
            {content.type === 'insight' && (
              <>
                <div className={`p-3.5 rounded-xl border space-y-2 ${
                  isDark ? 'bg-sky-950/40 border-sky-800/60' : 'bg-sky-50 border-sky-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-sky-600 font-semibold">Priority Level:</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                        content.data.priority === 'Critical'
                          ? (isDark ? 'bg-rose-950 text-rose-300 border-rose-800' : 'bg-rose-50 text-rose-700 border-rose-200')
                          : (isDark ? 'bg-amber-950 text-amber-300 border-amber-800' : 'bg-amber-50 text-amber-700 border-amber-200')
                      }`}
                    >
                      {content.data.priority} Priority
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Affected Candidates:</span>
                    <span className={`font-mono text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{content.data.affectedCount} Candidates</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Lifecycle Stage:</span>
                    <span className={`font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{content.data.category}</span>
                  </div>
                </div>

                <div className={`p-3.5 rounded-xl border ${
                  isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  <h4 className={`font-semibold mb-1 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>AI Root Cause Analysis</h4>
                  <p className={`leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{content.data.description}</p>
                </div>

                <div className={`p-3.5 rounded-xl border space-y-1.5 ${
                  isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  <h4 className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>Recommended Action Plan</h4>
                  <p className={isDark ? 'text-slate-400' : 'text-slate-600'}>
                    Executing this action immediately will reduce onboarding lag and prevent Day-1 joining drop-offs.
                  </p>
                </div>

                <button
                  onClick={() => {
                    onClose();
                    if (content.data.actionId === 'open-letter-sender' && onOpenLetterSender) {
                      onOpenLetterSender();
                    } else if (content.data.actionId === 'open-kyc-queue') {
                      onNavigate('kyc');
                    } else if (onShowToast) {
                      onShowToast(`Triggered AI Action: ${content.data.suggestedAction}`);
                    }
                  }}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 px-3 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-lg transition-colors"
                >
                  <Zap className="w-4 h-4" />
                  <span>{content.data.suggestedAction}</span>
                </button>
              </>
            )}

            {/* 4. AT RISK DRILL-DOWN */}
            {content.type === 'at-risk' && (
              <>
                <div className={`p-3.5 rounded-xl border space-y-2 ${
                  isDark ? 'bg-rose-950/40 border-rose-800/60' : 'bg-rose-50 border-rose-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Client:</span>
                    <span className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{content.data.client}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Joining Date:</span>
                    <span className="font-mono font-bold text-amber-600">{content.data.joiningDate}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Risk Severity:</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                      isDark ? 'bg-rose-950 text-rose-300 border-rose-800' : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}>
                      {content.data.riskLevel}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Recruiter Owner:</span>
                    <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>{content.data.recruiter}</span>
                  </div>
                </div>

                <div className={`p-3.5 rounded-xl border ${
                  isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  <h4 className="font-semibold text-rose-600 mb-1 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-500" />
                    Risk Trigger Reason
                  </h4>
                  <p className={`leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{content.data.riskReason}</p>
                  <div className={`mt-2 pt-2 border-t text-[11px] ${
                    isDark ? 'border-slate-800 text-slate-400' : 'border-slate-200 text-slate-500'
                  }`}>
                    Last Recorded Activity: {content.data.lastActivity}
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (onShowToast) onShowToast(`Action taken: ${content.data.recommendedAction}`);
                    onClose();
                  }}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 px-3 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-lg transition-colors"
                >
                  <Zap className="w-4 h-4" />
                  <span>Execute {content.data.recommendedAction}</span>
                </button>
              </>
            )}

            {/* 5. SLA BREACH DRILL-DOWN */}
            {content.type === 'sla' && (
              <>
                <div className={`p-3.5 rounded-xl border space-y-2 ${
                  isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Items Pending:</span>
                    <span className="font-mono text-base font-bold text-rose-600">{content.data.count} items</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Threshold Target:</span>
                    <span className={isDark ? 'text-slate-200' : 'text-slate-800'}>{content.data.threshold}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Oldest Pending Item:</span>
                    <span className="font-mono text-amber-600">{content.data.oldestPending}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Average Aging:</span>
                    <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>{content.data.avgAging}</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (onShowToast) onShowToast(`SLA escalation sent for ${content.data.category}`);
                    onClose();
                  }}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 px-3 bg-amber-600 hover:bg-amber-500 text-white font-semibold rounded-lg transition-colors"
                >
                  <Clock className="w-4 h-4" />
                  <span>{content.data.actionLabel}</span>
                </button>
              </>
            )}
          </div>

          {/* Footer */}
          <div className={`p-4 border-t flex items-center justify-between text-xs ${
            isDark ? 'border-slate-800 bg-slate-950/80' : 'border-slate-100 bg-slate-50/80'
          }`}>
            <span className={isDark ? 'text-slate-500' : 'text-slate-500'}>2COMS Ops Real-Time Sync</span>
            <button
              onClick={onClose}
              className={`px-3.5 py-1.5 rounded-md transition-colors ${
                isDark 
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-200' 
                  : 'bg-slate-200 hover:bg-slate-300 text-slate-800'
              }`}
            >
              Close Drawer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
