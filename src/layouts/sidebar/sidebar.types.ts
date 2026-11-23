import type { LucideIcon } from 'lucide-react';

/** Live notification state: key -> number of pending / unresolved items (0 or missing = no dot). */
export type SidebarNotifications = Record<string, number | undefined>;

export interface SidebarItemConfig {
  id: string;
  label: string;
  /** View id passed to onNavigate (see App.tsx). */
  viewId: string;
  icon: LucideIcon;
  /** Views that highlight this item (defaults to [viewId]). */
  activeViews?: string[];
  /** Key in the notifications prop; the item shows a red dot while that value is above zero. */
  notify?: string;
  /** Visible only to these roles. Omit = visible to everyone. */
  roles?: string[];
}

export interface SidebarGroupConfig {
  id: string;
  title: string;
  icon: LucideIcon;
  items: SidebarItemConfig[];
  roles?: string[];
  /** Initial open state of a collapsible group. Default: false (collapsed). */
  defaultOpen?: boolean;
  /** Always visible, no heading: its items render directly (e.g. the Dashboard). */
  permanent?: boolean;
}

export interface SidebarBranding {
  /** Logo image URL (served from /public). */
  logoSrc?: string;
  logoAlt?: string;
  /** Fallback text for the logo tile when there is no image or it fails to load. */
  logoText: string;
  title: string;
  subtitle: string;
  /** Show a pulsing "live" dot before the subtitle. */
  liveSubtitle?: boolean;
  versionLabel: string;
}

export interface SidebarUser {
  name: string;
  email?: string;
  initials: string;
  roleLabel: string;
  /** Optional profile photo URL (shown in the profile dialog and footer button). */
  photoUrl?: string;
}
