import React, { useState, useMemo, useRef } from 'react';
import { downloadCsv, downloadText } from '../../utils/download';
import {
  FileText,
  Send,
  CheckCircle2,
  Clock,
  AlertCircle,
  Filter,
  RotateCcw,
  Search,
  ChevronDown,
  ChevronUp,
  Download,
  Eye,
  UserCheck,
  Building2,
  MapPin,
  Calendar,
  X,
  ExternalLink,
  RefreshCw,
  SlidersHorizontal,
  Mail,
  Phone,
  ArrowUpRight,
  User,
  ArrowRight
} from 'lucide-react';
import { 
  OfferLetterCandidate, 
  OfferLetterFilterState, 
  OfferLetterStatus 
} from '../../types/offerLetter';
import { 
  MOCK_OFFER_LETTER_CANDIDATES,
  MOCK_OFFER_LETTER_CLIENTS,
  MOCK_OFFER_LETTER_LOCATIONS,
  MOCK_OFFER_LETTER_DESIGNATIONS,
  MOCK_CANDIDATE_STATUSES,
  MOCK_LETTER_GENERATION_TYPES,
  INITIAL_OFFER_LETTER_FILTERS
} from '../../data/mockOfferLetterData';
import { OfferLetterPreviewModal } from './OfferLetterPreviewModal';
import { SendOfferLetterModal } from './SendOfferLetterModal';
import { CandidatePreviewDrawer } from './CandidatePreviewDrawer';
import { OfferLetterStatusDetailDrawer } from './OfferLetterStatusDetailDrawer';
import { OfferLetterDetailDrawer } from './OfferLetterDetailDrawer';
import { Candidate } from '../../types/onboarding';
import { useTheme } from '../../hooks/useTheme';
import { useToast } from '../../hooks/useToast';
import { PageHeader } from '../../components/page/PageHeader';
import { PageBody } from '../../components/page/PageBody';
import { Toast } from '../../components/ui/Toast';
import { SelectMenu } from '../../components/ui/SelectMenu';
import { TrendBadge } from '../../components/page/TrendBadge';
import { stockTrend } from '../../utils/trends';
import { DASHBOARD_REFERENCE_DATE } from '../dashboard/dashboard.metrics';

interface OfferLetterOperationsProps {
  onOpenCandidate360?: (candidate: Candidate | string) => void;
  onShowToast?: (message: string) => void;
  fullCandidateList?: Candidate[];
}

/** Compact icon-only row action: fixed 32px square with a hover / focus tooltip. */
const ActionIconButton: React.FC<{
  label: string;
  onClick: () => void;
  className?: string;
  children: React.ReactNode;
}> = ({ label, onClick, className = '', children }) => (
  <span className="relative group shrink-0">
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`w-8 h-8 flex items-center justify-center rounded-lg border border-transparent text-slate-500 dark:text-slate-400 hover:border-[color:var(--cc-card-border)] hover:bg-[color:var(--cc-row-hover)] hover:text-slate-900 dark:hover:text-white transition-colors focus-visible:outline-2 focus-visible:outline-sky-500 ${className}`}
    >
      {children}
    </button>
    <span
      role="tooltip"
      className="pointer-events-none absolute bottom-full right-0 mb-1.5 z-30 whitespace-nowrap rounded-md bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-2 py-1 text-[11px] font-semibold opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity shadow-lg"
    >
      {label}
    </span>
  </span>
);

export const OfferLetterOperations: React.FC<OfferLetterOperationsProps> = ({
  onOpenCandidate360,
  onShowToast,
  fullCandidateList = [],
}) => {
  const { isDark } = useTheme();

  // Local state of candidates (allows updating after send / resend)
  const [candidates, setCandidates] = useState<OfferLetterCandidate[]>(MOCK_OFFER_LETTER_CANDIDATES);

  // Filter state
  const [filters, setFilters] = useState<OfferLetterFilterState>(INITIAL_OFFER_LETTER_FILTERS);

  // Accordion toggle states
  const [isMoreFiltersOpen, setIsMoreFiltersOpen] = useState(false);

  // Modals and drawers
  const [previewLetterCandidate, setPreviewLetterCandidate] = useState<OfferLetterCandidate | null>(null);
  const [sendLetterCandidate, setSendLetterCandidate] = useState<OfferLetterCandidate | null>(null);
  const [previewCandidateDrawer, setPreviewCandidateDrawer] = useState<Candidate | null>(null);
  const [statusDrawerStatus, setStatusDrawerStatus] = useState<OfferLetterStatus | null>(null);
  const [selectedCandidateForDetails, setSelectedCandidateForDetails] = useState<OfferLetterCandidate | null>(null);
  const [detailsSourceTitle, setDetailsSourceTitle] = useState<string>('Offer Letter List');
  const { message: toastMessage, showToast } = useToast(3000);

  // Table ref for smooth scrolling
  const tableRef = useRef<HTMLDivElement>(null);

  const notify = (msg: string) => {
    if (onShowToast) {
      onShowToast(msg);
    } else {
      showToast(msg);
    }
  };

  // ---------------------------------------------------------------------------
  // SUMMARY COUNTS
  // ---------------------------------------------------------------------------
  const counts = useMemo(() => {
    const notSent = candidates.filter((c) => c.offerLetterStatus === 'Not Sent' || c.offerLetterStatus === 'Pending').length;
    const sent = candidates.filter((c) => c.offerLetterStatus === 'Sent').length;
    const signed = candidates.filter((c) => c.offerLetterStatus === 'Signed').length;
    const sentNotSigned = candidates.filter((c) => c.offerLetterStatus === 'Sent But Not Signed').length;
    const total = candidates.length;
    return { notSent, sent, signed, sentNotSigned, total };
  }, [candidates]);

  // ---------------------------------------------------------------------------
  // FILTERING LOGIC
  // ---------------------------------------------------------------------------
  const filteredCandidates = useMemo(() => {
    return candidates.filter((c) => {
      // Status Card filter
      if (filters.statusCardFilter !== 'All') {
        if (filters.statusCardFilter === 'Not Sent' && (c.offerLetterStatus !== 'Not Sent' && c.offerLetterStatus !== 'Pending')) return false;
        if (filters.statusCardFilter === 'Sent' && c.offerLetterStatus !== 'Sent') return false;
        if (filters.statusCardFilter === 'Signed' && c.offerLetterStatus !== 'Signed') return false;
        if (filters.statusCardFilter === 'Sent But Not Signed' && c.offerLetterStatus !== 'Sent But Not Signed') return false;
      }

      // Primary Filters
      if (filters.client && filters.client !== 'All Clients' && c.client !== filters.client) return false;
      if (filters.location && filters.location !== 'All Locations' && c.location !== filters.location) return false;
      if (filters.designation && filters.designation !== 'All Designations' && c.designation !== filters.designation) return false;
      if (filters.candidateStatus && filters.candidateStatus !== 'All Statuses' && c.candidateStatus !== filters.candidateStatus) return false;
      if (filters.letterGenerationType && filters.letterGenerationType !== 'All Generation Types' && c.letterGenerationType !== filters.letterGenerationType) return false;

      // Date Filters
      if (filters.dojFrom && c.dateOfJoining < filters.dojFrom) return false;
      if (filters.dojTo && c.dateOfJoining > filters.dojTo) return false;
      if (filters.genFrom && c.letterGeneratedDate < filters.genFrom) return false;
      if (filters.genTo && c.letterGeneratedDate > filters.genTo) return false;
      if (filters.sentFrom && (!c.letterSentDate || c.letterSentDate < filters.sentFrom)) return false;
      if (filters.sentTo && (!c.letterSentDate || c.letterSentDate > filters.sentTo)) return false;
      if (filters.acceptFrom && (!c.letterAcceptanceDate || c.letterAcceptanceDate < filters.acceptFrom)) return false;
      if (filters.acceptTo && (!c.letterAcceptanceDate || c.letterAcceptanceDate > filters.acceptTo)) return false;

      // Advanced Filters
      if (filters.bankVerification && filters.bankVerification !== 'All' && c.bankVerificationStatus !== filters.bankVerification) return false;
      if (filters.contractEndFrom && (!c.endOfContract || c.endOfContract < filters.contractEndFrom)) return false;
      if (filters.contractEndTo && (!c.endOfContract || c.endOfContract > filters.contractEndTo)) return false;
      if (filters.aadhaarStatus && filters.aadhaarStatus !== 'All' && c.aadhaarKycStatus !== filters.aadhaarStatus) return false;
      if (filters.panStatus && filters.panStatus !== 'All' && c.panKycStatus !== filters.panStatus) return false;
      if (filters.bankStatus && filters.bankStatus !== 'All' && c.bankKycStatus !== filters.bankStatus) return false;
      if (filters.uanStatus && filters.uanStatus !== 'All' && c.uanKycStatus !== filters.uanStatus) return false;
      if (filters.showOnlyMyCandidates && !c.isMyCandidate) return false;

      // Search Query (Email, Contact, Aadhaar, PAN, Employee Code, Name)
      if (filters.searchQuery.trim()) {
        const q = filters.searchQuery.toLowerCase().trim();
        const matchesName = c.candidateName.toLowerCase().includes(q);
        const matchesCode = c.candidateCode.toLowerCase().includes(q);
        const matchesEmail = c.email.toLowerCase().includes(q);
        const matchesPhone = c.phone.toLowerCase().includes(q);
        const matchesClient = c.client.toLowerCase().includes(q);
        const matchesDesignation = c.designation.toLowerCase().includes(q);
        if (!matchesName && !matchesCode && !matchesEmail && !matchesPhone && !matchesClient && !matchesDesignation) {
          return false;
        }
      }

      return true;
    });
  }, [candidates, filters]);

  // Active filter chip helpers
  const activeChips = useMemo(() => {
    const list: { key: keyof OfferLetterFilterState; label: string; value: string }[] = [];
    if (filters.statusCardFilter !== 'All') {
      list.push({ key: 'statusCardFilter', label: 'Status Card', value: filters.statusCardFilter });
    }
    if (filters.client && filters.client !== 'All Clients') {
      list.push({ key: 'client', label: 'Client', value: filters.client });
    }
    if (filters.location && filters.location !== 'All Locations') {
      list.push({ key: 'location', label: 'Location', value: filters.location });
    }
    if (filters.designation && filters.designation !== 'All Designations') {
      list.push({ key: 'designation', label: 'Designation', value: filters.designation });
    }
    if (filters.candidateStatus && filters.candidateStatus !== 'All Statuses') {
      list.push({ key: 'candidateStatus', label: 'Candidate Status', value: filters.candidateStatus });
    }
    if (filters.letterGenerationType && filters.letterGenerationType !== 'All Generation Types') {
      list.push({ key: 'letterGenerationType', label: 'Generation Type', value: filters.letterGenerationType });
    }
    if (filters.dojFrom || filters.dojTo) {
      list.push({ key: 'dojFrom', label: 'DOJ Range', value: `${filters.dojFrom || 'Start'} to ${filters.dojTo || 'End'}` });
    }
    if (filters.genFrom || filters.genTo) {
      list.push({ key: 'genFrom', label: 'Gen Date', value: `${filters.genFrom || 'Start'} to ${filters.genTo || 'End'}` });
    }
    if (filters.sentFrom || filters.sentTo) {
      list.push({ key: 'sentFrom', label: 'Sent Date', value: `${filters.sentFrom || 'Start'} to ${filters.sentTo || 'End'}` });
    }
    if (filters.acceptFrom || filters.acceptTo) {
      list.push({ key: 'acceptFrom', label: 'Accept Date', value: `${filters.acceptFrom || 'Start'} to ${filters.acceptTo || 'End'}` });
    }
    if (filters.bankVerification && filters.bankVerification !== 'All') {
      list.push({ key: 'bankVerification', label: 'Bank Verification', value: filters.bankVerification });
    }
    if (filters.aadhaarStatus && filters.aadhaarStatus !== 'All') {
      list.push({ key: 'aadhaarStatus', label: 'Aadhaar KYC', value: filters.aadhaarStatus });
    }
    if (filters.panStatus && filters.panStatus !== 'All') {
      list.push({ key: 'panStatus', label: 'PAN KYC', value: filters.panStatus });
    }
    if (filters.bankStatus && filters.bankStatus !== 'All') {
      list.push({ key: 'bankStatus', label: 'Bank KYC', value: filters.bankStatus });
    }
    if (filters.uanStatus && filters.uanStatus !== 'All') {
      list.push({ key: 'uanStatus', label: 'UAN KYC', value: filters.uanStatus });
    }
    if (filters.showOnlyMyCandidates) {
      list.push({ key: 'showOnlyMyCandidates', label: 'Scope', value: 'My Candidates Only' });
    }
    if (filters.searchQuery.trim()) {
      list.push({ key: 'searchQuery', label: 'Search', value: filters.searchQuery.trim() });
    }
    return list;
  }, [filters]);

  const handleRemoveChip = (key: keyof OfferLetterFilterState) => {
    setFilters((prev) => {
      if (key === 'statusCardFilter') return { ...prev, statusCardFilter: 'All' };
      if (key === 'showOnlyMyCandidates') return { ...prev, showOnlyMyCandidates: false };
      if (key === 'dojFrom') return { ...prev, dojFrom: '', dojTo: '' };
      if (key === 'genFrom') return { ...prev, genFrom: '', genTo: '' };
      if (key === 'sentFrom') return { ...prev, sentFrom: '', sentTo: '' };
      if (key === 'acceptFrom') return { ...prev, acceptFrom: '', acceptTo: '' };
      return { ...prev, [key]: '' };
    });
  };

  const handleResetFilters = () => {
    setFilters(INITIAL_OFFER_LETTER_FILTERS);
    notify('Filters reset to default.');
  };

  // Status badge styler
  const renderStatusBadge = (status: OfferLetterStatus) => {
    switch (status) {
      case 'Signed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
            <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
            Signed
          </span>
        );
      case 'Sent But Not Signed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
            <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
            Sent But Not Signed
          </span>
        );
      case 'Sent':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-sky-100 text-sky-800 dark:bg-sky-950/80 dark:text-sky-300 border border-sky-300 dark:border-sky-700">
            <Send className="w-3 h-3 text-sky-600 dark:text-sky-400" />
            Sent
          </span>
        );
      case 'Not Sent':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-300 dark:border-rose-700">
            <AlertCircle className="w-3 h-3 text-rose-600 dark:text-rose-400" />
            Not Sent
          </span>
        );
      case 'Pending':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
            <Clock className="w-3 h-3 text-slate-500" />
            Pending
          </span>
        );
    }
  };

  // Open Offer Letter candidate details in the foreground drawer
  const handleOpenOfferLetterDetails = (c: OfferLetterCandidate, sourceTitle: string = 'Offer Letter List') => {
    setSelectedCandidateForDetails(c);
    setDetailsSourceTitle(sourceTitle);
  };

  // Open Candidate 360 with exact matching candidate data (no cross-person mismatch)
  const handleOpenCandidate360WithExactData = (candidateCode: string) => {
    const candidate = candidates.find((c) => c.candidateCode === candidateCode);
    if (!candidate) return;

    // Synthesize full candidate object strictly from this candidate's verified data
    const synthesized: Candidate = {
      id: candidate.id,
      userId: candidate.candidateCode,
      firstName: candidate.candidateName.split(' ')[0],
      lastName: candidate.candidateName.split(' ').slice(1).join(' ') || '',
      email: candidate.email,
      phone: candidate.phone,
      whatsappNumber: candidate.phone,
      emergencyContact: 'Not Provided',
      clientId: candidate.clientId,
      clientName: candidate.client,
      designation: candidate.designation,
      department: candidate.department,
      workLocation: candidate.location,
      dateOfInterview: '2026-09-15',
      dateOfJoining: candidate.dateOfJoining,
      endOfContract: candidate.endOfContract || undefined,
      grossSalaryMonthly: candidate.grossSalaryMonthly,
      source: 'Naukri',
      recruiterName: candidate.isMyCandidate ? 'Current User' : 'Talent Acquisition Team',
      recruiterEmail: 'recruitment@2coms.com',
      registrationDate: candidate.letterGeneratedDate,
      joiningStatus: candidate.candidateStatus as any,
      pennyTestStatus: candidate.bankVerificationStatus === 'Verified' ? 'Verified' : 'Pending',
      onboardingCompletionPct: candidate.offerLetterStatus === 'Signed' ? 100 : 70,
      overallKycStatus: candidate.aadhaarKycStatus as any,
      kycRecords: [
        {
          id: 'k1',
          documentType: 'Aadhaar',
          documentNumber: 'XXXX-XXXX-8921',
          apiSearchValue: '892183921829',
          nameInSystem: candidate.candidateName,
          nameInApi: candidate.candidateName.toUpperCase(),
          matchPercentage: candidate.aadhaarKycStatus === 'Verified' ? 100 : 75,
          status: candidate.aadhaarKycStatus as any,
          lastUpdated: candidate.letterGeneratedDate,
          auditTrail: []
        },
        {
          id: 'k2',
          documentType: 'PAN',
          documentNumber: 'ABCPS8921D',
          apiSearchValue: 'ABCPS8921D',
          nameInSystem: candidate.candidateName,
          nameInApi: candidate.candidateName.toUpperCase(),
          matchPercentage: 100,
          status: candidate.panKycStatus as any,
          lastUpdated: candidate.letterGeneratedDate,
          auditTrail: []
        }
      ],
      bankName: 'HDFC Bank',
      accountNumber: '50100291049281',
      ifscCode: 'HDFC0000029',
      branchName: `${candidate.location} Main`,
      accountHolderName: candidate.candidateName,
      gender: 'Male',
      dob: '1996-05-12',
      bloodGroup: 'O+',
      maritalStatus: 'Single',
      highestQualification: 'Graduate / Professional',
      fatherName: 'Not Provided',
      motherName: 'Not Provided',
      currentAddress: `${candidate.location}, India`,
      permanentAddress: `${candidate.location}, India`,
      documents: [],
      letters: [
        {
          id: 'let-ol',
          title: `Offer Letter - ${candidate.client}`,
          issuedDate: candidate.letterGeneratedDate,
          status: candidate.offerLetterStatus === 'Signed' ? 'Accepted' : 'Pending Acceptance'
        }
      ],
      missingFields: candidate.blockingIssue !== 'None' ? [candidate.blockingIssue] : []
    };

    if (onOpenCandidate360) {
      onOpenCandidate360(synthesized);
    }
  };

  // Actions execution
  const handleSendSuccess = (candidateId: string, channel: 'Email & WhatsApp' | 'Email' | 'WhatsApp') => {
    setCandidates((prev) =>
      prev.map((c) =>
        c.id === candidateId
          ? {
              ...c,
              offerLetterStatus: 'Sent',
              letterSentDate: new Date().toISOString().split('T')[0],
              sentChannel: channel,
              blockingIssue: 'None'
            }
          : c
      )
    );
    notify(`Offer Letter dispatched successfully via ${channel}!`);
  };

  const handleDownloadPdf = (c: OfferLetterCandidate) => {
    notify(`Downloading official Offer Letter PDF for ${c.candidateName} (${c.candidateCode})...`);
    // Simulated instant trigger
    downloadText(
      `2COMS CONSULTING PVT LTD - FORMAL OFFER LETTER\n\nCandidate: ${c.candidateName}\nCode: ${c.candidateCode}\nClient: ${c.client}\nDesignation: ${c.designation}\nGross Salary: ₹${c.grossSalaryMonthly}/mo\nAnnual CTC: ₹${c.annualCtc}\nDate of Joining: ${c.dateOfJoining}\nStatus: ${c.offerLetterStatus}`,
      `Offer_Letter_${c.candidateCode}_${c.candidateName.replace(/\s+/g, '_')}.txt`,
      'text/plain'
    );
  };

  const handleExportCsv = () => {
    const headers = [
      'Candidate Name',
      'Candidate Code',
      'Client',
      'Location',
      'Designation',
      'Candidate Status',
      'Date of Joining',
      'Generation Type',
      'Generated Date',
      'Sent Date',
      'Acceptance Date',
      'Offer Letter Status',
      'Gross Monthly',
      'Annual CTC',
      'Blocking Issue'
    ];
    const rows = filteredCandidates.map((c) => [
      `"${c.candidateName}"`,
      `"${c.candidateCode}"`,
      `"${c.client}"`,
      `"${c.location}"`,
      `"${c.designation}"`,
      `"${c.candidateStatus}"`,
      `"${c.dateOfJoining}"`,
      `"${c.letterGenerationType}"`,
      `"${c.letterGeneratedDate}"`,
      `"${c.letterSentDate || 'Not Sent'}"`,
      `"${c.letterAcceptanceDate || 'Pending'}"`,
      `"${c.offerLetterStatus}"`,
      c.grossSalaryMonthly,
      c.annualCtc,
      `"${c.blockingIssue}"`
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    downloadCsv(csvContent, `Offer_Letter_Operations_Report_${new Date().toISOString().split('T')[0]}.csv`);
    notify(`Exported ${filteredCandidates.length} offer letter records to CSV.`);
  };

  // ---------------------------------------------------------------------------
  // PAGE UI HELPERS
  // ---------------------------------------------------------------------------
  const filterLabelClass = 'block text-[10px] font-bold uppercase tracking-wider cc-muted mb-1';
  const filterControlClass = `w-full px-2.5 py-1.5 text-xs rounded-lg border focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500 ${
    isDark ? 'bg-slate-950 border-slate-700 text-slate-200' : 'bg-white border-slate-300 text-slate-900'
  }`;

  // "Signed", "Sent" and "Sent But Not Signed" have history via dated letter events.
  const signedTrend = stockTrend(
    candidates.filter((c) => c.offerLetterStatus === 'Signed'),
    (c) => c.letterAcceptanceDate,
    DASHBOARD_REFERENCE_DATE,
    'month',
    true
  );
  const sentTrend = stockTrend(
    candidates.filter((c) => c.offerLetterStatus === 'Sent'),
    (c) => c.letterSentDate,
    DASHBOARD_REFERENCE_DATE,
    'month',
    true
  );
  const sentNotSignedTrend = stockTrend(
    candidates.filter((c) => c.offerLetterStatus === 'Sent But Not Signed'),
    (c) => c.letterSentDate,
    DASHBOARD_REFERENCE_DATE,
    'month',
    true
  );

  const summaryCards: Array<{
    key: OfferLetterStatus;
    label: string;
    description: string;
    count: number;
    tone: 'bad' | 'info' | 'good' | 'warn';
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    { key: 'Not Sent', label: 'Offer Letter Not Sent', description: 'Generated or drafted but not yet dispatched to the candidate', count: counts.notSent, tone: 'bad', icon: AlertCircle },
    { key: 'Sent', label: 'Offer Letter Sent', description: 'Dispatched via email and WhatsApp link for review', count: counts.sent, tone: 'info', icon: Send },
    { key: 'Signed', label: 'Offer Letter Signed', description: 'Digitally accepted and signed with formal employment acceptance', count: counts.signed, tone: 'good', icon: CheckCircle2 },
    { key: 'Sent But Not Signed', label: 'Sent But Not Signed', description: 'Delivered to candidate; digital acceptance and signature pending', count: counts.sentNotSigned, tone: 'warn', icon: Clock },
  ];

  /** Click a summary card: toggle its status filter and bring the table into view. */
  const toggleStatusCard = (key: OfferLetterStatus) => {
    setFilters((prev) => ({ ...prev, statusCardFilter: prev.statusCardFilter === key ? 'All' : key }));
    setTimeout(() => {
      tableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  };

  /** Number of active filters inside the "More Filters" panel (dates + verification + contract). */
  const extraFilterCount = [
    filters.dojFrom || filters.dojTo,
    filters.genFrom || filters.genTo,
    filters.sentFrom || filters.sentTo,
    filters.acceptFrom || filters.acceptTo,
    filters.contractEndFrom || filters.contractEndTo,
    filters.bankVerification && filters.bankVerification !== 'All',
    filters.aadhaarStatus && filters.aadhaarStatus !== 'All',
    filters.panStatus && filters.panStatus !== 'All',
    filters.bankStatus && filters.bankStatus !== 'All',
    filters.uanStatus && filters.uanStatus !== 'All',
  ].filter(Boolean).length;

  /**
   * Row actions: ONE fixed-width, non-wrapping row of equal-size slots, identical for every row:
   *   [ primary (Send / Resend / Download / Approve) ] [ View ] [ Preview ] [ Download or Candidate 360 ]
   * Slots that don't apply to a letter status stay empty, so every icon lines up row to row.
   */
  const primaryActionBase =
    'w-[88px] h-8 rounded-lg text-xs font-bold flex items-center justify-center gap-1 whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500';

  const renderRowActions = (cand: OfferLetterCandidate) => {
    const status = cand.offerLetterStatus;
    const canPreview = status === 'Sent' || status === 'Signed' || status === 'Sent But Not Signed';

    let primary: React.ReactNode = null;
    if (status === 'Not Sent') {
      primary = (
        <button
          type="button"
          onClick={() => setSendLetterCandidate(cand)}
          className={`${primaryActionBase} bg-purple-600 hover:bg-purple-700 text-white shadow-2xs`}
          title="Dispatch Offer Letter to candidate"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Send</span>
        </button>
      );
    } else if (status === 'Sent') {
      primary = (
        <button
          type="button"
          onClick={() => setSendLetterCandidate(cand)}
          className={`${primaryActionBase} border border-purple-300 dark:border-purple-700 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950`}
          title="Resend link via WhatsApp or Email"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Resend</span>
        </button>
      );
    } else if (status === 'Sent But Not Signed') {
      primary = (
        <button
          type="button"
          onClick={() => setSendLetterCandidate(cand)}
          className={`${primaryActionBase} bg-amber-600 hover:bg-amber-700 text-white shadow-2xs`}
          title="Resend eSign link reminder"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Resend</span>
        </button>
      );
    } else if (status === 'Signed') {
      primary = (
        <button
          type="button"
          onClick={() => handleDownloadPdf(cand)}
          className={`${primaryActionBase} bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs`}
          title="Download Signed Letter with eSign stamp"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Download</span>
        </button>
      );
    } else if (status === 'Pending') {
      primary = (
        <button
          type="button"
          onClick={() => {
            setCandidates((prev) => prev.map((item) => (item.id === cand.id ? { ...item, offerLetterStatus: 'Not Sent' } : item)));
            notify(`Offer letter for ${cand.candidateName} approved and ready to send.`);
          }}
          className={`${primaryActionBase} bg-purple-600 hover:bg-purple-700 text-white shadow-2xs`}
          title="Approve & Generate Offer Letter"
        >
          <span>Approve</span>
        </button>
      );
    }

    // 4th slot: Download (Sent) or Candidate 360 (Signed). They never apply to the same row.
    let extra: React.ReactNode = null;
    if (status === 'Sent') {
      extra = (
        <ActionIconButton label="Download Letter PDF" onClick={() => handleDownloadPdf(cand)}>
          <Download className="w-4 h-4" />
        </ActionIconButton>
      );
    } else if (status === 'Signed' && onOpenCandidate360) {
      extra = (
        <ActionIconButton label="Open Candidate 360 Profile" onClick={() => onOpenCandidate360(cand.candidateCode)} className="text-sky-600 dark:text-sky-400">
          <ExternalLink className="w-4 h-4" />
        </ActionIconButton>
      );
    }

    return (
      <div className="flex flex-nowrap items-center justify-end gap-1.5">
        <div className="w-[88px] h-8 shrink-0">{primary}</div>
        <ActionIconButton label="View details" onClick={() => handleOpenOfferLetterDetails(cand, 'Offer Letter List')}>
          <Eye className="w-4 h-4 text-purple-500" />
        </ActionIconButton>
        {canPreview ? (
          <ActionIconButton label={status === 'Signed' ? 'View signed letter' : 'Preview letter'} onClick={() => setPreviewLetterCandidate(cand)}>
            <FileText className="w-4 h-4 text-purple-500" />
          </ActionIconButton>
        ) : (
          <span className="w-8 h-8 shrink-0" aria-hidden />
        )}
        {extra ?? <span className="w-8 h-8 shrink-0" aria-hidden />}
      </div>
    );
  };

  return (
    <div className={`flex-1 flex flex-col transition-colors duration-150 ${
      isDark ? 'text-slate-100' : 'text-slate-900'
    }`}>
      {/* Toast */}
      <Toast message={toastMessage} variant="solid" accent="purple" />

      {/* Header strip: title + description, with Export CSV beside them */}
      <PageHeader
        icon={FileText}
        title="Offer Letter Operations"
        subtitle="Generate, dispatch and track offer letters across all candidates"
        actions={
          <button
            onClick={handleExportCsv}
            type="button"
            className="px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-colors shadow-2xs bg-white border-slate-300 hover:bg-slate-100 text-slate-700 dark:bg-slate-900 dark:border-slate-700 dark:hover:bg-slate-800 dark:text-slate-200 dark:shadow-none"
            title="Export filtered records to CSV"
          >
            <Download className="w-3.5 h-3.5 text-purple-500" />
            <span>Export CSV</span>
          </button>
        }
      />

      <PageBody>

      {/* ========================================================================= */}
      {/* STATUS OVERVIEW: four clickable cards that filter the table               */}
      {/* ========================================================================= */}
      <section aria-label="Offer letter status overview" className="cc-grid grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => {
          const active = filters.statusCardFilter === card.key;
          const Icon = card.icon;
          const share = counts.total > 0 ? Math.round((card.count / counts.total) * 100) : 0;
          return (
            <div
              key={card.key}
              role="button"
              tabIndex={0}
              aria-pressed={active}
              onClick={() => toggleStatusCard(card.key)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  toggleStatusCard(card.key);
                }
              }}
              title={`Click to filter the table by ${card.label}`}
              className={`cc-card cc-card-link tone-${card.tone} p-3 sm:p-4 flex flex-col gap-2 sm:gap-3 text-left select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 ${
                active ? 'ring-2 ring-[color:var(--tone)]' : ''
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 min-w-0">
                  <span className="tone-chip w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4" />
                  </span>
                  <span className="cc-title text-[11px] sm:text-xs font-bold leading-tight sm:truncate">{card.label}</span>
                </span>
                {active && <span className="tone-chip text-[10px] font-bold px-1.5 py-0.5 rounded-md shrink-0">Filtering</span>}
              </div>

              <div className="flex items-baseline gap-2">
                <span className="cc-title text-2xl sm:text-3xl font-bold tracking-tight leading-none tabular-nums">{card.count}</span>
                <span className="cc-muted text-[10px] sm:text-[11px]">of {counts.total}<span className="hidden sm:inline"> candidates</span></span>
              </div>

              <p className="hidden sm:block cc-muted text-[11px] leading-snug min-h-8 flex-1">{card.description}</p>

              {card.key === 'Signed' && <TrendBadge {...signedTrend} className="-mt-1" />}
              {card.key === 'Sent' && <TrendBadge {...sentTrend} className="-mt-1" />}
              {card.key === 'Sent But Not Signed' && <TrendBadge {...sentNotSignedTrend} className="-mt-1" />}

              <div className="cc-track h-1.5 rounded-full overflow-hidden mt-auto" role="progressbar" aria-valuenow={share} aria-valuemin={0} aria-valuemax={100} aria-label={`${card.label}: ${share}% of candidates`}>
                <div className="tone-fill h-full rounded-full" style={{ width: `${share}%` }} />
              </div>

              <div className="flex items-center justify-between text-[11px]">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setStatusDrawerStatus(card.key);
                  }}
                  className="tone-chip px-1.5 sm:px-2 py-1 rounded-md font-semibold text-[10px] sm:text-[11px] flex items-center gap-1 transition-colors hover:brightness-95"
                  title={`View full candidate details for ${card.label}`}
                >
                  <span>View Details</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
                <span className="hidden sm:inline cc-muted">{active ? 'Showing below' : 'Filter table'}</span>
              </div>
            </div>
          );
        })}
      </section>

      {/* ========================================================================= */}
      {/* SEARCH & FILTERS: one structured section                                  */}
      {/* ========================================================================= */}
      <section aria-label="Search and filters" className="cc-card p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 cc-accent" />
            <h2 className="cc-title text-sm font-bold">Search &amp; Filters</h2>
            <span className="cc-muted text-[11px] tabular-nums">
              {filteredCandidates.length} of {candidates.length} records
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsMoreFiltersOpen((prev) => !prev)}
              aria-expanded={isMoreFiltersOpen}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-colors ${
                isMoreFiltersOpen || extraFilterCount > 0
                  ? 'cc-accent-chip'
                  : 'border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>More Filters</span>
              {extraFilterCount > 0 && (
                <span className="px-1.5 rounded-full text-[10px] font-bold bg-sky-600 text-white tabular-nums">{extraFilterCount}</span>
              )}
              {isMoreFiltersOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>

            <button
              type="button"
              onClick={handleResetFilters}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center gap-1.5 transition-colors"
              title="Reset every filter"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Primary filters (applied instantly) */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-2.5 sm:gap-3">
          <label className="block col-span-2 lg:col-span-2">
            <span className={filterLabelClass}>Search</span>
            <span className="relative block">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Code, name, email, contact, client…"
                value={filters.searchQuery}
                onChange={(e) => setFilters((p) => ({ ...p, searchQuery: e.target.value }))}
                className={`${filterControlClass} pl-8`}
              />
            </span>
          </label>

          <label className="block">
            <span className={filterLabelClass}>Client</span>
            <SelectMenu value={filters.client} onChange={(e) => setFilters((p) => ({ ...p, client: e.target.value }))} className={filterControlClass}>
              <option value="">All Clients</option>
              {MOCK_OFFER_LETTER_CLIENTS.filter((c) => c !== 'All Clients').map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </SelectMenu>
          </label>

          <label className="block">
            <span className={filterLabelClass}>Location</span>
            <SelectMenu value={filters.location} onChange={(e) => setFilters((p) => ({ ...p, location: e.target.value }))} className={filterControlClass}>
              <option value="">All Locations</option>
              {MOCK_OFFER_LETTER_LOCATIONS.filter((l) => l !== 'All Locations').map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </SelectMenu>
          </label>

          <label className="block">
            <span className={filterLabelClass}>Designation</span>
            <SelectMenu value={filters.designation} onChange={(e) => setFilters((p) => ({ ...p, designation: e.target.value }))} className={filterControlClass}>
              <option value="">All Designations</option>
              {MOCK_OFFER_LETTER_DESIGNATIONS.filter((d) => d !== 'All Designations').map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </SelectMenu>
          </label>

          <label className="block">
            <span className={filterLabelClass}>Candidate status</span>
            <SelectMenu value={filters.candidateStatus} onChange={(e) => setFilters((p) => ({ ...p, candidateStatus: e.target.value }))} className={filterControlClass}>
              <option value="">All Candidate Statuses</option>
              {MOCK_CANDIDATE_STATUSES.filter((s) => s !== 'All Statuses').map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </SelectMenu>
          </label>

          <label className="block">
            <span className={filterLabelClass}>Letter generation</span>
            <SelectMenu value={filters.letterGenerationType} onChange={(e) => setFilters((p) => ({ ...p, letterGenerationType: e.target.value }))} className={filterControlClass}>
              <option value="">All Generation Types</option>
              {MOCK_LETTER_GENERATION_TYPES.filter((g) => g !== 'All Generation Types').map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </SelectMenu>
          </label>

          <label className="flex items-end pb-1.5 gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer select-none max-sm:col-span-2 lg:col-span-2">
            <input
              type="checkbox"
              checked={filters.showOnlyMyCandidates}
              onChange={(e) => setFilters((p) => ({ ...p, showOnlyMyCandidates: e.target.checked }))}
              className="w-3.5 h-3.5 mb-0.5 rounded text-sky-600 border-slate-300 focus:ring-sky-500"
            />
            <span>Show my candidates only</span>
          </label>
        </div>

        {/* 1. Expandable Date Filters Section */}
        {isMoreFiltersOpen && (
          <div className={`p-3.5 rounded-xl border grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs animate-in fade-in duration-150 ${
            isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <p className="col-span-full text-[11px] font-bold cc-title flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 cc-accent" />Date filters</p>
            {/* DOJ Range */}
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                Date of Joining (From / To)
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                <input
                  type="date"
                  value={filters.dojFrom}
                  onChange={(e) => setFilters((p) => ({ ...p, dojFrom: e.target.value }))}
                  className={`w-full px-2 py-1 rounded border text-xs ${
                    isDark ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
                <input
                  type="date"
                  value={filters.dojTo}
                  onChange={(e) => setFilters((p) => ({ ...p, dojTo: e.target.value }))}
                  className={`w-full px-2 py-1 rounded border text-xs ${
                    isDark ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>
            </div>

            {/* Generated Date Range */}
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                Letter Generated Date (From / To)
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                <input
                  type="date"
                  value={filters.genFrom}
                  onChange={(e) => setFilters((p) => ({ ...p, genFrom: e.target.value }))}
                  className={`w-full px-2 py-1 rounded border text-xs ${
                    isDark ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
                <input
                  type="date"
                  value={filters.genTo}
                  onChange={(e) => setFilters((p) => ({ ...p, genTo: e.target.value }))}
                  className={`w-full px-2 py-1 rounded border text-xs ${
                    isDark ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>
            </div>

            {/* Sent Date Range */}
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                Letter Sent Date (From / To)
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                <input
                  type="date"
                  value={filters.sentFrom}
                  onChange={(e) => setFilters((p) => ({ ...p, sentFrom: e.target.value }))}
                  className={`w-full px-2 py-1 rounded border text-xs ${
                    isDark ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
                <input
                  type="date"
                  value={filters.sentTo}
                  onChange={(e) => setFilters((p) => ({ ...p, sentTo: e.target.value }))}
                  className={`w-full px-2 py-1 rounded border text-xs ${
                    isDark ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>
            </div>

            {/* Acceptance Date Range */}
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                Letter Acceptance Date (From / To)
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                <input
                  type="date"
                  value={filters.acceptFrom}
                  onChange={(e) => setFilters((p) => ({ ...p, acceptFrom: e.target.value }))}
                  className={`w-full px-2 py-1 rounded border text-xs ${
                    isDark ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
                <input
                  type="date"
                  value={filters.acceptTo}
                  onChange={(e) => setFilters((p) => ({ ...p, acceptTo: e.target.value }))}
                  className={`w-full px-2 py-1 rounded border text-xs ${
                    isDark ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>
            </div>
          </div>
        )}

        {/* 2. Expandable Advanced Candidate Filters Section */}
        {isMoreFiltersOpen && (
          <div className={`p-3.5 rounded-xl border grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 text-xs animate-in fade-in duration-150 ${
            isDark ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <p className="col-span-full text-[11px] font-bold cc-title flex items-center gap-1.5"><SlidersHorizontal className="w-3.5 h-3.5 cc-accent" />Verification &amp; contract filters</p>
            {/* Bank Verification */}
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                Bank Verification
              </label>
              <SelectMenu
                value={filters.bankVerification}
                onChange={(e) => setFilters((p) => ({ ...p, bankVerification: e.target.value }))}
                className={`w-full px-2.5 py-1.5 rounded border text-xs ${
                  isDark ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-white border-slate-300 text-slate-900'
                }`}
              >
                <option value="">All Verification Status</option>
                <option value="Verified">Verified</option>
                <option value="Pending">Pending</option>
                <option value="Failed">Failed</option>
              </SelectMenu>
            </div>

            {/* Aadhaar KYC */}
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                Aadhaar KYC Status
              </label>
              <SelectMenu
                value={filters.aadhaarStatus}
                onChange={(e) => setFilters((p) => ({ ...p, aadhaarStatus: e.target.value }))}
                className={`w-full px-2.5 py-1.5 rounded border text-xs ${
                  isDark ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-white border-slate-300 text-slate-900'
                }`}
              >
                <option value="">All Aadhaar Status</option>
                <option value="Verified">Verified</option>
                <option value="Pending Manual Review">Pending Manual Review</option>
                <option value="API Mismatch">API Mismatch</option>
                <option value="Rejected">Rejected</option>
              </SelectMenu>
            </div>

            {/* PAN KYC */}
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                PAN KYC Status
              </label>
              <SelectMenu
                value={filters.panStatus}
                onChange={(e) => setFilters((p) => ({ ...p, panStatus: e.target.value }))}
                className={`w-full px-2.5 py-1.5 rounded border text-xs ${
                  isDark ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-white border-slate-300 text-slate-900'
                }`}
              >
                <option value="">All PAN Status</option>
                <option value="Verified">Verified</option>
                <option value="Pending">Pending</option>
                <option value="Rejected">Rejected</option>
              </SelectMenu>
            </div>

            {/* Bank KYC Status */}
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                Bank KYC Status
              </label>
              <SelectMenu
                value={filters.bankStatus}
                onChange={(e) => setFilters((p) => ({ ...p, bankStatus: e.target.value }))}
                className={`w-full px-2.5 py-1.5 rounded border text-xs ${
                  isDark ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-white border-slate-300 text-slate-900'
                }`}
              >
                <option value="">All Bank KYC Status</option>
                <option value="Verified">Verified</option>
                <option value="Pending">Pending</option>
                <option value="Failed">Failed</option>
              </SelectMenu>
            </div>

            {/* UAN KYC */}
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                UAN KYC Status
              </label>
              <SelectMenu
                value={filters.uanStatus}
                onChange={(e) => setFilters((p) => ({ ...p, uanStatus: e.target.value }))}
                className={`w-full px-2.5 py-1.5 rounded border text-xs ${
                  isDark ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-white border-slate-300 text-slate-900'
                }`}
              >
                <option value="">All UAN Status</option>
                <option value="Verified">Verified</option>
                <option value="Pending">Pending</option>
                <option value="Not Found">Not Found</option>
              </SelectMenu>
            </div>

            {/* Contract End Range */}
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                End of Contract (From / To)
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                <input
                  type="date"
                  value={filters.contractEndFrom}
                  onChange={(e) => setFilters((p) => ({ ...p, contractEndFrom: e.target.value }))}
                  className={`w-full px-2 py-1 rounded border text-xs ${
                    isDark ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
                <input
                  type="date"
                  value={filters.contractEndTo}
                  onChange={(e) => setFilters((p) => ({ ...p, contractEndTo: e.target.value }))}
                  className={`w-full px-2 py-1 rounded border text-xs ${
                    isDark ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>
            </div>
          </div>
        )}

        {/* 3. Active Filter Chips */}
        {activeChips.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mr-1">
              Active Filters ({activeChips.length}):
            </span>
            {activeChips.map((chip, idx) => (
              <span
                key={`${chip.key}-${idx}`}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-purple-100 text-purple-800 dark:bg-purple-950/70 dark:text-purple-300 border border-purple-300 dark:border-purple-800"
              >
                <span>{chip.value}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveChip(chip.key)}
                  className="hover:text-purple-900 dark:hover:text-white ml-0.5 rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-[11px] text-purple-600 dark:text-purple-400 hover:underline font-semibold ml-2"
            >
              Clear All
            </button>
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* CANDIDATE TABLE: grouped columns (Candidate | Offer Letter | Actions)     */}
      {/* ========================================================================= */}
      <div ref={tableRef} className="cc-card overflow-hidden scroll-mt-6">
        <div className="px-4 py-3 border-b border-[color:var(--cc-divider)] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2 className="cc-title text-sm font-bold">Candidate Offer Letter Rollout Records</h2>
            <span className="cc-accent-chip text-[11px] font-mono px-2 py-0.5 rounded-md font-semibold">
              Showing {filteredCandidates.length} of {candidates.length}
            </span>
          </div>
          <p className="cc-muted text-[11px]">Candidate status and offer letter status are tracked separately.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="cc-card-table w-full text-left text-xs border-collapse">
            <thead className="select-none">
              {/* Column groups */}
              <tr className="text-[10px] font-bold uppercase tracking-wider">
                <th colSpan={3} className="px-4 pt-2.5 pb-1 cc-accent border-b border-[color:var(--cc-divider)]">Candidate</th>
                <th colSpan={3} className="px-4 pt-2.5 pb-1 border-b border-l border-[color:var(--cc-divider)] text-purple-600 dark:text-purple-300">Offer Letter</th>
                <th className="px-4 pt-2.5 pb-1 border-b border-l border-[color:var(--cc-divider)]" />
              </tr>
              <tr className="cc-muted text-[10px] font-semibold uppercase tracking-wider border-b border-[color:var(--cc-divider)]">
                <th className="px-3 py-2 min-w-[140px]">Name / ID</th>
                <th className="px-3 py-2 min-w-[120px]">Client &amp; Role</th>
                <th className="px-3 py-2 min-w-[90px]">Candidate Status</th>
                <th className="px-3 py-2 min-w-[110px] border-l border-[color:var(--cc-divider)]">Letter Status</th>
                <th className="px-3 py-2 min-w-[90px]">Letter</th>
                <th className="px-3 py-2 min-w-[100px]">Timeline</th>
                <th className="px-3 py-2 text-right w-[230px] min-w-[230px] border-l border-[color:var(--cc-divider)]">Actions</th>
              </tr>
            </thead>

            <tbody className="cc-divide cc-text">
              {filteredCandidates.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center cc-muted">
                    <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="font-semibold cc-title">No offer letter records match the criteria</p>
                    <p className="text-[11px] mt-1">Try resetting the status card filter or the advanced filters.</p>
                  </td>
                </tr>
              ) : (
                filteredCandidates.map((cand) => (
                  <tr key={cand.id} className="cc-row transition-colors align-top select-text border-t first:border-t-0 border-[color:var(--cc-divider)]">
                    {/* CANDIDATE GROUP */}
                    <td className="px-3 py-3">
                      <div className="flex items-start gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-bold text-[10px] flex items-center justify-center shrink-0">
                          {cand.candidateName.split(' ').map((n) => n[0]).join('')}
                        </div>
                        <div className="min-w-0">
                          <button
                            type="button"
                            onClick={() => handleOpenOfferLetterDetails(cand, 'Offer Letter List')}
                            className="cc-title font-bold hover:underline text-left block"
                            title="Click to view candidate offer letter details"
                          >
                            {cand.candidateName}
                          </button>
                          <span className="cc-muted text-[11px] block truncate max-w-[150px]" title={cand.email}>{cand.email}</span>
                          <button
                            type="button"
                            onClick={() => handleOpenOfferLetterDetails(cand, 'Offer Letter List')}
                            className="font-mono text-[11px] font-semibold cc-accent hover:underline text-left"
                            title="Click to view candidate offer letter details"
                          >
                            {cand.candidateCode}
                          </button>
                        </div>
                      </div>
                    </td>

                    <td data-label="Client & Role" className="px-3 py-3">
                      <span className="cc-title font-semibold block">{cand.client}</span>
                      <span className="cc-text block">{cand.designation}</span>
                      <span className="cc-muted text-[11px] flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 shrink-0" />
                        {cand.location}
                      </span>
                    </td>

                    <td data-label="Candidate status" className="px-3 py-3">
                      <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {cand.candidateStatus}
                      </span>
                      <span className="cc-muted text-[11px] block mt-1.5">
                        Joining <span className="font-mono cc-text whitespace-nowrap">{cand.dateOfJoining}</span>
                      </span>
                    </td>

                    {/* OFFER LETTER GROUP */}
                    <td data-label="Letter status" className="px-3 py-3 border-l border-[color:var(--cc-divider)]">
                      {renderStatusBadge(cand.offerLetterStatus)}
                      <div className="mt-1.5">
                        {cand.blockingIssue && cand.blockingIssue !== 'None' ? (
                          <span className="inline-flex items-start gap-1 text-[11px] text-amber-700 dark:text-amber-400 font-medium">
                            <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-500" />
                            <span title={cand.blockingIssue}>{cand.blockingIssue}</span>
                          </span>
                        ) : (
                          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">Clear to onboard</span>
                        )}
                      </div>
                    </td>

                    <td data-label="Letter" className="px-3 py-3">
                      <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-medium bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                        {cand.letterGenerationType}
                      </span>
                      <span className="cc-muted text-[11px] block mt-1.5">
                        Generated <span className="font-mono cc-text whitespace-nowrap">{cand.letterGeneratedDate}</span>
                      </span>
                    </td>

                    <td data-label="Timeline" className="px-3 py-3 text-[11px] space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="cc-muted w-12 shrink-0">Sent</span>
                        {cand.letterSentDate ? (
                          <span className="font-mono cc-text font-medium whitespace-nowrap">{cand.letterSentDate}</span>
                        ) : (
                          <span className="text-rose-500 font-semibold italic">Not Sent</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="cc-muted w-12 shrink-0">Signed</span>
                        {cand.letterAcceptanceDate ? (
                          <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold whitespace-nowrap">{cand.letterAcceptanceDate}</span>
                        ) : (
                          <span className="cc-muted italic">Awaiting sign</span>
                        )}
                      </div>
                    </td>

                    {/* ACTIONS */}
                    <td className="px-3 py-3 w-[230px] min-w-[230px] whitespace-nowrap border-l border-[color:var(--cc-divider)]">{renderRowActions(cand)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODALS & DRAWERS                                                          */}
      {/* ========================================================================= */}
      
      {/* 1. Formal Offer Letter Preview Modal */}
      <OfferLetterPreviewModal
        isOpen={!!previewLetterCandidate}
        candidate={previewLetterCandidate}
        onClose={() => setPreviewLetterCandidate(null)}
        onSendOrResend={(cand) => setSendLetterCandidate(cand)}
        onDownload={handleDownloadPdf}
        onOpenCandidate360={(code) => {
          if (onOpenCandidate360) onOpenCandidate360(code);
        }}
      />

      {/* 2. Dispatch / Resend Modal */}
      <SendOfferLetterModal
        isOpen={!!sendLetterCandidate}
        candidate={sendLetterCandidate}
        onClose={() => setSendLetterCandidate(null)}
        onSendConfirm={handleSendSuccess}
      />

      {/* 3. Candidate Preview Drawer */}
      <CandidatePreviewDrawer
        candidate={previewCandidateDrawer}
        onClose={() => setPreviewCandidateDrawer(null)}
        onOpenFullProfile={(cand) => {
          setPreviewCandidateDrawer(null);
          if (onOpenCandidate360) onOpenCandidate360(cand);
        }}
        onOpenKycWorkspace={() => {
          setPreviewCandidateDrawer(null);
        }}
      />

      {/* 4. Offer Letter Status Detail Drawer (Drilldown for View Details on any status) */}
      <OfferLetterStatusDetailDrawer
        isOpen={!!statusDrawerStatus}
        status={statusDrawerStatus}
        candidates={candidates}
        onClose={() => setStatusDrawerStatus(null)}
        onSelectCandidatePreview={(cand) => handleOpenOfferLetterDetails(cand, `${statusDrawerStatus || 'Offer Letter'} List`)}
        onPreviewLetter={(cand) => setPreviewLetterCandidate(cand)}
        onSendOrResend={(cand) => setSendLetterCandidate(cand)}
        onDownloadLetter={(cand) => handleDownloadPdf(cand)}
        onFilterMainTable={(status) => {
          setFilters((p) => ({ ...p, statusCardFilter: status }));
          setTimeout(() => {
            tableRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 100);
        }}
        onOpenCandidate360={handleOpenCandidate360WithExactData}
      />

      {/* 5. Dedicated Foreground Offer Letter Details Drawer (Correctly Layered, No Nested Clutter) */}
      <OfferLetterDetailDrawer
        isOpen={!!selectedCandidateForDetails}
        candidate={selectedCandidateForDetails}
        onClose={() => setSelectedCandidateForDetails(null)}
        onBackToList={() => setSelectedCandidateForDetails(null)}
        onPreviewLetter={(cand) => setPreviewLetterCandidate(cand)}
        onSendOrResend={(cand) => setSendLetterCandidate(cand)}
        onDownloadLetter={(cand) => handleDownloadPdf(cand)}
        onOpenCandidate360={handleOpenCandidate360WithExactData}
        sourceContextTitle={detailsSourceTitle}
      />
      </PageBody>
    </div>
  );
};
