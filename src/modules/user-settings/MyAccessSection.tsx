import React from 'react';
import { 
  Shield, 
  UserCheck, 
  Layers, 
  CheckCircle2, 
  XCircle, 
  Lock, 
  Info,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { 
  UserAccount, 
  ALL_APP_MODULES, 
  RoleDefinition, 
  AppModuleName 
} from '../../types/userSettings';

interface MyAccessSectionProps {
  currentUser: UserAccount;
  roleDefinition: RoleDefinition;
}

export const MyAccessSection: React.FC<MyAccessSectionProps> = ({
  currentUser,
  roleDefinition
}) => {
  const allowedSet = new Set(currentUser.allowedModules);
  const allowedList = ALL_APP_MODULES.filter(m => allowedSet.has(m.id));
  const restrictedList = ALL_APP_MODULES.filter(m => !allowedSet.has(m.id));

  // Natural language sentence as requested in user specification
  const naturalLanguageSummary = `You have access to ${allowedList.map(m => m.name).slice(0, 3).join(', ')}${allowedList.length > 3 ? `, and ${allowedList.length - 3} other operational modules` : '.'}`;

  return (
    <div className="space-y-6">
      {/* Profile Overview Card */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-lg border ${
              currentUser.role === 'Super Admin'
                ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800'
                : currentUser.role === 'Admin'
                ? 'bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800'
                : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
            }`}>
              {currentUser.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {currentUser.name}
                </h2>
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                  currentUser.role === 'Super Admin'
                    ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800'
                    : currentUser.role === 'Admin'
                    ? 'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800'
                    : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                }`}>
                  <Shield className="w-3 h-3" />
                  {currentUser.role}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-mono">
                {currentUser.email} · {currentUser.employeeCode || currentUser.id}
              </p>
            </div>
          </div>

          <div className="text-right sm:border-l sm:border-slate-100 sm:dark:border-slate-800 sm:pl-6 text-xs">
            <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block">
              My Reporting Admin
            </span>
            <span className="font-bold text-slate-900 dark:text-white text-sm block mt-0.5">
              {currentUser.reportingManagerName || 'Rajesh Sen (Super Admin)'}
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">
              Assigned Supervisor
            </span>
          </div>
        </div>

        {/* Natural Language Summary Banner */}
        <div className="mt-5 p-4 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/80 flex items-start gap-3 text-xs text-sky-950 dark:text-sky-200">
          <Info className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong className="block font-bold text-sky-900 dark:text-sky-100 mb-0.5">Summary of Operational Entitlements:</strong>
            <p className="text-slate-700 dark:text-slate-300">{naturalLanguageSummary}</p>
          </div>
        </div>

        {/* Read-Only Notice for HR */}
        <div className="mt-3 text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1.5">
          <Lock className="w-3 h-3" />
          <span>Role configuration is managed exclusively by your assigned Admin and Super Admin. This page is read-only.</span>
        </div>
      </div>

      {/* Allowed vs Restricted Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. Allowed Modules */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-emerald-50/50 dark:bg-emerald-950/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h3 className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider">
                Allowed Modules ({allowedList.length})
              </h3>
            </div>
            <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 font-mono">
              Enabled
            </span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {allowedList.map((m) => {
              const perm = roleDefinition.permissions[m.id];
              const activeActions = perm
                ? Object.entries(perm)
                    .filter(([_, v]) => v)
                    .map(([k]) => k.charAt(0).toUpperCase() + k.slice(1))
                : ['View'];

              return (
                <div key={m.id} className="p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-900 dark:text-white">
                      {m.name}
                    </span>
                    <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                      {m.category}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mb-2">
                    {m.description}
                  </p>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold">Actions:</span>
                    {activeActions.map((act) => (
                      <span
                        key={act}
                        className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                      >
                        {act}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. Restricted Modules */}
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-rose-50/50 dark:bg-rose-950/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <XCircle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              <h3 className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider">
                Restricted Modules ({restrictedList.length})
              </h3>
            </div>
            <span className="text-[11px] font-semibold text-rose-700 dark:text-rose-300 font-mono">
              No Access
            </span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {restrictedList.length === 0 ? (
              <div className="p-8 text-center text-slate-400 dark:text-slate-500">
                <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
                <p className="font-semibold">No restricted modules</p>
                <p className="text-[11px] mt-0.5">Your role has comprehensive system access.</p>
              </div>
            ) : (
              restrictedList.map((m) => (
                <div key={m.id} className="p-3.5 opacity-75 hover:opacity-100 transition-opacity">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-slate-700 dark:text-slate-300 line-through">
                      {m.name}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900 font-semibold">
                      Restricted
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500">
                    {m.description}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
