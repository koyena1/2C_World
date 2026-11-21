import React, { useState, useMemo } from 'react';
import { 
  List, 
  Calendar as CalendarIcon, 
  Plus, 
  Search, 
  Edit3, 
  Copy, 
  Trash2, 
  CheckCircle2, 
  ChevronDown, 
  Info, 
  Layers, 
  Filter,
  SlidersHorizontal,
  HelpCircle,
  ExternalLink
} from 'lucide-react';
import { HolidayCalendar, HolidayMasterItem } from '../../data/mockHolidayMasterData';
import { HolidayYearView } from './HolidayYearView';

import { SelectMenu } from '../../components/ui/SelectMenu';
interface HolidayMasterScreenProps {
  calendars: HolidayCalendar[];
  activeCalendarId: string;
  onSelectCalendar: (calendarId: string) => void;
  holidays: HolidayMasterItem[];
  onOpenCreateCalendar: () => void;
  onOpenCreateHoliday: () => void;
  onEditHoliday: (holiday: HolidayMasterItem) => void;
  onDuplicateHoliday: (holiday: HolidayMasterItem) => void;
  onDeleteHoliday: (holidayId: string) => void;
  onDuplicateCalendar?: (calendar: HolidayCalendar) => void;
  onEditCalendar?: (calendar: HolidayCalendar) => void;
  onShowToast: (msg: string) => void;
}

export const HolidayMasterScreen: React.FC<HolidayMasterScreenProps> = ({
  calendars,
  activeCalendarId,
  onSelectCalendar,
  holidays,
  onOpenCreateCalendar,
  onOpenCreateHoliday,
  onEditHoliday,
  onDuplicateHoliday,
  onDeleteHoliday,
  onDuplicateCalendar,
  onEditCalendar,
  onShowToast,
}) => {
  // View mode toggle: 'list' | 'year'
  const [viewMode, setViewMode] = useState<'list' | 'year'>('list');
  const [holidaySearchQuery, setHolidaySearchQuery] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<'All' | 'Mandatory' | 'Optional'>('All');
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);

  // Active calendar
  const activeCalendar = useMemo(() => {
    return calendars.find(c => c.id === activeCalendarId) || calendars[0];
  }, [calendars, activeCalendarId]);

  // Holidays for this calendar
  const calendarHolidays = useMemo(() => {
    return holidays.filter(h => h.calendarId === activeCalendar.id);
  }, [holidays, activeCalendar.id]);

  const filteredHolidays = useMemo(() => {
    return calendarHolidays.filter(h => {
      if (selectedTypeFilter !== 'All' && h.type !== selectedTypeFilter) return false;
      if (holidaySearchQuery.trim()) {
        const q = holidaySearchQuery.toLowerCase();
        return h.name.toLowerCase().includes(q) || h.date.includes(q);
      }
      return true;
    });
  }, [calendarHolidays, selectedTypeFilter, holidaySearchQuery]);

  // Selection toggle
  const handleToggleSelectAll = () => {
    if (selectedRowIds.length === filteredHolidays.length) {
      setSelectedRowIds([]);
    } else {
      setSelectedRowIds(filteredHolidays.map(h => h.id));
    }
  };

  const handleToggleRow = (id: string) => {
    setSelectedRowIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBulkDelete = () => {
    if (selectedRowIds.length === 0) return;
    selectedRowIds.forEach(id => onDeleteHoliday(id));
    setSelectedRowIds([]);
    onShowToast(`Deleted ${selectedRowIds.length} holidays.`);
  };

  const mandatoryCount = calendarHolidays.filter(h => h.type === 'Mandatory').length;
  const optionalCount = calendarHolidays.filter(h => h.type === 'Optional').length;

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Top Actions & Calendar Control Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-2xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Calendar Picker & Identity Tools */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                Calendar:
              </label>
              <div className="relative">
                <SelectMenu
                  value={activeCalendar.id}
                  onChange={(e) => onSelectCalendar(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/80 border border-slate-300 dark:border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-sky-500 pr-8 cursor-pointer shadow-2xs transition-colors"
                >
                  {calendars.map(cal => (
                    <option key={cal.id} value={cal.id}>
                      {cal.name} ({cal.region} · {cal.year})
                    </option>
                  ))}
                </SelectMenu>
              </div>
            </div>

            {/* Calendar Identity Tools (Edit / Duplicate icons) */}
            <div className="flex items-center gap-1 border-l border-slate-200 dark:border-slate-700 pl-2.5">
              <button
                type="button"
                onClick={() => onEditCalendar && onEditCalendar(activeCalendar)}
                className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-sky-50 dark:hover:bg-slate-800 transition-colors"
                title="Edit Calendar Metadata"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onDuplicateCalendar && onDuplicateCalendar(activeCalendar)}
                className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-slate-800 transition-colors"
                title="Duplicate / Copy Calendar"
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
              <span className={`ml-1 text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                activeCalendar.status === 'Published'
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                  : 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-amber-300 dark:border-amber-800'
              }`}>
                {activeCalendar.status}
              </span>
            </div>
          </div>

          {/* Top Actions: Year View / List View, Create Calendar, New Holiday */}
          <div className="flex flex-wrap items-center gap-2">
            {/* View Toggle */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  viewMode === 'list'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>List View</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('year')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  viewMode === 'year'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <CalendarIcon className="w-3.5 h-3.5" />
                <span>Year View</span>
              </button>
            </div>

            {/* Create Holiday Calendar Button */}
            <button
              type="button"
              onClick={onOpenCreateCalendar}
              className="px-3.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-colors shadow-2xs flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span>Create Calendar</span>
            </button>

            {/* New Holiday Button */}
            <button
              type="button"
              onClick={onOpenCreateHoliday}
              className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl transition-colors shadow-xs flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Holiday</span>
            </button>
          </div>
        </div>

        {/* Selected Calendar Summary Banner */}
        <div className="bg-slate-50/80 dark:bg-slate-800/60 rounded-xl p-3 border border-slate-200/80 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-slate-900 dark:text-white">{activeCalendar.name}</span>
            <span className="text-slate-400 dark:text-slate-500">·</span>
            <span className="text-slate-600 dark:text-slate-300">{activeCalendar.region}</span>
            <span className="text-slate-400 dark:text-slate-500">·</span>
            <span className="text-slate-500 dark:text-slate-400">{activeCalendar.description}</span>
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            Assigned Staff: <strong className="text-slate-800 dark:text-slate-200">{activeCalendar.assignedEmployeesCount}</strong> · Configured: <strong className="text-slate-800 dark:text-slate-200">{calendarHolidays.length} days</strong>
          </div>
        </div>
      </div>

      {/* Policy Summary Cards (Preserving exact statutory logic) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total Pooled */}
        <div className="bg-white dark:bg-slate-900 border border-sky-200 dark:border-sky-800 rounded-2xl p-4 shadow-2xs group relative">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-sky-800 dark:text-sky-300">Total Pooled</span>
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
              Mandatory + Choice
            </span>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-3xl font-black text-sky-950 dark:text-sky-100 font-mono">
              {activeCalendar.policy.totalPooled}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Days</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Total holiday entitlement for assigned employees
          </p>
        </div>

        {/* Mandatory */}
        <div className="bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-4 shadow-2xs group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">Mandatory</span>
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              Fixed Observed
            </span>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-900 dark:text-emerald-200 font-mono">
              {activeCalendar.policy.mandatoryCount}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">/ {mandatoryCount} configured</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Fixed observed holidays for all employees
          </p>
        </div>

        {/* Choice Pool */}
        <div className="bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 shadow-2xs group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-800 dark:text-amber-300">Choice Pool</span>
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
              Employee Picks
            </span>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-3xl font-black text-amber-900 dark:text-amber-200 font-mono">
              {activeCalendar.policy.choicePool}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Choices allowed</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Number of optional holidays employee may choose
          </p>
        </div>

        {/* Optional Available */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xs group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Optional Available</span>
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              Catalog Size
            </span>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 dark:text-white font-mono">
              {activeCalendar.policy.optionalAvailable}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">/ {optionalCount} in catalog</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Total optional choices provided in this calendar
          </p>
        </div>
      </div>

      {/* Main Content: List View vs Year View */}
      {viewMode === 'year' ? (
        <HolidayYearView
          year={activeCalendar.year}
          holidays={calendarHolidays}
          onSelectHoliday={(hol) => onEditHoliday(hol)}
        />
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
          {/* Filter / Search Bar */}
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-800/40">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-300">Filter Type:</span>
              <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-2xs">
                {(['All', 'Mandatory', 'Optional'] as const).map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setSelectedTypeFilter(t)}
                    className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                      selectedTypeFilter === t
                        ? 'bg-slate-900 dark:bg-sky-600 text-white shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {selectedRowIds.length > 0 && (
                <button
                  type="button"
                  onClick={handleBulkDelete}
                  className="px-3 py-1.5 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 shadow-2xs"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Selected ({selectedRowIds.length})</span>
                </button>
              )}

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search holiday by name or date..."
                  value={holidaySearchQuery}
                  onChange={(e) => setHolidaySearchQuery(e.target.value)}
                  className="border border-slate-300 dark:border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:ring-2 focus:ring-sky-500 w-52 sm:w-64"
                />
              </div>
            </div>
          </div>

          {/* Holidays Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="p-3 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={
                        filteredHolidays.length > 0 &&
                        selectedRowIds.length === filteredHolidays.length
                      }
                      onChange={handleToggleSelectAll}
                      className="rounded border-slate-300 dark:border-slate-600 text-sky-600 focus:ring-sky-500 w-3.5 h-3.5"
                    />
                  </th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Holiday Name</th>
                  <th className="px-4 py-3">Day of Week</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900">
                {filteredHolidays.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400 dark:text-slate-500">
                      No holidays found in &quot;{activeCalendar.name}&quot; matching the search criteria.
                    </td>
                  </tr>
                ) : (
                  filteredHolidays.map((h) => {
                    const isChecked = selectedRowIds.includes(h.id);
                    const isMandatory = h.type === 'Mandatory';

                    return (
                      <tr 
                        key={h.id} 
                        className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors ${isChecked ? 'bg-sky-50/40 dark:bg-slate-800/40' : ''}`}
                      >
                        <td className="p-3 text-center">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleToggleRow(h.id)}
                            className="rounded border-slate-300 dark:border-slate-600 text-sky-600 focus:ring-sky-500 w-3.5 h-3.5"
                          />
                        </td>
                        <td className="px-4 py-3 font-mono font-bold text-slate-800 dark:text-slate-200">
                          {h.date}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-bold text-slate-900 dark:text-white">{h.name}</div>
                          {h.description && (
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{h.description}</div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-600 dark:text-slate-300 font-medium">
                          {h.dayOfWeek}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2.5 py-0.5 rounded text-[11px] font-bold border ${
                            isMandatory
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                          }`}>
                            {h.type}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                            h.status === 'Active'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                          }`}>
                            {h.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => onEditHoliday(h)}
                              className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                              title="Edit Holiday"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onDuplicateHoliday(h)}
                              className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                              title="Duplicate Holiday"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onDeleteHoliday(h.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                              title="Delete Holiday"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between">
            <span>
              Showing {filteredHolidays.length} of {calendarHolidays.length} holidays in {activeCalendar.name}
            </span>
            <div className="flex items-center gap-3 text-[11px]">
              <span>Mandatory: <strong className="text-emerald-700 dark:text-emerald-300">{mandatoryCount}</strong></span>
              <span>·</span>
              <span>Optional: <strong className="text-amber-700 dark:text-amber-300">{optionalCount}</strong></span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
