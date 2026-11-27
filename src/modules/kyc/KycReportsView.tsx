import React, { useMemo, useState } from 'react';
import { FileBarChart, Download, Save, Trash2, FolderOpen, Lock, RotateCcw, Search, X, Check } from 'lucide-react';
import type { Candidate } from '../../types/onboarding';
import { PageHeader } from '../../components/page/PageHeader';
import { PageBody } from '../../components/page/PageBody';
import { SectionCard } from '../../components/page/SectionCard';
import { SelectMenu } from '../../components/ui/SelectMenu';
import { Toast } from '../../components/ui/Toast';
import { useToast } from '../../hooks/useToast';
import { useFeatureAccess, useRole } from '../../context/RoleContext';
import { logAudit } from '../hr-ops/auditStore';
import { DASHBOARD_REFERENCE_DATE } from '../dashboard/dashboard.metrics';
import { downloadCsv } from '../../utils/download';
import {
  AGGREGATE_FIELDS,
  DEFAULT_FIELDS,
  DEFAULT_REPORT_CONFIG,
  DETAIL_FIELDS,
  KYC_BUCKETS,
  KYC_DOC_TYPES,
  REPORT_FORMATS,
  SEED_SAVED_REPORT_FORMATS,
  agingLabel,
  flattenKyc,
  type KycFlatRow,
  type ReportConfig,
  type ReportFormatId,
  type SavedReportFormat,
} from '../../data/mockKycReportData';

interface KycReportsViewProps {
  candidates: Candidate[];
}

type Cell = string | number;
interface BuiltReport {
  headers: string[];
  data: Cell[][];
  /** Detail reports only: the full source row behind each data row (same order), so search can match fields that are not shown as columns. */
  source?: KycFlatRow[];
}

const pct = (n: number, d: number) => (d > 0 ? Math.round((n / d) * 100) : 0);

const detailValue = (r: KycFlatRow, id: string): Cell => {
  switch (id) {
    case 'agingBucket':
      return r.bucket === 'Pending' ? agingLabel(r.ageDays) : '';
    case 'ageDays':
      return r.ageDays;
    case 'matchPercentage':
      return r.matchPercentage;
    default:
      return (r as unknown as Record<string, Cell>)[id] ?? '';
  }
};

const buildReport = (config: ReportConfig, rows: KycFlatRow[]): BuiltReport => {
  const fmt = REPORT_FORMATS.find((f) => f.id === config.format)!;

  if (fmt.kind === 'aggregate') {
    const groupLabel = config.format === 'summary' ? 'Document Type' : 'Client';
    const keys = config.format === 'summary' ? KYC_DOC_TYPES.slice() : Array.from(new Set(rows.map((r) => r.clientName))).sort();
    const cols = AGGREGATE_FIELDS.filter((f) => config.fields.includes(f.id));
    const data = keys.map((k) => {
      const g = rows.filter((r) => (config.format === 'summary' ? r.docType === k : r.clientName === k));
      const count = (b: string) => g.filter((r) => r.bucket === b).length;
      const pend = g.filter((r) => r.bucket === 'Pending');
      const values: Record<string, Cell> = {
        total: g.length,
        candidates: new Set(g.map((r) => r.candidateId)).size,
        verified: count('Verified'),
        pending: count('Pending'),
        failed: count('Failed'),
        skipped: count('Skipped'),
        rate: `${pct(count('Verified'), g.length - count('Skipped'))}%`,
        avgAge: pend.length ? Math.round((pend.reduce((s, r) => s + r.ageDays, 0) / pend.length) * 10) / 10 : 0,
      };
      return [k, ...cols.map((c) => values[c.id])];
    });
    return { headers: [groupLabel, ...cols.map((c) => c.label)], data };
  }

  let list = rows;
  if (config.format === 'exceptions') list = rows.filter((r) => r.bucket === 'Failed');
  if (config.format === 'aging') list = rows.filter((r) => r.bucket === 'Pending').sort((a, b) => b.ageDays - a.ageDays);
  const cols = DETAIL_FIELDS.filter((f) => config.fields.includes(f.id));
  return { headers: cols.map((c) => c.label), data: list.map((r) => cols.map((c) => detailValue(r, c.id))), source: list };
};

const csvEscape = (v: Cell): string => {
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export const KycReportsView: React.FC<KycReportsViewProps> = ({ candidates }) => {
  const access = useFeatureAccess('kyc-reports');
  const { actor } = useRole();
  const canManage = access === 'manage';
  const { message, showToast } = useToast();

  const [config, setConfig] = useState<ReportConfig>(DEFAULT_REPORT_CONFIG);
  const [saved, setSaved] = useState<SavedReportFormat[]>(SEED_SAVED_REPORT_FORMATS);
  const [saveName, setSaveName] = useState('');
  const [saveError, setSaveError] = useState('');

  const clients = useMemo(() => Array.from(new Set(candidates.map((c) => c.clientName))).sort(), [candidates]);
  const allRows = useMemo(() => flattenKyc(candidates), [candidates]);

  const filtered = useMemo(
    () =>
      allRows.filter(
        (r) =>
          (config.client === 'all' || r.clientName === config.client) &&
          (config.docType === 'all' || r.docType === config.docType) &&
          (config.status === 'all' || r.bucket === config.status) &&
          (!config.from || r.lastUpdated >= config.from) &&
          (!config.to || r.lastUpdated <= config.to)
      ),
    [allRows, config]
  );

  const fmt = REPORT_FORMATS.find((f) => f.id === config.format)!;
  const fieldDefs = fmt.kind === 'aggregate' ? AGGREGATE_FIELDS : DETAIL_FIELDS;
  const report = useMemo(() => buildReport(config, filtered), [config, filtered]);
  const PREVIEW_LIMIT = 12;

  // Live-preview search: matches every shown value plus every other field of the candidate / KYC record behind the row.
  const [query, setQuery] = useState('');
  const previewData = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return report.data;
    const terms = q.split(/\s+/);
    return report.data.filter((row, i) => {
      const hay = [...row, ...(report.source ? Object.values(report.source[i]) : [])].join(' ').toLowerCase();
      return terms.every((t) => hay.includes(t));
    });
  }, [query, report]);
  const searching = query.trim() !== '';

  const update = (patch: Partial<ReportConfig>) => setConfig((c) => ({ ...c, ...patch }));

  const changeFormat = (id: ReportFormatId) => {
    const next = REPORT_FORMATS.find((f) => f.id === id)!;
    update({ format: id, fields: next.kind === fmt.kind ? config.fields : DEFAULT_FIELDS[next.kind] });
  };

  const toggleField = (id: string) =>
    update({ fields: config.fields.includes(id) ? config.fields.filter((f) => f !== id) : [...config.fields, id] });

  const dateInvalid = Boolean(config.from && config.to && config.from > config.to);
  const noFields = config.fields.length === 0;

  const handleGenerate = () => {
    if (!canManage || dateInvalid || noFields) return;
    const csv = [report.headers, ...report.data].map((row) => row.map(csvEscape).join(',')).join('\n');
    downloadCsv(csv, `kyc-${config.format}-report-${DASHBOARD_REFERENCE_DATE}.csv`);
    logAudit({ area: 'kyc-reports', action: `Generated ${fmt.label} KYC report (${report.data.length} rows)`, subjectId: config.format, actorId: actor.id, actorName: actor.name });
    showToast(`${fmt.label} report generated (${report.data.length} rows).`);
  };

  const handleSave = () => {
    if (!canManage) return;
    const name = saveName.trim();
    if (!name) {
      setSaveError('Enter a name for this report format');
      return;
    }
    if (saved.some((s) => s.name.toLowerCase() === name.toLowerCase())) {
      setSaveError('A saved format with this name already exists');
      return;
    }
    const entry: SavedReportFormat = { id: `SRF-${Date.now()}`, name, savedBy: actor.name, savedAt: DASHBOARD_REFERENCE_DATE, config };
    setSaved((s) => [entry, ...s]);
    setSaveName('');
    setSaveError('');
    logAudit({ area: 'kyc-reports', action: `Saved report format "${name}"`, subjectId: entry.id, actorId: actor.id, actorName: actor.name });
    showToast(`Report format "${name}" saved.`);
  };

  const handleDelete = (s: SavedReportFormat) => {
    if (!canManage) return;
    setSaved((list) => list.filter((x) => x.id !== s.id));
    logAudit({ area: 'kyc-reports', action: `Deleted report format "${s.name}"`, subjectId: s.id, actorId: actor.id, actorName: actor.name });
    showToast(`Report format "${s.name}" deleted.`);
  };

  const handleLoad = (s: SavedReportFormat) => {
    setConfig(s.config);
    showToast(`Loaded "${s.name}".`);
  };

  return (
    <>
      <Toast message={message} />
      <PageHeader icon={FileBarChart} title="KYC Reports" subtitle="Choose a format, fields and parameters, preview live, then export CSV" />
      <PageBody>
        {!canManage && (
          <div className="cc-callout tone-info">
            <Lock className="w-4 h-4 tone-text shrink-0 mt-0.5" />
            <span>
              <strong>View only.</strong> You can configure and preview reports, but generating CSV exports and saving or deleting formats is disabled for your role.
            </span>
          </div>
        )}

        <div className="cc-grid grid-cols-1 xl:grid-cols-3">
          <div className="xl:col-span-2 space-y-[var(--cc-gap)] min-w-0 max-xl:contents max-xl:space-y-0">
            <SectionCard title="1. Report format" step={undefined} className="max-xl:order-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {REPORT_FORMATS.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => changeFormat(f.id)}
                    aria-pressed={config.format === f.id}
                    className={`text-left p-3 rounded-xl border transition-colors max-sm:p-2.5 max-sm:flex max-sm:items-start max-sm:gap-2.5 ${
                      config.format === f.id
                        ? 'cc-accent-chip'
                        : 'border-[color:var(--cc-card-border)] hover:border-[color:var(--cc-hover-border)]'
                    }`}
                  >
                    {/* phones: radio-style marker so the chosen format is obvious at a glance */}
                    <span
                      aria-hidden
                      className={`sm:hidden shrink-0 mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center ${
                        config.format === f.id ? 'bg-[color:var(--cc-accent)] border-[color:var(--cc-accent)] text-[color:var(--cc-card-bg)]' : 'border-[color:var(--cc-card-border)]'
                      }`}
                    >
                      {config.format === f.id && <Check className="w-3 h-3" strokeWidth={3} />}
                    </span>
                    <span className="block min-w-0 max-sm:flex-1">
                      <span className="block text-xs font-bold cc-title">{f.label}</span>
                      <span className="block text-[11px] cc-muted mt-0.5">{f.description}</span>
                    </span>
                  </button>
                ))}
              </div>
            </SectionCard>

            <SectionCard
              className="max-xl:order-4"
              title="2. Required fields"
              subtitle={fmt.kind === 'aggregate' ? 'Metric columns for this format' : 'Columns included in the export'}
              action={
                <div className="flex gap-2 text-[11px] font-semibold">
                  <button type="button" className="cc-accent hover:underline" onClick={() => update({ fields: fieldDefs.map((f) => f.id) })}>All</button>
                  <button type="button" className="cc-accent hover:underline" onClick={() => update({ fields: DEFAULT_FIELDS[fmt.kind] })}>Default</button>
                </div>
              }
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-2">
                {fieldDefs.map((f) => (
                  <label key={f.id} className="flex items-center gap-2 text-xs cc-text cursor-pointer select-none">
                    <input type="checkbox" className="w-4 h-4 rounded" checked={config.fields.includes(f.id)} onChange={() => toggleField(f.id)} />
                    <span>{f.label}</span>
                  </label>
                ))}
              </div>
              {noFields && <p className="text-[11px] mt-2 font-medium tone-bad tone-text">Select at least one field.</p>}
            </SectionCard>

            <SectionCard title="3. Reporting parameters" className="max-xl:order-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <div>
                  <label className="cc-label" htmlFor="rp-client">Client</label>
                  <SelectMenu id="rp-client" value={config.client} onChange={(e) => update({ client: e.target.value })} className="cc-input">
                    <option value="all">All Clients</option>
                    {clients.map((c) => <option key={c} value={c}>{c}</option>)}
                  </SelectMenu>
                </div>
                <div>
                  <label className="cc-label" htmlFor="rp-doc">Document type</label>
                  <SelectMenu id="rp-doc" value={config.docType} onChange={(e) => update({ docType: e.target.value })} className="cc-input">
                    <option value="all">All Documents</option>
                    {KYC_DOC_TYPES.map((d) => <option key={d} value={d}>{d}</option>)}
                  </SelectMenu>
                </div>
                <div>
                  <label className="cc-label" htmlFor="rp-status">Status</label>
                  <SelectMenu id="rp-status" value={config.status} onChange={(e) => update({ status: e.target.value })} className="cc-input">
                    <option value="all">All Statuses</option>
                    {KYC_BUCKETS.map((b) => <option key={b} value={b}>{b}</option>)}
                  </SelectMenu>
                </div>
                <div>
                  <label className="cc-label" htmlFor="rp-from">Updated from</label>
                  <input id="rp-from" type="date" className="cc-input" value={config.from} max={config.to || undefined} onChange={(e) => update({ from: e.target.value })} />
                </div>
                <div>
                  <label className="cc-label" htmlFor="rp-to">Updated to</label>
                  <input id="rp-to" type="date" className="cc-input" value={config.to} min={config.from || undefined} onChange={(e) => update({ to: e.target.value })} />
                </div>
                <div className="flex items-end">
                  <button type="button" className="cc-btn cc-btn-secondary w-full" onClick={() => setConfig({ ...DEFAULT_REPORT_CONFIG, format: config.format, fields: config.fields })}>
                    <RotateCcw className="w-3.5 h-3.5" /><span>Reset parameters</span>
                  </button>
                </div>
              </div>
              {dateInvalid && <p className="text-[11px] mt-2 font-medium tone-bad tone-text">The start date must be on or before the end date.</p>}
            </SectionCard>
          </div>

          <div className="space-y-[var(--cc-gap)] min-w-0 max-xl:contents max-xl:space-y-0">
            <SectionCard title="Generate" className="max-xl:order-2">
              <p className="cc-muted text-xs mb-3">
                {fmt.label}: <strong className="cc-title">{report.data.length}</strong> row(s), {report.headers.length} column(s).
              </p>
              <button type="button" className="cc-btn cc-btn-primary w-full" onClick={handleGenerate} disabled={!canManage || dateInvalid || noFields}>
                <Download className="w-3.5 h-3.5" /><span>Generate report (CSV)</span>
              </button>
            </SectionCard>

            <SectionCard title="Saved report formats" subtitle="Stored for this session only" className="max-xl:order-3">
              <div className="flex gap-2 mb-1">
                <input
                  className="cc-input min-w-0"
                  placeholder="Format name"
                  value={saveName}
                  onChange={(e) => { setSaveName(e.target.value); setSaveError(''); }}
                  disabled={!canManage}
                  aria-label="Saved format name"
                />
                <button type="button" className="cc-btn cc-btn-secondary shrink-0" onClick={handleSave} disabled={!canManage}>
                  <Save className="w-3.5 h-3.5" /><span>Save</span>
                </button>
              </div>
              {saveError && <p className="text-[11px] mb-1 font-medium tone-bad tone-text">{saveError}</p>}
              <ul className="cc-divide mt-2">
                {saved.map((s) => (
                  <li key={s.id} className="py-2.5 flex items-center gap-2 max-sm:gap-1.5">
                    <div className="min-w-0 flex-1">
                      <p className="cc-title text-xs font-semibold sm:truncate max-sm:break-words">{s.name}</p>
                      <p className="cc-muted text-[11px] sm:truncate max-sm:break-words">
                        {REPORT_FORMATS.find((f) => f.id === s.config.format)?.label} · {s.savedBy} · {s.savedAt}
                      </p>
                    </div>
                    <button type="button" className="cc-btn cc-btn-secondary !h-7 max-sm:!h-9 max-sm:!w-9 max-sm:!px-0 shrink-0" onClick={() => handleLoad(s)} title="Load this format" aria-label={`Load ${s.name}`}>
                      <FolderOpen className="w-3.5 h-3.5" /><span className="max-sm:sr-only">Load</span>
                    </button>
                    <button type="button" className="cc-btn cc-btn-tone tone-bad !h-7 !px-2 max-sm:!h-9 max-sm:!w-9 max-sm:!px-0 shrink-0" onClick={() => handleDelete(s)} disabled={!canManage} aria-label={`Delete ${s.name}`}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </li>
                ))}
                {saved.length === 0 && <li className="cc-muted text-xs py-4 text-center">No saved formats yet.</li>}
              </ul>
            </SectionCard>
          </div>
        </div>

        <SectionCard title="Live preview" subtitle={`${fmt.label} · showing ${Math.min(PREVIEW_LIMIT, previewData.length)} of ${previewData.length} rows${searching ? ` (filtered from ${report.data.length})` : ''}`}
          action={
              <div className="relative hidden sm:block sm:w-64 shrink-0">
                <Search className="cc-muted w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden />
                <input
                  id="kyc-report-search"
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search ID, name, client, document, status..."
                  aria-label="Search the live preview"
                  className="cc-input !pl-9 !pr-8"
                />
                {searching && (
                  <button
                    type="button"
                    onClick={() => setQuery('')}
                    aria-label="Clear search"
                    className="cc-muted hover:text-[color:var(--cc-title)] absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
          }
        >
          <div className="relative w-full mb-3 sm:hidden">
            <Search className="cc-muted w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search ID, name, client, document, status..."
              aria-label="Search the live preview"
              className="cc-input !pl-9 !pr-8"
            />
            {searching && (
              <button type="button" onClick={() => setQuery('')} aria-label="Clear search" className="cc-muted hover:text-[color:var(--cc-title)] absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <div className="cc-table-wrap">
            <table className="cc-table">
              <thead>
                <tr>{report.headers.map((h, j) => <th key={h} className={typeof report.data[0]?.[j] === 'number' ? 'text-right' : ''}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {previewData.slice(0, PREVIEW_LIMIT).map((row, i) => (
                  <tr key={i}>
                    {row.map((v, j) => (
                      <td key={j} className={`whitespace-nowrap ${typeof v === 'number' ? 'tabular-nums text-right' : ''}`}>{v === '' ? '-' : v}</td>
                    ))}
                  </tr>
                ))}
                {previewData.length === 0 && (
                  <tr><td colSpan={Math.max(1, report.headers.length)} className="cc-muted text-center py-6">{searching ? 'No rows match your search.' : 'No rows match the selected parameters.'}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </SectionCard>
      </PageBody>
    </>
  );
};
