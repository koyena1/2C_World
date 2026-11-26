import React from 'react';
import { Menu } from 'lucide-react';
import { IconButton } from '../components/ui/IconButton';
import { Breadcrumb } from '../components/ui/Breadcrumb';
import { ThemeToggle } from '../components/common/ThemeToggle';
import { SyncButton } from '../components/common/SyncButton';
import { DashboardDateFilter } from '../modules/dashboard/command-center/DashboardDateFilter';
import { useTheme } from '../hooks/useTheme';
import { SIDEBAR_GROUPS } from './sidebar/sidebar.config';
import { findItemForView } from './sidebar/sidebar.utils';

interface AppHeaderProps {
  currentView: string;
  /** Go to the dashboard (breadcrumb root). */
  onGoHome: () => void;
  /** Opens the navigation drawer (mobile only). */
  onOpenMenu?: () => void;
}

const ROOT_LABEL = '2COMS Connect';

/**
 * Top bar of the main area (it starts right after the sidebar):
 * breadcrumb on the left, theme toggle and profile menu on the right.
 */
export const AppHeader: React.FC<AppHeaderProps> = ({ currentView, onGoHome, onOpenMenu }) => {
  const { isDark } = useTheme();
  const isDashboard = currentView === 'dashboard' || currentView === 'overview';
  const page = findItemForView(SIDEBAR_GROUPS, currentView)?.item.label ?? 'Dashboard';

  return (
    <header className={`h-[var(--app-header-height)] shrink-0 border-b sticky top-0 z-30 flex items-center justify-between gap-3 px-4 sm:px-6 transition-colors duration-150 ${
      isDark
        ? 'border-slate-800 bg-slate-950 text-slate-100'
        : 'border-slate-200 bg-white text-slate-900 shadow-2xs'
    }`}>
      <div className="flex items-center gap-2 min-w-0">
        {onOpenMenu && (
          <IconButton onClick={onOpenMenu} aria-label="Open navigation menu" title="Menu" className="lg:hidden text-slate-700 dark:text-slate-200">
            <Menu className="w-4 h-4" />
          </IconButton>
        )}
        <Breadcrumb items={[{ label: ROOT_LABEL, onClick: onGoHome }, { label: page }]} />
      </div>

      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <SyncButton />
        {isDashboard && <DashboardDateFilter />}
        <ThemeToggle />
      </div>
    </header>
  );
};
