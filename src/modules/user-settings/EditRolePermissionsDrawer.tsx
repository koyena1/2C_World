import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Shield, 
  Search, 
  Check, 
  CheckSquare, 
  Square, 
  RotateCcw, 
  Save, 
  AlertTriangle, 
  Info, 
  Layers, 
  Lock 
} from 'lucide-react';
import { 
  RoleDefinition, 
  AppModuleName, 
  ALL_APP_MODULES, 
  PERMISSION_ACTIONS, 
  ModulePermission 
} from '../../types/userSettings';

interface EditRolePermissionsDrawerProps {
  role: RoleDefinition | null;
  isOpen: boolean;
  onClose: () => void;
  currentUserRole: string;
  adminPermissions?: Record<AppModuleName, ModulePermission>;
  onSaveRole: (updatedRole: RoleDefinition) => void;
}

export const EditRolePermissionsDrawer: React.FC<EditRolePermissionsDrawerProps> = ({
  role,
  isOpen,
  onClose,
  currentUserRole,
  adminPermissions,
  onSaveRole,
}) => {
  const [roleName, setRoleName] = useState('');
  const [description, setDescription] = useState('');
  const [permissions, setPermissions] = useState<Record<AppModuleName, ModulePermission>>({} as any);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModuleFilter, setSelectedModuleFilter] = useState<string>('All');
  const [showTechnicalKeys, setShowTechnicalKeys] = useState(true);

  // Sync state
  useEffect(() => {
    if (role) {
      setRoleName(role.name);
      setDescription(role.description);
      setPermissions(JSON.parse(JSON.stringify(role.permissions)));
      setSearchQuery('');
    }
  }, [role, isOpen]);

  // Compute changed permissions count
  const changedCount = useMemo(() => {
    if (!role) return 0;
    let count = 0;
    ALL_APP_MODULES.forEach((mod) => {
      PERMISSION_ACTIONS.forEach((act) => {
        const orig = Boolean((role.permissions[mod.id] as any)?.[act.key]);
        const curr = Boolean((permissions[mod.id] as any)?.[act.key]);
        if (orig !== curr) count++;
      });
    });
    return count;
  }, [role, permissions]);

  // Role editing permissions hierarchy:
  // - Super Admin can edit all roles (except Super Admin root)
  // - Admin can only edit HR roles within Admin's own allowed permissions
  // - HR cannot edit
  const canEdit = useMemo(() => {
    if (!role) return false;
    if (currentUserRole === 'Super Admin') return role.name !== 'Super Admin';
    if (currentUserRole === 'Admin') return role.name.startsWith('HR');
    return false;
  }, [currentUserRole, role]);

  if (!isOpen || !role) return null;

  // Toggle single action permission
  const handleToggle = (moduleName: AppModuleName, actionKey: string) => {
    if (!canEdit) return;

    // Admin hierarchy check: cannot assign what Admin does not have
    if (currentUserRole === 'Admin' && adminPermissions) {
      const adminHas = Boolean((adminPermissions[moduleName] as any)?.[actionKey]);
      if (!adminHas) return; // locked
    }

    setPermissions((prev) => {
      const currentMod = prev[moduleName] || {
        view: false, create: false, edit: false, delete: false, approve: false, export: false, send: false
      };
      const nextVal = !(currentMod as any)[actionKey];

      // Auto enable view if creating/editing
      let updatedMod = { ...currentMod, [actionKey]: nextVal };
      if (nextVal && actionKey !== 'view') {
        updatedMod.view = true;
      }

      return {
        ...prev,
        [moduleName]: updatedMod,
      };
    });
  };

  // Select all or deselect all for a module
  const handleToggleModuleAll = (moduleName: AppModuleName, enable: boolean) => {
    if (!canEdit) return;

    setPermissions((prev) => {
      const updatedMod: ModulePermission = {
        view: false,
        create: false,
        edit: false,
        delete: false,
        approve: false,
        export: false,
        send: false,
        specialAccess: false,
      };

      if (enable) {
        PERMISSION_ACTIONS.forEach((act) => {
          let allow = true;
          if (currentUserRole === 'Admin' && adminPermissions) {
            allow = Boolean((adminPermissions[moduleName] as any)?.[act.key]);
          }
          if (allow) {
            (updatedMod as any)[act.key] = true;
          }
        });
      }

      return {
        ...prev,
        [moduleName]: updatedMod,
      };
    });
  };

  const handleReset = () => {
    setRoleName(role.name);
    setDescription(role.description);
    setPermissions(JSON.parse(JSON.stringify(role.permissions)));
  };

  const handleSave = () => {
    // Derive allowed modules (modules where view or any action is true)
    const allowed = ALL_APP_MODULES.filter((m) => {
      const p = permissions[m.id];
      return p && (p.view || p.create || p.edit || p.delete || p.approve || p.export || p.send || p.specialAccess);
    }).map((m) => m.id);

    const updated: RoleDefinition = {
      ...role,
      name: roleName.trim(),
      description: description.trim(),
      permissions,
      allowedModules: allowed,
      lastUpdated: 'Just now',
    };

    onSaveRole(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-150">
      <div 
        className="w-full max-w-4xl bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col h-full transform transition-transform"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 flex items-center justify-center font-bold">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Edit Role & Permissions</span>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
                  {role.name}
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Configure module-wise permission matrix, CRUD authority and technical action bindings
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

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Section 1: Role Meta */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-slate-50 dark:bg-slate-850 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Role Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                disabled={role.isSystem}
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold disabled:opacity-60"
              />
              {role.isSystem && (
                <p className="text-[10px] text-slate-400 mt-0.5">System-defined default role title cannot be renamed.</p>
              )}
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Role Description
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
              />
              <p className="text-[10px] text-slate-400 mt-0.5">Appears in assignment drawers & user profiles.</p>
            </div>
          </div>

          {/* Changed Permissions Preview Alert */}
          {changedCount > 0 && (
            <div className="p-3.5 rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 text-xs text-amber-900 dark:text-amber-200 flex items-center justify-between">
              <div className="flex items-center gap-2 font-semibold">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>Pending Changes: {changedCount} permission actions modified.</span>
              </div>
              <span className="text-[11px] underline cursor-pointer" onClick={handleReset}>
                Discard changes
              </span>
            </div>
          )}

          {/* Admin Hierarchy Warning */}
          {currentUserRole === 'Admin' && (
            <div className="p-3 rounded-xl border border-sky-300 dark:border-sky-800 bg-sky-50 dark:bg-sky-950/40 text-xs text-sky-950 dark:text-sky-200 flex items-start gap-2">
              <Info className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <strong>Admin Delegation Policy:</strong> You cannot enable permissions for HR roles that you do not personally possess in your own Admin profile.
              </div>
            </div>
          )}

          {/* Section 2: Group Permissions Matrix */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-sky-600" />
                  <span>Module-Wise Permission Matrix</span>
                </h3>
                <p className="text-[11px] text-slate-500">
                  Toggle granular CRUD, verification, export and communication rights.
                </p>
              </div>

              <div className="flex items-center gap-2.5 text-xs">
                <div className="relative w-48">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search module..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-2.5 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-slate-600 dark:text-slate-400">
                  <input
                    type="checkbox"
                    checked={showTechnicalKeys}
                    onChange={(e) => setShowTechnicalKeys(e.target.checked)}
                    className="rounded border-slate-300 dark:border-slate-700 text-sky-600"
                  />
                  <span>Technical Keys</span>
                </label>
              </div>
            </div>

            {/* Matrix Table */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px] font-semibold">
                      <th className="px-4 py-3 min-w-[200px]">Module / Submodule</th>
                      {PERMISSION_ACTIONS.map((act) => (
                        <th key={act.key} className="px-3 py-3 text-center min-w-[80px]" title={act.tooltip}>
                          {act.label}
                        </th>
                      ))}
                      <th className="px-3 py-3 text-right min-w-[100px]">Module Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                    {ALL_APP_MODULES.filter((m) => {
                      if (!searchQuery.trim()) return true;
                      return m.name.toLowerCase().includes(searchQuery.toLowerCase());
                    }).map((mod) => {
                      const modPerm = permissions[mod.id] || {
                        view: false, create: false, edit: false, delete: false, approve: false, export: false, send: false, specialAccess: false
                      };

                      return (
                        <tr key={mod.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-850/50 transition-colors">
                          <td className="px-4 py-3">
                            <span className="font-bold text-slate-900 dark:text-white block">
                              {mod.name}
                            </span>
                            {showTechnicalKeys && (
                              <span className="font-mono text-[10px] text-slate-400 block">
                                key: {mod.id.toLowerCase().replace(/[^a-z0-9]/g, '-')}
                              </span>
                            )}
                          </td>

                          {PERMISSION_ACTIONS.map((act) => {
                            const isChecked = Boolean((modPerm as any)[act.key]);
                            
                            // Check admin inheritance lock
                            let isLocked = false;
                            if (currentUserRole === 'Admin' && adminPermissions) {
                              const adminHas = Boolean((adminPermissions[mod.id] as any)?.[act.key]);
                              if (!adminHas) isLocked = true;
                            }

                            return (
                              <td key={act.key} className="px-3 py-3 text-center">
                                <div className="flex items-center justify-center">
                                  {isLocked ? (
                                    <div 
                                      className="p-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
                                      title="You cannot assign this permission because it is not available in your role."
                                    >
                                      <Lock className="w-3.5 h-3.5" />
                                    </div>
                                  ) : (
                                    <input
                                      type="checkbox"
                                      disabled={!canEdit}
                                      checked={isChecked}
                                      onChange={() => handleToggle(mod.id, act.key)}
                                      className="w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-sky-600 focus:ring-sky-500 cursor-pointer disabled:cursor-not-allowed"
                                    />
                                  )}
                                </div>
                              </td>
                            );
                          })}

                          <td className="px-3 py-3 text-right">
                            {canEdit && (
                              <div className="flex items-center justify-end gap-1.5 text-[10px]">
                                <button
                                  type="button"
                                  onClick={() => handleToggleModuleAll(mod.id, true)}
                                  className="text-sky-600 dark:text-sky-400 hover:underline font-semibold"
                                >
                                  All
                                </button>
                                <span>·</span>
                                <button
                                  type="button"
                                  onClick={() => handleToggleModuleAll(mod.id, false)}
                                  className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                                >
                                  None
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {changedCount > 0 && (
              <button
                type="button"
                onClick={handleReset}
                className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Matrix</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            {canEdit && (
              <button
                type="button"
                onClick={handleSave}
                className="px-5 py-2 text-xs font-bold rounded-xl bg-sky-600 hover:bg-sky-700 text-white shadow-xs flex items-center gap-1.5 transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>Save Role Permissions</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
