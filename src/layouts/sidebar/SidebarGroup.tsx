import React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../utils/cn';
import { sidebarStyles as s } from './sidebar.styles';
import type { SidebarGroupConfig } from './sidebar.types';

interface SidebarGroupProps {
  group: SidebarGroupConfig;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

/** Expandable pill header with its child items (expanded sidebar only). */
export const SidebarGroup: React.FC<SidebarGroupProps> = ({ group, open, onToggle, children }) => {
  const Icon = group.icon;
  const bodyId = `sidebar-group-${group.id}`;

  return (
    <div className={s.group}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={bodyId}
        className={s.groupHeader}
      >
        <Icon className={s.itemIcon} />
        <span className="flex-1 min-w-0 truncate text-left">{group.title}</span>
        {group.tag && <span className={s.groupTag}>{group.tag}</span>}
        {group.showCount && <span className={s.groupCount}>{group.items.length}</span>}
        <ChevronDown className={cn(s.groupChevron, open ? 'rotate-0' : '-rotate-90')} />
      </button>

      <div id={bodyId} className={cn(s.groupBody, open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]')}>
        <div className="overflow-hidden">
          <div className={s.groupChildren}>{children}</div>
        </div>
      </div>
    </div>
  );
};
