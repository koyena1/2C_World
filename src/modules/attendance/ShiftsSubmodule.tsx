import React, { useState, useMemo } from 'react';
import { 
  Clock, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Users, 
  CheckCircle2, 
  X, 
  Calendar, 
  Layers,
  ArrowRight,
  Sliders
} from 'lucide-react';
import { ShiftDefinition, INITIAL_SHIFTS } from '../../data/mockAttendanceData';

import { SelectMenu } from '../../components/ui/SelectMenu';
interface ShiftsSubmoduleProps {
  onShowToast: (msg: string) => void;
}

export const ShiftsSubmodule: React.FC<ShiftsSubmoduleProps> = ({ onShowToast }) => {
  const [subTab, setSubTab] = useState<'shifts' | 'muster'>('shifts');
  const [shifts, setShifts] = useState<ShiftDefinition[]>(INITIAL_SHIFTS);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal state for Add/Edit shift
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingShift, setEditingShift] = useState<ShiftDefinition | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    startTime: '09:00 AM',
    endTime: '06:00 PM',
    breakDuration: '01h 00m',
    graceTimeMins: 15,
    halfDayThreshold: '04h 30m',
    status: 'Active' as 'Active' | 'Inactive',
  });

  // Shift Muster mock employees
  const [musterDept, setMusterDept] = useState('All Departments');
  const [musterSearch, setMusterSearch] = useState('');

  const filteredShifts = useMemo(() => {
    return shifts.filter(s => 
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      s.code.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [shifts, searchQuery]);

  const handleOpenAdd = () => {
    setEditingShift(null);
    setFormData({
      code: '',
      name: '',
      startTime: '09:00 AM',
      endTime: '06:00 PM',
      breakDuration: '01h 00m',
      graceTimeMins: 15,
      halfDayThreshold: '04h 30m',
      status: 'Active',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (shift: ShiftDefinition) => {
    setEditingShift(shift);
    setFormData({
      code: shift.code,
      name: shift.name,
      startTime: shift.startTime,
      endTime: shift.endTime,
      breakDuration: shift.breakDuration,
      graceTimeMins: shift.graceTimeMins,
      halfDayThreshold: shift.halfDayThreshold,
      status: shift.status,
    });
    setIsModalOpen(true);
  };

  const handleSaveShift = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code || !formData.name) {
      alert('Please fill Shift Code and Shift Name.');
      return;
    }

    if (editingShift) {
      setShifts(shifts.map(s => s.id === editingShift.id ? {
        ...s,
        ...formData,
      } : s));
      onShowToast(`Shift "${formData.name}" updated successfully.`);
    } else {
      const newShift: ShiftDefinition = {
        id: `shift-${Date.now()}`,
        code: formData.code.toUpperCase(),
        name: formData.name,
        startTime: formData.startTime,
        endTime: formData.endTime,
        breakDuration: formData.breakDuration,
        effectiveWorkHours: '08h 00m',
        graceTimeMins: Number(formData.graceTimeMins),
        halfDayThreshold: formData.halfDayThreshold,
        status: formData.status,
        assignedEmployees: 0,
      };
      setShifts([...shifts, newShift]);
      onShowToast(`New shift "${formData.name}" created.`);
    }
    setIsModalOpen(false);
  };

  const handleDeleteShift = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete shift "${name}"?`)) {
      setShifts(shifts.filter(s => s.id !== id));
      onShowToast(`Shift "${name}" removed.`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Sub-tab Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Shifts & Shift Muster</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Configure shift timings, grace windows, statutory half-day cutoffs, and view employee shift muster schedule.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-lg flex items-center gap-1 text-xs border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setSubTab('shifts')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
                subTab === 'shifts' 
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Shift Configurations ({shifts.length})
            </button>
            <button
              onClick={() => setSubTab('muster')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
                subTab === 'muster' 
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Shift Muster Schedule
            </button>
          </div>

          {subTab === 'shifts' && (
            <button
              type="button"
              onClick={handleOpenAdd}
              className="px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add New Shift</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="cc-card-hover bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">Total Defined Shifts</span>
          <span className="text-2xl font-bold text-slate-900 dark:text-white block font-mono mt-0.5">{shifts.length}</span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">Active rotational patterns</span>
        </div>
        <div className="cc-card-hover bg-white dark:bg-slate-900 p-4 rounded-xl border border-sky-200 dark:border-sky-900/60 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-sky-700 dark:text-sky-400 block">Primary General Shift</span>
          <span className="text-2xl font-bold text-sky-700 dark:text-sky-300 block font-mono mt-0.5">86 Staff</span>
          <span className="text-[11px] text-sky-600 dark:text-sky-400 font-medium">09:00 AM — 06:00 PM</span>
        </div>
        <div className="cc-card-hover bg-white dark:bg-slate-900 p-4 rounded-xl border border-indigo-200 dark:border-indigo-900/60 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400 block">Rotational Night Shift</span>
          <span className="text-2xl font-bold text-indigo-700 dark:text-indigo-300 block font-mono mt-0.5">6 Staff</span>
          <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">11:00 PM — 07:30 AM</span>
        </div>
        <div className="cc-card-hover bg-white dark:bg-slate-900 p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/60 shadow-2xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block">Default Grace Time</span>
          <span className="text-2xl font-bold text-emerald-700 dark:text-emerald-300 block font-mono mt-0.5">15 Mins</span>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">Client statutory standard</span>
        </div>
      </div>

      {/* VIEW 1: SHIFT CONFIGURATIONS */}
      {subTab === 'shifts' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-800/60">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Configured Shifts for Client: 2COMS Services</h2>
            </div>
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search shifts..."
                className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-lg text-xs focus:ring-2 focus:ring-sky-500"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 absolute left-2.5 top-2.5" />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800 text-[11px] uppercase tracking-wider font-semibold text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-4 py-3">Shift Code</th>
                  <th className="px-4 py-3">Shift Name</th>
                  <th className="px-4 py-3">Timings</th>
                  <th className="px-3 py-3">Break Duration</th>
                  <th className="px-3 py-3">Effective Work Hours</th>
                  <th className="px-3 py-3">Grace Time</th>
                  <th className="px-3 py-3">Half Day Mark</th>
                  <th className="px-3 py-3 text-center">Assigned Staff</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredShifts.map((shift) => (
                  <tr key={shift.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/70 transition-colors">
                    <td className="px-4 py-3.5 font-bold font-mono">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-sky-100 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                        {shift.code}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 font-bold text-slate-900 dark:text-white">
                      <div className="flex items-center gap-1.5">
                        <span>{shift.name}</span>
                        {shift.isDefault && (
                          <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-semibold px-1.5 py-0.2 rounded">
                            Default
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-slate-800 dark:text-slate-200 font-medium">
                      {shift.startTime} — {shift.endTime}
                    </td>
                    <td className="px-3 py-3.5 text-slate-600 dark:text-slate-400 font-mono">{shift.breakDuration}</td>
                    <td className="px-3 py-3.5 font-mono font-semibold text-emerald-700 dark:text-emerald-400">{shift.effectiveWorkHours}</td>
                    <td className="px-3 py-3.5 font-mono text-amber-700 dark:text-amber-400">{shift.graceTimeMins} mins</td>
                    <td className="px-3 py-3.5 font-mono text-slate-600 dark:text-slate-400">{shift.halfDayThreshold}</td>
                    <td className="px-3 py-3.5 text-center font-mono font-bold text-slate-900 dark:text-white">
                      {shift.assignedEmployees}
                    </td>
                    <td className="px-3 py-3.5">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        shift.status === 'Active' 
                          ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' 
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${shift.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                        {shift.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(shift)}
                          className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 rounded transition-colors"
                          title="Edit Shift"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={shift.isDefault}
                          onClick={() => handleDeleteShift(shift.id, shift.name)}
                          className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-600 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          title={shift.isDefault ? 'Cannot delete default shift' : 'Delete Shift'}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 2: SHIFT MUSTER SCHEDULE */}
      {subTab === 'muster' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">Employee Shift Allocation Muster</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Current active shift mapping for all rostered personnel at Hyderabad Home Branch.</p>
            </div>

            <div className="flex items-center gap-3">
              <SelectMenu
                value={musterDept}
                onChange={(e) => setMusterDept(e.target.value)}
                className="border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-sky-500 font-medium"
              >
                <option value="All Departments">All Departments</option>
                <option value="Engineering">Engineering</option>
                <option value="Operations">Operations</option>
                <option value="HR Services">HR Services</option>
                <option value="Finance">Finance</option>
              </SelectMenu>

              <div className="relative w-56">
                <input
                  type="text"
                  value={musterSearch}
                  onChange={(e) => setMusterSearch(e.target.value)}
                  placeholder="Search staff..."
                  className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-lg text-xs"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 absolute left-2.5 top-2.5" />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
              <thead className="bg-slate-50 dark:bg-slate-800 text-[11px] uppercase tracking-wider font-semibold text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-4 py-3">Emp Code</th>
                  <th className="px-4 py-3">Employee Name</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">Assigned Shift</th>
                  <th className="px-4 py-3">Shift Timing</th>
                  <th className="px-4 py-3">Weekly Off Pattern</th>
                  <th className="px-4 py-3 text-right">Quick Reassign</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {[
                  { code: '2C-8941', name: 'Priya Sharma', dept: 'Engineering', shift: 'GS', time: '09:00 AM - 06:00 PM', wo: '5-Day Standard (Sat/Sun Off)' },
                  { code: '2C-8942', name: 'Rahul Verma', dept: 'Operations', shift: 'MS', time: '07:00 AM - 03:30 PM', wo: 'Alternate Sat Off (2nd & 4th)' },
                  { code: '2C-8943', name: 'Ananya Sengupta', dept: 'HR Services', shift: 'GS', time: '09:00 AM - 06:00 PM', wo: '5-Day Standard (Sat/Sun Off)' },
                  { code: '2C-8944', name: 'Vikram Malhotra', dept: 'Engineering', shift: 'ES', time: '03:00 PM - 11:30 PM', wo: '5-Day Standard (Sat/Sun Off)' },
                  { code: '2C-8945', name: 'Kavita Nair', dept: 'Finance', shift: 'GS', time: '09:00 AM - 06:00 PM', wo: '5-Day Standard (Sat/Sun Off)' },
                  { code: '2C-8946', name: 'Arjun Dasgupta', dept: 'Operations', shift: 'GS', time: '09:00 AM - 06:00 PM', wo: '6-Day Production (Sunday Off)' },
                ].filter(r => (musterDept === 'All Departments' || r.dept === musterDept) && (r.name.toLowerCase().includes(musterSearch.toLowerCase()) || r.code.includes(musterSearch)))
                .map((row) => (
                  <tr key={row.code} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/70 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-slate-800 dark:text-slate-200">{row.code}</td>
                    <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">{row.name}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{row.dept}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded font-mono font-bold text-xs bg-sky-100 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                        {row.shift}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-700 dark:text-slate-300">{row.time}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{row.wo}</td>
                    <td className="px-4 py-3 text-right">
                      <SelectMenu 
                        defaultValue={row.shift}
                        onChange={(e) => onShowToast(`Shift for ${row.name} changed to ${e.target.value}.`)}
                        className="border border-slate-300 dark:border-slate-700 rounded px-2 py-1 text-xs bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-medium"
                      >
                        <option value="GS">GS (General)</option>
                        <option value="MS">MS (Morning)</option>
                        <option value="ES">ES (Evening)</option>
                        <option value="NS">NS (Night)</option>
                      </SelectMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT SHIFT */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {editingShift ? 'Edit Shift Configuration' : 'Add New Shift'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveShift} className="p-5 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-900 dark:text-slate-200 mb-1">
                    Shift Code <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="e.g. MS"
                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg px-3 py-2 uppercase font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-900 dark:text-slate-200 mb-1">
                    Shift Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Morning Shift"
                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg px-3 py-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-900 dark:text-slate-200 mb-1">
                    Start Time <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    placeholder="09:00 AM"
                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg px-3 py-2 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-900 dark:text-slate-200 mb-1">
                    End Time <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    placeholder="06:00 PM"
                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg px-3 py-2 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-900 dark:text-slate-200 mb-1">Break Duration</label>
                  <input
                    type="text"
                    value={formData.breakDuration}
                    onChange={(e) => setFormData({ ...formData, breakDuration: e.target.value })}
                    placeholder="01h 00m"
                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg px-3 py-2 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-900 dark:text-slate-200 mb-1">Grace Mins</label>
                  <input
                    type="number"
                    value={formData.graceTimeMins}
                    onChange={(e) => setFormData({ ...formData, graceTimeMins: Number(e.target.value) })}
                    placeholder="15"
                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg px-3 py-2 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-900 dark:text-slate-200 mb-1">Half Day Mark</label>
                  <input
                    type="text"
                    value={formData.halfDayThreshold}
                    onChange={(e) => setFormData({ ...formData, halfDayThreshold: e.target.value })}
                    placeholder="04h 30m"
                    className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg px-3 py-2 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-900 dark:text-slate-200 mb-1">Status</label>
                <SelectMenu
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg px-3 py-2"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </SelectMenu>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-lg shadow-xs"
                >
                  {editingShift ? 'Save Changes' : 'Create Shift'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
