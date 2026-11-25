import React, { useEffect, useMemo, useState } from 'react';
import { Download, FileSpreadsheet, FileText, Lock, Search } from 'lucide-react';
import { SelectMenu } from '../../components/ui/SelectMenu';
import { useRole } from '../../context/RoleContext';
import { MOCK_USERS } from '../../data/mockUserSettingsData';
import { MOCK_CANDIDATES } from '../../data/mockOnboardingData';
import { downloadBlob, downloadCsv } from '../../utils/download';
import { DASHBOARD_REFERENCE_DATE } from '../dashboard/dashboard.metrics';
import { formatAuditTime, logAudit, useAuditLog } from '../hr-ops/auditStore';
import {
  EXPORT_FIELDS,
  EXPORT_FIELD_GROUPS,
  getAllowedExportFields,
  roleOfSystemRole,
  toCsv,
  useExportPolicy,
} from '../hr-ops/exportPolicyStore';

type Format = 'csv' | 'xlsx';
export const EXPORT_HISTORY_AREA = 'ob-export-run';

const xmlEscape = (v: string) => v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Excel-readable SpreadsheetML (no extra library needed). */
const toExcelXml = (rows: string[][]): string =>
  `<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?>` +
  `<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">` +
  `<Worksheet ss:Name="Candidates"><Table>` +
  rows
    .map((r) => `<Row>${r.map((v) => `<Cell><Data ss:Type="String">${xmlEscape(String(v ?? ''))}</Data></Cell>`).join('')}</Row>`)
    .join('') +
  `</Table></Worksheet></Workbook>`;

export const ExportDataPanel: React.FC<{ onShowToast: (m: string) => void }> = ({ onShowToast }) => {
  const { role, roleLabel, actor } = useRole();
  const policy = useExportPolicy();
  const history = useAuditLog({ area: EXPORT_HISTORY_AREA });

  const [asUserId, setAsUserId] = useState('');
  const asUser = MOCK_USERS.find((u) => u.id === asUserId);
  const exportRole = asUser ? roleOfSystemRole(asUser.role) : role;
  const allowed = useMemo(
    () => new Set(getAllowedExportFields(exportRole, asUser?.id)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [exportRole, asUserId, policy]
  );

  // Candidate filters
  const [search, setSearch] = useState('');
  const [client, setClient] = useState('');
  const [status, setStatus] = useState('');
  const clients = useMemo(() => [...new Set(MOCK_CANDIDATES.map((c) => c.clientName))].sort(), []);
  const statuses = useMemo(() => [...new Set(MOCK_CANDIDATES.map((c) => c.joiningStatus))].sort(), []);
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return MOCK_CANDIDATES.filter(
      (c) =>
        (!client || c.clientName === client) &&
        (!status || c.joiningStatus === status) &&
        (!q || `${c.firstName} ${c.lastName} ${c.userId} ${c.email}`.toLowerCase().includes(q))
    );
  }, [search, client, status]);

  const [picked, setPicked] = useState<Set<string>>(new Set());
  const pickedInView = filtered.filter((c) => picked.has(c.id));
  const allInViewPicked = filtered.length > 0 && pickedInView.length === filtered.length;
  const togglePick = (id: string) =>
    setPicked((p) => {
      const n = new Set(p);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  const togglePickAll = () =>
    setPicked((p) => {
      const n = new Set(p);
      filtered.forEach((c) => (allInViewPicked ? n.delete(c.id) : n.add(c.id)));
      return n;
    });

  // Field selection: only authorised fields are selectable; the selection is pruned when authority changes.
  const [fields, setFields] = useState<Set<string>>(new Set(allowed));
  useEffect(() => setFields((cur) => new Set([...cur].filter((id) => allowed.has(id)))), [allowed]);
  const toggleField = (id: string) => {
    if (!allowed.has(id)) return;
    setFields((cur) => {
      const n = new Set(cur);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };

  const [format, setFormat] = useState<Format>('csv');
  const noAccess = allowed.size === 0;
  const canExport = !noAccess && pickedInView.length > 0 && fields.size > 0;
  const blockedCount = EXPORT_FIELDS.length - allowed.size;

  const exportData = () => {
    // Re-check authorisation at export time: restricted fields can never reach the file.
    const cols = EXPORT_FIELDS.filter((f) => allowed.has(f.id) && fields.has(f.id));
    if (!cols.length || !pickedInView.length) return;
    const rows = [cols.map((f) => f.label), ...pickedInView.map((c) => cols.map((f) => f.value(c)))];
    const base = `OB_Data_Export_${DASHBOARD_REFERENCE_DATE}`;
    if (format === 'csv') downloadCsv(toCsv(rows), `${base}.csv`);
    else downloadBlob(new Blob([toExcelXml(rows)], { type: 'application/vnd.ms-excel' }), `${base}.xls`);
    const who = asUser ? `${asUser.name} (${asUser.id})` : roleLabel;
    logAudit({
      area: EXPORT_HISTORY_AREA,
      action: `${pickedInView.length} candidates · ${cols.length} fields · ${format === 'csv' ? 'CSV' : 'Excel'} · as ${who}`,
      subjectId: 'ob-data-export',
      actorId: actor.id,
      actorName: actor.name,
    });
    onShowToast(`Exported ${pickedInView.length} candidates with ${cols.length} authorised fields (${format === 'csv' ? 'CSV' : 'Excel'}).`);
  };

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="exp-as" className="cc-title text-xs font-bold block mb-1.5">Export as</label>
        <div className="w-full sm:w-80">
          <SelectMenu id="exp-as" value={asUserId} onChange={(e) => setAsUserId(e.target.value)}>
            <option value="">Me ({roleLabel})</option>
            {MOCK_USERS.map((u) => (
              <option key={u.id} value={u.id}>{u.name} · {u.id} · {u.role}</option>
            ))}
          </SelectMenu>
        </div>
        <p className="cc-muted text-[11px] mt-1">Authorised fields come from {asUser ? 'this user’s permissions' : 'your role’s permissions'} (set in step 1 and 2).</p>
      </div>

      {noAccess && (
        <p className="tone-bad tone-chip rounded-lg px-3 py-2 text-xs font-semibold">Export is disabled for this user: no fields are authorised.</p>
      )}

      {/* 1. Candidates */}
      <div>
        <p className="cc-title text-xs font-bold mb-1.5">A. Select candidates</p>
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, ID or email"
              aria-label="Search candidates"
              className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
            />
          </div>
          <div className="w-full sm:w-48">
            <SelectMenu value={client} onChange={(e) => setClient(e.target.value)} aria-label="Filter by client">
              <option value="">All clients</option>
              {clients.map((c) => <option key={c} value={c}>{c}</option>)}
            </SelectMenu>
          </div>
          <div className="w-full sm:w-48">
            <SelectMenu value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by joining status">
              <option value="">All joining statuses</option>
              {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
            </SelectMenu>
          </div>
          <span className="cc-muted text-[11px] ml-auto">{pickedInView.length} selected · {filtered.length} shown</span>
        </div>
        <div className="cc-table-wrap max-h-64 overflow-y-auto">
          <table className="cc-table">
            <thead>
              <tr>
                <th className="w-8"><input type="checkbox" className="w-4 h-4 accent-sky-600" checked={allInViewPicked} onChange={togglePickAll} aria-label="Select all shown candidates" /></th>
                <th>Candidate</th><th>Client</th><th>Joining status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && <tr><td colSpan={4} className="cc-muted text-center py-4">No candidates match these filters.</td></tr>}
              {filtered.map((c) => (
                <tr key={c.id}>
                  <td><input type="checkbox" className="w-4 h-4 accent-sky-600" checked={picked.has(c.id)} onChange={() => togglePick(c.id)} aria-label={`Select ${c.firstName} ${c.lastName}`} /></td>
                  <td className="cc-title font-semibold">{c.firstName} {c.lastName}<span className="cc-muted block text-[11px] font-normal">{c.userId}</span></td>
                  <td>{c.clientName}</td>
                  <td>{c.joiningStatus}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. Fields */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
          <p className="cc-title text-xs font-bold">B. Choose fields ({fields.size} of {allowed.size} authorised)</p>
          <span className="flex gap-3 text-[11px] font-semibold text-sky-600 dark:text-sky-400">
            <button type="button" disabled={noAccess} onClick={() => setFields(new Set(allowed))} className="disabled:opacity-50">Select all authorised</button>
            <button type="button" onClick={() => setFields(new Set())}>Clear</button>
          </span>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {EXPORT_FIELD_GROUPS.map((g) => (
            <div key={g} className="rounded-lg border border-slate-200 dark:border-slate-800 p-3">
              <span className="cc-title text-xs font-bold block mb-2">{g}</span>
              <ul className="space-y-1.5">
                {EXPORT_FIELDS.filter((f) => f.group === g).map((f) => {
                  const ok = allowed.has(f.id);
                  return (
                    <li key={f.id}>
                      <label className={`flex items-center gap-2 text-xs min-h-6 ${ok ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`} title={ok ? undefined : 'Restricted: not authorised for this user'}>
                        <input type="checkbox" className="w-4 h-4 accent-sky-600" disabled={!ok} checked={ok && fields.has(f.id)} onChange={() => toggleField(f.id)} />
                        <span className={`cc-text ${ok ? '' : 'line-through'}`}>{f.label}</span>
                        {!ok && <Lock className="w-3 h-3 text-rose-500" aria-label="Restricted" />}
                      </label>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
        {blockedCount > 0 && <p className="cc-muted text-[11px] mt-2">{blockedCount} restricted field{blockedCount === 1 ? '' : 's'} are locked and will never be included in the file.</p>}
      </div>

      {/* 3. Format + export */}
      <div className="flex flex-wrap items-center gap-3">
        <p className="cc-title text-xs font-bold">C. Format</p>
        <div className="flex gap-2">
          <button type="button" className={`cc-tab ${format === 'csv' ? 'cc-tab-active' : ''}`} aria-pressed={format === 'csv'} onClick={() => setFormat('csv')}>
            <FileText className="w-3.5 h-3.5 inline mr-1" />CSV
          </button>
          <button type="button" className={`cc-tab ${format === 'xlsx' ? 'cc-tab-active' : ''}`} aria-pressed={format === 'xlsx'} onClick={() => setFormat('xlsx')}>
            <FileSpreadsheet className="w-3.5 h-3.5 inline mr-1" />Excel
          </button>
        </div>
        <button type="button" className="cc-btn cc-btn-primary ml-auto" disabled={!canExport} onClick={exportData}
          title={canExport ? undefined : 'Select at least one candidate and one authorised field'}>
          <Download className="w-3.5 h-3.5" /> Export Data
        </button>
      </div>

      {/* History */}
      <div>
        <p className="cc-title text-xs font-bold mb-1.5">Export history</p>
        {history.length === 0 ? (
          <p className="cc-muted text-xs">No exports yet in this session.</p>
        ) : (
          <div className="cc-table-wrap">
            <table className="cc-table">
              <thead><tr><th>Exported by</th><th>Details</th><th>Date &amp; time</th></tr></thead>
              <tbody>
                {history.slice(0, 10).map((h) => (
                  <tr key={h.id}>
                    <td className="cc-title font-semibold">{h.actorName}</td>
                    <td>{h.action}</td>
                    <td className="cc-muted whitespace-nowrap">{formatAuditTime(h.at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
