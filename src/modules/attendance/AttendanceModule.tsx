import React, { useState } from 'react';
import { CalendarClock } from 'lucide-react';
import { PageHeader } from '../../components/page/PageHeader';
import { PageBody } from '../../components/page/PageBody';
import { CategoryTabs } from '../../components/page/CategoryTabs';
import { Chip } from '../dashboard/command-center/shared';
import { Toast } from '../../components/ui/Toast';
import { useToast } from '../../hooks/useToast';
import { AttendanceContextBar } from './AttendanceContextBar';
import { SettingsSubmodule } from './SettingsSubmodule';
import { ShiftsSubmodule } from './ShiftsSubmodule';
import { WeekoffSubmodule } from './WeekoffSubmodule';
import { RosterSubmodule } from './RosterSubmodule';
import { CyclesMusterSubmodule } from './CyclesMusterSubmodule';
import { GeoFenceSubmodule } from './GeoFenceSubmodule';
import { OvertimeSubmodule } from './OvertimeSubmodule';
import { RegularizationSubmodule } from './RegularizationSubmodule';
import { NotificationsSubmodule } from './NotificationsSubmodule';
import { useFeatureAccess } from '../../context/RoleContext';
import { 
  AttendanceClientProfile, 
  ATTENDANCE_CLIENTS,
  CLIENT_HIERARCHIES
} from '../../data/mockAttendanceData';

export const AttendanceModule: React.FC = () => {
  // Navigation tabs: Settings | Shifts | Weekoff Patterns | Roster | Cycles | Geo Fence | Overtime Config
  const [activeTab, setActiveTab] = useState<string>('Cycles');
  const [selectedClientId, setSelectedClientId] = useState<string>('client-2coms');
  const [selectedLocationId, setSelectedLocationId] = useState<string>('loc-kol');
  const [selectedBranchId, setSelectedBranchId] = useState<string>('all');
  const [selectedClient, setSelectedClient] = useState<AttendanceClientProfile>({
    id: 'client-2coms',
    name: '2COMS Services',
    code: '2CS',
    location: 'Kolkata',
    state: 'West Bengal',
    city: 'Kolkata',
    branch: 'All Kolkata Offices (RDB, Big Bagan, Alipore)',
    status: 'Active',
    employeeCount: 106
  });
  const { message: toastMessage, showToast } = useToast();
  const regularizationAccess = useFeatureAccess('attendance-regularization');
  const notificationsAccess = useFeatureAccess('app-notifications');

  const handleContextChange = (clientId: string, locationId: string, branchId: string) => {
    setSelectedClientId(clientId);
    setSelectedLocationId(locationId);
    setSelectedBranchId(branchId);

    const client = CLIENT_HIERARCHIES.find(c => c.id === clientId);
    const loc = client?.locations.find(l => l.id === locationId);
    const branch = loc?.branches.find(b => b.id === branchId);

    const clientProfile: AttendanceClientProfile = {
      id: clientId,
      name: client?.name || '2COMS Services',
      code: client?.code || '2CS',
      location: loc?.name || 'Hyderabad',
      state: loc?.state || 'Telangana',
      city: loc?.city || 'Hyderabad',
      branch: branch?.name || 'Home Branch',
      status: 'Active',
      employeeCount: branch?.staffCount || 48
    };
    setSelectedClient(clientProfile);
  };

  const handleClientChange = (newClient: AttendanceClientProfile) => {
    setSelectedClient(newClient);
    const foundClient = CLIENT_HIERARCHIES.find(c => c.name === newClient.name);
    if (foundClient) {
      const firstLoc = foundClient.locations[0];
      const firstBranch = firstLoc?.branches[0];
      setSelectedClientId(foundClient.id);
      setSelectedLocationId(firstLoc?.id || '');
      setSelectedBranchId(firstBranch?.id || '');
    }
    showToast(`Switched active client filter to "${newClient.name}" (${newClient.location}).`);
  };

  const tabs = [
    { id: 'Settings', label: 'Settings' },
    { id: 'Shifts', label: 'Shifts / Shift Muster' },
    { id: 'Weekoff Patterns', label: 'Weekoff Patterns' },
    { id: 'Roster', label: 'Roster' },
    { id: 'Cycles', label: 'Cycles & Muster' },
    { id: 'Geo Fence', label: 'Geo Fence' },
    { id: 'Overtime Config', label: 'Overtime Config' },
    ...(regularizationAccess !== 'none' ? [{ id: 'Regularization', label: 'Regularization' }] : []),
    ...(notificationsAccess !== 'none' ? [{ id: 'Notifications', label: 'Notifications' }] : []),
  ];

  return (
    <div className="flex-1 flex flex-col">
      {/* Toast Notification */}
      <Toast message={toastMessage} variant="solid" />

      <PageHeader
        icon={CalendarClock}
        title="Attendance & Cycles"
        subtitle="Attendance cycles, muster, shifts, rosters and policies by client and location"
        actions={
          <Chip tone="good" className="gap-1.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
            Status: {selectedClient.status}
          </Chip>
        }
      />

      <PageBody>
        {/* Context: Client / City-Work Zone / Office Location (single source for the whole module) */}
        <AttendanceContextBar
          selectedClientId={selectedClientId}
          selectedLocationId={selectedLocationId}
          selectedBranchId={selectedBranchId}
          onContextChange={handleContextChange}
          clientName={selectedClient.name}
          location={selectedClient.location}
          branch={selectedClient.branch}
          state={selectedClient.state}
          city={selectedClient.city}
        />

        {/* Module navigation */}
        <CategoryTabs
          tabs={tabs.map((t) => ({ value: t.id, label: t.label }))}
          value={activeTab}
          onChange={setActiveTab}
        />

        {/* Tab content: each submodule keeps its own workflow */}
        {activeTab === 'Settings' && (
          <SettingsSubmodule
            onShowToast={showToast}
            onNavigateToCycles={() => setActiveTab('Cycles')}
          />
        )}

        {activeTab === 'Shifts' && (
          <ShiftsSubmodule onShowToast={showToast} />
        )}

        {activeTab === 'Weekoff Patterns' && (
          <WeekoffSubmodule onShowToast={showToast} />
        )}

        {activeTab === 'Roster' && (
          <RosterSubmodule
            onShowToast={showToast}
            onNavigateToSettings={() => setActiveTab('Settings')}
            selectedClient={selectedClient}
          />
        )}

        {activeTab === 'Cycles' && (
          <CyclesMusterSubmodule
            onShowToast={showToast}
            onNavigateToSettings={() => setActiveTab('Settings')}
            selectedClientId={selectedClientId}
            selectedLocationId={selectedLocationId}
            selectedBranchId={selectedBranchId}
            onContextChange={handleContextChange}
            selectedClient={selectedClient}
            onClientChange={handleClientChange}
          />
        )}

        {activeTab === 'Geo Fence' && (
          <GeoFenceSubmodule onShowToast={showToast} />
        )}

        {activeTab === 'Overtime Config' && (
          <OvertimeSubmodule onShowToast={showToast} />
        )}

        {activeTab === 'Regularization' && regularizationAccess !== 'none' && (
          <RegularizationSubmodule onShowToast={showToast} clientName={selectedClient.name} />
        )}

        {activeTab === 'Notifications' && notificationsAccess !== 'none' && (
          <NotificationsSubmodule onShowToast={showToast} clientName={selectedClient.name} />
        )}
      </PageBody>
    </div>
  );
};
