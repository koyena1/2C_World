import React, { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown, Search } from 'lucide-react';
import { cn } from '../../utils/cn';

type NativeButtonProps = Omit<
  React.ButtonHTMLAttributes<HTMLButtonElement>,
  'value' | 'defaultValue' | 'onChange' | 'children' | 'type' | 'role'
>;

interface SelectMenuProps extends NativeButtonProps {
  /** Controlled value (like a native <select>). Omit and use `defaultValue` for uncontrolled use. */
  value?: string | number;
  defaultValue?: string | number;
  /** Same shape as a native <select> handler, so existing `(e) => e.target.value` code works unchanged. */
  onChange?: (e: { target: { value: string } }) => void;
  /** <option>, <optgroup> (and fragments of them), exactly like a native <select>. */
  children: React.ReactNode;
  /** Accepted for drop-in compatibility with <select>; not used. */
  required?: boolean;
}

interface Option {
  value: string;
  label: React.ReactNode;
  text: string;
  disabled: boolean;
  group?: string;
}

/** Plain text of a React node (for searching and for options without a `value`). */
const textOf = (node: React.ReactNode): string => {
  if (node === null || node === undefined || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(textOf).join('');
  if (React.isValidElement<{ children?: React.ReactNode }>(node)) return textOf(node.props.children);
  return '';
};

const collectOptions = (children: React.ReactNode, group?: string, out: Option[] = []): Option[] => {
  React.Children.toArray(children).forEach((child) => {
    if (!React.isValidElement<{ value?: string | number; label?: string; disabled?: boolean; children?: React.ReactNode }>(child)) return;
    if (child.type === React.Fragment) {
      collectOptions(child.props.children, group, out);
    } else if (child.type === 'optgroup') {
      collectOptions(child.props.children, child.props.label, out);
    } else if (child.type === 'option') {
      const text = textOf(child.props.children);
      out.push({
        value: child.props.value !== undefined ? String(child.props.value) : text,
        label: child.props.children,
        text,
        disabled: Boolean(child.props.disabled),
        group,
      });
    }
  });
  return out;
};

// Shared look & feel of the list. Change these once to restyle every dropdown in the app.
const PANEL_MAX_HEIGHT = 240; // px, search bar included
const PANEL_MIN_WIDTH = 176; // px
const MIN_ROOM_BELOW = 200; // px: below this, scroll the page a little instead of flipping upward
const GAP = 4;

/**
 * The one dropdown used across 2COMS Connect (drop-in replacement for a native <select>).
 *  - Search box pinned at the top; the options scroll underneath (max height {PANEL_MAX_HEIGHT}px).
 *  - Always opens below the field (never flips). If there is little room, the page scrolls slightly.
 *  - Rendered in a portal, so parent overflow / stacking contexts can't clip it.
 *  - Keyboard: Arrow keys, Home/End, Enter/Space, Escape, Tab; typing in the search box filters.
 */
export const SelectMenu: React.FC<SelectMenuProps> = ({
  value,
  defaultValue,
  onChange,
  children,
  className,
  disabled,
  required: _required,
  onClick,
  ...buttonProps
}) => {
  const options = useMemo(() => collectOptions(children), [children]);

  const [innerValue, setInnerValue] = useState(String(defaultValue ?? ""));
  const current = value !== undefined ? String(value) : innerValue;

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeValue, setActiveValue] = useState<string | null>(null);
  const [pos, setPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listId = useId();

  // Like a native select: no matching value -> show the first option.
  const displayed = options.find((o) => o.value === current) ?? options[0];

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? options.filter((o) => o.text.toLowerCase().includes(q)) : options;
  }, [options, query]);
  const selectable = useMemo(() => visible.filter((o) => !o.disabled), [visible]);

  const close = useCallback(() => setOpen(false), []);

  const measure = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const width = Math.max(r.width, PANEL_MIN_WIDTH);
    const left = Math.max(8, Math.min(r.left, window.innerWidth - width - 8));
    setPos({ top: r.bottom + GAP, left, width });
  }, []);

  const openMenu = () => {
    if (disabled) return;
    const el = triggerRef.current;
    if (el) {
      const room = window.innerHeight - el.getBoundingClientRect().bottom - GAP - 8;
      if (room < MIN_ROOM_BELOW) window.scrollBy({ top: MIN_ROOM_BELOW - room });
    }
    measure();
    setQuery('');
    setActiveValue(selectable.find((o) => o.value === current)?.value ?? options.find((o) => !o.disabled)?.value ?? null);
    setOpen(true);
  };

  // Stay anchored to the field (resize / any ancestor scroll) while open.
  useLayoutEffect(() => {
    if (!open) return;
    measure();
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [open, measure]);

  useEffect(() => {
    if (!open) return;
    searchRef.current?.focus({ preventScroll: true });
  }, [open]);

  // Close on outside press.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!triggerRef.current?.contains(t) && !panelRef.current?.contains(t)) close();
    };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [open, close]);

  // Keep the highlighted option in view.
  useEffect(() => {
    if (!open || activeValue === null) return;
    panelRef.current
      ?.querySelector<HTMLElement>(`[data-value="${CSS.escape(activeValue)}"]`)
      ?.scrollIntoView({ block: 'nearest' });
  }, [open, activeValue, visible]);

  // Typing narrows the list: keep the highlight on a visible option.
  useEffect(() => {
    if (!open) return;
    if (!selectable.some((o) => o.value === activeValue)) setActiveValue(selectable[0]?.value ?? null);
  }, [open, selectable, activeValue]);

  const choose = (opt: Option) => {
    if (opt.disabled) return;
    if (value === undefined) setInnerValue(opt.value);
    onChange?.({ target: { value: opt.value } });
    close();
    triggerRef.current?.focus();
  };

  const move = (delta: number | 'first' | 'last') => {
    if (selectable.length === 0) return;
    const idx = selectable.findIndex((o) => o.value === activeValue);
    const next =
      delta === 'first' ? 0 : delta === 'last' ? selectable.length - 1 : Math.min(selectable.length - 1, Math.max(0, idx + delta));
    setActiveValue(selectable[next].value);
  };

  const onTriggerKeyDown = (e: React.KeyboardEvent) => {
    if (disabled || open) return;
    if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
      e.preventDefault();
      openMenu();
    }
  };

  const onPanelKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        e.stopPropagation();
        close();
        triggerRef.current?.focus();
        break;
      case 'ArrowDown':
        e.preventDefault();
        move(1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        move(-1);
        break;
      case 'Home':
        if (!query) {
          e.preventDefault();
          move('first');
        }
        break;
      case 'End':
        if (!query) {
          e.preventDefault();
          move('last');
        }
        break;
      case 'Enter': {
        e.preventDefault();
        const opt = selectable.find((o) => o.value === activeValue);
        if (opt) choose(opt);
        break;
      }
      case 'Tab':
        close();
        break;
    }
  };

  let lastGroup: string | undefined;

  return (
    <>
      <button
        {...buttonProps}
        ref={triggerRef}
        type="button"
        role="combobox"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={open ? listId : undefined}
        disabled={disabled}
        onClick={(e) => {
          onClick?.(e);
          if (open) close();
          else openMenu();
        }}
        onKeyDown={onTriggerKeyDown}
        className={cn('flex items-center justify-between gap-2 text-left disabled:opacity-60 disabled:cursor-not-allowed', className)}
      >
        <span className="truncate">{displayed?.label ?? ''}</span>
        <ChevronDown className={cn('w-3.5 h-3.5 shrink-0 opacity-60 transition-transform', open && 'rotate-180')} />
      </button>

      {open &&
        pos &&
        createPortal(
          <div
            ref={panelRef}
            onKeyDown={onPanelKeyDown}
            // React portals bubble events to the React parent: keep clicks from reaching clickable cards / backdrops.
            onClick={(e) => e.stopPropagation()}
            style={{ position: 'fixed', top: pos.top, left: pos.left, width: pos.width, maxHeight: PANEL_MAX_HEIGHT }}
            className={cn(
              'cc-dropdown-panel dropdown-pop z-[1000] flex flex-col overflow-hidden text-xs normal-case font-normal tracking-normal',
              'bg-[color:var(--popover-bg)] text-[color:var(--popover-fg)]'
            )}
          >
            {/* Search stays pinned while the options scroll */}
            <div className="cc-dropdown-search-wrap shrink-0">
              <div className="cc-dropdown-search">
              <Search className="w-3.5 h-3.5 shrink-0 opacity-60" />
              <input
                ref={searchRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search…"
                aria-label="Search options"
                aria-controls={listId}
                autoComplete="off"
                className="w-full min-w-0 bg-transparent text-xs outline-none placeholder:opacity-60"
              />
              </div>
            </div>

            <ul id={listId} role="listbox" className="cc-dropdown-options flex-1 min-h-0 overflow-y-auto">
              {visible.length === 0 && <li className="px-2.5 py-3 text-center opacity-60">No matches</li>}
              {visible.map((o) => {
                const showGroup = o.group !== undefined && o.group !== lastGroup;
                lastGroup = o.group;
                const isSelected = o.value === current;
                return (
                  <React.Fragment key={`${o.group ?? ''}|${o.value}`}>
                    {showGroup && (
                      <li role="presentation" className="px-2.5 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider opacity-60">
                        {o.group}
                      </li>
                    )}
                    <li
                      data-value={o.value}
                      role="option"
                      aria-selected={isSelected}
                      aria-disabled={o.disabled || undefined}
                      onPointerEnter={() => !o.disabled && setActiveValue(o.value)}
                      onClick={() => choose(o)}
                      className={cn(
                        'flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg transition-colors',
                        o.disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer',
                        !o.disabled && o.value === activeValue && 'bg-[color:var(--cc-accent-soft)]',
                        isSelected && 'font-semibold text-[color:var(--cc-accent)]'
                      )}
                    >
                      <span className="truncate">{o.label}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                    </li>
                  </React.Fragment>
                );
              })}
            </ul>
          </div>,
          document.body
        )}
    </>
  );
};
