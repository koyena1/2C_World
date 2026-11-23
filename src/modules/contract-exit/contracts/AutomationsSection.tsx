import React, { useState } from 'react';
import { PhoneCall, Play, PhoneForwarded, Save } from 'lucide-react';
import { SectionCard, Chip } from '../../dashboard/command-center/shared';
import type { Tone } from '../../dashboard/command-center/types';
import {
  TEMPLATE_VARIABLES,
  type CallLogRow,
  type CallOutcome,
  type CallWorkflow,
  type ContractRecord,
} from '../../../data/mockContractData';

const OUTCOME_TONE: Record<CallOutcome, Tone> = { Connected: 'good', 'No answer': 'bad', Callback: 'warn' };

interface Props {
  workflows: CallWorkflow[];
  log: CallLogRow[];
  contracts: ContractRecord[];
  daysLeftOf: (c: ContractRecord) => number;
  canManage: boolean;
  onChangeWorkflow: (id: CallWorkflow['id'], patch: Partial<CallWorkflow>, note: string) => void;
  onRunNow: () => void;
}

const WorkflowCard: React.FC<{
  wf: CallWorkflow;
  inScope: number;
  canManage: boolean;
  onChange: Props['onChangeWorkflow'];
}> = ({ wf, inScope, canManage, onChange }) => {
  const [script, setScript] = useState(wf.script);
  const [triggers, setTriggers] = useState(wf.triggerDays.join(', '));
  const [error, setError] = useState('');
  const dirty = script !== wf.script || triggers !== wf.triggerDays.join(', ');

  const save = () => {
    const days = triggers.split(',').map((s) => Number(s.trim())).filter((n) => Number.isFinite(n) && n > 0);
    if (days.length === 0 || triggers.split(',').some((s) => !/^\s*\d+\s*$/.test(s))) return setError('Triggers must be comma-separated day counts, e.g. 45, 35.');
    if (script.trim().length < 20) return setError('Call script is too short.');
    setError('');
    onChange(wf.id, { triggerDays: [...new Set(days)].sort((a, b) => b - a), script: script.trim() }, 'updated trigger and script for');
  };

  return (
    <div className="cc-card p-3.5 sm:p-4 space-y-3 min-w-0">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="cc-title text-sm font-bold flex items-center gap-1.5">
            <PhoneCall className="w-4 h-4 shrink-0" /> {wf.name}
          </h3>
          <p className="cc-muted text-[11px] mt-0.5">{wf.description}</p>
        </div>
        <label className="flex items-center gap-2 shrink-0 cursor-pointer">
          <span className={`text-[11px] font-semibold ${wf.enabled ? 'tone-good' : 'cc-muted'}`} style={wf.enabled ? { color: 'var(--tone)' } : undefined}>
            {wf.enabled ? 'Enabled' : 'Disabled'}
          </span>
          <input
            type="checkbox"
            role="switch"
            className="w-4 h-4"
            checked={wf.enabled}
            disabled={!canManage}
            aria-label={`${wf.name} enabled`}
            onChange={(e) => onChange(wf.id, { enabled: e.target.checked }, e.target.checked ? 'enabled' : 'disabled')}
          />
        </label>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
        <div>
          <label className="cc-muted font-semibold block mb-1" htmlFor={`trg-${wf.id}`}>
            Trigger (days before expiry)
          </label>
          <input id={`trg-${wf.id}`} className="cc-input" value={triggers} disabled={!canManage} onChange={(e) => setTriggers(e.target.value)} />
        </div>
        <div>
          <span className="cc-muted font-semibold block mb-1">Retry rules</span>
          <p className="cc-title font-semibold leading-8">
            Up to {wf.maxAttempts} attempts, every {wf.retryAfterHours}h
          </p>
        </div>
        <div>
          <span className="cc-muted font-semibold block mb-1">Contracts in scope</span>
          <p className="cc-title font-semibold leading-8">{inScope} today</p>
        </div>
      </div>
      <div>
        <label className="cc-muted text-[11px] font-semibold block mb-1" htmlFor={`scr-${wf.id}`}>
          Call script
        </label>
        <textarea id={`scr-${wf.id}`} rows={5} className="cc-input h-auto py-2 leading-relaxed" value={script} disabled={!canManage} onChange={(e) => setScript(e.target.value)} />
        <p className="cc-hint">Variables: {TEMPLATE_VARIABLES.map((v) => `{{${v}}}`).join(' ')}</p>
      </div>
      {error && (
        <p className="tone-bad text-[11px] font-semibold" style={{ color: 'var(--tone)' }} role="alert">
          {error}
        </p>
      )}
      {canManage && (
        <div className="flex justify-end">
          <button type="button" className="cc-btn cc-btn-secondary" disabled={!dirty} onClick={save}>
            <Save className="w-3.5 h-3.5" /> Save workflow
          </button>
        </div>
      )}
    </div>
  );
};

export const AutomationsSection: React.FC<Props> = ({ workflows, log, contracts, daysLeftOf, canManage, onChangeWorkflow, onRunNow }) => {
  const anyEnabled = workflows.some((w) => w.enabled);
  const scope = (wf: CallWorkflow) => {
    const max = Math.max(...wf.triggerDays);
    return contracts.filter((c) => c.closureStatus !== 'Experience letter generated' && daysLeftOf(c) >= 0 && daysLeftOf(c) <= max).length;
  };
  return (
    <SectionCard
      title="Automations: auto calls"
      subtitle="Contract extension and closure calls run automatically before expiry"
      action={
        <button type="button" className="cc-btn cc-btn-primary shrink-0" disabled={!canManage || !anyEnabled} onClick={onRunNow}>
          <Play className="w-3.5 h-3.5" /> Run now (simulate)
        </button>
      }
    >
      {!canManage && <p className="cc-muted text-[11px] mb-3">View only: Admin and HR manage workflows.</p>}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 sm:gap-4">
        {workflows.map((wf) => (
          <WorkflowCard key={wf.id} wf={wf} inScope={scope(wf)} canManage={canManage} onChange={onChangeWorkflow} />
        ))}
      </div>
      <h3 className="cc-title text-xs font-bold mt-5 mb-2 flex items-center gap-1.5">
        <PhoneForwarded className="w-3.5 h-3.5" /> Call log
      </h3>
      <div className="cc-table-wrap max-h-80">
        <table className="cc-table min-w-[560px]">
          <thead>
            <tr>
              <th>Contract</th>
              <th>Workflow</th>
              <th>Attempt</th>
              <th>Outcome</th>
              <th>Time</th>
            </tr>
          </thead>
          <tbody>
            {log.map((r) => (
              <tr key={r.id}>
                <td>
                  <span className="cc-title font-semibold">{r.employeeName}</span> <span className="cc-muted">{r.contractId}</span>
                </td>
                <td>{r.workflow === 'extension' ? 'Extension call' : 'Closure call'}</td>
                <td className="tabular-nums">{r.attempt}</td>
                <td>
                  <Chip tone={OUTCOME_TONE[r.outcome]}>{r.outcome}</Chip>
                </td>
                <td className="whitespace-nowrap tabular-nums">{r.at}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
};
