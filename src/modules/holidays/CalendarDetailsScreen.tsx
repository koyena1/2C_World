import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Send, 
  Users, 
  List, 
  Calendar as CalendarIcon, 
  FileText, 
  Plus, 
  Edit3, 
  Copy, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle,
  Globe,
  Clock,
  Sparkles,
  Info
} from 'lucide-react';
import { 
  HolidayCalendar, 
  HolidayMasterItem, 
  HolidayEmployeeRecord 
} from '../../data/mockHolidayMasterData';
import { HolidayYearView } from './HolidayYearView';
import { SelectionReportsView } from './SelectionReportsView';

interface CalendarDetailsScreenProps {
  calendar: HolidayCalendar;
  holidays: HolidayMasterItem[];
  employees: HolidayEmployeeRecord[];
  onBack: () => void;
  onOpenAssignModal: () => void;
  onOpenCreateHoliday: () => void;
  onEditHoliday: (holiday: HolidayMasterItem) => void;
  onDuplicateHoliday: (holiday: HolidayMasterItem) => void;
  onDeleteHoliday: (holidayId: string) => void;
  onTogglePublish: (calendarId: string) => void;
  onShowToast: (msg: string) => void;
}

export const CalendarDetailsScreen: React.FC<CalendarDetailsScreenProps> = ({
  calendar,
  holidays,
  employees,
  onBack,
  onOpenAssignModal,
  onOpenCreateHoliday,
  onEditHoliday,
  onDuplicateHoliday,
  onDeleteHoliday,
  onTogglePublish,
  onShowToast,
}) => {
  // View toggle: 'list' | 'year' | 'reports'
  const [subView, setSubView] = useState<'list' | 'year' | 'reports'>('list');
  const [searchHolidayQuery, setSearchHolidayQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'All' | 'Mandatory' | 'Optional'>('All');

  // Holidays belonging to this calendar
  const calendarHolidays = holidays.filter(h => h.calendarId === calendar.id);

  const filteredHolidays = calendarHolidays.filter(h => {
    if (typeFilter !== 'All' && h.type !== typeFilter) return false;
    if (searchHolidayQuery.trim()) {
      return h.name.toLowerCase().includes(searchHolidayQuery.toLowerCase()) ||
             h.date.includes(searchHolidayQuery);
    }
    return true;
  });

  const mandatoryHolidays = calendarHolidays.filter(h => h.type === 'Mandatory');
  const optionalHolidays = calendarHolidays.filter(h => h.type === 'Optional');

  const isPublished = calendar.status === 'Published';

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Breadcrumb & Operations Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors shadow-2xs"
            title="Back to Holiday Calendars"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                {calendar.name}
              </h1>
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                {calendar.year}
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                isPublished 
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800' 
                  : 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-amber-300 dark:border-amber-800'
              }`}>
                {calendar.status}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Region: <strong className="text-slate-700 dark:text-slate-200 font-semibold">{calendar.region}</strong> · Assigned: <strong className="text-slate-800 dark:text-white font-bold">{calendar.assignedEmployeesCount} Staff</strong> · Last updated: {calendar.lastUpdated}
            </p>
          </div>
        </div>

        {/* Top Operations Actions: Back, Publish Calendar, Assign Employees */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => onTogglePublish(calendar.id)}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-2xs border ${
              isPublished
                ? 'bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white border-transparent'
            }`}
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isPublished ? 'Unpublish Calendar' : 'Publish Calendar'}</span>
          </button>

          <button
            type="button"
            onClick={onOpenAssignModal}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-colors shadow-xs flex items-center gap-1.5"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Assign Employees</span>
          </button>
        </div>
      </div>

      {/* Summary Metrics & Entitlement Policy Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total Pooled (Mandatory + Choice Pool) */}
        <div className="cc-card-hover bg-white dark:bg-slate-900 border border-sky-200 dark:border-sky-800 rounded-2xl p-4 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-sky-800 dark:text-sky-300">Total Pooled</span>
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
              Mandatory + Choice
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-sky-950 dark:text-sky-100 font-mono">
              {calendar.policy.totalPooled}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Days entitlement</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Total holiday days an employee is guaranteed
          </p>
        </div>

        {/* Mandatory Count */}
        <div className="cc-card-hover bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">Mandatory Holidays</span>
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
              Fixed Days
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-emerald-900 dark:text-emerald-200 font-mono">
              {calendar.policy.mandatoryCount}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">/ {mandatoryHolidays.length} configured</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Fixed observed holidays for all assigned employees
          </p>
        </div>

        {/* Choice Pool */}
        <div className="cc-card-hover bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-800 dark:text-amber-300">Choice Pool</span>
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
              Pick Any {calendar.policy.choicePool}
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-amber-900 dark:text-amber-200 font-mono">
              {calendar.policy.choicePool}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">of {calendar.policy.optionalAvailable} Available</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
            Number of optional choices each employee picks
          </p>
        </div>

        {/* Choice Selections & Visibility */}
        <div className="cc-card-hover bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Intake Progress</span>
            <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
              isPublished ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
            }`}>
              <Globe className="w-3 h-3" />
              {isPublished ? 'Live on Portal' : 'Unpublished'}
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 dark:text-white font-mono">
              {calendar.intakeAnalytics.rate}%
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              ({calendar.intakeAnalytics.selected} / {calendar.assignedEmployeesCount})
            </span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden border border-slate-200 dark:border-slate-700">
            <div 
              className="bg-emerald-600 h-full rounded-full transition-all"
              style={{ width: `${calendar.intakeAnalytics.rate}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Section: "Holidays in this Calendar" with View Toggles */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
        {/* Navigation View Switcher */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Holidays in this Calendar
            </h2>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-normal">
              ({calendarHolidays.length} total)
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* View Mode Toggle: List View | Year View | Selection Reports */}
            <div className="flex items-center gap-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-1 rounded-xl shadow-2xs">
              <button
                type="button"
                onClick={() => setSubView('list')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
                  subView === 'list'
                    ? 'bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300 shadow-2xs border border-sky-200 dark:border-sky-800'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>List View</span>
              </button>

              <button
                type="button"
                onClick={() => setSubView('year')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
                  subView === 'year'
                    ? 'bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300 shadow-2xs border border-sky-200 dark:border-sky-800'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <CalendarIcon className="w-3.5 h-3.5" />
                <span>Year View</span>
              </button>

              <button
                type="button"
                onClick={() => setSubView('reports')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
                  subView === 'reports'
                    ? 'bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300 shadow-2xs border border-sky-200 dark:border-sky-800'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Selection Reports</span>
              </button>
            </div>

            {subView !== 'reports' && (
              <button
                type="button"
                onClick={onOpenCreateHoliday}
                className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Holiday</span>
              </button>
            )}
          </div>
        </div>

        {/* Content View Switching */}
        <div className="p-4 sm:p-5">
          {/* SubView 1: List View */}
          {subView === 'list' && (
            <div className="space-y-4">
              {/* Filter controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Filter by Type:</span>
                  <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                    {(['All', 'Mandatory', 'Optional'] as const).map(t => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setTypeFilter(t)}
                        className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors ${
                          typeFilter === t
                            ? 'bg-slate-900 dark:bg-sky-600 text-white shadow-2xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search holiday name or date..."
                    value={searchHolidayQuery}
                    onChange={(e) => setSearchHolidayQuery(e.target.value)}
                    className="border border-slate-300 dark:border-slate-700 rounded-lg pl-3 pr-3 py-1.5 text-xs bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:ring-2 focus:ring-sky-500 w-52 sm:w-64"
                  />
                </div>
              </div>

              {/* Table */}
              <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-2xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
                    <tr>
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
                        <td colSpan={6} className="p-8 text-center text-slate-400 dark:text-slate-500">
                          No holidays found in this calendar matching filter.
                        </td>
                      </tr>
                    ) : (
                      filteredHolidays.map((h) => {
                        const isMandatory = h.type === 'Mandatory';
                        return (
                          <tr key={h.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
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
                              <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${
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
                              <div className="inline-flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => onEditHoliday(h)}
                                  className="p-1 rounded text-slate-500 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                  title="Edit Holiday"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onDuplicateHoliday(h)}
                                  className="p-1 rounded text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                  title="Duplicate Holiday"
                                >
                                  <Copy className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onDeleteHoliday(h.id)}
                                  className="p-1 rounded text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
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
            </div>
          )}

          {/* SubView 2: Year View */}
          {subView === 'year' && (
            <HolidayYearView
              year={calendar.year}
              holidays={calendarHolidays}
              onSelectHoliday={(hol) => onEditHoliday(hol)}
            />
          )}

          {/* SubView 3: Selection Reports View */}
          {subView === 'reports' && (
            <SelectionReportsView
              calendar={calendar}
              employees={employees}
              onShowToast={onShowToast}
            />
          )}
        </div>
      </div>
    </div>
  );
};
