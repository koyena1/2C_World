import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { cn } from '../utils/cn';
import { useStackedTables } from '../hooks/useStackedTables';
import { AppHeader } from './AppHeader';
import { AppSidebar } from './sidebar/AppSidebar';
import type { SidebarNotifications } from './sidebar/sidebar.types';

interface AppLayoutProps {
  currentView: string;
  /** Called when a sidebar item is chosen. */
  onNavigate: (view: string) => void;
  activeRole: string;
  /** Pending item counts per module; drives the red dots in the sidebar. */
  notifications: SidebarNotifications;
  /** Global overlays (toast, modals) rendered after the main layout. */
  overlays?: React.ReactNode;
  children: React.ReactNode;
}

/**
 * Page chrome:
 *
 *   ┌─────────┬──────────────────────────┐
 *   │ sidebar │ header (breadcrumb, …)   │
 *   │ (full   ├──────────────────────────┤
 *   │ height) │ main content             │
 *   └─────────┴──────────────────────────┘
 *
 * The sidebar spans the full height (its top row lines up with the header) and the
 * right column simply takes the remaining width, so it re-flows when the sidebar
 * collapses or expands. `min-w-0` lets the column shrink instead of overflowing.
 */
export const AppLayout: React.FC<AppLayoutProps> = ({
  currentView,
  onNavigate,
  activeRole,
  notifications,
  overlays,
  children,
}) => {
  const { isDark } = useTheme();
  const [navOpen, setNavOpen] = useState(false);
  // Phones / small tablets: every data table becomes labelled cards (CSS only applies below 1024px).
  useStackedTables();

  // Mobile drawer: Escape closes it, and the page behind it can't scroll while it is open
  useEffect(() => {
    if (!navOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setNavOpen(false);
    document.addEventListener('keydown', onKey);
    const { overflow } = document.body.style;
    const { overflow: htmlOverflow } = document.documentElement.style;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
      document.documentElement.style.overflow = htmlOverflow;
    };
  }, [navOpen]);

  return (
    <div
      className={cn(
        'app-shell min-h-screen flex antialiased transition-colors duration-150',
        isDark ? 'text-slate-100' : 'text-slate-800'
      )}
    >
      <AppSidebar
        currentView={currentView}
        onNavigate={onNavigate}
        role={activeRole}
        notifications={notifications}
      />

      <div className="flex-1 min-w-0 flex flex-col">
        <AppHeader
          currentView={currentView}
          onGoHome={() => onNavigate('dashboard')}
          onOpenMenu={() => setNavOpen(true)}
        />
        <main className="app-page flex-1 min-w-0 overflow-y-auto flex flex-col">{children}</main>
      </div>

      {/* Navigation drawer for phones / small tablets (the sidebar itself is hidden below md).
          Always mounted so it can slide in and out; inert + invisible while closed. */}
      <div
        className={cn(
          'lg:hidden fixed inset-0 z-50 flex transition-[visibility] duration-200',
          navOpen ? 'visible' : 'invisible pointer-events-none'
        )}
        role={navOpen ? 'dialog' : undefined}
        aria-modal={navOpen || undefined}
        aria-label="Navigation menu"
        inert={!navOpen}
      >
        <div
          className={cn(
            'relative h-full transition-transform duration-200 ease-out',
            navOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          <AppSidebar
            mobile
            onMobileClose={() => setNavOpen(false)}
            currentView={currentView}
            onNavigate={(view, options) => {
              if (!options?.keepOpen) setNavOpen(false);
              onNavigate(view);
            }}
            role={activeRole}
            notifications={notifications}
          />
          <button
            type="button"
            onClick={() => setNavOpen(false)}
            aria-label="Close navigation menu"
            title="Close"
            className="absolute top-3 right-3 z-10 w-9 h-9 rounded-lg flex items-center justify-center border border-white/25 bg-white/10 text-white hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <button
          type="button"
          aria-label="Close navigation menu (backdrop)"
          onClick={() => setNavOpen(false)}
          className={cn(
            'flex-1 bg-slate-900/50 backdrop-blur-[2px] transition-opacity duration-200',
            navOpen ? 'opacity-100' : 'opacity-0'
          )}
        />
      </div>

      {overlays}
    </div>
  );
};
