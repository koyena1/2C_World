import React from 'react';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { sidebarStyles as s } from './sidebar.styles';

interface SidebarToggleButtonProps {
  collapsed: boolean;
  onToggle: () => void;
}

/** Always-visible collapse/expand button (placed beside the logo in the expanded sidebar). */
export const SidebarToggleButton: React.FC<SidebarToggleButtonProps> = ({ collapsed, onToggle }) => {
  const label = collapsed ? 'Expand sidebar' : 'Collapse sidebar';
  const Icon = collapsed ? PanelLeftOpen : PanelLeftClose;

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={label}
      aria-expanded={!collapsed}
      title={label}
      className={s.toggleBeside}
    >
      <Icon className="w-[18px] h-[18px]" />
    </button>
  );
};
