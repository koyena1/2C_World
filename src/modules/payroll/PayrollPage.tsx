import React, { useMemo, useState } from 'react';
import { CheckCircle2, CircleAlert, ClipboardCheck, Users, Wallet } from 'lucide-react';
import type { Candidate } from '../../types/onboarding';
import { PageHeader } from '../../components/page/PageHeader';
import { SectionCard } from '../../components/page/SectionCard';
import { KpiCard } from '../../components/page/KpiCard';
import { KpiDetailPanel, type KpiDetailData } from '../../components/page/KpiDetailPanel';
import { useKpiDetail } from '../../hooks/useKpiDetail';
import { Toast } from '../../components/ui/Toast';
import { useToast } from '../../hooks/useToast';
import { useFeatureAccess, useRole } from '../../context/RoleContext';
import { logAudit } from '../hr-ops/auditStore';

const STEPS = ['Validate data', 'Lock attendance', 'Compute', 'Approve', 'Disburse'] as const;

interface Check {
  label: string;
  pass: boolean;
}

/** The payroll pre-conditions of one joined employee, taken from the live candidate record. */
const checksFor = (c: Candidate): Check[] => {
  const uan = c.kycRecords.find((r) => r.documentType === 'UAN');
  return [
    { label: 'KYC verified', pass: c.overallKycStatus === 'Verified' },
    { label: 'Bank account verified (₹1 test)', pass: c.pennyTestStatus === 'Verified' },
    { label: 'UAN verified or not applicable', pass: !uan || uan.status === 'Verified' || uan.status === 'Skipped' },
    { label: 'Joining date recorded', pass: Boolean(c.dateOfJoining) },
  ];
};

/** Payroll run workflow for joined employees: validate data first, then each step unlocks in order (simulated, no amounts). */
export const PayrollPage: React.FC<{ candidates: Candidate[] }> = ({ candidates }) => {
  const access = useFeatureAccess('payroll');
  const { actor } = useRole();
  const { message, showToast, hideToast } = useToast();
  const canRun = access === 'manage';
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);

  const rows = useMemo(
    () => candidates.filter((c) => c.joiningStatus === 'Joined').map((c) => ({ c, checks: checksFor(c) })),
    [candidates]
  );
  const failing = rows.filter((r) => r.checks.some((k) => !k.pass));
  const ready = rows.length - failing.length;
  const { activeId, toggle, close, isActive } = useKpiDetail<'joined' | 'ready' | 'open'>();
  const detail: KpiDetailData | null = activeId
    ? {
        title: activeId === 'joined' ? 'Joined employees' : activeId === 'ready' ? 'Ready for payroll' : 'Open checks',
        columns: [
          { key: 'emp', label: 'Employee' },
          { key: 'client', label: 'Client' },
          { key: 'doj', label: 'Joining date', className: 'whitespace-nowrap' },
          { key: 'validation', label: 'Validation' },
        ],
        rows: rows
          .filter(({ checks }) => activeId === 'joined' || (activeId === 'ready') === checks.every((k) => k.pass))
          .map(({ c, checks }) => {
            const bad = checks.filter((k) => !k.pass);
            return {
              emp: <span className="cc-title font-semibold">{c.firstName} {c.lastName}</span>,
              client: c.clientName,
              doj: c.dateOfJoining || '—',
              validation: bad.length === 0 ? (
                <span className="text-emerald-700 dark:text-emerald-300">All checks passed</span>
              ) : (
                <span className="text-amber-700 dark:text-amber-300">{bad.map((k) => k.label).join(', ')}</span>
              ),
            };
          }),
      }
    : null;
  const canAdvance =canRun && !done && (step > 0 || failing.length === 0 || acknowledged);

  const advance = () => {
    const finished = STEPS[step];
    logAudit({ area: 'payroll', action: `Payroll step completed: ${finished}`, actorId: actor.id, actorName: actor.name });
    if (step === STEPS.length - 1) {
      setDone(true);
      showToast('Payroll run completed (simulated).');
    } else {
      setStep(step + 1);
      showToast(`${finished} completed.`);
    }
  };

  const restart = () => {
    setStep(0);
    setDone(false);
    setAcknowledged(false);
  };

  const stepHint = [
    failing.length
      ? `${failing.length} employee(s) have open checks. Fix them, or acknowledge below to run payroll without them.`
      : 'All employees pass validation.',
    'Attendance for the cycle is locked so it can no longer change.',
    `Salary is computed for the ${ready} employee(s) who passed validation.`,
    'An Admin reviews and approves the computed payroll.',
    'Approved payroll is released to the bank file.',
  ][step];

  return (
    <div className="flex-1 flex flex-col">
      <PageHeader icon={Wallet} title="Payroll" subtitle="Payroll run for joined employees: validate, lock, compute, approve and disburse" />

      <div className="cc-container cc-stack py-5">
        <div className="cc-grid grid-cols-1 sm:grid-cols-3">
          <KpiCard label="Joined employees" value={rows.length} detail="In this payroll run" icon={Users} tone="info" onClick={() => toggle('joined')} active={isActive('joined')} />
          <KpiCard label="Ready" value={ready} detail="Passed every validation" icon={CheckCircle2} tone="good" onClick={() => toggle('ready')} active={isActive('ready')} />
          <KpiCard label="Open checks" value={failing.length} detail="Need attention before payroll" icon={ClipboardCheck} tone={failing.length ? 'warn' : 'good'} onClick={() => toggle('open')} active={isActive('open')} />
        </div>
        <KpiDetailPanel detail={detail} onClose={close} />

        <SectionCard
          title="Payroll run"
          subtitle={done ? 'This run is complete.' : stepHint}
          action={
            canRun ? (
              done ? (
                <button type="button" className="cc-btn cc-btn-secondary" onClick={restart}>
                  Start a new run
                </button>
              ) : (
                <button type="button" className="cc-btn cc-btn-primary" onClick={advance} disabled={!canAdvance}>
                  {step === STEPS.length - 1 ? 'Disburse payroll' : `Complete: ${STEPS[step]}`}
                </button>
              )
            ) : undefined
          }
        >
          <ol className="flex flex-wrap gap-2 text-xs" aria-label="Payroll steps">
            {STEPS.map((s, i) => (
              <li
                key={s}
                aria-current={!done && i === step ? 'step' : undefined}
                className={`rounded-full px-3 py-1 font-semibold border ${
                  done || i < step
                    ? 'tone-good tone-chip'
                    : i === step
                      ? 'border-sky-500 text-sky-700 dark:text-sky-300'
                      : 'cc-muted border-slate-200 dark:border-slate-700'
                }`}
              >
                {i + 1}. {s}
              </li>
            ))}
          </ol>
          {!canRun && <p className="cc-muted text-xs mt-3">View only for your role. An Admin runs payroll.</p>}
          {step === 0 && !done && failing.length > 0 && canRun && (
            <label className="flex items-start gap-2.5 cursor-pointer text-xs mt-3">
              <input type="checkbox" className="mt-0.5" checked={acknowledged} onChange={(e) => setAcknowledged(e.target.checked)} />
              <span>I understand {failing.length} employee(s) with open checks will be left out of this payroll run.</span>
            </label>
          )}
        </SectionCard>

        <SectionCard title="Employee validation" subtitle="Checks that must pass before an employee is paid">
          <div className="overflow-x-auto -mx-1">
            <table className="w-full text-left text-xs">
              <thead className="cc-muted">
                <tr>
                  <th className="px-2 py-2 font-semibold">Employee</th>
                  <th className="px-2 py-2 font-semibold">Client</th>
                  <th className="px-2 py-2 font-semibold">Validation</th>
                </tr>
              </thead>
              <tbody className="cc-divide">
                {rows.map(({ c, checks }) => {
                  const bad = checks.filter((k) => !k.pass);
                  return (
                    <tr key={c.id}>
                      <td className="px-2 py-2 font-semibold whitespace-nowrap">{c.firstName} {c.lastName}</td>
                      <td className="px-2 py-2 cc-muted whitespace-nowrap">{c.clientName}</td>
                      <td className="px-2 py-2">
                        {bad.length === 0 ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-300">
                            <CheckCircle2 className="w-3.5 h-3.5" /> All checks passed
                          </span>
                        ) : (
                          <span className="inline-flex items-start gap-1 text-amber-700 dark:text-amber-300">
                            <CircleAlert className="w-3.5 h-3.5 mt-px shrink-0" /> {bad.map((k) => k.label).join(', ')}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={3} className="cc-muted px-2 py-6 text-center">No joined employees yet.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </SectionCard>
      </div>
      <Toast message={message} onClose={hideToast} />
    </div>
  );
};
