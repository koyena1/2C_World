import React, { useState, useMemo } from 'react';
import { PageHeader } from '../../components/page/PageHeader';
import { PageBody } from '../../components/page/PageBody';
import { KpiCard } from '../../components/page/KpiCard';
import { fullyVerifiedTrend, kycRecordTrend, totalCandidatesTrend } from '../../utils/candidateTrends';
import { Chip } from '../dashboard/command-center/shared';
import { Toast } from '../../components/ui/Toast';
import { useToast } from '../../hooks/useToast';
import {
  ShieldCheck, 
  Users,
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Clock, 
  ExternalLink, 
  FileText, 
  History, 
  X, 
  Check, 
  ChevronRight, 
  ChevronLeft,
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  Download, 
  Eye, 
  RefreshCw, 
  Send, 
  AlertCircle, 
  FileCheck2, 
  FileX2, 
  Building2, 
  User, 
  CreditCard, 
  Hash,
  Search,
  Filter,
  ArrowLeft,
  Layers,
  Calendar,
  Zap,
  CheckCircle,
  HelpCircle,
  Code
} from 'lucide-react';
import { Candidate, KycRecord, KycDocumentStatus, PennyTestStatus } from '../../types/onboarding';
import { StatusBadge } from '../../components/common/StatusBadge';
import { useTheme } from '../../hooks/useTheme';

import { SelectMenu } from '../../components/ui/SelectMenu';
interface KycVerificationWorkspaceProps {
  candidates: Candidate[];
  activeCandidate: Candidate;
  onSelectCandidate: (candidate: Candidate) => void;
  onOpenCandidate360: (candidate: Candidate) => void;
}

export const KycVerificationWorkspace: React.FC<KycVerificationWorkspaceProps> = ({
  candidates,
  activeCandidate: propActiveCandidate,
  onSelectCandidate,
  onOpenCandidate360,
}) => {
  const { isDark } = useTheme();

  // -------------------------------------------------------------
  // HIERARCHICAL WORKFLOW STATE (Client-First Architecture)
  // Level 1: Client selection
  // Level 2: Department selection
  // Level 3: Candidate list within context
  // Level 4: Candidate Inspection Mode
  // -------------------------------------------------------------
  const [selectedClient, setSelectedClient] = useState<string>('all');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [verificationTypeFilter, setVerificationTypeFilter] = useState<string>('all');
  const [verificationStatusFilter, setVerificationStatusFilter] = useState<string>('all');
  const [dateRangeFilter, setDateRangeFilter] = useState<string>('all');

  // Drill-down navigation state: 'overview' | 'department_view' | 'inspect'
  const [activeWorkflowLevel, setActiveWorkflowLevel] = useState<'overview' | 'department_view' | 'inspect'>('overview');
  const [inspectedCandidate, setInspectedCandidate] = useState<Candidate>(propActiveCandidate || candidates[0]);
  const [internalCandidateSearch, setInternalCandidateSearch] = useState<string>('');

  // Modals / Inspections
  const [selectedRecordForDocView, setSelectedRecordForDocView] = useState<KycRecord | null>(null);
  const [selectedRecordForApiDetails, setSelectedRecordForApiDetails] = useState<KycRecord | null>(null);
  const [selectedRecordForAudit, setSelectedRecordForAudit] = useState<KycRecord | null>(null);

  // Document Viewer interactive controls
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [rotation, setRotation] = useState<number>(0);
  const [decisionMode, setDecisionMode] = useState<'view' | 'approve' | 'reject'>('view');
  const [rejectionReason, setRejectionReason] = useState<string>('Scan illegible or cropped edges');
  const [remarks, setRemarks] = useState<string>('');
  const { message: toastMessage, showToast } = useToast();

  // Distinct list of all clients
  const clientList = useMemo(() => {
    const set = new Set<string>();
    candidates.forEach((c) => {
      if (c.clientName) set.add(c.clientName);
    });
    return Array.from(set).sort();
  }, [candidates]);

  // Departments under current selected client (cascading filter)
  const availableDepartments = useMemo(() => {
    const set = new Set<string>();
    candidates.forEach((c) => {
      if (selectedClient === 'all' || c.clientName === selectedClient) {
        if (c.department) set.add(c.department);
      }
    });
    return Array.from(set).sort();
  }, [candidates, selectedClient]);

  // Candidates filtered by Client, Department, Verification Type, Verification Status & Date
  const filteredCandidates = useMemo(() => {
    return candidates.filter((c) => {
      // 1. Client filter
      if (selectedClient !== 'all' && c.clientName !== selectedClient) {
        return false;
      }
      // 2. Department filter
      if (selectedDepartment !== 'all' && c.department !== selectedDepartment) {
        return false;
      }
      // 3. Verification Type & Status filter
      if (verificationTypeFilter !== 'all' || verificationStatusFilter !== 'all') {
        const matchesType = c.kycRecords.some((rec) => {
          const typeMatches = 
            verificationTypeFilter === 'all' ||
            (verificationTypeFilter === 'Bank' ? (rec.documentType === 'Bank') : rec.documentType === verificationTypeFilter);
          
          if (!typeMatches) return false;

          if (verificationStatusFilter === 'all') return true;
          if (verificationStatusFilter === 'Pending') {
            return rec.status === 'Pending Manual Review' || rec.status === 'API Mismatch';
          }
          if (verificationStatusFilter === 'Verified') {
            return rec.status === 'Verified';
          }
          if (verificationStatusFilter === 'Failed') {
            return rec.status === 'API Mismatch' || (rec.documentType === 'Bank' && c.pennyTestStatus === 'Failed');
          }
          if (verificationStatusFilter === 'Manual Review') {
            return rec.status === 'Pending Manual Review';
          }
          if (verificationStatusFilter === 'Rejected') {
            return rec.status === 'Rejected';
          }
          if (verificationStatusFilter === 'Not Submitted') {
            return rec.documentAvailability === 'Missing Document';
          }
          return rec.status === verificationStatusFilter;
        });

        if (!matchesType) return false;
      }

      // 4. Candidate contextual search
      if (internalCandidateSearch.trim()) {
        const q = internalCandidateSearch.toLowerCase();
        const matchesName = `${c.firstName} ${c.lastName}`.toLowerCase().includes(q);
        const matchesCode = (c.userId || '').toLowerCase().includes(q) || (c.clientCandidateCode || '').toLowerCase().includes(q);
        const matchesRole = (c.designation || '').toLowerCase().includes(q);
        if (!matchesName && !matchesCode && !matchesRole) return false;
      }

      return true;
    });
  }, [candidates, selectedClient, selectedDepartment, verificationTypeFilter, verificationStatusFilter, internalCandidateSearch]);

  // Client Verification Overview Metrics (Aggregated for selected client or all)
  const clientOverviewMetrics = useMemo(() => {
    const targetPool = selectedClient === 'all' 
      ? candidates 
      : candidates.filter((c) => c.clientName === selectedClient);

    let totalCandidates = targetPool.length;
    let aadhaarPending = 0;
    let panPending = 0;
    let bankPennyPending = 0;
    let failedVerifications = 0;
    let manualReviewRequired = 0;
    let verifiedCount = 0;

    targetPool.forEach((c) => {
      let isCandidateFullyVerified = true;

      c.kycRecords.forEach((r) => {
        if (r.status !== 'Verified') isCandidateFullyVerified = false;

        if (r.documentType === 'Aadhaar' && (r.status === 'Pending Manual Review' || r.status === 'API Mismatch')) {
          aadhaarPending++;
        }
        if (r.documentType === 'PAN' && (r.status === 'Pending Manual Review' || r.status === 'API Mismatch')) {
          panPending++;
        }
        if (r.documentType === 'Bank' && (r.status === 'Pending Manual Review' || c.pennyTestStatus === 'Pending')) {
          bankPennyPending++;
        }
        if (r.status === 'API Mismatch' || (r.documentType === 'Bank' && c.pennyTestStatus === 'Failed')) {
          failedVerifications++;
        }
        if (r.status === 'Pending Manual Review') {
          manualReviewRequired++;
        }
      });

      if (isCandidateFullyVerified && c.pennyTestStatus === 'Verified') {
        verifiedCount++;
      }
    });

    return {
      clientName: selectedClient === 'all' ? 'All Enterprise Clients' : selectedClient,
      totalCandidates,
      aadhaarPending,
      panPending,
      bankPennyPending,
      failedVerifications,
      manualReviewRequired,
      verifiedCount,
    };
  }, [candidates, selectedClient]);

  // Department-wise breakdown
  const departmentBreakdown = useMemo(() => {
    const deptMap: Record<string, {
      departmentName: string;
      totalEmployees: number;
      pendingAadhaar: number;
      pendingPan: number;
      bankFailed: number;
      manualReview: number;
      verifiedCount: number;
      candidates: Candidate[];
    }> = {};

    const targetPool = selectedClient === 'all' 
      ? candidates 
      : candidates.filter((c) => c.clientName === selectedClient);

    targetPool.forEach((c) => {
      const dept = c.department || 'General Operations';
      if (!deptMap[dept]) {
        deptMap[dept] = {
          departmentName: dept,
          totalEmployees: 0,
          pendingAadhaar: 0,
          pendingPan: 0,
          bankFailed: 0,
          manualReview: 0,
          verifiedCount: 0,
          candidates: []
        };
      }

      deptMap[dept].totalEmployees++;
      deptMap[dept].candidates.push(c);

      c.kycRecords.forEach((r) => {
        if (r.documentType === 'Aadhaar' && (r.status === 'Pending Manual Review' || r.status === 'API Mismatch')) {
          deptMap[dept].pendingAadhaar++;
        }
        if (r.documentType === 'PAN' && (r.status === 'Pending Manual Review' || r.status === 'API Mismatch')) {
          deptMap[dept].pendingPan++;
        }
        if ((r.documentType === 'Bank' && c.pennyTestStatus === 'Failed') || r.status === 'API Mismatch') {
          deptMap[dept].bankFailed++;
        }
        if (r.status === 'Pending Manual Review') {
          deptMap[dept].manualReview++;
        }
      });

      if (c.overallKycStatus === 'Verified' && c.pennyTestStatus === 'Verified') {
        deptMap[dept].verifiedCount++;
      }
    });

    return Object.values(deptMap).sort((a, b) => b.totalEmployees - a.totalEmployees);
  }, [candidates, selectedClient]);

  // Handle Client Filter Change
  const handleClientChange = (clientVal: string) => {
    setSelectedClient(clientVal);
    setSelectedDepartment('all'); // reset cascading filter
    setActiveWorkflowLevel('overview');
  };

  // Inspect Candidate Handler
  const handleInspectCandidate = (cand: Candidate) => {
    setInspectedCandidate(cand);
    onSelectCandidate(cand);
    setActiveWorkflowLevel('inspect');
  };

  // Open Document Viewer
  const handleOpenDocViewer = (record: KycRecord, defaultDecisionMode: 'view' | 'approve' | 'reject' = 'view') => {
    setSelectedRecordForDocView(record);
    setDecisionMode(defaultDecisionMode);
    setZoomLevel(100);
    setRotation(0);
    setRemarks('');
  };

  // Approval Execution
  const handleExecuteApproval = (record: KycRecord) => {
    record.status = 'Verified';
    record.documentAvailability = 'Document Uploaded';
    record.verifiedBy = 'Ananya Mukherjee (Ops Lead - Manual)';
    record.lastUpdated = 'Just now';
    record.auditTrail.unshift({
      id: `a-${Date.now()}`,
      action: 'Manually Approved via Document Desk',
      timestamp: 'Just now',
      actor: 'Ananya Mukherjee (Ops Lead)',
      notes: remarks 
        ? `Manual clearance approved after document inspection: ${remarks}` 
        : 'Approved after inspecting uploaded document against statutory NSDL/UIDAI identity registry.',
    });

    showToast(`${record.documentType} verification cleared & approved successfully!`);
    setSelectedRecordForDocView(null);
  };

  // Rejection Execution
  const handleExecuteRejection = (record: KycRecord) => {
    if (!remarks.trim()) {
      alert('Mandatory compliance rule: Please provide detailed remarks explaining the rejection reason.');
      return;
    }

    record.status = 'Rejected';
    record.documentAvailability = 'Rejected Document';
    record.previousRejectionReason = rejectionReason;
    record.remarks = `${rejectionReason}: ${remarks}`;
    record.lastUpdated = 'Just now';
    record.auditTrail.unshift({
      id: `a-${Date.now()}`,
      action: 'Document Rejected & Re-upload Requested',
      timestamp: 'Just now',
      actor: 'Ananya Mukherjee (Ops Lead)',
      notes: `Rejected due to: ${rejectionReason}. Candidate instruction: ${remarks}`,
    });

    showToast(`${record.documentType} rejected. Notification sent to candidate via WhatsApp & Email.`);
    setSelectedRecordForDocView(null);
  };

  // Recheck simulation
  const handleRecheck = (record: KycRecord) => {
    record.lastUpdated = 'Just now (Rechecked)';
    record.auditTrail.unshift({
      id: `a-${Date.now()}`,
      action: 'API Re-query Triggered',
      timestamp: 'Just now',
      actor: 'Ananya Mukherjee (Ops Lead)',
      notes: `Live ping to ${record.apiSearchValue} returned active status. Match rate: ${record.matchPercentage}%.`,
    });
    showToast(`Instant recheck complete: ${record.documentType} record is active and verified.`);
  };

  return (
    <div className={`flex-1 flex flex-col transition-colors duration-150 ${
      isDark ? 'text-slate-100' : 'text-slate-900'
    }`}>
      {/* Toast Notification */}
      <Toast message={toastMessage} />

      <PageHeader
        icon={ShieldCheck}
        title="KYC & ₹1 Bank Verification Desk"
        subtitle={activeWorkflowLevel === 'inspect' ? `${inspectedCandidate.firstName} ${inspectedCandidate.lastName} (${inspectedCandidate.userId})` : undefined}
        actions={
          <>
            {activeWorkflowLevel === 'inspect' && (
              <button
                onClick={() => setActiveWorkflowLevel(selectedDepartment !== 'all' ? 'department_view' : 'overview')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                  isDark
                    ? 'bg-slate-900 hover:bg-slate-800 border-slate-750 text-slate-200'
                    : 'bg-white hover:bg-slate-50 border-slate-300 text-slate-700 shadow-2xs'
                }`}
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Department List</span>
              </button>
            )}

            {activeWorkflowLevel === 'inspect' && (
              <button
                onClick={() => onOpenCandidate360(inspectedCandidate)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                  isDark
                    ? 'bg-sky-950/80 hover:bg-sky-900/80 border-sky-800 text-sky-300'
                    : 'bg-sky-50 hover:bg-sky-100 border-sky-200 text-sky-800 shadow-2xs'
                }`}
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Candidate Profile 360</span>
              </button>
            )}
          </>
        }
      />

      <PageBody>

      {/* Filters: one compact row */}
      <div className="cc-card p-3 sm:p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="min-w-0">
            <label htmlFor="kyc-client" className="cc-label">Client</label>
            <SelectMenu
              id="kyc-client"
              value={selectedClient}
              onChange={(e) => handleClientChange(e.target.value)}
              className="cc-input"
            >
              <option value="all">All Clients</option>
              {clientList.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </SelectMenu>
          </div>

          <div className="min-w-0">
            <label htmlFor="kyc-department" className="cc-label">Department</label>
            <SelectMenu
              id="kyc-department"
              value={selectedDepartment}
              onChange={(e) => {
                setSelectedDepartment(e.target.value);
                if (e.target.value !== 'all') {
                  setActiveWorkflowLevel('department_view');
                }
              }}
              className="cc-input"
            >
              <option value="all">All Departments</option>
              {availableDepartments.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </SelectMenu>
          </div>

          <div className="min-w-0">
            <label htmlFor="kyc-type" className="cc-label">Verification Type</label>
            <SelectMenu
              id="kyc-type"
              value={verificationTypeFilter}
              onChange={(e) => setVerificationTypeFilter(e.target.value)}
              className="cc-input"
            >
              <option value="all">All Verification Types</option>
              <option value="Aadhaar">Aadhaar (UIDAI)</option>
              <option value="PAN">PAN (NSDL / Income Tax)</option>
              <option value="Bank">Bank / ₹1 Penny Drop (NPCI)</option>
              <option value="UAN">UAN / Statutory (EPFO)</option>
            </SelectMenu>
          </div>

          <div className="min-w-0">
            <label htmlFor="kyc-status" className="cc-label">Status</label>
            <SelectMenu
              id="kyc-status"
              value={verificationStatusFilter}
              onChange={(e) => setVerificationStatusFilter(e.target.value)}
              className="cc-input"
            >
              <option value="all">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Verified">Verified</option>
              <option value="Failed">Failed</option>
              <option value="Manual Review">Manual Review Required</option>
              <option value="Rejected">Rejected</option>
              <option value="Not Submitted">Not Submitted / Missing</option>
            </SelectMenu>
          </div>

          <div className="min-w-0">
            <label htmlFor="kyc-date" className="cc-label">Date Range</label>
            <SelectMenu
              id="kyc-date"
              value={dateRangeFilter}
              onChange={(e) => setDateRangeFilter(e.target.value)}
              className="cc-input"
            >
              <option value="all">All Dates</option>
              <option value="today">Today</option>
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="custom">Custom Date Range</option>
            </SelectMenu>
          </div>
        </div>

        {(selectedClient !== 'all' || selectedDepartment !== 'all' || verificationTypeFilter !== 'all' || verificationStatusFilter !== 'all' || dateRangeFilter !== 'all' || internalCandidateSearch) && (
          <div className="flex justify-end mt-2.5">
            <button
              type="button"
              onClick={() => {
                setSelectedClient('all');
                setSelectedDepartment('all');
                setVerificationTypeFilter('all');
                setVerificationStatusFilter('all');
                setDateRangeFilter('all');
                setInternalCandidateSearch('');
                setActiveWorkflowLevel('overview');
              }}
              className="cc-accent text-[11px] font-semibold hover:underline inline-flex items-center gap-1"
            >
              <RotateCw className="w-3 h-3" />
              <span>Reset All Filters</span>
            </button>
          </div>
        )}
      </div>

      {/* KPIs: five non-overlapping measures */}
      <div className="cc-grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
        <KpiCard
          label="Total Candidates"
          value={clientOverviewMetrics.totalCandidates}
          trend={totalCandidatesTrend(selectedClient === 'all' ? candidates : candidates.filter((c) => c.clientName === selectedClient))}
          icon={Users}
          tone="info"
        />
        <KpiCard
          label="100% Verified"
          value={clientOverviewMetrics.verifiedCount}
          trend={fullyVerifiedTrend(selectedClient === 'all' ? candidates : candidates.filter((c) => c.clientName === selectedClient))}
          icon={CheckCircle2}
          tone="good"
        />
        <KpiCard label="Manual Review" value={clientOverviewMetrics.manualReviewRequired} trend={kycRecordTrend(selectedClient === 'all' ? candidates : candidates.filter((c) => c.clientName === selectedClient), 'manualReview')} icon={Eye} tone="violet" />
        <KpiCard label="Failed Checks" value={clientOverviewMetrics.failedVerifications} trend={kycRecordTrend(selectedClient === 'all' ? candidates : candidates.filter((c) => c.clientName === selectedClient), 'failed')} icon={XCircle} tone="bad" />
        <KpiCard label="Bank / ₹1 Pending" value={clientOverviewMetrics.bankPennyPending} trend={kycRecordTrend(selectedClient === 'all' ? candidates : candidates.filter((c) => c.clientName === selectedClient), 'bankPending')} icon={CreditCard} tone="warn" />
      </div>

      {/* Department cards */}
      {activeWorkflowLevel !== 'inspect' && (
        <section className="space-y-3">
          <h3 className="cc-title text-sm font-bold">Department-wise Verification Breakdown</h3>

          <div className="cc-grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
            {departmentBreakdown.map((dept) => (
              <div key={dept.departmentName} className="cc-card cc-card-hover p-4 flex flex-col gap-3 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h4 className="cc-title text-sm font-bold truncate">{dept.departmentName}</h4>
                    <p className="cc-muted text-[11px] mt-0.5">{dept.totalEmployees} Assigned Employees</p>
                  </div>
                  <Chip tone={dept.manualReview > 0 ? 'warn' : 'good'} className="font-mono shrink-0">
                    {dept.verifiedCount}/{dept.totalEmployees} Clear
                  </Chip>
                </div>

                <div className="grid grid-cols-4 gap-1.5 p-2 rounded-lg border border-[color:var(--cc-divider)] bg-[color:var(--cc-row-hover)] text-center">
                  <div className="tone-warn">
                    <span className="cc-muted text-[9px] uppercase font-bold block">Aadhaar</span>
                    <span className="tone-text text-sm font-bold font-mono">{dept.pendingAadhaar}</span>
                  </div>
                  <div className="tone-warn">
                    <span className="cc-muted text-[9px] uppercase font-bold block">PAN</span>
                    <span className="tone-text text-sm font-bold font-mono">{dept.pendingPan}</span>
                  </div>
                  <div className="tone-bad">
                    <span className="cc-muted text-[9px] uppercase font-bold block">Bank Fail</span>
                    <span className="tone-text text-sm font-bold font-mono">{dept.bankFailed}</span>
                  </div>
                  <div className="tone-violet">
                    <span className="cc-muted text-[9px] uppercase font-bold block">Review</span>
                    <span className="tone-text text-sm font-bold font-mono">{dept.manualReview}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedDepartment(dept.departmentName);
                    setActiveWorkflowLevel('department_view');
                  }}
                  className={`cc-btn w-full ${selectedDepartment === dept.departmentName ? 'cc-btn-primary' : 'cc-btn-secondary'}`}
                >
                  <User className="w-3.5 h-3.5" />
                  <span>View Employees</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* 5. DEPARTMENT EMPLOYEE / CANDIDATE TABLE (Contextual Search + Inspect)     */}
      {/* ========================================================================= */}
      {activeWorkflowLevel !== 'inspect' && (
        <section className={`rounded-xl border shadow-xs overflow-hidden transition-colors ${
          isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-2xs'
        }`}>
          {/* Table Header & Scoped Search */}
          <div className={`p-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
            isDark ? 'border-slate-800 bg-slate-950/60' : 'border-slate-200 bg-slate-50/70'
          }`}>
            <div>
              <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Candidate & Employee Verification Registry
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Showing {filteredCandidates.length} candidate(s) for {selectedClient === 'all' ? 'All Clients' : selectedClient} 
                {selectedDepartment !== 'all' ? ` › ${selectedDepartment}` : ''}
              </p>
            </div>

            {/* Contextual Search strictly inside selected client/department */}
            <div className="relative min-w-[260px]">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search candidates within scope..."
                value={internalCandidateSearch}
                onChange={(e) => setInternalCandidateSearch(e.target.value)}
                className={`w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium ${
                  isDark ? 'bg-slate-900 border-slate-750 text-slate-100 placeholder:text-slate-500' : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400'
                }`}
              />
            </div>
          </div>

          {/* Table Content */}
          <div className="overflow-x-auto">
            <table className={`w-full text-left text-xs ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              <thead className={`text-[10px] uppercase tracking-wider font-semibold border-b ${
                isDark ? 'bg-slate-950 text-slate-400 border-slate-800' : 'bg-slate-50 text-slate-500 border-slate-200'
              }`}>
                <tr>
                  <th className="px-4 py-3">Candidate / Employee</th>
                  <th className="px-4 py-3">ID / Emp Code</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">Job Role</th>
                  <th className="px-3 py-3 text-center">Aadhaar</th>
                  <th className="px-3 py-3 text-center">PAN</th>
                  <th className="px-3 py-3 text-center">Bank / ₹1</th>
                  <th className="px-3 py-3 text-center">UAN</th>
                  <th className="px-4 py-3">Overall KYC</th>
                  <th className="px-4 py-3">Last Updated</th>
                  <th className="px-4 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className={`divide-y text-xs ${isDark ? 'divide-slate-800' : 'divide-slate-100'}`}>
                {filteredCandidates.map((c) => {
                  const aadhaarRec = c.kycRecords.find((r) => r.documentType === 'Aadhaar');
                  const panRec = c.kycRecords.find((r) => r.documentType === 'PAN');
                  const bankRec = c.kycRecords.find((r) => r.documentType === 'Bank');
                  const uanRec = c.kycRecords.find((r) => r.documentType === 'UAN');

                  return (
                    <tr 
                      key={c.id} 
                      className={`transition-colors ${
                        isDark ? 'hover:bg-slate-800/40' : 'hover:bg-slate-50'
                      }`}
                    >
                      {/* Name */}
                      <td className="px-4 py-3 font-semibold">
                        <div className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {c.firstName} {c.lastName}
                        </div>
                        <div className="text-[11px] text-slate-500">{c.clientName}</div>
                      </td>

                      {/* Code */}
                      <td className="px-4 py-3 font-mono text-[11px] font-bold text-sky-500">
                        {c.userId}
                      </td>

                      {/* Department */}
                      <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-300">
                        {c.department || 'General Operations'}
                      </td>

                      {/* Designation */}
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                        {c.designation}
                      </td>

                      {/* Aadhaar Badge */}
                      <td className="px-3 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          aadhaarRec?.status === 'Verified'
                            ? (isDark ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-emerald-50 text-emerald-700 border border-emerald-200')
                            : aadhaarRec?.status === 'Pending Manual Review'
                            ? (isDark ? 'bg-amber-950 text-amber-300 border border-amber-800' : 'bg-amber-50 text-amber-700 border border-amber-200')
                            : (isDark ? 'bg-rose-950 text-rose-300 border border-rose-800' : 'bg-rose-50 text-rose-700 border border-rose-200')
                        }`}>
                          {aadhaarRec?.status === 'Verified' ? '✓ Verified' : aadhaarRec?.status || 'Missing'}
                        </span>
                      </td>

                      {/* PAN Badge */}
                      <td className="px-3 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          panRec?.status === 'Verified'
                            ? (isDark ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-emerald-50 text-emerald-700 border border-emerald-200')
                            : panRec?.status === 'Pending Manual Review'
                            ? (isDark ? 'bg-amber-950 text-amber-300 border border-amber-800' : 'bg-amber-50 text-amber-700 border border-amber-200')
                            : (isDark ? 'bg-rose-950 text-rose-300 border border-rose-800' : 'bg-rose-50 text-rose-700 border border-rose-200')
                        }`}>
                          {panRec?.status === 'Verified' ? '✓ Verified' : panRec?.status || 'Missing'}
                        </span>
                      </td>

                      {/* Bank / ₹1 Penny Badge */}
                      <td className="px-3 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          c.pennyTestStatus === 'Verified'
                            ? (isDark ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-emerald-50 text-emerald-700 border border-emerald-200')
                            : c.pennyTestStatus === 'Failed'
                            ? (isDark ? 'bg-rose-950 text-rose-300 border border-rose-800' : 'bg-rose-50 text-rose-700 border border-rose-200')
                            : (isDark ? 'bg-amber-950 text-amber-300 border border-amber-800' : 'bg-amber-50 text-amber-700 border border-amber-200')
                        }`}>
                          ₹1 {c.pennyTestStatus}
                        </span>
                      </td>

                      {/* UAN Badge */}
                      <td className="px-3 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          uanRec?.status === 'Verified'
                            ? (isDark ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-emerald-50 text-emerald-700 border border-emerald-200')
                            : (isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-600')
                        }`}>
                          {uanRec?.status || 'N/A'}
                        </span>
                      </td>

                      {/* Overall KYC */}
                      <td className="px-4 py-3">
                        <StatusBadge type="kyc" status={c.overallKycStatus} size="sm" />
                      </td>

                      {/* Last updated */}
                      <td className="px-4 py-3 text-slate-500 font-mono text-[11px]">
                        {aadhaarRec?.lastUpdated || 'Recent'}
                      </td>

                      {/* Action: Inspect */}
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleInspectCandidate(c)}
                          className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg font-bold text-xs shadow-xs transition-colors inline-flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Inspect</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {filteredCandidates.length === 0 && (
              <div className="p-8 text-center text-slate-500 text-xs">
                <p className="font-semibold text-slate-700 dark:text-slate-300">No candidates match your current filter selections.</p>
                <p className="text-[11px] text-slate-400 mt-1">Try resetting the department or status filter above.</p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* 6. INDIVIDUAL CANDIDATE INSPECTION VIEW (Level 4)                         */}
      {/* ========================================================================= */}
      {activeWorkflowLevel === 'inspect' && (
        <section className="space-y-4">
          {/* Candidate Profile Strip */}
          <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
            isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 shadow-2xs text-slate-900'
          }`}>
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-sky-600 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                {inspectedCandidate.firstName[0]}{inspectedCandidate.lastName[0]}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {inspectedCandidate.firstName} {inspectedCandidate.lastName}
                  </h2>
                  <span className={`font-mono text-xs px-2 py-0.5 rounded font-semibold border ${
                    isDark ? 'bg-slate-800 text-sky-400 border-slate-700' : 'bg-slate-100 text-slate-700 border-slate-200'
                  }`}>
                    {inspectedCandidate.userId}
                  </span>
                </div>
                <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {inspectedCandidate.designation} · <strong className={isDark ? 'text-slate-200' : 'text-slate-800'}>{inspectedCandidate.clientName}</strong> · Deputation Joining: <span className="font-mono">{inspectedCandidate.dateOfJoining}</span>
                </p>
              </div>
            </div>

            <div className={`flex items-center gap-3 border-t sm:border-t-0 pt-3 sm:pt-0 ${
              isDark ? 'border-slate-800' : 'border-slate-100'
            }`}>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Overall KYC</span>
                <StatusBadge type="kyc" status={inspectedCandidate.overallKycStatus} size="md" />
              </div>
              <div className={`text-right pl-3 border-l ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">₹1 Penny Test</span>
                <StatusBadge type="penny" status={inspectedCandidate.pennyTestStatus} size="md" />
              </div>
            </div>
          </div>

          {/* 4 Separate Verification Cards (Aadhaar, PAN, Bank, UAN) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {inspectedCandidate.kycRecords.map((record) => {
              const isPending = record.status === 'Pending Manual Review' || record.status === 'API Mismatch';
              const isVerified = record.status === 'Verified';
              const isRejected = record.status === 'Rejected';

              return (
                <div
                  key={record.id}
                  className={`rounded-xl border transition-all duration-200 overflow-hidden flex flex-col justify-between ${
                    isDark 
                      ? isPending
                        ? 'bg-slate-900 border-amber-600/70'
                        : isRejected
                        ? 'bg-slate-900 border-rose-600/70'
                        : 'bg-slate-900 border-slate-800'
                      : isPending
                      ? 'bg-white border-amber-300 ring-1 ring-amber-100 shadow-2xs'
                      : isRejected
                      ? 'bg-white border-rose-300 shadow-2xs'
                      : 'bg-white border-slate-200 shadow-2xs'
                  }`}
                >
                  {/* Card Header: Type, Document Number, KYC Status */}
                  <div className={`p-4 border-b ${
                    isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50/70 border-slate-100'
                  }`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                            record.documentType === 'Aadhaar'
                              ? 'bg-orange-500/20 text-orange-500'
                              : record.documentType === 'PAN'
                              ? 'bg-blue-500/20 text-blue-500'
                              : record.documentType === 'Bank'
                              ? 'bg-emerald-500/20 text-emerald-500'
                              : 'bg-purple-500/20 text-purple-500'
                          }`}
                        >
                          {record.documentType[0]}
                        </div>
                        <div>
                          <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            {record.documentType === 'Bank' ? 'Bank Verification / ₹1 Verification' : `${record.documentType} Verification`}
                          </h3>
                          <p className="font-mono text-[11px] text-slate-500 font-medium">
                            {record.documentNumber}
                          </p>
                        </div>
                      </div>

                      <StatusBadge type="kyc" status={record.status} size="sm" />
                    </div>
                  </div>

                  {/* Side-by-Side Comparison: Live API return vs. Candidate Uploaded Values */}
                  <div className="p-4 space-y-3.5 text-xs">
                    <div className="grid grid-cols-2 gap-3">
                      {/* Left: API Source Data */}
                      <div className={`p-2.5 rounded-lg border ${
                        isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                      }`}>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                          Live API Authority Pull
                        </span>
                        <div className="space-y-1">
                          <p className={`font-semibold font-mono text-[11px] ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                            {record.nameInApi}
                          </p>
                          <p className="text-[10px] text-slate-500">
                            Identifier: <span className="font-mono font-medium">{record.apiSearchValue}</span>
                          </p>
                        </div>
                      </div>

                      {/* Right: Candidate Submitted Data */}
                      <div className={`p-2.5 rounded-lg border ${
                        isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                      }`}>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                          Candidate Submitted Data
                        </span>
                        <div className="space-y-1">
                          <p className={`font-semibold font-mono text-[11px] ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                            {record.candidateSubmittedValue || record.nameInSystem}
                          </p>
                          <p className="text-[10px] text-slate-500">
                            Doc: <span className="font-mono font-medium">{record.documentFileName || 'Uploaded'}</span>
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Match Score Indicator */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-600 dark:text-slate-400">Identity Match Score:</span>
                        <span className={`font-mono font-bold ${
                          record.matchPercentage >= 95 ? 'text-emerald-500' : 'text-amber-500'
                        }`}>
                          {record.matchPercentage}% Confirmed
                        </span>
                      </div>
                      <div className={`w-full h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
                        <div 
                          className={`h-full transition-all duration-300 ${
                            record.matchPercentage >= 95 ? 'bg-emerald-500' : 'bg-amber-500'
                          }`}
                          style={{ width: `${record.matchPercentage}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Action Strip on Card */}
                  <div className={`p-3 border-t flex items-center justify-between gap-2 ${
                    isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-100'
                  }`}>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenDocViewer(record, 'view')}
                        className={`px-2.5 py-1 text-xs font-semibold rounded-md border flex items-center gap-1 transition-colors ${
                          isDark 
                            ? 'bg-slate-900 hover:bg-slate-800 border-slate-750 text-slate-200' 
                            : 'bg-white hover:bg-slate-50 border-slate-300 text-slate-700 shadow-2xs'
                        }`}
                      >
                        <Eye className="w-3.5 h-3.5 text-sky-500" />
                        <span>View Document</span>
                      </button>

                      <button
                        onClick={() => handleRecheck(record)}
                        className={`px-2 py-1 text-xs font-semibold rounded-md border flex items-center gap-1 transition-colors ${
                          isDark 
                            ? 'bg-slate-900 hover:bg-slate-800 border-slate-750 text-slate-300' 
                            : 'bg-white hover:bg-slate-50 border-slate-300 text-slate-600 shadow-2xs'
                        }`}
                        title="Instant API Recheck"
                      >
                        <RefreshCw className="w-3.5 h-3.5 text-sky-500" />
                        <span>Recheck</span>
                      </button>

                      <button
                        onClick={() => setSelectedRecordForApiDetails(record)}
                        className={`p-1.5 rounded-md border transition-colors ${
                          isDark 
                            ? 'bg-slate-900 hover:bg-slate-800 border-slate-750 text-slate-400 hover:text-white' 
                            : 'bg-white hover:bg-slate-50 border-slate-300 text-slate-500 hover:text-slate-800 shadow-2xs'
                        }`}
                        title="View Full API Payload JSON"
                      >
                        <Code className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Decision Buttons */}
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenDocViewer(record, 'reject')}
                        className={`px-2.5 py-1 text-xs font-semibold rounded-md border transition-colors ${
                          isDark 
                            ? 'bg-rose-950/60 hover:bg-rose-900/70 border-rose-800 text-rose-300' 
                            : 'bg-rose-50 hover:bg-rose-100 border-rose-200 text-rose-700'
                        }`}
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => handleOpenDocViewer(record, 'approve')}
                        className="px-3 py-1 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-md shadow-xs transition-colors"
                      >
                        Approve
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* 7. INTERACTIVE DOCUMENT VIEWER & DECISION MODAL                           */}
      {/* ========================================================================= */}
      {selectedRecordForDocView && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
          <div className={`w-full max-w-5xl h-[90vh] rounded-2xl border shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 ${
            isDark ? 'bg-slate-900 border-slate-750 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            {/* Modal Top Bar */}
            <div className={`p-4 border-b flex items-center justify-between ${
              isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-500">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Document Inspector: {selectedRecordForDocView.documentType} ({selectedRecordForDocView.documentNumber})
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Candidate: {inspectedCandidate.firstName} {inspectedCandidate.lastName} ({inspectedCandidate.userId}) · {inspectedCandidate.clientName}
                  </p>
                </div>
              </div>

              {/* Viewer Controls & Close */}
              <div className="flex items-center gap-2">
                <div className={`flex items-center border rounded-lg p-0.5 ${
                  isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-300'
                }`}>
                  <button
                    onClick={() => setZoomLevel((z) => Math.max(50, z - 25))}
                    className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <span className="px-2 text-xs font-mono font-semibold">{zoomLevel}%</span>
                  <button
                    onClick={() => setZoomLevel((z) => Math.min(200, z + 25))}
                    className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setRotation((r) => (r + 90) % 360)}
                    className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded ml-1"
                    title="Rotate 90°"
                  >
                    <RotateCw className="w-4 h-4" />
                  </button>
                </div>

                <button
                  onClick={() => setSelectedRecordForDocView(null)}
                  className={`p-1.5 rounded-lg transition-colors ${
                    isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200'
                  }`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body: Left Canvas Preview, Right Decision Pane */}
            <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
              {/* Canvas / Preview Container */}
              <div className="flex-1 bg-slate-950 p-6 flex items-center justify-center overflow-auto relative">
                <div 
                  className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full text-slate-900 transition-all duration-200 border border-slate-200"
                  style={{
                    transform: `scale(${zoomLevel / 100}) rotate(${rotation}deg)`,
                    transformOrigin: 'center center'
                  }}
                >
                  {/* Mock Physical Document Rendering */}
                  <div className="border-2 border-slate-800 rounded-lg p-5 space-y-3 font-sans">
                    <div className="flex items-center justify-between border-b pb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        GOVERNMENT OF INDIA / UIDAI / NSDL / NPCI
                      </span>
                      <span className="font-mono text-[10px] font-bold text-sky-700">VERIFIED COPY</span>
                    </div>

                    <div className="flex items-center gap-3 py-2">
                      <div className="w-16 h-16 bg-slate-200 rounded border border-slate-300 flex items-center justify-center text-slate-400 font-bold text-xs">
                        PHOTO
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-slate-900">{inspectedCandidate.firstName} {inspectedCandidate.lastName}</p>
                        <p className="font-mono text-xs text-slate-700">{selectedRecordForDocView.documentNumber}</p>
                        <p className="text-[10px] text-slate-500">DOB: 15/06/1994 · Gender: Female</p>
                      </div>
                    </div>

                    <div className="text-[10px] text-slate-600 border-t pt-2 space-y-0.5">
                      <p>Address: 42, HSR Layout, Sector 2, Bangalore, Karnataka - 560102</p>
                      <p className="font-mono text-[9px] text-slate-400">Digital Seal: SHA256: 8f9b...14e2 · UIDAI Authenticated</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Decision / Compliance Panel */}
              <div className={`w-full lg:w-80 border-t lg:border-t-0 lg:border-l p-5 flex flex-col justify-between overflow-y-auto ${
                isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="space-y-4">
                  <div>
                    <h4 className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                      Compliance Inspection Decision
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Confirm statutory eligibility or record clear rejection reason for candidate re-upload.
                    </p>
                  </div>

                  {/* Mode switcher tabs */}
                  <div className={`flex items-center border rounded-lg p-0.5 ${
                    isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-300'
                  }`}>
                    <button
                      onClick={() => setDecisionMode('approve')}
                      className={`flex-1 py-1 text-xs font-bold rounded transition-colors ${
                        decisionMode === 'approve' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-400'
                      }`}
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => setDecisionMode('reject')}
                      className={`flex-1 py-1 text-xs font-bold rounded transition-colors ${
                        decisionMode === 'reject' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-400'
                      }`}
                    >
                      Reject
                    </button>
                  </div>

                  {/* Reject Mode Form */}
                  {decisionMode === 'reject' && (
                    <div className="space-y-3 animate-in fade-in duration-150">
                      <div>
                        <label className="block text-[11px] font-bold text-rose-500 mb-1">
                          Standard Rejection Reason:
                        </label>
                        <SelectMenu
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          className={`w-full text-xs rounded-lg border p-2 font-medium ${
                            isDark ? 'bg-slate-950 border-slate-750 text-slate-100' : 'bg-white border-slate-300 text-slate-900'
                          }`}
                        >
                          <option value="Scan illegible or cropped edges">Scan illegible or cropped edges</option>
                          <option value="Name mismatch between physical card and live API">Name mismatch between physical card and live API</option>
                          <option value="Blurry document image">Blurry document image</option>
                          <option value="Wrong document type uploaded">Wrong document type uploaded</option>
                          <option value="Expired or invalidated statutory credential">Expired or invalidated statutory credential</option>
                        </SelectMenu>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-400 mb-1">
                          Candidate Action Notes (Mandatory):
                        </label>
                        <textarea
                          rows={3}
                          value={remarks}
                          onChange={(e) => setRemarks(e.target.value)}
                          placeholder="Please upload clear original color scan showing all 4 corners..."
                          className={`w-full text-xs rounded-lg border p-2.5 focus:ring-2 focus:ring-rose-500 font-medium ${
                            isDark ? 'bg-slate-950 border-slate-750 text-slate-100 placeholder:text-slate-600' : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400'
                          }`}
                        />
                      </div>
                    </div>
                  )}

                  {/* Approve Mode Form */}
                  {decisionMode === 'approve' && (
                    <div className="space-y-3 animate-in fade-in duration-150">
                      <div className={`p-3 rounded-lg border text-xs text-emerald-500 ${
                        isDark ? 'bg-emerald-950/40 border-emerald-800' : 'bg-emerald-50 border-emerald-200'
                      }`}>
                        <p className="font-bold flex items-center gap-1.5">
                          <CheckCircle className="w-4 h-4" /> Ready for Immediate Clearance
                        </p>
                        <p className={`text-[11px] mt-1 ${isDark ? 'text-emerald-300' : 'text-emerald-800'}`}>
                          All statutory credentials match NSDL/UIDAI identity registries. Clearance will mark document as verified in ATS.
                        </p>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                          Audit Trail Remarks (Optional):
                        </label>
                        <textarea
                          rows={2}
                          value={remarks}
                          onChange={(e) => setRemarks(e.target.value)}
                          placeholder="Verified against physical inspection..."
                          className={`w-full text-xs rounded-lg border p-2.5 font-medium ${
                            isDark ? 'bg-slate-950 border-slate-750 text-slate-100 placeholder:text-slate-600' : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400'
                          }`}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Final Decision Button */}
                <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                  {decisionMode === 'reject' ? (
                    <button
                      onClick={() => handleExecuteRejection(selectedRecordForDocView)}
                      className="w-full py-2.5 px-4 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-lg text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Confirm Rejection & Notify</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleExecuteApproval(selectedRecordForDocView)}
                      className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs shadow-xs transition-colors flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Approve & Clear Verification</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. API RESPONSE JSON MODAL                                                */}
      {/* ========================================================================= */}
      {selectedRecordForApiDetails && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className={`w-full max-w-xl rounded-xl border p-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150 ${
            isDark ? 'bg-slate-900 border-slate-750 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className={`flex items-center justify-between pb-3 border-b mb-3 ${
              isDark ? 'border-slate-800' : 'border-slate-200'
            }`}>
              <div className="flex items-center gap-2">
                <Code className="w-4 h-4 text-sky-500" />
                <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Raw API Payload: {selectedRecordForApiDetails.documentType}
                </h3>
              </div>
              <button
                onClick={() => setSelectedRecordForApiDetails(null)}
                className={`p-1 rounded ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <pre className={`p-3 rounded-lg font-mono text-[11px] overflow-auto max-h-72 border ${
              isDark ? 'bg-slate-950 border-slate-800 text-emerald-400' : 'bg-slate-100 border-slate-300 text-slate-800'
            }`}>
              {JSON.stringify(selectedRecordForApiDetails, null, 2)}
            </pre>

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setSelectedRecordForApiDetails(null)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg border ${
                  isDark ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-slate-100 border-slate-300 text-slate-800'
                }`}
              >
                Close Payload
              </button>
            </div>
          </div>
        </div>
      )}
      </PageBody>
    </div>
  );
};
