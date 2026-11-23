/** Mock data + pure logic for Compliance -> ESIC Validation (frontend simulation only). */

export type EsicRowErrorKind = 'duplicate' | 'format' | 'missing';

export interface EsicUploadRow {
  id: string;
  /** Row number in the uploaded sheet (header = row 1). */
  rowNo: number;
  employeeName: string;
  client: string;
  esicNumber: string;
  grossWage: number;
}

export interface EsicRowResult {
  kind: EsicRowErrorKind;
  /** Plain-language message shown to the user. */
  message: string;
}

/** ESIC numbers that already exist in the system, and who they belong to. */
export const ESIC_REGISTRY: Record<string, { name: string; client: string }> = {
  '2100456789': { name: 'Rahul Verma', client: 'Infosys Technologies' },
  '3100987654': { name: 'Sunita Rao', client: 'Tata Consultancy Services' },
  '4100234567': { name: 'Mohammed Irfan', client: 'Flipkart Internet Pvt Ltd' },
  '5100765432': { name: 'Deepa Nair', client: 'HDFC Bank Ltd' },
  '6100112233': { name: 'Karthik Subramanian', client: 'Wipro Digital' },
  '7100445566': { name: 'Anjali Deshmukh', client: 'Larsen & Toubro Ltd' },
  '8100778899': { name: 'Vikram Chauhan', client: 'Reliance Retail Ltd' },
};

export const INITIAL_ESIC_FILE_NAME = 'ESIC_Bulk_Upload_Oct2026.xlsx';

export const INITIAL_ESIC_BATCH: EsicUploadRow[] = [
  { id: 'r2', rowNo: 2, employeeName: 'Aarav Mehta', client: 'Tata Consultancy Services', esicNumber: '1200345671', grossWage: 18500 },
  { id: 'r3', rowNo: 3, employeeName: 'Priya Iyer', client: 'Infosys Technologies', esicNumber: '2100456789', grossWage: 19200 },
  { id: 'r4', rowNo: 4, employeeName: 'Rohit Sharma', client: 'Flipkart Internet Pvt Ltd', esicNumber: '1200345672', grossWage: 17800 },
  { id: 'r5', rowNo: 5, employeeName: 'Neha Kulkarni', client: 'HDFC Bank Ltd', esicNumber: '1200345673', grossWage: 20100 },
  { id: 'r6', rowNo: 6, employeeName: 'Sandeep Yadav', client: 'Larsen & Toubro Ltd', esicNumber: '1200345674', grossWage: 16400 },
  { id: 'r7', rowNo: 7, employeeName: 'Meera Pillai', client: 'Wipro Digital', esicNumber: '1200345674', grossWage: 18000 },
  { id: 'r8', rowNo: 8, employeeName: 'Imran Qureshi', client: 'Reliance Retail Ltd', esicNumber: '12003456', grossWage: 15900 },
  { id: 'r9', rowNo: 9, employeeName: 'Divya Menon', client: 'Tata Consultancy Services', esicNumber: '5100765432', grossWage: 19800 },
  { id: 'r10', rowNo: 10, employeeName: 'Arjun Reddy', client: 'Infosys Technologies', esicNumber: '1200345677', grossWage: 17250 },
  { id: 'r11', rowNo: 11, employeeName: 'Kavita Joshi', client: 'Flipkart Internet Pvt Ltd', esicNumber: '1200345678', grossWage: 18900 },
  { id: 'r12', rowNo: 12, employeeName: 'Suresh Babu', client: 'HDFC Bank Ltd', esicNumber: '1200345679', grossWage: 20800 },
  { id: 'r13', rowNo: 13, employeeName: 'Lakshmi Narayanan', client: 'Larsen & Toubro Ltd', esicNumber: '', grossWage: 16800 },
];

const sameName = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

/** Validate one row against the existing registry and the other rows of the same upload. */
export const validateEsicRow = (row: EsicUploadRow, allRows: EsicUploadRow[]): EsicRowResult | null => {
  const number = row.esicNumber.trim();
  if (!number) {
    return {
      kind: 'missing',
      message: "ESIC number is missing. Enter the 10-digit number from the employee's ESIC card, or remove this row if the employee is not covered.",
    };
  }
  if (!/^\d{10}$/.test(number)) {
    return {
      kind: 'format',
      message: `"${number}" is not a valid ESIC number. It must be exactly 10 digits with no spaces or letters. Check the number on the employee's ESIC card and correct it.`,
    };
  }
  const existing = ESIC_REGISTRY[number];
  if (existing && !sameName(existing.name, row.employeeName)) {
    return {
      kind: 'duplicate',
      message: `ESIC number ${number} already belongs to ${existing.name} (${existing.client}). One person can have only one ESIC number. Remove the duplicate row or correct the number, then upload again.`,
    };
  }
  // The first row using a number is kept; later rows with the same number are the duplicates.
  const earlier = allRows.find((r) => r.id !== row.id && r.esicNumber.trim() === number && r.rowNo < row.rowNo && !sameName(r.employeeName, row.employeeName));
  if (earlier) {
    return {
      kind: 'duplicate',
      message: `ESIC number ${number} is used twice in this file: row ${earlier.rowNo} (${earlier.employeeName}) and row ${row.rowNo} (${row.employeeName}). One person can have only one ESIC number. Correct the number in one of the rows or remove the repeated row.`,
    };
  }
  return null;
};

export const validateEsicBatch = (rows: EsicUploadRow[]): Record<string, EsicRowResult | null> =>
  Object.fromEntries(rows.map((r) => [r.id, validateEsicRow(r, rows)]));

/** Unresolved duplicate-number errors in the initial mock validation batch (used for badges / summaries). */
export const esicDuplicateErrorCount = (): number =>
  Object.values(validateEsicBatch(INITIAL_ESIC_BATCH)).filter((r) => r?.kind === 'duplicate').length;

/** Parse a simple CSV (name, client, esic number, gross wage). Returns [] when nothing usable is found. */
export const parseEsicCsv = (text: string): EsicUploadRow[] => {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];
  const header = lines[0].split(',').map((h) => h.trim().toLowerCase());
  const idx = (re: RegExp) => header.findIndex((h) => re.test(h));
  const iName = idx(/name/);
  const iClient = idx(/client|company/);
  const iEsic = idx(/esic|ip number|insurance/);
  const iGross = idx(/gross|wage|salary/);
  if (iName < 0 || iEsic < 0) return [];
  return lines.slice(1).map((line, i) => {
    const cells = line.split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
    return {
      id: `u${i + 2}`,
      rowNo: i + 2,
      employeeName: cells[iName] ?? '',
      client: iClient >= 0 ? cells[iClient] ?? '' : '',
      esicNumber: cells[iEsic] ?? '',
      grossWage: iGross >= 0 ? Number(cells[iGross]?.replace(/[^\d.]/g, '')) || 0 : 0,
    };
  });
};

/* ------------------------------------------------------------------ Applicability rules */

export const ESIC_STATES = ['Maharashtra', 'Karnataka', 'Telangana', 'Tamil Nadu', 'Haryana', 'Kerala', 'West Bengal', 'Gujarat', 'Uttar Pradesh', 'Not-notified area'] as const;
export const ESIC_CONTRACT_TYPES = ['Permanent', 'Fixed-term', 'Contract (third-party payroll)', 'Apprentice', 'Intern / Trainee'] as const;

export interface EsicClientRule {
  client: string;
  /** Monthly gross wage ceiling in Rs. */
  wageCeiling: number;
  /** Higher ceiling for persons with disability. */
  pwdCeiling: number;
  /** States where ESIC applies for this client's people. */
  coveredStates: string[];
  /** Contract types that are covered. */
  contractTypes: string[];
  /** Exemption flags. */
  exemptApprentices: boolean;
  exemptInterns: boolean;
  /** Client already gives an equal or better insurance scheme and has an exemption letter. */
  ownSchemeExemption: boolean;
  note: string;
  updatedBy: string;
  updatedAt: string;
}

const ALL_STATES_NOTIFIED = ESIC_STATES.filter((s) => s !== 'Not-notified area') as unknown as string[];

export const INITIAL_ESIC_RULES: EsicClientRule[] = [
  { client: 'Tata Consultancy Services', wageCeiling: 21000, pwdCeiling: 25000, coveredStates: ALL_STATES_NOTIFIED, contractTypes: ['Permanent', 'Fixed-term', 'Contract (third-party payroll)'], exemptApprentices: true, exemptInterns: true, ownSchemeExemption: false, note: 'Standard statutory rule.', updatedBy: 'Super Admin', updatedAt: '2026-04-02' },
  { client: 'Infosys Technologies', wageCeiling: 21000, pwdCeiling: 25000, coveredStates: ['Karnataka', 'Maharashtra', 'Tamil Nadu', 'Telangana'], contractTypes: ['Permanent', 'Fixed-term', 'Contract (third-party payroll)'], exemptApprentices: true, exemptInterns: true, ownSchemeExemption: false, note: 'Only delivery centres in notified states are registered.', updatedBy: 'Super Admin', updatedAt: '2026-04-02' },
  { client: 'HDFC Bank Ltd', wageCeiling: 21000, pwdCeiling: 25000, coveredStates: ALL_STATES_NOTIFIED, contractTypes: ['Permanent', 'Fixed-term', 'Contract (third-party payroll)', 'Apprentice'], exemptApprentices: false, exemptInterns: true, ownSchemeExemption: false, note: 'Bank apprentices are enrolled by agreement with the client.', updatedBy: 'Priya Nair', updatedAt: '2026-06-18' },
  { client: 'Flipkart Internet Pvt Ltd', wageCeiling: 21000, pwdCeiling: 25000, coveredStates: ALL_STATES_NOTIFIED, contractTypes: ['Permanent', 'Fixed-term', 'Contract (third-party payroll)'], exemptApprentices: true, exemptInterns: true, ownSchemeExemption: false, note: 'Warehouse and last-mile staff included.', updatedBy: 'Super Admin', updatedAt: '2026-05-11' },
  { client: 'Larsen & Toubro Ltd', wageCeiling: 21000, pwdCeiling: 25000, coveredStates: ['Maharashtra', 'Gujarat', 'Tamil Nadu', 'Haryana'], contractTypes: ['Permanent', 'Fixed-term', 'Contract (third-party payroll)'], exemptApprentices: true, exemptInterns: true, ownSchemeExemption: true, note: 'Site staff covered under the client Workmen\'s Compensation scheme are exempt when the exemption letter is on file.', updatedBy: 'Super Admin', updatedAt: '2026-03-27' },
  { client: 'Wipro Digital', wageCeiling: 21000, pwdCeiling: 25000, coveredStates: ['Karnataka', 'Telangana', 'Maharashtra'], contractTypes: ['Permanent', 'Fixed-term'], exemptApprentices: true, exemptInterns: true, ownSchemeExemption: false, note: 'Third-party payroll staff are covered by the vendor, not by 2COMS.', updatedBy: 'Priya Nair', updatedAt: '2026-07-09' },
  { client: 'Reliance Retail Ltd', wageCeiling: 21000, pwdCeiling: 25000, coveredStates: ALL_STATES_NOTIFIED, contractTypes: ['Permanent', 'Fixed-term', 'Contract (third-party payroll)', 'Intern / Trainee'], exemptApprentices: true, exemptInterns: false, ownSchemeExemption: false, note: 'Store trainees are enrolled from day one.', updatedBy: 'Super Admin', updatedAt: '2026-08-21' },
];

export interface EsicRuleHistoryEntry {
  id: string;
  client: string;
  action: string;
  actorName: string;
  at: string;
}

export const SEED_ESIC_RULE_HISTORY: EsicRuleHistoryEntry[] = [
  { id: 'h1', client: 'Reliance Retail Ltd', action: 'Intern / Trainee added to covered contract types', actorName: 'Super Admin', at: '2026-08-21T10:14:00' },
  { id: 'h2', client: 'Wipro Digital', action: 'Third-party payroll removed from covered contract types', actorName: 'Priya Nair', at: '2026-07-09T15:42:00' },
  { id: 'h3', client: 'HDFC Bank Ltd', action: 'Apprentices no longer exempt', actorName: 'Priya Nair', at: '2026-06-18T11:05:00' },
];

export interface EsicCheckInput {
  client: string;
  grossWage: number;
  state: string;
  contractType: string;
  pwd: boolean;
}

export interface EsicCheckResult {
  applicable: boolean;
  reason: string;
  employeeContribution?: number;
  employerContribution?: number;
}

export const ESIC_EMPLOYEE_RATE = 0.0075;
export const ESIC_EMPLOYER_RATE = 0.0325;

/** Decide whether ESIC applies, in the order a payroll executive would check it. */
export const checkEsicApplicability = (rule: EsicClientRule, input: EsicCheckInput): EsicCheckResult => {
  const no = (reason: string): EsicCheckResult => ({ applicable: false, reason });
  if (rule.ownSchemeExemption && input.contractType === 'Contract (third-party payroll)') {
    return no(`${rule.client} covers these workers under its own Workmen's Compensation scheme and has an exemption letter on file, so ESIC is not deducted.`);
  }
  if (!rule.coveredStates.includes(input.state)) {
    return no(`${input.state} is not a covered location for ${rule.client}. ESIC is deducted only where the client's establishment is registered.`);
  }
  if (!rule.contractTypes.includes(input.contractType)) {
    return no(`${input.contractType} staff are not covered for ${rule.client}. Covered types are: ${rule.contractTypes.join(', ')}.`);
  }
  if (input.contractType === 'Apprentice' && rule.exemptApprentices) return no('Apprentices are exempt for this client.');
  if (input.contractType === 'Intern / Trainee' && rule.exemptInterns) return no('Interns and trainees are exempt for this client.');
  const ceiling = input.pwd ? rule.pwdCeiling : rule.wageCeiling;
  if (input.grossWage > ceiling) {
    return no(`Monthly gross wage Rs ${input.grossWage.toLocaleString('en-IN')} is above the Rs ${ceiling.toLocaleString('en-IN')} ceiling${input.pwd ? ' (person with disability)' : ''}. ESIC applies only up to the ceiling.`);
  }
  return {
    applicable: true,
    reason: `Gross wage Rs ${input.grossWage.toLocaleString('en-IN')} is within the Rs ${ceiling.toLocaleString('en-IN')} ceiling, ${input.state} is covered, and ${input.contractType} staff are covered for ${rule.client}.`,
    employeeContribution: Math.ceil(input.grossWage * ESIC_EMPLOYEE_RATE),
    employerContribution: Math.ceil(input.grossWage * ESIC_EMPLOYER_RATE),
  };
};
