import React from 'react';
import { cn } from '../../utils/cn';
import { SidebarBadge } from './SidebarBadge';
import { SidebarTooltip } from './SidebarTooltip';
import { sidebarStyles as s } from './sidebar.styles';
import type { SidebarItemConfig } from './sidebar.types';
import type { ResolvedBadge } from './sidebar.utils';

interface SidebarItemProps {
  item: SidebarItemConfig;
  active: boolean;
  collapsed: boolean;
  badge: ResolvedBadge | null;
  onClick: () => void;
}

/** One navigation entry: full row when expanded, icon-only (with tooltip) when collapsed. */
export const SidebarItem: React.FC<SidebarItemProps> = ({ item, active, collapsed, badge, onClick }) => {
  const Icon = item.icon;

  if (collapsed) {
    return (
      <SidebarTooltip label={item.label} detail={badge?.text} enabled>
        <button
          type="button"
          onClick={onClick}
          aria-label={item.label}
          aria-current={active ? 'page' : undefined}
          className={cn(s.collapsedItem, active ? s.collapsedItemActive : s.collapsedItemIdle)}
        >
          {active && <span className={s.activeBar} aria-hidden />}
          <span className="relative">
            <Icon className={s.itemIcon} />
            {badge?.dot && <span className={s.dot} aria-hidden />}
          </span>
        </button>
      </SidebarTooltip>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={cn(s.item, active ? s.itemActive : s.itemIdle)}
    >
      <Icon className={s.itemIcon} />
      <span className={s.itemLabel}>{item.label}</span>
      {badge && <SidebarBadge badge={badge} />}
    </button>
  );
};
