import React, { useState } from 'react';
import { Sliders, Save, CheckCircle2, ShieldCheck, Clock, AlertCircle } from 'lucide-react';

import { SelectMenu } from '../../components/ui/SelectMenu';
interface SettingsSubmoduleProps {
  onShowToast: (msg: string) => void;
  onNavigateToCycles?: () => void;
}

export const SettingsSubmodule: React.FC<SettingsSubmoduleProps> = ({ onShowToast, onNavigateToCycles }) => {
  const [settingsData, setSettingsData] = useState({
    fullDayHours: '08:30',
    halfDayHours: '04:30',
    absentThreshold: '03:00',
    enableGracePeriod: true,
    lateThresholdMins: '15',
    includeGraceInLate: false,
    enableLateGrouping: true,
    lateRuleCount: '3',
    lateRuleDeduction: '1 Half Day',
    minWorkingHours: '08:00',
    autoDeductLunch: true,
    lunchDurationMins: '45',
    earlyExitThresholdMins: '15',
    biometricSyncMode: 'First In - Last Out',
  });

  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    setIsSaved(true);
    onShowToast('Attendance calculation rules and settings saved successfully.');
    setTimeout(() => setIsSaved(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Attendance Settings & Calculation Rules</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Configure working hours, late arrival thresholds, biometric sync rules, and grace period deductions for 2COMS Services.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {onNavigateToCycles && (
            <button
              type="button"
              onClick={onNavigateToCycles}
              className="px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg shadow-2xs transition-colors"
            >
              Go to Cycles & Muster
            </button>
          )}
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Settings</span>
          </button>
        </div>
      </div>

      {isSaved && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-lg text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span className="font-semibold">Settings successfully updated for client 2COMS Services (Hyderabad).</span>
        </div>
      )}

      {/* Main Settings Form Card */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs divide-y divide-slate-100 dark:divide-slate-800">
        {/* Section 1: Working Hours Thresholds */}
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Standard Working Hours Thresholds</h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Define daily statutory working hour benchmarks for present, half-day, and automatic absent marks.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-900 dark:text-slate-200 mb-1.5">
                Full Day Hours <span className="text-rose-500 font-bold">*</span>
              </label>
              <input
                type="text"
                value={settingsData.fullDayHours}
                onChange={(e) => setSettingsData({ ...settingsData, fullDayHours: e.target.value })}
                className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-sky-500 font-mono"
                placeholder="08:30"
              />
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Minimum hours required for a 100% Present mark.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-900 dark:text-slate-200 mb-1.5">
                Half Day Hours <span className="text-rose-500 font-bold">*</span>
              </label>
              <input
                type="text"
                value={settingsData.halfDayHours}
                onChange={(e) => setSettingsData({ ...settingsData, halfDayHours: e.target.value })}
                className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-sky-500 font-mono"
                placeholder="04:30"
              />
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Hours required to mark half-day present.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-900 dark:text-slate-200 mb-1.5">
                Absent Threshold <span className="text-rose-500 font-bold">*</span>
              </label>
              <input
                type="text"
                value={settingsData.absentThreshold}
                onChange={(e) => setSettingsData({ ...settingsData, absentThreshold: e.target.value })}
                className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-sky-500 font-mono"
                placeholder="03:00"
              />
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Punching below this duration automatically marks Absent.</p>
            </div>
          </div>
        </div>

        {/* Section 2: Grace Period & Late Comer Rules */}
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Grace Period & Late Comer Rules</h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Configure buffer windows, late mark accumulation policies, and salary deduction groupings.
          </p>

          <div className="space-y-4 pt-2">
            <label className="flex items-start gap-3 p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer hover:bg-slate-100/60 dark:hover:bg-slate-800 transition-colors">
              <input
                type="checkbox"
                checked={settingsData.enableGracePeriod}
                onChange={(e) => setSettingsData({ ...settingsData, enableGracePeriod: e.target.checked })}
                className="rounded border-slate-300 dark:border-slate-600 text-sky-600 focus:ring-sky-500 w-4 h-4 mt-0.5 bg-white dark:bg-slate-700"
              />
              <div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-100 block">Enable Grace Period</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">Allow a buffer window after shift start time before marking employee late.</span>
              </div>
            </label>

            {settingsData.enableGracePeriod && (
              <div className="pl-6 border-l-2 border-sky-400 dark:border-sky-500 space-y-3 py-1">
                <div className="max-w-xs">
                  <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
                    Late Threshold (Minutes)
                  </label>
                  <input
                    type="number"
                    value={settingsData.lateThresholdMins}
                    onChange={(e) => setSettingsData({ ...settingsData, lateThresholdMins: e.target.value })}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg px-3 py-1.5 text-xs font-mono"
                    placeholder="15"
                  />
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 block">Default grace buffer after shift start time.</span>
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settingsData.includeGraceInLate}
                    onChange={(e) => setSettingsData({ ...settingsData, includeGraceInLate: e.target.checked })}
                    className="rounded border-slate-300 dark:border-slate-600 text-sky-600 focus:ring-sky-500 w-3.5 h-3.5 bg-white dark:bg-slate-700"
                  />
                  <span className="text-xs text-slate-700 dark:text-slate-300">Include grace period in late calculation formula</span>
                </label>
              </div>
            )}

            <label className="flex items-start gap-3 p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer hover:bg-slate-100/60 dark:hover:bg-slate-800 transition-colors">
              <input
                type="checkbox"
                checked={settingsData.enableLateGrouping}
                onChange={(e) => setSettingsData({ ...settingsData, enableLateGrouping: e.target.checked })}
                className="rounded border-slate-300 dark:border-slate-600 text-sky-600 focus:ring-sky-500 w-4 h-4 mt-0.5 bg-white dark:bg-slate-700"
              />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-100">Enable Late Grouping & Auto Deductions</span>
                  <span className="text-[10px] font-semibold text-sky-700 dark:text-sky-300 bg-sky-100 dark:bg-sky-950/60 px-2 py-0.5 rounded border border-sky-200 dark:border-sky-800">
                    Active Rule: 3 Lates = 1 Half Day
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                  Automatically convert accumulated late marks in a month into statutory half-day leave or pay deduction.
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* Section 3: Break & Biometric Reconciliation Policies */}
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Break Auto-Deduction & Biometric Rules</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
            <div>
              <label className="flex items-center gap-2 cursor-pointer mb-2">
                <input
                  type="checkbox"
                  checked={settingsData.autoDeductLunch}
                  onChange={(e) => setSettingsData({ ...settingsData, autoDeductLunch: e.target.checked })}
                  className="rounded border-slate-300 dark:border-slate-600 text-sky-600 focus:ring-sky-500 w-4 h-4 bg-white dark:bg-slate-700"
                />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-100">Auto-Deduct Lunch Break</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  disabled={!settingsData.autoDeductLunch}
                  value={settingsData.lunchDurationMins}
                  onChange={(e) => setSettingsData({ ...settingsData, lunchDurationMins: e.target.value })}
                  className="w-32 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg px-3 py-1.5 text-xs font-mono disabled:bg-slate-100 dark:disabled:bg-slate-900 disabled:opacity-50"
                />
                <span className="text-xs text-slate-600 dark:text-slate-300">Minutes deducted daily</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
                Biometric Punch Sync Mode
              </label>
              <SelectMenu
                value={settingsData.biometricSyncMode}
                onChange={(e) => setSettingsData({ ...settingsData, biometricSyncMode: e.target.value })}
                className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-sky-500"
              >
                <option value="First In - Last Out">First In - Last Out (Standard Corporate)</option>
                <option value="Every In - Out Accumulated">Every In - Out Accumulated (Turnstile Multi-Punch)</option>
              </SelectMenu>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Calculates gross duration between earliest check-in and latest check-out.</p>
            </div>
          </div>
        </div>

        {/* Section 4: Footer Actions */}
        <div className="p-4 bg-slate-50 dark:bg-slate-850 dark:bg-slate-800/80 flex items-center justify-between text-xs">
          <span className="text-slate-500 dark:text-slate-400 font-mono">Last modified: 24 Sep 2026 by SuperAdmin</span>
          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-bold shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
};
