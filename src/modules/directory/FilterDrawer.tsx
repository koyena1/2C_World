import React from 'react';
import { X, RotateCcw, Check, Filter } from 'lucide-react';
import { FilterOptions } from '../../types/onboarding';
import { CLIENT_LIST, LOCATION_LIST } from '../../data/mockOnboardingData';
import { useTheme } from '../../hooks/useTheme';

import { SelectMenu } from '../../components/ui/SelectMenu';
interface FilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterOptions;
  onFilterChange: (filters: FilterOptions) => void;
  onReset: () => void;
  activeFilterCount: number;
}

export const FilterDrawer: React.FC<FilterDrawerProps> = ({
  isOpen,
  onClose,
  filters,
  onFilterChange,
  onReset,
  activeFilterCount,
}) => {
  const { isDark } = useTheme();

  if (!isOpen) return null;

  const handleApplyPreset = (presetName: string) => {
    if (presetName === 'joining_soon') {
      onFilterChange({
        ...filters,
        joiningStatus: 'Yet to Join',
        dateFrom: '2026-09-20',
        dateTo: '2026-10-05',
      });
    } else if (presetName === 'kyc_pending') {
      onFilterChange({
        ...filters,
        kycStatus: 'Pending Manual Review',
      });
    } else if (presetName === 'penny_failed') {
      onFilterChange({
        ...filters,
        pennyTestStatus: 'Failed',
      });
    } else if (presetName === 'offer_dropped') {
      onFilterChange({
        ...filters,
        joiningStatus: 'Offer Dropped',
      });
    }
  };

  const labelClass = `block text-xs font-bold mb-1.5 transition-colors ${
    isDark ? 'text-white' : 'text-slate-900'
  }`;

  const selectClass = `w-full border-2 rounded-lg px-3 py-2 text-xs font-medium transition-all outline-none focus:ring-2 focus:ring-sky-500/40 ${
    isDark 
      ? 'bg-slate-800 border-slate-600 hover:border-slate-500 text-white focus:border-sky-400' 
      : 'bg-white border-slate-300 hover:border-slate-400 text-slate-900 focus:border-sky-500 shadow-2xs'
  }`;

  const inputClass = `w-full border-2 rounded-lg px-3 py-2 text-xs font-medium transition-all outline-none focus:ring-2 focus:ring-sky-500/40 ${
    isDark 
      ? 'bg-slate-800 border-slate-600 hover:border-slate-500 text-white placeholder:text-slate-400 focus:border-sky-400' 
      : 'bg-white border-slate-300 hover:border-slate-400 text-slate-900 placeholder:text-slate-400 focus:border-sky-500 shadow-2xs'
  }`;

  const sectionHeaderClass = `font-bold uppercase text-[11px] tracking-wider px-2 py-1 rounded-md inline-block mb-1 ${
    isDark ? 'text-sky-300 bg-sky-950/80 border border-sky-800/80' : 'text-sky-800 bg-sky-100 border border-sky-200'
  }`;

  const dividerClass = `border-t pt-4 space-y-3.5 ${
    isDark ? 'border-slate-750' : 'border-slate-200'
  }`;

  const optionStyle = {
    backgroundColor: isDark ? '#1e293b' : '#ffffff',
    color: isDark ? '#ffffff' : '#0f172a',
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/75 backdrop-blur-xs flex justify-end">
      <div 
        className={`w-full max-w-lg h-full shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-200 border-l ${
          isDark ? 'bg-slate-900 border-slate-750 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="filter-drawer-title"
      >
        {/* Drawer Header */}
        <div className={`px-5 py-4 border-b flex items-center justify-between ${
          isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-400">
              <Filter className="w-4 h-4 text-sky-500" />
            </div>
            <div>
              <h2 id="filter-drawer-title" className={`text-sm font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Filter Candidate Directory
                {activeFilterCount > 0 && (
                  <span className={`font-mono text-xs font-semibold px-2 py-0.5 rounded-full ${
                    isDark ? 'bg-sky-900 text-sky-200 border border-sky-700' : 'bg-sky-100 text-sky-800 border border-sky-200'
                  }`}>
                    {activeFilterCount} Active
                  </span>
                )}
              </h2>
              <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Apply organizational, milestone, statutory, and date filters
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors ${
              isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
            }`}
            aria-label="Close filters"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Content */}
        <div className={`flex-1 overflow-y-auto p-5 space-y-5 text-xs ${
          isDark ? 'text-slate-200' : 'text-slate-700'
        }`}>
          {/* Saved Presets */}
          <div>
            <label className={`block font-bold text-xs mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Saved Quick Presets
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleApplyPreset('joining_soon')}
                className={`px-3 py-1.5 rounded-lg border-2 text-xs font-semibold transition-all ${
                  isDark ? 'border-slate-600 bg-slate-800 hover:bg-slate-700 text-white' : 'border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-800'
                }`}
              >
                Joining Next 14 Days
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('kyc_pending')}
                className={`px-3 py-1.5 rounded-lg border-2 text-xs font-semibold transition-all ${
                  isDark ? 'border-amber-700 bg-amber-950/70 hover:bg-amber-900/60 text-amber-200' : 'border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900'
                }`}
              >
                Pending Manual KYC
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('penny_failed')}
                className={`px-3 py-1.5 rounded-lg border-2 text-xs font-semibold transition-all ${
                  isDark ? 'border-rose-700 bg-rose-950/70 hover:bg-rose-900/60 text-rose-200' : 'border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-900'
                }`}
              >
                ₹1 Bank Mismatch
              </button>
              <button
                type="button"
                onClick={() => handleApplyPreset('offer_dropped')}
                className={`px-3 py-1.5 rounded-lg border-2 text-xs font-semibold transition-all ${
                  isDark ? 'border-red-600 bg-red-950/80 hover:bg-red-900/60 text-red-200' : 'border-red-300 bg-red-50 hover:bg-red-100 text-red-900'
                }`}
              >
                Offer Dropped & Dropouts
              </button>
            </div>
          </div>

          {/* Section 1: Placement & Organizational Context */}
          <div className={dividerClass}>
            <div>
              <span className={sectionHeaderClass}>
                1. Placement & Organizational Filters
              </span>
            </div>

            {/* Client Filter */}
            <div>
              <label className={labelClass}>Client Name</label>
              <SelectMenu
                value={filters.client}
                onChange={(e) => onFilterChange({ ...filters, client: e.target.value })}
                className={selectClass}
              >
                <option value="" style={optionStyle}>All Clients</option>
                {CLIENT_LIST.map((c) => (
                  <option key={c} value={c} style={optionStyle}>
                    {c}
                  </option>
                ))}
              </SelectMenu>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Location Filter */}
              <div>
                <label className={labelClass}>Work Location</label>
                <SelectMenu
                  value={filters.location}
                  onChange={(e) => onFilterChange({ ...filters, location: e.target.value })}
                  className={selectClass}
                >
                  <option value="" style={optionStyle}>All Locations</option>
                  {LOCATION_LIST.map((loc) => (
                    <option key={loc} value={loc} style={optionStyle}>
                      {loc}
                    </option>
                  ))}
                </SelectMenu>
              </div>

              {/* Designation Filter */}
              <div>
                <label className={labelClass}>Designation / Role</label>
                <input
                  type="text"
                  placeholder="e.g. Senior Java Developer"
                  value={filters.designation || ''}
                  onChange={(e) => onFilterChange({ ...filters, designation: e.target.value })}
                  className={inputClass}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Candidate Status */}
              <div>
                <label className={labelClass}>Candidate Status</label>
                <SelectMenu
                  value={filters.candidateStatus || ''}
                  onChange={(e) => onFilterChange({ ...filters, candidateStatus: e.target.value })}
                  className={selectClass}
                >
                  <option value="" style={optionStyle}>All Candidate Statuses</option>
                  <option value="Active" style={optionStyle}>Active</option>
                  <option value="In Progress" style={optionStyle}>In Progress</option>
                  <option value="Inactive" style={optionStyle}>Inactive</option>
                  <option value="Blocked" style={optionStyle}>Blocked</option>
                </SelectMenu>
              </div>

              {/* Old Employee ID */}
              <div>
                <label className={labelClass}>Old Employee ID</label>
                <input
                  type="text"
                  placeholder="e.g. 2C-EMP-102"
                  value={filters.oldEmployeeId || ''}
                  onChange={(e) => onFilterChange({ ...filters, oldEmployeeId: e.target.value })}
                  className={`${inputClass} font-mono`}
                />
              </div>
            </div>
          </div>

          {/* Section 2: Onboarding & Joining Status */}
          <div className={dividerClass}>
            <div>
              <span className={sectionHeaderClass}>
                2. Onboarding & Verification Milestones
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Joining Status */}
              <div>
                <label className={labelClass}>Joining Status</label>
                <SelectMenu
                  value={filters.joiningStatus}
                  onChange={(e) => onFilterChange({ ...filters, joiningStatus: e.target.value })}
                  className={selectClass}
                >
                  <option value="" style={optionStyle}>All Statuses</option>
                  <option value="Yet to Join" style={optionStyle}>Yet to Join</option>
                  <option value="Joined" style={optionStyle}>Joined</option>
                  <option value="Offer Accepted" style={optionStyle}>Offer Accepted</option>
                  <option value="Verification In Progress" style={optionStyle}>Verification In Progress</option>
                  <option value="Offer Dropped" style={optionStyle}>Offer Dropped</option>
                </SelectMenu>
              </div>

              {/* Overall KYC Status */}
              <div>
                <label className={labelClass}>Overall KYC Status</label>
                <SelectMenu
                  value={filters.kycStatus}
                  onChange={(e) => onFilterChange({ ...filters, kycStatus: e.target.value })}
                  className={selectClass}
                >
                  <option value="" style={optionStyle}>All KYC Statuses</option>
                  <option value="Verified" style={optionStyle}>Verified</option>
                  <option value="Pending Manual Review" style={optionStyle}>Pending Manual Review</option>
                  <option value="API Mismatch" style={optionStyle}>API Mismatch</option>
                  <option value="Rejected" style={optionStyle}>Rejected</option>
                  <option value="Skipped" style={optionStyle}>Skipped</option>
                  <option value="Not Started" style={optionStyle}>Not Started</option>
                </SelectMenu>
              </div>
            </div>

            {/* ₹1 Penny Test & Bank Verification */}
            <div>
              <label className={labelClass}>Bank Verification / ₹1 Testing</label>
              <SelectMenu
                value={filters.pennyTestStatus}
                onChange={(e) => onFilterChange({ ...filters, pennyTestStatus: e.target.value })}
                className={selectClass}
              >
                <option value="" style={optionStyle}>All Bank Verification Statuses</option>
                <option value="Verified" style={optionStyle}>Verified (₹1.00 Matched)</option>
                <option value="Pending" style={optionStyle}>Pending / In Progress</option>
                <option value="Failed" style={optionStyle}>Failed / Inactive Account</option>
                <option value="Not Sent" style={optionStyle}>Not Sent</option>
              </SelectMenu>
            </div>
          </div>

          {/* Section 3: Statutory Document Granular Checks (Aadhaar, PAN, Bank, UAN) */}
          <div className={dividerClass}>
            <div>
              <span className={sectionHeaderClass}>
                3. Statutory KYC Check Filters
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Aadhaar Status */}
              <div>
                <label className={labelClass}>Aadhaar Status</label>
                <SelectMenu
                  value={filters.aadhaarStatus || ''}
                  onChange={(e) => onFilterChange({ ...filters, aadhaarStatus: e.target.value })}
                  className={selectClass}
                >
                  <option value="" style={optionStyle}>All Aadhaar</option>
                  <option value="Verified" style={optionStyle}>Verified</option>
                  <option value="Pending Manual Review" style={optionStyle}>Manual Review</option>
                  <option value="API Mismatch" style={optionStyle}>API Mismatch</option>
                  <option value="Rejected" style={optionStyle}>Rejected</option>
                  <option value="Not Started" style={optionStyle}>Not Started</option>
                </SelectMenu>
              </div>

              {/* PAN Status */}
              <div>
                <label className={labelClass}>PAN Status</label>
                <SelectMenu
                  value={filters.panStatus || ''}
                  onChange={(e) => onFilterChange({ ...filters, panStatus: e.target.value })}
                  className={selectClass}
                >
                  <option value="" style={optionStyle}>All PAN</option>
                  <option value="Verified" style={optionStyle}>Verified</option>
                  <option value="Pending Manual Review" style={optionStyle}>Manual Review</option>
                  <option value="API Mismatch" style={optionStyle}>API Mismatch</option>
                  <option value="Rejected" style={optionStyle}>Rejected</option>
                  <option value="Not Started" style={optionStyle}>Not Started</option>
                </SelectMenu>
              </div>

              {/* Bank Status */}
              <div>
                <label className={labelClass}>Bank Status</label>
                <SelectMenu
                  value={filters.bankStatus || ''}
                  onChange={(e) => onFilterChange({ ...filters, bankStatus: e.target.value })}
                  className={selectClass}
                >
                  <option value="" style={optionStyle}>All Bank</option>
                  <option value="Verified" style={optionStyle}>Verified</option>
                  <option value="Pending Manual Review" style={optionStyle}>Manual Review</option>
                  <option value="Failed" style={optionStyle}>Failed</option>
                  <option value="Not Sent" style={optionStyle}>Not Sent</option>
                </SelectMenu>
              </div>

              {/* UAN Status */}
              <div>
                <label className={labelClass}>UAN / PF Status</label>
                <SelectMenu
                  value={filters.uanStatus || ''}
                  onChange={(e) => onFilterChange({ ...filters, uanStatus: e.target.value })}
                  className={selectClass}
                >
                  <option value="" style={optionStyle}>All UAN</option>
                  <option value="Verified" style={optionStyle}>Verified</option>
                  <option value="Pending Manual Review" style={optionStyle}>Manual Review</option>
                  <option value="Exempted" style={optionStyle}>Exempted</option>
                  <option value="Not Started" style={optionStyle}>Not Started</option>
                </SelectMenu>
              </div>
            </div>
          </div>

          {/* Section 4: Date Range Filters (Joining, Registration, End of Contract) */}
          <div className={dividerClass}>
            <div>
              <span className={sectionHeaderClass}>
                4. Date Ranges (From / To)
              </span>
            </div>

            {/* Date of Joining */}
            <div>
              <label className={labelClass}>Date of Joining</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={filters.dateFrom || ''}
                  onChange={(e) => onFilterChange({ ...filters, dateFrom: e.target.value })}
                  className={`${inputClass} font-mono`}
                  placeholder="From"
                />
                <input
                  type="date"
                  value={filters.dateTo || ''}
                  onChange={(e) => onFilterChange({ ...filters, dateTo: e.target.value })}
                  className={`${inputClass} font-mono`}
                  placeholder="To"
                />
              </div>
            </div>

            {/* Date of Registration */}
            <div>
              <label className={labelClass}>Date of Registration</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={filters.regDateFrom || ''}
                  onChange={(e) => onFilterChange({ ...filters, regDateFrom: e.target.value })}
                  className={`${inputClass} font-mono`}
                  placeholder="From"
                />
                <input
                  type="date"
                  value={filters.regDateTo || ''}
                  onChange={(e) => onFilterChange({ ...filters, regDateTo: e.target.value })}
                  className={`${inputClass} font-mono`}
                  placeholder="To"
                />
              </div>
            </div>

            {/* End of Contract */}
            <div>
              <label className={labelClass}>End of Contract</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={filters.contractEndDateFrom || ''}
                  onChange={(e) => onFilterChange({ ...filters, contractEndDateFrom: e.target.value })}
                  className={`${inputClass} font-mono`}
                  placeholder="From"
                />
                <input
                  type="date"
                  value={filters.contractEndDateTo || ''}
                  onChange={(e) => onFilterChange({ ...filters, contractEndDateTo: e.target.value })}
                  className={`${inputClass} font-mono`}
                  placeholder="To"
                />
              </div>
            </div>

            {/* Show My Candidate Checkbox */}
            <div className="pt-2">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={filters.showOnlyMyCandidates}
                  onChange={(e) =>
                    onFilterChange({ ...filters, showOnlyMyCandidates: e.target.checked })
                  }
                  className="rounded border-2 border-slate-500 text-sky-600 focus:ring-sky-500 h-4 w-4 bg-slate-800 dark:bg-slate-800"
                />
                <span className={`font-bold text-xs ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Show My Candidates Only
                </span>
              </label>
              <p className={`text-[11px] ml-6 mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Filter candidates assigned to your recruiter profile (Ananya Mukherjee)
              </p>
            </div>
          </div>
        </div>

        {/* Drawer Footer Actions */}
        <div className={`p-4 border-t flex items-center justify-between ${
          isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <button
            type="button"
            onClick={onReset}
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border transition-colors ${
              isDark ? 'border-slate-700 text-slate-300 hover:text-white hover:bg-slate-850' : 'border-slate-300 text-slate-700 hover:text-slate-900 hover:bg-slate-200/70'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset All Filters</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Apply Filters ({activeFilterCount})</span>
          </button>
        </div>
      </div>
    </div>
  );
};
