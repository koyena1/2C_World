import React, { useState } from 'react';
import { X, Calendar as CalendarIcon, Info, HelpCircle } from 'lucide-react';
import { HolidayCalendar } from '../../data/mockHolidayMasterData';

import { SelectMenu } from '../../components/ui/SelectMenu';
interface CreateCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (calendarData: Partial<HolidayCalendar>) => void;
}

export const CreateCalendarModal: React.FC<CreateCalendarModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [name, setName] = useState('');
  const [region, setRegion] = useState('West Bengal - Kolkata');
  const [year, setYear] = useState<number>(2026);
  const [mandatoryCount, setMandatoryCount] = useState<number>(10);
  const [choicePool, setChoicePool] = useState<number>(3);
  const [optionalAvailable, setOptionalAvailable] = useState<number>(6);
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  // Exact entitlement logic: Total Pooled = Mandatory + Choice Pool
  const totalPooled = (Number(mandatoryCount) || 0) + (Number(choicePool) || 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!name.trim()) newErrors.name = 'Calendar name is required.';
    if (!region.trim()) newErrors.region = 'Region is required.';
    if (choicePool > optionalAvailable) {
      newErrors.choicePool = 'Choice Pool cannot exceed Optional Available holidays.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSubmit({
      id: `cal-${Date.now()}`,
      name: name.trim(),
      region: region.trim(),
      year: Number(year),
      status: 'Draft',
      policy: {
        mandatoryCount: Number(mandatoryCount),
        choicePool: Number(choicePool),
        optionalAvailable: Number(optionalAvailable),
        totalPooled,
      },
      assignedEmployeesCount: 0,
      createdHolidayCount: 0,
      intakeAnalytics: {
        selected: 0,
        notSelected: 0,
        rate: 0,
      },
      lastUpdated: 'Just now',
      description: description.trim() || `Holiday schedule for ${region}`,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Create Holiday Calendar</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Define a regional calendar and holiday entitlement policy
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Calendar Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Kolkata 2026 / West Bengal Regional"
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
            {errors.name && <p className="text-[11px] text-rose-600 mt-1">{errors.name}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Region / State <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                placeholder="e.g. West Bengal"
                className="w-full border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-sky-500 font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Calendar Year <span className="text-rose-500">*</span>
              </label>
              <SelectMenu
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="w-full border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-sky-500 font-medium"
              >
                <option value={2026}>2026</option>
                <option value={2025}>2025</option>
                <option value={2027}>2027</option>
              </SelectMenu>
            </div>
          </div>

          {/* Holiday Policy Entitlement Section */}
          <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
              <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>Holiday Entitlement Policy</span>
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Preserved statutory rules</span>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Mandatory
                </label>
                <input
                  type="number"
                  min={0}
                  max={30}
                  value={mandatoryCount}
                  onChange={(e) => setMandatoryCount(Number(e.target.value))}
                  className="w-full border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 font-bold"
                />
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">Fixed observed</span>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Choice Pool
                </label>
                <input
                  type="number"
                  min={0}
                  max={15}
                  value={choicePool}
                  onChange={(e) => setChoicePool(Number(e.target.value))}
                  className="w-full border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 font-bold"
                />
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">Employee picks</span>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Opt. Available
                </label>
                <input
                  type="number"
                  min={0}
                  max={30}
                  value={optionalAvailable}
                  onChange={(e) => setOptionalAvailable(Number(e.target.value))}
                  className="w-full border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800 font-bold"
                />
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block mt-0.5">Choices provided</span>
              </div>
            </div>

            {errors.choicePool && (
              <p className="text-[11px] text-rose-600 font-medium">{errors.choicePool}</p>
            )}

            {/* Total Pooled Summary Card */}
            <div className="bg-white dark:bg-slate-900 border border-sky-200 dark:border-sky-800 rounded-lg p-2.5 flex items-center justify-between text-xs">
              <span className="text-slate-600 dark:text-slate-300 font-medium">
                Total Pooled (Mandatory + Choice Pool):
              </span>
              <span className="text-sm font-bold text-sky-700 dark:text-sky-300 font-mono">
                {totalPooled} Days
              </span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Description / Applicability Notes
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Statutory and corporate holidays for branch staff..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-800 dark:text-slate-100 bg-white dark:bg-slate-800"
            />
          </div>

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
              Create Calendar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
