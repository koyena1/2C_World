import React, { useState, useMemo, useRef } from 'react';
import { downloadCsv } from '../../utils/download';
import { 
  Search, 
  Upload, 
  Download, 
  Save, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  Settings, 
  X, 
  RotateCcw, 
  FileSpreadsheet, 
  ChevronLeft, 
  ChevronRight, 
  SlidersHorizontal,
  Check,
  Calendar,
  Layers,
  ArrowRight,
  Info
} from 'lucide-react';
import { RosterEmployeeRow, INITIAL_ROSTER_EMPLOYEES, AttendanceClientProfile } from '../../data/mockAttendanceData';

import { SelectMenu } from '../../components/ui/SelectMenu';
interface RosterSubmoduleProps {
  onShowToast: (msg: string) => void;
  onNavigateToSettings?: () => void;
  selectedClient?: AttendanceClientProfile;
}

export const RosterSubmodule: React.FC<RosterSubmoduleProps> = ({ 
  onShowToast,
  onNavigateToSettings,
  selectedClient
}) => {
  // Master roster data
  const [employees, setEmployees] = useState<RosterEmployeeRow[]>(INITIAL_ROSTER_EMPLOYEES);

  // Success alert state (as seen in Screenshot 299)
  const [alertSuccessMessage, setAlertSuccessMessage] = useState<string | null>('Pattern assigned successfully');

  // Filters row (Screenshot 299)
  const [startDate, setStartDate] = useState<string>('2026-09-01');
  const [endDate, setEndDate] = useState<string>('2026-09-30');
  const [candidateFilter, setCandidateFilter] = useState<string>('');

  // Table controls
  const [entriesPerPage, setEntriesPerPage] = useState<number>(10);
  const [tableSearchQuery, setTableSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Modals state
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [isAssignPatternOpen, setIsAssignPatternOpen] = useState<boolean>(false);

  // File import state (Screenshot 300)
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState<boolean>(false);

  // Assign Pattern Modal state (Screenshot 301)
  const [assignShift, setAssignShift] = useState<string>('');
  const [assignPattern, setAssignPattern] = useState<string>('');
  const [assignEffectiveDate, setAssignEffectiveDate] = useState<string>('2026-09-01');
  const [assignModalErrors, setAssignModalErrors] = useState<Record<string, string>>({});

  // Filters inside Assign Pattern Modal (Screenshot 301)
  const [modalEmpCodeFilter, setModalEmpCodeFilter] = useState<string>('');
  const [modalLocationFilter, setModalLocationFilter] = useState<string>('All');
  const [modalWorkModeFilter, setModalWorkModeFilter] = useState<string>('All');
  const [modalAssignmentFilter, setModalAssignmentFilter] = useState<string>('All');
  const [modalRowsPerPage, setModalRowsPerPage] = useState<number>(5);
  const [modalCurrentPage, setModalCurrentPage] = useState<number>(1);
  const [selectedEmpIds, setSelectedEmpIds] = useState<string[]>([]);

  // Shift options list
  const shiftOptions = [
    { code: 'MS', label: 'Morning Shift', full: 'Morning Shift (09:00 AM - 06:00 PM)' },
    { code: 'GS', label: 'General Shift', full: 'General Shift (09:00 AM - 06:00 PM)' },
    { code: 'ES', label: 'Evening Shift', full: 'Evening Shift (02:00 PM - 10:30 PM)' },
    { code: 'NS', label: 'Night Shift', full: 'Night Shift (10:00 PM - 06:30 AM)' },
  ];

  const patternOptions = [
    'Alternate Holiday',
    'Standard 5 Days (Sat & Sun Off)',
    '6 Days Working (Sunday Only Off)',
  ];

  // Calendar days array for September 2026 (01 to 30)
  // September 1, 2026 is Tuesday
  const rosterDays = useMemo(() => {
    const days: { dayNumber: string; weekday: string; isSunday: boolean }[] = [];
    const weekdayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    // Sept 1, 2026 was Tuesday (day index 2)
    for (let d = 1; d <= 30; d++) {
      const dayStr = d < 10 ? `0${d}` : `${d}`;
      const dateObj = new Date(2026, 8, d); // month is 0-indexed: 8 = Sept
      const dayOfWeek = dateObj.getDay();
      days.push({
        dayNumber: dayStr,
        weekday: weekdayNames[dayOfWeek],
        isSunday: dayOfWeek === 0,
      });
    }
    return days;
  }, []);

  // Filter employees for the main Roster Table
  const filteredMainEmployees = useMemo(() => {
    return employees.filter(emp => {
      // Top candidate filter (Name, Code, Email, Contact, Aadhaar)
      if (candidateFilter.trim()) {
        const query = candidateFilter.trim().toLowerCase();
        const matchesCandidate = 
          emp.name.toLowerCase().includes(query) ||
          emp.empCode.toLowerCase().includes(query) ||
          (emp.email && emp.email.toLowerCase().includes(query)) ||
          (emp.contact && emp.contact.toLowerCase().includes(query)) ||
          (emp.aadhaar && emp.aadhaar.toLowerCase().includes(query));
        if (!matchesCandidate) return false;
      }

      // Secondary Table search box
      if (tableSearchQuery.trim()) {
        const query = tableSearchQuery.trim().toLowerCase();
        const matchesSearch = 
          emp.name.toLowerCase().includes(query) ||
          emp.empCode.toLowerCase().includes(query) ||
          emp.department.toLowerCase().includes(query) ||
          emp.location.toLowerCase().includes(query) ||
          (emp.currentShift && emp.currentShift.toLowerCase().includes(query)) ||
          (emp.weekoffPattern && emp.weekoffPattern.toLowerCase().includes(query));
        if (!matchesSearch) return false;
      }

      return true;
    });
  }, [employees, candidateFilter, tableSearchQuery]);

  // Paginated main employees
  const paginatedEmployees = useMemo(() => {
    const start = (currentPage - 1) * entriesPerPage;
    return filteredMainEmployees.slice(start, start + entriesPerPage);
  }, [filteredMainEmployees, currentPage, entriesPerPage]);

  const totalPages = Math.ceil(filteredMainEmployees.length / entriesPerPage) || 1;

  // Handle cell shift change
  const handleShiftChange = (empId: string, dayKey: string, newShift: string) => {
    setEmployees(prev => prev.map(emp => {
      if (emp.id === empId) {
        return {
          ...emp,
          shiftsByDay: {
            ...emp.shiftsByDay,
            [dayKey]: newShift,
          },
        };
      }
      return emp;
    }));
  };

  // Revert/Reset employee shifts
  const handleRevertEmployee = (empId: string) => {
    const defaultShifts: Record<string, string> = {};
    for (let d = 1; d <= 30; d++) {
      const dayStr = d < 10 ? `0${d}` : `${d}`;
      defaultShifts[dayStr] = '-';
    }
    setEmployees(prev => prev.map(emp => {
      if (emp.id === empId) {
        return {
          ...emp,
          currentShift: 'Not Assigned',
          weekoffPattern: 'Not Assigned',
          shiftsByDay: defaultShifts,
        };
      }
      return emp;
    }));
    onShowToast('Employee roster reverted to unassigned state.');
  };

  // Save changes handler
  const handleSaveChanges = () => {
    onShowToast('Roster changes saved successfully.');
  };

  // Export roster handler
  const handleExportRoster = () => {
    // Generate CSV data for download
    let csv = `Employee Code,Employee Name,Department,Location,Shift,Pattern,` + rosterDays.map(d => `${d.dayNumber}-${d.weekday}`).join(',') + `\n`;
    employees.forEach(emp => {
      const daysData = rosterDays.map(d => emp.shiftsByDay[d.dayNumber] || '-').join(',');
      csv += `"${emp.empCode}","${emp.name}","${emp.department}","${emp.location}","${emp.currentShift || '-'}","${emp.weekoffPattern || '-'}","${daysData}"\n`;
    });
    downloadCsv(csv, `Roster_2COMS_${startDate}_to_${endDate}.csv`);
    onShowToast('Roster exported successfully to CSV.');
  };

  // Download template handler
  const handleDownloadTemplate = () => {
    let csv = `Employee Code,Employee Name,Shift Code,01,02,03,04,05,06,07,08,09,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30\n`;
    csv += `DRFL032,Noushad Mansurii,MS,-,-,-,-,-,-,-,-,-,-,-,-,-,MS,MS,MS,MS,MS,WO,MS,MS,MS,MS,MS,MS,WO,MS,MS,MS\n`;
    csv += `DRFL033,Rentala Narender,MS,MS,MS,MS,MS,MS,WO,MS,MS,MS,MS,MS,MS,WO,MS,MS,MS,MS,MS,MS,WO,MS,MS,MS,MS,MS,MS,WO,MS,MS,MS\n`;
    downloadCsv(csv, 'Roster_Import_Template.csv');
    onShowToast('Downloaded Roster_Import_Template.csv');
  };

  // Import file handler
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setImportError(null);
    }
  };

  const handleExecuteImport = () => {
    if (!selectedFile) {
      setImportError('Please choose an Excel file (.xlsx or .xls) before importing.');
      return;
    }
    setIsImporting(true);
    setTimeout(() => {
      setIsImporting(false);
      setIsImportModalOpen(false);
      setSelectedFile(null);
      setAlertSuccessMessage('Roster imported and updated successfully');
      onShowToast('Roster spreadsheet imported successfully.');
    }, 1000);
  };

  // Filter employees inside Assign Pattern Modal (Screenshot 301)
  const filteredModalEmployees = useMemo(() => {
    return employees.filter(emp => {
      // Emp Code search
      if (modalEmpCodeFilter.trim()) {
        const q = modalEmpCodeFilter.trim().toLowerCase();
        if (!emp.empCode.toLowerCase().includes(q) && !emp.name.toLowerCase().includes(q)) {
          return false;
        }
      }
      // Work Location
      if (modalLocationFilter !== 'All') {
        if (emp.location !== modalLocationFilter) return false;
      }
      // Work Mode
      if (modalWorkModeFilter !== 'All') {
        if (emp.workMode !== modalWorkModeFilter.toLowerCase()) return false;
      }
      // Assignment
      if (modalAssignmentFilter !== 'All') {
        const isAssigned = emp.currentShift && emp.currentShift !== 'Not Assigned';
        if (modalAssignmentFilter === 'Assigned' && !isAssigned) return false;
        if (modalAssignmentFilter === 'Unassigned' && isAssigned) return false;
      }
      return true;
    });
  }, [employees, modalEmpCodeFilter, modalLocationFilter, modalWorkModeFilter, modalAssignmentFilter]);

  const paginatedModalEmployees = useMemo(() => {
    const start = (modalCurrentPage - 1) * modalRowsPerPage;
    return filteredModalEmployees.slice(start, start + modalRowsPerPage);
  }, [filteredModalEmployees, modalCurrentPage, modalRowsPerPage]);

  const modalTotalPages = Math.ceil(filteredModalEmployees.length / modalRowsPerPage) || 1;

  // Toggle select all in modal table
  const handleToggleSelectAllModal = () => {
    const pageIds = paginatedModalEmployees.map(e => e.id);
    const allSelected = pageIds.every(id => selectedEmpIds.includes(id));
    if (allSelected) {
      setSelectedEmpIds(prev => prev.filter(id => !pageIds.includes(id)));
    } else {
      setSelectedEmpIds(prev => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  const handleToggleEmpSelect = (id: string) => {
    setSelectedEmpIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Submit Bulk Assign Pattern (Screenshot 301)
  const handleAssignPatternSubmit = () => {
    const errors: Record<string, string> = {};
    if (!assignShift) errors.shift = 'Shift is required.';
    if (!assignPattern) errors.pattern = 'Weekoff Pattern is required.';
    if (!assignEffectiveDate) errors.date = 'Effective Date is required.';
    if (selectedEmpIds.length === 0) errors.employees = 'Please select at least one employee.';

    if (Object.keys(errors).length > 0) {
      setAssignModalErrors(errors);
      return;
    }

    // Determine shift code based on assignShift
    const shiftCode = assignShift.includes('Morning') ? 'MS' : 
                      assignShift.includes('General') ? 'GS' : 
                      assignShift.includes('Evening') ? 'ES' : 'NS';

    const effectiveDayNum = parseInt(assignEffectiveDate.split('-')[2] || '1', 10);

    setEmployees(prev => prev.map(emp => {
      if (selectedEmpIds.includes(emp.id)) {
        const updatedShifts = { ...emp.shiftsByDay };
        for (let d = 1; d <= 30; d++) {
          const dayKey = d < 10 ? `0${d}` : `${d}`;
          if (d >= effectiveDayNum) {
            // Apply weekoff logic based on pattern
            // Sept 2026: Day 6 is Sun, Day 13 is Sun, Day 20 is Sun, Day 27 is Sun
            const isSunday = (d === 6 || d === 13 || d === 20 || d === 27);
            const isAltSaturday = (d === 12 || d === 26); // 2nd & 4th Saturday

            if (assignPattern.includes('Alternate Holiday')) {
              updatedShifts[dayKey] = isSunday ? 'WO' : shiftCode;
            } else if (assignPattern.includes('Standard 5')) {
              const isSaturday = (d === 5 || d === 12 || d === 19 || d === 26);
              updatedShifts[dayKey] = (isSunday || isSaturday) ? 'WO' : shiftCode;
            } else {
              updatedShifts[dayKey] = isSunday ? 'WO' : shiftCode;
            }
          }
        }
        return {
          ...emp,
          currentShift: assignShift,
          weekoffPattern: `WO: ${assignPattern}`,
          shiftsByDay: updatedShifts,
        };
      }
      return emp;
    }));

    setIsAssignPatternOpen(false);
    setSelectedEmpIds([]);
    setAssignModalErrors({});
    setAlertSuccessMessage('Pattern assigned successfully');
    onShowToast(`Pattern assigned successfully to ${selectedEmpIds.length} employee(s).`);
  };

  // Helper for Work Mode badges
  const getWorkModeBadge = (mode?: string) => {
    switch (mode) {
      case 'wfh':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-sky-100 text-sky-800 border border-sky-200">WFH</span>;
      case 'office':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">Office</span>;
      case 'hybrid':
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">Hybrid</span>;
      default:
        return <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700">Office</span>;
    }
  };

  // Cell style by shift code
  const getCellClasses = (shiftCode: string) => {
    switch (shiftCode) {
      case 'MS':
        return 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold';
      case 'GS':
        return 'bg-sky-50 text-sky-800 border-sky-300 font-bold';
      case 'ES':
        return 'bg-indigo-50 text-indigo-800 border-indigo-300 font-bold';
      case 'NS':
        return 'bg-purple-50 text-purple-800 border-purple-300 font-bold';
      case 'WO':
        return 'bg-rose-50 text-rose-700 border-rose-200 font-bold';
      case 'L':
        return 'bg-amber-50 text-amber-800 border-amber-300 font-bold';
      default:
        return 'bg-slate-50 text-slate-400 border-slate-200';
    }
  };

  return (
    <div className="space-y-4">
      {/* ========================================================================= */}
      {/* 1. TOP HEADER & CLIENT CONTEXT BAR (Screenshot 299)                        */}
      {/* ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3.5 sm:px-5 sm:py-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span className="text-slate-400 dark:text-slate-500">Attendance</span>
          <span className="text-slate-300 dark:text-slate-600">/</span>
          <span className="font-bold text-slate-800 dark:text-slate-100 text-sm">Roster</span>
          <span className="hidden md:inline-block text-slate-300 dark:text-slate-600">|</span>
          <span className="hidden md:inline-flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300">
            <span className="text-slate-400 dark:text-slate-500">Client:</span>
            <span className="text-indigo-950 dark:text-indigo-400 font-bold">{selectedClient?.name || '2COMS Services'}</span>
          </span>
        </div>

        <div className="flex items-center gap-2">
          {onNavigateToSettings && (
            <button
              type="button"
              onClick={onNavigateToSettings}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg transition-colors border border-slate-300 dark:border-slate-700"
            >
              <Settings className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span>Client Based Settings</span>
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. SUCCESS ALERT BANNER (Screenshot 299)                                   */}
      {/* ========================================================================= */}
      {alertSuccessMessage && (
        <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 px-4 py-2.5 rounded-lg flex items-center justify-between text-xs font-semibold shadow-2xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{alertSuccessMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setAlertSuccessMessage(null)}
            className="text-emerald-700 dark:text-emerald-400 hover:text-emerald-900 dark:hover:text-emerald-200 p-1 rounded hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. ROSTER MANAGEMENT CARD CONTAINER (Screenshot 299)                       */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Card Header & Main Action Buttons */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">Roster Management</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
              Client: <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedClient?.name || '2COMS Services'}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Assign Pattern Button (Screenshot 301 trigger) */}
            <button
              type="button"
              onClick={() => {
                setSelectedEmpIds([]);
                setAssignModalErrors({});
                setIsAssignPatternOpen(true);
              }}
              className="px-3.5 py-2 bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Assign Pattern</span>
            </button>

            {/* Export Button */}
            <button
              type="button"
              onClick={handleExportRoster}
              className="px-3.5 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <Download className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span>Export</span>
            </button>

            {/* Import Button (Screenshot 300 trigger) */}
            <button
              type="button"
              onClick={() => {
                setSelectedFile(null);
                setImportError(null);
                setIsImportModalOpen(true);
              }}
              className="px-3.5 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <Upload className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span>Import</span>
            </button>

            {/* Save Changes Button */}
            <button
              type="button"
              onClick={handleSaveChanges}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Changes</span>
            </button>
          </div>
        </div>

        {/* Filter Row: Start Date | End Date | Search Candidate | Refresh (Screenshot 299) */}
        <div className="p-4 sm:p-5 bg-slate-50/60 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end">
            {/* Start Date */}
            <div className="lg:col-span-3">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Start Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-medium focus:ring-2 focus:ring-indigo-500 shadow-2xs"
                />
              </div>
            </div>

            {/* End Date */}
            <div className="lg:col-span-3">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                End Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-medium focus:ring-2 focus:ring-indigo-500 shadow-2xs"
                />
              </div>
            </div>

            {/* Search Candidate */}
            <div className="lg:col-span-5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Search Candidate
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Name, Code, Email, Contact, Aadhaar"
                  value={candidateFilter}
                  onChange={(e) => setCandidateFilter(e.target.value)}
                  className="w-full border border-slate-300 dark:border-slate-700 rounded-lg pl-3 pr-9 py-2 text-xs bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 shadow-2xs placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
                {candidateFilter && (
                  <button
                    type="button"
                    onClick={() => setCandidateFilter('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Refresh Button */}
            <div className="lg:col-span-1">
              <button
                type="button"
                onClick={() => {
                  setCandidateFilter('');
                  setTableSearchQuery('');
                  onShowToast('Roster data refreshed.');
                }}
                className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 shadow-2xs transition-colors"
                title="Refresh Roster Grid"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span className="sm:hidden lg:hidden">Refresh</span>
              </button>
            </div>
          </div>
        </div>

        {/* Table Top Controls: Show entries dropdown & Table Search Box (Screenshot 299) */}
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900">
          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400 font-medium">
            <span>Show</span>
            <SelectMenu
              value={entriesPerPage}
              onChange={(e) => {
                setEntriesPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="border border-slate-300 dark:border-slate-700 rounded-md px-2 py-1 text-xs bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold focus:ring-1 focus:ring-indigo-500"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </SelectMenu>
            <span>entries</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">Search:</span>
            <input
              type="text"
              value={tableSearchQuery}
              onChange={(e) => {
                setTableSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="border border-slate-300 dark:border-slate-700 rounded-md px-2.5 py-1 text-xs bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-1 focus:ring-indigo-500 w-44 sm:w-56"
            />
          </div>
        </div>

        {/* ======================================================================= */}
        {/* ROSTER MATRIX GRID WITH STICKY EMPLOYEE & SHIFT COLUMNS (Screenshot 299)  */}
        {/* ======================================================================= */}
        <div className="overflow-x-auto relative max-h-[620px] border-b border-slate-200 dark:border-slate-800">
          <table className="w-full text-left border-collapse text-xs">
            {/* Header row with sticky positioning */}
            <thead className="sticky top-0 z-20 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-b border-slate-300 dark:border-slate-700 font-semibold shadow-2xs">
              <tr>
                {/* Column 1: Employee (Sticky Left) */}
                <th className="sticky left-0 z-30 bg-slate-100 dark:bg-slate-800 border-r border-slate-300 dark:border-slate-700 px-4 py-2.5 min-w-[210px] w-[210px] shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)]">
                  Employee
                </th>

                {/* Column 2: Current Shift (Sticky Left behind Employee) */}
                <th className="sticky left-[210px] z-30 bg-slate-100 dark:bg-slate-800 border-r border-slate-300 dark:border-slate-700 px-3 py-2.5 min-w-[190px] w-[190px] shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)]">
                  Current Shift
                </th>

                {/* Date Columns (01 to 30 with Weekday below) */}
                {rosterDays.map((day) => (
                  <th 
                    key={day.dayNumber}
                    className={`border-r border-slate-200 dark:border-slate-700 px-1 py-1.5 text-center min-w-[44px] w-[44px] ${
                      day.isSunday ? 'bg-rose-50/70 dark:bg-rose-950/40 text-rose-900 dark:text-rose-300' : 'bg-slate-100 dark:bg-slate-800'
                    }`}
                  >
                    <div className="font-bold text-[12px] leading-tight text-slate-800 dark:text-slate-200">
                      {day.dayNumber}
                    </div>
                    <div className={`text-[10px] font-medium leading-tight ${day.isSunday ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-slate-500 dark:text-slate-400'}`}>
                      {day.weekday}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900">
              {paginatedEmployees.length === 0 ? (
                <tr>
                  <td colSpan={rosterDays.length + 2} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                    <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                    <p className="font-semibold text-slate-700 dark:text-slate-300">No employees match the search filter</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Try clearing or adjusting the search candidate input</p>
                  </td>
                </tr>
              ) : (
                paginatedEmployees.map((emp) => {
                  const isAssigned = emp.currentShift && emp.currentShift !== 'Not Assigned';
                  return (
                    <tr key={emp.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/70 transition-colors">
                      {/* 1. Employee Column */}
                      <td className="sticky left-0 z-10 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border-r border-slate-300 dark:border-slate-700 px-4 py-2.5 min-w-[210px] w-[210px] shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)]">
                        <div className="flex items-center justify-between">
                          <div className="min-w-0 pr-1">
                            <div className="font-bold text-slate-900 dark:text-white text-xs truncate" title={emp.name}>
                              {emp.name}
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="font-mono text-[11px] font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                                {emp.empCode}
                              </span>
                              {emp.location && (
                                <span className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-[80px]">
                                  {emp.location}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Revert / History Icon Button */}
                          <button
                            type="button"
                            onClick={() => handleRevertEmployee(emp.id)}
                            className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="Reset / Revert this employee's schedule"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                      {/* 2. Current Shift Column */}
                      <td className="sticky left-[210px] z-10 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border-r border-slate-300 dark:border-slate-700 px-3 py-2.5 min-w-[190px] w-[190px] shadow-[2px_0_4px_-1px_rgba(0,0,0,0.06)]">
                        <div>
                          {isAssigned ? (
                            <div className="space-y-1">
                              <span className="inline-block px-2 py-0.5 text-[11px] font-bold rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                                {emp.currentShift}
                              </span>
                              {emp.weekoffPattern && (
                                <div className="text-[10px] font-semibold text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-800 truncate" title={emp.weekoffPattern}>
                                  {emp.weekoffPattern}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="space-y-1">
                              <span className="inline-block px-2 py-0.5 text-[10px] font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
                                Not Assigned
                              </span>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* 3. Daily Schedule Cells */}
                      {rosterDays.map((day) => {
                        const shiftVal = emp.shiftsByDay[day.dayNumber] || '-';
                        return (
                          <td 
                            key={day.dayNumber}
                            className={`border-r border-slate-200 dark:border-slate-700 px-0.5 py-1 text-center align-middle ${
                              day.isSunday ? 'bg-rose-50/20 dark:bg-rose-950/20' : ''
                            }`}
                          >
                            <SelectMenu
                              value={shiftVal}
                              onChange={(e) => handleShiftChange(emp.id, day.dayNumber, e.target.value)}
                              className={`w-full text-center text-[10px] py-1 px-0.5 rounded border font-semibold cursor-pointer focus:ring-1 focus:ring-indigo-500 transition-colors ${getCellClasses(shiftVal)}`}
                            >
                              <option value="-">-</option>
                              <option value="MS">MS</option>
                              <option value="GS">GS</option>
                              <option value="ES">ES</option>
                              <option value="NS">NS</option>
                              <option value="WO">WO</option>
                              <option value="L">L</option>
                            </SelectMenu>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Bottom: Entries Count & Pagination (Screenshot 299) */}
        <div className="p-4 bg-white dark:bg-slate-900 flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
          <div>
            Showing {filteredMainEmployees.length === 0 ? 0 : (currentPage - 1) * entriesPerPage + 1} to{' '}
            {Math.min(currentPage * entriesPerPage, filteredMainEmployees.length)} of {filteredMainEmployees.length} entries
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              className="px-2.5 py-1 border border-slate-300 dark:border-slate-700 rounded text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed font-medium"
            >
              Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button
                key={p}
                type="button"
                onClick={() => setCurrentPage(p)}
                className={`px-3 py-1 border rounded font-semibold text-xs transition-colors ${
                  currentPage === p
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                {p}
              </button>
            ))}
            <button
              type="button"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              className="px-2.5 py-1 border border-slate-300 dark:border-slate-700 rounded text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed font-medium"
            >
              Next
            </button>
          </div>
        </div>

        {/* Roster Legend */}
        <div className="p-3 bg-slate-50 dark:bg-slate-850 dark:bg-slate-800/60 text-[11px] text-slate-600 dark:text-slate-300 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-bold text-slate-800 dark:text-slate-200">Legend:</span>
            <span className="inline-flex items-center gap-1.5">
              <span className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-300 dark:border-emerald-800 text-[10px]">MS</span>
              <span>Morning Shift</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="px-1.5 py-0.5 rounded bg-sky-100 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 font-bold border border-sky-300 dark:border-sky-800 text-[10px]">GS</span>
              <span>General Shift</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 font-bold border border-rose-300 dark:border-rose-800 text-[10px]">WO</span>
              <span>Week Off</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-bold border border-amber-300 dark:border-amber-800 text-[10px]">L</span>
              <span>Leave</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold border border-slate-300 dark:border-slate-700 text-[10px]">-</span>
              <span>Not Assigned</span>
            </span>
          </div>

          <div className="text-slate-400 dark:text-slate-500 font-medium text-[10px]">
            Scroll horizontally to review full month days
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. MODAL: IMPORT ROSTER (Screenshot 300)                                   */}
      {/* ========================================================================= */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Import Roster</h3>
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 bg-white dark:bg-slate-900">
              {/* Select Excel File Field */}
              <div>
                <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-2">
                  Select Excel File
                </label>
                <div className="flex items-center gap-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls,.csv"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 transition-colors shadow-2xs"
                  >
                    Choose File
                  </button>
                  <span className="text-xs text-slate-600 dark:text-slate-400 truncate max-w-[280px]">
                    {selectedFile ? (
                      <span className="font-semibold text-indigo-700 dark:text-indigo-400 flex items-center gap-1">
                        <FileSpreadsheet className="w-3.5 h-3.5" />
                        {selectedFile.name}
                      </span>
                    ) : (
                      'No file chosen'
                    )}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
                  Upload an Excel file with roster data
                </p>

                {importError && (
                  <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold mt-2 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>{importError}</span>
                  </p>
                )}
              </div>

              {/* Information Blue Box (Screenshot 300) */}
              <div className="bg-sky-50 dark:bg-slate-800/80 border border-sky-200 dark:border-slate-700 rounded-xl p-4 flex items-start gap-3">
                <Info className="w-5 h-5 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs text-sky-900 dark:text-sky-200 font-medium">
                    Download the template first to see the required format.
                  </p>
                  <div className="mt-2.5">
                    <button
                      type="button"
                      onClick={handleDownloadTemplate}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-900 text-sky-700 dark:text-sky-300 border border-sky-300 dark:border-sky-800 rounded-lg text-xs font-bold hover:bg-sky-50 dark:hover:bg-slate-800 transition-colors shadow-2xs"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Template</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-850 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="px-4 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isImporting}
                onClick={handleExecuteImport}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
              >
                {isImporting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Importing...</span>
                  </>
                ) : (
                  <span>Import</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. MODAL: ASSIGN PATTERN (Screenshot 301)                                 */}
      {/* ========================================================================= */}
      {isAssignPatternOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 shrink-0">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Assign Pattern</h3>
              <button
                type="button"
                onClick={() => setIsAssignPatternOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Modal Content */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1 bg-white dark:bg-slate-900">
              {/* Warning Alert Banner (Screenshot 301) */}
              <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 rounded-lg p-3 text-xs text-amber-900 dark:text-amber-200 font-medium flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <p>
                  Assigning a new pattern will overwrite existing shifts and week offs for the selected employees from the effective date onwards.
                </p>
              </div>

              {/* Assignment Form Fields: Shift | Weekoff Pattern | Effective Date */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 bg-slate-50/70 dark:bg-slate-800/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700">
                {/* Shift Dropdown */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Shift <span className="text-rose-500">*</span>
                  </label>
                  <SelectMenu
                    value={assignShift}
                    onChange={(e) => {
                      setAssignShift(e.target.value);
                      if (assignModalErrors.shift) {
                        setAssignModalErrors(prev => ({ ...prev, shift: '' }));
                      }
                    }}
                    className={`w-full border rounded-lg px-3 py-2 text-xs bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 font-medium ${
                      assignModalErrors.shift ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300 dark:border-slate-700'
                    }`}
                  >
                    <option value="">Select Shift</option>
                    {shiftOptions.map(s => (
                      <option key={s.code} value={s.label}>{s.full}</option>
                    ))}
                  </SelectMenu>
                  {assignModalErrors.shift && (
                    <span className="text-[11px] text-rose-600 dark:text-rose-400 font-medium mt-1 block">
                      {assignModalErrors.shift}
                    </span>
                  )}
                </div>

                {/* Weekoff Pattern Dropdown */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Weekoff Pattern <span className="text-rose-500">*</span>
                  </label>
                  <SelectMenu
                    value={assignPattern}
                    onChange={(e) => {
                      setAssignPattern(e.target.value);
                      if (assignModalErrors.pattern) {
                        setAssignModalErrors(prev => ({ ...prev, pattern: '' }));
                      }
                    }}
                    className={`w-full border rounded-lg px-3 py-2 text-xs bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 font-medium ${
                      assignModalErrors.pattern ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300 dark:border-slate-700'
                    }`}
                  >
                    <option value="">Select Weekoff Pattern</option>
                    {patternOptions.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </SelectMenu>
                  {assignModalErrors.pattern && (
                    <span className="text-[11px] text-rose-600 dark:text-rose-400 font-medium mt-1 block">
                      {assignModalErrors.pattern}
                    </span>
                  )}
                </div>

                {/* Effective Date Picker */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 dark:text-slate-200 mb-1">
                    Effective Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={assignEffectiveDate}
                    onChange={(e) => {
                      setAssignEffectiveDate(e.target.value);
                      if (assignModalErrors.date) {
                        setAssignModalErrors(prev => ({ ...prev, date: '' }));
                      }
                    }}
                    className={`w-full border rounded-lg px-3 py-2 text-xs bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500 font-medium ${
                      assignModalErrors.date ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300 dark:border-slate-700'
                    }`}
                  />
                  {assignModalErrors.date && (
                    <span className="text-[11px] text-rose-600 dark:text-rose-400 font-medium mt-1 block">
                      {assignModalErrors.date}
                    </span>
                  )}
                </div>
              </div>

              {/* Select Employees Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Select Employees
                  </h4>
                  {assignModalErrors.employees && (
                    <span className="text-xs text-rose-600 dark:text-rose-400 font-bold">
                      {assignModalErrors.employees}
                    </span>
                  )}
                </div>

                {/* Filters Row: Emp Code | Work Location | Work Mode | Assignment | Search (Screenshot 301) */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 bg-slate-50 dark:bg-slate-800/70 p-3 rounded-lg border border-slate-200 dark:border-slate-700 text-xs">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Emp Code</label>
                    <input
                      type="text"
                      placeholder="Search Emp Code"
                      value={modalEmpCodeFilter}
                      onChange={(e) => {
                        setModalEmpCodeFilter(e.target.value);
                        setModalCurrentPage(1);
                      }}
                      className="w-full border border-slate-300 dark:border-slate-700 rounded px-2 py-1.5 text-xs bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Work Location</label>
                    <SelectMenu
                      value={modalLocationFilter}
                      onChange={(e) => {
                        setModalLocationFilter(e.target.value);
                        setModalCurrentPage(1);
                      }}
                      className="w-full border border-slate-300 dark:border-slate-700 rounded px-2 py-1.5 text-xs bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                    >
                      <option value="All">All Locations</option>
                      <option value="Hyderabad">Hyderabad</option>
                      <option value="Kolkata">Kolkata</option>
                      <option value="Bangalore">Bangalore</option>
                      <option value="Mumbai">Mumbai</option>
                    </SelectMenu>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Work Mode</label>
                    <SelectMenu
                      value={modalWorkModeFilter}
                      onChange={(e) => {
                        setModalWorkModeFilter(e.target.value);
                        setModalCurrentPage(1);
                      }}
                      className="w-full border border-slate-300 dark:border-slate-700 rounded px-2 py-1.5 text-xs bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                    >
                      <option value="All">All Modes</option>
                      <option value="wfh">WFH</option>
                      <option value="office">Office</option>
                      <option value="hybrid">Hybrid</option>
                    </SelectMenu>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Assignment</label>
                    <SelectMenu
                      value={modalAssignmentFilter}
                      onChange={(e) => {
                        setModalAssignmentFilter(e.target.value);
                        setModalCurrentPage(1);
                      }}
                      className="w-full border border-slate-300 dark:border-slate-700 rounded px-2 py-1.5 text-xs bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100"
                    >
                      <option value="All">All</option>
                      <option value="Assigned">Assigned</option>
                      <option value="Unassigned">Unassigned</option>
                    </SelectMenu>
                  </div>

                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={() => setModalCurrentPage(1)}
                      className="w-full py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                    >
                      <Search className="w-3.5 h-3.5" />
                      <span>Search</span>
                    </button>
                  </div>
                </div>

                {/* Table Control Header */}
                <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 px-1">
                  <div className="flex items-center gap-1.5">
                    <span>Rows per page:</span>
                    <SelectMenu
                      value={modalRowsPerPage}
                      onChange={(e) => {
                        setModalRowsPerPage(Number(e.target.value));
                        setModalCurrentPage(1);
                      }}
                      className="border border-slate-300 dark:border-slate-700 rounded px-1.5 py-0.5 text-xs bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold"
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                    </SelectMenu>
                  </div>
                  <div>
                    Showing {filteredModalEmployees.length === 0 ? 0 : (modalCurrentPage - 1) * modalRowsPerPage + 1} to{' '}
                    {Math.min(modalCurrentPage * modalRowsPerPage, filteredModalEmployees.length)} of {filteredModalEmployees.length} employees
                  </div>
                </div>

                {/* Employees Selection Table (Screenshot 301) */}
                <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-x-auto bg-white dark:bg-slate-900">
                  <table className="cc-table-stack w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold">
                      <tr>
                        <th className="p-3 w-10 text-center">
                          <input
                            type="checkbox"
                            checked={
                              paginatedModalEmployees.length > 0 &&
                              paginatedModalEmployees.every(e => selectedEmpIds.includes(e.id))
                            }
                            onChange={handleToggleSelectAllModal}
                            className="rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 bg-white dark:bg-slate-700"
                          />
                        </th>
                        <th className="px-3 py-2.5">Emp Code</th>
                        <th className="px-3 py-2.5">Name</th>
                        <th className="px-3 py-2.5">Location</th>
                        <th className="px-3 py-2.5">Designation</th>
                        <th className="px-3 py-2.5">Department</th>
                        <th className="px-3 py-2.5">Work Mode</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900">
                      {paginatedModalEmployees.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-6 text-center text-slate-400 dark:text-slate-500">
                            No employees found matching filter criteria
                          </td>
                        </tr>
                      ) : (
                        paginatedModalEmployees.map((emp) => {
                          const isChecked = selectedEmpIds.includes(emp.id);
                          return (
                            <tr 
                              key={emp.id} 
                              className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/70 cursor-pointer transition-colors ${isChecked ? 'bg-indigo-50/40 dark:bg-indigo-950/40' : ''}`}
                              onClick={() => handleToggleEmpSelect(emp.id)}
                            >
                              <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => handleToggleEmpSelect(emp.id)}
                                  className="rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 bg-white dark:bg-slate-700"
                                />
                              </td>
                              <td className="px-3 py-2 font-mono font-semibold text-slate-700 dark:text-slate-300">
                                {emp.empCode}
                              </td>
                              <td className="px-3 py-2 font-bold text-slate-900 dark:text-white">
                                {emp.name}
                              </td>
                              <td className="px-3 py-2 text-slate-600 dark:text-slate-300">
                                {emp.location || 'Not Specified'}
                              </td>
                              <td className="px-3 py-2 text-slate-600 dark:text-slate-300">
                                {emp.designation || '-'}
                              </td>
                              <td className="px-3 py-2 text-slate-600 dark:text-slate-300">
                                {emp.department}
                              </td>
                              <td className="px-3 py-2">
                                {getWorkModeBadge(emp.workMode)}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Modal Pagination */}
                {modalTotalPages > 1 && (
                  <div className="flex items-center justify-end gap-1 text-xs pt-1">
                    <button
                      type="button"
                      disabled={modalCurrentPage === 1}
                      onClick={() => setModalCurrentPage(p => Math.max(1, p - 1))}
                      className="px-2 py-0.5 border border-slate-300 dark:border-slate-700 rounded text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40"
                    >
                      Prev
                    </button>
                    <span className="px-2 font-semibold text-slate-700 dark:text-slate-300">
                      Page {modalCurrentPage} of {modalTotalPages}
                    </span>
                    <button
                      type="button"
                      disabled={modalCurrentPage === modalTotalPages}
                      onClick={() => setModalCurrentPage(p => Math.min(modalTotalPages, p + 1))}
                      className="px-2 py-0.5 border border-slate-300 dark:border-slate-700 rounded text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40"
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer (Screenshot 301) */}
            <div className="px-6 py-4 bg-slate-50 dark:bg-slate-850 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
              <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Selected: <span className="font-bold text-indigo-700 dark:text-indigo-400">{selectedEmpIds.length}</span> employees
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAssignPatternOpen(false)}
                  className="px-4 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAssignPatternSubmit}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <span>Assign</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
