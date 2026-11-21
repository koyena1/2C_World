import React from 'react';
import { X, Filter, RotateCcw, MapPin, Building2, User, ShieldAlert, FileText, Send, AlertTriangle } from 'lucide-react';
import {
  DashboardFilterState,
  SOURCING_RECRUITERS_LIST,
} from '../../data/mockDashboardData';
import { useTheme } from '../../hooks/useTheme';

import { SelectMenu } from '../../components/ui/SelectMenu';
interface MoreFiltersModalProps {
  isOpen: boolean;
  onClose: () => void;
  filters: DashboardFilterState;
  onUpdateFilters: (updates: Partial<DashboardFilterState>) => void;
  onResetFilters: () => void;
  availableLocations: { id: string; name: string; branches: string[] }[];
  availableBranches: string[];
  activeAdvancedFilterCount: number;
}

export const MoreFiltersModal: React.FC<MoreFiltersModalProps> = ({
  isOpen,
  onClose,
  filters,
  onUpdateFilters,
  onResetFilters,
  availableLocations,
  availableBranches,
  activeAdvancedFilterCount,
}) => {
  const { isDark } = useTheme();

  if (!isOpen) return null;

  const selectClass = `w-full border-2 text-xs rounded-lg p-2.5 outline-none font-medium transition-all disabled:opacity-40 ${
    isDark 
      ? 'bg-slate-800 border-slate-600 hover:border-slate-500 text-white focus:border-sky-400 focus:ring-2 focus:ring-sky-500/20' 
      : 'bg-white border-slate-300 hover:border-slate-400 text-slate-900 focus:border-sky-500 shadow-2xs'
  }`;

  const labelClass = `block text-xs font-bold mb-1.5 flex items-center gap-1.5 ${
    isDark ? 'text-white' : 'text-slate-900'
  }`;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4">
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/75 backdrop-blur-xs transition-opacity"
      />

      <div className={`relative border rounded-xl max-w-xl w-full p-5 shadow-2xl z-10 transition-colors animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto ${
        isDark ? 'bg-slate-900 border-slate-750 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between pb-3 border-b mb-4 ${
          isDark ? 'border-slate-800' : 'border-slate-200'
        }`}>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-400">
              <Filter className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className={`text-sm font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Advanced Operational Filters
                {activeAdvancedFilterCount > 0 && (
                  <span className="text-[10px] font-mono bg-sky-600 text-white px-1.5 py-0.2 rounded-full font-bold">
                    {activeAdvancedFilterCount} active
                  </span>
                )}
              </h3>
              <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Filter across locations, branches, recruiters, letters, documents, and risk profiles.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors ${
              isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filter Fields (2-column grid) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
          {/* Location */}
          <div>
            <label className={labelClass}>
              <MapPin className="w-3.5 h-3.5 text-sky-500" />
              <span>Location</span>
            </label>
            <SelectMenu
              disabled={filters.selectedClient === 'all'}
              value={filters.selectedLocation}
              onChange={(e) => onUpdateFilters({ selectedLocation: e.target.value, selectedBranch: 'all' })}
              className={selectClass}
            >
              <option value="all">
                {filters.selectedClient === 'all' ? 'Select Client in Top Bar First' : 'All Locations in Client'}
              </option>
              {availableLocations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name}
                </option>
              ))}
            </SelectMenu>
          </div>

          {/* Branch */}
          <div>
            <label className={labelClass}>
              <Building2 className="w-3.5 h-3.5 text-sky-500" />
              <span>Branch Office</span>
            </label>
            <SelectMenu
              disabled={filters.selectedLocation === 'all'}
              value={filters.selectedBranch}
              onChange={(e) => onUpdateFilters({ selectedBranch: e.target.value })}
              className={selectClass}
            >
              <option value="all">
                {filters.selectedLocation === 'all' ? 'Select Location First' : 'All Branches in Location'}
              </option>
              {availableBranches.map((br) => (
                <option key={br} value={br}>
                  {br}
                </option>
              ))}
            </SelectMenu>
          </div>

          {/* Recruiter / Sourcing HR */}
          <div>
            <label className={labelClass}>
              <User className="w-3.5 h-3.5 text-sky-500" />
              <span>Sourcing HR / Recruiter</span>
            </label>
            <SelectMenu
              value={filters.selectedRecruiter}
              onChange={(e) => onUpdateFilters({ selectedRecruiter: e.target.value })}
              className={selectClass}
            >
              {SOURCING_RECRUITERS_LIST.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </SelectMenu>
          </div>

          {/* Candidate Status */}
          <div>
            <label className={labelClass}>
              <ShieldAlert className="w-3.5 h-3.5 text-sky-500" />
              <span>Candidate Status</span>
            </label>
            <SelectMenu
              value={filters.selectedStatus}
              onChange={(e) => onUpdateFilters({ selectedStatus: e.target.value })}
              className={selectClass}
            >
              <option value="all">All Candidate Statuses</option>
              <option value="Yet to Join">Yet to Join</option>
              <option value="Joined">Joined</option>
              <option value="Offer Rolled Out">Offer Rolled Out</option>
              <option value="Offer Dropped">Offer Dropped</option>
              <option value="Offer Not Rolled Out">Offer Not Rolled Out</option>
              <option value="Document Pending">Document Pending</option>
              <option value="KYC Pending">KYC Pending</option>
              <option value="Bank Verification Pending">Bank Verification Pending</option>
            </SelectMenu>
          </div>

          {/* Letter Status */}
          <div>
            <label className={labelClass}>
              <Send className="w-3.5 h-3.5 text-purple-500" />
              <span>Letter Status</span>
            </label>
            <SelectMenu
              value={filters.selectedLetterStatus || 'all'}
              onChange={(e) => onUpdateFilters({ selectedLetterStatus: e.target.value })}
              className={selectClass}
            >
              <option value="all">All Letter Statuses</option>
              <option value="pending-send">Pending to Send (15)</option>
              <option value="delivery-failed">Delivery Failed (3)</option>
              <option value="pending-acceptance">Sent · Pending Acceptance</option>
              <option value="accepted">Accepted / Signed</option>
              <option value="pending-generation">Pending Generation</option>
            </SelectMenu>
          </div>

          {/* Document Status */}
          <div>
            <label className={labelClass}>
              <FileText className="w-3.5 h-3.5 text-amber-500" />
              <span>Document Status</span>
            </label>
            <SelectMenu
              value={filters.selectedDocumentStatus || 'all'}
              onChange={(e) => onUpdateFilters({ selectedDocumentStatus: e.target.value })}
              className={selectClass}
            >
              <option value="all">All Document Statuses</option>
              <option value="pending-review">Pending Verification (23)</option>
              <option value="kyc-mismatch">KYC / API Mismatch (17)</option>
              <option value="bank-failed">Penny Drop Failed (4)</option>
              <option value="rejected">Rejected / Reupload Pending</option>
              <option value="verified">All Verified</option>
            </SelectMenu>
          </div>

          {/* Risk Level */}
          <div className="sm:col-span-2">
            <label className={labelClass}>
              <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
              <span>Risk Level</span>
            </label>
            <SelectMenu
              value={filters.selectedRiskLevel || 'all'}
              onChange={(e) => onUpdateFilters({ selectedRiskLevel: e.target.value })}
              className={selectClass}
            >
              <option value="all">All Risk Profiles</option>
              <option value="at-risk">At Risk Candidates (8)</option>
              <option value="sla-breach">SLA Breached / Aging &gt; 48h (5)</option>
              <option value="delivery-failure">Delivery Bounces / Failures (3)</option>
              <option value="normal">Normal / On Track</option>
            </SelectMenu>
          </div>
        </div>

        {/* Footer Actions */}
        <div className={`flex items-center justify-between pt-4 mt-5 border-t ${
          isDark ? 'border-slate-800' : 'border-slate-200'
        }`}>
          <button
            onClick={() => {
              onResetFilters();
              onClose();
            }}
            className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded transition-colors ${
              isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset All Filters</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 rounded-lg transition-colors shadow-xs"
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
};
