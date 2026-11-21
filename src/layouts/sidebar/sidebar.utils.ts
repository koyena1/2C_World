import type {
  SidebarBadgeConfig,
  SidebarBadgeTone,
  SidebarBadgeValues,
  SidebarGroupConfig,
  SidebarItemConfig,
} from './sidebar.types';

export interface ResolvedBadge {
  text: string;
  tone: SidebarBadgeTone;
  /** Show a dot on the icon in collapsed mode. */
  dot: boolean;
}

/** Roles: no `roles` list means visible to everyone. */
export const isVisibleForRole = (roles: string[] | undefined, role?: string): boolean =>
  !roles || roles.length === 0 || (role !== undefined && roles.includes(role));

export const isItemActive = (item: SidebarItemConfig, currentView: string): boolean =>
  (item.activeViews ?? [item.viewId]).includes(currentView);

export const resolveBadge = (
  badge: SidebarBadgeConfig | undefined,
  values: SidebarBadgeValues
): ResolvedBadge | null => {
  if (!badge) return null;
  if (badge.kind === 'text') return { text: badge.text, tone: badge.tone, dot: false };

  const raw = values[badge.key] ?? badge.fallback;
  if (raw === undefined || raw === '') return null;
  if (badge.hideWhenZero && Number(raw) === 0) return null;
  return { text: String(raw), tone: badge.tone, dot: Boolean(badge.dotWhenCollapsed) };
};

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
