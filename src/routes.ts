/**
 * Browser URLs for the app's views. The app has no router library: `currentView` in App.tsx is the
 * source of truth and is mirrored to the address bar with the History API, so every page has its own
 * URL (refresh, back/forward and deep links all work). `invite` is a dialog and has no URL.
 */
export const VIEW_PATHS: Record<string, string> = {
  dashboard: '/',
  overview: '/',
  directory: '/candidate-directory',
  'offer-letters': '/offer-letters',
  import: '/bulk-import',
  kyc: '/kyc-verification',
  attendance: '/attendance',
  holidays: '/holiday-masters',
  'contract-exit': '/contract-exit',
  compliance: '/compliance',
  payroll: '/payroll',
  lms: '/lms',
  'support-ticket': '/support-ticket',
  profile: '/candidate-360',
  usersettings: '/user-settings',
};

const base = () => import.meta.env.BASE_URL.replace(/\/$/, '');

export const pathForView = (view: string): string | null => {
  const path = VIEW_PATHS[view];
  return path === undefined ? null : base() + path;
};

/** The view for a browser pathname; unknown paths fall back to the dashboard. */
export const viewFromPath = (pathname: string): string => {
  const rel = (pathname.startsWith(base()) ? pathname.slice(base().length) : pathname).replace(/\/+$/, '') || '/';
  const hit = Object.entries(VIEW_PATHS).find(([view, p]) => p === rel && view !== 'overview');
  return hit ? hit[0] : 'dashboard';
};
