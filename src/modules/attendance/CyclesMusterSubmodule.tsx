import React, { useState, useMemo } from 'react';
import { 
  Building2, 
  MapPin, 
  GitBranch,
  Calendar, 
  Clock, 
  ChevronRight, 
  ChevronDown, 
  Plus, 
  FileSpreadsheet, 
  RefreshCw, 
  Lock, 
  Unlock, 
  Trash2, 
  Eye, 
  Download, 
  Search, 
  AlertTriangle, 
  CheckCircle2, 
  X, 
  Sliders,
  Filter,
  ShieldCheck,
  Navigation,
  Info,
  Sparkles,
  HelpCircle,
  Check
} from 'lucide-react';
import { 
  AttendanceCycle, 
  EmployeeAttendanceSummary, 
  DailyMusterLogEntry,
  INITIAL_CYCLES, 
  INITIAL_EMPLOYEE_ATTENDANCE,
  INITIAL_DAILY_MUSTER_LOG,
  AttendanceClientProfile,
  ATTENDANCE_CLIENTS,
  CLIENT_HIERARCHIES,
  EnterpriseClientHierarchy,
  ClientLocation,
  ClientBranch,
  KOLKATA_PERMITTED_OFFICES,
  KolkataPermittedOffice
} from '../../data/mockAttendanceData';
import { useTheme } from '../../hooks/useTheme';

import { SelectMenu } from '../../components/ui/SelectMenu';
import { CategoryTabs } from '../../components/page/CategoryTabs';
import { SectionCard, Chip } from '../dashboard/command-center/shared';
interface CyclesMusterSubmoduleProps {
  onShowToast: (msg: string) => void;
  onNavigateToSettings?: () => void;
  selectedClientId?: string;
  selectedLocationId?: string;
  selectedBranchId?: string;
  onContextChange?: (clientId: string, locationId: string, branchId: string) => void;
  selectedClient?: AttendanceClientProfile;
  onClientChange?: (client: AttendanceClientProfile) => void;
}

export const CyclesMusterSubmodule: React.FC<CyclesMusterSubmoduleProps> = ({ 
  onShowToast, 
  onNavigateToSettings,
  selectedClientId: propClientId,
  selectedLocationId: propLocationId,
  selectedBranchId: propBranchId,
  onContextChange,
  selectedClient,
  onClientChange
}) => {
  const { isDark } = useTheme();
  // Page view: 'cycles-list' | 'reports' | 'kolkata-offices'
  const [viewSubPage, setViewSubPage] = useState<'cycles-list' | 'reports' | 'kolkata-offices'>('reports');
  const [cycles, setCycles] = useState<AttendanceCycle[]>(INITIAL_CYCLES);

  // Hierarchical Context State (Client -> City/Work Zone -> Office Location)
  const [currentClientId, setCurrentClientId] = useState<string>(propClientId || 'client-2coms');
  const [currentLocationId, setCurrentLocationId] = useState<string>(propLocationId || 'loc-kol');
  const [currentBranchId, setCurrentBranchId] = useState<string>(propBranchId || 'all');
  const [cycleStatusFilter, setCycleStatusFilter] = useState<'All' | 'Open' | 'Locked'>('All');
  const [cycleSearchQuery, setCycleSearchQuery] = useState<string>('');

  // Interactive Live Punch Simulator State for Candidate Attendance Validation Showcase
  const [testCandidateName, setTestCandidateName] = useState<string>('Priya Sharma');
  const [testMappedOffice, setTestMappedOffice] = useState<'RDB' | 'Big Bagan' | 'Alipore'>('RDB');
  const [testPunchedOffice, setTestPunchedOffice] = useState<string>('Big Bagan');

  // Synchronize when parent props change
  React.useEffect(() => {
    if (propClientId && propClientId !== currentClientId) {
      setCurrentClientId(propClientId);
    }
  }, [propClientId]);

  React.useEffect(() => {
    if (propLocationId && propLocationId !== currentLocationId) {
      setCurrentLocationId(propLocationId);
    }
  }, [propLocationId]);

  React.useEffect(() => {
    if (propBranchId && propBranchId !== currentBranchId) {
      setCurrentBranchId(propBranchId);
    }
  }, [propBranchId]);

  // Hierarchy Lookups
  const activeClientHierarchy = useMemo(() => {
    return CLIENT_HIERARCHIES.find(c => c.id === currentClientId) || CLIENT_HIERARCHIES[0];
  }, [currentClientId]);

  const clientLocations = useMemo(() => {
    return activeClientHierarchy ? activeClientHierarchy.locations : [];
  }, [activeClientHierarchy]);

  const activeLocationObj = useMemo(() => {
    return clientLocations.find(l => l.id === currentLocationId) || clientLocations[0];
  }, [clientLocations, currentLocationId]);

  const locationBranches = useMemo(() => {
    return activeLocationObj ? activeLocationObj.branches : [];
  }, [activeLocationObj]);

  const activeBranchObj = useMemo(() => {
    return locationBranches.find(b => b.id === currentBranchId) || locationBranches[0];
  }, [locationBranches, currentBranchId]);

  const isKolkataZone = activeLocationObj?.city?.toLowerCase() === 'kolkata' || activeLocationObj?.name?.toLowerCase() === 'kolkata' || currentLocationId === 'loc-kol';

  const currentEnrolledStaffCount = useMemo(() => {
    if (currentBranchId && currentBranchId !== 'all') {
      return activeBranchObj?.staffCount || 48;
    }
    if (currentLocationId && currentLocationId !== 'all') {
      return activeLocationObj?.branches.reduce((acc, b) => acc + b.staffCount, 0) || 100;
    }
    return activeClientHierarchy?.locations.reduce(
      (acc, loc) => acc + loc.branches.reduce((bAcc, b) => bAcc + b.staffCount, 0), 0
    ) || 142;
  }, [currentBranchId, currentLocationId, activeBranchObj, activeLocationObj, activeClientHierarchy]);

  // Context Change Handlers with notification
  const handleClientFilterChange = (newClientId: string) => {
    setCurrentClientId(newClientId);
    const client = CLIENT_HIERARCHIES.find(c => c.id === newClientId);
    const firstLoc = client?.locations[0];
    const firstBranch = firstLoc?.branches[0];

    const nextLocId = firstLoc ? firstLoc.id : '';
    const nextBranchId = firstBranch ? firstBranch.id : '';

    setCurrentLocationId(nextLocId);
    setCurrentBranchId(nextBranchId);

    if (onContextChange) {
      onContextChange(newClientId, nextLocId, nextBranchId);
    }
    if (onClientChange && client) {
      onClientChange({
        id: client.id,
        name: client.name,
        code: client.code,
        location: firstLoc?.name || 'Hyderabad',
        state: firstLoc?.state || 'Telangana',
        city: firstLoc?.city || 'Hyderabad',
        branch: firstBranch?.name || 'Home Branch',
        status: 'Active',
        employeeCount: firstBranch?.staffCount || 48
      });
    }
    onShowToast(`Filtered cycles to "${client?.name}".`);
  };

  const handleLocationFilterChange = (newLocId: string) => {
    setCurrentLocationId(newLocId);
    const loc = clientLocations.find(l => l.id === newLocId);
    const isNowKol = loc?.city?.toLowerCase() === 'kolkata' || loc?.name?.toLowerCase() === 'kolkata' || newLocId === 'loc-kol';
    const firstBranch = loc?.branches[0];
    const nextBranchId = isNowKol ? 'all' : (firstBranch ? firstBranch.id : (newLocId === 'all' ? 'all' : ''));

    setCurrentBranchId(nextBranchId);

    if (onContextChange) {
      onContextChange(currentClientId, newLocId, nextBranchId);
    }
    onShowToast(`Filtered cycles to "${loc?.name || 'All Locations'}".`);
  };

  const handleBranchFilterChange = (newBranchId: string) => {
    setCurrentBranchId(newBranchId);
    if (onContextChange) {
      onContextChange(currentClientId, currentLocationId, newBranchId);
    }
    const branch = locationBranches.find(b => b.id === newBranchId);
    onShowToast(`Filtered cycles to branch "${branch?.name || 'All Branches'}".`);
  };

  // Filtered Cycles based on Client, Location, Branch, Status, and Search
  const filteredCycles = useMemo(() => {
    return cycles.filter(c => {
      const matchClient = !c.clientId || c.clientId === currentClientId;
      const matchLoc = currentLocationId === 'all' || !c.locationId || c.locationId === currentLocationId;
      const matchBranch = currentBranchId === 'all' || !c.branchId || c.branchId === currentBranchId;
      const matchStatus = cycleStatusFilter === 'All' || c.status === cycleStatusFilter;
      const matchSearch = !cycleSearchQuery || c.name.toLowerCase().includes(cycleSearchQuery.toLowerCase());
      return matchClient && matchLoc && matchBranch && matchStatus && matchSearch;
    });
  }, [cycles, currentClientId, currentLocationId, currentBranchId, cycleStatusFilter, cycleSearchQuery]);

  const activeCycle = useMemo(() => {
    return filteredCycles.find(c => c.isActive) || filteredCycles[0] || cycles[0];
  }, [filteredCycles, cycles]);

  const [selectedCycleForReport, setSelectedCycleForReport] = useState<AttendanceCycle>(INITIAL_CYCLES[0]);

  // Create Cycle Modal State
  const [isCreateCycleOpen, setIsCreateCycleOpen] = useState<boolean>(false);
  const [newCycleName, setNewCycleName] = useState<string>('September 2026 Cycle');
  const [newCycleStartDate, setNewCycleStartDate] = useState<string>('2026-09-01');
  const [newCycleType, setNewCycleType] = useState<'Monthly' | 'Fortnightly' | 'Weekly' | 'Custom'>('Monthly');
  const [newCycleCustomEndDate, setNewCycleCustomEndDate] = useState<string>('2026-09-30');
  const [createCycleErrors, setCreateCycleErrors] = useState<Record<string, string>>({});
  const [newCycleClientId, setNewCycleClientId] = useState<string>(currentClientId);
  const [newCycleLocationId, setNewCycleLocationId] = useState<string>(currentLocationId);
  const [newCycleBranchId, setNewCycleBranchId] = useState<string>(currentBranchId);

  // Run Muster Modal State
  const [isRunMusterOpen, setIsRunMusterOpen] = useState<boolean>(false);
  const [isMusterProcessing, setIsMusterProcessing] = useState<boolean>(false);
  const [musterSuccessMessage, setMusterSuccessMessage] = useState<string | null>(null);

  // Lock / Delete Cycle Modal State
  const [cycleToLock, setCycleToLock] = useState<AttendanceCycle | null>(null);
  const [cycleToDelete, setCycleToDelete] = useState<AttendanceCycle | null>(null);

  // Export to Excel Modal State
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);

  // =========================================================================
  // REPORT CONTROLS STATE (FIX FOR ISSUE 1 & ISSUE 2)
  // =========================================================================
  const [reportType, setReportType] = useState<string>('Daily Muster');
  const [reportMonth, setReportMonth] = useState<string>('August 2026');
  const [reportSingleDate, setReportSingleDate] = useState<string>('2026-08-25');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('All Departments');
  const [myTeamOnly, setMyTeamOnly] = useState<boolean>(false);
  const [lastGeneratedTime, setLastGeneratedTime] = useState<string>('Just now (25 Aug 2026, 09:30 AM)');

  // Employee Data Grid & Row Expansion State (for Monthly Summary)
  const [employeeSearch, setEmployeeSearch] = useState<string>('');
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({ 'emp-1': true });
  const [sortField, setSortField] = useState<'name' | 'present' | 'absent' | 'lateDays' | 'attendancePct'>('attendancePct');
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  // Daily Muster Log State (for Daily Muster View)
  const [dailyMusterLog, setDailyMusterLog] = useState<DailyMusterLogEntry[]>(INITIAL_DAILY_MUSTER_LOG);
  const [dailySearchQuery, setDailySearchQuery] = useState<string>('');

  // Candidate Attendance Validation spotlight and modal state
  const [selectedCandidateValidation, setSelectedCandidateValidation] = useState<DailyMusterLogEntry>(
    INITIAL_DAILY_MUSTER_LOG[0]
  );
  const [validationModalCandidate, setValidationModalCandidate] = useState<DailyMusterLogEntry | null>(null);

  const handleSimulatePunch = (officeName: string, isOutOfZone = false) => {
    if (isOutOfZone) {
      const updated: DailyMusterLogEntry = {
        ...selectedCandidateValidation,
        punchedLocation: 'Howrah Station [Outside Geo-fence]',
        punchedOffice: 'Outside Permitted Location',
        status: 'Absent',
        validationResult: 'Rejected: Outside Permitted Location',
        validationReason: 'Punch attempted from Howrah Station outside authorized Kolkata offices (only RDB, Big Bagan, and Alipore are permitted).',
      };
      setSelectedCandidateValidation(updated);
      setDailyMusterLog(prev => prev.map(item => item.id === updated.id ? updated : item));
      onShowToast('Simulated punch rejected: outside authorized Kolkata office locations.');
    } else {
      const isSame = selectedCandidateValidation.mappedOffice === officeName;
      const updated: DailyMusterLogEntry = {
        ...selectedCandidateValidation,
        punchedLocation: officeName,
        punchedOffice: officeName,
        status: 'Present',
        validationResult: isSame ? 'Accepted: Same Office' : 'Accepted: Permitted Kolkata Office',
        validationReason: isSame 
          ? 'Punched from designated base office.' 
          : `${officeName} is a permitted Kolkata office location.`,
      };
      setSelectedCandidateValidation(updated);
      setDailyMusterLog(prev => prev.map(item => item.id === updated.id ? updated : item));
      onShowToast(`Simulated punch accepted at ${officeName} (${isSame ? 'Same Office' : 'Permitted Kolkata Office'}).`);
    }
  };

  const toggleRowExpand = (empId: string) => {
    setExpandedRows(prev => ({ ...prev, [empId]: !prev[empId] }));
  };

  // Calculate Period Preview for New Cycle
  const calculatedPeriodPreview = useMemo(() => {
    if (!newCycleStartDate) return 'Select start date';
    const start = new Date(newCycleStartDate);
    if (isNaN(start.getTime())) return 'Invalid date';

    if (newCycleType === 'Monthly') {
      const end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
      return `${start.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} - ${end.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} (${end.getDate()} Days)`;
    } else if (newCycleType === 'Fortnightly') {
      const end = new Date(start.getTime() + 14 * 24 * 60 * 60 * 1000);
      return `${start.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} - ${end.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} (15 Days)`;
    } else if (newCycleType === 'Weekly') {
      const end = new Date(start.getTime() + 6 * 24 * 60 * 60 * 1000);
      return `${start.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} - ${end.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} (7 Days)`;
    } else {
      return `${newCycleStartDate} - ${newCycleCustomEndDate} (Custom Period)`;
    }
  }, [newCycleStartDate, newCycleType, newCycleCustomEndDate]);

  // Handle Create Cycle Submit
  const handleCreateCycleSubmit = () => {
    const errs: Record<string, string> = {};
    if (!newCycleName.trim()) errs.name = 'Cycle Name is required';
    if (!newCycleStartDate) errs.startDate = 'Start Date is required';
    if (newCycleType === 'Custom' && !newCycleCustomEndDate) errs.endDate = 'End Date is required';

    if (Object.keys(errs).length > 0) {
      setCreateCycleErrors(errs);
      return;
    }

    const targetClient = CLIENT_HIERARCHIES.find(c => c.id === newCycleClientId) || activeClientHierarchy;
    const targetLoc = targetClient?.locations.find(l => l.id === newCycleLocationId) || activeLocationObj;
    const targetBranch = targetLoc?.branches.find(b => b.id === newCycleBranchId) || activeBranchObj;

    const newCycle: AttendanceCycle = {
      id: `cycle-${Date.now()}`,
      name: newCycleName.trim(),
      startDate: newCycleStartDate,
      endDate: newCycleType === 'Custom' ? newCycleCustomEndDate : '2026-09-30',
      type: newCycleType,
      status: 'Open',
      isActive: false,
      lockDate: 'Not Locked',
      employeeCount: targetBranch?.staffCount || 48,
      clientId: targetClient.id,
      clientName: targetClient.name,
      locationId: targetLoc?.id,
      locationName: targetLoc?.name,
      branchId: targetBranch?.id,
      branchName: targetBranch?.name,
    };

    setCycles([newCycle, ...cycles]);
    setIsCreateCycleOpen(false);
    onShowToast(`Attendance Cycle "${newCycle.name}" created successfully.`);
  };

  // Handle Run Muster Execution
  const handleExecuteMuster = () => {
    setIsMusterProcessing(true);
    setTimeout(() => {
      setIsMusterProcessing(false);
      setMusterSuccessMessage('Muster force-recalculation completed successfully for 142 employees. 0 errors detected.');
      setLastGeneratedTime('Just now (Recalculated)');
      setTimeout(() => {
        setIsRunMusterOpen(false);
        setMusterSuccessMessage(null);
        onShowToast('Muster run completed and reports updated.');
      }, 1500);
    }, 1800);
  };

  // Handle Lock Cycle Execution
  const handleExecuteLockCycle = () => {
    if (!cycleToLock) return;
    setCycles(cycles.map(c => {
      if (c.id === cycleToLock.id) {
        return {
          ...c,
          status: 'Locked',
          lockDate: new Date().toISOString().split('T')[0],
        };
      }
      return c;
    }));
    onShowToast(`Cycle "${cycleToLock.name}" has been locked. Records frozen for payroll.`);
    setCycleToLock(null);
  };

  // Handle Delete Cycle Execution
  const handleExecuteDeleteCycle = () => {
    if (!cycleToDelete) return;
    setCycles(cycles.filter(c => c.id !== cycleToDelete.id));
    onShowToast(`Cycle "${cycleToDelete.name}" was removed.`);
    setCycleToDelete(null);
  };

  // Handle Export to Excel
  const handleExecuteExportExcel = () => {
    setIsExportModalOpen(false);
    const fileName = reportType === 'Daily Muster' 
      ? `Daily_Muster_${reportSingleDate}_2COMS.xlsx`
      : `Monthly_Attendance_Summary_2026-08_2COMS.xlsx`;
    onShowToast(`Excel export generated: "${fileName}".`);
  };

  // Filtered & Sorted Employees (for Monthly Summary view)
  const filteredEmployees = useMemo(() => {
    return INITIAL_EMPLOYEE_ATTENDANCE.filter(emp => {
      const matchSearch = emp.name.toLowerCase().includes(employeeSearch.toLowerCase()) || 
                          emp.empCode.toLowerCase().includes(employeeSearch.toLowerCase());
      const matchDept = selectedDepartment === 'All Departments' || emp.department === selectedDepartment;
      const matchTeam = !myTeamOnly || emp.isMyTeam;
      return matchSearch && matchDept && matchTeam;
    }).sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];
      if (typeof valA === 'string') {
        return sortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortAsc ? valA - valB : valB - valA;
    });
  }, [employeeSearch, selectedDepartment, myTeamOnly, sortField, sortAsc]);

  // Filtered Daily Muster Entries (for Daily Muster view)
  const filteredDailyMuster = useMemo(() => {
    return dailyMusterLog.filter(entry => {
      const matchSearch = entry.name.toLowerCase().includes(dailySearchQuery.toLowerCase()) ||
                          entry.empCode.toLowerCase().includes(dailySearchQuery.toLowerCase());
      const matchDept = selectedDepartment === 'All Departments' || entry.department === selectedDepartment;
      const matchTeam = !myTeamOnly || entry.isMyTeam;
      const locName = activeLocationObj?.name?.toLowerCase() || '';
      const isKol = isKolkataZone;
      const matchLoc = currentLocationId === 'all' || entry.workZone?.toLowerCase() === locName || entry.location.toLowerCase().includes(locName);
      let matchBranch = true;
      if (currentBranchId && currentBranchId !== 'all') {
        if (isKol) {
          const branchTarget = activeBranchObj?.name?.toLowerCase() || '';
          matchBranch = entry.mappedOffice?.toLowerCase() === branchTarget || entry.punchedOffice?.toLowerCase() === branchTarget;
        } else {
          matchBranch = entry.location.toLowerCase().includes(activeBranchObj?.name?.toLowerCase() || '');
        }
      }
      return matchSearch && matchDept && matchTeam && matchLoc && matchBranch;
    });
  }, [dailyMusterLog, dailySearchQuery, selectedDepartment, myTeamOnly, currentLocationId, currentBranchId, activeLocationObj, activeBranchObj, isKolkataZone]);

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* SUB-NAVIGATION (Cycles / Daily Muster / Permitted Offices) + PAGE ACTIONS  */}
      {/* ========================================================================= */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <CategoryTabs
          value={viewSubPage}
          onChange={(v) => {
            if (v === 'reports') {
              setViewSubPage('reports');
              setReportType('Daily Muster');
            } else {
              setViewSubPage(v as 'cycles-list' | 'kolkata-offices');
            }
          }}
          tabs={[
            { value: 'cycles-list', label: 'Attendance Cycles' },
            { value: 'reports', label: 'Daily Muster & Punch Validation' },
            { value: 'kolkata-offices', label: 'Permitted Offices', count: 3 },
          ]}
        />

        {viewSubPage === 'cycles-list' && (
          <div className="flex flex-wrap items-center gap-2">
            {onNavigateToSettings && (
              <button type="button" onClick={onNavigateToSettings} className="cc-btn cc-btn-secondary">
                <Sliders className="w-3.5 h-3.5" />
                <span>Client Based Settings</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setIsCreateCycleOpen(true);
                setCreateCycleErrors({});
                setNewCycleClientId(currentClientId);
                setNewCycleLocationId(currentLocationId === 'all' ? (clientLocations[0]?.id || '') : currentLocationId);
                setNewCycleBranchId(currentBranchId === 'all' ? (locationBranches[0]?.id || '') : currentBranchId);
              }}
              className="cc-btn cc-btn-primary"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create New Cycle</span>
            </button>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* VIEW A: CYCLES LIST PAGE                                                   */}
      {/* ========================================================================= */}
      {viewSubPage === 'cycles-list' && (
        <div className="space-y-5">
          {/* Filters (client / zone / office come from the context bar above) */}
          <div className="cc-card p-3 sm:p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl">
              <div className="min-w-0">
                <label htmlFor="cycle-status" className="cc-label">Cycle Status</label>
                <SelectMenu
                  id="cycle-status"
                  value={cycleStatusFilter}
                  onChange={(e) => setCycleStatusFilter(e.target.value as any)}
                  className="cc-input"
                >
                  <option value="All">All Statuses</option>
                  <option value="Open">Open Cycles</option>
                  <option value="Locked">Locked Cycles</option>
                </SelectMenu>
              </div>

              <div className="min-w-0">
                <label htmlFor="cycle-search" className="cc-label">Search Cycle</label>
                <div className="relative">
                  <Search className="cc-muted w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="cycle-search"
                    type="text"
                    placeholder="Filter by name..."
                    value={cycleSearchQuery}
                    onChange={(e) => setCycleSearchQuery(e.target.value)}
                    className="cc-input !pl-9"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Current active cycle */}
          <section className="cc-card cc-card-hover p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-2 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Chip tone="good" className="gap-1.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                  Current Active Cycle
                </Chip>
                <Chip tone="info" className="rounded-full">Type: {activeCycle.type}</Chip>
              </div>
              <h2 className="cc-title text-lg font-bold tracking-tight">{activeCycle.name}</h2>
              <div className="cc-muted flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                <span className="cc-title flex items-center gap-1 font-mono font-medium">
                  <Calendar className="cc-accent w-3.5 h-3.5" />
                  {activeCycle.startDate} — {activeCycle.endDate}
                </span>
                <span>Status: <Chip tone={activeCycle.status === 'Locked' ? 'muted' : 'good'} className="rounded-full">{activeCycle.status}</Chip></span>
                <span>Lock Date: <strong className="cc-title">{activeCycle.lockDate}</strong></span>
                <span>Enrolled Staff: <strong className="cc-title">{activeCycle.employeeCount} Employees</strong></span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setSelectedCycleForReport(activeCycle);
                  setViewSubPage('reports');
                }}
                className="cc-btn cc-btn-primary"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Open Report</span>
              </button>
              <button type="button" onClick={() => setIsRunMusterOpen(true)} className="cc-btn cc-btn-tone tone-warn">
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Run Muster</span>
              </button>
              <button type="button" onClick={() => setCycleToLock(activeCycle)} className="cc-btn cc-btn-secondary">
                <Lock className="w-3.5 h-3.5" />
                <span>Lock Cycle</span>
              </button>
            </div>
          </section>

          {/* Cycle history & archive */}
          <SectionCard
            title="Cycle History & Archive"
            subtitle="Historical monthly cycles for statutory records and payroll audits"
            action={<span className="cc-muted text-[11px] font-mono whitespace-nowrap">{filteredCycles.length} of {cycles.length} Cycles</span>}
          >
            <div className="cc-table-wrap">
              <table className="cc-table">
                <thead>
                  <tr>
                    <th>Cycle Name</th>
                    <th>Location / Branch</th>
                    <th>Period</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Lock Date</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCycles.length > 0 ? (
                    filteredCycles.map((c) => (
                      <tr key={c.id}>
                        <td className="whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className="cc-title font-bold">{c.name}</span>
                            {c.isActive && <Chip tone="good" className="rounded">Active</Chip>}
                          </div>
                        </td>
                        <td>
                          <div className="flex flex-col">
                            <span className="cc-title font-semibold">{c.locationName || activeLocationObj?.name || 'Hyderabad'}</span>
                            <span className="cc-muted text-[10px] font-mono">{c.branchName || activeBranchObj?.name || 'Home Branch'}</span>
                          </div>
                        </td>
                        <td className="font-mono whitespace-nowrap">{c.startDate} — {c.endDate}</td>
                        <td className="font-medium">{c.type}</td>
                        <td>
                          {c.status === 'Locked' ? (
                            <Chip tone="muted" className="gap-1 rounded-full"><Lock className="w-2.5 h-2.5" />Locked</Chip>
                          ) : (
                            <Chip tone="good" className="gap-1.5 rounded-full"><span className="w-1.5 h-1.5 rounded-full bg-current" />Open</Chip>
                          )}
                        </td>
                        <td className="font-mono whitespace-nowrap">{c.lockDate}</td>
                        <td className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedCycleForReport(c);
                                setViewSubPage('reports');
                              }}
                              className="cc-btn cc-btn-tone tone-info !h-7 !px-2.5"
                            >
                              Open Report
                            </button>
                            <button type="button" onClick={() => setIsRunMusterOpen(true)} className="cc-page-btn" title="Run Muster" aria-label="Run Muster">
                              <RefreshCw className="w-3.5 h-3.5" />
                            </button>
                            {c.status === 'Open' ? (
                              <button type="button" onClick={() => setCycleToLock(c)} className="cc-page-btn" title="Lock Cycle" aria-label="Lock Cycle">
                                <Lock className="w-3.5 h-3.5" />
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => onShowToast('Cycle is already locked.')}
                                className="cc-page-btn opacity-40 cursor-not-allowed"
                                title="Already Locked"
                                aria-label="Already Locked"
                              >
                                <Lock className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                if (c.status === 'Locked') {
                                  alert('Locked cycles cannot be deleted.');
                                  return;
                                }
                                setCycleToDelete(c);
                              }}
                              className="cc-page-btn tone-bad"
                              style={{ color: 'var(--tone)' }}
                              title="Delete Cycle"
                              aria-label="Delete Cycle"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-8 text-center">
                        <p className="cc-title font-semibold">No attendance cycles match this location/branch filter</p>
                        <p className="cc-muted text-[11px] mt-1">Try switching to another work zone or office, or create a cycle for this branch.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </SectionCard>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW B: ATTENDANCE REPORTS PAGE (PARITY + ISSUE 1 FIX) */}
      {/* ========================================================================= */}
      {viewSubPage === 'reports' && (
        <div className="space-y-6">
          {/* Reports Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Attendance Reports</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Client: <strong className="text-slate-800 dark:text-slate-200">2COMS Services</strong> · Cycle: <strong className="text-slate-800 dark:text-slate-200">{selectedCycleForReport.name}</strong> ({selectedCycleForReport.startDate} - {selectedCycleForReport.endDate})
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${
                selectedCycleForReport.status === 'Locked' 
                  ? 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700' 
                  : 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
              }`}>
                Cycle Status: {selectedCycleForReport.status}
              </span>
            </div>
          </div>

          {/* ======================================================================= */}
          {/* REPORT CONTROLS CARD — PARITY & CRITICAL FIX FOR ISSUE 1 */}
          {/* ======================================================================= */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-2xs space-y-4">
            <div className="border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                <span>Report Controls & Dynamic Filters</span>
              </span>
              <span className="text-[11px] text-slate-400 dark:text-slate-400">
                Mode: <strong className="text-slate-700 dark:text-slate-200 font-semibold">{reportType}</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
              {/* Filter 1: Client Filter */}
              <div>
                <label className="block font-semibold text-slate-800 dark:text-slate-200 mb-1 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                  <span>Client</span>
                </label>
                <SelectMenu
                  value={currentClientId}
                  onChange={(e) => handleClientFilterChange(e.target.value)}
                  className="w-full border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-sky-500 font-medium text-slate-800 dark:text-slate-100"
                >
                  {CLIENT_HIERARCHIES.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </SelectMenu>
              </div>

              {/* Filter 2: City / Work Zone Filter (Cascades from Client) */}
              <div>
                <label className="block font-semibold text-slate-800 dark:text-slate-200 mb-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>City / Work Zone</span>
                </label>
                <SelectMenu
                  value={currentLocationId}
                  onChange={(e) => handleLocationFilterChange(e.target.value)}
                  className="w-full border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-emerald-500 font-medium text-slate-800 dark:text-slate-100"
                >
                  <option value="all">All Locations</option>
                  {clientLocations.map(l => (
                    <option key={l.id} value={l.id}>{l.name}</option>
                  ))}
                </SelectMenu>
              </div>

              {/* Filter 3: Office Location Filter (Cascades from City / Work Zone: Kolkata has RDB, Big Bagan, Alipore; HYD/BLR are city-level) */}
              <div>
                <label className="block font-semibold text-slate-800 dark:text-slate-200 mb-1 flex items-center gap-1">
                  <GitBranch className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                  <span>Office Location</span>
                </label>
                <SelectMenu
                  value={currentBranchId}
                  onChange={(e) => handleBranchFilterChange(e.target.value)}
                  className="w-full border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 bg-white dark:bg-slate-800 text-xs focus:ring-2 focus:ring-purple-500 font-medium text-slate-800 dark:text-slate-100"
                >
                  {isKolkataZone ? (
                    <>
                      <option value="all">All Kolkata Offices</option>
                      <option value="br-kol-rdb">RDB</option>
                      <option value="br-kol-bbg">Big Bagan</option>
                      <option value="br-kol-alp">Alipore</option>
                    </>
                  ) : (
                    locationBranches.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))
                  )}
                </SelectMenu>
              </div>

              {/* Filter 4: Select Report Type */}
              <div>
                <label className="block font-semibold text-slate-800 dark:text-slate-200 mb-1">
                  Report Type <span className="text-sky-600 dark:text-sky-400 font-bold">*</span>
                </label>
                <SelectMenu
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="w-full border border-sky-400 dark:border-sky-600 bg-sky-50/50 dark:bg-slate-800 rounded-lg px-2.5 py-1.5 text-xs focus:ring-2 focus:ring-sky-500 font-bold text-sky-950 dark:text-sky-300"
                >
                  <option value="Monthly Attendance Summary">Monthly Attendance Summary</option>
                  <option value="Daily Muster">Daily Muster / Daily Attendance</option>
                  <option value="Exception & Late Comer Summary">Exception & Late Comer Summary</option>
                </SelectMenu>
              </div>

              {/* =================================================================== */}
              {/* DYNAMIC TIME FILTER: STRICTLY ADAPTIVE BASED ON REPORT TYPE!       */}
              {/* =================================================================== */}
              {reportType === 'Daily Muster' ? (
                /* DATE PICKER FOR A SINGLE DATE (CRITICAL FIX FOR ISSUE 1) */
                <div>
                  <label className="block font-bold text-sky-900 dark:text-sky-300 mb-1 flex items-center justify-between">
                    <span>Attendance Date</span>
                    <span className="text-[10px] text-sky-600 dark:text-sky-400 font-mono">Single Day</span>
                  </label>
                  <input
                    type="date"
                    value={reportSingleDate}
                    onChange={(e) => setReportSingleDate(e.target.value)}
                    className="w-full border-2 border-sky-500 rounded-lg px-3 py-1.5 text-xs font-mono font-bold bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500 shadow-2xs"
                  />
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 block">Inspecting daily punch muster</span>
                </div>
              ) : (
                /* MONTH PICKER FOR MONTHLY SUMMARY */
                <div>
                  <label className="block font-semibold text-slate-800 dark:text-slate-200 mb-1">
                    Select Month
                  </label>
                  <SelectMenu
                    value={reportMonth}
                    onChange={(e) => setReportMonth(e.target.value)}
                    className="w-full border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs focus:ring-2 focus:ring-sky-500 font-medium"
                  >
                    <option value="August 2026">August 2026</option>
                    <option value="July 2026">July 2026</option>
                    <option value="June 2026">June 2026</option>
                  </SelectMenu>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Full cycle calendar window</span>
                </div>
              )}

              {/* Filter 5: Department & My Team checkbox */}
              <div>
                <label className="block font-semibold text-slate-800 dark:text-slate-200 mb-1">
                  Department
                </label>
                <SelectMenu
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="w-full border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs focus:ring-2 focus:ring-sky-500 font-medium"
                >
                  <option value="All Departments">All Departments</option>
                  <option value="Engineering">Engineering</option>
                  <option value="Operations">Operations</option>
                  <option value="HR Services">HR Services</option>
                  <option value="Finance">Finance</option>
                </SelectMenu>
                <div className="pt-1.5">
                  <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={myTeamOnly}
                      onChange={(e) => setMyTeamOnly(e.target.checked)}
                      className="rounded text-sky-600 focus:ring-sky-500 w-3.5 h-3.5"
                    />
                    <span>My Team Only</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Action Buttons: Generate Report, Run Muster, Export to Excel */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <span>Last refreshed: <strong className="font-mono text-slate-700 dark:text-slate-300 font-medium">{lastGeneratedTime}</strong></span>
                <span>·</span>
                <span className="text-emerald-700 dark:text-emerald-400 font-semibold">● Muster Up to Date</span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setLastGeneratedTime(`Just now (${new Date().toLocaleTimeString()})`);
                    onShowToast(`Report updated for ${reportType === 'Daily Muster' ? `date ${reportSingleDate}` : reportMonth}.`);
                  }}
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
                >
                  <span>Generate Report</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsRunMusterOpen(true)}
                  className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Run Muster</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsExportModalOpen(true)}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Export to Excel</span>
                </button>
              </div>
            </div>
          </div>

          {/* ======================================================================= */}
          {/* REPORT VIEW 1: DAILY MUSTER (WHEN REPORT TYPE = 'Daily Muster')          */}
          {/* ======================================================================= */}
          {reportType === 'Daily Muster' && (
            <div className="space-y-4">
              {/* Daily KPI Bar for the selected date */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 block">Date Inspected</span>
                  <span className="text-base font-bold text-sky-800 dark:text-sky-300 font-mono mt-0.5 block">{reportSingleDate}</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Tuesday · Working Day</span>
                </div>
                <div className="cc-card-hover bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 block">Present On Duty</span>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-xl font-bold text-emerald-700 dark:text-emerald-400 font-mono">5 Staff</span>
                  </div>
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium block mt-0.5">83.3% On Time</span>
                </div>
                <div className="cc-card-hover bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 block">Absent Today</span>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-xl font-bold text-rose-600 dark:text-rose-400 font-mono">1 Staff</span>
                  </div>
                  <span className="text-[11px] text-rose-500 dark:text-rose-400 font-medium block mt-0.5">Unplanned</span>
                </div>
                <div className="cc-card-hover bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 block">Late Arrivals</span>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-xl font-bold text-amber-700 dark:text-amber-400 font-mono">2 Staff</span>
                  </div>
                  <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium block mt-0.5">Exceeded Grace Window</span>
                </div>
                <div className="cc-card-hover bg-white dark:bg-slate-900 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 block">On Approved Leave</span>
                  <div className="flex items-baseline gap-2 mt-0.5">
                    <span className="text-xl font-bold text-indigo-700 dark:text-indigo-400 font-mono">1 Staff</span>
                  </div>
                  <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium block mt-0.5">Earned Leave (EL)</span>
                </div>
              </div>

              {/* ======================================================================= */}
              {/* 2. CANDIDATE ATTENDANCE MAPPING DISPLAY (PROMPT REQUIREMENT #2)         */}
              {/* ======================================================================= */}
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                          Candidate Attendance Mapping & Punch Validation
                        </h3>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 border border-sky-300 dark:border-sky-800">
                          Live Inspection
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Interactive validation: attendance is accepted from any permitted Kolkata office (RDB, Big Bagan, or Alipore)
                      </p>
                    </div>
                  </div>

                  {/* Candidate Selector */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      Select Candidate:
                    </span>
                    <SelectMenu
                      value={selectedCandidateValidation.id}
                      onChange={(e) => {
                        const found = dailyMusterLog.find(d => d.id === e.target.value) || dailyMusterLog[0];
                        setSelectedCandidateValidation(found);
                      }}
                      className="border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-sky-500 shadow-2xs"
                    >
                      {dailyMusterLog.map((cand) => (
                        <option key={cand.id} value={cand.id}>
                          {cand.name} ({cand.empCode}) — Mapped: {cand.mappedOffice || 'Kolkata'}
                        </option>
                      ))}
                    </SelectMenu>
                  </div>
                </div>

                {/* Mandated UI Rule Notice */}
                <div className="p-3 bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/80 rounded-lg text-xs flex items-start sm:items-center gap-2.5 text-sky-950 dark:text-sky-200">
                  <Info className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5 sm:mt-0" />
                  <div className="flex-1 leading-relaxed">
                    <strong>Rule:</strong> “Employees mapped to Kolkata may mark attendance from any permitted Kolkata office: <strong>RDB</strong>, <strong>Big Bagan</strong>, or <strong>Alipore</strong>.” Attendance is valid across any permitted location regardless of specific base mapping.
                  </div>
                </div>

                {/* Candidate Attendance Mapping Display Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 text-xs">
                  {/* 1. Candidate Name */}
                  <div className="p-3.5 rounded-lg border bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-300 block">Candidate Name</span>
                    <span className="text-sm font-bold text-slate-900 dark:text-white block mt-1">
                      {selectedCandidateValidation.name}
                    </span>
                    <span className="text-[11px] text-slate-600 dark:text-slate-300 font-mono mt-0.5 block">
                      {selectedCandidateValidation.empCode} · {selectedCandidateValidation.department}
                    </span>
                  </div>

                  {/* 2. Mapped City / Work Zone */}
                  <div className="p-3.5 rounded-lg border bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-300 block">Mapped City / Work Zone</span>
                    <div className="flex items-center gap-1.5 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300">
                        {selectedCandidateValidation.workZone || 'Kolkata'}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-600 dark:text-slate-400 block mt-0.5 font-medium">Permitted Work Zone</span>
                  </div>

                  {/* 3. Mapped Office Location */}
                  <div className="p-3.5 rounded-lg border bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-300 block">Mapped Office Location</span>
                    <div className="flex items-center gap-1.5 mt-1">
                      <GitBranch className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                      <span className="text-sm font-bold text-purple-700 dark:text-purple-300">
                        {selectedCandidateValidation.mappedOffice || 'RDB'}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-600 dark:text-slate-400 block mt-0.5 font-medium">Base Office Mapped</span>
                  </div>

                  {/* 4. Punched Office Location */}
                  <div className="p-3.5 rounded-lg border bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-300 block">Punched Office Location</span>
                    <div className="flex items-center gap-1.5 mt-1">
                      <Navigation className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                      <span className="text-sm font-bold text-sky-700 dark:text-sky-300">
                        {selectedCandidateValidation.punchedLocation}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-600 dark:text-slate-300 block mt-0.5 truncate font-medium" title={selectedCandidateValidation.punchSource}>
                      {selectedCandidateValidation.punchSource}
                    </span>
                  </div>

                  {/* 5. Attendance Status */}
                  <div className="p-3.5 rounded-lg border bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-300 block">Attendance Status</span>
                    <div className="mt-1">
                      {selectedCandidateValidation.status === 'Present' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                          Present
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-200 border border-rose-300 dark:border-rose-700">
                          <AlertTriangle className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                          Absent
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-600 dark:text-slate-300 font-mono mt-0.5 block font-medium">
                      In: {selectedCandidateValidation.inTime || '—'}
                    </span>
                  </div>

                  {/* 6. Validation Result */}
                  <div className={`p-3.5 rounded-lg border ${
                    selectedCandidateValidation.validationResult.includes('Permitted Kolkata')
                      ? 'bg-sky-50 dark:bg-sky-950/60 border-sky-300 dark:border-sky-700'
                      : selectedCandidateValidation.validationResult.includes('Same Office')
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-700'
                      : 'bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-700'
                  }`}>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-600 dark:text-slate-300 block">Validation Result</span>
                    <div className="mt-1">
                      {selectedCandidateValidation.validationResult.includes('Permitted Kolkata Office') && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-100 text-sky-900 dark:bg-sky-900 dark:text-sky-100 border border-sky-300 dark:border-sky-600">
                          <ShieldCheck className="w-3 h-3 text-sky-600 dark:text-sky-400 shrink-0" />
                          Accepted: Permitted Kolkata Office
                        </span>
                      )}
                      {selectedCandidateValidation.validationResult.includes('Same Office') && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-900 dark:bg-emerald-900 dark:text-emerald-100 border border-emerald-300 dark:border-emerald-600">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          Accepted: Same Office
                        </span>
                      )}
                      {selectedCandidateValidation.validationResult.includes('Rejected') && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-900 dark:bg-rose-900 dark:text-rose-100 border border-rose-300 dark:border-rose-600">
                          <AlertTriangle className="w-3 h-3 text-rose-600 dark:text-rose-400 shrink-0" />
                          Rejected: Outside Permitted Location
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-900 dark:text-slate-100 mt-1 leading-snug">
                      <strong className="text-slate-900 dark:text-white">Reason:</strong> {selectedCandidateValidation.validationReason}
                    </p>
                  </div>
                </div>

                {/* Quick Simulation Row */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <div className="text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Simulate punch for <strong className="text-slate-900 dark:text-white">{selectedCandidateValidation.name}</strong>:</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleSimulatePunch('RDB')}
                      className={`px-2.5 py-1 rounded text-xs font-semibold border transition-colors ${
                        selectedCandidateValidation.punchedLocation === 'RDB'
                          ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                          : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      Punch RDB → Accepted
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSimulatePunch('Big Bagan')}
                      className={`px-2.5 py-1 rounded text-xs font-semibold border transition-colors ${
                        selectedCandidateValidation.punchedLocation === 'Big Bagan'
                          ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                          : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      Punch Big Bagan → Accepted
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSimulatePunch('Alipore')}
                      className={`px-2.5 py-1 rounded text-xs font-semibold border transition-colors ${
                        selectedCandidateValidation.punchedLocation === 'Alipore'
                          ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                          : 'bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
                      }`}
                    >
                      Punch Alipore → Accepted
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSimulatePunch('Howrah', true)}
                      className={`px-2.5 py-1 rounded text-xs font-semibold border transition-colors ${
                        selectedCandidateValidation.validationResult.includes('Rejected')
                          ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                          : 'bg-rose-50 dark:bg-rose-950/70 border-rose-300 dark:border-rose-700 text-rose-800 dark:text-rose-200 hover:bg-rose-100 dark:hover:bg-rose-900/60'
                      }`}
                    >
                      Punch Outside → Rejected
                    </button>
                  </div>
                </div>
              </div>

              {/* Daily Muster Data Grid */}
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-800">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Daily Attendance Report for {reportSingleDate}
                    </h3>
                    <span className="text-xs font-mono text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded font-semibold">
                      {filteredDailyMuster.length} Records
                    </span>
                  </div>

                  <div className="relative w-full sm:w-72">
                    <input
                      type="text"
                      value={dailySearchQuery}
                      onChange={(e) => setDailySearchQuery(e.target.value)}
                      placeholder="Search candidate, code, or office..."
                      className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs focus:ring-2 focus:ring-sky-500"
                    />
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                    <thead className="bg-slate-50 dark:bg-slate-800 text-[11px] uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="px-3 py-3">#</th>
                        <th className="px-3 py-3">Emp Code</th>
                        <th className="px-4 py-3">Candidate Name</th>
                        <th className="px-3 py-3">Department</th>
                        <th className="px-3 py-3">Work Zone</th>
                        <th className="px-3 py-3">Mapped Location</th>
                        <th className="px-3 py-3">Punched Location</th>
                        <th className="px-4 py-3">Validation Result</th>
                        <th className="px-3 py-3">In / Out Time</th>
                        <th className="px-3 py-3">Status</th>
                        <th className="px-3 py-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredDailyMuster.map((log, index) => {
                        const isPermittedKolkata = log.validationResult.includes('Permitted Kolkata Office');
                        const isSameOffice = log.validationResult.includes('Same Office');
                        const isRejected = log.validationResult.includes('Rejected') || log.validationResult.includes('Outside');

                        return (
                          <tr key={log.id} className="hover:bg-sky-50/40 dark:hover:bg-slate-800/40 transition-colors">
                            <td className="px-3 py-3 font-mono text-slate-400">{index + 1}</td>
                            <td className="px-3 py-3 font-mono font-bold text-slate-800 dark:text-slate-200">{log.empCode}</td>
                            <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                              <div className="flex items-center gap-1.5">
                                <span>{log.name}</span>
                                {log.isMyTeam && (
                                  <span className="text-[9px] px-1.5 py-0.2 bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 rounded font-semibold">
                                    My Team
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-3 py-3 text-slate-600 dark:text-slate-400">{log.department}</td>
                            <td className="px-3 py-3">
                              <span className="font-semibold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[11px] border border-slate-200 dark:border-slate-700">
                                {log.workZone || 'Kolkata'}
                              </span>
                            </td>
                            <td className="px-3 py-3">
                              <div className="font-semibold text-slate-900 dark:text-white">{log.mappedLocation || `${log.workZone} / ${log.mappedOffice}`}</div>
                              <div className="text-[10px] text-slate-400">Office: {log.mappedOffice || 'RDB'}</div>
                            </td>
                            <td className="px-3 py-3">
                              <div className="font-semibold text-slate-900 dark:text-white">{log.punchedLocation}</div>
                              <div className="text-[10px] text-slate-400 truncate max-w-[140px]" title={log.punchSource}>{log.punchSource}</div>
                            </td>
                            <td className="px-4 py-3">
                              {isPermittedKolkata && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 border border-sky-300 dark:border-sky-800">
                                  <ShieldCheck className="w-3 h-3 text-sky-500 shrink-0" />
                                  Accepted: Permitted Kolkata Office
                                </span>
                              )}
                              {isSameOffice && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                                  Accepted: Same Office
                                </span>
                              )}
                              {isRejected && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                                  <AlertTriangle className="w-3 h-3 text-rose-500 shrink-0" />
                                  Rejected: Outside Permitted Location
                                </span>
                              )}
                              <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 max-w-xs">
                                {log.validationReason}
                              </div>
                            </td>
                            <td className="px-3 py-3 font-mono">
                              <div className="text-slate-800 dark:text-slate-200 font-semibold">{log.inTime} - {log.outTime}</div>
                              <div className="text-[10px] text-slate-400 font-mono">{log.totalHours} ({log.shiftCode})</div>
                            </td>
                            <td className="px-3 py-3">
                              {log.status === 'Present' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                  Present
                                </span>
                              )}
                              {log.status === 'Absent' && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                  Absent
                                </span>
                              )}
                            </td>
                            <td className="px-3 py-3 text-right">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedCandidateValidation(log);
                                  setValidationModalCandidate(log);
                                }}
                                className="px-2.5 py-1 text-xs font-semibold rounded bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300 hover:bg-sky-100 border border-sky-200 dark:border-sky-800 transition-colors"
                              >
                                View Mapping
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ======================================================================= */}
          {/* REPORT VIEW 2: MONTHLY ATTENDANCE SUMMARY                               */}
          {/* ======================================================================= */}
          {reportType === 'Monthly Attendance Summary' && (
            <div className="space-y-4">
              {/* MONTHLY SUMMARY KPI ROW */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="cc-card-hover bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 block">Total Employees</span>
                  <span className="text-2xl font-bold text-slate-900 dark:text-white block font-mono">142</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Active rostered headcount for August</span>
                </div>
                <div className="cc-card-hover bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 block">Total Present</span>
                  <span className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 block font-mono">3,218 Days</span>
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">89.2% Overall Attendance Rate</span>
                </div>
                <div className="cc-card-hover bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 block">Total Absent</span>
                  <span className="text-2xl font-bold text-rose-600 dark:text-rose-400 block font-mono">184 Days</span>
                  <span className="text-[11px] text-rose-500 dark:text-rose-400 font-medium">5.1% Total Absenteeism</span>
                </div>
                <div className="cc-card-hover bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 block">Avg Work Hours</span>
                  <span className="text-2xl font-bold text-slate-800 dark:text-slate-200 block font-mono">08h 42m / Day</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">Compliant (≥ 8h statutory rule)</span>
                </div>
              </div>

              {/* EMPLOYEE SUMMARY DATA GRID */}
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
                <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-800/40">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Employee Monthly Attendance Breakdown
                    </h3>
                    <span className="text-xs font-mono text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded font-semibold">
                      {filteredEmployees.length} Records
                    </span>
                  </div>

                  <div className="relative w-full sm:w-72">
                    <input
                      type="text"
                      value={employeeSearch}
                      onChange={(e) => setEmployeeSearch(e.target.value)}
                      placeholder="Search by name or emp code..."
                      className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-lg text-xs focus:ring-2 focus:ring-sky-500"
                    />
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  </div>
                </div>

                {/* Table with Expandable Rows */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                    <thead className="bg-slate-50 dark:bg-slate-800/60 text-[11px] uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-10">
                      <tr>
                        <th className="w-10 px-3 py-3 text-center"></th>
                        <th className="px-3 py-3">#</th>
                        <th className="px-3 py-3">Emp Code</th>
                        <th className="px-4 py-3">Employee Name</th>
                        <th className="px-4 py-3">Department</th>
                        <th className="px-3 py-3 cursor-pointer select-none hover:text-slate-900 dark:hover:text-white" onClick={() => { setSortField('present'); setSortAsc(!sortAsc); }}>
                          Present {sortField === 'present' && (sortAsc ? '▲' : '▼')}
                        </th>
                        <th className="px-3 py-3 cursor-pointer select-none hover:text-slate-900 dark:hover:text-white" onClick={() => { setSortField('absent'); setSortAsc(!sortAsc); }}>
                          Absent {sortField === 'absent' && (sortAsc ? '▲' : '▼')}
                        </th>
                        <th className="px-3 py-3">Leave</th>
                        <th className="px-3 py-3 cursor-pointer select-none hover:text-slate-900 dark:hover:text-white" onClick={() => { setSortField('lateDays'); setSortAsc(!sortAsc); }}>
                          Late Days {sortField === 'lateDays' && (sortAsc ? '▲' : '▼')}
                        </th>
                        <th className="px-5 py-3 cursor-pointer select-none hover:text-slate-900 dark:hover:text-white" onClick={() => { setSortField('attendancePct'); setSortAsc(!sortAsc); }}>
                          Attendance % {sortField === 'attendancePct' && (sortAsc ? '▲' : '▼')}
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {filteredEmployees.map((emp, index) => {
                        const isExpanded = !!expandedRows[emp.id];
                        return (
                          <React.Fragment key={emp.id}>
                            <tr className={`hover:bg-sky-50/40 dark:hover:bg-slate-800/40 transition-colors ${isExpanded ? 'bg-sky-50/30 dark:bg-slate-800/30' : ''}`}>
                              <td className="px-3 py-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => toggleRowExpand(emp.id)}
                                  className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors"
                                  aria-label="Toggle daily breakdown"
                                >
                                  {isExpanded ? (
                                    <ChevronDown className="w-4 h-4 text-sky-700 dark:text-sky-400" />
                                  ) : (
                                    <ChevronRight className="w-4 h-4 text-slate-400" />
                                  )}
                                </button>
                              </td>

                              <td className="px-3 py-3 font-mono text-slate-500 dark:text-slate-400">{index + 1}</td>
                              <td className="px-3 py-3 font-mono font-bold text-slate-800 dark:text-slate-200">{emp.empCode}</td>
                              <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">
                                <div className="flex items-center gap-2">
                                  <span>{emp.name}</span>
                                  {emp.isMyTeam && (
                                    <span className="text-[9px] px-1.5 py-0.2 bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 rounded font-semibold border border-purple-200 dark:border-purple-800">
                                      My Team
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-slate-600 dark:text-slate-300 font-medium">{emp.department}</td>
                              <td className="px-3 py-3 font-mono font-bold text-emerald-700 dark:text-emerald-400">{emp.present}</td>
                              <td className="px-3 py-3 font-mono font-bold text-rose-600 dark:text-rose-400">{emp.absent}</td>
                              <td className="px-3 py-3 font-mono text-slate-600 dark:text-slate-300">{emp.leave}</td>
                              <td className="px-3 py-3 font-mono font-semibold text-amber-700 dark:text-amber-400">{emp.lateDays}</td>
                              
                              <td className="px-5 py-3">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-24 bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden border border-slate-200/80 dark:border-slate-700">
                                    <div
                                      className={`h-2 rounded-full ${
                                        emp.attendancePct >= 90 
                                          ? 'bg-emerald-600' 
                                          : emp.attendancePct >= 75 
                                            ? 'bg-amber-500' 
                                            : 'bg-rose-500'
                                      }`}
                                      style={{ width: `${emp.attendancePct}%` }}
                                    />
                                  </div>
                                  <span className="font-mono font-bold text-slate-900 dark:text-white text-[11px]">
                                    {emp.attendancePct}%
                                  </span>
                                </div>
                              </td>
                            </tr>

                            {/* EXPANDED NESTED DAILY ATTENDANCE SUB-TABLE */}
                            {isExpanded && (
                              <tr>
                                <td colSpan={10} className="p-0 bg-slate-50/80 dark:bg-slate-800/80 border-b border-sky-200/80 dark:border-slate-700">
                                  <div className="p-4 pl-12 space-y-3">
                                    <div className="flex items-center justify-between">
                                      <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                        <Clock className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                                        <span>Daily Attendance Records — {emp.name} ({emp.empCode} · {emp.department})</span>
                                      </h4>
                                      <span className="text-[10px] text-slate-500 dark:text-slate-400">
                                        Punches & marks for {selectedCycleForReport.name}
                                      </span>
                                    </div>

                                    <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden shadow-2xs">
                                      <table className="w-full text-left text-xs">
                                        <thead className="bg-slate-100 dark:bg-slate-800 text-[10px] uppercase font-bold text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">
                                          <tr>
                                            <th className="px-3 py-2">Date</th>
                                            <th className="px-4 py-2">Punched Location</th>
                                            <th className="px-3 py-2">Status</th>
                                            <th className="px-3 py-2">In Time</th>
                                            <th className="px-3 py-2">Out Time</th>
                                            <th className="px-3 py-2">Total Hours</th>
                                            <th className="px-3 py-2">Late Mins</th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                          {emp.dailyRecords.map((d) => (
                                            <tr key={d.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                              <td className="px-3 py-2 font-mono font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                                                {d.date} ({d.day})
                                              </td>
                                              <td className="px-4 py-2 text-slate-700 dark:text-slate-300">
                                                {d.location}
                                              </td>
                                              <td className="px-3 py-2">
                                                {d.status === 'Present' && (
                                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                                    Present
                                                  </span>
                                                )}
                                                {d.status === 'Absent' && (
                                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                                                    Absent
                                                  </span>
                                                )}
                                                {d.status === 'Holiday' && (
                                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800">
                                                    ★ Holiday: {d.holidayName || 'Official'}
                                                  </span>
                                                )}
                                                {d.status === 'Weekend' && (
                                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                                                    Weekend
                                                  </span>
                                                )}
                                                {d.status === 'Not Marked' && (
                                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                                                    Not Marked
                                                  </span>
                                                )}
                                              </td>
                                              <td className="px-3 py-2 font-mono text-slate-700 dark:text-slate-300">{d.inTime}</td>
                                              <td className="px-3 py-2 font-mono text-slate-700 dark:text-slate-300">{d.outTime}</td>
                                              <td className="px-3 py-2 font-mono font-semibold text-slate-900 dark:text-white">{d.totalHours}</td>
                                              <td className="px-3 py-2 font-mono">
                                                {d.lateMins !== '0m' && d.lateMins !== '—' ? (
                                                  <span className="text-rose-600 dark:text-rose-400 font-bold">{d.lateMins}</span>
                                                ) : (
                                                  <span className="text-slate-400 dark:text-slate-500">{d.lateMins}</span>
                                                )}
                                              </td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* REPORT VIEW 3: EXCEPTION & LATE COMERS */}
          {reportType === 'Exception & Late Comer Summary' && (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Attendance Policy Exceptions & Late Comer Audit</h3>
                <span className="text-xs text-rose-600 dark:text-rose-400 font-semibold bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded border border-rose-200 dark:border-rose-800">
                  3 Staff Exceeded Late Mark Allowance (≥ 3 Late Marks)
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Identifies employees accumulating repeated late arrival marks subject to automatic half-day salary deductions under the 2COMS attendance policy.
              </p>
              <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800 flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-300">
                  <span>Employee</span>
                  <span>Department</span>
                  <span>Late Marks Recorded</span>
                  <span>Deduction Triggered</span>
                  <span>Action</span>
                </div>
                <div className="p-3.5 flex items-center justify-between text-xs hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white">Vikram Malhotra</span>
                    <span className="text-slate-400 font-mono ml-2">2C-8944</span>
                  </div>
                  <span className="text-slate-600 dark:text-slate-300">Engineering</span>
                  <span className="font-mono font-bold text-rose-600 dark:text-rose-400">4 Late Days (Avg 35m)</span>
                  <span className="text-amber-800 dark:text-amber-300 font-semibold bg-amber-100 dark:bg-amber-950/60 px-2 py-0.5 rounded text-[11px] border border-amber-200 dark:border-amber-800">1 Half Day Deducted</span>
                  <button type="button" onClick={() => onShowToast('Waive request initiated for Vikram Malhotra.')} className="text-sky-600 dark:text-sky-400 hover:underline font-semibold">Waive Late</button>
                </div>
                <div className="p-3.5 flex items-center justify-between text-xs hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white">Rahul Verma</span>
                    <span className="text-slate-400 font-mono ml-2">2C-8942</span>
                  </div>
                  <span className="text-slate-600 dark:text-slate-300">Operations</span>
                  <span className="font-mono font-bold text-rose-600 dark:text-rose-400">3 Late Days (Avg 25m)</span>
                  <span className="text-amber-800 dark:text-amber-300 font-semibold bg-amber-100 dark:bg-amber-950/60 px-2 py-0.5 rounded text-[11px] border border-amber-200 dark:border-amber-800">1 Half Day Deducted</span>
                  <button type="button" onClick={() => onShowToast('Waive request initiated for Rahul Verma.')} className="text-sky-600 dark:text-sky-400 hover:underline font-semibold">Waive Late</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW C: KOLKATA PERMITTED OFFICES CONFIGURATION (SUBPAGE VIEW)            */}
      {/* ========================================================================= */}
      {viewSubPage === 'kolkata-offices' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                Kolkata Permitted Offices Configuration
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Client: <strong className="text-slate-800 dark:text-slate-200">2COMS Services</strong> · City / Work Zone: <strong className="text-slate-800 dark:text-slate-200">Kolkata</strong> · Permitted Offices: <strong>RDB · Big Bagan · Alipore</strong>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-semibold border bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>3 Offices Permitted</span>
              </span>
            </div>
          </div>

          {/* Prominent Rule Banner */}
          <div className="p-4 bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 rounded-xl text-xs flex items-start sm:items-center gap-3 text-sky-950 dark:text-sky-200 shadow-2xs">
            <ShieldCheck className="w-5 h-5 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5 sm:mt-0" />
            <div className="flex-1">
              <h4 className="font-bold text-sky-900 dark:text-sky-100 text-sm mb-0.5">
                Attendance Acceptance Policy Rule
              </h4>
              <p className="text-xs leading-relaxed">
                “Employees mapped to Kolkata may mark attendance from any permitted Kolkata office: <strong>RDB</strong>, <strong>Big Bagan</strong>, or <strong>Alipore</strong>.” Attendance is accepted seamlessly across all three work locations regardless of which specific office the candidate is mapped to.
              </p>
            </div>
            <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-md bg-sky-200/60 dark:bg-sky-900 text-sky-800 dark:text-sky-200 font-mono shrink-0">
              Active Policy
            </span>
          </div>

          {/* Table: Kolkata Permitted Offices */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Kolkata Permitted Offices
                </h3>
              </div>
              <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                Client: 2COMS Services (2CS)
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-slate-800 text-[11px] uppercase tracking-wider font-semibold text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="px-5 py-3.5">Office Name</th>
                    <th className="px-4 py-3.5">City / Work Zone</th>
                    <th className="px-5 py-3.5">Pincode / Address placeholder</th>
                    <th className="px-4 py-3.5">Geo-fence Status</th>
                    <th className="px-4 py-3.5">Attendance Allowed</th>
                    <th className="px-5 py-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {KOLKATA_PERMITTED_OFFICES.map((office) => (
                    <tr key={office.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                          <span className="font-bold text-sm text-slate-900 dark:text-white">{office.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="font-semibold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/60 px-2.5 py-1 rounded border border-sky-200 dark:border-sky-800">
                          {office.city} / {office.workZone}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-mono text-[11px] text-slate-600 dark:text-slate-400 max-w-sm">
                        {office.pincodeAddressPlaceholder}
                      </td>
                      <td className="px-4 py-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                          {office.geoFenceStatus}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                          {office.attendanceAllowed}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              onShowToast(`Simulating GPS test punch at Kolkata ${office.name} office.`);
                              handleSimulatePunch(office.name);
                              setViewSubPage('reports');
                            }}
                            className="px-3 py-1 text-xs font-semibold rounded bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 dark:bg-sky-950 dark:text-sky-300 dark:border-sky-800 transition-colors"
                          >
                            Test Punch
                          </button>
                          <button
                            type="button"
                            onClick={() => onShowToast(`Geo-fence radius for ${office.name} set to ${office.geofenceRadiusMeters}m.`)}
                            className="px-3 py-1 text-xs font-semibold rounded bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 transition-colors"
                          >
                            Configure
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: CREATE NEW CYCLE MODAL */}
      {/* ========================================================================= */}
      {isCreateCycleOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in">
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Create New Attendance Cycle</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateCycleOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 block mb-1">
                  Previous Cycle Context
                </span>
                <div className="flex justify-between items-center text-slate-800 dark:text-slate-200">
                  <span className="font-bold">{activeCycle.name}</span>
                  <span className="font-mono text-slate-600 dark:text-slate-400">{activeCycle.startDate} — {activeCycle.endDate}</span>
                </div>
              </div>

              {/* Client, Location, and Branch Scope Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block font-semibold text-slate-800 dark:text-slate-200 mb-1">
                    Client <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <SelectMenu
                    value={newCycleClientId}
                    onChange={(e) => {
                      const cId = e.target.value;
                      setNewCycleClientId(cId);
                      const c = CLIENT_HIERARCHIES.find(x => x.id === cId);
                      const l = c?.locations[0];
                      const b = l?.branches[0];
                      setNewCycleLocationId(l?.id || '');
                      setNewCycleBranchId(b?.id || '');
                    }}
                    className="w-full border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs focus:ring-2 focus:ring-sky-500 font-medium"
                  >
                    {CLIENT_HIERARCHIES.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </SelectMenu>
                </div>

                <div>
                  <label className="block font-semibold text-slate-800 dark:text-slate-200 mb-1">
                    Location <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <SelectMenu
                    value={newCycleLocationId}
                    onChange={(e) => {
                      const lId = e.target.value;
                      setNewCycleLocationId(lId);
                      const currentC = CLIENT_HIERARCHIES.find(x => x.id === newCycleClientId);
                      const l = currentC?.locations.find(x => x.id === lId);
                      setNewCycleBranchId(l?.branches[0]?.id || '');
                    }}
                    className="w-full border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs focus:ring-2 focus:ring-sky-500 font-medium"
                  >
                    {(CLIENT_HIERARCHIES.find(x => x.id === newCycleClientId)?.locations || []).map(l => (
                      <option key={l.id} value={l.id}>{l.name}</option>
                    ))}
                  </SelectMenu>
                </div>

                <div>
                  <label className="block font-semibold text-slate-800 dark:text-slate-200 mb-1">
                    Branch <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <SelectMenu
                    value={newCycleBranchId}
                    onChange={(e) => setNewCycleBranchId(e.target.value)}
                    className="w-full border border-slate-300 dark:border-slate-700 rounded-lg px-2.5 py-1.5 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs focus:ring-2 focus:ring-sky-500 font-medium"
                  >
                    {(CLIENT_HIERARCHIES.find(x => x.id === newCycleClientId)?.locations.find(x => x.id === newCycleLocationId)?.branches || []).map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </SelectMenu>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-900 dark:text-slate-200 mb-1">
                  Cycle Name <span className="text-rose-500 font-bold">*</span>
                </label>
                <input
                  type="text"
                  value={newCycleName}
                  onChange={(e) => setNewCycleName(e.target.value)}
                  className="w-full border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-sky-500"
                  placeholder="e.g. September 2026 Cycle"
                />
                {createCycleErrors.name && (
                  <p className="text-[11px] text-rose-600 mt-1 font-medium">{createCycleErrors.name}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-900 dark:text-slate-200 mb-1">
                    Start Date <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <input
                    type="date"
                    value={newCycleStartDate}
                    onChange={(e) => setNewCycleStartDate(e.target.value)}
                    className="w-full border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-sky-500 font-mono"
                  />
                  {createCycleErrors.startDate && (
                    <p className="text-[11px] text-rose-600 mt-1 font-medium">{createCycleErrors.startDate}</p>
                  )}
                </div>

                <div>
                  <label className="block font-semibold text-slate-900 dark:text-slate-200 mb-1">
                    Cycle Type <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <SelectMenu
                    value={newCycleType}
                    onChange={(e) => setNewCycleType(e.target.value as any)}
                    className="w-full border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-xs focus:ring-2 focus:ring-sky-500 font-medium"
                  >
                    <option value="Monthly">Monthly</option>
                    <option value="Fortnightly">Fortnightly</option>
                    <option value="Weekly">Weekly</option>
                    <option value="Custom">Custom</option>
                  </SelectMenu>
                </div>
              </div>

              {newCycleType === 'Custom' && (
                <div>
                  <label className="block font-semibold text-slate-900 dark:text-slate-200 mb-1">
                    End Date <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <input
                    type="date"
                    value={newCycleCustomEndDate}
                    onChange={(e) => setNewCycleCustomEndDate(e.target.value)}
                    className="w-full border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-sky-500 font-mono"
                  />
                </div>
              )}

              <div className="p-3 bg-sky-50/80 dark:bg-sky-950/50 border border-sky-200 dark:border-sky-800 rounded-lg text-sky-950 dark:text-sky-200">
                <span className="text-[10px] font-bold text-sky-800 dark:text-sky-300 uppercase tracking-wider block mb-0.5">
                  Calculated Period Preview:
                </span>
                <p className="font-mono text-xs font-bold text-sky-900 dark:text-sky-200">{calculatedPeriodPreview}</p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setIsCreateCycleOpen(false)}
                className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateCycleSubmit}
                className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-lg shadow-xs"
              >
                Create Cycle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: RUN MUSTER CONFIRMATION MODAL */}
      {/* ========================================================================= */}
      {isRunMusterOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-md w-full shadow-2xl border border-amber-300 dark:border-amber-700 overflow-hidden animate-in fade-in">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-amber-50 dark:bg-amber-950/40 flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700 flex items-center justify-center shrink-0">
                <RefreshCw className="w-5 h-5 text-amber-700 dark:text-amber-300" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-amber-950 dark:text-amber-200">Run Muster / Force Recalculate</h3>
                <p className="text-[11px] text-amber-800 dark:text-amber-300 mt-0.5">High-impact attendance rule recalculation</p>
              </div>
              <button
                type="button"
                onClick={() => setIsRunMusterOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-3.5 text-xs">
              <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg border border-slate-200 dark:border-slate-700 space-y-1.5 font-mono text-[11px]">
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400 font-sans">Scope:</span>
                  <span className="font-bold text-slate-900 dark:text-white">All Active Employees (142)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400 font-sans">Client:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">2COMS Services</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400 font-sans">Location:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">Hyderabad (Home Branch)</span>
                </div>
              </div>

              <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-xs">
                This will recalculate attendance marks for all active employees against biometric punches, shifts, approved leaves, client holidays, and grace period thresholds.
              </p>

              {isMusterProcessing && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 rounded-lg text-amber-900 dark:text-amber-200 flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-amber-600 dark:text-amber-400 animate-spin shrink-0" />
                  <span className="text-xs font-semibold">Recalculating attendance... Please do not close this screen.</span>
                </div>
              )}

              {musterSuccessMessage && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-lg text-emerald-900 dark:text-emerald-200 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="text-xs font-semibold">{musterSuccessMessage}</span>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-2 text-xs">
              <button
                type="button"
                disabled={isMusterProcessing}
                onClick={() => setIsRunMusterOpen(false)}
                className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isMusterProcessing}
                onClick={handleExecuteMuster}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg shadow-xs flex items-center gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isMusterProcessing ? 'animate-spin' : ''}`} />
                <span>Confirm & Run Muster</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: EXPORT TO EXCEL SUMMARY MODAL */}
      {/* ========================================================================= */}
      {isExportModalOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-300">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-sm font-bold">Export Attendance Report</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsExportModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-3 text-xs">
              <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg border border-slate-200 dark:border-slate-700 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Report Type:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{reportType}</span>
                </div>
                {reportType === 'Daily Muster' ? (
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Target Date:</span>
                    <span className="font-semibold text-sky-800 dark:text-sky-300 font-mono">{reportSingleDate}</span>
                  </div>
                ) : (
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Month:</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{reportMonth}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Department:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{selectedDepartment}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Scope:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{myTeamOnly ? 'My Team Only' : 'All Active Employees'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Client:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{activeClientHierarchy.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 dark:text-slate-400">Location / Branch:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {currentLocationId === 'all' ? 'All Locations' : (activeLocationObj?.name || 'Hyderabad')} · {currentBranchId === 'all' ? 'All Branches' : (activeBranchObj?.name || 'Home Branch')}
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                File will be generated as standard Excel (.xlsx) format containing employee-wise punches, marks, and duration logs.
              </p>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setIsExportModalOpen(false)}
                className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteExportExcel}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-xs flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Excel (.xlsx)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: LOCK CYCLE CONFIRMATION MODAL */}
      {/* ========================================================================= */}
      {cycleToLock && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-md w-full shadow-2xl border border-slate-300 dark:border-slate-700 overflow-hidden animate-in fade-in">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-800 dark:bg-slate-700 text-white flex items-center justify-center shrink-0">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Lock Attendance Cycle?</h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">{cycleToLock.name}</p>
              </div>
            </div>

            <div className="p-5 space-y-3 text-xs">
              <div className="p-3 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 rounded-lg text-amber-900 dark:text-amber-200 text-xs leading-relaxed">
                <strong>Warning:</strong> After locking, attendance records and regularizations for this cycle will be frozen for final payroll sign-off.
              </div>
              <div className="text-slate-600 dark:text-slate-300 space-y-1">
                <p>Cycle Period: <strong className="font-mono text-slate-900 dark:text-white">{cycleToLock.startDate} — {cycleToLock.endDate}</strong></p>
                <p>Enrolled: <strong className="text-slate-900 dark:text-white">{cycleToLock.employeeCount} active records</strong></p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setCycleToLock(null)}
                className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteLockCycle}
                className="px-5 py-2 bg-slate-900 dark:bg-sky-600 hover:bg-slate-800 dark:hover:bg-sky-700 text-white font-semibold rounded-lg shadow-xs flex items-center gap-1.5"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Confirm & Lock Cycle</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: DELETE CYCLE CONFIRMATION MODAL */}
      {/* ========================================================================= */}
      {cycleToDelete && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-md w-full shadow-2xl border border-rose-300 dark:border-rose-800 overflow-hidden animate-in fade-in">
            <div className="p-5 border-b border-rose-100 dark:border-slate-800 bg-rose-50 dark:bg-rose-950/40 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-300 border border-rose-200 dark:border-rose-800 flex items-center justify-center shrink-0">
                <Trash2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-rose-950 dark:text-rose-200">Delete Attendance Cycle?</h3>
                <p className="text-[11px] text-rose-800 dark:text-rose-300">{cycleToDelete.name}</p>
              </div>
            </div>

            <div className="p-5 text-xs text-slate-600 dark:text-slate-300">
              Are you sure you want to delete <strong className="text-slate-900 dark:text-white">{cycleToDelete.name}</strong>? This will permanently remove all calculated rosters and muster periods associated with this cycle.
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setCycleToDelete(null)}
                className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteDeleteCycle}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg shadow-xs"
              >
                Delete Cycle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 6: CANDIDATE ATTENDANCE MAPPING DETAILS MODAL                      */}
      {/* ========================================================================= */}
      {validationModalCandidate && (
        <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-in fade-in">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-sky-50 dark:bg-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Candidate Attendance Mapping & Validation
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {validationModalCandidate.name} ({validationModalCandidate.empCode})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setValidationModalCandidate(null)}
                className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              {/* Policy Rule Reminder */}
              <div className="p-3 bg-sky-50 dark:bg-sky-950/50 border border-sky-200 dark:border-sky-800 rounded-lg text-xs flex items-start gap-2 text-sky-950 dark:text-sky-200">
                <Info className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <strong>Kolkata Policy Rule:</strong> “Employees mapped to Kolkata may mark attendance from any permitted Kolkata office: <strong>RDB</strong>, <strong>Big Bagan</strong>, or <strong>Alipore</strong>.” Punches are accepted across all three permitted offices.
                </div>
              </div>

              {/* Mapping Details Breakdown */}
              <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2.5">
                <div className="flex justify-between items-center py-1 border-b border-slate-200 dark:border-slate-700">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">Candidate Name:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{validationModalCandidate.name}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-200 dark:border-slate-700">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">Mapped City / Work Zone:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{validationModalCandidate.workZone || 'Kolkata'}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-200 dark:border-slate-700">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">Mapped Office Location:</span>
                  <span className="font-bold text-purple-600 dark:text-purple-400">{validationModalCandidate.mappedOffice || 'RDB'}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-200 dark:border-slate-700">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">Punched Office Location:</span>
                  <span className="font-bold text-sky-600 dark:text-sky-400">{validationModalCandidate.punchedLocation}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-slate-200 dark:border-slate-700">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">Attendance Status:</span>
                  <span className={`font-bold ${validationModalCandidate.status === 'Present' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                    {validationModalCandidate.status} ({validationModalCandidate.inTime || '—'})
                  </span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">Validation Result:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{validationModalCandidate.validationResult}</span>
                </div>
              </div>

              {/* Validation Reason */}
              <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block mb-1">Validation Audit Reason</span>
                <p className="text-slate-800 dark:text-slate-200 font-medium">
                  {validationModalCandidate.validationReason}
                </p>
              </div>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setValidationModalCandidate(null)}
                className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 font-medium"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedCandidateValidation(validationModalCandidate);
                  setValidationModalCandidate(null);
                  onShowToast(`Candidate ${validationModalCandidate.name} selected in validation spotlight.`);
                }}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-semibold shadow-xs"
              >
                Inspect in Simulator
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
