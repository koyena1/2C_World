import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { useClickOutside } from '../../hooks/useClickOutside';
import { cn } from '../../utils/cn';

export interface DropdownTriggerProps {
  ref: React.RefObject<HTMLButtonElement | null>;
  onClick: () => void;
  'aria-expanded': boolean;
  'aria-haspopup': 'true';
  'aria-controls': string;
}

interface DropdownProps {
  /** Render the trigger; spread `triggerProps` onto the button. */
  trigger: (triggerProps: DropdownTriggerProps, state: { open: boolean }) => React.ReactNode;
  /** Panel content. A function receives `close` (e.g. for menu items). */
  children: React.ReactNode | ((api: { close: () => void }) => React.ReactNode);
  /** Which edge of the trigger the panel lines up with. */
  align?: 'left' | 'right';
  /** Accessible name for the panel. */
  label: string;
  className?: string;
  panelClassName?: string;
}

/**
 * Small anchored popover. Closes on outside press, Escape, or via `close()`;
 * Escape returns focus to the trigger. Colors come from the --popover-* tokens.
 */
export const Dropdown: React.FC<DropdownProps> = ({
  trigger,
  children,
  align = 'right',
  label,
  className,
  panelClassName,
}) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  const close = useCallback(() => setOpen(false), []);
  useClickOutside(rootRef, close, open);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open]);

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      {trigger(
        {
          ref: triggerRef,
          onClick: () => setOpen((prev) => !prev),
          'aria-expanded': open,
          'aria-haspopup': 'true',
          'aria-controls': panelId,
        },
        { open }
      )}

      {open && (
        <div
          id={panelId}
          role="region"
          aria-label={label}
          className={cn(
            'dropdown-pop absolute top-full mt-2 z-40 min-w-[13rem] max-w-[calc(100vw-2rem)] rounded-xl border p-2',
            'bg-[color:var(--popover-bg)] text-[color:var(--popover-fg)] border-[color:var(--popover-border)]',
            'shadow-[var(--popover-shadow)]',
            align === 'right' ? 'right-0 origin-top-right' : 'left-0 origin-top-left',
            panelClassName
          )}
        >
          {typeof children === 'function' ? children({ close }) : children}
        </div>
      )}
    </div>
  );
};
