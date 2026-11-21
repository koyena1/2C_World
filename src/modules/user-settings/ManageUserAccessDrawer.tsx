import React, { useState, useMemo } from 'react';
import { 
  X, 
  Shield, 
  Key, 
  Layers, 
  Building2, 
  UserCheck, 
  Search, 
  ChevronDown, 
  ChevronRight, 
  Check, 
  AlertTriangle, 
  Lock, 
  Unlock, 
  Save, 
  RotateCcw,
  Sliders,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Eye,
  Plus,
  Edit3,
  Trash2
} from 'lucide-react';
import { 
  UserAccount, 
  RoleDefinition, 
  AppModuleName, 
  ALL_APP_MODULES, 
  PERMISSION_ACTIONS, 
  ModulePermission,
  RawPermissionDefinition 
} from '../../types/userSettings';
import { MOCK_RAW_PERMISSIONS } from '../../data/mockUserSettingsData';

import { SelectMenu } from '../../components/ui/SelectMenu';
interface ManageUserAccessDrawerProps {
  user: UserAccount | null;
  isOpen: boolean;
  onClose: () => void;
  roles: RoleDefinition[];
  currentUserRole: string;
  onSaveAccess: (userId: string, updates: {
    customOverrides?: Record<string, boolean>;
    menuPermissions?: Partial<Record<AppModuleName, boolean>>;
  }) => void;
}

export const ManageUserAccessDrawer: React.FC<ManageUserAccessDrawerProps> = ({
  user,
  isOpen,
  onClose,
  roles,
  currentUserRole,
  onSaveAccess,
}) => {
  const [activeTab, setActiveTab] = useState<'inherited' | 'overrides' | 'menu' | 'clients'>('inherited');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterModule, setFilterModule] = useState<string>('All');
  const [filterState, setFilterState] = useState<'all' | 'enabled' | 'disabled'>('all');
  
  // Accordions expanded state
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({
    'Dashboard': true,
    'Candidate Directory': true,
    'KYC Verification Desk': true
  });

  // Local overrides state (technicalKey -> boolean)
  const [overrides, setOverrides] = useState<Record<string, boolean>>({});
  const [menuAccess, setMenuAccess] = useState<Partial<Record<AppModuleName, boolean>>>({});
  const [hasChanges, setHasChanges] = useState(false);

  // Sync state on user change
  React.useEffect(() => {
    if (user) {
      setOverrides(user.customOverrides || {});
      setMenuAccess(user.menuPermissions || {});
      setHasChanges(false);
      setSearchQuery('');
    }
  }, [user, isOpen]);

  // Find user's current role definition
  const userRole = useMemo(() => {
    if (!user) return roles[0];
    return roles.find((r) => r.name === user.role) || roles[0];
  }, [user, roles]);

  // Determine if active user can edit this user's access:
  // Super Admin can edit all.
  // Admin can edit only HRs (and cannot grant permissions Admin doesn't have).
  // HR cannot edit anything.
  const canEdit = useMemo(() => {
    if (currentUserRole === 'Super Admin') return true;
    if (currentUserRole === 'Admin') {
      return user?.role === 'HR' || user?.role === 'HR-Onboarding' || user?.role === 'HR-Payroll' || user?.role === 'HR-Engagement';
    }
    return false;
  }, [currentUserRole, user]);

  if (!isOpen || !user) return null;

  // Toggle accordion
  const toggleAccordion = (moduleName: string) => {
    setExpandedModules((prev) => ({
      ...prev,
      [moduleName]: !prev[moduleName],
    }));
  };

  const expandAll = () => {
    const allExp: Record<string, boolean> = {};
    ALL_APP_MODULES.forEach((m) => {
      allExp[m.id] = true;
    });
    setExpandedModules(allExp);
  };

  const collapseAll = () => {
    setExpandedModules({});
  };

  // Toggle an override on a raw permission key
  const handleToggleOverride = (key: string, currentlyEffective: boolean) => {
    if (!canEdit) return;
    const newOverrides = { ...overrides };
    if (newOverrides[key] !== undefined) {
      delete newOverrides[key]; // revert to role default
    } else {
      newOverrides[key] = !currentlyEffective; // explicitly toggle
    }
    setOverrides(newOverrides);
    setHasChanges(true);
  };

  // Toggle menu item access
  const handleToggleMenu = (moduleName: AppModuleName) => {
    if (!canEdit) return;
    const current = menuAccess[moduleName] !== undefined 
      ? menuAccess[moduleName] 
      : userRole.allowedModules.includes(moduleName);
    
    setMenuAccess({
      ...menuAccess,
      [moduleName]: !current,
    });
    setHasChanges(true);
  };

  const handleSave = () => {
    onSaveAccess(user.id, {
      customOverrides: overrides,
      menuPermissions: menuAccess,
    });
    onClose();
  };

  const handleReset = () => {
    setOverrides(user.customOverrides || {});
    setMenuAccess(user.menuPermissions || {});
    setHasChanges(false);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-150">
      <div 
        className="w-full max-w-3xl bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col h-full transform transition-transform"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header with User Summary */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850">
          <div className="flex items-center justify-between pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 flex items-center justify-center font-bold">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Manage Access & Permissions</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                    canEdit 
                      ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                  }`}>
                    {canEdit ? 'Editable' : 'Read-Only Mode'}
                  </span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Granular RBAC governance, module accordions, user-level overrides & menu bindings
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Summary Card Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-xs">
            <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <span className="text-[10px] font-semibold text-slate-400 block uppercase">User & ID</span>
              <span className="font-bold text-slate-900 dark:text-white truncate block">{user.name}</span>
              <span className="font-mono text-[10px] text-slate-500">{user.employeeCode}</span>
            </div>

            <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <span className="text-[10px] font-semibold text-slate-400 block uppercase">Role & Status</span>
              <span className="font-bold text-sky-700 dark:text-sky-300 block">{user.role}</span>
              <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400">{user.status}</span>
            </div>

            <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <span className="text-[10px] font-semibold text-slate-400 block uppercase">Reporting To</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 truncate block">
                {user.reportingManagerName || 'None (Super Admin)'}
              </span>
              <span className="text-[10px] text-slate-400 truncate block">{user.department}</span>
            </div>

            <div className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <span className="text-[10px] font-semibold text-slate-400 block uppercase">Candidate & Clients</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 block truncate">
                {user.mappedCandidateName ? user.mappedCandidateName : 'No Candidate Link'}
              </span>
              <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold">
                {user.mappedClients?.length || 0} Clients Mapped
              </span>
            </div>
          </div>
        </div>

        {/* Access Sections Tabs */}
        <div className="px-4 sm:px-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between text-xs overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1 py-2">
            <button
              type="button"
              onClick={() => setActiveTab('inherited')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'inherited'
                  ? 'bg-sky-50 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Role Inherited Permissions</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('overrides')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'overrides'
                  ? 'bg-sky-50 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Direct User Overrides</span>
              {Object.keys(overrides).length > 0 && (
                <span className="w-4 h-4 rounded-full bg-purple-600 text-white text-[10px] flex items-center justify-center font-bold">
                  {Object.keys(overrides).length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('menu')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'menu'
                  ? 'bg-sky-50 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Menu / Module Access</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('clients')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === 'clients'
                  ? 'bg-sky-50 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Client Access Mapping</span>
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* TAB 1: Role Inherited Permissions & Granular Accordions */}
          {activeTab === 'inherited' && (
            <div className="space-y-4">
              {/* Search & Filter Toolbar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                <div className="relative flex-1 max-w-sm">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search permissions by label or key..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-1 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <SelectMenu
                    value={filterModule}
                    onChange={(e) => setFilterModule(e.target.value)}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium"
                  >
                    <option value="All">All Modules</option>
                    {ALL_APP_MODULES.map((m) => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </SelectMenu>

                  <SelectMenu
                    value={filterState}
                    onChange={(e) => setFilterState(e.target.value as any)}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-medium"
                  >
                    <option value="all">All States</option>
                    <option value="enabled">Enabled Only</option>
                    <option value="disabled">Disabled Only</option>
                  </SelectMenu>

                  <div className="flex items-center gap-1 pl-1">
                    <button
                      type="button"
                      onClick={expandAll}
                      className="px-2 py-1 text-[11px] rounded font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    >
                      Expand All
                    </button>
                    <span>·</span>
                    <button
                      type="button"
                      onClick={collapseAll}
                      className="px-2 py-1 text-[11px] rounded font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    >
                      Collapse All
                    </button>
                  </div>
                </div>
              </div>

              {/* Module Accordions */}
              <div className="space-y-3">
                {ALL_APP_MODULES.filter((m) => filterModule === 'All' || m.id === filterModule).map((mod) => {
                  const isExpanded = Boolean(expandedModules[mod.id]);
                  const rolePerm = userRole.permissions[mod.id] || {
                    view: false, create: false, edit: false, delete: false, approve: false, export: false, send: false
                  };

                  // Relevant raw permissions for this module
                  const rawPerms = MOCK_RAW_PERMISSIONS.filter((p) => p.module === mod.id);

                  // Filtering raw perms
                  const visibleRawPerms = rawPerms.filter((p) => {
                    if (searchQuery.trim()) {
                      const q = searchQuery.toLowerCase().trim();
                      if (!p.name.toLowerCase().includes(q) && !p.technicalKey.toLowerCase().includes(q)) {
                        return false;
                      }
                    }
                    const isEffective = overrides[p.technicalKey] !== undefined 
                      ? overrides[p.technicalKey] 
                      : (rolePerm as any)[p.action] || false;
                    
                    if (filterState === 'enabled' && !isEffective) return false;
                    if (filterState === 'disabled' && isEffective) return false;
                    return true;
                  });

                  if (searchQuery.trim() && visibleRawPerms.length === 0) return null;

                  return (
                    <div
                      key={mod.id}
                      className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-2xs"
                    >
                      {/* Accordion Header */}
                      <button
                        type="button"
                        onClick={() => toggleAccordion(mod.id)}
                        className="w-full p-3.5 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-slate-400" />
                          )}
                          <div>
                            <span className="font-bold text-xs text-slate-900 dark:text-white">
                              {mod.name}
                            </span>
                            <span className="text-[11px] text-slate-400 ml-2">
                              ({mod.category})
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-xs">
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            rolePerm.view
                              ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                          }`}>
                            {rolePerm.view ? 'Module Access Active' : 'Module Restricted'}
                          </span>
                        </div>
                      </button>

                      {/* Accordion Body */}
                      {isExpanded && (
                        <div className="border-t border-slate-100 dark:border-slate-800 p-3.5 space-y-3 bg-slate-50/40 dark:bg-slate-950/30">
                          {/* Standard CRUD Action Pills */}
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                              Inherited Action Rights ({user.role})
                            </span>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                              {PERMISSION_ACTIONS.map((act) => {
                                const isGranted = Boolean((rolePerm as any)[act.key]);
                                return (
                                  <div
                                    key={act.key}
                                    className={`p-2 rounded-lg border flex items-center justify-between ${
                                      isGranted
                                        ? 'bg-white dark:bg-slate-900 border-emerald-200 dark:border-emerald-900/60 text-slate-900 dark:text-white'
                                        : 'bg-slate-100/60 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500'
                                    }`}
                                  >
                                    <span className="font-semibold text-[11px]">{act.label}</span>
                                    {isGranted ? (
                                      <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                    ) : (
                                      <Lock className="w-3.5 h-3.5 text-slate-400" />
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Raw Granular Permissions Registry List */}
                          {visibleRawPerms.length > 0 && (
                            <div className="pt-2">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                                Granular Technical Permission Registry
                              </span>
                              <div className="space-y-1.5">
                                {visibleRawPerms.map((rp) => {
                                  const isOverridden = overrides[rp.technicalKey] !== undefined;
                                  const effectiveVal = isOverridden 
                                    ? overrides[rp.technicalKey] 
                                    : Boolean((rolePerm as any)[rp.action]);

                                  return (
                                    <div
                                      key={rp.id}
                                      className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between text-xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                                    >
                                      <div className="pr-2">
                                        <div className="flex items-center gap-2">
                                          <span className="font-bold text-slate-900 dark:text-white">
                                            {rp.name}
                                          </span>
                                          <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                            {rp.technicalKey}
                                          </span>
                                          {isOverridden && (
                                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-800">
                                              User Override
                                            </span>
                                          )}
                                        </div>
                                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                          {rp.description}
                                        </p>
                                      </div>

                                      <div className="flex items-center gap-2 shrink-0">
                                        {canEdit ? (
                                          <button
                                            type="button"
                                            onClick={() => handleToggleOverride(rp.technicalKey, effectiveVal)}
                                            className={`px-3 py-1 rounded-md text-xs font-bold transition-colors ${
                                              effectiveVal
                                                ? 'bg-emerald-600 text-white shadow-2xs hover:bg-emerald-700'
                                                : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-700'
                                            }`}
                                          >
                                            {effectiveVal ? 'Granted' : 'Denied'}
                                          </button>
                                        ) : (
                                          <span className={`px-2.5 py-0.5 rounded text-[11px] font-semibold ${
                                            effectiveVal
                                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                                              : 'bg-slate-100 text-slate-500 dark:bg-slate-800'
                                          }`}>
                                            {effectiveVal ? 'Active' : 'Locked'}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: Direct User-Level Overrides */}
          {activeTab === 'overrides' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl border border-purple-200 dark:border-purple-900/60 bg-purple-50/70 dark:bg-purple-950/30 text-xs text-purple-950 dark:text-purple-200 flex items-start gap-3">
                <Sliders className="w-5 h-5 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <strong>User-Specific Access Overrides:</strong> Explicit grants or denials configured here take absolute precedence over the user's assigned role (<strong>{user.role}</strong>). Clear an override to revert to default role inheritance.
                </div>
              </div>

              {Object.keys(overrides).length === 0 ? (
                <div className="p-8 text-center rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-400 text-xs space-y-2">
                  <Unlock className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="font-semibold text-slate-700 dark:text-slate-300">No Custom Overrides Configured</p>
                  <p className="text-[11px]">This account runs 100% on inherited permissions from the <strong>{user.role}</strong> role template.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {Object.entries(overrides).map(([key, isGranted]) => {
                    const rp = MOCK_RAW_PERMISSIONS.find((p) => p.technicalKey === key);
                    return (
                      <div
                        key={key}
                        className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <span>{rp?.name || key}</span>
                            <span className="font-mono text-[10px] text-slate-400">({key})</span>
                          </div>
                          <span className="text-[11px] text-slate-500">
                            Module: {rp?.module || 'Custom Module'}
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className={`px-2.5 py-1 rounded font-bold text-xs ${
                            isGranted 
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' 
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          }`}>
                            {isGranted ? 'Explicitly Granted' : 'Explicitly Denied'}
                          </span>
                          {canEdit && (
                            <button
                              type="button"
                              onClick={() => {
                                const copy = { ...overrides };
                                delete copy[key];
                                setOverrides(copy);
                                setHasChanges(true);
                              }}
                              className="text-xs text-rose-600 hover:underline"
                            >
                              Remove Override
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Menu / Module Access */}
          {activeTab === 'menu' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 text-xs text-slate-700 dark:text-slate-300">
                Configure visible sidebar items for <strong>{user.name}</strong>. Toggle to hide specific modules from this user's primary navigation menu.
              </div>

              <div className="space-y-2">
                {ALL_APP_MODULES.map((m) => {
                  const isVisible = menuAccess[m.id] !== undefined 
                    ? Boolean(menuAccess[m.id]) 
                    : userRole.allowedModules.includes(m.id);

                  return (
                    <div
                      key={m.id}
                      className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white block">
                          {m.name}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {m.description}
                        </span>
                      </div>

                      <div>
                        <button
                          type="button"
                          disabled={!canEdit}
                          onClick={() => handleToggleMenu(m.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors disabled:opacity-50 ${
                            isVisible
                              ? 'bg-sky-600 text-white shadow-2xs hover:bg-sky-700'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {isVisible ? 'Visible in Menu' : 'Hidden from Menu'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: Client Access Mapping */}
          {activeTab === 'clients' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 text-xs flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white">Active Client Scope</h4>
                  <p className="text-[11px] text-slate-500">
                    Defines which corporate tenants and regional locations this user can inspect.
                  </p>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300">
                  {user.mappedClients?.length || 0} Clients
                </span>
              </div>

              <div className="space-y-3">
                {user.mappedClients?.map((cli) => (
                  <div
                    key={cli.clientId}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                        <span className="font-bold text-slate-900 dark:text-white">{cli.clientName}</span>
                        <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600">
                          {cli.clientCode}
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                        {cli.candidateAccessScope}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px]">
                      <div>
                        <span className="text-slate-400 block">Permitted Locations:</span>
                        <span className="font-medium text-slate-800 dark:text-slate-200">
                          {cli.locationNames?.join(', ') || 'All Locations'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Permitted Branches / Offices:</span>
                        <span className="font-medium text-slate-800 dark:text-slate-200">
                          {cli.branchNames?.join(', ') || 'All Branches'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {hasChanges && (
              <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" />
                Unsaved changes pending
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {hasChanges && (
              <button
                type="button"
                onClick={handleReset}
                className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Close
            </button>
            {canEdit && hasChanges && (
              <button
                type="button"
                onClick={handleSave}
                className="px-5 py-2 text-xs font-bold rounded-xl bg-sky-600 hover:bg-sky-700 text-white shadow-xs flex items-center gap-1.5 transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>Save Access Updates</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
