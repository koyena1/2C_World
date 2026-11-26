import React, { useState } from 'react';
import { downloadCsv } from '../../utils/download';
import { 
  Building2, 
  Search, 
  Filter, 
  Download, 
  Edit3, 
  Eye, 
  MapPin, 
  GitBranch, 
  ShieldCheck, 
  Users, 
  CheckCircle2, 
  ExternalLink 
} from 'lucide-react';
import { UserAccount, ClientMapping } from '../../types/userSettings';
import { EditClientMappingModal } from './EditClientMappingModal';

import { SelectMenu } from '../../components/ui/SelectMenu';
interface ClientAccessMappingSectionProps {
  users: UserAccount[];
  currentUserRole: string;
  onUpdateClientMappings: (userId: string, updatedMappings: ClientMapping[]) => void;
  onShowToast: (msg: string) => void;
}

export const ClientAccessMappingSection: React.FC<ClientAccessMappingSectionProps> = ({
  users,
  currentUserRole,
  onUpdateClientMappings,
  onShowToast,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [clientFilter, setClientFilter] = useState('All');
  const [selectedUserForEdit, setSelectedUserForEdit] = useState<UserAccount | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Filtered users
  const filteredUsers = users.filter((u) => {
    if (clientFilter !== 'All') {
      const hasClient = u.mappedClients?.some((c) => c.clientName.toLowerCase().includes(clientFilter.toLowerCase()));
      if (!hasClient) return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return (
        u.name.toLowerCase().includes(q) ||
        u.employeeCode.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.role.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Export Mapped Client Report to real CSV
  const handleExportMappedClientReport = () => {
    let csv = `Employee Code,User Name,Email,Role,Status,Mapped Client,Client Code,Permitted Locations,Permitted Branches,Candidate Access Scope\n`;
    
    users.forEach((u) => {
      if (!u.mappedClients || u.mappedClients.length === 0) {
        csv += `"${u.employeeCode}","${u.name}","${u.email}","${u.role}","${u.status}","None","-","None","None","Restricted"\n`;
      } else {
        u.mappedClients.forEach((m) => {
          csv += `"${u.employeeCode}","${u.name}","${u.email}","${u.role}","${u.status}","${m.clientName}","${m.clientCode}","${m.locationNames.join('; ')}","${m.branchNames.join('; ')}","${m.candidateAccessScope}"\n`;
        });
      }
    });

    downloadCsv(csv, `Mapped_Client_Access_Report_${new Date().toISOString().split('T')[0]}.csv`);

    onShowToast('Mapped Client Access Report generated and downloaded successfully.');
  };

  const handleOpenEdit = (user: UserAccount) => {
    setSelectedUserForEdit(user);
    setIsEditModalOpen(true);
  };

  const canEdit = currentUserRole === 'Super Admin' || currentUserRole === 'Admin';

  return (
    <div className="space-y-4">
      {/* Scope Header */}
      <div className="p-3 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Client Access & Regional Hierarchy Mapping</span>
            </h2>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Govern tenant multi-tenancy bounds, permitted offices, and candidate visibility scopes per account.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleExportMappedClientReport}
          className="px-3.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200 font-semibold text-xs shadow-2xs flex items-center gap-1.5 transition-colors"
        >
          <Download className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
          <span>Export Mapped Client Report</span>
        </button>
      </div>

      {/* Toolbar */}
      <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="relative w-full sm:max-w-xs">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by user, ID, role or client..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:ring-1 focus:ring-sky-500 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-500 font-semibold">Client Filter:</span>
          <SelectMenu
            value={clientFilter}
            onChange={(e) => setClientFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium"
          >
            <option value="All">All Enterprise Clients</option>
            <option value="2COMS">2COMS Services</option>
            <option value="TCS">Tata Consultancy Services</option>
          </SelectMenu>
        </div>
      </div>

      {/* Mappings Table */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px] font-semibold">
                <th className="px-4 py-3 min-w-[180px]">User Account</th>
                <th className="px-3 py-3 min-w-[110px]">Role</th>
                <th className="px-4 py-3 min-w-[190px]">Mapped Clients</th>
                <th className="px-4 py-3 min-w-[190px]">Mapped Locations</th>
                <th className="px-4 py-3 min-w-[190px]">Mapped Branches / Offices</th>
                <th className="px-3 py-3 text-center min-w-[140px]">Candidate Access Scope</th>
                <th className="px-4 py-3 text-right min-w-[120px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
              {filteredUsers.map((u) => {
                const mappingsCount = u.mappedClients?.length || 0;

                return (
                  <tr key={u.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-850/50 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="font-bold text-slate-900 dark:text-white">{u.name}</div>
                      <div className="font-mono text-[10px] text-slate-400 mt-0.5">
                        {u.employeeCode} · {u.email}
                      </div>
                    </td>

                    <td className="px-3 py-3.5">
                      <span className="font-semibold px-2 py-0.5 rounded text-[11px] bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                        {u.role}
                      </span>
                    </td>

                    <td className="px-4 py-3.5">
                      {mappingsCount === 0 ? (
                        <span className="text-[11px] text-slate-400 italic">No Clients Mapped</span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {u.mappedClients.map((m) => (
                            <span
                              key={m.clientId}
                              className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800"
                            >
                              {m.clientName}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-3.5 text-[11px] text-slate-600 dark:text-slate-400">
                      {mappingsCount === 0 ? (
                        <span>-</span>
                      ) : (
                        <div className="truncate max-w-xs" title={u.mappedClients.flatMap((m) => m.locationNames).join(', ')}>
                          {Array.from(new Set(u.mappedClients.flatMap((m) => m.locationNames))).join(', ') || 'All Locations'}
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-3.5 text-[11px] text-slate-600 dark:text-slate-400">
                      {mappingsCount === 0 ? (
                        <span>-</span>
                      ) : (
                        <div className="truncate max-w-xs" title={u.mappedClients.flatMap((m) => m.branchNames).join(', ')}>
                          {Array.from(new Set(u.mappedClients.flatMap((m) => m.branchNames))).join(', ') || 'All Branches'}
                        </div>
                      )}
                    </td>

                    <td className="px-3 py-3.5 text-center">
                      {mappingsCount === 0 ? (
                        <span className="text-[10px] text-slate-400">Restricted</span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                          {u.mappedClients[0]?.candidateAccessScope || 'All Candidates'}
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(u)}
                          title={canEdit ? 'Edit Mapping' : 'View Mapping'}
                          aria-label={canEdit ? 'Edit Mapping' : 'View Mapping'}
                          className="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                        >
                          {canEdit ? <Edit3 className="w-3.5 h-3.5" aria-hidden /> : <Eye className="w-3.5 h-3.5" aria-hidden />}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Client Mapping Modal */}
      <EditClientMappingModal
        user={selectedUserForEdit}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSaveMappings={(userId, updated) => {
          onUpdateClientMappings(userId, updated);
          onShowToast(`Client mappings updated for ${selectedUserForEdit?.name}.`);
        }}
      />
    </div>
  );
};
