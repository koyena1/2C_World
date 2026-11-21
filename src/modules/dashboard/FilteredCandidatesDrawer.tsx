import React, { useState, useMemo } from 'react';
import {
  X,
  Search,
  Filter,
  Download,
  RotateCcw,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  UserCheck,
  FileText,
  Send,
  AlertTriangle,
  Building2,
  Users,
  MapPin,
  Clock,
  Eye,
  CheckCircle2,
  AlertCircle,
  Mail,
  Phone,
  ShieldCheck,
  Calendar,
  Sparkles,
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import { JoinerCandidate, DashboardFilterState } from '../../data/mockDashboardData';
import { useTheme } from '../../hooks/useTheme';

import { SelectMenu } from '../../components/ui/SelectMenu';
interface FilteredCandidatesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  candidates: JoinerCandidate[];
  filters: DashboardFilterState;
  selectedClientName: string;
  selectedDateRangeLabel: string;
  onOpenCandidateProfile?: (id: string) => void;
  onOpenLetterSender?: () => void;
  onOpenDocReview?: (candidateName: string) => void;
  onShowToast?: (message: string) => void;
  onResetFilters: () => void;
  onChangeFilters: () => void;
  onSelectCandidateModal?: (cand: JoinerCandidate) => void;
}

type SortField = 'joiningDate' | 'name' | 'lastActivity';
type SortDirection = 'asc' | 'desc';

export const FilteredCandidatesDrawer: React.FC<FilteredCandidatesDrawerProps> = ({
  isOpen,
  onClose,
  candidates,
  filters,
  selectedClientName,
  selectedDateRangeLabel,
  onOpenCandidateProfile,
  onOpenLetterSender,
  onOpenDocReview,
  onShowToast,
  onResetFilters,
  onChangeFilters,
  onSelectCandidateModal,
}) => {
  const { isDark } = useTheme();

  // Controls inside drawer
  const [searchQuery, setSearchQuery] = useState('');
  const [blockingIssueFilter, setBlockingIssueFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('joiningDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Reset pagination when filter or candidates change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, blockingIssueFilter, sortField, sortDirection, candidates.length]);

  // Date field label
  const dateFieldLabel = useMemo(() => {
    const f = filters.dateField || 'joiningDate';
    if (f === 'createdDate') return 'Created Date';
    if (f === 'lastUpdatedDate') return 'Last Updated Date';
    return 'Joining Date';
  }, [filters.dateField]);

  // Filtered & Sorted candidates inside drawer
  const processedCandidates = useMemo(() => {
    let result = [...candidates];

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.candidateCode.toLowerCase().includes(q) ||
          c.designation.toLowerCase().includes(q) ||
          c.recruiter.toLowerCase().includes(q) ||
          c.branch.toLowerCase().includes(q) ||
          c.location.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.phone.includes(q)
      );
    }

    // Blocking issue filter
    if (blockingIssueFilter !== 'all') {
      result = result.filter((c) => c.blockingIssue === blockingIssueFilter);
    }

    // Sort
    result.sort((a, b) => {
      let comparison = 0;
      if (sortField === 'joiningDate') {
        comparison = a.joiningDate.localeCompare(b.joiningDate);
      } else if (sortField === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortField === 'lastActivity') {
        const aAct = a.lastActivity || '';
        const bAct = b.lastActivity || '';
        comparison = aAct.localeCompare(bAct);
      }
      return sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [candidates, searchQuery, blockingIssueFilter, sortField, sortDirection]);

  // Pagination calculation
  const totalItems = processedCandidates.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const paginatedCandidates = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return processedCandidates.slice(start, start + pageSize);
  }, [processedCandidates, currentPage, pageSize]);

  // Toggle sort
  const handleSortToggle = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // CSV Export
  const handleExportCSV = () => {
    if (processedCandidates.length === 0) {
      if (onShowToast) onShowToast('No candidates available to export.');
      return;
    }

    const headers = [
      'Candidate Name',
      'Candidate ID',
      'Client',
      'Location',
      'Branch',
      'Designation',
      'Recruiter',
      'Joining Date',
      'Status',
      'Blocking Issue',
      'Last Activity',
      'Phone',
      'Email',
    ];

    const rows = processedCandidates.map((c) => [
      `"${c.name}"`,
      `"${c.candidateCode}"`,
      `"${c.client}"`,
      `"${c.location}"`,
      `"${c.branch}"`,
      `"${c.designation}"`,
      `"${c.recruiter}"`,
      `"${c.joiningDate}"`,
      `"${c.status}"`,
      `"${c.blockingIssue}"`,
      `"${c.lastActivity || 'N/A'}"`,
      `"${c.phone}"`,
      `"${c.email}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Filtered_Candidates_${selectedClientName.replace(/\s+/g, '_')}_${filters.selectedStatus}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (onShowToast) onShowToast(`Exported ${processedCandidates.length} filtered candidate records to CSV.`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      />

      {/* Drawer Panel */}
      <div
        className={`relative w-full max-w-5xl h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-250 transition-colors ${
          isDark ? 'bg-slate-900 border-l border-slate-800 text-slate-100' : 'bg-white border-l border-slate-200 text-slate-900'
        }`}
      >
        {/* ========================================================================= */}
        {/* DRAWER HEADER: TITLE & FILTER SUMMARY                                     */}
        {/* ========================================================================= */}
        <div
          className={`p-4 sm:p-5 border-b shrink-0 transition-colors ${
            isDark ? 'bg-slate-950/90 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-400">
                <Users className="w-4.5 h-4.5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className={`text-base sm:text-lg font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Filtered Candidates
                  </h2>
                  <span
                    className={`font-mono text-xs px-2.5 py-0.5 rounded-full font-bold border ${
                      candidates.length > 0
                        ? isDark
                          ? 'bg-sky-950 text-sky-300 border-sky-800'
                          : 'bg-sky-50 text-sky-700 border-sky-200'
                        : isDark
                        ? 'bg-rose-950 text-rose-300 border-rose-800'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}
                  >
                    {candidates.length} matching candidates found
                  </span>
                </div>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Exclusively showing candidates matching all active filter criteria. Strict AND conditions applied.
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className={`p-2 rounded-lg transition-colors border ${
                isDark
                  ? 'border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
                  : 'border-slate-300 text-slate-500 hover:text-slate-900 hover:bg-slate-100'
              }`}
              title="Close drawer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Selected Filter Summary Bar */}
          <div
            className={`p-3 rounded-lg border text-xs flex flex-wrap items-center justify-between gap-2.5 ${
              isDark ? 'bg-slate-900/90 border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-800 shadow-2xs'
            }`}
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className={`text-[11px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Active Filter Summary:
              </span>

              {/* Client */}
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded font-semibold border ${
                  isDark ? 'bg-sky-950/80 text-sky-300 border-sky-800' : 'bg-sky-50 text-sky-800 border-sky-200'
                }`}
              >
                <Building2 className="w-3 h-3" />
                <span>Client: <strong>{selectedClientName}</strong></span>
              </span>

              {/* Status */}
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded font-semibold border ${
                  filters.selectedStatus === 'Offer Dropped'
                    ? isDark ? 'bg-rose-950/80 text-rose-300 border-rose-800' : 'bg-rose-50 text-rose-800 border-rose-200'
                    : filters.selectedStatus === 'Yet to Join'
                    ? isDark ? 'bg-amber-950/80 text-amber-300 border-amber-800' : 'bg-amber-50 text-amber-800 border-amber-200'
                    : isDark ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800' : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                }`}
              >
                <CheckCircle2 className="w-3 h-3" />
                <span>Status: <strong>{filters.selectedStatus === 'all' ? 'All Statuses' : filters.selectedStatus}</strong></span>
              </span>

              {/* Date Range */}
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded font-semibold border ${
                  isDark ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-300'
                }`}
              >
                <Calendar className="w-3 h-3 text-sky-500" />
                <span>Date Range: <strong>{selectedDateRangeLabel}</strong></span>
              </span>

              {/* Date Applies To */}
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded font-semibold border ${
                  isDark ? 'bg-purple-950/80 text-purple-300 border-purple-800' : 'bg-purple-50 text-purple-800 border-purple-200'
                }`}
              >
                <Clock className="w-3 h-3 text-purple-400" />
                <span>Date Applies To: <strong>{dateFieldLabel}</strong></span>
              </span>

              {/* Extra Filters (Location, Branch, Recruiter) */}
              {filters.selectedLocation !== 'all' && (
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-medium border ${
                    isDark ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  <MapPin className="w-3 h-3" />
                  <span>Loc: {filters.selectedLocation}</span>
                </span>
              )}
              {filters.selectedBranch !== 'all' && (
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-medium border ${
                    isDark ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  Branch: {filters.selectedBranch}
                </span>
              )}
              {filters.selectedRecruiter !== 'all' && (
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-medium border ${
                    isDark ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  Recruiter: {filters.selectedRecruiter}
                </span>
              )}
            </div>

            {/* Quick Actions in Filter Summary */}
            <div className="flex items-center gap-2">
              <button
                onClick={onChangeFilters}
                className={`px-2.5 py-1 text-xs font-semibold rounded border transition-colors ${
                  isDark
                    ? 'border-slate-700 bg-slate-800 hover:bg-slate-750 text-sky-400 hover:text-white'
                    : 'border-slate-300 bg-slate-100 hover:bg-slate-200 text-sky-700'
                }`}
                title="Change or refine filter criteria"
              >
                Change Filters
              </button>
              <button
                onClick={onResetFilters}
                className={`px-2.5 py-1 text-xs font-semibold rounded border transition-colors flex items-center gap-1 ${
                  isDark
                    ? 'border-slate-700 bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white'
                    : 'border-slate-300 bg-white hover:bg-slate-50 text-slate-700'
                }`}
                title="Clears all selected filters and restores the full dashboard view."
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Filters</span>
              </button>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* TOOLBAR CONTROLS: SEARCH, BLOCKING ISSUE, SORT, EXPORT                    */}
        {/* ========================================================================= */}
        <div
          className={`p-3 sm:px-5 border-b shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs ${
            isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          }`}
        >
          {/* Left: Search input */}
          <div className="relative flex-1 max-w-sm">
            <Search className={`w-3.5 h-3.5 absolute left-3 top-2.5 ${isDark ? 'text-slate-400' : 'text-slate-400'}`} />
            <input
              type="text"
              placeholder="Search candidate name, ID, role, recruiter..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-9 pr-3 py-1.5 rounded-lg border text-xs outline-none transition-colors ${
                isDark
                  ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-400 focus:border-sky-400'
                  : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400 focus:border-sky-500'
              }`}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-200"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Right: Controls & Export */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Filter by Blocking Issue */}
            <div className="flex items-center gap-1.5">
              <span className={`text-[11px] font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Issue:
              </span>
              <SelectMenu
                value={blockingIssueFilter}
                onChange={(e) => setBlockingIssueFilter(e.target.value)}
                className={`border text-xs rounded-md px-2.5 py-1.5 font-medium outline-none ${
                  isDark
                    ? 'bg-slate-800 border-slate-700 text-white'
                    : 'bg-white border-slate-300 text-slate-800'
                }`}
              >
                <option value="all">All Blocking Issues</option>
                <option value="Document Pending">Document Pending</option>
                <option value="KYC Pending">KYC Pending</option>
                <option value="Bank Failed">Bank Failed</option>
                <option value="Offer Letter Not Sent">Offer Letter Not Sent</option>
                <option value="Candidate Not Logged In">Candidate Not Logged In</option>
                <option value="No Blocking Issue">No Blocking Issue</option>
              </SelectMenu>
            </div>

            {/* Sort Controls */}
            <div className="flex items-center gap-1">
              <span className={`text-[11px] font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Sort:
              </span>
              <button
                onClick={() => handleSortToggle('joiningDate')}
                className={`px-2 py-1 rounded border text-[11px] font-medium transition-colors flex items-center gap-1 ${
                  sortField === 'joiningDate'
                    ? 'bg-sky-600 text-white border-sky-600 font-semibold'
                    : isDark
                    ? 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                    : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
                }`}
                title="Sort by Joining Date"
              >
                <span>Joining Date</span>
                {sortField === 'joiningDate' && (
                  sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                )}
              </button>
              <button
                onClick={() => handleSortToggle('name')}
                className={`px-2 py-1 rounded border text-[11px] font-medium transition-colors flex items-center gap-1 ${
                  sortField === 'name'
                    ? 'bg-sky-600 text-white border-sky-600 font-semibold'
                    : isDark
                    ? 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                    : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
                }`}
                title="Sort by Candidate Name"
              >
                <span>Name</span>
                {sortField === 'name' && (
                  sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                )}
              </button>
              <button
                onClick={() => handleSortToggle('lastActivity')}
                className={`px-2 py-1 rounded border text-[11px] font-medium transition-colors flex items-center gap-1 ${
                  sortField === 'lastActivity'
                    ? 'bg-sky-600 text-white border-sky-600 font-semibold'
                    : isDark
                    ? 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                    : 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
                }`}
                title="Sort by Last Activity"
              >
                <span>Last Activity</span>
                {sortField === 'lastActivity' && (
                  sortDirection === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                )}
              </button>
            </div>

            {/* Export CSV */}
            <button
              onClick={handleExportCSV}
              className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                isDark
                  ? 'border-slate-700 bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white'
                  : 'border-slate-300 bg-white hover:bg-slate-50 text-slate-700 shadow-2xs'
              }`}
              title="Export matching candidates list to CSV"
            >
              <Download className="w-3.5 h-3.5 text-sky-500" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* CANDIDATE TABLE / NO DATA EMPTY STATE                                     */}
        {/* ========================================================================= */}
        <div className="flex-1 overflow-y-auto">
          {candidates.length === 0 ? (
            /* Empty State 1: No candidates matching the selected global filters */
            <div className="p-12 text-center max-w-lg mx-auto my-12 space-y-4">
              <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center bg-rose-500/10 border border-rose-500/30 text-rose-500">
                <AlertCircle className="w-8 h-8" />
              </div>
              <div>
                <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  No candidates found for the selected filters.
                </h3>
                <p className={`text-xs mt-1.5 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  There are no candidates matching <strong>{selectedClientName}</strong> with status{' '}
                  <strong>"{filters.selectedStatus}"</strong> for <strong>{selectedDateRangeLabel}</strong> ({dateFieldLabel}).
                </p>
              </div>

              <div className="flex items-center justify-center gap-3 pt-3 flex-wrap">
                <button
                  onClick={onChangeFilters}
                  className="px-4 py-2 text-xs font-bold rounded-lg bg-sky-600 hover:bg-sky-500 text-white shadow-xs transition-colors"
                >
                  Change Filters
                </button>
                <button
                  onClick={() => {
                    onResetFilters();
                    onClose();
                  }}
                  className={`px-4 py-2 text-xs font-semibold rounded-lg border transition-colors ${
                    isDark
                      ? 'border-slate-700 bg-slate-800 hover:bg-slate-750 text-slate-200'
                      : 'border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  Reset Filters
                </button>
              </div>
            </div>
          ) : processedCandidates.length === 0 ? (
            /* Empty State 2: No candidates matching inside-drawer search query */
            <div className="p-10 text-center max-w-md mx-auto my-10 space-y-3">
              <div className="w-12 h-12 rounded-full mx-auto flex items-center justify-center bg-slate-500/10 border border-slate-500/30 text-slate-400">
                <Search className="w-6 h-6" />
              </div>
              <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                No results match "{searchQuery}"
              </h3>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Try adjusting your search keywords or clearing the blocking issue filter.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setBlockingIssueFilter('all');
                }}
                className="text-xs font-bold text-sky-500 hover:underline pt-1"
              >
                Clear Search & In-Drawer Filter
              </button>
            </div>
          ) : (
            /* Complete Filtered Candidate Table */
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr
                    className={`border-b text-[11px] font-bold uppercase tracking-wider sticky top-0 z-10 transition-colors ${
                      isDark ? 'bg-slate-950 text-slate-300 border-slate-800' : 'bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    <th className="py-3 px-3.5 whitespace-nowrap">Candidate Name</th>
                    <th className="py-3 px-3 whitespace-nowrap">Candidate ID</th>
                    <th className="py-3 px-3 whitespace-nowrap">Client</th>
                    <th className="py-3 px-3 whitespace-nowrap">Location</th>
                    <th className="py-3 px-3 whitespace-nowrap">Branch</th>
                    <th className="py-3 px-3 whitespace-nowrap">Job Role / Designation</th>
                    <th className="py-3 px-3 whitespace-nowrap">Recruiter / Sourcing HR</th>
                    <th className="py-3 px-3 whitespace-nowrap">Joining Date</th>
                    <th className="py-3 px-3 whitespace-nowrap">Current Status</th>
                    <th className="py-3 px-3 whitespace-nowrap">Blocking Issue</th>
                    <th className="py-3 px-3 whitespace-nowrap">Last Activity</th>
                    <th className="py-3 px-4 text-right whitespace-nowrap">Action</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? 'divide-slate-800 text-slate-200' : 'divide-slate-200 text-slate-700'}`}>
                  {paginatedCandidates.map((cand) => (
                    <tr
                      key={cand.id}
                      className={`transition-colors ${
                        isDark ? 'hover:bg-slate-800/60' : 'hover:bg-slate-50'
                      }`}
                    >
                      {/* 1. Candidate Name */}
                      <td className="py-3 px-3.5">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[11px] shrink-0 border ${
                              isDark
                                ? 'bg-slate-800 border-slate-700 text-sky-400'
                                : 'bg-sky-50 border-sky-200 text-sky-700'
                            }`}
                          >
                            {cand.name
                              .split(' ')
                              .map((n) => n[0])
                              .join('')
                              .slice(0, 2)}
                          </div>
                          <div>
                            <span className={`font-bold block ${isDark ? 'text-white' : 'text-slate-900'}`}>
                              {cand.name}
                            </span>
                            <span className={`text-[10px] block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                              {cand.phone}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* 2. Candidate ID / Employee Code */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span
                          className={`font-mono text-[11px] font-bold px-1.5 py-0.5 rounded border ${
                            isDark ? 'bg-slate-800 border-slate-700 text-sky-300' : 'bg-slate-100 border-slate-200 text-sky-800'
                          }`}
                        >
                          {cand.candidateCode}
                        </span>
                      </td>

                      {/* 3. Client */}
                      <td className="py-3 px-3 font-semibold whitespace-nowrap">
                        <span className={isDark ? 'text-slate-200' : 'text-slate-800'}>{cand.client}</span>
                      </td>

                      {/* 4. Location */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className={`flex items-center gap-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{cand.location}</span>
                        </span>
                      </td>

                      {/* 5. Branch */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className={`text-[11px] ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{cand.branch}</span>
                      </td>

                      {/* 6. Job Role / Designation */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className={`font-medium ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                          {cand.designation}
                        </span>
                      </td>

                      {/* 7. Recruiter / Sourcing HR */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className={`font-medium ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{cand.recruiter}</div>
                        <div className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Sourcing HR</div>
                      </td>

                      {/* 8. Joining Date */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="font-mono font-bold">{cand.joiningDate}</div>
                        <span
                          className={`text-[9px] uppercase font-bold tracking-wider ${
                            cand.joiningDate === '2026-10-05'
                              ? 'text-emerald-500'
                              : cand.joiningDate === '2026-10-06'
                              ? 'text-sky-400'
                              : 'text-slate-400'
                          }`}
                        >
                          {cand.joiningDate === '2026-10-05'
                            ? 'Today'
                            : cand.joiningDate === '2026-10-06'
                            ? 'Tomorrow'
                            : 'Scheduled'}
                        </span>
                      </td>

                      {/* 9. Current Status */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            cand.status === 'Offer Dropped'
                              ? isDark
                                ? 'bg-rose-950/80 text-rose-300 border-rose-800'
                                : 'bg-rose-50 text-rose-800 border-rose-200'
                              : cand.status === 'Yet to Join' || cand.status === 'Joining Today' || cand.status === 'Joining Tomorrow'
                              ? isDark
                                ? 'bg-amber-950/80 text-amber-300 border-amber-800'
                                : 'bg-amber-50 text-amber-800 border-amber-200'
                              : isDark
                              ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          }`}
                        >
                          {cand.status}
                        </span>
                      </td>

                      {/* 10. Blocking Issue */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        {cand.blockingIssue && cand.blockingIssue !== 'No Blocking Issue' ? (
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${
                              cand.blockingIssue === 'Bank Failed'
                                ? isDark ? 'bg-rose-950 text-rose-300 border-rose-800' : 'bg-rose-50 text-rose-800 border-rose-200'
                                : cand.blockingIssue === 'KYC Pending'
                                ? isDark ? 'bg-amber-950 text-amber-300 border-amber-800' : 'bg-amber-50 text-amber-800 border-amber-200'
                                : cand.blockingIssue === 'Document Pending'
                                ? isDark ? 'bg-orange-950 text-orange-300 border-orange-800' : 'bg-orange-50 text-orange-800 border-orange-200'
                                : isDark ? 'bg-purple-950 text-purple-300 border-purple-800' : 'bg-purple-50 text-purple-800 border-purple-200'
                            }`}
                          >
                            <AlertTriangle className="w-3 h-3 shrink-0" />
                            <span>{cand.blockingIssue}</span>
                          </span>
                        ) : (
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] font-semibold ${
                              isDark ? 'text-emerald-400' : 'text-emerald-700'
                            }`}
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Clean / Clear</span>
                          </span>
                        )}
                      </td>

                      {/* 11. Last Activity */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className={`text-[11px] font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          {cand.lastActivity || 'Today'}
                        </span>
                      </td>

                      {/* 12. Actions: Status-relevant action buttons */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Candidate 360 Action */}
                          <button
                            onClick={() => {
                              if (onSelectCandidateModal) onSelectCandidateModal(cand);
                              else if (onOpenCandidateProfile) onOpenCandidateProfile(cand.id);
                            }}
                            className={`px-2 py-1 rounded text-[11px] font-semibold border transition-colors flex items-center gap-1 ${
                              isDark
                                ? 'border-slate-700 bg-slate-800 hover:bg-slate-750 text-sky-300'
                                : 'border-slate-300 bg-white hover:bg-slate-50 text-sky-700 shadow-2xs'
                            }`}
                            title="Open Candidate 360 view"
                          >
                            <Eye className="w-3 h-3" />
                            <span>360</span>
                          </button>

                          {/* Status-specific action buttons */}
                          {cand.status === 'Offer Dropped' ? (
                            <button
                              onClick={() => {
                                if (onShowToast) onShowToast(`Re-engagement sequence started for ${cand.name}`);
                              }}
                              className="px-2.5 py-1 text-[11px] font-bold rounded bg-rose-600 hover:bg-rose-500 text-white shadow-xs transition-colors"
                              title="Re-engage candidate or log dropout reason"
                            >
                              Re-engage
                            </button>
                          ) : cand.blockingIssue === 'Document Pending' ? (
                            <button
                              onClick={() => {
                                if (onOpenDocReview) onOpenDocReview(cand.name);
                                else if (onShowToast) onShowToast(`Opened Document Review for ${cand.name}`);
                              }}
                              className="px-2.5 py-1 text-[11px] font-bold rounded bg-amber-600 hover:bg-amber-500 text-white shadow-xs transition-colors flex items-center gap-1"
                              title="Review Documents for this candidate"
                            >
                              <FileText className="w-3 h-3" />
                              <span>Review Docs</span>
                            </button>
                          ) : cand.blockingIssue === 'KYC Pending' ? (
                            <button
                              onClick={() => {
                                if (onShowToast) onShowToast(`Triggered instant Aadhaar / PAN KYC re-check for ${cand.name}`);
                              }}
                              className="px-2.5 py-1 text-[11px] font-bold rounded bg-sky-600 hover:bg-sky-500 text-white shadow-xs transition-colors flex items-center gap-1"
                              title="Open KYC verification panel"
                            >
                              <ShieldCheck className="w-3 h-3" />
                              <span>Open KYC</span>
                            </button>
                          ) : cand.blockingIssue === 'Offer Letter Not Sent' ? (
                            <button
                              onClick={() => {
                                if (onOpenLetterSender) onOpenLetterSender();
                                else if (onShowToast) onShowToast(`Opened Letter Sender for ${cand.name}`);
                              }}
                              className="px-2.5 py-1 text-[11px] font-bold rounded bg-purple-600 hover:bg-purple-500 text-white shadow-xs transition-colors flex items-center gap-1"
                              title="Send Letter to candidate"
                            >
                              <Send className="w-3 h-3" />
                              <span>Send Letter</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                if (onShowToast) onShowToast(`Joining reminder & Day-1 welcome kit sent to ${cand.name}`);
                              }}
                              className="px-2.5 py-1 text-[11px] font-bold rounded bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition-colors flex items-center gap-1"
                              title="Send Reminder & joining schedule"
                            >
                              <Clock className="w-3 h-3" />
                              <span>Send Reminder</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* DRAWER FOOTER: PAGINATION & SUMMARY STATS                                 */}
        {/* ========================================================================= */}
        {processedCandidates.length > 0 && (
          <div
            className={`p-3 sm:px-5 border-t shrink-0 flex items-center justify-between gap-3 text-xs ${
              isDark ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Showing{' '}
                <strong className={isDark ? 'text-white' : 'text-slate-900'}>
                  {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, totalItems)}
                </strong>{' '}
                of <strong className={isDark ? 'text-white' : 'text-slate-900'}>{totalItems}</strong> matching candidates
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className={`p-1.5 rounded border transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                  isDark
                    ? 'border-slate-700 bg-slate-800 hover:bg-slate-750 text-slate-200'
                    : 'border-slate-300 bg-white hover:bg-slate-100 text-slate-700 shadow-2xs'
                }`}
                title="Previous page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="font-mono text-xs px-2.5 py-1 font-semibold">
                Page {currentPage} of {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className={`p-1.5 rounded border transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                  isDark
                    ? 'border-slate-700 bg-slate-800 hover:bg-slate-750 text-slate-200'
                    : 'border-slate-300 bg-white hover:bg-slate-100 text-slate-700 shadow-2xs'
                }`}
                title="Next page"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
