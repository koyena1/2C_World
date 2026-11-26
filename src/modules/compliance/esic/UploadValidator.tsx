import React, { useMemo, useRef, useState } from 'react';
import { CheckCircle2, ClipboardCheck, Download, FileSpreadsheet, ListChecks, Pencil, Trash2, UploadCloud, XCircle } from 'lucide-react';
import { SectionCard } from '../../../components/page/SectionCard';
import { KpiCard } from '../../../components/page/KpiCard';
import { KpiDetailPanel, type KpiDetailData } from '../../../components/page/KpiDetailPanel';
import { useKpiDetail } from '../../../hooks/useKpiDetail';
import { Chip } from '../../dashboard/command-center/shared';
import { cn } from '../../../utils/cn';
import { downloadCsv } from '../../../utils/download';
import { useRole, useFeatureAccess } from '../../../context/RoleContext';
import { logAudit } from '../../hr-ops/auditStore';
import {
  INITIAL_ESIC_BATCH,
  INITIAL_ESIC_FILE_NAME,
  parseEsicCsv,
  validateEsicRow,
  type EsicUploadRow,
} from '../../../data/mockEsicData';
import { ViewOnlyNote } from './ui';

type Filter = 'all' | 'errors' | 'valid';

const csvCell = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;

interface Props {
  notify: (message: string) => void;
}

export const UploadValidator: React.FC<Props> = ({ notify }) => {
  const access = useFeatureAccess('esic-validation');
  const { actor } = useRole();
  const canManage = access === 'manage';
  const fileRef = useRef<HTMLInputElement>(null);

  const [fileName, setFileName] = useState(INITIAL_ESIC_FILE_NAME);
  const [rows, setRows] = useState<EsicUploadRow[]>(INITIAL_ESIC_BATCH);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState<Filter>('all');
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  const results = useMemo(() => Object.fromEntries(rows.map((r) => [r.id, validateEsicRow(r, rows)])), [rows]);
  const errorRows = rows.filter((r) => results[r.id]);
  const duplicateCount = errorRows.filter((r) => results[r.id]?.kind === 'duplicate').length;
  const validCount = rows.length - errorRows.length;
  const shown = rows.filter((r) => (filter === 'all' ? true : filter === 'errors' ? results[r.id] : !results[r.id]));

  /** Live result for a row that is being edited. */
  const draftResult = (row: EsicUploadRow) => {
    const draft = drafts[row.id];
    if (draft === undefined) return undefined;
    const replaced = rows.map((r) => (r.id === row.id ? { ...r, esicNumber: draft } : r));
    return validateEsicRow({ ...row, esicNumber: draft }, replaced);
  };

  const log = (action: string, subjectId?: string) => logAudit({ area: 'esic-validation', action, subjectId, actorId: actor.id, actorName: actor.name });

  const onFile = (file?: File) => {
    if (!file) return;
    setBusy(true);
    setDrafts({});
    setFilter('all');
    const finish = (next: EsicUploadRow[], message: string | null) => {
      window.setTimeout(() => {
        setRows(next);
        setFileName(file.name);
        setNote(message);
        setBusy(false);
        const errs = next.filter((r, _, all) => validateEsicRow(r, all)).length;
        log(`Uploaded ${file.name} for ESIC validation (${next.length} rows checked, ${errs} with errors)`);
        notify(`${file.name} checked: ${next.length} rows, ${errs} need attention`);
      }, 700);
    };
    if (/\.csv$/i.test(file.name)) {
      file.text().then((text) => {
        const parsed = parseEsicCsv(text);
        if (parsed.length) finish(parsed, null);
        else finish(INITIAL_ESIC_BATCH, 'We could not find "Name" and "ESIC number" columns in this CSV, so a sample result is shown. Use the column headings Name, Client, ESIC Number, Gross Wage.');
      });
    } else {
      finish(INITIAL_ESIC_BATCH, 'Excel files are checked with a sample employee list in this demo. A CSV with the headings Name, Client, ESIC Number, Gross Wage is read as uploaded.');
    }
  };

  const startFix = (row: EsicUploadRow) => setDrafts((d) => ({ ...d, [row.id]: row.esicNumber }));
  const cancelFix = (id: string) => setDrafts(({ [id]: _drop, ...rest }) => rest);

  const applyFix = (row: EsicUploadRow) => {
    const draft = drafts[row.id];
    if (draft === undefined || draftResult(row)) return;
    setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, esicNumber: draft.trim() } : r)));
    cancelFix(row.id);
    log(`Corrected ESIC number for ${row.employeeName} (row ${row.rowNo}) to ${draft.trim()}`, row.id);
    notify(`Row ${row.rowNo} fixed: ESIC number ${draft.trim()} is valid`);
  };

  const fixAllValid = () => {
    const fixable = rows.filter((r) => drafts[r.id] !== undefined && !draftResult(r));
    if (!fixable.length) {
      notify(Object.keys(drafts).length ? 'None of the edited numbers are valid yet. Check the red messages.' : 'Click Fix on a row and enter the correct number first.');
      return;
    }
    setRows((prev) => prev.map((r) => (drafts[r.id] !== undefined && fixable.some((f) => f.id === r.id) ? { ...r, esicNumber: drafts[r.id].trim() } : r)));
    setDrafts((d) => Object.fromEntries(Object.entries(d).filter(([id]) => !fixable.some((f) => f.id === id))));
    log(`Applied ${fixable.length} corrected ESIC number(s) in ${fileName}`);
    notify(`${fixable.length} row${fixable.length > 1 ? 's' : ''} fixed`);
  };

  const removeRow = (row: EsicUploadRow) => {
    setRows((prev) => prev.filter((r) => r.id !== row.id));
    cancelFix(row.id);
    log(`Removed row ${row.rowNo} (${row.employeeName}) from ${fileName}`, row.id);
    notify(`Row ${row.rowNo} removed from this upload`);
  };

  const downloadReport = () => {
    const header = ['Row', 'Employee', 'Client', 'ESIC number', 'Gross wage', 'What is wrong and what to do'];
    const lines = errorRows.map((r) => [r.rowNo, r.employeeName, r.client, r.esicNumber || '(blank)', r.grossWage, results[r.id]?.message ?? ''].map(csvCell).join(','));
    downloadCsv([header.map(csvCell).join(','), ...lines].join('\n'), 'esic-validation-error-report.csv');
    log(`Downloaded ESIC error report for ${fileName} (${errorRows.length} errors)`);
    notify('Error report downloaded');
  };

  const pending = Object.keys(drafts).length;

  const { activeId, toggle, close, isActive } = useKpiDetail<'checked' | 'valid' | 'errors' | 'duplicates'>();
  const detail: KpiDetailData | null = (() => {
    if (!activeId) return null;
    const cfg = {
      checked: { title: 'Rows checked', f: () => true },
      valid: { title: 'Valid rows', f: (r: EsicUploadRow) => !results[r.id] },
      errors: { title: 'Rows with errors', f: (r: EsicUploadRow) => !!results[r.id] },
      duplicates: { title: 'Duplicate numbers', f: (r: EsicUploadRow) => results[r.id]?.kind === 'duplicate' },
    }[activeId];
    return {
      title: cfg.title,
      columns: [
        { key: 'row', label: 'Row', className: 'whitespace-nowrap' },
        { key: 'emp', label: 'Employee' },
        { key: 'client', label: 'Client' },
        { key: 'esic', label: 'ESIC number', className: 'font-mono whitespace-nowrap' },
        { key: 'result', label: 'Result' },
      ],
      rows: rows.filter(cfg.f).map((r) => ({
        row: r.rowNo,
        emp: <span className="cc-title font-semibold">{r.employeeName}</span>,
        client: r.client,
        esic: r.esicNumber || '(blank)',
        result: results[r.id] ? <Chip tone={results[r.id]?.kind === 'duplicate' ? 'warn' : 'bad'}>{results[r.id]?.message}</Chip> : <Chip tone="good">Valid</Chip>,
      })),
    };
  })();

  return (
    <div className="cc-stack">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard label="Rows checked" value={rows.length} detail={fileName} icon={ListChecks} tone="info" onClick={() => toggle('checked')} active={isActive('checked')} />
        <KpiCard label="Valid rows" value={validCount} detail="Ready to be saved" icon={CheckCircle2} tone="good" onClick={() => toggle('valid')} active={isActive('valid')} />
        <KpiCard label="Rows with errors" value={errorRows.length} detail="Need a correction" icon={XCircle} tone={errorRows.length ? 'bad' : 'good'} onClick={() => toggle('errors')} active={isActive('errors')} />
        <KpiCard label="Duplicate numbers" value={duplicateCount} detail="Number already used by someone else" icon={ClipboardCheck} tone={duplicateCount ? 'warn' : 'good'} onClick={() => toggle('duplicates')} active={isActive('duplicates')} />
      </div>
      <KpiDetailPanel detail={detail} onClose={close} />

      <SectionCard
        title="Upload ESIC numbers"
        subtitle="Upload a CSV or Excel sheet. We check every row and tell you in plain words what to correct."
        action={
          <button type="button" className="cc-btn cc-btn-secondary" onClick={downloadReport} disabled={!errorRows.length}>
            <Download className="w-3.5 h-3.5" /> Download error report
          </button>
        }
      >
        <div className="cc-stack">
          {!canManage && <ViewOnlyNote text="View only: you can see the last validation result and download the error report, but not upload or fix rows." />}
          <label className={cn('cc-dropzone', !canManage && 'opacity-60 pointer-events-none')}>
            <UploadCloud className="w-6 h-6" style={{ color: 'var(--cc-accent)' }} />
            <span className="cc-title text-sm font-semibold">{busy ? 'Checking the file...' : 'Choose a CSV or XLSX file'}</span>
            <span className="cc-muted text-[11px]">Columns: Name, Client, ESIC Number, Gross Wage. Last checked file: {fileName}</span>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              className="sr-only"
              disabled={!canManage || busy}
              aria-label="Upload ESIC file"
              onChange={(e) => {
                onFile(e.target.files?.[0]);
                e.target.value = '';
              }}
            />
          </label>
          {note && (
            <div className="cc-callout tone-info">
              <FileSpreadsheet className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{note}</span>
            </div>
          )}
        </div>
      </SectionCard>

      <SectionCard
        title="Validation result"
        subtitle={`${rows.length} rows checked · ${validCount} valid · ${errorRows.length} with errors`}
        action={
          <button type="button" className="cc-btn cc-btn-primary" onClick={fixAllValid} disabled={!canManage || !pending}>
            <Pencil className="w-3.5 h-3.5" /> Fix all valid{pending ? ` (${pending})` : ''}
          </button>
        }
      >
        <div className="flex flex-wrap gap-2 mb-3">
          {(['all', 'errors', 'valid'] as Filter[]).map((f) => (
            <button key={f} type="button" onClick={() => setFilter(f)} className={cn('cc-tab', filter === f && 'cc-tab-active')}>
              {f === 'all' ? `All (${rows.length})` : f === 'errors' ? `Errors (${errorRows.length})` : `Valid (${validCount})`}
            </button>
          ))}
        </div>
        {errorRows.length === 0 && rows.length > 0 && (
          <div className="cc-callout tone-good mb-3">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span>All {rows.length} rows are valid. No ESIC number is repeated and every number has 10 digits.</span>
          </div>
        )}
        <div className="cc-table-wrap">
          <table className="cc-table">
            <thead>
              <tr>
                <th>Row</th>
                <th>Employee</th>
                <th>Client</th>
                <th>ESIC number</th>
                <th className="text-right">Gross wage</th>
                <th>Status</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {shown.length === 0 && (
                <tr>
                  <td colSpan={7} className="cc-muted text-center py-6">
                    No rows to show for this filter.
                  </td>
                </tr>
              )}
              {shown.map((row) => {
                const result = results[row.id];
                const editing = drafts[row.id] !== undefined;
                const live = editing ? draftResult(row) : undefined;
                return (
                  <React.Fragment key={row.id}>
                    <tr>
                      <td className="tabular-nums">{row.rowNo}</td>
                      <td className="cc-title font-semibold whitespace-nowrap">{row.employeeName}</td>
                      <td className="whitespace-nowrap">{row.client}</td>
                      <td className="tabular-nums font-mono whitespace-nowrap">
                        {editing ? (
                          <input
                            className="cc-input w-36"
                            value={drafts[row.id]}
                            inputMode="numeric"
                            aria-label={`Corrected ESIC number for ${row.employeeName}`}
                            onChange={(e) => setDrafts((d) => ({ ...d, [row.id]: e.target.value }))}
                            onKeyDown={(e) => e.key === 'Enter' && applyFix(row)}
                            autoFocus
                          />
                        ) : (
                          row.esicNumber || <span className="cc-muted">(blank)</span>
                        )}
                      </td>
                      <td className="text-right tabular-nums">Rs {row.grossWage.toLocaleString('en-IN')}</td>
                      <td>{result ? <Chip tone={result.kind === 'duplicate' ? 'bad' : 'warn'}>{result.kind === 'duplicate' ? 'Duplicate' : result.kind === 'missing' ? 'Missing' : 'Wrong format'}</Chip> : <Chip tone="good">Valid</Chip>}</td>
                      <td className="text-right whitespace-nowrap">
                        {editing ? (
                          <span className="inline-flex gap-1.5">
                            <button type="button" className="cc-btn cc-btn-primary" disabled={Boolean(live)} onClick={() => applyFix(row)}>
                              Apply
                            </button>
                            <button type="button" className="cc-btn cc-btn-secondary" onClick={() => cancelFix(row.id)}>
                              Cancel
                            </button>
                          </span>
                        ) : result ? (
                          <span className="inline-flex gap-1.5">
                            <button type="button" className="cc-btn cc-btn-secondary" disabled={!canManage} onClick={() => startFix(row)}>
                              <Pencil className="w-3.5 h-3.5" /> Fix
                            </button>
                            <button type="button" className="cc-btn cc-btn-secondary" disabled={!canManage} onClick={() => removeRow(row)} aria-label={`Remove row ${row.rowNo}`}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </span>
                        ) : (
                          <span className="cc-muted">-</span>
                        )}
                      </td>
                    </tr>
                    {(result || editing) && (
                      <tr>
                        <td colSpan={7} className="!pt-0">
                          {editing ? (
                            live ? (
                              <p className="tone-bad text-xs leading-relaxed" style={{ color: 'var(--tone)' }}>
                                Still not valid: {live.message}
                              </p>
                            ) : (
                              <p className="tone-good text-xs leading-relaxed" style={{ color: 'var(--tone)' }}>
                                This number is valid and not used by anyone else. Click Apply to save it.
                              </p>
                            )
                          ) : (
                            <p className="text-xs leading-relaxed" style={{ color: 'var(--cc-text)' }}>
                              {result?.message}
                            </p>
                          )}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </SectionCard>
    </div>
  );
};
