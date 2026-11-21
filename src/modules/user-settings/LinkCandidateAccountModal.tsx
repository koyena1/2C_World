import React, { useState, useMemo } from 'react';
import { 
  X, 
  Search, 
  UserCheck, 
  Check, 
  Building2, 
  Phone, 
  Mail, 
  ShieldCheck, 
  ExternalLink 
} from 'lucide-react';
import { UserAccount } from '../../types/userSettings';
import { MOCK_CANDIDATES } from '../../data/mockOnboardingData';

interface LinkCandidateAccountModalProps {
  user: UserAccount | null;
  isOpen: boolean;
  onClose: () => void;
  onLinkCandidate: (userId: string, candidate: { id: string; name: string; userId: string; email: string } | null) => void;
}

export const LinkCandidateAccountModal: React.FC<LinkCandidateAccountModalProps> = ({
  user,
  isOpen,
  onClose,
  onLinkCandidate,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(
    user?.mappedCandidateId || null
  );

  React.useEffect(() => {
    if (user) {
      setSelectedCandidateId(user.mappedCandidateId || null);
      setSearchQuery('');
    }
  }, [user]);

  const filteredCandidates = useMemo(() => {
    if (!searchQuery.trim()) {
      return MOCK_CANDIDATES.slice(0, 8);
    }
    const q = searchQuery.toLowerCase().trim();
    return MOCK_CANDIDATES.filter(
      (c) =>
        `${c.firstName} ${c.lastName}`.toLowerCase().includes(q) ||
        c.userId.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        (c.phone && c.phone.toLowerCase().includes(q))
    );
  }, [searchQuery]);

  if (!isOpen || !user) return null;

  const handleSave = () => {
    if (!selectedCandidateId) {
      onLinkCandidate(user.id, null);
    } else {
      const found = MOCK_CANDIDATES.find((c) => c.id === selectedCandidateId);
      if (found) {
        onLinkCandidate(user.id, {
          id: found.id,
          name: `${found.firstName} ${found.lastName}`,
          userId: found.userId,
          email: found.email,
        });
      }
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-850">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 flex items-center justify-center font-bold">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Link Candidate Account
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                User: <span className="font-semibold text-slate-800 dark:text-slate-200">{user.name}</span> ({user.employeeCode})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
          {/* Current link status */}
          <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-slate-500 dark:text-slate-400">Currently Linked:</span>
              {user.mappedCandidateName ? (
                <span className="font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {user.mappedCandidateName} ({user.mappedCandidateUserId})
                </span>
              ) : (
                <span className="text-slate-400 italic">None (Independent Account)</span>
              )}
            </div>
            {selectedCandidateId && (
              <button
                type="button"
                onClick={() => setSelectedCandidateId(null)}
                className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:underline"
              >
                Unlink Account
              </button>
            )}
          </div>

          {/* Search Box */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
              Search Candidate Pool
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by Employee Code, Email, or Contact..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          {/* Candidate list */}
          <div className="space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Select Candidate to Link
            </p>
            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {filteredCandidates.map((cand) => {
                const isSelected = selectedCandidateId === cand.id;
                return (
                  <div
                    key={cand.id}
                    onClick={() => setSelectedCandidateId(cand.id)}
                    className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between ${
                      isSelected
                        ? 'border-sky-500 bg-sky-50/70 dark:bg-sky-950/40 text-slate-900 dark:text-white ring-1 ring-sky-500'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-xs text-slate-700 dark:text-slate-200 shrink-0">
                        {cand.firstName[0]}{cand.lastName[0]}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                          <span>{cand.firstName} {cand.lastName}</span>
                          <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                            {cand.userId}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3 text-slate-400" />
                            {cand.email}
                          </span>
                          <span className="flex items-center gap-1">
                            <Building2 className="w-3 h-3 text-slate-400" />
                            {cand.clientName}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isSelected ? (
                        <div className="w-5 h-5 rounded-full bg-sky-600 text-white flex items-center justify-center shrink-0">
                          <Check className="w-3 h-3" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full border border-slate-300 dark:border-slate-600 shrink-0" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850 flex items-center justify-between">
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Linking permits single-sign-on access to candidate profile documents.
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-sky-600 hover:bg-sky-700 text-white shadow-xs transition-colors"
            >
              Save Linkage
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
