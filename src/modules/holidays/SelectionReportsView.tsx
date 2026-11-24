import React, { useState, useMemo } from 'react';
import { downloadCsv } from '../../utils/download';
import { 
  Download, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  UserX, 
  Users, 
  FileSpreadsheet,
  Tag
} from 'lucide-react';
import { HolidayCalendar, HolidayEmployeeRecord } from '../../data/mockHolidayMasterData';

interface SelectionReportsViewProps {
  calendar: HolidayCalendar;
  employees: HolidayEmployeeRecord[];
  onShowToast: (msg: string) => void;
}

export const SelectionReportsView: React.FC<SelectionReportsViewProps> = ({
  calendar,
  employees,
  onShowToast,
}) => {
  const [activeStatusTab, setActiveStatusTab] = useState<'All' | 'Selected' | 'Pending' | 'Not Linked'>('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Employees in this calendar scope
  const calendarEmployees = useMemo(() => {
    return employees.filter(e => e.calendarId === calendar.id || e.selectionStatus === 'Not Linked');
  }, [employees, calendar.id]);

  // Counts
  const selectedCount = calendarEmployees.filter(e => e.selectionStatus === 'Selected').length;
  const pendingCount = calendarEmployees.filter(e => e.selectionStatus === 'Pending').length;
  const notLinkedCount = calendarEmployees.filter(e => e.selectionStatus === 'Not Linked').length;
  const totalCount = calendarEmployees.length;

  // Filtered employees
  const filteredEmployees = useMemo(() => {
    return calendarEmployees.filter(e => {
      if (activeStatusTab !== 'All' && e.selectionStatus !== activeStatusTab) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches = 
          e.name.toLowerCase().includes(q) ||
          e.employeeId.toLowerCase().includes(q) ||
          e.email.toLowerCase().includes(q) ||
          e.department.toLowerCase().includes(q) ||
          e.client.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [calendarEmployees, activeStatusTab, searchQuery]);

  const handleExport = () => {
    let csv = `Employee ID,Employee Name,Email,Department,Grade,Client,Calendar Name,Status,Selected Holidays\n`;
    filteredEmployees.forEach(e => {
      const holidaysStr = e.selectedHolidays.join('; ') || 'None';
      csv += `"${e.employeeId}","${e.name}","${e.email}","${e.department}","${e.grade}","${e.client}","${e.calendarName || calendar.name}","${e.selectionStatus}","${holidaysStr}"\n`;
    });
    downloadCsv(csv, `Selection_Report_${calendar.name.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.csv`);
    onShowToast(`Exported selection report for ${filteredEmployees.length} employees.`);
  };

  return (
    <div className="space-y-4">
      {/* Top Summary Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="cc-card-hover bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800 rounded-xl p-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Selected</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-700 dark:text-emerald-300 font-mono">{selectedCount}</span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">employees opted</span>
          </div>
          <p className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium mt-1">
            Optional holiday choices submitted
          </p>
        </div>

        <div className="cc-card-hover bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800 rounded-xl p-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Pending</span>
            <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-700 dark:text-amber-300 font-mono">{pendingCount}</span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">selection pending</span>
          </div>
          <p className="text-[10px] text-amber-700 dark:text-amber-400 font-medium mt-1">
            Linked to calendar, choices not finalized
          </p>
        </div>

        <div className="cc-card-hover bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Not Linked</span>
            <UserX className="w-4 h-4 text-slate-400 dark:text-slate-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-800 dark:text-slate-200 font-mono">{notLinkedCount}</span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">unassigned</span>
          </div>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-1">
            Active in region but not mapped to calendar
          </p>
        </div>

        <div className="cc-card-hover bg-white dark:bg-slate-900 border border-sky-200 dark:border-sky-800 rounded-xl p-3.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Employees</span>
            <Users className="w-4 h-4 text-sky-600 dark:text-sky-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-sky-900 dark:text-sky-100 font-mono">{totalCount}</span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">in region</span>
          </div>
          <p className="text-[10px] text-sky-700 dark:text-sky-400 font-medium mt-1">
            {totalCount > 0 ? `${Math.round((selectedCount / totalCount) * 100)}% overall intake completion` : 'No candidates'}
          </p>
        </div>
      </div>

      {/* Control Bar: Status Tabs, Search & Export */}
      <div className="cc-card-hover bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
          {(['All', 'Selected', 'Pending', 'Not Linked'] as const).map(tab => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveStatusTab(tab)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all whitespace-nowrap ${
                activeStatusTab === tab
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
              }`}
            >
              <span>{tab}</span>
              <span className="ml-1.5 text-[10px] px-1.5 py-0.2 rounded-full font-mono bg-slate-200/70 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                {tab === 'All' ? totalCount : tab === 'Selected' ? selectedCount : tab === 'Pending' ? pendingCount : notLinkedCount}
              </span>
            </button>
          ))}
        </div>

        {/* Search & Export Button */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, ID, or client..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="border border-slate-300 dark:border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-sky-500 w-52 sm:w-64"
            />
          </div>

          <button
            type="button"
            onClick={handleExport}
            className="px-3.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg shadow-2xs flex items-center gap-1.5 transition-colors whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Reports Data Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-4 py-3">Employee ID</th>
                <th className="px-4 py-3">Employee Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Grade</th>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 min-w-[260px]">Selected Optional Holidays</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900">
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400 dark:text-slate-500">
                    No employee selection records found for &quot;{activeStatusTab}&quot; status.
                  </td>
                </tr>
              ) : (
                filteredEmployees.map(emp => {
                  const isSelected = emp.selectionStatus === 'Selected';
                  const isPending = emp.selectionStatus === 'Pending';

                  return (
                    <tr key={emp.employeeId} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-4 py-3 font-mono font-semibold text-slate-800 dark:text-slate-200">
                        {emp.employeeId}
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                        {emp.name}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                        {emp.email}
                      </td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                        {emp.department}
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                        {emp.grade}
                      </td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-300 truncate max-w-[130px]" title={emp.client}>
                        {emp.client}
                      </td>
                      <td className="px-4 py-3">
                        {isSelected ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                            <span>Selected</span>
                          </span>
                        ) : isPending ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                            <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                            <span>Pending</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                            <UserX className="w-3 h-3 text-slate-400" />
                            <span>Not Linked</span>
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {emp.selectedHolidays.length > 0 ? (
                          <div className="flex flex-wrap items-center gap-1.5">
                            {emp.selectedHolidays.map((hol, idx) => (
                              <span
                                key={idx}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-300 shadow-2xs"
                              >
                                <Tag className="w-2.5 h-2.5 text-amber-600 dark:text-amber-400" />
                                <span>{hol}</span>
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 dark:text-slate-500 italic">
                            {isPending ? 'Awaiting employee choice submission' : 'None linked'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table footer */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
          <span>Showing {filteredEmployees.length} employee selection rows</span>
          <span className="font-medium text-slate-700 dark:text-slate-300">Calendar: {calendar.name}</span>
        </div>
      </div>
    </div>
  );
};
