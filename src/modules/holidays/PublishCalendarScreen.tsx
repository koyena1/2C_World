import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Calendar as CalendarIcon, 
  Users, 
  Send, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Plus, 
  Sparkles,
  ExternalLink,
  Layers
} from 'lucide-react';
import { HolidayCalendar, HolidayMasterItem } from '../../data/mockHolidayMasterData';

import { SelectMenu } from '../../components/ui/SelectMenu';
interface PublishCalendarScreenProps {
  calendars: HolidayCalendar[];
  holidays: HolidayMasterItem[];
  onOpenDetails: (calendar: HolidayCalendar) => void;
  onTogglePublish: (calendarId: string) => void;
  onOpenCreateCalendar: () => void;
}

export const PublishCalendarScreen: React.FC<PublishCalendarScreenProps> = ({
  calendars,
  holidays,
  onOpenDetails,
  onTogglePublish,
  onOpenCreateCalendar,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState<number | 'All'>('All');
  const [selectedRegion, setSelectedRegion] = useState('All');

  const regionOptions = useMemo(() => {
    const set = new Set(calendars.map(c => c.region));
    return ['All', ...Array.from(set)];
  }, [calendars]);

  const yearOptions = [2026, 2025, 2027];

  const filteredCalendars = useMemo(() => {
    return calendars.filter(cal => {
      if (selectedYear !== 'All' && cal.year !== selectedYear) return false;
      if (selectedRegion !== 'All' && cal.region !== selectedRegion) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return cal.name.toLowerCase().includes(q) || cal.region.toLowerCase().includes(q);
      }
      return true;
    });
  }, [calendars, selectedYear, selectedRegion, searchQuery]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Search and Filters Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
              Publish Holiday Calendar
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Review regional holiday schedules, intake progress, and control portal publishing state.
            </p>
          </div>

          <button
            type="button"
            onClick={onOpenCreateCalendar}
            className="px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl transition-colors shadow-xs flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Holiday Calendar</span>
          </button>
        </div>

        {/* Filter inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
          {/* Search Calendars */}
          <div className="lg:col-span-6">
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
              Search Calendars
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by calendar name or state..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:ring-2 focus:ring-sky-500 shadow-2xs font-medium"
              />
            </div>
          </div>

          {/* Filter by Year */}
          <div className="lg:col-span-3">
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
              Filter by Year
            </label>
            <SelectMenu
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value === 'All' ? 'All' : Number(e.target.value))}
              className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-100 font-medium shadow-2xs"
            >
              <option value="All">All Years</option>
              {yearOptions.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </SelectMenu>
          </div>

          {/* Filter by Region */}
          <div className="lg:col-span-3">
            <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
              Filter by Region
            </label>
            <SelectMenu
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-100 font-medium shadow-2xs"
            >
              {regionOptions.map(r => (
                <option key={r} value={r}>{r === 'All' ? 'All Regions' : r}</option>
              ))}
            </SelectMenu>
          </div>
        </div>
      </div>

      {/* Created Holiday Calendars Section Header */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              Created Holiday Calendars
            </h3>
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              {filteredCalendars.length}
            </span>
          </div>

          <span className="text-xs text-slate-500 dark:text-slate-400">
            Click &quot;View Details&quot; to manage holidays, assign staff, and review selection reports
          </span>
        </div>

        {/* Calendar Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredCalendars.length === 0 ? (
            <div className="col-span-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-12 text-center text-slate-400 dark:text-slate-500">
              <CalendarIcon className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="font-bold text-slate-700 dark:text-slate-300">No holiday calendars found</p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Try resetting the year or region filters above.</p>
            </div>
          ) : (
            filteredCalendars.map(cal => {
              const isPublished = cal.status === 'Published';
              const calHolidays = holidays.filter(h => h.calendarId === cal.id);
              const mandatoryCount = calHolidays.filter(h => h.type === 'Mandatory').length;
              const optionalCount = calHolidays.filter(h => h.type === 'Optional').length;

              return (
                <div
                  key={cal.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  <div className="space-y-3.5">
                    {/* Top Row: Name, Year & Status Badge */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors">
                            {cal.name}
                          </h4>
                          <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            {cal.year}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{cal.region}</span>
                        </p>
                      </div>

                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border shrink-0 ${
                        isPublished
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                          : 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                      }`}>
                        {cal.status}
                      </span>
                    </div>

                    {/* Policy & Counts Row */}
                    <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-xl border border-slate-100 dark:border-slate-700 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold block">Assigned Staff</span>
                        <span className="text-sm font-bold text-slate-800 dark:text-white font-mono">
                          {cal.assignedEmployeesCount} Employees
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold block">Configured Days</span>
                        <span className="text-sm font-bold text-slate-800 dark:text-white font-mono">
                          {calHolidays.length} Days <span className="text-[10px] font-normal text-slate-500 dark:text-slate-400">({mandatoryCount}M / {optionalCount}O)</span>
                        </span>
                      </div>
                    </div>

                    {/* Entitlement Pill */}
                    <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-300 px-1">
                      <span>Total Pooled Entitlement:</span>
                      <strong className="text-sky-900 dark:text-sky-200 font-mono font-bold bg-sky-50 dark:bg-sky-950 px-2 py-0.5 rounded border border-sky-200 dark:border-sky-800">
                        {cal.policy.totalPooled} Days
                      </strong>
                    </div>

                    {/* Intake Analytics Progress */}
                    <div className="space-y-1.5 pt-1 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-700 dark:text-slate-300">Optional Intake Rate:</span>
                        <strong className="font-mono text-emerald-700 dark:text-emerald-400 font-bold">{cal.intakeAnalytics.rate}%</strong>
                      </div>

                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700">
                        <div
                          className="bg-emerald-600 h-full rounded-full transition-all duration-300"
                          style={{ width: `${cal.intakeAnalytics.rate}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                        <span>Selected: <strong className="text-slate-800 dark:text-slate-200">{cal.intakeAnalytics.selected}</strong></span>
                        <span>Pending: <strong className="text-slate-800 dark:text-slate-200">{cal.intakeAnalytics.notSelected}</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Card Actions Footer */}
                  <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => onTogglePublish(cal.id)}
                      className={`text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition-colors flex items-center gap-1 ${
                        isPublished
                          ? 'border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/60'
                          : 'border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/60'
                      }`}
                    >
                      <Send className="w-3 h-3" />
                      <span>{isPublished ? 'Unpublish' : 'Publish'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => onOpenDetails(cal)}
                      className="px-3.5 py-1.5 bg-slate-900 dark:bg-sky-600 hover:bg-slate-800 dark:hover:bg-sky-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
                    >
                      <span>View Details</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
