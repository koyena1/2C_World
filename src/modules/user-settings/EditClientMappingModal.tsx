import React, { useState } from 'react';
import { 
  X, 
  Building2, 
  MapPin, 
  GitBranch, 
  ShieldCheck, 
  Check, 
  Plus, 
  Trash2 
} from 'lucide-react';
import { UserAccount, ClientMapping } from '../../types/userSettings';
import { CLIENT_HIERARCHIES } from '../../data/mockAttendanceData';

import { SelectMenu } from '../../components/ui/SelectMenu';
interface EditClientMappingModalProps {
  user: UserAccount | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveMappings: (userId: string, updatedMappings: ClientMapping[]) => void;
}

export const EditClientMappingModal: React.FC<EditClientMappingModalProps> = ({
  user,
  isOpen,
  onClose,
  onSaveMappings,
}) => {
  const [mappings, setMappings] = useState<ClientMapping[]>([]);
  const [selectedClientIdToAdd, setSelectedClientIdToAdd] = useState<string>('client-2coms');

  React.useEffect(() => {
    if (user) {
      setMappings(JSON.parse(JSON.stringify(user.mappedClients || [])));
    }
  }, [user, isOpen]);

  if (!isOpen || !user) return null;

  const handleAddClient = () => {
    const existing = mappings.find((m) => m.clientId === selectedClientIdToAdd);
    if (existing) return;

    const found = CLIENT_HIERARCHIES.find((c) => c.id === selectedClientIdToAdd);
    if (!found) return;

    const newMap: ClientMapping = {
      clientId: found.id,
      clientName: found.name,
      clientCode: found.code,
      locationNames: found.locations.map((l) => l.name),
      branchNames: found.locations.flatMap((l) => l.branches.map((b) => b.name)),
      candidateAccessScope: 'All Candidates',
    };
    setMappings([...mappings, newMap]);
  };

  const handleRemoveClient = (clientId: string) => {
    setMappings(mappings.filter((m) => m.clientId !== clientId));
  };

  const handleScopeChange = (clientId: string, scope: ClientMapping['candidateAccessScope']) => {
    setMappings(
      mappings.map((m) => (m.clientId === clientId ? { ...m, candidateAccessScope: scope } : m))
    );
  };

  const handleSave = () => {
    onSaveMappings(user.id, mappings);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Edit Client Access Mapping
              </h3>
              <p className="text-[11px] text-slate-500">
                User: <strong className="text-slate-800 dark:text-slate-200">{user.name}</strong> ({user.role})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1 text-xs">
          {/* Quick Add Client Selector */}
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="font-bold text-slate-900 dark:text-white block">Map Additional Enterprise Client</span>
              <span className="text-[11px] text-slate-500">Add tenant scope to this user's authorized access profile</span>
            </div>
            <div className="flex items-center gap-2">
              <SelectMenu
                value={selectedClientIdToAdd}
                onChange={(e) => setSelectedClientIdToAdd(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
              >
                {CLIENT_HIERARCHIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.code})
                  </option>
                ))}
              </SelectMenu>
              <button
                type="button"
                onClick={handleAddClient}
                className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold flex items-center gap-1 shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Map Client</span>
              </button>
            </div>
          </div>

          {/* Active Mappings List */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 dark:text-white uppercase text-[10px] tracking-wider text-slate-500">
              Assigned Client Scopes ({mappings.length})
            </h4>

            {mappings.length === 0 ? (
              <div className="p-6 text-center border border-dashed rounded-xl border-slate-200 dark:border-slate-800 text-slate-400">
                No clients currently mapped. User has zero tenant operational visibility.
              </div>
            ) : (
              mappings.map((m) => (
                <div
                  key={m.clientId}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-sky-600" />
                      <span className="font-bold text-slate-900 dark:text-white">{m.clientName}</span>
                      <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-750 text-slate-600 dark:text-slate-300">
                        {m.clientCode}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveClient(m.clientId)}
                      className="text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 text-[11px] font-semibold"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Unmap Client</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px]">
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Candidate Access Scope
                      </label>
                      <SelectMenu
                        value={m.candidateAccessScope}
                        onChange={(e) => handleScopeChange(m.clientId, e.target.value as any)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-semibold"
                      >
                        <option value="All Candidates">All Candidates (Unrestricted within client)</option>
                        <option value="Assigned Only">Assigned Only (Candidates allocated to recruiter)</option>
                        <option value="Client Candidates Only">Client Candidates Only</option>
                        <option value="Restricted">Restricted (View only without export)</option>
                      </SelectMenu>
                    </div>

                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Authorized Locations
                      </label>
                      <div className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 truncate">
                        {m.locationNames.join(', ') || 'All Locations Authorized'}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-xs"
          >
            Save Client Mappings
          </button>
        </div>
      </div>
    </div>
  );
};
