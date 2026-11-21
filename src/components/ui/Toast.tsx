import React from 'react';
import { CheckCircle2, X } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface ToastProps {
  message: string | null;
  /**
   * 'adaptive' follows the theme (white card in light mode, dark card in dark mode).
   * 'solid' is always a dark card.
   */
  variant?: 'adaptive' | 'solid';
  /** Border accent used in dark mode. */
  accent?: 'sky' | 'purple';
  /** When provided, renders a close button (and the roomier layout). */
  onClose?: () => void;
  className?: string;
}

const ACCENT_BORDER: Record<NonNullable<ToastProps['accent']>, string> = {
  sky: 'dark:border-sky-500/40',
  purple: 'dark:border-purple-500/40',
};

/** Fixed bottom-right confirmation toast. Colors come from CSS tokens (styles/tokens.css). */
export const Toast: React.FC<ToastProps> = ({
  message,
  variant = 'adaptive',
  accent = 'sky',
  onClose,
  className,
}) => {
  if (!message) return null;

  const closable = Boolean(onClose);

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'fixed z-50 rounded-lg shadow-xl flex items-center border text-xs',
        'animate-in fade-in duration-200',
        closable
          ? 'bottom-6 right-6 px-4 py-3 gap-3 slide-in-from-bottom-2'
          : 'bottom-5 right-5 px-4 py-2.5 gap-2',
        variant === 'adaptive'
          ? 'bg-[var(--toast-bg)] text-[var(--toast-fg)] border-[var(--toast-border)]'
          : cn('bg-[var(--toast-solid-bg)] text-[var(--toast-solid-fg)] border-transparent', ACCENT_BORDER[accent]),
        className
      )}
    >
      <CheckCircle2
        className={cn(
          'shrink-0',
          closable ? 'w-5 h-5' : 'w-4 h-4',
          variant === 'adaptive' ? 'text-emerald-500' : 'text-emerald-400'
        )}
      />
      <span className={cn(variant === 'adaptive' && 'font-medium')}>{message}</span>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Dismiss notification"
          className="p-0.5 rounded transition-colors opacity-70 hover:opacity-100"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};
