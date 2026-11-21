import React, { useState, useMemo } from 'react';
import { 
  X, 
  Search, 
  Filter, 
  Check, 
  Users, 
  AlertCircle, 
  Calendar as CalendarIcon,
  Building2,
  MapPin,
  CheckCircle2
} from 'lucide-react';
import { HolidayCalendar, HolidayEmployeeRecord } from '../../data/mockHolidayMasterData';

import { SelectMenu } from '../../components/ui/SelectMenu';
interface AssignEmployeesModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetCalendar: HolidayCalendar;
  allEmployees: HolidayEmployeeRecord[];
  onAssignSubmit: (selectedEmployeeIds: string[]) => void;
}

export const AssignEmployeesModal: React.FC<AssignEmployeesModalProps> = ({
  isOpen,
  onClose,
  targetCalendar,
  allEmployees,
  onAssignSubmit,
}) => {
  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [joiningFrom, setJoiningFrom] = useState('');
  const [joiningTo, setJoiningTo] = useState('');
  const [selectedClient, setSelectedClient] = useState('All');
  const [selectedLocation, setSelectedLocation] = useState('All');
  const [entriesPerPage, setEntriesPerPage] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Selected Employee IDs
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Unique clients and locations for filter dropdowns
  const clientOptions = useMemo(() => {
    const set = new Set(allEmployees.map(e => e.client));
    return ['All', ...Array.from(set)];
  }, [allEmployees]);

  const locationOptions = useMemo(() => {
    const set = new Set(allEmployees.map(e => e.location));
    return ['All', ...Array.from(set)];
  }, [allEmployees]);

  // Filtered employees
  const filteredEmployees = useMemo(() => {
    return allEmployees.filter(emp => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches = 
          emp.name.toLowerCase().includes(q) ||
          emp.employeeId.toLowerCase().includes(q) ||
          emp.email.toLowerCase().includes(q) ||
          emp.department.toLowerCase().includes(q);
        if (!matches) return false;
      }
      // Client
      if (selectedClient !== 'All' && emp.client !== selectedClient) {
        return false;
      }
      // Location
      if (selectedLocation !== 'All' && emp.location !== selectedLocation) {
        return false;
      }
      // Joining From
      if (joiningFrom && emp.joiningDate < joiningFrom) {
        return false;
      }
      // Joining To
      if (joiningTo && emp.joiningDate > joiningTo) {
        return false;
      }
      return true;
    });
  }, [allEmployees, searchQuery, selectedClient, selectedLocation, joiningFrom, joiningTo]);

  // Paginated list
  const paginatedEmployees = useMemo(() => {
    const start = (currentPage - 1) * entriesPerPage;
    return filteredEmployees.slice(start, start + entriesPerPage);
  }, [filteredEmployees, currentPage, entriesPerPage]);

  const totalPages = Math.ceil(filteredEmployees.length / entriesPerPage) || 1;

  if (!isOpen) return null;

  // Toggle selection
  const handleToggleSelectAllPage = () => {
    const pageIds = paginatedEmployees.map(e => e.employeeId);
    const allSelected = pageIds.every(id => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds(prev => prev.filter(id => !pageIds.includes(id)));
    } else {
      setSelectedIds(prev => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  const handleToggleSingle = (empId: string) => {
    setSelectedIds(prev => 
      prev.includes(empId) ? prev.filter(id => id !== empId) : [...prev, empId]
    );
  };

  const handleApplyAssignment = () => {
    if (selectedIds.length === 0) return;
    onAssignSubmit(selectedIds);
    onClose();
  };

  const getStatusBadge = (status: HolidayEmployeeRecord['status']) => {
    switch (status) {
      case 'Joined':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">Joined</span>;
      case 'Yet to Join':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">Yet to Join</span>;
      case 'Re-Joined':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-200">Re-Joined</span>;
      case 'Offer Not Rolled Out':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">Offer Pending</span>;
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/60 shrink-0">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Assign Employees to Holiday Calendar
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Target Calendar: <strong className="text-indigo-600 dark:text-indigo-400 font-bold">{targetCalendar.name}</strong> ({targetCalendar.region} · {targetCalendar.year})
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Controls Bar */}
        <div className="p-4 bg-slate-50 dark:bg-slate-850 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 space-y-3 shrink-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 text-xs">
            {/* Search Employee */}
            <div className="lg:col-span-2">
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                Search Employee
              </label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by name, ID, or email..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-sky-500 shadow-2xs font-medium"
                />
              </div>
            </div>

            {/* Client Filter */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                Client
              </label>
              <SelectMenu
                value={selectedClient}
                onChange={(e) => {
                  setSelectedClient(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-100 font-medium shadow-2xs"
              >
                {clientOptions.map(c => (
                  <option key={c} value={c}>{c === 'All' ? 'All Clients' : c}</option>
                ))}
              </SelectMenu>
            </div>

            {/* Work Location Filter */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                Work Location
              </label>
              <SelectMenu
                value={selectedLocation}
                onChange={(e) => {
                  setSelectedLocation(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-100 font-medium shadow-2xs"
              >
                {locationOptions.map(l => (
                  <option key={l} value={l}>{l === 'All' ? 'All Locations' : l}</option>
                ))}
              </SelectMenu>
            </div>

            {/* Joining Date Filters */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                Joining Period
              </label>
              <div className="flex items-center gap-1">
                <input
                  type="date"
                  value={joiningFrom}
                  onChange={(e) => setJoiningFrom(e.target.value)}
                  className="w-1/2 border border-slate-300 dark:border-slate-700 rounded px-1.5 py-1 text-[11px] bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-mono"
                  title="Joining From"
                />
                <span className="text-slate-400 text-xs">-</span>
                <input
                  type="date"
                  value={joiningTo}
                  onChange={(e) => setJoiningTo(e.target.value)}
                  className="w-1/2 border border-slate-300 dark:border-slate-700 rounded px-1.5 py-1 text-[11px] bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-mono"
                  title="Joining To"
                />
              </div>
            </div>
          </div>

          {/* Controls row */}
          <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 pt-1 border-t border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <span>Show</span>
              <SelectMenu
                value={entriesPerPage}
                onChange={(e) => {
                  setEntriesPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="border border-slate-300 dark:border-slate-700 rounded px-2 py-0.5 text-xs bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </SelectMenu>
              <span>entries</span>
            </div>

            <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              Showing {filteredEmployees.length === 0 ? 0 : (currentPage - 1) * entriesPerPage + 1} to{' '}
              {Math.min(currentPage * entriesPerPage, filteredEmployees.length)} of {filteredEmployees.length} candidates
            </div>
          </div>
        </div>

        {/* Results Table */}
        <div className="flex-1 overflow-y-auto bg-white dark:bg-slate-900">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold sticky top-0 z-10 border-b border-slate-200 dark:border-slate-700 shadow-2xs">
              <tr>
                <th className="p-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={
                      paginatedEmployees.length > 0 &&
                      paginatedEmployees.every(e => selectedIds.includes(e.employeeId))
                    }
                    onChange={handleToggleSelectAllPage}
                    className="rounded border-slate-300 dark:border-slate-600 text-sky-600 focus:ring-sky-500 w-3.5 h-3.5 bg-white dark:bg-slate-700"
                  />
                </th>
                <th className="px-3 py-2.5">Employee ID</th>
                <th className="px-3 py-2.5">Name</th>
                <th className="px-3 py-2.5">Location</th>
                <th className="px-3 py-2.5">Client</th>
                <th className="px-3 py-2.5">Status</th>
                <th className="px-3 py-2.5">Joining Date</th>
                <th className="px-3 py-2.5">Current Assignment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900">
              {paginatedEmployees.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400 dark:text-slate-500">
                    No employees match the specified filters.
                  </td>
                </tr>
              ) : (
                paginatedEmployees.map(emp => {
                  const isChecked = selectedIds.includes(emp.employeeId);
                  const isAlreadyThisCalendar = emp.calendarId === targetCalendar.id;
                  const isAssignedOther = emp.calendarId && emp.calendarId !== targetCalendar.id;

                  return (
                    <tr
                      key={emp.employeeId}
                      className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/70 cursor-pointer transition-colors ${
                        isChecked ? 'bg-sky-50/40 dark:bg-sky-950/30' : ''
                      }`}
                      onClick={() => handleToggleSingle(emp.employeeId)}
                    >
                      <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleSingle(emp.employeeId)}
                          className="rounded border-slate-300 dark:border-slate-600 text-sky-600 focus:ring-sky-500 w-3.5 h-3.5 bg-white dark:bg-slate-700"
                        />
                      </td>
                      <td className="px-3 py-2.5 font-mono font-semibold text-slate-700 dark:text-slate-300">
                        {emp.employeeId}
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="font-bold text-slate-900 dark:text-slate-100">{emp.name}</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">{emp.email}</div>
                      </td>
                      <td className="px-3 py-2.5 text-slate-700 dark:text-slate-300 font-medium">
                        {emp.location}
                      </td>
                      <td className="px-3 py-2.5 text-slate-600 dark:text-slate-400 truncate max-w-[130px]" title={emp.client}>
                        {emp.client}
                      </td>
                      <td className="px-3 py-2.5">
                        {getStatusBadge(emp.status)}
                      </td>
                      <td className="px-3 py-2.5 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                        {emp.joiningDate}
                      </td>
                      <td className="px-3 py-2.5">
                        {isAlreadyThisCalendar ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                            <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                            <span>Linked to {targetCalendar.name}</span>
                          </span>
                        ) : isAssignedOther ? (
                          <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                            Linked: {emp.calendarName}
                          </span>
                        ) : (
                          <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800">
                            Not Linked
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

        {/* Sticky Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
          <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Selected: <strong className="text-sky-700 dark:text-sky-400 text-sm font-mono">{selectedIds.length}</strong> employees
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={selectedIds.length === 0}
              onClick={handleApplyAssignment}
              className="px-5 py-2 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Assign {selectedIds.length > 0 ? `(${selectedIds.length})` : ''} to Calendar</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
