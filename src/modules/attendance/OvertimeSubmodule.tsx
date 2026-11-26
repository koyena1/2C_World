import React, { useState } from 'react';
import { 
  Clock, 
  Save, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  FileText, 
  DollarSign, 
  Sliders, 
  X,
  Filter,
  Check,
  RotateCcw
} from 'lucide-react';
import { 
  OvertimeConfigSettings, 
  OvertimeLogRecord, 
  INITIAL_OVERTIME_CONFIG, 
  INITIAL_OVERTIME_RECORDS 
} from '../../data/mockAttendanceData';

import { SelectMenu } from '../../components/ui/SelectMenu';
import { useKpiDetail } from '../../hooks/useKpiDetail';
import { KpiDetailPanel, type KpiDetailData } from '../../components/page/KpiDetailPanel';
interface OvertimeSubmoduleProps {
  onShowToast: (msg: string) => void;
}

export const OvertimeSubmodule: React.FC<OvertimeSubmoduleProps> = ({ onShowToast }) => {
  const [activeTab, setActiveTab] = useState<'rules' | 'records'>('records');
  const [config, setConfig] = useState<OvertimeConfigSettings>(INITIAL_OVERTIME_CONFIG);
  const [records, setRecords] = useState<OvertimeLogRecord[]>(INITIAL_OVERTIME_RECORDS);

  // Filters
  const [filterDept, setFilterDept] = useState('All Departments');
  const [filterStatus, setFilterStatus] = useState('All Statuses');
  const [searchQuery, setSearchQuery] = useState('');
  const { activeId, toggle, close, isActive } = useKpiDetail<'total' | 'payout' | 'pending' | 'compoff'>();

  const handleSaveConfig = () => {
    onShowToast('Overtime calculation formula and rate multipliers saved successfully.');
  };

  const handleApprove = (recordId: string, name: string) => {
    setRecords(records.map(r => r.id === recordId ? {
      ...r,
      status: 'Approved',
      approver: 'Admin Approver (You)',
    } : r));
    onShowToast(`OT request for ${name} approved.`);
  };

  const handleConvertToCompOff = (recordId: string, name: string) => {
    setRecords(records.map(r => r.id === recordId ? {
      ...r,
      status: 'Converted to Comp-Off',
      approver: 'Admin Approver (You)',
    } : r));
    onShowToast(`OT for ${name} converted to 1 Compensatory Off day.`);
  };

  const filteredRecords = records.filter(r => {
    const matchDept = filterDept === 'All Departments' || r.department === filterDept;
    const matchStatus = filterStatus === 'All Statuses' || r.status === filterStatus;
    const matchSearch = r.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        r.empCode.toLowerCase().includes(searchQuery.toLowerCase());
    return matchDept && matchStatus && matchSearch;
  });

  const kpiDetail: KpiDetailData | null = (() => {
    if (!activeId) return null;
    const cfg = {
      total: { title: 'Total OT Logged', f: (_r: OvertimeLogRecord) => true },
      payout: { title: 'Total Est. Payout', f: (r: OvertimeLogRecord) => r.status === 'Approved' },
      pending: { title: 'Pending Supervisor Sign-Off', f: (r: OvertimeLogRecord) => r.status === 'Pending Supervisor Approval' },
      compoff: { title: 'Comp-Off Converted', f: (r: OvertimeLogRecord) => r.status === 'Converted to Comp-Off' },
    }[activeId];
    const list = records.filter(cfg.f);
    return {
      title: cfg.title,
      subtitle: activeId === 'payout' ? `${list.length} approved record${list.length === 1 ? '' : 's'} making up the payout` : undefined,
      columns: [
        { key: 'emp', label: 'Employee' },
        { key: 'dept', label: 'Department' },
        { key: 'date', label: 'Date', className: 'whitespace-nowrap' },
        { key: 'ot', label: 'OT duration', className: 'font-mono whitespace-nowrap' },
        { key: 'rate', label: 'Rate' },
        { key: 'payout', label: 'Payout', align: 'right' as const, className: 'font-mono' },
        { key: 'status', label: 'Status' },
      ],
      rows: list.map(r => ({ emp: `${r.name} (${r.empCode})`, dept: r.department, date: r.date, ot: r.otDuration, rate: r.rateType, payout: `₹${r.calculatedPayout.toLocaleString('en-IN')}`, status: r.status })),
    };
  })();

  return (
    <div className="space-y-6">
      {/* Header & Sub-tab switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Overtime (OT) Configuration & Approval Desk</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Manage overtime qualifying rules, hourly rate multipliers, comp-off conversion, and statutory OT payouts for 2COMS Services.
          </p>
        </div>

        <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-lg flex items-center gap-1 text-xs self-start sm:self-auto border border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setActiveTab('records')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
              activeTab === 'records' 
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs' 
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            OT Logs & Approvals ({records.length})
          </button>
          <button
            onClick={() => setActiveTab('rules')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
              activeTab === 'rules' 
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs' 
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            OT Calculation Formula & Caps
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <button type="button" onClick={() => toggle('total')} className={`cc-card-hover bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs cc-card-link cursor-pointer text-left ${isActive('total') ? 'cc-card-selected' : ''}`}>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">Total OT Logged</span>
          <span className="text-2xl font-bold text-slate-900 dark:text-white block font-mono mt-0.5">11h 25m</span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">Across 4 qualifying staff</span>
        </button>
        <button type="button" onClick={() => toggle('payout')} className={`cc-card-hover bg-white dark:bg-slate-900 p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/60 shadow-2xs cc-card-link cursor-pointer text-left ${isActive('payout') ? 'cc-card-selected' : ''}`}>
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block">Total Est. Payout</span>
          <span className="text-2xl font-bold text-emerald-700 dark:text-emerald-300 block font-mono mt-0.5">₹8,220</span>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">Approved statutory wage</span>
        </button>
        <button type="button" onClick={() => toggle('pending')} className={`cc-card-hover bg-white dark:bg-slate-900 p-4 rounded-xl border border-amber-200 dark:border-amber-900/60 shadow-2xs cc-card-link cursor-pointer text-left ${isActive('pending') ? 'cc-card-selected' : ''}`}>
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 block">Pending Supervisor Sign-Off</span>
          <span className="text-2xl font-bold text-amber-700 dark:text-amber-300 block font-mono mt-0.5">1 Claim</span>
          <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">Requires supervisor action</span>
        </button>
        <button type="button" onClick={() => toggle('compoff')} className={`cc-card-hover bg-white dark:bg-slate-900 p-4 rounded-xl border border-indigo-200 dark:border-indigo-900/60 shadow-2xs cc-card-link cursor-pointer text-left ${isActive('compoff') ? 'cc-card-selected' : ''}`}>
          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400 block">Comp-Off Converted</span>
          <span className="text-2xl font-bold text-indigo-700 dark:text-indigo-300 block font-mono mt-0.5">1 Day</span>
          <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">Credited to leave ledger</span>
        </button>
      </div>
      <KpiDetailPanel detail={kpiDetail} onClose={close} />

      {/* VIEW 1: OT LOGS & APPROVALS DESK */}
      {activeTab === 'records' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
          {/* Filters Bar */}
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-800/60">
            <div className="flex flex-wrap items-center gap-3">
              <div>
                <SelectMenu
                  value={filterDept}
                  onChange={(e) => setFilterDept(e.target.value)}
                  className="border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-sky-500 font-medium"
                >
                  <option value="All Departments">All Departments</option>
                  <option value="Engineering">Engineering</option>
                  <option value="Operations">Operations</option>
                </SelectMenu>
              </div>

              <div>
                <SelectMenu
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-sky-500 font-medium"
                >
                  <option value="All Statuses">All Statuses</option>
                  <option value="Approved">Approved</option>
                  <option value="Pending Supervisor Approval">Pending Approval</option>
                  <option value="Converted to Comp-Off">Converted to Comp-Off</option>
                </SelectMenu>
              </div>
            </div>

            <div className="relative w-64">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search employee..."
                className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-lg text-xs"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 absolute left-2.5 top-2.5" />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="cc-table-stack w-full text-left text-xs text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800 text-[11px] uppercase tracking-wider font-semibold text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-4 py-3">Emp Code</th>
                  <th className="px-4 py-3">Employee Name</th>
                  <th className="px-3 py-3">Department</th>
                  <th className="px-3 py-3">Date</th>
                  <th className="px-4 py-3">Shift Timing</th>
                  <th className="px-3 py-3">Actual Punch</th>
                  <th className="px-3 py-3">OT Duration</th>
                  <th className="px-3 py-3">Rate</th>
                  <th className="px-3 py-3">Calculated Payout</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredRecords.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/70 transition-colors">
                    <td className="px-4 py-3.5 font-mono font-bold text-slate-800 dark:text-slate-200">{r.empCode}</td>
                    <td className="px-4 py-3.5 font-bold text-slate-900 dark:text-white">{r.name}</td>
                    <td className="px-3 py-3.5 text-slate-600 dark:text-slate-400">{r.department}</td>
                    <td className="px-3 py-3.5 font-mono text-slate-700 dark:text-slate-300">{r.date}</td>
                    <td className="px-4 py-3.5 text-slate-600 dark:text-slate-400 text-[11px]">{r.shiftTiming}</td>
                    <td className="px-3 py-3.5 font-mono text-slate-800 dark:text-slate-200">{r.actualPunchHours}</td>
                    <td className="px-3 py-3.5 font-mono font-bold text-sky-700 dark:text-sky-300 bg-sky-50/50 dark:bg-sky-950/40">+{r.otDuration}</td>
                    <td className="px-3 py-3.5">
                      <span className="font-mono text-[11px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {r.rateType}
                      </span>
                    </td>
                    <td className="px-3 py-3.5 font-mono font-bold text-emerald-700 dark:text-emerald-400">
                      ₹{r.calculatedPayout.toLocaleString('en-IN')}
                    </td>
                    <td className="px-3 py-3.5">
                      {r.status === 'Approved' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400" />
                          Approved
                        </span>
                      )}
                      {r.status === 'Pending Supervisor Approval' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                          Pending Approval
                        </span>
                      )}
                      {r.status === 'Converted to Comp-Off' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                          Comp-Off Credit
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      {r.status === 'Pending Supervisor Approval' ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleApprove(r.id, r.name)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold shadow-2xs transition-colors"
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => handleConvertToCompOff(r.id, r.name)}
                            className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded text-[11px] font-bold transition-colors"
                          >
                            Comp-Off
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">By {r.approver}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 2: OT CALCULATION RULES & SETTINGS FORM */}
      {activeTab === 'rules' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs p-6 space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Overtime Calculation Parameters & Caps</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Define qualifying thresholds beyond shift end, statutory wage multipliers, and daily/monthly safety caps.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-semibold text-slate-900 dark:text-slate-200 mb-1.5">
                Minimum Qualifying OT (Minutes)
              </label>
              <input
                type="number"
                value={config.minQualifyingMinutes}
                onChange={(e) => setConfig({ ...config, minQualifyingMinutes: Number(e.target.value) })}
                className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg px-3 py-2 text-xs font-mono"
              />
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Work beyond shift end before OT calculation begins (e.g. 60 mins).</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-900 dark:text-slate-200 mb-1.5">
                Weekday Hourly Multiplier
              </label>
              <input
                type="number"
                step="0.1"
                value={config.rateMultiplierWeekday}
                onChange={(e) => setConfig({ ...config, rateMultiplierWeekday: Number(e.target.value) })}
                className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg px-3 py-2 text-xs font-mono"
              />
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Multiplier over standard base hourly wage (e.g. 1.5x).</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-900 dark:text-slate-200 mb-1.5">
                Weekend / Holiday Multiplier
              </label>
              <input
                type="number"
                step="0.1"
                value={config.rateMultiplierWeekend}
                onChange={(e) => setConfig({ ...config, rateMultiplierWeekend: Number(e.target.value) })}
                className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg px-3 py-2 text-xs font-mono"
              />
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Double-time multiplier for rest days and statutory holidays (2.0x).</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <div>
              <label className="block text-xs font-semibold text-slate-900 dark:text-slate-200 mb-1.5">
                Daily Max OT Cap (Hours)
              </label>
              <input
                type="number"
                value={config.dailyMaxOtHours}
                onChange={(e) => setConfig({ ...config, dailyMaxOtHours: Number(e.target.value) })}
                className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg px-3 py-2 text-xs font-mono"
              />
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Maximum billable overtime per employee per single day.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-900 dark:text-slate-200 mb-1.5">
                Monthly Max OT Cap (Hours)
              </label>
              <input
                type="number"
                value={config.monthlyMaxOtHours}
                onChange={(e) => setConfig({ ...config, monthlyMaxOtHours: Number(e.target.value) })}
                className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg px-3 py-2 text-xs font-mono"
              />
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Statutory monthly cap under Factories Act / Shops & Est.</p>
            </div>
          </div>

          <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <label className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer">
              <input
                type="checkbox"
                checked={config.requirePreApproval}
                onChange={(e) => setConfig({ ...config, requirePreApproval: e.target.checked })}
                className="rounded border-slate-300 dark:border-slate-600 text-sky-600 focus:ring-sky-500 w-4 h-4 bg-white dark:bg-slate-700"
              />
              <div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-100 block">Require Supervisor Pre-Approval</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">Unapproved overtime hours are withheld until supervisor verification.</span>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg cursor-pointer">
              <input
                type="checkbox"
                checked={config.allowCompOffConversion}
                onChange={(e) => setConfig({ ...config, allowCompOffConversion: e.target.checked })}
                className="rounded border-slate-300 dark:border-slate-600 text-sky-600 focus:ring-sky-500 w-4 h-4 bg-white dark:bg-slate-700"
              />
              <div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-100 block">Allow Compensatory Off (Comp-Off) Conversion</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">Enable employees or supervisors to exchange OT hours for paid time-off days instead of cash payout.</span>
              </div>
            </label>
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
            <button
              type="button"
              onClick={handleSaveConfig}
              className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save OT Rules</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
