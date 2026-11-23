import React from 'react';
import { cn } from '../../utils/cn';
import { SidebarTooltip } from './SidebarTooltip';
import { sidebarStyles as s } from './sidebar.styles';
import type { SidebarItemConfig } from './sidebar.types';

interface SidebarItemProps {
  item: SidebarItemConfig;
  active: boolean;
  collapsed: boolean;
  /** Show the red pending dot beside the icon. */
  notify?: boolean;
  onClick: () => void;
}

/** One navigation entry: full row when expanded, icon-only (with tooltip) when collapsed. */
export const SidebarItem: React.FC<SidebarItemProps> = ({ item, active, collapsed, notify = false, onClick }) => {
  const Icon = item.icon;

  if (collapsed) {
    return (
      <SidebarTooltip label={item.label} enabled>
        <button
          type="button"
          onClick={onClick}
          aria-label={notify ? item.label + ' (pending items)' : item.label}
          aria-current={active ? 'page' : undefined}
          className={cn(s.collapsedItem, active ? s.collapsedItemActive : s.collapsedItemIdle)}
        >
          <span className="relative">
            <Icon className={s.itemIcon} />
            {notify && <span className={s.dot} aria-hidden />}
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
      <span className="relative shrink-0">
        <Icon className={s.itemIcon} />
        {notify && <span className={s.dot} aria-hidden />}
      </span>
      <span className={s.itemLabel}>{item.label}</span>
      {notify && <span className="sr-only">Pending items</span>}
    </button>
  );
};
