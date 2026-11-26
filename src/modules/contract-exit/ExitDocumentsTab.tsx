import React, { useMemo, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, ClipboardList, FolderOpen, Plus, Search, Upload } from 'lucide-react';
import { KpiCard } from '../../components/page/KpiCard';
import { KpiDetailPanel, type KpiDetailData } from '../../components/page/KpiDetailPanel';
import { useKpiDetail } from '../../hooks/useKpiDetail';
import { AllowedFileSizeHint } from '../../components/common/AllowedFileSizeHint';
import { SelectMenu } from '../../components/ui/SelectMenu';
import { Toast } from '../../components/ui/Toast';
import { useToast } from '../../hooks/useToast';
import { useFeatureAccess, useRole } from '../../context/RoleContext';
import { Chip, ProgressBar, SectionCard } from '../dashboard/command-center/shared';
import { formatAuditTime } from '../hr-ops/auditStore';
import { useDocumentRules } from '../hr-ops/documentRulesStore';
import type { Candidate } from '../../types/onboarding';
import { EXIT_DOC_TYPES, EXIT_TODAY, EXIT_TYPES, formatExitDate, pendingDocIds, requiredDocIds, type ExitCase } from '../../data/mockExitData';
import { useExitStore } from './exits/exitStore';
import { uploadExitDoc } from './exits/exitDocActions';
import { AddExitDocsDialog, BulkExitDocsDialog } from './exits/ExitDocDialogs';
import { Overlay, STATUS_TONE, ViewOnlyNote, formatKb } from './exits/ExitUi';

const isOverdue = (c: ExitCase, pending: number) => pending > 0 && c.lwd !== null && c.lwd < EXIT_TODAY;

export const ExitDocumentsTab: React.FC<{ candidates: Candidate[] }> = () => {
  const { actor } = useRole();
  const canManage = useFeatureAccess('exit-documentation') === 'manage';
  const { cases, docs } = useExitStore();
  const rule = useDocumentRules().find((r) => r.id === 'experience');
  const { message, showToast, hideToast } = useToast();

  const [q, setQ] = useState('');
  const [state, setState] = useState('all');
  const [type, setType] = useState('all');
  const [client, setClient] = useState('all');
  const [dialog, setDialog] = useState<'single' | 'bulk' | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [uploadErr, setUploadErr] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const targetDoc = useRef<string>('');

  const tracked = useMemo(
    () =>
      cases
        .filter((c) => requiredDocIds(c.exitType).length > 0)
        .map((c) => {
          const req = requiredDocIds(c.exitType);
          const pending = pendingDocIds(c.exitType, docs[c.id]).length;
          return { c, req: req.length, done: req.length - pending, pending, overdue: isOverdue(c, pending) };
        }),
    [cases, docs]
  );
  const clients = useMemo(() => Array.from(new Set(tracked.map((t) => t.c.client))).sort(), [tracked]);
  const rows = tracked.filter(
    (t) =>
      (state === 'all' || (state === 'complete' ? t.pending === 0 : state === 'overdue' ? t.overdue : t.pending > 0)) &&
      (type === 'all' || t.c.exitType === type) &&
      (client === 'all' || t.c.client === client) &&
      (!q.trim() || `${t.c.employee} ${t.c.empCode}`.toLowerCase().includes(q.trim().toLowerCase()))
  );

  const pendingCases = tracked.filter((t) => t.pending > 0).length;
  const totalReq = tracked.reduce((s, t) => s + t.req, 0);
  const totalDone = tracked.reduce((s, t) => s + t.done, 0);
  const open = tracked.find((t) => t.c.id === openId);

  const kd = useKpiDetail<'tracked' | 'pending' | 'overdue' | 'received'>();
  const kdRows = kd.activeId === 'pending' ? tracked.filter((t) => t.pending > 0) : kd.activeId === 'overdue' ? tracked.filter((t) => t.overdue) : tracked;
  const detail: KpiDetailData | null = kd.activeId
    ? {
        title: { tracked: 'Cases tracked', pending: 'Pending documentation', overdue: 'Overdue', received: 'Documents received (per case)' }[kd.activeId],
        columns: [
          { key: 'emp', label: 'Employee' },
          { key: 'client', label: 'Client' },
          { key: 'type', label: 'Exit type' },
          { key: 'lwd', label: 'LWD', className: 'whitespace-nowrap' },
          { key: 'docs', label: 'Documents', className: 'whitespace-nowrap' },
          { key: 'state', label: 'State' },
        ],
        rows: kdRows.map((t) => ({
          emp: `${t.c.employee} (${t.c.empCode})`,
          client: t.c.client,
          type: t.c.exitType,
          lwd: t.c.lwd ? formatExitDate(t.c.lwd) : '—',
          docs: `${t.done} of ${t.req}`,
          state: t.overdue ? <Chip tone="bad">Overdue</Chip> : t.pending > 0 ? <Chip tone="warn">Pending</Chip> : <Chip tone="good">Complete</Chip>,
        })),
      }
    : null;

  const onFile = (f: File | undefined) => {
    if (!f || !open) return;
    const prev = docs[open.c.id]?.[targetDoc.current];
    const err = uploadExitDoc(open.c, targetDoc.current, f, rule, actor, prev?.version ?? 0);
    setUploadErr(err);
    if (!err) showToast(`${prev ? 'Replaced' : 'Uploaded'}: ${f.name}`);
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <div className="cc-stack">
      <div className="cc-grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard label="Cases tracked" value={tracked.length} detail="Exit cases needing documents" icon={FolderOpen} tone="info" onClick={() => { setState('all'); kd.toggle('tracked'); }} active={kd.isActive('tracked')} />
        <KpiCard label="Pending documentation" value={pendingCases} detail="Cases with a document outstanding" icon={ClipboardList} tone="warn" onClick={() => { setState('pending'); kd.toggle('pending'); }} active={kd.isActive('pending')} />
        <KpiCard label="Overdue" value={tracked.filter((t) => t.overdue).length} detail="LWD passed, documents missing" icon={AlertTriangle} tone="bad" onClick={() => { setState('overdue'); kd.toggle('overdue'); }} active={kd.isActive('overdue')} />
        <KpiCard label="Documents received" value={`${totalReq ? Math.round((totalDone / totalReq) * 100) : 0}%`} detail={`${totalDone} of ${totalReq} required`} icon={CheckCircle2} tone="good" onClick={() => kd.toggle('received')} active={kd.isActive('received')} />
      </div>
      <KpiDetailPanel detail={detail} onClose={kd.close} />

      <SectionCard
        title="Exit documentation tracker"
        subtitle="Standard checklist per exit case; pending items are tracked until submitted"
        action={
          canManage ? (
            <div className="flex flex-wrap gap-2 justify-end">
              <button type="button" className="cc-btn cc-btn-secondary" onClick={() => setDialog('bulk')}><Upload className="w-3.5 h-3.5" />Bulk upload</button>
              <button type="button" className="cc-btn cc-btn-primary" onClick={() => setDialog('single')}><Plus className="w-3.5 h-3.5" />Add documentation</button>
            </div>
          ) : undefined
        }
      >
        {!canManage && <div className="mb-3"><ViewOnlyNote /></div>}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 mb-3">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 cc-muted" />
            <input className="cc-input !pl-8" placeholder="Search employee or code" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search" />
          </div>
          <SelectMenu value={state} onChange={(e) => setState(e.target.value)} className="cc-input" aria-label="Documentation status">
            <option value="all">All documentation states</option>
            <option value="pending">Pending</option>
            <option value="overdue">Overdue</option>
            <option value="complete">Complete</option>
          </SelectMenu>
          <SelectMenu value={type} onChange={(e) => setType(e.target.value)} className="cc-input" aria-label="Exit type">
            <option value="all">All exit types</option>
            {EXIT_TYPES.filter((t) => t !== 'Offer Not Rolled Out').map((t) => <option key={t} value={t}>{t}</option>)}
          </SelectMenu>
          <SelectMenu value={client} onChange={(e) => setClient(e.target.value)} className="cc-input" aria-label="Client">
            <option value="all">All clients</option>
            {clients.map((t) => <option key={t} value={t}>{t}</option>)}
          </SelectMenu>
        </div>
        <div className="cc-table-wrap">
          <table className="cc-table">
            <thead><tr><th>Employee</th><th>Client</th><th>Exit type</th><th>LWD</th><th className="min-w-[160px]">Progress</th><th>Pending</th><th>Case status</th></tr></thead>
            <tbody>
              {rows.length === 0 && <tr><td colSpan={7} className="cc-muted text-center py-6">No cases match these filters.</td></tr>}
              {rows.map((t) => (
                <tr key={t.c.id} className="cursor-pointer" onClick={() => { setOpenId(t.c.id); setUploadErr(null); }}>
                  <td>
                    <button type="button" className="text-left" onClick={(e) => { e.stopPropagation(); setOpenId(t.c.id); setUploadErr(null); }}>
                      <span className="cc-title font-semibold block">{t.c.employee}</span>
                      <span className="cc-muted text-[11px]">{t.c.empCode}</span>
                    </button>
                  </td>
                  <td>{t.c.client}</td>
                  <td className="whitespace-nowrap">{t.c.exitType}</td>
                  <td className="whitespace-nowrap">{formatExitDate(t.c.lwd)}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <ProgressBar value={(t.done / t.req) * 100} tone={t.pending === 0 ? 'good' : t.overdue ? 'bad' : 'info'} className="flex-1 min-w-[80px]" label={`${t.c.employee} documents`} />
                      <span className="tabular-nums cc-muted text-[11px]">{t.done}/{t.req}</span>
                    </div>
                  </td>
                  <td className="whitespace-nowrap">
                    {t.pending === 0 ? <Chip tone="good">Complete</Chip> : <span className="inline-flex gap-1"><Chip tone="warn">{t.pending} pending</Chip>{t.overdue && <Chip tone="bad">Overdue</Chip>}</span>}
                  </td>
                  <td><Chip tone={STATUS_TONE[t.c.status]}>{t.c.status}</Chip></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {open && (
        <Overlay
          variant="drawer"
          title={`${open.c.employee}: exit documents`}
          subtitle={`${open.c.exitType} · LWD ${formatExitDate(open.c.lwd)} · ${open.done}/${open.req} received`}
          onClose={() => setOpenId(null)}
          footer={<button type="button" className="cc-btn cc-btn-secondary" onClick={() => setOpenId(null)}>Close</button>}
        >
          <ProgressBar value={(open.done / open.req) * 100} tone={open.pending === 0 ? 'good' : open.overdue ? 'bad' : 'info'} label="Documentation progress" />
          {!canManage && <ViewOnlyNote />}
          {uploadErr && <div className="cc-callout tone-bad" role="alert">{uploadErr}</div>}
          <input ref={fileRef} type="file" accept=".pdf" className="hidden" aria-label="Choose document file" onChange={(e) => onFile(e.target.files?.[0])} />
          <ul className="cc-divide">
            {EXIT_DOC_TYPES.map((d) => {
              const required = requiredDocIds(open.c.exitType).includes(d.id);
              const entry = docs[open.c.id]?.[d.id];
              return (
                <li key={d.id} className="py-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="cc-title text-xs font-semibold flex flex-wrap items-center gap-2">
                      {d.label}
                      {entry ? <Chip tone="good">Submitted</Chip> : required ? <Chip tone={open.overdue ? 'bad' : 'warn'}>{open.overdue ? 'Overdue' : 'Pending'}</Chip> : <Chip tone="muted">Not required</Chip>}
                    </p>
                    {entry ? (
                      <p className="cc-muted text-[11px] mt-1 break-words">{entry.fileName} · {formatKb(entry.sizeKb)} · v{entry.version}<br />{entry.by} · {formatAuditTime(entry.at)}</p>
                    ) : (
                      <p className="cc-muted text-[11px] mt-1">No file on record</p>
                    )}
                  </div>
                  {canManage && (
                    <button type="button" className="cc-btn cc-btn-secondary shrink-0" onClick={() => { targetDoc.current = d.id; fileRef.current?.click(); }}>
                      <Upload className="w-3.5 h-3.5" />{entry ? 'Replace' : 'Upload'}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
          <AllowedFileSizeHint rule="experience" />
        </Overlay>
      )}

      {dialog === 'single' && <AddExitDocsDialog onClose={() => setDialog(null)} onDone={showToast} />}
      {dialog === 'bulk' && <BulkExitDocsDialog onClose={() => setDialog(null)} onDone={showToast} />}
      <Toast message={message} onClose={hideToast} />
    </div>
  );
};
