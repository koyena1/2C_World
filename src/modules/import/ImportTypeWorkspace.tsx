import React, { useState, useMemo, useRef } from 'react';
import { downloadCsv } from '../../utils/download';
import {
  ArrowLeft,
  UploadCloud,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  ChevronRight,
  Info,
  Check,
  Sparkles,
  FileCheck,
  X,
  Layers,
} from 'lucide-react';
import {
  ImportTypeDefinition,
  ALL_IMPORT_TYPES,
  IMPORT_CATEGORIES,
  ExtendedImportLog,
  ImportValidationError
} from '../../data/mockBulkImportData';
import { PageHeader } from '../../components/page/PageHeader';
import { PageBody } from '../../components/page/PageBody';
import { KpiCard } from '../../components/page/KpiCard';
import { CategoryTabs } from '../../components/page/CategoryTabs';
import { StepProgress, type Step } from '../../components/page/StepProgress';
import { SectionCard, Chip, ProgressBar } from '../dashboard/command-center/shared';
import { ImportStatusChip } from './ImportStatusChip';

import { SelectMenu } from '../../components/ui/SelectMenu';
interface ImportTypeWorkspaceProps {
  importType: ImportTypeDefinition;
  onBackToHub: () => void;
  onSwitchImportType: (typeId: string) => void;
  onShowToast: (msg: string) => void;
  importLogs: ExtendedImportLog[];
  onAddImportLog: (log: ExtendedImportLog) => void;
}

export const ImportTypeWorkspace: React.FC<ImportTypeWorkspaceProps> = ({
  importType,
  onBackToHub,
  onSwitchImportType,
  onShowToast,
  importLogs,
  onAddImportLog
}) => {
  // Common 8-Step Flow:
  // Step 1: Select Import Type (Header / Switcher)
  // Step 2: Select Context / Filters
  // Step 3: Download Template
  // Step 4: Upload Excel File
  // Step 5: Validate File
  // Step 6: Review Errors / Warnings
  // Step 7: Confirm Import
  // Step 8: Import Complete / View Logs
  const [activeStep, setActiveStep] = useState<number>(2);

  // Context Fields State (Dynamic dictionary keyed by context field key)
  const [contextValues, setContextValues] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {};
    importType.contextFields.forEach(f => {
      init[f.key] = f.defaultValue;
    });
    return init;
  });

  // Uploaded File State
  const [uploadedFile, setUploadedFile] = useState<{
    name: string;
    size: string;
    rowsCount: number;
    fileObject?: File;
  } | null>(null);

  // Validation State
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [validationProgress, setValidationProgress] = useState<number>(0);
  const [validationDone, setValidationDone] = useState<boolean>(false);
  const [isDemoFile, setIsDemoFile] = useState<boolean>(false);

  // Filter error table
  const [errorSeverityFilter, setErrorSeverityFilter] = useState<'All' | 'Critical' | 'Warning'>('All');
  const [skipInvalidRows, setSkipInvalidRows] = useState<boolean>(true);
  const [isExecutingImport, setIsExecutingImport] = useState<boolean>(false);
  const [importCompleted, setImportCompleted] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Dynamic errors from the definition
  const errorsList: ImportValidationError[] = useMemo(() => {
    return importType.mockErrors || [];
  }, [importType]);

  const filteredErrors = useMemo(() => {
    if (errorSeverityFilter === 'All') return errorsList;
    return errorsList.filter(e => e.severity === errorSeverityFilter);
  }, [errorsList, errorSeverityFilter]);

  const totalRowsCount = uploadedFile?.rowsCount || (importType.defaultSuccessCount + importType.defaultErrorCount);
  const criticalCount = importType.defaultErrorCount;
  const warningCount = importType.defaultWarningCount;
  const validRowsCount = totalRowsCount - criticalCount;

  // Handle Context Field change
  const handleContextChange = (key: string, val: string) => {
    setContextValues(prev => ({ ...prev, [key]: val }));
  };

  // Download Genuine Official Template (CSV file generator)
  const handleDownloadTemplate = () => {
    const headers = importType.templateHeaders;
    const rows = importType.sampleRows.map(row => 
      headers.map(h => `"${(row[h] || '').replace(/"/g, '""')}"`).join(',')
    );
    const csvContent = [headers.join(','), ...rows].join('\n');
    downloadCsv(csvContent, importType.templateFileName.replace('.xlsx', '.csv'));
    onShowToast(`Downloaded official template for "${importType.shortName}".`);
  };

  // Download Genuine Error Report CSV
  const handleDownloadErrorReport = () => {
    const headers = ['Row_Number', 'Record_Identifier', 'Column_Field', 'Faulty_Value', 'Severity', 'Error_Reason', 'Suggested_Fix'];
    const rows = errorsList.map(err => 
      [
        err.row,
        `"${err.identifier.replace(/"/g, '""')}"`,
        `"${err.field.replace(/"/g, '""')}"`,
        `"${err.value.replace(/"/g, '""')}"`,
        err.severity,
        `"${err.reason.replace(/"/g, '""')}"`,
        `"${err.suggestedFix.replace(/"/g, '""')}"`
      ].join(',')
    );
    const csvContent = [headers.join(','), ...rows].join('\n');
    downloadCsv(csvContent, `Error_Report_${importType.id}_${Date.now()}.csv`);
    onShowToast(`Downloaded error audit report with ${errorsList.length} diagnostic items.`);
  };

  // File Upload Handlers
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const sizeKb = (file.size / 1024).toFixed(1);
      setUploadedFile({
        name: file.name,
        size: `${sizeKb} KB`,
        rowsCount: 64,
        fileObject: file
      });
      setIsDemoFile(false);
      setValidationDone(false);
      setActiveStep(5);
      onShowToast(`File "${file.name}" staged. Click "Validate File" to run pre-flight checks.`);
    }
  };

  // Load Demo File for quick, authentic demonstration
  const handleLoadDemoFile = () => {
    const demoName = `${importType.shortName.replace(/[\s/]/g, '_')}_Batch_Demo.xlsx`;
    setUploadedFile({
      name: demoName,
      size: '148.5 KB',
      rowsCount: totalRowsCount
    });
    setIsDemoFile(true);
    setValidationDone(false);
    setActiveStep(5);
    onShowToast(`Loaded authentic demo dataset for ${importType.shortName}.`);
  };

  // Run File Pre-Flight Validation
  const handleRunValidation = () => {
    setIsValidating(true);
    setValidationProgress(15);
    
    setTimeout(() => setValidationProgress(45), 300);
    setTimeout(() => setValidationProgress(80), 700);
    setTimeout(() => {
      setValidationProgress(100);
      setIsValidating(false);
      setValidationDone(true);
      setActiveStep(6);
      onShowToast(`Pre-flight validation finished: ${validRowsCount} rows passed, ${criticalCount} errors detected.`);
    }, 1100);
  };

  // Execute Final Import
  const handleExecuteImport = () => {
    setIsExecutingImport(true);
    setTimeout(() => {
      setIsExecutingImport(false);
      setImportCompleted(true);
      setActiveStep(8);

      const clientOrEntity = contextValues['client'] || contextValues['entity'] || '2COMS Services';
      const inserted = skipInvalidRows ? validRowsCount : totalRowsCount;
      const failed = skipInvalidRows ? criticalCount : 0;

      const newLog: ExtendedImportLog = {
        id: `BATCH-${Date.now().toString().slice(-4)}`,
        importTypeId: importType.id,
        importTypeName: importType.shortName,
        category: importType.category,
        fileName: uploadedFile?.name || `${importType.shortName}_Batch.xlsx`,
        clientOrEntity: clientOrEntity,
        uploadedBy: 'Current User (Ops Lead)',
        uploadedOn: 'Just now',
        totalRows: totalRowsCount,
        insertedRows: inserted,
        failedRows: failed,
        warningsCount: warningCount,
        status: failed > 0 ? 'Partially Completed' : 'Completed',
        errorReportUrl: failed > 0 ? '#download-errors' : undefined
      };

      onAddImportLog(newLog);
      onShowToast(`Import completed! ${inserted} records successfully ingested into ${importType.shortName}.`);
    }, 1200);
  };

  // Reset to Upload another batch
  const handleResetForNewBatch = () => {
    setUploadedFile(null);
    setValidationDone(false);
    setImportCompleted(false);
    setActiveStep(2);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Filter logs for this specific import type
  const typeSpecificLogs = useMemo(() => {
    return importLogs.filter(l => l.importTypeId === importType.id);
  }, [importLogs, importType.id]);

  const scopeLabel = contextValues['client'] || contextValues['entity'] || '2COMS Services';
  const ingestCount = skipInvalidRows ? validRowsCount : totalRowsCount;

  // 8-step progress (status logic and click rules unchanged)
  const stepDefs = [
    { num: 1, label: 'Import Type', isDone: true, isCurrent: false },
    { num: 2, label: 'Context / Scope', isDone: activeStep > 2, isCurrent: activeStep === 2 },
    { num: 3, label: 'Template', isDone: activeStep > 3, isCurrent: activeStep === 3 },
    { num: 4, label: 'Upload File', isDone: activeStep > 4 || uploadedFile !== null, isCurrent: activeStep === 4 },
    { num: 5, label: 'Validate', isDone: validationDone, isCurrent: activeStep === 5 },
    { num: 6, label: 'Review Errors', isDone: activeStep > 6, isCurrent: activeStep === 6 },
    { num: 7, label: 'Confirm Import', isDone: importCompleted, isCurrent: activeStep === 7 },
    { num: 8, label: 'Completed', isDone: importCompleted, isCurrent: activeStep === 8 },
  ];
  const steps: Step[] = stepDefs.map((s) => ({
    label: s.label,
    status: s.isDone ? 'done' : s.isCurrent ? 'current' : 'todo',
    onClick: () => {
      if (s.num <= activeStep || (s.num === 3 && activeStep >= 2) || (s.num === 5 && uploadedFile)) {
        setActiveStep(s.num);
      }
    },
  }));

  return (
    <div className="flex-1 flex flex-col">
      <PageHeader
        icon={UploadCloud}
        title={importType.name}
        badge={<Chip tone="info" className="rounded-full">{importType.badge}</Chip>}
        subtitle={importType.description}
        eyebrow={
          <div className="cc-muted flex items-center flex-wrap gap-1.5">
            <button type="button" onClick={onBackToHub} className="cc-accent font-semibold inline-flex items-center gap-1 hover:underline">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Bulk Excel Import Hub</span>
            </button>
            <ChevronRight className="w-3 h-3" />
            <span>{importType.category}</span>
            <ChevronRight className="w-3 h-3" />
            <span className="cc-title font-semibold">{importType.shortName}</span>
          </div>
        }
        actions={
          <div className="flex items-center gap-2">
            <label htmlFor="switch-import-type" className="cc-muted text-xs font-semibold hidden sm:inline">Switch Type:</label>
            <SelectMenu
              id="switch-import-type"
              value={importType.id}
              onChange={(e) => onSwitchImportType(e.target.value)}
              className="cc-input min-w-[240px] cursor-pointer"
            >
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
        {/* 8-step progress */}
        <div className="cc-card px-3.5 sm:px-5 py-4">
          <StepProgress steps={steps} />
        </div>

        {/* STEP 2: Context & scope */}
        <SectionCard step={2} title="Required Context & Scope" subtitle={`Tailored fields for ${importType.shortName}`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-3.5">
            {importType.contextFields.map((field) => (
              <div key={field.key} className="min-w-0">
                <label htmlFor={`ctx-${field.key}`} className="cc-label">
                  {field.label} {field.required && <span className="text-rose-500">*</span>}
                </label>
                {field.type === 'select' && field.options ? (
                  <SelectMenu
                    id={`ctx-${field.key}`}
                    value={contextValues[field.key] || field.defaultValue}
                    onChange={(e) => handleContextChange(field.key, e.target.value)}
                    className="cc-input cursor-pointer"
                  >
                    {field.options.map((opt) => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </SelectMenu>
                ) : (
                  <input
                    id={`ctx-${field.key}`}
                    type={field.type === 'date' ? 'date' : 'text'}
                    value={contextValues[field.key] || field.defaultValue}
                    onChange={(e) => handleContextChange(field.key, e.target.value)}
                    className="cc-input"
                  />
                )}
                {field.helperText && <p className="cc-hint">{field.helperText}</p>}
              </div>
            ))}
          </div>
        </SectionCard>

        {/* STEP 3: Template & guidelines */}
        <SectionCard
          step={3}
          title="Official Excel Template & Guidelines"
          subtitle="Download formatted template with sample data rows and strict column headers"
          action={
            <button type="button" onClick={handleDownloadTemplate} className="cc-btn cc-btn-tone tone-good">
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Download Official Template (.csv / .xlsx)</span>
              <span className="sm:hidden">Template</span>
            </button>
          }
        >
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <div className="cc-callout tone-info flex-col xl:col-span-1 !gap-2">
              <div className="tone-text flex items-center gap-1.5 font-bold">
                <Info className="w-3.5 h-3.5" />
                <span>Template Instructions & Validation Rules</span>
              </div>
              <ul className="list-disc pl-4 space-y-1 text-[11px] leading-relaxed">
                {importType.guidelines.map((rule, idx) => (
                  <li key={idx}>{rule}</li>
                ))}
              </ul>
            </div>

            <div className="xl:col-span-2 min-w-0">
              <div className="flex flex-wrap items-center justify-between gap-1 mb-2 text-xs">
                <span className="cc-title font-bold">Columns Required in Template ({importType.columns.length} columns)</span>
                <span className="cc-muted text-[11px]">
                  {importType.columns.filter(c => c.required).length} Mandatory · {importType.columns.filter(c => !c.required).length} Optional
                </span>
              </div>
              <div className="cc-table-wrap max-h-72">
                <table className="cc-table">
                  <thead>
                    <tr>
                      <th>Column Header</th>
                      <th>Key</th>
                      <th>Data Type</th>
                      <th>Required</th>
                      <th>Sample Value</th>
                      <th>Validation Rule & Constraints</th>
                    </tr>
                  </thead>
                  <tbody>
                    {importType.columns.map((col) => (
                      <tr key={col.key}>
                        <td className="cc-title font-semibold whitespace-nowrap">{col.name}</td>
                        <td className="cc-muted font-mono text-[11px]">{col.key}</td>
                        <td><Chip tone="muted" className="rounded">{col.type}</Chip></td>
                        <td>
                          {col.required ? (
                            <Chip tone="bad" className="rounded">Mandatory</Chip>
                          ) : (
                            <span className="cc-muted text-[11px]">Optional</span>
                          )}
                        </td>
                        <td className="font-mono text-[11px] max-w-[140px] truncate" title={col.sample}>{col.sample}</td>
                        <td className="cc-muted text-[11px] min-w-[200px]">{col.validationRule}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </SectionCard>

        {/* STEP 4 & 5: Upload & validate */}
        <SectionCard
          step={4}
          title="Upload Filled Excel / CSV File"
          subtitle="Accepted formats: .xlsx, .xls, .csv · Max file size: 25 MB"
          action={
            !uploadedFile && (
              <button type="button" onClick={handleLoadDemoFile} className="cc-btn cc-btn-tone tone-info">
                <Sparkles className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Load Authentic Sample Dataset</span>
                <span className="sm:hidden">Sample</span>
              </button>
            )
          }
        >
          {/* Hidden real file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={handleFileInputChange}
            className="hidden"
          />

          {!uploadedFile ? (
            <div
              role="button"
              tabIndex={0}
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
              className="cc-dropzone"
            >
              <span className="cc-accent-chip w-12 h-12 rounded-full flex items-center justify-center">
                <UploadCloud className="w-6 h-6" />
              </span>
              <div>
                <p className="cc-title text-xs font-bold">Click to browse or drag and drop your spreadsheet here</p>
                <p className="cc-muted text-[11px] mt-1">Supports Microsoft Excel (.xlsx, .xls) and Comma-Separated Values (.csv)</p>
              </div>
              <div className="cc-muted flex items-center gap-2 text-[10px] font-mono">
                <span>Standard UTF-8 Encoding</span>
                <span>·</span>
                <span>Header Row 1 Required</span>
              </div>
            </div>
          ) : (
            <div className="cc-callout tone-info !items-center justify-between flex-col sm:flex-row !gap-4 !p-4">
              <div className="flex items-center gap-3 min-w-0 self-start sm:self-auto">
                <span className="tone-good tone-chip w-10 h-10 rounded-lg flex items-center justify-center shrink-0">
                  <FileSpreadsheet className="w-5 h-5" />
                </span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h4 className="cc-title text-xs font-bold font-mono break-all">{uploadedFile.name}</h4>
                    {isDemoFile && <Chip tone="info" className="rounded uppercase tracking-wider !text-[9px]">Demo File</Chip>}
                  </div>
                  <div className="cc-muted flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] mt-0.5">
                    <span>Size: <strong className="cc-text">{uploadedFile.size}</strong></span>
                    <span>Rows Detected: <strong className="cc-title">{uploadedFile.rowsCount} records</strong></span>
                    <span>Uploaded: <strong className="cc-text">Just now</strong></span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <button type="button" onClick={handleResetForNewBatch} className="cc-btn cc-btn-secondary">
                  <X className="w-3.5 h-3.5" />
                  <span>Replace File</span>
                </button>
                {!validationDone && (
                  <button type="button" onClick={handleRunValidation} disabled={isValidating} className="cc-btn cc-btn-primary">
                    {isValidating ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Validating ({validationProgress}%)...</span>
                      </>
                    ) : (
                      <>
                        <FileCheck className="w-3.5 h-3.5" />
                        <span>Run File Validation</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          )}

          {isValidating && (
            <div className="space-y-1.5 pt-3">
              <ProgressBar value={validationProgress} tone="info" label="File validation progress" />
              <div className="cc-muted flex justify-between text-[11px]">
                <span>Checking schema headers, mandatory keys, and data types...</span>
                <span className="font-mono">{validationProgress}%</span>
              </div>
            </div>
          )}
        </SectionCard>

        {/* STEP 6 & 7: Validation results + confirm */}
        {validationDone && (
          <SectionCard
            step={6}
            title="Pre-Flight Validation Results"
            subtitle="Review validation summary, schema adherence, and row-level issues before ingestion"
            action={
              criticalCount > 0 && (
                <button type="button" onClick={handleDownloadErrorReport} className="cc-btn cc-btn-tone tone-bad">
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Download Error Report (CSV)</span>
                  <span className="sm:hidden">Errors</span>
                </button>
              )
            }
            className="animate-in fade-in duration-300"
          >
            <div className="space-y-5">
              <div className="cc-grid grid-cols-2 xl:grid-cols-4">
                <KpiCard label="Total Scanned" value={`${totalRowsCount} Rows`} detail="In uploaded sheet" icon={Layers} tone="info" />
                <KpiCard label="Valid Rows" value={`${validRowsCount} Rows`} detail="Ready for instant ingestion" icon={CheckCircle2} tone="good" />
                <KpiCard label="Critical Errors" value={`${criticalCount} Rows`} detail="Violates mandatory constraints" icon={XCircle} tone="bad" />
                <KpiCard label="Warnings" value={`${warningCount} Rows`} detail="Non-fatal advisories" icon={AlertTriangle} tone="warn" />
              </div>

              {errorsList.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="cc-title text-xs font-bold uppercase tracking-wider">Row-Level Error & Diagnostics Table</h3>
                      <Chip tone="bad" className="rounded-full font-mono">{errorsList.length} Issues Found</Chip>
                    </div>
                    <CategoryTabs
                      value={errorSeverityFilter}
                      onChange={(v) => setErrorSeverityFilter(v as 'All' | 'Critical' | 'Warning')}
                      tabs={[
                        { value: 'All', label: 'All', count: errorsList.length },
                        { value: 'Critical', label: 'Critical', count: criticalCount },
                        { value: 'Warning', label: 'Warnings', count: warningCount },
                      ]}
                    />
                  </div>

                  <div className="cc-table-wrap max-h-96">
                    <table className="cc-table">
                      <thead>
                        <tr>
                          <th>Row</th>
                          <th>Record Identifier</th>
                          <th>Column / Field</th>
                          <th>Value Found</th>
                          <th>Severity</th>
                          <th>Validation Reason & Suggested Fix</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredErrors.map((err, i) => (
                          <tr key={i}>
                            <td className="cc-title font-mono font-bold">#{err.row}</td>
                            <td className="cc-title font-medium">{err.identifier}</td>
                            <td className="cc-muted font-mono text-[11px]">{err.field}</td>
                            <td className="tone-bad tone-text font-mono text-[11px] max-w-[120px] truncate" title={err.value}>{err.value}</td>
                            <td>
                              {err.severity === 'Critical' ? (
                                <Chip tone="bad" className="gap-1 rounded-full"><XCircle className="w-3 h-3" />Critical</Chip>
                              ) : (
                                <Chip tone="warn" className="gap-1 rounded-full"><AlertTriangle className="w-3 h-3" />Warning</Chip>
                              )}
                            </td>
                            <td className="min-w-[240px]">
                              <p className="cc-title font-medium">{err.reason}</p>
                              <p className="cc-accent text-[10px] mt-0.5">↳ Fix: {err.suggestedFix}</p>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="cc-callout tone-warn !items-center justify-between flex-col sm:flex-row !gap-2">
                    <label className="flex items-center gap-2 cursor-pointer font-medium">
                      <input
                        type="checkbox"
                        checked={skipInvalidRows}
                        onChange={(e) => setSkipInvalidRows(e.target.checked)}
                        className="w-4 h-4 rounded cursor-pointer accent-[color:var(--cc-accent)]"
                      />
                      <span>
                        Skip the {criticalCount} faulty row(s) and proceed with importing the <strong>{validRowsCount} valid rows</strong>
                      </span>
                    </label>
                    <span className="cc-muted text-[11px]">Recommended enterprise practice</span>
                  </div>
                </div>
              ) : (
                <div className="cc-callout tone-good !items-center !p-4">
                  <CheckCircle2 className="tone-text w-5 h-5 shrink-0" />
                  <div>
                    <p className="cc-title font-bold">Perfect Pre-Flight Check: All {totalRowsCount} rows are 100% valid!</p>
                    <p className="cc-muted text-[11px] mt-0.5">No schema violations, missing mandatory fields, or duplicate keys were detected.</p>
                  </div>
                </div>
              )}

              {/* STEP 7: confirm import */}
              {!importCompleted && (
                <div className="pt-4 border-t border-[color:var(--cc-divider)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="cc-muted text-xs">
                    <span>Scope: <strong className="cc-title">{scopeLabel}</strong></span>
                    <span className="mx-2">·</span>
                    <span>Ready to Ingest: <strong className="tone-good tone-text font-bold">{ingestCount} records</strong></span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button type="button" onClick={handleResetForNewBatch} className="cc-btn cc-btn-secondary">
                      Cancel & Re-upload
                    </button>
                    <button type="button" onClick={handleExecuteImport} disabled={isExecutingImport} className="cc-btn cc-btn-primary">
                      {isExecutingImport ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Ingesting Database Records...</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Confirm & Ingest {ingestCount} Records</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </SectionCard>
        )}

        {/* STEP 8: import complete */}
        {importCompleted && (
          <div className="cc-callout tone-good !p-5 flex-col sm:flex-row justify-between !gap-4 animate-in fade-in duration-300">
            <div className="flex items-start gap-3">
              <span className="tone-fill text-white w-11 h-11 rounded-xl flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6" />
              </span>
              <div>
                <h3 className="cc-title text-base font-bold">Batch Successfully Ingested!</h3>
                <p className="cc-text text-xs mt-1 max-w-2xl leading-relaxed">
                  {ingestCount} records have been committed to the <strong>{importType.name}</strong> master for <strong>{scopeLabel}</strong>. Data is now live and reflected across associated operations.
                </p>
                <div className="cc-muted flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-mono mt-2">
                  <span>Batch ID: <strong className="cc-title">BATCH-{Date.now().toString().slice(-4)}</strong></span>
                  <span>Execution Time: <strong className="cc-title">1.2s</strong></span>
                  <span>Status: <strong className="tone-text">Committed</strong></span>
                </div>
              </div>
            </div>
            <button type="button" onClick={handleResetForNewBatch} className="cc-btn cc-btn-secondary shrink-0">
              Upload Another Batch
            </button>
          </div>
        )}

        {/* Import history for this workflow */}
        <SectionCard
          title={`Import History & Audit Trail: ${importType.shortName}`}
          subtitle="Historical batch ingestion logs, inserted counts, and downloadable error diagnostics"
          action={<span className="cc-muted text-[11px] font-mono whitespace-nowrap">{typeSpecificLogs.length} Total Batches Recorded</span>}
        >
          {typeSpecificLogs.length > 0 ? (
            <div className="cc-table-wrap">
              <table className="cc-table">
                <thead>
                  <tr>
                    <th>Batch ID</th>
                    <th>File Name</th>
                    <th>Client / Scope</th>
                    <th>Uploaded By</th>
                    <th>Uploaded On</th>
                    <th className="text-right">Total Rows</th>
                    <th className="text-right">Inserted</th>
                    <th className="text-right">Failed</th>
                    <th>Status</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {typeSpecificLogs.map((log) => (
                    <tr key={log.id}>
                      <td className="cc-title font-mono font-medium whitespace-nowrap">{log.id}</td>
                      <td className="font-mono text-[11px] max-w-[200px] truncate" title={log.fileName}>{log.fileName}</td>
                      <td className="whitespace-nowrap">{log.clientOrEntity}</td>
                      <td className="whitespace-nowrap">{log.uploadedBy}</td>
                      <td className="cc-muted text-[11px] whitespace-nowrap">{log.uploadedOn}</td>
                      <td className="cc-title text-right font-mono font-semibold">{log.totalRows}</td>
                      <td className="tone-good tone-text text-right font-mono font-semibold">{log.insertedRows}</td>
                      <td className={`text-right font-mono ${log.failedRows > 0 ? 'tone-bad tone-text font-bold' : 'cc-muted'}`}>{log.failedRows}</td>
                      <td><ImportStatusChip status={log.status} /></td>
                      <td className="text-right whitespace-nowrap">
                        {log.failedRows > 0 ? (
                          <button
                            type="button"
                            onClick={handleDownloadErrorReport}
                            className="tone-bad tone-text px-2.5 py-1 text-xs font-semibold rounded-md inline-flex items-center gap-1 hover:underline"
                          >
                            <Download className="w-3 h-3" />
                            <span>Error Log</span>
                          </button>
                        ) : (
                          <span className="cc-muted text-[11px] font-mono">No Errors</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-6 text-center text-xs">
              <p className="cc-title font-semibold">No import batches recorded yet for {importType.shortName}</p>
              <p className="cc-muted text-[11px] mt-1">Upload a file above to create the initial batch record.</p>
            </div>
          )}
        </SectionCard>
      </PageBody>
    </div>
  );
};
