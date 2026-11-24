import React, { useMemo, useState } from 'react';
import { BadgeCheck, Building2, Hourglass, Pencil, Plus, ShieldCheck, UserMinus, Wallet } from 'lucide-react';
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
import {
  ENROL_STATUSES,
  INITIAL_PLANS,
  PLAN_TYPE_LABEL,
  buildInitialEnrolments,
  policyHealth,
  premiumSplit,
  type EnrolStatus,
  type Enrolment,
  type InsurancePlan,
} from '../../data/mockInsuranceData';
import { EnrolDialog } from './insurance/EnrolDialog';
import { PlanDialog } from './insurance/PlanDialog';
import { ViewOnlyNote, fmtDate, fmtInr } from './esic/ui';

const PAGE_SIZE = 15;
const STATUS_TONE: Record<EnrolStatus, 'good' | 'warn' | 'muted'> = { Enrolled: 'good', Pending: 'warn', 'Opted-out': 'muted' };
const nameOf = (c: Candidate) => `${c.firstName} ${c.lastName}`.trim();

const coverageText = (p: InsurancePlan) => {
  if (p.type !== 'GMC') return 'Employee only';
  const parts = ['Employee'];
  if (p.spouseCovered) parts.push('spouse');
  if (p.childrenCovered) parts.push(`${p.childrenCovered} children`);
  if (p.parentsCovered) parts.push('parents');
  return parts.join(' + ');
};

/** Compliance -> Insurance: client-wise plan configuration and employee enrolment. */
export const InsuranceTab: React.FC<{ candidates: Candidate[] }> = ({ candidates }) => {
  const access = useFeatureAccess('insurance');
  const { actor } = useRole();
  const canManage = access === 'manage';
  const { message, showToast, hideToast } = useToast();

  const [plans, setPlans] = useState<InsurancePlan[]>(INITIAL_PLANS);
  const [enrolments, setEnrolments] = useState<Enrolment[]>(() => buildInitialEnrolments(candidates));

  const clients = useMemo(() => Array.from(new Set([...INITIAL_PLANS.map((p) => p.client), ...candidates.map((c) => c.clientName)])).sort(), [candidates]);
  const [client, setClient] = useState(clients.find((c) => INITIAL_PLANS.some((p) => p.client === c)) ?? clients[0] ?? '');
  const [planFilter, setPlanFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [limit, setLimit] = useState(PAGE_SIZE);
  const [planDialog, setPlanDialog] = useState<{ plan: InsurancePlan | null } | null>(null);
  const [enrolDialog, setEnrolDialog] = useState<{ editing: Enrolment | null } | null>(null);

  const clientPlans = plans.filter((p) => p.client === client);
  const clientCandidates = candidates.filter((c) => c.clientName === client);
  const planIds = new Set(clientPlans.map((p) => p.id));
  const clientEnrolments = enrolments.filter((e) => planIds.has(e.planId) && clientCandidates.some((c) => c.id === e.candidateId));
  const countStatus = (s: EnrolStatus) => clientEnrolments.filter((e) => e.status === s).length;
  const employerCost = clientEnrolments
    .filter((e) => e.status === 'Enrolled')
    .reduce((sum, e) => sum + premiumSplit(plans.find((p) => p.id === e.planId)!).employer, 0);
  const expiring = clientPlans.filter((p) => policyHealth(p).status !== 'Active').length;

  const rows = clientEnrolments.filter((e) => (planFilter === 'all' || e.planId === planFilter) && (statusFilter === 'all' || e.status === statusFilter));

  const log = (action: string, subjectId?: string) => logAudit({ area: 'insurance', action, subjectId, actorId: actor.id, actorName: actor.name });

  const savePlan = (data: Omit<InsurancePlan, 'id'> & { id?: string }) => {
    if (data.id) {
      setPlans((l) => l.map((p) => (p.id === data.id ? ({ ...data, id: data.id } as InsurancePlan) : p)));
      log(`Updated plan ${data.name} (${data.type}) for ${data.client}`, data.id);
      showToast(`${data.name} updated`);
    } else {
      const id = `PLN-${String(plans.length + 1).padStart(2, '0')}`;
      setPlans((l) => [...l, { ...data, id }]);
      log(`Added plan ${data.name} (${data.type}) for ${data.client}`, id);
      showToast(`${data.name} added for ${data.client}`);
    }
    setPlanDialog(null);
  };

  const saveEnrolment = (data: { candidateId: string; planId: string; status: EnrolStatus; dependants: Enrolment['dependants']; optOutReason?: string }) => {
    const existing = enrolDialog?.editing;
    const plan = plans.find((p) => p.id === data.planId);
    const cand = candidates.find((c) => c.id === data.candidateId);
    const next: Enrolment = {
      id: existing?.id ?? `ENR-${data.candidateId}-${data.planId}`,
      ...data,
      enrolledOn: data.status === 'Enrolled' ? existing?.enrolledOn ?? DASHBOARD_REFERENCE_DATE : undefined,
      updatedBy: actor.name,
    };
    setEnrolments((l) => (existing ? l.map((e) => (e.id === existing.id ? next : e)) : [...l, next]));
    log(`${existing ? 'Updated' : 'Created'} enrolment of ${cand ? nameOf(cand) : data.candidateId} in ${plan?.name ?? data.planId}: ${data.status}`, data.candidateId);
    showToast(`${cand ? nameOf(cand) : 'Employee'}: ${data.status}`);
    setEnrolDialog(null);
  };

  const markEnrolled = (e: Enrolment) => {
    setEnrolments((l) => l.map((x) => (x.id === e.id ? { ...x, status: 'Enrolled', enrolledOn: DASHBOARD_REFERENCE_DATE, updatedBy: actor.name } : x)));
    const cand = candidates.find((c) => c.id === e.candidateId);
    log(`Marked ${cand ? nameOf(cand) : e.candidateId} as enrolled in ${plans.find((p) => p.id === e.planId)?.name}`, e.candidateId);
    showToast(`${cand ? nameOf(cand) : 'Employee'} enrolled`);
  };

  return (
    <div className="cc-stack">
      <div className="flex flex-col sm:flex-row sm:items-end gap-3 sm:justify-between">
        <div className="w-full sm:w-80">
          <label className="cc-title block text-[11px] font-semibold mb-1">Client</label>
          <SelectMenu className="cc-input" value={client} onChange={(e) => { setClient(e.target.value); setPlanFilter('all'); setStatusFilter('all'); setLimit(PAGE_SIZE); }} aria-label="Client">
            {clients.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </SelectMenu>
        </div>
        {canManage ? (
          <div className="flex flex-wrap gap-2">
            <button type="button" className="cc-btn cc-btn-secondary" onClick={() => setPlanDialog({ plan: null })}>
              <Plus className="w-3.5 h-3.5" /> Add plan
            </button>
            <button type="button" className="cc-btn cc-btn-primary" onClick={() => setEnrolDialog({ editing: null })} disabled={!clientPlans.length || !clientCandidates.length}>
              <Plus className="w-3.5 h-3.5" /> Enrol employee
            </button>
          </div>
        ) : (
          <ViewOnlyNote text="View only: plans and enrolments cannot be changed with your role." />
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <KpiCard label="Plans" value={clientPlans.length} detail={expiring ? `${expiring} expiring or expired` : 'All policies active'} icon={ShieldCheck} tone={expiring ? 'warn' : 'info'} />
        <KpiCard label="Enrolled" value={countStatus('Enrolled')} detail={`of ${clientEnrolments.length} enrolment records`} icon={BadgeCheck} tone="good" />
        <KpiCard label="Pending" value={countStatus('Pending')} detail="Form or dependants awaited" icon={Hourglass} tone="warn" />
        <KpiCard label="Opted out" value={countStatus('Opted-out')} detail="Covered elsewhere" icon={UserMinus} tone="muted" />
        <KpiCard label="Employer premium" value={fmtInr(employerCost)} detail="Yearly, for enrolled employees" icon={Wallet} tone="violet" className="col-span-2 lg:col-span-1" />
      </div>

      <SectionCard title="Plans" subtitle={`Insurance plans configured for ${client}`}>
        {clientPlans.length === 0 ? (
          <div className="py-8 text-center">
            <Building2 className="w-7 h-7 cc-muted mx-auto mb-2" />
            <p className="cc-title text-sm font-semibold">No insurance plan for this client yet</p>
            <p className="cc-muted text-xs mt-1">Use Add plan to set up the medical, accident or workmen's compensation policy.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
            {clientPlans.map((p) => {
              const health = policyHealth(p);
              const split = premiumSplit(p);
              const mine = enrolments.filter((e) => e.planId === p.id && clientCandidates.some((c) => c.id === e.candidateId));
              const enrolled = mine.filter((e) => e.status === 'Enrolled').length;
              const pct = clientCandidates.length ? Math.round((enrolled / clientCandidates.length) * 100) : 0;
              return (
                <div key={p.id} className="cc-card cc-card-hover p-3.5 flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Chip tone="info">{p.type}</Chip>
                        <Chip tone={health.status === 'Active' ? 'good' : health.status === 'Expiring soon' ? 'warn' : 'bad'}>
                          {health.status === 'Expired' ? 'Expired' : health.status === 'Expiring soon' ? `Expires in ${health.daysLeft} days` : 'Active'}
                        </Chip>
                      </div>
                      <p className="cc-title text-sm font-bold mt-1.5">{p.name}</p>
                      <p className="cc-muted text-[11px]">{PLAN_TYPE_LABEL[p.type]} · Policy {p.policyNo}</p>
                    </div>
                    <button type="button" className="cc-btn cc-btn-secondary shrink-0" disabled={!canManage} onClick={() => setPlanDialog({ plan: p })} aria-label={`Edit ${p.name}`}>
                      <Pencil className="w-3.5 h-3.5" /> Edit
                    </button>
                  </div>
                  <dl className="grid grid-cols-2 sm:grid-cols-3 gap-x-3 gap-y-2 text-xs">
                    {[
                      ['Sum insured', fmtInr(p.sumInsured)],
                      ['Yearly premium', `${fmtInr(p.premium)} per employee`],
                      ['Paid by', `Employer ${p.employerSharePct}% · Employee ${100 - p.employerSharePct}%`],
                      ['Insurer', p.insurer],
                      ['TPA', p.tpa],
                      ['Policy period', `${fmtDate(p.policyStart)} to ${fmtDate(p.policyEnd)}`],
                      ['Covers', coverageText(p)],
                      ['Employee deduction', split.employee ? `${fmtInr(split.employee)} per year` : 'None'],
                    ].map(([k, v]) => (
                      <div key={k} className="min-w-0">
                        <dt className="cc-muted text-[10px] font-semibold">{k}</dt>
                        <dd className="cc-title font-medium break-words">{v}</dd>
                      </div>
                    ))}
                  </dl>
                  <div>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="cc-muted">
                        {enrolled} of {clientCandidates.length} employees enrolled
                      </span>
                      <span className="cc-title font-semibold tabular-nums">{pct}%</span>
                    </div>
                    <ProgressBar value={pct} tone={pct >= 80 ? 'good' : pct >= 50 ? 'info' : 'warn'} label={`${p.name} enrolment`} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </SectionCard>

      <SectionCard title="Employee enrolment" subtitle={`${rows.length} of ${clientEnrolments.length} records`}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mb-3">
          <SelectMenu className="cc-input" value={planFilter} onChange={(e) => { setPlanFilter(e.target.value); setLimit(PAGE_SIZE); }} aria-label="Plan filter">
            <option value="all">All plans</option>
            {clientPlans.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </SelectMenu>
          <SelectMenu className="cc-input" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setLimit(PAGE_SIZE); }} aria-label="Status filter">
            <option value="all">All statuses</option>
            {ENROL_STATUSES.map((s) => (
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
                <th>Employee</th>
                <th>Plan</th>
                <th>Status</th>
                <th>Dependants</th>
                <th>Enrolled on</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="cc-muted text-center py-6">
                    No enrolment records for these filters.
                  </td>
                </tr>
              )}
              {rows.slice(0, limit).map((e) => {
                const cand = candidates.find((c) => c.id === e.candidateId)!;
                const plan = plans.find((p) => p.id === e.planId)!;
                return (
                  <tr key={e.id}>
                    <td className="whitespace-nowrap">
                      <span className="cc-title font-semibold">{nameOf(cand)}</span>
                      <span className="cc-muted block text-[10px]">{cand.designation}</span>
                    </td>
                    <td className="whitespace-nowrap">
                      {plan.name} <span className="cc-muted">({plan.type})</span>
                    </td>
                    <td>
                      <Chip tone={STATUS_TONE[e.status]}>{e.status}</Chip>
                      {e.optOutReason && <span className="cc-muted block text-[10px] mt-0.5 max-w-[14rem] whitespace-normal">{e.optOutReason}</span>}
                    </td>
                    <td className="min-w-[10rem]">
                      {e.dependants.length ? e.dependants.map((d) => `${d.name} (${d.relation})`).join(', ') : <span className="cc-muted">{plan.type === 'GMC' ? 'None added' : 'Not applicable'}</span>}
                    </td>
                    <td className="whitespace-nowrap">{fmtDate(e.enrolledOn)}</td>
                    <td className="text-right whitespace-nowrap">
                      <span className="inline-flex gap-1.5">
                        {e.status === 'Pending' && (
                          <button type="button" className="cc-btn cc-btn-primary" disabled={!canManage} onClick={() => markEnrolled(e)}>
                            Mark enrolled
                          </button>
                        )}
                        <button type="button" className="cc-btn cc-btn-secondary" disabled={!canManage} onClick={() => setEnrolDialog({ editing: e })} aria-label={`Edit enrolment of ${nameOf(cand)}`}>
                          <Pencil className="w-3.5 h-3.5" /> Edit
                        </button>
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

      {planDialog && <PlanDialog client={client} plan={planDialog.plan} onClose={() => setPlanDialog(null)} onSave={savePlan} />}
      {enrolDialog && (
        <EnrolDialog
          clientCandidates={clientCandidates}
          plans={clientPlans}
          enrolments={enrolments}
          editing={enrolDialog.editing}
          onClose={() => setEnrolDialog(null)}
          onSave={saveEnrolment}
        />
      )}
      <Toast message={message} onClose={hideToast} />
    </div>
  );
};
