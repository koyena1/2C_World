import React, { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  Send,
  Layers,
  Sliders, 
  Plus, 
  ChevronRight,
  BookOpen
} from 'lucide-react';
import { 
  HolidayCalendar, 
  HolidayMasterItem, 
  HolidayEmployeeRecord,
  INITIAL_HOLIDAY_CALENDARS,
  INITIAL_HOLIDAYS_MASTER,
  INITIAL_HOLIDAY_EMPLOYEES
} from '../../data/mockHolidayMasterData';
import { HolidayMasterScreen } from './HolidayMasterScreen';
import { PublishCalendarScreen } from './PublishCalendarScreen';
import { CalendarDetailsScreen } from './CalendarDetailsScreen';
import { CreateHolidayModal } from './CreateHolidayModal';
import { CreateCalendarModal } from './CreateCalendarModal';
import { AssignEmployeesModal } from './AssignEmployeesModal';
import { useTheme } from '../../hooks/useTheme';
import { useToast } from '../../hooks/useToast';
import { PageHeader } from '../../components/page/PageHeader';
import { CategoryTabs } from '../../components/page/CategoryTabs';
import { Toast } from '../../components/ui/Toast';

export const HolidayMastersModule: React.FC = () => {
  const { isDark } = useTheme();
  // Master state
  const [calendars, setCalendars] = useState<HolidayCalendar[]>(INITIAL_HOLIDAY_CALENDARS);
  const [holidays, setHolidays] = useState<HolidayMasterItem[]>(INITIAL_HOLIDAYS_MASTER);
  const [employees, setEmployees] = useState<HolidayEmployeeRecord[]>(INITIAL_HOLIDAY_EMPLOYEES);

  // Navigation: 'master' | 'publish'
  const [activeTab, setActiveTab] = useState<'master' | 'publish'>('master');
  const [activeCalendarId, setActiveCalendarId] = useState<string>('cal-kolkata-2026');

  // Screen 4 Details Mode
  const [selectedCalendarForDetails, setSelectedCalendarForDetails] = useState<HolidayCalendar | null>(null);

  // Modals state
  const [isCreateHolidayOpen, setIsCreateHolidayOpen] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState<HolidayMasterItem | null>(null);
  const [isCreateCalendarOpen, setIsCreateCalendarOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

  // Toast feedback
  const { message: toastMessage, showToast } = useToast();

  // Active Calendar Object
  const currentCalendar = calendars.find(c => c.id === activeCalendarId) || calendars[0];

  // =========================================================================
  // HANDLERS: HOLIDAYS
  // =========================================================================
  const handleSaveHoliday = (holidayData: Partial<HolidayMasterItem>) => {
    if (editingHoliday) {
      setHolidays(prev => prev.map(h => h.id === editingHoliday.id ? { ...h, ...holidayData } as HolidayMasterItem : h));
      showToast(`Holiday "${holidayData.name}" updated successfully.`);
    } else {
      const newHol = holidayData as HolidayMasterItem;
      setHolidays(prev => [newHol, ...prev]);
      // Update calendar createdHolidayCount
      setCalendars(prev => prev.map(cal => {
        if (cal.id === newHol.calendarId) {
          return { ...cal, createdHolidayCount: cal.createdHolidayCount + 1, lastUpdated: 'Just now' };
        }
        return cal;
      }));
      showToast(`Holiday "${holidayData.name}" added to calendar.`);
    }
    setEditingHoliday(null);
  };

  const handleEditHoliday = (hol: HolidayMasterItem) => {
    setEditingHoliday(hol);
    setIsCreateHolidayOpen(true);
  };

  const handleDuplicateHoliday = (hol: HolidayMasterItem) => {
    const duplicated: HolidayMasterItem = {
      ...hol,
      id: `hol-${Date.now()}`,
      name: `${hol.name} (Copy)`,
    };
    setHolidays(prev => [duplicated, ...prev]);
    showToast(`Duplicated "${hol.name}".`);
  };

  const handleDeleteHoliday = (holidayId: string) => {
    const target = holidays.find(h => h.id === holidayId);
    setHolidays(prev => prev.filter(h => h.id !== holidayId));
    if (target) {
      setCalendars(prev => prev.map(cal => {
        if (cal.id === target.calendarId) {
          return { ...cal, createdHolidayCount: Math.max(0, cal.createdHolidayCount - 1), lastUpdated: 'Just now' };
        }
        return cal;
      }));
      showToast(`Deleted "${target.name}".`);
    }
  };

  // =========================================================================
  // HANDLERS: CALENDARS
  // =========================================================================
  const handleCreateCalendar = (calData: Partial<HolidayCalendar>) => {
    const newCal = calData as HolidayCalendar;
    setCalendars(prev => [newCal, ...prev]);
    setActiveCalendarId(newCal.id);
    showToast(`Created new Holiday Calendar "${newCal.name}".`);
  };

  const handleDuplicateCalendar = (cal: HolidayCalendar) => {
    const newId = `cal-${Date.now()}`;
    const duplicatedCal: HolidayCalendar = {
      ...cal,
      id: newId,
      name: `${cal.name} (Copy)`,
      status: 'Draft',
      assignedEmployeesCount: 0,
      intakeAnalytics: { selected: 0, notSelected: 0, rate: 0 },
      lastUpdated: 'Just now',
    };
    setCalendars(prev => [duplicatedCal, ...prev]);

    // Also copy holidays
    const calHols = holidays.filter(h => h.calendarId === cal.id);
    const copiedHols = calHols.map(h => ({
      ...h,
      id: `hol-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      calendarId: newId,
    }));
    setHolidays(prev => [...copiedHols, ...prev]);
    setActiveCalendarId(newId);
    showToast(`Duplicated calendar "${cal.name}" with ${copiedHols.length} holidays.`);
  };

  const handleTogglePublish = (calendarId: string) => {
    setCalendars(prev => prev.map(cal => {
      if (cal.id === calendarId) {
        const nextStatus = cal.status === 'Published' ? 'Draft' : 'Published';
        showToast(
          nextStatus === 'Published'
            ? `Calendar "${cal.name}" published! Now visible to employees.`
            : `Calendar "${cal.name}" unpublished.`
        );
        return { ...cal, status: nextStatus, lastUpdated: 'Just now' };
      }
      return cal;
    }));

    if (selectedCalendarForDetails && selectedCalendarForDetails.id === calendarId) {
      setSelectedCalendarForDetails(prev => prev ? {
        ...prev,
        status: prev.status === 'Published' ? 'Draft' : 'Published',
        lastUpdated: 'Just now',
      } : null);
    }
  };

  // =========================================================================
  // HANDLERS: EMPLOYEE ASSIGNMENTS
  // =========================================================================
  const handleAssignEmployeesSubmit = (employeeIds: string[]) => {
    const target = selectedCalendarForDetails || currentCalendar;

    setEmployees(prev => prev.map(emp => {
      if (employeeIds.includes(emp.employeeId)) {
        return {
          ...emp,
          calendarId: target.id,
          calendarName: target.name,
          selectionStatus: emp.selectionStatus === 'Not Linked' ? 'Pending' : emp.selectionStatus,
        };
      }
      return emp;
    }));

    // Update calendar assigned employees count
    setCalendars(prev => prev.map(cal => {
      if (cal.id === target.id) {
        const newCount = cal.assignedEmployeesCount + employeeIds.length;
        return {
          ...cal,
          assignedEmployeesCount: newCount,
          lastUpdated: 'Just now',
        };
      }
      return cal;
    }));

    if (selectedCalendarForDetails && selectedCalendarForDetails.id === target.id) {
      setSelectedCalendarForDetails(prev => prev ? {
        ...prev,
        assignedEmployeesCount: prev.assignedEmployeesCount + employeeIds.length,
        lastUpdated: 'Just now',
      } : null);
    }

    showToast(`Assigned ${employeeIds.length} employees to ${target.name}.`);
  };

  return (
    <div className={`flex-1 min-h-screen flex flex-col transition-colors duration-150 text-slate-900 dark:text-slate-100`}>
      {/* Toast Notification */}
      <Toast message={toastMessage} variant="solid" />

      <PageHeader
        icon={CalendarIcon}
        title="Holiday Masters"
        subtitle="Manage holiday calendars and publish them to employees"
      />

      {/* Main Content Area */}
      <div className="cc-container cc-stack py-5">
        {!selectedCalendarForDetails && (
          <CategoryTabs
            value={activeTab}
            onChange={(v) => setActiveTab(v as typeof activeTab)}
            tabs={[
              { value: 'master', label: 'Holiday Master' },
              { value: 'publish', label: 'Publish Holiday Calendar' },
            ]}
          />
        )}
        {/* If viewing specific Calendar Details (Screen 4) */}
        {selectedCalendarForDetails ? (
          <CalendarDetailsScreen
            calendar={selectedCalendarForDetails}
            holidays={holidays}
            employees={employees}
            onBack={() => setSelectedCalendarForDetails(null)}
            onOpenAssignModal={() => setIsAssignModalOpen(true)}
            onOpenCreateHoliday={() => {
              setEditingHoliday(null);
              setIsCreateHolidayOpen(true);
            }}
            onEditHoliday={handleEditHoliday}
            onDuplicateHoliday={handleDuplicateHoliday}
            onDeleteHoliday={handleDeleteHoliday}
            onTogglePublish={handleTogglePublish}
            onShowToast={showToast}
          />
        ) : activeTab === 'master' ? (
          /* Screen 1: Holiday Master */
          <HolidayMasterScreen
            calendars={calendars}
            activeCalendarId={activeCalendarId}
            onSelectCalendar={setActiveCalendarId}
            holidays={holidays}
            onOpenCreateCalendar={() => setIsCreateCalendarOpen(true)}
            onOpenCreateHoliday={() => {
              setEditingHoliday(null);
              setIsCreateHolidayOpen(true);
            }}
            onEditHoliday={handleEditHoliday}
            onDuplicateHoliday={handleDuplicateHoliday}
            onDeleteHoliday={handleDeleteHoliday}
            onDuplicateCalendar={handleDuplicateCalendar}
            onShowToast={showToast}
          />
        ) : (
          /* Screen 3: Publish Holiday Calendar */
          <PublishCalendarScreen
            calendars={calendars}
            holidays={holidays}
            onOpenDetails={(cal) => setSelectedCalendarForDetails(cal)}
            onTogglePublish={handleTogglePublish}
            onOpenCreateCalendar={() => setIsCreateCalendarOpen(true)}
          />
        )}
      </div>

      {/* Screen 2: Create New Holiday Modal */}
      <CreateHolidayModal
        isOpen={isCreateHolidayOpen}
        onClose={() => {
          setIsCreateHolidayOpen(false);
          setEditingHoliday(null);
        }}
        onSubmit={handleSaveHoliday}
        calendars={calendars}
        activeCalendarId={selectedCalendarForDetails?.id || activeCalendarId}
        initialHoliday={editingHoliday}
      />

      {/* Create Calendar Modal */}
      <CreateCalendarModal
        isOpen={isCreateCalendarOpen}
        onClose={() => setIsCreateCalendarOpen(false)}
        onSubmit={handleCreateCalendar}
      />

      {/* Screen 5: Assign Employees Modal */}
      <AssignEmployeesModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        targetCalendar={selectedCalendarForDetails || currentCalendar}
        allEmployees={employees}
        onAssignSubmit={handleAssignEmployeesSubmit}
      />
    </div>
  );
};
