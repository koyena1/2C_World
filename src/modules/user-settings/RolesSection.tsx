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
  Plus,
  Search,
  Filter
} from 'lucide-react';
import { RoleDefinition } from '../../types/userSettings';

interface RolesSectionProps {
  roles: RoleDefinition[];
  currentUserRole: string;
  onEditRole: (role: RoleDefinition) => void;
  onViewPermissions: (roleName: string) => void;
  onDuplicateRole: (role: RoleDefinition) => void;
  onAddNewRole: () => void;
}

export const RolesSection: React.FC<RolesSectionProps> = ({
  roles,
  currentUserRole,
  onEditRole,
  onViewPermissions,
  onDuplicateRole,
  onAddNewRole,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('table');

  const filteredRoles = roles.filter((r) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      r.name.toLowerCase().includes(q) ||
      r.description.toLowerCase().includes(q) ||
      r.allowedModules.some((m) => m.toLowerCase().includes(q))
    );
  });

  const canCreateOrEdit = currentUserRole === 'Super Admin' || currentUserRole === 'Admin';

  return (
    <div className="space-y-4">
      {/* Scope Banner & Header */}
      <div className="p-3 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 flex items-center justify-center font-bold">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              Enterprise Role Catalog & Governance
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {currentUserRole === 'Super Admin'
                ? 'Super Admin authority: Define tenant roles, duplicate custom templates and assign module matrices.'
                : currentUserRole === 'Admin'
                ? 'Admin authority: Supervise subordinate HR role assignments within your allowed permissions.'
                : 'Read-only view of enterprise roles and permission structures.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {canCreateOrEdit && (
            <button
              type="button"
              onClick={onAddNewRole}
              className="px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add Role</span>
            </button>
          )}
        </div>
      </div>

      {/* Toolbar: Search, Count & View Switcher */}
      <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="relative w-full sm:max-w-xs">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search roles by name or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-1 focus:ring-sky-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
          <span className="text-[11px] text-slate-500 font-medium">
            Showing <strong className="text-slate-900 dark:text-white">{filteredRoles.length}</strong> of {roles.length} roles
          </span>

          <div className="flex items-center p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px]">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Table View
            </button>
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                viewMode === 'cards'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Card View
            </button>
          </div>
        </div>
      </div>

      {/* TABLE VIEW */}
      {viewMode === 'table' ? (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px] font-semibold">
                  <th className="px-4 py-3 min-w-[180px]">Role Name</th>
                  <th className="px-4 py-3 min-w-[260px]">Description</th>
                  <th className="px-3 py-3 text-center min-w-[110px]">Users Assigned</th>
                  <th className="px-4 py-3 min-w-[240px]">Modules Allowed</th>
                  <th className="px-3 py-3 min-w-[130px]">Last Updated</th>
                  <th className="px-4 py-3 text-right min-w-[180px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                {filteredRoles.map((r) => {
                  const isSuperAdminRole = r.name === 'Super Admin';
                  const canEditThisRole =
                    currentUserRole === 'Super Admin'
                      ? !isSuperAdminRole
                      : currentUserRole === 'Admin'
                      ? r.name.startsWith('HR')
                      : false;

                  return (
                    <tr key={r.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-850/50 transition-colors">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-white">
                            {r.name}
                          </span>
                          {r.isSystem && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                              System
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-3.5 text-slate-600 dark:text-slate-400 leading-relaxed text-[11px]">
                        {r.description}
                      </td>

                      <td className="px-3 py-3.5 text-center">
                        <span className="inline-flex items-center gap-1 font-mono font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs">
                          <Users className="w-3 h-3 text-slate-400" />
                          {r.userCount}
                        </span>
                      </td>

                      <td className="px-4 py-3.5">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {r.allowedModules.slice(0, 3).map((m) => (
                            <span
                              key={m}
                              className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                            >
                              {m}
                            </span>
                          ))}
                          {r.allowedModules.length > 3 && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300">
                              +{r.allowedModules.length - 3} more
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-3 py-3.5 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                        {r.lastUpdated}
                      </td>

                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => onViewPermissions(r.name)}
                            title="View Permission Matrix"
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {canEditThisRole && (
                            <button
                              type="button"
                              onClick={() => onEditRole(r)}
                              title="Edit Role & Permissions"
                              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {currentUserRole === 'Super Admin' && (
                            <button
                              type="button"
                              onClick={() => onDuplicateRole(r)}
                              title="Duplicate Role Template"
                              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* CARDS VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRoles.map((r) => {
            const isSuperAdminRole = r.name === 'Super Admin';
            const canEditThisRole =
              currentUserRole === 'Super Admin'
                ? !isSuperAdminRole
                : currentUserRole === 'Admin'
                ? r.name.startsWith('HR')
                : false;

            return (
              <div
                key={r.id}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs space-y-3 flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-all"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span>{r.name}</span>
                        {r.isSystem && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                            System
                          </span>
                        )}
                      </h3>
                      <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1 mt-0.5">
                        <Users className="w-3 h-3" />
                        {r.userCount} active users assigned
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      {canEditThisRole && (
                        <button
                          type="button"
                          onClick={() => onEditRole(r)}
                          className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                          title="Edit Role"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {currentUserRole === 'Super Admin' && (
                        <button
                          type="button"
                          onClick={() => onDuplicateRole(r)}
                          className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                          title="Duplicate Role"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {r.description}
                  </p>

                  <div className="pt-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      Allowed Modules ({r.allowedModules.length})
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {r.allowedModules.slice(0, 4).map((m) => (
                        <span
                          key={m}
                          className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                        >
                          {m}
                        </span>
                      ))}
                      {r.allowedModules.length > 4 && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300">
                          +{r.allowedModules.length - 4} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-[10px] text-slate-400 font-mono">
                    Updated: {r.lastUpdated}
                  </span>
                  <button
                    type="button"
                    onClick={() => onViewPermissions(r.name)}
                    className="font-bold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1"
                  >
                    <span>View Matrix</span>
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
