import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  CheckSquare,
  Download,
  Eye,
  FileArchive,
  FileDown,
  IdCard,
  Loader2,
  Lock,
  Pencil,
  Printer,
  RotateCcw,
  Search,
  Square,
  Upload,
  Users,
  X,
  CheckCircle2,
  Clock,
  ChevronDown,
  SlidersHorizontal,
} from 'lucide-react';
import type { Candidate, JoiningStatus } from '../../types/onboarding';
import { PageHeader } from '../../components/page/PageHeader';
import { PageBody } from '../../components/page/PageBody';
import { SectionCard } from '../../components/page/SectionCard';
import { KpiCard } from '../../components/page/KpiCard';
import { CategoryTabs } from '../../components/page/CategoryTabs';
import { SelectMenu } from '../../components/ui/SelectMenu';
import { PaginationControls, PaginationSummary } from '../../components/ui/Pagination';
import { StatusBadge } from '../../components/common/StatusBadge';
import { Toast } from '../../components/ui/Toast';
import { useToast } from '../../hooks/useToast';
import { useFeatureAccess, useRole } from '../../context/RoleContext';
import { cn } from '../../utils/cn';
import { Chip, EmptyNote } from '../dashboard/command-center/shared';
import { EditCandidateDialog, Field, Modal } from '../directory/CandidateActionDialogs';
import { issueCards, recordUse, REISSUE_REASONS, useIdCardRecords, type IdCardRecord } from './idCardStore';
import { a4SheetsPdf, cardsPdf, cardsZip, downloadBlob, fileStem, printCards, renderMany, SHEET_PER_PAGE, type ExportCard } from './idCardExport';
import { IdCardImportPanel } from './IdCardImportPanel';
import { drawCardBack, drawCardFront, employeeIdOf, fileToPhotoDataUrl, fullName, idCardIssues, loadPhoto, renderCard } from './idCardRender';

interface IdCardModuleProps {
  candidates: Candidate[];
  onCandidateUpdate: (candidate: Candidate) => void;
}

type Tab = 'generate' | 'history';
type CardFilter = 'all' | 'not-generated' | 'issued' | 'attention';

const PAGE_SIZE = 10;
const JOINING_STATUSES: JoiningStatus[] = ['Joined', 'Yet to Join', 'Offer Accepted', 'Verification In Progress', 'Deferred', 'Offer Dropped', 'Dropout'];

const formatStamp = (iso: string) =>
  new Date(iso).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

const PhotoThumb: React.FC<{ c: Candidate; size?: string }> = ({ c, size = 'w-9 h-9' }) => {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [c.avatarUrl]);
  return c.avatarUrl && !failed ? (
    <img src={c.avatarUrl} alt="" loading="lazy" onError={() => setFailed(true)} className={cn(size, 'rounded-full object-cover shrink-0 border border-[color:var(--cc-card-border)]')} />
  ) : (
    <span className={cn(size, 'cc-accent-chip rounded-full flex items-center justify-center text-[11px] font-bold shrink-0')} aria-hidden>
      {`${c.firstName[0] ?? ''}${c.lastName[0] ?? ''}`.toUpperCase()}
    </span>
  );
};

/* ------------------------------------------------------------------ */
/* Preview dialog (front / back, live)                                 */
/* ------------------------------------------------------------------ */

interface PreviewProps {
  candidate: Candidate;
  canManage: boolean;
  record?: IdCardRecord;
  onClose: () => void;
  onUpdate: (c: Candidate) => void;
  onGenerate: (c: Candidate) => void;
  onReissue: (c: Candidate) => void;
  onDownload: (c: Candidate) => void;
  onPrint: (c: Candidate) => void;
  notify: (message: string) => void;
}

const PreviewDialog: React.FC<PreviewProps> = ({ candidate, canManage, record, onClose, onUpdate, onGenerate, onReissue, onDownload, onPrint, notify }) => {
  const [side, setSide] = useState<'front' | 'back'>('front');
  const [editing, setEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const issues = idCardIssues(candidate);
  // A card that was already issued is shown exactly as issued; otherwise the live preview follows the candidate's data.
  const shown = record?.snapshot ?? candidate;

  useEffect(() => {
    let live = true;
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (side === 'back') drawCardBack(canvas, shown);
    else loadPhoto(shown.avatarUrl).then((photo) => live && canvasRef.current && drawCardFront(canvasRef.current, shown, photo));
    return () => {
      live = false;
    };
  }, [shown, side]);

  const onPhoto = async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      notify('Please choose an image file (JPG or PNG).');
      return;
    }
    setUploading(true);
    try {
      const url = await fileToPhotoDataUrl(file);
      onUpdate({ ...candidate, avatarUrl: url });
      notify(`Photograph updated for ${fullName(candidate)}.`);
    } catch (e) {
      notify(e instanceof Error ? e.message : 'Could not use this photograph.');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <>
      <Modal
        title="ID Card Preview"
        subtitle={`${fullName(candidate)} · ${candidate.userId}`}
        onClose={onClose}
        maxWidth="max-w-2xl"
        footer={
          <>
            <button type="button" onClick={onClose} className="cc-btn cc-btn-secondary w-full sm:w-auto">Close</button>
            {record && (
              <>
                <button type="button" onClick={() => onPrint(candidate)} disabled={!canManage} className="cc-btn cc-btn-secondary w-full sm:w-auto">
                  <Printer className="w-3.5 h-3.5" aria-hidden />
                  <span>Print</span>
                </button>
                <button type="button" onClick={() => onDownload(candidate)} disabled={!canManage} className="cc-btn cc-btn-secondary w-full sm:w-auto">
                  <Download className="w-3.5 h-3.5" aria-hidden />
                  <span>Download PDF</span>
                </button>
              </>
            )}
            {canManage &&
              (record ? (
                <button type="button" onClick={() => onReissue(candidate)} className="cc-btn cc-btn-primary w-full sm:w-auto">
                  <RotateCcw className="w-3.5 h-3.5" aria-hidden />
                  <span>Reissue Card</span>
                </button>
              ) : (
                <button type="button" onClick={() => onGenerate(candidate)} disabled={issues.length > 0} className="cc-btn cc-btn-primary w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed">
                  <IdCard className="w-3.5 h-3.5" aria-hidden />
                  <span>Generate ID Card</span>
                </button>
              ))}
          </>
        }
      >
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div role="tablist" aria-label="Card side" className="inline-flex rounded-lg border border-[color:var(--cc-card-border)] p-0.5">
              {(['front', 'back'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  role="tab"
                  aria-selected={side === s}
                  onClick={() => setSide(s)}
                  className={cn('px-3 h-7 rounded-md text-xs font-semibold capitalize cursor-pointer transition-colors', side === s ? 'bg-[color:var(--cc-accent)] text-[color:var(--cc-card-bg)]' : 'cc-muted hover:text-[color:var(--cc-title)]')}
                >
                  {s}
                </button>
              ))}
            </div>
            {record ? (
              <Chip tone="good">{record.cardNo} · v{record.version} issued</Chip>
            ) : (
              <Chip tone="muted">Not generated yet</Chip>
            )}
          </div>

          <div className="rounded-xl p-3 sm:p-4 border border-[color:var(--panel-border)]" style={{ background: 'var(--panel-bg)' }}>
            <canvas ref={canvasRef} role="img" aria-label={`${side} of the ID card`} className="w-full h-auto rounded-2xl shadow-lg" style={{ aspectRatio: '1012 / 638' }} />
          </div>

          {issues.length > 0 && (
            <div className="rounded-lg border p-3 bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-950/40 dark:border-amber-800/80 dark:text-amber-200">
              <p className="flex items-center gap-1.5 text-xs font-bold"><AlertTriangle className="w-3.5 h-3.5 text-amber-500" aria-hidden />Missing information: {issues.join(', ')}</p>
              <p className="text-[11px] mt-1">A card can only be generated once every item is complete.</p>
              {canManage && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {issues.includes('Photograph') && (
                    <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="cc-btn cc-btn-secondary !h-8">
                      {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden /> : <Upload className="w-3.5 h-3.5" aria-hidden />}
                      <span>Upload photograph</span>
                    </button>
                  )}
                  {issues.some((i) => i !== 'Photograph') && (
                    <button type="button" onClick={() => setEditing(true)} className="cc-btn cc-btn-secondary !h-8">
                      <Pencil className="w-3.5 h-3.5" aria-hidden />
                      <span>Complete details</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {canManage && issues.length === 0 && (
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="cc-btn cc-btn-secondary !h-8">
                {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden /> : <Upload className="w-3.5 h-3.5" aria-hidden />}
                <span>Change photograph</span>
              </button>
              <button type="button" onClick={() => setEditing(true)} className="cc-btn cc-btn-secondary !h-8">
                <Pencil className="w-3.5 h-3.5" aria-hidden />
                <span>Edit details</span>
              </button>
              {record && <p className="cc-muted text-[11px] self-center">Changes apply to a new card: use Reissue to issue it.</p>}
            </div>
          )}
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => onPhoto(e.target.files?.[0])} aria-label="Upload photograph" />
        </div>
      </Modal>
      {editing && (
        <EditCandidateDialog
          candidate={candidate}
          onClose={() => setEditing(false)}
          onSave={(updated) => {
            onUpdate(updated);
            notify(`Details updated for ${fullName(updated)}.`);
            setEditing(false);
          }}
        />
      )}
    </>
  );
};

/* ------------------------------------------------------------------ */
/* Generate / duplicate / reissue confirmation                         */
/* ------------------------------------------------------------------ */

interface GenerateConfirmProps {
  toIssue: Candidate[];
  duplicates: Candidate[];
  blocked: Array<{ c: Candidate; issues: string[] }>;
  busy: boolean;
  onCancel: () => void;
  onConfirm: (opts: { includeReissue: boolean; reason: string }) => void;
}

const GenerateConfirmDialog: React.FC<GenerateConfirmProps> = ({ toIssue, duplicates, blocked, busy, onCancel, onConfirm }) => {
  const [includeReissue, setIncludeReissue] = useState(false);
  const [reasonType, setReasonType] = useState<(typeof REISSUE_REASONS)[number]>('Details changed');
  const [note, setNote] = useState('');
  const [touched, setTouched] = useState(false);
  const reason = reasonType === 'Other' ? note.trim() : note.trim() ? `${reasonType} - ${note.trim()}` : reasonType;
  const reasonError = includeReissue && reasonType === 'Other' && !note.trim() ? 'Describe the reason for the reissue.' : '';
  const total = toIssue.length + (includeReissue ? duplicates.length : 0);

  return (
    <Modal
      title="Generate ID Cards"
      subtitle={`${toIssue.length + duplicates.length + blocked.length} candidate${toIssue.length + duplicates.length + blocked.length === 1 ? '' : 's'} selected`}
      onClose={busy ? () => undefined : onCancel}
      footer={
        <>
          <button type="button" onClick={onCancel} disabled={busy} className="cc-btn cc-btn-secondary w-full sm:w-auto">Cancel</button>
          <button
            type="button"
            disabled={busy || total === 0}
            onClick={() => {
              setTouched(true);
              if (reasonError) return;
              onConfirm({ includeReissue, reason });
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
        </div>

        {duplicates.length > 0 && (
          <div className="tone-warn rounded-lg border border-[color:var(--cc-card-border)] p-3 flex flex-col gap-2">
            <p className="cc-title font-semibold flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5 tone-text" aria-hidden />{duplicates.length} already {duplicates.length === 1 ? 'has' : 'have'} an active ID card</p>
            <p className="cc-muted text-[11px]">{duplicates.slice(0, 6).map(fullName).join(', ')}{duplicates.length > 6 ? ` and ${duplicates.length - 6} more` : ''}. They are skipped unless you choose to reissue.</p>
            <label className="flex items-start gap-2 cursor-pointer">
              <input type="checkbox" checked={includeReissue} onChange={(e) => setIncludeReissue(e.target.checked)} className="mt-0.5 accent-[color:var(--cc-accent)]" />
              <span className="cc-text">Reissue them (the current card is marked superseded)</span>
            </label>
            {includeReissue && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Field label="Reason for reissue" htmlFor="gen-reason">
                  <SelectMenu id="gen-reason" value={reasonType} onChange={(e) => setReasonType(e.target.value as (typeof REISSUE_REASONS)[number])} className="cc-input">
                    {REISSUE_REASONS.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </SelectMenu>
                </Field>
                <Field label={reasonType === 'Other' ? 'Details (required)' : 'Note (optional)'} htmlFor="gen-note" error={touched ? reasonError : ''}>
                  <input id="gen-note" value={note} onChange={(e) => setNote(e.target.value)} className="cc-input" />
                </Field>
              </div>
            )}
          </div>
        )}

        {blocked.length > 0 && (
          <div className="tone-bad rounded-lg border border-[color:var(--cc-card-border)] p-3">
            <p className="cc-title font-semibold flex items-center gap-1.5"><X className="w-3.5 h-3.5 tone-text" aria-hidden />{blocked.length} skipped: missing mandatory information</p>
            <ul className="cc-muted text-[11px] mt-1 space-y-0.5 max-h-32 overflow-y-auto">
              {blocked.map(({ c, issues }) => (
                <li key={c.id}><span className="cc-text font-semibold">{fullName(c)}</span>: {issues.join(', ')}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Modal>
  );
};

interface ReissueDialogProps {
  candidate: Candidate;
  busy: boolean;
  onCancel: () => void;
  onConfirm: (reason: string) => void;
}

const ReissueDialog: React.FC<ReissueDialogProps> = ({ candidate, busy, onCancel, onConfirm }) => {
  const [reasonType, setReasonType] = useState<(typeof REISSUE_REASONS)[number]>('Card lost');
  const [note, setNote] = useState('');
  const [touched, setTouched] = useState(false);
  const issues = idCardIssues(candidate);
  const error = reasonType === 'Other' && !note.trim() ? 'Describe the reason for the reissue.' : '';
  const reason = reasonType === 'Other' ? note.trim() : note.trim() ? `${reasonType} - ${note.trim()}` : reasonType;

  return (
    <Modal
      title="Reissue ID Card"
      subtitle={`${fullName(candidate)} · ${candidate.userId}`}
      onClose={onCancel}
      footer={
        <>
          <button type="button" onClick={onCancel} disabled={busy} className="cc-btn cc-btn-secondary w-full sm:w-auto">Cancel</button>
          <button
            type="button"
            disabled={busy || issues.length > 0}
            onClick={() => {
              setTouched(true);
              if (!error) onConfirm(reason);
            }}
            className="cc-btn cc-btn-primary w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden /> : <RotateCcw className="w-3.5 h-3.5" aria-hidden />}
            <span>{busy ? 'Reissuing...' : 'Confirm Reissue'}</span>
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <p className="cc-muted text-xs">The current card is marked <strong>superseded</strong> and a new card (with a new card number) is issued from the candidate's latest details. This is recorded in the audit log.</p>
        {issues.length > 0 && <p role="alert" className="text-xs font-semibold tone-bad tone-text">Cannot reissue: missing {issues.join(', ')}. Complete the details first.</p>}
        <Field label="Reason for reissue" htmlFor="re-reason">
          <SelectMenu id="re-reason" value={reasonType} onChange={(e) => setReasonType(e.target.value as (typeof REISSUE_REASONS)[number])} className="cc-input">
            {REISSUE_REASONS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </SelectMenu>
        </Field>
        <Field label={reasonType === 'Other' ? 'Details (required)' : 'Note (optional)'} htmlFor="re-note" error={touched ? error : ''}>
          <input id="re-note" value={note} onChange={(e) => setNote(e.target.value)} className="cc-input" />
        </Field>
      </div>
    </Modal>
  );
};

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export const IdCardModule: React.FC<IdCardModuleProps> = ({ candidates, onCandidateUpdate }) => {
  const access = useFeatureAccess('id-cards');
  const canManage = access === 'manage';
  const { actor } = useRole();
  const { message, showToast } = useToast(3500);
  const records = useIdCardRecords();

  const [tab, setTab] = useState<Tab>('generate');
  const [query, setQuery] = useState('');
  const [client, setClient] = useState('');
  const [location, setLocation] = useState('');
  const [department, setDepartment] = useState('');
  const [status, setStatus] = useState('');
  const [cardFilter, setCardFilter] = useState<CardFilter>('all');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [historyQuery, setHistoryQuery] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [confirm, setConfirm] = useState<{ toIssue: Candidate[]; duplicates: Candidate[]; blocked: Array<{ c: Candidate; issues: string[] }> } | null>(null);
  const [reissueFor, setReissueFor] = useState<Candidate | null>(null);

  const byId = useMemo(() => new Map(candidates.map((c) => [c.id, c])), [candidates]);
  const activeByCandidate = useMemo(() => new Map(records.filter((r) => r.status === 'Active').map((r) => [r.candidateId, r])), [records]);

  const options = useMemo(() => {
    const uniq = (f: (c: Candidate) => string) => [...new Set(candidates.map(f).filter(Boolean))].sort();
    return { clients: uniq((c) => c.clientName), locations: uniq((c) => c.workLocation), departments: uniq((c) => c.department) };
  }, [candidates]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return candidates.filter((c) => {
      if (client && c.clientName !== client) return false;
      if (location && c.workLocation !== location) return false;
      if (department && c.department !== department) return false;
      if (status && c.joiningStatus !== status) return false;
      if (q) {
        const hay = `${fullName(c)} ${c.userId} ${employeeIdOf(c)} ${c.oldEmployeeId ?? ''}`.toLowerCase();
        if (!q.split(/\s+/).every((t) => hay.includes(t))) return false;
      }
      const issued = activeByCandidate.has(c.id);
      if (cardFilter === 'not-generated' && issued) return false;
      if (cardFilter === 'issued' && !issued) return false;
      if (cardFilter === 'attention' && idCardIssues(c).length === 0) return false;
      return true;
    });
  }, [candidates, query, client, location, department, status, cardFilter, activeByCandidate]);

  const stats = useMemo(
    () => ({
      total: candidates.length,
      issued: candidates.filter((c) => activeByCandidate.has(c.id)).length,
      attention: candidates.filter((c) => idCardIssues(c).length > 0).length,
    }),
    [candidates, activeByCandidate]
  );

  // Back to page 1 when the list changes; never stay on a page that no longer exists.
  useEffect(() => setPage(1), [query, client, location, department, status, cardFilter]);
  const activeFilters = [client, location, department, status].filter(Boolean).length;
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const rows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const selectedCandidates = useMemo(() => candidates.filter((c) => selected.has(c.id)), [candidates, selected]);
  const allFilteredSelected = filtered.length > 0 && filtered.every((c) => selected.has(c.id));
  const toggleAll = () =>
    setSelected((cur) => {
      const next = new Set(cur);
      if (allFilteredSelected) filtered.forEach((c) => next.delete(c.id));
      else filtered.forEach((c) => next.add(c.id));
      return next;
    });
  const toggleOne = (id: string) =>
    setSelected((cur) => {
      const next = new Set(cur);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  /* ----- generation ----- */

  const startGenerate = (list: Candidate[]) => {
    if (!canManage) return;
    const blocked = list.map((c) => ({ c, issues: idCardIssues(c) })).filter((x) => x.issues.length > 0);
    const ok = list.filter((c) => idCardIssues(c).length === 0);
    const duplicates = ok.filter((c) => activeByCandidate.has(c.id));
    const toIssue = ok.filter((c) => !activeByCandidate.has(c.id));
    if (toIssue.length === 0 && duplicates.length === 0) {
      showToast(blocked.length ? `No cards generated: ${blocked.length} candidate${blocked.length === 1 ? ' is' : 's are'} missing mandatory information.` : 'Nothing to generate.');
      return;
    }
    setConfirm({ toIssue, duplicates, blocked });
  };

  const confirmGenerate = async ({ includeReissue, reason }: { includeReissue: boolean; reason: string }) => {
    if (!confirm) return;
    setBusy('generate');
    try {
      // Rendering proves every card can be drawn (photographs load or fall back) before it is registered as issued.
      await renderMany([...confirm.toIssue, ...(includeReissue ? confirm.duplicates : [])]);
      if (confirm.toIssue.length) issueCards(confirm.toIssue, actor);
      if (includeReissue && confirm.duplicates.length) issueCards(confirm.duplicates, actor, reason);
      const n = confirm.toIssue.length + (includeReissue ? confirm.duplicates.length : 0);
      showToast(`${n} ID card${n === 1 ? '' : 's'} generated${confirm.blocked.length ? `, ${confirm.blocked.length} skipped (missing information)` : ''}.`);
      setConfirm(null);
    } finally {
      setBusy(null);
    }
  };

  const confirmReissue = async (reason: string) => {
    if (!reissueFor) return;
    const fresh = byId.get(reissueFor.id) ?? reissueFor;
    setBusy('reissue');
    try {
      await renderCard(fresh);
      issueCards([fresh], actor, reason);
      showToast(`ID card reissued for ${fullName(fresh)}.`);
      setReissueFor(null);
    } finally {
      setBusy(null);
    }
  };

  /* ----- download / print (cards that have been issued) ----- */

  /** Card snapshots as issued for the given candidates (only those with an active card). */
  const issuedFor = (list: Candidate[]) =>
    list.flatMap((c) => {
      const r = activeByCandidate.get(c.id);
      return r ? [{ record: r, candidate: r.snapshot }] : [];
    });

  const runExport = async (key: string, list: Candidate[], build: (cards: ExportCard[]) => void | Promise<void>, kind: 'download' | 'print', label: string, preopened?: Window | null) => {
    if (!canManage) return;
    const issued = issuedFor(list);
    if (issued.length === 0) {
      preopened?.close();
      showToast('Generate the ID cards first: only issued cards can be downloaded or printed.');
      return;
    }
    const skipped = list.length - issued.length;
    setBusy(key);
    try {
      const cards = await renderMany(issued.map((i) => i.candidate));
      await build(cards);
      recordUse(issued.map((i) => i.record.id), kind, actor, `${issued.length} ID card${issued.length === 1 ? '' : 's'} (${label})`);
      showToast(`${kind === 'download' ? 'Downloaded' : 'Sent to print'}: ${issued.length} ID card${issued.length === 1 ? '' : 's'}${skipped ? `. ${skipped} not generated yet were left out` : ''}.`);
    } catch (e) {
      preopened?.close();
      showToast(e instanceof Error ? e.message : 'Something went wrong while preparing the cards.');
    } finally {
      setBusy(null);
    }
  };

  const stamp = () => new Date().toISOString().slice(0, 10);
  const downloadPdf = (list: Candidate[], key = 'pdf') =>
    runExport(key, list, (cards) => downloadBlob(cardsPdf(cards, '2COMS ID Cards'), list.length === 1 && cards[0] ? `${cards[0].name}.pdf` : `2COMS_ID_Cards_${stamp()}.pdf`), 'download', 'PDF');
  const downloadZip = (list: Candidate[]) => runExport('zip', list, (cards) => downloadBlob(cardsZip(cards), `2COMS_ID_Cards_${stamp()}.zip`), 'download', 'ZIP');
  const downloadSheets = (list: Candidate[]) => runExport('sheets', list, (cards) => downloadBlob(a4SheetsPdf(cards), `2COMS_ID_Cards_A4_${stamp()}.pdf`), 'download', 'A4 print sheets');
  const print = (list: Candidate[], mode: 'a4' | 'single', key: string) => {
    // The window must be opened inside the click, before any await, or pop-up blockers stop it.
    const win = window.open('', '_blank');
    if (!win) {
      showToast('Allow pop-ups for this site to print, or download the A4 PDF instead.');
      return;
    }
    win.document.write('<p style="font:14px sans-serif;padding:24px">Preparing ID cards...</p>');
    return runExport(key, list, (cards) => printCards(win, cards, mode, '2COMS ID Cards'), 'print', mode === 'a4' ? 'A4 print' : 'card print', win);
  };

  const previewCandidate = previewId ? byId.get(previewId) ?? null : null;

  /* ----- history ----- */

  const historyRows = useMemo(() => {
    const q = historyQuery.trim().toLowerCase();
    return records.filter((r) => !q || `${r.cardNo} ${r.candidateName} ${r.userId} ${r.generatedBy}`.toLowerCase().includes(q));
  }, [records, historyQuery]);

  const historyAction = (r: IdCardRecord, kind: 'pdf' | 'print') => {
    const snapshotList = [r.snapshot];
    const run = async (build: (cards: ExportCard[]) => void | Promise<void>, use: 'download' | 'print', win?: Window | null) => {
      setBusy(`${kind}-${r.id}`);
      try {
        const cards = await renderMany(snapshotList);
        await build(cards);
        recordUse([r.id], use, actor, `${r.cardNo} (${kind === 'pdf' ? 're-download' : 'reprint'})`);
        showToast(`${r.cardNo} ${kind === 'pdf' ? 'downloaded' : 'sent to print'}.`);
      } catch (e) {
        win?.close();
        showToast(e instanceof Error ? e.message : 'Something went wrong.');
      } finally {
        setBusy(null);
      }
    };
    if (kind === 'pdf') return run((cards) => downloadBlob(cardsPdf(cards, r.cardNo), `${r.cardNo}_${fileStem(r.snapshot)}.pdf`), 'download');
    const win = window.open('', '_blank');
    if (!win) {
      showToast('Allow pop-ups for this site to print.');
      return;
    }
    win.document.write('<p style="font:14px sans-serif;padding:24px">Preparing ID card...</p>');
    return run((cards) => printCards(win, cards, 'single', r.cardNo), 'print', win);
  };

  const selectedIssued = issuedFor(selectedCandidates).length;
  const bulkDisabled = !canManage || selectedCandidates.length === 0 || busy !== null;

  return (
    <>
      <PageHeader icon={IdCard} title="ID Card Management" subtitle="Generate, download and print employee ID cards in bulk" badge={!canManage ? <Chip tone="muted"><Lock className="w-3 h-3 mr-1" aria-hidden />View only</Chip> : undefined} />
      <PageBody>
        <div className="cc-grid grid-cols-2 lg:grid-cols-4">
          <KpiCard label="Candidates" value={stats.total} detail="Eligible for an ID card" icon={Users} tone="info" onClick={() => setCardFilter('all')} active={cardFilter === 'all'} />
          <KpiCard label="Not generated" value={stats.total - stats.issued} detail="No active card yet" icon={Clock} tone="warn" onClick={() => setCardFilter(cardFilter === 'not-generated' ? 'all' : 'not-generated')} active={cardFilter === 'not-generated'} />
          <KpiCard label="Cards issued" value={stats.issued} detail={`${records.length} in history`} icon={CheckCircle2} tone="good" onClick={() => setCardFilter(cardFilter === 'issued' ? 'all' : 'issued')} active={cardFilter === 'issued'} />
          <KpiCard label="Needs attention" value={stats.attention} detail="Missing photo or details" icon={AlertTriangle} tone="bad" onClick={() => setCardFilter(cardFilter === 'attention' ? 'all' : 'attention')} active={cardFilter === 'attention'} />
        </div>

        <CategoryTabs
          value={tab}
          onChange={(v) => setTab(v as Tab)}
          tabs={[
            { value: 'generate', label: 'Generate Cards', count: filtered.length },
            { value: 'history', label: 'ID Card History', count: records.length },
          ]}
        />

        {tab === 'generate' ? (
          <>
          <IdCardImportPanel candidates={candidates} canManage={canManage} onCandidateUpdate={onCandidateUpdate} notify={showToast} onViewHistory={() => setTab('history')} />
          <SectionCard title="Select candidates" subtitle="Search, filter and select the candidates to generate ID cards for">
            {/* ---- search + filters: full-width search; filters collapse into a panel below md ---- */}
            <div className="flex flex-col gap-2.5 mb-3 lg:grid lg:grid-cols-[minmax(0,1.25fr)_minmax(0,3fr)] lg:items-center">
              <div className="flex items-stretch gap-2 min-w-0">
                <div className="relative flex-1 min-w-0">
                  <Search className="cc-muted w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden />
                  <input
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Name, Candidate ID, Employee ID..."
                    aria-label="Search candidates"
                    className="cc-input !pl-9 !h-10 md:!h-[var(--cc-control-height)]"
                  />
                </div>
                {/* wrapper hides it from md up (.cc-btn sets its own display, so the utility cannot sit on the button) */}
                <div className="md:hidden shrink-0">
                <button
                  type="button"
                  onClick={() => setFiltersOpen((o) => !o)}
                  aria-expanded={filtersOpen}
                  aria-controls="idcard-filters"
                  className="cc-btn cc-btn-secondary !h-10 !px-3 w-full relative"
                >
                  <SlidersHorizontal className="w-4 h-4" aria-hidden />
                  <span>Filters</span>
                  {activeFilters > 0 && <span className="min-w-[1.1rem] h-[1.1rem] px-1 rounded-full bg-[color:var(--cc-accent)] text-[color:var(--cc-card-bg)] text-[10px] font-bold flex items-center justify-center tabular-nums">{activeFilters}</span>}
                </button>
                </div>
              </div>
              <div id="idcard-filters" className={cn('grid-cols-1 min-[480px]:grid-cols-2 md:grid-cols-4 gap-2.5 min-w-0', filtersOpen ? 'grid' : 'hidden md:grid')}>
                <SelectMenu value={client} onChange={(e) => setClient(e.target.value)} className="cc-input !h-10 md:!h-[var(--cc-control-height)]" aria-label="Client">
                  <option value="">All Clients</option>
                  {options.clients.map((o) => <option key={o} value={o}>{o}</option>)}
                </SelectMenu>
                <SelectMenu value={location} onChange={(e) => setLocation(e.target.value)} className="cc-input !h-10 md:!h-[var(--cc-control-height)]" aria-label="Location">
                  <option value="">All Locations</option>
                  {options.locations.map((o) => <option key={o} value={o}>{o}</option>)}
                </SelectMenu>
                <SelectMenu value={department} onChange={(e) => setDepartment(e.target.value)} className="cc-input !h-10 md:!h-[var(--cc-control-height)]" aria-label="Department">
                  <option value="">All Departments</option>
                  {options.departments.map((o) => <option key={o} value={o}>{o}</option>)}
                </SelectMenu>
                <SelectMenu value={status} onChange={(e) => setStatus(e.target.value)} className="cc-input !h-10 md:!h-[var(--cc-control-height)]" aria-label="Joining status">
                  <option value="">All Joining Statuses</option>
                  {JOINING_STATUSES.map((o) => <option key={o} value={o}>{o}</option>)}
                </SelectMenu>
                {activeFilters > 0 && (
                  <button type="button" onClick={() => { setClient(''); setLocation(''); setDepartment(''); setStatus(''); }} className="text-xs font-semibold text-[color:var(--cc-accent)] hover:underline cursor-pointer text-left min-[480px]:col-span-2 md:col-span-4 w-fit">
                    Clear {activeFilters} filter{activeFilters === 1 ? '' : 's'}
                  </button>
                )}
              </div>
            </div>

            {/* ---- selection + actions ---- */}
            <div className="rounded-xl border border-[color:var(--cc-card-border)] bg-[color:var(--cc-row-hover)] p-2.5 mb-3 flex flex-col gap-2.5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center justify-between gap-2 lg:justify-start lg:gap-4 min-w-0">
                <button type="button" onClick={toggleAll} disabled={filtered.length === 0} className="inline-flex items-center gap-2 min-h-[2.25rem] text-xs font-semibold cc-title cursor-pointer disabled:opacity-50 shrink-0" aria-pressed={allFilteredSelected}>
                  {allFilteredSelected ? <CheckSquare className="w-5 h-5 text-[color:var(--cc-accent)]" /> : <Square className="w-5 h-5 cc-muted" />}
                  <span>Select all <span className="tabular-nums">{filtered.length}</span></span>
                </button>
                <p className="cc-muted text-xs text-right lg:text-left min-w-0" aria-live="polite">
                  <strong className="cc-title text-sm tabular-nums">{selectedCandidates.length}</strong> selected
                  {selectedCandidates.length > 0 && <span className="hidden min-[400px]:inline"> · {selectedIssued} with a card</span>}
                  {selectedCandidates.length > 0 && (
                    <button type="button" onClick={() => setSelected(new Set())} className="ml-2 font-semibold text-[color:var(--cc-accent)] hover:underline cursor-pointer">Clear</button>
                  )}
                </p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 lg:flex lg:flex-wrap lg:justify-end">
                <button type="button" onClick={() => startGenerate(selectedCandidates)} disabled={bulkDisabled} className="cc-btn cc-btn-primary !h-10 lg:!h-8 col-span-2 sm:col-span-1 min-w-0 disabled:opacity-50 disabled:cursor-not-allowed" title={canManage ? 'Generate ID cards for the selected candidates' : 'Only Admin / HR can generate ID cards'}>
                  {busy === 'generate' ? <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" aria-hidden /> : <IdCard className="w-3.5 h-3.5 shrink-0" aria-hidden />}
                  <span className="truncate">Generate</span>
                </button>
                <button type="button" onClick={() => downloadPdf(selectedCandidates)} disabled={bulkDisabled} className="cc-btn cc-btn-secondary !h-10 lg:!h-8 min-w-0 disabled:opacity-50 disabled:cursor-not-allowed" title="Combined PDF, front and back of every selected card">
                  {busy === 'pdf' ? <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" aria-hidden /> : <FileDown className="w-3.5 h-3.5 shrink-0" aria-hidden />}
                  <span className="truncate">PDF</span>
                </button>
                <button type="button" onClick={() => downloadZip(selectedCandidates)} disabled={bulkDisabled} className="cc-btn cc-btn-secondary !h-10 lg:!h-8 min-w-0 disabled:opacity-50 disabled:cursor-not-allowed" title="One PDF per card, bundled in a ZIP">
                  {busy === 'zip' ? <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" aria-hidden /> : <FileArchive className="w-3.5 h-3.5 shrink-0" aria-hidden />}
                  <span className="truncate">ZIP</span>
                </button>
                <button type="button" onClick={() => downloadSheets(selectedCandidates)} disabled={bulkDisabled} className="cc-btn cc-btn-secondary !h-10 lg:!h-8 min-w-0 disabled:opacity-50 disabled:cursor-not-allowed" title={`A4 print-ready PDF, ${SHEET_PER_PAGE} cards per page`}>
                  {busy === 'sheets' ? <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" aria-hidden /> : <Download className="w-3.5 h-3.5 shrink-0" aria-hidden />}
                  <span className="truncate">A4 Sheets</span>
                </button>
                <button type="button" onClick={() => print(selectedCandidates, 'a4', 'print-all')} disabled={bulkDisabled} className="cc-btn cc-btn-secondary !h-10 lg:!h-8 min-w-0 disabled:opacity-50 disabled:cursor-not-allowed" title={`Print on A4, ${SHEET_PER_PAGE} cards per page`}>
                  {busy === 'print-all' ? <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" aria-hidden /> : <Printer className="w-3.5 h-3.5 shrink-0" aria-hidden />}
                  <span className="truncate">Print All</span>
                </button>
              </div>
            </div>
            {!canManage && <p className="cc-muted text-[11px] -mt-1 mb-3 flex items-start gap-1.5"><Lock className="w-3 h-3 shrink-0 mt-0.5" aria-hidden />Your role can view candidates and history. Generating, downloading and printing is limited to Admin and HR.</p>}

            {rows.length === 0 ? (
              <EmptyNote>No candidates match your search or filters.</EmptyNote>
            ) : (
              <>
                {/* ---- cards below 1360px (phones, tablets, small laptops): no sideways scrolling ---- */}
                <ul className="min-[1360px]:hidden grid grid-cols-1 md:grid-cols-2 gap-2.5 items-start">
                  {rows.map((c) => {
                    const record = activeByCandidate.get(c.id);
                    const issues = idCardIssues(c);
                    const isSel = selected.has(c.id);
                    const open = expanded.has(c.id);
                    return (
                      <li key={c.id} className={cn('rounded-xl border bg-[color:var(--cc-card-bg)] min-w-0 transition-colors', isSel ? 'border-[color:var(--cc-accent)] bg-[color:var(--cc-accent-soft)]' : 'border-[color:var(--cc-card-border)]')}>
                        <div className="flex items-start gap-1 p-2">
                          <button type="button" onClick={() => toggleOne(c.id)} aria-label={`${isSel ? 'Deselect' : 'Select'} ${fullName(c)}`} aria-pressed={isSel} className="w-10 h-10 shrink-0 flex items-center justify-center cursor-pointer -ml-0.5">
                            {isSel ? <CheckSquare className="w-5 h-5 text-[color:var(--cc-accent)]" /> : <Square className="w-5 h-5 cc-muted" />}
                          </button>
                          <PhotoThumb c={c} size="w-10 h-10" />
                          <div className="min-w-0 flex-1 pl-1.5">
                            <p className="cc-title text-[13px] font-bold truncate leading-tight">{fullName(c)}</p>
                            <p className="cc-muted font-mono text-[11px] truncate leading-snug">{c.userId}{employeeIdOf(c) ? ` · ${employeeIdOf(c)}` : ''}</p>
                            <p className="cc-text text-[11px] truncate leading-snug">{c.clientName} · {c.workLocation}</p>
                          </div>
                          <button type="button" onClick={() => setPreviewId(c.id)} className="w-9 h-9 shrink-0 inline-flex items-center justify-center rounded-lg bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 cursor-pointer" title="Preview ID card" aria-label={`Preview ID card for ${fullName(c)}`}>
                            <Eye className="w-4 h-4" aria-hidden />
                          </button>
                        </div>
                        <div className="flex items-center justify-between gap-2 px-2.5 pb-2">
                          <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                            <StatusBadge type="joining" status={c.joiningStatus} size="sm" />
                            {record ? <Chip tone="good">Issued · v{record.version}</Chip> : issues.length > 0 ? <Chip tone="bad">Needs attention</Chip> : <Chip tone="muted">Not generated</Chip>}
                          </div>
                          <button type="button" onClick={() => setExpanded((cur) => { const n = new Set(cur); if (n.has(c.id)) n.delete(c.id); else n.add(c.id); return n; })} aria-expanded={open} className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-[color:var(--cc-accent)] cursor-pointer shrink-0 min-h-[1.75rem]">
                            {open ? 'Less' : 'More'}
                            <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', open && 'rotate-180')} aria-hidden />
                          </button>
                        </div>
                        {open && (
                          <dl className="border-t border-[color:var(--cc-divider)] px-2.5 py-2 grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11px]">
                            <div className="min-w-0"><dt className="cc-muted">Employee ID</dt><dd className="cc-title font-mono break-all">{employeeIdOf(c) || '-'}</dd></div>
                            <div className="min-w-0"><dt className="cc-muted">Department</dt><dd className="cc-title break-words">{c.department}</dd></div>
                            {record && <div className="min-w-0"><dt className="cc-muted">ID card</dt><dd className="cc-title font-mono">{record.cardNo}</dd></div>}
                            {issues.length > 0 && <div className="col-span-2 min-w-0"><dt className="cc-muted">Missing</dt><dd className="tone-bad tone-text font-semibold">{issues.join(', ')}</dd></div>}
                          </dl>
                        )}
                      </li>
                    );
                  })}
                </ul>

                {/* ---- compact table from 1360px up ---- */}
                <div className="hidden min-[1360px]:block cc-table-wrap">
                  <table className="cc-table">
                    <thead>
                      <tr>
                        <th className="w-10"><span className="sr-only">Select</span></th>
                        <th>Candidate</th>
                        <th>Client / Location</th>
                        <th>Department</th>
                        <th>Joining Status</th>
                        <th>ID Card</th>
                        <th className="text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((c) => {
                        const record = activeByCandidate.get(c.id);
                        const issues = idCardIssues(c);
                        const isSel = selected.has(c.id);
                        return (
                          <tr key={c.id} className={isSel ? 'bg-[color:var(--cc-accent-soft)]' : ''}>
                            <td>
                              <button type="button" onClick={() => toggleOne(c.id)} aria-label={`${isSel ? 'Deselect' : 'Select'} ${fullName(c)}`} aria-pressed={isSel} className="cursor-pointer">
                                {isSel ? <CheckSquare className="w-4 h-4 text-[color:var(--cc-accent)]" /> : <Square className="w-4 h-4 cc-muted" />}
                              </button>
                            </td>
                            <td>
                              <div className="flex items-center gap-2.5 min-w-[13rem]">
                                <PhotoThumb c={c} />
                                <div className="min-w-0">
                                  <p className="cc-title font-semibold truncate">{fullName(c)}</p>
                                  <p className="cc-muted font-mono text-[11px] truncate">{c.userId}{employeeIdOf(c) ? ` · ${employeeIdOf(c)}` : ''}</p>
                                </div>
                              </div>
                            </td>
                            <td className="max-w-[13rem]">
                              <p className="truncate">{c.clientName}</p>
                              <p className="cc-muted text-[11px] truncate">{c.workLocation}</p>
                            </td>
                            <td className="max-w-[11rem] truncate">{c.department}</td>
                            <td><StatusBadge type="joining" status={c.joiningStatus} size="sm" /></td>
                            <td>
                              {record ? (
                                <div className="flex flex-col gap-0.5">
                                  <Chip tone="good">Issued · v{record.version}</Chip>
                                  <span className="cc-muted text-[10px]">{record.cardNo}</span>
                                </div>
                              ) : issues.length > 0 ? (
                                <div className="flex flex-col gap-0.5">
                                  <Chip tone="bad">Needs attention</Chip>
                                  <span className="cc-muted text-[10px] max-w-[10rem] truncate" title={`Missing: ${issues.join(', ')}`}>Missing: {issues.join(', ')}</span>
                                </div>
                              ) : (
                                <Chip tone="muted">Not generated</Chip>
                              )}
                            </td>
                            <td className="text-right">
                              <button type="button" onClick={() => setPreviewId(c.id)} className="inline-flex items-center justify-center w-7 h-7 rounded-md bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300 hover:bg-sky-100 dark:hover:bg-sky-900 border border-sky-200 dark:border-sky-800 transition-colors cursor-pointer" title="Preview ID card" aria-label={`Preview ID card for ${fullName(c)}`}>
                                <Eye className="w-3.5 h-3.5" aria-hidden />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {/* ---- compact pagination: summary left, arrows right, on one line at every width ---- */}
            <div className="flex items-center justify-between gap-2 mt-3">
              <div className="min-w-0">
                <span className="sm:hidden cc-pagination-summary"><strong>{filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, filtered.length)}</strong> of <strong>{filtered.length}</strong></span>
                <span className="hidden sm:block"><PaginationSummary page={safePage} total={filtered.length} pageSize={PAGE_SIZE} itemLabel="candidates" /></span>
              </div>
              <PaginationControls page={safePage} totalPages={totalPages} onPageChange={setPage} mobileIndicator />
            </div>
          </SectionCard>
          </>
        ) : (
          <SectionCard title="ID card history" subtitle="Every card issued, with who generated it and when">
            <div className="relative w-full sm:max-w-sm mb-3">
              <Search className="cc-muted w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden />
              <input type="search" value={historyQuery} onChange={(e) => setHistoryQuery(e.target.value)} placeholder="Card no, candidate, generated by..." aria-label="Search history" className="cc-input !pl-9" />
            </div>
            {historyRows.length === 0 ? (
              <EmptyNote>No ID cards have been generated yet.</EmptyNote>
            ) : (
              <div className="cc-table-wrap">
                <table className="cc-table">
                  <thead>
                    <tr>
                      <th>Card No</th>
                      <th>Candidate</th>
                      <th>Version</th>
                      <th>Status</th>
                      <th>Generated On</th>
                      <th>Generated By</th>
                      <th>Reason</th>
                      <th className="text-right">Downloads / Prints</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historyRows.map((r) => (
                      <tr key={r.id}>
                        <td className="font-mono font-semibold whitespace-nowrap">{r.cardNo}</td>
                        <td>
                          <p className="cc-title font-semibold whitespace-nowrap">{r.candidateName}</p>
                          <p className="cc-muted font-mono text-[11px]">{r.userId}</p>
                        </td>
                        <td className="tabular-nums">v{r.version}</td>
                        <td><Chip tone={r.status === 'Active' ? 'good' : 'muted'}>{r.status}</Chip></td>
                        <td className="whitespace-nowrap">{formatStamp(r.generatedAt)}</td>
                        <td className="whitespace-nowrap">
                          {r.generatedBy}
                          {r.source && <p className="cc-muted text-[10px]">{r.source}</p>}
                        </td>
                        <td className="max-w-[12rem]">{r.reason ?? <span className="cc-muted">First issue</span>}</td>
                        <td className="text-right tabular-nums">{r.downloads} / {r.prints}</td>
                        <td>
                          <div className="flex items-center justify-end gap-1.5">
                            <button type="button" onClick={() => historyAction(r, 'pdf')} disabled={!canManage || busy !== null} className="cc-btn cc-btn-secondary !h-7 !px-2 disabled:opacity-50" title="Re-download PDF" aria-label={`Re-download ${r.cardNo}`}>
                              {busy === `pdf-${r.id}` ? <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden /> : <Download className="w-3.5 h-3.5" aria-hidden />}
                            </button>
                            <button type="button" onClick={() => historyAction(r, 'print')} disabled={!canManage || busy !== null} className="cc-btn cc-btn-secondary !h-7 !px-2 disabled:opacity-50" title="Reprint" aria-label={`Reprint ${r.cardNo}`}>
                              {busy === `print-${r.id}` ? <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden /> : <Printer className="w-3.5 h-3.5" aria-hidden />}
                            </button>
                            {r.status === 'Active' && (
                              <button type="button" onClick={() => { const c = byId.get(r.candidateId); if (c) setReissueFor(c); }} disabled={!canManage || busy !== null} className="cc-btn cc-btn-secondary !h-7 !px-2 disabled:opacity-50" title="Reissue card" aria-label={`Reissue ${r.cardNo}`}>
                                <RotateCcw className="w-3.5 h-3.5" aria-hidden />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>
        )}
      </PageBody>

      {previewCandidate && (
        <PreviewDialog
          candidate={previewCandidate}
          canManage={canManage}
          record={activeByCandidate.get(previewCandidate.id)}
          onClose={() => setPreviewId(null)}
          onUpdate={onCandidateUpdate}
          onGenerate={(c) => startGenerate([c])}
          onReissue={(c) => setReissueFor(c)}
          onDownload={(c) => downloadPdf([c], `pdf-${c.id}`)}
          onPrint={(c) => print([c], 'single', `print-${c.id}`)}
          notify={showToast}
        />
      )}
      {confirm && <GenerateConfirmDialog {...confirm} busy={busy === 'generate'} onCancel={() => setConfirm(null)} onConfirm={confirmGenerate} />}
      {reissueFor && <ReissueDialog candidate={byId.get(reissueFor.id) ?? reissueFor} busy={busy === 'reissue'} onCancel={() => setReissueFor(null)} onConfirm={confirmReissue} />}
      <Toast message={message} variant="solid" />
    </>
  );
};

