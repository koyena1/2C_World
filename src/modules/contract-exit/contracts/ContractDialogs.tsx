import React, { useEffect, useState } from 'react';
import { X, Mail, Send, FileCheck2, Pencil, AlertTriangle } from 'lucide-react';
import {
  INTIMATION_TEMPLATE,
  TEMPLATE_VARIABLES,
  fillTemplate,
  formatContractDate,
  effectiveEndDate,
  systemEndDate,
  type ContractRecord,
} from '../../../data/mockContractData';
import { Chip } from '../../dashboard/command-center/shared';

export const Modal: React.FC<{
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  onClose: () => void;
  footer?: React.ReactNode;
  wide?: boolean;
  children: React.ReactNode;
}> = ({ title, subtitle, icon, onClose, footer, wide, children }) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 animate-in fade-in duration-150" role="dialog" aria-modal="true" aria-label={title}>
      <div className={`cc-card w-full ${wide ? 'max-w-2xl' : 'max-w-lg'} max-h-[92vh] flex flex-col overflow-hidden shadow-2xl`}>
        <div className="p-4 flex items-start justify-between gap-3 border-b" style={{ borderColor: 'var(--cc-divider)' }}>
          <div className="flex items-start gap-2.5 min-w-0">
            <span className="tone-info tone-chip w-8 h-8 rounded-lg flex items-center justify-center shrink-0">{icon}</span>
            <div className="min-w-0">
              <h3 className="cc-title text-sm font-bold">{title}</h3>
              {subtitle && <p className="cc-muted text-[11px] mt-0.5">{subtitle}</p>}
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close dialog" className="cc-muted p-1 rounded hover:opacity-70">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 overflow-y-auto flex-1 text-xs space-y-3">{children}</div>
        {footer && (
          <div className="p-3 sm:p-4 flex flex-wrap justify-end gap-2 border-t" style={{ borderColor: 'var(--cc-divider)' }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export const contractVars = (c: ContractRecord, days: number): Record<string, string> => ({
  poc_name: c.pocName,
  employee_name: c.employeeName,
  employee_code: c.employeeCode,
  designation: c.designation,
  client_name: c.clientName,
  contract_end_date: formatContractDate(effectiveEndDate(c)),
  days_left: String(days),
});

const highlightVars = (text: string) =>
  text.split(/(\{\{\w+\}\})/g).map((part, i) =>
    /^\{\{\w+\}\}$/.test(part) ? (
      <span key={i} className="tone-info tone-chip rounded px-1 font-mono text-[11px]">
        {part}
      </span>
    ) : (
      <React.Fragment key={i}>{part}</React.Fragment>
    )
  );

/** Standard client intimation email: variable template, or filled in for one contract with a send action. */
export const IntimationDialog: React.FC<{
  contract: ContractRecord | null;
  days: number;
  canSend: boolean;
  onSend: () => void;
  onClose: () => void;
}> = ({ contract, days, canSend, onSend, onClose }) => {
  const vars = contract ? contractVars(contract, days) : null;
  const subject = vars ? fillTemplate(INTIMATION_TEMPLATE.subject, vars) : INTIMATION_TEMPLATE.subject;
  const body = vars ? fillTemplate(INTIMATION_TEMPLATE.body, vars) : INTIMATION_TEMPLATE.body;
  return (
    <Modal
      wide
      icon={<Mail className="w-4 h-4" />}
      title={contract ? 'Client intimation email' : 'Standard intimation template'}
      subtitle={contract ? `To ${contract.pocName} <${contract.pocEmail}>` : 'Sent to the client POC 30 days before contract expiry'}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="cc-btn cc-btn-secondary" onClick={onClose}>
            Close
          </button>
          {contract && (
            <button type="button" className="cc-btn cc-btn-primary" disabled={!canSend || Boolean(contract.intimationSentAt)} onClick={onSend}>
              <Send className="w-3.5 h-3.5" /> {contract.intimationSentAt ? 'Already sent' : 'Send intimation'}
            </button>
          )}
        </>
      }
    >
      <div>
        <p className="cc-muted text-[11px] font-semibold uppercase tracking-wide mb-1">Subject</p>
        <p className="cc-title font-semibold break-words">{contract ? subject : highlightVars(subject)}</p>
      </div>
      <div>
        <p className="cc-muted text-[11px] font-semibold uppercase tracking-wide mb-1">Body</p>
        <div className="cc-card p-3 whitespace-pre-line leading-relaxed cc-title font-normal break-words">{contract ? body : highlightVars(body)}</div>
      </div>
      {!contract && (
        <div>
          <p className="cc-muted text-[11px] font-semibold uppercase tracking-wide mb-1">Variables</p>
          <div className="flex flex-wrap gap-1.5">
            {TEMPLATE_VARIABLES.map((v) => (
              <Chip key={v} tone="muted">{`{{${v}}}`}</Chip>
            ))}
          </div>
        </div>
      )}
    </Modal>
  );
};

/** Manual correction of the contract end date with a mandatory reason. */
export const EditPeriodDialog: React.FC<{
  contract: ContractRecord;
  onSave: (endDate: string, reason: string) => void;
  onClearManual: () => void;
  onClose: () => void;
}> = ({ contract, onSave, onClearManual, onClose }) => {
  const [endDate, setEndDate] = useState(effectiveEndDate(contract));
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const sysEnd = systemEndDate(contract);

  const submit = () => {
    if (!endDate) return setError('Select the corrected end date.');
    if (endDate < contract.startDate) return setError('End date cannot be before the contract start date.');
    if (endDate === effectiveEndDate(contract)) return setError('The end date is unchanged.');
    if (reason.trim().length < 5) return setError('Enter a reason for the correction (at least 5 characters).');
    onSave(endDate, reason.trim());
  };

  return (
    <Modal
      icon={<Pencil className="w-4 h-4" />}
      title="Correct contract period"
      subtitle={`${contract.employeeName} · ${contract.clientName}`}
      onClose={onClose}
      footer={
        <>
          {contract.manual && (
            <button type="button" className="cc-btn cc-btn-secondary mr-auto" onClick={onClearManual}>
              Revert to {contract.extension ? 'extension' : 'offer letter'} date
            </button>
          )}
          <button type="button" className="cc-btn cc-btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="cc-btn cc-btn-primary" onClick={submit}>
            Save correction
          </button>
        </>
      }
    >
      <div className="cc-callout tone-info">
        <span>
          Auto-populated from <strong>{contract.extension ? contract.extension.title : contract.sourceLetter}</strong>: ends{' '}
          <strong>{formatContractDate(sysEnd)}</strong>. Both values are kept; the corrected one is marked as edited manually.
        </span>
      </div>
      <div>
        <label className="cc-title font-semibold block mb-1" htmlFor="ct-end">
          Corrected end date
        </label>
        <input id="ct-end" type="date" className="cc-input" value={endDate} onChange={(e) => { setEndDate(e.target.value); setError(''); }} />
      </div>
      <div>
        <label className="cc-title font-semibold block mb-1" htmlFor="ct-reason">
          Reason for correction
        </label>
        <textarea
          id="ct-reason"
          rows={3}
          className="cc-input py-2 h-auto"
          placeholder="e.g. Client confirmed a different handover date"
          value={reason}
          onChange={(e) => { setReason(e.target.value); setError(''); }}
        />
      </div>
      {error && (
        <p className="tone-bad flex items-center gap-1.5 font-semibold" style={{ color: 'var(--tone)' }} role="alert">
          <AlertTriangle className="w-3.5 h-3.5" /> {error}
        </p>
      )}
    </Modal>
  );
};

export const ClosureConfirmDialog: React.FC<{ contracts: ContractRecord[]; onConfirm: () => void; onClose: () => void }> = ({ contracts, onConfirm, onClose }) => (
  <Modal
    icon={<FileCheck2 className="w-4 h-4" />}
    title="Initiate contract closure"
    subtitle={`${contracts.length} contract${contracts.length === 1 ? '' : 's'} selected`}
    onClose={onClose}
    footer={
      <>
        <button type="button" className="cc-btn cc-btn-secondary" onClick={onClose}>
          Cancel
        </button>
        <button type="button" className="cc-btn cc-btn-primary" onClick={onConfirm}>
          Confirm and initiate
        </button>
      </>
    }
  >
    <p className="cc-muted">Closure will be initiated and the Experience Letter can then be generated for each contract.</p>
    <ul className="cc-divide cc-card">
      {contracts.map((c) => (
        <li key={c.id} className="px-3 py-2 flex items-center justify-between gap-2">
          <span className="cc-title font-semibold truncate">{c.employeeName}</span>
          <span className="cc-muted shrink-0">Ends {formatContractDate(effectiveEndDate(c))}</span>
        </li>
      ))}
    </ul>
  </Modal>
);

export const ExperienceLetterDialog: React.FC<{ contract: ContractRecord; generatedOn: string; onClose: () => void }> = ({ contract, generatedOn, onClose }) => (
  <Modal wide icon={<FileCheck2 className="w-4 h-4" />} title="Experience letter" subtitle={`Generated ${generatedOn} (simulated)`} onClose={onClose} footer={<button type="button" className="cc-btn cc-btn-secondary" onClick={onClose}>Close</button>}>
    <div className="cc-card p-4 sm:p-6 space-y-3 leading-relaxed cc-title font-normal">
      <p className="text-center font-bold text-sm tracking-wide">2COMS CONSULTING</p>
      <p className="text-center font-bold underline">EXPERIENCE LETTER</p>
      <p className="cc-muted">Date: {generatedOn} · Ref: EXP/{contract.employeeCode}</p>
      <p>To whomsoever it may concern,</p>
      <p>
        This is to certify that <strong>{contract.employeeName}</strong> ({contract.employeeCode}) was employed with 2COMS Consulting as{' '}
        <strong>{contract.designation}</strong>, deployed at <strong>{contract.clientName}</strong>, from{' '}
        <strong>{formatContractDate(contract.startDate)}</strong> to <strong>{formatContractDate(effectiveEndDate(contract))}</strong>.
      </p>
      <p>During this tenure we found the employee to be sincere and diligent. We wish them every success in future endeavours.</p>
      <p className="pt-3">
        For 2COMS Consulting
        <br />
        <span className="cc-muted">Authorised Signatory, HR Operations</span>
      </p>
    </div>
  </Modal>
);
