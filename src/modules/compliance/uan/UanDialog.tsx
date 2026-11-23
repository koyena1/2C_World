import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../../utils/cn';

interface UanDialogProps {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  /** Right-aligned slide-over instead of a centred dialog. */
  drawer?: boolean;
  wide?: boolean;
}

/** Shared modal / drawer shell for the UAN & PF tabs (overlay, Escape to close, sticky header and footer). */
export const UanDialog: React.FC<UanDialogProps> = ({ title, subtitle, onClose, children, footer, drawer, wide }) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className={cn('fixed inset-0 z-50 flex bg-slate-950/60 backdrop-blur-xs', drawer ? 'justify-end' : 'items-center justify-center p-3 sm:p-4')}
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          'cc-card flex flex-col w-full shadow-2xl overflow-hidden',
          drawer ? 'h-full max-w-md rounded-none sm:rounded-l-2xl' : cn('max-h-[90vh] rounded-2xl', wide ? 'max-w-2xl' : 'max-w-lg')
        )}
      >
        <header className="flex items-start justify-between gap-3 p-4 sm:p-5 border-b" style={{ borderColor: 'var(--cc-divider)' }}>
          <div className="min-w-0">
            <h3 className="cc-title text-sm font-bold">{title}</h3>
            {subtitle && <p className="cc-muted text-xs mt-0.5">{subtitle}</p>}
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="cc-muted hover:opacity-70 p-1 -m-1 shrink-0">
            <X className="w-5 h-5" />
          </button>
        </header>
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4 text-xs">{children}</div>
        {footer && (
          <footer className="flex flex-wrap justify-end gap-2 p-4 border-t" style={{ borderColor: 'var(--cc-divider)' }}>
            {footer}
          </footer>
        )}
      </div>
    </div>
  );
};

export const ViewOnlyNote: React.FC = () => (
  <p className="cc-muted text-[11px] font-semibold inline-flex items-center gap-1.5">View only: your role can see these records but not change them.</p>
);
