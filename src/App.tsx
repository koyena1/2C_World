/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
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
import { ComplianceModule } from './modules/compliance/ComplianceModule';
import { ContractExitModule } from './modules/contract-exit/ContractExitModule';
import { RoleProvider } from './context/RoleContext';
import { PayrollPage } from './modules/payroll/PayrollPage';
import { LmsPage } from './modules/lms/LmsPage';
import { SupportTicketPage } from './modules/support/SupportTicketPage';
import { setTicketCandidate } from './modules/hr-ops/servicesStore';
import { pathForView, viewFromPath } from './routes';
import { canOpenView, DEFAULT_ROLE, type AppRole } from './modules/hr-ops/hrOps.config';
import { computeKpis } from './modules/dashboard/dashboard.metrics';
import { hrOpsCounts } from './modules/dashboard/command-center/HrOpsExtras';

function AppContent() {
  // The app always runs as Admin (there is no role selector, and a role saved earlier in the browser is ignored).
  const [activeRole] = useState<AppRole>(DEFAULT_ROLE);

  // Navigation state, opened from the browser URL (deep links) and kept in sync with it.
  const [currentView, setCurrentView] = useState<string>(() => {
    const fromUrl = viewFromPath(window.location.pathname);
    return canOpenView(fromUrl, activeRole) ? fromUrl : 'dashboard';
  });

  /** Show a view and give it its own browser URL (back / forward / refresh then work). */
  const goTo = (view: string) => {
    setCurrentView(view);
    const path = pathForView(view);
    if (path !== null && window.location.pathname !== path) window.history.pushState({ view }, '', path);
  };

  useEffect(() => {
    // A blocked or unknown URL is replaced by the dashboard URL; back / forward re-open the matching view.
    const sync = () => {
      const fromUrl = viewFromPath(window.location.pathname);
      const allowed = canOpenView(fromUrl, activeRole) ? fromUrl : 'dashboard';
      setCurrentView(allowed);
      const path = pathForView(allowed);
      if (path !== null && window.location.pathname !== path) window.history.replaceState({ view: allowed }, '', path);
    };
    sync();
    window.addEventListener('popstate', sync);
    return () => window.removeEventListener('popstate', sync);
  }, [activeRole]);

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
    goTo('profile');
  };

  const handleOpenKycWorkspace = (cand: Candidate) => {
    setSelectedCandidate(cand);
    goTo('kyc');
  };

  const handleSidebarNavigate = (view: string) => {
    if (!canOpenView(view, activeRole)) return;
    if (view === 'invite') {
      setIsInviteModalOpen(true);
      return;
    }
    goTo(view);
  };

  const pendingKycCount = candidates.filter(
    (c) => c.overallKycStatus === 'Pending Manual Review' || c.overallKycStatus === 'API Mismatch'
  ).length;

  // Red sidebar dots: modules with pending or unresolved items, from the same live candidate list the dashboard uses.
  const kpis = computeKpis(candidates);
  const hrOps = hrOpsCounts();
  const notifications = {
    pendingKyc: pendingKycCount,
    pendingOffers: kpis.pendingOffers,
    directoryIssues: kpis.blockers,
    compliance: hrOps.uanPending + hrOps.esicDuplicates,
    contractExit: hrOps.contractsExpiring + hrOps.exitDocsPending,
    attendanceRegularization: hrOps.regularizations,
  };

  return (
    <RoleProvider role={activeRole}>
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
          role={activeRole}
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
          onBackToDirectory={() => goTo('directory')}
          onRaiseTicket={(c) => {
            setTicketCandidate({ id: c.id, name: `${c.firstName} ${c.lastName}` });
            goTo('support-ticket');
          }}
        />
      )}

      {currentView === 'attendance' && <AttendanceModule />}

      {currentView === 'holidays' && <HolidayMastersModule />}

      {currentView === 'compliance' && canOpenView('compliance', activeRole) && <ComplianceModule candidates={candidates} />}

      {currentView === 'contract-exit' && canOpenView('contract-exit', activeRole) && <ContractExitModule candidates={candidates} onNavigate={handleSidebarNavigate} />}

      {currentView === 'payroll' && canOpenView('payroll', activeRole) && <PayrollPage candidates={candidates} />}

      {currentView === 'lms' && canOpenView('lms', activeRole) && <LmsPage />}

      {currentView === 'support-ticket' && canOpenView('support-ticket', activeRole) && <SupportTicketPage candidates={candidates} />}

      {currentView === 'usersettings' && canOpenView('usersettings', activeRole) && <UserSettingsModule appActiveRole={activeRole} />}
    </AppLayout>
    </RoleProvider>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
