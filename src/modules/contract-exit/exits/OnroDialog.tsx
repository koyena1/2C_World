import React, { useMemo, useState } from 'react';
import { CheckCircle2, ShieldAlert } from 'lucide-react';
import { SelectMenu } from '../../../components/ui/SelectMenu';
import { useRole } from '../../../context/RoleContext';
import { EXIT_TODAY, ONRO_POOL, evaluateEligibility } from '../../../data/mockExitData';
import { logAudit } from '../../hr-ops/auditStore';
import { addExitCase, nextCaseId, nextEmpCode, useExitStore } from './exitStore';
import { Overlay } from './ExitUi';

interface Props {
  onClose: () => void;
  onDone: (message: string) => void;
}

/** Marks a candidate as "Offer Not Rolled Out" after validating against the live eligibility rules. */
export const OnroDialog: React.FC<Props> = ({ onClose, onDone }) => {
  const { actor } = useRole();
  const { cases, rules } = useExitStore();
  const pool = useMemo(() => ONRO_POOL.filter((p) => !cases.some((c) => c.exitType === 'Offer Not Rolled Out' && c.employee === p.name)), [cases]);
  const [candId, setCandId] = useState(pool[0]?.id ?? '');
  const [reason, setReason] = useState('');
  const [lwd, setLwd] = useState('');
  const [blocked, setBlocked] = useState<string[] | null>(null);

  const cand = pool.find((p) => p.id === candId);

  const submit = () => {
    if (!cand) return;
    const reasons = evaluateEligibility(cand, rules, reason);
    setBlocked(reasons);
    if (reasons.length) {
      logAudit({ area: 'exit-eligibility', action: `Offer Not Rolled Out blocked for ${cand.name}: ${reasons.length} rule(s) failed`, subjectId: cand.id, actorId: actor.id, actorName: actor.name });
      return;
    }
    const id = nextCaseId();
    addExitCase({
      id,
      empCode: nextEmpCode(),
      employee: cand.name,
      client: cand.client,
      designation: cand.designation,
      exitType: 'Offer Not Rolled Out',
      noticeDate: EXIT_TODAY,
      lwd: lwd || null,
      status: 'Initiated',
      transfer: 'Not applicable',
      reason: reason.trim(),
      owner: actor.name,
    });
    logAudit({ area: 'exit-eligibility', action: `Marked ${cand.name} as Offer Not Rolled Out${lwd ? ` (LWD ${lwd})` : ' (no LWD)'}`, subjectId: id, actorId: actor.id, actorName: actor.name });
    onDone(`${cand.name} marked as Offer Not Rolled Out`);
    onClose();
  };

  const flag = (v: boolean, bad: string, good: string) => (v ? <span className="tone-bad tone-chip px-1.5 py-0.5 rounded justify-self-start text-[11px] font-semibold">{bad}</span> : <span className="tone-good tone-chip px-1.5 py-0.5 rounded justify-self-start text-[11px] font-semibold">{good}</span>);

  return (
    <Overlay
      title="Mark as Offer Not Rolled Out"
      subtitle="Checked against the eligibility rules in force."
      onClose={onClose}
      footer={
        <>
          <button type="button" className="cc-btn cc-btn-secondary" onClick={onClose}>Cancel</button>
          <button type="button" className="cc-btn cc-btn-primary" onClick={submit} disabled={!cand}>Validate &amp; mark</button>
        </>
      }
    >
      <div>
        <label className="cc-label">Candidate / employee</label>
        <SelectMenu value={candId} onChange={(e) => { setCandId(e.target.value); setBlocked(null); }} className="cc-input" aria-label="Candidate">
          {pool.map((p) => <option key={p.id} value={p.id}>{p.name} - {p.client}</option>)}
        </SelectMenu>
      </div>
      {cand && (
        <div className="cc-card p-3 text-xs grid grid-cols-2 gap-x-3 gap-y-2">
          <span className="cc-muted">Offer letter</span>{flag(cand.offerReleased, 'Released', 'Not released')}
          <span className="cc-muted">Payroll run</span>{flag(cand.payrollRun, 'Processed', 'None')}
          <span className="cc-muted">Reported to work</span>{flag(cand.reported, 'Yes', 'No')}
          <span className="cc-muted">Joining formalities</span>
          {cand.formalitiesDone ? <span className="tone-good tone-chip px-1.5 py-0.5 rounded justify-self-start text-[11px] font-semibold">Completed</span> : <span className="tone-muted tone-chip px-1.5 py-0.5 rounded justify-self-start text-[11px] font-semibold">Not completed</span>}
        </div>
      )}
      <div>
        <label className="cc-label" htmlFor="onro-lwd">Last working day (optional)</label>
        <input id="onro-lwd" type="date" className="cc-input" value={lwd} onChange={(e) => setLwd(e.target.value)} />
        <p className="cc-hint">Not required: an LWD / completed joining formalities is no longer mandatory for this exit type.</p>
      </div>
      <div>
        <label className="cc-label" htmlFor="onro-reason">Reason</label>
        <textarea id="onro-reason" rows={2} className="cc-input !h-auto py-2" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Client withdrew the requirement" />
      </div>
      {blocked && blocked.length > 0 && (
        <div className="cc-callout tone-bad" role="alert">
          <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Cannot mark as Offer Not Rolled Out</p>
            <ul className="list-disc pl-4 mt-1 space-y-0.5">{blocked.map((b) => <li key={b}>{b}</li>)}</ul>
          </div>
        </div>
      )}
      {blocked && blocked.length === 0 && (
        <div className="cc-callout tone-good"><CheckCircle2 className="w-4 h-4" />All rules passed.</div>
      )}
    </Overlay>
  );
};
