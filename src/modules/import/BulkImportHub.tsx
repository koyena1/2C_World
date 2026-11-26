import React, { useState, useMemo } from 'react';
import {
  UploadCloud,
  Search,
  ArrowRight,
  ChevronRight,
  Database,
  UserCheck,
  CalendarClock,
  Coins,
  Building2,
  FileSpreadsheet,
  Info,
  Layers,
  Workflow,
  History,
  Gauge,
  type LucideIcon,
} from 'lucide-react';
import {
  IMPORT_CATEGORIES,
  ALL_IMPORT_TYPES,
  INITIAL_IMPORT_LOGS,
} from '../../data/mockBulkImportData';
import { PageHeader } from '../../components/page/PageHeader';
import { PageBody } from '../../components/page/PageBody';
import { KpiCard } from '../../components/page/KpiCard';
import { KpiDetailPanel, type KpiDetailData } from '../../components/page/KpiDetailPanel';
import { useKpiDetail } from '../../hooks/useKpiDetail';
import { CategoryTabs } from '../../components/page/CategoryTabs';
import { DonutChart } from '../../components/page/DonutChart';
import { SectionCard, Chip } from '../dashboard/command-center/shared';
import { ImportStatusChip } from './ImportStatusChip';
import type { Tone } from '../dashboard/command-center/types';

import { SelectMenu } from '../../components/ui/SelectMenu';
interface BulkImportHubProps {
  onSelectImportType: (typeId: string) => void;
  onShowToast: (msg: string) => void;
}

const CATEGORY_STYLE: Record<string, { icon: LucideIcon; tone: Tone }> = {
  'Candidate Lifecycle': { icon: UserCheck, tone: 'info' },
  'Master Data': { icon: Database, tone: 'violet' },
  'Attendance & Workforce': { icon: CalendarClock, tone: 'good' },
  'Payroll & Compensation': { icon: Coins, tone: 'warn' },
  'Client Setup': { icon: Building2, tone: 'teal' },
};
const DEFAULT_STYLE: { icon: LucideIcon; tone: Tone } = { icon: FileSpreadsheet, tone: 'muted' };
const styleOf = (name: string) => CATEGORY_STYLE[name] ?? DEFAULT_STYLE;

export const BulkImportHub: React.FC<BulkImportHubProps> = ({ onSelectImportType }) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('All');

  // Filtered import types based on search and category
  const filteredImportTypes = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return ALL_IMPORT_TYPES.filter(type => {
      const matchSearch = type.name.toLowerCase().includes(q) ||
                          type.description.toLowerCase().includes(q) ||
                          type.shortName.toLowerCase().includes(q) ||
                          type.category.toLowerCase().includes(q);
      const matchCat = selectedCategoryFilter === 'All' || type.category === selectedCategoryFilter;
      return matchSearch && matchCat;
    });
  }, [searchQuery, selectedCategoryFilter]);

  // Aggregate stats
  const totalImportTypes = ALL_IMPORT_TYPES.length;
  const totalCategories = IMPORT_CATEGORIES.length;
  const recentLogs = INITIAL_IMPORT_LOGS.slice(0, 5);

  const donutSlices = IMPORT_CATEGORIES.map(cat => ({
    key: cat.id,
    label: cat.name,
    count: ALL_IMPORT_TYPES.filter(t => t.category === cat.name).length,
    tone: styleOf(cat.name).tone,
  }));

  const kd = useKpiDetail<'categories' | 'workflows' | 'batches' | 'accuracy'>();
  const logCols = [
    { key: 'id', label: 'Batch ID', className: 'font-mono whitespace-nowrap' },
    { key: 'type', label: 'Import type' },
    { key: 'client', label: 'Client / scope' },
    { key: 'on', label: 'Uploaded on', className: 'whitespace-nowrap' },
    { key: 'rows', label: 'Rows (passed / total)', align: 'right' as const },
    { key: 'status', label: 'Status' },
  ];
  const kdDetail: KpiDetailData | null = !kd.activeId
    ? null
    : kd.activeId === 'categories'
      ? {
          title: 'Categories',
          columns: [
            { key: 'name', label: 'Category' },
            { key: 'desc', label: 'Description' },
            { key: 'n', label: 'Workflows', align: 'right' },
          ],
          rows: IMPORT_CATEGORIES.map((cat) => ({ name: cat.name, desc: cat.description, n: ALL_IMPORT_TYPES.filter((t) => t.category === cat.name).length })),
        }
      : kd.activeId === 'workflows'
        ? {
            title: 'Import Workflows',
            columns: [
              { key: 'name', label: 'Workflow' },
              { key: 'cat', label: 'Category' },
              { key: 'fmt', label: 'Formats' },
              { key: 'cols', label: 'Template columns', align: 'right' },
            ],
            rows: ALL_IMPORT_TYPES.map((t) => ({ name: t.name, cat: t.category, fmt: t.supportedFileFormats.join(', '), cols: t.templateHeaders.length })),
          }
        : kd.activeId === 'batches'
          ? {
              title: 'Recent Batches',
              subtitle: `Latest ${INITIAL_IMPORT_LOGS.length} batches from the audit trail`,
              columns: logCols,
              rows: INITIAL_IMPORT_LOGS.map((l) => ({ id: l.id, type: l.importTypeName, client: l.clientOrEntity, on: l.uploadedOn, rows: `${l.insertedRows} / ${l.totalRows}`, status: <ImportStatusChip status={l.status} /> })),
            }
          : {
              title: 'Engine Accuracy: pre-flight pass rate per batch',
              columns: [...logCols.slice(0, 2), { key: 'rate', label: 'Pass rate', align: 'right' as const }, ...logCols.slice(4)],
              rows: INITIAL_IMPORT_LOGS.map((l) => ({ id: l.id, type: l.importTypeName, rate: `${l.totalRows ? Math.round((l.insertedRows / l.totalRows) * 1000) / 10 : 0}%`, rows: `${l.insertedRows} / ${l.totalRows}`, status: <ImportStatusChip status={l.status} /> })),
            };

  const tabs = [
    { value: 'All', label: 'All Categories', count: totalImportTypes },
    ...IMPORT_CATEGORIES.map(cat => ({
      value: cat.name,
      label: cat.name,
      count: ALL_IMPORT_TYPES.filter(t => t.category === cat.name).length,
    })),
  ];

  return (
    <div className="flex-1 flex flex-col">
      <PageHeader
        icon={UploadCloud}
        title="Bulk Excel Import"
        subtitle="Upload structured Excel files for candidate, payroll, attendance, leave, and master data operations."
        actions={
          <div className="relative min-w-[240px]">
            <label htmlFor="quick-import-select" className="sr-only">Quick Select Import Type</label>
            <SelectMenu
              id="quick-import-select"
              onChange={(e) => {
                if (e.target.value) onSelectImportType(e.target.value);
              }}
              defaultValue=""
              className="cc-input cursor-pointer"
            >
              <option value="" disabled>⚡ Jump to Import Type...</option>
              {IMPORT_CATEGORIES.map(cat => (
                <optgroup key={cat.id} label={cat.name}>
                  {ALL_IMPORT_TYPES.filter(t => t.category === cat.name).map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </optgroup>
              ))}
            </SelectMenu>
          </div>
        }
      />

      <PageBody>
        {/* Template reminder */}
        <div className="cc-card cc-text p-3 sm:p-4 text-xs flex items-start gap-2.5" style={{ backgroundColor: 'var(--cc-accent-soft)', borderColor: 'var(--cc-accent-border)' }}>
          <Info className="cc-accent w-4 h-4 shrink-0 mt-0.5" />
          <p className="flex-1 leading-relaxed">
            <strong className="cc-title font-semibold">Always download and use the official template before uploading:</strong> Each data category contains specific mandatory headers, statutory data formats (dates, PAN, Aadhaar, salary components), and validation constraints. Choose an import type below to download its official template.
          </p>
        </div>

        {/* KPI cards */}
        <div className="cc-grid grid-cols-2 xl:grid-cols-4">
          <KpiCard onClick={() => kd.toggle('categories')} active={kd.isActive('categories')} label="Categories" value={totalCategories} detail="Enterprise operations" icon={Layers} tone="info" />
          <KpiCard onClick={() => kd.toggle('workflows')} active={kd.isActive('workflows')} label="Import Workflows" value={totalImportTypes} detail="Ready for Excel ingestion" icon={Workflow} tone="good" />
          <KpiCard onClick={() => kd.toggle('batches')} active={kd.isActive('batches')} label="Recent Batches" value={148} detail="This financial month" icon={History} tone="violet" />
          <KpiCard onClick={() => kd.toggle('accuracy')} active={kd.isActive('accuracy')} label="Engine Accuracy" value="98.4%" detail="Pre-flight validation rate" icon={Gauge} tone="teal" />
        </div>
        <KpiDetailPanel detail={kdDetail} onClose={kd.close} />

        {/* Donut + recent activity */}
        <div className="cc-grid grid-cols-1 xl:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
          <SectionCard title="Import Categories" subtitle="Import workflows available per category">
            <div className="flex-1 flex items-center justify-center">
              <DonutChart slices={donutSlices} total={totalImportTypes} caption="workflows" ariaLabel="Import workflows by category" />
            </div>
          </SectionCard>

          <SectionCard
            title="Recent Global Import Activity"
            subtitle="System-wide audit trail of Excel imports processed across all modules"
            action={<span className="cc-muted text-[11px] font-mono whitespace-nowrap">Live Enterprise Activity</span>}
            >
            <div className="overflow-x-auto -mx-3.5 sm:-mx-5">
              <table className="w-full text-left text-xs cc-text">
                <thead className="cc-muted text-[11px] uppercase tracking-wider font-semibold border-b border-[color:var(--cc-divider)]">
                  <tr>
                    <th className="px-4 py-2.5 whitespace-nowrap">Batch ID</th>
                    <th className="px-3 py-2.5 whitespace-nowrap">Import Type</th>
                    <th className="px-3 py-2.5 whitespace-nowrap">File Name</th>
                    <th className="px-3 py-2.5 whitespace-nowrap">Client / Scope</th>
                    <th className="px-3 py-2.5 whitespace-nowrap">Uploaded By</th>
                    <th className="px-3 py-2.5 whitespace-nowrap">Uploaded On</th>
                    <th className="px-3 py-2.5 text-right whitespace-nowrap">Rows (Total / Passed / Failed)</th>
                    <th className="px-3 py-2.5 whitespace-nowrap">Status</th>
                    <th className="px-4 py-2.5 text-right whitespace-nowrap">Action</th>
                  </tr>
                </thead>
                <tbody className="cc-divide">
                  {recentLogs.map((log) => (
                    <tr key={log.id} className="cc-row transition-colors">
                      <td className="px-4 py-3 font-mono font-medium cc-title whitespace-nowrap">{log.id}</td>
                      <td className="px-3 py-3 font-semibold cc-title whitespace-nowrap">{log.importTypeName}</td>
                      <td className="px-3 py-3 font-mono text-[11px] max-w-[180px] truncate" title={log.fileName}>{log.fileName}</td>
                      <td className="px-3 py-3 whitespace-nowrap">{log.clientOrEntity}</td>
                      <td className="px-3 py-3 whitespace-nowrap">{log.uploadedBy}</td>
                      <td className="px-3 py-3 text-[11px] cc-muted whitespace-nowrap">{log.uploadedOn}</td>
                      <td className="px-3 py-3 text-right font-mono whitespace-nowrap">
                        <span className="cc-title font-semibold">{log.totalRows}</span>
                        <span className="cc-muted mx-1">/</span>
                        <span className="tone-good tone-text font-semibold">{log.insertedRows}</span>
                        <span className="cc-muted mx-1">/</span>
                        <span className={log.failedRows > 0 ? 'tone-bad tone-text font-bold' : 'cc-muted'}>{log.failedRows}</span>
                      </td>
                      <td className="px-3 py-3 whitespace-nowrap">
                        <ImportStatusChip status={log.status} />
                        </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => onSelectImportType(log.importTypeId)}
                          className="cc-accent px-2.5 py-1 text-xs font-semibold rounded-md inline-flex items-center gap-1 hover:underline"
                        >
                          <span>Open Workspace</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>
        </div>

        {/* Category tabs + search */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <CategoryTabs tabs={tabs} value={selectedCategoryFilter} onChange={setSelectedCategoryFilter} />
          <div className="relative w-full lg:w-64 shrink-0">
            <Search className="cc-muted w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search import types, fields..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="cc-input pl-9"
            />
          </div>
        </div>

        {/* Import workflow cards grouped by category */}
        {IMPORT_CATEGORIES.filter(cat => selectedCategoryFilter === 'All' || selectedCategoryFilter === cat.name).map(cat => {
          const categoryTypes = filteredImportTypes.filter(t => t.category === cat.name);
          if (categoryTypes.length === 0) return null;
          const { icon: CatIcon, tone } = styleOf(cat.name);

          return (
            <SectionCard
              key={cat.id}
              title={cat.name}
              subtitle={cat.description}
              action={
                <span className="cc-muted text-[11px] font-mono whitespace-nowrap">
                  {categoryTypes.length} Import {categoryTypes.length === 1 ? 'Type' : 'Types'}
                </span>
              }
            >
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {categoryTypes.map(importType => (
                  <div
                    key={importType.id}
                    onClick={() => onSelectImportType(importType.id)}
                    className={`cc-card cc-card-link group p-4 flex flex-col justify-between tone-${styleOf(importType.category).tone}`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="tone-chip w-7 h-7 rounded-lg flex items-center justify-center shrink-0">
                          <CatIcon className="w-4 h-4" />
                        </span>
                        <span className="cc-muted text-[10px] font-mono">{importType.columns.length} Columns</span>
                      </div>
                      <span className="tone-text text-[10px] font-semibold uppercase tracking-wider block">{importType.badge}</span>
                      <h3 className="cc-title text-sm font-bold">{importType.name}</h3>
                      <p className="cc-muted text-xs leading-relaxed line-clamp-2">{importType.description}</p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-[color:var(--cc-divider)] flex items-center justify-between text-xs">
                      <span className="cc-muted font-mono text-[11px] flex items-center gap-1">
                        <FileSpreadsheet className="w-3.5 h-3.5" />
                        <span>.xlsx / .csv</span>
                      </span>
                      <button
                        type="button"
                        className="cc-accent inline-flex items-center gap-1 font-semibold group-hover:translate-x-0.5 transition-transform"
                      >
                        <span>Start Import</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>
          );
        })}
      </PageBody>
    </div>
  );
};
