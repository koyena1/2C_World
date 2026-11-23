import { MOCK_CANDIDATES } from './mockOnboardingData';
import { MOCK_USERS } from './mockUserSettingsData';

/** A person who can use the internal "switch" into the admin app (requirement 9). */
export interface SwitchSubject {
  id: string;
  name: string;
  kind: 'Employee' | 'Candidate';
  code: string;
  /** Role label for employees, client for candidates. */
  detail: string;
}

export interface SwitchMapping {
  subjectId: string;
  /** User id of the HR Admin this switch maps to. */
  mappedAdminId?: string;
  /** Candidate must keep Admin App access for the switch to work. */
  adminAppAccess: boolean;
  updatedBy?: string;
  updatedAt?: string;
}

export const SWITCH_SUBJECTS: SwitchSubject[] = [
  ...MOCK_USERS.filter((u) => u.role !== 'Super Admin').map<SwitchSubject>((u) => ({
    id: u.id,
    name: u.name,
    kind: 'Employee',
    code: u.employeeCode,
    detail: u.role,
  })),
  ...MOCK_CANDIDATES.slice(0, 4).map<SwitchSubject>((c) => ({
    id: c.id,
    name: `${c.firstName} ${c.lastName}`.trim(),
    kind: 'Candidate',
    code: c.userId,
    detail: c.clientName,
  })),
];

/** Seeded mappings: some Done (mapped + access), some Pending. */
export const SEED_SWITCH_MAPPINGS: SwitchMapping[] = SWITCH_SUBJECTS.map((s, i) => {
  const done = i % 3 !== 2;
  return {
    subjectId: s.id,
    adminAppAccess: i % 4 !== 3,
    mappedAdminId: done ? (['usr-3', 'usr-4'][i % 2] === s.id ? 'usr-5' : ['usr-3', 'usr-4'][i % 2]) : undefined,
    updatedBy: done ? 'Rajesh Sen' : undefined,
    updatedAt: done ? '2026-09-25T12:00:00+05:30' : undefined,
  };
});
