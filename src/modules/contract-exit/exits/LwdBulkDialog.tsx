import React, { useMemo, useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import { AllowedFileSizeHint } from '../../../components/common/AllowedFileSizeHint';
import { useRole } from '../../../context/RoleContext';
import { SIMULATED_LWD_ROWS, formatExitDate, type ExitCase } from '../../../data/mockExitData';
import { logAudit } from '../../hr-ops/auditStore';
import { useDocumentRules } from '../../hr-ops/documentRulesStore';
import { updateExitCase, useExitStore } from './exitStore';
import { Overlay, checkFile } from './ExitUi';

interface Props {
  onClose: () => void;
  onDone: (message: string) => void;
}

const validate = (empCode: string, lwd: string, cases: ExitCase[]): { ec?: ExitCase; error?: string } => {
  const ec = cases.find((c) => c.empCode === empCode);
  if (!ec) return { error: 'Employee code not found' };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(lwd) || Number.isNaN(Date.parse(lwd))) return { ec, error: 'Invalid date (use YYYY-MM-DD)' };
  if (ec.status === 'Closed') return { ec, error: 'Exit case already closed' };
  if (lwd < ec.noticeDate) return { ec, error: `LWD is before notice date (${formatExitDate(ec.noticeDate)})` };
  return { ec };
};

/** Existing "LWD bulk upload" option: file input, simulated parse, valid/invalid preview, apply. */
export const LwdBulkDialog: React.FC<Props> = ({ onClose, onDone }) => {
  const { actor } = useRole();
  const { cases } = useExitStore();
  const rule = useDocumentRules().find((r) => r.id === 'bulk');
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const rows = useMemo(() => (file ? SIMULATED_LWD_ROWS.map((r) => ({ ...r, ...validate(r.empCode, r.lwd, cases) })) : []), [file, cases]);
  const valid = rows.filter((r) => !r.error);

  const pick = (f: File | undefined) => {
    if (!f) return;
    const err = rule ? checkFile(f.name, f.size, rule.formats, rule.maxMb) : null;
    setError(err);
    setFile(err ? null : f);
  };

  const apply = () => {
    valid.forEach((r) => r.ec && updateExitCase(r.ec.id, { lwd: r.lwd }));
    logAudit({ area: 'exit-module', action: `LWD bulk upload (${file?.name}): ${valid.length} updated, ${rows.length - valid.length} rejected`, actorId: actor.id, actorName: actor.name });
    onDone(`LWD updated for ${valid.length} employee(s)`);
    onClose();
  };

  return (
    <Overlay
      title="LWD bulk upload"
      subtitle="Upload a sheet with Employee code and Last working day columns."
      wide
      onClose={onClose}
      footer={
        <>
          <button type="button" className="cc-btn cc-btn-secondary" onClick={onClose}>Cancel</button>
          <button type="button" className="cc-btn cc-btn-primary" onClick={apply} disabled={valid.length === 0}>Apply {valid.length} valid row(s)</button>
        </>
      }
    >
      <div>
        <input ref={inputRef} type="file" accept=".csv,.xlsx" className="hidden" aria-label="LWD file" onChange={(e) => pick(e.target.files?.[0])} />
        <button type="button" className="cc-dropzone w-full" onClick={() => inputRef.current?.click()}>
          <Upload className="w-5 h-5 cc-accent" />
          <span className="cc-title text-xs font-semibold">{file ? file.name : 'Choose CSV / XLSX file'}</span>
          <AllowedFileSizeHint rule="bulk" />
        </button>
        {error && <p className="text-xs mt-2 tone-bad" style={{ color: 'var(--tone)' }} role="alert">{error}</p>}
      </div>
      {file && (
        <>
          <p className="cc-muted text-xs">Simulated parse: <strong>{valid.length}</strong> valid, <strong>{rows.length - valid.length}</strong> invalid of {rows.length} rows.</p>
          <div className="cc-table-wrap">
            <table className="cc-table">
              <thead><tr><th>Employee code</th><th>Employee</th><th>New LWD</th><th>Result</th></tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.empCode}>
                    <td className="whitespace-nowrap">{r.empCode}</td>
                    <td>{r.ec?.employee ?? '—'}</td>
                    <td className="whitespace-nowrap">{r.lwd}</td>
                    <td>{r.error ? <span className="tone-bad tone-chip px-2 py-0.5 rounded-md text-[11px] font-semibold">{r.error}</span> : <span className="tone-good tone-chip px-2 py-0.5 rounded-md text-[11px] font-semibold">Valid</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </Overlay>
  );
};
