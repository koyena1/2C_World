/**
 * Sidebar STYLING only: class-name maps. Sizes and colors come from the CSS
 * variables in styles/sidebar.css, so tweak those first; edit these maps to
 * change structure (borders, weights, shapes, badge looks).
 */
import type { SidebarBadgeTone } from './sidebar.types';

export const sidebarStyles = {
  /* ---- Shell ---- */
  root:
    'app-sidebar relative z-20 hidden lg:flex flex-col shrink-0 sticky top-0 self-start ' +
    'h-screen border-r border-[color:var(--sidebar-border)] text-[color:var(--sidebar-fg)]',
  /** Same sidebar rendered inside the mobile drawer (below md). */
  rootMobile:
    'app-sidebar relative flex flex-col h-full max-w-[85vw] border-r border-[color:var(--sidebar-border)] text-[color:var(--sidebar-fg)]',
  nav: 'flex-1 min-h-0 overflow-y-auto overflow-x-hidden',
  navExpanded: 'px-[var(--sidebar-padding-x)] py-[var(--sidebar-padding-y)] space-y-[var(--sidebar-group-gap)]',
  navCollapsed: 'py-[var(--sidebar-padding-y)] px-2 space-y-[var(--sidebar-gap)]',

  /* ---- Header ---- */
  header:
    'flex items-center shrink-0 h-[var(--sidebar-header-height)] border-b border-[color:var(--sidebar-border)]',
  headerExpanded: 'justify-start gap-3 px-[var(--sidebar-padding-x)]',
  headerCollapsed: 'justify-center',
  brand: 'flex items-center min-w-0',

  /* Logo <-> toggle swap: both layers share one slot and cross-fade on hover/focus */
  logoSlot:
    'group relative shrink-0 w-[var(--sidebar-logo-size)] h-[var(--sidebar-logo-size)]',
  logo:
    'absolute inset-0 rounded-lg overflow-hidden flex items-center justify-center font-bold text-sm shadow-sm ' +
    'bg-[color:var(--sidebar-logo-bg)] text-[color:var(--sidebar-logo-fg)] ' +
    'transition-all duration-200 ease-out group-hover:opacity-0 group-hover:scale-90 ' +
    'group-has-[:focus-visible]:opacity-0 group-has-[:focus-visible]:scale-90',
  logoStatic:
    'absolute inset-0 rounded-lg overflow-hidden flex items-center justify-center font-bold text-sm shadow-sm ' +
    'bg-[color:var(--sidebar-logo-bg)] text-[color:var(--sidebar-logo-fg)]',
  logoImage: 'w-full h-full object-contain select-none',
  /* Always-visible collapse button beside the logo (expanded sidebar) */
  toggleBeside:
    'ml-auto shrink-0 w-[var(--sidebar-toggle-size)] h-[var(--sidebar-toggle-size)] inline-flex items-center justify-center ' +
    'rounded-lg cursor-pointer border border-[color:var(--sidebar-pill-border)] bg-[color:var(--sidebar-pill-bg)] ' +
    'text-[color:var(--sidebar-fg)] transition-colors hover:bg-[color:var(--sidebar-hover-bg)] ' +
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white',
  toggle:
    'absolute inset-0 inline-flex items-center justify-center rounded-lg cursor-pointer shadow-sm ' +
    'bg-[color:var(--sidebar-toggle-bg)] text-[color:var(--sidebar-toggle-fg)] ' +
    'opacity-0 scale-90 transition-all duration-200 ease-out ' +
    'group-hover:opacity-100 group-hover:scale-100 group-has-[:focus-visible]:opacity-100 group-has-[:focus-visible]:scale-100 ' +
    'active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white',
  brandTitle: 'text-[13px] font-bold leading-tight truncate',
  brandSubtitle: 'flex items-center gap-1.5 text-[11px] leading-tight truncate text-[color:var(--sidebar-fg-muted)]',
  liveDot: 'w-1.5 h-1.5 rounded-full shrink-0 animate-pulse bg-[color:var(--sidebar-live-dot)]',

  /* ---- Group (expanded) ---- */
  group: 'space-y-[var(--sidebar-gap)]',
  groupHeader:
    'w-full flex items-center gap-2.5 h-[var(--sidebar-group-height)] px-3 rounded-[var(--sidebar-radius)] ' +
    'border border-[color:var(--sidebar-pill-border)] bg-[color:var(--sidebar-pill-bg)] ' +
    'text-[13px] font-semibold cursor-pointer transition-colors hover:bg-[color:var(--sidebar-hover-bg)] ' +
    'focus-visible:outline-2 focus-visible:outline-white',
  groupTag:
    'text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-white/15 text-white/90',
  groupCount: 'text-[11px] font-bold tabular-nums text-[color:var(--sidebar-fg-muted)]',
  groupChevron: 'w-4 h-4 shrink-0 text-[color:var(--sidebar-fg-muted)] transition-transform duration-200',
  groupBody: 'grid transition-[grid-template-rows] duration-200 ease-out',
  groupChildren:
    'ml-5 pl-3 mt-1 mb-1 border-l border-[color:var(--sidebar-guide-line)] space-y-[var(--sidebar-gap)]',

  /* ---- Item (expanded) ---- */
  item:
    'w-full flex items-center gap-2.5 h-[var(--sidebar-item-height)] px-2.5 rounded-[var(--sidebar-radius)] border text-[13px] ' +
    'cursor-pointer transition-colors focus-visible:outline-2 focus-visible:outline-white',
  itemActive:
    'border-[color:var(--sidebar-active-border)] bg-[color:var(--sidebar-active-bg)] font-semibold text-[color:var(--sidebar-fg)]',
  itemIdle:
    'border-transparent font-medium text-[color:var(--sidebar-fg-muted)] hover:bg-[color:var(--sidebar-hover-bg)] hover:text-[color:var(--sidebar-fg)]',
  itemIcon: 'w-[var(--sidebar-icon-size)] h-[var(--sidebar-icon-size)] shrink-0',
  itemLabel: 'flex-1 min-w-0 truncate text-left',

  /* ---- Item (collapsed, icon-only) ---- */
  collapsedItem:
    'relative w-full flex items-center justify-center h-[var(--sidebar-item-height-collapsed)] rounded-[var(--sidebar-radius)] ' +
    'cursor-pointer transition-colors focus-visible:outline-2 focus-visible:outline-white',
  collapsedItemActive: 'bg-[color:var(--sidebar-active-bg)] text-[color:var(--sidebar-fg)]',
  collapsedItemIdle:
    'text-[color:var(--sidebar-fg-muted)] hover:bg-[color:var(--sidebar-hover-bg)] hover:text-[color:var(--sidebar-fg)]',
  activeBar:
    'absolute left-0 top-1/2 -translate-y-1/2 h-6 w-[var(--sidebar-active-bar-width)] rounded-r-full bg-[color:var(--sidebar-active-bar)]',
  dot: 'absolute -top-1 -right-1 w-2 h-2 rounded-full ring-2 ring-[color:var(--sidebar-bg-from)] bg-[color:var(--sidebar-dot)]',
  collapsedDivider: 'my-2 border-t border-[color:var(--sidebar-border)]',

  /* ---- Tooltip ---- */
  tooltip:
    'fixed z-[60] -translate-y-1/2 pointer-events-none whitespace-nowrap rounded-md px-2.5 py-1.5 text-xs font-medium shadow-lg border border-white/15 ' +
    'bg-[color:var(--sidebar-tooltip-bg)] text-[color:var(--sidebar-tooltip-fg)]',
  tooltipDetail: 'ml-2 text-[10px] font-bold opacity-70',

  /* ---- Footer ---- */
  footer: 'shrink-0 border-t border-[color:var(--sidebar-border)]',
  footerExpanded: 'p-3 space-y-2',
  footerCollapsed: 'py-3 flex justify-center',
  userCard: 'flex items-center gap-2.5 min-w-0',
  avatar:
    'w-10 h-10 shrink-0 rounded-full flex items-center justify-center text-xs font-bold ' +
    'bg-[color:var(--sidebar-avatar-bg)] text-[color:var(--sidebar-avatar-fg)] ring-2 ring-white/30',
  userName: 'text-[13px] font-semibold leading-tight truncate',
  userEmail: 'text-[11px] leading-tight truncate text-[color:var(--sidebar-fg-muted)]',
  roleChip:
    'inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full border border-[color:var(--sidebar-pill-border)] ' +
    'bg-[color:var(--sidebar-pill-bg)] text-[10px] font-semibold',
  version: 'text-[10px] truncate text-[color:var(--sidebar-heading-fg)]',
} as const;

/** Badge looks (tuned for the navy background). */
export const BADGE_TONES: Record<SidebarBadgeTone, string> = {
  live: 'font-mono text-[10px] font-semibold px-1.5 py-0.5 rounded border border-white/25 bg-white/15 text-white',
  count: 'font-mono text-[11px] font-semibold px-1.5 py-0.5 rounded bg-white/15 text-white',
  fast: 'text-[10px] font-semibold text-emerald-300',
  alert: 'text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-400 text-slate-950',
  'tag-indigo': 'font-mono text-[10px] px-1.5 py-0.5 rounded bg-indigo-300/25 text-indigo-100',
  'tag-sky': 'text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-sky-300/25 text-sky-100',
  'tag-amber': 'text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-amber-300/25 text-amber-100',
  'tag-purple': 'text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-purple-300/25 text-purple-100',
  muted: 'text-[10px] text-white/60',
};
