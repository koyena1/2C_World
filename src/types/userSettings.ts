export type SystemRole = 
  | 'Super Admin'
  | 'Admin'
  | 'HR'
  | 'Account manager'
  | 'Accountant'
  | 'Compliance'
  | 'Default'
  | 'External-User'
  | 'HR-Engagement'
  | 'HR-Onboarding'
  | 'HR-Payroll'
  | 'Custom Role';

export type UserStatus = 'Active' | 'Non Active' | 'Pending Invitation';

export interface ModulePermission {
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
  approve: boolean; // Approve / Verify
  export: boolean;
  send: boolean; // Send / Notify
  specialAccess?: boolean; // Special Access
}

export type AppModuleName = 
  | 'Dashboard'
  | 'Candidate Directory'
  | 'Invite Candidate'
  | 'Bulk Import'
  | 'KYC Verification Desk'
  | 'Candidate 360'
  | 'Attendance & Cycles'
  | 'Holiday Masters'
  | 'Letters'
  | 'Reports'
  | 'User Settings';

export interface ClientMapping {
  clientId: string;
  clientName: string;
  clientCode: string;
  locationNames: string[];
  branchNames: string[];
  candidateAccessScope: 'All Candidates' | 'Assigned Only' | 'Client Candidates Only' | 'Restricted';
}

export interface UserAccount {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  mobileNo: string;
  employeeCode: string; // Employee ID
  dob?: string;
  dateOfJoining?: string;
  memberSince: string;
  role: string;
  reportingManagerId?: string;
  reportingManagerName?: string;
  status: UserStatus;
  mappedCandidateId?: string;
  mappedCandidateName?: string;
  mappedCandidateUserId?: string;
  mappedCandidateEmail?: string;
  mappedClients: ClientMapping[];
  allowedModules: AppModuleName[];
  customOverrides?: Record<string, boolean>; // technical permission key -> boolean
  menuPermissions?: Partial<Record<AppModuleName, boolean>>;
  lastLogin: string;
  department?: string;
  avatar?: string;
}

export interface RoleDefinition {
  id: string;
  name: string;
  description: string;
  userCount: number;
  allowedModules: AppModuleName[];
  permissions: Record<AppModuleName, ModulePermission>;
  rawPermissionKeys?: string[];
  isSystem: boolean;
  lastUpdated: string;
}

export interface RawPermissionDefinition {
  id: string;
  name: string;
  technicalKey: string;
  module: AppModuleName;
  parentPermissionId: string | null;
  parentPermissionName?: string;
  description: string;
  action: 'view' | 'create' | 'edit' | 'delete' | 'approve' | 'export' | 'send' | 'special';
  isSystem: boolean;
}

export interface AccessAuditLogEntry {
  id: string;
  timestamp: string;
  changedBy: {
    id: string;
    name: string;
    role: string;
  };
  userAffected: {
    id: string;
    name: string;
    email: string;
  };
  oldRole: string;
  newRole: string;
  permissionChanged: string;
  clientMappingChanged?: string;
  remarks: string;
}

export const ALL_APP_MODULES: { id: AppModuleName; name: string; category: string; description: string }[] = [
  { id: 'Dashboard', name: 'Dashboard', category: 'Operations Console', description: 'Real-time onboarding KPIs, SLA breaches & operational status' },
  { id: 'Candidate Directory', name: 'Candidate Directory', category: 'Candidate Pipeline', description: 'Browse and filter candidate profiles across clients' },
  { id: 'Invite Candidate', name: 'Invite Candidate', category: 'Candidate Pipeline', description: 'Dispatch self-onboarding invitations via WhatsApp/SMS' },
  { id: 'Bulk Import', name: 'Bulk Import', category: 'Candidate Pipeline', description: 'Import batches via Excel / CSV template processing' },
  { id: 'KYC Verification Desk', name: 'KYC Verification Desk', category: 'Compliance & Verification', description: 'Live OCR, ₹1 Penny Drop and document validation' },
  { id: 'Candidate 360', name: 'Candidate 360', category: 'Candidate Profile', description: 'Comprehensive 360-degree employee dossier & audit' },
  { id: 'Attendance & Cycles', name: 'Attendance & Cycles', category: 'Workforce & Attendance', description: 'Daily muster, shifts, biometric punch mapping & cut-offs' },
  { id: 'Holiday Masters', name: 'Holiday Masters', category: 'Workforce & Attendance', description: 'Multi-location statutory holiday calendars & policies' },
  { id: 'Letters', name: 'Letters', category: 'Lifecycle Communications', description: 'Offer, appointment, revision letters & digital signing' },
  { id: 'Reports', name: 'Reports', category: 'Compliance & Analytics', description: 'Statutory compliance registers, muster exports & audits' },
  { id: 'User Settings', name: 'User Settings', category: 'System Administration', description: 'Role-based access control, RBAC matrix & audit logs' },
];

export const PERMISSION_ACTIONS = [
  { key: 'view', label: 'View', tooltip: 'Read-only visibility of data and records' },
  { key: 'create', label: 'Create', tooltip: 'Ability to add, invite or register records' },
  { key: 'edit', label: 'Edit', tooltip: 'Modify existing records, fields and settings' },
  { key: 'delete', label: 'Delete', tooltip: 'Remove or archive records permanently' },
  { key: 'approve', label: 'Approve / Verify', tooltip: 'Sign off KYC, muster cycles or regularization' },
  { key: 'export', label: 'Export', tooltip: 'Download datasets as Excel, CSV or PDF' },
  { key: 'send', label: 'Send / Notify', tooltip: 'Dispatch WhatsApp, SMS, letters or emails' },
  { key: 'specialAccess', label: 'Special Access', tooltip: 'Admin configuration, bypass restrictions & audit operations' },
] as const;

export const DEFAULT_SUPER_ADMIN_PERMISSIONS: Record<AppModuleName, ModulePermission> = {
  'Dashboard': { view: true, create: true, edit: true, delete: true, approve: true, export: true, send: true, specialAccess: true },
  'Candidate Directory': { view: true, create: true, edit: true, delete: true, approve: true, export: true, send: true, specialAccess: true },
  'Invite Candidate': { view: true, create: true, edit: true, delete: true, approve: true, export: true, send: true, specialAccess: true },
  'Bulk Import': { view: true, create: true, edit: true, delete: true, approve: true, export: true, send: true, specialAccess: true },
  'KYC Verification Desk': { view: true, create: true, edit: true, delete: true, approve: true, export: true, send: true, specialAccess: true },
  'Candidate 360': { view: true, create: true, edit: true, delete: true, approve: true, export: true, send: true, specialAccess: true },
  'Attendance & Cycles': { view: true, create: true, edit: true, delete: true, approve: true, export: true, send: true, specialAccess: true },
  'Holiday Masters': { view: true, create: true, edit: true, delete: true, approve: true, export: true, send: true, specialAccess: true },
  'Letters': { view: true, create: true, edit: true, delete: true, approve: true, export: true, send: true, specialAccess: true },
  'Reports': { view: true, create: true, edit: true, delete: true, approve: true, export: true, send: true, specialAccess: true },
  'User Settings': { view: true, create: true, edit: true, delete: true, approve: true, export: true, send: true, specialAccess: true },
};

export const DEFAULT_ADMIN_PERMISSIONS: Record<AppModuleName, ModulePermission> = {
  'Dashboard': { view: true, create: false, edit: true, delete: false, approve: true, export: true, send: true, specialAccess: false },
  'Candidate Directory': { view: true, create: true, edit: true, delete: false, approve: true, export: true, send: true, specialAccess: false },
  'Invite Candidate': { view: true, create: true, edit: true, delete: false, approve: false, export: false, send: true, specialAccess: false },
  'Bulk Import': { view: true, create: true, edit: true, delete: false, approve: true, export: true, send: false, specialAccess: false },
  'KYC Verification Desk': { view: true, create: false, edit: true, delete: false, approve: true, export: true, send: true, specialAccess: false },
  'Candidate 360': { view: true, create: false, edit: true, delete: false, approve: false, export: true, send: true, specialAccess: false },
  'Attendance & Cycles': { view: true, create: true, edit: true, delete: false, approve: true, export: true, send: false, specialAccess: false },
  'Holiday Masters': { view: true, create: true, edit: true, delete: false, approve: true, export: true, send: false, specialAccess: false },
  'Letters': { view: true, create: true, edit: true, delete: false, approve: true, export: true, send: true, specialAccess: false },
  'Reports': { view: true, create: false, edit: false, delete: false, approve: false, export: true, send: false, specialAccess: false },
  'User Settings': { view: true, create: true, edit: true, delete: false, approve: false, export: false, send: false, specialAccess: false },
};

export const DEFAULT_HR_PERMISSIONS: Record<AppModuleName, ModulePermission> = {
  'Dashboard': { view: true, create: false, edit: false, delete: false, approve: false, export: false, send: false, specialAccess: false },
  'Candidate Directory': { view: true, create: true, edit: true, delete: false, approve: false, export: false, send: true, specialAccess: false },
  'Invite Candidate': { view: true, create: true, edit: false, delete: false, approve: false, export: false, send: true, specialAccess: false },
  'Bulk Import': { view: true, create: true, edit: false, delete: false, approve: false, export: false, send: false, specialAccess: false },
  'KYC Verification Desk': { view: true, create: false, edit: true, delete: false, approve: false, export: false, send: true, specialAccess: false },
  'Candidate 360': { view: true, create: false, edit: false, delete: false, approve: false, export: false, send: false, specialAccess: false },
  'Attendance & Cycles': { view: true, create: false, edit: false, delete: false, approve: false, export: false, send: false, specialAccess: false },
  'Holiday Masters': { view: true, create: false, edit: false, delete: false, approve: false, export: false, send: false, specialAccess: false },
  'Letters': { view: true, create: false, edit: false, delete: false, approve: false, export: false, send: true, specialAccess: false },
  'Reports': { view: false, create: false, edit: false, delete: false, approve: false, export: false, send: false, specialAccess: false },
  'User Settings': { view: false, create: false, edit: false, delete: false, approve: false, export: false, send: false, specialAccess: false },
};
