import React, { useState, useEffect } from 'react';
import { 
  User, 
  Building2, 
  FileText, 
  ShieldCheck, 
  CreditCard, 
  Users, 
  Phone, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Edit3, 
  Eye, 
  Save, 
  RotateCcw, 
  ExternalLink,
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  Download,
  AlertCircle,
  Copy,
  Check
} from 'lucide-react';
import { Candidate, KycRecord } from '../../types/onboarding';
import { StatusBadge } from '../../components/common/StatusBadge';
import { useTheme } from '../../hooks/useTheme';
import { useToast } from '../../hooks/useToast';
import { Toast } from '../../components/ui/Toast';
import { DocumentPreviewModal, DocumentPreviewData } from '../../components/common/DocumentPreviewModal';

import { SelectMenu } from '../../components/ui/SelectMenu';
interface CandidateProfile360Props {
  candidate: Candidate;
  onOpenKycDesk: (cand: Candidate) => void;
  onBackToDirectory: () => void;
}

export const CandidateProfile360: React.FC<CandidateProfile360Props> = ({
  candidate: initialCandidate,
  onOpenKycDesk,
  onBackToDirectory,
}) => {
  const { isDark } = useTheme();
  const [candidate, setCandidate] = useState<Candidate>(initialCandidate);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);
  const { message: toastMessage, showToast } = useToast(3000);
  const [previewDoc, setPreviewDoc] = useState<DocumentPreviewData | null>(null);

  useEffect(() => {
    setCandidate(initialCandidate);
    setHasUnsavedChanges(false);
  }, [initialCandidate]);

  const isKycDocUploaded = (kyc?: KycRecord | null) => {
    if (!kyc) return false;
    return kyc.status !== 'Not Started' && kyc.documentAvailability !== 'Missing Document' && kyc.documentNumber !== 'Pending Upload';
  };

  const handleOpenDocument = (doc: DocumentPreviewData) => {
    setPreviewDoc({
      ...doc,
      candidateName: `${candidate.firstName} ${candidate.lastName}`,
      candidateId: candidate.userId,
      candidateDesignation: candidate.designation,
      clientName: candidate.clientName,
    });
  };

  const handleOpenKycDoc = (kyc: KycRecord) => {
    const isUploaded = isKycDocUploaded(kyc);
    setPreviewDoc({
      name: kyc.documentFileName || `${kyc.documentType}_Proof.pdf`,
      category: `${kyc.documentType} Statutory Proof`,
      docType: kyc.documentType,
      uploadedAt: kyc.documentUploadedAt || kyc.lastUpdated,
      status: kyc.status,
      size: kyc.documentSize || '1.8 MB',
      candidateName: `${candidate.firstName} ${candidate.lastName}`,
      candidateId: candidate.userId,
      candidateDesignation: candidate.designation,
      clientName: candidate.clientName,
      documentNumber: kyc.documentNumber,
      isUploaded: isUploaded,
      remarks: kyc.remarks,
    });
  };


  const cardClass = isDark
    ? 'bg-slate-900 border border-slate-800 text-slate-100 shadow-xs'
    : 'bg-white border border-slate-200 text-slate-900 shadow-2xs';
  const innerCardClass = isDark
    ? 'bg-slate-950/60 border border-slate-800 text-slate-200'
    : 'bg-slate-50 border border-slate-100 text-slate-800';
  const inputClass = isDark
    ? 'w-full border border-slate-700 bg-slate-950 text-slate-100 rounded-lg p-2 disabled:bg-slate-900/80 disabled:text-slate-400 font-medium'
    : 'w-full border border-slate-300 bg-white text-slate-900 rounded-lg p-2 disabled:bg-slate-50 disabled:text-slate-700 font-medium';
  const labelClass = isDark ? 'block font-semibold text-slate-300 mb-1' : 'block font-semibold text-slate-700 mb-1';

  const navSections = [
    { id: 'overview', label: 'Overview', completion: 100 },
    { id: 'personal', label: 'Personal Details', completion: 100 },
    { id: 'family', label: 'Family Details', completion: 100 },
    { id: 'contact', label: 'Contact Details', completion: 100 },
    { id: 'kyc', label: 'KYC & Statutory', completion: candidate.overallKycStatus === 'Verified' ? 100 : 75 },
    { id: 'job', label: 'Job & Company', completion: 100 },
    { id: 'bank', label: 'Bank & ₹1 Test', completion: candidate.pennyTestStatus === 'Verified' ? 100 : 50 },
    { id: 'documents', label: 'Documents', completion: 80 },
    { id: 'letters', label: 'Letters & Offer', completion: 100 },
    { id: 'timeline', label: 'Timeline & Logs', completion: 100 },
  ];

  const handleFieldChange = (key: keyof Candidate, value: any) => {
    setCandidate((prev) => ({ ...prev, [key]: value }));
    setHasUnsavedChanges(true);
  };

  const handleSave = () => {
    setHasUnsavedChanges(false);
    setIsEditMode(false);
    showToast('Candidate profile updated successfully!');
  };

  const handleSaveAndNext = () => {
    setHasUnsavedChanges(false);
    const currentIndex = navSections.findIndex((s) => s.id === activeTab);
    if (currentIndex < navSections.length - 1) {
      setActiveTab(navSections[currentIndex + 1].id);
      showToast('Changes saved. Proceeding to next section.');
    } else {
      setIsEditMode(false);
      showToast('All sections saved successfully.');
    }
  };

  return (
    <div className={`flex-1 min-h-screen pb-24 transition-colors duration-150 ${
      isDark ? 'text-slate-100' : 'text-slate-900'
    }`}>
      {/* Toast */}
      <Toast message={toastMessage} variant="solid" />

      {/* Top Sticky Summary Header */}
      <div className={`border-b sticky top-0 z-20 transition-colors ${
        isDark ? 'bg-slate-900/95 border-slate-800' : 'bg-white border-slate-200 shadow-2xs'
      }`}>
        <div className="p-4 sm:px-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <button
              type="button"
              onClick={onBackToDirectory}
              className={`px-3 py-1.5 -ml-1 rounded-lg transition-colors flex items-center gap-1.5 shrink-0 border ${
                isDark 
                  ? 'text-slate-200 bg-slate-800 hover:bg-slate-750 border-slate-700' 
                  : 'text-slate-700 bg-slate-100 hover:bg-slate-200 border-slate-300'
              }`}
              title="Return to Candidate Directory with filters preserved"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="text-xs font-semibold">Back to Directory</span>
            </button>
            <div className="w-12 h-12 rounded-xl bg-sky-600 text-white font-bold text-base flex items-center justify-center shrink-0 shadow-xs">
              {candidate.firstName[0]}{candidate.lastName[0]}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {candidate.firstName} {candidate.lastName}
                </h1>
                <span className={`font-mono text-xs font-semibold px-2 py-0.5 rounded border ${
                  isDark ? 'bg-slate-800 text-sky-400 border-slate-700' : 'bg-slate-100 text-slate-800 border-slate-200'
                }`}>
                  {candidate.userId}
                </span>
                <StatusBadge type="joining" status={candidate.joiningStatus} />
              </div>

              <div className={`flex flex-wrap items-center gap-3 text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                <span className={`font-medium ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{candidate.designation}</span>
                <span className={isDark ? 'text-slate-600' : 'text-slate-300'}>·</span>
                <span className="text-sky-500 font-semibold">{candidate.clientName}</span>
                <span className={isDark ? 'text-slate-600' : 'text-slate-300'}>·</span>
                <span>Recruiter: <strong className={isDark ? 'text-slate-300' : 'text-slate-700'}>{candidate.recruiterName}</strong></span>
              </div>
            </div>
          </div>

          {/* Quick Metrics & Read/Edit Mode Toggle */}
          <div className="flex items-center gap-3 self-end md:self-center flex-wrap">
            {/* Completion Percentage Ring */}
            <div className={`flex items-center gap-2.5 pr-3 border-r ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
              <div className="text-right">
                <span className={`text-[10px] font-semibold uppercase block ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  Onboarding
                </span>
                <span className={`font-mono text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {candidate.onboardingCompletionPct}% Done
                </span>
              </div>
              <div className={`w-9 h-9 rounded-full border-2 border-sky-500 flex items-center justify-center font-mono text-[11px] font-bold ${
                isDark ? 'text-sky-300 bg-sky-950/80' : 'text-sky-700 bg-sky-50'
              }`}>
                {candidate.onboardingCompletionPct}%
              </div>
            </div>

            {/* Read / Edit Mode Switcher */}
            <div className={`flex items-center gap-1.5 p-1 rounded-lg ${isDark ? 'bg-slate-800 border border-slate-700' : 'bg-slate-100'}`}>
              <button
                type="button"
                onClick={() => setIsEditMode(false)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                  !isEditMode
                    ? isDark ? 'bg-slate-700 text-white shadow-xs font-bold' : 'bg-white text-slate-900 shadow-xs font-semibold'
                    : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Read Mode</span>
              </button>
              <button
                type="button"
                onClick={() => setIsEditMode(true)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                  isEditMode
                    ? 'bg-sky-600 text-white shadow-xs font-bold'
                    : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Profile</span>
              </button>
            </div>
          </div>
        </div>

        {/* Clean Horizontal Navigation Tabs with Section Completion Indicators */}
        <div className={`px-4 sm:px-6 flex items-center gap-1 overflow-x-auto border-t text-xs scrollbar-none ${
          isDark ? 'border-slate-800' : 'border-slate-100'
        }`}>
          {navSections.map((sec) => {
            const isActive = activeTab === sec.id;
            return (
              <button
                key={sec.id}
                onClick={() => setActiveTab(sec.id)}
                className={`px-3 py-2.5 font-medium whitespace-nowrap border-b-2 transition-colors flex items-center gap-1.5 ${
                  isActive
                    ? isDark ? 'border-sky-500 text-sky-300 font-semibold bg-sky-950/40' : 'border-sky-600 text-sky-700 font-semibold bg-sky-50/40'
                    : isDark ? 'border-transparent text-slate-400 hover:text-slate-200' : 'border-transparent text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>{sec.label}</span>
                {sec.completion < 100 && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" title="Incomplete items" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Missing Required Fields Alert Banner */}
        {candidate.missingFields.length > 0 && (
          <div className={`w-full h-auto min-h-fit border rounded-xl p-4 sm:p-5 shadow-xs transition-all flex flex-col md:flex-row md:items-start justify-between gap-4 overflow-visible ${
            isDark 
              ? 'bg-amber-950/40 border-amber-800/80 text-amber-200' 
              : 'bg-gradient-to-r from-amber-50 via-amber-50/90 to-amber-100/40 border-amber-300 text-amber-900'
          }`}>
            <div className="flex items-start gap-3.5 flex-1 min-w-0">
              <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 mt-0.5 shadow-2xs ${
                isDark ? 'bg-amber-950 border-amber-800 text-amber-400' : 'bg-amber-100 border-amber-300 text-amber-800'
              }`}>
                <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
              </div>

              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className={`font-bold text-sm sm:text-base break-words leading-snug ${
                    isDark ? 'text-amber-300' : 'text-amber-950'
                  }`}>
                    Attention Required: {candidate.missingFields.length} Mandatory Onboarding Items Pending
                  </h2>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${
                    isDark ? 'bg-amber-950 text-amber-300 border-amber-800' : 'bg-amber-200/80 text-amber-900 border-amber-300'
                  }`}>
                    Compliance Action Required
                  </span>
                </div>

                <p className={`text-xs sm:text-sm leading-relaxed break-words ${
                  isDark ? 'text-amber-300/80' : 'text-amber-900'
                }`}>
                  The candidate cannot be moved to <strong className={`font-semibold ${isDark ? 'text-amber-200' : 'text-amber-950'}`}>"Joined"</strong> status until all statutory compliance items are uploaded and verified.
                </p>

                {/* Missing Items List with proper wrapping */}
                <div className="pt-2">
                  <span className={`text-[11px] font-semibold uppercase tracking-wider block mb-1.5 ${
                    isDark ? 'text-amber-400' : 'text-amber-800'
                  }`}>
                    Pending Verification Documents:
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    {candidate.missingFields.map((f, i) => (
                      <span
                        key={i}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold shadow-2xs break-words whitespace-normal max-w-full border ${
                          isDark 
                            ? 'bg-slate-900 border-amber-800/80 text-amber-300' 
                            : 'bg-white border-amber-300/90 text-amber-950'
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                        <span>{f}</span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Action Button - Responsive alignment */}
            <div className="flex flex-col sm:flex-row md:flex-col items-stretch sm:items-center md:items-end gap-1.5 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-amber-200/80">
              <button
                type="button"
                onClick={() => onOpenKycDesk(candidate)}
                className="w-full sm:w-auto px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition-colors whitespace-nowrap"
              >
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>Resolve at KYC Desk</span>
              </button>
              <span className="text-[10px] text-amber-800/80 text-center md:text-right font-medium">
                Mandatory for Day-1 Joining
              </span>
            </div>
          </div>
        )}

        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-6">
              {/* Snapshot Card */}
              <div className={`${cardClass} p-5 rounded-xl space-y-4`}>
                <h3 className={`text-sm font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Onboarding Health Snapshot
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className={`p-3 rounded-lg border ${innerCardClass}`}>
                    <span className="text-[11px] text-slate-400">Statutory KYC</span>
                    <div className="mt-1">
                      <StatusBadge type="kyc" status={candidate.overallKycStatus} />
                    </div>
                  </div>
                  <div className={`p-3 rounded-lg border ${innerCardClass}`}>
                    <span className="text-[11px] text-slate-400">₹1 Penny Test</span>
                    <div className="mt-1">
                      <StatusBadge type="penny" status={candidate.pennyTestStatus} />
                    </div>
                  </div>
                  <div className={`p-3 rounded-lg border ${innerCardClass}`}>
                    <span className="text-[11px] text-slate-400">Offer Acceptance</span>
                    <p className="font-semibold text-emerald-500 mt-1 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Accepted</span>
                    </p>
                  </div>
                  <div className={`p-3 rounded-lg border ${innerCardClass}`}>
                    <span className="text-[11px] text-slate-400">Joining Date</span>
                    <p className={`font-mono font-bold mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>{candidate.dateOfJoining}</p>
                  </div>
                </div>
              </div>

              {/* Personal & Deployment Brief */}
              <div className={`${cardClass} p-5 rounded-xl space-y-4`}>
                <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Placement & Deputation Details</h3>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400">Client Deputation:</span>
                    <p className={`font-semibold mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>{candidate.clientName}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Work Location:</span>
                    <p className={`font-semibold mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>{candidate.workLocation}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Designation:</span>
                    <p className={`font-semibold mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>{candidate.designation}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Gross Monthly CTC:</span>
                    <p className={`font-mono font-bold mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>₹{candidate.grossSalaryMonthly.toLocaleString('en-IN')}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar Cards */}
            <div className="space-y-6">
              {/* Quick KYC Status Card */}
              <div className={`${cardClass} p-5 rounded-xl space-y-3`}>
                <div className="flex items-center justify-between">
                  <h3 className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    KYC Documents Desk
                  </h3>
                  <button
                    onClick={() => onOpenKycDesk(candidate)}
                    className="text-xs text-sky-500 hover:underline font-semibold"
                  >
                    Open Desk
                  </button>
                </div>

                <div className="space-y-2 text-xs">
                  {candidate.kycRecords.map((k) => {
                    const isUploaded = isKycDocUploaded(k);
                    return (
                      <div key={k.id} className={`p-2.5 rounded-lg border flex items-center justify-between gap-2 ${innerCardClass}`}>
                        <div className="min-w-0">
                          <span className={`font-semibold block ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{k.documentType}</span>
                          <span className={`text-[10px] font-mono truncate block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{k.documentNumber}</span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <StatusBadge type="kyc" status={k.status} size="sm" />
                          {isUploaded ? (
                            <button
                              type="button"
                              onClick={() => handleOpenKycDoc(k)}
                              className={`p-1 rounded transition-colors cursor-pointer ${
                                isDark
                                  ? 'text-sky-400 hover:text-white hover:bg-slate-800'
                                  : 'text-sky-600 hover:text-sky-900 hover:bg-slate-200/60'
                              }`}
                              title={`View ${k.documentType} Document`}
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <span className={`text-[9px] px-1.5 py-0.5 rounded border border-dashed ${
                              isDark ? 'border-slate-700 text-slate-500' : 'border-slate-300 text-slate-400'
                            }`}>
                              Not Uploaded
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Recruiter Details Card */}
              <div className={`${cardClass} p-5 rounded-xl text-xs space-y-2`}>
                <h3 className={`font-bold uppercase tracking-wider text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Recruitment Ownership
                </h3>
                <div className="pt-1">
                  <p className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{candidate.recruiterName}</p>
                  <p className="text-slate-400">{candidate.recruiterEmail}</p>
                  <p className="text-slate-400 text-[11px] mt-1">Source: {candidate.source} · Reg: {candidate.registrationDate}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Personal Details */}
        {activeTab === 'personal' && (
          <div className={`${cardClass} p-6 rounded-xl space-y-5`}>
            <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Basic & Demographic Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
              <div>
                <label className={labelClass}>First Name</label>
                <input
                  type="text"
                  disabled={!isEditMode}
                  value={candidate.firstName}
                  onChange={(e) => handleFieldChange('firstName', e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Last Name</label>
                <input
                  type="text"
                  disabled={!isEditMode}
                  value={candidate.lastName}
                  onChange={(e) => handleFieldChange('lastName', e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Gender</label>
                <SelectMenu
                  disabled={!isEditMode}
                  value={candidate.gender}
                  onChange={(e) => handleFieldChange('gender', e.target.value)}
                  className={inputClass}
                >
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Other">Other</option>
                </SelectMenu>
              </div>
              <div>
                <label className={labelClass}>Date of Birth</label>
                <input
                  type="date"
                  disabled={!isEditMode}
                  value={candidate.dob}
                  onChange={(e) => handleFieldChange('dob', e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Blood Group</label>
                <input
                  type="text"
                  disabled={!isEditMode}
                  value={candidate.bloodGroup}
                  onChange={(e) => handleFieldChange('bloodGroup', e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Highest Qualification</label>
                <input
                  type="text"
                  disabled={!isEditMode}
                  value={candidate.highestQualification}
                  onChange={(e) => handleFieldChange('highestQualification', e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Family Details */}
        {activeTab === 'family' && (
          <div className={`${cardClass} p-6 rounded-xl space-y-5`}>
            <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Family & Nominee Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
              <div>
                <label className={labelClass}>Father's Full Name</label>
                <input
                  type="text"
                  disabled={!isEditMode}
                  value={candidate.fatherName}
                  onChange={(e) => handleFieldChange('fatherName', e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Mother's Full Name</label>
                <input
                  type="text"
                  disabled={!isEditMode}
                  value={candidate.motherName}
                  onChange={(e) => handleFieldChange('motherName', e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Marital Status</label>
                <SelectMenu
                  disabled={!isEditMode}
                  value={candidate.maritalStatus}
                  onChange={(e) => handleFieldChange('maritalStatus', e.target.value)}
                  className={inputClass}
                >
                  <option value="Single">Single</option>
                  <option value="Married">Married</option>
                  <option value="Other">Other</option>
                </SelectMenu>
              </div>
              {candidate.maritalStatus === 'Married' && (
                <div>
                  <label className={labelClass}>Spouse's Name</label>
                  <input
                    type="text"
                    disabled={!isEditMode}
                    value={candidate.spouseName || ''}
                    onChange={(e) => handleFieldChange('spouseName', e.target.value)}
                    className={inputClass}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 4: Contact Details */}
        {activeTab === 'contact' && (
          <div className={`${cardClass} p-6 rounded-xl space-y-5`}>
            <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Communication & Address Info</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className={labelClass}>Primary Email Address</label>
                <input
                  type="email"
                  disabled={!isEditMode}
                  value={candidate.email}
                  onChange={(e) => handleFieldChange('email', e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Contact Phone</label>
                <input
                  type="tel"
                  disabled={!isEditMode}
                  value={candidate.phone}
                  onChange={(e) => handleFieldChange('phone', e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>WhatsApp Number</label>
                <input
                  type="tel"
                  disabled={!isEditMode}
                  value={candidate.whatsappNumber}
                  onChange={(e) => handleFieldChange('whatsappNumber', e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Emergency Contact Details</label>
                <input
                  type="text"
                  disabled={!isEditMode}
                  value={candidate.emergencyContact}
                  onChange={(e) => handleFieldChange('emergencyContact', e.target.value)}
                  className={inputClass}
                />
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>Current Residential Address</label>
                <textarea
                  rows={2}
                  disabled={!isEditMode}
                  value={candidate.currentAddress}
                  onChange={(e) => handleFieldChange('currentAddress', e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: KYC Details & Workspace Link */}
        {activeTab === 'kyc' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Statutory KYC Details</h3>
              <button
                type="button"
                onClick={() => onOpenKycDesk(candidate)}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Open Interactive KYC Verification Desk</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {candidate.kycRecords.map((kyc) => {
                const isUploaded = isKycDocUploaded(kyc);
                return (
                  <div key={kyc.id} className={`p-4 rounded-xl border space-y-3 text-xs ${cardClass}`}>
                    <div className="flex justify-between items-center gap-2">
                      <div className="flex items-center gap-2">
                        <span className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>{kyc.documentType}</span>
                        <StatusBadge type="kyc" status={kyc.status} size="sm" />
                      </div>
                      {isUploaded ? (
                        <button
                          type="button"
                          onClick={() => handleOpenKycDoc(kyc)}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-md border flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs ${
                            isDark
                              ? 'bg-sky-950/80 text-sky-300 border-sky-800 hover:bg-sky-600 hover:text-white'
                              : 'bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-600 hover:text-white'
                          }`}
                          title={`View ${kyc.documentType} Document`}
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Document</span>
                        </button>
                      ) : (
                        <span className={`px-2.5 py-1 text-xs font-semibold rounded border border-dashed flex items-center gap-1 ${
                          isDark ? 'border-slate-700 text-slate-500 bg-slate-900' : 'border-slate-300 text-slate-400 bg-slate-50'
                        }`}>
                          <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                          <span>Not Uploaded</span>
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-slate-700/40">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-medium">ID / Document Number:</span>
                        <span className={`font-mono font-bold text-xs ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                          {kyc.documentNumber}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-medium">API Match Score:</span>
                        <span className="font-mono font-bold text-emerald-400">{kyc.matchPercentage}% Matched</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-medium">Document File:</span>
                        <span className="text-[11px] truncate block text-slate-400 font-mono">
                          {isUploaded ? (kyc.documentFileName || `${kyc.documentType}_Proof.pdf`) : 'Pending Candidate Upload'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-medium">Last Verified:</span>
                        <span className="text-[11px] text-slate-400">{kyc.lastUpdated}</span>
                      </div>
                    </div>

                    {kyc.remarks && (
                      <div className={`p-2 rounded border text-[11px] ${
                        isDark ? 'bg-slate-950/80 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
                      }`}>
                        <span className="font-semibold text-slate-300">Remarks: </span>
                        <span>{kyc.remarks}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 6: Job & Company */}
        {activeTab === 'job' && (
          <div className={`${cardClass} p-6 rounded-xl space-y-5`}>
            <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Deployment, Designation & Compensation</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
              <div>
                <label className={labelClass}>Client Placement</label>
                <input
                  type="text"
                  disabled={!isEditMode}
                  value={candidate.clientName}
                  onChange={(e) => handleFieldChange('clientName', e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Designation</label>
                <input
                  type="text"
                  disabled={!isEditMode}
                  value={candidate.designation}
                  onChange={(e) => handleFieldChange('designation', e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Work Location</label>
                <input
                  type="text"
                  disabled={!isEditMode}
                  value={candidate.workLocation}
                  onChange={(e) => handleFieldChange('workLocation', e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Date of Joining</label>
                <input
                  type="date"
                  disabled={!isEditMode}
                  value={candidate.dateOfJoining}
                  onChange={(e) => handleFieldChange('dateOfJoining', e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Gross Monthly CTC (INR)</label>
                <input
                  type="number"
                  disabled={!isEditMode}
                  value={candidate.grossSalaryMonthly}
                  onChange={(e) => handleFieldChange('grossSalaryMonthly', Number(e.target.value))}
                  className={inputClass}
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 7: Bank & Penny Test */}
        {activeTab === 'bank' && (
          <div className={`${cardClass} p-6 rounded-xl space-y-5`}>
            <div className="flex items-center justify-between">
              <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Bank Account & ₹1 Penny-Drop Status</h3>
              <StatusBadge type="penny" status={candidate.pennyTestStatus} size="md" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
              <div>
                <label className={labelClass}>Bank Name</label>
                <input
                  type="text"
                  disabled={!isEditMode}
                  value={candidate.bankName}
                  onChange={(e) => handleFieldChange('bankName', e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Account Number</label>
                <input
                  type="text"
                  disabled={!isEditMode}
                  value={candidate.accountNumber}
                  onChange={(e) => handleFieldChange('accountNumber', e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>IFSC Code</label>
                <input
                  type="text"
                  disabled={!isEditMode}
                  value={candidate.ifscCode}
                  onChange={(e) => handleFieldChange('ifscCode', e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            {/* Penny Test Info Banner */}
            <div className={`p-3.5 rounded-lg border text-xs flex items-center justify-between ${
              isDark 
                ? 'bg-emerald-950/40 border-emerald-800/80 text-emerald-200' 
                : 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
            }`}>
              <div>
                <span className="font-semibold block">₹1 IMPS Penny Drop Verification:</span>
                <p className={`text-[11px] mt-0.5 ${isDark ? 'text-emerald-300' : 'text-emerald-800'}`}>
                  Beneficiary Name returned by NPCI: <strong className="font-mono">{candidate.pennyTestAccountHolder || candidate.firstName.toUpperCase() + ' ' + candidate.lastName.toUpperCase()}</strong>. Name matched with Aadhaar records.
                </p>
              </div>
              <button
                type="button"
                onClick={() => showToast('Dispatched INR 1.00 IMPS penny test to candidate bank')}
                className={`px-3 py-1.5 rounded font-semibold text-xs border transition-colors ${
                  isDark 
                    ? 'bg-slate-900 border-emerald-700 text-emerald-300 hover:bg-slate-850' 
                    : 'bg-white border-emerald-300 text-emerald-800 hover:bg-emerald-100'
                }`}
              >
                Re-Trigger ₹1 Test
              </button>
            </div>

            {/* Bank Document Proof Card */}
            {(() => {
              const bankKyc = candidate.kycRecords.find((k) => k.documentType === 'Bank');
              const isBankUploaded = isKycDocUploaded(bankKyc);
              return (
                <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${innerCardClass}`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center border shrink-0 ${
                      isDark ? 'bg-sky-950/60 border-sky-800 text-sky-400' : 'bg-sky-50 border-sky-200 text-sky-600'
                    }`}>
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className={`font-bold text-xs ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        Bank Proof Document (Cancelled Cheque / Passbook Copy)
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {bankKyc?.documentFileName || 'Cancelled_Cheque_HDFC.jpg'} · {bankKyc?.documentSize || '2.1 MB'} · Uploaded by Candidate
                      </p>
                    </div>
                  </div>
                  <div>
                    {isBankUploaded ? (
                      <button
                        type="button"
                        onClick={() => handleOpenDocument({
                          name: bankKyc?.documentFileName || 'Cancelled_Cheque_Proof.jpg',
                          category: 'Statutory Bank Proof',
                          docType: 'Bank',
                          uploadedAt: bankKyc?.documentUploadedAt || candidate.registrationDate,
                          status: bankKyc?.status || candidate.pennyTestStatus,
                          size: bankKyc?.documentSize || '2.1 MB',
                          documentNumber: candidate.accountNumber,
                          isUploaded: true,
                        })}
                        className={`px-3.5 py-1.5 text-xs font-semibold rounded-md border flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs ${
                          isDark
                            ? 'bg-sky-950/80 text-sky-300 border-sky-800 hover:bg-sky-600 hover:text-white'
                            : 'bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-600 hover:text-white'
                        }`}
                        title="View Cancelled Cheque / Passbook Proof"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Document</span>
                      </button>
                    ) : (
                      <span className="px-2.5 py-1 text-xs font-semibold rounded border border-dashed text-slate-500 border-slate-600">
                        Not Uploaded
                      </span>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* Tab 8: Documents Repository */}
        {activeTab === 'documents' && (
          <div className={`${cardClass} p-6 rounded-xl space-y-5`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Uploaded Statutory & Educational Proofs
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Verified documents, identity cards, educational certificates, and employment records
                </p>
              </div>
              <span className="text-xs text-slate-400 font-mono px-2.5 py-1 rounded border border-slate-700 bg-slate-950/40">
                {candidate.documents.length} Files Uploaded
              </span>
            </div>

            {/* Uploaded Documents Grid */}
            {candidate.documents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {candidate.documents.map((doc) => (
                  <div key={doc.id} className={`p-3.5 border rounded-xl flex items-center justify-between gap-3 ${innerCardClass}`}>
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border ${
                        isDark ? 'bg-sky-950/60 border-sky-800 text-sky-400' : 'bg-sky-50 border-sky-200 text-sky-600'
                      }`}>
                        <FileText className="w-5 h-5 shrink-0" />
                      </div>
                      <div className="min-w-0">
                        <p className={`font-semibold truncate max-w-[170px] sm:max-w-[210px] ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                          {doc.name}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {doc.category} · {doc.size} · {doc.uploadedAt}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                        doc.status === 'Verified' 
                          ? isDark ? 'bg-emerald-950 text-emerald-300 border-emerald-800' : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                          : isDark ? 'bg-amber-950 text-amber-300 border-amber-800' : 'bg-amber-100 text-amber-800 border-amber-200'
                      }`}>
                        {doc.status}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleOpenDocument({
                          id: doc.id,
                          name: doc.name,
                          category: doc.category,
                          uploadedAt: doc.uploadedAt,
                          status: doc.status,
                          size: doc.size,
                          isUploaded: true,
                        })}
                        className={`px-2.5 py-1 text-xs font-semibold rounded-md border flex items-center gap-1 transition-colors cursor-pointer shadow-2xs ${
                          isDark
                            ? 'bg-sky-950/80 text-sky-300 border-sky-800 hover:bg-sky-600 hover:text-white'
                            : 'bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-600 hover:text-white'
                        }`}
                        title={`View ${doc.name}`}
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>View Document</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={`p-8 text-center rounded-xl border border-dashed ${
                isDark ? 'border-slate-800 bg-slate-950/40' : 'border-slate-200 bg-slate-50'
              }`}>
                <FileText className="w-10 h-10 text-slate-500 mx-auto mb-2" />
                <p className={`font-semibold text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  No Documents Uploaded in Repository
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  The candidate has not uploaded any educational or experience proofs yet.
                </p>
              </div>
            )}

            {/* Missing Mandatory Documents Section */}
            {candidate.missingFields.length > 0 && (
              <div className="space-y-3 pt-3 border-t border-slate-700/40">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-500" />
                  <h4 className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-amber-400' : 'text-amber-800'}`}>
                    Pending Candidate Proofs ({candidate.missingFields.length})
                  </h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  {candidate.missingFields.map((field, idx) => (
                    <div key={idx} className={`p-3.5 border rounded-xl flex items-center justify-between gap-3 ${
                      isDark ? 'bg-amber-950/20 border-amber-900/40' : 'bg-amber-50/60 border-amber-200'
                    }`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border ${
                          isDark ? 'bg-slate-900 border-slate-700 text-slate-500' : 'bg-white border-slate-300 text-slate-400'
                        }`}>
                          <FileText className="w-5 h-5 shrink-0" />
                        </div>
                        <div>
                          <p className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{field}</p>
                          <p className="text-[11px] text-amber-500/90 mt-0.5">Mandatory Statutory Requirement</p>
                        </div>
                      </div>
                      <span className={`px-2.5 py-1 text-xs font-semibold rounded border border-dashed flex items-center gap-1 ${
                        isDark ? 'border-slate-700 text-slate-500 bg-slate-900' : 'border-slate-300 text-slate-500 bg-white'
                      }`}>
                        <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                        <span>Not Uploaded</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 9: Letters & Offer Acceptance */}
        {activeTab === 'letters' && (
          <div className={`${cardClass} p-6 rounded-xl space-y-4 text-xs`}>
            <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Offer & Appointment Letters</h3>
            <div className="space-y-3">
              {candidate.letters.map((letItem) => (
                <div key={letItem.id} className={`p-4 border rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${innerCardClass}`}>
                  <div>
                    <h4 className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>{letItem.title}</h4>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Issued: {letItem.issuedDate} · Status: <span className="font-semibold text-emerald-500">{letItem.status}</span>
                      {letItem.acceptedDate && ` (${letItem.acceptedDate})`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenDocument({
                        name: `${letItem.title}.pdf`,
                        category: 'Employment Letter',
                        docType: 'Offer Letter',
                        uploadedAt: letItem.issuedDate,
                        status: letItem.status,
                        size: '1.4 MB',
                        isUploaded: true,
                      })}
                      className={`px-3 py-1.5 rounded-md font-semibold flex items-center gap-1.5 border transition-colors cursor-pointer shadow-2xs ${
                        isDark
                          ? 'bg-sky-950/80 text-sky-300 border-sky-800 hover:bg-sky-600 hover:text-white'
                          : 'bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-600 hover:text-white'
                      }`}
                      title={`View ${letItem.title}`}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Document</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => showToast(`Downloading ${letItem.title} signed PDF`)}
                      className={`px-3 py-1.5 rounded-md font-medium flex items-center gap-1.5 border transition-colors cursor-pointer ${
                        isDark 
                          ? 'bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800' 
                          : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download PDF</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 10: Timeline & Activity Logs */}
        {activeTab === 'timeline' && (
          <div className={`${cardClass} p-6 rounded-xl space-y-4 text-xs`}>
            <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Complete Onboarding Journey Audit Trail</h3>
            <div className={`relative pl-6 border-l-2 space-y-5 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
              <div className="relative">
                <div className={`absolute -left-[31px] top-0.5 w-3.5 h-3.5 rounded-full border-2 ${
                  isDark ? 'bg-emerald-500 border-slate-900 ring-2 ring-emerald-950' : 'bg-emerald-500 border-white ring-2 ring-emerald-100'
                }`} />
                <p className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>₹1 Penny Drop Verified</p>
                <p className="text-[11px] text-slate-400 font-mono">2026-09-14 11:25 AM</p>
                <p className="text-slate-400 mt-1">IMPS Settlement confirmed. Account holder name matches Aadhaar.</p>
              </div>
              <div className="relative">
                <div className={`absolute -left-[31px] top-0.5 w-3.5 h-3.5 rounded-full border-2 ${
                  isDark ? 'bg-sky-500 border-slate-900 ring-2 ring-sky-950' : 'bg-sky-500 border-white ring-2 ring-sky-100'
                }`} />
                <p className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Candidate Digital Offer Letter Accepted</p>
                <p className="text-[11px] text-slate-400 font-mono">2026-09-12 10:15 AM</p>
                <p className="text-slate-400 mt-1">IP: 103.21.14.88 · Candidate verified via OTP.</p>
              </div>
              <div className="relative">
                <div className={`absolute -left-[31px] top-0.5 w-3.5 h-3.5 rounded-full border-2 ${
                  isDark ? 'bg-slate-400 border-slate-900 ring-2 ring-slate-800' : 'bg-slate-400 border-white ring-2 ring-slate-100'
                }`} />
                <p className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Candidate Invitation Dispatched</p>
                <p className="text-[11px] text-slate-400 font-mono">2026-09-12 09:30 AM</p>
                <p className="text-slate-400 mt-1">WhatsApp & Email notification dispatched by recruiter Ananya Mukherjee.</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sticky Bottom Action Bar (When in Edit Mode or when unsaved changes exist) */}
      {isEditMode && (
        <div className={`fixed bottom-0 left-0 right-0 z-40 border-t p-4 shadow-xl flex items-center justify-between px-6 animate-in slide-in-from-bottom duration-200 ${
          isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
        }`}>
          <div className="flex items-center gap-2 text-xs">
            <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
            <span className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>Candidate Profile Edit Mode Active</span>
            {hasUnsavedChanges && (
              <span className={`text-[11px] px-2 py-0.5 rounded border ${
                isDark ? 'text-amber-300 bg-amber-950/80 border-amber-800' : 'text-amber-700 bg-amber-50 border-amber-200'
              }`}>
                Unsaved modifications detected
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setIsEditMode(false);
                setHasUnsavedChanges(false);
              }}
              className={`px-4 py-2 border rounded-lg text-xs font-semibold transition-colors ${
                isDark ? 'border-slate-700 text-slate-300 hover:bg-slate-800' : 'border-slate-300 text-slate-700 hover:bg-slate-50'
              }`}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className={`px-4 py-2 rounded-lg text-xs font-semibold shadow-xs ${
                isDark ? 'bg-slate-800 hover:bg-slate-750 text-white border border-slate-700' : 'bg-slate-900 hover:bg-slate-800 text-white'
              }`}
            >
              Save Changes
            </button>
            <button
              type="button"
              onClick={handleSaveAndNext}
              className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 shadow-xs"
            >
              <span>Save & Next Section</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Document Preview Centered Modal */}
      <DocumentPreviewModal
        isOpen={Boolean(previewDoc)}
        onClose={() => setPreviewDoc(null)}
        document={previewDoc}
      />
    </div>
  );
};
