import React, { useState } from 'react';
import { 
  History, 
  Search, 
  Filter, 
  Shield, 
  Clock, 
  ArrowRight, 
  Download,
  Calendar,
  FileText
} from 'lucide-react';
import { AccessAuditLogEntry } from '../../types/userSettings';

interface AccessAuditLogSectionProps {
  logs: AccessAuditLogEntry[];
}

export const AccessAuditLogSection: React.FC<AccessAuditLogSectionProps> = ({ logs }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLogs = logs.filter((log) => {
    const term = searchQuery.toLowerCase();
    return (
      log.userAffected.name.toLowerCase().includes(term) ||
      log.userAffected.email.toLowerCase().includes(term) ||
      log.changedBy.name.toLowerCase().includes(term) ||
      log.permissionChanged.toLowerCase().includes(term) ||
      log.remarks.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-4">
      {/* Header and Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <History className="w-5 h-5 text-sky-600 dark:text-sky-400" />
            Access Governance & Audit Trail
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Immutable log of role transitions, permission grants, revocations, and account suspensions.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter audit entries..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[11px] font-semibold">
                <th className="py-3 px-4 min-w-[140px]">Date & Time</th>
                <th className="py-3 px-4 min-w-[150px]">Changed By</th>
                <th className="py-3 px-4 min-w-[160px]">User Affected</th>
                <th className="py-3 px-4 min-w-[140px]">Old Role → New Role</th>
                <th className="py-3 px-4 min-w-[180px]">Permission Changed</th>
                <th className="py-3 px-4">Remarks</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 dark:text-slate-500">
                    No matching audit entries found.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
                    {/* Date & Time */}
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 font-medium">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{log.timestamp}</span>
                      </div>
                    </td>

                    {/* Changed By */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {log.changedBy.name}
                      </div>
                      <span className="text-[10px] text-sky-700 dark:text-sky-300 font-semibold">
                        {log.changedBy.role}
                      </span>
                    </td>

                    {/* User Affected */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {log.userAffected.name}
                      </div>
                      <div className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                        {log.userAffected.email}
                      </div>
                    </td>

                    {/* Old Role -> New Role */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 font-semibold text-[11px]">
                        <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                          {log.oldRole}
                        </span>
                        <ArrowRight className="w-3 h-3 text-slate-400" />
                        <span className="px-2 py-0.5 rounded bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                          {log.newRole}
                        </span>
                      </div>
                    </td>

                    {/* Permission Changed */}
                    <td className="py-3 px-4">
                      <span className="font-mono text-[11px] font-semibold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                        {log.permissionChanged}
                      </span>
                    </td>

                    {/* Remarks */}
                    <td className="py-3 px-4 text-slate-600 dark:text-slate-300 text-xs">
                      {log.remarks}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
