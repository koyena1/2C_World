import React, { useState } from 'react';
import { 
  X, 
  AlertTriangle, 
  Shield, 
  Check, 
  Info, 
  UserCheck, 
  Lock,
  ArrowRight
} from 'lucide-react';
import { 
  UserAccount, 
  SystemRole, 
  AppModuleName, 
  ALL_APP_MODULES, 
  RoleDefinition 
} from '../../types/userSettings';

import { SelectMenu } from '../../components/ui/SelectMenu';
interface RoleAssignmentDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserAccount | null;
  currentUserRole: SystemRole;
  currentUserId: string;
  allUsers: UserAccount[];
  availableRoles: RoleDefinition[];
  onSave: (updatedUser: UserAccount, remarks: string) => void;
}

export const RoleAssignmentDrawer: React.FC<RoleAssignmentDrawerProps> = ({
  isOpen,
  onClose,
  user,
  currentUserRole,
  currentUserId,
  allUsers,
  availableRoles,
  onSave
}) => {
  if (!isOpen || !user) return null;

  // Potential admins to assign reporting to (Super Admin and Admins)
  const availableAdmins = allUsers.filter(u => u.role === 'Admin' || u.role === 'Super Admin');

  // Local form state
  const [selectedRole, setSelectedRole] = useState<SystemRole | string>(user.role);
  const [reportingAdminId, setReportingAdminId] = useState<string>(user.reportingManagerId || 'usr-3');
  const [selectedModules, setSelectedModules] = useState<AppModuleName[]>([...user.allowedModules]);
  const [remarks, setRemarks] = useState('');
  const [confirmStep, setConfirmStep] = useState(false);

  // Check if role or modules are reduced
  const isRoleDemoted = (user.role === 'Super Admin' && selectedRole !== 'Super Admin') ||
    (user.role === 'Admin' && selectedRole === 'HR');
  const isModulesReduced = user.allowedModules.some(m => !selectedModules.includes(m));
  const willLoseAccess = isRoleDemoted || isModulesReduced;

  // The logged-in admin's allowed modules (if currentUserRole is Admin, they cannot grant modules they don't have)
  const loggedInUserObj = allUsers.find(u => u.id === currentUserId) || allUsers[2];
  const loggedInUserAllowedModules = currentUserRole === 'Super Admin' 
    ? ALL_APP_MODULES.map(m => m.id)
    : loggedInUserObj.allowedModules;

  // Handle module toggle with safety
  const handleToggleModule = (modId: AppModuleName) => {
    // If Admin, ensure Admin has this module
    if (currentUserRole === 'Admin' && !loggedInUserAllowedModules.includes(modId)) {
      return; // Cannot toggle module not owned
    }
    if (selectedModules.includes(modId)) {
      setSelectedModules(selectedModules.filter(m => m !== modId));
    } else {
      setSelectedModules([...selectedModules, modId]);
    }
  };

  const handleRoleChange = (newRole: string) => {
    setSelectedRole(newRole as SystemRole);
    const targetRoleDef = availableRoles.find(r => r.name === newRole);
    if (targetRoleDef) {
      // If Admin is assigning, only modules both the role has AND the Admin has
      const candidateModules = targetRoleDef.allowedModules.filter(m => 
        currentUserRole === 'Super Admin' || loggedInUserAllowedModules.includes(m)
      );
      setSelectedModules(candidateModules);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (willLoseAccess && !confirmStep) {
      setConfirmStep(true);
      return;
    }

    const reportingAdminObj = availableAdmins.find(a => a.id === reportingAdminId);

    const updated: UserAccount = {
      ...user,
      role: selectedRole as SystemRole,
      reportingManagerId: selectedRole === 'Super Admin' ? undefined : reportingAdminId,
      reportingManagerName: selectedRole === 'Super Admin' ? undefined : (reportingAdminObj?.name || 'Assigned Admin'),
      allowedModules: selectedModules,
    };

    onSave(updated, remarks || `Role updated to ${selectedRole}`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/70 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div 
        className="w-full max-w-xl bg-white dark:bg-slate-900 h-full shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col justify-between overflow-hidden animate-in slide-in-from-right duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Drawer Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/60 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-100 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 flex items-center justify-center font-bold text-sm border border-sky-200 dark:border-sky-800">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Assign Role & Permissions
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Update access tier for <span className="font-semibold text-slate-800 dark:text-slate-200">{user.name}</span> ({user.employeeCode || user.id})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Scrollable Content */}
        <form id="role-assignment-form" onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto p-5 space-y-6 text-xs">
          {/* User Identity Card */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">User Name</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">{user.name}</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-mono">{user.email}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">Current Role</span>
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border mt-0.5 ${
                  user.role === 'Super Admin'
                    ? 'bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800'
                    : user.role === 'Admin'
                    ? 'bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800'
                    : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                }`}>
                  {user.role}
                </span>
              </div>
            </div>
          </div>

          {/* New Role Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
              Select New Role <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {availableRoles.map((r) => {
                const isSelected = selectedRole === r.name;
                // If logged in as Admin, can ONLY assign HR role
                const isDisabledForAdmin = currentUserRole === 'Admin' && r.name !== 'HR';

                return (
                  <button
                    key={r.id}
                    type="button"
                    disabled={isDisabledForAdmin}
                    onClick={() => handleRoleChange(r.name)}
                    className={`p-3 rounded-xl border text-left transition-all relative ${
                      isSelected
                        ? 'border-sky-500 bg-sky-50/60 dark:bg-sky-950/40 ring-1 ring-sky-500 text-slate-900 dark:text-white'
                        : isDisabledForAdmin
                        ? 'opacity-40 border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800/40 cursor-not-allowed text-slate-400'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800/80 text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs">{r.name}</span>
                      {isSelected && <Check className="w-4 h-4 text-sky-600 dark:text-sky-400" />}
                    </div>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {r.name === 'Super Admin' ? 'Full global rights' : r.name === 'Admin' ? 'Lead ops & supervise HR' : 'Frontline recruiting ops'}
                    </p>
                  </button>
                );
              })}
            </div>
            {currentUserRole === 'Admin' && (
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5 flex items-center gap-1">
                <Info className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                Admins can only assign the <strong>HR</strong> role to team members.
              </p>
            )}
          </div>

          {/* Reporting Admin field (applicable for HR and Admin) */}
          {selectedRole !== 'Super Admin' && (
            <div>
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1.5">
                Reporting Admin <span className="text-rose-500">*</span>
              </label>
              <SelectMenu
                value={reportingAdminId}
                onChange={(e) => setReportingAdminId(e.target.value)}
                disabled={currentUserRole === 'Admin'} // If Admin, report to self automatically
                className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {availableAdmins.map((adm) => (
                  <option key={adm.id} value={adm.id}>
                    {adm.name} ({adm.role}) — {adm.email}
                  </option>
                ))}
              </SelectMenu>
              {currentUserRole === 'Admin' && (
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  As an Admin, HR team members assigned by you report directly to your span.
                </p>
              )}
            </div>
          )}

          {/* Allowed Modules Checklist */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                Allowed Modules ({selectedModules.length} of {ALL_APP_MODULES.length})
              </label>
              <span className="text-[11px] text-slate-500 dark:text-slate-400">
                Grant or restrict individual module screens
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {ALL_APP_MODULES.map((mod) => {
                const isSelected = selectedModules.includes(mod.id);
                const isAdminRestricted = currentUserRole === 'Admin' && !loggedInUserAllowedModules.includes(mod.id);

                return (
                  <div
                    key={mod.id}
                    title={isAdminRestricted ? "You cannot assign this permission because it is not available in your role." : mod.description}
                    onClick={() => !isAdminRestricted && handleToggleModule(mod.id)}
                    className={`p-2.5 rounded-lg border flex items-start gap-2.5 transition-colors ${
                      isAdminRestricted
                        ? 'opacity-40 bg-slate-100 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 cursor-not-allowed'
                        : isSelected
                        ? 'bg-sky-50/70 dark:bg-sky-950/40 border-sky-300 dark:border-sky-800/80 cursor-pointer'
                        : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      disabled={isAdminRestricted}
                      onChange={() => {}} // handled on parent click
                      className="mt-0.5 rounded text-sky-600 focus:ring-sky-500 h-3.5 w-3.5 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 pointer-events-none"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className={`font-semibold text-xs truncate ${isSelected ? 'text-sky-900 dark:text-sky-200 font-bold' : 'text-slate-700 dark:text-slate-300'}`}>
                          {mod.name}
                        </span>
                        {isAdminRestricted && (
                          <Lock className="w-3 h-3 text-slate-400 shrink-0 ml-1" />
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1">
                        {mod.category}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Permission Preview */}
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                Permission Preview
              </span>
              <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 font-mono">
                {selectedRole} Tier
              </span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
              Upon saving, <strong className="text-slate-900 dark:text-white">{user.name}</strong> will be granted access to <strong>{selectedModules.length} modules</strong>. 
              {selectedRole === 'HR' && ' They will operate in read-only mode for role settings and report to their assigned supervisor.'}
              {selectedRole === 'Admin' && ' They can configure candidate pipelines and assign roles to HRs under their team.'}
            </p>
          </div>

          {/* Audit Remarks */}
          <div>
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
              Audit Remarks / Reason for Change
            </label>
            <input
              type="text"
              placeholder="e.g. Promoted to Team Lead, assigned 3 HR reportees"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
            />
          </div>

          {/* Warning Banner Before Reducing Access */}
          {willLoseAccess && (
            <div className="p-3.5 rounded-xl border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 flex items-start gap-2.5 animate-in fade-in duration-150">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs leading-relaxed">
                <strong className="block font-bold mb-0.5">Access Reduction Warning:</strong>
                This user may lose access to some modules after saving. Unsaved work or active verification tasks in revoked modules will no longer be accessible by this user.
              </div>
            </div>
          )}

          {/* Secondary Confirmation Step if reducing access */}
          {confirmStep && (
            <div className="p-4 rounded-xl border border-rose-300 dark:border-rose-800 bg-rose-50 dark:bg-rose-950/60 text-rose-900 dark:text-rose-200 space-y-2">
              <p className="font-bold text-xs">Confirm Access Reduction?</p>
              <p className="text-[11px] leading-relaxed">
                Click <strong>"Confirm & Save Changes"</strong> below to apply these permissions to the production user account.
              </p>
            </div>
          )}
        </form>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="role-assignment-form"
            className={`px-5 py-2 rounded-lg text-white font-bold text-xs shadow-xs flex items-center gap-1.5 transition-colors ${
              confirmStep
                ? 'bg-rose-600 hover:bg-rose-700'
                : 'bg-sky-600 hover:bg-sky-700'
            }`}
          >
            <span>{confirmStep ? 'Confirm & Save Changes' : 'Save Changes'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
