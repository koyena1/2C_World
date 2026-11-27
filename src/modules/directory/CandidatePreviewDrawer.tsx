import React, { useState } from 'react';
import { X, ExternalLink, ShieldCheck, AlertCircle, ChevronRight, Eye, Check, Copy, Pencil, BellRing, IdCard } from 'lucide-react';
import { Candidate } from '../../types/onboarding';
import { StatusBadge } from '../../components/common/StatusBadge';
import { SectionCard } from '../../components/page/SectionCard';
import { ProgressBar } from '../dashboard/command-center/shared';
import { DocumentPreviewModal, DocumentPreviewData } from '../../components/common/DocumentPreviewModal';
import { useRole } from '../../context/RoleContext';
import { logAudit } from '../hr-ops/auditStore';
import { EditCandidateDialog, IdCardDialog, SendNotificationDialog } from './CandidateActionDialogs';

interface CandidatePreviewDrawerProps {
  candidate: Candidate | null;
  onClose: () => void;
  onOpenFullProfile: (candidate: Candidate) => void;
  onOpenKycWorkspace: (candidate: Candidate) => void;
  /** Saves edits made in the Edit Candidate dialog. */
  onUpdateCandidate?: (candidate: Candidate) => void;
  /** Shows a confirmation toast (notification sent, ID card generated ...). */
  onToast?: (message: string) => void;
}

/** An individual info tile: light-blue background + border on hover (.cc-card-hover), never on the section around it. */
const TILE =
  'cc-card-hover rounded-xl border border-[color:var(--cc-card-border)] bg-[color:var(--cc-card-bg)] p-3 min-w-0';
const LABEL = 'cc-muted block text-[10px] font-semibold uppercase tracking-wide';

const Field: React.FC<{ label: string; children: React.ReactNode; className?: string }> = ({ label, children, className = '' }) => (
  <div className={TILE}>
    <span className={LABEL}>{label}</span>
    <p className={`cc-title text-xs font-semibold mt-1 break-words ${className}`}>{children}</p>
  </div>
);

export const CandidatePreviewDrawer: React.FC<CandidatePreviewDrawerProps> = ({
  candidate,
  onClose,
  onOpenFullProfile,
  onOpenKycWorkspace,
  onUpdateCandidate,
  onToast,
}) => {
  const { actor } = useRole();
  const [dialog, setDialog] = useState<'edit' | 'notify' | 'idcard' | null>(null);
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
        className="fixed inset-0 z-50 overflow-hidden bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-6"
        role="dialog"
        aria-modal="true"
        aria-label="Candidate Details"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        <div
          className="w-full max-w-4xl max-h-[94vh] sm:max-h-[90vh] rounded-[1.25rem] shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 border border-[color:var(--panel-border)] text-xs cc-text"
          style={{ background: 'var(--panel-bg)' }}
        >
          {/* HEADER */}
          <div className="px-4 sm:px-6 py-3 border-b border-[color:var(--cc-topbar-border)] bg-[color:var(--cc-topbar-bg)] flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <span className="cc-accent-chip font-mono text-xs font-bold px-2.5 py-1 rounded-lg whitespace-nowrap">{candidate.userId}</span>
              <div className="min-w-0">
                <h1 className="cc-title text-sm font-bold leading-tight">Candidate Details</h1>
                <p className="cc-muted text-[11px] truncate">{candidate.clientName}</p>
              </div>
            </div>
            <button type="button" onClick={onClose} className="cc-btn cc-btn-secondary !w-8 !h-8 !px-0 shrink-0" title="Close" aria-label="Close">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* BODY (scrolls) */}
          <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-3 sm:p-6 flex flex-col gap-3 sm:gap-4">
            {/* Candidate summary */}
            <section className="cc-card p-3.5 sm:p-5 flex flex-col gap-3.5 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 min-w-0">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="cc-accent-chip w-12 h-12 rounded-full flex items-center justify-center font-bold text-base shrink-0">
                  {candidate.firstName[0]}{candidate.lastName[0]}
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <h2 className="cc-title text-base sm:text-lg font-bold break-words">{candidate.firstName} {candidate.lastName}</h2>
                    {candidate.oldEmployeeId && (
                      <span className="cc-muted text-[10px] px-2 py-0.5 rounded-md border border-[color:var(--cc-card-border)] font-mono">
                        Ex-Emp: {candidate.oldEmployeeId}
                      </span>
                    )}
                  </div>
                  <p className="cc-muted text-xs font-medium mt-0.5">{candidate.designation} · {candidate.department}</p>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <StatusBadge type="joining" status={candidate.joiningStatus} />
                    <StatusBadge type="penny" status={candidate.pennyTestStatus} />
                  </div>
                </div>
              </div>

              <div className="sm:w-48 shrink-0 border-t sm:border-t-0 border-[color:var(--cc-divider)] pt-3 sm:pt-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="cc-muted text-[10px] uppercase tracking-wider font-semibold">Profile Completion</span>
                  <span className="cc-title font-mono text-sm font-bold">{candidate.onboardingCompletionPct}%</span>
                </div>
                <ProgressBar value={candidate.onboardingCompletionPct} tone="info" className="mt-1.5" label="Profile completion" />
              </div>
              </div>

              {/* Candidate actions */}
              <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-[color:var(--cc-divider)]">
                <button type="button" onClick={() => setDialog('edit')} className="cc-btn cc-btn-secondary !h-8 flex-1 min-[480px]:flex-none">
                  <Pencil className="w-3.5 h-3.5 text-[color:var(--cc-accent)]" aria-hidden />
                  <span>Edit Candidate</span>
                </button>
                <button type="button" onClick={() => setDialog('notify')} className="cc-btn cc-btn-secondary !h-8 flex-1 min-[480px]:flex-none">
                  <BellRing className="w-3.5 h-3.5 text-[color:var(--cc-warn)]" aria-hidden />
                  <span>Send Notification</span>
                </button>
                <button type="button" onClick={() => setDialog('idcard')} className="cc-btn cc-btn-secondary !h-8 flex-1 min-[480px]:flex-none">
                  <IdCard className="w-3.5 h-3.5 text-[color:var(--cc-good)]" aria-hidden />
                  <span>Generate ID Card</span>
                </button>
              </div>
            </section>

            {/* Contact & Communication */}
            <SectionCard title="Contact & Communication">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3">
                <div className={`${TILE} flex items-center justify-between gap-2`}>
                  <div className="min-w-0">
                    <span className={LABEL}>Email Address</span>
                    <p className="cc-title text-xs font-semibold mt-1 truncate">{candidate.email}</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyEmail}
                    className="p-1.5 rounded-md cc-muted hover:text-[color:var(--cc-accent)] hover:bg-[color:var(--cc-accent-soft)] cursor-pointer shrink-0 transition-colors"
                    title="Copy Email"
                    aria-label="Copy email"
                  >
                    {copiedEmail ? <Check className="w-3.5 h-3.5 text-[color:var(--cc-good)]" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <div className={`${TILE} flex items-center justify-between gap-2`}>
                  <div className="min-w-0">
                    <span className={LABEL}>Contact Phone</span>
                    <p className="cc-title text-xs font-semibold mt-1">{candidate.phone}</p>
                  </div>
                  <span className="tone-good tone-chip text-[10px] px-1.5 py-0.5 rounded-md font-semibold whitespace-nowrap shrink-0">
                    WhatsApp Active
                  </span>
                </div>

                <Field label="Emergency Contact" className="truncate">{candidate.emergencyContact}</Field>
              </div>
            </SectionCard>

            {/* Deployment & Sourcing */}
            <SectionCard title="Deployment & Sourcing">
              <div className="grid grid-cols-1 min-[420px]:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
                <Field label="Client Organization">{candidate.clientName}</Field>
                <Field label="Work Location / Branch">{candidate.workLocation}</Field>
                <Field label="Date of Joining" className="font-mono">{candidate.dateOfJoining}</Field>
                <Field label="End of Contract" className="font-mono">{candidate.endOfContract || 'Ongoing / Indefinite'}</Field>
                <Field label="Gross Monthly CTC" className="font-mono !text-[color:var(--cc-good)]">
                  ₹ {candidate.grossSalaryMonthly?.toLocaleString('en-IN')}
                </Field>
                <Field label="Assigned Recruiter">{candidate.recruiterName}</Field>
                <Field label="Candidate Source">{candidate.source}</Field>
                <Field label="Registration Date" className="font-mono">{candidate.registrationDate}</Field>
              </div>
            </SectionCard>

            {/* KYC & Statutory Verification */}
            <SectionCard
              title="KYC & Statutory Verification Checks"
              action={
                <button
                  type="button"
                  onClick={() => onOpenKycWorkspace(candidate)}
                  className="inline-flex items-center gap-1 text-xs font-semibold cursor-pointer whitespace-nowrap text-[color:var(--cc-accent)] hover:underline"
                >
                  <span>Open Full KYC Desk</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              }
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                {candidate.kycRecords.map((kyc) => {
                  const isUploaded = kyc.status !== 'Not Started' && kyc.documentAvailability !== 'Missing Document';
                  return (
                    <div key={kyc.id} className={`${TILE} flex flex-col gap-2`}>
                      <div className="flex items-center justify-between gap-2">
                        <p className="cc-title text-sm font-bold">{kyc.documentType}</p>
                        <StatusBadge type="kyc" status={kyc.status} size="sm" />
                      </div>
                      <div className="min-w-0">
                        <p className="cc-text font-mono text-[11px] break-all">{kyc.documentNumber}</p>
                        <p className="cc-muted text-[10px] truncate mt-0.5">{kyc.documentFileName || `${kyc.documentType}_Proof.pdf`}</p>
                      </div>
                      <div className="mt-auto pt-2 border-t border-[color:var(--cc-divider)]">
                        {isUploaded ? (
                          <button
                            type="button"
                            onClick={() => openDocPreview(kyc)}
                            className="cc-btn cc-btn-tone tone-info !h-8 w-full"
                            title="View Document Preview"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View Document</span>
                          </button>
                        ) : (
                          <span className="cc-muted inline-flex items-center justify-center w-full h-8 text-[11px] font-semibold rounded-lg border border-dashed border-[color:var(--cc-card-border)]">
                            Not Uploaded
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </SectionCard>

            {/* Pending mandatory items */}
            {candidate.missingFields.length > 0 && (
              <section className="rounded-[var(--cc-card-radius)] border p-3.5 sm:p-4 bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-950/40 dark:border-amber-800/80 dark:text-amber-200">
                <div className="flex items-center gap-2 font-bold text-xs">
                  <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                  <span>Pending Mandatory Items ({candidate.missingFields.length})</span>
                </div>
                <ul className="list-disc list-inside mt-2 space-y-1 text-xs text-amber-800 dark:text-amber-300/90">
                  {candidate.missingFields.map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              </section>
            )}
          </div>

          {/* FOOTER */}
          <div className="px-4 sm:px-6 py-3 border-t border-[color:var(--cc-topbar-border)] bg-[color:var(--cc-topbar-bg)] flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2.5 shrink-0">
            <button type="button" onClick={onClose} className="cc-btn cc-btn-secondary w-full sm:w-auto">
              Close
            </button>
            <div className="flex flex-col-reverse sm:flex-row gap-2.5 sm:gap-2">
              <button type="button" onClick={() => onOpenKycWorkspace(candidate)} className="cc-btn cc-btn-secondary w-full sm:w-auto">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                <span>Open KYC Desk</span>
              </button>
              <button type="button" onClick={() => onOpenFullProfile(candidate)} className="cc-btn cc-btn-primary w-full sm:w-auto">
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open Candidate 360</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {dialog === 'edit' && (
        <EditCandidateDialog
          candidate={candidate}
          onClose={() => setDialog(null)}
          onSave={(updated) => {
            onUpdateCandidate?.(updated);
            logAudit({ area: 'candidate-directory', action: `Edited candidate details for ${updated.firstName} ${updated.lastName}`, subjectId: updated.id, actorId: actor.id, actorName: actor.name });
            onToast?.(`Candidate details updated for ${updated.firstName} ${updated.lastName}.`);
            setDialog(null);
          }}
        />
      )}
      {dialog === 'notify' && <SendNotificationDialog candidate={candidate} onClose={() => setDialog(null)} onSent={(m) => onToast?.(m)} />}
      {dialog === 'idcard' && <IdCardDialog candidate={candidate} onClose={() => setDialog(null)} onGenerated={(m) => onToast?.(m)} />}

      {/* Embedded Document Preview Modal */}
      <DocumentPreviewModal
        isOpen={Boolean(previewDoc)}
        onClose={() => setPreviewDoc(null)}
        document={previewDoc}
      />
    </>
  );
};
