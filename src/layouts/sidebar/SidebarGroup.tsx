import React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../utils/cn';
import { sidebarStyles as s } from './sidebar.styles';
import type { SidebarGroupConfig } from './sidebar.types';

interface SidebarGroupProps {
  group: SidebarGroupConfig;
  open: boolean;
  /** One of this group's pages is the current page. */
  active?: boolean;
  /** A page inside this group has pending items. */
  notify?: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

/** Expandable pill header with its child items (expanded sidebar only). */
export const SidebarGroup: React.FC<SidebarGroupProps> = ({ group, open, active = false, notify = false, onToggle, children }) => {
  const Icon = group.icon;
  const bodyId = `sidebar-group-${group.id}`;

  return (
    <div className={s.group}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={bodyId}
        aria-current={active && !open ? 'page' : undefined}
        // Open: the highlighted child shows where you are. Closed: the parent carries the highlight.
        className={cn(s.groupHeader, active && !open ? s.itemActive : s.groupHeaderIdle)}
      >
        <span className="relative shrink-0">
          <Icon className={s.itemIcon} />
          {notify && <span className={s.dot} aria-hidden />}
        </span>
        <span className="flex-1 min-w-0 truncate text-left">{group.title}</span>
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
