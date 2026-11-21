import { 
  UserAccount, 
  RoleDefinition, 
  RawPermissionDefinition,
  AccessAuditLogEntry, 
  DEFAULT_SUPER_ADMIN_PERMISSIONS, 
  DEFAULT_ADMIN_PERMISSIONS, 
  DEFAULT_HR_PERMISSIONS 
} from '../types/userSettings';

export const MOCK_ROLES: RoleDefinition[] = [
  {
    id: 'role-super-admin',
    name: 'Super Admin',
    description: 'Unrestricted tenant-wide authority. Can provision modules, manage all tenant users, edit global roles, configure raw permission registry and inspect complete audit logs.',
    userCount: 2,
    allowedModules: [
      'Dashboard',
      'Candidate Directory',
      'Invite Candidate',
      'Bulk Import',
      'KYC Verification Desk',
      'Candidate 360',
      'Attendance & Cycles',
      'Holiday Masters',
      'Letters',
      'Reports',
      'User Settings'
    ],
    permissions: DEFAULT_SUPER_ADMIN_PERMISSIONS,
    rawPermissionKeys: [
      'default-dashboard', 'dashboard-export', 'candidate-directory-view', 'candidate-directory-edit', 'candidate-invite-dispatch',
      'bulk-import-upload', 'kyc-verify-penny', 'kyc-override-approval', 'attendance-muster-lock', 'holiday-policy-publish',
      'letters-generate', 'reports-export-statutory', 'users-manage-all', 'roles-edit-permissions', 'registry-raw-crud'
    ],
    isSystem: true,
    lastUpdated: '12 Oct 2026, 18:30'
  },
  {
    id: 'role-admin',
    name: 'Admin',
    description: 'Operations Team Lead & Branch Delivery Head. Can supervise candidate pipeline, verify muster, dispatch communications, and manage HR users under their span.',
    userCount: 4,
    allowedModules: [
      'Dashboard',
      'Candidate Directory',
      'Invite Candidate',
      'Bulk Import',
      'KYC Verification Desk',
      'Candidate 360',
      'Attendance & Cycles',
      'Holiday Masters',
      'Letters',
      'Reports',
      'User Settings'
    ],
    permissions: DEFAULT_ADMIN_PERMISSIONS,
    rawPermissionKeys: [
      'default-dashboard', 'candidate-directory-view', 'candidate-directory-edit', 'candidate-invite-dispatch',
      'bulk-import-upload', 'kyc-verify-penny', 'attendance-muster-view', 'letters-generate', 'users-manage-subordinate'
    ],
    isSystem: true,
    lastUpdated: '08 Oct 2026, 11:15'
  },
  {
    id: 'role-hr',
    name: 'HR',
    description: 'Standard HR Talent Acquisition Specialist. Can create candidates, trigger invites, inspect KYC statuses and dispatch candidate letters.',
    userCount: 9,
    allowedModules: [
      'Dashboard',
      'Candidate Directory',
      'Invite Candidate',
      'Bulk Import',
      'KYC Verification Desk',
      'Candidate 360',
      'Attendance & Cycles',
      'Holiday Masters',
      'Letters'
    ],
    permissions: DEFAULT_HR_PERMISSIONS,
    rawPermissionKeys: [
      'default-dashboard', 'candidate-directory-view', 'candidate-invite-dispatch', 'bulk-import-upload', 'letters-generate'
    ],
    isSystem: true,
    lastUpdated: '05 Oct 2026, 09:40'
  },
  {
    id: 'role-account-manager',
    name: 'Account manager',
    description: 'Client delivery lead coordinating candidate onboarding SLAs, client approval desk and billing reconciliation.',
    userCount: 3,
    allowedModules: [
      'Dashboard',
      'Candidate Directory',
      'Bulk Import',
      'Candidate 360',
      'Reports'
    ],
    permissions: {
      ...DEFAULT_HR_PERMISSIONS,
      'Dashboard': { view: true, create: false, edit: false, delete: false, approve: false, export: true, send: false },
      'Reports': { view: true, create: false, edit: false, delete: false, approve: false, export: true, send: false },
      'Candidate Directory': { view: true, create: false, edit: true, delete: false, approve: true, export: true, send: true }
    },
    rawPermissionKeys: ['default-dashboard', 'dashboard-export', 'candidate-directory-view', 'reports-export-statutory'],
    isSystem: false,
    lastUpdated: '01 Oct 2026, 14:10'
  },
  {
    id: 'role-accountant',
    name: 'Accountant',
    description: 'Payroll accounts and penny-drop reconciliation desk verifying statutory bank account details.',
    userCount: 2,
    allowedModules: [
      'Dashboard',
      'KYC Verification Desk',
      'Reports'
    ],
    permissions: {
      ...DEFAULT_HR_PERMISSIONS,
      'KYC Verification Desk': { view: true, create: false, edit: true, delete: false, approve: true, export: true, send: false },
      'Reports': { view: true, create: false, edit: false, delete: false, approve: false, export: true, send: false }
    },
    rawPermissionKeys: ['default-dashboard', 'kyc-verify-penny', 'reports-export-statutory'],
    isSystem: false,
    lastUpdated: '25 Sep 2026, 16:20'
  },
  {
    id: 'role-compliance',
    name: 'Compliance',
    description: 'Legal & statutory compliance auditor for labor laws, Aadhaar verification, and provident fund validation.',
    userCount: 2,
    allowedModules: [
      'Dashboard',
      'Candidate Directory',
      'KYC Verification Desk',
      'Reports'
    ],
    permissions: {
      ...DEFAULT_HR_PERMISSIONS,
      'KYC Verification Desk': { view: true, create: false, edit: false, delete: false, approve: true, export: true, send: false },
      'Reports': { view: true, create: false, edit: false, delete: false, approve: false, export: true, send: false }
    },
    rawPermissionKeys: ['default-dashboard', 'kyc-verify-penny', 'reports-export-statutory'],
    isSystem: false,
    lastUpdated: '20 Sep 2026, 10:45'
  },
  {
    id: 'role-default',
    name: 'Default',
    description: 'Base read-only profile assigned upon initial employee invite before operational role provisioning.',
    userCount: 1,
    allowedModules: [
      'Dashboard',
      'Candidate 360'
    ],
    permissions: {
      'Dashboard': { view: true, create: false, edit: false, delete: false, approve: false, export: false, send: false },
      'Candidate Directory': { view: false, create: false, edit: false, delete: false, approve: false, export: false, send: false },
      'Invite Candidate': { view: false, create: false, edit: false, delete: false, approve: false, export: false, send: false },
      'Bulk Import': { view: false, create: false, edit: false, delete: false, approve: false, export: false, send: false },
      'KYC Verification Desk': { view: false, create: false, edit: false, delete: false, approve: false, export: false, send: false },
      'Candidate 360': { view: true, create: false, edit: false, delete: false, approve: false, export: false, send: false },
      'Attendance & Cycles': { view: false, create: false, edit: false, delete: false, approve: false, export: false, send: false },
      'Holiday Masters': { view: false, create: false, edit: false, delete: false, approve: false, export: false, send: false },
      'Letters': { view: false, create: false, edit: false, delete: false, approve: false, export: false, send: false },
      'Reports': { view: false, create: false, edit: false, delete: false, approve: false, export: false, send: false },
      'User Settings': { view: false, create: false, edit: false, delete: false, approve: false, export: false, send: false },
    },
    rawPermissionKeys: ['default-dashboard'],
    isSystem: true,
    lastUpdated: '15 Sep 2026, 09:00'
  },
  {
    id: 'role-external-user',
    name: 'External-User',
    description: 'Third-party client auditor or consultant with strictly sandboxed candidate visibility.',
    userCount: 1,
    allowedModules: [
      'Candidate Directory',
      'Reports'
    ],
    permissions: {
      ...DEFAULT_HR_PERMISSIONS,
      'Dashboard': { view: false, create: false, edit: false, delete: false, approve: false, export: false, send: false },
      'Candidate Directory': { view: true, create: false, edit: false, delete: false, approve: false, export: true, send: false },
      'Reports': { view: true, create: false, edit: false, delete: false, approve: false, export: true, send: false }
    },
    rawPermissionKeys: ['candidate-directory-view', 'reports-export-statutory'],
    isSystem: false,
    lastUpdated: '10 Sep 2026, 12:00'
  },
  {
    id: 'role-hr-engagement',
    name: 'HR-Engagement',
    description: 'Employee engagement officer organizing candidate surveys, orientation calls, and digital communication.',
    userCount: 2,
    allowedModules: [
      'Dashboard',
      'Candidate Directory',
      'Letters'
    ],
    permissions: {
      ...DEFAULT_HR_PERMISSIONS,
      'Letters': { view: true, create: true, edit: true, delete: false, approve: false, export: true, send: true }
    },
    rawPermissionKeys: ['default-dashboard', 'candidate-directory-view', 'letters-generate'],
    isSystem: false,
    lastUpdated: '04 Sep 2026, 17:30'
  },
  {
    id: 'role-hr-onboarding',
    name: 'HR-Onboarding',
    description: 'Specialized recruiter handling bulk candidate imports, WhatsApp invites, and document collection desks.',
    userCount: 5,
    allowedModules: [
      'Dashboard',
      'Candidate Directory',
      'Invite Candidate',
      'Bulk Import',
      'KYC Verification Desk',
      'Letters'
    ],
    permissions: {
      ...DEFAULT_HR_PERMISSIONS,
      'Invite Candidate': { view: true, create: true, edit: true, delete: false, approve: false, export: true, send: true },
      'Bulk Import': { view: true, create: true, edit: true, delete: false, approve: false, export: true, send: false },
      'KYC Verification Desk': { view: true, create: false, edit: true, delete: false, approve: false, export: false, send: true }
    },
    rawPermissionKeys: ['default-dashboard', 'candidate-directory-view', 'candidate-invite-dispatch', 'bulk-import-upload'],
    isSystem: false,
    lastUpdated: '02 Sep 2026, 11:20'
  },
  {
    id: 'role-hr-payroll',
    name: 'HR-Payroll',
    description: 'Attendance muster supervisor verifying shift cutoffs, biometric reconciliations, and salary input slips.',
    userCount: 3,
    allowedModules: [
      'Dashboard',
      'Attendance & Cycles',
      'Holiday Masters',
      'Reports'
    ],
    permissions: {
      ...DEFAULT_HR_PERMISSIONS,
      'Attendance & Cycles': { view: true, create: true, edit: true, delete: false, approve: true, export: true, send: false },
      'Reports': { view: true, create: false, edit: false, delete: false, approve: false, export: true, send: false }
    },
    rawPermissionKeys: ['default-dashboard', 'attendance-muster-lock', 'reports-export-statutory'],
    isSystem: false,
    lastUpdated: '29 Aug 2026, 15:00'
  }
];

export const MOCK_RAW_PERMISSIONS: RawPermissionDefinition[] = [
  // Dashboard
  {
    id: 'perm-dash-01',
    name: 'View Dashboard Metrics',
    technicalKey: 'default-dashboard',
    module: 'Dashboard',
    parentPermissionId: null,
    description: 'Allows reading real-time pipeline status, onboarding funnels and daily KPI cards.',
    action: 'view',
    isSystem: true
  },
  {
    id: 'perm-dash-02',
    name: 'Export Dashboard Analytics',
    technicalKey: 'dashboard-export',
    module: 'Dashboard',
    parentPermissionId: 'perm-dash-01',
    parentPermissionName: 'View Dashboard Metrics',
    description: 'Export operational summary and SLA breach reports to Excel.',
    action: 'export',
    isSystem: false
  },

  // Candidate Directory
  {
    id: 'perm-cand-01',
    name: 'View Candidate Directory',
    technicalKey: 'candidate-directory-view',
    module: 'Candidate Directory',
    parentPermissionId: null,
    description: 'Read-only access to all candidates across permitted clients.',
    action: 'view',
    isSystem: true
  },
  {
    id: 'perm-cand-02',
    name: 'Create Candidate Records',
    technicalKey: 'candidate-directory-create',
    module: 'Candidate Directory',
    parentPermissionId: 'perm-cand-01',
    parentPermissionName: 'View Candidate Directory',
    description: 'Register and create individual candidates manually in the database.',
    action: 'create',
    isSystem: false
  },
  {
    id: 'perm-cand-03',
    name: 'Edit Candidate Dossiers',
    technicalKey: 'candidate-directory-edit',
    module: 'Candidate Directory',
    parentPermissionId: 'perm-cand-01',
    parentPermissionName: 'View Candidate Directory',
    description: 'Modify salary, designation, contact, and deployment details.',
    action: 'edit',
    isSystem: false
  },
  {
    id: 'perm-cand-04',
    name: 'Delete / Archive Candidate',
    technicalKey: 'candidate-directory-delete',
    module: 'Candidate Directory',
    parentPermissionId: 'perm-cand-03',
    parentPermissionName: 'Edit Candidate Dossiers',
    description: 'Permanently archive candidate records from directory.',
    action: 'delete',
    isSystem: false
  },

  // Invite Candidate
  {
    id: 'perm-inv-01',
    name: 'Dispatch Candidate Invitations',
    technicalKey: 'candidate-invite-dispatch',
    module: 'Invite Candidate',
    parentPermissionId: null,
    description: 'Send self-service digital onboarding invites via WhatsApp and SMS.',
    action: 'send',
    isSystem: false
  },

  // Bulk Import
  {
    id: 'perm-imp-01',
    name: 'Execute Bulk Excel Import',
    technicalKey: 'bulk-import-upload',
    module: 'Bulk Import',
    parentPermissionId: null,
    description: 'Upload XLSX and CSV batches with validation error reconciliation.',
    action: 'create',
    isSystem: false
  },

  // KYC Verification Desk
  {
    id: 'perm-kyc-01',
    name: 'Inspect KYC Submissions',
    technicalKey: 'kyc-view-desk',
    module: 'KYC Verification Desk',
    parentPermissionId: null,
    description: 'View Aadhaar, PAN, Bank and UAN verification cards.',
    action: 'view',
    isSystem: true
  },
  {
    id: 'perm-kyc-02',
    name: 'Trigger ₹1 Penny Drop Verification',
    technicalKey: 'kyc-verify-penny',
    module: 'KYC Verification Desk',
    parentPermissionId: 'perm-kyc-01',
    parentPermissionName: 'Inspect KYC Submissions',
    description: 'Execute live NPCI bank account verification and beneficiary match.',
    action: 'approve',
    isSystem: false
  },
  {
    id: 'perm-kyc-03',
    name: 'Manual KYC Approval Override',
    technicalKey: 'kyc-override-approval',
    module: 'KYC Verification Desk',
    parentPermissionId: 'perm-kyc-02',
    parentPermissionName: 'Trigger ₹1 Penny Drop Verification',
    description: 'Approve mismatched document names with auditable remarks.',
    action: 'special',
    isSystem: false
  },

  // Attendance & Cycles
  {
    id: 'perm-att-01',
    name: 'View Attendance Muster',
    technicalKey: 'attendance-muster-view',
    module: 'Attendance & Cycles',
    parentPermissionId: null,
    description: 'Inspect daily check-ins, multi-office punches and shift roster.',
    action: 'view',
    isSystem: true
  },
  {
    id: 'perm-att-02',
    name: 'Lock & Finalize Attendance Cycle',
    technicalKey: 'attendance-muster-lock',
    module: 'Attendance & Cycles',
    parentPermissionId: 'perm-att-01',
    parentPermissionName: 'View Attendance Muster',
    description: 'Lock monthly attendance cutoff to feed payroll processing engine.',
    action: 'approve',
    isSystem: false
  },

  // Holiday Masters
  {
    id: 'perm-hol-01',
    name: 'Publish Statutory Holiday Calendar',
    technicalKey: 'holiday-policy-publish',
    module: 'Holiday Masters',
    parentPermissionId: null,
    description: 'Create and activate location-specific holiday masters.',
    action: 'create',
    isSystem: false
  },

  // Letters
  {
    id: 'perm-let-01',
    name: 'Generate & Sign Offer Letters',
    technicalKey: 'letters-generate',
    module: 'Letters',
    parentPermissionId: null,
    description: 'Generate standardized offer & appointment letters and dispatch via email.',
    action: 'send',
    isSystem: false
  },

  // Reports
  {
    id: 'perm-rep-01',
    name: 'Export Statutory Reports & Muster',
    technicalKey: 'reports-export-statutory',
    module: 'Reports',
    parentPermissionId: null,
    description: 'Download PF/ESI registers, biometric punch logs, and compliance audits.',
    action: 'export',
    isSystem: false
  },

  // User Settings
  {
    id: 'perm-usr-01',
    name: 'Manage Tenant Accounts & Access',
    technicalKey: 'users-manage-all',
    module: 'User Settings',
    parentPermissionId: null,
    description: 'Provision users, modify roles, assign reporting managers, and map clients.',
    action: 'edit',
    isSystem: true
  },
  {
    id: 'perm-usr-02',
    name: 'Manage Subordinate HRs Only',
    technicalKey: 'users-manage-subordinate',
    module: 'User Settings',
    parentPermissionId: 'perm-usr-01',
    parentPermissionName: 'Manage Tenant Accounts & Access',
    description: 'Admin level management restricted to reporting HR staff.',
    action: 'edit',
    isSystem: true
  },
  {
    id: 'perm-usr-03',
    name: 'Edit Role Permission Matrix',
    technicalKey: 'roles-edit-permissions',
    module: 'User Settings',
    parentPermissionId: 'perm-usr-01',
    parentPermissionName: 'Manage Tenant Accounts & Access',
    description: 'Configure and update granular module permissions for system roles.',
    action: 'special',
    isSystem: true
  },
  {
    id: 'perm-usr-04',
    name: 'Maintain Raw Permission Registry',
    technicalKey: 'registry-raw-crud',
    module: 'User Settings',
    parentPermissionId: 'perm-usr-03',
    parentPermissionName: 'Edit Role Permission Matrix',
    description: 'Add, update or delete raw permission keys and parent-child links.',
    action: 'special',
    isSystem: true
  }
];

export const MOCK_USERS: UserAccount[] = [
  // Super Admins
  {
    id: 'usr-1',
    firstName: 'Rajesh',
    lastName: 'Sen',
    name: 'Rajesh Sen',
    email: 'rajesh.sen@2coms.com',
    mobileNo: '+91 98300 12345',
    employeeCode: '2CS-SA-001',
    dob: '1982-05-14',
    dateOfJoining: '2018-04-01',
    memberSince: 'April 2018',
    role: 'Super Admin',
    status: 'Active',
    lastLogin: 'Today, 09:42 AM',
    department: 'Executive Leadership',
    allowedModules: [
      'Dashboard', 'Candidate Directory', 'Invite Candidate', 'Bulk Import',
      'KYC Verification Desk', 'Candidate 360', 'Attendance & Cycles',
      'Holiday Masters', 'Letters', 'Reports', 'User Settings'
    ],
    mappedClients: [
      {
        clientId: 'client-2coms',
        clientName: '2COMS Services',
        clientCode: '2CS',
        locationNames: ['Kolkata', 'Hyderabad', 'Bangalore'],
        branchNames: ['RDB', 'Big Bagan', 'Alipore', 'City Level'],
        candidateAccessScope: 'All Candidates'
      },
      {
        clientId: 'client-tcs',
        clientName: 'Tata Consultancy Services',
        clientCode: 'TCS',
        locationNames: ['Bangalore', 'Hyderabad', 'Pune'],
        branchNames: ['Whitefield Campus', 'SEZ Phase 1', 'Adibatla Aerospace'],
        candidateAccessScope: 'All Candidates'
      }
    ],
    menuPermissions: {
      'Dashboard': true, 'Candidate Directory': true, 'Invite Candidate': true,
      'Bulk Import': true, 'KYC Verification Desk': true, 'Candidate 360': true,
      'Attendance & Cycles': true, 'Holiday Masters': true, 'Letters': true,
      'Reports': true, 'User Settings': true
    }
  },
  {
    id: 'usr-2',
    firstName: 'Sharmila',
    lastName: 'Roy',
    name: 'Sharmila Roy',
    email: 'sharmila.roy@2coms.com',
    mobileNo: '+91 98311 23456',
    employeeCode: '2CS-SA-002',
    dob: '1985-08-22',
    dateOfJoining: '2019-01-15',
    memberSince: 'January 2019',
    role: 'Super Admin',
    status: 'Active',
    lastLogin: 'Yesterday, 04:15 PM',
    department: 'Operations Governance',
    allowedModules: [
      'Dashboard', 'Candidate Directory', 'Invite Candidate', 'Bulk Import',
      'KYC Verification Desk', 'Candidate 360', 'Attendance & Cycles',
      'Holiday Masters', 'Letters', 'Reports', 'User Settings'
    ],
    mappedClients: [
      {
        clientId: 'client-2coms',
        clientName: '2COMS Services',
        clientCode: '2CS',
        locationNames: ['Kolkata', 'Hyderabad'],
        branchNames: ['RDB', 'Big Bagan'],
        candidateAccessScope: 'All Candidates'
      }
    ]
  },

  // Admins
  {
    id: 'usr-3',
    firstName: 'Ananya',
    lastName: 'Mukherjee',
    name: 'Ananya Mukherjee',
    email: 'ananya.m@2coms.com',
    mobileNo: '+91 98201 34567',
    employeeCode: '2CS-ADM-101',
    dob: '1989-11-03',
    dateOfJoining: '2020-07-01',
    memberSince: 'July 2020',
    role: 'Admin',
    reportingManagerId: 'usr-1',
    reportingManagerName: 'Rajesh Sen (Super Admin)',
    status: 'Active',
    lastLogin: 'Today, 08:15 AM',
    department: 'Talent Acquisition Ops',
    allowedModules: [
      'Dashboard', 'Candidate Directory', 'Invite Candidate', 'Bulk Import',
      'KYC Verification Desk', 'Candidate 360', 'Attendance & Cycles',
      'Holiday Masters', 'Letters', 'Reports', 'User Settings'
    ],
    mappedClients: [
      {
        clientId: 'client-2coms',
        clientName: '2COMS Services',
        clientCode: '2CS',
        locationNames: ['Kolkata', 'Hyderabad'],
        branchNames: ['RDB', 'Big Bagan'],
        candidateAccessScope: 'All Candidates'
      },
      {
        clientId: 'client-tcs',
        clientName: 'Tata Consultancy Services',
        clientCode: 'TCS',
        locationNames: ['Bangalore'],
        branchNames: ['Whitefield Campus'],
        candidateAccessScope: 'Client Candidates Only'
      }
    ]
  },
  {
    id: 'usr-4',
    firstName: 'Devendra',
    lastName: 'Kulkarni',
    name: 'Devendra Kulkarni',
    email: 'devendra.k@2coms.com',
    mobileNo: '+91 97654 45678',
    employeeCode: '2CS-ADM-102',
    dob: '1987-03-19',
    dateOfJoining: '2021-02-10',
    memberSince: 'February 2021',
    role: 'Admin',
    reportingManagerId: 'usr-1',
    reportingManagerName: 'Rajesh Sen (Super Admin)',
    status: 'Active',
    lastLogin: 'Yesterday, 06:40 PM',
    department: 'Western Regional Operations',
    allowedModules: [
      'Dashboard', 'Candidate Directory', 'Invite Candidate', 'Bulk Import',
      'KYC Verification Desk', 'Candidate 360', 'Attendance & Cycles',
      'Holiday Masters', 'Letters', 'Reports', 'User Settings'
    ],
    mappedClients: [
      {
        clientId: 'client-tcs',
        clientName: 'Tata Consultancy Services',
        clientCode: 'TCS',
        locationNames: ['Pune', 'Hyderabad'],
        branchNames: ['Sahyadri Park', 'Hinjewadi Phase 3'],
        candidateAccessScope: 'Client Candidates Only'
      }
    ]
  },
  {
    id: 'usr-5',
    firstName: 'Pooja',
    lastName: 'Venkatesh',
    name: 'Pooja Venkatesh',
    email: 'pooja.v@2coms.com',
    mobileNo: '+91 99000 56789',
    employeeCode: '2CS-ADM-103',
    dob: '1990-09-28',
    dateOfJoining: '2021-11-15',
    memberSince: 'November 2021',
    role: 'Admin',
    reportingManagerId: 'usr-2',
    reportingManagerName: 'Sharmila Roy (Super Admin)',
    status: 'Active',
    lastLogin: '3 days ago',
    department: 'Southern Hub Operations',
    allowedModules: [
      'Dashboard', 'Candidate Directory', 'Invite Candidate', 'Bulk Import',
      'KYC Verification Desk', 'Letters', 'User Settings'
    ],
    mappedClients: [
      {
        clientId: 'client-2coms',
        clientName: '2COMS Services',
        clientCode: '2CS',
        locationNames: ['Bangalore'],
        branchNames: ['City Level'],
        candidateAccessScope: 'All Candidates'
      }
    ]
  },

  // HR Users
  {
    id: 'usr-6',
    firstName: 'Vikram',
    lastName: 'Chowdhury',
    name: 'Vikram Chowdhury',
    email: 'vikram.c@2coms.com',
    mobileNo: '+91 98450 67890',
    employeeCode: '2CS-HR-201',
    dob: '1994-12-05',
    dateOfJoining: '2022-05-18',
    memberSince: 'May 2022',
    role: 'HR',
    reportingManagerId: 'usr-3',
    reportingManagerName: 'Ananya Mukherjee (Admin)',
    status: 'Active',
    lastLogin: 'Today, 10:05 AM',
    department: 'Talent Acquisition',
    allowedModules: [
      'Dashboard', 'Candidate Directory', 'Invite Candidate', 'Bulk Import',
      'KYC Verification Desk', 'Candidate 360', 'Letters'
    ],
    mappedCandidateId: 'cand-001',
    mappedCandidateName: 'Priya Sharma',
    mappedCandidateUserId: '2C-2026-8941',
    mappedCandidateEmail: 'priya.sharma@example.com',
    mappedClients: [
      {
        clientId: 'client-tcs',
        clientName: 'Tata Consultancy Services',
        clientCode: 'TCS',
        locationNames: ['Bangalore'],
        branchNames: ['Whitefield Campus'],
        candidateAccessScope: 'Assigned Only'
      }
    ]
  },
  {
    id: 'usr-7',
    firstName: 'Sneha',
    lastName: 'Iyer',
    name: 'Sneha Iyer',
    email: 'sneha.iyer@2coms.com',
    mobileNo: '+91 94440 78901',
    employeeCode: '2CS-HR-202',
    dob: '1995-04-16',
    dateOfJoining: '2022-09-01',
    memberSince: 'September 2022',
    role: 'HR-Onboarding',
    reportingManagerId: 'usr-3',
    reportingManagerName: 'Ananya Mukherjee (Admin)',
    status: 'Active',
    lastLogin: 'Yesterday, 02:20 PM',
    department: 'Candidate Onboarding',
    allowedModules: [
      'Dashboard', 'Candidate Directory', 'Invite Candidate', 'Bulk Import',
      'KYC Verification Desk', 'Letters'
    ],
    mappedClients: [
      {
        clientId: 'client-2coms',
        clientName: '2COMS Services',
        clientCode: '2CS',
        locationNames: ['Kolkata'],
        branchNames: ['RDB', 'Big Bagan'],
        candidateAccessScope: 'Client Candidates Only'
      }
    ]
  },
  {
    id: 'usr-8',
    firstName: 'Arjun',
    lastName: 'Reddy',
    name: 'Arjun Reddy',
    email: 'arjun.reddy@2coms.com',
    mobileNo: '+91 98850 89012',
    employeeCode: '2CS-HR-203',
    dob: '1996-01-30',
    dateOfJoining: '2023-01-16',
    memberSince: 'January 2023',
    role: 'HR-Payroll',
    reportingManagerId: 'usr-3',
    reportingManagerName: 'Ananya Mukherjee (Admin)',
    status: 'Active',
    lastLogin: 'Today, 09:10 AM',
    department: 'Muster Operations',
    allowedModules: [
      'Dashboard', 'Attendance & Cycles', 'Holiday Masters', 'Reports'
    ],
    mappedClients: [
      {
        clientId: 'client-2coms',
        clientName: '2COMS Services',
        clientCode: '2CS',
        locationNames: ['Hyderabad'],
        branchNames: ['City Level'],
        candidateAccessScope: 'Client Candidates Only'
      }
    ]
  },
  {
    id: 'usr-9',
    firstName: 'Tanvi',
    lastName: 'Bose',
    name: 'Tanvi Bose',
    email: 'tanvi.bose@2coms.com',
    mobileNo: '+91 98319 90123',
    employeeCode: '2CS-HR-204',
    dob: '1995-07-12',
    dateOfJoining: '2023-04-03',
    memberSince: 'April 2023',
    role: 'HR-Engagement',
    reportingManagerId: 'usr-4',
    reportingManagerName: 'Devendra Kulkarni (Admin)',
    status: 'Non Active',
    lastLogin: '18 Aug 2026, 11:30 AM',
    department: 'Talent Experience',
    allowedModules: [
      'Dashboard', 'Candidate Directory', 'Letters'
    ],
    mappedClients: [
      {
        clientId: 'client-tcs',
        clientName: 'Tata Consultancy Services',
        clientCode: 'TCS',
        locationNames: ['Pune'],
        branchNames: ['Sahyadri Park'],
        candidateAccessScope: 'Assigned Only'
      }
    ]
  },
  {
    id: 'usr-10',
    firstName: 'Rohit',
    lastName: 'Mehra',
    name: 'Rohit Mehra',
    email: 'rohit.mehra@2coms.com',
    mobileNo: '+91 99100 01234',
    employeeCode: '2CS-HR-205',
    dob: '1997-10-09',
    dateOfJoining: '2024-02-01',
    memberSince: 'February 2024',
    role: 'Accountant',
    reportingManagerId: 'usr-4',
    reportingManagerName: 'Devendra Kulkarni (Admin)',
    status: 'Active',
    lastLogin: 'Today, 11:45 AM',
    department: 'Statutory Accounts',
    allowedModules: [
      'Dashboard', 'KYC Verification Desk', 'Reports'
    ],
    mappedClients: [
      {
        clientId: 'client-tcs',
        clientName: 'Tata Consultancy Services',
        clientCode: 'TCS',
        locationNames: ['Hyderabad'],
        branchNames: ['Adibatla Aerospace'],
        candidateAccessScope: 'Client Candidates Only'
      }
    ]
  },
  {
    id: 'usr-11',
    firstName: 'Meenakshi',
    lastName: 'Sundaram',
    name: 'Meenakshi Sundaram',
    email: 'meenakshi.s@2coms.com',
    mobileNo: '+91 98401 12345',
    employeeCode: '2CS-HR-206',
    dob: '1993-06-25',
    dateOfJoining: '2024-06-15',
    memberSince: 'June 2024',
    role: 'Compliance',
    reportingManagerId: 'usr-5',
    reportingManagerName: 'Pooja Venkatesh (Admin)',
    status: 'Pending Invitation',
    lastLogin: 'Never',
    department: 'Legal Compliance',
    allowedModules: [
      'Dashboard', 'Candidate Directory', 'KYC Verification Desk', 'Reports'
    ],
    mappedClients: [
      {
        clientId: 'client-2coms',
        clientName: '2COMS Services',
        clientCode: '2CS',
        locationNames: ['Bangalore'],
        branchNames: ['City Level'],
        candidateAccessScope: 'All Candidates'
      }
    ]
  }
];

export const MOCK_AUDIT_LOGS: AccessAuditLogEntry[] = [
  {
    id: 'aud-101',
    timestamp: '13 Oct 2026, 08:30 AM',
    changedBy: { id: 'usr-1', name: 'Rajesh Sen', role: 'Super Admin' },
    userAffected: { id: 'usr-6', name: 'Vikram Chowdhury', email: 'vikram.c@2coms.com' },
    oldRole: 'Default',
    newRole: 'HR',
    permissionChanged: 'Granted full Candidate Directory, Invite Candidate, and Letters access.',
    clientMappingChanged: 'Mapped to TCS (Bangalore - Whitefield Campus). Candidate Scope: Assigned Only.',
    remarks: 'Promotion upon completion of probation period.'
  },
  {
    id: 'aud-102',
    timestamp: '12 Oct 2026, 05:15 PM',
    changedBy: { id: 'usr-1', name: 'Rajesh Sen', role: 'Super Admin' },
    userAffected: { id: 'usr-3', name: 'Ananya Mukherjee', email: 'ananya.m@2coms.com' },
    oldRole: 'Admin',
    newRole: 'Admin',
    permissionChanged: 'Enabled permission to manage assigned HR users in User Settings module.',
    clientMappingChanged: 'Added TCS (Bangalore) to client mapping profile.',
    remarks: 'Delegated regional team management responsibility.'
  },
  {
    id: 'aud-103',
    timestamp: '11 Oct 2026, 02:40 PM',
    changedBy: { id: 'usr-3', name: 'Ananya Mukherjee', role: 'Admin' },
    userAffected: { id: 'usr-8', name: 'Arjun Reddy', email: 'arjun.reddy@2coms.com' },
    oldRole: 'HR',
    newRole: 'HR-Payroll',
    permissionChanged: 'Replaced Candidate Directory permissions with Attendance & Cycles and Holiday Masters.',
    clientMappingChanged: 'Mapped to 2COMS Services (Hyderabad).',
    remarks: 'Reassigned to muster cycles and payroll cutoffs team.'
  },
  {
    id: 'aud-104',
    timestamp: '09 Oct 2026, 11:20 AM',
    changedBy: { id: 'usr-2', name: 'Sharmila Roy', role: 'Super Admin' },
    userAffected: { id: 'usr-9', name: 'Tanvi Bose', email: 'tanvi.bose@2coms.com' },
    oldRole: 'HR-Engagement',
    newRole: 'HR-Engagement',
    permissionChanged: 'Revoked Letters export capability. User status marked Non Active.',
    clientMappingChanged: 'Deactivated candidate access scope.',
    remarks: 'Temporary sabbatical leave until December 2026.'
  },
  {
    id: 'aud-105',
    timestamp: '05 Oct 2026, 04:55 PM',
    changedBy: { id: 'usr-1', name: 'Rajesh Sen', role: 'Super Admin' },
    userAffected: { id: 'usr-10', name: 'Rohit Mehra', email: 'rohit.mehra@2coms.com' },
    oldRole: 'Default',
    newRole: 'Accountant',
    permissionChanged: 'Assigned KYC Verification Desk and penny test approval authorization.',
    clientMappingChanged: 'Mapped to TCS (Hyderabad - Adibatla).',
    remarks: 'Provisioned for financial year end bank account reconciliation.'
  }
];
