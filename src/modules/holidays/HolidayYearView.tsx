import React, { useState } from 'react';
import { Calendar as CalendarIcon, Info, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { HolidayMasterItem } from '../../data/mockHolidayMasterData';

interface HolidayYearViewProps {
  year: number;
  holidays: HolidayMasterItem[];
  onSelectHoliday?: (holiday: HolidayMasterItem) => void;
}

export const HolidayYearView: React.FC<HolidayYearViewProps> = ({
  year,
  holidays,
  onSelectHoliday,
}) => {
  const [selectedHolidayInfo, setSelectedHolidayInfo] = useState<HolidayMasterItem | null>(null);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Map holidays by 'YYYY-MM-DD'
  const holidayDateMap = new Map<string, HolidayMasterItem>();
  holidays.forEach(h => {
    holidayDateMap.set(h.date, h);
  });

  const renderMonthGrid = (monthIndex: number) => {
    const firstDay = new Date(year, monthIndex, 1).getDay();
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    const days: (number | null)[] = [];

    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    for (let d = 1; d <= daysInMonth; d++) {
      days.push(d);
    }

    return (
      <div key={monthIndex} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-2xs">
        <div className="font-bold text-xs text-slate-800 dark:text-slate-100 border-b border-slate-100 dark:border-slate-800 pb-2 mb-2 flex items-center justify-between">
          <span>{monthNames[monthIndex]}</span>
          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">{year}</span>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold text-slate-400 dark:text-slate-500 mb-1">
          <span>Su</span>
          <span>Mo</span>
          <span>Tu</span>
          <span>We</span>
          <span>Th</span>
          <span>Fr</span>
          <span>Sa</span>
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 gap-1 text-center text-xs">
          {days.map((day, idx) => {
            if (day === null) {
              return <div key={`empty-${idx}`} className="h-6" />;
            }

            const monthStr = (monthIndex + 1).toString().padStart(2, '0');
            const dayStr = day.toString().padStart(2, '0');
            const dateKey = `${year}-${monthStr}-${dayStr}`;
            const holiday = holidayDateMap.get(dateKey);

            if (holiday) {
              const isMandatory = holiday.type === 'Mandatory';
              return (
                <button
                  key={dateKey}
                  type="button"
                  onClick={() => {
                    setSelectedHolidayInfo(holiday);
                    if (onSelectHoliday) onSelectHoliday(holiday);
                  }}
                  className={`h-6 w-full rounded flex items-center justify-center font-bold text-[11px] transition-transform hover:scale-110 shadow-2xs relative group ${
                    isMandatory
                      ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                      : 'bg-amber-500 text-white hover:bg-amber-600'
                  }`}
                  title={`${holiday.name} (${holiday.type})`}
                >
                  {day}
                  {/* Subtle marker dot */}
                  <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-white ring-1 ring-slate-900/20" />
                </button>
              );
            }

            const isWeekend = (firstDay + day - 1) % 7 === 0 || (firstDay + day - 1) % 7 === 6;

            return (
              <div
                key={dateKey}
                className={`h-6 flex items-center justify-center text-[11px] rounded ${
                  isWeekend ? 'text-slate-400 dark:text-slate-500 font-medium' : 'text-slate-700 dark:text-slate-300'
                }`}
              >
                {day}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Visual Header / Legend */}
      <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 sm:px-4 sm:py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-4">
          <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <CalendarIcon className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            <span>{year} Calendar Overview</span>
          </span>

          <div className="flex items-center gap-3 text-[11px]">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-emerald-600 inline-block shadow-2xs" />
              <strong className="text-slate-800 dark:text-slate-200">Mandatory</strong>
              <span className="text-slate-500 dark:text-slate-400 font-normal">({holidays.filter(h => h.type === 'Mandatory').length} fixed)</span>
            </span>

            <span className="inline-flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-amber-500 inline-block shadow-2xs" />
              <strong className="text-slate-800 dark:text-slate-200">Optional</strong>
              <span className="text-slate-500 dark:text-slate-400 font-normal">({holidays.filter(h => h.type === 'Optional').length} available)</span>
            </span>

            <span className="inline-flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
              <span className="w-3 h-3 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 inline-block" />
              <span>Working Day</span>
            </span>
          </div>
        </div>

        <div className="text-[11px] text-slate-500 dark:text-slate-400">
          Click any highlighted holiday date to inspect details
        </div>
      </div>

      {/* Selected Holiday Inspector Banner */}
      {selectedHolidayInfo && (
        <div className="bg-white dark:bg-slate-900 border border-sky-200 dark:border-sky-800 rounded-xl p-3.5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 animate-in fade-in duration-150">
          <div className="flex items-start sm:items-center gap-2.5">
            <span className={`px-2 py-0.5 text-[11px] font-bold rounded uppercase tracking-wider ${
              selectedHolidayInfo.type === 'Mandatory'
                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
            }`}>
              {selectedHolidayInfo.type}
            </span>
            <div>
              <p className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                {selectedHolidayInfo.name}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {selectedHolidayInfo.date} · {selectedHolidayInfo.dayOfWeek} {selectedHolidayInfo.description && `· ${selectedHolidayInfo.description}`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSelectedHolidayInfo(null)}
            className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white self-end sm:self-center font-medium px-2 py-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
          >
            Close
          </button>
        </div>
      )}

      {/* 12 Months Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {Array.from({ length: 12 }, (_, i) => renderMonthGrid(i))}
      </div>
    </div>
  );
};
