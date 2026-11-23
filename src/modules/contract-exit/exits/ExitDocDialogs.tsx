import React, { useMemo, useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import { AllowedFileSizeHint } from '../../../components/common/AllowedFileSizeHint';
import { SelectMenu } from '../../../components/ui/SelectMenu';
import { useRole } from '../../../context/RoleContext';
import { EXIT_DOC_TYPES, SIMULATED_DOC_ROWS, requiredDocIds } from '../../../data/mockExitData';
import { logAudit } from '../../hr-ops/auditStore';
import { useDocumentRules } from '../../hr-ops/documentRulesStore';
import { setExitDoc, useExitStore } from './exitStore';
import { docLabel, uploadExitDoc } from './exitDocActions';
import { Overlay, checkFile, formatKb } from './ExitUi';

interface DialogProps {
  onClose: () => void;
  onDone: (message: string) => void;
}

/** Single entry: pick one employee's exit case, attach one or more of the standard documents. */
export const AddExitDocsDialog: React.FC<DialogProps & { initialCaseId?: string }> = ({ onClose, onDone, initialCaseId }) => {
  const { actor } = useRole();
  const { cases, docs } = useExitStore();
  const rule = useDocumentRules().find((r) => r.id === 'experience');
  const eligible = cases.filter((c) => requiredDocIds(c.exitType).length > 0);
  const [caseId, setCaseId] = useState(initialCaseId ?? eligible[0]?.id ?? '');
  const [files, setFiles] = useState<Record<string, File>>({});
  const [errors, setErrors] = useState<string[]>([]);
  const ec = cases.find((c) => c.id === caseId);

  const pick = (docId: string, f: File | undefined) => {
    if (!f) return;
    setFiles((p) => ({ ...p, [docId]: f }));
  };

  const submit = () => {
    if (!ec) return;
    const picked = Object.entries(files);
    if (picked.length === 0) return setErrors(['Choose at least one file.']);
    const errs = picked.map(([id, f]) => (rule ? checkFile(f.name, f.size, rule.formats, rule.maxMb) : null)).filter((e): e is string => Boolean(e));
    setErrors(errs);
    if (errs.length) return;
    picked.forEach(([id, f]) => uploadExitDoc(ec, id, f, rule, actor, docs[ec.id]?.[id]?.version ?? 0));
    onDone(`${picked.length} document(s) saved for ${ec.employee}`);
    onClose();
  };

  return (
    <Overlay
      title="Add exit documentation"
      subtitle="Single entry for one employee"
      onClose={onClose}
      footer={
        <>
          <button type="button" className="cc-btn cc-btn-secondary" onClick={onClose}>Cancel</button>
          <button type="button" className="cc-btn cc-btn-primary" onClick={submit}>Save documents</button>
        </>
      }
    >
      <div>
        <label className="cc-label">Employee exit case</label>
        <SelectMenu value={caseId} onChange={(e) => { setCaseId(e.target.value); setFiles({}); setErrors([]); }} className="cc-input" aria-label="Exit case">
          {eligible.map((c) => <option key={c.id} value={c.id}>{c.employee} - {c.exitType} ({c.id})</option>)}
        </SelectMenu>
      </div>
      {errors.length > 0 && (
        <div className="cc-callout tone-bad" role="alert"><ul className="list-disc pl-4 space-y-0.5">{errors.map((e) => <li key={e}>{e}</li>)}</ul></div>
      )}
      {ec && (
        <ul className="cc-divide">
          {EXIT_DOC_TYPES.map((d) => {
            const required = requiredDocIds(ec.exitType).includes(d.id);
            const existing = docs[ec.id]?.[d.id];
            return (
              <li key={d.id} className="py-2.5 flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="cc-title text-xs font-semibold">{d.label}{!required && <span className="cc-muted font-normal"> (not required)</span>}</p>
                  <p className="cc-muted text-[11px] truncate">{files[d.id]?.name ?? (existing ? `On file: ${existing.fileName}` : 'No file yet')}</p>
                </div>
                <label className="cc-btn cc-btn-secondary cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />{existing ? 'Replace' : 'Choose file'}
                  <input type="file" className="hidden" accept=".pdf" aria-label={`File for ${d.label}`} onChange={(e) => pick(d.id, e.target.files?.[0])} />
                </label>
              </li>
            );
          })}
        </ul>
      )}
      <AllowedFileSizeHint rule="experience" />
    </Overlay>
  );
};

/** Bulk entry: file input, simulated parse, valid/invalid preview, apply. */
export const BulkExitDocsDialog: React.FC<DialogProps> = ({ onClose, onDone }) => {
  const { actor } = useRole();
  const { cases, docs } = useExitStore();
  const rules = useDocumentRules();
  const bulkRule = rules.find((r) => r.id === 'bulk');
  const docRule = rules.find((r) => r.id === 'experience');
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const rows = useMemo(
    () =>
      file
        ? SIMULATED_DOC_ROWS.map((r) => {
            const ec = cases.find((c) => c.empCode === r.empCode);
            let err: string | undefined;
            if (!ec) err = 'Employee code not found';
            else if (!requiredDocIds(ec.exitType).includes(r.docTypeId)) err = `Not required for ${ec.exitType}`;
            else if (docRule) err = checkFile(r.fileName, r.sizeMb * 1048576, docRule.formats, docRule.maxMb)?.replace(`${r.fileName}: `, '') ?? undefined;
            return { ...r, ec, err };
          })
        : [],
    [file, cases, docRule]
  );
  const valid = rows.filter((r) => !r.err);

  const pick = (f: File | undefined) => {
    if (!f) return;
    const err = bulkRule ? checkFile(f.name, f.size, bulkRule.formats, bulkRule.maxMb) : null;
    setError(err);
    setFile(err ? null : f);
  };

  const apply = () => {
    valid.forEach((r) => {
      if (!r.ec) return;
      const prev = docs[r.ec.id]?.[r.docTypeId];
      setExitDoc(r.ec.id, r.docTypeId, { fileName: r.fileName, sizeKb: r.sizeMb * 1024, by: actor.name, at: new Date().toISOString(), version: (prev?.version ?? 0) + 1 });
    });
    logAudit({ area: 'exit-documentation', action: `Bulk exit-document upload (${file?.name}): ${valid.length} applied, ${rows.length - valid.length} rejected`, actorId: actor.id, actorName: actor.name });
    onDone(`${valid.length} document(s) applied from bulk upload`);
    onClose();
  };

  return (
    <Overlay
      title="Bulk exit documentation upload"
      subtitle="Upload a sheet listing Employee code, Document type and File name."
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
        <input ref={inputRef} type="file" accept=".csv,.xlsx" className="hidden" aria-label="Bulk file" onChange={(e) => pick(e.target.files?.[0])} />
        <button type="button" className="cc-dropzone w-full" onClick={() => inputRef.current?.click()}>
          <Upload className="w-5 h-5 cc-accent" />
          <span className="cc-title text-xs font-semibold">{file ? file.name : 'Choose CSV / XLSX file'}</span>
          <AllowedFileSizeHint rule="bulk" />
        </button>
        {error && <p className="text-xs mt-2 tone-bad" style={{ color: 'var(--tone)' }} role="alert">{error}</p>}
      </div>
      {file && (
        <>
          <p className="cc-muted text-xs">Simulated parse: <strong>{valid.length}</strong> valid, <strong>{rows.length - valid.length}</strong> invalid of {rows.length} rows. Individual documents follow the "experience" size rule.</p>
          <div className="cc-table-wrap">
            <table className="cc-table">
              <thead><tr><th>Employee</th><th>Document</th><th>File</th><th>Result</th></tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={`${r.empCode}-${r.docTypeId}`}>
                    <td className="whitespace-nowrap">{r.ec?.employee ?? r.empCode}</td>
                    <td className="whitespace-nowrap">{docLabel(r.docTypeId)}</td>
                    <td>{r.fileName} <span className="cc-muted">({formatKb(r.sizeMb * 1024)})</span></td>
                    <td>{r.err ? <span className="tone-bad tone-chip px-2 py-0.5 rounded-md text-[11px] font-semibold">{r.err}</span> : <span className="tone-good tone-chip px-2 py-0.5 rounded-md text-[11px] font-semibold">Valid</span>}</td>
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
