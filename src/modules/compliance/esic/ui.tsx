import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../../utils/cn';

interface DialogProps {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  /** Tailwind max-width class for the panel. */
  widthClass?: string;
}

/** Modal used by the Compliance ESIC / Forms / Insurance tabs (same overlay pattern as the other dialogs). */
export const Dialog: React.FC<DialogProps> = ({ title, subtitle, onClose, children, footer, widthClass = 'max-w-2xl' }) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-label={title} className={cn('cc-card w-full flex flex-col max-h-[92vh] shadow-2xl', widthClass)}>
        <div className="flex items-start justify-between gap-3 p-4 sm:p-5 border-b" style={{ borderColor: 'var(--cc-divider)' }}>
          <div className="min-w-0">
            <h3 className="cc-title text-sm font-bold">{title}</h3>
            {subtitle && <p className="cc-muted text-[11px] mt-0.5">{subtitle}</p>}
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="cc-muted hover:opacity-70 p-1 -m-1 shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 min-h-0">{children}</div>
        {footer && (
          <div className="p-3 sm:p-4 border-t flex flex-wrap items-center justify-end gap-2" style={{ borderColor: 'var(--cc-divider)' }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

interface FieldProps {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}

/** Label + control + inline error. */
export const Field: React.FC<FieldProps> = ({ label, required, error, hint, className, children }) => (
  <div className={cn('min-w-0', className)}>
    <label className="cc-title block text-[11px] font-semibold mb-1">
      {label}
      {required && <span className="tone-bad" style={{ color: 'var(--tone)' }}> *</span>}
    </label>
    {children}
    {error ? (
      <p className="tone-bad text-[11px] mt-1" style={{ color: 'var(--tone)' }} role="alert">
        {error}
      </p>
    ) : (
      hint && <p className="cc-hint">{hint}</p>
    )}
  </div>
);

export const ViewOnlyNote: React.FC<{ text?: string }> = ({ text = 'View only: your role can see this data but not change it.' }) => (
  <p className="cc-muted text-[11px] rounded-lg px-3 py-2 border" style={{ borderColor: 'var(--cc-card-border)' }}>
    {text}
  </p>
);

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
/** 'yyyy-mm-dd' -> 'dd Mon yyyy' (no timezone maths, so it is stable). */
export const fmtDate = (iso?: string): string => {
  if (!iso) return '-';
  const [y, m, d] = iso.slice(0, 10).split('-');
  return `${d} ${MONTHS[Number(m) - 1] ?? ''} ${y}`;
};

export const fmtInr = (n: number): string => `Rs ${n.toLocaleString('en-IN')}`;

export const daysBetween = (fromIso: string, toIso: string): number =>
  Math.round((Date.parse(toIso) - Date.parse(fromIso)) / 86400000);
