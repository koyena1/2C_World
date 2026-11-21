import React, { useState, useMemo } from 'react';
import { 
  Key, 
  ShieldAlert, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Layers, 
  Check, 
  X, 
  Lock, 
  AlertTriangle,
  GitFork,
  CheckCircle2,
  Filter
} from 'lucide-react';
import { 
  RawPermissionDefinition, 
  AppModuleName, 
  ALL_APP_MODULES 
} from '../../types/userSettings';

import { SelectMenu } from '../../components/ui/SelectMenu';
interface PermissionRegistrySectionProps {
  permissions: RawPermissionDefinition[];
  currentUserRole: string;
  onAddPermission: (perm: Omit<RawPermissionDefinition, 'id'>) => void;
  onUpdatePermission: (id: string, updates: Partial<RawPermissionDefinition>) => void;
  onDeletePermission: (id: string) => void;
}

export const PermissionRegistrySection: React.FC<PermissionRegistrySectionProps> = ({
  permissions,
  currentUserRole,
  onAddPermission,
  onUpdatePermission,
  onDeletePermission,
}) => {
  const isSuperAdmin = currentUserRole === 'Super Admin';

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedModule, setSelectedModule] = useState<string>('All');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPerm, setEditingPerm] = useState<RawPermissionDefinition | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [technicalKey, setTechnicalKey] = useState('');
  const [module, setModule] = useState<AppModuleName>('Dashboard');
  const [parentPermissionId, setParentPermissionId] = useState<string>('');
  const [description, setDescription] = useState('');
  const [action, setAction] = useState<RawPermissionDefinition['action']>('view');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Filtered definitions
  const filteredPermissions = useMemo(() => {
    return permissions.filter((p) => {
      if (selectedModule !== 'All' && p.module !== selectedModule) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return (
          p.name.toLowerCase().includes(q) ||
          p.technicalKey.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [permissions, selectedModule, searchQuery]);

  // If not Super Admin: Access Restricted Screen
  if (!isSuperAdmin) {
    return (
      <div className="p-8 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs text-center max-w-xl mx-auto space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-400 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Permission Registry Access Restricted
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
            The low-level Permission Registry defines core technical keys and parent-child hierarchy. Only <strong>Super Admin</strong> accounts are authorized to maintain raw database permissions.
          </p>
        </div>
        <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-xs text-slate-600 dark:text-slate-300">
          Your active simulated session is: <strong className="text-slate-900 dark:text-white">{currentUserRole}</strong>.
        </div>
      </div>
    );
  }

  const openAddModal = () => {
    setEditingPerm(null);
    setName('');
    setTechnicalKey('');
    setModule('Dashboard');
    setParentPermissionId('');
    setDescription('');
    setAction('view');
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (p: RawPermissionDefinition) => {
    setEditingPerm(p);
    setName(p.name);
    setTechnicalKey(p.technicalKey);
    setModule(p.module);
    setParentPermissionId(p.parentPermissionId || '');
    setDescription(p.description);
    setAction(p.action);
    setFormErrors({});
    setIsModalOpen(true);
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Permission name is required';
    if (!technicalKey.trim()) errs.technicalKey = 'Technical key is required';
    if (!description.trim()) errs.description = 'Description is required';

    if (Object.keys(errs).length > 0) {
      setFormErrors(errs);
      return;
    }

    const parent = permissions.find((p) => p.id === parentPermissionId);

    if (editingPerm) {
      onUpdatePermission(editingPerm.id, {
        name: name.trim(),
        technicalKey: technicalKey.trim(),
        module,
        parentPermissionId: parentPermissionId || null,
        parentPermissionName: parent?.name,
        description: description.trim(),
        action,
      });
    } else {
      onAddPermission({
        name: name.trim(),
        technicalKey: technicalKey.trim(),
        module,
        parentPermissionId: parentPermissionId || null,
        parentPermissionName: parent?.name,
        description: description.trim(),
        action,
        isSystem: false,
      });
    }
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="p-3 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 flex items-center justify-center font-bold">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Permission Registry (Root Definition Engine)</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                Super Admin Only
              </span>
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Manage technical permission keys, modules, descriptions, and parent-child inheritance relationships.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Add Permission Definition</span>
        </button>
      </div>

      {/* Toolbar: Search & Module Filter */}
      <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="relative w-full sm:max-w-xs">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by label or technical key..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-1 focus:ring-sky-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-500 font-semibold">Filter Module:</span>
          <SelectMenu
            value={selectedModule}
            onChange={(e) => setSelectedModule(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
          >
            <option value="All">All Modules</option>
            {ALL_APP_MODULES.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </SelectMenu>
        </div>
      </div>

      {/* Permissions Table */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px] font-semibold">
                <th className="px-4 py-3 min-w-[200px]">Permission Name & Key</th>
                <th className="px-3 py-3 min-w-[130px]">Module</th>
                <th className="px-3 py-3 min-w-[160px]">Parent Permission</th>
                <th className="px-3 py-3 text-center min-w-[90px]">Action Type</th>
                <th className="px-4 py-3 min-w-[260px]">Description</th>
                <th className="px-3 py-3 text-center min-w-[80px]">System</th>
                <th className="px-4 py-3 text-right min-w-[100px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
              {filteredPermissions.map((p) => {
                const parentObj = permissions.find((par) => par.id === p.parentPermissionId);

                return (
                  <tr key={p.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-850/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900 dark:text-white">{p.name}</div>
                      <div className="font-mono text-[10px] text-sky-600 dark:text-sky-400 mt-0.5">{p.technicalKey}</div>
                    </td>

                    <td className="px-3 py-3">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {p.module}
                      </span>
                    </td>

                    <td className="px-3 py-3">
                      {parentObj ? (
                        <div className="flex items-center gap-1.5 text-[11px] text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 px-2 py-0.5 rounded border border-purple-200 dark:border-purple-800 w-fit">
                          <GitFork className="w-3 h-3 rotate-180" />
                          <span className="truncate max-w-[140px]">{parentObj.name}</span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">None (Root)</span>
                      )}
                    </td>

                    <td className="px-3 py-3 text-center">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {p.action}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                      {p.description}
                    </td>

                    <td className="px-3 py-3 text-center">
                      {p.isSystem ? (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                          Yes
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">-</span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEditModal(p)}
                          title="Edit Permission Definition"
                          className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        {!p.isSystem && (
                          <button
                            type="button"
                            onClick={() => onDeletePermission(p.id)}
                            title="Delete Permission Definition"
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Permission Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden flex flex-col">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Key className="w-4 h-4 text-sky-600" />
                <span>{editingPerm ? 'Edit Permission Definition' : 'Add New Permission Definition'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Human Permission Label <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Export Statutory Reports"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border bg-white dark:bg-slate-800 text-slate-900 dark:text-white ${
                    formErrors.name ? 'border-rose-500' : 'border-slate-300 dark:border-slate-700'
                  }`}
                />
                {formErrors.name && <p className="text-[11px] text-rose-500 mt-1">{formErrors.name}</p>}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Technical Key (e.g. default-dashboard) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. reports-export-statutory"
                  value={technicalKey}
                  onChange={(e) => setTechnicalKey(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border font-mono bg-white dark:bg-slate-800 text-slate-900 dark:text-white ${
                    formErrors.technicalKey ? 'border-rose-500' : 'border-slate-300 dark:border-slate-700'
                  }`}
                />
                {formErrors.technicalKey && <p className="text-[11px] text-rose-500 mt-1">{formErrors.technicalKey}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Target Module <span className="text-rose-500">*</span>
                  </label>
                  <SelectMenu
                    value={module}
                    onChange={(e) => setModule(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    {ALL_APP_MODULES.map((m) => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </SelectMenu>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Action Category
                  </label>
                  <SelectMenu
                    value={action}
                    onChange={(e) => setAction(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="view">View</option>
                    <option value="create">Create</option>
                    <option value="edit">Edit</option>
                    <option value="delete">Delete</option>
                    <option value="approve">Approve</option>
                    <option value="export">Export</option>
                    <option value="send">Send</option>
                    <option value="special">Special Access</option>
                  </SelectMenu>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Parent Permission (Inheritance link)
                </label>
                <SelectMenu
                  value={parentPermissionId}
                  onChange={(e) => setParentPermissionId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="">None (Top-Level Independent)</option>
                  {permissions
                    .filter((p) => !editingPerm || p.id !== editingPerm.id)
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.module})
                      </option>
                    ))}
                </SelectMenu>
                <p className="text-[11px] text-slate-400 mt-1">If set, child permissions are automatically deactivated when parent is revoked.</p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Description <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="Detail the operational authority granted by this key..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold shadow-xs"
                >
                  {editingPerm ? 'Update Definition' : 'Save Definition'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
