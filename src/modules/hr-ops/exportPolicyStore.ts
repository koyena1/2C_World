import { useSyncExternalStore } from 'react';
import type { Candidate } from '../../types/onboarding';
import { logAudit } from './auditStore';
import type { AppRole } from './hrOps.config';
import {
  DEFAULT_ROLE_EXPORT_FIELDS,
  SEED_EXPORT_POLICY_CHANGES,
  SEED_USER_EXPORT_OVERRIDES,
  type ExportPolicyChange,
} from '../../data/mockExportPermissionData';

export type ExportFieldGroup = 'Personal' | 'Contact' | 'KYC & Statutory' | 'Employment' | 'Compensation' | 'Letters';

export interface ExportField {
  id: string;
  label: string;
  group: ExportFieldGroup;
  /** Restricted / sensitive: highlighted in the UI and excluded unless explicitly authorised. */
  sensitive?: boolean;
  value: (c: Candidate) => string;
}

export const EXPORT_FIELD_GROUPS: ExportFieldGroup[] = ['Personal', 'Contact', 'KYC & Statutory', 'Employment', 'Compensation', 'Letters'];

const kycNo = (c: Candidate, type: 'Aadhaar' | 'PAN' | 'UAN') =>
  c.kycRecords?.find((k) => k.documentType === type)?.documentNumber ?? '';

export const EXPORT_FIELDS: ExportField[] = [
  { id: 'fullName', label: 'Full name', group: 'Personal', value: (c) => `${c.firstName} ${c.lastName}`.trim() },
  { id: 'gender', label: 'Gender', group: 'Personal', value: (c) => c.gender },
  { id: 'dob', label: 'Date of birth', group: 'Personal', sensitive: true, value: (c) => c.dob },
  { id: 'bloodGroup', label: 'Blood group', group: 'Personal', value: (c) => c.bloodGroup },
  { id: 'maritalStatus', label: 'Marital status', group: 'Personal', value: (c) => c.maritalStatus },
  { id: 'fatherName', label: "Father's name", group: 'Personal', value: (c) => c.fatherName },
  { id: 'qualification', label: 'Highest qualification', group: 'Personal', value: (c) => c.highestQualification },
  { id: 'email', label: 'Email', group: 'Contact', value: (c) => c.email },
  { id: 'phone', label: 'Mobile number', group: 'Contact', value: (c) => c.phone },
  { id: 'whatsapp', label: 'WhatsApp number', group: 'Contact', value: (c) => c.whatsappNumber },
  { id: 'currentAddress', label: 'Current address', group: 'Contact', value: (c) => c.currentAddress },
  { id: 'aadhaar', label: 'Aadhaar number', group: 'KYC & Statutory', sensitive: true, value: (c) => kycNo(c, 'Aadhaar') },
  { id: 'pan', label: 'PAN', group: 'KYC & Statutory', sensitive: true, value: (c) => kycNo(c, 'PAN') },
  { id: 'uan', label: 'UAN', group: 'KYC & Statutory', sensitive: true, value: (c) => kycNo(c, 'UAN') },
  { id: 'esic', label: 'ESIC number', group: 'KYC & Statutory', sensitive: true, value: () => '' },
  { id: 'bankName', label: 'Bank name', group: 'KYC & Statutory', value: (c) => c.bankName },
  { id: 'accountNumber', label: 'Bank account number', group: 'KYC & Statutory', sensitive: true, value: (c) => c.accountNumber },
  { id: 'ifsc', label: 'IFSC code', group: 'KYC & Statutory', sensitive: true, value: (c) => c.ifscCode },
  { id: 'candidateId', label: 'Candidate ID', group: 'Employment', value: (c) => c.userId },
  { id: 'client', label: 'Client', group: 'Employment', value: (c) => c.clientName },
  { id: 'designation', label: 'Designation', group: 'Employment', value: (c) => c.designation },
  { id: 'department', label: 'Department', group: 'Employment', value: (c) => c.department },
  { id: 'location', label: 'Work location', group: 'Employment', value: (c) => c.workLocation },
  { id: 'doj', label: 'Date of joining', group: 'Employment', value: (c) => c.dateOfJoining },
  { id: 'joiningStatus', label: 'Joining status', group: 'Employment', value: (c) => c.joiningStatus },
  { id: 'kycStatus', label: 'KYC status', group: 'Employment', value: (c) => String(c.overallKycStatus) },
  { id: 'grossSalary', label: 'CTC / gross salary (monthly)', group: 'Compensation', sensitive: true, value: (c) => String(c.grossSalaryMonthly ?? '') },
  { id: 'letterStatus', label: 'Letter status', group: 'Letters', value: (c) => (c.letters ?? []).map((l) => `${l.title}: ${l.status}`).join('; ') },
];

export interface ExportPolicyState {
  roles: Record<AppRole, string[]>;
  userOverrides: Record<string, string[]>;
  changes: ExportPolicyChange[];
}

let state: ExportPolicyState = {
  roles: { ...DEFAULT_ROLE_EXPORT_FIELDS },
  userOverrides: { ...SEED_USER_EXPORT_OVERRIDES },
  changes: SEED_EXPORT_POLICY_CHANGES,
};
const listeners = new Set<() => void>();
const emit = (next: ExportPolicyState) => {
  state = next;
  listeners.forEach((l) => l());
};
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

type Actor = { id: string; name: string };
const record = (key: string, note: string, actor: Actor, subjectId: string): ExportPolicyChange[] => {
  logAudit({ area: 'ob-export', action: note, subjectId, actorId: actor.id, actorName: actor.name });
  return [{ key, by: actor.name, at: new Date().toISOString(), note }, ...state.changes];
};

export const setRoleExportFields = (role: AppRole, fields: string[], actor: Actor) => {
  const changes = record(`role:${role}`, `Export fields for ${role.toUpperCase()} set to ${fields.length} of ${EXPORT_FIELDS.length}`, actor, role);
  emit({ ...state, roles: { ...state.roles, [role]: fields }, changes });
};

/** Pass `null` to remove the override (user falls back to their role). */
export const setUserExportOverride = (userId: string, fields: string[] | null, actor: Actor) => {
  const next = { ...state.userOverrides };
  if (fields) next[userId] = fields;
  else delete next[userId];
  const note = fields ? `User override for ${userId} set to ${fields.length} fields` : `User override for ${userId} removed`;
  const changes = record(`user:${userId}`, note, actor, userId);
  emit({ ...state, userOverrides: next, changes });
};

/** Field ids the role (or a specific user override) may export. */
export const getAllowedExportFields = (role: AppRole, userId?: string): string[] =>
  (userId && state.userOverrides[userId]) || state.roles[role];

export const useExportPolicy = (): ExportPolicyState => useSyncExternalStore(subscribe, () => state);

export const toCsv = (rows: string[][]): string =>
  rows.map((r) => r.map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\r\n');

/** Columns of the other CSV exports that correspond to an export field (so the same policy applies everywhere). */
const COLUMN_FIELD: Record<string, string> = { 'Gross Monthly': 'grossSalary', 'Annual CTC': 'grossSalary', 'Gross Salary': 'grossSalary', Phone: 'phone', Email: 'email' };

/** Drops the columns the role may not export. `removed` lists them so the UI can tell the user. */
export const applyExportPolicy = <T,>(headers: string[], rows: T[][], role: AppRole, userId?: string) => {
  const allowed = new Set(getAllowedExportFields(role, userId));
  const keep = headers.map((h) => !(h in COLUMN_FIELD) || allowed.has(COLUMN_FIELD[h]));
  return {
    headers: headers.filter((_, i) => keep[i]),
    rows: rows.map((row) => row.filter((_, i) => keep[i])),
    removed: headers.filter((_, i) => !keep[i]),
  };
};

/** The app role a User Settings user belongs to (Super Admin / Admin -> admin, HR* -> hr, anything else -> hrbp). */
export const roleOfSystemRole = (systemRole: string): AppRole =>
  systemRole === 'Super Admin' || systemRole === 'Admin' ? 'admin' : systemRole.startsWith('HR') ? 'hr' : 'hrbp';
