import React, { useEffect } from 'react';
import {
  X,
  FileText,
  Send,
  CheckCircle2,
  Clock,
  AlertCircle,
  Download,
  Building2,
  MapPin,
  Calendar,
  Mail,
  Phone,
  ShieldCheck,
  ShieldAlert,
  ArrowLeft,
  ExternalLink,
  RotateCcw,
  UserCheck,
  Briefcase,
  DollarSign
} from 'lucide-react';
import { OfferLetterCandidate, OfferLetterStatus } from '../../types/offerLetter';
import { useTheme } from '../../hooks/useTheme';

interface OfferLetterDetailDrawerProps {
  isOpen: boolean;
  candidate: OfferLetterCandidate | null;
  onClose: () => void;
  onBackToList?: () => void;
  onPreviewLetter: (candidate: OfferLetterCandidate) => void;
  onSendOrResend: (candidate: OfferLetterCandidate) => void;
  onDownloadLetter: (candidate: OfferLetterCandidate) => void;
  onOpenCandidate360?: (candidateCode: string) => void;
  sourceContextTitle?: string; // e.g. "Offer Letter Sent List" or "Offer Letter Operations"
}

export const OfferLetterDetailDrawer: React.FC<OfferLetterDetailDrawerProps> = ({
  isOpen,
  candidate,
  onClose,
  onBackToList,
  onPreviewLetter,
  onSendOrResend,
  onDownloadLetter,
  onOpenCandidate360,
  sourceContextTitle = 'Offer Letter List'
}) => {
  const { isDark } = useTheme();

  // Prevent background scroll when foreground drawer is open
  useEffect(() => {
    if (isOpen) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isOpen]);

  if (!isOpen || !candidate) return null;

  const renderStatusBadge = (status: OfferLetterStatus) => {
    switch (status) {
      case 'Signed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/90 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            Signed
          </span>
        );
      case 'Sent But Not Signed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/90 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
            <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            Sent But Not Signed
          </span>
        );
      case 'Sent':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-sky-100 text-sky-800 dark:bg-sky-950/90 dark:text-sky-300 border border-sky-300 dark:border-sky-700">
            <Send className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
            Sent
          </span>
        );
      case 'Not Sent':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/90 dark:text-rose-300 border border-rose-300 dark:border-rose-700">
            <AlertCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
            Not Sent
          </span>
        );
      case 'Pending':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            Pending
          </span>
        );
    }
  };

  const getKycBadge = (status: string, label: string) => {
    const isSuccess = status === 'Verified';
    const isDanger = status === 'Failed' || status === 'Rejected' || status === 'API Mismatch';
    return (
      <div className={`p-2 rounded-lg border text-xs flex items-center justify-between ${
        isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-50 border-slate-200'
      }`}>
        <span className="text-slate-500 dark:text-slate-400 font-medium">{label}</span>
        <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
          isSuccess
            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
            : isDanger
            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
            : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
        }`}>
          {status}
        </span>
      </div>
    );
  };

  const isBlocked = candidate.blockingIssue && candidate.blockingIssue !== 'None';

  return (
    <div className="fixed inset-0 z-[70] overflow-hidden" role="dialog" aria-modal="true" aria-labelledby="offer-letter-detail-title">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className={`w-screen max-w-2xl shadow-2xl flex flex-col transition-transform duration-200 ease-in-out border-l ${
          isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
        }`}>
          
          {/* Header */}
          <div className={`p-4 sm:p-5 border-b flex items-center justify-between shrink-0 ${
            isDark ? 'border-slate-800 bg-slate-950/70' : 'border-slate-200 bg-slate-50/70'
          }`}>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onBackToList || onClose}
                className={`p-1.5 rounded-lg border transition-colors flex items-center gap-1.5 text-xs font-semibold ${
                  isDark
                    ? 'border-slate-800 hover:bg-slate-800 text-slate-300'
                    : 'border-slate-300 hover:bg-slate-200 text-slate-700'
                }`}
                title="Back to Offer Letter List"
              >
                <ArrowLeft className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span className="hidden sm:inline">Back to {sourceContextTitle}</span>
                <span className="sm:hidden">Back</span>
              </button>

              <div className="h-4 w-px bg-slate-300 dark:bg-slate-700" />

              <div>
                <div className="flex items-center gap-2">
                  <h2 id="offer-letter-detail-title" className="text-base font-bold tracking-tight">
                    Offer Letter Details
                  </h2>
                  {renderStatusBadge(candidate.offerLetterStatus)}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Candidate ID: <span className="font-mono font-semibold text-purple-600 dark:text-purple-400">{candidate.candidateCode}</span>
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className={`p-2 rounded-lg transition-colors ${
                isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-slate-200 text-slate-500 hover:text-slate-900'
              }`}
              title="Close panel"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs">

            {/* Candidate Identity Card */}
            <div className={`p-4 rounded-xl border ${
              isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl bg-purple-600/15 border border-purple-500/30 text-purple-600 dark:text-purple-400 font-bold text-base flex items-center justify-center shrink-0">
                    {candidate.candidateName.split(' ').map((n) => n[0]).join('')}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      {candidate.candidateName}
                    </h3>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-slate-500 dark:text-slate-400 mt-1">
                      <span className="flex items-center gap-1 font-medium text-slate-800 dark:text-slate-200">
                        <Building2 className="w-3.5 h-3.5 text-purple-500" />
                        {candidate.client}
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                        {candidate.designation}
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {candidate.location}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-[11px] text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1">
                        <Mail className="w-3 h-3 text-slate-400" />
                        {candidate.email}
                      </span>
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        {candidate.phone}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold border ${
                    candidate.candidateStatus === 'Offer Accepted' || candidate.candidateStatus === 'Joined'
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                      : 'bg-purple-50 dark:bg-purple-950/60 border-purple-300 dark:border-purple-800 text-purple-700 dark:text-purple-300'
                  }`}>
                    {candidate.candidateStatus}
                  </span>
                  <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 justify-end">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    <span>Joining Date: <strong>{candidate.dateOfJoining}</strong></span>
                  </div>
                </div>
              </div>
            </div>

            {/* Offer Letter Lifecycle & Delivery Information */}
            <div className={`p-4 rounded-xl border ${
              isDark ? 'bg-slate-950/50 border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-slate-100 dark:border-slate-800">
                <span className="font-bold text-xs uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <span>Offer Letter Lifecycle & Delivery</span>
                </span>
                <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                  Type: {candidate.letterGenerationType}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className={`p-2.5 rounded-lg border ${
                  isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50/70 border-slate-200'
                }`}>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                    Letter Generated Date
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {candidate.letterGeneratedDate || 'Not Available'}
                  </span>
                </div>

                <div className={`p-2.5 rounded-lg border ${
                  isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50/70 border-slate-200'
                }`}>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                    Letter Sent Date
                  </span>
                  <span className={`font-semibold ${
                    candidate.letterSentDate ? 'text-slate-900 dark:text-white' : 'text-slate-400'
                  }`}>
                    {candidate.letterSentDate || 'Not Dispatched Yet'}
                  </span>
                </div>

                <div className={`p-2.5 rounded-lg border ${
                  isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50/70 border-slate-200'
                }`}>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                    Acceptance / Signed Date
                  </span>
                  <span className={`font-semibold ${
                    candidate.letterAcceptanceDate ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'
                  }`}>
                    {candidate.signedAt || candidate.letterAcceptanceDate || 'Pending Candidate Acceptance'}
                  </span>
                </div>

                <div className={`p-2.5 rounded-lg border ${
                  isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50/70 border-slate-200'
                }`}>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                    Delivery Channel & Status
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {candidate.sentChannel ? `Delivered via ${candidate.sentChannel}` : 'Not Dispatched'}
                  </span>
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                <span>Template: <strong className="text-slate-700 dark:text-slate-300 font-mono">{candidate.templateName}</strong></span>
                <span>Department: <strong className="text-slate-700 dark:text-slate-300">{candidate.department}</strong></span>
              </div>
            </div>

            {/* Blocking Reason / Risk Assessment */}
            <div className={`p-4 rounded-xl border ${
              isBlocked
                ? 'bg-amber-50/60 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800/80'
                : 'bg-emerald-50/50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/80'
            }`}>
              <div className="flex items-center gap-2 mb-1.5">
                {isBlocked ? (
                  <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                )}
                <h4 className={`font-bold text-xs ${
                  isBlocked ? 'text-amber-900 dark:text-amber-200' : 'text-emerald-900 dark:text-emerald-200'
                }`}>
                  {isBlocked ? 'Rollout Blocking Issue / Compliance Flag' : 'Rollout Status: Ready & Clear'}
                </h4>
              </div>

              <p className={`text-xs pl-6 leading-relaxed ${
                isBlocked ? 'text-amber-800 dark:text-amber-300 font-medium' : 'text-emerald-800 dark:text-emerald-300'
              }`}>
                {isBlocked
                  ? candidate.blockingIssue
                  : 'All primary statutory criteria, KYC parameters, and approval annexures are satisfied.'}
              </p>

              {candidate.notes && (
                <div className={`mt-2.5 ml-6 p-2 rounded-lg text-[11px] border ${
                  isDark ? 'bg-slate-900/90 border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-700'
                }`}>
                  <span className="font-semibold block text-slate-400 uppercase text-[10px]">Operations Note:</span>
                  {candidate.notes}
                </div>
              )}
            </div>

            {/* Compensation & Contract Details (Moved from summary to detail drawer as permitted) */}
            <div className={`p-4 rounded-xl border ${
              isDark ? 'bg-slate-950/50 border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-100 dark:border-slate-800">
                <span className="font-bold text-xs uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Compensation & Contract Terms</span>
                </span>
                <span className="text-[11px] text-slate-500">
                  End of Contract: {candidate.endOfContract || 'Full-time / Indefinite'}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className={`p-2.5 rounded-lg border ${
                  isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Gross Monthly</span>
                  <span className="text-base font-bold font-mono text-slate-900 dark:text-white">
                    ₹{candidate.grossSalaryMonthly.toLocaleString()}
                  </span>
                </div>

                <div className={`p-2.5 rounded-lg border ${
                  isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Annual CTC</span>
                  <span className="text-base font-bold font-mono text-purple-600 dark:text-purple-400">
                    ₹{candidate.annualCtc.toLocaleString()}
                  </span>
                </div>

                <div className={`p-2.5 rounded-lg border col-span-2 sm:col-span-1 ${
                  isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Assigned Recruiter</span>
                  <span className="font-semibold text-slate-900 dark:text-white truncate block">
                    {candidate.isMyCandidate ? 'You (My Candidate)' : 'Regional HR Ops'}
                  </span>
                </div>
              </div>
            </div>

            {/* KYC & Statutory Verification Summary */}
            <div className={`p-4 rounded-xl border ${
              isDark ? 'bg-slate-950/50 border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-100 dark:border-slate-800">
                <span className="font-bold text-xs uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                  <span>Statutory KYC & Bank Verification</span>
                </span>
                <span className="text-[10px] text-slate-400">Prerequisite Checks</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {getKycBadge(candidate.bankVerificationStatus, 'Bank Penny Drop')}
                {getKycBadge(candidate.aadhaarKycStatus, 'Aadhaar KYC')}
                {getKycBadge(candidate.panKycStatus, 'PAN KYC')}
                {getKycBadge(candidate.bankKycStatus, 'Bank Status')}
                {getKycBadge(candidate.uanKycStatus, 'UAN Status')}
              </div>
            </div>

          </div>

          {/* Fixed Action Footer */}
          <div className={`p-4 sm:p-5 border-t shrink-0 flex flex-wrap items-center justify-between gap-3 ${
            isDark ? 'border-slate-800 bg-slate-950' : 'border-slate-200 bg-slate-50'
          }`}>
            {/* Candidate 360 separate action */}
            <div>
              {onOpenCandidate360 && (
                <button
                  type="button"
                  onClick={() => onOpenCandidate360(candidate.candidateCode)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                    isDark
                      ? 'border-slate-700 bg-slate-850 hover:bg-slate-800 text-slate-300'
                      : 'border-slate-300 bg-white hover:bg-slate-100 text-slate-700 shadow-2xs'
                  }`}
                  title="Open comprehensive 360 profile"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                  <span>Candidate 360</span>
                </button>
              )}
            </div>

            {/* Primary Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => onDownloadLetter(candidate)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  isDark
                    ? 'border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200'
                    : 'border-slate-300 bg-white hover:bg-slate-100 text-slate-700 shadow-2xs'
                }`}
                title="Download Offer Letter PDF / Document"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download PDF</span>
              </button>

              <button
                type="button"
                onClick={() => onPreviewLetter(candidate)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  isDark
                    ? 'border-purple-600/40 bg-purple-950/60 hover:bg-purple-900/60 text-purple-300'
                    : 'border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-700'
                }`}
                title="View formal offer letter document text and formatting"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>View Letter</span>
              </button>

              {candidate.offerLetterStatus === 'Not Sent' && (
                <button
                  type="button"
                  onClick={() => onSendOrResend(candidate)}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-1.5 shadow-sm transition-colors"
                  title="Send Offer Letter to Candidate"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Offer Letter</span>
                </button>
              )}

              {(candidate.offerLetterStatus === 'Sent' || candidate.offerLetterStatus === 'Sent But Not Signed') && (
                <button
                  type="button"
                  onClick={() => onSendOrResend(candidate)}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white flex items-center gap-1.5 shadow-sm transition-colors"
                  title="Resend Offer Letter Link to Candidate"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Resend Offer Letter</span>
                </button>
              )}

              {candidate.offerLetterStatus === 'Signed' && (
                <button
                  type="button"
                  onClick={() => onPreviewLetter(candidate)}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-sm transition-colors"
                  title="View Signed Acceptance Document"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>View Signed Letter</span>
                </button>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
