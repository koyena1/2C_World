import React, { useState, useMemo } from 'react';
import { downloadCsv } from '../../utils/download';
import {
  X,
  FileText,
  Send,
  CheckCircle2,
  Clock,
  AlertCircle,
  Download,
  Eye,
  Building2,
  MapPin,
  Calendar,
  Search,
  ExternalLink,
  Filter,
  Check,
  ChevronRight,
  ArrowRight,
  RotateCcw
} from 'lucide-react';
import { OfferLetterCandidate, OfferLetterStatus } from '../../types/offerLetter';
import { useTheme } from '../../hooks/useTheme';

interface OfferLetterStatusDetailDrawerProps {
  isOpen: boolean;
  status: OfferLetterStatus | null;
  candidates: OfferLetterCandidate[];
  onClose: () => void;
  onSelectCandidatePreview: (candidate: OfferLetterCandidate) => void;
  onPreviewLetter: (candidate: OfferLetterCandidate) => void;
  onSendOrResend: (candidate: OfferLetterCandidate) => void;
  onDownloadLetter: (candidate: OfferLetterCandidate) => void;
  onFilterMainTable: (status: OfferLetterStatus) => void;
  onOpenCandidate360?: (candidateCode: string) => void;
}

export const OfferLetterStatusDetailDrawer: React.FC<OfferLetterStatusDetailDrawerProps> = ({
  isOpen,
  status,
  candidates,
  onClose,
  onSelectCandidatePreview,
  onPreviewLetter,
  onSendOrResend,
  onDownloadLetter,
  onFilterMainTable,
  onOpenCandidate360
}) => {
  const { isDark } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClientFilter, setSelectedClientFilter] = useState<string>('All');

  // Filter candidates strictly belonging to this status
  const statusCandidates = useMemo(() => {
    if (!status) return [];
    return candidates.filter((c) => c.offerLetterStatus === status);
  }, [candidates, status]);

  // Client breakdown
  const clientBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    statusCandidates.forEach((c) => {
      map[c.client] = (map[c.client] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [statusCandidates]);

  // Filtered candidate list inside drawer
  const displayedCandidates = useMemo(() => {
    return statusCandidates.filter((c) => {
      if (selectedClientFilter !== 'All' && c.client !== selectedClientFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = c.candidateName.toLowerCase().includes(q);
        const matchesCode = c.candidateCode.toLowerCase().includes(q);
        const matchesEmail = c.email.toLowerCase().includes(q);
        const matchesDesignation = c.designation.toLowerCase().includes(q);
        const matchesClient = c.client.toLowerCase().includes(q);
        return matchesName || matchesCode || matchesEmail || matchesDesignation || matchesClient;
      }
      return true;
    });
  }, [statusCandidates, selectedClientFilter, searchQuery]);

  if (!isOpen || !status) return null;

  // Status-specific themes & metadata (without invented 24h or mandatory Aadhaar eSign rules)
  const getStatusConfig = () => {
    switch (status) {
      case 'Not Sent':
        return {
          title: 'Offer Letter Not Sent',
          subtitle: 'Candidates with prepared or drafted offer letters awaiting rollout or blocked by compliance issues',
          badgeBg: 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border-rose-300 dark:border-rose-700',
          accentColor: 'text-rose-600 dark:text-rose-400',
          icon: AlertCircle
        };
      case 'Sent':
        return {
          title: 'Offer Letter Sent',
          subtitle: 'Offer letters dispatched to candidates for review and digital acceptance',
          badgeBg: 'bg-sky-100 text-sky-800 dark:bg-sky-950/80 dark:text-sky-300 border-sky-300 dark:border-sky-700',
          accentColor: 'text-sky-600 dark:text-sky-400',
          icon: Send
        };
      case 'Signed':
        return {
          title: 'Offer Letter Signed',
          subtitle: 'Candidates who have successfully completed acceptance of formal employment terms',
          badgeBg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700',
          accentColor: 'text-emerald-600 dark:text-emerald-400',
          icon: CheckCircle2
        };
      case 'Sent But Not Signed':
        return {
          title: 'Sent But Not Signed',
          subtitle: 'Offer letters delivered to candidates where digital acceptance or signature is currently pending',
          badgeBg: 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border-amber-300 dark:border-amber-700',
          accentColor: 'text-amber-600 dark:text-amber-400',
          icon: Clock
        };
      default:
        return {
          title: 'Offer Letter Status Details',
          subtitle: 'Candidate offer letter rollout records',
          badgeBg: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300',
          accentColor: 'text-purple-600 dark:text-purple-400',
          icon: FileText
        };
    }
  };

  const config = getStatusConfig();
  const IconComponent = config.icon;

  const handleExportStatusCsv = () => {
    const headers = ['Name', 'Code', 'Client', 'Designation', 'Location', 'DOJ', 'Generated', 'Sent', 'Status', 'Gross Salary', 'Blocking Issue'];
    const rows = displayedCandidates.map((c) => [
      `"${c.candidateName}"`,
      `"${c.candidateCode}"`,
      `"${c.client}"`,
      `"${c.designation}"`,
      `"${c.location}"`,
      `"${c.dateOfJoining}"`,
      `"${c.letterGeneratedDate}"`,
      `"${c.letterSentDate || 'Not Sent'}"`,
      `"${c.offerLetterStatus}"`,
      c.grossSalaryMonthly,
      `"${c.blockingIssue}"`
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    downloadCsv(csvContent, `${status.replace(/\s+/g, '_')}_Candidates_${new Date().toISOString().split('T')[0]}.csv`);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true" aria-labelledby="status-drawer-title">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className={`w-screen max-w-2xl shadow-2xl flex flex-col transition-transform duration-200 ease-in-out border-l ${
          isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
        }`}>
          {/* Header with status count */}
          <div className={`p-4 sm:p-5 border-b shrink-0 flex items-center justify-between ${
            isDark ? 'border-slate-800 bg-slate-950/80' : 'border-slate-200 bg-slate-50/80'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${config.badgeBg}`}>
                <IconComponent className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 id="status-drawer-title" className="text-base font-bold tracking-tight">
                    {config.title}
                  </h2>
                  <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded-full border ${config.badgeBg}`}>
                    {statusCandidates.length} Candidates
                  </span>
                </div>
                <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {config.subtitle}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className={`p-2 rounded-lg transition-colors ${
                isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-slate-200 text-slate-500 hover:text-slate-900'
              }`}
              title="Close drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body: Client Filter + Candidate Search + Candidate List (Simplified, no redundant metric cards) */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5">
            
            {/* Client Filter Pills */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Filter by Client
                </span>
                {selectedClientFilter !== 'All' && (
                  <button
                    onClick={() => setSelectedClientFilter('All')}
                    className="text-[11px] text-purple-600 dark:text-purple-400 hover:underline font-semibold"
                  >
                    Clear Filter
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setSelectedClientFilter('All')}
                  className={`text-[11px] font-medium px-2 py-0.5 rounded-md border transition-colors ${
                    selectedClientFilter === 'All'
                      ? 'bg-purple-600 text-white border-purple-600'
                      : isDark
                      ? 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                      : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                  }`}
                >
                  All ({statusCandidates.length})
                </button>
                {clientBreakdown.map(([clientName, count]) => (
                  <button
                    key={clientName}
                    type="button"
                    onClick={() => setSelectedClientFilter(selectedClientFilter === clientName ? 'All' : clientName)}
                    className={`text-[11px] font-medium px-2 py-0.5 rounded-md border transition-colors flex items-center gap-1 ${
                      selectedClientFilter === clientName
                        ? 'bg-purple-600 text-white border-purple-600'
                        : isDark
                        ? 'bg-slate-850 text-slate-300 border-slate-700 hover:bg-slate-800'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span>{clientName}</span>
                    <span className="text-[10px] font-mono px-1 rounded-sm bg-black/10 dark:bg-white/10">{count}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Search inside status */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder={`Search within ${statusCandidates.length} ${status} candidates...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border focus:outline-none focus:border-purple-500 ${
                  isDark ? 'bg-slate-950 border-slate-800 text-slate-200' : 'bg-white border-slate-300 text-slate-900'
                }`}
              />
            </div>

            {/* Candidate List Count & Subheader */}
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1">
              <span className="font-semibold">
                Candidates ({displayedCandidates.length})
              </span>
              {displayedCandidates.length < statusCandidates.length && (
                <span className="text-[11px] text-purple-500 font-medium">Filtered</span>
              )}
            </div>

            {/* Candidates List */}
            {displayedCandidates.length === 0 ? (
              <div className="p-8 text-center border rounded-xl border-dashed border-slate-300 dark:border-slate-800 text-slate-400 text-xs">
                <FileText className="w-7 h-7 mx-auto mb-2 text-slate-400" />
                <p className="font-semibold text-slate-700 dark:text-slate-300">No candidates found</p>
                <p className="text-[11px] mt-0.5">Try adjusting the client filter or search query</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {displayedCandidates.map((cand) => {
                  const hasIssue = cand.blockingIssue && cand.blockingIssue !== 'None';
                  return (
                    <div
                      key={cand.id}
                      className={`p-3 rounded-xl border transition-all ${
                        isDark
                          ? 'bg-slate-950/60 border-slate-800 hover:border-purple-500/40'
                          : 'bg-white border-slate-200 hover:border-purple-300 hover:shadow-xs'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                        {/* Candidate Identity */}
                        <div className="flex items-start gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-bold text-xs flex items-center justify-center shrink-0">
                            {cand.candidateName.split(' ').map((n) => n[0]).join('')}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => onSelectCandidatePreview(cand)}
                                className="font-bold text-xs text-slate-900 dark:text-white hover:text-purple-600 dark:hover:text-purple-300 hover:underline transition-colors text-left"
                                title="Click to view full Offer Letter details"
                              >
                                {cand.candidateName}
                              </button>
                              <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                                {cand.candidateCode}
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                              <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                                <Building2 className="w-3 h-3 text-slate-400" />
                                {cand.client}
                              </span>
                              <span>·</span>
                              <span>{cand.designation}</span>
                              <span>·</span>
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-slate-400" />
                                {cand.location}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Joining Date */}
                        <div className="text-right shrink-0 text-xs">
                          <div className="flex items-center gap-1 justify-end text-[11px] text-slate-600 dark:text-slate-300 font-medium">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            <span>DOJ: {cand.dateOfJoining}</span>
                          </div>
                          <span className={`text-[10px] px-1.5 py-0.2 rounded font-medium inline-block mt-1 ${
                            cand.candidateStatus === 'Offer Accepted'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                          }`}>
                            {cand.candidateStatus}
                          </span>
                        </div>
                      </div>

                      {/* Relevant Issue Reason / Sent Details */}
                      {hasIssue ? (
                        <div className="mt-2.5 p-2 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 flex items-center justify-between text-[11px]">
                          <span className="flex items-center gap-1.5 text-amber-800 dark:text-amber-300 font-medium">
                            <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span>Issue: {cand.blockingIssue}</span>
                          </span>
                          <span className="text-[10px] text-amber-700 dark:text-amber-400 font-semibold uppercase">
                            Action Required
                          </span>
                        </div>
                      ) : (
                        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1.5 border-t border-slate-100 dark:border-slate-800">
                          <span>Generated: {cand.letterGeneratedDate}</span>
                          {cand.letterSentDate && <span>Sent: {cand.letterSentDate}</span>}
                          {cand.letterAcceptanceDate && <span className="text-emerald-500 font-semibold">Accepted: {cand.letterAcceptanceDate}</span>}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          {/* Primary View Details Button */}
                          <button
                            type="button"
                            onClick={() => onSelectCandidatePreview(cand)}
                            className="px-2.5 py-1 rounded text-[11px] font-bold bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-1 transition-colors shadow-2xs"
                            title="Open foreground Offer Letter Details"
                          >
                            <Eye className="w-3 h-3" />
                            <span>View Details</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => onPreviewLetter(cand)}
                            className={`px-2.5 py-1 rounded text-[11px] font-semibold border flex items-center gap-1 transition-colors ${
                              isDark
                                ? 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
                                : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                            }`}
                            title="Preview Letter Document"
                          >
                            <FileText className="w-3 h-3" />
                            <span>View Letter</span>
                          </button>
                        </div>

                        <div>
                          {cand.offerLetterStatus === 'Not Sent' && (
                            <button
                              type="button"
                              onClick={() => onSendOrResend(cand)}
                              className="px-2.5 py-1 rounded text-[11px] font-semibold border border-purple-500/40 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950 flex items-center gap-1 transition-colors"
                              title="Send Offer Letter"
                            >
                              <Send className="w-3 h-3" />
                              <span>Send Letter</span>
                            </button>
                          )}

                          {(cand.offerLetterStatus === 'Sent' || cand.offerLetterStatus === 'Sent But Not Signed') && (
                            <button
                              type="button"
                              onClick={() => onSendOrResend(cand)}
                              className="px-2.5 py-1 rounded text-[11px] font-semibold border border-sky-500/40 text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950 flex items-center gap-1 transition-colors"
                              title="Resend Offer Letter"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>Resend Letter</span>
                            </button>
                          )}

                          {cand.offerLetterStatus === 'Signed' && (
                            <button
                              type="button"
                              onClick={() => onDownloadLetter(cand)}
                              className="px-2.5 py-1 rounded text-[11px] font-semibold border border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950 flex items-center gap-1 transition-colors"
                              title="Download Signed Letter"
                            >
                              <Download className="w-3 h-3" />
                              <span>Download</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Fixed Footer */}
          <div className={`p-4 sm:p-5 border-t shrink-0 flex items-center justify-between gap-3 ${
            isDark ? 'border-slate-800 bg-slate-950' : 'border-slate-200 bg-slate-50'
          }`}>
            <button
              type="button"
              onClick={handleExportStatusCsv}
              className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                isDark
                  ? 'border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200'
                  : 'border-slate-300 bg-white hover:bg-slate-100 text-slate-700'
              }`}
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export {status} CSV</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  onFilterMainTable(status);
                  onClose();
                }}
                className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-1.5 shadow-sm transition-colors"
              >
                <span>Filter in Main Table</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
