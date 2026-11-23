import React, { useMemo, useState } from 'react';
import { SelectMenu } from '../../../components/ui/SelectMenu';
import { useRole } from '../../../context/RoleContext';
import type { Candidate } from '../../../types/onboarding';
import { EXIT_TODAY, EXIT_TYPES, TRANSFER_STATES, type ExitType, type TransferClearance } from '../../../data/mockExitData';
import { logAudit } from '../../hr-ops/auditStore';
import { addExitCase, nextCaseId, nextEmpCode, useExitStore } from './exitStore';
import { Overlay } from './ExitUi';

interface Props {
  candidates: Candidate[];
  onClose: () => void;
  onDone: (message: string) => void;
}

export const InitiateExitDialog: React.FC<Props> = ({ candidates, onClose, onDone }) => {
  const { actor } = useRole();
  const { cases } = useExitStore();
  const options = useMemo(() => {
    const busy = new Set(cases.filter((c) => c.status !== 'Closed').map((c) => c.employee));
    return candidates.map((c) => ({ id: c.id, name: `${c.firstName} ${c.lastName}`.trim(), client: c.clientName, designation: c.designation })).filter((o) => !busy.has(o.name));
  }, [candidates, cases]);

  const [empId, setEmpId] = useState(options[0]?.id ?? '');
  const [exitType, setExitType] = useState<ExitType>('Resignation');
  const [noticeDate, setNoticeDate] = useState(EXIT_TODAY);
  const [lwd, setLwd] = useState('');
  const [reason, setReason] = useState('');
  const [transfer, setTransfer] = useState<TransferClearance>('Not applicable');
  const [errors, setErrors] = useState<string[]>([]);

  const submit = () => {
    const emp = options.find((o) => o.id === empId);
    const errs: string[] = [];
    if (!emp) errs.push('Select an employee.');
    if (!noticeDate) errs.push('Notice date is required.');
    if (!lwd) errs.push('Last working day is required (for an unreleased offer use "Mark as Offer Not Rolled Out").');
    else if (noticeDate && lwd < noticeDate) errs.push('Last working day cannot be before the notice date.');
    if (reason.trim().length < 3) errs.push('Enter a reason for the exit.');
    setErrors(errs);
    if (errs.length || !emp) return;
    const id = nextCaseId();
    addExitCase({
      id,
      empCode: nextEmpCode(),
      employee: emp.name,
      client: emp.client,
      designation: emp.designation,
      exitType,
      noticeDate,
      lwd,
      status: 'Initiated',
      transfer,
      reason: reason.trim(),
      owner: actor.name,
    });
    logAudit({ area: 'exit-module', action: `Exit initiated for ${emp.name} (${exitType}), LWD ${lwd}`, subjectId: id, actorId: actor.id, actorName: actor.name });
    onDone(`Exit initiated for ${emp.name}`);
    onClose();
  };

  return (
    <Overlay
      title="Initiate exit"
      subtitle="Create an exit case. It starts at Initiated and moves through the pipeline."
      onClose={onClose}
      footer={
        <>
          <button type="button" className="cc-btn cc-btn-secondary" onClick={onClose}>Cancel</button>
          <button type="button" className="cc-btn cc-btn-primary" onClick={submit}>Initiate exit</button>
        </>
      }
    >
      {errors.length > 0 && (
        <div className="cc-callout tone-bad" role="alert">
          <ul className="list-disc pl-4 space-y-0.5">{errors.map((e) => <li key={e}>{e}</li>)}</ul>
        </div>
      )}
      <div>
        <label className="cc-label">Employee</label>
        <SelectMenu value={empId} onChange={(e) => setEmpId(e.target.value)} className="cc-input" aria-label="Employee">
          {options.map((o) => <option key={o.id} value={o.id}>{o.name} - {o.client}</option>)}
        </SelectMenu>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="cc-label">Exit type</label>
          <SelectMenu value={exitType} onChange={(e) => setExitType(e.target.value as ExitType)} className="cc-input" aria-label="Exit type">
            {EXIT_TYPES.filter((t) => t !== 'Offer Not Rolled Out').map((t) => <option key={t} value={t}>{t}</option>)}
          </SelectMenu>
        </div>
        <div>
          <label className="cc-label">Transfer clearance</label>
          <SelectMenu value={transfer} onChange={(e) => setTransfer(e.target.value as TransferClearance)} className="cc-input" aria-label="Transfer clearance">
            {TRANSFER_STATES.map((t) => <option key={t} value={t}>{t}</option>)}
          </SelectMenu>
        </div>
        <div>
          <label className="cc-label" htmlFor="ex-notice">Notice date</label>
          <input id="ex-notice" type="date" className="cc-input" value={noticeDate} onChange={(e) => setNoticeDate(e.target.value)} />
        </div>
        <div>
          <label className="cc-label" htmlFor="ex-lwd">Last working day</label>
          <input id="ex-lwd" type="date" className="cc-input" value={lwd} onChange={(e) => setLwd(e.target.value)} />
        </div>
      </div>
      <p className="cc-hint">Transfer module is not live yet. If the employee has an open transfer, choose "Pending transfer closure": the case cannot move to F&amp;F until it is Cleared.</p>
      <div>
        <label className="cc-label" htmlFor="ex-reason">Reason</label>
        <textarea id="ex-reason" rows={3} className="cc-input !h-auto py-2" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Better opportunity" />
      </div>
    </Overlay>
  );
};
