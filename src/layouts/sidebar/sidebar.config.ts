/**
 * Sidebar CONTENT only: menu groups, items, labels, icons, routes, notification keys,
 * branding and the footer user per role. No styling here (see sidebar.styles.ts
 * and styles/sidebar.css).
 */
import {
  Calendar,
  CalendarCheck,
  FileSignature,
  FileText,
  GraduationCap,
  LifeBuoy,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  UploadCloud,
  UserCheck,
  UserPlus,
  Wallet,
  Scale,
  Users,
  Workflow,
} from 'lucide-react';
import { rolesForView } from '../../modules/hr-ops/hrOps.config';
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
    id: 'dashboard-menu',
    title: 'Dashboard',
    icon: LayoutDashboard,
    permanent: true,
    items: [
      {
        id: 'dashboard',
        label: 'Dashboard',
        viewId: 'dashboard',
        icon: LayoutDashboard,
        activeViews: ['dashboard', 'overview'],
      },
    ],
  },
  {
    id: 'pipeline',
    title: 'Candidate Pipeline',
    icon: Workflow,
    items: [
      {
        id: 'directory',
        label: 'Candidate Directory',
        viewId: 'directory',
        icon: Users,
        notify: 'directoryIssues',
      },
      {
        id: 'offer-letters',
        label: 'Offer Letters',
        viewId: 'offer-letters',
        icon: FileText,
        notify: 'pendingOffers',
      },
      {
        id: 'invite',
        label: 'Invite Candidate',
        viewId: 'invite',
        icon: UserPlus,
      },
      {
        id: 'import',
        label: 'Bulk Excel Import',
        viewId: 'import',
        icon: UploadCloud,
      },
      {
        id: 'kyc',
        label: 'KYC & ₹1 Verification',
        viewId: 'kyc',
        icon: ShieldCheck,
        notify: 'pendingKyc',
      },
    ],
  },
  {
    // Former parents (Workforce & Attendance, Experience & 360, Governance & Security) had only
    // children: they are now direct, headerless sidebar items.
    id: 'standalone',
    title: 'Menu',
    icon: Workflow,
    permanent: true,
    items: [
      {
        id: 'attendance',
        label: 'Attendance & Cycles',
        viewId: 'attendance',
        icon: CalendarCheck,
        notify: 'attendanceRegularization',
      },
      {
        id: 'holidays',
        label: 'Holiday Masters',
        viewId: 'holidays',
        icon: Calendar,
      },
      {
        id: 'contract-exit',
        label: 'Contract & Exit',
        viewId: 'contract-exit',
        icon: FileSignature,
        notify: 'contractExit',
        roles: rolesForView('contract-exit'),
      },
      {
        id: 'compliance',
        label: 'Compliance',
        viewId: 'compliance',
        icon: Scale,
        notify: 'compliance',
        roles: rolesForView('compliance'),
      },
      {
        id: 'payroll',
        label: 'Payroll',
        viewId: 'payroll',
        icon: Wallet,
        roles: rolesForView('payroll'),
      },
      {
        id: 'lms',
        label: 'LMS',
        viewId: 'lms',
        icon: GraduationCap,
        roles: rolesForView('lms'),
      },
      {
        id: 'support-ticket',
        label: 'Support Ticket',
        viewId: 'support-ticket',
        icon: LifeBuoy,
        roles: rolesForView('support-ticket'),
      },
      {
        id: 'profile',
        label: 'Candidate 360 Profile',
        viewId: 'profile',
        icon: UserCheck,
      },
      {
        id: 'usersettings',
        label: 'User Settings',
        viewId: 'usersettings',
        icon: Settings,
        roles: rolesForView('usersettings'),
      },
    ],
  },
];

/** Footer user card, keyed by the active role from the header persona switcher. */
export const SIDEBAR_USERS: Record<string, SidebarUser> = {
  admin: { name: 'Ananya (Ops Lead)', email: 'ananya.m@2coms.com', initials: 'OP', roleLabel: 'Admin' },
  candidate: { name: 'Priya Sharma (Candidate)', initials: 'CD', roleLabel: 'Candidate' },
  hr: { name: 'Vikram (Client HR)', initials: 'HR', roleLabel: 'HR' },
  hrbp: { name: 'HR Business Partner', initials: 'HB', roleLabel: 'HRBP' },
};

export const DEFAULT_SIDEBAR_USER_KEY = 'hr';
