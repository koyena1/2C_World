import React from 'react';
import { X } from 'lucide-react';

/** Accessible on/off switch used by the HR-operations settings sections. */
export const Toggle: React.FC<{
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  disabled?: boolean;
}> = ({ checked, onChange, label, disabled }) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    disabled={disabled}
    onClick={() => onChange(!checked)}
    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
      checked ? 'bg-sky-600' : 'bg-slate-300 dark:bg-slate-600'
    }`}
  >
    <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
  </button>
);

/** Centered dialog (same overlay look as EditClientMappingModal). */
export const Dialog: React.FC<{
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: string;
}> = ({ title, subtitle, onClose, children, footer, maxWidth = 'max-w-lg' }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs" role="dialog" aria-modal="true" aria-label={title}>
    <div className={`cc-card w-full ${maxWidth} flex flex-col max-h-[90vh] overflow-hidden`}>
      <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="cc-title text-sm font-bold">{title}</h3>
          {subtitle && <p className="cc-muted text-[11px] mt-0.5">{subtitle}</p>}
        </div>
        <button type="button" onClick={onClose} aria-label="Close" className="cc-muted p-1 rounded">
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-3 text-xs">{children}</div>
      {footer && <div className="p-4 sm:px-5 border-t border-slate-200 dark:border-slate-800 flex flex-wrap justify-end gap-2">{footer}</div>}
    </div>
  </div>
);

export const ViewOnlyNote: React.FC = () => (
  <p className="cc-muted text-[11px] font-semibold">View only: only Admin can change these settings.</p>
);
