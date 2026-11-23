import React, { useMemo, useState } from 'react';
import { BadgeCheck, Calculator, Info, Pencil, ShieldAlert } from 'lucide-react';
import { SectionCard } from '../../../components/page/SectionCard';
import { SelectMenu } from '../../../components/ui/SelectMenu';
import { Chip } from '../../dashboard/command-center/shared';
import { cn } from '../../../utils/cn';
import { useRole, useFeatureAccess } from '../../../context/RoleContext';
import { logAudit, useAuditLog, formatAuditTime } from '../../hr-ops/auditStore';
import {
  ESIC_CONTRACT_TYPES,
  ESIC_EMPLOYEE_RATE,
  ESIC_EMPLOYER_RATE,
  ESIC_STATES,
  INITIAL_ESIC_RULES,
  SEED_ESIC_RULE_HISTORY,
  checkEsicApplicability,
  type EsicClientRule,
} from '../../../data/mockEsicData';
import { Dialog, Field, ViewOnlyNote, fmtDate, fmtInr } from './ui';

const toggleIn = (list: string[], value: string) => (list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);

const Toggle: React.FC<{ checked: boolean; onChange: () => void; label: string; hint?: string }> = ({ checked, onChange, label, hint }) => (
  <label className="flex items-start gap-2 text-xs cursor-pointer">
    <input type="checkbox" className="mt-0.5" checked={checked} onChange={onChange} />
    <span>
      <span className="cc-title font-semibold">{label}</span>
      {hint && <span className="cc-muted block text-[11px]">{hint}</span>}
    </span>
  </label>
);

interface RuleDialogProps {
  rule: EsicClientRule;
  onClose: () => void;
  onSave: (rule: EsicClientRule) => void;
}

const RuleDialog: React.FC<RuleDialogProps> = ({ rule, onClose, onSave }) => {
  const [draft, setDraft] = useState<EsicClientRule>(rule);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const set = <K extends keyof EsicClientRule>(key: K, value: EsicClientRule[K]) => setDraft((d) => ({ ...d, [key]: value }));

  const save = () => {
    const next: Record<string, string> = {};
    if (!draft.wageCeiling || draft.wageCeiling < 1000) next.wageCeiling = 'Enter the monthly wage ceiling in rupees, for example 21000.';
    if (draft.pwdCeiling < draft.wageCeiling) next.pwdCeiling = 'The ceiling for persons with disability cannot be lower than the normal ceiling.';
    if (!draft.coveredStates.length) next.coveredStates = 'Select at least one location where ESIC applies.';
    if (!draft.contractTypes.length) next.contractTypes = 'Select at least one contract type that is covered.';
    setErrors(next);
    if (Object.keys(next).length === 0) onSave(draft);
  };

  return (
    <Dialog
      title={`Edit ESIC applicability: ${rule.client}`}
      subtitle="Changes apply to new validations and the applicability checker. Every change is recorded."
      onClose={onClose}
      widthClass="max-w-2xl"
      footer={
        <>
          <button type="button" className="cc-btn cc-btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="cc-btn cc-btn-primary" onClick={save}>
            Save rule
          </button>
        </>
      }
    >
      <div className="cc-stack">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Wage ceiling (Rs per month, gross)" required error={errors.wageCeiling} hint="Statutory limit is Rs 21,000.">
            <input type="number" className="cc-input" value={draft.wageCeiling || ''} onChange={(e) => set('wageCeiling', Number(e.target.value))} />
          </Field>
          <Field label="Ceiling for persons with disability (Rs)" required error={errors.pwdCeiling} hint="Statutory limit is Rs 25,000.">
            <input type="number" className="cc-input" value={draft.pwdCeiling || ''} onChange={(e) => set('pwdCeiling', Number(e.target.value))} />
          </Field>
        </div>
        <Field label="Locations (state) where ESIC applies" required error={errors.coveredStates}>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {ESIC_STATES.map((s) => (
              <Toggle key={s} label={s} checked={draft.coveredStates.includes(s)} onChange={() => set('coveredStates', toggleIn(draft.coveredStates, s))} />
            ))}
          </div>
        </Field>
        <Field label="Contract types that are covered" required error={errors.contractTypes}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {ESIC_CONTRACT_TYPES.map((t) => (
              <Toggle key={t} label={t} checked={draft.contractTypes.includes(t)} onChange={() => set('contractTypes', toggleIn(draft.contractTypes, t))} />
            ))}
          </div>
        </Field>
        <Field label="Exemptions">
          <div className="grid grid-cols-1 gap-2">
            <Toggle label="Exempt apprentices" checked={draft.exemptApprentices} onChange={() => set('exemptApprentices', !draft.exemptApprentices)} />
            <Toggle label="Exempt interns and trainees" checked={draft.exemptInterns} onChange={() => set('exemptInterns', !draft.exemptInterns)} />
            <Toggle
              label="Client's own scheme exemption"
              hint="The client insures third-party payroll workers itself and the exemption letter is on file."
              checked={draft.ownSchemeExemption}
              onChange={() => set('ownSchemeExemption', !draft.ownSchemeExemption)}
            />
          </div>
        </Field>
        <Field label="Note for the team">
          <textarea className="cc-input !h-auto py-2" rows={2} value={draft.note} onChange={(e) => set('note', e.target.value)} />
        </Field>
      </div>
    </Dialog>
  );
};

interface Props {
  notify: (message: string) => void;
}

export const ApplicabilityPanel: React.FC<Props> = ({ notify }) => {
  const access = useFeatureAccess('esic-validation');
  const { role, actor } = useRole();
  const canEdit = access === 'manage' && role === 'admin';
  const [rules, setRules] = useState<EsicClientRule[]>(INITIAL_ESIC_RULES);
  const [editing, setEditing] = useState<EsicClientRule | null>(null);

  const [client, setClient] = useState(INITIAL_ESIC_RULES[0].client);
  const [gross, setGross] = useState('18500');
  const [state, setState] = useState<string>('Karnataka');
  const [contractType, setContractType] = useState<string>('Permanent');
  const [pwd, setPwd] = useState(false);
  const [checked, setChecked] = useState(false);

  const live = useAuditLog({ area: 'esic-validation' }).filter((e) => e.subjectId?.startsWith('rule:'));
  const history = [
    ...live.map((e) => ({ id: e.id, client: e.subjectId!.slice(5), action: e.action, actorName: e.actorName, at: formatAuditTime(e.at) })),
    ...SEED_ESIC_RULE_HISTORY.map((h) => ({ ...h, at: formatAuditTime(h.at) })),
  ];

  const rule = rules.find((r) => r.client === client) ?? rules[0];
  const result = useMemo(
    () => checkEsicApplicability(rule, { client, grossWage: Number(gross) || 0, state, contractType, pwd }),
    [rule, client, gross, state, contractType, pwd]
  );
  const grossInvalid = !gross || Number(gross) <= 0;

  const saveRule = (next: EsicClientRule) => {
    const stamped = { ...next, updatedBy: actor.name, updatedAt: '2026-10-05' };
    setRules((prev) => prev.map((r) => (r.client === next.client ? stamped : r)));
    logAudit({
      area: 'esic-validation',
      action: `Updated ESIC applicability rule (ceiling ${fmtInr(next.wageCeiling)}, ${next.coveredStates.length} locations, ${next.contractTypes.length} contract types)`,
      subjectId: `rule:${next.client}`,
      actorId: actor.id,
      actorName: actor.name,
    });
    setEditing(null);
    setChecked(false);
    notify(`ESIC rule for ${next.client} saved`);
  };

  return (
    <div className="cc-stack">
      <SectionCard title="ESIC applicability by client" subtitle="Conditions we check before deducting ESIC. Only an Admin can change them.">
        {!canEdit && <ViewOnlyNote text="View only: rules can be changed by an Admin." />}
        <div className="cc-table-wrap mt-3">
          <table className="cc-table">
            <thead>
              <tr>
                <th>Client</th>
                <th className="text-right">Wage ceiling</th>
                <th>Locations covered</th>
                <th>Contract types covered</th>
                <th>Exemptions</th>
                <th>Updated</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {rules.map((r) => (
                <tr key={r.client}>
                  <td className="cc-title font-semibold whitespace-nowrap">{r.client}</td>
                  <td className="text-right tabular-nums whitespace-nowrap">
                    {fmtInr(r.wageCeiling)}
                    <span className="cc-muted block text-[10px]">PwD {fmtInr(r.pwdCeiling)}</span>
                  </td>
                  <td className="min-w-[10rem]">{r.coveredStates.length === ESIC_STATES.length - 1 ? 'All notified states' : r.coveredStates.join(', ')}</td>
                  <td className="min-w-[10rem]">{r.contractTypes.join(', ')}</td>
                  <td>
                    <div className="flex flex-wrap gap-1">
                      {r.exemptApprentices && <Chip tone="muted">Apprentices</Chip>}
                      {r.exemptInterns && <Chip tone="muted">Interns</Chip>}
                      {r.ownSchemeExemption && <Chip tone="info">Own scheme</Chip>}
                      {!r.exemptApprentices && !r.exemptInterns && !r.ownSchemeExemption && <span className="cc-muted">None</span>}
                    </div>
                  </td>
                  <td className="whitespace-nowrap">
                    {fmtDate(r.updatedAt)}
                    <span className="cc-muted block text-[10px]">{r.updatedBy}</span>
                  </td>
                  <td className="text-right">
                    <button type="button" className="cc-btn cc-btn-secondary" disabled={!canEdit} onClick={() => setEditing(r)} aria-label={`Edit rule for ${r.client}`}>
                      <Pencil className="w-3.5 h-3.5" /> Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SectionCard title="How the formula works" subtitle="In plain language">
          <ol className="space-y-2.5 text-xs leading-relaxed list-decimal pl-4" style={{ color: 'var(--cc-text)' }}>
            <li>
              <b className="cc-title">Check the place.</b> ESIC is deducted only where the client's establishment is registered. A location in a non-notified area is skipped.
            </li>
            <li>
              <b className="cc-title">Check the contract type.</b> Each client lists the types of staff that are covered. Apprentices and interns can be exempt.
            </li>
            <li>
              <b className="cc-title">Check the wage.</b> Monthly gross wage must be Rs 21,000 or less (Rs 25,000 for a person with disability). Overtime is not counted for this test.
            </li>
            <li>
              <b className="cc-title">Calculate.</b> If all checks pass, the employee pays {(ESIC_EMPLOYEE_RATE * 100).toFixed(2)}% and the employer pays {(ESIC_EMPLOYER_RATE * 100).toFixed(2)}% of gross wages, rounded up to the next rupee.
            </li>
          </ol>
          <div className="cc-callout tone-info mt-3">
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              If a person is covered at the start of a contribution period (April to September or October to March) and the wage later crosses the ceiling, ESIC continues until that period ends.
            </span>
          </div>
        </SectionCard>

        <SectionCard title="Applicability checker" subtitle="Type a wage and pick the client to see the answer">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="Client">
              <SelectMenu className="cc-input" value={client} onChange={(e) => { setClient(e.target.value); setChecked(false); }}>
                {rules.map((r) => (
                  <option key={r.client} value={r.client}>
                    {r.client}
                  </option>
                ))}
              </SelectMenu>
            </Field>
            <Field label="Monthly gross wage (Rs)" error={checked && grossInvalid ? 'Enter a wage greater than zero.' : undefined}>
              <input type="number" className="cc-input" value={gross} onChange={(e) => { setGross(e.target.value); setChecked(false); }} placeholder="e.g. 18500" />
            </Field>
            <Field label="Work location (state)">
              <SelectMenu className="cc-input" value={state} onChange={(e) => { setState(e.target.value); setChecked(false); }}>
                {ESIC_STATES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </SelectMenu>
            </Field>
            <Field label="Contract type">
              <SelectMenu className="cc-input" value={contractType} onChange={(e) => { setContractType(e.target.value); setChecked(false); }}>
                {ESIC_CONTRACT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </SelectMenu>
            </Field>
          </div>
          <label className="flex items-center gap-2 text-xs mt-3 cursor-pointer">
            <input type="checkbox" checked={pwd} onChange={(e) => { setPwd(e.target.checked); setChecked(false); }} />
            <span className="cc-title font-semibold">Person with disability (higher ceiling)</span>
          </label>
          <button type="button" className="cc-btn cc-btn-primary mt-3" onClick={() => setChecked(true)}>
            <Calculator className="w-3.5 h-3.5" /> Check applicability
          </button>

          {checked && !grossInvalid && (
            <div className={cn('cc-callout mt-3', result.applicable ? 'tone-good' : 'tone-bad')} role="status">
              {result.applicable ? <BadgeCheck className="w-4 h-4 shrink-0 mt-0.5" /> : <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />}
              <div className="min-w-0">
                <p className="cc-title text-sm font-bold">{result.applicable ? 'ESIC is applicable' : 'ESIC is not applicable'}</p>
                <p className="mt-0.5 leading-relaxed">{result.reason}</p>
                {result.applicable && (
                  <p className="mt-1.5 tabular-nums">
                    Monthly contribution: employee {fmtInr(result.employeeContribution ?? 0)} + employer {fmtInr(result.employerContribution ?? 0)}
                  </p>
                )}
              </div>
            </div>
          )}
        </SectionCard>
      </div>

      <SectionCard title="Rule change history" subtitle="Who changed which client rule and when">
        <ul className="cc-divide">
          {history.map((h) => (
            <li key={h.id} className="py-2.5 first:pt-0 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 text-xs">
              <span className="min-w-0">
                <b className="cc-title">{h.client}</b>
                <span className="cc-muted"> · {h.action}</span>
              </span>
              <span className="cc-muted whitespace-nowrap">
                {h.actorName} · {h.at}
              </span>
            </li>
          ))}
        </ul>
      </SectionCard>

      {editing && <RuleDialog rule={editing} onClose={() => setEditing(null)} onSave={saveRule} />}
    </div>
  );
};
