import type { SidebarGroupConfig, SidebarItemConfig, SidebarNotifications } from './sidebar.types';

/** Roles: no `roles` list means visible to everyone. */
export const isVisibleForRole = (roles: string[] | undefined, role?: string): boolean =>
  !roles || roles.length === 0 || (role !== undefined && roles.includes(role));

export const isItemActive = (item: SidebarItemConfig, currentView: string): boolean =>
  (item.activeViews ?? [item.viewId]).includes(currentView);

/** An item shows a red dot while its notification count is above zero. */
export const hasNotification = (item: SidebarItemConfig, notifications: SidebarNotifications): boolean =>
  Boolean(item.notify) && Number(notifications[item.notify as string] ?? 0) > 0;

/** Applies role-based visibility; drops groups that end up empty. */
export const filterGroupsByRole = (groups: SidebarGroupConfig[], role?: string): SidebarGroupConfig[] =>
  groups
    .filter((group) => isVisibleForRole(group.roles, role))
    .map((group) => ({ ...group, items: group.items.filter((item) => isVisibleForRole(item.roles, role)) }))
    .filter((group) => group.items.length > 0);

/** The menu item (and its group) that represents the given view, if any. */
export const findItemForView = (
  groups: SidebarGroupConfig[],
  currentView: string
): { group: SidebarGroupConfig; item: SidebarItemConfig } | null => {
  for (const group of groups) {
    const item = group.items.find((i) => isItemActive(i, currentView));
    if (item) return { group, item };
  }
  return null;
};
