import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  Filter, 
  UserPlus, 
  Download, 
  MoreHorizontal, 
  CheckSquare, 
  Square, 
  ExternalLink, 
  ShieldCheck, 
  Send, 
  Copy, 
  Eye, 
  Check, 
  X, 
  SlidersHorizontal, 
  RefreshCw, 
  AlertCircle, 
  Clock, 
  ChevronDown, 
  ChevronUp,
  RotateCcw, 
  UserCheck, 
  FileDown, 
  Activity, 
  Trash2,
  Users,
  Building2,
  Calendar,
  ArrowUpDown,
  SearchX,
  MapPin,
  Briefcase
} from 'lucide-react';
import { Candidate, FilterOptions, JoiningStatus } from '../../types/onboarding';
import { StatusBadge } from '../../components/common/StatusBadge';
import { ExportCsvControl } from '../hr-ops/ExportCsvControl';
import { FilterDrawer } from './FilterDrawer';
import { CandidatePreviewDrawer } from './CandidatePreviewDrawer';
import { useTheme } from '../../hooks/useTheme';
import { useToast } from '../../hooks/useToast';
import { INITIAL_DIRECTORY_FILTERS } from '../../data/directoryDefaults';
import { Toast } from '../../components/ui/Toast';
import { PageHeader } from '../../components/page/PageHeader';
import { PageBody } from '../../components/page/PageBody';
import { KpiCard } from '../../components/page/KpiCard';
import { joinedTrend, kycActionTrend, totalCandidatesTrend, yetToJoinTrend } from '../../utils/candidateTrends';
import { CategoryTabs } from '../../components/page/CategoryTabs';
import {
  CLIENT_LIST,
  LOCATION_LIST, 
  BRANCH_LIST, 
  DEPARTMENT_LIST, 
  DESIGNATION_LIST, 
  CANDIDATE_STATUS_LIST 
} from '../../data/mockOnboardingData';

import { PaginationControls, PaginationSummary } from '../../components/ui/Pagination';
import { SelectMenu } from '../../components/ui/SelectMenu';
interface CandidateDirectoryProps {
  candidates: Candidate[];
  onOpenInviteModal: () => void;
  onOpenCandidateProfile: (candidate: Candidate) => void;
  onOpenKycWorkspace: (candidate: Candidate) => void;
  externalFilters?: FilterOptions;
  onExternalFilterChange?: (filters: FilterOptions) => void;
}

const DEFAULT_FILTERS: FilterOptions = INITIAL_DIRECTORY_FILTERS;

export const CandidateDirectory: React.FC<CandidateDirectoryProps> = ({
  candidates: initialCandidates,
  onOpenInviteModal,
  onOpenCandidateProfile,
  onOpenKycWorkspace,
  externalFilters,
  onExternalFilterChange,
}) => {
  const { isDark } = useTheme();
  const [candidates, setCandidates] = useState<Candidate[]>(initialCandidates);

  // Sync internal candidate list if initialCandidates changes
  useEffect(() => {
    setCandidates(initialCandidates);
  }, [initialCandidates]);

  // Local filter state fallback if not controlled externally
  const [internalFilters, setInternalFilters] = useState<FilterOptions>(DEFAULT_FILTERS);
  const filters = externalFilters ?? internalFilters;
  const setFilters = (newFilters: FilterOptions) => {
    if (onExternalFilterChange) {
      onExternalFilterChange(newFilters);
    } else {
      setInternalFilters(newFilters);
    }
  };

  // UI States
  const [activeTab, setActiveTab] = useState<string>('all');
  const [isMoreFiltersOpen, setIsMoreFiltersOpen] = useState<boolean>(false);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState<boolean>(false);
  const [previewCandidate, setPreviewCandidate] = useState<Candidate | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [expandedCardIds, setExpandedCardIds] = useState<string[]>([]);
  const [activeActionMenuId, setActiveActionMenuId] = useState<string | null>(null);
  const { message: toastMessage, showToast } = useToast(3000);
  const [statusChangeModalCandidate, setStatusChangeModalCandidate] = useState<Candidate | null>(null);
  const [newSelectedStatus, setNewSelectedStatus] = useState<JoiningStatus>('Joined');

  // Sorting & Pagination States
  const [sortBy, setSortBy] = useState<string>('doj_asc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Reset page when filters or tabs change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters, activeTab, sortBy]);

  // Count active advanced filters (excluding basic top-bar filters)
  const advancedFilterCount = useMemo(() => {
    let count = 0;
    if (filters.branch) count++;
    if (filters.department) count++;
    if (filters.designation) count++;
    if (filters.candidateStatus) count++;
    if (filters.bankVerificationStatus || filters.pennyTestStatus) count++;
    if (filters.aadhaarStatus) count++;
    if (filters.panStatus) count++;
    if (filters.bankStatus) count++;
    if (filters.uanStatus) count++;
    if (filters.dateFrom || filters.dateTo || filters.joiningDateFrom || filters.joiningDateTo) count++;
    if (filters.regDateFrom || filters.regDateTo) count++;
    if (filters.contractEndDateFrom || filters.contractEndDateTo) count++;
    if (filters.oldEmployeeId) count++;
    if (filters.showOnlyMyCandidates) count++;
    return count;
  }, [filters]);

  // Overall active filter count
  const totalActiveFilterCount = useMemo(() => {
    let count = advancedFilterCount;
    if (filters.client) count++;
    if (filters.location) count++;
    if (filters.joiningStatus) count++;
    if (filters.searchQuery.trim()) count++;
    return count;
  }, [filters, advancedFilterCount]);

  // Reset all filters to default
  const handleResetFilters = () => {
    setFilters(DEFAULT_FILTERS);
    setActiveTab('all');
    setCurrentPage(1);
    showToast('All candidate filters have been reset.');
  };

  // Reset only advanced filters
  const handleResetAdvancedFilters = () => {
    setFilters({
      ...filters,
      branch: '',
      department: '',
      designation: '',
      candidateStatus: '',
      bankVerificationStatus: '',
      pennyTestStatus: '',
      aadhaarStatus: '',
      panStatus: '',
      bankStatus: '',
      uanStatus: '',
      dateFrom: '',
      dateTo: '',
      joiningDateFrom: '',
      joiningDateTo: '',
      regDateFrom: '',
      regDateTo: '',
      contractEndDateFrom: '',
      contractEndDateTo: '',
      oldEmployeeId: '',
      showOnlyMyCandidates: false,
    });
    showToast('Advanced filters reset.');
  };

  // Filtering candidates with robust AND conditions
  const filteredCandidates = useMemo(() => {
    return candidates.filter((cand) => {
      // 1. Tab Milestone Filter
      if (activeTab === 'yet_to_join' && cand.joiningStatus !== 'Yet to Join') return false;
      if (activeTab === 'kyc_pending' && cand.overallKycStatus !== 'Pending Manual Review' && cand.overallKycStatus !== 'API Mismatch') return false;
      if (activeTab === 'joined' && cand.joiningStatus !== 'Joined') return false;
      if (activeTab === 'verifying' && cand.joiningStatus !== 'Verification In Progress') return false;
      if (activeTab === 'deferred' && cand.joiningStatus !== 'Deferred' && cand.joiningStatus !== 'Dropout') return false;

      // 2. Smart Unified Keyword Search (Name, User ID, Email, Phone, Client Name, Client Code, Old Employee ID, Aadhaar, PAN)
      if (filters.searchQuery && filters.searchQuery.trim()) {
        const q = filters.searchQuery.toLowerCase().trim();
        const matchesName = `${cand.firstName} ${cand.lastName}`.toLowerCase().includes(q);
        const matchesUserId = cand.userId.toLowerCase().includes(q);
        const matchesEmail = cand.email.toLowerCase().includes(q);
        const matchesPhone = cand.phone.toLowerCase().includes(q);
        const matchesClient = cand.clientName.toLowerCase().includes(q);
        const matchesClientCode = (cand.clientCandidateCode || '').toLowerCase().includes(q);
        const matchesOldEmpId = (cand.oldEmployeeId || '').toLowerCase().includes(q);
        const matchesDesignation = (cand.designation || '').toLowerCase().includes(q);
        const matchesDepartment = (cand.department || '').toLowerCase().includes(q);
        const matchesBranch = (cand.branchName || '').toLowerCase().includes(q);
        const matchesAadhaar = cand.kycRecords.some(k => k.documentType === 'Aadhaar' && (k.documentNumber.toLowerCase().includes(q) || k.apiSearchValue.toLowerCase().includes(q)));
        const matchesPan = cand.kycRecords.some(k => k.documentType === 'PAN' && (k.documentNumber.toLowerCase().includes(q) || k.apiSearchValue.toLowerCase().includes(q)));
        
        if (!matchesName && !matchesUserId && !matchesEmail && !matchesPhone && !matchesClient && !matchesClientCode && !matchesOldEmpId && !matchesDesignation && !matchesDepartment && !matchesBranch && !matchesAadhaar && !matchesPan) {
          return false;
        }
      }

      // 3. Client Filter
      if (filters.client && cand.clientName !== filters.client) return false;

      // 4. Location Filter
      if (filters.location && !cand.workLocation.toLowerCase().includes(filters.location.toLowerCase())) return false;

      // 5. Branch Filter
      if (filters.branch && !cand.branchName.toLowerCase().includes(filters.branch.toLowerCase())) return false;

      // 6. Department Filter
      if (filters.department && cand.department !== filters.department) return false;

      // 7. Designation Filter
      if (filters.designation && !cand.designation.toLowerCase().includes(filters.designation.toLowerCase())) return false;

      // 8. Candidate Status Filter
      if (filters.candidateStatus && cand.candidateStatus && cand.candidateStatus !== filters.candidateStatus) return false;

      // 9. Joining Status Filter
      if (filters.joiningStatus && cand.joiningStatus !== filters.joiningStatus) return false;

      // 10. KYC Status Filter
      if (filters.kycStatus && cand.overallKycStatus !== filters.kycStatus) return false;

      // 11. Bank Verification / ₹1 Penny Test status filter
      const bankTestStatus = filters.bankVerificationStatus || filters.pennyTestStatus;
      if (bankTestStatus && cand.pennyTestStatus !== bankTestStatus) return false;

      // 12. Old Employee ID Filter
      if (filters.oldEmployeeId && filters.oldEmployeeId.trim()) {
        const oldQ = filters.oldEmployeeId.toLowerCase().trim();
        if (!cand.oldEmployeeId || !cand.oldEmployeeId.toLowerCase().includes(oldQ)) {
          return false;
        }
      }

      // 13. Statutory KYC Individual Document Filters
      if (filters.aadhaarStatus) {
        const aadhaar = cand.kycRecords.find(k => k.documentType === 'Aadhaar');
        if (!aadhaar || aadhaar.status !== filters.aadhaarStatus) return false;
      }
      if (filters.panStatus) {
        const pan = cand.kycRecords.find(k => k.documentType === 'PAN');
        if (!pan || pan.status !== filters.panStatus) return false;
      }
      if (filters.bankStatus) {
        const bank = cand.kycRecords.find(k => k.documentType === 'Bank');
        if (!bank || bank.status !== filters.bankStatus) return false;
      }
      if (filters.uanStatus) {
        const uan = cand.kycRecords.find(k => k.documentType === 'UAN');
        if (!uan || uan.status !== filters.uanStatus) return false;
      }

      // 14. Date of Joining Range
      const jDateFrom = filters.joiningDateFrom || filters.dateFrom;
      const jDateTo = filters.joiningDateTo || filters.dateTo;
      if (jDateFrom && cand.dateOfJoining < jDateFrom) return false;
      if (jDateTo && cand.dateOfJoining > jDateTo) return false;

      // 15. Date of Registration Range
      if (filters.regDateFrom && cand.registrationDate < filters.regDateFrom) return false;
      if (filters.regDateTo && cand.registrationDate > filters.regDateTo) return false;

      // 16. End of Contract Range
      if (filters.contractEndDateFrom && (!cand.endOfContract || cand.endOfContract < filters.contractEndDateFrom)) return false;
      if (filters.contractEndDateTo && (!cand.endOfContract || cand.endOfContract > filters.contractEndDateTo)) return false;

      // 17. Show My Candidates Only (assigned to recruiter Ananya Mukherjee)
      if (filters.showOnlyMyCandidates && cand.recruiterName !== 'Ananya Mukherjee') return false;

      return true;
    });
  }, [candidates, filters, activeTab]);

  // Sort filtered candidates
  const sortedCandidates = useMemo(() => {
    const list = [...filteredCandidates];
    if (sortBy === 'name_asc') {
      list.sort((a, b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`));
    } else if (sortBy === 'name_desc') {
      list.sort((a, b) => `${b.firstName} ${b.lastName}`.localeCompare(`${a.firstName} ${a.lastName}`));
    } else if (sortBy === 'doj_asc') {
      list.sort((a, b) => a.dateOfJoining.localeCompare(b.dateOfJoining));
    } else if (sortBy === 'doj_desc') {
      list.sort((a, b) => b.dateOfJoining.localeCompare(a.dateOfJoining));
    } else if (sortBy === 'reg_desc') {
      list.sort((a, b) => b.registrationDate.localeCompare(a.registrationDate));
    } else if (sortBy === 'completion_desc') {
      list.sort((a, b) => b.onboardingCompletionPct - a.onboardingCompletionPct);
    }
    return list;
  }, [filteredCandidates, sortBy]);

  // Paginated candidate slice
  const totalPages = Math.max(1, Math.ceil(sortedCandidates.length / pageSize));
  const paginatedCandidates = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return sortedCandidates.slice(startIndex, startIndex + pageSize);
  }, [sortedCandidates, currentPage, pageSize]);

  // Bulk selection handlers
  // Row action menu (shared by the desktop table row and the phone card)
  const renderActionMenu = (candidate: Candidate) => (
    activeActionMenuId === candidate.id && (
                                  <>
                                    <div
                                      className="fixed inset-0 z-20"
                                      onClick={() => setActiveActionMenuId(null)}
                                    />
                                    <div className={`absolute right-0 mt-1 w-52 rounded-lg shadow-xl border py-1 z-30 text-left text-xs divide-y animate-in fade-in duration-100 ${
                                      isDark
                                        ? 'bg-slate-900 border-slate-750 divide-slate-800 text-slate-200'
                                        : 'bg-white border-slate-200 divide-slate-100 text-slate-700'
                                    }`}>
                                      <div className="py-1">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setActiveActionMenuId(null);
                                            onOpenCandidateProfile(candidate);
                                          }}
                                          className={`w-full px-3 py-1.5 text-left flex items-center gap-2 font-medium cursor-pointer ${
                                            isDark ? 'hover:bg-slate-800 text-slate-200' : 'hover:bg-slate-50 text-slate-700'
                                          }`}
                                        >
                                          <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                                          <span>View Candidate 360</span>
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setActiveActionMenuId(null);
                                            onOpenKycWorkspace(candidate);
                                          }}
                                          className={`w-full px-3 py-1.5 text-left flex items-center gap-2 font-medium cursor-pointer ${
                                            isDark ? 'hover:bg-slate-800 text-slate-200' : 'hover:bg-slate-50 text-slate-700'
                                          }`}
                                        >
                                          <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                                          <span>KYC Verification Desk</span>
                                        </button>
                                      </div>

                                      <div className="py-1">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setActiveActionMenuId(null);
                                            handleMarkCandidateJoined(candidate);
                                          }}
                                          className={`w-full px-3 py-1.5 text-left flex items-center gap-2 font-semibold cursor-pointer ${
                                            isDark ? 'text-emerald-400 hover:bg-slate-800' : 'text-emerald-700 hover:bg-emerald-50'
                                          }`}
                                        >
                                          <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
                                          <span>Mark as Joined</span>
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setActiveActionMenuId(null);
                                            setStatusChangeModalCandidate(candidate);
                                            setNewSelectedStatus(candidate.joiningStatus);
                                          }}
                                          className={`w-full px-3 py-1.5 text-left flex items-center gap-2 cursor-pointer ${
                                            isDark ? 'hover:bg-slate-800 text-slate-200' : 'hover:bg-slate-50 text-slate-700'
                                          }`}
                                        >
                                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                                          <span>Change Status...</span>
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setActiveActionMenuId(null);
                                            handleRejoinCandidate(candidate);
                                          }}
                                          className={`w-full px-3 py-1.5 text-left flex items-center gap-2 cursor-pointer ${
                                            isDark ? 'text-purple-400 hover:bg-slate-800' : 'text-purple-700 hover:bg-purple-50'
                                          }`}
                                        >
                                          <RotateCcw className="w-3.5 h-3.5 text-purple-500" />
                                          <span>Rejoin Flow (Past ID)</span>
                                        </button>
                                      </div>

                                      <div className="py-1">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setActiveActionMenuId(null);
                                            handleReRunKyc(candidate);
                                          }}
                                          className={`w-full px-3 py-1.5 text-left flex items-center gap-2 cursor-pointer ${
                                            isDark ? 'hover:bg-slate-800 text-slate-200' : 'hover:bg-slate-50 text-slate-700'
                                          }`}
                                        >
                                          <RefreshCw className="w-3.5 h-3.5 text-sky-500" />
                                          <span>Re-run KYC & ₹1 Drop</span>
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setActiveActionMenuId(null);
                                            showToast(`Generated & downloaded Joining Kit PDF for ${candidate.firstName}`);
                                          }}
                                          className={`w-full px-3 py-1.5 text-left flex items-center gap-2 cursor-pointer ${
                                            isDark ? 'hover:bg-slate-800 text-slate-200' : 'hover:bg-slate-50 text-slate-700'
                                          }`}
                                        >
                                          <FileDown className="w-3.5 h-3.5 text-slate-400" />
                                          <span>Download Dossier</span>
                                        </button>
                                      </div>

                                      <div className="py-1">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setActiveActionMenuId(null);
                                            navigator.clipboard.writeText(`https://connect.2coms.com/onboard/c/${candidate.userId}`);
                                            showToast(`Copied onboarding link for ${candidate.firstName}`);
                                          }}
                                          className={`w-full px-3 py-1.5 text-left flex items-center gap-2 cursor-pointer ${
                                            isDark ? 'hover:bg-slate-800 text-slate-200' : 'hover:bg-slate-50 text-slate-700'
                                          }`}
                                        >
                                          <Copy className="w-3.5 h-3.5 text-slate-400" />
                                          <span>Copy Onboarding URL</span>
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setActiveActionMenuId(null);
                                            showToast(`Resent invitation SMS & WhatsApp to ${candidate.phone}`);
                                          }}
                                          className={`w-full px-3 py-1.5 text-left flex items-center gap-2 cursor-pointer ${
                                            isDark ? 'hover:bg-slate-800 text-slate-200' : 'hover:bg-slate-50 text-slate-700'
                                          }`}
                                        >
                                          <Send className="w-3.5 h-3.5 text-slate-400" />
                                          <span>Resend Invitation</span>
                                        </button>
                                      </div>

                                      <div className="py-1">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setActiveActionMenuId(null);
                                            if (confirm(`Remove candidate ${candidate.firstName} ${candidate.lastName} from onboarding pipeline?`)) {
                                              handleDeleteCandidate(candidate);
                                            }
                                          }}
                                          className={`w-full px-3 py-1.5 text-left flex items-center gap-2 font-medium cursor-pointer ${
                                            isDark ? 'text-rose-400 hover:bg-slate-800' : 'text-rose-600 hover:bg-rose-50'
                                          }`}
                                        >
                                          <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                                          <span>Delete Candidate</span>
                                        </button>
                                      </div>
                                    </div>
                                  </>
                                )
  );

  const handleSelectAll = () => {
    if (selectedIds.length === filteredCandidates.length && filteredCandidates.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredCandidates.map((c) => c.id));
    }
  };

  const handleSelectOne = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  // Instant candidate status changes
  const handleMarkCandidateJoined = (candidate: Candidate) => {
    setCandidates((prev) =>
      prev.map((c) => (c.id === candidate.id ? { ...c, joiningStatus: 'Joined' } : c))
    );
    showToast(`${candidate.firstName} ${candidate.lastName} successfully marked as JOINED!`);
  };

  const handleApplyStatusChange = () => {
    if (!statusChangeModalCandidate) return;
    setCandidates((prev) =>
      prev.map((c) =>
        c.id === statusChangeModalCandidate.id ? { ...c, joiningStatus: newSelectedStatus } : c
      )
    );
    showToast(`Joining status updated to "${newSelectedStatus}" for ${statusChangeModalCandidate.firstName}`);
    setStatusChangeModalCandidate(null);
  };

  const handleReRunKyc = (candidate: Candidate) => {
    showToast(`Re-running KYC APIs & ₹1 penny-drop check for ${candidate.firstName}...`);
  };

  const handleRejoinCandidate = (candidate: Candidate) => {
    showToast(`Rejoin process initiated for ${candidate.firstName} (Past Code: ${candidate.oldEmployeeId || candidate.userId})`);
  };

  const handleDeleteCandidate = (candidate: Candidate) => {
    setCandidates((prev) => prev.filter((c) => c.id !== candidate.id));
    showToast(`Candidate ${candidate.firstName} ${candidate.lastName} removed from pipeline.`);
  };

  // Common styling tokens for inputs & selects
  const selectStyleClass = `w-full border rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors outline-hidden focus:ring-2 focus:ring-sky-500/40 ${
    isDark
      ? 'bg-slate-900 border-slate-700 text-slate-100 focus:border-sky-400'
      : 'bg-white border-slate-300 text-slate-900 focus:border-sky-500 shadow-2xs'
  }`;

  const inputStyleClass = `w-full border rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors outline-hidden focus:ring-2 focus:ring-sky-500/40 ${
    isDark
      ? 'bg-slate-900 border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-sky-400'
      : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-sky-500 shadow-2xs'
  }`;

  const labelStyleClass = `block text-[11px] font-semibold mb-1 ${
    isDark ? 'text-slate-300' : 'text-slate-700'
  }`;

  const cardStyleClass = `rounded-xl border transition-colors ${
    isDark ? 'bg-slate-900 border-slate-800 shadow-slate-950/40' : 'bg-white border-slate-200 shadow-2xs'
  }`;

  return (
    <div className={`flex-1 flex flex-col transition-colors duration-150 ${
      isDark ? 'text-slate-100' : 'text-slate-900'
    }`}>
      {/* Toast Notification */}
      <Toast message={toastMessage} variant="solid" />

      {/* Page header strip (shared with every page) */}
      <PageHeader
          icon={Users}
          title="Candidate Directory"
          badge={<span className="cc-accent-chip text-[11px] font-semibold px-2 py-0.5 rounded-md">2COMS Onboarding Pipeline</span>}
          subtitle="Search, filter, track onboarding milestones, statutory KYC, and manage all candidate dossiers"
          actions={
            <>
              <ExportCsvControl candidates={filteredCandidates} onDone={showToast} />
              <button
                type="button"
                onClick={onOpenInviteModal}
                className="cc-btn-primary px-4 py-2 text-xs font-semibold rounded-lg transition-[filter] flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Invite Candidate</span>
              </button>
            </>
          }
      />

      <PageBody>

      <>
          {/* Quick Metrics Strip */}
          <div className="cc-grid grid-cols-2 lg:grid-cols-4">
            <KpiCard label="Total Candidates" value={candidates.length} detail="Live pool" trend={totalCandidatesTrend(candidates)} icon={Users} tone="info" />
            <KpiCard
              label="Yet to Join"
              value={candidates.filter((c) => c.joiningStatus === 'Yet to Join').length}
              detail="Upcoming joiners"
              trend={yetToJoinTrend(candidates)}
              icon={Clock}
              tone="warn"
            />
            <KpiCard
              label="KYC Action Required"
              value={candidates.filter((c) => c.overallKycStatus === 'Pending Manual Review' || c.overallKycStatus === 'API Mismatch').length}
              detail="Manual review / API mismatch"
              trend={kycActionTrend(candidates)}
              icon={ShieldCheck}
              tone="bad"
            />
            <KpiCard
              label="Joined & Active"
              value={candidates.filter((c) => c.joiningStatus === 'Joined').length}
              detail="Completed onboarding"
              trend={joinedTrend(candidates)}
              icon={UserCheck}
              tone="good"
            />
          </div>

          {/* ========================================================================= */}
          {/* PRIMARY FILTER TOOLBAR & SMART SEARCH                                      */}
          {/* ========================================================================= */}
          <div className={`${cardStyleClass} p-3.5 space-y-3`}>
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5">
              {/* Smart Search Bar */}
              <div className="relative flex-1 min-w-0 lg:min-w-[260px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search by Name, Employee Code, Email, Contact, Aadhaar or PAN..."
                  value={filters.searchQuery}
                  onChange={(e) => setFilters({ ...filters, searchQuery: e.target.value })}
                  className={`w-full pl-9 pr-8 py-2 text-xs border rounded-lg focus:outline-hidden focus:ring-2 focus:ring-sky-500 transition-all ${
                    isDark
                      ? 'bg-slate-950 border-slate-750 text-slate-100 placeholder:text-slate-500'
                      : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white'
                  }`}
                />
                {filters.searchQuery && (
                  <button
                    type="button"
                    onClick={() => setFilters({ ...filters, searchQuery: '' })}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-0.5"
                    title="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Quick Primary Filters: Client, Location, Status */}
              <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2">
                {/* Client Filter */}
                <SelectMenu
                  value={filters.client}
                  onChange={(e) => setFilters({ ...filters, client: e.target.value })}
                  className={`py-2 px-2.5 text-xs rounded-lg border font-medium ${
                    isDark ? 'bg-slate-950 border-slate-750 text-slate-200' : 'bg-white border-slate-200 text-slate-700 shadow-2xs'
                  } w-full sm:w-auto sm:max-w-[170px] truncate`}
                >
                  <option value="">All Clients</option>
                  {CLIENT_LIST.map((cl) => (
                    <option key={cl} value={cl}>
                      {cl}
                    </option>
                  ))}
                </SelectMenu>

                {/* Location Filter */}
                <SelectMenu
                  value={filters.location}
                  onChange={(e) => setFilters({ ...filters, location: e.target.value })}
                  className={`py-2 px-2.5 text-xs rounded-lg border font-medium ${
                    isDark ? 'bg-slate-950 border-slate-750 text-slate-200' : 'bg-white border-slate-200 text-slate-700 shadow-2xs'
                  } w-full sm:w-auto sm:max-w-[150px] truncate`}
                >
                  <option value="">All Locations</option>
                  {LOCATION_LIST.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc.split(' - ')[0]}
                    </option>
                  ))}
                </SelectMenu>

                {/* Joining Status Filter */}
                <SelectMenu
                  value={filters.joiningStatus}
                  onChange={(e) => setFilters({ ...filters, joiningStatus: e.target.value })}
                  className={`py-2 px-2.5 text-xs rounded-lg border font-medium ${
                    isDark ? 'bg-slate-950 border-slate-750 text-slate-200' : 'bg-white border-slate-200 text-slate-700 shadow-2xs'
                  } w-full sm:w-auto sm:max-w-[150px] truncate`}
                >
                  <option value="">All Statuses</option>
                  <option value="Yet to Join">Yet to Join</option>
                  <option value="Verification In Progress">Verifying</option>
                  <option value="Joined">Joined</option>
                  <option value="Offer Accepted">Offer Accepted</option>
                  <option value="Deferred">Deferred</option>
                  <option value="Dropout">Dropout</option>
                  <option value="Offer Dropped">Offer Dropped</option>
                </SelectMenu>

                {/* Expandable "More Filters" Accordion Toggle Button */}
                <button
                  type="button"
                  onClick={() => setIsMoreFiltersOpen(!isMoreFiltersOpen)}
                  className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-all flex items-center justify-center sm:justify-start gap-1.5 cursor-pointer w-full sm:w-auto ${
                    isMoreFiltersOpen || advancedFilterCount > 0
                      ? isDark
                        ? 'bg-sky-950/90 border-sky-500 text-sky-300 ring-1 ring-sky-500'
                        : 'bg-sky-50 border-sky-300 text-sky-800 ring-1 ring-sky-400'
                      : isDark
                      ? 'bg-slate-950 border-slate-750 text-slate-300 hover:bg-slate-800'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 shadow-2xs'
                  }`}
                  title="Toggle advanced filter controls"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-sky-500" />
                  <span>More Filters</span>
                  {advancedFilterCount > 0 && (
                    <span className="font-mono text-[10px] bg-sky-600 text-white px-1.5 py-0.2 rounded-full font-bold">
                      {advancedFilterCount}
                    </span>
                  )}
                  {isMoreFiltersOpen ? (
                    <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  )}
                </button>

                {/* Reset Filters Button */}
                {totalActiveFilterCount > 0 && (
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className={`p-2 text-xs rounded-lg transition-colors border ${
                      isDark 
                        ? 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-750' 
                        : 'bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                    }`}
                    title="Reset all filters"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* ========================================================================= */}
            {/* EXPANDABLE "MORE FILTERS" ACCORDION PANEL                                  */}
            {/* ========================================================================= */}
            {isMoreFiltersOpen && (
              <div className={`p-4 rounded-xl border mt-2 space-y-4 animate-in fade-in slide-in-from-top-2 duration-150 ${
                isDark ? 'bg-slate-950/90 border-slate-800 text-slate-200' : 'bg-slate-50/90 border-slate-200 text-slate-800'
              }`}>
                {/* Panel Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-sky-500/20 text-sky-500 flex items-center justify-center">
                      <Filter className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h3 className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        Advanced Candidate Filters
                      </h3>
                      <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        Refine candidate records by branch, department, statutory KYC statuses, date ranges, and past IDs
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {advancedFilterCount > 0 && (
                      <button
                        type="button"
                        onClick={handleResetAdvancedFilters}
                        className={`text-xs font-medium underline transition-colors ${
                          isDark ? 'text-sky-400 hover:text-sky-300' : 'text-sky-600 hover:text-sky-800'
                        }`}
                      >
                        Reset Advanced ({advancedFilterCount})
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setIsMoreFiltersOpen(false)}
                      className={`p-1 rounded-md transition-colors ${
                        isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200'
                      }`}
                      title="Collapse advanced filters"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* 4-Column Grid for Advanced Filters */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                  {/* GROUP 1: Organization & Role */}
                  <div className="space-y-3">
                    <div className="font-bold text-[10px] uppercase tracking-wider text-sky-500">
                      1. Organization & Role
                    </div>

                    <div>
                      <label className={labelStyleClass}>Location & Branch</label>
                      <SelectMenu
                        value={filters.branch || ''}
                        onChange={(e) => setFilters({ ...filters, branch: e.target.value })}
                        className={selectStyleClass}
                      >
                        <option value="">All Branches</option>
                        {BRANCH_LIST.map((br) => (
                          <option key={br} value={br}>{br}</option>
                        ))}
                      </SelectMenu>
                    </div>

                    <div>
                      <label className={labelStyleClass}>Department</label>
                      <SelectMenu
                        value={filters.department || ''}
                        onChange={(e) => setFilters({ ...filters, department: e.target.value })}
                        className={selectStyleClass}
                      >
                        <option value="">All Departments</option>
                        {DEPARTMENT_LIST.map((dept) => (
                          <option key={dept} value={dept}>{dept}</option>
                        ))}
                      </SelectMenu>
                    </div>

                    <div>
                      <label className={labelStyleClass}>Designation</label>
                      <SelectMenu
                        value={filters.designation || ''}
                        onChange={(e) => setFilters({ ...filters, designation: e.target.value })}
                        className={selectStyleClass}
                      >
                        <option value="">All Designations</option>
                        {DESIGNATION_LIST.map((desig) => (
                          <option key={desig} value={desig}>{desig}</option>
                        ))}
                      </SelectMenu>
                    </div>
                  </div>

                  {/* GROUP 2: Date Ranges */}
                  <div className="space-y-3">
                    <div className="font-bold text-[10px] uppercase tracking-wider text-sky-500">
                      2. Date Ranges (From / To)
                    </div>

                    <div>
                      <label className={labelStyleClass}>Date of Joining</label>
                      <div className="grid grid-cols-2 gap-1.5">
                        <input
                          type="date"
                          value={filters.joiningDateFrom || filters.dateFrom || ''}
                          onChange={(e) => setFilters({ ...filters, joiningDateFrom: e.target.value, dateFrom: e.target.value })}
                          className={`${inputStyleClass} font-mono`}
                          title="Joining Date From"
                        />
                        <input
                          type="date"
                          value={filters.joiningDateTo || filters.dateTo || ''}
                          onChange={(e) => setFilters({ ...filters, joiningDateTo: e.target.value, dateTo: e.target.value })}
                          className={`${inputStyleClass} font-mono`}
                          title="Joining Date To"
                        />
                      </div>
                    </div>

                    <div>
                      <label className={labelStyleClass}>Registration Date</label>
                      <div className="grid grid-cols-2 gap-1.5">
                        <input
                          type="date"
                          value={filters.regDateFrom || ''}
                          onChange={(e) => setFilters({ ...filters, regDateFrom: e.target.value })}
                          className={`${inputStyleClass} font-mono`}
                          title="Registration Date From"
                        />
                        <input
                          type="date"
                          value={filters.regDateTo || ''}
                          onChange={(e) => setFilters({ ...filters, regDateTo: e.target.value })}
                          className={`${inputStyleClass} font-mono`}
                          title="Registration Date To"
                        />
                      </div>
                    </div>

                    <div>
                      <label className={labelStyleClass}>End of Contract</label>
                      <div className="grid grid-cols-2 gap-1.5">
                        <input
                          type="date"
                          value={filters.contractEndDateFrom || ''}
                          onChange={(e) => setFilters({ ...filters, contractEndDateFrom: e.target.value })}
                          className={`${inputStyleClass} font-mono`}
                          title="Contract End Date From"
                        />
                        <input
                          type="date"
                          value={filters.contractEndDateTo || ''}
                          onChange={(e) => setFilters({ ...filters, contractEndDateTo: e.target.value })}
                          className={`${inputStyleClass} font-mono`}
                          title="Contract End Date To"
                        />
                      </div>
                    </div>
                  </div>

                  {/* GROUP 3: Statutory KYC & Bank */}
                  <div className="space-y-3">
                    <div className="font-bold text-[10px] uppercase tracking-wider text-sky-500">
                      3. Statutory KYC Checks
                    </div>

                    <div>
                      <label className={labelStyleClass}>Bank Verification / ₹1 Drop</label>
                      <SelectMenu
                        value={filters.bankVerificationStatus || filters.pennyTestStatus || ''}
                        onChange={(e) => setFilters({ ...filters, bankVerificationStatus: e.target.value, pennyTestStatus: e.target.value })}
                        className={selectStyleClass}
                      >
                        <option value="">All Bank Statuses</option>
                        <option value="Verified">Verified (Penny Drop Succeeded)</option>
                        <option value="Pending">Pending / In Progress</option>
                        <option value="Failed">Failed / Inactive</option>
                        <option value="Not Sent">Not Sent</option>
                      </SelectMenu>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className={labelStyleClass}>Aadhaar Status</label>
                        <SelectMenu
                          value={filters.aadhaarStatus || ''}
                          onChange={(e) => setFilters({ ...filters, aadhaarStatus: e.target.value })}
                          className={selectStyleClass}
                        >
                          <option value="">All</option>
                          <option value="Verified">Verified</option>
                          <option value="Pending Manual Review">Review</option>
                          <option value="API Mismatch">Mismatch</option>
                          <option value="Not Started">Not Started</option>
                        </SelectMenu>
                      </div>

                      <div>
                        <label className={labelStyleClass}>PAN Status</label>
                        <SelectMenu
                          value={filters.panStatus || ''}
                          onChange={(e) => setFilters({ ...filters, panStatus: e.target.value })}
                          className={selectStyleClass}
                        >
                          <option value="">All</option>
                          <option value="Verified">Verified</option>
                          <option value="Pending Manual Review">Review</option>
                          <option value="API Mismatch">Mismatch</option>
                          <option value="Rejected">Rejected</option>
                        </SelectMenu>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className={labelStyleClass}>Bank KYC Status</label>
                        <SelectMenu
                          value={filters.bankStatus || ''}
                          onChange={(e) => setFilters({ ...filters, bankStatus: e.target.value })}
                          className={selectStyleClass}
                        >
                          <option value="">All</option>
                          <option value="Verified">Verified</option>
                          <option value="Pending Manual Review">Review</option>
                          <option value="Rejected">Rejected</option>
                        </SelectMenu>
                      </div>

                      <div>
                        <label className={labelStyleClass}>UAN / PF Status</label>
                        <SelectMenu
                          value={filters.uanStatus || ''}
                          onChange={(e) => setFilters({ ...filters, uanStatus: e.target.value })}
                          className={selectStyleClass}
                        >
                          <option value="">All</option>
                          <option value="Verified">Verified</option>
                          <option value="Pending Manual Review">Review</option>
                          <option value="Skipped">Fresher</option>
                        </SelectMenu>
                      </div>
                    </div>
                  </div>

                  {/* GROUP 4: Identifiers & Ownership */}
                  <div className="space-y-3">
                    <div className="font-bold text-[10px] uppercase tracking-wider text-sky-500">
                      4. Identifiers & Assignment
                    </div>

                    <div>
                      <label className={labelStyleClass}>Old Employee ID</label>
                      <input
                        type="text"
                        placeholder="Search by past code (e.g. 2C-OLD-1042)"
                        value={filters.oldEmployeeId || ''}
                        onChange={(e) => setFilters({ ...filters, oldEmployeeId: e.target.value })}
                        className={`${inputStyleClass} font-mono`}
                      />
                    </div>

                    <div>
                      <label className={labelStyleClass}>Candidate Account Status</label>
                      <SelectMenu
                        value={filters.candidateStatus || ''}
                        onChange={(e) => setFilters({ ...filters, candidateStatus: e.target.value })}
                        className={selectStyleClass}
                      >
                        <option value="">All Account Statuses</option>
                        {CANDIDATE_STATUS_LIST.map((st) => (
                          <option key={st} value={st}>{st}</option>
                        ))}
                      </SelectMenu>
                    </div>

                    <div className={`p-2.5 rounded-lg border flex items-center justify-between mt-2 ${
                      isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
                    }`}>
                      <div>
                        <span className={`block text-xs font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          Show My Candidates
                        </span>
                        <span className={`text-[10px] block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          Assigned to Ananya Mukherjee
                        </span>
                      </div>
                      <input
                        type="checkbox"
                        checked={filters.showOnlyMyCandidates || false}
                        onChange={(e) => setFilters({ ...filters, showOnlyMyCandidates: e.target.checked })}
                        className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                {/* Panel Footer */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-200 dark:border-slate-800 text-xs">
                  <div className={`font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    Matching <span className={`font-bold font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>{filteredCandidates.length}</span> of {candidates.length} candidates
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleResetFilters}
                      className={`px-3 py-1.5 rounded-lg border font-medium transition-colors ${
                        isDark ? 'border-slate-700 hover:bg-slate-800 text-slate-300' : 'border-slate-300 hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      Reset All
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsMoreFiltersOpen(false);
                        showToast(`Applied filters. Showing ${filteredCandidates.length} candidate(s).`);
                      }}
                      className="px-4 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold transition-colors shadow-xs flex items-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Apply Filters</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Tab Milestones */}
            <div className={`flex items-center justify-between gap-3 border-t pt-1 text-xs ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
              <CategoryTabs
                value={activeTab}
                onChange={setActiveTab}
                tabs={[
                  { value: 'all', label: 'All Candidates', count: candidates.length },
                  { value: 'yet_to_join', label: 'Yet to Join', count: candidates.filter(c => c.joiningStatus === 'Yet to Join').length },
                  { value: 'kyc_pending', label: 'KYC Action', count: candidates.filter(c => c.overallKycStatus === 'Pending Manual Review' || c.overallKycStatus === 'API Mismatch').length },
                  { value: 'verifying', label: 'Verifying', count: candidates.filter(c => c.joiningStatus === 'Verification In Progress').length },
                  { value: 'joined', label: 'Joined', count: candidates.filter(c => c.joiningStatus === 'Joined').length },
                  { value: 'deferred', label: 'Deferred / Dropout', count: candidates.filter(c => c.joiningStatus === 'Deferred' || c.joiningStatus === 'Dropout').length },
                ]}
              />

              {/* Matching records pill */}
              <div className={`text-[11px] pl-3 hidden lg:block whitespace-nowrap font-medium ${
                isDark ? 'text-slate-400' : 'text-slate-500'
              }`}>
                Showing {filteredCandidates.length} of {candidates.length} candidate records
              </div>
            </div>

            {/* ========================================================================= */}
            {/* ACTIVE FILTER CHIPS BAR                                                   */}
            {/* ========================================================================= */}
            {totalActiveFilterCount > 0 && (
              <div className={`flex flex-wrap items-center gap-1.5 pt-2 border-t text-[11px] ${
                isDark ? 'border-slate-800 text-slate-300' : 'border-slate-200 text-slate-700'
              }`}>
                <span className={`font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Applied Filters:</span>

                {filters.searchQuery && (
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md font-medium border ${
                    isDark ? 'bg-sky-950/80 text-sky-200 border-sky-800' : 'bg-sky-50 text-sky-800 border-sky-200'
                  }`}>
                    Search: "{filters.searchQuery}"
                    <X className="w-3 h-3 cursor-pointer hover:opacity-80" onClick={() => setFilters({ ...filters, searchQuery: '' })} />
                  </span>
                )}

                {filters.client && (
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md font-medium border ${
                    isDark ? 'bg-sky-950/80 text-sky-200 border-sky-800' : 'bg-sky-50 text-sky-800 border-sky-200'
                  }`}>
                    Client: {filters.client}
                    <X className="w-3 h-3 cursor-pointer hover:opacity-80" onClick={() => setFilters({ ...filters, client: '' })} />
                  </span>
                )}

                {filters.location && (
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md font-medium border ${
                    isDark ? 'bg-sky-950/80 text-sky-200 border-sky-800' : 'bg-sky-50 text-sky-800 border-sky-200'
                  }`}>
                    Loc: {filters.location.split(' - ')[0]}
                    <X className="w-3 h-3 cursor-pointer hover:opacity-80" onClick={() => setFilters({ ...filters, location: '' })} />
                  </span>
                )}

                {filters.branch && (
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md font-medium border ${
                    isDark ? 'bg-sky-950/80 text-sky-200 border-sky-800' : 'bg-sky-50 text-sky-800 border-sky-200'
                  }`}>
                    Branch: {filters.branch}
                    <X className="w-3 h-3 cursor-pointer hover:opacity-80" onClick={() => setFilters({ ...filters, branch: '' })} />
                  </span>
                )}

                {filters.department && (
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md font-medium border ${
                    isDark ? 'bg-sky-950/80 text-sky-200 border-sky-800' : 'bg-sky-50 text-sky-800 border-sky-200'
                  }`}>
                    Dept: {filters.department}
                    <X className="w-3 h-3 cursor-pointer hover:opacity-80" onClick={() => setFilters({ ...filters, department: '' })} />
                  </span>
                )}

                {filters.designation && (
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md font-medium border ${
                    isDark ? 'bg-sky-950/80 text-sky-200 border-sky-800' : 'bg-sky-50 text-sky-800 border-sky-200'
                  }`}>
                    Role: {filters.designation}
                    <X className="w-3 h-3 cursor-pointer hover:opacity-80" onClick={() => setFilters({ ...filters, designation: '' })} />
                  </span>
                )}

                {filters.joiningStatus && (
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md font-medium border ${
                    isDark ? 'bg-amber-950/80 text-amber-200 border-amber-800' : 'bg-amber-50 text-amber-800 border-amber-200'
                  }`}>
                    Joining: {filters.joiningStatus}
                    <X className="w-3 h-3 cursor-pointer hover:opacity-80" onClick={() => setFilters({ ...filters, joiningStatus: '' })} />
                  </span>
                )}

                {(filters.bankVerificationStatus || filters.pennyTestStatus) && (
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md font-medium border ${
                    isDark ? 'bg-purple-950/80 text-purple-200 border-purple-800' : 'bg-purple-50 text-purple-800 border-purple-200'
                  }`}>
                    Bank: {filters.bankVerificationStatus || filters.pennyTestStatus}
                    <X className="w-3 h-3 cursor-pointer hover:opacity-80" onClick={() => setFilters({ ...filters, bankVerificationStatus: '', pennyTestStatus: '' })} />
                  </span>
                )}

                {filters.aadhaarStatus && (
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md font-medium border ${
                    isDark ? 'bg-emerald-950/80 text-emerald-200 border-emerald-800' : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  }`}>
                    Aadhaar: {filters.aadhaarStatus}
                    <X className="w-3 h-3 cursor-pointer hover:opacity-80" onClick={() => setFilters({ ...filters, aadhaarStatus: '' })} />
                  </span>
                )}

                {filters.panStatus && (
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md font-medium border ${
                    isDark ? 'bg-emerald-950/80 text-emerald-200 border-emerald-800' : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  }`}>
                    PAN: {filters.panStatus}
                    <X className="w-3 h-3 cursor-pointer hover:opacity-80" onClick={() => setFilters({ ...filters, panStatus: '' })} />
                  </span>
                )}

                {filters.oldEmployeeId && (
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md font-mono border ${
                    isDark ? 'bg-slate-800 text-slate-200 border-slate-700' : 'bg-slate-100 text-slate-800 border-slate-300'
                  }`}>
                    Old ID: {filters.oldEmployeeId}
                    <X className="w-3 h-3 cursor-pointer hover:opacity-80" onClick={() => setFilters({ ...filters, oldEmployeeId: '' })} />
                  </span>
                )}

                {filters.showOnlyMyCandidates && (
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md font-medium border ${
                    isDark ? 'bg-indigo-950/80 text-indigo-200 border-indigo-800' : 'bg-indigo-50 text-indigo-800 border-indigo-200'
                  }`}>
                    Assigned to Me
                    <X className="w-3 h-3 cursor-pointer hover:opacity-80" onClick={() => setFilters({ ...filters, showOnlyMyCandidates: false })} />
                  </span>
                )}

                <button
                  type="button"
                  onClick={handleResetFilters}
                  className={`font-semibold underline ml-1 cursor-pointer transition-colors ${
                    isDark ? 'text-sky-400 hover:text-sky-300' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Clear All
                </button>
              </div>
            )}
          </div>

          {/* Bulk Action Bar (when rows are checked) */}
          {selectedIds.length > 0 && (
            <div className="bg-slate-900 text-white px-3 sm:px-4 py-2.5 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs shadow-md animate-in slide-in-from-top-1 duration-150 border border-slate-800">
              <div className="flex items-center gap-2">
                <span className="font-semibold font-mono bg-slate-800 px-2 py-0.5 rounded text-sky-400">
                  {selectedIds.length}
                </span>
                <span>Candidates Selected</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => showToast(`Resent onboarding invitations to ${selectedIds.length} candidate(s)`)}
                  className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded transition-colors flex items-center gap-1 font-medium"
                >
                  <Send className="w-3 h-3 text-sky-400" />
                  <span>Bulk Invite</span>
                </button>
                <button
                  type="button"
                  onClick={() => showToast(`Triggered batch KYC & ₹1 penny drop check for ${selectedIds.length} candidate(s)`)}
                  className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded transition-colors flex items-center gap-1 font-medium"
                >
                  <ShieldCheck className="w-3 h-3 text-amber-400" />
                  <span>Bulk KYC Re-check</span>
                </button>
                <button
                  type="button"
                  onClick={() => showToast(`Exported ${selectedIds.length} candidate dossiers to PDF archive`)}
                  className="px-3 py-1 bg-sky-600 hover:bg-sky-500 text-white rounded transition-colors flex items-center gap-1 font-medium"
                >
                  <FileDown className="w-3 h-3" />
                  <span>Download Dossiers</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedIds([])}
                  className="px-2 py-1 text-slate-400 hover:text-white"
                >
                  Deselect All
                </button>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* SORTING, ROWS PER PAGE & TABLE CONTROLS BAR                                */}
          {/* ========================================================================= */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <PaginationSummary page={currentPage} total={sortedCandidates.length} pageSize={pageSize} itemLabel="candidates" />

            <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3 sm:flex-wrap w-full sm:w-auto">
              {/* Sort By Dropdown */}
              <div className="flex items-center gap-1.5 min-w-0 flex-1 sm:flex-none">
                <span className={`hidden sm:inline text-[11px] font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Sort:
                </span>
                <SelectMenu
                  aria-label="Sort candidates"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className={`py-1 px-2 rounded-md border text-xs font-medium w-full sm:w-auto ${
                    isDark ? 'bg-slate-900 border-slate-750 text-slate-200' : 'bg-white border-slate-200 text-slate-700 shadow-2xs'
                  }`}
                >
                  <option value="doj_asc">Joining Date (Earliest)</option>
                  <option value="doj_desc">Joining Date (Latest)</option>
                  <option value="name_asc">Candidate Name (A-Z)</option>
                  <option value="name_desc">Candidate Name (Z-A)</option>
                  <option value="reg_desc">Registration Date (Newest)</option>
                  <option value="completion_desc">Completion % (Highest)</option>
                </SelectMenu>
              </div>

              {/* Rows Per Page Dropdown */}
              <div className="flex items-center gap-1.5 shrink-0">
                <span className={`hidden sm:inline text-[11px] font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Rows:
                </span>
                <SelectMenu
                  aria-label="Rows per page"
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className={`py-1 px-2 rounded-md border text-xs font-mono font-medium ${
                    isDark ? 'bg-slate-900 border-slate-750 text-slate-200' : 'bg-white border-slate-200 text-slate-700 shadow-2xs'
                  }`}
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </SelectMenu>
              </div>

              <PaginationControls page={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} mobileIndicator />
            </div>
          </div>

          {/* ========================================================================= */}
          {/* PHONE LAYOUT: candidate cards (the full table is shown from md up)         */}
          {/* ========================================================================= */}
          <div className="md:hidden space-y-2.5">
            {paginatedCandidates.length > 0 && (
              <button
                type="button"
                onClick={handleSelectAll}
                className="cc-muted flex items-center gap-2 text-xs font-semibold px-1 py-0.5"
              >
                {selectedIds.length === filteredCandidates.length && filteredCandidates.length > 0 ? (
                  <CheckSquare className="w-4 h-4 text-sky-500" />
                ) : (
                  <Square className="w-4 h-4" />
                )}
                <span>Select all {filteredCandidates.length}</span>
              </button>
            )}

            {paginatedCandidates.length === 0 ? (
              <div className="cc-card p-6 text-center space-y-2">
                <SearchX className="cc-muted w-6 h-6 mx-auto" />
                <p className="cc-title font-bold text-sm">No candidates match your criteria</p>
                <p className="cc-muted text-xs">Try a different search or adjust the applied filters.</p>
                <button type="button" onClick={handleResetFilters} className="cc-btn cc-btn-primary mt-1">
                  Reset All Filters
                </button>
              </div>
            ) : (
              paginatedCandidates.map((candidate) => {
                const isSelected = selectedIds.includes(candidate.id);
                const isExpanded = expandedCardIds.includes(candidate.id);
                const kycOf = (type: string) => candidate.kycRecords.find((k) => k.documentType === type);
                const kycChip = (status?: string) =>
                  status === 'Verified'
                    ? 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30'
                    : status === 'Pending Manual Review'
                    ? 'bg-amber-500/20 text-amber-500 border-amber-500/30'
                    : status === 'API Mismatch'
                    ? 'bg-orange-500/20 text-orange-500 border-orange-500/30'
                    : status === 'Rejected'
                    ? 'bg-rose-500/20 text-rose-500 border-rose-500/30'
                    : 'bg-slate-500/15 text-slate-500 border-transparent';

                return (
                  <article
                    key={candidate.id}
                    className={`cc-card p-3 space-y-2.5 ${isSelected ? 'ring-1 ring-sky-500/70' : ''}`}
                  >
                    {/* Identity + status */}
                    <div className="flex items-start gap-2.5">
                      <button
                        type="button"
                        onClick={(e) => handleSelectOne(candidate.id, e)}
                        aria-label={`${isSelected ? 'Deselect' : 'Select'} ${candidate.firstName} ${candidate.lastName}`}
                        aria-pressed={isSelected}
                        className="mt-1.5 shrink-0"
                      >
                        {isSelected ? <CheckSquare className="w-4 h-4 text-sky-500" /> : <Square className="cc-muted w-4 h-4" />}
                      </button>
                      <div className="w-9 h-9 rounded-full bg-sky-600/20 text-sky-500 border border-sky-500/30 flex items-center justify-center font-bold text-xs shrink-0">
                        {candidate.firstName[0]}{candidate.lastName[0]}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="cc-title text-sm font-semibold leading-snug break-words">
                          {candidate.firstName} {candidate.lastName}
                        </div>
                        <div className="cc-accent font-mono text-[11px] font-semibold">{candidate.userId}</div>
                      </div>
                      <div className="shrink-0">
                        <StatusBadge type="joining" status={candidate.joiningStatus} size="sm" />
                      </div>
                    </div>

                    {/* Key facts */}
                    <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
                      <div className="min-w-0">
                        <dt className="cc-muted text-[10px] font-semibold uppercase tracking-wide">Client</dt>
                        <dd className="cc-title font-medium break-words">{candidate.clientName}</dd>
                      </div>
                      <div className="min-w-0">
                        <dt className="cc-muted text-[10px] font-semibold uppercase tracking-wide">Designation</dt>
                        <dd className="cc-title font-medium break-words">{candidate.designation}</dd>
                      </div>
                      <div className="col-span-2 min-w-0 flex items-baseline gap-2">
                        <dt className="cc-muted text-[10px] font-semibold uppercase tracking-wide">Joining Date</dt>
                        <dd className="cc-title font-mono font-semibold">{candidate.dateOfJoining}</dd>
                      </div>
                    </dl>

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-2.5 border-t border-[color:var(--cc-divider)]">
                      <button
                        type="button"
                        onClick={() => setPreviewCandidate(candidate)}
                        className="cc-btn cc-btn-tone tone-info !h-9 flex-1 min-[420px]:flex-none"
                        title={`Open details for ${candidate.firstName} ${candidate.lastName}`}
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Details</span>
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedCardIds((prev) =>
                            prev.includes(candidate.id) ? prev.filter((id) => id !== candidate.id) : [...prev, candidate.id]
                          )
                        }
                        aria-expanded={isExpanded}
                        className="cc-btn cc-btn-secondary !h-9 !px-2.5"
                      >
                        <span>{isExpanded ? 'Less' : 'More'}</span>
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      </button>
                      <div className="relative ml-auto">
                        <button
                          type="button"
                          onClick={() => setActiveActionMenuId(activeActionMenuId === candidate.id ? null : candidate.id)}
                          className="cc-page-btn"
                          aria-label="Candidate actions"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                        {renderActionMenu(candidate)}
                      </div>
                    </div>

                    {/* Expandable details */}
                    {isExpanded && (
                      <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs pt-2.5 border-t border-[color:var(--cc-divider)]">
                        <div className="min-w-0">
                          <dt className="cc-muted text-[10px] font-semibold uppercase tracking-wide">Phone</dt>
                          <dd className="cc-title">{candidate.phone}</dd>
                        </div>
                        <div className="min-w-0">
                          <dt className="cc-muted text-[10px] font-semibold uppercase tracking-wide">Branch / Location</dt>
                          <dd className="cc-title break-words">{candidate.branchName || candidate.workLocation}</dd>
                        </div>
                        <div className="col-span-2 min-w-0">
                          <dt className="cc-muted text-[10px] font-semibold uppercase tracking-wide">Email</dt>
                          <dd className="cc-title break-all">{candidate.email}</dd>
                        </div>
                        <div className="min-w-0">
                          <dt className="cc-muted text-[10px] font-semibold uppercase tracking-wide">Department</dt>
                          <dd className="cc-title break-words">{candidate.department}</dd>
                        </div>
                        <div className="min-w-0">
                          <dt className="cc-muted text-[10px] font-semibold uppercase tracking-wide">₹1 Penny Test</dt>
                          <dd className="mt-0.5"><StatusBadge type="penny" status={candidate.pennyTestStatus} size="sm" /></dd>
                        </div>
                        <div className="col-span-2 min-w-0">
                          <dt className="cc-muted text-[10px] font-semibold uppercase tracking-wide">KYC Summary</dt>
                          <dd className="mt-0.5">
                            <button
                              type="button"
                              onClick={() => onOpenKycWorkspace(candidate)}
                              className="inline-flex items-center gap-1.5 font-mono text-[10px] font-bold"
                              title="Open documents in KYC Desk"
                            >
                              {[['A', 'Aadhaar'], ['P', 'PAN'], ['B', 'Bank'], ['U', 'UAN']].map(([letter, type]) => (
                                <span
                                  key={letter}
                                  title={`${type}: ${kycOf(type)?.status || 'Not Started'}`}
                                  className={`w-5 h-5 rounded border flex items-center justify-center ${kycChip(kycOf(type)?.status)}`}
                                >
                                  {letter}
                                </span>
                              ))}
                              <span className="cc-muted font-sans font-semibold">· KYC Desk</span>
                            </button>
                          </dd>
                        </div>
                        <div className="min-w-0">
                          <dt className="cc-muted text-[10px] font-semibold uppercase tracking-wide">Registered</dt>
                          <dd className="cc-title font-mono">{candidate.registrationDate}</dd>
                        </div>
                        <div className="min-w-0">
                          <dt className="cc-muted text-[10px] font-semibold uppercase tracking-wide">Recruiter / Source</dt>
                          <dd className="cc-title break-words">{candidate.recruiterName} · {candidate.source}</dd>
                        </div>
                        {candidate.oldEmployeeId && (
                          <div className="min-w-0">
                            <dt className="cc-muted text-[10px] font-semibold uppercase tracking-wide">Old Employee ID</dt>
                            <dd className="cc-title font-mono">{candidate.oldEmployeeId}</dd>
                          </div>
                        )}
                      </dl>
                    )}
                  </article>
                );
              })
            )}
          </div>

          {/* ========================================================================= */}
          {/* MAIN CANDIDATE DIRECTORY TABLE                                             */}
          {/* ========================================================================= */}
          <div className={`${cardStyleClass} overflow-hidden hidden md:block`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className={`border-b text-[11px] font-semibold uppercase tracking-wider ${
                    isDark ? 'bg-slate-950/90 border-slate-800 text-slate-400' : 'bg-slate-50/80 border-slate-200 text-slate-500'
                  }`}>
                    <th className="py-3 px-3 w-8 text-center">
                      <button 
                        type="button" 
                        onClick={handleSelectAll} 
                        className="cursor-pointer text-slate-400 hover:text-slate-200"
                        title="Select / Deselect all"
                      >
                        {selectedIds.length === filteredCandidates.length && filteredCandidates.length > 0 ? (
                          <CheckSquare className="w-4 h-4 text-sky-500" />
                        ) : (
                          <Square className="w-4 h-4" />
                        )}
                      </button>
                    </th>
                    <th className="py-3 px-3">User ID</th>
                    <th className="py-3 px-3">Candidate Details</th>
                    <th className="py-3 px-3">Company & Branch</th>
                    <th className="py-3 px-3">Department & Role</th>
                    <th className="py-3 px-3">KYC Summary (A / P / B / U)</th>
                    <th className="py-3 px-3">₹1 Penny Test</th>
                    <th className="py-3 px-3">Joining Status</th>
                    <th className="py-3 px-3">Interview / Joining</th>
                    <th className="py-3 px-3">Sourcing Info</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody className={`divide-y ${isDark ? 'divide-slate-800 text-slate-300' : 'divide-slate-100 text-slate-700'}`}>
                  {paginatedCandidates.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="py-14 text-center">
                        <div className="flex flex-col items-center justify-center space-y-2.5 max-w-sm mx-auto">
                          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                            <SearchX className="w-6 h-6" />
                          </div>
                          <p className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            No candidates match your criteria
                          </p>
                          <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            We couldn't find any candidates matching your selected search query or applied filters.
                          </p>
                          <button
                            type="button"
                            onClick={handleResetFilters}
                            className="mt-2 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs transition-colors shadow-2xs"
                          >
                            Reset All Filters
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedCandidates.map((candidate) => {
                      const isSelected = selectedIds.includes(candidate.id);
                      const aadhaarRec = candidate.kycRecords.find(k => k.documentType === 'Aadhaar');
                      const panRec = candidate.kycRecords.find(k => k.documentType === 'PAN');
                      const bankRec = candidate.kycRecords.find(k => k.documentType === 'Bank');
                      const uanRec = candidate.kycRecords.find(k => k.documentType === 'UAN');

                      return (
                        <tr
                          key={candidate.id}
                          onClick={() => setPreviewCandidate(candidate)}
                          className={`cursor-pointer transition-colors ${
                            isDark ? 'hover:bg-slate-850/60' : 'hover:bg-slate-50/80'
                          } ${
                            isSelected ? (isDark ? 'bg-sky-950/40' : 'bg-sky-50/40') : ''
                          }`}
                        >
                          {/* Checkbox */}
                          <td className="py-3 px-3 text-center" onClick={(e) => handleSelectOne(candidate.id, e)}>
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-sky-500 mx-auto" />
                            ) : (
                              <Square className={`w-4 h-4 mx-auto ${isDark ? 'text-slate-600 hover:text-slate-400' : 'text-slate-300 hover:text-slate-400'}`} />
                            )}
                          </td>

                          {/* User ID & Old Emp ID */}
                          <td className="py-3 px-3 font-mono whitespace-nowrap">
                            <div className={`font-semibold ${isDark ? 'text-sky-400' : 'text-slate-900'}`}>
                              {candidate.userId}
                            </div>
                            {candidate.oldEmployeeId && (
                              <span className={`text-[10px] px-1.5 py-0.2 rounded border block mt-0.5 w-fit ${
                                isDark ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-100 text-slate-600 border-slate-200'
                              }`}>
                                Old: {candidate.oldEmployeeId}
                              </span>
                            )}
                          </td>

                          {/* Candidate Name & Contact */}
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-sky-600/20 text-sky-400 border border-sky-500/30 flex items-center justify-center font-bold text-[11px] shrink-0">
                                {candidate.firstName[0]}{candidate.lastName[0]}
                              </div>
                              <div>
                                <div className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                  {candidate.firstName} {candidate.lastName}
                                </div>
                                <div className={`text-[11px] flex items-center gap-1.5 mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                  <span>{candidate.phone}</span>
                                  <span className={isDark ? 'text-slate-600' : 'text-slate-300'}>·</span>
                                  <span className="truncate max-w-[130px]">{candidate.email}</span>
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Company & Branch */}
                          <td className="py-3 px-3">
                            <div className={`font-medium truncate max-w-[170px] ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                              {candidate.clientName}
                            </div>
                            <div className={`text-[11px] truncate max-w-[170px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                              {candidate.branchName || candidate.workLocation}
                            </div>
                          </td>

                          {/* Department & Role */}
                          <td className="py-3 px-3">
                            <div className={`font-medium truncate max-w-[170px] ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                              {candidate.designation}
                            </div>
                            <div className={`text-[11px] truncate max-w-[170px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                              {candidate.department}
                            </div>
                          </td>

                          {/* KYC Summary - 4 Indicators A, P, B, U */}
                          <td className="py-3 px-3" onClick={(e) => e.stopPropagation()}>
                            <div 
                              onClick={() => onOpenKycWorkspace(candidate)}
                              className={`group inline-flex items-center gap-1.5 p-1 rounded cursor-pointer transition-colors ${
                                isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100'
                              }`}
                              title="Click to inspect documents in KYC Desk"
                            >
                              <div className="flex items-center gap-1 font-mono text-[10px] font-bold">
                                <span 
                                  className={`w-4 h-4 rounded flex items-center justify-center ${
                                    aadhaarRec?.status === 'Verified' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                                    aadhaarRec?.status === 'Pending Manual Review' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                                    aadhaarRec?.status === 'API Mismatch' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : 
                                    (isDark ? 'bg-slate-800 text-slate-500' : 'bg-slate-100 text-slate-500')
                                  }`} 
                                  title={`Aadhaar: ${aadhaarRec?.status || 'Not Started'}`}
                                >
                                  A
                                </span>
                                <span 
                                  className={`w-4 h-4 rounded flex items-center justify-center ${
                                    panRec?.status === 'Verified' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                                    panRec?.status === 'Pending Manual Review' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                                    panRec?.status === 'API Mismatch' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : 
                                    (isDark ? 'bg-slate-800 text-slate-500' : 'bg-slate-100 text-slate-500')
                                  }`} 
                                  title={`PAN: ${panRec?.status || 'Not Started'}`}
                                >
                                  P
                                </span>
                                <span 
                                  className={`w-4 h-4 rounded flex items-center justify-center ${
                                    bankRec?.status === 'Verified' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                                    bankRec?.status === 'Pending Manual Review' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                                    bankRec?.status === 'Rejected' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 
                                    (isDark ? 'bg-slate-800 text-slate-500' : 'bg-slate-100 text-slate-500')
                                  }`} 
                                  title={`Bank: ${bankRec?.status || 'Not Started'}`}
                                >
                                  B
                                </span>
                                <span 
                                  className={`w-4 h-4 rounded flex items-center justify-center ${
                                    uanRec?.status === 'Verified' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                                    uanRec?.status === 'Pending Manual Review' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                                    uanRec?.status === 'Skipped' ? (isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-200 text-slate-700') : 
                                    (isDark ? 'bg-slate-800 text-slate-500' : 'bg-slate-100 text-slate-500')
                                  }`} 
                                  title={`UAN: ${uanRec?.status || 'Not Started'}`}
                                >
                                  U
                                </span>
                              </div>
                              <span className={`text-[10px] ${isDark ? 'text-slate-400 group-hover:text-slate-200' : 'text-slate-400 group-hover:text-slate-700'}`}>
                                · KYC
                              </span>
                            </div>
                          </td>

                          {/* ₹1 Penny Test Status */}
                          <td className="py-3 px-3 whitespace-nowrap">
                            <StatusBadge type="penny" status={candidate.pennyTestStatus} size="sm" />
                          </td>

                          {/* Joining Status */}
                          <td className="py-3 px-3 whitespace-nowrap">
                            <StatusBadge type="joining" status={candidate.joiningStatus} size="sm" />
                          </td>

                          {/* DOJ & Registration */}
                          <td className="py-3 px-3 font-mono whitespace-nowrap">
                            <div className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                              {candidate.dateOfJoining}
                            </div>
                            <div className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                              Reg: {candidate.registrationDate}
                            </div>
                          </td>

                          {/* Recruiter / Source */}
                          <td className="py-3 px-3">
                            <div className={`font-medium ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                              {candidate.recruiterName}
                            </div>
                            <div className={`text-[11px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                              {candidate.source}
                            </div>
                          </td>

                          {/* Actions Column: Direct "View Details" CTA + More Menu */}
                          <td className="py-3 px-3 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Direct View Details Button */}
                              <button
                                type="button"
                                onClick={() => setPreviewCandidate(candidate)}
                                className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md transition-colors border shadow-2xs cursor-pointer ${
                                  isDark
                                    ? 'bg-sky-950/80 text-sky-300 border-sky-800 hover:bg-sky-600 hover:text-white'
                                    : 'bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-600 hover:text-white'
                                }`}
                                title={`Open details for ${candidate.firstName} ${candidate.lastName}`}
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>View Details</span>
                              </button>

                              {/* More Actions Dropdown */}
                              <div className="relative inline-block text-left">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setActiveActionMenuId(
                                      activeActionMenuId === candidate.id ? null : candidate.id
                                    )
                                  }
                                  className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                                    isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                                  }`}
                                  aria-label="Candidate actions"
                                >
                                  <MoreHorizontal className="w-4 h-4" />
                                </button>

                                {renderActionMenu(candidate)}
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick Preview Slide-out Drawer */}
          <CandidatePreviewDrawer
            candidate={previewCandidate}
            onClose={() => setPreviewCandidate(null)}
            onOpenFullProfile={(c) => {
              setPreviewCandidate(null);
              onOpenCandidateProfile(c);
            }}
            onOpenKycWorkspace={(c) => {
              setPreviewCandidate(null);
              onOpenKycWorkspace(c);
            }}
          />

          {/* Filter Drawer (optional full slide-over backup) */}
          <FilterDrawer
            isOpen={isFilterDrawerOpen}
            onClose={() => setIsFilterDrawerOpen(false)}
            filters={filters}
            onFilterChange={setFilters}
            onReset={handleResetFilters}
            activeFilterCount={totalActiveFilterCount}
          />

          {/* Change Joining Status Modal */}
          {statusChangeModalCandidate && (
            <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
              <div className={`rounded-xl shadow-2xl border max-w-md w-full p-5 space-y-4 animate-in fade-in duration-150 ${
                isDark ? 'bg-slate-900 border-slate-750 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
              }`}>
                <div className={`flex items-center justify-between border-b pb-3 ${
                  isDark ? 'border-slate-800' : 'border-slate-100'
                }`}>
                  <div>
                    <h3 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>Update Joining Status</h3>
                    <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      {statusChangeModalCandidate.firstName} {statusChangeModalCandidate.lastName} ({statusChangeModalCandidate.userId})
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStatusChangeModalCandidate(null)}
                    className={`transition-colors cursor-pointer ${isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-400 hover:text-slate-700'}`}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-3 text-xs">
                  <label className={`block font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>Select New Status:</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['Joined', 'Yet to Join', 'Offer Accepted', 'Verification In Progress', 'Deferred', 'Dropout', 'Offer Dropped'] as JoiningStatus[]).map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setNewSelectedStatus(st)}
                        className={`p-2 rounded-lg border text-left font-medium transition-all cursor-pointer ${
                          newSelectedStatus === st
                            ? 'border-sky-500 bg-sky-600/20 text-sky-300 ring-1 ring-sky-500'
                            : isDark
                            ? 'border-slate-750 bg-slate-950 text-slate-300 hover:bg-slate-850'
                            : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                <div className={`flex items-center justify-end gap-2 pt-3 border-t ${
                  isDark ? 'border-slate-800' : 'border-slate-100'
                }`}>
                  <button
                    type="button"
                    onClick={() => setStatusChangeModalCandidate(null)}
                    className={`px-3 py-1.5 text-xs font-medium cursor-pointer ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleApplyStatusChange}
                    className="px-4 py-1.5 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-md shadow-xs transition-colors cursor-pointer"
                  >
                    Confirm Update
                  </button>
                </div>
              </div>
            </div>
          )}
      </>
      </PageBody>
    </div>
  );
};
