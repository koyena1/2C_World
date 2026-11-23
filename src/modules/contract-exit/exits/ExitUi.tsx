import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../../utils/cn';
import type { ExitStatus, TransferClearance } from '../../../data/mockExitData';
import type { Tone } from '../../dashboard/command-center/types';

export const STATUS_TONE: Record<ExitStatus, Tone> = { Initiated: 'info', 'Notice period': 'violet', Clearance: 'warn', 'F&F': 'teal', Closed: 'good' };
export const TRANSFER_TONE: Record<TransferClearance, Tone> = { 'Not applicable': 'muted', 'Pending transfer closure': 'warn', Cleared: 'good' };

interface Props {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  /** 'drawer' slides in from the right; 'modal' is centred. */
  variant?: 'modal' | 'drawer';
  wide?: boolean;
}

/** Shared dialog / drawer shell built on the card tokens (works in light and dark mode). */
export const Overlay: React.FC<Props> = ({ title, subtitle, onClose, children, footer, variant = 'modal', wide }) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const drawer = variant === 'drawer';
  return (
    <div
      className={cn('fixed inset-0 z-50 flex bg-slate-950/60 animate-in fade-in duration-150', drawer ? 'justify-end' : 'items-center justify-center p-3 sm:p-4')}
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          'cc-card flex flex-col shadow-2xl overflow-hidden w-full',
          drawer ? 'h-full max-w-xl rounded-none sm:rounded-l-2xl' : cn('max-h-[92vh]', wide ? 'max-w-3xl' : 'max-w-lg')
        )}
      >
        <div className="flex items-start justify-between gap-3 p-4 border-b border-[color:var(--cc-divider)]">
          <div className="min-w-0">
            <h3 className="cc-title text-sm font-bold">{title}</h3>
            {subtitle && <p className="cc-muted text-xs mt-0.5">{subtitle}</p>}
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="cc-btn cc-btn-secondary !px-2 shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">{children}</div>
        {footer && <div className="p-3 sm:p-4 border-t border-[color:var(--cc-divider)] flex flex-wrap justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
};

export const ViewOnlyNote: React.FC = () => (
  <p className="cc-muted text-xs">View only: your role can see this screen but cannot create or change anything.</p>
);

export const formatKb = (kb: number): string => (kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${Math.round(kb)} KB`);

/** Validates a picked file against a document rule (formats + max MB). Returns an error sentence or null. */
export const checkFile = (name: string, sizeBytes: number, formats: string[], maxMb: number): string | null => {
  const ext = name.split('.').pop()?.toUpperCase() ?? '';
  const norm = ext === 'JPEG' ? 'JPG' : ext;
  if (!formats.includes(norm)) return `${name}: format .${ext.toLowerCase()} is not allowed (allowed: ${formats.join(', ')}).`;
  if (sizeBytes > maxMb * 1024 * 1024) return `${name}: ${(sizeBytes / 1048576).toFixed(1)} MB exceeds the ${maxMb} MB limit.`;
  return null;
};
