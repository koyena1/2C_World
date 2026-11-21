import React, { forwardRef } from 'react';
import { cn } from '../../utils/cn';

export type IconButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  /** Required: icon-only buttons need an accessible name. */
  'aria-label': string;
};

/**
 * Square 32px icon button used in the header (theme toggle, profile, …).
 * Colors for the icon itself come from the caller via `className` (e.g. text-slate-700 dark:text-amber-300).
 */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, type = 'button', children, ...rest }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn(
        'inline-flex items-center justify-center w-8 h-8 rounded-lg border transition-colors cursor-pointer',
        'bg-slate-100 border-slate-300 hover:bg-slate-200',
        'dark:bg-slate-900 dark:border-slate-750 dark:hover:bg-slate-800',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500',
        className
      )}
      {...rest}
    >
      {children}
    </button>
  )
);
IconButton.displayName = 'IconButton';
