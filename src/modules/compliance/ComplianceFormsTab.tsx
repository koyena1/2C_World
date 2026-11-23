import React, { useMemo, useState } from 'react';
import { BadgeCheck, ClipboardList, Eye, FileEdit, FileText, Hourglass, Search, Undo2 } from 'lucide-react';
import type { Candidate } from '../../types/onboarding';
import { SectionCard } from '../../components/page/SectionCard';
import { KpiCard } from '../../components/page/KpiCard';
import { SelectMenu } from '../../components/ui/SelectMenu';
import { Toast } from '../../components/ui/Toast';
import { useToast } from '../../hooks/useToast';
import { useRole, useFeatureAccess } from '../../context/RoleContext';
import { logAudit } from '../hr-ops/auditStore';
import { DASHBOARD_REFERENCE_DATE } from '../dashboard/dashboard.metrics';
import { Chip, ProgressBar } from '../dashboard/command-center/shared';
import { cn } from '../../utils/cn';
import {
  FORM_DEFS,
  FORM_STATUSES,
  buildInitialSubmissions,
  formById,
  submissionKey,
  type FormStatus,
  type FormSubmission,
} from '../../data/mockComplianceFormsData';
import { FormFillerDialog, candidateName } from './forms/FormFillerDialog';
import { FormPreviewDialog } from './forms/FormPreviewDialog';
import { STATUS_TONE } from './forms/statusTone';
import { ViewOnlyNote, fmtDate } from './esic/ui';

const PAGE_SIZE = 20;

interface Row {
  candidate: Candidate;
  formId: string;
  status: FormStatus;
  submission?: FormSubmission;
}

/** Compliance -> Forms: digital replication of statutory forms, per candidate, with HR verification. */
export const ComplianceFormsTab: React.FC<{ candidates: Candidate[] }> = ({ candidates }) => {
  const access = useFeatureAccess('compliance-forms');
  const { actor } = useRole();
  const canManage = access === 'manage';
  const { message, showToast, hideToast } = useToast();

  const [subs, setSubs] = useState<Record<string, FormSubmission>>(() => buildInitialSubmissions(candidates));
  const [client, setClient] = useState('all');
  const [formId, setFormId] = useState('all');
  const [status, setStatus] = useState('all');
  const [query, setQuery] = useState('');
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [filling, setFilling] = useState<Row | null>(null);
  const [previewing, setPreviewing] = useState<Row | null>(null);

  const clients = useMemo(() => Array.from(new Set(candidates.map((c) => c.clientName))).sort(), [candidates]);

  const allRows = useMemo<Row[]>(
    () =>
      candidates.flatMap((candidate) =>
        FORM_DEFS.filter((f) => f.appliesTo(candidate)).map((f) => {
          const submission = subs[submissionKey(candidate.id, f.id)];
          return { candidate, formId: f.id, status: submission?.status ?? 'Not started', submission };
        })
      ),
    [candidates, subs]
  );

  const countBy = (s: FormStatus) => allRows.filter((r) => r.status === s).length;
  const verifiedPct = allRows.length ? Math.round((countBy('Verified') / allRows.length) * 100) : 0;

  const rows = allRows.filter(
    (r) =>
      (client === 'all' || r.candidate.clientName === client) &&
      (formId === 'all' || r.formId === formId) &&
      (status === 'all' || r.status === status) &&
      (!query.trim() || candidateName(r.candidate).toLowerCase().includes(query.trim().toLowerCase()))
  );

  const log = (action: string, subjectId: string) => logAudit({ area: 'compliance-forms', action, subjectId, actorId: actor.id, actorName: actor.name });

  const write = (row: Row, patch: Partial<FormSubmission>, action: string, toast: string) => {
    const key = submissionKey(row.candidate.id, row.formId);
    const prev = subs[key];
    const blank: FormSubmission = { candidateId: row.candidate.id, formId: row.formId, status: 'Draft', values: {}, declared: false, signName: '', signDate: '', updatedAt: '' };
    const next: FormSubmission = { ...blank, ...prev, ...patch, updatedAt: DASHBOARD_REFERENCE_DATE };
    setSubs((s) => ({ ...s, [key]: next }));
    log(`${action}: ${formById(row.formId).code} for ${candidateName(row.candidate)}`, row.candidate.id);
    showToast(toast);
    return next;
  };

  return (
    <div className="cc-stack">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <KpiCard label="Forms due" value={allRows.length} detail={`${candidates.length} candidates`} icon={ClipboardList} tone="info" />
        <KpiCard label="Not started" value={countBy('Not started')} detail="No entry yet" icon={FileText} tone="muted" />
        <KpiCard label="Awaiting verification" value={countBy('Submitted')} detail="HR to verify or return" icon={Hourglass} tone="violet" />
        <KpiCard label="Verified" value={`${verifiedPct}%`} detail={`${countBy('Verified')} of ${allRows.length} forms`} icon={BadgeCheck} tone="good" />
        <KpiCard label="Returned" value={countBy('Returned')} detail="Waiting for correction" icon={Undo2} tone="bad" className="col-span-2 lg:col-span-1" />
      </div>

      <SectionCard title="Form catalogue" subtitle="Statutory forms filled online instead of on paper. Click a form to filter the list.">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {FORM_DEFS.map((f) => {
            const mine = allRows.filter((r) => r.formId === f.id);
            const done = mine.filter((r) => r.status === 'Verified').length;
            const waiting = mine.filter((r) => r.status === 'Submitted').length;
            const pct = mine.length ? Math.round((done / mine.length) * 100) : 0;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => {
                  setFormId(formId === f.id ? 'all' : f.id);
                  setLimit(PAGE_SIZE);
                }}
                className={cn('cc-card cc-card-hover text-left p-3.5 flex flex-col gap-2', formId === f.id && 'ring-2 ring-[color:var(--cc-accent)]')}
                aria-pressed={formId === f.id}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="cc-title text-sm font-bold leading-tight">{f.name}</p>
                    <p className="cc-muted text-[11px] mt-0.5">
                      {f.code} · {f.authority}
                    </p>
                  </div>
                  <Chip tone="muted">{f.appliesNote}</Chip>
                </div>
                <p className="cc-muted text-[11px] leading-snug">{f.summary}</p>
                <div>
                  <div className="flex justify-between text-[11px] mb-1">
                    <span className="cc-muted">
                      {done} of {mine.length} verified{waiting ? ` · ${waiting} to review` : ''}
                    </span>
                    <span className="cc-title font-semibold tabular-nums">{pct}%</span>
                  </div>
                  <ProgressBar value={pct} tone={pct >= 70 ? 'good' : pct >= 40 ? 'info' : 'warn'} label={`${f.name} verified`} />
                </div>
              </button>
            );
          })}
        </div>
      </SectionCard>

      <SectionCard title="Candidate forms" subtitle={`${rows.length} of ${allRows.length} forms`}>
        {!canManage && <ViewOnlyNote text="View only: you can preview forms but not fill, verify or return them." />}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 my-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 cc-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              className="cc-input !pl-8"
              placeholder="Search candidate"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setLimit(PAGE_SIZE);
              }}
              aria-label="Search candidate"
            />
          </div>
          <SelectMenu className="cc-input" value={client} onChange={(e) => { setClient(e.target.value); setLimit(PAGE_SIZE); }} aria-label="Client">
            <option value="all">All clients</option>
            {clients.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </SelectMenu>
          <SelectMenu className="cc-input" value={formId} onChange={(e) => { setFormId(e.target.value); setLimit(PAGE_SIZE); }} aria-label="Form">
            <option value="all">All forms</option>
            {FORM_DEFS.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </SelectMenu>
          <SelectMenu className="cc-input" value={status} onChange={(e) => { setStatus(e.target.value); setLimit(PAGE_SIZE); }} aria-label="Status">
            <option value="all">All statuses</option>
            {FORM_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </SelectMenu>
        </div>

        <div className="cc-table-wrap">
          <table className="cc-table">
            <thead>
              <tr>
                <th>Candidate</th>
                <th>Client</th>
                <th>Form</th>
                <th>Status</th>
                <th>Last update</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="cc-muted text-center py-6">
                    No forms match these filters.
                  </td>
                </tr>
              )}
              {rows.slice(0, limit).map((r) => {
                const def = formById(r.formId);
                const canFill = canManage && r.status !== 'Submitted' && r.status !== 'Verified';
                return (
                  <tr key={`${r.candidate.id}-${r.formId}`}>
                    <td className="cc-title font-semibold whitespace-nowrap">{candidateName(r.candidate)}</td>
                    <td className="whitespace-nowrap">{r.candidate.clientName}</td>
                    <td className="whitespace-nowrap">{def.name}</td>
                    <td>
                      <Chip tone={STATUS_TONE[r.status]}>{r.status}</Chip>
                    </td>
                    <td className="whitespace-nowrap cc-muted">{r.submission ? fmtDate(r.submission.updatedAt) : '-'}</td>
                    <td className="text-right whitespace-nowrap">
                      <span className="inline-flex gap-1.5">
                        {r.submission && r.status !== 'Draft' && (
                          <button type="button" className="cc-btn cc-btn-secondary" onClick={() => setPreviewing(r)} aria-label={`Preview ${def.code} for ${candidateName(r.candidate)}`}>
                            <Eye className="w-3.5 h-3.5" /> {r.status === 'Submitted' && canManage ? 'Review' : 'Preview'}
                          </button>
                        )}
                        {canFill && (
                          <button type="button" className="cc-btn cc-btn-primary" onClick={() => setFilling(r)} aria-label={`Fill ${def.code} for ${candidateName(r.candidate)}`}>
                            <FileEdit className="w-3.5 h-3.5" /> {r.status === 'Draft' ? 'Continue' : r.status === 'Returned' ? 'Correct' : 'Fill form'}
                          </button>
                        )}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {rows.length > limit && (
          <div className="flex justify-center mt-3">
            <button type="button" className="cc-btn cc-btn-secondary" onClick={() => setLimit((l) => l + PAGE_SIZE)}>
              Show more ({rows.length - limit} left)
            </button>
          </div>
        )}
      </SectionCard>

      {filling && (
        <FormFillerDialog
          form={formById(filling.formId)}
          candidate={filling.candidate}
          submission={filling.submission}
          onClose={() => setFilling(null)}
          onSaveDraft={(data) => {
            write(filling, { ...data, status: 'Draft' }, 'Saved draft', 'Draft saved');
            setFilling(null);
          }}
          onSubmit={(data) => {
            write(filling, { ...data, status: 'Submitted', submittedAt: DASHBOARD_REFERENCE_DATE, remarks: undefined }, 'Submitted', `${formById(filling.formId).code} submitted for verification`);
            setFilling(null);
          }}
        />
      )}

      {previewing && previewing.submission && (
        <FormPreviewDialog
          form={formById(previewing.formId)}
          candidate={previewing.candidate}
          submission={previewing.submission}
          canReview={canManage}
          onClose={() => setPreviewing(null)}
          onVerify={() => {
            write(previewing, { status: 'Verified', verifiedBy: actor.name, verifiedAt: DASHBOARD_REFERENCE_DATE, remarks: undefined }, 'Verified', `${formById(previewing.formId).code} verified`);
            setPreviewing(null);
          }}
          onReturn={(remarks) => {
            write(previewing, { status: 'Returned', remarks, verifiedBy: undefined, verifiedAt: undefined }, `Returned with remarks "${remarks}"`, 'Form returned to the employee with your remarks');
            setPreviewing(null);
          }}
        />
      )}

      <Toast message={message} onClose={hideToast} />
    </div>
  );
};
