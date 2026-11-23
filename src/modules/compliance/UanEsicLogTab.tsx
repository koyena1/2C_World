import React, { useMemo, useState } from 'react';
import { CheckCircle2, Clock, FileClock, History, Pencil, Search, ShieldOff, Users } from 'lucide-react';
import type { Candidate } from '../../types/onboarding';
import { KpiCard } from '../../components/page/KpiCard';
import { SectionCard, Chip } from '../dashboard/command-center/shared';
import { SelectMenu } from '../../components/ui/SelectMenu';
import { Toast } from '../../components/ui/Toast';
import { PaginationControls, PaginationSummary } from '../../components/ui/Pagination';
import { useToast } from '../../hooks/useToast';
import { useFeatureAccess, useRole } from '../../context/RoleContext';
import { formatAuditTime, logAudit, useAuditLog } from '../hr-ops/auditStore';
import { DASHBOARD_REFERENCE_DATE } from '../dashboard/dashboard.metrics';
import {
  MOCK_UAN_ESIC_RECORDS,
  getUanEsicHistory,
  type EsicStatus,
  type UanEsicRecord,
} from '../../data/mockUanData';
import { UanDialog, ViewOnlyNote } from './uan/UanDialog';

const AREA = 'uan-esic-log';
const PAGE_SIZE = 10;
const REF_MONTH = DASHBOARD_REFERENCE_DATE.slice(0, 7);
const UAN_RE = /^\d{12}$/;
const ESIC_RE = /^\d{17}$/;

type StatusFilter = 'all' | 'uan-pending' | 'esic-pending' | 'complete';

const blankRecord = (candidateId: string): UanEsicRecord => ({
  candidateId, uan: '', esic: '', uanStatus: 'Pending', esicStatus: 'Pending', updatedById: '', updatedBy: '', updatedAt: '',
});

const overall = (r: UanEsicRecord): StatusFilter => {
  if (r.uanStatus === 'Pending') return 'uan-pending';
  if (r.esicStatus === 'Pending') return 'esic-pending';
  return 'complete';
};

const StatusChip: React.FC<{ r: UanEsicRecord }> = ({ r }) => {
  const uanPending = r.uanStatus === 'Pending';
  const esicPending = r.esicStatus === 'Pending';
  if (uanPending && esicPending) return <Chip tone="bad">UAN &amp; ESIC pending</Chip>;
  if (uanPending) return <Chip tone="warn">UAN pending</Chip>;
  if (esicPending) return <Chip tone="warn">ESIC pending</Chip>;
  return <Chip tone="good">Up to date</Chip>;
};

const Empty: React.FC<{ label: string }> = ({ label }) => <span className="cc-muted italic">{label}</span>;

export const UanEsicLogTab: React.FC<{ candidates: Candidate[] }> = ({ candidates }) => {
  const access = useFeatureAccess('uan-esic-log');
  const canEdit = access === 'manage';
  const { actor } = useRole();
  const { message, showToast } = useToast();

  const [records, setRecords] = useState<Record<string, UanEsicRecord>>(() =>
    Object.fromEntries(MOCK_UAN_ESIC_RECORDS.map((r) => [r.candidateId, r])),
  );
  const [touchedLive, setTouchedLive] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState('');
  const [client, setClient] = useState('all');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Candidate | null>(null);
  const [historyFor, setHistoryFor] = useState<Candidate | null>(null);

  const recOf = (id: string) => records[id] ?? blankRecord(id);
  const clients = useMemo(() => Array.from(new Set(candidates.map((c) => c.clientName))).sort(), [candidates]);

  const kpis = useMemo(() => {
    const rows = candidates.map((c) => records[c.id] ?? blankRecord(c.id));
    const uanPending = rows.filter((r) => r.uanStatus === 'Pending').length;
    const esicPending = rows.filter((r) => r.esicStatus === 'Pending').length;
    const complete = rows.filter((r) => overall(r) === 'complete').length;
    const month = rows.filter((r) => r.updatedAt.startsWith(REF_MONTH) || touchedLive.has(r.candidateId)).length;
    return { total: rows.length, uanPending, esicPending, complete, month };
  }, [candidates, records, touchedLive]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return candidates.filter((c) => {
      const r = recOf(c.id);
      if (client !== 'all' && c.clientName !== client) return false;
      if (status === 'uan-pending' && r.uanStatus !== 'Pending') return false;
      if (status === 'esic-pending' && r.esicStatus !== 'Pending') return false;
      if (status === 'complete' && overall(r) !== 'complete') return false;
      if (!q) return true;
      return [`${c.firstName} ${c.lastName}`, c.userId, c.clientName, r.uan, r.esic].some((v) => v.toLowerCase().includes(q));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candidates, records, query, client, status]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, totalPages);
  const pageRows = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);
  const resetPage = () => setPage(1);

  const save = (c: Candidate, next: { uan: string; esic: string; esicNa: boolean }) => {
    const prev = recOf(c.id);
    const name = `${c.firstName} ${c.lastName}`;
    const nextEsicStatus: EsicStatus = next.esicNa ? 'Not applicable' : next.esic ? 'Updated' : 'Pending';
    const updated: UanEsicRecord = {
      ...prev,
      uan: next.uan,
      esic: next.esicNa ? '' : next.esic,
      uanStatus: next.uan ? 'Updated' : 'Pending',
      esicStatus: nextEsicStatus,
      updatedById: actor.id,
      updatedBy: actor.name,
      updatedAt: new Date().toISOString(),
    };
    let changed = 0;
    if (prev.uan !== updated.uan) {
      logAudit({ area: AREA, action: `UAN for ${name} changed from ${prev.uan || 'blank'} to ${updated.uan || 'blank'}`, subjectId: c.id, actorId: actor.id, actorName: actor.name });
      changed++;
    }
    if (prev.esic !== updated.esic || prev.esicStatus !== updated.esicStatus) {
      const from = prev.esic || prev.esicStatus;
      const to = updated.esic || updated.esicStatus;
      logAudit({ area: AREA, action: `ESIC for ${name} changed from ${from} to ${to}`, subjectId: c.id, actorId: actor.id, actorName: actor.name });
      changed++;
    }
    if (changed === 0) {
      showToast('No changes to save');
      setEditing(null);
      return;
    }
    setRecords((p) => ({ ...p, [c.id]: updated }));
    setTouchedLive((p) => new Set(p).add(c.id));
    setEditing(null);
    showToast(`UAN / ESIC updated for ${name}`);
  };

  return (
    <div className="cc-stack">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <KpiCard label="Candidates tracked" value={kpis.total} detail="With a UAN / ESIC record" icon={Users} tone="info" />
        <KpiCard label="UAN pending" value={kpis.uanPending} detail="UAN not registered yet" icon={Clock} tone="warn" onClick={() => { setStatus('uan-pending'); resetPage(); }} />
        <KpiCard label="ESIC pending" value={kpis.esicPending} detail="ESIC number awaited" icon={FileClock} tone="bad" onClick={() => { setStatus('esic-pending'); resetPage(); }} />
        <KpiCard label="Up to date" value={kpis.complete} detail={`${kpis.total ? Math.round((kpis.complete / kpis.total) * 100) : 0}% fully recorded`} icon={CheckCircle2} tone="good" onClick={() => { setStatus('complete'); resetPage(); }} />
        <KpiCard label="Updated this month" value={kpis.month} detail="Records touched in October 2026" icon={ShieldOff} tone="violet" className="col-span-2 lg:col-span-1" />
      </div>

      <SectionCard
        title="UAN & ESIC update log"
        subtitle="Every change is stamped with the user who made it and the date and time."
        action={!canEdit ? <ViewOnlyNote /> : undefined}
      >
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_200px_180px] gap-2 mb-3">
          <label className="relative block">
            <Search className="w-3.5 h-3.5 cc-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input className="cc-input" style={{ paddingLeft: 32 }} placeholder="Search candidate, ID, client, UAN or ESIC" value={query} onChange={(e) => { setQuery(e.target.value); resetPage(); }} aria-label="Search records" />
          </label>
          <SelectMenu className="cc-input" value={client} onChange={(e) => { setClient(e.target.value); resetPage(); }} aria-label="Filter by client">
            <option value="all">All clients</option>
            {clients.map((c) => <option key={c} value={c}>{c}</option>)}
          </SelectMenu>
          <SelectMenu className="cc-input" value={status} onChange={(e) => { setStatus(e.target.value as StatusFilter); resetPage(); }} aria-label="Filter by status">
            <option value="all">All statuses</option>
            <option value="uan-pending">UAN pending</option>
            <option value="esic-pending">ESIC pending</option>
            <option value="complete">Up to date</option>
          </SelectMenu>
        </div>

        <div className="cc-table-wrap">
          <table className="cc-table min-w-[1000px]">
            <thead>
              <tr>
                <th>Candidate</th><th>Client</th><th>UAN</th><th>ESIC</th><th>Status</th><th>Last updated by</th><th>Last updated at</th><th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.map((c) => {
                const r = recOf(c.id);
                return (
                  <tr key={c.id}>
                    <td className="whitespace-nowrap">
                      <div className="cc-title font-semibold">{c.firstName} {c.lastName}</div>
                      <div className="cc-muted text-[11px]">{c.userId}</div>
                    </td>
                    <td className="whitespace-nowrap">{c.clientName}</td>
                    <td className="tabular-nums whitespace-nowrap">{r.uan ? r.uan : <Empty label="Not registered" />}</td>
                    <td className="tabular-nums whitespace-nowrap">{r.esicStatus === 'Not applicable' ? <Empty label="Not applicable" /> : r.esic ? r.esic : <Empty label="Awaited" />}</td>
                    <td><StatusChip r={r} /></td>
                    <td className="whitespace-nowrap">{r.updatedBy ? <><div>{r.updatedBy}</div><div className="cc-muted text-[11px]">{r.updatedById}</div></> : <Empty label="No update yet" />}</td>
                    <td className="whitespace-nowrap">{r.updatedAt ? formatAuditTime(r.updatedAt) : <Empty label="-" />}</td>
                    <td>
                      <div className="flex justify-end gap-1.5">
                        <button type="button" className="cc-btn cc-btn-secondary" title="History" onClick={() => setHistoryFor(c)} aria-label={`History for ${c.firstName} ${c.lastName}`}>
                          <History className="w-3.5 h-3.5" />
                        </button>
                        <button type="button" className="cc-btn cc-btn-primary" disabled={!canEdit} title="Update UAN / ESIC" onClick={() => setEditing(c)} aria-label={`Update UAN / ESIC for ${c.firstName} ${c.lastName}`}>
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {pageRows.length === 0 && (
                <tr><td colSpan={8} className="cc-muted text-center py-8">No candidates match these filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between gap-3 mt-3">
          <PaginationSummary page={current} total={filtered.length} pageSize={PAGE_SIZE} itemLabel="candidates" />
          <PaginationControls page={current} totalPages={totalPages} onPageChange={setPage} mobileIndicator />
        </div>
      </SectionCard>

      {editing && <UpdateDialog candidate={editing} record={recOf(editing.id)} onClose={() => setEditing(null)} onSave={(v) => save(editing, v)} />}
      {historyFor && <HistoryDrawer candidate={historyFor} onClose={() => setHistoryFor(null)} />}
      <Toast message={message} />
    </div>
  );
};

/* ---------------------------------- dialogs ---------------------------------- */

const UpdateDialog: React.FC<{
  candidate: Candidate;
  record: UanEsicRecord;
  onClose: () => void;
  onSave: (v: { uan: string; esic: string; esicNa: boolean }) => void;
}> = ({ candidate, record, onClose, onSave }) => {
  const { actor } = useRole();
  const [uan, setUan] = useState(record.uan);
  const [esic, setEsic] = useState(record.esic);
  const [esicNa, setEsicNa] = useState(record.esicStatus === 'Not applicable');
  const [tried, setTried] = useState(false);

  const uanErr = uan && !UAN_RE.test(uan) ? 'UAN must be exactly 12 digits.' : '';
  const esicErr = !esicNa && esic && !ESIC_RE.test(esic) ? 'ESIC number must be exactly 17 digits.' : '';
  const submit = () => {
    setTried(true);
    if (uanErr || esicErr) return;
    onSave({ uan, esic, esicNa });
  };

  return (
    <UanDialog
      title="Update UAN / ESIC"
      subtitle={`${candidate.firstName} ${candidate.lastName} (${candidate.userId}) - ${candidate.clientName}`}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="cc-btn cc-btn-secondary" onClick={onClose}>Cancel</button>
          <button type="button" className="cc-btn cc-btn-primary" onClick={submit}>Save update</button>
        </>
      }
    >
      <div>
        <label className="cc-label" htmlFor="uan-input">UAN (12 digits)</label>
        <input id="uan-input" className="cc-input tabular-nums" inputMode="numeric" maxLength={12} placeholder="e.g. 101234567890" value={uan} onChange={(e) => setUan(e.target.value.replace(/\D/g, ''))} />
        {(tried || uan.length === 12) && uanErr ? <p className="text-[11px] mt-1 tone-bad tone-chip inline-block px-2 rounded">{uanErr}</p> : <p className="cc-hint">Leave blank to keep the UAN as pending.</p>}
      </div>
      <div>
        <label className="cc-label" htmlFor="esic-input">ESIC number (17 digits)</label>
        <input id="esic-input" className="cc-input tabular-nums" inputMode="numeric" maxLength={17} disabled={esicNa} placeholder="e.g. 31000123450000999" value={esic} onChange={(e) => setEsic(e.target.value.replace(/\D/g, ''))} />
        {tried && esicErr ? <p className="text-[11px] mt-1 tone-bad tone-chip inline-block px-2 rounded">{esicErr}</p> : <p className="cc-hint">Leave blank to keep the ESIC number as pending.</p>}
        <label className="flex items-center gap-2 mt-2 cursor-pointer">
          <input type="checkbox" checked={esicNa} onChange={(e) => setEsicNa(e.target.checked)} />
          <span className="cc-text">ESIC not applicable (wage above the ESIC limit)</span>
        </label>
      </div>
      <p className="cc-callout tone-info">
        This update will be recorded against <strong className="mx-1">{actor.name} ({actor.id})</strong> with today's date and time.
      </p>
    </UanDialog>
  );
};

const HistoryDrawer: React.FC<{ candidate: Candidate; onClose: () => void }> = ({ candidate, onClose }) => {
  const live = useAuditLog({ area: AREA, subjectId: candidate.id });
  const rows = useMemo(() => {
    const seed = getUanEsicHistory(candidate.id).map((h) => ({
      id: h.id,
      title: `${h.field} ${h.oldValue ? 'changed' : 'recorded'}`,
      detail: h.oldValue ? `${h.oldValue} to ${h.newValue}` : h.newValue,
      actor: h.actorName,
      at: h.at,
    }));
    const fromAudit = live.map((e) => ({ id: e.id, title: e.action, detail: '', actor: `${e.actorName} (${e.actorId})`, at: e.at }));
    return [...fromAudit, ...seed].sort((a, b) => b.at.localeCompare(a.at));
  }, [candidate.id, live]);

  return (
    <UanDialog drawer title="UAN & ESIC history" subtitle={`${candidate.firstName} ${candidate.lastName} (${candidate.userId})`} onClose={onClose}
      footer={<button type="button" className="cc-btn cc-btn-secondary" onClick={onClose}>Close</button>}>
      {rows.length === 0 ? (
        <p className="cc-muted text-center py-8">No updates recorded for this candidate yet.</p>
      ) : (
        <ol className="space-y-3">
          {rows.map((r) => (
            <li key={r.id} className="cc-row p-3 rounded-xl border" style={{ borderColor: 'var(--cc-card-border)' }}>
              <div className="cc-title font-semibold break-words">{r.title}</div>
              {r.detail && <div className="cc-text tabular-nums break-all mt-0.5">{r.detail}</div>}
              <div className="cc-muted text-[11px] mt-1">{r.actor} - {formatAuditTime(r.at)}</div>
            </li>
          ))}
        </ol>
      )}
    </UanDialog>
  );
};
