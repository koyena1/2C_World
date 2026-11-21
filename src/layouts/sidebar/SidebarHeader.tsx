import React from 'react';
import { cn } from '../../utils/cn';
import { SidebarLogoToggle } from './SidebarLogoToggle';
import { SidebarToggleButton } from './SidebarToggleButton';
import type { SidebarToggleMode } from './sidebar.config';
import { sidebarStyles as s } from './sidebar.styles';
import type { SidebarBranding } from './sidebar.types';

interface SidebarHeaderProps {
  collapsed: boolean;
  onToggle: () => void;
  branding: SidebarBranding;
  toggleMode: SidebarToggleMode;
}

/**
 * Top row of the sidebar (same height as the main header).
 * Expanded: logo + brand text + collapse button beside them (toggleMode 'beside-logo'),
 *           or the logo that turns into the button on hover ('on-logo-hover').
 * Collapsed: only the logo, which turns into the expand button on hover.
 */
export const SidebarHeader: React.FC<SidebarHeaderProps> = ({ collapsed, onToggle, branding, toggleMode }) => {
  const besideLogo = !collapsed && toggleMode === 'beside-logo';

  return (
    <div className={cn(s.header, collapsed ? s.headerCollapsed : s.headerExpanded)}>
      {/* Always rendered in the same place, so hover/transition state survives toggling */}
      <SidebarLogoToggle
        collapsed={collapsed}
        onToggle={onToggle}
        branding={branding}
        swapOnHover={!besideLogo}
      />

      {!collapsed && (
        <div className={cn(s.brand, 'sidebar-fade-in')}>
          <div className="min-w-0">
            <p className={s.brandTitle}>{branding.title}</p>
            <p className={s.brandSubtitle}>
              {branding.liveSubtitle && <span className={s.liveDot} />}
              <span className="truncate">{branding.subtitle}</span>
            </p>
          </div>
        </div>
      )}

      {besideLogo && <SidebarToggleButton collapsed={collapsed} onToggle={onToggle} />}
    </div>
  );
};
