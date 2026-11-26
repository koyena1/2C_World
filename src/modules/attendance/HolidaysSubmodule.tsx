import React, { useState } from 'react';
import { 
  Calendar, 
  Plus, 
  Search, 
  Download, 
  Upload, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  Star, 
  X, 
  Filter,
  Sparkles
} from 'lucide-react';
import { HolidayItem, INITIAL_HOLIDAYS_2026 } from '../../data/mockAttendanceData';

import { SelectMenu } from '../../components/ui/SelectMenu';
import { useKpiDetail } from '../../hooks/useKpiDetail';
import { KpiDetailPanel, type KpiDetailData } from '../../components/page/KpiDetailPanel';
interface HolidaysSubmoduleProps {
  onShowToast: (msg: string) => void;
}

export const HolidaysSubmodule: React.FC<HolidaysSubmoduleProps> = ({ onShowToast }) => {
  const [holidays, setHolidays] = useState<HolidayItem[]>(INITIAL_HOLIDAYS_2026);
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedLocation, setSelectedLocation] = useState<string>('All Locations');
  const [selectedType, setSelectedType] = useState<string>('All Types');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const { activeId, toggle, close, isActive } = useKpiDetail<'total' | 'national' | 'state' | 'optional'>();

  // Add / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<HolidayItem | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    date: '2026-08-15',
    dayOfWeek: 'Saturday',
    type: 'Mandatory National' as HolidayItem['type'],
    applicableBranch: 'All Locations',
    isPaid: true,
  });

  const filteredHolidays = holidays.filter(h => {
    const matchYear = h.year === selectedYear;
    const matchLoc = selectedLocation === 'All Locations' || h.applicableBranch.includes(selectedLocation) || h.applicableBranch === 'All Locations';
    const matchType = selectedType === 'All Types' || h.type === selectedType;
    const matchSearch = h.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchYear && matchLoc && matchType && matchSearch;
  });

  const handleOpenAdd = () => {
    setEditingHoliday(null);
    setFormData({
      name: '',
      date: '2026-08-15',
      dayOfWeek: 'Saturday',
      type: 'Mandatory National',
      applicableBranch: 'All Locations',
      isPaid: true,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (hol: HolidayItem) => {
    setEditingHoliday(hol);
    setFormData({
      name: hol.name,
      date: hol.date,
      dayOfWeek: hol.dayOfWeek,
      type: hol.type,
      applicableBranch: hol.applicableBranch,
      isPaid: hol.isPaid,
    });
    setIsModalOpen(true);
  };

  const handleDateChange = (newDate: string) => {
    const d = new Date(newDate);
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = !isNaN(d.getTime()) ? dayNames[d.getDay()] : 'Unknown';
    setFormData({
      ...formData,
      date: newDate,
      dayOfWeek: dayName,
    });
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.date) {
      alert('Holiday name and date are required.');
      return;
    }

    if (editingHoliday) {
      setHolidays(holidays.map(h => h.id === editingHoliday.id ? {
        ...h,
        ...formData,
      } : h));
      onShowToast(`Holiday "${formData.name}" updated.`);
    } else {
      const newHol: HolidayItem = {
        id: `hol-${Date.now()}`,
        name: formData.name,
        date: formData.date,
        dayOfWeek: formData.dayOfWeek,
        type: formData.type,
        applicableBranch: formData.applicableBranch,
        isPaid: formData.isPaid,
        year: selectedYear,
      };
      setHolidays([...holidays, newHol]);
      onShowToast(`New statutory holiday "${formData.name}" added to ${selectedYear} calendar.`);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Remove holiday "${name}" from ${selectedYear} calendar?`)) {
      setHolidays(holidays.filter(h => h.id !== id));
      onShowToast(`Holiday "${name}" removed.`);
    }
  };

  const kpiDetail: KpiDetailData | null = (() => {
    if (!activeId) return null;
    const map = { total: null, national: 'Mandatory National', state: 'State Specific', optional: 'Restricted / Optional (RH)' } as const;
    const titles = { total: `Total Holidays in ${selectedYear}`, national: 'Mandatory National', state: 'State Specific', optional: 'Restricted / Optional' } as const;
    const t = map[activeId];
    const list = holidays.filter(h => t === null || h.type === t);
    return {
      title: titles[activeId],
      columns: [
        { key: 'date', label: 'Date', className: 'whitespace-nowrap' },
        { key: 'day', label: 'Day' },
        { key: 'name', label: 'Holiday' },
        { key: 'type', label: 'Type' },
        { key: 'branch', label: 'Applicable to' },
        { key: 'paid', label: 'Paid' },
      ],
      rows: list.map(h => ({ date: h.date, day: h.dayOfWeek, name: h.name, type: h.type, branch: h.applicableBranch, paid: h.isPaid ? 'Paid' : 'Unpaid' })),
    };
  })();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Statutory Holiday Calendar</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Client and location-based gazetted statutory holidays, state festival observances, and optional restricted holidays for 2COMS Services.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onShowToast('Exported statutory holiday calendar (.xlsx).')}
            className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg shadow-2xs flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Calendar</span>
          </button>
          <button
            type="button"
            onClick={() => onShowToast('Select CSV file to import client holiday list.')}
            className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg shadow-2xs flex items-center gap-1.5 transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import Holidays</span>
          </button>
          <button
            type="button"
            onClick={handleOpenAdd}
            className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Holiday</span>
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <button type="button" onClick={() => toggle('total')} className={`cc-card-hover bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs cc-card-link cursor-pointer text-left ${isActive('total') ? 'cc-card-selected' : ''}`}>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">Total Holidays in {selectedYear}</span>
          <span className="text-2xl font-bold text-slate-900 dark:text-white block font-mono mt-0.5">{holidays.length} Days</span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">Statutory gazetted calendar</span>
        </button>
        <button type="button" onClick={() => toggle('national')} className={`cc-card-hover bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs cc-card-link cursor-pointer text-left ${isActive('national') ? 'cc-card-selected' : ''}`}>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">Mandatory National</span>
          <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 block font-mono mt-0.5">7 Days</span>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">100% Paid Statutory Rest</span>
        </button>
        <button type="button" onClick={() => toggle('state')} className={`cc-card-hover bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs cc-card-link cursor-pointer text-left ${isActive('state') ? 'cc-card-selected' : ''}`}>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">State Specific</span>
          <span className="text-2xl font-bold text-sky-600 dark:text-sky-400 block font-mono mt-0.5">1 Day</span>
          <span className="text-[11px] text-sky-600 dark:text-sky-400 font-medium">Telangana Formation Day</span>
        </button>
        <button type="button" onClick={() => toggle('optional')} className={`cc-card-hover bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs cc-card-link cursor-pointer text-left ${isActive('optional') ? 'cc-card-selected' : ''}`}>
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">Restricted / Optional</span>
          <span className="text-2xl font-bold text-amber-600 dark:text-amber-400 block font-mono mt-0.5">1 Day</span>
          <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">Optional festival entitlement</span>
        </button>
      </div>
      <KpiDetailPanel detail={kpiDetail} onClose={close} />

      {/* Holiday Filters Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
              Calendar Year
            </label>
            <SelectMenu
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 font-bold"
            >
              <option value={2026}>2026</option>
              <option value={2025}>2025</option>
            </SelectMenu>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
              Applicable Location
            </label>
            <SelectMenu
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 font-medium"
            >
              <option value="All Locations">All Locations</option>
              <option value="Hyderabad">Hyderabad (Home Branch)</option>
              <option value="Bangalore">Bangalore SEZ</option>
            </SelectMenu>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1">
              Holiday Type
            </label>
            <SelectMenu
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-1.5 text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 font-medium"
            >
              <option value="All Types">All Types</option>
              <option value="Mandatory National">Mandatory National</option>
              <option value="State Specific">State Specific</option>
              <option value="Restricted / Optional (RH)">Restricted / Optional (RH)</option>
            </SelectMenu>
          </div>
        </div>

        <div className="relative w-64">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search holiday name..."
            className="w-full pl-8 pr-3 py-1.5 border border-slate-300 dark:border-slate-700 rounded-lg text-xs bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-sky-500"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 absolute left-2.5 top-2.5" />
        </div>
      </div>

      {/* Holidays Data Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="cc-table-stack w-full text-left text-xs text-slate-700 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/80 text-[11px] uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3">Holiday Name</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Day of Week</th>
                <th className="px-4 py-3">Holiday Classification</th>
                <th className="px-4 py-3">Applicable Location / Branch</th>
                <th className="px-3 py-3">Statutory Pay Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredHolidays.map((hol) => (
                <tr key={hol.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-4 py-3.5 font-bold text-slate-900 dark:text-white">
                    <div className="flex items-center gap-2">
                      <Star className={`w-3.5 h-3.5 ${hol.type === 'Mandatory National' ? 'text-amber-500 fill-amber-500' : 'text-slate-300 dark:text-slate-600'}`} />
                      <span>{hol.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 font-mono font-semibold text-slate-800 dark:text-slate-200">
                    {hol.date}
                  </td>
                  <td className="px-4 py-3.5 font-medium text-slate-600 dark:text-slate-400">
                    {hol.dayOfWeek}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold border ${
                      hol.type === 'Mandatory National' 
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/60' 
                        : hol.type === 'State Specific' 
                          ? 'bg-sky-50 dark:bg-sky-950/40 text-sky-800 dark:text-sky-300 border-sky-200 dark:border-sky-900/60' 
                          : 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-900/60'
                    }`}>
                      {hol.type}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-slate-700 dark:text-slate-300">
                    {hol.applicableBranch}
                  </td>
                  <td className="px-3 py-3.5">
                    <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 dark:text-emerald-300 font-bold bg-emerald-100/70 dark:bg-emerald-950/50 px-2 py-0.5 rounded">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                      <span>Paid Holiday (100%)</span>
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(hol)}
                        className="p-1.5 text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                        title="Edit Holiday"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(hol.id, hol.name)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded transition-colors"
                        title="Delete Holiday"
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

      {/* MODAL: ADD / EDIT HOLIDAY */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/60 dark:bg-slate-800/50">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {editingHoliday ? 'Edit Holiday Record' : 'Add Statutory Holiday'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-900 dark:text-slate-200 mb-1">
                  Holiday Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Independence Day"
                  className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-900 dark:text-slate-200 mb-1">
                    Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => handleDateChange(e.target.value)}
                    className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg px-3 py-2 text-xs font-mono focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-900 dark:text-slate-200 mb-1">
                    Day of Week
                  </label>
                  <input
                    type="text"
                    disabled
                    value={formData.dayOfWeek}
                    className="w-full border border-slate-200 dark:border-slate-750 bg-slate-100 dark:bg-slate-800 rounded-lg px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-900 dark:text-slate-200 mb-1">Classification Type</label>
                <SelectMenu
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                  className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-sky-500"
                >
                  <option value="Mandatory National">Mandatory National (Statutory Gazetted)</option>
                  <option value="State Specific">State Specific</option>
                  <option value="Restricted / Optional (RH)">Restricted / Optional (RH)</option>
                </SelectMenu>
              </div>

              <div>
                <label className="block font-semibold text-slate-900 dark:text-slate-200 mb-1">Applicable Branch</label>
                <SelectMenu
                  value={formData.applicableBranch}
                  onChange={(e) => setFormData({ ...formData, applicableBranch: e.target.value })}
                  className="w-full border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-sky-500"
                >
                  <option value="All Locations">All Locations (National Standard)</option>
                  <option value="Hyderabad (Home Branch) Only">Hyderabad (Home Branch) Only</option>
                  <option value="Bangalore SEZ Only">Bangalore SEZ Only</option>
                  <option value="Kolkata Regional Only">Kolkata Regional Only</option>
                </SelectMenu>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isPaid}
                    onChange={(e) => setFormData({ ...formData, isPaid: e.target.checked })}
                    className="rounded text-sky-600 focus:ring-sky-500 w-4 h-4 bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700"
                  />
                  <span className="font-semibold text-slate-800 dark:text-slate-200">100% Paid Statutory Holiday</span>
                </label>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-lg shadow-xs transition-colors"
                >
                  {editingHoliday ? 'Save Changes' : 'Add Holiday'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
