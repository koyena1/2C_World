import React, { useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  CheckSquare,
  Download,
  FileArchive,
  FileDown,
  FileSpreadsheet,
  IdCard,
  Loader2,
  Lock,
  Printer,
  RefreshCw,
  Search,
  Square,
  Trash2,
  Upload,
  UserX,
  Users,
  X,
} from 'lucide-react';
import type { Candidate } from '../../types/onboarding';
import { SectionCard } from '../../components/page/SectionCard';
import { KpiCard } from '../../components/page/KpiCard';
import { CategoryTabs } from '../../components/page/CategoryTabs';
import { SelectMenu } from '../../components/ui/SelectMenu';
import { PaginationControls, PaginationSummary } from '../../components/ui/Pagination';
import { useRole } from '../../context/RoleContext';
import { cn } from '../../utils/cn';
import { readSpreadsheet } from '../../utils/spreadsheet';
import { Chip, EmptyNote } from '../dashboard/command-center/shared';
import { Field, Modal } from '../directory/CandidateActionDialogs';
import { logAudit } from '../hr-ops/auditStore';
import { a4SheetsPdf, cardsPdf, cardsZip, downloadBlob, printCards, renderMany, SHEET_PER_PAGE, type ExportCard } from './idCardExport';
import {
  buildTemplate,
  colLabel,
  MAX_IMPORT_ROWS,
  parseSheets,
  photoKeyMatches,
  validateRows,
  type ColKey,
  type ImportRow,
  type ValidatedRow,
} from './idCardImport';
import { fileToPhotoDataUrl, fullName } from './idCardRender';
import { issueCards, recordUse, REISSUE_REASONS, useIdCardRecords, type IdCardRecord } from './idCardStore';

interface Props {
  candidates: Candidate[];
  canManage: boolean;
  onCandidateUpdate: (candidate: Candidate) => void;
  notify: (message: string) => void;
  onViewHistory: () => void;
}

interface FileInfo {
  name: string;
  size: number;
  kind: 'xlsx' | 'xls';
  sheetName: string;
  rowsFound: number;
  ignored: string[];
  uploadedAt: string;
}

type View = 'all' | 'valid' | 'invalid';
const PAGE_SIZE = 10;
const MAX_BYTES = 5 * 1024 * 1024;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const formatSize = (n: number) => (n < 1024 ? `${n} B` : n < 1024 * 1024 ? `${(n / 1024).toFixed(1)} KB` : `${(n / 1024 / 1024).toFixed(2)} MB`);

const FIELD_WIDTH: Partial<Record<ColKey, string>> = {
  employeeId: 'w-28',
  candidateId: 'w-28',
  name: 'w-36',
  client: 'w-40',
  designation: 'w-36',
  department: 'w-40',
  location: 'w-36',
  joiningDate: 'w-28',
  contact: 'w-32',
  bloodGroup: 'w-16',
  emergency: 'w-44',
  photo: 'w-28',
};
const EDIT_COLS: ColKey[] = ['candidateId', 'employeeId', 'name', 'client', 'designation', 'department', 'location', 'joiningDate', 'contact', 'bloodGroup', 'emergency', 'photo'];

const statusChip = (v: ValidatedRow) =>
  v.status === 'valid' ? <Chip tone="good">Valid</Chip> : v.status === 'needs-photo' ? <Chip tone="warn">Needs photo</Chip> : <Chip tone="bad">Invalid</Chip>;

/** Keys of the candidate that differ between the record and the card as it will be printed. */
const changedKeys = (a: Candidate, b: Candidate): string[] => (Object.keys(b) as Array<keyof Candidate>).filter((k) => JSON.stringify(a[k]) !== JSON.stringify(b[k])) as string[];

/* ------------------------------------------------------------------ */
/* Confirmation dialog                                                 */
/* ------------------------------------------------------------------ */

interface ConfirmProps {
  fileName: string;
  toIssue: ValidatedRow[];
  duplicates: ValidatedRow[];
  updates: ValidatedRow[];
  busy: boolean;
  onCancel: () => void;
  onConfirm: (opts: { includeReissue: boolean; reason: string }) => void;
}

const ConfirmDialog: React.FC<ConfirmProps> = ({ fileName, toIssue, duplicates, updates, busy, onCancel, onConfirm }) => {
  const [includeReissue, setIncludeReissue] = useState(false);
  const [reasonType, setReasonType] = useState<(typeof REISSUE_REASONS)[number]>('Details changed');
  const [note, setNote] = useState('');
  const [touched, setTouched] = useState(false);
  const reason = reasonType === 'Other' ? note.trim() : note.trim() ? `${reasonType} - ${note.trim()}` : reasonType;
  const reasonError = includeReissue && reasonType === 'Other' && !note.trim() ? 'Describe the reason for the reissue.' : '';
  const total = toIssue.length + (includeReissue ? duplicates.length : 0);

  return (
    <Modal
      title="Confirm ID card generation"
      subtitle={`From ${fileName}`}
      onClose={busy ? () => undefined : onCancel}
      footer={
        <>
          <button type="button" onClick={onCancel} disabled={busy} className="cc-btn cc-btn-secondary w-full sm:w-auto">Cancel</button>
          <button
            type="button"
            disabled={busy || total === 0}
            onClick={() => {
              setTouched(true);
              if (!reasonError) onConfirm({ includeReissue, reason });
            }}
            className="cc-btn cc-btn-primary w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden /> : <IdCard className="w-3.5 h-3.5" aria-hidden />}
            <span>{busy ? 'Generating...' : `Generate ${total} card${total === 1 ? '' : 's'}`}</span>
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-3 text-xs">
        <div className="tone-good rounded-lg border border-[color:var(--cc-card-border)] p-3">
          <p className="cc-title font-semibold flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 tone-text" aria-hidden />{toIssue.length} new card{toIssue.length === 1 ? '' : 's'} will be generated</p>
          <p className="cc-muted text-[11px] mt-0.5">Nothing is generated until you confirm here.</p>
        </div>

        {updates.length > 0 && (
          <div className="tone-info rounded-lg border border-[color:var(--cc-card-border)] p-3 flex flex-col gap-1.5">
            <p className="cc-title font-semibold">{updates.length} candidate record{updates.length === 1 ? '' : 's'} will be updated</p>
            <p className="cc-muted text-[11px]">Only the values you ticked (and photographs you added for candidates without one). Everything else stays as it is.</p>
            <ul className="cc-muted text-[11px] max-h-28 overflow-y-auto space-y-0.5">
              {updates.map((u) => (
                <li key={u.row.rowNo}>
                  <span className="cc-text font-semibold">{fullName(u.candidate as Candidate)}</span>: {changedKeys(u.candidate as Candidate, u.effective as Candidate).join(', ')}
                </li>
              ))}
            </ul>
          </div>
        )}

        {duplicates.length > 0 && (
          <div className="tone-warn rounded-lg border border-[color:var(--cc-card-border)] p-3 flex flex-col gap-2">
            <p className="cc-title font-semibold flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5 tone-text" aria-hidden />{duplicates.length} already {duplicates.length === 1 ? 'has' : 'have'} an active ID card</p>
            <p className="cc-muted text-[11px]">{duplicates.slice(0, 6).map((d) => fullName(d.candidate as Candidate)).join(', ')}{duplicates.length > 6 ? ` and ${duplicates.length - 6} more` : ''}. They are skipped unless you reissue.</p>
            <label className="flex items-start gap-2 cursor-pointer">
              <input type="checkbox" checked={includeReissue} onChange={(e) => setIncludeReissue(e.target.checked)} className="mt-0.5 accent-[color:var(--cc-accent)]" />
              <span className="cc-text">Reissue them (the current card is marked superseded)</span>
            </label>
            {includeReissue && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Field label="Reason for reissue" htmlFor="imp-reason">
                  <SelectMenu id="imp-reason" value={reasonType} onChange={(e) => setReasonType(e.target.value as (typeof REISSUE_REASONS)[number])} className="cc-input">
                    {REISSUE_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
                  </SelectMenu>
                </Field>
                <Field label={reasonType === 'Other' ? 'Details (required)' : 'Note (optional)'} htmlFor="imp-note" error={touched ? reasonError : ''}>
                  <input id="imp-note" value={note} onChange={(e) => setNote(e.target.value)} className="cc-input" />
                </Field>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};

/* ------------------------------------------------------------------ */
/* Panel                                                               */
/* ------------------------------------------------------------------ */

export const IdCardImportPanel: React.FC<Props> = ({ candidates, canManage, onCandidateUpdate, notify, onViewHistory }) => {
  const { actor } = useRole();
  const records = useIdCardRecords();
  const activeByCandidate = useMemo(() => new Map(records.filter((r) => r.status === 'Active').map((r) => [r.candidateId, r])), [records]);

  const [file, setFile] = useState<FileInfo | null>(null);
  const [progress, setProgress] = useState<{ phase: 'reading' | 'parsing' | 'validating'; pct: number } | null>(null);
  const [fileError, setFileError] = useState('');
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [view, setView] = useState<View>('all');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [result, setResult] = useState<{ fileName: string; records: IdCardRecord[]; skipped: number } | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);
  const photoRef = useRef<HTMLInputElement>(null);
  const bulkPhotoRef = useRef<HTMLInputElement>(null);
  const photoTarget = useRef<number | null>(null);

  const validated = useMemo(() => validateRows(rows, candidates, activeByCandidate), [rows, candidates, activeByCandidate]);

  const counts = useMemo(
    () => ({
      total: validated.length,
      valid: validated.filter((v) => v.status === 'valid').length,
      invalid: validated.filter((v) => v.status !== 'valid').length,
      unknown: validated.filter((v) => v.match === 'unknown').length,
      duplicates: validated.filter((v) => v.errors.some((e) => e.message.startsWith('Duplicate record'))).length,
      matched: validated.filter((v) => v.match === 'matched').length,
    }),
    [validated]
  );

  const listed = useMemo(() => {
    const q = query.trim().toLowerCase();
    return validated.filter((v) => {
      if (view === 'valid' && v.status !== 'valid') return false;
      if (view === 'invalid' && v.status === 'valid') return false;
      if (!q) return true;
      const hay = `${v.row.rowNo} ${Object.values(v.row.values).join(' ')} ${v.candidate ? fullName(v.candidate) : ''} ${v.status} ${v.match}`.toLowerCase();
      return q.split(/\s+/).every((t) => hay.includes(t));
    });
  }, [validated, view, query]);

  const totalPages = Math.max(1, Math.ceil(listed.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = listed.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const selectedValid = useMemo(() => validated.filter((v) => v.status === 'valid' && selected.has(v.row.rowNo)), [validated, selected]);

  /* ----- template ----- */
  const downloadTemplate = () => {
    downloadBlob(buildTemplate(candidates), '2COMS_ID_Card_Import_Template.xlsx');
    logAudit({ area: 'id-cards', action: 'Downloaded the ID card Excel import template', actorId: actor.id, actorName: actor.name });
    notify('Template downloaded. Keep its header row and fill one row per candidate.');
  };

  /* ----- upload ----- */
  const reset = () => {
    setFile(null);
    setRows([]);
    setSelected(new Set());
    setResult(null);
    setFileError('');
    setQuery('');
    setView('all');
    setPage(1);
    if (fileRef.current) fileRef.current.value = '';
  };

  const loadFile = async (f?: File) => {
    if (!f || !canManage) return;
    setFileError('');
    setResult(null);
    if (!/\.(xlsx|xls)$/i.test(f.name)) {
      setFileError('Only .xlsx and .xls files are accepted.');
      return;
    }
    if (f.size === 0) {
      setFileError('This file is empty.');
      return;
    }
    if (f.size > MAX_BYTES) {
      setFileError(`This file is ${formatSize(f.size)}. The limit is ${formatSize(MAX_BYTES)}.`);
      return;
    }
    try {
      setProgress({ phase: 'reading', pct: 0 });
      const buf = await new Promise<ArrayBuffer>((resolve, reject) => {
        const fr = new FileReader();
        fr.onprogress = (e) => e.lengthComputable && setProgress({ phase: 'reading', pct: Math.round((e.loaded / e.total) * 100) });
        fr.onload = () => resolve(fr.result as ArrayBuffer);
        fr.onerror = () => reject(new Error('The file could not be read.'));
        fr.readAsArrayBuffer(f);
      });
      setProgress({ phase: 'reading', pct: 100 });
      await sleep(250);
      setProgress({ phase: 'parsing', pct: 100 });
      await sleep(250);
      const { kind, sheets } = await readSpreadsheet(buf);
      const parsed = parseSheets(sheets);
      if (parsed.missing.length > 0) throw new Error(`Required column${parsed.missing.length === 1 ? '' : 's'} missing: ${parsed.missing.map(colLabel).join(', ')}. Download the template and keep its header row.`);
      if (parsed.rows.length === 0) throw new Error('No data rows were found below the header row.');
      if (parsed.rows.length > MAX_IMPORT_ROWS) throw new Error(`This file has ${parsed.rows.length} rows. Import up to ${MAX_IMPORT_ROWS} rows at a time.`);
      setProgress({ phase: 'validating', pct: 100 });
      await sleep(250);

      const initial = validateRows(parsed.rows, candidates, activeByCandidate);
      setFile({ name: f.name, size: f.size, kind, sheetName: parsed.sheetName, rowsFound: parsed.rows.length, ignored: parsed.ignored, uploadedAt: new Date().toISOString() });
      setRows(parsed.rows);
      setSelected(new Set());
      setView('all');
      setPage(1);
      const valid = initial.filter((v) => v.status === 'valid').length;
      logAudit({ area: 'id-cards', action: `Uploaded ID card import "${f.name}" (${parsed.rows.length} rows, sheet "${parsed.sheetName}")`, actorId: actor.id, actorName: actor.name });
      logAudit({ area: 'id-cards', action: `Validated import "${f.name}": ${valid} valid, ${initial.length - valid} invalid, ${initial.filter((v) => v.match === 'unknown').length} unknown candidates`, actorId: actor.id, actorName: actor.name });
      notify(`${f.name}: ${parsed.rows.length} rows read, ${valid} valid. No cards are generated until you confirm.`);
    } catch (e) {
      setFile(null);
      setRows([]);
      setFileError(e instanceof Error ? e.message : 'This file could not be read.');
    } finally {
      setProgress(null);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  /* ----- editing ----- */
  const edit = (rowNo: number, key: ColKey, value: string) => setRows((cur) => cur.map((r) => (r.rowNo === rowNo ? { ...r, values: { ...r.values, [key]: value } } : r)));
  const setApply = (rowNo: number, apply: boolean) => setRows((cur) => cur.map((r) => (r.rowNo === rowNo ? { ...r, apply } : r)));
  const removeRows = (rowNos: number[]) => {
    const drop = new Set(rowNos);
    setRows((cur) => cur.filter((r) => !drop.has(r.rowNo)));
    setSelected((cur) => new Set([...cur].filter((n) => !drop.has(n))));
    notify(`${rowNos.length} row${rowNos.length === 1 ? '' : 's'} removed from this import.`);
  };
  const revalidate = () => {
    // Validation is live; this re-checks against the latest candidate records and logs the outcome.
    const now = validateRows(rows, candidates, activeByCandidate);
    const valid = now.filter((v) => v.status === 'valid').length;
    logAudit({ area: 'id-cards', action: `Revalidated import "${file?.name}": ${valid} valid, ${now.length - valid} invalid`, actorId: actor.id, actorName: actor.name });
    setSelected((cur) => new Set([...cur].filter((n) => now.some((v) => v.row.rowNo === n && v.status === 'valid'))));
    notify(`Revalidated: ${valid} valid, ${now.length - valid} need attention.`);
  };

  /* ----- selection ----- */
  const toggle = (rowNo: number) =>
    setSelected((cur) => {
      const next = new Set(cur);
      if (next.has(rowNo)) next.delete(rowNo);
      else next.add(rowNo);
      return next;
    });
  const selectValid = () => {
    setSelected(new Set(validated.filter((v) => v.status === 'valid').map((v) => v.row.rowNo)));
    notify(`${counts.valid} valid record${counts.valid === 1 ? '' : 's'} selected.`);
  };

  /* ----- photographs ----- */
  const setPhoto = async (rowNo: number, f?: File) => {
    if (!f) return;
    if (!f.type.startsWith('image/')) {
      notify('Please choose an image file (JPG or PNG).');
      return;
    }
    try {
      const data = await fileToPhotoDataUrl(f);
      setRows((cur) => cur.map((r) => (r.rowNo === rowNo ? { ...r, photoData: data, values: { ...r.values, photo: r.values.photo || f.name } } : r)));
      notify(`Photograph added for row ${rowNo}.`);
    } catch (e) {
      notify(e instanceof Error ? e.message : 'Could not use this photograph.');
    }
  };
  const mapPhotos = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    let mapped = 0;
    const unmatched: string[] = [];
    const updates = new Map<number, string>();
    for (const f of Array.from(files)) {
      if (!f.type.startsWith('image/')) {
        unmatched.push(f.name);
        continue;
      }
      const targets = rows.filter((r) => photoKeyMatches(f.name, r));
      if (targets.length === 0) {
        unmatched.push(f.name);
        continue;
      }
      const data = await fileToPhotoDataUrl(f);
      targets.forEach((t) => updates.set(t.rowNo, data));
      mapped += targets.length;
    }
    if (updates.size) setRows((cur) => cur.map((r) => (updates.has(r.rowNo) ? { ...r, photoData: updates.get(r.rowNo) } : r)));
    logAudit({ area: 'id-cards', action: `Mapped ${mapped} photograph${mapped === 1 ? '' : 's'} to import rows${file ? ` of "${file.name}"` : ''}`, actorId: actor.id, actorName: actor.name });
    notify(`${mapped} photograph${mapped === 1 ? '' : 's'} mapped${unmatched.length ? `; ${unmatched.length} file${unmatched.length === 1 ? '' : 's'} matched no row (${unmatched.slice(0, 3).join(', ')}${unmatched.length > 3 ? '...' : ''})` : ''}.`);
    if (bulkPhotoRef.current) bulkPhotoRef.current.value = '';
  };

  /* ----- generation ----- */
  const confirmData = useMemo(() => {
    const toIssue = selectedValid.filter((v) => !v.activeCard);
    const duplicates = selectedValid.filter((v) => v.activeCard);
    const updates = selectedValid.filter((v) => v.candidate && v.effective && changedKeys(v.candidate, v.effective).length > 0);
    return { toIssue, duplicates, updates };
  }, [selectedValid]);

  const generate = async ({ includeReissue, reason }: { includeReissue: boolean; reason: string }) => {
    if (!file) return;
    setBusy('generate');
    try {
      const issueRows = [...confirmData.toIssue, ...(includeReissue ? confirmData.duplicates : [])];
      // Prove every card renders before anything is registered.
      await renderMany(issueRows.map((v) => v.effective as Candidate));

      // Save explicit record updates (values the user ticked, photographs added for candidates without one).
      confirmData.updates
        .filter((u) => issueRows.includes(u))
        .forEach((u) => {
          const eff = u.effective as Candidate;
          onCandidateUpdate(eff);
          logAudit({ area: 'id-cards', action: `Updated candidate details from import "${file.name}" for ${fullName(eff)}: ${changedKeys(u.candidate as Candidate, eff).join(', ')}`, subjectId: eff.id, actorId: actor.id, actorName: actor.name });
        });

      const source = `Excel import: ${file.name}`;
      const fresh = confirmData.toIssue.length ? issueCards(confirmData.toIssue.map((v) => v.effective as Candidate), actor, undefined, source) : [];
      const reissued = includeReissue && confirmData.duplicates.length ? issueCards(confirmData.duplicates.map((v) => v.effective as Candidate), actor, reason, source) : [];
      const records = [...fresh, ...reissued];
      setResult({ fileName: file.name, records, skipped: selectedValid.length - issueRows.length });
      setSelected(new Set());
      setConfirm(false);
      notify(`${records.length} ID card${records.length === 1 ? '' : 's'} generated from ${file.name}.`);
    } catch (e) {
      notify(e instanceof Error ? e.message : 'Generation failed.');
    } finally {
      setBusy(null);
    }
  };

  /* ----- downloads for the generated batch ----- */
  const exportBatch = async (kind: 'pdf' | 'zip' | 'sheets' | 'print') => {
    if (!result) return;
    const win = kind === 'print' ? window.open('', '_blank') : null;
    if (kind === 'print') {
      if (!win) {
        notify('Allow pop-ups for this site to print, or download the A4 PDF instead.');
        return;
      }
      win.document.write('<p style="font:14px sans-serif;padding:24px">Preparing ID cards...</p>');
    }
    setBusy(`export-${kind}`);
    try {
      const cards: ExportCard[] = await renderMany(result.records.map((r) => r.snapshot));
      const stamp = new Date().toISOString().slice(0, 10);
      if (kind === 'pdf') downloadBlob(cardsPdf(cards, '2COMS ID Cards'), `2COMS_ID_Cards_${stamp}.pdf`);
      if (kind === 'zip') downloadBlob(cardsZip(cards), `2COMS_ID_Cards_${stamp}.zip`);
      if (kind === 'sheets') downloadBlob(a4SheetsPdf(cards), `2COMS_ID_Cards_A4_${stamp}.pdf`);
      if (kind === 'print' && win) printCards(win, cards, 'a4', '2COMS ID Cards');
      recordUse(result.records.map((r) => r.id), kind === 'print' ? 'print' : 'download', actor, `${result.records.length} ID cards from ${result.fileName} (${kind === 'sheets' ? 'A4 sheets' : kind.toUpperCase()})`);
      notify(kind === 'print' ? 'Sent to print.' : 'Download started.');
    } catch (e) {
      win?.close();
      notify(e instanceof Error ? e.message : 'Something went wrong while preparing the cards.');
    } finally {
      setBusy(null);
    }
  };

  const disabled = !canManage;

  return (
    <div className="flex flex-col gap-4">
      {/* Two compact actions above the candidate table; the review appears right below them once a file is loaded */}
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={downloadTemplate} className="cc-btn cc-btn-secondary !h-8" title="Download the Excel (.xlsx) template with every required column, sample rows and instructions">
            <Download className="w-3.5 h-3.5" aria-hidden />
            <span>Download Template</span>
          </button>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={!canManage || progress !== null}
            className="cc-btn cc-btn-secondary !h-8 disabled:opacity-50 disabled:cursor-not-allowed"
            title={canManage ? 'Upload an .xlsx or .xls file to validate and generate ID cards in bulk' : 'Only Admin and HR can import'}
          >
            {progress ? <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden /> : <Upload className="w-3.5 h-3.5" aria-hidden />}
            <span>Bulk Import</span>
          </button>
          {progress && (
            <div className="flex items-center gap-2 min-w-[11rem] flex-1 sm:flex-none sm:w-64" role="status" aria-live="polite">
              <div className="cc-track h-1.5 rounded-full overflow-hidden flex-1" role="progressbar" aria-valuenow={progress.pct} aria-valuemin={0} aria-valuemax={100}>
                <div className="tone-info tone-fill h-full rounded-full transition-[width] duration-200" style={{ width: `${progress.pct}%` }} />
              </div>
              <span className="cc-muted text-[11px] whitespace-nowrap">{progress.phase === 'reading' ? 'Reading' : progress.phase === 'parsing' ? 'Parsing' : 'Validating'}...</span>
            </div>
          )}
          <input ref={fileRef} type="file" accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel" className="hidden" onChange={(e) => loadFile(e.target.files?.[0])} aria-label="Excel file" />
        </div>

        {fileError && (
          <p role="alert" className="flex items-start gap-1.5 text-xs font-semibold tone-bad tone-text"><X className="w-3.5 h-3.5 shrink-0 mt-0.5" aria-hidden />{fileError}</p>
        )}

        {file && (
          <div className="rounded-xl border border-[color:var(--cc-card-border)] bg-[color:var(--cc-row-hover)] px-3 py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0">
              <span className="tone-good tone-chip w-8 h-8 rounded-lg flex items-center justify-center shrink-0"><FileSpreadsheet className="w-4 h-4" aria-hidden /></span>
              <div className="min-w-0">
                <p className="cc-title text-xs font-bold truncate">{file.name}</p>
                <p className="cc-muted text-[11px]">
                  {file.kind.toUpperCase()} · {formatSize(file.size)} · sheet "{file.sheetName}" · {file.rowsFound} rows
                  {file.ignored.length > 0 ? ` · ignored columns: ${file.ignored.slice(0, 3).join(', ')}${file.ignored.length > 3 ? '...' : ''}` : ''}
                </p>
              </div>
            </div>
            <button type="button" onClick={reset} className="cc-btn cc-btn-secondary !h-8 self-start sm:self-auto">
              <X className="w-3.5 h-3.5" aria-hidden />
              <span>Close import</span>
            </button>
          </div>
        )}
      </div>

      {/* result of a generation */}
      {result && (
        <SectionCard title="ID cards generated" subtitle={`${result.records.length} card${result.records.length === 1 ? '' : 's'} created from ${result.fileName}${result.skipped ? ` · ${result.skipped} skipped (already have a card)` : ''}`}>
          <div className="flex flex-col gap-3">
            <ul className="flex flex-wrap gap-1.5">
              {result.records.slice(0, 12).map((r) => <li key={r.id}><Chip tone="good">{r.cardNo} · {r.candidateName}</Chip></li>)}
              {result.records.length > 12 && <li><Chip tone="muted">+{result.records.length - 12} more</Chip></li>}
            </ul>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => exportBatch('pdf')} disabled={busy !== null} className="cc-btn cc-btn-primary !h-8 disabled:opacity-50">
                {busy === 'export-pdf' ? <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden /> : <FileDown className="w-3.5 h-3.5" aria-hidden />}
                <span>Combined PDF</span>
              </button>
              <button type="button" onClick={() => exportBatch('zip')} disabled={busy !== null} className="cc-btn cc-btn-secondary !h-8 disabled:opacity-50">
                {busy === 'export-zip' ? <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden /> : <FileArchive className="w-3.5 h-3.5" aria-hidden />}
                <span>ZIP</span>
              </button>
              <button type="button" onClick={() => exportBatch('sheets')} disabled={busy !== null} className="cc-btn cc-btn-secondary !h-8 disabled:opacity-50" title={`A4 print-ready, ${SHEET_PER_PAGE} cards per page`}>
                {busy === 'export-sheets' ? <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden /> : <Download className="w-3.5 h-3.5" aria-hidden />}
                <span>A4 Sheets</span>
              </button>
              <button type="button" onClick={() => exportBatch('print')} disabled={busy !== null} className="cc-btn cc-btn-secondary !h-8 disabled:opacity-50">
                {busy === 'export-print' ? <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden /> : <Printer className="w-3.5 h-3.5" aria-hidden />}
                <span>Print All</span>
              </button>
              <button type="button" onClick={onViewHistory} className="cc-btn cc-btn-secondary !h-8"><span>View ID Card History</span></button>
              <button type="button" onClick={reset} className="cc-btn cc-btn-secondary !h-8"><span>Import another file</span></button>
            </div>
          </div>
        </SectionCard>
      )}

      {/* 2. validation + preview */}
      {file && rows.length > 0 && !result && (
        <>
          <div className="cc-grid grid-cols-2 lg:grid-cols-4">
            <KpiCard label="Rows in file" value={counts.total} detail={`${counts.matched} match existing candidates`} icon={Users} tone="info" onClick={() => setView('all')} active={view === 'all'} />
            <KpiCard label="Valid" value={counts.valid} detail="Ready to generate" icon={CheckCircle2} tone="good" onClick={() => setView(view === 'valid' ? 'all' : 'valid')} active={view === 'valid'} />
            <KpiCard label="Invalid" value={counts.invalid} detail="Errors or missing photo" icon={AlertTriangle} tone="bad" onClick={() => setView(view === 'invalid' ? 'all' : 'invalid')} active={view === 'invalid'} />
            <KpiCard label="Unknown / duplicate" value={counts.unknown + counts.duplicates} detail={`${counts.unknown} unknown · ${counts.duplicates} duplicate`} icon={UserX} tone="warn" onClick={() => { setView('invalid'); setQuery(''); }} active={false} />
          </div>

          <SectionCard title="Bulk import preview" subtitle="Valid and invalid records from your file. Edit any cell to fix a problem: records are revalidated as you type. Nothing is generated until you confirm.">
            <CategoryTabs
              className="-mt-2 mb-2 -mx-1"
              value={view}
              onChange={(v) => {
                setView(v as View);
                setPage(1);
              }}
              tabs={[
                { value: 'all', label: 'All records', count: counts.total },
                { value: 'valid', label: 'Valid', count: counts.valid },
                { value: 'invalid', label: 'Invalid', count: counts.invalid },
              ]}
            />

            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 mb-3">
              <div className="relative w-full lg:max-w-sm">
                <Search className="cc-muted w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden />
                <input type="search" value={query} onChange={(e) => { setQuery(e.target.value); setPage(1); }} placeholder="Search rows, IDs, names, status..." aria-label="Search uploaded records" className="cc-input !pl-9" />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button type="button" onClick={selectValid} disabled={counts.valid === 0} className="cc-btn cc-btn-secondary !h-8 disabled:opacity-50"><CheckSquare className="w-3.5 h-3.5" aria-hidden /><span>Select Valid Records</span></button>
                <button type="button" onClick={() => removeRows([...selected])} disabled={selected.size === 0} className="cc-btn cc-btn-secondary !h-8 disabled:opacity-50"><Trash2 className="w-3.5 h-3.5" aria-hidden /><span>Remove Selected</span></button>
                <button type="button" onClick={() => bulkPhotoRef.current?.click()} className="cc-btn cc-btn-secondary !h-8"><Upload className="w-3.5 h-3.5" aria-hidden /><span>Map Photos</span></button>
                <button type="button" onClick={revalidate} className="cc-btn cc-btn-secondary !h-8"><RefreshCw className="w-3.5 h-3.5" aria-hidden /><span>Revalidate</span></button>
              </div>
            </div>
            <input ref={bulkPhotoRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => mapPhotos(e.target.files)} aria-label="Photograph files" />
            <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const t = photoTarget.current; if (t !== null) setPhoto(t, e.target.files?.[0]); e.target.value = ''; }} aria-label="Photograph" />

            {pageRows.length === 0 ? (
              <EmptyNote>{rows.length === 0 ? 'All rows were removed.' : 'No records match this view or search.'}</EmptyNote>
            ) : (
              <div className="cc-table-wrap">
                <table className="cc-table">
                  <thead>
                    <tr>
                      <th className="w-10"><span className="sr-only">Select</span></th>
                      <th>Row</th>
                      <th>Status</th>
                      {EDIT_COLS.map((k) => <th key={k}>{colLabel(k)}</th>)}
                      <th className="text-right">Remove</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageRows.map((v) => {
                      const r = v.row;
                      const errFields = new Set(v.errors.map((e) => e.field).filter(Boolean));
                      const warnFields = new Set(v.warnings.map((e) => e.field).filter(Boolean));
                      const photoSrc = r.photoData || v.effective?.avatarUrl;
                      const applicable = v.changes.filter((c) => c.applicable);
                      const hasMsgs = v.errors.length + v.warnings.length + applicable.length > 0;
                      return (
                        <React.Fragment key={r.rowNo}>
                          <tr className={selected.has(r.rowNo) ? 'bg-[color:var(--cc-accent-soft)]' : ''}>
                            <td>
                              <button type="button" disabled={v.status !== 'valid'} onClick={() => toggle(r.rowNo)} aria-pressed={selected.has(r.rowNo)} aria-label={`${selected.has(r.rowNo) ? 'Deselect' : 'Select'} row ${r.rowNo}`} className="cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed">
                                {selected.has(r.rowNo) ? <CheckSquare className="w-4 h-4 text-[color:var(--cc-accent)]" /> : <Square className="w-4 h-4 cc-muted" />}
                              </button>
                            </td>
                            <td className="tabular-nums cc-muted">{r.rowNo}</td>
                            <td className="whitespace-nowrap">
                              <div className="flex flex-col gap-0.5">
                                {statusChip(v)}
                                <span className="cc-muted text-[10px]">{v.match === 'matched' ? 'Existing candidate' : v.match === 'conflict' ? 'ID conflict' : 'Unknown candidate'}</span>
                              </div>
                            </td>
                            {EDIT_COLS.map((k) => (
                              <td key={k}>
                                {k === 'photo' ? (
                                  <div className="flex items-center gap-1.5">
                                    {photoSrc ? <img src={photoSrc} alt="" className="w-7 h-7 rounded-full object-cover border border-[color:var(--cc-card-border)] shrink-0" /> : <span className="w-7 h-7 rounded-full border border-dashed border-[color:var(--cc-card-border)] shrink-0" aria-hidden />}
                                    <input value={r.values.photo} onChange={(e) => edit(r.rowNo, 'photo', e.target.value)} aria-label={`Photo, row ${r.rowNo}`} className={cn('cc-input !h-7 !text-[11px] !px-2', FIELD_WIDTH.photo, warnFields.has('photo') && 'border-[color:var(--cc-warn)]')} />
                                    <button type="button" onClick={() => { photoTarget.current = r.rowNo; photoRef.current?.click(); }} className="cc-btn cc-btn-secondary !h-7 !px-2 shrink-0" title="Upload photograph" aria-label={`Upload photograph for row ${r.rowNo}`}><Upload className="w-3.5 h-3.5" aria-hidden /></button>
                                  </div>
                                ) : (
                                  <input
                                    value={r.values[k]}
                                    onChange={(e) => edit(r.rowNo, k, e.target.value)}
                                    aria-label={`${colLabel(k)}, row ${r.rowNo}`}
                                    aria-invalid={errFields.has(k)}
                                    className={cn('cc-input !h-7 !text-[11px] !px-2', FIELD_WIDTH[k], errFields.has(k) && 'border-[color:var(--cc-bad)]', !errFields.has(k) && warnFields.has(k) && 'border-[color:var(--cc-warn)]')}
                                  />
                                )}
                              </td>
                            ))}
                            <td className="text-right">
                              <button type="button" onClick={() => removeRows([r.rowNo])} className="cc-btn cc-btn-secondary !h-7 !px-2" title="Remove row" aria-label={`Remove row ${r.rowNo}`}><Trash2 className="w-3.5 h-3.5" aria-hidden /></button>
                            </td>
                          </tr>
                          {hasMsgs && (
                            <tr>
                              <td />
                              <td colSpan={EDIT_COLS.length + 3} className="!pt-0 !pb-3">
                                <ul className="text-[11px] space-y-0.5">
                                  {v.errors.map((e, i) => <li key={`e${i}`} className="tone-bad tone-text font-semibold">Row {r.rowNo}: {e.message}</li>)}
                                  {v.warnings.map((w, i) => <li key={`w${i}`} className="tone-warn tone-text">Row {r.rowNo}: {w.message}</li>)}
                                </ul>
                                {applicable.length > 0 && (
                                  <div className="mt-1.5 rounded-lg border border-[color:var(--cc-card-border)] p-2">
                                    <p className="cc-title text-[11px] font-semibold">The sheet differs from the candidate record:</p>
                                    <ul className="cc-muted text-[11px] mt-0.5 space-y-0.5">
                                      {applicable.map((c) => <li key={c.field}><span className="cc-text font-semibold">{c.label}</span>: {c.kind === 'fill' ? 'record is empty' : `record "${c.from}"`} → sheet "{c.to}"</li>)}
                                    </ul>
                                    <label className="flex items-center gap-2 mt-1.5 text-[11px] cursor-pointer">
                                      <input type="checkbox" checked={r.apply} onChange={(e) => setApply(r.rowNo, e.target.checked)} className="accent-[color:var(--cc-accent)]" />
                                      <span className="cc-text">Update candidate record with these sheet values <span className="cc-muted">(otherwise the record is left as it is)</span></span>
                                    </label>
                                  </div>
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
            )}

            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 mt-3">
              <PaginationSummary page={safePage} total={listed.length} pageSize={PAGE_SIZE} itemLabel="rows" />
              <PaginationControls page={safePage} totalPages={totalPages} onPageChange={setPage} mobileIndicator />
            </div>

            {/* 3. generate */}
            <div className="mt-4 rounded-xl border border-[color:var(--cc-card-border)] bg-[color:var(--cc-row-hover)] px-3 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <p className="cc-muted text-xs" aria-live="polite">
                <strong className="cc-title tabular-nums">{selectedValid.length}</strong> valid record{selectedValid.length === 1 ? '' : 's'} selected
                {counts.invalid > 0 ? ` · ${counts.invalid} invalid will not be generated` : ''}
              </p>
              <button type="button" onClick={() => setConfirm(true)} disabled={!canManage || selectedValid.length === 0 || busy !== null} className="cc-btn cc-btn-primary disabled:opacity-50 disabled:cursor-not-allowed" title={selectedValid.length === 0 ? 'Select valid records first' : 'Review and confirm generation'}>
                <IdCard className="w-3.5 h-3.5" aria-hidden />
                <span>Generate ID Cards...</span>
              </button>
            </div>
          </SectionCard>
        </>
      )}

      {confirm && file && (
        <ConfirmDialog fileName={file.name} {...confirmData} busy={busy === 'generate'} onCancel={() => setConfirm(false)} onConfirm={generate} />
      )}
    </div>
  );
};
