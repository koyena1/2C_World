import React, { useState, useEffect } from 'react';
import { X, Calendar as CalendarIcon, AlertCircle, Info, Sparkles } from 'lucide-react';
import { HolidayCalendar, HolidayMasterItem } from '../../data/mockHolidayMasterData';

import { SelectMenu } from '../../components/ui/SelectMenu';
interface CreateHolidayModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (holidayData: Partial<HolidayMasterItem>) => void;
  calendars: HolidayCalendar[];
  activeCalendarId: string;
  initialHoliday?: HolidayMasterItem | null;
}

export const CreateHolidayModal: React.FC<CreateHolidayModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  calendars,
  activeCalendarId,
  initialHoliday,
}) => {
  const [name, setName] = useState('');
  const [date, setDate] = useState('2026-08-15');
  const [dayOfWeek, setDayOfWeek] = useState('Saturday');
  const [type, setType] = useState<'Mandatory' | 'Optional'>('Mandatory');
  const [calendarId, setCalendarId] = useState(activeCalendarId);
  const [status, setStatus] = useState<'Active' | 'Inactive'>('Active');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialHoliday) {
      setName(initialHoliday.name);
      setDate(initialHoliday.date);
      setDayOfWeek(initialHoliday.dayOfWeek);
      setType(initialHoliday.type);
      setCalendarId(initialHoliday.calendarId);
      setStatus(initialHoliday.status);
      setDescription(initialHoliday.description || '');
    } else {
      setName('');
      setDate('2026-08-15');
      setDayOfWeek('Saturday');
      setType('Mandatory');
      setCalendarId(activeCalendarId);
      setStatus('Active');
      setDescription('');
    }
    setErrors({});
  }, [initialHoliday, activeCalendarId, isOpen]);

  if (!isOpen) return null;

  const handleDateChange = (newDate: string) => {
    setDate(newDate);
    const d = new Date(newDate);
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const calculatedDay = !isNaN(d.getTime()) ? dayNames[d.getDay()] : 'Unknown';
    setDayOfWeek(calculatedDay);
    if (errors.date) setErrors(prev => ({ ...prev, date: '' }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'Holiday name is required.';
    }
    if (!date) {
      newErrors.date = 'Holiday date is required.';
    }
    if (!calendarId) {
      newErrors.calendarId = 'Target calendar is required.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit({
      id: initialHoliday ? initialHoliday.id : `hol-${Date.now()}`,
      calendarId,
      name: name.trim(),
      date,
      dayOfWeek,
      type,
      status,
      description: description.trim() || undefined,
    });
    onClose();
  };

  const selectedCalendarObj = calendars.find(c => c.id === calendarId);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {initialHoliday ? 'Edit Holiday' : 'Create New Holiday'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Target Calendar: <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedCalendarObj?.name || 'Selected Calendar'}</span>
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Target Calendar Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Holiday Calendar <span className="text-rose-500">*</span>
            </label>
            <SelectMenu
              value={calendarId}
              onChange={(e) => setCalendarId(e.target.value)}
              className="w-full border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-sky-500 font-medium"
            >
              {calendars.map(cal => (
                <option key={cal.id} value={cal.id}>
                  {cal.name} ({cal.region} · {cal.year})
                </option>
              ))}
            </SelectMenu>
            {errors.calendarId && (
              <p className="text-[11px] text-rose-600 mt-1">{errors.calendarId}</p>
            )}
          </div>

          {/* Holiday Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Holiday Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Durga Puja / Vijaya Dashami"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors(prev => ({ ...prev, name: '' }));
              }}
              className={`w-full border rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-sky-500 font-medium ${
                errors.name 
                  ? 'border-rose-400 bg-rose-50/20 dark:bg-rose-950/20' 
                  : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800'
              }`}
            />
            {errors.name && (
              <p className="text-[11px] text-rose-600 mt-1">{errors.name}</p>
            )}
          </div>

          {/* Date & Calculated Day of Week */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => handleDateChange(e.target.value)}
                className={`w-full border rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-sky-500 font-medium ${
                  errors.date 
                    ? 'border-rose-400 bg-rose-50/20 dark:bg-rose-950/20' 
                    : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800'
                }`}
              />
              {errors.date && (
                <p className="text-[11px] text-rose-600 mt-1">{errors.date}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Day of Week
              </label>
              <input
                type="text"
                readOnly
                value={dayOfWeek}
                className="w-full border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-medium cursor-not-allowed"
              />
            </div>
          </div>

          {/* Type: Mandatory vs Optional with Policy Context */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
              Holiday Type <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className={`border rounded-xl p-3 cursor-pointer transition-all flex flex-col justify-between ${
                type === 'Mandatory'
                  ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/40 ring-1 ring-emerald-500'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750'
              }`}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <input
                      type="radio"
                      name="holidayType"
                      value="Mandatory"
                      checked={type === 'Mandatory'}
                      onChange={() => setType('Mandatory')}
                      className="text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="font-bold text-xs text-slate-900 dark:text-white">Mandatory</span>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                  Fixed observed holiday for all assigned employees.
                </p>
              </label>

              <label className={`border rounded-xl p-3 cursor-pointer transition-all flex flex-col justify-between ${
                type === 'Optional'
                  ? 'border-amber-500 bg-amber-50/50 dark:bg-amber-950/40 ring-1 ring-amber-500'
                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750'
              }`}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <input
                      type="radio"
                      name="holidayType"
                      value="Optional"
                      checked={type === 'Optional'}
                      onChange={() => setType('Optional')}
                      className="text-amber-600 focus:ring-amber-500"
                    />
                    <span className="font-bold text-xs text-slate-900 dark:text-white">Optional</span>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                  Choice-based holiday added to the selection pool.
                </p>
              </label>
            </div>
          </div>

          {/* Status: Active / Inactive */}
          <div className="flex items-center justify-between pt-1">
            <div>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">Holiday Status</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Enable or disable this holiday in payroll & muster</p>
            </div>
            <SelectMenu
              value={status}
              onChange={(e) => setStatus(e.target.value as 'Active' | 'Inactive')}
              className="border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs font-semibold bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </SelectMenu>
          </div>

          {/* Description (Optional) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Description / Notes (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="Add legal gazette reference or notes..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-sky-500"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-lg transition-colors shadow-xs"
            >
              {initialHoliday ? 'Save Changes' : 'Create Holiday'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
