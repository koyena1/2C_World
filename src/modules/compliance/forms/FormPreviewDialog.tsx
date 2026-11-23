import React, { useState } from 'react';
import { CheckCircle2, Printer, Undo2 } from 'lucide-react';
import { Chip } from '../../dashboard/command-center/shared';
import type { FormDef, FormSubmission } from '../../../data/mockComplianceFormsData';
import type { Candidate } from '../../../types/onboarding';
import { Dialog, Field, fmtDate } from '../esic/ui';
import { candidateName } from './FormFillerDialog';
import { STATUS_TONE } from './statusTone';

const displayValue = (v: string | undefined, type: string) => (!v ? '-' : type === 'date' ? fmtDate(v) : v);

/** Print the form through a hidden iframe so only the form is printed, not the whole portal. */
const printForm = (form: FormDef, candidate: Candidate, sub: FormSubmission) => {
  const esc = (s: string) => s.replace(/[&<>]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[ch] ?? ch);
  const sections = form.sections
    .map(
      (s) =>
        `<h3>${esc(s.title)}</h3><table>${s.fields
          .map((f) => `<tr><th>${esc(f.label)}</th><td>${esc(displayValue(sub.values[f.key], f.type))}</td></tr>`)
          .join('')}</table>`
    )
    .join('');
  const html = `<html><head><title>${esc(form.code)}</title><style>body{font:13px Arial,sans-serif;padding:28px;color:#111}h1{text-align:center;margin:0}p.c{text-align:center;margin:2px 0 14px;color:#555}h3{margin:16px 0 6px;font-size:13px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #999;padding:6px 8px;text-align:left;vertical-align:top}th{width:38%;background:#f2f2f2;font-weight:600}.sig{margin-top:24px;display:flex;justify-content:space-between}</style></head><body><h1>${esc(form.code)}</h1><p class="c">${esc(form.name)} · ${esc(form.authority)}</p><p>Employee: <b>${esc(candidateName(candidate))}</b> · ${esc(candidate.clientName)}</p>${sections}<p style="margin-top:16px">${esc(form.declaration)}</p><div class="sig"><span>E-signed by: <b><i>${esc(sub.signName || '-')}</i></b></span><span>Date: ${esc(fmtDate(sub.signDate))}</span></div></body></html>`;
  const frame = document.createElement('iframe');
  frame.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0';
  document.body.appendChild(frame);
  const doc = frame.contentDocument;
  if (!doc) return;
  doc.open();
  doc.write(html);
  doc.close();
  frame.contentWindow?.focus();
  frame.contentWindow?.print();
  window.setTimeout(() => frame.remove(), 1500);
};

interface Props {
  form: FormDef;
  candidate: Candidate;
  submission: FormSubmission;
  canReview: boolean;
  onVerify: () => void;
  onReturn: (remarks: string) => void;
  onClose: () => void;
}

/** Read-only view of a submitted form, with print and HR Verify / Return actions. */
export const FormPreviewDialog: React.FC<Props> = ({ form, candidate, submission, canReview, onVerify, onReturn, onClose }) => {
  const [returning, setReturning] = useState(false);
  const [remarks, setRemarks] = useState('');
  const [error, setError] = useState('');
  const reviewable = canReview && submission.status === 'Submitted';

  const confirmReturn = () => {
    if (remarks.trim().length < 5) {
      setError('Write what the employee needs to correct (at least a few words).');
      return;
    }
    onReturn(remarks.trim());
  };

  return (
    <Dialog
      title={`${form.name} · Preview`}
      subtitle={`${candidateName(candidate)} · ${candidate.clientName}`}
      onClose={onClose}
      widthClass="max-w-3xl"
      footer={
        <>
          <button type="button" className="cc-btn cc-btn-secondary mr-auto" onClick={() => printForm(form, candidate, submission)}>
            <Printer className="w-3.5 h-3.5" /> Print
          </button>
          {reviewable && !returning && (
            <>
              <button type="button" className="cc-btn cc-btn-tone tone-warn" onClick={() => setReturning(true)}>
                <Undo2 className="w-3.5 h-3.5" /> Return with remarks
              </button>
              <button type="button" className="cc-btn cc-btn-primary" onClick={onVerify}>
                <CheckCircle2 className="w-3.5 h-3.5" /> Verify form
              </button>
            </>
          )}
          {reviewable && returning && (
            <>
              <button type="button" className="cc-btn cc-btn-secondary" onClick={() => setReturning(false)}>
                Back
              </button>
              <button type="button" className="cc-btn cc-btn-primary" onClick={confirmReturn}>
                Send back to employee
              </button>
            </>
          )}
          {!reviewable && (
            <button type="button" className="cc-btn cc-btn-secondary" onClick={onClose}>
              Close
            </button>
          )}
        </>
      }
    >
      <div className="flex flex-wrap items-center gap-2 mb-3 text-xs">
        <Chip tone={STATUS_TONE[submission.status]}>{submission.status}</Chip>
        {submission.submittedAt && <span className="cc-muted">Submitted {fmtDate(submission.submittedAt)}</span>}
        {submission.verifiedBy && (
          <span className="cc-muted">
            · Verified by {submission.verifiedBy} on {fmtDate(submission.verifiedAt)}
          </span>
        )}
      </div>
      {submission.status === 'Returned' && submission.remarks && (
        <div className="cc-callout tone-warn mb-3">
          <span>
            <b className="cc-title">Returned with remarks:</b> {submission.remarks}
          </span>
        </div>
      )}
      <div className="rounded-lg border p-3 sm:p-5 space-y-4" style={{ borderColor: 'var(--cc-card-border)' }}>
        <div className="text-center">
          <p className="cc-muted text-[10px] font-semibold uppercase tracking-widest">{form.authority}</p>
          <h4 className="cc-title text-base font-bold">{form.code}</h4>
        </div>
        {form.sections.map((s) => (
          <div key={s.title}>
            <h5 className="cc-title text-xs font-bold mb-1.5">{s.title}</h5>
            <dl className="grid grid-cols-1 sm:grid-cols-2 border rounded-lg overflow-hidden text-xs" style={{ borderColor: 'var(--cc-divider)' }}>
              {s.fields.map((f) => (
                <div key={f.key} className={`px-3 py-2 border-b sm:odd:border-r ${f.full ? 'sm:col-span-2 sm:!border-r-0' : ''}`} style={{ borderColor: 'var(--cc-divider)' }}>
                  <dt className="cc-muted text-[10px] font-semibold">{f.label}</dt>
                  <dd className="cc-title font-medium break-words">{displayValue(submission.values[f.key], f.type)}</dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
        <div className="border-t pt-3 text-xs" style={{ borderColor: 'var(--cc-divider)' }}>
          <p style={{ color: 'var(--cc-text)' }}>{form.declaration}</p>
          <p className="mt-2">
            E-signed by <b className="cc-title italic">{submission.signName || 'not signed yet'}</b>
            <span className="cc-muted"> · {fmtDate(submission.signDate)}</span>
          </p>
        </div>
      </div>
      {reviewable && returning && (
        <div className="mt-4">
          <Field label="Remarks for the employee" required error={error}>
            <textarea
              className="cc-input !h-auto py-2"
              rows={3}
              value={remarks}
              onChange={(e) => {
                setRemarks(e.target.value);
                setError('');
              }}
              placeholder="Example: Nominee date of birth does not match Aadhaar. Please correct it."
            />
          </Field>
        </div>
      )}
    </Dialog>
  );
};
