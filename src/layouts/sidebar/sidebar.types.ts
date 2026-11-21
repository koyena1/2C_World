import type { LucideIcon } from 'lucide-react';

/** Visual style of a badge. Colors live in sidebar.styles.ts (BADGE_TONES). */
export type SidebarBadgeTone =
  | 'live'
  | 'count'
  | 'fast'
  | 'alert'
  | 'tag-indigo'
  | 'tag-sky'
  | 'tag-amber'
  | 'tag-purple'
  | 'muted';

export type SidebarBadgeConfig =
  /** Fixed text, e.g. "Live" or "XLSX". */
  | { kind: 'text'; text: string; tone: SidebarBadgeTone }
  /** Value looked up in the `badges` prop by `key` (e.g. candidate count). */
  | {
      kind: 'dynamic';
      key: string;
      tone: SidebarBadgeTone;
      fallback?: string | number;
      hideWhenZero?: boolean;
      /** Show a small dot on the icon when the sidebar is collapsed. */
      dotWhenCollapsed?: boolean;
    };

export interface SidebarItemConfig {
  id: string;
  label: string;
  /** View id passed to onNavigate (see App.tsx). */
  viewId: string;
  icon: LucideIcon;
  /** Views that highlight this item (defaults to [viewId]). */
  activeViews?: string[];
  badge?: SidebarBadgeConfig;
  /** Visible only to these roles. Omit = visible to everyone. */
  roles?: string[];
}

export interface SidebarGroupConfig {
  id: string;
  title: string;
  icon: LucideIcon;
  /** Small tag shown on the group header (e.g. "HR Ops"). */
  tag?: string;
  /** Show the number of items as a count chip on the group header. */
  showCount?: boolean;
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

export type SidebarBadgeValues = Record<string, number | string | undefined>;
