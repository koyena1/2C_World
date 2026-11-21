import React, { useState } from 'react';
import { 
  Calendar, 
  Plus, 
  CheckCircle2, 
  Edit3, 
  Trash2, 
  Users, 
  X, 
  Info,
  Layers,
  Sparkles
} from 'lucide-react';
import { WeekoffPattern, INITIAL_WEEKOFF_PATTERNS } from '../../data/mockAttendanceData';

import { SelectMenu } from '../../components/ui/SelectMenu';
interface WeekoffSubmoduleProps {
  onShowToast: (msg: string) => void;
}

export const WeekoffSubmodule: React.FC<WeekoffSubmoduleProps> = ({ onShowToast }) => {
  const [patterns, setPatterns] = useState<WeekoffPattern[]>(INITIAL_WEEKOFF_PATTERNS);
  const [selectedPatternForPreview, setSelectedPatternForPreview] = useState<WeekoffPattern>(INITIAL_WEEKOFF_PATTERNS[0]);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPattern, setEditingPattern] = useState<WeekoffPattern | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    saturdayRule: 'All Saturdays Off' as WeekoffPattern['saturdayRule'],
    sundayRule: 'All Sundays Off' as WeekoffPattern['sundayRule'],
    isDefault: false,
    status: 'Active' as 'Active' | 'Inactive',
  });

  const handleOpenAdd = () => {
    setEditingPattern(null);
    setFormData({
      name: '',
      description: '',
      saturdayRule: 'All Saturdays Off',
      sundayRule: 'All Sundays Off',
      isDefault: false,
      status: 'Active',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (pat: WeekoffPattern) => {
    setEditingPattern(pat);
    setFormData({
      name: pat.name,
      description: pat.description,
      saturdayRule: pat.saturdayRule,
      sundayRule: pat.sundayRule,
      isDefault: pat.isDefault,
      status: pat.status,
    });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Pattern name is required');
      return;
    }

    if (editingPattern) {
      setPatterns(patterns.map(p => p.id === editingPattern.id ? {
        ...p,
        ...formData,
      } : p));
      onShowToast(`Weekoff pattern "${formData.name}" updated.`);
    } else {
      const newPattern: WeekoffPattern = {
        id: `wo-${Date.now()}`,
        name: formData.name,
        description: formData.description,
        applicableDays: ['Sunday', ...(formData.saturdayRule !== 'All Saturdays Working' ? ['Saturday'] : [])],
        saturdayRule: formData.saturdayRule,
        sundayRule: formData.sundayRule,
        assignedCount: 0,
        isDefault: formData.isDefault,
        status: formData.status,
      };
      setPatterns([...patterns, newPattern]);
      onShowToast(`New weekoff pattern "${formData.name}" created.`);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`Delete weekoff pattern "${name}"?`)) {
      setPatterns(patterns.filter(p => p.id !== id));
      onShowToast(`Pattern "${name}" removed.`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Weekoff Patterns & Rules</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Configure weekly off schedules, rotational weekend patterns, and statutory rest day assignments for 2COMS Services.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Create Weekoff Pattern</span>
        </button>
      </div>

      {/* Grid of Patterns & Interactive Calendar Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Pattern Cards (2 cols on large screen) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Configured Weekly Off Rules ({patterns.length})
            </h2>
            <span className="text-[11px] text-slate-500 dark:text-slate-400">Click a card to inspect calendar monthly preview</span>
          </div>

          <div className="space-y-3">
            {patterns.map((pat) => {
              const isSelected = selectedPatternForPreview.id === pat.id;
              return (
                <div
                  key={pat.id}
                  onClick={() => setSelectedPatternForPreview(pat)}
                  className={`bg-white dark:bg-slate-900 rounded-xl border p-5 cursor-pointer transition-all ${
                    isSelected 
                      ? 'border-sky-500 dark:border-sky-400 ring-2 ring-sky-100 dark:ring-sky-950/60 shadow-sm' 
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900 dark:text-white">{pat.name}</span>
                        {pat.isDefault && (
                          <span className="text-[10px] font-bold bg-sky-100 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 px-2 py-0.5 rounded-full border border-sky-200 dark:border-sky-800">
                            Default Standard
                          </span>
                        )}
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          pat.status === 'Active' 
                            ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800' 
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-750'
                        }`}>
                          {pat.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{pat.description}</p>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEdit(pat);
                        }}
                        className="p-1.5 text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"
                        title="Edit Pattern"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={pat.isDefault}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(pat.id, pat.name);
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded disabled:opacity-20"
                        title="Delete Pattern"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Rule details badge grid */}
                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-slate-500 dark:text-slate-400 font-medium">Saturday Rule:</span>
                      <strong className="text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded font-mono text-[11px] border border-slate-200 dark:border-slate-700">
                        {pat.saturdayRule}
                      </strong>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-slate-500 dark:text-slate-400 font-medium">Sunday Rule:</span>
                      <strong className="text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded font-mono text-[11px] border border-slate-200 dark:border-slate-700">
                        {pat.sundayRule}
                      </strong>
                    </div>

                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                      <Users className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                      <span><strong className="text-slate-800 dark:text-slate-200">{pat.assignedCount}</strong> Staff Assigned</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Interactive Month Preview */}
        <div className="space-y-4">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              August 2026 Calendar Simulation
            </h2>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs space-y-4">
            <div className="p-3 bg-sky-50 dark:bg-slate-800/80 rounded-lg border border-sky-100 dark:border-slate-700">
              <span className="text-[10px] uppercase font-bold text-sky-800 dark:text-sky-400 block">Active Simulation Pattern</span>
              <span className="text-xs font-bold text-slate-900 dark:text-white block mt-0.5">{selectedPatternForPreview.name}</span>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-1">
                Saturdays: <strong className="text-slate-800 dark:text-white">{selectedPatternForPreview.saturdayRule}</strong> · Sundays: <strong className="text-slate-800 dark:text-white">{selectedPatternForPreview.sundayRule}</strong>
              </p>
            </div>

            {/* Calendar Mini Grid (August 2026: 01 Aug is Saturday) */}
            <div className="space-y-2">
              <div className="grid grid-cols-7 gap-1 text-center font-bold text-[10px] text-slate-400 dark:text-slate-500 uppercase">
                <span>Mo</span>
                <span>Tu</span>
                <span>We</span>
                <span>Th</span>
                <span>Fr</span>
                <span className="text-sky-700 dark:text-sky-400">Sa</span>
                <span className="text-rose-600 dark:text-rose-400">Su</span>
              </div>

              {/* 31 days representation */}
              <div className="grid grid-cols-7 gap-1 text-center text-xs font-mono">
                {/* 01 Aug is Saturday, so 5 empty cells (Mon-Fri) before day 1 */}
                <div className="p-1.5 text-slate-300 dark:text-slate-700">27</div>
                <div className="p-1.5 text-slate-300 dark:text-slate-700">28</div>
                <div className="p-1.5 text-slate-300 dark:text-slate-700">29</div>
                <div className="p-1.5 text-slate-300 dark:text-slate-700">30</div>
                <div className="p-1.5 text-slate-300 dark:text-slate-700">31</div>
                
                {/* Days 1 to 31 */}
                {Array.from({ length: 31 }, (_, i) => {
                  const dayNum = i + 1;
                  const isSun = [2, 9, 16, 23, 30].includes(dayNum);
                  const is1stSat = dayNum === 1;
                  const is2ndSat = dayNum === 8;
                  const is3rdSat = dayNum === 15;
                  const is4thSat = dayNum === 22;
                  const is5thSat = dayNum === 29;

                  let isOff = false;
                  if (isSun && selectedPatternForPreview.sundayRule === 'All Sundays Off') isOff = true;
                  if (selectedPatternForPreview.saturdayRule === 'All Saturdays Off' && (is1stSat || is2ndSat || is3rdSat || is4thSat || is5thSat)) isOff = true;
                  if (selectedPatternForPreview.saturdayRule === '2nd & 4th Saturday Off' && (is2ndSat || is4thSat)) isOff = true;
                  if (selectedPatternForPreview.saturdayRule === '1st & 3rd Saturday Off' && (is1stSat || is3rdSat)) isOff = true;

                  return (
                    <div
                      key={dayNum}
                      className={`p-1.5 rounded text-xs font-bold transition-all ${
                        isOff 
                          ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60 shadow-2xs' 
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      {dayNum}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Legend */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-rose-100 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 inline-block" />
                <span>Statutory Weekly Off</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 inline-block" />
                <span>Standard Working Day</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL: ADD / EDIT WEEKOFF PATTERN */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/60">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {editingPattern ? 'Edit Weekoff Pattern' : 'Create New Weekoff Pattern'}
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

            <form onSubmit={handleSave} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-900 dark:text-slate-200 mb-1">
                  Pattern Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. 5-Day Standard (Sat & Sun Off)"
                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-900 dark:text-slate-200 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="e.g. Corporate team schedule with weekends off"
                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-900 dark:text-slate-200 mb-1">Saturday Rule</label>
                <SelectMenu
                  value={formData.saturdayRule}
                  onChange={(e) => setFormData({ ...formData, saturdayRule: e.target.value as any })}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg px-3 py-2 text-xs"
                >
                  <option value="All Saturdays Off">All Saturdays Off</option>
                  <option value="2nd & 4th Saturday Off">2nd & 4th Saturday Off (Banking Standard)</option>
                  <option value="1st & 3rd Saturday Off">1st & 3rd Saturday Off</option>
                  <option value="All Saturdays Working">All Saturdays Working</option>
                </SelectMenu>
              </div>

              <div>
                <label className="block font-semibold text-slate-900 dark:text-slate-200 mb-1">Sunday Rule</label>
                <SelectMenu
                  value={formData.sundayRule}
                  onChange={(e) => setFormData({ ...formData, sundayRule: e.target.value as any })}
                  className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg px-3 py-2 text-xs"
                >
                  <option value="All Sundays Off">All Sundays Off</option>
                  <option value="Working">Working (Rotational Off on other days)</option>
                </SelectMenu>
              </div>

              <div className="flex items-center gap-4 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isDefault}
                    onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                    className="rounded border-slate-300 dark:border-slate-600 text-sky-600 focus:ring-sky-500 w-4 h-4 bg-white dark:bg-slate-700"
                  />
                  <span className="font-semibold text-slate-800 dark:text-slate-200">Set as Client Default</span>
                </label>
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
                  {editingPattern ? 'Save Changes' : 'Create Pattern'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
