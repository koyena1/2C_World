import React, { useState } from 'react';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { sidebarStyles as s } from './sidebar.styles';
import type { SidebarBranding } from './sidebar.types';

interface SidebarLogoToggleProps {
  collapsed: boolean;
  onToggle: () => void;
  branding: SidebarBranding;
  /** When false only the logo is rendered (a separate button handles toggling). */
  swapOnHover?: boolean;
}

/**
 * The sidebar logo that doubles as the collapse / expand button.
 * Default: shows the logo. On hover (or keyboard focus) the logo cross-fades into the
 * toggle button. The button is always in the DOM, so it stays keyboard- and touch-reachable.
 */
export const SidebarLogoToggle: React.FC<SidebarLogoToggleProps> = ({
  collapsed,
  onToggle,
  branding,
  swapOnHover = true,
}) => {
  const [logoFailed, setLogoFailed] = useState(false);
  const showLogoImage = Boolean(branding.logoSrc) && !logoFailed;

  const label = collapsed ? 'Expand sidebar' : 'Collapse sidebar';
  const ToggleIcon = collapsed ? PanelLeftOpen : PanelLeftClose;

  return (
    <div className={s.logoSlot}>
      {/* Logo layer */}
      <div className={swapOnHover ? s.logo : s.logoStatic}>
        {showLogoImage ? (
          <img
            src={branding.logoSrc}
            alt={branding.logoAlt ?? branding.title}
            className={s.logoImage}
            draggable={false}
            onError={() => setLogoFailed(true)}
          />
        ) : (
          branding.logoText
        )}
      </div>

      {/* Toggle layer (revealed on hover / focus) */}
      {swapOnHover && (
        <button
          type="button"
          onClick={onToggle}
          aria-label={label}
          aria-expanded={!collapsed}
          title={label}
          className={s.toggle}
        >
          <ToggleIcon className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};
