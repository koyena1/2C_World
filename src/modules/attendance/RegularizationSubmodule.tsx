import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock,
  Hourglass,
  Link2,
  RefreshCw,
  Timer,
  X,
  XCircle,
  Zap,
} from 'lucide-react';
import { KpiCard } from '../../components/page/KpiCard';
import { SectionCard } from '../../components/page/SectionCard';
import { SelectMenu } from '../../components/ui/SelectMenu';
import { Chip, ProgressBar } from '../dashboard/command-center/shared';
import { useFeatureAccess, useRole } from '../../context/RoleContext';
import { logAudit, useAuditLog, formatAuditTime } from '../hr-ops/auditStore';
import { cn } from '../../utils/cn';
import {
  FEASIBILITY_ITEMS,
  INITIAL_REGULARIZATION_REQUESTS,
  REGULARIZATION_CLIENTS,
  REGULARIZATION_SLA_HOURS,
  buildSyncedRequests,
  type FeasibilityStatus,
  type RegularizationRequest,
  type RegularizationStatus,
} from '../../data/mockRegularizationData';

interface RegularizationSubmoduleProps {
  onShowToast: (msg: string) => void;
  /** Active client in the Attendance context bar (shown as a scoping hint). */
  clientName: string;
}

const AREA = 'attendance-regularization';
const PAGE_SIZE = 15;

const FEASIBILITY_TONE: Record<FeasibilityStatus, 'good' | 'warn' | 'bad'> = {
  Confirmed: 'good',
  'Pending client': 'warn',
  Blocked: 'bad',
};
const STATUS_TONE: Record<RegularizationStatus, 'good' | 'warn' | 'bad'> = {
  Approved: 'good',
  Pending: 'warn',
  Rejected: 'bad',
};

const formatAge = (h: number) => (h >= 24 ? `${Math.floor(h / 24)}d ${h % 24}h` : `${h}h`);
const formatDate = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
const isBreached = (r: RegularizationRequest) => r.status === 'Pending' && r.ageHours > REGULARIZATION_SLA_HOURS;

// Rough effort model for the "manual work saved" indicator.
const MIN_PER_SINGLE = 0.75;
const MIN_PER_BULK_ACTION = 0.5;

export const RegularizationSubmodule: React.FC<RegularizationSubmoduleProps> = ({ onShowToast, clientName }) => {
  const access = useFeatureAccess('attendance-regularization');
  const { actor } = useRole();
  const canManage = access === 'manage';

  const [requests, setRequests] = useState<RegularizationRequest[]>(INITIAL_REGULARIZATION_REQUESTS);
  const [clientFilter, setClientFilter] = useState('All clients');
  const [statusFilter, setStatusFilter] = useState('All statuses');
  const [dateFilter, setDateFilter] = useState('');
  const [slaOnly, setSlaOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [rejectIds, setRejectIds] = useState<string[] | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectError, setRejectError] = useState('');
  const [detailId, setDetailId] = useState<string | null>(null);

  // Sync
  const [syncing, setSyncing] = useState(false);
  const [syncCount, setSyncCount] = useState(0);
  const [lastSynced, setLastSynced] = useState('05 Oct 2026, 09:40 AM');
  const [lastPulled, setLastPulled] = useState(14);
  const syncTimer = useRef<number | null>(null);
  useEffect(() => () => { if (syncTimer.current) window.clearTimeout(syncTimer.current); }, []);

  // Work-saved counters (seeded with this week's activity)
  const [bulkActions, setBulkActions] = useState(9);
  const [bulkRequests, setBulkRequests] = useState(132);
  const [individualRequests, setIndividualRequests] = useState(41);

  const [feasibilityOpen, setFeasibilityOpen] = useState(true);
  const history = useAuditLog({ area: AREA });

  const filtered = useMemo(
    () =>
      requests.filter((r) => {
        if (clientFilter !== 'All clients' && r.client !== clientFilter) return false;
        if (statusFilter !== 'All statuses' && r.status !== statusFilter) return false;
        if (dateFilter && r.date !== dateFilter) return false;
        if (slaOnly && !isBreached(r)) return false;
        return true;
      }),
    [requests, clientFilter, statusFilter, dateFilter, slaOnly],
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const selectableFiltered = filtered.filter((r) => r.status === 'Pending');
  const allSelected = selectableFiltered.length > 0 && selectableFiltered.every((r) => selected.has(r.id));
  const detail = requests.find((r) => r.id === detailId) ?? null;

  const kpi = useMemo(() => {
    const decided = requests.filter((r) => r.status !== 'Pending');
    return {
      today: requests.filter((r) => r.raisedToday).length,
      pending: requests.filter((r) => r.status === 'Pending').length,
      approved: requests.filter((r) => r.status === 'Approved').length,
      rejected: requests.filter((r) => r.status === 'Rejected').length,
      breached: requests.filter(isBreached).length,
      avgTurnaround: decided.length ? decided.reduce((s, r) => s + r.ageHours, 0) / decided.length : 0,
    };
  }, [requests]);

  const readiness = useMemo(() => {
    const score = FEASIBILITY_ITEMS.reduce((s, i) => s + (i.status === 'Confirmed' ? 1 : i.status === 'Pending client' ? 0.5 : 0), 0);
    return Math.round((score / FEASIBILITY_ITEMS.length) * 100);
  }, []);
  const feasibilityCounts = FEASIBILITY_ITEMS.reduce(
    (acc, i) => ({ ...acc, [i.status]: acc[i.status] + 1 }),
    { Confirmed: 0, 'Pending client': 0, Blocked: 0 } as Record<FeasibilityStatus, number>,
  );

  const savedMinutes = Math.max(0, Math.round(bulkRequests * MIN_PER_SINGLE - bulkActions * MIN_PER_BULK_ACTION));
  const bulkShare = Math.round((bulkRequests / Math.max(1, bulkRequests + individualRequests)) * 100);

  const decide = (ids: string[], status: 'Approved' | 'Rejected', reason?: string) => {
    const idSet = new Set(ids);
    setRequests((prev) =>
      prev.map((r) =>
        idSet.has(r.id) && r.status === 'Pending'
          ? { ...r, status, decidedBy: actor.name, rejectReason: status === 'Rejected' ? reason : undefined }
          : r,
      ),
    );
    const bulk = ids.length > 1;
    if (bulk) {
      setBulkActions((n) => n + 1);
      setBulkRequests((n) => n + ids.length);
    } else {
      setIndividualRequests((n) => n + ids.length);
    }
    ids.forEach((id) =>
      logAudit({
        area: AREA,
        action: `${status} regularization${bulk ? ' (bulk)' : ''}${reason ? `: ${reason}` : ''}`,
        subjectId: id,
        actorId: actor.id,
        actorName: actor.name,
      }),
    );
    setSelected(new Set());
    onShowToast(`${ids.length} request${ids.length > 1 ? 's' : ''} ${status.toLowerCase()}${bulk ? ' in one bulk action' : ''}.`);
  };

  const openReject = (ids: string[]) => {
    setRejectIds(ids);
    setRejectReason('');
    setRejectError('');
  };

  const confirmReject = () => {
    if (!rejectIds) return;
    if (rejectReason.trim().length < 5) {
      setRejectError('Enter a rejection reason (at least 5 characters). It is shared with the employee.');
      return;
    }
    decide(rejectIds, 'Rejected', rejectReason.trim());
    setRejectIds(null);
  };

  const handleSync = () => {
    if (syncing || !canManage) return;
    setSyncing(true);
    syncTimer.current = window.setTimeout(() => {
      const incoming = buildSyncedRequests(syncCount * 6);
      setRequests((prev) => [...incoming, ...prev]);
      const nextCount = syncCount + 1;
      setSyncCount(nextCount);
      const minutes = 40 + nextCount * 7;
      setLastSynced(`05 Oct 2026, 09:${String(minutes % 60).padStart(2, '0')} AM`);
      setLastPulled(incoming.length);
      setSyncing(false);
      setPage(1);
      logAudit({
        area: AREA,
        action: `Synced with E-Sampark: ${incoming.length} new requests pulled`,
        actorId: actor.id,
        actorName: actor.name,
      });
      onShowToast(`E-Sampark sync complete: ${incoming.length} new requests pulled.`);
    }, 1200);
  };

  const toggleOne = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(selectableFiltered.map((r) => r.id)));

  const resetFilters = () => {
    setClientFilter('All clients');
    setStatusFilter('All statuses');
    setDateFilter('');
    setSlaOnly(false);
    setPage(1);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="min-w-0">
          <h2 className="cc-title text-lg font-bold tracking-tight">Digital Attendance Regularization</h2>
          <p className="cc-muted text-xs mt-0.5">
            E-Sampark is a client-owned portal. Requests are pulled in, reviewed in bulk and the decision is returned to the client. Active client context: {clientName}.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {!canManage && <Chip tone="muted">View only</Chip>}
          <button type="button" className="cc-btn cc-btn-primary" onClick={handleSync} disabled={syncing || !canManage}>
            <RefreshCw className={cn('w-3.5 h-3.5', syncing && 'animate-spin')} />
            {syncing ? 'Syncing…' : 'Sync with E-Sampark'}
          </button>
        </div>
      </div>

      <p className="cc-muted text-[11px] flex flex-wrap items-center gap-x-4 gap-y-1">
        <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3" /> Last synced: {lastSynced}</span>
        <span>New requests pulled in last sync: <strong className="cc-title">{lastPulled}</strong></span>
        <span>Expected volume: about 200-250 requests per day</span>
      </p>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        <KpiCard label="Requests today" value={kpi.today} detail="Raised in last 24 hours" icon={ClipboardList} tone="info" />
        <KpiCard label="Pending" value={kpi.pending} detail="Awaiting decision" icon={Hourglass} tone="warn" />
        <KpiCard label="Approved" value={kpi.approved} detail="Sent back to E-Sampark" icon={CheckCircle2} tone="good" />
        <KpiCard label="Rejected" value={kpi.rejected} detail="With reason shared" icon={XCircle} tone="muted" />
        <KpiCard
          label="Avg turnaround"
          value={`${kpi.avgTurnaround.toFixed(1)}h`}
          detail={`Target ${REGULARIZATION_SLA_HOURS}h · ${kpi.avgTurnaround <= REGULARIZATION_SLA_HOURS ? 'within target' : 'over target'}`}
          icon={Timer}
          tone={kpi.avgTurnaround <= REGULARIZATION_SLA_HOURS ? 'good' : 'bad'}
        />
        <KpiCard
          label="SLA breached"
          value={kpi.breached}
          detail={`Pending over ${REGULARIZATION_SLA_HOURS}h`}
          icon={AlertTriangle}
          tone={kpi.breached > 0 ? 'bad' : 'good'}
          onClick={kpi.breached > 0 ? () => { setSlaOnly(true); setStatusFilter('Pending'); setPage(1); } : undefined}
        />
      </div>

      {/* Manual work saved */}
      <SectionCard title="Manual work saved" subtitle="Bulk decisions replace one-by-one handling of the daily E-Sampark queue">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4 items-center">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="cc-muted">Handled through bulk actions</span>
              <span className="cc-title font-semibold tabular-nums">{bulkShare}%</span>
            </div>
            <ProgressBar value={bulkShare} tone="good" label="Share of requests handled in bulk" />
            <p className="cc-muted text-[11px]">
              {bulkRequests} requests in {bulkActions} bulk actions, versus {individualRequests} handled individually (this week).
            </p>
          </div>
          <div className="flex items-center gap-2.5">
            <span className="tone-good tone-chip w-9 h-9 rounded-lg flex items-center justify-center"><Zap className="w-4 h-4" /></span>
            <div>
              <div className="cc-title text-xl font-bold tabular-nums leading-none">~{savedMinutes} min</div>
              <div className="cc-muted text-[11px] mt-1">estimated reviewer time saved</div>
            </div>
          </div>
        </div>
      </SectionCard>

      {/* Integration feasibility */}
      <SectionCard
        title="Integration feasibility"
        subtitle="Dependencies, client permissions and technical limits to assess before a live E-Sampark connection"
        action={
          <button type="button" className="cc-btn cc-btn-secondary" onClick={() => setFeasibilityOpen((v) => !v)} aria-expanded={feasibilityOpen}>
            {feasibilityOpen ? 'Hide checklist' : 'Show checklist'}
          </button>
        }
      >
        <div className="space-y-2 mb-3">
          <div className="flex items-center justify-between text-xs">
            <span className="cc-muted">Overall readiness</span>
            <span className="cc-title font-semibold tabular-nums">{readiness}%</span>
          </div>
          <ProgressBar value={readiness} tone={readiness >= 80 ? 'good' : readiness >= 50 ? 'warn' : 'bad'} label="Integration readiness" />
          <div className="flex flex-wrap gap-2 pt-1">
            {(Object.keys(feasibilityCounts) as FeasibilityStatus[]).map((s) => (
              <Chip key={s} tone={FEASIBILITY_TONE[s]}>{feasibilityCounts[s]} {s}</Chip>
            ))}
          </div>
        </div>
        {feasibilityOpen && (
          <div className="cc-table-wrap">
            <table className="cc-table">
              <thead>
                <tr>
                  <th>Area</th>
                  <th>Item</th>
                  <th>Status</th>
                  <th>Owner</th>
                </tr>
              </thead>
              <tbody>
                {FEASIBILITY_ITEMS.map((i) => (
                  <tr key={i.id}>
                    <td className="whitespace-nowrap font-semibold">{i.group}</td>
                    <td className="min-w-[260px]">{i.item}</td>
                    <td><Chip tone={FEASIBILITY_TONE[i.status]}>{i.status}</Chip></td>
                    <td className="whitespace-nowrap">{i.owner}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {feasibilityCounts.Blocked > 0 && (
          <div className="cc-callout tone-bad mt-3">
            <Link2 className="w-4 h-4 shrink-0 mt-0.5 tone-text" />
            <span>
              Direct API access is blocked: the portal only offers a scheduled CSV export. Until the client enables an API, the sync pulls the export and decisions are returned as an upload file.
            </span>
          </div>
        )}
      </SectionCard>

      {/* Request queue */}
      <SectionCard title="Request queue" subtitle={`${filtered.length} of ${requests.length} requests`}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_auto_auto] gap-2 mb-3 items-end">
          <div>
            <label className="cc-label">Client</label>
            <SelectMenu value={clientFilter} onChange={(e) => { setClientFilter(e.target.value); setPage(1); }} className="cc-input">
              <option value="All clients">All clients</option>
              {REGULARIZATION_CLIENTS.map((c) => <option key={c} value={c}>{c}</option>)}
            </SelectMenu>
          </div>
          <div>
            <label className="cc-label" htmlFor="reg-date">Date</label>
            <input id="reg-date" type="date" className="cc-input" value={dateFilter} onChange={(e) => { setDateFilter(e.target.value); setPage(1); }} />
          </div>
          <div>
            <label className="cc-label">Status</label>
            <SelectMenu value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="cc-input">
              <option value="All statuses">All statuses</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </SelectMenu>
          </div>
          <label className="flex items-center gap-2 text-xs cc-text h-9 cursor-pointer">
            <input type="checkbox" checked={slaOnly} onChange={(e) => { setSlaOnly(e.target.checked); setPage(1); }} />
            SLA breached only
          </label>
          <button type="button" className="cc-btn cc-btn-secondary" onClick={resetFilters}>Reset</button>
        </div>

        {/* Bulk bar */}
        <div className="flex flex-wrap items-center gap-2 mb-3 min-h-9">
          <label className="flex items-center gap-2 text-xs cc-text cursor-pointer">
            <input type="checkbox" checked={allSelected} onChange={toggleAll} disabled={!canManage || selectableFiltered.length === 0} aria-label="Select all pending requests" />
            Select all pending ({selectableFiltered.length})
          </label>
          {selected.size > 0 && (
            <>
              <Chip tone="info">{selected.size} selected</Chip>
              <button type="button" className="cc-btn cc-btn-tone tone-good" disabled={!canManage} onClick={() => decide([...selected], 'Approved')}>
                <CheckCircle2 className="w-3.5 h-3.5" /> Bulk approve
              </button>
              <button type="button" className="cc-btn cc-btn-tone tone-bad" disabled={!canManage} onClick={() => openReject([...selected])}>
                <XCircle className="w-3.5 h-3.5" /> Bulk reject
              </button>
              <button type="button" className="cc-btn cc-btn-secondary" onClick={() => setSelected(new Set())}>Clear</button>
            </>
          )}
        </div>

        <div className="cc-table-wrap">
          <table className="cc-table">
            <thead>
              <tr>
                <th className="w-8"></th>
                <th>Employee</th>
                <th>Client</th>
                <th>Date</th>
                <th>Issue</th>
                <th>In / Out</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Age</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.length === 0 && (
                <tr><td colSpan={10} className="cc-muted text-center py-8">No requests match the filters.</td></tr>
              )}
              {pageRows.map((r) => {
                const breached = isBreached(r);
                return (
                  <tr key={r.id} className={cn('cursor-pointer', breached && 'tone-bad')} style={breached ? { backgroundColor: 'color-mix(in srgb, var(--tone) 6%, transparent)' } : undefined} onClick={() => setDetailId(r.id)}>
                    <td onClick={(e) => e.stopPropagation()}>
                      {r.status === 'Pending' && (
                        <input type="checkbox" checked={selected.has(r.id)} disabled={!canManage} onChange={() => toggleOne(r.id)} aria-label={`Select ${r.employee}`} />
                      )}
                    </td>
                    <td className="whitespace-nowrap">
                      <div className="cc-title font-semibold">{r.employee}</div>
                      <div className="cc-muted text-[11px]">{r.empCode} · {r.id}</div>
                    </td>
                    <td className="whitespace-nowrap">{r.client}</td>
                    <td className="whitespace-nowrap">{formatDate(r.date)}</td>
                    <td className="whitespace-nowrap">{r.issueType}</td>
                    <td className="whitespace-nowrap tabular-nums">{r.requestedIn} - {r.requestedOut}</td>
                    <td className="max-w-[220px] truncate" title={r.reason}>{r.reason}</td>
                    <td><Chip tone={STATUS_TONE[r.status]}>{r.status}</Chip></td>
                    <td className="whitespace-nowrap">
                      {breached ? <Chip tone="bad">{formatAge(r.ageHours)} · SLA</Chip> : <span className="tabular-nums">{formatAge(r.ageHours)}</span>}
                    </td>
                    <td className="text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      {r.status === 'Pending' ? (
                        <div className="inline-flex gap-1.5">
                          <button type="button" className="cc-btn cc-btn-tone tone-good !h-8 !px-2.5" disabled={!canManage} onClick={() => decide([r.id], 'Approved')}>Approve</button>
                          <button type="button" className="cc-btn cc-btn-tone tone-bad !h-8 !px-2.5" disabled={!canManage} onClick={() => openReject([r.id])}>Reject</button>
                        </div>
                      ) : (
                        <span className="cc-muted text-[11px]">{r.decidedBy}</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between mt-3 text-xs cc-muted">
          <span>Page {safePage} of {totalPages}</span>
          <div className="flex gap-1.5">
            <button type="button" className="cc-btn cc-btn-secondary !h-8 !px-2" disabled={safePage <= 1} onClick={() => setPage(safePage - 1)} aria-label="Previous page"><ChevronLeft className="w-4 h-4" /></button>
            <button type="button" className="cc-btn cc-btn-secondary !h-8 !px-2" disabled={safePage >= totalPages} onClick={() => setPage(safePage + 1)} aria-label="Next page"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      </SectionCard>

      {/* Reject dialog */}
      {rejectIds && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="reg-reject-title">
          <div className="fixed inset-0 bg-black/50" onClick={() => setRejectIds(null)} aria-hidden="true" />
          <div className="cc-card relative w-full max-w-md p-5 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 id="reg-reject-title" className="cc-title text-sm font-bold">Reject {rejectIds.length} request{rejectIds.length > 1 ? 's' : ''}</h3>
                <p className="cc-muted text-xs mt-0.5">The reason is returned to E-Sampark and shown to the employee.</p>
              </div>
              <button type="button" className="cc-muted" onClick={() => setRejectIds(null)} aria-label="Close"><X className="w-4 h-4" /></button>
            </div>
            <div>
              <label className="cc-label" htmlFor="reg-reject-reason">Rejection reason</label>
              <textarea
                id="reg-reject-reason"
                rows={3}
                className="cc-input !h-auto py-2"
                value={rejectReason}
                onChange={(e) => { setRejectReason(e.target.value); setRejectError(''); }}
                placeholder="e.g. Punch logs do not support the requested timings"
              />
              {rejectError && <p className="text-xs mt-1 tone-bad tone-text">{rejectError}</p>}
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" className="cc-btn cc-btn-secondary" onClick={() => setRejectIds(null)}>Cancel</button>
              <button type="button" className="cc-btn cc-btn-tone tone-bad" onClick={confirmReject}>Confirm reject</button>
            </div>
          </div>
        </div>
      )}

      {/* Detail drawer */}
      {detail && (
        <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true" aria-labelledby="reg-detail-title">
          <div className="fixed inset-0 bg-black/50" onClick={() => setDetailId(null)} aria-hidden="true" />
          <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
            <div className="cc-card w-screen max-w-md !rounded-none flex flex-col overflow-y-auto p-5 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 id="reg-detail-title" className="cc-title text-base font-bold">{detail.employee}</h3>
                  <p className="cc-muted text-xs">{detail.empCode} · {detail.id} · via {detail.source}</p>
                </div>
                <button type="button" className="cc-muted" onClick={() => setDetailId(null)} aria-label="Close details"><X className="w-4 h-4" /></button>
              </div>
              <div className="flex flex-wrap gap-2">
                <Chip tone={STATUS_TONE[detail.status]}>{detail.status}</Chip>
                {isBreached(detail) && <Chip tone="bad">SLA breached · {formatAge(detail.ageHours)}</Chip>}
              </div>
              <dl className="grid grid-cols-2 gap-3 text-xs">
                {[
                  ['Client', detail.client],
                  ['Attendance date', formatDate(detail.date)],
                  ['Issue type', detail.issueType],
                  [detail.status === 'Pending' ? 'Age' : 'Turnaround', formatAge(detail.ageHours)],
                  ['Requested in', detail.requestedIn],
                  ['Requested out', detail.requestedOut],
                ].map(([k, v]) => (
                  <div key={k}>
                    <dt className="cc-muted">{k}</dt>
                    <dd className="cc-title font-semibold mt-0.5">{v}</dd>
                  </div>
                ))}
              </dl>
              <div className="text-xs">
                <div className="cc-muted">Reason given by employee</div>
                <p className="cc-text mt-0.5">{detail.reason}</p>
              </div>
              {detail.status !== 'Pending' && (
                <div className="text-xs">
                  <div className="cc-muted">Decided by</div>
                  <p className="cc-text mt-0.5">{detail.decidedBy}{detail.rejectReason ? ` · Reason: ${detail.rejectReason}` : ''}</p>
                </div>
              )}
              <div className="text-xs">
                <div className="cc-muted mb-1">History</div>
                {history.filter((h) => h.subjectId === detail.id).length === 0 ? (
                  <p className="cc-muted">No changes recorded in this session.</p>
                ) : (
                  <ul className="space-y-1">
                    {history.filter((h) => h.subjectId === detail.id).map((h) => (
                      <li key={h.id} className="cc-text">{h.action} · {h.actorName} · {formatAuditTime(h.at)}</li>
                    ))}
                  </ul>
                )}
              </div>
              {detail.status === 'Pending' && (
                <div className="flex gap-2 pt-1">
                  <button type="button" className="cc-btn cc-btn-tone tone-good" disabled={!canManage} onClick={() => decide([detail.id], 'Approved')}>Approve</button>
                  <button type="button" className="cc-btn cc-btn-tone tone-bad" disabled={!canManage} onClick={() => openReject([detail.id])}>Reject</button>
                </div>
              )}
              {!canManage && <p className="cc-muted text-[11px]">View only: your role cannot decide requests.</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
