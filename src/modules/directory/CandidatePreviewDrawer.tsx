import React, { useState } from 'react';
import { 
  X, 
  ExternalLink, 
  Phone, 
  Mail, 
  Building2, 
  MapPin, 
  Calendar, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  FileText,
  UserCheck,
  Send,
  Copy,
  ChevronRight,
  Eye,
  Check,
  User,
  CreditCard,
  Briefcase
} from 'lucide-react';
import { Candidate } from '../../types/onboarding';
import { StatusBadge } from '../../components/common/StatusBadge';
import { useTheme } from '../../hooks/useTheme';
import { DocumentPreviewModal, DocumentPreviewData } from '../../components/common/DocumentPreviewModal';

interface CandidatePreviewDrawerProps {
  candidate: Candidate | null;
  onClose: () => void;
  onOpenFullProfile: (candidate: Candidate) => void;
  onOpenKycWorkspace: (candidate: Candidate) => void;
}

export const CandidatePreviewDrawer: React.FC<CandidatePreviewDrawerProps> = ({
  candidate,
  onClose,
  onOpenFullProfile,
  onOpenKycWorkspace,
}) => {
  const { isDark } = useTheme();
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<DocumentPreviewData | null>(null);

  if (!candidate) return null;

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(candidate.email);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const openDocPreview = (kyc: any) => {
    const isUploaded = kyc.status !== 'Not Started' && kyc.documentAvailability !== 'Missing Document';
    setPreviewDoc({
      name: kyc.documentFileName || `${kyc.documentType}_Proof.pdf`,
      category: 'Statutory Proof',
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

  return (
    <>
      <div 
        className="fixed inset-0 z-50 overflow-hidden bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6"
        role="dialog"
        aria-modal="true"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div 
          className={`w-full max-w-4xl max-h-[88vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 border ${
            isDark ? 'bg-slate-900 border-slate-750 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
          }`}
        >
          {/* ========================================================================= */}
          {/* MODAL HEADER                                                              */}
          {/* ========================================================================= */}
          <div className={`px-6 py-4 border-b flex items-center justify-between shrink-0 ${
            isDark ? 'bg-slate-950/90 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-center gap-3">
              <span className={`font-mono text-xs font-bold px-2.5 py-1 rounded-md border ${
                isDark ? 'bg-sky-950/80 text-sky-400 border-sky-800' : 'bg-sky-50 text-sky-700 border-sky-200'
              }`}>
                {candidate.userId}
              </span>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Candidate Details</span>
                <span className={`text-xs ${isDark ? 'text-slate-600' : 'text-slate-400'}`}>·</span>
                <span className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{candidate.clientName}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200'
              }`}
              title="Close (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* ========================================================================= */}
          {/* MODAL BODY (SCROLLABLE)                                                   */}
          {/* ========================================================================= */}
          <div className={`flex-1 overflow-y-auto p-6 space-y-6 text-xs ${
            isDark ? 'text-slate-300' : 'text-slate-700'
          }`}>
            {/* Candidate Primary Summary Header */}
            <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
              isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50/80 border-slate-200'
            }`}>
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-full bg-sky-600/20 text-sky-400 border-2 border-sky-500/40 flex items-center justify-center font-bold text-lg shrink-0">
                  {candidate.firstName[0]}{candidate.lastName[0]}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {candidate.firstName} {candidate.lastName}
                    </h2>
                    {candidate.oldEmployeeId && (
                      <span className={`text-[10px] px-2 py-0.5 rounded border font-mono ${
                        isDark ? 'bg-slate-800 text-slate-300 border-slate-700' : 'bg-slate-200 text-slate-700 border-slate-300'
                      }`}>
                        Ex-Emp: {candidate.oldEmployeeId}
                      </span>
                    )}
                  </div>
                  <p className={`text-xs font-medium mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    {candidate.designation} · {candidate.department}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <StatusBadge type="joining" status={candidate.joiningStatus} />
                    <StatusBadge type="penny" status={candidate.pennyTestStatus} />
                  </div>
                </div>
              </div>

              {/* Profile Progress */}
              <div className="sm:text-right shrink-0">
                <span className={`text-[10px] uppercase tracking-wider font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Profile Completion
                </span>
                <div className="flex items-center gap-2.5 mt-1">
                  <div className={`w-28 rounded-full h-2.5 overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-200'}`}>
                    <div
                      className="bg-sky-600 h-2.5 rounded-full transition-all duration-300"
                      style={{ width: `${candidate.onboardingCompletionPct}%` }}
                    />
                  </div>
                  <span className={`font-mono text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {candidate.onboardingCompletionPct}%
                  </span>
                </div>
              </div>
            </div>

            {/* Contact Details Card */}
            <div className={`rounded-xl p-4 border space-y-3 ${
              isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-white border-slate-200'
            }`}>
              <h3 className={`font-bold uppercase text-[10px] tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Contact & Communication
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className={`p-2.5 rounded-lg border flex items-center justify-between ${
                  isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="min-w-0 pr-2">
                    <span className="text-[10px] text-slate-400 block">Email Address</span>
                    <span className={`font-medium truncate block ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                      {candidate.email}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyEmail}
                    className="p-1 rounded text-sky-500 hover:text-sky-400 hover:bg-sky-500/10 cursor-pointer shrink-0"
                    title="Copy Email"
                  >
                    {copiedEmail ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <div className={`p-2.5 rounded-lg border flex items-center justify-between ${
                  isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Contact Phone</span>
                    <span className={`font-medium block ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                      {candidate.phone}
                    </span>
                  </div>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/20 font-medium">
                    WhatsApp Active
                  </span>
                </div>

                <div className={`p-2.5 rounded-lg border ${
                  isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  <span className="text-[10px] text-slate-400 block">Emergency Contact</span>
                  <span className={`font-medium block truncate ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                    {candidate.emergencyContact}
                  </span>
                </div>
              </div>
            </div>

            {/* Job & Deployment Info */}
            <div className="space-y-2">
              <h3 className={`font-bold uppercase text-[10px] tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Deployment & Sourcing
              </h3>
              <div className={`grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl border ${
                isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-white border-slate-200'
              }`}>
                <div>
                  <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Client Organization</span>
                  <p className={`font-semibold mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>{candidate.clientName}</p>
                </div>
                <div>
                  <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Work Location / Branch</span>
                  <p className={`font-medium mt-0.5 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{candidate.workLocation}</p>
                </div>
                <div>
                  <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Date of Joining</span>
                  <p className={`font-mono font-medium mt-0.5 ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>{candidate.dateOfJoining}</p>
                </div>
                <div>
                  <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>End of Contract</span>
                  <p className={`font-mono font-medium mt-0.5 ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>{candidate.endOfContract || 'Ongoing / Indefinite'}</p>
                </div>
                <div>
                  <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Gross Monthly CTC</span>
                  <p className={`font-mono font-semibold mt-0.5 text-emerald-500`}>₹ {candidate.grossSalaryMonthly?.toLocaleString('en-IN')}</p>
                </div>
                <div>
                  <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Assigned Recruiter</span>
                  <p className={`font-medium mt-0.5 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{candidate.recruiterName}</p>
                </div>
                <div>
                  <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Candidate Source</span>
                  <p className={`font-medium mt-0.5 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{candidate.source}</p>
                </div>
                <div>
                  <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Registration Date</span>
                  <p className={`font-mono font-medium mt-0.5 ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>{candidate.registrationDate}</p>
                </div>
              </div>
            </div>

            {/* KYC & Statutory Checks Grid with View Document buttons */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className={`font-bold uppercase text-[10px] tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  KYC & Statutory Verification Checks
                </h3>
                <button
                  type="button"
                  onClick={() => onOpenKycWorkspace(candidate)}
                  className="text-xs text-sky-500 hover:text-sky-400 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <span>Open Full KYC Desk</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {candidate.kycRecords.map((kyc) => {
                  const isUploaded = kyc.status !== 'Not Started' && kyc.documentAvailability !== 'Missing Document';
                  return (
                    <div
                      key={kyc.id}
                      className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                        isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-white border-slate-200'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={`font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{kyc.documentType}</p>
                          <StatusBadge type="kyc" status={kyc.status} size="sm" />
                        </div>
                        <p className={`font-mono text-[11px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          {kyc.documentNumber}
                        </p>
                        <p className="text-[10px] text-slate-400 truncate max-w-[180px] mt-0.5">
                          {kyc.documentFileName || `${kyc.documentType}_Proof.pdf`}
                        </p>
                      </div>

                      <div className="shrink-0 flex items-center gap-2">
                        {isUploaded ? (
                          <button
                            type="button"
                            onClick={() => openDocPreview(kyc)}
                            className={`px-2.5 py-1 text-xs font-semibold rounded-md border flex items-center gap-1 transition-colors cursor-pointer ${
                              isDark
                                ? 'bg-sky-950/80 text-sky-300 border-sky-800 hover:bg-sky-600 hover:text-white'
                                : 'bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-600 hover:text-white'
                            }`}
                            title="View Document Preview"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View Doc</span>
                          </button>
                        ) : (
                          <span className={`px-2 py-0.5 text-[10px] font-semibold rounded border border-dashed ${
                            isDark ? 'border-slate-700 text-slate-500 bg-slate-900' : 'border-slate-300 text-slate-400 bg-slate-50'
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

            {/* Missing Fields Warning if any */}
            {candidate.missingFields.length > 0 && (
              <div className={`p-4 rounded-xl border ${
                isDark ? 'bg-amber-950/40 border-amber-800/80 text-amber-200' : 'bg-amber-50 border-amber-200 text-amber-900'
              }`}>
                <div className="flex items-center gap-2 font-bold text-xs">
                  <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>Pending Mandatory Items ({candidate.missingFields.length})</span>
                </div>
                <ul className={`list-disc list-inside mt-2 space-y-1 text-xs ${
                  isDark ? 'text-amber-300/90' : 'text-amber-800'
                }`}>
                  {candidate.missingFields.map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* MODAL FOOTER                                                              */}
          {/* ========================================================================= */}
          <div className={`px-6 py-4 border-t flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 ${
            isDark ? 'bg-slate-950/90 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 text-xs font-semibold rounded-lg border transition-colors cursor-pointer ${
                isDark
                  ? 'border-slate-700 text-slate-300 hover:bg-slate-800'
                  : 'border-slate-300 text-slate-700 hover:bg-slate-100'
              }`}
            >
              Close
            </button>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => onOpenKycWorkspace(candidate)}
                className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 border cursor-pointer ${
                  isDark
                    ? 'text-slate-200 bg-slate-800 hover:bg-slate-700 border-slate-700'
                    : 'text-slate-700 bg-white border-slate-300 hover:bg-slate-100'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                <span>Open KYC Desk</span>
              </button>
              <button
                type="button"
                onClick={() => onOpenFullProfile(candidate)}
                className="px-5 py-2 text-xs font-semibold text-white bg-sky-600 rounded-lg hover:bg-sky-500 transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open Candidate 360</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Embedded Document Preview Modal */}
      <DocumentPreviewModal
        isOpen={Boolean(previewDoc)}
        onClose={() => setPreviewDoc(null)}
        document={previewDoc}
      />
    </>
  );
};
