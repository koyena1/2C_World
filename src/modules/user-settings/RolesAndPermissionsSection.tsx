import React, { useState } from 'react';
import { 
  Shield, 
  Users, 
  Layers, 
  Clock, 
  Edit3, 
  Copy, 
  UserPlus, 
  Eye, 
  CheckCircle2, 
  Lock,
  Plus
} from 'lucide-react';
import { RoleDefinition, SystemRole } from '../../types/userSettings';

interface RolesAndPermissionsSectionProps {
  roles: RoleDefinition[];
  currentUserRole: SystemRole;
  onViewRoleMatrix: (role: RoleDefinition) => void;
  onEditRole: (role: RoleDefinition) => void;
  onDuplicateRole: (role: RoleDefinition) => void;
  onAssignUsersToRole: (role: RoleDefinition) => void;
}

export const RolesAndPermissionsSection: React.FC<RolesAndPermissionsSectionProps> = ({
  roles,
  currentUserRole,
  onViewRoleMatrix,
  onEditRole,
  onDuplicateRole,
  onAssignUsersToRole
}) => {
  return (
    <div className="space-y-6">
      {/* Top Roles Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Role Definitions & Authority Tiers
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Pre-configured governance tiers. Roles determine access limits, permission sets, and delegated management authority.
          </p>
        </div>

        {currentUserRole === 'Super Admin' && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => onDuplicateRole(roles[1])}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-sky-600 hover:bg-sky-700 text-white shadow-xs transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Custom Role</span>
            </button>
          </div>
        )}
      </div>

      {/* Role Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {roles.map((role) => {
          // Can current user edit this role?
          // Super Admin can edit Admin, HR, and Custom Role. Super Admin role is immutable system root.
          // Admin cannot edit roles.
          // HR cannot edit roles.
          const canEditRole = currentUserRole === 'Super Admin' && role.name !== 'Super Admin';
          const canAssignUsers = currentUserRole === 'Super Admin' || (currentUserRole === 'Admin' && role.name === 'HR');

          return (
            <div
              key={role.id}
              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs p-5 flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-all"
            >
              {/* Header */}
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm border ${
                    role.name === 'Super Admin'
                      ? 'bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800'
                      : role.name === 'Admin'
                      ? 'bg-sky-100 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800'
                      : 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                  }`}>
                    <Shield className="w-5 h-5" />
                  </div>

                  <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${
                    role.isSystem 
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                      : 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
                  }`}>
                    {role.isSystem ? 'System Core' : 'Custom Tier'}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {role.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-3 leading-relaxed">
                    {role.description}
                  </p>
                </div>

                {/* Metrics */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      Users Assigned:
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {role.userCount} active users
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5 text-slate-400" />
                      Modules Allowed:
                    </span>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {role.allowedModules.length} of 11
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Updated:
                    </span>
                    <span>{role.lastUpdated}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5 text-xs">
                <button
                  type="button"
                  onClick={() => onViewRoleMatrix(role)}
                  className="flex-1 py-1.5 px-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors flex items-center justify-center gap-1"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>View Role</span>
                </button>

                {canEditRole && (
                  <button
                    type="button"
                    onClick={() => onEditRole(role)}
                    className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors"
                    title="Edit Role permissions"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                )}

                {currentUserRole === 'Super Admin' && (
                  <button
                    type="button"
                    onClick={() => onDuplicateRole(role)}
                    className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors"
                    title="Duplicate Role"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                )}

                {canAssignUsers && (
                  <button
                    type="button"
                    onClick={() => onAssignUsersToRole(role)}
                    className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors"
                    title="Assign Users to this Role"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Role Governance Rules Notice */}
      <div className="p-4 rounded-xl border border-sky-200 dark:border-sky-800/80 bg-sky-50 dark:bg-sky-950/40 text-xs text-sky-950 dark:text-sky-200 space-y-1.5">
        <h4 className="font-bold flex items-center gap-1.5 text-sky-900 dark:text-sky-100">
          <Shield className="w-4 h-4 text-sky-600 dark:text-sky-400" />
          Role Governance & Assignment Matrix Rules
        </h4>
        <ul className="list-disc list-inside space-y-1 text-slate-700 dark:text-slate-300 leading-relaxed">
          <li><strong>Super Admin</strong> can edit all Admin and HR roles, duplicate custom role variants, and reassign users.</li>
          <li><strong>Admin</strong> can assign/edit HR access strictly within their own allowed modules and permissions.</li>
          <li><strong>HR</strong> operates under a fixed read-only profile and cannot edit or duplicate roles.</li>
        </ul>
      </div>
    </div>
  );
};
