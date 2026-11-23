import React, { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { SelectMenu } from '../../../components/ui/SelectMenu';
import type { Candidate } from '../../../types/onboarding';
import {
  DEPENDANT_RELATIONS,
  ENROL_STATUSES,
  premiumSplit,
  type Dependant,
  type EnrolStatus,
  type Enrolment,
  type InsurancePlan,
} from '../../../data/mockInsuranceData';
import { Dialog, Field, fmtInr } from '../esic/ui';

interface Props {
  clientCandidates: Candidate[];
  plans: InsurancePlan[];
  enrolments: Enrolment[];
  /** Editing an existing enrolment; otherwise a new one. */
  editing: Enrolment | null;
  onClose: () => void;
  onSave: (data: { candidateId: string; planId: string; status: EnrolStatus; dependants: Dependant[]; optOutReason?: string }) => void;
}

const name = (c: Candidate) => `${c.firstName} ${c.lastName}`.trim();

const allowedRelations = (plan?: InsurancePlan): string[] => {
  if (!plan) return [];
  const out: string[] = [];
  if (plan.spouseCovered) out.push('Spouse');
  if (plan.childrenCovered > 0) out.push('Son', 'Daughter');
  if (plan.parentsCovered) out.push('Father', 'Mother');
  return out;
};

export const EnrolDialog: React.FC<Props> = ({ clientCandidates, plans, enrolments, editing, onClose, onSave }) => {
  const [candidateId, setCandidateId] = useState(editing?.candidateId ?? clientCandidates[0]?.id ?? '');
  const availablePlans = plans.filter((p) => editing?.planId === p.id || !enrolments.some((e) => e.candidateId === candidateId && e.planId === p.id));
  const [planId, setPlanId] = useState(editing?.planId ?? '');
  const planSel = availablePlans.find((p) => p.id === planId) ?? availablePlans[0];
  const [status, setStatus] = useState<EnrolStatus>(editing?.status ?? 'Enrolled');
  const [dependants, setDependants] = useState<Dependant[]>(editing?.dependants ?? []);
  const [reason, setReason] = useState(editing?.optOutReason ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const relations = allowedRelations(planSel);
  const canHaveDependants = relations.length > 0 && status !== 'Opted-out';
  const split = planSel ? premiumSplit(planSel) : { employer: 0, employee: 0 };

  const updateDep = (id: string, patch: Partial<Dependant>) => setDependants((l) => l.map((d) => (d.id === id ? { ...d, ...patch } : d)));
  const addDep = () => setDependants((l) => [...l, { id: `dep-${Date.now()}-${l.length}`, name: '', relation: relations[0] ?? 'Spouse', dob: '' }]);

  const save = () => {
    const e: Record<string, string> = {};
    if (!candidateId) e.candidate = 'Select an employee.';
    if (!planSel) e.plan = 'This employee is already enrolled in every plan of this client.';
    if (status === 'Opted-out' && !reason.trim()) e.reason = 'Write the reason the employee gave for opting out.';
    if (canHaveDependants && planSel) {
      const live = dependants;
      if (live.some((d) => !d.name.trim() || !d.dob)) e.dependants = 'Enter name and date of birth for every dependant, or remove the empty row.';
      else if (live.some((d) => !relations.includes(d.relation))) e.dependants = `This plan does not cover that relation. Covered: ${relations.join(', ')}.`;
      else if (live.filter((d) => d.relation === 'Spouse').length > 1) e.dependants = 'Only one spouse can be covered.';
      else if (live.filter((d) => d.relation === 'Son' || d.relation === 'Daughter').length > planSel.childrenCovered) e.dependants = `This plan covers up to ${planSel.childrenCovered} children.`;
      else if (live.filter((d) => d.relation === 'Father' || d.relation === 'Mother').length > 2) e.dependants = 'At most two parents can be covered.';
    }
    setErrors(e);
    if (Object.keys(e).length === 0 && planSel) {
      onSave({
        candidateId,
        planId: planSel.id,
        status,
        dependants: status === 'Opted-out' || !canHaveDependants ? [] : dependants,
        optOutReason: status === 'Opted-out' ? reason.trim() : undefined,
      });
    }
  };

  return (
    <Dialog
      title={editing ? 'Edit enrolment' : 'Enrol employee'}
      subtitle="Choose the plan, set the status and add dependants the plan allows."
      onClose={onClose}
      widthClass="max-w-2xl"
      footer={
        <>
          <button type="button" className="cc-btn cc-btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="cc-btn cc-btn-primary" onClick={save}>
            Save enrolment
          </button>
        </>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Employee" required error={errors.candidate}>
          <SelectMenu
            className="cc-input"
            value={candidateId}
            disabled={Boolean(editing)}
            onChange={(e) => {
              setCandidateId(e.target.value);
              setPlanId('');
            }}
          >
            {clientCandidates.map((c) => (
              <option key={c.id} value={c.id}>
                {name(c)}
              </option>
            ))}
          </SelectMenu>
        </Field>
        <Field label="Plan" required error={errors.plan}>
          <SelectMenu className="cc-input" value={planSel?.id ?? ''} disabled={Boolean(editing)} onChange={(e) => setPlanId(e.target.value)}>
            {availablePlans.length === 0 ? (
              <option value="">No plan available</option>
            ) : (
              availablePlans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.type})
                </option>
              ))
            )}
          </SelectMenu>
        </Field>
      </div>

      {planSel && (
        <p className="cc-muted text-[11px] mt-2">
          Sum insured {fmtInr(planSel.sumInsured)} · yearly premium {fmtInr(planSel.premium)} (employer {fmtInr(split.employer)}, deducted from employee {fmtInr(split.employee)})
        </p>
      )}

      <div className="mt-4">
        <p className="cc-title text-[11px] font-semibold mb-1.5">Status</p>
        <div className="flex flex-wrap gap-4">
          {ENROL_STATUSES.map((s) => (
            <label key={s} className="flex items-center gap-1.5 text-xs cursor-pointer">
              <input type="radio" name="enrol-status" checked={status === s} onChange={() => setStatus(s)} />
              <span className="cc-title font-semibold">{s}</span>
            </label>
          ))}
        </div>
      </div>

      {status === 'Opted-out' && (
        <Field label="Reason for opting out" required error={errors.reason} className="mt-3">
          <input className="cc-input" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Example: covered under spouse's company policy" />
        </Field>
      )}

      {canHaveDependants && (
        <div className="mt-4 rounded-lg border p-3" style={{ borderColor: 'var(--cc-card-border)' }}>
          <div className="flex items-center justify-between gap-2 mb-2">
            <p className="cc-title text-xs font-bold">Dependants ({dependants.length})</p>
            <button type="button" className="cc-btn cc-btn-secondary" onClick={addDep}>
              <Plus className="w-3.5 h-3.5" /> Add dependant
            </button>
          </div>
          <p className="cc-muted text-[11px] mb-2">Covered by this plan: {relations.join(', ')}.</p>
          {dependants.length === 0 && <p className="cc-muted text-xs">No dependants added. The employee alone is covered.</p>}
          <div className="space-y-2">
            {dependants.map((d) => (
              <div key={d.id} className="grid grid-cols-1 sm:grid-cols-[1fr_8rem_9rem_auto] gap-2 items-center">
                <input className="cc-input" placeholder="Full name" value={d.name} onChange={(e) => updateDep(d.id, { name: e.target.value })} aria-label="Dependant name" />
                <SelectMenu className="cc-input" value={d.relation} onChange={(e) => updateDep(d.id, { relation: e.target.value })} aria-label="Relation">
                  {DEPENDANT_RELATIONS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </SelectMenu>
                <input type="date" className="cc-input" value={d.dob} onChange={(e) => updateDep(d.id, { dob: e.target.value })} aria-label="Date of birth" />
                <button type="button" className="cc-btn cc-btn-secondary" onClick={() => setDependants((l) => l.filter((x) => x.id !== d.id))} aria-label="Remove dependant">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
          {errors.dependants && (
            <p className="tone-bad text-[11px] mt-2" style={{ color: 'var(--tone)' }} role="alert">
              {errors.dependants}
            </p>
          )}
        </div>
      )}
    </Dialog>
  );
};
