import React, { useState } from 'react';
import { PenLine } from 'lucide-react';
import { SelectMenu } from '../../../components/ui/SelectMenu';
import { cn } from '../../../utils/cn';
import { DASHBOARD_REFERENCE_DATE } from '../../dashboard/dashboard.metrics';
import { prefillValues, validateForm, type FormDef, type FormField, type FormSubmission } from '../../../data/mockComplianceFormsData';
import type { Candidate } from '../../../types/onboarding';
import { Dialog, Field } from '../esic/ui';

export const candidateName = (c: Candidate) => `${c.firstName} ${c.lastName}`.trim();

interface Props {
  form: FormDef;
  candidate: Candidate;
  submission?: FormSubmission;
  onSaveDraft: (data: Pick<FormSubmission, 'values' | 'declared' | 'signName' | 'signDate'>) => void;
  onSubmit: (data: Pick<FormSubmission, 'values' | 'declared' | 'signName' | 'signDate'>) => void;
  onClose: () => void;
}

const Control: React.FC<{ field: FormField; value: string; onChange: (v: string) => void; invalid: boolean }> = ({ field, value, onChange, invalid }) => {
  const cls = cn('cc-input', invalid && 'ring-2 ring-[color:var(--tone)] tone-bad');
  if (field.type === 'select') {
    return (
      <SelectMenu className={cls} value={value} onChange={(e) => onChange(e.target.value)} aria-label={field.label}>
        <option value="">Select</option>
        {field.options?.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </SelectMenu>
    );
  }
  if (field.type === 'textarea') {
    return <textarea className={cn(cls, '!h-auto py-2')} rows={2} value={value} onChange={(e) => onChange(e.target.value)} aria-label={field.label} />;
  }
  return (
    <input
      className={cls}
      type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
      value={value}
      placeholder={field.placeholder}
      onChange={(e) => onChange(e.target.value)}
      aria-label={field.label}
    />
  );
};

/** Fills a statutory form: sections mirror the paper layout, followed by declaration and typed e-signature. */
export const FormFillerDialog: React.FC<Props> = ({ form, candidate, submission, onSaveDraft, onSubmit, onClose }) => {
  const name = candidateName(candidate);
  const [values, setValues] = useState<Record<string, string>>(() => {
    const base = prefillValues(form, candidate);
    const saved = submission?.values ?? {};
    return Object.fromEntries(Object.keys(base).map((k) => [k, saved[k] || base[k]]));
  });
  const [declared, setDeclared] = useState(submission?.declared ?? false);
  const [signName, setSignName] = useState(submission?.signName ?? '');
  const [signDate, setSignDate] = useState(submission?.signDate || DASHBOARD_REFERENCE_DATE);
  const [attempted, setAttempted] = useState(false);

  const fieldErrors = validateForm(form, values);
  const signErrors: Record<string, string> = {};
  if (!declared) signErrors.declared = 'Tick the declaration to continue.';
  if (!signName.trim()) signErrors.signName = 'Type your full name to sign.';
  else if (signName.trim().toLowerCase() !== name.toLowerCase()) signErrors.signName = `Type the name exactly as ${name} to sign.`;
  if (!signDate) signErrors.signDate = 'Choose the signing date.';
  else if (signDate > DASHBOARD_REFERENCE_DATE) signErrors.signDate = 'Signing date cannot be in the future.';

  const errors = { ...fieldErrors, ...signErrors };
  const errorCount = Object.keys(errors).length;
  const show = (key: string) => (attempted ? errors[key] : undefined);

  const payload = { values, declared, signName: signName.trim(), signDate };
  const submit = () => {
    setAttempted(true);
    if (errorCount === 0) onSubmit(payload);
  };

  return (
    <Dialog
      title={`${form.name}`}
      subtitle={`${name} · ${candidate.clientName}`}
      onClose={onClose}
      widthClass="max-w-3xl"
      footer={
        <>
          {attempted && errorCount > 0 && (
            <span className="tone-bad text-[11px] mr-auto" style={{ color: 'var(--tone)' }} role="alert">
              {errorCount} item{errorCount > 1 ? 's' : ''} need attention
            </span>
          )}
          <button type="button" className="cc-btn cc-btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="cc-btn cc-btn-secondary" onClick={() => onSaveDraft(payload)}>
            Save draft
          </button>
          <button type="button" className="cc-btn cc-btn-primary" onClick={submit}>
            Submit form
          </button>
        </>
      }
    >
      {submission?.status === 'Returned' && submission.remarks && (
        <div className="cc-callout tone-warn mb-4">
          <span>
            <b className="cc-title">Returned by HR:</b> {submission.remarks}
          </span>
        </div>
      )}
      <div className="rounded-lg border p-3 sm:p-5 space-y-5" style={{ borderColor: 'var(--cc-card-border)' }}>
        <div className="text-center border-b pb-3" style={{ borderColor: 'var(--cc-divider)' }}>
          <p className="cc-muted text-[10px] font-semibold uppercase tracking-widest">{form.authority}</p>
          <h4 className="cc-title text-base font-bold">{form.code}</h4>
          <p className="cc-muted text-xs">{form.summary}</p>
        </div>

        {form.sections.map((section) => (
          <fieldset key={section.title} className="min-w-0">
            <legend className="cc-title text-xs font-bold mb-2">{section.title}</legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {section.fields.map((f) => (
                <Field key={f.key} label={f.label} required={f.required} error={show(f.key)} className={f.full ? 'sm:col-span-2' : undefined}>
                  <Control field={f} value={values[f.key] ?? ''} onChange={(v) => setValues((s) => ({ ...s, [f.key]: v }))} invalid={Boolean(show(f.key))} />
                </Field>
              ))}
            </div>
          </fieldset>
        ))}

        <div className="border-t pt-4 space-y-3" style={{ borderColor: 'var(--cc-divider)' }}>
          <h5 className="cc-title text-xs font-bold">Declaration and e-signature</h5>
          <label className="flex items-start gap-2 text-xs cursor-pointer">
            <input type="checkbox" className="mt-0.5" checked={declared} onChange={(e) => setDeclared(e.target.checked)} />
            <span style={{ color: 'var(--cc-text)' }}>{form.declaration}</span>
          </label>
          {show('declared') && (
            <p className="tone-bad text-[11px]" style={{ color: 'var(--tone)' }} role="alert">
              {show('declared')}
            </p>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Type your full name to sign" required error={show('signName')} hint={`Name on record: ${name}`}>
              <div className="relative">
                <PenLine className="w-3.5 h-3.5 cc-muted absolute left-3 top-1/2 -translate-y-1/2" />
                <input className="cc-input !pl-8 italic" value={signName} onChange={(e) => setSignName(e.target.value)} aria-label="E-signature name" />
              </div>
            </Field>
            <Field label="Date" required error={show('signDate')}>
              <input type="date" className="cc-input" value={signDate} max={DASHBOARD_REFERENCE_DATE} onChange={(e) => setSignDate(e.target.value)} aria-label="Signing date" />
            </Field>
          </div>
        </div>
      </div>
    </Dialog>
  );
};
