import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface PageHeaderProps {
  /** Icon chip before the title. Omit when passing `leading`. */
  icon?: LucideIcon;
  /** Custom element before the title (e.g. an avatar); replaces the icon chip. */
  leading?: React.ReactNode;
  title: string;
  subtitle?: React.ReactNode;
  /** Small pill after the title. */
  badge?: React.ReactNode;
  /** Line above the title (e.g. a breadcrumb trail). */
  eyebrow?: React.ReactNode;
  /** Buttons on the right. */
  actions?: React.ReactNode;
}

/**
 * Header strip shared by every page (the same one the Dashboard uses):
 * icon chip + title + subtitle on the left, actions on the right.
 */
export const PageHeader: React.FC<PageHeaderProps> = ({ icon: Icon, leading, title, subtitle, badge, eyebrow, actions }) => (
  <div className="cc-topbar border-b py-3">
    <div className="cc-container flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div className="min-w-0">
        {eyebrow && <div className="mb-1.5 text-xs">{eyebrow}</div>}
        <div className="flex items-center gap-3 min-w-0">
          {leading ??
            (Icon && (
              <span className="cc-accent-chip w-9 h-9 rounded-xl flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4" />
              </span>
            ))}
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="cc-title text-lg font-bold tracking-tight leading-tight">{title}</h1>
              {badge}
            </div>
            {subtitle && <p className="cc-muted text-xs">{subtitle}</p>}
          </div>
        </div>
      </div>
      {actions && <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">{actions}</div>}
    </div>
  </div>
);
