/**
 * Sidebar CONTENT only: menu groups, items, labels, icons, routes, badges,
 * branding and the footer user per role. No styling here (see sidebar.styles.ts
 * and styles/sidebar.css).
 */
import {
  Calendar,
  CalendarCheck,
  CalendarClock,
  Contact,
  FileText,
  LayoutDashboard,
  LayoutGrid,
  LockKeyhole,
  Settings,
  ShieldCheck,
  UploadCloud,
  UserCheck,
  UserPlus,
  Users,
  Workflow,
} from 'lucide-react';
import type { SidebarBranding, SidebarGroupConfig, SidebarUser } from './sidebar.types';

export const SIDEBAR_STORAGE_KEY = '2coms_sidebar_collapsed';

/**
 * Where the collapse button lives while the sidebar is expanded:
 *  - 'beside-logo'   : always-visible button next to the logo/brand text (default)
 *  - 'on-logo-hover' : hidden; the logo turns into the button on hover
 * (When collapsed there is no room beside the logo, so the logo always turns into the expand button on hover.)
 */
export type SidebarToggleMode = 'beside-logo' | 'on-logo-hover';
export const SIDEBAR_TOGGLE_MODE: SidebarToggleMode = 'on-logo-hover';

export const SIDEBAR_BRANDING: SidebarBranding = {
  logoSrc: `${import.meta.env.BASE_URL}assets/2coms.png`,
  logoAlt: '2COMS',
  logoText: '2C',
  title: 'Talent Onboarding Suite',
  subtitle: 'Live Client Instances (7)',
  liveSubtitle: true,
  versionLabel: '2COMS Consulting · Connect HRMS v4.2',
};

export const SIDEBAR_GROUPS: SidebarGroupConfig[] = [
  {
    id: 'operations',
    title: 'Operations Console',
    icon: LayoutGrid,
    tag: 'HR Ops',
    defaultOpen: true,
    items: [
      {
        id: 'dashboard',
        label: 'Dashboard',
        viewId: 'dashboard',
        icon: LayoutDashboard,
        activeViews: ['dashboard', 'overview'],
        badge: { kind: 'text', text: 'Live', tone: 'live' },
      },
    ],
  },
  {
    id: 'pipeline',
    title: 'Candidate Pipeline',
    icon: Workflow,
    showCount: true,
    items: [
      {
        id: 'directory',
        label: 'Candidate Directory',
        viewId: 'directory',
        icon: Users,
        badge: { kind: 'dynamic', key: 'candidateCount', tone: 'count', fallback: 20 },
      },
      {
        id: 'offer-letters',
        label: 'Offer Letters',
        viewId: 'offer-letters',
        icon: FileText,
        badge: { kind: 'text', text: '16', tone: 'count' },
      },
      {
        id: 'invite',
        label: 'Invite Candidate',
        viewId: 'invite',
        icon: UserPlus,
        badge: { kind: 'text', text: 'Fast', tone: 'fast' },
      },
      {
        id: 'import',
        label: 'Bulk Excel Import',
        viewId: 'import',
        icon: UploadCloud,
        badge: { kind: 'text', text: 'XLSX', tone: 'tag-indigo' },
      },
      {
        id: 'kyc',
        label: 'KYC & ₹1 Verification',
        viewId: 'kyc',
        icon: ShieldCheck,
        badge: { kind: 'dynamic', key: 'pendingKyc', tone: 'alert', hideWhenZero: true, dotWhenCollapsed: true },
      },
    ],
  },
  {
    id: 'workforce',
    title: 'Workforce & Attendance',
    icon: CalendarClock,
    items: [
      {
        id: 'attendance',
        label: 'Attendance & Cycles',
        viewId: 'attendance',
        icon: CalendarCheck,
        badge: { kind: 'text', text: 'Muster', tone: 'tag-sky' },
      },
      {
        id: 'holidays',
        label: 'Holiday Masters',
        viewId: 'holidays',
        icon: Calendar,
        badge: { kind: 'text', text: 'Policy', tone: 'tag-amber' },
      },
    ],
  },
  {
    id: 'experience',
    title: 'Experience & 360',
    icon: Contact,
    items: [
      {
        id: 'profile',
        label: 'Candidate 360 Profile',
        viewId: 'profile',
        icon: UserCheck,
        badge: { kind: 'text', text: 'Read/Edit', tone: 'muted' },
      },
    ],
  },
  {
    id: 'governance',
    title: 'Governance & Security',
    icon: LockKeyhole,
    items: [
      {
        id: 'usersettings',
        label: 'User Settings',
        viewId: 'usersettings',
        icon: Settings,
        badge: { kind: 'text', text: 'RBAC', tone: 'tag-purple' },
      },
    ],
  },
];

/** Footer user card, keyed by the active role from the header persona switcher. */
export const SIDEBAR_USERS: Record<string, SidebarUser> = {
  admin: { name: 'Ananya (Ops Lead)', email: 'ananya.m@2coms.com', initials: 'OP', roleLabel: 'Admin' },
  candidate: { name: 'Priya Sharma (Candidate)', initials: 'CD', roleLabel: 'Candidate' },
  hr: { name: 'Vikram (Client HR)', initials: 'HR', roleLabel: 'HR' },
};

export const DEFAULT_SIDEBAR_USER_KEY = 'hr';
