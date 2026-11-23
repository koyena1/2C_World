import type { Candidate, KycRecord } from '../types/onboarding';
import { DASHBOARD_REFERENCE_DATE } from '../modules/dashboard/dashboard.metrics';

export type KycDocType = KycRecord['documentType'];
export type KycBucket = 'Verified' | 'Pending' | 'Failed' | 'Skipped';

export const KYC_DOC_TYPES: KycDocType[] = ['Aadhaar', 'PAN', 'Bank', 'UAN'];
export const KYC_BUCKETS: KycBucket[] = ['Verified', 'Pending', 'Failed', 'Skipped'];

/** One KYC check of one candidate, flattened for dashboards and reports. */
export interface KycFlatRow {
  key: string;
  candidateId: string;
  userId: string;
  candidateName: string;
  clientName: string;
  department: string;
  docType: KycDocType;
  docNumber: string;
  rawStatus: string;
  bucket: KycBucket;
  matchPercentage: number;
  verifiedBy: string;
  lastUpdated: string; // YYYY-MM-DD
  ageDays: number;
  pennyStatus: string;
  overallKyc: string;
  remarks: string;
  hasDocument: boolean;
  hasNameInApi: boolean;
}

const DAY_MS = 86_400_000;

export const daysBetween = (fromIso: string, toIso: string): number =>
  Math.round((Date.parse(`${toIso}T00:00:00Z`) - Date.parse(`${fromIso}T00:00:00Z`)) / DAY_MS);

const toIsoDate = (raw: string | undefined, fallback: string): string => {
  const m = raw?.match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : fallback;
};

const maskNumber = (n: string): string => (n.length <= 4 ? n : `${'X'.repeat(Math.max(0, n.length - 4))}${n.slice(-4)}`);

const bucketOf = (r: KycRecord, penny: string): KycBucket => {
  if (r.status === 'Verified') return 'Verified';
  if (r.status === 'Skipped') return 'Skipped';
  if (r.status === 'API Mismatch' || r.status === 'Rejected' || (r.documentType === 'Bank' && penny === 'Failed')) return 'Failed';
  return 'Pending';
};

export const flattenKyc = (candidates: Candidate[]): KycFlatRow[] =>
  candidates.flatMap((c) =>
    (c.kycRecords ?? []).map((r) => {
      const lastUpdated = toIsoDate(r.lastUpdated, toIsoDate(c.registrationDate, DASHBOARD_REFERENCE_DATE));
      return {
        key: `${c.id}-${r.id}`,
        candidateId: c.id,
        userId: c.userId,
        candidateName: `${c.firstName} ${c.lastName}`.trim(),
        clientName: c.clientName,
        department: c.department || 'General Operations',
        docType: r.documentType,
        docNumber: r.documentNumber ? maskNumber(r.documentNumber) : '',
        rawStatus: r.status,
        bucket: bucketOf(r, c.pennyTestStatus),
        matchPercentage: r.matchPercentage ?? 0,
        verifiedBy: r.verifiedBy ?? '',
        lastUpdated,
        ageDays: Math.max(0, daysBetween(lastUpdated, DASHBOARD_REFERENCE_DATE)),
        pennyStatus: c.pennyTestStatus,
        overallKyc: c.overallKycStatus,
        remarks: r.remarks ?? '',
        hasDocument: Boolean(r.documentFileName || r.documentUrl) && r.documentAvailability !== 'Missing Document',
        hasNameInApi: Boolean(r.nameInApi),
      };
    })
  );

export const AGING_BUCKETS: { key: string; label: string; min: number; max: number }[] = [
  { key: 'a', label: '0-3 days', min: 0, max: 3 },
  { key: 'b', label: '4-7 days', min: 4, max: 7 },
  { key: 'c', label: '8-14 days', min: 8, max: 14 },
  { key: 'd', label: '15+ days', min: 15, max: Infinity },
];

export const agingLabel = (days: number): string => AGING_BUCKETS.find((b) => days >= b.min && days <= b.max)?.label ?? '';

/* ------------------------------------------------------------------ */
/* Report module definitions                                           */
/* ------------------------------------------------------------------ */

export type ReportFormatId = 'summary' | 'client' | 'candidate' | 'exceptions' | 'aging';
export type ReportKind = 'aggregate' | 'detail';

export interface ReportFormatDef {
  id: ReportFormatId;
  label: string;
  description: string;
  kind: ReportKind;
}

export const REPORT_FORMATS: ReportFormatDef[] = [
  { id: 'summary', label: 'Summary', description: 'Totals per document type (Aadhaar, PAN, Bank, UAN).', kind: 'aggregate' },
  { id: 'client', label: 'Client-wise', description: 'Totals and verification rate per client.', kind: 'aggregate' },
  { id: 'candidate', label: 'Candidate-level detail', description: 'One row per candidate and document check.', kind: 'detail' },
  { id: 'exceptions', label: 'Exceptions / failed checks', description: 'Only failed, mismatched or rejected checks.', kind: 'detail' },
  { id: 'aging', label: 'Pending aging', description: 'Pending checks with days waiting and aging bucket.', kind: 'detail' },
];

export interface ReportFieldDef {
  id: string;
  label: string;
}

export const DETAIL_FIELDS: ReportFieldDef[] = [
  { id: 'userId', label: 'Candidate ID' },
  { id: 'candidateName', label: 'Candidate Name' },
  { id: 'clientName', label: 'Client' },
  { id: 'department', label: 'Department' },
  { id: 'docType', label: 'Document Type' },
  { id: 'docNumber', label: 'Document Number (masked)' },
  { id: 'rawStatus', label: 'Verification Status' },
  { id: 'matchPercentage', label: 'Identity Match %' },
  { id: 'verifiedBy', label: 'Verified By' },
  { id: 'lastUpdated', label: 'Last Updated' },
  { id: 'ageDays', label: 'Age (days)' },
  { id: 'agingBucket', label: 'Aging Bucket' },
  { id: 'pennyStatus', label: 'Rs 1 Penny Status' },
  { id: 'overallKyc', label: 'Overall KYC' },
  { id: 'remarks', label: 'Remarks' },
];

export const AGGREGATE_FIELDS: ReportFieldDef[] = [
  { id: 'total', label: 'Total Checks' },
  { id: 'candidates', label: 'Candidates' },
  { id: 'verified', label: 'Verified' },
  { id: 'pending', label: 'Pending' },
  { id: 'failed', label: 'Failed' },
  { id: 'skipped', label: 'Skipped' },
  { id: 'rate', label: 'Verified %' },
  { id: 'avgAge', label: 'Avg Pending Age (days)' },
];

export const DEFAULT_FIELDS: Record<ReportKind, string[]> = {
  aggregate: ['total', 'verified', 'pending', 'failed', 'rate'],
  detail: ['userId', 'candidateName', 'clientName', 'docType', 'rawStatus', 'lastUpdated'],
};

export interface ReportConfig {
  format: ReportFormatId;
  fields: string[];
  client: string; // 'all' or name
  docType: string; // 'all' or doc type
  status: string; // 'all' or bucket
  from: string; // YYYY-MM-DD or ''
  to: string;
}

export const DEFAULT_REPORT_CONFIG: ReportConfig = {
  format: 'summary',
  fields: DEFAULT_FIELDS.aggregate,
  client: 'all',
  docType: 'all',
  status: 'all',
  from: '',
  to: '',
};

export interface SavedReportFormat {
  id: string;
  name: string;
  savedBy: string;
  savedAt: string;
  config: ReportConfig;
}

export const SEED_SAVED_REPORT_FORMATS: SavedReportFormat[] = [
  {
    id: 'SRF-1',
    name: 'Weekly exceptions for Ops',
    savedBy: 'Ananya (Ops Lead)',
    savedAt: '2026-09-28',
    config: {
      format: 'exceptions',
      fields: ['userId', 'candidateName', 'clientName', 'docType', 'rawStatus', 'remarks', 'lastUpdated'],
      client: 'all',
      docType: 'all',
      status: 'all',
      from: '',
      to: '',
    },
  },
  {
    id: 'SRF-2',
    name: 'Client-wise KYC scorecard',
    savedBy: 'Vikram (Client HR)',
    savedAt: '2026-09-30',
    config: {
      format: 'client',
      fields: ['candidates', 'total', 'verified', 'pending', 'failed', 'rate'],
      client: 'all',
      docType: 'all',
      status: 'all',
      from: '',
      to: '',
    },
  },
];

/** KYC data-field catalogue used by the dashboard completeness table. */
export const KYC_DATA_FIELDS: { id: string; label: string; source: string; test: (r: KycFlatRow) => boolean }[] = [
  { id: 'docNumber', label: 'Document number', source: 'Candidate / OCR', test: (r) => Boolean(r.docNumber) },
  { id: 'nameApi', label: 'Name returned by authority API', source: 'UIDAI / NSDL / NPCI / EPFO', test: (r) => r.hasNameInApi },
  { id: 'match', label: 'Identity match score', source: 'Matching engine', test: (r) => r.matchPercentage > 0 },
  { id: 'file', label: 'Supporting document uploaded', source: 'Candidate upload', test: (r) => r.hasDocument },
  { id: 'verifier', label: 'Verified by', source: 'Ops desk / system', test: (r) => Boolean(r.verifiedBy) },
  { id: 'remarks', label: 'Remarks / rejection reason', source: 'Ops desk', test: (r) => Boolean(r.remarks) },
];
