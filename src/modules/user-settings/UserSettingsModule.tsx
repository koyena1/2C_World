import React, { useState, useEffect } from 'react';
import { downloadCsv } from '../../utils/download';
import { 
  Users, 
  Shield, 
  Grid, 
  Key,
  Building2,
  UserCheck, 
  History,
  Sliders,
  Download
} from 'lucide-react';
import { 
  MOCK_USERS, 
  MOCK_ROLES, 
  MOCK_RAW_PERMISSIONS,
  MOCK_AUDIT_LOGS 
} from '../../data/mockUserSettingsData';
import { 
  UserAccount, 
  RoleDefinition, 
  SystemRole, 
  ModulePermission, 
  AppModuleName,
  RawPermissionDefinition,
  ClientMapping,
  AccessAuditLogEntry 
} from '../../types/userSettings';

// Section Components
import { UsersAndAccessSection } from './UsersAndAccessSection';
import { RolesSection } from './RolesSection';
import { PermissionMatrixSection } from './PermissionMatrixSection';
import { PermissionRegistrySection } from './PermissionRegistrySection';
import { ClientAccessMappingSection } from './ClientAccessMappingSection';
import { MyAccessSection } from './MyAccessSection';
import { AccessAuditLogSection } from './AccessAuditLogSection';

// Drawers & Modals
import { AddEditUserDrawer } from './AddEditUserDrawer';
import { ManageUserAccessDrawer } from './ManageUserAccessDrawer';
import { EditRolePermissionsDrawer } from './EditRolePermissionsDrawer';
import { RoleAssignmentDrawer } from './RoleAssignmentDrawer';
import { LinkCandidateAccountModal } from './LinkCandidateAccountModal';
import { EditClientMappingModal } from './EditClientMappingModal';

import { useToast } from '../../hooks/useToast';
import { Toast } from '../../components/ui/Toast';

export type UserSettingsTab = 
  | 'users' 
  | 'roles' 
  | 'matrix' 
  | 'registry' 
  | 'clients' 
  | 'my-access' 
  | 'audit';

interface UserSettingsModuleProps {
  initialActiveTab?: UserSettingsTab;
  appActiveRole?: string; // from topbar persona switcher
}

export const UserSettingsModule: React.FC<UserSettingsModuleProps> = ({
  initialActiveTab = 'users',
  appActiveRole = 'admin',
}) => {
  // Current logged in persona mapped to our SystemRole
  const [currentUserRole, setCurrentUserRole] = useState<SystemRole>(
    appActiveRole === 'superadmin' ? 'Super Admin' : appActiveRole === 'admin' ? 'Admin' : 'HR'
  );

  // Sync if appActiveRole changes from header
  useEffect(() => {
    if (appActiveRole === 'superadmin') setCurrentUserRole('Super Admin');
    else if (appActiveRole === 'admin') setCurrentUserRole('Admin');
    else setCurrentUserRole('HR');
  }, [appActiveRole]);

  // Current logged in user object based on active role
  const currentUserId = 
    currentUserRole === 'Super Admin' ? 'usr-1' :
    currentUserRole === 'Admin' ? 'usr-3' : 'usr-6';

  // Persistent state management for users, roles, permissions, and audit logs
  const [users, setUsers] = useState<UserAccount[]>(MOCK_USERS);
  const [roles, setRoles] = useState<RoleDefinition[]>(MOCK_ROLES);
  const [rawPermissions, setRawPermissions] = useState<RawPermissionDefinition[]>(MOCK_RAW_PERMISSIONS);
  const [auditLogs, setAuditLogs] = useState<AccessAuditLogEntry[]>(MOCK_AUDIT_LOGS);

  // Active section inside User Settings (1 to 7)
  const [activeSection, setActiveSection] = useState<UserSettingsTab>(
    currentUserRole === 'HR' ? 'my-access' : initialActiveTab
  );

  // Selection for Permission Matrix
  const [selectedRoleForMatrix, setSelectedRoleForMatrix] = useState<string>('Admin');

  // Modals & Drawers State
  const [isAddEditDrawerOpen, setIsAddEditDrawerOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);

  const [isManageAccessDrawerOpen, setIsManageAccessDrawerOpen] = useState(false);
  const [accessTargetUser, setAccessTargetUser] = useState<UserAccount | null>(null);

  const [isEditRoleDrawerOpen, setIsEditRoleDrawerOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleDefinition | null>(null);

  const [isLinkCandidateModalOpen, setIsLinkCandidateModalOpen] = useState(false);
  const [linkCandidateUser, setLinkCandidateUser] = useState<UserAccount | null>(null);

  const [isClientMappingModalOpen, setIsClientMappingModalOpen] = useState(false);
  const [clientMappingUser, setClientMappingUser] = useState<UserAccount | null>(null);

  // Quick Role Assignment drawer state
  const [isAssignDrawerOpen, setIsAssignDrawerOpen] = useState(false);
  const [assignUserTarget, setAssignUserTarget] = useState<UserAccount | null>(null);

  // Toast feedback
  const { message: toastMessage, showToast } = useToast();

  const currentUserObj = users.find(u => u.id === currentUserId) || users[2];
  const adminRoleDef = roles.find(r => r.name === 'Admin') || roles[1];
  const hrRoleDef = roles.find(r => r.name === 'HR') || roles[2];
  const allAdmins = users.filter(u => u.role === 'Admin' || u.role === 'Super Admin');

  // Helper to record audit log
  const logAuditEntry = (
    userAffected: { id: string; name: string; email: string },
    oldRole: SystemRole | string,
    newRole: SystemRole | string,
    permissionChanged: string,
    remarks: string,
    clientMappingChanged?: string
  ) => {
    const entry: AccessAuditLogEntry = {
      id: `aud-${Date.now()}`,
      timestamp: 'Just now',
      changedBy: { id: currentUserObj.id, name: currentUserObj.name, role: currentUserRole },
      userAffected,
      oldRole: oldRole as SystemRole,
      newRole: newRole as SystemRole,
      permissionChanged,
      clientMappingChanged,
      remarks
    };
    setAuditLogs(prev => [entry, ...prev]);
  };

  // =========================================================================
  // USER ACTIONS
  // =========================================================================
  const handleOpenAddUser = () => {
    setEditingUser(null);
    setIsAddEditDrawerOpen(true);
  };

  const handleOpenEditUser = (user: UserAccount) => {
    setEditingUser(user);
    setIsAddEditDrawerOpen(true);
  };

  const handleSaveUser = (userData: Partial<UserAccount>) => {
    if (editingUser) {
      // Editing existing user
      setUsers(prev => prev.map(u => u.id === editingUser.id ? { ...u, ...userData } : u));
      logAuditEntry(
        { id: editingUser.id, name: userData.name || editingUser.name, email: userData.email || editingUser.email },
        editingUser.role,
        userData.role || editingUser.role,
        `Profile details updated: Role: ${userData.role || editingUser.role}, Status: ${userData.status || editingUser.status}`,
        `Profile updated by ${currentUserObj.name}`
      );
      showToast(`User "${userData.name || editingUser.name}" successfully updated.`);
    } else {
      // Adding new user
      const newId = `usr-${Date.now().toString().slice(-4)}`;
      const newUser: UserAccount = {
        id: newId,
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        name: userData.name || `${userData.firstName} ${userData.lastName}`.trim(),
        email: userData.email || '',
        mobileNo: userData.mobileNo || '',
        employeeCode: userData.employeeCode || `2CS-${Date.now().toString().slice(-3)}`,
        dob: userData.dob || '1995-01-01',
        dateOfJoining: userData.dateOfJoining || '2026-01-01',
        memberSince: 'October 2026',
        role: userData.role || 'HR',
        reportingManagerId: userData.reportingManagerId || currentUserId,
        reportingManagerName: userData.reportingManagerName || currentUserObj.name,
        status: userData.status || 'Active',
        lastLogin: 'Never',
        department: userData.department || 'Talent Operations',
        allowedModules: userData.allowedModules || ['Dashboard', 'Candidate Directory'],
        mappedCandidateId: userData.mappedCandidateId,
        mappedCandidateName: userData.mappedCandidateName,
        mappedCandidateUserId: userData.mappedCandidateUserId,
        mappedCandidateEmail: userData.mappedCandidateEmail,
        mappedClients: userData.mappedClients || [
          {
            clientId: 'client-2coms',
            clientName: '2COMS Services',
            clientCode: '2CS',
            locationNames: ['Kolkata'],
            branchNames: ['City Level'],
            candidateAccessScope: 'All Candidates'
          }
        ]
      };
      setUsers(prev => [newUser, ...prev]);
      logAuditEntry(
        { id: newUser.id, name: newUser.name, email: newUser.email },
        'None',
        newUser.role,
        `New account provisioned with role ${newUser.role}`,
        `Account onboarded by ${currentUserObj.name}`
      );
      showToast(`New user "${newUser.name}" successfully provisioned.`);
    }
    setIsAddEditDrawerOpen(false);
    setEditingUser(null);
  };

  const handleToggleUserStatus = (userId: string) => {
    const target = users.find(u => u.id === userId);
    if (!target) return;
    const nextStatus = target.status === 'Active' ? 'Non Active' : 'Active';

    setUsers(prev => prev.map(u => u.id === userId ? { ...u, status: nextStatus } : u));
    logAuditEntry(
      { id: target.id, name: target.name, email: target.email },
      target.role,
      target.role,
      `Account status changed to ${nextStatus}`,
      `Status toggled by ${currentUserObj.name}`
    );
    showToast(`User "${target.name}" status updated to ${nextStatus}.`);
  };

  const handleOpenManageAccess = (user: UserAccount) => {
    setAccessTargetUser(user);
    setIsManageAccessDrawerOpen(true);
  };

  const handleSaveUserAccess = (userId: string, updates: {
    customOverrides?: Record<string, boolean>;
    menuPermissions?: Partial<Record<AppModuleName, boolean>>;
  }) => {
    const target = users.find(u => u.id === userId);
    if (!target) return;

    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        return {
          ...u,
          customOverrides: updates.customOverrides ? { ...(u.customOverrides || {}), ...updates.customOverrides } : u.customOverrides,
          menuPermissions: updates.menuPermissions ? { ...(u.menuPermissions || {}), ...updates.menuPermissions } : u.menuPermissions,
        };
      }
      return u;
    }));

    logAuditEntry(
      { id: target.id, name: target.name, email: target.email },
      target.role,
      target.role,
      `Updated user-specific access overrides and menu permissions.`,
      `Custom permissions adjusted by ${currentUserObj.name}`
    );
    showToast(`Access permissions updated for ${target.name}.`);
    setIsManageAccessDrawerOpen(false);
  };

  // Link candidate account
  const handleOpenLinkCandidate = (user: UserAccount) => {
    setLinkCandidateUser(user);
    setIsLinkCandidateModalOpen(true);
  };

  const handleSaveLinkedCandidate = (
    userId: string, 
    candidate: { id: string; name: string; userId: string; email: string } | null
  ) => {
    const target = users.find(u => u.id === userId);
    if (!target) return;

    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        return {
          ...u,
          mappedCandidateId: candidate?.id,
          mappedCandidateName: candidate?.name,
          mappedCandidateUserId: candidate?.userId,
          mappedCandidateEmail: candidate?.email,
        };
      }
      return u;
    }));

    logAuditEntry(
      { id: target.id, name: target.name, email: target.email },
      target.role,
      target.role,
      candidate ? `Linked candidate account [${candidate.userId}] (${candidate.name})` : `Unlinked candidate account`,
      `Candidate linkage modified by ${currentUserObj.name}`
    );

    showToast(
      candidate 
        ? `Linked ${target.name} to candidate profile ${candidate.name} (${candidate.userId}).`
        : `Candidate linkage removed for ${target.name}.`
    );
    setIsLinkCandidateModalOpen(false);
    setLinkCandidateUser(null);
  };

  // Client mapping modal
  const handleOpenClientMapping = (user: UserAccount) => {
    setClientMappingUser(user);
    setIsClientMappingModalOpen(true);
  };

  const handleSaveClientMappings = (userId: string, updatedMappings: ClientMapping[]) => {
    const target = users.find(u => u.id === userId);
    if (!target) return;

    setUsers(prev => prev.map(u => u.id === userId ? { ...u, mappedClients: updatedMappings } : u));
    logAuditEntry(
      { id: target.id, name: target.name, email: target.email },
      target.role,
      target.role,
      `Updated mapped client accounts (${updatedMappings.length} clients mapped)`,
      `Client access mapping saved by ${currentUserObj.name}`,
      updatedMappings.map(m => m.clientName).join(', ')
    );
    showToast(`Client mappings updated for ${target.name}.`);
    setIsClientMappingModalOpen(false);
    setClientMappingUser(null);
  };

  // Export Mapped Client Report to real CSV
  const handleExportMappedClientReport = () => {
    let csv = `Employee Code,User Name,Email,Role,Status,Mapped Client,Client Code,Permitted Locations,Permitted Branches,Candidate Access Scope\n`;
    
    users.forEach((u) => {
      if (!u.mappedClients || u.mappedClients.length === 0) {
        csv += `"${u.employeeCode}","${u.name}","${u.email}","${u.role}","${u.status}","None","-","-","-","-"\n`;
      } else {
        u.mappedClients.forEach((m) => {
          csv += `"${u.employeeCode}","${u.name}","${u.email}","${u.role}","${u.status}","${m.clientName}","${m.clientCode}","${m.locationNames.join(', ')}","${m.branchNames.join(', ')}","${m.candidateAccessScope}"\n`;
        });
      }
    });

    downloadCsv(csv, `Mapped_Client_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    showToast('Mapped Client Report downloaded successfully (CSV).');
  };

  // =========================================================================
  // ROLES ACTIONS
  // =========================================================================
  const handleOpenEditRole = (role: RoleDefinition) => {
    setEditingRole(role);
    setIsEditRoleDrawerOpen(true);
  };

  const handleSaveRole = (updatedRole: RoleDefinition) => {
    setRoles(prev => prev.map(r => r.id === updatedRole.id ? updatedRole : r));
    logAuditEntry(
      { id: 'role-global', name: `${updatedRole.name} Role`, email: 'governance@system' },
      updatedRole.name,
      updatedRole.name,
      `Updated granular permissions and module access for role "${updatedRole.name}"`,
      `Role configuration modified by ${currentUserObj.name}`
    );
    showToast(`Role "${updatedRole.name}" permissions updated.`);
    setIsEditRoleDrawerOpen(false);
    setEditingRole(null);
  };

  const handleDuplicateRole = (sourceRole: RoleDefinition) => {
    const newRole: RoleDefinition = {
      id: `role-${Date.now()}`,
      name: `${sourceRole.name} (Copy)`,
      description: `Cloned from ${sourceRole.name}. Ready for custom permission assignment.`,
      userCount: 0,
      allowedModules: [...sourceRole.allowedModules],
      permissions: JSON.parse(JSON.stringify(sourceRole.permissions)),
      rawPermissionKeys: [...(sourceRole.rawPermissionKeys || [])],
      isSystem: false,
      lastUpdated: 'Just now'
    };
    setRoles(prev => [...prev, newRole]);
    logAuditEntry(
      { id: 'role-new', name: `${newRole.name} Role`, email: 'governance@system' },
      sourceRole.name,
      newRole.name,
      `Duplicated role "${sourceRole.name}" to create "${newRole.name}"`,
      `Role duplication performed by ${currentUserObj.name}`
    );
    showToast(`Role duplicated as "${newRole.name}". You can now customize its permissions.`);
  };

  const handleAddNewRole = () => {
    const newRole: RoleDefinition = {
      id: `role-${Date.now()}`,
      name: 'Custom Role',
      description: 'Customized role with selective module and action access.',
      userCount: 0,
      allowedModules: ['Dashboard', 'Candidate Directory'],
      permissions: JSON.parse(JSON.stringify(hrRoleDef.permissions)),
      isSystem: false,
      lastUpdated: 'Just now'
    };
    setRoles(prev => [...prev, newRole]);
    setEditingRole(newRole);
    setIsEditRoleDrawerOpen(true);
  };

  // Matrix save
  const handleSaveRolePermissionsFromMatrix = (
    roleName: string, 
    updatedPermissions: Record<AppModuleName, ModulePermission>
  ) => {
    setRoles(prev => prev.map(r => {
      if (r.name === roleName) {
        return {
          ...r,
          permissions: updatedPermissions,
          lastUpdated: 'Just now'
        };
      }
      return r;
    }));

    logAuditEntry(
      { id: 'role-matrix', name: `${roleName} Role`, email: 'matrix@system' },
      roleName,
      roleName,
      `Updated full permission matrix for role "${roleName}"`,
      `Matrix updated by ${currentUserObj.name}`
    );
    showToast(`Permission matrix for role "${roleName}" saved successfully.`);
  };

  // =========================================================================
  // RAW PERMISSION REGISTRY ACTIONS
  // =========================================================================
  const handleAddPermissionToRegistry = (perm: Omit<RawPermissionDefinition, 'id'>) => {
    const newPerm: RawPermissionDefinition = {
      id: `perm-${Date.now().toString().slice(-4)}`,
      ...perm,
      isSystem: false
    };
    setRawPermissions(prev => [...prev, newPerm]);
    logAuditEntry(
      { id: 'registry', name: 'Permission Registry', email: 'registry@system' },
      'Core',
      'Registry',
      `Registered new system permission key: [${perm.technicalKey}] in ${perm.module}`,
      `Permission created by ${currentUserObj.name}`
    );
    showToast(`Permission key "${perm.technicalKey}" added to registry.`);
  };

  const handleUpdatePermissionInRegistry = (id: string, updates: Partial<RawPermissionDefinition>) => {
    setRawPermissions(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    showToast('Permission registry definition updated.');
  };

  const handleDeletePermissionFromRegistry = (id: string) => {
    const target = rawPermissions.find(p => p.id === id);
    if (!target) return;
    setRawPermissions(prev => prev.filter(p => p.id !== id));
    logAuditEntry(
      { id: 'registry', name: 'Permission Registry', email: 'registry@system' },
      'Registry',
      'Deleted',
      `Deleted permission key: [${target.technicalKey}] from ${target.module}`,
      `Permission deleted by ${currentUserObj.name}`
    );
    showToast(`Permission key "${target.technicalKey}" removed from registry.`);
  };

  return (
    <div className="flex-1 min-h-screen flex flex-col transition-colors duration-150 text-slate-900 dark:text-slate-100">
      {/* Toast Notification */}
      <Toast message={toastMessage} variant="solid" />

      {/* Top Module Subheader with 7 Tabs (Non-overlapping, responsive horizontal scroll) */}
      <div className="border-b px-3 sm:px-6 transition-colors bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-2xs sticky top-0 z-20">
        <div className="max-w-7xl mx-auto flex flex-col xl:flex-row xl:items-center justify-between gap-3 py-3">
          {/* Left: Breadcrumb & Simulated Persona Selector */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 dark:text-slate-400">Governance & Security</span>
              <span className="text-slate-300 dark:text-slate-600">/</span>
              <span className="font-bold text-sm flex items-center gap-1.5 text-slate-900 dark:text-white">
                <Shield className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
                <span className="whitespace-nowrap">User Settings</span>
              </span>
            </div>

            {/* Persona Switcher to inspect role-based behaviors */}
            <div className="flex items-center gap-1.5 sm:pl-3 sm:border-l border-slate-200 dark:border-slate-800 text-xs shrink-0 overflow-x-auto no-scrollbar py-0.5">
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold whitespace-nowrap">Active Persona:</span>
              <button
                type="button"
                onClick={() => {
                  setCurrentUserRole('Super Admin');
                  showToast('Operating as Super Admin (Full access to all accounts & settings)');
                }}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold border transition-colors whitespace-nowrap shrink-0 ${
                  currentUserRole === 'Super Admin'
                    ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                Super Admin
              </button>
              <button
                type="button"
                onClick={() => {
                  setCurrentUserRole('Admin');
                  showToast('Operating as Admin (Can manage only assigned HR team members)');
                }}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold border transition-colors whitespace-nowrap shrink-0 ${
                  currentUserRole === 'Admin'
                    ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                Admin
              </button>
              <button
                type="button"
                onClick={() => {
                  setCurrentUserRole('HR');
                  setActiveSection('my-access');
                  showToast('Operating as HR (Read-only access to own profile & allowed modules)');
                }}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold border transition-colors whitespace-nowrap shrink-0 ${
                  currentUserRole === 'HR'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                HR
              </button>
            </div>
          </div>

          {/* Right: Section Navigation Tabs (All 7 Sections with responsive horizontal scroll) */}
          <div className="w-full xl:w-auto overflow-x-auto no-scrollbar pb-0.5 shrink-0">
            <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 w-max shrink-0">
              {/* 1. Users & Access */}
              <button
                type="button"
                onClick={() => setActiveSection('users')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 shrink-0 ${
                  activeSection === 'users'
                    ? 'bg-white dark:bg-sky-600 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Users className="w-3.5 h-3.5 shrink-0" />
                <span>Users & Access</span>
              </button>

              {/* 2. Roles */}
              <button
                type="button"
                onClick={() => setActiveSection('roles')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 shrink-0 ${
                  activeSection === 'roles'
                    ? 'bg-white dark:bg-sky-600 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Shield className="w-3.5 h-3.5 shrink-0" />
                <span>Roles</span>
              </button>

              {/* 3. Permission Matrix */}
              <button
                type="button"
                onClick={() => setActiveSection('matrix')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 shrink-0 ${
                  activeSection === 'matrix'
                    ? 'bg-white dark:bg-sky-600 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Grid className="w-3.5 h-3.5 shrink-0" />
                <span>Permission Matrix</span>
              </button>

              {/* 4. Permission Registry */}
              <button
                type="button"
                onClick={() => setActiveSection('registry')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 shrink-0 ${
                  activeSection === 'registry'
                    ? 'bg-white dark:bg-sky-600 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Key className="w-3.5 h-3.5 shrink-0" />
                <span>Permission Registry</span>
              </button>

              {/* 5. Client Access Mapping */}
              <button
                type="button"
                onClick={() => setActiveSection('clients')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 shrink-0 ${
                  activeSection === 'clients'
                    ? 'bg-white dark:bg-sky-600 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Building2 className="w-3.5 h-3.5 shrink-0" />
                <span>Client Access Mapping</span>
              </button>

              {/* 6. My Access (Read-only personal access) */}
              <button
                type="button"
                onClick={() => setActiveSection('my-access')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 shrink-0 ${
                  activeSection === 'my-access'
                    ? 'bg-white dark:bg-sky-600 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5 shrink-0" />
                <span>My Access</span>
              </button>

              {/* 7. Access Audit Log */}
              {currentUserRole !== 'HR' && (
                <button
                  type="button"
                  onClick={() => setActiveSection('audit')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 shrink-0 ${
                    activeSection === 'audit'
                      ? 'bg-white dark:bg-sky-600 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <History className="w-3.5 h-3.5 shrink-0" />
                  <span>Access Audit Log</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Body */}
      <div className="flex-1 p-3 sm:p-6 max-w-7xl mx-auto w-full">
        {/* 1. USERS & ACCESS */}
        {activeSection === 'users' && (
          <UsersAndAccessSection
            users={users}
            currentUserRole={currentUserRole}
            currentUserId={currentUserId}
            onOpenAddUser={handleOpenAddUser}
            onOpenEditUser={handleOpenEditUser}
            onOpenManageAccess={handleOpenManageAccess}
            onOpenLinkCandidate={handleOpenLinkCandidate}
            onOpenClientMapping={handleOpenClientMapping}
            onToggleStatus={handleToggleUserStatus}
            onExportMappedClientReport={handleExportMappedClientReport}
          />
        )}

        {/* 2. ROLES */}
        {activeSection === 'roles' && (
          <RolesSection
            roles={roles}
            currentUserRole={currentUserRole}
            onEditRole={handleOpenEditRole}
            onViewPermissions={(roleName) => {
              setSelectedRoleForMatrix(roleName);
              setActiveSection('matrix');
            }}
            onDuplicateRole={handleDuplicateRole}
            onAddNewRole={handleAddNewRole}
          />
        )}

        {/* 3. PERMISSION MATRIX */}
        {activeSection === 'matrix' && (
          <PermissionMatrixSection
            roles={roles}
            selectedRoleName={selectedRoleForMatrix}
            onSelectRole={setSelectedRoleForMatrix}
            currentUserRole={currentUserRole}
            currentUserId={currentUserId}
            adminPermissions={adminRoleDef.permissions}
            onSaveRolePermissions={handleSaveRolePermissionsFromMatrix}
          />
        )}

        {/* 4. PERMISSION REGISTRY */}
        {activeSection === 'registry' && (
          <PermissionRegistrySection
            permissions={rawPermissions}
            currentUserRole={currentUserRole}
            onAddPermission={handleAddPermissionToRegistry}
            onUpdatePermission={handleUpdatePermissionInRegistry}
            onDeletePermission={handleDeletePermissionFromRegistry}
          />
        )}

        {/* 5. CLIENT ACCESS MAPPING */}
        {activeSection === 'clients' && (
          <ClientAccessMappingSection
            users={users}
            currentUserRole={currentUserRole}
            onUpdateClientMappings={handleSaveClientMappings}
            onShowToast={showToast}
          />
        )}

        {/* 6. MY ACCESS */}
        {activeSection === 'my-access' && (
          <MyAccessSection
            currentUser={currentUserObj}
            roleDefinition={currentUserRole === 'Super Admin' ? roles[0] : currentUserRole === 'Admin' ? adminRoleDef : hrRoleDef}
          />
        )}

        {/* 7. ACCESS AUDIT LOG */}
        {activeSection === 'audit' && (
          <AccessAuditLogSection
            logs={auditLogs}
          />
        )}
      </div>

      {/* DRAWERS & MODALS */}
      {/* Add / Edit User Drawer */}
      <AddEditUserDrawer
        isOpen={isAddEditDrawerOpen}
        onClose={() => {
          setIsAddEditDrawerOpen(false);
          setEditingUser(null);
        }}
        user={editingUser}
        roles={roles}
        allAdmins={allAdmins}
        currentUserRole={currentUserRole}
        onSaveUser={handleSaveUser}
      />

      {/* Manage User Access Drawer */}
      <ManageUserAccessDrawer
        isOpen={isManageAccessDrawerOpen}
        onClose={() => {
          setIsManageAccessDrawerOpen(false);
          setAccessTargetUser(null);
        }}
        user={accessTargetUser}
        roles={roles}
        currentUserRole={currentUserRole}
        onSaveAccess={handleSaveUserAccess}
      />

      {/* Edit Role Permissions Drawer */}
      <EditRolePermissionsDrawer
        isOpen={isEditRoleDrawerOpen}
        onClose={() => {
          setIsEditRoleDrawerOpen(false);
          setEditingRole(null);
        }}
        role={editingRole}
        currentUserRole={currentUserRole}
        adminPermissions={adminRoleDef.permissions}
        onSaveRole={handleSaveRole}
      />

      {/* Link Candidate Account Modal */}
      <LinkCandidateAccountModal
        isOpen={isLinkCandidateModalOpen}
        onClose={() => {
          setIsLinkCandidateModalOpen(false);
          setLinkCandidateUser(null);
        }}
        user={linkCandidateUser}
        onLinkCandidate={handleSaveLinkedCandidate}
      />

      {/* Edit Client Mapping Modal */}
      <EditClientMappingModal
        isOpen={isClientMappingModalOpen}
        onClose={() => {
          setIsClientMappingModalOpen(false);
          setClientMappingUser(null);
        }}
        user={clientMappingUser}
        onSaveMappings={handleSaveClientMappings}
      />
    </div>
  );
};
