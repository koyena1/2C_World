import React, { useRef, useState } from 'react';
import { PenLine, Upload, CheckCircle2, AlertCircle, Ban, RefreshCw, FileSignature } from 'lucide-react';
import type { Candidate } from '../../types/onboarding';
import { useIsSignatureEnabled } from '../hr-ops/clientFeatureStore';
import { useDocumentRules } from '../hr-ops/documentRulesStore';
import { logAudit, formatAuditTime } from '../hr-ops/auditStore';
import { useFeatureAccess, useRole } from '../../context/RoleContext';
import { AllowedFileSizeHint } from '../../components/common/AllowedFileSizeHint';
import { LETTER_VARIABLES } from '../../data/mockLetterBuilderData';
import {
  SIGNATURE_CONSENT_TEXT,
  saveSignature,
  useSignature,
  type StoredSignature,
} from '../../data/mockSignatureData';

/** Splits template text on {{variables}}; unresolved ones are highlighted. */
export const renderLetterBody = (body: string, resolve: (key: string) => string | undefined): React.ReactNode[] =>
  body.split(/(\{\{\s*\w+\s*\}\})/g).map((part, i) => {
    const m = part.match(/^\{\{\s*(\w+)\s*\}\}$/);
    if (!m) return <React.Fragment key={i}>{part}</React.Fragment>;
    const value = resolve(m[1]);
    return value ? (
      <strong key={i}>{value}</strong>
    ) : (
      <mark key={i} className="tone-bad tone-chip rounded px-1 font-mono text-[11px]" title="No data for this variable">
        {`{{${m[1]}}}`}
      </mark>
    );
  });

interface LetterDocumentProps {
  title: string;
  body: string;
  candidate: Candidate;
  /** Signature image to place in the signature block automatically; undefined = none on file. */
  signatureUrl?: string;
  /** Explains why there is no signature (feature off, not uploaded). */
  signatureNote?: string;
}

/** A letter on "paper" with the employee's signature placed automatically in the signature block. */
export const LetterDocument: React.FC<LetterDocumentProps> = ({ title, body, candidate, signatureUrl, signatureNote }) => {
  const resolve = (key: string) => LETTER_VARIABLES.find((v) => v.key === key)?.resolve(candidate);
  return (
    <div className="cc-card p-4 sm:p-6 text-[13px] leading-relaxed">
      <div className="flex items-center justify-between gap-2 border-b pb-2 mb-3" style={{ borderColor: 'var(--cc-border, rgba(148,163,184,.4))' }}>
        <span className="cc-title font-bold text-sm">2COMS</span>
        <span className="cc-muted text-[11px] uppercase tracking-wide">{title}</span>
      </div>
      <div className="cc-title whitespace-pre-wrap break-words">{renderLetterBody(body, resolve)}</div>
      <div className="mt-5 pt-3 border-t border-dashed" style={{ borderColor: 'var(--cc-border, rgba(148,163,184,.5))' }}>
        <p className="cc-muted text-[11px] mb-1">Accepted by employee</p>
        {signatureUrl ? (
          <>
            <img src={signatureUrl} alt={`Signature of ${candidate.firstName} ${candidate.lastName}`} className="h-14 max-w-[220px] object-contain bg-white rounded" />
            <p className="cc-muted text-[11px] mt-1">Signature applied automatically from the employee's stored signature</p>
          </>
        ) : (
          <p className="cc-muted text-xs italic">{signatureNote ?? 'Signature will appear here once the employee uploads one.'}</p>
        )}
        <p className="cc-title text-xs font-semibold mt-1">{candidate.firstName} {candidate.lastName}</p>
      </div>
    </div>
  );
};

/** Employee-facing "Signature" section (embedded in the Candidate 360 profile). */
export const SignatureUploadPanel: React.FC<{ candidate: Candidate }> = ({ candidate }) => {
  const enabled = useIsSignatureEnabled(candidate.clientName);
  const rule = useDocumentRules().find((r) => r.id === 'signature');
  const stored = useSignature(candidate.id);
  const access = useFeatureAccess('signature-upload');
  const { actor } = useRole();
  const readOnly = access !== 'manage';

  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [replacing, setReplacing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setFile(null);
    setPreviewUrl(null);
    setConsent(false);
    setError(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const ext = f.name.split('.').pop()?.toUpperCase().replace('JPEG', 'JPG') ?? '';
    if (rule && !rule.formats.includes(ext)) {
      setError(`"${f.name}" is not allowed. Upload a ${rule.formats.join(' or ')} file.`);
      setFile(null);
      setPreviewUrl(null);
      return;
    }
    if (rule && f.size > rule.maxMb * 1024 * 1024) {
      setError(`"${f.name}" is ${(f.size / 1048576).toFixed(2)} MB; the maximum is ${rule.maxMb} MB.`);
      setFile(null);
      setPreviewUrl(null);
      return;
    }
    setError(null);
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
  };

  const submit = () => {
    if (!file || !previewUrl || !consent || readOnly) return;
    const sig: StoredSignature = {
      candidateId: candidate.id,
      imageUrl: previewUrl,
      fileName: file.name,
      consentText: SIGNATURE_CONSENT_TEXT,
      consentAt: new Date().toISOString(),
      submittedBy: `${actor.name} (on behalf of employee)`,
    };
    saveSignature(sig);
    logAudit({
      area: 'signature-upload',
      action: `${replacing ? 'Replaced' : 'Uploaded'} signature for ${candidate.firstName} ${candidate.lastName} with consent`,
      subjectId: candidate.id,
      actorId: actor.id,
      actorName: actor.name,
    });
    setPreviewUrl(null); // the store now owns the object URL
    setFile(null);
    setConsent(false);
    setReplacing(false);
    if (inputRef.current) inputRef.current.value = '';
  };

  if (!enabled) {
    return (
      <div className="cc-card p-4 flex items-start gap-3" role="status">
        <Ban className="w-5 h-5 shrink-0 cc-muted mt-0.5" />
        <div>
          <h3 className="cc-title text-sm font-bold">Signature not enabled for {candidate.clientName}</h3>
          <p className="cc-muted text-xs mt-1">
            Physical signature upload is switched off for this client, so no signature is collected or applied to letters.
            An admin can turn it on in User Settings, Client Features.
          </p>
        </div>
      </div>
    );
  }

  const showForm = !stored || replacing;
  const canSubmit = Boolean(file) && consent && !readOnly;

  return (
    <div className="space-y-3">
      <div className="cc-card p-4 space-y-3">
        <div className="flex items-center gap-2">
          <PenLine className="w-4 h-4 text-purple-500" />
          <h3 className="cc-title text-sm font-bold">Signature</h3>
          {stored && !replacing && <span className="tone-good tone-chip text-[11px] px-2 py-0.5 rounded-full">On file</span>}
          {readOnly && <span className="cc-muted text-[11px] ml-auto">View only</span>}
        </div>

        {stored && !replacing && (
          <div className="space-y-2">
            <img src={stored.imageUrl} alt="Stored signature" className="h-16 max-w-[240px] object-contain bg-white rounded border border-slate-200" />
            <dl className="text-xs grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
              <dt className="cc-muted">File</dt><dd className="cc-title break-all">{stored.fileName}</dd>
              <dt className="cc-muted">Consent given</dt><dd className="cc-title">{formatAuditTime(stored.consentAt)}</dd>
              <dt className="cc-muted">Submitted by</dt><dd className="cc-title">{stored.submittedBy}</dd>
            </dl>
            <p className="cc-muted text-[11px] flex gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 tone-good tone-text shrink-0" />{stored.consentText}</p>
            <button type="button" className="cc-btn cc-btn-secondary" disabled={readOnly} onClick={() => { setReplacing(true); reset(); }}>
              <RefreshCw className="w-3.5 h-3.5" /> Replace signature
            </button>
          </div>
        )}

        {showForm && (
          <div className="space-y-3">
            <div>
              <label className="cc-title text-xs font-semibold block mb-1" htmlFor={`sig-file-${candidate.id}`}>Upload signature image</label>
              <input
                id={`sig-file-${candidate.id}`}
                ref={inputRef}
                type="file"
                accept=".jpg,.jpeg,.png"
                disabled={readOnly}
                onChange={onPick}
                className="cc-input w-full text-xs"
              />
              <AllowedFileSizeHint rule="signature" className="mt-1" />
              {error && (
                <p role="alert" className="tone-bad tone-text text-xs mt-1.5 flex gap-1.5"><AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />{error}</p>
              )}
            </div>
            {previewUrl && (
              <div>
                <p className="cc-muted text-[11px] mb-1">Preview</p>
                <img src={previewUrl} alt="Selected signature preview" className="h-16 max-w-[240px] object-contain bg-white rounded border border-slate-200" />
              </div>
            )}
            <label className="flex items-start gap-2 text-xs cc-title cursor-pointer">
              <input type="checkbox" className="mt-0.5 w-4 h-4 shrink-0" checked={consent} disabled={readOnly} onChange={(e) => setConsent(e.target.checked)} />
              <span>{SIGNATURE_CONSENT_TEXT} <span className="tone-bad tone-text">*</span></span>
            </label>
            <div className="flex flex-wrap gap-2">
              <button type="button" className="cc-btn cc-btn-primary" disabled={!canSubmit} onClick={submit}>
                <Upload className="w-3.5 h-3.5" /> Submit signature
              </button>
              {replacing && (
                <button type="button" className="cc-btn cc-btn-secondary" onClick={() => { setReplacing(false); reset(); }}>Cancel</button>
              )}
            </div>
            {!canSubmit && !readOnly && (
              <p className="cc-muted text-[11px]">Choose a signature file and tick the consent box to enable Submit.</p>
            )}
          </div>
        )}
      </div>

      <div>
        <p className="cc-title text-xs font-semibold mb-1.5 flex items-center gap-1.5">
          <FileSignature className="w-3.5 h-3.5 text-purple-500" /> Auto-applied to documents
        </p>
        <LetterDocument
          title="Sample document"
          candidate={candidate}
          body={`Dear {{candidate_name}},\n\nThis letter confirms your role as {{designation}} with {{client_name}}.`}
          signatureUrl={stored?.imageUrl}
          signatureNote="No signature on file yet. Once uploaded, it appears here and on every letter automatically."
        />
      </div>
    </div>
  );
};
