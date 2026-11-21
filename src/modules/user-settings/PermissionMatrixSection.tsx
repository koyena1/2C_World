import React, { useState } from 'react';
import { 
  Shield, 
  Lock, 
  Info, 
  Check, 
  HelpCircle, 
  Save, 
  RotateCcw,
  AlertTriangle
} from 'lucide-react';
import { 
  RoleDefinition, 
  SystemRole, 
  ALL_APP_MODULES, 
  PERMISSION_ACTIONS, 
  ModulePermission, 
  AppModuleName 
} from '../../types/userSettings';

interface PermissionMatrixSectionProps {
  roles: RoleDefinition[];
  selectedRoleName: string;
  onSelectRole: (roleName: string) => void;
  currentUserRole: SystemRole;
  currentUserId: string;
  adminPermissions?: Record<AppModuleName, ModulePermission>;
  onSaveRolePermissions: (roleName: string, updatedPermissions: Record<AppModuleName, ModulePermission>) => void;
}

export const PermissionMatrixSection: React.FC<PermissionMatrixSectionProps> = ({
  roles,
  selectedRoleName,
  onSelectRole,
  currentUserRole,
  currentUserId,
  adminPermissions,
  onSaveRolePermissions,
}) => {
  // Find current active role definition
  const targetRole = roles.find((r) => r.name === selectedRoleName) || roles[1];

  // Local state for permissions matrix
  const [matrix, setMatrix] = useState<Record<AppModuleName, ModulePermission>>(targetRole.permissions);
  const [hasChanges, setHasChanges] = useState(false);
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  // Sync if selected role changes
  React.useEffect(() => {
    setMatrix(targetRole.permissions);
    setHasChanges(false);
  }, [selectedRoleName, targetRole]);

  // Determine if editing is allowed:
  // - Super Admin can edit Admin and HR roles
  // - Admin can only edit HR role (and only for permissions Admin holds)
  // - HR cannot edit
  const canEdit =
    currentUserRole === 'Super Admin'
      ? targetRole.name !== 'Super Admin' // Super Admin permissions are permanent root
      : currentUserRole === 'Admin'
      ? targetRole.name === 'HR'
      : false;

  // Toggle single permission cell with strict hierarchy checking
  const handleToggle = (moduleName: AppModuleName, actionKey: keyof ModulePermission) => {
    if (!canEdit) return;

    // Strict Rule: Admins cannot enable permissions for HRs that the Admin does not have.
    if (currentUserRole === 'Admin' && adminPermissions) {
      const adminHasPermission = adminPermissions[moduleName]?.[actionKey];
      if (!adminHasPermission) {
        // Restricted
        return;
      }
    }

    setMatrix((prev) => {
      const currentModulePerm = prev[moduleName] || {
        view: false,
        create: false,
        edit: false,
        delete: false,
        approve: false,
        export: false,
        send: false,
      };

      const nextVal = !currentModulePerm[actionKey];

      // Auto-enable view if creating/editing
      let updatedModule = { ...currentModulePerm, [actionKey]: nextVal };
      if (nextVal && actionKey !== 'view') {
        updatedModule.view = true;
      }

      return {
        ...prev,
        [moduleName]: updatedModule,
      };
    });

    setHasChanges(true);
  };

  const handleSave = () => {
    onSaveRolePermissions(targetRole.name, matrix);
    setHasChanges(false);
  };

  const handleReset = () => {
    setMatrix(targetRole.permissions);
    setHasChanges(false);
  };

  return (
    <div className="space-y-4">
      {/* Top Controls Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 flex items-center justify-center font-bold shrink-0">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 flex-wrap">
              <span>Permission Matrix</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                canEdit 
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'
              }`}>
                {canEdit ? 'Editable Mode' : 'Read Only'}
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Configure granular CRUD, verification, export, and dispatch rights by module.
            </p>
          </div>
        </div>

        {/* Role Selector Tabs & Save Button */}
        <div className="flex items-center gap-3 flex-wrap justify-between lg:justify-end min-w-0 max-w-full">
          <div className="overflow-x-auto min-w-0 max-w-full pb-0.5 scrollbar-thin">
            <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 w-max shrink-0">
              {roles.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => onSelectRole(r.name)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                    selectedRoleName === r.name
                      ? 'bg-white dark:bg-sky-600 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800'
                  }`}
                >
                  {r.name}
                </button>
              ))}
            </div>
          </div>

          {canEdit && hasChanges && (
            <div className="flex items-center gap-2 animate-in fade-in duration-150 shrink-0">
              <button
                type="button"
                onClick={handleReset}
                className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 transition-colors"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Matrix</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Admin Hierarchy Warning / Explanatory Tooltip Banner */}
      {currentUserRole === 'Admin' && (
        <div className="p-3 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong>Admin Hierarchy Enforcement:</strong> You cannot enable permissions for HRs that you do not personally have in your own Admin profile. Restricted actions appear locked with a security key.
          </div>
        </div>
      )}

      {/* Permission Matrix Table */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[11px] font-semibold">
                <th className="py-3 px-4 min-w-[200px]">Actual App Modules</th>
                {PERMISSION_ACTIONS.map((action) => (
                  <th key={action.key} className="py-3 px-3 text-center min-w-[90px]">
                    <div className="flex items-center justify-center gap-1">
                      <span>{action.label}</span>
                      <span title={action.tooltip} className="cursor-help">
                        <HelpCircle className="w-3 h-3 text-slate-400 hover:text-slate-600" />
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {ALL_APP_MODULES.map((moduleItem) => {
                const moduleName = moduleItem.id;
                const modulePerm = matrix[moduleName] || {
                  view: false,
                  create: false,
                  edit: false,
                  delete: false,
                  approve: false,
                  export: false,
                  send: false,
                };

                return (
                  <tr key={moduleName} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
                    {/* Module Name & Category */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 dark:text-white text-xs">
                        {moduleItem.name}
                      </div>
                      <div className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                        {moduleItem.category}
                      </div>
                    </td>

                    {/* Checkboxes / Toggles for View, Create, Edit, Delete, Approve, Export, Send */}
                    {PERMISSION_ACTIONS.map((action) => {
                      const actionKey = action.key as keyof ModulePermission;
                      const isChecked = Boolean(modulePerm[actionKey]);

                      // Admin restriction check:
                      const isAdminRestricted =
                        currentUserRole === 'Admin' &&
                        adminPermissions &&
                        !adminPermissions[moduleName]?.[actionKey];

                      const isCellDisabled = !canEdit || isAdminRestricted;

                      return (
                        <td key={actionKey} className="py-3 px-3 text-center">
                          <div className="relative inline-flex items-center justify-center">
                            {isAdminRestricted ? (
                              <button
                                type="button"
                                disabled
                                title="You cannot assign this permission because it is not available in your role."
                                className="w-6 h-6 rounded-md bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-center justify-center text-slate-400 dark:text-slate-500 cursor-not-allowed group"
                              >
                                <Lock className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                              </button>
                            ) : (
                              <button
                                type="button"
                                disabled={isCellDisabled}
                                onClick={() => handleToggle(moduleName, actionKey)}
                                className={`w-6 h-6 rounded-md border flex items-center justify-center transition-all ${
                                  isChecked
                                    ? 'bg-sky-600 border-sky-600 text-white shadow-2xs'
                                    : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-transparent hover:border-slate-400 dark:hover:border-slate-500'
                                } ${isCellDisabled ? 'cursor-default opacity-85' : 'cursor-pointer'}`}
                                aria-label={`${moduleName} ${action.label}`}
                              >
                                <Check className={`w-3.5 h-3.5 ${isChecked ? 'stroke-[3]' : 'opacity-0'}`} />
                              </button>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
