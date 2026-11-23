import React, { useState } from 'react';
import { SelectMenu } from '../../../components/ui/SelectMenu';
import { INSURERS, PLAN_TYPE_LABEL, TPAS, premiumSplit, type InsurancePlan, type PlanType } from '../../../data/mockInsuranceData';
import { Dialog, Field, fmtInr } from '../esic/ui';

interface Props {
  client: string;
  plan: InsurancePlan | null;
  onClose: () => void;
  onSave: (plan: Omit<InsurancePlan, 'id'> & { id?: string }) => void;
}

const BLANK = (client: string): Omit<InsurancePlan, 'id'> => ({
  client,
  type: 'GMC',
  name: '',
  insurer: INSURERS[0],
  tpa: TPAS[0],
  policyNo: '',
  sumInsured: 500000,
  premium: 9000,
  employerSharePct: 100,
  spouseCovered: true,
  childrenCovered: 2,
  parentsCovered: false,
  policyStart: '2026-10-01',
  policyEnd: '2027-09-30',
});

/** Add or edit a client's insurance plan. */
export const PlanDialog: React.FC<Props> = ({ client, plan, onClose, onSave }) => {
  const [d, setD] = useState<Omit<InsurancePlan, 'id'> & { id?: string }>(plan ?? BLANK(client));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const set = <K extends keyof InsurancePlan>(k: K, v: InsurancePlan[K]) => setD((s) => ({ ...s, [k]: v }));
  const isGmc = d.type === 'GMC';
  const split = premiumSplit(d);

  const save = () => {
    const e: Record<string, string> = {};
    if (!d.name.trim()) e.name = 'Give the plan a name, for example "Staff Mediclaim".';
    if (!d.policyNo.trim()) e.policyNo = 'Enter the policy number from the policy schedule.';
    if (!(d.sumInsured > 0)) e.sumInsured = 'Sum insured must be more than zero.';
    if (!(d.premium > 0)) e.premium = 'Enter the yearly premium per employee.';
    if (d.employerSharePct < 0 || d.employerSharePct > 100) e.employerSharePct = 'Employer share must be between 0 and 100.';
    if (!d.policyStart || !d.policyEnd) e.policyEnd = 'Choose both policy dates.';
    else if (d.policyEnd <= d.policyStart) e.policyEnd = 'Policy end date must be after the start date.';
    setErrors(e);
    if (Object.keys(e).length === 0) {
      onSave(isGmc ? d : { ...d, spouseCovered: false, childrenCovered: 0, parentsCovered: false });
    }
  };

  return (
    <Dialog
      title={plan ? `Edit plan: ${plan.name}` : `Add insurance plan for ${client}`}
      subtitle="Plan terms apply to every enrolment under this plan."
      onClose={onClose}
      widthClass="max-w-2xl"
      footer={
        <>
          <button type="button" className="cc-btn cc-btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="cc-btn cc-btn-primary" onClick={save}>
            {plan ? 'Save changes' : 'Add plan'}
          </button>
        </>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Plan type" required>
          <SelectMenu className="cc-input" value={d.type} onChange={(e) => set('type', e.target.value as PlanType)}>
            {(Object.keys(PLAN_TYPE_LABEL) as PlanType[]).map((t) => (
              <option key={t} value={t}>
                {PLAN_TYPE_LABEL[t]}
              </option>
            ))}
          </SelectMenu>
        </Field>
        <Field label="Plan name" required error={errors.name}>
          <input className="cc-input" value={d.name} onChange={(e) => set('name', e.target.value)} />
        </Field>
        <Field label="Insurer" required>
          <SelectMenu className="cc-input" value={d.insurer} onChange={(e) => set('insurer', e.target.value)}>
            {INSURERS.map((i) => (
              <option key={i} value={i}>
                {i}
              </option>
            ))}
          </SelectMenu>
        </Field>
        <Field label="TPA (claims administrator)" required>
          <SelectMenu className="cc-input" value={d.tpa} onChange={(e) => set('tpa', e.target.value)}>
            {TPAS.map((i) => (
              <option key={i} value={i}>
                {i}
              </option>
            ))}
          </SelectMenu>
        </Field>
        <Field label="Policy number" required error={errors.policyNo}>
          <input className="cc-input" value={d.policyNo} onChange={(e) => set('policyNo', e.target.value)} />
        </Field>
        <Field label="Sum insured per employee (Rs)" required error={errors.sumInsured}>
          <input type="number" className="cc-input" value={d.sumInsured || ''} onChange={(e) => set('sumInsured', Number(e.target.value))} />
        </Field>
        <Field label="Yearly premium per employee (Rs)" required error={errors.premium}>
          <input type="number" className="cc-input" value={d.premium || ''} onChange={(e) => set('premium', Number(e.target.value))} />
        </Field>
        <Field label="Employer pays (%)" required error={errors.employerSharePct} hint={`Employer ${fmtInr(split.employer)} + employee ${fmtInr(split.employee)} per year`}>
          <input type="number" className="cc-input" value={d.employerSharePct} onChange={(e) => set('employerSharePct', Number(e.target.value))} />
        </Field>
        <Field label="Policy start" required>
          <input type="date" className="cc-input" value={d.policyStart} onChange={(e) => set('policyStart', e.target.value)} />
        </Field>
        <Field label="Policy end" required error={errors.policyEnd}>
          <input type="date" className="cc-input" value={d.policyEnd} onChange={(e) => set('policyEnd', e.target.value)} />
        </Field>
      </div>

      <div className="mt-4 rounded-lg border p-3" style={{ borderColor: 'var(--cc-card-border)' }}>
        <p className="cc-title text-xs font-bold mb-2">Dependants covered</p>
        {isGmc ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
            <label className="flex items-center gap-2 text-xs cursor-pointer">
              <input type="checkbox" checked={d.spouseCovered} onChange={(e) => set('spouseCovered', e.target.checked)} />
              <span className="cc-title font-semibold">Spouse</span>
            </label>
            <Field label="Children (maximum)">
              <SelectMenu className="cc-input" value={String(d.childrenCovered)} onChange={(e) => set('childrenCovered', Number(e.target.value))}>
                {[0, 1, 2, 3, 4].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </SelectMenu>
            </Field>
            <label className="flex items-center gap-2 text-xs cursor-pointer">
              <input type="checkbox" checked={d.parentsCovered} onChange={(e) => set('parentsCovered', e.target.checked)} />
              <span className="cc-title font-semibold">Parents</span>
            </label>
          </div>
        ) : (
          <p className="cc-muted text-xs">{d.type === 'GPA' ? 'Accident cover applies to the employee only.' : "Workmen's compensation applies to the employee only."}</p>
        )}
      </div>
    </Dialog>
  );
};
