/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AppLayout } from './layouts/AppLayout';
import { Toast } from './components/ui/Toast';
import { HrOpsDashboard } from './modules/dashboard/HrOpsDashboard';
import { CandidateDirectory } from './modules/directory/CandidateDirectory';
import { OfferLettersPage } from './modules/directory/OfferLettersPage';
import { AddCandidateModal } from './modules/invite/AddCandidateModal';
import { BulkImportView } from './modules/import/BulkImportView';
import { KycVerificationWorkspace } from './modules/kyc/KycVerificationWorkspace';
import { CandidateProfile360 } from './modules/profile/CandidateProfile360';
import { AttendanceModule } from './modules/attendance/AttendanceModule';
import { HolidayMastersModule } from './modules/holidays/HolidayMastersModule';
import { UserSettingsModule } from './modules/user-settings/UserSettingsModule';
import { MOCK_CANDIDATES } from './data/mockOnboardingData';
import { INITIAL_DIRECTORY_FILTERS } from './data/directoryDefaults';
import { Candidate, FilterOptions } from './types/onboarding';
import { ThemeProvider } from './context/ThemeContext';
import { useToast } from './hooks/useToast';
import { createCandidateFromInvite } from './utils/candidateFactory';
import { computeKpis } from './modules/dashboard/dashboard.metrics';

function AppContent() {
  // Navigation State - default to dashboard
  const [currentView, setCurrentView] = useState<string>('dashboard');
  const [activeRole] = useState<string>('admin');
  const [candidates, setCandidates] = useState<Candidate[]>(MOCK_CANDIDATES);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate>(MOCK_CANDIDATES[0]);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState<boolean>(false);
  // duration 0 = the global toast stays until dismissed
  const { message: toastMessage, showToast, hideToast } = useToast(0);

  // Persistent Directory Filters (retained when switching between views)
  const [directoryFilters, setDirectoryFilters] = useState<FilterOptions>(INITIAL_DIRECTORY_FILTERS);

  // Handle adding new candidate from Add Candidate Modal
  const handleCandidateAdded = (newCand: Partial<Candidate>) => {
    const fullCandidate = createCandidateFromInvite(newCand);

    setCandidates((prev) => [fullCandidate, ...prev]);
    setSelectedCandidate(fullCandidate);
    showToast(`Invitation dispatched to ${fullCandidate.firstName} ${fullCandidate.lastName} via WhatsApp & SMS`);
  };

  const handleOpenCandidateProfile = (cand: Candidate) => {
    setSelectedCandidate(cand);
    setCurrentView('profile');
  };

  const handleOpenKycWorkspace = (cand: Candidate) => {
    setSelectedCandidate(cand);
    setCurrentView('kyc');
  };

  const handleSidebarNavigate = (view: string) => {
    if (view === 'invite') {
      setIsInviteModalOpen(true);
      return;
    }
    setCurrentView(view);
  };

  const pendingKycCount = candidates.filter(
    (c) => c.overallKycStatus === 'Pending Manual Review' || c.overallKycStatus === 'API Mismatch'
  ).length;

  // Red sidebar dots: modules with pending or unresolved items, from the same live candidate list the dashboard uses.
  const kpis = computeKpis(candidates);
  const notifications = {
    pendingKyc: pendingKycCount,
    pendingOffers: kpis.pendingOffers,
    directoryIssues: kpis.blockers,
  };

  return (
    <AppLayout
      currentView={currentView}
      onNavigate={handleSidebarNavigate}
      activeRole={activeRole}
      notifications={notifications}
      overlays={
        <>
          {/* Global Toast Notification */}
          <Toast message={toastMessage} onClose={hideToast} />

          {/* Guided Add Candidate Drawer / Modal */}
          <AddCandidateModal
            isOpen={isInviteModalOpen}
            onClose={() => setIsInviteModalOpen(false)}
            onCandidateAdded={handleCandidateAdded}
            onOpenCandidate360={handleOpenCandidateProfile}
          />
        </>
      }
    >
      {(currentView === 'dashboard' || currentView === 'overview') && (
        <HrOpsDashboard
          candidates={candidates}
          onNavigate={handleSidebarNavigate}
          onOpenInviteModal={() => setIsInviteModalOpen(true)}
          onOpenCandidateProfile={(id) => {
            const found = candidates.find((c) => c.id === id || c.userId === id) || candidates[0];
            handleOpenCandidateProfile(found);
          }}
        />
      )}

      {currentView === 'directory' && (
        <CandidateDirectory
          candidates={candidates}
          onOpenInviteModal={() => setIsInviteModalOpen(true)}
          onOpenCandidateProfile={handleOpenCandidateProfile}
          onOpenKycWorkspace={handleOpenKycWorkspace}
          externalFilters={directoryFilters}
          onExternalFilterChange={setDirectoryFilters}
        />
      )}

      {currentView === 'offer-letters' && (
        <OfferLettersPage candidates={candidates} onOpenCandidateProfile={handleOpenCandidateProfile} />
      )}

      {currentView === 'import' && <BulkImportView />}

      {currentView === 'kyc' && (
        <KycVerificationWorkspace
          candidates={candidates}
          activeCandidate={selectedCandidate}
          onSelectCandidate={setSelectedCandidate}
          onOpenCandidate360={handleOpenCandidateProfile}
        />
      )}

      {currentView === 'profile' && (
        <CandidateProfile360
          candidate={selectedCandidate}
          onOpenKycDesk={handleOpenKycWorkspace}
          onBackToDirectory={() => setCurrentView('directory')}
        />
      )}

      {currentView === 'attendance' && <AttendanceModule />}

      {currentView === 'holidays' && <HolidayMastersModule />}

      {currentView === 'usersettings' && <UserSettingsModule appActiveRole={activeRole} />}
    </AppLayout>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
