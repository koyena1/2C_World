import { DASHBOARD_REFERENCE_DATE } from '../modules/dashboard/dashboard.metrics';

export const EXIT_TYPES = ['Resignation', 'Termination', 'Contract end', 'Absconded', 'Offer Not Rolled Out'] as const;
export type ExitType = (typeof EXIT_TYPES)[number];

export const EXIT_STATUSES = ['Initiated', 'Notice period', 'Clearance', 'F&F', 'Closed'] as const;
export type ExitStatus = (typeof EXIT_STATUSES)[number];

/** Transfer module is not built yet: this field models the dependency (blocks F&F until cleared). */
export const TRANSFER_STATES = ['Not applicable', 'Pending transfer closure', 'Cleared'] as const;
export type TransferClearance = (typeof TRANSFER_STATES)[number];

export interface ExitCase {
  id: string;
  empCode: string;
  employee: string;
  client: string;
  designation: string;
  exitType: ExitType;
  /** ISO date */
  noticeDate: string;
  /** ISO date; null while not entered (optional for Offer Not Rolled Out). */
  lwd: string | null;
  status: ExitStatus;
  transfer: TransferClearance;
  reason: string;
  owner: string;
}

export const EXIT_TODAY = DASHBOARD_REFERENCE_DATE;

export const addDays = (iso: string, days: number): string => {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
};

export const formatExitDate = (iso: string | null): string =>
  iso ? new Date(`${iso}T00:00:00Z`).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }) : '—';

const c = (
  n: number,
  employee: string,
  client: string,
  designation: string,
  exitType: ExitType,
  noticeDate: string,
  lwd: string | null,
  status: ExitStatus,
  transfer: TransferClearance,
  reason: string
): ExitCase => ({
  id: `EX-${1000 + n}`,
  empCode: `EMP-${20410 + n}`,
  employee,
  client,
  designation,
  exitType,
  noticeDate,
  lwd,
  status,
  transfer,
  reason,
  owner: n % 2 ? 'Sunita Rao' : 'Manoj Kulkarni',
});

export const EXIT_CASES: ExitCase[] = [
  c(1, 'Rahul Verma', 'Tata Consultancy Services', 'Software Engineer', 'Resignation', '2026-08-20', '2026-10-19', 'Notice period', 'Not applicable', 'Higher studies'),
  c(2, 'Sneha Kulkarni', 'Infosys Technologies', 'Business Analyst', 'Resignation', '2026-07-25', '2026-09-24', 'Clearance', 'Pending transfer closure', 'Better opportunity'),
  c(3, 'Imran Sheikh', 'HDFC Bank Ltd', 'Relationship Executive', 'Termination', '2026-09-10', '2026-09-30', 'Clearance', 'Cleared', 'Performance'),
  c(4, 'Pooja Nair', 'Flipkart Internet Pvt Ltd', 'Operations Associate', 'Contract end', '2026-09-01', '2026-10-31', 'Notice period', 'Not applicable', 'Contract term completed'),
  c(5, 'Karthik Subramanian', 'Larsen & Toubro Ltd', 'Site Coordinator', 'Absconded', '2026-09-05', '2026-09-04', 'Initiated', 'Pending transfer closure', 'Not reachable since 04 Sep'),
  c(6, 'Divya Menon', 'Wipro Digital', 'QA Engineer', 'Resignation', '2026-06-15', '2026-08-14', 'F&F', 'Cleared', 'Relocation'),
  c(7, 'Amit Joshi', 'Reliance Retail Ltd', 'Store Supervisor', 'Resignation', '2026-05-10', '2026-07-09', 'Closed', 'Not applicable', 'Personal reasons'),
  c(8, 'Neha Gupta', 'Tata Consultancy Services', 'Associate Consultant', 'Offer Not Rolled Out', '2026-09-28', null, 'Initiated', 'Not applicable', 'Client withdrew requirement'),
  c(9, 'Vikram Singh', 'Infosys Technologies', 'Support Engineer', 'Contract end', '2026-08-01', '2026-09-30', 'F&F', 'Cleared', 'Project completed'),
  c(10, 'Ananya Iyer', 'HDFC Bank Ltd', 'Credit Analyst', 'Resignation', '2026-09-29', '2026-11-28', 'Initiated', 'Pending transfer closure', 'Better opportunity'),
  c(11, 'Suresh Patil', 'Flipkart Internet Pvt Ltd', 'Warehouse Lead', 'Termination', '2026-08-14', '2026-08-31', 'Closed', 'Not applicable', 'Policy violation'),
  c(12, 'Meera Reddy', 'Larsen & Toubro Ltd', 'Project Engineer', 'Resignation', '2026-09-15', '2026-11-14', 'Notice period', 'Pending transfer closure', 'Family reasons'),
  c(13, 'Rohit Malhotra', 'Wipro Digital', 'Developer', 'Offer Not Rolled Out', '2026-09-20', null, 'Closed', 'Not applicable', 'Candidate not onboarded'),
];

/* ---------------- Exit documents ---------------- */

export interface ExitDocType {
  id: string;
  label: string;
}

export const EXIT_DOC_TYPES: ExitDocType[] = [
  { id: 'resignation-letter', label: 'Resignation letter' },
  { id: 'acceptance', label: 'Resignation acceptance' },
  { id: 'relieving-letter', label: 'Relieving letter' },
  { id: 'experience-letter', label: 'Experience letter' },
  { id: 'ff-statement', label: 'F&F statement' },
  { id: 'no-dues', label: 'No-dues certificate' },
  { id: 'asset-return', label: 'ID / asset return' },
];

const REQUIRED: Record<ExitType, string[]> = {
  Resignation: EXIT_DOC_TYPES.map((d) => d.id),
  Termination: ['relieving-letter', 'experience-letter', 'ff-statement', 'no-dues', 'asset-return'],
  'Contract end': ['relieving-letter', 'experience-letter', 'ff-statement', 'no-dues', 'asset-return'],
  Absconded: ['ff-statement', 'no-dues', 'asset-return'],
  'Offer Not Rolled Out': [],
};

export const requiredDocIds = (t: ExitType): string[] => REQUIRED[t];

export interface ExitDocEntry {
  fileName: string;
  sizeKb: number;
  by: string;
  /** ISO timestamp */
  at: string;
  version: number;
}

/** caseId -> docTypeId -> entry (absent = pending). */
export type ExitDocMap = Record<string, Record<string, ExitDocEntry>>;

const seedSubmitted: Record<string, string[]> = {
  'EX-1001': ['resignation-letter', 'acceptance'],
  'EX-1002': ['resignation-letter', 'acceptance', 'no-dues'],
  'EX-1003': ['relieving-letter', 'no-dues'],
  'EX-1004': ['asset-return'],
  'EX-1005': [],
  'EX-1006': ['resignation-letter', 'acceptance', 'relieving-letter', 'experience-letter', 'ff-statement', 'no-dues'],
  'EX-1007': EXIT_DOC_TYPES.map((d) => d.id),
  'EX-1009': ['relieving-letter', 'experience-letter', 'no-dues', 'asset-return'],
  'EX-1010': ['resignation-letter'],
  'EX-1011': ['relieving-letter', 'experience-letter', 'ff-statement', 'no-dues', 'asset-return'],
  'EX-1012': ['resignation-letter', 'acceptance'],
};

export const buildSeedExitDocs = (): ExitDocMap => {
  const out: ExitDocMap = {};
  EXIT_CASES.forEach((ec, ci) => {
    const row: Record<string, ExitDocEntry> = {};
    (seedSubmitted[ec.id] ?? []).forEach((docId, di) => {
      row[docId] = {
        fileName: `${ec.employee.replace(/\s+/g, '_')}_${docId}.pdf`,
        sizeKb: 220 + ((ci * 7 + di * 13) % 17) * 90,
        by: ec.owner,
        at: `${addDays(ec.noticeDate, 2 + di)}T10:${String(10 + di * 4).padStart(2, '0')}:00.000Z`,
        version: 1,
      };
    });
    out[ec.id] = row;
  });
  return out;
};

export const pendingDocIds = (exitType: ExitType, docs: Record<string, ExitDocEntry> | undefined): string[] =>
  requiredDocIds(exitType).filter((id) => !docs?.[id]);

/** Exit cases with at least one required document still pending (initial mock state). */
export const pendingExitDocumentCount = (): number => {
  const docs = buildSeedExitDocs();
  return EXIT_CASES.filter((ec) => pendingDocIds(ec.exitType, docs[ec.id]).length > 0).length;
};

/* ---------------- Offer Not Rolled Out eligibility ---------------- */

export interface EligibilityRule {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
  /** True for the condition that used to be mandatory and is now optional. */
  formerlyMandatory?: boolean;
}

export const ELIGIBILITY_RULES: EligibilityRule[] = [
  {
    id: 'joining-formalities',
    label: 'Joining formalities completed / LWD already entered',
    description: 'Previously mandatory before an employee could be marked Offer Not Rolled Out. Now optional (off by default).',
    enabled: false,
    formerlyMandatory: true,
  },
  { id: 'offer-not-released', label: 'Offer letter not yet released', description: 'Blocks employees whose offer letter has already been released to them.', enabled: true },
  { id: 'no-payroll', label: 'No payroll run processed', description: 'Blocks employees for whom any payroll cycle has already been processed.', enabled: true },
  { id: 'not-reported', label: 'Has not reported to work', description: 'Blocks employees with attendance marked at the client site.', enabled: true },
  { id: 'reason-required', label: 'Reason must be recorded', description: 'A reason is required so the audit trail explains why the offer was not rolled out.', enabled: true },
];

export interface OnroCandidate {
  id: string;
  name: string;
  client: string;
  designation: string;
  offerReleased: boolean;
  payrollRun: boolean;
  reported: boolean;
  formalitiesDone: boolean;
}

export const ONRO_POOL: OnroCandidate[] = [
  { id: 'PJ-3101', name: 'Aarav Mehta', client: 'Tata Consultancy Services', designation: 'Systems Engineer', offerReleased: false, payrollRun: false, reported: false, formalitiesDone: false },
  { id: 'PJ-3102', name: 'Ishita Bansal', client: 'Infosys Technologies', designation: 'Analyst', offerReleased: true, payrollRun: false, reported: false, formalitiesDone: false },
  { id: 'PJ-3103', name: 'Rajesh Pillai', client: 'HDFC Bank Ltd', designation: 'Branch Executive', offerReleased: false, payrollRun: true, reported: true, formalitiesDone: true },
  { id: 'PJ-3104', name: 'Tanvi Deshmukh', client: 'Flipkart Internet Pvt Ltd', designation: 'Category Associate', offerReleased: false, payrollRun: false, reported: true, formalitiesDone: false },
  { id: 'PJ-3105', name: 'Farhan Qureshi', client: 'Larsen & Toubro Ltd', designation: 'Graduate Engineer Trainee', offerReleased: false, payrollRun: false, reported: false, formalitiesDone: true },
  { id: 'PJ-3106', name: 'Kavya Rao', client: 'Wipro Digital', designation: 'UI Developer', offerReleased: false, payrollRun: false, reported: false, formalitiesDone: false },
];

/** Plain-language reasons why a candidate is blocked under the currently enabled rules (empty = eligible). */
export const evaluateEligibility = (cand: OnroCandidate, rules: EligibilityRule[], reason: string): string[] => {
  const on = (id: string) => rules.find((r) => r.id === id)?.enabled;
  const out: string[] = [];
  if (on('joining-formalities') && !cand.formalitiesDone) out.push('Joining formalities are not completed yet, and this rule is switched on.');
  if (on('offer-not-released') && cand.offerReleased) out.push('The offer letter has already been released to this candidate.');
  if (on('no-payroll') && cand.payrollRun) out.push('A payroll run has already been processed for this employee.');
  if (on('not-reported') && cand.reported) out.push('The employee has already reported to work (attendance exists).');
  if (on('reason-required') && reason.trim().length < 5) out.push('Please record a reason (at least 5 characters).');
  return out;
};

/* ---------------- Bulk upload simulations ---------------- */

export interface LwdUploadRow {
  empCode: string;
  lwd: string;
}

/** What the simulated parser "reads" from an uploaded LWD file. */
export const SIMULATED_LWD_ROWS: LwdUploadRow[] = [
  { empCode: 'EMP-20411', lwd: '2026-10-24' },
  { empCode: 'EMP-20412', lwd: '2026-09-26' },
  { empCode: 'EMP-20420', lwd: '2026-11-30' },
  { empCode: 'EMP-99999', lwd: '2026-10-30' },
  { empCode: 'EMP-20414', lwd: '31/13/2026' },
  { empCode: 'EMP-20417', lwd: '2026-10-15' },
  { empCode: 'EMP-20418', lwd: '2026-10-10' },
  { empCode: 'EMP-20419', lwd: '2026-07-01' },
];

export interface DocUploadRow {
  empCode: string;
  docTypeId: string;
  fileName: string;
  sizeMb: number;
}

export const SIMULATED_DOC_ROWS: DocUploadRow[] = [
  { empCode: 'EMP-20411', docTypeId: 'resignation-letter', fileName: 'Rahul_Verma_Resignation_v2.pdf', sizeMb: 0.8 },
  { empCode: 'EMP-20412', docTypeId: 'relieving-letter', fileName: 'Sneha_Kulkarni_Relieving.pdf', sizeMb: 1.1 },
  { empCode: 'EMP-20413', docTypeId: 'no-dues', fileName: 'Imran_Sheikh_NoDues.pdf', sizeMb: 0.4 },
  { empCode: 'EMP-20420', docTypeId: 'resignation-letter', fileName: 'Ananya_Iyer_Resignation_scan.pdf', sizeMb: 6.2 },
  { empCode: 'EMP-99999', docTypeId: 'ff-statement', fileName: 'Unknown_FF.pdf', sizeMb: 0.5 },
  { empCode: 'EMP-20414', docTypeId: 'ff-statement', fileName: 'Pooja_Nair_FF.docx', sizeMb: 0.3 },
  { empCode: 'EMP-20418', docTypeId: 'relieving-letter', fileName: 'Neha_Gupta_Relieving.pdf', sizeMb: 0.6 },
  { empCode: 'EMP-20416', docTypeId: 'asset-return', fileName: 'Divya_Menon_AssetReturn.pdf', sizeMb: 0.9 },
];

/* ---------------- Seed history ---------------- */

export interface ExitHistoryRow {
  id: string;
  caseId: string;
  action: string;
  actorName: string;
  at: string;
}

export const SEED_EXIT_HISTORY: ExitHistoryRow[] = [
  { id: 'H-1', caseId: 'EX-1006', action: 'Moved to F&F (transfer clearance: Cleared)', actorName: 'Sunita Rao', at: '2026-09-30T11:20:00.000Z' },
  { id: 'H-2', caseId: 'EX-1009', action: 'Moved to F&F (transfer clearance: Cleared)', actorName: 'Manoj Kulkarni', at: '2026-10-01T09:05:00.000Z' },
  { id: 'H-3', caseId: 'EX-1003', action: 'Transfer clearance set to Cleared', actorName: 'Sunita Rao', at: '2026-10-02T15:40:00.000Z' },
  { id: 'H-4', caseId: 'EX-1010', action: 'Exit initiated (Resignation)', actorName: 'Manoj Kulkarni', at: '2026-09-29T10:10:00.000Z' },
  { id: 'H-5', caseId: 'EX-1013', action: 'Marked Offer Not Rolled Out and closed', actorName: 'Sunita Rao', at: '2026-09-22T12:30:00.000Z' },
];
