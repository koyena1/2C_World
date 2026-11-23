import React, { useMemo, useState } from 'react';
import { useProfileOverrides } from '../../hooks/useProfileOverrides';
import { useSidebarCollapse } from '../../hooks/useSidebarCollapse';
import { cn } from '../../utils/cn';
import { SidebarFooter } from './SidebarFooter';
import { SidebarGroup } from './SidebarGroup';
import { SidebarHeader } from './SidebarHeader';
import { SidebarItem } from './SidebarItem';
import {
  DEFAULT_SIDEBAR_USER_KEY,
  SIDEBAR_BRANDING,
  SIDEBAR_GROUPS,
  SIDEBAR_TOGGLE_MODE,
  SIDEBAR_USERS,
  type SidebarToggleMode,
} from './sidebar.config';
import { sidebarStyles as s } from './sidebar.styles';
import type {
  SidebarNotifications,
  SidebarBranding,
  SidebarGroupConfig,
  SidebarUser,
} from './sidebar.types';
import { filterGroupsByRole, hasNotification, isItemActive } from './sidebar.utils';

export interface AppSidebarProps {
  currentView: string;
  /** `keepOpen` asks a host that closes on navigation (the mobile drawer) to stay open. */
  onNavigate: (view: string, options?: { keepOpen?: boolean }) => void;
  /** Active role (admin / hr / candidate …). Drives role-based visibility and the footer user. */
  role?: string;
  /** Pending / unresolved item counts per module, e.g. { pendingKyc: 3 }. A module shows a red dot while its count is above zero. */
  notifications?: SidebarNotifications;
  /** Optional overrides: reuse the sidebar with different content. */
  groups?: SidebarGroupConfig[];
  branding?: SidebarBranding;
  users?: Record<string, SidebarUser>;
  /** Where the collapse button sits while expanded (see sidebar.config.ts). */
  toggleMode?: SidebarToggleMode;
  /** Controlled mode. Omit to let the sidebar manage (and remember) its own state. */
  collapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  /** Render as the mobile drawer: always expanded, the header toggle closes the drawer. */
  mobile?: boolean;
  onMobileClose?: () => void;
}

export const AppSidebar: React.FC<AppSidebarProps> = ({
  currentView,
  onNavigate,
  role,
  notifications = {},
  groups = SIDEBAR_GROUPS,
  branding = SIDEBAR_BRANDING,
  users = SIDEBAR_USERS,
  toggleMode = SIDEBAR_TOGGLE_MODE,
  collapsed: controlledCollapsed,
  onCollapsedChange,
  mobile = false,
  onMobileClose,
}) => {
  const own = useSidebarCollapse();
  const isControlled = controlledCollapsed !== undefined;
  const collapsed = mobile ? false : isControlled ? controlledCollapsed : own.collapsed;

  const handleToggle = () => {
    if (mobile) onMobileClose?.();
    else if (isControlled) onCollapsedChange?.(!collapsed);
    else {
      own.toggle();
      onCollapsedChange?.(!collapsed);
    }
  };

  // Idempotent "open the rail" (unlike the toggle, it can never collapse an expanded sidebar).
  const expand = () => {
    if (mobile || !collapsed) return;
    if (isControlled) onCollapsedChange?.(false);
    else {
      own.setCollapsed(false);
      onCollapsedChange?.(false);
    }
  };

  const visibleGroups = useMemo(() => filterGroupsByRole(groups, role), [groups, role]);

  // Group open/closed state (accordion). Only `defaultOpen` groups start open; clicking a
  // heading opens that group and closes every other one (clicking an open heading closes it).
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(groups.map((g) => [g.id, g.defaultOpen ?? false]))
  );

  const userKey = users[role ?? DEFAULT_SIDEBAR_USER_KEY] ? (role ?? DEFAULT_SIDEBAR_USER_KEY) : DEFAULT_SIDEBAR_USER_KEY;
  const baseUser = users[userKey];
  const { edits, save: saveProfile } = useProfileOverrides(userKey);
  // Name / email can be edited from the profile dialog; everything else comes from the config.
  const user = edits ? { ...baseUser, name: edits.name, email: edits.email } : baseUser;

  // Expanded sidebar, parent click: a closed parent opens (the others close) and its first child
  // page is shown; clicking an already-open parent collapses it.
  const handleParentClick = (group: SidebarGroupConfig) => {
    if (openGroups[group.id]) {
      setOpenGroups((prev) => ({ ...prev, [group.id]: false }));
      return;
    }
    setOpenGroups(Object.fromEntries(groups.map((g) => [g.id, g.id === group.id])));
    const first = group.items[0];
    if (first) onNavigate(first.viewId, { keepOpen: true });
  };

  const renderItem = (group: SidebarGroupConfig, itemIdx: number) => {
    const item = group.items[itemIdx];
    const direct = Boolean(group.permanent);
    return (
      <SidebarItem
        key={item.id}
        item={item}
        active={isItemActive(item, currentView)}
        collapsed={collapsed}
        notify={hasNotification(item, notifications)}
        // Collapsed: a click on an icon expands the sidebar, opens that icon's menu group
        // (accordion: the others close) and then navigates as usual.
        onClick={() => {
          if (collapsed) {
            // Standalone items have no menu group to open, so only the rail expands.
            if (!direct) setOpenGroups(Object.fromEntries(groups.map((g) => [g.id, g.id === group.id])));
            expand();
          }
          onNavigate(item.viewId);
        }}
      />
    );
  };

  return (
    <aside className={mobile ? s.rootMobile : s.root} data-collapsed={collapsed} aria-label="Sidebar">
      <SidebarHeader collapsed={collapsed} onToggle={handleToggle} branding={branding} toggleMode={toggleMode} />

      <nav aria-label="Main navigation" className={s.nav}>
        {/* key remounts the list on mode change so it fades in while the width animates */}
        <div
          key={collapsed ? 'collapsed' : 'expanded'}
          className={cn('sidebar-fade-in', collapsed ? s.navCollapsed : s.navExpanded)}
        >
          {collapsed
            ? visibleGroups.map((group) =>
                group.permanent ? (
                  group.items.map((_, i) => renderItem(group, i))
                ) : (
                // Collapsed: ONLY the parent menu icons (no child items). Clicking one expands the
                // sidebar, opens that group and goes to its first submenu.
                <SidebarItem
                  key={group.id}
                  item={{ id: group.id, label: group.title, viewId: group.items[0].viewId, icon: group.icon }}
                  active={group.items.some((i) => isItemActive(i, currentView))}
                  collapsed
                  notify={group.items.some((i) => hasNotification(i, notifications))}
                  onClick={() => {
                    setOpenGroups(Object.fromEntries(groups.map((g) => [g.id, g.id === group.id])));
                    expand();
                    onNavigate(group.items[0].viewId);
                  }}
                />
                )
              )
            : visibleGroups.map((group) =>
                group.permanent ? (
                  <div key={group.id} className={s.topLevelItems}>
                    {group.items.map((_, i) => renderItem(group, i))}
                  </div>
                ) : (
                  <SidebarGroup
                    key={group.id}
                    group={group}
                    open={openGroups[group.id] ?? false}
                    active={group.items.some((i) => isItemActive(i, currentView))}
                    notify={group.items.some((i) => hasNotification(i, notifications))}
                    onToggle={() => handleParentClick(group)}
                  >
                    {group.items.map((_, i) => renderItem(group, i))}
                  </SidebarGroup>
                )
              )}
        </div>
      </nav>

      <SidebarFooter collapsed={collapsed} user={user} branding={branding} onSaveProfile={saveProfile} />
    </aside>
  );
};
