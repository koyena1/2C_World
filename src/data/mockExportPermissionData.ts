import type { AppRole } from '../modules/hr-ops/hrOps.config';

/** Seeded "who changed it, when" history for Export Permissions (fixed timestamps; live edits are merged on top). */
export interface ExportPolicyChange {
  key: string; // 'role:hr' or 'user:usr-8'
  by: string;
  at: string; // ISO
  note: string;
}

export const SEED_EXPORT_POLICY_CHANGES: ExportPolicyChange[] = [
  { key: 'role:admin', by: 'Rajesh Sen', at: '2026-08-12T10:15:00+05:30', note: 'Full export granted to Admin' },
  { key: 'role:hr', by: 'Ananya Mukherjee', at: '2026-09-18T16:40:00+05:30', note: 'Sensitive KYC and compensation fields removed for HR' },
  { key: 'role:hrbp', by: 'Ananya Mukherjee', at: '2026-09-18T16:42:00+05:30', note: 'HRBP limited to personal, contact and employment fields' },
  { key: 'user:usr-8', by: 'Rajesh Sen', at: '2026-09-30T11:05:00+05:30', note: 'Payroll override: bank and compensation fields allowed' },
];

/** Default fields per role (ids from exportPolicyStore.EXPORT_FIELDS). */
export const DEFAULT_ROLE_EXPORT_FIELDS: Record<AppRole, string[]> = {
  admin: [
    'fullName', 'gender', 'dob', 'bloodGroup', 'maritalStatus', 'fatherName', 'qualification',
    'email', 'phone', 'whatsapp', 'currentAddress',
    'aadhaar', 'pan', 'uan', 'esic', 'bankName', 'accountNumber', 'ifsc',
    'candidateId', 'client', 'designation', 'department', 'location', 'doj', 'joiningStatus', 'kycStatus',
    'grossSalary', 'letterStatus',
  ],
  hr: [
    'fullName', 'gender', 'maritalStatus', 'qualification',
    'email', 'phone', 'whatsapp', 'currentAddress',
    'bankName',
    'candidateId', 'client', 'designation', 'department', 'location', 'doj', 'joiningStatus', 'kycStatus',
    'letterStatus',
  ],
  hrbp: [
    'fullName', 'email', 'phone',
    'candidateId', 'client', 'designation', 'department', 'location', 'doj', 'joiningStatus',
  ],
};

/** Seeded user-specific overrides (user ids from mockUserSettingsData). */
export const SEED_USER_EXPORT_OVERRIDES: Record<string, string[]> = {
  'usr-8': [
    'fullName', 'email', 'phone',
    'bankName', 'accountNumber', 'ifsc', 'uan', 'esic',
    'candidateId', 'client', 'designation', 'doj', 'joiningStatus',
    'grossSalary',
  ],
};
