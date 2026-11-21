import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Shield, 
  MoreVertical, 
  UserCheck, 
  UserX, 
  Edit3, 
  Eye, 
  Lock, 
  CheckCircle2, 
  AlertCircle,
  Clock,
  ChevronDown,
  Download,
  Plus,
  RotateCcw,
  Building2,
  Phone,
  Mail,
  UserPlus,
  Key,
  ShieldCheck,
  ExternalLink
} from 'lucide-react';
import { UserAccount, SystemRole, AppModuleName } from '../../types/userSettings';

import { SelectMenu } from '../../components/ui/SelectMenu';
interface UsersAndAccessSectionProps {
  users: UserAccount[];
  currentUserRole: SystemRole;
  currentUserId: string;
  onOpenAddUser: () => void;
  onOpenEditUser: (user: UserAccount) => void;
  onOpenManageAccess: (user: UserAccount) => void;
  onOpenLinkCandidate: (user: UserAccount) => void;
  onOpenClientMapping: (user: UserAccount) => void;
  onToggleStatus: (userId: string) => void;
  onExportMappedClientReport: () => void;
}

export const UsersAndAccessSection: React.FC<UsersAndAccessSectionProps> = ({
  users,
  currentUserRole,
  currentUserId,
  onOpenAddUser,
  onOpenEditUser,
  onOpenManageAccess,
  onOpenLinkCandidate,
  onOpenClientMapping,
  onToggleStatus,
  onExportMappedClientReport,
}) => {
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [adminFilter, setAdminFilter] = useState('All');
  const [clientFilter, setClientFilter] = useState('All');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  // Hierarchy Visibility:
  // - Super Admin sees all users.
  // - Admin sees only HRs under them (reportingAdminId === currentUserId or subordinate HR roles).
  // - HR sees only their own profile.
  const visibleUsers = useMemo(() => {
    if (currentUserRole === 'Super Admin') return users;
    if (currentUserRole === 'Admin') {
      return users.filter(
        (u) =>
          u.reportingManagerId === currentUserId ||
          u.reportingManagerName?.includes('Ananya') ||
          u.role.startsWith('HR')
      );
    }
    // HR sees only themselves
    return users.filter((u) => u.id === currentUserId || u.role === 'HR');
  }, [users, currentUserRole, currentUserId]);

  // List of distinct admins for the filter dropdown
  const adminOptions = useMemo(() => {
    const managers = users
      .filter((u) => u.role === 'Admin' || u.role === 'Super Admin')
      .map((u) => ({ id: u.id, name: u.name }));
    return Array.from(new Map(managers.map((m) => [m.id, m])).values());
  }, [users]);

  // Filter application
  const filteredUsers = useMemo(() => {
    return visibleUsers.filter((u) => {
      // Role filter
      if (roleFilter !== 'All' && u.role !== roleFilter) return false;

      // Status filter
      if (statusFilter !== 'All' && u.status !== statusFilter) return false;

      // Reporting Admin filter
      if (adminFilter !== 'All' && u.reportingManagerId !== adminFilter) return false;

      // Client filter
      if (clientFilter !== 'All') {
        const hasClient = u.mappedClients?.some((c) =>
          c.clientName.toLowerCase().includes(clientFilter.toLowerCase())
        );
        if (!hasClient) return false;
      }

      // Search by employee code, name, contact/mobile, or email
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesCode = u.employeeCode?.toLowerCase().includes(q);
        const matchesName = u.name.toLowerCase().includes(q);
        const matchesEmail = u.email.toLowerCase().includes(q);
        const matchesPhone = u.mobileNo?.toLowerCase().includes(q);
        if (!matchesCode && !matchesName && !matchesEmail && !matchesPhone) return false;
      }

      return true;
    });
  }, [visibleUsers, roleFilter, statusFilter, adminFilter, clientFilter, searchQuery]);

  const selectedUserObj = useMemo(() => {
    return users.find((u) => u.id === selectedUserId) || null;
  }, [users, selectedUserId]);

  const clearFilters = () => {
    setSearchQuery('');
    setRoleFilter('All');
    setStatusFilter('All');
    setAdminFilter('All');
    setClientFilter('All');
    setSelectedUserId(null);
  };

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    roleFilter !== 'All' ||
    statusFilter !== 'All' ||
    adminFilter !== 'All' ||
    clientFilter !== 'All';

  // Role Badge Styling
  const getRoleBadge = (role: string) => {
    if (role === 'Super Admin') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
          <Shield className="w-3 h-3 text-purple-600 dark:text-purple-400" />
          Super Admin
        </span>
      );
    }
    if (role === 'Admin') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
          <Shield className="w-3 h-3 text-sky-600 dark:text-sky-400" />
          Admin
        </span>
      );
    }
    if (role.startsWith('HR')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
          <UserCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
          {role}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
        {role}
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Active':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Active
          </span>
        );
      case 'Non Active':
      case 'Suspended':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            Non Active
          </span>
        );
      case 'Pending Invitation':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
            <Clock className="w-3 h-3 text-amber-500" />
            Pending
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600">
            {status}
          </span>
        );
    }
  };

  const canAddOrEdit = currentUserRole === 'Super Admin' || currentUserRole === 'Admin';

  return (
    <div className="space-y-4">
      {/* Scope Banner & Global Actions Bar */}
      <div className="p-3 sm:p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 flex items-center justify-center font-bold">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">
              {currentUserRole === 'Super Admin'
                ? 'All Enterprise Accounts (Tenant-wide Span)'
                : currentUserRole === 'Admin'
                ? 'Assigned HR Team Members & Subordinates'
                : 'My Personal Enterprise Account Profile'}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              {currentUserRole === 'Super Admin'
                ? 'Full visibility across Super Admins, Operations Admins, and Recruiters.'
                : currentUserRole === 'Admin'
                ? 'You can supervise and assign roles only to HRs reporting under your span.'
                : 'Read-only inspection of your credentials, permissions, and mapped clients.'}
            </p>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {canAddOrEdit && (
            <button
              type="button"
              onClick={onOpenAddUser}
              className="px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add User</span>
            </button>
          )}

          <button
            type="button"
            onClick={onExportMappedClientReport}
            className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-750 text-slate-800 dark:text-slate-200 font-semibold text-xs shadow-2xs flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export Mapped Client Report</span>
          </button>
        </div>
      </div>

      {/* Modern Filter and Search Bar */}
      <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-lg">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by employee code, name, contact, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          {/* Quick Clear & Record Count */}
          <div className="flex items-center gap-3 text-xs justify-between lg:justify-end">
            <span className="text-[11px] text-slate-500 font-medium">
              Showing <strong className="text-slate-900 dark:text-white">{filteredUsers.length}</strong> of {visibleUsers.length} users
            </span>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Clear Filters</span>
              </button>
            )}
          </div>
        </div>

        {/* Filters Row: Status | Role | Reporting Admin | Client */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1 text-xs">
          {/* Status Filter */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Status
            </label>
            <SelectMenu
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-1 focus:ring-sky-500"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Non Active">Non Active</option>
              <option value="Pending Invitation">Pending</option>
            </SelectMenu>
          </div>

          {/* Role Filter */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Role
            </label>
            <SelectMenu
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-1 focus:ring-sky-500"
            >
              <option value="All">All Roles</option>
              {currentUserRole === 'Super Admin' && <option value="Super Admin">Super Admin</option>}
              {currentUserRole === 'Super Admin' && <option value="Admin">Admin</option>}
              <option value="HR">HR</option>
              <option value="Account manager">Account manager</option>
              <option value="Accountant">Accountant</option>
              <option value="Compliance">Compliance</option>
              <option value="HR-Onboarding">HR-Onboarding</option>
              <option value="HR-Payroll">HR-Payroll</option>
              <option value="HR-Engagement">HR-Engagement</option>
            </SelectMenu>
          </div>

          {/* Reporting Admin Filter */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Reporting Admin
            </label>
            <SelectMenu
              value={adminFilter}
              onChange={(e) => setAdminFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-1 focus:ring-sky-500"
            >
              <option value="All">All Managers</option>
              {adminOptions.map((a) => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </SelectMenu>
          </div>

          {/* Client Filter */}
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              Client
            </label>
            <SelectMenu
              value={clientFilter}
              onChange={(e) => setClientFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:ring-1 focus:ring-sky-500"
            >
              <option value="All">All Clients</option>
              <option value="2COMS">2COMS Services</option>
              <option value="TCS">Tata Consultancy Services</option>
            </SelectMenu>
          </div>
        </div>
      </div>

      {/* Selected User Quick Action Ribbon */}
      {selectedUserObj && (
        <div className="p-3 sm:p-3.5 rounded-xl border border-sky-300 dark:border-sky-700 bg-sky-50 dark:bg-sky-950/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs animate-in fade-in duration-150">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-sky-600 text-white font-extrabold text-xs flex items-center justify-center shrink-0 shadow-xs border border-sky-400">
              {selectedUserObj.name.split(' ').map((n) => n[0]).join('')}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-extrabold text-slate-900 dark:text-white text-sm">
                  {selectedUserObj.name}
                </span>
                <span className="font-mono text-[11px] px-1.5 py-0.5 rounded bg-white dark:bg-slate-900 text-sky-800 dark:text-sky-300 border border-sky-300 dark:border-sky-700 font-bold">
                  {selectedUserObj.employeeCode}
                </span>
                {getRoleBadge(selectedUserObj.role)}
                {getStatusBadge(selectedUserObj.status)}
              </div>
              <p className="text-[11px] text-slate-700 dark:text-slate-300 mt-0.5">
                {selectedUserObj.email} · {selectedUserObj.department || 'Operations'} · Reporting to: <strong className="text-slate-900 dark:text-slate-100">{selectedUserObj.reportingManagerName || 'None (Super Admin)'}</strong>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => onOpenManageAccess(selectedUserObj)}
              className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Key className="w-3.5 h-3.5" />
              <span>Manage Access</span>
            </button>

            {canAddOrEdit && (
              <button
                type="button"
                onClick={() => onOpenEditUser(selectedUserObj)}
                className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit User</span>
              </button>
            )}

            {canAddOrEdit && (
              <button
                type="button"
                onClick={() => onOpenLinkCandidate(selectedUserObj)}
                className="px-3 py-1.5 rounded-lg border border-emerald-300 dark:border-emerald-700 bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950 font-bold text-xs flex items-center gap-1.5 transition-colors"
              >
                <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>Candidate Link</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => onOpenClientMapping(selectedUserObj)}
              className="px-3 py-1.5 rounded-lg border border-indigo-300 dark:border-indigo-700 bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-950 font-bold text-xs flex items-center gap-1.5 transition-colors"
            >
              <Building2 className="w-3.5 h-3.5 text-indigo-500" />
              <span>Clients</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedUserId(null)}
              className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition-colors ml-1"
              title="Close selected ribbon"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden selection:bg-sky-600 selection:text-white dark:selection:bg-sky-600 dark:selection:text-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px] font-semibold select-none">
                <th className="px-4 py-3 min-w-[180px]">User Name</th>
                <th className="px-3 py-3 min-w-[110px]">Employee ID</th>
                <th className="px-4 py-3 min-w-[170px]">Email</th>
                <th className="px-3 py-3 min-w-[120px]">Mobile No</th>
                <th className="px-3 py-3 text-center min-w-[90px]">Status</th>
                <th className="px-3 py-3 min-w-[120px]">Role</th>
                <th className="px-4 py-3 min-w-[170px]">Reporting Manager</th>
                <th className="px-3 py-3 min-w-[100px]">Member Since</th>
                <th className="px-4 py-3 min-w-[160px]">Mapped Candidate</th>
                <th className="px-4 py-3 min-w-[160px]">Mapped Clients</th>
                <th className="px-4 py-3 text-right min-w-[160px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-6 py-12 text-center text-slate-400">
                    <UserX className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
                    <p className="font-semibold text-slate-700 dark:text-slate-300">No matching user accounts found</p>
                    <p className="text-[11px] mt-1">Adjust search parameters or clear filters.</p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isSuperAdminTarget = u.role === 'Super Admin';
                  const canManageUser =
                    currentUserRole === 'Super Admin'
                      ? true
                      : currentUserRole === 'Admin'
                      ? !isSuperAdminTarget && u.role !== 'Admin'
                      : false;

                  const isSelected = selectedUserId === u.id;

                  return (
                    <tr
                      key={u.id}
                      onClick={() => setSelectedUserId(isSelected ? null : u.id)}
                      className={`transition-colors cursor-pointer select-text ${
                        isSelected
                          ? 'bg-sky-50/90 dark:bg-sky-950/70 border-l-4 border-l-sky-500 shadow-inner'
                          : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/60'
                      }`}
                      title={isSelected ? "Click to deselect" : "Click to view details & actions"}
                    >
                      {/* User Name */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[11px] shrink-0 border transition-colors ${
                            isSelected
                              ? 'bg-sky-600 text-white border-sky-400 shadow-xs'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                          }`}>
                            {u.name.split(' ').map((n) => n[0]).join('')}
                          </div>
                          <div className="text-left">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenManageAccess(u);
                              }}
                              title="Click to manage access & permissions"
                              className="font-bold text-slate-900 dark:text-white hover:text-sky-600 dark:hover:text-sky-300 hover:underline transition-colors block text-left"
                            >
                              {u.name}
                            </button>
                            <span className={`text-[10px] block truncate max-w-[130px] ${
                              isSelected ? 'text-sky-700 dark:text-sky-300 font-medium' : 'text-slate-400 dark:text-slate-400'
                            }`}>
                              {u.department || 'Operations'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Employee ID */}
                      <td className="px-3 py-3.5 font-mono text-[11px]">
                        <span className={`font-semibold ${
                          isSelected
                            ? 'text-sky-800 dark:text-sky-200 font-bold bg-sky-100/70 dark:bg-sky-900/60 px-1.5 py-0.5 rounded border border-sky-200 dark:border-sky-800'
                            : 'text-slate-700 dark:text-slate-300'
                        }`}>
                          {u.employeeCode}
                        </span>
                      </td>

                      {/* Email */}
                      <td className={`px-4 py-3.5 truncate max-w-[170px] ${
                        isSelected ? 'text-slate-900 dark:text-slate-100 font-medium' : 'text-slate-600 dark:text-slate-300'
                      }`} title={u.email}>
                        {u.email}
                      </td>

                      {/* Mobile No */}
                      <td className={`px-3 py-3.5 font-mono text-[11px] whitespace-nowrap ${
                        isSelected ? 'text-slate-900 dark:text-slate-100 font-medium' : 'text-slate-600 dark:text-slate-300'
                      }`}>
                        {u.mobileNo || '+91 98XXX XXXXX'}
                      </td>

                      {/* Status */}
                      <td className="px-3 py-3.5 text-center whitespace-nowrap">
                        {getStatusBadge(u.status)}
                      </td>

                      {/* Role */}
                      <td className="px-3 py-3.5 whitespace-nowrap">
                        {getRoleBadge(u.role)}
                      </td>

                      {/* Reporting Manager */}
                      <td className={`px-4 py-3.5 truncate max-w-[160px] ${
                        isSelected ? 'text-slate-900 dark:text-slate-100 font-medium' : 'text-slate-600 dark:text-slate-300'
                      }`}>
                        {u.reportingManagerName ? (
                          <span title={u.reportingManagerName}>{u.reportingManagerName}</span>
                        ) : (
                          <span className="text-slate-400 italic">None (Root)</span>
                        )}
                      </td>

                      {/* Member Since */}
                      <td className={`px-3 py-3.5 whitespace-nowrap text-[11px] ${
                        isSelected ? 'text-slate-700 dark:text-slate-300 font-medium' : 'text-slate-500 dark:text-slate-400'
                      }`}>
                        {u.memberSince}
                      </td>

                      {/* Mapped Candidate */}
                      <td className="px-4 py-3.5">
                        {u.mappedCandidateName ? (
                          <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300 text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/70 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800 w-fit">
                            <ShieldCheck className="w-3.5 h-3.5 shrink-0 text-emerald-500" />
                            <span className="truncate max-w-[120px]" title={`${u.mappedCandidateName} (${u.mappedCandidateUserId})`}>
                              {u.mappedCandidateName}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">Not Linked</span>
                        )}
                      </td>

                      {/* Mapped Clients */}
                      <td className="px-4 py-3.5">
                        {u.mappedClients && u.mappedClients.length > 0 ? (
                          <div className="flex flex-wrap gap-1 max-w-[150px]">
                            {u.mappedClients.map((c) => (
                              <span
                                key={c.clientId}
                                className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800"
                              >
                                {c.clientCode}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">None</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          {/* 1. Edit User */}
                          {canManageUser && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenEditUser(u);
                              }}
                              title="Edit User Details"
                              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* 2. Manage Access */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenManageAccess(u);
                            }}
                            title="Manage Access & Permissions"
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          >
                            <Key className="w-3.5 h-3.5" />
                          </button>

                          {/* 3. Link Candidate Account */}
                          {canManageUser && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenLinkCandidate(u);
                              }}
                              title="Link Candidate Account"
                              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* 4. View Mapped Clients */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenClientMapping(u);
                            }}
                            title="View / Edit Mapped Clients"
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          >
                            <Building2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
