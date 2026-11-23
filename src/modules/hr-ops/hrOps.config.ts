/**
 * Roles and feature access for the 22 HR-operations requirements.
 *
 * FRONTEND ONLY: roles are a UI simulation (header role switcher). Nothing here is real authorisation.
 * Each requirement is a "feature" that lives INSIDE an existing page or one of the two new pages
 * (Compliance, Contract & Exit); there is no standalone page per feature.
 */

export const ROLES = ['admin', 'hr', 'hrbp'] as const;
export type AppRole = (typeof ROLES)[number];

export const ROLE_LABELS: Record<AppRole, string> = { admin: 'Admin', hr: 'HR', hrbp: 'HRBP' };

export const ROLE_STORAGE_KEY = '2coms_active_role';
export const DEFAULT_ROLE: AppRole = 'admin';

export const isAppRole = (value: unknown): value is AppRole => ROLES.includes(value as AppRole);

/** manage = see and change, view = read only (controls disabled), none = hidden. */
export type AccessLevel = 'manage' | 'view' | 'none';

export type FeatureId =
  | 'ob-export' // 1  User Settings -> Export Permissions, enforced on the Candidate Directory export
  | 'uan-esic-log' // 2  Compliance -> UAN & ESIC Log
  | 'esic-validation' // 3  Compliance -> ESIC Validation
  | 'letter-variables' // 4  Offer Letters -> Letter Builder (LWD variable)
  | 'exit-eligibility' // 5  Contract & Exit -> Exits (Offer Not Rolled Out)
  | 'app-notifications' // 6  Attendance & Cycles -> Notifications
  | 'pf-config' // 7  Compliance -> PF Configuration
  | 'qr-onboarding' // 8  Invite Candidate -> QR code
  | 'user-switch' // 9  User Settings -> Users & Access (switch mapping)
  | 'kyc-reports' // 10 KYC & Rs1 Verification -> Dashboard / Reports
  | 'attendance-regularization' // 11 Attendance & Cycles -> Regularization
  | 'file-size' // 12 User Settings -> Document Rules (shown inline on uploads)
  | 'signature-upload' // 13 client toggle, candidate signature + consent, letter approval
  | 'compliance-forms' // 14 Compliance -> Forms
  | 'auto-calls' // 15 Contract & Exit -> Contracts (automation)
  | 'insurance' // 16 Compliance -> Insurance
  | 'lms' // 17 header apps menu (link)
  | 'payroll' // 18 header apps menu
  | 'tickets' // 19 header + Candidate 360 (escalate to ticketing portal)
  | 'exit-module' // 20 Contract & Exit -> Exits
  | 'contract-closure' // 21 Contract & Exit -> Contracts
  | 'exit-documentation'; // 22 Contract & Exit -> Exit Documents

export interface FeatureConfig {
  /** Requirement number (1-22) from the brief. */
  no: number;
  title: string;
  /** Access per role [admin, hr, hrbp]. */
  access: Record<AppRole, AccessLevel>;
}

const f = (no: number, title: string, admin: AccessLevel, hr: AccessLevel, hrbp: AccessLevel): FeatureConfig => ({
  no,
  title,
  access: { admin, hr, hrbp },
});

export const FEATURES: Record<FeatureId, FeatureConfig> = {
  'ob-export': f(1, 'OB Data Export – RBAC', 'manage', 'view', 'view'),
  'uan-esic-log': f(2, 'Candidate Log – UAN & ESIC Update Tracking', 'manage', 'manage', 'view'),
  'esic-validation': f(3, 'ESIC Validation & Applicability', 'manage', 'manage', 'view'),
  'letter-variables': f(4, 'Letter Builder – Variable Parameters', 'manage', 'manage', 'view'),
  'exit-eligibility': f(5, 'Exit Type – Offer Not Rolled Out', 'manage', 'manage', 'view'),
  'app-notifications': f(6, 'App Notifications – Attendance', 'manage', 'manage', 'view'),
  'pf-config': f(7, 'PF Module – Applicability Configuration', 'manage', 'view', 'none'),
  'qr-onboarding': f(8, 'QR Based Onboarding', 'manage', 'manage', 'view'),
  'user-switch': f(9, 'User Switch Function', 'manage', 'none', 'none'),
  'kyc-reports': f(10, 'KYC Verification Dashboard, Central Set Dashboard & Reports', 'manage', 'manage', 'view'),
  'attendance-regularization': f(11, 'Digital Attendance Regularization – E-Sampark', 'manage', 'manage', 'manage'),
  'file-size': f(12, 'Allowed File Size – Documents', 'manage', 'view', 'view'),
  'signature-upload': f(13, 'Physical Signature Upload & Integration', 'manage', 'manage', 'view'),
  'compliance-forms': f(14, 'Compliance Forms Digitization', 'manage', 'manage', 'view'),
  'auto-calls': f(15, 'Auto Calls', 'manage', 'manage', 'view'),
  insurance: f(16, 'Insurance Section – Client-wise', 'manage', 'manage', 'view'),
  lms: f(17, 'LMS Module', 'manage', 'manage', 'view'),
  payroll: f(18, 'Payroll Module', 'manage', 'view', 'none'),
  tickets: f(19, 'Ticket Module & Agent Mapping', 'manage', 'manage', 'view'),
  'exit-module': f(20, 'Exit Module', 'manage', 'manage', 'view'),
  'contract-closure': f(21, 'Contract Closure Module', 'manage', 'manage', 'view'),
  'exit-documentation': f(22, 'Exit Documentation Workflow', 'manage', 'manage', 'view'),
};

export const accessFor = (feature: FeatureId, role: string): AccessLevel =>
  isAppRole(role) ? FEATURES[feature].access[role] : 'none';

/** Highest access over several features (a tab shown for any of them). */
export const bestAccess = (features: FeatureId[], role: string): AccessLevel => {
  const levels = features.map((x) => accessFor(x, role));
  return levels.includes('manage') ? 'manage' : levels.includes('view') ? 'view' : 'none';
};

/** Compliance and Contract & Exit tabs, each backed by one or more features. */
export const COMPLIANCE_FEATURES: FeatureId[] = ['uan-esic-log', 'esic-validation', 'pf-config', 'compliance-forms', 'insurance'];
export const CONTRACT_EXIT_FEATURES: FeatureId[] = [
  'contract-closure',
  'auto-calls',
  'exit-module',
  'exit-eligibility',
  'exit-documentation',
];

/** Pages only some roles may open. Everything else is open to all three roles. */
const VIEW_ACCESS: Record<string, (role: string) => boolean> = {
  usersettings: (role) => role === 'admin',
  compliance: (role) => bestAccess(COMPLIANCE_FEATURES, role) !== 'none',
  'contract-exit': (role) => bestAccess(CONTRACT_EXIT_FEATURES, role) !== 'none',
  payroll: (role) => accessFor('payroll', role) !== 'none',
  lms: (role) => accessFor('lms', role) !== 'none',
  'support-ticket': (role) => accessFor('tickets', role) !== 'none',
};

export const canOpenView = (viewId: string, role: string): boolean => VIEW_ACCESS[viewId]?.(role) ?? true;

/** Roles that can open a page, in sidebar `roles` form. */
export const rolesForView = (viewId: string): AppRole[] => ROLES.filter((r) => canOpenView(viewId, r));
