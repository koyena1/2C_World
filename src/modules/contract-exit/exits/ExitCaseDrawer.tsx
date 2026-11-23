import React from 'react';
import { Lock } from 'lucide-react';
import { SelectMenu } from '../../../components/ui/SelectMenu';
import { StepProgress } from '../../../components/page/StepProgress';
import { useRole } from '../../../context/RoleContext';
import { EXIT_STATUSES, SEED_EXIT_HISTORY, TRANSFER_STATES, formatExitDate, type ExitStatus, type TransferClearance } from '../../../data/mockExitData';
import { Chip } from '../../dashboard/command-center/shared';
import { formatAuditTime, logAudit, useAuditLog } from '../../hr-ops/auditStore';
import { updateExitCase, useExitStore } from './exitStore';
import { Overlay, STATUS_TONE, TRANSFER_TONE } from './ExitUi';

interface Props {
  caseId: string;
  canManage: boolean;
  onClose: () => void;
  onToast: (m: string) => void;
}

export const ExitCaseDrawer: React.FC<Props> = ({ caseId, canManage, onClose, onToast }) => {
  const { actor } = useRole();
  const { cases } = useExitStore();
  const live = useAuditLog({ area: 'exit-module' }).filter((a) => a.subjectId === caseId);
  const ec = cases.find((c) => c.id === caseId);
  if (!ec) return null;

  const idx = EXIT_STATUSES.indexOf(ec.status);
  const next: ExitStatus | undefined = EXIT_STATUSES[idx + 1];
  const transferBlocks = next === 'F&F' && ec.transfer === 'Pending transfer closure';
  const audit = (action: string) => logAudit({ area: 'exit-module', action, subjectId: ec.id, actorId: actor.id, actorName: actor.name });

  const advance = () => {
    if (!next || transferBlocks) return;
    updateExitCase(ec.id, { status: next });
    audit(`Moved to ${next}`);
    onToast(`${ec.employee} moved to ${next}`);
  };
  const setTransfer = (t: TransferClearance) => {
    updateExitCase(ec.id, { transfer: t });
    audit(`Transfer clearance set to ${t}`);
    onToast(`Transfer clearance: ${t}`);
  };
  const setLwd = (v: string) => {
    if (!v) return;
    if (v < ec.noticeDate) return onToast('LWD cannot be before the notice date');
    updateExitCase(ec.id, { lwd: v });
    audit(`LWD set to ${v}`);
    onToast('Last working day updated');
  };

  const history = [
    ...live.map((a) => ({ id: a.id, action: a.action, who: a.actorName, at: a.at })),
    ...SEED_EXIT_HISTORY.filter((h) => h.caseId === caseId).map((h) => ({ id: h.id, action: h.action, who: h.actorName, at: h.at })),
  ];

  return (
    <Overlay
      variant="drawer"
      title={ec.employee}
      subtitle={`${ec.id} · ${ec.empCode} · ${ec.client}`}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="cc-btn cc-btn-secondary" onClick={onClose}>Close</button>
          {canManage && next && (
            <button type="button" className="cc-btn cc-btn-primary" disabled={transferBlocks} onClick={advance}>
              {next === 'Closed' ? 'Close case' : `Move to ${next}`}
            </button>
          )}
        </>
      }
    >
      <StepProgress
        steps={EXIT_STATUSES.map((s, i) => ({ label: s, status: i < idx || ec.status === 'Closed' ? 'done' : i === idx ? 'current' : 'todo' }))}
      />
      <dl className="grid grid-cols-2 gap-x-3 gap-y-3 text-xs">
        <div><dt className="cc-muted">Exit type</dt><dd className="cc-title font-semibold">{ec.exitType}</dd></div>
        <div><dt className="cc-muted">Status</dt><dd><Chip tone={STATUS_TONE[ec.status]}>{ec.status}</Chip></dd></div>
        <div><dt className="cc-muted">Designation</dt><dd className="cc-title">{ec.designation}</dd></div>
        <div><dt className="cc-muted">Case owner</dt><dd className="cc-title">{ec.owner}</dd></div>
        <div><dt className="cc-muted">Notice date</dt><dd className="cc-title">{formatExitDate(ec.noticeDate)}</dd></div>
        <div>
          <dt className="cc-muted">Last working day</dt>
          <dd>
            {canManage && ec.status !== 'Closed' ? (
              <input type="date" className="cc-input" value={ec.lwd ?? ''} onChange={(e) => setLwd(e.target.value)} aria-label="Last working day" />
            ) : (
              <span className="cc-title">{formatExitDate(ec.lwd)}</span>
            )}
          </dd>
        </div>
        <div className="col-span-2"><dt className="cc-muted">Reason</dt><dd className="cc-title">{ec.reason}</dd></div>
      </dl>

      <div className="cc-card p-3 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <h4 className="cc-title text-xs font-bold">Transfer clearance</h4>
          <Chip tone={TRANSFER_TONE[ec.transfer]}>{ec.transfer}</Chip>
        </div>
        {canManage && ec.status !== 'Closed' && (
          <SelectMenu value={ec.transfer} onChange={(e) => setTransfer(e.target.value as TransferClearance)} className="cc-input" aria-label="Transfer clearance">
            {TRANSFER_STATES.map((t) => <option key={t} value={t}>{t}</option>)}
          </SelectMenu>
        )}
        <p className="cc-hint">The Transfer module is still being built, so closure is recorded here by hand. A case with a pending transfer cannot move to F&amp;F until this is Cleared.</p>
        {transferBlocks && (
          <div className="cc-callout tone-warn" role="alert"><Lock className="w-4 h-4 shrink-0" />Blocked: clear the transfer first, then move to F&amp;F.</div>
        )}
      </div>

      <div>
        <h4 className="cc-title text-xs font-bold mb-2">History</h4>
        {history.length === 0 ? (
          <p className="cc-muted text-xs">No changes recorded yet.</p>
        ) : (
          <ul className="cc-divide text-xs">
            {history.map((h) => (
              <li key={h.id} className="py-2">
                <p className="cc-title">{h.action}</p>
                <p className="cc-muted">{h.who} · {formatAuditTime(h.at)}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Overlay>
  );
};
