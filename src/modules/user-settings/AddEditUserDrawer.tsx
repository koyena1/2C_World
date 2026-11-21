import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Shield, 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  Building2, 
  UserCheck, 
  AlertTriangle, 
  Check, 
  Search, 
  Layers, 
  Lock 
} from 'lucide-react';
import { 
  UserAccount, 
  RoleDefinition, 
  AppModuleName, 
  ALL_APP_MODULES 
} from '../../types/userSettings';
import { MOCK_CANDIDATES } from '../../data/mockOnboardingData';

import { SelectMenu } from '../../components/ui/SelectMenu';
interface AddEditUserDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserAccount | null; // null for Add, user object for Edit
  roles: RoleDefinition[];
  allAdmins: UserAccount[];
  currentUserRole: string;
  onSaveUser: (userData: Partial<UserAccount>) => void;
}

export const AddEditUserDrawer: React.FC<AddEditUserDrawerProps> = ({
  isOpen,
  onClose,
  user,
  roles,
  allAdmins,
  currentUserRole,
  onSaveUser,
}) => {
  const isEditing = Boolean(user);

  // Form states
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [mobileNo, setMobileNo] = useState('');
  const [employeeCode, setEmployeeCode] = useState('');
  const [dob, setDob] = useState('');
  const [dateOfJoining, setDateOfJoining] = useState('');
  const [selectedRole, setSelectedRole] = useState('HR');
  const [reportingManagerId, setReportingManagerId] = useState('');
  const [status, setStatus] = useState<'Active' | 'Non Active' | 'Pending Invitation'>('Active');
  const [department, setDepartment] = useState('Talent Acquisition');

  // Candidate linking
  const [mappedCandidateId, setMappedCandidateId] = useState<string | null>(null);
  const [candidateSearchQuery, setCandidateSearchQuery] = useState('');
  const [isCandidateDropdownOpen, setIsCandidateDropdownOpen] = useState(false);

  // Errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset or Populate form
  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || user.name.split(' ')[0] || '');
      setLastName(user.lastName || user.name.split(' ').slice(1).join(' ') || '');
      setEmail(user.email || '');
      setMobileNo(user.mobileNo || '');
      setEmployeeCode(user.employeeCode || '');
      setDob(user.dob || '1995-01-01');
      setDateOfJoining(user.dateOfJoining || '2023-01-01');
      setSelectedRole(user.role || 'HR');
      setReportingManagerId(user.reportingManagerId || '');
      setStatus(user.status || 'Active');
      setDepartment(user.department || 'Talent Acquisition');
      setMappedCandidateId(user.mappedCandidateId || null);
    } else {
      // Add mode defaults
      setFirstName('');
      setLastName('');
      setEmail('');
      setMobileNo('');
      setEmployeeCode(`2CS-${Math.floor(100 + Math.random() * 900)}`);
      setDob('1996-05-15');
      setDateOfJoining(new Date().toISOString().split('T')[0]);
      setSelectedRole(currentUserRole === 'Admin' ? 'HR' : 'HR');
      setReportingManagerId(allAdmins[0]?.id || '');
      setStatus('Active');
      setDepartment('Talent Acquisition');
      setMappedCandidateId(null);
    }
    setErrors({});
    setCandidateSearchQuery('');
    setIsCandidateDropdownOpen(false);
  }, [user, isOpen, allAdmins, currentUserRole]);

  // Selected role object & allowed modules for preview
  const currentRoleObj = useMemo(() => {
    return roles.find((r) => r.name === selectedRole) || roles[2];
  }, [roles, selectedRole]);

  // Filtered candidate list for interactive search
  const candidateResults = useMemo(() => {
    if (!candidateSearchQuery.trim()) return MOCK_CANDIDATES.slice(0, 5);
    const q = candidateSearchQuery.toLowerCase().trim();
    return MOCK_CANDIDATES.filter(
      (c) =>
        `${c.firstName} ${c.lastName}`.toLowerCase().includes(q) ||
        c.userId.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        (c.phone && c.phone.toLowerCase().includes(q))
    ).slice(0, 6);
  }, [candidateSearchQuery]);

  const selectedCandidateObj = useMemo(() => {
    if (!mappedCandidateId) return null;
    return MOCK_CANDIDATES.find((c) => c.id === mappedCandidateId) || null;
  }, [mappedCandidateId]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!firstName.trim()) newErrors.firstName = 'First name is required';
    if (!lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!email.trim() || !email.includes('@')) newErrors.email = 'Valid email is required';
    if (!mobileNo.trim()) newErrors.mobileNo = 'Mobile number is required';
    if (!employeeCode.trim()) newErrors.employeeCode = 'Employee code is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const reportingManager = allAdmins.find((a) => a.id === reportingManagerId);

    const payload: Partial<UserAccount> = {
      firstName,
      lastName,
      name: `${firstName.trim()} ${lastName.trim()}`,
      email: email.trim(),
      mobileNo: mobileNo.trim(),
      employeeCode: employeeCode.trim(),
      dob,
      dateOfJoining,
      role: selectedRole,
      reportingManagerId: reportingManager?.id,
      reportingManagerName: reportingManager ? `${reportingManager.name} (${reportingManager.role})` : undefined,
      status,
      department,
      allowedModules: currentRoleObj.allowedModules,
      mappedCandidateId: selectedCandidateObj ? selectedCandidateObj.id : undefined,
      mappedCandidateName: selectedCandidateObj ? `${selectedCandidateObj.firstName} ${selectedCandidateObj.lastName}` : undefined,
      mappedCandidateUserId: selectedCandidateObj ? selectedCandidateObj.userId : undefined,
      mappedCandidateEmail: selectedCandidateObj ? selectedCandidateObj.email : undefined,
    };

    onSaveUser(payload);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-150">
      <div 
        className="w-full max-w-2xl bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col h-full transform transition-transform"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-850">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 flex items-center justify-center font-bold">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {isEditing ? 'Edit User & Access Profile' : 'Add New Enterprise User'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isEditing ? `Modifying credentials for ${user?.name}` : 'Provision access credentials, role inheritance & candidate linkage'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Section 1: Basic Identity Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
              <User className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                1. Personal & Professional Identity
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  First Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Vikram"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 ${
                    errors.firstName ? 'border-rose-500 focus:ring-rose-500' : 'border-slate-300 dark:border-slate-700 focus:ring-sky-500'
                  }`}
                />
                {errors.firstName && <p className="text-[11px] text-rose-500 mt-1">{errors.firstName}</p>}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Last Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Chowdhury"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 ${
                    errors.lastName ? 'border-rose-500 focus:ring-rose-500' : 'border-slate-300 dark:border-slate-700 focus:ring-sky-500'
                  }`}
                />
                {errors.lastName && <p className="text-[11px] text-rose-500 mt-1">{errors.lastName}</p>}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    placeholder="vikram.c@2coms.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`w-full pl-9 pr-3 py-2 rounded-xl border bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 ${
                      errors.email ? 'border-rose-500 focus:ring-rose-500' : 'border-slate-300 dark:border-slate-700 focus:ring-sky-500'
                    }`}
                  />
                </div>
                {errors.email && <p className="text-[11px] text-rose-500 mt-1">{errors.email}</p>}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Mobile Number <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    placeholder="+91 98450 67890"
                    value={mobileNo}
                    onChange={(e) => setMobileNo(e.target.value)}
                    className={`w-full pl-9 pr-3 py-2 rounded-xl border bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 ${
                      errors.mobileNo ? 'border-rose-500 focus:ring-rose-500' : 'border-slate-300 dark:border-slate-700 focus:ring-sky-500'
                    }`}
                  />
                </div>
                {errors.mobileNo && <p className="text-[11px] text-rose-500 mt-1">{errors.mobileNo}</p>}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Employee Code / User ID <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="2CS-HR-201"
                  value={employeeCode}
                  onChange={(e) => setEmployeeCode(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border font-mono bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 ${
                    errors.employeeCode ? 'border-rose-500 focus:ring-rose-500' : 'border-slate-300 dark:border-slate-700 focus:ring-sky-500'
                  }`}
                />
                {errors.employeeCode && <p className="text-[11px] text-rose-500 mt-1">{errors.employeeCode}</p>}
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Account Status
                </label>
                <SelectMenu
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value="Active">Active</option>
                  <option value="Non Active">Non Active (Suspended)</option>
                  <option value="Pending Invitation">Pending Invitation</option>
                </SelectMenu>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Date of Birth
                </label>
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Date of Joining
                </label>
                <input
                  type="date"
                  value={dateOfJoining}
                  onChange={(e) => setDateOfJoining(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Role Management & Hierarchy */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
              <Shield className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                2. Role Management & Reporting Hierarchy
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Assigned Role <span className="text-rose-500">*</span>
                </label>
                <SelectMenu
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  {roles.map((r) => (
                    <option key={r.id} value={r.name}>
                      {r.name}
                    </option>
                  ))}
                </SelectMenu>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  {currentRoleObj.description}
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  User Reporting Manager
                </label>
                <SelectMenu
                  value={reportingManagerId}
                  onChange={(e) => setReportingManagerId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                >
                  <option value="">None (Reports to Root / Super Admin)</option>
                  {allAdmins.map((adm) => (
                    <option key={adm.id} value={adm.id}>
                      {adm.name} ({adm.role} · {adm.employeeCode})
                    </option>
                  ))}
                </SelectMenu>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                  Determines managerial span of control & approval escalations.
                </p>
              </div>
            </div>

            {/* Role Impact Preview Banner */}
            <div className="p-3.5 rounded-xl border border-sky-200 dark:border-sky-800/80 bg-sky-50/70 dark:bg-sky-950/40 text-xs text-sky-950 dark:text-sky-200 space-y-2">
              <div className="flex items-center gap-2 font-bold">
                <Layers className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
                <span>Role Impact Preview:</span>
              </div>
              <p className="text-[11px] leading-relaxed text-slate-700 dark:text-slate-300">
                When this role (<strong className="text-sky-800 dark:text-sky-300">{selectedRole}</strong>) is assigned, this user will get access to these modules:
              </p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {currentRoleObj.allowedModules.map((mod) => (
                  <span
                    key={mod}
                    className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-white dark:bg-slate-800 text-sky-800 dark:text-sky-300 border border-sky-300 dark:border-sky-700 shadow-2xs"
                  >
                    {mod}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Section 3: Link With Candidate Account */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-2">
              <UserCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                3. Link With Candidate Account (Single-Sign-On)
              </h3>
            </div>

            <div className="space-y-2 text-xs">
              <label className="block font-semibold text-slate-700 dark:text-slate-300">
                Associated Candidate Profile
              </label>

              {/* Current linked state */}
              {selectedCandidateObj ? (
                <div className="p-3 rounded-xl border border-emerald-300 dark:border-emerald-800 bg-emerald-50/70 dark:bg-emerald-950/30 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-200 dark:bg-emerald-800 text-emerald-800 dark:text-emerald-200 flex items-center justify-center font-bold">
                      {selectedCandidateObj.firstName[0]}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white">
                        {selectedCandidateObj.firstName} {selectedCandidateObj.lastName}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
                        <span>Code: {selectedCandidateObj.userId}</span>
                        <span>·</span>
                        <span>{selectedCandidateObj.email}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMappedCandidateId(null)}
                    className="text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline"
                  >
                    Unlink
                  </button>
                </div>
              ) : (
                <div className="relative">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search candidates by Employee Code, Email, or Contact..."
                      value={candidateSearchQuery}
                      onChange={(e) => {
                        setCandidateSearchQuery(e.target.value);
                        setIsCandidateDropdownOpen(true);
                      }}
                      onFocus={() => setIsCandidateDropdownOpen(true)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>

                  {isCandidateDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 z-30 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden max-h-56 overflow-y-auto">
                      <div className="p-2 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between text-[11px] text-slate-500">
                        <span>Select Candidate from Onboarding Pool:</span>
                        <button
                          type="button"
                          onClick={() => setIsCandidateDropdownOpen(false)}
                          className="hover:text-slate-800 dark:hover:text-slate-200"
                        >
                          Close
                        </button>
                      </div>
                      {candidateResults.length === 0 ? (
                        <div className="p-3 text-center text-slate-400 text-xs">No matching candidates found</div>
                      ) : (
                        candidateResults.map((cand) => (
                          <div
                            key={cand.id}
                            onClick={() => {
                              setMappedCandidateId(cand.id);
                              setIsCandidateDropdownOpen(false);
                            }}
                            className="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer transition-colors border-b last:border-0 border-slate-100 dark:border-slate-700 text-xs flex items-center justify-between"
                          >
                            <div>
                              <div className="font-bold text-slate-900 dark:text-white">
                                {cand.firstName} {cand.lastName}
                              </div>
                              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                                {cand.userId} · {cand.email} · {cand.clientName}
                              </div>
                            </div>
                            <button
                              type="button"
                              className="px-2 py-1 text-[11px] font-bold rounded-md bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300"
                            >
                              Link
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </form>

        {/* Drawer Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSubmit}
              className="px-5 py-2 text-xs font-bold rounded-xl bg-sky-600 hover:bg-sky-700 text-white shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <Check className="w-4 h-4" />
              <span>{isEditing ? 'Save Changes' : 'Create User'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
